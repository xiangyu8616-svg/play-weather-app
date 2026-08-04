import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import qweatherService from '../services/weather/qweatherService';
import { useSavedLocationsStore } from '../stores/savedLocationsStore';
import { useI18n } from '../services/i18n';
import {
  Bg, Accent, TextColor, Spacing, Radius,
  FontSize, FontWeight, auroraAlpha, whiteAlpha,
  CardStyle,
} from '../styles/designTokens';

// 热门城市
const HOT_CITIES = [
  { name: '北京', id: '101010100', lat: 39.9042, lon: 116.4074 },
  { name: '上海', id: '101020100', lat: 31.2304, lon: 121.4737 },
  { name: '广州', id: '101280101', lat: 23.1291, lon: 113.2644 },
  { name: '深圳', id: '101280601', lat: 22.5431, lon: 114.0579 },
  { name: '成都', id: '101270101', lat: 30.5728, lon: 104.0668 },
  { name: '杭州', id: '101210101', lat: 30.2741, lon: 120.1551 },
  { name: '武汉', id: '101200101', lat: 30.5928, lon: 114.3055 },
  { name: '西安', id: '101110101', lat: 34.3416, lon: 108.9398 },
  { name: '重庆', id: '101040100', lat: 29.5630, lon: 106.5516 },
  { name: '南京', id: '101190101', lat: 32.0603, lon: 118.7969 },
  { name: '哈尔滨', id: '101050101', lat: 45.8038, lon: 126.5350 },
  { name: '漠河', id: '101050703', lat: 52.9721, lon: 122.5363 },
];

// 极光观测热门城市
const AURORA_CITIES = [
  { name: '漠河', id: '101050703', lat: 52.9721, lon: 122.5363, kp: 3 },
  { name: '哈尔滨', id: '101050101', lat: 45.8038, lon: 126.5350, kp: 5 },
  { name: '长春', id: '101060101', lat: 43.8171, lon: 125.3235, kp: 5 },
  { name: '沈阳', id: '101070101', lat: 41.8057, lon: 123.4315, kp: 6 },
  { name: '乌鲁木齐', id: '101130101', lat: 43.8256, lon: 87.6168, kp: 5 },
  { name: '呼和浩特', id: '101080101', lat: 40.8414, lon: 111.7519, kp: 7 },
  { name: '拉萨', id: '101140101', lat: 29.6500, lon: 91.1000, kp: 6 },
  { name: '西宁', id: '101150101', lat: 36.6171, lon: 101.7782, kp: 7 },
];

