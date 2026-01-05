'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// KPI 데이터
const forecastKPIs = [
  { title: '현재 월 매출', value: '₩135,000,000', subtitle: '실적 기준', color: 'primary' },
  { title: '다음 월 예측', value: '₩148,500,000', subtitle: '+10% 예상 성장', subtitleColor: 'success', color: 'secondary' },
  { title: '90일 예측 신뢰도', value: '87.3%', subtitle: 'Prophet 모델', color: 'success' },
]

// 예산 시뮬레이션 채널
const budgetChannels = [
  { name: 'Meta Ads', current: 20000000, min: 0, max: 50000000 },
  { name: 'Google Ads', current: 15000000, min: 0, max: 50000000 },
  { name: 'Kakao Moment', current: 10000000, min: 0, max: 30000000 },
]

// 예측 테이블 데이터
const forecastData = [
  { month: '2025-01', actual: null, predicted: 148500000, lower: 141000000, upper: 156000000 },
  { month: '2025-02', actual: null, predicted: 155200000, lower: 145000000, upper: 165000000 },
  { month: '2025-03', actual: null, predicted: 162800000, lower: 150000000, upper: 175000000 },
]

const historicalData = [
  { month: '2024-10', actual: 128000000, predicted: null },
  { month: '2024-11', actual: 132000000, predicted: null },
  { month: '2024-12', actual: 135000000, predicted: null },
]

