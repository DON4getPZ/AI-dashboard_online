@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ============================================================
echo  [1/3] 데이터 Fetch 테스트 (Google Sheets → CSV)
echo ============================================================
echo.

:: ============================================================
:: 1단계: clients.json 설정 확인
:: ============================================================
set CONFIG_FILE=config\clients.json

if exist "%CONFIG_FILE%" (
    echo [설정 확인] %CONFIG_FILE% 파일이 존재합니다.
    echo.
    echo 현재 설정 내용:
    echo ------------------------------------------------------------
    type "%CONFIG_FILE%" | findstr /C:"\"id\"" /C:"\"name\"" /C:"\"sheetId\""
    echo ------------------------------------------------------------
    echo.
    echo [1] 기존 설정 사용
    echo [2] 신규 설정 작성
    echo [Q] 종료
    echo.
    set /p CONFIG_CHOICE="선택: "

    if /i "!CONFIG_CHOICE!"=="Q" goto :EOF
    if /i "!CONFIG_CHOICE!"=="2" goto :CREATE_CONFIG
    if /i "!CONFIG_CHOICE!"=="1" goto :USE_EXISTING

    echo 잘못된 선택입니다. 기존 설정을 사용합니다.
    goto :USE_EXISTING
) else (
    echo [설정 확인] %CONFIG_FILE% 파일이 존재하지 않습니다.
    echo.
    goto :CREATE_CONFIG
)

:CREATE_CONFIG
echo ============================================================
echo  clients.json 신규 작성
echo ============================================================
echo.

:: --------------------------------------------------------
:: Google 인증 설정 (필수)
:: --------------------------------------------------------
echo [Google 인증 설정]
echo Service Account JSON 파일 경로를 입력하세요.
echo 예: C:\Users\YourName\Downloads\service-account-key.json
echo.
set /p CREDENTIALS_PATH="credentials.json 경로: "

:: 입력값 검증
if "%CREDENTIALS_PATH%"=="" (
    echo [경고] 경로가 입력되지 않았습니다. 환경변수 GOOGLE_CREDENTIALS를 사용합니다.
    set CREDENTIALS_PATH=
    goto :SKIP_CRED_CHECK
)

:: 파일 존재 여부 확인
if not exist "%CREDENTIALS_PATH%" (
    echo [오류] 파일을 찾을 수 없습니다: %CREDENTIALS_PATH%
    pause
    goto :CREATE_CONFIG
)

:: JSON 파일 검증
echo %CREDENTIALS_PATH% | findstr /i /c:".json" >nul
if errorlevel 1 (
    echo [경고] 파일이 .json 확장자를 가지고 있지 않습니다.
    set /p CONTINUE_JSON="계속하시겠습니까? (Y/N): "
    if /i "!CONTINUE_JSON!" NEQ "Y" goto :CREATE_CONFIG
)

:: Python으로 JSON 유효성 검증
python -c "import json; json.load(open(r'%CREDENTIALS_PATH%', encoding='utf-8'))" 2>nul
if errorlevel 1 (
    echo [오류] JSON 형식이 올바르지 않거나 파일을 읽을 수 없습니다.
    pause
    goto :CREATE_CONFIG
)
echo [확인] JSON 파일 검증 완료
:SKIP_CRED_CHECK

echo.
:: --------------------------------------------------------
:: 클라이언트 정보 입력
:: --------------------------------------------------------
echo [클라이언트 정보]
set /p NEW_CLIENT_ID="클라이언트 ID (예: clientA): "
if "%NEW_CLIENT_ID%"=="" set NEW_CLIENT_ID=clientA

set /p NEW_CLIENT_NAME="클라이언트 이름 (예: 기본 클라이언트): "
if "%NEW_CLIENT_NAME%"=="" set NEW_CLIENT_NAME=기본 클라이언트

echo.
:: --------------------------------------------------------
:: Google Sheets 설정
:: --------------------------------------------------------
echo [Google Sheets 설정]
echo.
echo [Raw 데이터 Sheet]
set /p RAW_SHEET_ID="  Sheet ID: "
set /p RAW_WORKSHEET="  Worksheet 이름 (기본값=data_integration): "
if "%RAW_WORKSHEET%"=="" set RAW_WORKSHEET=data_integration

echo.
echo [Multi 데이터 Sheet 설정]
set /p MULTI_SHEET_COUNT="Multi 데이터 Sheet 개수 (0=사용안함): "
if "%MULTI_SHEET_COUNT%"=="" set MULTI_SHEET_COUNT=0

:: 숫자 검증
set /a TEST_NUM=%MULTI_SHEET_COUNT% 2>nul
if not "%TEST_NUM%"=="%MULTI_SHEET_COUNT%" (
    echo [오류] 올바른 숫자를 입력하세요.
    set MULTI_SHEET_COUNT=0
)

:: Multi Sheet ID 수집
set MULTI_SHEET_IDS=
set MULTI_SHEET_NAMES=

