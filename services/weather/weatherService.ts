/**
 * 和风天气 API 封装服务
 * 
 * 功能：
 * - 获取实时天气
 * - 获取逐小时预报
 * - 获取逐日预报
 * - 获取天气现象（降水、云量等）
 * 
 * API 文档：https://dev.qweather.com/
 */

import axios from 'axios';
import { getCachedData, setCachedData, isCacheValid } from '../cache.ts';
import { QWEATHER_KEY, API_CONFIG } from '../../config/apiKeys';
import { useI18n } from '../i18n';

// ==================== 配置 ====================

// 数据层文本语言跟随 i18n（参照 qweatherService 的 apiLang 模式）
function dataLang(): 'zh' | 'en' {
  try {
    return (useI18n.getState() as any).lang === 'en' ? 'en' : 'zh';
  } catch {
    return 'zh';
  }
}

// AQI 分类 zh → en（US EPA 标准命名，与 AccuWeather 一致）
const AQI_CATEGORY_EN: Record<string, string> = {
  '优': 'Good',
  '良': 'Moderate',
  '轻度污染': 'Unhealthy for Sensitive Groups',
  '中度污染': 'Unhealthy',
  '重度污染': 'Very Unhealthy',
  '严重污染': 'Hazardous',
  '未知': 'Unknown',
};
function localizeAqiCategory(zh: string): string {
  return dataLang() === 'en' ? (AQI_CATEGORY_EN[zh] || 'Unknown') : zh;
}
function localizePrimaryPollutant(zh: string): string {
  return dataLang() === 'en' && zh === '无' ? 'None' : zh;
}

// UV 等级/建议（WHO 命名：Low / Moderate / High / Very High / Extreme）
interface UvText { level: string; category: string; advice: string; }
function localizeUvText(uvIndex: number): UvText {
  const en = dataLang() === 'en';
  if (uvIndex <= 2) return en
    ? { level: 'Low', category: 'Safe', advice: 'No protection needed' }
    : { level: '最弱', category: '安全', advice: '不需要防护措施' };
  if (uvIndex <= 4) return en
    ? { level: 'Moderate', category: 'Mostly Safe', advice: 'Wear sunscreen when outside' }
    : { level: '弱', category: '较安全', advice: '外出建议涂擦防晒霜' };
  if (uvIndex <= 6) return en
    ? { level: 'Moderate', category: 'Moderate', advice: 'Wear a hat and sunscreen outside' }
    : { level: '中等', category: '中等', advice: '外出建议戴遮阳帽、涂防晒霜' };
  if (uvIndex <= 8) return en
    ? { level: 'High', category: 'High', advice: 'Avoid prolonged sun exposure; use SPF30+ sunscreen' }
    : { level: '强', category: '较强', advice: '避免长时间暴露在阳光下，涂擦 SPF30+ 防晒霜' };
  if (uvIndex <= 10) return en
    ? { level: 'Very High', category: 'Very High', advice: 'Avoid going out; take extra protection if you must' }
    : { level: '很强', category: '强', advice: '尽量避免外出，必须外出时加强防护' };
  return en
    ? { level: 'Extreme', category: 'Extreme', advice: 'Stay indoors and avoid going out' }
    : { level: '极强', category: '极强', advice: '尽量待在室内，避免外出' };
}

// BFF 模式：USE_BFF 时走 /api/weather 代理，否则直接 key
const USE_BFF = QWEATHER_KEY === 'USE_BFF';
const QWEATHER_CONFIG = {
  key: USE_BFF ? '' : QWEATHER_KEY,
  lang: API_CONFIG.lang,
  type: 'weather'
};

const BASE_URL = USE_BFF ? '/api' : API_CONFIG.baseURL;

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: API_CONFIG.timeout,
});

// BFF 模式下不需要全局 key 参数；直连模式下才附带
if (!USE_BFF) {
  apiClient.defaults.params = {
    key: QWEATHER_CONFIG.key,
    lang: QWEATHER_CONFIG.lang
  };
}

