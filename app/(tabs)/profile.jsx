import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Accent, Bg, TextColor, Spacing, Radius, FontSize, FontWeight, Surface, Brand, goldAlpha, auroraAlpha, whiteAlpha } from '../../styles/designTokens';
import { loadSettings, saveSettings } from '../../services/settingsService';

export default function ProfileScreen() {
  const [tempUnit, setTempUnit] = useState('°C');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [probabilityAlert, setProbabilityAlert] = useState(true);
  const [dailyForecast, setDailyForecast] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // 启动时加载设置
  useEffect(() => {
    loadSettings().then(settings => {
      setTempUnit(settings.tempUnit);
      setNotificationsEnabled(settings.notificationsEnabled);
      setProbabilityAlert(settings.probabilityAlert);
      setDailyForecast(settings.dailyForecast);
      setSettingsLoaded(true);
    });
  }, []);

  // 切换温度单位并持久化
  const handleToggleTempUnit = () => {
    const newUnit = tempUnit === '°C' ? '°F' : '°C';
    setTempUnit(newUnit);
    saveSettings({ tempUnit: newUnit });
  };

  // 切换通知设置并持久化
  const handleToggleNotification = (value) => {
    setNotificationsEnabled(value);
    saveSettings({ notificationsEnabled: value });
  };

  const handleToggleProbability = (value) => {
    setProbabilityAlert(value);
    saveSettings({ probabilityAlert: value });
  };

  const handleToggleDailyForecast = (value) => {
    setDailyForecast(value);
    saveSettings({ dailyForecast: value });
  };

  const currentCity = { name: '北京' };

  const settingItems = [
    {
      icon: 'thermometer-outline',
      label: '温度单位',
      desc: `当前：${tempUnit === '°C' ? '摄氏度' : '华氏度'}`,
      action: handleToggleTempUnit,
      badge: tempUnit,
    },
    {
      icon: 'language-outline',
      label: '语言',
      desc: '简体中文',
      badge: '中文',
    },
  ];

  const toggleItems = [
    { icon: 'notifications-outline', label: '通知推送', desc: '接收重要天气预警和概率提醒', value: notificationsEnabled, set: handleToggleNotification },
    { icon: 'alert-circle-outline', label: '高概率预警', desc: '收藏地点概率>70% 时推送', value: probabilityAlert, set: handleToggleProbability },
    { icon: 'sunny-outline', label: '每日预报', desc: '每天早上 8 点推送今日预报', value: dailyForecast, set: handleToggleDailyForecast },
  ];

  const aboutItems = [
    { icon: 'help-circle-outline', label: '帮助与反馈', color: '#FFD60A' },
    { icon: 'shield-checkmark-outline', label: '隐私政策', color: '#5B6CF9' },
    { icon: 'code-slash-outline', label: '开源许可', color: '#30D158' },
    { icon: 'information-circle-outline', label: '版本号', sub: 'v1.0.0', color: 'rgba(255,255,255,0.4)' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* 1. App 信息头部（设计稿 6.4.1） */}
        <View style={styles.appHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.appIcon}>🌤️</Text>
          </View>
          <Text style={styles.appName}>摄影爱好者</Text>
          <Text style={styles.appTagline}>预见金山，不负此行</Text>
        </View>

        {/* 1.5 统计数据胶囊（设计稿 6.4.2） */}
        <View style={styles.statsRow}>
          <View style={styles.statsCapsule}>
            <Text style={styles.statsNumber}>12</Text>
            <Text style={styles.statsLabel}>发帖数</Text>
          </View>
          <View style={styles.statsCapsule}>
            <Text style={styles.statsNumber}>348</Text>
            <Text style={styles.statsLabel}>获赞数</Text>
          </View>
          <View style={styles.statsCapsule}>
            <Text style={styles.statsNumber}>5</Text>
            <Text style={styles.statsLabel}>关注城市</Text>
          </View>
        </View>

        {/* 2. 城市管理 */}
        <View style={styles.glassCard}>
          <Text style={styles.sectionTitle}>📍 当前城市</Text>
          <View style={styles.cityRow}>
            <View style={styles.cityInfo}>
              <Ionicons name="location" size={18} color="#DAA520" />
              <Text style={styles.cityName}>{currentCity.name}</Text>
            </View>
            <TouchableOpacity style={styles.citySwitchBtn}>
              <Text style={styles.citySwitchText}>切换</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. 数据来源 */}
        <View style={[styles.glassCard, styles.dataSource]}>
          <Ionicons name="cloud-done-outline" size={20} color="rgba(255,255,255,0.5)" />
          <Text style={styles.dataSourceText}>数据来源：和风天气企业版</Text>
        </View>

        {/* 4. 设置选项 */}
        <View style={styles.glassCard}>
          <Text style={styles.sectionTitle}>⚙️ 设置</Text>
          {settingItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.settingRow, i < settingItems.length - 1 && styles.settingRowBorder]}
              onPress={item.action}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon} size={20} color="rgba(255,255,255,0.5)" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>{item.label}</Text>
                <Text style={styles.settingDesc}>{item.desc}</Text>
              </View>
              {item.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              ) : null}
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ))}
        </View>

        {/* 5. 通知开关 */}
        <View style={styles.glassCard}>
          <Text style={styles.sectionTitle}>🔔 通知</Text>
          {toggleItems.map((item, i) => (
            <View
              key={i}
              style={[styles.settingRow, i < toggleItems.length - 1 && styles.settingRowBorder]}
            >
              <Ionicons name={item.icon} size={20} color="rgba(255,255,255,0.5)" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>{item.label}</Text>
                <Text style={styles.settingDesc}>{item.desc}</Text>
              </View>
              <Switch
                value={item.value}
                onValueChange={item.set}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#DAA520' }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>

        {/* 6. 关于 */}
        <View style={styles.glassCard}>
          <Text style={styles.sectionTitle}>📋 关于</Text>
          {aboutItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.settingRow, i < aboutItems.length - 1 && styles.settingRowBorder]}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon} size={20} color={item.color} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>{item.label}</Text>
              </View>
              {item.sub ? (
                <Text style={styles.aboutSub}>{item.sub}</Text>
              ) : (
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* 7. 退出登录 */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={18} color="#FF375F" />
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>

        {/* 8. 底部 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>玩天气 · 预见金山不负此行</Text>
          <Text style={styles.footerCopy}>© 2026 PlayWeather Team</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== 样式 ====================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Surface.Base },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 100 },

  glassCard: {
    backgroundColor: 'rgba(18, 24, 42, 0.75)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: whiteAlpha(0.06),
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
    color: TextColor.Primary,
    marginBottom: Spacing.md,
  },

  // App 头部（大圆形头像 + 昵称 + 签名）
  appHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    backgroundColor: 'rgba(18, 24, 42, 0.75)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: whiteAlpha(0.06),
    marginBottom: Spacing.md,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Surface.Surface2,
    borderWidth: 3, borderColor: Brand.Gold,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  appIcon: { fontSize: 36 },
  appName: {
    fontSize: FontSize.h1, fontWeight: FontWeight.bold,
    color: TextColor.Primary, marginBottom: Spacing.xs,
  },
  appTagline: { fontSize: FontSize.body, color: TextColor.Secondary, marginBottom: Spacing.md },
  appVersion: { fontSize: FontSize.caption, color: TextColor.Disabled },

  // 统计数据胶囊
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-evenly',
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  statsCapsule: {
    flex: 1, alignItems: 'center', backgroundColor: Surface.Surface2,
    borderRadius: Radius.md, paddingVertical: Spacing.md,
    marginHorizontal: Spacing.xs,
    borderWidth: 1, borderColor: whiteAlpha(0.05),
  },
  statsNumber: { fontSize: FontSize.h3, fontWeight: FontWeight.bold, color: Brand.Gold },
  statsLabel: { fontSize: FontSize.micro, color: TextColor.Tertiary, marginTop: 2 },

  // 城市管理
  cityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cityInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cityName: { fontSize: FontSize.body, fontWeight: FontWeight.semiBold, color: TextColor.Primary },
  citySwitchBtn: {
    backgroundColor: goldAlpha(0.15), borderWidth: 1, borderColor: goldAlpha(0.25),
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full,
  },
  citySwitchText: { fontSize: FontSize.caption, color: Brand.Gold, fontWeight: FontWeight.semiBold },

  // 数据来源
  dataSource: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 14 },
  dataSourceText: { fontSize: FontSize.caption, color: TextColor.secondary },

  // 设置列表行
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: whiteAlpha(0.06), marginBottom: 1 },
  settingText: { flex: 1, marginLeft: Spacing.md },
  settingLabel: { fontSize: FontSize.body, fontWeight: FontWeight.medium, color: TextColor.Primary },
  settingDesc: { fontSize: FontSize.caption, color: TextColor.Tertiary, marginTop: 2 },

  // Badge 和 关于
  badge: {
    backgroundColor: goldAlpha(0.15), paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs, borderRadius: Radius.sm,
  },
  badgeText: { fontSize: FontSize.caption, color: Brand.Gold, fontWeight: FontWeight.semiBold },
  aboutSub: { fontSize: FontSize.caption, color: TextColor.Tertiary },

  // 退出登录
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: 'rgba(255,55,95,0.08)', borderWidth: 1, borderColor: 'rgba(255,55,95,0.2)',
    borderRadius: Radius.lg, paddingVertical: 14, marginTop: Spacing.xs, marginBottom: Spacing.md,
  },
  logoutText: { fontSize: FontSize.body, color: Accent.danger, fontWeight: FontWeight.medium },

  // 底部
  footer: { alignItems: 'center', paddingVertical: Spacing.lg },
  footerText: { fontSize: FontSize.caption, color: TextColor.muted },
  footerCopy: { fontSize: FontSize.micro, color: TextColor.muted, marginTop: 4 },
});
;
;
