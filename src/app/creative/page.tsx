'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// 더미 소재 데이터
const creativeData = [
  { id: 1, name: '봄 시즌 프로모션', type: 'image', roas: 450, ctr: 3.2, cpa: 28000, spend: 5000000, status: 'active' },
  { id: 2, name: '신상품 런칭', type: 'video', roas: 380, ctr: 2.8, cpa: 32000, spend: 4500000, status: 'active' },
  { id: 3, name: '할인 이벤트', type: 'image', roas: 520, ctr: 4.1, cpa: 24000, spend: 6000000, status: 'active' },
  { id: 4, name: '브랜드 스토리', type: 'video', roas: 280, ctr: 2.1, cpa: 42000, spend: 3500000, status: 'paused' },
  { id: 5, name: '고객 후기', type: 'carousel', roas: 410, ctr: 3.5, cpa: 29000, spend: 4800000, status: 'active' },
  { id: 6, name: '제품 상세', type: 'image', roas: 340, ctr: 2.5, cpa: 35000, spend: 4000000, status: 'active' },
  { id: 7, name: '시즌오프 세일', type: 'image', roas: 620, ctr: 5.2, cpa: 21000, spend: 7000000, status: 'active' },
  { id: 8, name: '리타겟팅 A', type: 'image', roas: 480, ctr: 3.8, cpa: 26000, spend: 5500000, status: 'active' },
  { id: 9, name: '신규 유저', type: 'video', roas: 220, ctr: 1.8, cpa: 52000, spend: 3000000, status: 'paused' },
  { id: 10, name: '앱 다운로드', type: 'image', roas: 350, ctr: 2.9, cpa: 33000, spend: 4200000, status: 'active' },
  { id: 11, name: '이벤트 참여', type: 'carousel', roas: 390, ctr: 3.1, cpa: 31000, spend: 4600000, status: 'active' },
  { id: 12, name: '프리미엄 라인', type: 'video', roas: 310, ctr: 2.3, cpa: 38000, spend: 3800000, status: 'active' },
]

// KPI 요약 데이터
const kpiSummary = [
  { title: '총 소재 수', value: '248개', color: 'primary' },
  { title: '평균 ROAS', value: '285%', color: 'secondary' },
  { title: '평균 CTR', value: '2.8%', color: 'success' },
  { title: '평균 CPA', value: '₩35,200', color: 'warning' },
]

// 필터 옵션
const sortOptions = [
  { value: 'roas-desc', label: 'ROAS 높은순' },
  { value: 'roas-asc', label: 'ROAS 낮은순' },
  { value: 'ctr-desc', label: 'CTR 높은순' },
  { value: 'cpa-asc', label: 'CPA 낮은순' },
  { value: 'spend-desc', label: '지출 높은순' },
]

const typeOptions = ['전체', 'image', 'video', 'carousel']
const statusOptions = ['전체', 'active', 'paused']

