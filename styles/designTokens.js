/**
 * 玩天气 App — 视觉设计规范 Token
 * 版本: v2.0 | 主题: 天文台观测者
 * 配色: Deep Space Black + Aurora Green + Star Gold
 */

// ═══════════════════════════════════════════
// 1. 色彩系统 — Deep Space 天文台
// ═══════════════════════════════════════════

/** 背景层 */
export const Bg = {
  primary:   '#0B0B10',   // 主背景 — 比纯黑有层次
  card:      '#12121A',   // 卡片背景
  elevated:  '#1A1A24',   // 浮层/弹窗
  overlay:   'rgba(11, 11, 16, 0.85)',
  glass:     'rgba(18, 18, 26, 0.75)',   // 玻璃卡片底（card 的 75% 透明）
};

/** 强调色 — 极光 + 星光 */
export const Accent = {
  aurora:     '#00D4AA',   // 极光绿 — 主强调
  auroraDim:  'rgba(0, 212, 170, 0.20)',
  auroraGlow: 'rgba(0, 212, 170, 0.08)',
  star:       '#FFD700',   // 星星金 — 数据高亮
  starDim:    'rgba(255, 215, 0, 0.25)',
  danger:     '#FF4444',   // KP 高指数/警示
  success:    '#22C55E',   // 可见/良好
  blueHour:   '#60A5FA',   // 蓝时刻/信息蓝
};

/** 文字色 */
export const TextColor = {
  primary:    '#F8FAFC',   // 主文字 — 冷白
  secondary:  '#94A3B8',   // 次要 — 银灰
  muted:      '#475569',   // 辅助/禁用
  onAurora:   '#0B0B10',   // 极光色上的文字
};

/** 边框/分隔 */
export const Border = {
  subtle:     '#1E293B',
  aurora:     'rgba(0, 212, 170, 0.30)',
};

// 颜色函数工具
export function auroraAlpha(alpha = 1) {
  return `rgba(0, 212, 170, ${alpha})`;
}
export function starAlpha(alpha = 1) {
  return `rgba(255, 215, 0, ${alpha})`;
}
export function whiteAlpha(alpha = 1) {
  return `rgba(248, 250, 252, ${alpha})`;
}

/** 极光渐变 — 全页统一 */
export const AuroraGradient = ['#0B0B10', '#12121A', '#001a1a', 'rgba(0, 212, 170, 0.08)'];

/** 天气状态背景渐变 */
export function getWeatherBackground(text, code) {
  const c = parseInt(code) || 0;
  const t = (text || '').toLowerCase();
  const base = ['#0B0B10', '#12121A', '#1A1A24'];
  const rain = ['#0B0B10', '#0F141E', '#142028'];
  const snow = ['#0B0B10', '#12121A', '#1E2030'];

  if (c >= 300 && c <= 399 || t.includes('雨')) return rain;
  if (c >= 400 && c <= 499 || t.includes('雪')) return snow;
  return base;
}

// ═══════════════════════════════════════════
// 2. 间距系统（4px 基准）
// ═══════════════════════════════════════════

export const Spacing = {
  xxs:  2,
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
  huge: 48,
};

// ═══════════════════════════════════════════
// 3. 圆角
// ═══════════════════════════════════════════

export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  full: 9999,
};

// ═══════════════════════════════════════════
// 4. 字体
// ═══════════════════════════════════════════

export const FontFamily = {
  display:  'Space Grotesk, Inter, PingFang SC, system-ui, sans-serif',
  primary:  'Inter, PingFang SC, Microsoft YaHei, system-ui, sans-serif',
  mono:     'JetBrains Mono, SF Mono, monospace',
};

export const FontSize = {
  display:  56,   // KP 指数 / 大数字
  h1:       32,   // 页面标题
  h2:       24,   // 卡片标题
  h3:       18,   // 小节标题
  body:     15,   // 正文
  caption:  13,   // 辅助说明
  micro:    11,   // 标签/时间
};

export const FontWeight = {
  bold:     '700',
  semiBold: '600',
  medium:   '500',
  regular:  '400',
  light:    '300',
};

// ═══════════════════════════════════════════
// 5. 动效
// ═══════════════════════════════════════════

export const Duration = {
  micro:    150,
  standard: 300,
  slow:     500,
};

// ═══════════════════════════════════════════
// 6. 阴影 / 光晕 — 极光 glow
// ═══════════════════════════════════════════

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  },
  /** 极光卡片光晕 — 核心差异化 */
  auroraGlow: {
    shadowColor: Accent.aurora,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  /** 微弱极光边框 glow */
  auroraBorder: {
    shadowColor: Accent.aurora,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
};

// ═══════════════════════════════════════════
// 7. 卡片基础样式
// ═══════════════════════════════════════════

export const CardStyle = {
  backgroundColor: Bg.card,
  borderRadius: Radius.lg,
  padding: Spacing.lg,
  borderWidth: 1,
  borderColor: Border.subtle,
  ...Shadow.auroraBorder,
};

/** 核心信息卡片 — 可见性状态 */
export const HeroCardStyle = {
  backgroundColor: Bg.card,
  borderRadius: Radius.xl,
  padding: Spacing.xxl,
  borderWidth: 1,
  borderColor: Border.aurora,
  ...Shadow.auroraGlow,
};

/** 玻璃卡片（浮层） */
export const GlassCardStyle = {
  backgroundColor: 'rgba(18, 18, 26, 0.80)',
  borderRadius: Radius.lg,
  borderWidth: 0.5,
  borderColor: 'rgba(248, 250, 252, 0.08)',
  padding: Spacing.md,
};

// ═══════════════════════════════════════════
// 8. 按钮
// ═══════════════════════════════════════════

export const ButtonStyle = {
  primary: {
    backgroundColor: Accent.aurora,
    borderRadius: Radius.full,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: auroraAlpha(0.35),
    borderRadius: Radius.full,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: Radius.full,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
};

// ═══════════════════════════════════════════
// 9. 天气图标映射（去掉 emoji，用条件样式）
// ═══════════════════════════════════════════

export function getWeatherIconColor(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('晴')) return Accent.star;
  if (t.includes('多云')) return TextColor.secondary;
  if (t.includes('阴')) return TextColor.muted;
  if (t.includes('雨')) return '#60A5FA';
  if (t.includes('雪')) return '#E2E8F0';
  if (t.includes('雾') || t.includes('霾')) return TextColor.muted;
  return Accent.star;
}

// ═══════════════════════════════════════════
// 10. 旧 Token 兼容映射（避免其他文件报错）
// ═══════════════════════════════════════════

export const Brand = {
  Gold: Accent.star,
  GoldLight: '#FEF08A',
  GoldDark: '#CA8A04',
};
export const Surface = {
  Base: Bg.primary,
  Surface1: Bg.card,
  Surface2: Bg.elevated,
  Surface3: '#242430',
  Elevated: Bg.elevated,
};
export const goldAlpha = starAlpha;
export const skyBlueAlpha = auroraAlpha;
