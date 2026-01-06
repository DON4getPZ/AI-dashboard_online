'use client'

import dynamic from 'next/dynamic'

// 클라이언트 사이드에서만 로드 (Chart.js SSR 문제 방지)
const ReactView = dynamic(() => import('./ReactView'), {
  ssr: false,
  loading: () => (
    <div style={{ padding: '24px', textAlign: 'center', color: '#9e9e9e' }}>
      데이터를 불러오는 중...
    </div>
  )
})

export default function CreativePage() {
  return (
    <div style={{
      width: '100%',
      height: 'calc(100vh - 64px)',
      overflow: 'auto'
    }}>
      <ReactView />
    </div>
  )
}
