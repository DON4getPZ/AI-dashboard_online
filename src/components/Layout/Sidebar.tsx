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
    id: 'timeseries',
    label: '시계열 데이터 분석',
    href: '/timeseries',
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
    case 'timeseries':
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
    // sidebar: width 260px, border-right 1px solid grey-200, shadow 0 0 20px rgba(0,0,0,0.05)
    <aside className="fixed left-0 top-0 z-[1000] h-screen w-[260px] bg-white border-r border-[#eeeeee] flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.05)]">
      {/* sidebar-header: padding 24px 20px, border-bottom 1px solid grey-200 */}
      <div className="px-[20px] py-[24px] border-b border-[#eeeeee]">
        {/* sidebar-logo: gap 12px */}
        <Link href="/" className="flex items-center gap-[12px] no-underline">
          {/* sidebar-logo-icon: 40px, border-radius 10px, gradient */}
          <div className="w-[40px] h-[40px] bg-gradient-to-br from-[#673ab7] to-[#5e35b1] rounded-[10px] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-[24px] h-[24px] fill-white">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
          </div>
          <div>
            {/* sidebar-logo-text: font-size 18px, font-weight 700, color grey-900 */}
            <div className="text-[18px] font-bold text-[#212121]">Analytics</div>
            {/* sidebar-logo-subtitle: font-size 11px, color grey-500, uppercase, letter-spacing 0.5px */}
            <div className="text-[11px] text-[#9e9e9e] uppercase tracking-[0.5px]">Dashboard</div>
          </div>
        </Link>
      </div>

      {/* simplebar-content-wrapper: overflow-y auto */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* sidebar-content: padding 16px 12px */}
        <div className="px-[12px] py-[16px]">
          {/* nav-group: margin-bottom 16px */}
          <div className="mb-[16px]">
            {/* nav-group-title: font-size 11px, font-weight 600, color grey-500, uppercase, padding 8px 16px, margin-bottom 4px */}
            <div className="text-[11px] font-semibold text-[#9e9e9e] uppercase tracking-[0.5px] px-[16px] py-[8px] mb-[4px]">
              대시보드
            </div>
            {dashboardItems.map((item) => {
              const isActive = pathname === item.href
              return (
                // nav-item: gap 12px, padding 12px 16px, border-radius 10px, font-size 14px, font-weight 500, margin-bottom 4px
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-[12px] px-[16px] py-[12px] rounded-[10px] mb-[4px] no-underline text-[14px] font-medium transition-all duration-200',
                    isActive
                      // active: bg primary-light, color primary-main
                      ? 'bg-[#ede7f6] text-[#673ab7]'
                      // inactive: color grey-700, hover bg grey-100
                      : 'text-[#616161] hover:bg-[#f5f5f5] hover:text-[#673ab7]'
                  )}
                >
                  {/* nav-item-icon: 20px */}
                  <div className="w-[20px] h-[20px] flex items-center justify-center">
                    {getIcon(item.id)}
                  </div>
                  <span className="flex-1">{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* nav-group: margin-bottom 16px */}
          <div className="mb-[16px]">
            {/* nav-group-title */}
            <div className="text-[11px] font-semibold text-[#9e9e9e] uppercase tracking-[0.5px] px-[16px] py-[8px] mb-[4px]">
              분석
            </div>
            {analysisItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-[12px] px-[16px] py-[12px] rounded-[10px] mb-[4px] no-underline text-[14px] font-medium transition-all duration-200',
                    isActive
                      ? 'bg-[#ede7f6] text-[#673ab7]'
                      : 'text-[#616161] hover:bg-[#f5f5f5] hover:text-[#673ab7]'
                  )}
                >
                  <div className="w-[20px] h-[20px] flex items-center justify-center">
                    {getIcon(item.id)}
                  </div>
                  <span className="flex-1">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
