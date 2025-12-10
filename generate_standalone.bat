@echo off
chcp 65001 >nul
cls

echo ==========================================
echo  독립 실행형 HTML 대시보드 생성 도구
echo ==========================================
echo.
echo 이 스크립트는 5개의 독립 실행형 HTML 파일을 생성합니다:
echo   - marketing_dashboard_v3_standalone.html
echo   - creative_analysis_standalone.html
echo   - timeseries_analysis_standalone.html
echo   - funnel_dashboard_standalone.html
echo   - type_dashboard_standalone.html
echo.
echo ==========================================
echo.

set /p choice="작업을 시작하시겠습니까? (Y/N): "

if /i "%choice%"=="Y" goto start
if /i "%choice%"=="y" goto start
goto cancel

:start
echo.
echo 작업을 시작합니다...
echo.

python generate_standalone.py

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo  ✅ 작업이 완료되었습니다!
    echo ==========================================
    echo.
    echo 생성된 파일은 data 폴더에서 확인하실 수 있습니다.
    echo.
) else (
    echo.
    echo ==========================================
    echo  ❌ 오류가 발생했습니다.
    echo ==========================================
    echo.
)

goto end

:cancel
echo.
echo 작업이 취소되었습니다.
echo.

:end
pause
