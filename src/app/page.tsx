'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

// KPI 데이터 타입
type KPIData = {
  title: string
  value: string
  icon: string
  trend?: string
  trendValue?: string // 변화율 (↑ 5%)
  trendPP?: string // %p 또는 차이값 (+15%p, +₩1,000,000)
  trendPPType?: 'positive' | 'negative' | 'neutral'
  trendDetail?: string // 이전 값 (이전 ₩1,000,000)
  trendType?: 'up' | 'down' | 'neutral'
  highlight?: boolean
  secondary?: boolean
}

// 더미 KPI 데이터 (전체 탭용 - 요약, 트렌드 없음)
const summaryPrimaryKPIs: KPIData[] = [
  { title: '총 비용', value: '₩45,000,000', icon: '💰', trend: '전체 기간 합계', trendType: 'neutral' },
  { title: 'ROAS', value: '300%', icon: '📈', trend: '광고 수익률', trendType: 'neutral', highlight: true },
  { title: 'CPA', value: '₩33,333', icon: '🎯', trend: '전환당 비용', trendType: 'neutral' },
  { title: 'CPC', value: '₩360', icon: '🖱️', trend: '클릭당 비용', trendType: 'neutral' },
  { title: 'CPM', value: '₩8,654', icon: '👁️', trend: '노출당 비용', trendType: 'neutral' },
]

const summarySecondaryKPIs: KPIData[] = [
  { title: '총 노출', value: '5,200,000', icon: '👀', trend: '회', trendType: 'neutral', secondary: true },
  { title: '총 클릭', value: '125,000', icon: '👆', trend: '회', trendType: 'neutral', secondary: true },
  { title: '총 전환수', value: '1,350', icon: '✅', trend: '건', trendType: 'neutral', secondary: true },
  { title: '총 전환값', value: '₩135,000,000', icon: '💵', trend: '원', trendType: 'neutral', secondary: true },
]

// 기간별 탭용 KPI 데이터 (월별/주별/일별 - 트렌드 있음)
const periodPrimaryKPIs: KPIData[] = [
  { title: '비용', value: '₩15,000,000', icon: '💰', trendValue: '↑ 3%', trendPP: '+₩450,000', trendPPType: 'positive', trendDetail: '이전 ₩14,550,000', trendType: 'up' },
  { title: 'ROAS', value: '300%', icon: '📈', trendValue: '↑ 5%', trendPP: '+15%p', trendPPType: 'positive', trendDetail: '이전 285%', trendType: 'up', highlight: true },
  { title: 'CPA', value: '₩33,333', icon: '🎯', trendValue: '↓ 2%', trendPP: '-₩680', trendPPType: 'positive', trendDetail: '이전 ₩34,013', trendType: 'down' },
  { title: 'CPC', value: '₩360', icon: '🖱️', trendValue: '↓ 1%', trendPP: '-₩4', trendPPType: 'positive', trendDetail: '이전 ₩364', trendType: 'down' },
  { title: 'CPM', value: '₩8,651', icon: '👁️', trendValue: '↑ 2%', trendPP: '+₩170', trendPPType: 'negative', trendDetail: '이전 ₩8,481', trendType: 'up' },
]

const periodSecondaryKPIs: KPIData[] = [
  { title: '노출', value: '1,734,104', icon: '👀', trendValue: '↑ 5%', trendPP: '+82,576', trendPPType: 'positive', trendDetail: '이전 1,651,528', trendType: 'up', secondary: true },
  { title: '클릭', value: '41,667', icon: '👆', trendValue: '↑ 8%', trendPP: '+3,086', trendPPType: 'positive', trendDetail: '이전 38,581', trendType: 'up', secondary: true },
  { title: '전환수', value: '450', icon: '✅', trendValue: '↑ 7%', trendPP: '+29', trendPPType: 'positive', trendDetail: '이전 421', trendType: 'up', secondary: true },
  { title: '전환값', value: '₩45,000,000', icon: '💵', trendValue: '↑ 7%', trendPP: '+₩2,940,000', trendPPType: 'positive', trendDetail: '이전 ₩42,060,000', trendType: 'up', secondary: true },
]

