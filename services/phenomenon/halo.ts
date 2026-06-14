/**
 * 晕/虹/华等大气光学现象
 * - 彩虹预报
 * - 日晕/月晕
 * - 雾凇/雨凇
 * - 雪景预报
 * - 花期预报（积温模型）
 * - 红叶季预报
 */

// ==================== 类型定义 ====================

/**
 * 彩虹预报
 */
export interface RainbowForecast {
  probability: number;
  type: '单彩虹' | '双彩虹' | '月虹';
  direction: string;
  intensity: number;
  conditions: {
    recentRain: boolean;
    sunAltitude: number;
    cloudCover: number;
  };
}

/**
 * 日晕/月晕预报
 */
export interface HaloForecast {
  probability: number;
  type: '22°晕' | '46°晕' | '环天顶弧' | '幻日';
  celestial: '太阳' | '月亮';
  conditions: {
    cirrusCloud: boolean;
    iceCrystal: number;
    altitude: number;
  };
}

/**
 * 雾凇/雨凇预报
 */
export interface RimeForecast {
  probability: number;
  type: '雾凇' | '雨凇' | '混合凇';
  quality: '史诗级' | '优秀' | '良好' | '一般' | '较差';
  conditions: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    fog: boolean;
  };
}

/**
 * 雪景预报
 */
export interface SnowForecast {
  isSnowing: boolean;
  snowDepth: number;
  level: '初雪' | '小雪' | '中雪' | '大雪' | '暴雪' | '积雪';
  quality: '史诗级' | '优秀' | '良好' | '一般' | '较差';
  conditions: {
    temperature: number;
    precipitationType: string;
    snowfall: number;
  };
}

/**
 * 花期预报
 */
export interface FlowerBloomForecast {
  stage: '未开' | '初开' | '盛开' | '凋谢';
  progress: number;
  bestDate: string;
  daysUntil: number;
  flowerType: string;
}

/**
 * 红叶季预报
 */
export interface AutumnFoliageForecast {
  stage: '未红' | '初红' | '全红' | '最佳观赏' | '凋谢';
  progress: number;
  bestDate: string;
  daysUntil: number;
  location: {
    lat: number;
    lng: number;
    elevation?: number;
  };
}

// ==================== 核心函数 ====================

/**
 * 计算彩虹概率
 */
export function calculateRainbowProbability(data: {
  precipitation1h: number;
  precipitationNow: number;
  sunAltitude: number;
  sunAzimuth: number;
  cloudCover: number;
  isNight?: boolean;
}): { probability: number; direction: string; type: string } {
  const { precipitation1h, precipitationNow, sunAltitude, sunAzimuth, cloudCover, isNight = false } = data;

  let probability = 0;

  // 1. 降水条件（权重 40%）
  let rainScore = 0;
  if (precipitation1h > 0 || precipitationNow > 0) {
    if (precipitation1h >= 2 || precipitationNow >= 1) {
      rainScore = 100;
    } else if (precipitation1h >= 0.5) {
      rainScore = 70 + precipitation1h * 30;
    } else {
      rainScore = 50 + precipitation1h * 40;
    }
  } else {
    rainScore = 30;
  }
  probability += rainScore * 0.4;

  // 2. 太阳高度角（权重 35%）
  let sunAngleScore = 0;
  if (sunAltitude >= 0 && sunAltitude <= 42) {
    sunAngleScore = 100 - (sunAltitude / 42) * 30;
  } else if (sunAltitude > 42) {
    sunAngleScore = Math.max(0, 70 - (sunAltitude - 42) * 3.5);
  }
  probability += sunAngleScore * 0.35;

  // 3. 背向太阳方向有云（权重 25%）
  let cloudScore = 0;
  if (cloudCover >= 30 && cloudCover <= 80) {
    cloudScore = 80 + (cloudCover >= 50 ? 20 : 0);
  } else if (cloudCover < 30) {
    cloudScore = 40;
  } else if (cloudCover > 90) {
    cloudScore = 30;
  }
  probability += cloudScore * 0.25;

  probability = Math.round(Math.max(0, Math.min(100, probability)));

  // 计算方向（背向太阳）
  const oppositeAzimuth = (sunAzimuth + 180) % 360;
  const directionMap: Record<string, string> = {
    '0': '北', '45': '东北', '90': '东', '135': '东南',
    '180': '南', '225': '西南', '270': '西', '315': '西北'
  };
  let direction = '西';
  let minDiff = 360;
  for (const [angle, dir] of Object.entries(directionMap)) {
    const diff = Math.min(Math.abs(oppositeAzimuth - parseInt(angle)), 360 - Math.abs(oppositeAzimuth - parseInt(angle)));
    if (diff < minDiff) {
      minDiff = diff;
      direction = dir;
    }
  }

  let type = '单彩虹';
  if (probability >= 80 && precipitationNow > 2) {
    type = '双彩虹';
  }
  if (isNight && sunAltitude < -6) {
    type = '月虹';
    probability = Math.round(probability * 0.6);
  }

  return { probability, direction, type };
}

