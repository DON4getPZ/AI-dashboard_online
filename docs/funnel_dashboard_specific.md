# funnel_dashboard.html 기능 분석 문서

## 개요
`data/funnel_dashboard.html`은 **AARRR 퍼널 분석 대시보드**로, GA4 데이터를 기반으로 고객 구매 여정(유입→활동→관심→결제진행→구매완료)을 분석하는 대시보드입니다.

---

## 파일 구조

### 외부 라이브러리
| 라이브러리 | 용도 |
|-----------|------|
| Chart.js | 차트 시각화 |
| chartjs-plugin-datalabels | 차트 데이터 라벨 플러그인 |
| D3.js (v7) | 퍼널 차트 시각화 |
| Google Fonts (Roboto, Inter) | 폰트 |

---

## 섹션별 기능 브리핑

### 0. 성과 요약 배너
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 성과 요약 배너 (상단 배너) |
| **JS 함수** | `updateSummaryCardBanner()` |
| **참조 데이터** | `insightsData` → `summary_card` (funnel/insights.json) |
| **기능** | - 이번 달 성과 요약 표시<br>- 방문자/구매자/전환율 요약 |

---

### 1. 핵심 KPI 요약
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 핵심 KPI 요약 (상단 고정) |
| **위치** | Line 1311 |
| **JS 함수** | `updateKPISummary()` |
| **참조 데이터** | `dailyData` (funnel/daily_funnel.csv) |
| **기능** | 주요 KPI 5개 카드 표시: 총 유입, 총 활성화, 관심, 결제 진행, 구매 완료 |

---

### 2. 고객 구매 여정 5단계 (D3.js 퍼널 차트)
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 📊 고객 구매 여정 5단계 |
| **위치** | Line 1316 |
| **JS 함수** | `updateFunnelChart()`, `renderSmallFunnel()`, `updateCompareFunnels()`, `updateComparisonInsights()`, `getStageInsights()` |
| **참조 데이터** | `dailyData` (funnel/daily_funnel.csv) |
| **기능** | - D3.js 인터랙티브 퍼널 차트<br>- 각 단계별 전환율/이탈률 표시<br>- 비교 모드 (기간별 퍼널 비교)<br>- 마우스 호버 시 인사이트 툴팁 |

---

### 3. 인사이트 & 채널 전략 (통합 섹션)
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 💡 인사이트 & 채널 전략 |
| **위치** | Line 1401 |
| **JS 함수** | `updateInsights()`, `updateUrgentAlerts()`, `updateBCGMatrix()`, `setupInsightStrategyTabs()`, `renderUrgentAlertCards()` |

#### 3.1 핵심 요약 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `updateInsights()` |
| **참조 데이터** | `insightsData` → `by_period` → `summary`, `top_channels`, `alerts` (funnel/insights.json) |
| **기능** | - 전체 전환율 표시<br>- 최고 성과 채널<br>- 경고 알림 표시 |

#### 3.2 긴급 개선 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `updateUrgentAlerts()`, `renderUrgentAlertCards()` |
| **참조 데이터** | `insightsData` → `by_period` → `urgent_alerts` (funnel/insights.json) |
| **기능** | - 즉시 조치 필요 (high severity)<br>- 개선 권장 (medium severity)<br>- 추천 액션 가이드 |

#### 3.3 채널 전략 탭 (BCG Matrix)
| 항목 | 내용 |
|------|------|
| **JS 함수** | `updateBCGMatrix()` |
| **참조 데이터** | `insightsData` → `by_period` → `channel_strategy` (funnel/insights.json) |
| **기능** | - Cash Cow (효자 채널)<br>- Hidden Gem (숨은 보석)<br>- Money Pit (밑 빠진 독)<br>- Dog (재검토 필요) |

---

### 4. 데이터 기반 의사결정 도구 (collapsible-section #1)
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 🔬 데이터 기반 의사결정 도구 (예산 투자, 성과 비교, 위험 감지) |
| **위치** | Line 1486 |

