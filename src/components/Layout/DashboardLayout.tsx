'use client'

import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* 사이드바 */}
      <Sidebar />

      {/* 메인 콘텐츠 영역 */}
      <main className="ml-64 min-h-screen transition-all duration-300">
        {/* 헤더 */}
        <header className="sticky top-0 z-30 h-16 bg-paper border-b border-gray-200 flex items-center px-6 shadow-sm">
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                마케팅 대시보드
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {/* 날짜 표시 */}
              <span className="text-sm text-text-secondary">
                {new Date().toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </span>
            </div>
          </div>
        </header>

        {/* 페이지 콘텐츠 */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
