/**
 * 特殊天气现象算法测试数据
 * 
 * 为每个核心算法提供测试用例，支持单元测试和算法验证
 */

// ==================== 朝霞晚霞测试用例 ====================

export const sunsetTestCases = [
  {
    name: '史诗级朝霞 - 理想条件',
    input: {
      cloudCover: 50,
      humidity: 70,
      visibility: 20,
      aerosol: 5.5,
      sunAltitude: 3
    },
    expected: {
      probability: 85,
      level: '史诗级',
      confidence: 0.9
    }
  },
  {
    name: '优秀晚霞 - 云量偏多',
    input: {
      cloudCover: 75,
      humidity: 65,
      visibility: 15,
      aerosol: 5,
      sunAltitude: -2
    },
    expected: {
      probability: 65,
      level: '壮观',
      confidence: 0.85
    }
  },
  {
    name: '普通朝霞 - 云量不足',
    input: {
      cloudCover: 20,
      humidity: 50,
      visibility: 25,
      aerosol: 3,
      sunAltitude: 5
    },
    expected: {
      probability: 35,
      level: '普通',
      confidence: 0.75
    }
  },
  {
    name: '较差条件 - 阴天',
    input: {
      cloudCover: 95,
      humidity: 85,
      visibility: 5,
      aerosol: 7,
      sunAltitude: 0
    },
    expected: {
      probability: 15,
      level: '一般',
      confidence: 0.8
    }
  },
  {
    name: '气溶胶增强 - 污染后晚霞',
    input: {
      cloudCover: 45,
      humidity: 60,
      visibility: 12,
      aerosol: 8,
      sunAltitude: -4
    },
    expected: {
      probability: 70,
      level: '壮观',
      confidence: 0.82
    }
  }
];

// ==================== 云海测试用例 ====================

export const cloudSeaTestCases = [
  {
    name: '极高概率云海 - 逆温层 + 高湿',
    input: {
      groundTemp: 8,
      upperTemp: 12,
      humidity: 95,
      windSpeed: 1.5,
      elevation: 2000,
      terrain: '山谷',
      hour: 6
    },
    expected: {
      probability: 92,
      level: '极高概率',
      bestTime: '06:00-08:00'
    }
  },
  {
    name: '高概率云海 - 秋季山地',
    input: {
      groundTemp: 10,
      upperTemp: 11,
      humidity: 88,
      windSpeed: 2,
      elevation: 1500,
      terrain: '山地',
      hour: 7
    },
    expected: {
      probability: 75,
      level: '高概率',
      bestTime: '06:00-08:00'
    }
  },
  {
    name: '中等概率 - 湿度不足',
    input: {
      groundTemp: 12,
      upperTemp: 13,
      humidity: 75,
      windSpeed: 3,
      elevation: 1000,
      terrain: '山地',
      hour: 8
    },
    expected: {
      probability: 45,
      level: '中等概率',
      bestTime: '06:00-08:00'
    }
  },
  {
    name: '较低概率 - 大风',
    input: {
      groundTemp: 9,
      upperTemp: 11,
      humidity: 90,
      windSpeed: 6,
      elevation: 2000,
      terrain: '山谷',
      hour: 6
    },
    expected: {
      probability: 35,
      level: '较低概率',
      bestTime: '06:00-08:00'
    }
  },
  {
    name: '低概率 - 夏季午后',
    input: {
      groundTemp: 20,
      upperTemp: 18,
      humidity: 60,
      windSpeed: 2,
      elevation: 1500,
      terrain: '山地',
      hour: 14
    },
    expected: {
      probability: 15,
      level: '低概率',
      bestTime: '06:00-08:00'
    }
  }
];

// ==================== 丁达尔效应测试用例 ====================

