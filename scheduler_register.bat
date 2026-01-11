@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: ============================================================
:: Windows 작업 스케줄러 등록
:: ============================================================
::
:: 기능:
::   - deploy_all.bat을 매일 지정 시간에 자동 실행하도록 등록
::   - 관리자 권한 필요
::
:: 사용법:
::   scheduler_register.bat          - 대화형 설정
::   scheduler_register.bat --remove - 등록된 작업 삭제
::
:: ============================================================

echo ============================================================
echo  Windows 작업 스케줄러 등록
echo ============================================================
echo.

:: 관리자 권한 확인
net session >nul 2>&1
if errorlevel 1 (
    echo [오류] 관리자 권한이 필요합니다.
    echo [안내] 이 파일을 우클릭하여 "관리자 권한으로 실행"하세요.
    echo.
    pause
    goto :EOF
)

set TASK_NAME=MarketingDashboard_DailyETL
set SCRIPT_PATH=%~dp0deploy_all.bat

:: 인자 확인
if /i "%~1"=="--remove" goto :REMOVE_TASK

:: ============================================================
:: 기존 작업 확인
:: ============================================================
schtasks /query /tn "%TASK_NAME%" >nul 2>&1
if not errorlevel 1 (
    echo [안내] 기존 등록된 작업이 있습니다: %TASK_NAME%
    echo.
    echo [1] 기존 작업 유지
    echo [2] 기존 작업 삭제 후 재등록
    echo [3] 기존 작업 삭제만
    echo [Q] 종료
    echo.
    set /p EXISTING_CHOICE="선택: "

    if /i "!EXISTING_CHOICE!"=="Q" goto :EOF
    if /i "!EXISTING_CHOICE!"=="1" goto :SHOW_INFO
    if /i "!EXISTING_CHOICE!"=="3" goto :REMOVE_TASK
    if /i "!EXISTING_CHOICE!"=="2" (
        schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1
        echo [완료] 기존 작업 삭제됨
        echo.
    )
)

:: ============================================================
:: 실행 시간 설정
:: ============================================================
echo [실행 시간 설정]
echo.
set /p SCHEDULE_HOUR="실행 시간 (0-23, 기본값=6): "
if "%SCHEDULE_HOUR%"=="" set SCHEDULE_HOUR=6

set /p SCHEDULE_MINUTE="실행 분 (0-59, 기본값=0): "
if "%SCHEDULE_MINUTE%"=="" set SCHEDULE_MINUTE=0

:: 두 자리로 포맷
if %SCHEDULE_HOUR% LSS 10 set SCHEDULE_HOUR=0%SCHEDULE_HOUR%
if %SCHEDULE_MINUTE% LSS 10 set SCHEDULE_MINUTE=0%SCHEDULE_MINUTE%

set SCHEDULE_TIME=%SCHEDULE_HOUR%:%SCHEDULE_MINUTE%

echo.
echo ============================================================
echo  등록 정보 확인
echo ============================================================
echo.
echo  작업 이름: %TASK_NAME%
echo  실행 파일: %SCRIPT_PATH%
echo  실행 시간: 매일 %SCHEDULE_TIME%
echo  실행 인자: --auto (확인 없이 자동 실행)
echo.

set /p CONFIRM_REGISTER="이대로 등록하시겠습니까? (Y/N): "
if /i not "%CONFIRM_REGISTER%"=="Y" (
    echo [취소] 등록이 취소되었습니다.
    pause
    goto :EOF
)

:: ============================================================
:: 작업 스케줄러 등록
:: ============================================================
echo.
echo [등록 중...]

schtasks /create ^
    /tn "%TASK_NAME%" ^
    /tr "\"%SCRIPT_PATH%\" --auto" ^
    /sc daily ^
    /st %SCHEDULE_TIME% ^
    /rl highest ^
    /f

if errorlevel 1 (
    echo.
    echo [오류] 작업 스케줄러 등록 실패
    echo [안내] 수동으로 등록하려면 아래 명령을 사용하세요:
    echo.
    echo   schtasks /create /tn "%TASK_NAME%" /tr "%SCRIPT_PATH% --auto" /sc daily /st %SCHEDULE_TIME%
    echo.
    pause
    goto :EOF
)

echo.
echo [완료] 작업 스케줄러 등록 성공
goto :SHOW_INFO

:: ============================================================
:: 등록된 작업 정보 표시
:: ============================================================
:SHOW_INFO
echo.
echo ============================================================
echo  등록된 작업 정보
echo ============================================================
echo.
schtasks /query /tn "%TASK_NAME%" /v /fo list | findstr /i "TaskName Status Author Run"
echo.
echo [관리 명령어]
echo   확인: schtasks /query /tn "%TASK_NAME%"
echo   실행: schtasks /run /tn "%TASK_NAME%"
echo   삭제: schtasks /delete /tn "%TASK_NAME%" /f
echo.
pause
goto :EOF

:: ============================================================
:: 작업 삭제
:: ============================================================
:REMOVE_TASK
echo.
echo [작업 삭제 중...]

schtasks /delete /tn "%TASK_NAME%" /f

if errorlevel 1 (
    echo [오류] 작업 삭제 실패 (작업이 없거나 권한 부족)
) else (
    echo [완료] 작업 '%TASK_NAME%' 삭제됨
)

echo.
pause
goto :EOF
