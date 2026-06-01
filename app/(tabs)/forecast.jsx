import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import qweatherService from '../../services/qweatherService';
import astronomyService from '../../services/astronomyService';
import weatherService from '../../services/weatherService';
import FadeInView from '../../components/animations/FadeInView';
import { getProbabilityColor } from '../../utils/colors';
import CurrentWeatherBanner from '../../components/weather/CurrentWeatherBanner';
import DailyForecastCard from '../../components/weather/DailyForecastCard';

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
  const [nowWeather, setNowWeather] = useState(null);
  const [dailyForecast, setDailyForecast] = useState([]);

  // 北京坐标（实际应从用户定位或选择的城市获取）
  const LOCATION = {
    lat: 39.9042,
    lng: 116.4074,
    cityId: '101010100', // 北京城市 ID
    name: '北京市'
  };

  // 格式化日期显示
  const formatDay = (dateStr, index) => {
    if (index === 0) return '今天';
    if (index === 1) return '明天';
    const date = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 将 dailyForecast (API 格式) 转换为 forecastData (组件渲染格式)
  const forecastData = (dailyForecast || []).map((item, index) => ({
    day: formatDay(item.fxDate, index),
    date: formatDate(item.fxDate),
    condition: item.textDay || '多云',
    high: parseInt(item.tempMax) || 0,
    low: parseInt(item.tempMin) || 0,
    rain: Math.min(100, Math.round(parseFloat(item.precip || 0) * 10)),
    wind: `${item.windDirDay || ''}${item.windScaleDay || ''}级`,
  }));

  // 确保 selectedDay 不超出数组范围
  const safeSelectedDay = Math.min(selectedDay, Math.max(0, forecastData.length - 1));

  // 加载天气数据
  useEffect(() => {
    loadWeatherData();
    loadAstronomyData();
  }, []);

  async function loadWeatherData() {
    try {
      const [weather, forecast] = await Promise.all([
        qweatherService.getNowWeather(LOCATION.cityId),
        qweatherService.getDailyForecast(LOCATION.cityId, 7),
      ]);
      setNowWeather(weather);
      setDailyForecast(forecast);
    } catch (error) {
      console.error('加载天气数据失败:', error);
      // 使用 Mock 数据
      setNowWeather(qweatherService.generateMockNowWeather());
      setDailyForecast(qweatherService.generateMockDailyForecast());
    } finally {
      setLoading(false);
    }
  }

  async function loadAstronomyData() {
    try {
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
      // 提供 fallback mock data for astronomy
      setAstronomyData({
        sunTimes: { sunrise: new Date(2026, 5, 1, 5, 45), sunset: new Date(2026, 5, 1, 19, 30) },
        moonPhase: { phaseName: '上弦月', age: 7, illumination: 50 },
        moonTimes: { moonrise: new Date(2026, 5, 1, 12, 0), moonset: new Date(2026, 5, 1, 0, 30) },
        photoTimes: {
          goldenHourMorning: { start: new Date(2026, 5, 1, 5, 45), end: new Date(2026, 5, 1, 6, 45), duration: 60 },
          goldenHourEvening: { start: new Date(2026, 5, 1, 18, 30), end: new Date(2026, 5, 1, 19, 30), duration: 60 },
          blueHourMorning: { start: new Date(2026, 5, 1, 5, 15), end: new Date(2026, 5, 1, 5, 45) },
          blueHourEvening: { start: new Date(2026, 5, 1, 19, 30), end: new Date(2026, 5, 1, 20, 0) },
        }
      });
      setAqiData({ aqi: 75, category: '良', primaryPollutant: 'PM2.5' });
      setUvData({ uvIndex: 5, level: '中等', advice: '建议涂抹防晒霜，佩戴帽子' });
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

  // 光晕动画
  const haloOpacity1 = useState(new Animated.Value(0.3))[0];
  const haloRadius1 = useState(new Animated.Value(60))[0];
  const haloOpacity2 = useState(new Animated.Value(0.4))[0];
  const haloRadius2 = useState(new Animated.Value(70))[0];

  useEffect(() => {
    const pulse1 = Animated.loop(
      Animated.sequence([
        Animated.sequence([
          Animated.parallel([
            Animated.timing(haloOpacity1, { toValue: 0.6, duration: 2000, useNativeDriver: false }),
            Animated.timing(haloRadius1, { toValue: 80, duration: 2000, useNativeDriver: false }),
          ]),
          Animated.parallel([
            Animated.timing(haloOpacity1, { toValue: 0.3, duration: 2000, useNativeDriver: false }),
            Animated.timing(haloRadius1, { toValue: 50, duration: 2000, useNativeDriver: false }),
          ]),
        ]),
      ])
    );
    const pulse2 = Animated.loop(
      Animated.sequence([
        Animated.sequence([
          Animated.parallel([
            Animated.timing(haloOpacity2, { toValue: 0.6, duration: 2000, useNativeDriver: false }),
            Animated.timing(haloRadius2, { toValue: 80, duration: 2000, useNativeDriver: false }),
          ]),
          Animated.parallel([
            Animated.timing(haloOpacity2, { toValue: 0.4, duration: 2000, useNativeDriver: false }),
            Animated.timing(haloRadius2, { toValue: 60, duration: 2000, useNativeDriver: false }),
          ]),
        ]),
      ])
    );
    pulse1.start();
    pulse2.start();
  }, []);

  // 格式化时间
  const formatTime = (date) => {
    if (!date) return '--:--';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 获取月相图标 (Ionicons 只有 'moon' 图标)
  const getMoonPhaseIcon = (phaseName) => {
    return 'moon';
  };

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: '#0F0D1E' }}>
      {/* 背景光晕装饰 */}
      <Animated.View className="absolute top-0 right-0 w-48 h-48 opacity-40" style={{
        backgroundColor: 'transparent',
        shadowColor: '#DAA520',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: haloOpacity1,
        shadowRadius: haloRadius1,
        elevation: 40,
      }} />
      <Animated.View className="absolute bottom-1/3 left-0 w-40 h-40 opacity-30" style={{
        backgroundColor: 'transparent',
        shadowColor: '#DAA520',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: haloOpacity2,
        shadowRadius: haloRadius2,
        elevation: 30,
      }} />

      {/* CurrentWeatherBanner - 当前天气横幅 */}
      {nowWeather && (
        <CurrentWeatherBanner
          cityName={LOCATION.name}
          temperature={parseInt(nowWeather.temp)}
          condition={nowWeather.text}
          feelsLike={parseInt(nowWeather.feelsLike)}
          windDir={nowWeather.windDir}
          windScale={parseInt(nowWeather.windScale)}
          onSwitchCity={() => {}}
        />
      )}

      {/* DailyForecastStrip - 横向逐日预报 */}
      <View className="py-4">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="pl-5"
        >
          {dailyForecast.slice(0, 7).map((item, index) => (
            <DailyForecastCard
              key={item.fxDate}
              index={index}
              day={formatDay(item.fxDate, index)}
              date={formatDate(item.fxDate)}
              condition={item.textDay}
              high={parseInt(item.tempMax)}
              low={parseInt(item.tempMin)}
              rain={Math.round(parseFloat(item.precip || 0) * 10)}
              wind={`${item.windDirDay || ''}${item.windScaleDay || ''}级`}
              isSelected={selectedDay === index}
              onPress={() => setSelectedDay(index)}
            />
          ))}
        </ScrollView>
      </View>

      {/* 天文数据卡片 - 深色主题 */}
      <View className="px-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-2xl font-bold">{LOCATION.name}</Text>
            <Text className="text-white/60 text-sm mt-1">
              实时更新 • 数据来源：和风天气
            </Text>
          </View>
          <TouchableOpacity 
            className="px-4 py-2 rounded-2xl"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.08)', 
              borderWidth: 1, 
              borderColor: 'rgba(255,255,255,0.1)' 
            }}
          >
            <Text className="text-white/70 text-sm font-medium">切换城市</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 天文数据卡片 - 深色主题 */}
      {loading ? (
        <View className="p-4 items-center">
          <ActivityIndicator size="large" color="#DAA520" />
          <Text className="text-white/50 mt-2">加载天文数据...</Text>
        </View>
      ) : astronomyData ? (
        <View className="px-4 py-4">
          <View className="rounded-2xl p-4 mb-4" style={{
            backgroundColor: 'rgba(15,13,30,0.92)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
          }}>
            <View className="flex-row items-center mb-3">
              <Ionicons name="sunny" size={24} color="#FDB813" />
              <Text className="text-lg font-bold text-white/85 ml-2">日出日落</Text>
            </View>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Ionicons name="arrow-up" size={20} color="#F97316" />
                <Text className="text-xs text-white/40 mt-1">日出</Text>
                <Text className="text-lg font-bold text-white">
                  {formatTime(astronomyData.sunTimes?.sunrise)}
                </Text>
              </View>
              <View className="items-center">
                <Ionicons name="arrow-down" size={20} color="#EF4444" />
                <Text className="text-xs text-white/40 mt-1">日落</Text>
                <Text className="text-lg font-bold text-white">
                  {formatTime(astronomyData.sunTimes?.sunset)}
                </Text>
              </View>
              <View className="items-center">
                <Ionicons name="time" size={20} color="#FBBF24" />
                <Text className="text-xs text-white/40 mt-1">日照时长</Text>
                <Text className="text-lg font-bold text-white">
                  {astronomyData.sunTimes?.sunset && astronomyData.sunTimes?.sunrise
                    ? Math.round((astronomyData.sunTimes.sunset - astronomyData.sunTimes.sunrise) / 3600000)
                    : '--'}小时
                </Text>
              </View>
            </View>
          </View>

          {/* 黄金时刻和蓝色时刻 - 深色主题 */}
          <View className="rounded-2xl p-4 mb-4" style={{
            backgroundColor: 'rgba(15,13,30,0.92)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
          }}>
            <View className="flex-row items-center mb-3">
              <Ionicons name="camera" size={24} color="#DAA520" />
              <Text className="text-lg font-bold text-white/85 ml-2">摄影最佳时机</Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <View className="flex-1">
                <Text className="text-xs font-medium" style={{ color: '#E8C547' }}>🌅 早晨黄金时刻</Text>
                <Text className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {formatTime(astronomyData.photoTimes?.goldenHourMorning?.start)} - {formatTime(astronomyData.photoTimes?.goldenHourMorning?.end)}
                </Text>
                <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  持续{astronomyData.photoTimes?.goldenHourMorning?.duration || '--'}分钟
                </Text>
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-xs font-medium" style={{ color: '#FFA500' }}>🌇 傍晚黄金时刻</Text>
                <Text className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {formatTime(astronomyData.photoTimes?.goldenHourEvening?.start)} - {formatTime(astronomyData.photoTimes?.goldenHourEvening?.end)}
                </Text>
                <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  持续{astronomyData.photoTimes?.goldenHourEvening?.duration || '--'}分钟
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text className="text-xs font-medium" style={{ color: '#3B82F6' }}>🌆 早晨蓝色时刻</Text>
                <Text className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {formatTime(astronomyData.photoTimes?.blueHourMorning?.start)} - {formatTime(astronomyData.photoTimes?.blueHourMorning?.end)}
                </Text>
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-xs font-medium" style={{ color: '#6366F1' }}>🌌 傍晚蓝色时刻</Text>
                <Text className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {formatTime(astronomyData.photoTimes?.blueHourEvening?.start)} - {formatTime(astronomyData.photoTimes?.blueHourEvening?.end)}
                </Text>
              </View>
            </View>
          </View>

          {/* 月相显示 - 深色主题 */}
          <View className="rounded-2xl p-4" style={{
            backgroundColor: 'rgba(15,13,30,0.92)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
          }}>
            <View className="flex-row items-center mb-3">
              <Ionicons name="moon" size={24} color="rgba(255,255,255,0.5)" />
              <Text className="text-lg font-bold text-white/85 ml-2">月相</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons 
                  name={getMoonPhaseIcon(astronomyData.moonPhase?.phaseName)} 
                  size={40} 
                  color="rgba(255,255,255,0.6)" 
                />
                <View className="ml-3">
                  <Text className="text-base font-bold text-white">
                    {astronomyData.moonPhase?.phaseName || '--'}
                  </Text>
                  <Text className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    月龄：{astronomyData.moonPhase?.age ?? '--'}天
                  </Text>
                </View>
              </View>
              <View className="items-center">
                <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>亮度</Text>
                <Text className="text-lg font-bold text-white">
                  {astronomyData.moonPhase?.illumination != null
                    ? `${astronomyData.moonPhase.illumination.toFixed(0)}%`
                    : '--'}
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>月出</Text>
                <Text className="text-sm font-medium text-white">
                  {formatTime(astronomyData.moonTimes?.moonrise)}
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>月落</Text>
                <Text className="text-sm font-medium text-white">
                  {formatTime(astronomyData.moonTimes?.moonset)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {/* AQI 和紫外线指数 - 深色主题 */}
      {!loading && (aqiData || uvData) && (
        <View className="px-4 py-4">
          <View className="flex-row">
            {/* AQI 卡片 */}
            <View 
              className="flex-1 rounded-2xl p-4 mr-2"
              style={{ 
                backgroundColor: getAqiColor(aqiData?.aqi || 0) + '15',
                borderWidth: 1,
                borderColor: getAqiColor(aqiData?.aqi || 0) + '30',
              }}
            >
              <View className="flex-row items-center mb-2">
                <Ionicons name="cloud" size={20} color={getAqiColor(aqiData?.aqi || 0)} />
                <Text className="text-sm font-bold text-white/85 ml-2">空气质量</Text>
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
              <Text className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                首要污染物：{aqiData?.primaryPollutant || '--'}
              </Text>
            </View>

            {/* 紫外线卡片 */}
            <View 
              className="flex-1 rounded-2xl p-4 ml-2"
              style={{ 
                backgroundColor: getUvColor(uvData?.uvIndex || 0) + '15',
                borderWidth: 1,
                borderColor: getUvColor(uvData?.uvIndex || 0) + '30',
              }}
            >
              <View className="flex-row items-center mb-2">
                <Ionicons name="sunny-outline" size={20} color={getUvColor(uvData?.uvIndex || 0)} />
                <Text className="text-sm font-bold text-white/85 ml-2">紫外线</Text>
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
              <Text className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }} numberOfLines={2}>
                {uvData?.advice || '--'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 7 天预报列表 - 深色主题 */}
      <View className="px-4 py-6">
        <Text className="text-lg font-bold text-white/85 mb-4">7 天预报</Text>
        
        {forecastData.length > 0 ? forecastData.map((item, index) => {
          const isSelected = selectedDay === index;
          const rainColor = getProbabilityColor(item.rain);
          
          return (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedDay(index)}
              activeOpacity={0.7}
              className="p-4 mb-3 rounded-2xl"
              style={{
                backgroundColor: isSelected ? 'rgba(218,165,32,0.12)' : 'rgba(255,255,255,0.05)',
                borderWidth: isSelected ? 1.5 : 1,
                borderColor: isSelected ? 'rgba(218,165,32,0.3)' : 'rgba(255,255,255,0.06)',
                shadowColor: isSelected ? '#DAA520' : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: isSelected ? 0.2 : 0,
                shadowRadius: 8,
                elevation: isSelected ? 8 : 0,
              }}
            >
              {/* 日期 */}
              <View style={{ width: 80 }}>
                <Text className="text-base font-bold" style={{ color: isSelected ? '#E8C547' : 'rgba(255,255,255,0.85)' }}>
                  {item.day}
                </Text>
                <Text className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.date}</Text>
              </View>

              {/* 天气状况 */}
              <View className="flex-row items-center flex-1">
                <Ionicons 
                  name={getWeatherIcon(item.condition)} 
                  size={32} 
                  color={isSelected ? '#FDB813' : 'rgba(253,184,19,0.8)'} 
                />
                <Text className="ml-3 text-base" style={{ color: isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)' }}>{item.condition}</Text>
              </View>

              {/* 温度 */}
              <View style={{ width: 96 }} className="items-center">
                <Text className="text-lg font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {item.high}° / {item.low}°
                </Text>
              </View>

              {/* 降水概率 */}
              <View 
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: rainColor + '20' }}
              >
                <Text 
                  className="text-sm font-medium"
                  style={{ color: rainColor }}
                >
                  {item.rain}%
                </Text>
              </View>
            </TouchableOpacity>
          );
        }) : (
          <View className="items-center py-8">
            <ActivityIndicator size="large" color="#DAA520" />
            <Text className="text-white/50 mt-2">加载预报数据...</Text>
          </View>
        )}
      </View>

      {/* 选中日期详情 - 深色主题 */}
      {forecastData.length > 0 && (
      <View className="px-4 py-6">
        <Text className="text-lg font-bold text-white/85 mb-4">
          {forecastData[safeSelectedDay].day}详情
        </Text>
        
        <View className="rounded-2xl p-5" style={{
          backgroundColor: 'rgba(15,13,30,0.92)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
        }}>
          <View className="flex-row justify-between mb-4">
            <View className="items-center">
              <View className="w-11 h-11 rounded-full items-center justify-center mb-2" style={{ backgroundColor: 'rgba(255,107,53,0.12)' }}>
                <Ionicons name="thermometer" size={24} color="#FF6B35" />
              </View>
              <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>体感温度</Text>
              <Text className="text-lg font-bold text-white">
                {Math.round((forecastData[safeSelectedDay].high + forecastData[safeSelectedDay].low) / 2)}°
              </Text>
            </View>
            
            <View className="items-center">
              <View className="w-11 h-11 rounded-full items-center justify-center mb-2" style={{ backgroundColor: 'rgba(75,85,99,0.12)' }}>
                <Ionicons name="water" size={24} color="#4B5563" />
              </View>
              <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>湿度</Text>
              <Text className="text-lg font-bold text-white">65%</Text>
            </View>
            
            <View className="items-center">
              <View className="w-11 h-11 rounded-full items-center justify-center mb-2" style={{ backgroundColor: 'rgba(14,165,233,0.12)' }}>
                <Ionicons name="wind" size={24} color="#0EA5E9" />
              </View>
              <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>风速</Text>
              <Text className="text-lg font-bold text-white">{forecastData[safeSelectedDay].wind}</Text>
            </View>
            
            <View className="items-center">
              <View className="w-11 h-11 rounded-full items-center justify-center mb-2" style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}>
                <Ionicons name="eye" size={24} color="#10B981" />
              </View>
              <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>能见度</Text>
              <Text className="text-lg font-bold text-white">15km</Text>
            </View>
          </View>

          {/* 生活指数 */}
          <View className="pt-4" style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
            <Text className="text-sm font-bold text-white/85 mb-3">💡 生活指数</Text>
            <View className="flex-row flex-wrap">
              <View className="w-1/2 mb-3">
                <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>穿衣指数</Text>
                <Text className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>舒适，建议穿薄外套</Text>
              </View>
              <View className="w-1/2 mb-3">
                <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>紫外线指数</Text>
                <Text className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{uvData?.advice || '中等，注意防晒'}</Text>
              </View>
              <View className="w-1/2 mb-3">
                <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>运动指数</Text>
                <Text className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>适宜户外运动</Text>
              </View>
              <View className="w-1/2 mb-3">
                <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>洗车指数</Text>
                <Text className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>较适宜</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      )}

      {/* 底部提示 - 深色主题 */}
      <View className="px-4 py-6">
        <View className="rounded-2xl p-4" style={{
          backgroundColor: 'rgba(59,130,246,0.1)',
          borderWidth: 1,
          borderColor: 'rgba(59,130,246,0.2)',
        }}>
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <View className="ml-3 flex-1">
              <Text className="text-sm font-bold text-blue-300">预报说明</Text>
              <Text className="text-xs mt-1" style={{ color: 'rgba(59,130,246,0.7)' }}>
                • 数据每 30 分钟更新一次
              </Text>
              <Text className="text-xs mt-1" style={{ color: 'rgba(59,130,246,0.7)' }}>
                • 降水概率表示该地区有此概率出现降水
              </Text>
              <Text className="text-xs mt-1" style={{ color: 'rgba(59,130,246,0.7)' }}>
                • 天文数据基于地理位置计算
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
