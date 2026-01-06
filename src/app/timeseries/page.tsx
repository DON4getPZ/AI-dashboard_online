'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

// React 버전 동적 로드 (코드 스플리팅)
const ReactView = dynamic(() => import('./ReactView'), {
  loading: () => <div style={{ padding: 24, textAlign: 'center' }}>React 버전 로딩 중...</div>
})

export default function TimeseriesPage() {
  const [useReact, setUseReact] = useState(false)

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden', position: 'relative' }}>
      {/* 토글 버튼 */}
      <div style={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 100,
        display: 'flex',
        gap: 8,
        background: 'white',
        padding: '8px 12px',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <button
          onClick={() => setUseReact(false)}
          style={{
            padding: '6px 16px',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            background: !useReact ? '#673ab7' : '#f5f5f5',
            color: !useReact ? 'white' : '#616161',
            transition: 'all 0.2s'
          }}
        >
          iframe
        </button>
        <button
          onClick={() => setUseReact(true)}
          style={{
            padding: '6px 16px',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            background: useReact ? '#673ab7' : '#f5f5f5',
            color: useReact ? 'white' : '#616161',
            transition: 'all 0.2s'
          }}
        >
          React
        </button>
      </div>

      {/* 컨텐츠 */}
      {useReact ? (
        <div style={{ width: '100%', height: '100%', overflow: 'auto', padding: 24 }}>
          <ReactView />
        </div>
      ) : (
        <iframe
          src="/timeseries.html?embed=true"
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          title="시계열 데이터 분석"
        />
      )}
    </div>
  )
}
