/**
 * 服务层统一导出
 * 
 * 使用方式：
 * import { 
 *   weatherService, 
 *   auroraService, 
 *   astronomyService, 
 *   phenomenonService,
 *   cache 
 * } from './services';
 */

export { default as weatherService } from './weatherService';
export { default as auroraService } from './auroraService';
export { default as astronomyService } from './astronomyService';
export { default as phenomenonService } from './phenomenonService';
export * as cache from './cache';
export { default as qweatherService } from './qweatherService';

// 重新导出常用类型
export type {
  RealTimeWeather,
  DailyForecast,
  Location
} from './weatherService';

export type {
  KPIndex,
  AuroraLocation,
  AuroraForecast
} from './auroraService';

export type {
  SunTimes,
  MoonPhase,
  PhotographyTimes
} from './astronomyService';

export type {
  GlowForecast,
  CloudSeaForecast,
  PhotographyIndex
} from './phenomenonService';
