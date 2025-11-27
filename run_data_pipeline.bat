@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 스크립트 위치 기준 동적 경로 설정
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo ================================================================================
echo Marketing Dashboard - Run Data Pipeline
echo ================================================================================
echo.
echo This script runs the complete data pipeline:
echo   1. Fetch data from Google Sheets
echo   2. Process marketing data
echo   3. Process segments
echo   4. Generate insights
echo.

REM config.json 확인 (스크립트 위치 기준)
if not exist "%SCRIPT_DIR%config.json" (
    echo [ERROR] config.json not found
    echo Please run setup_analysis_fixed.bat first
    pause
    exit /b 1
)

echo [1/5] Loading configuration...
echo.

REM config.json에서 값 읽기 (스크립트 위치 기준)
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-Content '%SCRIPT_DIR%config.json' | ConvertFrom-Json).google.credentials_path"`) do set GOOGLE_JSON=%%i
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-Content '%SCRIPT_DIR%config.json' | ConvertFrom-Json).google.sheet_id"`) do set SHEET_ID=%%i
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-Content '%SCRIPT_DIR%config.json' | ConvertFrom-Json).google.worksheet_name"`) do set WORKSHEET_NAME=%%i

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

echo [OK] Configuration loaded
echo.

echo [2/5] Setting environment variables...
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

echo [3/5] Fetching data from Google Sheets...
echo.
echo ========================================================================

python scripts\fetch_google_sheets.py

if errorlevel 1 (
    echo.
    echo ========================================================================
    echo [ERROR] Data fetch failed
    echo ========================================================================
    pause
    exit /b 1
)

if not exist raw_data.csv (
    echo.
    echo [ERROR] raw_data.csv not created
    pause
    exit /b 1
)

echo.
echo ========================================================================
echo [OK] Data fetch completed
echo ========================================================================
echo.

echo [4/5] Processing marketing data...
echo.
echo ========================================================================

set INPUT_CSV_PATH=raw_data.csv
python scripts\process_marketing_data.py

if errorlevel 1 (
    echo.
    echo ========================================================================
    echo [ERROR] Data processing failed
    echo ========================================================================
    pause
    exit /b 1
)

echo.
echo ========================================================================
echo [OK] Data processing completed
echo ========================================================================
echo.

echo [5/5] Running segment analysis and insights...
echo.

REM 세그먼트 처리
echo [5-1] Processing segments...
echo ========================================================================
python scripts\segment_processor.py

if errorlevel 1 (
    echo.
    echo [WARNING] Segment processing failed
    echo Continuing...
) else (
    echo.
    echo [OK] Segment processing completed
)

echo.
REM 인사이트 생성
echo [5-2] Generating insights...
echo ========================================================================
python scripts\insight_generator.py

if errorlevel 1 (
    echo.
    echo [WARNING] Insight generation failed
    echo Continuing...
) else (
    echo.
    echo [OK] Insight generation completed
)

echo.
echo ================================================================================
echo Pipeline Complete!
echo ================================================================================
echo.
echo Generated files:
if exist data\raw\*.csv (
    echo    ✓ data\raw\*.csv (monthly data)
)
if exist data\meta\latest.json (
    echo    ✓ data\meta\latest.json (metadata)
)
if exist data\statistics\statistics.json (
    echo    ✓ data\statistics\statistics.json (statistics)
)
if exist data\forecast\predictions_daily.csv (
    echo    ✓ data\forecast\predictions_*.csv (forecasts)
)
if exist data\forecast\segment_brand.csv (
    echo    ✓ data\forecast\segment_*.csv (segments)
)
if exist data\forecast\insights.json (
    echo    ✓ data\forecast\insights.json (insights)
)
echo.
echo You can now run the dashboard with:
echo    cd react-app
echo    npm run dev
echo.
pause
