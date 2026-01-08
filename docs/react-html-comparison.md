# React vs HTML 대조 비교 문서

## 개요
각 대시보드의 React 구현과 원본 HTML 파일 간의 변수명, 함수명, 참조영역 비교 결과입니다.

### 상태 표기 범례
- ✅ **동일**: 함수명/변수명이 완전히 동일
- ⚠️ **구현방식 다름**: 로직은 동일하나 React 패러다임(useMemo, useState 등)으로 구현
- ❌ **불일치**: 로직 또는 구조가 다름

---

## 1. 광고 성과 대시보드

| 구분 | 파일 경로 |
|------|----------|
| **React** | `src/app/ReactView.tsx` |
| **HTML** | `public/marketing_dashboard_v3.html` |

### 1.1 전역 변수/State 비교

| HTML 변수명 | React 변수명 | 상태 |
|-------------|--------------|------|
| `allData` | `allData` (useState) | ✅ 동일 |
| `currentView` | `currentView` (useState) | ✅ 동일 |
| `showDataLabels` | `showDataLabels` (useState) | ✅ 동일 |
| `filters` | `filters` (useState) | ✅ 동일 |
| `trendChart` | `trendChart` (useRef) | ✅ 동일 |
| `currentChartData` | `currentChartData` (useMemo) | ✅ 동일 |
| `TABLE_ROW_LIMIT` | `TABLE_ROW_LIMIT` | ✅ 동일 |
| `isTableExpanded` | `isTableExpanded` (useState) | ✅ 동일 |

### 1.2 필터 필드명 비교

| HTML 필드 | React 필드 | 상태 |
|-----------|------------|------|
| `filters.type` | `filters.type` | ✅ 동일 |
| `filters.brand` | `filters.brand` | ✅ 동일 |
| `filters.product` | `filters.product` | ✅ 동일 |
| `filters.promotion` | `filters.promotion` | ✅ 동일 |
| `filters.campaign` | `filters.campaign` | ✅ 동일 |
| `filters.setName` | `filters.setName` | ✅ 동일 |
| `filters.startDate` | `filters.startDate` | ✅ 동일 |
| `filters.endDate` | `filters.endDate` | ✅ 동일 |

### 1.3 함수명 비교

| HTML 함수명 | React 함수명/구현 | 상태 | 비고 |
|-------------|-------------------|------|------|
| `parseCSV(text)` | `parseCSV(text)` | ✅ 동일 | |
| `loadData()` | `loadData()` (useEffect 내) | ✅ 동일 | |
| `populateFilters()` | `typeOptions` (useMemo) | ⚠️ 구현방식 다름 | 초기화 시점 다름 |
| `updateBrandFilter()` | `updateBrandFilter` (useMemo) | ✅ 동일 | |
| `updateProductFilter()` | `updateProductFilter` (useMemo) | ✅ 동일 | |
| `updatePromotionFilter()` | `updatePromotionFilter` (useMemo) | ✅ 동일 | |
| `updateDetailFilters()` | `campaignOptions` (useMemo) | ⚠️ 구현방식 다름 | |
| `updateSetNameFilter()` | `updateSetNameFilter` (useMemo) | ✅ 동일 | |
| `resetBasicFilters()` | `resetBasicFilters` (useCallback) | ✅ 동일 | |
| `resetDetailFilters()` | `resetDetailFilters` (useCallback) | ✅ 동일 | |
| `setDateRange()` | `useEffect` 내 날짜 설정 | ⚠️ 구현방식 다름 | |
| `formatDateForInput(date)` | `formatDateForInput(date)` | ✅ 동일 | |
| `filterData()` | `filterData` (useMemo) | ✅ 동일 | |
| `aggregateData(data)` | `aggregateData` (useMemo) | ✅ 동일 | |
| `updateChart(data)` | `currentChartData` (useMemo) | ✅ 동일 | |
| `formatNumber(num)` | `formatNumber(num)` | ✅ 동일 | |
| `formatROAS(num)` | `formatROAS(num)` | ✅ 동일 | |

