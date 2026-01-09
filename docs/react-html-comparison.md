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
| **HTML** | `data/type_dashboard.html` |

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
| `pivotDimensionData` | `pivotDimensionData` (useState) | ✅ 동일 |

### 3.2 Timeseries 필터 변수 비교

| HTML 변수명 | React 변수명 | 상태 |
|-------------|--------------|------|
| `timeseriesFilters` | `timeseriesFilters` (useState) | ✅ 동일 |
| `currentTimeseriesPeriod` | `currentTimeseriesPeriod` (useState) | ✅ 동일 |
| `currentTimeseriesMetric` | `currentTimeseriesMetric` (useState) | ✅ 동일 |
| `timeseriesStartDate` | `timeseriesStartDate` (useState) | ✅ 동일 |
| `timeseriesEndDate` | `timeseriesEndDate` (useState) | ✅ 동일 |
| `timeseriesTrendChart` | React-Chartjs-2 컴포넌트 | ⚠️ 구현방식 다름 |

### 3.3 각 탭별 필터 변수 비교

| HTML 변수명 | React 변수명 | 상태 |
|-------------|--------------|------|
| `currentGenderPeriod` | `currentGenderPeriod` (useState) | ✅ 동일 |
| `currentGenderMetric` | `currentGenderMetric` (useState) | ✅ 동일 |
| `genderStartDate` | `genderStartDate` (useState) | ✅ 동일 |
| `genderEndDate` | `genderEndDate` (useState) | ✅ 동일 |
| `selectedGenderItems` | `selectedGenderItems` (useState) | ✅ 동일 |
| `genderTrendChart` | React-Chartjs-2 컴포넌트 | ⚠️ 구현방식 다름 |
| `currentAgePeriod` | `currentAgePeriod` (useState) | ✅ 동일 |
| `currentAgeMetric` | `currentAgeMetric` (useState) | ✅ 동일 |
| `ageStartDate` | `ageStartDate` (useState) | ✅ 동일 |
| `ageEndDate` | `ageEndDate` (useState) | ✅ 동일 |
| `selectedAgeItems` | `selectedAgeItems` (useState) | ✅ 동일 |
| `ageTrendChart` | React-Chartjs-2 컴포넌트 | ⚠️ 구현방식 다름 |
| `currentPlatformPeriod` | `currentPlatformPeriod` (useState) | ✅ 동일 |
| `currentPlatformMetric` | `currentPlatformMetric` (useState) | ✅ 동일 |
| `platformStartDate` | `platformStartDate` (useState) | ✅ 동일 |
| `platformEndDate` | `platformEndDate` (useState) | ✅ 동일 |
| `selectedPlatformItems` | `selectedPlatformItems` (useState) | ✅ 동일 |
| `platformTrendChart` | React-Chartjs-2 컴포넌트 | ⚠️ 구현방식 다름 |
| `currentDevicePlatformPeriod` | `currentDevicePlatformPeriod` (useState) | ✅ 동일 |
| `currentDevicePlatformMetric` | `currentDevicePlatformMetric` (useState) | ✅ 동일 |
| `devicePlatformStartDate` | `devicePlatformStartDate` (useState) | ✅ 동일 |
| `devicePlatformEndDate` | `devicePlatformEndDate` (useState) | ✅ 동일 |
| `selectedDevicePlatformItems` | `selectedDevicePlatformItems` (useState) | ✅ 동일 |
| `devicePlatformTrendChart` | React-Chartjs-2 컴포넌트 | ⚠️ 구현방식 다름 |
| `currentDeviceTypePeriod` | `currentDeviceTypePeriod` (useState) | ✅ 동일 |
| `currentDeviceTypeMetric` | `currentDeviceTypeMetric` (useState) | ✅ 동일 |
| `deviceTypeStartDate` | `deviceTypeStartDate` (useState) | ✅ 동일 |
| `deviceTypeEndDate` | `deviceTypeEndDate` (useState) | ✅ 동일 |
| `selectedDeviceTypeItems` | `selectedDeviceTypeItems` (useState) | ✅ 동일 |
| `deviceTypeTrendChart` | React-Chartjs-2 컴포넌트 | ⚠️ 구현방식 다름 |

### 3.4 상수 비교

| HTML 상수 | React 상수 | 상태 |
|-----------|------------|------|
| `DETAIL_DEFAULT_LIMIT` (10) | `DETAIL_DEFAULT_LIMIT` (10) | ✅ 동일 |
| `DETAIL_EXPANDED_LIMIT` (50) | `DETAIL_EXPANDED_LIMIT` (50) | ✅ 동일 |

