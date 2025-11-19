# 📊 마케팅 대시보드 v3.0 - AI 고급 분석 버전

**Growthmaker - 데이터 기반 그로스 마케팅 대시보드**

## 🎯 v3.0 주요 개선사항

### ✨ 새로운 기능 (v3.0)
1. **SARIMAX 고급 시계열 예측** - 계절성 반영 ARIMA 모델 (Prophet 대체)
2. **인터랙티브 HTML 대시보드** - Plotly 기반 줌/팬 가능 차트
3. **5가지 시각화 자동 생성** - 정규분포, 계절성, 상관관계, 이상치
4. **주별/월별 예측** - 일별 예측을 자동으로 주/월 단위 집계
5. **전체 데이터 학습** - 최근 30일이 아닌 전체 데이터로 모델 학습
6. **Python 3.13+ 호환** - C++ 컴파일러 불필요 (바이너리 휠 사용)

### 🔄 v2.0 대비 개선점
- ~~Prophet~~ → **SARIMAX**: 설치 간편화, Windows 호환성 개선
- 단순 이동평균 → **추세 반영 예측**: 매일 다른 예측값 생성
- 정적 분석 → **인터랙티브 대시보드**: 웹 브라우저에서 실시간 탐색
- 제한적 시각화 → **5가지 상세 그래프**: 정규분포, 계절성, 상관관계 등

---

## 🚀 빠른 시작 (5분 완료)

### Windows 사용자

```cmd
# 1. 프로젝트 디렉토리로 이동
cd marketing-dashboard_v3

# 2. setup_fixed.bat 실행 (Python 3.13 호환)
setup_fixed.bat

# 3. 대화형 프롬프트에 따라 정보 입력
#    - Google Service Account JSON 경로
#    - Google Sheets ID
#    - Worksheet 이름
#    - GitHub Username
#    - Repository 이름

# 4. 선택적: 로컬 테스트 실행 (Y 권장)
#    → 데이터 페치 및 분석 결과 즉시 확인

# 5. GitHub Secrets 설정
#    → setup 스크립트가 안내 제공
```

### Mac/Linux 사용자

```bash
# 1. 프로젝트 디렉토리로 이동
cd marketing-dashboard_v3

# 2. 실행 권한 부여 및 실행
chmod +x setup.sh
./setup.sh

# 3. 대화형 프롬프트에 따라 정보 입력
```

---

## 📋 사전 준비사항

### 1. 필수 소프트웨어

- **Python 3.13+** (권장) 또는 3.10+
- **Node.js 18+**
- **Git**

> ⚠️ Python 3.13을 사용하면 C++ 컴파일러 없이 모든 패키지 설치 가능!

### 2. Google Service Account 생성

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성: `Marketing-Dashboard`
3. **API 라이브러리**에서 활성화:
   - Google Sheets API
   - Google Drive API
4. **서비스 계정 만들기**:
   - 이름: `marketing-bot`
   - 역할: 편집자
   - **JSON 키 생성 → 다운로드**
5. 다운로드한 JSON 파일 위치 기억 (setup 시 경로 입력)

### 3. Google Sheets 설정

1. 마케팅 데이터 스프레드시트 열기
2. **공유** 버튼 클릭
3. 서비스 계정 이메일 추가 (JSON 파일의 `client_email`)
4. 권한: **편집자**
5. **시트 이름 확인**: 기본값 `data_integration`

### 4. Google Sheets ID 확인

```
https://docs.google.com/spreadsheets/d/[이 부분이 SHEET_ID]/edit
                                        ^^^^^^^^^^^^^^^^^^^^
```

---

## 📁 프로젝트 구조

