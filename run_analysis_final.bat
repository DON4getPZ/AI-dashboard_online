@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ================================================================================
echo Marketing Dashboard - Data Analysis Menu
echo ================================================================================
echo.
echo Choose processing mode:
echo.
echo [1] SEGMENT ANALYSIS - Detailed Segment Breakdown + Business Viz + Dimension Analysis
echo     - Segment-level forecasting (brand/channel/product/promotion)
echo     - Business visualization generation (ROAS, revenue, budget)
echo     - AARRR Funnel analysis with advanced analytics
echo     - Type-based dimension detail analysis (7 dimension CSVs)
echo     - Prophet time-series forecasting by category
echo     - Type insights generation (brand/product/promotion performance)
echo     - Memory usage: ~2-4 GB
echo     - Processing time: 10-20 minutes
echo.
echo [2] CHECK SYSTEM MEMORY - View system info
echo.
echo [0] EXIT
echo.
set /p CHOICE="Enter your choice (0-2): "

if "%CHOICE%"=="1" goto SEGMENT_MODE
if "%CHOICE%"=="2" goto CHECK_MEMORY
if "%CHOICE%"=="0" goto END

echo Invalid choice. Please try again.
pause
goto :EOF

:SEGMENT_MODE
echo.
echo ================================================================================
echo Running SEGMENT ANALYSIS
echo ================================================================================
echo.
set /p CONFIRM="This may use 2-4 GB of memory. Continue? (Y/N): "
if /i not "%CONFIRM%"=="Y" goto END

echo.
echo [1/10] Processing main data...
python scripts\process_marketing_data.py

if errorlevel 1 (
    echo [ERROR] Main processing failed
    pause
    goto END
)

echo.
echo [2/10] Processing segments...
python scripts\segment_processor.py

if errorlevel 1 (
    echo [WARNING] Segment processing failed
)

echo.
echo [3/10] Generating insights...
python scripts\insight_generator.py

if errorlevel 1 (
    echo [WARNING] Insight generation failed
)

echo.
echo [4/10] Creating business visualizations...
python scripts\visualization_generator.py

if errorlevel 1 (
    echo [WARNING] Visualization generation failed
)

echo.
echo [5/10] Generating AARRR funnel analysis with advanced analytics...
cd scripts
python generate_funnel_data.py
cd ..

if errorlevel 1 (
    echo [WARNING] Funnel analysis generation failed
)

echo.
echo [6/10] Generating channel engagement data...
python scripts\generate_engagement_data.py

if errorlevel 1 (
    echo [WARNING] Channel engagement data generation failed
)

echo.
echo [7/10] Running category and daily summary analysis...
python scripts\run_multi_analysis.py

if errorlevel 1 (
    echo [WARNING] Multi analysis failed
)

echo.
echo [8/10] Generating dimension-level detail analysis...
python scripts\multi_analysis_dimension_detail.py

if errorlevel 1 (
    echo [WARNING] Dimension detail analysis failed
)

echo.
echo [9/10] Running Prophet time-series forecasting...
python scripts\multi_analysis_prophet_forecast.py

if errorlevel 1 (
    echo [WARNING] Prophet forecasting failed
)

echo.
echo [10/10] Generating type insights (brand/product/promotion)...
python scripts\generate_type_insights.py

if errorlevel 1 (
    echo [WARNING] Type insights generation failed
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
