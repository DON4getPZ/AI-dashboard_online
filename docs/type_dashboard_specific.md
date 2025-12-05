# type_dashboard.html 기능 분석 문서

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
| 함수명 | 대상 |
|--------|------|
| `renderKPICards()` | KPI 카드 |
| `renderDecisionTools()` | 의사결정 도구 전체 |
| `renderSummaryTab()` | 오늘의 요약 탭 |
| `renderOpportunityTab()` | 성과 기회 탭 |
| `renderWarningTab()` | 주의 필요 탭 |
| `renderTargetingTab()` | 타겟 분석 탭 |
| `renderForecastTab()` | AI 예측 탭 |
| `renderBudgetGuideTab()` | 예산 투자 가이드 |
| `renderQuarterlyTrendChart()` | 분기별 추이 차트 |
| `renderBrandPerformanceChart()` | 브랜드 성과 차트 |
| `renderProductPerformanceChart()` | 상품 성과 차트 |
| `renderPromotionPerformanceChart()` | 프로모션 성과 차트 |
| `renderTargetingPerformanceChart()` | 타겟팅 성과 차트 |

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

## 변경 이력

| 날짜 | 작업 내용 |
|------|----------|
| 2025-12-05 | 문서 최초 작성 - type_dashboard.html 섹션별 기능 분석 |
| 2025-12-05 | `dailyData` 변수 삭제 (미사용 Dead Code 제거) - Line 4683 |
| 2025-12-05 | 버튼 UI 컴포넌트 섹션 추가 - 9개 카테고리 버튼 정리 |
| 2025-12-05 | Dead Code 함수 9개 삭제: `generateBrandInsight`, `generateProductInsight`, `generatePromotionInsight`, `generateTargetingInsight`, `renderBrandDetailTable`, `renderProductDetailTable`, `renderPromotionDetailTable`, `renderTopAdsetsTable`, `renderAgeGenderTable` |
| 2025-12-05 | 클래스 네이밍 정규화: `device-platform-period-btn` → `deviceplatform-period-btn`, `device-type-period-btn` → `device-period-btn` |
| 2025-12-05 | 접두사 보충: `filter-dropdown-btn` → `timeseries-filter-dropdown-btn` (광고세트 추이 탭) |
