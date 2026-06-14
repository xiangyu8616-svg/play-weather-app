/**
 * BFF 层入口中间件
 * 
 * 职责：
 * - CORS 跨域处理
 * - JWT Token 校验（对 /api/weather 等受保护路由）
 * - 简单日志记录
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'play-weather-dev-secret-change-in-production';

// 不需要 Token 校验的路由（白名单）
const PUBLIC_ROUTES = [
  '/api/auth/send-code',
  '/api/auth/verify-code',
];

// CORS 配置
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3100',
  'http://localhost:8081',
  'https://play-weather-app.vercel.app',
];

function setCORSHeaders(req, res) {
  const origin = req.headers['origin'];
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function verifyToken(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  try {
    const token = authHeader.slice(7);
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  // CORS 预检请求
  setCORSHeaders(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname;

  // 判断是否需要鉴权
  const isPublic = PUBLIC_ROUTES.some(route => path.startsWith(route));

  if (!isPublic) {
    const decoded = verifyToken(req);
    if (!decoded) {
      return res.status(401).json({ error: '未登录或 Token 已过期' });
    }
    // 将用户信息注入请求，供下游使用
    req.user = decoded;
  }

  // 继续传递给具体的路由处理器
  // Vercel Functions 的 middleware 模式：如果不是目标路由，直接透传
  // 这里不需要做其他处理，Vercel 会根据文件路由自动匹配
  return res.status(200).json({ message: 'Middleware passed' });
}
