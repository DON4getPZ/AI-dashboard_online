# Creative URL Data Downloader

Google Sheets에서 URL 데이터를 CSV로 다운로드하는 간소화된 도구입니다.

## 특징

- Python/pip 설치 확인 및 검증 단계 제외
- CSV 다운로드에 최적화
- `*_url.csv` 형식으로 저장

## 사전 요구사항

1. **Python 3.8+** 설치
2. **Google Cloud Project** 생성 및 설정
   - Google Sheets API 활성화
   - Service Account 생성
   - JSON 키 파일 다운로드

## 설치

### 1. 패키지 설치

```bash
pip install -r requirements_creative_url.txt
```

### 2. Google Sheets 권한 설정

Service Account 이메일을 Google Sheets에 "편집자" 또는 "뷰어"로 공유

## 사용 방법

### 방법 1: 배치 파일 실행 (권장)

```bash
setup_creative_url.bat
```

배치 파일이 다음을 자동으로 처리:
- config_creative.json 설정 로드/생성
- 환경변수 설정
- 데이터 다운로드

### 방법 2: Python 스크립트 직접 실행

환경변수 설정 후 실행:

```bash
# PowerShell
$env:GOOGLE_CREDENTIALS = Get-Content "path/to/service-account.json" -Raw
$env:SHEET_ID = "your-sheet-id"
$env:WORKSHEET_NAME = "Sheet1"

python scripts/fetch_creative_url.py
```

## 출력

- **위치**: `data_Creative/`
- **파일명**: `{worksheet_name}_url.csv`
- **형식**: UTF-8 인코딩 CSV

### CSV 구조 예시

```csv
"광고,에셋이름",url,원본 url / ID
데이지-이미지-말랑말랑,https://www.facebook.com/ads/image/?d=...,-
...
```

## 파일 구조

```
project/
├── setup_creative_url.bat          # 메인 실행 파일
├── requirements_creative_url.txt   # 필수 패키지
├── config_creative.json            # 설정 파일 (자동 생성)
├── scripts/
│   └── fetch_creative_url.py       # 다운로드 스크립트
└── data_Creative/
    └── {worksheet}_url.csv         # 다운로드된 데이터
```

## 문제 해결

### 일반적인 오류

1. **API Error: 403**
   - Service Account에 시트 접근 권한 확인
   - Google Sheets API 활성화 확인

2. **Worksheet not found**
   - 워크시트 이름이 정확한지 확인 (대소문자 구분)

3. **JSON 파싱 오류**
   - Service Account JSON 파일이 유효한지 확인

### 환경변수

| 변수명 | 설명 | 필수 |
|--------|------|------|
| GOOGLE_CREDENTIALS | Service Account JSON 내용 | O |
| SHEET_ID | Google Sheets ID | O |
| WORKSHEET_NAME | 워크시트 이름 | X (기본값: Sheet1) |

## Google Sheets ID 찾기

URL에서 ID 추출:
```
https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
```

예: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`

SHEET_ID = `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

## 라이선스

내부 사용 전용
