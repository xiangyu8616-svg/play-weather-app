import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  // 模拟用户作品数据（后续替换为真实数据）
  const posts = [
    {
      id: 1,
      user: '摄影师小王',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
      location: '梅里雪山·飞来寺',
      time: '2 小时前',
      image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
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
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
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
      image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800',
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
      image: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?w=800',
      forecast: 70,
      actual: 75,
      level: '优秀',
      likes: 234,
      comments: 45,
      description: '珠峰日照金山，人生必打卡清单完成！',
    },
  ];

  // 标签列表
  const tags = ['全部', '梅里雪山', '贡嘎', '南迦巴瓦', '珠穆朗玛', '稻城三神山'];

  return (
    <View className="flex-1 bg-gray-50">
      {/* 顶部搜索栏 */}
      <View className="px-4 pt-12 pb-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center">
          <View className="flex-1 bg-gray-50 px-4 py-3 rounded-xl flex-row items-center">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <Text className="ml-2 text-gray-400">搜索用户/地点/标签</Text>
          </View>
          <TouchableOpacity className="ml-3 p-3 bg-primary-500 rounded-xl">
            <Ionicons name="camera" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 标签筛选 */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="bg-white px-4 py-3 border-b border-gray-100"
      >
        {tags.map((tag, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setSelectedTag(tag)}
            className={`px-4 py-2 rounded-full mr-2 ${
              selectedTag === tag 
                ? 'bg-primary-500' 
                : 'bg-gray-100'
            }`}
          >
            <Text 
              className={`text-sm font-medium ${
                selectedTag === tag ? 'text-white' : 'text-gray-700'
              }`}
            >
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 作品信息流 */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {posts.map((post) => (
          <View key={post.id} className="bg-white mb-4 border-b border-gray-100 pb-4">
            {/* 用户信息 */}
            <View className="flex-row items-center px-4 pt-4 pb-3">
              <Image 
                source={{ uri: post.avatar }} 
                style={{ width: 40, height: 40, borderRadius: 20 }}
              />
              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-gray-800">{post.user}</Text>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="location" size={14} color="#9CA3AF" />
                  <Text className="text-xs text-gray-500 ml-1">{post.location}</Text>
                  <Text className="text-xs text-gray-400 ml-2">• {post.time}</Text>
                </View>
              </View>
              <TouchableOpacity>
                <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* 作品图片 */}
            <Image 
              source={{ uri: post.image }}
              style={{ width: '100%', height: 300 }}
              resizeMode="cover"
            />

            {/* 预报 vs 实拍对比 */}
            <View className="px-4 py-3 bg-gradient-to-r from-primary-50 to-white">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs text-gray-500">预报概率</Text>
                  <Text className="text-lg font-bold text-primary-600">{post.forecast}%</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="#9CA3AF" />
                <View>
                  <Text className="text-xs text-gray-500">实际效果</Text>
                  <Text className="text-lg font-bold text-green-600">{post.actual}%</Text>
                </View>
                <View 
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: post.actual >= 80 ? '#FF6B35' : post.actual >= 60 ? '#FFA500' : '#DAA520' }}
                >
                  <Text className="text-xs font-bold text-white">{post.level}</Text>
                </View>
              </View>
            </View>

            {/* 描述 */}
            <View className="px-4 mt-3">
              <Text className="text-sm text-gray-700">{post.description}</Text>
            </View>

            {/* 互动按钮 */}
            <View className="flex-row items-center px-4 mt-3">
              <TouchableOpacity className="flex-row items-center mr-6">
                <Ionicons name="heart-outline" size={24} color="#9CA3AF" />
                <Text className="ml-2 text-sm text-gray-600">{post.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center mr-6">
                <Ionicons name="chatbubble-outline" size={24} color="#9CA3AF" />
                <Text className="ml-2 text-sm text-gray-600">{post.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center">
                <Ionicons name="share-outline" size={24} color="#9CA3AF" />
                <Text className="ml-2 text-sm text-gray-600">分享</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* 底部加载更多 */}
        <View className="py-6 items-center">
          <Text className="text-sm text-gray-500">加载更多...</Text>
        </View>
      </ScrollView>
    </View>
  );
}
