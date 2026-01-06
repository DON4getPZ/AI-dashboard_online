'use client'

export default function TypePage() {
  return (
    <div style={{
      width: '100%',
      height: 'calc(100vh - 64px)',
      overflow: 'hidden'
    }}>
      <iframe
        src="/type_dashboard.html?embed=true"
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
        title="채널별 비교"
      />
    </div>
  )
}