/**
 * 计算日晕/月晕概率
 */
export function calculateHaloProbability(data: {
  cirrusCloud: boolean;
  iceCrystal?: number;
  cloudAltitude?: number;
  celestial: '太阳' | '月亮';
  cloudCover?: number;
}): { probability: number; type: string } {
  const { cirrusCloud, iceCrystal = 5, cloudAltitude = 8000, celestial, cloudCover = 50 } = data;

  let probability = 0;

  // 1. 卷层云存在（权重 50%）
  let cirrusScore = 0;
  if (cirrusCloud) {
    cirrusScore = 100;
  } else {
    if (cloudAltitude >= 6000 && cloudAltitude <= 12000) {
      cirrusScore = 60;
    } else if (cloudAltitude >= 5000 && cloudAltitude <= 13000) {
      cirrusScore = 30;
    }
  }
  probability += cirrusScore * 0.5;

  // 2. 冰晶含量（权重 30%）
  let iceScore = 0;
  if (iceCrystal >= 5 && iceCrystal <= 8) {
    iceScore = 100;
  } else if (iceCrystal < 5) {
    iceScore = iceCrystal * 20;
  } else {
    iceScore = Math.max(0, 100 - (iceCrystal - 8) * 25);
  }
  probability += iceScore * 0.3;

  // 3. 云量适中（权重 20%）
  let cloudScore = 0;
  if (cloudCover >= 30 && cloudCover <= 70) {
    cloudScore = 100;
  } else if (cloudCover < 30) {
    cloudScore = cloudCover * 3.33;
  } else if (cloudCover > 80) {
    cloudScore = Math.max(0, 60 - (cloudCover - 80) * 3);
  }
  probability += cloudScore * 0.2;

  probability = Math.round(Math.max(0, Math.min(100, probability)));

  let type = '22°晕';
  if (probability >= 70 && iceCrystal >= 7) {
    type = '环天顶弧';
  } else if (probability >= 60 && cloudCover >= 40 && cloudCover <= 60) {
    type = '幻日';
  } else if (probability >= 50 && iceCrystal >= 6) {
    type = '46°晕';
  }

  return { probability, type };
}

/**
 * 计算雾凇/雨凇概率
 */
