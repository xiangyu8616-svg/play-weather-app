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

export { default as weatherService } from './weather/weatherService.ts';
export { default as auroraService } from './auroraService.ts';
export { default as astronomyService } from './astronomyService.ts';
export { default as phenomenonService } from './phenomenonService.ts';
export * as cache from './cache.ts';
export { default as qweatherService } from './weather/qweatherService.js';

// 重新导出常用类型
export type {
  RealTimeWeather,
  DailyForecast,
  Location
} from './weather/weatherService.ts';

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
