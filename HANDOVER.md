# 🌤️ 玩天气 App — 项目交接文档

> **交接日期**: 2026-07-27  
> **原交接人**: 麻辣龙虾（Kimi/OpenClaw）  
> **现任维护**: Kimi Work（2026-07-27 正式接手）  
> **项目路径**: `C:\Users\xiangyu\.easyclaw\workspace\play-weather-app`
>
> **修订记录**:
> - v5（2026-07-29，Kimi Work）：更新第八章第1条为 Git 自动部署已上线；补充 `scripts/ensure-apiKeys.js` 到目录结构。
> - v4（2026-07-28 晚间，Kimi Work）：补充 Vercel 环境变量配置进展（已配但项目未连 Git，待 CLI 部署），
> - v4（2026-07-28 晚间，Kimi Work）：补充 Vercel 环境变量配置进展（已配但项目未连 Git，待 CLI 部署），
>   `vercel.json` 修复排除 `api/` 路径；6.1/6.2 安全事项更新。
> - v3（2026-07-28，Kimi Work）：补充 `lib/`、`supabase/`、`scripts/` 目录，删除已收敛的 WeatherCard 重复项，
>   后端状态更新为"schema 已就绪，待创建 Supabase 项目"。
> - v2（2026-07-27，Kimi Work）：修正目录结构失真（补 `api/`、`docs/`），密钥全部脱敏，
>   更新安全事项状态，后端状态从"无"更正为"BFF 骨架已存在"。
> - v1（2026-07-27，麻辣龙虾）：初版。

---

## 一、项目概述

**玩天气**是一款面向摄影爱好者的天气现象观测App，核心功能是帮助用户预测和追踪可拍摄的自然天气现象（极光、日照金山、云海、朝霞晚霞、台风等）。

- **当前版本**: v1.0.0-dev
- **框架**: Expo SDK 57 + React Native 0.86 + Expo Router
- **开发状态**: 前端功能约65%完成，后端约15%（BFF骨架已存在）
- **目标市场**: 欧美（iOS + Android 双端）

---

## 二、技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Expo | SDK 57 |
| 前端 | React Native | 0.86 |
| 路由 | Expo Router | ~57.0 |
| 状态管理 | Zustand | ^4.5.0 |
| 动画 | React Native Reanimated | ^3.16.1 |
| 图标 | @expo/vector-icons (Ionicons) | ~15.0 |
| 渐变 | expo-linear-gradient | ~15.0 |
| 存储 | @react-native-async-storage | 2.2.0 |
| 天文计算 | astronomy-engine + suncalc | ^2.1.19 / ^1.9.0 |
| HTTP | axios | ^1.16.0 |
| 天气API | 和风天气 (QWeather) | 企业版 |
| 后端 | Vercel Serverless（`api/` 目录） | 骨架 |

---

## 三、目录结构