### 1.4 데이터 집계 키 비교

| 뷰 타입 | HTML groupKey | React groupKey | 상태 |
|---------|---------------|----------------|------|
| daily | `'일 구분'` | `'일 구분'` | ✅ 동일 |
| weekly | `'주 구분'` | `'주 구분'` | ✅ 동일 |
| monthly | `'월 구분'` | `'월 구분'` | ✅ 동일 |

### 1.5 차트 토글 비교

| HTML 변수 | React 변수 | 상태 |
|-----------|------------|------|
| `chartCost` | `chartToggles.cost` | ⚠️ 구현방식 다름 |
| `chartCPM` | `chartToggles.cpm` | ⚠️ 구현방식 다름 |
| `chartCPC` | `chartToggles.cpc` | ⚠️ 구현방식 다름 |
| `chartCPA` | `chartToggles.cpa` | ⚠️ 구현방식 다름 |
| `chartROAS` | `chartToggles.roas` | ⚠️ 구현방식 다름 |

### 1.6 데이터 경로 비교

| HTML 경로 | React 경로 | 상태 |
|-----------|------------|------|
| `raw/raw_data.csv` | `/raw/raw_data.csv` | ✅ 동일 |

---

## 2. 소재별 대시보드

| 구분 | 파일 경로 |
|------|----------|
| **React** | `src/app/creative/ReactView.tsx` |
| **HTML** | `public/creative_analysis.html` |

### 2.1 전역 변수/State 비교

| HTML 변수명 | React 변수명 | 상태 |
|-------------|--------------|------|
| `allData` | `allData` (useState) | ✅ 동일 |
| `imageUrlMap` | `imageUrlMap` (useState) | ✅ 동일 |
| `fallbackUrlMap` | `fallbackUrlMap` (useState) | ✅ 동일 |
| `originalUrlMap` | `originalUrlMap` (useState) | ✅ 동일 |
| `filters` | `filters` (useState) | ✅ 동일 |
| `kpiFilter` | `kpiFilter` (useState) | ✅ 동일 |
| `sortConfig` | `sortConfig` (useState) | ✅ 동일 |
| `savedSortConfig` | `savedSortConfigRef` (useRef) | ✅ 동일 |
| `useEfficiencyScoreSort` | `useEfficiencyScoreSort` (useState) | ✅ 동일 |
| `activeAdvancedFilter` | `activeChip` (useState) | ⚠️ 구현방식 다름 |

### 2.2 상수 비교

| HTML 상수 | React 상수 | 상태 |
|-----------|------------|------|
| `EFFICIENCY_CONFIG` | `EFFICIENCY_CONFIG` | ✅ 동일 |
| `SPEND_BUCKETS` | `SPEND_BUCKETS` | ✅ 동일 |
| `KPI_PRESETS` | `KPI_PRESETS` | ✅ 동일 |

### 2.3 유틸리티 함수 비교

| HTML 함수명 | React 함수명 | 상태 |
|-------------|--------------|------|
| `parseCSVLine(line)` | `parseCSVLine(line)` | ✅ 동일 |
| `parseCSV(text)` | `parseCSV(text)` | ✅ 동일 |
| `parseCSVWithQuotes(text)` | `parseCSVWithQuotes(text)` | ✅ 동일 |
| `formatNumberInput(value)` | `formatNumberInput(value)` | ✅ 동일 |
| `parseFormattedNumber(value)` | `parseFormattedNumber(value)` | ✅ 동일 |
| `formatDateForInput(date)` | `formatDateForInput(date)` | ✅ 동일 |
| `formatNumber(num)` | `formatNumber(num)` | ✅ 동일 |
| `formatROAS(num)` | `formatROAS(num)` | ✅ 동일 |
| `formatCTR(num)` | `formatCTR(num)` | ✅ 동일 |

### 2.4 효율 필터 시스템 함수 비교

