/**
 * 天文计算服务
 * 
 * 功能：
 * - 日出日落时间计算
 * - 黄金时刻/蓝色时刻计算
 * - 月相计算
 * - 太阳/月亮位置计算
 * 
 * 依赖库：
 * - suncalc: 日出日落计算
 * - astronomy-engine: 月相计算
 */

import SunCalc from 'suncalc';
import { getCachedData, setCachedData, isCacheValid } from './cache.ts';
import { useI18n } from './i18n';

// 数据层文本语言跟随 i18n（月相名、星座名）
function dataLang(): 'zh' | 'en' {
  try {
    return (useI18n.getState() as any).lang === 'en' ? 'en' : 'zh';
  } catch {
    return 'zh';
  }
}

// 月相名 zh → en
const MOON_PHASE_EN: Record<string, string> = {
  '新月': 'New Moon',
  '蛾眉月': 'Waxing Crescent',
  '上弦月': 'First Quarter',
  '盈凸月': 'Waxing Gibbous',
  '满月': 'Full Moon',
  '亏凸月': 'Waning Gibbous',
  '下弦月': 'Last Quarter',
  '残月': 'Waning Crescent',
};
function localizeMoonPhase(zh: string): string {
  return dataLang() === 'en' ? (MOON_PHASE_EN[zh] || zh) : zh;
}

// 展示层英化：缓存/计算结果始终为中文，渲染时按界面语言转换（防缓存竞态）
const SEASON_FACTOR_EN: Record<string, string> = {
  '夏季银河最佳': 'Best in summer',
  '适宜观测': 'Good for viewing',
  '非银河季': 'Off season',
  '计算失败': 'Unavailable',
};
const MW_QUALITY_EN: Record<string, string> = {
  '极佳': 'Excellent',
  '良好': 'Good',
  '一般': 'Fair',
  '较差': 'Poor',
};
export function moonPhaseNameEn(zh: string): string {
  return MOON_PHASE_EN[zh] || zh;
}
export function seasonFactorEn(zh: string): string {
  return SEASON_FACTOR_EN[zh] || zh;
}
export function mwQualityEn(zh: string): string {
  return MW_QUALITY_EN[zh] || zh;
}

// 星座名 zh → en（查询仍以中文名为键，仅展示层本地化）
const CONSTELLATION_EN: Record<string, string> = {
  '猎户座': 'Orion',
  '大熊座': 'Ursa Major',
  '小熊座': 'Ursa Minor',
  '仙后座': 'Cassiopeia',
  '天鹅座': 'Cygnus',
  '天琴座': 'Lyra',
  '天蝎座': 'Scorpius',
  '人马座': 'Sagittarius',
  '金牛座': 'Taurus',
  '双子座': 'Gemini',
  '狮子座': 'Leo',
  '处女座': 'Virgo',
  '飞马座': 'Pegasus',
  '仙女座': 'Andromeda',
  '英仙座': 'Perseus',
};
function localizeConstellation(zh: string): string {
  return dataLang() === 'en' ? (CONSTELLATION_EN[zh] || zh) : zh;
}

// ==================== 类型定义 ====================

/**
 * 日出日落时间
 */
export interface SunTimes {
  sunrise: Date;          // 日出时间
  sunset: Date;           // 日落时间
  sunriseEnd: Date;       // 日出结束（太阳完全升起）
  sunsetStart: Date;      // 日落开始（太阳开始落下）
  goldenHourEnd: Date;    // 黄金时刻结束（早晨）
  goldenHour: Date;       // 黄金时刻（傍晚开始）= suncalc 原生字段
  solarNoon: Date;        // 正午时间
  nadir: Date;            // 最低点（午夜）
  nightEnd: Date;         // 夜晚结束
  night: Date;            // 夜晚开始
  nauticalDawn: Date;     // 航海黎明
  nauticalDusk: Date;     // 航海黄昏
  civilDawn: Date;        // 民用黎明
  civilDusk: Date;        // 民用黄昏
}

/**
 * 太阳位置
 */
export interface SunPosition {
  azimuth: number;        // 方位角 (弧度)
  altitude: number;       // 高度角 (弧度)
}

/**
 * 月相数据
 */
