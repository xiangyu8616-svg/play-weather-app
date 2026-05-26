import React, { useMemo } from 'react';
import { View, Text, Slider } from 'react-native';

/**
 * 台风路径可视化组件
 * 
 * 功能:
 * - 在地球仪上叠加台风轨迹线
 * - 时间轴滑块控制
 * - 台风强度标记（颜色区分）
 */
interface TyphoonTrackProps {
  selectedDay: number;
  onTimeChange?: (timeIndex: number) => void;
}

// 台风强度等级定义
const TYPHOON_INTENSITY = {
  '热带低压': { color: '#4B5563', label: 'TD', wind: '< 63 km/h' },
  '热带风暴': { color: '#3B82F6', label: 'TS', wind: '63-87 km/h' },
  '强热带风暴': { color: '#10B981', label: 'STS', wind: '88-117 km/h' },
  '台风': { color: '#F59E0B', label: 'TY', wind: '118-149 km/h' },
  '强台风': { color: '#EF4444', label: 'STY', wind: '150-183 km/h' },
  '超强台风': { color: '#7C3AED', label: 'SuperTY', wind: '≥ 184 km/h' },
};

// 模拟台风路径数据（实际应从 API 获取）
const generateTyphoonData = () => {
  // 模拟一个从东南向西北移动的台风路径
  const path = [
    { lat: 18.5, lng: 125.0, intensity: '热带低压', time: 0 },
    { lat: 19.2, lng: 124.0, intensity: '热带风暴', time: 6 },
    { lat: 20.0, lng: 123.0, intensity: '热带风暴', time: 12 },
    { lat: 20.8, lng: 122.0, intensity: '强热带风暴', time: 18 },
    { lat: 21.5, lng: 121.0, intensity: '台风', time: 24 },
    { lat: 22.3, lng: 120.0, intensity: '台风', time: 30 },
    { lat: 23.0, lng: 119.0, intensity: '强台风', time: 36 },
    { lat: 23.8, lng: 118.0, intensity: '强台风', time: 42 },
    { lat: 24.5, lng: 117.0, intensity: '台风', time: 48 },
    { lat: 25.2, lng: 116.0, intensity: '热带风暴', time: 54 },
    { lat: 26.0, lng: 115.0, intensity: '热带低压', time: 60 },
  ];
  
  return path;
};

