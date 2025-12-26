# funnel_dashboard.html 기능 분석 문서

---

## 📋 목차

### 기본 정보
- [개요](#개요)
- [HTML 문서 기본 구조](#html-문서-기본-구조)
- [파일 정보](#파일-정보)

### 기능 명세
- [섹션별 기능 브리핑](#섹션별-기능-브리핑)
  - [0. 성과 요약 배너](#0-성과-요약-배너)
  - [1. 핵심 KPI 요약](#1-핵심-kpi-요약)
  - [2. 고객 구매 여정 5단계](#2-고객-구매-여정-5단계-d3js-퍼널-차트)
  - [3. 인사이트 & 채널 전략](#3-인사이트--채널-전략-통합-섹션)
  - [4. 데이터 기반 의사결정 도구](#4-데이터-기반-의사결정-도구-collapsible-section-1)
  - [5. 유입 채널별 상세 분석](#5-유입-채널별-상세-분석-collapsible-section-2)
  - [6. 고객 재방문 및 이탈 분석](#6-고객-재방문-및-이탈-분석-collapsible-section-3)
- [버튼 UI 컴포넌트](#버튼-ui-컴포넌트)

### JavaScript
- [전역 변수 및 상태 관리](#전역-변수-및-상태-관리)
- [핵심 함수 목록](#핵심-함수-목록)
- [JavaScript 핵심 함수 구현 코드](#javascript-핵심-함수-구현-코드)
  - [1. CSV 파싱 함수](#1-csv-파싱-함수)
  - [2. 데이터 로드 함수](#2-데이터-로드-함수)
  - [3. 퍼널 차트 렌더링](#3-퍼널-차트-렌더링-d3js)
  - [4. KPI 업데이트 함수](#4-kpi-업데이트-함수)
  - [5. 인사이트 업데이트 함수](#5-인사이트-업데이트-함수)
- [전역 변수 초기값](#전역-변수-초기값)

### HTML 구조
- [전체 HTML ID 매핑](#전체-html-id-매핑)
- [사이드바 네비게이션 HTML 구조](#사이드바-네비게이션-html-구조)
- [KPI 요약 카드 HTML 구조](#kpi-요약-카드-html-구조)

### CSS 디자인
- [HTML/CSS 디자인 구조](#htmlcss-디자인-구조)
  - [0. 기본 CSS 리셋 및 Body 스타일](#0-기본-css-리셋-및-body-스타일)
  - [1. CSS 변수 (Design Tokens)](#1-css-변수-design-tokens)
  - [2. 레이아웃 구조](#2-레이아웃-구조)
  - [3. KPI 요약 컴포넌트](#3-kpi-요약-컴포넌트)
  - [4. 차트 컴포넌트](#4-차트-컴포넌트)
  - [5. 인사이트 컴포넌트](#5-인사이트-컴포넌트)
  - [6. 테이블 컴포넌트](#6-테이블-컴포넌트)
  - [7. 버튼 컴포넌트](#7-버튼-컴포넌트)
  - [8. 반응형 디자인](#8-반응형-디자인)

### 데이터
- [참조 데이터 파일 구조](#참조-데이터-파일-구조)
- [데이터 흐름 (Data Flow)](#데이터-흐름-data-flow)

### 기타
- [차트 인스턴스](#차트-인스턴스)
- [변경 이력](#변경-이력)

---

## 개요
`data/funnel_dashboard.html`은 **AARRR 퍼널 분석 대시보드**로, GA4 데이터를 기반으로 고객 구매 여정(유입→활동→관심→결제진행→구매완료)을 분석하는 대시보드입니다.

---

## HTML 문서 기본 구조

### DOCTYPE 및 Head 섹션

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AARRR 퍼널 대시보드 - GA4 분석</title>
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2"></script>
    <!-- D3.js -->
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        /* CSS 내용 */
    </style>
</head>
<body>
    <div class="app-wrapper">
        <!-- 사이드바 -->
        <!-- 메인 컨텐츠 -->
    </div>
    <script>
        /* JavaScript 내용 */
    </script>
</body>
</html>
```

### 외부 라이브러리 CDN
| 라이브러리 | CDN URL |
|-----------|---------|
| Google Fonts (Roboto, Inter) | `https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Inter:wght@400;500;600;700&display=swap` |
| Chart.js | `https://cdn.jsdelivr.net/npm/chart.js` |
| chartjs-plugin-datalabels | `https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2` |
| D3.js (v7) | `https://d3js.org/d3.v7.min.js` |

---

## 파일 정보
- **파일경로**: `data/funnel_dashboard.html`
- **데이터 소스**: `funnel/daily_funnel.csv`, `funnel/weekly_funnel.csv`, `funnel/channel_funnel.csv`, `funnel/insights.json` 등
- **차트 라이브러리**: Chart.js (CDN), D3.js (CDN)

### 외부 라이브러리
| 라이브러리 | 용도 |
|-----------|------|
| Chart.js | 막대/라인 차트 시각화 |
| chartjs-plugin-datalabels | 차트 데이터 라벨 플러그인 |
| D3.js (v7) | 퍼널 차트 시각화 (SVG) |
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

#### 4.5 유형별 조치 가이드 탭 (마이크로 세그먼트)
| 항목 | 내용 |
|------|------|
| **JS 함수** | `updateMicroSegmentAlerts()`, `renderMicroSegmentCards()`, `setupMicroCardTooltip()` |
| **참조 데이터** | `insightsData` → `micro_segment_alerts`, `micro_segment_definitions` (funnel/insights.json) |
| **기능** | - 문제점/기회 알림 카드 표시<br>- 카드 내 '추천 액션' 섹션 표시 (긴급 개선 카드와 동일 디자인)<br>- 카드 호버 시 처방 가이드 + 구분 정의 툴팁 표시<br>- 카테고리별 필터링 (SA, DA, SNS, CRM 등) |

**마이크로 세그먼트 유형:**
| 유형 | 설명 | 판별 조건 |
|------|------|----------|
| 👑 Hidden VIP (숨은 큰손) | 전환은 드물지만 객단가가 높은 채널 | 유입→활동 높음 + 전환율 낮음 + RPV 상위 25% |
| 💸 Traffic Waste (밑 빠진 독) | 트래픽만 많고 전환이 없는 채널 | 유입 상위 25% + 유입→활동/전환율 하위 25% |
| 🚧 Checkout Friction (결제 장벽) | 구매 의사는 있으나 결제에서 이탈 | 관심→구매 전환율 하위 25% |
| 🚀 Rising Star (성장 엔진) | 규모는 작지만 반응률이 높은 채널 | 유입→활동/전환율 상위 25% + 유입 하위 50% |

**툴팁 인터랙션:**
- 카드에 마우스 호버 시 커서 위치에 툴팁 표시
- 툴팁에 해당 세그먼트 유형의 정의 + 처방 가이드 포함
- 카드 호버 시 시각적 피드백 (살짝 올라오는 효과)

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

### 7. 퍼널 비교 및 필터 버튼
| ID | 기능 |
|----|------|
| `funnelCompareBtn` | 비교 모드 진입 |
| `closeFunnelCompare` | 단일 뷰로 돌아가기 |
| `funnelFilterBtn` | 채널 필터 토글 (클릭 시 '필터' ↔ '해제' 전환) |
| `funnelChannelFilter` | 채널 선택 드롭다운 (필터 활성화 시 표시) |

---

## 전역 변수 및 상태 관리

### 데이터 변수
| 변수명 | 설명 | 로드 소스 |
|--------|------|----------|
| `dailyData` | 채널별 일별 퍼널 데이터 | funnel/channel_daily_funnel.csv |
| `weeklyData` | 주별 퍼널 데이터 | funnel/weekly_funnel.csv |
| `channelData` | 채널별 퍼널 데이터 (합산) | funnel/channel_funnel.csv |
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

### 퍼널 채널 필터 상태
| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `funnelFilterActive` | 퍼널 채널 필터 활성화 여부 | false |
| `selectedFunnelChannel` | 선택된 퍼널 필터 채널명 | '' (빈 문자열) |

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
| `setupMicroCardTooltip()` | 마이크로 세그먼트 카드 호버 툴팁 설정 (처방 가이드 + 구분 정의) |
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

### 퍼널 채널 필터 함수
| 함수명 | 기능 |
|--------|------|
| `populateFunnelChannelFilter()` | 채널 드롭다운 목록 동적 생성 (dailyData에서 추출) |
| `getFilteredDailyData(channel)` | 선택된 채널의 일별 데이터만 필터링하여 반환 |

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

#### channel_daily_funnel.csv (HTML 퍼널 차트용)
- `channel`: 채널명
- `Day`: 날짜 기준
- `유입`: 유입 수
- `활동`: 활성화 수
- `관심`: 관심 표시 수
- `결제진행`: 결제 진행 수
- `구매완료`: 구매 완료 수
- `CVR`: 전환율

#### daily_funnel.csv (Python 시계열 분석용)
- `Day`: 날짜 기준
- `유입`: 유입 수
- `활동`: 활성화 수
- `관심`: 관심 표시 수
- `결제진행`: 결제 진행 수
- `구매완료`: 구매 완료 수

#### weekly_funnel.csv
- `week`: 주 기준
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

## 데이터 흐름 (Data Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                        loadData()                                │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ CSV 파일 로드 │  │ JSON 파일 로드│  │ Promise.all로 병렬 처리│ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    updateDashboard()                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │updateKPISummary│ │updateFunnelChart│ │updateInsights 등   │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                     기간 전환 시                                 │
│    switchPeriod() / switchInsightPeriod()                        │
│         ↓                                                        │
│    getPeriodData() / getInsightPeriodData()                      │
│         ↓                                                        │
│    각 컴포넌트 업데이트 함수 호출                                │
└─────────────────────────────────────────────────────────────────┘
```

### 데이터 파일 ↔ 함수 매핑

| 데이터 파일 | 주요 함수 | 렌더링 컴포넌트 |
|------------|----------|---------------|
| `channel_daily_funnel.csv` | `calculateFunnelData()`, `getFilteredDailyData()` | 퍼널 차트, KPI 요약, 채널 필터 |
| `weekly_funnel.csv` | `calculateFunnelData()` | 퍼널 차트 |
| `channel_funnel.csv` | `updateChannelTable()`, `updateKpiChart()` | 채널 테이블, 지표 차트 |
| `insights.json` | `updateInsights()`, `updateBCGMatrix()` | 인사이트 카드, BCG 매트릭스 |
| `new_vs_returning.csv` | `updateCustomerTrendChart()` | 신규/재방문 추세 차트 |
| `channel_engagement.csv` | `updateChannelEngagementChart()` | 참여도 차트 |

---

## 전체 HTML ID 매핑

### 헤더/배너 섹션 ID
| ID | 용도 | 관련 함수 |
|----|------|----------|
| `analysisPeriod` | 분석 기간 표시 | `updateAnalysisPeriod()` |
| `summaryCardBanner` | 성과 요약 배너 컨테이너 | `updateSummaryCardBanner()` |
| `summaryCardTitle` | 배너 제목 | `updateSummaryCardBanner()` |
| `summaryCardMessage` | 배너 메시지 | `updateSummaryCardBanner()` |
| `summaryCardVisitors` | 방문자 수 | `updateSummaryCardBanner()` |
| `summaryCardPurchasers` | 구매자 수 | `updateSummaryCardBanner()` |
| `summaryCardCVR` | 전환율 | `updateSummaryCardBanner()` |

### KPI 섹션 ID
| ID | 용도 | 관련 함수 |
|----|------|----------|
| `kpiSummaryGrid` | KPI 카드 그리드 컨테이너 | `updateKPISummary()` |

### 퍼널 차트 섹션 ID
| ID | 용도 | 관련 함수 |
|----|------|----------|
| `funnelCompareBtn` | 비교 모드 버튼 | 이벤트 리스너 |
| `funnelFilterBtn` | 채널 필터 토글 버튼 | 이벤트 리스너 |
| `funnelChannelFilter` | 채널 선택 드롭다운 | `populateFunnelChannelFilter()` |
| `singleFunnelView` | 단일 퍼널 뷰 컨테이너 | - |
| `d3FunnelChart` | D3.js 메인 퍼널 차트 | `updateFunnelChart()` |
| `compareFunnelView` | 비교 퍼널 뷰 컨테이너 | - |
| `leftStartDate` / `leftEndDate` | 왼쪽 기간 선택 | `updateCompareFunnels()` |
| `rightStartDate` / `rightEndDate` | 오른쪽 기간 선택 | `updateCompareFunnels()` |
| `d3FunnelChartLeft` | 왼쪽 비교 퍼널 | `renderSmallFunnel()` |
| `d3FunnelChartRight` | 오른쪽 비교 퍼널 | `renderSmallFunnel()` |
| `comparisonInsights` | 비교 인사이트 컨테이너 | `updateComparisonInsights()` |
| `comparisonContent` | 비교 인사이트 내용 | `updateComparisonInsights()` |

### 인사이트 섹션 ID
| ID | 용도 | 관련 함수 |
|----|------|----------|
| `insightPeriodDateRange` | 인사이트 기간 표시 | `updateInsightPeriodDateRange()` |
| `urgentTotalCount` | 긴급 알림 총 개수 | `updateUrgentAlerts()` |
| `summaryTabContent` | 핵심 요약 탭 | `setupInsightStrategyTabs()` |
| `insightContent` | 인사이트 카드 컨테이너 | `updateInsights()` |
| `urgentTabContent` | 긴급 개선 탭 | `setupInsightStrategyTabs()` |
| `highAlertCount` / `mediumAlertCount` | 알림 개수 | `updateUrgentAlerts()` |
| `highAlertsCards` / `mediumAlertsCards` | 알림 카드 컨테이너 | `renderUrgentAlertCards()` |
| `bcgTabContent` | BCG 매트릭스 탭 | `setupInsightStrategyTabs()` |
| `bcgMatrixContent` | BCG 매트릭스 컨테이너 | `updateBCGMatrix()` |

### 의사결정 도구 섹션 ID
| ID | 용도 | 관련 함수 |
|----|------|----------|
| `periodDateRange` | 기간 표시 | `updatePeriodDateRange()` |
| `clusteringTab` | 채널 그룹 탭 | - |
| `channelClusters` | 클러스터 컨테이너 | `updateAdvancedAnalysis()` |
| `budgetTab` | 예산 가이드 탭 | - |
| `abTestResults` | A/B 테스트 결과 | `updateAdvancedAnalysis()` |
| `churnAlertTab` | 이탈 위험 탭 | - |
| `churnPredictions` | 이탈 예측 컨테이너 | `updateChurnPredictions()` |
| `improvementTab` | 성과 개선 탭 | - |
| `improvementPredictions` | 개선 예측 컨테이너 | `updateImprovementPredictions()` |

### 채널 분석 섹션 ID
| ID | 용도 | 관련 함수 |
|----|------|----------|
| `tableTab` | 채널 테이블 탭 | - |
| `channelTable` | 채널 테이블 | `updateChannelTable()` |
| `channelTableBody` | 테이블 본문 | `updateChannelTable()` |
| `channelTableInsightText` | 테이블 인사이트 | `analyzeChannelTableData()` |
| `kpiTab` | KPI 차트 탭 | - |
| `channelKpiChart` | KPI 막대 차트 | `updateKpiChart()` |
| `kpiChartInsightText` | KPI 차트 인사이트 | `analyzeKpiChartData()` |
| `balanceTab` | 효율성/규모 탭 | - |
| `channelCompareChart` | 비교 차트 | `updateCompareChart()` |
| `top10Tab` | TOP 10 탭 | - |
| `campaignChart` | 전환율 TOP 10 차트 | `updateCampaignChart()` |

### 고객 분석 섹션 ID
| ID | 용도 | 관련 함수 |
|----|------|----------|
| `trendTab` | 추세 탭 | - |
| `customerTrendChart` | 신규/재방문 추세 차트 | `updateCustomerTrendChart()` |
| `conversionTab` | 전환율 비교 탭 | - |
| `newVsReturningConversionChart` | 전환율 비교 차트 | `updateNewVsReturningConversionChart()` |
| `churnTab` | 이탈률 탭 | - |
| `channelChurnChart` | 이탈률 차트 | `updateChurnChart()` |
| `matrixTab` | 채널 매트릭스 탭 | - |
| `channelMatrixChart` | 채널 품질 매트릭스 | `updateChannelMatrixChart()` |
| `engagementTab` | 참여도 탭 | - |
| `channelEngagementChart` | 참여도 차트 | `updateChannelEngagementChart()` |

### 툴팁 ID
| ID | 용도 |
|----|------|
| `kpiChartTooltip` | KPI 차트 호버 툴팁 |
| `compareChartTooltip` | 비교 차트 호버 툴팁 |
| `customerTrendTooltip` | 추세 차트 호버 툴팁 |
| `churnChartTooltip` | 이탈 차트 호버 툴팁 |
| `microCardTooltip` | 마이크로 세그먼트 카드 처방 가이드 툴팁 |

---

## HTML/CSS 디자인 구조

### 0. 기본 CSS 리셋 및 Body 스타일

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: var(--background);
    color: var(--grey-900);
    line-height: 1.5;
}
```

### 1. CSS 변수 (Design Tokens)

```css
:root {
    /* Berry Theme Colors */
    --primary-main: #673ab7;      /* 메인 보라색 */
    --primary-light: #ede7f6;
    --primary-dark: #5e35b1;
    --secondary-main: #2196f3;    /* 파란색 */
    --secondary-light: #e3f2fd;
    --success-main: #00c853;      /* 녹색 */
    --success-light: #b9f6ca;
    --warning-main: #ffab00;      /* 주황색 */
    --warning-light: #fff8e1;
    --error-main: #ff1744;        /* 빨간색 */
    --error-light: #ffeaea;
    --grey-50: #fafafa;
    --grey-100: #f5f5f5;
    --grey-200: #eeeeee;
    --grey-300: #e0e0e0;
    --grey-500: #9e9e9e;
    --grey-600: #757575;
    --grey-700: #616161;
    --grey-900: #212121;
    --paper: #ffffff;
    --background: #f8fafc;
    --sidebar-bg: #ffffff;
    --sidebar-width: 260px;
}
```

### 2. 레이아웃 구조

```css
/* 앱 래퍼 */
.app-wrapper {
    display: flex;
    min-height: 100vh;
}

/* 사이드바 */
.sidebar {
    width: var(--sidebar-width);
    background: var(--sidebar-bg);
    border-right: 1px solid var(--grey-200);
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
}

/* 메인 컨텐츠 */
.main-content {
    flex: 1;
    margin-left: var(--sidebar-width);
    padding: 24px;
    min-height: 100vh;
}

.container {
    max-width: 1600px;
    margin: 0 auto;
}
```

### 3. KPI 요약 컴포넌트

```css
.kpi-summary-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
    margin-bottom: 24px;
}

.kpi-summary-card {
    padding: 20px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--paper) 0%, var(--grey-50) 100%);
    position: relative;
    overflow: hidden;
}

.kpi-summary-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
}

/* 각 카드별 왼쪽 보더 색상 */
.kpi-summary-card:nth-child(1)::before { background: #673ab7; }
.kpi-summary-card:nth-child(2)::before { background: #2196f3; }
.kpi-summary-card:nth-child(3)::before { background: #ff9800; }
.kpi-summary-card:nth-child(4)::before { background: #4caf50; }
.kpi-summary-card:nth-child(5)::before { background: #00c853; }

.kpi-summary-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--grey-500);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
}

.kpi-summary-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--grey-900);
}

.kpi-summary-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 12px;
    margin-top: 8px;
}

.kpi-summary-badge.positive {
    background: var(--success-light);
    color: var(--success-main);
}

.kpi-summary-badge.negative {
    background: var(--error-light);
    color: var(--error-main);
}
```

### 4. 차트 컴포넌트

```css
.chart-section {
    margin-bottom: 24px;
    padding: 24px;
    overflow: visible;
}

.chart-header {
    font-size: 16px;
    font-weight: 600;
    color: var(--grey-900);
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.chart-header::before {
    content: '';
    width: 4px;
    height: 20px;
    background: var(--secondary-main);
    border-radius: 2px;
}

.chart-container {
    position: relative;
    height: 400px;
    overflow: visible;
}

.chart-container-small {
    position: relative;
    height: 300px;
    overflow: visible;
}
```

### 5. 인사이트 컴포넌트

```css
.insight-section {
    padding: 24px;
    margin-bottom: 24px;
}

.insight-header {
    font-size: 16px;
    font-weight: 600;
    color: var(--grey-900);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.insight-header::before {
    content: '';
    width: 4px;
    height: 20px;
    background: var(--warning-main);
    border-radius: 2px;
}

.insight-content {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

.insight-card {
    padding: 16px;
    background: var(--grey-50);
    border-radius: 8px;
    border-left: 4px solid var(--primary-main);
}

.insight-card.positive {
    border-left-color: var(--success-main);
    background: var(--success-light);
}
.insight-card.negative {
    border-left-color: var(--error-main);
    background: var(--error-light);
}
.insight-card.neutral {
    border-left-color: var(--warning-main);
    background: var(--warning-light);
}

.insight-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--grey-900);
    margin-bottom: 8px;
}

.insight-text {
    font-size: 13px;
    color: var(--grey-700);
    line-height: 1.6;
}
```

### 6. 테이블 컴포넌트

```css
.table-section {
    overflow: visible;
    position: relative;
}

.table-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--grey-200);
    font-size: 16px;
    font-weight: 600;
    color: var(--grey-900);
}

.table-container {
    overflow-x: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
}

th, td {
    padding: 14px 16px;
    text-align: right;
    font-size: 14px;
}

th {
    background: var(--grey-50);
    font-weight: 600;
    color: var(--grey-700);
    border-bottom: 2px solid var(--grey-200);
    position: sticky;
    top: 0;
    cursor: pointer;
}

th:first-child, td:first-child {
    text-align: left;
    position: sticky;
    left: 0;
    background: var(--paper);
}
```

### 7. 버튼 컴포넌트

```css
.view-btn {
    padding: 10px 24px;
    border: none;
    background: var(--paper);
    color: var(--grey-700);
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    font-size: 14px;
    font-family: inherit;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.view-btn:hover {
    background: var(--primary-light);
    color: var(--primary-main);
}

.view-btn.active {
    background: var(--primary-main);
    color: white;
    box-shadow: 0 4px 12px rgba(103, 58, 183, 0.4);
}

/* 기간 필터 버튼 */
.period-filter-btn, .insight-period-btn {
    padding: 6px 12px;
    border: 1px solid var(--grey-300);
    background: var(--paper);
    color: var(--grey-700);
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.period-filter-btn.active, .insight-period-btn.active {
    background: var(--primary-main);
    color: white;
    border-color: var(--primary-main);
}
```

### 8. 반응형 디자인

```css
@media (max-width: 1200px) {
    .sidebar {
        transform: translateX(-100%);
        transition: transform 0.3s ease;
    }

    .sidebar.open {
        transform: translateX(0);
    }

    .main-content {
        margin-left: 0;
    }

    .kpi-summary-grid {
        grid-template-columns: repeat(3, 1fr);
    }

    .insight-content {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .main-content {
        padding: 16px;
    }

    .kpi-summary-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .insight-content {
        grid-template-columns: 1fr;
    }

    .chart-container {
        height: 300px;
    }
}

@media (max-width: 480px) {
    .kpi-summary-grid {
        grid-template-columns: 1fr;
    }

    .kpi-summary-value {
        font-size: 20px;
    }
}
```

---

## JavaScript 핵심 함수 구현 코드

### 1. CSV 파싱 함수

```javascript
function parseCSV(text, filename = 'unknown') {
    const lines = text.trim().split('\n');

    function parseLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }

    const headers = parseLine(lines[0]).map(h => h.trim());

    return lines.slice(1).map(line => {
        const values = parseLine(line);
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] ? values[index].trim() : '';
        });
        return obj;
    }).filter(row => Object.values(row).some(v => v !== ''));
}
```

### 2. 데이터 로드 함수

```javascript
async function loadData() {
    try {
        // JSON 데이터 로드
        const insightsResponse = await fetch('funnel/insights.json');
        insightsData = await insightsResponse.json();

        // CSV 파일들 병렬 로드
        const [dailyText, weeklyText, channelText, newVsReturningText,
               channelEngagementText, newVsReturningConversionText] = await Promise.all([
            fetch('funnel/daily_funnel.csv').then(r => r.text()),
            fetch('funnel/weekly_funnel.csv').then(r => r.text()),
            fetch('funnel/channel_funnel.csv').then(r => r.text()),
            fetch('funnel/new_vs_returning.csv').then(r => r.text()),
            fetch('funnel/channel_engagement.csv').then(r => r.text()),
            fetch('funnel/new_vs_returning_conversion.csv').then(r => r.text())
        ]);

        // CSV 파싱
        dailyData = parseCSV(dailyText, 'daily_funnel.csv');
        weeklyData = parseCSV(weeklyText, 'weekly_funnel.csv');
        channelData = parseCSV(channelText, 'channel_funnel.csv');
        newVsReturningData = parseCSV(newVsReturningText, 'new_vs_returning.csv');
        channelEngagementData = parseCSV(channelEngagementText, 'channel_engagement.csv');
        newVsReturningConversionData = parseCSV(newVsReturningConversionText, 'new_vs_returning_conversion.csv');

        // 대시보드 업데이트
        updateDashboard();

    } catch (error) {
        console.error('데이터 로드 실패:', error);
    }
}
```

### 3. 퍼널 차트 렌더링 (D3.js)

```javascript
function updateFunnelChart() {
    const container = document.getElementById('d3FunnelChart');
    if (!container) return;

    container.innerHTML = '';

    const funnelData = calculateFunnelData(dailyData);
    if (!funnelData || funnelData.length === 0) return;

    const width = container.clientWidth || 800;
    const height = 500;
    const margin = { top: 40, right: 200, bottom: 40, left: 200 };

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const stages = ['유입', '활동', '관심', '결제진행', '구매완료'];
    const colors = ['#673ab7', '#2196f3', '#ff9800', '#4caf50', '#00c853'];

    const maxValue = funnelData[0].value;
    const stageHeight = (height - margin.top - margin.bottom) / stages.length;

    // 각 단계별 트라페지오드(사다리꼴) 그리기
    funnelData.forEach((stage, i) => {
        const topWidth = (stage.value / maxValue) * (width - margin.left - margin.right);
        const bottomWidth = funnelData[i + 1]
            ? (funnelData[i + 1].value / maxValue) * (width - margin.left - margin.right)
            : topWidth * 0.8;

        const y = margin.top + i * stageHeight;
        const centerX = width / 2;

        // 사다리꼴 패스
        const path = `
            M ${centerX - topWidth/2} ${y}
            L ${centerX + topWidth/2} ${y}
            L ${centerX + bottomWidth/2} ${y + stageHeight}
            L ${centerX - bottomWidth/2} ${y + stageHeight}
            Z
        `;

        svg.append('path')
            .attr('d', path)
            .attr('fill', colors[i])
            .attr('opacity', 0.85)
            .on('mouseover', function() {
                d3.select(this).attr('opacity', 1);
            })
            .on('mouseout', function() {
                d3.select(this).attr('opacity', 0.85);
            });

        // 라벨
        svg.append('text')
            .attr('x', centerX)
            .attr('y', y + stageHeight / 2)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-weight', '600')
            .text(`${stage.label}: ${stage.value.toLocaleString()}`);
    });
}
```

### 4. KPI 업데이트 함수

```javascript
function updateKPISummary() {
    const container = document.getElementById('kpiSummaryGrid');
    if (!container) return;

    const funnelData = calculateFunnelData(dailyData);
    if (!funnelData || funnelData.length === 0) return;

    const stages = [
        { key: '유입', label: '총 유입', color: '#673ab7' },
        { key: '활동', label: '총 활성화', color: '#2196f3' },
        { key: '관심', label: '관심', color: '#ff9800' },
        { key: '결제진행', label: '결제 진행', color: '#4caf50' },
        { key: '구매완료', label: '구매 완료', color: '#00c853' }
    ];

    container.innerHTML = stages.map((stage, i) => {
        const data = funnelData.find(d => d.label === stage.key);
        const value = data ? data.value : 0;
        const prevValue = i > 0 ? funnelData[i - 1].value : value;
        const rate = prevValue > 0 ? ((value / prevValue) * 100).toFixed(1) : 0;

        return `
            <div class="kpi-summary-card card">
                <div class="kpi-summary-label">${stage.label}</div>
                <div class="kpi-summary-value">${value.toLocaleString()}</div>
                ${i > 0 ? `
                    <div class="kpi-summary-badge ${parseFloat(rate) >= 50 ? 'positive' : 'negative'}">
                        ${rate}% 전환
                    </div>
                ` : '<div class="kpi-summary-unit">명</div>'}
            </div>
        `;
    }).join('');
}
```

### 5. 인사이트 업데이트 함수

```javascript
function updateInsights() {
    const container = document.getElementById('insightContent');
    if (!container || !insightsData) return;

    const periodData = getInsightPeriodData();
    if (!periodData) return;

    const summary = periodData.summary;
    const topChannels = periodData.top_channels || [];
    const alerts = periodData.alerts || [];

    let html = '';

    // 전체 전환율 카드
    if (summary) {
        html += `
            <div class="insight-card positive">
                <div class="insight-title">📊 전체 전환율</div>
                <div class="insight-text">
                    현재 전환율: <strong>${summary.overall_cvr || '-'}%</strong><br>
                    ${summary.trend || ''}
                </div>
            </div>
        `;
    }

    // 최고 성과 채널
    if (topChannels.length > 0) {
        html += `
            <div class="insight-card neutral">
                <div class="insight-title">🏆 최고 성과 채널</div>
                <div class="insight-text">
                    ${topChannels.slice(0, 3).map(ch =>
                        `<strong>${ch.channel}</strong>: ${ch.cvr}%`
                    ).join('<br>')}
                </div>
            </div>
        `;
    }

    // 경고 알림
    if (alerts.length > 0) {
        html += `
            <div class="insight-card negative">
                <div class="insight-title">⚠️ 주의 필요</div>
                <div class="insight-text">
                    ${alerts.slice(0, 2).map(alert => alert.message).join('<br>')}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}
```

---

## 전역 변수 초기값

```javascript
// 데이터 변수
let dailyData = [];
let weeklyData = [];
let channelData = [];
let newVsReturningData = [];
let channelEngagementData = [];
let newVsReturningConversionData = [];
let insightsData = null;

// 기간 필터 상태
let currentPeriod = 'full';
let insightPeriod = 'full';
let newVsReturningView = 'monthly';

// 차트 선택 상태
let currentKpiType = 'cvr';
let currentChurnStage = 'avg';
let currentChurnSort = 'desc';
let currentChannelFunnel = 'purchase';

// 차트 인스턴스
let channelKpiChart = null;
let channelChurnChart = null;
let channelCompareChart = null;
let campaignChart = null;
let customerTrendChart = null;
let newVsReturningConversionChart = null;
let channelMatrixChart = null;
let channelEngagementChart = null;
```

---

## 사이드바 네비게이션 HTML 구조

```html
<aside class="sidebar">
    <div class="sidebar-header">
        <a href="#" class="sidebar-logo">
            <div class="sidebar-logo-icon">
                <svg viewBox="0 0 24 24">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                </svg>
            </div>
            <div>
                <div class="sidebar-logo-text">Analytics</div>
                <div class="sidebar-logo-subtitle">Dashboard</div>
            </div>
        </a>
    </div>

    <div class="simplebar-content-wrapper">
        <div class="sidebar-content">
            <div class="nav-group">
                <div class="nav-group-title">대시보드</div>
                <a href="marketing_dashboard_v3.html" class="nav-item">
                    <div class="nav-item-icon">
                        <svg viewBox="0 0 24 24"><!-- 아이콘 --></svg>
                    </div>
                    <span class="nav-item-text">광고 성과 대시보드</span>
                </a>
                <a href="#" class="nav-item active">
                    <div class="nav-item-icon">
                        <svg viewBox="0 0 24 24"><!-- 아이콘 --></svg>
                    </div>
                    <span class="nav-item-text">AARRR 퍼널 분석</span>
                </a>
            </div>

            <div class="nav-group">
                <div class="nav-group-title">분석</div>
                <a href="creative_analysis.html" class="nav-item">
                    <div class="nav-item-icon">
                        <svg viewBox="0 0 24 24"><!-- 아이콘 --></svg>
                    </div>
                    <span class="nav-item-text">광고 소재별 분석</span>
                </a>
                <a href="timeseries_analysis.html" class="nav-item">
                    <div class="nav-item-icon">
                        <svg viewBox="0 0 24 24"><!-- 아이콘 --></svg>
                    </div>
                    <span class="nav-item-text">시계열 데이터 분석</span>
                </a>
            </div>
        </div>
    </div>
</aside>
```

---

## KPI 요약 카드 HTML 구조

```html
<div class="kpi-summary-grid" id="kpiSummaryGrid">
    <div class="kpi-summary-card card">
        <div class="kpi-summary-label">총 유입</div>
        <div class="kpi-summary-value">125,430</div>
        <div class="kpi-summary-unit">명</div>
    </div>
    <div class="kpi-summary-card card">
        <div class="kpi-summary-label">총 활성화</div>
        <div class="kpi-summary-value">89,201</div>
        <div class="kpi-summary-badge positive">71.1% 전환</div>
    </div>
    <div class="kpi-summary-card card">
        <div class="kpi-summary-label">관심</div>
        <div class="kpi-summary-value">45,678</div>
        <div class="kpi-summary-badge positive">51.2% 전환</div>
    </div>
    <div class="kpi-summary-card card">
        <div class="kpi-summary-label">결제 진행</div>
        <div class="kpi-summary-value">12,345</div>
        <div class="kpi-summary-badge negative">27.0% 전환</div>
    </div>
    <div class="kpi-summary-card card">
        <div class="kpi-summary-label">구매 완료</div>
        <div class="kpi-summary-value">8,901</div>
        <div class="kpi-summary-badge positive">72.1% 전환</div>
    </div>
</div>
```

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
| 2025-12-08 | 목차 추가 (기본정보, 기능명세, JavaScript, HTML구조, CSS디자인, 데이터, 기타) |
| 2025-12-08 | HTML 문서 기본 구조 섹션 추가 (DOCTYPE, head, CDN 링크) |
| 2025-12-08 | 데이터 흐름 다이어그램 및 데이터 파일↔함수 매핑 추가 |
| 2025-12-08 | 전체 HTML ID 매핑 추가 (헤더, KPI, 퍼널, 인사이트, 채널분석, 고객분석 섹션) |
| 2025-12-08 | HTML/CSS 디자인 구조 추가 (CSS 변수, 레이아웃, KPI, 차트, 인사이트, 테이블, 버튼, 반응형) |
| 2025-12-08 | JavaScript 핵심 함수 구현 코드 추가 (parseCSV, loadData, updateFunnelChart, updateKPISummary, updateInsights) |
| 2025-12-08 | 전역 변수 초기값 추가 |
| 2025-12-08 | 사이드바 네비게이션 HTML 구조 추가 |
| 2025-12-08 | KPI 요약 카드 HTML 구조 추가 |
| 2025-12-10 | 채널 필터 기능 추가: `funnelFilterBtn`, `funnelChannelFilter` 버튼/드롭다운 추가 |
| 2025-12-10 | 새 CSV 파일 `channel_daily_funnel.csv` 추가 (채널별 일별 퍼널 데이터) |
| 2025-12-10 | `dailyData` 로드 경로 변경: `daily_funnel.csv` → `channel_daily_funnel.csv` |
| 2025-12-10 | 퍼널 채널 필터 함수 추가: `populateFunnelChannelFilter()`, `getFilteredDailyData()` |
| 2025-12-10 | 퍼널 채널 필터 상태 변수 추가: `funnelFilterActive`, `selectedFunnelChannel` |
| 2025-12-10 | `updateFunnelChart()`, `updateCompareFunnels()` 채널 필터 연동 |
| 2025-12-26 | 섹션 4.5 유형별 조치 가이드 (마이크로 세그먼트) 문서화 추가 |
| 2025-12-26 | 마이크로 세그먼트 카드 호버 시 처방 가이드 + 구분 정의 툴팁 표시 기능 구현 |
| 2025-12-26 | 툴팁이 마우스 커서 위치를 따라다니도록 변경 |
| 2025-12-26 | '구분 정의' 독립 섹션 삭제 (툴팁으로 통합) |
| 2025-12-26 | `setupMicroCardTooltip()` 함수 추가, `microCardTooltip` HTML ID 추가 |
| 2025-12-26 | `MICRO_SEGMENT_DEFINITIONS`에 `condition`, `action_hint` 필드 추가 |
| 2025-12-26 | '핵심 요약' 탭 `insight-card` 디자인 일관성 수정: padding 20px→16px, border-radius 12px→8px, background gradient→solid color, font-size 14px→15px/13px |
| 2025-12-26 | '유형별 조치 가이드' 카드에 '추천 액션' 섹션 추가 (긴급 개선 카드와 동일 디자인) |
| 2025-12-26 | **urgent_alerts → micro_segment_alerts 통합**: '긴급 개선' 탭의 데이터 소스를 `micro_segment_alerts`로 변경 |
| 2025-12-26 | `MICRO_SEGMENT_DEFINITIONS`에 신규 세그먼트 3개 추가: `activation_drop`, `engagement_gap`, `silent_majority` |
| 2025-12-26 | `CATEGORY_SEGMENT_ACTIONS` 매트릭스 추가: 카테고리(SA/DA/SNS/CRM/Organic 등) × 세그먼트 조합별 3단계 액션 제공 |
| 2025-12-26 | `get_segment_action_detail()` 함수 추가: 카테고리×세그먼트 조합에 따른 primary/secondary/ab_test 액션 반환 |
| 2025-12-26 | `calculate_urgency_score()` 함수 추가: 심각도+트래픽+Gap+잠재손실 기반 0-100점 긴급도 점수 산출 |
| 2025-12-26 | `generate_micro_segment_alerts()` 확장: impact(lost_users, potential_revenue), benchmark, action_detail, urgency_score, priority_rank 필드 추가 |
| 2025-12-26 | 프론트엔드 `updateUrgentAlerts()` 수정: `micro_segment_alerts`에서 problem 유형만 필터링하여 사용 |
| 2025-12-26 | 프론트엔드 `renderUrgentAlertCards()` 확장: 긴급도 배지, 영향 추정, 추가 조치 표시 추가 |

