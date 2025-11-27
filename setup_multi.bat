@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 스크립트 위치 기준 동적 경로 설정
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo ================================================================================
echo 여러 개의 Data Downloader - 설정 스크립트
echo ================================================================================
echo.
echo [1/6] 환경 확인 중...
echo.

REM Python 확인
python --version >nul 2>&1
if errorlevel 1 (
    echo [오류] Python이 설치되지 않았습니다
    echo Python 3.8 이상을 https://www.python.org/downloads/ 에서 설치하세요
    pause
    exit /b 1
)

REM Python 버전 확인
for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PYTHON_VERSION=%%v
echo [확인] Python %PYTHON_VERSION% 설치됨
echo.

echo [2/6] 설정 정보 입력
echo.

REM 기존 config_multi.json이 있는지 확인 (스크립트 위치 기준)
if exist "%SCRIPT_DIR%config_multi.json" (
    echo 기존 config_multi.json 파일을 발견했습니다
    set /p USE_EXISTING="기존 설정을 사용하시겠습니까? (Y/N): "
    if /i "!USE_EXISTING!"=="Y" (
        echo [확인] 기존 config_multi.json 사용

        REM config_multi.json에서 값 읽기 (스크립트 위치 기준)
        for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-Content '%SCRIPT_DIR%config_multi.json' | ConvertFrom-Json).google.credentials_path"`) do set GOOGLE_JSON=%%i

        echo.
        echo 로드된 설정:
        echo    JSON 파일: !GOOGLE_JSON!
        echo.

        goto SKIP_CONFIG_CREATE
    )
)

echo.
echo 설정 정보를 입력하세요:
echo.
echo [팁] JSON 파일 경로 예시:
echo       C:\Users\YourName\Downloads\service-account-key.json
echo.

set /p GOOGLE_JSON="Google Service Account JSON 파일 경로: "

REM 입력값 검증
if "%GOOGLE_JSON%"=="" (
    echo [오류] 경로가 입력되지 않았습니다
    pause
    exit /b 1
)

REM 파일 존재 여부 확인
if not exist "%GOOGLE_JSON%" (
    echo [오류] 파일을 찾을 수 없습니다: %GOOGLE_JSON%
    pause
    exit /b 1
)

REM 디렉토리가 아닌 파일인지 확인
if exist "%GOOGLE_JSON%\*" (
    echo [오류] 이것은 디렉토리입니다. JSON 파일의 전체 경로를 입력하세요: %GOOGLE_JSON%
    pause
    exit /b 1
)

REM 파일 확장자 확인 (.json)
echo %GOOGLE_JSON% | findstr /i /c:".json" >nul
if errorlevel 1 (
    echo [경고] 파일이 .json 확장자를 가지고 있지 않습니다
    set /p CONTINUE_JSON="계속하시겠습니까? (Y/N): "
    if /i "!CONTINUE_JSON!" NEQ "Y" exit /b 1
) else (
    echo [확인] JSON 확장자 확인됨
)

REM Python으로 JSON 유효성 검증
python -c "import json; json.load(open(r'%GOOGLE_JSON%', encoding='utf-8'))" 2>nul
if errorlevel 1 (
    echo [오류] JSON 형식이 올바르지 않거나 파일을 읽을 수 없습니다
    pause
    exit /b 1
)

echo [확인] JSON 파일 검증 완료

echo.
echo 이제 여러 개의 Sheet ID를 입력하세요
echo 각 Sheet는 동일한 worksheet 이름을 사용합니다
echo.

set /p WORKSHEET_NAME="Worksheet 이름 (예: Sheet1): "
if "%WORKSHEET_NAME%"=="" set WORKSHEET_NAME=Sheet1
echo [확인] Worksheet: %WORKSHEET_NAME%

echo.
set /p SHEET_COUNT="입력할 Sheet ID 개수: "

REM 입력값이 비어있는지 확인
if "%SHEET_COUNT%"=="" (
    echo [오류] 숫자를 입력하세요
    pause
    exit /b 1
)

REM 숫자인지 간단하게 확인 (산술 연산으로 검증)
set /a TEST_NUM=%SHEET_COUNT% 2>nul
if not "%TEST_NUM%"=="%SHEET_COUNT%" (
    echo [오류] 올바른 숫자를 입력하세요
    pause
    exit /b 1
)

REM 0보다 큰지 확인
if %SHEET_COUNT% LEQ 0 (
    echo [오류] 1 이상의 숫자를 입력하세요
    pause
    exit /b 1
)

echo.
echo %SHEET_COUNT%개의 Sheet ID를 입력하세요:
echo.

set SHEET_IDS=
set SHEET_DESCS=

