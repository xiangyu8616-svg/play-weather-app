/**
 * 用户状态 Store（Zustand）
 *
 * 职责：
 * - Supabase Auth 会话初始化与订阅
 * - 邮箱 OTP 登录（发送验证码 / 校验登录）
 * - Apple Sign-In / Google Sign-In 一键登录
 * - 用户资料（profiles）与收藏数量（saved_locations）加载
 * - 登出
 *
 * 用法：
 *   import { useUserStore } from '../stores/userStore';
 *   const { user, init, sendEmailCode, verifyEmailCode, signOut } = useUserStore();
 *   useEffect(() => { init(); }, []);
 */

import { create } from 'zustand';
import { supabase, getProfile, getSavedLocations, updateProfile } from '../lib/supabase';

export const useUserStore = create((set, get) => ({
  // ---- 状态 ----
  session: null,
  user: null,
  profile: null,
  savedLocationCount: 0,
  initialized: false,
  sending: false,   // 正在发送验证码
  verifying: false, // 正在校验验证码

  // ---- 初始化：恢复会话 + 订阅会话变化（幂等）----
  init: async () => {
    if (get().initialized) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ session, user: session?.user ?? null, initialized: true });
      if (session?.user) get().refreshProfile();

      supabase.auth.onAuthStateChange((_event, nextSession) => {
        set({ session: nextSession, user: nextSession?.user ?? null });
        if (nextSession?.user) {
          get().refreshProfile();
        } else {
          set({ profile: null, savedLocationCount: 0 });
        }
      });
    } catch (e) {
      console.warn('[userStore] init 失败:', e?.message);
      set({ initialized: true });
    }
  },

  // ---- 拉取资料与收藏数 ----
  refreshProfile: async () => {
    const user = get().user;
    if (!user) return;
    try {
      const profile = await getProfile(user.id);
      let count = 0;
      try {
        count = (await getSavedLocations(user.id)).length;
      } catch { /* 表为空或网络问题时保持 0 */ }
      set({ profile, savedLocationCount: count });
    } catch (e) {
      console.warn('[userStore] refreshProfile 失败:', e?.message);
    }
  },

  // ---- 发送邮箱验证码 ----
  sendEmailCode: async (email) => {
    set({ sending: true });
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e?.message || '发送失败，请稍后重试', errorKey: 'auth.sendFailed' };
    } finally {
      set({ sending: false });
    }
  },

  // ---- 校验验证码并登录 ----
  verifyEmailCode: async (email, token) => {
    set({ verifying: true });
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      if (error) throw error;
      set({ session: data.session, user: data.user });
      get().refreshProfile();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e?.message || '验证码错误或已过期', errorKey: 'auth.invalidCode' };
    } finally {
      set({ verifying: false });
    }
  },

  // ---- 登出 ----
  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      set({ session: null, user: null, profile: null, savedLocationCount: 0 });
    }
  },

  // ---- Apple Sign-In ----
  // 依赖: expo-apple-authentication (iOS 14+ / macOS)
  signInWithApple: async () => {
    try {
      const AppleAuthentication = require('expo-apple-authentication');
      const { AppleAuthenticationScope } = AppleAuthentication;

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthenticationScope.FULL_NAME,
          AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('Apple 登录未返回身份令牌');
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) throw error;

      // 首次登录时 Apple 会返回姓名，存入 profile
      if (credential.fullName) {
        const names = [
          credential.fullName.givenName,
          credential.fullName.familyName,
        ].filter(Boolean);
        if (names.length > 0) {
          await updateProfile(data.user.id, { nickname: names.join(' ') });
        }
      }

      set({ session: data.session, user: data.user });
      get().refreshProfile();
      return { ok: true };
    } catch (e) {
      if (e.code === 'ERR_CANCELED') return { ok: false, error: null };
      return { ok: false, error: e?.message || 'Apple 登录失败' };
    }
  },

  // ---- Google Sign-In ----
  // 依赖: expo-auth-session + expo-web-browser
  signInWithGoogle: async () => {
    try {
      const { makeRedirectUri } = require('expo-auth-session');
      const redirectUri = makeRedirectUri({ scheme: 'playweather' });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      const { WebBrowser } = require('expo-web-browser');
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

      if (result.type === 'success') {
        // 浏览器成功返回后，Supabase 的 onAuthStateChange 会自动更新 session
        return { ok: true };
      }

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return { ok: false, error: null };
      }

      throw new Error('Google 授权未成功');
    } catch (e) {
      return { ok: false, error: e?.message || 'Google 登录失败' };
    }
  },
}));