if %MULTI_SHEET_COUNT% GTR 0 (
    echo.
    echo %MULTI_SHEET_COUNT%개의 Multi Sheet 정보를 입력하세요:
    echo.

    for /l %%i in (1,1,%MULTI_SHEET_COUNT%) do (
        echo [Multi Sheet %%i/%MULTI_SHEET_COUNT%]
        set /p MULTI_ID_%%i="  Sheet ID: "
        set /p MULTI_NAME_%%i="  Worksheet 이름 (예: meta_ads): "

        if "!MULTI_NAME_%%i!"=="" set MULTI_NAME_%%i=Sheet%%i

        if %%i==1 (
            set MULTI_SHEET_IDS=!MULTI_ID_%%i!
            set MULTI_SHEET_NAMES=!MULTI_NAME_%%i!
        ) else (
            set MULTI_SHEET_IDS=!MULTI_SHEET_IDS!,!MULTI_ID_%%i!
            set MULTI_SHEET_NAMES=!MULTI_SHEET_NAMES!,!MULTI_NAME_%%i!
        )
        echo   [확인] Multi Sheet %%i 등록됨
        echo.
    )
)

echo.
echo [Creative 데이터 Sheet]
set /p CREATIVE_SHEET_ID="  Sheet ID (빈값=Raw와 동일): "
if "%CREATIVE_SHEET_ID%"=="" set CREATIVE_SHEET_ID=%RAW_SHEET_ID%
set /p CREATIVE_WORKSHEET="  Worksheet 이름 (기본값=creative_data): "
if "%CREATIVE_WORKSHEET%"=="" set CREATIVE_WORKSHEET=creative_data

echo.
echo [Creative URL Sheet]
set /p CREATIVE_URL_SHEET_ID="  Sheet ID (빈값=Creative와 동일): "
if "%CREATIVE_URL_SHEET_ID%"=="" set CREATIVE_URL_SHEET_ID=%CREATIVE_SHEET_ID%
set /p CREATIVE_URL_WORKSHEET="  Worksheet 이름 (기본값=creative_url): "
if "%CREATIVE_URL_WORKSHEET%"=="" set CREATIVE_URL_WORKSHEET=creative_url

echo.
echo [GA4 데이터 Sheet]
set /p GA4_SHEET_ID="  Sheet ID (빈값=Raw와 동일): "
if "%GA4_SHEET_ID%"=="" set GA4_SHEET_ID=%RAW_SHEET_ID%
set /p GA4_WORKSHEET="  Worksheet 이름 (기본값=ga4_funnel): "
if "%GA4_WORKSHEET%"=="" set GA4_WORKSHEET=ga4_funnel

:: config 디렉토리 생성
if not exist "config" mkdir config

:: --------------------------------------------------------
:: clients.json 생성 (PowerShell 사용)
:: --------------------------------------------------------
echo.
echo [설정 파일 생성 중...]

:: Multi sheets JSON 배열 생성
set MULTI_SHEETS_JSON=[]
if %MULTI_SHEET_COUNT% GTR 0 (
    set MULTI_SHEETS_JSON=
    for /l %%i in (1,1,%MULTI_SHEET_COUNT%) do (
        if %%i==1 (
            set MULTI_SHEETS_JSON=[{"sheetId": "!MULTI_ID_%%i!", "worksheet": "!MULTI_NAME_%%i!"}
        ) else (
            set MULTI_SHEETS_JSON=!MULTI_SHEETS_JSON!, {"sheetId": "!MULTI_ID_%%i!", "worksheet": "!MULTI_NAME_%%i!"}
        )
    )
    set MULTI_SHEETS_JSON=!MULTI_SHEETS_JSON!]
)

:: credentials_path 처리 (백슬래시 이스케이프)
set CRED_PATH_ESCAPED=%CREDENTIALS_PATH:\=\\%

:: clients.json 생성
(
echo {
echo   "google": {
echo     "credentials_path": "%CRED_PATH_ESCAPED%"
echo   },
echo   "clients": [
echo     {
echo       "id": "%NEW_CLIENT_ID%",
echo       "name": "%NEW_CLIENT_NAME%",
echo       "subdomain": "%NEW_CLIENT_ID%",
echo       "sheets": {
echo         "raw": {
echo           "sheetId": "%RAW_SHEET_ID%",
echo           "worksheet": "%RAW_WORKSHEET%"
echo         },
echo         "multi": !MULTI_SHEETS_JSON!,
echo         "creative": {
echo           "sheetId": "%CREATIVE_SHEET_ID%",
echo           "worksheet": "%CREATIVE_WORKSHEET%"
echo         },
echo         "creativeUrl": {
echo           "sheetId": "%CREATIVE_URL_SHEET_ID%",
echo           "worksheet": "%CREATIVE_URL_WORKSHEET%"
echo         },
echo         "ga4": {
echo           "sheetId": "%GA4_SHEET_ID%",
echo           "worksheet": "%GA4_WORKSHEET%"
echo         }
echo       },
echo       "active": true
echo     }
echo   ],
echo   "defaults": {
echo     "timezone": "Asia/Seoul",
echo     "currency": "KRW",
echo     "dateFormat": "YYYY-MM-DD"
echo   }
echo }
) > "%CONFIG_FILE%"

