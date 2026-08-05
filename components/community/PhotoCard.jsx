import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FadeInView from '../animations/FadeInView';
import { getProbabilityColor } from '../../utils/colors';
import { useI18n } from '../../services/i18n';
import { Accent } from '../../styles/designTokens';

/**
 * 社区照片卡片 - 深色玻璃态主题
 * 显示用户实拍作品、预报 vs 实拍对比（可选）、互动数据
 *
 * v2（ROADMAP 2.9）：图片/对比条可选；点赞按钮支持 liked/onLike；文案走 i18n
 */
const PhotoCard = React.memo(function PhotoCard({
  user,
  avatar,
  location,
  time,
  imageUrl,
  forecast,
  actual,
  likes,
  comments,
  description,
  index = 0,
  liked = false,
  onLike,
  onShare,
}) {
  const { t } = useI18n();
  const hasCompare = typeof forecast === 'number' && typeof actual === 'number';
  const actualColor = hasCompare ? getProbabilityColor(actual) : Accent.star;

  // 质量标签颜色
  const getLevel = (score) => {
    if (score >= 90) return { color: '#FF6B35', key: 'levelEpic' };
    if (score >= 80) return { color: '#FFA500', key: 'levelTop' };
    if (score >= 70) return { color: '#DAA520', key: 'levelGreat' };
    if (score >= 60) return { color: '#E8C547', key: 'levelGood' };
    return { color: '#9CA3AF', key: 'levelNormal' };
  };
  const level = hasCompare ? getLevel(actual) : null;

  // 无图帖子给一个稳定的文字区高度感；有图用种子高度营造瀑布感
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

  const likeColor = liked ? Accent.danger : 'rgba(255,255,255,0.35)';

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
        {/* 照片区域（可选） */}
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: dims.h }}
            resizeMode="cover"
            // @ts-ignore - Web-only lazy loading for images
            loading="lazy"
          />
        ) : null}

        {/* 用户信息 */}
        <View className="flex-row items-center px-4 pt-4 pb-3">
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={{ width: 32, height: 32, borderRadius: 16 }}
            />
          ) : (
            <View style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: 'rgba(238,184,42,0.15)',
              justifyContent: 'center', alignItems: 'center',
            }}>
              <Ionicons name="person" size={16} color="#EEB82A" />
            </View>
          )}
          <View className="ml-3 flex-1">
            <Text className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {user}
            </Text>
            <View className="flex-row items-center mt-0.5">
              {location ? (
                <>
                  <Ionicons name="location" size={12} color="rgba(255,255,255,0.35)" />
                  <Text className="text-xxs ml-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {location}
                  </Text>
                </>
              ) : null}
              <Text className="text-xxs ml-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                • {time}
              </Text>
            </View>
          </View>
        </View>

        {/* 预报 vs 实拍对比条（可选） */}
        {hasCompare && (
          <View className="mx-4 mb-3 rounded-xl p-3" style={{
            backgroundColor: 'rgba(218,165,32,0.08)',
            borderWidth: 1,
            borderColor: 'rgba(218,165,32,0.15)',
          }}>
            <View className="flex-row items-center justify-between mb-2">
              <View>
                <Text className="text-xxs" style={{ color: 'rgba(255,255,255,0.4)' }}>{t('community.forecastProb')}</Text>
                <Text className="text-lg font-bold" style={{ color: '#EEB82A' }}>{forecast}%</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.35)" />
              <View>
                <Text className="text-xxs" style={{ color: 'rgba(255,255,255,0.4)' }}>{t('community.actualEffect')}</Text>
                <Text className="text-lg font-bold" style={{ color: actualColor }}>{actual}%</Text>
              </View>
              <View
                className="px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: level.color + '18',
                  borderWidth: 1,
                  borderColor: level.color + '30',
                }}
              >
                <Text className="text-xxs font-bold" style={{ color: level.color }}>
                  {t(`community.${level.key}`)}
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
        )}

        {/* 描述 */}
        {description ? (
          <View className="px-4 mb-3">
            <Text className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }} numberOfLines={5}>
              {description}
            </Text>
          </View>
        ) : null}

        {/* 互动栏 */}
        <View className="flex-row items-center px-4 py-3" style={{
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.04)'
        }}>
          <TouchableOpacity className="flex-row items-center mr-6" onPress={onLike} activeOpacity={0.7}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={likeColor} />
            <Text className="ml-1.5 text-xs" style={{ color: likeColor }}>{likes}</Text>
          </TouchableOpacity>
          <View className="flex-row items-center mr-6">
            <Ionicons name="chatbubble-outline" size={20} color="rgba(255,255,255,0.35)" />
            <Text className="ml-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{comments}</Text>
          </View>
          <TouchableOpacity className="flex-row items-center flex-1 justify-end" onPress={onShare} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={20} color="rgba(255,255,255,0.35)" />
            <Text className="ml-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{t('community.share')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </FadeInView>
  );
});

export default PhotoCard;
