import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Accent, Surface, TextColor, Spacing, Radius, Shadow, FontSize, FontWeight, goldAlpha, whiteAlpha, skyBlueAlpha } from '../styles/designTokens';

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

function getAqiColor(aqi) {
  if (!aqi) return '#888';
  if (aqi <= 50) return '#30D158';
  if (aqi <= 100) return '#FFD60A';
  if (aqi <= 150) return '#FF9F0A';
  if (aqi <= 200) return '#FF375F';
  if (aqi <= 300) return '#BF5AF2';
  return '#8B0000';
}

// ==================== 组件 ====================

/**
 * 实时天气卡片 — 温度/天气状况/AQI/体感等
 */
export default function WeatherCard({
  nowWeather,
  dailyForecast,
  hourlyForecast,
  aqiData,
  responsiveTempSize,
  cloudCover,
  visibility,
}) {
  return (
    <>
      {/* 当前天气区域（主卡片 + 金色光晕） */}
      <View style={styles.currentWeatherArea}>
        <Text style={[styles.tempBig, { fontSize: responsiveTempSize, lineHeight: responsiveTempSize * 1.05 }]}>
          {Math.round(parseInt(nowWeather?.temp) || 25)}°
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <Text style={styles.weatherIcon}>{getWeatherEmoji(nowWeather?.text)}</Text>
          <Text style={styles.weatherConditionText}>{nowWeather?.text || '晴间多云'}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
          <Text style={styles.weatherHiLo}>
            H:{Math.round(parseInt(dailyForecast?.[0]?.tempMax) || 32)}°
          </Text>
          <Text style={styles.weatherHiLo}>
            L:{Math.round(parseInt(dailyForecast?.[0]?.tempMin) || 18)}°
          </Text>
        </View>
        <Text style={styles.weatherFeels}>
          体感 {Math.round(parseInt(nowWeather?.feelsLike) || 25)}°
        </Text>
        {/* 2×3 天气指标网格 */}
        <View style={styles.metricsGrid}>
          {[
            { emoji: '💧', label: '湿度', value: `${nowWeather?.humidity || '--'}%` },
            { emoji: '🌬', label: '风速', value: `${nowWeather?.windSpeed || '--'}km/h` },
            { emoji: '👁', label: '能见度', value: `${visibility}km` },
            { emoji: '📊', label: '气压', value: `${nowWeather?.pressure || '--'}hPa` },
            { emoji: '🌡', label: '体感', value: `${Math.round(parseInt(nowWeather?.feelsLike) || 25)}°` },
            { emoji: '💦', label: '降水', value: `${nowWeather?.precip || dailyForecast?.[0]?.precip || '--'}mm` },
          ].map((m, i) => (
            <View key={i} style={styles.metricItem}>
              <Text style={styles.metricEmoji}>{m.emoji}</Text>
              <Text style={styles.metricValue}>{m.value}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 24小时预报 — 玻璃卡片 */}
      <View style={styles.glassCard}>
        <Text style={styles.sectionTitle}>24小时预报</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(hourlyForecast || []).slice(0, 24).map((h, i) => (
            <View key={i} style={{ alignItems: 'center', marginRight: 16, minWidth: 44 }}>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                {h.hour != null ? h.hour : '--'}:00
              </Text>
              <Text style={{ fontSize: 20, marginVertical: 4 }}>
                {getWeatherEmoji(h.text)}
              </Text>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>
                {Math.round(h.temp)}°
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 空气质量 — 玻璃卡片 */}
      <View style={styles.glassCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={styles.sectionTitle}>空气质量</Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>详情 ›</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: getAqiColor(aqiData?.aqi),
            justifyContent: 'center', alignItems: 'center',
          }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>
              {aqiData?.aqi || '--'}
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 16, color: '#fff', fontWeight: '500' }}>
              {aqiData?.category || '--'}
            </Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              首要污染物: {aqiData?.primary || '--'}
            </Text>
          </View>
        </View>
      </View>
    </>
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

  // 当前天气区域
  currentWeatherArea: {
    ...Shadow.goldGlow,
    backgroundColor: Surface.Surface1,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: goldAlpha(0.1),
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  tempBig: {
    fontWeight: FontWeight.light,
    color: TextColor.Primary,
    letterSpacing: -0.5,
  },
  weatherIcon: {
    fontSize: 36,
  },
  weatherConditionText: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.regular,
    color: TextColor.Primary,
  },
  weatherHiLo: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.regular,
    color: TextColor.Secondary,
  },
  weatherFeels: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.regular,
    color: TextColor.Tertiary,
  },

  // 天气指标网格 2×3
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: whiteAlpha(0.06),
    paddingTop: Spacing.md,
  },
  metricItem: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  metricEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    color: TextColor.Primary,
  },
  metricLabel: {
    fontSize: FontSize.caption,
    color: TextColor.Tertiary,
    marginTop: 1,
  },
});
