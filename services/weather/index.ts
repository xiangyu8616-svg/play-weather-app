/**
 * 天气服务统一导出
 */

export { default as qweatherService } from './qweatherService.js';
export { default as weatherService } from './weatherService.ts';

// 重新导出常用类型
export type {
  RealTimeWeather,
  DailyForecast,
  Location
} from './weatherService.ts';
