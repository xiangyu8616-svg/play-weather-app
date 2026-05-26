/**
 * 特殊天气现象算法服务
 * 
 * 功能：
 * - 朝霞晚霞概率计算
 * - 云海预测
 * - 丁达尔效应（耶稣光）
 * - 彩虹预报
 * - 日晕/月晕
 * - 雾凇/雨凇
 * - 雪景预报
 * - 花期预报（积温模型）
 * - 红叶季预报
 * - 综合"出片"指数计算
 * 
 * 算法说明：
 * 基于气象数据（云量、湿度、风速等）和天文数据
 * 计算特殊天气现象的出现概率
 */

import { getSunTimes, getSunPosition, isGoldenHour } from './astronomyService';

// ==================== 类型定义 ====================

/**
 * 朝霞晚霞预报
 */
export interface GlowForecast {
  sunriseGlow: {
    probability: number;      // 概率 (0-100)
    quality: '史诗级' | '优秀' | '良好' | '一般' | '较差';
    intensity: number;        // 强度 (0-10)
    color: string;            // 主色调
    bestTime: string;         // 最佳时间
  };
  sunsetGlow: {
    probability: number;
    quality: '史诗级' | '优秀' | '良好' | '一般' | '较差';
    intensity: number;
    color: string;
    bestTime: string;
  };
  conditions: {
    cloudCover: number;       // 云量
    humidity: number;         // 湿度
    visibility: number;       // 能见度
    aerosol: number;          // 气溶胶含量
  };
}

/**
 * 云海预报
 */
export interface CloudSeaForecast {
  probability: number;        // 概率 (0-100)
  quality: '史诗级' | '优秀' | '良好' | '一般' | '较差';
  altitude: number;           // 云海高度 (米)
  thickness: number;          // 厚度 (米)
  bestViewTime: string;       // 最佳观赏时间
  conditions: {
    temperature: number;      // 温度
    humidity: number;         // 湿度
    windSpeed: number;        // 风速
    inversion: boolean;       // 是否有逆温层
  };
}

/**
 * 丁达尔效应（耶稣光）
 */
export interface TyndallForecast {
  probability: number;        // 概率 (0-100)
  quality: '史诗级' | '优秀' | '良好' | '一般' | '较差';
  direction: string;          // 最佳观测方向
  bestTime: string;           // 最佳时间
  conditions: {
    cloudCover: number;
    humidity: number;
    aerosol: number;
    sunAltitude: number;
  };
}

/**
 * 彩虹预报
 */
export interface RainbowForecast {
  probability: number;        // 概率 (0-100)
  type: '单彩虹' | '双彩虹' | '月虹';
  direction: string;          // 观测方向
  intensity: number;          // 强度 (0-10)
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
  probability: number;        // 概率 (0-100)
  type: '22°晕' | '46°晕' | '环天顶弧' | '幻日';
  celestial: '太阳' | '月亮';
  conditions: {
    cirrusCloud: boolean;     // 卷层云
    iceCrystal: number;       // 冰晶含量
    altitude: number;         // 云层高度
  };
}

/**
 * 雾凇/雨凇预报
 */
export interface RimeForecast {
  probability: number;        // 概率 (0-100)
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
  isSnowing: boolean;         // 是否正在下雪
  snowDepth: number;          // 积雪深度 (cm)
  level: '初雪' | '小雪' | '中雪' | '大雪' | '暴雪' | '积雪';
  quality: '史诗级' | '优秀' | '良好' | '一般' | '较差';
  conditions: {
    temperature: number;
    precipitationType: string;
    snowfall: number;         // 降雪量 (mm)
  };
}

/**
 * 花期预报
 */
export interface FlowerBloomForecast {
  stage: '未开' | '初开' | '盛开' | '凋谢';
  progress: number;           // 开花进度 (0-100)
  bestDate: string;           // 最佳观赏日期
  daysUntil: number;          // 距离最佳日期天数
  flowerType: string;
}

/**
 * 红叶季预报
 */
export interface AutumnFoliageForecast {
  stage: '未红' | '初红' | '全红' | '最佳观赏' | '凋谢';
  progress: number;           // 红叶进度 (0-100)
  bestDate: string;           // 最佳观赏日期
  daysUntil: number;
  location: {
    lat: number;
    lng: number;
    elevation?: number;
  };
}

