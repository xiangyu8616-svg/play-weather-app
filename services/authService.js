/**
 * 用户认证服务
 * 
 * 管理 JWT Token 的存储、获取和刷新
 * 
 * 🔒 Token 存储策略（安全优先）：
 * - Access Token：内存中（避免 XSS 窃取）
 * - 会话恢复：sessionStorage（关闭标签页自动清除）
 * - localStorage：仅开发环境启用，生产环境禁用
 * - 生产环境建议：httpOnly Cookie + CSRF Token + BFF 代理
 */

// ====== Token 管理 ======

let accessToken = null;
const TOKEN_KEY = 'playweather_session';

// 检测是否为开发环境
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : (
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'
);

/**
 * 获取安全的存储后端
 * - sessionStorage：标签页关闭即清除，比 localStorage 更安全
 * - 仅在开发环境回退到 localStorage
 */
function getSecureStorage() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('__test__', '1');
      sessionStorage.removeItem('__test__');
      return sessionStorage;
    }
  } catch { /* not available */ }
  
  // 仅开发环境使用 localStorage
  if (isDev) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('__test__', '1');
        localStorage.removeItem('__test__');
        console.warn('[auth] ⚠️ 使用 localStorage 存储 Token（仅开发环境）');
        return localStorage;
      }
    } catch { /* not available */ }
  }
  
  return null;
}

/**
 * 获取当前 Token
 * 优先从内存读取，其次从安全存储恢复
 */
export async function getToken() {
  if (accessToken) return accessToken;

  const storage = getSecureStorage();
  if (!storage) return null;

  try {
    const stored = storage.getItem(TOKEN_KEY);
    if (stored) {
      const { token, expiresAt } = JSON.parse(stored);
      if (Date.now() < expiresAt) {
        accessToken = token;
        return token;
      }
      // Token 已过期，清除
      storage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * 设置 Token
 * @param token - JWT Token
 * @param expiresInSeconds - 过期时间（秒），默认 1 小时（从 2 小时缩短以降低泄露窗口）
 */
export function setToken(token, expiresInSeconds = 3600) {
  accessToken = token;
  const expiresAt = Date.now() + expiresInSeconds * 1000;

  const storage = getSecureStorage();
  if (storage) {
    try {
      storage.setItem(TOKEN_KEY, JSON.stringify({ token, expiresAt }));
    } catch {
      // quota exceeded or disabled
    }
  }
}

/**
 * 清除 Token（登出）
 */
export function clearToken() {
  accessToken = null;
  
  const storage = getSecureStorage();
  if (storage) {
    try {
      storage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  }
}

// ====== 验证码登录 ======

const AUTH_BASE = '/api/auth';

/**
 * 发送短信验证码
 * @param phone 手机号
 */
export async function sendVerificationCode(phone) {
  const response = await fetch(`${AUTH_BASE}/send-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || '发送失败');
  }
  return data;
}

/**
 * 验证码校验并登录
 * @param phone 手机号
 * @param code 验证码
 */
export async function verifyCode(phone, code) {
  const response = await fetch(`${AUTH_BASE}/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || '验证失败');
  }

  // 保存 Token
  setToken(data.token, data.expiresIn);
  return data;
}

/**
 * 登出
 */
export function logout() {
  clearToken();
}

/**
 * 检查是否已登录
 */
export async function isLoggedIn() {
  const token = await getToken();
  return !!token;
}

/**
 * 获取当前用户信息（从 JWT 解码）
 * 
 * ⚠️ 安全说明：
 * - 此方法仅解码 JWT payload，不验证签名
 * - 签名验证必须在服务端完成
 * - 客户端解码仅用做 UI 展示（用户名/头像），不可用于权限判断
 * - 所有权限相关操作必须经服务端校验 Token 有效性
 */
export async function getCurrentUser() {
  const token = await getToken();
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('[auth] 无效的 JWT 格式');
      return null;
    }
    const payload = JSON.parse(atob(parts[1]));
    
    // 检查过期时间（客户端检查作为 UI 快速反馈，真正的过期校验在服务端）
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.warn('[auth] Token 已过期，重新获取');
      clearToken();
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}