```
play-weather-app/
├── app/                          # Expo Router 页面
│   ├── _layout.jsx               # 根布局（含极光启动屏 AuroraSplash）
│   ├── city-list.jsx             # 城市搜索页面
│   └── (tabs)/                   # 底部导航Tab
│       ├── _layout.jsx           # Tab导航配置（极光主题底部栏）
│       ├── index.jsx             # ⭐ 首页/观测（最复杂，35KB）
│       ├── forecast.jsx          # ⭐ 预报页（7天+光质+环境指数，17KB）
│       ├── community.jsx         # ❌ 社区页（仅占位，3KB）
│       └── profile.jsx           # 个人页（设置+硬编码数据，13KB）
│
├── api/                          # ⭐ 后端 BFF（Vercel Serverless，骨架已存在）
│   ├── _middleware.js            # 中间件
│   ├── weather.js                # 和风天气代理（内存缓存+限流，生产应换Redis）
│   ├── auth/
│   │   ├── send-code.js          # 发送验证码
│   │   └── verify-code.js        # 校验验证码
│   └── package.json
│
├── components/
│   ├── splash/AuroraSplash.jsx   # 极光粒子启动屏动画
│   ├── globe/                    # 3D地球仪（主组件+native/web/optimized多版本+控制+台风路径）
│   ├── weather/                  # 天气横幅/每日预报卡片/详情卡片/现象筛选器
│   ├── community/PhotoCard.jsx   # 社区照片卡片（未使用）
│   ├── icons/TabIcons.jsx        # 自定义Tab图标
│   ├── animations/FadeInView.jsx # 淡入动画组件
│   ├── AstroPanel.jsx            # 天文信息面板
│   ├── PhotoTimingPanel.jsx      # 摄影时间面板
│   └── WeatherCard.jsx           # ⚠️ 与 weather/WeatherCard.jsx 重复，已收敛删除（2026-07-28）
│
├── lib/
│   └── supabase.js               # ⭐ Supabase 客户端封装（OTP/用户资料/收藏/帖子）
│
├── services/                     # 业务逻辑层
│   ├── weather/                  # qweatherService.js（API封装18KB）+ weatherService.ts + index.ts
│   ├── phenomenon/               # 现象算法：cloudSea/glow/halo + index.ts
│   ├── phenomenonService.ts      # 旧聚合文件（与 phenomenon/ 并存）
│   ├── astronomyService.ts       # 天文计算（21KB）
│   ├── auroraService.ts          # 极光算法（11KB）
│   ├── authService.js            # JWT认证（4.9KB）
│   ├── settingsService.js        # 设置持久化
│   ├── cache.ts                  # 缓存服务（8.9KB）
│   ├── exifStripper.js           # EXIF信息脱敏
│   ├── sensitiveWordFilter.js    # 敏感词过滤
│   ├── index.ts                  # 服务聚合出口
│   └── QWEATHER_API.md           # 和风天气API文档
│
├── styles/designTokens.js        # ⭐ 设计Token（颜色/字体/间距，极光主题）
│
├── config/
│   ├── apiKeys.js                # ⭐ 本地密钥（含真实Key，【已停止git追踪】，仅存本地）
│   └── apiKeys.example.js        # 密钥配置模板（无真实值）
│
├── docs/                         # 开发文档（⚠️ v1文档误写为"开发文档/"）
│   ├── phase-4-5-plan.md
│   ├── design-forecast-community.md
│   ├── 算法说明文档.md
│   └── 进度日志.md
│
├── supabase/                     # ⭐ 后端 Schema（S1.1 已就绪）
│   ├── migrations/001_initial_schema.sql  # profiles/saved_locations/posts 三表 + RLS
│   └── README.md                 # 项目创建/配置/迁移指南
│
├── scripts/                      # 工具脚本
│   ├── verify-jwt.py             # JWT 签名结构验证（Python）
│   ├── prepare-vercel-env.py     # Vercel 环境变量配置辅助（PEM 单行化）
│   └── ensure-apiKeys.js         # CI 构建时自动生成 BFF 版 config/apiKeys.js
│   ├── verify-jwt.py             # JWT 签名结构验证（Python）
│   └── prepare-vercel-env.py     # Vercel 环境变量配置辅助（PEM 单行化）
│
├── assets/                       # 图标/启动屏/favicon
├── app.json                      # Expo配置（已移除newArchEnabled/splash）
├── package.json                  # 依赖（SDK 57已升级）
├── .env.example                  # 环境变量模板（【已脱敏】，真实值只放 .env.local）
├── HANDOVER.md                   # 本文件
├── ROADMAP.md                    # ⭐ 上线差距与四阶段计划
├── WORKLOG.md                    # ⭐ 每日工作日志（每晚20:00自动追加）
├── vercel.json / .vercelignore   # Vercel部署配置
└── 根目录另有: 基础服务层测试报告.md / 技术架构评估报告.md / 开发完成总结.md / 开发进度总结.md
```

---

## 四、各模块完成状态

### ✅ 已完成

