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

---

## 2026-07-28（周二）· S0 继续推进

**【起点】**
承接昨日补记的明日起点：JWT 私钥已就绪（`secrets/ed25519-private.pem`），`api/weather.js` 仍用 API KEY 明文传参，需改为 Ed25519 JWT 签名；WeatherCard 两处重复待收敛；老朱的 Apple/Google 开发者账号注册仍阻塞。

**【完成工作】**
1. 重写 `api/weather.js`：从 `jsonwebtoken` 切到 `jose`（`jose` 支持 Ed25519），实现 Ed25519 JWT 签名（kid=K6B8EKE6JU，sub=4N2B2VEN82），保留 API KEY 回退；JWT 缓存 55 分钟避免重复签名
2. 编写 `scripts/verify-jwt.py` 独立验证脚本：用 Python `cryptography` 库复现签名逻辑，确认 JWT 结构正确（alg=EdDSA，签名 64 字节）
3. S0.6 收敛重复组件：grep 全项目确认两个 `WeatherCard.jsx` 均无任何引用，判定为死代码；删除 `components/WeatherCard.jsx`（根目录版，218行）和 `components/weather/WeatherCard.jsx`（子目录版，123行）
4. 更新 `.env.example`：新增 `QWEATHER_ED25519_PRIVATE_KEY`/`QWEATHER_KID`/`QWEATHER_PROJECT_ID` 说明，保留 `QWEATHER_API_KEY` 作为回退
5. 同步文档：`HANDOVER.md` Bug #9 标记已解决；`ROADMAP.md` S0.4 标记完成、S0.5 更新为待 Vercel 配置、S0.6 标记完成

**【文件调整】**
- 修改 `api/weather.js`：Ed25519 JWT 签名 + API KEY 回退双模式；JWT 缓存；缓存 key 按 auth 模式隔离
- 修改 `api/package.json`：依赖从 `jsonwebtoken` 换为 `jose@^5.2.0`
- 修改 `.env.example`：新增 JWT 相关三个环境变量，保留 API KEY 回退
- 新增 `scripts/verify-jwt.py`：Python 验证脚本，用于独立校验签名逻辑
- 删除 `components/WeatherCard.jsx` + `components/weather/WeatherCard.jsx`：死代码，首页已全部内联

**【研究与决策】**
- `jsonwebtoken` 库不支持 Ed25519（仅 HSA/RSA/ECDSA），必须换 `jose`；Vercel serverless 会自动安装 `api/package.json` 依赖
- 私钥通过环境变量传入（PEM 多行转 `\n` 分隔），Vercel 环境变量支持多行值，代码中自动还原换行符
- JWT 缓存策略：55 分钟有效期（和风 JWT 有效期 1h），避免每次请求都重新签名

**【终点与明日起点】**
S0 完成 6/8 项（0.1–0.4、0.6 完成，0.5 代码就绪待 Vercel 配置）。明日优先：
1. ⏳ 通过 WebBridge 操作老朱 Chrome 上的 Vercel Dashboard，配置 `QWEATHER_ED25519_PRIVATE_KEY`/`QWEATHER_KID`/`QWEATHER_PROJECT_ID`
2. ⏳ 线上验证 JWT 签名后，提醒老朱删除 3 个旧凭据（不可逆，确认线上网页版不再依赖）
3. ⬜ 老朱注册 Apple Developer + Google Play 开发者账号（0.7）
4. 可并行启动：Supabase 项目创建 +  schema 设计（S1.1）

---

## 2026-07-28 晚间补记（20:00，S1.1 落地）

**【起点】**
承接白天日志终点：S0 完成 6/8，api/weather.js JWT 签名已就绪，待 Vercel 配环境变量；S1.1 Supabase 尚未启动。

**【完成工作】**
1. S1.1 Supabase 后端选型落地：设计 profiles / saved_locations / posts 三表 schema，含 RLS 行级安全策略
2. 编写 `lib/supabase.js`（197行）：封装 OTP 登录/验证、用户资料 CRUD、收藏地点增删改查、社区帖子分页与创建
3. 编写 `supabase/README.md`：从零注册到执行 migration 的完整操作指南（含 SMTP/Resend 配置）
4. 编写 `supabase/migrations/001_initial_schema.sql`（137行）：三表定义 + 外键 + 唯一约束 + RLS policy
5. 更新 `.env.example`：补充 `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` 模板
6. 更新 `ROADMAP.md`：S1.1 状态更新为"Schema + 客户端 + 接入指南已就绪，待创建项目并执行 migration"
7. 编写 `scripts/prepare-vercel-env.py`：读取本地 PEM 私钥并转为单行格式，输出 Vercel 环境变量配置清单（含 kid / projectId）

**【文件调整】**
- 新增 `lib/supabase.js`：Supabase 客户端封装，含 OTP/用户资料/收藏/帖子四类操作
- 新增 `supabase/migrations/001_initial_schema.sql`：三表 schema + RLS 策略
- 新增 `supabase/README.md`：Supabase 项目创建/配置/迁移指南
- 新增 `scripts/prepare-vercel-env.py`：PEM 私钥转单行，输出 Vercel 环境变量配置命令
- 修改 `.env.example`：补充 Supabase 环境变量占位符
- 修改 `ROADMAP.md`：S1.1 状态推进

**【研究与决策】**
- Supabase Auth OTP 将替代自建 `api/auth/send-code.js` + `verify-code.js`（内存 Map 在 Vercel serverless 不可靠），S1 执行迁移
- RLS 策略：profiles/saved_locations 仅本人可见；posts 已发布全员可读，CUD 仅本人
- 社区帖子表 pre-build，S2 末启用，避免后期 schema 变更

**【终点与明日起点】**
S0 仍 6/8（0.5 待 Vercel 配置），S1.1 已就绪。明日优先：
1. ⏳ WebBridge 操作老朱 Chrome 配 Vercel 环境变量（QWEATHER_ED25519_PRIVATE_KEY/KID/PROJECT_ID）
2. ⬜ 老朱注册 Apple Developer + Google Play 开发者账号（0.7）
3. ⬜ 老朱创建 Supabase 项目并执行 migration（按 README 步骤）
4. ⬜ 安装 `@supabase/supabase-js` 到项目依赖
