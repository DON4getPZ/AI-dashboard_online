'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { DATA_PATHS } from '@/config/client'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Line } from 'react-chartjs-2'
import './creative-original.css'

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
)

// ========================================
// 인터페이스 정의
// ========================================

interface RawCreativeData {
  날짜: string
  유형구분: string
  브랜드명: string
  상품명: string
  프로모션: string
  캠페인: string
  광고세트: string
  소재이름: string
  비용: string
  노출: string
  클릭: string
  전환수: string
  전환값: string
  [key: string]: string
}

interface AggregatedCreative {
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
  // 효율 필터 추가 필드
  efficiencyScore?: number
  confidenceWeight?: number
  expectedROAS?: number | null
  relativePerformance?: number
  isNonValueConversion?: boolean
  rankScores?: {
    roasScore: number
    cpaScore: number
    cpcScore: number
    cpmScore: number
    geoMean: number
  }
  classification?: string
}

interface ModalAggregatedData {
  period: string
  비용: number
  노출: number
  클릭: number
  전환수: number
  전환값: number
  CPM: number
  CTR: number
  CPC: number
  CPA: number
  ROAS: number
}

interface Filters {
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

interface KpiFilter {
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

interface BucketStat {
  min: number
  max: number
  label: string
  geoMeanROAS: number | null
  median: number | null
  count: number
}

interface Baseline {
  method: string
  totalGeoMean: number
  bucketStats?: BucketStat[]
  dataCount?: number
}

// ========================================
// 상수 정의
// ========================================

const EFFICIENCY_CONFIG = {
  MIN_SPEND: 50000,
  FULL_CONFIDENCE_SPEND: 3000000,
  TOP_PERCENT: 0.20,
  BOTTOM_PERCENT: 0.20,
  CONFIDENCE_THRESHOLD: 0.5,
  RELATIVE_PERF_THRESHOLD: 1.0
}

const SPEND_BUCKETS = [
  { min: 0, max: 100000, label: '~10만' },
  { min: 100000, max: 300000, label: '10~30만' },
  { min: 300000, max: 500000, label: '30~50만' },
  { min: 500000, max: 1000000, label: '50~100만' },
  { min: 1000000, max: 3000000, label: '100~300만' },
  { min: 3000000, max: Infinity, label: '300만+' }
]

const KPI_PRESETS: Record<string, {
  name: string
  description: string
  conditions?: Array<{ metric?: string; operator?: string; value?: number; compoundLogic?: string }>
  isAdvancedFilter?: boolean
  filterFunction?: string
}> = {
  'high_roas': {
    name: '📊 고ROAS 소재',
    description: 'ROAS > 500%',
    conditions: [{ metric: 'ROAS', operator: '>', value: 500 }]
  },
  'high_revenue': {
    name: '💰 고매출 소재',
    description: '전환값 > 100만원',
    conditions: [{ metric: '전환값', operator: '>', value: 1000000 }]
  },
  'low_cpa': {
    name: '🎯 저CPA 소재',
    description: 'CPA < 1만원',
    conditions: [{ metric: 'CPA', operator: '<', value: 10000 }]
  },
  'high_conversion': {
    name: '📈 고전환 소재',
    description: '전환수 > 10건',
    conditions: [{ metric: '전환수', operator: '>', value: 10 }]
  },
  'high_spend': {
    name: '🔥 고지출 소재',
    description: '비용 > 50만원',
    conditions: [{ metric: '비용', operator: '>', value: 500000 }]
  },
  'hidden_gem': {
    name: '💎 숨은 보석',
    description: 'ROAS > 300% AND 비용 < 10만원',
    conditions: [
      { metric: 'ROAS', operator: '>', value: 300 },
      { compoundLogic: 'and' },
      { metric: '비용', operator: '<', value: 100000 }
    ]
  },
  'scale_up': {
    name: '🚀 스케일업 후보',
    description: 'ROAS > 200% AND 전환수 > 5건',
    conditions: [
      { metric: 'ROAS', operator: '>', value: 200 },
      { compoundLogic: 'and' },
      { metric: '전환수', operator: '>', value: 5 }
    ]
  },
  'high_efficiency': {
    name: '🏆 고효율 소재',
    description: '효율 점수 상위 20% - 검증된 고성과',
    isAdvancedFilter: true,
    filterFunction: 'filterHighEfficiency'
  },
  'potential': {
    name: '💎 가능성 있는 소재',
    description: '테스트 확대 추천 - 신뢰도↓ 성과↑',
    isAdvancedFilter: true,
    filterFunction: 'filterPotential'
  },
  'needs_attention': {
    name: '🔍 주의 필요 소재',
    description: '추가 관찰 필요 - 판단 유보',
    isAdvancedFilter: true,
    filterFunction: 'filterNeedsAttention'
  },
  'low_efficiency': {
    name: '⚠️ 저효율 소재',
    description: '효율 점수 하위 20% - 예산 축소 검토',
    isAdvancedFilter: true,
    filterFunction: 'filterLowEfficiency'
  }
}

// ========================================
// 유틸리티 함수
// ========================================

function formatNumber(num: number): string {
  if (num === 0 || num === null || num === undefined) return '-'
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function formatROAS(num: number): string {
  if (num === 0 || num === null || num === undefined) return '-'
  return Math.round(num) + '%'
}

function formatCTR(num: number): string {
  if (num === 0 || num === null || num === undefined) return '-'
  return num.toFixed(2) + '%'
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatNumberInput(value: string): string {
  const num = value.replace(/[^\d.]/g, '')
  if (num === '') return ''
  const parts = num.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

function parseFormattedNumber(value: string): string {
  return value.replace(/,/g, '')
}

// CSV 한 줄 파싱 (RFC 4180 호환)
function parseCSVLine(line: string): string[] {
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

function parseCSV(text: string): RawCreativeData[] {
  const lines = text.trim().split('\n')
  const headers = parseCSVLine(lines[0]).map(h => h.trim())

  return lines.slice(1).map(line => {
    const values = parseCSVLine(line)
    const obj: Record<string, string> = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] ? values[index].trim() : ''
    })
    return obj as RawCreativeData
  })
}

function parseCSVWithQuotes(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n')
  const headers = parseCSVLine(lines[0])
  const data: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length >= 2) {
      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        row[header.trim().replace(/^"|"$/g, '')] = (values[index] || '').trim().replace(/^"|"$/g, '')
      })
      data.push(row)
    }
  }
  return data
}

// ========================================
// 고효율 소재 필터 시스템 (기하평균 기반)
// ========================================

function calcGeometricMean(values: number[]): number {
  const validValues = values.filter(v => v > 0)
  if (validValues.length === 0) return 0
  const logSum = validValues.reduce((sum, v) => sum + Math.log(v), 0)
  return Math.exp(logSum / validValues.length)
}

