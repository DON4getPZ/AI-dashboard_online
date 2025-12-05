# creative_analysis.html 기능 분석 문서

## 개요
`data/creative_analysis.html`은 **광고 소재별 분석 대시보드**로, 광고 소재(이미지/영상)별 성과를 분석하는 대시보드입니다.

---

## 파일 구조

### 외부 라이브러리
| 라이브러리 | 용도 |
|-----------|------|
| Chart.js | 차트 시각화 |
| Google Fonts (Roboto, Inter) | 폰트 |

---

## 섹션별 기능 브리핑

### 1. 기간 선택 영역
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 기간 선택 |
| **위치** | Line 1049-1061 |
| **JS 함수** | `setDateRange()` |
| **참조 데이터** | `allData` (Creative_data.csv) |
| **기능** | - 시작일/종료일 날짜 선택<br>- 데이터 기반 자동 날짜 범위 설정 |

---

### 2. 요약 섹션 (KPI 카드)
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | (상단 요약 카드) |
| **위치** | Line 1063-1092 |
| **JS 함수** | `updateSummary()` |
| **참조 데이터** | `aggregateByCreative()` 결과 데이터 |
| **기능** | 주요 KPI 5개 표시: 총 비용, 평균 CPM, 평균 CPC, 평균 CPA, 평균 ROAS |

---

### 3. 필터 섹션
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 필터 설정 |
| **위치** | Line 1094-1143 |
| **JS 함수** | `populateFilters()`, `updateBrandFilter()`, `updateProductFilter()`, `updatePromotionFilter()`, `updateCampaignFilter()`, `updateAdSetFilter()` |
| **참조 데이터** | `allData` (Creative_data.csv) |
| **기능** | - 유형구분 필터<br>- 브랜드명 필터 (유형구분 하위)<br>- 상품명 필터 (브랜드명 하위)<br>- 프로모션 필터 (상품명 하위)<br>- 캠페인 필터 (프로모션 하위)<br>- 광고세트 필터 (캠페인 하위)<br>- 소재 검색 (LIKE 검색) |

#### 필터 계층 구조
```
유형구분 → 브랜드명 → 상품명 → 프로모션 → 캠페인 → 광고세트
```

---

### 4. KPI 기준 필터
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | KPI 기준 필터 |
| **위치** | Line 1145-1277 |
| **JS 함수** | `updateDashboard()` 내 KPI 필터 로직 |
| **참조 데이터** | `kpiFilter` 상태 객체 |
| **기능** | - 조건 1: KPI 기준, 조건, 기준값, 조합 조건 (없음/또는/그리고)<br>- 조건 2: 보조 KPI 필터<br>- 조건 3: 3차 KPI 필터<br>- ON/OFF 토글 |

#### 지원 KPI 지표
- 비용, 노출, 클릭, 전환수, 전환값, CPC, CPA, ROAS

#### 조건 연산자
- `>` (보다 큼), `<` (보다 작음), `>=` (크거나 같음), `<=` (작거나 같음), `=` (같음)

---

### 5. 정렬 설정
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 정렬 설정 |
| **위치** | Line 1279-1310 |
| **JS 함수** | `aggregateByCreative()` 내 정렬 로직 |
| **참조 데이터** | `sortConfig` 상태 객체 |
| **기능** | - 정렬 기준 (비용, 노출, 클릭, 전환수, 전환값, CPC, CPA, ROAS)<br>- 정렬 순서 (내림차순/오름차순) |

---

### 6. 소재 그리드
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | (소재 카드 그리드) |
| **위치** | Line 1312-1316 |
| **JS 함수** | `updateCreativeGrid()` |
| **참조 데이터** | `aggregateByCreative()` 결과, `imageUrlMap`, `fallbackUrlMap`, `originalUrlMap` |
| **기능** | - 소재 이미지 썸네일 표시<br>- 소재별 KPI 표시 (비용, CPC, CPA, ROAS)<br>- 이미지 URL 매핑 (facebook.com/ads/image, img.youtube.com 우선)<br>- 이미지 fallback 처리<br>- 원본 URL 링크 연결<br>- 소재 클릭 시 세부 성과 모달 표시 |

---

### 7. 세부 성과 모달
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 소재 세부 성과 |
| **위치** | Line 1320-1404 |
| **JS 함수** | `showCreativeDetail()`, `changeModalViewType()`, `updateModalContent()`, `aggregateModalData()`, `updateModalTable()`, `updateModalChart()`, `expandModalTable()`, `collapseModalTable()`, `closeModal()` |
| **참조 데이터** | `currentModalData` (필터링된 소재 데이터) |
| **기능** | 아래 세부 항목 참조 |

