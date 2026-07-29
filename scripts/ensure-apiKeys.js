/**
 * CI 构建保障脚本（Vercel buildCommand 调用）
 *
 * 背景：config/apiKeys.js 被 .gitignore 排除（防止真实 Key 入库），
 * 但 Metro 打包时 services/weather/*.js 会静态 import 它，CI 环境文件缺失会导致构建失败。
 *
 * 行为：仅当 config/apiKeys.js 不存在时，生成 BFF 版本（QWEATHER_KEY='USE_BFF'），
 * 前端请求走 /api/weather 代理，不持有任何真实密钥。
 * 本地开发已有真实 Key 的文件不会被覆盖。
 */
const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'config', 'apiKeys.js');

if (fs.existsSync(target)) {
  console.log('[ensure-apiKeys] config/apiKeys.js 已存在，跳过生成（本地开发模式）');
  process.exit(0);
}

const content = `/**
 * ⚠️ CI 自动生成（scripts/ensure-apiKeys.js）— 请勿手动编辑此副本
 * BFF 模式：前端不持有真实 Key，所有天气请求走 /api/weather 代理。
 * 本地开发请复制 config/apiKeys.example.js 并填入真实 Key。
 */

export const QWEATHER_KEY = 'USE_BFF';

export const API_CONFIG = {
  baseURL: 'https://m85ctw7p24.re.qweatherapi.com/v7',
  timeout: 10000,
  lang: 'zh',
};

export const NOAA_CONFIG = {
  baseUrl: 'https://api.swpc.noaa.gov',
  timeout: 15000,
};

export const CACHE_TTL = {
  realtime: 30 * 60 * 1000,
  hourly: 30 * 60 * 1000,
  daily: 60 * 60 * 1000,
  astronomy: 24 * 60 * 60 * 1000,
  aurora: 60 * 60 * 1000,
  aqi: 60 * 60 * 1000,
  location: 7 * 24 * 60 * 60 * 1000,
};
`;

fs.writeFileSync(target, content, 'utf8');
console.log('[ensure-apiKeys] 已生成 BFF 版 config/apiKeys.js（USE_BFF）');
