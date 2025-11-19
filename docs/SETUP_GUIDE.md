# 🚀 마케팅 대시보드 - 설치 가이드

**Growthmaker - 데이터 기반 그로스 마케팅 대시보드**

---

## 📦 프로젝트 구조

```
marketing-dashboard/
├── .github/
│   └── workflows/
│       └── sync-data.yml              # GitHub Actions (매일 자동 실행)
├── scripts/
│   ├── fetch_google_sheets.py         # Google Sheets → CSV
│   └── process_marketing_data.py      # 데이터 전처리 & 월별 분할
├── react-app/
│   ├── components/
│   │   ├── Dashboard.tsx              # 메인 대시보드
│   │   └── ForecastChart.tsx          # 시계열 예측 차트
│   ├── hooks/
│   │   └── useMarketingData.ts        # DuckDB SQL 쿼리
│   ├── pages/
│   │   ├── _app.tsx                   # Next.js App
│   │   └── index.tsx                  # 홈페이지
│   ├── styles/
│   │   └── globals.css                # 글로벌 CSS
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── next.config.js
├── data/                               # 자동 생성됨
│   ├── raw/                           # 월별 CSV
│   ├── meta/                          # 메타데이터
│   └── forecast/                      # 예측 데이터
├── .gitignore
├── README.md                           # 전체 가이드
├── WORKSHEET_GUIDE.md                  # 워크시트 설정 가이드
├── CHANGES_SUMMARY.md                  # 변경사항
└── SETUP_GUIDE.md                      # 이 파일
```

---

## 🔧 1단계: 사전 준비

### 필수 도구 설치

```bash
# Python 3.12+ 설치 확인
python3 --version

# Node.js 18+ 설치 확인
node --version
npm --version

# Git 설치 확인
git --version
```

---

## 📊 2단계: Google Sheets 설정

### 2.1 Service Account 생성

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성: `Growthmaker-Dashboard`
3. **API 및 서비스 → 라이브러리**
   - `Google Sheets API` 활성화
   - `Google Drive API` 활성화
4. **사용자 인증 정보 → 서비스 계정 만들기**
   - 이름: `marketing-data-bot`
   - 역할: 편집자
   - **JSON 키 생성 → 다운로드**

### 2.2 Google Sheets 권한 부여

1. Google Sheets 열기
2. **공유** 버튼 클릭
3. Service Account 이메일 추가 (예: `marketing-data-bot@xxx.iam.gserviceaccount.com`)
4. 권한: **편집자**

### 2.3 워크시트 확인

- 워크시트 이름: **`데이터_통합분류`**
- 15개 컬럼 구조 확인

---

## 🏗️ 3단계: GitHub Repository 설정

### 3.1 Repository 생성

```bash
# GitHub CLI 사용
gh repo create marketing-dashboard --private

# 또는 웹에서: https://github.com/new
```

### 3.2 로컬 클론 및 파일 추가

```bash
# 클론
git clone https://github.com/YOUR_USERNAME/marketing-dashboard.git
cd marketing-dashboard

# 다운로드 받은 압축 파일 압축 해제 후 모든 파일 복사
# 또는 직접 압축 해제한 내용을 여기에 배치

# 커밋 & 푸시
git add .
git commit -m "🚀 Initial setup: Marketing Dashboard"
git push origin main
```

### 3.3 GitHub Secrets 설정

**Settings → Secrets and variables → Actions → New repository secret**

#### Secret 1: GOOGLE_CREDENTIALS
```json
{
  "type": "service_account",
  "project_id": "your-project",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "marketing-data-bot@xxx.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```
**전체 JSON 내용을 복사하세요 (줄바꿈 포함)**

#### Secret 2: SHEET_ID
```
1AbCdEfGhIjKlMnOpQrStUvWxYz
```
**Google Sheets URL에서 추출:**
```
https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
```

---

## 🐍 4단계: Python 환경 설정 (로컬 테스트)

### 4.1 가상환경 생성

```bash
cd marketing-dashboard

# 가상환경 생성
python3 -m venv venv

# 활성화
source venv/bin/activate  # Mac/Linux
# 또는
venv\Scripts\activate     # Windows
```

### 4.2 패키지 설치

```bash
pip install gspread oauth2client pandas numpy
```

### 4.3 로컬 테스트

```bash
# 환경변수 설정 (임시)
export GOOGLE_CREDENTIALS='<JSON 전체 내용>'
export SHEET_ID='<Google Sheets ID>'

# 데이터 페치 테스트
python scripts/fetch_google_sheets.py

# 전처리 테스트
INPUT_CSV_PATH="raw_data.csv" python scripts/process_marketing_data.py

# 생성된 파일 확인
ls -lh data/raw/*.csv
ls -lh data/meta/*.json
ls -lh data/forecast/*.csv
```

---

## ⚙️ 5단계: GitHub Actions 활성화

