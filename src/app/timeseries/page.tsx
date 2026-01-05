'use client'

import { useState, useEffect } from 'react'

// KPI 데이터 타입
interface KPIData {
  label: string
  value: string
  unit?: string
  trend?: { direction: 'up' | 'down' | 'neutral'; value: string }
  color: string
  icon: string
  highlight?: boolean
}

// 인사이트 카드 타입
interface InsightCard {
  type: string
  message: string
  value?: string
  priority?: 'high' | 'medium' | 'low' | 'positive' | 'negative' | 'neutral' | 'opportunity'
}

// AI 상태 요약 카드 데이터
const summaryCardData = {
  status_title: '📈 성장세 지속',
  status_message: '전반적인 마케팅 성과가 양호하며, 예측 ROAS가 상승 추세를 보이고 있습니다.',
  period: '분석 기간: 최근 30일 기준',
  status_color: 'green' as const,
  metrics: {
    current_revenue: '₩152,000,000',
    forecast_revenue: '₩178,500,000',
    revenue_change_pct: 17.4,
    current_roas: 336,
    forecast_roas: 385,
    roas_change_val: 49
  }
}

// KPI 데이터 (주요 성과 - 5개)
const primaryKPIs: KPIData[] = [
  { label: '예측 비용', value: '₩48,500,000', unit: '원', trend: { direction: 'up', value: '+7.2%' }, color: '#673ab7', icon: '💰', highlight: false },
  { label: '예측 ROAS', value: '385%', unit: '%', trend: { direction: 'up', value: '+14.6%' }, color: '#673ab7', icon: '📈', highlight: true },
  { label: '예측 CPA', value: '₩9,230', unit: '원', trend: { direction: 'down', value: '-7.8%' }, color: '#673ab7', icon: '🎯', highlight: false },
  { label: '예측 CPC', value: '₩128', unit: '원', trend: { direction: 'down', value: '-7.9%' }, color: '#673ab7', icon: '🖱️', highlight: false },
  { label: '예측 CPM', value: '₩3,480', unit: '원', trend: { direction: 'down', value: '-4.2%' }, color: '#673ab7', icon: '👁️', highlight: false }
]

// KPI 데이터 (세부 성과 - 4개)
const secondaryKPIs: KPIData[] = [
  { label: '예측 노출', value: '13,940,000', unit: '회', trend: { direction: 'up', value: '+12.0%' }, color: '#9e9e9e', icon: '👀', highlight: false },
  { label: '예측 클릭', value: '378,900', unit: '회', trend: { direction: 'up', value: '+16.6%' }, color: '#9e9e9e', icon: '👆', highlight: false },
  { label: '예측 전환수', value: '5,255', unit: '건', trend: { direction: 'up', value: '+16.3%' }, color: '#9e9e9e', icon: '✅', highlight: false },
  { label: '예측 전환값', value: '₩178,500,000', unit: '원', trend: { direction: 'up', value: '+17.4%' }, color: '#9e9e9e', icon: '💵', highlight: false }
]

// 카테고리 정의 (원본 HTML과 동일)
const summaryCategories = {
  performance: { icon: '📊', bg: '#e3f2fd', border: '#1976d2', color: '#1565c0', label: '성과 현황' },
  trend_up: { icon: '📈', bg: '#e8f5e9', border: '#43a047', color: '#2e7d32', label: '상승 트렌드' },
  trend_down: { icon: '📉', bg: '#ffebee', border: '#e53935', color: '#c62828', label: '하락 트렌드' },
  warning: { icon: '⚠️', bg: '#fff3e0', border: '#fb8c00', color: '#e65100', label: '주의 필요' },
  recommend: { icon: '💡', bg: '#f3e5f5', border: '#ab47bc', color: '#7b1fa2', label: '추천 액션' },
  review: { icon: '🔍', bg: '#e8eaf6', border: '#5c6bc0', color: '#3949ab', label: '검토 대상' },
}

// 기간별 인사이트 데이터
const summaryInsightsByPeriod: Record<'full' | '180d' | '90d' | '30d', Array<{
  category: typeof summaryCategories[keyof typeof summaryCategories]
  message: string
  subLines: string[]
  recommendation: { action: string; expectedImpact?: string; contextAdvice?: string } | null
}>> = {
  full: [
    {
      category: summaryCategories.performance,
      message: 'ROAS가 전월 대비 5.6% 상승하여 336%를 기록했습니다.',
      subLines: ['전환수 +22.1% 증가', '전환값 +18.7% 증가'],
      recommendation: {
        action: 'Meta Ads 리타게팅 캠페인 예산 20% 증액 권장',
        expectedImpact: 'ROAS 420% 이상 유지 가능'
      }
    },
    {
      category: summaryCategories.warning,
      message: 'Meta Ads CPM이 15% 상승하여 비용 효율성 모니터링이 필요합니다.',
      subLines: ['CPM ₩4,200 → ₩4,830', '노출 대비 클릭률 하락 추세'],
      recommendation: {
        action: '타겟 오디언스 세분화 및 크리에이티브 A/B 테스트 진행',
        contextAdvice: '25-34세 여성 타겟 집중 권장',
        expectedImpact: 'CPM 10% 절감 기대'
      }
    },
    {
      category: summaryCategories.recommend,
      message: 'Google Ads 전환 캠페인 예산 20% 증액을 권장합니다.',
      subLines: ['현재 ROAS 420% 유지 중', 'CPA ₩8,500 목표 달성 가능'],
      recommendation: null
    },
  ],
  '180d': [
    {
      category: summaryCategories.trend_up,
      message: '180일 기준 ROAS가 12.3% 상승하여 장기 성장세를 보이고 있습니다.',
      subLines: ['평균 전환수 +18.5% 증가', '누적 전환값 +₩2.1억'],
      recommendation: {
        action: '현재 캠페인 전략 유지 및 예산 점진적 확대',
        expectedImpact: '연말까지 ROAS 400% 달성 가능'
      }
    },
    {
      category: summaryCategories.performance,
      message: '상반기 마케팅 효율이 전년 동기 대비 개선되었습니다.',
      subLines: ['CPA 15% 절감', 'CTR 0.3%p 상승'],
      recommendation: {
        action: '하반기 공격적 예산 배분 검토',
        expectedImpact: '목표 매출 120% 달성 예상'
      }
    },
    {
      category: summaryCategories.review,
      message: 'Naver 검색광고 효율이 정체되어 전략 재검토가 필요합니다.',
      subLines: ['ROAS 180% 유지 (목표 대비 -10%)', '경쟁 입찰가 상승 추세'],
      recommendation: null
    },
  ],
  '90d': [
    {
      category: summaryCategories.performance,
      message: '90일 기준 전환 효율이 크게 개선되었습니다.',
      subLines: ['전환수 +25.3% 증가', 'CPA 12% 절감'],
      recommendation: {
        action: 'Meta Ads 전환 캠페인 확대',
        expectedImpact: '월 추가 매출 +₩2,500만'
      }
    },
    {
      category: summaryCategories.warning,
      message: '최근 90일간 CPM 상승세가 지속되고 있습니다.',
      subLines: ['CPM +18% 상승', '노출 효율 하락'],
      recommendation: {
        action: '크리에이티브 리프레시 및 타겟 최적화',
        expectedImpact: 'CPM 8% 절감 기대'
      }
    },
    {
      category: summaryCategories.trend_up,
      message: 'Google Ads 검색 캠페인이 안정적 성과를 보이고 있습니다.',
      subLines: ['ROAS 320% 유지', '품질점수 평균 8.2'],
      recommendation: null
    },
  ],
  '30d': [
    {
      category: summaryCategories.trend_up,
      message: '최근 30일 전환율이 급상승했습니다.',
      subLines: ['CVR +0.8%p 상승 (2.1% → 2.9%)', '신규 고객 전환 비중 증가'],
      recommendation: {
        action: '리마케팅 오디언스 확장',
        expectedImpact: '추가 전환 +15% 기대'
      }
    },
    {
      category: summaryCategories.warning,
      message: '최근 30일 Meta Ads 노출수가 감소하고 있습니다.',
      subLines: ['노출수 -12%', '경쟁 심화로 인한 도달 감소'],
      recommendation: {
        action: '입찰 전략 재검토 및 타겟 확장',
        contextAdvice: '유사 오디언스 1-3% 테스트',
        expectedImpact: '노출 회복 및 도달 확대'
      }
    },
    {
      category: summaryCategories.recommend,
      message: '프로모션 시즌에 맞춘 예산 증액을 권장합니다.',
      subLines: ['계절적 수요 증가 예상', '경쟁사 광고비 증가 추세'],
      recommendation: null
    },
  ]
}

// 경고 데이터 (severity 기반)
const alertInsights = [
  {
    severity: 'high' as const,
    title: 'Meta Ads ROAS 하락 예상',
    segment: '채널 > Meta Ads',
    message: 'Meta Ads CPM이 15% 상승하여 ROAS가 하락할 것으로 예측됩니다.',
    metrics: { currentRoas: 420, forecastRoas: 380, change: -9.5 },
    action: '타겟 오디언스 세분화 및 크리에이티브 A/B 테스트 진행'
  },
  {
    severity: 'medium' as const,
    title: 'Google Ads CTR 저조',
    segment: '채널 > Google Ads',
    message: 'Google Ads CTR이 기준치(2%) 미달로 효율 개선이 필요합니다.',
    metrics: { currentRoas: 280, forecastRoas: 260, change: -7.1 },
    action: '광고 문구 및 랜딩페이지 최적화'
  },
  {
    severity: 'low' as const,
    title: '예산 소진율 높음',
    segment: '채널 > Naver',
    message: '네이버 키워드광고 예산 소진율 95%로 추가 예산 검토 필요합니다.',
    metrics: null,
    action: null
  },
]

// 추천 데이터 (원본 HTML 구조와 동일)
const recommendationInsights = [
  {
    priority: 1,
    action: '리타게팅 캠페인 예산 20% 증액',
    target: { type: 'channel', value: 'Meta Ads' },
    metrics: { roas: 420, cvr: 2.5, cpa: 15000 },
    reasons: ['ROAS 420% 유지 중으로 투자 대비 수익성 우수', '전환율 상승 추세 (+0.5%p)'],
    expected_impact: '예상 추가 매출 +₩15,000,000'
  },
  {
    priority: 2,
    action: '전환 캠페인 입찰가 10% 상향',
    target: { type: 'channel', value: 'Google Ads' },
    metrics: { roas: 280, cvr: 1.8, cpa: 10500 },
    reasons: ['CPA ₩8,500 목표 달성 가능', '클릭률 개선 여지 존재'],
    expected_impact: '전환수 15% 증가 기대'
  },
  {
    priority: 3,
    action: '신규 오디언스 테스트',
    target: { type: 'channel', value: '카카오모먼트' },
    metrics: { roas: 180, cvr: 1.2 },
    reasons: ['25-34세 여성 타겟 전환율 상승 추세', '신규 세그먼트 발굴 필요'],
    expected_impact: '잠재 도달 +150만'
  },
]

// 기회 요소 데이터 (원본 HTML 구조와 동일)
const opportunityInsights = [
  {
    type: 'scale_up' as const,
    title: 'Meta Ads 리타게팅 예산 증액',
    segment_type: '채널',
    segment_value: 'Meta Ads',
    roas: 420,
    priority: 1,
    potential_uplift: 150000000,
    message: 'ROAS 420%로 고효율 유지 중이며, 예산 증액 시 추가 매출 확보 가능합니다.',
    action: '리타게팅 캠페인 예산 20% 증액 권장',
    financial_impact: '월 예상 추가 매출 +₩15,000,000'
  },
  {
    type: 'hidden_gem' as const,
    title: '25-34세 여성 타겟 발굴',
    segment_type: '타겟',
    segment_value: '25-34세 여성',
    roas: 380,
    priority: 2,
    potential_uplift: 80000000,
    message: '해당 세그먼트의 전환율이 4.2%로 평균 대비 0.8%p 높습니다.',
    action: '해당 타겟 전용 크리에이티브 제작 및 예산 배분',
    financial_impact: '예상 CVR +0.8%p 개선'
  },
  {
    type: 'growth_momentum' as const,
    title: '주말 저녁 시간대 성과',
    segment_type: '시간대',
    segment_value: '주말 18-22시',
    roas: 450,
    priority: 3,
    message: '주말 저녁 시간대 ROAS 450%로 최고 효율을 기록 중입니다.',
    action: '해당 시간대 입찰가 상향 및 예산 집중',
    financial_impact: null
  },
]

