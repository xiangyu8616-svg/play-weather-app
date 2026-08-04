import React, { useState, useCallback, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuroraSplash from '../components/splash/AuroraSplash';
import { useI18n } from '../services/i18n';

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);
  const i18nInit = useI18n((s) => s.init);

  // 启动时恢复语言设置（全局一次，幂等）
  useEffect(() => { i18nInit(); }, []);

  const handleSplashComplete = useCallback(() => {
    setSplashDone(true);
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="light" />
      {!splashDone && <AuroraSplash onComplete={handleSplashComplete} />}
    </SafeAreaProvider>
  );
}
