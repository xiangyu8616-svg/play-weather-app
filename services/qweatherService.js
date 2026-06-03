/**
 * 和风天气 API 封装服务
 * 
 * 功能：
 * - 城市搜索
 * - 实时天气
 * - 3 天预报
 * - 台风列表 + 路径
 * 
 * API 文档：https://dev.qweather.com/
 */

import { QWEATHER_KEY, API_CONFIG, CACHE_TTL } from '../config/apiKeys';
import { getCachedData, setCachedData, isCacheValid } from './cache';

// ==================== 配置 ====================

const GEO_API_BASE = 'https://geoapi.qweather.com/v2';
const WEATHER_API_BASE = 'https://m85ctw7p24.re.qweatherapi.com/v7';

// ==================== 类型定义 ====================

/**
 * 城市信息
 */
// interface City {
//   name: string;      // 城市名称
//   id: string;        // 城市 ID
//   lat: string;       // 纬度
//   lon: string;       // 经度
//   adm1: string;      // 省/州
//   adm2: string;      // 市
//   country: string;   // 国家
// }

/**
 * 实时天气数据
 */
// interface NowWeather {
//   temp: string;        // 温度
//   feelsLike: string;   // 体感温度
//   icon: string;        // 天气图标代码
//   text: string;        // 天气状况描述
//   windDir: string;     // 风向
//   windScale: string;   // 风力等级
//   humidity: string;    // 相对湿度 (%)
//   precip: string;      // 降水量 (mm)
//   pressure: string;    // 大气压 (hPa)
//   vis: string;         // 能见度 (km)
//   cloud: string;       // 云量 (%)
//   dew: string;         // 露点温度
// }

/**
 * 每日预报数据
 */
// interface DailyForecast {
//   fxDate: string;        // 预报日期
//   tempMax: string;       // 最高温度
//   tempMin: string;       // 最低温度
//   iconDay: string;       // 白天天气图标
//   textDay: string;       // 白天天气状况
//   windDirDay: string;    // 白天风向
//   windScaleDay: string;  // 白天风力等级
//   humidity: string;      // 相对湿度 (%)
//   precip: string;        // 降水量 (mm)
//   uvIndex: string;       // 紫外线强度指数
//   sunrise: string;       // 日出时间
//   sunset: string;        // 日落时间
// }

/**
 * 台风路径点
 */
// interface TyphoonTrackPoint {
//   time: string;        // 时间
//   lat: string;         // 纬度
//   lon: string;         // 经度
//   type: string;        // 类型
//   pressure: string;    // 气压
//   windSpeed: string;   // 风速
//   moveSpeed: string;   // 移动速度
// }

// ==================== 辅助函数 ====================

/**
 * 构建 API URL
 * @param baseUrl - 基础 URL
 * @param endpoint - 端点
 * @param params - 查询参数
 * @returns 完整 URL
 */
function buildUrl(baseUrl, endpoint, params = {}) {
  const searchParams = new URLSearchParams({
    key: QWEATHER_KEY,
    lang: API_CONFIG.lang || 'zh',
    ...params,
  });
  return `${baseUrl}${endpoint}?${searchParams.toString()}`;
}

/**
 * 发起 HTTP 请求
 * @param url - 请求 URL
 * @param cacheKey - 缓存键
 * @param cacheTTL - 缓存 TTL (毫秒)
 * @param useMockFallback - 是否使用 Mock 回退
 * @param getMockData - 获取 Mock 数据的函数
 * @returns 响应数据
 */