| 模块 | 文件 | 完成度 | 说明 |
|------|------|--------|------|
| 首页/观测 | `app/(tabs)/index.jsx` | 95% | 极光+天气+天文+地球仪+城市搜索 |
| 预报页 | `app/(tabs)/forecast.jsx` | 90% | 7天预报+光质时间轴+AQI/UV/湿度/风速 |
| UI设计系统 | `styles/designTokens.js` | 100% | 极光主题，颜色/字体/间距Token |
| 启动屏 | `components/splash/AuroraSplash.jsx` | 100% | 极光粒子动画+Logo淡入 |
| 底部导航 | `app/(tabs)/_layout.jsx` | 100% | 极光主题TabBar，选中光晕效果 |
| 3D地球仪 | `components/globe/GlobeView*.jsx` | 85% | 多平台适配，城市标记 |
| 天气API | `services/weather/qweatherService.js` | 85% | 和风天气接入，有Mock回退 |
| 天文计算 | `services/astronomyService.ts` | 90% | 日出日落/月相/摄影时间 |
| 极光算法 | `services/auroraService.ts` | 70% | 本地算法+模拟数据 |
| 缓存系统 | `services/cache.ts` | 100% | 内存+AsyncStorage双层缓存 |
| 设置持久化 | `services/settingsService.js` | 100% | AsyncStorage存储 |

### ❌ 未完成

| 模块 | 文件 | 差距 | 优先级 |
|------|------|------|--------|
| 社区功能 | `app/(tabs)/community.jsx` | 100%缺失 | 🔴 P0 |
| 用户系统 | `api/auth/`有骨架，无前端UI | 缺注册/登录页面 | 🔴 P0 |
| 后端服务 | `api/`（BFF骨架）+ `supabase/`（schema已就绪） | 天气代理+验证码已有；数据库schema就绪（profiles/saved_locations/posts+RLS），待创建Supabase项目并执行migration | 🔴 P0 |
| 收藏地点 | `profile.jsx`硬编码 | 无真实数据 | 🔴 P0 |
| 推送通知 | 有开关无服务 | 需FCM/APNs | 🟡 P1 |
| 小时级预报 | 缓存层已预留`hourly`TTL | 缺服务调用+UI组件 | 🟡 P1 |
| 真实极光数据 | 本地模拟 | 需NOAA Kp指数（`NOAA_CONFIG`已配好） | 🟡 P1 |

---

## 五、已知Bug与问题

### 🔴 严重

| # | 问题 | 位置 | 状态 |
|---|------|------|------|
| 1 | `AuroraSplash.jsx` import路径错误 | `components/splash/AuroraSplash.jsx:14` | ✅ 已修复（`../` → `../../`） |
| 2 | `AuroraSplash.jsx` 缺少`Text` import | 同上 | ✅ 已修复 |
| 3 | Expo SDK版本不兼容 | `package.json` | ✅ 已升级（56→57） |
| 4 | API Key硬编码暴露 | `config/apiKeys.js` | 🔶 部分修复（见下方安全事项） |

### 🟡 中等

| # | 问题 | 位置 | 说明 |
|---|------|------|------|
| 5 | `profile.jsx`数据全硬编码 | `app/(tabs)/profile.jsx` | "12发帖/348获赞/5关注"都是假的 |
| 6 | `community.jsx`仅占位页 | `app/(tabs)/community.jsx` | 只有"即将上线"提示 |
| 7 | 混合TS/JS代码风格 | 多个文件 | 部分文件有类型错误但未阻塞运行 |
| 8 | 3D地球仪低端设备性能 | `components/globe/` | 可能卡顿，有optimized版本 |
| 9 | 重复组件 | `components/WeatherCard.jsx` 与 `components/weather/WeatherCard.jsx` | ✅ 2026-07-28 已删除两处死代码，首页已内联所有 UI |

### 🟢 轻微

| # | 问题 | 位置 |
|---|------|------|
| 10 | `app.json`缺少`newArchEnabled` | 已移除（SDK 57不支持） |
| 11 | 部分依赖peer warning | npm install时的warnings |
| 12 | `apiKeys.example.js` 域名是 devapi | 实际用的是企业版域名，模板可顺手更新 |

---

## 六、关键配置与安全事项

### 6.1 API密钥（🔴 最高优先级安全事项）