export default function ForecastDashboard() {
  const [budgets, setBudgets] = useState(budgetChannels.map(c => c.current))
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'roas' | 'conversions'>('revenue')

  const handleBudgetChange = (idx: number, value: number) => {
    const newBudgets = [...budgets]
    newBudgets[idx] = value
    setBudgets(newBudgets)
  }

  const totalBudget = budgets.reduce((sum, b) => sum + b, 0)
  const predictedRevenue = Math.round(totalBudget * 3.3) // 예상 ROAS 330%

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">시계열 예측</h1>
        <p className="text-sm text-gray-500 mt-1">Forecast Dashboard - Prophet 기반 90일 예측 분석</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {forecastKPIs.map((kpi, idx) => (
          <Card key={idx} className={cn("border-l-4", `border-l-${kpi.color}-main`)}>
            <CardContent className="p-5">
              <p className="text-sm text-gray-600 mb-1">{kpi.title}</p>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              <p className={cn(
                "text-sm mt-1",
                kpi.subtitleColor === 'success' ? "text-success-main font-medium" : "text-gray-500"
              )}>
                {kpi.subtitle}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 예측 차트 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-primary-main rounded-sm" />
              <span className="font-semibold text-gray-900">매출 예측 차트</span>
            </div>
            <div className="flex gap-2">
              {(['revenue', 'roas', 'conversions'] as const).map((metric) => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    selectedMetric === metric
                      ? "bg-primary-main text-white shadow-lg shadow-primary-main/40"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-primary-light hover:text-primary-main"
                  )}
                >
                  {metric === 'revenue' ? '매출' : metric === 'roas' ? 'ROAS' : '전환수'}
                </button>
              ))}
            </div>
          </div>

          {/* 차트 영역 - 신뢰구간 표시 포함 */}
          <div className="relative h-[350px] bg-gradient-to-b from-gray-50 to-white rounded-lg border border-gray-100 p-4">
            {/* Y축 레이블 */}
            <div className="absolute left-0 top-0 bottom-0 w-20 flex flex-col justify-between text-xs text-gray-500 py-4">
              <span>₩200M</span>
              <span>₩150M</span>
              <span>₩100M</span>
              <span>₩50M</span>
              <span>₩0</span>
            </div>

            {/* 차트 본체 */}
            <div className="ml-20 h-full flex items-end justify-around gap-2">
              {/* 과거 데이터 (실선) */}
              {historicalData.map((d, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className="w-full max-w-[60px] bg-primary-main rounded-t-lg transition-all hover:opacity-80"
                    style={{ height: `${(d.actual! / 200000000) * 100}%` }}
                  />
                  <span className="text-xs text-gray-600 mt-2">{d.month}</span>
                </div>
              ))}

              {/* 구분선 */}
              <div className="w-px h-full bg-gray-300 mx-2 relative">
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
                  현재
                </span>
              </div>

              {/* 예측 데이터 (점선 + 신뢰구간) */}
              {forecastData.map((d, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                  {/* 신뢰구간 */}
                  <div className="relative w-full max-w-[60px]">
                    <div
                      className="absolute w-full bg-primary-light/50 rounded-lg"
                      style={{
                        height: `${((d.upper - d.lower) / 200000000) * 100}%`,
                        bottom: `${(d.lower / 200000000) * 100}%`
                      }}
                    />
                    {/* 예측값 */}
                    <div
                      className="w-full bg-primary-main/60 rounded-t-lg border-2 border-dashed border-primary-main transition-all hover:opacity-80"
                      style={{ height: `${(d.predicted / 200000000) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 mt-2">{d.month}</span>
                </div>
              ))}
            </div>

            {/* 범례 */}
            <div className="absolute bottom-4 right-4 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-primary-main rounded" />
                <span className="text-gray-600">실적</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-primary-main/60 border-2 border-dashed border-primary-main rounded" />
                <span className="text-gray-600">예측</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-primary-light/50 rounded" />
                <span className="text-gray-600">신뢰구간</span>
              </div>
            </div>
          </div>

          {/* 예측 상세 정보 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600">ℹ️</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">예측 모델 정보</p>
                <p className="text-sm text-gray-600 mt-1">
                  Prophet 알고리즘 기반 시계열 예측 모델입니다. 계절성, 트렌드, 휴일 효과를 반영하여 90일간의 매출을 예측합니다.
                  신뢰구간은 95% 수준으로 설정되어 있습니다.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 예산 시뮬레이션 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-5 bg-secondary-main rounded-sm" />
            <span className="font-semibold text-gray-900">예산 시뮬레이션</span>
            <span className="text-sm text-gray-500 ml-2">채널별 예산 조정 시 매출 변화 예측</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 슬라이더 영역 */}
            <div className="space-y-6">
              {budgetChannels.map((channel, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{channel.name}</span>
                    <span className="text-primary-main font-semibold">
                      ₩{(budgets[idx] / 1000000).toFixed(0)}M
                    </span>
                  </div>
                  <input
                    type="range"
                    min={channel.min}
                    max={channel.max}
                    value={budgets[idx]}
                    onChange={(e) => handleBudgetChange(idx, Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-main"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>₩0</span>
                    <span>₩{(channel.max / 1000000).toFixed(0)}M</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 예측 결과 */}
            <div className="bg-gradient-to-br from-primary-light to-white rounded-xl p-6 border border-primary-main/20">
              <h4 className="font-semibold text-gray-900 mb-4">시뮬레이션 결과</h4>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">총 예산</span>
                  <span className="text-xl font-bold text-gray-900">
                    ₩{(totalBudget / 1000000).toFixed(0)}M
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">예상 ROAS</span>
                  <span className="text-xl font-bold text-success-main">330%</span>
                </div>

                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600">예측 매출</span>
                  <span className="text-2xl font-bold text-primary-main">
                    ₩{(predictedRevenue / 1000000).toFixed(0)}M
                  </span>
                </div>
              </div>

              <button className="w-full mt-6 py-3 bg-primary-main text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
                시뮬레이션 저장
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 예측 데이터 테이블 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-5 bg-success-main rounded-sm" />
            <span className="font-semibold text-gray-900">예측 상세 데이터</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="text-left py-3.5 px-4 font-semibold text-gray-700 text-sm">기간</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-gray-700 text-sm">실적</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-gray-700 text-sm">예측값</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-gray-700 text-sm">하한</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-gray-700 text-sm">상한</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-gray-700 text-sm">신뢰구간</th>
                </tr>
              </thead>
              <tbody>
                {[...historicalData, ...forecastData].map((row, idx) => (
                  <tr key={idx} className={cn(
                    "border-b border-gray-100 hover:bg-gray-50 transition-colors",
                    row.predicted && "bg-primary-light/30"
                  )}>
                    <td className="py-3.5 px-4 font-medium text-gray-900">{row.month}</td>
                    <td className="py-3.5 px-4 text-right text-gray-900">
                      {row.actual ? `₩${(row.actual / 1000000).toFixed(0)}M` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right text-primary-main font-semibold">
                      {row.predicted ? `₩${(row.predicted / 1000000).toFixed(0)}M` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-600">
                      {'lower' in row && row.lower ? `₩${(row.lower / 1000000).toFixed(0)}M` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-600">
                      {'upper' in row && row.upper ? `₩${(row.upper / 1000000).toFixed(0)}M` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-600">
                      {'lower' in row && row.lower && row.upper
                        ? `±₩${((row.upper - row.lower) / 2 / 1000000).toFixed(0)}M`
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
