# Timeseries HTML → React 마이그레이션 가이드

## 개요

`public/timeseries.html` (6,500+ 라인)을 `src/app/timeseries/ReactView.tsx`로 1:1 변환하는 작업입니다.

## 마이그레이션 원칙

### 1. 추상화 금지, 1:1 함수 복제

**잘못된 접근:**
```typescript
// ❌ 데이터를 추상화하여 일반적인 구조로 변환
interface InsightItem {
  type: string
  message: string
  value?: string
}
```

**올바른 접근:**
```typescript
// ✅ 원본 JSON 구조 그대로 타입 정의
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
}
```

### 2. 원본 JavaScript 함수 → React Hook/함수 변환

| 원본 HTML 함수 | React 변환 |
|---------------|-----------|
| `updateKPISummary()` | `kpiData = useMemo(() => {...}, [forecastData])` |
| `updateSummaryCard()` | `summaryCard = useMemo(() => {...}, [getPeriodData])` |
| `updateAiSummary()` | `aiSummaryCards = useMemo(() => {...}, [getAiPeriodData])` |
| `updateInsightsFromData()` | `allAlerts = useMemo(() => {...}, [getAiPeriodData])` |
| `updateRecommendations()` | `allRecommendations = useMemo(() => {...}, [getAiPeriodData])` |
| `updateOpportunities()` | `allOpportunities = useMemo(() => {...}, [getAiPeriodData])` |
| `renderMatrixInsights()` | `matrixInsights = useMemo(() => {...}, [getAiPeriodData])` |
| `updatePerformanceTrends()` | `performanceTrends = useMemo(() => {...}, [insightsData])` |
| `transformRecommendationText()` | `transformRecommendationText = useCallback(() => {...}, [])` |

### 3. 데이터 경로 정확히 매핑

```
insights.json 구조:
├── by_period
│   ├── full / 180d / 90d / 30d / 1d
│   │   ├── summary_card          → summaryCard
│   │   ├── overall.alerts        → allAlerts (병합)
│   │   ├── segments.alerts       → allAlerts (병합)
│   │   ├── segments.recommendations → allRecommendations
│   │   ├── opportunities         → allOpportunities
│   │   ├── matrix_insights       → matrixInsights
│   │   ├── summary (텍스트)      → aiSummaryCards (파싱)
│   │   └── performance_trends    → performanceTrends
│   │       ├── improvements_7d/14d/30d
│   │       └── declines_7d/14d/30d
```

## 섹션별 변환 체크리스트

### Section 1: 헤더 + AI 요약 카드 + KPI ✅

- [x] Summary Card 렌더링 (`status_title`, `status_message`, `status_color`, `period`, `metrics`)
- [x] KPI 계산 (CSV 데이터 `type === 'actual'` vs `type === 'forecast'`)
- [x] KPI 렌더링 (topKpis 5개, bottomKpis 4개)
- [x] 색상 맵핑 (`blue`, `green`, `yellow`, `red`)

### Section 2: 통합 인사이트 대시보드 ✅

- [x] 핵심 요약 탭 - `updateAiSummary()` 함수 복제
  - summary 텍스트 파싱 (줄바꿈 분리)
  - 이모지/키워드 기반 카테고리 판별
  - 3개 핵심 카드 선별 (우선순위 시스템)
  - `highlightChanges()` 함수 (증감 강조)
- [x] 경고 및 추천 탭
  - 경고: `segments.alerts` + `overall.alerts`
  - 추천: `segments.recommendations`
  - severity/priority별 스타일링
- [x] 기회 요소 탭 - `updateOpportunities()` 복제
  - type별 스타일 (scale_up, hidden_gem, growth_momentum)
- [x] Matrix 탭 - `renderMatrixInsights()` 복제
  - 4분면 스타일 (super_star, fading_hero, rising_potential, problem_child)
  - severity별 테두리/그림자

### Section 3: 최근 변화 인사이트 ✅

- [x] `performance_trends` 데이터 사용 (항상 `full` 기간)
- [x] 기간 선택 (7d/14d/30d) 한글 라벨
- [x] 개선 트렌드 카드 - `updateImprovementTrends()` 복제
- [x] 하락 트렌드 카드 - `updateDeclineTrends()` 복제
- [x] `transformRecommendationText()` 함수 적용

### Section 4: 예산 시뮬레이션 (예정)

- [ ] 세그먼트 타입 선택 (전체/채널별/제품별/브랜드별/프로모션별)
- [ ] 항목 드롭다운 선택
- [ ] 예산 조정 슬라이더
- [ ] 시뮬레이션 결과 카드
- [ ] 체감 수익 함수 적용

### Section 5: 데이터 분석 (예정)

- [ ] 주요 항목 트렌드 탭
- [ ] 통계 차트

## 데이터 파일

| 파일 | 용도 |
|-----|-----|
| `/forecast/predictions_daily.csv` | KPI 계산용 (한글 컬럼: `일 구분`, `비용_예측`, `노출_예측`, `클릭_예측`, `전환수_예측`, `전환값_예측`, `type`) |
| `/forecast/insights.json` | 인사이트 데이터 (`by_period` 구조) |
| `/forecast/segment_*.csv` | 세그먼트별 데이터 (brand, channel, product, promotion) |

## CSS

원본 HTML `<style>` 태그 내용을 `src/app/timeseries/timeseries-original.css`로 추출하여 사용.

## 주의사항

1. **TypeScript 정규표현식**: ES5 호환 필요 (유니코드 플래그 `u` 사용 불가)
2. **한글 라벨**: 모든 UI 텍스트 한글화 (예: `180d` → `180일`)
3. **데이터 없음 상태**: 원본과 동일한 아이콘/메시지 표시
4. **스타일 인라인화**: 원본의 인라인 스타일 그대로 유지
