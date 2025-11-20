@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ================================================================================
echo Marketing Dashboard v3.0 - Analysis Setup (Python 3.13 Compatible)
echo ================================================================================
echo.
echo [1/10] Checking environment...
echo.

REM Python check
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not installed
    echo Please install Python 3.13+ (64-bit) from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Python 버전 확인
for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PYTHON_VERSION=%%v
echo [OK] Python %PYTHON_VERSION% installed

REM Python 아키텍처 확인 (32비트 vs 64비트)
echo.
echo Checking Python architecture...
for /f "delims=" %%i in ('python -c "import struct; print(struct.calcsize('P') * 8)"') do set PYTHON_BITS=%%i

echo    - Architecture: %PYTHON_BITS%-bit Python

if "%PYTHON_BITS%"=="32" (
    echo.
    echo ========================================================================
    echo [WARNING] 32-bit Python detected!
    echo ========================================================================
    echo.
    echo 32-bit Python has a memory limit of ~2GB, which may cause issues with:
    echo   - Large dataset processing
    echo   - Prophet forecasting models
    echo   - Memory-intensive operations
    echo.
    echo RECOMMENDATION: Install 64-bit Python for better performance
    echo.
    echo Download 64-bit Python here:
    echo   https://www.python.org/downloads/
    echo.
    echo After installation:
    echo   1. Uninstall 32-bit Python
    echo   2. Install 64-bit Python
    echo   3. Run this setup again
    echo.
    echo You can also use LITE MODE which requires less memory:
    echo   - Run: process_lite.bat after setup
    echo   - Or: run_analysis.bat and choose [1] LITE MODE
    echo.
    set /p CONTINUE_32BIT="Continue with 32-bit Python anyway? (Y/N, default: N): "
    if "!CONTINUE_32BIT!"=="" set CONTINUE_32BIT=N
    echo [INPUT] Selected: !CONTINUE_32BIT!

    if /i "!CONTINUE_32BIT!" NEQ "Y" (
        echo.
        echo Setup cancelled. Please install 64-bit Python and try again.
        echo.
        echo Quick steps:
        echo   1. Go to: https://www.python.org/downloads/
        echo   2. Download: Windows installer (64-bit)
        echo   3. Install with "Add Python to PATH" option checked
        echo   4. Run this setup again
        echo.
        pause
        exit /b 1
    )

    echo.
    echo [WARNING] Continuing with 32-bit Python (memory limitations apply)
    echo          We recommend using LITE MODE after setup completes.
    echo.
) else (
    echo [OK] 64-bit Python - optimal for data processing
)

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

REM Node.js check
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not installed
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js installed

REM Git check (optional for analysis mode)
git --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Git not installed - GitHub features will be unavailable
) else (
    echo [OK] Git installed
)

echo.
echo [2/10] Enter configuration details
echo.

REM 기존 config.json이 있는지 확인
if exist config.json (
    echo Found existing config.json
    set /p USE_EXISTING="Use existing configuration? (Y/N, default: Y): "
    if "!USE_EXISTING!"=="" set USE_EXISTING=Y
    echo [INPUT] Selected: !USE_EXISTING!

    if /i "!USE_EXISTING!"=="Y" (
        echo [OK] Using existing config.json
        REM config.json에서 값 읽기
        for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-Content config.json | ConvertFrom-Json).google.credentials_path"`) do set GOOGLE_JSON=%%i
        for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-Content config.json | ConvertFrom-Json).google.sheet_id"`) do set SHEET_ID=%%i
        for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-Content config.json | ConvertFrom-Json).google.worksheet_name"`) do set WORKSHEET_NAME=%%i

        REM 변수가 제대로 로드되었는지 확인
        if not defined GOOGLE_JSON (
            echo [ERROR] Failed to load credentials_path from config.json
            echo Please re-enter configuration manually
            goto CONFIG_MANUAL
        )
        if not defined SHEET_ID (
            echo [ERROR] Failed to load sheet_id from config.json
            echo Please re-enter configuration manually
            goto CONFIG_MANUAL
        )
        if not defined WORKSHEET_NAME (
            set WORKSHEET_NAME=data_integration
        )

        echo.
        echo Loaded configuration:
        echo    JSON file: !GOOGLE_JSON!
        echo    Sheet ID: !SHEET_ID!
        echo    Worksheet: !WORKSHEET_NAME!
        echo.

        goto CONFIG_DONE
    ) else (
        goto CONFIG_MANUAL
    )
) else (
    goto CONFIG_MANUAL
)

