// shootingWindow 纯函数逻辑测试（tap 版，由 test-all.mjs 统一入口）
import { computeShootingWindow, qualityKey } from '../services/phenomenon/shootingWindow.js';
import { section, check } from './helpers/tap.mjs';

const mk = (h, m) => new Date(2026, 7, 4, h, m); // 2026-08-04 本地时间
const photoTimes = {
  goldenHourMorning: { start: mk(5, 30), end: mk(6, 30) },
  goldenHourEvening: { start: mk(17, 30), end: mk(18, 30) },
  blueHourMorning: { start: mk(4, 45), end: mk(5, 15) },
  blueHourEvening: { start: mk(18, 30), end: mk(19, 0) },
};
const glow = (riseP, setP) => ({
  sunriseGlow: { probability: riseP, quality: riseP >= 80 ? '史诗级' : riseP >= 60 ? '优秀' : riseP >= 40 ? '良好' : riseP >= 20 ? '一般' : '较差' },
  sunsetGlow: { probability: setP, quality: setP >= 80 ? '史诗级' : setP >= 60 ? '优秀' : setP >= 40 ? '良好' : setP >= 20 ? '一般' : '较差' },
});

section('拍摄窗口 computeShootingWindow / qualityKey');

// 1. 清晨 5:00，两个窗口都未结束，晚霞概率高 → 选晚霞
let w = computeShootingWindow({ now: mk(5, 0), photoTimes, glowForecast: glow(40, 72), visKm: 24 });
check('清晨双候选取高概率（晚霞）', w.type === 'sunsetGlow' && w.day === 'today' && w.probability === 72);

// 2. 清晨 5:00，朝霞概率更高 → 选朝霞
w = computeShootingWindow({ now: mk(5, 0), photoTimes, glowForecast: glow(85, 30), visKm: 24 });
check('清晨朝霞概率高取朝霞', w.type === 'sunriseGlow' && w.quality === 'epic' && w.direction === 'east');

// 3. 中午 12:00，朝霞窗已过 → 晚霞
w = computeShootingWindow({ now: mk(12, 0), photoTimes, glowForecast: glow(90, 55), visKm: 10 });
check('中午只剩晚霞', w.type === 'sunsetGlow' && w.day === 'today');

// 4. 深夜 23:00，今天都过了 → 明天朝霞 +24h
w = computeShootingWindow({ now: mk(23, 0), photoTimes, glowForecast: glow(65, 80), visKm: null });
check('深夜转明天朝霞', w.type === 'sunriseGlow' && w.day === 'tomorrow'
  && w.windowStart.getDate() === 5 && w.windowStart.getHours() === 5);

// 5. 傍晚窗口进行中（18:00）→ 仍算未结束
w = computeShootingWindow({ now: mk(18, 0), photoTimes, glowForecast: glow(10, 60), visKm: 24 });
check('窗口进行中仍可选', w.type === 'sunsetGlow' && w.day === 'today');

// 6. 缺数据 → null
check('缺 photoTimes 返回 null', computeShootingWindow({ now: mk(12, 0), photoTimes: null, glowForecast: glow(1, 1) }) === null);

// 7. qualityKey 映射
check('qualityKey 映射', qualityKey('史诗级') === 'epic' && qualityKey('优秀') === 'excellent'
  && qualityKey('良好') === 'good' && qualityKey('一般') === 'fair' && qualityKey('较差') === 'poor'
  && qualityKey('未知') === 'poor');