export default function CreativeDashboard() {
  const [sortBy, setSortBy] = useState('roas-desc')
  const [typeFilter, setTypeFilter] = useState('전체')
  const [statusFilter, setStatusFilter] = useState('전체')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // 필터링 및 정렬
  const filteredData = creativeData
    .filter(item => typeFilter === '전체' || item.type === typeFilter)
    .filter(item => statusFilter === '전체' || item.status === statusFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'roas-desc': return b.roas - a.roas
        case 'roas-asc': return a.roas - b.roas
        case 'ctr-desc': return b.ctr - a.ctr
        case 'cpa-asc': return a.cpa - b.cpa
        case 'spend-desc': return b.spend - a.spend
        default: return 0
      }
    })

  const getRoasColor = (roas: number) => {
    if (roas >= 400) return 'text-success-main'
    if (roas >= 300) return 'text-primary-main'
    if (roas >= 200) return 'text-warning-main'
    return 'text-error-main'
  }

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <span className="px-2 py-1 bg-success-light text-success-main text-xs font-medium rounded-full">활성</span>
    }
    return <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">일시중지</span>
  }

  const getTypeBadge = (type: string) => {
    const badges: Record<string, string> = {
      image: 'bg-blue-100 text-blue-700',
      video: 'bg-purple-100 text-purple-700',
      carousel: 'bg-orange-100 text-orange-700',
    }
    return <span className={cn("px-2 py-1 text-xs font-medium rounded-full", badges[type])}>{type}</span>
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">크리에이티브 분석</h1>
        <p className="text-sm text-gray-500 mt-1">Creative Dashboard - 광고 소재별 성과 분석</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiSummary.map((kpi, idx) => (
          <Card key={idx} className={cn("border-l-4", `border-l-${kpi.color}-main`)}>
            <CardContent className="p-5">
              <p className="text-sm text-gray-600 mb-1">{kpi.title}</p>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 필터 및 정렬 */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* 정렬 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">정렬:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-main"
                >
                  {sortOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* 타입 필터 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">타입:</span>
                <div className="flex gap-1">
                  {typeOptions.map(type => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                        typeFilter === type
                          ? "bg-primary-main text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-primary-light hover:text-primary-main"
                      )}
                    >
                      {type === '전체' ? '전체' : type}
                    </button>
                  ))}
                </div>
              </div>

              {/* 상태 필터 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">상태:</span>
                <div className="flex gap-1">
                  {statusOptions.map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                        statusFilter === status
                          ? "bg-primary-main text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-primary-light hover:text-primary-main"
                      )}
                    >
                      {status === '전체' ? '전체' : status === 'active' ? '활성' : '일시중지'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 뷰 모드 토글 */}
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'grid'
                    ? "bg-primary-main text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-primary-light"
                )}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === 'list'
                    ? "bg-primary-main text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-primary-light"
                )}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-500">
            {filteredData.length}개 소재 표시 중
          </div>
        </CardContent>
      </Card>

      {/* 소재 그리드/리스트 */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredData.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden group cursor-pointer"
            >
              {/* 이미지 영역 */}
              <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 bg-gray-300 rounded-lg flex items-center justify-center">
                      {item.type === 'video' ? (
                        <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{item.name}</span>
                  </div>
                </div>

                {/* 상태 뱃지 */}
                <div className="absolute top-2 left-2">
                  {getStatusBadge(item.status)}
                </div>

                {/* 타입 뱃지 */}
                <div className="absolute top-2 right-2">
                  {getTypeBadge(item.type)}
                </div>

                {/* 호버 오버레이 */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-primary-main hover:text-white transition-colors">
                    상세 보기
                  </button>
                </div>
              </div>

              {/* 성과 지표 */}
              <div className="p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">ROAS</span>
                  <span className={cn("text-sm font-bold", getRoasColor(item.roas))}>
                    {item.roas}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">CTR</span>
                  <span className="text-sm font-medium text-gray-900">{item.ctr}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">CPA</span>
                  <span className="text-sm font-medium text-gray-900">₩{item.cpa.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">지출</span>
                    <span className="text-sm font-medium text-gray-700">₩{(item.spend / 1000000).toFixed(1)}M</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 리스트 뷰 */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="text-left py-3.5 px-4 font-semibold text-gray-700 text-sm">소재명</th>
                    <th className="text-center py-3.5 px-4 font-semibold text-gray-700 text-sm">타입</th>
                    <th className="text-center py-3.5 px-4 font-semibold text-gray-700 text-sm">상태</th>
                    <th className="text-right py-3.5 px-4 font-semibold text-gray-700 text-sm">ROAS</th>
                    <th className="text-right py-3.5 px-4 font-semibold text-gray-700 text-sm">CTR</th>
                    <th className="text-right py-3.5 px-4 font-semibold text-gray-700 text-sm">CPA</th>
                    <th className="text-right py-3.5 px-4 font-semibold text-gray-700 text-sm">지출</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {item.type === 'video' ? (
                              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <span className="font-medium text-gray-900">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">{getTypeBadge(item.type)}</td>
                      <td className="py-3.5 px-4 text-center">{getStatusBadge(item.status)}</td>
                      <td className={cn("py-3.5 px-4 text-right font-bold", getRoasColor(item.roas))}>{item.roas}%</td>
                      <td className="py-3.5 px-4 text-right text-gray-900">{item.ctr}%</td>
                      <td className="py-3.5 px-4 text-right text-gray-900">₩{item.cpa.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right text-gray-900">₩{(item.spend / 1000000).toFixed(1)}M</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
