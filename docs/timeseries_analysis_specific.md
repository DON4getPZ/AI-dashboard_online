# timeseries_analysis.html 기능 분석 문서

## 개요
`data/timeseries_analysis.html`은 **시계열 데이터 분석 대시보드**로, AI(Prophet) 기반 예측 모델을 통한 광고 성과 예측 및 인사이트를 제공하는 대시보드입니다.

---

## 파일 구조

### 외부 라이브러리
| 라이브러리 | 용도 |
|-----------|------|
| Chart.js | 차트 시각화 |
| Google Fonts (Roboto, Inter) | 폰트 |

---

## 섹션별 기능 브리핑

### 1. AI 상태 요약 카드
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | (상단 고정 카드) |
| **HTML ID** | `summaryCardContainer` |
| **JS 함수** | `updateSummaryCard()` |
| **참조 데이터** | `insights.json` → `by_period[period].summary_card` |
| **기능** | - 현재 상태 (status_title, status_message)<br>- 현재/예측 매출, ROAS 비교<br>- 상태별 색상 표시 (blue/green/yellow/red) |

---

### 2. 핵심 KPI 요약
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | (KPI 카드 그리드) |
| **HTML ID** | `kpiSummaryGrid` |
| **JS 함수** | `updateKPISummary()` |
| **참조 데이터** | `forecast/predictions_daily.csv` |
| **기능** | - 효율 지표 5개: 예측 비용, CPM, CPC, CPA, ROAS<br>- 기본 성과 4개: 예측 노출, 클릭, 전환수, 전환값<br>- 실제 대비 변화율 표시 (▲/▼) |

---

### 3. 통합 인사이트 대시보드 (collapsible-section #1)
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 🔬 통합 인사이트 대시보드 |
| **위치** | Line 1197 |

#### 3.1 AI 인사이트 요약
| 항목 | 내용 |
|------|------|
| **HTML ID** | `aiSummaryContainer`, `aiSummaryContent` |
| **JS 함수** | `updateAiSummary()`, `switchAiSummaryPeriod()`, `getAiSummaryPeriodData()` |
| **참조 데이터** | `insights.json` → `by_period[aiSummaryPeriod].summary` |
| **기능** | - AI 스토리 배너<br>- 독립적인 기간 필터 (full/180d/90d)<br>- 카테고리별 인사이트 카드 (성과 현황, 상승/하락 트렌드, 경고, 추천 액션 등)<br>- 증감 강조 표시 (+/-% 컬러링) |

#### 3.2 경고 및 추천 탭
| 항목 | 내용 |
|------|------|
| **HTML ID** | `alertsTab`, `insightContent`, `recommendationContent` |
| **JS 함수** | `updateInsightsFromData()`, `updateRecommendations()`, `toggleAlerts()`, `toggleRecommendations()`, `toggleRecommendationCard()` |
| **참조 데이터** | `insights.json` → `by_period[period].segments.alerts`, `segments.recommendations` |
| **기능** | - 주요 경고 알림 (세그먼트별)<br>- 투자 추천 (우선순위, 액션, 타겟, 이유, 기대 효과)<br>- 더보기/접기 기능<br>- 카드 확장 상세보기 |

#### 3.3 기회 요소 탭
| 항목 | 내용 |
|------|------|
| **HTML ID** | `opportunitiesTab`, `opportunitiesContent` |
| **JS 함수** | `updateOpportunities()` |
| **참조 데이터** | `insights.json` → `by_period[period].opportunities` |
| **기능** | - 성장 가능성 높은 영역 표시<br>- 추천 액션 및 기대 효과 |

---

### 4. 최근 변화 인사이트 (collapsible-section #2)
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 📈 최근 변화 인사이트 |
| **위치** | Line 1306 |

#### 4.1 성과 개선 분석
| 항목 | 내용 |
|------|------|
| **HTML ID** | `improvementTrendContent` |
| **JS 함수** | `updatePerformanceTrends()`, `updateImprovementTrends()`, `updateTrendPeriodIndicator()` |
| **참조 데이터** | `insights.json` → `by_period[period].performance_trends` |
| **기능** | - 7일/14일/30일 비교 기간 선택<br>- 개선된 지표 표시 (증가율, 채널별) |