// ==================== 类型定义 ====================

/**
 * 实时天气数据
 */
export interface RealTimeWeather {
  temp: string;           // 实时温度
  feelsLike: string;      // 体感温度
  icon: string;           // 天气图标代码
  text: string;           // 天气状况描述
  windDir: string;        // 风向
  windScale: string;      // 风力等级
  windSpeed: string;      // 风速 (km/h)
  humidity: string;       // 相对湿度 (%)
  precip: string;         // 降水量 (mm)
  pressure: string;       // 大气压 (hPa)
  vis: string;            // 能见度 (km)
  cloud: string;          // 云量 (%)
  updateTime: string;     // 更新时间
}

/**
 * 逐日预报数据
 */
export interface DailyForecast {
  fxDate: string;         // 预报日期
  sunrise: string;        // 日出时间
  sunset: string;         // 日落时间
  moonrise: string;       // 月出时间
  moonset: string;        // 月落时间
  moonPhase: string;      // 月相名称
  moonPhaseIcon: string;  // 月相图标
  tempMax: string;        // 最高温度
  tempMin: string;        // 最低温度
  iconDay: string;        // 白天天气图标
  textDay: string;        // 白天天气状况
  iconNight: string;      // 夜间天气图标
  textNight: string;      // 夜间天气状况
  wind360Day: string;     // 白天风向 360 角度
  windDirDay: string;     // 白天风向
  windScaleDay: string;   // 白天风力等级
  windSpeedDay: string;   // 白天风速
  wind360Night: string;   // 夜间风向 360 角度
  windDirNight: string;   // 夜间风向
  windScaleNight: string; // 夜间风力等级
  windSpeedNight: string; // 夜间风速
  humidity: string;       // 相对湿度 (%)
  precip: string;         // 降水量 (mm)
  pressure: string;       // 大气压 (hPa)
  vis: string;            // 能见度 (km)
  cloud: string;          // 云量 (%)
  uvIndex: string;        // 紫外线强度指数
}

/**
 * 城市信息
 */
export interface Location {
  id: string;             // 城市 ID
  name: string;           // 城市名称
  lat: string;            // 纬度
  lon: string;            // 经度
  adm1: string;           // 省/州
  adm2: string;           // 市
  country: string;        // 国家
}

// ==================== 核心函数 ====================

/**
 * 搜索城市
 * @param city - 城市名称
 * @returns 城市列表
 */
export async function searchLocation(city: string): Promise<Location[]> {
  try {
    const cacheKey = `location:${city}`;
    if (await isCacheValid(cacheKey, 24 * 60 * 60 * 1000)) {
      return getCachedData(cacheKey);
    }

    const response = await apiClient.get('/geo/city', {
      params: { location: city }
    });

    if (response.data.code === '200') {
      const locations = response.data.location;
      await setCachedData(cacheKey, locations);
      return locations;
    }

    throw new Error(`API Error: ${response.data.code}`);
  } catch (error) {
    console.error('搜索城市失败:', error);
    throw error;
  }
}

/**
 * 获取实时天气
 * @param locationId - 城市 ID
 * @returns 实时天气数据
 */
export async function getRealTimeWeather(locationId: string): Promise<RealTimeWeather> {
  try {
    const cacheKey = `weather:realtime:${locationId}`;
    if (await isCacheValid(cacheKey, 30 * 60 * 1000)) {
      return getCachedData(cacheKey);
    }

    const response = await apiClient.get('/weather/now', {
      params: { location: locationId }
    });

    if (response.data.code === '200') {
      const weather = response.data.now;
      await setCachedData(cacheKey, weather);
      return weather;
    }

    throw new Error(`API Error: ${response.data.code}`);
  } catch (error) {
    console.error('获取实时天气失败:', error);
    throw error;
  }
}

/**
 * 获取逐日预报
 * @param locationId - 城市 ID
 * @param days - 预报天数 (3/7/10/15/30 天)
 * @returns 逐日预报数据
 */
