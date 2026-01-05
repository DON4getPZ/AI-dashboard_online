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

      {/* 메인 콘텐츠 영역 - 원본: .main-content { margin-left: 260px, padding: 24px } */}
      <main className="ml-[260px] min-h-screen p-[24px]">
        {/* 컨테이너 - 원본: .container { max-width: 1600px, margin: 0 auto } */}
        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
