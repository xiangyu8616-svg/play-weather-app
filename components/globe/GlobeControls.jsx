import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 辅助函数：hex 转 rgb
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 255, 255';
};

/**
 * 地球仪控制面板 - 毛玻璃深色主题
 * 
 * 设计语言：半透明玻璃态卡片 + 金色高亮
 * 时间轴滑块 / 现象筛选 / 视图控制
 */
// 根据现象获取光晕色
const getGlowColor = (phenomenon: string) => {
  const colors = {
    all: '#DAA520',
    aurora: '#00FF7F',
    typhoon: '#FF4444',
    cloud: '#87CEEB',
    glow: '#FFA500',
    snow: '#E8E8FF',
    rainbow: '#FF6B35',
  };
  return colors[phenomenon] || '#DAA520';
};

const PHENOMENON_TYPES = [
  { key: 'all',      label: '全部',     icon: 'layers',          color: '#DAA520' },
  { key: 'aurora',   label: '极光',     icon: 'color-palette',   color: '#9D4EDD' },
  { key: 'typhoon',  label: '台风',     icon: 'navigate',        color: '#FF4444' },
  { key: 'cloud',    label: '云海',     icon: 'cloud',           color: '#87CEEB' },
  { key: 'glow',     label: '朝霞晚霞', icon: 'sunny',           color: '#FFA500' },
  { key: 'snow',     label: '雪景',     icon: 'snow',            color: '#E8E8FF' },
  { key: 'rainbow',  label: '彩虹',     icon: 'rainbow',         color: '#FF6B35' },
];

export default function GlobeControls({
  selectedDay,
  selectedPhenomenon,
  onDayChange,
  onPhenomenonChange,
  onRotateToggle,
  isRotating
}) {
  const glowColor = useMemo(() => getGlowColor(selectedPhenomenon), [selectedPhenomenon]);
  const glowRgb = useMemo(() => hexToRgb(glowColor), [glowColor]);

  return (
    <View className="px-4 pb-6">
      {/* 主容器 - 玻璃态卡片（带边缘光） */}
      <View 
        className="rounded-3xl overflow-hidden"
        style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderWidth: 1,
          borderColor: `rgba(${glowRgb}, 0.15)`,
          backdropFilter: 'blur(20px)',
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        {/* ===== 预报时间 ===== */}
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={15} color="#DAA520" />
              <Text className="ml-2 text-sm font-semibold text-white opacity-80">预报时间</Text>
            </View>
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(218,165,32,0.12)' }}>
              <Text className="text-xs font-bold text-primary-400">
                {selectedDay}天后
              </Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
            {Array.from({ length: 15 }, (_, i) => i + 1).map((day) => {
              const isSelected = selectedDay === day;
              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => onDayChange(day)}
                  className="px-4 py-2 rounded-xl mr-2"
                  style={{
                    backgroundColor: isSelected ? 'rgba(218,165,32,0.2)' : 'rgba(255,255,255,0.06)',
                    borderWidth: 1,
                    borderColor: isSelected ? `rgba(${glowRgb}, 0.3)` : 'rgba(255,255,255,0.05)',
                    shadowColor: isSelected ? glowColor : 'transparent',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.2,
                    shadowRadius: 6,
                    elevation: isSelected ? 4 : 0,
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.5)' }}
                  >
                    {day}天
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ===== 分隔线 ===== */}
        <View className="mx-4" style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)' }} />

        {/* ===== 天气现象 ===== */}
        <View className="px-4 pt-3 pb-3">
          <View className="flex-row items-center mb-3">
            <Ionicons name="cloud-outline" size={15} color="#DAA520" />
            <Text className="ml-2 text-sm font-semibold text-white opacity-80">天气现象</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {PHENOMENON_TYPES.map((type) => {
              const isSelected = selectedPhenomenon === type.key;
              return (
                <TouchableOpacity
                  key={type.key}
                  onPress={() => onPhenomenonChange(type.key)}
                  className="flex-row items-center px-4 py-2.5 rounded-xl mr-2"
                  style={{
                    backgroundColor: isSelected ? 'rgba(218,165,32,0.18)' : 'rgba(255,255,255,0.05)',
                    borderWidth: 1,
                    borderColor: isSelected ? `rgba(${glowRgb}, 0.3)` : 'rgba(255,255,255,0.06)',
                    shadowColor: isSelected ? glowColor : 'transparent',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.2,
                    shadowRadius: 6,
                    elevation: isSelected ? 2 : 0,
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={type.icon}
                    size={16}
                    color={isSelected ? '#FFFFFF' : type.color}
                  />
                  <Text
                    className="ml-2 text-xs font-semibold"
                    style={{ color: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.6)' }}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ===== 分隔线 ===== */}
        <View className="mx-4" style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)' }} />

        {/* ===== 视图控制 ===== */}
        <View className="px-4 py-3 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={onRotateToggle}
            className="flex-row items-center px-4 py-2.5 rounded-xl"
            style={{
              backgroundColor: isRotating ? 'rgba(218,165,32,0.12)' : 'rgba(255,255,255,0.05)',
              borderWidth: 1,
              borderColor: isRotating ? 'rgba(218,165,32,0.2)' : 'rgba(255,255,255,0.06)',
            }}
            activeOpacity={0.7}
          >
            <View className="w-5 h-5 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: isRotating ? 'rgba(218,165,32,0.3)' : 'rgba(255,255,255,0.1)' }}>
              <Ionicons
                name={isRotating ? 'pause' : 'play'}
                size={12}
                color={isRotating ? '#DAA520' : 'rgba(255,255,255,0.5)'}
              />
            </View>
            <Text
              className="text-xs font-semibold"
              style={{ color: isRotating ? '#E8C547' : 'rgba(255,255,255,0.5)' }}
            >
              {isRotating ? '旋转中' : '自动旋转'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center px-3 py-2 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
            <Ionicons name="hand-left-outline" size={14} color="rgba(255,255,255,0.3)" />
            <Text className="ml-1.5 text-xxs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              双指缩放 • 单指旋转
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
