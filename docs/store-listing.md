# 商店上架文案（ROADMAP 2.5）

日期：2026-08-05 ｜ 语言：英文为主（出海），隐私政策 URL：https://play-weather-app.vercel.app/privacy-policy.html

## App Store（iOS）

**App Name（30 字符内）**
PlayWeather — Sky Moments

**Subtitle（30 字符内）**
Golden hour & aurora forecasts

**Promotional Text（170 字符内，可随时更新）**
Catch tonight's fiery sunset before it fades. PlayWeather predicts golden hour, sunrise/sunset glow, blue hour, aurora visibility and more — with smart reminders so you never miss the light.

**Keywords（100 字符，逗号分隔）**
sunset,sunrise,golden hour,blue hour,aurora,weather forecast,photography,milky way,sky,cloud sea

**Description**

Never miss the sky's best moments.

PlayWeather is the weather app built for photographers, stargazers and anyone who chases light. Beyond the forecast, it tells you *when the sky will be worth watching* — and reminds you before it happens.

TONIGHT'S SHOT, ONE GLANCE
A daily shooting-window card distills astronomy and weather into one actionable line: "Tonight 6:48–7:26 PM — 50% chance of sunset glow, visibility 30 km, face west." One tap sets a reminder 30 minutes before the window opens.

PHENOMENON FORECASTS
• Sunrise & sunset glow probability (epic / excellent / good / fair)
• Golden hour & blue hour countdowns
• Aurora visibility with real-time NOAA Kp index
• Milky Way, rainbow, sun halo, Tyndall light & cloud-sea conditions
• Moon phases and tonight's constellations

WEATHER, DONE RIGHT
• Hyperlocal current conditions, 24-hour and 7-day forecasts
• Air quality (US EPA standard) and UV index (WHO standard)
• Typhoon tracking on an interactive 3D globe
• Save favorite cities and sync them across devices

DESIGNED FOR THE NIGHT SKY
A deep-space dark theme that never blinds you in the field. Bilingual: 简体中文 and English.

Free. No ads. No tracking. Location is never requested — you pick every place yourself.

## Google Play（Android）

**Short description（80 字符）**
Golden hour, sunset glow & aurora forecasts with smart reminders

**Full description**：同 App Store Description（Play 支持 4000 字符，直接用）

**Tags/类别**：Weather ｜ 可选二级：Photography

## 截图素材清单（英文界面）

| # | 画面 | 说明 | 状态 |
|---|------|------|------|
| 1 | 首页 hero：今晚极光/晚霞卡片 + 拍摄窗口卡 | 主卖点「今晚拍什么」 | ✅ `store-assets/02-home-en.png` |
| 2 | 逐小时 + 7 天预报页 | 常规天气能力 | ✅ `store-assets/03-forecast-en.png` |
| 3 | 现象预报（霞光概率/蓝时刻倒计时） | 差异化功能 | 待截 |
| 4 | 3D 地球仪/台风 | 视觉亮点 | 待截 |
| 5 | 「我的」多语言与提醒设置 | 国际化+提醒 | ✅ `store-assets/04-profile-en.png`（未登录态） |

尺寸要求：iOS 6.7"（1290×2796）、6.5"（1242×2688）；Android 最小 1080px 宽、建议 1080×2340 起。
拍摄方式：WebBridge 模拟视口截图（CDP `Emulation.setDeviceMetricsOverride`，deviceScaleFactor=3），存 `store-assets/`。
