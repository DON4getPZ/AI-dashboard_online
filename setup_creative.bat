@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ================================================================================
echo Creative Data Downloader - Setup Script
echo ================================================================================
echo.
echo [1/6] Checking environment...
echo.

REM Python check
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not installed
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Python 버전 확인
for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PYTHON_VERSION=%%v
echo [OK] Python %PYTHON_VERSION% installed

echo.
echo [2/6] Enter configuration details
echo.

REM 기존 config_creative.json이 있는지 확인
if exist config_creative.json (
    echo Found existing config_creative.json
    set /p USE_EXISTING="Use existing configuration? (Y/N): "
    if /i "!USE_EXISTING!"=="Y" (
        echo [OK] Using existing config_creative.json
        REM config_creative.json에서 값 읽기
        for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-Content config_creative.json | ConvertFrom-Json).google.credentials_path"`) do set GOOGLE_JSON=%%i
        for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-Content config_creative.json | ConvertFrom-Json).google.sheet_id"`) do set SHEET_ID=%%i
        for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-Content config_creative.json | ConvertFrom-Json).google.worksheet_name"`) do set WORKSHEET_NAME=%%i

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

REM 파일 확장자 확인 (.json)
echo %GOOGLE_JSON% | findstr /i /c:".json" >nul
if errorlevel 1 (
    echo [WARNING] File does not have .json extension
    set /p CONTINUE_JSON="Continue anyway? (Y/N): "
    if /i "!CONTINUE_JSON!" NEQ "Y" exit /b 1
) else (
    echo [OK] JSON extension verified
)

REM Python으로 JSON 유효성 검증
python -c "import json; json.load(open(r'%GOOGLE_JSON%', encoding='utf-8'))" 2>nul
if errorlevel 1 (
    echo [ERROR] Invalid JSON format or file is not readable
    pause
    exit /b 1
)

echo [OK] JSON file validated

set /p SHEET_ID="Google Sheets ID: "
echo [OK] Sheets ID: %SHEET_ID%

set /p WORKSHEET_NAME="Worksheet name (default: Sheet1): "
if "%WORKSHEET_NAME%"=="" set WORKSHEET_NAME=Sheet1
echo [OK] Worksheet: %WORKSHEET_NAME%

:CONFIG_DONE

echo.
echo [3/6] Creating config file...
echo.

REM Use PowerShell to create JSON properly
powershell -Command "$config = @{google=@{credentials_path='%GOOGLE_JSON:\=\\%';sheet_id='%SHEET_ID%';worksheet_name='%WORKSHEET_NAME%'}}; $config | ConvertTo-Json -Depth 10 | Out-File -Encoding UTF8 config_creative.json"

if exist config_creative.json (
    echo [OK] config_creative.json created
) else (
    echo [ERROR] Failed to create config_creative.json
    pause
    exit /b 1
)

echo.
echo [4/6] Upgrading pip...
echo.

python -m pip install --upgrade pip >nul 2>&1
echo [OK] pip upgraded

echo.
echo [5/6] Installing required packages...
echo.

pip install -r requirements_creative.txt
if errorlevel 1 (
    echo.
    echo [WARNING] Some packages failed to install
    set /p CONTINUE="Continue anyway? (Y/N): "
    if /i "!CONTINUE!" NEQ "Y" exit /b 1
) else (
    echo [OK] Packages installed successfully
)

echo.
echo [6/6] Download data (optional)
echo.

set /p RUN_TEST="Download data now? (Y/N): "
if /i "%RUN_TEST%"=="Y" (
    echo.
    echo ========================================================================
    echo Downloading Creative Data from Google Sheets
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

    REM 데이터 다운로드
    echo.
    echo [Step 2] Fetching data from Google Sheets...
    echo.

    python scripts\fetch_creative_sheets.py

    if errorlevel 1 (
        echo.
        echo [ERROR] Data fetch failed
        goto DOWNLOAD_FAILED
    )

    REM 성공
    if exist data_Creative (
        echo.
        echo ====================================================================
        echo [SUCCESS] Data downloaded successfully!
        echo ====================================================================
        echo.
        echo Files saved in: data_Creative\
        dir /b data_Creative\*.csv 2>nul
        echo.
        goto DOWNLOAD_SUCCESS
    ) else (
        echo.
        echo [ERROR] data_Creative directory not created
        goto DOWNLOAD_FAILED
    )
)

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
echo.
goto SETUP_COMPLETE

:DOWNLOAD_SUCCESS
echo Download completed successfully!
echo.

:SETUP_COMPLETE
echo.
echo ================================================================================
echo Setup Complete!
echo ================================================================================
echo.
echo To download data manually, run:
echo    python scripts\fetch_creative_sheets.py
echo.
echo (Make sure to set environment variables first)
echo.
pause