| HTML 함수명 | React 함수명 | 상태 |
|-------------|--------------|------|
| `calcGeometricMean(values)` | `calcGeometricMean(values)` | ✅ 동일 |
| `calcMedian(values)` | `calcMedian(values)` | ✅ 동일 |
| `calculateDataDrivenBaseline(data)` | `calculateDataDrivenBaseline(data)` | ✅ 동일 |
| `getExpectedROAS(spend, baseline)` | `getExpectedROAS(spend, baseline)` | ✅ 동일 |
| `calcConfidenceWeight(spend)` | `calcConfidenceWeight(spend)` | ✅ 동일 |
| `calcPercentileRanks(...)` | `calcPercentileRanks(...)` | ✅ 동일 |
| `calculateEfficiencyScores(data)` | `calculateEfficiencyScores(data)` | ✅ 동일 |
| `classifyCreatives(scoredData)` | `classifyCreatives(scoredData)` | ✅ 동일 |
| `filterHighEfficiency(data)` | `filterHighEfficiency(data)` | ✅ 동일 |
| `filterPotential(data)` | `filterPotential(data)` | ✅ 동일 |
| `filterNeedsAttention(data)` | `filterNeedsAttention(data)` | ✅ 동일 |
| `filterLowEfficiency(data)` | `filterLowEfficiency(data)` | ✅ 동일 |

### 2.5 필터 관련 함수 비교

| HTML 함수명 | React 구현 | 상태 |
|-------------|------------|------|
| `loadData()` | `loadData()` (useEffect 내) | ✅ 동일 |
| `populateFilters()` | `typeOptions` (useMemo) | ⚠️ 구현방식 다름 |
| `updateBrandFilter()` | `updateBrandFilter` (useMemo) | ✅ 동일 |
| `updateProductFilter()` | `updateProductFilter` (useMemo) | ✅ 동일 |
| `updatePromotionFilter()` | `updatePromotionFilter` (useMemo) | ✅ 동일 |
| `updateCampaignFilter()` | `updateCampaignFilter` (useMemo) | ✅ 동일 |
| `updateAdSetFilter()` | `updateAdSetFilter` (useMemo) | ✅ 동일 |
| `filterData()` | `filterData` (useMemo) | ✅ 동일 |
| `aggregateByCreative(data)` | `aggregateByCreative` (useMemo) | ✅ 동일 |
| `resetBasicFilters()` | `resetBasicFilters` (useCallback) | ✅ 동일 |
| `resetDetailFilters()` | `resetDetailFilters` (useCallback) | ✅ 동일 |
| `resetKpiFilter()` | `resetKpiFilter` (useCallback) | ✅ 동일 |
| `clearEfficiencyChips()` | `clearEfficiencyChips` (useCallback) | ✅ 동일 |
| `showCreativeDetail(name)` | `showCreativeDetail` (useCallback) | ✅ 동일 |

### 2.6 KPI 필터 필드 비교

| HTML 필드 | React 필드 | 상태 |
|-----------|------------|------|
| `kpiFilter.metric` | `kpiFilter.metric` | ✅ 동일 |
| `kpiFilter.operator` | `kpiFilter.operator` | ✅ 동일 |
| `kpiFilter.value` | `kpiFilter.value` | ✅ 동일 |
| `kpiFilter.enabled` | `kpiFilter.enabled` | ✅ 동일 |
| `kpiFilter.compoundLogic` | `kpiFilter.compoundLogic` | ✅ 동일 |
| `kpiFilter.secondaryMetric` | `kpiFilter.secondaryMetric` | ✅ 동일 |
| `kpiFilter.secondaryOperator` | `kpiFilter.secondaryOperator` | ✅ 동일 |
| `kpiFilter.secondaryValue` | `kpiFilter.secondaryValue` | ✅ 동일 |
| `kpiFilter.secondaryCompoundLogic` | `kpiFilter.secondaryCompoundLogic` | ✅ 동일 |
| `kpiFilter.tertiaryMetric` | `kpiFilter.tertiaryMetric` | ✅ 동일 |
| `kpiFilter.tertiaryOperator` | `kpiFilter.tertiaryOperator` | ✅ 동일 |
| `kpiFilter.tertiaryValue` | `kpiFilter.tertiaryValue` | ✅ 동일 |