// 테이블 데이터
const tableData = [
  { period: '2024-12', cost: 15000000, impressions: 1734104, cpm: 8651, clicks: 41667, cpc: 360, conversions: 450, cpa: 33333, convValue: 45000000, roas: 300 },
  { period: '2024-11', cost: 14500000, impressions: 1650000, cpm: 8788, clicks: 38500, cpc: 377, conversions: 420, cpa: 34524, convValue: 42000000, roas: 290 },
  { period: '2024-10', cost: 15500000, impressions: 1800000, cpm: 8611, clicks: 43000, cpc: 360, conversions: 480, cpa: 32292, convValue: 48000000, roas: 310 },
  { period: '2024-09', cost: 13000000, impressions: 1500000, cpm: 8667, clicks: 36000, cpc: 361, conversions: 390, cpa: 33333, convValue: 39000000, roas: 300 },
  { period: '2024-08', cost: 12500000, impressions: 1450000, cpm: 8621, clicks: 34500, cpc: 362, conversions: 375, cpa: 33333, convValue: 37500000, roas: 300 },
  { period: '2024-07', cost: 14000000, impressions: 1620000, cpm: 8642, clicks: 38800, cpc: 361, conversions: 420, cpa: 33333, convValue: 42000000, roas: 300 },
]

// 숫자 포맷팅 함수
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('ko-KR').format(Math.round(num))
}

const formatCurrency = (num: number) => {
  return `₩${formatNumber(num)}`
}

