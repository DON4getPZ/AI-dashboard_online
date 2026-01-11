@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: ============================================================
:: 단일 클라이언트 배포 (ETL → Git Push)
:: ============================================================
::
:: 사용법:
::   deploy.bat                    - 대화형 클라이언트 선택
::   deploy.bat --client clientA   - 특정 클라이언트 직접 지정
::   deploy.bat --skip-etl         - ETL 건너뛰고 Git Push만
::
:: ============================================================

echo ============================================================
echo  Marketing Dashboard - Deploy (Single Client)
echo ============================================================
echo.

set CONFIG_FILE=config\clients.json
set SKIP_ETL=0
set CLIENT_ID=

:: ============================================================
:: 인자 파싱
:: ============================================================
:PARSE_ARGS
if "%~1"=="" goto :CHECK_CONFIG
if /i "%~1"=="--client" (
    set CLIENT_ID=%~2
    shift
    shift
    goto :PARSE_ARGS
)
if /i "%~1"=="--skip-etl" (
    set SKIP_ETL=1
    shift
    goto :PARSE_ARGS
)
shift
goto :PARSE_ARGS

:: ============================================================
:: Git 설정 확인
:: ============================================================
:CHECK_GIT
echo [Git 설정 확인]

:: Git 설치 확인
git --version >nul 2>&1
if errorlevel 1 (
    echo [오류] Git이 설치되어 있지 않습니다.
    echo [안내] git_setup.bat을 실행하세요.
    pause
    goto :EOF
)

:: Git 저장소 확인
if not exist ".git" (
    echo [오류] Git 저장소가 아닙니다.
    echo [안내] git_setup.bat을 실행하세요.
    pause
    goto :EOF
)

:: Remote 확인
for /f "tokens=1" %%r in ('git remote 2^>nul') do set REMOTE_NAME=%%r
if "%REMOTE_NAME%"=="" (
    echo [오류] Git remote가 설정되어 있지 않습니다.
    echo [안내] git_setup.bat을 실행하세요.
    pause
    goto :EOF
)

:: 현재 브랜치 확인
for /f "tokens=*" %%b in ('git branch --show-current 2^>nul') do set CURRENT_BRANCH=%%b

:: Upstream 확인
for /f "tokens=*" %%u in ('git rev-parse --abbrev-ref %CURRENT_BRANCH%@{upstream} 2^>nul') do set UPSTREAM=%%u
if "%UPSTREAM%"=="" (
    echo [오류] Upstream 브랜치가 설정되어 있지 않습니다.
    echo [안내] git_setup.bat을 실행하거나 아래 명령을 실행하세요:
    echo        git push --set-upstream %REMOTE_NAME% %CURRENT_BRANCH%
    pause
    goto :EOF
)

echo   Remote: %REMOTE_NAME%, Branch: %CURRENT_BRANCH%, Upstream: %UPSTREAM%
echo   [O] Git 설정 확인 완료
echo.

:: ============================================================
:: 설정 파일 확인
:: ============================================================
:CHECK_CONFIG
if not exist "%CONFIG_FILE%" (
    echo [오류] %CONFIG_FILE% 파일이 존재하지 않습니다.
    echo [안내] test_1_fetch.bat을 먼저 실행하여 설정을 생성하세요.
    echo.
    pause
    goto :EOF
)

:: ============================================================
:: 클라이언트 선택
:: ============================================================
if "%CLIENT_ID%"=="" (
    echo [등록된 클라이언트]
    echo ------------------------------------------------------------
    python scripts/add_client.py --list
    echo ------------------------------------------------------------
    echo.
    set /p CLIENT_ID="배포할 클라이언트 ID 입력: "
)

if "%CLIENT_ID%"=="" (
    echo [오류] 클라이언트 ID가 입력되지 않았습니다.
    pause
    goto :EOF
)

echo.
echo ============================================================
echo  배포 대상: %CLIENT_ID%
echo ============================================================
echo.

:: ============================================================
:: 1단계: ETL 실행
:: ============================================================
if %SKIP_ETL%==1 (
    echo [1/3] ETL 건너뜀 --skip-etl
) else (
    echo [1/3] ETL 실행 중... 클라이언트: %CLIENT_ID%
    echo.

    python scripts/run_all_clients.py --client %CLIENT_ID% --with-images

    if errorlevel 1 (
        echo.
        echo [오류] ETL 실행 실패
        echo [안내] 오류를 확인하고 다시 시도하세요.
        echo.
        set /p CONTINUE_DEPLOY="그래도 Git Push를 진행하시겠습니까? [Y/N]: "
        if /i not "!CONTINUE_DEPLOY!"=="Y" (
            echo [취소] 배포가 취소되었습니다.
            pause
            goto :EOF
        )
    ) else (
        echo.
        echo [완료] ETL 성공
    )
)

:: ============================================================
:: 2단계: Git 상태 확인
:: ============================================================
echo.
echo [2/3] Git 상태 확인 중...
echo.

git status --short

:: 변경사항 확인
git diff --quiet --exit-code
set HAS_UNSTAGED=%ERRORLEVEL%

git diff --quiet --exit-code --cached
set HAS_STAGED=%ERRORLEVEL%

if %HAS_UNSTAGED%==0 if %HAS_STAGED%==0 (
    echo.
    echo [안내] 변경된 파일이 없습니다.
    echo.
    pause
    goto :EOF
)

:: ============================================================
:: 3단계: Git Commit & Push
:: ============================================================
echo.
echo [3/3] Git Commit ^& Push
echo.

:: 변경된 파일 추가 (데이터 + 이미지)
git add data/%CLIENT_ID%/ public/creative/images/

:: 커밋 메시지 생성
set COMMIT_DATE=%date:~0,4%-%date:~5,2%-%date:~8,2%
set COMMIT_TIME=%time:~0,2%:%time:~3,2%

:: 시간 앞 공백 제거 (한자리 시간 처리)
set COMMIT_TIME=%COMMIT_TIME: =0%

set COMMIT_MSG=[%CLIENT_ID%] Data update %COMMIT_DATE% %COMMIT_TIME%

echo 커밋 메시지: %COMMIT_MSG%
echo.

git commit -m "%COMMIT_MSG%"

if errorlevel 1 (
    echo.
    echo [경고] 커밋 실패 - 변경사항이 없거나 오류 발생
) else (
    echo.
    echo [완료] 커밋 성공

    echo.
    set /p DO_PUSH="원격 저장소에 Push 하시겠습니까? [Y/N]: "
    if /i "!DO_PUSH!"=="Y" (
        echo.
        echo Push 중...
        git push

        if errorlevel 1 (
            echo [오류] Push 실패
        ) else (
            echo [완료] Push 성공
        )
    ) else (
        echo [안내] Push가 취소되었습니다. 나중에 수동으로 push 하세요.
    )
)

:: ============================================================
:: 완료
:: ============================================================
echo.
echo ============================================================
echo  배포 완료
echo ============================================================
echo  클라이언트: %CLIENT_ID%
echo  데이터 경로: data/%CLIENT_ID%/
echo.
pause
