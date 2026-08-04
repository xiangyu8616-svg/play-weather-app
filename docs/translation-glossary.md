# 玩天气 · 翻译词典（Translation Glossary）

> **用途**：i18n 术语唯一标准。所有页面英文文案以此为准，新增文本先查本表再落笔。
> **主参考**：AccuWeather（全球下载量最大的第三方天气 App，官方自称 "the No. 1 weather app worldwide"）
> **交叉验证**：The Weather Channel（美国 MAU 第一）、Apple Weather、timeanddate.com（天文术语）
> **创立日期**：2026-08-04

---

## 一、使用规则

1. **不抄注册商标**：AccuWeather 的 RealFeel® / MinuteCast® / WinterCast® 等均为注册商标，禁用。通用行业标准术语（Feels Like、Hourly、Alerts）可自由使用。
2. **大小写**：卡片/区块标题用 Title Case（`Hourly Forecast`、`Atmospheric Optics`）；行内标签与句子用 Sentence case（`Feels like`、`Sign out`）。
3. **Kp 指数**：学术与 NOAA 标准写法为 `Kp`（小写 p），UI 一律用 `Kp`，不用 `KP`。
4. **单位**：zh 风速显示「N 级」（蒲福风级）；en 不加单位后缀（后续随温度单位设置一起改 km/h / mph / Beaufort）。
5. **品牌 slogan** 不意译逐字，只传达意境：「预见金山，不负此行」→ `Chase the golden light`。
6. **缺失回退**：en 包缺 key 时框架自动回退中文，但正式提交前必须补齐，不允许裸奔。

---

## 二、气象基础术语

| 中文 | 英文（本项目标准） | 参考依据 | 备注 |
|------|-------------------|----------|------|
| 体感温度 | Feels Like | TWC / Apple Weather 通用 | AccuWeather 的 RealFeel® 禁用 |
| 湿度 | Humidity | 三家一致 | |
| 风速 | Wind | 三家一致 | zh「3 级」→ en `3`（Beaufort 数，不加级） |
| 能见度 | Visibility | 三家一致 | |
| 云量 | Cloud Cover | AccuWeather 术语 | 不用 `Cloud`（歧义） |
| 紫外线 | UV / UV Index | Apple 用 UV Index；紧凑 UI 用 UV | 首页指标卡用 `UV` |
| 气压 | Pressure | 三家一致 | |
| 降水概率 | Chance of Rain / PoP | TWC 用 Chance of Rain | 逐小时行内用 `💧{n}%` 无文字 |

## 三、预报结构术语

| 中文 | 英文（本项目标准） | 参考依据 |
|------|-------------------|----------|
| 实时天气 | Current Conditions | AccuWeather "Current" |
| 逐小时预报 | Hourly Forecast | AccuWeather / Apple 均用 Hourly |
| 逐日预报 | Daily Forecast | AccuWeather "Daily"；TWC "10 Day" 不适用 |
| 天气预警 | Weather Alerts | AccuWeather "Alerts" |
| 雷达 | Radar | 三家一致 |
| 现在 | Now | 三家一致 |
| {h}时 | {h}:00 | 24 小时制不加 AM/PM（后续可配） |

## 四、天文摄影术语（差异化功能，主流天气 App 无对应）

参考摄影与天文领域标准用法（timeanddate、PhotoPills、Stellarium）。

| 中文 | 英文（本项目标准） | 参考依据 |
|------|-------------------|----------|
| 黄金时刻 | Golden Hour | 国际摄影通用术语 |
| 蓝调时刻 | Blue Hour | 国际摄影通用术语 |
| 月相 | Moon Phase | timeanddate |
| 月相照度 | Illumination | timeanddate "Moon Illumination" |
| 银河 | Milky Way | |
| 观测质量 | Quality | 行内格式 `Quality {q}` |
| 非观测季 | Out of Season | |
| 极光 | Aurora | 全称 Aurora Borealis / Northern Lights，UI 一律用 Aurora |
| Kp 指数 | Kp | NOAA 标准写法（小写 p） |
| 今晚能看到极光吗 | Aurora tonight? | 卡片大标题，短语化（TWC 风格），不用完整问句 |
| 可见 / 不可见 | Visible / Not Visible | |
| 本地需 Kp≥N | Kp≥{n} needed here | |
| 需更高指数 | higher Kp needed | |
| 极光概率 | Aurora Probability | 行内 `Aurora probability {p}%` |
| 日落后 | After Sunset | |
| 进行中（倒计时到点） | Now | |
| 朝霞 / 晚霞 | Dawn / Dusk | meta 行 `Dawn {a}% · Dusk {b}%` |
| 霞光（火烧云预测） | Sky Glow | 摄影圈通用说法，无精确对应词 |
| 彩虹 | Rainbow | |
| 日晕 | Halo | 气象学 22° halo |
| 大气光学现象 | Atmospheric Optics | atoptics.co.uk 标准学科名 |
| 全球视角 | Global View | |
| 摄影评分 | Score | 行内标签 |

## 五、App UI 术语

