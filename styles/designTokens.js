/**
 * 玩天气 App — 视觉设计规范 Token
 * 版本: v1.0 | 依据: play-weather-visual-design-spec.md
 */

// ═══════════════════════════════════════════
// 1. 色彩系统
// ═══════════════════════════════════════════

export const Brand = {
  Gold:       '#DAA520',
  GoldLight:  '#F5D06F',
  GoldDark:   '#B8860B',
};

export const Accent = {
  SkyBlue:    '#4A90D9',
  SunsetOrange: '#E8734A',
  FrostCyan:  '#5BC0BE',
  SuccessGreen: '#4CAF50',
};

export const Surface = {
  Base:       '#0A0E17',
  Surface1:   '#12182A',
  Surface2:   '#1A2238',
  Surface3:   '#243050',
  Elevated:   '#1E2A45',
};

export const TextColor = {
  Primary:    '#F0F0F5',
  Secondary:  '#A0A8C0',
  Tertiary:   '#5A6380',
  Disabled:   '#3A4060',
  OnGold:     '#0A0E17',
};

// 颜色 = 函数工具

/** 品牌金 rgba */
export function goldAlpha(alpha = 1) {
  return `rgba(218, 165, 32, ${alpha})`;
}

/** 天蓝 rgba */
export function skyBlueAlpha(alpha = 1) {
  return `rgba(74, 144, 217, ${alpha})`;
}

/** 白字 rgba */
export function whiteAlpha(alpha = 1) {
  return `rgba(255, 255, 255, ${alpha})`;
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
  full: 9999,
};

// ═══════════════════════════════════════════
// 4. 字体
// ═══════════════════════════════════════════

export const FontFamily = {
  primary:  'Inter, PingFang SC, Microsoft YaHei, system-ui, sans-serif',
  mono:     'JetBrains Mono, SF Mono, monospace',
};

export const FontSize = {
  display:  48,   // 当前温度
  h1:       28,
  h2:       22,
  h3:       18,
  body:     15,
  caption:  13,
  micro:    11,
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
// 6. 阴影 / 光晕
// ═══════════════════════════════════════════

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  /** 金色焦点卡片光晕 */
  goldGlow: {
    shadowColor: Brand.Gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
};

// ═══════════════════════════════════════════
// 7. 卡片基础样式（可直接 spread）
// ═══════════════════════════════════════════

export const CardStyle = {
  backgroundColor: Surface.Surface1,
  borderRadius: Radius.lg,
  padding: Spacing.lg,
  borderWidth: 1,
  borderColor: whiteAlpha(0.06),
  ...Shadow.card,
};

/** 玻璃卡片（旧项目兼容过渡） */
export const GlassCardStyle = {
  backgroundColor: 'rgba(18, 24, 42, 0.75)',   // Surface1 75% 透明度
  borderRadius: Radius.lg,
  borderWidth: 0.5,
  borderColor: whiteAlpha(0.1),
  padding: Spacing.md,
};

// ═══════════════════════════════════════════
// 8. 按钮
// ═══════════════════════════════════════════

export const ButtonStyle = {
  primary: {
    backgroundColor: Brand.Gold,
    borderRadius: Radius.full,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: goldAlpha(0.3),
    borderRadius: Radius.full,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
};
