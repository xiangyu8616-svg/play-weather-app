/**
 * 特殊天气现象算法服务 — 统一导出
 */

import { getSunTimes, isGoldenHour } from '../astronomyService.ts';

// Re-export from sub-modules
export {
  type GlowForecast,
  type TyndallForecast,
  calculateSunsetProbability,
  calculateTyndallProbability,
  calculateGlowForecast,
} from './glow.ts';

export {
  type CloudSeaForecast,
  calculateCloudSeaProbability,
  calculateCloudSeaForecast,
} from './cloudSea.ts';

export {
  type RainbowForecast,
  type HaloForecast,
  type RimeForecast,
  type SnowForecast,
  type FlowerBloomForecast,
  type AutumnFoliageForecast,
  calculateRainbowProbability,
  calculateHaloProbability,
  calculateRimeProbability,
  calculateSnowForecast,
  calculateFlowerBloom,
  calculateAutumnFoliage,
} from './halo.ts';

// ==================== 类型定义 ====================

/**
 * 综合出片指数
 */
export interface PhotographyIndex {
  overall: number;
  level: '史诗级' | '优秀' | '良好' | '一般' | '较差';
  factors: {
    light: number;
    clouds: number;
    visibility: number;
    atmosphere: number;
  };
  recommendations: string[];
}

// ==================== 辅助函数 ====================

function generateRecommendations(
  phenomenonType: string,
  lightScore: number,
  cloudScore: number,
  visibilityScore: number,
  atmosphereScore: number
): string[] {
  const recommendations: string[] = [];

  if (lightScore >= 80) {
    recommendations.push('✨ 光线条件极佳，抓住黄金时刻！');
  } else if (lightScore < 40) {
    recommendations.push('💡 光线条件一般，建议使用三脚架长曝光');
  }

  if (cloudScore >= 80) {
    recommendations.push('☁️ 云层完美，可能出现朝霞/晚霞');
  } else if (cloudScore < 30) {
    recommendations.push('☀️ 晴空少云，适合拍摄星空或纯净风景');
  }

  if (visibilityScore >= 80) {
    recommendations.push('👁️ 能见度优秀，适合拍摄远景');
  } else if (visibilityScore < 40) {
    recommendations.push('🌫️ 能见度较低，建议拍摄近景或雾景');
  }

  if (phenomenonType === 'aurora') {
    recommendations.push('🌌 拍摄极光建议使用 ISO 1600-3200，曝光 10-25 秒');
  } else if (phenomenonType === 'glow' || phenomenonType === 'sunset') {
    recommendations.push('🌅 拍摄朝霞/晚霞建议使用渐变灰滤镜平衡光比');
  } else if (phenomenonType === 'cloud') {
    recommendations.push('⛰️ 拍摄云海建议提前到达高处，使用长焦压缩空间');
  }

  return recommendations;
}

// ==================== 核心函数 ====================

/**
 * 计算综合出片指数（兼容旧接口）
 */
export function calculatePhotographyIndex(
  date: Date,
  lat: number,
  lng: number,
  weatherData: {
    cloudCover: number;
    humidity: number;
    visibility: number;
    temperature: number;
    windSpeed: number;
  },
  phenomenonType: 'aurora' | 'glow' | 'cloud' | 'sunset' | 'general' = 'general'
): PhotographyIndex {
  const { cloudCover, humidity, visibility, temperature, windSpeed } = weatherData;

  let lightScore = 50;
  const goldenHour = isGoldenHour(lat, lng);
  if (goldenHour.isGoldenHour) {
    lightScore = 90;
  } else {
    const sunTimes = getSunTimes(date, lat, lng);
    const timeToSunrise = sunTimes.sunrise.getTime() - date.getTime();
    const timeToSunset = sunTimes.sunset.getTime() - date.getTime();

    if (timeToSunrise > 0 && timeToSunrise < 30 * 60 * 1000) {
      lightScore = 80;
    } else if (timeToSunset > 0 && timeToSunset < 30 * 60 * 1000) {
      lightScore = 80;
    } else if (timeToSunrise < 0 && timeToSunrise > -60 * 60 * 1000) {
      lightScore = 60;
    } else if (timeToSunset < 0 && timeToSunset > -60 * 60 * 1000) {
      lightScore = 60;
    }
  }

  let cloudScore = 50;
  if (cloudCover >= 30 && cloudCover <= 70) {
    cloudScore = 90;
  } else if (cloudCover < 30) {
    cloudScore = 60;
  } else if (cloudCover > 80) {
    cloudScore = 30;
  }

  let visibilityScore = Math.min(100, visibility * 10);

  let atmosphereScore = 50;
  if (humidity >= 60 && humidity <= 80) {
    atmosphereScore = 80;
  } else if (humidity < 60) {
    atmosphereScore = 60;
  } else if (humidity > 90) {
    atmosphereScore = 40;
  }

  let weights = { light: 0.3, clouds: 0.3, visibility: 0.2, atmosphere: 0.2 };

  if (phenomenonType === 'aurora') {
    weights = { light: 0.4, clouds: 0.3, visibility: 0.1, atmosphere: 0.2 };
    const hour = date.getHours();
    if (hour >= 22 || hour <= 5) {
      lightScore = 100;
    } else {
      lightScore = 20;
    }
  } else if (phenomenonType === 'glow' || phenomenonType === 'sunset') {
    weights = { light: 0.4, clouds: 0.35, visibility: 0.15, atmosphere: 0.1 };
  } else if (phenomenonType === 'cloud') {
    weights = { light: 0.2, clouds: 0.4, visibility: 0.2, atmosphere: 0.2 };
  }

  const overall = Math.round(
    lightScore * weights.light +
    cloudScore * weights.clouds +
    visibilityScore * weights.visibility +
    atmosphereScore * weights.atmosphere
  );

  let level: PhotographyIndex['level'] = '较差';
  if (overall >= 85) level = '史诗级';
  else if (overall >= 70) level = '优秀';
  else if (overall >= 55) level = '良好';
  else if (overall >= 40) level = '一般';

  const recommendations = generateRecommendations(
    phenomenonType,
    lightScore,
    cloudScore,
    visibilityScore,
    atmosphereScore
  );

  return {
    overall,
    level,
    factors: {
      light: lightScore,
      clouds: cloudScore,
      visibility: visibilityScore,
      atmosphere: atmosphereScore
    },
    recommendations
  };
}
