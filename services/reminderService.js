/**
 * 本地提醒服务（expo-notifications 封装）
 *
 * - 仅做本地通知（local notification），不依赖服务端推送
 * - Web / 未授权 / 不支持环境下优雅降级：resolve { ok: false, reason }
 * - 拍摄窗口提醒同一时间只保留一条：设置新提醒前取消旧提醒
 *   （通知 ID 持久化到 AsyncStorage）
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch { /* Web 或裸环境未链接 expo-notifications */ }

const REMINDER_ID_KEY = 'playweather_window_reminder_id';

// 前台收到通知时也展示横幅（仅原生端有意义）
let handlerSet = false;
function ensureHandler() {
  if (handlerSet || !Notifications?.setNotificationHandler) return;
  handlerSet = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch { /* 忽略 */ }
}

/**
 * 请求通知权限
 * @returns {Promise<boolean>} 是否已授权
 */
export async function ensureNotificationPermission() {
  if (!Notifications) return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.status === 'granted';
  } catch {
    return false; // Web 等平台直接视为不可用
  }
}

/**
 * 设置拍摄窗口提醒（触发时间 = 窗口开始前 leadMinutes 分钟；
 * 若窗口 10 分钟内就要开始，则改为立即提醒）
 *
 * @param {Object} input
 * @param {Date} input.windowStart - 窗口开始时间
 * @param {string} input.title - 通知标题（调用方完成 i18n）
 * @param {string} input.body - 通知正文（调用方完成 i18n）
 * @param {number} [input.leadMinutes=30] - 提前量
 * @returns {Promise<{ ok: boolean, fireDate?: Date, reason?: string }>}
 */
export async function scheduleWindowReminder({ windowStart, title, body, leadMinutes = 30 }) {
  if (!Notifications) return { ok: false, reason: 'unsupported' };
  if (!(windowStart instanceof Date) || Number.isNaN(windowStart.getTime())) {
    return { ok: false, reason: 'invalid-date' };
  }

  const granted = await ensureNotificationPermission();
  if (!granted) return { ok: false, reason: 'denied' };

  let fireDate = new Date(windowStart.getTime() - leadMinutes * 60 * 1000);
  const now = Date.now();
  if (fireDate.getTime() <= now) {
    // 提前量已过：10 分钟内即将开始的窗口立即提醒，否则不打扰
    if (windowStart.getTime() - now <= 10 * 60 * 1000) {
      fireDate = new Date(now + 5 * 1000);
    } else {
      return { ok: false, reason: 'too-late' };
    }
  }

  try {
    ensureHandler();

    // 取消上一条窗口提醒
    const oldId = await AsyncStorage.getItem(REMINDER_ID_KEY);
    if (oldId) {
      try { await Notifications.cancelScheduledNotificationAsync(oldId); } catch { /* 已触发或不存在 */ }
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { type: 'date', date: fireDate },
    });
    await AsyncStorage.setItem(REMINDER_ID_KEY, id);
    return { ok: true, fireDate };
  } catch (e) {
    console.warn('[reminder] 设置提醒失败:', e?.message);
    return { ok: false, reason: 'error' };
  }
}

/**
 * 读取当前已设置的窗口提醒触发时间（无则 null）
 * @returns {Promise<Date|null>}
 */
export async function getScheduledWindowReminder() {
  if (!Notifications) return null;
  try {
    const id = await AsyncStorage.getItem(REMINDER_ID_KEY);
    if (!id) return null;
    const all = await Notifications.getAllScheduledNotificationsAsync();
    const hit = all.find((n) => n.identifier === id);
    if (!hit) return null;
    const date = hit.trigger?.date ?? hit.trigger?.value;
    return date ? new Date(date) : null;
  } catch {
    return null;
  }
}

export default { scheduleWindowReminder, getScheduledWindowReminder, ensureNotificationPermission };
