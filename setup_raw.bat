@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ================================================================================
echo Raw Data Downloader - Simplified Setup
echo ================================================================================
echo.
echo [1/4] Checking environment...
echo.

REM Python check
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not installed
    echo Please install Python 3.10+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PYTHON_VERSION=%%v
echo [OK] Python %PYTHON_VERSION% installed

echo.
echo [2/4] Loading configuration...
echo.

REM 기존 config.json이 있는지 확인
if exist config.json (
    echo Found existing config.json
    set /p USE_EXISTING="Use existing configuration? (Y/N): "
    if /i "!USE_EXISTING!"=="Y" (
        echo [OK] Using existing config.json
        REM config.json에서 값 읽기
        for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-Content config.json | ConvertFrom-Json).google.credentials_path"`) do set GOOGLE_JSON=%%i
        for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-Content config.json | ConvertFrom-Json).google.sheet_id"`) do set SHEET_ID=%%i
        for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-Content config.json | ConvertFrom-Json).google.worksheet_name"`) do set WORKSHEET_NAME=%%i

        echo.
        echo Loaded configuration:
        echo    JSON file: !GOOGLE_JSON!
        echo    Sheet ID: !SHEET_ID!
        echo    Worksheet: !WORKSHEET_NAME!
        echo.

        goto CONFIG_DONE
    )
)

echo.
echo Enter your configuration details:
echo.
echo [Tip] JSON file path example:
echo       C:\Users\YourName\Downloads\service-account-key.json
echo.

set /p GOOGLE_JSON="Google Service Account JSON file path: "

REM 입력값 검증
if "%GOOGLE_JSON%"=="" (
    echo [ERROR] No path entered
    pause
    exit /b 1
)

REM 파일 존재 여부 확인
if not exist "%GOOGLE_JSON%" (
    echo [ERROR] File not found: %GOOGLE_JSON%
    pause
    exit /b 1
)

REM 디렉토리가 아닌 파일인지 확인
if exist "%GOOGLE_JSON%\*" (
    echo [ERROR] This is a directory, not a file: %GOOGLE_JSON%
    echo Please provide the full path to the JSON file.
    pause
    exit /b 1
)

echo [OK] JSON file found

set /p SHEET_ID="Google Sheets ID: "
echo [OK] Sheets ID: %SHEET_ID%

set /p WORKSHEET_NAME="Worksheet name (default: data_integration): "
if "%WORKSHEET_NAME%"=="" set WORKSHEET_NAME=data_integration
echo [OK] Worksheet: %WORKSHEET_NAME%

:CONFIG_DONE

echo.
echo [3/4] Creating config file...
echo.

REM Use PowerShell to create JSON properly
powershell -Command "$config = @{google=@{credentials_path='%GOOGLE_JSON:\=\\%';sheet_id='%SHEET_ID%';worksheet_name='%WORKSHEET_NAME%'}}; $config | ConvertTo-Json -Depth 10 | Out-File -Encoding UTF8 config.json"

if exist config.json (
    echo [OK] config.json created/updated
) else (
    echo [ERROR] Failed to create config.json
    pause
    exit /b 1
)

echo.
echo [4/4] Download raw data
echo.

echo ========================================================================
echo Downloading Raw Data from Google Sheets
echo ========================================================================

REM 환경변수 설정
echo.
echo [Step 1] Setting environment variables...

REM PowerShell을 사용하여 JSON 파일 읽기
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "$json = Get-Content -Path '%GOOGLE_JSON%' -Raw -Encoding UTF8; $json -replace '[\r\n]+', ' '"`) do set GOOGLE_CREDENTIALS=%%i

if not defined GOOGLE_CREDENTIALS (
    echo [ERROR] Failed to read JSON file
    goto DOWNLOAD_FAILED
)

set SHEET_ID=%SHEET_ID%
set WORKSHEET_NAME=%WORKSHEET_NAME%

echo [OK] Environment variables set
echo    - SHEET_ID: %SHEET_ID%
echo    - WORKSHEET_NAME: %WORKSHEET_NAME%

REM data\raw 디렉토리 생성
if not exist data\raw (
    mkdir data\raw
    echo [OK] Created data\raw directory
)

REM 데이터 다운로드
echo.
echo [Step 2] Fetching raw data from Google Sheets...
echo.

python scripts\fetch_google_sheets.py

if errorlevel 1 (
    echo.
    echo [ERROR] Data fetch failed
    goto DOWNLOAD_FAILED
)

REM raw_data.csv 확인
if not exist raw_data.csv (
    echo.
    echo [ERROR] raw_data.csv not created
    goto DOWNLOAD_FAILED
)

echo.
echo [OK] Data fetch successful!

REM 파일 크기 확인
for %%F in (raw_data.csv) do set FILE_SIZE=%%~zF
echo    - File: raw_data.csv
echo    - Size: !FILE_SIZE! bytes

REM raw_data.csv를 data\raw\에 복사
echo.
echo [Step 3] Saving raw_data.csv to data\raw\...
copy raw_data.csv data\raw\raw_data.csv >nul
if errorlevel 1 (
    echo [WARNING] Failed to copy raw_data.csv to data\raw\
) else (
    echo [OK] raw_data.csv saved to data\raw\raw_data.csv
)

REM 성공
echo.
echo ====================================================================
echo [SUCCESS] Raw data downloaded successfully!
echo ====================================================================
echo.
echo Generated files:
echo    - raw_data.csv (root directory)
echo    - data\raw\raw_data.csv (backup copy)
echo.
goto SETUP_COMPLETE

:DOWNLOAD_FAILED
echo.
echo ========================================================================
echo [FAILED] Download did not complete successfully
echo ========================================================================
echo.
echo Please check:
echo 1. Service Account has access to the sheet
echo 2. Sheet ID is correct
echo 3. Worksheet name exists
echo 4. Google Sheets API is enabled
echo 5. Required packages installed: pip install gspread google-auth pandas
echo.

:SETUP_COMPLETE
echo.
echo ================================================================================
echo Setup Complete!
echo ================================================================================
echo.
echo To download data manually, run:
echo    python scripts\fetch_google_sheets.py
echo    python scripts\process_marketing_data.py
echo.
echo For advanced analysis, run:
echo    run_analysis_final.bat
echo.
pause