### 3.5 유틸리티 함수 비교

| HTML 함수명 | React 함수명 | 상태 |
|-------------|--------------|------|
| `parseCSV(text)` | `parseCSV(text)` | ✅ 동일 |
| `parseLine(line)` | `parseLine(line)` (내부 함수) | ✅ 동일 |
| `filterDataByDateRange(data, startDate, endDate)` | `filterDataByDateRange(data, startDate, endDate)` | ✅ 동일 |
| `calculateChangeRate(current, previous)` | `calculateChangeRate(current, previous)` | ✅ 동일 |
| `getMatrixInsightForTarget(...)` | `getMatrixInsightForTarget(...)` (useCallback) | ✅ 동일 |
| `isValidGender(gender)` | `isValidGender(gender)` | ✅ 동일 |
| `isValidAge(age)` | `isValidAge(age)` | ✅ 동일 |
| `normalizeGender(gender)` | `normalizeGender(gender)` | ✅ 동일 |
| `getGenderDisplayName(normalizedGender)` | `getGenderDisplayName(normalizedGender)` | ✅ 동일 |
| `getPeriodKey(dateString, period)` | `getPeriodKey(dateString, period)` | ✅ 동일 |
| `formatCurrency(value)` | `formatCurrency(value)` | ✅ 동일 |
| `formatNumber(value)` | `formatNumber(value)` | ✅ 동일 |
| `formatPercent(value)` | `formatPercent(value)` | ✅ 동일 |
| `formatValue(value)` | `formatValue(value)` | ✅ 동일 |
| `getSeverityLabel(severity)` | `getSeverityLabel(severity)` | ✅ 동일 |
| `getEfficiencyGrade(roas, maxRoas)` | `getEfficiencyGrade(roas, maxRoas)` | ✅ 동일 |
| `getDeviceIcon(device)` | `getDeviceIcon(device)` | ✅ 동일 |
| `getPlatformIcon(platform)` | `getPlatformIcon(platform)` | ✅ 동일 |
| `getDevicePlatformIcon(devicePlatform)` | `getDevicePlatformIcon(devicePlatform)` | ✅ 동일 |
| `getDayEmoji(day)` | `getDayEmoji(day)` | ✅ 동일 |
| `getCategoryIcon(category)` | `getCategoryIcon(category)` | ✅ 동일 |
| `getPerfTableColorScale(...)` | `getPerfTableColorScale(...)` | ✅ 동일 |

### 3.6 핵심 데이터/로직 함수 비교

| HTML 함수명 | React 구현 | 상태 |
|-------------|------------|------|
| `loadData()` | `useEffect` (데이터 로드) | ⚠️ 구현방식 다름 |
| `initDashboard()` | React 상태 기반 렌더링 | ⚠️ 구현방식 다름 |
| `getPeriodData()` | `getPeriodData()` (useCallback) | ✅ 동일 |
| `getSeasonalityData()` | `getSeasonalityData()` (useCallback) | ✅ 동일 |
| `switchPeriod(period)` | `setCurrentPeriod(period)` | ⚠️ 구현방식 다름 |
| `updatePeriodInfo()` | `periodInfo` (useMemo) | ⚠️ 구현방식 다름 |
| `updatePeriodDateRange()` | JSX 인라인 표시 | ⚠️ 구현방식 다름 |

### 3.7 렌더링 함수 비교 (useMemo 변환)

| HTML 함수명 | React 변수명 | 상태 |
|-------------|--------------|------|
| `renderKPICards()` | `kpiData` (useMemo) | ⚠️ 구현방식 다름 |
| `renderDecisionTools()` | `decisionToolData` (useMemo) | ⚠️ 구현방식 다름 |
| `renderSummaryTab()` | JSX 직접 렌더링 | ⚠️ 구현방식 다름 |
| `renderOpportunityTab()` | `recommendationGroups` (useMemo) | ⚠️ 구현방식 다름 |
| `renderBudgetGuideTab()` | JSX 직접 렌더링 | ⚠️ 구현방식 다름 |
| `renderWarningTab()` | `warningGroups` (useMemo) | ⚠️ 구현방식 다름 |
| `renderTargetingTab()` | `topTargets`, `matrixQuadrants` (useMemo) | ⚠️ 구현방식 다름 |
| `renderForecastTab()` | JSX 직접 렌더링 | ⚠️ 구현방식 다름 |
| `renderRecommendationCard(rec, idx)` | JSX 인라인 컴포넌트 | ⚠️ 구현방식 다름 |
| `renderAlertCard(alert)` | JSX 인라인 컴포넌트 | ⚠️ 구현방식 다름 |
| `renderCpaCard(cat)` | JSX 인라인 컴포넌트 | ⚠️ 구현방식 다름 |
| `renderMatrixBadge(matrixType)` | JSX 인라인 컴포넌트 | ⚠️ 구현방식 다름 |

