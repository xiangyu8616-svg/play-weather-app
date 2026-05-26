/**
 * 数据缓存服务
 * 
 * 功能：
 * - 统一缓存管理
 * - 支持 TTL (Time To Live)
 * - 内存 + AsyncStorage 双层缓存
 * 
 * 缓存策略：
 * - 实时数据：30 分钟（天气、小时预报）
 * - 短期数据：1 小时（日预报、极光）
 * - 长期数据：24 小时（天文数据、城市信息）
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==================== 配置 ====================

const CACHE_CONFIG = {
  // 内存缓存
  memoryCache: new Map<string, {
    data: any;
    timestamp: number;
    ttl: number;
  }>(),
  
  // 默认 TTL
  defaultTTL: {
    realtime: 30 * 60 * 1000,      // 30 分钟 - 实时天气
    short: 60 * 60 * 1000,         // 1 小时 - 日预报、极光
    long: 24 * 60 * 60 * 1000,     // 24 小时 - 天文数据
    permanent: 7 * 24 * 60 * 60 * 1000 // 7 天 - 城市信息
  }
};

// ==================== 核心函数 ====================

/**
 * 获取缓存数据
 * @param key - 缓存键
 * @returns 缓存数据，不存在则返回 null
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    // 1. 先检查内存缓存
    const memoryEntry = CACHE_CONFIG.memoryCache.get(key);
    if (memoryEntry) {
      const now = Date.now();
      if (now - memoryEntry.timestamp < memoryEntry.ttl) {
        return memoryEntry.data as T;
      } else {
        // 过期了，删除
        CACHE_CONFIG.memoryCache.delete(key);
      }
    }
    
    // 2. 检查 AsyncStorage
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      const entry = JSON.parse(stored);
      const now = Date.now();
      
      if (now - entry.timestamp < entry.ttl) {
        // 有效，同步到内存缓存
        CACHE_CONFIG.memoryCache.set(key, {
          data: entry.data,
          timestamp: entry.timestamp,
          ttl: entry.ttl
        });
        return entry.data as T;
      } else {
        // 过期了，删除
        await AsyncStorage.removeItem(key);
      }
    }
    
    return null;
  } catch (error) {
    console.error('获取缓存失败:', error);
    return null;
  }
}

/**
 * 设置缓存数据
 * @param key - 缓存键
 * @param data - 数据
 * @param ttl - 过期时间 (毫秒)，可选
 */
export async function setCachedData(
  key: string, 
  data: any, 
  ttl?: number
): Promise<void> {
  try {
    const effectiveTTL = ttl || CACHE_CONFIG.defaultTTL.short;
    const timestamp = Date.now();
    
    // 1. 写入内存缓存
    CACHE_CONFIG.memoryCache.set(key, {
      data,
      timestamp,
      ttl: effectiveTTL
    });
    
    // 2. 写入 AsyncStorage
    const entry = {
      data,
      timestamp,
      ttl: effectiveTTL
    };
    
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error('设置缓存失败:', error);
  }
}

/**
 * 检查缓存是否有效
 * @param key - 缓存键
 * @param ttl - 期望的 TTL (毫秒)
 * @returns 是否有效
 */
export async function isCacheValid(
  key: string, 
  ttl: number
): Promise<boolean> {
  try {
    const data = await getCachedData(key);
    if (!data) return false;
    
    // 检查是否还在 TTL 内
    const memoryEntry = CACHE_CONFIG.memoryCache.get(key);
    if (memoryEntry) {
      const now = Date.now();
      return now - memoryEntry.timestamp < ttl;
    }
    
    // 从 AsyncStorage 读取的已经验证过 TTL
    return data !== null;
  } catch (error) {
    console.error('检查缓存失败:', error);
    return false;
  }
}

/**
 * 删除缓存
 * @param key - 缓存键
 */
export async function removeCachedData(key: string): Promise<void> {
  try {
    CACHE_CONFIG.memoryCache.delete(key);
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('删除缓存失败:', error);
  }
}

/**
 * 清除所有缓存
 */
export async function clearAllCache(): Promise<void> {
  try {
    CACHE_CONFIG.memoryCache.clear();
    await AsyncStorage.clear();
  } catch (error) {
    console.error('清除所有缓存失败:', error);
  }
}

/**
 * 清理过期缓存
 * 
 * 遍历 AsyncStorage 中的所有键，删除已过期的缓存项
 * 建议定期调用（如应用启动时）
 */