```
marketing-dashboard_v3/
├── setup_fixed.bat                    # Windows 자동 설치 (Python 3.13+)
├── setup.sh                           # Mac/Linux 자동 설치
├── requirements_fixed.txt             # Python 패키지 (바이너리 휠)
├── config.json                        # 설정 파일 (자동 생성)
├── .gitignore
├── .github/
│   └── workflows/
│       └── sync-data.yml             # 매일 10:30 KST 실행
├── scripts/
│   ├── fetch_google_sheets.py        # Google Sheets → CSV
│   └── process_marketing_data.py     # 🆕 고급 분석 + 시각화
├── react-app/                         # Next.js 대시보드
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── PivotTable.tsx
│   │   ├── StatisticalChart.tsx
│   │   └── ForecastChart.tsx
│   ├── hooks/
│   │   └── useMarketingData.ts
│   └── package.json
├── docs/                              # 문서
│   ├── SETUP_GUIDE.md
│   ├── INSTALL_FIX.md                # 🆕 Python 3.13 설치 가이드
│   └── WORKSHEET_GUIDE.md
└── data/                              # 자동 생성
    ├── raw/                          # 월별 CSV
    ├── meta/                         # 메타데이터 (latest.json)
    ├── forecast/                     # 🆕 예측 파일
    │   ├── predictions.csv           # 일별 단순 예측
    │   ├── predictions_detailed.csv  # 🆕 일별 SARIMAX 예측
    │   ├── predictions_weekly.csv    # 🆕 주별 집계
    │   └── predictions_monthly.csv   # 🆕 월별 집계
    ├── statistics/                   # 통계 분석
    │   ├── statistics.json
    │   └── daily_statistics.csv
    ├── visualizations/               # 🆕 시각화 이미지
    │   ├── timeseries_forecast.png   # 시계열 예측 (5개 지표)
    │   ├── distribution_analysis.png # 정규분포 분석
    │   ├── seasonal_decomposition.png# 계절성 분해 (7일 주기)
    │   ├── correlation_heatmap.png   # 상관관계 히트맵
    │   └── boxplot_outliers.png      # 이상치 탐지
    └── dashboard.html                # 🆕 인터랙티브 대시보드 ⭐
```

---

## 📊 새로운 고급 분석 기능 (v3.0)

### 1. SARIMAX 기반 시계열 예측 🔬

**기술 스택:**
- **SARIMAX**: Seasonal ARIMA with eXogenous variables
- **계절성 주기**: 7일 (주간 패턴 자동 감지)
- **정상성 검사**: ADF Test 자동 수행
- **모델 평가**: AIC, BIC 지표 제공

**기능:**
- 전체 데이터로 학습 (최근 30일 ❌)
- 향후 30일 예측 (일/주/월 단위)
- 95% 신뢰구간 제공
- 추세 + 계절성 분해

**출력 파일:**
- `predictions_detailed.csv`: SARIMAX 예측 결과
- `predictions_weekly.csv`: 주별 집계
- `predictions_monthly.csv`: 월별 집계

**활용:**
- 광고비 예산 계획
- 전환수 목표 설정
- 계절성 패턴 분석
- 트렌드 변화 감지

---

### 2. 인터랙티브 HTML 대시보드 🌐

**위치**: `data/dashboard.html`

**기능:**
- **Plotly 인터랙티브 차트**:
  - 줌/팬으로 시계열 탐색
  - 호버로 정확한 수치 확인
  - 범례 클릭으로 데이터 토글
  - 95% 신뢰구간 표시

- **정적 시각화 임베드**:
  - 정규분포 분석
  - 계절성 분해 (7일 주기)
  - 상관관계 히트맵
  - 이상치 박스플롯

- **통계 테이블**:
  - 주요 통계 지표 (평균, 중앙값, 표준편차 등)
  - 예측 모델 정보 (SARIMAX 파라미터, AIC, BIC)

- **성과 카드**:
  - 총 광고비, 전환수, 전환값, ROAS
  - 분석 기간 및 데이터 포인트 수

**열기:**
```bash
# Windows
start data/dashboard.html

# Mac/Linux
open data/dashboard.html
```

---

### 3. 5가지 자동 시각화 📈

#### 3.1 시계열 예측 그래프
- **파일**: `timeseries_forecast.png`
- **내용**: 5개 지표별 실제 데이터 + 예측 + 신뢰구간
- **지표**: 비용, 노출, 클릭, 전환수, 전환값

#### 3.2 정규분포 분석
- **파일**: `distribution_analysis.png`
- **내용**: 히스토그램 + 정규분포 곡선
- **통계**: 왜도, 첨도, 평균, ±1σ 표시

#### 3.3 계절성 분해
- **파일**: `seasonal_decomposition.png`
- **내용**: 시계열 4단 분해 (원본, 추세, 계절성, 잔차)
- **주기**: 7일 (주간 패턴)

