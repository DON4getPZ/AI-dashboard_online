@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ================================================================================
echo Marketing Dashboard - Package Installer
echo ================================================================================
echo.

REM ============================================================================
REM [1/6] Python 버전 확인
REM ============================================================================
echo [1/6] Checking Python installation...
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed!
    echo Please install Python 3.10+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PYTHON_VERSION=%%v
echo [OK] Python %PYTHON_VERSION% detected
echo.

REM ============================================================================
REM [2/6] pip 업그레이드
REM ============================================================================
echo [2/6] Upgrading pip...
echo.

python -m pip install --upgrade pip >nul 2>&1
if errorlevel 1 (
    echo [WARNING] pip upgrade failed, continuing...
) else (
    echo [OK] pip upgraded successfully
)
echo.

REM ============================================================================
REM [3/6] 설치 모드 선택
REM ============================================================================
echo [3/6] Select installation mode:
echo.
echo [1] BASIC MODE - Data download only
echo     - Packages: gspread, oauth2client, pandas
echo     - For: setup_raw.bat, setup_multi.bat
echo     - Size: ~50 MB
echo.
echo [2] FULL MODE - Complete analysis (Recommended)
echo     - Packages: All packages including Prophet
echo     - For: run_analysis_final.bat (SEGMENT ANALYSIS)
echo     - Size: ~500 MB - 1 GB
echo.
echo [3] CHECK ONLY - Show installed packages status
echo.
echo [0] EXIT
echo.
set /p MODE="Enter your choice (0-3): "

if "%MODE%"=="1" goto BASIC_MODE
if "%MODE%"=="2" goto FULL_MODE
if "%MODE%"=="3" goto CHECK_ONLY
if "%MODE%"=="0" goto END

echo Invalid choice.
pause
goto END

REM ============================================================================
REM CHECK ONLY - 패키지 상태 확인
REM ============================================================================
:CHECK_ONLY
echo.
echo ================================================================================
echo Package Installation Status
echo ================================================================================
echo.

set MISSING_COUNT=0

REM 기본 패키지 확인
echo [Data Processing]
call :CHECK_PACKAGE pandas
call :CHECK_PACKAGE numpy

echo.
echo [Google Sheets]
call :CHECK_PACKAGE gspread
call :CHECK_PACKAGE oauth2client

echo.
echo [Time Series Forecasting]
call :CHECK_PACKAGE prophet
call :CHECK_PACKAGE cmdstanpy

echo.
echo [Statistics]
call :CHECK_PACKAGE scipy
call :CHECK_PACKAGE statsmodels

echo.
echo [Visualization]
call :CHECK_PACKAGE matplotlib
call :CHECK_PACKAGE seaborn
call :CHECK_PACKAGE plotly

echo.
echo [Utilities]
call :CHECK_PACKAGE python-dateutil
call :CHECK_PACKAGE pytz

echo.
echo ================================================================================
if !MISSING_COUNT! GTR 0 (
    echo [RESULT] !MISSING_COUNT! packages are missing
    echo Run this script again and select BASIC or FULL mode to install.
) else (
    echo [RESULT] All packages are installed!
)
echo ================================================================================
pause
goto END

:CHECK_PACKAGE
pip show %1 >nul 2>&1
if errorlevel 1 (
    echo    [X] %1 - NOT INSTALLED
    set /a MISSING_COUNT+=1
) else (
    for /f "tokens=2" %%v in ('pip show %1 2^>nul ^| findstr "^Version:"') do (
        echo    [O] %1 - %%v
    )
)
goto :EOF

REM ============================================================================
REM BASIC MODE - 기본 패키지 설치
REM ============================================================================
:BASIC_MODE
echo.
echo ================================================================================
echo Installing BASIC packages...
echo ================================================================================
echo.

echo [Step 1/2] Installing Google Sheets packages...
pip install gspread>=5.12.0 oauth2client>=4.1.3
if errorlevel 1 (
    echo [ERROR] Google Sheets packages installation failed
    pause
    goto END
)
echo [OK] Google Sheets packages installed
echo.

echo [Step 2/2] Installing data processing packages...
pip install pandas>=2.2.0 numpy>=2.0.0
if errorlevel 1 (
    echo [ERROR] Data processing packages installation failed
    pause
    goto END
)
echo [OK] Data processing packages installed
echo.

echo ================================================================================
echo [SUCCESS] BASIC packages installed successfully!
echo ================================================================================
echo.
echo You can now run:
echo    - setup_raw.bat (Download raw data)
echo    - setup_multi.bat (Download multi-sheet data)
echo.
pause
goto END

REM ============================================================================
REM FULL MODE - 전체 패키지 설치
REM ============================================================================
:FULL_MODE
echo.
echo ================================================================================
echo Installing FULL packages (This may take 5-10 minutes)...
echo ================================================================================
echo.

echo [Step 1/5] Installing data processing packages...
pip install pandas>=2.2.0 numpy>=2.0.0
if errorlevel 1 (
    echo [ERROR] Data processing packages installation failed
    pause
    goto END
)
echo [OK] Data processing packages installed
echo.

echo [Step 2/5] Installing Google Sheets packages...
pip install gspread>=5.12.0 oauth2client>=4.1.3
if errorlevel 1 (
    echo [ERROR] Google Sheets packages installation failed
    pause
    goto END
)
echo [OK] Google Sheets packages installed
echo.

echo [Step 3/5] Installing Prophet and cmdstanpy...
echo    This step may take several minutes...
echo.

pip install cmdstanpy>=1.3.0
if errorlevel 1 (
    echo [WARNING] cmdstanpy installation failed
    echo [INFO] Trying alternative installation...
    pip install cmdstanpy
)

REM cmdstan 설치 확인 및 실행
echo.
echo [Step 3-1] Installing cmdstan backend...
python -c "import cmdstanpy; cmdstanpy.install_cmdstan()" 2>nul
if errorlevel 1 (
    echo [WARNING] cmdstan installation skipped or failed
    echo [INFO] Prophet may use alternative backend
)

pip install prophet>=1.2.0
if errorlevel 1 (
    echo [WARNING] Prophet installation failed
    echo [INFO] Time series forecasting will use simple methods
) else (
    echo [OK] Prophet installed successfully
)
echo.

echo [Step 4/5] Installing statistics and visualization packages...
pip install scipy>=1.14.0 statsmodels>=0.14.4
pip install matplotlib>=3.9.0 seaborn>=0.13.0 plotly>=5.18.0
if errorlevel 1 (
    echo [WARNING] Some visualization packages may have failed
)
echo [OK] Statistics and visualization packages installed
echo.

echo [Step 5/5] Installing utility packages...
pip install python-dateutil>=2.8.2 pytz>=2024.1
echo [OK] Utility packages installed
echo.

echo ================================================================================
echo [SUCCESS] FULL packages installation completed!
echo ================================================================================
echo.
echo You can now run:
echo    - setup_raw.bat (Download raw data)
echo    - run_analysis_final.bat (Full analysis with SEGMENT mode)
echo.
echo Note: If Prophet installation failed, the analysis will use
echo       simple forecasting methods instead.
echo.
pause
goto END

:END
echo.
echo Thank you for using Marketing Dashboard Package Installer!
endlocal