#### 7.1 뷰 타입 선택
| 항목 | 내용 |
|------|------|
| **JS 함수** | `changeModalViewType()` |
| **기능** | - 일별/주별/월별 집계 단위 전환 |

#### 7.2 KPI 카드 (2행)
| 항목 | 내용 |
|------|------|
| **JS 함수** | `updateModalContent()` |
| **기능** | - 상단 행: 비용, CPC, CPA, ROAS<br>- 하단 행: 노출, 클릭, 전환수, 전환값 |

#### 7.3 성과 추이 차트
| 항목 | 내용 |
|------|------|
| **JS 함수** | `updateModalChart()` |
| **기능** | - 체크박스로 지표 선택 (비용, CPC, CPA, ROAS)<br>- 듀얼 Y축 지원 (왼쪽/오른쪽 축 자동 할당)<br>- Chart.js 라인 차트 |

#### 7.4 상세 데이터 테이블
| 항목 | 내용 |
|------|------|
| **JS 함수** | `updateModalTable()`, `expandModalTable()`, `collapseModalTable()` |
| **기능** | - 기간별 상세 데이터 표시<br>- 기본 5행 표시, 더보기/접기 버튼<br>- 컬럼: 기간, 비용, 노출, 클릭, CPC, 전환수, CPA, ROAS |

---

## 버튼 UI 컴포넌트

### 1. 필터 드롭다운
| ID | data 속성 | 기능 |
|----|----------|------|
| `filterType` | - | 유형구분 선택 |
| `filterBrand` | - | 브랜드명 선택 |
| `filterProduct` | - | 상품명 선택 |
| `filterExtra` | - | 프로모션 선택 |
| `filterCampaign` | - | 캠페인 선택 |
| `filterAdSet` | - | 광고세트 선택 |

### 2. 날짜 입력
| ID | 기능 |
|----|------|
| `startDate` | 시작일 선택 |
| `endDate` | 종료일 선택 |

### 3. 소재 검색
| ID | 기능 |
|----|------|
| `searchText` | 소재이름 실시간 검색 (LIKE '%검색어%') |

### 4. KPI 필터 컨트롤

#### 조건 1
| ID | 기능 |
|----|------|
| `kpiFilterMetric` | KPI 기준 선택 |
| `kpiFilterOperator` | 조건 연산자 선택 |
| `kpiFilterValue` | 기준값 입력 (숫자 자동 포맷) |
| `kpiFilterToggle` | ON/OFF 토글 버튼 |

#### 조합 조건 라디오
| name 속성 | 값 | 기능 |
|----------|-----|------|
| `compoundLogic` | `none`, `or`, `and` | 조건 1 → 조건 2 조합 방식 |
| `compoundLogicSub` | `none`, `or`, `and` | 조건 2 → 조건 3 조합 방식 |

#### 조건 2 (보조 필터)
| ID | 기능 |
|----|------|
| `kpiFilterMetricSub` | 보조 KPI 기준 선택 |
| `kpiFilterOperatorSub` | 보조 조건 연산자 선택 |
| `kpiFilterValueSub` | 보조 기준값 입력 |

#### 조건 3 (3차 필터)
| ID | 기능 |
|----|------|
| `kpiFilterMetricTertiary` | 3차 KPI 기준 선택 |
| `kpiFilterOperatorTertiary` | 3차 조건 연산자 선택 |
| `kpiFilterValueTertiary` | 3차 기준값 입력 |

### 5. 정렬 컨트롤
| ID/name | 기능 |
|---------|------|
| `sortMetric` | 정렬 기준 선택 |
| `sortOrder` (radio) | 정렬 순서 (desc/asc) |

### 6. 모달 컨트롤
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `modal-view-btn` | `data-view="daily\|weekly\|monthly"` | 뷰 타입 선택 |
| `modal-chart-checkbox` | - | 차트 지표 토글 |
| `modal-show-more-btn` | - | 더보기/접기 |
| `modal-close` | - | 모달 닫기 |

---

## 전역 변수 및 상태 관리

### 데이터 변수
| 변수명 | 설명 | 로드 소스 |
|--------|------|----------|
| `allData` | 전체 소재 성과 데이터 | creative/Creative_data.csv |
| `imageUrlMap` | 소재이름 → 이미지 URL 매핑 (1순위) | creative/Creative_url.csv |
| `fallbackUrlMap` | 소재이름 → 대체 이미지 URL 매핑 (2순위) | creative/Creative_url.csv |
| `originalUrlMap` | 소재이름 → 원본 URL 매핑 | creative/Creative_url.csv |

