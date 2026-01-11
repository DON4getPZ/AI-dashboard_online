# 마케팅 대시보드 마이그레이션 개발 계획

**작성일**: 2025-01-05
**수정일**: 2026-01-11 (Phase 5 완료 - 배포/CI/CD)
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

## Phase 5: 배포 및 CI/CD 구성 ✅ 완료

### 사전 검증 완료 (test_*.bat)

Phase 5 구현 전, 아래 테스트 스크립트로 전체 파이프라인 검증 완료:

| 테스트 파일 | 역할 | 검증 스크립트 수 |
|------------|------|-----------------|
| `test_1_fetch.bat` | Google Sheets → CSV | 5개 |
| `test_2_mapping.bat` | CSV → 가공 데이터 | 1개 |
| `test_3_analysis.bat` | 가공 → 분석/시각화 | 13개 |

**검증 항목**: `--client` 파라미터, 실행 순서, 에러 핸들링, 경로 분리

### test_*.bat 개선 ✅ 완료

| 파일 | 개선 내용 |
|------|----------|
| `test_1_fetch.bat` | [2] 신규 클라이언트 추가 기능, [3] 전체 설정 초기화 분리 |
| `test_2_mapping.bat` | 메뉴 단순화, 클라이언트 목록 표시 개선 |
| `test_3_analysis.bat` | 메뉴 단순화, 클라이언트 목록 표시 개선 |
| `scripts/add_client.py` | [신규] 클라이언트 추가 헬퍼 스크립트 |

**신규 클라이언트 온보딩 플로우**:
```
test_1_fetch.bat [2] → 클라이언트 정보 입력 → clients.json에 추가
    ↓
test_1, test_2, test_3 → 개별 클라이언트 테스트/디버깅
    ↓
run_all_clients.bat → 전체 클라이언트 자동 실행
```

### 전체 클라이언트 자동화 ✅ 완료

#### 1단계: `scripts/run_all_clients.py` (핵심 로직) ✅
- [x] `config/clients.json` 파싱 (active 클라이언트 필터링)
- [x] 클라이언트별 순차 실행 (subprocess.run)
- [x] test_*.bat에서 검증된 스크립트 목록/순서 적용
- [x] 실행 결과 로깅 (성공/실패/소요시간)
- [x] 종료 코드 반환 (전체 성공: 0, 일부 실패: 1)
- [x] CLI 옵션: `--client`, `--stage`, `--dry-run`, `--legacy`

**실행할 스크립트 목록** (test_*.bat 기반):
```python
SCRIPTS = {
    'fetch': [  # test_1_fetch.bat (5개)
        'fetch_google_sheets.py',
        'fetch_sheets_multi.py',
        'fetch_creative_sheets.py',
        'fetch_creative_url.py',
        'fetch_ga4_sheets.py',
    ],
    'mapping': [  # test_2_mapping.bat (1개)
        'process_marketing_data.py',
    ],
    'analysis': [  # test_3_analysis.bat (13개)
        'run_multi_analysis.py',
        'multi_analysis_dimension_detail.py',
        'multi_analysis_prophet_forecast.py',
        'generate_type_insights.py',
        'segment_processor.py',
        'insight_generator.py',
        'visualization_generator.py',
        'generate_funnel_data.py',
        'generate_engagement_data.py',
        'generate_funnel_data_multiperiod.py',
        'generate_insights_multiperiod.py',
        'generate_type_insights_multiperiod.py',
        'export_json.py',
    ],
}
```

#### 2단계: `run_all_clients.bat` (래퍼) ✅
- [x] 단순 래퍼: `python scripts/run_all_clients.py %*`
- [x] Windows 작업 스케줄러 연동용
- [x] 실행 후 pause (대화형 확인, 스케줄러에서는 자동 스킵)

### 배포 스크립트 ✅ 완료
- [x] `git_setup.bat` - Git 환경 설정 마법사 (7단계)
  - Git 설치 확인/자동 설치 (winget)
  - 사용자 정보, 인증 헬퍼 자동 설정
  - 인코딩 설정 (UTF-8, CRLF, 한글 지원)
  - Remote/Upstream 설정