### 2.7 데이터 경로 비교

| HTML 경로 | React 경로 | 상태 |
|-----------|------------|------|
| `./creative/Creative_data.csv` | `/creative/Creative_data.csv` | ✅ 동일 |
| `./creative/Creative_url.csv` | `/creative/Creative_url.csv` | ✅ 동일 |

---

## 3. 유형별 대시보드 (type)

| 구분 | 파일 경로 |
|------|----------|
| **React** | `src/app/type/ReactView.tsx` |
| **HTML** | `public/type_dashboard.html` |

### 3.1 전역 변수/State 비교

| HTML 변수명 | React 변수명 | 상태 |
|-------------|--------------|------|
| `insightsData` | `insightsData` (useState) | ✅ 동일 |
| `dimensionData` | `dimensionData` (useState) | ✅ 동일 |
| `currentPeriod` | `currentPeriod` (useState) | ✅ 동일 |
| `adsetDimensionData` | `adsetDimensionData` (useState) | ✅ 동일 |
| `genderDimensionData` | `genderDimensionData` (useState) | ✅ 동일 |
| `ageDimensionData` | `ageDimensionData` (useState) | ✅ 동일 |
| `platformDimensionData` | `platformDimensionData` (useState) | ✅ 동일 |
| `devicePlatformDimensionData` | `devicePlatformDimensionData` (useState) | ✅ 동일 |
| `deviceTypeDimensionData` | `deviceTypeDimensionData` (useState) | ✅ 동일 |

### 3.2 Timeseries 필터 변수 비교

| HTML 변수명 | React 변수명 | 상태 |
|-------------|--------------|------|
| `timeseriesFilters` | `timeseriesFilters` (useState) | ✅ 동일 |
| `currentTimeseriesPeriod` | `currentTimeseriesPeriod` (useState) | ✅ 동일 |
| `currentTimeseriesMetric` | `currentTimeseriesMetric` (useState) | ✅ 동일 |
| `timeseriesStartDate` | `timeseriesStartDate` (useState) | ✅ 동일 |
| `timeseriesEndDate` | `timeseriesEndDate` (useState) | ✅ 동일 |

### 3.3 각 탭별 필터 변수 비교

| HTML 변수명 | React 변수명 | 상태 |
|-------------|--------------|------|
| `currentGenderPeriod` | `currentGenderPeriod` (useState) | ✅ 동일 |
| `currentGenderMetric` | `currentGenderMetric` (useState) | ✅ 동일 |
| `genderStartDate` | `genderStartDate` (useState) | ✅ 동일 |
| `genderEndDate` | `genderEndDate` (useState) | ✅ 동일 |
| `currentAgePeriod` | `currentAgePeriod` (useState) | ✅ 동일 |
| `currentAgeMetric` | `currentAgeMetric` (useState) | ✅ 동일 |
| `ageStartDate` | `ageStartDate` (useState) | ✅ 동일 |
| `ageEndDate` | `ageEndDate` (useState) | ✅ 동일 |
| `currentPlatformPeriod` | `currentPlatformPeriod` (useState) | ✅ 동일 |
| `currentPlatformMetric` | `currentPlatformMetric` (useState) | ✅ 동일 |
| `platformStartDate` | `platformStartDate` (useState) | ✅ 동일 |
| `platformEndDate` | `platformEndDate` (useState) | ✅ 동일 |
| `currentDevicePlatformPeriod` | `currentDevicePlatformPeriod` (useState) | ✅ 동일 |
| `currentDevicePlatformMetric` | `currentDevicePlatformMetric` (useState) | ✅ 동일 |
| `devicePlatformStartDate` | `devicePlatformStartDate` (useState) | ✅ 동일 |
| `devicePlatformEndDate` | `devicePlatformEndDate` (useState) | ✅ 동일 |
| `currentDeviceTypePeriod` | `currentDeviceTypePeriod` (useState) | ✅ 동일 |
| `currentDeviceTypeMetric` | `currentDeviceTypeMetric` (useState) | ✅ 동일 |
| `deviceTypeStartDate` | `deviceTypeStartDate` (useState) | ✅ 동일 |
| `deviceTypeEndDate` | `deviceTypeEndDate` (useState) | ✅ 동일 |