export async function getDailyForecast(
  locationId: string, 
  days: number = 7
): Promise<DailyForecast[]> {
  try {
    const cacheKey = `weather:daily:${locationId}:${days}`;
    if (await isCacheValid(cacheKey, 60 * 60 * 1000)) {
      return getCachedData(cacheKey);
    }

    const response = await apiClient.get('/weather/7d', {
      params: { 
        location: locationId,
        days: Math.min(days, 30) // 和风天气最多支持 30 天
      }
    });

    if (response.data.code === '200') {
      const forecast = response.data.daily;
      await setCachedData(cacheKey, forecast);
      return forecast;
    }

    throw new Error(`API Error: ${response.data.code}`);
  } catch (error) {
    console.error('获取逐日预报失败:', error);
    throw error;
  }
}

/**
 * 获取逐小时预报
 * @param locationId - 城市 ID
 * @param hours - 预报小时数 (默认 24 小时)
 * @returns 逐小时预报数据
 */
export async function getHourlyForecast(
  locationId: string, 
  hours: number = 24
): Promise<any[]> {
  try {
    const cacheKey = `weather:hourly:${locationId}:${hours}`;
    if (await isCacheValid(cacheKey, 30 * 60 * 1000)) {
      return getCachedData(cacheKey);
    }

    const response = await apiClient.get('/weather/24h', {
      params: { 
        location: locationId,
        hours: Math.min(hours, 168) // 最多 7 天
      }
    });

    if (response.data.code === '200') {
      const forecast = response.data.hourly;
      await setCachedData(cacheKey, forecast);
      return forecast;
    }

    throw new Error(`API Error: ${response.data.code}`);
  } catch (error) {
    console.error('获取逐小时预报失败:', error);
    throw error;
  }
}

/**
 * 空气质量指数 (AQI) 数据
 */
export interface AQIData {
  aqi: number;            // AQI 指数
  category: string;       // 质量等级
  primaryPollutant: string; // 首要污染物
  pm2p5: string;          // PM2.5 (μg/m³)
  pm10: string;           // PM10 (μg/m³)
  co: string;             // CO (mg/L)
  no2: string;            // NO2 (μg/m³)
  so2: string;            // SO2 (μg/m³)
  o3: string;             // O3 (μg/m³)
  updateTime: string;     // 更新时间
}

/**
 * 紫外线指数数据
 */
export interface UVIndexData {
  uvIndex: number;        // 紫外线指数 (0-15)
  level: string;          // 强度等级
  category: string;       // 防护建议等级
  advice: string;         // 防护建议
  updateTime: string;     // 更新时间
}

/**
 * 获取空气质量指数 (AQI)
 * @param locationId - 城市 ID
 * @returns AQI 数据
 */
export async function getAQI(locationId: string): Promise<AQIData> {
  try {
    const cacheKey = `${dataLang()}:weather:aqi:${locationId}`;
    if (await isCacheValid(cacheKey, 60 * 60 * 1000)) {
      return getCachedData(cacheKey);
    }

    const response = await apiClient.get('/indices/air', {
      params: { location: locationId }
    });

    if (response.data.code === '200') {
      const airData = response.data.now;
      
      // 格式化 AQI 数据（分类/首要污染物按界面语言本地化）
      const aqiData: AQIData = {
        aqi: parseInt(airData.aqi) || 0,
        category: localizeAqiCategory(airData.category || '未知'),
        primaryPollutant: localizePrimaryPollutant(airData.primary || '无'),
        pm2p5: airData.pm2p5 || '0',
        pm10: airData.pm10 || '0',
        co: airData.co || '0',
        no2: airData.no2 || '0',
        so2: airData.so2 || '0',
        o3: airData.o3 || '0',
        updateTime: airData.updateTime || new Date().toISOString()
      };

      await setCachedData(cacheKey, aqiData);
      return aqiData;
    }

    throw new Error(`API Error: ${response.data.code}`);
  } catch (error) {
    console.error('获取空气质量失败:', error);
    // 返回默认值
    return {
      aqi: 50,
      category: localizeAqiCategory('良'),
      primaryPollutant: localizePrimaryPollutant('无'),
      pm2p5: '35',
      pm10: '50',
      co: '0.5',
      no2: '20',
      so2: '10',
      o3: '100',
      updateTime: new Date().toISOString()
    };
  }
}

