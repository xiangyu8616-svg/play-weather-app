import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking,
  TextInput, Modal, Image, Platform, ActivityIndicator, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Accent, Bg, TextColor, Spacing, Radius, FontSize, FontWeight, Brand, goldAlpha, whiteAlpha } from '../../styles/designTokens';
import { useI18n } from '../../services/i18n';
import { useUserStore } from '../../stores/userStore';
import PhotoCard from '../../components/community/PhotoCard';
import {
  fetchPosts, fetchMyLikedPostIds, toggleLike, createPost, uploadPostPhoto,
  SensitiveContentError,
} from '../../services/communityService';

const PAGE_SIZE = 20;

/** 相对时间格式化（走 i18n） */
function formatRelativeTime(iso, t) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return t('community.justNow');
  if (minutes < 60) return t('community.minutesAgo', { m: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('community.hoursAgo', { h: hours });
  return t('community.daysAgo', { d: Math.floor(hours / 24) });
}

export default function CommunityScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, profile } = useUserStore();

  const [posts, setPosts] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [composerVisible, setComposerVisible] = useState(false);
  const [content, setContent] = useState('');
  const [locationName, setLocationName] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState(null);

  const [hint, setHint] = useState(null); // 顶部临时提示（登录引导等）
  const hintTimer = useRef(null);
  const fileInputRef = useRef(null);

  const showHint = useCallback((text) => {
    setHint(text);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(null), 2500);
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await fetchPosts({ limit: PAGE_SIZE });
      setPosts(list);
      setHasMore(list.length === PAGE_SIZE);
      if (user) {
        const ids = await fetchMyLikedPostIds(user.id, list.map((p) => p.id));
        setLikedIds(ids);
      }
    } catch (e) {
      setLoadError(e?.message || 'load failed');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const loadMore = async () => {
    if (loadingMore || !hasMore || posts.length === 0) return;
    setLoadingMore(true);
    try {
      const last = posts[posts.length - 1];
      const list = await fetchPosts({ limit: PAGE_SIZE, before: last.created_at });
      setPosts((prev) => [...prev, ...list]);
      setHasMore(list.length === PAGE_SIZE);
      if (user && list.length) {
        const ids = await fetchMyLikedPostIds(user.id, list.map((p) => p.id));
        setLikedIds((prev) => new Set([...prev, ...ids]));
      }
    } catch {
      // 静默，保留现有列表
    } finally {
      setLoadingMore(false);
    }
  };

  const handleLike = async (post) => {
    if (!user) {
      showHint(t('community.loginToLike'));
      return;
    }
    const liked = likedIds.has(post.id);
    // 乐观更新
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (liked) next.delete(post.id); else next.add(post.id);
      return next;
    });
    setPosts((prev) => prev.map((p) => p.id === post.id
      ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) + (liked ? -1 : 1)) }
      : p));
    try {
      await toggleLike(post.id, user.id, liked);
    } catch {
      // 回滚
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (liked) next.add(post.id); else next.delete(post.id);
        return next;
      });
      setPosts((prev) => prev.map((p) => p.id === post.id
        ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) + (liked ? 1 : -1)) }
        : p));
    }
  };

  const handleShare = (post) => {
    const text = post.content || '';
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: '玩天气', text }).catch(() => {});
    } else if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => showHint(t('community.share'))).catch(() => {});
    }
  };

  // 选照片：web 走隐藏 file input，native 走 expo-image-picker
  const pickPhoto = async () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
      return;
    }
    try {
      const ImagePicker = require('expo-image-picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('pick photo failed:', e?.message);
    }
  };

  const onWebFileChange = (e) => {
    const file = e.target?.files?.[0];
    if (file) {
      setPhotoUri(URL.createObjectURL(file));
    }
    e.target.value = '';
  };

  const resetComposer = () => {
    setContent('');
    setLocationName('');
    setPhotoUri(null);
    setPublishError(null);
  };

  const handlePublish = async () => {
    if (!user) {
      showHint(t('community.loginToPost'));
      setComposerVisible(false);
      return;
    }
    if (!content.trim() || publishing) return;
    setPublishing(true);
    setPublishError(null);
    try {
      let photoUrls = [];
      if (photoUri) {
        const url = await uploadPostPhoto(photoUri, user.id);
        photoUrls = [url];
      }
      const post = await createPost(user.id, {
        content: content.trim(),
        photoUrls,
        locationName: locationName.trim() || null,
      });
      // 手动补作者信息，插到列表头
      const author = profile
        ? { nickname: profile.nickname, avatar_url: profile.avatar_url }
        : null;
      setPosts((prev) => [{ ...post, author }, ...prev]);
      setComposerVisible(false);
      resetComposer();
    } catch (e) {
      if (e instanceof SensitiveContentError) {
        setPublishError(e.message);
      } else {
        setPublishError(t('community.publishFailed'));
      }
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 顶部提示条 */}
      {hint && (
        <View style={styles.hintBar}>
          <Ionicons name="information-circle-outline" size={16} color={Brand.Gold} />
          <Text style={styles.hintText}>{hint}</Text>
          {!user && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <Text style={styles.hintAction}>{t('community.goLogin')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* 头部：标题 + 发帖按钮 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('community.feedTitle')}</Text>
          <TouchableOpacity
            style={styles.composeButton}
            activeOpacity={0.8}
            onPress={() => {
              if (!user) {
                showHint(t('community.loginToPost'));
                return;
              }
              setComposerVisible(true);
            }}
          >
            <Ionicons name="camera" size={16} color={Bg.primary} />
            <Text style={styles.composeButtonText}>{t('community.compose')}</Text>
          </TouchableOpacity>
        </View>

        {/* 加载中 */}
        {loading && (
          <View style={styles.centerBox}>
            <ActivityIndicator color={Brand.Gold} />
            <Text style={styles.mutedText}>{t('community.loading')}</Text>
          </View>
        )}

        {/* 加载失败 */}
        {!loading && loadError && (
          <View style={styles.errorBox}>
            <Ionicons name="cloud-offline-outline" size={28} color={Accent.danger} />
            <Text style={styles.errorText}>{t('states.loadFailed')}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadPosts}>
              <Text style={styles.retryText}>{t('states.retry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 空状态 */}
        {!loading && !loadError && posts.length === 0 && (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="images-outline" size={48} color={Brand.Gold} />
            </View>
            <Text style={styles.emptyTitle}>{t('community.empty')}</Text>
            <Text style={styles.emptyHint}>{t('community.emptyHint')}</Text>
          </View>
        )}

        {/* 帖子流 */}
        {!loading && !loadError && posts.map((post, i) => (
          <PhotoCard
            key={post.id}
            index={i}
            user={post.author?.nickname || t('community.anonymousUser')}
            avatar={post.author?.avatar_url}
            location={post.location_name}
            time={formatRelativeTime(post.created_at, t)}
            imageUrl={post.photo_urls?.[0]}
            likes={post.likes_count || 0}
            comments={post.comments_count || 0}
            description={post.content}
            liked={likedIds.has(post.id)}
            onLike={() => handleLike(post)}
            onShare={() => handleShare(post)}
          />
        ))}

        {/* 加载更多 */}
        {!loading && !loadError && hasMore && posts.length > 0 && (
          <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore} disabled={loadingMore}>
            {loadingMore
              ? <ActivityIndicator size="small" color={Brand.Gold} />
              : <Text style={styles.loadMoreText}>{t('community.loadMore')}</Text>}
          </TouchableOpacity>
        )}

        {/* 举报/联系入口（合规） */}
        <TouchableOpacity
          style={styles.reportLink}
          onPress={() => Linking.openURL(`mailto:xiangyu.8616@gmail.com?subject=${encodeURIComponent('内容举报 Content Report')}`)}
          activeOpacity={0.7}
        >
          <Ionicons name="flag-outline" size={14} color={TextColor.muted} />
          <Text style={styles.reportLinkText}>{t('community.report')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 发帖器 */}
      <Modal
        visible={composerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { setComposerVisible(false); resetComposer(); }}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.composerCard}>
            <Text style={styles.composerTitle}>{t('community.compose')}</Text>

            <TextInput
              style={styles.composerInput}
              multiline
              maxLength={500}
              placeholder={t('community.composePlaceholder')}
              placeholderTextColor={TextColor.muted}
              value={content}
              onChangeText={setContent}
              autoFocus
            />
            <Text style={styles.charCount}>{content.length}/500</Text>

            <TextInput
              style={styles.locationInput}
              maxLength={50}
              placeholder={t('community.composeLocation')}
              placeholderTextColor={TextColor.muted}
              value={locationName}
              onChangeText={setLocationName}
            />

            {/* 照片选择 */}
            {photoUri ? (
              <View style={styles.photoPreviewWrap}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
                <TouchableOpacity style={styles.photoRemove} onPress={() => setPhotoUri(null)}>
                  <Ionicons name="close-circle" size={24} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addPhotoButton} onPress={pickPhoto} activeOpacity={0.7}>
                <Ionicons name="image-outline" size={18} color={Brand.Gold} />
                <Text style={styles.addPhotoText}>{t('community.addPhoto')}</Text>
              </TouchableOpacity>
            )}

            {publishError && <Text style={styles.publishError}>{publishError}</Text>}

            <View style={styles.composerActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => { setComposerVisible(false); resetComposer(); }}
                disabled={publishing}
              >
                <Text style={styles.cancelText}>{t('community.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.publishButton, (!content.trim() || publishing) && styles.publishButtonDisabled]}
                onPress={handlePublish}
                disabled={!content.trim() || publishing}
              >
                {publishing
                  ? <ActivityIndicator size="small" color={Bg.primary} />
                  : <Text style={styles.publishText}>{t('community.publish')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* web 端隐藏 file input */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={onWebFileChange}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Bg.primary },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  hintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: goldAlpha(0.12),
    borderBottomWidth: 1,
    borderBottomColor: goldAlpha(0.25),
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  hintText: { flex: 1, fontSize: FontSize.caption, color: Brand.Gold },
  hintAction: { fontSize: FontSize.caption, fontWeight: FontWeight.bold, color: Brand.Gold, textDecorationLine: 'underline' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: TextColor.primary,
  },
  composeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.Gold,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  composeButtonText: { fontSize: FontSize.body, fontWeight: FontWeight.semiBold, color: Bg.primary },
  centerBox: { alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.md },
  mutedText: { fontSize: FontSize.caption, color: TextColor.muted },
  errorBox: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xxxl,
    backgroundColor: Bg.glass,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: whiteAlpha(0.06),
  },
  errorText: { fontSize: FontSize.body, color: Accent.danger },
  retryButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: goldAlpha(0.3),
  },
  retryText: { fontSize: FontSize.body, color: Brand.Gold },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: Bg.glass,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: whiteAlpha(0.06),
    borderStyle: 'dashed',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: goldAlpha(0.08),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: { fontSize: FontSize.h3, fontWeight: FontWeight.semiBold, color: TextColor.primary, marginBottom: Spacing.sm },
  emptyHint: { fontSize: FontSize.body, color: TextColor.secondary, textAlign: 'center' },
  loadMoreButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: whiteAlpha(0.1),
    marginTop: Spacing.sm,
  },
  loadMoreText: { fontSize: FontSize.body, color: TextColor.secondary },
  reportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xxl,
    paddingVertical: Spacing.xs,
  },
  reportLinkText: { fontSize: FontSize.caption, color: TextColor.muted },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  composerCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: Bg.elevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: whiteAlpha(0.08),
    padding: Spacing.xl,
  },
  composerTitle: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: TextColor.primary,
    marginBottom: Spacing.lg,
  },
  composerInput: {
    minHeight: 120,
    backgroundColor: Bg.glass,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: whiteAlpha(0.08),
    padding: Spacing.md,
    fontSize: FontSize.body,
    color: TextColor.primary,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: FontSize.caption,
    color: TextColor.muted,
    marginTop: 4,
  },
  locationInput: {
    backgroundColor: Bg.glass,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: whiteAlpha(0.08),
    padding: Spacing.md,
    fontSize: FontSize.body,
    color: TextColor.primary,
    marginTop: Spacing.sm,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: goldAlpha(0.3),
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.md,
  },
  addPhotoText: { fontSize: FontSize.body, color: Brand.Gold },
  photoPreviewWrap: { marginTop: Spacing.md, borderRadius: Radius.md, overflow: 'hidden' },
  photoPreview: { width: '100%', height: 180, borderRadius: Radius.md },
  photoRemove: { position: 'absolute', top: 8, right: 8 },
  publishError: { fontSize: FontSize.caption, color: Accent.danger, marginTop: Spacing.md },
  composerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: whiteAlpha(0.15),
  },
  cancelText: { fontSize: FontSize.body, color: TextColor.secondary },
  publishButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radius.full,
    backgroundColor: Brand.Gold,
    minWidth: 96,
    alignItems: 'center',
  },
  publishButtonDisabled: { opacity: 0.4 },
  publishText: { fontSize: FontSize.body, fontWeight: FontWeight.semiBold, color: Bg.primary },
});
