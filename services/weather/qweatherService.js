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

import { QWEATHER_KEY, API_CONFIG, CACHE_TTL } from '../../config/apiKeys';
import { getCachedData, setCachedData, isCacheValid } from '../cache';
import { getToken } from '../authService';
import { useI18n } from '../i18n';

// ==================== 配置 ====================

const GEO_API_BASE = (() => {
  // 新版控制台专属 API Host（*.qweatherapi.com）下 GeoAPI 走 <host>/geo/v2；
  // 旧版公共 API 走 geoapi.qweather.com/v2
  try {
    const base = API_CONFIG.baseURL || '';
    if (/(^|\.)qweatherapi\.com$/.test(new URL(base).host)) {
      return base.replace(/\/v7\/?$/, '/geo/v2');
    }
  } catch { /* 非法 URL 时走公共默认 */ }
  return 'https://geoapi.qweather.com/v2';
})();
const WEATHER_API_BASE = 'https://m85ctw7p24.re.qweatherapi.com/v7';

// BFF 代理地址（Vercel Functions 或本地开发）
const BFF_BASE = process.env.NODE_ENV === 'production'
  ? '/api'
  : 'http://localhost:3000/api';

// 是否启用 BFF 模式（当 QWEATHER_KEY 为空或设置了环境变量时）
const USE_BFF = !QWEATHER_KEY || QWEATHER_KEY === 'USE_BFF';

// API 语言跟随 i18n 界面语言（和风支持 zh / en）
function apiLang() {
  try {
    return useI18n.getState().lang === 'en' ? 'en' : 'zh';
  } catch {
    return API_CONFIG.lang || 'zh';
  }
}

// 配额超限标记：402 触发后置 true，成功响应后复位
// UI 层据此区分「配额耗尽」与「网络/其他错误」展示不同提示
let quotaExceeded = false;
export function wasQuotaExceeded() {
  return quotaExceeded;
}