export default function CityListScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { locations: savedLocations, init: initSaved, toggle: toggleSaved } = useSavedLocationsStore();
  const { t } = useI18n();

  // 初始化收藏 store（本地快照 + 登录后云端合并）
  useEffect(() => { initSaved(); }, []);

  const isSaved = (id) => savedLocations.some((l) => l.id === id);

  const search = useCallback(async (text) => {
    if (!text || text.trim().length < 1) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const cities = await qweatherService.searchCity(text, 15);
      setResults(cities);
    } catch (err) {
      console.error('搜索失败:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (city) => {
    Keyboard.dismiss();
    // 通过 router 返回并传递选中城市
    // 由于 Expo Router 不支持直接传参返回，我们使用全局状态或存储
    // 这里简化处理：存储到 AsyncStorage 或全局变量
    if (typeof global !== 'undefined') {
      global.__selectedCity = city;
    }
    router.back();
  };

  const renderCityItem = ({ item }) => (
    <TouchableOpacity style={styles.cityItem} onPress={() => handleSelect(item)} activeOpacity={0.7}>
      <View style={styles.cityItemLeft}>
        <Ionicons name="location-outline" size={18} color={Accent.aurora} />
        <View style={styles.cityItemInfo}>
          <Text style={styles.cityItemName}>{item.name}</Text>
          <Text style={styles.cityItemMeta}>
            {item.adm1 || ''} {item.adm2 || ''}
          </Text>
        </View>
      </View>
      <View style={styles.cityItemRight}>
        {item.kp && (
          <View style={styles.kpBadge}>
            <Text style={styles.kpBadgeText}>Kp{item.kp}</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.starBtn}
          onPress={() => toggleSaved(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isSaved(item.id) ? 'star' : 'star-outline'}
            size={20}
            color={isSaved(item.id) ? Accent.star : TextColor.muted}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={[Bg.primary, '#0a1018']} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.container} edges={['top']}>

        {/* 顶部导航 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={TextColor.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('cityList.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* 搜索框 */}
        <View style={styles.searchWrap}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search" size={18} color={TextColor.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('cityList.searchPlaceholder')}
              placeholderTextColor={TextColor.muted}
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={TextColor.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 搜索结果或推荐列表 */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Accent.aurora} />
          </View>
        ) : hasSearched ? (
          results.length > 0 ? (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={renderCityItem}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            <View style={styles.emptyWrap}>
              <Ionicons name="search-outline" size={48} color={TextColor.muted} />
              <Text style={styles.emptyText}>{t('cityList.notFound')}</Text>
            </View>
          )
        ) : (
          <FlatList
            data={[
              ...(savedLocations.length > 0 ? [{ title: t('cityList.mySaved'), data: savedLocations }] : []),
              { title: t('cityList.auroraHot'), data: AURORA_CITIES },
              { title: t('cityList.hotCities'), data: HOT_CITIES },
            ]}
            keyExtractor={(item) => item.title}
            renderItem={({ item }) => (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{item.title}</Text>
                <View style={styles.grid}>
                  {item.data.map((city) => (
                    <TouchableOpacity
                      key={city.id}
                      style={styles.gridItem}
                      onPress={() => handleSelect(city)}
                      activeOpacity={0.7}
                    >
                      <TouchableOpacity
                        style={styles.gridStarBtn}
                        onPress={(e) => { e?.stopPropagation?.(); toggleSaved(city); }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name={isSaved(city.id) ? 'star' : 'star-outline'}
                          size={12}
                          color={isSaved(city.id) ? Accent.star : 'rgba(255,255,255,0.25)'}
                        />
                      </TouchableOpacity>
                      <Text style={styles.gridItemName}>{city.name}</Text>
                      {city.kp && (
                        <Text style={styles.gridItemKp}>Kp{city.kp}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: 'rgba(18,18,26,0.60)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.semiBold,
    color: TextColor.primary,
  },

  searchWrap: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(18,18,26,0.80)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 0.5,
    borderColor: auroraAlpha(0.15),
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.body,
    color: TextColor.primary,
    paddingVertical: 4,
  },

  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },

  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semiBold,
    color: TextColor.secondary,
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
  },
  gridItem: {
    backgroundColor: 'rgba(18,18,26,0.60)',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 0.5,
    borderColor: whiteAlpha(0.06),
    alignItems: 'center',
    minWidth: 80,
  },
  gridStarBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20, height: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  gridItemName: {
    fontSize: FontSize.body,
    color: TextColor.primary,
    fontWeight: FontWeight.medium,
  },
  gridItemKp: {
    fontSize: FontSize.micro,
    color: Accent.aurora,
    marginTop: 2,
  },

  cityItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(18,18,26,0.40)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderWidth: 0.5,
    borderColor: whiteAlpha(0.04),
  },
  cityItemLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1,
  },
  cityItemRight: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  starBtn: {
    width: 32, height: 32, borderRadius: Radius.full,
    justifyContent: 'center', alignItems: 'center',
  },
  cityItemInfo: {},
  cityItemName: {
    fontSize: FontSize.body,
    color: TextColor.primary,
    fontWeight: FontWeight.medium,
  },
  cityItemMeta: {
    fontSize: FontSize.caption,
    color: TextColor.muted,
    marginTop: 2,
  },
  kpBadge: {
    backgroundColor: auroraAlpha(0.12),
    borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  kpBadgeText: {
    fontSize: FontSize.micro,
    color: Accent.aurora,
    fontWeight: FontWeight.semiBold,
  },

  loadingWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  emptyWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100,
  },
  emptyText: {
    fontSize: FontSize.body,
    color: TextColor.muted,
    marginTop: Spacing.md,
  },
});
