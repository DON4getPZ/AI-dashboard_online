# Marketing Dashboard V3 - Function Reference Guide

---

## 📋 목차

### 기본 정보
- [개요](#개요)
- [HTML 문서 기본 구조](#html-문서-기본-구조)
- [파일 정보](#파일-정보)

### 기능 명세
- [섹션별 기능 브리핑](#섹션별-기능-브리핑)
  - [1. 필터 설정](#1-필터-설정-접기펼치기)
  - [2. 통합 KPI 섹션](#2-통합-kpi-섹션)
  - [3. 차트 섹션](#3-차트-섹션)
  - [4. 데이터 테이블 섹션](#4-데이터-테이블-섹션)

### JavaScript
- [전역 변수 (Global Variables)](#전역-변수-global-variables)
- [섹션별 함수 정의](#섹션별-함수-정의)
  - [1. 데이터 로딩 및 파싱](#1-데이터-로딩-및-파싱-data-loading--parsing)
  - [2. 필터 관리](#2-필터-관리-filter-management)
  - [3. 데이터 처리](#3-데이터-처리-data-processing)
  - [4. 대시보드 업데이트](#4-대시보드-업데이트-dashboard-update)
  - [5. 테이블 확장/축소](#5-테이블-확장축소-table-expandcollapse)
  - [6. 유틸리티 함수](#6-유틸리티-함수-utility-functions)
  - [7. 이벤트 리스너](#7-이벤트-리스너-event-listeners)
- [JavaScript 핵심 함수 구현 코드](#javascript-핵심-함수-구현-코드)
  - [1. CSV 파싱 함수](#1-csv-파싱-함수-rfc-4180-호환)
  - [2. 데이터 집계 함수](#2-데이터-집계-함수)
  - [3. Chart.js 렌더링 함수](#3-chartjs-렌더링-함수-전체-설정)
  - [4. KPI 업데이트 함수](#4-kpi-업데이트-함수-증감율-계산-포함)
- [유틸리티 함수 구현](#유틸리티-함수-구현)
- [전역 변수 초기값](#전역-변수-초기값)

### HTML 구조
- [HTML 컴포넌트 매핑](#html-컴포넌트-매핑)
- [전체 HTML ID 매핑](#전체-html-id-매핑)
  - [필터 섹션 ID](#필터-섹션-id)
  - [KPI 요약 탭 ID](#kpi-요약-탭-id-전체-합계)
  - [KPI 기간별 탭 ID](#kpi-기간별-탭-id-최신-기간-데이터)
  - [KPI 증감율 ID](#kpi-증감율-id-trend)
  - [차트 섹션 ID](#차트-섹션-id)
  - [테이블 섹션 ID](#테이블-섹션-id)
- [테이블 컬럼 구조](#테이블-컬럼-구조)
- [사이드바 네비게이션 HTML 구조](#사이드바-네비게이션-html-구조)

### CSS 디자인
- [HTML/CSS 디자인 구조](#htmlcss-디자인-구조)
  - [0. 기본 CSS 리셋 및 Body 스타일](#0-기본-css-리셋-및-body-스타일)
  - [1. CSS 변수 (Design Tokens)](#1-css-변수-design-tokens---통합-필수)
  - [2. 레이아웃 구조](#2-레이아웃-구조)
  - [3. 공통 컴포넌트](#3-공통-컴포넌트-reusable-components)
  - [4. KPI 컴포넌트](#4-kpi-컴포넌트)
  - [5. 차트 컴포넌트](#5-차트-컴포넌트)
  - [6. 테이블 컴포넌트](#6-테이블-컴포넌트)
  - [7. 반응형 디자인](#7-반응형-디자인-responsive-breakpoints)
  - [8. 스크롤바 스타일](#8-스크롤바-스타일)
  - [9. 추가 CSS 클래스](#9-추가-css-클래스)
- [차트 체크박스 기본 상태](#차트-체크박스-기본-상태)

### 데이터
- [데이터 흐름 (Data Flow)](#데이터-흐름-data-flow)
- [CSV 데이터 컬럼 참조](#csv-데이터-컬럼-참조)

### 기타
- [Dead Code 및 정규화 점검 결과](#dead-code-및-정규화-점검-결과)
- [변경 이력](#변경-이력)

---

## 개요
`data/marketing_dashboard_v3.html`은 **마케팅 성과 대시보드**로, 광고 캠페인의 전반적인 성과를 분석하고 모니터링하는 대시보드입니다.

---

## HTML 문서 기본 구조

### DOCTYPE 및 Head 섹션

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>마케팅 대시보드</title>
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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

---

## 파일 정보
- **파일경로**: `data/marketing_dashboard_v3.html`
- **데이터 소스**: `raw/raw_data.csv`
- **차트 라이브러리**: Chart.js (CDN)

---

## 섹션별 기능 브리핑

### 1. 필터 설정 (접기/펼치기)
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 필터 설정 |
| **위치** | Line 1209-1281 |
| **JS 함수** | `setDateRange()`, `populateFilters()`, `updateBrandFilter()`, `updateProductFilter()`, `updatePromotionFilter()`, `updateDetailFilters()`, `updateSetNameFilter()` |
| **참조 데이터** | `allData` (raw_data.csv) |
| **기능** | - 접기/펼치기 토글 기능<br>- 기간 선택 + 기본 필터 통합 레이아웃<br>- 세부 필터 (캠페인, 세트이름) |

### 2. 통합 KPI 섹션
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 통합 KPI 섹션 |
| **위치** | Line 1283-1484 |
| **JS 함수** | `updateKPIs()` |
| **참조 데이터** | `aggregateData()` 결과 |
| **기능** | - 전체/일별/주별/월별 탭<br>- 주요 성과/세부 성과 토글<br>- 증감율/퍼센트 포인트 표시 |

### 3. 차트 섹션
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 성과 추이 차트 |
| **위치** | Line 1486-1530 |
| **JS 함수** | `updateChart()`, `renderChart()` |
| **참조 데이터** | `currentChartData` |
| **기능** | - 체크박스로 지표 선택 (비용, CPM, CPC, CPA, ROAS)<br>- 듀얼 Y축 (Bar + Line 콤보) |

### 4. 데이터 테이블 섹션
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 상세 데이터 |
| **위치** | Line 1532-1570 |
| **JS 함수** | `updateTable()`, `expandTableRows()`, `collapseTableRows()` |
| **참조 데이터** | `aggregateData()` 결과 |
| **기능** | - 기간별 상세 데이터 표시<br>- 합계 행 포함<br>- 더보기/접기 버튼 |

---

## 전역 변수 (Global Variables)

| 변수명 | 타입 | 참조데이터 | 기능 |
|--------|------|-----------|------|
| `allData` | Array | raw_data.csv | 전체 CSV 데이터 저장 |
| `currentView` | String | - | 현재 뷰 타입 (daily/weekly/monthly) |
| `filters` | Object | - | 필터 조건 저장 (type, brand, product, promotion, startDate, endDate, campaign, setName) |
| `trendChart` | Chart | - | Chart.js 인스턴스 |
| `currentChartData` | Array | - | 현재 차트에 표시되는 집계 데이터 |
| `TABLE_ROW_LIMIT` | Number | - | 테이블 행 제한 (기본값: 10) |
| `isTableExpanded` | Boolean | - | 테이블 확장 상태 |

---

## 섹션별 함수 정의

### 1. 데이터 로딩 및 파싱 (Data Loading & Parsing)

| 섹션 헤드 이름 | .JS 함수명 | 참조데이터 | 기능 |
|---------------|-----------|-----------|------|
| CSV 파싱 | `parseCSV(text)` | raw_data.csv 텍스트 | RFC 4180 호환 CSV 파싱. 따옴표 이스케이프 처리, 헤더 기반 객체 배열 반환 |
| 데이터 로드 | `loadData()` | csvFiles 배열 | 비동기 데이터 로드. fetch로 CSV 파일 호출 후 파싱, 필터 초기화, 대시보드 업데이트 실행 |

#### parseCSV 상세
```javascript
// 내부 함수: parseLine(line)
// - 따옴표 처리 (연속 따옴표 = 이스케이프)
// - 쉼표 구분자 인식
// - 필드 배열 반환
```

---

### 2. 필터 관리 (Filter Management)

| 섹션 헤드 이름 | .JS 함수명 | 참조데이터 | 기능 |
|---------------|-----------|-----------|------|
| 필터 초기화 | `populateFilters()` | allData['유형구분'] | 유형구분 드롭다운 옵션 설정. 브랜드명 필터 업데이트 호출 |
| 브랜드 필터 | `updateBrandFilter()` | allData['브랜드명'] | 유형구분 기준 필터링된 브랜드명 옵션 설정. 기존 선택값 유지/초기화 처리 |
| 상품 필터 | `updateProductFilter()` | allData['상품명'] | 브랜드명 기준 필터링된 상품명 옵션 설정. 계층 구조 종속 |
| 프로모션 필터 | `updatePromotionFilter()` | allData['프로모션'] | 상품명 기준 필터링된 프로모션 옵션 설정 |
| 드롭다운 설정 | `populateSelect(id, options)` | - | select 요소에 option 추가하는 유틸리티 함수 |
| 세부 필터 | `updateDetailFilters()` | allData['캠페인'] | 기본 필터 조건을 만족하는 데이터에서 캠페인 옵션 추출 |
| 세트이름 필터 | `updateSetNameFilter()` | allData['세트이름'] | 캠페인 기준 필터링된 세트이름 옵션 설정 |
| 날짜 범위 | `setDateRange()` | allData['일 구분'] | 데이터의 최소/최대 날짜로 기간 입력 필드 초기화 |
| 날짜 포맷 | `formatDateForInput(date)` | - | Date 객체를 YYYY-MM-DD 형식 문자열로 변환 |

#### 필터 계층 구조
```
유형구분 → 브랜드명 → 상품명 → 프로모션
                                    ↓
             캠페인 → 세트이름  ← (기본 필터 + 기간 조건)
```

---

### 3. 데이터 처리 (Data Processing)

| 섹션 헤드 이름 | .JS 함수명 | 참조데이터 | 기능 |
|---------------|-----------|-----------|------|
| 데이터 필터링 | `filterData()` | allData, filters 객체 | 현재 필터 조건에 맞는 데이터 필터링. 유형구분, 브랜드명, 상품명, 프로모션, 기간, 캠페인, 세트이름 조건 적용 |
| 데이터 집계 | `aggregateData(data)` | 필터링된 데이터 | currentView에 따라 일/주/월 단위로 그룹핑. KPI 계산 (CPM, CPC, CPA, ROAS) 후 날짜순 정렬 |

#### aggregateData 집계 기준
| currentView | 그룹 키 | 설명 |
|-------------|--------|------|
| daily | 일 구분 | 일별 집계 |
| weekly | 주 구분 | 주별 집계 |
| monthly | 월 구분 | 월별 집계 |

#### KPI 계산 공식
```javascript
CPM  = (비용 / 노출) * 1000    // 1,000회 노출당 비용
CPC  = 비용 / 클릭             // 클릭당 비용
CPA  = 비용 / 전환수           // 전환당 비용
ROAS = (전환값 / 비용) * 100   // 광고 수익률 (%)
```

---

### 4. 대시보드 업데이트 (Dashboard Update)

| 섹션 헤드 이름 | .JS 함수명 | 참조데이터 | 기능 |
|---------------|-----------|-----------|------|
| 대시보드 갱신 | `updateDashboard()` | - | 필터링 → 집계 → KPI/차트/테이블 업데이트 통합 함수 |
| 차트 데이터 | `updateChart(data)` | 집계 데이터 | currentChartData 저장 후 renderChart 호출 |
| 차트 렌더링 | `renderChart()` | currentChartData | Chart.js 인스턴스 생성/재생성. 체크박스 상태에 따라 데이터셋 동적 구성 |
| KPI 업데이트 | `updateKPIs(data)` | 집계 데이터 | 요약 KPI 및 기간별 KPI 카드 값 업데이트. 증감율 계산 |
| 테이블 갱신 | `updateTable(data)` | 집계 데이터 | 데이터 테이블 HTML 생성. 합계 행 추가, 더보기 버튼 제어 |

#### renderChart 차트 구성

| 지표 | 차트 타입 | Y축 | 색상 |
|------|----------|-----|------|
| 비용 | Bar | Left (y) | #673ab7 (보라) |
| CPM | Line | Right (y1) | #ffab00 (주황) |
| CPC | Line | Right (y1) | #2196f3 (파랑) |
| CPA | Line | Right (y1) | #ff9800 (오렌지) |
| ROAS | Line (filled) | Right (y1) | #00c853 (초록) |

#### updateKPIs 증감율 계산
- **비교 기준**: 마지막 기간 vs 직전 기간
- **증감율 공식**: `((newVal - oldVal) / oldVal) * 100`
- **퍼센트 포인트**: ROAS는 `newVal - oldVal`로 %p 표시
- **긍정/부정 판단**:
  - 비용, 노출, 클릭, 전환수, 전환값, ROAS: 증가 = 긍정
  - CPM, CPC, CPA: 감소 = 긍정

---

### 5. 테이블 확장/축소 (Table Expand/Collapse)

| 섹션 헤드 이름 | .JS 함수명 | 참조데이터 | 기능 |
|---------------|-----------|-----------|------|
| 테이블 확장 | `expandTableRows()` | #tableBody 행들 | hidden-row 클래스 제거, 더보기 버튼 숨김, 접기 버튼 표시 |
| 테이블 축소 | `collapseTableRows()` | #tableBody 행들 | TABLE_ROW_LIMIT 이후 행에 hidden-row 추가, 더보기 버튼 표시 |

---

### 6. 유틸리티 함수 (Utility Functions)

| 섹션 헤드 이름 | .JS 함수명 | 참조데이터 | 기능 |
|---------------|-----------|-----------|------|
| 숫자 포맷 | `formatNumber(num)` | - | 천 단위 쉼표 추가. 0/null/undefined는 '-' 반환 |
| ROAS 포맷 | `formatROAS(num)` | - | 정수 반올림 후 '%' 추가. 0/null/undefined는 '-' 반환 |

---

### 7. 이벤트 리스너 (Event Listeners)

| 섹션 헤드 이름 | 바인딩 대상 | 이벤트 | 기능 |
|---------------|------------|--------|------|
| 필터 섹션 토글 | `.collapsible-header` | click | 필터 설정 영역 접기/펼치기 |
| 유형구분 변경 | `#filterType` | change | 하위 필터 업데이트 + 대시보드 갱신 |
| 브랜드명 변경 | `#filterBrand` | change | 상품/프로모션/세부 필터 업데이트 |
| 상품명 변경 | `#filterProduct` | change | 프로모션/세부 필터 업데이트 |
| 프로모션 변경 | `#filterPromotion` | change | 세부 필터 업데이트 |
| 시작일 변경 | `#startDate` | change | 세부 필터 + 대시보드 갱신 |
| 종료일 변경 | `#endDate` | change | 세부 필터 + 대시보드 갱신 |
| 캠페인 변경 | `#filterCampaign` | change | 세트이름 필터 업데이트 |
| 세트이름 변경 | `#filterSetName` | change | 대시보드 갱신 |
| KPI 탭 전환 | `.kpi-tab` | click | 전체/일별/주별/월별 탭 전환. currentView 변경 |
| KPI 뷰 토글 | `.kpi-view-btn` | click | 주요 성과/세부 성과 토글 |
| 차트 체크박스 | `#chart*` | change | 차트 재렌더링 |
| 더보기 버튼 | `#showMoreBtn` | click | expandTableRows 호출 |
| 접기 버튼 | `#collapseBtn` | click | collapseTableRows 호출 |

---

## HTML 컴포넌트 매핑

### 필터 섹션
| 컴포넌트 | ID/Class | 관련 함수 |
|----------|----------|-----------|
| 기간 선택 | `#startDate`, `#endDate` | setDateRange, updateDetailFilters |
| 유형구분 | `#filterType` | populateFilters |
| 브랜드명 | `#filterBrand` | updateBrandFilter |
| 상품명 | `#filterProduct` | updateProductFilter |
| 프로모션 | `#filterPromotion` | updatePromotionFilter |
| 캠페인 | `#filterCampaign` | updateDetailFilters |
| 세트이름 | `#filterSetName` | updateSetNameFilter |

### KPI 섹션
| 컴포넌트 | ID | 관련 함수 |
|----------|-------|-----------|
| 총 비용 (요약) | `#summaryTotalCost` | updateKPIs |
| ROAS (요약) | `#summaryTotalROAS` | updateKPIs |
| CPA (요약) | `#summaryAvgCPA` | updateKPIs |
| CPC (요약) | `#summaryAvgCPC` | updateKPIs |
| CPM (요약) | `#summaryAvgCPM` | updateKPIs |
| 총 노출 | `#summaryTotalImpressions` | updateKPIs |
| 총 클릭 | `#summaryTotalClicks` | updateKPIs |
| 총 전환수 | `#summaryTotalConversions` | updateKPIs |
| 총 전환값 | `#summaryTotalConversionValue` | updateKPIs |
| 비용 (기간별) | `#totalCost` | updateKPIs |
| ROAS (기간별) | `#totalROAS` | updateKPIs |
| 증감율 요소 | `#trend*`, `#trend*PP`, `#trend*Detail` | updateKPIs |

### 차트 섹션
| 컴포넌트 | ID | 관련 함수 |
|----------|-------|-----------|
| 차트 캔버스 | `#trendChart` | renderChart |
| 비용 체크박스 | `#chartCost` | renderChart |
| CPM 체크박스 | `#chartCPM` | renderChart |
| CPC 체크박스 | `#chartCPC` | renderChart |
| CPA 체크박스 | `#chartCPA` | renderChart |
| ROAS 체크박스 | `#chartROAS` | renderChart |

### 테이블 섹션
| 컴포넌트 | ID | 관련 함수 |
|----------|-------|-----------|
| 테이블 본문 | `#tableBody` | updateTable |
| 더보기 컨테이너 | `#showMoreContainer` | updateTable, expandTableRows |
| 숨겨진 행 수 | `#hiddenCount` | updateTable, collapseTableRows |
| 접기 컨테이너 | `#collapseContainer` | expandTableRows, collapseTableRows |

---

## 데이터 흐름 (Data Flow)

```
[CSV 파일] → loadData() → parseCSV() → allData
                              ↓
                     populateFilters()
                     setDateRange()
                     updateDetailFilters()
                              ↓
                     updateDashboard()
                              ↓
           ┌─────────────────┼─────────────────┐
           ↓                 ↓                 ↓
    filterData()      aggregateData()         ↓
           ↓                 ↓                 ↓
      updateKPIs()     updateChart()     updateTable()
           ↓                 ↓                 ↓
      [KPI 카드]      renderChart()     [데이터 테이블]
                           ↓
                      [Chart.js]
```

---

## CSV 데이터 컬럼 참조

| 컬럼명 | 용도 | 관련 함수 |
|--------|------|-----------|
| 유형구분 | 필터 | populateFilters, filterData |
| 브랜드명 | 필터 | updateBrandFilter, filterData |
| 상품명 | 필터 | updateProductFilter, filterData |
| 프로모션 | 필터 | updatePromotionFilter, filterData |
| 일 구분 | 기간 필터/집계 | setDateRange, filterData, aggregateData |
| 주 구분 | 집계 | aggregateData |
| 월 구분 | 집계 | aggregateData |
| 캠페인 | 세부 필터 | updateDetailFilters, filterData |
| 세트이름 | 세부 필터 | updateSetNameFilter, filterData |
| 비용 | KPI/차트/테이블 | aggregateData, updateKPIs, updateTable |
| 노출 | KPI/차트/테이블 | aggregateData, updateKPIs, updateTable |
| 클릭 | KPI/차트/테이블 | aggregateData, updateKPIs, updateTable |
| 전환수 | KPI/차트/테이블 | aggregateData, updateKPIs, updateTable |
| 전환값 | KPI/차트/테이블 | aggregateData, updateKPIs, updateTable |

---

## Dead Code 및 정규화 점검 결과

> **상태**: 2024-12-08 정리 완료

### 1. JavaScript Dead Code - 삭제 완료

| 삭제된 코드 | 설명 |
|------------|------|
| `calcPP()` 함수 | 정의만 되고 미호출 (인라인 계산으로 대체됨) |

### 2. CSS Dead Code - 삭제 완료

| 삭제된 클래스 | 설명 |
|--------------|------|
| `.view-type-section`, `.view-btn*` | 뷰 타입 버튼 스타일 전체 |
| `.kpi-legacy-section` | 레거시 KPI 섹션 |
| `.kpi-wrapper`, `.kpi-row-primary/secondary` | 기존 KPI 행 스타일 |
| `.kpi-summary`, `.kpi-simple` | 요약 KPI 스타일 |
| `.mobile-menu-btn` | 모바일 메뉴 버튼 |

### 3. HTML Dead Class - 삭제 완료

| 삭제된 클래스 | 설명 |
|--------------|------|
| `kpi-period-section` | CSS 미정의 클래스 제거 |

### 4. 변수명 정규화 - 완료

| 변경 전 | 변경 후 | 설명 |
|---------|---------|------|
| `filters.extra` | `filters.promotion` | 필터 객체 속성 |
| `filterExtra` | `filterPromotion` | HTML ID |
| `updateExtraFilter()` | `updatePromotionFilter()` | 함수명 |
| `extras`, `currentExtra`, `extraSelect` | `promotions`, `currentPromotion`, `promotionSelect` | 지역 변수 |

### 5. 주석 정규화 - 완료

| 변경 전 | 변경 후 |
|---------|---------|
| "추가구분" | "프로모션" |

---

## 정리 결과 요약

| 구분 | 삭제/변경 항목 |
|------|---------------|
| **JS Dead Code** | `calcPP()` 함수 삭제 |
| **CSS Dead Code** | 10개 클래스 (~100줄) 삭제 |
| **HTML Dead Class** | `kpi-period-section` 클래스 제거 |
| **변수 정규화** | `extra` → `promotion` 전체 변경 |
| **주석 정규화** | "추가구분" → "프로모션" 전체 변경 |

---

## HTML/CSS 디자인 구조

### 0. 기본 CSS 리셋 및 Body 스타일

> **통합 시 필수**: 모든 HTML 파일에서 동일하게 적용

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

---

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

### 2. 레이아웃 구조

#### 2.1 앱 래퍼 `.app-wrapper`

```css
.app-wrapper {
    display: flex;
    min-height: 100vh;
}
```

#### 2.2 사이드바 `.sidebar`

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

.sidebar-logo-text {
    font-size: 18px;
    font-weight: 700;
    color: var(--grey-900);
}

.sidebar-logo-subtitle {
    font-size: 11px;
    color: var(--grey-500);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
```

#### 2.3 네비게이션 `.nav-*`

```css
.nav-group {
    margin-bottom: 16px;
}

.nav-group-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--grey-500);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 8px 16px;
    margin-bottom: 4px;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    color: var(--grey-700);
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
}

.nav-item:hover {
    background: var(--grey-100);
    color: var(--primary-main);
}

.nav-item.active {
    background: var(--primary-light);
    color: var(--primary-main);
}
```

#### 2.4 메인 컨텐츠 `.main-content`

```css
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

#### 2.5 헤더 컴포넌트 `.header`

```css
.header {
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header h1 {
    font-size: 24px;
    font-weight: 700;
    color: var(--grey-900);
}

.header-subtitle {
    font-size: 14px;
    color: var(--grey-500);
    margin-top: 4px;
}
```

**HTML 구조**:
```html
<div class="header">
    <div>
        <h1>마케팅 성과 대시보드</h1>
        <div class="header-subtitle">광고 캠페인 성과 분석 및 KPI 모니터링</div>
    </div>
</div>
```

---

### 3. 공통 컴포넌트 (Reusable Components)

#### 3.1 카드 컴포넌트 `.card`

> **통합 우선순위**: 높음 - 모든 페이지에서 사용

```css
.card {
    background: var(--paper);
    border-radius: 12px;
    box-shadow: 0 2px 14px 0 rgba(32, 40, 45, 0.08);
    transition: box-shadow 0.3s ease;
}
.card:hover {
    box-shadow: 0 4px 20px 0 rgba(32, 40, 45, 0.12);
}
```

**HTML 구조**:
```html
<div class="card">
    <!-- 내용 -->
</div>
```

---

#### 3.2 접기/펼치기 컴포넌트 `.collapsible-*`

> **통합 우선순위**: 높음 - 필터 영역 등 재사용 가능

| 클래스 | CSS 속성 | 설명 |
|--------|----------|------|
| `.collapsible-section` | `margin-bottom: 24px` | 섹션 래퍼 |
| `.collapsible-header` | `display: flex; padding: 16px 20px; background: var(--paper); border-radius: 12px; cursor: pointer;` | 클릭 가능한 헤더 |
| `.collapsible-title` | `font-size: 16px; font-weight: 600;` + `::before` 보라색 바 | 섹션 제목 |
| `.collapsible-toggle` | `padding: 8px 16px; background: var(--primary-light); color: var(--primary-main); border-radius: 8px;` | 토글 버튼 |
| `.collapsible-toggle:hover` | `background: var(--primary-main); color: white;` | hover 상태 |
| `.collapsible-toggle-icon` | `transform: rotate(180deg); transition: transform 0.2s ease;` | 아이콘 (펼침) |
| `.collapsible-toggle-icon.collapsed` | `transform: rotate(0deg);` | 아이콘 (접힘) |
| `.collapsible-content` | `max-height: 0; overflow: hidden; opacity: 0; transition: all 0.3s ease;` | 콘텐츠 (접힘) |
| `.collapsible-content.expanded` | `max-height: 2000px; opacity: 1; padding-top: 16px;` | 콘텐츠 (펼침) |

**HTML 구조 - 필터 설정 전체**:
```html
<!-- 필터 설정 (접기/펼치기) -->
<div class="collapsible-section">
    <div class="collapsible-header" id="filterCollapsibleHeader">
        <div class="collapsible-title">필터 설정</div>
        <button class="collapsible-toggle">
            <span>펼치기</span>
            <span class="collapsible-toggle-icon collapsed">▼</span>
        </button>
    </div>
    <div class="collapsible-content" id="filterCollapsibleContent">
        <!-- 기간 선택 + 기본 필터 -->
        <div class="filter-section card" style="margin-bottom: 16px;">
            <div class="filter-inline-container">
                <!-- 기간 선택 -->
                <div class="filter-date-section">
                    <div class="filter-label">기간 선택</div>
                    <div class="date-range">
                        <input type="date" id="startDate">
                        <span>~</span>
                        <input type="date" id="endDate">
                    </div>
                </div>
                <!-- 기본 필터 -->
                <div class="filter-setting-section">
                    <div class="filter-label">기본 필터</div>
                    <div class="filter-items">
                        <div class="filter-group">
                            <label>유형구분</label>
                            <select id="filterType">
                                <option value="">전체</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>브랜드명</label>
                            <select id="filterBrand">
                                <option value="">전체</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>상품명</label>
                            <select id="filterProduct">
                                <option value="">전체</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>프로모션</label>
                            <select id="filterPromotion">
                                <option value="">전체</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- 세부 필터 -->
        <div class="filter-section card">
            <div class="filter-header">세부 필터</div>
            <div class="filter-row">
                <div class="filter-group">
                    <label>캠페인</label>
                    <select id="filterCampaign">
                        <option value="">전체</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>세트이름</label>
                    <select id="filterSetName">
                        <option value="">전체</option>
                    </select>
                </div>
            </div>
        </div>
    </div>
</div>
```

**JavaScript 토글 로직**:
```javascript
filterCollapsibleHeader.addEventListener('click', () => {
    const toggle = filterCollapsibleHeader.querySelector('.collapsible-toggle');
    const toggleText = toggle.querySelector('span:first-child');
    const toggleIcon = toggle.querySelector('.collapsible-toggle-icon');

    if (filterCollapsibleContent.classList.contains('expanded')) {
        filterCollapsibleContent.classList.remove('expanded');
        toggleText.textContent = '펼치기';
        toggleIcon.classList.add('collapsed');
    } else {
        filterCollapsibleContent.classList.add('expanded');
        toggleText.textContent = '접기';
        toggleIcon.classList.remove('collapsed');
    }
});
```

---

#### 3.3 필터 컴포넌트 `.filter-*`

> **통합 우선순위**: 높음 - 모든 대시보드에서 사용

| 클래스 | CSS 속성 | 설명 |
|--------|----------|------|
| `.filter-section` | `padding: 20px 24px; margin-bottom: 24px;` | 필터 섹션 래퍼 |
| `.filter-header` | `font-size: 16px; font-weight: 600;` + `::before` 보라색 바 | 섹션 헤더 |
| `.filter-row` | `display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 16px;` | 필터 행 |
| `.filter-group` | `display: flex; flex-direction: column; min-width: 160px; flex: 1;` | 개별 필터 |
| `.filter-group label` | `font-size: 12px; font-weight: 500; text-transform: uppercase;` | 라벨 |
| `.filter-group select/input` | `padding: 10px 14px; border: 1px solid var(--grey-300); border-radius: 8px;` | 입력 필드 |
| `.filter-group select:focus` | `border-color: var(--primary-main); box-shadow: 0 0 0 3px var(--primary-light);` | 포커스 상태 |

**통합 레이아웃** (`filter-inline-container`):
```css
.filter-inline-container {
    display: flex;
    align-items: flex-start;
    gap: 48px;
    flex-wrap: wrap;
}
.filter-date-section {
    display: flex;
    flex-direction: column;
    gap: 37px;
}
.filter-date-section .filter-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--grey-900);
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
}
.filter-date-section .filter-label::before {
    content: '';
    width: 4px;
    height: 18px;
    background: var(--primary-main);
    border-radius: 2px;
}
.filter-setting-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
}
.filter-setting-section .filter-items {
    display: flex;
    align-items: flex-end;
    gap: 16px;
    flex: 1;
}
```

---

#### 3.4 날짜 범위 컴포넌트 `.date-range`

```css
.date-range {
    display: flex;
    align-items: center;
    gap: 12px;
}

.date-range input[type="date"] {
    padding: 10px 14px;
    border: 1px solid var(--grey-300);
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    background: var(--paper);
    color: var(--grey-900);
    transition: all 0.2s ease;
}

.date-range input[type="date"]:hover {
    border-color: var(--primary-main);
}

.date-range input[type="date"]:focus {
    outline: none;
    border-color: var(--primary-main);
    box-shadow: 0 0 0 3px var(--primary-light);
}

.date-range span {
    color: var(--grey-500);
    font-weight: 500;
}
```

**HTML 구조**:
```html
<div class="date-range">
    <input type="date" id="startDate">
    <span>~</span>
    <input type="date" id="endDate">
</div>
```

---

### 4. KPI 컴포넌트

#### 4.1 KPI 그리드 `.kpi-grid`

```css
.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}
```

#### 4.2 KPI 카드 `.kpi-card`

```css
.kpi-card {
    background: var(--paper);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    position: relative;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
}

.kpi-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.1);
}

.kpi-card.highlight {
    border-left: 4px solid var(--primary-main);
}

.kpi-card.secondary {
    background: var(--grey-50);
}

.kpi-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.kpi-title {
    font-size: 13px;
    color: var(--grey-600);
    font-weight: 600;
}

.kpi-icon {
    width: 36px;
    height: 36px;
    background: var(--grey-100);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary-main);
    font-size: 16px;
}

.kpi-value {
    font-size: 26px;
    font-weight: 700;
    color: var(--grey-900);
    margin-bottom: 8px;
}

.kpi-value.highlight-value {
    color: var(--primary-main);
}
```

#### 4.3 KPI 증감 표시 `.kpi-trend`

```css
.kpi-trend {
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
}
/* .kpi-trend.up/down/neutral → 9.8 KPI Trend 상세 스타일 참조 */

.kpi-card .trend {
    display: inline-flex;
    align-items: center;
    gap: 1px;
    font-size: 9px;
    font-weight: 600;
    padding: 1px 4px;
    border-radius: 8px;
}

.kpi-card .trend.up {
    color: var(--success-main);
    background: var(--success-light);
}

.kpi-card .trend.down {
    color: var(--error-main);
    background: var(--error-light);
}

.kpi-card .trend-pp {
    display: inline-flex;
    align-items: center;
    gap: 1px;
    font-size: 9px;
    font-weight: 600;
    padding: 1px 4px;
    border-radius: 8px;
    background: var(--grey-100);
    color: var(--grey-700);
}

.kpi-card .trend-pp.positive {
    color: var(--success-main);
    background: var(--success-light);
}

.kpi-card .trend-pp.negative {
    color: var(--error-main);
    background: var(--error-light);
}
```

#### 4.4 KPI 탭/뷰 토글

```css
.kpi-tab-section {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
}

.kpi-tab {
    padding: 10px 24px;
    border: none;
    background: var(--paper);
    color: var(--grey-700);
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.kpi-tab:hover {
    background: var(--primary-light);
    color: var(--primary-main);
}

.kpi-tab.active {
    background: var(--primary-main);
    color: white;
    box-shadow: 0 4px 12px rgba(103, 58, 183, 0.4);
}

.kpi-view-toggle {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
}

.kpi-view-btn {
    padding: 10px 24px;
    border: none;
    background: var(--paper);
    color: var(--grey-700);
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.kpi-view-btn.active {
    background: var(--primary-main);
    color: white;
    box-shadow: 0 4px 12px rgba(103, 58, 183, 0.4);
}
```

**HTML 구조 - 전체 탭 (kpiTabTotal)**:
```html
<div class="kpi-unified-section">
    <!-- 기간 탭 -->
    <div class="kpi-tab-section">
        <button class="kpi-tab active" data-kpi-tab="total">전체</button>
        <button class="kpi-tab" data-kpi-tab="daily">일별</button>
        <button class="kpi-tab" data-kpi-tab="weekly">주별</button>
        <button class="kpi-tab" data-kpi-tab="monthly">월별</button>
    </div>
    <!-- 주요/세부 성과 토글 -->
    <div class="kpi-view-toggle">
        <button class="kpi-view-btn active" data-kpi-view="primary">주요 성과</button>
        <button class="kpi-view-btn" data-kpi-view="all">세부 성과</button>
    </div>

    <!-- 전체 탭 콘텐츠 (요약 데이터) -->
    <div class="kpi-tab-content active" id="kpiTabTotal">
        <div class="kpi-section">
            <section class="kpi-grid kpi-grid-primary">
                <div class="kpi-card">
                    <div class="kpi-header">
                        <span class="kpi-title">총 비용</span>
                        <div class="kpi-icon">💰</div>
                    </div>
                    <div class="kpi-value" id="summaryTotalCost">-</div>
                    <div class="kpi-trend neutral"><span>전체 기간 합계</span></div>
                </div>
                <div class="kpi-card highlight">
                    <div class="kpi-header">
                        <span class="kpi-title">ROAS</span>
                        <div class="kpi-icon">📈</div>
                    </div>
                    <div class="kpi-value highlight-value" id="summaryTotalROAS">-</div>
                    <div class="kpi-trend neutral"><span>광고 수익률</span></div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-header">
                        <span class="kpi-title">CPA</span>
                        <div class="kpi-icon">🎯</div>
                    </div>
                    <div class="kpi-value" id="summaryAvgCPA">-</div>
                    <div class="kpi-trend neutral"><span>전환당 비용</span></div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-header">
                        <span class="kpi-title">CPC</span>
                        <div class="kpi-icon">🖱️</div>
                    </div>
                    <div class="kpi-value" id="summaryAvgCPC">-</div>
                    <div class="kpi-trend neutral"><span>클릭당 비용</span></div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-header">
                        <span class="kpi-title">CPM</span>
                        <div class="kpi-icon">👁️</div>
                    </div>
                    <div class="kpi-value" id="summaryAvgCPM">-</div>
                    <div class="kpi-trend neutral"><span>노출당 비용</span></div>
                </div>
            </section>
            <section class="kpi-grid kpi-grid-secondary">
                <div class="kpi-card secondary">
                    <div class="kpi-header">
                        <span class="kpi-title">총 노출</span>
                        <div class="kpi-icon">👀</div>
                    </div>
                    <div class="kpi-value" id="summaryTotalImpressions">-</div>
                    <div class="kpi-trend neutral"><span>회</span></div>
                </div>
                <div class="kpi-card secondary">
                    <div class="kpi-header">
                        <span class="kpi-title">총 클릭</span>
                        <div class="kpi-icon">👆</div>
                    </div>
                    <div class="kpi-value" id="summaryTotalClicks">-</div>
                    <div class="kpi-trend neutral"><span>회</span></div>
                </div>
                <div class="kpi-card secondary">
                    <div class="kpi-header">
                        <span class="kpi-title">총 전환수</span>
                        <div class="kpi-icon">✅</div>
                    </div>
                    <div class="kpi-value" id="summaryTotalConversions">-</div>
                    <div class="kpi-trend neutral"><span>건</span></div>
                </div>
                <div class="kpi-card secondary">
                    <div class="kpi-header">
                        <span class="kpi-title">총 전환값</span>
                        <div class="kpi-icon">💵</div>
                    </div>
                    <div class="kpi-value" id="summaryTotalConversionValue">-</div>
                    <div class="kpi-trend neutral"><span>원</span></div>
                </div>
            </section>
        </div>
    </div>

    <!-- 기간별 탭 콘텐츠 (일별/주별/월별 - 트렌드 포함) -->
    <div class="kpi-tab-content" id="kpiTabPeriod">
        <div class="kpi-section">
            <section class="kpi-grid kpi-grid-primary">
                <div class="kpi-card">
                    <div class="kpi-header">
                        <span class="kpi-title">비용</span>
                        <div class="kpi-icon">💰</div>
                    </div>
                    <div class="kpi-value" id="totalCost">-</div>
                    <div class="kpi-trend" id="trendCost">
                        <span class="trend-value">-</span>
                        <span class="trend-pp" id="trendCostPP"></span>
                    </div>
                    <div class="trend-detail" id="trendCostDetail"></div>
                </div>
                <div class="kpi-card highlight">
                    <div class="kpi-header">
                        <span class="kpi-title">ROAS</span>
                        <div class="kpi-icon">📈</div>
                    </div>
                    <div class="kpi-value highlight-value" id="totalROAS">-</div>
                    <div class="kpi-trend" id="trendROAS">
                        <span class="trend-value">-</span>
                        <span class="trend-pp" id="trendROASPP"></span>
                    </div>
                    <div class="trend-detail" id="trendROASDetail"></div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-header">
                        <span class="kpi-title">CPA</span>
                        <div class="kpi-icon">🎯</div>
                    </div>
                    <div class="kpi-value" id="avgCPA">-</div>
                    <div class="kpi-trend" id="trendCPA">
                        <span class="trend-value">-</span>
                        <span class="trend-pp" id="trendCPAPP"></span>
                    </div>
                    <div class="trend-detail" id="trendCPADetail"></div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-header">
                        <span class="kpi-title">CPC</span>
                        <div class="kpi-icon">🖱️</div>
                    </div>
                    <div class="kpi-value" id="avgCPC">-</div>
                    <div class="kpi-trend" id="trendCPC">
                        <span class="trend-value">-</span>
                        <span class="trend-pp" id="trendCPCPP"></span>
                    </div>
                    <div class="trend-detail" id="trendCPCDetail"></div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-header">
                        <span class="kpi-title">CPM</span>
                        <div class="kpi-icon">👁️</div>
                    </div>
                    <div class="kpi-value" id="avgCPM">-</div>
                    <div class="kpi-trend" id="trendCPM">
                        <span class="trend-value">-</span>
                        <span class="trend-pp" id="trendCPMPP"></span>
                    </div>
                    <div class="trend-detail" id="trendCPMDetail"></div>
                </div>
            </section>
            <section class="kpi-grid kpi-grid-secondary">
                <div class="kpi-card secondary">
                    <div class="kpi-header">
                        <span class="kpi-title">노출</span>
                        <div class="kpi-icon">👀</div>
                    </div>
                    <div class="kpi-value" id="totalImpressions">-</div>
                    <div class="kpi-trend" id="trendImpressions">
                        <span class="trend-value">-</span>
                        <span class="trend-pp" id="trendImpressionsPP"></span>
                    </div>
                    <div class="trend-detail" id="trendImpressionsDetail"></div>
                </div>
                <div class="kpi-card secondary">
                    <div class="kpi-header">
                        <span class="kpi-title">클릭</span>
                        <div class="kpi-icon">👆</div>
                    </div>
                    <div class="kpi-value" id="totalClicks">-</div>
                    <div class="kpi-trend" id="trendClicks">
                        <span class="trend-value">-</span>
                        <span class="trend-pp" id="trendClicksPP"></span>
                    </div>
                    <div class="trend-detail" id="trendClicksDetail"></div>
                </div>
                <div class="kpi-card secondary">
                    <div class="kpi-header">
                        <span class="kpi-title">전환수</span>
                        <div class="kpi-icon">✅</div>
                    </div>
                    <div class="kpi-value" id="totalConversions">-</div>
                    <div class="kpi-trend" id="trendConversions">
                        <span class="trend-value">-</span>
                        <span class="trend-pp" id="trendConversionsPP"></span>
                    </div>
                    <div class="trend-detail" id="trendConversionsDetail"></div>
                </div>
                <div class="kpi-card secondary">
                    <div class="kpi-header">
                        <span class="kpi-title">전환값</span>
                        <div class="kpi-icon">💵</div>
                    </div>
                    <div class="kpi-value" id="totalConversionValue">-</div>
                    <div class="kpi-trend" id="trendConversionValue">
                        <span class="trend-value">-</span>
                        <span class="trend-pp" id="trendConversionValuePP"></span>
                    </div>
                    <div class="trend-detail" id="trendConversionValueDetail"></div>
                </div>
            </section>
        </div>
    </div>
</div>
```

### KPI 카드 아이콘 매핑
| KPI | 아이콘 | 설명 |
|-----|--------|------|
| 총 비용 / 비용 | 💰 | 비용 지표 |
| ROAS | 📈 | 광고 수익률 |
| CPA | 🎯 | 전환당 비용 |
| CPC | 🖱️ | 클릭당 비용 |
| CPM | 👁️ | 노출당 비용 |
| 총 노출 / 노출 | 👀 | 노출 수 |
| 총 클릭 / 클릭 | 👆 | 클릭 수 |
| 총 전환수 / 전환수 | ✅ | 전환 수 |
| 총 전환값 / 전환값 | 💵 | 전환 금액 |

---

### 5. 차트 컴포넌트

#### 5.1 차트 섹션 `.chart-section`

```css
.chart-section {
    margin-bottom: 24px;
    padding: 24px;
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
    height: 300px;
}
```

#### 5.2 차트 컨트롤 `.chart-controls`

```css
.chart-controls {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.chart-checkbox-group {
    display: flex;
    align-items: center;
    gap: 16px;
}

.chart-checkbox {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: var(--grey-700);
    padding: 6px 12px;
    border-radius: 20px;
    transition: all 0.2s ease;
    background: var(--grey-100);
}

.chart-checkbox:hover {
    background: var(--grey-200);
}

.chart-checkbox input {
    width: 16px;
    height: 16px;
    accent-color: var(--primary-main);
    cursor: pointer;
}

/* 차트 지표별 색상 */
.chart-checkbox.cost { border-left: 3px solid #673ab7; }
.chart-checkbox.cpm { border-left: 3px solid #ffab00; }
.chart-checkbox.cpc { border-left: 3px solid #2196f3; }
.chart-checkbox.cpa { border-left: 3px solid #ff9800; }
.chart-checkbox.roas { border-left: 3px solid #00c853; }
```

**HTML 구조**:
```html
<section class="chart-section card">
    <div class="chart-header">성과 추이 차트</div>
    <div class="chart-controls">
        <div class="chart-checkbox-group">
            <label class="chart-checkbox cost">
                <input type="checkbox" id="chartCost" checked>
                <span>비용</span>
            </label>
            <label class="chart-checkbox cpm">
                <input type="checkbox" id="chartCPM" checked>
                <span>CPM</span>
            </label>
            <!-- ... 기타 체크박스 -->
        </div>
    </div>
    <div class="chart-container">
        <canvas id="trendChart"></canvas>
    </div>
</section>
```

---

### 6. 테이블 컴포넌트

#### 6.1 테이블 섹션 `.table-section`

```css
.table-section {
    overflow: hidden;
}

.table-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--grey-200);
    font-size: 16px;
    font-weight: 600;
    color: var(--grey-900);
    display: flex;
    align-items: center;
    gap: 8px;
}

.table-header::before {
    content: '';
    width: 4px;
    height: 20px;
    background: var(--success-main);
    border-radius: 2px;
}

.table-container {
    overflow-x: auto;
}
```

#### 6.2 테이블 스타일

```css
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
    white-space: nowrap;
}

td {
    border-bottom: 1px solid var(--grey-100);
    color: var(--grey-900);
}

th:first-child,
td:first-child {
    text-align: left;
    position: sticky;
    left: 0;
    background: var(--paper);
    font-weight: 500;
}

th:first-child {
    background: var(--grey-50);
    z-index: 2;
}

tbody tr {
    transition: background 0.2s ease;
}

tbody tr:hover {
    background: var(--grey-50);
}

tbody tr:hover td:first-child {
    background: var(--grey-50);
}

/* 합계 행 */
.total-row {
    font-weight: 600;
    background: var(--primary-light) !important;
}

.total-row td {
    border-top: 2px solid var(--primary-main);
    color: var(--primary-dark);
}

.total-row td:first-child {
    background: var(--primary-light) !important;
}

/* 양수/음수 스타일 */
.positive {
    color: var(--success-main);
    font-weight: 600;
}

.negative {
    color: var(--error-main);
    font-weight: 600;
}

/* 숨겨진 행 */
.hidden-row {
    display: none;
}
```

#### 6.3 더보기 버튼 `.show-more-*`

```css
.show-more-container {
    padding: 16px 24px;
    text-align: center;
    border-top: 1px solid var(--grey-200);
}

.show-more-btn {
    padding: 10px 32px;
    background: var(--grey-100);
    color: var(--grey-700);
    border: 1px solid var(--grey-300);
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    font-size: 14px;
    font-family: inherit;
    transition: all 0.2s ease;
}

.show-more-btn:hover {
    background: var(--primary-light);
    color: var(--primary-main);
    border-color: var(--primary-main);
}
```

**HTML 구조**:
```html
<section class="table-section card">
    <div class="table-header">상세 데이터</div>
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>기간</th>
                    <th>비용</th>
                    <th>노출</th>
                    <!-- ... -->
                </tr>
            </thead>
            <tbody id="tableBody">
                <!-- 데이터 행 -->
            </tbody>
        </table>
    </div>
    <div class="show-more-container" id="showMoreContainer">
        <button class="show-more-btn" id="showMoreBtn">
            더보기 (<span id="hiddenCount">0</span>건)
        </button>
    </div>
</section>
```

---

### 7. 반응형 디자인 (Responsive Breakpoints)

```css
/* 태블릿 (1200px 이하) */
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
}

/* 모바일 (768px 이하) */
@media (max-width: 768px) {
    .main-content {
        padding: 10px;
    }

    .filter-row {
        flex-direction: column;
    }

    .filter-group {
        width: 100%;
    }

    .kpi-card {
        min-width: 120px;
        padding: 6px 10px;
    }

    .kpi-card .value {
        font-size: 16px;
    }

    .chart-container {
        height: 250px;
    }

    .chart-controls {
        flex-direction: column;
        align-items: flex-start;
    }
}

/* 소형 모바일 (480px 이하) */
@media (max-width: 480px) {
    .kpi-card {
        min-width: 100px;
    }

    .kpi-card .value {
        font-size: 15px;
    }

    .kpi-card .trend-detail {
        display: none;
    }
}
```

---

### 8. 스크롤바 스타일

```css
/* Simplebar 스타일 래퍼 (사이드바용) */
.simplebar-content-wrapper {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
}

.simplebar-content-wrapper::-webkit-scrollbar {
    width: 6px;
}

.simplebar-content-wrapper::-webkit-scrollbar-track {
    background: transparent;
}

.simplebar-content-wrapper::-webkit-scrollbar-thumb {
    background: var(--grey-300);
    border-radius: 3px;
}

.simplebar-content-wrapper::-webkit-scrollbar-thumb:hover {
    background: var(--grey-500);
}

/* 테이블 스크롤바 */
.table-container::-webkit-scrollbar {
    height: 8px;
}

.table-container::-webkit-scrollbar-track {
    background: var(--grey-100);
    border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb {
    background: var(--grey-300);
    border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb:hover {
    background: var(--grey-500);
}
```

---

### 9. 추가 CSS 클래스

#### 9.1 로딩 상태 `.loading`

```css
.loading {
    text-align: center;
    color: var(--grey-500);
    padding: 40px;
}
```

#### 9.2 이전 기간 상세 `.trend-detail`

```css
.trend-detail {
    font-size: 11px;
    color: var(--grey-500);
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
}

.trend-detail .prev-label {
    color: var(--grey-500);
}

.trend-detail .prev-value {
    font-weight: 500;
}
```

#### 9.3 필터 라벨 `.filter-label`

```css
.filter-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--grey-900);
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    margin-bottom: 8px;
}
```

#### 9.4 사이드바 아이콘 스타일

```css
.sidebar-logo-icon svg {
    width: 24px;
    height: 24px;
    fill: white;
}

.nav-item-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.nav-item-icon svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
}
```

#### 9.5 KPI 탭 콘텐츠 표시/숨김

```css
.kpi-tab-content {
    display: none;
}

.kpi-tab-content.active {
    display: block;
}

.kpi-section {
    /* 기본 상태: secondary 숨김 */
}

.kpi-grid-secondary {
    display: none;
}

.kpi-section.show-all .kpi-grid-secondary {
    display: grid;
}
```

#### 9.6 KPI 통합 섹션

```css
.kpi-unified-section {
    margin-bottom: 24px;
}
```

#### 9.7 네비게이션 추가 스타일

```css
.nav-item-text {
    flex: 1;
}

.nav-item-badge {
    background: var(--primary-main);
    color: white;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
}

.sidebar-content {
    padding: 16px 12px;
}
```

#### 9.8 KPI Trend 상세 스타일

```css
/* kpi-trend 내부 요소 */
.kpi-trend.up { color: var(--success-main); }
.kpi-trend.down { color: var(--error-main); }
.kpi-trend.neutral { color: var(--grey-500); }

.kpi-trend svg {
    width: 14px;
    height: 14px;
}

.kpi-trend .trend-value {
    font-weight: 600;
}

.kpi-trend .trend-pp {
    display: inline-flex;
    align-items: center;
    padding: 2px 6px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 4px;
    background: var(--grey-100);
    color: var(--grey-600);
}

.kpi-trend .trend-pp.positive {
    color: var(--success-main);
    background: rgba(76, 175, 80, 0.1);
}

.kpi-trend .trend-pp.negative {
    color: var(--error-main);
    background: rgba(244, 67, 54, 0.1);
}

/* kpi-card 내 trend 요소 */
.kpi-card .trend-wrapper {
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
}

.kpi-card .trend-row {
    display: flex;
    align-items: center;
    gap: 3px;
}

.kpi-card .trend-detail {
    font-size: 9px;
    color: var(--grey-500);
    display: flex;
    align-items: center;
    gap: 3px;
    margin-top: 6px;
}

.kpi-card .trend-detail .prev-label {
    font-size: 8px;
    font-weight: 500;
    color: var(--grey-500);
    margin-right: 4px;
}

.kpi-card .trend-detail .prev-value {
    font-size: 11px;
    font-weight: 600;
    color: var(--grey-700);
}
```

#### 9.9 필터 행 스타일

```css
.filter-row:last-child {
    margin-bottom: 0;
}
```

#### 9.10 h1 기본 스타일

```css
h1 {
    font-size: 24px;
    font-weight: 700;
    color: var(--grey-900);
    margin: 0;
}
```

---

## 차트 체크박스 기본 상태

| 체크박스 ID | 기본 상태 | 비고 |
|------------|----------|------|
| `#chartCost` | `checked` | 비용 - 기본 선택 |
| `#chartCPM` | 미선택 | CPM |
| `#chartCPC` | 미선택 | CPC |
| `#chartCPA` | 미선택 | CPA |
| `#chartROAS` | `checked` | ROAS - 기본 선택 |

---

## JavaScript 핵심 함수 구현 코드

### 0. 데이터 로드 함수

```javascript
async function loadData() {
    const promises = csvFiles.map(file =>
        fetch(file)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to load ${file}`);
                return response.text();
            })
            .then(text => parseCSV(text))
            .catch(err => {
                console.warn(`Could not load ${file}:`, err);
                return [];
            })
    );

    const results = await Promise.all(promises);
    allData = results.flat();

    // unique 값으로 필터 옵션 설정
    populateFilters();

    // 날짜 범위 설정
    setDateRange();

    // 세부 필터 옵션 설정
    updateDetailFilters();

    // 초기 데이터 표시
    updateDashboard();
}
```

---

### 1. CSV 파싱 함수 (RFC 4180 호환)

```javascript
function parseCSV(text) {
    const lines = text.trim().split('\n');

    // RFC 4180 호환 CSV 파싱
    function parseLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // 연속된 따옴표는 이스케이프된 따옴표
                    current += '"';
                    i++; // 다음 따옴표 건너뛰기
                } else {
                    // 따옴표 시작/종료
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // 따옴표 밖의 쉼표는 구분자
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        // 마지막 필드 추가
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
    });
}
```

---

### 2. 데이터 집계 함수

```javascript
function aggregateData(data) {
    const groupKey = {
        'daily': '일 구분',
        'weekly': '주 구분',
        'monthly': '월 구분'
    }[currentView];

    const groups = {};

    data.forEach(row => {
        const key = row[groupKey];
        if (!key) return;

        if (!groups[key]) {
            groups[key] = {
                period: key,
                비용: 0,
                노출: 0,
                클릭: 0,
                전환수: 0,
                전환값: 0
            };
        }

        groups[key].비용 += parseFloat(row['비용']) || 0;
        groups[key].노출 += parseFloat(row['노출']) || 0;
        groups[key].클릭 += parseFloat(row['클릭']) || 0;
        groups[key].전환수 += parseFloat(row['전환수']) || 0;
        groups[key].전환값 += parseFloat(row['전환값']) || 0;
    });

    // KPI 계산
    return Object.values(groups).map(g => ({
        ...g,
        CPM: g.노출 > 0 ? (g.비용 / g.노출 * 1000) : 0,
        CPC: g.클릭 > 0 ? (g.비용 / g.클릭) : 0,
        CPA: g.전환수 > 0 ? (g.비용 / g.전환수) : 0,
        ROAS: g.비용 > 0 ? (g.전환값 / g.비용 * 100) : 0
    })).sort((a, b) => {
        // 날짜순 정렬
        const dateA = new Date(a.period.replace(/\. /g, '-').replace(/\./g, ''));
        const dateB = new Date(b.period.replace(/\. /g, '-').replace(/\./g, ''));
        return dateA - dateB;
    });
}
```

---

### 3. Chart.js 렌더링 함수 (전체 설정)

```javascript
function renderChart() {
    const ctx = document.getElementById('trendChart').getContext('2d');

    // 기존 차트 제거
    if (trendChart) {
        trendChart.destroy();
    }

    const data = currentChartData;
    const labels = data.map(d => d.period);

    // 체크박스 상태 확인
    const showCost = document.getElementById('chartCost').checked;
    const showCPM = document.getElementById('chartCPM').checked;
    const showCPC = document.getElementById('chartCPC').checked;
    const showCPA = document.getElementById('chartCPA').checked;
    const showROAS = document.getElementById('chartROAS').checked;

    // Y축 결정 로직
    const hasCostMetric = showCost;
    const hasCpmMetric = showCPM;
    const hasCpcMetric = showCPC;
    const hasCpaMetric = showCPA;

    // 오른쪽 축 사용 여부 결정 (2개 이상 지표 선택 시)
    const selectedCount = (showCost ? 1 : 0) + (showCPM ? 1 : 0) + (showCPC ? 1 : 0) + (showCPA ? 1 : 0) + (showROAS ? 1 : 0);
    const useRightAxis = selectedCount >= 2;

    const datasets = [];

    if (showCost) {
        datasets.push({
            label: '비용',
            data: data.map(d => d.비용),
            backgroundColor: 'rgba(103, 58, 183, 0.7)',
            borderColor: 'rgba(103, 58, 183, 1)',
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: 'y',
            order: 4
        });
    }

    if (showCPM) {
        datasets.push({
            label: 'CPM',
            data: data.map(d => d.CPM),
            type: 'line',
            borderColor: 'rgba(255, 171, 0, 1)',
            backgroundColor: 'rgba(255, 171, 0, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(255, 171, 0, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            fill: false,
            tension: 0.4,
            yAxisID: hasCostMetric ? 'y1' : 'y',
            order: 3
        });
    }

    if (showCPC) {
        datasets.push({
            label: 'CPC',
            data: data.map(d => d.CPC),
            type: 'line',
            borderColor: 'rgba(33, 150, 243, 1)',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(33, 150, 243, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            fill: false,
            tension: 0.4,
            yAxisID: (hasCostMetric || hasCpmMetric) ? 'y1' : 'y',
            order: 3
        });
    }

    if (showCPA) {
        datasets.push({
            label: 'CPA',
            data: data.map(d => d.CPA),
            type: 'line',
            borderColor: 'rgba(255, 152, 0, 1)',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(255, 152, 0, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            fill: false,
            tension: 0.4,
            yAxisID: (hasCostMetric || hasCpmMetric || hasCpcMetric) ? 'y1' : 'y',
            order: 2
        });
    }

    if (showROAS) {
        datasets.push({
            label: 'ROAS (%)',
            data: data.map(d => d.ROAS),
            type: 'line',
            borderColor: 'rgba(0, 200, 83, 1)',
            backgroundColor: 'rgba(0, 200, 83, 0.1)',
            borderWidth: 3,
            pointBackgroundColor: 'rgba(0, 200, 83, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.4,
            yAxisID: (hasCostMetric || hasCpmMetric || hasCpcMetric || hasCpaMetric) ? 'y1' : 'y',
            order: 1
        });
    }

    trendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            family: "'Inter', sans-serif",
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(33, 33, 33, 0.9)',
                    titleFont: { family: "'Inter', sans-serif", size: 13 },
                    bodyFont: { family: "'Inter', sans-serif", size: 12 },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.dataset.label === 'ROAS (%)') {
                                label += Math.round(context.parsed.y) + '%';
                            } else {
                                label += formatNumber(context.parsed.y) + '원';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { family: "'Inter', sans-serif", size: 11 },
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: '비용 (원)',
                        font: { family: "'Inter', sans-serif", size: 12 }
                    },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: {
                        font: { family: "'Inter', sans-serif", size: 11 },
                        callback: function(value) {
                            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                            if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
                            return value;
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: useRightAxis,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'CPM/CPC/CPA/ROAS',
                        font: { family: "'Inter', sans-serif", size: 12 }
                    },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}
```

---

### 4. KPI 업데이트 함수 (증감율 계산 포함)

```javascript
function updateKPIs(data) {
    // 1. 전체 합계 계산
    const totals = data.reduce((acc, row) => {
        acc.비용 += row.비용;
        acc.노출 += row.노출;
        acc.클릭 += row.클릭;
        acc.전환수 += row.전환수;
        acc.전환값 += row.전환값;
        return acc;
    }, { 비용: 0, 노출: 0, 클릭: 0, 전환수: 0, 전환값: 0 });

    const totalCPM = totals.노출 > 0 ? (totals.비용 / totals.노출 * 1000) : 0;
    const totalCPC = totals.클릭 > 0 ? (totals.비용 / totals.클릭) : 0;
    const totalCPA = totals.전환수 > 0 ? (totals.비용 / totals.전환수) : 0;
    const totalROASValue = totals.비용 > 0 ? (totals.전환값 / totals.비용 * 100) : 0;

    // 요약 KPI 업데이트
    document.getElementById('summaryTotalCost').textContent = formatNumber(totals.비용);
    document.getElementById('summaryTotalImpressions').textContent = formatNumber(totals.노출);
    document.getElementById('summaryAvgCPM').textContent = formatNumber(totalCPM);
    document.getElementById('summaryTotalClicks').textContent = formatNumber(totals.클릭);
    document.getElementById('summaryAvgCPC').textContent = formatNumber(totalCPC);
    document.getElementById('summaryTotalConversions').textContent = formatNumber(totals.전환수);
    document.getElementById('summaryAvgCPA').textContent = formatNumber(totalCPA);
    document.getElementById('summaryTotalConversionValue').textContent = formatNumber(totals.전환값);
    document.getElementById('summaryTotalROAS').textContent = formatROAS(totalROASValue);

    // 2. 기간별 KPI (최신 기간)
    if (data.length >= 1) {
        const lastPeriodData = data[data.length - 1];
        document.getElementById('totalCost').textContent = formatNumber(lastPeriodData.비용);
        document.getElementById('totalImpressions').textContent = formatNumber(lastPeriodData.노출);
        document.getElementById('avgCPM').textContent = formatNumber(lastPeriodData.CPM);
        document.getElementById('totalClicks').textContent = formatNumber(lastPeriodData.클릭);
        document.getElementById('avgCPC').textContent = formatNumber(lastPeriodData.CPC);
        document.getElementById('totalConversions').textContent = formatNumber(lastPeriodData.전환수);
        document.getElementById('avgCPA').textContent = formatNumber(lastPeriodData.CPA);
        document.getElementById('totalConversionValue').textContent = formatNumber(lastPeriodData.전환값);
        document.getElementById('totalROAS').textContent = formatROAS(lastPeriodData.ROAS);
    }

    // 3. 증감율 계산 (마지막 기간 vs 직전 기간)
    if (data.length >= 2) {
        const lastPeriodData = data[data.length - 1];
        const prevPeriodData = data[data.length - 2];

        const calcChange = (newVal, oldVal) => {
            if (oldVal === 0) return newVal > 0 ? 100 : 0;
            return ((newVal - oldVal) / oldVal * 100);
        };

        // 증감율 업데이트 함수
        const updateTrend = (id, change, oldValue, newValue, isGoodWhenUp, isPercentage) => {
            const el = document.getElementById(id);
            const ppEl = document.getElementById(id + 'PP');
            const detailEl = document.getElementById(id + 'Detail');
            if (!el) return;

            const isUp = change >= 0;
            const isGood = isGoodWhenUp ? isUp : !isUp;

            el.className = `kpi-trend ${isGood ? 'up' : 'down'}`;

            const trendValueEl = el.querySelector('.trend-value');
            if (trendValueEl) {
                const arrow = isUp ? '↑' : '↓';
                trendValueEl.textContent = `${arrow} ${Math.abs(Math.round(change))}%`;
            }

            if (ppEl) {
                if (isPercentage) {
                    const pp = newValue - oldValue;
                    ppEl.textContent = `${pp >= 0 ? '+' : ''}${Math.round(pp)}%p`;
                    ppEl.className = `trend-pp ${pp >= 0 ? 'positive' : 'negative'}`;
                } else {
                    const diff = newValue - oldValue;
                    ppEl.textContent = `${diff >= 0 ? '+' : ''}${formatNumber(diff)}`;
                    ppEl.className = `trend-pp ${isGood ? 'positive' : 'negative'}`;
                }
            }

            if (detailEl) {
                detailEl.innerHTML = `<span class="prev-label">이전</span><span class="prev-value">${isPercentage ? Math.round(oldValue) + '%' : formatNumber(oldValue)}</span>`;
            }
        };

        // 증가가 좋은 지표
        updateTrend('trendCost', calcChange(lastPeriodData.비용, prevPeriodData.비용), prevPeriodData.비용, lastPeriodData.비용, true, false);
        updateTrend('trendImpressions', calcChange(lastPeriodData.노출, prevPeriodData.노출), prevPeriodData.노출, lastPeriodData.노출, true, false);
        updateTrend('trendClicks', calcChange(lastPeriodData.클릭, prevPeriodData.클릭), prevPeriodData.클릭, lastPeriodData.클릭, true, false);
        updateTrend('trendConversions', calcChange(lastPeriodData.전환수, prevPeriodData.전환수), prevPeriodData.전환수, lastPeriodData.전환수, true, false);
        updateTrend('trendConversionValue', calcChange(lastPeriodData.전환값, prevPeriodData.전환값), prevPeriodData.전환값, lastPeriodData.전환값, true, false);
        updateTrend('trendROAS', calcChange(lastPeriodData.ROAS, prevPeriodData.ROAS), prevPeriodData.ROAS, lastPeriodData.ROAS, true, true);

        // 감소가 좋은 지표
        updateTrend('trendCPM', calcChange(lastPeriodData.CPM, prevPeriodData.CPM), prevPeriodData.CPM, lastPeriodData.CPM, false, false);
        updateTrend('trendCPC', calcChange(lastPeriodData.CPC, prevPeriodData.CPC), prevPeriodData.CPC, lastPeriodData.CPC, false, false);
        updateTrend('trendCPA', calcChange(lastPeriodData.CPA, prevPeriodData.CPA), prevPeriodData.CPA, lastPeriodData.CPA, false, false);
    }
}
```

---

### 5. 데이터 필터링 함수

```javascript
function filterData() {
    return allData.filter(row => {
        // 기본 필터 조건 확인
        if (filters.type && row['유형구분'] !== filters.type) return false;
        if (filters.brand && row['브랜드명'] !== filters.brand) return false;
        if (filters.product && row['상품명'] !== filters.product) return false;
        if (filters.promotion && row['프로모션'] !== filters.promotion) return false;

        // 날짜 범위 확인
        if (filters.startDate || filters.endDate) {
            const rowDate = new Date(row['일 구분']);
            if (isNaN(rowDate)) return false;
            if (filters.startDate && rowDate < new Date(filters.startDate)) return false;
            if (filters.endDate && rowDate > new Date(filters.endDate)) return false;
        }

        // 세부 필터 조건 확인
        if (filters.campaign && row['캠페인'] !== filters.campaign) return false;
        if (filters.setName && row['세트이름'] !== filters.setName) return false;

        return true;
    });
}
```

---

### 6. 대시보드 업데이트 함수

```javascript
function updateDashboard() {
    const filteredData = filterData();
    const aggregatedData = aggregateData(filteredData);

    // KPI 업데이트
    updateKPIs(aggregatedData);

    // 차트 업데이트
    updateChart(aggregatedData);

    // 테이블 업데이트
    updateTable(aggregatedData);
}
```

---

### 7. 테이블 업데이트 함수

```javascript
const TABLE_ROW_LIMIT = 10;
let isTableExpanded = false;

function updateTable(data) {
    const tbody = document.getElementById('tableBody');
    const showMoreContainer = document.getElementById('showMoreContainer');
    const hiddenCountSpan = document.getElementById('hiddenCount');

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="loading">데이터가 없습니다.</td></tr>';
        showMoreContainer.style.display = 'none';
        return;
    }

    // 합계 계산
    const totals = data.reduce((acc, row) => {
        acc.비용 += row.비용;
        acc.노출 += row.노출;
        acc.클릭 += row.클릭;
        acc.전환수 += row.전환수;
        acc.전환값 += row.전환값;
        return acc;
    }, { 비용: 0, 노출: 0, 클릭: 0, 전환수: 0, 전환값: 0 });

    const hiddenCount = Math.max(0, data.length - TABLE_ROW_LIMIT);

    let html = data.map((row, index) => `
        <tr class="${!isTableExpanded && index >= TABLE_ROW_LIMIT ? 'hidden-row' : ''}">
            <td>${row.period}</td>
            <td>${formatNumber(row.비용)}</td>
            <td>${formatNumber(row.노출)}</td>
            <td>${formatNumber(row.CPM)}</td>
            <td>${formatNumber(row.클릭)}</td>
            <td>${formatNumber(row.CPC)}</td>
            <td>${formatNumber(row.전환수)}</td>
            <td>${formatNumber(row.CPA)}</td>
            <td>${formatNumber(row.전환값)}</td>
            <td class="${row.ROAS >= 100 ? 'positive' : 'negative'}">${formatROAS(row.ROAS)}</td>
        </tr>
    `).join('');

    // 합계 행 추가
    const totalCPM = totals.노출 > 0 ? (totals.비용 / totals.노출 * 1000) : 0;
    const totalCPC = totals.클릭 > 0 ? (totals.비용 / totals.클릭) : 0;
    const totalCPA = totals.전환수 > 0 ? (totals.비용 / totals.전환수) : 0;
    const totalROAS = totals.비용 > 0 ? (totals.전환값 / totals.비용 * 100) : 0;

    html += `
        <tr class="total-row">
            <td>합계</td>
            <td>${formatNumber(totals.비용)}</td>
            <td>${formatNumber(totals.노출)}</td>
            <td>${formatNumber(totalCPM)}</td>
            <td>${formatNumber(totals.클릭)}</td>
            <td>${formatNumber(totalCPC)}</td>
            <td>${formatNumber(totals.전환수)}</td>
            <td>${formatNumber(totalCPA)}</td>
            <td>${formatNumber(totals.전환값)}</td>
            <td class="${totalROAS >= 100 ? 'positive' : 'negative'}">${formatROAS(totalROAS)}</td>
        </tr>
    `;

    tbody.innerHTML = html;

    // 더 보기 버튼 표시/숨김
    if (hiddenCount > 0 && !isTableExpanded) {
        showMoreContainer.style.display = 'block';
        hiddenCountSpan.textContent = hiddenCount;
    } else {
        showMoreContainer.style.display = 'none';
    }
}

// 더 보기 버튼 클릭 핸들러
function expandTableRows() {
    isTableExpanded = true;
    const hiddenRows = document.querySelectorAll('#tableBody .hidden-row');
    const showMoreContainer = document.getElementById('showMoreContainer');
    const collapseContainer = document.getElementById('collapseContainer');

    hiddenRows.forEach(row => row.classList.remove('hidden-row'));
    showMoreContainer.style.display = 'none';
    collapseContainer.style.display = 'block';
}

// 접기 버튼 클릭 핸들러
function collapseTableRows() {
    isTableExpanded = false;
    const tbody = document.getElementById('tableBody');
    const rows = tbody.querySelectorAll('tr:not(.total-row)');
    const showMoreContainer = document.getElementById('showMoreContainer');
    const collapseContainer = document.getElementById('collapseContainer');
    const hiddenCountSpan = document.getElementById('hiddenCount');

    rows.forEach((row, index) => {
        if (index >= TABLE_ROW_LIMIT) row.classList.add('hidden-row');
    });

    const hiddenCount = Math.max(0, rows.length - TABLE_ROW_LIMIT);
    if (hiddenCount > 0) {
        showMoreContainer.style.display = 'block';
        hiddenCountSpan.textContent = hiddenCount;
    }
    collapseContainer.style.display = 'none';
}
```

---

### 8. 이벤트 리스너 전체 코드

```javascript
document.addEventListener('DOMContentLoaded', () => {
    loadData();

    // 필터 섹션 접기/펼치기
    document.querySelectorAll('.collapsible-header').forEach(header => {
        header.addEventListener('click', function() {
            const section = this.parentElement;
            const content = section.querySelector('.collapsible-content');
            const toggleBtn = section.querySelector('.collapsible-toggle');
            const toggleIcon = section.querySelector('.collapsible-toggle-icon');
            const toggleText = toggleBtn.querySelector('span:first-child');

            if (content.classList.contains('expanded')) {
                content.classList.remove('expanded');
                toggleIcon.classList.add('collapsed');
                toggleText.textContent = '펼치기';
            } else {
                content.classList.add('expanded');
                toggleIcon.classList.remove('collapsed');
                toggleText.textContent = '접기';
            }
        });
    });

    // 기본 필터 변경 이벤트 (계층 구조)
    document.getElementById('filterType').addEventListener('change', e => {
        filters.type = e.target.value;
        updateBrandFilter();
        updateDetailFilters();
        updateDashboard();
    });

    document.getElementById('filterBrand').addEventListener('change', e => {
        filters.brand = e.target.value;
        updateProductFilter();
        updateDetailFilters();
        updateDashboard();
    });

    document.getElementById('filterProduct').addEventListener('change', e => {
        filters.product = e.target.value;
        updatePromotionFilter();
        updateDetailFilters();
        updateDashboard();
    });

    document.getElementById('filterPromotion').addEventListener('change', e => {
        filters.promotion = e.target.value;
        updateDetailFilters();
        updateDashboard();
    });

    document.getElementById('startDate').addEventListener('change', e => {
        filters.startDate = e.target.value;
        updateDetailFilters();
        updateDashboard();
    });

    document.getElementById('endDate').addEventListener('change', e => {
        filters.endDate = e.target.value;
        updateDetailFilters();
        updateDashboard();
    });

    // 세부 필터 변경 이벤트
    document.getElementById('filterCampaign').addEventListener('change', e => {
        filters.campaign = e.target.value;
        updateSetNameFilter();
        updateDashboard();
    });

    document.getElementById('filterSetName').addEventListener('change', e => {
        filters.setName = e.target.value;
        updateDashboard();
    });

    // KPI 탭 버튼 (전체/일별/주별/월별)
    document.querySelectorAll('.kpi-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.kpi-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const tabType = btn.dataset.kpiTab;
            const totalContent = document.getElementById('kpiTabTotal');
            const periodContent = document.getElementById('kpiTabPeriod');

            if (tabType === 'total') {
                totalContent.classList.add('active');
                periodContent.classList.remove('active');
            } else {
                totalContent.classList.remove('active');
                periodContent.classList.add('active');
                currentView = tabType;
                updateDashboard();
            }
        });
    });

    // KPI 주요/세부 성과 토글 버튼
    document.querySelectorAll('.kpi-unified-section .kpi-view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.kpi-unified-section .kpi-view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.kpi-unified-section .kpi-section').forEach(section => {
                if (btn.dataset.kpiView === 'all') {
                    section.classList.add('show-all');
                } else {
                    section.classList.remove('show-all');
                }
            });
        });
    });

    // 차트 체크박스 이벤트
    ['chartCost', 'chartCPM', 'chartCPC', 'chartCPA', 'chartROAS'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => renderChart());
    });

    // 더 보기/접기 버튼 이벤트
    document.getElementById('showMoreBtn').addEventListener('click', expandTableRows);
    document.getElementById('collapseBtn').addEventListener('click', collapseTableRows);
});
```

---

## 전체 HTML ID 매핑

### 필터 섹션 ID
| ID | 용도 |
|----|------|
| `#filterCollapsibleHeader` | 필터 접기/펼치기 헤더 |
| `#filterCollapsibleContent` | 필터 콘텐츠 영역 |
| `#startDate` | 시작일 입력 |
| `#endDate` | 종료일 입력 |
| `#filterType` | 유형구분 드롭다운 |
| `#filterBrand` | 브랜드명 드롭다운 |
| `#filterProduct` | 상품명 드롭다운 |
| `#filterPromotion` | 프로모션 드롭다운 |
| `#filterCampaign` | 캠페인 드롭다운 |
| `#filterSetName` | 세트이름 드롭다운 |

### KPI 요약 탭 ID (전체 합계)
| ID | KPI 지표 |
|----|----------|
| `#kpiTabTotal` | 전체 탭 콘텐츠 |
| `#summaryTotalCost` | 총 비용 |
| `#summaryTotalImpressions` | 총 노출 |
| `#summaryTotalClicks` | 총 클릭 |
| `#summaryTotalConversions` | 총 전환수 |
| `#summaryTotalConversionValue` | 총 전환값 |
| `#summaryAvgCPM` | 평균 CPM |
| `#summaryAvgCPC` | 평균 CPC |
| `#summaryAvgCPA` | 평균 CPA |
| `#summaryTotalROAS` | 전체 ROAS |

### KPI 기간별 탭 ID (최신 기간 데이터)
| ID | KPI 지표 |
|----|----------|
| `#kpiTabPeriod` | 기간별 탭 콘텐츠 |
| `#totalCost` | 비용 |
| `#totalImpressions` | 노출 |
| `#totalClicks` | 클릭 |
| `#totalConversions` | 전환수 |
| `#totalConversionValue` | 전환값 |
| `#avgCPM` | CPM |
| `#avgCPC` | CPC |
| `#avgCPA` | CPA |
| `#totalROAS` | ROAS |

### KPI 증감율 ID (Trend)
| 기본 ID | PP ID | Detail ID | 지표 |
|---------|-------|-----------|------|
| `#trendCost` | `#trendCostPP` | `#trendCostDetail` | 비용 증감 |
| `#trendImpressions` | `#trendImpressionsPP` | `#trendImpressionsDetail` | 노출 증감 |
| `#trendClicks` | `#trendClicksPP` | `#trendClicksDetail` | 클릭 증감 |
| `#trendConversions` | `#trendConversionsPP` | `#trendConversionsDetail` | 전환수 증감 |
| `#trendConversionValue` | `#trendConversionValuePP` | `#trendConversionValueDetail` | 전환값 증감 |
| `#trendCPM` | `#trendCPMPP` | `#trendCPMDetail` | CPM 증감 |
| `#trendCPC` | `#trendCPCPP` | `#trendCPCDetail` | CPC 증감 |
| `#trendCPA` | `#trendCPAPP` | `#trendCPADetail` | CPA 증감 |
| `#trendROAS` | `#trendROASPP` | `#trendROASDetail` | ROAS 증감 |

### 차트 섹션 ID
| ID | 용도 |
|----|------|
| `#trendChart` | 차트 캔버스 |
| `#chartCost` | 비용 체크박스 |
| `#chartCPM` | CPM 체크박스 |
| `#chartCPC` | CPC 체크박스 |
| `#chartCPA` | CPA 체크박스 |
| `#chartROAS` | ROAS 체크박스 |

### 테이블 섹션 ID
| ID | 용도 |
|----|------|
| `#dataTable` | 테이블 요소 |
| `#tableBody` | 테이블 본문 |
| `#showMoreContainer` | 더보기 버튼 컨테이너 |
| `#showMoreBtn` | 더보기 버튼 |
| `#hiddenCount` | 숨겨진 행 수 |
| `#collapseContainer` | 접기 버튼 컨테이너 |
| `#collapseBtn` | 접기 버튼 |

---

## 테이블 컬럼 구조

### 테이블 헤더 순서
| 순서 | 컬럼명 | 데이터 키 | 정렬 |
|------|--------|----------|------|
| 1 | 기간 | `period` | left |
| 2 | 비용 | `비용` | right |
| 3 | 노출 | `노출` | right |
| 4 | CPM | `CPM` | right |
| 5 | 클릭 | `클릭` | right |
| 6 | CPC | `CPC` | right |
| 7 | 전환수 | `전환수` | right |
| 8 | CPA | `CPA` | right |
| 9 | 전환값 | `전환값` | right |
| 10 | ROAS | `ROAS` | right |

### 테이블 행 생성 코드
```javascript
let html = data.map((row, index) => `
    <tr class="${!isTableExpanded && index >= TABLE_ROW_LIMIT ? 'hidden-row' : ''}">
        <td>${row.period}</td>
        <td>${formatNumber(row.비용)}</td>
        <td>${formatNumber(row.노출)}</td>
        <td>${formatNumber(row.CPM)}</td>
        <td>${formatNumber(row.클릭)}</td>
        <td>${formatNumber(row.CPC)}</td>
        <td>${formatNumber(row.전환수)}</td>
        <td>${formatNumber(row.CPA)}</td>
        <td>${formatNumber(row.전환값)}</td>
        <td class="${row.ROAS >= 100 ? 'positive' : 'negative'}">${formatROAS(row.ROAS)}</td>
    </tr>
`).join('');
```

### ROAS 색상 규칙
- `ROAS >= 100`: `.positive` (녹색)
- `ROAS < 100`: `.negative` (빨간색)

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
            <!-- 대시보드 그룹 -->
            <div class="nav-group">
                <div class="nav-group-title">대시보드</div>
                <a href="#" class="nav-item active">
                    <div class="nav-item-icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>
                        </svg>
                    </div>
                    <span class="nav-item-text">광고 성과 대시보드</span>
                </a>
            </div>

            <!-- 분석 그룹 -->
            <div class="nav-group">
                <div class="nav-group-title">분석</div>
                <a href="creative_analysis.html" class="nav-item">
                    <div class="nav-item-icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                        </svg>
                    </div>
                    <span class="nav-item-text">광고 소재별 분석</span>
                </a>
                <a href="timeseries_analysis.html" class="nav-item">
                    <div class="nav-item-icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M23 8c0 1.1-.9 2-2 2-.18 0-.35-.02-.51-.07l-3.56 3.55c.05.16.07.34.07.52 0 1.1-.9 2-2 2s-2-.9-2-2c0-.18.02-.36.07-.52l-2.55-2.55c-.16.05-.34.07-.52.07s-.36-.02-.52-.07l-4.55 4.56c.05.16.07.33.07.51 0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.18 0 .35.02.51.07l4.56-4.55C8.02 9.36 8 9.18 8 9c0-1.1.9-2 2-2s2 .9 2 2c0 .18-.02.36-.07.52l2.55 2.55c.16-.05.34-.07.52-.07s.36.02.52.07l3.55-3.56C19.02 8.35 19 8.18 19 8c0-1.1.9-2 2-2s2 .9 2 2z"/>
                        </svg>
                    </div>
                    <span class="nav-item-text">시계열 데이터 분석</span>
                </a>
                <a href="#" class="nav-item">
                    <div class="nav-item-icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2.03 0v8.99H22c-.47-4.74-4.24-8.52-8.97-8.99zm0 11.01V22c4.74-.47 8.5-4.25 8.97-8.99h-8.97z"/>
                        </svg>
                    </div>
                    <span class="nav-item-text">채널별 비교</span>
                </a>
                <a href="#" class="nav-item">
                    <div class="nav-item-icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                        </svg>
                    </div>
                    <span class="nav-item-text">기간별 리포트</span>
                </a>
            </div>

            <!-- 설정 그룹 -->
            <div class="nav-group">
                <div class="nav-group-title">설정</div>
                <a href="#" class="nav-item">
                    <div class="nav-item-icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                        </svg>
                    </div>
                    <span class="nav-item-text">데이터 설정</span>
                </a>
            </div>
        </div>
    </div>
</aside>
```

### 네비게이션 링크 구조
| 그룹 | 메뉴 | href | 활성 상태 |
|------|------|------|----------|
| 대시보드 | 광고 성과 대시보드 | `#` | `.active` |
| 분석 | 광고 소재별 분석 | `creative_analysis.html` | - |
| 분석 | 시계열 데이터 분석 | `timeseries_analysis.html` | - |
| 분석 | 채널별 비교 | `#` | - |
| 분석 | 기간별 리포트 | `#` | - |
| 설정 | 데이터 설정 | `#` | - |

---

## 유틸리티 함수 구현

```javascript
// 숫자 포맷 - #,### (0은 '-'로 표시)
function formatNumber(num) {
    if (num === 0 || num === null || num === undefined) return '-';
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ROAS 포맷 - 0% (0은 '-'로 표시, %는 정수)
function formatROAS(num) {
    if (num === 0 || num === null || num === undefined) return '-';
    return Math.round(num) + '%';
}

// 날짜 포맷 (YYYY-MM-DD)
function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}
```

---

## 전역 변수 초기값

```javascript
let allData = [];
let currentView = 'daily';
let filters = {
    type: '',
    brand: '',
    product: '',
    promotion: '',
    startDate: '',
    endDate: '',
    campaign: '',
    setName: ''
};
let trendChart = null;
let currentChartData = [];
const TABLE_ROW_LIMIT = 10;
let isTableExpanded = false;

const csvFiles = [
    'raw/raw_data.csv'
];
```

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2024-12-08 | Dead Code 삭제 및 변수명 정규화 완료 |
| 2024-12-08 | HTML/CSS 디자인 구조 문서 추가 |
| 2024-12-08 | JavaScript 핵심 함수 구현 코드 추가 |
| 2024-12-08 | 전체 HTML ID 매핑 추가 |
| 2024-12-08 | 테이블/사이드바 구조 상세 추가 |
| 2024-12-08 | HTML 문서 기본 구조 (head, CDN) 추가 |
| 2024-12-08 | 헤더 컴포넌트 CSS/HTML 추가 |
| 2024-12-08 | KPI 카드 전체 HTML 구조 및 아이콘 매핑 추가 |
| 2024-12-08 | 필터 설정 전체 HTML 구조 추가 |
| 2024-12-08 | 추가 CSS 클래스 (loading, trend-detail, filter-label 등) 추가 |
| 2024-12-08 | 차트 체크박스 기본 상태 문서화 |
| 2024-12-08 | filterData, updateDashboard, updateTable 함수 전체 구현 코드 추가 |
| 2024-12-08 | 이벤트 리스너 전체 코드 추가 |
| 2024-12-08 | 네비게이션 CSS (.nav-item-text, .nav-item-badge) 추가 |
| 2024-12-08 | KPI 트렌드 상세 CSS (.kpi-trend.up/down, .trend-detail) 추가 |
| 2024-12-08 | 사이드바 전체 HTML 구조 추가 |
