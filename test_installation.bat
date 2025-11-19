@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ================================================================================
echo Marketing Dashboard - Installation Verification Test
echo ================================================================================
echo.

REM Python 버전 확인
echo [1/6] Checking Python version...
python --version >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Python not found
    exit /b 1
)

for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PYTHON_VERSION=%%v
echo [PASS] Python %PYTHON_VERSION% installed

REM Python 3.13+ 확인
for /f "tokens=1,2 delims=." %%a in ("%PYTHON_VERSION%") do (
    set MAJOR=%%a
    set MINOR=%%b
)

if %MAJOR% GEQ 3 if %MINOR% GEQ 13 (
    echo [PASS] Python version is 3.13 or higher
) else (
    echo [WARN] Python 3.13+ is recommended
)

echo.
echo [2/6] Testing pandas installation...
python -c "import pandas; print('       Version:', pandas.__version__)" 2>nul
if errorlevel 1 (
    echo [FAIL] pandas not installed
    set TEST_FAILED=1
) else (
    echo [PASS] pandas installed
)

echo.
echo [3/6] Testing numpy installation...
python -c "import numpy; print('       Version:', numpy.__version__)" 2>nul
if errorlevel 1 (
    echo [FAIL] numpy not installed
    set TEST_FAILED=1
) else (
    echo [PASS] numpy installed
)

echo.
echo [4/6] Testing scipy installation...
python -c "import scipy; print('       Version:', scipy.__version__)" 2>nul
if errorlevel 1 (
    echo [FAIL] scipy not installed
    set TEST_FAILED=1
) else (
    echo [PASS] scipy installed
)

echo.
echo [5/6] Testing Google Sheets libraries...
python -c "import gspread, oauth2client; print('       gspread:', gspread.__version__)" 2>nul
if errorlevel 1 (
    echo [FAIL] Google Sheets libraries not installed
    set TEST_FAILED=1
) else (
    echo [PASS] Google Sheets libraries installed
)

echo.
echo [6/6] Testing data processing functionality...
python -c "import pandas as pd; import numpy as np; from scipy import stats; df = pd.DataFrame({'a': np.random.rand(10)}); df['b'] = df['a'] * 2; print('       Sample calculation successful')" 2>nul
if errorlevel 1 (
    echo [FAIL] Data processing test failed
    set TEST_FAILED=1
) else (
    echo [PASS] Data processing functionality works
)

echo.
echo ================================================================================
if defined TEST_FAILED (
    echo [RESULT] Installation INCOMPLETE - Some packages missing
    echo.
    echo Please run: setup_fixed.bat
    echo Or install manually: pip install -r requirements_fixed.txt
) else (
    echo [RESULT] Installation SUCCESSFUL - All packages working!
    echo.
    echo You can now:
    echo 1. Run setup_fixed.bat to complete full setup
    echo 2. Or start using the dashboard directly
)
echo ================================================================================
echo.
pause
