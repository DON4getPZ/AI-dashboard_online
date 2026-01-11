@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: ============================================================
:: 전체 클라이언트 배포 (ETL → Git Push)
:: ============================================================
::
:: 사용법:
::   deploy_all.bat                - 전체 클라이언트 배포
::   deploy_all.bat --skip-etl     - ETL 건너뛰고 Git Push만
::   deploy_all.bat --auto         - 확인 없이 자동 실행 (스케줄러용)
::
:: 로그 위치: logs/deploy_YYYYMMDD_HHMMSS.log
::
:: ============================================================

set CONFIG_FILE=config\clients.json
set SKIP_ETL=0
set AUTO_MODE=0
set DEPLOY_STATUS=SUCCESS
set ERROR_MSG=

:: ============================================================
:: 인자 파싱
:: ============================================================
:PARSE_ARGS
if "%~1"=="" goto :INIT_LOG
if /i "%~1"=="--skip-etl" (
    set SKIP_ETL=1
    shift
    goto :PARSE_ARGS
)
if /i "%~1"=="--auto" (
    set AUTO_MODE=1
    shift
    goto :PARSE_ARGS
)
shift
goto :PARSE_ARGS

:: ============================================================
:: 로그 초기화 (--auto 모드에서만)
:: ============================================================
:INIT_LOG
:: 로그 폴더 생성
if not exist "logs" mkdir logs

:: 로그 파일명 생성
set LOG_DATE=%date:~0,4%%date:~5,2%%date:~8,2%
set LOG_TIME=%time:~0,2%%time:~3,2%%time:~6,2%
set LOG_TIME=%LOG_TIME: =0%
set LOG_FILE=logs\deploy_%LOG_DATE%_%LOG_TIME%.log

:: --auto 모드면 모든 출력을 로그에도 기록
if %AUTO_MODE%==1 (
    echo ============================================================ > "%LOG_FILE%"
    echo  Marketing Dashboard - Deploy All Clients >> "%LOG_FILE%"
    echo  실행 시간: %date% %time% >> "%LOG_FILE%"
    echo ============================================================ >> "%LOG_FILE%"
    echo. >> "%LOG_FILE%"
)

echo ============================================================
echo  Marketing Dashboard - Deploy All Clients
echo ============================================================
echo.

:: ============================================================
:: Git 설정 확인
:: ============================================================
:CHECK_GIT
call :LOG "[Git 설정 확인]"

:: Git 설치 확인
git --version >nul 2>&1
if errorlevel 1 (
    set ERROR_MSG=Git이 설치되어 있지 않습니다
    call :LOG_ERROR "!ERROR_MSG!"
    call :LOG "[안내] git_setup.bat을 실행하세요."
    goto :DEPLOY_FAILED
)

:: Git 저장소 확인
if not exist ".git" (
    set ERROR_MSG=Git 저장소가 아닙니다
    call :LOG_ERROR "!ERROR_MSG!"
    call :LOG "[안내] git_setup.bat을 실행하세요."
    goto :DEPLOY_FAILED
)

:: Remote 확인
for /f "tokens=1" %%r in ('git remote 2^>nul') do set REMOTE_NAME=%%r
if "%REMOTE_NAME%"=="" (
    set ERROR_MSG=Git remote가 설정되어 있지 않습니다
    call :LOG_ERROR "!ERROR_MSG!"
    call :LOG "[안내] git_setup.bat을 실행하세요."
    goto :DEPLOY_FAILED
)

:: 현재 브랜치 확인
for /f "tokens=*" %%b in ('git branch --show-current 2^>nul') do set CURRENT_BRANCH=%%b

:: Upstream 확인
for /f "tokens=*" %%u in ('git rev-parse --abbrev-ref %CURRENT_BRANCH%@{upstream} 2^>nul') do set UPSTREAM=%%u
if "%UPSTREAM%"=="" (
    set ERROR_MSG=Upstream 브랜치가 설정되어 있지 않습니다
    call :LOG_ERROR "!ERROR_MSG!"
    call :LOG "[안내] git_setup.bat을 실행하거나: git push --set-upstream %REMOTE_NAME% %CURRENT_BRANCH%"
    goto :DEPLOY_FAILED
)

call :LOG "  Remote: %REMOTE_NAME%, Branch: %CURRENT_BRANCH%, Upstream: %UPSTREAM%"
call :LOG "  [O] Git 설정 확인 완료"
echo.

:: ============================================================
:: 설정 파일 확인
:: ============================================================
:CHECK_CONFIG
if not exist "%CONFIG_FILE%" (
    set ERROR_MSG=%CONFIG_FILE% 파일이 존재하지 않습니다
    call :LOG_ERROR "!ERROR_MSG!"
    call :LOG "[안내] test_1_fetch.bat을 먼저 실행하여 설정을 생성하세요."
    goto :DEPLOY_FAILED
)

:: ============================================================
:: 클라이언트 목록 확인
:: ============================================================
call :LOG "[등록된 클라이언트]"
call :LOG "------------------------------------------------------------"
python scripts/add_client.py --list
if %AUTO_MODE%==1 python scripts/add_client.py --list >> "%LOG_FILE%" 2>&1
call :LOG "------------------------------------------------------------"
echo.

if %AUTO_MODE%==0 (
    set /p CONFIRM_DEPLOY="전체 클라이언트를 배포하시겠습니까? [Y/N]: "
    if /i not "!CONFIRM_DEPLOY!"=="Y" (
        echo [취소] 배포가 취소되었습니다.
        pause
        goto :EOF
    )
)