async function fetchWithCache(url, cacheKey, cacheTTL, useMockFallback = false, getMockData = null) {
  try {
    // 1. 检查缓存
    const cached = await getCachedData(cacheKey);
    if (cached) {
      console.log(`[qweather] 使用缓存数据：${cacheKey}`);
      return cached;
    }

    // 2. 发起网络请求
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // 配额超限 (402)
      if (response.status === 402) {
        console.warn(`[qweather] 配额超限，尝试使用缓存或 Mock 数据`);
        if (getMockData) {
          const mockData = getMockData();
          console.warn(`[qweather] 使用 Mock 数据（配额超限）`);
          return mockData;
        }
        throw new Error('API 配额已用尽，请稍后再试');
      }
      
      throw new Error(`API 错误：${response.status} - ${errorData.message || response.statusText}`);
    }

    const data = await response.json();

    // 3. 检查 API 返回码
    if (data.code !== '200') {
      // 如果是缓存键存在，尝试使用旧缓存
      const oldCached = await getCachedData(cacheKey);
      if (oldCached) {
        console.warn(`[qweather] API 返回错误码 ${data.code}，使用旧缓存数据`);
        return oldCached;
      }
      
      if (useMockFallback && getMockData) {
        const mockData = getMockData();
        console.warn(`[qweather] API 错误，使用 Mock 数据：${data.code}`);
        return mockData;
      }
      
      throw new Error(`和风天气 API 错误：${data.code}`);
    }

    // 4. 设置缓存
    await setCachedData(cacheKey, data, cacheTTL);
    
    return data;
  } catch (error) {
    console.error(`[qweather] 请求失败：${url}`, error);
    
    // 网络错误，尝试使用 Mock 回退
    if (useMockFallback && getMockData) {
      const mockData = getMockData();
      console.warn(`[qweather] 网络错误，使用 Mock 数据`);
      return mockData;
    }
    
    throw error;
  }
}

/**
 * 生成 Mock 城市数据
 */
function generateMockCities(query) {
  return [
    {
      name: query || '北京',
      id: '101010100',
      lat: '39.9042',
      lon: '116.4074',
      adm1: '北京市',
      adm2: '北京',
      country: '中国',
    },
  ];
}

/**
 * 生成 Mock 实时天气数据
 */
function generateMockNowWeather() {
  const now = new Date();
  const hour = now.getHours();
  
  // 根据时间生成合理的温度
  let baseTemp = 20;
  if (hour >= 6 && hour <= 14) {
    baseTemp = 18 + Math.random() * 8; // 上午升温
  } else if (hour >= 14 && hour <= 18) {
    baseTemp = 24 + Math.random() * 4; // 下午最高
  } else if (hour >= 18 && hour <= 22) {
    baseTemp = 22 - (hour - 18); // 傍晚降温
  } else {
    baseTemp = 16 + Math.random() * 4; // 夜间低温
  }

  const weatherConditions = ['晴', '多云', '阴', '小雨', '中雨', '大雨'];
  const windDirections = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风'];
  
  return {
    temp: Math.round(baseTemp).toString(),
    feelsLike: Math.round(baseTemp + (Math.random() * 4 - 2)).toString(),
    icon: '100', // 晴
    text: weatherConditions[Math.floor(Math.random() * weatherConditions.length)],
    windDir: windDirections[Math.floor(Math.random() * windDirections.length)],
    windScale: Math.floor(Math.random() * 5 + 1).toString(),
    humidity: Math.floor(Math.random() * 40 + 40).toString(),
    precip: (Math.random() * 10).toFixed(1),
    pressure: Math.floor(Math.random() * 20 + 1010).toString(),
    vis: Math.floor(Math.random() * 15 + 10).toString(),
    cloud: Math.floor(Math.random() * 100).toString(),
    dew: Math.round(baseTemp - 5).toString(),
  };
}

/**
 * 生成 Mock 3 天预报数据
 */
function generateMockDailyForecast(days = 7) {
  const forecast = [];
  const weatherConditions = ['晴', '多云', '阴', '小雨', '中雨', '大雨', '雷阵雨'];
  const windDirections = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风'];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const fxDate = date.toISOString().split('T')[0];
    
    const baseTemp = 20 + Math.random() * 8;
    const tempMax = Math.round(baseTemp + 5 + Math.random() * 3);
    const tempMin = Math.round(baseTemp - 5 - Math.random() * 3);
    
    forecast.push({
      fxDate,
      tempMax: tempMax.toString(),
      tempMin: tempMin.toString(),
      iconDay: '100',
      textDay: weatherConditions[Math.floor(Math.random() * weatherConditions.length)],
      windDirDay: windDirections[Math.floor(Math.random() * windDirections.length)],
      windScaleDay: Math.floor(Math.random() * 5 + 1).toString(),
      humidity: Math.floor(Math.random() * 40 + 40).toString(),
      precip: (Math.random() * 15).toFixed(1),
      uvIndex: Math.floor(Math.random() * 10).toString(),
      sunrise: '06:00',
      sunset: '18:30',
    });
  }
  
  return forecast;
}

