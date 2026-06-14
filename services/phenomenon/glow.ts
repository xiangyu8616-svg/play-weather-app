/**
 * 霞光相关算法
 * - 朝霞晚霞概率计算
 * - 丁达尔效应（耶稣光）
 */

import { getSunTimes } from '../astronomyService.ts';

// ==================== 类型定义 ====================

/**
 * 朝霞晚霞预报
 */
export interface GlowForecast {
  sunriseGlow: {
    probability: number;
    quality: '史诗级' | '优秀' | '良好' | '一般' | '较差';
    intensity: number;
    color: string;
    bestTime: string;
  };
  sunsetGlow: {
    probability: number;
    quality: '史诗级' | '优秀' | '良好' | '一般' | '较差';
    intensity: number;
    color: string;
    bestTime: string;
  };
  conditions: {
    cloudCover: number;
    humidity: number;
    visibility: number;
    aerosol: number;
  };
}

/**
 * 丁达尔效应（耶稣光）
 */
export interface TyndallForecast {
  probability: number;
  quality: '史诗级' | '优秀' | '良好' | '一般' | '较差';
  direction: string;
  bestTime: string;
  conditions: {
    cloudCover: number;
    humidity: number;
    aerosol: number;
    sunAltitude: number;
  };
}

// ==================== 辅助函数 ====================

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// ==================== 核心函数 ====================

/**
 * 计算朝霞晚霞概率（最高优先级 🔥）
 */
export function calculateSunsetProbability(data: {
  cloudCover: number;
  humidity: number;
  visibility: number;
  aerosol: number;
  sunAltitude: number;
}): { probability: number; level: string; confidence: number } {
  const { cloudCover, humidity, visibility, aerosol, sunAltitude } = data;

  let probability = 0;
  let confidence = 0.8;

  // 1. 云层条件（权重 40%）
  let cloudScore = 0;
  if (cloudCover >= 30 && cloudCover <= 70) {
    const distFromOptimal = Math.abs(cloudCover - 50);
    cloudScore = 100 - distFromOptimal * 2;
  } else if (cloudCover < 30) {
    cloudScore = cloudCover * 2;
  } else if (cloudCover > 80) {
    cloudScore = Math.max(0, 100 - (cloudCover - 80) * 5);
  }
  probability += cloudScore * 0.4;

  // 2. 湿度条件（权重 25%）
  let humidityScore = 0;
  if (humidity >= 60 && humidity <= 80) {
    const distFromOptimal = Math.abs(humidity - 70);
    humidityScore = 100 - distFromOptimal * 2;
  } else if (humidity < 60) {
    humidityScore = humidity * 1.5;
  } else if (humidity > 90) {
    humidityScore = Math.max(0, 100 - (humidity - 90) * 3);
  }
  probability += humidityScore * 0.25;

  // 3. 能见度（权重 20%）
  let visibilityScore = 0;
  if (visibility >= 10 && visibility <= 30) {
    const distFromOptimal = Math.abs(visibility - 20);
    visibilityScore = 100 - distFromOptimal * 3.33;
  } else if (visibility < 10) {
    visibilityScore = visibility * 10;
  } else if (visibility > 40) {
    visibilityScore = 80;
  }
  probability += visibilityScore * 0.2;

  // 4. 气溶胶（权重 10%）
  let aerosolScore = 0;
  if (aerosol >= 4 && aerosol <= 7) {
    const distFromOptimal = Math.abs(aerosol - 5.5);
    aerosolScore = 100 - distFromOptimal * 20;
  } else if (aerosol < 4) {
    aerosolScore = aerosol * 25;
  } else if (aerosol > 8) {
    aerosolScore = Math.max(0, 100 - (aerosol - 8) * 30);
  }
  probability += aerosolScore * 0.1;

  // 5. 太阳高度角（权重 15%）
  let sunAngleScore = 0;
  if (sunAltitude >= -6 && sunAltitude <= 6) {
    const distFromOptimal = Math.abs(sunAltitude);
    sunAngleScore = 100 - distFromOptimal * 8.33;
  } else if (sunAltitude > 6 && sunAltitude <= 15) {
    sunAngleScore = Math.max(0, 60 - (sunAltitude - 6) * 6);
  } else if (sunAltitude < -6 && sunAltitude >= -12) {
    sunAngleScore = Math.max(0, 40 - (Math.abs(sunAltitude) - 6) * 6);
  }
  probability += sunAngleScore * 0.15;

  probability = Math.round(Math.max(0, Math.min(100, probability)));

  let level = '一般';
  if (probability >= 80) level = '史诗级';
  else if (probability >= 60) level = '壮观';
  else if (probability >= 40) level = '普通';

  const dataQuality = (cloudScore + humidityScore + visibilityScore + aerosolScore + sunAngleScore) / 5;
  confidence = 0.6 + (dataQuality / 100) * 0.3;
  confidence = Math.round(confidence * 100) / 100;

  return { probability, level, confidence };
}

/**
 * 计算丁达尔效应（耶稣光）概率
 */