export interface MoonPhase {
  phase: number;          // 月相 (0-1, 0=新月，0.5=满月)
  phaseName: string;      // 月相名称
  illumination: number;   // 亮度 (%)
  age: number;            // 月龄 (天)
  distance: number;       // 距离 (km)
  angularDiameter: number; // 角直径 (弧度)
}

/**
 * 月出月落时间
 */
export interface MoonTimes {
  moonrise: Date | null;  // 月出时间
  moonset: Date | null;   // 月落时间
  alwaysUp: boolean;      // 是否整日可见
  alwaysDown: boolean;    // 是否整日不可见
}

/**
 * 摄影时机数据
 */
export interface PhotographyTimes {
  goldenHourMorning: {
    start: Date;
    end: Date;
    duration: number;     // 持续时间 (分钟)
  };
  goldenHourEvening: {
    start: Date;
    end: Date;
    duration: number;
  };
  blueHourMorning: {
    start: Date;
    end: Date;
    duration: number;
  };
  blueHourEvening: {
    start: Date;
    end: Date;
    duration: number;
  };
}

// ==================== 核心函数 ====================

/**
 * 获取日出日落时间
 * @param date - 日期
 * @param lat - 纬度
 * @param lng - 经度
 * @returns 日出日落时间
 */
export function getSunTimes(
  date: Date, 
  lat: number, 
  lng: number
): SunTimes {
  try {
    const cacheKey = `astro:sun:${date.toISOString().split('T')[0]}:${lat}:${lng}`;
    // 天文数据变化慢，缓存 24 小时
    // 但由于是本地计算，不需要真正的缓存，直接计算即可
    
    const times = SunCalc.getTimes(date, lat, lng);
    return times;
  } catch (error) {
    console.error('计算日出日落失败:', error);
    throw error;
  }
}

/**
 * 获取太阳位置
 * @param date - 日期时间
 * @param lat - 纬度
 * @param lng - 经度
 * @returns 太阳位置
 */
export function getSunPosition(
  date: Date, 
  lat: number, 
  lng: number
): SunPosition {
  try {
    const position = SunCalc.getPosition(date, lat, lng);
    return {
      azimuth: position.azimuth,
      altitude: position.altitude
    };
  } catch (error) {
    console.error('计算太阳位置失败:', error);
    throw error;
  }
}

/**
 * 获取月相数据
 * @param date - 日期
 * @returns 月相数据
 */
export function getMoonPhase(date: Date): MoonPhase {
  try {
    // suncalc 1.9.0 正确方法名是 getMoonIllumination（非 getMoonPhase）
    // 返回 { fraction: 0-1, phase: 0-1, angle: radians }
    const phaseData = SunCalc.getMoonIllumination(date);
    
    // 计算月龄（从新月开始的天数）
    const moonAge = phaseData.phase * 29.53; // 朔望月周期约 29.53 天
    
    // 获取月相名称（按界面语言本地化）
    const phaseName = localizeMoonPhase(getMoonPhaseName(phaseData.phase));
    
    // 使用 getMoonPosition 获取实际距离
    let distance = 384400; // 默认平均距离
    try {
      const moonPos = SunCalc.getMoonPosition(date, 0, 0);
      if (moonPos && moonPos.distance) {
        distance = Math.round(moonPos.distance);
      }
    } catch (_) {
      // 距离计算失败时使用默认值
    }
    
    return {
      phase: phaseData.phase,
      phaseName,
      illumination: phaseData.fraction * 100, // fraction 是照亮比例 (0-1)
      age: Math.round(moonAge),
      distance,
      angularDiameter: 0.009 // 约 0.5 度
    };
  } catch (error) {
    console.error('计算月相失败:', error);
    // 返回安全的 fallback 数据而非抛出异常，避免阻塞调用方
    return {
      phase: 0,
      phaseName: localizeMoonPhase('新月'),
      illumination: 0,
      age: 0,
      distance: 384400,
      angularDiameter: 0.009
    };
  }
}

/**
 * 获取月出月落时间
 * @param date - 日期
 * @param lat - 纬度
 * @param lng - 经度
 * @returns 月出月落时间
 */
