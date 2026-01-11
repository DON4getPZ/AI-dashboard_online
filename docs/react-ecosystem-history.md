# React 생태계 구성 히스토리

## 개요

마케팅 대시보드 프로젝트의 HTML → React 마이그레이션 과정 및 작업 내역을 정리한 문서입니다.

---

## 프로젝트 구조

```
marketing-dashboard/
├── src/app/
│   ├── ReactView.tsx              # 광고 성과 대시보드 (메인)
│   ├── globals.css                # 전역 CSS (Funnel/QnA 공용)
│   ├── layout.tsx                 # Next.js 레이아웃
│   ├── creative/
│   │   ├── ReactView.tsx          # 소재별 대시보드
│   │   └── creative-original.css  # Creative 전용 CSS
│   ├── funnel/
│   │   ├── ReactView.tsx          # 퍼널 대시보드
│   │   └── page.tsx
│   ├── timeseries/
│   │   ├── ReactView.tsx          # 시계열 대시보드
│   │   ├── timeseries-original.css
│   │   └── timeseries.module.css
│   ├── type/
│   │   ├── ReactView.tsx          # 유형별 대시보드 (내장 styles)
│   │   └── page.tsx
│   └── qna/
│       ├── ReactView.tsx          # FAQ & 문의하기
│       └── page.tsx
├── public/
│   ├── marketing_dashboard_v3.html  # 원본 HTML (광고 성과)
│   ├── creative_analysis.html       # 원본 HTML (소재별)
│   ├── funnel_dashboard.html        # 원본 HTML (퍼널)
│   └── timeseries.html              # 원본 HTML (시계열)
└── data/
    ├── type_dashboard.html          # 원본 HTML (유형별)
    └── Qna.html                     # 원본 HTML (QnA)
```

---

## 마이그레이션 완료 현황

| 대시보드 | 원본 HTML | React 파일 | 상태 |
|---------|----------|-----------|------|
| 광고 성과 | `marketing_dashboard_v3.html` | `src/app/ReactView.tsx` | ✅ 완료 |
| 소재별 | `creative_analysis.html` | `src/app/creative/ReactView.tsx` | ✅ 완료 |
| 퍼널 | `funnel_dashboard.html` | `src/app/funnel/ReactView.tsx` | ✅ 완료 |
| 시계열 | `timeseries.html` | `src/app/timeseries/ReactView.tsx` | ✅ 완료 |
| 유형별 | `type_dashboard.html` | `src/app/type/ReactView.tsx` | ✅ 완료 |
| QnA | `Qna.html` | `src/app/qna/ReactView.tsx` | ✅ 완료 |

---

## 주요 기술 스택

### 프레임워크 & 라이브러리
- **Next.js 14.2.21** - React 프레임워크
- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Chart.js + react-chartjs-2** - 차트 렌더링
- **D3.js** - 퍼널 차트 (SVG 기반)
- **EmailJS** - QnA 문의 폼 연동

### CSS 구조
- **globals.css** - 전역 CSS 변수 및 공용 클래스
- **component-original.css** - 컴포넌트별 전용 스타일
- **내장 styles** - type 대시보드 (JSX 내 `<style>` 태그)

---

## 작업 이력 (2026-01-09)

### v10 - 광고 성과 대시보드 CSS 변수 통일
**파일**: `src/app/ReactView.tsx`

- JS 객체 방식 (`cssVars.propertyName`) → CSS 변수 방식 (`var(--property-name)`) 변환
- 91개 cssVars 참조를 CSS 변수로 변환
- 다른 대시보드와 동일한 스타일 방식으로 통일

```typescript
// 변경 전
const cssVars = {
  primaryMain: '#673ab7',
  grey600: '#757575',
  ...
}
backgroundColor: cssVars.primaryMain

// 변경 후
backgroundColor: 'var(--primary-main)'
```

### v9 - type 분기별 추이 차트 및 스타일 통일
**파일**: `src/app/type/ReactView.tsx`

- 분기별 추이 차트: 커스텀 SVG → Chart.js `Bar` 컴포넌트 교체
- 정렬 화살표 색상: `#1976d2` (파랑) → `#673ab7` (보라) 통일
- timeseries 차트 legend: `pointBackgroundColor` 추가 (속이 빈 원 → 채워진 원)

### v8 - timeseries 세그먼트 트렌드 변수명 통일
**파일**: `src/app/timeseries/ReactView.tsx`

- `segmentTrendView` → `segmentTrendViewType` (HTML과 동일하게)
- 세그먼트 트렌드 관련 변수/함수 비교 문서화

### v7 - 전체 대시보드 최종 명칭 점검
- 5개 대시보드 병렬 비교 분석 수행
- Phase 3 데이터 연결 영향 분석 완료
- **결론**: 백엔드 API 연결에 영향을 주는 명칭 불일치 없음

### v6 - type/timeseries 상수명 통일
- `PERF_DEFAULT_LIMIT` → `DETAIL_DEFAULT_LIMIT`
- `PERF_EXPANDED_LIMIT` → `DETAIL_EXPANDED_LIMIT`
- `INITIAL_ALERTS_COUNT`, `INITIAL_RECOMMENDATIONS_COUNT` 상수 추가

---

## CSS 충돌 해결 이력

### 1. timeseries-original.css 데드코드 제거
**문제**: funnel 페이지 방문 시 timeseries CSS가 전역 적용되어 스타일 충돌

