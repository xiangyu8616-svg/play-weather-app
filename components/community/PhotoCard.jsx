import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FadeInView from '../animations/FadeInView';
import { getProbabilityColor } from '../../utils/colors';
import { useI18n } from '../../services/i18n';
import { Accent } from '../../styles/designTokens';

/**
 * 社区照片卡片 - 深色玻璃态主题
 * 显示用户实拍作品、预报 vs 实拍对比（可选）、互动数据
 *
 * v2（ROADMAP 2.9）：图片与对比条可选；点赞按钮支持 liked/onLike；文案走 i18n；
 * 布局全部使用 StyleSheet（NativeWind className 在 web 构建不生效）
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

  // 有图用种子高度营造瀑布感
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
      <View style={styles.card}>
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
        <View style={styles.userRow}>
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={16} color="#EEB82A" />
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user}
            </Text>
            <View style={styles.metaRow}>
              {location ? (
                <>
                  <Ionicons name="location" size={12} color="rgba(255,255,255,0.35)" />
                  <Text style={[styles.metaText, { marginLeft: 4 }]}>
                    {location}
                  </Text>
                </>
              ) : null}
              <Text style={[styles.metaText, { marginLeft: 8, color: 'rgba(255,255,255,0.3)' }]}>
                • {time}
              </Text>
            </View>
          </View>
        </View>

        {/* 预报 vs 实拍对比条（可选） */}
        {hasCompare && (
          <View style={styles.compareBar}>
            <View style={[styles.rowBetween, { marginBottom: 8 }]}>
              <View>
                <Text style={styles.compareLabel}>{t('community.forecastProb')}</Text>
                <Text style={[styles.compareValue, { color: '#EEB82A' }]}>{forecast}%</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.35)" />
              <View>
                <Text style={styles.compareLabel}>{t('community.actualEffect')}</Text>
                <Text style={[styles.compareValue, { color: actualColor }]}>{actual}%</Text>
              </View>
              <View
                style={[styles.levelBadge, {
                  backgroundColor: level.color + '18',
                  borderColor: level.color + '30',
                }]}
              >
                <Text style={[styles.levelBadgeText, { color: level.color }]}>
                  {t(`community.${level.key}`)}
                </Text>
              </View>
            </View>

            {/* 进度条 */}
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${actual}%`, backgroundColor: actualColor }]} />
            </View>
          </View>
        )}

        {/* 描述 */}
        {description ? (
          <View style={styles.descriptionWrap}>
            <Text style={styles.description} numberOfLines={5}>
              {description}
            </Text>
          </View>
        ) : null}

        {/* 互动栏 */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={[styles.actionItem, { marginRight: 24 }]} onPress={onLike} activeOpacity={0.7}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={likeColor} />
            <Text style={[styles.actionText, { color: likeColor }]}>{likes}</Text>
          </TouchableOpacity>
          <View style={[styles.actionItem, { marginRight: 24 }]}>
            <Ionicons name="chatbubble-outline" size={20} color="rgba(255,255,255,0.35)" />
            <Text style={styles.actionText}>{comments}</Text>
          </View>
          <TouchableOpacity style={[styles.actionItem, styles.actionShare]} onPress={onShare} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={20} color="rgba(255,255,255,0.35)" />
            <Text style={styles.actionText}>{t('community.share')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </FadeInView>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(238,184,42,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: { marginLeft: 12, flex: 1 },
  userName: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  metaText: { fontSize: 10, color: 'rgba(255,255,255,0.35)' },
  compareBar: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(218,165,32,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(218,165,32,0.15)',
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  compareLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  compareValue: { fontSize: 18, fontWeight: '700' },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
  },
  levelBadgeText: { fontSize: 10, fontWeight: '700' },
  progressBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  descriptionWrap: { paddingHorizontal: 16, marginBottom: 12 },
  description: { fontSize: 12, lineHeight: 18, color: 'rgba(255,255,255,0.55)' },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  actionItem: { flexDirection: 'row', alignItems: 'center' },
  actionShare: { flex: 1, justifyContent: 'flex-end' },
  actionText: { marginLeft: 6, fontSize: 12, color: 'rgba(255,255,255,0.35)' },
});

export default PhotoCard;