export function calculateRimeProbability(data: {
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitationType?: string;
  fog?: boolean;
}): { probability: number; type: string } {
  const { temperature, humidity, windSpeed, precipitationType = '', fog = false } = data;

  let probability = 0;
  let type = '无';

  // 1. 温度条件（权重 35%）
  let tempScore = 0;
  if (temperature <= -5) {
    tempScore = 100;
  } else if (temperature <= -2) {
    tempScore = 80 + (temperature + 5) * 6.67;
  } else if (temperature < 0) {
    tempScore = 60 + (temperature + 2) * 30;
  } else if (temperature <= 2) {
    tempScore = Math.max(0, 60 - temperature * 30);
  }
  probability += tempScore * 0.35;

  // 2. 湿度条件（权重 30%）
  let humidityScore = 0;
  if (humidity >= 95) {
    humidityScore = 100;
  } else if (humidity >= 90) {
    humidityScore = 80 + (humidity - 90) * 4;
  } else if (humidity >= 85) {
    humidityScore = 60 + (humidity - 85) * 4;
  } else if (humidity >= 80) {
    humidityScore = 40 + (humidity - 80) * 4;
  }
  probability += humidityScore * 0.3;

  // 3. 风速条件（权重 20%）
  let windScore = 0;
  if (windSpeed >= 1 && windSpeed <= 3) {
    windScore = 100;
  } else if (windSpeed < 1) {
    windScore = 70;
  } else if (windSpeed <= 5) {
    windScore = Math.max(0, 80 - (windSpeed - 3) * 20);
  } else if (windSpeed <= 8) {
    windScore = Math.max(0, 40 - (windSpeed - 5) * 13.33);
  }
  probability += windScore * 0.2;

  // 4. 雾或毛毛雨（权重 15%）
  let fogScore = 0;
  if (fog || precipitationType === '雾' || precipitationType === '毛毛雨') {
    fogScore = 100;
  } else if (precipitationType === '雪') {
    fogScore = 60;
  } else if (precipitationType === '雨' && temperature <= 2) {
    fogScore = 40;
  }
  probability += fogScore * 0.15;

  probability = Math.round(Math.max(0, Math.min(100, probability)));

  if (probability >= 60) {
    if (temperature <= -2) {
      type = '雾凇';
    } else if (temperature <= 2) {
      type = '雨凇';
    } else {
      type = '混合凇';
    }
  }

  return { probability, type };
}

/**
 * 计算雪景预报
 */
export function calculateSnowForecast(data: {
  temperature: number;
  precipitationType: string;
  snowDepth?: number;
  snowfall?: number;
}): { isSnowing: boolean; snowDepth: number; level: string; quality: string } {
  const { temperature, precipitationType, snowDepth = 0, snowfall = 0 } = data;

  const isSnowing = temperature <= 2 && (precipitationType === '雪' || precipitationType === '雨夹雪');

  let calculatedDepth = snowDepth;
  if (snowfall > 0 && temperature <= 0) {
    calculatedDepth = snowDepth + snowfall;
  }

  let level = '无雪';
  let quality = '较差';

  if (isSnowing) {
    if (snowfall >= 10) {
      level = '暴雪';
      quality = '史诗级';
    } else if (snowfall >= 5) {
      level = '大雪';
      quality = '优秀';
    } else if (snowfall >= 2.5) {
      level = '中雪';
      quality = '良好';
    } else {
      level = '小雪';
      quality = '一般';
    }
  } else if (calculatedDepth > 0) {
    if (calculatedDepth >= 30) {
      level = '积雪';
      quality = '史诗级';
    } else if (calculatedDepth >= 10) {
      level = '积雪';
      quality = '优秀';
    } else if (calculatedDepth >= 5) {
      level = '积雪';
      quality = '良好';
    } else if (calculatedDepth >= 1) {
      level = '积雪';
      quality = '一般';
    } else {
      level = '初雪';
      quality = '一般';
    }
  }

  if (calculatedDepth >= 1 && calculatedDepth < 5 && !isSnowing) {
    level = '初雪';
    quality = '优秀';
  }

  return {
    isSnowing,
    snowDepth: Math.round(calculatedDepth),
    level,
    quality
  };
}

/**
 * 计算花期预报（积温模型）
 */
