/**
 * 用户认证服务（Supabase Auth 适配器）
 *
 * 2026-07-30 重构：由自建 /api/auth 验证码 + JWT 切换为 Supabase Auth。
 * - 登录态由 Supabase 管理（会话持久化 + 自动刷新 Token）
 * - getToken() 现在返回 Supabase access_token，供 BFF 请求携带（qweatherService 不变）
 * - 邮箱 OTP 登录见 stores/userStore.js（sendEmailCode / verifyEmailCode）
 *
 * 旧实现（内存 Token + /api/auth/*）已随 api/auth/ 一并移除。
 */

import { supabase } from '../lib/supabase';

/**
 * 获取当前访问 Token（Supabase session access_token）
 * 未登录时返回 null；qweatherService 对 null 的处理是不带 Authorization 头，向后兼容。
 */
export async function getToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * 登出
 */
export async function logout() {
  await supabase.auth.signOut();
}

/**
 * 检查是否已登录
 */
export async function isLoggedIn() {
  const token = await getToken();
  return !!token;
}

/**
 * 获取当前用户（Supabase Auth user 对象，含 id / email 等）
 */
export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
}

// ---- 兼容旧调用（已废弃，新代码请使用 stores/userStore.js）----

/** @deprecated 请使用 userStore.sendEmailCode(email) */
export async function sendVerificationCode(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}

/** @deprecated 请使用 userStore.verifyEmailCode(email, code) */
export async function verifyCode(email, code) {
  const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
  if (error) throw new Error(error.message);
  return data;
}

/** @deprecated 会话由 Supabase 管理，无需手动 setToken */
export function setToken() {}

/** @deprecated 会话由 Supabase 管理，请使用 logout() */
export function clearToken() {}
