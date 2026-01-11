# 마케팅 대시보드 마이그레이션 개발 계획

**작성일**: 2025-01-05
**수정일**: 2026-01-11
**목표**: 6개 대시보드 통합 (Next.js SPA)

---

## 프로젝트 요약

| 항목 | 현재 | 목표 |
|------|------|------|
| 대시보드 | 6개 Standalone HTML (각 18-21MB) | 1개 통합 Next.js SPA |
| 클라이언트 | 단일 | 멀티클라이언트 (서브도메인) |
| 배포 | 수동 | Git Push → GitHub Actions → Vercel |

> **참고**: Standalone HTML 통합본(~80MB)은 일반 인터넷 환경에서 로딩 불가로 계획에서 제외됨

---

## Phase 1: 기반 인프라 구축 (1-2일) ✅ 완료

### 작업 목록
- [x] `scripts/common/__init__.py` 생성
- [x] `scripts/common/paths.py` 생성 (ClientPaths 클래스)
- [x] `config/clients.json` 생성 (멀티클라이언트 설정)
- [x] Next.js 프로젝트 초기화 (`npx create-next-app`)
- [x] `.gitignore`, `vercel.json` 설정

### 핵심 파일
```
scripts/common/paths.py    # 클라이언트별 경로 관리
config/clients.json        # 멀티클라이언트 마스터 설정
```

---

## Phase 2: Python 스크립트 멀티클라이언트 대응 (2-3일) ✅ 완료

### 수정 대상 (15개 스크립트) ✅ 완료
- [x] `fetch_google_sheets.py` - `--client` 파라미터 추가
- [x] `fetch_sheets_multi.py`
- [x] `fetch_creative_sheets.py`
- [x] `fetch_creative_url.py`
- [x] `fetch_ga4_sheets.py`
- [x] `process_marketing_data.py`
- [x] `segment_processor.py`
- [x] `insight_generator.py`
- [x] `visualization_generator.py`
- [x] `generate_funnel_data.py`
- [x] `generate_engagement_data.py`
- [x] `run_multi_analysis.py`
- [x] `multi_analysis_dimension_detail.py`
- [x] `multi_analysis_prophet_forecast.py`
- [x] `generate_type_insights.py`

### 신규 스크립트
- [x] `scripts/export_json.py` - CSV → JSON 변환
- [ ] `scripts/run_all_clients.py` - 전체 클라이언트 실행 → **Phase 5에서 구현**

### 수정 패턴
```python
# 기존
DATA_DIR = Path(__file__).parent.parent / 'data'

# 수정
from scripts.common.paths import ClientPaths, parse_client_arg
client_id = parse_client_arg()
paths = ClientPaths(client_id)
```

---

## ~~Phase 3: Standalone HTML 통합본 생성~~ (취소)

> **취소 사유**: 5개 대시보드 통합 시 HTML 파일 크기가 ~80MB에 달해 일반 인터넷 환경에서 로딩 불가.
> 개별 Standalone HTML(18-21MB)은 기존대로 유지하며, 통합은 Next.js SPA로 대체.

---

## Phase 4: Next.js SPA 개발 ✅ 완료

### 주차별 계획

| 주차 | 범위 | 산출물 |
|------|------|--------|
| Week 1 | 기반 UI | Layout, Sidebar, KPICard, TrendChart |
| Week 2 | Type + Marketing | 채널별 분석, 성과 추이, 필터링 |
| Week 3 | Funnel + Forecast | D3.js 퍼널, Prophet 차트, 예산 시뮬레이션 |
| Week 4 | Creative + 통합 | 소재 그리드, 서브도메인, 테스트 |

### 디렉토리 구조
```
src/
├── app/
│   ├── layout.tsx           # 공통 레이아웃 (사이드바)
│   ├── page.tsx             # 메인 (Type Dashboard)
│   ├── marketing/page.tsx
│   ├── funnel/page.tsx
│   ├── forecast/page.tsx
│   └── creative/page.tsx
├── components/
│   ├── Layout/Sidebar.tsx
│   ├── Dashboard/KPICard.tsx
│   └── Charts/TrendChart.tsx, FunnelChart.tsx, ForecastChart.tsx
├── lib/
│   ├── client.ts            # 클라이언트 컨텍스트
│   ├── data.ts              # JSON fetch 유틸
│   └── utils.ts             # 포맷팅 함수
└── middleware.ts            # 서브도메인 라우팅
```

---

## Phase 5: 배포 및 CI/CD 구성 (3-5일)

### 전체 클라이언트 자동화
- [ ] `scripts/run_all_clients.py` - 전체 클라이언트 ETL 핵심 로직
  - `config/clients.json` 읽기
  - 각 클라이언트 순차 실행 (fetch → mapping → analysis → export)
  - 실행 결과 로깅
- [ ] `run_all_clients.bat` - 래퍼 스크립트
  - `python scripts/run_all_clients.py %*` 호출
  - Windows 작업 스케줄러 연동용

### 배포 스크립트
- [ ] `deploy.bat` - 단일 클라이언트 (ETL → Git Push)
- [ ] `deploy_all.bat` - 전체 클라이언트
- [ ] `scheduler_register.bat` - Windows 작업 스케줄러 등록
  - 매일 트리거 (예: AM 6:00)
  - `run_all_clients.bat` 실행