echo.
echo [완료] %CONFIG_FILE% 파일이 생성되었습니다.
echo.
echo 저장된 설정:
echo   - Google Credentials: %CREDENTIALS_PATH%
echo   - 클라이언트 ID: %NEW_CLIENT_ID%
echo   - Raw Sheet: %RAW_SHEET_ID% / %RAW_WORKSHEET%
echo   - Multi Sheets: %MULTI_SHEET_COUNT%개
echo   - Creative Sheet: %CREATIVE_SHEET_ID% / %CREATIVE_WORKSHEET%
echo   - Creative URL: %CREATIVE_URL_SHEET_ID% / %CREATIVE_URL_WORKSHEET%
echo   - GA4 Sheet: %GA4_SHEET_ID% / %GA4_WORKSHEET%

echo.
goto :USE_EXISTING

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
) else (
    echo.
    echo [멀티클라이언트 모드] data/%CLIENT_ID%/ 경로 사용
    set CLIENT_ARG=--client %CLIENT_ID%
)

echo.
echo ============================================================
echo  실행할 스크립트 선택
echo ============================================================
echo.
echo [1] fetch_google_sheets.py    - 광고 성과 원본 데이터
echo [2] fetch_sheets_multi.py     - 다중 시트 (채널별 분석)
echo [3] fetch_creative_sheets.py  - 크리에이티브 성과 데이터
echo [4] fetch_creative_url.py     - 크리에이티브 이미지 URL
echo [5] fetch_ga4_sheets.py       - GA4 퍼널 데이터
echo [A] 전체 실행
echo [Q] 종료
echo.
set /p CHOICE="선택: "

if /i "%CHOICE%"=="Q" goto :EOF
if /i "%CHOICE%"=="1" goto :FETCH_RAW
if /i "%CHOICE%"=="2" goto :FETCH_MULTI
if /i "%CHOICE%"=="3" goto :FETCH_CREATIVE
if /i "%CHOICE%"=="4" goto :FETCH_CREATIVE_URL
if /i "%CHOICE%"=="5" goto :FETCH_GA4
if /i "%CHOICE%"=="A" goto :FETCH_ALL

echo 잘못된 선택입니다.
goto :EOF

:FETCH_RAW
echo.
echo [실행] python scripts/fetch_google_sheets.py %CLIENT_ARG%
python scripts/fetch_google_sheets.py %CLIENT_ARG%
goto :DONE

:FETCH_MULTI
echo.
echo [실행] python scripts/fetch_sheets_multi.py %CLIENT_ARG%
python scripts/fetch_sheets_multi.py %CLIENT_ARG%
goto :DONE

:FETCH_CREATIVE
echo.
echo [실행] python scripts/fetch_creative_sheets.py %CLIENT_ARG%
python scripts/fetch_creative_sheets.py %CLIENT_ARG%
goto :DONE

:FETCH_CREATIVE_URL
echo.
echo [실행] python scripts/fetch_creative_url.py %CLIENT_ARG%
python scripts/fetch_creative_url.py %CLIENT_ARG%
goto :DONE

:FETCH_GA4
echo.
echo [실행] python scripts/fetch_ga4_sheets.py %CLIENT_ARG%
python scripts/fetch_ga4_sheets.py %CLIENT_ARG%
goto :DONE

:FETCH_ALL
echo.
echo ============================================================
echo  전체 Fetch 실행
echo ============================================================

echo.
echo [1/5] fetch_google_sheets.py
python scripts/fetch_google_sheets.py %CLIENT_ARG%
if errorlevel 1 (
    echo [경고] fetch_google_sheets.py 실패 - 계속 진행
)

echo.
echo [2/5] fetch_sheets_multi.py
python scripts/fetch_sheets_multi.py %CLIENT_ARG%
if errorlevel 1 (
    echo [경고] fetch_sheets_multi.py 실패 - 계속 진행
)

echo.
echo [3/5] fetch_creative_sheets.py
python scripts/fetch_creative_sheets.py %CLIENT_ARG%
if errorlevel 1 (
    echo [경고] fetch_creative_sheets.py 실패 - 계속 진행
)

echo.
echo [4/5] fetch_creative_url.py
python scripts/fetch_creative_url.py %CLIENT_ARG%
if errorlevel 1 (
    echo [경고] fetch_creative_url.py 실패 - 계속 진행
)

echo.
echo [5/5] fetch_ga4_sheets.py
python scripts/fetch_ga4_sheets.py %CLIENT_ARG%
if errorlevel 1 (
    echo [경고] fetch_ga4_sheets.py 실패 - 계속 진행
)

goto :DONE

:DONE
echo.
echo ============================================================
echo  Fetch 완료
echo ============================================================
if not "%CLIENT_ID%"=="" (
    echo  출력 경로: data/%CLIENT_ID%/
)
echo.
pause
