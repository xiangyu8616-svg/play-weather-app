import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Accent, Bg, TextColor, Spacing, Radius, FontSize, FontWeight, Surface, Brand, goldAlpha, auroraAlpha, whiteAlpha } from '../../styles/designTokens';
import { loadSettings, saveSettings } from '../../services/settingsService';
import { localizeCityName } from '../../services/weather/cityNames';
import { useUserStore } from '../../stores/userStore';
import { useI18n, LANGUAGES } from '../../services/i18n';
import EmailLoginCard from '../../components/auth/EmailLoginCard';
import SocialLoginButtons from '../../components/auth/SocialLoginButtons';

export default function ProfileScreen() {
  const [tempUnit, setTempUnit] = useState('°C');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [probabilityAlert, setProbabilityAlert] = useState(true);
  const [dailyForecast, setDailyForecast] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // 用户登录态（Supabase Auth）
  const { user, profile, savedLocationCount, init, signOut, signInWithApple, signInWithGoogle } = useUserStore();

  // 多语言
  const { t, lang, setLang, init: initI18n } = useI18n();

  useEffect(() => {
    init();
    initI18n();
  }, []);

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

  // 语言切换（中文 ⇄ English）
  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
  const handleToggleLanguage = () => {
    const next = lang === 'zh' ? 'en' : 'zh';
    setLang(next);
  };

  const currentCity = { name: '北京' };

  const settingItems = [
    {
      icon: 'thermometer-outline',
      label: t('profile.tempUnit'),
      desc: t('profile.tempUnitCurrent', { unit: tempUnit === '°C' ? t('profile.tempUnitC') : t('profile.tempUnitF') }),
      action: handleToggleTempUnit,
      badge: tempUnit,
    },
    {
      icon: 'language-outline',
      label: t('profile.language'),
      desc: currentLang.label,
      badge: currentLang.short,
      action: handleToggleLanguage,
    },
  ];

  const toggleItems = [
    { icon: 'notifications-outline', label: t('profile.notifPush'), desc: t('profile.notifPushDesc'), value: notificationsEnabled, set: handleToggleNotification },
    { icon: 'alert-circle-outline', label: t('profile.notifAlert'), desc: t('profile.notifAlertDesc'), value: probabilityAlert, set: handleToggleProbability },
    { icon: 'sunny-outline', label: t('profile.notifDaily'), desc: t('profile.notifDailyDesc'), value: dailyForecast, set: handleToggleDailyForecast },
  ];

  const PRIVACY_URL = 'https://play-weather-app.vercel.app/privacy-policy.html';
  const CONTACT_MAIL = 'xiangyu.8616@gmail.com';

  const handleDeleteAccount = () => {
    Alert.alert(
      t('profile.deleteConfirmTitle'),
      t('profile.deleteConfirmMsg'),
      [
        { text: t('profile.cancel'), style: 'cancel' },
        {
          text: t('profile.confirmDelete'),
          style: 'destructive',
          onPress: () => Linking.openURL(
            `mailto:${CONTACT_MAIL}?subject=${encodeURIComponent('删除账号 Account Deletion')}&body=${encodeURIComponent(`注册邮箱 Registered email: ${user?.email || ''}`)}`
          ),
        },
      ]
    );
  };

  const aboutItems = [
    { icon: 'help-circle-outline', label: t('profile.help'), color: Accent.star, onPress: () => Linking.openURL(`mailto:${CONTACT_MAIL}?subject=${encodeURIComponent('玩天气反馈 PlayWeather Feedback')}`) },
    { icon: 'shield-checkmark-outline', label: t('profile.privacy'), color: '#5B6CF9', onPress: () => Linking.openURL(PRIVACY_URL) },
    { icon: 'code-slash-outline', label: t('profile.licenses'), color: Accent.success, onPress: () => Linking.openURL('https://github.com/xiangyu8616-svg/play-weather-app') },
    { icon: 'information-circle-outline', label: t('profile.version'), sub: 'v1.0.0', color: 'rgba(255,255,255,0.4)' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* 1. App 信息头部（设计稿 6.4.1） */}
        <View style={styles.appHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.appIcon}>{user ? '👤' : '🌤️'}</Text>
          </View>
          <Text style={styles.appName}>
            {user ? (profile?.nickname || user.email?.split('@')[0] || t('profile.appName')) : t('profile.appName')}
          </Text>
          <Text style={styles.appTagline}>
            {user ? user.email : t('profile.tagline')}
          </Text>
        </View>

        {/* 1.2 未登录时显示邮箱登录卡片 */}
        {!user && (
          <>
            <EmailLoginCard
              footer={
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginHorizontal: 12 }}>{t('profile.orUse')}</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                  </View>
                  <SocialLoginButtons
                    onApplePress={signInWithApple}
                    onGooglePress={signInWithGoogle}
                  />
                </>
              }
            />
          </>
        )}

        {/* 1.5 统计数据胶囊（设计稿 6.4.2） */}
        <View style={styles.statsRow}>
          <View style={styles.statsCapsule}>
            <Text style={styles.statsNumber}>—</Text>
            <Text style={styles.statsLabel}>{t('profile.posts')}</Text>
          </View>
          <View style={styles.statsCapsule}>
            <Text style={styles.statsNumber}>—</Text>
            <Text style={styles.statsLabel}>{t('profile.likes')}</Text>
          </View>
          <View style={styles.statsCapsule}>
            <Text style={styles.statsNumber}>{user ? savedLocationCount : '—'}</Text>
            <Text style={styles.statsLabel}>{t('profile.savedCities')}</Text>
          </View>
        </View>

        {/* 2. 城市管理 */}
        <View style={styles.glassCard}>
          <Text style={styles.sectionTitle}>{t('profile.currentCity')}</Text>
          <View style={styles.cityRow}>
            <View style={styles.cityInfo}>
              <Ionicons name="location" size={18} color="#DAA520" />
              <Text style={styles.cityName}>{localizeCityName(currentCity.name, lang)}</Text>
            </View>
            <TouchableOpacity style={styles.citySwitchBtn}>
              <Text style={styles.citySwitchText}>{t('profile.switchCity')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. 数据来源 */}
        <View style={[styles.glassCard, styles.dataSource]}>
          <Ionicons name="cloud-done-outline" size={20} color="rgba(255,255,255,0.5)" />
          <Text style={styles.dataSourceText}>{t('profile.dataSource')}</Text>
        </View>

        {/* 4. 设置选项 */}
        <View style={styles.glassCard}>
          <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
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
          <Text style={styles.sectionTitle}>{t('profile.notifications')}</Text>
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
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: Accent.star }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>

        {/* 6. 关于 */}
        <View style={styles.glassCard}>
          <Text style={styles.sectionTitle}>{t('profile.about')}</Text>
          {aboutItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.settingRow, i < aboutItems.length - 1 && styles.settingRowBorder]}
              activeOpacity={0.7}
              onPress={item.onPress}
              disabled={!item.onPress}
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
          {user && (
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.7} onPress={handleDeleteAccount}>
              <Ionicons name="trash-outline" size={20} color={Accent.danger} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: Accent.danger }]}>{t('profile.deleteAccount')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
            </TouchableOpacity>
          )}
        </View>

        {/* 7. 退出登录（仅登录后显示） */}
        {user && (
          <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7} onPress={signOut}>
            <Ionicons name="log-out-outline" size={18} color={Accent.danger} />
            <Text style={styles.logoutText}>{t('profile.logout')}</Text>
          </TouchableOpacity>
        )}

        {/* 8. 底部 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('profile.footer')}</Text>
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
    backgroundColor: Bg.glass,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: whiteAlpha(0.06),
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
    color: TextColor.primary,
    marginBottom: Spacing.md,
  },

  // App 头部（大圆形头像 + 昵称 + 签名）
  appHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    backgroundColor: Bg.glass,
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
    color: TextColor.primary, marginBottom: Spacing.xs,
  },
  appTagline: { fontSize: FontSize.body, color: TextColor.secondary, marginBottom: Spacing.md },
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
  cityName: { fontSize: FontSize.body, fontWeight: FontWeight.semiBold, color: TextColor.primary },
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
  settingLabel: { fontSize: FontSize.body, fontWeight: FontWeight.medium, color: TextColor.primary },
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
    backgroundColor: 'rgba(255,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(255,68,68,0.2)',
    borderRadius: Radius.lg, paddingVertical: 14, marginTop: Spacing.xs, marginBottom: Spacing.md,
  },
  logoutText: { fontSize: FontSize.body, color: Accent.danger, fontWeight: FontWeight.medium },

  // 底部
  footer: { alignItems: 'center', paddingVertical: Spacing.lg },
  footerText: { fontSize: FontSize.caption, color: TextColor.muted },
  footerCopy: { fontSize: FontSize.micro, color: TextColor.muted, marginTop: 4 },
});