### 3.4 유틸리티 함수 비교

| HTML 함수명 | React 함수명 | 상태 |
|-------------|--------------|------|
| `filterDataByDateRange(data, startDate, endDate)` | `filterDataByDateRange(data, startDate, endDate)` | ✅ 동일 |
| `calculateChangeRate(current, previous)` | `calculateChangeRate(current, previous)` | ✅ 동일 |
| `getMatrixInsightForTarget(...)` | `getMatrixInsightForTarget(...)` | ✅ 동일 |

### 3.5 데이터 경로 비교

| HTML 경로 | React 경로 | 상태 |
|-----------|------------|------|
| `./type/type_insights.json` | `/type/type_insights.json` | ✅ 동일 |
| `./type/dimension_*.csv` | `/type/dimension_*.csv` | ✅ 동일 |

> **참고**: type 대시보드는 처음부터 HTML과 동일한 명칭으로 구현되어 있어 추가 변경이 필요하지 않습니다.

---

## 4. 시계열 대시보드 (timeseries)

| 구분 | 파일 경로 |
|------|----------|
| **React** | `src/app/timeseries/ReactView.tsx` |
| **HTML** | `public/timeseries.html` |

### 4.1 전역 변수/State 비교

| HTML 변수명 | React 변수명 | 상태 |
|-------------|--------------|------|
| `forecastData` | `forecastData` (useState) | ✅ 동일 |
| `insightsData` | `insightsData` (useState) | ✅ 동일 |
| `currentPeriod` | `currentPeriod` (useState) | ✅ 동일 |
| `aiSummaryPeriod` | `aiSummaryPeriod` (useState) | ✅ 동일 |
| `segmentData` | `segmentData` (useState) | ✅ 동일 |

### 4.2 유틸리티 함수 비교

| HTML 함수명 | React 함수명 | 상태 |
|-------------|--------------|------|
| `formatNumber(num)` | `formatNumber(num)` | ✅ 동일 |
| `formatDecimal(num)` | `formatDecimal(num)` | ✅ 동일 |
| `formatPercent(num)` | `formatPercent(num)` | ✅ 동일 |
| `parseCSV(text)` | `parseCSV(text)` | ✅ 동일 |
| `transformRecommendationText()` | `transformRecommendationText()` (useCallback) | ✅ 동일 |

### 4.3 기간/데이터 함수 비교

| HTML 함수명 | React 함수명 | 상태 |
|-------------|--------------|------|
| `getPeriodData()` | `getPeriodData()` (useCallback) | ✅ 동일 |
| `getAiSummaryPeriodData()` | `getAiSummaryPeriodData()` (useCallback) | ✅ 동일 |
| `updateKPISummary()` | `kpiSummary` (useMemo) | ⚠️ 구현방식 다름 |
| `updateAiSummary()` | `aiSummary` (useMemo) | ⚠️ 구현방식 다름 |
| `opportunities` (변수) | `opportunities` (useMemo) | ✅ 동일 |
| `alerts` (변수) | `alerts` (useMemo) | ✅ 동일 |
| `recommendations` (변수) | `recommendations` (useMemo) | ✅ 동일 |
| `matrixInsights` (변수) | `matrixInsights` (useMemo) | ✅ 동일 |
| `performanceTrends` (변수) | `performanceTrends` (useMemo) | ✅ 동일 |
| `updateTrendPeriodIndicator()` | `trendPeriodIndicator()` (useCallback) | ✅ 동일 |
| `improvements` (데이터) | `improvements()` (useCallback) | ✅ 동일 |
| `declines` (데이터) | `declines()` (useCallback) | ✅ 동일 |

