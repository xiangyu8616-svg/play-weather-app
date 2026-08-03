/**
 * 邮箱 OTP 登录卡片
 *
 * 流程：输入邮箱 → 发送验证码 → 输入 6 位验证码 → 登录
 * 样式沿用 designTokens 的 glassCard 风格，可直接嵌入各页面。
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius, FontSize, FontWeight, Surface, Brand, TextColor, goldAlpha, whiteAlpha } from '../../styles/designTokens';
import { useUserStore } from '../../stores/userStore';

const RESEND_COOLDOWN = 60; // 秒

export default function EmailLoginCard({ footer }) {
  const { sendEmailCode, verifyEmailCode, sending, verifying } = useUserStore();

  const [step, setStep] = useState('email'); // 'email' | 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSend = async () => {
    if (!isEmailValid || sending) return;
    setError('');
    const res = await sendEmailCode(email.trim());
    if (res.ok) {
      setStep('code');
      startCooldown();
    } else {
      setError(res.error);
    }
  };

  const handleVerify = async () => {
    if (code.trim().length !== 6 || verifying) return;
    setError('');
    const res = await verifyEmailCode(email.trim(), code.trim());
    if (!res.ok) setError(res.error);
    // 成功时 userStore 会更新 user，父组件自动切换为已登录视图
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>📮 邮箱登录</Text>
      <Text style={styles.desc}>
        {step === 'email'
          ? '输入邮箱，接收 6 位验证码（无需密码）'
          : `验证码已发送至 ${email}，10 分钟内有效`}
      </Text>

      {step === 'email' ? (
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={TextColor.Tertiary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      ) : (
        <TextInput
          style={[styles.input, styles.codeInput]}
          placeholder="6 位验证码"
          placeholderTextColor={TextColor.Tertiary}
          value={code}
          onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {step === 'email' ? (
        <TouchableOpacity
          style={[styles.primaryBtn, (!isEmailValid || sending) && styles.btnDisabled]}
          onPress={handleSend}
          disabled={!isEmailValid || sending}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator color="#1A1206" />
          ) : (
            <Text style={styles.primaryBtnText}>发送验证码</Text>
          )}
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity
            style={[styles.primaryBtn, (code.length !== 6 || verifying) && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={code.length !== 6 || verifying}
            activeOpacity={0.8}
          >
            {verifying ? (
              <ActivityIndicator color="#1A1206" />
            ) : (
              <Text style={styles.primaryBtnText}>登录</Text>
            )}
          </TouchableOpacity>

          <View style={styles.codeFooter}>
            <TouchableOpacity onPress={() => { setStep('email'); setCode(''); setError(''); }}>
              <Text style={styles.linkText}>换个邮箱</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSend} disabled={cooldown > 0 || sending}>
              <Text style={[styles.linkText, cooldown > 0 && styles.linkDisabled]}>
                {cooldown > 0 ? `重新发送（${cooldown}s）` : '重新发送'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={styles.secureRow}>
        <Ionicons name="lock-closed-outline" size={12} color={TextColor.Tertiary} />
        <Text style={styles.secureText}>登录即代表同意用户协议与隐私政策</Text>
      </View>

      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(18, 24, 42, 0.75)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: whiteAlpha(0.06),
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
    color: TextColor.Primary,
    marginBottom: Spacing.xs,
  },
  desc: {
    fontSize: FontSize.caption,
    color: TextColor.Secondary,
    marginBottom: Spacing.lg,
  },
  input: {
    backgroundColor: Surface.Surface2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: whiteAlpha(0.08),
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: FontSize.body,
    color: TextColor.Primary,
    marginBottom: Spacing.sm,
  },
  codeInput: {
    letterSpacing: 8,
    textAlign: 'center',
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
  },
  error: {
    fontSize: FontSize.caption,
    color: '#FF375F',
    marginBottom: Spacing.sm,
  },
  primaryBtn: {
    backgroundColor: Brand.Gold,
    borderRadius: Radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  btnDisabled: { opacity: 0.45 },
  primaryBtnText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    color: '#1A1206',
  },
  codeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  linkText: { fontSize: FontSize.caption, color: Brand.Gold },
  linkDisabled: { color: TextColor.Tertiary },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: Spacing.lg,
  },
  secureText: { fontSize: FontSize.micro, color: TextColor.Tertiary },
});
