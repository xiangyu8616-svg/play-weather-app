import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FadeInView from '../animations/FadeInView';
import { hexToRgb } from '../../utils/colors';

/**
 * 当前天气横幅 - 深色玻璃态主题
 * 显示城市名、大温度数字、天气图标
 */
export default function CurrentWeatherBanner({ 
  cityName = '北京市',
  temperature = 24,
  condition = '多云',
  feelsLike = 22,
  windDir = '北风',
  windScale = 2,
  onSwitchCity,
}) {
  // 根据温度计算颜色渐变（暖→冷）
  const tempColor = useMemo(() => {
    if (temperature >= 30) return '#FF6B35'; // 暖橙色
    if (temperature >= 20) return '#DAA520'; // 金色
    if (temperature >= 10) return '#FDB813'; // 黄色
    return '#87CEEB'; // 冷蓝色
  }, [temperature]);

  // 获取天气图标
  const getWeatherIcon = (condition) => {
    const icons = {
      '晴': { name: 'sunny', color: '#FDB813' },
      '多云': { name: 'partly-sunny', color: '#DAA520' },
      '阴': { name: 'cloudy', color: '#87CEEB' },
      '小雨': { name: 'rainy', color: '#3B82F6' },
      '中雨': { name: 'rainy', color: '#2563EB' },
      '大雨': { name: 'thunderstorm', color: '#1E40AF' },
      '雷阵雨': { name: 'thunderstorm', color: '#1E40AF' },
      '雪': { name: 'snow', color: '#93C5FD' },
      '雾': { name: 'cloudy-outline', color: '#9CA3AF' },
    };
    return icons[condition] || { name: 'partly-sunny', color: '#DAA520' };
  };

  const weatherIcon = getWeatherIcon(condition);

  return (
    <FadeInView duration={500}>
      <View className="px-5 pt-8 pb-6">
        {/* 城市名 + 温度 + 天气图标 */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <Ionicons name="location" size={18} color="rgba(255,255,255,0.5)" />
              <Text className="text-2xl font-bold text-white ml-1.5" numberOfLines={1}>
                {cityName}
              </Text>
            </View>
            
            {/* 大温度数字 */}
            <View className="flex-row items-baseline">
              <Text 
                className="text-7xl font-bold mr-3" 
                style={{ color: tempColor }}
              >
                {temperature}
              </Text>
              <Text className="text-3xl" style={{ color: 'rgba(255,255,255,0.4)' }}>
                °
              </Text>
            </View>

            {/* 天气描述 + 体感温度 */}
            <View className="flex-row items-center mt-2">
              <Ionicons name={weatherIcon.name} size={28} color={weatherIcon.color} />
              <Text className="text-lg ml-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {condition}
              </Text>
              <Text className="text-sm ml-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                体感 {feelsLike}°
              </Text>
            </View>

            {/* 风力信息 */}
            <View className="flex-row items-center mt-1.5">
              <Ionicons name="wind" size={16} color="rgba(255,255,255,0.4)" />
              <Text className="text-xs ml-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {windDir} {windScale}级
              </Text>
            </View>
          </View>

          {/* 切换城市按钮 */}
          <TouchableOpacity
            onPress={onSwitchCity}
            activeOpacity={0.7}
            className="px-4 py-2.5 rounded-2xl"
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <View className="flex-row items-center">
              <Ionicons name="swap-horizontal" size={18} color="rgba(255,255,255,0.6)" />
              <Text className="text-sm ml-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                切换
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </FadeInView>
  );
}
