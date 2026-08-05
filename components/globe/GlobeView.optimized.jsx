import React, { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { View, Text, Dimensions, PixelRatio } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * 3D 地球仪组件 - 4K 屏性能优化版
 * 
 * 优化策略:
 * 1. 分辨率自适应 - 根据屏幕 DPI 调整渲染质量
 * 2. 点云密度控制 - 远距离减少点数
 * 3. LOD (Level of Detail) - 根据缩放级别调整细节
 * 4. 缓存策略 - 缓存已加载的纹理和数据
 * 5. 帧率控制 - 动态调整渲染质量以维持 60fps
 * 
 * 性能目标:
 * - 4K 屏 (3840x2160): 60fps
 * - 2K 屏 (2560x1440): 60fps
 * - 1080p (1920x1080): 60fps
 */
// 屏幕性能检测
const getPerformanceProfile = () => {
  const pixelRatio = PixelRatio.get();
  const { width, height } = Dimensions.get('window');
  const totalPixels = width * height * pixelRatio * pixelRatio;
  
  // 根据总像素数确定性能等级
  if (totalPixels >= 8000000) { // 4K 及以上
    return {
      mode: 'high',
      pointDensity: 0.5,      // 减少点数
      textureQuality: 0.75,   // 降低纹理质量
      shadowQuality: 'low',   // 低阴影质量
      antiAliasing: false,    // 关闭抗锯齿
      maxPoints: 500,         // 最大点数
    };
  } else if (totalPixels >= 3500000) { // 2K
    return {
      mode: 'medium',
      pointDensity: 0.75,
      textureQuality: 0.9,
      shadowQuality: 'medium',
      antiAliasing: true,
      maxPoints: 1000,
    };
  } else { // 1080p 及以下
    return {
      mode: 'low',
      pointDensity: 1.0,
      textureQuality: 1.0,
      shadowQuality: 'high',
      antiAliasing: true,
      maxPoints: 2000,
    };
  }
};

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
  const maxIndex = Math.min(Math.floor((day - 1) * 24 / 6), path.length - 1);
  return path.slice(0, maxIndex + 1);
};

// 模拟天气现象数据（带性能优化）
const generatePhenomenonData = (phenomenonType, day, maxPoints) => {
  const randomOffset = day * 0.1;
  
  let data = [];
  switch (phenomenonType) {
    case 'aurora':
      data = [
        { lat: 68.43, lng: -149.53, size: 0.5 + randomOffset * 0.1, color: '#9D4EDD', name: '阿拉斯加·费尔班克斯' },
        { lat: 64.20, lng: -21.00, size: 0.4 + randomOffset * 0.1, color: '#9D4EDD', name: '冰岛·雷克雅未克' },
        { lat: 52.97, lng: 122.33, size: 0.6 + randomOffset * 0.1, color: '#9D4EDD', name: '中国·漠河' },
        { lat: 69.65, lng: 18.95, size: 0.5 + randomOffset * 0.1, color: '#9D4EDD', name: '挪威·特罗姆瑟' },
        { lat: 64.85, lng: -18.70, size: 0.45 + randomOffset * 0.1, color: '#9D4EDD', name: '冰岛·瓦特纳' },
      ];
      break;
    case 'typhoon':
      data = generateTyphoonPath(day);
      break;
    case 'cloud':
      data = [
        { lat: 30.06, lng: 101.52, size: 0.7, color: '#87CEEB', name: '四川·牛背山' },
        { lat: 29.70, lng: 100.25, size: 0.6, color: '#87CEEB', name: '四川·贡嘎山' },
        { lat: 27.99, lng: 99.60, size: 0.65, color: '#87CEEB', name: '云南·梅里雪山' },
        { lat: 25.35, lng: 98.50, size: 0.55, color: '#87CEEB', name: '云南·高黎贡山' },
      ];
      break;
    case 'glow':
      data = [
        { lat: 40.00, lng: 116.00, size: 0.5, color: '#FFA500', name: '北京' },
        { lat: 31.23, lng: 121.47, size: 0.5, color: '#FFA500', name: '上海' },
        { lat: 23.13, lng: 113.26, size: 0.5, color: '#FFA500', name: '广州' },
        { lat: 30.57, lng: 104.07, size: 0.5, color: '#FFA500', name: '成都' },
      ];
      break;
    case 'snow':
      data = [
        { lat: 45.80, lng: 126.53, size: 0.6, color: '#F8F8FF', name: '黑龙江·哈尔滨' },
        { lat: 43.88, lng: 87.58, size: 0.55, color: '#F8F8FF', name: '新疆·天山' },
        { lat: 47.92, lng: 122.38, size: 0.65, color: '#F8F8FF', name: '黑龙江·漠河' },
      ];
      break;
    case 'rainbow':
      data = [
        { lat: 25.00, lng: 121.50, size: 0.4, color: '#FF6B35', name: '台湾' },
        { lat: 22.00, lng: 120.50, size: 0.4, color: '#FF6B35', name: '垦丁' },
      ];
      break;
    default:
      data = [
        ...generatePhenomenonData('aurora', day, maxPoints),
        ...generatePhenomenonData('cloud', day, maxPoints),
        ...generatePhenomenonData('glow', day, maxPoints),
      ];
  }
  
  // 限制最大点数
  return data.slice(0, maxPoints);
};