- [x] `deploy.bat` - 단일 클라이언트 (ETL → Git Push)
- [x] `deploy_all.bat` - 전체 클라이언트
  - `--auto` 모드: 스케줄러용 (확인 없이 자동 실행)
  - `--skip-etl` 모드: Git Push만 실행
  - 로그 기록: `logs/deploy_YYYYMMDD_HHMMSS.log`
- [x] `scheduler_register.bat` - Windows 작업 스케줄러 등록
  - 매일 트리거 (사용자 지정 시간)
  - `deploy_all.bat --auto` 실행

### GitHub Actions ✅ 완료
- [x] `.github/workflows/deploy.yml` - push 트리거 → Vercel 배포
  - main 브랜치 push 시 자동 트리거
  - data/, public/data/, src/ 변경 감지
  - workflow_dispatch로 수동 실행 지원
  - 필수 Secrets: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID

### 배포 흐름
```
[0] git_setup.bat → Git 환경 설정 (최초 1회)
[1] deploy*.bat 트리거 → Python ETL (19개 스크립트)
[2] Git Commit + Push (자동)
[3] GitHub Actions → Next.js 빌드
[4] Vercel → React 앱 서빙
```

### 자동화 흐름 (매일 스케줄)
```
[사전 설정 - 최초 1회]
git_setup.bat → Git 환경 완전 설정 (7단계)
scheduler_register.bat → 작업 스케줄러 등록

[매일 자동 실행]
작업 스케줄러 → deploy_all.bat --auto
                      ↓
               Git 환경 체크 (실패 시 로그 기록 후 종료)
                      ↓
               run_all_clients.py (ETL)
                 ├── fetch (5개 스크립트)
                 ├── mapping (1개 스크립트)
                 └── analysis (13개 스크립트)
                      ↓
               Git Commit + Push
                      ↓
               로그 저장: logs/deploy_*.log
```

### Python 우선 구현의 이점

| 항목 | .bat 직접 | .py → .bat |
|------|----------|------------|
| JSON 파싱 | 복잡 | `json.load()` |
| 클라이언트 순회 | 제한적 | 리스트 순회 |
| 에러 핸들링 | errorlevel | try/except |
| 로깅 | echo | logging 모듈 |
| 유지보수 | 어려움 | 용이 |

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
| Phase 5 | ✅ 완료 | 배포 스크립트, GitHub Actions, 로그 기능 |
| Phase 6 | 🔲 대기 | 테스트, 프로덕션 배포 |
| Phase 7 | 🔲 대기 | 컴포넌트 분리 (Phase 6 완료 후) |

---

## 핵심 파일 경로

| 파일 | 역할 |
|------|------|
| `scripts/common/paths.py` | [완료] 멀티클라이언트 경로 관리 |
| `scripts/export_json.py` | [완료] CSV → JSON 변환 |
| `scripts/run_all_clients.py` | [완료] 전체 클라이언트 ETL 로직 (19개 스크립트) |
| `scripts/add_client.py` | [완료] 클라이언트 추가 헬퍼 |
| `run_all_clients.bat` | [완료] 스케줄러용 래퍼 |
| `git_setup.bat` | [완료] Git 환경 설정 마법사 (7단계) |
| `deploy.bat` | [완료] 단일 클라이언트 배포 |
| `deploy_all.bat` | [완료] 전체 클라이언트 배포 + 로그 |
| `scheduler_register.bat` | [완료] Windows 작업 스케줄러 등록 |
| `test_1_fetch.bat` | [완료] Fetch 테스트 + 클라이언트 추가 |
| `test_2_mapping.bat` | [완료] Mapping 테스트 |
| `test_3_analysis.bat` | [완료] Analysis 테스트 (13개 스크립트) |
| `docs/User_Guide.md` | [완료] 사용자 가이드 (git_setup, CI/CD 포함) |
| `.github/workflows/deploy.yml` | [완료] Vercel 자동 배포 워크플로우 |
| `src/middleware.ts` | [완료] 서브도메인 라우팅 |
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