:CONFIG_MANUAL
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

:SHEET_ID_INPUT
set /p SHEET_ID="Google Sheets ID: "
if "%SHEET_ID%"=="" (
    echo [ERROR] Sheet ID cannot be empty
    echo Please enter a valid Google Sheets ID
    goto SHEET_ID_INPUT
)
echo [OK] Sheets ID: %SHEET_ID%

set /p WORKSHEET_NAME="Worksheet name (default: data_integration): "
if "%WORKSHEET_NAME%"=="" set WORKSHEET_NAME=data_integration
echo [OK] Worksheet: %WORKSHEET_NAME%

:CONFIG_DONE

echo.
echo [3/10] Creating config file...
echo.

REM Use PowerShell to create JSON properly (without GitHub)
powershell -Command "$config = @{google=@{credentials_path='%GOOGLE_JSON:\\=\\\\%';sheet_id='%SHEET_ID%';worksheet_name='%WORKSHEET_NAME%'}}; $config | ConvertTo-Json -Depth 10 | Out-File -Encoding UTF8 config.json"

if exist config.json (
    echo [OK] config.json created/updated
) else (
    echo [ERROR] Failed to create config.json
    pause
    exit /b 1
)
echo.
echo [4/10] Upgrading pip to latest version...
echo.

python -m pip install --upgrade pip
if errorlevel 1 (
    echo [WARNING] Failed to upgrade pip
) else (
    echo [OK] pip upgraded successfully
)

echo.
echo [5/10] Installing Python packages (Python 3.13 compatible)...
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
echo [6/10] Verifying installed packages...
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
echo [7/10] Installing Node.js packages...
echo.

cd react-app
call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed
    cd ..
    pause
    exit /b 1
)
echo [OK] Node.js packages installed
cd ..

echo.
echo [8/10] Creating environment variables...
echo.

REM Create .env.local with local data URL
(
echo NEXT_PUBLIC_DATA_URL=/data
) > react-app\.env.local

if exist react-app\.env.local (
    echo [OK] .env.local created for local development
) else (
    echo [ERROR] Failed to create .env.local
)

echo.
echo [9/10] Fetching and analyzing data...
echo.
echo ========================================================================
echo Data Fetch and Analysis
echo ========================================================================

REM Step 1: JSON 파일 유효성 검증
echo.
echo [Step 1] Validating JSON file...
echo    File: %GOOGLE_JSON%

if not exist "%GOOGLE_JSON%" (
    echo [ERROR] JSON file not found: %GOOGLE_JSON%
    echo Please check the file path.
    goto TEST_FAILED
)
echo [OK] JSON file exists

REM JSON 형식 검증
python -c "import json; json.load(open(r'%GOOGLE_JSON%', encoding='utf-8'))" 2>nul
if errorlevel 1 (
    echo [ERROR] Invalid JSON format
    echo Please check your Service Account JSON file.
    goto TEST_FAILED
)
echo [OK] JSON format valid

REM Step 2: 환경변수 설정
echo.
echo [Step 2] Setting environment variables...
echo.
echo [DEBUG] Reading JSON file with PowerShell...
echo    - File: %GOOGLE_JSON%

