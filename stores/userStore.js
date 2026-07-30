/**
 * 用户状态 Store（Zustand）
 *
 * 职责：
 * - Supabase Auth 会话初始化与订阅
 * - 邮箱 OTP 登录（发送验证码 / 校验登录）
 * - 用户资料（profiles）与收藏数量（saved_locations）加载
 * - 登出
 *
 * 用法：
 *   import { useUserStore } from '../stores/userStore';
 *   const { user, init, sendEmailCode, verifyEmailCode, signOut } = useUserStore();
 *   useEffect(() => { init(); }, []);
 */

import { create } from 'zustand';
import { supabase, getProfile, getSavedLocations } from '../lib/supabase';

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
      return { ok: false, error: e?.message || '发送失败，请稍后重试' };
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
      return { ok: false, error: e?.message || '验证码错误或已过期' };
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
}));
