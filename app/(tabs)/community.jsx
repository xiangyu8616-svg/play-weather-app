import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Accent, TextColor, Spacing, Radius, FontSize, FontWeight, Brand, goldAlpha, whiteAlpha } from '../../styles/designTokens';

export default function CommunityScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.comingSoonCard}>
          {/* Icon */}
          <View style={styles.iconWrapper}>
            <Ionicons name="rocket-outline" size={64} color={Brand.Gold} />
          </View>

          {/* Title */}
          <Text style={styles.title}>社区即将上线</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            我们正在打造摄影天气社区，敬请期待
          </Text>

          {/* BackHomeHint Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.7}
          >
            <Ionicons name="home-outline" size={18} color={Brand.Gold} />
            <Text style={styles.backButtonText}>返回首页</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E17' },
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
    backgroundColor: 'rgba(18, 24, 42, 0.75)',
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
    color: TextColor.Primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.regular,
    color: TextColor.Secondary,
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
});
