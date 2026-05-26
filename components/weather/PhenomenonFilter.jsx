import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * 天气现象类型筛选组件
 */
interface PhenomenonFilterProps {
  selected: string;
  onSelect: (type: string) => void;
}

// 现象类型数据
const PHENOMENA = [
  { id: 'all', label: '全部', icon: 'layers', color: '#6B7280' },
  { id: 'aurora', label: '极光', icon: 'flash', color: '#9D4EDD' },
  { id: 'glow', label: '日照金山', icon: 'sunny', color: '#FFA500' },
  { id: 'cloud', label: '云海', icon: 'cloud', color: '#87CEEB' },
  { id: 'sunset', label: '朝霞晚霞', icon: 'color-palette', color: '#FF6B35' },
  { id: 'typhoon', label: '台风', icon: 'navigate', color: '#FF0000' },
  { id: 'snow', label: '暴雪', icon: 'snow', color: '#F8F8FF' },
  { id: 'rain', label: '暴雨', icon: 'rainy', color: '#4B5563' },
];

export default function PhenomenonFilter({
  selected,
  onSelect,
}: PhenomenonFilterProps) {
  return (
    <View className="px-4">
      <Text className="text-sm font-medium text-gray-700 mb-3">
        现象类型
      </Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="flex-row"
      >
        {PHENOMENA.map((item) => {
          const isSelected = selected === item.id;
          
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelect(item.id)}
              className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${
                isSelected ? 'bg-gray-800' : 'bg-gray-100'
              }`}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={item.icon} 
                size={18} 
                color={isSelected ? '#FFFFFF' : item.color} 
              />
              <Text 
                className={`ml-2 text-sm font-medium ${
                  isSelected ? 'text-white' : 'text-gray-700'
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
