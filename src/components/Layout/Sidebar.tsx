'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

// 네비게이션 메뉴 아이템 (원본 HTML 기준)
const dashboardItems = [
  {
    id: 'marketing',
    label: '광고 성과 대시보드',
    href: '/',
  },
  {
    id: 'creative',
    label: '소재별 대시보드',
    href: '/creative',
  },
]

const analysisItems = [
  {
    id: 'forecast',
    label: '시계열 데이터 분석',
    href: '/forecast',
  },
  {
    id: 'type',
    label: '채널별 비교',
    href: '/type',
  },
  {
    id: 'funnel',
    label: '퍼널 대시보드',
    href: '/funnel',
  },
]

// SVG 아이콘 컴포넌트
const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
  </svg>
)

const ChartIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>
  </svg>
)

const ImageIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
  </svg>
)

const TimelineIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M23 8c0 1.1-.9 2-2 2-.18 0-.35-.02-.51-.07l-3.56 3.55c.05.16.07.34.07.52 0 1.1-.9 2-2 2s-2-.9-2-2c0-.18.02-.36.07-.52l-2.55-2.55c-.16.05-.34.07-.52.07s-.36-.02-.52-.07l-4.55 4.56c.05.16.07.33.07.51 0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.18 0 .35.02.51.07l4.56-4.55C8.02 9.36 8 9.18 8 9c0-1.1.9-2 2-2s2 .9 2 2c0 .18-.02.36-.07.52l2.55 2.55c.16-.05.34-.07.52-.07s.36.02.52.07l3.55-3.56C19.02 8.35 19 8.18 19 8c0-1.1.9-2 2-2s2 .9 2 2z"/>
  </svg>
)

const FunnelIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.73-4.8 5.75-7.39C20.26 4.95 19.79 4 18.95 4H5.04c-.83 0-1.31.95-.79 1.61z"/>
  </svg>
)

const PieChartIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2.03 0v8.99H22c-.47-4.74-4.24-8.52-8.97-8.99zm0 11.01V22c4.74-.47 8.5-4.25 8.97-8.99h-8.97z"/>
  </svg>
)

const getIcon = (id: string) => {
  switch (id) {
    case 'marketing':
      return <ChartIcon />
    case 'creative':
      return <ImageIcon />
    case 'forecast':
      return <TimelineIcon />
    case 'type':
      return <PieChartIcon />
    case 'funnel':
      return <FunnelIcon />
    default:
      return <DashboardIcon />
  }
}

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-[1000] h-screen w-[260px] bg-white border-r border-gray-200 flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.05)]">
      {/* 로고 영역 */}
      <div className="px-5 py-6 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-main to-primary-dark rounded-[10px] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">Analytics</div>
            <div className="text-[11px] text-gray-500 uppercase tracking-[0.5px]">Dashboard</div>
          </div>
        </Link>
      </div>

      {/* 네비게이션 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
        <div className="px-3 py-4">
          {/* 대시보드 그룹 */}
          <div className="mb-4">
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.5px] px-4 py-2 mb-1">
              대시보드
            </div>
            {dashboardItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-[10px] mb-1 no-underline text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-light text-primary-main'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-primary-main'
                  )}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    {getIcon(item.id)}
                  </div>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* 분석 그룹 */}
          <div className="mb-4">
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.5px] px-4 py-2 mb-1">
              분석
            </div>
            {analysisItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-[10px] mb-1 no-underline text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-light text-primary-main'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-primary-main'
                  )}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    {getIcon(item.id)}
                  </div>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
