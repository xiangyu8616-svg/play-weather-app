/**
 * 城市名本地化映射（zh → en）
 * 覆盖 city-list 硬编码的热门/极光城市；搜索结果由 GeoAPI 按 lang 返回英文，无需映射。
 * 未命中时返回原名（保持中文，不造拼音）。
 */

const CITY_NAME_EN = {
  '北京': 'Beijing',
  '上海': 'Shanghai',
  '广州': 'Guangzhou',
  '深圳': 'Shenzhen',
  '成都': 'Chengdu',
  '杭州': 'Hangzhou',
  '武汉': 'Wuhan',
  '西安': "Xi'an",
  '重庆': 'Chongqing',
  '南京': 'Nanjing',
  '哈尔滨': 'Harbin',
  '漠河': 'Mohe',
  '长春': 'Changchun',
  '沈阳': 'Shenyang',
  '乌鲁木齐': 'Urumqi',
  '呼和浩特': 'Hohhot',
  '拉萨': 'Lhasa',
  '西宁': 'Xining',
};

/**
 * @param {string} name 城市名（通常为中文）
 * @param {string} lang 'zh' | 'en'
 * @returns {string}
 */
export function localizeCityName(name, lang) {
  if (!name || lang !== 'en') return name;
  return CITY_NAME_EN[name] || name;
}
