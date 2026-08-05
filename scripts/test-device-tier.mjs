// 设备分档与地球仪质量阶梯单测（ROADMAP 2.8）
import { section, check } from './helpers/tap.mjs';
import {
  computeDeviceTier, performanceModeForTier,
  GLOBE_QUALITY_LADDER, initialQualityIndex, nextDegradeIndex, shouldDegrade,
} from '../services/performance/deviceTier.ts';

section('设备分档：低端判定');

check('2 核 → low', computeDeviceTier({ hardwareConcurrency: 2 }) === 'low');
check('4 核默认（无内存信息）→ low', computeDeviceTier({ hardwareConcurrency: 4 }) === 'low');
check('4 核 + 2GB → low', computeDeviceTier({ hardwareConcurrency: 4, deviceMemory: 2 }) === 'low');
check('8 核 + 2GB → low（内存优先）', computeDeviceTier({ hardwareConcurrency: 8, deviceMemory: 2 }) === 'low');
check('无信号（默认 4 核）→ low', computeDeviceTier({}) === 'low');

section('设备分档：中端/高端判定');

check('4 核 + 8GB → medium', computeDeviceTier({ hardwareConcurrency: 4, deviceMemory: 8 }) === 'medium');
check('6 核 → medium', computeDeviceTier({ hardwareConcurrency: 6 }) === 'medium');
check('6 核 + 4GB → medium', computeDeviceTier({ hardwareConcurrency: 6, deviceMemory: 4 }) === 'medium');
check('8 核 + 8GB → high', computeDeviceTier({ hardwareConcurrency: 8, deviceMemory: 8 }) === 'high');
check('12 核（无内存信息）→ high', computeDeviceTier({ hardwareConcurrency: 12 }) === 'high');
check('8 核 + 4GB → medium', computeDeviceTier({ hardwareConcurrency: 8, deviceMemory: 4 }) === 'medium');

section('分档 → 初始性能模式');

check('low → performance', performanceModeForTier('low') === 'performance');
check('medium → balanced', performanceModeForTier('medium') === 'balanced');
check('high → quality', performanceModeForTier('high') === 'quality');

section('质量阶梯');

check('阶梯从高到低像素比单调递减',
  GLOBE_QUALITY_LADDER.every((s, i) => i === 0 || s.pixelRatio < GLOBE_QUALITY_LADDER[i - 1].pixelRatio));
check('最低档关闭大气层', GLOBE_QUALITY_LADDER[GLOBE_QUALITY_LADDER.length - 1].atmosphere === false);
check('quality 起点 0 / balanced 起点 1 / performance 直达最低档',
  initialQualityIndex('quality') === 0 && initialQualityIndex('balanced') === 1 &&
  initialQualityIndex('performance') === GLOBE_QUALITY_LADDER.length - 1);

section('降级推进');

check('0 → 1', nextDegradeIndex(0) === 1);
check('倒数第二级 → 最后一级', nextDegradeIndex(GLOBE_QUALITY_LADDER.length - 2) === GLOBE_QUALITY_LADDER.length - 1);
check('已到最低档返回 null', nextDegradeIndex(GLOBE_QUALITY_LADDER.length - 1) === null);

section('低帧判定');

check('fps 25 连续 2 窗口 → 降级', shouldDegrade(25, 2));
check('fps 25 仅 1 窗口 → 不降级', !shouldDegrade(25, 1));
check('fps 45 连续 3 窗口 → 不降级', !shouldDegrade(45, 3));
check('fps 29 连续 2 窗口（阈值边界下）→ 降级', shouldDegrade(29, 2));
check('fps 30（等于阈值）→ 不降级', !shouldDegrade(30, 2));
