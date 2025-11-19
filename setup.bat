@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ================================================================================
echo Marketing Dashboard v2.0 - Auto Setup
echo ================================================================================
echo.
echo [1/10] Checking environment...
echo.

REM Python check
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not installed
    echo Please install Python 3.12+ from https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [OK] Python installed

REM Node.js check
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not installed
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js installed

REM Git check
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git not installed
    echo Please install Git from https://git-scm.com/downloads
    pause
    exit /b 1
)
echo [OK] Git installed

echo.
echo [2/10] Enter configuration details
echo.

set /p GOOGLE_JSON="Google Service Account JSON file path: "
if not exist "%GOOGLE_JSON%" (
    echo [ERROR] File not found: %GOOGLE_JSON%
    pause
    exit /b 1
)
echo [OK] JSON file found

set /p SHEET_ID="Google Sheets ID: "
echo [OK] Sheets ID: %SHEET_ID%

set /p WORKSHEET_NAME="Worksheet name (default: data_integration): "
if "%WORKSHEET_NAME%"=="" set WORKSHEET_NAME=data_integration
echo [OK] Worksheet: %WORKSHEET_NAME%

set /p GITHUB_USERNAME="GitHub Username: "
echo [OK] GitHub: %GITHUB_USERNAME%

set /p REPO_NAME="Repository name (default: marketing-dashboard): "
if "%REPO_NAME%"=="" set REPO_NAME=marketing-dashboard
echo [OK] Repository: %REPO_NAME%

echo.
echo [3/10] Creating config file...
echo.

REM Use PowerShell to create JSON properly
powershell -Command "$config = @{google=@{credentials_path='%GOOGLE_JSON:\=\\%';sheet_id='%SHEET_ID%';worksheet_name='%WORKSHEET_NAME%'};github=@{username='%GITHUB_USERNAME%';repository='%REPO_NAME%'};schedule=@{cron='30 1 * * *';description='Daily at 10:30 KST'}}; $config | ConvertTo-Json -Depth 10 | Out-File -Encoding UTF8 config.json"

if exist config.json (
    echo [OK] config.json created
) else (
    echo [ERROR] Failed to create config.json
    pause
    exit /b 1
)

echo.
echo [4/10] Installing Python packages...
echo.

pip install -r requirements.txt
if errorlevel 1 (
    echo [WARNING] Some packages failed to install
    set /p CONTINUE="Continue anyway? (Y/N): "
    if /i "!CONTINUE!" NEQ "Y" exit /b 1
) else (
    echo [OK] Python packages installed
)

echo.
echo [5/10] Installing Node.js packages...
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
echo [6/10] Creating environment variables...
echo.

REM Create .env.local
(
echo NEXT_PUBLIC_DATA_URL=https://raw.githubusercontent.com/%GITHUB_USERNAME%/%REPO_NAME%/main/data
) > react-app\.env.local

if exist react-app\.env.local (
    echo [OK] .env.local created
) else (
    echo [ERROR] Failed to create .env.local
)

echo.
echo [7/10] Local test (optional)
echo.

set /p RUN_TEST="Run data fetch test? (Y/N): "
if /i "%RUN_TEST%"=="Y" (
    echo.
    echo Fetching data from Google Sheets...
    
    REM Read JSON file content
    for /f "delims=" %%i in ('powershell -Command "Get-Content '%GOOGLE_JSON%' -Raw"') do set GOOGLE_CREDENTIALS=%%i
    
    set SHEET_ID=%SHEET_ID%
    set WORKSHEET_NAME=%WORKSHEET_NAME%
    
    python scripts\fetch_google_sheets.py
    
    if exist raw_data.csv (
        echo [OK] Data fetch successful
        echo.
        echo Processing data...
        set INPUT_CSV_PATH=raw_data.csv
        python scripts\process_marketing_data.py
        echo [OK] Data processing complete
    ) else (
        echo [ERROR] Data fetch failed
        echo Please check your Google Sheets configuration
    )
)

echo.
echo [8/10] GitHub Repository setup
echo.

set /p CREATE_REPO="Create GitHub repository? (Y/N): "
if /i "%CREATE_REPO%"=="Y" (
    echo.
    echo Initializing Git...
    git init
    git add .
    git commit -m "Initial commit: Marketing Dashboard v2.0"
    
    echo.
    echo Creating GitHub repository...
    gh repo create %REPO_NAME% --private --source=. --remote=origin --push
    
    if errorlevel 1 (
        echo.
        echo [WARNING] GitHub CLI not available
        echo.
        echo Manual steps:
        echo 1. Go to https://github.com/new
        echo 2. Repository name: %REPO_NAME%
        echo 3. Select Private
        echo 4. Run these commands:
        echo.
        echo    git remote add origin https://github.com/%GITHUB_USERNAME%/%REPO_NAME%.git
        echo    git branch -M main
        echo    git push -u origin main
        echo.
        pause
    ) else (
        echo [OK] GitHub repository created
    )
)

echo.
echo [9/10] GitHub Secrets setup guide
echo.

echo.
echo Please add these Secrets to your GitHub repository:
echo.
echo Location: GitHub Repository -^> Settings -^> Secrets and variables -^> Actions
echo.
echo 1. GOOGLE_CREDENTIALS
echo    Value: Entire content of %GOOGLE_JSON%
echo.
echo 2. SHEET_ID
echo    Value: %SHEET_ID%
echo.
echo 3. WORKSHEET_NAME (optional)
echo    Value: %WORKSHEET_NAME%
echo.
echo To copy JSON content:
echo    - Open %GOOGLE_JSON% in Notepad
echo    - Press Ctrl+A, then Ctrl+C
echo    - Paste into GitHub Secrets
echo.

set /p SECRETS_DONE="Secrets added? (Y/N): "
if /i "%SECRETS_DONE%"=="Y" (
    echo [OK] Secrets configured
) else (
    echo [WARNING] Please add secrets later
)

echo.
echo [10/10] Vercel deployment (optional)
echo.

set /p DEPLOY_VERCEL="Deploy to Vercel? (Y/N): "
if /i "%DEPLOY_VERCEL%"=="Y" (
    echo.
    echo Checking Vercel CLI...
    vercel --version >nul 2>&1
    if errorlevel 1 (
        echo Installing Vercel CLI...
        call npm install -g vercel
    )
    
    echo.
    echo Starting Vercel deployment...
    cd react-app
    vercel
    
    echo.
    echo [OK] Vercel deployment complete
    echo.
    echo Remember to add environment variable in Vercel Dashboard:
    echo    NEXT_PUBLIC_DATA_URL=https://raw.githubusercontent.com/%GITHUB_USERNAME%/%REPO_NAME%/main/data
    echo.
    cd ..
)

echo.
echo ================================================================================
echo Setup Complete!
echo ================================================================================
echo.
echo Created files:
echo    - config.json
echo    - react-app\.env.local
echo.
echo Next steps:
echo    1. Enable GitHub Actions workflow
echo       ^> GitHub Repository -^> Actions -^> Enable workflow
echo.
echo    2. Check schedule (Daily at 10:30 KST)
echo.
echo    3. View dashboard
echo       ^> Vercel URL or localhost:3000
echo.
echo Documentation:
echo    - docs\SETUP_GUIDE.md
echo    - docs\PROPHET_GUIDE.md
echo    - docs\WORKSHEET_GUIDE.md
echo.
echo Data-driven marketing starts now!
echo.
pause
