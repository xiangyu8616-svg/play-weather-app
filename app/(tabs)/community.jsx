import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Accent, Bg, TextColor, Spacing, Radius, FontSize, FontWeight, Brand, goldAlpha, whiteAlpha } from '../../styles/designTokens';
import { useI18n } from '../../services/i18n';

export default function CommunityScreen() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.comingSoonCard}>
          {/* Icon */}
          <View style={styles.iconWrapper}>
            <Ionicons name="rocket-outline" size={64} color={Brand.Gold} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{t('community.comingSoon')}</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            {t('community.subtitle')}
          </Text>

          {/* BackHomeHint Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.7}
          >
            <Ionicons name="home-outline" size={18} color={Brand.Gold} />
            <Text style={styles.backButtonText}>{t('community.backHome')}</Text>
          </TouchableOpacity>

          {/* 举报/联系入口（合规） */}
          <TouchableOpacity
            style={styles.reportLink}
            onPress={() => Linking.openURL(`mailto:xiangyu.8616@gmail.com?subject=${encodeURIComponent('内容举报 Content Report')}`)}
            activeOpacity={0.7}
          >
            <Ionicons name="flag-outline" size={14} color={TextColor.muted} />
            <Text style={styles.reportLinkText}>{t('community.report')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Bg.primary },
  scroll: { flex: 1 },
  scrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  comingSoonCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Bg.glass,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: whiteAlpha(0.06),
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    width: '100%',
    maxWidth: 340,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: goldAlpha(0.08),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: goldAlpha(0.15),
  },
  title: {
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
    color: TextColor.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.regular,
    color: TextColor.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: goldAlpha(0.3),
    backgroundColor: goldAlpha(0.06),
  },
  backButtonText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    color: Brand.Gold,
  },
  reportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  reportLinkText: {
    fontSize: FontSize.caption,
    color: TextColor.muted,
  },
});