### 4.4 시뮬레이션 함수 비교

| HTML 함수명 | React 함수명 | 상태 |
|-------------|--------------|------|
| `formatSimCurrency()` | `formatSimCurrency()` (useCallback) | ✅ 동일 |
| `simulationData` | `simulationData` (useMemo) | ✅ 동일 |
| `simulationResults` | `simulationResults` (useMemo) | ✅ 동일 |

### 4.5 데이터 경로 비교

| HTML 경로 | React 경로 | 상태 |
|-----------|------------|------|
| `forecast/predictions_daily.csv` | `/forecast/predictions_daily.csv` | ✅ 동일 |
| `forecast/insights.json` | `/forecast/insights.json` | ✅ 동일 |
| `forecast/segment_*.csv` | `/forecast/segment_*.csv` | ✅ 동일 |

---

## 5. 퍼널 대시보드 (funnel)

| 구분 | 파일 경로 |
|------|----------|
| **React** | `src/app/funnel/ReactView.tsx` |
| **HTML** | `public/funnel_dashboard.html` |

### 5.1 전역 변수/State 비교

| HTML 변수명 | React 변수명 | 상태 |
|-------------|--------------|------|
| `dailyData` | `dailyData` (useState) | ✅ 동일 |
| `weeklyData` | `weeklyData` (useState) | ✅ 동일 |
| `channelData` | `channelData` (useState) | ✅ 동일 |
| `newVsReturningData` | `newVsReturningData` (useState) | ✅ 동일 |
| `channelEngagementData` | `channelEngagementData` (useState) | ✅ 동일 |
| `newVsReturningConversionData` | `newVsReturningConversionData` (useState) | ✅ 동일 |
| `insightsData` | `insightsData` (useState) | ✅ 동일 |
| `currentPeriod` | `currentPeriod` (useState) | ✅ 동일 |
| `insightPeriod` | `insightPeriod` (useState) | ✅ 동일 |
| `microSegmentPeriod` | `microSegmentPeriod` (useState) | ✅ 동일 |
| `newVsReturningView` | `newVsReturningView` (useState) | ✅ 동일 |
| `currentKpiType` | `currentKpiType` (useState) | ✅ 동일 |
| `currentChurnStage` | `currentChurnStage` (useState) | ✅ 동일 |
| `currentChurnSort` | `currentChurnSort` (useState) | ✅ 동일 |
| `currentChannelFunnel` | `currentChannelFunnel` (useState) | ✅ 동일 |
| `trendPeriod` | `trendPeriod` (useState) | ✅ 동일 |
| `isCompareMode` | `isCompareMode` (useState) | ✅ 동일 |
| `selectedFunnelChannel` | `selectedFunnelChannel` (useState) | ✅ 동일 |

### 5.2 유틸리티 함수 비교

| HTML 함수명 | React 함수명 | 상태 |
|-------------|--------------|------|
| `formatNumber(num)` | `formatNumber(num)` | ✅ 동일 |
| `formatDecimal(num)` | `formatDecimal(num)` | ✅ 동일 |
| `parseCSV(text)` | `parseCSV(text)` | ✅ 동일 |
| `calculateChurnRates(row)` | `calculateChurnRates(row)` | ✅ 동일 |

### 5.3 기간/데이터 함수 비교

| HTML 함수명 | React 함수명 | 상태 |
|-------------|--------------|------|
| `getPeriodData()` | `getPeriodData()` (useCallback) | ✅ 동일 |
| `getInsightPeriodData()` | `getInsightPeriodData()` (useCallback) | ✅ 동일 |
| `getMicroSegmentPeriodData()` | `getMicroSegmentPeriodData()` (useCallback) | ✅ 동일 |
| `switchPeriod(period)` | `switchPeriod(period)` (useCallback) | ✅ 동일 |
| `switchInsightPeriod(period)` | `switchInsightPeriod(period)` (useCallback) | ✅ 동일 |
| `switchMicroSegmentPeriod(period)` | `switchMicroSegmentPeriod(period)` (useCallback) | ✅ 동일 |

