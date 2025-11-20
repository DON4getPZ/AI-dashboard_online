@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Testing setup_analysis.bat Flow
echo ========================================
echo.

REM Simulate [9/9] step
echo.
echo [9/9] Data fetch and analysis test (optional)
echo.

REM Test 1: Empty input (Enter only)
echo Test 1: Pressing Enter only
set /p RUN_TEST="Run data fetch test? (Y/N, default: N): "
if "%RUN_TEST%"=="" set RUN_TEST=N
echo [INPUT] Selected: %RUN_TEST%
echo.

if /i "%RUN_TEST%"=="Y" (
    echo [Test would run here]
) else (
    echo [Skipping test]
)

goto TEST_END

:TEST_END
echo.
echo ====================================
echo This is the completion message
echo ====================================
echo.
echo If you see this, the flow is correct!
echo.
pause
