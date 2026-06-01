# 和风天气 API 对接文档

## ✅ 已完成功能

### 1. 核心服务文件

- **`services/qweatherService.js`** - 和风天气 API 封装服务

### 2. 已实现的 API 接口

#### 2.1 城市搜索
```javascript
export async function searchCity(query, number = 5)
```
- **API**: `GET https://geoapi.qweather.com/v2/city/lookup`
- **参数**: 
  - `query`: 城市名称
  - `number`: 返回数量（默认 5）
- **返回**: 城市数组 `[{ name, id, lat, lon, adm1, adm2, country }]`
- **缓存**: 24 小时

#### 2.2 实时天气
```javascript
export async function getNowWeather(locationId)
```
- **API**: `GET https://devapi.qweather.com/v7/weather/now`
- **参数**: `locationId` - 城市 ID
- **返回**: 实时天气对象 `{ temp, feelsLike, icon, text, windDir, windScale, humidity, precip, pressure, vis, cloud, dew }`
- **缓存**: 30 分钟

#### 2.3 3 天预报
```javascript
export async function getDailyForecast(locationId)
```
- **API**: `GET https://devapi.qweather.com/v7/weather/3d`
- **参数**: `locationId` - 城市 ID
- **返回**: 3 天预报数组 `[{ fxDate, tempMax, tempMin, iconDay, textDay, windDirDay, windScaleDay, humidity, precip, uvIndex, sunrise, sunset }]`
- **缓存**: 1 小时

#### 2.4 台风列表
```javascript
export async function getTyphoonList(basin = 'NP')
```
- **API**: `GET https://devapi.qweather.com/v7/tropical/storm-list`
- **参数**: `basin` - 海域（默认 NP=西北太平洋）
- **返回**: 台风列表 `[{ stormId, name, basin, status, maxWindSpeed, minPressure }]`
- **缓存**: 1 小时

#### 2.5 台风路径
```javascript
export async function getTyphoonTrack(stormId)
```
- **API**: `GET https://devapi.qweather.com/v7/tropical/storm-track`
- **参数**: `stormId` - 台风 ID
- **返回**: 路径点数组 `[{ time, lat, lon, type, pressure, windSpeed, moveSpeed }]`
- **缓存**: 30 分钟

### 3. 功能特性

#### 3.1 缓存机制
- 使用 `services/cache.ts` 提供的缓存服务
- 支持内存 + AsyncStorage 双层缓存
- 不同数据类型使用不同 TTL：
  - 实时天气：30 分钟
  - 3 天预报：1 小时
  - 城市搜索：24 小时
  - 台风数据：30 分钟 -1 小时

#### 3.2 错误处理
- 网络错误 → 自动回退到 Mock 数据
- 配额超限 (402) → 使用缓存数据或 Mock 数据
- API 错误码 → 尝试使用旧缓存，失败则抛出错误

#### 3.3 Mock 数据回退
提供完整的 Mock 数据生成函数：
- `generateMockNowWeather()` - 生成实时天气
- `generateMockDailyForecast()` - 生成 3 天预报
- `generateMockTyphoonList()` - 生成台风列表
- `generateMockTyphoonTrack()` - 生成台风路径

#### 3.4 数据标准化
提供数据适配函数，将 API 返回数据转换为组件可用格式：
- `normalizeCityData()` - 标准化城市数据
- `normalizeNowWeather()` - 标准化实时天气
- `normalizeDailyForecast()` - 标准化预报数据
- `normalizeTyphoonList()` - 标准化台风列表
- `normalizeTyphoonTrack()` - 标准化台风路径

### 4. 首页对接

**`app/(tabs)/index.jsx`** 已完成以下功能：

#### 4.1 城市搜索
- ✅ 搜索栏改为可输入
- ✅ 调用 `searchCity` 搜索城市
- ✅ 显示搜索结果列表
- ✅ 点击城市切换天气数据

#### 4.2 实时天气显示
- ✅ 默认加载北京（101010100）天气
- ✅ 调用 `getNowWeather` 显示真实天气
- ✅ 显示温度、天气状况、风向风力
- ✅ 失败时自动使用 Mock 数据

#### 4.3 台风数据
- ✅ 加载台风列表
- ✅ 支持切换不同台风
- ✅ 显示台风路径数据
- ✅ 显示台风强度、位置信息

## 📦 使用示例

### 基本使用
```javascript
import { qweatherService } from '../../services/qweatherService';

// 1. 搜索城市
const cities = await qweatherService.searchCity('上海', 5);
const shanghai = cities.find(c => c.name === '上海');

// 2. 获取实时天气
const weather = await qweatherService.getNowWeather(shanghai.id);
console.log(`上海当前温度：${weather.temp}°C`);

// 3. 获取 3 天预报
const forecast = await qweatherService.getDailyForecast(shanghai.id);
forecast.forEach(day => {
  console.log(`${day.fxDate}: ${day.textDay}, ${day.tempMin}~${day.tempMax}°C`);
});

// 4. 获取台风列表
const typhoons = await qweatherService.getTyphoonList('NP');
if (typhoons.length > 0) {
  const track = await qweatherService.getTyphoonTrack(typhoons[0].stormId);
  console.log(`台风 ${typhoons[0].name} 路径点数：${track.length}`);
}
```

### 错误处理
```javascript
try {
  const weather = await qweatherService.getNowWeather('101010100');
  console.log('API 数据:', weather);
} catch (error) {
  console.error('获取天气失败:', error);
  // 服务会自动返回 Mock 数据，这里可以显示错误提示
}
```

## 🔧 配置说明

### API Key 配置
在 `config/apiKeys.js` 中配置：
```javascript
export const QWEATHER_KEY = '你的和风天气 API Key';
```

### 缓存配置
在 `config/apiKeys.js` 中配置缓存时间：
```javascript
export const CACHE_TTL = {
  realtime: 30 * 60 * 1000,      // 实时天气：30 分钟
  daily: 60 * 60 * 1000,         // 逐日预报：1 小时
  location: 7 * 24 * 60 * 60 * 1000, // 城市信息：7 天
};
```

## 🧪 测试

### 命令行测试
```bash
# 运行测试脚本
node services/__test_qweather.js
```

### Web 导出验证
```bash
npx expo export --platform web
```
✅ 已成功导出，无错误

## 📝 注意事项

1. **API Key**: 当前使用的是测试 Key `4a7be37b85a141c182dd7ec8c8a412e3`，正式上线前请替换
2. **配额限制**: 和风天气免费版有调用次数限制，注意监控配额使用情况
3. **缓存策略**: 合理设置缓存时间可以减少 API 调用，提高响应速度
4. **Mock 回退**: 即使 API 调用失败，应用也能正常运行（使用 Mock 数据）

## 🚀 后续优化建议

1. 添加 7 天、15 天长期预报支持
2. 添加逐小时预报功能
3. 添加空气质量 (AQI) 数据
4. 添加天气预警信息
5. 优化台风路径在地球仪上的可视化

---

**创建时间**: 2026-05-27  
**版本**: v1.0.0
