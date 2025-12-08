# creative_analysis.html 기능 분석 문서

## 목차

1. [개요](#개요)
2. [파일 정보](#파일-정보)
3. [HTML 문서 기본 구조](#html-문서-기본-구조)
4. [데이터 흐름](#데이터-흐름)
5. [섹션별 기능 브리핑](#섹션별-기능-브리핑)
6. [버튼 UI 컴포넌트](#버튼-ui-컴포넌트)
7. [전역 변수 및 상태 관리](#전역-변수-및-상태-관리)
8. [핵심 함수 구현 코드](#핵심-함수-구현-코드)
9. [참조 데이터 파일 구조](#참조-데이터-파일-구조)
10. [이벤트 리스너](#이벤트-리스너-domcontentloaded)
11. [차트 인스턴스](#차트-인스턴스)
12. [HTML/CSS 디자인 구조](#htmlcss-디자인-구조)
13. [Dead Code 점검 결과](#dead-code-점검-결과)
14. [변경 이력](#변경-이력)

---

## 개요

`data/creative_analysis.html`은 **광고 소재별 분석 대시보드**로, 광고 소재(이미지/영상)별 성과를 분석하는 대시보드입니다.

---

## 파일 정보

| 항목 | 내용 |
|------|------|
| **파일 경로** | `data/creative_analysis.html` |
| **총 라인 수** | 2987 라인 |
| **문자 인코딩** | UTF-8 |
| **HTML 언어** | ko (한국어) |
| **페이지 타이틀** | 광고 소재별 분석 - 마케팅 대시보드 |

---

## HTML 문서 기본 구조

```
<!DOCTYPE html>
<html lang="ko">
├── <head>
│   ├── meta charset, viewport
│   ├── title
│   ├── Google Fonts (Roboto, Inter)
│   └── <style> (CSS 전체)
│
├── <body>
│   ├── <div class="app-wrapper">
│   │   ├── <aside class="sidebar">
│   │   │   ├── .sidebar-header (로고)
│   │   │   └── .simplebar-content-wrapper
│   │   │       └── .sidebar-content
│   │   │           └── .nav-group (네비게이션)
│   │   │
│   │   └── <main class="main-content">
│   │       └── <div class="container">
│   │           ├── .header (페이지 헤더)
│   │           ├── .collapsible-section (필터 설정)
│   │           ├── .summary-section (요약 KPI)
│   │           ├── .filter-section.card (KPI 기준 필터)
│   │           ├── .filter-section.card (정렬 설정)
│   │           └── .creative-grid (소재 그리드)
│   │
│   ├── <div class="modal-overlay"> (세부 성과 모달)
│   ├── <script src="chart.js">
│   └── <script> (JavaScript 전체)
</body>
</html>
```

---

## 데이터 흐름

```
[페이지 로드]
     │
     ▼
[loadData()]
     │
     ├─► fetch(Creative_url.csv) → parseCSVWithQuotes()
     │       ↓
     │   imageUrlMap, fallbackUrlMap, originalUrlMap 생성
     │
     └─► fetch(Creative_data.csv) → parseCSV()
             ↓
         allData 배열 저장
             │
             ▼
     ┌───────────────────────┐
     │  populateFilters()    │  유형구분 필터 초기화
     │  setDateRange()       │  날짜 범위 자동 설정
     │  updateDashboard()    │  대시보드 최초 렌더링
     └───────────────────────┘
             │
             ▼
[사용자 필터/정렬 변경]
     │
     ▼
[updateDashboard()]
     │
     ├─► filterData() ─────────────► 필터 조건 적용
     │       ↓
     ├─► aggregateByCreative() ───► 소재별 집계
     │       ↓
     ├─► KPI 필터 적용 ───────────► kpiFilter 조건 적용
     │       ↓
     ├─► updateSummary() ─────────► 요약 KPI 업데이트
     └─► updateCreativeGrid() ────► 소재 그리드 렌더링
             │
             ▼
[소재 카드 클릭]
     │
     ▼
[showCreativeDetail(creativeName)]
     │
     └─► filterData() + 소재이름 필터
             ↓
         currentModalData 저장
             │
             ▼
     ┌───────────────────────┐
     │  updateModalContent() │
     │    ├─► aggregateModalData()
     │    ├─► KPI 카드 렌더링
     │    ├─► updateModalTable()
     │    └─► updateModalChart()
     └───────────────────────┘
```

---

## 파일 구조

### 외부 라이브러리
| 라이브러리 | 용도 |
|-----------|------|
| Chart.js | 차트 시각화 |
| Google Fonts (Roboto, Inter) | 폰트 |

---

## 섹션별 기능 브리핑

### 1. 필터 설정 (접기/펼치기)
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 필터 설정 |
| **위치** | Line 1258-1337 |
| **JS 함수** | `setDateRange()`, `populateFilters()`, `updateBrandFilter()`, `updateProductFilter()`, `updatePromotionFilter()`, `updateCampaignFilter()`, `updateAdSetFilter()` |
| **참조 데이터** | `allData` (Creative_data.csv) |
| **기능** | - 접기/펼치기 토글 기능<br>- 기간 선택 + 기본 필터 통합 레이아웃<br>- 세부 필터 (캠페인, 광고세트, 소재 검색) |

#### 1.1 기간 선택 + 기본 필터 영역
| 항목 | 내용 |
|------|------|
| **위치** | collapsible-content 내부 첫 번째 카드 |
| **레이아웃** | `filter-inline-container` (기간 선택 + 기본 필터 가로 배치) |
| **기간 선택** | 시작일/종료일 날짜 선택, 데이터 기반 자동 날짜 범위 설정 |
| **기본 필터** | 유형구분, 브랜드명, 상품명, 프로모션 (계층 구조) |

#### 1.2 세부 필터 영역
| 항목 | 내용 |
|------|------|
| **위치** | collapsible-content 내부 두 번째 카드 |
| **기능** | - 캠페인 필터 (프로모션 하위)<br>- 광고세트 필터 (캠페인 하위)<br>- 소재 검색 (LIKE '%검색어%') |

#### 필터 계층 구조
```
유형구분 → 브랜드명 → 상품명 → 프로모션 → 캠페인 → 광고세트
```

---

### 2. 요약 섹션 (KPI 카드)
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | (상단 요약 카드) |
| **위치** | Line 1339-1368 |
| **JS 함수** | `updateSummary()` |
| **참조 데이터** | `aggregateByCreative()` 결과 데이터 |
| **기능** | 주요 KPI 5개 표시: 총 비용, 평균 CPM, 평균 CPC, 평균 CPA, 평균 ROAS |

---

### 3. KPI 기준 필터
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | KPI 기준 필터 |
| **위치** | Line 1370-1502 |
| **JS 함수** | `updateDashboard()` 내 KPI 필터 로직 |
| **참조 데이터** | `kpiFilter` 상태 객체 |
| **기능** | - 조건 1: KPI 기준, 조건, 기준값, 조합 조건 (없음/또는/그리고)<br>- 조건 2: 보조 KPI 필터<br>- 조건 3: 3차 KPI 필터<br>- ON/OFF 토글 |

#### 지원 KPI 지표
- 비용, 노출, 클릭, 전환수, 전환값, CPC, CPA, ROAS

#### 조건 연산자
- `>` (보다 큼), `<` (보다 작음), `>=` (크거나 같음), `<=` (작거나 같음), `=` (같음)

---

### 4. 정렬 설정
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 정렬 설정 |
| **위치** | Line 1504-1535 |
| **JS 함수** | `aggregateByCreative()` 내 정렬 로직 |
| **참조 데이터** | `sortConfig` 상태 객체 |
| **기능** | - 정렬 기준 (비용, 노출, 클릭, 전환수, 전환값, CPC, CPA, ROAS)<br>- 정렬 순서 (내림차순/오름차순) |

---

### 5. 소재 그리드
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | (소재 카드 그리드) |
| **위치** | Line 1537-1541 |
| **JS 함수** | `updateCreativeGrid()` |
| **참조 데이터** | `aggregateByCreative()` 결과, `imageUrlMap`, `fallbackUrlMap`, `originalUrlMap` |
| **기능** | - 소재 이미지 썸네일 표시<br>- 소재별 KPI 표시 (비용, CPC, CPA, ROAS)<br>- 이미지 URL 매핑 (facebook.com/ads/image, img.youtube.com 우선)<br>- 이미지 fallback 처리<br>- 원본 URL 링크 연결<br>- 소재 클릭 시 세부 성과 모달 표시 |

---

### 6. 세부 성과 모달
| 항목 | 내용 |
|------|------|
| **섹션 헤드** | 소재 세부 성과 |
| **위치** | Line 1545-1629 |
| **JS 함수** | `showCreativeDetail()`, `changeModalViewType()`, `updateModalContent()`, `aggregateModalData()`, `updateModalTable()`, `updateModalChart()`, `expandModalTable()`, `collapseModalTable()`, `closeModal()` |
| **참조 데이터** | `currentModalData` (필터링된 소재 데이터) |
| **기능** | 아래 세부 항목 참조 |

#### 6.1 뷰 타입 선택
| 항목 | 내용 |
|------|------|
| **JS 함수** | `changeModalViewType()` |
| **기능** | - 일별/주별/월별 집계 단위 전환 |

#### 6.2 KPI 카드 (2행)
| 항목 | 내용 |
|------|------|
| **JS 함수** | `updateModalContent()` |
| **기능** | - 상단 행: 비용, CPC, CPA, ROAS<br>- 하단 행: 노출, 클릭, 전환수, 전환값 |

#### 6.3 성과 추이 차트
| 항목 | 내용 |
|------|------|
| **JS 함수** | `updateModalChart()` |
| **기능** | - 체크박스로 지표 선택 (비용, CPM, CPC, CPA, ROAS)<br>- 듀얼 Y축 지원 (왼쪽/오른쪽 축 자동 할당)<br>- Chart.js 라인 차트 |

##### 차트 체크박스 기본 상태
| ID | 지표 | 기본 체크 상태 |
|----|------|---------------|
| `modalChartCost` | 비용 | checked |
| `modalChartCPM` | CPM | unchecked |
| `modalChartCPC` | CPC | checked |
| `modalChartCPA` | CPA | unchecked |
| `modalChartROAS` | ROAS | unchecked |

#### 6.4 상세 데이터 테이블
| 항목 | 내용 |
|------|------|
| **JS 함수** | `updateModalTable()`, `expandModalTable()`, `collapseModalTable()` |
| **기능** | - 기간별 상세 데이터 표시<br>- 기본 5행 표시, 더보기/접기 버튼 |

##### 모달 테이블 컬럼 구조
| 순서 | 컬럼명 | 정렬 |
|------|--------|------|
| 1 | 기간 | left |
| 2 | 비용 | right |
| 3 | 노출 | right |
| 4 | CPM | right |
| 5 | 클릭 | right |
| 6 | CPC | right |
| 7 | 전환수 | right |
| 8 | CPA | right |
| 9 | 전환값 | right |
| 10 | ROAS | right |

---

## 버튼 UI 컴포넌트

### 전체 HTML ID 매핑

#### 필터 드롭다운
| ID | data 속성 | 기능 | 위치 |
|----|----------|------|------|
| `filterType` | - | 유형구분 선택 | 기본 필터 영역 |
| `filterBrand` | - | 브랜드명 선택 | 기본 필터 영역 |
| `filterProduct` | - | 상품명 선택 | 기본 필터 영역 |
| `filterPromotion` | - | 프로모션 선택 | 기본 필터 영역 |
| `filterCampaign` | - | 캠페인 선택 | 세부 필터 영역 |
| `filterAdSet` | - | 광고세트 선택 | 세부 필터 영역 |

#### 날짜 입력
| ID | 기능 |
|----|------|
| `startDate` | 시작일 선택 |
| `endDate` | 종료일 선택 |

#### 소재 검색
| ID | 기능 |
|----|------|
| `searchText` | 소재이름 실시간 검색 (LIKE '%검색어%') |

#### 접기/펼치기 컨트롤
| ID | 기능 |
|----|------|
| `filterCollapsibleHeader` | 필터 섹션 헤더 (클릭 → 토글) |
| `filterCollapsibleContent` | 필터 섹션 콘텐츠 영역 |

#### KPI 필터 컨트롤

##### 조건 1
| ID | 기능 |
|----|------|
| `kpiFilterMetric` | KPI 기준 선택 |
| `kpiFilterOperator` | 조건 연산자 선택 |
| `kpiFilterValue` | 기준값 입력 (숫자 자동 포맷) |
| `kpiFilterToggle` | ON/OFF 토글 버튼 |

##### 조합 조건 라디오
| name 속성 | 값 | 기능 |
|----------|-----|------|
| `compoundLogic` | `none`, `or`, `and` | 조건 1 → 조건 2 조합 방식 |
| `compoundLogicSecondary` | `none`, `or`, `and` | 조건 2 → 조건 3 조합 방식 |

##### 조건 2 (보조 필터)
| ID | 기능 |
|----|------|
| `kpiFilterMetricSecondary` | 보조 KPI 기준 선택 |
| `kpiFilterOperatorSecondary` | 보조 조건 연산자 선택 |
| `kpiFilterValueSecondary` | 보조 기준값 입력 |
| `secondaryFilterRow` | 조건 2 행 컨테이너 (표시/숨김) |

##### 조건 3 (3차 필터)
| ID | 기능 |
|----|------|
| `kpiFilterMetricTertiary` | 3차 KPI 기준 선택 |
| `kpiFilterOperatorTertiary` | 3차 조건 연산자 선택 |
| `kpiFilterValueTertiary` | 3차 기준값 입력 |
| `tertiaryFilterRow` | 조건 3 행 컨테이너 (표시/숨김) |

#### 정렬 컨트롤
| ID/name | 기능 |
|---------|------|
| `sortMetric` | 정렬 기준 선택 |
| `sortOrder` (radio) | 정렬 순서 (desc/asc) |

#### 요약 KPI 카드
| ID | 표시 내용 |
|----|----------|
| `totalCost` | 총 비용 값 |
| `avgCPM` | 평균 CPM 값 |
| `avgCPC` | 평균 CPC 값 |
| `avgCPA` | 평균 CPA 값 |
| `avgROAS` | 평균 ROAS 값 |

#### 소재 그리드
| ID | 기능 |
|----|------|
| `creativeGrid` | 소재 카드 그리드 컨테이너 |

#### 모달 컨트롤
| ID | 기능 |
|----|------|
| `creativeModal` | 모달 오버레이 |
| `modalTitle` | 모달 제목 (소재 이름) |
| `modalKpiRowTop` | 모달 KPI 상단 행 (비용, CPC, CPA, ROAS) |
| `modalKpiRowBottom` | 모달 KPI 하단 행 (노출, 클릭, 전환수, 전환값) |
| `modalChartCost` | 차트 비용 체크박스 |
| `modalChartCPM` | 차트 CPM 체크박스 |
| `modalChartCPC` | 차트 CPC 체크박스 |
| `modalChartCPA` | 차트 CPA 체크박스 |
| `modalChartROAS` | 차트 ROAS 체크박스 |
| `modalChart` | 차트 캔버스 |
| `modalTableBody` | 테이블 tbody |
| `modalShowMoreContainer` | 더보기 버튼 컨테이너 |
| `modalCollapseContainer` | 접기 버튼 컨테이너 |
| `modalHiddenCount` | 숨겨진 행 개수 표시 |

#### 모달 버튼 클래스
| 클래스 | data 속성 | 기능 |
|--------|----------|------|
| `modal-view-btn` | `data-view="daily\|weekly\|monthly"` | 뷰 타입 선택 |
| `modal-chart-checkbox` | - | 차트 지표 토글 |
| `modal-show-more-btn` | - | 더보기/접기 |
| `modal-close` | - | 모달 닫기 |

---

## 전역 변수 및 상태 관리

### 전역 변수 초기값

```javascript
// 전역 변수
let allData = [];
let imageUrlMap = {}; // 소재이름 -> 이미지 URL 매핑 (1순위)
let fallbackUrlMap = {}; // 소재이름 -> 대체 이미지 URL 매핑 (2순위)
let originalUrlMap = {}; // 소재이름 -> 원본 URL 매핑
let filters = {
    type: '',
    brand: '',
    product: '',
    promotion: '',
    campaign: '',
    adSet: '',
    startDate: '',
    endDate: '',
    searchText: ''
};

// KPI 기준 필터
let kpiFilter = {
    metric: '비용',
    operator: '>',
    value: '',
    enabled: false,
    compoundLogic: 'none',
    secondaryMetric: '비용',
    secondaryOperator: '>',
    secondaryValue: '',
    secondaryCompoundLogic: 'none',
    tertiaryMetric: '비용',
    tertiaryOperator: '>',
    tertiaryValue: ''
};

// 정렬 설정
let sortConfig = {
    metric: '비용',
    order: 'desc'
};

// 모달 관련 전역 변수
let modalChartInstance = null;
let currentModalData = [];
let currentModalViewType = 'daily';
let isModalTableExpanded = false;
```

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

---

## 핵심 함수 구현 코드

### 데이터 로딩/파싱 함수

#### loadData()
```javascript
async function loadData() {
    try {
        // 1. 이미지 URL 매핑 데이터 로드
        const urlResponse = await fetch(imageUrlFile);
        if (urlResponse.ok) {
            const urlText = await urlResponse.text();
            const urlData = parseCSVWithQuotes(urlText);
            // 소재이름 -> URL 매핑 생성 (facebook.com/ads/image 최우선, scontent fallback)
            urlData.forEach(row => {
                const creativeName = row['광고,에셋이름'] || row['광고'];
                const url = row['url'];
                const originalUrl = row['원본 url / ID'] || row['원본url/ID'] || '';
                if (creativeName && url) {
                    // URL 우선순위 처리 로직...
                }
            });
        }
        // 2. 소재 성과 데이터 로드
        const dataResponse = await fetch(creativeDataFile);
        if (!dataResponse.ok) throw new Error('Failed to load creative data');
        const dataText = await dataResponse.text();
        allData = parseCSV(dataText);
        populateFilters();
        setDateRange();
        updateDashboard();
    } catch (err) {
        console.error('Error loading data:', err);
        document.getElementById('creativeGrid').innerHTML =
            '<div class="empty-state" style="grid-column: 1 / -1;"><h3>데이터 로드 실패</h3><p>데이터를 불러올 수 없습니다</p></div>';
    }
}
```

#### parseCSV(text) - RFC 4180 호환
```javascript
function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = parseCSVLine(lines[0]).map(h => h.trim());
    return lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] ? values[index].trim() : '';
        });
        return obj;
    });
}
```

#### parseCSVLine(line) - RFC 4180 호환
```javascript
function parseCSVLine(line) {
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
```

### 필터 관련 함수

#### filterData()
```javascript
function filterData() {
    return allData.filter(row => {
        if (filters.type && row['유형구분'] !== filters.type) return false;
        if (filters.brand && row['브랜드명'] !== filters.brand) return false;
        if (filters.product && row['상품명'] !== filters.product) return false;
        if (filters.promotion && row['프로모션'] !== filters.promotion) return false;
        if (filters.campaign && row['캠페인'] !== filters.campaign) return false;
        if (filters.adSet && row['광고세트'] !== filters.adSet) return false;
        if (filters.startDate || filters.endDate) {
            const rowDate = new Date(row['날짜']);
            if (isNaN(rowDate)) return false;
            if (filters.startDate && rowDate < new Date(filters.startDate)) return false;
            if (filters.endDate && rowDate > new Date(filters.endDate)) return false;
        }
        return true;
    });
}
```

#### 계층 필터 업데이트 함수
| 함수명 | 기능 |
|--------|------|
| `populateFilters()` | 필터 옵션 초기화 (유형구분만) |
| `updateBrandFilter()` | 브랜드명 필터 업데이트 (유형구분 하위) |
| `updateProductFilter()` | 상품명 필터 업데이트 (브랜드명 하위) |
| `updatePromotionFilter()` | 프로모션 필터 업데이트 (상품명 하위) |
| `updateCampaignFilter()` | 캠페인 필터 업데이트 (프로모션 하위) |
| `updateAdSetFilter()` | 광고세트 필터 업데이트 (캠페인 하위) |

### 데이터 집계 함수

#### aggregateByCreative(data)
```javascript
function aggregateByCreative(data) {
    const groups = {};
    data.forEach(row => {
        const key = row['소재이름'] || '기타';
        if (!groups[key]) {
            groups[key] = { name: key, 비용: 0, 노출: 0, 클릭: 0, 전환수: 0, 전환값: 0 };
        }
        groups[key].비용 += parseFloat(row['비용']) || 0;
        groups[key].노출 += parseFloat(row['노출']) || 0;
        groups[key].클릭 += parseFloat(row['클릭']) || 0;
        groups[key].전환수 += parseFloat(row['전환수']) || 0;
        groups[key].전환값 += parseFloat(row['전환값']) || 0;
    });
    // KPI 계산 및 정렬
    return Object.values(groups).map(g => ({
        ...g,
        CPM: g.노출 > 0 ? (g.비용 / g.노출 * 1000) : 0,
        CPC: g.클릭 > 0 ? (g.비용 / g.클릭) : 0,
        CPA: g.전환수 > 0 ? (g.비용 / g.전환수) : 0,
        ROAS: g.비용 > 0 ? (g.전환값 / g.비용 * 100) : 0
    })).sort((a, b) => {
        const aVal = a[sortConfig.metric];
        const bVal = b[sortConfig.metric];
        return sortConfig.order === 'desc' ? bVal - aVal : aVal - bVal;
    });
}
```

#### aggregateModalData(data, viewType)
```javascript
function aggregateModalData(data, viewType) {
    const groups = {};
    data.forEach(row => {
        let key;
        const date = new Date(row['날짜']);
        if (viewType === 'daily') {
            key = row['날짜'];
        } else if (viewType === 'weekly') {
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(date.setDate(diff));
            key = formatDateForInput(monday);
        } else if (viewType === 'monthly') {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
        if (!groups[key]) {
            groups[key] = { 비용: 0, 노출: 0, 클릭: 0, 전환수: 0, 전환값: 0 };
        }
        groups[key].비용 += parseFloat(row['비용']) || 0;
        groups[key].노출 += parseFloat(row['노출']) || 0;
        groups[key].클릭 += parseFloat(row['클릭']) || 0;
        groups[key].전환수 += parseFloat(row['전환수']) || 0;
        groups[key].전환값 += parseFloat(row['전환값']) || 0;
    });
    // 파생 지표 계산 및 정렬 (내림차순)
    return Object.entries(groups)
        .map(([period, values]) => ({
            period,
            ...values,
            CPM: values.노출 > 0 ? (values.비용 / values.노출 * 1000) : 0,
            CPC: values.클릭 > 0 ? (values.비용 / values.클릭) : 0,
            CPA: values.전환수 > 0 ? (values.비용 / values.전환수) : 0,
            ROAS: values.비용 > 0 ? (values.전환값 / values.비용 * 100) : 0
        }))
        .sort((a, b) => b.period.localeCompare(a.period));
}
```

### 대시보드 업데이트 함수

#### updateDashboard()
```javascript
function updateDashboard() {
    const filteredData = filterData();
    let creativeData = aggregateByCreative(filteredData);
    // 소재 검색 필터 적용
    if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        creativeData = creativeData.filter(creative =>
            creative.name.toLowerCase().includes(searchLower)
        );
    }
    // KPI 기준 필터 적용
    if (kpiFilter.enabled && kpiFilter.value !== '') {
        // 복합 조건 필터링 로직...
    }
    updateSummary(creativeData);
    updateCreativeGrid(creativeData);
}
```

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

### 접기/펼치기 이벤트
| 대상 | 이벤트 | 콜백 |
|------|--------|------|
| `filterCollapsibleHeader` | click | 필터 섹션 접기/펼치기 토글 (expanded 클래스, 버튼 텍스트/아이콘 변경) |

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

#### 2.2 접기/펼치기 컴포넌트 `.collapsible-*`
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

**HTML 구조**:
```html
<div class="collapsible-section">
    <div class="collapsible-header" id="filterCollapsibleHeader">
        <div class="collapsible-title">필터 설정</div>
        <button class="collapsible-toggle">
            <span>펼치기</span>
            <span class="collapsible-toggle-icon collapsed">▼</span>
        </button>
    </div>
    <div class="collapsible-content" id="filterCollapsibleContent">
        <!-- 접히는 콘텐츠 -->
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

#### 2.3 필터 컴포넌트 `.filter-*`
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
    gap: 37px;  /* 라벨과 date-range 간격 */
}
.filter-setting-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
}
```

---

#### 2.4 날짜 범위 컴포넌트 `.date-range`
> **통합 우선순위**: 높음

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
.date-range input[type="date"]:focus {
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

#### 2.5 버튼 컴포넌트
> **통합 우선순위**: 높음

| 컴포넌트 | 기본 상태 | hover 상태 | active 상태 |
|----------|-----------|------------|-------------|
| `.collapsible-toggle` | `bg: primary-light, color: primary-main` | `bg: primary-main, color: white` | - |
| `.modal-view-btn` | `bg: paper, border: grey-300` | `border: primary-main, color: primary-main` | `bg: primary-main, color: white` |
| `.kpi-filter-toggle` | `bg: grey-100, color: grey-500` | `border: primary-main` | `bg: primary-main, color: white` |
| `.modal-show-more-btn` | `bg: grey-100, border: grey-300` | `bg: primary-light, color: primary-main` | - |

---

#### 2.6 라디오 그룹 컴포넌트
> **통합 우선순위**: 중간

```css
.compound-radio-group, .sort-radio-group {
    display: flex;
    gap: 8px;  /* compound: 8px, sort: 12px */
    align-items: center;
    height: 38px;
}
.radio-label {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    font-size: 13px;
    color: var(--grey-700);
}
.radio-label input[type="radio"] {
    margin: 0;
    cursor: pointer;
}
```

---

### 3. 모달 컴포넌트 `.modal-*`
> **통합 우선순위**: 중간 - 세부 성과 확인 시 사용

#### 3.1 모달 기본 구조
```css
.modal-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 2000;
    justify-content: center;
    align-items: center;
}
.modal-overlay.active { display: flex; }

.modal-content {
    background: var(--paper);
    border-radius: 16px;
    width: 90%;
    max-width: 900px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--grey-200);
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.modal-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--grey-900);
}
.modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--grey-500);
    padding: 4px;
    line-height: 1;
}
.modal-close:hover {
    color: var(--grey-900);
}
.modal-body {
    padding: 24px;
}
```

#### 3.2 모달 KPI 카드
```css
.modal-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
}
.modal-kpi-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 12px;
}
.modal-kpi-card {
    background: var(--grey-50);
    padding: 16px;
    border-radius: 12px;
    text-align: center;
}
.modal-kpi-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--grey-500);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
}
.modal-kpi-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--grey-900);
}
```

#### 3.3 모달 차트 섹션
```css
.modal-chart-section {
    margin-top: 24px;
}
.modal-chart-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--grey-900);
    margin-bottom: 16px;
}
.modal-chart-controls {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
}
.modal-chart {
    width: 100%;
    height: 300px;
    background: var(--grey-50);
    border-radius: 12px;
    padding: 16px;
}

/* 차트 체크박스 */
.modal-chart-checkbox {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 16px;
    background: var(--grey-100);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}
.modal-chart-checkbox:hover {
    background: var(--grey-200);
}
.modal-chart-checkbox input {
    width: 14px;
    height: 14px;
    accent-color: var(--primary-main);
    cursor: pointer;
}
/* 지표별 색상 코드 (좌측 border) */
.modal-chart-checkbox.cost { border-left: 3px solid #673ab7; }  /* 비용 - 보라 */
.modal-chart-checkbox.cpm  { border-left: 3px solid #9c27b0; }  /* CPM - 자주 */
.modal-chart-checkbox.cpc  { border-left: 3px solid #2196f3; }  /* CPC - 파랑 */
.modal-chart-checkbox.cpa  { border-left: 3px solid #ff9800; }  /* CPA - 주황 */
.modal-chart-checkbox.roas { border-left: 3px solid #00c853; }  /* ROAS - 녹색 */
```

#### 3.4 모달 테이블
```css
.modal-table-section {
    margin-top: 24px;
}
.modal-table-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--grey-900);
    margin-bottom: 16px;
}
.modal-table-container {
    background: var(--grey-50);
    border-radius: 12px;
    overflow: hidden;
}
.modal-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}
.modal-table th {
    background: var(--grey-100);
    padding: 12px 16px;
    text-align: right;
    font-weight: 600;
    color: var(--grey-700);
    border-bottom: 1px solid var(--grey-200);
}
.modal-table th:first-child { text-align: left; }
.modal-table td {
    padding: 12px 16px;
    text-align: right;
    border-bottom: 1px solid var(--grey-200);
    color: var(--grey-900);
}
.modal-table td:first-child {
    text-align: left;
    font-weight: 500;
}
.modal-table tr:last-child td {
    border-bottom: none;
}
.modal-table tr:hover {
    background: rgba(103, 58, 183, 0.05);  /* primary-main 투명도 */
}
```

---

### 4. 페이지 고유 컴포넌트 (creative_analysis 전용)

#### 4.1 요약 그리드 `.summary-*`
```css
.summary-section {
    margin-bottom: 24px;
}
.summary-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
}
.summary-card {
    padding: 20px;
    border-radius: 12px;
}
.summary-card h3 {
    font-size: 11px;
    font-weight: 600;
    color: var(--grey-500);
    text-transform: uppercase;
    margin-bottom: 8px;
}
.summary-card .value {
    font-size: 24px;
    font-weight: 700;
    color: var(--grey-900);
}
.summary-card .unit {
    font-size: 11px;
    color: var(--grey-500);
    margin-top: 4px;
}
```

#### 4.2 소재 그리드 `.creative-*`
```css
.creative-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
    margin-bottom: 24px;
}
.creative-card {
    border-radius: 16px;
    overflow: hidden;
}
.creative-image-wrapper {
    position: relative;
    width: 100%;
    padding-top: 100%;  /* 1:1 비율 유지 */
    background: var(--grey-100);
    overflow: hidden;
}
.creative-image {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}
.creative-card:hover .creative-image {
    transform: scale(1.05);
}
.creative-info {
    padding: 20px;
}
.creative-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--grey-900);
    margin-bottom: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.creative-name.clickable {
    cursor: pointer;
    transition: color 0.2s ease;
}
.creative-name.clickable:hover {
    color: var(--primary-main);
    text-decoration: underline;
}
.creative-metrics {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}
.metric-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--grey-500);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
}
.metric-value {
    font-size: 16px;
    font-weight: 700;
    color: var(--grey-900);
}
.metric-value.positive {
    color: var(--success-main);
}
.metric-value.negative {
    color: var(--error-main);
}
```

---

### 5. Chart.js 설정 (모달 차트)

#### 5.1 지표별 색상 코드
| 지표 | 색상 코드 | 설명 |
|------|----------|------|
| 비용 | `#673ab7` | 보라색 (primary-main) |
| CPM | `#9c27b0` | 자주색 |
| CPC | `#2196f3` | 파란색 (secondary-main) |
| CPA | `#ff9800` | 주황색 |
| ROAS | `#00c853` | 녹색 (success-main) |

#### 5.2 듀얼 Y축 로직
```javascript
// Y축 할당 로직 - 우선순위: 비용 > CPM > CPC > CPA > ROAS
// 첫 번째 지표는 왼쪽(y), 두 번째 이상 지표는 오른쪽(y1)

const hasCostMetric = showCost;
const hasCpmMetric = showCPM;
const hasCpcMetric = showCPC;
const hasCpaMetric = showCPA;

// 데이터셋 yAxisID 할당
if (showCost) { yAxisID: 'y' }  // 비용은 항상 왼쪽
if (showCPM)  { yAxisID: hasCostMetric ? 'y1' : 'y' }
if (showCPC)  { yAxisID: (hasCostMetric || hasCpmMetric) ? 'y1' : 'y' }
if (showCPA)  { yAxisID: (hasCostMetric || hasCpmMetric || hasCpcMetric) ? 'y1' : 'y' }
if (showROAS) { yAxisID: (hasCostMetric || hasCpmMetric || hasCpcMetric || hasCpaMetric) ? 'y1' : 'y' }
```

#### 5.3 Chart.js 옵션
```javascript
{
    type: 'line',
    options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
        plugins: {
            legend: { position: 'top' },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        // ROAS는 % 표시, 나머지는 원 표시
                        if (context.dataset.label === 'ROAS') {
                            return context.dataset.label + ': ' + Math.round(context.parsed.y) + '%';
                        }
                        return context.dataset.label + ': ' + formatNumber(context.parsed.y) + '원';
                    }
                }
            }
        },
        scales: {
            x: { grid: { display: false } },
            y: {
                type: 'linear',
                position: 'left',
                title: { display: true, text: '금액 (원)' }
            },
            y1: {
                type: 'linear',
                position: 'right',
                display: true,  // 2개 이상 지표 선택 시에만 표시
                grid: { drawOnChartArea: false }
            }
        }
    }
}
```

---

### 6. 이미지 URL 처리 로직

#### 6.1 URL 우선순위
```
1순위: facebook.com/ads/image, img.youtube.com/vi/  (imageUrlMap)
2순위: scontent, googlesyndication                   (fallbackUrlMap)
3순위: 기타 URL
```

#### 6.2 Fallback 처리 흐름
```
1. imageUrlMap[소재이름]에서 이미지 URL 로드 시도
   ↓ 실패 시
2. fallbackUrlMap[소재이름]에서 대체 URL 로드 시도
   ↓ 실패 시
3. placeholder 표시 ("이미지 로드 실패")
```

#### 6.3 onerror 핸들러 코드
```javascript
// fallback URL이 있는 경우
onerror="if(!this.dataset.tried){
    this.dataset.tried='1';
    this.src='{fallbackUrl}';
}else{
    this.style.display='none';
    this.nextElementSibling.style.display='block';
}"

// fallback URL이 없는 경우
onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
```

#### 6.4 원본 URL 링크
- `originalUrlMap[소재이름]`에 원본 URL 저장
- 이미지 클릭 시 새 탭에서 원본 URL 열기
- 원본 URL이 없으면 `imageUrl`을 링크로 사용

---

### 7. 레이아웃 구조

#### 7.1 전체 레이아웃
```
┌─────────────────────────────────────────────────────────┐
│ .app-wrapper (display: flex)                            │
│ ┌──────────┬────────────────────────────────────────────┤
│ │ .sidebar │ .main-content                              │
│ │ (fixed)  │ (margin-left: 260px)                       │
│ │          │ ┌──────────────────────────────────────┐   │
│ │          │ │ .container (max-width: 1600px)       │   │
│ │          │ │                                      │   │
│ └──────────┴─┴──────────────────────────────────────┴───┘
```

#### 7.2 사이드바 CSS
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
```

#### 7.3 메인 컨텐츠 영역 CSS
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

---

### 8. 반응형 브레이크포인트

| 브레이크포인트 | 적용 대상 | 변경 사항 |
|---------------|----------|----------|
| `1400px` | `.summary-grid` | 5열 → 3열 |
| `1200px` | `.sidebar` | `transform: translateX(-100%)` (숨김) |
| `1200px` | `.main-content` | `margin-left: 0` |
| `768px` | `.main-content` | `padding: 16px` |
| `768px` | `.creative-grid` | `minmax(280px, 1fr)` |
| `768px` | `.summary-grid` | 3열 → 2열 |
| `768px` | `.filter-row` | `flex-direction: column` |
| `768px` | `.modal-kpi-grid`, `.modal-kpi-row` | 4열 → 2열 |
| `768px` | `.filter-inline-container` | column 방향, gap 24px |
| `480px` | `.summary-grid` | 2열 → 1열 |

---

### 9. 통합 시 주의사항

#### 9.1 CSS 변수 의존성
- 모든 색상은 CSS 변수 사용 필수
- 변수 미정의 시 fallback 없음 → 스타일 깨짐

#### 9.2 z-index 계층
| 요소 | z-index |
|------|---------|
| `.sidebar` | 1000 |
| `.modal-overlay` | 2000 |

#### 9.3 공통 스타일 우선 적용
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

#### 9.4 외부 라이브러리 의존성
```html
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

#### 9.5 컴포넌트 분리 권장 순서
1. **CSS 변수** → 별도 파일 또는 공통 head
2. **공통 컴포넌트** (card, filter, collapsible, button)
3. **레이아웃** (sidebar, main-content)
4. **페이지 고유 컴포넌트**

---

## Dead Code 점검 결과

### 제거된 코드
| 날짜 | 항목 | 설명 |
|------|------|------|
| 2025-12-05 | `currentCreativeName` 변수 | 선언만 되고 사용되지 않는 변수 삭제 |

### 현재 상태
- Dead Code 없음 (모든 전역 변수, 함수가 사용 중)
- 미사용 CSS 클래스 없음

### 네이밍 정규화 완료
| 기존 | 변경 | 적용 대상 |
|------|------|----------|
| `sub*` | `secondary*` | kpiFilter 객체, HTML ID (kpiFilterMetricSecondary 등), CSS class |
| `extra` | `promotion` | filters 객체, 필터 함수명, HTML ID (filterPromotion) |

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
| 2025-12-08 | 필터 섹션 통합: 기간 선택 + 필터 설정을 접기/펼치기 섹션으로 통합 (marketing_dashboard_v3.html 참고) |
| 2025-12-08 | CSS 추가: collapsible 컴포넌트, filter-inline-container, filter-date-section, filter-setting-section |
| 2025-12-08 | 문서 업데이트: 섹션 번호 재정렬 (7개 → 6개), HTML/CSS 디자인 구조 섹션 추가 |
| 2025-12-08 | 컴포넌트 문서 보완: 페이지 헤더, 로딩/빈 상태, 소재 카드 내부 구조 (creative-info, creative-name, creative-metrics) |
| 2025-12-08 | Chart.js 설정 섹션 추가: 지표별 색상 코드, 듀얼 Y축 로직, 옵션 상세 |
| 2025-12-08 | 이미지 URL 처리 로직 섹션 추가: URL 우선순위, fallback 흐름, onerror 핸들러 |
| 2025-12-08 | ID 불일치 수정: `filterExtra`→`filterPromotion`, `*Sub`→`*Secondary` (kpiFilterMetric, kpiFilterOperator, kpiFilterValue, compoundLogic) |
| 2025-12-08 | 사이드바 CSS 상세 문서화: sidebar, sidebar-header, sidebar-logo, nav-group, nav-item 등 전체 CSS 코드 추가 |
| 2025-12-08 | 메인 컨텐츠 CSS 추가: main-content, container |
| 2025-12-08 | 모달 CSS 보완: modal-header, modal-title, modal-close, modal-body, modal-view-type-section, modal-view-btn |
| 2025-12-08 | 모달 차트 CSS 보완: modal-chart-section, modal-chart-title, modal-chart-controls, modal-chart, checkbox hover/input |
| 2025-12-08 | 모달 테이블 CSS 보완: modal-table-section, modal-table-title, modal-table-container, td:first-child, tr:last-child, modal-show-more-* |
| 2025-12-08 | 문서 구조 대폭 보완: 목차 추가, HTML 문서 기본 구조 추가, 파일 정보 추가, 데이터 흐름 다이어그램 추가 |
| 2025-12-08 | 핵심 함수 구현 코드 추가: loadData, parseCSV, parseCSVLine, filterData, aggregateByCreative, aggregateModalData |
| 2025-12-08 | 전역 변수 초기값 추가: 전체 JavaScript 초기화 코드 블록 |
| 2025-12-08 | 전체 HTML ID 매핑 보완: 모든 ID 목록 추가 (접기/펼치기, 요약 KPI, 모달 컨트롤 등) |
| 2025-12-08 | 모달 테이블 컬럼 구조 추가: 10개 컬럼 순서 및 정렬 방향 명시 |
| 2025-12-08 | 차트 체크박스 기본 상태 추가: 5개 지표별 기본 체크 상태 명시 |
| 2025-12-08 | Dead Code 점검 결과 섹션 추가: 제거 이력, 현재 상태, 네이밍 정규화 결과 |