**제거된 코드**:
```css
/* 삭제됨 - 미사용 데드코드 */
.kpi-summary-card { ... }
.kpi-summary-card::before { ... }
.kpi-summary-card:nth-child(1~9)::before { background: #색상; }
.kpi-summary-card.secondary { ... }
.kpi-summary-grid { ... }
.kpi-summary-label { ... }
.kpi-summary-value { ... }
.kpi-summary-unit { ... }

/* 반응형 미디어쿼리 내 .kpi-summary-grid 규칙도 제거 */
```

### 2. funnel ID 충돌 수정
**파일**: `src/app/funnel/ReactView.tsx`

```tsx
// 변경 전 - timeseries CSS의 #kpiSummaryGrid 선택자와 충돌
<div className="kpi-summary-grid" id="kpiSummaryGrid">

// 변경 후 - 고유 ID로 변경
<div className="kpi-summary-grid" id="funnelKpiSummaryGrid">
```

### 3. CSS 중복 분석 결과
**globals.css ↔ creative-original.css**

| 중복 클래스 | 개수 | 상태 |
|-----------|-----|------|
| `.card` | 2 | 동일 스타일 (충돌 없음) |
| `.collapsible-*` | 8 | 동일 스타일 |
| `.filter-*` | 4 | 동일 스타일 |
| 기타 | 5 | 동일 스타일 |

**결론**: 통합 불필요 - 시각적 충돌 없음

---

## globals.css 분석 결과

| 항목 | 수치 |
|-----|-----|
| 총 클래스 수 | 77개 |
| 미사용 클래스 | 0개 |
| TSX에서 사용 | 77개 전체 |

**모든 클래스가 실제로 사용 중** - 데드코드 없음

---

## CSS 변수 시스템

### :root 변수 (globals.css)
```css
:root {
  /* Primary */
  --primary-main: #673ab7;
  --primary-light: #ede7f6;
  --primary-dark: #5e35b1;

  /* Secondary */
  --secondary-main: #2196f3;
  --secondary-light: #e3f2fd;

  /* 상태 색상 */
  --success-main: #00c853;
  --success-light: #b9f6ca;
  --warning-main: #ffab00;
  --warning-light: #fff8e1;
  --error-main: #ff1744;
  --error-light: #ffeaea;

  /* Grey Scale */
  --grey-50: #fafafa;
  --grey-100: #f5f5f5;
  --grey-200: #eeeeee;
  --grey-300: #e0e0e0;
  --grey-500: #9e9e9e;
  --grey-600: #757575;
  --grey-700: #616161;
  --grey-800: #424242;
  --grey-900: #212121;

  /* 배경 */
  --background: #f8fafc;
  --paper: #ffffff;
}
```

### 대시보드별 CSS 사용 방식

| 대시보드 | CSS 방식 | 비고 |
|---------|---------|-----|
| 광고 성과 | CSS 변수 직접 참조 | v10에서 통일 |
| 소재별 | CSS 변수 + creative-original.css | |
| 퍼널 | globals.css 사용 | |
| 시계열 | CSS 변수 + timeseries-original.css | |
| 유형별 | 내장 `<style>` + CSS 변수 | |
| QnA | globals.css 사용 | |

---

## 디자인 검증 결과

### HTML ↔ React 스타일 일치 확인

| 항목 | 상태 |
|-----|------|
| KPI 카드 스타일 | ✅ 일치 |
| 차트 색상/설정 | ✅ 일치 |
| 버튼 스타일 | ✅ 일치 |
| 테이블 스타일 | ✅ 일치 |
| box-shadow/border-radius | ✅ 일치 |
| 정렬 화살표 색상 | ✅ 일치 (v9에서 수정) |
| 차트 legend | ✅ 일치 (v9에서 수정) |

---

## 향후 작업 (Phase 3)

### 백엔드 API 연결 준비 완료
- 모든 데이터 변수명 HTML과 동일
- 모든 데이터 경로 HTML과 동일
- 함수명 차이는 UI 상태 관리용 (API 영향 없음)

### 검토된 옵션
1. **CSS 모듈화** - 보류 (HTML 원본과 클래스명 1:1 유지 우선)
2. **네임스페이스 정리** - 보류 (실제 충돌 해결됨)
3. **globals.css 정리** - 불필요 (미사용 클래스 없음)

---

## 참고 문서

- `docs/react-html-comparison.md` - HTML ↔ React 상세 비교
- `docs/Development_Plan.md` - 전체 개발 계획
- `docs/design_function_integration.md` - 디자인/기능 통합 가이드

---

## 변경 이력

| 날짜 | 버전 | 내용 |
|-----|-----|------|
| 2026-01-09 | v10 | 광고 성과 대시보드 CSS 변수 통일 |
| 2026-01-09 | v9 | type 분기별 추이 차트 교체, 스타일 통일 |
| 2026-01-09 | v8 | timeseries 세그먼트 트렌드 변수명 통일 |
| 2026-01-09 | v7 | 전체 대시보드 최종 명칭 점검 |
| 2026-01-09 | v6 | type/timeseries 상수명 통일 |
| 2026-01-09 | v5 | QnA 페이지 React 변환 |
| 2026-01-08 | v4 | funnel 대시보드 React 변환 |
| 2026-01-08 | v3 | timeseries 함수명 통일 |
| 2026-01-08 | v2 | creative 대시보드 최적화 |
| 2026-01-07 | v1 | 초기 React 마이그레이션 |
