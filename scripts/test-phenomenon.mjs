// 现象算法单测：霞光 / 丁达尔 / 彩虹 / 日晕（纯函数）
import { section, check } from './helpers/tap.mjs';
import { calculateSunsetProbability, calculateTyndallProbability, calculateGlowForecast } from '../services/phenomenon/glow.ts';
import { calculateRainbowProbability, calculateHaloProbability } from '../services/phenomenon/halo.ts';

section('霞光概率 calculateSunsetProbability');

// 最优条件：云量 50、湿度 70、能见度 20、气溶胶 5.5、太阳高度角 0
const best = calculateSunsetProbability({ cloudCover: 50, humidity: 70, visibility: 20, aerosol: 5.5, sunAltitude: 0 });
check('最优条件概率 ≥80', best.probability >= 80);
check('最优条件 level=史诗级', best.level === '史诗级');
check('置信度在 0.6-0.9 之间', best.confidence >= 0.6 && best.confidence <= 0.9);

// 全阴：云量 100
const overcast = calculateSunsetProbability({ cloudCover: 100, humidity: 70, visibility: 20, aerosol: 5.5, sunAltitude: 0 });
check('云量 100 概率显著低于最优（差 ≥30）', overcast.probability <= best.probability - 30);

// 晴空无云：云量 0
const clear = calculateSunsetProbability({ cloudCover: 0, humidity: 70, visibility: 20, aerosol: 5.5, sunAltitude: 0 });
check('云量 0 概率低于最优（无云不烧）', clear.probability < best.probability);

// 边界：概率永远 0-100
const extreme = calculateSunsetProbability({ cloudCover: 100, humidity: 100, visibility: 0, aerosol: 20, sunAltitude: 45 });
check('极端输入概率仍在 0-100', extreme.probability >= 0 && extreme.probability <= 100);

section('丁达尔效应 calculateTyndallProbability');

const tyndall = calculateTyndallProbability({ cloudCover: 60, humidity: 85, aerosol: 5, sunAltitude: 8, sunAzimuth: 90 });
check('好条件概率 >50', tyndall.probability > 50);
check('太阳在东（90°）→ 方向朝西', tyndall.direction === '西');
check('低角度阳光 bestTime 合理', typeof tyndall.bestTime === 'string' && tyndall.bestTime.length > 0);

const tyndallBad = calculateTyndallProbability({ cloudCover: 100, humidity: 30, aerosol: 1, sunAltitude: 60, sunAzimuth: 270 });
check('差条件（干+正午+满云）概率 <20', tyndallBad.probability < 20);
check('太阳在西（270°）→ 方向朝东', tyndallBad.direction === '东');

section('朝霞晚霞预报 calculateGlowForecast');

const forecast = calculateGlowForecast(new Date(2026, 7, 5, 12, 0), 39.9042, 116.4074, {
  cloudCover: 50, humidity: 65, visibility: 20,
});
check('返回朝霞/晚霞两段', !!forecast.sunriseGlow && !!forecast.sunsetGlow);
check('概率都在 0-100', [forecast.sunriseGlow.probability, forecast.sunsetGlow.probability].every((p) => p >= 0 && p <= 100));
check('bestTime 是 HH:MM 格式', /^\d{2}:\d{2}$/.test(forecast.sunriseGlow.bestTime) && /^\d{2}:\d{2}$/.test(forecast.sunsetGlow.bestTime));
check('conditions 透传输入', forecast.conditions.cloudCover === 50 && forecast.conditions.humidity === 65);

section('彩虹概率 calculateRainbowProbability');

// 有降水 + 太阳低角度 + 云量适中
const rainbow = calculateRainbowProbability({
  precipitation1h: 2, precipitationNow: 0.5, sunAltitude: 20, sunAzimuth: 90, cloudCover: 60,
});
check('雨后低太阳概率 >60', rainbow.probability > 60);
check('太阳在东 → 彩虹朝西', rainbow.direction === '西');
check('type 为单彩虹/双彩虹/月虹之一', ['单彩虹', '双彩虹', '月虹'].includes(rainbow.type));

// 无降水
const noRain = calculateRainbowProbability({
  precipitation1h: 0, precipitationNow: 0, sunAltitude: 20, sunAzimuth: 90, cloudCover: 60,
});
check('无降水概率显著更低', noRain.probability < rainbow.probability);

// 夜晚 → 月虹且概率打折
const moonbow = calculateRainbowProbability({
  precipitation1h: 2, precipitationNow: 0.5, sunAltitude: -10, sunAzimuth: 90, cloudCover: 60, isNight: true,
});
check('夜间深太阳角识别为月虹', moonbow.type === '月虹');

section('日晕/月晕 calculateHaloProbability');

const haloYes = calculateHaloProbability({ cirrusCloud: true, iceCrystal: 8, celestial: '太阳', cloudCover: 40 });
check('卷层云+高冰晶概率 >60', haloYes.probability > 60);

const haloNo = calculateHaloProbability({ cirrusCloud: false, iceCrystal: 0, cloudAltitude: 2000, celestial: '太阳', cloudCover: 100 });
check('无卷层云+低云概率显著更低', haloNo.probability < haloYes.probability - 20);

check('概率范围 0-100', haloYes.probability <= 100 && haloNo.probability >= 0);