export default function MarketingDashboard() {
  const [filterExpanded, setFilterExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'total' | 'monthly' | 'weekly' | 'daily'>('total')
  const [kpiView, setKpiView] = useState<'primary' | 'all'>('primary')
  const [visibleRows, setVisibleRows] = useState(3)
  const [chartToggles, setChartToggles] = useState({
    cost: true,
    cpm: false,
    cpc: false,
    cpa: false,
    roas: true,
  })
  const [showDataLabels, setShowDataLabels] = useState(false)

  const toggleChart = (key: keyof typeof chartToggles) => {
    setChartToggles(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // 합계 계산
  const totals = tableData.reduce((acc, row) => {
    acc.cost += row.cost
    acc.impressions += row.impressions
    acc.clicks += row.clicks
    acc.conversions += row.conversions
    acc.convValue += row.convValue
    return acc
  }, { cost: 0, impressions: 0, clicks: 0, conversions: 0, convValue: 0 })

  const totalCPM = totals.impressions > 0 ? (totals.cost / totals.impressions * 1000) : 0
  const totalCPC = totals.clicks > 0 ? (totals.cost / totals.clicks) : 0
  const totalCPA = totals.conversions > 0 ? (totals.cost / totals.conversions) : 0
  const totalROAS = totals.cost > 0 ? (totals.convValue / totals.cost * 100) : 0

  // 현재 탭에 따른 KPI 데이터 선택
  const currentPrimaryKPIs = activeTab === 'total' ? summaryPrimaryKPIs : periodPrimaryKPIs
  const currentSecondaryKPIs = activeTab === 'total' ? summarySecondaryKPIs : periodSecondaryKPIs

  // KPI 카드 렌더링 함수
  const renderKPICard = (kpi: KPIData, idx: number) => {
    const isPeriodTab = activeTab !== 'total'

    return (
      <div
        key={idx}
        className={cn(
          "p-5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] relative overflow-hidden hover:-translate-y-[3px] hover:shadow-[0_6px_16px_rgba(0,0,0,0.1)] transition-all",
          kpi.secondary ? "bg-gray-50" : "bg-white",
          kpi.highlight && "border-l-4 border-l-primary-main"
        )}
      >
        {/* kpi-header */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-[13px] text-gray-600 font-semibold">{kpi.title}</span>
          <div className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center text-primary-main text-base",
            kpi.secondary ? "bg-gray-200" : "bg-gray-100"
          )}>
            {kpi.icon}
          </div>
        </div>

        {/* kpi-value */}
        <div className={cn(
          "text-[26px] font-bold mb-2",
          kpi.highlight ? "text-primary-main" : "text-gray-900"
        )}>
          {kpi.value}
        </div>

        {/* kpi-trend - 전체 탭: 단순 텍스트, 기간 탭: 트렌드 정보 */}
        {isPeriodTab && kpi.trendValue ? (
          <div className="mt-1">
            {/* trend-wrapper */}
            <div className="flex items-center gap-1 flex-wrap">
              {/* trend (변화율) */}
              <span className={cn(
                "inline-flex items-center gap-0.5 text-[9px] font-semibold px-1 py-0.5 rounded-lg",
                kpi.trendType === 'up' ? "text-success-main bg-success-light" : kpi.trendType === 'down' ? "text-error-main bg-error-light" : "text-gray-500 bg-gray-100"
              )}>
                {kpi.trendValue}
              </span>
              {/* trend-pp */}
              {kpi.trendPP && (
                <span className={cn(
                  "inline-flex items-center gap-0.5 text-[9px] font-semibold px-1 py-0.5 rounded-lg",
                  kpi.trendPPType === 'positive' ? "text-success-main bg-success-light" : kpi.trendPPType === 'negative' ? "text-error-main bg-error-light" : "text-gray-700 bg-gray-100"
                )}>
                  {kpi.trendPP}
                </span>
              )}
            </div>
            {/* trend-detail */}
            {kpi.trendDetail && (
              <div className="text-[9px] text-gray-500 flex items-center gap-1 mt-1.5">
                <span className="text-[8px] font-medium text-gray-500">이전</span>
                <span className="text-[11px] font-semibold text-gray-700">{kpi.trendDetail.replace('이전 ', '')}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-[13px] text-gray-500 flex items-center gap-1.5">
            <span>{kpi.trend}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="header">
        <h1 className="text-2xl font-bold text-gray-900">마케팅 성과 대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">광고 캠페인 성과 분석 및 KPI 모니터링</p>
      </div>

      {/* 필터 설정 (접기/펼치기) - collapsible-section */}
      <div className="mb-6">
        {/* collapsible-header */}
        <div
          className="flex justify-between items-center cursor-pointer select-none px-5 py-4 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow"
          onClick={() => setFilterExpanded(!filterExpanded)}
        >
          {/* collapsible-title */}
          <div className="flex items-center gap-2.5 text-base font-semibold text-gray-900">
            <div className="w-1 h-5 bg-primary-main rounded-sm" />
            <span>필터 설정</span>
            <span className="text-xs font-normal text-gray-500 ml-2">* 펼쳐서 세부 성과를 필터링할 수 있어요</span>
          </div>
          {/* collapsible-toggle */}
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-light text-primary-main border-none rounded-lg text-[13px] font-medium cursor-pointer hover:bg-primary-main hover:text-white transition-colors">
            <span>{filterExpanded ? '접기' : '펼치기'}</span>
            <span className={cn("transition-transform duration-200", filterExpanded ? "rotate-180" : "")}>▼</span>
          </button>
        </div>

        {/* collapsible-content */}
        <div className={cn(
          "overflow-hidden transition-all duration-300",
          filterExpanded ? "max-h-[2000px] opacity-100 pt-4" : "max-h-0 opacity-0"
        )}>
          {/* 기간 및 기본 필터 - filter-section card */}
          <div className="bg-white rounded-xl shadow-[0_2px_14px_0_rgba(32,40,45,0.08)] p-5 px-6 mb-4 hover:shadow-[0_4px_20px_0_rgba(32,40,45,0.12)] transition-shadow">
            {/* filter-section-header */}
            <div className="flex justify-between items-center mb-4">
              {/* filter-header */}
              <div className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-1 h-5 bg-primary-main rounded-sm" />
                <span>기간 및 기본 필터</span>
              </div>
              {/* reset-btn */}
              <button className="px-4 py-2 border-none bg-white text-gray-700 rounded-lg cursor-pointer text-xs font-medium shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:bg-primary-light hover:text-primary-main transition-all active:scale-[0.97]">
                초기화
              </button>
            </div>

            {/* filter-inline-container */}
            <div className="flex items-start gap-12 flex-wrap">
              {/* filter-date-section */}
              <div className="flex flex-col gap-[37px]">
                {/* filter-label */}
                <div className="text-sm font-semibold text-gray-900 flex items-center gap-2 whitespace-nowrap">
                  <div className="w-1 h-[18px] bg-primary-main rounded-sm" />
                  <span>기간 선택</span>
                </div>
                {/* date-range */}
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    className="px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-inherit bg-white text-gray-900 hover:border-primary-main focus:outline-none focus:border-primary-main focus:shadow-[0_0_0_3px_var(--primary-light)] transition-all"
                  />
                  <span className="text-gray-500 font-medium">~</span>
                  <input
                    type="date"
                    className="px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-inherit bg-white text-gray-900 hover:border-primary-main focus:outline-none focus:border-primary-main focus:shadow-[0_0_0_3px_var(--primary-light)] transition-all"
                  />
                </div>
              </div>

              {/* filter-setting-section */}
              <div className="flex flex-col gap-3 flex-1">
                {/* filter-label */}
                <div className="text-sm font-semibold text-gray-900 flex items-center gap-2 whitespace-nowrap">
                  <div className="w-1 h-[18px] bg-primary-main rounded-sm" />
                  <span>기본 필터</span>
                </div>
                {/* filter-items */}
                <div className="flex items-end gap-4 flex-1 flex-wrap">
                  {/* filter-group */}
                  <div className="flex flex-col min-w-[160px] flex-1">
                    <label className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-[0.5px]">유형구분</label>
                    <select className="px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-inherit bg-white text-gray-900 hover:border-primary-main focus:outline-none focus:border-primary-main focus:shadow-[0_0_0_3px_var(--primary-light)] transition-all">
                      <option value="">전체</option>
                    </select>
                  </div>
                  <div className="flex flex-col min-w-[160px] flex-1">
                    <label className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-[0.5px]">브랜드명</label>
                    <select className="px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-inherit bg-white text-gray-900 hover:border-primary-main focus:outline-none focus:border-primary-main focus:shadow-[0_0_0_3px_var(--primary-light)] transition-all">
                      <option value="">전체</option>
                    </select>
                  </div>
                  <div className="flex flex-col min-w-[160px] flex-1">
                    <label className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-[0.5px]">상품명</label>
                    <select className="px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-inherit bg-white text-gray-900 hover:border-primary-main focus:outline-none focus:border-primary-main focus:shadow-[0_0_0_3px_var(--primary-light)] transition-all">
                      <option value="">전체</option>
                    </select>
                  </div>
                  <div className="flex flex-col min-w-[160px] flex-1">
                    <label className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-[0.5px]">프로모션</label>
                    <select className="px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-inherit bg-white text-gray-900 hover:border-primary-main focus:outline-none focus:border-primary-main focus:shadow-[0_0_0_3px_var(--primary-light)] transition-all">
                      <option value="">전체</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 세부 필터 - filter-section card */}
          <div className="bg-white rounded-xl shadow-[0_2px_14px_0_rgba(32,40,45,0.08)] p-5 px-6 hover:shadow-[0_4px_20px_0_rgba(32,40,45,0.12)] transition-shadow">
            {/* filter-section-header */}
            <div className="flex justify-between items-center mb-4">
              {/* filter-header */}
              <div className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-1 h-5 bg-primary-main rounded-sm" />
                <span>세부 필터</span>
              </div>
              {/* reset-btn */}
              <button className="px-4 py-2 border-none bg-white text-gray-700 rounded-lg cursor-pointer text-xs font-medium shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:bg-primary-light hover:text-primary-main transition-all active:scale-[0.97]">
                초기화
              </button>
            </div>

            {/* filter-row */}
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col min-w-[160px] flex-1">
                <label className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-[0.5px]">캠페인</label>
                <select className="px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-inherit bg-white text-gray-900 hover:border-primary-main focus:outline-none focus:border-primary-main focus:shadow-[0_0_0_3px_var(--primary-light)] transition-all">
                  <option value="">전체</option>
                </select>
              </div>
              <div className="flex flex-col min-w-[160px] flex-1">
                <label className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-[0.5px]">세트이름</label>
                <select className="px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-inherit bg-white text-gray-900 hover:border-primary-main focus:outline-none focus:border-primary-main focus:shadow-[0_0_0_3px_var(--primary-light)] transition-all">
                  <option value="">전체</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 통합 KPI 섹션 - kpi-unified-section */}
      <div className="mb-6">
        {/* kpi-controls-row */}
        <div className="flex justify-between items-center mb-4">
          {/* kpi-tab-section */}
          <div className="flex gap-2">
            {(['total', 'monthly', 'weekly', 'daily'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2.5 border-none rounded-lg cursor-pointer font-medium transition-all",
                  activeTab === tab
                    ? "bg-primary-main text-white shadow-[0_4px_12px_rgba(103,58,183,0.4)]"
                    : "bg-white text-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:bg-primary-light hover:text-primary-main"
                )}
              >
                {tab === 'total' ? '전체' : tab === 'monthly' ? '월별' : tab === 'weekly' ? '주별' : '일별'}
              </button>
            ))}
          </div>

          {/* kpi-view-toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setKpiView('primary')}
              className={cn(
                "px-6 py-2.5 border-none rounded-lg cursor-pointer font-medium transition-all",
                kpiView === 'primary'
                  ? "bg-primary-main text-white shadow-[0_4px_12px_rgba(103,58,183,0.4)]"
                  : "bg-white text-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:bg-primary-light hover:text-primary-main"
              )}
            >
              주요 성과
            </button>
            <button
              onClick={() => setKpiView('all')}
              className={cn(
                "px-6 py-2.5 border-none rounded-lg cursor-pointer font-medium transition-all",
                kpiView === 'all'
                  ? "bg-primary-main text-white shadow-[0_4px_12px_rgba(103,58,183,0.4)]"
                  : "bg-white text-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:bg-primary-light hover:text-primary-main"
              )}
            >
              세부 성과
            </button>
          </div>
        </div>

        {/* kpi-section */}
        <div>
          {/* kpi-grid kpi-grid-primary */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6">
            {currentPrimaryKPIs.map((kpi, idx) => renderKPICard(kpi, idx))}
          </div>

          {/* kpi-grid kpi-grid-secondary */}
          {kpiView === 'all' && (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mt-4">
              {currentSecondaryKPIs.map((kpi, idx) => renderKPICard(kpi, idx))}
            </div>
          )}
        </div>
      </div>

      {/* 차트 섹션 - chart-section card */}
      <div className="bg-white rounded-xl shadow-[0_2px_14px_0_rgba(32,40,45,0.08)] p-6 mb-6 hover:shadow-[0_4px_20px_0_rgba(32,40,45,0.12)] transition-shadow">
        {/* chart-section-header */}
        <div className="flex justify-between items-center mb-5">
          {/* chart-header */}
          <div className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <div className="w-1 h-5 bg-secondary-main rounded-sm" />
            <span>성과 지표 추이</span>
          </div>
          {/* data-label-toggle */}
          <button
            onClick={() => setShowDataLabels(!showDataLabels)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 border-none rounded-lg cursor-pointer text-[13px] font-medium font-inherit transition-all",
              showDataLabels
                ? "bg-primary-main text-white shadow-[0_4px_12px_rgba(103,58,183,0.4)]"
                : "bg-white text-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:bg-primary-light hover:text-primary-main"
            )}
          >
            <span className="text-sm">{showDataLabels ? '✓' : '☐'}</span>
            <span>데이터 라벨</span>
          </button>
        </div>

        {/* chart-controls */}
        <div className="flex items-center gap-4 mb-5 flex-wrap">
          {[
            { key: 'cost' as const, label: '비용' },
            { key: 'cpm' as const, label: 'CPM' },
            { key: 'cpc' as const, label: 'CPC' },
            { key: 'cpa' as const, label: 'CPA' },
            { key: 'roas' as const, label: 'ROAS' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleChart(key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 border-none rounded-lg cursor-pointer text-[13px] font-medium font-inherit transition-all",
                chartToggles[key]
                  ? "bg-primary-main text-white shadow-[0_4px_12px_rgba(103,58,183,0.4)]"
                  : "bg-white text-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:bg-primary-light hover:text-primary-main"
              )}
            >
              <span className="text-sm">{chartToggles[key] ? '✓' : '☐'}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* chart-container */}
        <div className="relative h-[300px] bg-gray-50 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Chart.js 차트 영역 (데이터 연동 예정)</p>
        </div>
      </div>

      {/* 데이터 테이블 - table-section card */}
      <div className="bg-white rounded-xl shadow-[0_2px_14px_0_rgba(32,40,45,0.08)] overflow-hidden hover:shadow-[0_4px_20px_0_rgba(32,40,45,0.12)] transition-shadow">
        {/* table-header */}
        <div className="px-6 py-5 border-b border-gray-200 text-base font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-1 h-5 bg-success-main rounded-sm" />
          <span>상세 데이터</span>
        </div>

        {/* table-container */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left py-3.5 px-4 bg-gray-50 font-semibold text-gray-700 text-sm border-b-2 border-gray-200 sticky left-0 z-[2] whitespace-nowrap">기간</th>
                <th className="text-right py-3.5 px-4 bg-gray-50 font-semibold text-gray-700 text-sm border-b-2 border-gray-200 whitespace-nowrap">비용</th>
                <th className="text-right py-3.5 px-4 bg-gray-50 font-semibold text-gray-700 text-sm border-b-2 border-gray-200 whitespace-nowrap">노출</th>
                <th className="text-right py-3.5 px-4 bg-gray-50 font-semibold text-gray-700 text-sm border-b-2 border-gray-200 whitespace-nowrap">CPM</th>
                <th className="text-right py-3.5 px-4 bg-gray-50 font-semibold text-gray-700 text-sm border-b-2 border-gray-200 whitespace-nowrap">클릭</th>
                <th className="text-right py-3.5 px-4 bg-gray-50 font-semibold text-gray-700 text-sm border-b-2 border-gray-200 whitespace-nowrap">CPC</th>
                <th className="text-right py-3.5 px-4 bg-gray-50 font-semibold text-gray-700 text-sm border-b-2 border-gray-200 whitespace-nowrap">전환수</th>
                <th className="text-right py-3.5 px-4 bg-gray-50 font-semibold text-gray-700 text-sm border-b-2 border-gray-200 whitespace-nowrap">CPA</th>
                <th className="text-right py-3.5 px-4 bg-gray-50 font-semibold text-gray-700 text-sm border-b-2 border-gray-200 whitespace-nowrap">전환값</th>
                <th className="text-right py-3.5 px-4 bg-gray-50 font-semibold text-gray-700 text-sm border-b-2 border-gray-200 whitespace-nowrap">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {tableData.slice(0, visibleRows).map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="text-left py-3.5 px-4 border-b border-gray-100 font-medium text-gray-900 sticky left-0 bg-white">{row.period}</td>
                  <td className="text-right py-3.5 px-4 border-b border-gray-100 text-gray-900">{formatCurrency(row.cost)}</td>
                  <td className="text-right py-3.5 px-4 border-b border-gray-100 text-gray-900">{formatNumber(row.impressions)}</td>
                  <td className="text-right py-3.5 px-4 border-b border-gray-100 text-gray-900">{formatCurrency(row.cpm)}</td>
                  <td className="text-right py-3.5 px-4 border-b border-gray-100 text-gray-900">{formatNumber(row.clicks)}</td>
                  <td className="text-right py-3.5 px-4 border-b border-gray-100 text-gray-900">{formatCurrency(row.cpc)}</td>
                  <td className="text-right py-3.5 px-4 border-b border-gray-100 text-gray-900">{formatNumber(row.conversions)}</td>
                  <td className="text-right py-3.5 px-4 border-b border-gray-100 text-gray-900">{formatCurrency(row.cpa)}</td>
                  <td className="text-right py-3.5 px-4 border-b border-gray-100 text-gray-900">{formatCurrency(row.convValue)}</td>
                  <td className={cn(
                    "text-right py-3.5 px-4 border-b border-gray-100 font-semibold",
                    row.roas >= 100 ? "text-success-main" : "text-error-main"
                  )}>{row.roas}%</td>
                </tr>
              ))}
              {/* 합계 행 - total-row */}
              <tr className="bg-primary-light font-semibold">
                <td className="text-left py-3.5 px-4 border-t-2 border-primary-main text-primary-dark sticky left-0 bg-primary-light">합계</td>
                <td className="text-right py-3.5 px-4 border-t-2 border-primary-main text-primary-dark">{formatCurrency(totals.cost)}</td>
                <td className="text-right py-3.5 px-4 border-t-2 border-primary-main text-primary-dark">{formatNumber(totals.impressions)}</td>
                <td className="text-right py-3.5 px-4 border-t-2 border-primary-main text-primary-dark">{formatCurrency(totalCPM)}</td>
                <td className="text-right py-3.5 px-4 border-t-2 border-primary-main text-primary-dark">{formatNumber(totals.clicks)}</td>
                <td className="text-right py-3.5 px-4 border-t-2 border-primary-main text-primary-dark">{formatCurrency(totalCPC)}</td>
                <td className="text-right py-3.5 px-4 border-t-2 border-primary-main text-primary-dark">{formatNumber(totals.conversions)}</td>
                <td className="text-right py-3.5 px-4 border-t-2 border-primary-main text-primary-dark">{formatCurrency(totalCPA)}</td>
                <td className="text-right py-3.5 px-4 border-t-2 border-primary-main text-primary-dark">{formatCurrency(totals.convValue)}</td>
                <td className={cn(
                  "text-right py-3.5 px-4 border-t-2 border-primary-main font-semibold",
                  totalROAS >= 100 ? "text-success-main" : "text-error-main"
                )}>{Math.round(totalROAS)}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* show-more-container */}
        <div className="px-6 py-4 text-center border-t border-gray-200">
          {visibleRows < tableData.length ? (
            <button
              onClick={() => setVisibleRows(tableData.length)}
              className="px-8 py-2.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg cursor-pointer font-medium text-sm font-inherit hover:bg-primary-light hover:text-primary-main hover:border-primary-main transition-all"
            >
              더 보기 ({tableData.length - visibleRows}개)
            </button>
          ) : (
            <button
              onClick={() => setVisibleRows(3)}
              className="px-8 py-2.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg cursor-pointer font-medium text-sm font-inherit hover:bg-primary-light hover:text-primary-main hover:border-primary-main transition-all"
            >
              접기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