### 5.4 업데이트 함수 비교 (useMemo로 변환)

| HTML 함수명 | React 변수명 | 상태 |
|-------------|--------------|------|
| `updateKPISummary()` | `kpiSummary` (useMemo) | ⚠️ 구현방식 다름 |
| `updateSummaryCardBanner()` | `summaryCardBanner` (useMemo) | ⚠️ 구현방식 다름 |
| `updateUrgentAlerts()` | `urgentAlertsData` (useMemo) | ⚠️ 구현방식 다름 |
| `updateMicroSegmentAlerts()` | `microSegmentData` (useMemo) | ⚠️ 구현방식 다름 |
| `updateBCGMatrix()` | `bcgMatrix` (useMemo) | ⚠️ 구현방식 다름 |
| `updateAdvancedAnalysis()` | `investmentGuide` (useMemo) | ⚠️ 구현방식 다름 |
| `renderCrmActions()` | `crmActions` (useMemo) | ⚠️ 구현방식 다름 |
| `renderPerformanceTrends()` | `performanceTrends` (useMemo) | ⚠️ 구현방식 다름 |
| `updateInsights()` | `keyInsights` (useMemo) | ⚠️ 구현방식 다름 |
| `updateFunnelChart()` | `funnelData` (useMemo) + D3 렌더링 | ⚠️ 구현방식 다름 |
| `updateChurnChart()` | `channelChurnData` (useMemo) | ⚠️ 구현방식 다름 |
| `updateCompareChart()` | `channelCompareData` (useMemo) | ⚠️ 구현방식 다름 |
| `updateCustomerTrendChart()` | `customerTrendData` (useMemo) | ⚠️ 구현방식 다름 |

### 5.5 기타 함수 비교

| HTML 함수명 | React 함수명 | 상태 |
|-------------|--------------|------|
| `getStageInsights(stage, index)` | `getStageInsights(stage, index)` (useCallback) | ✅ 동일 |
| `loadData()` | useEffect (데이터 로드) | ⚠️ 구현방식 다름 |

### 5.6 데이터 경로 비교

| HTML 경로 | React 경로 | 상태 |
|-----------|------------|------|
| `funnel/channel_daily_funnel.csv` | `/funnel/channel_daily_funnel.csv` | ✅ 동일 |
| `funnel/weekly_funnel.csv` | `/funnel/weekly_funnel.csv` | ✅ 동일 |
| `funnel/channel_funnel.csv` | `/funnel/channel_funnel.csv` | ✅ 동일 |
| `funnel/new_vs_returning.csv` | `/funnel/new_vs_returning.csv` | ✅ 동일 |
| `funnel/channel_engagement.csv` | `/funnel/channel_engagement.csv` | ✅ 동일 |
| `funnel/new_vs_returning_conversion.csv` | `/funnel/new_vs_returning_conversion.csv` | ✅ 동일 |
| `funnel/insights.json` | `/funnel/insights.json` | ✅ 동일 |

> **참고**: 퍼널 대시보드는 2026-01-08에 React로 신규 변환되었습니다.
> HTML의 DOM 조작 함수들은 React의 useMemo/useCallback으로 변환되어 구현방식은 다르지만 로직은 동일합니다.
> D3.js 퍼널 차트는 useEffect 내에서 동일하게 렌더링됩니다.

---

## 6. 채널별 비교

> ⚠️ **참고**: '채널별 비교' 대시보드에 해당하는 React 파일 및 HTML 파일을 찾지 못했습니다.

---

## 변경 이력

### 2026-01-08 (v4) - funnel 대시보드 React 변환
**퍼널 대시보드 신규 변환 (`src/app/funnel/ReactView.tsx`)**

