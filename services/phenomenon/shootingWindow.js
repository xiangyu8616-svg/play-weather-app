/**
 * 今日拍摄窗口（差异化核心，ROADMAP 1.8）
 *
 * 把天文时刻（黄金/蓝调窗口）+ 天气预测（霞光概率、能见度）
 * 合成为一个可执行结论，供首页顶部卡片与一键提醒使用。
 *
 * 纯函数、无 IO、无语言依赖：返回结构化数据，文案由 UI 层经 i18n 组合。
 *
 * 用法：
 *   import { computeShootingWindow } from '../../services/phenomenon/shootingWindow';
 *   const win = computeShootingWindow({ now, photoTimes, glowForecast, visKm });
 */

/**
 * @typedef {Object} ShootingWindow
 * @property {'sunsetGlow'|'sunriseGlow'} type - 晚霞 / 朝霞
 * @property {'today'|'tomorrow'} day - 窗口属于今天还是明天
 * @property {Date} windowStart - 窗口开始（黄金时刻起点）
 * @property {Date} windowEnd - 窗口结束（黄金时刻终点）
 * @property {number} probability - 霞光概率 0-100
 * @property {'epic'|'excellent'|'good'|'fair'|'poor'} quality - 质量等级（i18n key 后缀）
 * @property {number|null} visKm - 能见度（公里）
 * @property {'west'|'east'} direction - 建议朝向
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 中文质量描述 → 语言无关等级 key
 * @param {string} qualityZh - glow.ts 产出的 '史诗级' | '优秀' | '良好' | '一般' | '较差'
 */
export function qualityKey(qualityZh) {
  switch (qualityZh) {
    case '史诗级': return 'epic';
    case '优秀': return 'excellent';
    case '良好': return 'good';
    case '一般': return 'fair';
    default: return 'poor';
  }
}

/**
 * 计算下一个拍摄窗口
 *
 * 选取规则：
 * 1. 候选 = 今天朝霞窗口（早晨黄金时刻）+ 今天晚霞窗口（傍晚黄金时刻）
 * 2. 过滤掉已结束的窗口；都有则取概率高者，平手取晚霞（晚霞受众更广）
 * 3. 今天窗口都已结束 → 明天朝霞（时间按 +24h 近似，黄金时刻日漂移仅约 1 分钟）
 *
 * @param {Object} input
 * @param {Date} input.now - 当前时间
 * @param {Object} input.photoTimes - astronomyService.getPhotographyTimes 的返回（Date 对象）
 * @param {Object} input.glowForecast - phenomenon/glow.calculateGlowForecast 的返回
 * @param {number|null} [input.visKm] - 当前能见度（公里）
 * @returns {ShootingWindow|null} 数据不足时返回 null
 */
export function computeShootingWindow({ now, photoTimes, glowForecast, visKm = null }) {
  if (!now || !photoTimes || !glowForecast) return null;
  const { goldenHourMorning, goldenHourEvening } = photoTimes;
  if (!goldenHourMorning?.start || !goldenHourEvening?.start) return null;

  const candidates = [
    {
      type: 'sunriseGlow',
      day: 'today',
      windowStart: goldenHourMorning.start,
      windowEnd: goldenHourMorning.end,
      probability: glowForecast.sunriseGlow?.probability ?? 0,
      quality: qualityKey(glowForecast.sunriseGlow?.quality),
      direction: 'east',
    },
    {
      type: 'sunsetGlow',
      day: 'today',
      windowStart: goldenHourEvening.start,
      windowEnd: goldenHourEvening.end,
      probability: glowForecast.sunsetGlow?.probability ?? 0,
      quality: qualityKey(glowForecast.sunsetGlow?.quality),
      direction: 'west',
    },
  ];

  const upcoming = candidates.filter((c) => c.windowEnd.getTime() > now.getTime());

  if (upcoming.length === 0) {
    // 今天的窗口都过了 → 明天朝霞
    const morning = candidates[0];
    return {
      ...morning,
      day: 'tomorrow',
      windowStart: new Date(morning.windowStart.getTime() + DAY_MS),
      windowEnd: new Date(morning.windowEnd.getTime() + DAY_MS),
      visKm,
    };
  }

  let best;
  if (upcoming.length === 1) {
    best = upcoming[0];
  } else {
    // 两个窗口都未结束（清晨时段）：取概率高者，平手取晚霞
    const [morning, evening] = upcoming;
    best = evening.probability >= morning.probability ? evening : morning;
  }

  return { ...best, visKm };
}

export default { computeShootingWindow, qualityKey };
