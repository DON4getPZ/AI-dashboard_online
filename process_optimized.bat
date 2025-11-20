@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ================================================================================
echo Marketing Dashboard - Memory Optimized Processing
echo ================================================================================
echo.
echo 이 버전은 메모리 최적화 기법을 사용합니다:
echo   • 청크 단위 데이터 처리
echo   • 데이터 타입 최적화 (float64 → float32)
echo   • 문자열을 category로 변환
echo   • 가비지 컬렉션 강제 실행
echo   • Prophet 모델 순차 학습 및 즉시 메모리 해제
echo   • 메모리 사용량 모니터링
echo.
echo 예상 메모리 사용량: ~500MB-1GB (일반 버전 대비 50-70%% 절감)
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
echo [1/1] Processing data (memory optimized mode)...
echo ================================================================================
echo.

REM psutil 설치 확인 (메모리 모니터링용)
python -c "import psutil" 2>nul
if errorlevel 1 (
    echo [INFO] psutil not installed - installing for memory monitoring...
    pip install psutil --quiet
)

set INPUT_CSV_PATH=raw_data.csv
python scripts\process_marketing_data_optimized.py

if errorlevel 1 (
    echo.
    echo ========================================================================
    echo [ERROR] Data processing failed
    echo ========================================================================
    echo.
    echo 여전히 메모리 부족 오류가 발생하면:
    echo   1. 64-bit Python 설치 (가장 효과적)
    echo   2. process_lite.bat 사용 (Prophet 없음)
    echo   3. 데이터 기간을 줄여서 처리
    echo.
    pause
    exit /b 1
)

echo.
echo ================================================================================
echo Processing Complete! (Memory Optimized)
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
echo.
echo You can now run the dashboard with:
echo    cd react-app
echo    npm run dev
echo.
pause
