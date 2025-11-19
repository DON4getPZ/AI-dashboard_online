# 📦 마케팅 대시보드 v2.0 - 전체 파일 목록

## 📁 프로젝트 구조

```
marketing-dashboard/
│
├── 📄 README.md                       ⭐ 시작 가이드
├── 📄 setup.bat                       ⭐ Windows 자동 설치
├── 📄 setup.sh                        ⭐ Mac/Linux 자동 설치
├── 📄 requirements.txt                Python 패키지 목록
├── 📄 .gitignore                      Git 제외 파일
│
├── 📂 .github/
│   └── workflows/
│       └── sync-data.yml              매일 10:30 자동 실행
│
├── 📂 scripts/
│   ├── fetch_google_sheets.py         Google Sheets → CSV
│   └── process_marketing_data.py      데이터 전처리 + Prophet 예측
│
├── 📂 react-app/
│   ├── 📄 package.json                Node.js 패키지
│   ├── 📄 tsconfig.json               TypeScript 설정
│   ├── 📄 next.config.js              Next.js 설정
│   ├── 📄 tailwind.config.js          TailwindCSS 설정
│   ├── 📄 postcss.config.js           PostCSS 설정
│   ├── 📄 .env.local.example          환경변수 예제
│   │
│   ├── 📂 components/
│   │   ├── Dashboard.tsx              ⭐ 메인 대시보드
│   │   ├── PivotTable.tsx            ⭐ PIVOT 테이블
│   │   ├── StatisticalChart.tsx      ⭐ 통계 분석 차트
│   │   └── ForecastChart.tsx         ⭐ Prophet 예측 차트
│   │
│   ├── 📂 hooks/
│   │   └── useMarketingData.ts        DuckDB SQL 쿼리 Hook
│   │
│   ├── 📂 pages/
│   │   ├── _app.tsx                   Next.js App
│   │   └── index.tsx                  홈페이지
│   │
│   └── 📂 styles/
│       └── globals.css                글로벌 CSS
│
└── 📂 docs/
    ├── 📄 SETUP_GUIDE.md              상세 설치 가이드
    ├── 📄 PROPHET_GUIDE.md            ⭐ Prophet 설치 가이드
    ├── 📄 WORKSHEET_GUIDE.md          워크시트 설정
    └── 📄 ORIGINAL_README.md          원본 프로젝트 문서
```

## ⭐ 핵심 파일 설명

### 1. setup.bat / setup.sh
**역할:** 자동 설치 스크립트
**기능:**
- Python/Node.js 환경 확인
- Google API 설정
- GitHub Repository 생성
- 패키지 설치
- 로컬 테스트

**사용법:**
```bash
# Windows
setup.bat

# Mac/Linux
chmod +x setup.sh
./setup.sh
```

### 2. scripts/process_marketing_data.py
**역할:** 데이터 전처리 및 분석
**기능:**
- Google Sheets 데이터 로드
- 월별 CSV 분할
- **Prophet 시계열 예측** (6개월 학습 → 30일 예측)
- **정규분포 통계 분석**
- 이상치 탐지
- 성과 등급 분류

### 3. react-app/components/
**역할:** React 대시보드 컴포넌트

**Dashboard.tsx:**
- 메인 대시보드
- KPI 카드
- 성과 트렌드 차트
- 필터 기능

**PivotTable.tsx:**
- 동적 PIVOT 테이블
- 월/주/일 단위 전환
- 브랜드/상품/캠페인 분석
- CSV 다운로드

**StatisticalChart.tsx:**
- 정규분포 분석 차트
- 평균/표준편차 밴드
- 이상치 표시
- 성과 등급 분포

**ForecastChart.tsx:**
- Prophet 예측 차트
- 실제 vs 예측 비교
- 신뢰구간 표시

### 4. .github/workflows/sync-data.yml
**역할:** GitHub Actions 자동화
**스케줄:** 매일 오전 10:30 (KST)
**기능:**
- Google Sheets 데이터 페치
- Prophet 예측 실행
- 통계 분석 수행
- GitHub 자동 커밋
- Slack 알림 (선택)

## 🔧 설정 파일

### config.json (자동 생성)
```json
{
  "google": {
    "credentials_path": "path/to/credentials.json",
    "sheet_id": "YOUR_SHEET_ID",
    "worksheet_name": "데이터_통합분류"
  },
  "github": {
    "username": "YOUR_USERNAME",
    "repository": "marketing-dashboard"
  }
}
```

### react-app/.env.local (자동 생성)
```env
NEXT_PUBLIC_DATA_URL=https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/data
```

## 📊 생성되는 데이터 파일

### data/raw/
```
2025-10.csv
2025-11.csv
...
```

### data/meta/
```
latest.json       # 최신 메타데이터
schema.json       # 컬럼 스키마
```

### data/forecast/
```
predictions_prophet.csv    # Prophet 예측
predictions_simple.csv     # 간단한 예측 (Prophet 미설치 시)
```

### data/statistics/
```
statistics.json           # 통계 분석 결과
daily_statistics.csv      # 일별 통계 및 등급
```

## 🚀 실행 순서

1. **압축 해제**
   ```bash
   tar -xzf marketing-dashboard-v2.tar.gz
   cd marketing-dashboard
   ```

2. **자동 설치**
   ```bash
   # Windows
   setup.bat
   
   # Mac/Linux
   chmod +x setup.sh
   ./setup.sh
   ```

3. **GitHub Secrets 등록**
   - GOOGLE_CREDENTIALS
   - SHEET_ID

4. **GitHub Actions 활성화**
   - Repository → Actions → Enable workflow

5. **Vercel 배포**
   ```bash
   cd react-app
   vercel
   ```

6. **완료!**
   - 대시보드 확인: Vercel URL 또는 localhost:3000

## 📝 주요 개선사항

### ✨ 사용자가 요청한 기능

1. ✅ **Google API/Sheet ID 직접 입력**
   - setup.bat/sh에서 대화형 입력

2. ✅ **자동화 BAT 파일**
   - Y/N 선택 및 값 기입 방식

3. ✅ **YOUR_USERNAME 자동 대체**
   - setup 스크립트가 자동으로 config.json 생성

4. ✅ **Prophet 설치 가이드**
   - docs/PROPHET_GUIDE.md 추가
   - setup에서 선택 설치

5. ✅ **매일 오전 10:30 실행**
   - sync-data.yml cron: '30 1 * * *'

6. ✅ **PIVOT 테이블**
   - 월/주/일 단위 동적 집계
   - 브랜드/상품/캠페인별 분석

7. ✅ **시계열 분석**
   - Prophet 기반 6개월 학습 → 30일 예측
   - 정규분포 통계 분석

8. ✅ **정규분포 예측**
   - Z-Score 이상치 탐지
   - 성과 등급 분류 (상/중/하)

## 💡 추가 기능

- **자동 설치**: 5분 만에 설정 완료
- **통계 분석**: 평균, 표준편차, 이상치
- **CSV 다운로드**: PIVOT 테이블 내보내기
- **성과 등급**: 자동 분류 및 시각화
- **Slack 알림**: 데이터 업데이트 알림

## 📞 지원

문제가 발생하면:
1. docs/SETUP_GUIDE.md 확인
2. docs/PROPHET_GUIDE.md 확인
3. GitHub Issues 등록
4. contact@growthmaker.kr 문의

---

🎉 **모든 파일이 준비되었습니다!**
**setup.bat 또는 setup.sh를 실행하여 시작하세요!**
