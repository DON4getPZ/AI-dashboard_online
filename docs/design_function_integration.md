# 마케팅 대시보드 통합 아키텍처 분석

## 1. 현황 분석

### 1.1 대상 HTML 파일
| 파일명 | 용도 | 주요 기능 |
|--------|------|-----------|
| `marketing_dashboard_v3.html` | 광고 성과 대시보드 | KPI 카드, 차트, 필터, 일/주/월별 뷰 |
| `creative_analysis.html` | 소재별 성과 대시보드 | 소재 그리드, 이미지 매핑, 성과 모달 |
| `timeseries_analysis.html` | 시계열 현황 분석 | 일별/주별/월별 성과 추이 분석 |
| `type_dashboard.html` | 마케팅 성과 분석 | 의사결정 도구, 추이 분석, 타겟 분석 |
| `funnel_dashboard.html` | GA4 퍼널 분석 | D3.js 퍼널 차트, 채널 클러스터링 |

### 1.2 외부 의존성
```
공통:
- Google Fonts (Inter, Roboto)
- Chart.js

type_dashboard.html, funnel_dashboard.html 추가:
- chartjs-plugin-datalabels
- D3.js v7
```

---

## 2. 공통 코드 분석

### 2.1 CSS 공통 스타일 (100% 동일)

#### CSS Variables (Berry Theme)
```css
:root {
    --primary-main: #673ab7;
    --primary-light: #ede7f6;
    --primary-dark: #5e35b1;
    --secondary-main: #2196f3;
    --secondary-light: #e3f2fd;
    --success-main: #00c853;
    --success-light: #b9f6ca;
    --warning-main: #ffab00;
    --warning-light: #fff8e1;
    --error-main: #ff1744;
    --error-light: #ffeaea;
    --grey-50: #fafafa;
    --grey-100: #f5f5f5;
    --grey-200: #eeeeee;
    --grey-300: #e0e0e0;
    --grey-500: #9e9e9e;
    --grey-700: #616161;
    --grey-900: #212121;
    --paper: #ffffff;
    --background: #f8fafc;
    --sidebar-bg: #ffffff;
    --sidebar-width: 260px;
}
```

#### 공통 레이아웃 컴포넌트
| 클래스명 | 설명 | 파일별 존재 |
|----------|------|-------------|
| `.app-wrapper` | 전체 레이아웃 컨테이너 | 4개 전부 |
| `.sidebar` | 좌측 네비게이션 | 4개 전부 |
| `.main-content` | 메인 컨텐츠 영역 | 4개 전부 |
| `.card` | 카드 컴포넌트 | 4개 전부 |
| `.filter-section` | 필터 섹션 | 4개 전부 |
| `.kpi-card` / `.kpi-wrapper` | KPI 카드 | 4개 전부 |
| `.view-btn` | 뷰 타입 버튼 | 4개 전부 |
| `.nav-item` / `.nav-group` | 네비게이션 아이템 | 4개 전부 |

### 2.2 JavaScript 공통 함수

