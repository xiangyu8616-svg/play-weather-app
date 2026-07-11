import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, FlatList, useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import GlobeView from '../../components/globe/GlobeView.web';
import qweatherService from '../../services/weather/qweatherService';
import {
  getPhotographyTimes, formatTime, getMoonPhase,
  getMilkyWayVisibility, getConstellationPosition, getSunPosition,
} from '../../services/astronomyService';
import { calculateGlowForecast } from '../../services/phenomenon/glow';
import { calculateRainbowProbability, calculateHaloProbability } from '../../services/phenomenon/halo';
import {
  Brand, Accent, Surface, TextColor, Spacing, Radius,
  FontSize, FontWeight, goldAlpha, whiteAlpha, skyBlueAlpha,
  Shadow, GlassCardStyle,
} from '../../styles/designTokens';

// ==================== 辅助函数 ====================

function getWeatherEmoji(text) {
  if (!text) return '🌤';
  const lower = text.toLowerCase();
  if (lower.includes('晴')) return '☀️';
  if (lower.includes('多云')) return '⛅';
  if (lower.includes('阴')) return '☁️';
  if (lower.includes('雨')) return '🌧';
  if (lower.includes('雪')) return '❄️';
  if (lower.includes('雾')) return '🌫';
  return '🌤';
}

