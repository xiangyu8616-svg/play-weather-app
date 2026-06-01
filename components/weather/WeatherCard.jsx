import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FadeInView from '../animations/FadeInView';
import { hexToRgb, getProbabilityColor } from '../../utils/colors';

/**
 * 天气详情卡片 - 毛玻璃深色主题
 * 显示单个地点的预报信息
 */
export default function WeatherCard({
  location,
  probability,
  level,
  sunrise,
  onClose,
}) {
  const primaryColor = getProbabilityColor(probability);
  const primaryRgb = useMemo(() => hexToRgb(primaryColor), [primaryColor]);

  return (
    <FadeInView duration={400}>
    <View className="rounded-2xl p-5"
      style={{
        backgroundColor: 'rgba(15,13,30,0.92)',
        borderWidth: 1,
        borderColor: `rgba(${primaryRgb}, 0.2)`,
        shadowColor: primaryColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 15,
      }}
    >
      {/* ===== 顶部：地点 + 关闭 ===== */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1 flex-row items-center">
          <View className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(218,165,32,0.15)' }}>
            <Ionicons name="location" size={16} color="#DAA520" />
          </View>
          <Text className="ml-2 text-base font-bold text-white" numberOfLines={1}>
            {location}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
        >
          <Ionicons name="close" size={16} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </View>

      {/* ===== 概率大数字 ===== */}
      <View className="flex-row items-baseline mb-4">
        <Text className="text-5xl font-bold mr-2" style={{ color: primaryColor }}>
          {probability}
        </Text>
        <Text className="text-xl" style={{ color: 'rgba(255,255,255,0.4)' }}>%</Text>
      </View>

      {/* ===== 质量等级标签 ===== */}
      <View className="px-4 py-1.5 rounded-full mb-4 self-start"
        style={{
          backgroundColor: primaryColor + '18',
          borderWidth: 1,
          borderColor: primaryColor + '35',
        }}
      >
        <Text className="text-sm font-bold" style={{ color: primaryColor }}>{level}</Text>
      </View>

      {/* ===== 详细信息 ===== */}
      <View className="flex-row justify-between pt-4 mb-4" style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
        <View className="items-center flex-1">
          <View className="w-10 h-10 rounded-full items-center justify-center mb-1.5"
            style={{ backgroundColor: 'rgba(253,184,19,0.12)' }}>
            <Ionicons name="sunny" size={20} color="#FDB813" />
          </View>
          <Text className="text-xxs mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>日出</Text>
          <Text className="text-sm font-semibold text-white">{sunrise}</Text>
        </View>

        <View className="items-center flex-1" style={{ borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.06)' }}>
          <View className="w-10 h-10 rounded-full items-center justify-center mb-1.5"
            style={{ backgroundColor: 'rgba(218,165,32,0.12)' }}>
            <Ionicons name="time" size={20} color="#DAA520" />
          </View>
          <Text className="text-xxs mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>黄金时刻</Text>
          <Text className="text-sm font-semibold text-white">28 分钟</Text>
        </View>

        <View className="items-center flex-1" style={{ borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.06)' }}>
          <View className="w-10 h-10 rounded-full items-center justify-center mb-1.5"
            style={{ backgroundColor: 'rgba(255,107,53,0.12)' }}>
            <Ionicons name="thermometer" size={20} color="#FF6B35" />
          </View>
          <Text className="text-xxs mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>气温</Text>
          <Text className="text-sm font-semibold text-white">-5~8°C</Text>
        </View>
      </View>

      {/* ===== 预报解读 ===== */}
      <View className="rounded-xl p-3.5"
        style={{
          backgroundColor: 'rgba(218,165,32,0.06)',
          borderWidth: 1,
          borderColor: 'rgba(218,165,32,0.1)',
        }}
      >
        <View className="flex-row items-center mb-1.5">
          <Ionicons name="bulb" size={14} color="#DAA520" />
          <Text className="ml-1.5 text-xs font-semibold text-white opacity-80">💡 预报解读</Text>
        </View>
        <Text className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
          高空气流稳定，云量极少，极佳观赏条件！建议提前 30 分钟到达观测点。
        </Text>
      </View>
    </View>
    </FadeInView>
  );
}
