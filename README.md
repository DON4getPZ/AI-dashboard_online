# 마케팅 대시보드 v4.3

**Growthmaker - 데이터 기반 그로스 마케팅 대시보드**

---

## 아키텍처 현황

### 현재 상태: Standalone HTML

```
┌─────────────────────────────────────────────────────────────────┐
│  .bat 트리거 → Python ETL → generate_standalone.py → 30MB HTML │
│                                                                 │
│  특징: 서버 없이 브라우저에서 바로 실행, 단일 클라이언트        │
└─────────────────────────────────────────────────────────────────┘
```

### 목표 상태: Next.js + Vercel (JAMstack)

```
┌─────────────────────────────────────────────────────────────────┐
│  [1] .bat 트리거    [2] .bat 트리거   [3] GitHub Actions  [4] Vercel  │
│  ┌───────────┐     ┌───────────┐     ┌───────────┐      ┌───────┐│
│  │Python ETL │ ──→ │Git Commit │ ──→ │ Next.js   │ ──→  │React  ││
│  │데이터수집 │     │ + Push    │     │ 빌드      │      │앱서빙 ││
│  │분석/변환  │     │           │     │           │      │       ││
│  └───────────┘     └───────────┘     └───────────┘      └───────┘│
│                                                                   │
│  특징: 멀티클라이언트, 서브도메인 분리, 연 비용 ~$12             │
└───────────────────────────────────────────────────────────────────┘
```

> **배포 설계서**: [Deploy_project.md](docs/Deploy_project.md)

---

## 주요 특징

- **Standalone HTML** (현재): 서버 없이 브라우저에서 바로 실행
- **Next.js + Vercel** (목표): JAMstack 기반 멀티클라이언트 서비스
- **Prophet 시계열 예측**: 계절성 패턴 분석 및 90일 예측
- **다차원 분석**: 캠페인, 광고세트, 연령, 성별, 기기, 플랫폼별 분석
- **퍼널 분석**: AARRR 프레임워크 기반 D3.js 전환 퍼널 시각화 (4/5단계 구현)
- **크리에이티브 분석**: 이미지별 성과 분석 및 KPI 필터링
- **다중 기간 필터**: 전체/180일/90일/30일 기간별 분석 지원

---

## 대시보드 구성

### 1. Type Dashboard (type_dashboard_standalone.html)
**채널별 종합 분석 대시보드** - [상세 문서](docs/type_dashboard_specific.md)

| 기능 | 설명 |
|------|------|
| 오늘의 요약 | 핵심 KPI 및 AI 컨설턴트 종합 진단 |
| 데이터 기반 의사결정 도구 | 성과 기회, 주의 필요, 타겟 분석, AI 예측, 계절성 분석 |
| 성과 추이 분석 | 광고세트/성별/연령/플랫폼/기기플랫폼/기기 추이 차트 |
| 성과 상세 분석 | 차원별 성과 막대 차트 비교 |
| 성과 분석 | 브랜드/상품/프로모션/타겟팅별 분석 |
| 리타겟팅 분석 | 성별연령/기기/플랫폼/노출기기별 성과 테이블 |

### 2. Marketing Dashboard (marketing_dashboard_v3_standalone.html)
**마케팅 성과 대시보드** - [상세 문서](docs/marketing_dashboard_specific.md)

| 기능 | 설명 |
|------|------|
| 필터 설정 | 기간/유형구분/브랜드명/상품명/프로모션/캠페인/세트이름 필터 |
| 통합 KPI | 전체/일별/주별/월별 탭, 주요/세부 성과 토글 |
| 성과 추이 차트 | 체크박스로 지표 선택, 듀얼 Y축 콤보 차트 |
| 데이터 테이블 | 기간별 상세 데이터, 더보기/접기 기능 |

### 3. Funnel Dashboard (funnel_dashboard_standalone.html)
**AARRR 퍼널 분석 대시보드** - [상세 문서](docs/funnel_dashboard_specific.md)

