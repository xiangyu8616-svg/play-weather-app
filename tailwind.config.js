/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // ===== 主色 - 金色主题 =====
        primary: {
          50: '#FFF3D6',
          100: '#FFE8B0',
          200: '#FDD97B',
          300: '#F4C84A',
          400: '#EEB82A',
          500: '#DAA520', // 主金色
          600: '#C48B15',
          700: '#A36F0F',
          800: '#855A0E',
          900: '#6B4A0E',
        },
        // ===== 功能色 =====
        success: '#52C41A',
        warning: '#FAAD14',
        error: '#FF6B35',
        info: '#3B82F6',
        // ===== 天气现象色 =====
        aurora: '#9D4EDD',
        typhoon: '#FF0000',
        cloud: '#87CEEB',
        glow: '#FFA500',
        snow: '#F8F8FF',
        rainbow: '#FF6B35',
        // ===== 玻璃态深色主题 =====
        glass: {
          bg: '#0F0D1E',         // 深色背景（紫调暗色）
          'bg-light': '#1A1735', // 浅深色背景
          card: 'rgba(255,255,255,0.06)',       // 玻璃态卡片
          'card-hover': 'rgba(255,255,255,0.10)',
          border: 'rgba(255,255,255,0.08)',     // 玻璃态边框
          'border-active': 'rgba(218,165,32,0.25)', // 选中边框
          text: 'rgba(255,255,255,0.85)',       // 主文本
          'text-secondary': 'rgba(255,255,255,0.55)', // 次要文本
          'text-dim': 'rgba(255,255,255,0.35)',  // 弱文本
          pill: 'rgba(255,255,255,0.08)',       // 未选中 pill
          'pill-active': 'rgba(218,165,32,0.25)', // 选中 pill 背景
          'pill-border-active': 'rgba(218,165,32,0.35)', // 选中 pill 边框
        },
        // ===== 光晕色 =====
        orb: {
          gold: 'rgba(218,165,32,0.15)',
          purple: 'rgba(157,78,221,0.10)',
          cyan: 'rgba(135,206,235,0.08)',
        },
        // ===== 中性色（浅色主题用）=====
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        // ===== 背景色 =====
        background: {
          primary: '#0F0D1E',    // 主深色背景
          secondary: '#1A1735',  // 次要深色背景
        }
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
        'full': '9999px',
      },
      boxShadow: {
        'soft': '0 2px 15px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 20px rgba(0, 0, 0, 0.12)',
        'large': '0 8px 30px rgba(0, 0, 0, 0.15)',
        'gold': '0 4px 20px rgba(218, 165, 32, 0.25)',
        'gold-sm': '0 2px 10px rgba(218, 165, 32, 0.15)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'glass-sm': '0 4px 16px rgba(0, 0, 0, 0.3)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        'xxs': '10px',
      }
    },
  },
  plugins: [],
}