**2026-07-28 安全处置进展**（Kimi Work）：

- ✅ `config/apiKeys.js` 已停止 git 追踪（`git rm --cached`，提交 `81b155f`），真实Key仅存本地文件
- ✅ `.env.example` 已脱敏（原文件含真实Key且已提交进git）
- ✅ **Ed25519 JWT 签名已落地**：`api/weather.js` 支持 JWT（kid=K6B8EKE6JU）和 API KEY 双模式回退；Python 脚本验证签名结构通过（64字节 Ed25519）
- ✅ **Vercel 环境变量已配置**：`QWEATHER_ED25519_PRIVATE_KEY`、`QWEATHER_KID`（K6B8EKE6JU）、`QWEATHER_PROJECT_ID`（4N2B2VEN82）已在 Vercel Dashboard 设为 Production 环境
- ⚠️ **仍未完成**：历史提交中包含两个明文Key（一个开发Key、一个企业版Key）
- ✅ **已上线（2026-07-29）**：Vercel 项目已连接 GitHub 仓库（`xiangyu8616-svg/play-weather-app`），push 到 `main` 自动构建部署；`vercel.json` 修复已生效，`/api/weather` 线上验证返回真实和风数据（Ed25519 JWT 模式）
- ❗ **待人工确认**：旧凭据（玩天气/天气应用/天气2）是否还在使用线上网页版，确认后可删除

**密钥的正确使用方式**（轮换后）：

```javascript
// config/apiKeys.js（本地文件，不进git）
export const QWEATHER_KEY = 'USE_BFF'; // 上线后走 api/weather.js 代理，前端不持有Key
```

### 6.2 环境变量

**文件**: `.env.example` → 复制为 `.env.local`（`.env*.local` 已被 .gitignore 忽略）

```bash
# 和风天气（二选一，优先 JWT）
QWEATHER_ED25519_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
<多行PEM>
-----END PRIVATE KEY-----    # Ed25519 私钥（Vercel 环境变量需转单行 \n 分隔）
QWEATHER_KID=your_kid_here   # 和风控制台凭据 ID，如 K6B8EKE6JU
QWEATHER_PROJECT_ID=your_project_id_here  # 和风项目 ID，如 4N2B2VEN82
QWEATHER_API_KEY=your_qweather_api_key_here   # API KEY 回退（可选）
QWEATHER_BASE_URL=<企业版API域名>

# JWT 认证（自建登录用，非和风）
JWT_SECRET=<64字节随机串>    # node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Supabase（S1.1 已就绪，待创建项目）
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 6.3 Vercel 部署注意事项

- ✅ **已连接 Git（2026-07-29）**：项目 `play-weather-app` 已绑定 GitHub 仓库 `xiangyu8616-svg/play-weather-app`，push 到 `main` 分支即自动触发生产部署。
- **构建链路**：`vercel.json` 定义 `buildCommand`（`node scripts/ensure-apiKeys.js && npx expo export --platform web`）+ `installCommand`（`npm install --legacy-peer-deps`）+ `outputDirectory: dist`。`scripts/ensure-apiKeys.js` 在 CI 缺文件时生成 BFF 版 `config/apiKeys.js`，本地开发不受影响。
- **`.vercelignore` 已重写**：旧版是"只上传 dist"的 CLI 模式（`*` 全排除），会导致 Git 构建缺源码失败，2026-07-29 已改为只排除 node_modules/密钥/日志等。
- **vercel.json 已修复**：rewrite 规则排除 `api/` 路径，防止 SPA fallback 覆盖 `/api/weather` 等后端路由（线上已验证生效）。
- **Vercel CLI 注意**：本机 CLI token 已过期，如需 CLI 操作需重新 `vercel login`；日常部署走 Git push 即可，不依赖 CLI。

### 6.4 Expo配置

`app.json`：name=玩天气、scheme=playweather、深色模式、双端 bundle id = `com.playweather.app`、plugins=[expo-router]、experiments.typedRoutes=true。已移除 `newArchEnabled` 和 `splash` 字段（SDK 57不再支持）。

---

## 七、开发环境

### 7.1 启动开发服务器

```powershell
cd C:\Users\xiangyu\.easyclaw\workspace\play-weather-app
npx expo start --port 8081 --lan --clear
```

### 7.2 预览方式

1. **Expo Go（推荐）**: 手机与电脑同一局域网，扫码或手动输入终端中显示的 `exp://<本机局域网IP>:8081`
2. **安卓模拟器**: 待安装
3. **Web**: `npx expo start --web`（部分功能可能有兼容问题）

