# Supabase 接入指南

> 本文件记录 Supabase 项目的创建步骤和配置要点。
> 创建完成后，把 Project URL 和 Anon Key 填入 `.env.local`。

---

## 1. 创建项目

1. 访问 https://supabase.com
2. Sign Up（可用 GitHub 账号，无需信用卡）
3. 点击 **New Project**
4. 填写：
   - **Organization**: 选默认或新建
   - **Project name**: `play-weather`
   - **Database password**: 设置一个强密码（保存好！）
   - **Region**: 选离你用户最近的（欧美用户选 `East US` 或 `West Europe`）
5. 点击 **Create new project**，等待约 2 分钟

## 2. 获取连接信息

项目创建后，进入 Dashboard → Project Settings → API：

| 字段 | 说明 | 填入 `.env.local` |
|------|------|-------------------|
| Project URL | `https://xxxxxx.supabase.co` | `EXPO_PUBLIC_SUPABASE_URL` |
| anon/public | `eyJ...`（很长） | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |

## 3. 执行 Schema

Dashboard → SQL Editor → New query，粘贴 `supabase/migrations/001_initial_schema.sql` 全部内容 → **Run**。

## 4. 配置 Auth（SMTP）

Supabase 默认用内置 SMTP（有发送限额），生产环境建议换成自己的：

Dashboard → Authentication → Email Templates → SMTP Settings：
- **Host**: smtp.resend.com（推荐，免费 tier 每日 100 封）
- **Port**: 587
- **Username**: resend
- **Password**: 你的 Resend API Key（`re_...`）
- **Sender name**: 玩天气
- **Sender email**: noreply@yourdomain.com

> Resend 注册：https://resend.com（免费，无需信用卡）

## 5. 配置 OAuth（可选，S2 阶段）

Dashboard → Authentication → Providers：
- **Google**: 需 Google Cloud Console 创建 OAuth 2.0 客户端
- **Apple**: 需 Apple Developer 账号 + Services ID

## 6. 前端安装依赖

```bash
npm install @supabase/supabase-js
```

## 7. 环境变量

在 `.env.local` 中添加：

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

> `EXPO_PUBLIC_` 前缀让 Expo 在构建时暴露给客户端。Anon Key 是公开的，无需保密（RLS 策略控制权限）。

## 8. 现有 auth 骨架迁移说明

当前 `api/auth/send-code.js` 和 `api/auth/verify-code.js` 使用内存 Map 存储验证码，在 Vercel serverless 环境下不可靠（每次请求可能是新实例）。

**迁移方案**：
1. 短期：把验证码存储换成 Upstash Redis（免费 tier 足够）
2. 长期：切到 Supabase Auth OTP，完全替代自建验证码逻辑

Supabase Auth 优势：
- 自带 OTP（邮箱/短信），无需自建 send-code/verify-code
- 50,000 MAU 免费
- 自动处理 Token 刷新、会话管理
- 支持 OAuth（Google/Apple/微信等）

**迁移步骤**（S1 阶段执行）：
1. 安装 `@supabase/supabase-js`
2. 替换 `authService.js` 中的 `sendVerificationCode` / `verifyCode` 为 Supabase OTP
3. 删除 `api/auth/send-code.js` 和 `api/auth/verify-code.js`
4. 在 `profile.jsx` 中用 `supabase.auth.getUser()` 获取用户信息
5. 用 `supabase.from('saved_locations')` 替换硬编码数据
