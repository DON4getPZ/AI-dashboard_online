@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ================================================================================
echo Marketing Dashboard - Lite Processing (Memory Efficient)
echo ================================================================================
echo.
echo This script uses simple forecasting without Prophet to save memory.
echo.

REM raw_data.csv 확인
if not exist raw_data.csv (
    echo [ERROR] raw_data.csv not found
    echo Please fetch data first using test_fetch.bat
    pause
    exit /b 1
)

echo [OK] Found raw_data.csv
for %%F in (raw_data.csv) do set FILE_SIZE=%%~zF
set /a FILE_SIZE_MB=!FILE_SIZE! / 1048576
echo    - Size: !FILE_SIZE! bytes (≈!FILE_SIZE_MB! MB)
echo.

echo ================================================================================
echo [1/1] Processing data (lite mode - memory efficient)...
echo ================================================================================
echo.

set INPUT_CSV_PATH=raw_data.csv
python scripts\process_marketing_data_lite.py

if errorlevel 1 (
    echo.
    echo ========================================================================
    echo [ERROR] Data processing failed
    echo ========================================================================
    pause
    exit /b 1
)

echo.
echo ================================================================================
echo Processing Complete! (Lite Mode)
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
    echo    ✓ data\forecast\predictions_daily.csv (forecasts)
)
if exist data\forecast\predictions_weekly.csv (
    echo    ✓ data\forecast\predictions_weekly.csv (weekly)
)
if exist data\forecast\predictions_monthly.csv (
    echo    ✓ data\forecast\predictions_monthly.csv (monthly)
)
echo.
echo Note: Segment analysis and advanced features require more memory.
echo      This lite version provides basic forecasting only.
echo.
echo You can now run the dashboard with:
echo    cd react-app
echo    npm run dev
echo.
pause