| 기능 | 설명 |
|------|------|
| 핵심 KPI 요약 | 총 유입/활성화/관심/결제진행/구매완료 |
| 고객 구매 여정 5단계 | D3.js 인터랙티브 퍼널 차트, 기간별 비교 |
| 인사이트 & 채널 전략 | 핵심 요약, 긴급 개선, BCG Matrix 채널 전략 |
| 데이터 기반 의사결정 도구 | 채널 그룹별 특성, A/B 테스트 통계, 예산 투자 가이드 |
| 유입 채널별 상세 분석 | 채널별/세그먼트별 퍼널 성과 |
| 고객 재방문 및 이탈 분석 | 이탈 위험 경고, CRM 액션 가이드 |

### 4. Timeseries Analysis (timeseries_analysis_standalone.html)
**시계열 예측 분석 대시보드** - [상세 문서](docs/timeseries_analysis_specific.md)

| 기능 | 설명 |
|------|------|
| AI 상태 요약 | 현재 상태, 현재/예측 매출 비교 |
| 통합 인사이트 | AI 스토리 배너, 경고 알림, 투자 추천 |
| 최근 변화 인사이트 | 성과 개선/하락 분석 (7일/14일/30일 비교) |
| 예산 시뮬레이션 | 채널별 예산 조정 시 매출 변화 시뮬레이션, 체감 수익 모델 |
| 주요 항목 트렌드 | 세그먼트별 비용/ROAS/전환수/매출 추이 분석 |
| 데이터 분석 알고리즘 | Prophet 예측, Forecast Matrix, 상관관계 히트맵, 이상치 분석 |

### 5. Creative Analysis (creative_analysis_standalone.html)
**광고 소재별 분석 대시보드** - [상세 문서](docs/creative_analysis_specific.md)

| 기능 | 설명 |
|------|------|
| 필터 설정 | 기간/유형구분/브랜드명/상품명/프로모션/캠페인/광고세트/소재 검색 |
| KPI 기준 필터 | 다중 조건 필터 (비용, ROAS, CPA 등), ON/OFF 토글 |
| 정렬 설정 | 1차/2차 정렬 기준, 오름차순/내림차순 |
| 요약 KPI | 전체 비용, 평균 ROAS, 평균 CPA, 총 전환수, 총 전환값 |
| 소재 그리드 | 이미지별 성과 카드, 세부 성과 모달 (CTR 포함) |

---

## 빠른 시작

### 0. 패키지 설치
```bash
# 자동 설치 (권장)
install_packages.bat

# 옵션 선택:
# [1] BASIC MODE - 데이터 다운로드만
# [2] FULL MODE - 전체 분석 (Prophet 포함)
# [3] CHECK ONLY - 설치 상태 확인
```
> 상세 설치 가이드: [docs/requirements.md](docs/requirements.md)

### 1. 데이터 다운로드 (Setup 스크립트)
```bash
# 광고 성과 데이터 (필수)
setup_raw.bat

# 채널별 분석 데이터
setup_multi.bat

# 크리에이티브 데이터
setup_creative_final.bat
setup_creative_url_final.bat

# GA4 퍼널 데이터
setup_ga4_final.bat
```

### 2. 데이터 분석 실행
```bash
# 분석 메뉴 실행
run_analysis_final.bat

# 메뉴에서 선택:
# [1] SEGMENT ANALYSIS - 세그먼트 + 퍼널 + 차원 분석 (전체 분석)
# [2] CHECK SYSTEM MEMORY - 시스템 메모리 확인
```

### 3. Standalone HTML 생성
```bash
# 모든 대시보드를 standalone으로 변환
python generate_standalone.py
```

### 4. 대시보드 열기
```bash
# Windows
start data/type_dashboard_standalone.html

# Mac/Linux
open data/type_dashboard_standalone.html
```

---

## 프로젝트 구조