function getWeatherBackground(text, code) {
  const c = parseInt(code) || 0;
  const t = (text || '').toLowerCase();
  if (c === 100 || t.includes('晴')) return ['#0A0E17', '#12182A', '#1A2238'];
  if (c >= 101 && c <= 104) return ['#0A0E17', '#12182A', '#1A2238'];
  if (c >= 150 && c <= 154) return ['#0A0E17', '#12182A', '#1A2238'];
  if (c >= 319 && c <= 399) return ['#0A0E17', '#0F1A2E', '#142840'];
  if (c >= 300 && c <= 318 || t.includes('雨')) return ['#0A0E17', '#0F1A2E', '#142840'];
  if (c >= 400 && c <= 499 || t.includes('雪')) return ['#0A0E17', '#12182A', '#1E2A45'];
  if (c >= 500 && c <= 515 || t.includes('雾') || t.includes('霾')) return ['#0A0E17', '#12182A', '#1A2238'];
  return ['#0A0E17', '#12182A', '#1A2238'];
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
    hourly.push({
      hour,
      temp: Math.round(baseTemp + offset),
      text: conditions[Math.floor(Math.random() * conditions.length)],
    });
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

function calcPhotoScore(cloud, vis, humidity, windScale) {
  const c = parseInt(cloud) || 50;
  const v = parseInt(vis) || 10;
  const h = parseInt(humidity) || 60;
  const w = parseInt(windScale) || 3;

  const cloudScore = c >= 20 && c <= 60 ? 30 : c < 20 ? 15 : 10;
  const visScore = Math.min(v * 2.5, 35);
  const humidityScore = h >= 40 && h <= 70 ? 20 : h < 40 ? 12 : 8;
  const windScore = w <= 3 ? 15 : w <= 5 ? 10 : 5;

  const hour = new Date().getHours();
  const timeScore = (hour >= 5 && hour <= 8) || (hour >= 16 && hour <= 19) ? 0 : 0;

  return Math.min(cloudScore + visScore + humidityScore + windScore, 100);
}

function getScoreLabel(score) {
  if (score >= 85) return '绝佳';
  if (score >= 70) return '优秀';
  if (score >= 55) return '良好';
  if (score >= 40) return '一般';
  return '欠佳';
}

function getScoreColor(score) {
  if (score >= 85) return Brand.Gold;
  if (score >= 70) return Accent.SuccessGreen;
  if (score >= 55) return Accent.SkyBlue;
  if (score >= 40) return Accent.SunsetOrange;
  return '#EF4444';
}

function formatCountdown(ms) {
  if (ms <= 0) return '进行中';
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getMoonEmoji(phaseName) {
  const map = {
    '新月': '🌑', '蛾眉月': '🌒', '上弦月': '🌓',
    '盈凸月': '🌔', '满月': '🌕', '亏凸月': '🌖',
    '下弦月': '🌗', '残月': '🌘',
  };
  return map[phaseName] || '🌑';
}

function getUVLevel(index) {
  const i = parseInt(index) || 0;
  if (i <= 2) return { label: '低', color: '#30D158' };
  if (i <= 5) return { label: '中等', color: '#FFD60A' };
  if (i <= 7) return { label: '高', color: '#FF9F0A' };
  if (i <= 10) return { label: '很高', color: '#FF375F' };
  return { label: '极高', color: '#BF5AF2' };
}

// ==================== 页面组件 ====================

export default function HomeScreen() {
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
    return calcPhotoScore(
      nowWeather.cloud, nowWeather.vis,
      nowWeather.humidity, nowWeather.windScale,
    );
  }, [nowWeather]);

  // ── 天文数据 ──────────────────────────
  const moonPhase = useMemo(() => {
    try { return getMoonPhase(new Date()); }
    catch { return null; }
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
        .filter(c => c.visible)
        .slice(0, 3);
    } catch { return []; }
  }, [currentCity]);

  // ── 大气光学现象 ──────────────────────
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

  const rainbowProb = useMemo(() => {
    try {
      const sunAltDeg = (sunPos.altitude * 180) / Math.PI;
      const sunAzDeg = ((sunPos.azimuth * 180) / Math.PI + 360) % 360;
      return calculateRainbowProbability({
        precipitation1h: parseFloat(nowWeather?.precip) || 0,
        precipitationNow: parseFloat(nowWeather?.precip) || 0,
        sunAltitude: sunAltDeg,
        sunAzimuth: sunAzDeg,
        cloudCover: parseInt(nowWeather?.cloud) || 50,
      });
    } catch { return { probability: 0, direction: '--', type: '单彩虹' }; }
  }, [nowWeather, sunPos]);

  const haloProb = useMemo(() => {
    try {
      return calculateHaloProbability({
        cirrusCloud: (parseInt(nowWeather?.cloud) || 0) >= 20 && (parseInt(nowWeather?.cloud) || 0) <= 70,
        cloudCover: parseInt(nowWeather?.cloud) || 50,
        celestial: '太阳',
      });
    } catch { return { probability: 0, type: '22°晕' }; }
  }, [nowWeather]);

  // ── 紫外线 ────────────────────────────
  const uvIndex = useMemo(() => {
    const dayUV = dailyForecast?.[0]?.uvIndex;
    if (dayUV != null) return parseInt(dayUV) || 0;
    const hour = new Date().getHours();
    const cloud = parseInt(nowWeather?.cloud) || 50;
    if (hour < 6 || hour > 18) return 0;
    const baseUV = Math.sin(((hour - 6) / 12) * Math.PI) * 12;
    return Math.round(Math.max(0, baseUV * (1 - cloud / 200)));
  }, [dailyForecast, nowWeather]);

  // ── 数据加载 ──────────────────────────
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
        goldenHour: {
          start: fmt(photoTimes.goldenHourEvening.start),
          end: fmt(photoTimes.goldenHourEvening.end),
          startDate: photoTimes.goldenHourEvening.start,
        },
        goldenHourMorning: {
          start: fmt(photoTimes.goldenHourMorning.start),
          end: fmt(photoTimes.goldenHourMorning.end),
        },
        blueHour: {
          start: fmt(photoTimes.blueHourEvening.start),
          end: fmt(photoTimes.blueHourEvening.end),
          startDate: photoTimes.blueHourEvening.start,
        },
        blueHourMorning: {
          start: fmt(photoTimes.blueHourMorning.start),
          end: fmt(photoTimes.blueHourMorning.end),
        },
      });
    } catch (err) {
      console.warn('天文数据计算失败，使用默认值:', err);
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
      if (!astronomyData?.goldenHour?.startDate) {
        setGoldenCountdown('--');
        return;
      }
      try {
        const ms = astronomyData.goldenHour.startDate.getTime() - Date.now();
        setGoldenCountdown(formatCountdown(ms));
      } catch {
        setGoldenCountdown('--');
      }
    };
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [astronomyData]);

  useEffect(() => {
    loadWeatherData(currentCity.id);
  }, []);

  const handleSearch = async (query) => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    try {
      setIsLoading(true);
      const cities = await qweatherService.searchCity(query, 5);
      setSearchResults(cities);
      setShowSearchResults(true);
    } catch (error) {
      console.error('搜索城市失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCity = (city) => {
    setCurrentCity(city);
    setShowSearchResults(false);
    setSearchQuery('');
    if (city.lat && city.lon) {
      cityCoords.current = { lat: parseFloat(city.lat), lng: parseFloat(city.lon) };
    }
    loadWeatherData(city.id);
  };

  const bgColors = useMemo(
    () => getWeatherBackground(nowWeather?.text, nowWeather?.code),
    [nowWeather?.text, nowWeather?.code],
  );

  const globeHeight = Math.min(screenHeight * 0.38, 420);
  const score = photoScore || 0;
  const scoreColor = getScoreColor(score);
  const temp = Math.round(parseInt(nowWeather?.temp) || 25);
  const todayForecast = dailyForecast?.[0];
  const todayHigh = Math.round(parseInt(todayForecast?.tempMax) || 32);
  const todayLow = Math.round(parseInt(todayForecast?.tempMin) || 20);
  const tempRange = (maxTemp - minTemp) || 1;

  return (
    <LinearGradient colors={bgColors} style={{ flex: 1 }} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* ── 加载状态 ── */}
        {isLoading && !nowWeather && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingEmoji}>⏳</Text>
            <Text style={styles.loadingText}>加载天气数据...</Text>
          </View>
        )}

        {/* ── 错误状态 ── */}
        {loadError && !isLoading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorText}>天气数据加载失败</Text>
            <Text style={styles.errorHint}>已使用本地缓存数据</Text>
            <TouchableOpacity
              onPress={() => loadWeatherData(currentCity.id)}
              style={styles.retryButton}
              activeOpacity={0.7}
            >
              <Text style={styles.retryText}>重试</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── 搜索覆盖层 ── */}
          {showSearchResults && searchResults.length > 0 && (
            <View style={styles.searchOverlay}>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.searchResultRow}
                    onPress={() => handleSelectCity(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="location-outline" size={18} color={TextColor.Tertiary} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={styles.searchResultName}>{item.name}</Text>
                      <Text style={styles.searchResultMeta}>
                        {item.adm1} {item.adm2}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* ═══════════════════════════════════════════
              1. 地球仪区域
          ═══════════════════════════════════════════ */}
          <View style={[styles.globeWrapper, { height: globeHeight }]}>
            {/* 金色边框光晕 */}
            <View style={styles.globeBorderGlow} />
            {/* 3D 地球仪 */}
            <View style={styles.globeInner}>
              <GlobeView
                selectedDay={1}
                selectedPhenomenon="all"
                performanceMode="balanced"
              />
            </View>
            {/* 毛玻璃状态栏覆盖层 */}
            <View style={styles.globeOverlay}>
              <View style={styles.globeOverlayBlur}>
                <View style={styles.globeCityRow}>
                  <Ionicons name="location-sharp" size={14} color={Brand.Gold} />
                  <Text style={styles.globeCityName}>{currentCity?.name || '北京'}</Text>
                  <TouchableOpacity
                    onPress={() => searchInputRef.current?.focus()}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.globeSearchBtn}
                  >
                    <Ionicons name="search" size={16} color={TextColor.Secondary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.globeTemp}>{temp}°</Text>
                <View style={styles.globeConditionRow}>
                  <Text style={styles.globeWeatherEmoji}>{getWeatherEmoji(nowWeather?.text)}</Text>
                  <Text style={styles.globeConditionText}>{nowWeather?.text || '晴间多云'}</Text>
                </View>
                <View style={styles.globeHiLoRow}>
                  <Text style={styles.globeHiLo}>H:{todayHigh}°</Text>
                  <Text style={styles.globeHiLoDivider}>|</Text>
                  <Text style={styles.globeHiLo}>L:{todayLow}°</Text>
                  <Text style={styles.globeHiLoDivider}>|</Text>
                  <Text style={styles.globeFeelsLike}>体感 {Math.round(parseInt(nowWeather?.feelsLike) || temp)}°</Text>
                </View>
              </View>
            </View>
            {/* 隐藏搜索输入框 */}
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
              2. 摄影条件综合评分
          ═══════════════════════════════════════════ */}
          <View style={[styles.glassCard, styles.scoreCard]}>
            <View style={styles.scoreHeader}>
              <Text style={styles.scoreIcon}>📷</Text>
              <Text style={styles.scoreTitle}>摄影综合评分</Text>
            </View>
            <View style={styles.scoreBody}>
              <Text style={[styles.scoreNumber, { color: scoreColor }]}>{score}</Text>
              <View style={styles.scoreLabelWrap}>
                <Text style={[styles.scoreLabelText, { color: scoreColor }]}>
                  {getScoreLabel(score)}
                </Text>
                <Text style={styles.scoreOutOf}>/ 100</Text>
              </View>
            </View>
            {/* 快速指标行 */}
            <View style={styles.quickIndicators}>
              {[
                { icon: '☁️', label: '云量', value: `${cloudCover}%`, score: parseInt(cloudCover) >= 20 && parseInt(cloudCover) <= 60 },
                { icon: '👁', label: '能见度', value: `${visibility}km`, score: parseInt(visibility) >= 10 },
                { icon: '✨', label: '光质', value: ((new Date().getHours() >= 5 && new Date().getHours() <= 8) || (new Date().getHours() >= 16 && new Date().getHours() <= 19)) ? '黄金' : '普通', score: (new Date().getHours() >= 5 && new Date().getHours() <= 8) || (new Date().getHours() >= 16 && new Date().getHours() <= 19) },
                { icon: '🌬', label: '风速', value: `${nowWeather?.windScale || '--'}级`, score: parseInt(nowWeather?.windScale) <= 3 },
              ].map((item, i) => (
                <View key={i} style={styles.quickIndicatorItem}>
                  <Text style={styles.quickIndicatorIcon}>{item.icon}</Text>
                  <Text style={styles.quickIndicatorValue}>{item.value}</Text>
                  <Text style={[styles.quickIndicatorLabel, item.score && styles.quickIndicatorGood]}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* ═══════════════════════════════════════════
              3. 黄金时刻 & 蓝调时刻
          ═══════════════════════════════════════════ */}
          <View style={styles.dualColumn}>
            {/* 黄金时刻 */}
            <LinearGradient
              colors={['rgba(218,165,32,0.18)', 'rgba(218,165,32,0.04)']}
              style={[styles.glassCard, styles.dualCard, styles.goldenCard]}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            >
              <Text style={styles.dualCardEmoji}>🌅</Text>
              <Text style={[styles.dualCardTitle, { color: Brand.Gold }]}>Golden Hour</Text>
              <Text style={styles.dualCardTime}>
                {astronomyData?.goldenHour?.start || '--'} - {astronomyData?.goldenHour?.end || '--'}
              </Text>
              <View style={styles.dualCardCountdown}>
                <Ionicons name="time-outline" size={13} color={Brand.Gold} />
                <Text style={styles.dualCardCountdownText}>
                  {goldenCountdown}
                </Text>
              </View>
            </LinearGradient>

            {/* 蓝调时刻 */}
            <LinearGradient
              colors={['rgba(74,144,217,0.18)', 'rgba(74,144,217,0.04)']}
              style={[styles.glassCard, styles.dualCard, styles.blueCard]}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            >
              <Text style={styles.dualCardEmoji}>🌆</Text>
              <Text style={[styles.dualCardTitle, { color: Accent.SkyBlue }]}>Blue Hour</Text>
              <Text style={styles.dualCardTime}>
                {astronomyData?.blueHour?.start || '--'} - {astronomyData?.blueHour?.end || '--'}
              </Text>
              <View style={styles.dualCardCountdown}>
                <Ionicons name="moon-outline" size={13} color={Accent.SkyBlue} />
                <Text style={[styles.dualCardCountdownText, { color: Accent.SkyBlue }]}>
                  日落后
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* ═══════════════════════════════════════════
              4. 天文条件面板
          ═══════════════════════════════════════════ */}
          <View style={styles.glassCard}>
            <Text style={styles.sectionTitle}>🔭 天文条件</Text>

            {/* 月相 */}
            <View style={styles.astroRow}>
              <View style={styles.astroIconWrap}>
                <Text style={styles.astroEmoji}>{getMoonEmoji(moonPhase?.phaseName)}</Text>
              </View>
              <View style={styles.astroInfo}>
                <Text style={styles.astroName}>{moonPhase?.phaseName || '--'}</Text>
                <Text style={styles.astroMeta}>
                  照度 {moonPhase?.illumination != null ? `${Math.round(moonPhase.illumination)}%` : '--'} · 月龄 {moonPhase?.age != null ? `${moonPhase.age}天` : '--'}
                </Text>
              </View>
              <View style={styles.astroProgressBg}>
                <View style={[styles.astroProgressFill, { width: `${moonPhase?.illumination || 0}%` }]} />
              </View>
            </View>

            {/* 银河可见性 */}
            <View style={styles.astroRow}>
              <View style={styles.astroIconWrap}>
                <Text style={styles.astroEmoji}>🌌</Text>
              </View>
              <View style={styles.astroInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.astroName}>银河</Text>
                  <View style={[styles.astroBadge, { backgroundColor: milkyWay?.visible ? 'rgba(76,175,80,0.2)' : 'rgba(239,68,68,0.2)' }]}>
                    <Text style={[styles.astroBadgeText, { color: milkyWay?.visible ? Accent.SuccessGreen : '#EF4444' }]}>
                      {milkyWay?.visible ? '可见' : '不可见'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.astroMeta}>
                  {milkyWay?.visible
                    ? `观测质量 ${milkyWay.quality} · ${milkyWay.seasonFactor}`
                    : milkyWay?.seasonFactor || '非观测季'}
                </Text>
              </View>
            </View>

            {/* 星座位置 */}
            {eveningConstellations.length > 0 && (
              <View style={styles.constellationSection}>
                <Text style={styles.astroSubLabel}>当晚可见星座</Text>
                <View style={styles.constellationRow}>
                  {eveningConstellations.map((c, i) => (
                    <View key={i} style={styles.constellationTag}>
                      <Text style={styles.constellationEmoji}>⭐</Text>
                      <Text style={styles.constellationName}>{c.name}</Text>
                      <Text style={styles.constellationAlt}>{Math.round(c.altitude)}°</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* ═══════════════════════════════════════════
              5. 气象条件面板
          ═══════════════════════════════════════════ */}
          <View style={styles.glassCard}>
            <Text style={styles.sectionTitle}>🌡 气象条件</Text>
            <View style={styles.weatherGrid}>
              {[
                {
                  icon: '☁️', label: '云量', value: `${cloudCover}%`,
                  sub: parseInt(cloudCover) <= 30 ? '晴空' : parseInt(cloudCover) <= 70 ? '多云' : '阴天',
                  progress: parseInt(cloudCover) || 0,
                },
                {
                  icon: '👁', label: '能见度', value: `${visibility} km`,
                  sub: parseInt(visibility) >= 10 ? '视野开阔' : parseInt(visibility) >= 5 ? '一般' : '较差',
                  progress: Math.min((parseInt(visibility) || 0) * 3.3, 100),
                },
                {
                  icon: '💧', label: '湿度', value: `${nowWeather?.humidity || '--'}%`,
                  sub: parseInt(nowWeather?.humidity) <= 40 ? '干燥' : parseInt(nowWeather?.humidity) <= 70 ? '舒适' : '潮湿',
                  progress: parseInt(nowWeather?.humidity) || 0,
                },
                {
                  icon: '☀️', label: '紫外线', value: `UV ${uvIndex}`,
                  sub: getUVLevel(uvIndex).label,
                  progress: Math.min(uvIndex * 8.3, 100),
                  progressColor: getUVLevel(uvIndex).color,
                },
                {
                  icon: '🌬', label: '风向风速', value: `${nowWeather?.windDir || '--'}`,
                  sub: `${nowWeather?.windScale || '--'}级`,
                  progress: Math.min((parseInt(nowWeather?.windScale) || 0) * 8.3, 100),
                },
                {
                  icon: '📊', label: '气压', value: `${nowWeather?.pressure || '--'} hPa`,
                  sub: parseInt(nowWeather?.pressure) >= 1013 ? '高压' : '低压',
                  progress: Math.min(((parseInt(nowWeather?.pressure) || 1000) - 980) * 1.25, 100),
                },
              ].map((item, i) => (
                <View key={i} style={styles.weatherItem}>
                  <View style={styles.weatherItemHeader}>
                    <Text style={styles.weatherItemIcon}>{item.icon}</Text>
                    <Text style={styles.weatherItemLabel}>{item.label}</Text>
                  </View>
                  <Text style={styles.weatherItemValue}>{item.value}</Text>
                  <View style={styles.weatherItemBarBg}>
                    <View style={[
                      styles.weatherItemBarFill,
                      { width: `${item.progress}%`, backgroundColor: item.progressColor || Brand.Gold },
                    ]} />
                  </View>
                  <Text style={styles.weatherItemSub}>{item.sub}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ═══════════════════════════════════════════
              6. 大气光学现象
          ═══════════════════════════════════════════ */}
          <View style={styles.glassCard}>
            <Text style={styles.sectionTitle}>🌈 大气光学现象</Text>

            {/* 彩虹 */}
            <View style={styles.phenomenonRow}>
              <View style={styles.phenomenonIconWrap}>
                <Text style={styles.phenomenonEmoji}>🌈</Text>
              </View>
              <View style={styles.phenomenonInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.phenomenonName}>彩虹概率</Text>
                  <Text style={[styles.phenomenonProb, {
                    color: (rainbowProb?.probability || 0) >= 50 ? Accent.SuccessGreen : TextColor.Secondary,
                  }]}>
                    {rainbowProb?.probability || 0}%
                  </Text>
                </View>
                <View style={styles.phenomenonBarBg}>
                  <View style={[styles.phenomenonBarFill, {
                    width: `${rainbowProb?.probability || 0}%`,
                    backgroundColor: rainbowProb?.probability >= 50
                      ? 'rgba(76,175,80,0.5)' : 'rgba(160,168,192,0.3)',
                  }]} />
                </View>
                <Text style={styles.phenomenonMeta}>
                  {(rainbowProb?.probability || 0) >= 50
                    ? `${rainbowProb?.direction || ''}方向可能出现${rainbowProb?.type || '彩虹'}`
                    : '今日彩虹概率较低'}
                </Text>
              </View>
            </View>

            {/* 日晕 */}
            <View style={styles.phenomenonRow}>
              <View style={styles.phenomenonIconWrap}>
                <Text style={styles.phenomenonEmoji}>☀️</Text>
              </View>
              <View style={styles.phenomenonInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.phenomenonName}>日晕概率</Text>
                  <Text style={[styles.phenomenonProb, {
                    color: (haloProb?.probability || 0) >= 40 ? Accent.SkyBlue : TextColor.Secondary,
                  }]}>
                    {haloProb?.probability || 0}%
                  </Text>
                </View>
                <View style={styles.phenomenonBarBg}>
                  <View style={[styles.phenomenonBarFill, {
                    width: `${haloProb?.probability || 0}%`,
                    backgroundColor: haloProb?.probability >= 40
                      ? skyBlueAlpha(0.5) : 'rgba(160,168,192,0.3)',
                  }]} />
                </View>
                <Text style={styles.phenomenonMeta}>
                  {(haloProb?.probability || 0) >= 40
                    ? `可能出现${haloProb?.type || '日晕'}`
                    : '今日晕现象概率较低'}
                </Text>
              </View>
            </View>

            {/* 霞光（综合早晚霞） */}
            {glowForecast && (
              <View style={styles.phenomenonRow}>
                <View style={styles.phenomenonIconWrap}>
                  <Text style={styles.phenomenonEmoji}>🌅</Text>
                </View>
                <View style={styles.phenomenonInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.phenomenonName}>霞光概率</Text>
                    <Text style={[styles.phenomenonProb, {
                      color: glowForecast.sunsetGlow.probability >= 40 ? Brand.Gold : TextColor.Secondary,
                    }]}>
                      {Math.max(glowForecast.sunriseGlow.probability, glowForecast.sunsetGlow.probability)}%
                    </Text>
                  </View>
                  <View style={styles.phenomenonBarBg}>
                    <View style={[styles.phenomenonBarFill, {
                      width: `${Math.max(glowForecast.sunriseGlow.probability, glowForecast.sunsetGlow.probability)}%`,
                      backgroundColor: glowForecast.sunsetGlow.probability >= 40
                        ? goldAlpha(0.5) : 'rgba(160,168,192,0.3)',
                    }]} />
                  </View>
                  <View style={styles.glowDualInfo}>
                    <View style={styles.glowDualItem}>
                      <Text style={styles.glowDualLabel}>🌄 朝霞</Text>
                      <Text style={styles.glowDualProb}>{glowForecast.sunriseGlow.probability}%</Text>
                    </View>
                    <View style={styles.glowDualItem}>
                      <Text style={styles.glowDualLabel}>🌇 晚霞</Text>
                      <Text style={styles.glowDualProb}>{glowForecast.sunsetGlow.probability}%</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* ═══════════════════════════════════════════
              7. 今日气温条
          ═══════════════════════════════════════════ */}
          <View style={styles.glassCard}>
            <Text style={styles.sectionTitle}>📈 今日气温</Text>
            <View style={styles.tempBarContainer}>
              <View style={styles.tempBarLabels}>
                <Text style={styles.tempBarLow}>{todayLow}°</Text>
                <View style={{ flex: 1 }} />
                <Text style={styles.tempBarNow}>
                  现在 {temp}°
                </Text>
                <View style={{ flex: 1 }} />
                <Text style={styles.tempBarHigh}>{todayHigh}°</Text>
              </View>
              <View style={styles.tempBarTrack}>
                <View style={styles.tempBarGradient}>
                  <View style={[styles.tempBarFill, {
                    left: `${((todayLow - minTemp) / (tempRange || 1)) * 100}%`,
                    width: `${((todayHigh - todayLow) / (tempRange || 1)) * 100}%`,
                  }]} />
                  {/* 当前温度指示点 */}
                  <View style={[styles.tempBarDot, {
                    left: `${Math.min(95, Math.max(5, ((temp - todayLow) / (todayHigh - todayLow || 1)) * 100))}%`,
                  }]}>
                    <View style={styles.tempBarDotInner} />
                  </View>
                </View>
              </View>
              <View style={styles.tempBarRange}>
                <Text style={styles.tempBarRangeText}>
                  范围 {minTemp}° ~ {maxTemp}°
                </Text>
                <Text style={styles.tempBarRangeText}>
                  体感 {Math.round(parseInt(nowWeather?.feelsLike) || temp)}°
                </Text>
              </View>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ==================== 样式表 ====================

const styles = StyleSheet.create({
  // ── 基础卡片 ──
  glassCard: {
    ...GlassCardStyle,
    backgroundColor: 'rgba(10, 14, 23, 0.82)',
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: whiteAlpha(0.08),
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
    color: TextColor.Primary,
    marginBottom: Spacing.md,
    letterSpacing: 0.3,
  },

  // ── 加载/错误状态 ──
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 120,
  },
  loadingEmoji: { fontSize: 36 },
  loadingText: { color: TextColor.Tertiary, marginTop: 12, fontSize: FontSize.caption },
  errorContainer: {
    paddingTop: 60, alignItems: 'center',
  },
  errorEmoji: { fontSize: 36 },
  errorText: { color: TextColor.Secondary, marginTop: 12, fontSize: FontSize.body, textAlign: 'center' },
  errorHint: { color: TextColor.Tertiary, fontSize: FontSize.micro, marginTop: 6 },
  retryButton: {
    marginTop: 16, backgroundColor: goldAlpha(0.15), borderWidth: 1,
    borderColor: goldAlpha(0.3), borderRadius: Radius.full, paddingHorizontal: 24, paddingVertical: 10,
  },
  retryText: { color: Brand.Gold, fontSize: FontSize.body, fontWeight: FontWeight.semiBold },

  // ── 搜索 ──
  searchOverlay: {
    position: 'absolute', top: 0, left: Spacing.lg, right: Spacing.lg,
    zIndex: 100, backgroundColor: Surface.Surface1,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: whiteAlpha(0.1),
    maxHeight: 300, overflow: 'hidden',
  },
  searchResultRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: whiteAlpha(0.05),
  },
  searchResultName: { color: TextColor.Primary, fontSize: FontSize.body, fontWeight: FontWeight.medium },
  searchResultMeta: { color: TextColor.Tertiary, fontSize: FontSize.caption },

  hiddenSearchInput: {
    position: 'absolute', top: -999, left: -999, width: 1, height: 1, opacity: 0,
  },

  // ── 1. 地球仪 ──
  globeWrapper: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: goldAlpha(0.25),
    ...Shadow.goldGlow,
  },
  globeBorderGlow: {
    position: 'absolute', top: -4, left: -4, right: -4, bottom: -4,
    borderRadius: Radius.lg + 4,
    borderWidth: 2,
    borderColor: goldAlpha(0.12),
  },
  globeInner: {
    flex: 1,
    backgroundColor: '#0F0D1E',
  },
  globeOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  globeOverlayBlur: {
    backgroundColor: 'rgba(10, 14, 23, 0.65)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 0.5,
    borderColor: whiteAlpha(0.1),
    backdropFilter: 'blur(12px)',
  },
  globeCityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  globeCityName: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    color: TextColor.Primary,
  },
  globeSearchBtn: {
    marginLeft: 'auto', padding: 4,
  },
  globeTemp: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.light,
    color: TextColor.Primary,
    letterSpacing: -1,
    marginTop: -2,
    lineHeight: FontSize.display * 1.1,
  },
  globeConditionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2,
  },
  globeWeatherEmoji: { fontSize: 22 },
  globeConditionText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: TextColor.Primary,
  },
  globeHiLoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6,
  },
  globeHiLo: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.medium,
    color: TextColor.Secondary,
  },
  globeHiLoDivider: {
    fontSize: FontSize.caption, color: TextColor.Tertiary,
  },
  globeFeelsLike: {
    fontSize: FontSize.caption, color: TextColor.Tertiary,
  },

  // ── 2. 摄影评分 ──
  scoreCard: {
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: Brand.Gold,
  },
  scoreHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm,
  },
  scoreIcon: { fontSize: 20 },
  scoreTitle: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
    color: TextColor.Primary,
  },
  scoreBody: {
    alignItems: 'center', marginBottom: Spacing.md,
  },
  scoreNumber: {
    fontSize: 56,
    fontWeight: FontWeight.bold,
    letterSpacing: -1,
  },
  scoreLabelWrap: {
    flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: -4,
  },
  scoreLabelText: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
  },
  scoreOutOf: {
    fontSize: FontSize.caption,
    color: TextColor.Tertiary,
  },
  quickIndicators: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    borderTopWidth: 0.5,
    borderTopColor: whiteAlpha(0.08),
    paddingTop: Spacing.md,
  },
  quickIndicatorItem: {
    alignItems: 'center', gap: 2,
  },
  quickIndicatorIcon: { fontSize: 18 },
  quickIndicatorValue: {
    fontSize: FontSize.caption,
    color: TextColor.Primary,
    fontWeight: FontWeight.semiBold,
  },
  quickIndicatorLabel: {
    fontSize: FontSize.micro,
    color: TextColor.Tertiary,
  },
  quickIndicatorGood: {
    color: Accent.SuccessGreen,
  },

  // ── 3. 双列卡片 ──
  dualColumn: {
    flexDirection: 'row', marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, gap: Spacing.sm,
  },
  dualCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginHorizontal: 0,
    marginBottom: 0,
  },
  goldenCard: {
    borderLeftWidth: 2,
    borderLeftColor: Brand.Gold,
  },
  blueCard: {
    borderLeftWidth: 2,
    borderLeftColor: Accent.SkyBlue,
  },
  dualCardEmoji: { fontSize: 28, marginBottom: 4 },
  dualCardTitle: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dualCardTime: {
    fontSize: FontSize.caption,
    color: TextColor.Primary,
    fontWeight: FontWeight.semiBold,
    marginTop: 6,
    fontFamily: 'JetBrains Mono, SF Mono, monospace',
  },
  dualCardCountdown: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6,
  },
  dualCardCountdownText: {
    fontSize: FontSize.micro,
    color: Brand.Gold,
    fontWeight: FontWeight.medium,
  },

  // ── 4. 天文条件 ──
  astroRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: whiteAlpha(0.06),
  },
  astroIconWrap: {
    width: 40, height: 40, borderRadius: Radius.sm,
    backgroundColor: whiteAlpha(0.06),
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  astroEmoji: { fontSize: 22 },
  astroInfo: { flex: 1 },
  astroName: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    color: TextColor.Primary,
  },
  astroMeta: {
    fontSize: FontSize.caption,
    color: TextColor.Tertiary,
    marginTop: 2,
  },
  astroBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.sm,
  },
  astroBadgeText: {
    fontSize: FontSize.micro,
    fontWeight: FontWeight.semiBold,
  },
  astroProgressBg: {
    width: 48, height: 4, borderRadius: 2,
    backgroundColor: whiteAlpha(0.1),
  },
  astroProgressFill: {
    height: 4, borderRadius: 2,
    backgroundColor: Brand.Gold,
  },
  astroSubLabel: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semiBold,
    color: TextColor.Secondary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  constellationSection: {
    borderTopWidth: 0.5,
    borderTopColor: whiteAlpha(0.06),
    marginTop: Spacing.sm,
  },
  constellationRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs,
  },
  constellationTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: whiteAlpha(0.06),
    borderRadius: Radius.sm,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  constellationEmoji: { fontSize: 12 },
  constellationName: {
    fontSize: FontSize.caption,
    color: TextColor.Primary,
  },
  constellationAlt: {
    fontSize: FontSize.micro,
    color: TextColor.Tertiary,
    fontFamily: 'JetBrains Mono, SF Mono, monospace',
  },

  // ── 5. 气象条件 ──
  weatherGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
  },
  weatherItem: {
    width: '50%',
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.sm,
  },
  weatherItemHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4,
  },
  weatherItemIcon: { fontSize: 16 },
  weatherItemLabel: {
    fontSize: FontSize.caption,
    color: TextColor.Tertiary,
    fontWeight: FontWeight.medium,
  },
  weatherItemValue: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
    color: TextColor.Primary,
    marginBottom: 4,
  },
  weatherItemBarBg: {
    height: 3, borderRadius: 1.5,
    backgroundColor: whiteAlpha(0.08),
    marginBottom: 4,
  },
  weatherItemBarFill: {
    height: 3, borderRadius: 1.5,
  },
  weatherItemSub: {
    fontSize: FontSize.micro,
    color: TextColor.Tertiary,
  },

  // ── 6. 大气光学现象 ──
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
  phenomenonEmoji: { fontSize: 22 },
  phenomenonInfo: { flex: 1 },
  phenomenonName: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    color: TextColor.Primary,
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
    color: TextColor.Tertiary,
    marginTop: 2,
  },
  glowDualInfo: {
    flexDirection: 'row', gap: 16, marginTop: 6,
  },
  glowDualItem: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  glowDualLabel: {
    fontSize: FontSize.caption,
    color: TextColor.Secondary,
  },
  glowDualProb: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semiBold,
    color: TextColor.Primary,
  },

  // ── 7. 气温条 ──
  tempBarContainer: {
    paddingTop: Spacing.xs,
  },
  tempBarLabels: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
  },
  tempBarLow: {
    fontSize: FontSize.caption,
    color: Accent.SkyBlue,
    fontWeight: FontWeight.semiBold,
  },
  tempBarNow: {
    fontSize: FontSize.caption,
    color: Brand.Gold,
    fontWeight: FontWeight.bold,
  },
  tempBarHigh: {
    fontSize: FontSize.caption,
    color: Accent.SunsetOrange,
    fontWeight: FontWeight.semiBold,
  },
  tempBarTrack: {
    height: 28,
    justifyContent: 'center',
  },
  tempBarGradient: {
    height: 8, borderRadius: 4,
    backgroundColor: whiteAlpha(0.08),
    position: 'relative',
    overflow: 'visible',
  },
  tempBarFill: {
    position: 'absolute', top: 0, height: 8, borderRadius: 4,
    backgroundColor: Brand.GoldLight,
  },
  tempBarDot: {
    position: 'absolute', top: -6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: goldAlpha(0.2),
    justifyContent: 'center', alignItems: 'center',
    transform: [{ translateX: -10 }],
  },
  tempBarDotInner: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Brand.Gold,
    borderWidth: 2,
    borderColor: 'rgba(10,14,23,0.9)',
  },
  tempBarRange: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 8,
  },
  tempBarRangeText: {
    fontSize: FontSize.micro,
    color: TextColor.Tertiary,
  },
});