#### 동일/유사 함수 목록
| 함수명 | 기능 | 파일 |
|--------|------|------|
| `parseCSV(text)` | CSV 파싱 (RFC 4180) | 4개 전부 |
| `formatNumber(num)` | 숫자 포맷팅 (#,###) | 4개 전부 |
| `loadData()` | 데이터 로드 | 4개 전부 |
| `filterData()` | 데이터 필터링 | marketing_dashboard_v3, creative_analysis |
| `updateDashboard()` | 대시보드 업데이트 | 4개 전부 |
| `populateFilters()` | 필터 옵션 생성 | marketing_dashboard_v3, creative_analysis |
| `formatDateForInput(date)` | 날짜 포맷팅 | marketing_dashboard_v3, creative_analysis, funnel_dashboard |

#### RFC 4180 표준 parseCSV 함수 (통합 표준)

> 📋 상세 문서: [CSV_PARSING_STANDARD.md](./CSV_PARSING_STANDARD.md)

**왜 RFC 4180이 필요한가?**
- 광고 소재명에 쉼표 포함: `"USP강조,일상(블랙래빗)"`
- 숫자 값에 천단위 구분자: `"30,404"`, `"179,000"`
- 단순 `line.split(',')` 사용 시 데이터 손실 및 컬럼 매핑 오류 발생

**표준 구현 코드:**
```javascript
/**
 * RFC 4180 표준 CSV 파싱 함수
 * @param {string} text - CSV 텍스트
 * @param {string} filename - 파일명 (디버깅용)
 * @returns {Array<Object>} 파싱된 데이터 배열
 */
function parseCSV(text, filename = 'unknown') {
    console.log(`=== parseCSV 시작: ${filename} ===`);

    // BOM (Byte Order Mark) 제거
    text = text.replace(/^\uFEFF/, '');

    const lines = text.trim().split('\n');
    console.log(`총 라인 수: ${lines.length}`);

    // RFC 4180 호환 CSV 한 줄 파싱
    function parseLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // 연속된 따옴표는 이스케이프된 따옴표 ("" → ")
                    current += '"';
                    i++;
                } else {
                    // 따옴표 시작/종료 토글
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // 따옴표 밖의 쉼표만 구분자로 처리
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current);
        return result;
    }

    // 헤더 파싱
    const headers = parseLine(lines[0]).map(h => h.trim());
    console.log('헤더:', headers);

    // 데이터 파싱
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i]);
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] ? values[index].trim() : '';
            });
            data.push(row);
        }
    }

    console.log(`파싱된 데이터 행 수: ${data.length}`);
    return data;
}
```

**핵심 특징:**
| 기능 | 설명 |
|------|------|
| BOM 제거 | UTF-8 BOM 문자 (`\uFEFF`) 자동 제거 |
| 따옴표 처리 | `inQuotes` 상태 추적으로 내부 쉼표 보호 |
| 이스케이프 | `""` → `"` 변환 (RFC 4180 표준) |
| 디버깅 | filename 파라미터로 로깅 추적 |

**적용 상태:**
- [x] marketing_dashboard_v3.html
- [x] creative_analysis.html
- [x] funnel_dashboard.html
- [x] type_dashboard.html

**결론**: 모든 HTML 파일에 RFC 4180 표준 parseCSV 적용 완료

#### formatNumber 함수 비교
```javascript
// 모든 파일 동일 패턴
function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    return Math.round(num).toLocaleString('ko-KR');
}
```

**결론**: 거의 동일. **공통 유틸리티로 추출 가능**

### 2.3 데이터 구조 비교

#### CSV 파일 소스
| 대시보드 | 데이터 소스 |
|----------|-------------|
| marketing_dashboard_v3 | `raw/2025-01.csv` ~ `raw/2025-11.csv` |
| type_dashboard | `raw/2025-*.csv` + 연령/성별/플랫폼 데이터 |
| creative_analysis | `creative/2025-11.csv` + 이미지 URL 매핑 |
| funnel_dashboard | `funnel/AARRR_*.csv` (GA4 퍼널 데이터) |

#### 공통 데이터 필드
```
유형구분, 브랜드명, 상품명, 프로모션, 캠페인, 세트이름
비용, 노출, 클릭, 전환수, 전환값
일 구분, 주 구분, 월 구분
```

---

## 3. 컴포넌트화 제안

### 3.1 추출 가능한 공통 컴포넌트

```
src/
├── components/
│   ├── layout/
│   │   ├── AppWrapper.tsx        # .app-wrapper
│   │   ├── Sidebar.tsx           # .sidebar (네비게이션 포함)
│   │   └── MainContent.tsx       # .main-content
│   │
│   ├── common/
│   │   ├── Card.tsx              # .card
│   │   ├── FilterSection.tsx     # .filter-section
│   │   ├── FilterGroup.tsx       # .filter-group
│   │   ├── DateRangePicker.tsx   # .date-range
│   │   └── ViewTypeButton.tsx    # .view-btn
│   │
│   ├── kpi/
│   │   ├── KPIWrapper.tsx        # .kpi-wrapper
│   │   ├── KPICard.tsx           # .kpi-card
│   │   └── KPISummary.tsx        # .kpi-summary
│   │
│   ├── chart/
│   │   ├── ChartSection.tsx      # .chart-section
│   │   ├── ChartContainer.tsx    # .chart-container
│   │   ├── TrendChart.tsx        # Chart.js 트렌드 차트
│   │   └── FunnelChart.tsx       # D3.js 퍼널 차트
│   │
│   ├── table/
│   │   ├── DataTable.tsx         # 기본 테이블
│   │   ├── SortableTable.tsx     # 정렬 가능 테이블
│   │   └── ShowMoreButton.tsx    # 더보기/접기
│   │
│   └── navigation/
│       ├── NavGroup.tsx          # .nav-group
│       └── NavItem.tsx           # .nav-item
│
├── utils/
│   ├── csvParser.ts              # parseCSV (통합)
│   ├── formatters.ts             # formatNumber, formatROAS, formatDate
│   ├── dateUtils.ts              # 날짜 관련 유틸
│   └── dataAggregator.ts         # 데이터 집계 로직
│
├── hooks/
│   ├── useData.ts                # 데이터 로드/필터 훅
│   ├── useFilters.ts             # 필터 상태 관리
│   └── useDateRange.ts           # 날짜 범위 관리
│
├── styles/
│   ├── variables.css             # CSS 변수
│   ├── layout.css                # 레이아웃 스타일
│   └── components.css            # 컴포넌트 스타일
│
└── types/
    ├── data.ts                   # 데이터 타입 정의
    └── filters.ts                # 필터 타입 정의
```

### 3.2 통합 우선순위

| 우선순위 | 컴포넌트/유틸 | 이유 |
|----------|--------------|------|
| 1 | CSS Variables | 4개 파일 100% 동일 |
| 1 | Sidebar/Navigation | 구조 동일, 링크만 다름 |
| 1 | formatNumber | 모든 파일 동일 |
| 2 | parseCSV | 로직 유사, 통합 가능 |
| 2 | Card, FilterSection | 스타일 동일 |
| 2 | KPICard | 레이아웃 동일, 데이터만 다름 |
| 3 | ChartSection | Chart.js 설정 유사 |
| 3 | DataTable | 구조 유사, 컬럼만 다름 |

---

## 4. React 앱 마이그레이션 전략

### 4.1 프로젝트 구조 제안

```
marketing-dashboard-react/
├── public/
│   └── data/                     # CSV 파일들
│       ├── raw/
│       ├── creative/
│       └── funnel/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx            # 공통 레이아웃 (Sidebar)
│   │   ├── page.tsx              # 메인 대시보드
│   │   ├── creative/
│   │   │   └── page.tsx          # 소재별 분석
│   │   ├── channel/
│   │   │   └── page.tsx          # 채널별 분석
│   │   └── funnel/
│   │       └── page.tsx          # 퍼널 분석
│   │
│   ├── components/               # (위 3.1 구조)
│   ├── utils/
│   ├── hooks/
│   ├── stores/                   # Zustand/Jotai 상태 관리
│   │   ├── filterStore.ts
│   │   └── dataStore.ts
│   │
│   └── types/
│
├── package.json
└── tsconfig.json
```

### 4.2 기술 스택 제안

```json
{
  "dependencies": {
    "react": "^18.x",
    "next.js": "^14.x",           // 또는 Vite + React Router
    "chart.js": "^4.x",
    "react-chartjs-2": "^5.x",
    "d3": "^7.x",
    "zustand": "^4.x",            // 상태 관리
    "papaparse": "^5.x",          // CSV 파싱 (표준 라이브러리)
    "date-fns": "^3.x",           // 날짜 처리
    "@tanstack/react-query": "^5.x"  // 데이터 페칭
  }
}
```

### 4.3 마이그레이션 단계

#### Phase 1: 기반 구축 (1-2주)
1. 프로젝트 초기화 (Next.js 또는 Vite)
2. CSS Variables 및 공통 스타일 이전
3. 레이아웃 컴포넌트 (AppWrapper, Sidebar, MainContent)
4. 공통 유틸리티 (csvParser, formatters)

#### Phase 2: 공통 컴포넌트 (2-3주)
1. Card, FilterSection, DateRangePicker
2. KPICard, KPIWrapper
3. DataTable, SortableTable
4. 상태 관리 (Zustand store 설정)

#### Phase 3: 차트 컴포넌트 (1-2주)
1. TrendChart (Chart.js 기반)
2. FunnelChart (D3.js 기반)
3. 차트 옵션 공통화

#### Phase 4: 페이지별 마이그레이션 (3-4주)
1. marketing_dashboard_v3 → 메인 페이지
2. creative_analysis → /creative
3. type_dashboard → /channel
4. funnel_dashboard → /funnel

---

## 5. iframe 통합 방식 인사이트

### 5.1 iframe 통합의 장단점

#### 장점
- **빠른 통합**: 기존 HTML 파일 수정 없이 즉시 통합 가능
- **독립적 배포**: 각 대시보드 독립적으로 업데이트 가능
- **격리된 스타일**: CSS 충돌 없음
- **레거시 호환**: 기존 코드베이스 유지

#### 단점
- **상태 공유 어려움**: 필터 상태, 날짜 범위 등 공유 복잡
- **사용자 경험**: 페이지 전환 시 로딩, 스크롤 이슈
- **반응형 문제**: iframe 높이 자동 조정 필요
- **SEO 불리**: 검색엔진 인덱싱 어려움
- **성능**: 각 iframe이 별도 리소스 로드

### 5.2 iframe 통합 시 구현 패턴

#### 기본 구조
```html
<!-- 메인 컨테이너 -->
<div class="dashboard-container">
    <nav class="main-navigation">
        <button onclick="loadDashboard('marketing')">광고 성과</button>
        <button onclick="loadDashboard('creative')">소재 분석</button>
        <button onclick="loadDashboard('channel')">채널 분석</button>
        <button onclick="loadDashboard('funnel')">퍼널 분석</button>
    </nav>

    <iframe id="dashboardFrame" src="marketing_dashboard_v3.html"></iframe>
</div>

<script>
function loadDashboard(type) {
    const frameMap = {
        marketing: 'marketing_dashboard_v3.html',
        creative: 'creative_analysis.html',
        channel: 'type_dashboard.html',
        funnel: 'funnel_dashboard.html'
    };
    document.getElementById('dashboardFrame').src = frameMap[type];
}
</script>
```

#### 상태 공유 (postMessage API)
```javascript
// 부모 페이지
const filters = { startDate: '2025-01-01', endDate: '2025-11-30' };
document.getElementById('dashboardFrame').contentWindow.postMessage(
    { type: 'SET_FILTERS', payload: filters },
    '*'
);

// iframe 내부
window.addEventListener('message', (event) => {
    if (event.data.type === 'SET_FILTERS') {
        applyFilters(event.data.payload);
    }
});
```

#### 높이 자동 조정
```javascript
// iframe 내부에서 부모에게 높이 전달
function notifyHeight() {
    const height = document.body.scrollHeight;
    window.parent.postMessage({ type: 'RESIZE', height }, '*');
}

// 부모 페이지에서 수신
window.addEventListener('message', (event) => {
    if (event.data.type === 'RESIZE') {
        document.getElementById('dashboardFrame').style.height =
            event.data.height + 'px';
    }
});
```

### 5.3 권장 통합 방식

| 상황 | 권장 방식 |
|------|----------|
| 빠른 MVP / PoC | iframe 통합 |
| 장기적 확장성 | React 앱 마이그레이션 |
| 부분적 현대화 | 하이브리드 (일부 React + iframe) |

#### 하이브리드 접근법
```
Phase 1: iframe으로 빠른 통합
Phase 2: 공통 컴포넌트를 React로 추출
Phase 3: 점진적으로 각 대시보드 React 전환
Phase 4: 완전한 React SPA로 통합
```

---

## 6. 코드 중복 상세 분석

### 6.1 완전 동일한 코드 블록

#### Sidebar HTML 구조 (98% 동일)
```html
<!-- 4개 파일 모두 동일한 구조, active 클래스 위치만 다름 -->
<aside class="sidebar">
    <div class="sidebar-header">
        <a href="#" class="sidebar-logo">
            <div class="sidebar-logo-icon">...</div>
            <div>
                <div class="sidebar-logo-text">Analytics</div>
                <div class="sidebar-logo-subtitle">Dashboard</div>
            </div>
        </a>
    </div>
    <div class="simplebar-content-wrapper">
        <div class="sidebar-content">
            <div class="nav-group">...</div>
        </div>
    </div>
</aside>
```

#### Filter Section CSS (100% 동일)
```css
.filter-section { padding: 20px 24px; margin-bottom: 24px; }
.filter-header { font-size: 16px; font-weight: 600; ... }
.filter-row { display: flex; flex-wrap: wrap; gap: 16px; ... }
.filter-group { display: flex; flex-direction: column; ... }
```

### 6.2 유사하지만 다른 코드

#### KPI 계산 로직
```javascript
// marketing_dashboard_v3.html
CPM: g.노출 > 0 ? (g.비용 / g.노출 * 1000) : 0,
CPC: g.클릭 > 0 ? (g.비용 / g.클릭) : 0,
CPA: g.전환수 > 0 ? (g.비용 / g.전환수) : 0,
ROAS: g.비용 > 0 ? (g.전환값 / g.비용 * 100) : 0

// creative_analysis.html - 동일한 로직
// type_dashboard.html - 동일한 로직
```

**결론**: KPI 계산 함수를 공통 유틸리티로 추출

### 6.3 통합 시 주의사항

1. **네비게이션 링크**
   - 각 파일의 active 상태가 다름
   - React Router의 NavLink로 자동 처리 가능

2. **데이터 소스**
   - 각 대시보드가 다른 CSV 파일 참조
   - 통합 데이터 서비스 레이어 필요

3. **Chart.js 설정**
   - 각 파일별 차트 옵션이 약간 다름
   - 공통 옵션 + 오버라이드 패턴 적용

---

## 7. 결론 및 권장사항

### 7.1 단기 (1-2주)
- [ ] 공통 CSS를 별도 파일로 추출 (`common.css`)
- [ ] Sidebar를 include 방식으로 통합
- [ ] iframe 기반 통합 페이지 생성

### 7.2 중기 (1-2개월)
- [ ] React 프로젝트 초기화
- [ ] 공통 컴포넌트 라이브러리 구축
- [ ] 유틸리티 함수 모듈화

### 7.3 장기 (2-3개월)
- [ ] 각 대시보드를 React 페이지로 전환
- [ ] 통합 상태 관리 구현
- [ ] 성능 최적화 (코드 스플리팅, 레이지 로딩)

---

## 8. 사이드바 네비게이션 매핑

### 8.1 네비게이션 구조

사이드바는 **그룹(Group)** 단위로 메뉴를 구성하며, 각 그룹 내에 **네비게이션 아이템(Nav Item)**이 포함됩니다.

#### 메뉴 매핑 테이블

| 그룹 | 사이드바 제목 | 매핑 HTML 파일 | 설명 |
|------|---------------|----------------|------|
| 대시보드 | 광고 성과 대시보드 | `marketing_dashboard_v3.html` | 메인 KPI, 추이 차트, 데이터 테이블 |
| 대시보드 | 소재별 성과 대시보드 | `creative_analysis.html` | 소재 이미지 그리드, 성과 모달 |
| 분석 | 시계열 현황 분석 | `timeseries_analysis.html` | 시계열 기반 성과 추이 분석 |
| 분석 | 마케팅 성과 분석 | `type_dashboard.html` | 채널별 분석, 의사결정 도구 |
| 분석 | GA4 퍼널 분석 | `funnel_dashboard.html` | AARRR 퍼널, 채널 클러스터링 |

### 8.2 HTML 사이드바 구조 (참조: marketing_dashboard_v3.html)

```html
<aside class="sidebar">
    <div class="sidebar-header">
        <a href="#" class="sidebar-logo">
            <div class="sidebar-logo-icon">
                <svg>...</svg>
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
                <a href="marketing_dashboard_v3.html" class="nav-item active">
                    <span class="nav-icon">📊</span>
                    <span>광고 성과 대시보드</span>
                </a>
                <a href="creative_analysis.html" class="nav-item">
                    <span class="nav-icon">🎨</span>
                    <span>소재별 성과 대시보드</span>
                </a>
            </div>

            <!-- 분석 그룹 -->
            <div class="nav-group">
                <div class="nav-group-title">분석</div>
                <a href="timeseries_analysis.html" class="nav-item">
                    <span class="nav-icon">📈</span>
                    <span>시계열 현황 분석</span>
                </a>
                <a href="type_dashboard.html" class="nav-item">
                    <span class="nav-icon">🔍</span>
                    <span>마케팅 성과 분석</span>
                </a>
                <a href="funnel_dashboard.html" class="nav-item">
                    <span class="nav-icon">🔻</span>
                    <span>GA4 퍼널 분석</span>
                </a>
            </div>
        </div>
    </div>
</aside>
```

### 8.3 네비게이션 통합 시 주의사항

1. **active 클래스 관리**
   - 현재 페이지에 해당하는 `.nav-item`에 `active` 클래스 추가
   - React 전환 시 `NavLink`의 `isActive` 프로퍼티로 자동 처리

2. **iframe 통합 시 구현**
```javascript
const menuConfig = [
    {
        group: '대시보드',
        items: [
            { title: '광고 성과 대시보드', file: 'marketing_dashboard_v3.html' },
            { title: '소재별 성과 대시보드', file: 'creative_analysis.html' }
        ]
    },
    {
        group: '분석',
        items: [
            { title: '시계열 현황 분석', file: 'timeseries_analysis.html' },
            { title: '마케팅 성과 분석', file: 'type_dashboard.html' },
            { title: 'GA4 퍼널 분석', file: 'funnel_dashboard.html' }
        ]
    }
];

function loadDashboard(file) {
    document.getElementById('dashboardFrame').src = file;
}

function renderSidebar() {
    const sidebar = document.querySelector('.sidebar-content');
    sidebar.innerHTML = menuConfig.map(group => `
        <div class="nav-group">
            <div class="nav-group-title">${group.group}</div>
            ${group.items.map(item => `
                <a href="#" class="nav-item" onclick="loadDashboard('${item.file}')">
                    <span>${item.title}</span>
                </a>
            `).join('')}
        </div>
    `).join('');
}
```

### 8.4 데이터 파이프라인 실행 순서

#### 1단계: 데이터 다운로드

| 순서 | Setup 스크립트 | Python 스크립트 | 출력 경로 | Config 파일 |
|-----|---------------|----------------|----------|-------------|
| 1 | `setup_raw.bat` | `fetch_google_sheets.py` | `data/raw/` | `config.json` |
| 2 | `setup_multi.bat` | `fetch_sheets_multi.py` | `data/type/` | `config_multi.json` |
| 3 | `setup_creative_final.bat` | `fetch_creative_sheets.py` | `data/creative/` | `config_creative.json` |
| 4 | `setup_creative_url_final.bat` | `fetch_creative_url.py` | `data/creative/` | `config_creative_url.json` |
| 5 | `setup_ga4_final.bat` | `fetch_ga4_sheets.py` | `data/GA4/` | `config_ga4.json` |

#### 2단계: 데이터 분석

```bash
run_analysis_final.bat (SEGMENT_MODE 선택)
```

| 단계 | Python 스크립트 | 출력 |
|-----|----------------|------|
| [1/10] | `process_marketing_data.py` | `data/forecast/predictions*.csv` |
| [2/10] | `segment_processor.py` | `data/forecast/segment_*.csv` |
| [3/10] | `insight_generator.py` | `data/forecast/insights.json` |
| [4/10] | `visualization_generator.py` | `data/visualizations/` |
| [5/10] | `generate_funnel_data.py` | `data/funnel/*.csv`, `insights.json` |
| [6/10] | `generate_engagement_data.py` | `data/funnel/channel_engagement.csv` |
| [7/10] | `run_multi_analysis.py` | `data/type/analysis_*.csv` |
| [8/10] | `multi_analysis_dimension_detail.py` | `data/type/dimension_type*.csv` |
| [9/10] | `multi_analysis_prophet_forecast.py` | `data/type/prophet_*.csv` |
| [10/10] | `generate_type_insights.py` | `data/type/insights.json` |

#### 3단계: Standalone HTML 생성 (선택)

```bash
python generate_standalone.py
```

### 8.5 대시보드별 데이터 매핑 요약

| 대시보드 | 필요 데이터 | Setup 스크립트 | Analysis 스크립트 |
|---------|------------|---------------|------------------|
| `marketing_dashboard_v3.html` | `data/raw/*.csv` | `setup_raw.bat` | - |
| `creative_analysis.html` | `data/creative/*.csv` | `setup_creative_final.bat` + `setup_creative_url_final.bat` | - |
| `timeseries_analysis.html` | `data/forecast/*` | `setup_raw.bat` | `run_analysis_final.bat` (모드 1-4) |
| `type_dashboard.html` | `data/type/*` | `setup_multi.bat` | `run_analysis_final.bat` (모드 4) |
| `funnel_dashboard.html` | `data/funnel/*`, `data/GA4/*` | `setup_ga4_final.bat` | `run_analysis_final.bat` (모드 4) |

#### 전체 실행 예시 (처음부터 끝까지)

```bash
# 1. 데이터 다운로드
setup_raw.bat
setup_multi.bat
setup_creative_final.bat
setup_creative_url_final.bat
setup_ga4_final.bat

# 2. 데이터 분석 (SEGMENT MODE)
run_analysis_final.bat
# → 메뉴에서 [4] 선택

# 3. Standalone HTML 생성
python generate_standalone.py

# 4. 대시보드 열기
start data\type_dashboard_standalone.html
```

---

## 9. 파일 구조 요약

```
현재 구조:
data/
├── marketing_dashboard_v3.html     (~2,400 lines)
├── creative_analysis.html          (~2,500 lines)
├── timeseries_analysis.html        (시계열 분석)
├── type_dashboard.html             (~7,500 lines)
├── funnel_dashboard.html           (~5,500 lines)
├── raw/                            # 광고 데이터 CSV
├── creative/                       # 소재 데이터 CSV
└── funnel/                         # 퍼널 데이터 CSV

권장 통합 구조:
marketing-dashboard/
├── shared/
│   ├── css/
│   │   ├── variables.css
│   │   ├── layout.css
│   │   ├── components.css
│   │   └── responsive.css
│   └── js/
│       ├── csvParser.js
│       ├── formatters.js
│       └── chartConfig.js
├── pages/
│   ├── index.html                  # 메인 (iframe 컨테이너)
│   ├── marketing_dashboard.html
│   ├── creative_analysis.html
│   ├── timeseries_analysis.html
│   ├── type_dashboard.html
│   └── funnel_dashboard.html
└── data/
    ├── raw/
    ├── creative/
    └── funnel/
```

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2025-11-27 | v1.0 | 초기 통합 아키텍처 문서 작성 |
| 2025-11-27 | v1.1 | RFC 4180 CSV 파싱 표준 추가, 사이드바 네비게이션 매핑 추가 |
| 2025-11-27 | v1.2 | 데이터 파이프라인 실행 순서, 대시보드별 데이터 매핑 추가 |

---

**참조 문서:**
- [CSV 파싱 표준 가이드](./CSV_PARSING_STANDARD.md)