/**
 * 综合出片指数
 */
export interface PhotographyIndex {
  overall: number;            // 综合指数 (0-100)
  level: '史诗级' | '优秀' | '良好' | '一般' | '较差';
  factors: {
    light: number;            // 光线条件
    clouds: number;           // 云层条件
    visibility: number;       // 能见度
    atmosphere: number;       // 大气条件
  };
  recommendations: string[];  // 拍摄建议
}

// ==================== 核心函数 ====================

/**
 * 计算朝霞晚霞概率（最高优先级 🔥）
 * 
 * 算法逻辑：
 * 1. 云层条件（权重 40%）：云量 30-70% 得高分，云层高度 2-8km
 * 2. 湿度条件（权重 25%）：60-80% 最佳
 * 3. 能见度（权重 20%）：10-30km 最佳
 * 4. 气溶胶（权重 10%）：适中浓度
 * 5. 太阳高度角（权重 15%）：-6° 至 6°（日出日落前后 1 小时）
 * 
 * 阈值来源：
 * - 参考莉景天气算法及大气光学研究
 * - 云量 30-70% 为最佳散射条件（《大气光学》）
 * - 气溶胶光学厚度 0.3-0.6 增强红色（AERONET 数据）
 * 
 * @param data - 气象数据
 * @returns { probability: number, level: string, confidence: number }
 */
export function calculateSunsetProbability(data: {
  cloudCover: number;         // 云量 (0-100)
  humidity: number;           // 湿度 (0-100)
  visibility: number;         // 能见度 (km)
  aerosol: number;            // 气溶胶指数 (0-10)
  sunAltitude: number;        // 太阳高度角 (度)
}): { probability: number; level: string; confidence: number } {
  const { cloudCover, humidity, visibility, aerosol, sunAltitude } = data;
  
  let probability = 0;
  let confidence = 0.8;
  
  // 1. 云层条件（权重 40%）
  let cloudScore = 0;
  if (cloudCover >= 30 && cloudCover <= 70) {
    // 理想云量，线性插值
    const distFromOptimal = Math.abs(cloudCover - 50);
    cloudScore = 100 - distFromOptimal * 2; // 50% 时满分
  } else if (cloudCover < 30) {
    cloudScore = cloudCover * 2; // 云太少
  } else if (cloudCover > 80) {
    cloudScore = Math.max(0, 100 - (cloudCover - 80) * 5); // 云太多
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
    visibilityScore = 80; // 能见度过高反而色彩不够浓郁
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
    aerosolScore = Math.max(0, 100 - (aerosol - 8) * 30); // 污染太重
  }
  probability += aerosolScore * 0.1;
  
  // 5. 太阳高度角（权重 15%）
  let sunAngleScore = 0;
  if (sunAltitude >= -6 && sunAltitude <= 6) {
    // 黄金时段：日出日落前后约 1 小时
    const distFromOptimal = Math.abs(sunAltitude);
    sunAngleScore = 100 - distFromOptimal * 8.33;
  } else if (sunAltitude > 6 && sunAltitude <= 15) {
    sunAngleScore = Math.max(0, 60 - (sunAltitude - 6) * 6);
  } else if (sunAltitude < -6 && sunAltitude >= -12) {
    sunAngleScore = Math.max(0, 40 - (Math.abs(sunAltitude) - 6) * 6);
  }
  probability += sunAngleScore * 0.15;
  
  // 限制在 0-100
  probability = Math.round(Math.max(0, Math.min(100, probability)));
  
  // 确定强度分级
  let level = '一般';
  if (probability >= 80) level = '史诗级';
  else if (probability >= 60) level = '壮观';
  else if (probability >= 40) level = '普通';
  
  // 置信度调整
  // 数据越接近理想范围，置信度越高
  const dataQuality = (cloudScore + humidityScore + visibilityScore + aerosolScore + sunAngleScore) / 5;
  confidence = 0.6 + (dataQuality / 100) * 0.3;
  confidence = Math.round(confidence * 100) / 100;
  
  return { probability, level, confidence };
}

