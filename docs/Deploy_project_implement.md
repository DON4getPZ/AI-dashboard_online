# Marketing Dashboard 구현 가이드

**버전**: 1.1.0
**작성일**: 2025-01-05
**목적**: 단계별 구현 코드 및 파일 작성 가이드

> **아키텍처 흐름**: [1] .bat 트리거 → Python ETL → [2] Git Commit + Push → [3] GitHub Actions → Next.js 빌드 → [4] Vercel → React 앱 서빙

---

## 목차

1. [1단계: 환경 설정](#1단계-환경-설정)
2. [2단계: Python 스크립트 수정](#2단계-python-스크립트-수정)
3. [3단계: Next.js 프로젝트 구축](#3단계-nextjs-프로젝트-구축)
4. [4단계: React 컴포넌트 개발](#4단계-react-컴포넌트-개발)
5. [5단계: 배포 스크립트 작성](#5단계-배포-스크립트-작성) *(Git Commit + Push)*
6. [6단계: Vercel 및 Cloudflare 설정](#6단계-vercel-및-cloudflare-설정)
7. [7단계: 테스트 및 검증](#7단계-테스트-및-검증)
8. [8단계: GitHub Actions CI/CD 설정](#8단계-github-actions-cicd-설정) *(자동 빌드 및 배포)*
9. [9단계: 데이터 백업 구성](#9단계-데이터-백업-구성)

---

## 1단계: 환경 설정

### 1.1 Next.js 프로젝트 생성

```bash
# 프로젝트 루트에서 실행
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**선택 옵션:**
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: Yes
- App Router: Yes
- Import alias: @/*

### 1.2 필요 패키지 설치

```bash
# 차트 라이브러리
npm install recharts

# 또는 Plotly 사용 시
npm install react-plotly.js plotly.js

# 유틸리티
npm install date-fns
npm install clsx tailwind-merge

# shadcn/ui 의존성
npm install @radix-ui/react-slot
npm install class-variance-authority
npm install lucide-react
npm install tailwindcss-animate
```

### 1.2.1 shadcn/ui 초기화

```bash
# shadcn/ui CLI 설정
npx shadcn@latest init

# 기본 컴포넌트 추가
npx shadcn@latest add button
npx shadcn@latest add card
```

**components.json** (shadcn/ui 설정):
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### 1.3 package.json 확인

**파일**: `package.json`

```json
{
  "name": "marketing-dashboard",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "react-dom": "18.x",
    "recharts": "^2.x",
    "date-fns": "^3.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "@radix-ui/react-slot": "^1.x",
    "class-variance-authority": "^0.7.x",
    "lucide-react": "^0.x",
    "tailwindcss-animate": "^1.x"
  },
  "devDependencies": {
    "@types/node": "^20.x",
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "typescript": "^5.x",
    "tailwindcss": "^3.x",
    "postcss": "^8.x",
    "autoprefixer": "^10.x",
    "eslint": "^8.x",
    "eslint-config-next": "14.x"
  }
}
```

### 1.3.1 tailwind.config.js (Berry Theme 통합)

**파일**: `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Berry Theme Primary
        primary: {
          DEFAULT: '#673ab7',
          main: '#673ab7',
          light: '#ede7f6',
          dark: '#5e35b1',
        },
        // Berry Theme Secondary
        secondary: {
          DEFAULT: '#2196f3',
          main: '#2196f3',
          light: '#e3f2fd',
          dark: '#1976d2',
        },
        // 상태 색상
        success: { main: '#00c853', light: '#b9f6ca' },
        warning: { main: '#ffab00', light: '#ffecb3' },
        error: { main: '#ff1744', light: '#ff8a80' },
        info: { main: '#00b0ff', light: '#80d8ff' },
        // 배경 및 텍스트
        background: '#f8fafc',
        paper: '#ffffff',
        'text-primary': '#212121',
        'text-secondary': '#757575',
        // 사이드바
        sidebar: {
          bg: '#1e1e2d',
          hover: '#2a2a3d',
          active: '#673ab7',
        },
      },
      boxShadow: {
        'card': '0 2px 14px 0 rgba(32, 40, 45, 0.08)',
        'card-hover': '0 4px 20px 0 rgba(32, 40, 45, 0.12)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

### 1.4 config/clients.json 생성

**파일**: `config/clients.json`

```json
{
  "clients": [
    {
      "id": "clientA",
      "name": "A 회사",
      "subdomain": "clienta",
      "sheets": {
        "raw": {
          "sheetId": "1ABC_YOUR_SHEET_ID_HERE",
          "worksheet": "data_integration"
        },
        "multi": {
          "sheetId": "1DEF_YOUR_SHEET_ID_HERE",
          "worksheets": ["meta_ads", "google_ads", "kakao_moment"]
        },
        "creative": {
          "sheetId": "1GHI_YOUR_SHEET_ID_HERE",
          "worksheet": "creative_data"
        },
        "creativeUrl": {
          "sheetId": "1JKL_YOUR_SHEET_ID_HERE",
          "worksheet": "creative_url"
        },
        "ga4": {
          "sheetId": "1MNO_YOUR_SHEET_ID_HERE",
          "worksheet": "ga4_funnel"
        }
      },
      "accessPolicy": {
        "allowedDomains": ["clienta.com"],
        "allowedEmails": ["external.user@gmail.com"]
      }
    },
    {
      "id": "clientB",
      "name": "B 회사",
      "subdomain": "clientb",
      "sheets": {
        "raw": {
          "sheetId": "2ABC_YOUR_SHEET_ID_HERE",
          "worksheet": "data_integration"
        }
      },
      "accessPolicy": {
        "allowedDomains": ["clientb.co.kr"],
        "allowedEmails": []
      }
    }
  ],
  "defaults": {
    "timezone": "Asia/Seoul",
    "currency": "KRW",
    "dateFormat": "YYYY-MM-DD",
    "forecastDays": 90
  }
}
```

### 1.5 .gitignore 업데이트

**파일**: `.gitignore`

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Build
.next/
out/
build/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Google Credentials (민감!)
config/google-credentials.json
*.credentials.json

# Client Data (용량 큼)
data/
public/data/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Vercel
.vercel
```

### 1.6 vercel.json 생성

**파일**: `vercel.json`

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "rewrites": [
    {
      "source": "/data/:client/:path*",
      "destination": "/data/:client/:path*"
    }
  ],
  "headers": [
    {
      "source": "/data/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600, stale-while-revalidate=86400"
        }
      ]
    }
  ]
}
```

---

## 2단계: Python 스크립트 수정

### 2.1 공통 모듈 생성

**파일**: `scripts/common/__init__.py`

```python
"""
공통 모듈 패키지
"""
from .paths import ClientPaths, get_client_config, get_all_client_ids

__all__ = ['ClientPaths', 'get_client_config', 'get_all_client_ids']
```

**파일**: `scripts/common/paths.py`

```python
"""
클라이언트별 경로 관리 유틸리티

사용 예시:
    from common.paths import ClientPaths, get_client_config

    paths = ClientPaths('clientA').ensure_dirs()
    config = get_client_config('clientA')

    df.to_csv(paths.raw_data, index=False)
"""
import json
import sys
from pathlib import Path
from typing import Dict, List, Optional

# 프로젝트 루트 경로 설정
PROJECT_ROOT = Path(__file__).parent.parent.parent
CONFIG_PATH = PROJECT_ROOT / 'config' / 'clients.json'


class ClientPaths:
    """클라이언트별 데이터 경로 관리"""

    def __init__(self, client_id: str):
        self.client_id = client_id
        self.base = PROJECT_ROOT / 'data' / client_id

        # 입력 데이터 디렉토리
        self.raw = self.base / 'raw'
        self.type = self.base / 'type'
        self.creative = self.base / 'creative'
        self.ga4 = self.base / 'GA4'

        # 분석 결과 디렉토리
        self.forecast = self.base / 'forecast'
        self.funnel = self.base / 'funnel'
        self.statistics = self.base / 'statistics'
        self.visualizations = self.base / 'visualizations'

        # JSON 출력 디렉토리 (Next.js public)
        self.json_output = PROJECT_ROOT / 'public' / 'data' / client_id

    def ensure_dirs(self) -> 'ClientPaths':
        """모든 디렉토리 생성"""
        dirs = [
            self.raw, self.type, self.creative, self.ga4,
            self.forecast, self.funnel, self.statistics,
            self.visualizations, self.json_output
        ]
        for dir_path in dirs:
            dir_path.mkdir(parents=True, exist_ok=True)
        return self

    # === 자주 사용하는 파일 경로 (프로퍼티) ===

    # 1단계: 수집 결과
    @property
    def raw_data(self) -> Path:
        """광고 성과 원본 데이터"""
        return self.raw / 'raw_data.csv'

    @property
    def merged_data(self) -> Path:
        """채널별 통합 데이터"""
        return self.type / 'merged_data.csv'

    @property
    def creative_data(self) -> Path:
        """크리에이티브 성과 데이터"""
        return self.creative / 'creative_data.csv'

    @property
    def creative_url_data(self) -> Path:
        """크리에이티브 URL 데이터"""
        return self.creative / 'creative_url.csv'

    # 2단계: 분석 결과
    @property
    def predictions_daily(self) -> Path:
        """일별 예측 데이터"""
        return self.forecast / 'predictions_daily.csv'

    @property
    def predictions_weekly(self) -> Path:
        """주별 예측 데이터"""
        return self.forecast / 'predictions_weekly.csv'

    @property
    def predictions_monthly(self) -> Path:
        """월별 예측 데이터"""
        return self.forecast / 'predictions_monthly.csv'

    @property
    def forecast_insights(self) -> Path:
        """예측 인사이트"""
        return self.forecast / 'insights.json'

    @property
    def daily_funnel(self) -> Path:
        """일별 퍼널 데이터"""
        return self.funnel / 'daily_funnel.csv'

    @property
    def channel_funnel(self) -> Path:
        """채널별 퍼널 데이터"""
        return self.funnel / 'channel_funnel.csv'

    @property
    def funnel_insights(self) -> Path:
        """퍼널 인사이트"""
        return self.funnel / 'insights.json'

    @property
    def type_insights(self) -> Path:
        """타입별 인사이트"""
        return self.type / 'insights.json'

    # 3단계: JSON 출력
    def json_file(self, name: str) -> Path:
        """JSON 출력 파일 경로"""
        return self.json_output / f'{name}.json'


def get_client_config(client_id: str) -> Dict:
    """
    클라이언트 설정 로드

    Args:
        client_id: 클라이언트 ID

    Returns:
        클라이언트 설정 딕셔너리

    Raises:
        ValueError: 클라이언트를 찾을 수 없을 때
    """
    if not CONFIG_PATH.exists():
        raise FileNotFoundError(f"설정 파일 없음: {CONFIG_PATH}")

    config = json.loads(CONFIG_PATH.read_text(encoding='utf-8'))

    for client in config.get('clients', []):
        if client['id'] == client_id:
            # defaults 병합
            result = {**config.get('defaults', {}), **client}
            return result

    raise ValueError(f"클라이언트 '{client_id}'를 찾을 수 없음")


def get_all_client_ids() -> List[str]:
    """
    모든 클라이언트 ID 목록 반환

    Returns:
        클라이언트 ID 리스트
    """
    if not CONFIG_PATH.exists():
        raise FileNotFoundError(f"설정 파일 없음: {CONFIG_PATH}")

    config = json.loads(CONFIG_PATH.read_text(encoding='utf-8'))
    return [c['id'] for c in config.get('clients', [])]


def parse_client_arg() -> str:
    """
    커맨드라인에서 --client 인자 파싱

    Returns:
        클라이언트 ID

    Raises:
        SystemExit: --client 인자가 없을 때
    """
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--client', required=True, help='Client ID')
    args, _ = parser.parse_known_args()
    return args.client


# 모듈 직접 실행 시 테스트
if __name__ == '__main__':
    print("=== ClientPaths 테스트 ===")
    paths = ClientPaths('testClient')
    print(f"Base: {paths.base}")
    print(f"Raw data: {paths.raw_data}")
    print(f"JSON output: {paths.json_output}")

    print("\n=== 클라이언트 목록 ===")
    try:
        for cid in get_all_client_ids():
            print(f"  - {cid}")
    except FileNotFoundError as e:
        print(f"  (설정 파일 없음: {e})")
```

### 2.2 기존 스크립트 수정 예시

#### fetch_google_sheets.py 수정

**파일**: `scripts/fetch_google_sheets.py`

```python
"""
Google Sheets 데이터 수집 (클라이언트별)

사용법:
    python scripts/fetch_google_sheets.py --client clientA
"""
import sys
from pathlib import Path

# 프로젝트 루트를 path에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

import gspread
import pandas as pd
from google.oauth2.service_account import Credentials
from scripts.common.paths import ClientPaths, get_client_config, parse_client_arg

# Google API 스코프
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive.readonly'
]

# Credentials 경로
CREDENTIALS_PATH = Path(__file__).parent.parent / 'config' / 'google-credentials.json'


def fetch_raw_data(client_id: str) -> pd.DataFrame:
    """
    광고 성과 원본 데이터 수집

    Args:
        client_id: 클라이언트 ID

    Returns:
        수집된 DataFrame
    """
    print(f"[{client_id}] 광고 성과 데이터 수집 시작...")

    # 경로 및 설정 로드
    paths = ClientPaths(client_id).ensure_dirs()
    config = get_client_config(client_id)

    # Sheet 설정 확인
    sheet_config = config.get('sheets', {}).get('raw')
    if not sheet_config:
        print(f"[{client_id}] raw sheet 설정 없음, 건너뜀")
        return pd.DataFrame()

    # Google Sheets 인증
    if not CREDENTIALS_PATH.exists():
        raise FileNotFoundError(f"Credentials 파일 없음: {CREDENTIALS_PATH}")

    creds = Credentials.from_service_account_file(
        str(CREDENTIALS_PATH),
        scopes=SCOPES
    )
    gc = gspread.authorize(creds)

    # 데이터 수집
    try:
        spreadsheet = gc.open_by_key(sheet_config['sheetId'])
        worksheet = spreadsheet.worksheet(sheet_config['worksheet'])
        records = worksheet.get_all_records()

        df = pd.DataFrame(records)
        print(f"[{client_id}] 수집 완료: {len(df)} rows")

        # 저장
        df.to_csv(paths.raw_data, index=False, encoding='utf-8-sig')
        print(f"[{client_id}] 저장: {paths.raw_data}")

        return df

    except Exception as e:
        print(f"[{client_id}] 오류: {e}")
        raise


def main():
    """메인 실행"""
    client_id = parse_client_arg()
    fetch_raw_data(client_id)


if __name__ == '__main__':
    main()
```

#### process_marketing_data.py 수정

**파일**: `scripts/process_marketing_data.py`

```python
"""
마케팅 데이터 처리 + Prophet 예측 (클라이언트별)

사용법:
    python scripts/process_marketing_data.py --client clientA
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

from scripts.common.paths import ClientPaths, get_client_config, parse_client_arg

# Prophet import (설치 확인)
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    print("Warning: Prophet not installed. Forecasting disabled.")
    PROPHET_AVAILABLE = False


def load_data(paths: ClientPaths) -> pd.DataFrame:
    """데이터 로드"""
    if not paths.raw_data.exists():
        raise FileNotFoundError(f"입력 파일 없음: {paths.raw_data}")

    df = pd.read_csv(paths.raw_data)
    print(f"데이터 로드: {len(df)} rows")
    return df


def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    """데이터 전처리"""
    # 날짜 컬럼 변환
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'])

    # 숫자 컬럼 변환
    numeric_cols = ['cost', 'revenue', 'conversions', 'clicks', 'impressions']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    return df


def aggregate_daily(df: pd.DataFrame) -> pd.DataFrame:
    """일별 집계"""
    if 'date' not in df.columns:
        return pd.DataFrame()

    agg_cols = {
        'cost': 'sum',
        'revenue': 'sum',
        'conversions': 'sum',
        'clicks': 'sum',
        'impressions': 'sum'
    }

    # 존재하는 컬럼만 집계
    agg_cols = {k: v for k, v in agg_cols.items() if k in df.columns}

    daily = df.groupby('date').agg(agg_cols).reset_index()

    # 파생 지표 계산
    if 'revenue' in daily.columns and 'cost' in daily.columns:
        daily['roas'] = (daily['revenue'] / daily['cost'].replace(0, np.nan)).fillna(0)

    if 'cost' in daily.columns and 'conversions' in daily.columns:
        daily['cpa'] = (daily['cost'] / daily['conversions'].replace(0, np.nan)).fillna(0)

    if 'clicks' in daily.columns and 'impressions' in daily.columns:
        daily['ctr'] = (daily['clicks'] / daily['impressions'].replace(0, np.nan) * 100).fillna(0)

    return daily


def run_prophet_forecast(daily: pd.DataFrame, target_col: str = 'revenue',
                         periods: int = 90) -> pd.DataFrame:
    """Prophet 시계열 예측"""
    if not PROPHET_AVAILABLE:
        print("Prophet 미설치, 예측 건너뜀")
        return pd.DataFrame()

    if target_col not in daily.columns:
        print(f"타겟 컬럼 '{target_col}' 없음")
        return pd.DataFrame()

    # Prophet 데이터 준비
    prophet_df = daily[['date', target_col]].copy()
    prophet_df.columns = ['ds', 'y']
    prophet_df['ds'] = pd.to_datetime(prophet_df['ds'])

    # 음수 제거
    prophet_df['y'] = prophet_df['y'].clip(lower=0)

    print(f"Prophet 학습 중... (데이터: {len(prophet_df)} rows, 예측: {periods}일)")

    # 모델 학습
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False,
        seasonality_mode='multiplicative'
    )
    model.fit(prophet_df)

    # 미래 예측
    future = model.make_future_dataframe(periods=periods)
    forecast = model.predict(future)

    # 음수 방지
    forecast['yhat'] = forecast['yhat'].clip(lower=0)
    forecast['yhat_lower'] = forecast['yhat_lower'].clip(lower=0)
    forecast['yhat_upper'] = forecast['yhat_upper'].clip(lower=0)

    # 결과 컬럼 선택
    result = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper', 'trend',
                       'weekly', 'yearly']].copy()
    result.columns = ['date', 'predicted', 'lower', 'upper', 'trend',
                      'weekly_seasonality', 'yearly_seasonality']

    # 실제값 병합
    result = result.merge(
        prophet_df.rename(columns={'ds': 'date', 'y': 'actual'}),
        on='date',
        how='left'
    )

    return result


def process_client(client_id: str):
    """클라이언트 데이터 처리 메인"""
    print(f"\n{'='*50}")
    print(f"[{client_id}] 마케팅 데이터 처리 시작")
    print(f"{'='*50}")

    paths = ClientPaths(client_id).ensure_dirs()
    config = get_client_config(client_id)

    # 1. 데이터 로드
    df = load_data(paths)

    # 2. 전처리
    df = preprocess_data(df)

    # 3. 일별 집계
    daily = aggregate_daily(df)
    print(f"일별 집계: {len(daily)} days")

    # 4. Prophet 예측
    forecast_days = config.get('forecastDays', 90)
    forecast = run_prophet_forecast(daily, 'revenue', forecast_days)

    # 5. 저장
    if not daily.empty:
        daily.to_csv(paths.predictions_daily, index=False)
        print(f"저장: {paths.predictions_daily}")

    if not forecast.empty:
        forecast.to_csv(paths.forecast / 'prophet_forecast.csv', index=False)
        print(f"저장: {paths.forecast / 'prophet_forecast.csv'}")

    print(f"[{client_id}] 처리 완료!")


def main():
    client_id = parse_client_arg()
    process_client(client_id)


if __name__ == '__main__':
    main()
```

### 2.3 export_json.py 신규 작성

**파일**: `scripts/export_json.py`

```python
"""
CSV 분석 결과를 Next.js용 JSON으로 변환

사용법:
    python scripts/export_json.py --client clientA
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import json
import pandas as pd
from datetime import datetime
from typing import Any, Dict, List, Optional

from scripts.common.paths import ClientPaths, get_client_config, parse_client_arg


class JSONExporter:
    """CSV → JSON 변환기"""

    def __init__(self, client_id: str):
        self.client_id = client_id
        self.paths = ClientPaths(client_id).ensure_dirs()
        self.config = get_client_config(client_id)

    def export_all(self):
        """모든 데이터 내보내기"""
        print(f"\n[{self.client_id}] JSON 변환 시작...")

        self._export_kpi()
        self._export_forecast()
        self._export_funnel()
        self._export_creative()
        self._export_segments()
        self._export_dimensions()
        self._export_insights()
        self._export_meta()

        print(f"[{self.client_id}] JSON 변환 완료!")

    def _export_kpi(self):
        """KPI 요약 데이터"""
        kpi: Dict[str, Any] = {}

        # 일별 데이터
        if self.paths.predictions_daily.exists():
            df = pd.read_csv(self.paths.predictions_daily)
            kpi['daily'] = self._df_to_records(df)

            # 요약 통계
            kpi['summary'] = {
                'totalCost': float(df['cost'].sum()) if 'cost' in df else 0,
                'totalRevenue': float(df['revenue'].sum()) if 'revenue' in df else 0,
                'totalConversions': int(df['conversions'].sum()) if 'conversions' in df else 0,
                'avgROAS': float(df['revenue'].sum() / df['cost'].sum()) if df['cost'].sum() > 0 else 0,
                'avgCPA': float(df['cost'].sum() / df['conversions'].sum()) if df['conversions'].sum() > 0 else 0,
                'dataPoints': len(df),
                'dateRange': {
                    'start': str(df['date'].min()) if 'date' in df else None,
                    'end': str(df['date'].max()) if 'date' in df else None
                }
            }

        # 주별 데이터
        if self.paths.predictions_weekly.exists():
            df = pd.read_csv(self.paths.predictions_weekly)
            kpi['weekly'] = self._df_to_records(df)

        # 월별 데이터
        if self.paths.predictions_monthly.exists():
            df = pd.read_csv(self.paths.predictions_monthly)
            kpi['monthly'] = self._df_to_records(df)

        self._write_json('kpi.json', kpi)

    def _export_forecast(self):
        """Prophet 예측 데이터"""
        forecast: Dict[str, Any] = {'predictions': [], 'byMetric': {}}

        # Prophet 예측 결과
        prophet_file = self.paths.forecast / 'prophet_forecast.csv'
        if prophet_file.exists():
            df = pd.read_csv(prophet_file)
            forecast['predictions'] = self._df_to_records(df)

        # 지표별 예측
        for csv_file in self.paths.forecast.glob('prophet_*.csv'):
            if csv_file.name == 'prophet_forecast.csv':
                continue
            df = pd.read_csv(csv_file)
            metric_name = csv_file.stem.replace('prophet_', '')
            forecast['byMetric'][metric_name] = self._df_to_records(df)

        # type 폴더의 prophet 결과
        for csv_file in self.paths.type.glob('prophet_*.csv'):
            df = pd.read_csv(csv_file)
            metric_name = csv_file.stem.replace('prophet_', '')
            forecast['byMetric'][metric_name] = self._df_to_records(df)

        self._write_json('forecast.json', forecast)

    def _export_funnel(self):
        """퍼널 데이터"""
        funnel: Dict[str, Any] = {}

        # 일별 퍼널
        if self.paths.daily_funnel.exists():
            df = pd.read_csv(self.paths.daily_funnel)
            funnel['daily'] = self._df_to_records(df)

        # 채널별 퍼널
        if self.paths.channel_funnel.exists():
            df = pd.read_csv(self.paths.channel_funnel)
            funnel['channel'] = self._df_to_records(df)

        # 참여도 데이터
        engagement_file = self.paths.funnel / 'channel_engagement.csv'
        if engagement_file.exists():
            df = pd.read_csv(engagement_file)
            funnel['engagement'] = self._df_to_records(df)

        # 퍼널 인사이트
        if self.paths.funnel_insights.exists():
            funnel['insights'] = json.loads(
                self.paths.funnel_insights.read_text(encoding='utf-8')
            )

        self._write_json('funnel.json', funnel)

    def _export_creative(self):
        """크리에이티브 데이터"""
        creative: Dict[str, Any] = {}

        # 크리에이티브 폴더의 모든 CSV
        for csv_file in self.paths.creative.glob('*.csv'):
            df = pd.read_csv(csv_file)
            key = csv_file.stem
            creative[key] = self._df_to_records(df)

        self._write_json('creative.json', creative)

    def _export_segments(self):
        """세그먼트 분석 데이터"""
        segments: Dict[str, Any] = {}

        # segment_*.csv 파일들
        for csv_file in self.paths.forecast.glob('segment_*.csv'):
            df = pd.read_csv(csv_file)
            key = csv_file.stem.replace('segment_', '')
            segments[key] = self._df_to_records(df)

        self._write_json('segments.json', segments)

    def _export_dimensions(self):
        """차원 분석 데이터"""
        dimensions: Dict[str, Any] = {}

        # merged_data
        if self.paths.merged_data.exists():
            df = pd.read_csv(self.paths.merged_data)
            # 대용량 데이터는 요약만
            if len(df) > 10000:
                dimensions['merged_summary'] = {
                    'totalRows': len(df),
                    'columns': list(df.columns),
                    'sample': self._df_to_records(df.head(100))
                }
            else:
                dimensions['merged'] = self._df_to_records(df)

        # dimension_type*.csv
        for csv_file in self.paths.type.glob('dimension_type*.csv'):
            df = pd.read_csv(csv_file)
            key = csv_file.stem
            dimensions[key] = self._df_to_records(df)

        # analysis_*.csv
        for csv_file in self.paths.type.glob('analysis_*.csv'):
            df = pd.read_csv(csv_file)
            key = csv_file.stem
            dimensions[key] = self._df_to_records(df)

        self._write_json('dimensions.json', dimensions)

    def _export_insights(self):
        """인사이트 통합"""
        insights: Dict[str, Any] = {}

        insight_files = [
            ('forecast', self.paths.forecast_insights),
            ('funnel', self.paths.funnel_insights),
            ('type', self.paths.type_insights),
        ]

        for key, path in insight_files:
            if path.exists():
                try:
                    insights[key] = json.loads(path.read_text(encoding='utf-8'))
                except json.JSONDecodeError:
                    print(f"  Warning: {path} JSON 파싱 오류")

        self._write_json('insights.json', insights)

    def _export_meta(self):
        """메타데이터"""
        meta = {
            'clientId': self.client_id,
            'clientName': self.config.get('name', self.client_id),
            'lastUpdated': datetime.now().isoformat(),
            'timezone': self.config.get('timezone', 'Asia/Seoul'),
            'currency': self.config.get('currency', 'KRW'),
            'files': [f.name for f in self.paths.json_output.glob('*.json')],
            'version': '1.0.0'
        }
        self._write_json('meta.json', meta)

    def _df_to_records(self, df: pd.DataFrame) -> List[Dict]:
        """DataFrame을 JSON serializable 리스트로 변환"""
        # NaN을 None으로, datetime을 문자열로
        df = df.copy()
        for col in df.columns:
            if pd.api.types.is_datetime64_any_dtype(df[col]):
                df[col] = df[col].astype(str)

        return df.where(pd.notnull(df), None).to_dict(orient='records')

    def _write_json(self, filename: str, data: Any):
        """JSON 파일 쓰기"""
        path = self.paths.json_file(filename.replace('.json', ''))
        path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2, default=str),
            encoding='utf-8'
        )
        print(f"  → {path}")


def main():
    client_id = parse_client_arg()
    exporter = JSONExporter(client_id)
    exporter.export_all()


if __name__ == '__main__':
    main()
```

### 2.4 run_all_clients.py 신규 작성

**파일**: `scripts/run_all_clients.py`

```python
"""
모든 클라이언트 순차 처리

사용법:
    python scripts/run_all_clients.py
"""
import sys
import subprocess
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.common.paths import get_all_client_ids

# 실행할 스크립트 순서
PIPELINE_SCRIPTS = [
    # 1단계: 수집
    'fetch_google_sheets.py',
    'fetch_sheets_multi.py',
    'fetch_creative_sheets.py',
    'fetch_creative_url.py',
    'fetch_ga4_sheets.py',

    # 2단계: 분석
    'process_marketing_data.py',
    'segment_processor.py',
    'insight_generator.py',
    'generate_funnel_data.py',
    'generate_engagement_data.py',
    'run_multi_analysis.py',
    'multi_analysis_dimension_detail.py',
    'multi_analysis_prophet_forecast.py',
    'generate_type_insights.py',

    # 3단계: JSON 변환
    'export_json.py',
]


def run_script(script_name: str, client_id: str) -> bool:
    """
    스크립트 실행

    Returns:
        성공 여부
    """
    script_path = Path(__file__).parent / script_name

    if not script_path.exists():
        print(f"    ⚠️ 스크립트 없음: {script_name}")
        return True  # 없는 스크립트는 건너뜀

    cmd = [sys.executable, str(script_path), '--client', client_id]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=600  # 10분 타임아웃
        )

        if result.returncode != 0:
            print(f"    ❌ {script_name} 실패")
            if result.stderr:
                print(f"       Error: {result.stderr[:200]}")
            return False

        return True

    except subprocess.TimeoutExpired:
        print(f"    ⏰ {script_name} 타임아웃")
        return False
    except Exception as e:
        print(f"    ❌ {script_name} 예외: {e}")
        return False


def process_client(client_id: str) -> dict:
    """
    단일 클라이언트 처리

    Returns:
        {'success': int, 'failed': int, 'scripts': list}
    """
    print(f"\n{'='*60}")
    print(f"  [{client_id}] 파이프라인 시작")
    print(f"{'='*60}")

    results = {'success': 0, 'failed': 0, 'scripts': []}

    for script in PIPELINE_SCRIPTS:
        print(f"  [{client_id}] {script}...")
        success = run_script(script, client_id)

        if success:
            results['success'] += 1
            results['scripts'].append((script, 'success'))
        else:
            results['failed'] += 1
            results['scripts'].append((script, 'failed'))

    print(f"  [{client_id}] 완료: {results['success']} 성공, {results['failed']} 실패")
    return results


def main():
    """메인 실행"""
    print("="*60)
    print("  멀티 클라이언트 파이프라인")
    print("="*60)

    try:
        client_ids = get_all_client_ids()
    except FileNotFoundError as e:
        print(f"설정 파일 오류: {e}")
        sys.exit(1)

    print(f"총 {len(client_ids)}개 클라이언트 처리 예정")
    print(f"클라이언트: {', '.join(client_ids)}")

    all_results = {}

    for client_id in client_ids:
        all_results[client_id] = process_client(client_id)

    # 최종 요약
    print("\n" + "="*60)
    print("  최종 결과")
    print("="*60)

    total_success = 0
    total_failed = 0

    for client_id, results in all_results.items():
        status = "✅" if results['failed'] == 0 else "⚠️"
        print(f"  {status} {client_id}: {results['success']} 성공, {results['failed']} 실패")
        total_success += results['success']
        total_failed += results['failed']

    print(f"\n  총합: {total_success} 성공, {total_failed} 실패")

    # 실패가 있으면 exit code 1
    sys.exit(1 if total_failed > 0 else 0)


if __name__ == '__main__':
    main()
```

---

## 3단계: Next.js 프로젝트 구축

### 3.1 middleware.ts (서브도메인 라우팅)

**파일**: `src/middleware.ts`

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 유효한 클라이언트 목록 (config/clients.json과 동기화)
const VALID_CLIENTS = ['clientA', 'clientB', 'clientC']

// 개발 환경 서브도메인 매핑
const DEV_SUBDOMAIN_MAP: Record<string, string> = {
  'localhost': 'clientA',  // 기본값
  'clienta.localhost': 'clientA',
  'clientb.localhost': 'clientB',
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl

  // 정적 파일, API, _next 제외
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/data') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // 클라이언트 ID 추출
  let clientId: string | undefined

  // 개발 환경
  if (hostname.includes('localhost')) {
    clientId = DEV_SUBDOMAIN_MAP[hostname] || 'clientA'
  }
  // 프로덕션 환경: subdomain.dashboard.com
  else {
    const subdomain = hostname.split('.')[0].toLowerCase()
    clientId = VALID_CLIENTS.find(
      c => c.toLowerCase() === subdomain
    )
  }

  // 유효하지 않은 클라이언트
  if (!clientId) {
    return NextResponse.redirect(new URL('/404', request.url))
  }

  // 클라이언트 ID를 헤더에 주입
  const response = NextResponse.next()
  response.headers.set('x-client-id', clientId)

  // 쿠키에도 저장 (클라이언트 사이드 접근용)
  response.cookies.set('clientId', clientId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24  // 24시간
  })

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|data).*)',
  ],
}
```

### 3.2 lib/client.ts (클라이언트 컨텍스트)

**파일**: `src/lib/client.ts`

```typescript
import { headers, cookies } from 'next/headers'

/**
 * 서버 컴포넌트에서 클라이언트 ID 가져오기
 */
export function getClientId(): string {
  // 1. 헤더에서 확인 (middleware에서 설정)
  const headersList = headers()
  const clientIdFromHeader = headersList.get('x-client-id')
  if (clientIdFromHeader) {
    return clientIdFromHeader
  }

  // 2. 쿠키에서 확인
  const cookieStore = cookies()
  const clientIdFromCookie = cookieStore.get('clientId')?.value
  if (clientIdFromCookie) {
    return clientIdFromCookie
  }

  // 3. 기본값
  return 'default'
}

/**
 * 클라이언트 사이드에서 클라이언트 ID 가져오기
 */
export function getClientIdFromCookie(): string {
  if (typeof document === 'undefined') {
    return 'default'
  }

  const match = document.cookie.match(/clientId=([^;]+)/)
  return match ? match[1] : 'default'
}
```

### 3.3 lib/data.ts (데이터 Fetch 유틸)

**파일**: `src/lib/data.ts`

```typescript
import { getClientId } from './client'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || ''

/**
 * 클라이언트별 데이터 Fetch
 */
export async function fetchClientData<T>(
  dataType: 'kpi' | 'forecast' | 'funnel' | 'creative' | 'segments' | 'dimensions' | 'insights' | 'meta'
): Promise<T> {
  const clientId = getClientId()
  const url = `${BASE_URL}/data/${clientId}/${dataType}.json`

  const res = await fetch(url, {
    next: {
      revalidate: 3600  // 1시간 캐시
    }
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch ${dataType} for ${clientId}: ${res.status}`)
  }

  return res.json()
}

/**
 * 메타데이터 조회
 */
export async function fetchMeta(): Promise<MetaData> {
  return fetchClientData<MetaData>('meta')
}

/**
 * KPI 데이터 조회
 */
export async function fetchKPI(): Promise<KPIData> {
  return fetchClientData<KPIData>('kpi')
}

/**
 * 예측 데이터 조회
 */
export async function fetchForecast(): Promise<ForecastData> {
  return fetchClientData<ForecastData>('forecast')
}

/**
 * 퍼널 데이터 조회
 */
export async function fetchFunnel(): Promise<FunnelData> {
  return fetchClientData<FunnelData>('funnel')
}

// === 타입 정의 ===

export interface MetaData {
  clientId: string
  clientName: string
  lastUpdated: string
  timezone: string
  currency: string
  files: string[]
  version: string
}

export interface KPIData {
  daily?: DailyRecord[]
  weekly?: DailyRecord[]
  monthly?: DailyRecord[]
  summary?: {
    totalCost: number
    totalRevenue: number
    totalConversions: number
    avgROAS: number
    avgCPA: number
    dataPoints: number
    dateRange: {
      start: string | null
      end: string | null
    }
  }
}

export interface DailyRecord {
  date: string
  cost?: number
  revenue?: number
  conversions?: number
  clicks?: number
  impressions?: number
  roas?: number
  cpa?: number
  ctr?: number
}

export interface ForecastData {
  predictions: PredictionRecord[]
  byMetric: Record<string, PredictionRecord[]>
}

export interface PredictionRecord {
  date: string
  actual?: number
  predicted: number
  lower: number
  upper: number
  trend?: number
  weekly_seasonality?: number
  yearly_seasonality?: number
}

export interface FunnelData {
  daily?: FunnelRecord[]
  channel?: FunnelRecord[]
  engagement?: EngagementRecord[]
  insights?: Record<string, any>
}

export interface FunnelRecord {
  date?: string
  channel?: string
  stage: string
  users: number
  conversionRate: number
}

export interface EngagementRecord {
  channel: string
  sessions: number
  avgSessionDuration: number
  bounceRate: number
  pagesPerSession: number
}
```

### 3.4 lib/utils.ts (유틸리티)

**파일**: `src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Tailwind 클래스 병합
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 숫자 포맷 (통화)
 */
export function formatCurrency(value: number, currency: string = 'KRW'): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(value)
}

/**
 * 숫자 포맷 (일반)
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('ko-KR', {
    maximumFractionDigits: decimals
  }).format(value)
}

/**
 * 퍼센트 포맷
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * 날짜 포맷
 */
export function formatDate(dateString: string, format: 'short' | 'long' = 'short'): string {
  const date = new Date(dateString)

  if (format === 'short') {
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    })
  }

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * ROAS 색상 클래스
 */
export function getROASColor(roas: number): string {
  if (roas >= 3) return 'text-green-600'
  if (roas >= 2) return 'text-blue-600'
  if (roas >= 1) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * 변화율 계산
 */
export function calculateChange(current: number, previous: number): {
  value: number
  percent: number
  isPositive: boolean
} {
  const value = current - previous
  const percent = previous !== 0 ? (value / previous) * 100 : 0

  return {
    value,
    percent,
    isPositive: value >= 0
  }
}
```

---

## 4단계: React 컴포넌트 개발

### 4.1 레이아웃 (app/layout.tsx)

**파일**: `src/app/layout.tsx`

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from '@/components/Navigation'
import { fetchMeta } from '@/lib/data'

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  try {
    const meta = await fetchMeta()
    return {
      title: `${meta.clientName} 마케팅 대시보드`,
      description: '데이터 기반 그로스 마케팅 대시보드',
    }
  } catch {
    return {
      title: '마케팅 대시보드',
      description: '데이터 기반 그로스 마케팅 대시보드',
    }
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
```

### 4.2 메인 대시보드 (app/page.tsx)

**파일**: `src/app/page.tsx`

```tsx
import { Suspense } from 'react'
import { fetchKPI, fetchMeta } from '@/lib/data'
import { KPICards } from '@/components/Dashboard/KPICards'
import { TrendChart } from '@/components/Charts/TrendChart'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export const revalidate = 3600  // 1시간마다 재검증

export default async function DashboardPage() {
  const [kpi, meta] = await Promise.all([
    fetchKPI(),
    fetchMeta()
  ])

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <header>
        <h1 className="text-3xl font-bold text-gray-900">
          {meta.clientName} 대시보드
        </h1>
        <p className="text-gray-500 mt-1">
          마지막 업데이트: {new Date(meta.lastUpdated).toLocaleString('ko-KR')}
        </p>
      </header>

      {/* KPI 카드 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">핵심 지표</h2>
        <Suspense fallback={<LoadingSpinner />}>
          <KPICards summary={kpi.summary} />
        </Suspense>
      </section>

      {/* 트렌드 차트 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">일별 추이</h2>
        <Suspense fallback={<LoadingSpinner />}>
          <TrendChart data={kpi.daily || []} />
        </Suspense>
      </section>
    </div>
  )
}
```

### 4.3 KPI 카드 컴포넌트

**파일**: `src/components/Dashboard/KPICards.tsx`

```tsx
'use client'

import { formatCurrency, formatNumber, formatPercent, getROASColor } from '@/lib/utils'
import { KPIData } from '@/lib/data'

interface KPICardsProps {
  summary: KPIData['summary']
}

export function KPICards({ summary }: KPICardsProps) {
  if (!summary) {
    return <div className="text-gray-500">데이터 없음</div>
  }

  const cards = [
    {
      title: '총 광고비',
      value: formatCurrency(summary.totalCost),
      icon: '💰',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      title: '총 매출',
      value: formatCurrency(summary.totalRevenue),
      icon: '📈',
      color: 'bg-green-50 border-green-200'
    },
    {
      title: 'ROAS',
      value: `${summary.avgROAS.toFixed(2)}x`,
      icon: '🎯',
      color: 'bg-purple-50 border-purple-200',
      valueClass: getROASColor(summary.avgROAS)
    },
    {
      title: 'CPA',
      value: formatCurrency(summary.avgCPA),
      icon: '👤',
      color: 'bg-orange-50 border-orange-200'
    },
    {
      title: '총 전환수',
      value: formatNumber(summary.totalConversions),
      icon: '✅',
      color: 'bg-teal-50 border-teal-200'
    },
    {
      title: '데이터 기간',
      value: summary.dataPoints ? `${summary.dataPoints}일` : '-',
      icon: '📅',
      color: 'bg-gray-50 border-gray-200'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg border ${card.color}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{card.icon}</span>
          </div>
          <p className="text-sm text-gray-600">{card.title}</p>
          <p className={`text-xl font-bold ${card.valueClass || 'text-gray-900'}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}
```

### 4.4 트렌드 차트 컴포넌트

**파일**: `src/components/Charts/TrendChart.tsx`

```tsx
'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { formatDate, formatCurrency } from '@/lib/utils'
import { DailyRecord } from '@/lib/data'

interface TrendChartProps {
  data: DailyRecord[]
}

export function TrendChart({ data }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">데이터 없음</p>
      </div>
    )
  }

  // 최근 90일만 표시
  const recentData = data.slice(-90)

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={recentData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatDate(value)}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={(value) => `₩${(value / 1000000).toFixed(0)}M`}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(value) => `${value.toFixed(1)}x`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            labelFormatter={(value) => formatDate(value, 'long')}
            formatter={(value: number, name: string) => {
              if (name === 'roas') return [`${value.toFixed(2)}x`, 'ROAS']
              return [formatCurrency(value), name === 'cost' ? '광고비' : '매출']
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="cost"
            stroke="#3B82F6"
            name="광고비"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="revenue"
            stroke="#10B981"
            name="매출"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="roas"
            stroke="#8B5CF6"
            name="ROAS"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### 4.5 네비게이션 컴포넌트

**파일**: `src/components/Navigation/index.tsx`

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: '대시보드', icon: '📊' },
  { href: '/forecast', label: 'AI 예측', icon: '🔮' },
  { href: '/funnel', label: '퍼널 분석', icon: '📉' },
  { href: '/creative', label: '크리에이티브', icon: '🎨' },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">📈</span>
            <span className="font-bold text-xl">Marketing Dashboard</span>
          </Link>

          {/* 네비게이션 링크 */}
          <div className="flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
```

### 4.6 예측 페이지

**파일**: `src/app/forecast/page.tsx`

```tsx
import { Suspense } from 'react'
import { fetchForecast } from '@/lib/data'
import { ForecastChart } from '@/components/Charts/ForecastChart'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export const revalidate = 3600

export default async function ForecastPage() {
  const forecast = await fetchForecast()

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">AI 예측</h1>
        <p className="text-gray-500 mt-1">
          Prophet 기반 90일 시계열 예측
        </p>
      </header>

      <section>
        <h2 className="text-xl font-semibold mb-4">매출 예측</h2>
        <Suspense fallback={<LoadingSpinner />}>
          <ForecastChart data={forecast.predictions} />
        </Suspense>
      </section>
    </div>
  )
}
```

### 4.7 예측 차트 컴포넌트

**파일**: `src/components/Charts/ForecastChart.tsx`

```tsx
'use client'

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { formatDate, formatCurrency } from '@/lib/utils'
import { PredictionRecord } from '@/lib/data'

interface ForecastChartProps {
  data: PredictionRecord[]
}

export function ForecastChart({ data }: ForecastChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">예측 데이터 없음</p>
      </div>
    )
  }

  // 신뢰구간 데이터 준비
  const chartData = data.map(d => ({
    ...d,
    confidenceRange: [d.lower, d.upper]
  }))

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <ResponsiveContainer width="100%" height={500}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatDate(value)}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={(value) => `₩${(value / 1000000).toFixed(0)}M`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            labelFormatter={(value) => formatDate(value, 'long')}
            formatter={(value: number, name: string) => {
              if (name === 'actual') return [formatCurrency(value), '실제']
              if (name === 'predicted') return [formatCurrency(value), '예측']
              return [formatCurrency(value), name]
            }}
          />
          <Legend />

          {/* 신뢰구간 영역 */}
          <Area
            type="monotone"
            dataKey="confidenceRange"
            fill="#3B82F6"
            fillOpacity={0.1}
            stroke="none"
            name="95% 신뢰구간"
          />

          {/* 실제값 */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#10B981"
            name="실제"
            strokeWidth={2}
            dot={false}
          />

          {/* 예측값 */}
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#3B82F6"
            name="예측"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### 4.8 로딩 컴포넌트

**파일**: `src/components/LoadingSpinner.tsx`

```tsx
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
}
```

---

## 5단계: 배포 스크립트 작성

### 5.1 단일 클라이언트 배포

**파일**: `deploy.bat`

```batch
@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║           마케팅 대시보드 배포 스크립트                         ║
echo ║           %date% %time%                                        ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

:: 클라이언트 ID 확인
set CLIENT_ID=%1
if "%CLIENT_ID%"=="" (
    echo [ERROR] 클라이언트 ID가 필요합니다.
    echo.
    echo 사용법: deploy.bat [clientId]
    echo 예시:   deploy.bat clientA
    echo.
    echo 전체 클라이언트 배포: deploy_all.bat
    exit /b 1
)

echo [클라이언트: %CLIENT_ID%]
echo.

:: ═══════════════════════════════════════════════════════════════════
:: 1단계: 데이터 수집
:: ═══════════════════════════════════════════════════════════════════
echo ┌────────────────────────────────────────────────────────────────┐
echo │ 1단계: 데이터 수집                                             │
echo └────────────────────────────────────────────────────────────────┘

echo   [1/5] 광고 성과 데이터...
python scripts/fetch_google_sheets.py --client %CLIENT_ID%
if %errorlevel% neq 0 (
    echo   [ERROR] fetch_google_sheets.py 실패
    exit /b 1
)

echo   [2/5] 멀티채널 데이터...
python scripts/fetch_sheets_multi.py --client %CLIENT_ID%
if %errorlevel% neq 0 echo   [WARN] fetch_sheets_multi.py 실패 (계속 진행)

echo   [3/5] 크리에이티브 데이터...
python scripts/fetch_creative_sheets.py --client %CLIENT_ID%
if %errorlevel% neq 0 echo   [WARN] fetch_creative_sheets.py 실패 (계속 진행)

echo   [4/5] 크리에이티브 URL...
python scripts/fetch_creative_url.py --client %CLIENT_ID%
if %errorlevel% neq 0 echo   [WARN] fetch_creative_url.py 실패 (계속 진행)

echo   [5/5] GA4 퍼널 데이터...
python scripts/fetch_ga4_sheets.py --client %CLIENT_ID%
if %errorlevel% neq 0 echo   [WARN] fetch_ga4_sheets.py 실패 (계속 진행)

echo.
echo   ✓ 1단계 완료
echo.

:: ═══════════════════════════════════════════════════════════════════
:: 2단계: 데이터 분석
:: ═══════════════════════════════════════════════════════════════════
echo ┌────────────────────────────────────────────────────────────────┐
echo │ 2단계: 데이터 분석                                             │
echo └────────────────────────────────────────────────────────────────┘

echo   [1/10] 마케팅 데이터 처리 + Prophet...
python scripts/process_marketing_data.py --client %CLIENT_ID%
if %errorlevel% neq 0 echo   [WARN] process_marketing_data.py 실패

echo   [2/10] 세그먼트 분석...
python scripts/segment_processor.py --client %CLIENT_ID%
if %errorlevel% neq 0 echo   [WARN] segment_processor.py 실패

echo   [3/10] 인사이트 생성...
python scripts/insight_generator.py --client %CLIENT_ID%
if %errorlevel% neq 0 echo   [WARN] insight_generator.py 실패

echo   [4/10] 시각화 생성...
python scripts/visualization_generator.py --client %CLIENT_ID%
if %errorlevel% neq 0 echo   [WARN] visualization_generator.py 실패

echo   [5/10] 퍼널 데이터...
python scripts/generate_funnel_data.py --client %CLIENT_ID%
if %errorlevel% neq 0 echo   [WARN] generate_funnel_data.py 실패

echo   [6/10] 참여도 분석...
python scripts/generate_engagement_data.py --client %CLIENT_ID%
if %errorlevel% neq 0 echo   [WARN] generate_engagement_data.py 실패

echo   [7/10] 멀티채널 분석...
python scripts/run_multi_analysis.py --client %CLIENT_ID%
if %errorlevel% neq 0 echo   [WARN] run_multi_analysis.py 실패

echo   [8/10] 차원별 분석...
python scripts/multi_analysis_dimension_detail.py --client %CLIENT_ID%
if %errorlevel% neq 0 echo   [WARN] multi_analysis_dimension_detail.py 실패

echo   [9/10] 채널별 Prophet...
python scripts/multi_analysis_prophet_forecast.py --client %CLIENT_ID%
if %errorlevel% neq 0 echo   [WARN] multi_analysis_prophet_forecast.py 실패

echo   [10/10] 타입별 인사이트...
python scripts/generate_type_insights.py --client %CLIENT_ID%
if %errorlevel% neq 0 echo   [WARN] generate_type_insights.py 실패

echo.
echo   ✓ 2단계 완료
echo.

:: ═══════════════════════════════════════════════════════════════════
:: 3단계: JSON 변환
:: ═══════════════════════════════════════════════════════════════════
echo ┌────────────────────────────────────────────────────────────────┐
echo │ 3단계: JSON 변환                                               │
echo └────────────────────────────────────────────────────────────────┘

echo   CSV → JSON 변환...
python scripts/export_json.py --client %CLIENT_ID%
if %errorlevel% neq 0 (
    echo   [ERROR] export_json.py 실패
    exit /b 1
)

echo.
echo   ✓ 3단계 완료
echo.

:: ═══════════════════════════════════════════════════════════════════
:: 4단계: Git Commit + Push (GitHub Actions 트리거)
:: ═══════════════════════════════════════════════════════════════════
echo ┌────────────────────────────────────────────────────────────────┐
echo │ 4단계: Git Commit + Push                                       │
echo └────────────────────────────────────────────────────────────────┘

echo   Git 변경사항 커밋 중...
git add public/data/%CLIENT_ID%/
git commit -m "data: %CLIENT_ID% 데이터 업데이트 %date%"
if %errorlevel% neq 0 (
    echo   [WARN] 커밋할 변경사항 없음
)

echo   Git Push 중... (GitHub Actions 자동 배포 트리거)
git push origin main
if %errorlevel% neq 0 (
    echo   [ERROR] Git Push 실패
    exit /b 1
)

echo.
echo   ✓ 4단계 완료 (GitHub Actions에서 Next.js 빌드 및 Vercel 배포 진행)
echo.

:: ═══════════════════════════════════════════════════════════════════
:: 완료
:: ═══════════════════════════════════════════════════════════════════
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                        로컬 처리 완료!                          ║
echo ╠════════════════════════════════════════════════════════════════╣
echo ║  클라이언트: %CLIENT_ID%
echo ║  JSON 경로:  public/data/%CLIENT_ID%/
echo ║  완료 시간:  %time%
echo ║  다음 단계:  GitHub Actions → Next.js 빌드 → Vercel 배포
echo ╚════════════════════════════════════════════════════════════════╝

endlocal
```

### 5.2 전체 클라이언트 배포

**파일**: `deploy_all.bat`

```batch
@echo off
chcp 65001 > nul

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║           전체 클라이언트 배포                                  ║
echo ║           %date% %time%                                        ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

:: 모든 클라이언트 처리
echo [1/2] 모든 클라이언트 데이터 처리...
python scripts/run_all_clients.py
if %errorlevel% neq 0 (
    echo [WARN] 일부 클라이언트 처리 실패
)

:: Git Commit + Push (GitHub Actions 트리거)
echo.
echo [2/2] Git Commit + Push...
git add public/data/
git commit -m "data: 전체 클라이언트 데이터 업데이트 %date%"
git push origin main
if %errorlevel% neq 0 (
    echo [ERROR] Git Push 실패
    exit /b 1
)

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    로컬 처리 완료!                              ║
echo ║        GitHub Actions에서 Next.js 빌드 및 Vercel 배포 진행      ║
echo ╚════════════════════════════════════════════════════════════════╝
```

### 5.3 스케줄러 등록

**파일**: `scheduler_register.bat`

```batch
@echo off
echo Windows 작업 스케줄러에 자동 배포 등록

:: 매일 오전 9시 실행
schtasks /create /tn "MarketingDashboard_DailyDeploy" /tr "%~dp0deploy_all.bat" /sc daily /st 09:00 /f

echo.
echo 등록 완료: 매일 09:00 자동 실행
echo.
echo 확인: schtasks /query /tn "MarketingDashboard_DailyDeploy"
echo 삭제: schtasks /delete /tn "MarketingDashboard_DailyDeploy" /f
```

---

## 6단계: Vercel 및 Cloudflare 설정

### 6.1 Vercel 설정

#### CLI 설치 및 로그인

```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login
```

#### 프로젝트 연결

```bash
# 프로젝트 루트에서 실행
vercel link
```

#### 도메인 설정 (Vercel Dashboard)

```
1. Vercel Dashboard → Settings → Domains

2. 도메인 추가:
   - dashboard.yourdomain.com (메인)
   - clienta.dashboard.yourdomain.com
   - clientb.dashboard.yourdomain.com
   - *.dashboard.yourdomain.com (와일드카드)

3. DNS 설정:
   - CNAME: dashboard → cname.vercel-dns.com
   - CNAME: *.dashboard → cname.vercel-dns.com
```

### 6.2 Cloudflare Access 설정

#### 1. Cloudflare 계정 설정

```
1. https://dash.cloudflare.com 접속
2. 도메인 추가 (dashboard.yourdomain.com)
3. DNS를 Cloudflare로 이전
```

#### 2. Zero Trust 설정

```
1. https://one.dash.cloudflare.com 접속
2. Access → Applications → Add Application
3. Self-hosted 선택
```

#### 3. Application 생성 (클라이언트별)

**Client A Application:**
```yaml
Application name: Client A Dashboard
Application domain: clienta.dashboard.yourdomain.com
Session duration: 24 hours

Policy name: Allow Client A Users
Action: Allow

Include rules:
  - Emails ending in: @clienta.com
  - Email: external.user@gmail.com  # 외부 사용자
```

**Client B Application:**
```yaml
Application name: Client B Dashboard
Application domain: clientb.dashboard.yourdomain.com
Session duration: 24 hours

Policy name: Allow Client B Users
Action: Allow

Include rules:
  - Emails ending in: @clientb.co.kr
```

### 6.3 환경 변수 설정

**파일**: `.env.local` (로컬 개발용)

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Vercel 환경 변수** (Dashboard → Settings → Environment Variables)

```
NEXT_PUBLIC_BASE_URL=https://dashboard.yourdomain.com
```

---

## 7단계: 테스트 및 검증

### 7.1 단위 테스트

#### Python 스크립트 테스트

```bash
# common/paths.py 테스트
python scripts/common/paths.py

# 단일 클라이언트 테스트
python scripts/fetch_google_sheets.py --client clientA
python scripts/process_marketing_data.py --client clientA
python scripts/export_json.py --client clientA
```

#### Next.js 테스트

```bash
# 개발 서버 실행
npm run dev

# 빌드 테스트
npm run build

# 린트 검사
npm run lint
```

### 7.2 통합 테스트

```bash
# 전체 파이프라인 테스트 (단일 클라이언트)
deploy.bat clientA

# JSON 생성 확인
dir public\data\clientA\

# 로컬에서 확인
npm run dev
# http://localhost:3000 접속
```

### 7.3 검증 체크리스트

```
□ Python 스크립트
  □ --client 파라미터 동작
  □ data/{clientId}/ 폴더 생성
  □ 모든 CSV 파일 생성
  □ export_json.py 정상 실행

□ Next.js
  □ npm run build 성공
  □ 대시보드 페이지 렌더링
  □ 차트 데이터 표시
  □ 네비게이션 동작

□ 배포
  □ git push → GitHub Actions 트리거 성공
  □ GitHub Actions → Next.js 빌드 성공
  □ Vercel 자동 배포 성공
  □ 서브도메인 접근 가능
  □ Cloudflare Access 인증 동작

□ 데이터
  □ JSON 파일 크기 적정 (<10MB)
  □ 데이터 정합성 확인
  □ 날짜 범위 정확
```

### 7.4 예상 결과물

```
배포 완료 후 구조:

public/data/
├── clientA/
│   ├── kpi.json          (~500KB)
│   ├── forecast.json     (~200KB)
│   ├── funnel.json       (~100KB)
│   ├── creative.json     (~300KB)
│   ├── segments.json     (~200KB)
│   ├── dimensions.json   (~1MB)
│   ├── insights.json     (~50KB)
│   └── meta.json         (~1KB)
│
└── clientB/
    └── (동일 구조)

접근 URL:
- https://clienta.dashboard.yourdomain.com → Client A 대시보드
- https://clientb.dashboard.yourdomain.com → Client B 대시보드
```

---

## 8단계: GitHub Actions CI/CD 설정

> **핵심 역할**: Git Push 시 자동으로 Next.js 빌드 및 Vercel 배포 수행

로컬에서 데이터 분석 후 Git Push하면 자동으로 빌드/배포되는 메인 CI/CD 파이프라인입니다.

### 8.1 GitHub Actions Workflow 파일

**파일**: `.github/workflows/daily-deploy.yml`

```yaml
name: Dashboard Build & Deploy

on:
  # 메인 CI/CD: Git Push 시 자동 빌드/배포
  push:
    branches: [main]
    paths:
      - 'public/data/**'      # 데이터 변경 시
      - 'src/**'              # 소스 변경 시
      - 'package.json'        # 의존성 변경 시

  # 백업: 스케줄 실행 (선택적)
  schedule:
    # UTC 00:00 = KST 09:00
    - cron: '0 0 * * *'

  # 수동 실행
  workflow_dispatch:
    inputs:
      client_id:
        description: '특정 클라이언트만 실행 (비우면 전체)'
        required: false
        default: ''
      run_etl:
        description: 'Python ETL 실행 여부'
        required: false
        default: 'false'
        type: choice
        options:
          - 'false'
          - 'true'

env:
  PYTHON_VERSION: '3.10'

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      # Python ETL (스케줄 실행 또는 수동 요청 시에만)
      - name: Setup Python
        if: ${{ github.event_name == 'schedule' || github.event.inputs.run_etl == 'true' }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'

      - name: Install Python dependencies
        if: ${{ github.event_name == 'schedule' || github.event.inputs.run_etl == 'true' }}
        run: |
          pip install --upgrade pip
          pip install -r requirements.txt

      - name: Setup Google Credentials
        if: ${{ github.event_name == 'schedule' || github.event.inputs.run_etl == 'true' }}
        run: |
          echo '${{ secrets.GOOGLE_CREDENTIALS }}' > config/google-credentials.json

      - name: Run pipeline (all clients)
        if: ${{ (github.event_name == 'schedule' || github.event.inputs.run_etl == 'true') && github.event.inputs.client_id == '' }}
        run: python scripts/run_all_clients.py

      - name: Run pipeline (specific client)
        if: ${{ github.event.inputs.run_etl == 'true' && github.event.inputs.client_id != '' }}
        run: |
          python scripts/fetch_google_sheets.py --client ${{ github.event.inputs.client_id }}
          python scripts/process_marketing_data.py --client ${{ github.event.inputs.client_id }}
          python scripts/export_json.py --client ${{ github.event.inputs.client_id }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Vercel CLI
        run: npm install -g vercel

      - name: Deploy to Vercel
        run: vercel deploy --prod --yes --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Notify on failure
        if: failure()
        run: |
          echo "::error::배포 파이프라인 실패"
          # 슬랙/이메일 알림 추가 가능
```

### 8.2 GitHub Secrets 설정

GitHub 레포지토리 Settings → Secrets and variables → Actions에서 다음 시크릿 추가:

| Secret Name | 설명 | 획득 방법 |
|------------|------|----------|
| `GOOGLE_CREDENTIALS` | Service Account JSON 전체 내용 | Google Cloud Console |
| `VERCEL_TOKEN` | Vercel API 토큰 | Vercel Dashboard → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel 조직 ID | `.vercel/project.json` 참조 |
| `VERCEL_PROJECT_ID` | Vercel 프로젝트 ID | `.vercel/project.json` 참조 |

### 8.3 Vercel 프로젝트 연결

```bash
# 로컬에서 Vercel 연결 후 .vercel/project.json 확인
vercel link

# project.json 예시
{
  "orgId": "team_xxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxx"
}
```

### 8.4 수동 실행

```bash
# GitHub CLI로 수동 트리거
gh workflow run daily-deploy.yml

# 특정 클라이언트만 실행
gh workflow run daily-deploy.yml -f client_id=clientA
```

### 8.5 Prophet 빌드 시간 최적화

GitHub Actions에서 Prophet 설치는 시간이 오래 걸립니다. 캐싱으로 최적화:

```yaml
      - name: Cache Prophet build
        uses: actions/cache@v3
        with:
          path: |
            ~/.cmdstan
            ~/.cache/pip
          key: ${{ runner.os }}-prophet-${{ hashFiles('requirements.txt') }}
          restore-keys: |
            ${{ runner.os }}-prophet-
```

### 8.6 메인 CI/CD 흐름

```
┌─────────────────────────────────────────────────────────────────────┐
│                        배포 아키텍처                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [로컬 PC]                          [GitHub]                        │
│  ┌───────────────┐                  ┌───────────────────────────┐   │
│  │ .bat 트리거   │                  │ GitHub Actions            │   │
│  │ ├─ Python ETL │ ──git push──→   │ ├─ Next.js 빌드           │   │
│  │ └─ Git Commit │                  │ └─ Vercel 배포            │   │
│  └───────────────┘                  └───────────────────────────┘   │
│                                               │                     │
│                                               ▼                     │
│                                      ┌───────────────┐              │
│                                      │ Vercel CDN    │              │
│                                      │ React 앱 서빙  │              │
│                                      └───────────────┘              │
└─────────────────────────────────────────────────────────────────────┘

실행 시나리오
├── 일반 (매일): 로컬 .bat → Git Push → GitHub Actions 자동 빌드/배포
└── 백업 (주말): GitHub Actions Schedule → ETL + 빌드/배포 (run_etl=true)
```

**수동 실행 옵션**:

```bash
# Next.js 빌드/배포만 (ETL 없이)
gh workflow run daily-deploy.yml

# ETL 포함 전체 실행
gh workflow run daily-deploy.yml -f run_etl=true

# 특정 클라이언트 ETL + 배포
gh workflow run daily-deploy.yml -f run_etl=true -f client_id=clientA
```

---

## 9단계: 데이터 백업 구성

### 9.1 백업 정책

| 데이터 | 백업 주기 | 백업 방법 | 보관 기간 |
|-------|---------|----------|----------|
| `data/` 폴더 (CSV) | 주 1회 | 로컬 외장드라이브 + 클라우드 | 3개월 |
| `config/clients.json` | 변경 시 | Git 버전 관리 | 영구 |
| `public/data/` (JSON) | 자동 | Vercel 배포 히스토리 | 최근 10개 |
| Google Sheets 원본 | 자동 | Google 버전 히스토리 | 영구 |

### 9.2 로컬 백업 스크립트

**파일**: `backup.bat`

```batch
@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

set BACKUP_DIR=D:\backup\marketing-dashboard
set DATE_STR=%date:~0,4%%date:~5,2%%date:~8,2%

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    데이터 백업                                  ║
echo ║                    %date% %time%                               ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

:: 백업 디렉토리 생성
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: 1. data/ 폴더 백업
echo [1/3] data/ 폴더 백업...
set DATA_BACKUP=%BACKUP_DIR%\data_%DATE_STR%
xcopy /E /I /Y "data" "%DATA_BACKUP%\data"
echo   → %DATA_BACKUP%\data

:: 2. config/ 폴더 백업 (credentials 제외)
echo [2/3] config/ 폴더 백업...
xcopy /E /I /Y "config\*.json" "%DATA_BACKUP%\config" /EXCLUDE:backup_exclude.txt
echo   → %DATA_BACKUP%\config

:: 3. 압축 (7-Zip 사용 시)
echo [3/3] 압축 생성...
if exist "C:\Program Files\7-Zip\7z.exe" (
    "C:\Program Files\7-Zip\7z.exe" a -tzip "%DATA_BACKUP%.zip" "%DATA_BACKUP%\*" -mx=5
    rmdir /S /Q "%DATA_BACKUP%"
    echo   → %DATA_BACKUP%.zip
) else (
    echo   (7-Zip 미설치, 폴더로 백업됨)
)

:: 4. 오래된 백업 삭제 (90일 이상)
echo.
echo [정리] 90일 이상 된 백업 삭제...
forfiles /P "%BACKUP_DIR%" /M "*.zip" /D -90 /C "cmd /c del @path" 2>nul
echo   완료

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    백업 완료!                                   ║
echo ╚════════════════════════════════════════════════════════════════╝

endlocal
```

**파일**: `backup_exclude.txt`

```
google-credentials.json
*credentials*.json
*.secret
```

### 9.3 클라우드 백업 (선택사항)

#### Google Drive 백업 (rclone 사용)

```bash
# rclone 설치 후 구성
rclone config
# → Google Drive 원격 스토리지 설정 (이름: gdrive)

# 백업 실행
rclone sync ./data gdrive:marketing-dashboard-backup/data --exclude "*.tmp"
```

**파일**: `backup_cloud.bat`

```batch
@echo off
echo 클라우드 백업 중...

:: rclone이 설치되어 있고 gdrive 원격이 설정된 경우
rclone sync ".\data" "gdrive:marketing-dashboard-backup\data" --exclude "*.tmp" --progress

echo 클라우드 백업 완료
```

### 9.4 Vercel 배포 히스토리 활용

Vercel은 자동으로 배포 히스토리를 보관합니다:

```bash
# 이전 배포 목록 확인
vercel ls

# 특정 배포로 롤백
vercel rollback [deployment-url]

# 예시: 이전 프로덕션 배포로 롤백
vercel rollback --yes
```

### 9.5 백업 자동화 (Windows 작업 스케줄러)

```batch
:: 매주 일요일 23:00 백업 실행
schtasks /create /tn "MarketingDashboard_WeeklyBackup" /tr "%~dp0backup.bat" /sc weekly /d SUN /st 23:00 /f

:: 확인
schtasks /query /tn "MarketingDashboard_WeeklyBackup"
```

### 9.6 복구 절차

#### 로컬 데이터 복구

```batch
@echo off
echo 백업에서 데이터 복구...

set BACKUP_FILE=D:\backup\marketing-dashboard\data_20250115.zip

:: 압축 해제
"C:\Program Files\7-Zip\7z.exe" x "%BACKUP_FILE%" -o".\restore_temp" -y

:: 현재 데이터 백업 (안전)
move ".\data" ".\data_old_%date:~0,4%%date:~5,2%%date:~8,2%"

:: 복구
move ".\restore_temp\data" ".\data"

echo 복구 완료. data_old_* 폴더는 확인 후 삭제하세요.
```

#### Vercel 배포 롤백

```bash
# 최근 배포 목록 확인
vercel ls --limit 10

# 특정 배포 URL로 롤백
vercel rollback https://marketing-dashboard-abc123.vercel.app
```

### 9.7 백업 검증 체크리스트

```
□ 주간 백업
  □ backup.bat 실행 성공
  □ 백업 파일 크기 확인 (이전 주와 비교)
  □ 임의 파일 열어서 내용 확인

□ 월간 점검
  □ 클라우드 백업 용량 확인
  □ 오래된 백업 정리 확인
  □ 복구 테스트 (테스트 폴더에 복원)

□ 분기별 점검
  □ 전체 복구 드릴 (새 폴더에 전체 복원 후 파이프라인 실행)
```

---

## 부록: 트러블슈팅

### A. 자주 발생하는 오류

| 오류 | 원인 | 해결 |
|------|------|------|
| `ModuleNotFoundError: common` | sys.path 설정 누락 | 스크립트 상단에 `sys.path.insert` 추가 |
| `FileNotFoundError: clients.json` | 경로 오류 | `PROJECT_ROOT` 확인 |
| `gspread.exceptions.APIError` | Sheet 권한 없음 | Service Account에 시트 공유 |
| `vercel: command not found` | CLI 미설치 | `npm install -g vercel` |
| `CORS 오류` | 로컬 개발 환경 | `next.config.js`에 headers 설정 |

### B. 디버깅 팁

```bash
# Python 경로 확인
python -c "import sys; print(sys.path)"

# JSON 생성 확인
python -c "import json; print(json.load(open('public/data/clientA/meta.json')))"

# Vercel 로그 확인
vercel logs

# Next.js 빌드 상세 로그
npm run build -- --debug
```

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2025-11-28 | 1.0.0 | 초안 작성 |
| 2025-01-05 | 1.1.0 | 아키텍처 흐름 정리: .bat → Git Push → GitHub Actions → Vercel |
|            |       | - 5단계: Vercel 직접 배포 → Git Commit + Push 방식으로 변경 |
|            |       | - 8단계: 백업 설정 → 메인 CI/CD 설정으로 역할 변경 |
|            |       | - GitHub Actions: push 트리거 추가, ETL 조건부 실행 |

---

**문서 끝**