REM PowerShell을 사용하여 JSON 파일 읽기 (경로 이스케이핑 처리)
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "$json = Get-Content -Path '%GOOGLE_JSON%' -Raw -Encoding UTF8; $json -replace '[\r\n]+', ' '"`) do set GOOGLE_CREDENTIALS=%%i

if not defined GOOGLE_CREDENTIALS (
    echo.
    echo [ERROR] Failed to read JSON file
    echo.
    echo Troubleshooting:
    echo 1. Check file path has no special characters
    echo 2. Ensure file is readable
    echo 3. Try using a path without spaces
    echo 4. JSON file might be corrupted
    echo.
    echo File path: %GOOGLE_JSON%
    goto TEST_FAILED
)

set SHEET_ID=%SHEET_ID%
set WORKSHEET_NAME=%WORKSHEET_NAME%

echo.
echo [OK] Environment variables set successfully
echo    - SHEET_ID: %SHEET_ID%
echo    - WORKSHEET_NAME: %WORKSHEET_NAME%
echo    - GOOGLE_CREDENTIALS length: %GOOGLE_CREDENTIALS:~0,100% characters (truncated for display)

REM Step 3: Google Sheets 데이터 가져오기
echo.
echo [Step 3] Fetching data from Google Sheets...
echo.
echo [DEBUG] Current directory:
cd
echo.
echo [DEBUG] Checking scripts directory...
if exist scripts\ (
    echo    - scripts\ directory: OK
) else (
    echo    - scripts\ directory: NOT FOUND
    echo [ERROR] scripts directory not found!
    goto TEST_FAILED
)
if exist scripts\fetch_google_sheets.py (
    echo    - scripts\fetch_google_sheets.py: OK
) else (
    echo    - scripts\fetch_google_sheets.py: NOT FOUND
    echo [ERROR] fetch_google_sheets.py not found!
    goto TEST_FAILED
)
echo.
echo [DEBUG] Python version:
python --version
echo.
echo [DEBUG] Verifying environment variables are still set...
if not defined GOOGLE_CREDENTIALS (
    echo [ERROR] GOOGLE_CREDENTIALS not set!
    goto TEST_FAILED
)
if not defined SHEET_ID (
    echo [ERROR] SHEET_ID not set!
    goto TEST_FAILED
)
if not defined WORKSHEET_NAME (
    echo [ERROR] WORKSHEET_NAME not set!
    goto TEST_FAILED
)
echo    - GOOGLE_CREDENTIALS: OK (length: %GOOGLE_CREDENTIALS:~0,50%...)
echo    - SHEET_ID: %SHEET_ID%
echo    - WORKSHEET_NAME: %WORKSHEET_NAME%
echo.
echo [DEBUG] Running: python scripts\fetch_google_sheets.py
echo.

REM Python 스크립트 실행 (타임아웃 없음, 큰 데이터 처리를 위해)
python scripts\fetch_google_sheets.py
set FETCH_EXIT_CODE=%ERRORLEVEL%

echo.
echo [DEBUG] Python script exit code: %FETCH_EXIT_CODE%
echo.

if %FETCH_EXIT_CODE% NEQ 0 (
    echo.
    echo [ERROR] Data fetch script failed (Exit code: %FETCH_EXIT_CODE%)
    echo.
    echo Common issues:
    echo 1. Service Account doesn't have access to the sheet
    echo 2. Sheet ID is incorrect
    echo 3. Worksheet name doesn't exist
    echo 4. Google Sheets API not enabled
    echo 5. Memory error - data might be too large
    echo 6. Network timeout or connection issue
    echo.
    echo Please check the error messages above.
    goto TEST_FAILED
)

echo [DEBUG] Checking for raw_data.csv...
echo    - Current directory: %CD%
echo    - Looking for: raw_data.csv
echo    - Full path: %CD%\raw_data.csv
echo.

REM 짧은 대기 (파일 시스템 동기화)
timeout /t 3 /nobreak >nul 2>&1

REM 현재 디렉토리의 CSV 파일 목록
echo [DEBUG] CSV files in current directory:
dir /b *.csv 2>nul
if errorlevel 1 (
    echo    - No CSV files found
) else (
    echo [DEBUG] Listing found
)
echo.

REM 명시적으로 raw_data.csv 확인
echo [DEBUG] Checking raw_data.csv existence...
if exist "%CD%\raw_data.csv" (
    echo    - Found using absolute path: %CD%\raw_data.csv
)
if exist "raw_data.csv" (
    echo    - Found using relative path: raw_data.csv
)
echo.

REM Step 4: 데이터 처리
if exist raw_data.csv (
    echo.
    echo [OK] Data fetch successful!

    REM 파일 크기 확인
    for %%F in (raw_data.csv) do set FILE_SIZE=%%~zF
    if !FILE_SIZE! LSS 100 (
        echo [WARNING] File size is very small: !FILE_SIZE! bytes
        echo The file might be empty or incomplete.
    ) else (
        echo    - File: raw_data.csv
        echo    - Size: !FILE_SIZE! bytes
    )

    echo.
    echo [Step 4] Processing marketing data...
    echo.

    set INPUT_CSV_PATH=raw_data.csv
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
        goto TEST_FAILED
    ) else (
        echo.

        REM ====================================================================
        REM Step 5: 세그먼트별 분석 및 인사이트 생성
        REM ====================================================================
        echo.
        echo [Step 5] Running segment analysis and insight generation...
        echo.

        REM 5-1: 세그먼트별 처리
        echo [Step 5-1] Processing segments (brand/channel/product)...
        python scripts\segment_processor.py

        if errorlevel 1 (
            echo.
            echo [WARNING] Segment processing failed
            echo Continuing without segment analysis...
            echo.
        ) else (
            echo [OK] Segment processing completed
        )

        REM 5-2: 인사이트 생성
        echo.
        echo [Step 5-2] Generating marketing insights...
        python scripts\insight_generator.py

        if errorlevel 1 (
            echo.
            echo [WARNING] Insight generation failed
            echo Continuing without insights...
            echo.
        ) else (
            echo [OK] Insight generation completed
        )
        echo.
        echo ====================================================================
        echo [SUCCESS] Data fetch and analysis completed successfully!
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
        if exist data\forecast\segment_brand.csv (
            echo    - data\forecast\segment_brand.csv (brand segments)
        )
        if exist data\forecast\segment_channel.csv (
            echo    - data\forecast\segment_channel.csv (channel segments)
        )
        if exist data\forecast\segment_product.csv (
            echo    - data\forecast\segment_product.csv (product segments)
        )
        if exist data\forecast\insights.json (
            echo    - data\forecast\insights.json (marketing insights)
        )
        echo.
        goto TEST_SUCCESS
    )
) else (
    echo.
    echo [ERROR] raw_data.csv not created
    echo Data fetch failed or returned no data.
    goto TEST_FAILED
)

:TEST_FAILED
echo.
echo ========================================================================
echo [FAILED] Data fetch and analysis did not complete successfully
echo ========================================================================
echo.
echo You can:
echo 1. Check the error messages above
echo 2. Verify your Google Service Account setup
echo 3. Continue anyway
echo.
set /p CONTINUE_SETUP="Continue anyway? (Y/N, default: Y): "
if "%CONTINUE_SETUP%"=="" set CONTINUE_SETUP=Y
echo [INPUT] Selected: %CONTINUE_SETUP%

if /i "%CONTINUE_SETUP%" NEQ "Y" (
    echo.
    echo Setup paused. Fix the issues and run setup_analysis_fixed.bat again.
    pause
    exit /b 1
)

:TEST_SUCCESS

echo.
echo ================================================================================
echo [10/10] Setup Complete! (Analysis Mode)
echo ================================================================================
echo.
echo Created files:
echo    - config.json
echo    - react-app\.env.local
echo.
if exist data\raw (
    echo    - data\raw\*.csv (monthly data)
)
if exist data\meta\latest.json (
    echo    - data\meta\latest.json (metadata)
)
if exist data\statistics\statistics.json (
    echo    - data\statistics\statistics.json (statistics)
)
if exist data\forecast\predictions_daily.csv (
    echo    - data\forecast\predictions_*.csv (forecasts)
)
if exist data\forecast\segment_brand.csv (
    echo    - data\forecast\segment_*.csv (segment analysis)
)
if exist data\forecast\insights.json (
    echo    - data\forecast\insights.json (marketing insights)
)
echo.
echo Next steps:
echo.
echo    1. Run local dashboard:
echo       cd react-app
echo       npm run dev
echo.
echo    2. View dashboard at:
echo       http://localhost:3000
echo.
echo    3. To update data:
echo       python scripts\fetch_google_sheets.py
echo       python scripts\process_marketing_data.py
echo       python scripts\segment_processor.py
echo       python scripts\insight_generator.py
echo.
echo Documentation:
echo    - docs\SETUP_GUIDE.md
echo    - docs\PROPHET_GUIDE.md
echo    - docs\WORKSHEET_GUIDE.md
echo.
echo Data-driven marketing analysis ready!
echo.
pause
