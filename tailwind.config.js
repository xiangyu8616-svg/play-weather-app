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
        // 主色 - 金色主题
        primary: {
          50: '#FEF9E7',
          100: '#FDF3D0',
          200: '#F9E5A1',
          300: '#F4D46E',
          400: '#EEBF40',
          500: '#DAA520', // 主金色
          600: '#C48B15',
          700: '#A36F0F',
          800: '#855A0E',
          900: '#6B4A0E',
        },
        // 功能色
        success: '#52C41A',
        warning: '#FAAD14',
        error: '#FF6B35',
        info: '#3B82F6',
        // 天气现象色
        aurora: '#9D4EDD',    // 极光紫
        typhoon: '#FF0000',   // 台风红
        cloud: '#87CEEB',     // 云海蓝
        glow: '#FFA500',      // 朝霞橙
        snow: '#F8F8FF',      // 雪白
        rainbow: '#FF6B35',   // 彩虹橙
        // 中性色 - 暖色调
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
        // 背景色 - 暖白
        background: {
          primary: '#FFFFFF',
          secondary: '#FEF9E7',
          gradient: {
            from: '#FEF9E7',
            to: '#FFFFFF',
          }
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
        'gold': '0 4px 15px rgba(218, 165, 32, 0.3)',
      }
    },
  },
  plugins: [],
}
