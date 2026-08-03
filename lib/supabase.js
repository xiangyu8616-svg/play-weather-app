/**
 * Supabase 客户端配置
 * 
 * 使用方式：
 * 1. 创建 Supabase 项目后，在 Dashboard → Project Settings → API 中获取：
 *    - Project URL（如 https://xxxxxx.supabase.co）
 *    - anon/public key（以 eyJ... 开头）
 * 2. 写入 `.env.local`（不提交到 git）
 * 3. 替换下面的 placeholder
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] URL 或 Anon Key 未配置。\n' +
    '请在 .env.local 中设置：\n' +
    '  EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\n' +
    '  EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...'
  );
}

// 原生端用 AsyncStorage 持久化会话；Web 端不指定 storage，supabase-js 默认用 localStorage
// Web 端开启 detectSessionInUrl：邮件魔法链接跳回站点时可自动完成登录
const authOptions = {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: Platform.OS === 'web',
};
if (Platform.OS !== 'web') {
  authOptions.storage = AsyncStorage;
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  { auth: authOptions }
);

// ============================================================
// 封装常用操作（减少前端直接写 supabase.from 的重复）
// ============================================================

/**
 * 发送 OTP 验证码（邮箱/手机号）
 * Supabase Auth 原生支持 OTP，不需要自建 send-code API
 */
export async function signInWithOTP({ email, phone }) {
  if (email) {
    return supabase.auth.signInWithOtp({ email });
  }
  if (phone) {
    return supabase.auth.signInWithOtp({ phone });
  }
  throw new Error('请提供邮箱或手机号');
}

/**
 * 验证 OTP 并登录
 */
export async function verifyOTP({ email, phone, token }) {
  if (email) {
    return supabase.auth.verifyOtp({ email, token, type: 'email' });
  }
  if (phone) {
    return supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  }
  throw new Error('请提供邮箱或手机号');
}

/**
 * 获取当前用户
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

/**
 * 获取用户资料（profiles 表扩展信息）
 */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}

/**
 * 更新用户资料
 */
export async function updateProfile(userId, updates) {
  return supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);
}

// ============================================================
// 收藏地点操作
// ============================================================

/**
 * 获取用户收藏的城市列表
 */
export async function getSavedLocations(userId) {
  const { data, error } = await supabase
    .from('saved_locations')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * 添加收藏城市
 */
export async function addSavedLocation(userId, location) {
  return supabase
    .from('saved_locations')
    .insert({
      user_id: userId,
      location_id: location.id,
      location_name: location.name,
      lat: location.lat,
      lon: location.lon,
      is_default: location.isDefault || false,
    });
}

/**
 * 删除收藏城市
 */
export async function removeSavedLocation(userId, locationId) {
  return supabase
    .from('saved_locations')
    .delete()
    .eq('user_id', userId)
    .eq('location_id', locationId);
}

/**
 * 设置默认城市
 */
export async function setDefaultLocation(userId, locationId) {
  // 先取消所有默认
  await supabase
    .from('saved_locations')
    .update({ is_default: false })
    .eq('user_id', userId);
  
  // 再设置指定城市为默认
  return supabase
    .from('saved_locations')
    .update({ is_default: true })
    .eq('user_id', userId)
    .eq('location_id', locationId);
}

// ============================================================
// 社区帖子操作（S2 末启用）
// ============================================================

/**
 * 获取帖子列表（分页）
 */
export async function getPosts({ page = 1, limit = 20 } = {}) {
  const from = (page - 1) * limit;
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);
  if (error) throw error;
  return data || [];
}

/**
 * 创建帖子
 */
export async function createPost(userId, post) {
  return supabase
    .from('posts')
    .insert({
      user_id: userId,
      title: post.title,
      content: post.content,
      photo_urls: post.photoUrls,
      location_name: post.locationName,
      weather_data: post.weatherData,
      tags: post.tags,
    });
}
