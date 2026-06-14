/**
 * NOAA 极光数据服务
 * 
 * 功能：
 * - 获取极光 KP 指数预报
 * - 获取地磁活动数据
 * - 计算极光可见范围
 * 
 * 数据源：NOAA SWPC (Space Weather Prediction Center)
 * API 文档：https://www.swpc.noaa.gov/products/products
 */

import axios from 'axios';
import { getCachedData, setCachedData, isCacheValid } from './cache.ts';

// ==================== 配置 ====================

const NOAA_CONFIG = {
  // NOAA SWPC API 基础 URL
  baseUrl: 'https://api.swpc.noaa.gov',
  // 地磁纬度阈值（高于此纬度可能看到极光）
  auroraLatitudeThreshold: 60,
  // KP 指数对应可见纬度
  kpLatitudeMap: {
    0: 68,  // KP=0, 极光带中心纬度
    1: 66,
    2: 64,
    3: 62,
    4: 60,
    5: 58,  // KP=5 (G1 级地磁暴)
    6: 56,  // KP=6 (G2 级地磁暴)
    7: 54,  // KP=7 (G3 级地磁暴)
    8: 52,  // KP=8 (G4 级地磁暴)
    9: 50   // KP=9 (G5 级地磁暴)
  }
};

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: NOAA_CONFIG.baseUrl,
  timeout: 15000
});

// ==================== 类型定义 ====================

/**
 * KP 指数数据
 */
export interface KPIndex {
  timeTag: string;        // 时间戳
  kp: number;             // KP 指数 (0-9)
  kpScale: string;        // KP 等级描述
  geomagneticStorm: string; // 地磁暴等级 (G1-G5)
}

/**
 * 极光观测点数据
 */
export interface AuroraLocation {
  id: string;
  name: string;
  lat: number;            // 纬度
  lon: number;            // 经度
  country: string;
  bestMonths: string[];   // 最佳观测月份
  lightPollution: 'low' | 'medium' | 'high'; // 光污染程度
}

/**
 * 极光预报数据
 */
export interface AuroraForecast {
  kpIndex: number;        // KP 指数
  visibility: {
    visible: boolean;     // 是否可见
    latitude: number;     // 可见最低纬度
    probability: number;  // 可见概率 (%)
    quality: '史诗级' | '优秀' | '良好' | '一般' | '较差';
  };
  forecast: KPIndex[];    // 未来预报
  solarWind?: {
    speed: number;        // 太阳风速 (km/s)
    density: number;      // 密度 (p/cm³)
    bTotal: number;       // 磁场强度 (nT)
  };
}

/**
 * 地磁数据
 */
export interface GeomagneticData {
  hp: number;             // HP 指数
  deltaH: number;         // 磁场变化量
  disturbance: string;    // 扰动程度
}

// ==================== 核心函数 ====================

/**
 * 获取当前 Kp 指数
 * @returns Kp 指数数据
 */
export async function getKpIndex(): Promise<KPIndex> {
  try {
    const cacheKey = 'aurora:kp:latest';
    if (await isCacheValid(cacheKey, 60 * 60 * 1000)) {
      return getCachedData(cacheKey);
    }

    // NOAA 3 天 KP 指数预报
    const response = await apiClient.get('/json/noaa-planetary-k-index.json');
    
    if (response.data && response.data.length > 0) {
      const latest = response.data[response.data.length - 1];
      const kpData: KPIndex = {
        timeTag: latest.timeTag,
        kp: latest.kp,
        kpScale: getKPScale(latest.kp),
        geomagneticStorm: getGeomagneticStormLevel(latest.kp)
      };

      await setCachedData(cacheKey, kpData);
      return kpData;
    }

    throw new Error('无法获取 KP 指数数据');
  } catch (error) {
    console.error('获取 KP 指数失败:', error);
    // 返回默认值
    return {
      timeTag: new Date().toISOString(),
      kp: 2,
      kpScale: '安静',
      geomagneticStorm: '无'
    };
  }
}

/**
 * 获取 KP 指数预报（未来 3 天）
 * @returns KP 指数预报数组
 */
