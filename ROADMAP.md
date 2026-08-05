# 🗺️ 玩天气 App — 上线路线图（ROADMAP）

> **制定日期**: 2026-07-27（Kimi Work 接手首日）
> **目标市场**: 欧美（iOS + Android）
> **定位一句话**: 给风光摄影师的天气预报，不是给通勤族的。
> **北极星指标**: 每周成功拍摄次数（用户按预测出门并拍到好片），用提醒点击率+社区发帖做代理指标。

---

## 总体节奏

| 阶段 | 周期 | 目标 | 验收标准 |
|------|------|------|---------|
| **S0 止血** | 第 1 周 | 安全与工程卫生 | 密钥全部轮换、git 清追踪、稳定构建 |
| **S1 闭环** | 第 2–5 周 | 核心体验闭环（登录+收藏+BFF） | 真实用户能注册、收藏3个城市、每天收到拍摄提醒 |
| **S2 打磨** | 第 6–8 周 | 设计一致性+英文版+商店素材 | TestFlight/Play 内测包发出，崩溃率 <1% |
| **S3 冷启动** | 第 9–12 周 | 小范围上线+种子社区 | 500 种子用户、100 条真实 UGC、次日留存 >40% |

原则：**不重写，收敛债务；先有用户量，再开社区；订阅制变现延后到验证留存之后。**

---

## S0 止血（第 1 周）

| # | 任务 | 负责 | 状态 |
|---|------|------|------|
| 0.1 | 停止 git 追踪 `config/apiKeys.js` | Kimi Work | ✅ 2026-07-27 完成（commit 81b155f） |
| 0.2 | `.env.example` 脱敏 | Kimi Work | ✅ 2026-07-27 完成 |
| 0.3 | 修订 `HANDOVER.md` + 补 `ROADMAP.md` + 建 `WORKLOG.md` | Kimi Work | ✅ 2026-07-27 完成 |
| 0.4 | **和风控制台作废旧Key、生成新Key（开发/线上两套）** | 老朱（人工） | ✅ 2026-07-27 已完成（新凭据 prod-bff + dev-local 已创建） |
| 0.5 | 更新本地 `config/apiKeys.js` 与 Vercel 环境变量 | 老朱/Kimi Work | ✅ 2026-07-29 完成（Git 自动部署已上线，/api/weather 线上验证通过） |
| 0.6 | 收敛重复组件 `WeatherCard.jsx`（两处并存） | Kimi Work | ✅ 2026-07-28 完成（确认两处均为死代码，已删除） |
| 0.7 | 注册 Apple Developer（$99/年）+ Google Play（$25）账号 | 老朱（人工） | ⬜ Google Play 新号有封闭测试门槛，越早越好 |
| 0.8 | 决定主体形态（个人/个体户/公司），影响欧盟DSA公示信息与收款 | 老朱 | ⬜ |

## S1 闭环（第 2–5 周）

