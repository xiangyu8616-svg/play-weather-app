# 玩天气 App — 预报页 & 社区页设计方案

> 版本：v1.0 | 日期：2026-05-27 | 作者：蒜泥味（Kimi K2.5/K2.6）

---

## 目录

1. [现有架构回顾](#1-现有架构回顾)
2. [预报页设计](#2-预报页设计)
3. [社区页设计](#3-社区页设计)
4. [与现有设计系统的契合度](#4-与现有设计系统的契合度)
5. [开发优先级](#5-开发优先级)
6. [附录：颜色速查表](#6-附录颜色速查表)

---

## 1. 现有架构回顾

### 1.1 技术栈总结

| 层 | 技术 |
|---|---|
| 框架 | Expo / React Native |
| 路由 | expo-router (file-based, `app/(tabs)/`) |
| 样式 | NativeWind (Tailwind CSS) + inline StyleSheet |
| 动画 | React Native Animated API |
| API | 和风天气 v7 (`devapi.qweather.com/v7`) |
| 状态 | React useState/useEffect + 自定义 cache 层 |
| 组件库 | @expo/vector-icons (Ionicons) |

### 1.2 已有可复用组件

| 组件 | 位置 | 用途 |
|---|---|---|
| `FadeInView` | `components/animations/` | 淡入+上移入场动画，支持 delay/duration |
| `WeatherCard` | `components/weather/` | 毛玻璃天气详情卡片（概率大数字+质量标签+详情） |
| `GlobeControls` | `components/globe/` | 底部控制面板（时间轴+现象筛选+视图控制） |
| `PhenomenonFilter` | `components/weather/` | 水平滚动的天气现象类型标签（浅色主题版） |
| `GlobeView` | `components/globe/` | 三平台 3D 地球仪（含 TyphoonTrack） |

### 1.3 关键设计约束

- **主色**：`#DAA520`（金色），从 `primary.500`
- **背景色**：`#0F0D1E`（深色紫调，`glass.bg`）
- **玻璃态**：`rgba(255,255,255,0.06)` 基底 + `rgba(255,255,255,0.08)` 边框
- **光晕**：`shadowColor` 带金色/现象色 glow 效果
- **字体层级**：`text-xxs`(10px) / `text-xs`(12px) / `text-sm`(14px) / `text-base`(16px) / `text-lg`(18px) / `text-xl`(20px) / `text-2xl`(24px) / `text-5xl`(48px)
- **现有预报页现状**：白底浅色主题，硬编码模拟数据（7天），已接入 AQI/UV/天文 API
- **现有社区页现状**：白底浅色主题，硬编码 4 条 Unsplash 帖子，硬编码标签

### 1.4 核心问题

两个页面目前都是**浅色主题（白底）**，与首页的深色毛玻璃风格严重不统一。需要全面重构为深色主题，同时保留现有功能逻辑。

---

## 2. 预报页设计

### 2.1 整体布局（从上到下）

```
┌─────────────────────────────────────┐
│  🌇 背景：深色渐变（glass.bg → glass.bg-light） │
│                                      │
│  ┌─── 顶部定位栏 ──────────────────┐   │
│  │  城市名 + 当前温度数字 + 天气图标  │   │
│  │  "北京市  24° ☁️ 多云"            │   │
│  │  切换城市 按钮                    │   │
│  └────────────────────────────────┘   │
│                                      │
│  ┌─── 横向逐日预报（玻璃卡片流）───┐   │
│  │ [今天] [明天] [后天] [周六]...    │   │
│  │  每个卡片：日期/图标/温度/降水/风  │   │
│  │  横向 ScrollView，一次可见 3-4 个 │   │
│  └────────────────────────────────┘   │
│                                      │
│  ┌─── 天文信息区块 ──────────────┐   │
│  │  日出日落 | 黄金/蓝色时刻 | 月相  │   │
│  └────────────────────────────────┘   │
│                                      │
│  ┌─── AQI + UV 横排双卡片 ──────┐   │
│  │  [空气质量 62 良] [紫外线 3 中等] │   │
│  └────────────────────────────────┘   │
│                                      │
│  ┌─── 选中日详情 ───────────────┐   │
│  │  体感温度 | 湿度 | 风力 | 能见度  │   │
│  │  气压 | UV | 降水概率 | 云量      │   │
│  └────────────────────────────────┘   │
│                                      │
│  ┌─── 生活指数 ─────────────────┐   │
│  │  穿衣 | 运动 | 洗车 | 钓鱼等     │   │
│  └────────────────────────────────┘   │
│                                      │
│  ┌─── 底部提示 ─────────────────┐   │
│  │  数据来源说明 & 更新频率          │   │
│  └────────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 2.2 组件树

```
ForecastScreen
├── ScrollView (flex:1, 深色背景渐变)
│   ├── CurrentWeatherBanner        ← 新增组件
│   │   ├── 城市名 + 坐标提示
│   │   ├── 大温度数字 (48px)
│   │   ├── 天气图标 + 描述
│   │   └── 切换城市按钮 (玻璃态)
│   │
│   ├── DailyForecastStrip          ← 新增组件
│   │   └── ScrollView (horizontal)
│   │       └── DailyForecastCard[] ← 新增组件，复用 FadeInView
│   │           ├── 日期/星期
│   │           ├── 天气图标 (Ionicons)
│   │           ├── 温度范围 (高/低)
│   │           ├── 降水概率 + 色条
│   │           └── 风力风向
│   │
│   ├── AstronomySection            ← 改造现有代码
│   │   ├── 日出日落 (SunTimes)
│   │   ├── 摄影时刻 (GoldenHour / BlueHour)
│   │   └── 月相显示 (MoonPhase + MoonTimes)
│   │
│   ├── AQI&UVRow                   ← 改造现有代码
│   │   ├── AQI 卡片
│   │   └── UV 卡片
│   │
│   ├── DayDetailSection            ← 改造现有代码
│   │   ├── 体感温度 / 湿度 / 风力 / 能见度 (2x2 grid)
│   │   ├── 气压 / 降水概率 / 云量 / UV (2x2 grid)
│   │   └── 生活指数 (flex-wrap 2列)
│   │
│   └── DisclaimerFooter            ← 改造现有代码
│       └── 数据来源 & 更新频率说明
```

### 2.3 各区块视觉规范

#### 2.3.1 CurrentWeatherBanner

- **容器**：无边框全宽 padding px-5 pt-12 pb-6，顶部留出 SafeArea + 视觉呼吸空间
- **背景**：父级渐变 `#0F0D1E → #1A1735`
- **城市名**：`text-white text-2xl font-bold`
- **温度数字**：`text-7xl font-bold`，颜色根据温度渐变 `#DAA520`（暖）→ `#87CEEB`（冷）
- **天气图标**：Ionicons 48px，色值 `#FDB813`（太阳）/ `#DAA520`（多云）/ `#87CEEB`（雨）
- **切换城市按钮**：
  - `rounded-2xl px-4 py-2`
  - 背景：`rgba(255,255,255,0.08)`，边框：`rgba(255,255,255,0.1)`
  - 文字：`text-white/70 text-sm`

#### 2.3.2 DailyForecastStrip（横向卡片流）

- **容器**：px-5 py-4
- **标题**："逐日预报" / "15天趋势" → `text-white/80 text-base font-semibold`
- **卡片容器**：横向 ScrollView，snapToInterval，一次显示约 3.3 个卡片
- **DailyForecastCard**（每个卡片）：
  - 尺寸：宽约 `width * 0.28`（约 100px），高约 160px
  - 背景：`rgba(255,255,255,0.06)`
  - 边框：`rgba(255,255,255,0.08)`，圆角 `rounded-2xl`
  - 阴影：`shadowColor: '#DAA520', shadowOpacity: 0.1, shadowRadius: 8`
  - **选中态**：
    - 边框色变为 `rgba(218,165,32,0.3)`
    - 背景变为 `rgba(218,165,32,0.12)`
    - 额外金色发光 `shadowOpacity: 0.2`
  - 内部布局（垂直排列，间距均匀）：
    ```
    ┌─────────────┐
    │   今天       │  ← text-xs text-white/70
    │   5/27      │  ← text-xxs text-white/40
    │    🌤️       │  ← Ionicons 28px
    │   多云       │  ← text-xs text-white/50
    │  24° 15°   │  ← text-sm font-bold text-white
    │  ━━━━━ 30%  │  ← 降水概率色条 + 数字
    │  🌬️ 北风3级 │  ← text-xxs text-white/40
    └─────────────┘
    ```
  - **降水色条**：`height: 3px, borderRadius: 2px`，颜色由 `getRainColor()` 动态计算
  - **入场动画**：FadeInView 包裹，stagger 50ms

#### 2.3.3 AstronomySection（天文信息）

- **整体容器**：mx-5 my-3
- **卡片**：同 WeatherCard 风格
  - 背景：`rgba(15,13,30,0.92)`
  - 边框：`rgba(255,255,255,0.06)`
  - 圆角：`rounded-2xl`，padding p-4
- **子区块（用分隔线分隔）**：
  1. **日出日落** → 横排 3 列：日出时间 / 日落时间 / 日照时长
  2. **摄影时刻** → 横排 2 列 × 2 行：早晨黄金时刻 / 傍晚黄金时刻 | 早晨蓝色时刻 / 傍晚蓝色时刻
  3. **月相** → 横排：月相图标(40px) + 名称 + 月龄 | 亮度% | 月出 | 月落
- **分隔线**：`borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)'`，mx-2

#### 2.3.4 AQI&UVRow

- **容器**：flex-row，mx-5 my-3，gap-3
- **每个卡片**：
  - flex-1，rounded-2xl p-4
  - 背景色：各自颜色的低透明度版本（如 `#52C41A15`、`#DAA52015`）
  - 边框：`rgba(对应颜色, 0.2)`
  - 内部：图标(20px) + 标题(text-xs) | 大数字(3xl) | 等级(text-sm) | 详细描述(text-xxs)

#### 2.3.5 DayDetailSection

- **容器**：mx-5 my-3
- **卡片**：同玻璃态，rounded-2xl p-5
- **2x4 Grid**（使用 flexWrap）：
  - 每项：flexBasis '25%'（4列）或 '33%'（3列），items-center
  - 图标 28px（圆形背景 44px）+ 标签(text-xxs) + 值(text-base font-bold)
  - 颜色：图标色根据类型定制（温度 `#FF6B35`、湿度 `#4B5563`、风力 `#0EA5E9` 等）
- **生活指数**：borderTop 分隔后，flexWrap 2列

#### 2.3.6 兼容浅色模式

当前页仍有大量浅色主题代码。需要整体切换：

| 原值 | 新值 |
|---|---|
| `bg-white` / `bg-gray-50` | `bg-glass-bg` 即 `#0F0D1E` |
| `text-gray-800` | `text-white/85` |
| `text-gray-700` | `text-white/60` |
| `text-gray-500` | `text-white/40` |
| `bg-gray-100` | `rgba(255,255,255,0.05)` |
| `border-gray-100` | `rgba(255,255,255,0.06)` |
| `shadow-sm` | `shadow-glass-sm` |
| `bg-primary-50` | `rgba(218,165,32,0.12)` |
| `text-primary-600` | `text-primary-400`（即 `#EEB82A`） |
| `bg-blue-50` | `rgba(59,130,246,0.1)` |
| `text-blue-800` / `text-blue-700` | `text-blue-300` / `text-blue-400` |

### 2.4 数据需求

| 数据 | 来源 | 字段 | 缓存策略 |
|---|---|---|---|
| 城市列表 | `searchLocation()` | `id, name, lat, lon` | 24h |
| 实时天气 | `getRealTimeWeather()` | `temp, text, icon, feelsLike` | 30min |
| 逐日预报 | `getDailyForecast(id, 15)` | `fxDate, tempMax, tempMin, textDay, iconDay, humidity, precip, pressure, vis, windDirDay, windScaleDay, windSpeedDay, uvIndex` | 1h |
| AQI | `getAQI()` | `aqi, category, primaryPollutant` | 1h |
| UV | `getUVIndex()` | `uvIndex, level, advice` | 1h |
| 天文 | `astronomyService.getSunTimes()` | `sunrise, sunset` | - |
| 天文 | `astronomyService.getMoonPhase()` | `phaseName, age, illumination` | - |
| 天文 | `astronomyService.getMoonTimes()` | `moonrise, moonset` | - |
| 天文 | `astronomyService.getPhotographyTimes()` | `goldenHourMorning/Evening, blueHourMorning/Evening` | - |
| 生活指数 | `getIndices()` | `穿衣、运动、洗车、钓鱼、感冒、紫外线` 等 | 1h |

### 2.5 交互设计

1. **点击逐日卡片** → 选中并高亮，底部 DayDetailSection 内容随之切换
2. **下拉刷新** → 重新加载所有 API 数据
3. **切换城市按钮** → 打开城市选择搜索弹窗（可复用首页搜索栏逻辑）
4. **支持模态滑动** → 使用 react-native-reanimated 或内置 ScrollView 平滑滚动
5. **加载态** → ActivityIndicator 金色 `#DAA520`，配合半透明遮罩

---

## 3. 社区页设计

### 3.1 整体布局

```
┌─────────────────────────────────────┐
│  🌃 背景：深色渐变                    │
│                                      │
│  ┌─── 顶部栏 ───────────────────┐   │
│  │  🔍 搜索栏（玻璃态）  📷 发布  │   │
│  └───────────────────────────────┘   │
│                                      │
│  ┌─── 标签筛选栏 ───────────────┐   │
│  │ [全部][梅里雪山][贡嘎][珠峰]...  │   │
│  └───────────────────────────────┘   │
│                                      │
│  ┌─── 瀑布流 Feed ─────────────┐   │
│  │  ┌──────┐  ┌──────┐          │   │
│  │  │ 照片  │  │ 照片  │          │   │
│  │  │ 卡片  │  │ 卡片  │          │   │
│  │  └──────┘  │      │          │   │
│  │  ┌──────┐  └──────┘          │   │
│  │  │ 照片  │  ┌──────┐          │   │
│  │  │ 卡片  │  │ 照片  │          │   │
│  │  └──────┘  │ 卡片  │          │   │
│  │            └──────┘          │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌─── 发布按钮（悬浮 FAB）──────┐   │
│  │       📷 分享实拍              │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 3.2 组件树

```
CommunityScreen
├── View (flex:1, 深色背景渐变)
│   ├── CommunityHeader              ← 新增组件
│   │   ├── SearchBar (玻璃态)
│   │   └── PostButton (圆形拍照按钮)
│   │
│   ├── TagFilter                   ← 改造现有标签栏
│   │   └── ScrollView (horizontal)
│   │       └── TagPill[] (玻璃态 pill)
│   │
│   └── MasonryFeed                  ← 新增组件（核心）
│       └── MasonryFlashList / 双列 ScrollView
│           └── PhotoCard[]          ← 新增组件，复用 FadeInView
│               ├── 照片区域（占位或真图）
│               ├── 用户头像 + 名称
│               ├── 地点 + 时间
│               ├── 预报 vs 实拍对比条
│               ├── 描述文字
│               └── 互动栏（点赞/评论/分享）
│
├── FloatingActionButton             ← 新增组件
│   └── TouchableOpacity (玻璃态圆形)
```

### 3.3 各组件视觉规范

#### 3.3.1 CommunityHeader

- **背景**：父级渐变顶部延伸，SafeArea padding pt-12
- **容器**：flex-row，px-5 py-3
- **搜索栏**：
  - flex-1，rounded-2xl px-4 py-3
  - 背景：`rgba(255,255,255,0.06)`，边框：`rgba(255,255,255,0.08)`
  - 左侧放大镜 Icon（20px，`text-white/35`）+ 占位文字（`text-white/35 text-sm`："搜索用户/地点/标签"）
  - 金色边缘光：shadowColor `#DAA520`，shadowOpacity 0.15
- **发布按钮**：
  - 宽高 48px，rounded-2xl
  - 背景：`rgba(218,165,32,0.15)`，边框：`rgba(218,165,32,0.25)`
  - 内嵌相机 Icon（24px，`#DAA520`）

#### 3.3.2 TagFilter（标签筛选栏）

- **容器**：px-5 py-3，横向 ScrollView
- **TagPill**（每个标签）：
  - rounded-full px-4 py-2
  - **未选中**：背景 `rgba(255,255,255,0.05)`，边框 `rgba(255,255,255,0.06)`，文字 `text-white/50`
  - **选中**：背景 `rgba(218,165,32,0.18)`，边框 `rgba(218,165,32,0.3)`，文字 `#E8C547`，带金色发光 shadow
  - 字号 `text-xs font-semibold`

#### 3.3.3 MasonryFeed（瀑布流）

- **Phase 1**：用双列 ScrollView 实现（模拟数据）
  - 左列 / 右列各一个 ScrollView，同步滚动
  - 卡片高度自适应（不同图片比例导致不同高度）
- **Phase 2**：切换为 `@shopify/flash-list` 的 MasonryFlashList（真实数据 + 性能）
- **间距**：列间距 8px，卡片垂直间距 8px
- **整体 padding**：px-4

#### 3.3.4 PhotoCard（照片卡片）

这是社区页的核心构建块。每个卡片包含：

```
┌─────────────────────────┐
│  📷 照片区域              │  ← 高度自适应（120-280px），rounded-t-xl
│      (Unsplash 占位)     │
├─────────────────────────┤
│  👤 用户头像+名称         │  ← 32px 圆形头像 + text-sm font-bold text-white
│  📍 地点 · 时间          │  ← text-xxs text-white/35，FlexRow
├─────────────────────────┤
│  预报 65% → 实拍 80%     │  ← 玻璃态对比条（含进度条动画）
│  [优秀]                   │  ← 质量标签 pill
├─────────────────────────┤
│  "云量比预报多一点..."    │  ← text-xs text-white/55，最多3行
├─────────────────────────┤
│  ❤️ 128  💬 23  📤 分享  │  ← 互动栏，text-xs text-white/40
└─────────────────────────┘
```

**视觉细节**：
- 卡片整体：
  - 背景：`rgba(255,255,255,0.05)`
  - 边框：`rgba(255,255,255,0.06)`
  - 圆角：`rounded-2xl`
  - 阴影：shadow-glass-sm
- 照片区：
  - `width: 100%`，`borderTopLeftRadius: 16, borderTopRightRadius: 16`
  - 渐变底部遮罩：背景从透明到 `rgba(0,0,0,0.5)` 覆盖底部 40%
- 预报 vs 实拍对比条：
  - 背景：`rgba(218,165,32,0.08)`，rounded-lg p-2
  - 左侧 label "预报"（`text-xxs text-white/40`）+ 数字（`text-sm font-bold text-primary-400`）
  - 中间箭头 Icon
  - 右侧 label "实拍" + 数字（绿色 `#52C41A` 系列）
  - 底部进度条：`height: 4px, borderRadius: 2px`，背景 `rgba(255,255,255,0.08)`，填充色根据实拍概率 `getProbabilityColor()`
- 质量标签：
  - rounded-full px-2 py-0.5
  - 背景：`getProbabilityColor() + '18'`
  - 边框：`getProbabilityColor() + '30'`
  - 文字：`getProbabilityColor()`，text-xxs font-bold
- 互动栏：
  - borderTop `rgba(255,255,255,0.04)` 分隔
  - 三项均匀分布（space-between）
  - 每项：Icon(18px, `text-white/35`) + 数字(`text-xs text-white/35`)

#### 3.3.5 FloatingActionButton（悬浮发布按钮）

- **位置**：absolute，bottom-24（留出 TabBar 高度），right-5
- **样式**：
  - 宽高 56px，rounded-full
  - 背景：`#DAA520`
  - 阴影：shadowColor `#DAA520`，shadowOpacity 0.4，shadowRadius 12
  - 内嵌相机 Icon（28px，白色）
- **点击**：跳转到发布页（Phase 2）

### 3.4 颜色系统切换（浅→深）

社区页当前全部使用浅色主题，需全面替换：

| 原值 | 新值 |
|---|---|
| `bg-gray-50` (根容器) | 深色渐变 `#0F0D1E → #1A1735` |
| `bg-white` (卡片/标签栏/顶部栏) | `#0F0D1E` 或透明 |
| `text-gray-800` | `text-white/85` |
| `text-gray-700` | `text-white/60` |
| `text-gray-500/600` | `text-white/40` |
| `text-gray-400` | `text-white/30` |
| `bg-gray-100` | `rgba(255,255,255,0.05)` |
| `bg-primary-500` | `rgba(218,165,32,0.18)` |
| `text-primary-600` | `text-primary-400`（`#EEB82A`）|
| `border-gray-100` | `rgba(255,255,255,0.06)` |
| `shadow-sm` | `shadow-glass-sm` |
| `bg-gradient-to-r from-primary-50 to-white` | `rgba(218,165,32,0.08)` |
| `text-green-600` | `#52C41A` 明亮版 |

### 3.5 数据需求

**Phase 1（静态占位）**：
- 至少 8-12 条模拟帖子，覆盖不同照片比例（16:9、4:3、1:1、3:4）
- 至少 4-5 个不同地点（梅里雪山、贡嘎、南迦巴瓦、珠峰、稻城）
- Unsplash 占位 URL → 改为使用 `picsum.photos`（支持指定尺寸，更可控）或保留 Unsplash source API
- 模拟标签：`['全部', '梅里雪山', '贡嘎', '南迦巴瓦', '珠穆朗玛', '稻城三神山', '四姑娘山', '黄山']`

**Phase 2（真实数据）**：
- 后端 API 需提供：
  - `GET /api/posts?tag=xxx&page=1&limit=20` → 帖子列表
  - `GET /api/posts/:id` → 帖子详情（含评论）
  - `POST /api/posts` → 创建帖子
  - `POST /api/posts/:id/like` → 点赞
  - 帖子结构：`{ id, userId, userName, userAvatar, location, weatherType, forecastProb, actualScore, level, imageUrl, description, likes, comments, createdAt }`

---

## 4. 与现有设计系统的契合度

### 4.1 统一核心视觉语言

| 设计元素 | 首页 | 预报页 | 社区页 | 一致性 |
|---|---|---|---|---|
| 深色渐变背景 | ✅ `#0F0D1E→#1A1735` | ✅ 同左 | ✅ 同左 | ✅ |
| 玻璃态卡片 | ✅ `rgba(255,255,255,0.06)` | ✅ 同左 | ✅ 同左 | ✅ |
| 金色主色 | ✅ `#DAA520` | ✅ 同左 | ✅ 同左 | ✅ |
| 金色光晕 | ✅ shadow 脉动动画 | ✅ 选中卡片发光 | ✅ FAB 发光 | ✅ |
| 毛玻璃边框 | ✅ `rgba(255,255,255,0.08)` | ✅ 同左 | ✅ 同左 | ✅ |
| 入场动画 | ✅ FadeInView | ✅ FadeInView (卡片) | ✅ FadeInView (卡片) | ✅ |
| 现象色彩系统 | ✅ 极光紫/台风红/云海蓝 | ✅ AQI/UV 色 | ✅ 概率色 + 质量标签色 | ✅ |

### 4.2 组件复用矩阵

| 组件 | 首页 | 预报页 | 社区页 |
|---|---|---|---|
| `FadeInView` | ✅ GlobeControls | ✅ DailyForecastCard[] | ✅ PhotoCard[] |
| `WeatherCard` | ✅ 浮动详情卡 | 🔄 可改造为 DayDetail | ❌ |
| 玻璃态搜索栏 | ✅ 首页顶栏 | ✅ 切换城市触发 | ✅ CommunityHeader |
| 标签 pill 系统 | ✅ GlobeControls | ❌ | ✅ TagFilter |
| 光晕阴影系统 | ✅ orb-colors | ✅ 选中卡片 | ✅ FAB |
| hexToRgb 工具 | ✅ 全局使用 | ✅ 全局使用 | ✅ 全局使用 |
| `getProbabilityColor()` | ❌ | ✅ (从 WeatherCard 导出) | ✅ (从 WeatherCard 导出) |

### 4.3 需要重构的组件

1. **`getProbabilityColor()`** → 从 WeatherCard.jsx 中提取为共享工具函数 `utils/colors.js`
2. **`hexToRgb()`** → 同上（首页已有重复定义）
3. **`PhenomenonFilter`** → 当前为浅色主题版，需新增深色主题变体或改造
4. **`TagPill`** → 从 GlobeControls 中提取为独立组件 `components/ui/GlassPill.jsx`

### 4.4 新组件清单

| 新组件 | 位置 | 用途 |
|---|---|---|
| `DailyForecastCard` | `components/weather/` | 逐日预报卡片 |
| `DailyForecastStrip` | `components/weather/` | 横向卡片流容器 |
| `PhotoCard` | `components/community/` | 社区瀑布流照片卡片 |
| `MasonryFeed` | `components/community/` | 双列瀑布流 |
| `TagFilter` | `components/community/` | 标签筛选栏（深色版） |
| `FloatingActionButton` | `components/community/` | 悬浮发布按钮 |
| `GlassCard` | `components/ui/` | 通用玻璃态卡片容器 |
| `GlassPill` | `components/ui/` | 通用玻璃态标签按钮 |

---

## 5. 开发优先级

### Phase 1：基础改造（1-2 天）

| 优先级 | 任务 | 工作量 | 说明 |
|---|---|---|---|
| P0 | **提取公共工具函数** | 0.5h | `getProbabilityColor()`, `hexToRgb()` → `utils/colors.js`，首页和 WeatherCard 同步引用 |
| P0 | **预报页：深色主题整体切换** | 2h | 全局翻色：bg-white→深色渐变、text-gray→text-white、边框→玻璃态边框 |
| P0 | **预报页：CurrentWeatherBanner** | 1h | 城市名+大温度数字+天气图标，顶部全宽不改现有代码结构 |
| P0 | **预报页：DailyForecastStrip** | 3h | 横向卡片流 + DailyForecastCard 组件，选中交互，数据绑定 |
| P1 | **社区页：深色主题切换** | 2h | 与预报页相同的颜色迁移方案 |
| P1 | **社区页：PhotoCard 组件** | 2h | 照片卡片 + 预报vs实拍对比条 + 互动栏 |
| P2 | **社区页：MasonryFeed** | 2h | 双列瀑布流（先用双 ScrollView 方案） |
| P2 | **社区页：TagFilter 深色版** | 1h | 标签筛选栏 |

### Phase 2：功能完善（2-3 天）

| 优先级 | 任务 | 工作量 | 说明 |
|---|---|---|---|
| P1 | **预报页：DayDetailSection 改造** | 1.5h | 将选中日详情从白底列表改为玻璃态 2x4 grid |
| P1 | **预报页：接入真实 API** | 2h | 将硬编码替换为 `getDailyForecast(15)`、`getIndices()` |
| P1 | **预报页：切换城市弹窗** | 2h | 复用首页搜索栏逻辑，调用 `searchLocation()` |
| P2 | **社区页：增加模拟数据** | 1h | 8-12 条帖子，不同图片比例，丰富标签 |
| P2 | **社区页：悬浮 FAB** | 0.5h | 发布按钮 + 发光动画 |
| P2 | **通用 GlassCard 组件** | 1h | 提取公共玻璃态容器，减少重复代码 |

### Phase 3：打磨上线（1-2 天）

| 优先级 | 任务 | 工作量 | 说明 |
|---|---|---|---|
| P2 | **下拉刷新（预报页）** | 1h | RefreshControl + 重新加载 API |
| P2 | **入场动画优化** | 1h | 卡片入场 stagger、FAB 弹跳动画 |
| P2 | **社区页详情弹窗** | 2h | 点击卡片 → 展开大图 + 评论列表（Phase 1 可为空态） |
| P3 | **性能优化** | 1h | 列表用 FlashList、图片懒加载 |
| P3 | **暗色模式适配** | 0.5h | 确保所有硬编码色值都能过渡 |

---

## 6. 附录：颜色速查表

### 6.1 主题色值速查

```js
// 背景系统
const BG = {
  deep: '#0F0D1E',       // glass.bg
  light: '#1A1735',      // glass.bg-light
  gradient: ['#0F0D1E', '#1A1735'],
};

// 玻璃态卡片
const GLASS = {
  bg: 'rgba(255,255,255,0.06)',
  hover: 'rgba(255,255,255,0.10)',
  border: 'rgba(255,255,255,0.08)',
  borderActive: 'rgba(218,165,32,0.25)',
};

// 文字系统
const TEXT = {
  primary: 'rgba(255,255,255,0.85)',    // 主文本
  secondary: 'rgba(255,255,255,0.55)',  // 次要文本
  dim: 'rgba(255,255,255,0.35)',     // 弱文本
};

// 主色系统
const PRIMARY = {
  500: '#DAA520',  // 主金色
  400: '#EEB82A',
  300: '#F4C84A',
};

// 功能色
const FUNC = {
  success: '#52C41A',
  warning: '#FAAD14',
  error: '#FF6B35',
  info: '#3B82F6',
};

// 概率色映射（用于 getProbabilityColor）
const PROBABILITY_COLORS = [
  { min: 80, color: '#FF6B35' },
  { min: 60, color: '#FFA500' },
  { min: 40, color: '#DAA520' },
  { min: 20, color: '#E8C547' },
  { min: 0,  color: '#9CA3AF' },
];

// AQI 色映射
const AQI_COLORS = [
  { min: 0,   color: '#52C41A' },  // 优
  { min: 51,  color: '#DAA520' },  // 良
  { min: 101, color: '#FFA500' },  // 轻度
  { min: 151, color: '#FF6B35' },  // 中度
  { min: 201, color: '#8B00FF' },  // 重度
  { min: 301, color: '#8B0000' },  // 严重
];

// UV 色映射
const UV_COLORS = [
  { min: 0,  color: '#52C41A' },
  { min: 3,  color: '#DAA520' },
  { min: 5,  color: '#FFA500' },
  { min: 8,  color: '#FF6B35' },
  { min: 11, color: '#8B00FF' },
];
```

### 6.2 圆角与阴影速查

| 名称 | 值 | 用途 |
|---|---|---|
| `rounded-xl` | 12px | 小卡片（DailyForecastCard、TagPill） |
| `rounded-2xl` | 16px | 中型卡片（WeatherCard、PhotoCard） |
| `rounded-3xl` | 20px | 大容器（GlobeControls） |
| `rounded-full` | 9999px | 标签/按钮/头像 |
| `shadow-glass-sm` | `0 4px 16px rgba(0,0,0,0.3)` | 通用卡片阴影 |
| `shadow-glass` | `0 8px 32px rgba(0,0,0,0.4)` | 弹窗/浮动层 |
| `shadow-gold` | `0 4px 20px rgba(218,165,32,0.25)` | 金色发光（FAB、选中卡片） |

### 6.3 API 数据字段 → UI 映射速查

| API 字段 | UI 位置 | 转换 |
|---|---|---|
| `DailyForecast.tempMax/tempMin` | 日卡片温度、当日详情 | 直接显示 `${max}° / ${min}°` |
| `DailyForecast.iconDay/textDay` | 日卡片图标+描述 | Ionicon `getWeatherIcon(condition)` |
| `DailyForecast.sunrise/sunset` | 天文区块 | `formatTime(date)` → `HH:MM` |
| `DailyForecast.humidity` | 详情区块 | `${val}%` |
| `DailyForecast.precip` | 日卡片降水+详情 | mm 或百分比（看 API 实际返回） |
| `DailyForecast.pressure` | 详情区块 | `${val} hPa` |
| `DailyForecast.vis` | 详情区块 | `${val} km` |
| `DailyForecast.windDirDay/windScaleDay` | 日卡片风力 | `${dir} ${scale}级` |
| `DailyForecast.uvIndex` | UV 卡片 | `getUvColor()` + 防护建议 |
| `AQIData.aqi` | AQI 卡片 | `getAqiColor()` + 等级标签 |
| `MoonPhase.phaseName/age/illumination` | 月相区块 | 图标 + 文字 + 亮度% |
| `PhotographyTimes.*` | 摄影时刻区块 | 时间格式化 + 持续分钟 |

---

*本文档为「玩天气」App 预报页和社区页的完整设计蓝本。后续开发请严格参照此文档的色彩系统、组件结构和交互规范，确保三个页面（首页、预报页、社区页）视觉风格完全统一。*