export async function getKPForecast(): Promise<KPIndex[]> {
  try {
    const cacheKey = 'aurora:kp:forecast';
    if (await isCacheValid(cacheKey, 60 * 60 * 1000)) {
      return getCachedData(cacheKey);
    }

    const response = await apiClient.get('/json/noaa-planetary-k-index.json');
    
    if (response.data && response.data.length > 0) {
      const forecast = response.data.map((item: any) => ({
        timeTag: item.timeTag,
        kp: item.kp,
        kpScale: getKPScale(item.kp),
        geomagneticStorm: getGeomagneticStormLevel(item.kp)
      }));

      await setCachedData(cacheKey, forecast);
      return forecast;
    }

    throw new Error('无法获取 KP 预报');
  } catch (error) {
    console.error('获取 KP 预报失败:', error);
    return [];
  }
}

/**
 * 计算极光可见度
 * 
 * 综合考虑 Kp 指数、纬度和云量
 * 
 * @param kpIndex - Kp 指数 (0-9)
 * @param latitude - 观测点纬度
 * @param cloudCover - 云量 (0-100)
 * @returns 可见度数据
 */
export function calculateAuroraVisibility(
  kpIndex: number,
  latitude: number,
  cloudCover: number
): {
  visible: boolean;
  latitude: number;
  probability: number;
  quality: '史诗级' | '优秀' | '良好' | '一般' | '较差';
} {
  // 获取该 Kp 指数下极光带的最低纬度
  const auroraLatitude = NOAA_CONFIG.kpLatitudeMap[kpIndex] || 68;
  
  // 计算纬度差（观测点与极光带边缘的距离）
  const latitudeDiff = auroraLatitude - Math.abs(latitude);
  
  // 计算基础可见概率（基于纬度和 Kp 指数）
  let baseProbability = 0;
  let quality: any = '较差';
  
  if (latitudeDiff > 10) {
    // 在极光带内
    baseProbability = Math.min(95, 70 + latitudeDiff * 2.5);
    quality = baseProbability >= 80 ? '史诗级' : baseProbability >= 60 ? '优秀' : '良好';
  } else if (latitudeDiff > 0) {
    // 接近极光带
    baseProbability = 30 + latitudeDiff * 4;
    quality = baseProbability >= 60 ? '优秀' : baseProbability >= 40 ? '良好' : '一般';
  } else {
    // 在极光带外
    baseProbability = Math.max(5, 30 + latitudeDiff * 3);
    quality = baseProbability >= 40 ? '良好' : baseProbability >= 20 ? '一般' : '较差';
  }

  // 云量修正（云量越高，可见概率越低）
  let cloudFactor = 1.0;
  if (cloudCover >= 80) {
    cloudFactor = 0.1; // 阴天，几乎不可见
    quality = '较差';
  } else if (cloudCover >= 60) {
    cloudFactor = 0.4; // 多云
    if (quality === '史诗级') quality = '良好';
    else if (quality === '优秀') quality = '一般';
  } else if (cloudCover >= 40) {
    cloudFactor = 0.7; // 少云
  } else {
    cloudFactor = 1.0; // 晴朗
  }

  const finalProbability = Math.round(baseProbability * cloudFactor);

  return {
    visible: finalProbability >= 20 && cloudCover < 80,
    latitude: auroraLatitude,
    probability: finalProbability,
    quality
  };
}

/**
 * 计算某纬度的极光可见性（旧版，保留兼容性）
 * @deprecated 使用 calculateAuroraVisibility 代替
 */
export function calculateVisibility(
  latitude: number, 
  kpIndex: number
): {
  visible: boolean;
  probability: number;
  quality: '史诗级' | '优秀' | '良好' | '一般' | '较差';
} {
  return calculateAuroraVisibility(kpIndex, latitude, 30); // 默认 30% 云量
}

/**
 * 获取极光预报（未来几天）
 * 
 * @param lat - 观测点纬度
 * @param lng - 观测点经度（用于时区计算）
 * @param days - 预报天数 (默认 3 天)
 * @returns 极光预报数据
 */
