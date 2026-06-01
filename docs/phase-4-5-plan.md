# 玩天气 App Phase 4 & 5 计划

> 测试策略 + 上线清单 + 技术债务
> 
> 项目路径：`C:\Users\xiangyu\.easyclaw\workspace\play-weather-app`
> 
> 文档创建：2026-05-27

---

## 一、测试策略文档

### 1.1 功能测试清单

#### 📍 首页 (index.jsx)

| 功能模块 | 测试点 | 预期结果 | 优先级 |
|---------|--------|----------|--------|
| **3D 地球仪** | 地球仪渲染 | Three.js 地球正常显示，无黑屏/闪烁 | P0 |
| | 旋转控制 | 手动拖拽旋转流畅，自动旋转开关有效 | P0 |
| | 缩放交互 | 双指缩放响应正常，有最小/最大缩放限制 | P1 |
| | 平台兼容 | Web 端用 GlobeView.web.jsx，Native 用 GlobeView.optimized.jsx | P0 |
| **城市搜索** | 搜索输入 | 输入城市名后显示搜索结果列表 | P0 |
| | 结果展示 | 显示城市名、省份、国家信息 | P1 |
| | 选择城市 | 点击城市后更新天气数据，关闭搜索结果弹窗 | P0 |
| | 空搜索 | 清空输入后隐藏搜索结果 | P1 |
| **天气显示** | 实时天气 | 温度、体感温度、天气状况、风向风力正确显示 | P0 |
| | 背景主题 | 根据 selectedPhenomenon 切换背景色和光晕色 | P1 |
| | 数据加载 | 加载时显示 ActivityIndicator，失败时降级到 Mock 数据 | P0 |
| **现象切换** | 标签切换 | aurora/typhoon/cloud/glow/snow/rainbow 切换正常 | P1 |
| | 主题联动 | 切换后地球仪和背景色同步更新 | P1 |
| **台风功能** | 台风列表 | 显示当前活跃台风名称、强度 | P1 |
| | 台风路径 | 在地球仪上绘制台风路径轨迹 | P2 |
| | 详情面板 | 点击台风显示详细信息（气压、风速、移动速度） | P2 |

#### 📅 预报页 (forecast.jsx)

| 功能模块 | 测试点 | 预期结果 | 优先级 |
|---------|--------|----------|--------|
| **天气横幅** | 当前天气 | 显示实时温度、天气图标、城市名 | P0 |
| | 更新时间 | 显示数据更新时间 | P2 |
| **逐日卡片** | 7 天预报 | 显示 7 天最高/最低温度、天气状况 | P0 |
| | 日期格式 | 今天/明天显示文字，其余显示月/日和星期 | P1 |
| | 选中状态 | 点击卡片切换选中天，高亮显示 | P1 |
| | 温度曲线 | 显示 7 天温度变化趋势（如有） | P2 |
| **天文数据** | 日出日落 | 显示准确时间，基于城市经纬度计算 | P1 |
| | 月相显示 | 显示当前月相名称和图标 | P1 |
| | 黄金时刻 | 显示摄影黄金时刻、蓝色时刻时间 | P2 |
| **AQI/UV** | 空气质量 | 显示 AQI 指数、质量等级、首要污染物 | P1 |
| | 紫外线 | 显示 UV 指数、强度等级、防护建议 | P1 |
| | 数据降级 | API 失败时显示默认值（AQI:50, UV:3） | P1 |

#### 🏘️ 社区页 (community.jsx)

