import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

/**
 * 淡入动画组件
 * 封装 Animated.View，mount 时从下方 20px 淡入
 * 
 * @param {React.ReactNode} children - 子组件
 * @param {number} delay - 延迟时间 (ms)，默认 0
 * @param {number} duration - 动画时长 (ms)，默认 400
 */
export default function FadeInView({ children, delay = 0, duration = 400 }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateAnim, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, fadeAnim, translateAnim]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: translateAnim }],
      }}
    >
      {children}
    </Animated.View>
  );
}