/**
 * 计算云海概率（最高优先级 🔥）
 * 
 * 算法逻辑：
 * 1. 逆温层检测：地面温度 < 高空温度
 * 2. 湿度条件：>90% 或接近饱和
 * 3. 风速条件：<3 级（静风或微风）
 * 4. 地形条件：山谷/盆地/海拔>1000m
 * 5. 时间条件：清晨日出前后
 * 
 * 阈值来源：
 * - 逆温层是云海形成的关键（《山地气象学》）
 * - 相对湿度>90% 有利于水汽凝结
 * - 风速<3m/s 维持云海稳定
 * 
 * @param data - 气象数据
 * @returns { probability: number, level: string, bestTime: string }
 */
export function calculateCloudSeaProbability(data: {
  groundTemp: number;         // 地面温度 (°C)
  upperTemp: number;          // 高空温度 (°C, 约 500-1000m 高度)
  humidity: number;           // 湿度 (0-100)
  windSpeed: number;          // 风速 (m/s)
  elevation: number;          // 海拔 (米)
  terrain?: '山谷' | '盆地' | '平原' | '山地';
  hour?: number;              // 小时 (0-23)
}): { probability: number; level: string; bestTime: string } {
  const { groundTemp, upperTemp, humidity, windSpeed, elevation, terrain = '山地', hour = 6 } = data;
  
  let probability = 0;
  
  // 1. 逆温层检测（权重 30%）
  const hasInversion = groundTemp < upperTemp;
  const inversionStrength = upperTemp - groundTemp;
  let inversionScore = 0;
  if (hasInversion) {
    if (inversionStrength >= 3) {
      inversionScore = 100;
    } else if (inversionStrength >= 1) {
      inversionScore = 70 + inversionStrength * 10;
    } else {
      inversionScore = 50 + inversionStrength * 20;
    }
  }
  probability += inversionScore * 0.3;
  
  // 2. 湿度条件（权重 25%）
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
  probability += humidityScore * 0.25;
  
  // 3. 风速条件（权重 20%）
  let windScore = 0;
  if (windSpeed >= 0.5 && windSpeed <= 2) {
    // 理想微风
    windScore = 100;
  } else if (windSpeed < 0.5) {
    windScore = 80; // 静风，云海稳定但可能不壮观
  } else if (windSpeed <= 3) {
    windScore = 70 - (windSpeed - 2) * 20;
  } else if (windSpeed <= 5) {
    windScore = Math.max(0, 50 - (windSpeed - 3) * 25);
  }
  probability += windScore * 0.2;
  
  // 4. 地形条件（权重 15%）
  let terrainScore = 0;
  if (terrain === '山谷' || terrain === '盆地') {
    terrainScore = 100;
  } else if (terrain === '山地') {
    terrainScore = 80;
  }
  // 海拔修正
  if (elevation >= 1000 && elevation <= 3000) {
    terrainScore = Math.min(100, terrainScore + 20);
  } else if (elevation > 3000) {
    terrainScore = Math.min(100, terrainScore + 10);
  }
  probability += terrainScore * 0.15;
  
  // 5. 时间条件（权重 10%）
  let timeScore = 0;
  // 清晨日出前后最佳（5-8 点）
  if (hour >= 5 && hour <= 8) {
    timeScore = 100;
  } else if (hour >= 4 || hour === 9) {
    timeScore = 60;
  } else if (hour >= 3 || hour === 10) {
    timeScore = 30;
  }
  probability += timeScore * 0.1;
  
  // 限制在 0-100
  probability = Math.round(Math.max(0, Math.min(100, probability)));
  
  // 确定等级
  let level = '低概率';
  if (probability >= 80) level = '极高概率';
  else if (probability >= 60) level = '高概率';
  else if (probability >= 40) level = '中等概率';
  else if (probability >= 20) level = '较低概率';
  
  // 最佳观赏时间
  const bestTime = '06:00-08:00';
  
  return { probability, level, bestTime };
}

/**
 * 计算丁达尔效应（耶稣光）概率
 * 
 * 算法逻辑：
 * 1. 雾气/颗粒物浓度适中
 * 2. 低角度阳光（<15°）
 * 3. 云层遮挡部分阳光
 * 
 * 阈值来源：
 * - 丁达尔效应需要适当的气溶胶浓度（《大气光学》）
 * - 太阳高度角<15°时光线更明显
 * - 云量 40-80% 形成光束效果
 * 
 * @param data - 气象数据
 * @returns { probability: number, direction: string, bestTime: string }
 */
