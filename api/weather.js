/**
 * 天气 API 代理 — 和风天气 BFF 层
 * 
 * 职责：
 * 1. 从环境变量读取 QWEATHER_API_KEY，避免前端暴露
 * 2. 转发前端请求到和风天气 API
 * 3. 简单缓存（内存 Map，生产环境应换 Redis）
 * 4. 请求频率限制
 * 
 * 环境变量：QWEATHER_API_KEY, QWEATHER_BASE_URL (默认 https://api.qweather.com/v7)
 */

// 简单内存缓存（生产环境请换 Redis）
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟

// 频率限制（生产环境请换 Redis）
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 分钟窗口
const RATE_LIMIT_MAX = 60; // 每窗口最多 60 次

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

export default async function handler(req, res) {
  // 仅允许 GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const ip = getClientIP(req);
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too Many Requests', retryAfter: 60 });
  }

  const { location, type, lang } = req.query;
  if (!location) {
    return res.status(400).json({ error: 'Missing parameter: location' });
  }

  const apiKey = process.env.QWEATHER_API_KEY;
  const baseUrl = process.env.QWEATHER_BASE_URL || 'https://api.qweather.com/v7';

  if (!apiKey) {
    console.error('QWEATHER_API_KEY not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // 构建缓存 key
  const cacheKey = `${type || 'now'}:${location}:${lang || 'zh'}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.status(200).json(cached.data);
  }

  try {
    // 默认获取实时天气
    const weatherType = type || 'weather/now';
    const url = `${baseUrl}/${weatherType}?location=${encodeURIComponent(location)}&key=${apiKey}&lang=${lang || 'zh'}`;

    const response = await fetch(url);
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
