'use client'

export default function HomePage() {
  return (
    <div style={{
      width: '100%',
      height: 'calc(100vh - 64px)',
      overflow: 'hidden'
    }}>
      <iframe
        src="/marketing_dashboard_v3.html?embed=true"
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
        title="광고 성과 대시보드"
      />
    </div>
  )
}
