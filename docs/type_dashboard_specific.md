# type_dashboard.html 기능 분석 문서

---

## 📑 목차

### 기능 분석
- [1. 개요](#개요)
- [2. 파일 구조](#파일-구조)
- [3. 섹션별 기능 브리핑](#섹션별-기능-브리핑)
  - [3.1 KPI 카드 영역](#1-kpi-카드-영역)
  - [3.2 데이터 기반 의사결정 도구](#2-데이터-기반-의사결정-도구-collapsible-section-1)
  - [3.3 성과 추이 분석](#3-성과-추이-분석-collapsible-section-2)
  - [3.4 성과 상세 분석](#4-성과-상세-분석-collapsible-section-3)
  - [3.5 성과 분석](#5-성과-분석-collapsible-section-4)
  - [3.6 리타겟팅 분석](#6-리타겟팅-분석-collapsible-section-5)
- [4. 버튼 UI 컴포넌트](#버튼-ui-컴포넌트)
- [5. 전역 변수 및 상태 관리](#전역-변수-및-상태-관리)
- [6. 핵심 함수 목록](#핵심-함수-목록)
- [7. 참조 데이터 파일 구조](#참조-데이터-파일-구조)
- [8. 차트 인스턴스](#차트-인스턴스)

### HTML/CSS 디자인 구조
- [9. CSS 변수 (Design Tokens)](#1-css-변수-design-tokens---통합-필수)
- [10. 공통 컴포넌트](#2-공통-컴포넌트-reusable-components)
  - [10.1 카드 `.card`](#21-카드-컴포넌트-card)
  - [10.2 접기/펼치기 `.collapsible-*`](#22-접기펼치기-컴포넌트-collapsible-)
  - [10.3 인라인 토글 `.inline-toggle`](#23-인라인-토글-컴포넌트-inline-toggle)
  - [10.4 더보기 버튼 `.show-more-btn`](#24-더보기-버튼-show-more-btn)
  - [10.5 뷰 버튼 `.view-btn`](#25-뷰-버튼-view-btn)
  - [10.6 탭 `.tabs`, `.tab`](#26-일반-탭-컴포넌트-tabs-tab)
  - [10.7 호버 카드 `.hoverable-card`](#27-호버-가능한-카드-hoverable-card)
- [11. KPI 카드 컴포넌트](#3-kpi-카드-컴포넌트)
- [12. 인사이트 카드 컴포넌트](#4-인사이트-카드-컴포넌트)
- [13. 테이블 컴포넌트](#5-테이블-컴포넌트)
- [14. Badge 컴포넌트](#6-badge-컴포넌트)
- [15. 페이지 고유 컴포넌트](#7-페이지-고유-컴포넌트-type_dashboard-전용)
  - [15.1 스토리 인트로 카드](#71-스토리-기반-인트로-카드)
  - [15.2 기간 필터 버튼](#72-기간-필터-버튼-period-filter-btn)
  - [15.3 계절성 분석 서브탭](#73-계절성-분석-서브탭-day-analysis-subtab)
  - [15.4~15.6 KPI/인사이트/범례](#74-분기별-kpi-카드-계절성-분석)
  - [15.7~15.10 동적 생성 HTML](#77-ai-컨설턴트-종합-진단-카드-동적-생성)
- [16. Tooltip 컴포넌트](#8-tooltip-컴포넌트)
- [17. 로딩 상태 컴포넌트](#9-로딩-상태-컴포넌트)
- [18. 레이아웃 구조](#10-레이아웃-구조)
- [19. 그리드 유틸리티](#11-그리드-유틸리티)
- [20. 차트 컨테이너](#12-차트-컨테이너)
- [21. 반응형 브레이크포인트](#13-반응형-브레이크포인트)
- [22. 통합 시 주의사항](#14-통합-시-주의사항)

### 부록
- [변경 이력](#변경-이력)

---

## 개요
`data/type_dashboard.html`은 **채널별 분석 대시보드**로, 브랜드/상품/프로모션별 광고 성과를 분석하는 대시보드입니다.

---

## 파일 구조

### 외부 라이브러리
| 라이브러리 | 용도 |
|-----------|------|
| Chart.js | 차트 시각화 |
| chartjs-plugin-datalabels | 차트 데이터 라벨 플러그인 |
| D3.js (v7) | 데이터 시각화 |
| Google Fonts (Roboto, Inter) | 폰트 |

---

## 섹션별 기능 브리핑

### 1. KPI 카드 영역
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 전체 개요 (상단 고정) |
| **JS 함수** | `renderKPICards()` |
| **참조 데이터** | `adsetDimensionData` (dimension_type1_campaign_adset.csv) |
| **기능** | 주요 KPI 9개 표시: 총 비용, CPM, CPC, CPA, ROAS, 총 노출, 총 클릭, 총 전환수, 총 전환값 |

---

### 2. 데이터 기반 의사결정 도구 (collapsible-section #1)
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 🔬 데이터 기반 의사결정 도구 |
| **위치** | Line 1173 |

#### 2.1 오늘의 요약 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `renderSummaryTab()`, `initActionGuideTabs()`, `renderRecommendationCard()` |
| **참조 데이터** | `insights.json` → `summary`, `summary_card`, `top_recommendations`, `top_categories`, `product_performance`, `gender_performance`, `timeseries` |
| **기능** | - AI 컨설턴트 종합 진단 카드<br>- 핵심 지표 대시보드 (ROAS, CPA, 전환수, 매출)<br>- 지금 바로 할 수 있는 일 가이드<br>- AI 핵심 추천 사항 |

#### 2.2 성과 기회 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `renderOpportunityTab()` |
| **참조 데이터** | `insights.json` → `top_categories`, `product_performance`, `top_adsets` |
| **기능** | - 예산 확대 추천 채널 (ROAS 200% 이상)<br>- 효율 좋은 상품 표시<br>- TOP 광고세트 순위 |

#### 2.3 주의 필요 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `renderWarningTab()`, `initWarningSubtabs()` |
| **참조 데이터** | `insights.json` → `alerts`, `top_categories`, `product_performance` |
| **기능** | - AI 분석 경고 알림<br>- CPA 높음 경고<br>- 비효율 상품 경고<br>- Financial Impact 및 Action 가이드 |

#### 2.4 타겟 분석 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `renderTargetingTab()` |
| **참조 데이터** | `insights.json` → `gender_performance`, `device_performance`, `deviceplatform_performance`, `age_gender_combinations` |
| **기능** | - 최고 효과 타겟 요약 (성별, 기기, 연령×성별)<br>- 성별 비교<br>- 기기플랫폼별 성과<br>- 연령+성별 조합 TOP 5 |

#### 2.5 AI 예측 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `renderForecastTab()`, `generateAIOpportunities()`, `generateAIActions()`, `initForecastSubtabs()`, `initForecastAccordions()` |
| **참조 데이터** | `insights.json` → `prophet_forecast`, `summary`, `top_categories`, `gender_performance`, `product_performance`, `device_performance` |
| **기능** | - Prophet 예측 데이터 시각화<br>- AI가 발견한 기회<br>- AI 추천 액션<br>- 채널별 ROAS 순위 |

#### 2.6 계절성 분석 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `renderQuarterlyTrendChart()`, `renderQuarterlyKpiCards()`, `renderQuarterlySeasonalityInsight()`, `renderQuarterlyTable()`, `renderSeasonalityTable()`, `renderChannelDayKpiCards()`, `renderChannelDayRoasChart()`, `initDayAnalysisSubtabs()` |
| **참조 데이터** | `insights.json` → `seasonality_analysis`, `seasonality_insights` |
| **기능** | - 분기별 추이 차트 (비용/ROAS/CPA)<br>- 분기별 KPI 카드<br>- 요일별 분석<br>- 계절성 인사이트 |

---

### 3. 성과 추이 분석 (collapsible-section #2)
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 📈 성과 추이 분석 - 시간에 따른 성과 변화를 확인하세요 |
| **위치** | Line 1473 |

#### 3.1 광고세트 추이 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `initTimeseriesDropdowns()`, 관련 차트 렌더링 함수 |
| **참조 데이터** | `adsetDimensionData` (dimension_type1_campaign_adset.csv) |
| **기능** | - 일별/주별/월별 집계 단위 선택<br>- 지표 선택 (ROAS, 비용, 전환값, 전환수 등 11개)<br>- 채널/상품/브랜드/프로모션 필터<br>- 기간 선택 |

#### 3.2 성별 추이 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `renderGenderChart()`, `initGenderDropdowns()` |
| **참조 데이터** | `genderDimensionData` (dimension_type4_adset_gender.csv) |
| **기능** | 성별 기준 성과 추이 시각화 |

#### 3.3 연령 추이 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `initAgeDropdowns()`, 관련 렌더링 함수 |
| **참조 데이터** | `ageDimensionData` (dimension_type3_adset_age.csv) |
| **기능** | 연령대별 성과 추이 시각화 |

#### 3.4 플랫폼 추이 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `renderPlatformChart()`, `initPlatformDropdowns()` |
| **참조 데이터** | `platformDimensionData` (dimension_type6_adset_platform.csv) |
| **기능** | 플랫폼별 성과 추이 시각화 |

#### 3.5 기기플랫폼 추이 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `initDevicePlatformDropdowns()` |
| **참조 데이터** | `devicePlatformDimensionData` (dimension_type7_adset_deviceplatform.csv) |
| **기능** | 기기플랫폼별 성과 추이 시각화 |

#### 3.6 기기 추이 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `initDeviceTypeDropdowns()` |
| **참조 데이터** | `deviceTypeDimensionData` (dimension_type5_adset_device.csv) |
| **기능** | 기기유형별 성과 추이 시각화 |

#### 3.7 성별 연령 PIVOT 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `initPivotDropdowns()` |
| **참조 데이터** | `pivotDimensionData` (dimension_type2_adset_age_gender.csv) |
| **기능** | 성별×연령 조합 PIVOT 테이블 |

---

### 4. 성과 상세 분석 (collapsible-section #3)
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 📊 성과 상세 분석 - 차원별 성과를 비교하세요 |
| **위치** | Line 2999 |
| **JS 함수** | `initDetailAnalysis()` |

#### 탭 구성
| 탭 | 참조 데이터 | 기능 |
|----|-----------|------|
| 광고세트 | merged_data.csv | 광고세트별 성과 막대 차트, 기간 비교 |
| 성별 | merged_data.csv | 성별 성과 막대 차트 |
| 연령 | merged_data.csv | 연령별 성과 막대 차트 |
| 플랫폼 | merged_data.csv | 플랫폼별 성과 막대 차트 |
| 기기플랫폼 | merged_data.csv | 기기플랫폼별 성과 막대 차트 |
| 기기 | merged_data.csv | 기기별 성과 막대 차트 |

**공통 기능:**
- 지표 선택 (ROAS, CPA, 비용, 전환수, 전환값 등)
- 정렬 방향 (오름차순/내림차순)
- 기간 선택 및 기간 비교

---

### 5. 성과 분석 (collapsible-section #4)
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 🏆 성과 분석 - 무엇이 가장 잘 팔리고 있나요? |
| **위치** | Line 4120 |
| **JS 함수** | `initPerformanceCharts()`, `setupPerformanceControls()`, `renderAllPerformanceCharts()` |

#### 5.1 브랜드 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `renderBrandPerformanceChart()`, `generateBrandInsight()` |
| **참조 데이터** | `adsetDimensionData` (dimension_type1_campaign_adset.csv) → `브랜드명` 컬럼 |
| **기능** | - 브랜드별 성과 막대 차트<br>- 지표 선택 (ROAS, CPA, 비용, 전환수, 전환값)<br>- 기간 선택 및 비교 |

#### 5.2 상품 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `renderProductPerformanceChart()`, `generateProductInsight()` |
| **참조 데이터** | `adsetDimensionData` → `상품명` 컬럼 |
| **기능** | 상품별 성과 막대 차트 |

#### 5.3 프로모션 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `renderPromotionPerformanceChart()`, `generatePromotionInsight()` |
| **참조 데이터** | `adsetDimensionData` → `프로모션코드` 컬럼 |
| **기능** | 프로모션별 성과 막대 차트 |

#### 5.4 타겟팅 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `renderTargetingPerformanceChart()`, `generateTargetingInsight()` |
| **참조 데이터** | `adsetDimensionData` → `타겟팅` 컬럼 |
| **기능** | 타겟팅별 성과 막대 차트 |

---

### 6. 리타겟팅 분석 (collapsible-section #5)
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 🎯 리타겟팅 분석 - 제품에 관심이 많은 소비자를 확인하세요 |
| **위치** | Line 4451 |
| **JS 함수** | `initRetargetingAnalysis()`, `setupRetargetingTabEvents()`, `setupRetargetingSortEvents()` |

#### 6.1 성별/연령 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `renderAgeGenderRetargetTable()` |
| **참조 데이터** | `insights.json` → `retargeting_analysis.by_age_gender`, `retargeting_insights` |
| **기능** | - 성별/연령 조합별 성과 테이블<br>- ROAS, CPA, 광고비, 전환수, 전환값<br>- 효율등급 표시<br>- 컬럼별 정렬 |

#### 6.2 기기별 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `renderDeviceRetargetTable()` |
| **참조 데이터** | `insights.json` → `retargeting_analysis.by_device` |
| **기능** | 기기별 리타겟팅 성과 테이블 |

#### 6.3 플랫폼별 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `renderPlatformRetargetTable()` |
| **참조 데이터** | `insights.json` → `retargeting_analysis.by_platform` |
| **기능** | 플랫폼별 리타겟팅 성과 테이블 |

#### 6.4 노출기기별 탭
| 항목 | 내용 |
|------|------|
| **JS 함수** | `renderDevicePlatformRetargetTable()`, `getDevicePlatformIcon()` |
| **참조 데이터** | `insights.json` → `retargeting_analysis.by_device_platform` |
| **기능** | 노출기기별 리타겟팅 성과 테이블 |

---

## 버튼 UI 컴포넌트

### 1. 섹션 토글 버튼
| 클래스 | 위치 | 기능 |
|--------|------|------|
| `collapsible-toggle` | 각 섹션 헤더 | 섹션 접기/펼치기 |

### 2. 기간 필터 버튼 (전역)
| 클래스 | data 속성 | 호출 함수 | 기능 |
|--------|----------|----------|------|
| `period-filter-btn` | `data-period="full\|180d\|90d"` | `switchPeriod()` | 전체/180일/90일 기간 전환 |

### 3. 의사결정 도구 탭 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `decision-tool-tab-btn` | `data-tab="summary"` | 오늘의 요약 탭 |
| `decision-tool-tab-btn` | `data-tab="opportunity"` | 성과 기회 탭 |
| `decision-tool-tab-btn` | `data-tab="warning"` | 주의 필요 탭 |
| `decision-tool-tab-btn` | `data-tab="targeting"` | 타겟 분석 탭 |
| `decision-tool-tab-btn` | `data-tab="forecast"` | AI 예측 탭 |
| `decision-tool-tab-btn` | `data-tab="dayAnalysis"` | 계절성 분석 탭 |

#### 3.1 오늘의 요약 - 액션 가이드 서브탭
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `action-guide-tab` | `data-action-tab="quickAction"` | 지금 바로 할 수 있는 일 |
| `action-guide-tab` | `data-action-tab="aiRecommend"` | AI 핵심 추천 |

#### 3.2 주의 필요 - 서브탭
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `warning-subtab` | `data-warning-tab="aiAlert"` | AI 분석 경고 |
| `warning-subtab` | `data-warning-tab="cpa"` | CPA 높음 |
| `warning-subtab` | `data-warning-tab="products"` | 비효율 상품 |

#### 3.3 AI 예측 - 서브탭
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `forecast-subtab` | `data-subtab="product"` | 상품별 분석 |
| `forecast-subtab` | `data-subtab="gender-age"` | 성별&연령 분석 |
| `forecast-subtab` | `data-subtab="deviceplatform"` | 기기플랫폼 분석 |
| `forecast-subtab` | `data-subtab="category"` | 채널 분석 |

#### 3.4 계절성 분석 - 서브탭
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `day-analysis-subtab` | `data-day-tab="quarterlyTrend"` | 분기별 추이 |
| `day-analysis-subtab` | `data-day-tab="dayConversion"` | 요일별 전환 |
| `day-analysis-subtab` | `data-day-tab="channelDay"` | 채널별 요일 분석 |

### 4. 성과 추이 분석 탭 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `trend-analysis-tab-btn` | `data-tab="timeseries"` | 광고세트 추이 |
| `trend-analysis-tab-btn` | `data-tab="gender"` | 성별 추이 |
| `trend-analysis-tab-btn` | `data-tab="age"` | 연령 추이 |
| `trend-analysis-tab-btn` | `data-tab="platform"` | 플랫폼 추이 |
| `trend-analysis-tab-btn` | `data-tab="device-platform"` | 기기플랫폼 추이 |
| `trend-analysis-tab-btn` | `data-tab="device-type"` | 기기 추이 |
| `trend-analysis-tab-btn` | `data-tab="age-gender-pivot"` | 성별 연령 PIVOT |

#### 4.1 집계 단위 버튼 (각 추이 탭 공통)
| 클래스 패턴 | data 속성 | 기능 |
|------------|----------|------|
| `timeseries-period-btn` | `data-period="daily\|weekly\|monthly"` | 광고세트 추이 집계 |
| `gender-period-btn` | `data-period="daily\|weekly\|monthly"` | 성별 추이 집계 |
| `age-period-btn` | `data-period="daily\|weekly\|monthly"` | 연령 추이 집계 |
| `platform-period-btn` | `data-period="daily\|weekly\|monthly"` | 플랫폼 추이 집계 |
| `deviceplatform-period-btn` | `data-period="daily\|weekly\|monthly"` | 기기플랫폼 추이 집계 |
| `device-period-btn` | `data-period="daily\|weekly\|monthly"` | 기기 추이 집계 |

#### 4.2 필터 드롭다운 버튼 (각 추이 탭)
| 클래스 패턴 | data 속성 | 필터 옵션 |
|------------|----------|----------|
| `timeseries-filter-dropdown-btn` | `data-filter` | 광고세트 추이: 채널, 상품, 브랜드, 프로모션 |
| `gender-filter-dropdown-btn` | `data-filter` | 성별 추이: 채널, 상품, 브랜드, 프로모션, 광고세트 |
| `age-filter-dropdown-btn` | `data-filter` | 연령 추이: 채널, 상품, 브랜드, 프로모션, 광고세트 |
| `platform-filter-dropdown-btn` | `data-filter` | 플랫폼 추이: 채널, 상품, 브랜드, 프로모션, 광고세트 |
| `deviceplatform-filter-dropdown-btn` | `data-filter` | 기기플랫폼 추이: 채널, 상품, 브랜드, 프로모션, 광고세트 |
| `device-filter-dropdown-btn` | `data-filter` | 기기 추이: 채널, 상품, 브랜드, 프로모션, 광고세트 |
| `pivot-filter-dropdown-btn` | `data-filter` | PIVOT: 채널, 상품, 브랜드, 프로모션, 광고세트 |

### 5. 성과 상세 분석 탭 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `detail-analysis-tab-btn` | `data-tab="detail-adset"` | 광고세트 상세 |
| `detail-analysis-tab-btn` | `data-tab="detail-gender"` | 성별 상세 |
| `detail-analysis-tab-btn` | `data-tab="detail-age"` | 연령 상세 |
| `detail-analysis-tab-btn` | `data-tab="detail-platform"` | 플랫폼 상세 |
| `detail-analysis-tab-btn` | `data-tab="detail-device-platform"` | 기기플랫폼 상세 |
| `detail-analysis-tab-btn` | `data-tab="detail-device-type"` | 기기 상세 |

#### 5.1 기간 비교 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `detail-compare-btn` | `data-tab="adset\|gender\|age\|platform\|device-platform\|device-type"` | 기간 비교 활성화 토글 |

#### 5.2 필터 드롭다운 버튼 (각 상세 탭)
| 클래스 패턴 | 필터 옵션 |
|------------|----------|
| `detail-filter-dropdown-btn` | 광고세트: 채널, 상품, 브랜드, 프로모션 |
| `detail-gender-filter-dropdown-btn` | 성별: 채널, 상품, 브랜드, 프로모션, 광고세트 |
| `detail-age-filter-dropdown-btn` | 연령: 채널, 상품, 브랜드, 프로모션, 광고세트 |
| `detail-platform-filter-dropdown-btn` | 플랫폼: 채널, 상품, 브랜드, 프로모션, 광고세트 |
| `detail-device-platform-filter-dropdown-btn` | 기기플랫폼: 채널, 상품, 브랜드, 프로모션, 광고세트 |
| `detail-device-type-filter-dropdown-btn` | 기기: 채널, 상품, 브랜드, 프로모션, 광고세트 |

### 6. 성과 분석 탭 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `performance-subtab` | `data-perf-tab="brand"` | 브랜드 분석 |
| `performance-subtab` | `data-perf-tab="product"` | 상품 분석 |
| `performance-subtab` | `data-perf-tab="promotion"` | 프로모션 분석 |
| `performance-subtab` | `data-perf-tab="targeting"` | 타겟팅 분석 |

#### 6.1 기간 비교 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `perf-compare-btn` | `data-category="brand\|product\|promotion\|targeting"` | 기간 비교 활성화 토글 |

### 7. 리타겟팅 분석 탭 버튼
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `retargeting-subtab` | `data-retarget-tab="ageGender"` | 성별/연령 분석 |
| `retargeting-subtab` | `data-retarget-tab="device"` | 기기별 분석 |
| `retargeting-subtab` | `data-retarget-tab="platform"` | 플랫폼별 분석 |
| `retargeting-subtab` | `data-retarget-tab="devicePlatform"` | 노출기기별 분석 |

### 8. 더보기/접기 버튼
| 클래스 | 용도 |
|--------|------|
| `show-more-btn` | AI 추천 더보기/접기 |
| `show-more-btn warning-style` | 경고 알림 더보기/접기 |
| `show-more-btn caution-style` | CPA 경고 더보기/접기 |

### 9. 아코디언 토글 (인라인 onclick)
| 위치 | 기능 |
|------|------|
| 성과 기회 탭 - TOP 광고세트 | 상세 보기 토글 |
| 타겟 분석 탭 - 기기플랫폼별/기기별/연령+성별 | 상세 보기 토글 |

---

## 전역 변수 및 상태 관리

### 데이터 변수
| 변수명 | 설명 | 로드 소스 |
|--------|------|----------|
| `insightsData` | 주요 인사이트 데이터 | type/insights.json |
| `dimensionData` | 차원 데이터 | type/merged_data.csv |
| `adsetDimensionData` | 광고세트 추이 데이터 | type/dimension_type1_campaign_adset.csv |
| `genderDimensionData` | 성별 추이 데이터 | type/dimension_type4_adset_gender.csv |
| `ageDimensionData` | 연령 추이 데이터 | type/dimension_type3_adset_age.csv |
| `platformDimensionData` | 플랫폼 추이 데이터 | type/dimension_type6_adset_platform.csv |
| `devicePlatformDimensionData` | 기기플랫폼 추이 데이터 | type/dimension_type7_adset_deviceplatform.csv |
| `deviceTypeDimensionData` | 기기유형 추이 데이터 | type/dimension_type5_adset_device.csv |
| `pivotDimensionData` | 성별연령 PIVOT 데이터 | type/dimension_type2_adset_age_gender.csv |

### 기간 필터 상태
| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `currentPeriod` | 현재 선택된 기간 | 'full' |
| 옵션 | 'full', '180d', '90d' | - |

---

## 핵심 함수 목록

### 초기화 함수
| 함수명 | 기능 |
|--------|------|
| `loadData()` | 모든 데이터 로딩 (JSON, CSV) |
| `initDashboard()` | 대시보드 전체 초기화 |
| `parseCSV()` | CSV 텍스트 파싱 |

### 렌더링 함수

#### 의사결정 도구 탭 렌더링
| 함수명 | 대상 |
|--------|------|
| `renderKPICards()` | 상단 KPI 카드 (9개) |
| `renderDecisionTools()` | 의사결정 도구 전체 분기 |
| `renderSummaryTab()` | 오늘의 요약 탭 |
| `renderOpportunityTab()` | 성과 기회 탭 |
| `renderWarningTab()` | 주의 필요 탭 |
| `renderTargetingTab()` | 타겟 분석 탭 |
| `renderForecastTab()` | AI 예측 탭 |
| `renderForecastSubtab()` | AI 예측 서브탭 (상품/성별연령/기기플랫폼/채널) |
| `renderRecommendationCard()` | AI 추천 카드 (개별) |
| `renderAlertCard()` | 경고 알림 카드 (개별) |
| `renderCpaCard()` | CPA 경고 카드 (개별) |

#### 계절성 분석 렌더링
| 함수명 | 대상 |
|--------|------|
| `renderQuarterlyTrendChart()` | 분기별 추이 차트 |
| `renderQuarterlyKpiCards()` | 분기별 KPI 카드 |
| `renderQuarterlySeasonalityInsight()` | 분기별 계절성 인사이트 |
| `renderQuarterlyTable()` | 분기별 테이블 |
| `renderSeasonalityTable()` | 요일별 전환 테이블 |
| `renderChannelDayKpiCards()` | 채널별 요일 KPI 카드 |
| `renderChannelDayRoasChart()` | 채널별 요일 ROAS 차트 |
| `renderChannelDayInsight()` | 채널별 요일 인사이트 |

#### 성과 추이 분석 렌더링
| 함수명 | 대상 |
|--------|------|
| `renderTimeseriesTrendChart()` | 광고세트 추이 차트 |
| `renderGenderTrendChart()` | 성별 추이 차트 |
| `renderAgeTrendChart()` | 연령 추이 차트 |
| `renderPlatformTrendChart()` | 플랫폼 추이 차트 |
| `renderDevicePlatformTrendChart()` | 기기플랫폼 추이 차트 |
| `renderDeviceTypeTrendChart()` | 기기유형 추이 차트 |
| `renderAgeGenderPivotTable()` | 성별연령 PIVOT 테이블 |

#### 성과 상세 분석 렌더링
| 함수명 | 대상 |
|--------|------|
| `renderDetailAdsetBarChart()` | 광고세트별 막대 차트 |
| `renderDetailGenderBarChart()` | 성별 막대 차트 |
| `renderDetailAgeBarChart()` | 연령별 막대 차트 |
| `renderDetailPlatformBarChart()` | 플랫폼별 막대 차트 |
| `renderDetailDevicePlatformBarChart()` | 기기플랫폼별 막대 차트 |
| `renderDetailDeviceTypeBarChart()` | 기기유형별 막대 차트 |
| `renderDetailBarChart()` | 공통 막대 차트 렌더러 |
| `renderDetailCompareBarChart()` | 기간 비교 막대 차트 |

#### 성과 분석 (브랜드/상품/프로모션/타겟팅)
| 함수명 | 대상 |
|--------|------|
| `renderAllPerformanceCharts()` | 전체 성과 차트 일괄 렌더링 |
| `renderBrandPerformanceChart()` | 브랜드 성과 차트 |
| `renderProductPerformanceChart()` | 상품 성과 차트 |
| `renderPromotionPerformanceChart()` | 프로모션 성과 차트 |
| `renderTargetingPerformanceChart()` | 타겟팅 성과 차트 |
| `renderPerformanceChart()` | 공통 성과 차트 렌더러 |

#### 리타겟팅 분석 렌더링
| 함수명 | 대상 |
|--------|------|
| `renderAgeGenderRetargetTable()` | 성별/연령 리타겟팅 테이블 |
| `renderDeviceRetargetTable()` | 기기별 리타겟팅 테이블 |
| `renderPlatformRetargetTable()` | 플랫폼별 리타겟팅 테이블 |
| `renderDevicePlatformRetargetTable()` | 노출기기별 리타겟팅 테이블 |

### 유틸리티 함수
| 함수명 | 기능 |
|--------|------|
| `getPeriodData()` | 현재 기간의 데이터 반환 |
| `getSeasonalityData()` | 계절성 데이터 반환 |
| `switchPeriod()` | 기간 전환 |
| `filterDataByDateRange()` | 날짜 범위로 데이터 필터링 |
| `calculateChangeRate()` | 변화율 계산 |
| `isValidGender()` | 유효한 성별 확인 |
| `isValidAge()` | 유효한 연령 확인 |
| `normalizeGender()` | 성별 정규화 |
| `formatCurrency()` | 통화 형식 변환 |
| `formatPercent()` | 퍼센트 형식 변환 |
| `formatNumber()` | 숫자 형식 변환 |

---

## 참조 데이터 파일 구조

### type/insights.json
```
{
  "by_period": {
    "full": { ... },
    "180d": { ... },
    "90d": { ... }
  },
  "seasonality": { ... }
}
```

각 기간별 데이터 구조:
- `summary`: 전체 요약 (overall_roas, overall_cpa, total_conversions 등)
- `summary_card`: AI 종합 진단 카드 메시지
- `top_recommendations`: AI 추천 사항 배열
- `top_categories`: 채널별 성과 배열
- `product_performance`: 상품별 성과 배열
- `gender_performance`: 성별 성과 배열
- `device_performance`: 기기별 성과 배열
- `deviceplatform_performance`: 기기플랫폼별 성과 배열
- `age_gender_combinations`: 연령×성별 조합 배열
- `top_adsets`: TOP 광고세트 배열
- `alerts`: 경고 알림 배열
- `retargeting_analysis`: 리타겟팅 분석 데이터
- `prophet_forecast`: Prophet 예측 데이터
- `timeseries`: 시계열 데이터

### CSV 파일 공통 컬럼
- `날짜`: 일별 데이터 기준
- `비용`: 광고비
- `노출`: 노출수
- `클릭`: 클릭수
- `전환수`: 전환 건수
- `전환값`: 전환 금액

---

## 차트 인스턴스
| 변수명 | 차트 종류 |
|--------|----------|
| `quarterlyTrendChartInstance` | 분기별 추이 (Bar + Line) |
| `timeseriesTrendChart` | 광고세트 추이 |
| `genderTrendChart` | 성별 추이 |
| `ageTrendChart` | 연령 추이 |
| `platformTrendChart` | 플랫폼 추이 |
| `devicePlatformTrendChart` | 기기플랫폼 추이 |
| `deviceTypeTrendChart` | 기기유형 추이 |
| `perfChartState.[category].chart` | 성과 분석 차트 (brand/product/promotion/targeting) |

---

## HTML/CSS 디자인 구조

### 1. CSS 변수 (Design Tokens) - 통합 필수

> **통합 시 필수**: 모든 HTML 파일에서 동일한 CSS 변수를 사용해야 일관된 디자인 유지

```css
:root {
    /* Berry Theme Colors - 메인 색상 */
    --primary-main: #673ab7;      /* 메인 보라색 - 강조, 버튼, 링크 */
    --primary-light: #ede7f6;     /* 연한 보라색 - 배경, hover */
    --primary-dark: #5e35b1;      /* 진한 보라색 - gradient, active */

    /* 보조 색상 */
    --secondary-main: #2196f3;    /* 파란색 - 차트, 보조 강조 */
    --secondary-light: #e3f2fd;

    /* 상태 색상 */
    --success-main: #00c853;      /* 녹색 - 양수, 성공, ROAS 상승 */
    --success-light: #b9f6ca;
    --warning-main: #ffab00;      /* 노란색 - 경고, CPM */
    --warning-light: #fff8e1;
    --error-main: #ff1744;        /* 빨간색 - 음수, 에러, ROAS 하락 */
    --error-light: #ffeaea;

    /* 그레이스케일 */
    --grey-50: #fafafa;           /* 카드 내부 배경 */
    --grey-100: #f5f5f5;          /* hover 배경 */
    --grey-200: #eeeeee;          /* 구분선 */
    --grey-300: #e0e0e0;          /* border */
    --grey-500: #9e9e9e;          /* 보조 텍스트 */
    --grey-600: #757575;          /* 보조 텍스트 (약간 진함) */
    --grey-700: #616161;          /* 본문 텍스트 */
    --grey-900: #212121;          /* 제목 텍스트 */

    /* 레이아웃 */
    --paper: #ffffff;             /* 카드 배경 */
    --background: #f8fafc;        /* 전체 배경 */
    --sidebar-bg: #ffffff;
    --sidebar-width: 260px;       /* 사이드바 고정 너비 */
}
```

---

### 2. 공통 컴포넌트 (Reusable Components)

#### 2.1 카드 컴포넌트 `.card`
> **통합 우선순위**: 높음 - 모든 페이지에서 사용

```css
.card {
    background: var(--paper);
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid var(--grey-200);
    margin-bottom: 24px;
}
.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
}
.card-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--grey-900);
}
.card-subtitle {
    font-size: 12px;
    color: var(--grey-500);
    margin-top: 4px;
}
```

---

#### 2.2 접기/펼치기 컴포넌트 `.collapsible-*`
> **통합 우선순위**: 높음 - 섹션 래퍼로 사용

```css
.collapsible-section {
    margin-bottom: 24px;
}
.collapsible-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    background: var(--paper);
    border-radius: 12px;
    cursor: pointer;
    user-select: none;
    transition: box-shadow 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid var(--grey-200);
}
.collapsible-header:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}
.collapsible-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 18px;
    font-weight: 600;
    color: var(--grey-900);
}
.collapsible-icon {
    font-size: 24px;
}
.collapsible-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--primary-light);
    color: var(--primary-main);
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
}
.collapsible-toggle:hover {
    background: var(--primary-main);
    color: white;
}
.collapsible-toggle-icon {
    transition: transform 0.2s ease;
    transform: rotate(180deg);
}
.collapsible-toggle-icon.collapsed {
    transform: rotate(0deg);
}
.collapsible-content {
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    padding: 0 24px;
    transition: max-height 0.3s ease, opacity 0.2s ease, padding 0.3s ease;
}
.collapsible-content.expanded {
    max-height: 5000px;
    opacity: 1;
    padding: 24px;
}
```

---

#### 2.3 인라인 토글 컴포넌트 `.inline-toggle`
> **통합 우선순위**: 높음 - 더보기/접기 토글

```css
.inline-toggle {
    padding: 10px 16px;
    background: var(--primary-light);
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid var(--grey-200);
    transition: all 0.2s ease;
    margin-top: 12px;
}
.inline-toggle:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    background: var(--primary-main);
}
.inline-toggle:hover .inline-toggle-label,
.inline-toggle:hover .inline-toggle-action {
    color: white;
}
.inline-toggle-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--primary-main);
    display: flex;
    align-items: center;
    gap: 6px;
}
.inline-toggle-badge {
    padding: 2px 8px;
    background: white;
    color: var(--primary-main);
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
}
.inline-toggle-action {
    font-size: 12px;
    color: var(--primary-main);
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 500;
}
.inline-toggle-content {
    display: none;
    padding: 12px 0;
    margin-top: 8px;
}
.inline-toggle-content.expanded {
    display: block;
}

/* 경고 스타일 (빨강) */
.inline-toggle.warning-style {
    background: linear-gradient(135deg, #ffebee 0%, #fff5f5 100%);
    border-color: #ffcdd2;
}
.inline-toggle.warning-style .inline-toggle-label { color: #d32f2f; }
.inline-toggle.warning-style .inline-toggle-badge { background: #ffcdd2; color: #c62828; }
.inline-toggle.warning-style .inline-toggle-action { color: #d32f2f; }
.inline-toggle.warning-style:hover { background: #ef5350; }

/* 주의 스타일 (주황) */
.inline-toggle.caution-style {
    background: linear-gradient(135deg, #fff3e0 0%, #fff8f0 100%);
    border-color: #ffe0b2;
}
.inline-toggle.caution-style .inline-toggle-label { color: #e65100; }
.inline-toggle.caution-style .inline-toggle-badge { background: #ffe0b2; color: #e65100; }
.inline-toggle.caution-style .inline-toggle-action { color: #e65100; }
.inline-toggle.caution-style:hover { background: #ff9800; }
```

---

#### 2.4 더보기 버튼 `.show-more-btn`
```css
.show-more-btn {
    padding: 8px 20px;
    background: var(--grey-100);
    color: var(--grey-700);
    border: 1px solid var(--grey-300);
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    font-size: 12px;
    font-family: inherit;
    transition: all 0.2s ease;
}
.show-more-btn:hover {
    background: var(--primary-light);
    color: var(--primary-main);
    border-color: var(--primary-main);
}
.show-more-btn.warning-style {
    background: #fff5f5;
    color: #d32f2f;
    border-color: #ffcdd2;
}
.show-more-btn.warning-style:hover {
    background: #ffebee;
    border-color: #ef5350;
}
.show-more-btn.caution-style {
    background: #fff8f0;
    color: #e65100;
    border-color: #ffe0b2;
}
.show-more-btn.caution-style:hover {
    background: #fff3e0;
    border-color: #ff9800;
}
```

---

#### 2.5 뷰 버튼 `.view-btn`
> **통합 우선순위**: 높음 - 탭 전환 버튼

```css
.view-type-section {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}
.view-btn {
    padding: 10px 20px;
    background: var(--grey-100);
    color: var(--grey-700);
    border: 1px solid var(--grey-300);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}
.view-btn:hover {
    background: var(--grey-200);
    border-color: var(--grey-400);
}
.view-btn.active {
    background: var(--primary-main);
    color: white;
    border-color: var(--primary-main);
}

/* 기간 필터 미적용 탭 */
.decision-tool-tab-btn.period-filter-disabled {
    background: #f5f5f5;
    border-color: #bdbdbd;
    border-style: dashed;
}
.decision-tool-tab-btn.period-filter-disabled:hover {
    background: #eeeeee;
    border-color: #9e9e9e;
}
.decision-tool-tab-btn.period-filter-disabled.active {
    background: #78909c;
    color: white;
    border-color: #78909c;
    border-style: solid;
}
```

---

#### 2.6 일반 탭 컴포넌트 `.tabs`, `.tab`
```css
.tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    border-bottom: 2px solid var(--grey-200);
}
.tab {
    padding: 12px 24px;
    background: none;
    border: none;
    color: var(--grey-600);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: all 0.2s;
}
.tab:hover {
    color: var(--primary-main);
}
.tab.active {
    color: var(--primary-main);
    border-bottom-color: var(--primary-main);
}
.tab-content {
    display: none;
}
.tab-content.active {
    display: block;
}

/* 의사결정 도구 탭 콘텐츠 */
.decision-tool-tab-content {
    display: none;
}
.decision-tool-tab-content.active {
    display: block;
}

/* 성과 추이 분석 탭 콘텐츠 */
.trend-analysis-tab-content {
    display: none;
}
.trend-analysis-tab-content.active {
    display: block;
}
```

---

#### 2.7 호버 가능한 카드 `.hoverable-card`
```css
.hoverable-card {
    cursor: pointer;
    transition: all 0.2s ease;
}
.hoverable-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

---

### 3. KPI 카드 컴포넌트

#### 3.1 KPI 래퍼 및 행 레이아웃
```css
.kpi-wrapper {
    margin-bottom: 24px;
}
.kpi-row {
    display: grid;
    gap: 16px;
    margin-bottom: 16px;
}
.kpi-row:last-child {
    margin-bottom: 0;
}
.kpi-row-primary {
    grid-template-columns: repeat(5, 1fr);
}
.kpi-row-secondary {
    grid-template-columns: repeat(4, 1fr);
}
```

#### 3.2 KPI 카드 스타일
```css
.kpi-card {
    padding: 20px;
    position: relative;
    overflow: hidden;
    border-radius: 16px;
    background: linear-gradient(135deg, var(--paper) 0%, var(--grey-50) 100%);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.kpi-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    border-radius: 16px 0 0 16px;
}
.kpi-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
}
.kpi-card h3 {
    font-size: 11px;
    font-weight: 600;
    color: var(--grey-500);
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
}
.kpi-card .value {
    font-size: 28px;
    font-weight: 700;
    color: var(--grey-900);
    line-height: 1.1;
    margin-bottom: 4px;
}
.kpi-card .unit {
    font-size: 11px;
    color: var(--grey-500);
    font-weight: 500;
}
```

#### 3.3 KPI 카드 색상 (좌측 바)
```css
/* Primary KPIs 색상 */
.kpi-row-primary .kpi-card:nth-child(1)::before { background: linear-gradient(180deg, #673ab7 0%, #9c27b0 100%); } /* 총 비용 */
.kpi-row-primary .kpi-card:nth-child(2)::before { background: linear-gradient(180deg, #ffab00 0%, #ff8f00 100%); } /* CPM */
.kpi-row-primary .kpi-card:nth-child(3)::before { background: linear-gradient(180deg, #2196f3 0%, #1976d2 100%); } /* CPC */
.kpi-row-primary .kpi-card:nth-child(4)::before { background: linear-gradient(180deg, #ff9800 0%, #f57c00 100%); } /* CPA */
.kpi-row-primary .kpi-card:nth-child(5)::before { background: linear-gradient(180deg, #00c853 0%, #00a152 100%); } /* ROAS */

/* Secondary KPIs 색상 */
.kpi-row-secondary .kpi-card:nth-child(1)::before { background: linear-gradient(180deg, #00bcd4 0%, #0097a7 100%); } /* 총 노출 */
.kpi-row-secondary .kpi-card:nth-child(2)::before { background: linear-gradient(180deg, #e91e63 0%, #c2185b 100%); } /* 총 클릭 */
.kpi-row-secondary .kpi-card:nth-child(3)::before { background: linear-gradient(180deg, #4caf50 0%, #388e3c 100%); } /* 총 전환수 */
.kpi-row-secondary .kpi-card:nth-child(4)::before { background: linear-gradient(180deg, #9c27b0 0%, #7b1fa2 100%); } /* 총 전환값 */
```

---

### 4. 인사이트 카드 컴포넌트

```css
.insights-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}
.insight-card {
    padding: 16px;
    border-radius: 8px;
    border-left: 4px solid;
}
.insight-card.high {
    background: var(--error-light);
    border-left-color: var(--error-main);
}
.insight-card.medium {
    background: var(--warning-light);
    border-left-color: var(--warning-main);
}
.insight-card.low {
    background: var(--success-light);
    border-left-color: var(--success-main);
}
.insight-card.opportunity {
    background: var(--secondary-light);
    border-left-color: var(--secondary-main);
}
.insight-type {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    color: var(--grey-600);
}
.insight-message {
    font-size: 14px;
    color: var(--grey-900);
    font-weight: 500;
    margin-bottom: 8px;
}
.insight-value {
    font-size: 12px;
    color: var(--grey-600);
}
```

---

### 5. 테이블 컴포넌트

#### 5.1 기본 테이블
```css
.data-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 16px;
}
.data-table th {
    text-align: left;
    padding: 12px;
    font-size: 12px;
    font-weight: 600;
    color: var(--grey-600);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid var(--grey-200);
    background: var(--grey-50);
}
.data-table td {
    padding: 12px;
    font-size: 14px;
    color: var(--grey-900);
    border-bottom: 1px solid var(--grey-200);
}
.data-table tr:hover {
    background: var(--grey-50);
}
```

#### 5.2 정렬 가능 헤더
```css
.sortable-header {
    cursor: pointer;
    user-select: none;
    position: relative;
    padding-right: 24px !important;
    transition: background 0.2s ease;
}
.sortable-header:hover {
    background: var(--grey-100);
}
.sort-icon {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 2px;
    opacity: 0.3;
    transition: opacity 0.2s ease;
}
.sortable-header:hover .sort-icon {
    opacity: 0.6;
}
.sort-icon.active {
    opacity: 1;
}
.sort-arrow {
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
}
.sort-arrow.up {
    border-bottom: 4px solid var(--grey-600);
}
.sort-arrow.down {
    border-top: 4px solid var(--grey-600);
}
.sort-arrow.active {
    border-bottom-color: var(--primary-main);
    border-top-color: var(--primary-main);
}
```

---

### 6. Badge 컴포넌트

```css
.badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.badge.high {
    background: var(--error-light);
    color: var(--error-main);
}
.badge.medium {
    background: var(--warning-light);
    color: var(--warning-main);
}
.badge.low {
    background: var(--success-light);
    color: var(--success-main);
}
```

---

### 7. 페이지 고유 컴포넌트 (type_dashboard 전용)

#### 7.1 스토리 기반 인트로 카드
> **인라인 스타일**: 재사용성 낮음, 복사하여 사용

```html
<div style="margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; color: white;">
    <div style="display: flex; align-items: flex-start; gap: 16px;">
        <div style="font-size: 40px; line-height: 1;">📊</div>
        <div style="flex: 1;">
            <div style="font-size: 16px; font-weight: 700; margin-bottom: 6px;">오늘의 광고 성과, 한눈에 파악하세요</div>
            <div style="font-size: 13px; opacity: 0.9; line-height: 1.6;">
                복잡한 데이터를 쉽게 확인할 수 있도록 정리했어요. <strong>AI 예측</strong>은 분석한 데이터를 토대로 <strong>30일 이후</strong>의 데이터를 예측해요.
            </div>
        </div>
    </div>
</div>
```

---

#### 7.2 기간 필터 버튼 `.period-filter-btn`
> **인라인 스타일 + 클래스**: JavaScript로 active 상태 토글

```html
<div style="margin-bottom: 12px; padding: 12px 16px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 10px; border: 1px solid #dee2e6;">
    <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
        <span style="font-size: 12px; font-weight: 600; color: #495057;">📅 분석 기간:</span>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button class="period-filter-btn active" data-period="full" onclick="switchPeriod('full')"
                    style="padding: 6px 14px; font-size: 11px; font-weight: 600; border: 1px solid #1a73e8; border-radius: 20px; cursor: pointer; transition: all 0.2s; background: #1a73e8; color: white;">
                전체 기간
            </button>
            <button class="period-filter-btn" data-period="180d" onclick="switchPeriod('180d')"
                    style="padding: 6px 14px; font-size: 11px; font-weight: 600; border: 1px solid #dee2e6; border-radius: 20px; cursor: pointer; transition: all 0.2s; background: white; color: #495057;">
                최근 180일
            </button>
            <button class="period-filter-btn" data-period="90d" onclick="switchPeriod('90d')"
                    style="padding: 6px 14px; font-size: 11px; font-weight: 600; border: 1px solid #dee2e6; border-radius: 20px; cursor: pointer; transition: all 0.2s; background: white; color: #495057;">
                최근 90일
            </button>
        </div>
        <span id="periodDateRange" style="font-size: 11px; color: #6c757d; margin-left: auto;"></span>
    </div>
</div>
```

**JavaScript 토글 로직**:
```javascript
function switchPeriod(period) {
    currentPeriod = period;
    // 버튼 스타일 업데이트
    document.querySelectorAll('.period-filter-btn').forEach(btn => {
        if (btn.dataset.period === period) {
            btn.classList.add('active');
            btn.style.background = '#1a73e8';
            btn.style.color = 'white';
            btn.style.borderColor = '#1a73e8';
        } else {
            btn.classList.remove('active');
            btn.style.background = 'white';
            btn.style.color = '#495057';
            btn.style.borderColor = '#dee2e6';
        }
    });
    // 데이터 새로고침
    renderDecisionTools();
}
```

---

#### 7.3 계절성 분석 서브탭 `.day-analysis-subtab`
> **인라인 스타일**: 기간 필터 미적용 탭 전용

```html
<!-- 전체 기간 안내 배너 -->
<div style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: linear-gradient(135deg, #eceff1 0%, #cfd8dc 100%); border-bottom: 1px solid #b0bec5;">
    <span style="font-size: 14px;">🔒</span>
    <span style="font-size: 11px; color: #546e7a; font-weight: 500;">
        이 탭은 <strong style="color: #37474f;">전체 기간</strong> 데이터를 사용합니다.
    </span>
</div>

<!-- 서브탭 버튼 -->
<div style="display: flex; flex-wrap: wrap; gap: 8px; padding: 16px; background: #f8f9fa; border-bottom: 1px solid #e9ecef;">
    <button class="day-analysis-subtab active" data-day-tab="quarterlyTrend"
            style="padding: 8px 16px; font-size: 12px; font-weight: 600; border: none; border-radius: 20px; cursor: pointer; transition: all 0.2s; background: #78909c; color: white;">
        📈 분기별 추이
    </button>
    <button class="day-analysis-subtab" data-day-tab="dayConversion"
            style="padding: 8px 16px; font-size: 12px; font-weight: 600; border: 1px solid #b0bec5; border-radius: 20px; cursor: pointer; transition: all 0.2s; background: white; color: #546e7a;">
        📅 요일별 전환
    </button>
    <button class="day-analysis-subtab" data-day-tab="channelDay"
            style="padding: 8px 16px; font-size: 12px; font-weight: 600; border: 1px solid #b0bec5; border-radius: 20px; cursor: pointer; transition: all 0.2s; background: white; color: #546e7a;">
        📊 채널별 요일
    </button>
</div>
```

**서브탭 active 스타일**:
```css
/* active 상태 */
background: #78909c;
color: white;
border: none;

/* 비활성 상태 */
background: white;
color: #546e7a;
border: 1px solid #b0bec5;
```

---

#### 7.4 분기별 KPI 카드 (계절성 분석)
```html
<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 16px 20px; background: #fafafa;">
    <div id="quarterlyKpiCards" style="display: contents;"></div>
</div>
```

**JavaScript로 생성되는 KPI 카드 구조**:
```javascript
// renderQuarterlyKpiCards() 함수에서 생성
`<div style="background: white; border-radius: 10px; padding: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
    <div style="font-size: 10px; font-weight: 600; color: #78909c; margin-bottom: 6px; text-transform: uppercase;">
        ${label}
    </div>
    <div style="font-size: 20px; font-weight: 700; color: #37474f;">
        ${value}
    </div>
</div>`
```

---

#### 7.5 계절성 인사이트 텍스트 영역
```html
<div style="padding: 20px 24px; background: linear-gradient(135deg, #e3f2fd 0%, #f5faff 100%); border-bottom: 1px solid #e9ecef;">
    <div style="font-size: 14px; color: #1565c0; font-weight: 600; margin-bottom: 12px;">📊 계절성 분석 인사이트</div>
    <div style="font-size: 13px; color: #424242; line-height: 1.8;" id="quarterlySeasonalityInsightText">로딩 중...</div>
</div>
```

---

#### 7.6 탭 버튼 범례 (Legend)
```html
<div style="margin-left: auto; display: flex; align-items: center; gap: 12px; font-size: 10px; color: #6c757d;">
    <span style="display: flex; align-items: center; gap: 4px;">
        <span style="width: 8px; height: 8px; background: #1a73e8; border-radius: 2px;"></span>
        기간 필터 적용
    </span>
    <span style="display: flex; align-items: center; gap: 4px;">
        <span style="width: 8px; height: 8px; background: #78909c; border-radius: 2px;"></span>
        전체 기간 고정
    </span>
</div>
```

---

#### 7.7 AI 컨설턴트 종합 진단 카드 (동적 생성)
> **생성 함수**: `renderSummaryTab()` 내에서 `summaryCard` 데이터로 생성

```html
<div style="margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; color: white; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
    <div style="display: flex; align-items: flex-start; gap: 16px;">
        <div style="font-size: 48px; line-height: 1;">🤖</div>
        <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 18px; font-weight: 700;">${summaryCard.title}</span>
                <span style="font-size: 11px; background: rgba(255,255,255,0.25); padding: 3px 10px; border-radius: 12px; margin-left: auto;">${currentPeriodLabel} 기준</span>
            </div>
            <!-- KPI 배지들 -->
            <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
                <div style="padding: 6px 14px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 13px; font-weight: 600;">
                    ${summaryCard.total_roas_formatted}
                </div>
                <div style="padding: 6px 14px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 13px; font-weight: 600;">
                    매출 ${summaryCard.total_revenue_formatted}
                </div>
                <div style="padding: 6px 14px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 13px; font-weight: 600;">
                    비용 ${summaryCard.total_cost_formatted}
                </div>
            </div>
            <!-- 메시지 -->
            <div style="font-size: 14px; opacity: 0.95; line-height: 1.7; padding: 12px; background: rgba(255,255,255,0.15); border-radius: 10px;">
                ${summaryCard.message}
            </div>
        </div>
    </div>
</div>
```

---

#### 7.8 핵심 지표 대시보드 카드 (동적 생성)
> **생성 함수**: `renderSummaryTab()` 내 hoverable-card로 생성

```html
<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
    <div class="hoverable-card"
         data-tooltip-title="ROAS (광고수익률)"
         data-tooltip-icon="📈"
         data-tooltip-insight="광고비 대비 매출 비율입니다."
         data-tooltip-recommendation="ROAS 100% 이상이면 수익 발생, 200% 이상이면 효율적인 광고입니다."
         style="padding: 16px; background: ${status.bg}; border-radius: 12px; border: 1px solid ${status.color}20;">
        <div style="font-size: 11px; color: var(--grey-600); margin-bottom: 4px;">ROAS</div>
        <div style="font-size: 24px; font-weight: 800; color: ${status.color};">${formatPercent(avgRoas)}</div>
        <div style="display: flex; align-items: center; gap: 4px; margin-top: 8px;">
            <span style="font-size: 18px;">${status.icon}</span>
            <span style="font-size: 11px; font-weight: 600; color: ${status.color};">${status.text}</span>
        </div>
    </div>
    <!-- CPA, 전환수, 매출 카드도 동일 구조 -->
</div>
```

**상태별 색상 설정**:
```javascript
const statusConfig = {
    excellent: { text: '매우 좋음', color: '#00c853', bg: '#e8f5e9', icon: '🎉' },
    good: { text: '양호', color: '#2e7d32', bg: '#e8f5e9', icon: '👍' },
    normal: { text: '보통', color: '#f57c00', bg: '#fff3e0', icon: '📊' },
    warning: { text: '개선 필요', color: '#d32f2f', bg: '#ffebee', icon: '⚠️' }
};
```

---

#### 7.9 AI 추천 카드 (동적 생성)
> **생성 함수**: `renderRecommendationCard(rec, idx)`

```html
<div style="padding: 16px; background: white; border-radius: 12px; border: 1px solid #e0e0e0; margin-bottom: 12px;">
    <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 14px; flex-shrink: 0;">
            ${idx + 1}
        </div>
        <div style="flex: 1;">
            <div style="font-size: 14px; font-weight: 600; color: #212121; margin-bottom: 6px;">
                ${rec.title}
            </div>
            <div style="font-size: 13px; color: #616161; line-height: 1.6;">
                ${rec.description}
            </div>
            <!-- 우선순위 배지 -->
            <div style="margin-top: 10px;">
                <span style="padding: 4px 10px; background: ${priorityBg}; color: ${priorityColor}; border-radius: 12px; font-size: 11px; font-weight: 600;">
                    ${priorityLabel}
                </span>
            </div>
        </div>
    </div>
</div>
```

---

#### 7.10 경고 알림 카드 (동적 생성)
> **생성 함수**: `renderAlertCard(alert)`

```html
<div style="padding: 16px; background: linear-gradient(135deg, #fff5f5 0%, #ffebee 100%); border-radius: 12px; border-left: 4px solid #ef5350; margin-bottom: 12px;">
    <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="font-size: 24px;">⚠️</div>
        <div style="flex: 1;">
            <div style="font-size: 14px; font-weight: 600; color: #c62828; margin-bottom: 6px;">
                ${alert.title}
            </div>
            <div style="font-size: 13px; color: #616161; line-height: 1.6; margin-bottom: 10px;">
                ${alert.description}
            </div>
            <!-- Financial Impact -->
            <div style="padding: 10px; background: rgba(239, 83, 80, 0.1); border-radius: 8px; margin-bottom: 10px;">
                <div style="font-size: 11px; color: #c62828; font-weight: 600; margin-bottom: 4px;">💰 Financial Impact</div>
                <div style="font-size: 13px; color: #424242;">${alert.financial_impact}</div>
            </div>
            <!-- Action 가이드 -->
            <div style="padding: 10px; background: rgba(76, 175, 80, 0.1); border-radius: 8px;">
                <div style="font-size: 11px; color: #2e7d32; font-weight: 600; margin-bottom: 4px;">✅ Action</div>
                <div style="font-size: 13px; color: #424242;">${alert.action}</div>
            </div>
        </div>
    </div>
</div>
```

---

### 8. Tooltip 컴포넌트

#### 8.1 기본 Tooltip
```css
.tooltip {
    position: absolute;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 13px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    max-width: 300px;
}
.tooltip.show { opacity: 1; }
.tooltip-title {
    font-weight: 600;
    margin-bottom: 6px;
    font-size: 14px;
}
.tooltip-content {
    font-size: 12px;
    line-height: 1.6;
}
.tooltip-value {
    font-weight: 600;
    color: var(--success-light);
}
```

#### 8.2 카드 호버 Tooltip
```css
.card-hover-tooltip {
    position: fixed;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
    z-index: 10001;
    max-width: 320px;
    min-width: 240px;
    display: none;
    pointer-events: none;
    border: 2px solid var(--primary-main);
    overflow: hidden;
}
.card-hover-tooltip.show { display: block; }
.card-tooltip-header {
    padding: 12px 16px;
    background: linear-gradient(135deg, var(--primary-light) 0%, #e8f5e9 100%);
    border-bottom: 1px solid var(--grey-200);
    display: flex;
    align-items: center;
    gap: 8px;
}
.card-tooltip-header-icon { font-size: 18px; }
.card-tooltip-header-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--primary-main);
}
.card-tooltip-insight {
    padding: 12px 16px;
    background: linear-gradient(135deg, #fff9e6 0%, #fffbf0 100%);
    border-bottom: 1px solid #ffd54f;
}
.card-tooltip-insight-label {
    font-size: 10px;
    font-weight: 600;
    color: #f57c00;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
}
.card-tooltip-insight-text {
    font-size: 12px;
    color: var(--grey-800);
    line-height: 1.6;
}
.card-tooltip-recommendation {
    padding: 12px 16px;
    background: white;
}
.card-tooltip-recommendation-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--primary-main);
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
}
.card-tooltip-recommendation-text {
    font-size: 12px;
    color: var(--grey-700);
    line-height: 1.6;
}
```

---

### 9. 로딩 상태 컴포넌트

```css
.loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    color: var(--grey-500);
}
.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--grey-200);
    border-top-color: var(--primary-main);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}
@keyframes spin {
    to { transform: rotate(360deg); }
}
```

---

### 10. 레이아웃 구조

#### 10.1 전체 레이아웃
```
┌─────────────────────────────────────────────────────────┐
│ .app-wrapper (display: flex)                            │
│ ┌──────────┬────────────────────────────────────────────┤
│ │ .sidebar │ .main-content                              │
│ │ (fixed)  │ (margin-left: 260px, max-width: 1600px)   │
│ │          │                                            │
│ └──────────┴────────────────────────────────────────────┘
```

#### 10.2 레이아웃 CSS
```css
.app-wrapper {
    display: flex;
    min-height: 100vh;
}
.main-content {
    flex: 1;
    margin-left: var(--sidebar-width);
    padding: 24px;
    max-width: 1600px;
    margin-right: auto;
}
```

#### 10.3 사이드바 CSS
```css
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
.sidebar-header {
    padding: 24px 20px;
    border-bottom: 1px solid var(--grey-200);
}
.sidebar-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
}
.sidebar-logo-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--primary-main) 0%, var(--primary-dark) 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.sidebar-logo-icon svg {
    width: 24px;
    height: 24px;
    stroke: white;
    fill: none;
    stroke-width: 2;
}
.sidebar-logo-text {
    display: flex;
    flex-direction: column;
}
.sidebar-logo-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--grey-900);
    line-height: 1;
}
.sidebar-logo-subtitle {
    font-size: 11px;
    color: var(--grey-500);
    margin-top: 4px;
}

/* 스크롤 영역 */
.simplebar-content-wrapper {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
}
.simplebar-content-wrapper::-webkit-scrollbar { width: 6px; }
.simplebar-content-wrapper::-webkit-scrollbar-track { background: transparent; }
.simplebar-content-wrapper::-webkit-scrollbar-thumb {
    background: var(--grey-300);
    border-radius: 3px;
}
.sidebar-content {
    padding: 16px 12px;
}

/* 네비게이션 */
.nav-group {
    margin-bottom: 16px;
}
.nav-group-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--grey-500);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 0 8px;
    margin-bottom: 4px;
}
.nav-item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    color: var(--grey-700);
    text-decoration: none;
    transition: all 0.2s;
    cursor: pointer;
    border-radius: 8px;
    margin-bottom: 2px;
}
.nav-item:hover {
    background-color: var(--grey-100);
    color: var(--primary-main);
}
.nav-item.active {
    background-color: var(--primary-light);
    color: var(--primary-main);
    font-weight: 500;
}
.nav-item-icon {
    width: 20px;
    height: 20px;
    margin-right: 10px;
}
.nav-item-icon svg {
    width: 100%;
    height: 100%;
    fill: currentColor;
}
.nav-item-text {
    font-size: 14px;
}

/* 네비게이션 섹션 (대안 스타일) */
.nav-section {
    margin-bottom: 24px;
}
.nav-section-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--grey-500);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 0 12px;
    margin-bottom: 8px;
}
```

#### 10.4 대시보드 헤더
```css
.dashboard-header {
    margin-bottom: 32px;
}
.dashboard-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--grey-900);
    margin-bottom: 8px;
}
.dashboard-subtitle {
    font-size: 14px;
    color: var(--grey-600);
}
```

---

### 11. 그리드 유틸리티

```css
.grid-2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
}
.grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
}
```

---

### 12. 차트 컨테이너

```css
.chart-container {
    position: relative;
    height: 400px;
    margin-top: 20px;
}
.chart-container.small {
    height: 300px;
}
```

---

### 13. 반응형 브레이크포인트

| 브레이크포인트 | 적용 대상 | 변경 사항 |
|---------------|----------|----------|
| `1400px` | `.grid-3` | 3열 → 2열 |
| `1400px` | `.kpi-row-primary` | 5열 → 3열 |
| `1400px` | `.kpi-row-secondary` | 4열 → 2열 |
| `1024px` | `.sidebar` | `transform: translateX(-100%)` (숨김) |
| `1024px` | `.main-content` | `margin-left: 0` |
| `1024px` | `.grid-2`, `.grid-3` | 1열 |
| `768px` | `.main-content` | `padding: 16px` |
| `768px` | `.kpi-row-primary`, `.kpi-row-secondary` | 2열 |
| `768px` | `.insights-grid` | 1열 |
| `768px` | `.kpi-card .value` | `font-size: 24px` |
| `480px` | `.kpi-row-primary`, `.kpi-row-secondary` | 1열 |

---

### 14. 통합 시 주의사항

#### 14.1 CSS 변수 의존성
- 모든 색상은 CSS 변수 사용 필수
- 변수 미정의 시 fallback 없음 → 스타일 깨짐

#### 14.2 z-index 계층
| 요소 | z-index |
|------|---------|
| `.sidebar` | 1000 |
| `.tooltip` | 10000 |
| `.card-hover-tooltip` | 10001 |

#### 14.3 공통 스타일 우선 적용
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

#### 14.4 외부 라이브러리 의존성
```html
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2"></script>
<!-- D3.js -->
<script src="https://d3js.org/d3.v7.min.js"></script>
```

#### 14.5 컴포넌트 분리 권장 순서
1. **CSS 변수** → 별도 파일 또는 공통 head
2. **공통 컴포넌트** (card, collapsible, view-btn, tabs, table)
3. **레이아웃** (sidebar, main-content)
4. **페이지 고유 컴포넌트** (KPI 카드, 인사이트 카드)

---

## 변경 이력

| 날짜 | 작업 내용 |
|------|----------|
| 2025-12-05 | 문서 최초 작성 - type_dashboard.html 섹션별 기능 분석 |
| 2025-12-05 | `dailyData` 변수 삭제 (미사용 Dead Code 제거) - Line 4683 |
| 2025-12-05 | 버튼 UI 컴포넌트 섹션 추가 - 9개 카테고리 버튼 정리 |
| 2025-12-05 | Dead Code 함수 9개 삭제: `generateBrandInsight`, `generateProductInsight`, `generatePromotionInsight`, `generateTargetingInsight`, `renderBrandDetailTable`, `renderProductDetailTable`, `renderPromotionDetailTable`, `renderTopAdsetsTable`, `renderAgeGenderTable` |
| 2025-12-05 | 클래스 네이밍 정규화: `device-platform-period-btn` → `deviceplatform-period-btn`, `device-type-period-btn` → `device-period-btn` |
| 2025-12-05 | 접두사 보충: `filter-dropdown-btn` → `timeseries-filter-dropdown-btn` (광고세트 추이 탭) |
| 2025-12-08 | HTML/CSS 디자인 구조 섹션 추가: CSS 변수, 공통 컴포넌트, KPI 카드, 인사이트 카드, 테이블, Badge, Tooltip, 로딩 상태 |
| 2025-12-08 | 레이아웃 구조 추가: app-wrapper, sidebar, main-content, dashboard-header |
| 2025-12-08 | 반응형 브레이크포인트 문서화: 1400px, 1024px, 768px, 480px |
| 2025-12-08 | 통합 시 주의사항 추가: CSS 변수 의존성, z-index 계층, 외부 라이브러리 의존성 |
| 2025-12-08 | 누락 CSS 보완: `.decision-tool-tab-content`, `.trend-analysis-tab-content`, `.hoverable-card`, `.nav-section`, `.nav-section-title` |
| 2025-12-08 | 페이지 고유 컴포넌트 섹션 추가: 스토리 인트로 카드, 기간 필터 버튼, 계절성 분석 서브탭, 분기별 KPI 카드, 인사이트 텍스트, 범례 |
| 2025-12-08 | 렌더링 함수 목록 대폭 보완: 6개 카테고리 (의사결정/계절성/성과추이/성과상세/성과분석/리타겟팅) 50+ 함수 문서화 |
| 2025-12-08 | 동적 생성 HTML 구조 추가: AI 종합진단 카드, 핵심지표 카드, AI 추천 카드, 경고 알림 카드 (7.7~7.10) |
| 2025-12-08 | 목차 추가: 기능 분석 (8개 섹션), HTML/CSS 디자인 구조 (14개 섹션), 부록 |
| 2025-12-08 | 섹션 번호 중복 수정: "8. 로딩 상태 컴포넌트" → "9. 로딩 상태 컴포넌트", 이후 섹션 번호 재정렬 (9~13 → 10~14) |
