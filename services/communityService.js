/**
 * 社区服务（ROADMAP 2.9）
 *
 * 功能：
 * - 帖子列表（含作者昵称/头像批量补齐）
 * - 发帖（敏感词预检 + 可选照片上传，EXIF 已脱敏）
 * - 点赞/取消点赞（post_likes 表 + 触发器维护 likes_count）
 *
 * 依赖迁移：supabase/migrations/003_community_likes.sql
 */

import { supabase } from '../lib/supabase';
import { containsSensitive } from './sensitiveWordFilter';
import { stripExif } from './exifStripper';

export class SensitiveContentError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SensitiveContentError';
  }
}

/**
 * 拉取已发布帖子（倒序分页）
 * @param {object} opts
 * @param {number} opts.limit 默认 20
 * @param {string} opts.before 上一页最后一条的 created_at（游标分页）
 */
export async function fetchPosts({ limit = 20, before = null } = {}) {
  let query = supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (before) query = query.lt('created_at', before);

  const { data, error } = await query;
  if (error) throw error;
  const posts = data || [];

  // 批量补齐作者资料（profiles 已公开读）
  const authorIds = [...new Set(posts.map((p) => p.user_id))];
  let profileMap = {};
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url')
      .in('id', authorIds);
    profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
  }

  return posts.map((p) => ({
    ...p,
    author: profileMap[p.user_id] || null,
  }));
}

/**
 * 查询当前用户对一组帖子的点赞状态
 * @returns {Promise<Set<string>>} 已点赞的 post_id 集合
 */
export async function fetchMyLikedPostIds(userId, postIds) {
  if (!userId || !postIds?.length) return new Set();
  const { data, error } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', userId)
    .in('post_id', postIds);
  if (error) return new Set();
  return new Set((data || []).map((r) => r.post_id));
}

/**
 * 点赞 / 取消点赞
 * @param {string} postId
 * @param {boolean} currentlyLiked 当前是否已赞
 * @returns {Promise<boolean>} 操作后的点赞状态
 */
export async function toggleLike(postId, userId, currentlyLiked) {
  if (!userId) throw new Error('NOT_LOGGED_IN');
  if (currentlyLiked) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase
    .from('post_likes')
    .insert({ post_id: postId, user_id: userId });
  // 并发重复点赞：唯一约束冲突视为已赞，不报错
  if (error && error.code !== '23505') throw error;
  return true;
}

/**
 * 上传帖子照片（EXIF 脱敏后上传公开桶）
 * @param {string} fileUri 本地图片 URI
 * @returns {Promise<string>} 公开 URL
 */
export async function uploadPostPhoto(fileUri, userId) {
  if (!userId) throw new Error('NOT_LOGGED_IN');
  const stripped = await stripExif(fileUri);

  let body;
  if (stripped.blob) {
    body = stripped.blob;
  } else {
    const resp = await fetch(stripped.uri);
    body = await resp.blob();
  }

  const ext = (fileUri.split('.').pop() || 'jpg').split('?')[0].toLowerCase();
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

  const { error } = await supabase.storage
    .from('post-photos')
    .upload(path, body, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from('post-photos').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * 发布帖子
 * @param {object} post
 * @param {string} post.content 正文（必填）
 * @param {string[]} [post.photoUrls]
 * @param {string} [post.locationName] 拍摄地点
 * @param {object} [post.weatherData] 拍摄时天气快照
 * @param {string[]} [post.tags]
 */
export async function createPost(userId, { content, photoUrls = [], locationName, weatherData, tags = [] }) {
  if (!userId) throw new Error('NOT_LOGGED_IN');
  const text = (content || '').trim();
  if (!text) throw new Error('EMPTY_CONTENT');
  if (text.length > 500) throw new Error('CONTENT_TOO_LONG');
  if (containsSensitive(text)) {
    throw new SensitiveContentError('内容包含敏感词，请修改后再发布');
  }
  if (locationName && containsSensitive(locationName)) {
    throw new SensitiveContentError('地点名称包含敏感词');
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      content: text,
      photo_urls: photoUrls,
      location_name: locationName || null,
      weather_data: weatherData || null,
      tags,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
