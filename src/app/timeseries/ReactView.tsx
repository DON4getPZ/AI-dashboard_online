'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import './timeseries-original.css'

// 타입 정의 - 원본 CSV 컬럼명과 동일하게
interface ForecastData {
  '일 구분': string
  '비용_예측': number
  '노출_예측': number
  '클릭_예측': number
  '전환수_예측': number
  '전환값_예측': number
  type: 'actual' | 'forecast'
}

interface InsightItem {
  type: string
  message: string
  value?: string
  severity?: string
  segment_type?: string
  segment_name?: string
}

interface SegmentData {
  name: string
  total_cost: number
  total_revenue: number
  total_conversions: number
  roas: number
  cpa: number
  forecast_trend?: string
  // CSV 원본 필드 (시뮬레이션에서 사용)
  type?: string
  '일 구분'?: string
  channel?: string
  product?: string
  brand?: string
  promotion?: string
  '비용_예측'?: number | string
  '노출_예측'?: number | string
  '클릭_예측'?: number | string
  '전환수_예측'?: number | string
  '전환값_예측'?: number | string
  [key: string]: string | number | undefined
}

// 원본 JSON 구조에 맞춘 타입 정의
interface AlertItem {
  type: string
  segment_type: string
  segment_value: string
  metric: string
  change_pct: number
  severity: 'high' | 'medium' | 'low'
  title: string
  message: string
  action?: string
  actual_roas?: number
  forecast_roas?: number
  financial_impact?: string
  loss_amount?: number
}

interface RecommendationItem {
  priority: number
  action: string
  action_type: 'scale_up' | 'defend' | 'optimize' | 'cut'
  target: { type: string; value: string }
  reasons: string[]
  expected_impact: string
  context_advice?: string
  metrics?: {
    roas?: number
    cvr?: number
    cpa?: number
    growth_rate?: number
  }
}

interface OpportunityItem {
  type: 'scale_up' | 'hidden_gem' | 'growth_momentum'
  tag?: string
  segment_type: string
  segment_value: string
  title: string
  message: string
  action?: string
  financial_impact?: string
  potential_uplift?: number
  roas?: number
  priority?: number
}

interface MatrixInsightItem {
  type: string
  sub_type: 'super_star' | 'fading_hero' | 'rising_potential' | 'problem_child'
  segment_type: string
  segment_value: string
  severity: 'critical' | 'high' | 'warning' | 'opportunity'
  title: string
  message: string
  action: string
  metrics?: {
    current_roas?: number
    roas?: number
    forecast_growth_pct?: number
    forecast_growth_rate?: number
    revenue_share_pct?: number
    revenue_impact_share?: number
  }
}

interface InsightsData {
  by_period?: {
    [key: string]: {
      overall?: {
        current_period?: { start_date: string; end_date: string; total_cost?: number; total_conversions?: number; total_revenue?: number; roas?: number; avg_cpa?: number; cvr?: number; ctr?: number }
        forecast_period?: { start_date: string; end_date: string; total_cost?: number; total_conversions?: number; total_revenue?: number; roas?: number; avg_cpa?: number; cvr?: number; ctr?: number }
        trend?: { roas_change?: number; conversion_change?: number; direction?: string }
        alerts?: AlertItem[]
      }
      summary_card?: {
        status_title: string
        status_message: string
        status_color: string
        period: string
        metrics: {
          current_revenue: string
          forecast_revenue: string
          revenue_change_pct: number
          current_roas: number
          forecast_roas: number
          roas_change_val: number
        }
      }
      segments?: {
        alerts?: AlertItem[]
        recommendations?: RecommendationItem[]
      }
      opportunities?: OpportunityItem[]
      matrix_insights?: {
        brand?: MatrixInsightItem[]
        channel?: MatrixInsightItem[]
        product?: MatrixInsightItem[]
        promotion?: MatrixInsightItem[]
      }
      summary?: string  // AI 요약 텍스트 (줄바꿈으로 구분)
      details?: {
        total_segment_alerts?: number
        high_severity_alerts?: number
        total_overall_alerts?: number
        total_recommendations?: number
        total_opportunities?: number
      }
      // 성과 트렌드 데이터 (원본 performance_trends)
      performance_trends?: {
        improvements_7d?: PerformanceTrendItem[]
        improvements_14d?: PerformanceTrendItem[]
        improvements_30d?: PerformanceTrendItem[]
        declines_7d?: PerformanceTrendItem[]
        declines_14d?: PerformanceTrendItem[]
        declines_30d?: PerformanceTrendItem[]
      }
    }
  }
}

// 성과 트렌드 항목 타입
interface PerformanceTrendItem {
  metric: string
  period: string
  improvement_level?: 'high' | 'medium' | 'low'
  risk_level?: 'high' | 'medium' | 'low'
  change_pct: number
  recent_avg: number
  previous_avg: number
  recommendation: string
}

// 숫자 포맷팅
const formatNumber = (num: number): string => {
  if (num >= 100000000) return (num / 100000000).toFixed(1) + '억'
  if (num >= 10000) return (num / 10000).toFixed(1) + '만'
  return num.toLocaleString()
}

const formatCurrency = (num: number): string => {
  return '₩' + formatNumber(num)
}

const formatPercent = (num: number): string => {
  return num.toFixed(1) + '%'
}

