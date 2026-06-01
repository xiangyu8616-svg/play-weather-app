import React, { useRef, useMemo, useCallback } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * 3D 地球仪组件
 * 使用 globe.gl 库展示全球天气现象
 * 
 * 功能:
 * - 显示极光、台风、暴雨等现象分布
 * - 支持旋转、缩放
 * - 点击显示详情
 * - 数据层叠加（天气现象标记点）
 */
// 台风路径数据
const generateTyphoonPath = (day) => {
  const path = [
    { lat: 18.5, lng: 125.0, size: 0.4, color: '#4B5563', name: '热带低压', intensity: 'TD' },
    { lat: 19.2, lng: 124.0, size: 0.5, color: '#3B82F6', name: '热带风暴', intensity: 'TS' },
    { lat: 20.0, lng: 123.0, size: 0.5, color: '#3B82F6', name: '热带风暴', intensity: 'TS' },
    { lat: 20.8, lng: 122.0, size: 0.6, color: '#10B981', name: '强热带风暴', intensity: 'STS' },
    { lat: 21.5, lng: 121.0, size: 0.7, color: '#F59E0B', name: '台风', intensity: 'TY' },
    { lat: 22.3, lng: 120.0, size: 0.7, color: '#F59E0B', name: '台风', intensity: 'TY' },
    { lat: 23.0, lng: 119.0, size: 0.8, color: '#EF4444', name: '强台风', intensity: 'STY' },
    { lat: 23.8, lng: 118.0, size: 0.8, color: '#EF4444', name: '强台风', intensity: 'STY' },
    { lat: 24.5, lng: 117.0, size: 0.7, color: '#F59E0B', name: '台风', intensity: 'TY' },
    { lat: 25.2, lng: 116.0, size: 0.5, color: '#3B82F6', name: '热带风暴', intensity: 'TS' },
    { lat: 26.0, lng: 115.0, size: 0.4, color: '#4B5563', name: '热带低压', intensity: 'TD' },
  ];
  // 根据天数返回路径点
  const maxIndex = Math.min(Math.floor((day - 1) * 24 / 6), path.length - 1);
  return path.slice(0, maxIndex + 1);
};

// 模拟天气现象数据（实际应从服务层获取）
const generatePhenomenonData = (phenomenonType, day) => {
  // 根据天数添加一些随机性
  const randomOffset = day * 0.1;
  
  switch (phenomenonType) {
    case 'aurora':
      return [
        { lat: 68.43, lng: -149.53, size: 0.5 + randomOffset * 0.1, color: '#9D4EDD', name: '阿拉斯加·费尔班克斯' },
        { lat: 64.20, lng: -21.00, size: 0.4 + randomOffset * 0.1, color: '#9D4EDD', name: '冰岛·雷克雅未克' },
        { lat: 52.97, lng: 122.33, size: 0.6 + randomOffset * 0.1, color: '#9D4EDD', name: '中国·漠河' },
        { lat: 69.65, lng: 18.95, size: 0.5 + randomOffset * 0.1, color: '#9D4EDD', name: '挪威·特罗姆瑟' },
        { lat: 64.85, lng: -18.70, size: 0.45 + randomOffset * 0.1, color: '#9D4EDD', name: '冰岛·瓦特纳' },
      ];
    case 'typhoon':
      return [
        { lat: 22.5, lng: 120.8, size: 0.8, color: '#FF0000', name: '台风中心', intensity: '强台风' },
        { lat: 21.0, lng: 119.5, size: 0.6, color: '#FF4500', name: '外围云系', intensity: '台风' },
        { lat: 23.5, lng: 121.5, size: 0.7, color: '#FF6347', name: '雨带', intensity: '热带风暴' },
      ];
    case 'cloud':
      return [
        { lat: 30.06, lng: 101.52, size: 0.7, color: '#87CEEB', name: '四川·牛背山' },
        { lat: 29.70, lng: 100.25, size: 0.6, color: '#87CEEB', name: '四川·贡嘎山' },
        { lat: 27.99, lng: 99.60, size: 0.65, color: '#87CEEB', name: '云南·梅里雪山' },
        { lat: 25.35, lng: 98.50, size: 0.55, color: '#87CEEB', name: '云南·高黎贡山' },
      ];
    case 'glow':
      return [
        { lat: 40.00, lng: 116.00, size: 0.5, color: '#FFA500', name: '北京' },
        { lat: 31.23, lng: 121.47, size: 0.5, color: '#FFA500', name: '上海' },
        { lat: 23.13, lng: 113.26, size: 0.5, color: '#FFA500', name: '广州' },
        { lat: 30.57, lng: 104.07, size: 0.5, color: '#FFA500', name: '成都' },
      ];
    case 'snow':
      return [
        { lat: 45.80, lng: 126.53, size: 0.6, color: '#F8F8FF', name: '黑龙江·哈尔滨' },
        { lat: 43.88, lng: 87.58, size: 0.55, color: '#F8F8FF', name: '新疆·天山' },
        { lat: 47.92, lng: 122.38, size: 0.65, color: '#F8F8FF', name: '黑龙江·漠河' },
      ];
    case 'rainbow':
      return [
        { lat: 25.00, lng: 121.50, size: 0.4, color: '#FF6B35', name: '台湾' },
        { lat: 22.00, lng: 120.50, size: 0.4, color: '#FF6B35', name: '垦丁' },
      ];
    default:
      // 全部显示
      return [
        ...generatePhenomenonData('aurora', day),
        ...generatePhenomenonData('cloud', day),
        ...generatePhenomenonData('glow', day),
      ];
  }
};

