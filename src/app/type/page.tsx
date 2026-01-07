'use client'

import dynamic from 'next/dynamic'

// React 버전 동적 로드 (코드 스플리팅)
const ReactView = dynamic(() => import('./ReactView'), {
  ssr: false,
  loading: () => <div style={{ padding: 24, textAlign: 'center', color: '#9e9e9e' }}>데이터를 불러오는 중...</div>
})

export default function TypePage() {
  return (
    <div style={{ width: '100%', height: 'calc(100vh - 64px)', overflow: 'auto' }}>
      <ReactView />
    </div>
  )
}