#### 3.4 상관관계 히트맵
- **파일**: `correlation_heatmap.png`
- **내용**: 5개 지표 간 상관계수 행렬
- **범위**: -1 (음의 상관) ~ +1 (양의 상관)

#### 3.5 이상치 탐지 박스플롯
- **파일**: `boxplot_outliers.png`
- **내용**: 5개 지표별 박스플롯 + 이상치 개수
- **기준**: IQR 방식 (Q1 - 1.5×IQR, Q3 + 1.5×IQR)

---

### 4. 정규분포 기반 통계 분석

**기능:**
- 평균, 중앙값, 표준편차
- 왜도(Skewness), 첨도(Kurtosis)
- Z-Score 이상치 탐지 (|z| > 2.5)
- 성과 등급 분류 (상/중/하)

**출력 파일:**
- `statistics.json`: 전체 통계 요약
- `daily_statistics.csv`: 일별 Z-Score 및 등급

**활용:**
- 성과 이상치 감지
- 최적 성과 구간 파악
- 성과 등급 기반 예산 배분
- 캠페인 성과 벤치마킹

---

### 5. 추세 반영 예측 알고리즘

**개선 사항:**
- **이전 (v2.0)**: 최근 30일 평균 → 모든 날짜 동일한 예측값
- **이후 (v3.0)**: 이상치 제거 + 선형 추세 반영 → 매일 다른 예측값

**알고리즘:**
1. 최근 30일 데이터 수집
2. 하위 20% 제거 (캠페인 중단일 등)
3. 최근 14일로 추세선 계산 (선형 회귀)
4. 기준값 + (추세 × 예측일수)로 예측

**결과:**
```
예측 1일차: 1,050,000원
예측 2일차: 1,035,000원 (추세 -15,000원/일)
예측 3일차: 1,020,000원
```

---

## ⏰ 스케줄 설정

### GitHub Actions - 매일 오전 10:30 (한국시간)

```yaml
schedule:
  # 매일 한국시간 오전 10:30 (UTC 01:30)
  - cron: '30 1 * * *'
```

**자동 실행 내용:**
1. Google Sheets 데이터 페치
2. 데이터 전처리 및 월별 분할
3. **SARIMAX 예측 생성** (일/주/월)
4. **5가지 시각화 생성** (PNG)
5. **HTML 대시보드 생성**
6. 통계 분석 수행
7. GitHub에 자동 커밋
8. Slack 알림 (선택)

---

## 🔐 보안 설정

### GitHub Secrets 등록

**Settings → Secrets and variables → Actions**

1. **GOOGLE_CREDENTIALS**
   - Google Service Account JSON 전체 내용
   - JSON 파일을 열어서 전체 복사 (줄바꿈 포함)

2. **SHEET_ID**
   - Google Sheets ID
   - 예: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

3. **WORKSHEET_NAME** (선택)
   - 기본값: `data_integration`
   - 다른 이름 사용 시 입력

4. **SLACK_WEBHOOK** (선택)
   - Slack 알림 URL
   - 데이터 업데이트 알림 수신

---

## 📈 대시보드 기능

### 메인 페이지
1. **KPI 카드**
   - 총 광고비, 클릭수, 전환수, ROAS
   - 전일 대비 증감률

2. **성과 트렌드 차트**
   - 시계열 라인 차트
   - 월/주/일 단위 전환
   - 예측 데이터 오버레이

3. **PIVOT 테이블**
   - 동적 집계 테이블
   - 브랜드/상품/캠페인별 분석
   - 실시간 정렬/필터
   - CSV 다운로드

### 예측 분석
4. **SARIMAX 예측 차트**
   - 실제 vs 예측 비교
   - 95% 신뢰구간 표시
   - 주별/월별 예측 토글

### 통계 분석
5. **정규분포 차트**
   - 평균/표준편차 밴드
   - 이상치 표시
   - 성과 등급 분포
   - 히스토그램 + 정규곡선

### 시각화
6. **계절성 분해**
   - 추세 (Trend)
   - 계절성 (Seasonality - 7일)
   - 잔차 (Residual)

