/**
 * 社交登录按钮组（Apple Sign-In + Google Sign-In）
 *
 * 说明：
 * - Apple Sign-In 依赖 expo-apple-authentication（iOS 14+ / macOS / Android 备用）
 * - Google Sign-In 依赖 expo-auth-session + expo-web-browser
 * - 两个包都还没安装时，按钮显示"配置中"提示
 *
 * Apple 按钮样式严格遵循 Apple HIG：
 * https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Spacing, Radius, FontSize, FontWeight, TextColor, whiteAlpha } from '../../styles/designTokens';

// 尝试动态导入，未安装时优雅降级
let AppleAuthentication = null;
let AuthSession = null;
try {
  AppleAuthentication = require('expo-apple-authentication');
} catch { /* 未安装 expo-apple-authentication */ }
try {
  AuthSession = require('expo-auth-session');
} catch { /* 未安装 expo-auth-session */ }

export default function SocialLoginButtons({ onApplePress, onGooglePress, loading }) {
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isAppleAvailable = !!AppleAuthentication;
  const isGoogleAvailable = !!AuthSession;

  const handleApple = async () => {
    if (!isAppleAvailable || appleLoading) return;
    setAppleLoading(true);
    try {
      await onApplePress?.();
    } finally {
      setAppleLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!isGoogleAvailable || googleLoading) return;
    setGoogleLoading(true);
    try {
      await onGooglePress?.();
    } finally {
      setGoogleLoading(false);
    }
  };

  // 如果两个包都没装，显示提示
  if (!isAppleAvailable && !isGoogleAvailable) {
    return (
      <View style={styles.hintBox}>
        <Text style={styles.hintText}>
          一键登录待配置：npm install expo-apple-authentication expo-auth-session expo-web-browser
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Apple Sign-In（iOS/macOS 显示；Android 不显示） */}
      {isAppleAvailable && (Platform.OS === 'ios' || Platform.OS === 'macos') && (
        <TouchableOpacity
          style={styles.appleBtn}
          onPress={handleApple}
          disabled={appleLoading || loading}
          activeOpacity={0.8}
        >
          {appleLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.btnRow}>
              {/* Apple Logo 用 Unicode 字符代替（避免额外依赖） */}
              <Text style={styles.appleLogo}></Text>
              <Text style={styles.appleText}>使用 Apple 登录</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Google Sign-In（全平台显示） */}
      {isGoogleAvailable && (
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleGoogle}
          disabled={googleLoading || loading}
          activeOpacity={0.8}
        >
          {googleLoading ? (
            <ActivityIndicator color="#444" />
          ) : (
            <View style={styles.btnRow}>
              <Text style={styles.googleLogo}>G</Text>
              <Text style={styles.googleText}>使用 Google 登录</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm, marginTop: Spacing.md },

  // Apple HIG 规范：黑色背景 + 白色文字 + 圆角 8
  appleBtn: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleLogo: { fontSize: 18, color: '#fff', marginRight: 8, lineHeight: 22 },
  appleText: { fontSize: FontSize.body, fontWeight: FontWeight.semiBold, color: '#fff' },

  // Google 标准按钮：白色背景 + 灰色边框 + 深色文字
  googleBtn: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  googleLogo: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: '#4285F4',
    marginRight: 8,
    lineHeight: 22,
  },
  googleText: { fontSize: FontSize.body, fontWeight: FontWeight.semiBold, color: '#444' },

  btnRow: { flexDirection: 'row', alignItems: 'center' },

  hintBox: {
    backgroundColor: 'rgba(255,193,7,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.3)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  hintText: {
    fontSize: FontSize.caption,
    color: '#FFC107',
    textAlign: 'center',
  },
});