### 3.8 추이 분석 함수 비교

| HTML 함수명 | React 구현 | 상태 |
|-------------|------------|------|
| `renderTimeseriesTrendChart()` | `filteredTrendData` (useMemo) + Chart.js | ⚠️ 구현방식 다름 |
| `renderGenderTrendChart()` | `filteredGenderData` (useMemo) + Chart.js | ⚠️ 구현방식 다름 |
| `renderAgeTrendChart()` | `filteredAgeData` (useMemo) + Chart.js | ⚠️ 구현방식 다름 |
| `renderPlatformTrendChart()` | `filteredPlatformData` (useMemo) + Chart.js | ⚠️ 구현방식 다름 |
| `renderDevicePlatformTrendChart()` | `filteredDevicePlatformData` (useMemo) + Chart.js | ⚠️ 구현방식 다름 |
| `renderDeviceTypeTrendChart()` | `filteredDeviceData` (useMemo) + Chart.js | ⚠️ 구현방식 다름 |
| `initTimeseriesDropdowns()` | `trendFilterOptions` (useMemo) | ⚠️ 구현방식 다름 |
| `updateTimeseriesFilters()` | useState setters | ⚠️ 구현방식 다름 |
| `initGenderDropdowns()` | `genderFilterOptions` (useMemo) | ⚠️ 구현방식 다름 |
| `updateGenderFilters()` | useState setters | ⚠️ 구현방식 다름 |
| `initAgeDropdowns()` | `ageFilterOptions` (useMemo) | ⚠️ 구현방식 다름 |
| `updateAgeFilters()` | useState setters | ⚠️ 구현방식 다름 |
| `initPlatformDropdowns()` | `platformFilterOptions` (useMemo) | ⚠️ 구현방식 다름 |
| `updatePlatformFilters()` | useState setters | ⚠️ 구현방식 다름 |
| `initDevicePlatformDropdowns()` | `devicePlatformFilterOptions` (useMemo) | ⚠️ 구현방식 다름 |
| `updateDevicePlatformFilters()` | useState setters | ⚠️ 구현방식 다름 |
| `initDeviceTypeDropdowns()` | `deviceFilterOptions` (useMemo) | ⚠️ 구현방식 다름 |
| `updateDeviceTypeFilters()` | useState setters | ⚠️ 구현방식 다름 |

### 3.9 성능 테이블 함수 비교

| HTML 함수명 | React 구현 | 상태 |
|-------------|------------|------|
| `renderPerfTableAdset()` | `perfTableAdsetData` (useMemo) | ⚠️ 구현방식 다름 |
| `renderPerfTableGender()` | `perfTableGenderData` (useMemo) | ⚠️ 구현방식 다름 |
| `renderPerfTableAge()` | `perfTableAgeData` (useMemo) | ⚠️ 구현방식 다름 |
| `renderPerfTablePlatform()` | `perfTablePlatformData` (useMemo) | ⚠️ 구현방식 다름 |
| `renderPerfTableDevicePlatform()` | `perfTableDevicePlatformData` (useMemo) | ⚠️ 구현방식 다름 |
| `renderPerfTableDeviceType()` | `perfTableDeviceTypeData` (useMemo) | ⚠️ 구현방식 다름 |
| `renderPerfTableGenderAge()` | `perfTableGenderAgeData` (useMemo) | ⚠️ 구현방식 다름 |
| `renderPerfTableGeneric(...)` | `getPerfTableGenericData(...)` | ✅ 동일 |
| `initPerfTableFilters()` | `perfTableFilterOptions` (useMemo) | ⚠️ 구현방식 다름 |
| `updatePerfTableFilters(...)` | `updatePerfTableFilters(...)` | ✅ 동일 |
| `setupPerfTableSortEvents()` | `handlePerfTableSort(...)` | ✅ 동일 |
| `setupPerfTableDateEvents()` | `handlePerfTableDateChange(...)` | ✅ 동일 |
| `aggregatePerfData(data, groupKey)` | `aggregatePerfData(data, groupKey)` | ✅ 동일 |