export function calculateTyndallProbability(data: {
  cloudCover: number;         // 云量 (0-100)
  humidity: number;           // 湿度 (0-100)
  aerosol: number;            // 气溶胶指数 (0-10)
  sunAltitude: number;        // 太阳高度角 (度)
  sunAzimuth?: number;        // 太阳方位角 (度，可选)
}): { probability: number; direction: string; bestTime: string } {
  const { cloudCover, humidity, aerosol, sunAltitude, sunAzimuth = 90 } = data;
  
  let probability = 0;
  
  // 1. 雾气/颗粒物浓度（权重 35%）
  let particleScore = 0;
  // 高湿度 + 适中气溶胶 = 最佳条件
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
    sunAngleScore = 100 - sunAltitude * 4; // 0°时满分
  } else if (sunAltitude > 15 && sunAltitude <= 30) {
    sunAngleScore = Math.max(0, 40 - (sunAltitude - 15) * 2.67);
  } else if (sunAltitude < 0 && sunAltitude >= -6) {
    sunAngleScore = 60 + sunAltitude * 6.67; // 曙光也有机会
  }
  probability += sunAngleScore * 0.35;
  
  // 3. 云层遮挡（权重 30%）
  let cloudScore = 0;
  if (cloudCover >= 40 && cloudCover <= 80) {
    // 部分遮挡，形成光束
    const distFromOptimal = Math.abs(cloudCover - 60);
    cloudScore = 100 - distFromOptimal * 2.5;
  } else if (cloudCover < 40) {
    cloudScore = cloudCover * 2.5; // 云太少，光束不明显
  } else if (cloudCover > 90) {
    cloudScore = Math.max(0, 50 - (cloudCover - 90) * 5); // 云太多，阳光被完全遮挡
  }
  probability += cloudScore * 0.3;
  
  // 限制在 0-100
  probability = Math.round(Math.max(0, Math.min(100, probability)));
  
  // 计算方向（背向太阳）
  const azimuth = sunAzimuth || 90;
  const oppositeAzimuth = (azimuth + 180) % 360;
  const directionMap: Record<string, string> = {
    '0': '北', '45': '东北', '90': '东', '135': '东南',
    '180': '南', '225': '西南', '270': '西', '315': '西北'
  };
  // 找到最接近的方向
  let direction = '东';
  let minDiff = 360;
  for (const [angle, dir] of Object.entries(directionMap)) {
    const diff = Math.min(Math.abs(oppositeAzimuth - parseInt(angle)), 360 - Math.abs(oppositeAzimuth - parseInt(angle)));
    if (diff < minDiff) {
      minDiff = diff;
      direction = dir;
    }
  }
  
  // 最佳时间
  const bestTime = sunAltitude < 0 ? '日出前曙光' : '日出后 1 小时内';
  
  return { probability, direction, bestTime };
}

/**
 * 计算彩虹概率
 * 
 * 算法逻辑：
 * 1. 刚下过雨（过去 1 小时降水>0）
 * 2. 太阳高度角 <42°
 * 3. 背向太阳方向有云
 * 
 * 阈值来源：
 * - 彩虹形成需要太阳高度角<42°（《大气光学》）
 * - 降水后空气中悬浮水滴
 * - 背向太阳方向有雨幕
 * 
 * @param data - 气象数据
 * @returns { probability: number, direction: string, type: string }
 */