#### 4.2 성과 하락 경고
| 항목 | 내용 |
|------|------|
| **HTML ID** | `declineTrendContent` |
| **JS 함수** | `updateDeclineTrends()` |
| **참조 데이터** | `insights.json` → `by_period[period].performance_trends` |
| **기능** | - 하락 감지 지표 표시 (감소율, 채널별) |

---

### 5. 성과 분석 대시보드 (collapsible-section #3)
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 📊 성과 분석 대시보드 |
| **위치** | Line 1360 |

#### 5.1 전체 성과 예측 탭
| 항목 | 내용 |
|------|------|
| **HTML ID** | `forecastTab`, `forecastChart` |
| **JS 함수** | `updateChart()`, `loadData()`, `aggregateData()`, `updateInsights()` |
| **참조 데이터** | `forecast/predictions_daily.csv` |
| **기능** | - 일별/주별/월별 집계 선택<br>- 지표 체크박스 (비용, 노출, 클릭, 전환수, 전환값)<br>- 실제/예측 분리 차트 (실선 vs 점선)<br>- 이중 Y축 (금액/수량) |

#### 5.2 세그먼트 비교 탭
| 항목 | 내용 |
|------|------|
| **HTML ID** | `segmentCompareTab`, `segmentCompareChart`, `segmentDetailCards` |
| **JS 함수** | `updateSegmentCompareChart()`, `updateSegmentDetailCards()`, `initSegmentAnalysis()` |
| **참조 데이터** | `forecast/segment_channel.csv`, `segment_product.csv`, `segment_brand.csv`, `segment_promotion.csv` |
| **기능** | - 세그먼트 타입 선택 (채널/제품/브랜드/프로모션)<br>- 비교 지표 선택 (ROAS/전환수/매출/비용/CVR)<br>- 실제 vs 예측 막대 차트<br>- 세그먼트별 상세 카드 (ROAS, 전환수, CVR 비교) |

#### 5.3 세그먼트 트렌드 탭
| 항목 | 내용 |
|------|------|
| **HTML ID** | `segmentTrendTab`, `segmentTrendChart`, `segmentTrendCheckboxes` |
| **JS 함수** | `updateSegmentTrendCheckboxes()`, `updateSegmentTrendChart()` |
| **참조 데이터** | `forecast/segment_*.csv` (동적 로드) |
| **기능** | - 일별/주별/월별 집계 선택<br>- 세그먼트 타입 선택<br>- 항목 체크박스 (최대 5개)<br>- 시간에 따른 ROAS 추이 차트 (실제/예측 분리) |

#### 5.4 비즈니스 인사이트 탭
| 항목 | 내용 |
|------|------|
| **HTML ID** | `businessInsightsTab` |
| **위치** | Line 1513 |

##### 5.4.1 채널별 ROAS 서브탭
| 항목 | 내용 |
|------|------|
| **HTML ID** | `channelRoasTab` |
| **참조 데이터** | `visualizations/channel_roas_comparison.png` |
| **기능** | - 채널 ROAS 비교 이미지<br>- 고성과 채널 / 개선 필요 채널 인사이트 |

##### 5.4.2 제품 매출 & 예산 서브탭
| 항목 | 내용 |
|------|------|
| **HTML ID** | `productBudgetTab` |
| **참조 데이터** | `visualizations/product_revenue_pie.png`, `visualizations/budget_gauge.png` |
| **기능** | - 제품별 매출 기여도 파이차트<br>- 월 예산 소진율 게이지<br>- 제품별 상세 현황 테이블 (등급 A+~D)<br>- 예산 초과 경고 및 액션 플랜 |

---

### 6. 데이터 분석 알고리즘 (collapsible-section #4)
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 📊 데이터 분석 알고리즘 |
| **위치** | Line 1749 |

#### 6.1 예측 & 트렌드 서브탭
| 항목 | 내용 |
|------|------|
| **HTML ID** | `forecastTrendTab` |
| **참조 데이터** | `visualizations/timeseries_forecast.png`, `visualizations/seasonal_decomposition.png` |
| **기능** | - Prophet 시계열 예측 분석 이미지<br>- 예측 차트 읽는 법 가이드<br>- 계절성 분해 분석 (Trend, Seasonal, Residual)<br>- 실무 활용 팁 |