#### 4.1 채널 그룹별 특성 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `updateAdvancedAnalysis()` |
| **참조 데이터** | `insightsData` → `by_period` → `channel_clusters` (funnel/insights.json) |
| **기능** | - 채널 클러스터링 분석<br>- 유사 성과 채널 그룹화<br>- A/B 테스트 통계 결과 |

#### 4.2 예산 투자 가이드 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `updateAdvancedAnalysis()` |
| **참조 데이터** | `insightsData` → `by_period` → `budget_guide` (funnel/insights.json) |
| **기능** | - 채널별 투자 효율성 분석<br>- 100만원 투자 시 예상 성과 시뮬레이션<br>- 신뢰도 기반 분석 정확도 표시 |

#### 4.3 이탈 위험 경고 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `updateChurnPredictions()`, `getChurnRecommendation()` |
| **참조 데이터** | `insightsData` → `churn_analysis` → `churn_predictions_7d`, `churn_predictions_30d` (funnel/insights.json) |
| **기능** | - 최근 7일/30일 이탈 증가 감지<br>- 단계별 이탈률 경고<br>- 대응 액션 가이드 |

#### 4.4 성과 개선 분석 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `updateImprovementPredictions()`, `getImprovementRecommendation()` |
| **참조 데이터** | `insightsData` → `churn_analysis` → `improvement_predictions_7d`, `improvement_predictions_30d` (funnel/insights.json) |
| **기능** | - 성과가 좋아진 단계 자동 탐지<br>- 개선 사항별 구체적 액션 제시 |

---

### 5. 유입 채널별 상세 분석 (collapsible-section #2)
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 📊 유입 채널별 상세 분석 (네이버, 구글, 인스타그램 등) |
| **위치** | Line 1635 |

#### 5.1 채널별 고객 흐름 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `updateChannelTable()`, `setupTableSorting()`, `analyzeChannelTableData()` |
| **참조 데이터** | `channelData` (funnel/channel_funnel.csv) |
| **기능** | - 채널별 5단계 퍼널 테이블<br>- 컬럼별 정렬 기능<br>- 자동 인사이트 분석<br>- CVR/매출 기준 해석 가이드 |

#### 5.2 지표별 비교 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `updateKpiChart()`, `analyzeKpiChartData()`, `setupKpiChartTooltip()`, `generateKpiInsight()` |
| **참조 데이터** | `channelData` (funnel/channel_funnel.csv) |
| **기능** | - 지표 선택: 전환율, 방문자 수, 활성 사용자, 관심 고객, 결제 시도, 구매 건수, 매출액<br>- 채널별 막대 차트<br>- 마우스 호버 인사이트 툴팁 |

#### 5.3 효율성과 규모 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `updateCompareChart()`, `analyzeCompareChartData()`, `setupCompareChartTooltip()` |
| **참조 데이터** | `channelData` (funnel/channel_funnel.csv) |
| **기능** | - 전환율/방문자/구매/매출 100점 만점 환산 비교<br>- 채널 유형별 전략 가이드<br>- 균형 분석 결과 |

#### 5.4 전환율 TOP 10 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `updateCampaignChart()` |
| **참조 데이터** | `channelData` (funnel/channel_funnel.csv) |
| **기능** | - 단계별 전환율 TOP 10 채널<br>- 활동/관심/결제진행/구매완료 기준 선택<br>- 자동 분석 인사이트 |

---

### 6. 고객 재방문 및 이탈 분석 (collapsible-section #3)
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 👥 고객 재방문 및 이탈 분석 |
| **위치** | Line 2124 |

#### 6.1 신규 vs 재방문 추세 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `updateCustomerTrendChart()`, `generateCustomerTrendInsight()`, `setupCustomerTrendTooltip()` |
| **참조 데이터** | `newVsReturningData` (funnel/new_vs_returning.csv) |
| **기능** | - 월별/주별/일별 집계 단위 선택<br>- 신규 고객 비율 vs 재방문율 추세 차트<br>- 마우스 호버 인사이트 |

#### 6.2 전환율 비교 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `updateNewVsReturningConversionChart()`, `analyzeConversionGap()`, `generateConversionInsight()`, `setupConversionChartTooltip()` |
| **참조 데이터** | `newVsReturningConversionData` (funnel/new_vs_returning_conversion.csv) |
| **기능** | - 신규 vs 재방문 고객 전환율 비교 막대 차트<br>- 단계별 전환율 차이 분석<br>- 개선 방법 가이드 |