| # | 任务 | 说明 |
|---|------|------|
| 1.1 | 后端选型落地：Supabase | ✅ 项目已创建（`play-weather`，us-east-1，ref: rcrbqeebrffqifaofuou），migration 已执行（profiles / saved_locations / posts 三表 + RLS 已验证），URL + publishable key 已配 `.env.local` 和 Vercel 环境变量；下一步替换 `authService` 为 Supabase OTP |
| 1.2 | 前端全量切 BFF | ✅ 2026-08-03 完成：线上构建由 ensure-apiKeys 生成 `QWEATHER_KEY='USE_BFF'`，前端不持有 Key；修复 BFF 代理端点丢失 bug（原实现丢弃 endpoint 导致线上搜索/逐日预报长期走 mock）——代理改为端点白名单转发（weather/* + city/lookup），JWT 改 Authorization: Bearer，前端 buildUrl 传 type |
| 1.3 | 登录系统 | ✅ 邮箱 OTP 已上线（2026-07-30）：`stores/userStore.js` + `EmailLoginCard`，Supabase Auth 替代 `api/auth/`（已删）；Zustand `userStore` 含会话恢复/资料/收藏数；待实测收邮件 + 昵称编辑 |
| 1.4 | 收藏地点 | ✅ 2026-08-03 上线：`stores/savedLocationsStore.js`（AsyncStorage 快照，离线/未登录可用）+ Supabase `saved_locations` 双向合并（乐观更新+失败回滚）；city-list 星标 toggle +「我的收藏」分组；首页默认城市接入；待实测云端同步 |
| 1.5 | 小时级预报 | ✅ 2026-08-03 完成：`getHourlyForecast`（/weather/24h，缓存 TTL 30min）+ 首页逐小时横向滚动卡片（时刻/图标/温度/降水概率）；概览行图标按天气文本映射 |
| 1.6 | 极光真实数据 | ✅ 2026-08-04 完成：`services/aurora/noaaService.js` 接入 NOAA SWPC Kp 预报（免费无 Key、CORS 开放、缓存 60min）；首页 hero 卡 KP 写死 → 今晚 KP 峰值 + 按纬度估算的本地 KP 门槛；概率 = 天气分×50% + Kp 达标度×45% |
| 1.7 | 后端加固 | 限流换 Upstash Redis、验证码防刷、JWT secret 换 64 字节随机串 |
| 1.8 | "今日拍摄窗口"卡片 | ✅ 2026-08-04 完成：`services/phenomenon/shootingWindow.js` 纯函数（朝霞/晚霞窗口选取：未结束窗口取概率高者、平手取晚霞、今日全过转明早 +24h；质量等级映射 epic/excellent/good/fair/poor）+ `services/reminderService.js`（expo-notifications 本地提醒，提前 30min，单条去重，Web/未授权优雅降级）+ 首页 hero 卡下方金色描边卡片（一句话结论+质量徽章+一键提醒）；单测 7/7 通过（`scripts/test-shooting-window.mjs`）；待实测通知在真机的到达率 |

**差异化功能 —— 今日拍摄窗口**：首页顶部卡片，把天文时刻+天气预测合成为可执行结论：
> "今晚 19:42–20:15 有 72% 概率出现晚霞，能见度 24km，建议朝西。"
配"一键提醒"按钮。这是用户每天打开 App 的理由，也是后续订阅制的核心卖点。

## S2 打磨（第 6–8 周）

| # | 任务 | 说明 |
|---|------|------|
| 2.1 | 英文版（i18n） | ✅ 2026-08-04 完成：`services/i18n/`（zh/en 语言包 + zustand store + `{param}` 插值 + AsyncStorage 持久化），默认中文，「我的 → 设置 → 语言」点击切换；术语标准 `docs/translation-glossary.md`（主参考 AccuWeather）；已接入：全部页面 + 和风 API lang 跟随（缓存按语言隔离）+ 数据层文本（AQI 按 EPA 命名、UV 按 WHO 命名、月相、星座、风向罗盘缩写、台风 JMA 分级、mock 文本）——i18n 全链路闭环，待用户实测 |
| 2.2 | 设计一致性审计 | ✅ 2026-08-05 完成：审计报告 `docs/DESIGN_AUDIT.md`（7 项修复 + 1 个潜伏 bug）；新增令牌 `Bg.glass`/`Accent.blueHour`；卡片底/红绿金青色值归一；修复 `TextColor.Primary` 大小写 bug（4 文件 10 处，颜色此前静默回退）；顺带修复**首页生产白屏**（index.jsx 用 FontFamily 未导入，根路由 ReferenceError 整站空白） |
| 2.3 | 空状态与错误态 | ✅ 2026-08-04 完成（除定位被拒）：首页/预报页红色错误横幅+重试按钮，区分「加载失败（含无网络）」与「API 配额耗尽」（qweatherService 新增 wasQuotaExceeded 标记，402 置位/成功复位）；city-list 收藏为空时显示虚线引导框（原直接隐藏分组）；定位被拒暂不适用——App 采用手动选城市、未申请定位权限 |
| 2.4 | 合规文档 | ✅ 2026-08-05 完成（除 W-8BEN 需本人填写）：中英双语隐私政策公开页 `https://play-weather-app.vercel.app/privacy-policy.html`（含删除账号/举报联系章节）；profile 关于区接链接 + 删除账号入口（确认弹窗→邮件请求，7 天内处理）；社区页举报/联系入口；`docs/data-safety.md` 商店数据安全表单预填（Play Data Safety + Apple 隐私标签 + GDPR 自查） |
| 2.5 | 商店素材 | ✅ 2026-08-05 完成（截图部分）：英文上架文案 `docs/store-listing.md`（App Store 名称/副标题/关键词/描述 + Play 短描述）；截图全套 6+5 张——6.7"（1290×2796）：01-home-zh、02-home-en、03-forecast-en、04-profile-en、05-phenomenon-en（月相/银河+大气光学）、06-globe-en（晨昏线地球）；6.5"（1242×2688）`store-assets/6.5inch/` 五张英文对应；i18n 瑕疵全部修复（`83a174b`/`dc9cf01`/`43ea346`）：城市名英化（cityNames.js 18 城映射）、风向/天气文本英化（windDirEn/weatherTextEn）、月相/银河质量/季节因素英化（moonPhaseNameEn/seasonFactorEn/mwQualityEn）、语言切换自动重拉（prevLangRef）、Today/Tomorrow 折行修复（dayName 宽 86），均线上实测通过 |
| 2.6 | EAS Build 双端 profile | iOS TestFlight + Android 封闭测试（Play 新号需约14天封闭测试，提前启动） |
| 2.7 | 测试补齐 | ✅ 2026-08-05 完成：现象算法（霞光/丁达尔/彩虹/日晕/拍摄窗口 28 用例）、缓存层（读写/TTL/双层/清理/装饰器 13 用例）、API 代理（白名单/参数透传/缓存/限流 15 用例），共 56 用例全过；统一入口 `npm test`（Node 24 原生 TS + ESM loader 重定向 AsyncStorage stub），基建在 `scripts/`（tap 断言库/loader/stub） |
| 2.8 | 性能 | 地球仪低端机默认 optimized 版 + 帧率检测自动降级 |
| 2.9 | 社区功能开发（S2末启动） | 帖子列表/发帖/点赞，复用 PhotoCard.jsx |

## S3 冷启动（第 9–12 周）

| # | 任务 | 说明 |
|---|------|------|
| 3.1 | 种子用户招募 | 摄影社区/论坛/摄协群送 100 内测码；Product Hunt 预备 |
| 3.2 | 内容冷启动 | 前 100 条帖子自己人发（作品+参数+当时天气数据） |
| 3.3 | 内容营销 | 技术博客《如何用气象数据预测云海/朝霞》立信任 |
| 3.4 | ASO | 关键词：sunrise forecast / golden hour / cloud sea / aurora alert |
| 3.5 | 数据复盘 | D1/D7/D30 留存、拍摄窗口提醒点击率，决定社区与订阅制节奏 |
| 3.6 | 变现（延后） | 留存验证后开 Pro 订阅：多城市提醒、小时级光质、无广告 |

---

## 出海路径备忘（详见 2026-07-27 WORKLOG 研究条目）

- **佣金（2026新政）**: Apple 欧美标准 30%，小企业计划（<$100万/年）15%，新开发者自动符合但需注册；Google Play 改革落地中：基础服务费 20%、订阅 10%、EEA/UK/US 用 Google 支付 +5%。双端都要注册低费率计划。
- **收款**: 万里汇/Payoneer 等开美国虚拟银行账户绑 App Store Connect + Play Console，凭交易数据以数字服务贸易申报结汇，不占个人 5 万美元额度，费率约 0.7–1%。
- **税务**: 美国市场必填 W-8BEN（预扣税 30%→10%）；欧美 VAT/销售税由商店代扣代缴。
- **合规红线**: 欧盟 DSA 公示交易者信息（建议公司主体）；App 内必须可删账号；精确位置属高敏感权限。

---

## 已明确的"不做/延后"清单

- ❌ 大而全社区先行（改为 S2 末启动）
- ❌ 存量代码集中重写为 TS（随迭代迁移）
- ❌ 付费体系 v1 上线（留存验证后再开）
- ❌ 国内安卓渠道（目标欧美，Google Play 即可）

> 本文件由每晚 20:00 的定时任务配合 `WORKLOG.md` 持续维护；阶段状态变化时请同步更新。
