'use client'

import { useState, useEffect, useRef } from 'react'

// 타입 정의
interface FilterState {
  type: string
  brand: string
  product: string
  promotion: string
  campaign: string
  adSet: string
  startDate: string
  endDate: string
  searchText: string
}

interface KpiFilterState {
  metric: string
  operator: string
  value: string
  enabled: boolean
  compoundLogic: string
  secondaryMetric: string
  secondaryOperator: string
  secondaryValue: string
  secondaryCompoundLogic: string
  tertiaryMetric: string
  tertiaryOperator: string
  tertiaryValue: string
  advancedFilterFunction: string | null
}

interface SortConfig {
  metric: string
  order: 'asc' | 'desc'
}

interface CreativeData {
  name: string
  비용: number
  노출: number
  클릭: number
  전환수: number
  전환값: number
  CPM: number
  CPC: number
  CPA: number
  ROAS: number
  efficiencyScore?: number
}

interface SummaryData {
  totalCost: number
  avgCPM: number
  avgCPC: number
  avgCPA: number
  avgROAS: number
}

interface TooltipData {
  visible: boolean
  x: number
  y: number
  title: string
  icon: string
  type: string
  criteria: string
  action: string
  actionType: string
  actionDetail: string
}

// 숫자 포맷 함수
const formatNumber = (num: number): string => {
  if (num === 0 || num === null || num === undefined) return '-'
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const formatROAS = (num: number): string => {
  if (num === 0 || num === null || num === undefined) return '-'
  return Math.round(num) + '%'
}

const formatNumberInput = (value: string): string => {
  const num = value.replace(/[^\d.]/g, '')
  if (num === '') return ''
  const parts = num.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

const parseFormattedNumber = (value: string): string => {
  return value.replace(/,/g, '')
}

// 효율 칩 데이터
const EFFICIENCY_CHIPS = [
  {
    key: 'high_efficiency',
    icon: '🏆',
    label: '고효율 소재',
    description: '효율 점수 상위 20% - 검증된 고성과',
    tooltipTitle: '고효율 소재',
    tooltipType: 'high-efficiency',
    tooltipCriteria: '효율 점수 상위 20%에 해당하는 소재입니다.<br>• ROAS, CPA, CPC, CPM 순위 종합<br>• 비용 대비 신뢰도 가중 적용',
    tooltipAction: '예산 확대 검토',
    tooltipActionType: 'positive',
    tooltipActionDetail: '검증된 고성과 소재입니다. 예산을 증액하면 매출 상승이 기대됩니다.'
  },
  {
    key: 'potential',
    icon: '💎',
    label: '가능성 있는 소재',
    description: '테스트 확대 추천 - 신뢰도↓ 성과↑',
    tooltipTitle: '가능성 있는 소재',
    tooltipType: 'potential',
    tooltipCriteria: '중간 60% 중 신뢰도↓ 성과↑ 소재입니다.<br>• 비용이 적지만 기대 ROAS 이상<br>• 신뢰도 < 50% (약 39만원 미만)',
    tooltipAction: '테스트 확대 추천',
    tooltipActionType: 'info',
    tooltipActionDetail: '데이터가 부족하지만 성과가 좋습니다. 예산을 늘려 검증해보세요.'
  },
  {
    key: 'needs_attention',
    icon: '🔍',
    label: '주의 필요 소재',
    description: '추가 관찰 필요 - 판단 유보',
    tooltipTitle: '주의 필요 소재',
    tooltipType: 'needs-attention',
    tooltipCriteria: '중간 60% 중 판단 유보 소재입니다.<br>• 신뢰도↑ 또는 성과↓<br>• 추가 데이터 수집 필요',
    tooltipAction: '추가 관찰 필요',
    tooltipActionType: 'warning',
    tooltipActionDetail: '현재 상태로는 판단이 어렵습니다. 추이를 지켜보며 결정하세요.'
  },
  {
    key: 'low_efficiency',
    icon: '⚠️',
    label: '저효율 소재',
    description: '효율 점수 하위 20% - 예산 축소 검토',
    tooltipTitle: '저효율 소재',
    tooltipType: 'low-efficiency',
    tooltipCriteria: '효율 점수 하위 20%에 해당하는 소재입니다.<br>• ROAS, CPA, CPC, CPM 모두 저조<br>• 개선이 시급한 소재',
    tooltipAction: '예산 축소 검토',
    tooltipActionType: 'negative',
    tooltipActionDetail: '광고비 대비 성과가 낮습니다. 예산을 줄이거나 소재를 교체하세요.'
  }
]

export default function CreativeDashboard() {
  // 상태
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    type: '', brand: '', product: '', promotion: '',
    campaign: '', adSet: '', startDate: '', endDate: '', searchText: ''
  })
  const [kpiFilter, setKpiFilter] = useState<KpiFilterState>({
    metric: '비용', operator: '>', value: '', enabled: false,
    compoundLogic: 'none', secondaryMetric: '비용', secondaryOperator: '>',
    secondaryValue: '', secondaryCompoundLogic: 'none',
    tertiaryMetric: '비용', tertiaryOperator: '>', tertiaryValue: '',
    advancedFilterFunction: null
  })
  const [sortConfig, setSortConfig] = useState<SortConfig>({ metric: '비용', order: 'desc' })
  const [activeChip, setActiveChip] = useState<string | null>(null)
  const [showManualInput, setShowManualInput] = useState(true)
  const [presetDescription, setPresetDescription] = useState('')

  // 필터 옵션
  const [typeOptions, setTypeOptions] = useState<string[]>([])
  const [brandOptions, setBrandOptions] = useState<string[]>([])
  const [productOptions, setProductOptions] = useState<string[]>([])
  const [promotionOptions, setPromotionOptions] = useState<string[]>([])
  const [campaignOptions, setCampaignOptions] = useState<string[]>([])
  const [adSetOptions, setAdSetOptions] = useState<string[]>([])

  // 데이터
  const [allData, setAllData] = useState<any[]>([])
  const [creativeData, setCreativeData] = useState<CreativeData[]>([])
  const [summary, setSummary] = useState<SummaryData>({
    totalCost: 0, avgCPM: 0, avgCPC: 0, avgCPA: 0, avgROAS: 0
  })
  const [loading, setLoading] = useState(true)

  // 모달
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalData, setModalData] = useState<any[]>([])
  const [modalViewType, setModalViewType] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  // 툴팁
  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false, x: 0, y: 0, title: '', icon: '', type: '',
    criteria: '', action: '', actionType: '', actionDetail: ''
  })

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data/clientA/creative.json')
        if (response.ok) {
          const data = await response.json()
          setAllData(data.rawData || [])
          if (data.rawData && data.rawData.length > 0) {
            const dates = data.rawData.map((d: any) => d['날짜']).filter(Boolean)
              .map((d: string) => new Date(d)).filter((d: Date) => !isNaN(d.getTime()))
            if (dates.length > 0) {
              const minDate = new Date(Math.min(...dates.map((d: Date) => d.getTime())))
              const maxDate = new Date(Math.max(...dates.map((d: Date) => d.getTime())))
              setFilters(prev => ({
                ...prev,
                startDate: minDate.toISOString().split('T')[0],
                endDate: maxDate.toISOString().split('T')[0]
              }))
            }
            const types = Array.from(new Set(data.rawData.map((d: any) => d['유형구분']))).filter(Boolean).sort() as string[]
            setTypeOptions(types)
          }
        }
        setLoading(false)
      } catch (err) {
        console.error('Error loading data:', err)
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // 계층적 필터 업데이트
  useEffect(() => {
    if (allData.length === 0) return
    const filteredForBrand = allData.filter(row => !filters.type || row['유형구분'] === filters.type)
    setBrandOptions(Array.from(new Set(filteredForBrand.map(d => d['브랜드명']))).filter(Boolean).sort() as string[])

    const filteredForProduct = filteredForBrand.filter(row => !filters.brand || row['브랜드명'] === filters.brand)
    setProductOptions(Array.from(new Set(filteredForProduct.map(d => d['상품명']))).filter(Boolean).sort() as string[])

    const filteredForPromotion = filteredForProduct.filter(row => !filters.product || row['상품명'] === filters.product)
    setPromotionOptions(Array.from(new Set(filteredForPromotion.map(d => d['프로모션']))).filter(Boolean).sort() as string[])

    const filteredForCampaign = filteredForPromotion.filter(row => !filters.promotion || row['프로모션'] === filters.promotion)
    setCampaignOptions(Array.from(new Set(filteredForCampaign.map(d => d['캠페인']))).filter(Boolean).sort() as string[])

    const filteredForAdSet = filteredForCampaign.filter(row => !filters.campaign || row['캠페인'] === filters.campaign)
    setAdSetOptions(Array.from(new Set(filteredForAdSet.map(d => d['광고세트']))).filter(Boolean).sort() as string[])
  }, [allData, filters.type, filters.brand, filters.product, filters.promotion, filters.campaign])

  // 대시보드 업데이트
  useEffect(() => {
    if (allData.length === 0) return

    let filtered = allData.filter(row => {
      if (filters.type && row['유형구분'] !== filters.type) return false
      if (filters.brand && row['브랜드명'] !== filters.brand) return false
      if (filters.product && row['상품명'] !== filters.product) return false
      if (filters.promotion && row['프로모션'] !== filters.promotion) return false
      if (filters.campaign && row['캠페인'] !== filters.campaign) return false
      if (filters.adSet && row['광고세트'] !== filters.adSet) return false
      if (filters.startDate || filters.endDate) {
        const rowDate = new Date(row['날짜'])
        if (isNaN(rowDate.getTime())) return false
        if (filters.startDate && rowDate < new Date(filters.startDate)) return false
        if (filters.endDate && rowDate > new Date(filters.endDate)) return false
      }
      return true
    })

    const groups: { [key: string]: CreativeData } = {}
    filtered.forEach(row => {
      const key = row['소재이름'] || '기타'
      if (!groups[key]) {
        groups[key] = { name: key, 비용: 0, 노출: 0, 클릭: 0, 전환수: 0, 전환값: 0, CPM: 0, CPC: 0, CPA: 0, ROAS: 0 }
      }
      groups[key].비용 += parseFloat(row['비용']) || 0
      groups[key].노출 += parseFloat(row['노출']) || 0
      groups[key].클릭 += parseFloat(row['클릭']) || 0
      groups[key].전환수 += parseFloat(row['전환수']) || 0
      groups[key].전환값 += parseFloat(row['전환값']) || 0
    })

    let aggregated = Object.values(groups).map(g => ({
      ...g,
      CPM: g.노출 > 0 ? (g.비용 / g.노출 * 1000) : 0,
      CPC: g.클릭 > 0 ? (g.비용 / g.클릭) : 0,
      CPA: g.전환수 > 0 ? (g.비용 / g.전환수) : 0,
      ROAS: g.비용 > 0 ? (g.전환값 / g.비용 * 100) : 0
    }))

    if (kpiFilter.enabled && kpiFilter.value !== '') {
      const targetValue = parseFloat(kpiFilter.value)
      if (!isNaN(targetValue)) {
        const getMetricValue = (c: CreativeData, m: string): number => {
          switch (m) {
            case '비용': return c.비용
            case '노출': return c.노출
            case '클릭': return c.클릭
            case '전환수': return c.전환수
            case '전환값': return c.전환값
            case 'CPC': return c.CPC
            case 'CPA': return c.CPA
            case 'ROAS': return c.ROAS
            default: return 0
          }
        }
        const compare = (val: number, op: string, target: number): boolean => {
          switch (op) {
            case '>': return val > target
            case '<': return val < target
            case '>=': return val >= target
            case '<=': return val <= target
            case '=': return val === target
            default: return true
          }
        }
        aggregated = aggregated.filter(c => {
          const primary = compare(getMetricValue(c, kpiFilter.metric), kpiFilter.operator, targetValue)
          if (kpiFilter.compoundLogic === 'none') return primary
          const secVal = parseFloat(kpiFilter.secondaryValue)
          let secondary = true
          if (!isNaN(secVal) && kpiFilter.secondaryValue !== '') {
            secondary = compare(getMetricValue(c, kpiFilter.secondaryMetric), kpiFilter.secondaryOperator, secVal)
          }
          return kpiFilter.compoundLogic === 'or' ? primary || secondary : primary && secondary
        })
      }
    }

    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      aggregated = aggregated.filter(c => c.name.toLowerCase().includes(searchLower))
    }

    aggregated.sort((a, b) => {
      const aVal = (a as any)[sortConfig.metric] || 0
      const bVal = (b as any)[sortConfig.metric] || 0
      return sortConfig.order === 'desc' ? bVal - aVal : aVal - bVal
    })

    setCreativeData(aggregated)

    const totals = aggregated.reduce((acc, row) => {
      acc.비용 += row.비용; acc.노출 += row.노출; acc.클릭 += row.클릭
      acc.전환수 += row.전환수; acc.전환값 += row.전환값
      return acc
    }, { 비용: 0, 노출: 0, 클릭: 0, 전환수: 0, 전환값: 0 })

    setSummary({
      totalCost: totals.비용,
      avgCPM: totals.노출 > 0 ? (totals.비용 / totals.노출 * 1000) : 0,
      avgCPC: totals.클릭 > 0 ? (totals.비용 / totals.클릭) : 0,
      avgCPA: totals.전환수 > 0 ? (totals.비용 / totals.전환수) : 0,
      avgROAS: totals.비용 > 0 ? (totals.전환값 / totals.비용 * 100) : 0
    })
  }, [allData, filters, kpiFilter, sortConfig])

  // 핸들러
  const resetBasicFilters = () => {
    if (allData.length > 0) {
      const dates = allData.map(d => d['날짜']).filter(Boolean).map(d => new Date(d)).filter(d => !isNaN(d.getTime()))
      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
        setFilters(prev => ({
          ...prev, type: '', brand: '', product: '', promotion: '',
          startDate: minDate.toISOString().split('T')[0],
          endDate: maxDate.toISOString().split('T')[0]
        }))
      }
    }
  }

  const resetDetailFilters = () => {
    setFilters(prev => ({ ...prev, campaign: '', adSet: '', searchText: '' }))
  }

  const resetKpiFilter = () => {
    setKpiFilter({
      metric: '비용', operator: '>', value: '', enabled: false,
      compoundLogic: 'none', secondaryMetric: '비용', secondaryOperator: '>',
      secondaryValue: '', secondaryCompoundLogic: 'none',
      tertiaryMetric: '비용', tertiaryOperator: '>', tertiaryValue: '',
      advancedFilterFunction: null
    })
    setActiveChip(null)
    setShowManualInput(true)
    setPresetDescription('')
  }

  const handleChipClick = (chipKey: string) => {
    if (activeChip === chipKey) {
      resetKpiFilter()
    } else {
      const chip = EFFICIENCY_CHIPS.find(c => c.key === chipKey)
      if (chip) {
        setActiveChip(chipKey)
        setKpiFilter(prev => ({ ...prev, enabled: true, advancedFilterFunction: chipKey }))
        setShowManualInput(false)
        setPresetDescription(chip.description)
      }
    }
  }

  const handleChipMouseEnter = (e: React.MouseEvent, chip: typeof EFFICIENCY_CHIPS[0]) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setTooltip({
      visible: true,
      x: rect.left,
      y: rect.bottom + 10,
      title: chip.tooltipTitle,
      icon: chip.icon,
      type: chip.tooltipType,
      criteria: chip.tooltipCriteria,
      action: chip.tooltipAction,
      actionType: chip.tooltipActionType,
      actionDetail: chip.tooltipActionDetail
    })
  }

  const handleChipMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }))
  }

  const showCreativeDetail = (creativeName: string) => {
    const data = allData.filter(row => row['소재이름'] === creativeName)
    if (data.length === 0) { alert('해당 소재의 데이터가 없습니다.'); return }
    setModalTitle(creativeName)
    setModalData(data)
    setModalViewType('daily')
    setIsModalOpen(true)
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-[24px]">
        <div>
          <h1 className="text-[24px] font-bold text-[#212121] m-0">광고 소재별 분석</h1>
          <div className="text-[14px] text-[#9e9e9e] mt-[4px]">광고 소재(이미지/영상)별 성과 분석</div>
        </div>
      </div>

      {/* 필터 설정 (접기/펼치기) */}
      <div className="mb-[24px]">
        <div
          className="flex justify-between items-center cursor-pointer select-none px-[20px] py-[16px] bg-white rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow"
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
        >
          <div className="flex items-center gap-[10px] text-[16px] font-semibold text-[#212121]">
            <span className="w-[4px] h-[20px] bg-[#673ab7] rounded-[2px]" />
            필터 설정
            <span className="text-[12px] font-normal text-[#9e9e9e] ml-[8px]">* 펼쳐서 세부 성과를 필터링할 수 있어요</span>
          </div>
          <button className="flex items-center gap-[8px] px-[16px] py-[8px] bg-[#ede7f6] text-[#673ab7] border-none rounded-[8px] text-[13px] font-medium cursor-pointer hover:bg-[#673ab7] hover:text-white transition-all">
            <span>{isFilterExpanded ? '접기' : '펼치기'}</span>
            <span className={`transition-transform duration-200 ${isFilterExpanded ? 'rotate-180' : ''}`}>▼</span>
          </button>
        </div>

        <div className={`overflow-hidden transition-all duration-300 ${isFilterExpanded ? 'max-h-[2000px] opacity-100 pt-[16px]' : 'max-h-0 opacity-0'}`}>
          {/* 기간 및 기본 필터 */}
          <div className="bg-white rounded-[12px] shadow-card p-[20px_24px] mb-[16px]">
            <div className="flex justify-between items-center mb-[16px]">
              <div className="text-[16px] font-semibold text-[#212121] flex items-center gap-[8px]">
                <span className="w-[4px] h-[20px] bg-[#673ab7] rounded-[2px]" />기간 및 기본 필터
              </div>
              <button onClick={resetBasicFilters} className="px-[16px] py-[8px] border-none bg-white text-[#616161] rounded-[8px] cursor-pointer text-[12px] font-medium shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:bg-[#ede7f6] hover:text-[#673ab7] transition-all">초기화</button>
            </div>
            <div className="flex items-start gap-[48px] flex-wrap">
              <div className="flex flex-col gap-[37px]">
                <div className="text-[14px] font-semibold text-[#212121] flex items-center gap-[8px]"><span className="w-[4px] h-[18px] bg-[#673ab7] rounded-[2px]" />기간 선택</div>
                <div className="flex items-center gap-[12px]">
                  <input type="date" value={filters.startDate} onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))} className="px-[14px] py-[10px] border border-[#e0e0e0] rounded-[8px] text-[14px] bg-white text-[#212121] hover:border-[#673ab7] focus:outline-none focus:border-[#673ab7] focus:shadow-[0_0_0_3px_#ede7f6] transition-all" />
                  <span className="text-[#9e9e9e] font-medium">~</span>
                  <input type="date" value={filters.endDate} onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))} className="px-[14px] py-[10px] border border-[#e0e0e0] rounded-[8px] text-[14px] bg-white text-[#212121] hover:border-[#673ab7] focus:outline-none focus:border-[#673ab7] focus:shadow-[0_0_0_3px_#ede7f6] transition-all" />
                </div>
              </div>
              <div className="flex flex-col gap-[12px] flex-1">
                <div className="text-[14px] font-semibold text-[#212121] flex items-center gap-[8px]"><span className="w-[4px] h-[18px] bg-[#673ab7] rounded-[2px]" />기본 필터</div>
                <div className="flex items-end gap-[16px] flex-1">
                  {[{ label: '유형구분', key: 'type' as const, options: typeOptions },
                    { label: '브랜드명', key: 'brand' as const, options: brandOptions },
                    { label: '상품명', key: 'product' as const, options: productOptions },
                    { label: '프로모션', key: 'promotion' as const, options: promotionOptions }].map(f => (
                    <div key={f.key} className="flex flex-col flex-1 min-w-0">
                      <label className="text-[12px] font-medium text-[#616161] mb-[8px] uppercase tracking-[0.5px]">{f.label}</label>
                      <select value={filters[f.key]} onChange={(e) => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))} className="px-[14px] py-[10px] border border-[#e0e0e0] rounded-[8px] text-[14px] bg-white text-[#212121] hover:border-[#673ab7] focus:outline-none focus:border-[#673ab7] focus:shadow-[0_0_0_3px_#ede7f6] transition-all">
                        <option value="">전체</option>
                        {f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 세부 필터 */}
          <div className="bg-white rounded-[12px] shadow-card p-[20px_24px]">
            <div className="flex justify-between items-center mb-[16px]">
              <div className="text-[16px] font-semibold text-[#212121] flex items-center gap-[8px]">
                <span className="w-[4px] h-[20px] bg-[#673ab7] rounded-[2px]" />세부 필터
              </div>
              <button onClick={resetDetailFilters} className="px-[16px] py-[8px] border-none bg-white text-[#616161] rounded-[8px] cursor-pointer text-[12px] font-medium shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:bg-[#ede7f6] hover:text-[#673ab7] transition-all">초기화</button>
            </div>
            <div className="flex flex-wrap gap-[16px] mb-[16px]">
              <div className="flex flex-col min-w-[160px] flex-1">
                <label className="text-[12px] font-medium text-[#616161] mb-[8px] uppercase tracking-[0.5px]">캠페인</label>
                <select value={filters.campaign} onChange={(e) => setFilters(prev => ({ ...prev, campaign: e.target.value, adSet: '' }))} className="px-[14px] py-[10px] border border-[#e0e0e0] rounded-[8px] text-[14px] bg-white text-[#212121] hover:border-[#673ab7] focus:outline-none focus:border-[#673ab7] focus:shadow-[0_0_0_3px_#ede7f6] transition-all">
                  <option value="">전체</option>
                  {campaignOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="flex flex-col min-w-[160px] flex-1">
                <label className="text-[12px] font-medium text-[#616161] mb-[8px] uppercase tracking-[0.5px]">광고세트</label>
                <select value={filters.adSet} onChange={(e) => setFilters(prev => ({ ...prev, adSet: e.target.value }))} className="px-[14px] py-[10px] border border-[#e0e0e0] rounded-[8px] text-[14px] bg-white text-[#212121] hover:border-[#673ab7] focus:outline-none focus:border-[#673ab7] focus:shadow-[0_0_0_3px_#ede7f6] transition-all">
                  <option value="">전체</option>
                  {adSetOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-[16px]">
              <div className="flex flex-col min-w-[160px] flex-1">
                <label className="text-[12px] font-medium text-[#616161] mb-[8px] uppercase tracking-[0.5px]">소재 검색</label>
                <input type="text" placeholder="소재이름 검색..." value={filters.searchText} onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))} className="px-[14px] py-[10px] border border-[#e0e0e0] rounded-[8px] text-[14px] bg-white text-[#212121] hover:border-[#673ab7] focus:outline-none focus:border-[#673ab7] focus:shadow-[0_0_0_3px_#ede7f6] transition-all" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI 기준 필터 + 정렬 설정 통합 */}
      <div className="bg-white rounded-[12px] shadow-card p-[20px_24px] mb-[24px]">
        <div className="flex gap-[32px] items-start">
          {/* 왼쪽: KPI 기준 필터 (flex: 0 1 auto) */}
          <div style={{ flex: '0 1 auto' }}>
            <div className="text-[14px] font-semibold text-[#212121] mb-[12px] flex items-center gap-[8px]">
              <span className="w-[4px] h-[18px] bg-[#673ab7] rounded-[2px]" />
              KPI 기준 필터
              <button
                onClick={() => setKpiFilter(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`ml-[12px] px-[10px] py-[4px] text-[11px] font-semibold border rounded-[8px] cursor-pointer transition-all ${
                  kpiFilter.enabled ? 'bg-[#673ab7] text-white border-[#673ab7]' : 'bg-[#f5f5f5] text-[#9e9e9e] border-[#e0e0e0] hover:border-[#673ab7]'
                }`}
              >
                {kpiFilter.enabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* 4분류 효율 필터 칩 */}
            <div className="mb-[16px]">
              <div className="flex flex-wrap gap-[8px]">
                {EFFICIENCY_CHIPS.map(chip => (
                  <button
                    key={chip.key}
                    onClick={() => handleChipClick(chip.key)}
                    onMouseEnter={(e) => handleChipMouseEnter(e, chip)}
                    onMouseLeave={handleChipMouseLeave}
                    className={`inline-flex items-center px-[14px] py-[8px] text-[13px] font-medium border rounded-[20px] cursor-pointer whitespace-nowrap transition-all ${
                      activeChip === chip.key
                        ? 'bg-[#673ab7] text-white border-[#673ab7]'
                        : 'bg-[#f5f5f5] text-[#616161] border-[#e0e0e0] hover:bg-[#ede7f6] hover:border-[#673ab7] hover:text-[#673ab7]'
                    }`}
                  >
                    <span className="mr-[6px]">{chip.icon}</span>
                    {chip.label}
                  </button>
                ))}
              </div>
              {/* kpiPresetDescription */}
              {presetDescription && (
                <div className="mt-[8px] text-[12px] text-[#673ab7] bg-[#ede7f6] px-[12px] py-[8px] rounded-[6px] flex items-center gap-[6px]">
                  <span className="font-bold">✓</span>
                  {presetDescription}
                </div>
              )}
            </div>

            {/* 직접 입력 영역 */}
            {showManualInput && (
              <div className="flex items-end gap-[16px] flex-wrap">
                <div className="flex flex-col" style={{ flex: '0 0 100px' }}>
                  <label className="text-[12px] font-medium text-[#616161] mb-[8px] uppercase tracking-[0.5px]">KPI 기준</label>
                  <select value={kpiFilter.metric} onChange={(e) => setKpiFilter(prev => ({ ...prev, metric: e.target.value }))} className="px-[14px] py-[10px] border border-[#e0e0e0] rounded-[8px] text-[14px] bg-white text-[#212121] hover:border-[#673ab7] focus:outline-none focus:border-[#673ab7] focus:shadow-[0_0_0_3px_#ede7f6] transition-all">
                    {['비용', '노출', '클릭', '전환수', '전환값', 'CPC', 'CPA', 'ROAS'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="flex flex-col" style={{ flex: '0 0 100px' }}>
                  <label className="text-[12px] font-medium text-[#616161] mb-[8px] uppercase tracking-[0.5px]">조건</label>
                  <select value={kpiFilter.operator} onChange={(e) => setKpiFilter(prev => ({ ...prev, operator: e.target.value }))} className="px-[14px] py-[10px] border border-[#e0e0e0] rounded-[8px] text-[14px] bg-white text-[#212121] hover:border-[#673ab7] focus:outline-none focus:border-[#673ab7] focus:shadow-[0_0_0_3px_#ede7f6] transition-all">
                    <option value=">">&gt; (보다 큼)</option>
                    <option value="<">&lt; (보다 작음)</option>
                    <option value=">=">&gt;= (크거나 같음)</option>
                    <option value="<=">&lt;= (작거나 같음)</option>
                    <option value="=">= (같음)</option>
                  </select>
                </div>
                <div className="flex flex-col" style={{ flex: '0 0 100px' }}>
                  <label className="text-[12px] font-medium text-[#616161] mb-[8px] uppercase tracking-[0.5px]">기준값</label>
                  <input type="text" placeholder="수치 입력" value={formatNumberInput(kpiFilter.value)} onChange={(e) => { const f = formatNumberInput(e.target.value); setKpiFilter(prev => ({ ...prev, value: parseFormattedNumber(f), enabled: f.trim() !== '' })) }} className="px-[14px] py-[10px] border border-[#e0e0e0] rounded-[8px] text-[14px] bg-white text-[#212121] hover:border-[#673ab7] focus:outline-none focus:border-[#673ab7] focus:shadow-[0_0_0_3px_#ede7f6] transition-all" />
                </div>
                <div className="flex flex-col" style={{ flex: '0 0 140px' }}>
                  <label className="text-[12px] font-medium text-[#616161] mb-[8px] uppercase tracking-[0.5px]">조합 조건</label>
                  <div className="flex gap-[8px] items-center h-[38px]">
                    {['none', 'or', 'and'].map(v => (
                      <label key={v} className="flex items-center gap-[4px] cursor-pointer text-[13px] text-[#616161]">
                        <input type="radio" name="compoundLogic" value={v} checked={kpiFilter.compoundLogic === v} onChange={() => setKpiFilter(prev => ({ ...prev, compoundLogic: v }))} className="m-0 cursor-pointer" />
                        <span className="whitespace-nowrap">{v === 'none' ? '없음' : v === 'or' ? '또는' : '그리고'}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 보조 필터 행 */}
            {kpiFilter.compoundLogic !== 'none' && showManualInput && (
              <div className="flex items-end gap-[16px] flex-wrap mt-[12px] pt-[12px] border-t border-dashed border-[#e0e0e0]">
                <div className="text-[12px] text-[#673ab7] font-semibold mb-[8px] w-full">조건 2</div>
                <div className="flex flex-col" style={{ flex: '0 0 100px' }}>
                  <label className="text-[12px] font-medium text-[#616161] mb-[8px] uppercase tracking-[0.5px]">KPI 기준</label>
                  <select value={kpiFilter.secondaryMetric} onChange={(e) => setKpiFilter(prev => ({ ...prev, secondaryMetric: e.target.value }))} className="px-[14px] py-[10px] border border-[#e0e0e0] rounded-[8px] text-[14px] bg-white text-[#212121] hover:border-[#673ab7] focus:outline-none focus:border-[#673ab7] focus:shadow-[0_0_0_3px_#ede7f6] transition-all">
                    {['비용', '노출', '클릭', '전환수', '전환값', 'CPC', 'CPA', 'ROAS'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="flex flex-col" style={{ flex: '0 0 100px' }}>
                  <label className="text-[12px] font-medium text-[#616161] mb-[8px] uppercase tracking-[0.5px]">조건</label>
                  <select value={kpiFilter.secondaryOperator} onChange={(e) => setKpiFilter(prev => ({ ...prev, secondaryOperator: e.target.value }))} className="px-[14px] py-[10px] border border-[#e0e0e0] rounded-[8px] text-[14px] bg-white text-[#212121] hover:border-[#673ab7] focus:outline-none focus:border-[#673ab7] focus:shadow-[0_0_0_3px_#ede7f6] transition-all">
                    <option value=">">&gt; (보다 큼)</option>
                    <option value="<">&lt; (보다 작음)</option>
                    <option value=">=">&gt;= (크거나 같음)</option>
                    <option value="<=">&lt;= (작거나 같음)</option>
                    <option value="=">= (같음)</option>
                  </select>
                </div>
                <div className="flex flex-col" style={{ flex: '0 0 100px' }}>
                  <label className="text-[12px] font-medium text-[#616161] mb-[8px] uppercase tracking-[0.5px]">기준값</label>
                  <input type="text" placeholder="수치 입력" value={formatNumberInput(kpiFilter.secondaryValue)} onChange={(e) => { const f = formatNumberInput(e.target.value); setKpiFilter(prev => ({ ...prev, secondaryValue: parseFormattedNumber(f) })) }} className="px-[14px] py-[10px] border border-[#e0e0e0] rounded-[8px] text-[14px] bg-white text-[#212121] hover:border-[#673ab7] focus:outline-none focus:border-[#673ab7] focus:shadow-[0_0_0_3px_#ede7f6] transition-all" />
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽: 정렬 설정 (flex: 0 0 auto, flex-direction: column) */}
          <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column' }}>
            <div className="text-[14px] font-semibold text-[#212121] mb-[12px] flex items-center gap-[8px]">
              <span className="w-[4px] h-[18px] bg-[#673ab7] rounded-[2px]" />
              정렬 설정
            </div>
            <div className="flex items-end gap-[16px]">
              <div className="flex flex-col" style={{ flex: '0 0 100px' }}>
                <label className="text-[12px] font-medium text-[#616161] mb-[8px] uppercase tracking-[0.5px]">정렬 기준</label>
                <select value={sortConfig.metric} onChange={(e) => setSortConfig(prev => ({ ...prev, metric: e.target.value }))} className="px-[14px] py-[10px] border border-[#e0e0e0] rounded-[8px] text-[14px] bg-white text-[#212121] hover:border-[#673ab7] focus:outline-none focus:border-[#673ab7] focus:shadow-[0_0_0_3px_#ede7f6] transition-all">
                  {['비용', '노출', '클릭', '전환수', '전환값', 'CPC', 'CPA', 'ROAS'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex flex-col" style={{ flex: '0 0 auto' }}>
                <label className="text-[12px] font-medium text-[#616161] mb-[8px] uppercase tracking-[0.5px]">정렬 순서</label>
                <div className="flex gap-[12px] items-center h-[38px]">
                  {['desc', 'asc'].map(v => (
                    <label key={v} className="flex items-center gap-[4px] cursor-pointer text-[13px] text-[#616161]">
                      <input type="radio" name="sortOrder" value={v} checked={sortConfig.order === v} onChange={() => setSortConfig(prev => ({ ...prev, order: v as 'asc' | 'desc' }))} className="m-0 cursor-pointer" />
                      <span className="whitespace-nowrap">{v === 'desc' ? '내림차순' : '오름차순'}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 요약 섹션 */}
      <div className="mb-[24px]">
        <div className="grid grid-cols-5 gap-[16px]">
          {[
            { label: '총 비용', value: formatNumber(summary.totalCost), unit: '원' },
            { label: '평균 CPM', value: formatNumber(summary.avgCPM), unit: '원' },
            { label: '평균 CPC', value: formatNumber(summary.avgCPC), unit: '원' },
            { label: '평균 CPA', value: formatNumber(summary.avgCPA), unit: '원' },
            { label: '평균 ROAS', value: formatROAS(summary.avgROAS), unit: '' }
          ].map(s => (
            <div key={s.label} className="bg-white rounded-[12px] shadow-card p-[20px]">
              <h3 className="text-[11px] font-semibold text-[#9e9e9e] uppercase tracking-[0.5px] mb-[8px]">{s.label}</h3>
              <div className="text-[24px] font-bold text-[#212121]">{s.value}</div>
              <div className="text-[11px] text-[#9e9e9e] mt-[4px]">{s.unit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 소재 그리드 */}
      <div className="grid gap-[24px] mb-[24px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {loading ? (
          <div className="text-center py-[60px] px-[40px] text-[#9e9e9e]" style={{ gridColumn: '1 / -1' }}>데이터를 불러오는 중...</div>
        ) : creativeData.length === 0 ? (
          <div className="text-center py-[80px] px-[40px] text-[#9e9e9e]" style={{ gridColumn: '1 / -1' }}>
            <svg viewBox="0 0 24 24" className="w-[64px] h-[64px] fill-[#e0e0e0] mb-[16px] mx-auto"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
            <h3 className="text-[18px] font-semibold text-[#616161] mb-[8px]">소재 데이터가 없습니다</h3>
            <p>필터 조건을 변경해 주세요</p>
          </div>
        ) : (
          creativeData.map((creative, idx) => (
            <div key={idx} className="bg-white rounded-[16px] shadow-card overflow-hidden hover:shadow-card-hover transition-shadow">
              <div className="relative w-full pt-[100%] bg-[#f5f5f5] overflow-hidden">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#9e9e9e] text-center">
                  <svg viewBox="0 0 24 24" className="w-[48px] h-[48px] fill-[#e0e0e0] mb-[8px]"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                  <div>이미지 없음</div>
                </div>
              </div>
              <div className="p-[20px]">
                <div className="text-[14px] font-semibold text-[#212121] mb-[12px] whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:text-[#673ab7] hover:underline transition-colors" title={creative.name} onClick={() => showCreativeDetail(creative.name)}>{creative.name}</div>
                <div className="grid grid-cols-2 gap-[12px]">
                  {[{ l: '비용', v: formatNumber(creative.비용) }, { l: 'CPC', v: formatNumber(creative.CPC) }, { l: 'CPA', v: formatNumber(creative.CPA) }, { l: 'ROAS', v: formatROAS(creative.ROAS), color: creative.ROAS >= 100 ? 'text-[#00c853]' : 'text-[#ff1744]' }].map(m => (
                    <div key={m.l} className="flex flex-col">
                      <span className="text-[10px] font-semibold text-[#9e9e9e] uppercase tracking-[0.5px] mb-[4px]">{m.l}</span>
                      <span className={`text-[16px] font-bold ${m.color || 'text-[#212121]'}`}>{m.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 칩 호버 툴팁 */}
      {tooltip.visible && (
        <div
          className="fixed z-[10001] min-w-[280px] max-w-[320px] bg-white rounded-[12px] overflow-hidden pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.18)',
            border: `2px solid ${tooltip.type === 'high-efficiency' ? '#4caf50' : tooltip.type === 'potential' ? '#2196f3' : tooltip.type === 'needs-attention' ? '#ff9800' : '#f44336'}`
          }}
        >
          <div className={`px-[16px] py-[12px] flex items-center gap-[10px] border-b border-[#eeeeee] ${
            tooltip.type === 'high-efficiency' ? 'bg-gradient-to-r from-[#e8f5e9] to-[#f1f8e9]' :
            tooltip.type === 'potential' ? 'bg-gradient-to-r from-[#e3f2fd] to-[#e8f4fd]' :
            tooltip.type === 'needs-attention' ? 'bg-gradient-to-r from-[#fff8e1] to-[#fffbf0]' :
            'bg-gradient-to-r from-[#ffebee] to-[#fff5f5]'
          }`}>
            <span className="text-[20px]">{tooltip.icon}</span>
            <span className="text-[14px] font-bold text-[#212121]">{tooltip.title}</span>
          </div>
          <div className="px-[16px] py-[12px] bg-[#fafafa] border-b border-[#eeeeee]">
            <div className="text-[10px] font-semibold text-[#673ab7] mb-[6px] flex items-center gap-[4px]">📊 분류 기준</div>
            <div className="text-[12px] text-[#424242] leading-[1.6]" dangerouslySetInnerHTML={{ __html: tooltip.criteria }} />
          </div>
          <div className="px-[16px] py-[12px] bg-white">
            <div className={`text-[10px] font-semibold mb-[6px] flex items-center gap-[4px] ${
              tooltip.actionType === 'positive' ? 'text-[#00c853]' :
              tooltip.actionType === 'info' ? 'text-[#2196f3]' :
              tooltip.actionType === 'warning' ? 'text-[#ff9800]' : 'text-[#ff1744]'
            }`}>✅ {tooltip.action}</div>
            <div className="text-[12px] text-[#616161] leading-[1.6]">{tooltip.actionDetail}</div>
          </div>
        </div>
      )}

      {/* 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex justify-center items-center" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-[16px] w-[90%] max-w-[900px] max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.3)]" onClick={(e) => e.stopPropagation()}>
            <div className="px-[24px] py-[20px] border-b border-[#eeeeee] flex justify-between items-center">
              <div className="text-[18px] font-bold text-[#212121]">{modalTitle}</div>
              <button onClick={() => setIsModalOpen(false)} className="bg-none border-none text-[24px] cursor-pointer text-[#9e9e9e] p-[4px] leading-none hover:text-[#212121]">×</button>
            </div>
            <div className="p-[24px]">
              <div className="flex gap-[8px] mb-[20px]">
                {(['daily', 'weekly', 'monthly'] as const).map(vt => (
                  <button key={vt} onClick={() => setModalViewType(vt)} className={`px-[20px] py-[8px] border rounded-[8px] cursor-pointer text-[13px] font-medium transition-all ${modalViewType === vt ? 'bg-[#673ab7] text-white border-[#673ab7]' : 'bg-white text-[#616161] border-[#e0e0e0] hover:border-[#673ab7] hover:text-[#673ab7]'}`}>
                    {vt === 'daily' ? '일별' : vt === 'weekly' ? '주별' : '월별'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-[12px] mb-[12px]">
                {[
                  { l: '비용', v: formatNumber(modalData.reduce((a, r) => a + (parseFloat(r['비용']) || 0), 0)) + '원' },
                  { l: 'CPC', v: (() => { const c = modalData.reduce((a, r) => a + (parseFloat(r['비용']) || 0), 0); const k = modalData.reduce((a, r) => a + (parseFloat(r['클릭']) || 0), 0); return formatNumber(k > 0 ? c / k : 0) + '원' })() },
                  { l: 'CPA', v: (() => { const c = modalData.reduce((a, r) => a + (parseFloat(r['비용']) || 0), 0); const n = modalData.reduce((a, r) => a + (parseFloat(r['전환수']) || 0), 0); return formatNumber(n > 0 ? c / n : 0) + '원' })() },
                  { l: 'ROAS', v: (() => { const c = modalData.reduce((a, r) => a + (parseFloat(r['비용']) || 0), 0); const v = modalData.reduce((a, r) => a + (parseFloat(r['전환값']) || 0), 0); return formatROAS(c > 0 ? v / c * 100 : 0) })() }
                ].map(m => (
                  <div key={m.l} className="bg-[#fafafa] p-[16px] rounded-[12px] text-center">
                    <div className="text-[11px] font-semibold text-[#9e9e9e] uppercase tracking-[0.5px] mb-[8px]">{m.l}</div>
                    <div className="text-[20px] font-bold text-[#212121]">{m.v}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-[12px]">
                {[
                  { l: '노출', v: formatNumber(modalData.reduce((a, r) => a + (parseFloat(r['노출']) || 0), 0)) },
                  { l: '클릭', v: formatNumber(modalData.reduce((a, r) => a + (parseFloat(r['클릭']) || 0), 0)) },
                  { l: '전환수', v: formatNumber(modalData.reduce((a, r) => a + (parseFloat(r['전환수']) || 0), 0)) },
                  { l: '전환값', v: formatNumber(modalData.reduce((a, r) => a + (parseFloat(r['전환값']) || 0), 0)) + '원' }
                ].map(m => (
                  <div key={m.l} className="bg-[#fafafa] p-[16px] rounded-[12px] text-center">
                    <div className="text-[11px] font-semibold text-[#9e9e9e] uppercase tracking-[0.5px] mb-[8px]">{m.l}</div>
                    <div className="text-[20px] font-bold text-[#212121]">{m.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