| 功能模块 | 测试点 | 预期结果 | 优先级 |
|---------|--------|----------|--------|
| **标签筛选** | 标签列表 | 显示全部/史诗级/优秀/良好/一般等标签 | P1 |
| | 筛选功能 | 点击标签后过滤对应等级的作品 | P1 |
| | 选中状态 | 选中标签高亮显示 | P1 |
| **瀑布流** | 布局显示 | 卡片错落排列，无明显空白 | P1 |
| | 图片加载 | 图片正常加载，失败显示占位图 | P1 |
| | 滚动性能 | 长列表滚动流畅，无明显卡顿 | P1 |
| **PhotoCard** | 用户信息 | 头像、昵称、位置、时间正确显示 | P1 |
| | 预报对比 | 显示预报概率 vs 实际概率 | P1 |
| | 等级标签 | 史诗级/优秀/良好/一般标签颜色区分 | P1 |
| | 互动功能 | 点赞数、评论数显示（暂不需要真实互动） | P2 |
| | 描述文本 | 显示用户拍摄描述 | P2 |

#### 👤 我的页 (profile.jsx)

| 功能模块 | 测试点 | 预期结果 | 优先级 |
|---------|--------|----------|--------|
| **用户信息** | 头像昵称 | 显示用户头像、昵称、等级 | P1 |
| | 统计数据 | 作品数、收藏数、粉丝数显示 | P2 |
| **收藏地点** | 地点列表 | 显示收藏的拍摄地点列表 | P1 |
| | 概率显示 | 每个地点显示拍摄成功概率和等级 | P1 |
| | 点击跳转 | 点击地点可跳转到对应位置天气 | P2 |
| **通知设置** | 总开关 | 通知总开关控制所有通知 | P1 |
| | 概率提醒 | 高概率拍摄机会提醒开关 | P1 |
| | 日报推送 | 每日天气预报推送开关 | P1 |
| | Switch 状态 | 开关状态持久化（需接入 AsyncStorage） | P2 |

---

### 1.2 多平台测试矩阵

#### Web 端测试

| 浏览器 | 版本 | 测试重点 |
|-------|------|---------|
| Chrome | 最新 2 个版本 | 地球仪 WebGL 渲染、性能 FPS |
| Safari | 最新 2 个版本 | iOS Safari 兼容性、触摸交互 |
| Firefox | 最新 2 个版本 | 备用浏览器兼容性 |
| Edge | 最新 2 个版本 | Chromium 内核验证 |

**Web 专项测试：**
- [ ] 地球仪在 WebGL 上下文下的渲染性能（目标：60 FPS）
- [ ] 响应式布局（桌面/平板/手机）
- [ ] PWA 功能（如配置）
- [ ] 浏览器后退/前进导航
- [ ] 页面刷新后状态保持

#### iOS 端测试

| 设备类型 | iOS 版本 | 测试重点 |
|---------|---------|---------|
| iPhone 15 Pro | iOS 17+ | 最新设备性能、灵动岛适配 |
| iPhone 12 | iOS 16+ | 主流设备兼容性 |
| iPhone SE | iOS 15+ | 小屏幕适配 |
| iPad Air | iPadOS 17+ | 平板布局适配 |

**iOS 专项测试：**
- [ ] 安全区域适配（刘海屏、动态岛）
- [ ] 手势返回导航
- [ ] 后台切换后状态恢复
- [ ] 深色模式自动切换（如支持）
- [ ] 通知权限请求

#### Android 端测试

| 设备类型 | Android 版本 | 测试重点 |
|---------|-------------|---------|
| Pixel 8 | Android 14 | 原生 Android 体验 |
| 小米 14 | Android 14 + MIUI | 国产 ROM 兼容性 |
| 三星 S24 | Android 14 + OneUI | 国际版 ROM |
| 低端机 | Android 11+ | 性能降级方案 |

**Android 专项测试：**
- [ ] 不同屏幕比例适配
- [ ] 物理返回键响应
- [ ] 后台进程管理（杀后台后恢复）
- [ ] 不同厂商推送服务兼容性
- [ ] 安装包大小（目标：<50MB）

---

### 1.3 性能基线