/**
 * 获取紫外线指数
 * @param locationId - 城市 ID
 * @returns 紫外线指数数据
 */
export async function getUVIndex(locationId: string): Promise<UVIndexData> {
  try {
    const cacheKey = `${dataLang()}:weather:uv:${locationId}`;
    if (await isCacheValid(cacheKey, 60 * 60 * 1000)) {
      return getCachedData(cacheKey);
    }

    const response = await apiClient.get('/indices/uv', {
      params: { location: locationId }
    });

    if (response.data.code === '200') {
      const uvData = response.data.now;
      
      // 格式化紫外线数据（等级/建议按界面语言本地化）
      const uvIndex = parseInt(uvData.uv) || 0;
      const { level, category, advice } = localizeUvText(uvIndex);
      
      const formattedData: UVIndexData = {
        uvIndex,
        level,
        category,
        advice,
        updateTime: uvData.updateTime || new Date().toISOString()
      };

      await setCachedData(cacheKey, formattedData);
      return formattedData;
    }

    throw new Error(`API Error: ${response.data.code}`);
  } catch (error) {
    console.error('获取紫外线指数失败:', error);
    // 返回默认值
    const fallback = localizeUvText(3);
    return {
      uvIndex: 3,
      level: fallback.level,
      category: fallback.category,
      advice: fallback.advice,
      updateTime: new Date().toISOString()
    };
  }
}

/**
 * 获取天气指数
 * @param locationId - 城市 ID
 * @param type - 指数类型 (0 返回所有)
 * @returns 天气指数
 */
export async function getIndices(
  locationId: string, 
  type: number = 0
): Promise<any[]> {
  try {
    const cacheKey = `weather:indices:${locationId}:${type}`;
    if (await isCacheValid(cacheKey, 60 * 60 * 1000)) {
      return getCachedData(cacheKey);
    }

    const response = await apiClient.get('/indices/1d', {
      params: { 
        location: locationId,
        type: type
      }
    });

    if (response.data.code === '200') {
      const indices = response.data.daily;
      await setCachedData(cacheKey, indices);
      return indices;
    }

    throw new Error(`API Error: ${response.data.code}`);
  } catch (error) {
    console.error('获取天气指数失败:', error);
    throw error;
  }
}

// ==================== 使用示例 ====================

/**
 * 使用示例：
 * 
 * import { 
 *   searchLocation, 
 *   getRealTimeWeather, 
 *   getDailyForecast 
 * } from './services/weather/weatherService';
 * 
 * // 1. 搜索城市
 * const locations = await searchLocation('北京');
 * const beijingId = locations[0].id;
 * 
 * // 2. 获取实时天气
 * const weather = await getRealTimeWeather(beijingId);
 * console.log(`当前温度：${weather.temp}°C, ${weather.text}`);
 * 
 * // 3. 获取 7 天预报
 * const forecast = await getDailyForecast(beijingId, 7);
 * forecast.forEach(day => {
 *   console.log(`${day.fxDate}: ${day.textDay}, ${day.tempMin}~${day.tempMax}°C`);
 * });
 * 
 * // 4. 获取天气指数（穿衣、紫外线等）
 * const indices = await getIndices(beijingId);
 * indices.forEach(idx => {
 *   console.log(`${idx.name}: ${idx.category}`);
 * });
 */

export default {
  searchLocation,
  getRealTimeWeather,
  getDailyForecast,
  getHourlyForecast,
  getAQI,
  getUVIndex,
  getIndices
};