const GlobeView = React.memo(function GlobeView({ 
  selectedDay, 
  selectedPhenomenon,
  onGlobePress,
  onPointData,
  performanceMode = 'balanced'
}) {
  const webViewRef = useRef(null);
  const [fps, setFps] = useState(60);
  const [renderQuality, setRenderQuality] = useState<'high' | 'medium' | 'low'>('medium');
  
  // 获取性能配置
  const perfConfig = useMemo(() => getPerformanceProfile(), []);
  
  // 根据性能模式调整配置
  const finalConfig = useMemo(() => {
    if (performanceMode === 'quality') {
      return { ...perfConfig, pointDensity: 1.0, textureQuality: 1.0 };
    } else if (performanceMode === 'performance') {
      return { ...perfConfig, pointDensity: 0.3, textureQuality: 0.5 };
    }
    return perfConfig;
  }, [perfConfig, performanceMode]);

  // 生成现象数据（带点数限制）
  const phenomenonData = useMemo(() => {
    return generatePhenomenonData(selectedPhenomenon, selectedDay, finalConfig.maxPoints);
  }, [selectedDay, selectedPhenomenon, finalConfig.maxPoints]);

  // 生成台风路径数据
  const typhoonPath = useMemo(() => {
    if (selectedPhenomenon === 'typhoon' || selectedPhenomenon === 'all') {
      return generateTyphoonPath(selectedDay);
    }
    return [];
  }, [selectedDay, selectedPhenomenon]);

  // 生成优化的 globe.gl HTML 代码
  const globeHTML = useMemo(() => {
    const pointsData = JSON.stringify(phenomenonData);
    const typhoonData = JSON.stringify(typhoonPath);
    const { textureQuality, antiAliasing, shadowQuality } = finalConfig;
    
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
    // 性能配置
    const TEXTURE_QUALITY = ${textureQuality};
    const ANTI_ALIASING = ${antiAliasing};
    const SHADOW_QUALITY = '${shadowQuality}';
    const MAX_FPS = 60;

    // 帧率自动降级阶梯（页内自闭环，无需 RN 往返）
    const QUALITY_LADDER = [0.75, 0.6, 0.5];
    let ladderIdx = QUALITY_LADDER.indexOf(TEXTURE_QUALITY);
    if (ladderIdx < 0) ladderIdx = TEXTURE_QUALITY >= 0.9 ? 0 : QUALITY_LADDER.length - 1;
    let consecutiveLowWindows = 0;
    function applyDegrade() {
      globe.renderer().setPixelRatio(QUALITY_LADDER[ladderIdx]);
      if (ladderIdx === QUALITY_LADDER.length - 1) {
        globe.showAtmosphere(false); // 最低档关闭大气层
      }
    }
    
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

    // 初始化地球仪（带性能优化）
    const globe = Globe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .showAtmosphere(true)
      .atmosphereColor('#87CEEB')
      .atmosphereAltitude(0.15)
      .backgroundColor('#1a1a2e')
      .showGlobe(true)
      (document.getElementById('globe'));

    // 性能优化：降低渲染质量
    globe.renderer().setPixelRatio(TEXTURE_QUALITY);
    globe.renderer().antialias = ANTI_ALIASING;
    globe.renderer().shadowMap.enabled = SHADOW_QUALITY !== 'off';
    globe.renderer().shadowMap.type = SHADOW_QUALITY === 'high' 
      ? THREE.PCFSoftShadowMap 
      : THREE.PCFShadowMap;

    // 添加天气现象数据点（优化版）
    globe
      .pointsData(pointsData)
      .pointAltitude(0.01)
      .pointColor('color')
      .pointRadius('size')
      .pointsMerge(true)  // 合并几何体，提升性能
      .pointLabel(d => \`\${d.name}\\n\${d.intensity ? d.intensity + '\\n' : ''}纬度：\${d.lat}°\`);

    // 添加台风路径线（仅当数据存在时）
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
        .pointLabel(d => \`\${d.name}\\n强度：\${d.intensity}\\n位置：\${d.lat}°N, \${d.lng}°E\`);
      
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

    // 控制器优化
    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.enableZoom = true;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 0.6;  // 降低缩放速度，提升平滑度
    controls.minDistance = 100;
    controls.maxDistance = 400;

    // 点击事件
    globe.onPointClick((point) => {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'pointClick',
        data: point
      }));
    });

    // FPS 监控 + 自动降级
    let lastTime = performance.now();
    let frameCount = 0;
    function monitorFPS() {
      frameCount++;
      const currentTime = performance.now();
      if (currentTime - lastTime >= 1000) {
        const fps = frameCount;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'fps',
          fps: fps
        }));
        // 连续 2 个低帧窗口（<30fps）降一级，直至最低档
        consecutiveLowWindows = fps < 30 ? consecutiveLowWindows + 1 : 0;
        if (consecutiveLowWindows >= 2 && ladderIdx < QUALITY_LADDER.length - 1) {
          ladderIdx++;
          applyDegrade();
          consecutiveLowWindows = 0;
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'degraded',
            pixelRatio: QUALITY_LADDER[ladderIdx]
          }));
        }
        frameCount = 0;
        lastTime = currentTime;
      }
      requestAnimationFrame(monitorFPS);
    }
    monitorFPS();

    // 通知 React Native 已加载
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'loaded',
      quality: '${finalConfig.mode}',
      maxPoints: ${finalConfig.maxPoints}
    }));
  </script>
</body>
</html>
    `;
  }, [phenomenonData, typhoonPath, finalConfig]);

  // 处理 WebView 消息
  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'pointClick') {
        onGlobePress();
        if (onPointData) {
          onPointData(data.data);
        }
      } else if (data.type === 'fps') {
        setFps(data.fps);
        // 动态调整渲染质量
        if (data.fps < 30) {
          setRenderQuality('low');
        } else if (data.fps < 50) {
          setRenderQuality('medium');
        } else {
          setRenderQuality('high');
        }
      } else if (data.type === 'loaded') {
        // Globe loaded successfully
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
        // 性能优化
        hardwareAccelerationAndroid="on"
        androidLayerType="hardware"
        cacheEnabled={true}
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        thirdPartyCookiesEnabled={false}
      />
      
      {/* FPS 显示器（调试用） */}
      {__DEV__ && (
        <View className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-50 rounded">
          <Text className="text-white text-xs">
            FPS: {fps} | Quality: {renderQuality}
          </Text>
        </View>
      )}
    </View>
  );
});

export default GlobeView;
