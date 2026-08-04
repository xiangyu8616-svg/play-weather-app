/**
 * i18n 多语言框架（Zustand）
 *
 * - 默认中文（zh），支持 English（en）
 * - 语言选择持久化到 AsyncStorage（key: playweather_language）
 * - t(key, params)：点路径查值，支持 {name} 插值；缺失时回退中文，再回退 key 本身
 *
 * 用法：
 *   import { useI18n } from '../services/i18n';
 *   const { t, lang, setLang, init } = useI18n();
 *   useEffect(() => { init(); }, []);
 *   <Text>{t('home.heroTitle')}</Text>
 *   <Text>{t('home.probability', { p: 72 })}</Text>
 *
 * 注意：settingsService 里的 language 字段为历史遗留（从未启用），
 *       语言状态以本 store 为唯一来源。
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import zh from './zh';
import en from './en';

const STORAGE_KEY = 'playweather_language';
const LOCALES = { zh, en };

export const LANGUAGES = [
  { code: 'zh', label: '简体中文', short: '中文' },
  { code: 'en', label: 'English', short: 'EN' },
];

function lookup(lang, key) {
  const resolve = (pack) =>
    key.split('.').reduce((node, k) => (node && node[k] !== undefined ? node[k] : undefined), pack);
  const val = resolve(LOCALES[lang] || zh);
  if (val !== undefined) return val;
  const fallback = resolve(zh);
  return fallback !== undefined ? fallback : key;
}

function interpolate(str, params) {
  if (!params || typeof str !== 'string') return str;
  return str.replace(/\{(\w+)\}/g, (match, k) =>
    params[k] !== undefined ? String(params[k]) : match
  );
}

export const useI18n = create((set, get) => ({
  lang: 'zh',
  initialized: false,

  // 从本地存储恢复语言（幂等）
  init: async () => {
    if (get().initialized) return;
    set({ initialized: true });
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved && LOCALES[saved]) set({ lang: saved });
    } catch (e) {
      console.warn('[i18n] 读取语言设置失败:', e?.message);
    }
  },

  setLang: async (lang) => {
    if (!LOCALES[lang]) return;
    set({ lang });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.warn('[i18n] 保存语言设置失败:', e?.message);
    }
  },

  t: (key, params) => interpolate(lookup(get().lang, key), params),
}));

export default useI18n;