### 3.10 성능 차트 함수 비교

| HTML 함수명 | React 구현 | 상태 |
|-------------|------------|------|
| `renderAllPerformanceCharts()` | 상태 기반 렌더링 | ⚠️ 구현방식 다름 |
| `renderBrandPerformanceChart()` | `getPerfChartData('brand')` | ⚠️ 구현방식 다름 |
| `renderProductPerformanceChart()` | `getPerfChartData('product')` | ⚠️ 구현방식 다름 |
| `renderPromotionPerformanceChart()` | `getPerfChartData('promotion')` | ⚠️ 구현방식 다름 |
| `renderTargetingPerformanceChart()` | `getPerfChartData('targeting')` | ⚠️ 구현방식 다름 |
| `aggregateBrandData(data)` | `aggregatePerfData(...)` 통합 | ⚠️ 구현방식 다름 |
| `aggregateProductData(data)` | `aggregatePerfData(...)` 통합 | ⚠️ 구현방식 다름 |
| `aggregatePromotionData(data)` | `aggregatePerfData(...)` 통합 | ⚠️ 구현방식 다름 |
| `aggregateTargetingData(data)` | `aggregatePerfData(...)` 통합 | ⚠️ 구현방식 다름 |
| `setupPerformanceControls()` | useState + 이벤트 핸들러 | ⚠️ 구현방식 다름 |
| `initPerfChartDates()` | useEffect 초기화 | ⚠️ 구현방식 다름 |
| `updatePerfShowMoreButton(...)` | `handlePerfChartShowMoreToggle(...)` | ✅ 동일 |

### 3.11 리타겟팅 분석 함수 비교

| HTML 함수명 | React 구현 | 상태 |
|-------------|------------|------|
| `initRetargetingAnalysis()` | 상태 기반 렌더링 | ⚠️ 구현방식 다름 |
| `renderAgeGenderRetargetTable()` | `getRetargetingTableData('ageGender')` | ⚠️ 구현방식 다름 |
| `renderDeviceRetargetTable()` | `getRetargetingTableData('device')` | ⚠️ 구현방식 다름 |
| `renderPlatformRetargetTable()` | `getRetargetingTableData('platform')` | ⚠️ 구현방식 다름 |
| `renderDevicePlatformRetargetTable()` | `getRetargetingTableData('devicePlatform')` | ⚠️ 구현방식 다름 |
| `setupRetargetingSortEvents()` | `handleRetargetingSortChange(...)` | ✅ 동일 |
| `setupRetargetingTabEvents()` | 상태 기반 탭 전환 | ⚠️ 구현방식 다름 |
| `updateRetargetingSortIcons(...)` | useState + 정렬 아이콘 상태 | ⚠️ 구현방식 다름 |

### 3.12 계절성 분석 함수 비교

| HTML 함수명 | React 구현 | 상태 |
|-------------|------------|------|
| `renderQuarterlyTrendChart()` | Chart.js 컴포넌트 | ⚠️ 구현방식 다름 |
| `renderQuarterlyKpiCards(...)` | JSX 인라인 렌더링 | ⚠️ 구현방식 다름 |
| `renderQuarterlySeasonalityInsight(...)` | JSX 인라인 렌더링 | ⚠️ 구현방식 다름 |
| `renderQuarterlyTable()` | JSX 인라인 렌더링 | ⚠️ 구현방식 다름 |
| `renderSeasonalityTable()` | JSX 인라인 렌더링 | ⚠️ 구현방식 다름 |
| `renderChannelDayKpiCards()` | JSX 인라인 렌더링 | ⚠️ 구현방식 다름 |
| `renderChannelDayRoasChart()` | Chart.js 컴포넌트 | ⚠️ 구현방식 다름 |
| `renderSeasonalityCategoryTable()` | JSX 인라인 렌더링 | ⚠️ 구현방식 다름 |
| `renderChannelDayTableForCategory(...)` | JSX 인라인 렌더링 | ⚠️ 구현방식 다름 |
| `renderChannelDayInsight()` | JSX 인라인 렌더링 | ⚠️ 구현방식 다름 |

### 3.13 예측 분석 함수 비교