export function getMoonTimes(
  date: Date, 
  lat: number, 
  lng: number
): MoonTimes {
  try {
    // suncalc 1.9.0 返回 { rise, set, alwaysUp, alwaysDown }
    // 需要映射到 MoonTimes 接口的 moonrise/moonset
    const times = SunCalc.getMoonTimes(date, lat, lng, true);
    return {
      moonrise: (times as any).rise || null,
      moonset: (times as any).set || null,
      alwaysUp: !!(times as any).alwaysUp,
      alwaysDown: !!(times as any).alwaysDown
    };
  } catch (error) {
    console.error('计算月出月落失败:', error);
    return {
      moonrise: null,
      moonset: null,
      alwaysUp: false,
      alwaysDown: false
    };
  }
}

/**
 * 获取摄影最佳时机
 * @param date - 日期
 * @param lat - 纬度
 * @param lng - 经度
 * @returns 摄影时机数据
 */
export function getPhotographyTimes(
  date: Date, 
  lat: number, 
  lng: number
): PhotographyTimes {
  try {
    const sunTimes = getSunTimes(date, lat, lng);
    
    // 防御性检查：suncalc 在某些高纬度/极端日期可能返回 undefined
    const safeGet = (field: Date | undefined, fallbackMs: number): Date => 
      field instanceof Date && !isNaN(field.getTime()) ? field : new Date(Date.now() + fallbackMs);
    
    // 计算黄金时刻（早晨: sunrise → goldenHourEnd）
    const goldenHourEnd = safeGet(sunTimes.goldenHourEnd, 3600000);
    const goldenHourStart = safeGet(sunTimes.goldenHour, -3600000);
    const sunrise = safeGet(sunTimes.sunrise, 0);
    const sunset = safeGet(sunTimes.sunset, 43200000);
    const civilDawn = safeGet(sunTimes.civilDawn, -7200000);
    const civilDusk = safeGet(sunTimes.civilDusk, 7200000);
    
    const goldenHourMorning = {
      start: sunrise,
      end: goldenHourEnd,
      duration: Math.round((goldenHourEnd.getTime() - sunrise.getTime()) / 60000)
    };
    
    const goldenHourEvening = {
      start: goldenHourStart,
      end: sunset,
      duration: Math.round((sunset.getTime() - goldenHourStart.getTime()) / 60000)
    };
    
    // 计算蓝色时刻（民用曙暮光）
    const blueHourMorning = {
      start: civilDawn,
      end: sunrise,
      duration: Math.round((sunrise.getTime() - civilDawn.getTime()) / 60000)
    };
    
    const blueHourEvening = {
      start: sunset,
      end: civilDusk,
      duration: Math.round((civilDusk.getTime() - sunset.getTime()) / 60000)
    };
    
    return {
      goldenHourMorning,
      goldenHourEvening,
      blueHourMorning,
      blueHourEvening
    };
  } catch (error) {
    console.error('计算摄影时机失败:', error);
    throw error;
  }
}

/**
 * 判断当前是否为黄金时刻
 * @param lat - 纬度
 * @param lng - 经度
 * @returns 是否为黄金时刻
 */
export function isGoldenHour(lat: number, lng: number): {
  isGoldenHour: boolean;
  type: 'morning' | 'evening' | null;
  remainingMinutes: number;
} {
  try {
    const now = new Date();
    const sunTimes = getSunTimes(now, lat, lng);
    
    // 防御性检查
    if (!sunTimes.sunrise || !sunTimes.sunset) {
      return { isGoldenHour: false, type: null, remainingMinutes: 0 };
    }
    
    // 检查是否在早晨黄金时刻
    if (sunTimes.goldenHourEnd && now >= sunTimes.sunrise && now <= sunTimes.goldenHourEnd) {
      const remaining = Math.round((sunTimes.goldenHourEnd.getTime() - now.getTime()) / 60000);
      return {
        isGoldenHour: true,
        type: 'morning',
        remainingMinutes: remaining
      };
    }
    
    // 检查是否在傍晚黄金时刻
    if (sunTimes.goldenHour && now >= sunTimes.goldenHour && now <= sunTimes.sunset) {
      const remaining = Math.round((sunTimes.sunset.getTime() - now.getTime()) / 60000);
      return {
        isGoldenHour: true,
        type: 'evening',
        remainingMinutes: remaining
      };
    }
    
    return {
      isGoldenHour: false,
      type: null,
      remainingMinutes: 0
    };
  } catch (error) {
    console.error('判断黄金时刻失败:', error);
    return {
      isGoldenHour: false,
      type: null,
      remainingMinutes: 0
    };
  }
}

