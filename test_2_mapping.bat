@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ============================================================
echo  [2/3] 데이터 Mapping 테스트 (CSV → 가공 데이터)
echo ============================================================
echo.

:: ============================================================
:: 1단계: clients.json 설정 확인
:: ============================================================
set CONFIG_FILE=config\clients.json

if exist "%CONFIG_FILE%" (
    echo [설정 확인] %CONFIG_FILE% 파일이 존재합니다.
    echo.
    echo 현재 등록된 클라이언트:
    echo ------------------------------------------------------------
    python scripts/add_client.py --list
    echo ------------------------------------------------------------
    echo.
    echo [1] Mapping 테스트 진행
    echo [Q] 종료
    echo.
    echo * 클라이언트 추가: test_1_fetch.bat [2]번 옵션 사용
    echo.
    set /p CONFIG_CHOICE="선택: "

    if /i "!CONFIG_CHOICE!"=="Q" goto :EOF
    if /i "!CONFIG_CHOICE!"=="1" goto :USE_EXISTING

    echo 잘못된 선택입니다.
    goto :EOF
) else (
    echo [설정 확인] %CONFIG_FILE% 파일이 존재하지 않습니다.
    echo.
    echo [안내] test_1_fetch.bat 를 먼저 실행하여 설정을 생성하세요.
    echo.
    pause
    goto :EOF
)

:USE_EXISTING
echo.
echo ============================================================
echo  클라이언트 선택
echo ============================================================

:: 클라이언트 ID 입력
set /p CLIENT_ID="클라이언트 ID 입력 (빈값=레거시 모드): "

if "%CLIENT_ID%"=="" (
    echo.
    echo [레거시 모드] data/ 경로 사용
    set CLIENT_ARG=
    set DATA_PATH=data
) else (
    echo.
    echo [멀티클라이언트 모드] data/%CLIENT_ID%/ 경로 사용
    set CLIENT_ARG=--client %CLIENT_ID%
    set DATA_PATH=data\%CLIENT_ID%
)

:: 입력 데이터 존재 확인
echo.
echo [데이터 확인]
if exist "%DATA_PATH%\raw" (
    echo   raw 폴더: 존재함
    dir /b "%DATA_PATH%\raw\*.csv" 2>nul | find /c ".csv" > temp_count.txt
    set /p RAW_COUNT=<temp_count.txt
    del temp_count.txt
    echo   CSV 파일: !RAW_COUNT!개
) else (
    echo   raw 폴더: 존재하지 않음
    echo.
    echo [경고] 먼저 test_1_fetch.bat 로 데이터를 가져오세요.
)

echo.
echo ============================================================
echo  실행할 스크립트 선택
echo ============================================================
echo.
echo [1] process_marketing_data.py  - 마케팅 원본 데이터 가공
echo [A] 전체 실행
echo [Q] 종료
echo.
set /p CHOICE="선택: "

if /i "%CHOICE%"=="Q" goto :EOF
if /i "%CHOICE%"=="1" goto :PROCESS_MARKETING
if /i "%CHOICE%"=="A" goto :MAP_ALL

echo 잘못된 선택입니다.
goto :EOF

:PROCESS_MARKETING
echo.
echo [실행] python scripts/process_marketing_data.py %CLIENT_ARG%
python scripts/process_marketing_data.py %CLIENT_ARG%
goto :DONE

:MAP_ALL
echo.
echo ============================================================
echo  전체 Mapping 실행
echo ============================================================

echo.
echo [1/1] process_marketing_data.py
python scripts/process_marketing_data.py %CLIENT_ARG%
if errorlevel 1 (
    echo [경고] process_marketing_data.py 실패
)

goto :DONE

:DONE
echo.
echo ============================================================
echo  Mapping 완료
echo ============================================================
if not "%CLIENT_ID%"=="" (
    echo  출력 경로: data/%CLIENT_ID%/
)
echo.
echo  생성 파일:
echo    - type/merged_data.csv (유형별 통합 데이터)
echo.
pause
