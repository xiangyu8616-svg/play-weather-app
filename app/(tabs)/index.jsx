import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, FlatList, useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import GlobeView from '../../components/globe/GlobeView';
import qweatherService from '../../services/weather/qweatherService';
import noaaService from '../../services/aurora/noaaService';
import { localizeCityName } from '../../services/weather/cityNames';
import { useSavedLocationsStore } from '../../stores/savedLocationsStore';
import { useI18n } from '../../services/i18n';
import { getWeatherIconName } from '../../services/weather/weatherIcons';
import {
  getPhotographyTimes, formatTime, getMoonPhase,
  getMilkyWayVisibility, getConstellationPosition, getSunPosition,
} from '../../services/astronomyService';
import { calculateGlowForecast } from '../../services/phenomenon/glow';
import { calculateRainbowProbability, calculateHaloProbability } from '../../services/phenomenon/halo';
import { computeShootingWindow } from '../../services/phenomenon/shootingWindow';
import { scheduleWindowReminder, getScheduledWindowReminder } from '../../services/reminderService';
import {
  Bg, Accent, TextColor, Spacing, Radius,
  FontSize, FontWeight, FontFamily, auroraAlpha, whiteAlpha,
  Shadow, HeroCardStyle, CardStyle, getWeatherBackground, getWeatherIconColor,
} from '../../styles/designTokens';

// ═══════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════

function calcPhotoScore(cloud, vis, humidity, windScale) {
  const c = parseInt(cloud) || 50;
  const v = parseInt(vis) || 10;
  const h = parseInt(humidity) || 60;
  const w = parseInt(windScale) || 3;
  const cloudScore = c >= 20 && c <= 60 ? 30 : c < 20 ? 15 : 10;
  const visScore = Math.min(v * 2.5, 35);
  const humidityScore = h >= 40 && h <= 70 ? 20 : h < 40 ? 12 : 8;
  const windScore = w <= 3 ? 15 : w <= 5 ? 10 : 5;
  return Math.min(cloudScore + visScore + humidityScore + windScore, 100);
}

function getScoreLabel(score) {
  if (score >= 85) return '绝佳';
  if (score >= 70) return '优秀';
  if (score >= 55) return '良好';
  if (score >= 40) return '一般';
  return '欠佳';
}