#### 6.2 관계 & 품질 서브탭
| 항목 | 내용 |
|------|------|
| **HTML ID** | `correlationQualityTab` |
| **참조 데이터** | `visualizations/correlation_heatmap.png`, `visualizations/boxplot_outliers.png`, `visualizations/distribution_analysis.png` |
| **기능** | - 상관관계 히트맵<br>- 이상치 분석 (박스플롯)<br>- 데이터 분포 분석 (히스토그램)<br>- 데이터 품질 체크리스트 |

---

## 버튼 UI 컴포넌트

### 1. 섹션 토글 버튼
| 클래스 | 기능 |
|--------|------|
| `collapsible-toggle` | 섹션 접기/펼치기 |

### 2. 기간 필터 버튼 (분석 기간)
| 클래스 | data 속성 | 호출 함수 | 기능 |
|--------|----------|----------|------|
| `period-btn` | `data-period="full\|180d\|90d"` | `switchPeriod()` | 전체/180일/90일 기간 전환 |

### 3. AI 요약 기간 필터 버튼 (독립)
| 클래스 | data 속성 | 호출 함수 | 기능 |
|--------|----------|----------|------|
| `ai-period-btn` | `data-ai-period="full\|180d\|90d"` | `switchAiSummaryPeriod()` | AI 요약 전용 기간 전환 |

### 4. 인사이트 탭 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `insights-tab-btn` | `data-insights-tab="alerts"` | 경고 및 추천 탭 |
| `insights-tab-btn` | `data-insights-tab="opportunities"` | 기회 요소 탭 |

### 5. 트렌드 기간 비교 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `trend-period-btn` | `data-trend-period="7d\|14d\|30d"` | 7일/14일/30일 비교 기간 |

### 6. 성과 분석 탭 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `analysis-tab-btn` | `data-tab="forecast"` | 전체 성과 예측 |
| `analysis-tab-btn` | `data-tab="segment-compare"` | 세그먼트 비교 |
| `analysis-tab-btn` | `data-tab="segment-trend"` | 세그먼트 트렌드 |
| `analysis-tab-btn` | `data-tab="business-insights"` | 비즈니스 인사이트 |

### 7. 뷰 타입 버튼 (일별/주별/월별)
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `view-btn` | `data-view="daily\|weekly\|monthly"` | 전체 성과 예측 집계 단위 |
| `segment-trend-view-btn` | `data-view="daily\|weekly\|monthly"` | 세그먼트 트렌드 집계 단위 |

### 8. 세그먼트 타입 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `segment-type-btn` | `data-segment="channel\|product\|brand\|promotion"` | 세그먼트 비교 타입 |
| `segment-trend-type-btn` | `data-segment="channel\|product\|brand\|promotion"` | 세그먼트 트렌드 타입 |

### 9. 세그먼트 메트릭 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `segment-metric-btn` | `data-metric="roas\|conversions\|revenue\|cost\|cvr"` | 비교 지표 선택 |

### 10. 비즈니스 인사이트 서브탭 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `business-subtab-btn` | `data-business-tab="channel-roas"` | 채널별 ROAS |
| `business-subtab-btn` | `data-business-tab="product-budget"` | 제품 매출 & 예산 |

### 11. 통계 분석 서브탭 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `statistics-subtab-btn` | `data-statistics-tab="forecast-trend"` | 예측 & 트렌드 |
| `statistics-subtab-btn` | `data-statistics-tab="correlation-quality"` | 관계 & 품질 |

### 12. 차트 체크박스
| HTML ID | 기능 |
|---------|------|
| `chartCost` | 비용 표시 |
| `chartImpressions` | 노출 표시 |
| `chartClicks` | 클릭 표시 |
| `chartConversions` | 전환수 표시 |
| `chartValue` | 전환값 표시 |

### 13. 세그먼트 트렌드 체크박스
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `segment-trend-checkbox` | `data-segment="[세그먼트명]"` | 최대 5개 항목 선택 |