| 指标 | 目标值 | 测量方法 | 优先级 |
|-----|--------|---------|--------|
| **首屏加载 (Web)** | < 2s | Chrome DevTools Lighthouse | P0 |
| **首屏加载 (Native)** | < 1.5s | `react-native-performance` | P0 |
| **地球仪 FPS** | ≥ 50 FPS | `three.js` Stats.js | P0 |
| **Bundle 大小 (Web)** | < 2MB (gzip) | `source-map-explorer` | P1 |
| **App 包大小 (iOS)** | < 50MB | Xcode Archive | P1 |
| **App 包大小 (Android)** | < 50MB | APK Analyzer | P1 |
| **内存占用** | < 200MB | Xcode Instruments / Android Profiler | P1 |
| **API 响应时间** | < 3s (P95) | 日志记录 | P1 |
| **缓存命中率** | ≥ 80% | 缓存日志统计 | P2 |

**性能优化检查点：**
- [ ] 图片资源压缩（使用 WebP/AVIF）
- [ ] 代码分割（懒加载非首屏组件）
- [ ] 地球仪模型 LOD（多细节层次）
- [ ] 列表虚拟化（FlatList `getItemLayout`）
- [ ] 避免不必要的重渲染（`React.memo`、`useMemo`）

---

### 1.4 API 测试

#### 和风天气接口联通性

| 接口 | 端点 | 测试内容 | 缓存策略 |
|-----|------|---------|---------|
| **城市搜索** | `/geo/city` | 搜索中英文城市、模糊匹配 | 7 天 |
| **实时天气** | `/weather/now` | 获取当前天气数据 | 30 分钟 |
| **逐日预报** | `/weather/7d` | 获取 3/7/15 天预报 | 1 小时 |
| **逐小时预报** | `/weather/24h` | 获取 24-168 小时预报 | 30 分钟 |
| **空气质量** | `/indices/air` | 获取 AQI 及污染物数据 | 1 小时 |
| **紫外线** | `/indices/uv` | 获取 UV 指数及建议 | 1 小时 |
| **台风路径** | `/typhoon/list` | 获取活跃台风列表 | 1 小时 |

**测试用例：**
- [ ] 有效 API Key 正常返回
- [ ] 无效 API Key 返回错误码（非 200）
- [ ] 超链接请求（>10 次/分钟）触发限流处理
- [ ] 网络断开时降级到 Mock 数据
- [ ] 缓存命中时不发起网络请求
- [ ] 缓存过期后自动刷新

#### 缓存命中率测试

**测试方法：**
1. 首次加载城市天气 → 应发起 API 请求
2. 5 分钟内再次加载 → 应命中缓存（不发起请求）
3. 30 分钟后加载 → 应刷新缓存
4. 切换城市 → 新城市发起请求，旧城市缓存保留

**预期结果：**
- 城市搜索缓存命中率：≥90%（用户通常搜索相同城市）
- 实时天气缓存命中率：≥70%（30 分钟 TTL）
- 逐日预报缓存命中率：≥80%（1 小时 TTL）

---

## 二、上线清单

### 2.1 Web 部署方案

#### 推荐方案：Vercel（首选）

**优势：**
- ✅ 免费额度充足（100GB 带宽/月）
- ✅ 自动 CI/CD（Git 推送即部署）
- ✅ 全球 CDN 加速
- ✅ 自动 HTTPS
- ✅ 支持 Expo Web 输出

**部署步骤：**
```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 构建 Web 版本
npx expo export --platform web

# 4. 部署
vercel --prod
```

**配置要点：**
- `vercel.json` 配置 SPA 路由重写
- 环境变量：`QWEATHER_KEY` 在服务端配置
- 自定义域名（可选）：在 Vercel Dashboard 绑定

#### 备选方案：Cloudflare Pages

**优势：**
- ✅ 完全免费（无限带宽）
- ✅ 集成 Cloudflare 生态（Analytics、Workers）
- ✅ 支持 Git 自动部署

**部署步骤：**
```bash
# 1. 构建
npx expo export --platform web

# 2. 在 Cloudflare Dashboard 创建 Pages 项目
# 3. 连接 GitHub 仓库，设置构建命令：
#    Build command: npx expo export --platform web
#    Build output directory: dist
```