export async function clearExpiredCache(): Promise<{
  cleared: number;
  total: number;
}> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    let clearedCount = 0;
    const now = Date.now();
    
    for (const key of keys) {
      try {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const entry = JSON.parse(stored);
          // 检查是否过期
          if (now - entry.timestamp >= entry.ttl) {
            await AsyncStorage.removeItem(key);
            clearedCount++;
          }
        }
      } catch (error) {
        // 解析失败的也删除
        await AsyncStorage.removeItem(key);
        clearedCount++;
      }
    }
    
    // 同时清理内存缓存
    CACHE_CONFIG.memoryCache.forEach((value, key) => {
      if (now - value.timestamp >= value.ttl) {
        CACHE_CONFIG.memoryCache.delete(key);
      }
    });
    
    return {
      cleared: clearedCount,
      total: keys.length
    };
  } catch (error) {
    console.error('清理过期缓存失败:', error);
    return {
      cleared: 0,
      total: 0
    };
  }
}

/**
 * 获取缓存统计信息
 * @returns 缓存统计
 */
export async function getCacheStats(): Promise<{
  memoryCount: number;
  storageCount: number;
  memorySize: number;
}> {
  try {
    const memoryCount = CACHE_CONFIG.memoryCache.size;
    
    // 估算内存大小
    let memorySize = 0;
    CACHE_CONFIG.memoryCache.forEach((value, key) => {
      memorySize += (key.length + JSON.stringify(value.data).length) * 2;
    });
    
    // AsyncStorage 中的键数量
    const keys = await AsyncStorage.getAllKeys();
    const storageCount = keys.length;
    
    return {
      memoryCount,
      storageCount,
      memorySize
    };
  } catch (error) {
    console.error('获取缓存统计失败:', error);
    return {
      memoryCount: 0,
      storageCount: 0,
      memorySize: 0
    };
  }
}

/**
 * 预加载缓存
 * @param keys - 要预加载的键列表
 * @param loader - 数据加载函数
 */
export async function preloadCache<T>(
  keys: string[],
  loader: (key: string) => Promise<T>
): Promise<void> {
  try {
    const promises = keys.map(async (key) => {
      const cached = await getCachedData<T>(key);
      if (!cached) {
        const data = await loader(key);
        await setCachedData(key, data);
      }
    });
    
    await Promise.all(promises);
  } catch (error) {
    console.error('预加载缓存失败:', error);
  }
}

/**
 * 缓存装饰器
 * 用于自动缓存函数结果
 * 
 * @param ttl - 过期时间 (毫秒)
 * @param keyGenerator - 生成缓存键的函数
 */
export function createCachedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  ttl: number,
  keyGenerator: (...args: any[]) => string
): T {
  return (async (...args: any[]) => {
    const key = keyGenerator(...args);
    const cached = await getCachedData(key);
    
    if (cached) {
      return cached;
    }
    
    const result = await fn(...args);
    await setCachedData(key, result, ttl);
    
    return result;
  }) as T;
}

// ==================== 使用示例 ====================

/**
 * 使用示例：
 * 
 * import { 
 *   getCachedData, 
 *   setCachedData, 
 *   isCacheValid,
 *   removeCachedData,
 *   clearAllCache,
 *   getCacheStats,
 *   createCachedFunction
 * } from './services/cache';
 * 
 * // 1. 基本使用
 * await setCachedData('weather:beijing', { temp: 25 }, 30 * 60 * 1000);
 * const weather = await getCachedData('weather:beijing');
 * 
 * // 2. 检查缓存有效性
 * const isValid = await isCacheValid('weather:beijing', 30 * 60 * 1000);
 * if (!isValid) {
 *   // 重新获取数据
 * }
 * 
 * // 3. 删除缓存
 * await removeCachedData('weather:beijing');
 * 
 * // 4. 清除所有缓存（用户手动刷新时使用）
 * await clearAllCache();
 * 
 * // 5. 查看缓存统计
 * const stats = await getCacheStats();
 * console.log(`内存缓存：${stats.memoryCount} 条，占用 ${stats.memorySize} 字节`);
 * console.log(`存储缓存：${stats.storageCount} 条`);
 * 
 * // 6. 使用缓存装饰器
 * const fetchWeather = createCachedFunction(
 *   async (cityId: string) => {
 *     // 实际 API 调用
 *     return api.get(`/weather/${cityId}`);
 *   },
 *   30 * 60 * 1000, // 30 分钟 TTL
 *   (cityId: string) => `weather:${cityId}` // 键生成函数
 * );
 * 
 * // 调用时自动缓存
 * const weather = await fetchWeather('beijing');
 */

export default {
  getCachedData,
  setCachedData,
  isCacheValid,
  removeCachedData,
  clearAllCache,
  clearExpiredCache,
  getCacheStats,
  preloadCache,
  createCachedFunction
};
