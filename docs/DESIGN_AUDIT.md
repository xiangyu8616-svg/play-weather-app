# 设计一致性审计（ROADMAP 2.2）

日期：2026-08-05 ｜ 基准：`styles/designTokens.js` v2.0（天文台观测者主题，暗色优先）

## 审计范围

四个 Tab（index / forecast / community / profile）+ city-list + 共享 UI 组件（weather/、community/、auth/、PhotoTimingPanel、AstroPanel）。
globe/ 3D 场景色（地球、星空、台风路径渲染）属于可视化内容色，不纳入 UI 规范约束。

## 发现与修复

| # | 问题 | 位置 | 修复 |
|---|------|------|------|
| 1 | 玻璃卡片底色两派：`rgba(18,24,42,0.75)`（偏蓝，不在令牌）vs 令牌系 `rgba(18,18,26,...)` | community ×1、profile ×2 | 新增令牌 `Bg.glass = rgba(18,18,26,0.75)`，3 处统一 |
| 2 | 页面容器 `#0A0E17` 偏离 `Bg.primary #0B0B10` | community | 改用 `Bg.primary` |
| 3 | 红色两派：profile 退出按钮 `rgba(255,55,95,…)` vs `Accent.danger #FF4444` | profile | 统一为 danger 系 rgba |
| 4 | 绿色两派：`#30D158`（iOS 绿）vs `Accent.success #22C55E` | PhotoTimingPanel ×2、profile ×1 | 统一 `Accent.success` |
| 5 | 金色三派：`#FFD60A`、`#DAA520` vs `Accent.star #FFD700` | profile ×2 | 统一 `Accent.star` |
| 6 | 蓝时刻蓝 `#60A5FA` 5 处硬编码、未入令牌 | index ×3、forecast ×2 | 新增令牌 `Accent.blueHour`，全部替换 |
| 7 | 提醒按钮完成态 `#64FFDA`（另一种青）偏离 `Accent.aurora #00D4AA` | index | 改用 `auroraAlpha()` |

## 确认一致（无需改）

- 圆角：卡片 `Radius.lg/md`、头像/徽标 full 圆、2–5px 小装饰圆角，符合令牌分层
- 间距：四个 Tab 均使用 `Spacing.*`（4px 基准）
- 卡片描边：`Border.subtle` / `whiteAlpha(0.06–0.12)` 体系统一
- 危险横幅：`rgba(255,68,68,…)` 三处（index/forecast/profile）一致
- 时间轴蓝/金 alpha 变体（forecast）：色相与 `Accent.blueHour`/`Accent.star` 同源

## 遗留（接受现状）

- `city-list` 页渐变端色 `#0a1018`：与 `Bg.primary` 近似的刻意渐变，保留
- profile 设置行图标彩色（`#5B6CF9` 等）：装饰性图标色，保留多样性
- 白色文字 alpha 直写 `rgba(255,255,255,…)` vs `whiteAlpha()`（基于 #F8FAFC）：视觉差异可忽略，新代码优先用 `whiteAlpha()`
