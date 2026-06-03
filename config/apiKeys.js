/**
 * API 密钥配置文件（测试版）
 * 
 * ⚠️ 注意：这是测试版本，仅用于本地开发
 * 正式上线前请填入你的实际 API Key
 *
 * 凭据策略（2026-06-01）：
 * - 线上凭据（已加白名单 play-weather-app.vercel.app）：用于 Vercel 生产构建
 * - 本地凭据（无限制）：在和风天气控制台另外创建，仅用于 localhost 开发
 * - 当前文件中用的是本地凭据，构建上线前请替换为线上凭据
 */

// 和风天气 API Key（本地开发用，无域名限制）
// 上线前请替换为已加白名单的线上凭据
// 本地开发 + Vercel 生产都用 TNPKF2T39E（不限制访问来源）
// TH59QRQ6EY（网站模式）仅限白名单域名，备用
export const QWEATHER_KEY = '71bebee8452d4dab8ae88e50460f3bdf';

// API 基础配置
export const API_CONFIG = {
  baseURL: 'https://m85ctw7p24.re.qweatherapi.com/v7',
  timeout: 10000,
  lang: 'zh', // 语言：zh=中文，en=英文
};

// NOAA 太空天气预报中心配置
export const NOAA_CONFIG = {
  baseUrl: 'https://api.swpc.noaa.gov',
  timeout: 15000,
};

// 缓存配置（毫秒）
export const CACHE_TTL = {
  realtime: 30 * 60 * 1000,      // 30 分钟 - 实时天气
  hourly: 30 * 60 * 1000,        // 30 分钟 - 逐小时预报
  daily: 60 * 60 * 1000,         // 1 小时 - 逐日预报
  astronomy: 24 * 60 * 60 * 1000, // 24 小时 - 天文数据
  aurora: 60 * 60 * 1000,        // 1 小时 - 极光数据
  aqi: 60 * 60 * 1000,           // 1 小时 - 空气质量
  location: 7 * 24 * 60 * 60 * 1000, // 7 天 - 城市信息
};
