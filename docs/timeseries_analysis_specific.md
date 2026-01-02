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
| **HTML ID** | `kpiSummaryGrid`, `kpiSectionContainer` |
| **JS 함수** | `updateKPISummary()` |
| **참조 데이터** | `forecast/predictions_daily.csv` |
| **기능** | - 주요/세부 성과 토글 (kpi-view-toggle)<br>- 효율 지표 5개: 예측 비용, CPM, CPC, CPA, ROAS<br>- 기본 성과 4개: 예측 노출, 클릭, 전환수, 전환값<br>- 실제 대비 변화율 표시 (▲/▼) |

#### 2.1 주요/세부 성과 토글
| 항목 | 내용 |
|------|------|
| **레이아웃** | `kpi-view-toggle` (토글 버튼 컨테이너) |
| **버튼 클래스** | `kpi-view-btn` |
| **data 속성** | `data-kpi-view="primary\|all"` |
| **컨테이너** | `kpi-section` (show-all 클래스 토글) |
| **주요 성과** | `kpi-grid-primary` - 효율 지표 5개 표시 |
| **세부 성과** | `kpi-grid-secondary` - 기본 성과 4개 추가 표시 |

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

#### 3.4 Forecast Matrix 탭 (4분면 분석)
| 항목 | 내용 |
|------|------|
| **HTML ID** | `matrixTab`, `matrixBrandTab`, `matrixChannelTab`, `matrixProductTab`, `matrixPromotionTab` |
| **JS 함수** | `renderMatrixInsights()`, `setupMatrixCardTooltip()` |
| **참조 데이터** | `insights.json` → `by_period[period].matrix_insights` |
| **기능** | - 4개 하위탭: 브랜드, 채널, 상품, 프로모션<br>- 4분면 분류: Super Star, Fading Hero, Rising Potential, Problem Child<br>- 마우스 커서 따라가는 툴팁 (4분면 설명)<br>- 세그먼트별 ROAS, 예측 성장률, 매출 비중 표시<br>- 추천 액션 카드 |

##### 3.4.1 Matrix 하위탭 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `matrix-sub-tab` | `data-matrix-tab="brand"` | 브랜드 세그먼트 |
| `matrix-sub-tab` | `data-matrix-tab="channel"` | 채널 세그먼트 |
| `matrix-sub-tab` | `data-matrix-tab="product"` | 상품 세그먼트 |
| `matrix-sub-tab` | `data-matrix-tab="promotion"` | 프로모션 세그먼트 |

##### 3.4.2 Matrix 카드 툴팁
| 항목 | 내용 |
|------|------|
| **HTML ID** | `matrixCardTooltip` |
| **CSS 클래스** | `matrix-tooltip-global` |
| **JS 함수** | `setupMatrixCardTooltip()` |
| **기능** | - 카드 호버 시 마우스 커서 따라가는 툴팁 표시<br>- 4분면 유형별 설명 (고효율+고성장, 고효율+역성장, 저효율+고성장, 저효율+역성장)<br>- 화면 경계 감지하여 위치 자동 조정 |

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

### 5. 예산 시뮬레이션 및 주요 항목 추이 (collapsible-section #3)
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 📊 예산 시뮬레이션 및 주요 항목 추이 |
| **위치** | Line 2330 |

#### 5.1 예산 시뮬레이션 탭
| 항목 | 내용 |
|------|------|
| **HTML ID** | `budgetSimulationMainTab`, `simulationSlidersContainer`, `simulationResultTable`, `simulationInsightBox` |
| **JS 함수** | `initBudgetSimulation()`, `updateSimulationSliders()`, `calculateSimulation()`, `renderSimulationResults()`, `generateSimulationInsight()` |
| **참조 데이터** | `forecast/segment_*.csv` (동적 로드) |
| **기능** | - 세그먼트 유형 선택 (전체/채널별/제품별/브랜드별/프로모션별)<br>- 항목 선택 드롭다운 (다중 선택)<br>- 항목별 예산 슬라이더 조절<br>- 초기화 버튼<br>- 시뮬레이션 결과 요약 카드 (총 비용, 예상 매출, 평균 ROAS, 투자 효율)<br>- 항목별 상세 결과 테이블<br>- AI 시뮬레이션 분석 인사이트 |

