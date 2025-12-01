# 마케팅 대시보드 v4.1 - Standalone HTML 기반

**Growthmaker - 데이터 기반 그로스 마케팅 대시보드**

---

## 주요 특징

- **Standalone HTML**: 서버 없이 브라우저에서 바로 실행
- **Prophet 시계열 예측**: 계절성 패턴 분석 및 90일 예측
- **다차원 분석**: 캠페인, 광고세트, 연령, 성별, 기기, 플랫폼별 분석
- **퍼널 분석**: 채널별/캠페인별 전환 퍼널 시각화
- **크리에이티브 분석**: 이미지별 성과 분석

---

## 대시보드 구성

### 1. Type Dashboard (type_dashboard_standalone.html)
**가장 포괄적인 분석 대시보드**

| 기능 | 설명 |
|------|------|
| 오늘의 요약 | 핵심 KPI 및 AI 추천 |
| 성과 분석 | 캠페인/광고세트별 ROAS, CPA 분석 |
| 타겟 분석 | 연령, 성별, 기기, 플랫폼별 성과 |
| 계절성 분석 | 분기별 추이, 요일별 분석, 채널별 요일 |
| AI 예측 | Prophet 기반 시계열 예측 |
| 성과 추이 | 광고세트/성별/연령/플랫폼 추이 차트 |

### 2. Marketing Dashboard (marketing_dashboard_v3_standalone.html)
- KPI 카드 (광고비, 클릭수, 전환수, ROAS)
- 성과 트렌드 차트
- PIVOT 테이블

### 3. Funnel Dashboard (funnel_dashboard_standalone.html)
- 채널별/캠페인별 전환 퍼널
- 신규 vs 재방문 분석
- 채널 참여도 분석

### 4. Timeseries Analysis (timeseries_analysis_standalone.html)
- Prophet 예측 차트
- 계절성 분해
- 신뢰구간 표시

### 5. Creative Analysis (creative_analysis_standalone.html)
- 이미지별 성과 분석
- 크리에이티브 ROAS 비교

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
│   └── CSV_PARSING_STANDARD.md     # CSV 파싱 표준 (RFC 4180)
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

## Standalone HTML 장점

| 특징 | 설명 |
|------|------|
| 서버 불필요 | 브라우저에서 바로 실행 |
| 오프라인 사용 | 인터넷 없이도 동작 |
| 쉬운 공유 | 파일 하나로 전체 대시보드 공유 |
| 빠른 로딩 | 모든 데이터가 HTML에 임베드 |

### 파일 크기
- type_dashboard_standalone.html: ~30MB
- 모든 CSV/JSON 데이터 포함

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

**버전**: 4.1.0
**최종 업데이트**: 2025-11-27
**라이선스**: MIT
