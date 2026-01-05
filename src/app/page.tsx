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

  // 필터 상태 관리
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [filterProduct, setFilterProduct] = useState('')
  const [filterPromotion, setFilterPromotion] = useState('')
  const [filterCampaign, setFilterCampaign] = useState('')
  const [filterAdset, setFilterAdset] = useState('')

  // 기간 및 기본 필터 초기화
  const resetBasicFilters = () => {
    setStartDate('')
    setEndDate('')
    setFilterType('')
    setFilterBrand('')
    setFilterProduct('')
    setFilterPromotion('')
  }

  // 세부 필터 초기화
  const resetDetailFilters = () => {
    setFilterCampaign('')
    setFilterAdset('')
  }

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

  // KPI 카드 렌더링 함수 - 원본 HTML과 정확히 일치
  const renderKPICard = (kpi: KPIData, idx: number) => {
    const isPeriodTab = activeTab !== 'total'

    // isGood 로직: trendPPType에 따라 결정 (비즈니스적으로 좋은 변화인지)
    // positive면 green (up class), negative면 red (down class)
    const isGood = kpi.trendPPType === 'positive'

    return (
      <div
        key={idx}
        className={cn(
          // kpi-card: padding 20px, border-radius 12px, shadow 0 2px 8px rgba(0,0,0,0.06)
          "p-[20px] rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] relative overflow-hidden",
          "hover:-translate-y-[3px] hover:shadow-[0_6px_16px_rgba(0,0,0,0.1)] transition-all duration-200",
          kpi.secondary ? "bg-[#fafafa]" : "bg-white",
          kpi.highlight && "border-l-[4px] border-l-[#673ab7]"
        )}
      >
        {/* kpi-header: margin-bottom 12px */}
        <div className="flex justify-between items-center mb-[12px]">
          {/* kpi-title: font-size 13px, color grey-600, font-weight 600 */}
          <span className="text-[13px] text-[#757575] font-semibold">{kpi.title}</span>
          {/* kpi-icon: 36px, background grey-100, border-radius 50% */}
          <div className={cn(
            "w-[36px] h-[36px] rounded-full flex items-center justify-center text-[#673ab7] text-[16px]",
            kpi.secondary ? "bg-[#eeeeee]" : "bg-[#f5f5f5]"
          )}>
            {kpi.icon}
          </div>
        </div>

        {/* kpi-value: font-size 26px, font-weight 700, margin-bottom 8px */}
        <div className={cn(
          "text-[26px] font-bold mb-[8px]",
          kpi.highlight ? "text-[#673ab7]" : "text-[#212121]"
        )}>
          {kpi.value}
        </div>

        {/* 기간탭: kpi-trend + trend-detail */}
        {isPeriodTab && kpi.trendValue ? (
          <>
            {/* kpi-trend: font-size 13px, display flex, gap 6px, flex-wrap wrap */}
            {/* 원본에서 .kpi-trend.up/down은 var(--success)/var(--error) 사용하나 미정의 */}
            {/* trend-value 색상은 상속 (기본 검정), trend-pp만 colored badge */}
            <div className="text-[13px] flex items-center gap-[6px] flex-wrap">
              {/* trend-value: font-weight 600, 색상 상속 (grey-900) */}
              <span className="font-semibold text-[#212121]">{kpi.trendValue}</span>
              {/* trend-pp: font-size 9px, padding 1px 4px, border-radius 8px */}
              {kpi.trendPP && (
                <span className={cn(
                  "inline-flex items-center gap-[1px] text-[9px] font-semibold px-[4px] py-[1px] rounded-[8px]",
                  kpi.trendPPType === 'positive'
                    ? "text-[#00c853] bg-[#b9f6ca]"
                    : kpi.trendPPType === 'negative'
                    ? "text-[#ff1744] bg-[#ffeaea]"
                    : "text-[#616161] bg-[#f5f5f5]"
                )}>
                  {kpi.trendPP}
                </span>
              )}
            </div>
            {/* trend-detail: font-size 9px, display flex, gap 3px, margin-top 6px */}
            {kpi.trendDetail && (
              <div className="text-[9px] text-[#9e9e9e] flex items-center gap-[3px] mt-[6px]">
                {/* prev-label: font-size 8px, margin-right 4px */}
                <span className="text-[8px] font-medium text-[#9e9e9e] mr-[4px]">이전</span>
                {/* prev-value: font-size 11px, font-weight 600, color grey-700 */}
                <span className="text-[11px] font-semibold text-[#616161]">{kpi.trendDetail.replace('이전 ', '')}</span>
              </div>
            )}
          </>
        ) : (
          // 전체탭: kpi-trend.neutral - font-size 13px, color grey-500
          <div className="text-[13px] text-[#9e9e9e] flex items-center gap-[6px]">
            <span>{kpi.trend}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-[24px]">
      {/* 헤더 - header: margin-bottom 24px */}
      <div className="flex items-center justify-between mb-[24px]">
        <div>
          {/* h1: font-size 24px, font-weight 700, color grey-900 */}
          <h1 className="text-[24px] font-bold text-[#212121] m-0">마케팅 성과 대시보드</h1>
          {/* header-subtitle: font-size 14px, color grey-500, margin-top 4px */}
          <p className="text-[14px] text-[#9e9e9e] mt-[4px]">광고 캠페인 성과 분석 및 KPI 모니터링</p>
        </div>
      </div>

      {/* 필터 설정 (접기/펼치기) - collapsible-section: margin-bottom 24px */}
      <div className="mb-[24px]">
        {/* collapsible-header: padding 16px 20px, border-radius 12px, shadow 0 2px 8px rgba(0,0,0,0.08) */}
        <div
          className="flex justify-between items-center cursor-pointer select-none px-[20px] py-[16px] bg-white rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow duration-200"
          onClick={() => setFilterExpanded(!filterExpanded)}
        >
          {/* collapsible-title: gap 10px, font-size 16px, font-weight 600 */}
          <div className="flex items-center gap-[10px] text-[16px] font-semibold text-[#212121]">
            {/* ::before: width 4px, height 20px, border-radius 2px */}
            <div className="w-[4px] h-[20px] bg-[#673ab7] rounded-[2px]" />
            <span>필터 설정</span>
            {/* collapsible-guide: font-size 12px, font-weight 400, color grey-500, margin-left 8px */}
            <span className="text-[12px] font-normal text-[#9e9e9e] ml-[8px]">* 펼쳐서 세부 성과를 필터링할 수 있어요</span>
          </div>
          {/* collapsible-toggle: padding 8px 16px, border-radius 8px, font-size 13px, font-weight 500 */}
          <button className="flex items-center gap-[8px] px-[16px] py-[8px] bg-[#ede7f6] text-[#673ab7] border-none rounded-[8px] text-[13px] font-medium cursor-pointer hover:bg-[#673ab7] hover:text-white transition-all duration-150">
            <span>{filterExpanded ? '접기' : '펼치기'}</span>
            <span className={cn("transition-transform duration-200", filterExpanded ? "rotate-180" : "")}>▼</span>
          </button>
        </div>

        {/* collapsible-content: max-height 2000px, padding-top 16px when expanded */}
        <div className={cn(
          "overflow-hidden transition-all duration-300",
          filterExpanded ? "max-h-[2000px] opacity-100 pt-[16px]" : "max-h-0 opacity-0"
        )}>
          {/* 기간 및 기본 필터 - filter-section card: padding 20px 24px, margin-bottom 16px (원본 inline style) */}
          <div className="bg-white rounded-[12px] shadow-[0_2px_14px_0_rgba(32,40,45,0.08)] py-[20px] px-[24px] mb-[16px] hover:shadow-[0_4px_20px_0_rgba(32,40,45,0.12)] transition-shadow duration-300">
            {/* filter-section-header: margin-bottom 16px */}
            <div className="flex justify-between items-center mb-[16px]">
              {/* filter-header: font-size 16px, font-weight 600, gap 8px */}
              <div className="text-[16px] font-semibold text-[#212121] flex items-center gap-[8px]">
                {/* ::before: width 4px, height 20px, border-radius 2px */}
                <div className="w-[4px] h-[20px] bg-[#673ab7] rounded-[2px]" />
                <span>기간 및 기본 필터</span>
              </div>
              {/* reset-btn: padding 8px 16px, border-radius 8px, font-size 12px */}
              <button
                onClick={resetBasicFilters}
                className="px-[16px] py-[8px] border-none bg-white text-[#616161] rounded-[8px] cursor-pointer text-[12px] font-medium shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:bg-[#ede7f6] hover:text-[#673ab7] transition-all duration-200 active:scale-[0.97]"
              >
                초기화
              </button>
            </div>

            {/* filter-inline-container: gap 48px */}
            <div className="flex items-start gap-[48px] flex-wrap">
              {/* filter-date-section: gap 37px */}
              <div className="flex flex-col gap-[37px]">
                {/* filter-label: font-size 14px, font-weight 600, gap 8px */}
                <div className="text-[14px] font-semibold text-[#212121] flex items-center gap-[8px] whitespace-nowrap">
                  {/* ::before: width 4px, height 18px, border-radius 2px */}
                  <div className="w-[4px] h-[18px] bg-[#673ab7] rounded-[2px]" />
                  <span>기간 선택</span>
                </div>
                {/* date-range: gap 12px */}
                <div className="flex items-center gap-[12px]">
                  {/* input: padding 10px 14px, border-radius 8px, font-size 14px */}
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-[14px] py-[10px] border border-[#e0e0e0] rounded-[8px] text-[14px] font-inherit bg-white text-[#212121] hover:border-[#673ab7] focus:outline-none focus:border-[#673ab7] focus:shadow-[0_0_0_3px_#ede7f6] transition-all duration-200"
                  />
                  <span className="text-[#9e9e9e] font-medium">~</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-[14px] py-[10px] border border-[#e0e0e0] rounded-[8px] text-[14px] font-inherit bg-white text-[#212121] hover:border-[#673ab7] focus:outline-none focus:border-[#673ab7] focus:shadow-[0_0_0_3px_#ede7f6] transition-all duration-200"
                  />
                </div>
              </div>

              {/* filter-setting-section: gap 12px */}
              <div className="flex flex-col gap-[12px] flex-1">
                {/* filter-label: font-size 14px, font-weight 600, gap 8px */}
                <div className="text-[14px] font-semibold text-[#212121] flex items-center gap-[8px] whitespace-nowrap">
                  <div className="w-[4px] h-[18px] bg-[#673ab7] rounded-[2px]" />
                  <span>기본 필터</span>
                </div>
                {/* filter-items: gap 16px */}
                <div className="flex items-end gap-[16px] flex-1 flex-wrap">
                  {/* filter-setting-section .filter-group: min-width 0, flex 1 */}
                  <div className="flex flex-col min-w-0 flex-1">
                    {/* label: font-size 12px, font-weight 500, margin-bottom 8px, uppercase */}
                    <label className="text-[12px] font-medium text-[#616161] mb-[8px] uppercase tracking-[0.5px]">유형구분</label>
                    {/* select: padding 10px 14px, border-radius 8px, font-size 14px */}
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-[14px] py-[10px] border border-[#e0e0e0] rounded-[8px] text-[14px] font-inherit bg-white text-[#212121] hover:border-[#673ab7] focus:outline-none focus:border-[#673ab7] focus:shadow-[0_0_0_3px_#ede7f6] transition-all duration-200"
                    >
                      <option value="">전체</option>
                    </select>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <label className="text-[12px] font-medium text-[#616161] mb-[8px] uppercase tracking-[0.5px]">브랜드명</label>
                    <select
                      value={filterBrand}
                      onChange={(e) => setFilterBrand(e.target.value)}
                      className="px-[14px] py-[10px] border border-[#e0e0e0] rounded-[8px] text-[14px] font-inherit bg-white text-[#212121] hover:border-[#673ab7] focus:outline-none focus:border-[#673ab7] focus:shadow-[0_0_0_3px_#ede7f6] transition-all duration-200"
                    >
                      <option value="">전체</option>
                    </select>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <label className="text-[12px] font-medium text-[#616161] mb-[8px] uppercase tracking-[0.5px]">상품명</label>
                    <select
                      value={filterProduct}
                      onChange={(e) => setFilterProduct(e.target.value)}
                      className="px-[14px] py-[10px] border border-[#e0e0e0] rounded-[8px] text-[14px] font-inherit bg-white text-[#212121] hover:border-[#673ab7] focus:outline-none focus:border-[#673ab7] focus:shadow-[0_0_0_3px_#ede7f6] transition-all duration-200"
                    >
                      <option value="">전체</option>
                    </select>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <label className="text-[12px] font-medium text-[#616161] mb-[8px] uppercase tracking-[0.5px]">프로모션</label>
                    <select
                      value={filterPromotion}
                      onChange={(e) => setFilterPromotion(e.target.value)}
                      className="px-[14px] py-[10px] border border-[#e0e0e0] rounded-[8px] text-[14px] font-inherit bg-white text-[#212121] hover:border-[#673ab7] focus:outline-none focus:border-[#673ab7] focus:shadow-[0_0_0_3px_#ede7f6] transition-all duration-200"
                    >
                      <option value="">전체</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 세부 필터 - filter-section card: padding 20px 24px */}
          <div className="bg-white rounded-[12px] shadow-[0_2px_14px_0_rgba(32,40,45,0.08)] py-[20px] px-[24px] hover:shadow-[0_4px_20px_0_rgba(32,40,45,0.12)] transition-shadow duration-300">
            {/* filter-section-header: margin-bottom 16px */}
            <div className="flex justify-between items-center mb-[16px]">
              {/* filter-header: font-size 16px, font-weight 600, gap 8px */}
              <div className="text-[16px] font-semibold text-[#212121] flex items-center gap-[8px]">
                <div className="w-[4px] h-[20px] bg-[#673ab7] rounded-[2px]" />
                <span>세부 필터</span>
              </div>
              {/* reset-btn: padding 8px 16px, border-radius 8px, font-size 12px */}
              <button
                onClick={resetDetailFilters}
                className="px-[16px] py-[8px] border-none bg-white text-[#616161] rounded-[8px] cursor-pointer text-[12px] font-medium shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:bg-[#ede7f6] hover:text-[#673ab7] transition-all duration-200 active:scale-[0.97]"
              >
                초기화
              </button>
            </div>

            {/* filter-row: gap 16px */}
            <div className="flex flex-wrap gap-[16px]">
              <div className="flex flex-col min-w-[160px] flex-1">
                <label className="text-[12px] font-medium text-[#616161] mb-[8px] uppercase tracking-[0.5px]">캠페인</label>
                <select
                  value={filterCampaign}
                  onChange={(e) => setFilterCampaign(e.target.value)}
                  className="px-[14px] py-[10px] border border-[#e0e0e0] rounded-[8px] text-[14px] font-inherit bg-white text-[#212121] hover:border-[#673ab7] focus:outline-none focus:border-[#673ab7] focus:shadow-[0_0_0_3px_#ede7f6] transition-all duration-200"
                >
                  <option value="">전체</option>
                </select>
              </div>
              <div className="flex flex-col min-w-[160px] flex-1">
                <label className="text-[12px] font-medium text-[#616161] mb-[8px] uppercase tracking-[0.5px]">세트이름</label>
                <select
                  value={filterAdset}
                  onChange={(e) => setFilterAdset(e.target.value)}
                  className="px-[14px] py-[10px] border border-[#e0e0e0] rounded-[8px] text-[14px] font-inherit bg-white text-[#212121] hover:border-[#673ab7] focus:outline-none focus:border-[#673ab7] focus:shadow-[0_0_0_3px_#ede7f6] transition-all duration-200"
                >
                  <option value="">전체</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 통합 KPI 섹션 - kpi-unified-section: margin-bottom 24px */}
      <div className="mb-[24px]">
        {/* kpi-controls-row: margin-bottom 16px */}
        <div className="flex justify-between items-center mb-[16px]">
          {/* kpi-tab-section: gap 8px */}
          <div className="flex gap-[8px]">
            {(['total', 'monthly', 'weekly', 'daily'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  // kpi-tab: padding 10px 24px, border-radius 8px, font-weight 500, font-size 14px
                  "px-[24px] py-[10px] border-none rounded-[8px] cursor-pointer text-[14px] font-medium transition-all duration-200",
                  activeTab === tab
                    // active: shadow 0 4px 12px rgba(103, 58, 183, 0.4)
                    ? "bg-[#673ab7] text-white shadow-[0_4px_12px_rgba(103,58,183,0.4)]"
                    // inactive: shadow 0 2px 8px rgba(0,0,0,0.06)
                    : "bg-white text-[#616161] shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:bg-[#ede7f6] hover:text-[#673ab7]"
                )}
              >
                {tab === 'total' ? '전체' : tab === 'monthly' ? '월별' : tab === 'weekly' ? '주별' : '일별'}
              </button>
            ))}
          </div>

          {/* kpi-view-toggle: gap 8px */}
          <div className="flex gap-[8px]">
            <button
              onClick={() => setKpiView('primary')}
              className={cn(
                // kpi-view-btn: padding 10px 24px, border-radius 8px, font-weight 500, font-size 14px
                "px-[24px] py-[10px] border-none rounded-[8px] cursor-pointer text-[14px] font-medium transition-all duration-200",
                kpiView === 'primary'
                  ? "bg-[#673ab7] text-white shadow-[0_4px_12px_rgba(103,58,183,0.4)]"
                  : "bg-white text-[#616161] shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:bg-[#ede7f6] hover:text-[#673ab7]"
              )}
            >
              주요 성과
            </button>
            <button
              onClick={() => setKpiView('all')}
              className={cn(
                "px-[24px] py-[10px] border-none rounded-[8px] cursor-pointer text-[14px] font-medium transition-all duration-200",
                kpiView === 'all'
                  ? "bg-[#673ab7] text-white shadow-[0_4px_12px_rgba(103,58,183,0.4)]"
                  : "bg-white text-[#616161] shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:bg-[#ede7f6] hover:text-[#673ab7]"
              )}
            >
              세부 성과
            </button>
          </div>
        </div>

        {/* kpi-section: margin-bottom 24px */}
        <div className="mb-[24px]">
          {/* kpi-grid kpi-grid-primary: gap 16px, margin-bottom 24px */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[16px] mb-[24px]">
            {currentPrimaryKPIs.map((kpi, idx) => renderKPICard(kpi, idx))}
          </div>

          {/* kpi-grid kpi-grid-secondary: margin-top 16px */}
          {kpiView === 'all' && (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[16px] mt-[16px]">
              {currentSecondaryKPIs.map((kpi, idx) => renderKPICard(kpi, idx))}
            </div>
          )}
        </div>
      </div>

      {/* 차트 섹션 - chart-section card: padding 24px, margin-bottom 24px */}
      <div className="bg-white rounded-[12px] shadow-[0_2px_14px_0_rgba(32,40,45,0.08)] p-[24px] mb-[24px] hover:shadow-[0_4px_20px_0_rgba(32,40,45,0.12)] transition-shadow duration-300">
        {/* chart-section-header: margin-bottom 20px */}
        <div className="flex justify-between items-center mb-[20px]">
          {/* chart-header: font-size 16px, font-weight 600, gap 8px */}
          <div className="text-[16px] font-semibold text-[#212121] flex items-center gap-[8px]">
            {/* ::before: width 4px, height 20px, background secondary-main, border-radius 2px */}
            <div className="w-[4px] h-[20px] bg-[#2196f3] rounded-[2px]" />
            <span>성과 지표 추이</span>
          </div>
          {/* data-label-toggle: padding 8px 16px, border-radius 8px, font-size 13px, gap 6px */}
          <button
            onClick={() => setShowDataLabels(!showDataLabels)}
            className={cn(
              "flex items-center gap-[6px] px-[16px] py-[8px] border-none rounded-[8px] cursor-pointer text-[13px] font-medium font-inherit transition-all duration-200",
              showDataLabels
                ? "bg-[#673ab7] text-white shadow-[0_4px_12px_rgba(103,58,183,0.4)]"
                : "bg-white text-[#616161] shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:bg-[#ede7f6] hover:text-[#673ab7]"
            )}
          >
            {/* toggle-checkbox: font-size 14px */}
            <span className="text-[14px]">{showDataLabels ? '✓' : '☐'}</span>
            <span>데이터 라벨</span>
          </button>
        </div>

        {/* chart-toggle-group: gap 8px (원본 inline style), margin-bottom 20px */}
        <div className="flex items-center gap-[8px] mb-[20px] flex-wrap">
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
                "flex items-center gap-[6px] px-[16px] py-[8px] border-none rounded-[8px] cursor-pointer text-[13px] font-medium font-inherit transition-all duration-200",
                chartToggles[key]
                  ? "bg-[#673ab7] text-white shadow-[0_4px_12px_rgba(103,58,183,0.4)]"
                  : "bg-white text-[#616161] shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:bg-[#ede7f6] hover:text-[#673ab7]"
              )}
            >
              <span className="text-[14px]">{chartToggles[key] ? '✓' : '☐'}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* chart-container: height 300px */}
        <div className="relative h-[300px] bg-[#fafafa] rounded-[8px] flex items-center justify-center">
          <p className="text-[#9e9e9e]">Chart.js 차트 영역 (데이터 연동 예정)</p>
        </div>
      </div>

      {/* 데이터 테이블 - table-section card: border-radius 12px */}
      <div className="bg-white rounded-[12px] shadow-[0_2px_14px_0_rgba(32,40,45,0.08)] overflow-hidden hover:shadow-[0_4px_20px_0_rgba(32,40,45,0.12)] transition-shadow duration-300">
        {/* table-header: padding 20px 24px, border-bottom 1px solid grey-200, font-size 16px, gap 8px */}
        <div className="px-[24px] py-[20px] border-b border-[#eeeeee] text-[16px] font-semibold text-[#212121] flex items-center gap-[8px]">
          {/* ::before: width 4px, height 20px, background success-main, border-radius 2px */}
          <div className="w-[4px] h-[20px] bg-[#00c853] rounded-[2px]" />
          <span>상세 데이터</span>
        </div>

        {/* table-container */}
        <div className="overflow-x-auto table-container">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {/* th: padding 14px 16px, font-size 14px, bg grey-50, border-bottom 2px solid grey-200 */}
                <th className="text-left py-[14px] px-[16px] bg-[#fafafa] font-semibold text-[#616161] text-[14px] border-b-2 border-[#eeeeee] sticky left-0 z-[2] whitespace-nowrap">기간</th>
                <th className="text-right py-[14px] px-[16px] bg-[#fafafa] font-semibold text-[#616161] text-[14px] border-b-2 border-[#eeeeee] whitespace-nowrap">비용</th>
                <th className="text-right py-[14px] px-[16px] bg-[#fafafa] font-semibold text-[#616161] text-[14px] border-b-2 border-[#eeeeee] whitespace-nowrap">노출</th>
                <th className="text-right py-[14px] px-[16px] bg-[#fafafa] font-semibold text-[#616161] text-[14px] border-b-2 border-[#eeeeee] whitespace-nowrap">CPM</th>
                <th className="text-right py-[14px] px-[16px] bg-[#fafafa] font-semibold text-[#616161] text-[14px] border-b-2 border-[#eeeeee] whitespace-nowrap">클릭</th>
                <th className="text-right py-[14px] px-[16px] bg-[#fafafa] font-semibold text-[#616161] text-[14px] border-b-2 border-[#eeeeee] whitespace-nowrap">CPC</th>
                <th className="text-right py-[14px] px-[16px] bg-[#fafafa] font-semibold text-[#616161] text-[14px] border-b-2 border-[#eeeeee] whitespace-nowrap">전환수</th>
                <th className="text-right py-[14px] px-[16px] bg-[#fafafa] font-semibold text-[#616161] text-[14px] border-b-2 border-[#eeeeee] whitespace-nowrap">CPA</th>
                <th className="text-right py-[14px] px-[16px] bg-[#fafafa] font-semibold text-[#616161] text-[14px] border-b-2 border-[#eeeeee] whitespace-nowrap">전환값</th>
                <th className="text-right py-[14px] px-[16px] bg-[#fafafa] font-semibold text-[#616161] text-[14px] border-b-2 border-[#eeeeee] whitespace-nowrap">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {tableData.slice(0, visibleRows).map((row, idx) => (
                // tbody tr: hover bg grey-50
                <tr key={idx} className="hover:bg-[#fafafa] transition-colors duration-200">
                  {/* td: padding 14px 16px, font-size 14px, border-bottom 1px solid grey-100 */}
                  <td className="text-left py-[14px] px-[16px] border-b border-[#f5f5f5] font-medium text-[#212121] text-[14px] sticky left-0 bg-white">{row.period}</td>
                  <td className="text-right py-[14px] px-[16px] border-b border-[#f5f5f5] text-[#212121] text-[14px]">{formatCurrency(row.cost)}</td>
                  <td className="text-right py-[14px] px-[16px] border-b border-[#f5f5f5] text-[#212121] text-[14px]">{formatNumber(row.impressions)}</td>
                  <td className="text-right py-[14px] px-[16px] border-b border-[#f5f5f5] text-[#212121] text-[14px]">{formatCurrency(row.cpm)}</td>
                  <td className="text-right py-[14px] px-[16px] border-b border-[#f5f5f5] text-[#212121] text-[14px]">{formatNumber(row.clicks)}</td>
                  <td className="text-right py-[14px] px-[16px] border-b border-[#f5f5f5] text-[#212121] text-[14px]">{formatCurrency(row.cpc)}</td>
                  <td className="text-right py-[14px] px-[16px] border-b border-[#f5f5f5] text-[#212121] text-[14px]">{formatNumber(row.conversions)}</td>
                  <td className="text-right py-[14px] px-[16px] border-b border-[#f5f5f5] text-[#212121] text-[14px]">{formatCurrency(row.cpa)}</td>
                  <td className="text-right py-[14px] px-[16px] border-b border-[#f5f5f5] text-[#212121] text-[14px]">{formatCurrency(row.convValue)}</td>
                  {/* positive/negative: font-weight 600 */}
                  <td className={cn(
                    "text-right py-[14px] px-[16px] border-b border-[#f5f5f5] font-semibold text-[14px]",
                    row.roas >= 100 ? "text-[#00c853]" : "text-[#ff1744]"
                  )}>{row.roas}%</td>
                </tr>
              ))}
              {/* 합계 행 - total-row: bg primary-light, font-weight 600 */}
              <tr className="bg-[#ede7f6] font-semibold">
                {/* total-row td: border-top 2px solid primary-main, color primary-dark */}
                <td className="text-left py-[14px] px-[16px] border-t-2 border-[#673ab7] text-[#5e35b1] text-[14px] sticky left-0 bg-[#ede7f6]">합계</td>
                <td className="text-right py-[14px] px-[16px] border-t-2 border-[#673ab7] text-[#5e35b1] text-[14px]">{formatCurrency(totals.cost)}</td>
                <td className="text-right py-[14px] px-[16px] border-t-2 border-[#673ab7] text-[#5e35b1] text-[14px]">{formatNumber(totals.impressions)}</td>
                <td className="text-right py-[14px] px-[16px] border-t-2 border-[#673ab7] text-[#5e35b1] text-[14px]">{formatCurrency(totalCPM)}</td>
                <td className="text-right py-[14px] px-[16px] border-t-2 border-[#673ab7] text-[#5e35b1] text-[14px]">{formatNumber(totals.clicks)}</td>
                <td className="text-right py-[14px] px-[16px] border-t-2 border-[#673ab7] text-[#5e35b1] text-[14px]">{formatCurrency(totalCPC)}</td>
                <td className="text-right py-[14px] px-[16px] border-t-2 border-[#673ab7] text-[#5e35b1] text-[14px]">{formatNumber(totals.conversions)}</td>
                <td className="text-right py-[14px] px-[16px] border-t-2 border-[#673ab7] text-[#5e35b1] text-[14px]">{formatCurrency(totalCPA)}</td>
                <td className="text-right py-[14px] px-[16px] border-t-2 border-[#673ab7] text-[#5e35b1] text-[14px]">{formatCurrency(totals.convValue)}</td>
                <td className={cn(
                  "text-right py-[14px] px-[16px] border-t-2 border-[#673ab7] font-semibold text-[14px]",
                  totalROAS >= 100 ? "text-[#00c853]" : "text-[#ff1744]"
                )}>{Math.round(totalROAS)}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* show-more-container: padding 16px 24px, border-top 1px solid grey-200 */}
        <div className="px-[24px] py-[16px] text-center border-t border-[#eeeeee]">
          {visibleRows < tableData.length ? (
            // show-more-btn: padding 10px 32px, border-radius 8px, font-size 14px
            <button
              onClick={() => setVisibleRows(tableData.length)}
              className="px-[32px] py-[10px] bg-[#f5f5f5] text-[#616161] border border-[#e0e0e0] rounded-[8px] cursor-pointer font-medium text-[14px] font-inherit hover:bg-[#ede7f6] hover:text-[#673ab7] hover:border-[#673ab7] transition-all duration-200"
            >
              더 보기 ({tableData.length - visibleRows}개)
            </button>
          ) : (
            <button
              onClick={() => setVisibleRows(3)}
              className="px-[32px] py-[10px] bg-[#f5f5f5] text-[#616161] border border-[#e0e0e0] rounded-[8px] cursor-pointer font-medium text-[14px] font-inherit hover:bg-[#ede7f6] hover:text-[#673ab7] hover:border-[#673ab7] transition-all duration-200"
            >
              접기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
