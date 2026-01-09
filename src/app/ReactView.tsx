'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Chart } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
)

// CSS 변수 참조 (globals.css의 :root 변수 사용)

// 스타일 정의
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1600px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: "'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
    backgroundColor: 'var(--background)',
    minHeight: '100vh',
    color: 'var(--grey-900)',
    lineHeight: 1.5
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px'
  },
  h1: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--grey-900)',
    margin: 0
  },
  headerSubtitle: {
    fontSize: '14px',
    color: 'var(--grey-600)',
    marginTop: '4px'
  },
  card: {
    background: 'var(--paper)',
    borderRadius: '12px',
    boxShadow: '0 2px 14px 0 rgba(32, 40, 45, 0.08)',
    transition: 'box-shadow 0.3s ease'
  },
  // 접기/펼치기 섹션
  collapsibleSection: {
    marginBottom: '24px'
  },
  collapsibleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    padding: '16px 20px',
    background: 'var(--paper)',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'box-shadow 0.2s ease'
  },
  collapsibleTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--grey-900)'
  },
  collapsibleGuide: {
    fontSize: '12px',
    fontWeight: 400,
    color: 'var(--grey-600)',
    marginLeft: '8px'
  },
  collapsibleToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'var(--primary-light)',
    color: 'var(--primary-main)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.15s ease, color 0.15s ease'
  },
  collapsibleContent: {
    maxHeight: 0,
    overflow: 'hidden',
    opacity: 0,
    transition: 'max-height 0.3s ease, opacity 0.2s ease, padding 0.3s ease'
  },
  collapsibleContentExpanded: {
    maxHeight: '2000px',
    opacity: 1,
    paddingTop: '16px'
  },
  // 필터 섹션
  filterSection: {
    padding: '20px 24px',
    marginBottom: '16px',
    background: 'var(--paper)',
    borderRadius: '12px',
    boxShadow: '0 2px 14px 0 rgba(32, 40, 45, 0.08)'
  },
  filterSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  filterHeader: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--grey-900)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  filterHeaderBar: {
    width: '4px',
    height: '20px',
    background: 'var(--primary-main)',
    borderRadius: '2px'
  },
  resetBtn: {
    padding: '8px 16px',
    border: 'none',
    background: 'var(--paper)',
    color: 'var(--grey-700)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  filterInlineContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '48px',
    flexWrap: 'wrap' as const
  },
  filterDateSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '37px'
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--grey-900)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    whiteSpace: 'nowrap' as const
  },
  filterLabelBar: {
    width: '4px',
    height: '18px',
    background: 'var(--primary-main)',
    borderRadius: '2px'
  },
  dateRange: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  dateInput: {
    padding: '10px 14px',
    border: `1px solid ${'var(--grey-300)'}`,
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    background: 'var(--paper)',
    color: 'var(--grey-900)',
    transition: 'all 0.2s ease'
  },
  filterSettingSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    flex: 1
  },
  filterItems: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '16px',
    flex: 1
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    minWidth: '160px',
    flex: 1
  },
  filterGroupLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--grey-700)',
    marginBottom: '8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  },
  select: {
    padding: '10px 14px',
    border: `1px solid ${'var(--grey-300)'}`,
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    background: 'var(--paper)',
    color: 'var(--grey-900)',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  },
  filterRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '16px'
  },
  // KPI 섹션
  kpiUnifiedSection: {
    marginBottom: '24px'
  },
  kpiControlsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  kpiTabSection: {
    display: 'flex',
    gap: '8px'
  },
  kpiTab: {
    padding: '10px 24px',
    border: 'none',
    background: 'var(--paper)',
    color: 'var(--grey-700)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  kpiTabActive: {
    background: 'var(--primary-main)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(103, 58, 183, 0.4)'
  },
  kpiViewToggle: {
    display: 'flex',
    gap: '8px'
  },
  kpiViewBtn: {
    padding: '10px 24px',
    border: 'none',
    background: 'var(--paper)',
    color: 'var(--grey-700)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  kpiViewBtnActive: {
    background: 'var(--primary-main)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(103, 58, 183, 0.4)'
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  kpiCard: {
    background: 'var(--paper)',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    position: 'relative' as const,
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  kpiCardHighlight: {
    borderLeft: `4px solid ${'var(--primary-main)'}`
  },
  kpiCardSecondary: {
    background: 'var(--grey-50)'
  },
  kpiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  kpiTitle: {
    fontSize: '13px',
    color: 'var(--grey-600)',
    fontWeight: 600
  },
  kpiIcon: {
    width: '36px',
    height: '36px',
    background: 'var(--grey-100)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--primary-main)',
    fontSize: '16px'
  },
  kpiValue: {
    fontSize: '26px',
    fontWeight: 700,
    color: 'var(--grey-900)',
    marginBottom: '8px'
  },
  kpiValueHighlight: {
    color: 'var(--primary-main)'
  },
  kpiTrend: {
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap' as const
  },
  kpiTrendUp: {
    color: 'var(--success-main)'
  },
  kpiTrendDown: {
    color: 'var(--error-main)'
  },
  kpiTrendNeutral: {
    color: 'var(--grey-600)'
  },
  trendValue: {
    fontWeight: 600
  },
  trendPp: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 6px',
    fontSize: '11px',
    fontWeight: 600,
    borderRadius: '4px',
    background: 'var(--grey-100)',
    color: 'var(--grey-600)'
  },
  trendPpPositive: {
    color: 'var(--success-main)',
    background: 'rgba(76, 175, 80, 0.1)'
  },
  trendPpNegative: {
    color: 'var(--error-main)',
    background: 'rgba(244, 67, 54, 0.1)'
  },
  trendDetail: {
    fontSize: '11px',
    color: 'var(--grey-600)',
    marginTop: '6px'
  },
  prevLabel: {
    marginRight: '4px'
  },
  prevValue: {
    fontWeight: 600,
    color: 'var(--grey-700)'
  },
  // 차트 섹션
  chartSection: {
    marginBottom: '24px',
    padding: '24px',
    background: 'var(--paper)',
    borderRadius: '12px',
    boxShadow: '0 2px 14px 0 rgba(32, 40, 45, 0.08)'
  },
  chartSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  chartHeader: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--grey-900)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  chartHeaderBar: {
    width: '4px',
    height: '20px',
    background: 'var(--secondary-main)',
    borderRadius: '2px'
  },
  dataLabelToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    border: 'none',
    background: 'var(--paper)',
    color: 'var(--grey-700)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  dataLabelToggleActive: {
    background: 'var(--primary-main)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(103, 58, 183, 0.4)'
  },
  chartControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap' as const
  },
  chartToggleGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const
  },
  chartContainer: {
    position: 'relative' as const,
    height: '300px'
  },
  // 테이블 섹션
  tableSection: {
    overflow: 'hidden',
    background: 'var(--paper)',
    borderRadius: '12px',
    boxShadow: '0 2px 14px 0 rgba(32, 40, 45, 0.08)'
  },
  tableHeader: {
    padding: '20px 24px',
    borderBottom: `1px solid ${'var(--grey-200)'}`,
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--grey-900)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  tableHeaderBar: {
    width: '4px',
    height: '20px',
    background: 'var(--success-main)',
    borderRadius: '2px'
  },
  tableContainer: {
    overflowX: 'auto' as const
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const
  },
  th: {
    padding: '14px 16px',
    textAlign: 'right' as const,
    fontSize: '14px',
    background: 'var(--grey-50)',
    fontWeight: 600,
    color: 'var(--grey-700)',
    borderBottom: `2px solid ${'var(--grey-200)'}`,
    whiteSpace: 'nowrap' as const
  },
  thFirst: {
    textAlign: 'left' as const
  },
  td: {
    padding: '14px 16px',
    textAlign: 'right' as const,
    fontSize: '14px',
    borderBottom: `1px solid ${'var(--grey-100)'}`,
    color: 'var(--grey-900)'
  },
  tdFirst: {
    textAlign: 'left' as const,
    fontWeight: 500
  },
  positive: {
    color: 'var(--success-main)',
    fontWeight: 600
  },
  negative: {
    color: 'var(--error-main)',
    fontWeight: 600
  },
  totalRow: {
    fontWeight: 600,
    background: `${'var(--primary-light)'} !important`
  },
  totalRowTd: {
    borderTop: `2px solid ${'var(--primary-main)'}`,
    color: 'var(--primary-dark)'
  },
  showMoreContainer: {
    padding: '16px 24px',
    textAlign: 'center' as const,
    borderTop: `1px solid ${'var(--grey-200)'}`
  },
  showMoreBtn: {
    padding: '10px 32px',
    background: 'var(--grey-100)',
    color: 'var(--grey-700)',
    border: `1px solid ${'var(--grey-300)'}`,
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '14px',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease'
  },
  loading: {
    textAlign: 'center' as const,
    padding: '60px 40px',
    color: 'var(--grey-600)'
  }
}