| 中文 | 英文（本项目标准） | 参考依据 |
|------|-------------------|----------|
| 观测（Tab） | Observe | 动词化，符合摄影定位 |
| 预报（Tab） | Forecast | |
| 社区（Tab） | Community | |
| 我的（Tab） | Profile | Apple 系惯例；不用 `Me` |
| 选择城市 | Select City | |
| 搜索城市 | Search cities... | placeholder 句末三点保留 |
| 我的收藏 | Saved Locations | AccuWeather "Saved Locations"；TWC "Favorites" 不采用 |
| 极光观测热门 | Aurora Hotspots | |
| 热门城市 | Popular Cities | |
| 未找到城市 | No cities found | |
| 设置 | Settings | |
| 语言 | Language | |
| 温度单位 | Temperature Unit | 行内描述 `Current: Celsius / Fahrenheit` |
| 摄氏度 / 华氏度 | Celsius / Fahrenheit | |
| 通知 | Notifications | |
| 通知推送 | Push Notifications | |
| 高概率预警 | High-Probability Alerts | 描述 `Push when saved locations exceed 70%` |
| 每日预报（推送） | Daily Forecast Push | 与逐日预报区分，强调推送行为 |
| 每天早上 8 点推送 | Daily push at 8:00 AM | |
| 关于 | About | |
| 帮助与反馈 | Help & Feedback | |
| 隐私政策 | Privacy Policy | |
| 开源许可 | Open Source Licenses | |
| 版本号 | Version | |
| 退出登录 | Sign Out | |
| 当前城市 | Current City | |
| 切换 | Change | |
| 数据来源：和风天气企业版 | Data: QWeather Enterprise | 和风官方英文名 QWeather |
| 摄影爱好者 | Photographer | 默认昵称 |
| 发帖数 / 获赞数 / 关注城市 | Posts / Likes / Saved | 统计胶囊短词 |
| 或使用（登录分隔） | or | 小写，夹在分隔线中 |

---

## 六、待接入页面预留术语（forecast / community / 登录卡片）

| 中文 | 英文（本项目标准） | 备注 |
|------|-------------------|------|
| 邮箱验证码登录 | Sign in with Email Code | |
| 发送验证码 | Send Code | |
| 重新发送 | Resend | |
| 验证码已发送 | Code sent | |
| 请输入邮箱 | Enter your email | |
| 请输入 6 位验证码 | Enter the 6-digit code | |
| 登录 / 注册 | Sign In / Sign Up | |
| 登录成功 | Signed in | |
| 验证码错误或已过期 | Invalid or expired code | |
| 发送失败，请稍后重试 | Failed to send, try again later | |
| 或使用 | or continue with | 社交登录分隔 |
| 继续使用 Apple | Continue with Apple | Apple 官方规范文案（必须） |
| 继续使用 Google | Continue with Google | Google 官方规范文案（必须） |
| 7 天预报 | 7-Day Forecast | |
| 15 天趋势 | 15-Day Trend | |
| 降水 | Precipitation | |
| 日出 / 日落 | Sunrise / Sunset | |
| 月出 / 月落 | Moonrise / Moonset | |
| 台风 | Typhoon | 西北太平洋标准术语（不用 Hurricane） |
| 台风路径 | Typhoon Track | |
| 空气质量 | Air Quality / AQI | |
| 分享 | Share | |
| 点赞 | Like | |
| 评论 | Comment | |
| 发布 | Post / Publish | |
| 社区即将上线 | Community coming soon | |

---

## 七、既有 en.js 校准记录（2026-08-04）

按本词典对首轮 en.js 做的修订：

1. `metricCloud`: `Cloud` → `Cloud Cover`（云量 ≠ 云）
2. `tabs.profile`: `Me` → `Profile`（Apple 惯例）
3. `mwOffSeason`: `Off season` → `Out of Season`
4. `cityList.mySaved`: `Saved` → `Saved Locations`（AccuWeather 口径）
5. `cityList.title`: `Choose a city` → `Select City`
6. 全部 `KP` → `Kp`（NOAA 标准写法）：kpSubtitleLive / kpSubtitleFallback / kpNeedHigher / 首页 / 城市徽章
7. `profile.savedCities`: `Cities` → `Saved`
8. `hourlyTitle`: `Hourly forecast` → `Hourly Forecast`（Title Case）
9. `heroTitle`: `Can you see the aurora tonight?` → `Aurora tonight?`（短语化）
10. `notifDaily`: `Daily forecast` → `Daily Forecast Push`（与逐日预报区分）
11. `glow`: `Sky glow` → `Sky Glow`（Title Case）

> 后续每次校准在此追加记录，保持词典与代码同步。

---

## 八、已知未迁移项登记（2026-08-04 第二轮）

以下文本仍由数据层/mock 直接产出中文，界面切换英文时不翻译，待后续统一处理：

| 来源 | 内容 | 位置 |
|------|------|------|
| weatherService mock | AQI 分类（优/良/轻度污染…）、UV 等级与建议 | `services/weather/weatherService.js` |
| astronomyService | 月相 phaseName（满月/上弦…）、星座名 | `services/astronomyService.js` |
| qweatherService mock | 天气文本、风向、台风类型（真实 API 已随 `lang` 参数返回英文） | `services/weather/qweatherService.js` |
| 页面硬编码 | forecast 页城市名「北京」、AQI/UV catch 回退文案 | `app/(tabs)/forecast.jsx` |

处理原则：数据层文本在 service 输出时按 `useI18n.getState().lang` 映射（参照 qweatherService 的 `apiLang()` 模式），不在 UI 层硬翻。
