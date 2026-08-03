/**
 * 收藏地点 Store（Zustand）
 *
 * 职责：
 * - 本地快照：AsyncStorage 持久化，未登录/离线也能收藏与查看
 * - 云端同步：登录后与 Supabase saved_locations 表双向合并
 * - 乐观更新：add/remove 先写本地，云端失败回滚
 *
 * 本地记录结构: { id, name, lat, lon, adm1?, adm2?, isDefault }
 * 云端表结构:   saved_locations(user_id, location_id, location_name, lat, lon, is_default, sort_order)
 *
 * 用法：
 *   import { useSavedLocationsStore } from '../stores/savedLocationsStore';
 *   const { locations, init, toggle, isSaved } = useSavedLocationsStore();
 *   useEffect(() => { init(); }, []);
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  supabase,
  getCurrentUser,
  getSavedLocations,
  addSavedLocation,
  removeSavedLocation,
} from '../lib/supabase';
import { useUserStore } from './userStore';

const STORAGE_KEY = 'playweather_saved_locations';

// ==================== 本地快照读写 ====================

async function loadLocal() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((l) => l && l.id);
    }
  } catch (e) {
    console.warn('[savedLocations] 读取本地快照失败:', e?.message);
  }
  return [];
}

async function persistLocal(locations) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  } catch (e) {
    console.warn('[savedLocations] 本地持久化失败:', e?.message);
  }
}

// 云端行 → 本地记录
function rowToLocal(row) {
  return {
    id: row.location_id,
    name: row.location_name,
    lat: row.lat,
    lon: row.lon,
    isDefault: row.is_default || false,
  };
}

// 同步 profile 页的收藏计数
function syncCount(locations) {
  try {
    useUserStore.setState({ savedLocationCount: locations.length });
  } catch { /* userStore 未就绪时忽略 */ }
}

export const useSavedLocationsStore = create((set, get) => ({
  // ---- 状态 ----
  locations: [],
  initialized: false,
  syncing: false,

  // ---- 派生查询（非响应式，组件内配合 locations 使用）----
  isSaved: (locationId) => get().locations.some((l) => l.id === locationId),

  // ---- 初始化：本地快照 → 云端合并 → 监听登录（幂等）----
  init: async () => {
    if (get().initialized) return;
    set({ initialized: true });

    const local = await loadLocal();
    if (local.length > 0) {
      set({ locations: local });
      syncCount(local);
    }

    await get().syncWithCloud();

    // 登录成功后自动合并云端（登出不动本地快照）
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') get().syncWithCloud();
    });
  },

  // ---- 云端合并：本地独有推上去，云端独有拉下来 ----
  syncWithCloud: async () => {
    if (get().syncing) return;
    const user = await getCurrentUser();
    if (!user) return;

    set({ syncing: true });
    try {
      const cloudRows = await getSavedLocations(user.id);
      const cloud = cloudRows.map(rowToLocal);
      const cloudIds = new Set(cloud.map((c) => c.id));

      // 本地有、云端没有的 → 推送到云端
      const local = get().locations;
      const localOnly = local.filter((l) => !cloudIds.has(l.id));
      const pushed = [];
      for (const item of localOnly) {
        try {
          const { error } = await addSavedLocation(user.id, item);
          // 唯一约束冲突说明云端已有，视为成功
          if (!error || error.code === '23505') pushed.push(item);
        } catch (e) {
          console.warn('[savedLocations] 推送本地收藏失败:', item.name, e?.message);
        }
      }

      // 合并：云端为主，补充本地 adm1/adm2 元信息
      const localById = new Map(local.map((l) => [l.id, l]));
      const merged = cloud.map((c) => {
        const meta = localById.get(c.id);
        return meta ? { ...c, adm1: meta.adm1, adm2: meta.adm2 } : c;
      });
      for (const item of pushed) merged.push(item);

      set({ locations: merged });
      persistLocal(merged);
      syncCount(merged);
    } catch (e) {
      console.warn('[savedLocations] 云端同步失败（保留本地快照）:', e?.message);
    } finally {
      set({ syncing: false });
    }
  },

  // ---- 添加收藏（乐观更新，云端失败回滚）----
  add: async (city) => {
    if (!city?.id) return { ok: false, error: '无效的城市数据' };
    if (get().isSaved(city.id)) return { ok: true };

    const prev = get().locations;
    const entry = {
      id: city.id,
      name: city.name,
      lat: parseFloat(city.lat) || null,
      lon: parseFloat(city.lon) || null,
      adm1: city.adm1 || null,
      adm2: city.adm2 || null,
      isDefault: prev.length === 0, // 第一条收藏自动成为默认城市
    };
    const next = [...prev, entry];
    set({ locations: next });
    persistLocal(next);
    syncCount(next);

    const user = await getCurrentUser();
    if (user) {
      try {
        const { error } = await addSavedLocation(user.id, entry);
        if (error && error.code !== '23505') throw error;
      } catch (e) {
        console.warn('[savedLocations] 云端添加失败，回滚:', e?.message);
        set({ locations: prev });
        persistLocal(prev);
        syncCount(prev);
        return { ok: false, error: e?.message || '同步失败，请稍后重试' };
      }
    }
    return { ok: true };
  },

  // ---- 取消收藏（乐观更新，云端失败回滚）----
  remove: async (locationId) => {
    const prev = get().locations;
    if (!prev.some((l) => l.id === locationId)) return { ok: true };

    const next = prev.filter((l) => l.id !== locationId);
    set({ locations: next });
    persistLocal(next);
    syncCount(next);

    const user = await getCurrentUser();
    if (user) {
      try {
        const { error } = await removeSavedLocation(user.id, locationId);
        if (error) throw error;
      } catch (e) {
        console.warn('[savedLocations] 云端删除失败，回滚:', e?.message);
        set({ locations: prev });
        persistLocal(prev);
        syncCount(prev);
        return { ok: false, error: e?.message || '同步失败，请稍后重试' };
      }
    }
    return { ok: true };
  },

  // ---- 星标切换 ----
  toggle: async (city) => {
    return get().isSaved(city.id) ? get().remove(city.id) : get().add(city);
  },
}));
