// API 代理单测：端点白名单、参数透传、认证回退、限流、缓存（fetch 打桩，不发起真实网络请求）
import { section, check } from './helpers/tap.mjs';

// ── 环境准备：只配 API KEY（走回退认证路径），fetch 打桩 ──
process.env.QWEATHER_API_KEY = 'test-key-xxx';
delete process.env.QWEATHER_ED25519_PRIVATE_KEY;
delete process.env.QWEATHER_KID;
delete process.env.QWEATHER_PROJECT_ID;
delete process.env.QWEATHER_BASE_URL;
delete process.env.QWEATHER_GEO_BASE_URL;

const fetchCalls = [];
globalThis.fetch = async (url) => {
  fetchCalls.push(url);
  return { json: async () => ({ code: '200', mock: true }) };
};

const { default: handler } = await import('../api/weather.js');

// ── req/res 模拟 ──
let reqSeq = 0;
function mockReq({ method = 'GET', query = {}, ip } = {}) {
  reqSeq++;
  return {
    method,
    query,
    headers: { 'x-forwarded-for': ip || `10.0.0.${reqSeq}` }, // 默认每个请求不同 IP，避免误触限流
    socket: { remoteAddress: '127.0.0.1' },
  };
}
function mockRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) { res.statusCode = code; return res; },
    json(data) { res.body = data; return res; },
  };
  return res;
}

section('方法与端点白名单');

let res = mockRes();
await handler(mockReq({ method: 'POST' }), res);
check('非 GET 返回 405', res.statusCode === 405);

res = mockRes();
await handler(mockReq({ query: { type: 'evil/hack', location: 'x' } }), res);
check('白名单外端点返回 400', res.statusCode === 400 && /Unsupported endpoint/.test(res.body.error));

res = mockRes();
await handler(mockReq({ query: { type: 'weather/now' } }), res);
check('缺 location 参数返回 400', res.statusCode === 400 && /Missing parameter: location/.test(res.body.error));

section('转发与参数透传');

fetchCalls.length = 0;
res = mockRes();
await handler(mockReq({ query: { type: 'weather/now', location: '101010100' } }), res);
check('合法请求返回 200', res.statusCode === 200 && res.body.code === '200');
check('上游 URL 指向和风 v7 端点', fetchCalls[0]?.startsWith('https://api.qweather.com/v7/weather/now?'));
check('location 参数透传', fetchCalls[0]?.includes('location=101010100'));
check('缺省自动补 lang=zh', fetchCalls[0]?.includes('lang=zh'));
check('type 参数不透传给上游', !fetchCalls[0]?.includes('type='));
check('API KEY 回退模式附带 key 参数', fetchCalls[0]?.includes('key=test-key-xxx'));

fetchCalls.length = 0;
res = mockRes();
await handler(mockReq({ query: { type: 'city/lookup', location: '北京', lang: 'en', number: '5' } }), res);
check('geo 端点走 geoapi base', fetchCalls[0]?.startsWith('https://geoapi.qweather.com/v2/city/lookup?'));
check('显式 lang 参数不被覆盖', fetchCalls[0]?.includes('lang=en'));
check('额外参数（number）透传', fetchCalls[0]?.includes('number=5'));

section('内存缓存');

fetchCalls.length = 0;
const q = { type: 'weather/3d', location: '101020100' };
res = mockRes();
await handler(mockReq({ query: q }), res);
const firstBody = res.body;
res = mockRes();
await handler(mockReq({ query: q }), res);
check('相同请求第二次命中缓存（fetch 只调一次）', fetchCalls.length === 1 && res.body === firstBody);

section('限流');

const burstIp = '9.9.9.9';
let lastStatus = 200;
for (let i = 0; i < 61; i++) {
  res = mockRes();
  await handler(mockReq({ query: { type: 'weather/now', location: `burst-${i}` }, ip: burstIp }), res);
  lastStatus = res.statusCode;
}
check('同 IP 第 61 次请求被限流（429）', lastStatus === 429 && res.body.retryAfter === 60);
