import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FadeInView from '../animations/FadeInView';
import { getProbabilityColor } from '../../utils/colors';

/**
 * 社区照片卡片 - 深色玻璃态主题
 * 显示用户实拍作品、预报 vs 实拍对比、互动数据
 */
const PhotoCard = React.memo(function PhotoCard({ 
  user,
  avatar,
  location,
  time,
  imageUrl,
  forecast,
  actual,
  level,
  likes,
  comments,
  description,
  index = 0
}) {
  const actualColor = getProbabilityColor(actual);
  
  // 质量标签颜色
  const getLevelColor = (score) => {
    if (score >= 90) return { bg: '#FF6B35', text: '#FF6B35', label: '史诗级' };
    if (score >= 80) return { bg: '#FFA500', text: '#FFA500', label: '天花板' };
    if (score >= 70) return { bg: '#DAA520', text: '#DAA520', label: '优秀' };
    if (score >= 60) return { bg: '#E8C547', text: '#E8C547', label: '良好' };
    return { bg: '#9CA3AF', text: '#9CA3AF', label: '一般' };
  };

  const levelColors = getLevelColor(actual);

  // 生成随机图片尺寸 (300x400, 300x300, 300x200)
  const getImageDimensions = (seed) => {
    const sizes = [
      { w: 300, h: 400 },
      { w: 300, h: 300 },
      { w: 300, h: 200 },
      { w: 300, h: 350 },
    ];
    return sizes[seed % sizes.length];
  };

  const dims = getImageDimensions(index);

  return (
    <FadeInView delay={index * 100} duration={500}>
      <View className="rounded-2xl overflow-hidden mb-4" style={{
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      }}>
        {/* 照片区域 */}
        <Image 
          source={{ uri: imageUrl }}
          style={{ width: '100%', height: dims.h }}
          resizeMode="cover"
          // @ts-ignore - Web-only lazy loading for images
          loading="lazy"
        />

        {/* 用户信息 */}
        <View className="flex-row items-center px-4 pt-4 pb-3">
          <Image 
            source={{ uri: avatar }} 
            style={{ width: 32, height: 32, borderRadius: 16 }}
          />
          <View className="ml-3 flex-1">
            <Text className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {user}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <Ionicons name="location" size={12} color="rgba(255,255,255,0.35)" />
              <Text className="text-xxs ml-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {location}
              </Text>
              <Text className="text-xxs ml-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                • {time}
              </Text>
            </View>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={18} color="rgba(255,255,255,0.35)" />
          </TouchableOpacity>
        </View>

        {/* 预报 vs 实拍对比条 */}
        <View className="mx-4 mb-3 rounded-xl p-3" style={{
          backgroundColor: 'rgba(218,165,32,0.08)',
          borderWidth: 1,
          borderColor: 'rgba(218,165,32,0.15)',
        }}>
          <View className="flex-row items-center justify-between mb-2">
            <View>
              <Text className="text-xxs" style={{ color: 'rgba(255,255,255,0.4)' }}>预报概率</Text>
              <Text className="text-lg font-bold" style={{ color: '#EEB82A' }}>{forecast}%</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.35)" />
            <View>
              <Text className="text-xxs" style={{ color: 'rgba(255,255,255,0.4)' }}>实际效果</Text>
              <Text className="text-lg font-bold" style={{ color: actualColor }}>{actual}%</Text>
            </View>
            <View 
              className="px-2 py-0.5 rounded-full"
              style={{ 
                backgroundColor: levelColors.bg + '18',
                borderWidth: 1,
                borderColor: levelColors.text + '30',
              }}
            >
              <Text className="text-xxs font-bold" style={{ color: levelColors.text }}>
                {levelColors.label}
              </Text>
            </View>
          </View>
          
          {/* 进度条 */}
          <View style={{ 
            height: 4, 
            backgroundColor: 'rgba(255,255,255,0.08)', 
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <View style={{ 
              width: `${actual}%`, 
              height: '100%', 
              backgroundColor: actualColor,
              borderRadius: 2,
            }} />
          </View>
        </View>

        {/* 描述 */}
        {description && (
          <View className="px-4 mb-3">
            <Text className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }} numberOfLines={3}>
              {description}
            </Text>
          </View>
        )}

        {/* 互动栏 */}
        <View className="flex-row items-center px-4 py-3" style={{ 
          borderTopWidth: 1, 
          borderTopColor: 'rgba(255,255,255,0.04)' 
        }}>
          <TouchableOpacity className="flex-row items-center mr-6">
            <Ionicons name="heart-outline" size={20} color="rgba(255,255,255,0.35)" />
            <Text className="ml-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center mr-6">
            <Ionicons name="chatbubble-outline" size={20} color="rgba(255,255,255,0.35)" />
            <Text className="ml-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center flex-1 justify-end">
            <Ionicons name="share-outline" size={20} color="rgba(255,255,255,0.35)" />
            <Text className="ml-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>分享</Text>
          </TouchableOpacity>
        </View>
      </View>
    </FadeInView>
  );
});

export default PhotoCard;