### GitHub Actions
- [ ] `.github/workflows/deploy.yml` - push 트리거 → Vercel 배포

### 배포 흐름
```
[1] .bat 트리거 → Python ETL
[2] Git Commit + Push
[3] GitHub Actions → Next.js 빌드
[4] Vercel → React 앱 서빙
```

### 자동화 흐름 (매일 스케줄)
```
[작업 스케줄러] → run_all_clients.bat
                      ↓
               run_all_clients.py
                      ↓
               clients.json 읽기
                      ↓
               클라이언트별 순차 실행:
                 ├── fetch (Google Sheets → CSV)
                 ├── mapping (CSV → 가공)
                 ├── analysis (분석/시각화)
                 └── export (JSON)
```

---

## Phase 6: 테스트 및 마이그레이션 (1주)

### 테스트 체크리스트
- [ ] Python: `--client` 파라미터 동작
- [ ] Next.js: 라우팅, 차트 렌더링, 반응형
- [ ] HTML ↔ React 시각적 1:1 검증
- [ ] 배포: GitHub Actions, Vercel, Cloudflare Access

### 마이그레이션 순서
1. 기존 데이터 → `data/clientA/` 이동
2. 스크립트 수정 후 테스트
3. Next.js 로컬 테스트
4. Vercel 스테이징 → 프로덕션

---

## Phase 7: 컴포넌트 분리 (Phase 6 완료 후)

### 개요
Phase 6에서 모든 디버깅/테스트 완료 후, 통합된 ReactView.tsx 파일들을 재사용 가능한 컴포넌트로 분리.

### 분리 대상 컴포넌트
```
src/components/
├── common/
│   ├── KPICard.tsx              # KPI 요약 카드
│   ├── SortableTable.tsx        # 정렬 가능 테이블
│   ├── CollapsibleSection.tsx   # 접을 수 있는 섹션
│   ├── FilterDropdown.tsx       # 필터 드롭다운
│   └── InsightBox.tsx           # AI 인사이트 박스
├── charts/
│   ├── TrendChart.tsx           # 추이 차트 (Line/Bar)
│   ├── PieChart.tsx             # 파이/도넛 차트
│   ├── FunnelChart.tsx          # 퍼널 차트 (D3.js)
│   └── SegmentChart.tsx         # 세그먼트 비교 차트
└── layout/
    ├── DashboardHeader.tsx      # 대시보드 공통 헤더
    └── DateRangePicker.tsx      # 날짜 범위 선택기
```

### 기대 효과
- **번들 최적화**: 페이지 간 이동 시 공유 청크로 빠른 로딩
- **코드 재사용**: 중복 코드 제거, 유지보수 용이
- **테스트 용이성**: 개별 컴포넌트 단위 테스트 가능

### 작업 순서
1. 공통 UI 패턴 식별 및 추출
2. Chart 컴포넌트 분리 (Chart.js, D3.js)
3. 레이아웃 컴포넌트 분리
4. 각 대시보드에서 분리된 컴포넌트 import
5. 통합 테스트 및 시각적 검증

### 주의사항
- HTML 원본과 1:1 매칭 유지 (Phase 6 검증 완료 후)
- 분리 시 props 인터페이스 명확히 정의
- CSS 충돌 방지를 위한 모듈 CSS 적용 검토

---

## 일정 요약

| Phase | 상태 | 주요 산출물 |
|-------|------|------------|
| Phase 1 | ✅ 완료 | 기반 인프라, 설정 파일 |
| Phase 2 | ✅ 완료 (15/15) | Python 스크립트 멀티클라이언트 대응 |
| ~~Phase 3~~ | ❌ 취소 | ~~Standalone 통합 HTML~~ (80MB 문제) |
| Phase 4 | ✅ 완료 | Next.js SPA (6개 대시보드 React 변환) |
| Phase 5 | 🔲 대기 | 배포 스크립트, CI/CD |
| Phase 6 | 🔲 대기 | 테스트, 프로덕션 배포 |
| Phase 7 | 🔲 대기 | 컴포넌트 분리 (Phase 6 완료 후) |

---

## 핵심 파일 경로

| 파일 | 역할 |
|------|------|
| `scripts/common/paths.py` | [신규] 멀티클라이언트 경로 관리 |
| `scripts/export_json.py` | [신규] CSV → JSON 변환 |
| `scripts/run_all_clients.py` | [Phase 5] 전체 클라이언트 ETL 로직 |
| `run_all_clients.bat` | [Phase 5] 스케줄러용 래퍼 |
| `src/middleware.ts` | [신규] 서브도메인 라우팅 |
| `src/app/*/ReactView.tsx` | [완료] 6개 대시보드 React 컴포넌트 |
| `docs/react-ecosystem-history.md` | [참조] React 생태계 구성 히스토리 |
| `docs/Deploy_project_implement.md` | [참조] 상세 구현 가이드 |

---

## 병렬 작업 가능 영역

```
Phase 1 완료 후:
├── Phase 2 (Python) ──→ Phase 4 (Next.js) ✅
└── Phase 5 (CI/CD) ──→ Phase 6 (테스트) ──→ Phase 7 (컴포넌트 분리)
```

**권장 순서**: Phase 6 테스트 완료 후 → Phase 7 컴포넌트 분리 진행
