/**
 * qweatherService 测试脚本
 * 
 * 使用方法：
 * node services/__test_qweather.js
 */

// 模拟浏览器环境
global.fetch = require('node-fetch');

// 导入服务
import('./qweatherService.js').then(async ({ default: qweatherService }) => {
  console.log('=== 和风天气 API 测试 ===\n');

  try {
    // 1. 测试城市搜索
    console.log('1️⃣  测试城市搜索：北京');
    const cities = await qweatherService.searchCity('北京', 3);
    console.log('   结果:', JSON.stringify(cities, null, 2));
    console.log('   ✅ 城市搜索成功\n');

    // 2. 测试实时天气
    console.log('2️⃣  测试实时天气（北京 ID: 101010100）');
    const weather = await qweatherService.getNowWeather('101010100');
    console.log('   结果:', JSON.stringify(weather, null, 2));
    console.log('   ✅ 实时天气获取成功\n');

    // 3. 测试 3 天预报
    console.log('3️⃣  测试 3 天预报（北京）');
    const forecast = await qweatherService.getDailyForecast('101010100');
    console.log('   结果:', JSON.stringify(forecast, null, 2));
    console.log('   ✅ 3 天预报获取成功\n');

    // 4. 测试台风列表
    console.log('4️⃣  测试台风列表');
    const typhoons = await qweatherService.getTyphoonList('NP');
    console.log('   结果:', JSON.stringify(typhoons, null, 2));
    console.log('   ✅ 台风列表获取成功\n');

    // 5. 测试台风路径（如果有台风）
    if (typhoons.length > 0) {
      console.log(`5️⃣  测试台风路径（${typhoons[0].name}）`);
      const track = await qweatherService.getTyphoonTrack(typhoons[0].stormId);
      console.log('   结果:', JSON.stringify(track, null, 2));
      console.log('   ✅ 台风路径获取成功\n');
    } else {
      console.log('5️⃣  跳过台风路径测试（无活跃台风）\n');
    }

    console.log('=== 所有测试通过！✅ ===');
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error);
  }
}).catch(error => {
  console.error('导入模块失败:', error);
});
