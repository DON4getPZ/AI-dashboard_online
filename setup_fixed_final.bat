@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ================================================================================
echo Marketing Dashboard v3.0 - Auto Setup (Python 3.13 Compatible)
echo ================================================================================
echo.
echo [1/6] Checking environment...
echo.

REM Python check
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not installed
    echo Please install Python 3.13+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Python 버전 확인
for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PYTHON_VERSION=%%v
echo [OK] Python %PYTHON_VERSION% installed

REM Python 3.13+ 확인
for /f "tokens=1,2 delims=." %%a in ("%PYTHON_VERSION%") do (
    set MAJOR=%%a
    set MINOR=%%b
)

if %MAJOR% LSS 3 (
    echo [WARNING] Python 3.13+ is recommended
) else if %MAJOR% EQU 3 if %MINOR% LSS 13 (
    echo [WARNING] Python 3.13+ is recommended for best compatibility
)

echo.
echo [2/6] Enter configuration details
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

        REM 기존 config 사용 시 파일 재저장 건너뛰기
        goto SKIP_CONFIG_SAVE
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
    echo Example: C:\path\to\service-account.json
    pause
    exit /b 1
)

REM 파일 확장자 확인 (.json)
echo %GOOGLE_JSON% | findstr /i /c:".json" >nul
if errorlevel 1 (
    echo [WARNING] File does not have .json extension
    echo File: %GOOGLE_JSON%
    set /p CONTINUE_JSON="Continue anyway? (Y/N): "
    if /i "!CONTINUE_JSON!" NEQ "Y" exit /b 1
) else (
    echo [OK] JSON extension verified
)

REM Python으로 JSON 유효성 검증
python -c "import json; json.load(open(r'%GOOGLE_JSON%', encoding='utf-8'))" 2>nul
if errorlevel 1 (
    echo [ERROR] Invalid JSON format or file is not readable
    echo File: %GOOGLE_JSON%
    echo.
    echo Please ensure:
    echo 1. File is a valid JSON
    echo 2. File encoding is UTF-8
    echo 3. File is a Service Account key from Google Cloud
    pause
    exit /b 1
)

echo [OK] JSON file validated

set /p SHEET_ID="Google Sheets ID: "
echo [OK] Sheets ID: %SHEET_ID%

set /p WORKSHEET_NAME="Worksheet name (default: data_integration): "
if "%WORKSHEET_NAME%"=="" set WORKSHEET_NAME=data_integration
echo [OK] Worksheet: %WORKSHEET_NAME%

:CONFIG_DONE

echo.
echo [3/6] Creating config file...
echo.

REM Use PowerShell to create JSON properly
powershell -Command "$config = @{google=@{credentials_path='%GOOGLE_JSON:\=\\%';sheet_id='%SHEET_ID%';worksheet_name='%WORKSHEET_NAME%'}}; $config | ConvertTo-Json -Depth 10 | Out-File -Encoding UTF8 config.json"

if exist config.json (
    echo [OK] config.json created
) else (
    echo [ERROR] Failed to create config.json
    pause
    exit /b 1
)

:SKIP_CONFIG_SAVE

echo.
echo [4/6] Upgrading pip to latest version...
echo.

python -m pip install --upgrade pip
if errorlevel 1 (
    echo [WARNING] Failed to upgrade pip
) else (
    echo [OK] pip upgraded successfully
)

echo.
echo [5/6] Installing Python packages (Python 3.13 compatible)...
echo.
echo This version uses Prophet with cmdstanpy backend for time series forecasting!
echo.

REM requirements_fixed.txt 사용
pip install -r requirements_fixed.txt
if errorlevel 1 (
    echo.
    echo [WARNING] Some packages failed to install
    echo.
    echo Troubleshooting:
    echo 1. Check your internet connection
    echo 2. Try running: python -m pip install --upgrade pip
    echo 3. Install packages individually to find the problematic one
    echo.
    set /p CONTINUE="Continue anyway? (Y/N): "
    if /i "!CONTINUE!" NEQ "Y" exit /b 1
) else (
    echo [OK] Python packages installed successfully
)

echo.
echo Verifying installed packages...
echo.

python -c "import pandas; print('  - pandas:', pandas.__version__)"
if errorlevel 1 (
    echo [ERROR] pandas not installed correctly
) else (
    echo [OK] pandas verified
)

python -c "import numpy; print('  - numpy:', numpy.__version__)"
if errorlevel 1 (
    echo [ERROR] numpy not installed correctly
) else (
    echo [OK] numpy verified
)

python -c "import scipy; print('  - scipy:', scipy.__version__)"
if errorlevel 1 (
    echo [ERROR] scipy not installed correctly
) else (
    echo [OK] scipy verified
)

python -c "import gspread; print('  - gspread:', gspread.__version__)"
if errorlevel 1 (
    echo [ERROR] gspread not installed correctly
) else (
    echo [OK] gspread verified
)