```
marketing-dashboard/
├── install_packages.bat            # 패키지 자동 설치
├── generate_standalone.py          # Standalone HTML 생성기
├── config.json                     # 설정 파일
├── scripts/
│   ├── fetch_google_sheets.py      # Google Sheets 데이터 수집
│   ├── fetch_creative_sheets.py    # Creative 데이터 수집
│   ├── fetch_ga4_sheets.py         # GA4 데이터 수집
│   ├── process_marketing_data.py   # 마케팅 데이터 처리
│   ├── segment_processor.py        # 세그먼트 분석
│   ├── generate_funnel_data.py     # 퍼널 데이터 생성
│   ├── generate_type_insights.py   # 타입별 인사이트 생성
│   ├── multi_analysis_prophet_forecast.py  # Prophet 예측
│   ├── multi_analysis_dimension_detail.py  # 차원 상세 분석
│   └── run_multi_analysis.py       # 분석 실행
├── data/
│   ├── raw/                        # 원본 CSV
│   │   └── raw_data.csv            # 통합 원본 데이터
│   ├── forecast/                   # Prophet 예측 결과
│   │   ├── predictions_daily.csv
│   │   ├── predictions_weekly.csv
│   │   ├── predictions_monthly.csv
│   │   └── insights.json
│   ├── funnel/                     # 퍼널 분석 데이터
│   │   ├── daily_funnel.csv
│   │   ├── channel_funnel.csv
│   │   └── insights.json
│   ├── type/                       # 타입별 분석 데이터
│   │   ├── merged_data.csv
│   │   ├── dimension_type*.csv
│   │   └── insights.json
│   ├── creative/                   # 크리에이티브 데이터
│   ├── GA4/                        # GA4 데이터
│   ├── statistics/                 # 통계 데이터
│   ├── visualizations/             # 시각화 이미지
│   │
│   ├── type_dashboard_standalone.html
│   ├── marketing_dashboard_v3_standalone.html
│   ├── funnel_dashboard_standalone.html
│   ├── timeseries_analysis_standalone.html
│   └── creative_analysis_standalone.html
├── docs/
│   ├── requirements.md             # 패키지 요구사항 가이드
│   ├── integration.md              # 통합 아키텍처 문서
│   ├── CSV_PARSING_STANDARD.md     # CSV 파싱 표준 (RFC 4180)
│   ├── MULTI_PERIOD_FILTER_IMPLEMENTATION.md  # 다중 기간 필터 구현 가이드
│   ├── type_dashboard_specific.md  # Type 대시보드 기능 명세
│   ├── marketing_dashboard_specific.md  # Marketing 대시보드 기능 명세
│   ├── funnel_dashboard_specific.md    # Funnel 대시보드 기능 명세
│   ├── timeseries_analysis_specific.md # Timeseries 분석 기능 명세
│   └── creative_analysis_specific.md   # Creative 분석 기능 명세
├── requirements.txt                # 전체 패키지 (Prophet 포함)
├── requirements_multi.txt          # Multi-sheet 다운로드용
├── requirements_creative.txt       # Creative 다운로드용
└── requirements_creative_url.txt   # Creative URL 다운로드용
```

---

## 데이터 파이프라인