### 5.1 워크플로우 실행

1. GitHub Repository → **Actions** 탭
2. "Daily Marketing Data Sync" 선택
3. **Enable workflow** 클릭
4. **Run workflow** 버튼으로 수동 실행

### 5.2 성공 확인

- ✅ Actions 로그에 `✅ 데이터 동기화 완료!` 확인
- ✅ `data/raw/` 디렉토리에 월별 CSV 생성
- ✅ 커밋 메시지: `📊 데이터 업데이트: YYYY-MM-DD`

---

## ⚛️ 6단계: React 대시보드 설정

### 6.1 의존성 설치

```bash
cd react-app

# npm 사용
npm install

# 또는 yarn 사용
yarn install
```

### 6.2 환경변수 설정

`.env.local` 파일 생성:

```bash
cp .env.local.example .env.local
```

**`.env.local` 수정:**

```env
# Public Repository
NEXT_PUBLIC_DATA_URL=https://raw.githubusercontent.com/YOUR_USERNAME/marketing-dashboard/main/data

# Private Repository (Personal Access Token 필요)
# NEXT_PUBLIC_DATA_URL=https://YOUR_TOKEN@raw.githubusercontent.com/YOUR_USERNAME/marketing-dashboard/main/data
```

**Private Repo용 Token 생성:**
1. GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. 권한: `repo` 체크
4. 복사 후 `.env.local`에 추가

### 6.3 로컬 개발 서버

```bash
npm run dev
# 또는
yarn dev

# 브라우저에서 확인
# http://localhost:3000
```

**확인사항:**
- ✅ KPI 카드 4개 표시
- ✅ 성과 트렌드 차트
- ✅ 캠페인별 성과 바 차트
- ✅ 시계열 예측 차트

---

## 🚢 7단계: Vercel 배포

### 7.1 Vercel CLI 설치

```bash
npm i -g vercel
```

### 7.2 로그인 및 배포

```bash
cd react-app

# 로그인
vercel login

# 첫 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 7.3 환경변수 설정 (Vercel Dashboard)

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings → Environment Variables**
4. 추가:

```
NEXT_PUBLIC_DATA_URL
→ https://raw.githubusercontent.com/YOUR_USERNAME/marketing-dashboard/main/data
```

### 7.4 자동 배포 설정

**Vercel Dashboard:**
1. Settings → Git
2. GitHub Repository 연결
3. Production Branch: `main`
4. 이제 `main` 브랜치 푸시 시 자동 배포!

---

## ✅ 전체 체크리스트

### Google Sheets
- [ ] Service Account JSON 다운로드
- [ ] Google Sheets API 활성화
- [ ] '데이터_통합분류' 워크시트 확인
- [ ] Service Account 권한 부여

### GitHub
- [ ] Repository 생성 (Private)
- [ ] `GOOGLE_CREDENTIALS` Secret 추가
- [ ] `SHEET_ID` Secret 추가
- [ ] Actions 워크플로우 활성화
- [ ] 수동 실행 테스트 성공

### Python (로컬)
- [ ] 가상환경 생성
- [ ] 패키지 설치
- [ ] Google Sheets → CSV 테스트
- [ ] 데이터 전처리 테스트
- [ ] CSV 파일 생성 확인

### React (로컬)
- [ ] `npm install` 완료
- [ ] `.env.local` 설정
- [ ] `npm run dev` 성공
- [ ] 대시보드 렌더링 확인

### Vercel
- [ ] Vercel 계정 생성
- [ ] 프로젝트 배포
- [ ] 환경변수 설정
- [ ] 프로덕션 URL 확인
- [ ] GitHub 자동 배포 연동

---

## 📖 추가 문서

- **[README.md](./README.md)** - 전체 시스템 가이드
- **[WORKSHEET_GUIDE.md](./WORKSHEET_GUIDE.md)** - 워크시트 설정 상세 가이드
- **[CHANGES_SUMMARY.md](./CHANGES_SUMMARY.md)** - 주요 변경사항

---

## 🐛 문제 해결

### GitHub Actions 실패
```
❌ GOOGLE_CREDENTIALS 오류
```
**해결:** JSON 전체 내용을 복사 (줄바꿈 포함)

### CSV 로딩 실패
```
❌ 404 Not Found
```
**해결:** 
- Repository가 Public인지 확인
- Private인 경우 Personal Access Token 사용

### DuckDB 쿼리 오류
```
❌ Column '비용' not found
```
**해결:** 한글 컬럼명은 큰따옴표로 감싸기
```typescript
SELECT "비용", "전환수"  // ✅
```

---

## 💬 문의

**Growthmaker**
- 웹사이트: https://blog.growthmaker.kr
- 이메일: contact@growthmaker.kr

---

## 🎉 완료!

모든 설정이 끝났습니다. 이제 매일 아침 9시, 최신 데이터가 자동으로 업데이트됩니다! 🚀