export function calculateRainbowProbability(data: {
  precipitation1h: number;    // 过去 1 小时降水量 (mm)
  precipitationNow: number;   // 当前降水量 (mm/h)
  sunAltitude: number;        // 太阳高度角 (度)
  sunAzimuth: number;         // 太阳方位角 (度)
  cloudCover: number;         // 云量 (0-100)
  isNight?: boolean;          // 是否夜间（月虹）
}): { probability: number; direction: string; type: string } {
  const { precipitation1h, precipitationNow, sunAltitude, sunAzimuth, cloudCover, isNight = false } = data;
  
  let probability = 0;
  
  // 1. 降水条件（权重 40%）
  let rainScore = 0;
  if (precipitation1h > 0 || precipitationNow > 0) {
    // 有降水
    if (precipitation1h >= 2 || precipitationNow >= 1) {
      rainScore = 100;
    } else if (precipitation1h >= 0.5) {
      rainScore = 70 + precipitation1h * 30;
    } else {
      rainScore = 50 + precipitation1h * 40;
    }
  } else {
    // 刚下过雨不久（简化：假设 1 小时内）
    rainScore = 30;
  }
  probability += rainScore * 0.4;
  
  // 2. 太阳高度角（权重 35%）
  let sunAngleScore = 0;
  if (sunAltitude >= 0 && sunAltitude <= 42) {
    // 彩虹可见范围
    sunAngleScore = 100 - (sunAltitude / 42) * 30; // 越低越好
  } else if (sunAltitude > 42) {
    sunAngleScore = Math.max(0, 70 - (sunAltitude - 42) * 3.5);
  }
  probability += sunAngleScore * 0.35;
  
  // 3. 背向太阳方向有云（权重 25%）
  let cloudScore = 0;
  if (cloudCover >= 30 && cloudCover <= 80) {
    cloudScore = 80 + (cloudCover >= 50 ? 20 : 0);
  } else if (cloudCover < 30) {
    cloudScore = 40; // 云太少，雨幕不足
  } else if (cloudCover > 90) {
    cloudScore = 30; // 云太多，阳光不足
  }
  probability += cloudScore * 0.25;
  
  // 限制在 0-100
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
  
  // 确定类型
  let type = '单彩虹';
  if (probability >= 80 && precipitationNow > 2) {
    type = '双彩虹'; // 降水强度大可能出现双彩虹
  }
  if (isNight && sunAltitude < -6) {
    type = '月虹'; // 夜间月虹
    probability = Math.round(probability * 0.6); // 月虹概率降低
  }
  
  return { probability, direction, type };
}

/**
 * 计算日晕/月晕概率
 * 
 * 算法逻辑：
 * 1. 卷层云存在（高云族，6-12km）
 * 2. 冰晶含量检测
 * 3. 22°光环形成条件
 * 
 * 阈值来源：
 * - 卷层云（Cs）是晕形成的必要条件（《大气光学》）
 * - 冰晶折射形成 22°晕最常见
 * - 云高 6-12km 为卷层云典型高度
 * 
 * @param data - 气象数据
 * @returns { probability: number, type: string }
 */