export default function TyphoonTrack({ selectedDay, onTimeChange }: TyphoonTrackProps) {
  const typhoonPath = useMemo(() => generateTyphoonData(), []);
  
  // 当前时间索引（根据 selectedDay 计算）
  const currentTimeIndex = Math.min((selectedDay - 1) * 24, 60);
  
  // 生成 HTML 代码用于在地球仪上显示台风路径
  const typhoonHTML = useMemo(() => {
    const pathData = JSON.stringify(typhoonPath);
    const currentTime = currentTimeIndex;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; overflow: hidden; background: transparent; }
    #globe { width: 100vw; height: 100vh; }
    .typhoon-label { 
      font-family: Arial, sans-serif; 
      font-size: 12px; 
      color: white; 
      background: rgba(0,0,0,0.7); 
      padding: 4px 8px; 
      border-radius: 4px;
    }
  </style>
  <script src="//unpkg.com/globe.gl"></script>
  <script src="//unpkg.com/three"></script>
</head>
<body>
  <div id="globe"></div>
  <script>
    const typhoonPath = ${pathData};
    const currentTime = ${currentTime};
    
    // 强度颜色映射
    const intensityColors = {
      '热带低压': '#4B5563',
      '热带风暴': '#3B82F6',
      '强热带风暴': '#10B981',
      '台风': '#F59E0B',
      '强台风': '#EF4444',
      '超强台风': '#7C3AED'
    };
    
    // 过滤当前时间之前的路径点
    const visiblePath = typhoonPath.filter(p => p.time <= currentTime);
    
    // 创建地球仪（透明背景）
    const globe = Globe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .showAtmosphere(false)
      .backgroundColor('rgba(0,0,0,0)')
      (document.getElementById('globe'));
    
    // 隐藏地球，只显示路径
    globe.showAtmosphere(false);
    
    // 添加路径线
    if (visiblePath.length > 1) {
      const latlngs = visiblePath.map(p => [p.lat, p.lng]);
      
      globe
        .arcsData([{
          startLat: latlngs[0][0],
          startLng: latlngs[0][1],
          endLat: latlngs[latlngs.length - 1][0],
          endLng: latlngs[latlngs.length - 1][1],
          color: intensityColors[visiblePath[visiblePath.length - 1].intensity] || '#EF4444',
          strokeWidth: 2,
          arcStroke: 2,
          arcDashLength: 1,
          arcDashGap: 0.5,
          arcDashAnimateTime: 2000
        }]);
    }
    
    // 添加路径点标记
    globe
      .pointsData(visiblePath)
      .pointLat('lat')
      .pointLng('lng')
      .pointColor(d => intensityColors[d.intensity] || '#EF4444')
      .pointAltitude(0.01)
      .pointRadius(0.3)
      .pointLabel(d => \`\${d.intensity}\\n风速：\${intensityColors[d.intensity] ? '查看图例' : ''}\`);
    
    // 添加当前台风位置标记（最大的点）
    const currentPosition = visiblePath[visiblePath.length - 1];
    if (currentPosition) {
      globe
        .ringsData([{
          lat: currentPosition.lat,
          lng: currentPosition.lng,
          color: intensityColors[currentPosition.intensity] || '#EF4444',
          maxRadius: 2,
          propagationSpeed: 0.5,
          repeatPeriod: 1000
        }])
        .ringMaxRadius('maxRadius')
        .ringPropagationSpeed('propagationSpeed')
        .ringColor(d => d.color);
    }
    
    // 设置相机角度
    globe.pointOfView({ lat: 22, lng: 120, altitude: 2.5 }, 1000);
    
    // 通知 React Native 已加载
    window.parent.postMessage({ type: 'typhoonLoaded' }, '*');
  </script>
</body>
</html>
    `;
  }, [typhoonPath, currentTimeIndex]);
  
  return (
    <View className="bg-white rounded-2xl shadow-soft p-4 border border-gray-100">
      {/* 台风信息卡片 */}
      <View className="mb-4">
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
          <View className="px-3 py-1.5 rounded-full bg-primary-50">
            <Text className="text-xs font-bold text-primary-600">
              第 {selectedDay} 天
            </Text>
          </View>
        </View>
        
        {/* 强度图例 */}
        <View className="flex-row flex-wrap mb-3">
          {Object.entries(TYPHOON_INTENSITY).map(([name, data]) => (
            <View key={name} className="flex-row items-center mr-3 mb-2">
              <View 
                className="w-3 h-3 rounded-full mr-1.5" 
                style={{ backgroundColor: data.color }}
              />
              <Text className="text-xs text-gray-600">{name}</Text>
            </View>
          ))}
        </View>
        
        {/* 时间轴滑块 */}
        <View className="mb-2">
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-gray-500">时间进度</Text>
            <Text className="text-xs font-semibold text-primary-600">
              {currentTimeIndex} 小时
            </Text>
          </View>
        </View>
        
        {/* 当前台风信息 */}
        {typhoonPath.length > 0 && (
          <View className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-3 border border-red-100">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-gray-500 mb-1">当前位置</Text>
                <Text className="text-sm font-bold text-gray-800">
                  {typhoonPath[Math.min(Math.floor(currentTimeIndex / 6), typhoonPath.length - 1)]?.lat.toFixed(1)}°N, 
                  {typhoonPath[Math.min(Math.floor(currentTimeIndex / 6), typhoonPath.length - 1)]?.lng.toFixed(1)}°E
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-gray-500 mb-1">强度等级</Text>
                <Text className="text-sm font-bold text-red-600">
                  {typhoonPath[Math.min(Math.floor(currentTimeIndex / 6), typhoonPath.length - 1)]?.intensity || '未知'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
      
      {/* 嵌入式地球仪 WebView（简化版） */}
      <View className="h-48 rounded-xl overflow-hidden border border-gray-200">
        {/* 这里可以使用 WebView 渲染上面的 typhoonHTML */}
        <View className="flex-1 bg-blue-50 items-center justify-center">
          <Text className="text-gray-400">台风路径地球仪视图</Text>
          <Text className="text-xs text-gray-400 mt-1">（集成到 GlobeView 中）</Text>
        </View>
      </View>
    </View>
  );
}
