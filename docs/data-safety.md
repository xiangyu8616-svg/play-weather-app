# 商店数据安全表单预填（ROADMAP 2.4 配套）

日期：2026-08-05 ｜ 依据：`public/privacy-policy.html`（线上隐私政策）

## Google Play — Data Safety 表单

| 问题 | 回答 |
|------|------|
| 是否收集或共享用户数据？ | 是 |
| **位置 — 精确位置** | ❌ 不收集（App 不申请定位权限，城市由用户手动选择） |
| **位置 — 大致位置** | ❌ 不收集 |
| **个人信息 — 邮箱地址** | ✅ 收集（可选）｜用途：账号功能｜必需性：可选（不登录也可用）｜是否加密传输：是（HTTPS）｜是否可删除：是（邮件请求，7 天内） |
| **个人信息 — 其他（昵称）** | ✅ 收集（可选）｜用途：账号功能/个性化｜可选｜加密传输｜可删除 |
| **应用活动 — 用户生成的内容（收藏城市）** | ✅ 收集｜用途：应用功能（收藏同步）｜可选｜加密传输｜可删除 |
| **应用信息与性能 — 崩溃日志/诊断** | ❌ 当前未接入崩溃收集 SDK（如后续接入 Sentry/Crashlytics 需改为是） |
| **设备标识符 / 广告 ID** | ❌ 不收集，无广告 |
| 数据是否与第三方共享 | ❌ 不共享（Supabase/Vercel/和风天气均为服务处理方 processor，非"共享给第三方"） |
| 数据是否加密传输 | ✅ 是（全链路 HTTPS） |
| 是否提供数据删除途径 | ✅ 是（App 内「我的 → 关于 → 删除账号」+ 隐私政策页面 + 邮件） |

## Apple App Store — App Privacy（隐私标签）

| 项目 | 回答 |
|------|------|
| Contact Info — Email Address | Linked to user: Yes ｜ Purpose: App Functionality ｜ 可选 |
| User Content — Other (saved cities) | Linked to user: Yes ｜ Purpose: App Functionality |
| Identifiers / Location / Usage Data / Diagnostics | 不收集 |
| Tracking (ATT) | 否 — 不追踪用户，无需 App Tracking Transparency 弹窗 |

## GDPR 自查（面向欧盟用户）

- ✅ 合法性基础：账号数据为合同必要（登录功能）；不登录的本地数据不出设备
- ✅ 删除权：7 天内响应（隐私政策第 4 节）
- ✅ 访问权/更正权：邮件联系处理（第 5 节）
- ✅ 数据可携带：收藏数据可通过邮件请求导出
- ✅ 无自动化决策/画像
- ⚠️ Supabase 数据处理地在美国：隐私政策已披露；Supabase 默认采用 SCC（标准合同条款）
- ⚠️ 未成年人：App 非面向 13 岁以下儿童（商店分级时选择 4+ / Everyone，但隐私政策不含儿童条款——如需 COPPA 合规另行补充）

## 待用户本人完成（无法代办）

- **W-8BEN**（Apple/Google 收款税务表）：需你本人在 App Store Connect / Play Console 用个人/公司信息填写并电子签名
- 在 App Store Connect / Play Console 里把上表答案录入并提交
- 隐私政策 URL 填：`https://play-weather-app.vercel.app/privacy-policy.html`