// Mock 文本 zh → en（真实 API 已随 lang 参数返回英文，此处仅覆盖 mock 回退）
const WIND_DIR_EN = {
  '南风': 'S', '西南风': 'SW', '西风': 'W', '西北风': 'NW',
  '北风': 'N', '东北风': 'NE', '东风': 'E', '东南风': 'SE',
};
const WEATHER_TEXT_EN = {
  '晴': 'Sunny', '多云': 'Cloudy', '阴': 'Overcast',
  '小雨': 'Light Rain', '雷阵雨': 'Thunderstorm', '台风演示': 'Demo Typhoon',
};
const TYPHOON_TYPE_EN = {
  '热带低压': 'Tropical Depression', '热带风暴': 'Tropical Storm',
  '强热带风暴': 'Severe Tropical Storm', '台风': 'Typhoon', '强台风': 'Severe Typhoon',
};
function mockText(zh, table = WEATHER_TEXT_EN) {
  return apiLang() === 'en' ? (table[zh] || zh) : zh;
}

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
  const lang = apiLang();
  // BFF 模式下通过代理请求，不直接携带 API Key
  // endpoint 以 type 参数传给代理，由代理按白名单转发（含城市搜索 city/lookup）
  if (USE_BFF) {
    const searchParams = new URLSearchParams({
      lang,
      type: endpoint.replace(/^\//, ''),
      ...params,
    });
    return `${BFF_BASE}/weather?${searchParams.toString()}`;
  }

  const searchParams = new URLSearchParams({
    key: QWEATHER_KEY,
    lang,
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
    const fetchOptions = {};
    if (USE_BFF) {
      const token = await getToken();
      if (token) {
        fetchOptions.headers = { Authorization: `Bearer ${token}` };
      }
    }
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // 配额超限 (402)
      if (response.status === 402) {
        quotaExceeded = true;
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
    if (data.code === '200') {
      quotaExceeded = false; // 成功响应，复位配额标记
    }
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
 * 
 * ⚠️ MOCK DATA — 等待接入真实 API
 * 数据为北京固定坐标，不包含随机值
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
 * 
 * ⚠️ MOCK DATA — 等待接入真实 API
 * 模拟北京夏季典型下午天气（28°C 多云），不含随机值
 * 更新时间固定为构建时间戳
 */
function generateMockNowWeather() {
  return {
    temp: '28',
    feelsLike: '30',
    icon: '101', // 多云
    text: mockText('多云'),
    windDir: mockText('西南风', WIND_DIR_EN),
    windScale: '3',
    humidity: '65',
    precip: '0.0',
    pressure: '1012',
    vis: '24',
    cloud: '70',
    dew: '21',
    // 固定时间戳，不伪造"几分钟前更新"
    _mockUpdatedAt: '2026-06-11T06:00:00Z',
  };
}

/**
 * 生成 Mock 逐日预报数据
 * 
 * ⚠️ MOCK DATA — 等待接入真实 API
 * 基于日期偏移的确定性数据（7 天），不含随机值
 * 模拟北京 6 月中旬天气趋势
 */
function generateMockDailyForecast(days = 7) {
  // 基于日期偏移的确定性天气序列
  const dayTemplates = [
    { tempMax: '30', tempMin: '20', text: '多云', icon: '101', windDir: '南风', windScale: '2', humidity: '60', precip: '0.0', uvIndex: '8', sunrise: '04:47', sunset: '19:43' },
    { tempMax: '32', tempMin: '22', text: '晴',   icon: '100', windDir: '西南风', windScale: '3', humidity: '55', precip: '0.0', uvIndex: '9', sunrise: '04:46', sunset: '19:44' },
    { tempMax: '29', tempMin: '21', text: '阴',   icon: '104', windDir: '东风', windScale: '2', humidity: '70', precip: '2.1', uvIndex: '5', sunrise: '04:46', sunset: '19:45' },
    { tempMax: '26', tempMin: '18', text: '小雨', icon: '305', windDir: '东北风', windScale: '4', humidity: '85', precip: '8.5', uvIndex: '3', sunrise: '04:45', sunset: '19:45' },
    { tempMax: '27', tempMin: '19', text: '多云', icon: '101', windDir: '北风', windScale: '3', humidity: '68', precip: '0.5', uvIndex: '6', sunrise: '04:45', sunset: '19:46' },
    { tempMax: '31', tempMin: '21', text: '晴',   icon: '100', windDir: '南风', windScale: '2', humidity: '52', precip: '0.0', uvIndex: '9', sunrise: '04:44', sunset: '19:47' },
    { tempMax: '33', tempMin: '23', text: '雷阵雨', icon: '302', windDir: '西南风', windScale: '3', humidity: '72', precip: '12.0', uvIndex: '7', sunrise: '04:44', sunset: '19:47' },
  ];

  const forecast = [];
  for (let i = 0; i < Math.min(days, dayTemplates.length); i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const fxDate = date.toISOString().split('T')[0];
    const tpl = dayTemplates[i];
    
    forecast.push({
      fxDate,
      tempMax: tpl.tempMax,
      tempMin: tpl.tempMin,
      iconDay: tpl.icon,
      textDay: mockText(tpl.text),
      windDirDay: mockText(tpl.windDir, WIND_DIR_EN),
      windScaleDay: tpl.windScale,
      humidity: tpl.humidity,
      precip: tpl.precip,
      uvIndex: tpl.uvIndex,
      sunrise: tpl.sunrise,
      sunset: tpl.sunset,
    });
  }
  
  return forecast;
}

/**
 * 生成 Mock 逐小时预报数据
 *
 * ⚠️ MOCK DATA — 等待接入真实 API
 * 基于小时数的确定性正弦温度曲线（24 条），不含随机值
 */
function generateMockHourlyForecast() {
  const textTemplates = ['晴', '晴', '多云', '多云', '阴', '晴'];
  const hourly = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getTime() + i * 3600000);
    const hour = d.getHours();
    // 确定性温度曲线：午后 14 点最热，凌晨 5 点最凉
    const temp = Math.round(26 + Math.sin(((hour - 8) / 24) * Math.PI * 2) * 5);
    hourly.push({
      fxTime: d.toISOString(),
      temp: String(temp),
      icon: '100',
      text: mockText(textTemplates[hour % textTemplates.length]),
      pop: String(hour >= 18 && hour <= 21 ? 30 : 5),
      humidity: '65',
      windScale: '3',
      cloud: '50',
    });
  }
  return hourly;
}

/**
 * 生成 Mock 台风列表
 *
 * ⚠️ MOCK DATA — 等待接入真实 API
 * 固定演示数据，不含随机值
 */
function generateMockTyphoonList() {
  return [
    {
      stormId: '202401',
      name: mockText('台风演示'),
      basin: 'NP',
      status: apiLang() === 'en' ? 'Demo Data' : '演示数据',
      maxWindSpeed: '52',
      minPressure: '955',
    },
  ];
}

/**
 * 生成 Mock 台风路径
 * 
 * ⚠️ MOCK DATA — 等待接入真实 API
 * 固定演示路径（西北太平洋典型路径），不含随机值
 */
function generateMockTyphoonTrack() {
  const baseTime = new Date('2026-06-11T00:00:00Z').getTime();
  const trackPoints = [
    { lat: 12.5, lon: 135.2, type: '热带低压', pressure: '1002', windSpeed: '15', moveSpeed: '20' },
    { lat: 13.8, lon: 133.8, type: '热带风暴', pressure: '995', windSpeed: '20', moveSpeed: '18' },
    { lat: 15.2, lon: 132.1, type: '热带风暴', pressure: '990', windSpeed: '25', moveSpeed: '16' },
    { lat: 16.7, lon: 130.3, type: '强热带风暴', pressure: '982', windSpeed: '30', moveSpeed: '15' },
    { lat: 18.3, lon: 128.5, type: '强热带风暴', pressure: '975', windSpeed: '35', moveSpeed: '14' },
    { lat: 20.0, lon: 126.6, type: '台风', pressure: '965', windSpeed: '42', moveSpeed: '13' },
    { lat: 21.8, lon: 124.8, type: '台风', pressure: '958', windSpeed: '48', moveSpeed: '12' },
    { lat: 23.5, lon: 123.0, type: '强台风', pressure: '950', windSpeed: '52', moveSpeed: '11' },
    { lat: 25.1, lon: 121.5, type: '强台风', pressure: '945', windSpeed: '55', moveSpeed: '10' },
    { lat: 27.0, lon: 120.2, type: '台风', pressure: '960', windSpeed: '45', moveSpeed: '12' },
    { lat: 29.2, lon: 119.0, type: '强热带风暴', pressure: '975', windSpeed: '35', moveSpeed: '15' },
    { lat: 31.5, lon: 118.0, type: '热带风暴', pressure: '988', windSpeed: '25', moveSpeed: '18' },
  ];
  
  return trackPoints.map((pt, i) => ({
    time: new Date(baseTime + i * 6 * 60 * 60 * 1000).toISOString(),
    lat: pt.lat.toFixed(1),
    lon: pt.lon.toFixed(1),
    type: mockText(pt.type, TYPHOON_TYPE_EN),
    pressure: pt.pressure,
    windSpeed: pt.windSpeed,
    moveSpeed: pt.moveSpeed,
  }));
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
 * 标准化逐小时预报数据
 * @param apiData - API 返回的逐小时预报数据
 * @returns 标准化逐小时数组
 */
function normalizeHourlyForecast(apiData) {
  if (!apiData || !apiData.hourly) {
    return generateMockHourlyForecast();
  }

  return apiData.hourly.map(h => ({
    fxTime: h.fxTime,
    temp: h.temp,
    icon: h.icon,
    text: h.text,
    pop: h.pop || '0',
    humidity: h.humidity,
    windScale: h.windScale,
    cloud: h.cloud,
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
  const cacheKey = `${apiLang()}:city:${query}:${number}`;
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
  const cacheKey = `${apiLang()}:weather:now:${locationId}`;
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
 * 获取逐日预报（3 天或 7 天）
 * @param locationId - 城市 ID
 * @param days - 预报天数（7 及以上走 7d 端点，否则 3d）
 * @returns 逐日预报数组
 */
export async function getDailyForecast(locationId, days = 3) {
  const use7d = days >= 7;
  const cacheKey = `${apiLang()}:weather:daily:${locationId}:${use7d ? '7d' : '3d'}`;
  const cacheTTL = CACHE_TTL.daily || 60 * 60 * 1000;

  const url = buildUrl(WEATHER_API_BASE, use7d ? '/weather/7d' : '/weather/3d', {
    location: locationId,
  });

  try {
    const data = await fetchWithCache(
      url,
      cacheKey,
      cacheTTL,
      true, // 使用 Mock 回退
      generateMockDailyForecast.bind(null, use7d ? 7 : 3)
    );

    return normalizeDailyForecast(data);
  } catch (error) {
    console.error('[qweather] getDailyForecast 失败:', error);
    return generateMockDailyForecast(use7d ? 7 : 3);
  }
}

/**
 * 获取逐小时预报（24 小时）
 * @param locationId - 城市 ID
 * @returns 24 小时预报数组
 */
export async function getHourlyForecast(locationId) {
  const cacheKey = `${apiLang()}:weather:hourly:${locationId}:24h`;
  const cacheTTL = CACHE_TTL.hourly || 30 * 60 * 1000;

  const url = buildUrl(WEATHER_API_BASE, '/weather/24h', {
    location: locationId,
  });

  try {
    const data = await fetchWithCache(
      url,
      cacheKey,
      cacheTTL,
      true, // 使用 Mock 回退
      generateMockHourlyForecast
    );

    return normalizeHourlyForecast(data);
  } catch (error) {
    console.error('[qweather] getHourlyForecast 失败:', error);
    return generateMockHourlyForecast();
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
  getHourlyForecast,
  getTyphoonList,
  getTyphoonTrack,
  wasQuotaExceeded,
  // 导出生成器供外部使用
  generateMockNowWeather,
  generateMockDailyForecast,
  generateMockHourlyForecast,
  generateMockTyphoonList,
  generateMockTyphoonTrack,
};
