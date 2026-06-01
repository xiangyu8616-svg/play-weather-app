/**
 * 颜色工具函数
 * 提供全局共享的颜色相关辅助函数
 */

/**
 * hex 颜色转 rgb 字符串
 * @param {string} hex - hex 颜色值，如 "#DAA520"
 * @returns {string} - rgb 字符串，如 "218, 165, 32"
 */
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 255, 255';
};

/**
 * 根据概率值返回对应的颜色
 * @param {number} probability - 概率值 (0-100)
 * @returns {string} - hex 颜色值
 */
export const getProbabilityColor = (probability) => {
  if (probability >= 80) return '#FF6B35';
  if (probability >= 60) return '#FFA500';
  if (probability >= 40) return '#DAA520';
  if (probability >= 20) return '#E8C547';
  return '#9CA3AF';
};