for /l %%i in (1,1,%SHEET_COUNT%) do (
    echo [Sheet %%i/%SHEET_COUNT%]
    set /p SHEET_ID="  Sheet ID: "
    set /p SHEET_DESC="  설명 (선택사항): "

    if "!SHEET_DESC!"=="" set SHEET_DESC=Sheet %%i

    if %%i==1 (
        set SHEET_IDS=!SHEET_ID!
        set SHEET_DESCS=!SHEET_DESC!
    ) else (
        set SHEET_IDS=!SHEET_IDS!,!SHEET_ID!
        set SHEET_DESCS=!SHEET_DESCS!,!SHEET_DESC!
    )
    echo   [확인] Sheet %%i 등록됨
    echo.
)

:CONFIG_DONE

echo.
echo [3/6] Config 파일 생성 중...
echo.

REM PowerShell로 JSON 생성 (BOM 없이 UTF-8로 저장, 스크립트 위치 기준)
powershell -Command "$sheets = @(); $ids = '%SHEET_IDS%' -split ','; $descs = '%SHEET_DESCS%' -split ','; for ($i = 0; $i -lt $ids.Length; $i++) { $sheets += @{sheet_id=$ids[$i]; worksheet_name='%WORKSHEET_NAME%'; description=$descs[$i]} }; $config = @{google=@{credentials_path='%GOOGLE_JSON:\=\\%'; sheets=$sheets; output=@{directory='data/type'; merged_filename='merged_data.csv'}}}; $json = $config | ConvertTo-Json -Depth 10; [System.IO.File]::WriteAllText('%SCRIPT_DIR%config_multi.json', $json, [System.Text.UTF8Encoding]::new($false))"

if exist "%SCRIPT_DIR%config_multi.json" (
    echo [확인] config_multi.json 생성 완료
) else (
    echo [오류] config_multi.json 생성 실패
    pause
    exit /b 1
)

:SKIP_CONFIG_CREATE

echo.
echo [4/6] pip 업그레이드 중...
echo.

python -m pip install --upgrade pip >nul 2>&1
echo [확인] pip 업그레이드 완료

echo.
echo [5/6] 필요한 패키지 설치 중...
echo.

REM requirements_multi.txt가 있는지 확인
if exist requirements_multi.txt (
    pip install -r requirements_multi.txt
    if errorlevel 1 (
        echo.
        echo [경고] 일부 패키지 설치에 실패했습니다
        set /p CONTINUE="계속하시겠습니까? (Y/N): "
        if /i "!CONTINUE!" NEQ "Y" exit /b 1
    ) else (
        echo [확인] 패키지 설치 완료
    )
) else (
    echo [경고] requirements_multi.txt 파일을 찾을 수 없습니다
    echo 수동으로 필요한 패키지를 설치하세요:
    echo   pip install gspread oauth2client
    pause
)

echo.
echo [6/6] 데이터 다운로드 (선택사항)
echo.

set /p RUN_DOWNLOAD="지금 데이터를 다운로드하시겠습니까? (Y/N): "
if /i "%RUN_DOWNLOAD%"=="Y" (
    echo.
    echo ========================================================================
    echo 여러 개의 Google Sheets에서 데이터 다운로드 중
    echo ========================================================================
    echo.

    python scripts\fetch_sheets_multi.py

    if errorlevel 1 (
        echo.
        echo [오류] 데이터 다운로드 실패
        goto DOWNLOAD_FAILED
    )

    REM 성공 확인
    if exist data\type\merged_data.csv (
        echo.
        echo ====================================================================
        echo [성공] 데이터 다운로드 및 통합 완료!
        echo ====================================================================
        echo.
        echo 저장된 파일: data\type\
        dir /b data\type\*.csv 2>nul
        echo.
        goto DOWNLOAD_SUCCESS
    ) else (
        echo.
        echo [오류] 통합 파일이 생성되지 않았습니다
        goto DOWNLOAD_FAILED
    )
)

goto SETUP_COMPLETE

:DOWNLOAD_FAILED
echo.
echo ========================================================================
echo [실패] 다운로드가 완료되지 않았습니다
echo ========================================================================
echo.
echo 확인사항:
echo 1. Service Account가 모든 시트에 접근 권한이 있는지 확인
echo 2. Sheet ID가 모두 올바른지 확인
echo 3. Worksheet 이름이 모든 시트에 존재하는지 확인
echo 4. Google Sheets API가 활성화되어 있는지 확인
echo.
goto SETUP_COMPLETE

:DOWNLOAD_SUCCESS
echo 다운로드가 성공적으로 완료되었습니다!
echo.

:SETUP_COMPLETE
echo.
echo ================================================================================
echo 설정 완료!
echo ================================================================================
echo.
echo 수동으로 데이터를 다운로드하려면 다음 명령을 실행하세요:
echo    python scripts\fetch_sheets_multi.py
echo.
echo Config 파일 위치: config_multi.json
echo 데이터 저장 위치: data\type\
echo.
pause
