import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import GlobeView from '../../components/globe/GlobeView.optimized';
import GlobeControls from '../../components/globe/GlobeControls';
import WeatherCard from '../../components/weather/WeatherCard';

/**
 * 首页 - 地球仪主界面（金色主题美化版）
 * 功能：
 * - 3D 地球仪展示全球天气现象
 * - 时间轴切换 1-15 天预报
 * - 现象类型筛选
 * - 收藏地点快速访问
 */
export default function HomeScreen() {
  // 当前选中的天数（1-15）
  const [selectedDay, setSelectedDay] = useState(1);
  
  // 当前选中的天气现象类型
  const [selectedPhenomenon, setSelectedPhenomenon] = useState('all');
  
  // 地球仪是否显示详情
  const [showGlobeDetail, setShowGlobeDetail] = useState(false);
  
  // 是否自动旋转
  const [isRotating, setIsRotating] = useState(true);
  
  // 选中的点数据
  const [selectedPointData, setSelectedPointData] = useState(null);
  
  // 是否显示台风路径面板
  const [showTyphoonPanel, setShowTyphoonPanel] = useState(false);

  // 处理天数变化
  const handleDayChange = (day) => {
    setSelectedDay(day);
  };

  // 处理现象类型变化
  const handlePhenomenonChange = (phenomenon) => {
    setSelectedPhenomenon(phenomenon);
    // 如果选择台风，显示路径面板
    setShowTyphoonPanel(phenomenon === 'typhoon' || phenomenon === 'all');
  };

  // 处理旋转切换
  const handleRotateToggle = () => {
    setIsRotating(!isRotating);
  };

  // 处理地球仪点击
  const handleGlobePress = () => {
    setShowGlobeDetail(true);
  };

  // 处理点数据
  const handlePointData = (data) => {
    setSelectedPointData(data);
    setShowGlobeDetail(true);
  };

  return (
    <View className="flex-1 bg-background-primary">
      <StatusBar style="dark" />
      
      {/* 顶部搜索栏 */}
      <View className="px-4 pt-12 pb-4 bg-white shadow-soft">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <TouchableOpacity 
              className="flex-row items-center bg-gray-50 px-4 py-3.5 rounded-2xl border border-gray-100"
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <Text className="ml-3 text-gray-400 text-sm">搜索城市/景点/现象</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity className="p-3.5 bg-primary-50 rounded-2xl border border-primary-100">
            <Ionicons name="location" size={24} color="#DAA520" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 地球仪主视觉区域 */}
      <View className="flex-1 bg-gradient-to-b from-background-secondary to-background-primary">
        <GlobeView 
          selectedDay={selectedDay}
          selectedPhenomenon={selectedPhenomenon}
          onGlobePress={handleGlobePress}
          onPointData={handlePointData}
        />
        
        {/* 地球仪浮动信息卡片 */}
        {showGlobeDetail && (
          <View className="absolute top-4 right-4 left-4">
            <WeatherCard
              location={selectedPointData?.name || "梅里雪山·飞来寺"}
              probability={selectedPointData?.size ? Math.round(selectedPointData.size * 100) : 85}
              level={selectedPointData?.intensity || "史诗级"}
              sunrise="07:23"
              onClose={() => setShowGlobeDetail(false)}
            />
          </View>
        )}
      </View>

      {/* 底部控制区域 */}
      <GlobeControls
        selectedDay={selectedDay}
        selectedPhenomenon={selectedPhenomenon}
        onDayChange={handleDayChange}
        onPhenomenonChange={handlePhenomenonChange}
        onRotateToggle={handleRotateToggle}
        isRotating={isRotating}
      />
      
      {/* 台风路径面板（仅当选择台风时显示） */}
      {showTyphoonPanel && selectedPhenomenon === 'typhoon' && (
        <View className="absolute bottom-0 left-0 right-4 bg-white rounded-t-2xl shadow-large p-4 border-t border-gray-200">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center">
                <Text className="text-xl">🌀</Text>
              </View>
              <View className="ml-3">
                <Text className="text-base font-bold text-gray-800">台风路径</Text>
                <Text className="text-xs text-gray-500">实时追踪 • 预报路径</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => setShowTyphoonPanel(false)}
              className="p-2 rounded-full bg-gray-100"
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {/* 强度图例 */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-3">
            <View className="flex-row items-center mr-3">
              <View className="w-3 h-3 rounded-full bg-gray-500" />
              <Text className="text-xs text-gray-600 ml-1">热带低压</Text>
            </View>
            <View className="flex-row items-center mr-3">
              <View className="w-3 h-3 rounded-full bg-blue-500" />
              <Text className="text-xs text-gray-600 ml-1">热带风暴</Text>
            </View>
            <View className="flex-row items-center mr-3">
              <View className="w-3 h-3 rounded-full bg-green-500" />
              <Text className="text-xs text-gray-600 ml-1">强热带风暴</Text>
            </View>
            <View className="flex-row items-center mr-3">
              <View className="w-3 h-3 rounded-full bg-yellow-500" />
              <Text className="text-xs text-gray-600 ml-1">台风</Text>
            </View>
            <View className="flex-row items-center mr-3">
              <View className="w-3 h-3 rounded-full bg-red-500" />
              <Text className="text-xs text-gray-600 ml-1">强台风</Text>
            </View>
          </ScrollView>
          
          {/* 当前台风信息 */}
          <View className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-3 border border-red-100">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-gray-500 mb-1">当前位置</Text>
                <Text className="text-sm font-bold text-gray-800">
                  22.3°N, 120.0°E
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-gray-500 mb-1">强度等级</Text>
                <Text className="text-sm font-bold text-red-600">
                  台风 (TY)
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
