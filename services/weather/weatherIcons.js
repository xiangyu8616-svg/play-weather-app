/**
 * 天气图标映射（语言无关）
 *
 * 优先使用和风 icon code（纯数字，不受 API 语言参数影响）；
 * 无 code 时回退中英文本文本匹配。
 *
 * 和风 icon code 规律：
 *   100 晴 | 101-103 多云 | 104 阴 | 3xx 雨（302-304 雷）| 4xx 雪 | 5xx 雾霾沙尘
 */

export function getWeatherIconName(text, isNight = false, icon = null) {
  const code = parseInt(icon, 10);
  if (!Number.isNaN(code) && code >= 100) {
    if (code >= 300 && code < 400) {
      return code >= 302 && code <= 304 ? 'thunderstorm-outline' : 'rainy-outline';
    }
    if (code >= 400 && code < 500) return 'snow-outline';
    if (code >= 500 && code < 600) return 'cloudy-outline'; // 雾/霾/沙尘
    if (code === 104) return 'cloudy-outline'; // 阴
    if (code >= 101 && code <= 103) return isNight ? 'cloudy-outline' : 'partly-sunny-outline'; // 多云
    if (code === 100) return isNight ? 'moon-outline' : 'sunny-outline'; // 晴
  }

  // 文本回退（中/英文均匹配）
  const t = (text || '').toLowerCase();
  if (/雷|thunder/.test(t)) return 'thunderstorm-outline';
  if (/雪|冰|snow|ice|sleet/.test(t)) return 'snow-outline';
  if (/雨|rain|drizzle|shower/.test(t)) return 'rainy-outline';
  if (/雾|霾|沙|fog|haze|sand|dust/.test(t)) return 'cloudy-outline';
  if (/阴|overcast/.test(t)) return 'cloudy-outline';
  if (/云|cloud/.test(t)) return isNight ? 'cloudy-outline' : 'partly-sunny-outline';
  return isNight ? 'moon-outline' : 'sunny-outline';
}

export default { getWeatherIconName };
