@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ================================================================================
echo Marketing Dashboard - Data Analysis Menu
echo ================================================================================
echo.
echo Choose processing mode:
echo.
echo [1] LITE MODE (Recommended) - Memory Efficient
echo     - Simple forecasting without Prophet
echo     - Memory usage: ~200-500 MB
echo     - Processing time: 30-60 seconds
echo     - Good for: Limited memory systems, quick analysis
echo.
echo [2] OPTIMIZED MODE - Prophet with Memory Optimization (NEW!)
echo     - Prophet forecasting with memory optimization
echo     - Memory usage: ~500MB-1GB (50-70%% savings)
echo     - Processing time: 3-7 minutes
echo     - Good for: 32-bit Python or limited RAM (4-8GB)
echo.
echo [3] FULL MODE - Advanced Analysis with Prophet
echo     - Advanced forecasting with Prophet + cmdstanpy
echo     - Memory usage: ~1-3 GB
echo     - Processing time: 5-10 minutes
echo     - Good for: Systems with 8GB+ RAM, detailed forecasts
echo.
echo [4] SEGMENT ANALYSIS - Detailed Segment Breakdown
echo     - Segment-level forecasting (brand/channel/product)
echo     - Memory usage: ~2-4 GB
echo     - Processing time: 10-20 minutes
echo     - Good for: Systems with 16GB+ RAM, segment insights
echo.
echo [5] CHECK SYSTEM MEMORY - View system info
echo.
echo [0] EXIT
echo.
set /p CHOICE="Enter your choice (0-5): "

if "%CHOICE%"=="1" goto LITE_MODE
if "%CHOICE%"=="2" goto OPTIMIZED_MODE
if "%CHOICE%"=="3" goto FULL_MODE
if "%CHOICE%"=="4" goto SEGMENT_MODE
if "%CHOICE%"=="5" goto CHECK_MEMORY
if "%CHOICE%"=="0" goto END

echo Invalid choice. Please try again.
pause
goto :EOF

:LITE_MODE
echo.
echo ================================================================================
echo Running LITE MODE
echo ================================================================================
call process_lite.bat
goto END

:OPTIMIZED_MODE
echo.
echo ================================================================================
echo Running OPTIMIZED MODE (Memory Optimized Prophet)
echo ================================================================================
echo.
set /p CONFIRM="This uses Prophet with memory optimization. Continue? (Y/N): "
if /i not "%CONFIRM%"=="Y" goto END

call process_optimized.bat
goto END

:FULL_MODE
echo.
echo ================================================================================
echo Running FULL MODE
echo ================================================================================
echo.
set /p CONFIRM="This may use 1-3 GB of memory. Continue? (Y/N): "
if /i not "%CONFIRM%"=="Y" goto END

if not exist raw_data.csv (
    echo [ERROR] raw_data.csv not found
    pause
    goto END
)

set INPUT_CSV_PATH=raw_data.csv
python scripts\process_marketing_data.py

echo.
echo Processing complete!
pause
goto END

:SEGMENT_MODE
echo.
echo ================================================================================
echo Running SEGMENT ANALYSIS
echo ================================================================================
echo.
set /p CONFIRM="This may use 2-4 GB of memory. Continue? (Y/N): "
if /i not "%CONFIRM%"=="Y" goto END

echo.
echo [1/3] Processing main data...
set INPUT_CSV_PATH=raw_data.csv
python scripts\process_marketing_data.py

if errorlevel 1 (
    echo [ERROR] Main processing failed
    pause
    goto END
)

echo.
echo [2/3] Processing segments...
python scripts\segment_processor.py

if errorlevel 1 (
    echo [WARNING] Segment processing failed
)

echo.
echo [3/3] Generating insights...
python scripts\insight_generator.py

if errorlevel 1 (
    echo [WARNING] Insight generation failed
)

echo.
echo Segment analysis complete!
pause
goto END

:CHECK_MEMORY
echo.
call check_memory.bat
goto :EOF

:END
echo.
echo Thank you for using Marketing Dashboard!
