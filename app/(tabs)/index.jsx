import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, FlatList, useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import qweatherService from '../../services/qweatherService';
import { getPhotographyTimes, formatTime } from '../../services/astronomyService';
import { Brand, Accent, Surface, TextColor, Spacing, Radius, FontSize, FontWeight, goldAlpha, whiteAlpha } from '../../styles/designTokens';
import WeatherCard from '../../components/WeatherCard';
import PhotoTimingPanel from '../../components/PhotoTimingPanel';

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

/**
 * 根据天气状况代码返回动态渐变背景色
 */
function getWeatherBackground(text, code) {
  const c = parseInt(code) || 0;
  const t = (text || '').toLowerCase();

  if (c === 100 || t.includes('晴')) return ['#1a1a2e', '#16213e', '#e2725b'];
  if (c >= 101 && c <= 104) return ['#2c3e50', '#34495e', '#5d6d7e'];
  if (c >= 150 && c <= 154) return ['#2d3436', '#434a54', '#656d78'];
  if (c >= 319 && c <= 399) return ['#0a1620', '#14293a', '#1e4d5a'];
  if (c >= 300 && c <= 318 || t.includes('雨')) return ['#0c2027', '#1a3a47', '#2c5f6b'];
  if (c >= 400 && c <= 499 || t.includes('雪')) return ['#1e3c58', '#2b5a80', '#87aec8'];
  if (c >= 500 && c <= 515 || t.includes('雾') || t.includes('霾')) return ['#3a3a4a', '#505060', '#6a6a7a'];
  return ['#1a1a2e', '#16213e', '#0f3460'];
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
      hour: hour,
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

function calcPhotoScore(cloud, vis) {
  const c = parseInt(cloud) || 50;
  const v = parseInt(vis) || 10;
  const cloudScore = c >= 20 && c <= 60 ? 30 : c < 20 ? 15 : 10;
  const visScore = Math.min(v * 2, 40);
  const hour = new Date().getHours();
  const timeScore = (hour >= 5 && hour <= 8) || (hour >= 16 && hour <= 19) ? 30 : 10;
  return Math.min(cloudScore + visScore + timeScore, 100);
}

function formatCountdown(ms) {
  if (ms <= 0) return '进行中';
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
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
  const { width: screenWidth } = useWindowDimensions();
  const responsiveTempSize = Math.min(72, screenWidth * 0.18);

  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [aqiData, setAqiData] = useState(null);
  const [astronomyData, setAstronomyData] = useState(null);
  const [goldenCountdown, setGoldenCountdown] = useState('--');

  const cityCoords = useRef({ lat: 39.9042, lng: 116.4074 });

  const { minTemp, maxTemp } = useMemo(() => {
    if (!dailyForecast || dailyForecast.length === 0) {
      return { minTemp: 15, maxTemp: 35 };
    }
    const lows = dailyForecast.map(d => parseInt(d.tempMin) || 0);
    const highs = dailyForecast.map(d => parseInt(d.tempMax) || 0);
    return {
      minTemp: Math.min(...lows),
      maxTemp: Math.max(...highs),
    };
  }, [dailyForecast]);

  const cloudCover = nowWeather?.cloud || '--';
  const visibility = nowWeather?.vis || '--';

  const photoScore = useMemo(() => {
    if (!nowWeather) return null;
    return calcPhotoScore(nowWeather.cloud, nowWeather.vis);
  }, [nowWeather]);

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
        blueHour: {
          start: fmt(photoTimes.blueHourEvening.start),
          end: fmt(photoTimes.blueHourEvening.end),
        },
      });
    } catch (err) {
      console.warn('天文数据计算失败，使用默认值:', err);
      setAstronomyData({
        goldenHour: { start: '17:30', end: '18:30', startDate: null },
        blueHour: { start: '18:30', end: '19:00' },
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

  return (
    <LinearGradient colors={bgColors} style={{ flex: 1 }} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* 加载状态 */}
        {isLoading && !nowWeather && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 120 }}>
            <Text style={{ fontSize: 36 }}>⏳</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 12, fontSize: 14 }}>加载天气数据...</Text>
          </View>
        )}
        {/* 错误状态 */}
        {loadError && !isLoading && (
          <View style={{ paddingTop: 60, alignItems: 'center' }}>
            <Text style={{ fontSize: 36 }}>⚠️</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 12, fontSize: 14, textAlign: 'center' }}>
              天气数据加载失败
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 6 }}>
              已使用本地缓存数据
            </Text>
            <TouchableOpacity
              onPress={() => loadWeatherData(currentCity.id)}
              style={{
                marginTop: 16, backgroundColor: 'rgba(218,165,32,0.15)', borderWidth: 1,
                borderColor: 'rgba(218,165,32,0.3)', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10,
              }}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#DAA520', fontSize: 14, fontWeight: '600' }}>重试</Text>
            </TouchableOpacity>
          </View>
        )}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">

          {/* 搜索栏覆盖层 */}
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
                    <Ionicons name="location-outline" size={18} color="rgba(255,255,255,0.5)" />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>{item.name}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                        {item.adm1} {item.adm2}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* 1. 顶部导航 */}
          <View style={styles.topNav}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="搜索城市"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => searchQuery.trim() && handleSearch(searchQuery)}
                onSubmitEditing={() => handleSearch(searchQuery)}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={{ fontSize: 15, color: '#fff', fontWeight: '400' }}>
                {currentCity?.name || '北京'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => searchInputRef.current?.focus()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ padding: 8, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 16, color: '#fff', opacity: 0.7 }}>🔍</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 16, color: '#fff', opacity: 0.7 }}>•••</Text>
            </View>
          </View>

          {/* 2. 实时天气卡片 */}
          <WeatherCard
            nowWeather={nowWeather}
            dailyForecast={dailyForecast}
            hourlyForecast={hourlyForecast}
            aqiData={aqiData}
            responsiveTempSize={responsiveTempSize}
            cloudCover={cloudCover}
            visibility={visibility}
          />

          {/* 3. 摄影时机面板 */}
          <PhotoTimingPanel
            photoScore={photoScore}
            cloudCover={cloudCover}
            visibility={visibility}
            nowWeather={nowWeather}
            astronomyData={astronomyData}
            goldenCountdown={goldenCountdown}
          />

          {/* 4. 7日预报 — 玻璃卡片 */}
          <View style={styles.glassCard}>
            <Text style={styles.sectionTitle}>7天预报</Text>
            {(dailyForecast || []).slice(0, 7).map((day, i) => {
              const low = parseInt(day.tempMin) || 0;
              const high = parseInt(day.tempMax) || 0;
              const range = maxTemp - minTemp || 1;
              return (
                <View key={i} style={[styles.dayRow, i === 6 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.dayLabel}>
                    {day.day || (day.fxDate ? day.fxDate.slice(5) : '--')}
                  </Text>
                  <Text style={{ width: 28, fontSize: 18, textAlign: 'center' }}>
                    {getWeatherEmoji(day.textDay || day.text)}
                  </Text>
                  <View style={styles.dayTempBar}>
                    <View style={[styles.dayTempFill, {
                      left: `${((low - minTemp) / range) * 100}%`,
                      width: `${((high - low) / range) * 100}%`,
                    }]} />
                  </View>
                  <Text style={styles.dayTempHi}>{Math.round(high)}°</Text>
                  <Text style={styles.dayTempLo}>{Math.round(low)}°</Text>
                </View>
              );
            })}
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ==================== 样式表 ====================

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: 'rgba(18, 24, 42, 0.75)',
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: whiteAlpha(0.06),
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.semiBold,
    color: TextColor.Primary,
    marginBottom: Spacing.sm,
  },

  topNav: {
    height: 56,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchInput: {
    fontSize: FontSize.body,
    color: TextColor.Primary,
    backgroundColor: Surface.Surface2,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 120,
    height: 36,
    borderWidth: 1,
    borderColor: whiteAlpha(0.1),
  },
  searchOverlay: {
    position: 'absolute',
    top: 56,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 100,
    backgroundColor: Surface.Surface1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: whiteAlpha(0.1),
    maxHeight: 300,
    overflow: 'hidden',
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: whiteAlpha(0.05),
  },

  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderBottomWidth: 0.5,
    borderBottomColor: whiteAlpha(0.06),
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  dayLabel: {
    width: 40,
    fontSize: FontSize.caption,
    color: TextColor.Primary,
    fontWeight: FontWeight.regular,
  },
  dayTempBar: {
    flex: 1,
    height: 4,
    backgroundColor: whiteAlpha(0.1),
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  dayTempFill: {
    position: 'absolute',
    top: 0,
    height: 4,
    backgroundColor: Brand.Gold,
    borderRadius: 2,
  },
  dayTempHi: {
    width: 30,
    fontSize: FontSize.caption,
    color: TextColor.Primary,
    textAlign: 'right',
    fontWeight: FontWeight.regular,
  },
  dayTempLo: {
    width: 30,
    fontSize: FontSize.caption,
    color: TextColor.Tertiary,
    textAlign: 'right',
    fontWeight: FontWeight.regular,
  },
});
