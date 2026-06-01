import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Dimensions, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { hexToRgb } from '../../utils/colors';
import qweatherService from '../../services/qweatherService';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlobeControls from '../../components/globe/GlobeControls';
import WeatherCard from '../../components/weather/WeatherCard';
import FadeInView from '../../components/animations/FadeInView';

const { width } = Dimensions.get('window');

// Metro 自动选择：Web 平台用 GlobeView.web.jsx，Native 用 GlobeView.optimized.jsx
import GlobeView from '../../components/globe/GlobeView';

/**
 * 首页 - 毛玻璃深色主题
 * 设计语言：深色星空背景 + 半透明玻璃态卡片 + 金色光晕
 */
export default function HomeScreen() {
  // 原有状态
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedPhenomenon, setSelectedPhenomenon] = useState('all');
  const [showGlobeDetail, setShowGlobeDetail] = useState(false);
  const [isRotating, setIsRotating] = useState(true);
  const [selectedPointData, setSelectedPointData] = useState(null);
  const [showTyphoonPanel, setShowTyphoonPanel] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // 新增：搜索和天气状态
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCity, setCurrentCity] = useState({ name: '北京', id: '101010100' });
  const [nowWeather, setNowWeather] = useState(null);
  const [dailyForecast, setDailyForecast] = useState([]);
  const searchInputRef = useRef(null);

  // 光晕脉动动画
  const haloOpacity1 = useRef(new Animated.Value(0.3)).current;
  const haloRadius1 = useRef(new Animated.Value(60)).current;
  const haloOpacity2 = useRef(new Animated.Value(0.4)).current;
  const haloRadius2 = useRef(new Animated.Value(70)).current;

  // 加载天气数据
  useEffect(() => {
    loadWeatherData(currentCity.id);
  }, []);

  // 加载城市天气数据
  const loadWeatherData = async (locationId) => {
    try {
      setIsLoading(true);
      const [weather, forecast] = await Promise.all([
        qweatherService.getNowWeather(locationId),
        qweatherService.getDailyForecast(locationId),
      ]);
      setNowWeather(weather);
      setDailyForecast(forecast);
    } catch (error) {
      console.error('加载天气数据失败:', error);
      // 使用 Mock 数据
      setNowWeather(qweatherService.generateMockNowWeather());
      setDailyForecast(qweatherService.generateMockDailyForecast());
    } finally {
      setIsLoading(false);
    }
  };

  // 搜索城市
  const handleSearch = async (query) => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setIsLoading(true);
      const cities = await qweatherService.searchCity(query, 5);
      setSearchResults(cities);
      setShowSearchResults(true);
    } catch (error) {
      console.error('搜索城市失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 选择城市
  const handleSelectCity = (city) => {
    setCurrentCity(city);
    setShowSearchResults(false);
    setSearchQuery('');
    loadWeatherData(city.id);
  };

  // 光晕脉动动画
  useEffect(() => {
    const pulse1 = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(haloOpacity1, { toValue: 0.6, duration: 2000, useNativeDriver: false }),
          Animated.timing(haloRadius1, { toValue: 80, duration: 2000, useNativeDriver: false }),
        ]),
        Animated.parallel([
          Animated.timing(haloOpacity1, { toValue: 0.3, duration: 2000, useNativeDriver: false }),
          Animated.timing(haloRadius1, { toValue: 50, duration: 2000, useNativeDriver: false }),
        ]),
      ])
    );
    const pulse2 = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(haloOpacity2, { toValue: 0.6, duration: 2000, duration: 2000, useNativeDriver: false }),
          Animated.timing(haloRadius2, { toValue: 80, duration: 2000, useNativeDriver: false }),
        ]),
        Animated.parallel([
          Animated.timing(haloOpacity2, { toValue: 0.4, duration: 2000, useNativeDriver: false }),
          Animated.timing(haloRadius2, { toValue: 60, duration: 2000, useNativeDriver: false }),
        ]),
      ])
    );
    pulse1.start();
    pulse2.start();
  }, []);

  // 天气自适应背景色和光晕色
  const themeColors = useMemo(() => {
    const themes = {
      all: { from: '#0F0D1E', to: '#1a1030', glowColor: '#DAA520' },
      aurora: { from: '#0D1B2A', to: '#1B0A3E', glowColor: '#00FF7F' },
      typhoon: { from: '#1A0D0D', to: '#2D1B1B', glowColor: '#FF4444' },
      cloud: { from: '#0D1420', to: '#1A2A3E', glowColor: '#87CEEB' },
      glow: { from: '#1A100A', to: '#3D1F0A', glowColor: '#FFA500' },
      snow: { from: '#0D1520', to: '#1A2535', glowColor: '#E8E8FF' },
      rainbow: { from: '#100D1E', to: '#1A1530', glowColor: '#FF6B35' },
    };
    return themes[selectedPhenomenon] || themes.all;
  }, [selectedPhenomenon]);

  // 台风相关状态
  const [typhoonList, setTyphoonList] = useState([]);
  const [selectedTyphoon, setSelectedTyphoon] = useState(null);
  const [typhoonTrack, setTyphoonTrack] = useState([]);

  // 加载台风数据
  useEffect(() => {
    if (selectedPhenomenon === 'typhoon' || selectedPhenomenon === 'all') {
      loadTyphoonData();
    }
  }, [selectedPhenomenon]);

  const loadTyphoonData = async () => {
    try {
      const typhoons = await qweatherService.getTyphoonList('NP');
      setTyphoonList(typhoons);
      if (typhoons.length > 0) {
        setSelectedTyphoon(typhoons[0]);
        const track = await qweatherService.getTyphoonTrack(typhoons[0].stormId);
        setTyphoonTrack(track);
      }
    } catch (error) {
      console.error('加载台风数据失败:', error);
    }
  };

  const handleDayChange = (day) => setSelectedDay(day);
  const handlePhenomenonChange = async (p) => {
    setSelectedPhenomenon(p);
    setShowTyphoonPanel(p === 'typhoon' || p === 'all');
    if (p === 'typhoon') {
      await loadTyphoonData();
    }
  };
  const handleRotateToggle = () => setIsRotating(!isRotating);
  const handleGlobePress = () => setShowGlobeDetail(true);
  const handlePointData = (data) => { setSelectedPointData(data); setShowGlobeDetail(true); };

  return (
    <View className="flex-1" style={{
      backgroundImage: `linear-gradient(to bottom, ${themeColors.from}, ${themeColors.to})`,
    }}>
      <StatusBar style="light" />

      {/* ===== 背景光晕装饰（带脉动动画） ===== */}
      <Animated.View className="absolute top-0 right-0 w-48 h-48 opacity-40" style={{
        backgroundColor: 'transparent',
        shadowColor: themeColors.glowColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: haloOpacity1,
        shadowRadius: haloRadius1,
        elevation: 40,
      }} />
      <Animated.View className="absolute bottom-1/3 left-0 w-40 h-40 opacity-30" style={{
        backgroundColor: 'transparent',
        shadowColor: themeColors.glowColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: haloOpacity2,
        shadowRadius: haloRadius2,
        elevation: 30,
      }} />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* ===== 顶部栏 ===== */}
        <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
          <View>
            <Text className="text-white text-xl font-bold tracking-wide">玩天气</Text>
            <Text className="text-glass-text-dim text-xs mt-0.5">全球天气现象预报</Text>
          </View>
          <TouchableOpacity 
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        {/* ===== 玻璃态搜索栏（带边缘光） ===== */}
        <View className="px-5 py-3">
          <View
            className="flex-row items-center px-4 py-3.5 rounded-2xl"
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderWidth: 1,
              borderColor: `rgba(${hexToRgb(themeColors.glowColor)}, 0.15)`,
              shadowColor: themeColors.glowColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.35)" />
            <TextInput
              ref={searchInputRef}
              className="flex-1 ml-3 text-sm"
              style={{ color: 'rgba(255,255,255,0.8)' }}
              placeholder="搜索城市/景点/现象"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => searchQuery.trim() && handleSearch(searchQuery)}
              onSubmitEditing={() => handleSearch(searchQuery)}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isLoading && (
              <ActivityIndicator size="small" color="#DAA520" className="mr-2" />
            )}
            <TouchableOpacity
              onPress={() => handleSelectCity(currentCity)}
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(218,165,32,0.15)' }}
            >
              <Ionicons name="location" size={16} color="#DAA520" />
            </TouchableOpacity>
          </View>

          {/* 搜索结果显示 */}
          {showSearchResults && searchResults.length > 0 && (
            <View className="absolute top-20 left-5 right-5 rounded-2xl overflow-hidden"
              style={{
                backgroundColor: 'rgba(15,13,30,0.98)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 10,
                maxHeight: 300,
              }}
            >
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="flex-row items-center px-4 py-3"
                    style={{ borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.05)' }}
                    onPress={() => handleSelectCity(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="location-outline" size={18} color="rgba(255,255,255,0.5)" />
                    <View className="ml-3 flex-1">
                      <Text className="text-white text-sm font-medium">{item.name}</Text>
                      <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {item.adm1} {item.adm2}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        {/* ===== 地球仪区域 ===== */}
        <View className="flex-1 min-h-[280px]">
          {GlobeView ? (
            <GlobeView
              selectedDay={selectedDay}
              selectedPhenomenon={selectedPhenomenon}
              onGlobePress={handleGlobePress}
              onPointData={handlePointData}
            />
          ) : (
            /* Web 平台：玻璃态地球仪占位 */
            <View className="flex-1 items-center justify-center">
              <View className="relative">
                {/* 外层光晕 */}
                <View className="absolute -inset-8 rounded-full opacity-30" style={{
                  backgroundColor: 'transparent',
                  shadowColor: '#DAA520',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.5,
                  shadowRadius: 60,
                  elevation: 30,
                }} />
                {/* 地球仪圆 */}
                <View className="w-48 h-48 rounded-full items-center justify-center"
                  style={{
                    borderWidth: 2,
                    borderColor: 'rgba(218,165,32,0.2)',
                    backgroundImage: 'radial-gradient(circle at 40% 40%, rgba(218,165,32,0.25), rgba(100,60,0,0.08))',
                    shadowColor: '#DAA520',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.3,
                    shadowRadius: 50,
                    elevation: 20,
                  }}
                >
                  <Text className="text-6xl">🌍</Text>
                </View>
              </View>
              <Text className="text-white text-base font-semibold mt-6 opacity-80">3D 地球仪</Text>
              <Text className="text-white text-xs mt-1 opacity-40">手机端查看完整 3D 效果</Text>
            </View>
          )}

          {/* 浮动天气卡片 */}
          {showGlobeDetail && (
            <View className="absolute top-4 right-4 left-4 z-10">
              <WeatherCard
                location={selectedPointData?.name || nowWeather?.text || "梅里雪山·飞来寺"}
                probability={selectedPointData?.size ? Math.round(selectedPointData.size * 100) : 85}
                level={selectedPointData?.intensity || "史诗级"}
                sunrise="07:23"
                onClose={() => setShowGlobeDetail(false)}
              />
            </View>
          )}

          {/* 实时天气卡片 */}
          {nowWeather && !showGlobeDetail && (
            <View className="absolute top-4 right-4 left-4 z-10">
              <View className="rounded-2xl p-4"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 10,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Ionicons name="location" size={14} color="rgba(255,255,255,0.5)" />
                      <Text className="text-white text-sm font-medium ml-1">{currentCity.name}</Text>
                    </View>
                    <Text className="text-white text-3xl font-bold mt-2">{nowWeather.temp}°</Text>
                    <Text className="text-white text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {nowWeather.text} · 体感{nowWeather.feelsLike}°
                    </Text>
                  </View>
                  <View className="items-end">
                    <Ionicons name="partly-sunny" size={48} color="#DAA520" />
                    <Text className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {nowWeather.windDir} {nowWeather.windScale}级
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ===== 底部控制面板（带淡入动画） ===== */}
        <FadeInView delay={100} duration={500}>
          <GlobeControls
            selectedDay={selectedDay}
            selectedPhenomenon={selectedPhenomenon}
            onDayChange={handleDayChange}
            onPhenomenonChange={handlePhenomenonChange}
            onRotateToggle={handleRotateToggle}
            isRotating={isRotating}
          />
        </FadeInView>

        {/* ===== 台风面板（带淡入动画） ===== */}
        {showTyphoonPanel && selectedPhenomenon === 'typhoon' && (
          <FadeInView delay={150} duration={500}>
          <View className="absolute bottom-0 left-4 right-4 rounded-t-3xl p-5 pb-8"
            style={{
              backgroundColor: 'rgba(15,13,30,0.95)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 20,
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,0,0,0.15)' }}>
                  <Text className="text-xl">🌀</Text>
                </View>
                <View className="ml-3">
                  <Text className="text-white text-base font-bold">台风路径</Text>
                  <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>实时追踪 • 预报路径</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowTyphoonPanel(false)}
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              >
                <Ionicons name="close" size={18} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>

            {/* 强度图例 */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {[
                { color: '#6B7280', label: '热带低压' },
                { color: '#3B82F6', label: '热带风暴' },
                { color: '#22C55E', label: '强热带风暴' },
                { color: '#EAB308', label: '台风' },
                { color: '#EF4444', label: '强台风' },
              ].map((item) => (
                <View key={item.label} className="flex-row items-center mr-4">
                  <View className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <Text className="ml-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.label}</Text>
                </View>
              ))}
            </ScrollView>

            {/* 台风列表选择 */}
            {typhoonList.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                {typhoonList.map((typhoon) => (
                  <TouchableOpacity
                    key={typhoon.stormId}
                    className="px-4 py-2 mr-2 rounded-full"
                    style={{
                      backgroundColor: selectedTyphoon?.stormId === typhoon.stormId ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                      borderWidth: 1,
                      borderColor: selectedTyphoon?.stormId === typhoon.stormId ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)',
                    }}
                    onPress={async () => {
                      setSelectedTyphoon(typhoon);
                      const track = await qweatherService.getTyphoonTrack(typhoon.stormId);
                      setTyphoonTrack(track);
                    }}
                  >
                    <Text className="text-sm font-medium" style={{ color: selectedTyphoon?.stormId === typhoon.stormId ? '#EF4444' : 'rgba(255,255,255,0.6)' }}>
                      {typhoon.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* 当前台风信息 */}
            {selectedTyphoon && typhoonTrack.length > 0 ? (
              <>
                <View className="rounded-2xl p-4 mb-3" style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)' }}>
                  <View className="flex-row justify-between">
                    <View>
                      <Text className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>当前位置</Text>
                      <Text className="text-sm font-bold text-white">
                        {typhoonTrack[typhoonTrack.length - 1]?.lat}°N, {typhoonTrack[typhoonTrack.length - 1]?.lon}°E
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>强度等级</Text>
                      <Text className="text-sm font-bold text-red-400">{selectedTyphoon.name} ({selectedTyphoon.maxWindSpeed}m/s)</Text>
                    </View>
                  </View>
                </View>
                
                {/* 路径点数 */}
                <View className="flex-row items-center justify-between px-1">
                  <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    路径点：{typhoonTrack.length} 个
                  </Text>
                  <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    最低气压：{selectedTyphoon.minPressure}hPa
                  </Text>
                </View>
              </>
            ) : (
              <View className="rounded-2xl p-4 items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <Text className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>暂无台风数据</Text>
              </View>
            )}
          </View>
          </FadeInView>
        )}
      </SafeAreaView>
    </View>
  );
}
