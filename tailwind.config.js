/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Berry Theme 색상 - 원본 HTML과 정확히 일치
      colors: {
        // Primary (보라색 계열)
        primary: {
          DEFAULT: '#673ab7',
          main: '#673ab7',
          light: '#ede7f6',
          dark: '#5e35b1',
        },
        // Secondary (파란색 계열)
        secondary: {
          DEFAULT: '#2196f3',
          main: '#2196f3',
          light: '#e3f2fd',
        },
        // 상태 색상
        success: {
          DEFAULT: '#00c853',
          main: '#00c853',
          light: '#b9f6ca',
        },
        warning: {
          DEFAULT: '#ffab00',
          main: '#ffab00',
          light: '#fff8e1',
        },
        error: {
          DEFAULT: '#ff1744',
          main: '#ff1744',
          light: '#ffeaea',
        },
        // Grey Scale
        grey: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          900: '#212121',
        },
        // 배경 색상
        background: '#f8fafc',
        paper: '#ffffff',
        // 사이드바
        sidebar: {
          bg: '#ffffff',
        },
      },
      // 폰트
      fontFamily: {
        sans: ['Inter', 'Roboto', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      // 그림자
      boxShadow: {
        'card': '0 2px 14px 0 rgba(32, 40, 45, 0.08)',
        'card-hover': '0 4px 20px 0 rgba(32, 40, 45, 0.12)',
        'kpi': '0 2px 8px rgba(0,0,0,0.06)',
        'kpi-hover': '0 6px 16px rgba(0,0,0,0.1)',
        'collapsible': '0 2px 8px rgba(0,0,0,0.08)',
        'collapsible-hover': '0 4px 12px rgba(0,0,0,0.12)',
        'btn': '0 2px 8px rgba(0,0,0,0.06)',
        'btn-active': '0 4px 12px rgba(103, 58, 183, 0.4)',
      },
      // 둥근 모서리
      borderRadius: {
        'lg': '12px',
        'md': '8px',
        'sm': '4px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
