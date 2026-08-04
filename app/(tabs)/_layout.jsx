import React from 'react';
import { Platform, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EarthIcon, PartlySunnyIcon, CameraIcon, PersonIcon } from '../../components/icons/TabIcons';
import { Accent, TextColor, auroraAlpha } from '../../styles/designTokens';
import { useI18n } from '../../services/i18n';

/**
 * 底部导航布局 — v2.1 Aurora 极光主题
 * 选中态带极光光晕，图标呼吸感
 */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: Accent.aurora,
        tabBarInactiveTintColor: 'rgba(148, 163, 184, 0.45)',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(11, 11, 16, 0.92)',
          borderTopWidth: 1,
          borderTopColor: auroraAlpha(0.08),
          paddingBottom: isIOS ? 8 + insets.bottom : 8,
          paddingTop: 8,
          height: isIOS ? 64 + insets.bottom : 64,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          // 极光底部微光
          shadowColor: Accent.aurora,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.5,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          minHeight: 44,
        },
        // 自定义 Tab 图标容器 — 选中时添加光晕背景
        tabBarIcon: ({ focused, color, size }) => {
          let Icon;
          switch (route.name) {
            case 'index':
              Icon = EarthIcon;
              break;
            case 'forecast':
              Icon = PartlySunnyIcon;
              break;
            case 'community':
              Icon = CameraIcon;
              break;
            case 'profile':
              Icon = PersonIcon;
              break;
            default:
              Icon = EarthIcon;
          }
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {focused && (
                <View
                  style={{
                    position: 'absolute',
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: auroraAlpha(0.08),
                    shadowColor: Accent.aurora,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                  }}
                />
              )}
              <Icon size={focused ? size + 1 : size} color={color} />
            </View>
          );
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
        }}
      />
      <Tabs.Screen
        name="forecast"
        options={{
          title: t('tabs.forecast'),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: t('tabs.community'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
        }}
      />
    </Tabs>
  );
}
