#!/bin/bash

echo "================================================================================"
echo "📊 마케팅 대시보드 자동 설치 v2.0"
echo "================================================================================"
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# [1/10] 환경 확인
echo "[1/10] 환경 확인 중..."
echo ""

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 미설치${NC}"
    echo "   https://www.python.org/downloads/ 에서 설치하세요"
    exit 1
fi
echo -e "${GREEN}✅ Python 확인${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 미설치${NC}"
    echo "   https://nodejs.org/ 에서 설치하세요"
    exit 1
fi
echo -e "${GREEN}✅ Node.js 확인${NC}"

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git 미설치${NC}"
    echo "   https://git-scm.com/downloads 에서 설치하세요"
    exit 1
fi
echo -e "${GREEN}✅ Git 확인${NC}"

echo ""
# [2/10] 사용자 정보 입력
echo "[2/10] 설정 정보 입력"
echo ""

read -p "Google Service Account JSON 파일 경로: " GOOGLE_JSON
if [ ! -f "$GOOGLE_JSON" ]; then
    echo -e "${RED}❌ 파일을 찾을 수 없습니다: $GOOGLE_JSON${NC}"
    exit 1
fi
echo -e "${GREEN}✅ JSON 파일 확인${NC}"

read -p "Google Sheets ID: " SHEET_ID
echo -e "${GREEN}✅ Sheets ID: $SHEET_ID${NC}"

read -p "워크시트 이름 (기본: 데이터_통합분류): " WORKSHEET_NAME
WORKSHEET_NAME=${WORKSHEET_NAME:-데이터_통합분류}
echo -e "${GREEN}✅ 워크시트: $WORKSHEET_NAME${NC}"

read -p "GitHub Username: " GITHUB_USERNAME
echo -e "${GREEN}✅ GitHub: $GITHUB_USERNAME${NC}"

read -p "Repository 이름 (기본: marketing-dashboard): " REPO_NAME
REPO_NAME=${REPO_NAME:-marketing-dashboard}
echo -e "${GREEN}✅ Repository: $REPO_NAME${NC}"

echo ""
# [3/10] 설정 파일 생성
echo "[3/10] 설정 파일 생성 중..."
cat > config.json <<EOF
{
  "google": {
    "credentials_path": "$GOOGLE_JSON",
    "sheet_id": "$SHEET_ID",
    "worksheet_name": "$WORKSHEET_NAME"
  },
  "github": {
    "username": "$GITHUB_USERNAME",
    "repository": "$REPO_NAME"
  },
  "schedule": {
    "cron": "30 1 * * *",
    "description": "매일 오전 10:30 KST"
  }
}
EOF
echo -e "${GREEN}✅ config.json 생성 완료${NC}"

echo ""
# [4/10] Python 패키지 설치
echo "[4/10] Python 패키지 설치 중..."
echo ""