##### 5.1.1 시뮬레이션 결과 카드
| 지표 | 설명 |
|------|------|
| **총 비용** | 현재 비용 → 변경 비용 (변화율 표시) |
| **예상 매출** | 현재 매출 → 예상 매출 (변화율 표시) |
| **평균 ROAS** | 현재 ROAS → 예상 ROAS (변화율 표시) |
| **투자 효율** | 추가 투자 대비 추가 매출 비율 |

##### 5.1.2 상세 결과 테이블 컬럼
| 컬럼 | 설명 |
|------|------|
| 주요 항목 | 채널/제품/브랜드/프로모션명 |
| 현재 비용 | 기존 비용 |
| 변경 비용 | 슬라이더 조정 후 비용 |
| 현재 매출 | 기존 매출 |
| 예상 매출 | 시뮬레이션 예상 매출 |
| 현재 ROAS | 기존 ROAS |
| 예상 ROAS | 시뮬레이션 예상 ROAS |
| 추천 | 효율 기준 아이콘 (고/중/저) |

##### 5.1.3 시뮬레이션 연산 모델

###### 상수 정의
| 상수명 | 값 | 설명 |
|--------|-----|------|
| `DIMINISHING_FACTOR` | 0.15 | 체감 수익 계수 (예산 변동에 따른 ROAS 변화 민감도) |

###### 핵심 연산 함수

**1. 조정 ROAS 계산 (`calculateAdjustedRoas`)**
```
입력: currentRoas (현재 ROAS), budgetChangeRatio (예산 변동률, 예: 0.2 = +20%)

예산 증가 시 (budgetChangeRatio > 0):
  adjustedRoas = currentRoas × (1 - DIMINISHING_FACTOR × ln(1 + budgetChangeRatio))

예산 감소 시 (budgetChangeRatio < 0):
  adjustedRoas = currentRoas × (1 + DIMINISHING_FACTOR × ln(1 + |budgetChangeRatio|) × 0.5)

예산 변동 없음 (budgetChangeRatio = 0):
  adjustedRoas = currentRoas
```

**2. 예상 매출 계산**
```
newCost = currentCost × (1 + adjustment)
newRevenue = newCost × (adjustedRoas / 100)
```

**3. 투자 효율 계산**
```
additionalCost = totalNewCost - totalCurrentCost
additionalRevenue = totalNewRevenue - totalCurrentRevenue
investmentEfficiency = (additionalRevenue / additionalCost) × 100
```

###### 추천 등급 기준
| 조정 ROAS | 추천 | 색상 코드 |
|-----------|------|----------|
| ≥ 150% | 증액 추천 | #2e7d32 (green) |
| ≥ 100% | 유지 | #1565c0 (blue) |
| ≥ 50% | 효율 점검 | #f57c00 (orange) |
| < 50% | 감액 검토 | #c62828 (red) |

###### 연산 예시
```
현재 상태: 비용 1,000만원, 매출 2,000만원, ROAS 200%
예산 +50% 조정 시:

1. 조정 ROAS 계산
   budgetChangeRatio = 0.5
   adjustedRoas = 200 × (1 - 0.15 × ln(1.5))
                = 200 × (1 - 0.15 × 0.405)
                = 200 × 0.939 = 187.8%

2. 예상 결과
   newCost = 1,000만 × 1.5 = 1,500만원
   newRevenue = 1,500만 × 1.878 = 2,817만원

3. 투자 효율
   additionalCost = 500만원
   additionalRevenue = 817만원
   investmentEfficiency = 163.4%
```

###### 체감 수익 모델 설명
- 예산 증가 시 ROAS가 감소하는 이유: 신규 타겟 확장에 따른 효율 저하
- 로그 함수 적용: 초기 예산 증가는 효율 저하 영향이 크고, 증가폭이 커질수록 영향이 완화
- 예산 감소 시 ROAS 증가폭이 작은 이유 (×0.5): 효율적 타겟 집중 효과 보수적 반영

#### 5.2 주요 항목 트렌드 탭
| 항목 | 내용 |
|------|------|
| **HTML ID** | `segmentTrendTab`, `segmentTrendChart`, `segmentTrendCheckboxes` |
| **JS 함수** | `updateSegmentTrendCheckboxes()`, `updateSegmentTrendChart()` |
| **참조 데이터** | `forecast/segment_*.csv` (동적 로드) |
| **기능** | - 일별/주별/월별 집계 선택<br>- 세그먼트 타입 선택 (채널/제품/브랜드/프로모션)<br>- 항목 체크박스 (최대 5개)<br>- 시간에 따른 ROAS 추이 차트 (실제/예측 분리) |

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