### 전체 파이프라인 개요

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         1단계: 데이터 다운로드                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  setup_raw.bat ────────→ fetch_google_sheets.py ────→ data/raw/raw_data.csv │
│  setup_multi.bat ──────→ fetch_sheets_multi.py ─────→ data/type/merged_data │
│  setup_creative_final.bat → fetch_creative_sheets.py → data/creative/*.csv  │
│  setup_creative_url_final.bat → fetch_creative_url.py → data/creative/*_url │
│  setup_ga4_final.bat ──→ fetch_ga4_sheets.py ───────→ data/GA4/*.csv        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         2단계: 데이터 분석                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  run_analysis_final.bat (SEGMENT ANALYSIS)                                  │
│  ├── [1/10] process_marketing_data.py ────→ data/forecast/predictions*.csv  │
│  ├── [2/10] segment_processor.py ─────────→ data/forecast/segment_*.csv     │
│  ├── [3/10] insight_generator.py ─────────→ data/forecast/insights.json     │
│  ├── [4/10] visualization_generator.py ───→ data/visualizations/            │
│  ├── [5/10] generate_funnel_data.py ──────→ data/funnel/*.csv, insights.json│
│  ├── [6/10] generate_engagement_data.py ──→ data/funnel/channel_engagement  │
│  ├── [7/10] run_multi_analysis.py ────────→ data/type/analysis_*.csv        │
│  ├── [8/10] multi_analysis_dimension_detail.py → data/type/dimension_type*  │
│  ├── [9/10] multi_analysis_prophet_forecast.py → data/type/prophet_*.csv    │
│  └── [10/10] generate_type_insights.py ───→ data/type/insights.json         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         3단계: Standalone 생성                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  generate_standalone.py ────→ *_standalone.html (브라우저에서 바로 실행)     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 대시보드별 데이터 의존성

| 대시보드 | 필요 데이터 | Setup 스크립트 | Analysis 스크립트 |
|---------|------------|---------------|------------------|
| marketing_dashboard_v3.html | `data/raw/raw_data.csv` | setup_raw.bat | - |
| creative_analysis.html | `data/creative/*.csv` | setup_creative_final.bat, setup_creative_url_final.bat | - |
| timeseries_analysis.html | `data/forecast/*` | setup_raw.bat | run_analysis_final.bat |
| type_dashboard.html | `data/type/*` | setup_multi.bat | run_analysis_final.bat |
| funnel_dashboard.html | `data/funnel/*`, `data/GA4/*` | setup_ga4_final.bat | run_analysis_final.bat |

### 데이터 다운로드 스크립트

| 스크립트 | 용도 | 출력 경로 | Config 파일 |
|---------|------|----------|-------------|
| `setup_raw.bat` | 광고 성과 원본 데이터 | `data/raw/raw_data.csv` | `config.json` |
| `setup_multi.bat` | 다중 시트 (채널별 분석) | `data/type/merged_data.csv` | `config_multi.json` |
| `setup_creative_final.bat` | 크리에이티브 성과 데이터 | `data/creative/*.csv` | `config_creative.json` |
| `setup_creative_url_final.bat` | 크리에이티브 이미지 URL | `data/creative/*_url.csv` | `config_creative_url.json` |
| `setup_ga4_final.bat` | GA4 퍼널 데이터 | `data/GA4/*.csv` | `config_ga4.json` |

### 분석 모드

| 모드 | 메모리 | 처리 시간 | 기능 |
|-----|--------|----------|------|
| SEGMENT ANALYSIS | 2-4GB | 10-20분 | 세그먼트 + 퍼널 + 차원 분석 (전체) |

---

## 다중 기간 필터링 기능

> 상세 구현 가이드: [docs/MULTI_PERIOD_FILTER_IMPLEMENTATION.md](docs/MULTI_PERIOD_FILTER_IMPLEMENTATION.md)

### 적용 대시보드

| 대시보드 | 필터 옵션 | 제외 항목 |
|----------|-----------|-----------|
| Type Dashboard | 전체/180일/90일/30일 | 계절성 분석 |
| Funnel Dashboard | 전체/180일/90일/30일 | 이탈 위험/성과 개선 |
| Timeseries Analysis | 전체/180일/90일/30일 | - |

### 데이터 구조 (Nested Structure)

```json
{
  "by_period": {
    "full": { ... },
    "180d": { ... },
    "90d": { ... },
    "30d": { ... }
  },
  "seasonality": { ... },
  "generated_at": "...",
  "available_periods": [...]
}
```

### Multiperiod 스크립트

| Multiperiod 스크립트 | 원본 스크립트 | 출력 파일 |
|---------------------|--------------|----------|
| `generate_type_insights_multiperiod.py` | `generate_type_insights.py` | `data/type/insights.json` |
| `generate_funnel_data_multiperiod.py` | `generate_funnel_data.py` | `data/funnel/insights.json` |
| `generate_insights_multiperiod.py` | `insight_generator.py` | `data/forecast/insights.json` |

---

## Prophet 예측 알고리즘

### 하이브리드 접근법
1. **학습 기간**: 최근 365일 데이터
2. **과거 fitted 값**: 계절성 패턴 분석용 (365일)
3. **미래 예측값**: 단기 예측용 (90일)
4. **음수 방지**: `.clip(lower=0)` 적용

### 분석 지표
- 비용 (Cost)
- ROAS (Return on Ad Spend)
- CPA (Cost Per Acquisition)
- 전환수 (Conversions)
- 전환값 (Revenue)

### 계절성 분석
- **분기별 추이**: Q1~Q4 성과 비교
- **요일별 분석**: 월~일 전환 패턴
- **채널별 요일**: 채널별 최적 광고 요일 파악

### 예산 시뮬레이션 (체감 수익 모델)
- **체감 계수**: `DIMINISHING_FACTOR = 0.15`
- **ROAS 조정 공식**:
  - 예산 증가 시: `adjusted_roas = current_roas × (1 - 0.15 × ln(1 + budget_change_ratio))`
  - 예산 감소 시: `adjusted_roas = current_roas × (1 + 0.15 × ln(1 + |budget_change_ratio|) × 0.5)`
- **투자 추천 등급**:
  - ≥150%: 증액 추천 (녹색)
  - ≥100%: 유지 (파랑)
  - ≥50%: 효율 점검 (주황)
  - <50%: 감액 검토 (빨강)

### KPI 계산 공식
```javascript
CPM  = (비용 / 노출) * 1000    // 1,000회 노출당 비용
CPC  = 비용 / 클릭             // 클릭당 비용
CPA  = 비용 / 전환수           // 전환당 비용
CTR  = (클릭 / 노출) * 100     // 클릭률 (%)
ROAS = (전환값 / 비용) * 100   // 광고 수익률 (%)
```

---

## 사전 준비사항

### 필수 소프트웨어
- Python 3.10+
- pip

### Python 패키지 설치
```bash
# 자동 설치 (권장)
install_packages.bat

# 또는 수동 설치
pip install -r requirements.txt
```

### Prophet 설치 (cmdstanpy 기반)
```bash
# 1. cmdstanpy 설치
pip install cmdstanpy

# 2. CmdStan 설치 (Prophet 백엔드)
python -c "import cmdstanpy; cmdstanpy.install_cmdstan()"

# 3. Prophet 설치
pip install prophet
```

### 주요 패키지
- pandas, numpy: 데이터 처리
- prophet + cmdstanpy: 시계열 예측
- plotly: 인터랙티브 차트
- gspread: Google Sheets 연동

---

## Google Sheets 설정

### 1. Service Account 생성
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성
3. Google Sheets API, Google Drive API 활성화
4. 서비스 계정 생성 → JSON 키 다운로드

### 2. 스프레드시트 공유
1. 마케팅 데이터 스프레드시트 열기
2. 서비스 계정 이메일로 공유 (편집자 권한)

### 3. config.json 설정
```json
{
  "google_credentials_path": "your-credentials.json",
  "sheet_id": "your-sheet-id",
  "worksheet_name": "data_integration"
}
```

---

## 아키텍처 비교

### 현재: Standalone HTML

| 특징 | 설명 |
|------|------|
| 서버 불필요 | 브라우저에서 바로 실행 |
| 오프라인 사용 | 인터넷 없이도 동작 |
| 쉬운 공유 | 파일 하나로 전체 대시보드 공유 |
| 파일 크기 | ~30MB (모든 데이터 임베드) |
| 클라이언트 | 단일 클라이언트 |

### 목표: Next.js + Vercel (JAMstack)

| 특징 | 설명 |
|------|------|
| CDN 배포 | Vercel Edge Network 전 세계 빠른 응답 |
| 멀티클라이언트 | 서브도메인 분리 (clienta.dashboard.com) |
| 자동 배포 | Git Push → GitHub Actions → Vercel |
| 파일 크기 | ~5MB (85% 감소) |
| 비용 | 연 ~$12 (도메인만) |

> 상세 설계: [Deploy_project.md](docs/Deploy_project.md)

---

## 문제 해결

### 실행 불가 문제
```bash
- 언어 설정 -> 기본 언어 설정-> beta. 세계 언어 지원을 위해 Unicode UTF-8 사용
- window 10 환경은 저장 방식 LF -> CRLF 로 변경
```

### 한글 깨짐
```bash
# UTF-8 인코딩 확인 (Linux/Mac)
export PYTHONIOENCODING=utf-8

# Windows PowerShell
$env:PYTHONIOENCODING="utf-8"
```

### 메모리 부족
```bash
# 시스템 메모리 확인
run_analysis_final.bat
# [2] CHECK SYSTEM MEMORY 선택
```

### 패키지 설치 문제
```bash
# 설치 상태 확인
install_packages.bat
# [3] CHECK ONLY 선택
```

---

## 지원

**윤태웅**
- 이메일: tee1228@naver.com
- 전화: 010-7600-4362

---

**버전**: 4.3.0
**최종 업데이트**: 2026-01-05
**라이선스**: MIT

---

## 상세 문서

### 대시보드 기능 명세

| 대시보드 | 문서 |
|----------|------|
| Type Dashboard | [type_dashboard_specific.md](docs/type_dashboard_specific.md) |
| Marketing Dashboard | [marketing_dashboard_specific.md](docs/marketing_dashboard_specific.md) |
| Funnel Dashboard | [funnel_dashboard_specific.md](docs/funnel_dashboard_specific.md) |
| Timeseries Analysis | [timeseries_analysis_specific.md](docs/timeseries_analysis_specific.md) |
| Creative Analysis | [creative_analysis_specific.md](docs/creative_analysis_specific.md) |

### 아키텍처 & 배포

| 문서 | 설명 |
|------|------|
| [Deploy_project.md](docs/Deploy_project.md) | 배포 설계서 - JAMstack 아키텍처, 풀퍼널 커버리지, 멀티클라이언트 구조 |

### 고급 기능 가이드

| 기능 | 문서 | 설명 |
|------|------|------|
| 예산 시뮬레이션 | [PROPHET_BUDGET_SIMULATION.md](docs/PROPHET_BUDGET_SIMULATION.md) | 체감 수익 모델, ROAS 조정 공식, 투자 효율 계산 |
| Prophet 계절성 | [PROPHET_SEASONALITY_GUIDE.md](docs/PROPHET_SEASONALITY_GUIDE.md) | 음수 예측값 처리, 하이브리드 접근법 |
| 다중 기간 필터 | [MULTI_PERIOD_FILTER_IMPLEMENTATION.md](docs/MULTI_PERIOD_FILTER_IMPLEMENTATION.md) | 전체/180일/90일/30일 필터 구현 |
| 유형구분별 KPI | [CAMPAIGN_TYPE_KPI_MAPPING.md](docs/CAMPAIGN_TYPE_KPI_MAPPING.md) | 트래픽(CPC) vs 전환(ROAS/CPA) KPI 분기 |
| 데이터 매핑 | [data_mapping_guide.md](docs/data_mapping_guide.md) | 성별/연령/기기유형/기기플랫폼 통합 매핑 |
| Cohort Retention | [COHORT_RETENTION_GUIDE.md](docs/COHORT_RETENTION_GUIDE.md) | GA4 BigQuery 기반 코호트 분석 |

### 개발자 가이드

| 문서 | 설명 |
|------|------|
| [requirements.md](docs/requirements.md) | 패키지 요구사항 및 설치 가이드 |
| [CSV_PARSING_STANDARD.md](docs/CSV_PARSING_STANDARD.md) | CSV 파싱 표준 (RFC 4180) |
| [insight_generator_guide.md](docs/insight_generator_guide.md) | 인사이트 생성 스크립트 가이드 |
| [generate_funnel_data_guide.md](docs/generate_funnel_data_guide.md) | 퍼널 데이터 생성 가이드 |
| [generate_type_insights_guide.md](docs/generate_type_insights_guide.md) | 타입 인사이트 생성 가이드 |
