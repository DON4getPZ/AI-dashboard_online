'use client'

export default function QnaPage() {
  return (
    <div style={{
      width: '100%',
      height: 'calc(100vh - 64px)',
      overflow: 'hidden'
    }}>
      <iframe
        src="/Qna.html?embed=true"
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
        title="FAQ & 문의하기"
      />
    </div>
  )
}
