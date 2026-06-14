import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Brand, TextColor, Spacing, Radius, FontSize, FontWeight, goldAlpha, whiteAlpha } from '../../styles/designTokens';
import AstroPanel from './AstroPanel';

/**
 * 摄影时机面板 — golden hour / blue hour
 */
export default function PhotoTimingPanel({
  photoScore,
  cloudCover,
  visibility,
  nowWeather,
  astronomyData,
  goldenCountdown,
}) {
  return (
    <View style={[styles.glassCard, { borderLeftWidth: 4, borderLeftColor: Brand.Gold }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={styles.sectionTitle}>📷 摄影条件</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 15, color: '#30D158', fontWeight: '600' }}>
            {photoScore || '--'}分
          </Text>
          <Text style={{ fontSize: 13, color: '#30D158' }}>👍</Text>
        </View>
      </View>

      {/* 天文面板：黄金时刻 + 蓝调时刻 */}
      <AstroPanel astronomyData={astronomyData} goldenCountdown={goldenCountdown} />

      {/* 指标行 */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 }}>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>☁️ 云量 {cloudCover}%</Text>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>👁 能见度 {visibility}km</Text>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>💧 {nowWeather?.humidity || '--'}%</Text>
      </View>
    </View>
  );
}

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
});