/**
 * 计算日照金山概率
 * @param lat - 纬度
 * @param lng - 经度
 * @param cloudCover - 云量 (0-100)
 * @returns 概率 (0-100)
 */
export function calculateGoldenMountainProbability(
  lat: number, 
  lng: number, 
  cloudCover: number
): number {
  try {
    const goldenHour = isGoldenHour(lat, lng);
    
    // 如果不是黄金时刻，概率为 0
    if (!goldenHour.isGoldenHour) {
      return 0;
    }
    
    // 基础概率
    let probability = 80;
    
    // 云量影响（少量云增加概率，多云降低概率）
    if (cloudCover < 20) {
      probability = 60; // 晴空，概率较低（需要云来反射阳光）
    } else if (cloudCover >= 20 && cloudCover < 50) {
      probability = 90; // 理想云量
    } else if (cloudCover >= 50 && cloudCover < 80) {
      probability = 50; // 云太多
    } else {
      probability = 10; // 阴天
    }
    
    // 黄金时刻剩余时间影响
    if (goldenHour.remainingMinutes < 10) {
      probability *= 0.7; // 时间紧迫
    }
    
    return Math.round(probability);
  } catch (error) {
    console.error('计算日照金山概率失败:', error);
    return 0;
  }
}

/**
 * 银河可见性数据
 */
export interface MilkyWayVisibility {
  visible: boolean;         // 是否可见
  quality: '极佳' | '良好' | '一般' | '较差'; // 观测质量
  bestTime: {               // 最佳观测时间
    start: Date;
    end: Date;
  };
  coreAltitude: number;     // 银心高度角 (度)
  moonInterference: number; // 月光干扰 (0-100)
  seasonFactor: string;     // 季节因素
}

/**
 * 星座位置数据
 */
export interface ConstellationPosition {
  name: string;             // 星座名称
  altitude: number;         // 高度角 (度)
  azimuth: number;          // 方位角 (度)
  visible: boolean;         // 是否可见（在地平线上）
  riseTime: Date | null;    // 升起时间
  setTime: Date | null;     // 落下时间
  bestViewingTime: Date;    // 最佳观测时间（中天时刻）
}

/**
 * 获取银河可见时间
 * 
 * 银河观测条件：
 * 1. 银心升落时间（夏季最佳）
 * 2. 月相过滤（新月前后 5 天最佳）
 * 3. 季节判断（北半球 3-10 月可见）
 * 
 * @param date - 日期
 * @param lat - 纬度
 * @param lng - 经度
 * @returns 银河可见性数据
 */