python -c "from prophet import Prophet; print('  - prophet: installed')"
if errorlevel 1 (
    echo [WARNING] prophet not installed - simple forecasting will be used
) else (
    echo [OK] prophet verified
)

python -c "import cmdstanpy; print('  - cmdstanpy:', cmdstanpy.__version__)"
if errorlevel 1 (
    echo [WARNING] cmdstanpy not installed
) else (
    echo [OK] cmdstanpy verified
)

echo.
echo [6/6] Download data (optional)
echo.

set /p RUN_TEST="Download data now? (Y/N): "
if /i "%RUN_TEST%"=="Y" (
    echo.
    echo ========================================================================
    echo Downloading Data from Google Sheets
    echo ========================================================================

    REM Step 1: JSON 파일 유효성 검증
    echo.
    echo [Step 1] Validating JSON file...
    echo    File: %GOOGLE_JSON%

    if not exist "%GOOGLE_JSON%" (
        echo [ERROR] JSON file not found: %GOOGLE_JSON%
        echo Please check the file path.
        goto DOWNLOAD_FAILED
    )
    echo [OK] JSON file exists

    REM JSON 형식 검증
    python -c "import json; json.load(open(r'%GOOGLE_JSON%', encoding='utf-8'))" 2>nul
    if errorlevel 1 (
        echo [ERROR] Invalid JSON format
        echo Please check your Service Account JSON file.
        goto DOWNLOAD_FAILED
    )
    echo [OK] JSON format valid

    REM Step 2: 환경변수 설정
    echo.
    echo [Step 2] Setting environment variables...

    REM PowerShell을 사용하여 JSON 파일 읽기 (경로 이스케이핑 처리)
    for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "$json = Get-Content -Path '%GOOGLE_JSON%' -Raw -Encoding UTF8; $json -replace '[\r\n]+', ' '"`) do set GOOGLE_CREDENTIALS=%%i

    if not defined GOOGLE_CREDENTIALS (
        echo [ERROR] Failed to read JSON file
        echo.
        echo Troubleshooting:
        echo 1. Check file path has no special characters
        echo 2. Ensure file is readable
        echo 3. Try using a path without spaces
        goto DOWNLOAD_FAILED
    )

    set SHEET_ID=%SHEET_ID%
    set WORKSHEET_NAME=%WORKSHEET_NAME%

    echo [OK] Environment variables set
    echo    - SHEET_ID: %SHEET_ID%
    echo    - WORKSHEET_NAME: %WORKSHEET_NAME%

    REM Step 3: Google Sheets 데이터 가져오기
    echo.
    echo [Step 3] Fetching data from Google Sheets...
    echo.

    python scripts\fetch_google_sheets.py

    if errorlevel 1 (
        echo.
        echo [ERROR] Data fetch script failed
        echo.
        echo Common issues:
        echo 1. Service Account doesn't have access to the sheet
        echo 2. Sheet ID is incorrect
        echo 3. Worksheet name doesn't exist
        echo 4. Google Sheets API not enabled
        echo.
        echo Please check the error messages above.
        goto DOWNLOAD_FAILED
    )

    REM Step 4: 데이터 처리
    if exist data\raw\raw_data.csv (
        echo.
        echo [OK] Data fetch successful!

        REM 파일 크기 확인
        for %%F in (data\raw\raw_data.csv) do set FILE_SIZE=%%~zF
        if !FILE_SIZE! LSS 100 (
            echo [WARNING] File size is very small: !FILE_SIZE! bytes
            echo The file might be empty or incomplete.
        ) else (
            echo    - File: data\raw\raw_data.csv
            echo    - Size: !FILE_SIZE! bytes
        )

        echo.
        echo [Step 4] Processing marketing data...
        echo.

        set INPUT_CSV_PATH=data\raw\raw_data.csv
        python scripts\process_marketing_data.py

        if errorlevel 1 (
            echo.
            echo [ERROR] Data processing failed
            echo Please check the error messages above.
            echo.
            echo Common issues:
            echo 1. CSV format doesn't match expected structure
            echo 2. Required columns are missing
            echo 3. Data type conversion errors
            goto DOWNLOAD_FAILED
        ) else (
            echo.
            echo ====================================================================
            echo [SUCCESS] Download and processing completed successfully!
            echo ====================================================================
            echo.
            echo Generated files:
            if exist data\raw (
                echo    - data\raw\*.csv (monthly data)
            )
            if exist data\meta\latest.json (
                echo    - data\meta\latest.json (metadata)
            )
            if exist data\statistics\statistics.json (
                echo    - data\statistics\statistics.json (statistics)
            )
            if exist data\forecast\predictions.csv (
                echo    - data\forecast\predictions.csv (forecasts)
            )
            echo.
            goto DOWNLOAD_SUCCESS
        )
    ) else (
        echo.
        echo [ERROR] data\raw\raw_data.csv not created
        echo Data fetch failed or returned no data.
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
echo    python scripts\fetch_google_sheets.py
echo.
echo To process data, run:
echo    python scripts\process_marketing_data.py
echo.
pause
