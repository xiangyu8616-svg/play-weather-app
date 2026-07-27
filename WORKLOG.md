# 📓 玩天气 App — 每日工作日志（WORKLOG）

> 本文件由 Kimi Work 维护，每晚 20:00 定时任务自动追加当天条目。
> 若项目再次移交，**先看最新一条的【终点与明日起点】**，再回看 `HANDOVER.md` 和 `ROADMAP.md`。

---

## 2026-07-27（周一）· Kimi Work 接手首日

**【起点】**
麻辣龙虾完成 v1 交接文档（HANDOVER.md），项目状态：前端约65%、后端仅 `api/` BFF 骨架、社区为占位页。遗留问题：API Key 明文且在 git 追踪中、文档目录结构多处失真、`ROADMAP.md` 引用但不存在。

**【完成工作】**
1. 核验交接文档：逐条对照实际代码，确认技术栈/模块状态/文件大小准确；发现 5 处失真（ROADMAP.md 不存在、`开发文档/` 实为 `docs/`、后端"0%"实为 BFF 骨架已存在、CACHE_TTL 少列3项、两个 WeatherCard.jsx 重复）
2. 发现更严重安全问题：`config/apiKeys.js` 仍在 git 追踪、`.env.example` 含真实企业版 Key 且已提交、交接文档原文照抄两套 Key
3. 制定四阶段接手计划（S0止血→S1闭环→S2打磨→S3冷启动），含设计/技术/安全/营销四维度
4. 完成欧美出海路径调研（主体/上架/收款结汇/税务/2026新佣金政策）
5. 创建定时任务：每晚 20:00 自动复盘并追加本日志（Automation ID: automation_5727a80a）
6. 执行 S0 止血：git 停止追踪 apiKeys.js、`.env.example` 脱敏、修订 HANDOVER.md、补写 ROADMAP.md

**【文件调整】**
- 新增 `HANDOVER.md`（v2 修订版）：修正目录结构（补 api/、docs/ 改实名）、密钥脱敏、后端状态更正为"BFF骨架已存在"、新增安全处置进展章节
- 新增 `ROADMAP.md`：四阶段计划+差异化功能"今日拍摄窗口"定义+出海路径备忘
- 新增 `WORKLOG.md`：本文件
- 修改 `.env.example`：真实 Key 替换为占位符，补禁止填真实值的警告注释
- git 提交 `81b155f`：停止追踪 `config/apiKeys.js`（本地文件保留）
- git 提交 `69402c6`：`.gitignore` 新增 `secrets/` 目录忽略（防止本地 JWT 密钥等敏感文件误提交）

**【研究与决策】**
- 后端选型决策：**Supabase**（Postgres+Auth OTP，与 Vercel serverless 共存），优于 Firebase 的理由：国内可控访问、SQL 灵活、收藏/帖子/用户三表起步成本低
- 佣金调研结论：Apple 欧美 30%/小企业 15%（需注册）；Google Play 2026 改革：基础 20%、订阅 10%；中国区 25%/12% 与本项目无关
- 收款路径决策：万里汇/Payoneer 美国虚拟账户 → 凭交易数据结汇，不占 5 万美元个人额度
- 社区功能决策：延后至 S2 末，先验证"今日拍摄窗口"留存

**【终点与明日起点】**
S0 完成 4/8 项。明日优先：
1. ⬜ 等老朱作废旧 Key 并生成新 Key（0.4，唯一人工阻塞项）
2. ⬜ 收敛重复组件 `components/WeatherCard.jsx`（0.6）
3. ⬜ 提醒老朱注册 Apple/Google 开发者账号（0.7，Google Play 有封闭测试时间门槛）
4. 可并行启动：Supabase 项目初始化调研（S1.1）

---

## 2026-07-27 晚间补记（20:45，Kimi Work 手动追加）

**【密钥轮换——已完成大半】**（8点自动日志后发生，故补记）
- 通过 WebBridge 直接操作老朱已登录的和风控制台，在项目「玩天气」(4N2B2VEN82) 下新建两个凭据：
  - `prod-bff`：JWT (Ed25519)，凭据ID/kid=**K6B8EKE6JU**，公钥SHA256=c2a7ebd6...6127（与本地私钥配对验证一致）
  - `dev-local`：API KEY，凭据ID=**TFWG3NEFN5**，Key 已写入本地 `config/apiKeys.js`（不进git）并实测返回真实数据
- 两个凭据均限制为 8 个必需 API（GeoAPI/天气预报/分钟降水/空气质量/热带气旋/天气预警/天气指数/天文）；热带气旋无免费额度（计费警告已确认，台风路径功能需要）
- 私钥存本地 `secrets/ed25519-private.pem`（已被 .gitignore 忽略）；**切勿提交、切勿外发**
- 旧凭据共 3 个待删：玩天气/天气应用(TH59QRQ6EY)、天气2/new(TNPKF2T39E)、天气2/play-weather(T7WKCKUNX5)

**【明日起点（更新）】**
1. `api/weather.js` 加 Ed25519 JWT 签名（kid=K6B8EKE6JU，sub=项目ID 4N2B2VEN82，私钥从 Vercel 环境变量读）
2. Vercel 环境变量配置（可用 WebBridge 操作老朱 Chrome 上的 Vercel 后台）
3. 线上验证通过后，删除 3 个旧凭据（不可逆，需老朱确认；提前删会断线上网页版）
4. 收敛重复组件 WeatherCard.jsx（S0.6）
