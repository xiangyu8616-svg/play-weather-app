import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Switch, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getProbabilityColor } from '../../utils/colors';
import FadeInView from '../../components/animations/FadeInView';

/**
 * 个人中心页面 - 毛玻璃深色主题
 */
export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [probabilityAlert, setProbabilityAlert] = useState(true);
  const [dailyForecast, setDailyForecast] = useState(false);

  const user = {
    name: '追光者',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
    level: 'Lv.5 资深摄影师',
    works: 12,
    favorites: 8,
    followers: 320,
  };

  const favoriteLocations = [
    { name: '梅里雪山·飞来寺', probability: 85, level: '史诗级' },
    { name: '贡嘎雪山·冷嘎措', probability: 62, level: '良好' },
    { name: '南迦巴瓦峰·索松村', probability: 45, level: '一般' },
  ];

  // 光晕脉动
  const haloOpacity = useRef(new Animated.Value(0.3)).current;
  const haloRadius = useRef(new Animated.Value(60)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(haloOpacity, { toValue: 0.55, duration: 2000, useNativeDriver: false }),
          Animated.timing(haloOpacity, { toValue: 0.3, duration: 2000, useNativeDriver: false }),
        ]),
        Animated.sequence([
          Animated.timing(haloRadius, { toValue: 80, duration: 2000, useNativeDriver: false }),
          Animated.timing(haloRadius, { toValue: 60, duration: 2000, useNativeDriver: false }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const glassCard = {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  };

  return (
    <View className="flex-1" style={{ backgroundColor: '#0F0D1E' }}>
      <StatusBar style="light" />

      {/* 光晕装饰 */}
      <Animated.View className="absolute top-10 right-0 w-40 h-40"
        style={{
          backgroundColor: 'transparent',
          shadowColor: '#DAA520',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: haloOpacity,
          shadowRadius: haloRadius,
          elevation: 30,
        }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* 用户信息头部 */}
          <FadeInView delay={0} duration={400}>
            <View className="mx-4 mt-4 p-5 rounded-3xl" style={glassCard}>
              <View className="flex-row items-center">
                <View className="relative">
                  <Image
                    source={{ uri: user.avatar }}
                    style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: 'rgba(218,165,32,0.3)' }}
                  />
                  <View className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full items-center justify-center"
                    style={{ backgroundColor: '#DAA520' }}>
                    <Text className="text-xs">⭐</Text>
                  </View>
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-white text-xl font-bold">{user.name}</Text>
                  <Text className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{user.level}</Text>
                  <View className="flex-row mt-3">
                    {[
                      { num: user.works, label: '作品' },
                      { num: user.favorites, label: '收藏' },
                      { num: user.followers, label: '粉丝' },
                    ].map((item, i) => (
                      <View key={i} className="items-center mr-5">
                        <Text className="text-white text-base font-bold">{item.num}</Text>
                        <Text className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <TouchableOpacity
                  className="px-4 py-2 rounded-full"
                  style={{ backgroundColor: 'rgba(218,165,32,0.15)', borderWidth: 1, borderColor: 'rgba(218,165,32,0.2)' }}
                >
                  <Text style={{ color: '#DAA520', fontWeight: '600', fontSize: 13 }}>编辑</Text>
                </TouchableOpacity>
              </View>
            </View>
          </FadeInView>

          {/* 我的收藏 */}
          <FadeInView delay={100} duration={400}>
            <View className="mx-4 mt-5">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white text-base font-bold">⭐ 我的收藏</Text>
                <TouchableOpacity>
                  <Text className="text-sm font-medium" style={{ color: '#DAA520' }}>查看全部</Text>
                </TouchableOpacity>
              </View>
              {favoriteLocations.map((loc, i) => {
                const probColor = getProbabilityColor(loc.probability);
                return (
                  <TouchableOpacity key={i} className="rounded-xl p-4 mb-3" style={glassCard}>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-white text-base font-semibold">{loc.name}</Text>
                        <View className="flex-row items-center mt-1.5">
                          <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>今日概率：</Text>
                          <Text className="text-lg font-bold" style={{ color: probColor }}>{loc.probability}%</Text>
                          <View className="ml-3 px-2.5 py-0.5 rounded-full"
                            style={{ backgroundColor: `${probColor}20` }}>
                            <Text className="text-xs font-medium" style={{ color: probColor }}>{loc.level}</Text>
                          </View>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.25)" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FadeInView>

          {/* 通知设置 */}
          <FadeInView delay={200} duration={400}>
            <View className="mx-4 mt-5">
              <Text className="text-white text-base font-bold mb-3">🔔 通知设置</Text>
              <View className="rounded-2xl overflow-hidden" style={glassCard}>
                {[
                  { label: '通知推送', desc: '接收重要天气预警和概率提醒', val: notificationsEnabled, set: setNotificationsEnabled },
                  { label: '高概率预警', desc: '收藏地点概率>70% 时推送', val: probabilityAlert, set: setProbabilityAlert },
                  { label: '每日预报', desc: '每天早上 8 点推送今日预报', val: dailyForecast, set: setDailyForecast },
                ].map((item, i, arr) => (
                  <View key={i} className={`flex-row items-center justify-between p-4 ${i < arr.length - 1 ? '' : ''}`}
                    style={i < arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' } : {}}>
                    <View className="flex-1 mr-3">
                      <Text className="text-white text-sm font-medium">{item.label}</Text>
                      <Text className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.desc}</Text>
                    </View>
                    <Switch
                      value={item.val}
                      onValueChange={item.set}
                      trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#DAA520' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                ))}
              </View>
            </View>
          </FadeInView>

          {/* 其他功能 */}
          <FadeInView delay={300} duration={400}>
            <View className="mx-4 mt-5">
              <View className="rounded-2xl overflow-hidden" style={glassCard}>
                {[
                  { icon: 'star', title: '我的作品', sub: '查看我的实拍分享' },
                  { icon: 'cloud-download', title: '离线地图', sub: '下载景点离线数据' },
                  { icon: 'help-circle', title: '帮助与反馈', sub: '遇到问题？联系我们' },
                  { icon: 'shield-checkmark', title: '隐私政策', sub: '查看隐私保护政策' },
                  { icon: 'information-circle', title: '关于我们', sub: '版本号 v1.0.0' },
                ].map((item, i, arr) => (
                  <TouchableOpacity key={i} className="flex-row items-center justify-between p-4"
                    style={i < arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' } : {}}>
                    <View className="flex-row items-center flex-1">
                      <View className="w-9 h-9 rounded-full items-center justify-center"
                        style={{ backgroundColor: 'rgba(218,165,32,0.12)' }}>
                        <Ionicons name={item.icon} size={20} color="#DAA520" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-white text-sm font-medium">{item.title}</Text>
                        <Text className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.sub}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.2)" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </FadeInView>

          {/* 退出登录 */}
          <View className="mx-4 mt-6 mb-3">
            <TouchableOpacity className="rounded-2xl p-4 items-center"
              style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' }}>
              <View className="flex-row items-center">
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                <Text className="ml-2 text-red-400 font-medium text-sm">退出登录</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 底部 */}
          <View className="py-5 items-center">
            <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>玩天气 · 预见金山不负此行</Text>
            <Text className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.15)' }}>© 2026 PlayWeather Team</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