#### 备选方案：Netlify

**优势：**
- ✅ 免费额度充足
- ✅ 表单处理、函数计算
- ✅ 一键回滚

---

### 2.2 App 打包方案（EAS Build）

#### 前置准备

**1. 安装 EAS CLI**
```bash
npm install -g eas-cli
eas login
```

**2. 配置 EAS**
```bash
# 初始化 EAS 项目
eas build:configure

# 这会创建 eas.json 配置文件
```

**3. 准备图标资源**

需要生成的尺寸：
- **iOS**: 1024x1024 (App Store), 各种设备尺寸（@2x, @3x）
- **Android**: 512x512 (Play Store), 自适应图标前景/背景

使用工具：
```bash
# Expo 自动生成
npx expo-image optimize assets/icon.png
```

**4. 准备启动屏 (Splash)**

当前配置：`assets/splash.png`
- 推荐尺寸：1242x2436 (@3x)
- 背景色：`#DAA520`（已在 app.json 配置）

**5. 配置应用签名**

**iOS:**
```bash
# 在 Apple Developer 创建 App ID 和证书
# Bundle ID: com.playweather.app (已在 app.json 配置)
# EAS 自动管理证书（推荐）
eas build --platform ios --profile production
```

**Android:**
```bash
# 生成 Keystore（首次）
keytool -genkey -v -keystore play-weather.keystore -alias playweather -keyalg RSA -keysize 2048 -validity 10000

# 或在 EAS Dashboard 托管签名
eas build --platform android --profile production
```

#### EAS 构建配置示例 (eas.json)

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "platform": "android"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@apple.id",
        "ascAppId": "1234567890"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

#### 构建命令

```bash
# iOS 生产构建
eas build --platform ios --profile production

# Android 生产构建
eas build --platform android --profile production

# 查看构建状态
eas build:list

# 下载构建产物
eas build:download --platform ios --latest
```

---

### 2.3 ASO/上架文案

#### App 名称建议

| 方案 | 名称 | 副标题 | 适用场景 |
|-----|------|--------|---------|
| A | **玩天气** | 摄影师的观云指南 | 强调摄影场景 |
| B | **玩天气 · 追光** | 天文现象预报助手 | 强调天文特色 |
| C | **玩天气 Pro** | 3D 地球仪看全球天气 | 强调科技感 |

**推荐：方案 A** - 简洁易记，突出目标用户

#### 关键词 (Keywords)

**iOS App Store (100 字符限制):**
```
天气，摄影，天文，云海，日出，日落，月相，台风，空气质量，紫外线
```

**Google Play (短描述 80 字符):**
```
摄影师专属天气 App，3D 地球仪看全球云图、天文现象预报
```

#### 应用描述大纲

**短描述 (80 字符):**
> 为摄影师打造的天气 App，3D 地球仪实时查看全球云图、极光、台风路径，精准预报日出日落、黄金时刻、月相变化。

**完整描述 (4000 字符上限):**