// 성과 트렌드 데이터 (원본 HTML 구조와 동일)
const performanceTrendsData = {
  improvements: [
    {
      metric: '전환율 (CVR)',
      change_pct: 15.2,
      improvement_level: 'high',
      recent_avg: 3.8,
      previous_avg: 3.3,
      recommendation: '전환율이 크게 개선되었습니다. 현재 캠페인 설정을 유지하고, 성과가 좋은 광고 소재를 다른 캠페인에도 확대 적용해보세요.'
    },
    {
      metric: 'ROAS',
      change_pct: 8.5,
      improvement_level: 'medium',
      recent_avg: 336,
      previous_avg: 310,
      recommendation: '광고 수익률이 상승했습니다. 예산 증액을 고려하여 성과를 극대화하세요.'
    },
  ],
  declines: [
    {
      metric: 'CPM (노출 비용)',
      change_pct: -12.3,
      risk_level: 'high',
      recent_avg: 4830,
      previous_avg: 4200,
      recommendation: '노출 비용이 상승했습니다. 타겟 오디언스 재설정 및 입찰 전략 조정을 검토하세요.'
    },
    {
      metric: 'CTR (클릭률)',
      change_pct: -5.8,
      risk_level: 'medium',
      recent_avg: 2.1,
      previous_avg: 2.23,
      recommendation: '클릭률이 소폭 하락했습니다. 광고 소재 리프레시 및 A/B 테스트를 진행해보세요.'
    },
  ],
}

// 시뮬레이션 세그먼트 데이터 (유형별)
const simulationSegmentData: Record<string, { name: string; badge: 'high' | 'medium' | 'low'; roas: number; currentBudget: number; budgetRatio: number }[]> = {
  all: [
    { name: '전체', badge: 'high', roas: 336, currentBudget: 45000000, budgetRatio: 100 },
  ],
  channel: [
    { name: 'Meta Ads', badge: 'high', roas: 420, currentBudget: 15000000, budgetRatio: 100 },
    { name: 'Google Ads', badge: 'medium', roas: 280, currentBudget: 12000000, budgetRatio: 100 },
    { name: 'Kakao Moment', badge: 'low', roas: 180, currentBudget: 8000000, budgetRatio: 100 },
    { name: 'Naver', badge: 'medium', roas: 320, currentBudget: 10000000, budgetRatio: 100 },
  ],
  product: [
    { name: '제품 A', badge: 'high', roas: 450, currentBudget: 18000000, budgetRatio: 100 },
    { name: '제품 B', badge: 'medium', roas: 290, currentBudget: 14000000, budgetRatio: 100 },
    { name: '제품 C', badge: 'low', roas: 165, currentBudget: 8000000, budgetRatio: 100 },
    { name: '제품 D', badge: 'medium', roas: 310, currentBudget: 5000000, budgetRatio: 100 },
  ],
  brand: [
    { name: '브랜드 A', badge: 'high', roas: 480, currentBudget: 20000000, budgetRatio: 100 },
    { name: '브랜드 B', badge: 'medium', roas: 260, currentBudget: 15000000, budgetRatio: 100 },
    { name: '브랜드 C', badge: 'low', roas: 150, currentBudget: 10000000, budgetRatio: 100 },
  ],
  promotion: [
    { name: '신년 프로모션', badge: 'high', roas: 520, currentBudget: 12000000, budgetRatio: 100 },
    { name: '겨울 시즌', badge: 'medium', roas: 340, currentBudget: 18000000, budgetRatio: 100 },
    { name: '회원가입 이벤트', badge: 'medium', roas: 280, currentBudget: 8000000, budgetRatio: 100 },
    { name: '리타게팅', badge: 'high', roas: 450, currentBudget: 7000000, budgetRatio: 100 },
  ],
}

// Matrix 분석 데이터 (원본 HTML 구조와 동일 - 4분면 분류)
const matrixInsightsData: Record<string, Array<{
  sub_type: 'super_star' | 'fading_hero' | 'rising_potential' | 'problem_child'
  severity: 'critical' | 'high' | 'warning' | 'opportunity'
  segment_value: string
  metrics: { current_roas?: number; forecast_growth_pct?: number; revenue_share_pct?: number }
  message: string
  action: string
}>> = {
  brand: [
    {
      sub_type: 'super_star',
      severity: 'opportunity',
      segment_value: '브랜드 A',
      metrics: { current_roas: 480, forecast_growth_pct: 25.5, revenue_share_pct: 35.2 },
      message: '고효율 + 고성장 세그먼트입니다. 현재 성과가 매우 우수하며 성장세도 지속되고 있습니다.',
      action: '예산을 적극 증액하여 성장 모멘텀을 유지하세요.'
    },
    {
      sub_type: 'fading_hero',
      severity: 'warning',
      segment_value: '브랜드 B',
      metrics: { current_roas: 320, forecast_growth_pct: -5.2, revenue_share_pct: 28.1 },
      message: '효율은 좋지만 성장세가 둔화되고 있습니다. 현재 수익을 방어해야 합니다.',
      action: '새로운 크리에이티브 테스트 및 타겟 확장을 검토하세요.'
    },
    {
      sub_type: 'problem_child',
      severity: 'high',
      segment_value: '브랜드 C',
      metrics: { current_roas: 150, forecast_growth_pct: -12.3, revenue_share_pct: 8.5 },
      message: '효율과 성장률 모두 저조합니다. 전략 재검토가 필요합니다.',
      action: '예산 축소 또는 캠페인 일시 중단을 검토하세요.'
    },
  ],
  channel: [
    {
      sub_type: 'super_star',
      severity: 'opportunity',
      segment_value: 'Meta Ads',
      metrics: { current_roas: 420, forecast_growth_pct: 18.3, revenue_share_pct: 42.5 },
      message: 'ROAS 420%로 최고 효율을 유지하며 성장세도 견조합니다.',
      action: '리타게팅 캠페인 예산 20% 증액을 권장합니다.'
    },
    {
      sub_type: 'rising_potential',
      severity: 'warning',
      segment_value: 'Google Ads',
      metrics: { current_roas: 280, forecast_growth_pct: 32.1, revenue_share_pct: 25.3 },
      message: '효율은 평균이지만 성장 잠재력이 큽니다.',
      action: '입찰 전략 최적화로 효율을 끌어올리세요.'
    },
    {
      sub_type: 'problem_child',
      severity: 'critical',
      segment_value: 'Kakao Moment',
      metrics: { current_roas: 180, forecast_growth_pct: -8.5, revenue_share_pct: 12.2 },
      message: '효율과 성장률 모두 하락 추세입니다. 긴급 조치가 필요합니다.',
      action: '타겟팅 재설정 및 크리에이티브 전면 교체를 권장합니다.'
    },
  ],
  product: [
    {
      sub_type: 'super_star',
      severity: 'opportunity',
      segment_value: '제품 A',
      metrics: { current_roas: 450, forecast_growth_pct: 22.8, revenue_share_pct: 38.5 },
      message: '주력 제품으로 효율과 성장률 모두 우수합니다.',
      action: '마케팅 예산 우선 배분 대상입니다.'
    },
    {
      sub_type: 'fading_hero',
      severity: 'warning',
      segment_value: '제품 B',
      metrics: { current_roas: 290, forecast_growth_pct: -3.2, revenue_share_pct: 22.1 },
      message: '안정적인 효율이지만 성장 정체 상태입니다.',
      action: '신규 타겟 발굴 및 프로모션 기획을 검토하세요.'
    },
  ],
  promotion: [
    {
      sub_type: 'super_star',
      severity: 'opportunity',
      segment_value: '신년 프로모션',
      metrics: { current_roas: 520, forecast_growth_pct: 45.2 },
      message: '시즌 프로모션 중 최고 성과를 기록 중입니다.',
      action: '성공 요인 분석 후 다음 캠페인에 적용하세요.'
    },
    {
      sub_type: 'rising_potential',
      severity: 'warning',
      segment_value: '리타게팅 캠페인',
      metrics: { current_roas: 380, forecast_growth_pct: 28.5, revenue_share_pct: 18.3 },
      message: '성장 잠재력이 높은 캠페인입니다.',
      action: '예산 증액 및 세그먼트 확장을 검토하세요.'
    },
  ],
}

