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
      // Berry Theme 색상
      colors: {
        // Primary (보라색 계열)
        primary: {
          DEFAULT: '#673ab7',
          main: '#673ab7',
          light: '#ede7f6',
          dark: '#5e35b1',
          50: '#ede7f6',
          100: '#d1c4e9',
          200: '#b39ddb',
          300: '#9575cd',
          400: '#7e57c2',
          500: '#673ab7',
          600: '#5e35b1',
          700: '#512da8',
          800: '#4527a0',
          900: '#311b92',
        },
        // Secondary (파란색 계열)
        secondary: {
          DEFAULT: '#2196f3',
          main: '#2196f3',
          light: '#e3f2fd',
          dark: '#1976d2',
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#2196f3',
          600: '#1e88e5',
          700: '#1976d2',
          800: '#1565c0',
          900: '#0d47a1',
        },
        // 상태 색상
        success: {
          DEFAULT: '#00c853',
          main: '#00c853',
          light: '#b9f6ca',
          dark: '#00a844',
        },
        warning: {
          DEFAULT: '#ffab00',
          main: '#ffab00',
          light: '#ffecb3',
          dark: '#ff8f00',
        },
        error: {
          DEFAULT: '#ff1744',
          main: '#ff1744',
          light: '#ff8a80',
          dark: '#d50000',
        },
        info: {
          DEFAULT: '#00b0ff',
          main: '#00b0ff',
          light: '#80d8ff',
          dark: '#0091ea',
        },
        // 배경 색상
        background: '#f8fafc',
        paper: '#ffffff',
        // 텍스트 색상
        textPrimary: '#212121',
        textSecondary: '#757575',
        // 사이드바
        sidebar: {
          bg: '#1e1e2d',
          hover: '#2a2a3d',
          active: '#673ab7',
        },
      },
      // 폰트
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
      // 그림자
      boxShadow: {
        card: '0 2px 14px 0 rgba(32, 40, 45, 0.08)',
        'card-hover': '0 4px 20px 0 rgba(32, 40, 45, 0.12)',
      },
      // 둥근 모서리
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '4px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
