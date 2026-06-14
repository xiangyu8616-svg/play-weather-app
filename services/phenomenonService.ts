/**
 * 特殊天气现象算法服务（向后兼容再导出）
 *
 * 已按现象类型拆分为：
 * - services/phenomenon/glow.ts    — 霞光相关
 * - services/phenomenon/cloudSea.ts — 云海相关
 * - services/phenomenon/halo.ts    — 晕/虹/华等大气光学现象
 * - services/phenomenon/index.ts   — 统一导出 + 综合出片指数
 */

// Re-export everything from phenomenon/
export {
  // 霞光
  type GlowForecast,
  type TyndallForecast,
  calculateSunsetProbability,
  calculateTyndallProbability,
  calculateGlowForecast,
  // 云海
  type CloudSeaForecast,
  calculateCloudSeaProbability,
  calculateCloudSeaForecast,
  // 晕/虹/华等
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
  // 综合
  type PhotographyIndex,
  calculatePhotographyIndex,
} from './phenomenon/index.ts';

// 默认导出（兼容旧代码）
import {
  calculateGlowForecast,
  calculateSunsetProbability,
  calculateCloudSeaForecast,
  calculateCloudSeaProbability,
  calculateTyndallProbability,
  calculateRainbowProbability,
  calculateHaloProbability,
  calculateRimeProbability,
  calculateSnowForecast,
  calculateFlowerBloom,
  calculateAutumnFoliage,
  calculatePhotographyIndex,
} from './phenomenon/index.ts';

export default {
  calculateGlowForecast,
  calculateSunsetProbability,
  calculateCloudSeaForecast,
  calculateCloudSeaProbability,
  calculateTyndallProbability,
  calculateRainbowProbability,
  calculateHaloProbability,
  calculateRimeProbability,
  calculateSnowForecast,
  calculateFlowerBloom,
  calculateAutumnFoliage,
  calculatePhotographyIndex,
};