export const tyndallTestCases = [
  {
    name: '耶稣光 - 晨雾条件',
    input: {
      cloudCover: 60,
      humidity: 85,
      aerosol: 5,
      sunAltitude: 8,
      sunAzimuth: 90
    },
    expected: {
      probability: 78,
      direction: '西',
      bestTime: '日出后 1 小时内'
    }
  },
  {
    name: '优秀丁达尔 - 林间光束',
    input: {
      cloudCover: 50,
      humidity: 80,
      aerosol: 4,
      sunAltitude: 12,
      sunAzimuth: 135
    },
    expected: {
      probability: 65,
      direction: '西北',
      bestTime: '日出后 1 小时内'
    }
  },
  {
    name: '一般条件 - 云量偏少',
    input: {
      cloudCover: 30,
      humidity: 70,
      aerosol: 3,
      sunAltitude: 10,
      sunAzimuth: 100
    },
    expected: {
      probability: 42,
      direction: '西',
      bestTime: '日出后 1 小时内'
    }
  },
  {
    name: '较差条件 - 阳光过强',
    input: {
      cloudCover: 20,
      humidity: 50,
      aerosol: 2,
      sunAltitude: 25,
      sunAzimuth: 180
    },
    expected: {
      probability: 25,
      direction: '北',
      bestTime: '日出后 1 小时内'
    }
  }
];

// ==================== 彩虹测试用例 ====================

export const rainbowTestCases = [
  {
    name: '双彩虹 - 雨后初晴',
    input: {
      precipitation1h: 5,
      precipitationNow: 2,
      sunAltitude: 20,
      sunAzimuth: 270,
      cloudCover: 50,
      isNight: false
    },
    expected: {
      probability: 85,
      direction: '东',
      type: '双彩虹'
    }
  },
  {
    name: '单彩虹 - 小雨',
    input: {
      precipitation1h: 1,
      precipitationNow: 0.5,
      sunAltitude: 30,
      sunAzimuth: 250,
      cloudCover: 60,
      isNight: false
    },
    expected: {
      probability: 60,
      direction: '东',
      type: '单彩虹'
    }
  },
  {
    name: '月虹 - 夜间条件',
    input: {
      precipitation1h: 2,
      precipitationNow: 0,
      sunAltitude: -10,
      sunAzimuth: 270,
      cloudCover: 40,
      isNight: true
    },
    expected: {
      probability: 35,
      direction: '东',
      type: '月虹'
    }
  },
  {
    name: '无彩虹 - 太阳过高',
    input: {
      precipitation1h: 3,
      precipitationNow: 1,
      sunAltitude: 50,
      sunAzimuth: 180,
      cloudCover: 70,
      isNight: false
    },
    expected: {
      probability: 30,
      direction: '北',
      type: '单彩虹'
    }
  }
];

// ==================== 日晕/月晕测试用例 ====================

export const haloTestCases = [
  {
    name: '22°晕 - 卷层云条件',
    input: {
      cirrusCloud: true,
      iceCrystal: 6,
      cloudAltitude: 8000,
      celestial: '太阳',
      cloudCover: 50
    },
    expected: {
      probability: 75,
      type: '22°晕'
    }
  },
  {
    name: '环天顶弧 - 冰晶充足',
    input: {
      cirrusCloud: true,
      iceCrystal: 8,
      cloudAltitude: 9000,
      celestial: '太阳',
      cloudCover: 40
    },
    expected: {
      probability: 82,
      type: '环天顶弧'
    }
  },
  {
    name: '月晕 - 夜间条件',
    input: {
      cirrusCloud: true,
      iceCrystal: 5,
      cloudAltitude: 7000,
      celestial: '月亮',
      cloudCover: 45
    },
    expected: {
      probability: 65,
      type: '22°晕'
    }
  },
  {
    name: '无晕 - 无卷层云',
    input: {
      cirrusCloud: false,
      iceCrystal: 3,
      cloudAltitude: 3000,
      celestial: '太阳',
      cloudCover: 70
    },
    expected: {
      probability: 25,
      type: '22°晕'
    }
  }
];