export function getMilkyWayVisibility(
  date: Date,
  lat: number,
  lng: number
): MilkyWayVisibility {
  try {
    const sunTimes = getSunTimes(date, lat, lng);
    const moonPhase = getMoonPhase(date);
    
    // 1. 季节判断（北半球 3-10 月为银河季）
    const month = date.getMonth() + 1;
    const isGalaxySeason = month >= 3 && month <= 10;
    const seasonFactor = isGalaxySeason 
      ? (month >= 6 && month <= 8 ? '夏季银河最佳' : '适宜观测')
      : '非银河季';
    
    // 2. 月相过滤（新月前后 5 天最佳）
    // 月相 0=新月，0.5=满月
    const moonIllumination = moonPhase.illumination;
    const moonInterference = moonIllumination; // 亮度越高干扰越大
    
    // 3. 计算银心大致位置（简化处理）
    // 银心在人马座，夏季午夜前后达到最高点
    const hour = date.getHours();
    // 夏季（6-8 月）银心在午夜前后高度最高
    let coreAltitude = 0;
    if (isGalaxySeason) {
      // 简化计算：假设银心在午夜时高度 = 90 - |lat - 银心赤纬|
      // 银心赤纬约 -29 度
      const maxAltitude = 90 - Math.abs(lat - (-29));
      // 根据时间调整（午夜前后最高）
      const hourOffset = Math.abs(hour - 0);
      coreAltitude = maxAltitude * Math.max(0, 1 - hourOffset / 12);
    }
    
    // 4. 判断可见性
    const isNight = hour >= 22 || hour <= 4; // 晚上 10 点到凌晨 4 点
    const lowMoonInterference = moonIllumination < 30; // 月光干扰低
    const visible = isGalaxySeason && isNight && lowMoonInterference && coreAltitude > 10;
    
    // 5. 计算观测质量
    let quality: MilkyWayVisibility['quality'] = '较差';
    if (visible) {
      if (moonIllumination < 10 && coreAltitude > 40) {
        quality = '极佳';
      } else if (moonIllumination < 30 && coreAltitude > 25) {
        quality = '良好';
      } else if (moonIllumination < 50) {
        quality = '一般';
      }
    }
    
    // 6. 计算最佳观测时间（日落后 2 小时到日出前 2 小时）
    const bestStart = new Date(sunTimes.sunset.getTime() + 2 * 60 * 60 * 1000);
    const bestEnd = new Date(sunTimes.sunrise.getTime() - 2 * 60 * 60 * 1000);
    
    return {
      visible,
      quality,
      bestTime: {
        start: bestStart,
        end: bestEnd
      },
      coreAltitude: Math.round(coreAltitude),
      moonInterference: Math.round(moonInterference),
      seasonFactor
    };
  } catch (error) {
    console.error('计算银河可见性失败:', error);
    return {
      visible: false,
      quality: '较差',
      bestTime: { start: new Date(), end: new Date() },
      coreAltitude: 0,
      moonInterference: 100,
      seasonFactor: '计算失败'
    };
  }
}

/**
 * 获取星座位置
 * 
 * 使用简化算法计算星座的视位置
 * 实际应用中应使用精确的星历表数据
 * 
 * @param date - 日期时间
 * @param lat - 纬度
 * @param lng - 经度
 * @param constellationName - 星座名称
 * @returns 星座位置数据
 */
export function getConstellationPosition(
  date: Date,
  lat: number,
  lng: number,
  constellationName: string
): ConstellationPosition {
  try {
    // 常见星座的近似赤经赤纬（J2000 历元）
    const constellationData: Record<string, { ra: number; dec: number }> = {
      '猎户座': { ra: 85, dec: 0 },      // Orion
      '大熊座': { ra: 165, dec: 50 },     // Ursa Major
      '小熊座': { ra: 225, dec: 75 },     // Ursa Minor
      '仙后座': { ra: 15, dec: 60 },      // Cassiopeia
      '天鹅座': { ra: 305, dec: 40 },     // Cygnus
      '天琴座': { ra: 280, dec: 35 },     // Lyra
      '天蝎座': { ra: 250, dec: -25 },    // Scorpius
      '人马座': { ra: 285, dec: -25 },    // Sagittarius
      '金牛座': { ra: 75, dec: 20 },      // Taurus
      '双子座': { ra: 105, dec: 25 },     // Gemini
      '狮子座': { ra: 165, dec: 15 },     // Leo
      '处女座': { ra: 195, dec: 0 },      // Virgo
      '飞马座': { ra: 345, dec: 20 },     // Pegasus
      '仙女座': { ra: 15, dec: 35 },      // Andromeda
      '英仙座': { ra: 45, dec: 45 },      // Perseus
    };
    
    const data = constellationData[constellationName];
    if (!data) {
      throw new Error(`未知星座：${constellationName}`);
    }
    
    // 计算恒星时（简化算法）
    const J2000 = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const daysSinceJ2000 = (date.getTime() - J2000.getTime()) / (24 * 60 * 60 * 1000);
    
    // 本地恒星时（度）
    const lst = (280.46061837 + 360.98564736629 * daysSinceJ2000 + lng) % 360;
    
    // 时角（度）
    let hourAngle = lst - data.ra;
    if (hourAngle < 0) hourAngle += 360;
    
    // 转换为弧度
    const haRad = hourAngle * Math.PI / 180;
    const decRad = data.dec * Math.PI / 180;
    const latRad = lat * Math.PI / 180;
    
    // 计算高度角和方位角
    const sinAlt = Math.sin(decRad) * Math.sin(latRad) + 
                   Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
    const altitude = Math.asin(sinAlt) * 180 / Math.PI;
    
    const cosAz = (Math.sin(decRad) - Math.sin(latRad) * sinAlt) / 
                  (Math.cos(latRad) * Math.cos(altitude * Math.PI / 180));
    let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180 / Math.PI;
    
    // 方位角修正
    if (Math.sin(haRad) > 0) {
      azimuth = 360 - azimuth;
    }
    
    // 判断是否可见（地平线上）
    const visible = altitude > 0;
    
    // 计算中天时刻（简化：星座在子午线上的时间）
    const transitHour = ((data.ra - lst + 360) % 360) / 15; // 转换为小时
    const bestViewingTime = new Date(date.getTime() + transitHour * 60 * 60 * 1000);
    
    // 升起/落下时间（简化计算）
    // 实际应使用更精确的算法
    const riseTime = visible ? null : new Date(date.getTime() + (24 - transitHour) * 60 * 60 * 1000);
    const setTime = visible ? new Date(date.getTime() + (12 - transitHour) * 60 * 60 * 1000) : null;
    
    return {
      name: localizeConstellation(constellationName),
      altitude: Math.round(altitude * 10) / 10,
      azimuth: Math.round(azimuth * 10) / 10,
      visible,
      riseTime,
      setTime,
      bestViewingTime
    };
  } catch (error) {
    console.error('计算星座位置失败:', error);
    return {
      name: localizeConstellation(constellationName),
      altitude: 0,
      azimuth: 0,
      visible: false,
      riseTime: null,
      setTime: null,
      bestViewingTime: date
    };
  }
}