| HTML 함수명 | React 구현 | 상태 |
|-------------|------------|------|
| `initForecastSubtabs(forecast)` | useState 탭 상태 | ⚠️ 구현방식 다름 |
| `initForecastAccordions()` | useState 펼침 상태 | ⚠️ 구현방식 다름 |
| `handleForecastAccordionClick(e)` | onClick 핸들러 | ⚠️ 구현방식 다름 |
| `generateAIOpportunities(forecast)` | useMemo 변환 | ⚠️ 구현방식 다름 |
| `generateAIActions(forecast)` | useMemo 변환 | ⚠️ 구현방식 다름 |
| `renderForecastSubtab(...)` | JSX 조건부 렌더링 | ⚠️ 구현방식 다름 |

### 3.14 UI 상태 변수 비교

| HTML 변수명 | React 변수명 | 상태 |
|-------------|--------------|------|
| (DOM 상태) | `loading` (useState) | ⚠️ 구현방식 다름 |
| (DOM 상태) | `decisionToolExpanded` (useState) | ⚠️ 구현방식 다름 |
| (DOM 상태) | `trendAnalysisExpanded` (useState) | ⚠️ 구현방식 다름 |
| (DOM 상태) | `showMoreRecommendations` (useState) | ⚠️ 구현방식 다름 |
| (DOM 상태) | `showMoreAlerts` (useState) | ⚠️ 구현방식 다름 |
| (DOM 상태) | `showMoreCpa` (useState) | ⚠️ 구현방식 다름 |
| (DOM 상태) | `expandedTopAdsets` (useState) | ⚠️ 구현방식 다름 |
| (DOM 상태) | `expandedDevicePlatform` (useState) | ⚠️ 구현방식 다름 |
| (DOM 상태) | `expandedDevice` (useState) | ⚠️ 구현방식 다름 |
| (DOM 상태) | `expandedAgeGender` (useState) | ⚠️ 구현방식 다름 |
| (DOM 상태) | `expandedAiOpportunity` (useState) | ⚠️ 구현방식 다름 |
| (DOM 상태) | `expandedAiAction` (useState) | ⚠️ 구현방식 다름 |

### 3.15 데이터 경로 비교

| HTML 경로 | React 경로 | 상태 |
|-----------|------------|------|
| `./type/type_insights.json` | `/type/type_insights.json` | ✅ 동일 |
| `./type/dimension_adset.csv` | `/type/dimension_adset.csv` | ✅ 동일 |
| `./type/dimension_gender.csv` | `/type/dimension_gender.csv` | ✅ 동일 |
| `./type/dimension_age.csv` | `/type/dimension_age.csv` | ✅ 동일 |
| `./type/dimension_platform.csv` | `/type/dimension_platform.csv` | ✅ 동일 |
| `./type/dimension_device_platform.csv` | `/type/dimension_device_platform.csv` | ✅ 동일 |
| `./type/dimension_device_type.csv` | `/type/dimension_device_type.csv` | ✅ 동일 |
| `./type/dimension_pivot.csv` | `/type/dimension_pivot.csv` | ✅ 동일 |

### 3.16 함수 통계 요약

| 구분 | HTML 함수 수 | React 함수/변수 수 | 상태 |
|------|-------------|-------------------|------|
| 유틸리티 함수 | 22개 | 22개 | ✅ 모두 동일 |
| 렌더링 함수 | 약 60개 | useMemo/JSX 변환 | ⚠️ 구현방식 다름 |
| 초기화 함수 | 약 30개 | useEffect/useState | ⚠️ 구현방식 다름 |
| 이벤트 핸들러 | 약 40개 | onClick/onChange | ⚠️ 구현방식 다름 |
| 전역 변수 | 약 80개 | useState로 변환 | ✅ 명칭 동일 |

> **참고**: type 대시보드는 HTML 파일에 약 150개 이상의 함수가 정의되어 있습니다.
> React에서는 이들을 useMemo, useCallback, useState를 활용한 선언적 패턴으로 변환하였습니다.
> 대부분의 유틸리티 함수명과 상태 변수명은 HTML과 동일하게 유지되어 있습니다.

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

### 4.2 상수 비교

| HTML 상수 | React 상수 | 상태 |
|-----------|------------|------|
| `INITIAL_ALERTS_COUNT` (6) | `INITIAL_ALERTS_COUNT` (6) | ✅ 동일 |
| `INITIAL_RECOMMENDATIONS_COUNT` (4) | `INITIAL_RECOMMENDATIONS_COUNT` (4) | ✅ 동일 |
| `DIMINISHING_FACTOR` (0.15) | `DIMINISHING_FACTOR` (0.15) | ✅ 동일 |

### 4.3 유틸리티 함수 비교

