'use client'

export default function CreativePage() {
  return (
    <div style={{
      width: '100%',
      height: 'calc(100vh - 64px)',
      overflow: 'hidden'
    }}>
      <iframe
        src="/creative_analysis.html?embed=true"
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
        title="소재별 대시보드"
      />
    </div>
  )
}