```
【玩天气】—— 摄影师的观云指南

你是否为了拍日照金山却遇到满天云？
你是否错过极光爆发才看到别人朋友圈？
你是否在陌生的城市找不到最佳拍摄点？

玩天气，用 3D 地球仪和精准预报，帮你抓住每一个稍纵即逝的光影瞬间。

━━━━━━ 核心功能 ━━━━━━

🌍 3D 地球仪 · 全球云图一手掌握
- 实时查看全球云层分布、降水、气温
- 支持旋转、缩放、点击查询任意位置
- 台风路径实时追踪，提前规划拍摄计划

🌅 天文预报 · 不错过任何黄金时刻
- 精准日出日落时间（精确到分钟）
- 黄金时刻、蓝色时刻、天文曙暮光
- 月相月出月落，月相盈亏一目了然

🌌 特殊天象 · 极光、云海、彩虹全预测
- 极光 Kp 指数预报，追光必备
- 云海概率预测，拍山岳风光神器
- 彩虹、雾凇、朝霞晚霞概率提示

📍 拍摄地点 · 收藏你的机位
- 收藏常用拍摄点，快速查看天气
- 历史拍摄数据回顾，总结最佳时机
- 社区分享，看别人在哪里拍到好照片

🔔 智能提醒 · 高概率自动推送
- 拍摄概率超过 80% 自动提醒
- 台风临近预警
- 自定义提醒阈值

━━━━━━ 适用人群 ━━━━━━

✓ 风光摄影师
✓ 户外爱好者
✓ 天文爱好者
✓ 旅行者
✓ 任何喜欢抬头看天的人

━━━━━━ 技术亮点 ━━━━━━

- 和风天气官方数据源，准确可靠
- 自研天文算法，计算精确到秒
- 毛玻璃深色主题，夜间使用不刺眼
- 离线缓存，无网也能看基础数据

━━━━━━ 联系我们 ━━━━━━

问题反馈：playweather@example.com
用户群：扫码加入玩天气摄影交流群

━━━━━━ 订阅说明 ━━━━━━

基础功能永久免费
Pro 会员（开发中）：解锁更多高级功能

━━━━━━

下载玩天气，让每一次拍摄都不留遗憾！
```

---

### 2.4 监控方案

#### 错误收集：Sentry（推荐）

**优势：**
- ✅ 免费额度充足（5 万 errors/月）
- ✅ 支持 React Native + Web
- ✅ 自动捕获 JS 错误、网络错误
- ✅ 用户行为追踪（Breadcrumb）
- ✅ 性能监控（APM）

**集成步骤：**
```bash
# 安装 Sentry SDK
npm install @sentry/react-native

# 初始化配置
# 在 App.jsx 或入口文件添加：
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: __DEV__ ? "development" : "production",
  tracesSampleRate: 0.1, // 10% 性能采样
});
```

**配置要点：**
- 区分环境（development/production）
- 启用 Source Map 上传（定位错误行号）
- 设置错误采样率（避免过量上报）
- 过滤敏感信息（用户位置、API Key）

#### 自建监控方案（备选）

如果不想依赖第三方服务，可以自建简单监控：

**方案架构：**
```
App → 错误日志 → AsyncStorage 缓存 → 定时上报 → 自建 Server → Dashboard
```

**优点：** 数据完全自控
**缺点：** 需要维护服务器、开发成本高

**推荐：** 初期用 Sentry，日活过 10 万后再考虑自建

---

#### 性能监控

**Web 端：**
- Google Analytics 4 + Web Vitals
- 指标：LCP、FID、CLS、FCP

**Native 端：**
- `react-native-performance` 监控启动时间
- 自定义性能埋点（地球仪 FPS、API 响应时间）

**关键指标埋点示例：**
```javascript
// 地球仪 FPS 监控
import Stats from 'three/examples/jsm/libs/stats.module';
const stats = new Stats();
stats.showPanel(0); // FPS
document.body.appendChild(stats.dom);

function animate() {
  stats.begin();
  // render...
  stats.end();
  requestAnimationFrame(animate);
}
```

---

## 三、已知技术债务

### 3.1 TODO/FIXME/HACK 清单

通过全项目搜索，发现以下待处理注释：

| 文件 | 行号 | 类型 | 内容 | 优先级 |
|-----|------|------|------|--------|
| `services/weatherService.ts` | 19 | TODO | 替换为实际 API Key | P0 |
| `config/apiKeys.js` | 8 | 注意 | 测试用 API Key，上线前需确认 | P0 |

**详细说明：**

#### 1. API Key 占位符问题

**位置：** `services/weatherService.ts:19`
```typescript
const QWEATHER_CONFIG = {
  key: 'YOUR_API_KEY', // TODO: 替换为实际 API Key
  lang: 'zh',
  type: 'weather'
};
```

**现状：**
- 实际使用的是 `config/apiKeys.js` 中的 Key
- `weatherService.ts` 是旧文件，可能已不再使用