### 필터 상태 객체
| 변수명 | 필드 | 설명 |
|--------|------|------|
| `filters` | `type` | 유형구분 |
| | `brand` | 브랜드명 |
| | `product` | 상품명 |
| | `promotion` | 프로모션 |
| | `campaign` | 캠페인 |
| | `adSet` | 광고세트 |
| | `startDate` | 시작일 |
| | `endDate` | 종료일 |
| | `searchText` | 소재 검색어 |

### KPI 필터 상태 객체
| 변수명 | 필드 | 설명 |
|--------|------|------|
| `kpiFilter` | `metric` | 조건 1 KPI 기준 |
| | `operator` | 조건 1 연산자 |
| | `value` | 조건 1 기준값 |
| | `enabled` | 필터 활성화 여부 |
| | `compoundLogic` | 조건 1→2 조합 방식 (none/or/and) |
| | `secondaryMetric` | 조건 2 KPI 기준 |
| | `secondaryOperator` | 조건 2 연산자 |
| | `secondaryValue` | 조건 2 기준값 |
| | `secondaryCompoundLogic` | 조건 2→3 조합 방식 |
| | `tertiaryMetric` | 조건 3 KPI 기준 |
| | `tertiaryOperator` | 조건 3 연산자 |
| | `tertiaryValue` | 조건 3 기준값 |

### 정렬 상태 객체
| 변수명 | 필드 | 기본값 |
|--------|------|--------|
| `sortConfig` | `metric` | '비용' |
| | `order` | 'desc' |

### 모달 상태 변수
| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `modalChartInstance` | Chart.js 인스턴스 | null |
| `currentModalData` | 현재 모달 데이터 | [] |
| `currentModalViewType` | 현재 뷰 타입 | 'daily' |
| `isModalTableExpanded` | 테이블 확장 상태 | false |
| `currentCreativeName` | 현재 소재 이름 | '' |

---

## 핵심 함수 목록

### 데이터 로딩/파싱 함수
| 함수명 | 기능 |
|--------|------|
| `loadData()` | 데이터 로딩 (URL 매핑 + 소재 데이터) |
| `parseCSV(text)` | CSV 텍스트 파싱 (RFC 4180) |
| `parseCSVLine(line)` | CSV 한 줄 파싱 (따옴표 처리) |
| `parseCSVWithQuotes(text)` | CSV 파싱 (URL 파일용) |

### 필터 관련 함수
| 함수명 | 기능 |
|--------|------|
| `populateFilters()` | 필터 옵션 초기화 (유형구분만) |
| `updateBrandFilter()` | 브랜드명 필터 업데이트 (유형구분 하위) |
| `updateProductFilter()` | 상품명 필터 업데이트 (브랜드명 하위) |
| `updatePromotionFilter()` | 프로모션 필터 업데이트 (상품명 하위) |
| `updateCampaignFilter()` | 캠페인 필터 업데이트 (프로모션 하위) |
| `updateAdSetFilter()` | 광고세트 필터 업데이트 (캠페인 하위) |
| `populateSelect(id, options)` | select 옵션 채우기 |
| `setDateRange()` | 날짜 범위 자동 설정 |
| `filterData()` | 필터 조건으로 데이터 필터링 |

### 데이터 집계 함수
| 함수명 | 기능 |
|--------|------|
| `aggregateByCreative(data)` | 소재별 데이터 집계 (KPI 계산 포함) |
| `aggregateModalData(data, viewType)` | 모달 데이터 집계 (일별/주별/월별) |

### 대시보드 업데이트 함수
| 함수명 | 기능 |
|--------|------|
| `updateDashboard()` | 전체 대시보드 업데이트 (필터 + KPI 필터 적용) |
| `updateSummary(data)` | 요약 KPI 카드 업데이트 |
| `updateCreativeGrid(data)` | 소재 그리드 업데이트 |

### 모달 관련 함수
| 함수명 | 기능 |
|--------|------|
| `showCreativeDetail(creativeName)` | 소재 세부 성과 모달 표시 |
| `changeModalViewType(viewType)` | 뷰 타입 변경 (daily/weekly/monthly) |
| `updateModalContent()` | 모달 내용 전체 업데이트 |
| `updateModalTable(data)` | 모달 테이블 업데이트 |
| `expandModalTable()` | 모달 테이블 펼치기 |
| `collapseModalTable()` | 모달 테이블 접기 |
| `updateModalChart()` | 모달 차트 업데이트 |
| `closeModal(event)` | 모달 닫기 |

