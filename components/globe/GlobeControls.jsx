import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * 地球仪控制面板 - 金色主题美化版
 * 
 * 功能:
 * - 时间轴滑块 (1-15 天预报)
 * - 现象类型筛选
 * - 视图控制 (旋转/缩放)
 */
interface GlobeControlsProps {
  selectedDay: number;
  selectedPhenomenon: string;
  onDayChange: (day: number) => void;
  onPhenomenonChange: (phenomenon: string) => void;
  onRotateToggle: () => void;
  isRotating: boolean;
}

// 天气现象类型定义
const PHENOMENON_TYPES = [
  { key: 'all', label: '全部', icon: 'layers', color: '#DAA520' },
  { key: 'aurora', label: '极光', icon: 'color-palette', color: '#9D4EDD' },
  { key: 'typhoon', label: '台风', icon: 'navigate', color: '#FF0000' },
  { key: 'cloud', label: '云海', icon: 'cloud', color: '#87CEEB' },
  { key: 'glow', label: '朝霞晚霞', icon: 'sunny', color: '#FFA500' },
  { key: 'snow', label: '雪景', icon: 'snow', color: '#F8F8FF' },
  { key: 'rainbow', label: '彩虹', icon: 'rainbow', color: '#FF6B35' },
];

export default function GlobeControls({
  selectedDay,
  selectedPhenomenon,
  onDayChange,
  onPhenomenonChange,
  onRotateToggle,
  isRotating
}: GlobeControlsProps) {
  return (
    <View className="bg-white border-t border-gray-100 pb-6 shadow-soft">
      {/* 时间轴滑块 */}
      <View className="px-4 py-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Ionicons name="calendar" size={16} color="#DAA520" />
            <Text className="ml-2 text-sm font-semibold text-gray-700">预报时间</Text>
          </View>
          <View className="px-3 py-1 rounded-full bg-primary-50">
            <Text className="text-sm font-bold text-primary-600">
              {selectedDay}天后
            </Text>
          </View>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="flex-row"
        >
          {Array.from({ length: 15 }, (_, i) => i + 1).map((day) => (
            <TouchableOpacity
              key={day}
              onPress={() => onDayChange(day)}
              className={`px-5 py-2.5 rounded-xl mr-2 ${
                selectedDay === day 
                  ? 'bg-primary-500 shadow-gold' 
                  : 'bg-gray-100'
              }`}
              activeOpacity={0.7}
            >
              <Text 
                className={`text-sm font-semibold ${
                  selectedDay === day ? 'text-white' : 'text-gray-600'
                }`}
              >
                {day}天
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 现象类型筛选 */}
      <View className="px-4 py-4 border-t border-gray-50">
        <View className="flex-row items-center mb-3">
          <Ionicons name="cloud" size={16} color="#DAA520" />
          <Text className="ml-2 text-sm font-semibold text-gray-700">
            天气现象
          </Text>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="flex-row"
        >
          {PHENOMENON_TYPES.map((type) => {
            const isSelected = selectedPhenomenon === type.key;
            return (
              <TouchableOpacity
                key={type.key}
                onPress={() => onPhenomenonChange(type.key)}
                className={`flex-row items-center px-4 py-2.5 rounded-xl mr-2 ${
                  isSelected
                    ? 'bg-primary-500 shadow-gold'
                    : 'bg-gray-100 border border-gray-200'
                }`}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={type.icon} 
                  size={18} 
                  color={isSelected ? '#FFFFFF' : type.color} 
                />
                <Text 
                  className={`ml-2 text-sm font-semibold ${
                    isSelected 
                      ? 'text-white' 
                      : 'text-gray-700'
                  }`}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 视图控制栏 */}
      <View className="px-4 py-3 flex-row items-center justify-between border-t border-gray-50">
        <TouchableOpacity
          onPress={onRotateToggle}
          className={`flex-row items-center px-4 py-2.5 rounded-xl ${
            isRotating ? 'bg-primary-100 border border-primary-200' : 'bg-gray-100 border border-gray-200'
          }`}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isRotating ? 'pause' : 'play'} 
            size={18} 
            color={isRotating ? '#DAA520' : '#6B7280'} 
          />
          <Text 
            className={`ml-2 text-sm font-semibold ${
              isRotating ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            {isRotating ? '旋转中' : '自动旋转'}
          </Text>
        </TouchableOpacity>

        <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-xl">
          <Ionicons name="information-circle" size={16} color="#9CA3AF" />
          <Text className="ml-1.5 text-xs text-gray-400 font-medium">
            双指缩放 • 单指旋转
          </Text>
        </View>
      </View>
    </View>
  );
}
