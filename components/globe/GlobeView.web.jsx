import React, { useRef, useMemo, useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  GLOBE_QUALITY_LADDER, initialQualityIndex, nextDegradeIndex, shouldDegrade,
} from '../../services/performance/deviceTier';

/**
 * 3D 地球仪组件 - Web 平台专用版本
 * 使用纯 Three.js + globe.gl 渲染，不使用 WebView
 * 
 * 功能特性:
 * 1. 3D 地球仪：蓝色地球纹理 + 拓扑凹凸贴图 + 大气层
 * 2. 天气现象点：pointsData 显示极光/台风/云海等标记点
 * 3. 台风路径线：arcsData 弧线 + ringsData 当前位置环
 * 4. 自动旋转：controls.autoRotate
 * 5. 缩放交互：鼠标滚轮缩放
 * 6. 点击事件：点击标记点回调 onPointData
 * 7. 响应式：跟随容器大小自适应
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
  const maxIndex = Math.min(Math.floor((day - 1) * 24 / 6), path.length - 1);
  return path.slice(0, maxIndex + 1);
};

// 模拟天气现象数据
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
  const containerRef = useRef(null);
  const globeRef = useRef(null);
  const fpsRafIdRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 根据性能模式配置点数
  const maxPoints = useMemo(() => {
    if (performanceMode === 'quality') return 2000;
    if (performanceMode === 'performance') return 500;
    return 1000; // balanced
  }, [performanceMode]);

  // 生成现象数据
  const phenomenonData = useMemo(() => {
    return generatePhenomenonData(selectedPhenomenon, selectedDay, maxPoints);
  }, [selectedDay, selectedPhenomenon, maxPoints]);

  // 生成台风路径数据
  const typhoonPath = useMemo(() => {
    if (selectedPhenomenon === 'typhoon' || selectedPhenomenon === 'all') {
      return generateTyphoonPath(selectedDay);
    }
    return [];
  }, [selectedDay, selectedPhenomenon]);

  // 初始化地球仪
  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    // 动态加载 globe.gl 脚本
    const loadGlobeScript = () => {
      return new Promise((resolve, reject) => {
        // 检查是否已经加载
        if (window.Globe) {
          resolve();
          return;
        }

        // 创建 script 标签加载 globe.gl
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/globe.gl';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load globe.gl'));
        document.head.appendChild(script);
      });
    };

    const initGlobe = async () => {
      try {
        await loadGlobeScript();
        
        if (!isMounted || !containerRef.current) return;

        const Globe = window.Globe;
        if (!Globe) {
          throw new Error('Globe.gl not loaded');
        }

        // 初始化地球仪
        const globe = Globe()
          .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
          .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
          .showAtmosphere(true)
          .atmosphereColor('#87CEEB')
          .atmosphereAltitude(0.15)
          .backgroundColor('#0F0D1E')
          .showGlobe(true)
          (containerRef.current);

        globeRef.current = globe;

        // 初始质量：按性能模式取阶梯起点并应用（像素比 + 大气层）
        let qualityIndex = initialQualityIndex(performanceMode);
        const applyQuality = (idx) => {
          const step = GLOBE_QUALITY_LADDER[idx];
          globe.renderer().setPixelRatio(step.pixelRatio);
          globe.showAtmosphere(step.atmosphere);
        };
        applyQuality(qualityIndex);

        // 帧率检测自动降级：2 秒一个窗口，连续 2 个窗口 <30fps 降一级，直至最低档
        let fpsFrameCount = 0;
        let fpsWindowStart = performance.now();
        let consecutiveLowWindows = 0;
        const fpsMonitor = () => {
          if (!isMounted) return;
          fpsFrameCount++;
          const now = performance.now();
          const elapsed = now - fpsWindowStart;
          if (elapsed >= 2000) {
            const avgFps = (fpsFrameCount * 1000) / elapsed;
            consecutiveLowWindows = avgFps < 30 ? consecutiveLowWindows + 1 : 0;
            if (shouldDegrade(avgFps, consecutiveLowWindows)) {
              const next = nextDegradeIndex(qualityIndex);
              if (next == null) return; // 已到最低档，停止监控
              qualityIndex = next;
              applyQuality(qualityIndex);
              consecutiveLowWindows = 0;
            }
            fpsFrameCount = 0;
            fpsWindowStart = now;
          }
          fpsRafIdRef.current = requestAnimationFrame(fpsMonitor);
        };
        fpsRafIdRef.current = requestAnimationFrame(fpsMonitor);

        // 控制器设置
        const controls = globe.controls();
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.enableZoom = true;
        controls.rotateSpeed = 0.8;
        controls.zoomSpeed = 0.6;
        controls.minDistance = 100;
        controls.maxDistance = 400;

        // 点击事件处理
        globe.onPointClick((point) => {
          if (onGlobePress) {
            onGlobePress();
          }
          if (onPointData) {
            onPointData(point);
          }
        });

        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to initialize globe:', error);
      }
    };

    initGlobe();

    // 清理函数
    return () => {
      isMounted = false;
      if (fpsRafIdRef.current != null) {
        cancelAnimationFrame(fpsRafIdRef.current);
        fpsRafIdRef.current = null;
      }
      if (globeRef.current) {
        // 清理 Three.js 资源
        const globe = globeRef.current;
        if (globe._scene) {
          globe._scene.traverse((object) => {
            if (object.geometry) {
              object.geometry.dispose();
            }
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((m) => m.dispose());
              } else {
                object.material.dispose();
              }
            }
          });
        }
        if (globe.renderer()) {
          globe.renderer().dispose();
        }
        globeRef.current = null;
      }
    };
  }, []); // 只在 mount 时初始化一次

  // 更新数据（当 selectedDay 或 selectedPhenomenon 变化时）
  useEffect(() => {
    if (!globeRef.current || !isLoaded) return;

    const globe = globeRef.current;

    // 更新天气现象点
    globe.pointsData(phenomenonData)
      .pointAltitude(0.01)
      .pointColor('color')
      .pointRadius('size')
      .pointsMerge(true)
      .pointLabel((d) => `${d.name}\n${d.intensity ? d.intensity + '\n' : ''}纬度：${d.lat}°`);

    // 更新台风路径
    if (typhoonPath && typhoonPath.length > 1) {
      const lastPoint = typhoonPath[typhoonPath.length - 1];
      
      // 添加弧线路径
      globe.arcsData([{
        startLat: typhoonPath[0].lat,
        startLng: typhoonPath[0].lng,
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
      globe.pointsData(typhoonPath)
        .pointLat('lat')
        .pointLng('lng')
        .pointColor('color')
        .pointAltitude(0.02)
        .pointRadius('size')
        .pointLabel((d: any) => `${d.name}\n强度：${d.intensity}\n位置：${d.lat}°N, ${d.lng}°E`);

      // 添加当前台风位置环
      globe.ringsData([{
        lat: lastPoint.lat,
        lng: lastPoint.lng,
        color: lastPoint.color || '#EF4444',
        maxRadius: 3,
        propagationSpeed: 0.5,
        repeatPeriod: 1000
      }])
      .ringMaxRadius('maxRadius')
      .ringPropagationSpeed('propagationSpeed')
      .ringColor((d) => d.color);
    } else {
      // 清除台风相关数据
      globe.arcsData([]);
      globe.ringsData([]);
    }
  }, [selectedDay, selectedPhenomenon, isLoaded]);

  // 处理容器大小变化
  useEffect(() => {
    if (!containerRef.current || !globeRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (globeRef.current && containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        globeRef.current.width(width);
        globeRef.current.height(height);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isLoaded]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0F0D1E' }}>
      {/* Web 平台使用 div 容器 */}
      <div 
        ref={containerRef}
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '400px'
        }}
      />
      {!isLoaded && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#fff',
          fontSize: '14px'
        }}>
          正在加载地球仪...
        </div>
      )}
    </View>
  );
});

export default GlobeView;
