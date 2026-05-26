import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * 天气详情卡片组件 - 金色主题美化版
 * 显示单个地点的预报信息
 */
interface WeatherCardProps {
  location: string;
  probability: number;
  level: '史诗级' | '优秀' | '良好' | '一般' | '较差';
  sunrise: string;
  onClose: () => void;
}

export default function WeatherCard({
  location,
  probability,
  level,
  sunrise,
  onClose,
}: WeatherCardProps) {
  // 根据概率获取颜色
  const getProbabilityColor = () => {
    if (probability >= 80) return '#FF6B35'; // 史诗级 - 橙红
    if (probability >= 60) return '#FFA500'; // 优秀 - 橙色
    if (probability >= 40) return '#DAA520'; // 良好 - 金色
    if (probability >= 20) return '#F4D46E'; // 一般 - 浅金
    return '#9CA3AF'; // 较差 - 灰色
  };

  const primaryColor = getProbabilityColor();

  return (
    <View className="bg-white rounded-2xl shadow-soft p-5 border border-gray-100">
      {/* 顶部栏：地点 + 关闭按钮 */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1 flex-row items-center">
          <Ionicons name="location" size={20} color="#DAA520" />
          <Text className="ml-2 text-base font-bold text-gray-800" numberOfLines={1}>
            {location}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={onClose}
          className="p-2 rounded-full bg-gray-50 active:bg-gray-100"
        >
          <Ionicons name="close" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* 概率大数字 */}
      <View className="flex-row items-baseline mb-4">
        <Text 
          className="text-5xl font-bold mr-2"
          style={{ color: primaryColor }}
        >
          {probability}
        </Text>
        <Text className="text-xl text-gray-400">%</Text>
      </View>

      {/* 质量等级标签 */}
      <View 
        className="px-4 py-1.5 rounded-full mb-4 self-start"
        style={{ 
          backgroundColor: primaryColor + '15',
          borderWidth: 1,
          borderColor: primaryColor + '40'
        }}
      >
        <Text 
          className="text-sm font-semibold"
          style={{ color: primaryColor }}
        >
          {level}
        </Text>
      </View>

      {/* 详细信息网格 */}
      <View className="flex-row justify-between border-t border-gray-100 pt-4 mb-3">
        <View className="items-center flex-1">
          <View className="w-10 h-10 rounded-full bg-yellow-50 items-center justify-center mb-1">
            <Ionicons name="sunny" size={22} color="#FDB813" />
          </View>
          <Text className="text-xs text-gray-500 mb-0.5">日出</Text>
          <Text className="text-sm font-semibold text-gray-800">{sunrise}</Text>
        </View>
        
        <View className="items-center flex-1 border-l border-gray-100">
          <View className="w-10 h-10 rounded-full bg-primary-50 items-center justify-center mb-1">
            <Ionicons name="time" size={22} color="#DAA520" />
          </View>
          <Text className="text-xs text-gray-500 mb-0.5">黄金时刻</Text>
          <Text className="text-sm font-semibold text-gray-800">28 分钟</Text>
        </View>
        
        <View className="items-center flex-1 border-l border-gray-100">
          <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center mb-1">
            <Ionicons name="thermometer" size={22} color="#FF6B35" />
          </View>
          <Text className="text-xs text-gray-500 mb-0.5">气温</Text>
          <Text className="text-sm font-semibold text-gray-800">-5~8°C</Text>
        </View>
      </View>

      {/* 预报解读卡片 */}
      <View className="bg-gradient-to-r from-primary-50 to-yellow-50 rounded-xl p-3.5 border border-primary-100">
        <View className="flex-row items-center mb-1.5">
          <Ionicons name="bulb" size={16} color="#DAA520" />
          <Text className="ml-1.5 text-xs font-semibold text-gray-700">
            💡 预报解读
          </Text>
        </View>
        <Text className="text-xs text-gray-600 leading-relaxed">
          高空气流稳定，云量极少，极佳观赏条件！建议提前 30 分钟到达观测点。
        </Text>
      </View>
    </View>
  );
}
