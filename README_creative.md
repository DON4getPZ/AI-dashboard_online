# Creative Data Downloader

Google Sheets에서 크리에이티브 데이터를 다운로드하여 CSV로 저장하는 간단한 도구입니다.

## 요구사항

- Python 3.8 이상
- Google Service Account (JSON 키 파일)
- Google Sheets API 활성화

## 빠른 시작

### 1. 설정 스크립트 실행

```batch
setup_creative.bat
```

스크립트가 다음을 요청합니다:
- Google Service Account JSON 파일 경로
- Google Sheets ID
- 워크시트 이름

### 2. 데이터 다운로드

설정 중 "Download data now?" 에서 Y를 선택하거나, 수동으로 실행:

```batch
REM 환경변수 설정
set GOOGLE_CREDENTIALS=<JSON 파일 내용>
set SHEET_ID=<시트 ID>
set WORKSHEET_NAME=<워크시트 이름>

REM 스크립트 실행
python scripts\fetch_creative_sheets.py
```

## 파일 구조

```
├── setup_creative.bat           # 설정 및 설치 스크립트
├── requirements_creative.txt    # Python 패키지 목록
├── config_creative.json         # 설정 파일 (자동 생성)
├── scripts/
│   └── fetch_creative_sheets.py # 데이터 다운로드 스크립트
└── data_Creative/               # 다운로드된 데이터 저장 위치
    └── YYYY-MM.csv              # 월별 CSV 파일
```

## 설정 파일

`config_creative.json` 형식:

```json
{
  "google": {
    "credentials_path": "C:\\path\\to\\service-account.json",
    "sheet_id": "your-sheet-id",
    "worksheet_name": "Sheet1"
  }
}
```

## Google Service Account 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. Google Sheets API 활성화
3. Service Account 생성 및 JSON 키 다운로드
4. Google Sheets에서 Service Account 이메일에 뷰어 권한 부여

## 출력 형식

다운로드된 데이터는 `data_Creative/YYYY-MM.csv` 형식으로 저장됩니다.

예: `data_Creative/2025-11.csv`

## 문제 해결

### 인증 오류
- Service Account JSON 파일 경로가 올바른지 확인
- JSON 파일 형식이 유효한지 확인

### API 오류
- Google Sheets API가 활성화되어 있는지 확인
- Service Account에 시트 접근 권한이 있는지 확인

### 데이터 없음
- Sheet ID가 올바른지 확인
- 워크시트 이름이 정확한지 확인 (대소문자 구분)

## 필요 패키지

```
gspread>=5.12.0
oauth2client>=4.1.3
```

설치:
```batch
pip install -r requirements_creative.txt
```