// 타입 정의
interface RawData {
  '일 구분': string
  '주 구분': string
  '월 구분': string
  '유형구분': string
  '브랜드명': string
  '상품명': string
  '프로모션': string
  '캠페인': string
  '세트이름': string
  '비용': string
  '노출': string
  '클릭': string
  '전환수': string
  '전환값': string
  [key: string]: string
}

interface AggregatedData {
  period: string
  비용: number
  노출: number
  클릭: number
  전환수: number
  전환값: number
  CPM: number
  CPC: number
  CPA: number
  ROAS: number
}

interface Filters {
  type: string
  brand: string
  product: string
  promotion: string
  startDate: string
  endDate: string
  campaign: string
  setName: string
}

// RFC 4180 호환 CSV 파싱 함수
function parseCSV(text: string): RawData[] {
  const lines = text.trim().split('\n')

  function parseLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }

    result.push(current)
    return result
  }

  const headers = parseLine(lines[0]).map(h => h.trim())

  return lines.slice(1).map(line => {
    const values = parseLine(line)
    const obj: Record<string, string> = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] ? values[index].trim() : ''
    })
    return obj as RawData
  })
}

// 숫자 포맷 함수 - #,###;;-;@ 형식 (0은 '-'로 표시)
function formatNumber(num: number): string {
  if (num === 0 || num === null || num === undefined) return '-'
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// ROAS 포맷 함수 - 0%;;-;@ 형식 (0은 '-'로 표시, %는 정수)
function formatROAS(num: number): string {
  if (num === 0 || num === null || num === undefined) return '-'
  return Math.round(num) + '%'
}

// 날짜 포맷 함수
function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

export default function ReactView() {
  // 상태 관리
  const [allData, setAllData] = useState<RawData[]>([])
  const [currentView, setCurrentView] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
  const [showDataLabels, setShowDataLabels] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    type: '',
    brand: '',
    product: '',
    promotion: '',
    startDate: '',
    endDate: '',
    campaign: '',
    setName: ''
  })
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [kpiTab, setKpiTab] = useState<'total' | 'daily' | 'weekly' | 'monthly'>('total')
  const [kpiView, setKpiView] = useState<'primary' | 'all'>('primary')
  const [chartToggles, setChartToggles] = useState({
    cost: true,
    cpm: false,
    cpc: false,
    cpa: false,
    roas: true
  })
  const [isTableExpanded, setIsTableExpanded] = useState(false)
  const trendChart = useRef<ChartJS | null>(null)

  const TABLE_ROW_LIMIT = 10

  // 데이터 로드
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/raw/raw_data.csv')
        if (!response.ok) throw new Error('Failed to load data')
        const text = await response.text()
        const data = parseCSV(text)
        setAllData(data)
        console.log('[loadData] 로드된 데이터:', data.length, '건')
      } catch (err) {
        console.warn('Could not load data:', err)
      }
    }
    loadData()
  }, [])

  // 날짜 범위 설정
  useEffect(() => {
    if (allData.length === 0) return

    const dates = allData
      .map(d => d['일 구분'])
      .filter(Boolean)
      .map(d => new Date(d))
      .filter(d => !isNaN(d.getTime()))

    if (dates.length > 0) {
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))

      setFilters(prev => ({
        ...prev,
        startDate: formatDateForInput(minDate),
        endDate: formatDateForInput(maxDate)
      }))
    }
  }, [allData])

  // 필터 옵션 계산 (유형구분)
  const typeOptions = useMemo(() => {
    return Array.from(new Set(allData.map(d => d['유형구분']))).filter(Boolean).sort()
  }, [allData])

  // 브랜드명 필터 옵션 (유형구분에 종속)
  const updateBrandFilter = useMemo(() => {
    const filtered = allData.filter(row => {
      if (filters.type && row['유형구분'] !== filters.type) return false
      return true
    })
    return Array.from(new Set(filtered.map(d => d['브랜드명']))).filter(Boolean).sort()
  }, [allData, filters.type])

  // 상품명 필터 옵션 (브랜드명에 종속)
  const updateProductFilter = useMemo(() => {
    const filtered = allData.filter(row => {
      if (filters.type && row['유형구분'] !== filters.type) return false
      if (filters.brand && row['브랜드명'] !== filters.brand) return false
      return true
    })
    return Array.from(new Set(filtered.map(d => d['상품명']))).filter(Boolean).sort()
  }, [allData, filters.type, filters.brand])

  // 프로모션 필터 옵션 (상품명에 종속)
  const updatePromotionFilter = useMemo(() => {
    const filtered = allData.filter(row => {
      if (filters.type && row['유형구분'] !== filters.type) return false
      if (filters.brand && row['브랜드명'] !== filters.brand) return false
      if (filters.product && row['상품명'] !== filters.product) return false
      return true
    })
    return Array.from(new Set(filtered.map(d => d['프로모션']))).filter(Boolean).sort()
  }, [allData, filters.type, filters.brand, filters.product])

  // 캠페인 필터 옵션 (기본 필터 조건에 종속)
  const campaignOptions = useMemo(() => {
    const filtered = allData.filter(row => {
      if (filters.startDate || filters.endDate) {
        const rowDate = new Date(row['일 구분'])
        if (isNaN(rowDate.getTime())) return false
        if (filters.startDate && rowDate < new Date(filters.startDate)) return false
        if (filters.endDate && rowDate > new Date(filters.endDate)) return false
      }
      if (filters.type && row['유형구분'] !== filters.type) return false
      if (filters.brand && row['브랜드명'] !== filters.brand) return false
      if (filters.product && row['상품명'] !== filters.product) return false
      if (filters.promotion && row['프로모션'] !== filters.promotion) return false
      return true
    })
    return Array.from(new Set(filtered.map(d => d['캠페인']))).filter(Boolean).sort()
  }, [allData, filters.startDate, filters.endDate, filters.type, filters.brand, filters.product, filters.promotion])

  // 세트이름 필터 옵션 (캠페인에 종속)
  const updateSetNameFilter = useMemo(() => {
    const filtered = allData.filter(row => {
      if (filters.startDate || filters.endDate) {
        const rowDate = new Date(row['일 구분'])
        if (isNaN(rowDate.getTime())) return false
        if (filters.startDate && rowDate < new Date(filters.startDate)) return false
        if (filters.endDate && rowDate > new Date(filters.endDate)) return false
      }
      if (filters.type && row['유형구분'] !== filters.type) return false
      if (filters.brand && row['브랜드명'] !== filters.brand) return false
      if (filters.product && row['상품명'] !== filters.product) return false
      if (filters.promotion && row['프로모션'] !== filters.promotion) return false
      if (filters.campaign && row['캠페인'] !== filters.campaign) return false
      return true
    })
    return Array.from(new Set(filtered.map(d => d['세트이름']))).filter(Boolean).sort()
  }, [allData, filters.startDate, filters.endDate, filters.type, filters.brand, filters.product, filters.promotion, filters.campaign])

  // 필터링된 데이터
  const filterData = useMemo(() => {
    return allData.filter(row => {
      if (filters.type && row['유형구분'] !== filters.type) return false
      if (filters.brand && row['브랜드명'] !== filters.brand) return false
      if (filters.product && row['상품명'] !== filters.product) return false
      if (filters.promotion && row['프로모션'] !== filters.promotion) return false

      if (filters.startDate || filters.endDate) {
        const rowDate = new Date(row['일 구분'])
        if (isNaN(rowDate.getTime())) return false
        if (filters.startDate && rowDate < new Date(filters.startDate)) return false
        if (filters.endDate && rowDate > new Date(filters.endDate)) return false
      }

      if (filters.campaign && row['캠페인'] !== filters.campaign) return false
      if (filters.setName && row['세트이름'] !== filters.setName) return false

      return true
    })
  }, [allData, filters])

  // 집계된 데이터
  const aggregateData = useMemo(() => {
    const groupKey = {
      'daily': '일 구분',
      'weekly': '주 구분',
      'monthly': '월 구분'
    }[currentView]

    const groups: Record<string, {
      period: string
      비용: number
      노출: number
      클릭: number
      전환수: number
      전환값: number
    }> = {}

    filterData.forEach(row => {
      const key = row[groupKey]
      if (!key) return

      if (!groups[key]) {
        groups[key] = {
          period: key,
          비용: 0,
          노출: 0,
          클릭: 0,
          전환수: 0,
          전환값: 0
        }
      }

      groups[key].비용 += parseFloat(row['비용']) || 0
      groups[key].노출 += parseFloat(row['노출']) || 0
      groups[key].클릭 += parseFloat(row['클릭']) || 0
      groups[key].전환수 += parseFloat(row['전환수']) || 0
      groups[key].전환값 += parseFloat(row['전환값']) || 0
    })

    return Object.values(groups).map(g => ({
      ...g,
      CPM: g.노출 > 0 ? (g.비용 / g.노출 * 1000) : 0,
      CPC: g.클릭 > 0 ? (g.비용 / g.클릭) : 0,
      CPA: g.전환수 > 0 ? (g.비용 / g.전환수) : 0,
      ROAS: g.비용 > 0 ? (g.전환값 / g.비용 * 100) : 0
    })).sort((a, b) => {
      const dateA = new Date(a.period.replace(/\. /g, '-').replace(/\./g, ''))
      const dateB = new Date(b.period.replace(/\. /g, '-').replace(/\./g, ''))
      return dateA.getTime() - dateB.getTime()
    })
  }, [filterData, currentView])

  // 전체 합계 계산
  const totals = useMemo(() => {
    const result = aggregateData.reduce((acc, row) => {
      acc.비용 += row.비용
      acc.노출 += row.노출
      acc.클릭 += row.클릭
      acc.전환수 += row.전환수
      acc.전환값 += row.전환값
      return acc
    }, { 비용: 0, 노출: 0, 클릭: 0, 전환수: 0, 전환값: 0 })

    return {
      ...result,
      CPM: result.노출 > 0 ? (result.비용 / result.노출 * 1000) : 0,
      CPC: result.클릭 > 0 ? (result.비용 / result.클릭) : 0,
      CPA: result.전환수 > 0 ? (result.비용 / result.전환수) : 0,
      ROAS: result.비용 > 0 ? (result.전환값 / result.비용 * 100) : 0
    }
  }, [aggregateData])

  // 트렌드 계산 (마지막 기간 vs 직전 기간)
  const trendData = useMemo(() => {
    if (aggregateData.length < 2) return null

    const lastPeriodData = aggregateData[aggregateData.length - 1]
    const prevPeriodData = aggregateData[aggregateData.length - 2]

    const calcMetrics = (row: AggregatedData) => ({
      비용: row.비용,
      노출: row.노출,
      클릭: row.클릭,
      전환수: row.전환수,
      전환값: row.전환값,
      CPM: row.CPM,
      CPC: row.CPC,
      CPA: row.CPA,
      ROAS: row.ROAS
    })

    const first = calcMetrics(prevPeriodData)
    const second = calcMetrics(lastPeriodData)

    const calcChange = (newVal: number, oldVal: number) => {
      if (oldVal === 0) return newVal > 0 ? 100 : 0
      return ((newVal - oldVal) / oldVal * 100)
    }

    return {
      current: second,
      prev: first,
      changes: {
        비용: calcChange(second.비용, first.비용),
        노출: calcChange(second.노출, first.노출),
        클릭: calcChange(second.클릭, first.클릭),
        전환수: calcChange(second.전환수, first.전환수),
        전환값: calcChange(second.전환값, first.전환값),
        CPM: calcChange(second.CPM, first.CPM),
        CPC: calcChange(second.CPC, first.CPC),
        CPA: calcChange(second.CPA, first.CPA),
        ROAS: calcChange(second.ROAS, first.ROAS)
      }
    }
  }, [aggregateData])

  // 필터 변경 핸들러
  const handleFilterChange = useCallback((key: keyof Filters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value }

      // 계층 구조 초기화
      if (key === 'type') {
        newFilters.brand = ''
        newFilters.product = ''
        newFilters.promotion = ''
      } else if (key === 'brand') {
        newFilters.product = ''
        newFilters.promotion = ''
      } else if (key === 'product') {
        newFilters.promotion = ''
      } else if (key === 'campaign') {
        newFilters.setName = ''
      }

      return newFilters
    })
  }, [])

  // 기간 및 기본 필터 초기화
  const resetBasicFilters = useCallback(() => {
    if (allData.length === 0) return

    const dates = allData
      .map(d => d['일 구분'])
      .filter(Boolean)
      .map(d => new Date(d))
      .filter(d => !isNaN(d.getTime()))

    if (dates.length > 0) {
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))

      setFilters(prev => ({
        ...prev,
        type: '',
        brand: '',
        product: '',
        promotion: '',
        startDate: formatDateForInput(minDate),
        endDate: formatDateForInput(maxDate)
      }))
    }
  }, [allData])

  // 세부 필터 초기화
  const resetDetailFilters = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      campaign: '',
      setName: ''
    }))
  }, [])

  // 차트 토글 핸들러
  const handleChartToggle = useCallback((key: keyof typeof chartToggles) => {
    setChartToggles(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  // KPI 탭 변경 핸들러
  const handleKpiTabChange = useCallback((tab: 'total' | 'daily' | 'weekly' | 'monthly') => {
    setKpiTab(tab)
    if (tab !== 'total') {
      setCurrentView(tab)
    }
  }, [])

  // 트렌드 렌더링 헬퍼
  const renderTrend = useCallback((
    change: number,
    oldValue: number,
    newValue: number,
    isGoodWhenUp: boolean = true,
    isPercentage: boolean = false
  ) => {
    const isUp = change >= 0
    const isGood = isGoodWhenUp ? isUp : !isUp

    const arrow = isUp ? '↑' : '↓'
    const trendStyle = isGood ? styles.kpiTrendUp : styles.kpiTrendDown

    const diff = newValue - oldValue
    const diffSign = diff >= 0 ? '+' : ''

    let ppText: string
    let ppStyle: React.CSSProperties
    if (isPercentage) {
      const pp = newValue - oldValue
      const ppSign = pp >= 0 ? '+' : ''
      ppText = `${ppSign}${Math.round(pp)}%p`
      ppStyle = pp >= 0 ? { ...styles.trendPp, ...styles.trendPpPositive } : { ...styles.trendPp, ...styles.trendPpNegative }
    } else {
      ppText = `${diffSign}${formatNumber(diff)}`
      ppStyle = isGood ? { ...styles.trendPp, ...styles.trendPpPositive } : { ...styles.trendPp, ...styles.trendPpNegative }
    }

    const prevText = isPercentage ? `${Math.round(oldValue)}%` : formatNumber(oldValue)

    return (
      <>
        <div style={{ ...styles.kpiTrend, ...trendStyle }}>
          <span style={styles.trendValue}>{arrow} {Math.abs(Math.round(change))}%</span>
          <span style={ppStyle}>{ppText}</span>
        </div>
        <div style={styles.trendDetail}>
          <span style={styles.prevLabel}>이전</span>
          <span style={styles.prevValue}>{prevText}</span>
        </div>
      </>
    )
  }, [])

  // 차트 데이터
  const currentChartData = useMemo(() => {
    const labels = aggregateData.map(d => d.period)
    const datasets: any[] = []

    const showCost = chartToggles.cost
    const showCPM = chartToggles.cpm
    const showCPC = chartToggles.cpc
    const showCPA = chartToggles.cpa
    const showROAS = chartToggles.roas

    const hasCostMetric = showCost
    const hasCpmMetric = showCPM
    const hasCpcMetric = showCPC
    const hasCpaMetric = showCPA

    const selectedCount = (showCost ? 1 : 0) + (showCPM ? 1 : 0) + (showCPC ? 1 : 0) + (showCPA ? 1 : 0) + (showROAS ? 1 : 0)
    const useRightAxis = selectedCount >= 2

    if (showCost) {
      datasets.push({
        label: '비용',
        data: aggregateData.map(d => d.비용),
        backgroundColor: 'rgba(103, 58, 183, 0.7)',
        borderColor: 'rgba(103, 58, 183, 1)',
        borderWidth: 1,
        borderRadius: 4,
        yAxisID: 'y',
        order: 4
      })
    }

    if (showCPM) {
      datasets.push({
        label: 'CPM',
        data: aggregateData.map(d => d.CPM),
        type: 'line' as const,
        borderColor: 'rgba(255, 171, 0, 1)',
        backgroundColor: 'rgba(255, 171, 0, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(255, 171, 0, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.4,
        yAxisID: hasCostMetric ? 'y1' : 'y',
        order: 3
      })
    }

    if (showCPC) {
      datasets.push({
        label: 'CPC',
        data: aggregateData.map(d => d.CPC),
        type: 'line' as const,
        borderColor: 'rgba(33, 150, 243, 1)',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(33, 150, 243, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.4,
        yAxisID: (hasCostMetric || hasCpmMetric) ? 'y1' : 'y',
        order: 3
      })
    }

    if (showCPA) {
      datasets.push({
        label: 'CPA',
        data: aggregateData.map(d => d.CPA),
        type: 'line' as const,
        borderColor: 'rgba(255, 152, 0, 1)',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(255, 152, 0, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.4,
        yAxisID: (hasCostMetric || hasCpmMetric || hasCpcMetric) ? 'y1' : 'y',
        order: 2
      })
    }

    if (showROAS) {
      datasets.push({
        label: 'ROAS (%)',
        data: aggregateData.map(d => d.ROAS),
        type: 'line' as const,
        borderColor: 'rgba(0, 200, 83, 1)',
        backgroundColor: 'rgba(0, 200, 83, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgba(0, 200, 83, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
        yAxisID: (hasCostMetric || hasCpmMetric || hasCpcMetric || hasCpaMetric) ? 'y1' : 'y',
        order: 1
      })
    }

    return { labels, datasets, useRightAxis, showCost, showCPM, showCPC, showCPA, showROAS, hasCostMetric, hasCpmMetric, hasCpcMetric, hasCpaMetric }
  }, [aggregateData, chartToggles])

  // 차트 옵션
  const chartOptions = useMemo(() => {
    const { useRightAxis, showCost, showCPM, showCPC, showCPA, showROAS, hasCostMetric, hasCpmMetric, hasCpcMetric, hasCpaMetric } = currentChartData

    const y1Title = (() => {
      const rightMetrics: string[] = []
      if (hasCostMetric && showCPM) rightMetrics.push('CPM')
      if ((hasCostMetric || hasCpmMetric) && showCPC) rightMetrics.push('CPC')
      if ((hasCostMetric || hasCpmMetric || hasCpcMetric) && showCPA) rightMetrics.push('CPA')
      if ((hasCostMetric || hasCpmMetric || hasCpcMetric || hasCpaMetric) && showROAS) rightMetrics.push('ROAS')

      if (rightMetrics.length === 0) return ''
      if (rightMetrics.includes('ROAS') && rightMetrics.length === 1) return 'ROAS (%)'
      if (rightMetrics.includes('ROAS')) return rightMetrics.join('/')
      return rightMetrics.join('/') + ' (원)'
    })()

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top' as const,
          align: 'end' as const,
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              family: "'Inter', sans-serif",
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(33, 33, 33, 0.9)',
          titleFont: {
            family: "'Inter', sans-serif",
            size: 13
          },
          bodyFont: {
            family: "'Inter', sans-serif",
            size: 12
          },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function(context: any) {
              let label = context.dataset.label || ''
              if (label) {
                label += ': '
              }
              if (context.dataset.label === 'ROAS (%)') {
                label += Math.round(context.parsed.y) + '%'
              } else {
                label += formatNumber(context.parsed.y) + '원'
              }
              return label
            }
          }
        },
        datalabels: {
          display: showDataLabels,
          anchor: 'end' as const,
          align: 'top' as const,
          offset: 4,
          font: {
            family: "'Inter', sans-serif",
            size: 11,
            weight: 'bold' as const
          },
          color: function(context: any) {
            return context.dataset.borderColor || context.dataset.backgroundColor
          },
          formatter: function(value: number, context: any) {
            if (context.dataset.label === 'ROAS (%)') {
              return Math.round(value) + '%'
            } else {
              return formatNumber(Math.round(value))
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              family: "'Inter', sans-serif",
              size: 11
            },
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          type: 'linear' as const,
          display: true,
          position: 'left' as const,
          title: {
            display: true,
            text: (() => {
              if (showCost) return '비용 (원)'
              if (showCPM) return 'CPM (원)'
              if (showCPC) return 'CPC (원)'
              if (showCPA) return 'CPA (원)'
              if (showROAS) return 'ROAS (%)'
              return '금액 (원)'
            })(),
            font: {
              family: "'Inter', sans-serif",
              size: 12
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: {
              family: "'Inter', sans-serif",
              size: 11
            },
            callback: function(value: number | string) {
              const numValue = typeof value === 'string' ? parseFloat(value) : value
              if (!showCost && !showCPM && !showCPC && !showCPA && showROAS) {
                return numValue + '%'
              }
              if (numValue >= 1000000) {
                return (numValue / 1000000).toFixed(1) + 'M'
              } else if (numValue >= 1000) {
                return (numValue / 1000).toFixed(0) + 'K'
              }
              return numValue
            }
          }
        },
        y1: {
          type: 'linear' as const,
          display: useRightAxis,
          position: 'right' as const,
          title: {
            display: true,
            text: y1Title,
            font: {
              family: "'Inter', sans-serif",
              size: 12
            }
          },
          grid: {
            drawOnChartArea: false
          },
          ticks: {
            font: {
              family: "'Inter', sans-serif",
              size: 11
            },
            callback: function(value: number | string) {
              const numValue = typeof value === 'string' ? parseFloat(value) : value
              const rightMetrics: string[] = []
              if (hasCostMetric && showCPM) rightMetrics.push('CPM')
              if ((hasCostMetric || hasCpmMetric) && showCPC) rightMetrics.push('CPC')
              if ((hasCostMetric || hasCpmMetric || hasCpcMetric) && showCPA) rightMetrics.push('CPA')
              if ((hasCostMetric || hasCpmMetric || hasCpcMetric || hasCpaMetric) && showROAS) rightMetrics.push('ROAS')

              if (rightMetrics.includes('ROAS') && rightMetrics.length === 1) {
                return numValue + '%'
              } else if (!rightMetrics.includes('ROAS')) {
                return formatNumber(numValue)
              }
              return numValue
            }
          }
        }
      }
    }
  }, [currentChartData, showDataLabels])

  // 테이블 데이터 (표시용)
  const tableData = useMemo(() => {
    if (isTableExpanded) {
      return aggregateData
    }
    return aggregateData.slice(0, TABLE_ROW_LIMIT)
  }, [aggregateData, isTableExpanded])

  const hiddenCount = Math.max(0, aggregateData.length - TABLE_ROW_LIMIT)

  // 로딩 상태
  if (allData.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>데이터를 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.h1}>마케팅 성과 대시보드</h1>
          <div style={styles.headerSubtitle}>광고 캠페인 성과 분석 및 KPI 모니터링</div>
        </div>
      </div>

      {/* 필터 설정 (접기/펼치기) */}
      <div style={styles.collapsibleSection}>
        <div
          style={styles.collapsibleHeader}
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
        >
          <div style={styles.collapsibleTitle}>
            <span style={styles.filterHeaderBar}></span>
            필터 설정
            <span style={styles.collapsibleGuide}>* 펼쳐서 세부 성과를 필터링할 수 있어요</span>
          </div>
          <button style={styles.collapsibleToggle}>
            <span>{isFilterExpanded ? '접기' : '펼치기'}</span>
            <span style={{ transition: 'transform 0.2s ease', transform: isFilterExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
          </button>
        </div>
        <div style={{
          ...styles.collapsibleContent,
          ...(isFilterExpanded ? styles.collapsibleContentExpanded : {})
        }}>
          {/* 기간 선택 + 기본 필터 */}
          <div style={styles.filterSection}>
            <div style={styles.filterSectionHeader}>
              <div style={styles.filterHeader}>
                <span style={styles.filterHeaderBar}></span>
                기간 및 기본 필터
              </div>
              <button style={styles.resetBtn} onClick={resetBasicFilters}>초기화</button>
            </div>
            <div style={styles.filterInlineContainer}>
              {/* 기간 선택 */}
              <div style={styles.filterDateSection}>
                <div style={styles.filterLabel}>
                  <span style={styles.filterLabelBar}></span>
                  기간 선택
                </div>
                <div style={styles.dateRange}>
                  <input
                    type="date"
                    style={styles.dateInput}
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                  <span style={{ color: 'var(--grey-600)', fontWeight: 500 }}>~</span>
                  <input
                    type="date"
                    style={styles.dateInput}
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
              </div>
              {/* 기본 필터 */}
              <div style={styles.filterSettingSection}>
                <div style={styles.filterLabel}>
                  <span style={styles.filterLabelBar}></span>
                  기본 필터
                </div>
                <div style={styles.filterItems}>
                  <div style={styles.filterGroup}>
                    <label style={styles.filterGroupLabel}>유형구분</label>
                    <select
                      style={styles.select}
                      value={filters.type}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                    >
                      <option value="">전체</option>
                      {typeOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.filterGroup}>
                    <label style={styles.filterGroupLabel}>브랜드명</label>
                    <select
                      style={styles.select}
                      value={filters.brand}
                      onChange={(e) => handleFilterChange('brand', e.target.value)}
                    >
                      <option value="">전체</option>
                      {updateBrandFilter.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.filterGroup}>
                    <label style={styles.filterGroupLabel}>상품명</label>
                    <select
                      style={styles.select}
                      value={filters.product}
                      onChange={(e) => handleFilterChange('product', e.target.value)}
                    >
                      <option value="">전체</option>
                      {updateProductFilter.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.filterGroup}>
                    <label style={styles.filterGroupLabel}>프로모션</label>
                    <select
                      style={styles.select}
                      value={filters.promotion}
                      onChange={(e) => handleFilterChange('promotion', e.target.value)}
                    >
                      <option value="">전체</option>
                      {updatePromotionFilter.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* 세부 필터 */}
          <div style={styles.filterSection}>
            <div style={styles.filterSectionHeader}>
              <div style={styles.filterHeader}>
                <span style={styles.filterHeaderBar}></span>
                세부 필터
              </div>
              <button style={styles.resetBtn} onClick={resetDetailFilters}>초기화</button>
            </div>
            <div style={styles.filterRow}>
              <div style={styles.filterGroup}>
                <label style={styles.filterGroupLabel}>캠페인</label>
                <select
                  style={styles.select}
                  value={filters.campaign}
                  onChange={(e) => handleFilterChange('campaign', e.target.value)}
                >
                  <option value="">전체</option>
                  {campaignOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterGroupLabel}>세트이름</label>
                <select
                  style={styles.select}
                  value={filters.setName}
                  onChange={(e) => handleFilterChange('setName', e.target.value)}
                >
                  <option value="">전체</option>
                  {updateSetNameFilter.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 통합 KPI 섹션 */}
      <div style={styles.kpiUnifiedSection}>
        {/* 기간 탭 + 주요/세부 성과 토글 (같은 행) */}
        <div style={styles.kpiControlsRow}>
          {/* 기간 탭 */}
          <div style={styles.kpiTabSection}>
            <button
              style={{ ...styles.kpiTab, ...(kpiTab === 'total' ? styles.kpiTabActive : {}) }}
              onClick={() => handleKpiTabChange('total')}
            >
              전체
            </button>
            <button
              style={{ ...styles.kpiTab, ...(kpiTab === 'monthly' ? styles.kpiTabActive : {}) }}
              onClick={() => handleKpiTabChange('monthly')}
            >
              월별
            </button>
            <button
              style={{ ...styles.kpiTab, ...(kpiTab === 'weekly' ? styles.kpiTabActive : {}) }}
              onClick={() => handleKpiTabChange('weekly')}
            >
              주별
            </button>
            <button
              style={{ ...styles.kpiTab, ...(kpiTab === 'daily' ? styles.kpiTabActive : {}) }}
              onClick={() => handleKpiTabChange('daily')}
            >
              일별
            </button>
          </div>
          {/* 주요/세부 성과 토글 */}
          <div style={styles.kpiViewToggle}>
            <button
              style={{ ...styles.kpiViewBtn, ...(kpiView === 'primary' ? styles.kpiViewBtnActive : {}) }}
              onClick={() => setKpiView('primary')}
            >
              주요 성과
            </button>
            <button
              style={{ ...styles.kpiViewBtn, ...(kpiView === 'all' ? styles.kpiViewBtnActive : {}) }}
              onClick={() => setKpiView('all')}
            >
              세부 성과
            </button>
          </div>
        </div>

        {/* 전체 탭 콘텐츠 (요약 데이터) */}
        {kpiTab === 'total' && (
          <div>
            <section style={styles.kpiGrid}>
              <div style={styles.kpiCard}>
                <div style={styles.kpiHeader}>
                  <span style={styles.kpiTitle}>총 비용</span>
                  <div style={styles.kpiIcon}>💰</div>
                </div>
                <div style={styles.kpiValue}>{formatNumber(totals.비용)}</div>
                <div style={{ ...styles.kpiTrend, ...styles.kpiTrendNeutral }}>
                  <span>전체 기간 합계</span>
                </div>
              </div>
              <div style={{ ...styles.kpiCard, ...styles.kpiCardHighlight }}>
                <div style={styles.kpiHeader}>
                  <span style={styles.kpiTitle}>ROAS</span>
                  <div style={styles.kpiIcon}>📈</div>
                </div>
                <div style={{ ...styles.kpiValue, ...styles.kpiValueHighlight }}>{formatROAS(totals.ROAS)}</div>
                <div style={{ ...styles.kpiTrend, ...styles.kpiTrendNeutral }}>
                  <span>광고 수익률</span>
                </div>
              </div>
              <div style={styles.kpiCard}>
                <div style={styles.kpiHeader}>
                  <span style={styles.kpiTitle}>CPA</span>
                  <div style={styles.kpiIcon}>🎯</div>
                </div>
                <div style={styles.kpiValue}>{formatNumber(totals.CPA)}</div>
                <div style={{ ...styles.kpiTrend, ...styles.kpiTrendNeutral }}>
                  <span>전환당 비용</span>
                </div>
              </div>
              <div style={styles.kpiCard}>
                <div style={styles.kpiHeader}>
                  <span style={styles.kpiTitle}>CPC</span>
                  <div style={styles.kpiIcon}>🖱️</div>
                </div>
                <div style={styles.kpiValue}>{formatNumber(totals.CPC)}</div>
                <div style={{ ...styles.kpiTrend, ...styles.kpiTrendNeutral }}>
                  <span>클릭당 비용</span>
                </div>
              </div>
              <div style={styles.kpiCard}>
                <div style={styles.kpiHeader}>
                  <span style={styles.kpiTitle}>CPM</span>
                  <div style={styles.kpiIcon}>👁️</div>
                </div>
                <div style={styles.kpiValue}>{formatNumber(totals.CPM)}</div>
                <div style={{ ...styles.kpiTrend, ...styles.kpiTrendNeutral }}>
                  <span>노출당 비용</span>
                </div>
              </div>
            </section>
            {kpiView === 'all' && (
              <section style={styles.kpiGrid}>
                <div style={{ ...styles.kpiCard, ...styles.kpiCardSecondary }}>
                  <div style={styles.kpiHeader}>
                    <span style={styles.kpiTitle}>총 노출</span>
                    <div style={{ ...styles.kpiIcon, background: 'var(--grey-200)' }}>👀</div>
                  </div>
                  <div style={styles.kpiValue}>{formatNumber(totals.노출)}</div>
                  <div style={{ ...styles.kpiTrend, ...styles.kpiTrendNeutral }}>
                    <span>회</span>
                  </div>
                </div>
                <div style={{ ...styles.kpiCard, ...styles.kpiCardSecondary }}>
                  <div style={styles.kpiHeader}>
                    <span style={styles.kpiTitle}>총 클릭</span>
                    <div style={{ ...styles.kpiIcon, background: 'var(--grey-200)' }}>👆</div>
                  </div>
                  <div style={styles.kpiValue}>{formatNumber(totals.클릭)}</div>
                  <div style={{ ...styles.kpiTrend, ...styles.kpiTrendNeutral }}>
                    <span>회</span>
                  </div>
                </div>
                <div style={{ ...styles.kpiCard, ...styles.kpiCardSecondary }}>
                  <div style={styles.kpiHeader}>
                    <span style={styles.kpiTitle}>총 전환수</span>
                    <div style={{ ...styles.kpiIcon, background: 'var(--grey-200)' }}>✅</div>
                  </div>
                  <div style={styles.kpiValue}>{formatNumber(totals.전환수)}</div>
                  <div style={{ ...styles.kpiTrend, ...styles.kpiTrendNeutral }}>
                    <span>건</span>
                  </div>
                </div>
                <div style={{ ...styles.kpiCard, ...styles.kpiCardSecondary }}>
                  <div style={styles.kpiHeader}>
                    <span style={styles.kpiTitle}>총 전환값</span>
                    <div style={{ ...styles.kpiIcon, background: 'var(--grey-200)' }}>💵</div>
                  </div>
                  <div style={styles.kpiValue}>{formatNumber(totals.전환값)}</div>
                  <div style={{ ...styles.kpiTrend, ...styles.kpiTrendNeutral }}>
                    <span>원</span>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* 기간별 탭 콘텐츠 (일별/주별/월별 - 트렌드 포함) */}
        {kpiTab !== 'total' && (
          <div>
            <section style={styles.kpiGrid}>
              <div style={styles.kpiCard}>
                <div style={styles.kpiHeader}>
                  <span style={styles.kpiTitle}>비용</span>
                  <div style={styles.kpiIcon}>💰</div>
                </div>
                <div style={styles.kpiValue}>{trendData ? formatNumber(trendData.current.비용) : '-'}</div>
                {trendData ? renderTrend(trendData.changes.비용, trendData.prev.비용, trendData.current.비용, true, false) : (
                  <div style={{ ...styles.kpiTrend, ...styles.kpiTrendNeutral }}><span>-</span></div>
                )}
              </div>
              <div style={{ ...styles.kpiCard, ...styles.kpiCardHighlight }}>
                <div style={styles.kpiHeader}>
                  <span style={styles.kpiTitle}>ROAS</span>
                  <div style={styles.kpiIcon}>📈</div>
                </div>
                <div style={{ ...styles.kpiValue, ...styles.kpiValueHighlight }}>{trendData ? formatROAS(trendData.current.ROAS) : '-'}</div>
                {trendData ? renderTrend(trendData.changes.ROAS, trendData.prev.ROAS, trendData.current.ROAS, true, true) : (
                  <div style={{ ...styles.kpiTrend, ...styles.kpiTrendNeutral }}><span>-</span></div>
                )}
              </div>
              <div style={styles.kpiCard}>
                <div style={styles.kpiHeader}>
                  <span style={styles.kpiTitle}>CPA</span>
                  <div style={styles.kpiIcon}>🎯</div>
                </div>
                <div style={styles.kpiValue}>{trendData ? formatNumber(trendData.current.CPA) : '-'}</div>
                {trendData ? renderTrend(trendData.changes.CPA, trendData.prev.CPA, trendData.current.CPA, false, false) : (
                  <div style={{ ...styles.kpiTrend, ...styles.kpiTrendNeutral }}><span>-</span></div>
                )}
              </div>
              <div style={styles.kpiCard}>
                <div style={styles.kpiHeader}>
                  <span style={styles.kpiTitle}>CPC</span>
                  <div style={styles.kpiIcon}>🖱️</div>
                </div>
                <div style={styles.kpiValue}>{trendData ? formatNumber(trendData.current.CPC) : '-'}</div>
                {trendData ? renderTrend(trendData.changes.CPC, trendData.prev.CPC, trendData.current.CPC, false, false) : (
                  <div style={{ ...styles.kpiTrend, ...styles.kpiTrendNeutral }}><span>-</span></div>
                )}
              </div>
              <div style={styles.kpiCard}>
                <div style={styles.kpiHeader}>
                  <span style={styles.kpiTitle}>CPM</span>
                  <div style={styles.kpiIcon}>👁️</div>
                </div>
                <div style={styles.kpiValue}>{trendData ? formatNumber(trendData.current.CPM) : '-'}</div>
                {trendData ? renderTrend(trendData.changes.CPM, trendData.prev.CPM, trendData.current.CPM, false, false) : (
                  <div style={{ ...styles.kpiTrend, ...styles.kpiTrendNeutral }}><span>-</span></div>
                )}
              </div>
            </section>
            {kpiView === 'all' && (
              <section style={styles.kpiGrid}>
                <div style={{ ...styles.kpiCard, ...styles.kpiCardSecondary }}>
                  <div style={styles.kpiHeader}>
                    <span style={styles.kpiTitle}>노출</span>
                    <div style={{ ...styles.kpiIcon, background: 'var(--grey-200)' }}>👀</div>
                  </div>
                  <div style={styles.kpiValue}>{trendData ? formatNumber(trendData.current.노출) : '-'}</div>
                  {trendData ? renderTrend(trendData.changes.노출, trendData.prev.노출, trendData.current.노출, true, false) : (
                    <div style={{ ...styles.kpiTrend, ...styles.kpiTrendNeutral }}><span>-</span></div>
                  )}
                </div>
                <div style={{ ...styles.kpiCard, ...styles.kpiCardSecondary }}>
                  <div style={styles.kpiHeader}>
                    <span style={styles.kpiTitle}>클릭</span>
                    <div style={{ ...styles.kpiIcon, background: 'var(--grey-200)' }}>👆</div>
                  </div>
                  <div style={styles.kpiValue}>{trendData ? formatNumber(trendData.current.클릭) : '-'}</div>
                  {trendData ? renderTrend(trendData.changes.클릭, trendData.prev.클릭, trendData.current.클릭, true, false) : (
                    <div style={{ ...styles.kpiTrend, ...styles.kpiTrendNeutral }}><span>-</span></div>
                  )}
                </div>
                <div style={{ ...styles.kpiCard, ...styles.kpiCardSecondary }}>
                  <div style={styles.kpiHeader}>
                    <span style={styles.kpiTitle}>전환수</span>
                    <div style={{ ...styles.kpiIcon, background: 'var(--grey-200)' }}>✅</div>
                  </div>
                  <div style={styles.kpiValue}>{trendData ? formatNumber(trendData.current.전환수) : '-'}</div>
                  {trendData ? renderTrend(trendData.changes.전환수, trendData.prev.전환수, trendData.current.전환수, true, false) : (
                    <div style={{ ...styles.kpiTrend, ...styles.kpiTrendNeutral }}><span>-</span></div>
                  )}
                </div>
                <div style={{ ...styles.kpiCard, ...styles.kpiCardSecondary }}>
                  <div style={styles.kpiHeader}>
                    <span style={styles.kpiTitle}>전환값</span>
                    <div style={{ ...styles.kpiIcon, background: 'var(--grey-200)' }}>💵</div>
                  </div>
                  <div style={styles.kpiValue}>{trendData ? formatNumber(trendData.current.전환값) : '-'}</div>
                  {trendData ? renderTrend(trendData.changes.전환값, trendData.prev.전환값, trendData.current.전환값, true, false) : (
                    <div style={{ ...styles.kpiTrend, ...styles.kpiTrendNeutral }}><span>-</span></div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* 차트 섹션 */}
      <div style={styles.chartSection}>
        <div style={styles.chartSectionHeader}>
          <div style={styles.chartHeader}>
            <span style={styles.chartHeaderBar}></span>
            성과 지표 추이
          </div>
          <button
            style={{ ...styles.dataLabelToggle, ...(showDataLabels ? styles.dataLabelToggleActive : {}) }}
            onClick={() => setShowDataLabels(!showDataLabels)}
          >
            <span>{showDataLabels ? '☑' : '☐'}</span>
            <span>데이터 라벨</span>
          </button>
        </div>
        <div style={styles.chartControls}>
          <div style={styles.chartToggleGroup}>
            <button
              style={{ ...styles.dataLabelToggle, ...(chartToggles.cost ? styles.dataLabelToggleActive : {}) }}
              onClick={() => handleChartToggle('cost')}
            >
              <span>{chartToggles.cost ? '✓' : '☐'}</span>
              <span>비용</span>
            </button>
            <button
              style={{ ...styles.dataLabelToggle, ...(chartToggles.cpm ? styles.dataLabelToggleActive : {}) }}
              onClick={() => handleChartToggle('cpm')}
            >
              <span>{chartToggles.cpm ? '✓' : '☐'}</span>
              <span>CPM</span>
            </button>
            <button
              style={{ ...styles.dataLabelToggle, ...(chartToggles.cpc ? styles.dataLabelToggleActive : {}) }}
              onClick={() => handleChartToggle('cpc')}
            >
              <span>{chartToggles.cpc ? '✓' : '☐'}</span>
              <span>CPC</span>
            </button>
            <button
              style={{ ...styles.dataLabelToggle, ...(chartToggles.cpa ? styles.dataLabelToggleActive : {}) }}
              onClick={() => handleChartToggle('cpa')}
            >
              <span>{chartToggles.cpa ? '✓' : '☐'}</span>
              <span>CPA</span>
            </button>
            <button
              style={{ ...styles.dataLabelToggle, ...(chartToggles.roas ? styles.dataLabelToggleActive : {}) }}
              onClick={() => handleChartToggle('roas')}
            >
              <span>{chartToggles.roas ? '✓' : '☐'}</span>
              <span>ROAS</span>
            </button>
          </div>
        </div>
        <div style={styles.chartContainer}>
          <Chart
            ref={trendChart as any}
            type="bar"
            data={{
              labels: currentChartData.labels,
              datasets: currentChartData.datasets
            }}
            options={chartOptions}
          />
        </div>
      </div>

      {/* 데이터 테이블 */}
      <div style={styles.tableSection}>
        <div style={styles.tableHeader}>
          <span style={styles.tableHeaderBar}></span>
          상세 데이터
        </div>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, ...styles.thFirst }}>기간</th>
                <th style={styles.th}>비용</th>
                <th style={styles.th}>노출</th>
                <th style={styles.th}>CPM</th>
                <th style={styles.th}>클릭</th>
                <th style={styles.th}>CPC</th>
                <th style={styles.th}>전환수</th>
                <th style={styles.th}>CPA</th>
                <th style={styles.th}>전환값</th>
                <th style={styles.th}>ROAS</th>
              </tr>
            </thead>
            <tbody>
              {aggregateData.length === 0 ? (
                <tr>
                  <td colSpan={10} style={styles.loading}>데이터가 없습니다.</td>
                </tr>
              ) : (
                <>
                  {tableData.map((row, index) => (
                    <tr key={index}>
                      <td style={{ ...styles.td, ...styles.tdFirst }}>{row.period}</td>
                      <td style={styles.td}>{formatNumber(row.비용)}</td>
                      <td style={styles.td}>{formatNumber(row.노출)}</td>
                      <td style={styles.td}>{formatNumber(row.CPM)}</td>
                      <td style={styles.td}>{formatNumber(row.클릭)}</td>
                      <td style={styles.td}>{formatNumber(row.CPC)}</td>
                      <td style={styles.td}>{formatNumber(row.전환수)}</td>
                      <td style={styles.td}>{formatNumber(row.CPA)}</td>
                      <td style={styles.td}>{formatNumber(row.전환값)}</td>
                      <td style={{ ...styles.td, ...(row.ROAS >= 100 ? styles.positive : styles.negative) }}>
                        {formatROAS(row.ROAS)}
                      </td>
                    </tr>
                  ))}
                  {/* 합계 행 */}
                  <tr style={styles.totalRow}>
                    <td style={{ ...styles.td, ...styles.tdFirst, ...styles.totalRowTd, background: 'var(--primary-light)' }}>합계</td>
                    <td style={{ ...styles.td, ...styles.totalRowTd, background: 'var(--primary-light)' }}>{formatNumber(totals.비용)}</td>
                    <td style={{ ...styles.td, ...styles.totalRowTd, background: 'var(--primary-light)' }}>{formatNumber(totals.노출)}</td>
                    <td style={{ ...styles.td, ...styles.totalRowTd, background: 'var(--primary-light)' }}>{formatNumber(totals.CPM)}</td>
                    <td style={{ ...styles.td, ...styles.totalRowTd, background: 'var(--primary-light)' }}>{formatNumber(totals.클릭)}</td>
                    <td style={{ ...styles.td, ...styles.totalRowTd, background: 'var(--primary-light)' }}>{formatNumber(totals.CPC)}</td>
                    <td style={{ ...styles.td, ...styles.totalRowTd, background: 'var(--primary-light)' }}>{formatNumber(totals.전환수)}</td>
                    <td style={{ ...styles.td, ...styles.totalRowTd, background: 'var(--primary-light)' }}>{formatNumber(totals.CPA)}</td>
                    <td style={{ ...styles.td, ...styles.totalRowTd, background: 'var(--primary-light)' }}>{formatNumber(totals.전환값)}</td>
                    <td style={{ ...styles.td, ...styles.totalRowTd, background: 'var(--primary-light)', ...(totals.ROAS >= 100 ? styles.positive : styles.negative) }}>
                      {formatROAS(totals.ROAS)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
        {/* 더 보기 / 접기 버튼 */}
        {hiddenCount > 0 && !isTableExpanded && (
          <div style={styles.showMoreContainer}>
            <button style={styles.showMoreBtn} onClick={() => setIsTableExpanded(true)}>
              더 보기 ({hiddenCount}개)
            </button>
          </div>
        )}
        {isTableExpanded && aggregateData.length > TABLE_ROW_LIMIT && (
          <div style={styles.showMoreContainer}>
            <button style={styles.showMoreBtn} onClick={() => setIsTableExpanded(false)}>
              접기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
