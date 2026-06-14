import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EarthIcon, PartlySunnyIcon, CameraIcon, PersonIcon } from '../../components/icons/TabIcons';

/**
 * 底部导航布局
 * Note: Expo Router automatically code-splits each tab route file.
 * Additional lazy loading is applied within individual tab components
 * for their heavy dependencies (images, third-party libs, etc.)
 */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#DAA520',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(15,13,30,0.85)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(218,165,32,0.12)',
          paddingBottom: isIOS ? 6 + insets.bottom : 6,
          paddingTop: 6,
          height: isIOS ? 58 + insets.bottom : 58,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          // 毛玻璃效果
          backdropFilter: 'blur(20px)',
          shadowColor: '#DAA520',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          // Ensure touch target ≥ 44px
          minHeight: 44,
        },
      }}
    >
      {/* 首页 - 地球仪 */}
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color, size }) => (
            <EarthIcon size={size} color={color} />
          ),
          headerTitle: '玩天气',
        }}
      />

      {/* 预报页 */}
      <Tabs.Screen
        name="forecast"
        options={{
          title: '预报',
          tabBarIcon: ({ color, size }) => (
            <PartlySunnyIcon size={size} color={color} />
          ),
          headerTitle: '天气预报',
        }}
      />

      {/* 社区页 */}
      <Tabs.Screen
        name="community"
        options={{
          title: '社区',
          tabBarIcon: ({ color, size }) => (
            <CameraIcon size={size} color={color} />
          ),
          headerTitle: '实拍社区',
        }}
      />

      {/* 个人页 */}
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color, size }) => (
            <PersonIcon size={size} color={color} />
          ),
          headerTitle: '个人中心',
        }}
      />
    </Tabs>
  );
}