export function calculateTyndallProbability(data: {
  cloudCover: number;
  humidity: number;
  aerosol: number;
  sunAltitude: number;
  sunAzimuth?: number;
}): { probability: number; direction: string; bestTime: string } {
  const { cloudCover, humidity, aerosol, sunAltitude, sunAzimuth = 90 } = data;

  let probability = 0;

  // 1. 雾气/颗粒物浓度（权重 35%）
  let particleScore = 0;
  if (humidity >= 70 && humidity <= 95) {
    if (aerosol >= 3 && aerosol <= 7) {
      particleScore = 100;
    } else if (aerosol < 3) {
      particleScore = 60 + aerosol * 13.33;
    } else {
      particleScore = Math.max(0, 100 - (aerosol - 7) * 20);
    }
  } else if (humidity < 70) {
    particleScore = humidity * 1.4;
  }
  probability += particleScore * 0.35;

  // 2. 低角度阳光（权重 35%）
  let sunAngleScore = 0;
  if (sunAltitude >= 0 && sunAltitude <= 15) {
    sunAngleScore = 100 - sunAltitude * 4;
  } else if (sunAltitude > 15 && sunAltitude <= 30) {
    sunAngleScore = Math.max(0, 40 - (sunAltitude - 15) * 2.67);
  } else if (sunAltitude < 0 && sunAltitude >= -6) {
    sunAngleScore = 60 + sunAltitude * 6.67;
  }
  probability += sunAngleScore * 0.35;

  // 3. 云层遮挡（权重 30%）
  let cloudScore = 0;
  if (cloudCover >= 40 && cloudCover <= 80) {
    const distFromOptimal = Math.abs(cloudCover - 60);
    cloudScore = 100 - distFromOptimal * 2.5;
  } else if (cloudCover < 40) {
    cloudScore = cloudCover * 2.5;
  } else if (cloudCover > 90) {
    cloudScore = Math.max(0, 50 - (cloudCover - 90) * 5);
  }
  probability += cloudScore * 0.3;

  probability = Math.round(Math.max(0, Math.min(100, probability)));

  // 计算方向（背向太阳）
  const azimuth = sunAzimuth || 90;
  const oppositeAzimuth = (azimuth + 180) % 360;
  const directionMap: Record<string, string> = {
    '0': '北', '45': '东北', '90': '东', '135': '东南',
    '180': '南', '225': '西南', '270': '西', '315': '西北'
  };
  let direction = '东';
  let minDiff = 360;
  for (const [angle, dir] of Object.entries(directionMap)) {
    const diff = Math.min(Math.abs(oppositeAzimuth - parseInt(angle)), 360 - Math.abs(oppositeAzimuth - parseInt(angle)));
    if (diff < minDiff) {
      minDiff = diff;
      direction = dir;
    }
  }

  const bestTime = sunAltitude < 0 ? '日出前曙光' : '日出后 1 小时内';

  return { probability, direction, bestTime };
}

/**
 * 计算单次（朝霞或晚霞）的概率
 */
function calculateSingleGlow(
  type: 'sunrise' | 'sunset',
  date: Date,
  lat: number,
  lng: number,
  weatherData: {
    cloudCover: number;
    humidity: number;
    visibility: number;
    aerosol?: number;
  }
): GlowForecast['sunriseGlow'] {
  const { cloudCover, humidity, visibility, aerosol = 5 } = weatherData;

  let probability = 50;

  if (cloudCover >= 30 && cloudCover <= 70) {
    probability += 30;
  } else if (cloudCover < 30) {
    probability -= 20;
  } else if (cloudCover > 80) {
    probability -= 30;
  }

  if (humidity >= 70) {
    probability += 15;
  } else if (humidity >= 50) {
    probability += 5;
  } else {
    probability -= 10;
  }

  if (visibility >= 10) {
    probability += 10;
  } else if (visibility >= 5) {
    probability += 5;
  } else {
    probability -= 10;
  }

  if (aerosol >= 6) {
    probability += 10;
  } else if (aerosol >= 4) {
    probability += 5;
  }

  probability = Math.max(0, Math.min(100, probability));

  let quality: GlowForecast['sunriseGlow']['quality'] = '较差';
  if (probability >= 80) quality = '史诗级';
  else if (probability >= 60) quality = '优秀';
  else if (probability >= 40) quality = '良好';
  else if (probability >= 20) quality = '一般';

  const intensity = Math.round(probability / 10);

  let color = '#FFA500';
  if (probability >= 70) {
    color = '#FF4500';
  } else if (probability >= 50) {
    color = '#FFA500';
  } else if (probability >= 30) {
    color = '#FFD700';
  }

  const sunTimes = getSunTimes(date, lat, lng);
  const bestTime = type === 'sunrise'
    ? formatTime(sunTimes.sunrise)
    : formatTime(sunTimes.sunset);

  return {
    probability,
    quality,
    intensity,
    color,
    bestTime
  };
}

/**
 * 计算朝霞晚霞预报（兼容旧接口）
 */
export function calculateGlowForecast(
  date: Date,
  lat: number,
  lng: number,
  weatherData: {
    cloudCover: number;
    humidity: number;
    visibility: number;
    aerosol?: number;
  }
): GlowForecast {
  const { cloudCover, humidity, visibility, aerosol = 5 } = weatherData;

  const sunriseGlow = calculateSingleGlow('sunrise', date, lat, lng, weatherData);
  const sunsetGlow = calculateSingleGlow('sunset', date, lat, lng, weatherData);

  return {
    sunriseGlow,
    sunsetGlow,
    conditions: {
      cloudCover,
      humidity,
      visibility,
      aerosol
    }
  };
}