### 1.1 KPI 토글 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `kpi-view-btn` | `data-kpi-view="primary"` | 주요 성과만 표시 |
| `kpi-view-btn` | `data-kpi-view="all"` | 주요 + 세부 성과 표시 |

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
| `analysis-tab-btn` | `data-tab="budget-simulation"` | 예산 시뮬레이션 |
| `analysis-tab-btn` | `data-tab="segment-trend"` | 주요 항목 트렌드 |

### 7. 예산 시뮬레이션 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `simulation-segment-btn` | `data-sim-segment="all"` | 전체 |
| `simulation-segment-btn` | `data-sim-segment="channel"` | 채널별 |
| `simulation-segment-btn` | `data-sim-segment="product"` | 제품별 |
| `simulation-segment-btn` | `data-sim-segment="brand"` | 브랜드별 |
| `simulation-segment-btn` | `data-sim-segment="promotion"` | 프로모션별 |

#### 7.1 예산 시뮬레이션 기타 요소
| HTML ID | 기능 |
|---------|------|
| `simItemDropdownBtn` | 항목 선택 드롭다운 버튼 |
| `simItemDropdownList` | 항목 선택 드롭다운 목록 |
| `simItemSelectAll` | 전체 선택 체크박스 |
| `simItemCheckboxes` | 개별 항목 체크박스 컨테이너 |
| `resetSimulationBtn` | 시뮬레이션 초기화 버튼 |

### 8. 뷰 타입 버튼 (일별/주별/월별)
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `segment-trend-view-btn` | `data-view="daily\|weekly\|monthly"` | 주요 항목 트렌드 집계 단위 |

### 9. 세그먼트 타입 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `segment-trend-type-btn` | `data-segment="channel\|product\|brand\|promotion"` | 주요 항목 트렌드 타입 |

### 10. 통계 분석 서브탭 버튼
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
| `renderMatrixInsights()` | Forecast Matrix 4분면 렌더링 |
| `setupMatrixCardTooltip()` | Matrix 카드 툴팁 이벤트 설정 |

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
| 2025-12-09 | KPI 토글 기능 문서화: `kpi-view-toggle`, `kpi-view-btn`, `kpi-grid-primary`, `kpi-grid-secondary`, `kpi-section.show-all` |
| 2025-12-09 | 섹션 2 업데이트: 핵심 KPI 요약에 주요/세부 성과 토글 기능 추가 |
| 2025-12-09 | 버튼 UI 컴포넌트 추가: 1.1 KPI 토글 버튼 섹션 |
| 2025-12-27 | **[Forecast Matrix 하위탭]** matrixTab에 4개 하위탭 구현 (브랜드/채널/상품/프로모션). `matrix-sub-tab` 버튼 클래스, `matrix-sub-content` 컨텐츠 클래스 추가 |
| 2025-12-27 | **[Matrix 툴팁]** 4분면 범례 삭제, 카드 호버 시 마우스 커서 따라가는 툴팁 구현. `matrix-tooltip-global` CSS 클래스, `matrixCardTooltip` 전역 엘리먼트, `setupMatrixCardTooltip()` 함수 추가 |
| 2025-12-27 | 섹션 3.4 추가: Forecast Matrix 탭 (4분면 분석) - 하위탭, 툴팁 기능 문서화 |
| 2026-01-02 | **[예산 시뮬레이션]** 섹션 5 전면 개편: '성과 분석 대시보드' → '예산 시뮬레이션 및 주요 항목 추이'로 변경 |
| 2026-01-02 | 섹션 5.1 예산 시뮬레이션 탭 추가: 세그먼트별 예산 조정 슬라이더, 시뮬레이션 결과 카드, 상세 결과 테이블, AI 인사이트 |
| 2026-01-02 | 섹션 5.2 주요 항목 트렌드 탭 (기존 세그먼트 트렌드 유지) |
| 2026-01-02 | 기존 탭 삭제: 전체 성과 예측, 세그먼트 비교, 비즈니스 인사이트 |
| 2026-01-02 | 버튼 UI 컴포넌트 업데이트: 섹션 6 성과 분석 탭 버튼, 섹션 7 예산 시뮬레이션 버튼 추가 |
| 2026-01-02 | **[예산 시뮬레이션 연산 명세]** 섹션 5.1.3에 상세 연산 모델 추가: DIMINISHING_FACTOR 상수, calculateAdjustedRoas 함수 공식, 예상 매출/투자 효율 계산식, 추천 등급 기준, 연산 예시, 체감 수익 모델 설명 |
