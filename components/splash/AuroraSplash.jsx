import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Bg, Accent } from '../../styles/designTokens';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ═══════════════════════════════════════════
// 极光粒子配置
// ═══════════════════════════════════════════

const PARTICLE_COUNT = 24;

function createParticles() {
  const particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      id: i,
      x: Math.random() * SCREEN_W,
      size: Math.random() * 3 + 1.5,
      delay: Math.random() * 1200,
      duration: Math.random() * 2000 + 2500,
      swayAmount: Math.random() * 40 + 20,
      opacity: Math.random() * 0.5 + 0.2,
    });
  }
  return particles;
}

// ═══════════════════════════════════════════
// 单个粒子组件
// ═══════════════════════════════════════════

function AuroraParticle({ x, size, delay, duration, swayAmount, opacity }) {
  const progress = useSharedValue(0);
  const sway = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.quad) })
    );
    sway.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: duration * 0.4, easing: Easing.inOut(Easing.sin) }),
          withTiming(-1, { duration: duration * 0.4, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const y = interpolate(progress.value, [0, 1], [SCREEN_H * 0.85, -size * 2]);
    const sx = x + sway.value * swayAmount;
    const fade = interpolate(progress.value, [0, 0.15, 0.85, 1], [0, opacity, opacity * 0.6, 0]);
    const scale = interpolate(progress.value, [0, 0.2, 0.8, 1], [0.3, 1, 1, 0.5]);

    return {
      transform: [{ translateX: sx }, { translateY: y }, { scale }],
      opacity: fade,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        { width: size, height: size, borderRadius: size / 2 },
        animatedStyle,
      ]}
    />
  );
}

// ═══════════════════════════════════════════
// 极光光带（底部渐变辉光）
// ═══════════════════════════════════════════

function AuroraGlow() {
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    glowOpacity.value = withTiming(0.6, { duration: 1500, easing: Easing.out(Easing.quad) });
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View style={[styles.auroraGlow, style]}>
      <View style={styles.glowLayer1} />
      <View style={styles.glowLayer2} />
    </Animated.View>
  );
}

// ═══════════════════════════════════════════
// 主启动屏
// ═══════════════════════════════════════════

export default function AuroraSplash({ onComplete }) {
  const [particles] = useState(() => createParticles());
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    // Logo 淡入 + 放大
    logoOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    logoScale.value = withDelay(300, withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.5)) }));

    // 2.5秒后整体淡出
    const timer = setTimeout(() => {
      containerOpacity.value = withTiming(0, { duration: 600 }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      });
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* 背景 */}
      <View style={styles.bg} />

      {/* 极光粒子 */}
      {particles.map((p) => (
        <AuroraParticle key={p.id} {...p} />
      ))}

      {/* 底部极光光带 */}
      <AuroraGlow />

      {/* Logo / 品牌 */}
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <View style={styles.logoCircle}>
          <View style={styles.logoInner} />
        </View>
        <View style={styles.brandRow}>
          <View style={styles.auroraLine} />
          <View style={styles.brandTextWrap}>
            <Text style={styles.brandTitle}>玩天气</Text>
            <Text style={styles.brandSub}>预见极光 · 不负此行</Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════
// 样式
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Bg.primary,
  },

  // ── 粒子 ──
  particle: {
    position: 'absolute',
    backgroundColor: Accent.aurora,
    shadowColor: Accent.aurora,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },

  // ── 底部光带 ──
  auroraGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_H * 0.35,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  glowLayer1: {
    position: 'absolute',
    bottom: -40,
    width: SCREEN_W * 1.4,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0, 212, 170, 0.08)',
    transform: [{ scaleX: 1.2 }],
  },
  glowLayer2: {
    position: 'absolute',
    bottom: -20,
    width: SCREEN_W,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 212, 170, 0.12)',
  },

  // ── Logo ──
  logoWrap: {
    alignItems: 'center',
    zIndex: 10,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(0, 212, 170, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Accent.aurora,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  logoInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Accent.aurora,
    shadowColor: Accent.aurora,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  auroraLine: {
    width: 3,
    height: 40,
    borderRadius: 2,
    backgroundColor: Accent.aurora,
    shadowColor: Accent.aurora,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  brandTextWrap: {
    alignItems: 'flex-start',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 2,
  },
  brandSub: {
    fontSize: 13,
    color: 'rgba(148, 163, 184, 0.8)',
    marginTop: 4,
    letterSpacing: 1,
  },
});
