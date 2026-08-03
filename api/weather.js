/**
 * 天气 API 代理 — 和风天气 BFF 层
 *
 * 职责：
 * 1. 从环境变量读取密钥，避免前端暴露
 * 2. 支持 Ed25519 JWT 签名（推荐，Authorization: Bearer）和 API KEY 回退（query key=）
 * 3. 按白名单转发前端请求到和风天气 API（天气类 + 城市搜索类）
 * 4. 简单缓存（内存 Map，生产环境应换 Redis）
 * 5. 请求频率限制
 *
 * 查询参数：
 *   - type: 端点路径（见 ENDPOINTS 白名单），默认 weather/now
 *   - 其余参数（location / number / lang / range 等）原样透传
 *
 * 环境变量（二选一）：
 *   - 推荐：QWEATHER_ED25519_PRIVATE_KEY + QWEATHER_KID + QWEATHER_PROJECT_ID
 *   - 回退：QWEATHER_API_KEY
 *   - QWEATHER_BASE_URL（默认 https://api.qweather.com/v7）
 *   - QWEATHER_GEO_BASE_URL（默认 https://geoapi.qweather.com/v2）
 */

import { SignJWT, importPKCS8 } from 'jose';

// 简单内存缓存（生产环境请换 Redis）
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟

// 频率限制（生产环境请换 Redis）
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 分钟窗口
const RATE_LIMIT_MAX = 60; // 每窗口最多 60 次

// 允许转发的端点白名单：端点路径 → 上游 API 类型
// weather = 天气数据 API（/v7）；geo = 城市搜索 API（/v2）
const ENDPOINTS = {
  'weather/now': 'weather',
  'weather/3d': 'weather',
  'weather/7d': 'weather',
  'weather/24h': 'weather',
  'weather/72h': 'weather',
  'warnings/now': 'weather',
  'air/now': 'weather',
  'city/lookup': 'geo',
  'city/top': 'geo',
};

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || '0.0.0.0';
}

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimit.get(ip);
  if (!record || now - record.start > RATE_LIMIT_WINDOW) {
    rateLimit.set(ip, { start: now, count: 1 });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  record.count++;
  return true;
}

// JWT 签名缓存（避免每次请求都重新签名）
let jwtCache = { token: null, expiresAt: 0 };
const JWT_LEEWAY_MS = 60 * 1000; // 提前 1 分钟刷新

async function getSignedJWT() {
  const privateKeyPem = process.env.QWEATHER_ED25519_PRIVATE_KEY;
  const kid = process.env.QWEATHER_KID;
  const projectId = process.env.QWEATHER_PROJECT_ID;

  if (!privateKeyPem || !kid || !projectId) {
    return null;
  }

  const now = Date.now();
  if (jwtCache.token && jwtCache.expiresAt > now + JWT_LEEWAY_MS) {
    return jwtCache.token;
  }

  try {
    // PEM 中换行符可能被环境变量转义为 \n，需要还原
    const normalizedPem = privateKeyPem.replace(/\\n/g, '\n');
    const privateKey = await importPKCS8(normalizedPem, 'EdDSA');
    const jwt = await new SignJWT({ sub: projectId })
      .setProtectedHeader({ alg: 'EdDSA', kid })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey);

    jwtCache = { token: jwt, expiresAt: now + 55 * 60 * 1000 }; // 缓存 55 分钟
    return jwt;
  } catch (err) {
    console.error('JWT sign error:', err.message);
    return null;
  }
}

// GeoAPI base 推导：新版控制台专属 API Host（*.qweatherapi.com）下 GeoAPI 走 <host>/geo/v2；
// 旧版公共 API 走 geoapi.qweather.com/v2
function deriveGeoBase(weatherBase) {
  try {
    const host = new URL(weatherBase).host;
    if (/(^|\.)qweatherapi\.com$/.test(host)) {
      return weatherBase.replace(/\/v7\/?$/, '/geo/v2');
    }
  } catch { /* 非法 URL 时走公共默认 */ }
  return 'https://geoapi.qweather.com/v2';
}

export default async function handler(req, res) {
  // 仅允许 GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const ip = getClientIP(req);
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too Many Requests', retryAfter: 60 });
  }

  // 端点白名单校验（防止代理被用于任意路径/任意主机）
  const type = typeof req.query.type === 'string' && req.query.type
    ? req.query.type
    : 'weather/now';
  const apiKind = ENDPOINTS[type];
  if (!apiKind) {
    return res.status(400).json({ error: `Unsupported endpoint type: ${type}` });
  }

  const weatherBase = process.env.QWEATHER_BASE_URL || 'https://api.qweather.com/v7';
  const geoBase = process.env.QWEATHER_GEO_BASE_URL || deriveGeoBase(weatherBase);
  const baseUrl = apiKind === 'geo' ? geoBase : weatherBase;

  // 透传除 type 外的所有查询参数
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query)) {
    if (k === 'type' || typeof v !== 'string') continue;
    params.set(k, v);
  }
  if (!params.has('location')) {
    return res.status(400).json({ error: 'Missing parameter: location' });
  }
  if (!params.has('lang')) params.set('lang', 'zh');

  // 优先 JWT（Authorization: Bearer），回退 API KEY（query key=）
  const headers = {};
  let authMode = 'jwt';
  const jwt = await getSignedJWT();
  if (jwt) {
    headers.Authorization = `Bearer ${jwt}`;
  } else {
    const apiKey = process.env.QWEATHER_API_KEY;
    authMode = 'apikey';
    if (!apiKey) {
      console.error('No auth configured (need Ed25519 private key or API key)');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    params.set('key', apiKey);
  }

  const upstreamPath = `${baseUrl}/${type}?${params.toString()}`;

  // 构建缓存 key（按 auth 模式隔离，避免 JWT/APIKEY 混用缓存）
  const cacheKey = `${authMode}:${upstreamPath}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.status(200).json(cached.data);
  }

  try {
    const response = await fetch(upstreamPath, { headers });
    const data = await response.json();

    // 缓存成功响应
    if (data.code === '200') {
      cache.set(cacheKey, { data, timestamp: Date.now() });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Weather API error:', error);
    return res.status(502).json({ error: 'Upstream API error', message: error.message });
  }
}