### 유틸리티 함수
| 함수명 | 기능 |
|--------|------|
| `formatNumber(num)` | 숫자 포맷 (#,###) |
| `formatROAS(num)` | ROAS 포맷 (%) |
| `formatDateForInput(date)` | 날짜 포맷 (YYYY-MM-DD) |
| `formatNumberInput(value)` | 입력 숫자 포맷 (#,###) |
| `parseFormattedNumber(value)` | 포맷된 숫자에서 실제 값 추출 |
| `formatPeriodLabel(period, viewType)` | 기간 레이블 포맷 |

---

## 참조 데이터 파일 구조

### creative/Creative_data.csv
| 컬럼명 | 설명 |
|--------|------|
| `날짜` | 일별 데이터 기준 |
| `유형구분` | 소재 유형 구분 |
| `브랜드명` | 브랜드 이름 |
| `상품명` | 상품 이름 |
| `프로모션` | 프로모션 정보 |
| `캠페인` | 캠페인 이름 |
| `광고세트` | 광고세트 이름 |
| `소재이름` | 광고 소재 이름 |
| `비용` | 광고비 |
| `노출` | 노출수 |
| `클릭` | 클릭수 |
| `전환수` | 전환 건수 |
| `전환값` | 전환 금액 |

### creative/Creative_url.csv
| 컬럼명 | 설명 |
|--------|------|
| `광고,에셋이름` 또는 `광고` | 소재 이름 |
| `url` | 이미지 URL |
| `원본 url / ID` 또는 `원본url/ID` | 원본 URL |

#### URL 우선순위
1. `facebook.com/ads/image`, `img.youtube.com/vi/` (최우선)
2. `scontent`, `googlesyndication` (fallback)
3. 기타 URL

---

## 이벤트 리스너 (DOMContentLoaded)

### 필터 변경 이벤트
| 대상 | 이벤트 | 콜백 |
|------|--------|------|
| `filterType` | change | 유형 변경 → 브랜드 필터 업데이트 |
| `filterBrand` | change | 브랜드 변경 → 상품 필터 업데이트 |
| `filterProduct` | change | 상품 변경 → 프로모션 필터 업데이트 |
| `filterPromotion` | change | 프로모션 변경 → 캠페인 필터 업데이트 |
| `filterCampaign` | change | 캠페인 변경 → 광고세트 필터 업데이트 |
| `filterAdSet` | change | 광고세트 변경 |
| `startDate` | change | 시작일 변경 |
| `endDate` | change | 종료일 변경 |
| `searchText` | input | 실시간 소재 검색 |

### KPI 필터 이벤트
| 대상 | 이벤트 | 콜백 |
|------|--------|------|
| `kpiFilterMetric` | change | KPI 기준 변경 |
| `kpiFilterOperator` | change | 조건 연산자 변경 |
| `kpiFilterValue` | input | 기준값 입력 (포맷팅) |
| `kpiFilterToggle` | click | ON/OFF 토글 |
| `compoundLogic` radios | change | 조합 조건 변경 → 조건2 표시/숨김 |
| `compoundLogicSecondary` radios | change | 조합 조건 변경 → 조건3 표시/숨김 |

### 정렬 이벤트
| 대상 | 이벤트 | 콜백 |
|------|--------|------|
| `sortMetric` | change | 정렬 기준 변경 |
| `sortOrder` radios | change | 정렬 순서 변경 |

---

## 차트 인스턴스
| 변수명 | 차트 종류 |
|--------|----------|
| `modalChartInstance` | 모달 성과 추이 차트 (Line) |

---

## 변경 이력

| 날짜 | 작업 내용 |
|------|----------|
| 2025-12-05 | 문서 최초 작성 - creative_analysis.html 섹션별 기능 분석 |
| 2025-12-05 | Dead code 제거: `currentCreativeName` 변수 삭제 |
| 2025-12-05 | 네이밍 정규화: `sub*` → `secondary*` (kpiFilter, HTML ID, CSS class) |
| 2025-12-05 | CSS 누락 수정: `.date-range` 클래스 추가 |
| 2025-12-05 | 네이밍 정규화: `extra` → `promotion` (filters, 함수명, HTML ID) |
| 2025-12-05 | 모달 기능 확장: CPM 차트 체크박스 및 데이터셋 추가 |
| 2025-12-05 | 모달 테이블 확장: CPM, 전환값 컬럼 추가 (순서: 비용→노출→CPM→클릭→CPC→전환수→CPA→전환값→ROAS) |