echo.
call :LOG "============================================================"
call :LOG " 전체 클라이언트 배포 시작"
call :LOG "============================================================"
echo.

:: ============================================================
:: 1단계: ETL 실행 (전체 클라이언트)
:: ============================================================
if %SKIP_ETL%==1 (
    call :LOG "[1/3] ETL 건너뜀 --skip-etl"
) else (
    call :LOG "[1/3] ETL 실행 중... 전체 클라이언트"
    echo.

    if %AUTO_MODE%==1 (
        python scripts/run_all_clients.py --with-images --verbose >> "%LOG_FILE%" 2>&1
    ) else (
        python scripts/run_all_clients.py --with-images --verbose
    )

    if errorlevel 1 (
        echo.
        call :LOG "[경고] 일부 ETL 실행 실패"
        if %AUTO_MODE%==0 (
            set /p CONTINUE_DEPLOY="그래도 Git Push를 진행하시겠습니까? [Y/N]: "
            if /i not "!CONTINUE_DEPLOY!"=="Y" (
                echo [취소] 배포가 취소되었습니다.
                pause
                goto :EOF
            )
        )
    ) else (
        echo.
        call :LOG "[완료] ETL 성공"
    )
)

:: ============================================================
:: 2단계: Git 상태 확인
:: ============================================================
echo.
call :LOG "[2/3] Git 상태 확인 중..."
echo.

git status --short
if %AUTO_MODE%==1 git status --short >> "%LOG_FILE%" 2>&1

:: 변경사항 확인
git diff --quiet --exit-code
set HAS_UNSTAGED=%ERRORLEVEL%

git diff --quiet --exit-code --cached
set HAS_STAGED=%ERRORLEVEL%

if %HAS_UNSTAGED%==0 if %HAS_STAGED%==0 (
    echo.
    call :LOG "[안내] 변경된 파일이 없습니다."
    echo.
    if %AUTO_MODE%==1 (
        call :LOG "[결과] 변경사항 없음 - 정상 종료"
    )
    if %AUTO_MODE%==0 pause
    goto :EOF
)

:: ============================================================
:: 3단계: Git Commit & Push
:: ============================================================
echo.
call :LOG "[3/3] Git Commit & Push"
echo.

:: 변경된 data 폴더 및 이미지 추가
git add data/ public/creative/images/

:: 커밋 메시지 생성
set COMMIT_DATE=%date:~0,4%-%date:~5,2%-%date:~8,2%
set COMMIT_TIME=%time:~0,2%:%time:~3,2%
set COMMIT_TIME=%COMMIT_TIME: =0%

set COMMIT_MSG=[All Clients] Data update %COMMIT_DATE% %COMMIT_TIME%

call :LOG "커밋 메시지: %COMMIT_MSG%"
echo.

git commit -m "%COMMIT_MSG%"
if %AUTO_MODE%==1 git log -1 --oneline >> "%LOG_FILE%" 2>&1

if errorlevel 1 (
    echo.
    set ERROR_MSG=커밋 실패 - 변경사항이 없거나 오류 발생
    call :LOG "[경고] !ERROR_MSG!"
    goto :DEPLOY_FAILED
)

echo.
call :LOG "[완료] 커밋 성공"

:: Push
if %AUTO_MODE%==1 (
    echo.
    call :LOG "Push 중... [자동 모드]"
    git push >> "%LOG_FILE%" 2>&1

    if errorlevel 1 (
        set ERROR_MSG=Push 실패
        call :LOG_ERROR "!ERROR_MSG!"
        goto :DEPLOY_FAILED
    ) else (
        call :LOG "[완료] Push 성공"
    )
) else (
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
:DEPLOY_SUCCESS
echo.
call :LOG "============================================================"
call :LOG " 전체 배포 완료"
call :LOG "============================================================"
call :LOG " 데이터 경로: data/*/"

if %AUTO_MODE%==1 (
    echo. >> "%LOG_FILE%"
    echo [결과] SUCCESS >> "%LOG_FILE%"
    echo [종료 시간] %date% %time% >> "%LOG_FILE%"
    echo 로그 저장됨: %LOG_FILE%
)

echo.
if %AUTO_MODE%==0 pause
goto :EOF

:: ============================================================
:: 배포 실패 처리
:: ============================================================
:DEPLOY_FAILED
set DEPLOY_STATUS=FAILED
echo.
call :LOG "============================================================"
call :LOG " [실패] 배포 중단"
call :LOG "============================================================"

if %AUTO_MODE%==1 (
    echo. >> "%LOG_FILE%"
    echo [결과] FAILED >> "%LOG_FILE%"
    echo [오류] %ERROR_MSG% >> "%LOG_FILE%"
    echo [종료 시간] %date% %time% >> "%LOG_FILE%"
    echo.
    echo 로그 저장됨: %LOG_FILE%
)

if %AUTO_MODE%==0 pause
goto :EOF

:: ============================================================
:: 로깅 함수
:: ============================================================
:LOG
echo %~1
if %AUTO_MODE%==1 echo %~1 >> "%LOG_FILE%"
goto :EOF

:LOG_ERROR
echo [오류] %~1
if %AUTO_MODE%==1 echo [오류] %~1 >> "%LOG_FILE%"
goto :EOF
