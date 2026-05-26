/**
 * API 密钥配置文件（测试版）
 * 
 * ⚠️ 注意：这是测试版本，仅用于本地开发
 * 正式上线前请填入你的实际 API Key
 */

// 和风天气 API Key（测试用占位符）
export const QWEATHER_KEY = 'test_key_for_development';

// API 基础配置
export const API_CONFIG = {
  baseURL: 'https://devapi.qweather.com/v7',
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
