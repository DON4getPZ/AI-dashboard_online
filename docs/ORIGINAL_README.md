# 📊 마케팅 대시보드 - 완전 구축 가이드

**Growthmaker - 데이터 기반 그로스 마케팅 대시보드**

## 🎯 시스템 개요

Google Sheets → GitHub Actions → CSV → React/Vercel 대시보드 파이프라인

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│ Google Sheets   ├────▶│ GitHub Actions   ├────▶│  GitHub Repo    │
│  (원본 데이터)    │     │  (매일 자동 실행)  │     │  (/data/*.csv)  │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                           │
                                                           │
                                                           ▼
                        ┌─────────────────────────────────────────┐
                        │                                         │
                        │      React App (Vercel)                 │
                        │                                         │
                        │  • DuckDB-WASM으로 SQL 쿼리            │
                        │  • 월/주/일 단위 피벗                   │
                        │  • 시계열 예측 (6개월 학습)             │
                        │  • Recharts 시각화                     │
                        │                                         │
                        └─────────────────────────────────────────┘
```

---

## 📂 프로젝트 구조

```
marketing-dashboard/
├── .github/
│   └── workflows/
│       └── sync-data.yml              # GitHub Actions 워크플로우
├── scripts/
│   ├── fetch_google_sheets.py         # Google Sheets 데이터 페치
│   └── process_marketing_data.py      # 데이터 전처리 & 월별 분할
├── data/                               # GitHub에 저장되는 데이터
│   ├── raw/
│   │   ├── 2025-01.csv                # 월별 원본 데이터
│   │   ├── 2025-02.csv
│   │   └── ...
│   ├── meta/
│   │   ├── latest.json                # 최신 메타데이터
│   │   └── schema.json                # 컬럼 스키마
│   └── forecast/
│       └── predictions.csv            # 시계열 예측 데이터
├── react-app/                          # Next.js 대시보드
│   ├── components/
│   │   ├── Dashboard.tsx              # 메인 대시보드
│   │   └── ForecastChart.tsx          # 시계열 예측 차트
│   ├── hooks/
│   │   └── useMarketingData.ts        # 데이터 로딩 & SQL 쿼리
│   ├── pages/
│   │   └── index.tsx                  # 홈페이지
│   └── package.json
└── README.md
```

---

## 🚀 1단계: GitHub 설정

### 1.1 Repository 생성

```bash
# GitHub에서 새 Repository 생성
# 이름: marketing-dashboard
# Private으로 설정 (민감한 데이터)
```

### 1.2 Secrets 설정

**Settings → Secrets and variables → Actions** 에서 추가:

```
GOOGLE_CREDENTIALS
└── Google Service Account JSON (전체 내용)

SHEET_ID
└── Google Sheets ID (URL에서 추출)

SLACK_WEBHOOK (선택사항)
└── Slack Incoming Webhook URL
```

#### Google Service Account 생성 방법:

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 생성
3. API 및 서비스 → 라이브러리 → "Google Sheets API" 활성화
4. 사용자 인증 정보 → 서비스 계정 만들기
5. JSON 키 다운로드
6. Google Sheets에 서비스 계정 이메일 추가 (편집 권한)

---

## 🔧 2단계: 로컬 개발 환경 설정

### 2.1 Python 환경

```bash
# Python 3.12+ 설치 확인
python3 --version

# 가상환경 생성 (선택사항)
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 패키지 설치
pip install gspread oauth2client pandas numpy
```

### 2.2 전처리 스크립트 테스트

```bash
# CSV 파일로 테스트
INPUT_CSV_PATH="your_data.csv" python scripts/process_marketing_data.py

# 생성된 파일 확인
ls -lh data/raw/*.csv
ls -lh data/meta/*.json
ls -lh data/forecast/*.csv
```

**주의사항:**
- ✅ 15개 컬럼 전체 유지
- ✅ 결측치는 0으로 처리
- ✅ UTF-8 인코딩
- ✅ 월/주 구분 유지

---

## ⚙️ 3단계: GitHub Actions 자동화

### 3.1 워크플로우 활성화

1. 코드를 GitHub에 Push
2. **Actions** 탭에서 워크플로우 확인
3. "Enable workflow" 클릭
4. 수동 실행: "Run workflow" 버튼

### 3.2 스케줄 설정

`.github/workflows/sync-data.yml` 수정:

```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # 매일 UTC 00:00 (한국시간 09:00)
```

### 3.3 실행 확인

```bash
# 로컬에서 Actions 로그 확인
gh run list
gh run view [RUN_ID]

# 또는 GitHub 웹에서 Actions 탭 확인
```

---

## 🎨 4단계: React 대시보드 구축

### 4.1 Next.js 프로젝트 생성

```bash
cd react-app

# 패키지 설치
npm install
# 또는
yarn install
```

### 4.2 환경변수 설정

`.env.local` 파일 생성:

```env
NEXT_PUBLIC_DATA_URL=https://raw.githubusercontent.com/YOUR_USERNAME/marketing-dashboard/main/data
```

### 4.3 로컬 개발 서버 실행

```bash
npm run dev
# http://localhost:3000 에서 확인
```

### 4.4 주요 기능

#### 월/주/일 단위 집계 (SQL 피벗)

```typescript
// Dashboard.tsx
const sqlQuery = `
  SELECT 
    "일 구분" as date,
    SUM(비용) as cost,
    SUM(전환수) as conversions
  FROM marketing_data
  GROUP BY "일 구분"
  ORDER BY "일 구분" DESC
`;

const { data } = useMarketingData({
  months: ['2025-10', '2025-11'],
  sql: sqlQuery
});
```

#### 캠페인별 성과 분석

```typescript
const campaignSQL = `
  SELECT 
    캠페인,
    목표,
    SUM(비용) as cost,
    ROUND(SUM(전환값)::FLOAT / NULLIF(SUM(비용), 0) * 100, 0) as roas
  FROM marketing_data
  WHERE 브랜드명 = '기존제품'
  GROUP BY 캠페인, 목표
  ORDER BY SUM(비용) DESC
  LIMIT 10
`;
```

---

## 🚢 5단계: Vercel 배포

### 5.1 Vercel 프로젝트 생성

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 배포
cd react-app
vercel
```

### 5.2 환경변수 설정

Vercel Dashboard에서:
- Settings → Environment Variables
- `NEXT_PUBLIC_DATA_URL` 추가

### 5.3 자동 배포 설정

GitHub 연동:
1. Vercel Dashboard → Import Project
2. GitHub Repository 선택
3. main 브랜치 자동 배포 활성화

---

## 📊 데이터 구조 상세

### CSV 스키마 (15개 컬럼)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| 월 구분 | DATE | 월 단위 기간 |
| 주 구분 | DATE | 주 단위 기간 |
| 브랜드명 | STRING | 브랜드 구분 |
| 상품명 | STRING | 상품 구분 |
| 추가 구분 | STRING | 추가 분류 |
| 유형구분 | STRING | 광고 유형 |
| 일 구분 | DATE | 일자 |
| 목표 | STRING | 캠페인 목표 |
| 캠페인 | STRING | 캠페인명 |
| 세트이름 | STRING | 광고 세트명 |
| 비용 | INTEGER | 광고비 (원) |
| 노출 | INTEGER | 노출수 |
| 클릭 | INTEGER | 클릭수 |
| 전환수 | INTEGER | 전환 건수 |
| 전환값 | INTEGER | 전환액 (원) |

### 계산 지표 (KPI)

```sql
-- CTR (Click-Through Rate)
클릭 / 노출 * 100

-- CPC (Cost Per Click)
비용 / 클릭

-- CPA (Cost Per Acquisition)
비용 / 전환수

-- CVR (Conversion Rate)
전환수 / 클릭 * 100

-- ROAS (Return On Ad Spend)
전환값 / 비용 * 100
```

---

## 🔍 SQL 쿼리 예제

### 월별 성과 요약

```sql
SELECT 
  "월 구분" as month,
  SUM(비용) as total_cost,
  SUM(노출) as total_impressions,
  SUM(클릭) as total_clicks,
  SUM(전환수) as total_conversions,
  SUM(전환값) as total_revenue,
  ROUND(SUM(전환값)::FLOAT / NULLIF(SUM(비용), 0) * 100, 0) as roas
FROM marketing_data
GROUP BY "월 구분"
ORDER BY "월 구분" DESC
```

### 브랜드별 비교

```sql
SELECT 
  브랜드명,
  상품명,
  COUNT(*) as campaigns,
  SUM(비용) as cost,
  SUM(전환수) as conversions,
  ROUND(SUM(비용)::FLOAT / NULLIF(SUM(전환수), 0), 0) as cpa
FROM marketing_data
WHERE "일 구분" >= '2025-10-01'
GROUP BY 브랜드명, 상품명
ORDER BY SUM(비용) DESC
```

### 요일별 패턴 분석

```sql
SELECT 
  DAYOFWEEK("일 구분") as day_of_week,
  AVG(비용) as avg_cost,
  AVG(클릭) as avg_clicks,
  AVG(전환수) as avg_conversions
FROM marketing_data
WHERE "일 구분" >= CURRENT_DATE - INTERVAL 90 DAYS
GROUP BY DAYOFWEEK("일 구분")
ORDER BY day_of_week
```

---

## 📈 시계열 예측 (Forecasting)

### 현재 구현 (간단한 이동평균)

```python
# scripts/process_marketing_data.py
# 최근 30일 평균 기반 예측
recent_30 = daily.tail(30)
predictions = recent_30.mean()
```

### 고도화 방안

1. **Prophet 사용**
```python
from fbprophet import Prophet

model = Prophet()
model.fit(historical_data)
future = model.make_future_dataframe(periods=30)
forecast = model.predict(future)
```

2. **ARIMA 모델**
```python
from statsmodels.tsa.arima.model import ARIMA

model = ARIMA(data, order=(5,1,0))
model_fit = model.fit()
forecast = model_fit.forecast(steps=30)
```

3. **LSTM (딥러닝)**
```python
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense

# 6개월 데이터로 학습
# 30일 예측
```

---

## 🔐 보안 체크리스트

- ✅ Private GitHub Repository
- ✅ Service Account JSON을 Secrets에 저장
- ✅ .env 파일 .gitignore에 추가
- ✅ CORS 설정 (필요시)
- ✅ Rate Limiting (필요시)

---

## ⚡ 성능 최적화

### 1. GitHub Raw URL 캐싱

```javascript
fetch(url, {
  cache: 'force-cache',  // 브라우저 캐싱 활용
  headers: {
    'Cache-Control': 'max-age=3600'  // 1시간
  }
});
```

### 2. 월별 Lazy Loading

```javascript
// 필요한 월만 로드
const months = ['2025-11', '2025-10'];  // 최근 2개월만
```

### 3. Vercel Edge Caching

```javascript
// next.config.js
export const config = {
  runtime: 'edge',
  regions: ['icn1'],  // 서울 리전
};
```

---

## 📦 배포 체크리스트

### GitHub Actions
- [ ] Google Service Account JSON 등록
- [ ] Sheet ID 등록
- [ ] 워크플로우 활성화
- [ ] 수동 실행 테스트
- [ ] 로그 확인

### Vercel
- [ ] 프로젝트 Import
- [ ] 환경변수 설정
- [ ] 빌드 성공 확인
- [ ] 프로덕션 배포
- [ ] 도메인 연결 (선택)

### 데이터
- [ ] CSV 파일 생성 확인
- [ ] 메타데이터 정상 생성
- [ ] 예측 데이터 생성
- [ ] 대시보드에서 로딩 확인

---

## 🐛 문제 해결

### 1. GitHub Actions 실패

**문제**: `GOOGLE_CREDENTIALS` 오류
**해결**: Secrets에 전체 JSON 내용 복사 (줄바꿈 포함)

### 2. CSV 로딩 실패

**문제**: 404 Not Found
**해결**: 
- GitHub Repository가 Public인지 확인
- 또는 Private인 경우 Personal Access Token 사용

### 3. DuckDB 쿼리 오류

**문제**: 컬럼명 오류
**해결**: 한글 컬럼명은 큰따옴표로 감싸기
```sql
SELECT "일 구분", SUM(비용)
```

### 4. Vercel 빌드 실패

**문제**: Module not found
**해결**: 
```bash
npm install
npm run build  # 로컬에서 먼저 테스트
```

---

## 📞 문의 및 지원

**Growthmaker**
- 웹사이트: https://blog.growthmaker.kr
- 이메일: contact@growthmaker.kr

---

## 📄 라이선스

Private Use Only

---

## 🎉 완료!

이제 데이터 기반 마케팅 대시보드가 완성되었습니다.

1. ✅ Google Sheets → GitHub 자동 동기화
2. ✅ 월별 CSV 분할 저장
3. ✅ React 대시보드 (DuckDB SQL 쿼리)
4. ✅ 시계열 예측 (6개월 학습)
5. ✅ Vercel 자동 배포

**매일 아침 9시, 최신 데이터가 자동으로 업데이트됩니다!** 🚀
