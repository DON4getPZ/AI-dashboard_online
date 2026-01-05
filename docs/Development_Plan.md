# 마케팅 대시보드 마이그레이션 개발 계획

**작성일**: 2025-01-05
**목표**: 5개 대시보드 통합 (Next.js SPA + Standalone HTML 병행)

---

## 프로젝트 요약

| 항목 | 현재 | 목표 |
|------|------|------|
| 대시보드 | 5개 Standalone HTML (각 18-21MB) | 1개 통합 앱 + 1개 통합 HTML |
| 클라이언트 | 단일 | 멀티클라이언트 (서브도메인) |
| 배포 | 수동 | Git Push → GitHub Actions → Vercel |

---

## Phase 1: 기반 인프라 구축 (1-2일)

### 작업 목록
- [ ] `scripts/common/__init__.py` 생성
- [ ] `scripts/common/paths.py` 생성 (ClientPaths 클래스)
- [ ] `config/clients.json` 생성 (멀티클라이언트 설정)
- [ ] Next.js 프로젝트 초기화 (`npx create-next-app`)
- [ ] `.gitignore`, `vercel.json` 설정

### 핵심 파일
```
scripts/common/paths.py    # 클라이언트별 경로 관리
config/clients.json        # 멀티클라이언트 마스터 설정
```

---

## Phase 2: Python 스크립트 멀티클라이언트 대응 (2-3일)

### 수정 대상 (15개 스크립트)
- [ ] `fetch_google_sheets.py` - `--client` 파라미터 추가
- [ ] `fetch_sheets_multi.py`
- [ ] `fetch_creative_sheets.py`
- [ ] `fetch_creative_url.py`
- [ ] `fetch_ga4_sheets.py`
- [ ] `process_marketing_data.py`
- [ ] `segment_processor.py`
- [ ] `insight_generator.py`
- [ ] `visualization_generator.py`
- [ ] `generate_funnel_data.py`
- [ ] `generate_engagement_data.py`
- [ ] `run_multi_analysis.py`
- [ ] `multi_analysis_dimension_detail.py`
- [ ] `multi_analysis_prophet_forecast.py`
- [ ] `generate_type_insights.py`

### 신규 스크립트
- [ ] `scripts/export_json.py` - CSV → JSON 변환
- [ ] `scripts/run_all_clients.py` - 전체 클라이언트 실행

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

## Phase 3: Standalone HTML 통합본 생성 (2-3일)

### 아키텍처
```
integrated_dashboard.html
├── <aside class="sidebar">     # 5개 대시보드 네비게이션
└── <main class="content">
    └── <iframe>                # 선택된 대시보드 로드
```

### 작업 목록
- [ ] 통합 HTML 템플릿 생성 (`standalone/integrated_template.html`)
- [ ] 사이드바 CSS 추출 (Berry Theme)
- [ ] 네비게이션 JavaScript (iframe src 전환)
- [ ] `generate_integrated_standalone.py` 작성
- [ ] 각 Standalone HTML에 iframe 모드 지원 추가

### 산출물
```
standalone/integrated_dashboard.html  # 통합 네비게이션 (~50KB)
data/*_standalone.html               # 개별 대시보드 (iframe용)
```

---

## Phase 4: Next.js SPA 개발 (2-3주)

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

### 배포 스크립트
- [ ] `deploy.bat` - 단일 클라이언트 (ETL → Git Push)
- [ ] `deploy_all.bat` - 전체 클라이언트
- [ ] `scheduler_register.bat` - Windows 작업 스케줄러

### GitHub Actions
- [ ] `.github/workflows/deploy.yml` - push 트리거 → Vercel 배포

### 배포 흐름
```
[1] .bat 트리거 → Python ETL
[2] Git Commit + Push
[3] GitHub Actions → Next.js 빌드
[4] Vercel → React 앱 서빙
```

---

## Phase 6: 테스트 및 마이그레이션 (1주)

### 테스트 체크리스트
- [ ] Python: `--client` 파라미터 동작
- [ ] Standalone: iframe 전환, 개별 실행
- [ ] Next.js: 라우팅, 차트 렌더링, 반응형
- [ ] 배포: GitHub Actions, Vercel, Cloudflare Access

### 마이그레이션 순서
1. 기존 데이터 → `data/clientA/` 이동
2. 스크립트 수정 후 테스트
3. Standalone 통합본 검증
4. Next.js 로컬 테스트
5. Vercel 스테이징 → 프로덕션

---

## 일정 요약

| Phase | 기간 | 주요 산출물 |
|-------|------|------------|
| Phase 1 | 1-2일 | 기반 인프라, 설정 파일 |
| Phase 2 | 2-3일 | Python 스크립트 18개 수정 |
| Phase 3 | 2-3일 | Standalone 통합 HTML |
| Phase 4 | 2-3주 | Next.js SPA |
| Phase 5 | 3-5일 | 배포 스크립트, CI/CD |
| Phase 6 | 1주 | 테스트, 프로덕션 배포 |

**총 예상**: 4-6주

---

## 핵심 파일 경로

| 파일 | 역할 |
|------|------|
| `scripts/common/paths.py` | [신규] 멀티클라이언트 경로 관리 |
| `scripts/export_json.py` | [신규] CSV → JSON 변환 |
| `generate_standalone.py` | [수정] 통합본 생성 참조 |
| `src/middleware.ts` | [신규] 서브도메인 라우팅 |
| `docs/Deploy_project_implement.md` | [참조] 상세 구현 가이드 |

---

## 병렬 작업 가능 영역

```
Phase 1 완료 후:
├── Phase 2 (Python) ──→ Phase 3 (Standalone)  ← 병렬 가능
│                   └──→ Phase 4 (Next.js)     ← 병렬 가능
└── Phase 5 (CI/CD) ──→ Phase 6 (테스트)
```

**권장**: Phase 3 (Standalone 통합)을 먼저 완료하면 즉시 사용 가능