export default function TimeseriesAnalysis() {
  const [kpiView, setKpiView] = useState<'primary' | 'all'>('primary')
  const [collapsibleStates, setCollapsibleStates] = useState({
    insights: false,
    recentChanges: false,
    simulation: false,
    dataAnalysis: false,
  })
  const [activeInsightTab, setActiveInsightTab] = useState<'summary' | 'alerts' | 'opportunities' | 'matrix'>('summary')
  const [activeMatrixTab, setActiveMatrixTab] = useState<'brand' | 'channel' | 'product' | 'promotion'>('brand')
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'budget-simulation' | 'segment-trend'>('budget-simulation')
  const [activeStatisticsTab, setActiveStatisticsTab] = useState<'forecast-trend' | 'correlation-quality'>('forecast-trend')
  const [aiPeriod, setAiPeriod] = useState<'full' | '180d' | '90d' | '30d'>('full')
  const [trendPeriod, setTrendPeriod] = useState<'30d' | '14d' | '7d'>('7d')
  const [simSegmentType, setSimSegmentType] = useState<'all' | 'channel' | 'product' | 'brand' | 'promotion'>('all')
  const [simulationBudgets, setSimulationBudgets] = useState<Record<string, number>>({})
  const [simSelectedItems, setSimSelectedItems] = useState<string[]>([])
  const [simDropdownOpen, setSimDropdownOpen] = useState(false)

  // 현재 선택된 세그먼트 타입의 데이터
  const currentSegments = simulationSegmentData[simSegmentType] || []

  // 세그먼트 타입 변경 시 데이터 초기화
  const handleSimSegmentTypeChange = (type: typeof simSegmentType) => {
    setSimSegmentType(type)
    const segments = simulationSegmentData[type] || []
    setSimSelectedItems(segments.map(s => s.name))
    const newBudgets: Record<string, number> = {}
    segments.forEach(s => { newBudgets[s.name] = 100 })
    setSimulationBudgets(newBudgets)
  }

  // 초기화 (마운트 시)
  useEffect(() => {
    handleSimSegmentTypeChange('all')
  }, [])

  // 토글 핸들러
  const toggleCollapsible = (key: keyof typeof collapsibleStates) => {
    setCollapsibleStates(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // 시뮬레이션 계산
  const calculateSimulation = () => {
    let totalCost = 0
    let totalRevenue = 0
    const filteredSegments = currentSegments.filter(seg => simSelectedItems.includes(seg.name))
    filteredSegments.forEach((seg) => {
      const budgetRatio = simulationBudgets[seg.name] ?? 100
      const newBudget = seg.currentBudget * (budgetRatio / 100)
      totalCost += newBudget
      // 로그 체감 수익 함수 적용
      const multiplier = budgetRatio <= 100
        ? budgetRatio / 100
        : 1 + Math.log(budgetRatio / 100) * 0.5
      totalRevenue += seg.currentBudget * (seg.roas / 100) * multiplier
    })
    return {
      totalCost,
      totalRevenue,
      roas: totalCost > 0 ? (totalRevenue / totalCost) * 100 : 0,
    }
  }

  const simResult = calculateSimulation()

  // 인사이트 카드 스타일 결정
  const getInsightCardStyle = (priority: string) => {
    switch (priority) {
      case 'positive':
      case 'low':
        return 'bg-gradient-to-br from-[#e8f5e9] to-[#f1f8e9] border-l-[#00c853]'
      case 'negative':
      case 'high':
        return 'bg-gradient-to-br from-[#ffebee] to-[#fce4ec] border-l-[#ff1744]'
      case 'medium':
      case 'neutral':
        return 'bg-gradient-to-br from-[#fff8e1] to-[#fff3e0] border-l-[#ffab00]'
      case 'opportunity':
        return 'bg-gradient-to-br from-[#e3f2fd] to-[#e1f5fe] border-l-[#2196f3]'
      default:
        return 'bg-[#fafafa] border-l-[#673ab7]'
    }
  }

  return (
    <div className="space-y-[24px]">
      {/* 헤더 */}
      <div className="mb-[24px]">
        <h1 className="text-[24px] font-bold text-[#212121] m-0">시계열 데이터 분석</h1>
        <div className="text-[14px] text-[#9e9e9e] mt-[4px]">
          AI 기반 예측 모델을 통한 광고 성과 예측 및 인사이트 <strong>(향후 30일 예측)</strong>
        </div>
      </div>

      {/* AI 상태 요약 카드 */}
      <div style={{
        marginBottom: '24px',
        background: summaryCardData.status_color === 'green' ? '#e8f5e9' :
                    summaryCardData.status_color === 'blue' ? '#e3f2fd' :
                    summaryCardData.status_color === 'yellow' ? '#fff8e1' : '#ffebee',
        borderLeft: `4px solid ${
          summaryCardData.status_color === 'green' ? '#4caf50' :
          summaryCardData.status_color === 'blue' ? '#2196f3' :
          summaryCardData.status_color === 'yellow' ? '#ffc107' : '#f44336'
        }`,
        borderRadius: '12px',
        boxShadow: '0 2px 14px rgba(32, 40, 45, 0.08)'
      }}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 700,
              color: summaryCardData.status_color === 'green' ? '#2e7d32' :
                     summaryCardData.status_color === 'blue' ? '#1565c0' :
                     summaryCardData.status_color === 'yellow' ? '#f57f17' : '#c62828'
            }}>
              {summaryCardData.status_title}
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#616161' }}>{summaryCardData.status_message}</div>
              <div style={{ fontSize: '12px', color: '#9e9e9e', marginTop: '4px' }}>{summaryCardData.period}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.7)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#757575' }}>현재 매출</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#212121' }}>{summaryCardData.metrics.current_revenue}</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.7)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#757575' }}>예측 매출</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#673ab7' }}>{summaryCardData.metrics.forecast_revenue}</div>
              <div style={{ fontSize: '11px', color: summaryCardData.metrics.revenue_change_pct >= 0 ? '#2e7d32' : '#c62828' }}>
                {summaryCardData.metrics.revenue_change_pct >= 0 ? '▲' : '▼'} {Math.abs(summaryCardData.metrics.revenue_change_pct).toFixed(1)}%
              </div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.7)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#757575' }}>현재 ROAS</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#212121' }}>{summaryCardData.metrics.current_roas}%</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.7)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#757575' }}>예측 ROAS</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#673ab7' }}>{summaryCardData.metrics.forecast_roas}%</div>
              <div style={{ fontSize: '11px', color: summaryCardData.metrics.roas_change_val >= 0 ? '#2e7d32' : '#c62828' }}>
                {summaryCardData.metrics.roas_change_val >= 0 ? '▲' : '▼'} {Math.abs(summaryCardData.metrics.roas_change_val).toFixed(1)}%p
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI View Toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setKpiView('primary')}
          style={{
            padding: '10px 24px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s',
            background: kpiView === 'primary' ? '#673ab7' : 'white',
            color: kpiView === 'primary' ? 'white' : '#616161',
            boxShadow: kpiView === 'primary' ? '0 4px 12px rgba(103, 58, 183, 0.4)' : '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          주요 성과
        </button>
        <button
          onClick={() => setKpiView('all')}
          style={{
            padding: '10px 24px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s',
            background: kpiView === 'all' ? '#673ab7' : 'white',
            color: kpiView === 'all' ? 'white' : '#616161',
            boxShadow: kpiView === 'all' ? '0 4px 12px rgba(103, 58, 183, 0.4)' : '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          세부 성과
        </button>
      </div>

      {/* KPI Summary Grid */}
      <div style={{ marginBottom: '24px' }}>
        {/* Primary KPIs - 5개 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: kpiView === 'all' ? '16px' : '0' }}>
          {primaryKPIs.map((kpi, idx) => (
            <div
              key={idx}
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                position: 'relative',
                overflow: 'hidden',
                borderLeft: kpi.highlight ? '4px solid #673ab7' : 'none',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: '#757575', fontWeight: 600 }}>{kpi.label}</span>
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: '#f5f5f5',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  {kpi.icon}
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: kpi.highlight ? '#673ab7' : '#212121', marginBottom: '8px' }}>
                {kpi.value}
              </div>
              {kpi.trend && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '4px 8px',
                    borderRadius: '12px',
                    background: kpi.trend.direction === 'up' ? '#b9f6ca' : kpi.trend.direction === 'down' ? '#ffeaea' : '#eeeeee',
                    color: kpi.trend.direction === 'up' ? '#00c853' : kpi.trend.direction === 'down' ? '#ff1744' : '#9e9e9e'
                  }}>
                    {kpi.trend.direction === 'up' ? '▲' : kpi.trend.direction === 'down' ? '▼' : '●'} {kpi.trend.value.replace(/[+-]/, '')}
                  </span>
                  <span style={{ color: '#9e9e9e', fontSize: '12px' }}>vs 실제</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Secondary KPIs - 4개 (shown when "all" is selected) */}
        {kpiView === 'all' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {secondaryKPIs.map((kpi, idx) => (
              <div
                key={idx}
                style={{
                  background: '#fafafa',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#757575', fontWeight: 600 }}>{kpi.label}</span>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    background: '#e0e0e0',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}>
                    {kpi.icon}
                  </div>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: '#212121', marginBottom: '8px' }}>
                  {kpi.value}
                </div>
                {kpi.trend && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '4px 8px',
                      borderRadius: '12px',
                      background: kpi.trend.direction === 'up' ? '#b9f6ca' : kpi.trend.direction === 'down' ? '#ffeaea' : '#eeeeee',
                      color: kpi.trend.direction === 'up' ? '#00c853' : kpi.trend.direction === 'down' ? '#ff1744' : '#9e9e9e'
                    }}>
                      {kpi.trend.direction === 'up' ? '▲' : kpi.trend.direction === 'down' ? '▼' : '●'} {kpi.trend.value.replace(/[+-]/, '')}
                    </span>
                    <span style={{ color: '#9e9e9e', fontSize: '12px' }}>vs 실제</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 통합 인사이트 대시보드 (접기/펼치기) */}
      <div className="mb-[24px]">
        <div
          onClick={() => toggleCollapsible('insights')}
          className="flex justify-between items-center cursor-pointer select-none p-[20px_24px] bg-white rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#eeeeee] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all"
        >
          <div className="flex items-center gap-[12px] text-[18px] font-semibold text-[#212121]">
            <span className="text-[24px]">🔬</span>
            <span>통합 인사이트 대시보드</span>
          </div>
          <button className="flex items-center gap-[8px] px-[16px] py-[8px] bg-[#ede7f6] text-[#673ab7] border-none rounded-[8px] text-[14px] font-medium cursor-pointer hover:bg-[#673ab7] hover:text-white transition-all">
            <span>{collapsibleStates.insights ? '접기' : '펼치기'}</span>
            <span className={`transition-transform duration-200 ${collapsibleStates.insights ? 'rotate-180' : ''}`}>▼</span>
          </button>
        </div>

        <div className={`overflow-hidden transition-[max-height_0.3s_ease,opacity_0.2s_ease,padding_0.3s_ease] ${collapsibleStates.insights ? 'max-h-[5000px] opacity-100 p-[24px]' : 'max-h-0 opacity-0 px-[24px] py-0'}`}>
          {/* AI 인사이트 요약 */}
          <div className="mb-[20px]">
            {/* 스토리 배너 */}
            <div className="mb-[16px] p-[20px] bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-[16px] text-white">
              <div className="flex items-start gap-[16px]">
                <div className="text-[40px] leading-[1]">🤖</div>
                <div className="flex-1">
                  <div className="text-[16px] font-bold mb-[6px]">AI가 분석한 오늘의 마케팅 인사이트</div>
                  <div className="text-[13px] opacity-90 leading-[1.6]">
                    Prophet 예측 모델 기반으로 <strong>성과 트렌드와 액션 아이템</strong>을 요약했습니다.
                  </div>
                </div>
              </div>
            </div>

            {/* AI 요약 기간 필터 */}
            <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', borderRadius: '10px', border: '1px solid #dee2e6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#495057' }}>📅 분석 기간:</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {([
                    { key: 'full', label: '전체' },
                    { key: '180d', label: '180일' },
                    { key: '90d', label: '90일' },
                    { key: '30d', label: '30일' },
                  ] as const).map((period) => (
                    <button
                      key={period.key}
                      onClick={() => setAiPeriod(period.key)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '11px',
                        fontWeight: 600,
                        border: `1px solid ${aiPeriod === period.key ? '#673ab7' : '#dee2e6'}`,
                        borderRadius: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: aiPeriod === period.key ? '#673ab7' : 'white',
                        color: aiPeriod === period.key ? 'white' : '#495057'
                      }}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 하위 탭 버튼 */}
            <div className="flex gap-[8px] mb-[20px] flex-wrap">
              {[
                { key: 'summary', label: '📊 핵심 요약' },
                { key: 'alerts', label: '⚠️ 경고 및 추천' },
                { key: 'opportunities', label: '🎯 기회 요소' },
                { key: 'matrix', label: '📈 주요 항목별 분석' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveInsightTab(tab.key as typeof activeInsightTab)}
                  className={`px-[18px] py-[10px] border-none rounded-[8px] cursor-pointer text-[13px] font-semibold transition-all ${
                    activeInsightTab === tab.key
                      ? 'bg-[#673ab7] text-white shadow-[0_4px_12px_rgba(103,58,183,0.4)]'
                      : 'bg-white text-[#616161] shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:bg-[#ede7f6] hover:text-[#673ab7]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 탭 콘텐츠 */}
            {/* 핵심 요약 탭 */}
            {activeInsightTab === 'summary' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', paddingTop: '4px' }}>
                {summaryInsightsByPeriod[aiPeriod].map((insight, idx) => {
                  const hasSubLines = insight.subLines && insight.subLines.length > 0
                  const hasRecommendation = insight.recommendation !== null
                  return (
                    <div
                      key={idx}
                      className="rounded-[10px] flex flex-col transition-transform duration-200 hover:translate-y-[-2px]"
                      style={{
                        background: insight.category.bg,
                        border: `2px solid ${insight.category.border}`,
                        padding: '14px',
                      }}
                    >
                      {/* 헤더 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            background: `${insight.category.border}20`,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <span style={{ fontSize: '16px' }}>{insight.category.icon}</span>
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: insight.category.color,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {insight.category.label}
                        </span>
                      </div>
                      {/* 메시지 */}
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#212121',
                          lineHeight: 1.6,
                          flex: 1,
                          marginBottom: (hasSubLines || hasRecommendation) ? '10px' : '0',
                        }}
                      >
                        {insight.message}
                      </div>
                      {/* 상세 정보 (서브라인) */}
                      {hasSubLines && (
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.7)',
                            borderRadius: '6px',
                            padding: '10px',
                            borderLeft: `3px solid ${insight.category.border}`,
                            marginBottom: hasRecommendation ? '10px' : '0',
                          }}
                        >
                          <div style={{ fontSize: '10px', fontWeight: 600, color: insight.category.color, marginBottom: '4px' }}>
                            📌 상세 정보
                          </div>
                          {insight.subLines.map((sub, subIdx) => (
                            <div key={subIdx} style={{ fontSize: '11px', color: '#333', lineHeight: 1.5 }}>
                              → {sub}
                            </div>
                          ))}
                        </div>
                      )}
                      {/* 추천 액션 */}
                      {hasRecommendation && insight.recommendation && (
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.7)',
                            borderRadius: '6px',
                            padding: '10px',
                            borderLeft: '3px solid #ab47bc',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: '#7b1fa2' }}>💡 추천 액션</div>
                          </div>
                          <div style={{ fontSize: '11px', color: '#333', lineHeight: 1.4 }}>
                            {insight.recommendation.action}
                          </div>
                          {insight.recommendation.contextAdvice && (
                            <div style={{ fontSize: '10px', color: '#5e35b1', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #d1c4e9', lineHeight: 1.4 }}>
                              💬 {insight.recommendation.contextAdvice}
                            </div>
                          )}
                          {insight.recommendation.expectedImpact && (
                            <div style={{ fontSize: '10px', color: '#2e7d32', marginTop: '4px' }}>
                              📈 {insight.recommendation.expectedImpact}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* 경고 및 추천 탭 */}
            {activeInsightTab === 'alerts' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '300px' }}>
                {/* 주요 경고 */}
                <div style={{ padding: '24px', borderRight: '1px solid #eeeeee', background: '#fafafa' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #ef5350' }}>
                    <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #ef5350 0%, #f44336 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '14px', filter: 'brightness(10)' }}>🚨</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#212121' }}>주요 경고</span>
                      <span style={{ fontSize: '11px', color: '#9e9e9e', fontWeight: 500, marginLeft: '8px' }}>{alertInsights.length}건</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {alertInsights.map((alert, idx) => {
                      const severityColors = {
                        high: { bg: '#ffebee', border: '#ef5350', titleColor: '#c62828' },
                        medium: { bg: '#fff3e0', border: '#ff9800', titleColor: '#e65100' },
                        low: { bg: '#e3f2fd', border: '#2196f3', titleColor: '#1565c0' }
                      }
                      const style = severityColors[alert.severity]
                      return (
                        <div
                          key={idx}
                          className="transition-transform duration-200 hover:translate-y-[-2px]"
                          style={{
                            background: style.bg,
                            border: `2px solid ${style.border}`,
                            borderRadius: '10px',
                            padding: '14px',
                          }}
                        >
                          {/* 헤더 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '16px' }}>{alert.severity === 'high' ? '🚨' : '⚠️'}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: style.titleColor }}>{alert.title}</div>
                              <div style={{ fontSize: '10px', color: style.titleColor, opacity: 0.8 }}>{alert.segment}</div>
                            </div>
                            {alert.severity === 'high' && (
                              <span style={{ background: '#c62828', color: 'white', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>긴급</span>
                            )}
                          </div>
                          {/* 메트릭 배지 */}
                          {alert.metrics && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                              <span style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: '#333', border: `1px solid ${style.border}` }}>현재 ROAS {alert.metrics.currentRoas}%</span>
                              <span style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: '#c62828', border: '1px solid #ef9a9a' }}>예측 ROAS {alert.metrics.forecastRoas}%</span>
                              <span style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: '#c62828', border: '1px solid #ef9a9a' }}>변화 {alert.metrics.change}%</span>
                            </div>
                          )}
                          {/* 메시지 */}
                          <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.5, marginBottom: alert.action ? '10px' : '0' }}>
                            {alert.message}
                          </div>
                          {/* 추천 액션 */}
                          {alert.action && (
                            <div style={{ background: '#ffffff', borderRadius: '6px', padding: '10px', borderLeft: `3px solid ${style.border}` }}>
                              <div style={{ fontSize: '10px', fontWeight: 600, color: style.titleColor, marginBottom: '4px' }}>💡 추천 액션</div>
                              <div style={{ fontSize: '11px', color: '#333', lineHeight: 1.4 }}>{alert.action}</div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 투자 추천 */}
                <div style={{ padding: '24px', background: '#fafafa' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #4caf50' }}>
                    <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #66bb6a 0%, #4caf50 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '14px', filter: 'brightness(10)' }}>💡</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#212121' }}>투자 추천</span>
                      <span style={{ fontSize: '11px', color: '#9e9e9e', fontWeight: 500, marginLeft: '8px' }}>{recommendationInsights.length}건</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {recommendationInsights.map((rec, idx) => {
                      const priorityColors: Record<number, { bg: string; border: string; titleColor: string; icon: string }> = {
                        1: { bg: '#e8f5e9', border: '#4caf50', titleColor: '#2e7d32', icon: '🥇' },
                        2: { bg: '#e3f2fd', border: '#2196f3', titleColor: '#1565c0', icon: '🥈' },
                        3: { bg: '#fff3e0', border: '#ff9800', titleColor: '#e65100', icon: '🥉' }
                      }
                      const style = priorityColors[rec.priority] || priorityColors[3]
                      const targetTypeKr: Record<string, string> = {
                        channel: '채널',
                        product: '제품',
                        brand: '브랜드',
                        promotion: '프로모션'
                      }
                      return (
                        <div
                          key={idx}
                          className="transition-transform duration-200 hover:translate-y-[-2px]"
                          style={{
                            background: style.bg,
                            border: `2px solid ${style.border}`,
                            borderRadius: '10px',
                            padding: '14px',
                            cursor: 'pointer',
                          }}
                        >
                          {/* 헤더 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '18px' }}>{style.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: style.titleColor }}>{rec.action}</div>
                              <div style={{ fontSize: '10px', color: style.titleColor, opacity: 0.8 }}>{targetTypeKr[rec.target.type] || rec.target.type} &gt; {rec.target.value}</div>
                            </div>
                            <span style={{ background: style.border, color: 'white', fontSize: '9px', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>우선순위 {rec.priority}</span>
                          </div>
                          {/* 메트릭스 배지 */}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            {rec.metrics.roas && (
                              <span style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: '#2e7d32', border: '1px solid #a5d6a7' }}>ROAS {rec.metrics.roas}%</span>
                            )}
                            {rec.metrics.cvr && (
                              <span style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: '#1565c0', border: '1px solid #90caf9' }}>CVR {rec.metrics.cvr.toFixed(2)}%</span>
                            )}
                            {rec.metrics.cpa && (
                              <span style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: '#5e35b1', border: '1px solid #b39ddb' }}>CPA {(rec.metrics.cpa / 1000).toFixed(1)}천원</span>
                            )}
                          </div>
                          {/* 이유 목록 */}
                          <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.6, marginBottom: '10px' }}>
                            {rec.reasons.map((reason, ridx) => (
                              <div key={ridx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                <span style={{ color: style.border }}>✓</span>
                                <span>{reason}</span>
                              </div>
                            ))}
                          </div>
                          {/* 예상 효과 */}
                          <div style={{ background: '#ffffff', borderRadius: '6px', padding: '10px', borderLeft: `3px solid ${style.border}` }}>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: style.titleColor, marginBottom: '4px' }}>📈 예상 효과</div>
                            <div style={{ fontSize: '11px', color: '#333', lineHeight: 1.4 }}>{rec.expected_impact}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 기회 요소 탭 */}
            {activeInsightTab === 'opportunities' && (
              <div style={{ padding: '24px', background: '#fafafa', minHeight: '250px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #2196f3' }}>
                  <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #42a5f5 0%, #2196f3 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '14px', filter: 'brightness(10)' }}>💎</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#212121' }}>성장 기회 발견</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {opportunityInsights.map((opp, idx) => {
                    const oppStyles: Record<string, { icon: string; bg: string; border: string; titleColor: string; label: string }> = {
                      scale_up: { icon: '🚀', bg: '#e8f5e9', border: '#4caf50', titleColor: '#2e7d32', label: '예산 증액' },
                      hidden_gem: { icon: '💎', bg: '#e3f2fd', border: '#2196f3', titleColor: '#1565c0', label: '숨은 보석' },
                      growth_momentum: { icon: '📈', bg: '#fff3e0', border: '#ff9800', titleColor: '#e65100', label: '성장 모멘텀' },
                      default: { icon: '🎯', bg: '#e8f5e9', border: '#4caf50', titleColor: '#2e7d32', label: '기회' }
                    }
                    const style = oppStyles[opp.type] || oppStyles.default
                    return (
                      <div
                        key={idx}
                        className="transition-transform duration-200 hover:translate-y-[-2px]"
                        style={{
                          background: style.bg,
                          border: `2px solid ${style.border}`,
                          borderRadius: '10px',
                          padding: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        {/* 헤더 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '18px' }}>{style.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: style.titleColor }}>{opp.title}</div>
                            {opp.segment_value && (
                              <div style={{ fontSize: '10px', color: style.titleColor, opacity: 0.8 }}>{opp.segment_type} &gt; {opp.segment_value}</div>
                            )}
                          </div>
                          <span style={{ background: style.border, color: 'white', fontSize: '9px', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>{style.label}</span>
                        </div>
                        {/* 메트릭스 배지 */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                          {opp.roas && (
                            <span style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: '#2e7d32', border: '1px solid #a5d6a7' }}>ROAS {opp.roas}%</span>
                          )}
                          {opp.priority && (
                            <span style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: '#5e35b1', border: '1px solid #b39ddb' }}>우선순위 {opp.priority}</span>
                          )}
                          {opp.potential_uplift && (
                            <span style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: '#1565c0', border: '1px solid #90caf9' }}>+{(opp.potential_uplift / 10000).toFixed(1)}만원</span>
                          )}
                        </div>
                        {/* 메시지 */}
                        <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.5, marginBottom: '10px' }}>
                          {opp.message}
                        </div>
                        {/* 추천 액션 */}
                        {opp.action && (
                          <div style={{ background: '#ffffff', borderRadius: '6px', padding: '10px', borderLeft: `3px solid ${style.border}`, marginBottom: opp.financial_impact ? '8px' : '0' }}>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: style.titleColor, marginBottom: '4px' }}>💡 추천 액션</div>
                            <div style={{ fontSize: '11px', color: '#333', lineHeight: 1.4 }}>{opp.action}</div>
                          </div>
                        )}
                        {/* 재무 영향 */}
                        {opp.financial_impact && (
                          <div style={{ background: '#ffffff', borderRadius: '6px', padding: '10px', borderLeft: '3px solid #673ab7' }}>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: '#5e35b1', marginBottom: '4px' }}>💰 기대 효과</div>
                            <div style={{ fontSize: '11px', color: '#333', lineHeight: 1.4 }}>{opp.financial_impact}</div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 주요 항목별 분석 탭 */}
            {activeInsightTab === 'matrix' && (
              <>
                {/* 하위탭 버튼 */}
                <div style={{ display: 'flex', gap: 0, background: '#f5f5f5', borderBottom: '1px solid #eeeeee' }}>
                  {[
                    { key: 'brand', icon: '🏷️', label: '브랜드' },
                    { key: 'channel', icon: '📢', label: '채널' },
                    { key: 'product', icon: '📦', label: '상품' },
                    { key: 'promotion', icon: '🎁', label: '프로모션' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveMatrixTab(tab.key as typeof activeMatrixTab)}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        border: 'none',
                        background: activeMatrixTab === tab.key ? '#673ab7' : 'transparent',
                        color: activeMatrixTab === tab.key ? 'white' : '#666',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span>{tab.icon}</span> {tab.label}
                      {matrixInsightsData[tab.key]?.length > 0 && (
                        <span style={{ fontSize: '10px', opacity: 0.8 }}>({matrixInsightsData[tab.key].length}건)</span>
                      )}
                    </button>
                  ))}
                </div>
                {/* 하위탭 컨텐츠 */}
                <div style={{ padding: '20px 24px', background: '#fafafa', minHeight: '350px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(matrixInsightsData[activeMatrixTab] || []).map((insight, idx) => {
                      // 4분면별 스타일
                      const matrixStyles: Record<string, { icon: string; bg: string; border: string; titleColor: string; label: string }> = {
                        super_star: { icon: '🚀', bg: '#e8f5e9', border: '#4caf50', titleColor: '#2e7d32', label: 'Super Star' },
                        fading_hero: { icon: '🛡️', bg: '#fff3e0', border: '#ff9800', titleColor: '#e65100', label: 'Fading Hero' },
                        rising_potential: { icon: '🌱', bg: '#e3f2fd', border: '#2196f3', titleColor: '#1565c0', label: 'Rising Potential' },
                        problem_child: { icon: '🗑️', bg: '#ffebee', border: '#ef5350', titleColor: '#c62828', label: 'Problem Child' },
                      }
                      // severity별 스타일
                      const severityStyles: Record<string, { borderWidth: string; boxShadow: string }> = {
                        critical: { borderWidth: '3px', boxShadow: '0 0 8px rgba(239, 83, 80, 0.4)' },
                        high: { borderWidth: '2px', boxShadow: '0 0 4px rgba(239, 83, 80, 0.2)' },
                        warning: { borderWidth: '2px', boxShadow: 'none' },
                        opportunity: { borderWidth: '2px', boxShadow: '0 0 4px rgba(76, 175, 80, 0.2)' },
                      }
                      const style = matrixStyles[insight.sub_type] || matrixStyles.problem_child
                      const sevStyle = severityStyles[insight.severity] || severityStyles.warning
                      const metrics = insight.metrics || {}
                      const growthPct = metrics.forecast_growth_pct

                      return (
                        <div
                          key={idx}
                          className="transition-transform duration-200 hover:translate-y-[-3px]"
                          style={{
                            background: style.bg,
                            border: `${sevStyle.borderWidth} solid ${style.border}`,
                            borderRadius: '10px',
                            padding: '14px',
                            boxShadow: sevStyle.boxShadow,
                            cursor: 'pointer',
                          }}
                        >
                          {/* 헤더 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <span style={{ fontSize: '18px' }}>{style.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: style.titleColor }}>{insight.segment_value}</div>
                              <div style={{ fontSize: '10px', color: style.titleColor, opacity: 0.8 }}>{style.label}</div>
                            </div>
                            {insight.severity === 'critical' && (
                              <span style={{ background: '#c62828', color: 'white', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>CORE RISK</span>
                            )}
                          </div>
                          {/* 메트릭스 */}
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            {metrics.current_roas && (
                              <span style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: '#333', border: `1px solid ${style.border}` }}>ROAS {metrics.current_roas.toLocaleString()}%</span>
                            )}
                            {growthPct !== undefined && growthPct !== null && (
                              <span style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: growthPct >= 0 ? '#2e7d32' : '#c62828', border: `1px solid ${growthPct >= 0 ? '#a5d6a7' : '#ef9a9a'}` }}>예측 {growthPct >= 0 ? '+' : ''}{growthPct.toFixed(1)}%</span>
                            )}
                            {metrics.revenue_share_pct && (
                              <span style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: '#5e35b1', border: '1px solid #b39ddb' }}>매출비중 {metrics.revenue_share_pct.toFixed(1)}%</span>
                            )}
                          </div>
                          {/* 메시지 */}
                          <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.5, marginBottom: '10px' }}>
                            {insight.message}
                          </div>
                          {/* 액션 */}
                          <div style={{ background: '#ffffff', borderRadius: '6px', padding: '10px', borderLeft: `3px solid ${style.border}` }}>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: style.titleColor, marginBottom: '4px' }}>💡 추천 액션</div>
                            <div style={{ fontSize: '11px', color: '#333', lineHeight: 1.4 }}>{insight.action}</div>
                          </div>
                        </div>
                      )
                    })}
                    {(matrixInsightsData[activeMatrixTab] || []).length === 0 && (
                      <div style={{ background: '#f5f5f5', border: '1px dashed #ccc', textAlign: 'center', padding: '20px', borderRadius: '10px' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>✨</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>해당 세그먼트의 Matrix 인사이트가 없습니다.</div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 최근 변화 인사이트 (접기/펼치기) */}
      <div className="mb-[24px]">
        <div
          onClick={() => toggleCollapsible('recentChanges')}
          className="flex justify-between items-center cursor-pointer select-none p-[20px_24px] bg-white rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#eeeeee] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all"
        >
          <div className="flex items-center gap-[12px] text-[18px] font-semibold text-[#212121]">
            <span className="text-[24px]">📈</span>
            <span>최근 변화 인사이트</span>
          </div>
          <button className="flex items-center gap-[8px] px-[16px] py-[8px] bg-[#ede7f6] text-[#673ab7] border-none rounded-[8px] text-[14px] font-medium cursor-pointer hover:bg-[#673ab7] hover:text-white transition-all">
            <span>{collapsibleStates.recentChanges ? '접기' : '펼치기'}</span>
            <span className={`transition-transform duration-200 ${collapsibleStates.recentChanges ? 'rotate-180' : ''}`}>▼</span>
          </button>
        </div>

        <div
          style={{
            overflow: 'hidden',
            transition: 'max-height 0.3s ease, opacity 0.2s ease, padding 0.3s ease',
            maxHeight: collapsibleStates.recentChanges ? '5000px' : '0',
            opacity: collapsibleStates.recentChanges ? 1 : 0,
            padding: collapsibleStates.recentChanges ? '24px' : '0 24px',
          }}
        >
          {/* 기간 비교 선택 */}
          <div style={{ marginBottom: '16px', padding: '14px 18px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)', borderRadius: '10px', border: '1px solid #bbdefb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '16px' }}>📊</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1565c0' }}>비교 기간:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {([
                  { key: '30d', label: '30일' },
                  { key: '14d', label: '14일' },
                  { key: '7d', label: '7일' },
                ] as const).map((period) => (
                  <button
                    key={period.key}
                    onClick={() => setTrendPeriod(period.key)}
                    style={{
                      padding: '6px 14px',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: trendPeriod === period.key ? '1px solid #673ab7' : '1px solid #dee2e6',
                      borderRadius: '20px',
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
              <span style={{ fontSize: '12px', color: '#37474f', marginLeft: 'auto' }}>
                <strong style={{ color: '#1565c0' }}>최근 {trendPeriod === '7d' ? '7일' : trendPeriod === '14d' ? '14일' : '30일'}</strong> vs <strong style={{ color: '#7b1fa2' }}>이전 {trendPeriod === '7d' ? '7일' : trendPeriod === '14d' ? '14일' : '30일'}</strong>
              </span>
            </div>
          </div>

          {/* compact-grid-2 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: 0 }}>
            {/* 성과 개선 분석 */}
            <div style={{ padding: '24px' }}>
              {/* insight-header */}
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#212121', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '4px', height: '20px', background: '#ffab00', borderRadius: '2px' }} />
                <span>✨ 좋은 소식: 어떤 부분이 좋아졌나요?</span>
              </div>
              {/* insight-content */}
              <div style={{ display: 'block', maxHeight: '400px', overflowY: 'auto', paddingTop: '4px' }}>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {performanceTrendsData.improvements.map((item, idx) => (
                    <div
                      key={idx}
                      className="transition-transform duration-200 hover:translate-y-[-2px]"
                      style={{
                        background: '#e8f5e9',
                        border: '2px solid #4caf50',
                        borderRadius: '10px',
                        padding: '14px',
                      }}
                    >
                      {/* 헤더 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '18px' }}>📈</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#2e7d32' }}>{item.metric}</div>
                          <div style={{ fontSize: '10px', color: '#2e7d32', opacity: 0.8 }}>최근 {trendPeriod === '7d' ? '7일' : trendPeriod === '14d' ? '14일' : '30일'} vs 이전</div>
                        </div>
                        <span style={{ background: '#4caf50', color: 'white', fontSize: '9px', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>+{item.change_pct}% {item.improvement_level === 'high' ? '높음' : '중간'}</span>
                      </div>
                      {/* 메트릭스 배지 */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <span style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: '#1565c0', border: '1px solid #90caf9', fontWeight: 500 }}>최근 {item.recent_avg.toLocaleString()}</span>
                        <span style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: '#5e35b1', border: '1px solid #b39ddb', fontWeight: 500 }}>이전 {item.previous_avg.toLocaleString()}</span>
                      </div>
                      {/* 추천 액션 */}
                      <div style={{ background: '#ffffff', borderRadius: '6px', padding: '10px', borderLeft: '3px solid #4caf50' }}>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#2e7d32', marginBottom: '4px' }}>💡 추천 액션</div>
                        <div style={{ fontSize: '11px', color: '#333', lineHeight: 1.4 }}>{item.recommendation}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 성과 하락 경고 */}
            <div style={{ padding: '24px' }}>
              {/* insight-header */}
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#212121', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '4px', height: '20px', background: '#ffab00', borderRadius: '2px' }} />
                <span>⚠️ 주의 필요: 성과 하락 감지</span>
              </div>
              {/* insight-content */}
              <div style={{ display: 'block', maxHeight: '400px', overflowY: 'auto', paddingTop: '4px' }}>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {performanceTrendsData.declines.map((item, idx) => {
                    const isHigh = item.risk_level === 'high'
                    const bgColor = isHigh ? '#ffebee' : '#fff3e0'
                    const borderColor = isHigh ? '#f44336' : '#ff9800'
                    const textColor = isHigh ? '#c62828' : '#e65100'
                    const badgeColor = isHigh ? '#f44336' : '#ff9800'
                    return (
                      <div
                        key={idx}
                        className="transition-transform duration-200 hover:translate-y-[-2px]"
                        style={{
                          background: bgColor,
                          border: `2px solid ${borderColor}`,
                          borderRadius: '10px',
                          padding: '14px',
                        }}
                      >
                        {/* 헤더 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '18px' }}>📉</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: textColor }}>{item.metric}</div>
                            <div style={{ fontSize: '10px', color: textColor, opacity: 0.8 }}>최근 {trendPeriod === '7d' ? '7일' : trendPeriod === '14d' ? '14일' : '30일'} vs 이전</div>
                          </div>
                          <span style={{ background: badgeColor, color: 'white', fontSize: '9px', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>{item.change_pct}% {isHigh ? '높음' : '중간'}</span>
                        </div>
                        {/* 메트릭스 배지 */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                          <span style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: '#1565c0', border: '1px solid #90caf9', fontWeight: 500 }}>최근 {item.recent_avg.toLocaleString()}</span>
                          <span style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: '#5e35b1', border: '1px solid #b39ddb', fontWeight: 500 }}>이전 {item.previous_avg.toLocaleString()}</span>
                        </div>
                        {/* 추천 액션 */}
                        <div style={{ background: '#ffffff', borderRadius: '6px', padding: '10px', borderLeft: `3px solid ${borderColor}` }}>
                          <div style={{ fontSize: '10px', fontWeight: 600, color: textColor, marginBottom: '4px' }}>💡 추천 액션</div>
                          <div style={{ fontSize: '11px', color: '#333', lineHeight: 1.4 }}>{item.recommendation}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 예산 시뮬레이션 및 주요 항목 추이 (접기/펼치기) */}
      <div className="mb-[24px]">
        <div
          onClick={() => toggleCollapsible('simulation')}
          className="flex justify-between items-center cursor-pointer select-none p-[20px_24px] bg-white rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#eeeeee] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all"
        >
          <div className="flex items-center gap-[12px] text-[18px] font-semibold text-[#212121]">
            <span className="text-[24px]">📊</span>
            <span>예산 시뮬레이션 및 주요 항목 추이</span>
          </div>
          <button className="flex items-center gap-[8px] px-[16px] py-[8px] bg-[#ede7f6] text-[#673ab7] border-none rounded-[8px] text-[14px] font-medium cursor-pointer hover:bg-[#673ab7] hover:text-white transition-all">
            <span>{collapsibleStates.simulation ? '접기' : '펼치기'}</span>
            <span className={`transition-transform duration-200 ${collapsibleStates.simulation ? 'rotate-180' : ''}`}>▼</span>
          </button>
        </div>

        <div
          style={{
            overflow: 'hidden',
            transition: 'max-height 0.3s ease, opacity 0.2s ease, padding 0.3s ease',
            maxHeight: collapsibleStates.simulation ? '5000px' : '0',
            opacity: collapsibleStates.simulation ? 1 : 0,
            padding: collapsibleStates.simulation ? '24px' : '0 24px',
          }}
        >
          {/* 분석 타입 탭 - view-type-section */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            <button
              onClick={() => setActiveAnalysisTab('budget-simulation')}
              style={{
                padding: '10px 24px',
                border: 'none',
                background: activeAnalysisTab === 'budget-simulation' ? '#673ab7' : 'white',
                color: activeAnalysisTab === 'budget-simulation' ? 'white' : '#616161',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '14px',
                transition: 'all 0.2s ease',
                boxShadow: activeAnalysisTab === 'budget-simulation' ? '0 4px 12px rgba(103, 58, 183, 0.4)' : '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              예산 시뮬레이션
            </button>
            <button
              onClick={() => setActiveAnalysisTab('segment-trend')}
              style={{
                padding: '10px 24px',
                border: 'none',
                background: activeAnalysisTab === 'segment-trend' ? '#673ab7' : 'white',
                color: activeAnalysisTab === 'segment-trend' ? 'white' : '#616161',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '14px',
                transition: 'all 0.2s ease',
                boxShadow: activeAnalysisTab === 'segment-trend' ? '0 4px 12px rgba(103, 58, 183, 0.4)' : '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              주요 항목 트렌드
            </button>
          </div>

          {/* 예산 시뮬레이션 탭 */}
          {activeAnalysisTab === 'budget-simulation' && (
            <div style={{ padding: '24px' }}>
              {/* 섹션 설명 */}
              <div style={{ fontSize: '13px', color: '#616161', padding: '16px', background: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)', lineHeight: 1.7, borderRadius: '8px', marginBottom: '24px' }}>
                <strong style={{ color: '#f57c00' }}>💰 예산 시나리오 시뮬레이션이란?</strong><br />
                주요 항목별 예산 변경 시 예상되는 <strong>매출 변화</strong>를 시뮬레이션합니다.<br />
                <span style={{ color: '#757575' }}>ROAS 기반 선형 모델 + 로그 체감 수익 함수를 적용하여 현실적인 예측을 제공합니다.</span>
              </div>

              {/* 세그먼트 타입 선택 */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                  {/* 주요 항목 유형 선택 */}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#616161', marginBottom: '12px' }}>📊 주요 항목 유형 선택</div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: 0 }}>
                      {([
                        { key: 'all', label: '전체' },
                        { key: 'channel', label: '채널별' },
                        { key: 'product', label: '제품별' },
                        { key: 'brand', label: '브랜드별' },
                        { key: 'promotion', label: '프로모션별' },
                      ] as const).map((type) => (
                        <button
                          key={type.key}
                          onClick={() => handleSimSegmentTypeChange(type.key)}
                          style={{
                            padding: '10px 24px',
                            border: 'none',
                            background: simSegmentType === type.key ? '#673ab7' : 'white',
                            color: simSegmentType === type.key ? 'white' : '#616161',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: '14px',
                            transition: 'all 0.2s ease',
                            boxShadow: simSegmentType === type.key ? '0 4px 12px rgba(103, 58, 183, 0.4)' : '0 1px 3px rgba(0,0,0,0.08)',
                          }}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 항목 선택 드롭다운 */}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#616161', marginBottom: '12px' }}>
                      🎯 항목 선택
                      <span style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 600, marginLeft: '8px' }}>
                        {simSelectedItems.length}개 선택됨
                      </span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => setSimDropdownOpen(!simDropdownOpen)}
                        style={{ minWidth: '220px', padding: '10px 14px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '13px', color: '#424242', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}
                      >
                        <span style={{ fontWeight: 500 }}>항목을 선택하세요</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#9e9e9e' }}>{simSelectedItems.length}개</span>
                          <span style={{ fontSize: '10px' }}>▼</span>
                        </span>
                      </button>
                      {simDropdownOpen && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', minWidth: '220px', marginTop: '4px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: '280px', overflowY: 'auto', zIndex: 100 }}>
                          <div style={{ padding: '8px' }}>
                            <div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid #eeeeee', marginBottom: '6px', zIndex: 1 }}>
                              <label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}>
                                <input
                                  type="checkbox"
                                  checked={simSelectedItems.length === currentSegments.length}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSimSelectedItems(currentSegments.map(s => s.name))
                                    } else {
                                      setSimSelectedItems([])
                                    }
                                  }}
                                  style={{ marginRight: '10px', width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                전체 선택
                              </label>
                            </div>
                            {currentSegments.map((seg, idx) => (
                              <label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', borderRadius: '4px', fontSize: '12px' }}>
                                <input
                                  type="checkbox"
                                  checked={simSelectedItems.includes(seg.name)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSimSelectedItems([...simSelectedItems, seg.name])
                                    } else {
                                      setSimSelectedItems(simSelectedItems.filter(item => item !== seg.name))
                                    }
                                  }}
                                  style={{ marginRight: '10px', width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                {seg.name}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 슬라이더 영역 */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#616161' }}>📈 주요 항목별 예산 조정</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      const newBudgets: Record<string, number> = {}
                      currentSegments.forEach(s => { newBudgets[s.name] = 100 })
                      setSimulationBudgets(newBudgets)
                    }}
                    style={{ padding: '8px 16px', border: 'none', background: 'white', color: '#616161', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'all 0.2s' }}
                  >
                    초기화
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {currentSegments.filter(seg => simSelectedItems.includes(seg.name)).map((seg, idx) => {
                    const budgetValue = simulationBudgets[seg.name] ?? 100
                    return (
                    <div
                      key={seg.name}
                      className="transition-all hover:translate-y-[-2px]"
                      style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid rgba(0,0,0,0.06)' }}
                    >
                      <div className="flex justify-between items-center mb-[12px]">
                        <div className="flex items-center gap-[8px]">
                          <span className={`px-[8px] py-[3px] rounded-[4px] text-[10px] font-semibold uppercase tracking-[0.5px] ${
                            seg.badge === 'high' ? 'bg-[rgba(16,185,129,0.1)] text-[#10b981]' :
                            seg.badge === 'medium' ? 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b]' :
                            'bg-[rgba(239,68,68,0.1)] text-[#ef4444]'
                          }`}>
                            {seg.badge === 'high' ? '고효율' : seg.badge === 'medium' ? '중효율' : '저효율'}
                          </span>
                          <span className="font-semibold text-[13px] text-[#212121]">{seg.name}</span>
                        </div>
                        <div className="flex items-center gap-[12px]">
                          <span className={`text-[11px] font-semibold px-[8px] py-[3px] rounded-[4px] ${
                            seg.roas >= 300 ? 'bg-[rgba(16,185,129,0.1)] text-[#10b981]' :
                            seg.roas >= 200 ? 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b]' :
                            'bg-[rgba(239,68,68,0.1)] text-[#ef4444]'
                          }`}>
                            ROAS {seg.roas}%
                          </span>
                          <span className="text-[12px] text-[#616161] font-medium">
                            ₩{(seg.currentBudget / 1000000).toFixed(0)}M
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-[12px] mb-[12px]">
                        <span className="text-[11px] text-[#9e9e9e] min-w-[32px]">-50%</span>
                        <div className="flex-1 relative h-[8px] bg-[#e2e8f0] rounded-[4px] overflow-visible">
                          <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#d6beff] via-[#ab87ea] to-[#673ab7] rounded-[4px] transition-all duration-150"
                            style={{ width: `${((budgetValue - 50) / 150) * 100}%` }}
                          />
                          <input
                            type="range"
                            min="50"
                            max="200"
                            value={budgetValue}
                            onChange={(e) => {
                              setSimulationBudgets(prev => ({
                                ...prev,
                                [seg.name]: Number(e.target.value)
                              }))
                            }}
                            className="absolute top-1/2 left-0 transform -translate-y-1/2 w-full h-[24px] bg-transparent cursor-pointer appearance-none z-[2] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(0,0,0,0.25)] [&::-webkit-slider-thumb]:hover:scale-[1.15] [&::-webkit-slider-thumb]:active:cursor-grabbing"
                          />
                        </div>
                        <span className="text-[11px] text-[#9e9e9e] min-w-[32px]">+100%</span>
                      </div>

                      <div className="flex justify-between items-center pt-[12px] border-t border-[rgba(0,0,0,0.06)]">
                        <span className="text-[12px] text-[#9e9e9e]">예상 예산</span>
                        <span className={`text-[13px] font-semibold ${
                          budgetValue > 100 ? 'text-[#10b981]' :
                          budgetValue < 100 ? 'text-[#ef4444]' :
                          'text-[#616161]'
                        }`}>
                          ₩{((seg.currentBudget * budgetValue / 100) / 1000000).toFixed(1)}M
                          <small className="text-[11px] opacity-80 ml-[4px]">
                            ({budgetValue > 100 ? '+' : ''}{budgetValue - 100}%)
                          </small>
                        </span>
                      </div>
                    </div>
                  )})}
                </div>
              </div>

              {/* 시뮬레이션 결과 */}
              {(() => {
                // 기준값 계산 (100% 기준)
                const filteredSegments = currentSegments.filter(seg => simSelectedItems.includes(seg.name))
                const baseCost = filteredSegments.reduce((sum, seg) => sum + seg.currentBudget, 0)
                const baseRevenue = filteredSegments.reduce((sum, seg) => sum + (seg.currentBudget * seg.roas / 100), 0)
                const baseRoas = baseCost > 0 ? (baseRevenue / baseCost) * 100 : 0
                const costChange = baseCost > 0 ? ((simResult.totalCost - baseCost) / baseCost * 100) : 0
                const revenueChange = baseRevenue > 0 ? ((simResult.totalRevenue - baseRevenue) / baseRevenue * 100) : 0
                const roasChange = baseRoas > 0 ? (simResult.roas - baseRoas) : 0

                return (
              <div style={{ background: '#fafafa', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#212121', marginBottom: '16px' }}>📊 시뮬레이션 결과</div>

                {/* 결과 요약 카드 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                  <div className="bg-white border border-[rgba(0,0,0,0.06)] rounded-[10px] p-[16px] flex gap-[12px] hover:border-[rgba(0,0,0,0.12)] hover:translate-y-[-2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all">
                    <div className="flex-shrink-0 w-[40px] h-[40px] rounded-[8px] bg-[rgba(139,92,246,0.1)] flex items-center justify-center text-[#8b5cf6]">
                      💳
                    </div>
                    <div className="flex flex-col gap-[4px] min-w-0">
                      <div className="text-[11px] text-[#9e9e9e] font-medium uppercase tracking-[0.3px]">총 비용</div>
                      <div className="flex items-center gap-[6px] flex-wrap">
                        <span className="text-[12px] text-[#bdbdbd] line-through">₩{(baseCost / 1000000).toFixed(1)}M</span>
                        <span className="text-[11px] text-[#bdbdbd]">→</span>
                        <span className="text-[15px] font-bold text-[#8b5cf6]">₩{(simResult.totalCost / 1000000).toFixed(1)}M</span>
                      </div>
                      <div className="text-[11px] font-semibold text-[#9e9e9e]">{costChange >= 0 ? '+' : ''}{costChange.toFixed(1)}%</div>
                    </div>
                  </div>

                  <div className="bg-white border border-[rgba(16,185,129,0.25)] rounded-[10px] p-[16px] flex gap-[12px] bg-gradient-to-br from-white to-[rgba(16,185,129,0.03)] hover:translate-y-[-2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all">
                    <div className="flex-shrink-0 w-[40px] h-[40px] rounded-[8px] bg-[rgba(16,185,129,0.1)] flex items-center justify-center text-[#10b981]">
                      💰
                    </div>
                    <div className="flex flex-col gap-[4px] min-w-0">
                      <div className="text-[11px] text-[#9e9e9e] font-medium uppercase tracking-[0.3px]">예상 매출</div>
                      <div className="flex items-center gap-[6px] flex-wrap">
                        <span className="text-[12px] text-[#bdbdbd] line-through">₩{(baseRevenue / 1000000).toFixed(1)}M</span>
                        <span className="text-[11px] text-[#bdbdbd]">→</span>
                        <span className="text-[15px] font-bold text-[#10b981]">₩{(simResult.totalRevenue / 1000000).toFixed(1)}M</span>
                      </div>
                      <div className="text-[11px] font-semibold text-[#9e9e9e]">{revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}%</div>
                    </div>
                  </div>

                  <div className="bg-white border border-[rgba(0,0,0,0.06)] rounded-[10px] p-[16px] flex gap-[12px] hover:border-[rgba(0,0,0,0.12)] hover:translate-y-[-2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all">
                    <div className="flex-shrink-0 w-[40px] h-[40px] rounded-[8px] bg-[rgba(245,158,11,0.1)] flex items-center justify-center text-[#f59e0b]">
                      📈
                    </div>
                    <div className="flex flex-col gap-[4px] min-w-0">
                      <div className="text-[11px] text-[#9e9e9e] font-medium uppercase tracking-[0.3px]">평균 ROAS</div>
                      <div className="flex items-center gap-[6px] flex-wrap">
                        <span className="text-[12px] text-[#bdbdbd] line-through">{baseRoas.toFixed(0)}%</span>
                        <span className="text-[11px] text-[#bdbdbd]">→</span>
                        <span className="text-[15px] font-bold text-[#f59e0b]">{simResult.roas.toFixed(0)}%</span>
                      </div>
                      <div className="text-[11px] font-semibold text-[#9e9e9e]">{roasChange >= 0 ? '+' : ''}{roasChange.toFixed(1)}%p</div>
                    </div>
                  </div>

                  <div className="bg-white border border-[rgba(59,130,246,0.25)] rounded-[10px] p-[16px] flex gap-[12px] bg-gradient-to-br from-white to-[rgba(59,130,246,0.03)] hover:translate-y-[-2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all">
                    <div className="flex-shrink-0 w-[40px] h-[40px] rounded-[8px] bg-[rgba(59,130,246,0.1)] flex items-center justify-center text-[#3b82f6]">
                      📦
                    </div>
                    <div className="flex flex-col gap-[4px] min-w-0">
                      <div className="text-[11px] text-[#9e9e9e] font-medium uppercase tracking-[0.3px]">투자 효율</div>
                      <div className="text-[20px] font-extrabold text-[#3b82f6] leading-[1] mt-[4px]">
                        {simResult.roas > 300 ? 'A+' : simResult.roas > 200 ? 'B' : 'C'}
                      </div>
                      <div className="text-[10px] text-[#9e9e9e]">추가투자 대비 추가매출</div>
                    </div>
                  </div>
                </div>

                {/* 주요 항목별 상세 결과 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(103, 58, 183, 0.1))', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    📋
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#424242' }}>주요 항목별 상세 결과</span>
                  <span style={{ fontSize: '12px', color: '#9e9e9e', marginLeft: 'auto' }}>효율 기준: 고(150%+) / 중(50-150%) / 저(50%-)</span>
                </div>
                <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#424242', borderBottom: '2px solid #e0e0e0' }}>주요 항목</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#424242', borderBottom: '2px solid #e0e0e0' }}>현재 비용</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#424242', borderBottom: '2px solid #e0e0e0' }}>변경 비용</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#424242', borderBottom: '2px solid #e0e0e0' }}>현재 매출</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#424242', borderBottom: '2px solid #e0e0e0' }}>예상 매출</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#424242', borderBottom: '2px solid #e0e0e0' }}>현재 ROAS</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#424242', borderBottom: '2px solid #e0e0e0' }}>예상 ROAS</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#424242', borderBottom: '2px solid #e0e0e0' }}>추천</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSegments.map((seg, idx) => {
                        const budgetRatio = simulationBudgets[seg.name] ?? 100
                        const newCost = seg.currentBudget * budgetRatio / 100
                        const currentRevenue = seg.currentBudget * seg.roas / 100
                        const newRevenue = newCost * seg.roas / 100 * (budgetRatio > 100 ? Math.log(budgetRatio) / Math.log(100) * 0.8 + 0.2 : 1)
                        const newRoas = newCost > 0 ? (newRevenue / newCost) * 100 : 0
                        const efficiency = budgetRatio > 100 ? (newRevenue - currentRevenue) / (newCost - seg.currentBudget) * 100 : 0
                        const recommendation = efficiency > 150 ? '증액' : efficiency > 50 ? '유지' : budgetRatio < 100 ? '감액' : '관망'
                        const recColor = recommendation === '증액' ? '#10b981' : recommendation === '감액' ? '#ef4444' : '#f59e0b'
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #eeeeee' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 500, color: '#212121' }}>{seg.name}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', color: '#616161' }}>₩{(seg.currentBudget / 1000000).toFixed(1)}M</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', color: budgetRatio !== 100 ? '#673ab7' : '#616161', fontWeight: budgetRatio !== 100 ? 600 : 400 }}>₩{(newCost / 1000000).toFixed(1)}M</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', color: '#616161' }}>₩{(currentRevenue / 1000000).toFixed(1)}M</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', color: newRevenue > currentRevenue ? '#10b981' : newRevenue < currentRevenue ? '#ef4444' : '#616161', fontWeight: 600 }}>₩{(newRevenue / 1000000).toFixed(1)}M</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', color: '#616161' }}>{seg.roas}%</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', color: newRoas > seg.roas ? '#10b981' : newRoas < seg.roas ? '#ef4444' : '#616161', fontWeight: 600 }}>{newRoas.toFixed(0)}%</td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: `${recColor}15`, color: recColor }}>{recommendation}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 시뮬레이션 분석 인사이트 박스 */}
                <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                      💡
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>시뮬레이션 분석</span>
                    <div style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: simResult.totalRevenue > baseRevenue ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: simResult.totalRevenue > baseRevenue ? '#10b981' : '#ef4444' }}>
                      {simResult.totalRevenue > baseRevenue ? '긍정적' : simResult.totalRevenue < baseRevenue ? '부정적' : '중립'}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ background: 'white', borderRadius: '8px', padding: '16px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                        📊 분석 결과
                      </div>
                      <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
                        {simResult.totalRevenue > baseRevenue
                          ? `예산 조정으로 매출이 약 ${((simResult.totalRevenue - baseRevenue) / 1000000).toFixed(1)}M 증가할 것으로 예상됩니다. ${filteredSegments.filter(s => (simulationBudgets[s.name] ?? 100) > 100).length > 0 ? `특히 ${filteredSegments.filter(s => (simulationBudgets[s.name] ?? 100) > 100).map(s => s.name).join(', ')} 예산 증액이 효과적입니다.` : ''}`
                          : simResult.totalRevenue < baseRevenue
                          ? `예산 축소로 매출이 약 ${((baseRevenue - simResult.totalRevenue) / 1000000).toFixed(1)}M 감소할 것으로 예상됩니다. 비용 효율화에 집중하는 전략입니다.`
                          : '현재 예산 배분을 유지하면 기존 성과가 유지될 것으로 예상됩니다.'
                        }
                      </div>
                    </div>
                    <div style={{ background: 'white', borderRadius: '8px', padding: '16px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                        ⚠️ 시뮬레이션 주의사항
                      </div>
                      <ul style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6, margin: 0, paddingLeft: '16px' }}>
                        <li>예산 증가 시 <strong>체감 수익 효과</strong>가 적용됩니다</li>
                        <li>실제 결과는 시장 상황, 경쟁에 따라 달라질 수 있습니다</li>
                        <li>본 시뮬레이션은 의사결정 <strong>참고용</strong>입니다</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
                )
              })()}
            </div>
          )}

          {/* 주요 항목 트렌드 탭 */}
          {activeAnalysisTab === 'segment-trend' && (
            <div className="bg-white rounded-[12px] shadow-[0_2px_14px_rgba(32,40,45,0.08)] p-[24px]">
              <div className="text-[16px] font-semibold text-[#212121] mb-[16px] flex items-center gap-[8px]">
                <span className="w-[4px] h-[20px] bg-[#2196f3] rounded-[2px]" />
                성과 예측 추이
              </div>
              <div className="h-[400px] bg-[#fafafa] rounded-[12px] p-[16px] flex items-center justify-center text-[#9e9e9e]">
                Chart.js 차트 영역 (실제 구현 시 Chart.js 통합 필요)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 데이터 분석 알고리즘 (접기/펼치기) */}
      <div className="mb-[24px]">
        <div
          onClick={() => toggleCollapsible('dataAnalysis')}
          className="flex justify-between items-center cursor-pointer select-none p-[20px_24px] bg-white rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#eeeeee] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all"
        >
          <div className="flex items-center gap-[12px] text-[18px] font-semibold text-[#212121]">
            <span className="text-[24px]">📊</span>
            <span>데이터 분석 알고리즘</span>
          </div>
          <button className="flex items-center gap-[8px] px-[16px] py-[8px] bg-[#ede7f6] text-[#673ab7] border-none rounded-[8px] text-[14px] font-medium cursor-pointer hover:bg-[#673ab7] hover:text-white transition-all">
            <span>{collapsibleStates.dataAnalysis ? '접기' : '펼치기'}</span>
            <span className={`transition-transform duration-200 ${collapsibleStates.dataAnalysis ? 'rotate-180' : ''}`}>▼</span>
          </button>
        </div>

        <div className={`overflow-hidden transition-[max-height_0.3s_ease,opacity_0.2s_ease,padding_0.3s_ease] ${collapsibleStates.dataAnalysis ? 'max-h-[5000px] opacity-100 p-[24px]' : 'max-h-0 opacity-0 px-[24px] py-0'}`}>
          {/* 섹션 설명 */}
          <div className="text-[13px] text-[#616161] p-[16px] bg-gradient-to-br from-[#f0f4ff] to-[#e8eeff] leading-[1.7] rounded-[8px] mb-[24px]">
            <strong className="text-[#673ab7]">📖 통계 분석이란?</strong><br />
            AI 알고리즘을 활용하여 <strong>데이터의 숨겨진 패턴과 미래 트렌드</strong>를 발견합니다.<br />
            <span className="text-[#616161]">시계열 예측, 계절성 분석, 지표 간 상관관계를 통해 데이터 기반 의사결정을 지원합니다.</span><br /><br />
            <strong className="text-[#673ab7]">💡 어떻게 활용하나요?</strong><br />
            • <strong>예측 & 트렌드</strong>: 미래 성과를 예측하고 계절적 패턴을 파악하여 선제적 대응<br />
            • <strong>관계 & 품질</strong>: 지표 간 연관성을 이해하고 데이터 품질을 검증하여 정확한 분석
          </div>

          {/* 통계 분석 서브 탭 */}
          <div className="flex gap-[8px] mb-[24px]">
            <button
              onClick={() => setActiveStatisticsTab('forecast-trend')}
              className={`px-[24px] py-[10px] border-none rounded-[8px] cursor-pointer text-[14px] font-medium transition-all ${
                activeStatisticsTab === 'forecast-trend'
                  ? 'bg-[#673ab7] text-white shadow-[0_4px_12px_rgba(103,58,183,0.4)]'
                  : 'bg-white text-[#616161] shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:bg-[#ede7f6] hover:text-[#673ab7]'
              }`}
            >
              📈 예측 & 트렌드
            </button>
            <button
              onClick={() => setActiveStatisticsTab('correlation-quality')}
              className={`px-[24px] py-[10px] border-none rounded-[8px] cursor-pointer text-[14px] font-medium transition-all ${
                activeStatisticsTab === 'correlation-quality'
                  ? 'bg-[#673ab7] text-white shadow-[0_4px_12px_rgba(103,58,183,0.4)]'
                  : 'bg-white text-[#616161] shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:bg-[#ede7f6] hover:text-[#673ab7]'
              }`}
            >
              🔍 관계 & 품질
            </button>
          </div>

          {/* 예측 & 트렌드 탭 */}
          {activeStatisticsTab === 'forecast-trend' && (
            <div>
              {/* 시계열 예측 분석 */}
              <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 14px rgba(32, 40, 45, 0.08)', padding: '24px', marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#212121', marginBottom: '16px' }}>📈 시계열 예측 분석</div>
                <div style={{ width: '100%', marginBottom: '20px' }}>
                  <div style={{ width: '100%', height: '300px', background: '#fafafa', borderRadius: '8px', border: '1px solid #eeeeee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9e9e9e' }}>
                    시계열 예측 차트 이미지 (visualizations/timeseries_forecast.png)
                  </div>
                </div>

                {/* 예측 인사이트 */}
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#212121', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '4px', height: '20px', background: '#ffab00', borderRadius: '2px' }} />
                  💡 예측 인사이트
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)', borderRadius: '10px', borderLeft: '4px solid #2196f3' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#212121', marginBottom: '8px' }}>🎯 예측 정확도</div>
                    <div style={{ fontSize: '12px', color: '#616161', lineHeight: 1.6 }}>
                      Prophet 알고리즘을 통해 <strong>95% 신뢰구간</strong>으로 향후 30일 성과를 예측합니다.
                    </div>
                  </div>
                  <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #fff8e1 0%, #fff3e0 100%)', borderRadius: '10px', borderLeft: '4px solid #ffab00' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#212121', marginBottom: '8px' }}>📊 추세 분석</div>
                    <div style={{ fontSize: '12px', color: '#616161', lineHeight: 1.6 }}>
                      장기 트렌드를 파악하여 <strong>성장 또는 하락 구간</strong>을 식별합니다.
                    </div>
                  </div>
                  <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)', borderRadius: '10px', borderLeft: '4px solid #00c853' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#212121', marginBottom: '8px' }}>⚡ 실무 활용</div>
                    <div style={{ fontSize: '12px', color: '#616161', lineHeight: 1.6 }}>
                      예측 데이터로 <strong>사전 예산 조정</strong>, <strong>프로모션 타이밍</strong>을 최적화할 수 있습니다.
                    </div>
                  </div>
                </div>

                {/* 예측 해석 가이드 */}
                <div style={{ background: '#fafafa', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #2196f3' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#212121' }}>📚 예측 차트 읽는 법</div>
                  <div style={{ display: 'grid', gap: '8px', fontSize: '12px', color: '#616161' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#2196f3', fontWeight: 600 }}>●</span>
                      <span><strong>파란색 실선</strong>: 실제 관측된 데이터 (과거 실적)</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#673ab7', fontWeight: 600 }}>●</span>
                      <span><strong>보라색 실선</strong>: AI 모델의 예측값 (미래 예상 성과)</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#9e9e9e', fontWeight: 600 }}>▓</span>
                      <span><strong>음영 영역</strong>: 95% 신뢰구간 (실제 값이 이 범위에 있을 확률 95%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 계절성 분해 */}
              <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 14px rgba(32, 40, 45, 0.08)', padding: '24px', marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#212121', marginBottom: '16px' }}>🔄 계절성 분해 분석</div>
                <div style={{ width: '100%', marginBottom: '20px' }}>
                  <div style={{ width: '100%', height: '300px', background: '#fafafa', borderRadius: '8px', border: '1px solid #eeeeee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9e9e9e' }}>
                    계절성 분해 차트 이미지 (visualizations/seasonal_decomposition.png)
                  </div>
                </div>

                {/* 계절성 인사이트 */}
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#212121', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '4px', height: '20px', background: '#ffab00', borderRadius: '2px' }} />
                  💡 계절성 인사이트
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)', borderRadius: '10px', borderLeft: '4px solid #00c853' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#212121', marginBottom: '8px' }}>📈 Trend (추세)</div>
                    <div style={{ fontSize: '12px', color: '#616161', lineHeight: 1.6 }}>
                      장기적인 <strong>상승/하락 방향</strong>을 보여줍니다.
                    </div>
                  </div>
                  <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #fff8e1 0%, #fff3e0 100%)', borderRadius: '10px', borderLeft: '4px solid #ffab00' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#212121', marginBottom: '8px' }}>🔄 Seasonal (계절성)</div>
                    <div style={{ fontSize: '12px', color: '#616161', lineHeight: 1.6 }}>
                      <strong>주기적으로 반복되는 패턴</strong>을 식별합니다.
                    </div>
                  </div>
                  <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)', borderRadius: '10px', borderLeft: '4px solid #ffab00' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#212121', marginBottom: '8px' }}>📊 Residual (잔차)</div>
                    <div style={{ fontSize: '12px', color: '#616161', lineHeight: 1.6 }}>
                      추세와 계절성으로 설명되지 않는 <strong>불규칙한 변동</strong>입니다.
                      이상 이벤트나 외부 요인을 파악하세요.
                    </div>
                  </div>
                </div>

                {/* 실무 활용 팁 */}
                <div style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#673ab7' }}>🎯 실무 활용 팁</div>
                  <div style={{ display: 'grid', gap: '8px', fontSize: '12px', color: '#616161' }}>
                    <div><strong>✓ 계절성 패턴 활용</strong>: 성수기/비수기를 미리 파악하여 예산과 재고를 사전 조정</div>
                    <div><strong>✓ 추세 기반 전략</strong>: 상승 추세 시 공격적 투자, 하락 추세 시 효율성 개선에 집중</div>
                    <div><strong>✓ 잔차 분석</strong>: 큰 변동이 발생한 시점을 찾아 특별한 이벤트나 캠페인 효과 분석</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 관계 & 품질 탭 */}
          {activeStatisticsTab === 'correlation-quality' && (
            <div>
              {/* 상관관계 히트맵 */}
              <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 14px rgba(32, 40, 45, 0.08)', padding: '24px', marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#212121', marginBottom: '16px' }}>🔗 상관관계 히트맵</div>
                <div style={{ maxWidth: '70%', marginLeft: 'auto', marginRight: 'auto', marginBottom: '20px' }}>
                  <div style={{ width: '100%', height: '300px', background: '#fafafa', borderRadius: '8px', border: '1px solid #eeeeee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9e9e9e' }}>
                    상관관계 히트맵 이미지 (visualizations/correlation_heatmap.png)
                  </div>
                </div>

                {/* 상관관계 인사이트 */}
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#212121', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '4px', height: '20px', background: '#ffab00', borderRadius: '2px' }} />
                  💡 상관관계 인사이트
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)', borderRadius: '10px', borderLeft: '4px solid #00c853' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#212121', marginBottom: '8px' }}>🔴 강한 양의 상관</div>
                    <div style={{ fontSize: '12px', color: '#616161', lineHeight: 1.6 }}>
                      진한 빨간색(+0.7 이상)은 <strong>함께 증가하는 관계</strong>입니다.
                      예: 비용↑ → 전환수↑
                    </div>
                  </div>
                  <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #fff8e1 0%, #fff3e0 100%)', borderRadius: '10px', borderLeft: '4px solid #ffab00' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#212121', marginBottom: '8px' }}>🔵 강한 음의 상관</div>
                    <div style={{ fontSize: '12px', color: '#616161', lineHeight: 1.6 }}>
                      진한 파란색(-0.7 이하)은 <strong>반대로 움직이는 관계</strong>입니다.
                      예: CPA↑ → ROAS↓
                    </div>
                  </div>
                  <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)', borderRadius: '10px', borderLeft: '4px solid #ffab00' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#212121', marginBottom: '8px' }}>⚪ 약한 상관</div>
                    <div style={{ fontSize: '12px', color: '#616161', lineHeight: 1.6 }}>
                      연한 색(-0.3 ~ +0.3)은 <strong>독립적인 관계</strong>입니다.
                      서로 영향을 주지 않는 지표입니다.
                    </div>
                  </div>
                </div>

                {/* 상관관계 활용 가이드 */}
                <div style={{ background: '#fafafa', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #00c853' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#212121' }}>📚 상관관계 활용 전략</div>
                  <div style={{ display: 'grid', gap: '8px', fontSize: '12px', color: '#616161' }}>
                    <div><strong>1. 레버리지 지표 발견</strong>: 전환수/매출과 강한 양의 상관관계를 가진 지표에 집중 투자</div>
                    <div><strong>2. 비효율 요인 제거</strong>: 비용과 강한 양의 상관이지만 매출과 약한 상관인 채널은 재검토</div>
                    <div><strong>3. 다변량 최적화</strong>: 여러 지표 간 관계를 고려한 종합적인 마케팅 전략 수립</div>
                  </div>
                </div>
              </div>

              {/* 이상치 & 데이터 분포 */}
              <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 14px rgba(32, 40, 45, 0.08)', padding: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                  {/* 이상치 분석 */}
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#212121', marginBottom: '16px', textAlign: 'center' }}>⚠️ 이상치 분석</div>
                    <div style={{ width: '100%', height: '250px', background: '#fafafa', borderRadius: '8px', border: '1px solid #eeeeee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9e9e9e' }}>
                      이상치 분석 이미지 (visualizations/boxplot_outliers.png)
                    </div>
                  </div>

                  {/* 데이터 분포 */}
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#212121', marginBottom: '16px', textAlign: 'center' }}>📊 데이터 분포 분석</div>
                    <div style={{ width: '100%', height: '250px', background: '#fafafa', borderRadius: '8px', border: '1px solid #eeeeee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9e9e9e' }}>
                      분포 분석 이미지 (visualizations/distribution_analysis.png)
                    </div>
                  </div>
                </div>

                {/* 데이터 품질 인사이트 */}
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#212121', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '4px', height: '20px', background: '#ffab00', borderRadius: '2px' }} />
                  💡 데이터 품질 인사이트
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #ffebee 0%, #fce4ec 100%)', borderRadius: '10px', borderLeft: '4px solid #ff1744' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#212121', marginBottom: '8px' }}>⚠️ 이상치 탐지</div>
                    <div style={{ fontSize: '12px', color: '#616161', lineHeight: 1.6 }}>
                      박스플롯에서 <strong>상자 밖의 점</strong>은 이상치입니다.
                      데이터 오류인지, 특별한 이벤트인지 확인하세요.
                      <div style={{ marginTop: '8px', padding: '8px', background: '#ffeaea', borderRadius: '4px' }}>
                        <strong>체크포인트</strong>: 이상치가 5% 이상이면 데이터 품질 재검토 필요
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)', borderRadius: '10px', borderLeft: '4px solid #2196f3' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#212121', marginBottom: '8px' }}>📊 분포 패턴</div>
                    <div style={{ fontSize: '12px', color: '#616161', lineHeight: 1.6 }}>
                      히스토그램이 <strong>종 모양</strong>이면 정규분포입니다.
                      편향되거나 여러 봉우리가 있다면 주요 항목 분리를 고려하세요.
                      <div style={{ marginTop: '8px', padding: '8px', background: '#e3f2fd', borderRadius: '4px' }}>
                        <strong>TIP</strong>: 정규분포일수록 예측 모델의 정확도가 높아집니다
                      </div>
                    </div>
                  </div>
                </div>

                {/* 데이터 품질 체크리스트 */}
                <div style={{ background: 'linear-gradient(135deg, #fff4f0 0%, #ffebe8 100%)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #ff1744' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#ff1744' }}>🔍 데이터 품질 체크리스트</div>
                  <div style={{ display: 'grid', gap: '6px', fontSize: '12px', color: '#616161' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#ff1744' }}>□</span>
                      <span>이상치 비율이 5% 미만인가?</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#ff1744' }}>□</span>
                      <span>데이터 분포가 예상 범위 내에 있는가?</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#ff1744' }}>□</span>
                      <span>이상치 발생 시점에 특별 이벤트가 있었는가?</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#ff1744' }}>□</span>
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
  )
}
