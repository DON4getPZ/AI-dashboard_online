/** @type {import('next').NextConfig} */
const nextConfig = {
  // 정적 JSON 파일 서빙
  async headers() {
    return [
      {
        source: '/data/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ]
  },

  // 이미지 최적화
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },

  // 빌드 최적화
  swcMinify: true,

  // TypeScript 엄격 모드
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