#### 6.3 이탈률 분석 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `updateChurnChart()`, `calculateChurnRates()`, `analyzeChurnRates()`, `setupChurnChartTooltip()` |
| **참조 데이터** | `channelData` (funnel/channel_funnel.csv) |
| **기능** | - 퍼널 단계별 이탈률 분석: 유입→활동, 활동→관심, 관심→결제진행, 결제진행→구매완료<br>- 정렬 방식: 높은순/낮은순<br>- 단계별 이탈 원인 및 개선 방법 가이드 |

#### 6.4 채널 품질 매트릭스 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `updateChannelMatrixChart()` |
| **참조 데이터** | `channelData` (funnel/channel_funnel.csv), `newVsReturningData` (funnel/new_vs_returning.csv) |
| **기능** | - 재방문율 vs 이탈률 매트릭스 차트<br>- 4분면 분류: 스타 채널, 성장 채널, 안정 채널, 문제 채널<br>- 채널 유형별 액션 가이드 |

#### 6.5 고객 참여도 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `updateChannelEngagementChart()`, `analyzeEngagementRates()`, `generateEngagementInsight()`, `setupEngagementChartTooltip()` |
| **참조 데이터** | `channelEngagementData` (funnel/channel_engagement.csv) |
| **기능** | - 채널별 참여도(Engagement Rate) 분석<br>- 높음/보통/낮음 구간별 해석<br>- 참여도와 전환율 관계 분석 |

---

## 버튼 UI 컴포넌트

### 1. 섹션 토글 버튼
| 클래스 | 위치 | 기능 |
|--------|------|------|
| `collapsible-toggle` | 각 섹션 헤더 | 섹션 접기/펼치기 |

### 2. 기간 필터 버튼

#### 2.1 데이터 기반 의사결정 도구 기간 필터
| 클래스 | data 속성 | 호출 함수 | 기능 |
|--------|----------|----------|------|
| `period-filter-btn` | `data-period="full\|180d\|90d\|30d"` | `switchPeriod()` | 전체/180일/90일/30일 기간 전환 |

#### 2.2 인사이트 섹션 기간 필터
| 클래스 | data 속성 | 호출 함수 | 기능 |
|--------|----------|----------|------|
| `insight-period-btn` | `data-period="full\|180d\|90d\|30d"` | `switchInsightPeriod()` | 인사이트 전용 기간 전환 |

### 3. 인사이트 & 채널 전략 탭 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `insight-strategy-tab-btn` | `data-tab="summary"` | 핵심 요약 탭 |
| `insight-strategy-tab-btn` | `data-tab="urgent"` | 긴급 개선 탭 |
| `insight-strategy-tab-btn` | `data-tab="bcg"` | 채널 전략 탭 |

#### 3.1 긴급 개선 - 서브탭
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `urgent-alert-tab-btn` | `data-tab="high"` | 즉시 조치 필요 |
| `urgent-alert-tab-btn` | `data-tab="medium"` | 개선 권장 |

### 4. 데이터 기반 의사결정 도구 탭 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `decision-tool-tab-btn` | `data-tab="clustering"` | 채널 그룹별 특성 |
| `decision-tool-tab-btn` | `data-tab="budget"` | 예산 투자 가이드 |
| `decision-tool-tab-btn` | `data-tab="churn_alert"` | 이탈 위험 경고 |
| `decision-tool-tab-btn` | `data-tab="improvement"` | 성과 개선 분석 |

#### 4.1 이탈 위험/성과 개선 기간 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `churn-period-btn` | `data-period="7d\|30d"` | 이탈 위험 기간 선택 |
| `improvement-period-btn` | `data-period="7d\|30d"` | 성과 개선 기간 선택 |

### 5. 채널별 분석 탭 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `channel-analysis-tab-btn` | `data-tab="table"` | 채널별 고객 흐름 |
| `channel-analysis-tab-btn` | `data-tab="kpi"` | 지표별 비교 |
| `channel-analysis-tab-btn` | `data-tab="balance"` | 효율성과 규모 |
| `channel-analysis-tab-btn` | `data-tab="top10"` | 전환율 TOP 10 |