// ==================== 辅助函数 ====================

/**
 * 获取月相名称
 */
function getMoonPhaseName(phase: number): string {
  if (phase < 0.03) return '新月';
  if (phase < 0.22) return '蛾眉月';
  if (phase < 0.28) return '上弦月';
  if (phase < 0.47) return '盈凸月';
  if (phase < 0.53) return '满月';
  if (phase < 0.72) return '亏凸月';
  if (phase < 0.78) return '下弦月';
  if (phase < 0.97) return '残月';
  return '新月';
}

/**
 * 格式化时间为字符串
 */
export function formatTime(date: Date): string {
  if (!date) return '--:--';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// ==================== 使用示例 ====================

/**
 * 使用示例：
 * 
 * import { 
 *   getSunTimes, 
 *   getMoonPhase, 
 *   getPhotographyTimes,
 *   isGoldenHour,
 *   formatTime
 * } from './services/astronomyService';
 * 
 * // 1. 获取日出日落时间
 * const now = new Date();
 * const sunTimes = getSunTimes(now, 39.9042, 116.4074); // 北京
 * console.log(`日出：${formatTime(sunTimes.sunrise)}`);
 * console.log(`日落：${formatTime(sunTimes.sunset)}`);
 * 
 * // 2. 获取月相
 * const moonPhase = getMoonPhase(now);
 * console.log(`月相：${moonPhase.phaseName}, 亮度：${moonPhase.illumination.toFixed(0)}%`);
 * 
 * // 3. 获取摄影时机
 * const photoTimes = getPhotographyTimes(now, 27.989, 86.925); // 珠峰
 * console.log(`早晨黄金时刻：${formatTime(photoTimes.goldenHourMorning.start)} - ${formatTime(photoTimes.goldenHourMorning.end)}`);
 * console.log(`持续时间：${photoTimes.goldenHourMorning.duration}分钟`);
 * 
 * // 4. 检查是否为黄金时刻
 * const goldenHour = isGoldenHour(27.989, 86.925);
 * if (goldenHour.isGoldenHour) {
 *   console.log(`当前是${goldenHour.type}黄金时刻，剩余${goldenHour.remainingMinutes}分钟`);
 * }
 * 
 * // 5. 计算日照金山概率
 * const probability = calculateGoldenMountainProbability(27.989, 86.925, 30);
 * console.log(`日照金山概率：${probability}%`);
 */

export default {
  getSunTimes,
  getSunPosition,
  getMoonPhase,
  getMoonTimes,
  getPhotographyTimes,
  isGoldenHour,
  calculateGoldenMountainProbability,
  getMilkyWayVisibility,
  getConstellationPosition,
  formatTime
};
