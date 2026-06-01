import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FadeInView from '../../components/animations/FadeInView';
import PhotoCard from '../../components/community/PhotoCard';

/**
 * 社区页面 - 用户实拍分享
 * 功能：
 * - 用户作品信息流
 * - 标签筛选
 * - 点赞评论
 * - 预报 vs 实拍对比
 */
export default function CommunityScreen() {
  // 当前选中的标签
  const [selectedTag, setSelectedTag] = useState('全部');

  // 扩展模拟用户作品数据 (8-12 条)
  const posts = [
    {
      id: 1,
      user: '摄影师小王',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
      location: '梅里雪山·飞来寺',
      time: '2 小时前',
      image: `https://picsum.photos/300/${400 + (1 % 3) * 50}?random=1`,
      forecast: 85,
      actual: 95,
      level: '史诗级',
      likes: 128,
      comments: 23,
      description: '提前一天看到预报，专门赶过来，果然没失望！金山持续时间约 15 分钟，太震撼了！',
    },
    {
      id: 2,
      user: '户外老张',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
      location: '贡嘎雪山·冷嘎措',
      time: '5 小时前',
      image: `https://picsum.photos/300/${300 + (2 % 3) * 50}?random=2`,
      forecast: 65,
      actual: 80,
      level: '优秀',
      likes: 89,
      comments: 15,
      description: '云量比预报多一点，但金山还是看到了，值了！',
    },
    {
      id: 3,
      user: '追光者李四',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
      location: '南迦巴瓦峰·索松村',
      time: '昨天',
      image: `https://picsum.photos/300/${200 + (3 % 3) * 50}?random=3`,
      forecast: 45,
      actual: 60,
      level: '良好',
      likes: 156,
      comments: 31,
      description: '十人九不遇的南迦巴瓦，今天居然看到了！运气爆棚！',
    },
    {
      id: 4,
      user: '旅行达人张三',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
      location: '珠穆朗玛峰·绒布寺',
      time: '2 天前',
      image: `https://picsum.photos/300/${400 + (4 % 3) * 50}?random=4`,
      forecast: 70,
      actual: 75,
      level: '优秀',
      likes: 234,
      comments: 45,
      description: '珠峰日照金山，人生必打卡清单完成！',
    },
    {
      id: 5,
      user: '登山者阿五',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5',
      location: '稻城亚丁·央迈勇',
      time: '3 天前',
      image: `https://picsum.photos/300/${300 + (5 % 3) * 50}?random=5`,
      forecast: 55,
      actual: 72,
      level: '优秀',
      likes: 176,
      comments: 28,
      description: '三神山同框，概率不高但值得蹲守！',
    },
    {
      id: 6,
      user: '风光摄影师六',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6',
      location: '四姑娘山·双桥沟',
      time: '4 天前',
      image: `https://picsum.photos/300/${200 + (6 % 3) * 50}?random=6`,
      forecast: 40,
      actual: 58,
      level: '良好',
      likes: 92,
      comments: 17,
      description: '幺妹峰若隐若现，云海翻腾太美了',
    },
    {
      id: 7,
      user: '徒步爱好者七',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=7',
      location: '黄山·光明顶',
      time: '5 天前',
      image: `https://picsum.photos/300/${400 + (7 % 3) * 50}?random=7`,
      forecast: 75,
      actual: 88,
      level: '天花板',
      likes: 312,
      comments: 56,
      description: '黄山云海，天下第一奇景！',
    },
    {
      id: 8,
      user: '摄影师八号',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=8',
      location: '牛背山·观景台',
      time: '1 周前',
      image: `https://picsum.photos/300/${300 + (8 % 3) * 50}?random=8`,
      forecast: 60,
      actual: 82,
      level: '天花板',
      likes: 267,
      comments: 41,
      description: '360 度观景平台，云海日出尽收眼底',
    },
  ];

  // 标签列表（扩展）
  const tags = ['全部', '梅里雪山', '贡嘎', '南迦巴瓦', '珠穆朗玛', '稻城', '四姑娘山', '黄山', '牛背山'];

  // Filter posts by selected tag
  const filteredPosts = useMemo(() => {
    if (selectedTag === '全部') return posts;
    return posts.filter(post => post.location.includes(selectedTag));
  }, [selectedTag, posts]);

  // Memoized render function for FlatList items
  const renderPost = useCallback(({ item, index }) => (
    <PhotoCard
      index={index}
      user={item.user}
      avatar={item.avatar}
      location={item.location}
      time={item.time}
      imageUrl={item.image}
      forecast={item.forecast}
      actual={item.actual}
      level={item.level}
      likes={item.likes}
      comments={item.comments}
      description={item.description}
    />
  ), []);

  return (
    <View className="flex-1" style={{ backgroundColor: '#0F0D1E' }}>
      {/* 顶部搜索栏 - 深色主题 */}
      <View className="px-4 pt-12 pb-3">
        <View className="flex-row items-center">
          <View 
            className="flex-1 px-4 py-3.5 rounded-2xl flex-row items-center"
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              shadowColor: '#DAA520',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.35)" />
            <Text className="ml-2 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>搜索用户/地点/标签</Text>
          </View>
          <TouchableOpacity 
            className="ml-3 w-12 h-12 rounded-2xl items-center justify-center"
            style={{
              backgroundColor: 'rgba(218,165,32,0.15)',
              borderWidth: 1,
              borderColor: 'rgba(218,165,32,0.25)',
            }}
          >
            <Ionicons name="camera" size={24} color="#DAA520" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 标签筛选 - 深色主题 */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="px-4 py-3"
      >
        {tags.map((tag, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setSelectedTag(tag)}
            activeOpacity={0.7}
            className="px-4 py-2 rounded-full mr-2"
            style={{
              backgroundColor: selectedTag === tag ? 'rgba(218,165,32,0.18)' : 'rgba(255,255,255,0.05)',
              borderWidth: 1,
              borderColor: selectedTag === tag ? 'rgba(218,165,32,0.3)' : 'rgba(255,255,255,0.06)',
              shadowColor: selectedTag === tag ? '#DAA520' : 'transparent',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: selectedTag === tag ? 0.2 : 0,
              shadowRadius: 8,
              elevation: selectedTag === tag ? 8 : 0,
            }}
          >
            <Text 
              className="text-xs font-semibold"
              style={{ 
                color: selectedTag === tag ? '#E8C547' : 'rgba(255,255,255,0.5)' 
              }}
            >
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 作品信息流 - 使用 FlatList 虚拟化长列表 */}
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}
        renderItem={renderPost}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews={true}
        ListFooterComponent={
          <View className="py-6 items-center">
            <Text className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>加载更多...</Text>
          </View>
        }
      />

      {/* 悬浮发布按钮 FAB */}
      <FadeInView delay={300} duration={500}>
        <TouchableOpacity
          activeOpacity={0.8}
          className="absolute rounded-full items-center justify-center"
          style={{
            bottom: 100,
            right: 20,
            width: 56,
            height: 56,
            backgroundColor: '#DAA520',
            shadowColor: '#DAA520',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 12,
          }}
        >
          <Ionicons name="camera" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </FadeInView>
    </View>
  );
}
