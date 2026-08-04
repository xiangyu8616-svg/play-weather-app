/**
 * NOAA SWPC 极光数据服务（1.6）
 *
 * 数据源：NOAA Space Weather Prediction Center（免费、无需 Key、CORS 开放）
 *   - 行星 K 指数预报：https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json
 *     3 小时间隔，含实测（observed="observed"）与预测（observed="predicted"）混合
 *
 * 提供：
 *   - getKpForecast(): 当前 Kp、今晚（当地 18:00–次日 02:00）Kp 峰值及出现时段、未来 3 天峰值
 *
 * 注意：time_tag 为 UTC 但无 Z 后缀，JS 解析时必须手动补 'Z'，
 *       否则会被当成本地时间导致窗口偏移。
 */

import { CACHE_TTL } from '../../config/apiKeys';
import { getCachedData, setCachedData } from '../cache';

const KP_FORECAST_URL = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json';
const CACHE_KEY = 'noaa:kp-forecast';

function parseUtc(timeTag) {
  return new Date(`${timeTag}Z`);
}

/**
 * 今晚观测窗口：当地时间 18:00 – 次日 02:00
 * 凌晨 0–2 点运行时，窗口取「昨晚 18:00 – 今晨 02:00」
 */
export function tonightWindow(now = new Date()) {
  const start = new Date(now);
  start.setHours(18, 0, 0, 0);
  const end = new Date(now);
  end.setDate(end.getDate() + 1);
  end.setHours(2, 0, 0, 0);
  if (now.getHours() < 3) {
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() - 1);
  }
  return { start, end };
}

/**
 * 按地理纬度估算肉眼可见极光所需的最小 Kp（经验映射，对应磁纬近似）
 * 与 city-list 中 AURORA_CITIES 的 kp 门槛语义一致
 */
export function requiredKpForLatitude(lat) {
  const a = Math.abs(parseFloat(lat) || 0);
  if (a >= 65) return 1;
  if (a >= 60) return 2;
  if (a >= 55) return 3;
  if (a >= 50) return 4;
  if (a >= 45) return 5;
  if (a >= 42) return 6;
  if (a >= 38) return 7;
  if (a >= 33) return 8;
  return 9;
}

/**
 * 获取 Kp 预报摘要
 * @returns {
 *   currentKp: number|null,        最新实测 Kp
 *   tonightKpMax: number|null,     今晚窗口内最大 Kp（实测/预测混合）
 *   tonightPeakTime: Date|null,    峰值出现时段（窗口起点，3 小时间隔）
 *   requiredKpHint: null,          预留
 *   nextDays: [{date: string, maxKp: number}],
 *   updatedAt: string,
 * } | null（请求失败时）
 */
export async function getKpForecast() {
  const cacheTTL = CACHE_TTL.aurora || 60 * 60 * 1000;

  try {
    const cached = await getCachedData(CACHE_KEY);
    if (cached) {
      return revive(cached);
    }

    const response = await fetch(KP_FORECAST_URL, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      console.warn('[noaa] Kp 预报请求失败:', response.status);
      return null;
    }

    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return null;
    }

    const summary = summarize(rows);
    await setCachedData(CACHE_KEY, summary, cacheTTL);
    return revive(summary);
  } catch (error) {
    console.warn('[noaa] getKpForecast 失败:', error?.message);
    return null;
  }
}

// 缓存的是纯 JSON，Date 字段需要复活
function revive(summary) {
  if (!summary) return summary;
  return {
    ...summary,
    tonightPeakTime: summary.tonightPeakTime ? new Date(summary.tonightPeakTime) : null,
  };
}

function summarize(rows) {
  const now = new Date();
  const { start, end } = tonightWindow(now);

  // 最新实测 Kp
  let currentKp = null;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].observed === 'observed') {
      currentKp = rows[i].kp;
      break;
    }
  }

  // 今晚窗口内峰值
  let tonightKpMax = null;
  let tonightPeakTime = null;
  for (const row of rows) {
    const t = parseUtc(row.time_tag);
    if (t >= start && t <= end) {
      if (tonightKpMax === null || row.kp > tonightKpMax) {
        tonightKpMax = row.kp;
        tonightPeakTime = t;
      }
    }
  }

  // 未来 3 天每日最大 Kp（按 UTC 日期聚合，含今天）
  const byDay = new Map();
  for (const row of rows) {
    const day = row.time_tag.slice(0, 10);
    const prev = byDay.get(day);
    if (prev === undefined || row.kp > prev) byDay.set(day, row.kp);
  }
  const nextDays = [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(0, 3)
    .map(([date, maxKp]) => ({ date, maxKp }));

  return {
    currentKp,
    tonightKpMax,
    tonightPeakTime: tonightPeakTime ? tonightPeakTime.toISOString() : null,
    nextDays,
    updatedAt: now.toISOString(),
  };
}

export default {
  getKpForecast,
  requiredKpForLatitude,
  tonightWindow,
};