### 7.3 依赖安装

```powershell
npm install --legacy-peer-deps
```

> 必须使用 `--legacy-peer-deps` 因为部分依赖有peer冲突。

---

## 八、下一步工作建议

> 完整版见 `ROADMAP.md`（四阶段：S0止血 → S1闭环 → S2打磨 → S3冷启动）。

### 🔴 优先级最高（阻塞上线）

1. **Git 自动部署已上线** — 项目已绑定 GitHub 仓库，push 到 `main` 即自动构建部署；`/api/weather` 线上验证通过（Ed25519 JWT 模式）
2. **密钥轮换** — 和风控制台作废旧Key、确认线上网页版不再依赖后删除（人工操作，30分钟）
3. ~~**补全后端**~~ ✅ Supabase 项目已建好（2026-07-30）：`play-weather`（us-east-1），三张表 + RLS 已迁移并验证，密钥已配 `.env.local` 和 Vercel 环境变量（DB 密码存 `secrets/supabase-db-password.txt`）
4. **实现用户系统** — 邮箱/手机号+验证码登录页（复用 `api/auth/`）
5. **收藏地点管理** — 增删改查，AsyncStorage快照+Supabase同步
6. **前端全量切BFF** — `QWEATHER_KEY='USE_BFF'`，前端不再持有Key

### 🟡 优先级中等

7. **社区功能** — 帖子列表/发帖/评论/点赞（建议放到S2末，先有用户量再开社区）
8. **小时级预报** — 缓存已预留hourly TTL，成本最低用户感知最强，可提前
9. **极光真实数据** — 接入NOAA Kp指数API（配置已就绪）
10. **推送通知** — Firebase Cloud Messaging / APNs

### 🟢 优先级低

11. **应用截图** — 各尺寸商店截图（欧美市场需英文素材）
12. **EAS构建配置** — iOS/Android生产构建
13. **多语言** — 英文支持（目标欧美，优先级实际应提前到S2）

---

## 九、重要文件速查

| 需求 | 文件路径 |
|------|----------|
| 改颜色/字体/间距 | `styles/designTokens.js` |
| 改底部导航 | `app/(tabs)/_layout.jsx` |
| 改启动屏 | `components/splash/AuroraSplash.jsx` |
| 改天气API | `services/weather/qweatherService.js` |
| 改后端代理 | `api/weather.js` |
| 改极光算法 | `services/auroraService.ts` |
| 改首页内容 | `app/(tabs)/index.jsx` |
| 改预报页 | `app/(tabs)/forecast.jsx` |
| 改个人页 | `app/(tabs)/profile.jsx` |
| 改社区页 | `app/(tabs)/community.jsx` |
| 改API Key | `config/apiKeys.js`（本地，不进git） |
| 看上线差距与计划 | `ROADMAP.md` |
| 看每日进展 | `WORKLOG.md` |

---

## 十、联系人

- **项目Owner**: 老朱
- **现任维护**: Kimi Work（2026-07-27 接手）
- **原开发AI**: 麻辣龙虾（OpenClaw）
- **天气API**: 和风天气 (qweather.com)

---

> 📝 **备注**: 本项目代码大部分由AI生成，部分文件有混合语言（TS/JS）和类型不完善的情况，但不影响运行。建议新增代码一律用TypeScript，存量随迭代逐步迁移，不做集中重写。

> 📓 **每日记录**: 每晚20:00有定时任务自动复盘当天工作并追加到 `WORKLOG.md`。若再次移交，先看 `WORKLOG.md` 最新一条的【终点与明日起点】。