---

## 전역 변수 및 상태 관리

### 데이터 변수
| 변수명 | 설명 | 로드 소스 |
|--------|------|----------|
| `forecastData` | 예측 데이터 배열 | forecast/predictions_daily.csv |
| `insightsData` | 인사이트 데이터 | forecast/insights.json |
| `segmentStatsData` | 세그먼트 통계 | forecast/segment_stats.json |
| `segmentData` | 세그먼트별 CSV 데이터 | forecast/segment_*.csv |

### 상태 변수
| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `currentView` | 현재 뷰 타입 | 'daily' |
| `currentPeriod` | 분석 기간 | 'full' |
| `aiSummaryPeriod` | AI 요약 기간 (독립) | 'full' |
| `currentSegmentType` | 세그먼트 비교 타입 | 'channel' |
| `currentSegmentMetric` | 세그먼트 비교 지표 | 'roas' |
| `currentTrendSegmentType` | 세그먼트 트렌드 타입 | 'channel' |
| `segmentTrendViewType` | 세그먼트 트렌드 뷰 타입 | 'daily' |
| `alertsExpanded` | 경고 펼침 상태 | false |
| `recommendationsExpanded` | 추천 펼침 상태 | false |
| `INITIAL_ALERTS_COUNT` | 초기 경고 표시 개수 | 6 |
| `INITIAL_RECOMMENDATIONS_COUNT` | 초기 추천 표시 개수 | 4 |

---

## 핵심 함수 목록

### 초기화 함수
| 함수명 | 기능 |
|--------|------|
| `loadData()` | 예측 CSV 데이터 로딩 |
| `loadInsightsAndSegments()` | 인사이트 JSON 로딩 |
| `loadSegmentData()` | 세그먼트 CSV 데이터 로딩 |
| `initSegmentAnalysis()` | 세그먼트 분석 초기화 |
| `initCollapsibles()` | 접기/펼치기 기능 초기화 |

### 기간 필터 함수
| 함수명 | 기능 |
|--------|------|
| `getPeriodData()` | 현재 기간의 인사이트 데이터 반환 |
| `getAiSummaryPeriodData()` | AI 요약용 기간 데이터 반환 |
| `switchPeriod(period)` | 분석 기간 전환 |
| `switchAiSummaryPeriod(period)` | AI 요약 기간 전환 |
| `updatePeriodIndicator()` | 실제 분석 기간 표시 업데이트 |
| `updateAllInsights()` | 모든 인사이트 섹션 업데이트 |

### 렌더링 함수
| 함수명 | 대상 |
|--------|------|
| `updateDashboard()` | 대시보드 전체 업데이트 |
| `updateKPISummary()` | KPI 요약 카드 |
| `updateSummaryCard()` | AI 상태 요약 카드 |
| `updateAiSummary()` | AI 인사이트 요약 |
| `updateOpportunities()` | 기회 요소 탭 |
| `updateInsightsBadges()` | 탭 배지 숫자 |
| `updateInsightsFromData()` | 경고 알림 |
| `updateRecommendations()` | 투자 추천 |
| `updatePerformanceTrends()` | 성과 트렌드 전체 |
| `updateImprovementTrends()` | 개선 트렌드 |
| `updateDeclineTrends()` | 하락 트렌드 |
| `updateTrendPeriodIndicator()` | 트렌드 기간 표시 |
| `updateChart()` | 예측 차트 |

### 세그먼트 함수
| 함수명 | 기능 |
|--------|------|
| `updateSegmentCompareChart()` | 세그먼트 비교 차트 |
| `updateSegmentDetailCards()` | 세그먼트 상세 카드 |
| `updateSegmentTrendCheckboxes()` | 세그먼트 트렌드 체크박스 |
| `updateSegmentTrendChart()` | 세그먼트 트렌드 차트 |

