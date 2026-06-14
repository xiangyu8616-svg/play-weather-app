import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Brand, Accent, TextColor, Spacing, Radius, FontSize, FontWeight, goldAlpha, skyBlueAlpha } from '../../styles/designTokens';

/**
 * 天文面板 — 日出日落/月相（黄金时刻 & 蓝调时刻）
 */
export default function AstroPanel({ astronomyData, goldenCountdown }) {
  return (
    <>
      {/* 黄金时刻 */}
      <View style={styles.goldenHourInner}>
        <Text style={styles.goldenHourTitle}>
          🌅 黄金时刻 {astronomyData?.goldenHour?.start || '--'} - {astronomyData?.goldenHour?.end || '--'}
        </Text>
        <Text style={styles.goldenHourCountdown}>
          ⏱ 距离开始还有 {goldenCountdown}
        </Text>
      </View>

      {/* 蓝调时刻 */}
      <View style={[styles.goldenHourInner, { backgroundColor: skyBlueAlpha(0.08), borderColor: skyBlueAlpha(0.15) }]}>
        <Text style={[styles.goldenHourTitle, { color: Accent.SkyBlue }]}>
          🌆 蓝调时刻 {astronomyData?.blueHour?.start || '--'} - {astronomyData?.blueHour?.end || '--'}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  goldenHourInner: {
    backgroundColor: goldAlpha(0.08),
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 0.5,
    borderColor: goldAlpha(0.15),
  },
  goldenHourTitle: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    color: Brand.Gold,
  },
  goldenHourCountdown: {
    fontSize: FontSize.caption,
    color: TextColor.Secondary,
    marginTop: 4,
  },
});
