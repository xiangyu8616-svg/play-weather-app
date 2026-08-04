import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import qweatherService from '../../services/weather/qweatherService';
import astronomyService from '../../services/astronomyService';
import weatherService from '../../services/weather/weatherService';
import { getWeatherIconName } from '../../services/weather/weatherIcons';
import { useI18n } from '../../services/i18n';
import {
  Bg, Accent, TextColor, Spacing, Radius,
  FontSize, FontWeight, FontFamily, auroraAlpha, whiteAlpha,
  Shadow, CardStyle, getWeatherBackground, getWeatherIconColor,
} from '../../styles/designTokens';

// ═══════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════

function getAqiColor(aqi) {
  if (!aqi) return TextColor.muted;
  if (aqi <= 50) return Accent.success;
  if (aqi <= 100) return Accent.star;
  if (aqi <= 150) return '#FF9F0A';
  if (aqi <= 200) return Accent.danger;
  return '#8B0000';
}

// ═══════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════

export default function ForecastScreen() {
  const { t, lang } = useI18n();
  const [selectedDay, setSelectedDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [astronomyData, setAstronomyData] = useState(null);
  const [aqiData, setAqiData] = useState(null);
  const [uvData, setUvData] = useState(null);
  const [nowWeather, setNowWeather] = useState(null);
  const [dailyForecast, setDailyForecast] = useState([]);
  // 错误态：false=正常 | 'network'=加载失败 | 'quota'=API 配额耗尽
  const [loadError, setLoadError] = useState(false);

  const currentCity = { name: lang === 'en' ? 'Beijing' : '北京' };
  const LOCATION = { lat: 39.9042, lng: 116.4074, cityId: '101010100', name: '北京市' };

  const maxTemp = useMemo(() => {
    if (!dailyForecast || dailyForecast.length === 0) return 35;
    return Math.max(...dailyForecast.map(d => parseInt(d.tempMax) || 0));
  }, [dailyForecast]);

  const minTemp = useMemo(() => {
    if (!dailyForecast || dailyForecast.length === 0) return 15;
    return Math.min(...dailyForecast.map(d => parseInt(d.tempMin) || 0));
  }, [dailyForecast]);

  const formatDay = (dateStr, index) => {
    if (index === 0) return t('forecast.today');
    if (index === 1) return t('forecast.tomorrow');
    const date = new Date(dateStr);
    const weekdays = t('forecast.weekdays');
    return weekdays[date.getDay()];
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const forecastData = (dailyForecast || []).map((item, index) => ({
    day: formatDay(item.fxDate, index),
    date: formatDate(item.fxDate),
    condition: item.textDay || t('forecast.defaultCondition'),
    high: parseInt(item.tempMax) || 0,
    low: parseInt(item.tempMin) || 0,
    rain: Math.min(100, Math.round(parseFloat(item.precip || 0) * 10)),
    wind: t('forecast.windLevel', { dir: item.windDirDay || '', scale: item.windScaleDay || '' }),
    icon: getWeatherIconName(item.textDay, false, item.iconDay),
  }));

  useEffect(() => {
    loadWeatherData();
    loadAstronomyData();
  }, []);

  async function loadWeatherData() {
    try {
      setLoadError(false);
      const [weather, forecast] = await Promise.all([
        qweatherService.getNowWeather(LOCATION.cityId),
        qweatherService.getDailyForecast(LOCATION.cityId, 7),
      ]);
      setNowWeather(weather);
      setDailyForecast(forecast);
      // 服务层内部回退 mock 时不抛错，这里显式检查配额标记
      if (qweatherService.wasQuotaExceeded()) setLoadError('quota');
    } catch (error) {
      console.error('加载天气数据失败:', error);
      setLoadError('network');
      setNowWeather(qweatherService.generateMockNowWeather());
      setDailyForecast(qweatherService.generateMockDailyForecast());
    } finally {
      setLoading(false);
    }
  }

  async function loadAstronomyData() {
    try {
      const now = new Date();
      const [sunTimes, moonPhase, moonTimes, photoTimes, aqi, uv] = await Promise.all([
        astronomyService.getSunTimes(now, LOCATION.lat, LOCATION.lng),
        astronomyService.getMoonPhase(now),
        astronomyService.getMoonTimes(now, LOCATION.lat, LOCATION.lng),
        astronomyService.getPhotographyTimes(now, LOCATION.lat, LOCATION.lng),
        weatherService.getAQI(LOCATION.cityId),
        weatherService.getUVIndex(LOCATION.cityId),
      ]);
      setAstronomyData({ sunTimes, moonPhase, moonTimes, photoTimes });
      setAqiData(aqi);
      setUvData(uv);
    } catch {
      const en = lang === 'en';
      setAqiData({ aqi: 75, category: en ? 'Moderate' : '良', primaryPollutant: 'PM2.5' });
      setUvData({ uvIndex: 5, level: en ? 'Moderate' : '中等', advice: en ? 'Wear sunscreen and a hat' : '建议涂抹防晒霜，佩戴帽子' });
    }
  }

  const formatTime = (date) => {
    if (!date) return '--:--';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Bg.primary, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Accent.aurora} />
        <Text style={{ color: TextColor.secondary, marginTop: 12 }}>{t('forecast.loading')}</Text>
      </View>
    );
  }

  const temp = Math.round(nowWeather?.temp || 25);
  const bgColors = getWeatherBackground(nowWeather?.text, nowWeather?.code);
  const range = (maxTemp || 35) - (minTemp || 15) || 1;

  return (
    <LinearGradient colors={bgColors} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ═══ 0. 错误横幅（加载失败/配额耗尽，可重试）═══ */}
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
              onPress={() => { loadWeatherData(); loadAstronomyData(); }}
              activeOpacity={0.7}
            >
              <Text style={styles.errorRetryText}>{t('states.retry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ═══ 1. 天气横幅 ═══ */}
        <View style={styles.weatherBanner}>
          <View style={styles.bannerHeader}>
            <Text style={styles.bannerCity}>{currentCity.name}</Text>
            <Text style={styles.bannerUpdate}>{t('forecast.liveUpdate')}</Text>
          </View>
          <View style={styles.bannerMain}>
            <Text style={styles.bannerTemp}>{temp}°</Text>
            <View style={styles.bannerCondition}>
              <Ionicons name={getWeatherIconName(nowWeather?.text, false, nowWeather?.icon)} size={20} color={getWeatherIconColor(nowWeather?.text)} />
              <Text style={styles.bannerConditionText}>{nowWeather?.text || t('forecast.defaultCondition')}</Text>
            </View>
          </View>
          <View style={styles.bannerHiLo}>
            <Text style={styles.bannerHiLoText}>H:{Math.round(nowWeather?.tempMax || 32)}°  L:{Math.round(nowWeather?.tempMin || 18)}°</Text>
            <Text style={styles.bannerFeels}>{t('forecast.feelsLike', { t: Math.round(parseInt(nowWeather?.feelsLike) || temp) })}</Text>
          </View>
        </View>

        {/* ═══ 2. 光质时间轴 ═══ */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={16} color={Accent.star} />
            <Text style={styles.cardTitle}>{t('forecast.lightTitle')}</Text>
          </View>
          {/* 时间段 */}
          <View style={styles.timelineLabels}>
            {['05:30', '08:30', '12:00', '17:30', '19:00', '19:45'].map((t, i) => (
              <Text key={i} style={styles.timelineLabel}>{t}</Text>
            ))}
          </View>
          {/* 色条 */}
          <View style={styles.timelineBar}>
            <View style={[styles.timelineSegment, { left: '0%', width: '15%', backgroundColor: 'rgba(96,165,250,0.6)' }]} />
            <View style={[styles.timelineSegment, { left: '15%', width: '45%', backgroundColor: 'rgba(255,215,0,0.35)' }]} />
            <View style={[styles.timelineSegment, { left: '60%', width: '20%', backgroundColor: 'rgba(255,215,0,0.7)' }]} />
            <View style={[styles.timelineSegment, { left: '80%', width: '20%', backgroundColor: 'rgba(96,165,250,0.6)' }]} />
            <View style={styles.timelineCursor} />
          </View>
          {/* 图例 */}
          <View style={styles.timelineLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Accent.star }]} />
              <Text style={styles.legendText}>{t('forecast.goldenLegend', { range: '17:30-19:00' })}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#60A5FA' }]} />
              <Text style={styles.legendText}>{t('forecast.blueLegend', { range: '19:00-19:45' })}</Text>
            </View>
          </View>
        </View>

        {/* ═══ 3. 7天预报 ═══ */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={16} color={Accent.aurora} />
            <Text style={styles.cardTitle}>{t('forecast.days7')}</Text>
          </View>
          {forecastData.slice(0, 7).map((day, i) => (
            <View key={i} style={[styles.dayRow, i === 6 && { borderBottomWidth: 0 }]}>
              <View style={styles.dayMain}>
                <Text style={styles.dayName}>{day.day}</Text>
                <Text style={styles.dayDate}>{day.date}</Text>
                <Ionicons name={day.icon} size={18} color={getWeatherIconColor(day.condition)} style={styles.dayIcon} />
                {/* 温度条 */}
                <View style={styles.tempBarBg}>
                  <View style={[styles.tempBarFill, {
                    left: `${((day.low - minTemp) / range) * 100}%`,
                    width: `${((day.high - day.low) / range) * 100}%`,
                  }]} />
                </View>
                <Text style={styles.dayHigh}>{day.high}°</Text>
                <Text style={styles.dayLow}>{day.low}°</Text>
              </View>
              <View style={styles.daySub}>
                <View style={styles.daySubItem}>
                  <Ionicons name="water-outline" size={12} color={TextColor.muted} />
                  <Text style={styles.daySubText}>{day.rain || '--'}%</Text>
                </View>
                <View style={styles.daySubItem}>
                  <Ionicons name="cloud-outline" size={12} color={TextColor.muted} />
                  <Text style={styles.daySubText}>{day.wind}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ═══ 4. 环境指数 ═══ */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="leaf-outline" size={16} color={Accent.success} />
            <Text style={styles.cardTitle}>{t('forecast.envTitle')}</Text>
          </View>
          <View style={styles.envGrid}>
            <EnvItem label="AQI" value={aqiData?.aqi || '--'} sub={aqiData?.category || '--'} color={getAqiColor(aqiData?.aqi)} icon="skull-outline" />
            <EnvItem label="UV" value={uvData?.uvIndex || '--'} sub={uvData?.level || '--'} color={Accent.star} icon="sunny-outline" />
            <EnvItem label={t('forecast.humidity')} value={`${nowWeather?.humidity || '--'}%`} sub={t('forecast.comfort')} color={TextColor.primary} icon="water-outline" />
            <EnvItem label={t('forecast.wind')} value={t('forecast.windLevel', { dir: '', scale: nowWeather?.windScale || '--' })} sub={nowWeather?.windDir || '--'} color={TextColor.primary} icon="speedometer-outline" />
          </View>
        </View>

        {/* 底部留白 */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

// ═══════════════════════════════════════════
// 子组件
// ═══════════════════════════════════════════

function EnvItem({ label, value, sub, color, icon }) {
  return (
    <View style={styles.envItem}>
      <View style={styles.envItemHeader}>
        <Ionicons name={icon} size={14} color={TextColor.muted} />
        <Text style={styles.envItemLabel}>{label}</Text>
      </View>
      <Text style={[styles.envItemValue, { color }]}>{value}</Text>
      <Text style={styles.envItemSub}>{sub}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════
// 样式表
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  // ── 错误横幅 ──
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
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

  // ── 天气横幅 ──
  weatherBanner: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(18, 18, 26, 0.50)',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 0.5,
    borderColor: whiteAlpha(0.06),
  },
  bannerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  bannerCity: {
    fontSize: FontSize.body,
    color: TextColor.primary,
    fontWeight: FontWeight.medium,
  },
  bannerUpdate: {
    fontSize: FontSize.micro,
    color: TextColor.muted,
  },
  bannerMain: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginTop: Spacing.md,
  },
  bannerTemp: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.light,
    color: TextColor.primary,
    letterSpacing: -1,
  },
  bannerCondition: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  bannerConditionText: {
    fontSize: FontSize.body,
    color: TextColor.primary,
    fontWeight: FontWeight.medium,
  },
  bannerHiLo: {
    flexDirection: 'row', gap: 12,
    marginTop: Spacing.xs,
  },
  bannerHiLoText: {
    fontSize: FontSize.caption,
    color: TextColor.secondary,
  },
  bannerFeels: {
    fontSize: FontSize.caption,
    color: TextColor.muted,
  },

  // ── 卡片 ──
  card: {
    ...CardStyle,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
    color: TextColor.primary,
    letterSpacing: 0.3,
  },

  // ── 时间轴 ──
  timelineLabels: {
    flexDirection: 'row', justifyContent: 'space-between',
  },
  timelineLabel: {
    fontSize: FontSize.micro,
    color: TextColor.muted,
    fontFamily: FontFamily.mono,
  },
  timelineBar: {
    height: 20,
    backgroundColor: whiteAlpha(0.06),
    borderRadius: Radius.full,
    marginVertical: Spacing.xs,
    position: 'relative',
    overflow: 'hidden',
  },
  timelineSegment: {
    position: 'absolute', top: 0, height: '100%',
  },
  timelineCursor: {
    position: 'absolute', top: -3,
    left: '45%', width: 10, height: 26,
    backgroundColor: TextColor.primary,
    borderRadius: 5,
  },
  timelineLegend: {
    flexDirection: 'row', gap: 16, marginTop: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  legendDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  legendText: {
    fontSize: FontSize.caption,
    color: TextColor.secondary,
  },

  // ── 7天预报 ──
  dayRow: {
    borderBottomWidth: 0.5,
    borderBottomColor: whiteAlpha(0.06),
    paddingVertical: Spacing.sm,
  },
  dayMain: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  dayName: {
    width: 40,
    fontSize: FontSize.body,
    color: TextColor.primary,
    fontWeight: FontWeight.medium,
  },
  dayDate: {
    width: 36,
    fontSize: FontSize.caption,
    color: TextColor.muted,
  },
  dayIcon: {
    width: 24, textAlign: 'center',
  },
  tempBarBg: {
    flex: 1, height: 4,
    backgroundColor: whiteAlpha(0.08),
    borderRadius: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  tempBarFill: {
    position: 'absolute', top: 0, height: 4,
    backgroundColor: Accent.star, borderRadius: 2,
  },
  dayHigh: {
    width: 32,
    fontSize: FontSize.body,
    color: TextColor.primary,
    fontWeight: FontWeight.semiBold,
    textAlign: 'right',
  },
  dayLow: {
    width: 32,
    fontSize: FontSize.caption,
    color: TextColor.muted,
    textAlign: 'right',
  },
  daySub: {
    flexDirection: 'row', gap: 16,
    paddingLeft: 86,
    marginTop: 4,
  },
  daySubItem: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  daySubText: {
    fontSize: FontSize.micro,
    color: TextColor.muted,
  },

  // ── 环境指数 ──
  envGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
  },
  envItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  envItemHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 4,
  },
  envItemLabel: {
    fontSize: FontSize.caption,
    color: TextColor.muted,
  },
  envItemValue: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.semiBold,
  },
  envItemSub: {
    fontSize: FontSize.micro,
    color: TextColor.muted,
    marginTop: 2,
  },
});
