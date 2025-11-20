@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ================================================================================
echo Google Sheets Fetch Test (Standalone)
echo ================================================================================
echo.
echo This script tests the Google Sheets data fetch independently.
echo.

REM config.json 확인
if not exist config.json (
    echo [ERROR] config.json not found
    echo Please run setup_analysis_fixed.bat first
    pause
    exit /b 1
)

echo [1/3] Loading configuration from config.json...
echo.

REM config.json에서 값 읽기
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-Content config.json | ConvertFrom-Json).google.credentials_path"`) do set GOOGLE_JSON=%%i
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-Content config.json | ConvertFrom-Json).google.sheet_id"`) do set SHEET_ID=%%i
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-Content config.json | ConvertFrom-Json).google.worksheet_name"`) do set WORKSHEET_NAME=%%i

if not defined GOOGLE_JSON (
    echo [ERROR] Failed to load credentials_path from config.json
    pause
    exit /b 1
)

if not defined SHEET_ID (
    echo [ERROR] Failed to load sheet_id from config.json
    pause
    exit /b 1
)

if not defined WORKSHEET_NAME (
    set WORKSHEET_NAME=data_integration
)

echo [OK] Configuration loaded:
echo    - JSON file: !GOOGLE_JSON!
echo    - Sheet ID: !SHEET_ID!
echo    - Worksheet: !WORKSHEET_NAME!
echo.

echo [2/3] Setting environment variables...
echo.

REM JSON 파일 유효성 검증
if not exist "%GOOGLE_JSON%" (
    echo [ERROR] JSON file not found: %GOOGLE_JSON%
    pause
    exit /b 1
)

python -c "import json; json.load(open(r'%GOOGLE_JSON%', encoding='utf-8'))" 2>nul
if errorlevel 1 (
    echo [ERROR] Invalid JSON format
    pause
    exit /b 1
)

echo [OK] JSON file validated

REM 환경변수 설정
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "$json = Get-Content -Path '%GOOGLE_JSON%' -Raw -Encoding UTF8; $json -replace '[\r\n]+', ' '"`) do set GOOGLE_CREDENTIALS=%%i

if not defined GOOGLE_CREDENTIALS (
    echo [ERROR] Failed to read JSON file
    pause
    exit /b 1
)

set SHEET_ID=%SHEET_ID%
set WORKSHEET_NAME=%WORKSHEET_NAME%

echo [OK] Environment variables set
echo.

echo [3/3] Fetching data from Google Sheets...
echo.
echo ========================================================================
echo.

REM Python 버전 확인
echo Python version:
python --version
echo.

REM 필수 패키지 확인
echo Checking required packages...
python -c "import gspread; print('  - gspread: OK')" 2>nul
if errorlevel 1 (
    echo [ERROR] gspread not installed
    echo Please run: pip install gspread
    pause
    exit /b 1
)

python -c "import oauth2client; print('  - oauth2client: OK')" 2>nul
if errorlevel 1 (
    echo [ERROR] oauth2client not installed
    echo Please run: pip install oauth2client
    pause
    exit /b 1
)

echo.
echo ========================================================================
echo.

REM 데이터 가져오기 실행
python scripts\fetch_google_sheets.py
set EXIT_CODE=%ERRORLEVEL%

echo.
echo ========================================================================
echo Exit code: %EXIT_CODE%
echo ========================================================================
echo.

if %EXIT_CODE% EQU 0 (
    if exist raw_data.csv (
        echo [SUCCESS] Data fetch completed!
        echo.
        for %%F in (raw_data.csv) do set FILE_SIZE=%%~zF
        echo File: raw_data.csv
        echo Size: !FILE_SIZE! bytes
        echo.

        REM 처음 5줄 미리보기
        echo First 5 lines:
        echo ========================================================================
        powershell -Command "Get-Content raw_data.csv -TotalCount 5"
        echo ========================================================================
    ) else (
        echo [WARNING] Script succeeded but raw_data.csv not found
    )
) else (
    echo [FAILED] Data fetch failed with exit code: %EXIT_CODE%
    echo.
    echo Please check the error messages above for details.
)

echo.
pause
