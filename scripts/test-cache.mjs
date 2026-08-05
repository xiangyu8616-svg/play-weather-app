// 缓存层单测：内存 + AsyncStorage 双层、TTL、清理（AsyncStorage 已由 loader 替换为内存 stub）
import { section, check } from './helpers/tap.mjs';
import {
  getCachedData, setCachedData, isCacheValid,
  removeCachedData, clearAllCache, clearExpiredCache, getCacheStats,
  createCachedFunction,
} from '../services/cache.ts';

section('缓存层基础读写');

await clearAllCache();

await setCachedData('test:a', { v: 1 }, 60 * 1000);
const a = await getCachedData('test:a');
check('写入后可读出相同数据', a && a.v === 1);

const missing = await getCachedData('test:not-exist');
check('不存在的键返回 null', missing === null);

check('TTL 内 isCacheValid=true', await isCacheValid('test:a', 60 * 1000));

section('TTL 过期行为');

// 写入 TTL=1ms，等待 5ms 后应过期
await setCachedData('test:expire', { v: 2 }, 1);
await new Promise((r) => setTimeout(r, 10));
check('TTL 过期后 getCachedData=null', (await getCachedData('test:expire')) === null);

section('双层一致性');

// 内存层命中：同一进程内第二次读不依赖 storage（无法直接观测，改为验证数据一致）
await setCachedData('test:dual', { v: 3 }, 60 * 1000);
const d1 = await getCachedData('test:dual');
const d2 = await getCachedData('test:dual');
check('连续两次读取结果一致', d1.v === 3 && d2.v === 3);

section('删除与清空');

await removeCachedData('test:dual');
check('removeCachedData 后返回 null', (await getCachedData('test:dual')) === null);

await setCachedData('test:x', 1, 60 * 1000);
await setCachedData('test:y', 2, 60 * 1000);
await clearAllCache();
check('clearAllCache 后全部清空',
  (await getCachedData('test:x')) === null && (await getCachedData('test:y')) === null);

section('clearExpiredCache');

await clearAllCache();
await setCachedData('test:keep', 1, 60 * 1000);
await setCachedData('test:dead', 2, 1);
await new Promise((r) => setTimeout(r, 10));
const { cleared, total } = await clearExpiredCache();
check('clearExpiredCache 至少清掉 1 条过期', cleared >= 1 && total >= 2);
check('未过期数据保留', (await getCachedData('test:keep')) === 1);

section('getCacheStats');

const stats = await getCacheStats();
check('stats 字段齐全且非负',
  stats.memoryCount >= 0 && stats.storageCount >= 0 && stats.memorySize >= 0);

section('createCachedFunction 装饰器');

await clearAllCache();
let calls = 0;
const fetchSomething = createCachedFunction(
  async (id) => { calls++; return { id, n: calls }; },
  60 * 1000,
  (id) => `test:fn:${id}`,
);
const r1 = await fetchSomething('a');
const r2 = await fetchSomething('a');
check('装饰器第二次调用命中缓存（底层只调一次）', calls === 1 && r1.n === 1 && r2.n === 1);
const r3 = await fetchSomething('b');
check('不同参数重新加载', calls === 2 && r3.n === 2);