7. **상관관계 분석**
   - 5개 지표 간 상관계수
   - 히트맵 시각화

---

## 🛠️ 문제 해결

### Python 3.13 설치 오류

**Windows:**
```cmd
# Python 3.13+ 다운로드
# https://www.python.org/downloads/

# setup_fixed.bat 사용 (바이너리 휠 패키지)
setup_fixed.bat
```

**Mac:**
```bash
brew install python@3.13
pip3 install -r requirements_fixed.txt
```

**상세 가이드:** [docs/INSTALL_FIX.md](docs/INSTALL_FIX.md)

### ~~Prophet~~ SARIMAX 설치 간편화

v3.0에서는 Prophet 대신 statsmodels의 SARIMAX를 사용하여:
- ✅ C++ 컴파일러 불필요
- ✅ Windows 호환성 개선
- ✅ 설치 시간 단축 (5분 → 2분)
- ✅ 계절성 패턴 더 정확하게 포착

### GitHub Actions 실패

1. **GOOGLE_CREDENTIALS 오류**
   - JSON 전체 내용 복사 (줄바꿈 포함)
   - 따옴표 escape 확인

2. **스케줄 미실행**
   - Actions 탭에서 워크플로우 활성화 확인
   - 최소 1회 수동 실행 필요

3. **패키지 설치 실패**
   - `requirements_fixed.txt` 사용 확인
   - Python 3.13+ 버전 확인

### Vercel 배포 오류

```bash
cd react-app
npm install
npm run build  # 로컬에서 먼저 테스트
```

---

## 📞 지원

**Growthmaker**
- 웹사이트: https://blog.growthmaker.kr
- 이메일: contact@growthmaker.kr
- GitHub Issues: [프로젝트 저장소]/issues

---

## 🎉 완료!

```
✅ setup_fixed.bat로 5분 만에 설치 (Python 3.13+)
✅ SARIMAX 고급 시계열 예측 (계절성 반영)
✅ 인터랙티브 HTML 대시보드 (Plotly)
✅ 5가지 자동 시각화 (정규분포, 계절성, 상관관계 등)
✅ 주별/월별 예측 자동 생성
✅ 전체 데이터 학습 (최대 정확도)
✅ 매일 오전 10:30 자동 업데이트
✅ GitHub + Vercel 자동 배포
```

**다음 단계:**
1. `setup_fixed.bat` (Windows) 또는 `setup.sh` (Mac/Linux) 실행
2. 대화형 프롬프트에 따라 정보 입력
3. 로컬 테스트 실행 (Y 선택 권장)
4. `data/dashboard.html` 브라우저에서 확인 ⭐
5. GitHub Secrets 등록
6. Vercel 배포
7. 매일 자동 업데이트 확인!

🚀 **이제 AI 기반 데이터 분석으로 마케팅 ROI를 극대화하세요!**

---

## 📚 추가 문서

- [설치 가이드](docs/SETUP_GUIDE.md) - 상세 설치 가이드
- [Python 3.13 설치](docs/INSTALL_FIX.md) - C++ 컴파일러 없이 설치
- [워크시트 가이드](docs/WORKSHEET_GUIDE.md) - Google Sheets 설정

---

## 🆕 v3.0 변경 로그

### 추가된 기능
- ✨ SARIMAX 기반 고급 시계열 예측
- ✨ Plotly 인터랙티브 HTML 대시보드
- ✨ 5가지 자동 시각화 (PNG)
- ✨ 주별/월별 예측 자동 생성
- ✨ 전체 데이터 학습 (최대 정확도)
- ✨ 계절성 분해 (7일 주기)
- ✨ 상관관계 히트맵
- ✨ 이상치 탐지 박스플롯

### 개선된 기능
- 🔧 단순 이동평균 → 추세 반영 예측
- 🔧 Prophet → SARIMAX (설치 간편화)
- 🔧 Python 3.13+ 완전 호환
- 🔧 이상치 자동 필터링
- 🔧 UTF-8 출력 자동 처리 (Windows)

### 제거된 기능
- ❌ Prophet 의존성 (SARIMAX로 대체)

---

**버전**: 3.0.0
**최종 업데이트**: 2025-11-18
**라이선스**: MIT
**제작**: Growthmaker