export function calculateFlowerBloom(
  date: Date,
  location: { lat: number; lng: number; elevation?: number },
  flowerType: '樱花' | '油菜花' | '桃花' | '杏花' | '梨花' | '郁金香',
  temperatureHistory: number[]
): { stage: string; progress: number; bestDate: string; daysUntil: number } {
  const flowerRequirements: Record<string, { baseTemp: number; requiredGDD: number; bloomDuration: number }> = {
    '樱花': { baseTemp: 5, requiredGDD: 300, bloomDuration: 7 },
    '油菜花': { baseTemp: 5, requiredGDD: 400, bloomDuration: 15 },
    '桃花': { baseTemp: 5, requiredGDD: 350, bloomDuration: 10 },
    '杏花': { baseTemp: 5, requiredGDD: 280, bloomDuration: 8 },
    '梨花': { baseTemp: 5, requiredGDD: 320, bloomDuration: 10 },
    '郁金香': { baseTemp: 5, requiredGDD: 250, bloomDuration: 12 }
  };

  const flower = flowerRequirements[flowerType] || flowerRequirements['樱花'];
  const { baseTemp, requiredGDD, bloomDuration } = flower;

  let accumulatedGDD = 0;
  for (const temp of temperatureHistory) {
    if (temp > baseTemp) {
      accumulatedGDD += (temp - baseTemp);
    }
  }

  const progress = Math.min(100, Math.round((accumulatedGDD / requiredGDD) * 100));

  let stage = '未开';
  let daysUntil = 0;

  if (progress >= 100) {
    const daysSinceBloom = Math.floor((accumulatedGDD - requiredGDD) / 5);
    if (daysSinceBloom >= bloomDuration) {
      stage = '凋谢';
    } else if (daysSinceBloom >= bloomDuration * 0.7) {
      stage = '盛开';
    } else if (daysSinceBloom >= bloomDuration * 0.3) {
      stage = '盛开';
    } else {
      stage = '初开';
    }
    daysUntil = 0;
  } else if (progress >= 80) {
    stage = '初开';
    daysUntil = Math.ceil((requiredGDD - accumulatedGDD) / 5);
  } else if (progress >= 50) {
    stage = '未开';
    daysUntil = Math.ceil((requiredGDD - accumulatedGDD) / 5);
  } else {
    stage = '未开';
    daysUntil = Math.ceil((requiredGDD - accumulatedGDD) / 3);
  }

  const bestDate = new Date(date);
  bestDate.setDate(bestDate.getDate() + daysUntil + Math.floor(bloomDuration * 0.3));

  return {
    stage,
    progress,
    bestDate: bestDate.toISOString().split('T')[0],
    daysUntil
  };
}

/**
 * 计算红叶季预报
 */
export function calculateAutumnFoliage(
  date: Date,
  location: { lat: number; lng: number; elevation?: number },
  temperatureHistory: number[]
): { stage: string; progress: number; bestDate: string; daysUntil: number } {
  const { lat, lng, elevation = 0 } = location;

  let coldDays = 0;
  let totalColdDegrees = 0;
  for (const temp of temperatureHistory) {
    if (temp < 15) {
      coldDays++;
      totalColdDegrees += (15 - temp);
    }
  }

  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const daylightReduction = Math.max(0, (dayOfYear - 270) / 30);

  let progress = 0;
  if (coldDays >= 20) {
    progress = 80 + Math.min(20, totalColdDegrees / 10);
  } else if (coldDays >= 14) {
    progress = 50 + (coldDays - 14) * 5 + totalColdDegrees / 20;
  } else if (coldDays >= 7) {
    progress = 20 + (coldDays - 7) * 5 + totalColdDegrees / 30;
  } else {
    progress = coldDays * 3;
  }

  progress += daylightReduction * 10;

  const elevationBonus = Math.min(20, elevation / 100);
  progress += elevationBonus;

  const latBonus = Math.max(0, (lat - 30) / 2);
  progress += latBonus;

  progress = Math.round(Math.min(100, Math.max(0, progress)));

  let stage = '未红';
  let daysUntil = 0;

  if (progress >= 90) {
    stage = '最佳观赏';
    daysUntil = 0;
  } else if (progress >= 70) {
    stage = '全红';
    daysUntil = 0;
  } else if (progress >= 40) {
    stage = '初红';
    daysUntil = Math.ceil((70 - progress) / 3);
  } else if (progress >= 20) {
    stage = '初红';
    daysUntil = Math.ceil((40 - progress) / 2);
  } else {
    stage = '未红';
    daysUntil = Math.ceil((20 - progress));
  }

  const bestDate = new Date(date);
  bestDate.setDate(bestDate.getDate() + daysUntil);

  return {
    stage,
    progress,
    bestDate: bestDate.toISOString().split('T')[0],
    daysUntil
  };
}
