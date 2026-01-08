'use client'

import dynamic from 'next/dynamic'

const ReactView = dynamic(() => import('./ReactView'), { ssr: false })

export default function FunnelPage() {
  return (
    <div style={{
      width: '100%',
      minHeight: 'calc(100vh - 64px)',
      overflow: 'auto',
      padding: '24px',
      background: '#f8fafc'
    }}>
      <ReactView />
    </div>
  )
}