| HTML 함수명 | React 함수명 | 상태 |
|-------------|--------------|------|
| `formatNumber(num)` | `formatNumber(num)` | ✅ 동일 |
| `formatDecimal(num)` | `formatDecimal(num)` | ✅ 동일 |
| `formatPercent(num)` | `formatPercent(num)` | ✅ 동일 |
| `parseCSV(text)` | `parseCSV(text)` | ✅ 동일 |
| `transformRecommendationText()` | `transformRecommendationText()` (useCallback) | ✅ 동일 |

### 4.4 기간/데이터 함수 비교

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

### 4.5 시뮬레이션 함수 비교

| HTML 함수명 | React 함수명 | 상태 |
|-------------|--------------|------|
| `formatSimCurrency()` | `formatSimCurrency()` (useCallback) | ✅ 동일 |
| `simulationData` | `simulationData` (useMemo) | ✅ 동일 |
| `simulationResults` | `simulationResults` (useMemo) | ✅ 동일 |

### 4.6 데이터 경로 비교

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

## 7. FAQ & 문의하기 (QnA)

| 구분 | 파일 경로 |
|------|----------|
| **React** | `src/app/qna/ReactView.tsx` |
| **HTML** | `data/Qna.html` |

### 7.1 전역 변수/State 비교

| HTML 변수명 | React 변수명 | 상태 |
|-------------|--------------|------|
| (탭 상태) | `activeTab` (useState) | ⚠️ 구현방식 다름 |
| `faqSearch` (input) | `searchTerm` (useState) | ⚠️ 구현방식 다름 |
| (FAQ 열림 상태) | `openFaqs` (useState - Set) | ⚠️ 구현방식 다름 |
| (폼 데이터) | `formData` (useState) | ⚠️ 구현방식 다름 |
| (제출 상태) | `isSubmitting` (useState) | ⚠️ 구현방식 다름 |
| (성공 메시지) | `showSuccess` (useState) | ⚠️ 구현방식 다름 |

### 7.2 함수명 비교

| HTML 함수명 | React 함수명 | 상태 | 비고 |
|-------------|--------------|------|------|
| `toggleFaq(button)` | `toggleFaq(question)` | ⚠️ 구현방식 다름 | 파라미터 타입 다름 |
| `submitForm(event)` | `handleSubmit(e)` | ⚠️ 구현방식 다름 | React 이벤트 핸들러 |
| (탭 클릭 익명함수) | `setActiveTab()` | ⚠️ 구현방식 다름 | useState setter |
| (검색 input 익명함수) | `useMemo` + `setSearchTerm()` | ⚠️ 구현방식 다름 | React 패턴 |
| - | `isFaqOpen(question)` | 신규 | 검색 시 자동 열기 로직 |

### 7.3 CSS 클래스명 비교

#### 동일한 클래스명

| CSS 클래스 | HTML | React | 상태 |
|-----------|------|-------|------|
| `.tab-nav` | ✓ | ✓ | ✅ 동일 |
| `.tab-btn` | ✓ | ✓ | ✅ 동일 |
| `.tab-btn.active` | ✓ | ✓ | ✅ 동일 |
| `.search-box` | ✓ | ✓ | ✅ 동일 |
| `.search-icon` | ✓ | ✓ | ✅ 동일 |
| `.search-input` | ✓ | ✓ | ✅ 동일 |
| `.faq-section` | ✓ | ✓ | ✅ 동일 |
| `.faq-category` | ✓ | ✓ | ✅ 동일 |
| `.faq-category-title` | ✓ | ✓ | ✅ 동일 |
| `.faq-list` | ✓ | ✓ | ✅ 동일 |
| `.faq-item` | ✓ | ✓ | ✅ 동일 |
| `.faq-item.open` | ✓ | ✓ | ✅ 동일 |
| `.faq-question` | ✓ | ✓ | ✅ 동일 |
| `.faq-icon` | ✓ | ✓ | ✅ 동일 |
| `.faq-answer` | ✓ | ✓ | ✅ 동일 |
| `.faq-answer-content` | ✓ | ✓ | ✅ 동일 |
| `.contact-section` | ✓ | ✓ | ✅ 동일 |
| `.section-header` | ✓ | ✓ | ✅ 동일 |
| `.contact-form` | ✓ | ✓ | ✅ 동일 |
| `.form-row` | ✓ | ✓ | ✅ 동일 |
| `.form-group` | ✓ | ✓ | ✅ 동일 |
| `.form-label` | ✓ | ✓ | ✅ 동일 |
| `.form-label .required` | ✓ | ✓ | ✅ 동일 |
| `.form-input` | ✓ | ✓ | ✅ 동일 |
| `.form-textarea` | ✓ | ✓ | ✅ 동일 |
| `.submit-btn` | ✓ | ✓ | ✅ 동일 |
| `.success-message` | ✓ | ✓ | ✅ 동일 |
| `.success-message-icon` | ✓ | ✓ | ✅ 동일 |
| `.success-message-title` | ✓ | ✓ | ✅ 동일 |
| `.success-message-text` | ✓ | ✓ | ✅ 동일 |
| `.help-box` | ✓ | ✓ | ✅ 동일 |
| `.help-box-icon` | ✓ | ✓ | ✅ 동일 |
| `.help-box-content` | ✓ | ✓ | ✅ 동일 |
| `.help-box-title` | ✓ | ✓ | ✅ 동일 |
| `.help-box-text` | ✓ | ✓ | ✅ 동일 |

