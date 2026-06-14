import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import qweatherService from '../../services/weather/qweatherService';
import astronomyService from '../../services/astronomyService';
import weatherService from '../../services/weather/weatherService';
import FadeInView from '../../components/animations/FadeInView';
import { getProbabilityColor } from '../../utils/colors';
import { Brand, Accent, Surface, TextColor, Spacing, Radius, FontSize, FontWeight, goldAlpha, whiteAlpha, skyBlueAlpha } from '../../styles/designTokens';

// ─── 辅助函数 ───────────────────────────────────────────────

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

function getAqiColor(aqi) {
  if (!aqi) return '#888';
  if (aqi <= 50) return '#30D158';
  if (aqi <= 100) return '#FFD60A';
  if (aqi <= 150) return '#FF9F0A';
  if (aqi <= 200) return '#FF375F';
  if (aqi <= 300) return '#BF5AF2';
  return '#8B0000';
}

// ─── 主组件 ─────────────────────────────────────────────────

/**
 * 预报页面 - 7 天天气趋势（重排版）
 * 结构：WeatherBanner → 今日光质时间轴 → 7天详细预报 → 环境指数 2×2
 */
export default function ForecastScreen() {
  // 当前选中的日期
  const [selectedDay, setSelectedDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [astronomyData, setAstronomyData] = useState(null);
  const [aqiData, setAqiData] = useState(null);
  const [uvData, setUvData] = useState(null);
  const [nowWeather, setNowWeather] = useState(null);
  const [dailyForecast, setDailyForecast] = useState([]);

  // 当前城市
  const currentCity = { name: '北京' };

  // 北京坐标（实际应从用户定位或选择的城市获取）
  const LOCATION = {
    lat: 39.9042,
    lng: 116.4074,
    cityId: '101010100', // 北京城市 ID
    name: '北京市'
  };

  // 温度范围（用于温度条可视化）
  const maxTemp = useMemo(() => {
    if (!dailyForecast || dailyForecast.length === 0) return 35;
    return Math.max(...dailyForecast.map(d => parseInt(d.tempMax) || 0));
  }, [dailyForecast]);

  const minTemp = useMemo(() => {
    if (!dailyForecast || dailyForecast.length === 0) return 15;
    return Math.min(...dailyForecast.map(d => parseInt(d.tempMin) || 0));
  }, [dailyForecast]);

  // 格式化日期显示
  const formatDay = (dateStr, index) => {
    if (index === 0) return '今天';
    if (index === 1) return '明天';
    const date = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 将 dailyForecast (API 格式) 转换为 forecastData (组件渲染格式)
  const forecastData = (dailyForecast || []).map((item, index) => ({
    day: formatDay(item.fxDate, index),
    date: formatDate(item.fxDate),
    condition: item.textDay || '多云',
    high: parseInt(item.tempMax) || 0,
    low: parseInt(item.tempMin) || 0,
    rain: Math.min(100, Math.round(parseFloat(item.precip || 0) * 10)),
    wind: `${item.windDirDay || ''}${item.windScaleDay || ''}级`,
  }));

  // 确保 selectedDay 不超出数组范围
  const safeSelectedDay = Math.min(selectedDay, Math.max(0, forecastData.length - 1));

  // 加载天气数据
  useEffect(() => {
    loadWeatherData();
    loadAstronomyData();
  }, []);

  async function loadWeatherData() {
    try {
      const [weather, forecast] = await Promise.all([
        qweatherService.getNowWeather(LOCATION.cityId),
        qweatherService.getDailyForecast(LOCATION.cityId, 7),
      ]);
      setNowWeather(weather);
      setDailyForecast(forecast);
    } catch (error) {
      console.error('加载天气数据失败:', error);
      // 使用 Mock 数据
      setNowWeather(qweatherService.generateMockNowWeather());
      setDailyForecast(qweatherService.generateMockDailyForecast());
    } finally {
      setLoading(false);
    }
  }

  async function loadAstronomyData() {
    try {
      const now = new Date();
      
      // 并行加载所有数据
      const [sunTimes, moonPhase, moonTimes, photoTimes, aqi, uv] = await Promise.all([
        // 天文数据
        astronomyService.getSunTimes(now, LOCATION.lat, LOCATION.lng),
        astronomyService.getMoonPhase(now),
        astronomyService.getMoonTimes(now, LOCATION.lat, LOCATION.lng),
        astronomyService.getPhotographyTimes(now, LOCATION.lat, LOCATION.lng),
        // 空气质量
        weatherService.getAQI(LOCATION.cityId),
        weatherService.getUVIndex(LOCATION.cityId)
      ]);

      setAstronomyData({
        sunTimes,
        moonPhase,
        moonTimes,
        photoTimes
      });
      setAqiData(aqi);
      setUvData(uv);
    } catch (error) {
      console.error('加载天文数据失败:', error);
      // 提供 fallback mock data for astronomy
      setAstronomyData({
        sunTimes: { sunrise: new Date(2026, 5, 1, 5, 45), sunset: new Date(2026, 5, 1, 19, 30) },
        moonPhase: { phaseName: '上弦月', age: 7, illumination: 50 },
        moonTimes: { moonrise: new Date(2026, 5, 1, 12, 0), moonset: new Date(2026, 5, 1, 0, 30) },
        photoTimes: {
          goldenHourMorning: { start: new Date(2026, 5, 1, 5, 45), end: new Date(2026, 5, 1, 6, 45), duration: 60 },
          goldenHourEvening: { start: new Date(2026, 5, 1, 18, 30), end: new Date(2026, 5, 1, 19, 30), duration: 60 },
          blueHourMorning: { start: new Date(2026, 5, 1, 5, 15), end: new Date(2026, 5, 1, 5, 45) },
          blueHourEvening: { start: new Date(2026, 5, 1, 19, 30), end: new Date(2026, 5, 1, 20, 0) },
        }
      });
      setAqiData({ aqi: 75, category: '良', primaryPollutant: 'PM2.5' });
      setUvData({ uvIndex: 5, level: '中等', advice: '建议涂抹防晒霜，佩戴帽子' });
    }
  }

  // 获取天气图标
  const getWeatherIcon = (condition) => {
    const icons = {
      '晴': 'sunny',
      '多云': 'partly-sunny',
      '阴': 'cloudy',
      '小雨': 'rainy',
      '中雨': 'rainy',
      '大雨': 'thunderstorm',
    };
    return icons[condition] || 'cloud';
  };

  // 获取 UV 等级颜色
  const getUvColor = (uvIndex) => {
    if (uvIndex <= 2) return '#52C41A';
    if (uvIndex <= 4) return '#DAA520';
    if (uvIndex <= 6) return '#FFA500';
    if (uvIndex <= 8) return '#FF6B35';
    if (uvIndex <= 10) return '#8B00FF';
    return '#8B0000';
  };

  // 光晕动画
  const haloOpacity1 = useState(new Animated.Value(0.3))[0];
  const haloRadius1 = useState(new Animated.Value(60))[0];
  const haloOpacity2 = useState(new Animated.Value(0.4))[0];
  const haloRadius2 = useState(new Animated.Value(70))[0];

  useEffect(() => {
    const pulse1 = Animated.loop(
      Animated.sequence([
        Animated.sequence([
          Animated.parallel([
            Animated.timing(haloOpacity1, { toValue: 0.6, duration: 2000, useNativeDriver: false }),
            Animated.timing(haloRadius1, { toValue: 80, duration: 2000, useNativeDriver: false }),
          ]),
          Animated.parallel([
            Animated.timing(haloOpacity1, { toValue: 0.3, duration: 2000, useNativeDriver: false }),
            Animated.timing(haloRadius1, { toValue: 50, duration: 2000, useNativeDriver: false }),
          ]),
        ]),
      ])
    );
    const pulse2 = Animated.loop(
      Animated.sequence([
        Animated.sequence([
          Animated.parallel([
            Animated.timing(haloOpacity2, { toValue: 0.6, duration: 2000, useNativeDriver: false }),
            Animated.timing(haloRadius2, { toValue: 80, duration: 2000, useNativeDriver: false }),
          ]),
          Animated.parallel([
            Animated.timing(haloOpacity2, { toValue: 0.4, duration: 2000, useNativeDriver: false }),
            Animated.timing(haloRadius2, { toValue: 60, duration: 2000, useNativeDriver: false }),
          ]),
        ]),
      ])
    );
    pulse1.start();
    pulse2.start();
  }, []);

  // 格式化时间
  const formatTime = (date) => {
    if (!date) return '--:--';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 获取月相图标
  const getMoonPhaseIcon = (phaseName) => {
    return 'moon';
  };

  // ─── Loading 状态 ──────────────────────────────────────────

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0D1E', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#DAA520" />
        <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 12 }}>加载天气数据...</Text>
      </View>
    );
  }

  // ─── 渲染 ──────────────────────────────────────────────────

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0F0D1E' }}>
      {/* 背景光晕装饰 */}
      <Animated.View style={{
        position: 'absolute', top: 0, right: 0, width: 192, height: 192, opacity: 0.4,
        backgroundColor: 'transparent',
        shadowColor: '#DAA520',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: haloOpacity1,
        shadowRadius: haloRadius1,
        elevation: 40,
      }} />
      <Animated.View style={{
        position: 'absolute', bottom: '33%', left: 0, width: 160, height: 160, opacity: 0.3,
        backgroundColor: 'transparent',
        shadowColor: '#DAA520',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: haloOpacity2,
        shadowRadius: haloRadius2,
        elevation: 30,
      }} />

      {/* ═══ 1. Weather Banner ═══ */}
      <View style={styles.weatherBanner}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 15, color: '#fff', fontWeight: '500' }}>
            {currentCity?.name || '北京'}
          </Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            更新时间 {Math.floor(Math.random() * 60)}分钟前
          </Text>
        </View>
        <Text style={{ fontSize: 48, fontWeight: '300', color: '#fff', letterSpacing: -0.3, marginTop: 8 }}>
          {Math.round(nowWeather?.temp || 25)}°
        </Text>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            {nowWeather?.text || '晴间多云'}
          </Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            H:{Math.round(nowWeather?.tempMax || 32)}°
          </Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            L:{Math.round(nowWeather?.tempMin || 18)}°
          </Text>
        </View>
      </View>

      {/* ═══ 2. 今日光质时间轴 ═══ */}
      <View style={styles.glassCard}>
        <Text style={styles.sectionTitle}>今日光质</Text>
        {/* 时间标签 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {['05:30', '08:30', '12:00', '17:30', '19:00', '19:45'].map((t, i) => (
            <Text key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{t}</Text>
          ))}
        </View>
        {/* 时间轴色条 */}
        <View style={{
          height: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10,
          marginVertical: 4, position: 'relative', overflow: 'hidden'
        }}>
          <View style={{ position: 'absolute', left: '0%', top: 0, height: '100%', width: '15%', backgroundColor: 'rgba(91,108,249,0.7)' }} />
          <View style={{ position: 'absolute', left: '15%', top: 0, height: '100%', width: '45%', backgroundColor: 'rgba(255,214,10,0.5)' }} />
          <View style={{ position: 'absolute', left: '60%', top: 0, height: '100%', width: '20%', backgroundColor: 'rgba(255,184,0,0.9)' }} />
          <View style={{ position: 'absolute', left: '80%', top: 0, height: '100%', width: '20%', backgroundColor: 'rgba(91,108,249,0.7)' }} />
          {/* 当前时间指示器 */}
          <View style={{ position: 'absolute', top: -3, left: '45%', width: 10, height: 26, backgroundColor: '#fff', borderRadius: 5 }} />
        </View>
        {/* 图例 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFB800' }} />
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>黄金 17:30-19:00</Text>
            <Text style={{ fontSize: 13, color: '#FFB800' }}>⏱2h34m</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#5B6CF9' }} />
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>蓝调 19:00-19:45</Text>
          </View>
        </View>
      </View>

      {/* ═══ 3. 7天详细预报 ═══ */}
      <View style={styles.glassCard}>
        <Text style={styles.sectionTitle}>7天预报</Text>
        {(dailyForecast || []).slice(0, 7).map((day, i) => {
          const low = parseInt(day.tempMin) || 0;
          const high = parseInt(day.tempMax) || 0;
          const range = (maxTemp || 35) - (minTemp || 15) || 1;
          return (
            <View key={i} style={[styles.dayDetailRow, i === 6 && { borderBottomWidth: 0 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ width: 40, fontSize: 14, color: '#fff' }}>
                  {day.day || (day.fxDate ? day.fxDate.slice(5) : '--')}
                </Text>
                <Text style={{ width: 28, fontSize: 18, textAlign: 'center' }}>
                  {getWeatherEmoji(day.textDay || day.text)}
                </Text>
                <View style={{
                  flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 2, overflow: 'hidden', position: 'relative'
                }}>
                  <View style={{
                    position: 'absolute',
                    left: `${((low - (minTemp || 15)) / range) * 100}%`,
                    top: 0, height: 4,
                    width: `${((high - low) / range) * 100}%`,
                    backgroundColor: '#FFB800', borderRadius: 2
                  }} />
                </View>
                <Text style={{ width: 28, fontSize: 14, color: '#fff', textAlign: 'right' }}>
                  {Math.round(high)}°
                </Text>
                <Text style={{ width: 28, fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'right' }}>
                  {Math.round(low)}°
                </Text>
              </View>
              {/* 子行：降水 + 云量 */}
              <View style={{ flexDirection: 'row', gap: 16, paddingLeft: 76 }}>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  💧 {day.precip || day.rain || '--'}%
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  ☁️ {day.cloud || day.cloudCover || '--'}%
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* ═══ 4. 环境指数 2×2 网格 ═══ */}
      <View style={styles.glassCard}>
        <Text style={styles.sectionTitle}>环境指数</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <View style={{ width: '48%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 10 }}>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>AQI</Text>
            <Text style={{ fontSize: 20, fontWeight: '600', color: getAqiColor(aqiData?.aqi) }}>
              {aqiData?.aqi || '--'}
            </Text>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              {aqiData?.category || '--'}
            </Text>
          </View>
          <View style={{ width: '48%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 10 }}>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>UV</Text>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#FFD60A' }}>
              {uvData?.uvIndex || '--'}
            </Text>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              {uvData?.level || '--'}
            </Text>
          </View>
          <View style={{ width: '48%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 10 }}>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>湿度</Text>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#fff' }}>
              {nowWeather?.humidity || '--'}%
            </Text>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>舒适</Text>
          </View>
          <View style={{ width: '48%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 10 }}>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>风速</Text>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#fff' }}>
              {nowWeather?.windScale || '--'}级
            </Text>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              {nowWeather?.windDir || '--'}
            </Text>
          </View>
        </View>
      </View>

      {/* 底部留白 */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── 样式表 ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  weatherBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
    backgroundColor: Surface.Surface1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: whiteAlpha(0.06),
  },
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
  dayDetailRow: {
    borderBottomWidth: 0.5,
    borderBottomColor: whiteAlpha(0.06),
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  tempCurveContainer: { height: 60, marginVertical: Spacing.sm, position: 'relative' },
  tempCurveDotHigh: { width: 8, height: 8, borderRadius: 4, backgroundColor: Brand.Gold, position: 'absolute' },
  tempCurveDotLow: { width: 8, height: 8, borderRadius: 4, backgroundColor: Accent.FrostCyan, position: 'absolute' },
  dayCard: {
    backgroundColor: Surface.Surface2, borderRadius: Radius.md, padding: Spacing.md,
    marginRight: Spacing.sm, minWidth: 80, alignItems: 'center',
    borderWidth: 1, borderColor: whiteAlpha(0.05),
  },
  dayCardActive: { borderColor: Brand.Gold, transform: [{ scale: 1.05 }] },
  dayCardEmoji: { fontSize: 24, marginVertical: 4 },
  dayCardName: { fontSize: FontSize.micro, color: TextColor.Tertiary, fontWeight: FontWeight.medium },
  dayCardTempHi: { fontSize: FontSize.body, color: TextColor.Primary, fontWeight: FontWeight.semiBold },
  dayCardTempLo: { fontSize: FontSize.caption, color: TextColor.Tertiary, marginTop: 1 },
  dayCardTempBar: { width: '80%', height: 3, backgroundColor: whiteAlpha(0.1), borderRadius: 1.5, marginTop: 4, overflow: 'hidden' },
  dayCardTempFill: { height: 3, backgroundColor: Brand.Gold, borderRadius: 1.5, position: 'absolute', top: 0 },
  envItem: { width: '48%', backgroundColor: Surface.Surface2, borderRadius: Radius.md, padding: Spacing.md },
  envItemLabel: { fontSize: FontSize.caption, color: TextColor.Tertiary },
  envItemValue: { fontSize: FontSize.h2, fontWeight: FontWeight.semiBold, color: TextColor.Primary },
  envItemSub: { fontSize: FontSize.micro, color: TextColor.Tertiary },
});
