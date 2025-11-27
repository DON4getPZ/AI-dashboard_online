# 마케팅 대시보드 - 요구사항 가이드

## 목차
1. [시스템 요구사항](#시스템-요구사항)
2. [Python 패키지](#python-패키지)
3. [Setup 스크립트별 요구사항](#setup-스크립트별-요구사항)
4. [설치 가이드](#설치-가이드)
5. [문제 해결](#문제-해결)

---

## 시스템 요구사항

### 필수 소프트웨어

| 소프트웨어 | 최소 버전 | 권장 버전 | 용도 |
|-----------|----------|----------|------|
| Python | 3.10+ | 3.13+ | 스크립트 실행 |
| pip | 21.0+ | 최신 | 패키지 관리 |
| Git | 2.30+ | 최신 | 버전 관리 (선택) |

### 하드웨어 요구사항

| 분석 모드 | RAM | 처리 시간 | 권장 환경 |
|----------|-----|----------|----------|
| BASIC (다운로드만) | 200-500 MB | 1-2분 | 저사양 PC |
| SEGMENT ANALYSIS | 2-4 GB | 10-20분 | 고사양 PC (8GB+ RAM) |

---

## Python 패키지

### 전체 패키지 요약

```
requirements.txt (전체 분석용)
├── 데이터 처리
│   ├── pandas>=2.2.0
│   └── numpy>=2.0.0
├── Google Sheets 연동
│   ├── gspread>=5.12.0
│   └── oauth2client>=4.1.3
├── 시계열 예측
│   ├── prophet>=1.2.0
│   └── cmdstanpy>=1.3.0
├── 통계 분석
│   ├── scipy>=1.14.0
│   └── statsmodels>=0.14.4
├── 데이터 시각화
│   ├── matplotlib>=3.9.0
│   ├── seaborn>=0.13.0
│   └── plotly>=5.18.0
└── 유틸리티
    ├── python-dateutil>=2.8.2
    └── pytz>=2024.1
```

### 패키지 상세 설명

#### 1. 데이터 처리
| 패키지 | 버전 | 용도 |
|--------|------|------|
| `pandas` | >=2.2.0 | DataFrame 기반 데이터 처리 |
| `numpy` | >=2.0.0 | 수치 연산, 배열 처리 |

#### 2. Google Sheets 연동
| 패키지 | 버전 | 용도 |
|--------|------|------|
| `gspread` | >=5.12.0 | Google Sheets API 클라이언트 |
| `oauth2client` | >=4.1.3 | Google OAuth 인증 |

#### 3. 시계열 예측 (Prophet)
| 패키지 | 버전 | 용도 |
|--------|------|------|
| `prophet` | >=1.2.0 | Facebook Prophet 시계열 예측 |
| `cmdstanpy` | >=1.3.0 | Prophet 백엔드 (Stan 컴파일러) |

#### 4. 통계 분석
| 패키지 | 버전 | 용도 |
|--------|------|------|
| `scipy` | >=1.14.0 | 과학 계산, 통계 함수 |
| `statsmodels` | >=0.14.4 | 통계 모델링, 회귀 분석 |

#### 5. 데이터 시각화
| 패키지 | 버전 | 용도 |
|--------|------|------|
| `matplotlib` | >=3.9.0 | 기본 차트 생성 |
| `seaborn` | >=0.13.0 | 통계 시각화 |
| `plotly` | >=5.18.0 | 인터랙티브 차트 |

#### 6. 유틸리티
| 패키지 | 버전 | 용도 |
|--------|------|------|
| `python-dateutil` | >=2.8.2 | 날짜/시간 파싱 |
| `pytz` | >=2024.1 | 시간대 처리 |

---

## Setup 스크립트별 요구사항

### 데이터 다운로드 스크립트

| Setup 스크립트 | requirements 파일 | 필수 패키지 |
|---------------|-------------------|-------------|
| `setup_raw.bat` | requirements.txt | gspread, oauth2client, pandas |
| `setup_multi.bat` | requirements_multi.txt | gspread, oauth2client |
| `setup_creative_final.bat` | requirements_creative.txt | gspread, oauth2client |
| `setup_creative_url_final.bat` | requirements_creative_url.txt | gspread, oauth2client |
| `setup_ga4_final.bat` | requirements_creative.txt | gspread, oauth2client |

### 분석 스크립트 (run_analysis_final.bat)

| 분석 모드 | 필수 패키지 | 선택 패키지 |
|----------|-------------|------------|
| SEGMENT ANALYSIS | **전체 패키지 필요** | - |

### 스크립트별 패키지 의존성

```
scripts/
├── fetch_google_sheets.py      → gspread, oauth2client, pandas
├── fetch_sheets_multi.py       → gspread, oauth2client
├── fetch_creative_sheets.py    → gspread, oauth2client
├── fetch_creative_url.py       → gspread, oauth2client
├── fetch_ga4_sheets.py         → gspread, oauth2client
├── process_marketing_data.py   → pandas, numpy, prophet, cmdstanpy
├── segment_processor.py        → pandas, numpy
├── insight_generator.py        → pandas, numpy
├── visualization_generator.py  → pandas, matplotlib, seaborn, plotly
├── generate_funnel_data.py     → pandas, numpy
├── generate_engagement_data.py → pandas, numpy
├── run_multi_analysis.py       → pandas, numpy
├── multi_analysis_dimension_detail.py → pandas, numpy
├── multi_analysis_prophet_forecast.py → pandas, numpy, prophet, cmdstanpy
└── generate_type_insights.py   → pandas, numpy
```

---

## 설치 가이드

### 자동 설치 (권장)

```bash
# install_packages.bat 실행
install_packages.bat

# 옵션 선택:
# [1] BASIC MODE - 데이터 다운로드만
# [2] FULL MODE - 전체 분석 (Prophet 포함)
# [3] CHECK ONLY - 설치 상태 확인
```

### 수동 설치

#### 1. 기본 설치 (데이터 다운로드만)

```bash
# Google Sheets 연동 패키지만 설치
pip install gspread>=5.12.0 oauth2client>=4.1.3 pandas>=2.2.0
```

#### 2. 전체 설치 (SEGMENT ANALYSIS)

```bash
# 방법 1: requirements.txt 사용
pip install -r requirements.txt

# 방법 2: 단계별 설치
# Step 1: 기본 패키지
pip install pandas>=2.2.0 numpy>=2.0.0
pip install gspread>=5.12.0 oauth2client>=4.1.3

# Step 2: Prophet 설치 (cmdstanpy 백엔드)
pip install cmdstanpy>=1.3.0
python -c "import cmdstanpy; cmdstanpy.install_cmdstan()"
pip install prophet>=1.2.0

# Step 3: 통계 및 시각화
pip install scipy>=1.14.0 statsmodels>=0.14.4
pip install matplotlib>=3.9.0 seaborn>=0.13.0 plotly>=5.18.0

# Step 4: 유틸리티
pip install python-dateutil>=2.8.2 pytz>=2024.1
```

### 가상환경 사용 (권장)

```bash
# 가상환경 생성
python -m venv venv

# 활성화 (Windows)
venv\Scripts\activate

# 활성화 (Mac/Linux)
source venv/bin/activate

# 패키지 설치
pip install -r requirements.txt
```

---

## 문제 해결

### Prophet 설치 오류

#### 오류: cmdstan 설치 실패
```bash
# 해결: cmdstan 수동 설치
python -c "import cmdstanpy; cmdstanpy.install_cmdstan()"
```

#### 오류: C++ 컴파일러 없음 (Windows)
```bash
# 해결 1: Visual Studio Build Tools 설치
# https://visualstudio.microsoft.com/visual-cpp-build-tools/

# 해결 2: Prophet 없이 분석 실행
# 스크립트가 자동으로 단순 예측 방법을 사용합니다
```

### 메모리 부족 오류

```bash
# 해결: 시스템 메모리 확인 후 불필요한 프로그램 종료
# run_analysis_final.bat 실행 후 [2] CHECK SYSTEM MEMORY 선택
```

### 패키지 버전 충돌

```bash
# 해결: 가상환경에서 새로 설치
python -m venv venv_new
venv_new\Scripts\activate
pip install -r requirements.txt
```

### gspread 인증 오류

```bash
# 해결 1: JSON 키 파일 경로 확인
# 해결 2: Google Sheets API 활성화 확인
# 해결 3: 서비스 계정에 시트 공유 확인
```

---

## requirements 파일 목록

| 파일명 | 용도 | 패키지 수 |
|--------|------|----------|
| `requirements.txt` | 전체 분석 (Prophet 포함) | 13개 |
| `requirements_fixed.txt` | 전체 분석 (버전 고정) | 13개 |
| `requirements_multi.txt` | Multi-sheet 다운로드 | 2개 |
| `requirements_creative.txt` | Creative 데이터 다운로드 | 2개 |
| `requirements_creative_url.txt` | Creative URL 다운로드 | 2개 |

---

## 버전 호환성

### Python 버전별 호환성

| Python 버전 | 지원 상태 | 비고 |
|------------|----------|------|
| 3.9 | 제한적 | 일부 패키지 버전 다운그레이드 필요 |
| 3.10 | 지원 | 안정적 |
| 3.11 | 지원 | 안정적 |
| 3.12 | 지원 | 권장 |
| 3.13 | 지원 | 최신 (바이너리 휠 사용) |

### 운영체제별 호환성

| OS | 지원 상태 | 비고 |
|----|----------|------|
| Windows 10/11 | 완전 지원 | .bat 스크립트 제공 |
| macOS | 지원 | .sh 스크립트 별도 필요 |
| Linux | 지원 | .sh 스크립트 별도 필요 |

---

**최종 업데이트**: 2025-11-27
**버전**: 1.1.0