#### 변경된 클래스명 (전역 충돌 방지)

| 용도 | HTML | React | 상태 |
|------|------|-------|------|
| 컨테이너 | `.container` | `.qna-container` | ⚠️ 접두사 추가 |
| 헤더 | `.header` | `.qna-header` | ⚠️ 접두사 추가 |
| 헤더 부제목 | `.header-subtitle` | `.qna-header-subtitle` | ⚠️ 접두사 추가 |
| 카드 | `.card` | `.qna-card` | ⚠️ 접두사 추가 |

### 7.4 FAQ 데이터 비교

| 항목 | HTML | React | 상태 |
|------|------|-------|------|
| 카테고리 수 | 7개 | 7개 | ✅ 동일 |
| FAQ 항목 수 | 47개 | 47개 | ✅ 동일 |
| 카테고리 제목 | 모두 일치 | 모두 일치 | ✅ 동일 |
| 질문 텍스트 | 모두 일치 | 모두 일치 | ✅ 동일 |
| 답변 내용 | 모두 일치 | 모두 일치 | ✅ 동일 |

#### FAQ 카테고리 목록
1. 마케팅 성과 대시보드 (7개)
2. 광고 소재별 분석 (4개)
3. 채널별 분석 & 일반 (6개)
4. 실무 가이드 & 의사결정 (6개)
5. AARRR 퍼널 대시보드 (7개)
6. 시계열 데이터 분석 (8개)
7. 트러블슈팅 & 문제해결 (4개)

### 7.5 폼 필드명 비교

| HTML ID | React formData 필드 | 상태 |
|---------|---------------------|------|
| `companyName` | `formData.companyName` | ✅ 동일 |
| `contactName` | `formData.contactName` | ✅ 동일 |
| `contactEmail` | `formData.contactEmail` | ✅ 동일 |
| `inquiryType` | `formData.inquiryType` | ✅ 동일 |
| `inquiryContent` | `formData.inquiryContent` | ✅ 동일 |

### 7.6 EmailJS 설정 비교

| 항목 | HTML | React | 상태 |
|------|------|-------|------|
| Service ID | `service_bvmgctx` | `service_bvmgctx` | ✅ 동일 |
| Template ID | `template_9mrqtki` | `template_9mrqtki` | ✅ 동일 |
| Public Key | `jpwOGZJVBg6iE3ZT0` | `jpwOGZJVBg6iE3ZT0` | ✅ 동일 |
| SDK 로드 | `<script>` 태그 | `useEffect` 동적 로드 | ⚠️ 구현방식 다름 |

### 7.7 UI 텍스트 비교

| 항목 | HTML | React | 상태 |
|------|------|-------|------|
| 페이지 제목 | FAQ & 문의하기 | FAQ & 문의하기 | ✅ 동일 |
| 부제목 | 자주 묻는 질문과 직접 문의하기 | 자주 묻는 질문과 직접 문의하기 | ✅ 동일 |
| 탭1 | 자주 묻는 질문 (FAQ) | 자주 묻는 질문 (FAQ) | ✅ 동일 |
| 탭2 | 문의하기 | 문의하기 | ✅ 동일 |
| 검색 placeholder | 질문 검색하기... | 질문 검색하기... | ✅ 동일 |
| 폼 제목 | 직접 문의하기 | 직접 문의하기 | ✅ 동일 |
| 버튼 텍스트 | 문의 발송하기 | 문의 발송하기 | ✅ 동일 |
| 도움말 제목 | 빠른 답변을 원하시나요? | 빠른 답변을 원하시나요? | ✅ 동일 |