#### 5.1 지표별 비교 - KPI 선택 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `channel-kpi-btn` | `data-kpi="cvr"` | 전환율 |
| `channel-kpi-btn` | `data-kpi="acquisition"` | 방문자 수 |
| `channel-kpi-btn` | `data-kpi="activation"` | 활성 사용자 |
| `channel-kpi-btn` | `data-kpi="consideration"` | 관심 고객 |
| `channel-kpi-btn` | `data-kpi="conversion"` | 결제 시도 |
| `channel-kpi-btn` | `data-kpi="purchase"` | 구매 건수 |
| `channel-kpi-btn` | `data-kpi="revenue"` | 매출액 |

#### 5.2 전환율 TOP 10 - 퍼널 단계 선택 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `channel-funnel-btn` | `data-funnel="activation"` | 활동 전환율 |
| `channel-funnel-btn` | `data-funnel="consideration"` | 관심 전환율 |
| `channel-funnel-btn` | `data-funnel="conversion"` | 결제진행 전환율 |
| `channel-funnel-btn` | `data-funnel="purchase"` | 구매완료 전환율 |

### 6. 고객 재방문 및 이탈 분석 탭 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `customer-analysis-tab-btn` | `data-tab="trend"` | 신규 vs 재방문 추세 |
| `customer-analysis-tab-btn` | `data-tab="conversion"` | 전환율 비교 |
| `customer-analysis-tab-btn` | `data-tab="churn"` | 이탈률 분석 |
| `customer-analysis-tab-btn` | `data-tab="matrix"` | 채널 품질 매트릭스 |
| `customer-analysis-tab-btn` | `data-tab="engagement"` | 고객 참여도 |

#### 6.1 신규 vs 재방문 추세 - 집계 단위 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `new-vs-returning-view-btn` | `data-view="monthly"` | 월별 |
| `new-vs-returning-view-btn` | `data-view="weekly"` | 주별 |
| `new-vs-returning-view-btn` | `data-view="daily"` | 일별 |

#### 6.2 이탈률 분석 - 퍼널 단계 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `channel-churn-stage-btn` | `data-stage="activation"` | 유입→활동 |
| `channel-churn-stage-btn` | `data-stage="consideration"` | 활동→관심 |
| `channel-churn-stage-btn` | `data-stage="conversion"` | 관심→결제진행 |
| `channel-churn-stage-btn` | `data-stage="purchase"` | 결제진행→구매완료 |
| `channel-churn-stage-btn` | `data-stage="avg"` | 평균 이탈률 |

#### 6.3 이탈률 분석 - 정렬 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `channel-churn-sort-btn` | `data-sort="desc"` | 높은순 정렬 |
| `channel-churn-sort-btn` | `data-sort="asc"` | 낮은순 정렬 |

### 7. 퍼널 비교 버튼
| ID | 기능 |
|----|------|
| `funnelCompareBtn` | 비교 모드 진입 |
| `closeFunnelCompare` | 단일 뷰로 돌아가기 |

---

## 전역 변수 및 상태 관리

### 데이터 변수
| 변수명 | 설명 | 로드 소스 |
|--------|------|----------|
| `dailyData` | 일별 퍼널 데이터 | funnel/daily_funnel.csv |
| `weeklyData` | 주별 퍼널 데이터 | funnel/weekly_funnel.csv |
| `channelData` | 채널별 퍼널 데이터 | funnel/channel_funnel.csv |
| `newVsReturningData` | 신규/재방문 데이터 | funnel/new_vs_returning.csv |
| `channelEngagementData` | 채널 참여도 데이터 | funnel/channel_engagement.csv |
| `newVsReturningConversionData` | 신규/재방문 전환율 데이터 | funnel/new_vs_returning_conversion.csv |
| `insightsData` | 주요 인사이트 데이터 | funnel/insights.json |

