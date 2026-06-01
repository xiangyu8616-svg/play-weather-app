import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FadeInView from '../animations/FadeInView';
import { getProbabilityColor } from '../../utils/colors';

/**
 * 逐日预报卡片 - 深色玻璃态主题
 * 用于预报页横向滚动卡片流
 */
export default function DailyForecastCard({ 
  day, 
  date, 
  condition, 
  high, 
  low, 
  rain, 
  wind,
  isSelected = false,
  onPress,
  index = 0
}) {
  const rainColor = getProbabilityColor(rain);
  
  // 获取天气图标
  const getWeatherIcon = (condition) => {
    const icons = {
      '晴': 'sunny',
      '多云': 'partly-sunny',
      '阴': 'cloudy',
      '小雨': 'rainy',
      '中雨': 'rainy',
      '大雨': 'thunderstorm',
      '雷阵雨': 'thunderstorm',
      '雪': 'snow',
      '雾': 'cloudy-outline',
    };
    return icons[condition] || 'partly-sunny';
  };

  return (
    <FadeInView delay={index * 50} duration={400}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="rounded-2xl p-3 mr-3"
        style={{
          width: 100,
          height: 160,
          backgroundColor: isSelected ? 'rgba(218,165,32,0.12)' : 'rgba(255,255,255,0.06)',
          borderWidth: isSelected ? 1.5 : 1,
          borderColor: isSelected ? 'rgba(218,165,32,0.3)' : 'rgba(255,255,255,0.08)',
          shadowColor: isSelected ? '#DAA520' : 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isSelected ? 0.2 : 0,
          shadowRadius: 8,
          elevation: isSelected ? 8 : 0,
        }}
      >
        {/* 日期/星期 */}
        <View className="items-center mb-2">
          <Text className="text-xs font-semibold" style={{ color: isSelected ? '#E8C547' : 'rgba(255,255,255,0.7)' }}>
            {day}
          </Text>
          <Text className="text-xxs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {date}
          </Text>
        </View>

        {/* 天气图标 */}
        <View className="items-center justify-center flex-1">
          <Ionicons 
            name={getWeatherIcon(condition)} 
            size={32} 
            color={isSelected ? '#FDB813' : 'rgba(253,184,19,0.8)'} 
          />
          <Text className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {condition}
          </Text>
        </View>

        {/* 温度范围 */}
        <View className="items-center mb-1.5">
          <Text className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {high}° {low}°
          </Text>
        </View>

        {/* 降水概率色条 */}
        <View className="items-center">
          <View 
            className="w-full rounded-full"
            style={{ 
              height: 3, 
              backgroundColor: rainColor + '30',
              overflow: 'hidden',
            }}
          >
            <View 
              style={{ 
                width: `${Math.min(rain, 100)}%`, 
                height: '100%', 
                backgroundColor: rainColor,
                borderRadius: 2,
              }} 
            />
          </View>
          <Text className="text-xxs mt-1" style={{ color: rainColor }}>
            {rain}%
          </Text>
        </View>

        {/* 风力风向 */}
        <View className="items-center mt-1.5">
          <Text className="text-xxs" style={{ color: 'rgba(255,255,255,0.4)' }} numberOfLines={1}>
            {wind}
          </Text>
        </View>
      </TouchableOpacity>
    </FadeInView>
  );
}
