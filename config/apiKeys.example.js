/**
 * API 密钥配置文件
 * 
 * 使用说明：
 * 1. 复制此文件为 apiKeys.js
 * 2. 填入你的实际 API Key
 * 3. 不要将 apiKeys.js 提交到 Git
 * 
 * 获取和风天气 API Key:
 * https://dev.qweather.com/docs/api/
 */

// 和风天气 API Key
export const QWEATHER_KEY = '你的和风天气 API Key';

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
