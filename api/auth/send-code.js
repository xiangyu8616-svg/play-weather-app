/**
 * 短信验证码发送接口
 * 
 * 防刷策略：
 * - 手机号格式校验（中国大陆 1 开头 11 位）
 * - 同一手机号 60 秒内不可重复发送
 * - 同一 IP 每小时最多 10 次
 * 
 * 环境变量：JWT_SECRET
 * 
 * ⚠️ 生产环境注意事项：
 * - 验证码应存储到 Redis（TTL 5 分钟）而非内存 Map
 * - 应接入真实短信服务商（阿里云短信、腾讯云短信）
 * - 当前为开发版，验证码会打印在服务端日志中（仅调试用）
 */

// ====== 验证码存储（生产环境请换 Redis）======
const codeStore = new Map(); // key: phone, value: { code, expiresAt }

// ====== 发送频率限制（生产环境请换 Redis）======
const sendLimit = new Map(); // 手机号 → 上次发送时间戳
const ipLimit = new Map();   // IP → { start, count }

const CODE_TTL = 5 * 60 * 1000;       // 验证码 5 分钟有效
const PHONE_COOLDOWN = 60 * 1000;     // 同一手机号 60 秒冷却
const IP_LIMIT_COUNT = 10;            // 同一 IP 每小时 10 次
const IP_LIMIT_WINDOW = 60 * 60 * 1000;

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || '0.0.0.0';
}

function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 位数字
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { phone } = req.body || {};
  const ip = getClientIP(req);

  // 1. 手机号格式校验
  if (!phone || !isValidPhone(phone)) {
    return res.status(400).json({ error: '手机号格式不正确' });
  }

  // 2. 手机号冷却检查
  const lastSend = sendLimit.get(phone);
  if (lastSend && Date.now() - lastSend < PHONE_COOLDOWN) {
    const remaining = Math.ceil((PHONE_COOLDOWN - (Date.now() - lastSend)) / 1000);
    return res.status(429).json({ error: `请 ${remaining} 秒后再试`, retryAfter: remaining });
  }

  // 3. IP 频率限制
  const now = Date.now();
  const ipRecord = ipLimit.get(ip);
  if (ipRecord && now - ipRecord.start < IP_LIMIT_WINDOW) {
    if (ipRecord.count >= IP_LIMIT_COUNT) {
      return res.status(429).json({ error: '请求过于频繁，请稍后再试', retryAfter: 3600 });
    }
    ipRecord.count++;
  } else {
    ipLimit.set(ip, { start: now, count: 1 });
  }

  // 4. 生成验证码
  const code = generateCode();
  const expiresAt = now + CODE_TTL;

  // 清理旧验证码
  const existing = codeStore.get(phone);
  if (existing && Date.now() < existing.expiresAt) {
    // 还未过期，复用（防止用户快速点两次）
    // 不需要操作
  }

  codeStore.set(phone, { code, expiresAt });
  sendLimit.set(phone, now);

  // ⚠️ 开发环境：打印验证码到控制台
  console.log(`[DEV] 验证码已发送到 ${phone}: ${code} (有效期 5 分钟)`);

  // ⚠️ 生产环境：此处应调用短信服务商 API
  // const smsResult = await sendSMS(phone, code);
  // if (!smsResult.success) { ... }

  return res.status(200).json({ message: '验证码已发送', retryAfter: 60 });
}
