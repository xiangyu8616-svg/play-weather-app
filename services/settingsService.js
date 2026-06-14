/**
 * 用户设置持久化服务
 * 
 * 🔒 存储策略：
 * - 使用 AsyncStorage 存储非敏感设置（温度单位、通知偏好等）
 * - 不使用 localStorage（防止 XSS 篡改设置）
 * - 所有读写都有 try-catch 保护和默认值回退
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'playweather_user_settings';

// ==================== 默认设置 ====================

const DEFAULT_SETTINGS = {
  tempUnit: '°C',           // 温度单位：°C | °F
  language: 'zh-CN',        // 语言
  notificationsEnabled: true,   // 通知推送总开关
  probabilityAlert: true,       // 高概率预警
  dailyForecast: false,         // 每日预报推送
};

// ==================== 读取 ====================

/**
 * 加载用户设置
 * @returns {Promise<typeof DEFAULT_SETTINGS>}
 */
export async function loadSettings() {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 合并默认值（防止新增字段缺失）
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.warn('[settings] 读取设置失败，使用默认值:', error.message);
  }
  return { ...DEFAULT_SETTINGS };
}

// ==================== 写入 ====================

/**
 * 保存用户设置（合并更新）
 * @param {Partial<typeof DEFAULT_SETTINGS>} updates - 要更新的字段
 */
export async function saveSettings(updates) {
  try {
    const current = await loadSettings();
    const merged = { ...current, ...updates };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
    return merged;
  } catch (error) {
    console.error('[settings] 保存设置失败:', error.message);
    return null;
  }
}

/**
 * 更新单个设置项
 * @param {string} key - 设置键名
 * @param {any} value - 新值
 */
export async function updateSetting(key, value) {
  return saveSettings({ [key]: value });
}

/**
 * 重置为默认设置
 */
export async function resetSettings() {
  try {
    await AsyncStorage.removeItem(SETTINGS_KEY);
    return { ...DEFAULT_SETTINGS };
  } catch (error) {
    console.error('[settings] 重置设置失败:', error.message);
    return { ...DEFAULT_SETTINGS };
  }
}

export default { loadSettings, saveSettings, updateSetting, resetSettings, DEFAULT_SETTINGS };