/**
 * 生成 Mock 台风列表
 */
function generateMockTyphoonList() {
  const typhoons = [
    {
      stormId: '202401',
      name: '摩羯',
      basin: 'NP',
      status: '活跃',
      maxWindSpeed: '52',
      minPressure: '955',
    },
  ];
  return typhoons;
}

/**
 * 生成 Mock 台风路径
 */
function generateMockTyphoonTrack() {
  const track = [];
  const baseTime = Date.now() - 48 * 60 * 60 * 1000; // 从 48 小时前开始
  
  for (let i = 0; i < 12; i++) {
    const time = new Date(baseTime + i * 4 * 60 * 60 * 1000);
    track.push({
      time: time.toISOString(),
      lat: (20 + i * 0.5).toFixed(1),
      lon: (115 + i * 0.8).toFixed(1),
      type: i < 4 ? '热带风暴' : i < 8 ? '强热带风暴' : '台风',
      pressure: (960 + i * 2).toString(),
      windSpeed: (45 - i).toString(),
      moveSpeed: '15',
    });
  }
  
  return track;
}

// ==================== 数据适配函数 ====================

/**
 * 标准化城市数据
 * @param apiData - API 返回的城市数据
 * @returns 标准化城市数组
 */
function normalizeCityData(apiData) {
  if (!apiData || !apiData.location) {
    return [];
  }
  
  return apiData.location.map(city => ({
    name: city.name,
    id: city.id,
    lat: city.lat,
    lon: city.lon,
    adm1: city.adm1,
    adm2: city.adm2,
    country: city.country,
  }));
}

/**
 * 标准化实时天气数据
 * @param apiData - API 返回的实时天气数据
 * @returns 标准化实时天气对象
 */
function normalizeNowWeather(apiData) {
  if (!apiData || !apiData.now) {
    return generateMockNowWeather();
  }
  
  const now = apiData.now;
  return {
    temp: now.temp,
    feelsLike: now.feelsLike,
    icon: now.icon,
    text: now.text,
    windDir: now.windDir,
    windScale: now.windScale,
    humidity: now.humidity,
    precip: now.precip,
    pressure: now.pressure,
    vis: now.vis,
    cloud: now.cloud,
    dew: now.dew || '0',
  };
}

/**
 * 标准化 3 天预报数据
 * @param apiData - API 返回的预报数据
 * @returns 标准化预报数组
 */
function normalizeDailyForecast(apiData) {
  if (!apiData || !apiData.daily) {
    return generateMockDailyForecast();
  }
  
  return apiData.daily.map(day => ({
    fxDate: day.fxDate,
    tempMax: day.tempMax,
    tempMin: day.tempMin,
    iconDay: day.iconDay,
    textDay: day.textDay,
    windDirDay: day.windDirDay,
    windScaleDay: day.windScaleDay,
    humidity: day.humidity,
    precip: day.precip,
    uvIndex: day.uvIndex || '0',
    sunrise: day.sunrise,
    sunset: day.sunset,
  }));
}

/**
 * 标准化台风列表
 * @param apiData - API 返回的台风列表
 * @returns 标准化台风数组
 */
function normalizeTyphoonList(apiData) {
  if (!apiData || !apiData.storm) {
    return generateMockTyphoonList();
  }
  
  return apiData.storm.map(storm => ({
    stormId: storm.stormId,
    name: storm.name,
    basin: storm.basin,
    status: storm.status,
    maxWindSpeed: storm.maxWindSpeed,
    minPressure: storm.minPressure,
  }));
}

/**
 * 标准化台风路径
 * @param apiData - API 返回的台风路径
 * @returns 标准化路径点数组
 */
function normalizeTyphoonTrack(apiData) {
  if (!apiData || !apiData.path) {
    return generateMockTyphoonTrack();
  }
  
  return apiData.path.map(point => ({
    time: point.time,
    lat: point.lat,
    lon: point.lon,
    type: point.type,
    pressure: point.pressure,
    windSpeed: point.windSpeed,
    moveSpeed: point.moveSpeed || '0',
  }));
}

// ==================== 核心 API 函数 ====================

