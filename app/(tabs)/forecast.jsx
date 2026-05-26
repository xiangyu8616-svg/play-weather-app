import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  astronomyService, 
  weatherService,
  cache 
} from '../../services';

/**
 * 预报页面 - 7 天天气趋势
 * 功能：
 * - 显示 7 天天气预报
 * - 温度曲线趋势
 * - 降水概率
 * - 风速风向
 * - 日出日落时间
 * - 黄金/蓝色时刻
 * - 月相显示
 * - AQI/紫外线指数
 */
export default function ForecastScreen() {
  // 当前选中的日期
  const [selectedDay, setSelectedDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [astronomyData, setAstronomyData] = useState(null);
  const [aqiData, setAqiData] = useState(null);
  const [uvData, setUvData] = useState(null);

  // 北京坐标（实际应从用户定位或选择的城市获取）
  const LOCATION = {
    lat: 39.9042,
    lng: 116.4074,
    cityId: '101010100', // 北京城市 ID
    name: '北京市'
  };

  // 模拟 7 天预报数据（后续替换为真实 API 数据）
  const forecastData = [
    { day: '今天', date: '4/17', high: 18, low: 8, condition: '晴', rain: 0, wind: '北风 3 级' },
    { day: '明天', date: '4/18', high: 20, low: 10, condition: '多云', rain: 10, wind: '东北风 2 级' },
    { day: '后天', date: '4/19', high: 22, low: 12, condition: '阴', rain: 30, wind: '东风 3 级' },
    { day: '周六', date: '4/20', high: 19, low: 11, condition: '小雨', rain: 80, wind: '东南风 4 级' },
    { day: '周日', date: '4/21', high: 17, low: 9, condition: '中雨', rain: 95, wind: '南风 3 级' },
    { day: '周一', date: '4/22', high: 21, low: 10, condition: '多云', rain: 20, wind: '西南风 2 级' },
    { day: '周二', date: '4/23', high: 23, low: 13, condition: '晴', rain: 5, wind: '西风 1 级' },
  ];

  // 加载天文数据和空气质量数据
  useEffect(() => {
    loadAstronomyData();
  }, []);

  async function loadAstronomyData() {
    try {
      setLoading(true);
      const now = new Date();
      
      // 并行加载所有数据
      const [sunTimes, moonPhase, moonTimes, photoTimes, aqi, uv] = await Promise.all([
        // 天文数据
        astronomyService.getSunTimes(now, LOCATION.lat, LOCATION.lng),
        astronomyService.getMoonPhase(now),
        astronomyService.getMoonTimes(now, LOCATION.lat, LOCATION.lng),
        astronomyService.getPhotographyTimes(now, LOCATION.lat, LOCATION.lng),
        // 空气质量
        weatherService.getAQI(LOCATION.cityId),
        weatherService.getUVIndex(LOCATION.cityId)
      ]);

      setAstronomyData({
        sunTimes,
        moonPhase,
        moonTimes,
        photoTimes
      });
      setAqiData(aqi);
      setUvData(uv);
    } catch (error) {
      console.error('加载天文数据失败:', error);
    } finally {
      setLoading(false);
    }
  }

  // 获取天气图标
  const getWeatherIcon = (condition) => {
    const icons = {
      '晴': 'sunny',
      '多云': 'partly-sunny',
      '阴': 'cloudy',
      '小雨': 'rainy',
      '中雨': 'rainy',
      '大雨': 'thunderstorm',
    };
    return icons[condition] || 'cloud';
  };

  // 获取降水概率颜色
  const getRainColor = (probability) => {
    if (probability >= 80) return '#FF6B35';
    if (probability >= 50) return '#FFA500';
    if (probability >= 20) return '#DAA520';
    return '#52C41A';
  };

  // 获取 AQI 颜色
  const getAqiColor = (aqi) => {
    if (aqi <= 50) return '#52C41A';
    if (aqi <= 100) return '#DAA520';
    if (aqi <= 150) return '#FFA500';
    if (aqi <= 200) return '#FF6B35';
    if (aqi <= 300) return '#8B00FF';
    return '#8B0000';
  };

  // 获取 UV 等级颜色
  const getUvColor = (uvIndex) => {
    if (uvIndex <= 2) return '#52C41A';
    if (uvIndex <= 4) return '#DAA520';
    if (uvIndex <= 6) return '#FFA500';
    if (uvIndex <= 8) return '#FF6B35';
    if (uvIndex <= 10) return '#8B00FF';
    return '#8B0000';
  };

  // 格式化时间
  const formatTime = (date) => {
    if (!date) return '--:--';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 获取月相图标
  const getMoonPhaseIcon = (phaseName) => {
    const icons = {
      '新月': 'moon-new',
      '蛾眉月': 'moon-waxing-crescent',
      '上弦月': 'moon-first-quarter',
      '盈凸月': 'moon-waxing-gibbous',
      '满月': 'moon-full',
      '亏凸月': 'moon-waning-gibbous',
      '下弦月': 'moon-last-quarter',
      '残月': 'moon-waning-crescent',
    };
    return icons[phaseName] || 'moon';
  };

  return (
    <ScrollView className="flex-1 bg-white">
      {/* 顶部当前位置 */}
      <View className="px-4 pt-12 pb-4 bg-gradient-to-b from-primary-500 to-primary-600">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-2xl font-bold">{LOCATION.name}</Text>
            <Text className="text-primary-100 text-sm mt-1">
              实时更新 • 数据来源：和风天气
            </Text>
          </View>
          <TouchableOpacity className="bg-white/20 px-4 py-2 rounded-full">
            <Text className="text-white font-medium">切换城市</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 天文数据卡片 */}
      {loading ? (
        <View className="p-4 items-center">
          <ActivityIndicator size="large" color="#DAA520" />
          <Text className="text-gray-500 mt-2">加载天文数据...</Text>
        </View>
      ) : astronomyData ? (
        <View className="px-4 py-4">
          <View className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <Ionicons name="sunny" size={24} color="#F59E0B" />
              <Text className="text-lg font-bold text-gray-800 ml-2">日出日落</Text>
            </View>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Ionicons name="arrow-up" size={20} color="#F97316" />
                <Text className="text-xs text-gray-500 mt-1">日出</Text>
                <Text className="text-lg font-bold text-gray-800">
                  {formatTime(astronomyData.sunTimes?.sunrise)}
                </Text>
              </View>
              <View className="items-center">
                <Ionicons name="arrow-down" size={20} color="#EF4444" />
                <Text className="text-xs text-gray-500 mt-1">日落</Text>
                <Text className="text-lg font-bold text-gray-800">
                  {formatTime(astronomyData.sunTimes?.sunset)}
                </Text>
              </View>
              <View className="items-center">
                <Ionicons name="time" size={20} color="#FBBF24" />
                <Text className="text-xs text-gray-500 mt-1">日照时长</Text>
                <Text className="text-lg font-bold text-gray-800">
                  {Math.round((astronomyData.sunTimes?.sunset - astronomyData.sunTimes?.sunrise) / 3600000)}小时
                </Text>
              </View>
            </View>
          </View>

          {/* 黄金时刻和蓝色时刻 */}
          <View className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <Ionicons name="camera" size={24} color="#F59E0B" />
              <Text className="text-lg font-bold text-gray-800 ml-2">摄影最佳时机</Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <View className="flex-1">
                <Text className="text-xs text-amber-700 font-medium">🌅 早晨黄金时刻</Text>
                <Text className="text-sm text-gray-700 mt-1">
                  {formatTime(astronomyData.photoTimes?.goldenHourMorning?.start)} - {formatTime(astronomyData.photoTimes?.goldenHourMorning?.end)}
                </Text>
                <Text className="text-xs text-gray-500">
                  持续{astronomyData.photoTimes?.goldenHourMorning?.duration}分钟
                </Text>
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-xs text-orange-700 font-medium">🌇 傍晚黄金时刻</Text>
                <Text className="text-sm text-gray-700 mt-1">
                  {formatTime(astronomyData.photoTimes?.goldenHourEvening?.start)} - {formatTime(astronomyData.photoTimes?.goldenHourEvening?.end)}
                </Text>
                <Text className="text-xs text-gray-500">
                  持续{astronomyData.photoTimes?.goldenHourEvening?.duration}分钟
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text className="text-xs text-blue-700 font-medium">🌆 早晨蓝色时刻</Text>
                <Text className="text-sm text-gray-700 mt-1">
                  {formatTime(astronomyData.photoTimes?.blueHourMorning?.start)} - {formatTime(astronomyData.photoTimes?.blueHourMorning?.end)}
                </Text>
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-xs text-indigo-700 font-medium">🌌 傍晚蓝色时刻</Text>
                <Text className="text-sm text-gray-700 mt-1">
                  {formatTime(astronomyData.photoTimes?.blueHourEvening?.start)} - {formatTime(astronomyData.photoTimes?.blueHourEvening?.end)}
                </Text>
              </View>
            </View>
          </View>

          {/* 月相显示 */}
          <View className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4">
            <View className="flex-row items-center mb-3">
              <Ionicons name="moon" size={24} color="#64748B" />
              <Text className="text-lg font-bold text-gray-800 ml-2">月相</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons 
                  name={getMoonPhaseIcon(astronomyData.moonPhase?.phaseName)} 
                  size={40} 
                  color="#475569" 
                />
                <View className="ml-3">
                  <Text className="text-base font-bold text-gray-800">
                    {astronomyData.moonPhase?.phaseName}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    月龄：{astronomyData.moonPhase?.age}天
                  </Text>
                </View>
              </View>
              <View className="items-center">
                <Text className="text-xs text-gray-500">亮度</Text>
                <Text className="text-lg font-bold text-gray-800">
                  {astronomyData.moonPhase?.illumination?.toFixed(0)}%
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-xs text-gray-500">月出</Text>
                <Text className="text-sm font-medium text-gray-700">
                  {formatTime(astronomyData.moonTimes?.moonrise)}
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-xs text-gray-500">月落</Text>
                <Text className="text-sm font-medium text-gray-700">
                  {formatTime(astronomyData.moonTimes?.moonset)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {/* AQI 和紫外线指数 */}
      {!loading && (aqiData || uvData) && (
        <View className="px-4 py-4">
          <View className="flex-row">
            {/* AQI 卡片 */}
            <View 
              className="flex-1 rounded-xl p-4 mr-2"
              style={{ backgroundColor: getAqiColor(aqiData?.aqi || 0) + '15' }}
            >
              <View className="flex-row items-center mb-2">
                <Ionicons name="cloud" size={20} color={getAqiColor(aqiData?.aqi || 0)} />
                <Text className="text-sm font-bold text-gray-700 ml-2">空气质量</Text>
              </View>
              <Text 
                className="text-3xl font-bold"
                style={{ color: getAqiColor(aqiData?.aqi || 0) }}
              >
                {aqiData?.aqi || '--'}
              </Text>
              <Text 
                className="text-sm font-medium mt-1"
                style={{ color: getAqiColor(aqiData?.aqi || 0) }}
              >
                {aqiData?.category || '--'}
              </Text>
              <Text className="text-xs text-gray-500 mt-2">
                首要污染物：{aqiData?.primaryPollutant || '--'}
              </Text>
            </View>

            {/* 紫外线卡片 */}
            <View 
              className="flex-1 rounded-xl p-4 ml-2"
              style={{ backgroundColor: getUvColor(uvData?.uvIndex || 0) + '15' }}
            >
              <View className="flex-row items-center mb-2">
                <Ionicons name="sunny-outline" size={20} color={getUvColor(uvData?.uvIndex || 0)} />
                <Text className="text-sm font-bold text-gray-700 ml-2">紫外线</Text>
              </View>
              <Text 
                className="text-3xl font-bold"
                style={{ color: getUvColor(uvData?.uvIndex || 0) }}
              >
                {uvData?.uvIndex || '--'}
              </Text>
              <Text 
                className="text-sm font-medium mt-1"
                style={{ color: getUvColor(uvData?.uvIndex || 0) }}
              >
                {uvData?.level || '--'}
              </Text>
              <Text className="text-xs text-gray-500 mt-2 line-clamp-2">
                {uvData?.advice || '--'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 7 天预报列表 */}
      <View className="px-4 py-6">
        <Text className="text-lg font-bold text-gray-800 mb-4">7 天预报</Text>
        
        {forecastData.map((item, index) => {
          const isSelected = selectedDay === index;
          
          return (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedDay(index)}
              className={`flex-row items-center justify-between p-4 mb-3 rounded-xl ${
                isSelected ? 'bg-primary-50 border-2 border-primary-500' : 'bg-gray-50 border-2 border-transparent'
              }`}
              activeOpacity={0.7}
            >
              {/* 日期 */}
              <View className="w-20">
                <Text className={`text-base font-bold ${isSelected ? 'text-primary-600' : 'text-gray-800'}`}>
                  {item.day}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">{item.date}</Text>
              </View>

              {/* 天气状况 */}
              <View className="flex-row items-center flex-1">
                <Ionicons 
                  name={getWeatherIcon(item.condition)} 
                  size={32} 
                  color={isSelected ? '#DAA520' : '#FDB813'} 
                />
                <Text className="ml-3 text-base text-gray-700">{item.condition}</Text>
              </View>

              {/* 温度 */}
              <View className="w-24 items-center">
                <Text className="text-lg font-bold text-gray-800">
                  {item.high}° / {item.low}°
                </Text>
              </View>

              {/* 降水概率 */}
              <View 
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: getRainColor(item.rain) + '20' }}
              >
                <Text 
                  className="text-sm font-medium"
                  style={{ color: getRainColor(item.rain) }}
                >
                  {item.rain}%
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 选中日期详情 */}
      <View className="px-4 py-6 bg-gray-50">
        <Text className="text-lg font-bold text-gray-800 mb-4">
          {forecastData[selectedDay].day}详情
        </Text>
        
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <View className="flex-row justify-between mb-4">
            <View className="items-center">
              <Ionicons name="thermometer" size={28} color="#FF6B35" />
              <Text className="text-sm text-gray-500 mt-2">体感温度</Text>
              <Text className="text-lg font-bold text-gray-800">
                {Math.round((forecastData[selectedDay].high + forecastData[selectedDay].low) / 2)}°
              </Text>
            </View>
            
            <View className="items-center">
              <Ionicons name="water" size={28} color="#4B5563" />
              <Text className="text-sm text-gray-500 mt-2">湿度</Text>
              <Text className="text-lg font-bold text-gray-800">65%</Text>
            </View>
            
            <View className="items-center">
              <Ionicons name="wind" size={28} color="#0EA5E9" />
              <Text className="text-sm text-gray-500 mt-2">风速</Text>
              <Text className="text-lg font-bold text-gray-800">{forecastData[selectedDay].wind}</Text>
            </View>
            
            <View className="items-center">
              <Ionicons name="eye" size={28} color="#10B981" />
              <Text className="text-sm text-gray-500 mt-2">能见度</Text>
              <Text className="text-lg font-bold text-gray-800">15km</Text>
            </View>
          </View>

          {/* 生活指数 */}
          <View className="border-t border-gray-100 pt-4">
            <Text className="text-sm font-bold text-gray-700 mb-3">💡 生活指数</Text>
            <View className="flex-row flex-wrap">
              <View className="w-1/2 mb-3">
                <Text className="text-xs text-gray-500">穿衣指数</Text>
                <Text className="text-sm text-gray-700 mt-1">舒适，建议穿薄外套</Text>
              </View>
              <View className="w-1/2 mb-3">
                <Text className="text-xs text-gray-500">紫外线指数</Text>
                <Text className="text-sm text-gray-700 mt-1">{uvData?.advice || '中等，注意防晒'}</Text>
              </View>
              <View className="w-1/2 mb-3">
                <Text className="text-xs text-gray-500">运动指数</Text>
                <Text className="text-sm text-gray-700 mt-1">适宜户外运动</Text>
              </View>
              <View className="w-1/2 mb-3">
                <Text className="text-xs text-gray-500">洗车指数</Text>
                <Text className="text-sm text-gray-700 mt-1">较适宜</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 底部提示 */}
      <View className="px-4 py-6">
        <View className="bg-blue-50 rounded-xl p-4">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <View className="ml-3 flex-1">
              <Text className="text-sm font-bold text-blue-800">预报说明</Text>
              <Text className="text-xs text-blue-700 mt-1">
                • 数据每 30 分钟更新一次
              </Text>
              <Text className="text-xs text-blue-700 mt-1">
                • 降水概率表示该地区有此概率出现降水
              </Text>
              <Text className="text-xs text-blue-700 mt-1">
                • 天文数据基于地理位置计算
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
