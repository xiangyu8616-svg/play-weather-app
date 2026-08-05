// AsyncStorage 内存 stub：Node 环境下替代 @react-native-async-storage/async-storage
// 由 scripts/loader.mjs 的 resolve 钩子重定向加载
const store = new Map();

export default {
  getItem: async (key) => (store.has(key) ? store.get(key) : null),
  setItem: async (key, value) => { store.set(key, String(value)); },
  removeItem: async (key) => { store.delete(key); },
  clear: async () => { store.clear(); },
  getAllKeys: async () => [...store.keys()],
  multiGet: async (keys) => keys.map((k) => [k, store.has(k) ? store.get(k) : null]),
  multiSet: async (pairs) => { pairs.forEach(([k, v]) => store.set(k, String(v))); },
  multiRemove: async (keys) => { keys.forEach((k) => store.delete(k)); },
};