/**
 * 搜索城市
 * @param query - 城市名称
 * @param number - 返回数量 (默认 5)
 * @returns 城市列表
 */
export async function searchCity(query, number = 5) {
  const cacheKey = `city:${query}:${number}`;
  const cacheTTL = CACHE_TTL.location || 7 * 24 * 60 * 60 * 1000;
  
  const url = buildUrl(GEO_API_BASE, '/city/lookup', {
    location: query,
    number: number.toString(),
  });
  
  try {
    const data = await fetchWithCache(
      url,
      cacheKey,
      cacheTTL,
      true, // 使用 Mock 回退
      generateMockCities.bind(null, query)
    );
    
    return normalizeCityData(data);
  } catch (error) {
    console.error('[qweather] searchCity 失败:', error);
    return generateMockCities(query);
  }
}

/**
 * 获取实时天气
 * @param locationId - 城市 ID
 * @returns 实时天气对象
 */
export async function getNowWeather(locationId) {
  const cacheKey = `weather:now:${locationId}`;
  const cacheTTL = CACHE_TTL.realtime || 30 * 60 * 1000;
  
  const url = buildUrl(WEATHER_API_BASE, '/weather/now', {
    location: locationId,
  });
  
  try {
    const data = await fetchWithCache(
      url,
      cacheKey,
      cacheTTL,
      true, // 使用 Mock 回退
      generateMockNowWeather
    );
    
    return normalizeNowWeather(data);
  } catch (error) {
    console.error('[qweather] getNowWeather 失败:', error);
    return generateMockNowWeather();
  }
}

/**
 * 获取 3 天预报
 * @param locationId - 城市 ID
 * @returns 3 天预报数组
 */
export async function getDailyForecast(locationId) {
  const cacheKey = `weather:daily:${locationId}:3d`;
  const cacheTTL = CACHE_TTL.daily || 60 * 60 * 1000;
  
  const url = buildUrl(WEATHER_API_BASE, '/weather/3d', {
    location: locationId,
  });
  
  try {
    const data = await fetchWithCache(
      url,
      cacheKey,
      cacheTTL,
      true, // 使用 Mock 回退
      generateMockDailyForecast
    );
    
    return normalizeDailyForecast(data);
  } catch (error) {
    console.error('[qweather] getDailyForecast 失败:', error);
    return generateMockDailyForecast();
  }
}

/**
 * 获取活跃台风列表
 * @param basin - 海域 (默认 NP=西北太平洋)
 * @returns 台风列表
 */
export async function getTyphoonList(basin = 'NP') {
  const cacheKey = `typhoon:list:${basin}`;
  const cacheTTL = 60 * 60 * 1000; // 1 小时
  
  const url = buildUrl(WEATHER_API_BASE, '/tropical/storm-list', {
    basin: basin,
  });
  
  try {
    const data = await fetchWithCache(
      url,
      cacheKey,
      cacheTTL,
      true, // 使用 Mock 回退
      generateMockTyphoonList
    );
    
    return normalizeTyphoonList(data);
  } catch (error) {
    console.error('[qweather] getTyphoonList 失败:', error);
    return generateMockTyphoonList();
  }
}

/**
 * 获取台风路径
 * @param stormId - 台风 ID
 * @returns 台风路径点数组
 */
export async function getTyphoonTrack(stormId) {
  const cacheKey = `typhoon:track:${stormId}`;
  const cacheTTL = 30 * 60 * 1000; // 30 分钟
  
  const url = buildUrl(WEATHER_API_BASE, '/tropical/storm-track', {
    stormid: stormId,
  });
  
  try {
    const data = await fetchWithCache(
      url,
      cacheKey,
      cacheTTL,
      true, // 使用 Mock 回退
      generateMockTyphoonTrack
    );
    
    return normalizeTyphoonTrack(data);
  } catch (error) {
    console.error('[qweather] getTyphoonTrack 失败:', error);
    return generateMockTyphoonTrack();
  }
}

// ==================== 导出 ====================

export default {
  searchCity,
  getNowWeather,
  getDailyForecast,
  getTyphoonList,
  getTyphoonTrack,
  // 导出生成器供外部使用
  generateMockNowWeather,
  generateMockDailyForecast,
  generateMockTyphoonList,
  generateMockTyphoonTrack,
};
