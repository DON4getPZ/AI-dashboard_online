'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// 채널별 데이터
const channelData = [
  { name: 'Meta Ads', cost: 20000000, revenue: 65000000, roas: 325, conversions: 620, cpa: 32258, ctr: 3.2, color: 'bg-blue-500' },
  { name: 'Google Ads', cost: 15000000, revenue: 45000000, roas: 300, conversions: 480, cpa: 31250, ctr: 2.8, color: 'bg-red-500' },
  { name: 'Kakao Moment', cost: 10000000, revenue: 25000000, roas: 250, conversions: 250, cpa: 40000, ctr: 2.1, color: 'bg-yellow-500' },
]

// KPI 요약
const kpiSummary = [
  { title: '총 비용', value: '₩45,000,000', change: '+12.5%', positive: false },
  { title: '총 매출', value: '₩135,000,000', change: '+18.2%', positive: true },
  { title: '통합 ROAS', value: '300%', change: '+5.1%', positive: true },
  { title: '총 전환수', value: '1,350', change: '-2.3%', positive: false },
]

export default function TypeDashboard() {
  const [selectedMetric, setSelectedMetric] = useState<'roas' | 'cost' | 'revenue'>('roas')

  const totalCost = channelData.reduce((sum, ch) => sum + ch.cost, 0)
  const totalRevenue = channelData.reduce((sum, ch) => sum + ch.revenue, 0)

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">채널별 비교</h1>
        <p className="text-sm text-gray-500 mt-1">Type Dashboard - 광고 채널별 종합 성과 분석</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiSummary.map((kpi, idx) => (
          <Card key={idx} className="border-l-4 border-l-primary-main">
            <CardContent className="p-5">
              <p className="text-sm text-gray-600 mb-1">{kpi.title}</p>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              <p className={cn(
                "text-sm font-medium mt-1",
                kpi.positive ? "text-success-main" : "text-error-main"
              )}>
                {kpi.change} vs 전월
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 채널별 비용 분포 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 파이 차트 (CSS로 표현) */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-5 bg-primary-main rounded-sm" />
              <span className="font-semibold text-gray-900">채널별 비용 분포</span>
            </div>

            <div className="flex items-center justify-center gap-8">
              {/* 도넛 차트 */}
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {channelData.map((channel, idx) => {
                    const percentage = (channel.cost / totalCost) * 100
                    const offset = channelData.slice(0, idx).reduce((sum, ch) => sum + (ch.cost / totalCost) * 100, 0)
                    const colors = ['#3b82f6', '#ef4444', '#eab308']

                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={colors[idx]}
                        strokeWidth="20"
                        strokeDasharray={`${percentage * 2.51} 251`}
                        strokeDashoffset={`${-offset * 2.51}`}
                        className="transition-all duration-500"
                      />
                    )
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">₩45M</p>
                    <p className="text-xs text-gray-500">총 비용</p>
                  </div>
                </div>
              </div>

              {/* 범례 */}
              <div className="space-y-3">
                {channelData.map((channel, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full", channel.color)} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{channel.name}</p>
                      <p className="text-xs text-gray-500">
                        ₩{(channel.cost / 1000000).toFixed(0)}M ({((channel.cost / totalCost) * 100).toFixed(0)}%)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 매출 분포 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-5 bg-secondary-main rounded-sm" />
              <span className="font-semibold text-gray-900">채널별 매출 분포</span>
            </div>

            <div className="flex items-center justify-center gap-8">
              {/* 도넛 차트 */}
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {channelData.map((channel, idx) => {
                    const percentage = (channel.revenue / totalRevenue) * 100
                    const offset = channelData.slice(0, idx).reduce((sum, ch) => sum + (ch.revenue / totalRevenue) * 100, 0)
                    const colors = ['#3b82f6', '#ef4444', '#eab308']

                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={colors[idx]}
                        strokeWidth="20"
                        strokeDasharray={`${percentage * 2.51} 251`}
                        strokeDashoffset={`${-offset * 2.51}`}
                        className="transition-all duration-500"
                      />
                    )
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">₩135M</p>
                    <p className="text-xs text-gray-500">총 매출</p>
                  </div>
                </div>
              </div>

              {/* 범례 */}
              <div className="space-y-3">
                {channelData.map((channel, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full", channel.color)} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{channel.name}</p>
                      <p className="text-xs text-gray-500">
                        ₩{(channel.revenue / 1000000).toFixed(0)}M ({((channel.revenue / totalRevenue) * 100).toFixed(0)}%)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 채널별 ROAS 비교 바 차트 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-success-main rounded-sm" />
              <span className="font-semibold text-gray-900">채널별 성과 비교</span>
            </div>
            <div className="flex gap-2">
              {(['roas', 'cost', 'revenue'] as const).map((metric) => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    selectedMetric === metric
                      ? "bg-primary-main text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-primary-light"
                  )}
                >
                  {metric === 'roas' ? 'ROAS' : metric === 'cost' ? '비용' : '매출'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {channelData.map((channel, idx) => {
              const value = selectedMetric === 'roas' ? channel.roas : selectedMetric === 'cost' ? channel.cost : channel.revenue
              const maxValue = selectedMetric === 'roas' ? 400 : selectedMetric === 'cost' ? 25000000 : 80000000
              const displayValue = selectedMetric === 'roas' ? `${value}%` : `₩${(value / 1000000).toFixed(0)}M`

              return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", channel.color)} />
                      <span className="font-medium text-gray-900">{channel.name}</span>
                    </div>
                    <span className={cn(
                      "font-bold",
                      selectedMetric === 'roas' && value >= 300 ? "text-success-main" : "text-gray-900"
                    )}>
                      {displayValue}
                    </span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", channel.color)}
                      style={{ width: `${Math.min((value / maxValue) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 채널별 상세 성과 테이블 */}
      <Card>
        <CardContent className="p-0">
          <div className="px-6 py-5 border-b border-gray-200 flex items-center gap-2">
            <div className="w-1 h-5 bg-warning-main rounded-sm" />
            <span className="font-semibold text-gray-900">채널별 상세 성과</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="text-left py-3.5 px-4 font-semibold text-gray-700 text-sm">채널</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-gray-700 text-sm">비용</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-gray-700 text-sm">매출</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-gray-700 text-sm">ROAS</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-gray-700 text-sm">전환수</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-gray-700 text-sm">CPA</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-gray-700 text-sm">CTR</th>
                </tr>
              </thead>
              <tbody>
                {channelData.map((channel, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", channel.color)} />
                        <span className="font-medium text-gray-900">{channel.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-900">₩{(channel.cost / 1000000).toFixed(0)}M</td>
                    <td className="py-3.5 px-4 text-right text-gray-900">₩{(channel.revenue / 1000000).toFixed(0)}M</td>
                    <td className={cn(
                      "py-3.5 px-4 text-right font-bold",
                      channel.roas >= 300 ? "text-success-main" : "text-primary-main"
                    )}>
                      {channel.roas}%
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-900">{channel.conversions.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right text-gray-900">₩{channel.cpa.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right text-gray-900">{channel.ctr}%</td>
                  </tr>
                ))}
                {/* 합계 행 */}
                <tr className="bg-primary-light font-semibold">
                  <td className="py-3.5 px-4 text-primary-dark">합계</td>
                  <td className="py-3.5 px-4 text-right text-primary-dark">₩{(totalCost / 1000000).toFixed(0)}M</td>
                  <td className="py-3.5 px-4 text-right text-primary-dark">₩{(totalRevenue / 1000000).toFixed(0)}M</td>
                  <td className="py-3.5 px-4 text-right text-primary-dark">{Math.round((totalRevenue / totalCost) * 100)}%</td>
                  <td className="py-3.5 px-4 text-right text-primary-dark">{channelData.reduce((sum, ch) => sum + ch.conversions, 0).toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-right text-primary-dark">₩{Math.round(totalCost / channelData.reduce((sum, ch) => sum + ch.conversions, 0)).toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-right text-primary-dark">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