**建议操作：**
1. 确认 `weatherService.ts` 是否还在使用
2. 如不使用，删除该文件或标记为 `deprecated`
3. 如使用，统一从 `config/apiKeys.js` 导入 Key

**修复方案：**
```typescript
// 修改 weatherService.ts
import { QWEATHER_KEY, API_CONFIG } from '../config/apiKeys';

const QWEATHER_CONFIG = {
  key: QWEATHER_KEY,
  lang: API_CONFIG.lang,
  type: 'weather'
};
```

#### 2. 测试 API Key 风险

**位置：** `config/apiKeys.js`
```javascript
export const QWEATHER_KEY = '4a7be37b85a141c182dd7ec8c8a412e3';
```

**风险：**
- Key 已硬编码在代码中
- 提交到 Git 可能泄露
- 和风天气免费额度有限（每天 3000 次调用）

**建议操作：**
1. 将 `apiKeys.js` 加入 `.gitignore`
2. 保留 `apiKeys.example.js` 作为模板
3. 使用环境变量管理 Key（EAS 环境变量）

**修复方案：**
```bash
# .gitignore
config/apiKeys.js
```

```javascript
// config/apiKeys.js
// 从环境变量读取（优先）或 fallback 到本地配置
export const QWEATHER_KEY = process.env.EXPO_PUBLIC_QWEATHER_KEY || '本地测试 Key';
```

```bash
# EAS 环境变量配置
eas env:push --environment production
# 在 Dashboard 设置 EXPO_PUBLIC_QWEATHER_KEY
```

---

### 3.2 其他潜在技术债务

基于代码审查发现的潜在问题：

| 问题 | 位置 | 影响 | 建议 |
|-----|------|------|------|
| **Mock 数据硬编码** | 多个页面组件 | 上线后需移除或降级逻辑 | 保留降级逻辑，但记录日志 |
| **固定城市 ID** | forecast.jsx | 始终显示北京天气 | 接入用户定位或选择的城市 |
| **社区数据 Mock** | community.jsx | 无真实用户内容 | 预留后端接口，先上静态数据 |
| **通知设置未持久化** | profile.jsx | 开关重启后丢失 | 接入 AsyncStorage |
| **地球仪性能优化** | components/globe/ | 低端机可能卡顿 | 增加画质选项、LOD |

---

## 四、上线前检查清单

### 4.1 代码层面

- [ ] 移除所有 `console.log`（或配置生产环境自动过滤）
- [ ] 确认所有 TODO 已处理或记录
- [ ] 运行 TypeScript 类型检查：`npx tsc --noEmit`
- [ ] 运行 ESLint 检查：`npx eslint .`
- [ ] 测试生产构建：`npx expo export --platform web`

### 4.2 配置层面

- [ ] `app.json` 版本号更新（version + build number）
- [ ] 隐私政策 URL 配置（如需要）
- [ ] 应用图标和启动屏确认
- [ ] 权限说明（定位、通知等）

### 4.3 测试层面

- [ ] 完成功能测试清单所有 P0/P1 项
- [ ] 完成性能基线测试
- [ ] 完成多平台兼容性测试
- [ ] 完成 API 限流和降级测试

### 4.4 上线层面

- [ ] Web 部署到 Vercel/Cloudflare
- [ ] iOS TestFlight 内部测试
- [ ] Android 内部测试轨道
- [ ] Sentry 监控配置完成
- [ ] 应用商店文案准备完成

---

## 五、后续迭代建议 (Phase 6+)

1. **用户系统**：登录注册、云端同步收藏地点
2. **真实社区**：用户上传图片、评论互动
3. **推送通知**：高概率拍摄机会自动提醒
4. **会员功能**：更长预报周期、更多天文数据
5. **AI 选片**：自动从相册识别风光照片并关联天气

---

> 文档结束
> 
> 下一步：按此计划执行测试，完成后进入 Phase 5 上线流程