export async function getAuroraForecast(
  lat: number,
  lng: number,
  days: number = 3
): Promise<AuroraForecast> {
  try {
    const cacheKey = `aurora:forecast:${lat}:${lng}:${days}`;
    if (await isCacheValid(cacheKey, 60 * 60 * 1000)) {
      return getCachedData(cacheKey);
    }

    // 获取最新 Kp 指数
    const kpIndexData = await getKpIndex();
    const forecast = await getKPForecast();
    
    // 计算可见度（假设默认云量 30%）
    const visibility = calculateAuroraVisibility(kpIndexData.kp, lat, 30);

    const result: AuroraForecast = {
      kpIndex: kpIndexData.kp,
      visibility,
      forecast: forecast.slice(0, days * 8), // 每 3 小时一个数据，days 天
      solarWind: undefined // 可选：从其他 API 获取太阳风数据
    };

    await setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error('获取极光预报失败:', error);
    throw error;
  }
}

/**
 * 获取推荐极光观测点
 * @returns 观测点列表
 */
export function getRecommendedLocations(): AuroraLocation[] {
  return [
    {
      id: 'fairbanks',
      name: '费尔班克斯 (阿拉斯加)',
      lat: 64.8378,
      lon: -147.7164,
      country: '美国',
      bestMonths: ['9 月', '10 月', '3 月', '4 月'],
      lightPollution: 'low'
    },
    {
      id: 'reykjavik',
      name: '雷克雅未克 (冰岛)',
      lat: 64.1466,
      lon: -21.9426,
      country: '冰岛',
      bestMonths: ['9 月', '10 月', '11 月', '2 月', '3 月'],
      lightPollution: 'low'
    },
    {
      id: 'tromso',
      name: '特罗姆瑟 (挪威)',
      lat: 69.6492,
      lon: 18.9553,
      country: '挪威',
      bestMonths: ['10 月', '11 月', '12 月', '1 月', '2 月'],
      lightPollution: 'low'
    },
    {
      id: 'mohe',
      name: '漠河 (中国)',
      lat: 52.9733,
      lon: 122.3311,
      country: '中国',
      bestMonths: ['12 月', '1 月', '2 月', '3 月'],
      lightPollution: 'low'
    },
    {
      id: 'yellowknife',
      name: '耶洛奈夫 (加拿大)',
      lat: 62.4540,
      lon: -114.3718,
      country: '加拿大',
      bestMonths: ['11 月', '12 月', '1 月', '2 月', '3 月'],
      lightPollution: 'low'
    }
  ];
}

// ==================== 辅助函数 ====================

/**
 * 获取 KP 指数等级描述
 */
function getKPScale(kp: number): string {
  if (kp <= 1) return '非常安静';
  if (kp <= 3) return '安静';
  if (kp <= 4) return '活跃';
  if (kp <= 5) return '小地磁暴';
  if (kp <= 6) return '中地磁暴';
  if (kp <= 7) return '强地磁暴';
  if (kp <= 8) return '特强地磁暴';
  return '极强地磁暴';
}

/**
 * 获取地磁暴等级
 */
function getGeomagneticStormLevel(kp: number): string {
  if (kp <= 4) return '无';
  if (kp === 5) return 'G1 (小)';
  if (kp === 6) return 'G2 (中)';
  if (kp === 7) return 'G3 (强)';
  if (kp === 8) return 'G4 (特强)';
  return 'G5 (极强)';
}

// ==================== 使用示例 ====================

/**
 * 使用示例：
 * 
 * import { 
 *   getAuroraForecast, 
 *   getRecommendedLocations,
 *   calculateVisibility
 * } from './services/auroraService';
 * 
 * // 1. 获取某地极光预报
 * const forecast = await getAuroraForecast(68.43); // 阿拉斯加纬度
 * console.log(`KP 指数：${forecast.kpIndex}`);
 * console.log(`可见概率：${forecast.visibility.probability}%`);
 * console.log(`质量等级：${forecast.visibility.quality}`);
 * 
 * // 2. 获取推荐观测点
 * const locations = getRecommendedLocations();
 * locations.forEach(loc => {
 *   console.log(`${loc.name}: 纬度${loc.lat}°`);
 * });
 * 
 * // 3. 计算特定纬度的可见性
 * const visibility = calculateVisibility(52.97, 6); // 漠河，KP=6
 * console.log(`漠河可见概率：${visibility.probability}%`);
 */

export default {
  getKpIndex,
  getLatestKPIndex: getKpIndex, // 别名，保持兼容性
  getKPForecast,
  getAuroraForecast,
  getRecommendedLocations,
  calculateAuroraVisibility,
  calculateVisibility // 别名，保持兼容性
};
