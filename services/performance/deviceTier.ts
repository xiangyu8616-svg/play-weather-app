/**
 * 设备性能分档服务
 *
 * 用途：
 * - 低端机默认使用地球仪 optimized/performance 模式（ROADMAP 2.8）
 * - 帧率检测自动降级的质量阶梯定义
 *
 * 设计：纯函数可单测；平台信号采集与计算分离
 */

export type DeviceTier = 'low' | 'medium' | 'high';

export interface DeviceSignals {
  /** navigator.hardwareConcurrency（CPU 逻辑核数） */
  hardwareConcurrency?: number;
  /** navigator.deviceMemory（GB，仅 Chrome 系，可能 undefined） */
  deviceMemory?: number;
  /** 物理像素总数 width*height*ratio²（native 用） */
  totalPixels?: number;
  /** 移动端 UA（web 用） */
  isMobileUA?: boolean;
}

/**
 * 计算设备分档
 * - low：核数 ≤4，或内存 ≤4GB，或（移动端且低分辨率小屏）
 * - high：核数 ≥8 且（内存未知或 ≥8GB）
 * - 其余 medium
 */
export function computeDeviceTier(s: DeviceSignals): DeviceTier {
  const cores = s.hardwareConcurrency ?? 4;
  const mem = s.deviceMemory; // 可能 undefined（Safari/Firefox）

  if (cores <= 2) return 'low';
  if (mem != null && mem <= 2) return 'low';
  if (cores <= 4) {
    // 4 核设备：内存明确较大才算 medium，否则 low
    return mem != null && mem >= 8 ? 'medium' : 'low';
  }
  if (cores >= 8 && (mem == null || mem >= 8)) return 'high';
  return 'medium';
}

export type GlobePerformanceMode = 'performance' | 'balanced' | 'quality';

/** 设备分档 → 地球仪初始性能模式 */
export function performanceModeForTier(tier: DeviceTier): GlobePerformanceMode {
  if (tier === 'low') return 'performance';
  if (tier === 'high') return 'quality';
  return 'balanced';
}

/**
 * 帧率自动降级阶梯（从高到低）
 * 每级：渲染像素比 + 是否显示大气层
 */
export interface GlobeQualityStep {
  pixelRatio: number;
  atmosphere: boolean;
}

export const GLOBE_QUALITY_LADDER: GlobeQualityStep[] = [
  { pixelRatio: 1.0, atmosphere: true },   // 0 quality 起点
  { pixelRatio: 0.75, atmosphere: true },  // 1 balanced 起点
  { pixelRatio: 0.6, atmosphere: true },   // 2
  { pixelRatio: 0.5, atmosphere: false },  // 3 performance 起点/终点
];

/** 初始模式 → 阶梯下标 */
export function initialQualityIndex(mode: GlobePerformanceMode): number {
  if (mode === 'quality') return 0;
  if (mode === 'balanced') return 1;
  return 3; // performance：直接在最低档
}

/** 降一级；已到最低返回 null */
export function nextDegradeIndex(current: number): number | null {
  const next = current + 1;
  return next < GLOBE_QUALITY_LADDER.length ? next : null;
}

/** FPS 采样判定：连续低帧窗口数达到阈值则建议降级 */
export function shouldDegrade(avgFps: number, consecutiveLowWindows: number, threshold = 30, requiredWindows = 2): boolean {
  return avgFps < threshold && consecutiveLowWindows >= requiredWindows;
}

/** 采集当前平台信号（浏览器/ RN 环境均做了防御） */
export function getDeviceSignals(): DeviceSignals {
  const signals: DeviceSignals = {};
  try {
    if (typeof navigator !== 'undefined') {
      const nav = navigator as any;
      if (typeof nav.hardwareConcurrency === 'number') {
        signals.hardwareConcurrency = nav.hardwareConcurrency;
      }
      if (typeof nav.deviceMemory === 'number') {
        signals.deviceMemory = nav.deviceMemory;
      }
      if (typeof nav.userAgent === 'string') {
        signals.isMobileUA = /Android|iPhone|iPad|iPod/i.test(nav.userAgent);
      }
    }
  } catch {
    // 忽略采集失败，走默认
  }
  return signals;
}

/** 一站式：当前设备分档 */
export function getDeviceTier(): DeviceTier {
  return computeDeviceTier(getDeviceSignals());
}