### 유틸리티 함수
| 함수명 | 기능 |
|--------|------|
| `formatNumber(num)` | 숫자 천단위 포맷 |
| `formatDecimal(num)` | 소수점 2자리 포맷 |
| `formatPercent(num)` | 퍼센트 포맷 |
| `parseCSV(text)` | RFC 4180 호환 CSV 파싱 |
| `aggregateData(data, viewType)` | 주별/월별 데이터 집계 |
| `transformRecommendationText()` | 추천 텍스트 변환 |
| `toggleAlerts()` | 경고 더보기/접기 |
| `toggleRecommendations()` | 추천 더보기/접기 |
| `toggleRecommendationCard(card)` | 추천 카드 확장/축소 |

---

## 참조 데이터 파일 구조

### forecast/insights.json
```
{
  "by_period": {
    "full": { ... },
    "180d": { ... },
    "90d": { ... }
  }
}
```

각 기간별 데이터 구조:
- `summary`: AI 요약 텍스트
- `summary_card`: 상태 카드 (status_title, status_message, status_color, period, metrics)
- `overall`: 전체 성과 (current_period, forecast_period, trend, alerts)
- `segments`: 세그먼트 분석 (alerts, recommendations)
- `opportunities`: 기회 요소 배열
- `performance_trends`: 성과 트렌드 데이터
- `details`: 상세 통계 (total_segment_alerts, total_recommendations 등)

### forecast/predictions_daily.csv
| 컬럼 | 설명 |
|------|------|
| 일 구분 | 날짜 |
| 비용_예측 | 예측 비용 |
| 노출_예측 | 예측 노출수 |
| 클릭_예측 | 예측 클릭수 |
| 전환수_예측 | 예측 전환수 |
| 전환값_예측 | 예측 전환값 |
| type | actual / forecast / mixed |

### forecast/segment_*.csv (channel, product, brand, promotion)
| 컬럼 | 설명 |
|------|------|
| 일 구분 | 날짜 |
| [세그먼트명] | 채널/제품/브랜드/프로모션명 |
| 비용_예측 | 예측 비용 |
| 노출_예측 | 예측 노출수 |
| 클릭_예측 | 예측 클릭수 |
| 전환수_예측 | 예측 전환수 |
| 전환값_예측 | 예측 전환값 |
| type | actual / forecast |

### visualizations/ 이미지 파일
| 파일명 | 용도 |
|--------|------|
| channel_roas_comparison.png | 채널별 ROAS 비교 차트 |
| product_revenue_pie.png | 제품별 매출 기여도 파이차트 |
| budget_gauge.png | 월 예산 소진율 게이지 |
| timeseries_forecast.png | Prophet 시계열 예측 |
| seasonal_decomposition.png | 계절성 분해 분석 |
| correlation_heatmap.png | 상관관계 히트맵 |
| boxplot_outliers.png | 이상치 박스플롯 |
| distribution_analysis.png | 데이터 분포 히스토그램 |

---

## 차트 인스턴스
| 변수명 | 차트 종류 |
|--------|----------|
| `forecastChart` | 예측 성과 추이 (Line) |
| `segmentCompareChart` | 세그먼트 비교 (Bar) |
| `segmentTrendChart` | 세그먼트 트렌드 (Line) |

---

## 사이드바 네비게이션
| 메뉴 | 링크 |
|------|------|
| 광고 성과 대시보드 | marketing_dashboard_v3.html |
| 광고 소재별 분석 | creative_analysis.html |
| 시계열 데이터 분석 | # (현재 페이지, active) |
| 유형구분별 비교 | # |
| 데이터 설정 | # |

---

## 변경 이력

| 날짜 | 작업 내용 |
|------|----------|
| 2025-12-05 | 문서 최초 작성 - timeseries_analysis.html 섹션별 기능 분석 |
| 2025-12-05 | Dead Code 정리 - 미사용 함수 5개 삭제: `updateOverallInsights`, `updateSegmentAnalysis`, `renderSegmentCards`, `updateInsights`, `updateTable` |
| 2025-12-05 | 중복 HTML 블록 삭제: `businessVizTab` (약 230라인), 관련 이벤트 핸들러 제거 |
| 2025-12-05 | 버튼 클래스 정규화: 전체 성과 예측 뷰 버튼에 `forecast-view-btn` 클래스 추가 |
| 2025-12-05 | 미사용 변수 삭제: `segmentStatsData` |