// ==================== 雾凇/雨凇测试用例 ====================

export const rimeTestCases = [
  {
    name: '雾凇 - 理想条件',
    input: {
      temperature: -5,
      humidity: 95,
      windSpeed: 2,
      precipitationType: '雾',
      fog: true
    },
    expected: {
      probability: 92,
      type: '雾凇'
    }
  },
  {
    name: '雨凇 - 冻雨条件',
    input: {
      temperature: 1,
      humidity: 92,
      windSpeed: 1.5,
      precipitationType: '雨',
      fog: false
    },
    expected: {
      probability: 70,
      type: '雨凇'
    }
  },
  {
    name: '一般雾凇 - 湿度稍低',
    input: {
      temperature: -3,
      humidity: 85,
      windSpeed: 2.5,
      precipitationType: '雾',
      fog: true
    },
    expected: {
      probability: 65,
      type: '雾凇'
    }
  },
  {
    name: '无凇 - 温度过高',
    input: {
      temperature: 5,
      humidity: 80,
      windSpeed: 3,
      precipitationType: '雨',
      fog: false
    },
    expected: {
      probability: 20,
      type: '无'
    }
  }
];

// ==================== 雪景测试用例 ====================

export const snowTestCases = [
  {
    name: '暴雪 - 强降雪',
    input: {
      temperature: -3,
      precipitationType: '雪',
      snowDepth: 5,
      snowfall: 12
    },
    expected: {
      isSnowing: true,
      snowDepth: 17,
      level: '暴雪',
      quality: '史诗级'
    }
  },
  {
    name: '中雪 - 持续降雪',
    input: {
      temperature: -1,
      precipitationType: '雪',
      snowDepth: 8,
      snowfall: 4
    },
    expected: {
      isSnowing: true,
      snowDepth: 12,
      level: '中雪',
      quality: '良好'
    }
  },
  {
    name: '初雪 - 第一场雪',
    input: {
      temperature: 0,
      precipitationType: '雪',
      snowDepth: 0,
      snowfall: 2
    },
    expected: {
      isSnowing: true,
      snowDepth: 2,
      level: '初雪',
      quality: '优秀'
    }
  },
  {
    name: '积雪 - 雪后晴天',
    input: {
      temperature: -5,
      precipitationType: '晴',
      snowDepth: 35,
      snowfall: 0
    },
    expected: {
      isSnowing: false,
      snowDepth: 35,
      level: '积雪',
      quality: '史诗级'
    }
  }
];

// ==================== 花期测试用例 ====================

export const flowerTestCases = [
  {
    name: '樱花 - 盛开期',
    input: {
      date: new Date('2026-04-05'),
      location: { lat: 31.2304, lng: 121.4737, elevation: 10 },
      flowerType: '樱花',
      temperatureHistory: Array(30).fill(12).concat(Array(30).fill(15)).concat(Array(30).fill(18))
    },
    expected: {
      stage: '盛开',
      progress: 100,
      daysUntil: 0
    }
  },
  {
    name: '樱花 - 初开期',
    input: {
      date: new Date('2026-03-25'),
      location: { lat: 31.2304, lng: 121.4737, elevation: 10 },
      flowerType: '樱花',
      temperatureHistory: Array(60).fill(10).concat(Array(30).fill(13))
    },
    expected: {
      stage: '初开',
      progress: 85,
      daysUntil: 3
    }
  },
  {
    name: '油菜花 - 未开',
    input: {
      date: new Date('2026-02-15'),
      location: { lat: 26.0745, lng: 119.2969, elevation: 50 },
      flowerType: '油菜花',
      temperatureHistory: Array(90).fill(8)
    },
    expected: {
      stage: '未开',
      progress: 40,
      daysUntil: 20
    }
  }
];

// ==================== 红叶测试用例 ====================

