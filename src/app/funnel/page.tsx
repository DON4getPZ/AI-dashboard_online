'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// 퍼널 단계 데이터
const funnelStages = [
  { stage: '유입', value: 50000, color: 'primary', percentage: 100 },
  { stage: '활성화', value: 25000, color: 'secondary', percentage: 50 },
  { stage: '관심', value: 12500, color: 'info', percentage: 25 },
  { stage: '결제진행', value: 3750, color: 'warning', percentage: 7.5 },
  { stage: '구매완료', value: 1875, color: 'success', percentage: 3.75 },
]

// 전환율 데이터
const conversionRates = [
  { from: '유입', to: '활성화', rate: 50 },
  { from: '활성화', to: '관심', rate: 50 },
  { from: '관심', to: '결제진행', rate: 30 },
  { from: '결제진행', to: '구매완료', rate: 50 },
]

// 색상 맵
const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  primary: { bg: 'bg-primary-light', border: 'border-l-primary-main', text: 'text-primary-main' },
  secondary: { bg: 'bg-secondary-light', border: 'border-l-secondary-main', text: 'text-secondary-main' },
  info: { bg: 'bg-blue-50', border: 'border-l-blue-500', text: 'text-blue-600' },
  warning: { bg: 'bg-warning-light', border: 'border-l-warning-main', text: 'text-warning-main' },
  success: { bg: 'bg-success-light', border: 'border-l-success-main', text: 'text-success-main' },
}

export default function FunnelDashboard() {
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">퍼널 분석</h1>
        <p className="text-sm text-gray-500 mt-1">Funnel Dashboard - AARRR 프레임워크 기반 전환 퍼널</p>
      </div>

      {/* 퍼널 단계별 KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {funnelStages.map((item, idx) => (
          <Card key={idx} className={cn("border-l-4", colorMap[item.color].border)}>
            <CardContent className="p-5">
              <p className="text-sm text-gray-600 mb-1">{item.stage}</p>
              <p className="text-2xl font-bold text-gray-900">{item.value.toLocaleString()}</p>
              <p className={cn("text-sm font-medium mt-1", colorMap[item.color].text)}>
                {item.percentage}%
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 퍼널 시각화 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-5 bg-primary-main rounded-sm" />
            <span className="font-semibold text-gray-900">고객 구매 여정 퍼널</span>
          </div>

          {/* 퍼널 차트 */}
          <div className="flex flex-col items-center py-8">
            {funnelStages.map((stage, idx) => {
              const widthPercent = 100 - (idx * 15) // 점점 좁아지는 효과
              const colors = colorMap[stage.color]

              return (
                <div key={idx} className="w-full flex flex-col items-center">
                  {/* 퍼널 바 */}
                  <div
                    className={cn(
                      "relative flex items-center justify-between px-6 py-4 rounded-lg transition-all hover:scale-[1.02]",
                      colors.bg
                    )}
                    style={{ width: `${widthPercent}%` }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-900">{stage.stage}</span>
                      <span className={cn("text-sm font-medium", colors.text)}>
                        {stage.percentage}%
                      </span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      {stage.value.toLocaleString()}
                    </span>
                  </div>

                  {/* 전환율 화살표 (마지막 제외) */}
                  {idx < funnelStages.length - 1 && (
                    <div className="flex items-center gap-2 py-2 text-gray-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      <span className="text-sm font-medium">
                        전환율 {conversionRates[idx].rate}%
                      </span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 단계별 전환율 상세 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-5 bg-secondary-main rounded-sm" />
            <span className="font-semibold text-gray-900">단계별 전환율 분석</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {conversionRates.map((item, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-gray-600">{item.from}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="text-sm font-medium text-gray-600">{item.to}</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className={cn(
                    "text-3xl font-bold",
                    item.rate >= 50 ? "text-success-main" : item.rate >= 30 ? "text-warning-main" : "text-error-main"
                  )}>
                    {item.rate}%
                  </span>
                  <span className="text-sm text-gray-500 mb-1">전환율</span>
                </div>
                {/* 프로그레스 바 */}
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      item.rate >= 50 ? "bg-success-main" : item.rate >= 30 ? "bg-warning-main" : "bg-error-main"
                    )}
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 이탈 분석 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-5 bg-error-main rounded-sm" />
            <span className="font-semibold text-gray-900">단계별 이탈 분석</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="text-left py-3.5 px-4 font-semibold text-gray-700 text-sm">단계</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-gray-700 text-sm">유입</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-gray-700 text-sm">이탈</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-gray-700 text-sm">이탈률</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-gray-700 text-sm">잔존</th>
                </tr>
              </thead>
              <tbody>
                {funnelStages.slice(0, -1).map((stage, idx) => {
                  const nextStage = funnelStages[idx + 1]
                  const dropoff = stage.value - nextStage.value
                  const dropoffRate = ((dropoff / stage.value) * 100).toFixed(1)

                  return (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        {stage.stage} → {nextStage.stage}
                      </td>
                      <td className="py-3.5 px-4 text-right text-gray-900">{stage.value.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right text-error-main font-semibold">-{dropoff.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right text-error-main font-semibold">{dropoffRate}%</td>
                      <td className="py-3.5 px-4 text-right text-success-main font-semibold">{nextStage.value.toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