### 기간 필터 상태
| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `currentPeriod` | 의사결정 도구 기간 필터 | 'full' |
| `insightPeriod` | 인사이트 섹션 기간 필터 | 'full' |
| `newVsReturningView` | 신규/재방문 뷰 타입 | 'monthly' |

### 차트 선택 상태
| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `currentKpiType` | 선택된 KPI | 'cvr' |
| `currentChurnStage` | 선택된 이탈 단계 | 'avg' |
| `currentChurnSort` | 이탈 정렬 방식 | 'desc' |
| `currentChannelFunnel` | 선택된 퍼널 단계 | 'purchase' |

---

## 핵심 함수 목록

### 초기화 함수
| 함수명 | 기능 |
|--------|------|
| `loadData()` | 모든 데이터 로딩 (JSON, CSV) |
| `parseCSV()` | CSV 텍스트 파싱 (RFC 4180 호환) |
| `updateDashboard()` | 대시보드 전체 초기화 |
| `initTabSwitching()` | 탭 전환 기능 초기화 |
| `setupTableSorting()` | 테이블 정렬 기능 초기화 |
| `checkIframeAndHideSidebar()` | iframe 모드 확인 및 사이드바 숨김 |

### 기간 전환 함수
| 함수명 | 대상 |
|--------|------|
| `switchPeriod()` | 의사결정 도구 기간 전환 |
| `switchInsightPeriod()` | 인사이트 섹션 기간 전환 |
| `updatePeriodDateRange()` | 기간 날짜 범위 표시 |
| `updateInsightPeriodDateRange()` | 인사이트 기간 날짜 범위 표시 |
| `getPeriodData()` | 현재 기간 데이터 반환 |
| `getInsightPeriodData()` | 인사이트 기간 데이터 반환 |
| `getChurnData()` | 이탈 분석 데이터 반환 |

### 렌더링 함수
| 함수명 | 대상 |
|--------|------|
| `updateKPISummary()` | KPI 카드 |
| `updateSummaryCardBanner()` | 성과 요약 배너 |
| `updateAnalysisPeriod()` | 분석 기간 표시 |
| `updateFunnelChart()` | D3.js 퍼널 차트 |
| `renderSmallFunnel()` | 비교용 소형 퍼널 |
| `updateCompareFunnels()` | 비교 퍼널 뷰 |
| `updateComparisonInsights()` | 비교 인사이트 |
| `updateInsights()` | 핵심 요약 인사이트 |
| `updateUrgentAlerts()` | 긴급 알림 |
| `renderUrgentAlertCards()` | 알림 카드 |
| `updateBCGMatrix()` | BCG 매트릭스 |
| `setupInsightStrategyTabs()` | 인사이트 탭 설정 |
| `updateAdvancedAnalysis()` | 고급 분석 (클러스터링, 예산) |
| `updateChurnPredictions()` | 이탈 예측 |
| `updateImprovementPredictions()` | 성과 개선 예측 |

### 차트 업데이트 함수
| 함수명 | 대상 |
|--------|------|
| `updateKpiChart()` | 채널별 KPI 차트 |
| `updateChurnChart()` | 이탈률 차트 |
| `updateCompareChart()` | 효율성/규모 비교 차트 |
| `updateCampaignChart()` | 전환율 TOP 10 차트 |
| `updateCustomerTrendChart()` | 신규/재방문 추세 차트 |
| `updateNewVsReturningConversionChart()` | 전환율 비교 차트 |
| `updateChannelMatrixChart()` | 채널 품질 매트릭스 차트 |
| `updateChannelEngagementChart()` | 참여도 차트 |
| `updateChannelTable()` | 채널 테이블 |

### 분석/인사이트 생성 함수
| 함수명 | 기능 |
|--------|------|
| `analyzeKpiChartData()` | KPI 차트 데이터 분석 |
| `analyzeChurnRates()` | 이탈률 분석 |
| `analyzeCompareChartData()` | 비교 차트 데이터 분석 |
| `analyzeChannelTableData()` | 채널 테이블 데이터 분석 |
| `analyzeConversionGap()` | 전환율 갭 분석 |
| `analyzeEngagementRates()` | 참여도 분석 |
| `getStageInsights()` | 퍼널 단계 인사이트 |
| `getChurnRecommendation()` | 이탈 대응 추천 |
| `getImprovementRecommendation()` | 개선 추천 |