export const foliageTestCases = [
  {
    name: '红叶 - 最佳观赏期',
    input: {
      date: new Date('2026-11-15'),
      location: { lat: 39.9042, lng: 116.4074, elevation: 500 },
      temperatureHistory: Array(10).fill(10).concat(Array(20).fill(8))
    },
    expected: {
      stage: '最佳观赏',
      progress: 92,
      daysUntil: 0
    }
  },
  {
    name: '红叶 - 全红期',
    input: {
      date: new Date('2026-11-01'),
      location: { lat: 39.9042, lng: 116.4074, elevation: 300 },
      temperatureHistory: Array(15).fill(12).concat(Array(15).fill(10))
    },
    expected: {
      stage: '全红',
      progress: 75,
      daysUntil: 0
    }
  },
  {
    name: '红叶 - 初红期',
    input: {
      date: new Date('2026-10-15'),
      location: { lat: 39.9042, lng: 116.4074, elevation: 200 },
      temperatureHistory: Array(20).fill(16).concat(Array(10).fill(14))
    },
    expected: {
      stage: '初红',
      progress: 45,
      daysUntil: 8
    }
  },
  {
    name: '红叶 - 高海拔提前',
    input: {
      date: new Date('2026-10-20'),
      location: { lat: 39.9042, lng: 116.4074, elevation: 1500 },
      temperatureHistory: Array(15).fill(10).concat(Array(15).fill(8))
    },
    expected: {
      stage: '最佳观赏',
      progress: 88,
      daysUntil: 0
    }
  }
];

// ==================== 综合出片指数测试用例 ====================

export const photographyIndexTestCases = [
  {
    name: '史诗级 - 完美条件',
    input: {
      date: new Date('2026-04-15 18:00'),
      lat: 27.989,
      lng: 86.925,
      weatherData: {
        cloudCover: 45,
        humidity: 65,
        visibility: 25,
        temperature: 15,
        windSpeed: 8
      },
      phenomenonType: 'sunset'
    },
    expected: {
      overall: 88,
      level: '史诗级'
    }
  },
  {
    name: '优秀 - 良好条件',
    input: {
      date: new Date('2026-06-20 06:30'),
      lat: 46.8797,
      lng: -121.7269,
      weatherData: {
        cloudCover: 35,
        humidity: 70,
        visibility: 20,
        temperature: 12,
        windSpeed: 5
      },
      phenomenonType: 'glow'
    },
    expected: {
      overall: 75,
      level: '优秀'
    }
  },
  {
    name: '一般 - 阴天',
    input: {
      date: new Date('2026-09-10 12:00'),
      lat: 35.6762,
      lng: 139.6503,
      weatherData: {
        cloudCover: 85,
        humidity: 80,
        visibility: 8,
        temperature: 22,
        windSpeed: 3
      },
      phenomenonType: 'general'
    },
    expected: {
      overall: 38,
      level: '一般'
    }
  }
];

// ==================== 导出所有测试用例 ====================

export const allTestCases = {
  sunset: sunsetTestCases,
  cloudSea: cloudSeaTestCases,
  tyndall: tyndallTestCases,
  rainbow: rainbowTestCases,
  halo: haloTestCases,
  rime: rimeTestCases,
  snow: snowTestCases,
  flower: flowerTestCases,
  foliage: foliageTestCases,
  photographyIndex: photographyIndexTestCases
};

// ==================== 使用示例 ====================

/**
 * 使用示例：
 * 
 * import { allTestCases } from './data/testData';
 * import { calculateSunsetProbability } from '../services/phenomenonService';
 * 
 * // 运行朝霞晚霞测试
 * allTestCases.sunset.forEach(testCase => {
 *   const result = calculateSunsetProbability(testCase.input);
 *   console.log(`测试：${testCase.name}`);
 *   console.log(`期望概率：${testCase.expected.probability}, 实际：${result.probability}`);
 *   console.log(`期望等级：${testCase.expected.level}, 实际：${result.level}`);
 *   console.log('---');
 * });
 */

export default allTestCases;
