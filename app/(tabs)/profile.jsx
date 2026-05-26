import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * 个人中心页面
 * 功能：
 * - 用户信息展示
 * - 我的收藏
 * - 通知设置
 * - 关于我们
 */
export default function ProfileScreen() {
  // 通知开关状态
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [probabilityAlert, setProbabilityAlert] = useState(true);
  const [dailyForecast, setDailyForecast] = useState(false);

  // 模拟用户数据
  const user = {
    name: '追光者',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
    level: 'Lv.5 资深摄影师',
    works: 12,
    favorites: 8,
    followers: 320,
  };

  // 收藏的地点
  const favoriteLocations = [
    { name: '梅里雪山·飞来寺', probability: 85, level: '史诗级' },
    { name: '贡嘎雪山·冷嘎措', probability: 62, level: '良好' },
    { name: '南迦巴瓦峰·索松村', probability: 45, level: '一般' },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* 用户信息卡片 */}
      <View className="px-4 pt-12 pb-6 bg-gradient-to-b from-primary-500 to-primary-600">
        <View className="flex-row items-center">
          <Image 
            source={{ uri: user.avatar }} 
            style={{ width: 80, height: 80, borderRadius: 40 }}
          />
          <View className="ml-4 flex-1">
            <Text className="text-white text-2xl font-bold">{user.name}</Text>
            <Text className="text-primary-100 text-sm mt-1">{user.level}</Text>
            <View className="flex-row mt-3">
              <View className="items-center mr-6">
                <Text className="text-white text-lg font-bold">{user.works}</Text>
                <Text className="text-primary-100 text-xs">作品</Text>
              </View>
              <View className="items-center mr-6">
                <Text className="text-white text-lg font-bold">{user.favorites}</Text>
                <Text className="text-primary-100 text-xs">收藏</Text>
              </View>
              <View className="items-center">
                <Text className="text-white text-lg font-bold">{user.followers}</Text>
                <Text className="text-primary-100 text-xs">粉丝</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity className="bg-white/20 px-4 py-2 rounded-full">
            <Text className="text-white font-medium">编辑资料</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 我的收藏 */}
      <View className="px-4 py-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-bold text-gray-800">⭐ 我的收藏</Text>
          <TouchableOpacity>
            <Text className="text-primary-600 text-sm font-medium">查看全部</Text>
          </TouchableOpacity>
        </View>
        
        {favoriteLocations.map((location, index) => (
          <TouchableOpacity 
            key={index}
            className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-800">{location.name}</Text>
                <View className="flex-row items-center mt-2">
                  <Text className="text-sm text-gray-500">今日概率：</Text>
                  <Text 
                    className="text-lg font-bold"
                    style={{ color: location.probability >= 80 ? '#FF6B35' : location.probability >= 60 ? '#FFA500' : '#DAA520' }}
                  >
                    {location.probability}%
                  </Text>
                  <View 
                    className="ml-3 px-3 py-1 rounded-full"
                    style={{ backgroundColor: location.probability >= 80 ? '#FF6B3520' : location.probability >= 60 ? '#FFA50020' : '#DAA52020' }}
                  >
                    <Text 
                      className="text-xs font-medium"
                      style={{ color: location.probability >= 80 ? '#FF6B35' : location.probability >= 60 ? '#FFA500' : '#DAA520' }}
                    >
                      {location.level}
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* 通知设置 */}
      <View className="px-4 py-6 bg-gray-100">
        <Text className="text-lg font-bold text-gray-800 mb-4">🔔 通知设置</Text>
        
        <View className="bg-white rounded-xl overflow-hidden">
          {/* 总开关 */}
          <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-800">通知推送</Text>
              <Text className="text-xs text-gray-500 mt-1">接收重要天气预警和概率提醒</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#D1D5DB', true: '#DAA520' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* 概率预警 */}
          <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-800">高概率预警</Text>
              <Text className="text-xs text-gray-500 mt-1">收藏地点概率&gt;70% 时推送</Text>
            </View>
            <Switch
              value={probabilityAlert}
              onValueChange={setProbabilityAlert}
              trackColor={{ false: '#D1D5DB', true: '#DAA520' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* 每日预报 */}
          <View className="flex-row items-center justify-between p-4">
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-800">每日预报</Text>
              <Text className="text-xs text-gray-500 mt-1">每天早上 8 点推送今日预报</Text>
            </View>
            <Switch
              value={dailyForecast}
              onValueChange={setDailyForecast}
              trackColor={{ false: '#D1D5DB', true: '#DAA520' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

      {/* 其他功能 */}
      <View className="px-4 py-6">
        <View className="bg-white rounded-xl overflow-hidden">
          {[
            { icon: 'star', title: '我的作品', subtitle: '查看我的实拍分享' },
            { icon: 'cloud-download', title: '离线地图', subtitle: '下载景点离线数据' },
            { icon: 'help-circle', title: '帮助与反馈', subtitle: '遇到问题？联系我们' },
            { icon: 'shield-checkmark', title: '隐私政策', subtitle: '查看隐私保护政策' },
            { icon: 'information-circle', title: '关于我们', subtitle: '版本号 v1.0.0' },
          ].map((item, index) => (
            <TouchableOpacity 
              key={index}
              className={`flex-row items-center justify-between p-4 ${
                index < 4 ? 'border-b border-gray-100' : ''
              }`}
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-primary-50 items-center justify-center">
                  <Ionicons name={item.icon} size={22} color="#DAA520" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-base font-medium text-gray-800">{item.title}</Text>
                  <Text className="text-xs text-gray-500 mt-1">{item.subtitle}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 退出登录按钮 */}
      <View className="px-4 py-6">
        <TouchableOpacity className="bg-white border-2 border-red-500 rounded-xl p-4 items-center">
          <View className="flex-row items-center">
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text className="ml-2 text-red-500 font-medium">退出登录</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 底部版权信息 */}
      <View className="px-4 py-6 items-center">
        <Text className="text-xs text-gray-400">玩天气 · 预见金山不负此行</Text>
        <Text className="text-xs text-gray-400 mt-1">© 2026 PlayWeather Team</Text>
      </View>
    </ScrollView>
  );
}