const GlobeView = React.memo(function GlobeView({ 
  selectedDay, 
  selectedPhenomenon,
  onGlobePress,
  onPointData
}) {
  const webViewRef = useRef(null);

  // 生成现象数据
  const phenomenonData = useMemo(() => {
    return generatePhenomenonData(selectedPhenomenon, selectedDay);
  }, [selectedDay, selectedPhenomenon]);

  // 生成台风路径数据
  const typhoonPath = useMemo(() => {
    if (selectedPhenomenon === 'typhoon' || selectedPhenomenon === 'all') {
      return generateTyphoonPath(selectedDay);
    }
    return [];
  }, [selectedDay, selectedPhenomenon]);

  // 生成 globe.gl 的 HTML 代码
  const globeHTML = useMemo(() => {
    const pointsData = JSON.stringify(phenomenonData);
    const typhoonData = JSON.stringify(typhoonPath);
    
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; overflow: hidden; background: linear-gradient(to bottom, #1a1a2e, #16213e); }
    #globe { width: 100vw; height: 100vh; }
  </style>
  <script src="//unpkg.com/globe.gl"></script>
</head>
<body>
  <div id="globe"></div>
  <script>
    // 现象数据
    const pointsData = ${pointsData};
    const typhoonData = ${typhoonData};

    // 强度颜色映射
    const intensityColors = {
      '热带低压': '#4B5563',
      '热带风暴': '#3B82F6',
      '强热带风暴': '#10B981',
      '台风': '#F59E0B',
      '强台风': '#EF4444',
      '超强台风': '#7C3AED'
    };

    // 初始化地球仪
    const globe = Globe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .showAtmosphere(true)
      .atmosphereColor('#87CEEB')
      .atmosphereAltitude(0.15)
      .backgroundColor('#1a1a2e')
      (document.getElementById('globe'));

    // 添加天气现象数据点
    globe
      .pointsData(pointsData)
      .pointAltitude(0.01)
      .pointColor('color')
      .pointRadius('size')
      .pointsMerge(true)
      .pointLabel(d => \`\${d.name}\\n\${d.intensity ? d.intensity + '\\n' : ''}纬度：\${d.lat}°\`);

    // 添加台风路径线
    if (typhoonData && typhoonData.length > 1) {
      const latlngs = typhoonData.map(p => [p.lat, p.lng]);
      const lastPoint = typhoonData[typhoonData.length - 1];
      
      globe
        .arcsData([{
          startLat: latlngs[0][0],
          startLng: latlngs[0][1],
          endLat: lastPoint.lat,
          endLng: lastPoint.lng,
          color: lastPoint.color || '#EF4444',
          strokeWidth: 2.5,
          arcStroke: 2.5,
          arcDashLength: 1,
          arcDashGap: 0.3,
          arcDashAnimateTime: 2000
        }]);
      
      // 添加台风路径点
      globe
        .pointsData(typhoonData)
        .pointLat('lat')
        .pointLng('lng')
        .pointColor('color')
        .pointAltitude(0.02)
        .pointRadius('size')
        .pointLabel(d => \`\${d.name}\n强度：\${d.intensity}\n位置：\${d.lat}°N, \${d.lng}°E\`);
      
      // 添加当前台风位置环
      globe
        .ringsData([{
          lat: lastPoint.lat,
          lng: lastPoint.lng,
          color: lastPoint.color || '#EF4444',
          maxRadius: 3,
          propagationSpeed: 0.5,
          repeatPeriod: 1000
        }])
        .ringMaxRadius('maxRadius')
        .ringPropagationSpeed('propagationSpeed')
        .ringColor(d => d.color);
    }

    // 自动旋转
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.5;
    globe.controls().enableZoom = true;
    globe.controls().rotateSpeed = 0.8;

    // 点击事件
    globe.onPointClick((point) => {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'pointClick',
        data: point
      }));
    });

    // 通知 React Native 已加载
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'loaded'
    }));
  </script>
</body>
</html>
    `;
  }, [phenomenonData]);

  // 处理 WebView 消息
  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'pointClick') {
        onGlobePress();
        if (onPointData) {
          onPointData(data.data);
        }
      }
    } catch (error) {
      console.error('WebView message error:', error);
    }
  }, [onGlobePress, onPointData]);

  return (
    <View className="flex-1">
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: globeHTML }}
        style={{ flex: 1 }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
});

export default GlobeView;