function formatCountdown(ms) {
  if (ms <= 0) return null; // 由调用处用 t('home.inProgress') 显示
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// 拍摄窗口质量等级 → 徽章颜色
const SHOOT_QUALITY_COLORS = {
  epic: '#FF6B35',
  excellent: Accent.star,
  good: Accent.aurora,
  fair: TextColor.secondary,
  poor: TextColor.muted,
};

function getUVLevel(index, lang = 'zh') {
  const en = lang === 'en';
  const i = parseInt(index) || 0;
  if (i <= 2) return { label: en ? 'Low' : '低', color: Accent.success };
  if (i <= 5) return { label: en ? 'Moderate' : '中等', color: Accent.star };
  if (i <= 7) return { label: en ? 'High' : '高', color: '#FF9F0A' };
  if (i <= 10) return { label: en ? 'Very High' : '很高', color: Accent.danger };
  return { label: en ? 'Extreme' : '极高', color: '#BF5AF2' };
}

// 天气文本 → Ionicons 图标名：已迁移至 services/weather/weatherIcons.js
// （icon code 优先，中英文本文本回退，本文件直接 import 使用）

function generateMockAqi() {
  const aqi = Math.floor(Math.random() * 80 + 20);
  let category = '优';
  if (aqi > 50) category = '良';
  if (aqi > 100) category = '轻度污染';
  if (aqi > 150) category = '中度污染';
  return { aqi, category, primary: 'PM2.5' };
}

// ═══════════════════════════════════════════
// 主页面
// ═══════════════════════════════════════════

export default function HomeScreen() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCity, setCurrentCity] = useState({ name: '北京', id: '101010100' });
  const [nowWeather, setNowWeather] = useState(null);
  const [dailyForecast, setDailyForecast] = useState([]);
  // 错误态：false=正常 | 'network'=加载失败（含无网络）| 'quota'=API 配额耗尽
  const [loadError, setLoadError] = useState(false);
  const searchInputRef = useRef(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // 从城市列表返回时读取选中的城市
  useFocusEffect(
    useCallback(() => {
      if (typeof global !== 'undefined' && global.__selectedCity) {
        const city = global.__selectedCity;
        global.__selectedCity = null;
        setCurrentCity(city);
        if (city.lat && city.lon) {
          cityCoords.current = { lat: parseFloat(city.lat), lng: parseFloat(city.lon) };
        }
        loadWeatherData(city.id);
      }
    }, [])
  );

  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [aqiData, setAqiData] = useState(null);
  const [astronomyData, setAstronomyData] = useState(null);
  const [goldenCountdown, setGoldenCountdown] = useState('--');
  const [kpData, setKpData] = useState(null);
  const [photoTimes, setPhotoTimes] = useState(null);
  // 提醒状态：null=未设置 | { fireDate }=已设置 | 'failed'=失败
  const [reminder, setReminder] = useState(null);

  const cityCoords = useRef({ lat: 39.9042, lng: 116.4074 });

  const { minTemp, maxTemp } = useMemo(() => {
    if (!dailyForecast || dailyForecast.length === 0) return { minTemp: 15, maxTemp: 35 };
    const lows = dailyForecast.map(d => parseInt(d.tempMin) || 0);
    const highs = dailyForecast.map(d => parseInt(d.tempMax) || 0);
    return { minTemp: Math.min(...lows), maxTemp: Math.max(...highs) };
  }, [dailyForecast]);

  const cloudCover = nowWeather?.cloud || '--';
  const visibility = nowWeather?.vis || '--';

  const photoScore = useMemo(() => {
    if (!nowWeather) return null;
    return calcPhotoScore(nowWeather.cloud, nowWeather.vis, nowWeather.humidity, nowWeather.windScale);
  }, [nowWeather]);

  // ── 天文数据 ──
  const moonPhase = useMemo(() => {
    try { return getMoonPhase(new Date()); } catch { return null; }
  }, []);

  const milkyWay = useMemo(() => {
    try { return getMilkyWayVisibility(new Date(), cityCoords.current.lat, cityCoords.current.lng); }
    catch { return null; }
  }, [currentCity]);

  const eveningConstellations = useMemo(() => {
    const names = ['猎户座', '大熊座', '天蝎座', '天鹅座', '仙后座', '天琴座'];
    try {
      return names
        .map(n => getConstellationPosition(new Date(), cityCoords.current.lat, cityCoords.current.lng, n))
        .filter(c => c.visible).slice(0, 3);
    } catch { return []; }
  }, [currentCity]);

  // ── 大气光学现象 ──
  const sunPos = useMemo(() => {
    try { return getSunPosition(new Date(), cityCoords.current.lat, cityCoords.current.lng); }
    catch { return { azimuth: Math.PI / 2, altitude: Math.PI / 4 }; }
  }, [currentCity]);

  const glowForecast = useMemo(() => {
    if (!nowWeather) return null;
    try {
      return calculateGlowForecast(new Date(), cityCoords.current.lat, cityCoords.current.lng, {
        cloudCover: parseInt(nowWeather.cloud) || 50,
        humidity: parseInt(nowWeather.humidity) || 60,
        visibility: parseInt(nowWeather.vis) || 10,
      });
    } catch { return null; }
  }, [nowWeather]);

  // ── 今日拍摄窗口（ROADMAP 1.8 差异化核心）──
  const shootWindow = useMemo(() => {
    if (!photoTimes || !glowForecast) return null;
    try {
      return computeShootingWindow({
        now: new Date(),
        photoTimes,
        glowForecast,
        visKm: parseInt(nowWeather?.vis) || null,
      });
    } catch { return null; }
  }, [photoTimes, glowForecast, nowWeather]);

  // 启动时恢复已设置的提醒状态
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fireDate = await getScheduledWindowReminder();
      if (!cancelled && fireDate && fireDate.getTime() > Date.now()) {
        setReminder({ fireDate });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleShootRemind = async () => {
    if (!shootWindow || reminder) return;
    const res = await scheduleWindowReminder({
      windowStart: shootWindow.windowStart,
      title: t('shoot.notifTitle'),
      body: t('shoot.notifBody', {
        start: formatTime(shootWindow.windowStart),
        p: shootWindow.probability,
      }),
    });
    setReminder(res.ok ? { fireDate: res.fireDate } : 'failed');
  };

  const shootSentenceKey = !shootWindow
    ? null
    : shootWindow.type === 'sunsetGlow'
      ? 'shoot.sentenceSunsetToday'
      : shootWindow.day === 'tomorrow'
        ? 'shoot.sentenceSunriseTomorrow'
        : 'shoot.sentenceSunriseToday';

  // ── 紫外线 ──
  const uvIndex = useMemo(() => {
    const dayUV = dailyForecast?.[0]?.uvIndex;
    if (dayUV != null) return parseInt(dayUV) || 0;
    const hour = new Date().getHours();
    const cloud = parseInt(nowWeather?.cloud) || 50;
    if (hour < 6 || hour > 18) return 0;
    const baseUV = Math.sin(((hour - 6) / 12) * Math.PI) * 12;
    return Math.round(Math.max(0, baseUV * (1 - cloud / 200)));
  }, [dailyForecast, nowWeather]);

  // ── 数据加载 ──
  const loadWeatherData = async (locationId) => {
    try {
      setLoadError(false);
      setIsLoading(true);
      const [weather, forecast, hourly, kp] = await Promise.all([
        qweatherService.getNowWeather(locationId),
        qweatherService.getDailyForecast(locationId),
        qweatherService.getHourlyForecast(locationId),
        noaaService.getKpForecast(), // 失败返回 null，不影响其他数据
      ]);
      setNowWeather(weather);
      setDailyForecast(forecast);
      setHourlyForecast(hourly);
      setKpData(kp);
      setAqiData(generateMockAqi());
      // 服务层内部回退 mock 时不抛错，这里显式检查配额标记
      if (qweatherService.wasQuotaExceeded()) setLoadError('quota');
    } catch (error) {
      console.error('加载天气数据失败:', error);
      setLoadError('network');
      const mockWeather = qweatherService.generateMockNowWeather();
      const mockForecast = qweatherService.generateMockDailyForecast();
      setNowWeather(mockWeather);
      setDailyForecast(mockForecast);
      setHourlyForecast(qweatherService.generateMockHourlyForecast());
      setAqiData(generateMockAqi());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      const { lat, lng } = cityCoords.current;
      const photoTimes = getPhotographyTimes(new Date(), lat, lng);
      setPhotoTimes(photoTimes);
      const fmt = (d) => formatTime(d);
      setAstronomyData({
        goldenHour: { start: fmt(photoTimes.goldenHourEvening.start), end: fmt(photoTimes.goldenHourEvening.end), startDate: photoTimes.goldenHourEvening.start },
        goldenHourMorning: { start: fmt(photoTimes.goldenHourMorning.start), end: fmt(photoTimes.goldenHourMorning.end) },
        blueHour: { start: fmt(photoTimes.blueHourEvening.start), end: fmt(photoTimes.blueHourEvening.end), startDate: photoTimes.blueHourEvening.start },
        blueHourMorning: { start: fmt(photoTimes.blueHourMorning.start), end: fmt(photoTimes.blueHourMorning.end) },
      });
    } catch {
      setPhotoTimes(null);
      setAstronomyData({
        goldenHour: { start: '17:30', end: '18:30', startDate: null },
        goldenHourMorning: { start: '05:30', end: '06:30' },
        blueHour: { start: '18:30', end: '19:00', startDate: null },
        blueHourMorning: { start: '04:45', end: '05:15' },
      });
    }
  }, [currentCity]);

  useEffect(() => {
    const tick = () => {
      if (!astronomyData?.goldenHour?.startDate) { setGoldenCountdown('--'); return; }
      try {
        const ms = astronomyData.goldenHour.startDate.getTime() - Date.now();
        setGoldenCountdown(formatCountdown(ms) ?? t('home.inProgress'));
      } catch { setGoldenCountdown('--'); }
    };
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [astronomyData, t]);

  // 首次加载：初始化收藏 store，有收藏时以默认收藏城市作为初始城市
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await useSavedLocationsStore.getState().init();
      if (cancelled) return;
      const locs = useSavedLocationsStore.getState().locations;
      const def = locs.find((l) => l.isDefault) || locs[0];
      if (def && def.id && def.id !== currentCity.id) {
        setCurrentCity({ name: def.name, id: def.id });
        if (def.lat && def.lon) {
          cityCoords.current = { lat: parseFloat(def.lat), lng: parseFloat(def.lon) };
        }
        loadWeatherData(def.id);
      } else {
        loadWeatherData(currentCity.id);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 语言切换/恢复后按新语言重新拉取（前端缓存按语言隔离，命中即瞬时）
  const prevLangRef = useRef(lang);
  useEffect(() => {
    if (prevLangRef.current !== lang) {
      prevLangRef.current = lang;
      loadWeatherData(currentCity.id);
    }
  }, [lang]);

  const handleSearch = async (query) => {
    router.push('/city-list');
  };

  const handleSelectCity = (city) => {
    // 已由 /city-list 页面处理
  };

  // ═══════════════════════════════════════════
  // 渲染数据准备
  // ═══════════════════════════════════════════

  const bgColors = useMemo(() => getWeatherBackground(nowWeather?.text, nowWeather?.code), [nowWeather?.text, nowWeather?.code]);
  const temp = Math.round(parseInt(nowWeather?.temp) || 25);
  const todayForecast = dailyForecast?.[0];
  const todayHigh = Math.round(parseInt(todayForecast?.tempMax) || 32);
  const todayLow = Math.round(parseInt(todayForecast?.tempMin) || 20);
  const score = photoScore || 0;
  const scoreLabel = getScoreLabel(score);
  const uv = getUVLevel(uvIndex, lang);

  // ── 极光可见性判断（1.6：接入 NOAA 真实 Kp）──
  // 纬度门槛：当前城市看到极光所需的最小 Kp
  const requiredKp = noaaService.requiredKpForLatitude(cityCoords.current.lat);
  const tonightKp = kpData?.tonightKpMax ?? null;
  const auroraVisible = tonightKp != null
    ? tonightKp >= requiredKp && parseInt(cloudCover) <= 60
    : score >= 55 && parseInt(cloudCover) <= 60; // 无 Kp 数据时回退旧逻辑
  // 概率合成：天气条件分占 50%，Kp 达标程度占 45%
  const auroraProbability = tonightKp != null
    ? Math.min(99, Math.max(1, Math.round(score * 0.5 + (tonightKp / requiredKp) * 45)))
    : Math.min(100, Math.round(score * 0.9));

  return (
    <LinearGradient colors={bgColors} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.container} edges={['top']}>

        {/* ── 搜索覆盖层（已废弃，搜索功能移至 /city-list）── */}
        {showSearchResults && false && (
          <View style={styles.searchOverlay}>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.searchResultRow} onPress={() => handleSelectCity(item)} activeOpacity={0.7}>
                  <Ionicons name="location-outline" size={18} color={TextColor.muted} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.searchResultName}>{item.name}</Text>
                    <Text style={styles.searchResultMeta}>{item.adm1} {item.adm2}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ═══════════════════════════════════════════
              1. 顶部定位栏
          ═══════════════════════════════════════════ */}
          <View style={styles.locationBar}>
            <TouchableOpacity style={styles.locationBtn} onPress={() => router.push('/city-list')}>
              <Ionicons name="location-sharp" size={16} color={Accent.aurora} />
              <Text style={styles.locationText}>{localizeCityName(currentCity?.name, lang) || t('home.defaultCity')}</Text>
              <Ionicons name="chevron-down" size={14} color={TextColor.secondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.searchIconBtn} onPress={() => router.push('/city-list')}>
              <Ionicons name="search" size={20} color={TextColor.secondary} />
            </TouchableOpacity>
            <TextInput
              ref={searchInputRef}
              style={styles.hiddenSearchInput}
              placeholder={t('cityList.searchPlaceholder')}
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => handleSearch(searchQuery)}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* ═══════════════════════════════════════════
              1.5 错误横幅（加载失败/配额耗尽，可重试）
          ═══════════════════════════════════════════ */}
          {!!loadError && (
            <View style={styles.errorBanner}>
              <Ionicons
                name={loadError === 'quota' ? 'speedometer-outline' : 'cloud-offline-outline'}
                size={16}
                color={Accent.danger}
              />
              <Text style={styles.errorBannerText} numberOfLines={2}>
                {loadError === 'quota' ? t('states.quotaExceeded') : t('states.loadFailed')}
              </Text>
              <TouchableOpacity
                style={styles.errorRetryBtn}
                onPress={() => loadWeatherData(currentCity.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.errorRetryText}>{t('states.retry')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ═══════════════════════════════════════════
              2. 核心卡片：极光可见性
          ═══════════════════════════════════════════ */}
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <Ionicons name={auroraVisible ? "checkmark-circle" : "close-circle"} size={20} color={auroraVisible ? Accent.success : Accent.danger} />
              <Text style={styles.heroTitle}>{t('home.heroTitle')}</Text>
            </View>

            <View style={styles.heroMain}>
              <Text style={[styles.heroStatus, { color: auroraVisible ? Accent.aurora : TextColor.muted }]}>
                {auroraVisible ? t('home.visible') : t('home.notVisible')}
              </Text>
              <View style={styles.heroSubRow}>
                <Text style={styles.heroSubText}>
                  {tonightKp != null
                    ? t('home.kpSubtitleLive', { kp: tonightKp, required: requiredKp })
                    : t('home.kpSubtitleFallback', { required: requiredKp, status: auroraVisible ? t('home.visible') : t('home.kpNeedHigher') })}
                </Text>
              </View>
            </View>

            {/* 概率条 */}
            <View style={styles.probBarBg}>
              <View style={[styles.probBarFill, {
                width: `${auroraProbability}%`,
                backgroundColor: auroraVisible ? Accent.aurora : TextColor.muted,
              }]} />
            </View>
            <Text style={styles.probLabel}>{t('home.probability', { p: auroraProbability })}</Text>

            {/* 关键指标 */}
            <View style={styles.heroMetrics}>
              <View style={styles.metricItem}>
                <Ionicons name="cloud-outline" size={16} color={TextColor.secondary} />
                <Text style={styles.metricValue}>{cloudCover}%</Text>
                <Text style={styles.metricLabel}>{t('home.metricCloud')}</Text>
              </View>
              <View style={styles.metricItem}>
                <Ionicons name="eye-outline" size={16} color={TextColor.secondary} />
                <Text style={styles.metricValue}>{visibility}km</Text>
                <Text style={styles.metricLabel}>{t('home.metricVis')}</Text>
              </View>
              <View style={styles.metricItem}>
                <Ionicons name="camera-outline" size={16} color={TextColor.secondary} />
                <Text style={styles.metricValue}>{score}</Text>
                <Text style={styles.metricLabel}>{t('home.metricScore')}</Text>
              </View>
            </View>
          </View>

          {/* ═══════════════════════════════════════════
              2.5 今日拍摄窗口（差异化核心，ROADMAP 1.8）
          ═══════════════════════════════════════════ */}
          {shootWindow && shootSentenceKey && (
            <View style={styles.shootCard}>
              <View style={styles.shootHeader}>
                <View style={styles.shootTitleRow}>
                  <Ionicons name="camera" size={16} color={Accent.star} />
                  <Text style={styles.shootTitle}>{t('shoot.title')}</Text>
                </View>
                <View style={[styles.shootQualityBadge, { backgroundColor: `${SHOOT_QUALITY_COLORS[shootWindow.quality]}26` }]}>
                  <Text style={[styles.shootQualityText, { color: SHOOT_QUALITY_COLORS[shootWindow.quality] }]}>
                    {t(`shoot.quality.${shootWindow.quality}`)}
                  </Text>
                </View>
              </View>
              <Text style={styles.shootSentence}>
                {t(shootSentenceKey, {
                  start: formatTime(shootWindow.windowStart),
                  end: formatTime(shootWindow.windowEnd),
                  p: shootWindow.probability,
                  vis: shootWindow.visKm ?? '--',
                })}
              </Text>
              <TouchableOpacity
                style={[
                  styles.shootRemindBtn,
                  reminder === 'failed' && styles.shootRemindBtnFailed,
                  reminder && reminder !== 'failed' && styles.shootRemindBtnDone,
                ]}
                onPress={handleShootRemind}
                disabled={!!reminder && reminder !== 'failed'}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={reminder === 'failed' ? 'alert-circle-outline' : reminder ? 'checkmark-circle' : 'notifications-outline'}
                  size={15}
                  color={reminder === 'failed' ? Accent.danger : reminder ? Accent.aurora : '#1A1206'}
                />
                <Text style={[
                  styles.shootRemindText,
                  reminder === 'failed' && { color: Accent.danger },
                  reminder && reminder !== 'failed' && { color: Accent.aurora },
                ]}>
                  {reminder === 'failed'
                    ? t('shoot.remindFailed')
                    : reminder
                      ? t('shoot.reminded', { time: formatTime(reminder.fireDate) })
                      : t('shoot.remind')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ═══════════════════════════════════════════
              3. 天气概览行
          ═══════════════════════════════════════════ */}
          <View style={styles.weatherOverview}>
            <View style={styles.weatherMain}>
              <Text style={styles.weatherTemp}>{temp}°</Text>
              <View style={styles.weatherCondition}>
                <Ionicons name={getWeatherIconName(nowWeather?.text, false, nowWeather?.icon)} size={18} color={getWeatherIconColor(nowWeather?.text)} />
                <Text style={styles.weatherText}>{nowWeather?.text || t('home.defaultCondition')}</Text>
              </View>
            </View>
            <View style={styles.weatherHiLo}>
              <Text style={styles.weatherHiLoText}>H:{todayHigh}°  L:{todayLow}°</Text>
              <Text style={styles.weatherFeels}>{t('home.feelsLike', { t: Math.round(parseInt(nowWeather?.feelsLike) || temp) })}</Text>
            </View>
          </View>

          {/* ═══════════════════════════════════════════
              3.5 逐小时预报（横向滚动）
          ═══════════════════════════════════════════ */}
          <View style={styles.hourlyCard}>
            <Text style={styles.sectionTitle}>{t('home.hourlyTitle')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hourlyRow}
            >
              {hourlyForecast.slice(0, 24).map((h, i) => (
                <HourlyItem key={h.fxTime || i} item={h} isNow={i === 0} />
              ))}
            </ScrollView>
          </View>

          {/* ═══════════════════════════════════════════
              4. 次级信息：黄金/蓝调时刻 + 摄影
          ═══════════════════════════════════════════ */}
          <View style={styles.infoGrid}>
            {/* 黄金时刻 */}
            <View style={[styles.infoCard, styles.goldenCard]}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="sunny" size={16} color={Accent.star} />
                <Text style={[styles.infoCardTitle, { color: Accent.star }]}>Golden Hour</Text>
              </View>
              <Text style={styles.infoCardTime}>
                {astronomyData?.goldenHour?.start || '--'} - {astronomyData?.goldenHour?.end || '--'}
              </Text>
              <View style={styles.countdownRow}>
                <Ionicons name="time-outline" size={12} color={Accent.star} />
                <Text style={[styles.countdownText, { color: Accent.star }]}>{goldenCountdown}</Text>
              </View>
            </View>

            {/* 蓝调时刻 */}
            <View style={[styles.infoCard, styles.blueCard]}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="moon" size={16} color="#60A5FA" />
                <Text style={[styles.infoCardTitle, { color: Accent.blueHour }]}>Blue Hour</Text>
              </View>
              <Text style={styles.infoCardTime}>
                {astronomyData?.blueHour?.start || '--'} - {astronomyData?.blueHour?.end || '--'}
              </Text>
              <View style={styles.countdownRow}>
                <Ionicons name="moon-outline" size={12} color="#60A5FA" />
                <Text style={[styles.countdownText, { color: Accent.blueHour }]}>{t('home.afterSunset')}</Text>
              </View>
            </View>
          </View>

          {/* ═══════════════════════════════════════════
              5. 快速气象指标
          ═══════════════════════════════════════════ */}
          <View style={styles.quickMetricsCard}>
            <View style={styles.quickMetricsRow}>
              <QuickMetric icon="water-outline" label={t('home.humidity')} value={`${nowWeather?.humidity || '--'}%`} />
              <QuickMetric icon="speedometer-outline" label={t('home.wind')} value={`${nowWeather?.windScale || '--'}${lang === 'zh' ? '级' : ''}`} />
              <QuickMetric icon="eye-outline" label={t('home.visibility')} value={`${visibility}km`} />
              <QuickMetric icon="sunny-outline" label={t('home.uv')} value={`UV ${uvIndex}`} color={uv.color} />
            </View>
          </View>

          {/* ═══════════════════════════════════════════
              6. 月相 & 银河
          ═══════════════════════════════════════════ */}
          <View style={styles.astroCard}>
            <View style={styles.astroRow}>
              <View style={styles.astroIconWrap}>
                <Ionicons name="moon" size={20} color={TextColor.secondary} />
              </View>
              <View style={styles.astroInfo}>
                <Text style={styles.astroName}>{moonPhase?.phaseName || '--'}</Text>
                <Text style={styles.astroMeta}>
                  {moonPhase?.illumination != null ? t('home.moonIllumination', { v: Math.round(moonPhase.illumination) }) : '--'}
                </Text>
              </View>
              <View style={styles.astroProgressBg}>
                <View style={[styles.astroProgressFill, { width: `${moonPhase?.illumination || 0}%` }]} />
              </View>
            </View>

            <View style={[styles.astroRow, { borderTopWidth: 0.5, borderTopColor: whiteAlpha(0.06), marginTop: 8 }]}>
              <View style={styles.astroIconWrap}>
                <Ionicons name="sparkles" size={20} color={milkyWay?.visible ? Accent.aurora : TextColor.muted} />
              </View>
              <View style={styles.astroInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.astroName}>{t('home.milkyWay')}</Text>
                  <View style={[styles.badge, { backgroundColor: milkyWay?.visible ? auroraAlpha(0.15) : 'rgba(255,68,68,0.15)' }]}>
                    <Text style={[styles.badgeText, { color: milkyWay?.visible ? Accent.aurora : Accent.danger }]}>
                      {milkyWay?.visible ? t('home.visible') : t('home.notVisible')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.astroMeta}>
                  {milkyWay?.visible ? t('home.mwQuality', { q: milkyWay.quality }) : milkyWay?.seasonFactor || t('home.mwOffSeason')}
                </Text>
              </View>
            </View>
          </View>

          {/* ═══════════════════════════════════════════
              7. 大气光学现象
          ═══════════════════════════════════════════ */}
          <View style={styles.phenomenonCard}>
            <Text style={styles.sectionTitle}>{t('home.opticsTitle')}</Text>
            <PhenomenonRow
              icon="rainy-outline"
              name={t('home.rainbow')}
              probability={0}
              meta={t('home.rainbowLow')}
            />
            <PhenomenonRow
              icon="sunny-outline"
              name={t('home.halo')}
              probability={0}
              meta={t('home.haloLow')}
            />
            {glowForecast && (
              <PhenomenonRow
                icon="partly-sunny-outline"
                name={t('home.glow')}
                probability={Math.max(glowForecast.sunriseGlow.probability, glowForecast.sunsetGlow.probability)}
                meta={t('home.glowMeta', { sunrise: glowForecast.sunriseGlow.probability, sunset: glowForecast.sunsetGlow.probability })}
              />
            )}
          </View>

          {/* ═══════════════════════════════════════════
              8. 地球仪（缩小版）
          ═══════════════════════════════════════════ */}
          <View style={styles.globeSection}>
            <Text style={styles.sectionTitle}>{t('home.globeTitle')}</Text>
            <View style={[styles.globeWrapper, { height: Math.min(screenHeight * 0.28, 280) }]}>
              <View style={styles.globeInner}>
                <GlobeView selectedDay={1} selectedPhenomenon="all" performanceMode="balanced" />
              </View>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ═══════════════════════════════════════════
// 子组件
// ═══════════════════════════════════════════

function QuickMetric({ icon, label, value, color = TextColor.primary }) {
  return (
    <View style={styles.quickMetricItem}>
      <Ionicons name={icon} size={18} color={TextColor.secondary} />
      <Text style={[styles.quickMetricValue, { color }]}>{value}</Text>
      <Text style={styles.quickMetricLabel}>{label}</Text>
    </View>
  );
}

function HourlyItem({ item, isNow }) {
  const { t } = useI18n();
  const d = item.fxTime ? new Date(item.fxTime) : null;
  const hour = d && !isNaN(d) ? d.getHours() : null;
  const hourLabel = isNow ? t('home.now') : hour != null ? t('home.hour', { h: hour }) : '--';
  const isNight = hour != null && (hour < 6 || hour >= 19);
  const pop = parseInt(item.pop) || 0;
  return (
    <View style={styles.hourlyItem}>
      <Text style={styles.hourlyHour}>{hourLabel}</Text>
      <Ionicons
        name={getWeatherIconName(item.text, isNight, item.icon)}
        size={18}
        color={getWeatherIconColor(item.text)}
      />
      <Text style={styles.hourlyTemp}>{Math.round(parseInt(item.temp) || 0)}°</Text>
      <Text style={[styles.hourlyPop, { opacity: pop >= 20 ? 1 : 0 }]}>💧{pop}%</Text>
    </View>
  );
}

function PhenomenonRow({ icon, name, probability, meta }) {
  const good = probability >= 40;
  return (
    <View style={styles.phenomenonRow}>
      <View style={styles.phenomenonIconWrap}>
        <Ionicons name={icon} size={20} color={TextColor.secondary} />
      </View>
      <View style={styles.phenomenonInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.phenomenonName}>{name}</Text>
          <Text style={[styles.phenomenonProb, { color: good ? Accent.success : TextColor.muted }]}>
            {probability}%
          </Text>
        </View>
        <View style={styles.phenomenonBarBg}>
          <View style={[styles.phenomenonBarFill, {
            width: `${probability}%`,
            backgroundColor: good ? auroraAlpha(0.5) : whiteAlpha(0.15),
          }]} />
        </View>
        <Text style={styles.phenomenonMeta}>{meta}</Text>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════
// 样式表
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  // ── 定位栏 ──
  locationBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 12,
    backgroundColor: 'rgba(18, 18, 26, 0.60)',
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: whiteAlpha(0.08),
  },
  locationText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    color: TextColor.primary,
  },
  searchIconBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: 'rgba(18, 18, 26, 0.60)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 0.5,
    borderColor: whiteAlpha(0.08),
  },

  // ── 核心卡片：极光可见性 ──
  heroCard: {
    ...HeroCardStyle,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  heroHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  heroTitle: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
    color: TextColor.primary,
  },
  heroMain: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  heroStatus: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.bold,
    letterSpacing: -1,
  },
  heroSubRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: Spacing.xs,
  },
  heroSubText: {
    fontSize: FontSize.body,
    color: TextColor.secondary,
  },
  probBarBg: {
    height: 6, borderRadius: 3,
    backgroundColor: whiteAlpha(0.08),
    marginBottom: Spacing.xs,
  },
  probBarFill: {
    height: 6, borderRadius: 3,
  },
  probLabel: {
    fontSize: FontSize.caption,
    color: TextColor.secondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  heroMetrics: {
    flexDirection: 'row', justifyContent: 'space-around',
    borderTopWidth: 0.5,
    borderTopColor: whiteAlpha(0.08),
    paddingTop: Spacing.md,
  },
  metricItem: {
    alignItems: 'center', gap: 4,
  },
  metricValue: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
    color: TextColor.primary,
  },
  metricLabel: {
    fontSize: FontSize.micro,
    color: TextColor.muted,
  },

  // ── 天气概览 ──
  weatherOverview: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(18, 18, 26, 0.40)',
    borderRadius: Radius.lg,
  },

  // ── 逐小时预报 ──
  hourlyCard: {
    ...CardStyle,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },

  // ── 错误横幅 ──
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.25)',
    borderRadius: Radius.md,
  },
  errorBannerText: {
    flex: 1,
    fontSize: FontSize.caption,
    color: TextColor.secondary,
  },
  errorRetryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
  },
  errorRetryText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semiBold,
    color: Accent.danger,
  },

  // ── 今日拍摄窗口 ──
  shootCard: {
    ...CardStyle,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.22)',
  },
  shootHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  shootTitleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  shootTitle: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
    color: TextColor.primary,
    letterSpacing: 0.3,
  },
  shootQualityBadge: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: Radius.full,
  },
  shootQualityText: {
    fontSize: FontSize.micro,
    fontWeight: FontWeight.semiBold,
  },
  shootSentence: {
    fontSize: FontSize.body,
    color: TextColor.primary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  shootRemindBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Accent.star,
    borderRadius: Radius.md,
    paddingVertical: 11,
  },
  shootRemindBtnDone: {
    backgroundColor: auroraAlpha(0.08),
    borderWidth: 1,
    borderColor: auroraAlpha(0.25),
  },
  shootRemindBtnFailed: {
    backgroundColor: 'rgba(255, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.25)',
  },
  shootRemindText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semiBold,
    color: '#1A1206',
  },
  hourlyRow: {
    gap: Spacing.md,
    paddingRight: Spacing.sm,
    marginTop: Spacing.sm,
  },
  hourlyItem: {
    alignItems: 'center', gap: 6, minWidth: 44,
  },
  hourlyHour: {
    fontSize: FontSize.micro,
    color: TextColor.muted,
  },
  hourlyTemp: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    color: TextColor.primary,
  },
  hourlyPop: {
    fontSize: FontSize.micro,
    color: Accent.blueHour,
  },
  weatherMain: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  weatherTemp: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.light,
    color: TextColor.primary,
    letterSpacing: -1,
  },
  weatherCondition: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  weatherText: {
    fontSize: FontSize.body,
    color: TextColor.primary,
    fontWeight: FontWeight.medium,
  },
  weatherHiLo: {
    alignItems: 'flex-end',
  },
  weatherHiLoText: {
    fontSize: FontSize.caption,
    color: TextColor.secondary,
    fontWeight: FontWeight.medium,
  },
  weatherFeels: {
    fontSize: FontSize.micro,
    color: TextColor.muted,
    marginTop: 2,
  },

  // ── 次级信息网格 ──
  infoGrid: {
    flexDirection: 'row', marginHorizontal: Spacing.lg, marginBottom: Spacing.md, gap: Spacing.sm,
  },
  infoCard: {
    flex: 1,
    backgroundColor: 'rgba(18, 18, 26, 0.60)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 0.5,
  },
  goldenCard: {
    borderColor: 'rgba(255, 215, 0, 0.15)',
  },
  blueCard: {
    borderColor: 'rgba(96, 165, 250, 0.15)',
  },
  infoCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8,
  },
  infoCardTitle: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  infoCardTime: {
    fontSize: FontSize.caption,
    color: TextColor.primary,
    fontWeight: FontWeight.semiBold,
    fontFamily: FontFamily.mono,
  },
  countdownRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6,
  },
  countdownText: {
    fontSize: FontSize.micro,
    fontWeight: FontWeight.medium,
  },

  // ── 快速气象指标 ──
  quickMetricsCard: {
    ...CardStyle,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  quickMetricsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
  },
  quickMetricItem: {
    alignItems: 'center', gap: 4,
  },
  quickMetricValue: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
  },
  quickMetricLabel: {
    fontSize: FontSize.micro,
    color: TextColor.muted,
  },

  // ── 天文卡片 ──
  astroCard: {
    ...CardStyle,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  astroRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  astroIconWrap: {
    width: 40, height: 40, borderRadius: Radius.sm,
    backgroundColor: whiteAlpha(0.06),
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  astroInfo: { flex: 1 },
  astroName: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    color: TextColor.primary,
  },
  astroMeta: {
    fontSize: FontSize.caption,
    color: TextColor.muted,
    marginTop: 2,
  },
  astroProgressBg: {
    width: 48, height: 4, borderRadius: 2,
    backgroundColor: whiteAlpha(0.1),
  },
  astroProgressFill: {
    height: 4, borderRadius: 2,
    backgroundColor: Accent.star,
  },
  badge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.sm,
  },
  badgeText: {
    fontSize: FontSize.micro,
    fontWeight: FontWeight.semiBold,
  },

  // ── 大气光学现象 ──
  phenomenonCard: {
    ...CardStyle,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
    color: TextColor.primary,
    marginBottom: Spacing.md,
    letterSpacing: 0.3,
  },
  phenomenonRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: whiteAlpha(0.06),
  },
  phenomenonIconWrap: {
    width: 40, height: 40, borderRadius: Radius.sm,
    backgroundColor: whiteAlpha(0.06),
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  phenomenonInfo: { flex: 1 },
  phenomenonName: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    color: TextColor.primary,
  },
  phenomenonProb: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
  },
  phenomenonBarBg: {
    height: 4, borderRadius: 2,
    backgroundColor: whiteAlpha(0.08),
    marginTop: 8, marginBottom: 4,
  },
  phenomenonBarFill: {
    height: 4, borderRadius: 2,
  },
  phenomenonMeta: {
    fontSize: FontSize.caption,
    color: TextColor.muted,
    marginTop: 2,
  },

  // ── 地球仪 ──
  globeSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  globeWrapper: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: auroraAlpha(0.15),
    ...Shadow.auroraBorder,
  },
  globeInner: {
    flex: 1,
    backgroundColor: '#0B0B10',
  },

  // ── 搜索 ──
  searchOverlay: {
    position: 'absolute', top: 60, left: Spacing.lg, right: Spacing.lg,
    zIndex: 100, backgroundColor: Bg.card,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: whiteAlpha(0.1),
    maxHeight: 300, overflow: 'hidden',
  },
  searchResultRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: whiteAlpha(0.05),
  },
  searchResultName: { color: TextColor.primary, fontSize: FontSize.body, fontWeight: FontWeight.medium },
  searchResultMeta: { color: TextColor.muted, fontSize: FontSize.caption },
  hiddenSearchInput: {
    position: 'absolute', top: -999, left: -999, width: 1, height: 1, opacity: 0,
  },
});
