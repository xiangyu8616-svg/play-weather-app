/**
 * 云海相关算法
 * - 云海预测
 */

// ==================== 类型定义 ====================

/**
 * 云海预报
 */
export interface CloudSeaForecast {
  probability: number;
  quality: '史诗级' | '优秀' | '良好' | '一般' | '较差';
  altitude: number;
  thickness: number;
  bestViewTime: string;
  conditions: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    inversion: boolean;
  };
}

// ==================== 核心函数 ====================

/**
 * 计算云海概率（最高优先级 🔥）
 */
export function calculateCloudSeaProbability(data: {
  groundTemp: number;
  upperTemp: number;
  humidity: number;
  windSpeed: number;
  elevation: number;
  terrain?: '山谷' | '盆地' | '平原' | '山地';
  hour?: number;
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
    windScore = 100;
  } else if (windSpeed < 0.5) {
    windScore = 80;
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
  if (elevation >= 1000 && elevation <= 3000) {
    terrainScore = Math.min(100, terrainScore + 20);
  } else if (elevation > 3000) {
    terrainScore = Math.min(100, terrainScore + 10);
  }
  probability += terrainScore * 0.15;

  // 5. 时间条件（权重 10%）
  let timeScore = 0;
  if (hour >= 5 && hour <= 8) {
    timeScore = 100;
  } else if (hour >= 4 || hour === 9) {
    timeScore = 60;
  } else if (hour >= 3 || hour === 10) {
    timeScore = 30;
  }
  probability += timeScore * 0.1;

  probability = Math.round(Math.max(0, Math.min(100, probability)));

  let level = '低概率';
  if (probability >= 80) level = '极高概率';
  else if (probability >= 60) level = '高概率';
  else if (probability >= 40) level = '中等概率';
  else if (probability >= 20) level = '较低概率';

  const bestTime = '06:00-08:00';

  return { probability, level, bestTime };
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

  let probability = 0;

  if (humidity >= 90) {
    probability += 40;
  } else if (humidity >= 80) {
    probability += 30;
  } else if (humidity >= 70) {
    probability += 15;
  } else if (humidity >= 60) {
    probability += 5;
  }

  if (temperature <= 10) {
    probability += 20;
  } else if (temperature <= 15) {
    probability += 15;
  } else if (temperature <= 20) {
    probability += 10;
  } else if (temperature <= 25) {
    probability += 5;
  }

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

  const seasonBonus = {
    spring: 5,
    summer: 0,
    autumn: 15,
    winter: 10
  };
  probability += seasonBonus[season];

  if (elevation >= 1500 && elevation <= 3000) {
    probability = Math.min(100, probability * 1.2);
  } else if (elevation > 3000) {
    probability = Math.min(100, probability * 1.1);
  }

  let quality: CloudSeaForecast['quality'] = '较差';
  if (probability >= 80) quality = '史诗级';
  else if (probability >= 60) quality = '优秀';
  else if (probability >= 40) quality = '良好';
  else if (probability >= 20) quality = '一般';

  const altitude = cloudBase || (elevation + 200);
  const thickness = humidity > 85 ? 500 : 200;

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