export default function ReactView() {
  // 상태
  const [loading, setLoading] = useState(true)
  const [forecastData, setForecastData] = useState<ForecastData[]>([])
  const [insightsData, setInsightsData] = useState<InsightsData | null>(null)
  const [segmentData, setSegmentData] = useState<{ [key: string]: SegmentData[] }>({})

  // UI 상태
  const [kpiView, setKpiView] = useState<'primary' | 'all'>('primary')
  const [currentPeriod, setCurrentPeriod] = useState('full')
  const [aiSummaryPeriod, setAiSummaryPeriod] = useState('full')

  // 접기/펼치기 상태
  const [insightsDashboardExpanded, setInsightsDashboardExpanded] = useState(false)
  const [recentChangesExpanded, setRecentChangesExpanded] = useState(false)
  const [budgetSimExpanded, setBudgetSimExpanded] = useState(false)
  const [dataAnalysisExpanded, setDataAnalysisExpanded] = useState(false)

  // 탭 상태
  const [insightsTab, setInsightsTab] = useState('summary')
  const [matrixSubTab, setMatrixSubTab] = useState<'brand' | 'channel' | 'product' | 'promotion'>('brand')
  const [trendPeriod, setTrendPeriod] = useState('7d')
  const [analysisTab, setAnalysisTab] = useState('budget-simulation')
  const [statisticsSubTab, setStatisticsSubTab] = useState('forecast-trend')

  // 시뮬레이션 상태
  const [simSegmentType, setSimSegmentType] = useState<'all' | 'channel' | 'product' | 'brand' | 'promotion'>('all')
  const [budgetAdjustments, setBudgetAdjustments] = useState<Record<string, number>>({})
  const [selectedSimItems, setSelectedSimItems] = useState<string[]>([])
  const [simItemDropdownOpen, setSimItemDropdownOpen] = useState(false)

  // 데이터 로드
  useEffect(() => {
    // 원본 HTML의 parseCSV 함수 그대로 복제 (RFC 4180 호환)
    const parseCSV = (text: string) => {
      const lines = text.trim().split('\n')

      // RFC 4180 호환 CSV 파싱
      const parseLine = (line: string): string[] => {
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
        const obj: any = {}
        headers.forEach((header, index) => {
          obj[header] = values[index] ? values[index].trim() : ''
        })
        return obj
      })
    }

    const loadData = async () => {
      try {
        // Forecast 데이터 로드 - 원본과 동일하게
        const forecastRes = await fetch('/forecast/predictions_daily.csv')
        if (forecastRes.ok) {
          const text = await forecastRes.text()
          const rawData = parseCSV(text)

          // 데이터 변환 (원본과 동일)
          const data: ForecastData[] = rawData.map(row => ({
            '일 구분': row['일 구분'],
            '비용_예측': parseFloat(row['비용_예측']) || 0,
            '노출_예측': parseFloat(row['노출_예측']) || 0,
            '클릭_예측': parseFloat(row['클릭_예측']) || 0,
            '전환수_예측': parseFloat(row['전환수_예측']) || 0,
            '전환값_예측': parseFloat(row['전환값_예측']) || 0,
            type: row['type'] as 'actual' | 'forecast'
          }))
          setForecastData(data)
        }

        // Insights 데이터 로드
        const insightsRes = await fetch('/forecast/insights.json')
        if (insightsRes.ok) {
          const data = await insightsRes.json()
          setInsightsData(data)
        }

        // 세그먼트 데이터 로드
        const segments = ['brand', 'channel', 'product', 'promotion']
        const segData: { [key: string]: SegmentData[] } = {}

        for (const seg of segments) {
          try {
            const res = await fetch(`/forecast/segment_${seg}.csv`)
            if (res.ok) {
              const text = await res.text()
              const lines = text.trim().split('\n')
              const headers = lines[0].split(',').map(h => h.trim())
              segData[seg] = lines.slice(1).map(line => {
                const values = line.split(',')
                const row: any = {}
                headers.forEach((h, i) => {
                  const val = values[i]?.trim() || ''
                  // 문자열로 유지해야 하는 컬럼들
                  if (h === 'type' || h === 'model' || h === '일 구분' || h === seg || h === 'channel' || h === 'product' || h === 'brand' || h === 'promotion') {
                    row[h] = val
                    if (h === seg) row.name = val
                  } else {
                    row[h] = parseFloat(val) || 0
                  }
                })
                return row
              })
            }
          } catch (e) {
            console.error(`Failed to load segment_${seg}.csv`)
          }
        }
        setSegmentData(segData)

      } catch (error) {
        console.error('데이터 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // 기간별 데이터 가져오기
  const getPeriodData = useCallback(() => {
    if (!insightsData?.by_period) return null
    return insightsData.by_period[currentPeriod] || insightsData.by_period['full']
  }, [insightsData, currentPeriod])

  const getAiSummaryPeriodData = useCallback(() => {
    if (!insightsData?.by_period) return null
    return insightsData.by_period[aiSummaryPeriod] || insightsData.by_period['full']
  }, [insightsData, aiSummaryPeriod])

  // KPI 계산 - 원본 updateKPISummary() 함수 1:1 복제
  const kpiSummary = useMemo(() => {
    // 원본과 동일하게 actual/forecast 분리
    const actualData = forecastData.filter(d => d.type === 'actual')
    const forecastDataOnly = forecastData.filter(d => d.type === 'forecast')

    // 실제 데이터 합계 (원본과 동일)
    const actualTotals = actualData.reduce((acc, row) => {
      acc.비용 += row['비용_예측'] || 0
      acc.노출 += row['노출_예측'] || 0
      acc.클릭 += row['클릭_예측'] || 0
      acc.전환수 += row['전환수_예측'] || 0
      acc.전환값 += row['전환값_예측'] || 0
      return acc
    }, { 비용: 0, 노출: 0, 클릭: 0, 전환수: 0, 전환값: 0 })

    // 예측 데이터 합계 (원본과 동일)
    const forecastTotals = forecastDataOnly.reduce((acc, row) => {
      acc.비용 += row['비용_예측'] || 0
      acc.노출 += row['노출_예측'] || 0
      acc.클릭 += row['클릭_예측'] || 0
      acc.전환수 += row['전환수_예측'] || 0
      acc.전환값 += row['전환값_예측'] || 0
      return acc
    }, { 비용: 0, 노출: 0, 클릭: 0, 전환수: 0, 전환값: 0 })

    // 파생 지표 계산 (예측) - 원본과 동일
    const forecastCPM = forecastTotals.노출 > 0 ? (forecastTotals.비용 / forecastTotals.노출 * 1000) : 0
    const forecastCPC = forecastTotals.클릭 > 0 ? (forecastTotals.비용 / forecastTotals.클릭) : 0
    const forecastCPA = forecastTotals.전환수 > 0 ? (forecastTotals.비용 / forecastTotals.전환수) : 0
    const forecastROAS = forecastTotals.비용 > 0 ? (forecastTotals.전환값 / forecastTotals.비용 * 100) : 0

    // 파생 지표 계산 (실제) - 원본과 동일
    const actualCPM = actualTotals.노출 > 0 ? (actualTotals.비용 / actualTotals.노출 * 1000) : 0
    const actualCPC = actualTotals.클릭 > 0 ? (actualTotals.비용 / actualTotals.클릭) : 0
    const actualCPA = actualTotals.전환수 > 0 ? (actualTotals.비용 / actualTotals.전환수) : 0
    const actualROAS = actualTotals.비용 > 0 ? (actualTotals.전환값 / actualTotals.비용 * 100) : 0

    // 변화율 계산 (원본과 동일)
    const calcChange = (forecast: number, actual: number): string => {
      if (actual === 0) return '0'
      return ((forecast - actual) / actual * 100).toFixed(1)
    }

    // 숫자 포맷팅 (원본과 동일)
    const formatNum = (num: number): string => {
      if (num === 0 || num === null || num === undefined) return '0'
      return Math.round(num).toLocaleString('ko-KR')
    }

    const formatDecimal = (num: number): string => {
      if (num === 0 || num === null || num === undefined || !isFinite(num)) return '0'
      return num.toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    }

    const formatPct = (num: number): string => {
      if (num === 0 || num === null || num === undefined || !isFinite(num)) return '0'
      return num.toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
    }

    // 상위 행: 주요 성과 (5개) - 원본과 동일
    const topKpis = [
      { label: '예측 비용', value: formatNum(forecastTotals.비용), unit: '원', change: calcChange(forecastTotals.비용, actualTotals.비용), icon: '💰', highlight: false },
      { label: '예측 ROAS', value: formatPct(forecastROAS), unit: '%', change: calcChange(forecastROAS, actualROAS), icon: '📈', highlight: true },
      { label: '예측 CPA', value: formatNum(forecastCPA), unit: '원', change: calcChange(forecastCPA, actualCPA), icon: '🎯', highlight: false },
      { label: '예측 CPC', value: formatDecimal(forecastCPC), unit: '원', change: calcChange(forecastCPC, actualCPC), icon: '🖱️', highlight: false },
      { label: '예측 CPM', value: formatDecimal(forecastCPM), unit: '원', change: calcChange(forecastCPM, actualCPM), icon: '👁️', highlight: false }
    ]

    // 하위 행: 세부 성과 (4개) - 원본과 동일
    const bottomKpis = [
      { label: '예측 노출', value: formatNum(forecastTotals.노출), unit: '회', change: calcChange(forecastTotals.노출, actualTotals.노출), icon: '👀' },
      { label: '예측 클릭', value: formatNum(forecastTotals.클릭), unit: '회', change: calcChange(forecastTotals.클릭, actualTotals.클릭), icon: '👆' },
      { label: '예측 전환수', value: formatNum(forecastTotals.전환수), unit: '건', change: calcChange(forecastTotals.전환수, actualTotals.전환수), icon: '✅' },
      { label: '예측 전환값', value: formatNum(forecastTotals.전환값), unit: '원', change: calcChange(forecastTotals.전환값, actualTotals.전환값), icon: '💵' }
    ]

    return { topKpis, bottomKpis, actualTotals, forecastTotals }
  }, [forecastData])

  // Summary Card 데이터
  const summaryCard = useMemo(() => {
    const periodData = getPeriodData()
    return periodData?.summary_card || null
  }, [getPeriodData])

  // 원본 updateAiSummary() 함수 그대로 복제 - summary 텍스트 파싱
  const aiSummary = useMemo(() => {
    const periodData = getAiSummaryPeriodData()
    if (!periodData?.summary) return []

    const summary = periodData.summary
    const lines = summary.split('\n').filter((line: string) => line.trim())

    // 카테고리별 스타일 정의 (원본과 동일)
    const categories = {
      performance: { icon: '📊', bg: '#e3f2fd', border: '#1976d2', color: '#1565c0', label: '성과 현황', keywords: ['전체 성과', 'ROAS', '전환수', '전환값'] },
      trend_up: { icon: '📈', bg: '#e8f5e9', border: '#43a047', color: '#2e7d32', label: '상승 트렌드', keywords: ['개선 예상', '증가', '상승'] },
      trend_down: { icon: '📉', bg: '#ffebee', border: '#e53935', color: '#c62828', label: '하락 트렌드', keywords: ['하락 예상', '감소', '하락'] },
      warning: { icon: '⚠️', bg: '#fff3e0', border: '#fb8c00', color: '#e65100', label: '주의 필요', keywords: ['위험', '경고', '심각'] },
      conversion: { icon: '🛒', bg: '#fce4ec', border: '#ec407a', color: '#c2185b', label: '전환 분석', keywords: ['전환 하락', '전환율'] },
      recommend: { icon: '💡', bg: '#f3e5f5', border: '#ab47bc', color: '#7b1fa2', label: '추천 액션', keywords: ['권장', '추천', '증액'] },
      review: { icon: '🔍', bg: '#e8eaf6', border: '#5c6bc0', color: '#3949ab', label: '검토 대상', keywords: ['검토', '분석 필요'] },
      info: { icon: '💬', bg: '#f5f5f5', border: '#9e9e9e', color: '#616161', label: '정보', keywords: [] }
    }

    // 카테고리 판별 (원본과 동일)
    const getCategory = (line: string) => {
      const trimmed = line.trim()
      if (/^📊/.test(trimmed)) return categories.performance
      if (/^📈/.test(trimmed)) return categories.trend_up
      if (/^📉/.test(trimmed)) return categories.trend_down
      if (/^[⚠️🚨‼️❗❕⛔🔴]/.test(trimmed) || trimmed.startsWith('⚠')) return categories.warning
      if (/^🛒/.test(trimmed)) return categories.conversion
      if (/^💡/.test(trimmed)) return categories.recommend
      if (/^🔍/.test(trimmed)) return categories.review
      if (/주의|경고|위험|심각|소진/.test(trimmed)) return categories.warning
      if (/트렌드|Trend/.test(trimmed)) {
        if (/\+|개선|증가|상승/.test(trimmed)) return categories.trend_up
        if (/-|하락|감소|하향/.test(trimmed)) return categories.trend_down
      }
      if (/권장|추천|증액/.test(trimmed)) return categories.recommend
      if (/검토|분석 필요/.test(trimmed)) return categories.review
      return categories.info
    }

    // 이모지 제거 함수 (원본과 동일 - ES5 호환)
    const removeEmoji = (text: string) => {
      // 이모지를 포함한 특수문자 제거 (surrogate pairs + misc symbols)
      let cleaned = text
        .replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]/g, '')  // surrogate pairs (이모지)
        .replace(/[\u2600-\u27BF]/g, '')  // misc symbols
        .replace(/[\uFE00-\uFE0F]/g, '')  // variation selectors
        .trim()
      cleaned = cleaned.replace(/^(주의|경고|권장|추천|정보|알림|참고)\s*[:：]\s*/i, '')
      return cleaned
    }

    // 연속된 줄들을 그룹화 (원본과 동일)
    const groupedLines: { main: string; subLines: string[] }[] = []
    lines.forEach((line: string) => {
      if (line.startsWith('   ') && groupedLines.length > 0) {
        groupedLines[groupedLines.length - 1].subLines.push(line.trim())
      } else if (line.trim()) {
        groupedLines.push({ main: line.trim(), subLines: [] })
      }
    })

    // 핵심 3개 카드 선별 (원본과 동일)
    const coreCards: { main: string; subLines: string[]; cat: typeof categories.performance; priority: number }[] = []
    const seenTypes = new Set<string>()

    for (const group of groupedLines) {
      const cat = getCategory(group.main)
      const text = group.main

      if ((cat.label === '성과 현황' || /전체 성과|ROAS.*전환수/.test(text)) && !seenTypes.has('performance')) {
        seenTypes.add('performance')
        coreCards.push({ ...group, cat, priority: 1 })
      } else if ((cat.label === '주의 필요' || cat.label === '하락 트렌드' || /하락 예상|하락할 것으로/.test(text)) && !seenTypes.has('warning')) {
        seenTypes.add('warning')
        coreCards.push({ ...group, cat, priority: 2 })
      } else if ((cat.label === '추천 액션' || /^💡|권장:|추천:/.test(text)) && !seenTypes.has('recommend')) {
        seenTypes.add('recommend')
        coreCards.push({ ...group, cat: categories.recommend, priority: 3 })
      }
      if (coreCards.length >= 3) break
    }

    // 3개 미만이면 검토 대상 추가
    if (coreCards.length < 3) {
      for (const group of groupedLines) {
        const cat = getCategory(group.main)
        if ((cat.label === '검토 대상' || /검토 대상|🔍/.test(group.main)) && !seenTypes.has('review')) {
          seenTypes.add('review')
          coreCards.push({ ...group, cat: categories.review, priority: 4 })
        }
        if (coreCards.length >= 3) break
      }
    }

    // 여전히 3개 미만이면 나머지 항목에서 보충
    if (coreCards.length < 3) {
      for (const group of groupedLines) {
        const cat = getCategory(group.main)
        const alreadyAdded = coreCards.some(c => c.main === group.main)
        if (!alreadyAdded) {
          coreCards.push({ ...group, cat, priority: 5 })
        }
        if (coreCards.length >= 3) break
      }
    }

    coreCards.sort((a, b) => a.priority - b.priority)

    // 추천 데이터 가져오기
    const recommendations = periodData.segments?.recommendations || []

    return coreCards.map((group, cardIndex) => ({
      cat: group.cat,
      cleanText: removeEmoji(group.main),
      subLines: group.subLines,
      matchedRec: group.cat.label !== '추천 액션' && recommendations.length > 0
        ? recommendations[cardIndex % recommendations.length]
        : null
    }))
  }, [getAiSummaryPeriodData])

  // 경고 데이터 - 원본 updateInsightsFromData() 함수 그대로 복제
  const alerts = useMemo(() => {
    const periodData = getAiSummaryPeriodData()
    if (!periodData) return []
    const segmentAlerts = periodData.segments?.alerts || []
    const overalerts = periodData.overall?.alerts || []
    return [...segmentAlerts, ...overalerts]
  }, [getAiSummaryPeriodData])

  // 추천 데이터 - 원본 updateRecommendations() 함수 그대로 복제
  const recommendations = useMemo(() => {
    const periodData = getAiSummaryPeriodData()
    return periodData?.segments?.recommendations || []
  }, [getAiSummaryPeriodData])

  // 기회 요소 데이터 - 원본 updateOpportunities() 함수 그대로 복제
  const opportunities = useMemo(() => {
    const periodData = getAiSummaryPeriodData()
    return periodData?.opportunities || []
  }, [getAiSummaryPeriodData])

  // Matrix 데이터 - 원본 renderMatrixInsights() 함수 그대로 복제
  const matrixInsights = useMemo(() => {
    const periodData = getAiSummaryPeriodData()
    return periodData?.matrix_insights || {}
  }, [getAiSummaryPeriodData])

  // 성과 트렌드 데이터 - 원본 updatePerformanceTrends() 함수 그대로 복제
  // 항상 'full' 기간 데이터 사용 (원본과 동일)
  const performanceTrends = useMemo(() => {
    const fullPeriodData = insightsData?.by_period?.full
    return fullPeriodData?.performance_trends || null
  }, [insightsData])

  // 선택된 기간의 개선/하락 데이터 가져오기
  const improvements = useCallback((period: string) => {
    if (!performanceTrends) return []
    const key = `improvements_${period}` as keyof typeof performanceTrends
    return (performanceTrends[key] as PerformanceTrendItem[]) || []
  }, [performanceTrends])

  const declines = useCallback((period: string) => {
    if (!performanceTrends) return []
    const key = `declines_${period}` as keyof typeof performanceTrends
    return (performanceTrends[key] as PerformanceTrendItem[]) || []
  }, [performanceTrends])

  // 기간 텍스트 계산 (원본 updateTrendPeriodIndicator 함수 그대로 복제)
  const trendPeriodIndicator = useCallback((period: string) => {
    // 실제 데이터의 마지막 날짜 기준으로 계산
    let lastDate = new Date()

    // forecastData에서 actual 데이터의 마지막 날짜 찾기
    if (forecastData.length > 0) {
      const actualData = forecastData.filter(d => d.type === 'actual')
      if (actualData.length > 0) {
        const lastDateStr = actualData[actualData.length - 1]['일 구분']
        if (lastDateStr) {
          lastDate = new Date(lastDateStr)
        }
      }
    }

    const formatDate = (date: Date) => {
      const m = date.getMonth() + 1
      const d = date.getDate()
      return `${m}/${d}`
    }

    let recentStart: Date, recentEnd: Date, previousStart: Date, previousEnd: Date
    let periodLabel: string

    if (period === '7d') {
      recentEnd = new Date(lastDate)
      recentStart = new Date(lastDate)
      recentStart.setDate(recentStart.getDate() - 6)
      previousEnd = new Date(lastDate)
      previousEnd.setDate(previousEnd.getDate() - 7)
      previousStart = new Date(lastDate)
      previousStart.setDate(previousStart.getDate() - 13)
      periodLabel = '7일'
    } else if (period === '14d') {
      recentEnd = new Date(lastDate)
      recentStart = new Date(lastDate)
      recentStart.setDate(recentStart.getDate() - 13)
      previousEnd = new Date(lastDate)
      previousEnd.setDate(previousEnd.getDate() - 14)
      previousStart = new Date(lastDate)
      previousStart.setDate(previousStart.getDate() - 27)
      periodLabel = '14일'
    } else {
      recentEnd = new Date(lastDate)
      recentStart = new Date(lastDate)
      recentStart.setDate(recentStart.getDate() - 29)
      previousEnd = new Date(lastDate)
      previousEnd.setDate(previousEnd.getDate() - 30)
      previousStart = new Date(lastDate)
      previousStart.setDate(previousStart.getDate() - 59)
      periodLabel = '30일'
    }

    return {
      full: `최근 ${periodLabel} (${formatDate(recentStart)}~${formatDate(recentEnd)}) vs 이전 ${periodLabel} (${formatDate(previousStart)}~${formatDate(previousEnd)})`,
      recent: `최근 ${periodLabel}`,
      recentDates: `(${formatDate(recentStart)}~${formatDate(recentEnd)})`,
      previous: `이전 ${periodLabel}`,
      previousDates: `(${formatDate(previousStart)}~${formatDate(previousEnd)})`,
      simple: `최근 ${periodLabel} vs 이전 ${periodLabel}`
    }
  }, [forecastData])

  // 기간 텍스트 맵핑 (카드 내 표시용)
  const periodTextMap: Record<string, string> = {
    '7d': '최근 7일 vs 이전 7일',
    '14d': '최근 14일 vs 이전 14일',
    '30d': '최근 30일 vs 이전 30일'
  }

  // 추천 텍스트 변환 함수 (원본 transformRecommendationText와 동일)
  const transformRecommendationText = useCallback((recommendation: string, metric: string) => {
    const transformations: Record<string, { pattern: RegExp; replacement: string }> = {
      '비용': {
        pattern: /마케팅 전략 점검이 필요합니다/,
        replacement: '광고 예산 재분배를 고려해보세요. 성과가 낮은 채널의 예산을 줄이고, 효율이 좋은 채널로 예산을 이동시키는 것을 추천드립니다.'
      },
      '전환수': {
        pattern: /마케팅 전략 점검이 필요합니다/,
        replacement: '광고 소재나 타겟 주요 항목 조정이 필요합니다. 전환율이 낮은 캠페인의 타겟팅 설정을 검토하고, 잠재고객을 다시 정의해보시는 것을 추천드립니다.'
      },
      '전환값': {
        pattern: /마케팅 전략 점검이 필요합니다/,
        replacement: '고객 단가를 높이는 전략이 필요합니다. 프리미엄 제품 노출을 늘리거나, 교차 판매/업셀 전략을 강화해보시는 것을 추천드립니다.'
      },
      'ROAS': {
        pattern: /광고 효율성 점검이 필요합니다/,
        replacement: '광고 효율을 개선하기 위해 입찰 전략을 재검토하고, ROI가 낮은 키워드나 소재를 일시 중지하거나 최적화하는 것을 추천드립니다.'
      }
    }

    for (const [key, transform] of Object.entries(transformations)) {
      if (metric.includes(key) && transform.pattern.test(recommendation)) {
        return recommendation.replace(transform.pattern, transform.replacement)
      }
    }

    return recommendation
  }, [])

  // 원본 formatSimCurrency 함수 그대로 복제
  const formatSimCurrency = useCallback((value: number) => {
    if (value >= 100000000) {
      return (value / 100000000).toFixed(1) + '억'
    } else if (value >= 10000000) {
      return (value / 10000).toFixed(0) + '만'
    } else if (value >= 10000) {
      return (value / 10000).toFixed(1) + '만'
    }
    return value.toLocaleString() + '원'
  }, [])

  // 시뮬레이션 데이터 - 원본 loadSimulationData() 로직 그대로 복제
  const simulationData = useMemo(() => {
    const data: Record<string, { cost: number; revenue: number; conversions: number; clicks: number; roas: number; cvr: number }> = {}

    if (simSegmentType === 'all') {
      // '전체' 선택 시 채널 데이터 기준으로 전체 집계
      data['전체'] = { cost: 0, revenue: 0, conversions: 0, clicks: 0, roas: 0, cvr: 0 }
      const channelData = segmentData['channel'] || []
      channelData.forEach(row => {
        if (row.type !== 'actual') return
        data['전체'].cost += parseFloat(String(row['비용_예측'])) || 0
        data['전체'].revenue += parseFloat(String(row['전환값_예측'])) || 0
        data['전체'].conversions += parseFloat(String(row['전환수_예측'])) || 0
        data['전체'].clicks += parseFloat(String(row['클릭_예측'])) || 0
      })
    } else {
      const segData = segmentData[simSegmentType] || []
      segData.forEach(row => {
        if (row.type !== 'actual') return
        const segmentName = row[simSegmentType] || row.channel || row.product || row.brand || row.promotion || row.name
        if (!segmentName) return

        if (!data[segmentName]) {
          data[segmentName] = { cost: 0, revenue: 0, conversions: 0, clicks: 0, roas: 0, cvr: 0 }
        }
        data[segmentName].cost += parseFloat(String(row['비용_예측'])) || row.total_cost || 0
        data[segmentName].revenue += parseFloat(String(row['전환값_예측'])) || row.total_revenue || 0
        data[segmentName].conversions += parseFloat(String(row['전환수_예측'])) || 0
        data[segmentName].clicks += parseFloat(String(row['클릭_예측'])) || 0
      })
    }

    // ROAS, CVR 계산
    Object.keys(data).forEach(segment => {
      const seg = data[segment]
      seg.roas = seg.cost > 0 ? (seg.revenue / seg.cost * 100) : 0
      seg.cvr = seg.clicks > 0 ? (seg.conversions / seg.clicks * 100) : 0
    })

    return data
  }, [segmentData, simSegmentType])

  // 시뮬레이션 아이템 리스트 (정렬된)
  const simulationItems = useMemo(() => {
    const segments = Object.keys(simulationData).sort((a, b) => simulationData[b].cost - simulationData[a].cost)
    return segments.map(name => ({
      name,
      ...simulationData[name]
    }))
  }, [simulationData])

  // selectedSimItems 초기화 (아이템 변경 시)
  useEffect(() => {
    const allItems = simulationItems.map(item => item.name)
    setSelectedSimItems(allItems)
  }, [simulationItems])

  // 시뮬레이션 결과 - 원본 updateSimulationResults() 로직 그대로 복제
  const simulationResults = useMemo(() => {
    const DIMINISHING_FACTOR = 0.15 // 원본과 동일

    // 원본 calculateAdjustedRoas 함수 그대로 복제
    const calculateAdjustedRoas = (currentRoas: number, budgetChangeRatio: number) => {
      if (budgetChangeRatio > 0) {
        return currentRoas * (1 - DIMINISHING_FACTOR * Math.log(1 + budgetChangeRatio))
      } else if (budgetChangeRatio < 0) {
        return currentRoas * (1 + DIMINISHING_FACTOR * Math.log(1 + Math.abs(budgetChangeRatio)) * 0.5)
      }
      return currentRoas
    }

    let totalCurrentCost = 0
    let totalCurrentRevenue = 0
    let totalNewCost = 0
    let totalNewRevenue = 0
    const segmentResults: Array<{
      segment: string
      currentCost: number
      newCost: number
      currentRoas: number
      adjustedRoas: number
      currentRevenue: number
      newRevenue: number
      recommendation: string
      recColor: string
      adjustment: number
    }> = []

    // 선택된 항목만 필터링
    const segmentsToProcess = simulationItems.filter(item =>
      selectedSimItems.length === 0 || selectedSimItems.includes(item.name)
    )

    segmentsToProcess.forEach(item => {
      const adjustment = (budgetAdjustments[item.name] || 0) / 100
      const newCost = item.cost * (1 + adjustment)
      const adjustedRoas = calculateAdjustedRoas(item.roas, adjustment)
      const newRevenue = newCost * (adjustedRoas / 100)

      totalCurrentCost += item.cost
      totalCurrentRevenue += item.revenue
      totalNewCost += newCost
      totalNewRevenue += newRevenue

      // 추천 등급 결정 (원본과 동일)
      let recommendation = ''
      let recColor = ''
      if (adjustedRoas >= 150) {
        recommendation = '증액 추천'
        recColor = '#2e7d32'
      } else if (adjustedRoas >= 100) {
        recommendation = '유지'
        recColor = '#1565c0'
      } else if (adjustedRoas >= 50) {
        recommendation = '효율 점검'
        recColor = '#f57c00'
      } else {
        recommendation = '감액 검토'
        recColor = '#c62828'
      }

      segmentResults.push({
        segment: item.name,
        currentCost: item.cost,
        newCost,
        currentRoas: item.roas,
        adjustedRoas,
        currentRevenue: item.revenue,
        newRevenue,
        recommendation,
        recColor,
        adjustment: budgetAdjustments[item.name] || 0
      })
    })

    const currentRoas = totalCurrentCost > 0 ? (totalCurrentRevenue / totalCurrentCost * 100) : 0
    const newRoas = totalNewCost > 0 ? (totalNewRevenue / totalNewCost * 100) : 0
    const costChange = totalCurrentCost > 0 ? ((totalNewCost - totalCurrentCost) / totalCurrentCost * 100) : 0
    const revenueChange = totalCurrentRevenue > 0 ? ((totalNewRevenue - totalCurrentRevenue) / totalCurrentRevenue * 100) : 0
    const roasChange = newRoas - currentRoas

    // 투자 효율 계산 (원본과 동일)
    const additionalCost = totalNewCost - totalCurrentCost
    const additionalRevenue = totalNewRevenue - totalCurrentRevenue
    let efficiencyText = '-'
    if (additionalCost > 0 && additionalRevenue > 0) {
      efficiencyText = (additionalRevenue / additionalCost * 100).toFixed(0) + '%'
    } else if (additionalCost < 0 && additionalRevenue < 0) {
      efficiencyText = '비용 절감'
    } else if (additionalCost === 0) {
      efficiencyText = '변동 없음'
    }

    // 인사이트 생성 (원본 updateSimulationInsight 로직)
    const changedSegments = segmentResults.filter(r => r.adjustment !== 0)
    let insightText = '주요 항목별 예산을 조정하면 예상 결과가 표시됩니다.'
    let insightStatus: 'neutral' | 'positive' | 'warning' | 'negative' = 'neutral'
    let insightStatusText = '대기 중'

    if (changedSegments.length > 0) {
      const increased = changedSegments.filter(r => r.adjustment > 0)
      const decreased = changedSegments.filter(r => r.adjustment < 0)

      if (revenueChange > 0 && roasChange >= -5) {
        insightStatus = 'positive'
        insightStatusText = '긍정적'
        insightText = `<strong style="color: #059669;">긍정적 시나리오</strong><br>예산 ${costChange > 0 ? '증액' : '조정'}으로 매출이 <strong>${revenueChange.toFixed(1)}%</strong> 증가할 것으로 예상됩니다.`
        if (roasChange < 0) {
          insightText += ` 다만 ROAS가 ${Math.abs(roasChange).toFixed(1)}%p 하락하므로 효율성 모니터링이 필요합니다.`
        }
      } else if (revenueChange > 0 && roasChange < -5) {
        insightStatus = 'warning'
        insightStatusText = '주의 필요'
        insightText = `<strong style="color: #d97706;">주의가 필요한 시나리오</strong><br>매출은 ${revenueChange.toFixed(1)}% 증가하지만, ROAS가 <strong>${Math.abs(roasChange).toFixed(1)}%p</strong> 크게 하락합니다. 체감 수익 효과로 인한 효율 저하를 고려하세요.`
      } else if (revenueChange < 0) {
        insightStatus = 'negative'
        insightStatusText = '재검토'
        insightText = `<strong style="color: #dc2626;">재검토가 필요한 시나리오</strong><br>현재 설정으로는 매출이 ${Math.abs(revenueChange).toFixed(1)}% 감소할 것으로 예상됩니다. 예산 배분을 다시 검토해보세요.`
      } else {
        insightStatus = 'neutral'
        insightStatusText = '변동 없음'
        insightText = `<strong style="color: #64748b;">변동 없음</strong><br>현재 설정에서는 매출 변화가 없습니다.`
      }

      if (increased.length > 0) {
        const topIncreased = increased.sort((a, b) => b.adjustment - a.adjustment)[0]
        insightText += `<br><br><span style="color: var(--grey-500);">▸</span> <strong>${topIncreased.segment}</strong>에 가장 많은 증액(+${topIncreased.adjustment}%)이 설정됨`
      }
      if (decreased.length > 0) {
        const topDecreased = decreased.sort((a, b) => a.adjustment - b.adjustment)[0]
        insightText += `<br><span style="color: var(--grey-500);">▸</span> <strong>${topDecreased.segment}</strong>에 가장 많은 감액(${topDecreased.adjustment}%)이 설정됨`
      }
    }

    return {
      items: segmentResults,
      summary: {
        totalCurrentCost,
        totalNewCost,
        totalCurrentRevenue,
        totalNewRevenue,
        currentRoas,
        newRoas,
        costChange,
        revenueChange,
        roasChange,
        efficiencyText
      },
      insight: {
        text: insightText,
        status: insightStatus,
        statusText: insightStatusText
      }
    }
  }, [simulationItems, selectedSimItems, budgetAdjustments])

  // 기간 전환
  const switchAiSummaryPeriod = (period: string) => {
    setAiSummaryPeriod(period)
    setCurrentPeriod(period)
  }

  // 접기/펼치기 토글
  const toggleCollapsible = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(prev => !prev)
  }

  if (loading) {
    return (
      <div className="main-content" style={{ marginLeft: 0 }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
              <div style={{ fontSize: 16, color: 'var(--grey-600)' }}>데이터를 불러오는 중...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-content" style={{ marginLeft: 0 }}>
      <div className="container">
        {/* 헤더 */}
        <div className="header">
          <div>
            <h1>시계열 데이터 분석</h1>
            <div className="header-subtitle">
              AI 기반 예측 모델을 통한 광고 성과 예측 및 인사이트 <strong>(향후 30일 예측)</strong>
            </div>
          </div>
        </div>

        {/* 0. AI 상태 요약 카드 (summary_card) - 원본 updateSummaryCard() 함수 1:1 복제 */}
        {summaryCard && (() => {
          // 상태 색상 설정 (원본과 동일)
          const colorMap: { [key: string]: { bg: string; border: string; text: string } } = {
            'blue': { bg: '#e3f2fd', border: '#2196f3', text: '#1565c0' },
            'green': { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32' },
            'yellow': { bg: '#fff8e1', border: '#ffc107', text: '#f57f17' },
            'red': { bg: '#ffebee', border: '#f44336', text: '#c62828' }
          }
          const colors = colorMap[summaryCard.status_color] || colorMap['blue']
          const m = summaryCard.metrics

          return (
            <div
              id="summaryCardContainer"
              className="card"
              style={{
                marginBottom: 24,
                background: colors.bg,
                borderLeft: `4px solid ${colors.border}`
              }}
            >
              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div id="summaryCardStatus" style={{ fontSize: 24, fontWeight: 700, color: colors.text }}>
                    {summaryCard.status_title || ''}
                  </div>
                  <div>
                    <div id="summaryCardMessage" style={{ fontSize: 14, color: 'var(--grey-700)' }}>
                      {summaryCard.status_message || ''}
                    </div>
                    <div id="summaryCardPeriod" style={{ fontSize: 12, color: 'var(--grey-500)', marginTop: 4 }}>
                      {summaryCard.period || ''}
                    </div>
                  </div>
                </div>
                {m && (
                  <div id="summaryCardMetrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
                    <div style={{ padding: 12, background: 'rgba(255,255,255,0.7)', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--grey-600)' }}>현재 매출</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--grey-900)' }}>{m.current_revenue || '-'}</div>
                    </div>
                    <div style={{ padding: 12, background: 'rgba(255,255,255,0.7)', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--grey-600)' }}>예측 매출</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-main)' }}>{m.forecast_revenue || '-'}</div>
                      <div style={{ fontSize: 11, color: (m.revenue_change_pct || 0) >= 0 ? '#2e7d32' : '#c62828' }}>
                        {(m.revenue_change_pct || 0) >= 0 ? '▲' : '▼'} {Math.abs(m.revenue_change_pct || 0).toFixed(1)}%
                      </div>
                    </div>
                    <div style={{ padding: 12, background: 'rgba(255,255,255,0.7)', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--grey-600)' }}>현재 ROAS</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--grey-900)' }}>{(m.current_roas || 0).toFixed(0)}%</div>
                    </div>
                    <div style={{ padding: 12, background: 'rgba(255,255,255,0.7)', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--grey-600)' }}>예측 ROAS</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-main)' }}>{(m.forecast_roas || 0).toFixed(0)}%</div>
                      <div style={{ fontSize: 11, color: (m.roas_change_val || 0) >= 0 ? '#2e7d32' : '#c62828' }}>
                        {(m.roas_change_val || 0) >= 0 ? '▲' : '▼'} {Math.abs(m.roas_change_val || 0).toFixed(1)}%p
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* 1. 핵심 KPI 요약 - 원본 updateKPISummary() 렌더링 1:1 복제 */}
        <div className="kpi-view-toggle">
          <button
            className={`kpi-view-btn ${kpiView === 'primary' ? 'active' : ''}`}
            data-kpi-view="primary"
            onClick={() => setKpiView('primary')}
          >
            주요 성과
          </button>
          <button
            className={`kpi-view-btn ${kpiView === 'all' ? 'active' : ''}`}
            data-kpi-view="all"
            onClick={() => setKpiView('all')}
          >
            세부 성과
          </button>
        </div>

        <div className={`kpi-section ${kpiView === 'all' ? 'show-all' : ''}`} id="kpiSectionContainer">
          <div id="kpiSummaryGrid">
            {/* 주요 성과 (5개) - 원본과 동일 */}
            <section className="kpi-grid kpi-grid-primary" style={{ marginBottom: 0 }}>
              {kpiSummary.topKpis.map((kpi, i) => (
                <div key={i} className={`kpi-card${kpi.highlight ? ' highlight' : ''}`}>
                  <div className="kpi-header">
                    <span className="kpi-title">{kpi.label}</span>
                    <div className="kpi-icon">{kpi.icon}</div>
                  </div>
                  <div className={`kpi-value${kpi.highlight ? ' highlight-value' : ''}`}>{kpi.value}</div>
                  <div className={`kpi-trend ${parseFloat(kpi.change) >= 0 ? 'up' : 'down'}`}>
                    <span className={`trend-badge ${parseFloat(kpi.change) >= 0 ? 'up' : 'down'}`}>
                      {parseFloat(kpi.change) >= 0 ? '▲' : '▼'} {Math.abs(parseFloat(kpi.change))}%
                    </span>
                    <span style={{ color: 'var(--grey-500)', fontSize: 12 }}>vs 실제</span>
                  </div>
                </div>
              ))}
            </section>
            {/* 세부 성과 (4개) - 원본과 동일 */}
            <section className="kpi-grid kpi-grid-secondary" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 0 }}>
              {kpiSummary.bottomKpis.map((kpi, i) => (
                <div key={i} className="kpi-card secondary">
                  <div className="kpi-header">
                    <span className="kpi-title">{kpi.label}</span>
                    <div className="kpi-icon">{kpi.icon}</div>
                  </div>
                  <div className="kpi-value">{kpi.value}</div>
                  <div className={`kpi-trend ${parseFloat(kpi.change) >= 0 ? 'up' : 'down'}`}>
                    <span className={`trend-badge ${parseFloat(kpi.change) >= 0 ? 'up' : 'down'}`}>
                      {parseFloat(kpi.change) >= 0 ? '▲' : '▼'} {Math.abs(parseFloat(kpi.change))}%
                    </span>
                    <span style={{ color: 'var(--grey-500)', fontSize: 12 }}>vs 실제</span>
                  </div>
                </div>
              ))}
            </section>
          </div>
        </div>

        {/* 2. 통합 인사이트 대시보드 */}
        <div className="collapsible-section" style={{ marginBottom: 24 }}>
          <div className="collapsible-header" onClick={() => toggleCollapsible(setInsightsDashboardExpanded)}>
            <div className="collapsible-title">
              <span className="collapsible-icon">🔬</span>
              <span>통합 인사이트 대시보드</span>
            </div>
            <button className={`collapsible-toggle ${insightsDashboardExpanded ? 'active' : ''}`}>
              <span>{insightsDashboardExpanded ? '접기' : '펼치기'}</span>
              <span className={`collapsible-toggle-icon ${insightsDashboardExpanded ? '' : 'collapsed'}`}>▼</span>
            </button>
          </div>
          <div className={`collapsible-content ${insightsDashboardExpanded ? 'expanded' : ''}`}>
            {/* AI 인사이트 요약 */}
            <div style={{ marginBottom: 20 }}>
              {/* 스토리 배너 */}
              <div style={{ marginBottom: 16, padding: 20, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16, color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ fontSize: 40, lineHeight: 1 }}>🤖</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>AI가 분석한 오늘의 마케팅 인사이트</div>
                    <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.6 }}>
                      Prophet 예측 모델 기반으로 <strong>성과 트렌드와 액션 아이템</strong>을 요약했습니다.
                    </div>
                  </div>
                </div>
              </div>

              {/* AI 요약 기간 필터 */}
              <div style={{ marginBottom: 16, padding: '12px 16px', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', borderRadius: 10, border: '1px solid #dee2e6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#495057' }}>📅 분석 기간:</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[
                      { key: 'full', label: '전체' },
                      { key: '180d', label: '180일' },
                      { key: '90d', label: '90일' },
                      { key: '30d', label: '30일' },
                    ].map(period => (
                      <button
                        key={period.key}
                        className={`ai-period-btn ${aiSummaryPeriod === period.key ? 'active' : ''}`}
                        onClick={() => switchAiSummaryPeriod(period.key)}
                        style={{
                          padding: '6px 14px',
                          fontSize: 11,
                          fontWeight: 600,
                          border: `1px solid ${aiSummaryPeriod === period.key ? '#673ab7' : '#dee2e6'}`,
                          borderRadius: 20,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          background: aiSummaryPeriod === period.key ? '#673ab7' : 'white',
                          color: aiSummaryPeriod === period.key ? 'white' : '#495057',
                        }}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 인사이트 탭 버튼 - 원본과 동일 */}
              <div className="view-type-section" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
                <button
                  className={`view-btn insights-tab-btn ${insightsTab === 'summary' ? 'active' : ''}`}
                  onClick={() => setInsightsTab('summary')}
                  style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600 }}
                >
                  📊 핵심 요약
                </button>
                <button
                  className={`view-btn insights-tab-btn ${insightsTab === 'alerts' ? 'active' : ''}`}
                  onClick={() => setInsightsTab('alerts')}
                  style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600 }}
                >
                  ⚠️ 경고 및 추천 {(alerts.length + recommendations.length) > 0 && <span style={{ padding: '2px 8px', background: '#ef5350', color: 'white', borderRadius: 10, fontSize: 11, marginLeft: 4 }}>{alerts.length + recommendations.length}</span>}
                </button>
                <button
                  className={`view-btn insights-tab-btn ${insightsTab === 'opportunities' ? 'active' : ''}`}
                  onClick={() => setInsightsTab('opportunities')}
                  style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600 }}
                >
                  🎯 기회 요소 {opportunities.length > 0 && <span style={{ padding: '2px 8px', background: '#4caf50', color: 'white', borderRadius: 10, fontSize: 11, marginLeft: 4 }}>{opportunities.length}</span>}
                </button>
                <button
                  className={`view-btn insights-tab-btn ${insightsTab === 'matrix' ? 'active' : ''}`}
                  onClick={() => setInsightsTab('matrix')}
                  style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600 }}
                >
                  📈 주요 항목별 분석
                </button>
              </div>

              {/* 탭 0: 핵심 요약 - 원본 updateAiSummary() 함수 렌더링 그대로 복제 */}
              {insightsTab === 'summary' && (
                <div className="insights-tab-content" style={{ display: 'block', background: 'none', border: 'none', boxShadow: 'none', borderRadius: 0, overflow: 'visible' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, paddingTop: 4 }}>
                    {aiSummary.length > 0 ? aiSummary.map((card, i) => {
                      // 증감 강조 함수 (원본 highlightChanges와 동일)
                      const highlightChanges = (text: string) => {
                        let result = text
                        // +숫자% 패턴 (상승)
                        result = result.replace(/(\+[\d.]+%p?)/g, '<span style="color: #2e7d32; font-weight: 600;">$1</span>')
                        // -숫자% 패턴 (하락)
                        result = result.replace(/([-−][\d.]+%p?)/g, '<span style="color: #c62828; font-weight: 600;">$1</span>')
                        // "N% 증가/상승" 패턴
                        result = result.replace(/([\d.]+%)\s*(증가|상승|개선)/g, '<span style="color: #2e7d32; font-weight: 600;">$1 $2</span>')
                        // "N% 감소/하락" 패턴
                        result = result.replace(/([\d.]+%)\s*(감소|하락|하향)/g, '<span style="color: #c62828; font-weight: 600;">$1 $2</span>')
                        return result
                      }
                      const hasAction = card.matchedRec || card.subLines.length > 0
                      return (
                        <div
                          key={i}
                          style={{
                            background: card.cat.bg,
                            border: `2px solid ${card.cat.border}`,
                            borderRadius: 10,
                            padding: 14,
                            transition: 'transform 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          {/* 헤더 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <div style={{ width: 32, height: 32, background: `${card.cat.border}20`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: 16 }}>{card.cat.icon}</span>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: card.cat.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.cat.label}</span>
                          </div>
                          {/* 메시지 */}
                          <div
                            style={{ fontSize: 13, fontWeight: 500, color: 'var(--grey-900)', lineHeight: 1.6, flex: 1, marginBottom: hasAction ? 10 : 0 }}
                            dangerouslySetInnerHTML={{ __html: highlightChanges(card.cleanText) }}
                          />
                          {/* 서브라인 (들여쓰기 항목) */}
                          {card.subLines.length > 0 && (
                            <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 6, padding: 10, borderLeft: `3px solid ${card.cat.border}`, marginBottom: card.matchedRec ? 10 : 0 }}>
                              <div style={{ fontSize: 10, fontWeight: 600, color: card.cat.color, marginBottom: 4 }}>📌 상세 정보</div>
                              {card.subLines.map((sub, j) => (
                                <div key={j} style={{ fontSize: 11, color: '#333', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: `→ ${highlightChanges(sub)}` }} />
                              ))}
                            </div>
                          )}
                          {/* 추천 액션 */}
                          {card.matchedRec && (
                            <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 6, padding: 10, borderLeft: '3px solid #ab47bc' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <div style={{ fontSize: 10, fontWeight: 600, color: '#7b1fa2' }}>💡 추천 액션</div>
                                {card.matchedRec.action_type && (
                                  <span style={{
                                    fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 600,
                                    background: card.matchedRec.action_type === 'scale_up' ? '#e8f5e9' : card.matchedRec.action_type === 'defend' ? '#fff3e0' : card.matchedRec.action_type === 'optimize' ? '#e3f2fd' : '#ffebee',
                                    color: card.matchedRec.action_type === 'scale_up' ? '#2e7d32' : card.matchedRec.action_type === 'defend' ? '#e65100' : card.matchedRec.action_type === 'optimize' ? '#1565c0' : '#c62828'
                                  }}>
                                    {card.matchedRec.action_type === 'scale_up' ? '증액' : card.matchedRec.action_type === 'defend' ? '방어' : card.matchedRec.action_type === 'optimize' ? '최적화' : '감액'}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>{card.matchedRec.action}</div>
                              {card.matchedRec.context_advice && (
                                <div style={{ fontSize: 10, color: '#5e35b1', marginTop: 6, paddingTop: 6, borderTop: '1px dashed #d1c4e9', lineHeight: 1.4 }}>💬 {card.matchedRec.context_advice}</div>
                              )}
                              {card.matchedRec.expected_impact && (
                                <div style={{ fontSize: 10, color: '#2e7d32', marginTop: 4 }}>📈 {card.matchedRec.expected_impact}</div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    }) : (
                      <div style={{ background: '#f5f5f5', border: '1px solid #9e9e9e', borderRadius: 10, padding: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 16 }}>💬</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#616161' }}>정보</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--grey-900)' }}>인사이트 데이터가 없습니다.</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 탭 1: 경고 및 추천 - 원본 updateInsightsFromData() + updateRecommendations() 렌더링 그대로 복제 */}
              {insightsTab === 'alerts' && (
                <div className="insights-tab-content" style={{ display: 'block' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 300 }}>
                    {/* 주요 경고 - 원본 renderAlertCard() 그대로 복제 */}
                    <div style={{ padding: 24, borderRight: '1px solid var(--grey-200)', background: '#fafafa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid #ef5350' }}>
                        <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #ef5350 0%, #f44336 100%)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 14, filter: 'brightness(10)' }}>🚨</span>
                        </div>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--grey-900)' }}>주요 경고</span>
                          <span style={{ fontSize: 11, color: 'var(--grey-500)', fontWeight: 500, marginLeft: 8 }}>({alerts.length}건)</span>
                        </div>
                      </div>
                      <div className="insight-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {loading ? (
                          <div className="insight-card neutral">
                            <div className="insight-type">로딩</div>
                            <div className="insight-message">데이터를 불러오는 중...</div>
                          </div>
                        ) : alerts.length > 0 ? alerts.slice(0, 3).map((alert, i) => {
                          const severityColors: Record<string, { bg: string; border: string; titleColor: string }> = {
                            'high': { bg: '#ffebee', border: '#ef5350', titleColor: '#c62828' },
                            'medium': { bg: '#fff3e0', border: '#ff9800', titleColor: '#e65100' },
                            'low': { bg: '#e3f2fd', border: '#2196f3', titleColor: '#1565c0' }
                          }
                          const style = severityColors[alert.severity] || severityColors['medium']
                          return (
                            <div key={i} style={{ background: style.bg, border: `2px solid ${style.border}`, borderRadius: 10, padding: 14, transition: 'transform 0.2s' }}>
                              {/* 헤더 */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <span style={{ fontSize: 16 }}>{alert.severity === 'high' ? '🚨' : '⚠️'}</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: style.titleColor }}>{alert.title}</div>
                                  {alert.segment_value && <div style={{ fontSize: 10, color: style.titleColor, opacity: 0.8 }}>{alert.segment_type || ''} &gt; {alert.segment_value}</div>}
                                </div>
                                {alert.severity === 'high' && <span style={{ background: '#c62828', color: 'white', fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>긴급</span>}
                              </div>
                              {/* 메트릭스 배지 */}
                              {alert.actual_roas !== undefined && (
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                                  <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#333', border: `1px solid ${style.border}` }}>현재 ROAS {alert.actual_roas?.toFixed(0) || 0}%</span>
                                  <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#c62828', border: '1px solid #ef9a9a' }}>예측 ROAS {alert.forecast_roas?.toFixed(0) || 0}%</span>
                                  {alert.change_pct && <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#c62828', border: '1px solid #ef9a9a' }}>변화 {alert.change_pct > 0 ? '+' : ''}{alert.change_pct.toFixed(1)}%</span>}
                                </div>
                              )}
                              {/* 메시지 */}
                              <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: alert.action ? 10 : 0 }}>{alert.message}</div>
                              {/* 추천 액션 */}
                              {alert.action && (
                                <div style={{ background: '#ffffff', borderRadius: 6, padding: 10, borderLeft: `3px solid ${style.border}` }}>
                                  <div style={{ fontSize: 10, fontWeight: 600, color: style.titleColor, marginBottom: 4 }}>💡 추천 액션</div>
                                  <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>{alert.action}</div>
                                </div>
                              )}
                            </div>
                          )
                        }) : (
                          <div className="insight-card neutral">
                            <div className="insight-title">
                              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                              모든 지표 정상
                            </div>
                            <div className="insight-text">현재 모든 주요 항목에서 특별한 경고 사항이 없습니다.</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 투자 추천 - 원본 renderRecommendationCard() 그대로 복제 */}
                    <div style={{ padding: 24, background: '#fafafa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid #4caf50' }}>
                        <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #66bb6a 0%, #4caf50 100%)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 14, filter: 'brightness(10)' }}>💡</span>
                        </div>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--grey-900)' }}>투자 추천</span>
                          <span style={{ fontSize: 11, color: 'var(--grey-500)', fontWeight: 500, marginLeft: 8 }}>({recommendations.length}건)</span>
                        </div>
                      </div>
                      <div className="insight-content recommendation-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {loading ? (
                          <div className="insight-card neutral">
                            <div className="insight-type">로딩</div>
                            <div className="insight-message">데이터를 불러오는 중...</div>
                          </div>
                        ) : recommendations.length > 0 ? recommendations.slice(0, 3).map((rec, i) => {
                          const priorityColors: Record<number, { bg: string; border: string; titleColor: string; icon: string }> = {
                            1: { bg: '#e8f5e9', border: '#4caf50', titleColor: '#2e7d32', icon: '🥇' },
                            2: { bg: '#e3f2fd', border: '#2196f3', titleColor: '#1565c0', icon: '🥈' },
                            3: { bg: '#fff3e0', border: '#ff9800', titleColor: '#e65100', icon: '🥉' }
                          }
                          const style = priorityColors[rec.priority] || priorityColors[3]
                          const metrics = rec.metrics || {}
                          const targetTypeKr: Record<string, string> = { 'channel': '채널', 'product': '제품', 'brand': '브랜드', 'promotion': '프로모션' }
                          return (
                            <div key={i} style={{ background: style.bg, border: `2px solid ${style.border}`, borderRadius: 10, padding: 14, transition: 'transform 0.2s', cursor: 'pointer' }}>
                              {/* 헤더 */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <span style={{ fontSize: 18 }}>{style.icon}</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: style.titleColor }}>{rec.action}</div>
                                  <div style={{ fontSize: 10, color: style.titleColor, opacity: 0.8 }}>{targetTypeKr[rec.target.type] || rec.target.type} &gt; {rec.target.value}</div>
                                </div>
                                <span style={{ background: style.border, color: 'white', fontSize: 9, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>우선순위 {rec.priority}</span>
                              </div>
                              {/* 메트릭스 배지 */}
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                                {metrics.roas && <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#2e7d32', border: '1px solid #a5d6a7' }}>ROAS {metrics.roas.toFixed(0)}%</span>}
                                {metrics.cvr && <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#1565c0', border: '1px solid #90caf9' }}>CVR {metrics.cvr.toFixed(2)}%</span>}
                                {metrics.cpa && <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#5e35b1', border: '1px solid #b39ddb' }}>CPA {(metrics.cpa/1000).toFixed(1)}천원</span>}
                              </div>
                              {/* 이유 목록 */}
                              <div style={{ fontSize: 11, color: '#555', lineHeight: 1.6, marginBottom: 10 }}>
                                {rec.reasons.map((reason, j) => (
                                  <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}><span style={{ color: style.border }}>✓</span><span>{reason}</span></div>
                                ))}
                              </div>
                              {/* 예상 효과 */}
                              <div style={{ background: '#ffffff', borderRadius: 6, padding: 10, borderLeft: `3px solid ${style.border}` }}>
                                <div style={{ fontSize: 10, fontWeight: 600, color: style.titleColor, marginBottom: 4 }}>📈 예상 효과</div>
                                <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>{rec.expected_impact}</div>
                              </div>
                            </div>
                          )
                        }) : (
                          <div className="insight-card neutral">
                            <div className="insight-text">현재 특별한 투자 추천 사항이 없습니다.</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 탭 2: 기회 요소 - 원본 updateOpportunities() 렌더링 그대로 복제 */}
              {insightsTab === 'opportunities' && (
                <div className="insights-tab-content" style={{ display: 'block' }}>
                  <div style={{ padding: 24, background: '#fafafa', minHeight: 250 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid #2196f3' }}>
                      <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #42a5f5 0%, #2196f3 100%)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 14, filter: 'brightness(10)' }}>💎</span>
                      </div>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--grey-900)' }}>성장 기회 발견</span>
                      </div>
                    </div>
                    <div className="insight-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {loading ? (
                        <div className="insight-card neutral">
                          <div className="insight-message">데이터를 불러오는 중...</div>
                        </div>
                      ) : opportunities.length > 0 ? opportunities.map((opp, i) => {
                        // 기회 유형별 스타일 (원본과 동일)
                        const oppStyles: Record<string, { icon: string; bg: string; border: string; titleColor: string; label: string }> = {
                          'scale_up': { icon: '🚀', bg: '#e8f5e9', border: '#4caf50', titleColor: '#2e7d32', label: '예산 증액' },
                          'hidden_gem': { icon: '💎', bg: '#e3f2fd', border: '#2196f3', titleColor: '#1565c0', label: '숨은 보석' },
                          'growth_momentum': { icon: '📈', bg: '#fff3e0', border: '#ff9800', titleColor: '#e65100', label: '성장 모멘텀' },
                          'default': { icon: '🎯', bg: '#e8f5e9', border: '#4caf50', titleColor: '#2e7d32', label: '기회' }
                        }
                        const style = oppStyles[opp.type] || oppStyles['default']
                        const hasAction = opp.action && opp.action.trim()
                        const hasFinancial = opp.financial_impact && opp.financial_impact.trim()
                        return (
                          <div key={i} style={{ background: style.bg, border: `2px solid ${style.border}`, borderRadius: 10, padding: 14, transition: 'transform 0.2s', cursor: 'pointer' }}>
                            {/* 헤더 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <span style={{ fontSize: 18 }}>{style.icon}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: style.titleColor }}>{opp.title || '기회 요소 ' + (i + 1)}</div>
                                {opp.segment_value && <div style={{ fontSize: 10, color: style.titleColor, opacity: 0.8 }}>{opp.segment_type || ''} &gt; {opp.segment_value}</div>}
                              </div>
                              <span style={{ background: style.border, color: 'white', fontSize: 9, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{style.label}</span>
                            </div>
                            {/* 메트릭스 배지 */}
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                              {opp.roas && <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#2e7d32', border: '1px solid #a5d6a7' }}>ROAS {opp.roas.toFixed(0)}%</span>}
                              {opp.priority && <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#5e35b1', border: '1px solid #b39ddb' }}>우선순위 {opp.priority}</span>}
                              {opp.potential_uplift && <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#1565c0', border: '1px solid #90caf9' }}>+{(opp.potential_uplift/10000).toFixed(1)}만원</span>}
                            </div>
                            {/* 메시지 */}
                            <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 10 }}>{opp.message || ''}</div>
                            {/* 추천 액션 */}
                            {hasAction && (
                              <div style={{ background: '#ffffff', borderRadius: 6, padding: 10, borderLeft: `3px solid ${style.border}`, marginBottom: hasFinancial ? 8 : 0 }}>
                                <div style={{ fontSize: 10, fontWeight: 600, color: style.titleColor, marginBottom: 4 }}>💡 추천 액션</div>
                                <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>{opp.action}</div>
                              </div>
                            )}
                            {/* 재무 영향 */}
                            {hasFinancial && (
                              <div style={{ background: '#ffffff', borderRadius: 6, padding: 10, borderLeft: '3px solid #673ab7' }}>
                                <div style={{ fontSize: 10, fontWeight: 600, color: '#5e35b1', marginBottom: 4 }}>💰 기대 효과</div>
                                <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>{opp.financial_impact}</div>
                              </div>
                            )}
                          </div>
                        )
                      }) : (
                        <div className="insight-card neutral">
                          <div className="insight-text">현재 발견된 기회 요소가 없습니다.</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 탭 3: 주요 항목별 분석 (Matrix) - 원본 renderMatrixInsights() 렌더링 그대로 복제 */}
              {insightsTab === 'matrix' && (
                <div className="insights-tab-content" style={{ display: 'block' }}>
                  {/* 하위탭 버튼 */}
                  <div style={{ display: 'flex', gap: 0, background: '#f5f5f5', borderBottom: '1px solid var(--grey-200)' }}>
                    {([
                      { key: 'brand', label: '브랜드', icon: '🏷️' },
                      { key: 'channel', label: '채널', icon: '📢' },
                      { key: 'product', label: '상품', icon: '📦' },
                      { key: 'promotion', label: '프로모션', icon: '🎁' },
                    ] as const).map(tab => {
                      const insights = (matrixInsights as Record<string, MatrixInsightItem[]>)[tab.key] || []
                      return (
                        <button
                          key={tab.key}
                          className={`matrix-sub-tab ${matrixSubTab === tab.key ? 'active' : ''}`}
                          onClick={() => setMatrixSubTab(tab.key)}
                          style={{
                            flex: 1,
                            padding: '12px 16px',
                            border: 'none',
                            background: matrixSubTab === tab.key ? '#673ab7' : 'transparent',
                            color: matrixSubTab === tab.key ? 'white' : '#666',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            transition: 'all 0.2s',
                          }}
                        >
                          <span>{tab.icon}</span> {tab.label} {insights.length > 0 && <span style={{ fontSize: 10, opacity: 0.8 }}>({insights.length}건)</span>}
                        </button>
                      )
                    })}
                  </div>
                  {/* 하위탭 컨텐츠 - 원본 renderMatrixCard() 그대로 복제 */}
                  <div style={{ padding: '20px 24px', background: '#fafafa', minHeight: 350 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {loading ? (
                        <div className="insight-card neutral">
                          <div className="insight-message">데이터 로딩 중...</div>
                        </div>
                      ) : (() => {
                        const insights = ((matrixInsights as Record<string, MatrixInsightItem[]>)[matrixSubTab] || [])
                        // severity 우선순위로 정렬
                        const severityOrder: Record<string, number> = { 'critical': 0, 'high': 1, 'warning': 2, 'opportunity': 3 }
                        const sortedInsights = [...insights].sort((a, b) => (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4))

                        if (sortedInsights.length === 0) {
                          return (
                            <div className="insight-card neutral" style={{ background: '#f5f5f5', border: '1px dashed #ccc', textAlign: 'center', padding: 20 }}>
                              <div style={{ fontSize: 24, marginBottom: 8 }}>✨</div>
                              <div style={{ fontSize: 12, color: '#666' }}>해당 세그먼트의 Matrix 인사이트가 없습니다.</div>
                            </div>
                          )
                        }

                        // 4분면별 스타일 설정 (원본과 동일)
                        const matrixStyles: Record<string, { icon: string; bg: string; border: string; titleColor: string; label: string }> = {
                          'super_star': { icon: '🚀', bg: '#e8f5e9', border: '#4caf50', titleColor: '#2e7d32', label: 'Super Star' },
                          'fading_hero': { icon: '🛡️', bg: '#fff3e0', border: '#ff9800', titleColor: '#e65100', label: 'Fading Hero' },
                          'rising_potential': { icon: '🌱', bg: '#e3f2fd', border: '#2196f3', titleColor: '#1565c0', label: 'Rising Potential' },
                          'problem_child': { icon: '🗑️', bg: '#ffebee', border: '#ef5350', titleColor: '#c62828', label: 'Problem Child' }
                        }

                        const severityStyles: Record<string, { borderWidth: string; boxShadow: string }> = {
                          'critical': { borderWidth: '3px', boxShadow: '0 0 8px rgba(239, 83, 80, 0.4)' },
                          'high': { borderWidth: '2px', boxShadow: '0 0 4px rgba(239, 83, 80, 0.2)' },
                          'warning': { borderWidth: '2px', boxShadow: 'none' },
                          'opportunity': { borderWidth: '2px', boxShadow: '0 0 4px rgba(76, 175, 80, 0.2)' }
                        }

                        return sortedInsights.map((insight, i) => {
                          const style = matrixStyles[insight.sub_type] || matrixStyles['problem_child']
                          const sevStyle = severityStyles[insight.severity] || severityStyles['warning']
                          const metrics = insight.metrics || {}

                          const roas = metrics.current_roas || metrics.roas
                          const roasText = roas ? `ROAS ${roas.toLocaleString()}%` : ''
                          const growthPct = metrics.forecast_growth_pct ?? metrics.forecast_growth_rate
                          const growthText = growthPct !== undefined && growthPct !== null ? `예측 ${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(1)}%` : ''
                          const revenueShare = metrics.revenue_share_pct ?? metrics.revenue_impact_share
                          const shareText = revenueShare !== undefined && revenueShare !== null ? `매출비중 ${revenueShare.toFixed(1)}%` : ''

                          return (
                            <div key={i} style={{
                              background: style.bg,
                              border: `${sevStyle.borderWidth} solid ${style.border}`,
                              borderRadius: 10,
                              padding: 14,
                              boxShadow: sevStyle.boxShadow,
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              cursor: 'pointer'
                            }}>
                              {/* 헤더 */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                <span style={{ fontSize: 18 }}>{style.icon}</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: style.titleColor }}>{insight.segment_value}</div>
                                  <div style={{ fontSize: 10, color: style.titleColor, opacity: 0.8 }}>{style.label}</div>
                                </div>
                                {insight.severity === 'critical' && <span style={{ background: '#c62828', color: 'white', fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>CORE RISK</span>}
                              </div>
                              {/* 메트릭스 */}
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                                {roasText && <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#333', border: `1px solid ${style.border}` }}>{roasText}</span>}
                                {growthText && <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: growthPct! >= 0 ? '#2e7d32' : '#c62828', border: `1px solid ${growthPct! >= 0 ? '#a5d6a7' : '#ef9a9a'}` }}>{growthText}</span>}
                                {shareText && <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#5e35b1', border: '1px solid #b39ddb' }}>{shareText}</span>}
                              </div>
                              {/* 메시지 */}
                              <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 10 }}>{insight.message}</div>
                              {/* 액션 */}
                              <div style={{ background: '#ffffff', borderRadius: 6, padding: 10, borderLeft: `3px solid ${style.border}` }}>
                                <div style={{ fontSize: 10, fontWeight: 600, color: style.titleColor, marginBottom: 4 }}>💡 추천 액션</div>
                                <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>{insight.action}</div>
                              </div>
                            </div>
                          )
                        })
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. 최근 변화 인사이트 */}
        <div className="collapsible-section" style={{ marginBottom: 24 }}>
          <div className="collapsible-header" onClick={() => toggleCollapsible(setRecentChangesExpanded)}>
            <div className="collapsible-title">
              <span className="collapsible-icon">📈</span>
              <span>최근 변화 인사이트</span>
            </div>
            <button className={`collapsible-toggle ${recentChangesExpanded ? 'active' : ''}`}>
              <span>{recentChangesExpanded ? '접기' : '펼치기'}</span>
              <span className={`collapsible-toggle-icon ${recentChangesExpanded ? '' : 'collapsed'}`}>▼</span>
            </button>
          </div>
          <div className={`collapsible-content ${recentChangesExpanded ? 'expanded' : ''}`}>
            {/* 기간 비교 선택 - 원본과 동일 */}
            <div style={{ marginBottom: 16, padding: '14px 18px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)', borderRadius: 10, border: '1px solid #bbdefb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 16 }}>📊</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1565c0' }}>비교 기간:</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { key: '30d', label: '30일' },
                    { key: '14d', label: '14일' },
                    { key: '7d', label: '7일' },
                  ].map(period => (
                    <button
                      key={period.key}
                      className={`trend-period-btn ${trendPeriod === period.key ? 'active' : ''}`}
                      onClick={() => setTrendPeriod(period.key)}
                      style={{
                        padding: '6px 14px',
                        fontSize: 11,
                        fontWeight: 600,
                        border: `1px solid ${trendPeriod === period.key ? '#673ab7' : '#dee2e6'}`,
                        borderRadius: 20,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: trendPeriod === period.key ? '#673ab7' : 'white',
                        color: trendPeriod === period.key ? 'white' : '#495057',
                      }}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
                {/* 기간 텍스트 표시 (원본 trendPeriodText와 동일) */}
                <span style={{ fontSize: 12, color: '#37474f', marginLeft: 'auto' }}>
                  <strong style={{ color: '#1565c0' }}>{trendPeriodIndicator(trendPeriod).recent}</strong> {trendPeriodIndicator(trendPeriod).recentDates} vs <strong style={{ color: '#7b1fa2' }}>{trendPeriodIndicator(trendPeriod).previous}</strong> {trendPeriodIndicator(trendPeriod).previousDates}
                </span>
              </div>
            </div>
            <div className="compact-grid-2" style={{ marginBottom: 0 }}>
              {/* 성과 개선 분석 - 원본 updateImprovementTrends() 렌더링 그대로 복제 */}
              <div style={{ padding: 24 }}>
                <div className="insight-header">
                  <span>✨ 좋은 소식: 어떤 부분이 좋아졌나요?</span>
                </div>
                <div className="insight-content" style={{ display: 'block', maxHeight: 400, overflowY: 'auto', paddingTop: 4 }}>
                  {loading ? (
                    <div className="insight-card neutral">
                      <div className="insight-text">데이터를 불러오는 중...</div>
                    </div>
                  ) : !performanceTrends ? (
                    <div className="insight-card neutral">
                      <div className="insight-text" style={{ textAlign: 'center', padding: 20 }}>
                        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 48, height: 48, opacity: 0.5, color: 'var(--grey-500)', display: 'block', margin: '0 auto 12px auto' }}>
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm0-12h2v10h-2V5z"/>
                        </svg>
                        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--grey-700)', margin: 0, marginBottom: 4 }}>데이터 없음</p>
                        <p style={{ fontSize: 14, color: 'var(--grey-600)', margin: 0 }}>성과 트렌드 데이터가 아직 생성되지 않았습니다.</p>
                      </div>
                    </div>
                  ) : improvements(trendPeriod).length > 0 ? (
                    <div style={{ display: 'grid', gap: 12 }}>
                      {improvements(trendPeriod).map((item, i) => (
                        <div key={i} style={{ background: '#e8f5e9', border: '2px solid #4caf50', borderRadius: 10, padding: 14, transition: 'transform 0.2s' }}>
                          {/* 헤더 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 18 }}>📈</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#2e7d32' }}>{item.metric}</div>
                              <div style={{ fontSize: 10, color: '#2e7d32', opacity: 0.8 }}>{periodTextMap[trendPeriod]}</div>
                            </div>
                            <span style={{ background: '#4caf50', color: 'white', fontSize: 9, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                              +{item.change_pct.toFixed(1)}% {item.improvement_level === 'high' ? '높음' : '중간'}
                            </span>
                          </div>
                          {/* 메트릭스 배지 */}
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                            <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#1565c0', border: '1px solid #90caf9', fontWeight: 500 }}>최근 {formatNumber(item.recent_avg)}</span>
                            <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#5e35b1', border: '1px solid #b39ddb', fontWeight: 500 }}>이전 {formatNumber(item.previous_avg)}</span>
                          </div>
                          {/* 추천 액션 */}
                          <div style={{ background: '#ffffff', borderRadius: 6, padding: 10, borderLeft: '3px solid #4caf50' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#2e7d32', marginBottom: 4 }}>💡 추천 액션</div>
                            <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>{transformRecommendationText(item.recommendation, item.metric)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="insight-card neutral">
                      <div className="insight-text" style={{ textAlign: 'center', padding: 20 }}>
                        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 48, height: 48, opacity: 0.5, color: 'var(--grey-500)', display: 'block', margin: '0 auto 12px auto' }}>
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm0-12h2v10h-2V5z"/>
                        </svg>
                        <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: 'var(--grey-700)' }}>개선 사항 없음</p>
                        <p style={{ fontSize: 14, color: 'var(--grey-600)', margin: 0 }}>현재 기간에 유의미한 성과 개선이 감지되지 않았습니다.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 성과 하락 경고 - 원본 updateDeclineTrends() 렌더링 그대로 복제 */}
              <div style={{ padding: 24 }}>
                <div className="insight-header">
                  <span>⚠️ 주의 필요: 성과 하락 감지</span>
                </div>
                <div className="insight-content" style={{ display: 'block', maxHeight: 400, overflowY: 'auto', paddingTop: 4 }}>
                  {loading ? (
                    <div className="insight-card neutral">
                      <div className="insight-text">데이터를 불러오는 중...</div>
                    </div>
                  ) : !performanceTrends ? (
                    <div className="insight-card neutral">
                      <div className="insight-text" style={{ textAlign: 'center', padding: 20 }}>
                        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 48, height: 48, opacity: 0.5, color: 'var(--grey-500)', display: 'block', margin: '0 auto 12px auto' }}>
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm0-12h2v10h-2V5z"/>
                        </svg>
                        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--grey-700)', margin: 0, marginBottom: 4 }}>데이터 없음</p>
                        <p style={{ fontSize: 14, color: 'var(--grey-600)', margin: 0 }}>성과 트렌드 데이터가 아직 생성되지 않았습니다.</p>
                      </div>
                    </div>
                  ) : declines(trendPeriod).length > 0 ? (
                    <div style={{ display: 'grid', gap: 12 }}>
                      {declines(trendPeriod).map((item, i) => {
                        const isHigh = item.risk_level === 'high'
                        const bgColor = isHigh ? '#ffebee' : '#fff3e0'
                        const borderColor = isHigh ? '#f44336' : '#ff9800'
                        const textColor = isHigh ? '#c62828' : '#e65100'
                        const badgeColor = isHigh ? '#f44336' : '#ff9800'
                        return (
                          <div key={i} style={{ background: bgColor, border: `2px solid ${borderColor}`, borderRadius: 10, padding: 14, transition: 'transform 0.2s' }}>
                            {/* 헤더 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <span style={{ fontSize: 18 }}>📉</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: textColor }}>{item.metric}</div>
                                <div style={{ fontSize: 10, color: textColor, opacity: 0.8 }}>{periodTextMap[trendPeriod]}</div>
                              </div>
                              <span style={{ background: badgeColor, color: 'white', fontSize: 9, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                                {item.change_pct.toFixed(1)}% {isHigh ? '주의' : '경미'}
                              </span>
                            </div>
                            {/* 메트릭스 배지 */}
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                              <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#1565c0', border: '1px solid #90caf9', fontWeight: 500 }}>최근 {formatNumber(item.recent_avg)}</span>
                              <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#5e35b1', border: '1px solid #b39ddb', fontWeight: 500 }}>이전 {formatNumber(item.previous_avg)}</span>
                            </div>
                            {/* 추천 액션 */}
                            <div style={{ background: '#ffffff', borderRadius: 6, padding: 10, borderLeft: `3px solid ${borderColor}` }}>
                              <div style={{ fontSize: 10, fontWeight: 600, color: textColor, marginBottom: 4 }}>💡 추천 액션</div>
                              <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>{transformRecommendationText(item.recommendation, item.metric)}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="insight-card neutral">
                      <div className="insight-text" style={{ textAlign: 'center', padding: 20 }}>
                        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 48, height: 48, color: 'var(--success-main)', display: 'block', margin: '0 auto 12px auto' }}>
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: 'var(--success-main)' }}>하락 없음</p>
                        <p style={{ fontSize: 14, color: 'var(--grey-600)', margin: 0 }}>모든 지표가 안정적이거나 개선되고 있습니다.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. 예산 시뮬레이션 및 주요 항목 추이 */}
        <div className="collapsible-section">
          <div className="collapsible-header" onClick={() => toggleCollapsible(setBudgetSimExpanded)}>
            <div className="collapsible-title">
              <span className="collapsible-icon">📊</span>
              <span>예산 시뮬레이션 및 주요 항목 추이</span>
            </div>
            <button className={`collapsible-toggle ${budgetSimExpanded ? 'active' : ''}`}>
              <span>{budgetSimExpanded ? '접기' : '펼치기'}</span>
              <span className={`collapsible-toggle-icon ${budgetSimExpanded ? '' : 'collapsed'}`}>▼</span>
            </button>
          </div>
          <div className={`collapsible-content ${budgetSimExpanded ? 'expanded' : ''}`}>
            {/* 분석 타입 탭 */}
            <div className="view-type-section" style={{ marginBottom: 24 }}>
              <button
                className={`view-btn analysis-tab-btn ${analysisTab === 'budget-simulation' ? 'active' : ''}`}
                onClick={() => setAnalysisTab('budget-simulation')}
              >
                예산 시뮬레이션
              </button>
              <button
                className={`view-btn analysis-tab-btn ${analysisTab === 'segment-trend' ? 'active' : ''}`}
                onClick={() => setAnalysisTab('segment-trend')}
              >
                주요 항목 트렌드
              </button>
            </div>

            {/* 탭 1: 예산 시뮬레이션 - 원본 HTML 1:1 변환 */}
            {analysisTab === 'budget-simulation' && (
              <div className="card" style={{ padding: 24 }}>
                {/* 섹션 설명 */}
                <div style={{ fontSize: 13, color: 'var(--grey-700)', padding: 16, background: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)', lineHeight: 1.7, borderRadius: 8, marginBottom: 24 }}>
                  <strong style={{ color: '#f57c00' }}>💰 예산 시나리오 시뮬레이션이란?</strong><br />
                  주요 항목별 예산 변경 시 예상되는 <strong>매출 변화</strong>를 시뮬레이션합니다.<br />
                  <span style={{ color: 'var(--grey-600)' }}>ROAS 기반 선형 모델 + 로그 체감 수익 함수를 적용하여 현실적인 예측을 제공합니다.</span>
                </div>

                {/* 세그먼트 타입 선택 */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                    {/* 세그먼트 유형 선택 */}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)', marginBottom: 12 }}>📊 주요 항목 유형 선택</div>
                      <div className="view-type-section" style={{ marginBottom: 0 }}>
                        {[
                          { key: 'all', label: '전체' },
                          { key: 'channel', label: '채널별' },
                          { key: 'product', label: '제품별' },
                          { key: 'brand', label: '브랜드별' },
                          { key: 'promotion', label: '프로모션별' },
                        ].map(item => (
                          <button
                            key={item.key}
                            className={`view-btn simulation-segment-btn ${simSegmentType === item.key ? 'active' : ''}`}
                            onClick={() => {
                              setSimSegmentType(item.key as any)
                              setBudgetAdjustments({})
                            }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* 항목 선택 드롭다운 */}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)', marginBottom: 12 }}>
                        🎯 항목 선택 <span style={{ fontSize: 11, color: '#2e7d32', fontWeight: 600 }}>
                          {selectedSimItems.length > 0 ? `(${selectedSimItems.length}개 선택됨)` : ''}
                        </span>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => setSimItemDropdownOpen(!simItemDropdownOpen)}
                          style={{ minWidth: 220, padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}
                        >
                          <span style={{ fontWeight: 500 }}>
                            {selectedSimItems.length === 0 ? '항목을 선택하세요' :
                             selectedSimItems.length === 1 ? selectedSimItems[0] :
                             `${selectedSimItems[0]} 외 ${selectedSimItems.length - 1}개`}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{selectedSimItems.length > 0 ? `${selectedSimItems.length}개` : ''}</span>
                            <span style={{ fontSize: 10 }}>▼</span>
                          </span>
                        </button>
                        {simItemDropdownOpen && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', minWidth: 220, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}>
                            <div style={{ padding: 8 }}>
                              <div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6, zIndex: 1 }}>
                                <label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                                  <input
                                    type="checkbox"
                                    checked={selectedSimItems.length === simulationItems.length}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedSimItems(simulationItems.map(item => item.name))
                                      } else {
                                        setSelectedSimItems([])
                                      }
                                    }}
                                    style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }}
                                  />
                                  전체 선택
                                </label>
                              </div>
                              {simulationItems.map(item => (
                                <label key={item.name} style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}>
                                  <input
                                    type="checkbox"
                                    checked={selectedSimItems.includes(item.name)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedSimItems(prev => [...prev, item.name])
                                      } else {
                                        setSelectedSimItems(prev => prev.filter(n => n !== item.name))
                                      }
                                    }}
                                    style={{ marginRight: 10, width: 14, height: 14, cursor: 'pointer' }}
                                  />
                                  <span>{item.name}</span>
                                  <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--grey-500)' }}>{formatSimCurrency(item.cost)}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 세그먼트별 예산 조정 슬라이더 */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)' }}>📈 주요 항목별 예산 조정</div>
                    <button
                      className="reset-btn"
                      onClick={() => setBudgetAdjustments({})}
                    >
                      초기화
                    </button>
                  </div>
                  <div id="simulationSlidersContainer" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {simulationItems.filter(item => selectedSimItems.length === 0 || selectedSimItems.includes(item.name)).length === 0 ? (
                      <div style={{ color: 'var(--grey-600)', textAlign: 'center', padding: 20 }}>표시할 항목을 선택하세요.</div>
                    ) : (
                      simulationItems.filter(item => selectedSimItems.length === 0 || selectedSimItems.includes(item.name)).map(item => {
                        const currentAdjust = budgetAdjustments[item.name] || 0
                        const roasLevel = item.roas >= 150 ? 'high' : item.roas >= 50 ? 'medium' : 'low'
                        const fillPercent = ((currentAdjust - (-30)) / (50 - (-30))) * 100
                        const newBudget = item.cost * (1 + currentAdjust / 100)

                        return (
                          <div key={item.name} className="sim-slider-group" data-segment={item.name}>
                            <div className="sim-slider-header">
                              <div className="sim-segment-info">
                                <div className={`sim-segment-badge ${roasLevel}`}>{roasLevel === 'high' ? '고효율' : roasLevel === 'medium' ? '중효율' : '저효율'}</div>
                                <span className="sim-segment-name">{item.name}</span>
                              </div>
                              <div className="sim-segment-metrics">
                                <span className={`sim-roas-badge ${roasLevel}`}>ROAS {item.roas.toFixed(0)}%</span>
                                <span className="sim-current-budget">{formatSimCurrency(item.cost)}</span>
                              </div>
                            </div>
                            <div className="sim-slider-container">
                              <span className="sim-slider-label">-30%</span>
                              <div className="sim-slider-track">
                                <input
                                  type="range"
                                  min="-30"
                                  max="50"
                                  value={currentAdjust}
                                  step="5"
                                  className="sim-slider simulation-slider"
                                  onChange={(e) => setBudgetAdjustments(prev => ({ ...prev, [item.name]: parseInt(e.target.value) }))}
                                />
                                <div className="sim-slider-fill" style={{ width: `${fillPercent}%` }}></div>
                                <div className="sim-slider-thumb-value" style={{ left: `${fillPercent}%` }}>{currentAdjust > 0 ? '+' : ''}{currentAdjust}%</div>
                              </div>
                              <span className="sim-slider-label">+50%</span>
                            </div>
                            <div className="sim-slider-result">
                              <span className="sim-result-label">변경 예산</span>
                              <span className={`sim-result-value ${currentAdjust >= 0 ? 'positive' : 'negative'}`}>
                                {formatSimCurrency(newBudget)} <small>({currentAdjust > 0 ? '+' : ''}{currentAdjust}%)</small>
                              </span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* 시뮬레이션 결과 */}
                <div style={{ background: 'var(--grey-50)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--grey-900)', marginBottom: 16 }}>📊 시뮬레이션 결과</div>

                  {/* 결과 요약 카드 - 원본과 동일한 클래스 사용 */}
                  <div className="sim-result-cards">
                    <div className="sim-result-card">
                      <div className="sim-card-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                      </div>
                      <div className="sim-card-content">
                        <div className="sim-card-label">총 비용</div>
                        <div className="sim-card-values">
                          <span className="sim-card-before">{formatSimCurrency(simulationResults.summary.totalCurrentCost)}</span>
                          <span className="sim-card-arrow">→</span>
                          <span className="sim-card-after" style={{ color: '#8b5cf6' }}>{formatSimCurrency(simulationResults.summary.totalNewCost)}</span>
                        </div>
                        <div className="sim-card-change" style={{ color: simulationResults.summary.costChange > 0 ? '#c62828' : simulationResults.summary.costChange < 0 ? '#2e7d32' : 'var(--grey-600)' }}>
                          {simulationResults.summary.costChange >= 0 ? '+' : ''}{simulationResults.summary.costChange.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="sim-result-card highlight">
                      <div className="sim-card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      </div>
                      <div className="sim-card-content">
                        <div className="sim-card-label">예상 매출</div>
                        <div className="sim-card-values">
                          <span className="sim-card-before">{formatSimCurrency(simulationResults.summary.totalCurrentRevenue)}</span>
                          <span className="sim-card-arrow">→</span>
                          <span className="sim-card-after" style={{ color: '#10b981' }}>{formatSimCurrency(simulationResults.summary.totalNewRevenue)}</span>
                        </div>
                        <div className="sim-card-change" style={{ color: simulationResults.summary.revenueChange > 0 ? '#2e7d32' : simulationResults.summary.revenueChange < 0 ? '#c62828' : 'var(--grey-600)' }}>
                          {simulationResults.summary.revenueChange >= 0 ? '+' : ''}{simulationResults.summary.revenueChange.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="sim-result-card">
                      <div className="sim-card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
                      </div>
                      <div className="sim-card-content">
                        <div className="sim-card-label">평균 ROAS</div>
                        <div className="sim-card-values">
                          <span className="sim-card-before">{simulationResults.summary.currentRoas.toFixed(0)}%</span>
                          <span className="sim-card-arrow">→</span>
                          <span className="sim-card-after" style={{ color: '#f59e0b' }}>{simulationResults.summary.newRoas.toFixed(0)}%</span>
                        </div>
                        <div className="sim-card-change" style={{ color: simulationResults.summary.roasChange > 0 ? '#2e7d32' : simulationResults.summary.roasChange < 0 ? '#c62828' : 'var(--grey-600)' }}>
                          {simulationResults.summary.roasChange >= 0 ? '+' : ''}{simulationResults.summary.roasChange.toFixed(1)}%p
                        </div>
                      </div>
                    </div>
                    <div className="sim-result-card featured">
                      <div className="sim-card-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                      </div>
                      <div className="sim-card-content">
                        <div className="sim-card-label">투자 효율</div>
                        <div className="sim-card-value-large">{simulationResults.summary.efficiencyText}</div>
                        <div className="sim-card-subtitle">추가투자 대비 추가매출</div>
                      </div>
                    </div>
                  </div>

                  {/* 세그먼트별 상세 결과 테이블 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(103, 58, 183, 0.1))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                        <path d="M9 14l2 2 4-4"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--grey-800)' }}>주요 항목별 상세 결과</span>
                    <span style={{ fontSize: 12, color: 'var(--grey-400)', marginLeft: 'auto' }}>효율 기준: 고(150%+) / 중(50-150%) / 저(50%-)</span>
                  </div>
                  <div className="sim-table-container">
                    <table className="sim-detail-table">
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left' }}>주요 항목</th>
                          <th style={{ textAlign: 'right' }}>현재 비용</th>
                          <th style={{ textAlign: 'right' }}>변경 비용</th>
                          <th style={{ textAlign: 'right' }}>현재 매출</th>
                          <th style={{ textAlign: 'right' }}>예상 매출</th>
                          <th style={{ textAlign: 'right' }}>현재 ROAS</th>
                          <th style={{ textAlign: 'right' }}>예상 ROAS</th>
                          <th style={{ textAlign: 'center' }}>추천</th>
                        </tr>
                      </thead>
                      <tbody>
                        {simulationResults.items.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ padding: 30, textAlign: 'center', color: 'var(--grey-500)' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.5 }}>
                                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                                </svg>
                                <span>표시할 항목을 선택하세요.</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <>
                            {simulationResults.items.map((r, i) => {
                              const dotClass = r.currentRoas >= 150 ? 'high' : r.currentRoas >= 50 ? 'medium' : 'low'
                              const badgeClass = r.recommendation === '증액 추천' ? 'recommend' : r.recommendation === '유지' ? 'maintain' : r.recommendation === '효율 점검' ? 'review' : 'warning'
                              const rowClass = r.adjustment !== 0 ? 'sim-changed-row' : ''
                              const costChangeClass = r.adjustment > 0 ? 'positive' : r.adjustment < 0 ? 'negative' : 'neutral'
                              const roasClass = r.adjustedRoas >= 100 ? 'positive' : 'negative'

                              return (
                                <tr key={i} className={rowClass}>
                                  <td>
                                    <div className="sim-segment-cell">
                                      <span className={`sim-segment-dot ${dotClass}`}></span>
                                      <span>{r.segment}</span>
                                    </div>
                                  </td>
                                  <td style={{ textAlign: 'right' }}>{formatSimCurrency(r.currentCost)}</td>
                                  <td style={{ textAlign: 'right' }}>
                                    <span className={`sim-highlight-cell ${costChangeClass}`}>{formatSimCurrency(r.newCost)}</span>
                                    <span style={{ fontSize: 10, color: 'var(--grey-400)', marginLeft: 4 }}>({r.adjustment > 0 ? '+' : ''}{r.adjustment}%)</span>
                                  </td>
                                  <td style={{ textAlign: 'right' }}>{formatSimCurrency(r.currentRevenue)}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatSimCurrency(r.newRevenue)}</td>
                                  <td style={{ textAlign: 'right' }}>{r.currentRoas.toFixed(0)}%</td>
                                  <td style={{ textAlign: 'right' }}>
                                    <span className={`sim-highlight-cell ${roasClass}`}>{r.adjustedRoas.toFixed(0)}%</span>
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span className={`sim-badge ${badgeClass}`}>{r.recommendation}</span>
                                  </td>
                                </tr>
                              )
                            })}
                            {/* 총합 행 */}
                            <tr className="sim-total-row">
                              <td>
                                <div className="sim-total-cell">
                                  <div className="sim-total-icon">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <path d="M4 6h16M4 12h16M4 18h16"/>
                                    </svg>
                                  </div>
                                  <span>총합</span>
                                </div>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <span className="sim-total-value">{formatSimCurrency(simulationResults.summary.totalCurrentCost)}</span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <span className={`sim-total-value sim-highlight-cell ${simulationResults.summary.costChange > 0 ? 'positive' : simulationResults.summary.costChange < 0 ? 'negative' : 'neutral'}`}>
                                  {formatSimCurrency(simulationResults.summary.totalNewCost)}
                                </span>
                                <span style={{ fontSize: 10, color: 'var(--grey-500)', marginLeft: 4 }}>({simulationResults.summary.costChange > 0 ? '+' : ''}{simulationResults.summary.costChange.toFixed(1)}%)</span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <span className="sim-total-value">{formatSimCurrency(simulationResults.summary.totalCurrentRevenue)}</span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <span className="sim-total-value" style={{ color: '#10b981' }}>{formatSimCurrency(simulationResults.summary.totalNewRevenue)}</span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <span className="sim-total-value">{simulationResults.summary.currentRoas.toFixed(0)}%</span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <span className={`sim-total-value sim-highlight-cell ${simulationResults.summary.newRoas >= simulationResults.summary.currentRoas ? 'positive' : 'negative'}`}>{simulationResults.summary.newRoas.toFixed(0)}%</span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span style={{ fontSize: 11, color: 'var(--grey-400)' }}>—</span>
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 통합 인사이트 박스 */}
                <div className="sim-insight-box">
                  <div className="sim-insight-header">
                    <div className="sim-insight-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                      </svg>
                    </div>
                    <span className="sim-insight-title">시뮬레이션 분석</span>
                    <div className={`sim-insight-status ${simulationResults.insight.status}`}>
                      <span>{simulationResults.insight.statusText}</span>
                    </div>
                  </div>
                  <div className="sim-insight-content">
                    <div className="sim-insight-main">
                      <div className="sim-insight-main-title">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                        </svg>
                        분석 결과
                      </div>
                      <div className="sim-insight-main-text" dangerouslySetInnerHTML={{ __html: simulationResults.insight.text }}></div>
                    </div>
                    <div className="sim-insight-notes">
                      <div className="sim-insight-notes-title">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                        </svg>
                        시뮬레이션 주의사항
                      </div>
                      <ul className="sim-insight-notes-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <li>예산 증가 시 <strong>체감 수익 효과</strong>가 적용됩니다</li>
                        <li>실제 결과는 시장 상황, 경쟁에 따라 달라질 수 있습니다</li>
                        <li>본 시뮬레이션은 의사결정 <strong>참고용</strong>입니다</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 탭 2: 주요 항목 트렌드 */}
            {analysisTab === 'segment-trend' && (
              <div className="card" style={{ padding: 24 }}>
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--grey-500)' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                  <div>주요 항목 트렌드 차트</div>
                  <div style={{ fontSize: 13, marginTop: 8 }}>세그먼트별 성과 추이를 확인할 수 있습니다.</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5. 데이터 분석 알고리즘 */}
        <div className="collapsible-section">
          <div className="collapsible-header" onClick={() => toggleCollapsible(setDataAnalysisExpanded)}>
            <div className="collapsible-title">
              <span className="collapsible-icon">📊</span>
              <span>데이터 분석 알고리즘</span>
            </div>
            <button className={`collapsible-toggle ${dataAnalysisExpanded ? 'active' : ''}`}>
              <span>{dataAnalysisExpanded ? '접기' : '펼치기'}</span>
              <span className={`collapsible-toggle-icon ${dataAnalysisExpanded ? '' : 'collapsed'}`}>▼</span>
            </button>
          </div>
          <div className={`collapsible-content ${dataAnalysisExpanded ? 'expanded' : ''}`}>
            {/* 섹션 설명 */}
            <div style={{ fontSize: 13, color: 'var(--grey-700)', padding: 16, background: 'linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%)', lineHeight: 1.7, borderRadius: 8, marginBottom: 24 }}>
              <strong style={{ color: 'var(--primary-main)' }}>📖 통계 분석이란?</strong><br />
              AI 알고리즘을 활용하여 <strong>데이터의 숨겨진 패턴과 미래 트렌드</strong>를 발견합니다.<br />
              <span style={{ color: 'var(--grey-600)' }}>시계열 예측, 계절성 분석, 지표 간 상관관계를 통해 데이터 기반 의사결정을 지원합니다.</span><br /><br />
              <strong style={{ color: 'var(--primary-main)' }}>💡 어떻게 활용하나요?</strong><br />
              • <strong>예측 & 트렌드</strong>: 미래 성과를 예측하고 계절적 패턴을 파악하여 선제적 대응<br />
              • <strong>관계 & 품질</strong>: 지표 간 연관성을 이해하고 데이터 품질을 검증하여 정확한 분석
            </div>

            {/* 통계 분석 서브 탭 */}
            <div className="view-type-section" style={{ marginBottom: 24 }}>
              <button
                className={`view-btn statistics-subtab-btn ${statisticsSubTab === 'forecast-trend' ? 'active' : ''}`}
                onClick={() => setStatisticsSubTab('forecast-trend')}
              >
                📈 예측 & 트렌드
              </button>
              <button
                className={`view-btn statistics-subtab-btn ${statisticsSubTab === 'correlation-quality' ? 'active' : ''}`}
                onClick={() => setStatisticsSubTab('correlation-quality')}
              >
                🔍 관계 & 품질
              </button>
            </div>

            {/* 서브 탭 1: 예측 & 트렌드 */}
            {statisticsSubTab === 'forecast-trend' && (
              <div>
                {/* 시계열 예측 분석 */}
                <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                  <div className="visualization-title" style={{ marginBottom: 16 }}>📈 시계열 예측 분석</div>
                  <div className="img-tooltip-wrapper" style={{ marginBottom: 20 }}>
                    <img src="/visualizations/timeseries_forecast.png" alt="시계열 예측" className="visualization-img" />
                  </div>

                  {/* 예측 분석 인사이트 */}
                  <div className="insight-header" style={{ fontSize: 14, marginBottom: 12 }}>💡 예측 인사이트</div>
                  <div className="insight-content" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                    <div className="insight-card positive" style={{ borderLeftColor: 'var(--secondary-main)' }}>
                      <div className="insight-title" style={{ fontSize: 13 }}>🎯 예측 정확도</div>
                      <div className="insight-text" style={{ fontSize: 12 }}>
                        Prophet 알고리즘을 통해 <strong>95% 신뢰구간</strong>으로 향후 30일 성과를 예측합니다.
                        과거 패턴 기반의 신뢰할 수 있는 예측입니다.
                      </div>
                    </div>
                    <div className="insight-card neutral">
                      <div className="insight-title" style={{ fontSize: 13 }}>📊 추세 분석</div>
                      <div className="insight-text" style={{ fontSize: 12 }}>
                        장기 트렌드를 파악하여 <strong>성장 또는 하락 구간</strong>을 식별합니다.
                        시즌별 성과 변동을 미리 대비하세요.
                      </div>
                    </div>
                    <div className="insight-card positive">
                      <div className="insight-title" style={{ fontSize: 13 }}>⚡ 실무 활용</div>
                      <div className="insight-text" style={{ fontSize: 12 }}>
                        예측 데이터로 <strong>사전 예산 조정</strong>, <strong>재고 계획</strong>,
                        <strong>프로모션 타이밍</strong>을 최적화할 수 있습니다.
                      </div>
                    </div>
                  </div>

                  {/* 예측 해석 가이드 */}
                  <div style={{ background: 'var(--grey-50)', padding: 16, borderRadius: 8, borderLeft: '4px solid var(--secondary-main)' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--grey-900)' }}>📚 예측 차트 읽는 법</div>
                    <div style={{ display: 'grid', gap: 8, fontSize: 12, color: 'var(--grey-700)' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ color: 'var(--secondary-main)', fontWeight: 600 }}>●</span>
                        <span><strong>파란색 실선</strong>: 실제 관측된 데이터 (과거 실적)</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ color: 'var(--primary-main)', fontWeight: 600 }}>●</span>
                        <span><strong>보라색 실선</strong>: AI 모델의 예측값 (미래 예상 성과)</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ color: 'var(--grey-500)', fontWeight: 600 }}>▓</span>
                        <span><strong>음영 영역</strong>: 95% 신뢰구간 (실제 값이 이 범위에 있을 확률 95%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 계절성 분해 */}
                <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                  <div className="visualization-title" style={{ marginBottom: 16 }}>🔄 계절성 분해 분석</div>
                  <div className="img-tooltip-wrapper" style={{ marginBottom: 20 }}>
                    <img src="/visualizations/seasonal_decomposition.png" alt="계절성 분해" className="visualization-img" />
                  </div>

                  {/* 계절성 인사이트 */}
                  <div className="insight-header" style={{ fontSize: 14, marginBottom: 12 }}>💡 계절성 인사이트</div>
                  <div className="insight-content" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                    <div className="insight-card positive">
                      <div className="insight-title" style={{ fontSize: 13 }}>📈 Trend (추세)</div>
                      <div className="insight-text" style={{ fontSize: 12 }}>
                        장기적인 <strong>상승/하락 방향</strong>을 보여줍니다.
                        전체적인 비즈니스 성장세를 파악할 수 있습니다.
                      </div>
                    </div>
                    <div className="insight-card neutral">
                      <div className="insight-title" style={{ fontSize: 13 }}>🔄 Seasonal (계절성)</div>
                      <div className="insight-text" style={{ fontSize: 12 }}>
                        <strong>주기적으로 반복되는 패턴</strong>을 식별합니다.
                        월별, 요일별 성과 변동을 예측할 수 있습니다.
                      </div>
                    </div>
                    <div className="insight-card positive" style={{ borderLeftColor: 'var(--warning-main)' }}>
                      <div className="insight-title" style={{ fontSize: 13 }}>📊 Residual (잔차)</div>
                      <div className="insight-text" style={{ fontSize: 12 }}>
                        추세와 계절성으로 설명되지 않는 <strong>불규칙한 변동</strong>입니다.
                        이상 이벤트나 외부 요인을 파악하세요.
                      </div>
                    </div>
                  </div>

                  {/* 실무 활용 팁 */}
                  <div style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%)', padding: 16, borderRadius: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--primary-main)' }}>🎯 실무 활용 팁</div>
                    <div style={{ display: 'grid', gap: 8, fontSize: 12, color: 'var(--grey-700)' }}>
                      <div><strong>✓ 계절성 패턴 활용</strong>: 성수기/비수기를 미리 파악하여 예산과 재고를 사전 조정</div>
                      <div><strong>✓ 추세 기반 전략</strong>: 상승 추세 시 공격적 투자, 하락 추세 시 효율성 개선에 집중</div>
                      <div><strong>✓ 잔차 분석</strong>: 큰 변동이 발생한 시점을 찾아 특별한 이벤트나 캠페인 효과 분석</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 서브 탭 2: 관계 & 품질 */}
            {statisticsSubTab === 'correlation-quality' && (
              <div>
                {/* 상관관계 히트맵 */}
                <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                  <div className="visualization-title" style={{ marginBottom: 16 }}>🔗 상관관계 히트맵</div>
                  <div className="img-tooltip-wrapper" style={{ marginBottom: 20, maxWidth: '70%', marginLeft: 'auto', marginRight: 'auto' }}>
                    <img src="/visualizations/correlation_heatmap.png" alt="상관관계" className="visualization-img" />
                  </div>

                  {/* 상관관계 인사이트 */}
                  <div className="insight-header" style={{ fontSize: 14, marginBottom: 12 }}>💡 상관관계 인사이트</div>
                  <div className="insight-content" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                    <div className="insight-card positive">
                      <div className="insight-title" style={{ fontSize: 13 }}>🔴 강한 양의 상관</div>
                      <div className="insight-text" style={{ fontSize: 12 }}>
                        진한 빨간색(+0.7 이상)은 <strong>함께 증가하는 관계</strong>입니다.
                        예: 비용↑ → 전환수↑
                      </div>
                    </div>
                    <div className="insight-card neutral">
                      <div className="insight-title" style={{ fontSize: 13 }}>🔵 강한 음의 상관</div>
                      <div className="insight-text" style={{ fontSize: 12 }}>
                        진한 파란색(-0.7 이하)은 <strong>반대로 움직이는 관계</strong>입니다.
                        예: CPA↑ → ROAS↓
                      </div>
                    </div>
                    <div className="insight-card positive" style={{ borderLeftColor: 'var(--warning-main)' }}>
                      <div className="insight-title" style={{ fontSize: 13 }}>⚪ 약한 상관</div>
                      <div className="insight-text" style={{ fontSize: 12 }}>
                        연한 색(-0.3 ~ +0.3)은 <strong>독립적인 관계</strong>입니다.
                        서로 영향을 주지 않는 지표입니다.
                      </div>
                    </div>
                  </div>

                  {/* 상관관계 활용 가이드 */}
                  <div style={{ background: 'var(--grey-50)', padding: 16, borderRadius: 8, borderLeft: '4px solid var(--success-main)' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--grey-900)' }}>📚 상관관계 활용 전략</div>
                    <div style={{ display: 'grid', gap: 8, fontSize: 12, color: 'var(--grey-700)' }}>
                      <div><strong>1. 레버리지 지표 발견</strong>: 전환수/매출과 강한 양의 상관관계를 가진 지표에 집중 투자</div>
                      <div><strong>2. 비효율 요인 제거</strong>: 비용과 강한 양의 상관이지만 매출과 약한 상관인 채널은 재검토</div>
                      <div><strong>3. 다변량 최적화</strong>: 여러 지표 간 관계를 고려한 종합적인 마케팅 전략 수립</div>
                    </div>
                  </div>
                </div>

                {/* 이상치 & 데이터 분포 */}
                <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                    {/* 왼쪽: 이상치 분석 */}
                    <div>
                      <div className="visualization-title" style={{ marginBottom: 16, textAlign: 'center' }}>⚠️ 이상치 분석</div>
                      <div className="img-tooltip-wrapper">
                        <img src="/visualizations/boxplot_outliers.png" alt="이상치 분석" className="visualization-img" />
                      </div>
                    </div>

                    {/* 오른쪽: 데이터 분포 */}
                    <div>
                      <div className="visualization-title" style={{ marginBottom: 16, textAlign: 'center' }}>📊 데이터 분포 분석</div>
                      <div className="img-tooltip-wrapper">
                        <img src="/visualizations/distribution_analysis.png" alt="분포 분석" className="visualization-img" />
                      </div>
                    </div>
                  </div>

                  {/* 데이터 품질 인사이트 */}
                  <div className="insight-header" style={{ fontSize: 14, marginBottom: 12 }}>💡 데이터 품질 인사이트</div>
                  <div className="insight-content" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
                    <div className="insight-card negative">
                      <div className="insight-title" style={{ fontSize: 13 }}>⚠️ 이상치 탐지</div>
                      <div className="insight-text" style={{ fontSize: 12 }}>
                        박스플롯에서 <strong>상자 밖의 점</strong>은 이상치입니다.
                        데이터 오류인지, 특별한 이벤트인지 확인하세요.
                        <div style={{ marginTop: 8, padding: 8, background: 'var(--error-light)', borderRadius: 4 }}>
                          <strong>체크포인트</strong>: 이상치가 5% 이상이면 데이터 품질 재검토 필요
                        </div>
                      </div>
                    </div>
                    <div className="insight-card positive" style={{ borderLeftColor: 'var(--secondary-main)' }}>
                      <div className="insight-title" style={{ fontSize: 13 }}>📊 분포 패턴</div>
                      <div className="insight-text" style={{ fontSize: 12 }}>
                        히스토그램이 <strong>종 모양</strong>이면 정규분포입니다.
                        편향되거나 여러 봉우리가 있다면 주요 항목 분리를 고려하세요.
                        <div style={{ marginTop: 8, padding: 8, background: 'var(--secondary-light)', borderRadius: 4 }}>
                          <strong>TIP</strong>: 정규분포일수록 예측 모델의 정확도가 높아집니다
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 데이터 품질 체크리스트 */}
                  <div style={{ background: 'linear-gradient(135deg, #fff4f0 0%, #ffebe8 100%)', padding: 16, borderRadius: 8, borderLeft: '4px solid var(--error-main)' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--error-main)' }}>🔍 데이터 품질 체크리스트</div>
                    <div style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--grey-700)' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ color: 'var(--error-main)' }}>□</span>
                        <span>이상치 비율이 5% 미만인가?</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ color: 'var(--error-main)' }}>□</span>
                        <span>데이터 분포가 예상 범위 내에 있는가?</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ color: 'var(--error-main)' }}>□</span>
                        <span>이상치 발생 시점에 특별 이벤트가 있었는가?</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ color: 'var(--error-main)' }}>□</span>
                        <span>결측치나 0값이 비정상적으로 많지 않은가?</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