function calcMedian(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function calculateDataDrivenBaseline(data: AggregatedCreative[]): Baseline {
  const validData = data.filter(d => d['비용'] > 0 && d['ROAS'] > 0)

  if (validData.length < 3) {
    return { method: 'insufficient_data', totalGeoMean: 200 }
  }

  const bucketStats: BucketStat[] = SPEND_BUCKETS.map(bucket => {
    const bucketData = validData.filter(d =>
      d['비용'] >= bucket.min && d['비용'] < bucket.max
    )

    if (bucketData.length === 0) {
      return { ...bucket, geoMeanROAS: null, median: null, count: 0 }
    }

    const roasValues = bucketData.map(d => d['ROAS'])

    return {
      ...bucket,
      geoMeanROAS: calcGeometricMean(roasValues),
      median: calcMedian(roasValues),
      count: bucketData.length
    }
  })

  const allROAS = validData.map(d => d['ROAS'])
  const totalGeoMean = calcGeometricMean(allROAS)

  return {
    method: 'data_driven',
    totalGeoMean: totalGeoMean,
    bucketStats: bucketStats,
    dataCount: validData.length
  }
}

function getExpectedROAS(spend: number, baseline: Baseline): number {
  if (baseline.method === 'insufficient_data') {
    return baseline.totalGeoMean
  }

  const bucket = baseline.bucketStats?.find(b =>
    spend >= b.min && spend < b.max
  )

  if (bucket && bucket.geoMeanROAS) {
    return bucket.geoMeanROAS
  }

  return baseline.totalGeoMean
}

function calcConfidenceWeight(spend: number): number {
  if (spend < EFFICIENCY_CONFIG.MIN_SPEND) return 0
  if (spend >= EFFICIENCY_CONFIG.FULL_CONFIDENCE_SPEND) return 1

  const logMin = Math.log(EFFICIENCY_CONFIG.MIN_SPEND)
  const logMax = Math.log(EFFICIENCY_CONFIG.FULL_CONFIDENCE_SPEND)
  const logSpend = Math.log(spend)

  return (logSpend - logMin) / (logMax - logMin)
}

function calcPercentileRanks(data: AggregatedCreative[], metric: keyof AggregatedCreative, lowerIsBetter = false): Map<string, number> {
  const validData = data.filter(d => d[metric] != null && (d[metric] as number) > 0)
  if (validData.length === 0) return new Map()

  // 동일 값일 경우 name으로 2차 정렬 (정렬 안정성 보장)
  const sorted = [...validData].sort((a, b) => {
    const diff = lowerIsBetter ? (b[metric] as number) - (a[metric] as number) : (a[metric] as number) - (b[metric] as number)
    if (diff !== 0) return diff
    return (a.name || '').localeCompare(b.name || '')
  })
  const ranks = new Map<string, number>()

  sorted.forEach((item, idx) => {
    const pctRank = (idx + 1) / sorted.length
    ranks.set(item.name, pctRank)
  })

  return ranks
}

function calculateEfficiencyScores(data: AggregatedCreative[]): { scored: AggregatedCreative[]; baseline: Baseline | null } {
  const qualified = data.filter(d => (d['비용'] || 0) >= EFFICIENCY_CONFIG.MIN_SPEND)

  if (qualified.length < 3) {
    console.log('⚠️ 고효율 필터: 데이터 부족 (최소 3개 필요)')
    return { scored: [], baseline: null }
  }

  const baseline = calculateDataDrivenBaseline(qualified)

  console.log('📊 데이터 기반 효율 기준:')
  console.log(`   전체 ROAS 기하평균: ${baseline.totalGeoMean?.toFixed(0)}%`)
  baseline.bucketStats?.forEach(b => {
    if (b.geoMeanROAS) {
      console.log(`   ${b.label}: ${b.geoMeanROAS.toFixed(0)}% (n=${b.count})`)
    }
  })

  const roasRanks = calcPercentileRanks(qualified, 'ROAS', false)
  const cpaRanks = calcPercentileRanks(qualified, 'CPA', true)
  const cpcRanks = calcPercentileRanks(qualified, 'CPC', true)
  const cpmRanks = calcPercentileRanks(qualified, 'CPM', true)

  const defaultWeights = { ROAS: 0.40, CPA: 0.30, CPC: 0.20, CPM: 0.10 }
  const cpaFocusWeights = { ROAS: 0.00, CPA: 0.50, CPC: 0.30, CPM: 0.20 }

  const scored = qualified.map(item => {
    const spend = item['비용'] || 0
    const actualROAS = item['ROAS'] || 0
    const conversions = item['전환수'] || 0
    const conversionValue = item['전환값'] || 0

    const isNonValueConversion = conversions > 0 && conversionValue === 0
    const weights = isNonValueConversion ? cpaFocusWeights : defaultWeights

    const roasScore = roasRanks.get(item.name) || 0
    const cpaScore = cpaRanks.get(item.name) || 0
    const cpcScore = cpcRanks.get(item.name) || 0
    const cpmScore = cpmRanks.get(item.name) || 0

    const scores = isNonValueConversion
      ? [Math.max(cpaScore, 0.01), Math.max(cpcScore, 0.01), Math.max(cpmScore, 0.01)]
      : [Math.max(roasScore, 0.01), Math.max(cpaScore, 0.01), Math.max(cpcScore, 0.01), Math.max(cpmScore, 0.01)]
    const weightArr = isNonValueConversion
      ? [weights.CPA, weights.CPC, weights.CPM]
      : [weights.ROAS, weights.CPA, weights.CPC, weights.CPM]

    let logSum = 0
    let weightSum = 0
    for (let i = 0; i < scores.length; i++) {
      logSum += weightArr[i] * Math.log(scores[i])
      weightSum += weightArr[i]
    }
    const geoMean = Math.exp(logSum / weightSum)

    const confidence = calcConfidenceWeight(spend)

    let relativePerf: number
    if (isNonValueConversion) {
      relativePerf = cpaScore > 0 ? 1 + cpaScore : 0.5
    } else {
      const expectedROAS = getExpectedROAS(spend, baseline)
      relativePerf = expectedROAS > 0 ? actualROAS / expectedROAS : 0
    }

    const finalScore = geoMean
      * (0.5 + 0.5 * confidence)
      * Math.pow(Math.min(relativePerf, 3), 0.3)

    return {
      ...item,
      efficiencyScore: finalScore,
      confidenceWeight: confidence,
      expectedROAS: isNonValueConversion ? null : getExpectedROAS(spend, baseline),
      relativePerformance: relativePerf,
      isNonValueConversion: isNonValueConversion,
      rankScores: { roasScore, cpaScore, cpcScore, cpmScore, geoMean }
    }
  })

  return { scored, baseline }
}

function classifyCreatives(scoredData: AggregatedCreative[]): AggregatedCreative[] {
  if (scoredData.length === 0) return []

  // 효율 점수 기준 정렬 (내림차순)
  // 동일 점수일 경우 name으로 2차 정렬 (정렬 안정성 보장)
  const sorted = [...scoredData].sort((a, b) => {
    const diff = (b.efficiencyScore || 0) - (a.efficiencyScore || 0)
    if (diff !== 0) return diff
    return (a.name || '').localeCompare(b.name || '')
  })
  const total = sorted.length

  const topCutoffIdx = Math.ceil(total * EFFICIENCY_CONFIG.TOP_PERCENT)
  const bottomCutoffIdx = Math.floor(total * (1 - EFFICIENCY_CONFIG.BOTTOM_PERCENT))

  return sorted.map((item, index) => {
    let classification: string

    if (index < topCutoffIdx) {
      classification = 'high_efficiency'
    } else if (index >= bottomCutoffIdx) {
      classification = 'low_efficiency'
    } else {
      if ((item.confidenceWeight ?? 0) < EFFICIENCY_CONFIG.CONFIDENCE_THRESHOLD &&
          (item.relativePerformance ?? 0) >= EFFICIENCY_CONFIG.RELATIVE_PERF_THRESHOLD) {
        classification = 'potential'
      } else {
        classification = 'needs_attention'
      }
    }

    return { ...item, classification }
  })
}

// ========================================
// 메인 컴포넌트
// ========================================

export default function ReactView() {
  // 전역 상태
  const [allData, setAllData] = useState<RawCreativeData[]>([])
  const [imageUrlMap, setImageUrlMap] = useState<Record<string, string>>({})
  const [fallbackUrlMap, setFallbackUrlMap] = useState<Record<string, string>>({})
  const [originalUrlMap, setOriginalUrlMap] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  // 필터 상태
  const [filters, setFilters] = useState<Filters>({
    type: '',
    brand: '',
    product: '',
    promotion: '',
    campaign: '',
    adSet: '',
    startDate: '',
    endDate: '',
    searchText: ''
  })

  // KPI 필터 상태
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>({
    metric: '비용',
    operator: '>',
    value: '',
    enabled: false,
    compoundLogic: 'none',
    secondaryMetric: '비용',
    secondaryOperator: '>',
    secondaryValue: '',
    secondaryCompoundLogic: 'none',
    tertiaryMetric: '비용',
    tertiaryOperator: '>',
    tertiaryValue: '',
    advancedFilterFunction: null
  })

  // 정렬 상태
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    metric: '비용',
    order: 'desc'
  })

  // 칩 활성화 상태
  const [activeChip, setActiveChip] = useState<string | null>(null)
  const [useEfficiencyScoreSort, setUseEfficiencyScoreSort] = useState(false)
  const savedSortConfigRef = useRef<SortConfig | null>(null)

  // 접기/펼치기 상태
  const [filterExpanded, setFilterExpanded] = useState(false)

  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [currentModalData, setCurrentModalData] = useState<RawCreativeData[]>([])
  const [currentModalViewType, setCurrentModalViewType] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [isModalTableExpanded, setIsModalTableExpanded] = useState(false)
  const [modalTableSortOrder, setModalTableSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showModalDataLabels, setShowModalDataLabels] = useState(false)
  const [modalChartToggles, setModalChartToggles] = useState({
    cost: true,
    cpm: false,
    cpc: false,
    cpa: false,
    roas: true
  })

  // ========================================
  // 데이터 로드
  // ========================================

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // creative.json 로딩 (클라이언트 경로 - URL 및 성과 데이터 통합)
      const creativeResponse = await fetch(DATA_PATHS.creative + '?t=' + Date.now())
      const creativeJson = await creativeResponse.json()

      // 1. 이미지 URL 매핑 데이터 처리
      if (creativeJson.urls && creativeJson.urls.length > 0) {
        const urlData = creativeJson.urls

        const newImageUrlMap: Record<string, string> = {}
        const newFallbackUrlMap: Record<string, string> = {}
        const newOriginalUrlMap: Record<string, string> = {}

        const convertGoogleDriveUrl = (url: string): string => {
          const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^\/]+)\/view/)
          if (driveMatch) {
            return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`
          }
          return url
        }

        urlData.forEach((row: Record<string, string>) => {
          const creativeName = row['광고,에셋이름'] || row['광고']
          const url = row['url']
          const originalUrl = row['원본 url / ID'] || row['원본url/ID'] || ''
          const localImagePath = row['local_image_path'] || ''

          if (creativeName && (url || localImagePath)) {
            if (originalUrl && originalUrl !== '-' && !newOriginalUrlMap[creativeName]) {
              newOriginalUrlMap[creativeName] = originalUrl
            }

            // 로컬 이미지 경로가 있으면 최우선 사용
            if (localImagePath) {
              newImageUrlMap[creativeName] = localImagePath
              return
            }

            const isGoogleDrive = url.includes('drive.google.com')
            const isFacebookAdsImage = url.includes('facebook.com/ads/image')
            const isYoutubeThumbnail = url.includes('img.youtube.com/vi/')
            const isScontent = url.includes('scontent') || url.includes('googlesyndication')

            if (isGoogleDrive) {
              const existingUrl = newImageUrlMap[creativeName]
              if (!existingUrl || !existingUrl.includes('drive.google.com/thumbnail')) {
                if (existingUrl && !newFallbackUrlMap[creativeName]) {
                  newFallbackUrlMap[creativeName] = existingUrl
                }
                newImageUrlMap[creativeName] = convertGoogleDriveUrl(url)
              }
            } else if (isFacebookAdsImage || isYoutubeThumbnail) {
              const existingUrl = newImageUrlMap[creativeName]
              const existingIsGoogleDrive = existingUrl && existingUrl.includes('drive.google.com/thumbnail')
              if (!existingIsGoogleDrive) {
                const existingIsPrimary = existingUrl &&
                  (existingUrl.includes('facebook.com/ads/image') || existingUrl.includes('img.youtube.com/vi/'))
                if (!existingIsPrimary) {
                  if (existingUrl && (existingUrl.includes('scontent') || existingUrl.includes('googlesyndication'))) {
                    newFallbackUrlMap[creativeName] = existingUrl
                  }
                  newImageUrlMap[creativeName] = url
                }
              }
            } else if (isScontent) {
              const existingUrl = newImageUrlMap[creativeName]
              const existingIsGoogleDrive = existingUrl && existingUrl.includes('drive.google.com/thumbnail')
              const existingIsPrimary = existingUrl &&
                (existingUrl.includes('facebook.com/ads/image') || existingUrl.includes('img.youtube.com/vi/'))

              if (existingIsGoogleDrive || existingIsPrimary) {
                if (!newFallbackUrlMap[creativeName]) {
                  newFallbackUrlMap[creativeName] = url
                }
              } else if (!existingUrl) {
                newImageUrlMap[creativeName] = url
              }
            } else if (!newImageUrlMap[creativeName]) {
              newImageUrlMap[creativeName] = url
            }
          }
        })

        setImageUrlMap(newImageUrlMap)
        setFallbackUrlMap(newFallbackUrlMap)
        setOriginalUrlMap(newOriginalUrlMap)
      }

      // 2. 소재 성과 데이터 처리
      if (creativeJson.performance && creativeJson.performance.length > 0) {
        const parsedData: RawCreativeData[] = creativeJson.performance
        setAllData(parsedData)

      // 날짜 범위 설정
      const dates = parsedData
        .map((d: RawCreativeData) => d['날짜'])
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
      }

      setIsLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setIsLoading(false)
    }
  }

  // ========================================
  // 필터 옵션 계산
  // ========================================

  const typeOptions = useMemo(() => {
    return Array.from(new Set(allData.map(d => d['유형구분']))).filter(Boolean).sort()
  }, [allData])

  const updateBrandFilter = useMemo(() => {
    const filterData = allData.filter(row => {
      if (filters.type && row['유형구분'] !== filters.type) return false
      return true
    })
    return Array.from(new Set(filterData.map(d => d['브랜드명']))).filter(Boolean).sort()
  }, [allData, filters.type])

  const updateProductFilter = useMemo(() => {
    const filterData = allData.filter(row => {
      if (filters.type && row['유형구분'] !== filters.type) return false
      if (filters.brand && row['브랜드명'] !== filters.brand) return false
      return true
    })
    return Array.from(new Set(filterData.map(d => d['상품명']))).filter(Boolean).sort()
  }, [allData, filters.type, filters.brand])

  const updatePromotionFilter = useMemo(() => {
    const filterData = allData.filter(row => {
      if (filters.type && row['유형구분'] !== filters.type) return false
      if (filters.brand && row['브랜드명'] !== filters.brand) return false
      if (filters.product && row['상품명'] !== filters.product) return false
      return true
    })
    return Array.from(new Set(filterData.map(d => d['프로모션']))).filter(Boolean).sort()
  }, [allData, filters.type, filters.brand, filters.product])

  const updateCampaignFilter = useMemo(() => {
    const filterData = allData.filter(row => {
      if (filters.type && row['유형구분'] !== filters.type) return false
      if (filters.brand && row['브랜드명'] !== filters.brand) return false
      if (filters.product && row['상품명'] !== filters.product) return false
      if (filters.promotion && row['프로모션'] !== filters.promotion) return false
      return true
    })
    return Array.from(new Set(filterData.map(d => d['캠페인']))).filter(Boolean).sort()
  }, [allData, filters.type, filters.brand, filters.product, filters.promotion])

  const updateAdSetFilter = useMemo(() => {
    const filterData = allData.filter(row => {
      if (filters.type && row['유형구분'] !== filters.type) return false
      if (filters.brand && row['브랜드명'] !== filters.brand) return false
      if (filters.product && row['상품명'] !== filters.product) return false
      if (filters.promotion && row['프로모션'] !== filters.promotion) return false
      if (filters.campaign && row['캠페인'] !== filters.campaign) return false
      return true
    })
    return Array.from(new Set(filterData.map(d => d['광고세트']))).filter(Boolean).sort()
  }, [allData, filters.type, filters.brand, filters.product, filters.promotion, filters.campaign])

  // ========================================
  // 데이터 필터링 및 집계
  // ========================================

  const filterData = useMemo(() => {
    return allData.filter(row => {
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
  }, [allData, filters])

  const aggregateByCreative = useMemo(() => {
    const groups: Record<string, { name: string; 비용: number; 노출: number; 클릭: number; 전환수: number; 전환값: number }> = {}

    filterData.forEach(row => {
      const key = row['소재이름'] || '기타'

      if (!groups[key]) {
        groups[key] = { name: key, 비용: 0, 노출: 0, 클릭: 0, 전환수: 0, 전환값: 0 }
      }

      groups[key].비용 += parseFloat(row['비용']) || 0
      groups[key].노출 += parseFloat(row['노출']) || 0
      groups[key].클릭 += parseFloat(row['클릭']) || 0
      groups[key].전환수 += parseFloat(row['전환수']) || 0
      groups[key].전환값 += parseFloat(row['전환값']) || 0
    })

    // KPI 계산 후 sortConfig 기준으로 정렬 (원본 HTML과 동일)
    return Object.values(groups).map(g => ({
      ...g,
      CPM: g.노출 > 0 ? (g.비용 / g.노출 * 1000) : 0,
      CPC: g.클릭 > 0 ? (g.비용 / g.클릭) : 0,
      CPA: g.전환수 > 0 ? (g.비용 / g.전환수) : 0,
      ROAS: g.비용 > 0 ? (g.전환값 / g.비용 * 100) : 0
    })).sort((a, b) => {
      const aVal = (a as unknown as Record<string, number>)[sortConfig.metric] || 0
      const bVal = (b as unknown as Record<string, number>)[sortConfig.metric] || 0
      return sortConfig.order === 'desc' ? bVal - aVal : aVal - bVal
    })
  }, [filterData, sortConfig])

  // ========================================
  // 고급 필터 함수
  // ========================================

  const filterHighEfficiency = useCallback((data: AggregatedCreative[]): AggregatedCreative[] => {
    const { scored } = calculateEfficiencyScores(data)
    if (scored.length === 0) return []
    const classified = classifyCreatives(scored)
    const filtered = classified.filter(d => d.classification === 'high_efficiency')
    console.log(`🏆 고효율 소재: ${filtered.length}/${classified.length}개 (상위 ${(EFFICIENCY_CONFIG.TOP_PERCENT * 100).toFixed(0)}%)`)
    return filtered
  }, [])

  const filterPotential = useCallback((data: AggregatedCreative[]): AggregatedCreative[] => {
    const { scored } = calculateEfficiencyScores(data)
    if (scored.length === 0) return []
    const classified = classifyCreatives(scored)
    const filtered = classified.filter(d => d.classification === 'potential')
    console.log(`💎 가능성 있는 소재: ${filtered.length}/${classified.length}개`)
    return filtered
  }, [])

  const filterNeedsAttention = useCallback((data: AggregatedCreative[]): AggregatedCreative[] => {
    const { scored } = calculateEfficiencyScores(data)
    if (scored.length === 0) return []
    const classified = classifyCreatives(scored)
    const filtered = classified.filter(d => d.classification === 'needs_attention')
    console.log(`🔍 주의 필요 소재: ${filtered.length}/${classified.length}개`)
    return filtered
  }, [])

  const filterLowEfficiency = useCallback((data: AggregatedCreative[]): AggregatedCreative[] => {
    const { scored } = calculateEfficiencyScores(data)
    if (scored.length === 0) return []
    const classified = classifyCreatives(scored)
    const filtered = classified.filter(d => d.classification === 'low_efficiency')
    console.log(`⚠️ 저효율 소재: ${filtered.length}/${classified.length}개 (하위 ${(EFFICIENCY_CONFIG.BOTTOM_PERCENT * 100).toFixed(0)}%)`)
    return filtered
  }, [])

  // ========================================
  // 최종 크리에이티브 데이터
  // ========================================

  const creativeData = useMemo(() => {
    let data: AggregatedCreative[] = [...aggregateByCreative]

    // 고급 필터 적용
    if (kpiFilter.enabled && kpiFilter.advancedFilterFunction) {
      const filterFunctionName = kpiFilter.advancedFilterFunction
      if (filterFunctionName === 'filterHighEfficiency') {
        data = filterHighEfficiency(data)
      } else if (filterFunctionName === 'filterPotential') {
        data = filterPotential(data)
      } else if (filterFunctionName === 'filterNeedsAttention') {
        data = filterNeedsAttention(data)
      } else if (filterFunctionName === 'filterLowEfficiency') {
        data = filterLowEfficiency(data)
      }
    }
    // 일반 조건 기반 필터
    else if (kpiFilter.enabled && kpiFilter.value !== '') {
      const targetValue = parseFloat(kpiFilter.value)
      if (!isNaN(targetValue)) {
        const getMetricValue = (creative: AggregatedCreative, metric: string): number => {
          switch (metric) {
            case '비용': return creative.비용
            case '노출': return creative.노출
            case '클릭': return creative.클릭
            case '전환수': return creative.전환수
            case '전환값': return creative.전환값
            case 'CPC': return creative.CPC
            case 'CPA': return creative.CPA
            case 'ROAS': return creative.ROAS
            default: return 0
          }
        }

        const compareValues = (metricValue: number, operator: string, targetVal: number): boolean => {
          switch (operator) {
            case '>': return metricValue > targetVal
            case '<': return metricValue < targetVal
            case '>=': return metricValue >= targetVal
            case '<=': return metricValue <= targetVal
            case '=': return metricValue === targetVal
            default: return true
          }
        }

        data = data.filter(creative => {
          const metricValue = getMetricValue(creative, kpiFilter.metric)
          const primaryResult = compareValues(metricValue, kpiFilter.operator, targetValue)

          if (kpiFilter.compoundLogic === 'none') {
            return primaryResult
          }

          const secondaryTargetValue = parseFloat(kpiFilter.secondaryValue)
          let secondaryResult = true
          if (!isNaN(secondaryTargetValue) && kpiFilter.secondaryValue !== '') {
            const secondaryMetricValue = getMetricValue(creative, kpiFilter.secondaryMetric)
            secondaryResult = compareValues(secondaryMetricValue, kpiFilter.secondaryOperator, secondaryTargetValue)
          }

          let tertiaryResult = true
          let hasTertiaryCondition = false
          if (kpiFilter.secondaryCompoundLogic !== 'none') {
            const tertiaryTargetValue = parseFloat(kpiFilter.tertiaryValue)
            if (!isNaN(tertiaryTargetValue) && kpiFilter.tertiaryValue !== '') {
              hasTertiaryCondition = true
              const tertiaryMetricValue = getMetricValue(creative, kpiFilter.tertiaryMetric)
              tertiaryResult = compareValues(tertiaryMetricValue, kpiFilter.tertiaryOperator, tertiaryTargetValue)
            }
          }

          let result12: boolean
          if (kpiFilter.compoundLogic === 'or') {
            result12 = primaryResult || (kpiFilter.secondaryValue !== '' ? secondaryResult : false)
          } else if (kpiFilter.compoundLogic === 'and') {
            result12 = primaryResult && (kpiFilter.secondaryValue !== '' ? secondaryResult : true)
          } else {
            return primaryResult
          }

          if (hasTertiaryCondition) {
            if (kpiFilter.secondaryCompoundLogic === 'or') {
              return result12 || tertiaryResult
            } else if (kpiFilter.secondaryCompoundLogic === 'and') {
              return result12 && tertiaryResult
            }
          }

          return result12
        })
      }
    }

    // 소재 검색 필터 적용
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      data = data.filter(creative =>
        creative.name.toLowerCase().includes(searchLower)
      )
    }

    // 정렬 적용
    if (useEfficiencyScoreSort) {
      data = data.sort((a, b) => (b.efficiencyScore || 0) - (a.efficiencyScore || 0))
    } else {
      data = data.sort((a, b) => {
        const aVal = (a as unknown as Record<string, number>)[sortConfig.metric] || 0
        const bVal = (b as unknown as Record<string, number>)[sortConfig.metric] || 0
        return sortConfig.order === 'desc' ? bVal - aVal : aVal - bVal
      })
    }

    return data
  }, [aggregateByCreative, kpiFilter, filters.searchText, sortConfig, useEfficiencyScoreSort, filterHighEfficiency, filterPotential, filterNeedsAttention, filterLowEfficiency])

  // ========================================
  // 요약 계산
  // ========================================

  const summary = useMemo(() => {
    const totals = creativeData.reduce((acc, row) => {
      acc.비용 += row.비용
      acc.노출 += row.노출
      acc.클릭 += row.클릭
      acc.전환수 += row.전환수
      acc.전환값 += row.전환값
      return acc
    }, { 비용: 0, 노출: 0, 클릭: 0, 전환수: 0, 전환값: 0 })

    return {
      totalCost: totals.비용,
      avgCPM: totals.노출 > 0 ? (totals.비용 / totals.노출 * 1000) : 0,
      avgCPC: totals.클릭 > 0 ? (totals.비용 / totals.클릭) : 0,
      avgCPA: totals.전환수 > 0 ? (totals.비용 / totals.전환수) : 0,
      avgROAS: totals.비용 > 0 ? (totals.전환값 / totals.비용 * 100) : 0
    }
  }, [creativeData])

  // ========================================
  // 이벤트 핸들러
  // ========================================

  const handleFilterChange = useCallback((field: keyof Filters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value }
      // 계층적 필터 초기화
      if (field === 'type') {
        newFilters.brand = ''
        newFilters.product = ''
        newFilters.promotion = ''
        newFilters.campaign = ''
        newFilters.adSet = ''
      } else if (field === 'brand') {
        newFilters.product = ''
        newFilters.promotion = ''
        newFilters.campaign = ''
        newFilters.adSet = ''
      } else if (field === 'product') {
        newFilters.promotion = ''
        newFilters.campaign = ''
        newFilters.adSet = ''
      } else if (field === 'promotion') {
        newFilters.campaign = ''
        newFilters.adSet = ''
      } else if (field === 'campaign') {
        newFilters.adSet = ''
      }
      return newFilters
    })
  }, [])

  const resetBasicFilters = useCallback(() => {
    const dates = allData
      .map(d => d['날짜'])
      .filter(Boolean)
      .map(d => new Date(d))
      .filter(d => !isNaN(d.getTime()))

    const minDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date()
    const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date()

    setFilters(prev => ({
      ...prev,
      type: '',
      brand: '',
      product: '',
      promotion: '',
      startDate: formatDateForInput(minDate),
      endDate: formatDateForInput(maxDate)
    }))
  }, [allData])

  const resetDetailFilters = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      campaign: '',
      adSet: '',
      searchText: ''
    }))
  }, [])

  const resetKpiFilter = useCallback(() => {
    setKpiFilter({
      metric: '비용',
      operator: '>',
      value: '',
      enabled: false,
      compoundLogic: 'none',
      secondaryMetric: '비용',
      secondaryOperator: '>',
      secondaryValue: '',
      secondaryCompoundLogic: 'none',
      tertiaryMetric: '비용',
      tertiaryOperator: '>',
      tertiaryValue: '',
      advancedFilterFunction: null
    })
  }, [])

  const clearEfficiencyChips = useCallback(() => {
    setActiveChip(null)
    setUseEfficiencyScoreSort(false)
    if (savedSortConfigRef.current) {
      setSortConfig(savedSortConfigRef.current)
      savedSortConfigRef.current = null
    }
  }, [])

  const handleChipClick = useCallback((filterKey: string) => {
    const isActive = activeChip === filterKey

    if (isActive) {
      // 비활성화
      setActiveChip(null)
      resetKpiFilter()
      setUseEfficiencyScoreSort(false)
      if (savedSortConfigRef.current) {
        setSortConfig(savedSortConfigRef.current)
        savedSortConfigRef.current = null
      }
    } else {
      // 활성화
      setActiveChip(filterKey)
      const preset = KPI_PRESETS[filterKey]

      if (preset && preset.isAdvancedFilter && preset.filterFunction) {
        // 원본과 동일하게 필터 초기화 후 설정
        if (!savedSortConfigRef.current) {
          savedSortConfigRef.current = { ...sortConfig }
        }
        setUseEfficiencyScoreSort(true)
        setKpiFilter({
          metric: '비용',
          operator: '>',
          value: '',
          enabled: true,
          compoundLogic: 'none',
          secondaryMetric: '비용',
          secondaryOperator: '>',
          secondaryValue: '',
          secondaryCompoundLogic: 'none',
          tertiaryMetric: '비용',
          tertiaryOperator: '>',
          tertiaryValue: '',
          advancedFilterFunction: preset.filterFunction || null
        })
      }
    }
  }, [activeChip, sortConfig])

  const handleKpiFilterToggle = useCallback(() => {
    if (kpiFilter.enabled) {
      // OFF
      clearEfficiencyChips()
      resetKpiFilter()
    } else {
      // ON
      setKpiFilter(prev => ({ ...prev, enabled: true }))
    }
  }, [kpiFilter.enabled, clearEfficiencyChips, resetKpiFilter])

  const handleKpiValueChange = useCallback((value: string) => {
    const formatted = formatNumberInput(value)
    const parsed = parseFormattedNumber(formatted)

    clearEfficiencyChips()

    setKpiFilter(prev => ({
      ...prev,
      value: parsed,
      enabled: formatted.trim() !== '' ? true : prev.enabled
    }))
  }, [clearEfficiencyChips])

  // ========================================
  // 모달 관련
  // ========================================

  const showCreativeDetail = useCallback((creativeName: string) => {
    const creativeRawData = filterData.filter(row => row['소재이름'] === creativeName)

    if (creativeRawData.length === 0) {
      alert('해당 소재의 데이터가 없습니다.')
      return
    }

    setCurrentModalData(creativeRawData)
    setCurrentModalViewType('daily')
    setIsModalTableExpanded(false)
    setModalTableSortOrder('desc')
    setModalTitle(creativeName)
    setModalOpen(true)
  }, [filterData])

  const modalAggregatedData = useMemo((): ModalAggregatedData[] => {
    const groups: Record<string, { 비용: number; 노출: number; 클릭: number; 전환수: number; 전환값: number }> = {}

    currentModalData.forEach(row => {
      let key: string
      const date = new Date(row['날짜'])

      if (currentModalViewType === 'daily') {
        key = row['날짜']
      } else if (currentModalViewType === 'weekly') {
        const day = date.getDay()
        const diff = date.getDate() - day + (day === 0 ? -6 : 1)
        const monday = new Date(date)
        monday.setDate(diff)
        key = formatDateForInput(monday)
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }

      if (!groups[key]) {
        groups[key] = { 비용: 0, 노출: 0, 클릭: 0, 전환수: 0, 전환값: 0 }
      }

      groups[key].비용 += parseFloat(row['비용']) || 0
      groups[key].노출 += parseFloat(row['노출']) || 0
      groups[key].클릭 += parseFloat(row['클릭']) || 0
      groups[key].전환수 += parseFloat(row['전환수']) || 0
      groups[key].전환값 += parseFloat(row['전환값']) || 0
    })

    return Object.entries(groups)
      .map(([period, values]) => ({
        period,
        ...values,
        CPM: values.노출 > 0 ? (values.비용 / values.노출 * 1000) : 0,
        CTR: values.노출 > 0 ? (values.클릭 / values.노출 * 100) : 0,
        CPC: values.클릭 > 0 ? (values.비용 / values.클릭) : 0,
        CPA: values.전환수 > 0 ? (values.비용 / values.전환수) : 0,
        ROAS: values.비용 > 0 ? (values.전환값 / values.비용 * 100) : 0
      }))
      .sort((a, b) => modalTableSortOrder === 'desc'
        ? b.period.localeCompare(a.period)
        : a.period.localeCompare(b.period))
  }, [currentModalData, currentModalViewType, modalTableSortOrder])

  const modalKpis = useMemo(() => {
    const totals = currentModalData.reduce((acc, row) => {
      acc.비용 += parseFloat(row['비용']) || 0
      acc.노출 += parseFloat(row['노출']) || 0
      acc.클릭 += parseFloat(row['클릭']) || 0
      acc.전환수 += parseFloat(row['전환수']) || 0
      acc.전환값 += parseFloat(row['전환값']) || 0
      return acc
    }, { 비용: 0, 노출: 0, 클릭: 0, 전환수: 0, 전환값: 0 })

    return {
      비용: totals.비용,
      노출: totals.노출,
      클릭: totals.클릭,
      전환수: totals.전환수,
      전환값: totals.전환값,
      CPC: totals.클릭 > 0 ? (totals.비용 / totals.클릭) : 0,
      CPA: totals.전환수 > 0 ? (totals.비용 / totals.전환수) : 0,
      ROAS: totals.비용 > 0 ? (totals.전환값 / totals.비용 * 100) : 0
    }
  }, [currentModalData])

  const formatPeriodLabel = useCallback((period: string, viewType: string): string => {
    if (viewType === 'monthly') {
      const [year, month] = period.split('-')
      return `${year}년 ${parseInt(month)}월`
    } else if (viewType === 'weekly') {
      const date = new Date(period)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 6)
      return `${date.getMonth() + 1}/${date.getDate()} ~ ${endDate.getMonth() + 1}/${endDate.getDate()}`
    } else {
      const date = new Date(period)
      return `${date.getMonth() + 1}/${date.getDate()}`
    }
  }, [])

  // 모달 차트 데이터
  const modalChartData = useMemo(() => {
    const sortedData = [...modalAggregatedData].sort((a, b) => a.period.localeCompare(b.period))
    const labels = sortedData.map(d => formatPeriodLabel(d.period, currentModalViewType))

    const datasets: Array<{
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
      yAxisID: string
      tension: number
      fill: boolean
    }> = []

    const showCost = modalChartToggles.cost
    const showCPM = modalChartToggles.cpm
    const showCPC = modalChartToggles.cpc
    const showCPA = modalChartToggles.cpa
    const showROAS = modalChartToggles.roas

    if (showCost) {
      datasets.push({
        label: '비용',
        data: sortedData.map(d => d.비용),
        borderColor: '#673ab7',
        backgroundColor: 'rgba(103, 58, 183, 0.1)',
        yAxisID: 'y',
        tension: 0.3,
        fill: true
      })
    }

    if (showCPM) {
      datasets.push({
        label: 'CPM',
        data: sortedData.map(d => d.CPM),
        borderColor: '#9c27b0',
        backgroundColor: 'rgba(156, 39, 176, 0.1)',
        yAxisID: showCost ? 'y1' : 'y',
        tension: 0.3,
        fill: false
      })
    }

    if (showCPC) {
      datasets.push({
        label: 'CPC',
        data: sortedData.map(d => d.CPC),
        borderColor: '#2196f3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        yAxisID: (showCost || showCPM) ? 'y1' : 'y',
        tension: 0.3,
        fill: false
      })
    }

    if (showCPA) {
      datasets.push({
        label: 'CPA',
        data: sortedData.map(d => d.CPA),
        borderColor: '#ff9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        yAxisID: (showCost || showCPM || showCPC) ? 'y1' : 'y',
        tension: 0.3,
        fill: false
      })
    }

    if (showROAS) {
      datasets.push({
        label: 'ROAS',
        data: sortedData.map(d => d.ROAS),
        borderColor: '#00c853',
        backgroundColor: 'rgba(0, 200, 83, 0.1)',
        yAxisID: (showCost || showCPM || showCPC || showCPA) ? 'y1' : 'y',
        tension: 0.3,
        fill: false
      })
    }

    return { labels, datasets }
  }, [modalAggregatedData, modalChartToggles, currentModalViewType, formatPeriodLabel])

  const modalChartOptions = useMemo(() => {
    const showCost = modalChartToggles.cost
    const showCPM = modalChartToggles.cpm
    const showCPC = modalChartToggles.cpc
    const showCPA = modalChartToggles.cpa
    const showROAS = modalChartToggles.roas
    const selectedCount = (showCost ? 1 : 0) + (showCPM ? 1 : 0) + (showCPC ? 1 : 0) + (showCPA ? 1 : 0) + (showROAS ? 1 : 0)
    const useRightAxis = selectedCount >= 2

    let leftAxisTitle = '금액 (원)'
    if (showCost) leftAxisTitle = '비용 (원)'
    else if (showCPM) leftAxisTitle = 'CPM (원)'
    else if (showCPC) leftAxisTitle = 'CPC (원)'
    else if (showCPA) leftAxisTitle = 'CPA (원)'
    else if (showROAS) leftAxisTitle = 'ROAS (%)'

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top' as const
        },
        tooltip: {
          callbacks: {
            label: function(context: { dataset: { label?: string }; parsed: { y: number | null } }) {
              let label = context.dataset.label || ''
              if (label) {
                label += ': '
              }
              const yVal = context.parsed.y ?? 0
              if (context.dataset.label === 'ROAS') {
                label += Math.round(yVal) + '%'
              } else {
                label += formatNumber(yVal) + '원'
              }
              return label
            }
          }
        },
        datalabels: {
          display: showModalDataLabels,
          anchor: 'end' as const,
          align: 'top' as const,
          offset: 4,
          font: {
            family: "'Inter', sans-serif",
            size: 11,
            weight: 600
          },
          color: function(context: { dataset: { borderColor?: string; backgroundColor?: string } }) {
            return context.dataset.borderColor || context.dataset.backgroundColor || '#000'
          },
          formatter: function(value: number, context: { dataset: { label?: string } }) {
            if (context.dataset.label === 'ROAS') {
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
          }
        },
        y: {
          type: 'linear' as const,
          display: true,
          position: 'left' as const,
          title: {
            display: true,
            text: leftAxisTitle
          },
          ticks: {
            callback: function(value: number | string) {
              if (!showCost && !showCPM && !showCPC && !showCPA && showROAS) {
                return value + '%'
              }
              return formatNumber(Number(value))
            }
          }
        },
        y1: {
          type: 'linear' as const,
          display: useRightAxis,
          position: 'right' as const,
          grid: {
            drawOnChartArea: false
          },
          ticks: {
            callback: function(value: number | string) {
              const hasRightROAS = (showCost || showCPM || showCPC || showCPA) && showROAS
              const hasRightCPM = showCost && showCPM
              const hasRightCPC = (showCost || showCPM) && showCPC
              const hasRightCPA = (showCost || showCPM || showCPC) && showCPA

              if (hasRightROAS && !hasRightCPM && !hasRightCPC && !hasRightCPA) {
                return value + '%'
              }
              return formatNumber(Number(value))
            }
          }
        }
      }
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, [modalChartToggles, showModalDataLabels]) as any

  // ========================================
  // 칩 호버 툴팁
  // ========================================

  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [tooltipData, setTooltipData] = useState<{
    title: string
    icon: string
    type: string
    criteria: string
    action: string
    actionType: string
    actionDetail: string
  } | null>(null)

  const handleChipMouseEnter = useCallback((e: React.MouseEvent, chip: HTMLElement) => {
    const title = chip.dataset.tooltipTitle || ''
    const icon = chip.dataset.tooltipIcon || '💡'
    const type = chip.dataset.tooltipType || ''
    const criteria = chip.dataset.tooltipCriteria || ''
    const action = chip.dataset.tooltipAction || ''
    const actionType = chip.dataset.tooltipActionType || 'info'
    const actionDetail = chip.dataset.tooltipActionDetail || ''

    setTooltipData({ title, icon, type, criteria, action, actionType, actionDetail })
    setTooltipPosition({ x: e.clientX + 15, y: e.clientY + 15 })
    setTooltipVisible(true)
  }, [])

  const handleChipMouseMove = useCallback((e: React.MouseEvent) => {
    const padding = 15
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const tooltipWidth = 320
    const tooltipHeight = 200

    let left = e.clientX + padding
    let top = e.clientY + padding

    if (left + tooltipWidth > viewportWidth - padding) {
      left = e.clientX - tooltipWidth - padding
    }
    if (top + tooltipHeight > viewportHeight - padding) {
      top = e.clientY - tooltipHeight - padding
    }
    if (left < padding) left = padding
    if (top < padding) top = padding

    setTooltipPosition({ x: left, y: top })
  }, [])

  const handleChipMouseLeave = useCallback(() => {
    setTooltipVisible(false)
    setTooltipData(null)
  }, [])

  // ========================================
  // 렌더링
  // ========================================

  if (isLoading) {
    return (
      <div className="loading">데이터를 불러오는 중...</div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 헤더 */}
      <div className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#212121', margin: 0 }}>광고 소재별 분석</h1>
          <div style={{ fontSize: '14px', color: '#9e9e9e', marginTop: '4px' }}>광고 소재(이미지/영상)별 성과 분석</div>
        </div>
      </div>

      {/* 필터 설정 (접기/펼치기) */}
      <div className="collapsible-section">
        <div
          className="collapsible-header"
          onClick={() => setFilterExpanded(!filterExpanded)}
        >
          <div className="collapsible-title">
            필터 설정 <span className="collapsible-guide">* 펼쳐서 세부 성과를 필터링할 수 있어요</span>
          </div>
          <button className="collapsible-toggle">
            <span>{filterExpanded ? '접기' : '펼치기'}</span>
            <span className={`collapsible-toggle-icon ${filterExpanded ? '' : 'collapsed'}`}>▼</span>
          </button>
        </div>
        <div className={`collapsible-content ${filterExpanded ? 'expanded' : ''}`}>
          {/* 기간 선택 + 기본 필터 */}
          <div className="filter-section card" style={{ marginBottom: '16px' }}>
            <div className="filter-section-header">
              <div className="filter-header">기간 및 기본 필터</div>
              <button className="reset-btn" onClick={resetBasicFilters}>초기화</button>
            </div>
            <div className="filter-inline-container">
              {/* 기간 선택 */}
              <div className="filter-date-section">
                <div className="filter-label">기간 선택</div>
                <div className="date-range">
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                  <span>~</span>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
              </div>
              {/* 기본 필터 */}
              <div className="filter-setting-section">
                <div className="filter-label">기본 필터</div>
                <div className="filter-items">
                  <div className="filter-group">
                    <label>유형구분</label>
                    <select
                      value={filters.type}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                    >
                      <option value="">전체</option>
                      {typeOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>브랜드명</label>
                    <select
                      value={filters.brand}
                      onChange={(e) => handleFilterChange('brand', e.target.value)}
                    >
                      <option value="">전체</option>
                      {updateBrandFilter.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>상품명</label>
                    <select
                      value={filters.product}
                      onChange={(e) => handleFilterChange('product', e.target.value)}
                    >
                      <option value="">전체</option>
                      {updateProductFilter.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>프로모션</label>
                    <select
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
          <div className="filter-section card">
            <div className="filter-section-header">
              <div className="filter-header">세부 필터</div>
              <button className="reset-btn" onClick={resetDetailFilters}>초기화</button>
            </div>
            <div className="filter-row">
              <div className="filter-group">
                <label>캠페인</label>
                <select
                  value={filters.campaign}
                  onChange={(e) => handleFilterChange('campaign', e.target.value)}
                >
                  <option value="">전체</option>
                  {updateCampaignFilter.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>광고세트</label>
                <select
                  value={filters.adSet}
                  onChange={(e) => handleFilterChange('adSet', e.target.value)}
                >
                  <option value="">전체</option>
                  {updateAdSetFilter.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="filter-row">
              <div className="filter-group">
                <label>소재 검색</label>
                <input
                  type="text"
                  placeholder="소재이름 검색..."
                  value={filters.searchText}
                  onChange={(e) => handleFilterChange('searchText', e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI 기준 필터 + 정렬 설정 통합 */}
      <div className="filter-section card">
        <div className="unified-filter-container">
          {/* 왼쪽: KPI 기준 필터 */}
          <div className="unified-filter-left">
            <div className="unified-filter-title">
              KPI 기준 필터
              <button
                type="button"
                className={`kpi-filter-toggle ${kpiFilter.enabled ? 'active' : ''}`}
                style={{ marginLeft: '12px', width: 'auto', padding: '4px 10px', fontSize: '11px' }}
                onClick={handleKpiFilterToggle}
              >
                <span className="toggle-status">{kpiFilter.enabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>
            {/* 4분류 효율 필터 칩 */}
            <div className="efficiency-chip-section" style={{ marginBottom: '16px' }}>
              <div className="chip-container">
                {['high_efficiency', 'potential', 'needs_attention', 'low_efficiency'].map(filterKey => {
                  const chipConfig: Record<string, { icon: string; label: string; type: string; criteria: string; action: string; actionType: string; actionDetail: string }> = {
                    'high_efficiency': {
                      icon: '🏆',
                      label: '고효율 소재',
                      type: 'high-efficiency',
                      criteria: '효율 점수 상위 20%에 해당하는 소재입니다.<br>• ROAS, CPA, CPC, CPM 순위 종합<br>• 비용 대비 신뢰도 가중 적용',
                      action: '예산 확대 검토',
                      actionType: 'positive',
                      actionDetail: '검증된 고성과 소재입니다. 예산을 증액하면 매출 상승이 기대됩니다.'
                    },
                    'potential': {
                      icon: '💎',
                      label: '가능성 있는 소재',
                      type: 'potential',
                      criteria: '중간 60% 중 신뢰도↓ 성과↑ 소재입니다.<br>• 비용이 적지만 기대 ROAS 이상<br>• 신뢰도 < 50% (약 39만원 미만)',
                      action: '테스트 확대 추천',
                      actionType: 'info',
                      actionDetail: '데이터가 부족하지만 성과가 좋습니다. 예산을 늘려 검증해보세요.'
                    },
                    'needs_attention': {
                      icon: '🔍',
                      label: '주의 필요 소재',
                      type: 'needs-attention',
                      criteria: '중간 60% 중 판단 유보 소재입니다.<br>• 신뢰도↑ 또는 성과↓<br>• 추가 데이터 수집 필요',
                      action: '추가 관찰 필요',
                      actionType: 'warning',
                      actionDetail: '현재 상태로는 판단이 어렵습니다. 추이를 지켜보며 결정하세요.'
                    },
                    'low_efficiency': {
                      icon: '⚠️',
                      label: '저효율 소재',
                      type: 'low-efficiency',
                      criteria: '효율 점수 하위 20%에 해당하는 소재입니다.<br>• ROAS, CPA, CPC, CPM 모두 저조<br>• 개선이 시급한 소재',
                      action: '예산 축소 검토',
                      actionType: 'negative',
                      actionDetail: '광고비 대비 성과가 낮습니다. 예산을 줄이거나 소재를 교체하세요.'
                    }
                  }
                  const config = chipConfig[filterKey]
                  return (
                    <button
                      key={filterKey}
                      type="button"
                      className={`preset-chip ${activeChip === filterKey ? 'active' : ''}`}
                      data-filter={filterKey}
                      data-tooltip-title={config.label}
                      data-tooltip-icon={config.icon}
                      data-tooltip-type={config.type}
                      data-tooltip-criteria={config.criteria}
                      data-tooltip-action={config.action}
                      data-tooltip-action-type={config.actionType}
                      data-tooltip-action-detail={config.actionDetail}
                      onClick={() => handleChipClick(filterKey)}
                      onMouseEnter={(e) => handleChipMouseEnter(e, e.currentTarget)}
                      onMouseMove={handleChipMouseMove}
                      onMouseLeave={handleChipMouseLeave}
                    >
                      <span className="chip-icon">{config.icon}</span>{config.label}
                    </button>
                  )
                })}
              </div>
              {activeChip && KPI_PRESETS[activeChip] && (
                <div className="kpi-preset-description" style={{ display: 'flex', marginTop: '8px' }}>
                  {KPI_PRESETS[activeChip].description}
                </div>
              )}
            </div>
            {/* 직접 입력 영역 */}
            {!activeChip && (
              <div className="unified-filter-content" style={{ marginBottom: 0 }}>
                <div className="filter-group" style={{ flex: '0 0 100px' }}>
                  <label>KPI 기준</label>
                  <select
                    value={kpiFilter.metric}
                    onChange={(e) => {
                      clearEfficiencyChips()
                      setKpiFilter(prev => ({ ...prev, metric: e.target.value }))
                    }}
                  >
                    <option value="비용">비용</option>
                    <option value="노출">노출</option>
                    <option value="클릭">클릭</option>
                    <option value="전환수">전환수</option>
                    <option value="전환값">전환값</option>
                    <option value="CPC">CPC</option>
                    <option value="CPA">CPA</option>
                    <option value="ROAS">ROAS</option>
                  </select>
                </div>
                <div className="filter-group" style={{ flex: '0 0 100px' }}>
                  <label>조건</label>
                  <select
                    value={kpiFilter.operator}
                    onChange={(e) => {
                      clearEfficiencyChips()
                      setKpiFilter(prev => ({ ...prev, operator: e.target.value }))
                    }}
                  >
                    <option value=">">&gt; (보다 큼)</option>
                    <option value="<">&lt; (보다 작음)</option>
                    <option value=">=">&gt;= (크거나 같음)</option>
                    <option value="<=">&lt;= (작거나 같음)</option>
                    <option value="=">=  (같음)</option>
                  </select>
                </div>
                <div className="filter-group" style={{ flex: '0 0 100px' }}>
                  <label>기준값</label>
                  <input
                    type="text"
                    placeholder="수치 입력"
                    className="formatted-number"
                    value={formatNumberInput(kpiFilter.value)}
                    onChange={(e) => handleKpiValueChange(e.target.value)}
                  />
                </div>
                <div className="filter-group" style={{ flex: '0 0 140px' }}>
                  <label>조합 조건</label>
                  <div className="compound-radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="compoundLogic"
                        value="none"
                        checked={kpiFilter.compoundLogic === 'none'}
                        onChange={(e) => {
                          clearEfficiencyChips()
                          setKpiFilter(prev => ({ ...prev, compoundLogic: e.target.value }))
                        }}
                      />
                      <span>없음</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="compoundLogic"
                        value="or"
                        checked={kpiFilter.compoundLogic === 'or'}
                        onChange={(e) => {
                          clearEfficiencyChips()
                          setKpiFilter(prev => ({ ...prev, compoundLogic: e.target.value }))
                        }}
                      />
                      <span>또는</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="compoundLogic"
                        value="and"
                        checked={kpiFilter.compoundLogic === 'and'}
                        onChange={(e) => {
                          clearEfficiencyChips()
                          setKpiFilter(prev => ({ ...prev, compoundLogic: e.target.value }))
                        }}
                      />
                      <span>그리고</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            {/* 보조 필터 행 (OR/AND 선택시 표시) */}
            {kpiFilter.compoundLogic !== 'none' && !activeChip && (
              <div className="filter-row secondary-filter-row" style={{ alignItems: 'flex-end', marginTop: '12px' }}>
                <div className="filter-group" style={{ flex: '0 0 100px' }}>
                  <label>KPI 기준</label>
                  <select
                    value={kpiFilter.secondaryMetric}
                    onChange={(e) => {
                      clearEfficiencyChips()
                      setKpiFilter(prev => ({ ...prev, secondaryMetric: e.target.value }))
                    }}
                  >
                    <option value="비용">비용</option>
                    <option value="노출">노출</option>
                    <option value="클릭">클릭</option>
                    <option value="전환수">전환수</option>
                    <option value="전환값">전환값</option>
                    <option value="CPC">CPC</option>
                    <option value="CPA">CPA</option>
                    <option value="ROAS">ROAS</option>
                  </select>
                </div>
                <div className="filter-group" style={{ flex: '0 0 100px' }}>
                  <label>조건</label>
                  <select
                    value={kpiFilter.secondaryOperator}
                    onChange={(e) => {
                      clearEfficiencyChips()
                      setKpiFilter(prev => ({ ...prev, secondaryOperator: e.target.value }))
                    }}
                  >
                    <option value=">">&gt; (보다 큼)</option>
                    <option value="<">&lt; (보다 작음)</option>
                    <option value=">=">&gt;= (크거나 같음)</option>
                    <option value="<=">&lt;= (작거나 같음)</option>
                    <option value="=">=  (같음)</option>
                  </select>
                </div>
                <div className="filter-group" style={{ flex: '0 0 100px' }}>
                  <label>기준값</label>
                  <input
                    type="text"
                    placeholder="수치 입력"
                    className="formatted-number"
                    value={formatNumberInput(kpiFilter.secondaryValue)}
                    onChange={(e) => {
                      clearEfficiencyChips()
                      const formatted = formatNumberInput(e.target.value)
                      setKpiFilter(prev => ({ ...prev, secondaryValue: parseFormattedNumber(formatted) }))
                    }}
                  />
                </div>
                <div className="filter-group" style={{ flex: '0 0 140px' }}>
                  <label>조합 조건</label>
                  <div className="compound-radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="compoundLogicSecondary"
                        value="none"
                        checked={kpiFilter.secondaryCompoundLogic === 'none'}
                        onChange={(e) => {
                          clearEfficiencyChips()
                          setKpiFilter(prev => ({ ...prev, secondaryCompoundLogic: e.target.value }))
                        }}
                      />
                      <span>없음</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="compoundLogicSecondary"
                        value="or"
                        checked={kpiFilter.secondaryCompoundLogic === 'or'}
                        onChange={(e) => {
                          clearEfficiencyChips()
                          setKpiFilter(prev => ({ ...prev, secondaryCompoundLogic: e.target.value }))
                        }}
                      />
                      <span>또는</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="compoundLogicSecondary"
                        value="and"
                        checked={kpiFilter.secondaryCompoundLogic === 'and'}
                        onChange={(e) => {
                          clearEfficiencyChips()
                          setKpiFilter(prev => ({ ...prev, secondaryCompoundLogic: e.target.value }))
                        }}
                      />
                      <span>그리고</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            {/* 3차 필터 행 */}
            {kpiFilter.compoundLogic !== 'none' && kpiFilter.secondaryCompoundLogic !== 'none' && !activeChip && (
              <div className="filter-row tertiary-filter-row" style={{ alignItems: 'flex-end', marginTop: '12px' }}>
                <div className="filter-group" style={{ flex: '0 0 100px' }}>
                  <label>KPI 기준</label>
                  <select
                    value={kpiFilter.tertiaryMetric}
                    onChange={(e) => {
                      clearEfficiencyChips()
                      setKpiFilter(prev => ({ ...prev, tertiaryMetric: e.target.value }))
                    }}
                  >
                    <option value="비용">비용</option>
                    <option value="노출">노출</option>
                    <option value="클릭">클릭</option>
                    <option value="전환수">전환수</option>
                    <option value="전환값">전환값</option>
                    <option value="CPC">CPC</option>
                    <option value="CPA">CPA</option>
                    <option value="ROAS">ROAS</option>
                  </select>
                </div>
                <div className="filter-group" style={{ flex: '0 0 100px' }}>
                  <label>조건</label>
                  <select
                    value={kpiFilter.tertiaryOperator}
                    onChange={(e) => {
                      clearEfficiencyChips()
                      setKpiFilter(prev => ({ ...prev, tertiaryOperator: e.target.value }))
                    }}
                  >
                    <option value=">">&gt; (보다 큼)</option>
                    <option value="<">&lt; (보다 작음)</option>
                    <option value=">=">&gt;= (크거나 같음)</option>
                    <option value="<=">&lt;= (작거나 같음)</option>
                    <option value="=">=  (같음)</option>
                  </select>
                </div>
                <div className="filter-group" style={{ flex: '0 0 100px' }}>
                  <label>기준값</label>
                  <input
                    type="text"
                    placeholder="수치 입력"
                    className="formatted-number"
                    value={formatNumberInput(kpiFilter.tertiaryValue)}
                    onChange={(e) => {
                      clearEfficiencyChips()
                      const formatted = formatNumberInput(e.target.value)
                      setKpiFilter(prev => ({ ...prev, tertiaryValue: parseFormattedNumber(formatted) }))
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽: 정렬 설정 */}
          <div className="unified-filter-right">
            <div className="unified-filter-title">정렬 설정</div>
            <div className="unified-filter-content">
              <div className="filter-group" style={{ flex: '0 0 100px' }}>
                <label>정렬 기준</label>
                <select
                  value={useEfficiencyScoreSort ? '-' : sortConfig.metric}
                  onChange={(e) => {
                    if (e.target.value !== '-') {
                      setUseEfficiencyScoreSort(false)
                      setSortConfig(prev => ({ ...prev, metric: e.target.value }))
                    }
                  }}
                >
                  <option value="-" disabled>-</option>
                  <option value="비용">비용</option>
                  <option value="노출">노출</option>
                  <option value="클릭">클릭</option>
                  <option value="전환수">전환수</option>
                  <option value="전환값">전환값</option>
                  <option value="CPC">CPC</option>
                  <option value="CPA">CPA</option>
                  <option value="ROAS">ROAS</option>
                </select>
              </div>
              <div className="filter-group" style={{ flex: '0 0 auto' }}>
                <label>정렬 순서</label>
                <div className="sort-radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="sortOrder"
                      value="desc"
                      checked={sortConfig.order === 'desc'}
                      onChange={(e) => setSortConfig(prev => ({ ...prev, order: e.target.value as 'asc' | 'desc' }))}
                    />
                    <span>내림차순</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="sortOrder"
                      value="asc"
                      checked={sortConfig.order === 'asc'}
                      onChange={(e) => setSortConfig(prev => ({ ...prev, order: e.target.value as 'asc' | 'desc' }))}
                    />
                    <span>오름차순</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 요약 섹션 */}
      <div className="summary-section">
        <div className="summary-grid">
          <div className="summary-card card">
            <h3>총 비용</h3>
            <div className="value">{formatNumber(summary.totalCost)}</div>
            <div className="unit">원</div>
          </div>
          <div className="summary-card card">
            <h3>평균 CPM</h3>
            <div className="value">{formatNumber(summary.avgCPM)}</div>
            <div className="unit">원</div>
          </div>
          <div className="summary-card card">
            <h3>평균 CPC</h3>
            <div className="value">{formatNumber(summary.avgCPC)}</div>
            <div className="unit">원</div>
          </div>
          <div className="summary-card card">
            <h3>평균 CPA</h3>
            <div className="value">{formatNumber(summary.avgCPA)}</div>
            <div className="unit">원</div>
          </div>
          <div className="summary-card card">
            <h3>평균 ROAS</h3>
            <div className="value">{formatROAS(summary.avgROAS)}</div>
            <div className="unit"></div>
          </div>
        </div>
      </div>

      {/* 소재 그리드 */}
      <div className="creative-grid">
        {creativeData.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <svg viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
            <h3>소재 데이터가 없습니다</h3>
            <p>필터 조건을 변경해 주세요</p>
          </div>
        ) : (
          creativeData.map(creative => {
            const imageUrl = imageUrlMap[creative.name]
            const fallbackUrl = fallbackUrlMap[creative.name]
            const originalUrl = originalUrlMap[creative.name]
            const hasLink = originalUrl || imageUrl
            const linkUrl = originalUrl || imageUrl || '#'

            return (
              <div key={creative.name} className="creative-card card">
                {hasLink ? (
                  <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="creative-image-link" title="원본 보기">
                    <div className="creative-image-wrapper">
                      {imageUrl ? (
                        <>
                          <img
                            src={imageUrl}
                            alt={creative.name}
                            className="creative-image"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              if (!target.dataset.tried && fallbackUrl) {
                                target.dataset.tried = '1'
                                target.src = fallbackUrl
                              } else {
                                target.style.display = 'none'
                                const placeholder = target.nextElementSibling as HTMLElement
                                if (placeholder) placeholder.style.display = 'block'
                              }
                            }}
                          />
                          <div className="creative-placeholder" style={{ display: 'none' }}>
                            <svg viewBox="0 0 24 24">
                              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                            </svg>
                            <div>이미지 로드 실패</div>
                          </div>
                        </>
                      ) : (
                        <div className="creative-placeholder">
                          <svg viewBox="0 0 24 24">
                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                          </svg>
                          <div>이미지 없음</div>
                        </div>
                      )}
                    </div>
                  </a>
                ) : (
                  <div className="creative-image-wrapper">
                    <div className="creative-placeholder">
                      <svg viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                      <div>이미지 없음</div>
                    </div>
                  </div>
                )}
                <div className="creative-info">
                  <div
                    className="creative-name clickable"
                    title={creative.name}
                    onClick={() => showCreativeDetail(creative.name)}
                  >
                    {creative.name}
                  </div>
                  <div className="creative-metrics">
                    <div className="creative-metric">
                      <span className="metric-label">비용</span>
                      <span className="metric-value">{formatNumber(creative.비용)}</span>
                    </div>
                    <div className="creative-metric">
                      <span className="metric-label">CPC</span>
                      <span className="metric-value">{formatNumber(creative.CPC)}</span>
                    </div>
                    <div className="creative-metric">
                      <span className="metric-label">CPA</span>
                      <span className="metric-value">{formatNumber(creative.CPA)}</span>
                    </div>
                    <div className="creative-metric">
                      <span className="metric-label">ROAS</span>
                      <span className={`metric-value ${creative.ROAS >= 100 ? 'positive' : 'negative'}`}>
                        {formatROAS(creative.ROAS)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 세부 성과 모달 */}
      {modalOpen && (
        <div
          className="modal-overlay active"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false)
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modalTitle}</div>
              <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {/* 뷰 타입 선택 */}
              <div className="modal-view-type-section">
                {(['daily', 'weekly', 'monthly'] as const).map(viewType => (
                  <button
                    key={viewType}
                    className={`modal-view-btn ${currentModalViewType === viewType ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentModalViewType(viewType)
                      setIsModalTableExpanded(false)
                      setModalTableSortOrder('desc')
                    }}
                  >
                    {viewType === 'daily' ? '일별' : viewType === 'weekly' ? '주별' : '월별'}
                  </button>
                ))}
              </div>

              {/* KPI 카드 (2행) */}
              <div id="modalKpiGrid">
                <div className="modal-kpi-row">
                  <div className="modal-kpi-card">
                    <div className="modal-kpi-label">비용</div>
                    <div className="modal-kpi-value">{formatNumber(modalKpis.비용)}원</div>
                  </div>
                  <div className="modal-kpi-card">
                    <div className="modal-kpi-label">CPC</div>
                    <div className="modal-kpi-value">{formatNumber(modalKpis.CPC)}원</div>
                  </div>
                  <div className="modal-kpi-card">
                    <div className="modal-kpi-label">CPA</div>
                    <div className="modal-kpi-value">{formatNumber(modalKpis.CPA)}원</div>
                  </div>
                  <div className="modal-kpi-card">
                    <div className="modal-kpi-label">ROAS</div>
                    <div className="modal-kpi-value">{formatROAS(modalKpis.ROAS)}</div>
                  </div>
                </div>
                <div className="modal-kpi-row">
                  <div className="modal-kpi-card">
                    <div className="modal-kpi-label">노출</div>
                    <div className="modal-kpi-value">{formatNumber(modalKpis.노출)}</div>
                  </div>
                  <div className="modal-kpi-card">
                    <div className="modal-kpi-label">클릭</div>
                    <div className="modal-kpi-value">{formatNumber(modalKpis.클릭)}</div>
                  </div>
                  <div className="modal-kpi-card">
                    <div className="modal-kpi-label">전환수</div>
                    <div className="modal-kpi-value">{formatNumber(modalKpis.전환수)}</div>
                  </div>
                  <div className="modal-kpi-card">
                    <div className="modal-kpi-label">전환값</div>
                    <div className="modal-kpi-value">{formatNumber(modalKpis.전환값)}원</div>
                  </div>
                </div>
              </div>

              {/* 성과 추이 차트 */}
              <div className="modal-chart-section">
                <div className="modal-chart-title">성과 추이</div>
                <div className="modal-chart-controls">
                  <div className="modal-chart-toggle-group" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(['cost', 'cpm', 'cpc', 'cpa', 'roas'] as const).map(key => {
                      const labels: Record<string, string> = { cost: '비용', cpm: 'CPM', cpc: 'CPC', cpa: 'CPA', roas: 'ROAS' }
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`data-label-toggle ${modalChartToggles[key] ? 'active' : ''}`}
                          onClick={() => setModalChartToggles(prev => ({ ...prev, [key]: !prev[key] }))}
                        >
                          <span className="toggle-checkbox">{modalChartToggles[key] ? '✓' : '☐'}</span>
                          <span>{labels[key]}</span>
                        </button>
                      )
                    })}
                  </div>
                  <button
                    className={`modal-data-label-toggle ${showModalDataLabels ? 'active' : ''}`}
                    onClick={() => setShowModalDataLabels(!showModalDataLabels)}
                  >
                    <span className="toggle-checkbox">{showModalDataLabels ? '☑' : '☐'}</span>
                    <span>데이터 라벨</span>
                  </button>
                </div>
                <div className="modal-chart">
                  <Line data={modalChartData} options={modalChartOptions} />
                </div>
              </div>

              {/* 상세 데이터 테이블 */}
              <div className="modal-table-section">
                <div className="modal-table-title">상세 데이터</div>
                <div className="modal-table-container">
                  <table className="modal-table">
                    <thead>
                      <tr>
                        <th
                          className="sortable active"
                          onClick={() => setModalTableSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                        >
                          기간 <span className="sort-icon">{modalTableSortOrder === 'desc' ? '▼' : '▲'}</span>
                        </th>
                        <th>비용</th>
                        <th>노출</th>
                        <th>CPM</th>
                        <th>클릭</th>
                        <th>CTR</th>
                        <th>CPC</th>
                        <th>전환수</th>
                        <th>CPA</th>
                        <th>전환값</th>
                        <th>ROAS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalAggregatedData.map((row, index) => (
                        <tr
                          key={row.period}
                          style={{ display: (!isModalTableExpanded && index >= 5) ? 'none' : undefined }}
                        >
                          <td>{formatPeriodLabel(row.period, currentModalViewType)}</td>
                          <td>{formatNumber(row.비용)}</td>
                          <td>{formatNumber(row.노출)}</td>
                          <td>{formatNumber(row.CPM)}</td>
                          <td>{formatNumber(row.클릭)}</td>
                          <td>{formatCTR(row.CTR)}</td>
                          <td>{formatNumber(row.CPC)}</td>
                          <td>{formatNumber(row.전환수)}</td>
                          <td>{formatNumber(row.CPA)}</td>
                          <td>{formatNumber(row.전환값)}</td>
                          <td>{formatROAS(row.ROAS)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {modalAggregatedData.length > 5 && (
                  isModalTableExpanded ? (
                    <div className="modal-show-more-container">
                      <button className="modal-show-more-btn" onClick={() => setIsModalTableExpanded(false)}>접기</button>
                    </div>
                  ) : (
                    <div className="modal-show-more-container">
                      <button className="modal-show-more-btn" onClick={() => setIsModalTableExpanded(true)}>
                        더 보기 ({modalAggregatedData.length - 5}개)
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 칩 호버 툴팁 */}
      {tooltipVisible && tooltipData && (
        <div
          className={`chip-hover-tooltip show ${tooltipData.type}`}
          style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
        >
          <div className={`chip-tooltip-header ${tooltipData.type}`}>
            <span className="chip-tooltip-header-icon">{tooltipData.icon}</span>
            <span className="chip-tooltip-header-title">{tooltipData.title}</span>
          </div>
          {tooltipData.criteria && (
            <div className="chip-tooltip-criteria">
              <div className="chip-tooltip-criteria-label">📊 분류 기준</div>
              <div
                className="chip-tooltip-criteria-text"
                dangerouslySetInnerHTML={{ __html: tooltipData.criteria }}
              />
            </div>
          )}
          {(tooltipData.action || tooltipData.actionDetail) && (
            <div className="chip-tooltip-action">
              <div className={`chip-tooltip-action-label ${tooltipData.actionType}`}>
                ✅ {tooltipData.action}
              </div>
              <div className="chip-tooltip-action-text">{tooltipData.actionDetail}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