### 툴팁/인터랙션 함수
| 함수명 | 기능 |
|--------|------|
| `setupKpiChartTooltip()` | KPI 차트 툴팁 설정 |
| `setupChurnChartTooltip()` | 이탈 차트 툴팁 설정 |
| `setupCompareChartTooltip()` | 비교 차트 툴팁 설정 |
| `setupCustomerTrendTooltip()` | 추세 차트 툴팁 설정 |
| `setupConversionChartTooltip()` | 전환율 차트 툴팁 설정 |
| `setupEngagementChartTooltip()` | 참여도 차트 툴팁 설정 |
| `showChartInsightTooltip()` | 인사이트 툴팁 표시 |
| `hideChartInsightTooltip()` | 인사이트 툴팁 숨김 |

### 유틸리티 함수
| 함수명 | 기능 |
|--------|------|
| `formatNumber()` | 숫자 형식 변환 |
| `formatDecimal()` | 소수점 형식 변환 |
| `getDateRange()` | 날짜 범위 추출 |
| `filterDataByDateRange()` | 날짜 범위로 데이터 필터링 |
| `calculateFunnelData()` | 퍼널 데이터 계산 |
| `calculateChurnRates()` | 이탈률 계산 |
| `updateSortIcons()` | 정렬 아이콘 업데이트 |

---

## 참조 데이터 파일 구조

### funnel/insights.json
```
{
  "by_period": {
    "full": { ... },
    "180d": { ... },
    "90d": { ... },
    "30d": { ... }
  },
  "churn_analysis": {
    "churn_predictions_7d": [...],
    "churn_predictions_30d": [...],
    "improvement_predictions_7d": [...],
    "improvement_predictions_30d": [...],
    "crm_actions": [...]
  }
}
```

각 기간별 데이터 구조:
- `overall`: 전체 요약 (current_period, overall_cvr 등)
- `summary`: 요약 정보
- `summary_card`: 성과 요약 배너 데이터
- `top_channels`: 상위 채널 배열
- `alerts`: 경고 알림 배열
- `urgent_alerts`: 긴급 알림 배열
- `channel_strategy`: BCG 매트릭스 데이터
- `channel_clusters`: 채널 클러스터링 데이터
- `budget_guide`: 예산 투자 가이드 데이터

### CSV 파일 공통 컬럼

#### daily_funnel.csv / weekly_funnel.csv
- `Day` / `week`: 날짜 기준
- `유입`: 유입 수
- `활동`: 활성화 수
- `관심`: 관심 표시 수
- `결제진행`: 결제 진행 수
- `구매완료`: 구매 완료 수

#### channel_funnel.csv
- `channel`: 채널명
- `유입`, `활동`, `관심`, `결제진행`, `구매완료`: 각 단계 수치
- `Revenue`: 매출
- `CVR`: 전환율

---

## 차트 인스턴스
| 변수명 | 차트 종류 |
|--------|----------|
| `channelKpiChart` | 채널별 KPI 막대 차트 |
| `channelChurnChart` | 채널별 이탈률 막대 차트 |
| `channelCompareChart` | 효율성/규모 비교 막대 차트 |
| `campaignChart` | 전환율 TOP 10 막대 차트 |
| `customerTrendChart` | 신규/재방문 추세 라인 차트 |
| `newVsReturningConversionChart` | 전환율 비교 막대 차트 |
| `channelMatrixChart` | 채널 품질 산점도 차트 |
| `channelEngagementChart` | 참여도 막대 차트 |

---

## 변경 이력

| 날짜 | 작업 내용 |
|------|----------|
| 2025-12-05 | 문서 최초 작성 - funnel_dashboard.html 섹션별 기능 분석 |
| 2025-12-05 | Dead Code 제거: 미사용 전역 변수 3개 삭제 (currentView, selectedChannelKPI, currentChurnType), DEPRECATED 함수 2개 삭제 (updateNewVsReturningChart, updateReturnRateTrendChart), data-tab 속성 정규화 (churn-alert → churn_alert) |