> **참고**: QnA 페이지는 2026-01-09에 React로 신규 변환되었습니다.
> HTML의 DOM 조작 및 이벤트 리스너는 React의 useState/useMemo로 변환되어 구현방식은 다르지만 기능은 동일합니다.
> 사이드바는 Next.js 레이아웃 시스템을 사용하므로 React 컴포넌트에 포함되지 않습니다.

---

## 변경 이력

### 2026-01-09 (v6) - type/timeseries 대시보드 상수명 통일
**유형별 대시보드 함수/변수 상세 비교 (`docs/react-html-comparison.md` Section 3)**

- HTML 파일 150개+ 함수 분석 완료
- React 파일 useMemo/useCallback/useState 변환 내역 정리
- **type 상수명 통일**: `PERF_DEFAULT_LIMIT` → `DETAIL_DEFAULT_LIMIT`, `PERF_EXPANDED_LIMIT` → `DETAIL_EXPANDED_LIMIT`
- **timeseries 상수 추가**: `INITIAL_ALERTS_COUNT` (6), `INITIAL_RECOMMENDATIONS_COUNT` (4) 추가 및 하드코딩 값 대체
- 16개 하위 섹션으로 상세 분류:
  - 3.1 전역 변수/State 비교 (10개)
  - 3.2 Timeseries 필터 변수 비교 (6개)
  - 3.3 각 탭별 필터 변수 비교 (30개)
  - 3.4 상수 비교 (2개)
  - 3.5 유틸리티 함수 비교 (22개)
  - 3.6 핵심 데이터/로직 함수 비교 (7개)
  - 3.7 렌더링 함수 비교 (12개)
  - 3.8 추이 분석 함수 비교 (18개)
  - 3.9 성능 테이블 함수 비교 (13개)
  - 3.10 성능 차트 함수 비교 (12개)
  - 3.11 리타겟팅 분석 함수 비교 (8개)
  - 3.12 계절성 분석 함수 비교 (10개)
  - 3.13 예측 분석 함수 비교 (6개)
  - 3.14 UI 상태 변수 비교 (12개)
  - 3.15 데이터 경로 비교 (8개)
  - 3.16 함수 통계 요약

### 2026-01-09 (v5) - QnA 페이지 React 변환
**FAQ & 문의하기 신규 변환 (`src/app/qna/ReactView.tsx`)**

- `data/Qna.html`을 React로 완전 변환
- 7개 FAQ 카테고리, 47개 FAQ 항목 데이터 이관
- FAQ 아코디언 토글 기능 구현
- FAQ 검색 필터링 기능 구현 (useMemo)
- 문의하기 폼 + EmailJS 연동
- 34개 CSS 클래스 동일, 4개 클래스 `qna-` 접두사로 변경 (전역 충돌 방지)
- 모든 UI 텍스트, 폼 필드명, EmailJS 설정 HTML과 동일하게 유지

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
- **✅ 동일**: 22개 유틸리티 함수명, 약 80개 전역 변수명, 상수명이 HTML과 완전히 일치
- **⚠️ 구현방식 다름**: 약 100개+ 렌더링/초기화/이벤트 함수가 React 훅 패턴으로 변환 (기능 동일)

### 시계열 대시보드 (timeseries)
- **✅ 동일**: 10개 변수명 HTML 기준으로 통일 완료
- **⚠️ 구현방식 다름**: React 훅 패턴 사용 (useMemo, useCallback)

### 퍼널 대시보드 (funnel)
- **✅ 신규 변환**: 2026-01-08 React로 변환 완료
- **✅ 동일**: 모든 함수명/변수명이 HTML과 완전히 일치
- **⚠️ 구현방식 다름**: React 훅 패턴 사용 (useMemo, useCallback, D3.js)

### FAQ & 문의하기 (QnA)
- **✅ 신규 변환**: 2026-01-09 React로 변환 완료
- **✅ 동일**: 34개 CSS 클래스명, 모든 UI 텍스트, FAQ 데이터 일치
- **⚠️ 접두사 변경**: 4개 클래스 `qna-` 접두사 추가 (전역 충돌 방지)
- **⚠️ 구현방식 다름**: React 훅 패턴 사용 (useState, useMemo)

### 주요 패턴
| HTML 패턴 | React 패턴 | 함수명 |
|-----------|-----------|--------|
| `function xxx()` | `const xxx = useMemo/useCallback` | ✅ 동일하게 유지 |
| DOM 직접 조작 | JSX + 상태 기반 렌더링 | - |
| Chart.js 직접 사용 | react-chartjs-2 컴포넌트 | - |
