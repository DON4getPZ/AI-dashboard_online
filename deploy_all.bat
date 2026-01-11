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
:: ============================================================

echo ============================================================
echo  Marketing Dashboard - Deploy All Clients
echo ============================================================
echo.

set CONFIG_FILE=config\clients.json
set SKIP_ETL=0
set AUTO_MODE=0

:: ============================================================
:: 인자 파싱
:: ============================================================
:PARSE_ARGS
if "%~1"=="" goto :CHECK_CONFIG
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
:: 설정 파일 확인
:: ============================================================
:CHECK_CONFIG
if not exist "%CONFIG_FILE%" (
    echo [오류] %CONFIG_FILE% 파일이 존재하지 않습니다.
    echo [안내] test_1_fetch.bat을 먼저 실행하여 설정을 생성하세요.
    echo.
    if %AUTO_MODE%==0 pause
    goto :EOF
)

:: ============================================================
:: 클라이언트 목록 확인
:: ============================================================
echo [등록된 클라이언트]
echo ------------------------------------------------------------
python scripts/add_client.py --list
echo ------------------------------------------------------------
echo.

if %AUTO_MODE%==0 (
    set /p CONFIRM_DEPLOY="전체 클라이언트를 배포하시겠습니까? (Y/N): "
    if /i not "!CONFIRM_DEPLOY!"=="Y" (
        echo [취소] 배포가 취소되었습니다.
        pause
        goto :EOF
    )
)

echo.
echo ============================================================
echo  전체 클라이언트 배포 시작
echo ============================================================
echo.

:: ============================================================
:: 1단계: ETL 실행 (전체 클라이언트)
:: ============================================================
if %SKIP_ETL%==1 (
    echo [1/3] ETL 건너뜀 (--skip-etl)
) else (
    echo [1/3] ETL 실행 중... (전체 클라이언트)
    echo.

    python scripts/run_all_clients.py

    if errorlevel 1 (
        echo.
        echo [경고] 일부 ETL 실행 실패
        if %AUTO_MODE%==0 (
            set /p CONTINUE_DEPLOY="그래도 Git Push를 진행하시겠습니까? (Y/N): "
            if /i not "!CONTINUE_DEPLOY!"=="Y" (
                echo [취소] 배포가 취소되었습니다.
                pause
                goto :EOF
            )
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
    if %AUTO_MODE%==0 pause
    goto :EOF
)

:: ============================================================
:: 3단계: Git Commit & Push
:: ============================================================
echo.
echo [3/3] Git Commit ^& Push
echo.

:: 변경된 data 폴더 전체 추가
git add data/

:: 커밋 메시지 생성
set COMMIT_DATE=%date:~0,4%-%date:~5,2%-%date:~8,2%
set COMMIT_TIME=%time:~0,2%:%time:~3,2%

:: 시간 앞 공백 제거 (한자리 시간 처리)
set COMMIT_TIME=%COMMIT_TIME: =0%

set COMMIT_MSG=[All Clients] Data update %COMMIT_DATE% %COMMIT_TIME%

echo 커밋 메시지: %COMMIT_MSG%
echo.

git commit -m "%COMMIT_MSG%"

if errorlevel 1 (
    echo.
    echo [경고] 커밋 실패 (변경사항이 없거나 오류 발생)
    if %AUTO_MODE%==0 pause
    goto :EOF
)

echo.
echo [완료] 커밋 성공

:: Push
if %AUTO_MODE%==1 (
    echo.
    echo Push 중... (자동 모드)
    git push

    if errorlevel 1 (
        echo [오류] Push 실패
    ) else (
        echo [완료] Push 성공
    )
) else (
    echo.
    set /p DO_PUSH="원격 저장소에 Push 하시겠습니까? (Y/N): "
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
echo  전체 배포 완료
echo ============================================================
echo  데이터 경로: data/*/
echo.
if %AUTO_MODE%==0 pause
