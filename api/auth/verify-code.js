/**
 * 验证码校验 + Token 签发
 * 
 * - 校验手机号 + 验证码
 * - 首次登录自动注册（手机号即账号）
 * - 签发 JWT Access Token（有效期 2 小时）
 * 
 * 环境变量：JWT_SECRET
 */

import jwt from 'jsonwebtoken';

// ====== 用户存储（生产环境请换数据库）======
// 结构：userId → { userId, phone, nickname, avatar, createdAt }
let userIdCounter = 1;
const users = new Map(); // phone → user

// ====== 验证码存储引用（与 send-code.js 共享，生产环境用 Redis 统一管理）======
// ⚠️ 当前简化实现：直接从同一个模块导入有困难，这里用独立 Map
// 生产环境应统一使用 Redis
const codeStore = new Map(); // 实际运行时需要与 send-code.js 共享存储
// ⚠️ Vercel Functions 下每个请求是独立实例，不能共享内存！
// 解决方案：使用 Vercel KV / Upstash Redis
// 当前仅供开发演示，请勿用于生产

const JWT_SECRET = process.env.JWT_SECRET || 'play-weather-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '2h';

// ⚠️ 由于 Vercel Functions 无状态，验证码存储需要持久化方案
// 当前使用全局变量（开发环境跨请求共享，但 serverless 冷启动会丢失）
// 生产环境必须迁移到 Vercel KV 或 Upstash Redis
if (!global.__codeStore) {
  global.__codeStore = new Map();
}
if (!global.__users) {
  global.__users = new Map();
}

const SHARED_CODE_STORE = global.__codeStore;
const SHARED_USERS = global.__users;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { phone, code } = req.body || {};

  // 1. 参数校验
  if (!phone || !code) {
    return res.status(400).json({ error: '手机号和验证码不能为空' });
  }

  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ error: '手机号格式不正确' });
  }

  // 2. 验证码校验
  const stored = SHARED_CODE_STORE.get(phone);
  if (!stored) {
    return res.status(401).json({ error: '请先获取验证码' });
  }

  if (Date.now() > stored.expiresAt) {
    SHARED_CODE_STORE.delete(phone);
    return res.status(401).json({ error: '验证码已过期，请重新获取' });
  }

  if (stored.code !== code && code !== '000000') {
    // ⚠️ 000000 为开发测试万能验证码，生产环境必须移除！
    return res.status(401).json({ error: '验证码错误' });
  }

  // 3. 验证码使用后立即失效（防重放）
  SHARED_CODE_STORE.delete(phone);

  // 4. 查找或创建用户（首次登录自动注册）
  let user = SHARED_USERS.get(phone);
  if (!user) {
    user = {
      userId: String(userIdCounter++),
      phone,
      nickname: `用户${phone.slice(-4)}`, // 默认昵称：手机尾号 4 位
      avatar: null,
      createdAt: new Date().toISOString(),
    };
    SHARED_USERS.set(phone, user);
    console.log(`[DEV] 新用户注册: ${phone} → userId: ${user.userId}`);
  }

  // 5. 签发 JWT Token
  const tokenPayload = {
    userId: user.userId,
    phone: user.phone,
    iat: Math.floor(Date.now() / 1000),
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return res.status(200).json({
    token,
    expiresIn: 7200, // 2 小时，单位秒
    user: {
      userId: user.userId,
      nickname: user.nickname,
      avatar: user.avatar,
      isNewUser: !user.avatar, // 如果没有头像，认为是新用户
    },
  });
}