- `funnel_dashboard.html`을 React로 완전 변환
- D3.js 퍼널 차트 구현
- Chart.js 이탈률/비교/추세 차트 구현
- 18개 전역 변수 → useState로 변환
- 13개 업데이트 함수 → useMemo로 변환
- 6개 기간/데이터 함수 → useCallback으로 변환
- 모든 함수명/변수명 HTML과 동일하게 유지

### 2026-01-08 (v3) - timeseries 대시보드 함수명 통일
HTML과 동일한 함수명으로 변경:

**시계열 대시보드 (`src/app/timeseries/ReactView.tsx`)**
| 변경 전 | 변경 후 |
|---------|---------|
| `formatDec` | `formatDecimal` |
| `getAiPeriodData` | `getAiSummaryPeriodData` |
| `kpiData` | `kpiSummary` |
| `aiSummaryCards` | `aiSummary` |
| `allOpportunities` | `opportunities` |
| `allAlerts` | `alerts` |
| `allRecommendations` | `recommendations` |
| `getTrendPeriodText` | `trendPeriodIndicator` |
| `getImprovements` | `improvements` |
| `getDeclines` | `declines` |

### 2026-01-07 (v2) - 함수명 통일 작업
HTML과 동일한 함수명으로 변경:

**광고 성과 대시보드 (`src/app/ReactView.tsx`)**
| 변경 전 | 변경 후 |
|---------|---------|
| `chartRef` | `trendChart` |
| `brandOptions` | `updateBrandFilter` |
| `productOptions` | `updateProductFilter` |
| `promotionOptions` | `updatePromotionFilter` |
| `setNameOptions` | `updateSetNameFilter` |
| `filteredData` | `filterData` |
| `aggregatedData` | `aggregateData` |
| `chartData` | `currentChartData` |

**소재별 대시보드 (`src/app/creative/ReactView.tsx`)**
| 변경 전 | 변경 후 |
|---------|---------|
| `brandOptions` | `updateBrandFilter` |
| `productOptions` | `updateProductFilter` |
| `promotionOptions` | `updatePromotionFilter` |
| `campaignOptions` | `updateCampaignFilter` |
| `adSetOptions` | `updateAdSetFilter` |
| `filteredData` | `filterData` |
| `aggregatedData` | `aggregateByCreative` |

### 2026-01-07 (v1) - 최초 작성

---

## 요약

### 광고 성과 대시보드
- **✅ 동일**: 대부분의 함수명/변수명 일치
- **⚠️ 구현방식 다름**: React 훅 패턴 사용 (useMemo, useState)

### 소재별 대시보드
- **✅ 동일**: 대부분의 함수명/변수명 일치
- **⚠️ 구현방식 다름**: React 훅 패턴 사용 (useMemo, useState, useCallback)

### 유형별 대시보드 (type)
- **✅ 동일**: 모든 함수명/변수명이 HTML과 완전히 일치
- **변경 필요 없음**: 처음부터 HTML 명칭과 동일하게 구현됨

### 시계열 대시보드 (timeseries)
- **✅ 동일**: 10개 변수명 HTML 기준으로 통일 완료
- **⚠️ 구현방식 다름**: React 훅 패턴 사용 (useMemo, useCallback)

### 퍼널 대시보드 (funnel)
- **✅ 신규 변환**: 2026-01-08 React로 변환 완료
- **✅ 동일**: 모든 함수명/변수명이 HTML과 완전히 일치
- **⚠️ 구현방식 다름**: React 훅 패턴 사용 (useMemo, useCallback, D3.js)

### 주요 패턴
| HTML 패턴 | React 패턴 | 함수명 |
|-----------|-----------|--------|
| `function xxx()` | `const xxx = useMemo/useCallback` | ✅ 동일하게 유지 |
| DOM 직접 조작 | JSX + 상태 기반 렌더링 | - |
| Chart.js 직접 사용 | react-chartjs-2 컴포넌트 | - |