export function calculateHaloProbability(data: {
  cirrusCloud: boolean;       // 是否有卷层云
  iceCrystal?: number;        // 冰晶含量 (0-10, 可选)
  cloudAltitude?: number;     // 云层高度 (米)
  celestial: '太阳' | '月亮';
  cloudCover?: number;        // 云量 (0-100)
}): { probability: number; type: string } {
  const { cirrusCloud, iceCrystal = 5, cloudAltitude = 8000, celestial, cloudCover = 50 } = data;
  
  let probability = 0;
  
  // 1. 卷层云存在（权重 50%）
  let cirrusScore = 0;
  if (cirrusCloud) {
    cirrusScore = 100;
  } else {
    // 通过云高推测
    if (cloudAltitude >= 6000 && cloudAltitude <= 12000) {
      cirrusScore = 60; // 可能是卷层云
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
    cloudScore = 100; // 薄云最佳
  } else if (cloudCover < 30) {
    cloudScore = cloudCover * 3.33;
  } else if (cloudCover > 80) {
    cloudScore = Math.max(0, 60 - (cloudCover - 80) * 3);
  }
  probability += cloudScore * 0.2;
  
  // 限制在 0-100
  probability = Math.round(Math.max(0, Math.min(100, probability)));
  
  // 确定类型
  let type = '22°晕';
  if (probability >= 70 && iceCrystal >= 7) {
    type = '环天顶弧'; // 冰晶充足可能形成更复杂的光学现象
  } else if (probability >= 60 && cloudCover >= 40 && cloudCover <= 60) {
    type = '幻日'; // 特定条件可能形成幻日
  } else if (probability >= 50 && iceCrystal >= 6) {
    type = '46°晕'; // 较大角度的晕
  }
  
  return { probability, type };
}

/**
 * 计算雾凇/雨凇概率
 * 
 * 算法逻辑：
 * 1. 温度 <0℃
 * 2. 湿度 >90%
 * 3. 风速 1-3 级
 * 4. 有雾或毛毛雨
 * 
 * 阈值来源：
 * - 雾凇：温度<-2℃，湿度>90%，风速 1-3m/s（《冬季气象学》）
 * - 雨凇：温度 0℃左右，过冷水滴
 * 
 * @param data - 气象数据
 * @returns { probability: number, type: string }
 */
export function calculateRimeProbability(data: {
  temperature: number;        // 温度 (°C)
  humidity: number;           // 湿度 (0-100)
  windSpeed: number;          // 风速 (m/s)
  precipitationType?: string; // 降水类型 ('雾' | '毛毛雨' | '雪' | '雨')
  fog?: boolean;              // 是否有雾
}): { probability: number; type: string } {
  const { temperature, humidity, windSpeed, precipitationType = '', fog = false } = data;
  
  let probability = 0;
  let type = '无';
  
  // 1. 温度条件（权重 35%）
  let tempScore = 0;
  if (temperature <= -5) {
    tempScore = 100; // 雾凇最佳温度
  } else if (temperature <= -2) {
    tempScore = 80 + (temperature + 5) * 6.67;
  } else if (temperature < 0) {
    tempScore = 60 + (temperature + 2) * 30;
  } else if (temperature <= 2) {
    tempScore = Math.max(0, 60 - temperature * 30); // 雨凇条件
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
    windScore = 100; // 理想风速
  } else if (windSpeed < 1) {
    windScore = 70; // 静风
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
    fogScore = 40; // 可能是雨凇
  }
  probability += fogScore * 0.15;
  
  // 限制在 0-100
  probability = Math.round(Math.max(0, Math.min(100, probability)));
  
  // 确定类型
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
 * 
 * 算法逻辑：
 * 1. 温度 <0℃
 * 2. 降水类型=雪
 * 3. 积雪深度>1cm
 * 
 * @param data - 气象数据
 * @returns { isSnowing: boolean, snowDepth: number, level: string }
 */
export function calculateSnowForecast(data: {
  temperature: number;        // 温度 (°C)
  precipitationType: string;  // 降水类型
  snowDepth?: number;         // 积雪深度 (cm)
  snowfall?: number;          // 降雪量 (mm)
}): { isSnowing: boolean; snowDepth: number; level: string; quality: string } {
  const { temperature, precipitationType, snowDepth = 0, snowfall = 0 } = data;
  
  // 判断是否正在下雪
  const isSnowing = temperature <= 2 && (precipitationType === '雪' || precipitationType === '雨夹雪');
  
  // 计算积雪深度（如果有降雪量）
  let calculatedDepth = snowDepth;
  if (snowfall > 0 && temperature <= 0) {
    // 简化：1mm 降水≈1cm 积雪（新雪密度约为水的 1/10）
    calculatedDepth = snowDepth + snowfall;
  }
  
  // 确定等级
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
  
  // 初雪特殊情况
  if (calculatedDepth >= 1 && calculatedDepth < 5 && !isSnowing) {
    level = '初雪';
    quality = '优秀'; // 初雪有特殊意义
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
 * 
 * 算法逻辑：
 * - 樱花：累积≥300℃·d 开花，盛花期 7 天
 * - 油菜花：累积≥400℃·d 开花，盛花期 15 天
 * - 从冬季开始累积日均温
 * 
 * 阈值来源：
 * - 积温模型是植物物候学经典方法（《植物物候学》）
 * - 不同花种有不同的积温需求
 * 
 * @param date - 日期
 * @param location - 位置
 * @param flowerType - 花种
 * @param temperatureHistory - 历史温度数据（过去 90 天）
 * @returns { stage: string, progress: number, bestDate: string }
 */
export function calculateFlowerBloom(
  date: Date,
  location: { lat: number; lng: number; elevation?: number },
  flowerType: '樱花' | '油菜花' | '桃花' | '杏花' | '梨花' | '郁金香',
  temperatureHistory: number[] // 过去 90 天的日均温 (°C)
): { stage: string; progress: number; bestDate: string; daysUntil: number } {
  // 不同花种的积温需求
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
  
  // 计算积温（Growing Degree Days, GDD）
  let accumulatedGDD = 0;
  for (const temp of temperatureHistory) {
    if (temp > baseTemp) {
      accumulatedGDD += (temp - baseTemp);
    }
  }
  
  // 计算进度
  const progress = Math.min(100, Math.round((accumulatedGDD / requiredGDD) * 100));
  
  // 确定阶段
  let stage = '未开';
  let daysUntil = 0;
  
  if (progress >= 100) {
    // 已经开花
    const daysSinceBloom = Math.floor((accumulatedGDD - requiredGDD) / 5); // 简化：每天约 5 GDD
    if (daysSinceBloom >= bloomDuration) {
      stage = '凋谢';
    } else if (daysSinceBloom >= bloomDuration * 0.7) {
      stage = '盛开'; // 盛花期后期
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
    daysUntil = Math.ceil((requiredGDD - accumulatedGDD) / 3); // 早期积温累积慢
  }
  
  // 计算最佳观赏日期
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
 * 
 * 算法逻辑：
 * 1. 秋季日均温<15℃持续天数
 * 2. 日照时长减少速率
 * 3. 海拔修正系数
 * 
 * 阈值来源：
 * - 红叶形成需要低温诱导（《植物生理学》）
 * - 日均温<15℃持续 2-3 周开始变色
 * - 海拔每升高 100m，红叶提前 2-3 天
 * 
 * @param date - 日期
 * @param location - 位置
 * @param temperatureHistory - 历史温度数据（过去 30 天）
 * @returns { stage: string, progress: number }
 */
export function calculateAutumnFoliage(
  date: Date,
  location: { lat: number; lng: number; elevation?: number },
  temperatureHistory: number[] // 过去 30 天的日均温 (°C)
): { stage: string; progress: number; bestDate: string; daysUntil: number } {
  const { lat, lng, elevation = 0 } = location;
  
  // 1. 计算低温累积天数（<15℃）
  let coldDays = 0;
  let totalColdDegrees = 0;
  for (const temp of temperatureHistory) {
    if (temp < 15) {
      coldDays++;
      totalColdDegrees += (15 - temp);
    }
  }
  
  // 2. 计算日照时长变化（简化：根据纬度和日期）
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const日照减少 = Math.max(0, (dayOfYear - 270) / 30); // 秋分后开始计算
  
  // 3. 计算红叶进度
  // 基础进度：低温累积
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
  
  // 日照修正
  progress += 日照减少 * 10;
  
  // 海拔修正（海拔越高，红叶越早）
  const elevationBonus = Math.min(20, elevation / 100);
  progress += elevationBonus;
  
  // 纬度修正（纬度越高，红叶越早）
  const latBonus = Math.max(0, (lat - 30) / 2);
  progress += latBonus;
  
  // 限制在 0-100
  progress = Math.round(Math.min(100, Math.max(0, progress)));
  
  // 确定阶段
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
  
  // 计算最佳观赏日期
  const bestDate = new Date(date);
  bestDate.setDate(bestDate.getDate() + daysUntil);
  
  return {
    stage,
    progress,
    bestDate: bestDate.toISOString().split('T')[0],
    daysUntil
  };
}

// ==================== 辅助函数 ====================

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
  
  // 云量影响（最关键因素）
  if (cloudCover >= 30 && cloudCover <= 70) {
    probability += 30; // 理想云量
  } else if (cloudCover < 30) {
    probability -= 20; // 云太少
  } else if (cloudCover > 80) {
    probability -= 30; // 云太多
  }
  
  // 湿度影响
  if (humidity >= 70) {
    probability += 15;
  } else if (humidity >= 50) {
    probability += 5;
  } else {
    probability -= 10;
  }
  
  // 能见度影响
  if (visibility >= 10) {
    probability += 10;
  } else if (visibility >= 5) {
    probability += 5;
  } else {
    probability -= 10;
  }
  
  // 气溶胶影响（增强红色）
  if (aerosol >= 6) {
    probability += 10;
  } else if (aerosol >= 4) {
    probability += 5;
  }
  
  // 限制在 0-100
  probability = Math.max(0, Math.min(100, probability));
  
  // 确定质量等级
  let quality: GlowForecast['sunriseGlow']['quality'] = '较差';
  if (probability >= 80) quality = '史诗级';
  else if (probability >= 60) quality = '优秀';
  else if (probability >= 40) quality = '良好';
  else if (probability >= 20) quality = '一般';
  
  // 计算强度
  const intensity = Math.round(probability / 10);
  
  // 确定主色调
  let color = '#FFA500'; // 橙色
  if (probability >= 70) {
    color = '#FF4500'; // 橙红色
  } else if (probability >= 50) {
    color = '#FFA500'; // 橙色
  } else if (probability >= 30) {
    color = '#FFD700'; // 金色
  }
  
  // 最佳时间
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
  
  // 计算朝霞概率
  const sunriseGlow = calculateSingleGlow(
    'sunrise',
    date,
    lat,
    lng,
    weatherData
  );
  
  // 计算晚霞概率
  const sunsetGlow = calculateSingleGlow(
    'sunset',
    date,
    lat,
    lng,
    weatherData
  );
  
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

/**
 * 计算云海预报（兼容旧接口）
 */
export function calculateCloudSeaForecast(
  elevation: number,
  weatherData: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    cloudBase?: number;
  },
  season: 'spring' | 'summer' | 'autumn' | 'winter' = 'autumn'
): CloudSeaForecast {
  const { temperature, humidity, windSpeed, cloudBase } = weatherData;
  
  // 基础概率
  let probability = 0;
  
  // 湿度影响（权重 40%）
  if (humidity >= 90) {
    probability += 40;
  } else if (humidity >= 80) {
    probability += 30;
  } else if (humidity >= 70) {
    probability += 15;
  } else if (humidity >= 60) {
    probability += 5;
  }
  
  // 温度影响（权重 20%）
  if (temperature <= 10) {
    probability += 20;
  } else if (temperature <= 15) {
    probability += 15;
  } else if (temperature <= 20) {
    probability += 10;
  } else if (temperature <= 25) {
    probability += 5;
  }
  
  // 风速影响（权重 25%）
  const windMS = windSpeed / 3.6;
  if (windMS >= 1 && windMS <= 3) {
    probability += 25;
  } else if (windMS < 1) {
    probability += 15;
  } else if (windMS <= 5) {
    probability += 10;
  } else if (windMS <= 8) {
    probability += 5;
  }
  
  // 季节修正（权重 15%）
  const seasonBonus = {
    spring: 5,
    summer: 0,
    autumn: 15,
    winter: 10
  };
  probability += seasonBonus[season];
  
  // 海拔修正
  if (elevation >= 1500 && elevation <= 3000) {
    probability = Math.min(100, probability * 1.2);
  } else if (elevation > 3000) {
    probability = Math.min(100, probability * 1.1);
  }
  
  // 确定质量等级
  let quality: CloudSeaForecast['quality'] = '较差';
  if (probability >= 80) quality = '史诗级';
  else if (probability >= 60) quality = '优秀';
  else if (probability >= 40) quality = '良好';
  else if (probability >= 20) quality = '一般';
  
  // 估算云海高度和厚度
  const altitude = cloudBase || (elevation + 200);
  const thickness = humidity > 85 ? 500 : 200;
  
  // 最佳观赏时间
  const bestViewTime = '日出前后 30 分钟';
  
  return {
    probability: Math.round(probability),
    quality,
    altitude,
    thickness,
    bestViewTime,
    conditions: {
      temperature,
      humidity,
      windSpeed,
      inversion: humidity > 85 && windSpeed < 5
    }
  };
}

/**
 * 生成拍摄建议
 */
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

/**
 * 格式化时间为字符串
 */
function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

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

// ==================== 导出 ====================

export default {
  // 朝霞晚霞
  calculateGlowForecast,
  calculateSunsetProbability,
  // 云海
  calculateCloudSeaForecast,
  calculateCloudSeaProbability,
  // 丁达尔效应
  calculateTyndallProbability,
  // 彩虹
  calculateRainbowProbability,
  // 日晕/月晕
  calculateHaloProbability,
  // 雾凇/雨凇
  calculateRimeProbability,
  // 雪景
  calculateSnowForecast,
  // 花期
  calculateFlowerBloom,
  // 红叶
  calculateAutumnFoliage,
  // 综合指数
  calculatePhotographyIndex
};