read -p "Prophet을 설치하시겠습니까? (y/N): " INSTALL_PROPHET
if [[ $INSTALL_PROPHET =~ ^[Yy]$ ]]; then
    echo ""
    echo "📦 Prophet 설치 중... (5-10분 소요)"
    echo ""
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # Mac
        echo "Mac 환경 감지"
        brew install gcc 2>/dev/null || echo "Homebrew가 설치되어 있지 않습니다"
    fi
    
    pip3 install prophet
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Prophet 설치 실패${NC}"
        echo "   docs/PROPHET_GUIDE.md 를 참고하세요"
        read -p "계속하시겠습니까? (y/N): " CONTINUE
        if [[ ! $CONTINUE =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo -e "${GREEN}✅ Prophet 설치 완료${NC}"
    fi
fi

echo ""
echo "기본 패키지 설치 중..."
pip3 install -r requirements.txt
echo -e "${GREEN}✅ Python 패키지 설치 완료${NC}"

echo ""
# [5/10] Node.js 패키지 설치
echo "[5/10] Node.js 패키지 설치 중..."
cd react-app
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ npm install 실패${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js 패키지 설치 완료${NC}"
cd ..

echo ""
# [6/10] 환경변수 파일 생성
echo "[6/10] 환경변수 파일 생성 중..."
cat > react-app/.env.local <<EOF
NEXT_PUBLIC_DATA_URL=https://raw.githubusercontent.com/$GITHUB_USERNAME/$REPO_NAME/main/data
EOF
echo -e "${GREEN}✅ .env.local 생성 완료${NC}"

echo ""
# [7/10] 로컬 테스트
echo "[7/10] 로컬 테스트"
read -p "데이터 페치 테스트를 실행하시겠습니까? (y/N): " RUN_TEST
if [[ $RUN_TEST =~ ^[Yy]$ ]]; then
    echo ""
    echo "📊 Google Sheets 데이터 가져오기 중..."
    
    export GOOGLE_CREDENTIALS=$(cat "$GOOGLE_JSON")
    export SHEET_ID=$SHEET_ID
    export WORKSHEET_NAME=$WORKSHEET_NAME
    
    python3 scripts/fetch_google_sheets.py
    
    if [ -f "raw_data.csv" ]; then
        echo -e "${GREEN}✅ 데이터 페치 성공${NC}"
        echo ""
        echo "📊 데이터 전처리 중..."
        export INPUT_CSV_PATH=raw_data.csv
        python3 scripts/process_marketing_data.py
        echo -e "${GREEN}✅ 데이터 전처리 완료${NC}"
    else
        echo -e "${RED}❌ 데이터 페치 실패${NC}"
        echo "   Google Sheets 설정을 확인하세요"
    fi
fi

echo ""
# [8/10] GitHub Repository
echo "[8/10] GitHub Repository 설정"
read -p "GitHub Repository를 생성하시겠습니까? (y/N): " CREATE_REPO
if [[ $CREATE_REPO =~ ^[Yy]$ ]]; then
    echo ""
    echo "📁 Git 초기화 중..."
    git init
    git add .
    git commit -m "🚀 Initial commit: Marketing Dashboard v2.0"
    
    echo ""
    echo "GitHub CLI로 Repository 생성 중..."
    gh repo create $REPO_NAME --private --source=. --remote=origin --push
    
    if [ $? -ne 0 ]; then
        echo ""
        echo -e "${YELLOW}⚠️  GitHub CLI 사용 불가${NC}"
        echo ""
        echo "수동으로 Repository를 생성하세요:"
        echo "  1. https://github.com/new 접속"
        echo "  2. Repository 이름: $REPO_NAME"
        echo "  3. Private 선택"
        echo "  4. 아래 명령어 실행:"
        echo ""
        echo "     git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
        echo "     git branch -M main"
        echo "     git push -u origin main"
        echo ""
    else
        echo -e "${GREEN}✅ GitHub Repository 생성 완료${NC}"
    fi
fi

echo ""
# [9/10] GitHub Secrets 안내
echo "[9/10] GitHub Secrets 설정 안내"
echo ""
echo "다음 Secrets를 GitHub에 등록하세요:"
echo ""
echo "📍 GitHub Repository → Settings → Secrets and variables → Actions"
echo ""
echo "1. GOOGLE_CREDENTIALS"
echo "   └ 값: Google Service Account JSON 전체 내용"
echo ""
echo "2. SHEET_ID"
echo "   └ 값: $SHEET_ID"
echo ""
echo "3. WORKSHEET_NAME (선택)"
echo "   └ 값: $WORKSHEET_NAME"
echo ""
echo "💡 JSON 내용 복사:"
echo "   cat $GOOGLE_JSON | pbcopy  # Mac"
echo "   cat $GOOGLE_JSON | xclip -selection clipboard  # Linux"
echo ""

read -p "Secrets 등록을 완료하셨습니까? (y/N): " SECRETS_DONE
if [[ $SECRETS_DONE =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✅ Secrets 등록 완료${NC}"
else
    echo -e "${YELLOW}⚠️  나중에 직접 등록하세요${NC}"
fi

echo ""
# [10/10] Vercel 배포
echo "[10/10] Vercel 배포"
read -p "Vercel에 배포하시겠습니까? (y/N): " DEPLOY_VERCEL
if [[ $DEPLOY_VERCEL =~ ^[Yy]$ ]]; then
    echo ""
    echo "📦 Vercel CLI 설치 확인..."
    if ! command -v vercel &> /dev/null; then
        echo "Vercel CLI를 설치합니다..."
        npm install -g vercel
    fi
    
    echo ""
    echo "🚀 Vercel 배포 시작..."
    cd react-app
    vercel
    
    echo ""
    echo -e "${GREEN}✅ Vercel 배포 완료${NC}"
    echo ""
    echo "💡 환경변수 설정:"
    echo "   1. Vercel Dashboard 접속"
    echo "   2. 프로젝트 선택"
    echo "   3. Settings → Environment Variables"
    echo "   4. NEXT_PUBLIC_DATA_URL 추가:"
    echo "      https://raw.githubusercontent.com/$GITHUB_USERNAME/$REPO_NAME/main/data"
    cd ..
fi

echo ""
# 완료
echo "================================================================================"
echo "✅ 설치 완료!"
echo "================================================================================"
echo ""
echo "📁 생성된 파일:"
echo "   ├ config.json (설정 파일)"
echo "   ├ react-app/.env.local (환경변수)"
echo "   └ data/ (데이터 디렉토리)"
echo ""
echo "📚 다음 단계:"
echo "   1. GitHub Actions 활성화"
echo "      └ GitHub Repository → Actions → Enable workflow"
echo ""
echo "   2. 스케줄 확인"
echo "      └ 매일 오전 10:30 (KST) 자동 실행"
echo ""
echo "   3. 대시보드 확인"
echo "      └ Vercel URL 또는 localhost:3000"
echo ""
echo "🎉 데이터 기반 마케팅 의사결정을 시작하세요!"
echo ""
