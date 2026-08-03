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
import { useSavedLocationsStore } from '../../stores/savedLocationsStore';
import {
  getPhotographyTimes, formatTime, getMoonPhase,
  getMilkyWayVisibility, getConstellationPosition, getSunPosition,
} from '../../services/astronomyService';
import { calculateGlowForecast } from '../../services/phenomenon/glow';
import { calculateRainbowProbability, calculateHaloProbability } from '../../services/phenomenon/halo';
import {
  Bg, Accent, TextColor, Spacing, Radius,
  FontSize, FontWeight, auroraAlpha, whiteAlpha,
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
  if (ms <= 0) return '进行中';
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getUVLevel(index) {
  const i = parseInt(index) || 0;
  if (i <= 2) return { label: '低', color: Accent.success };
  if (i <= 5) return { label: '中等', color: Accent.star };
  if (i <= 7) return { label: '高', color: '#FF9F0A' };
  if (i <= 10) return { label: '很高', color: Accent.danger };
  return { label: '极高', color: '#BF5AF2' };
}

function generateMockHourly(nowWeather, dailyForecast) {
  const baseTemp = parseInt(nowWeather?.temp) || 25;
  const conditions = [nowWeather?.text || '晴'];
  if (dailyForecast?.[0]?.textDay) conditions.push(dailyForecast[0].textDay);
  const hourly = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getTime() + i * 3600000);
    const hour = d.getHours();
    const offset = Math.sin(((hour - 5) / 24) * Math.PI * 2) * 4;
    hourly.push({ hour, temp: Math.round(baseTemp + offset), text: conditions[Math.floor(Math.random() * conditions.length)] });
  }
  return hourly;
}

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCity, setCurrentCity] = useState({ name: '北京', id: '101010100' });
  const [nowWeather, setNowWeather] = useState(null);
  const [dailyForecast, setDailyForecast] = useState([]);
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
      const [weather, forecast] = await Promise.all([
        qweatherService.getNowWeather(locationId),
        qweatherService.getDailyForecast(locationId),
      ]);
      setNowWeather(weather);
      setDailyForecast(forecast);
      setHourlyForecast(generateMockHourly(weather, forecast));
      setAqiData(generateMockAqi());
    } catch (error) {
      console.error('加载天气数据失败:', error);
      setLoadError(true);
      const mockWeather = qweatherService.generateMockNowWeather();
      const mockForecast = qweatherService.generateMockDailyForecast();
      setNowWeather(mockWeather);
      setDailyForecast(mockForecast);
      setHourlyForecast(generateMockHourly(mockWeather, mockForecast));
      setAqiData(generateMockAqi());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      const { lat, lng } = cityCoords.current;
      const photoTimes = getPhotographyTimes(new Date(), lat, lng);
      const fmt = (d) => formatTime(d);
      setAstronomyData({
        goldenHour: { start: fmt(photoTimes.goldenHourEvening.start), end: fmt(photoTimes.goldenHourEvening.end), startDate: photoTimes.goldenHourEvening.start },
        goldenHourMorning: { start: fmt(photoTimes.goldenHourMorning.start), end: fmt(photoTimes.goldenHourMorning.end) },
        blueHour: { start: fmt(photoTimes.blueHourEvening.start), end: fmt(photoTimes.blueHourEvening.end), startDate: photoTimes.blueHourEvening.start },
        blueHourMorning: { start: fmt(photoTimes.blueHourMorning.start), end: fmt(photoTimes.blueHourMorning.end) },
      });
    } catch {
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
        setGoldenCountdown(formatCountdown(ms));
      } catch { setGoldenCountdown('--'); }
    };
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [astronomyData]);

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
  const uv = getUVLevel(uvIndex);

  // ── 极光可见性判断 ──
  const auroraVisible = score >= 55 && parseInt(cloudCover) <= 60;
  const auroraProbability = Math.min(100, Math.round(score * 0.9));

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
              <Text style={styles.locationText}>{currentCity?.name || '北京'}</Text>
              <Ionicons name="chevron-down" size={14} color={TextColor.secondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.searchIconBtn} onPress={() => router.push('/city-list')}>
              <Ionicons name="search" size={20} color={TextColor.secondary} />
            </TouchableOpacity>
            <TextInput
              ref={searchInputRef}
              style={styles.hiddenSearchInput}
              placeholder="搜索城市"
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
              2. 核心卡片：极光可见性
          ═══════════════════════════════════════════ */}
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <Ionicons name={auroraVisible ? "checkmark-circle" : "close-circle"} size={20} color={auroraVisible ? Accent.success : Accent.danger} />
              <Text style={styles.heroTitle}>今晚能看到极光吗？</Text>
            </View>

            <View style={styles.heroMain}>
              <Text style={[styles.heroStatus, { color: auroraVisible ? Accent.aurora : TextColor.muted }]}>
                {auroraVisible ? '可见' : '不可见'}
              </Text>
              <View style={styles.heroSubRow}>
                <Text style={styles.heroSubText}>
                  KP 5 → {auroraVisible ? '可见' : '需更高指数'}
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
            <Text style={styles.probLabel}>极光概率 {auroraProbability}%</Text>

            {/* 关键指标 */}
            <View style={styles.heroMetrics}>
              <View style={styles.metricItem}>
                <Ionicons name="cloud-outline" size={16} color={TextColor.secondary} />
                <Text style={styles.metricValue}>{cloudCover}%</Text>
                <Text style={styles.metricLabel}>云量</Text>
              </View>
              <View style={styles.metricItem}>
                <Ionicons name="eye-outline" size={16} color={TextColor.secondary} />
                <Text style={styles.metricValue}>{visibility}km</Text>
                <Text style={styles.metricLabel}>能见度</Text>
              </View>
              <View style={styles.metricItem}>
                <Ionicons name="camera-outline" size={16} color={TextColor.secondary} />
                <Text style={styles.metricValue}>{score}</Text>
                <Text style={styles.metricLabel}>评分</Text>
              </View>
            </View>
          </View>

          {/* ═══════════════════════════════════════════
              3. 天气概览行
          ═══════════════════════════════════════════ */}
          <View style={styles.weatherOverview}>
            <View style={styles.weatherMain}>
              <Text style={styles.weatherTemp}>{temp}°</Text>
              <View style={styles.weatherCondition}>
                <Ionicons name="sunny-outline" size={18} color={getWeatherIconColor(nowWeather?.text)} />
                <Text style={styles.weatherText}>{nowWeather?.text || '晴间多云'}</Text>
              </View>
            </View>
            <View style={styles.weatherHiLo}>
              <Text style={styles.weatherHiLoText}>H:{todayHigh}°  L:{todayLow}°</Text>
              <Text style={styles.weatherFeels}>体感 {Math.round(parseInt(nowWeather?.feelsLike) || temp)}°</Text>
            </View>
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
                <Text style={[styles.infoCardTitle, { color: '#60A5FA' }]}>Blue Hour</Text>
              </View>
              <Text style={styles.infoCardTime}>
                {astronomyData?.blueHour?.start || '--'} - {astronomyData?.blueHour?.end || '--'}
              </Text>
              <View style={styles.countdownRow}>
                <Ionicons name="moon-outline" size={12} color="#60A5FA" />
                <Text style={[styles.countdownText, { color: '#60A5FA' }]}>日落后</Text>
              </View>
            </View>
          </View>

          {/* ═══════════════════════════════════════════
              5. 快速气象指标
          ═══════════════════════════════════════════ */}
          <View style={styles.quickMetricsCard}>
            <View style={styles.quickMetricsRow}>
              <QuickMetric icon="water-outline" label="湿度" value={`${nowWeather?.humidity || '--'}%`} />
              <QuickMetric icon="speedometer-outline" label="风速" value={`${nowWeather?.windScale || '--'}级`} />
              <QuickMetric icon="eye-outline" label="能见度" value={`${visibility}km`} />
              <QuickMetric icon="sunny-outline" label="紫外线" value={`UV ${uvIndex}`} color={uv.color} />
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
                  照度 {moonPhase?.illumination != null ? `${Math.round(moonPhase.illumination)}%` : '--'}
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
                  <Text style={styles.astroName}>银河</Text>
                  <View style={[styles.badge, { backgroundColor: milkyWay?.visible ? auroraAlpha(0.15) : 'rgba(255,68,68,0.15)' }]}>
                    <Text style={[styles.badgeText, { color: milkyWay?.visible ? Accent.aurora : Accent.danger }]}>
                      {milkyWay?.visible ? '可见' : '不可见'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.astroMeta}>
                  {milkyWay?.visible ? `观测质量 ${milkyWay.quality}` : milkyWay?.seasonFactor || '非观测季'}
                </Text>
              </View>
            </View>
          </View>

          {/* ═══════════════════════════════════════════
              7. 大气光学现象
          ═══════════════════════════════════════════ */}
          <View style={styles.phenomenonCard}>
            <Text style={styles.sectionTitle}>大气光学现象</Text>
            <PhenomenonRow
              icon="rainy-outline"
              name="彩虹概率"
              probability={0}
              meta="今日彩虹概率较低"
            />
            <PhenomenonRow
              icon="sunny-outline"
              name="日晕概率"
              probability={0}
              meta="今日晕现象概率较低"
            />
            {glowForecast && (
              <PhenomenonRow
                icon="partly-sunny-outline"
                name="霞光概率"
                probability={Math.max(glowForecast.sunriseGlow.probability, glowForecast.sunsetGlow.probability)}
                meta={`朝霞 ${glowForecast.sunriseGlow.probability}% · 晚霞 ${glowForecast.sunsetGlow.probability}%`}
              />
            )}
          </View>

          {/* ═══════════════════════════════════════════
              8. 地球仪（缩小版）
          ═══════════════════════════════════════════ */}
          <View style={styles.globeSection}>
            <Text style={styles.sectionTitle}>全球视角</Text>
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
