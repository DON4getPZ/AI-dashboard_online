@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: ============================================================
:: Git 설정 및 연결 (사용자 친화적 버전)
:: ============================================================
::
:: 기능:
::   1. Git 설치 확인 및 자동 설치 안내
::   2. Git 저장소 초기화
::   3. 사용자 정보 자동 설정
::   4. 인증 헬퍼 자동 설정
::   5. Remote/Upstream 설정
::
:: 사용법:
::   git_setup.bat              - 전체 설정 (대화형)
::   git_setup.bat --check      - 확인만 (설정 변경 없음)
::
:: ============================================================

echo.
echo ============================================================
echo  Git 설정 마법사
echo ============================================================
echo.

set CHECK_ONLY=0
if /i "%~1"=="--check" set CHECK_ONLY=1

:: ============================================================
:: 1단계: Git 설치 확인
:: ============================================================
echo [1/7] Git 설치 확인...

git --version >nul 2>&1
if errorlevel 1 (
    echo   [X] Git이 설치되어 있지 않습니다.
    echo.

    if %CHECK_ONLY%==1 (
        echo   [안내] Git 설치가 필요합니다.
        goto :SUMMARY_FAILED
    )

    echo   Git 설치 방법을 선택하세요:
    echo.
    echo   [1] winget으로 자동 설치 - 권장, Windows 10/11
    echo   [2] 다운로드 페이지 열기 - 수동 설치
    echo   [Q] 취소
    echo.
    set /p GIT_INSTALL_OPT="선택: "

    if /i "!GIT_INSTALL_OPT!"=="1" (
        echo.
        echo   winget으로 Git 설치 중...
        winget install --id Git.Git -e --source winget

        if errorlevel 1 (
            echo   [X] winget 설치 실패. 수동 설치를 진행하세요.
            start https://git-scm.com/download/win
            echo   [안내] 브라우저에서 Git을 다운로드하세요.
            echo   [안내] 설치 완료 후 이 스크립트를 다시 실행하세요.
            pause
            goto :EOF
        )

        echo   [O] Git 설치 완료
        echo   [안내] 터미널을 다시 시작한 후 이 스크립트를 다시 실행하세요.
        pause
        goto :EOF
    ) else if /i "!GIT_INSTALL_OPT!"=="2" (
        start https://git-scm.com/download/win
        echo.
        echo   [안내] 브라우저에서 Git을 다운로드하세요.
        echo   [안내] 설치 완료 후 이 스크립트를 다시 실행하세요.
        pause
        goto :EOF
    ) else (
        echo   [취소] 설정이 취소되었습니다.
        pause
        goto :EOF
    )
)

for /f "tokens=*" %%i in ('git --version') do set GIT_VERSION=%%i
echo   [O] %GIT_VERSION%

:: ============================================================
:: 2단계: Git 사용자 정보 설정
:: ============================================================
echo.
echo [2/7] Git 사용자 정보 확인...

for /f "tokens=*" %%n in ('git config --global user.name 2^>nul') do set GIT_USER_NAME=%%n
for /f "tokens=*" %%e in ('git config --global user.email 2^>nul') do set GIT_USER_EMAIL=%%e

if "%GIT_USER_NAME%"=="" (
    echo   [X] 사용자 이름이 설정되지 않았습니다.

    if %CHECK_ONLY%==1 goto :CHECK_USER_EMAIL

    echo.
    set /p NEW_USER_NAME="   사용자 이름 입력 (예: Hong Gildong): "
    if not "!NEW_USER_NAME!"=="" (
        git config --global user.name "!NEW_USER_NAME!"
        echo   [O] 사용자 이름 설정: !NEW_USER_NAME!
        set GIT_USER_NAME=!NEW_USER_NAME!
    )
) else (
    echo   [O] 사용자 이름: %GIT_USER_NAME%
)

:CHECK_USER_EMAIL
if "%GIT_USER_EMAIL%"=="" (
    echo   [X] 사용자 이메일이 설정되지 않았습니다.

    if %CHECK_ONLY%==1 goto :CHECK_REPO

    echo.
    set /p NEW_USER_EMAIL="   사용자 이메일 입력: "
    if not "!NEW_USER_EMAIL!"=="" (
        git config --global user.email "!NEW_USER_EMAIL!"
        echo   [O] 사용자 이메일 설정: !NEW_USER_EMAIL!
        set GIT_USER_EMAIL=!NEW_USER_EMAIL!
    )
) else (
    echo   [O] 사용자 이메일: %GIT_USER_EMAIL%
)

:: ============================================================
:: 3단계: 인증 헬퍼 자동 설정
:: ============================================================
:CHECK_CRED
echo.
echo [3/7] Git 인증 설정...

for /f "tokens=*" %%h in ('git config --global credential.helper 2^>nul') do set CRED_HELPER=%%h

if "%CRED_HELPER%"=="" (
    echo   [X] 인증 헬퍼가 설정되지 않았습니다.

    if %CHECK_ONLY%==0 (
        echo   [자동] Windows Credential Manager 설정 중...
        git config --global credential.helper manager
        echo   [O] 인증 헬퍼 설정 완료: manager
        echo   [안내] 첫 push 시 GitHub 로그인 창이 나타납니다.
    )
) else (
    echo   [O] 인증 헬퍼: %CRED_HELPER%
)

:: ============================================================
:: 4단계: 인코딩 설정 (UTF-8 / CRLF)
:: ============================================================
echo.
echo [4/7] Git 인코딩 설정...

if %CHECK_ONLY%==0 (
    git config --global core.autocrlf true
    echo   [O] core.autocrlf = true - CRLF 자동 변환

    git config --global core.quotepath false
    echo   [O] core.quotepath = false - 한글 파일명 지원

    git config --global i18n.commitEncoding utf-8
    echo   [O] i18n.commitEncoding = utf-8

    git config --global i18n.logOutputEncoding utf-8
    echo   [O] i18n.logOutputEncoding = utf-8

    echo   [완료] 인코딩 설정 완료
)

if %CHECK_ONLY%==1 (
    for /f "tokens=*" %%a in ('git config --global core.autocrlf 2^>nul') do set CHK_AUTOCRLF=%%a
    for /f "tokens=*" %%q in ('git config --global core.quotepath 2^>nul') do set CHK_QUOTEPATH=%%q

    if "%CHK_AUTOCRLF%"=="" (
        echo   [X] core.autocrlf 미설정
    ) else (
        echo   [O] core.autocrlf = %CHK_AUTOCRLF%
    )

    if "%CHK_QUOTEPATH%"=="" (
        echo   [-] core.quotepath 미설정 - 기본값 사용
    ) else (
        echo   [O] core.quotepath = %CHK_QUOTEPATH%
    )
)

:: ============================================================
:: 5단계: Git 저장소 확인/초기화
:: ============================================================
:CHECK_REPO
echo.
echo [5/7] Git 저장소 확인...

if not exist ".git" (
    echo   [X] 현재 디렉토리는 Git 저장소가 아닙니다.

    if %CHECK_ONLY%==1 goto :CHECK_REMOTE

    echo.
    set /p INIT_GIT="   Git 저장소를 초기화하시겠습니까? (Y/N): "
    if /i "!INIT_GIT!"=="Y" (
        git init
        echo   [O] Git 저장소 초기화 완료

        :: 첫 커밋 생성 (브랜치 활성화를 위해)
        if not exist "README.md" (
            echo # Marketing Dashboard > README.md
        )
        git add .
        git commit -m "Initial commit"
        echo   [O] 초기 커밋 생성 완료
    ) else (
        echo   [안내] 저장소 초기화가 필요합니다.
    )
) else (
    echo   [O] Git 저장소 확인됨
)

:: ============================================================
:: 6단계: Remote 설정
:: ============================================================
:CHECK_REMOTE
echo.
echo [6/7] Remote 설정 확인...

for /f "tokens=1" %%r in ('git remote 2^>nul') do set REMOTE_NAME=%%r

if "%REMOTE_NAME%"=="" (
    echo   [X] Remote가 설정되지 않았습니다.

    if %CHECK_ONLY%==1 goto :CHECK_UPSTREAM

    echo.
    echo   GitHub 저장소 URL을 입력하세요.
    echo   예시: https://github.com/username/repository.git
    echo.
    set /p REMOTE_URL="   Remote URL: "

    if not "!REMOTE_URL!"=="" (
        git remote add origin "!REMOTE_URL!"
        if errorlevel 1 (
            echo   [X] Remote 추가 실패
        ) else (
            echo   [O] Remote 'origin' 추가됨
            set REMOTE_NAME=origin
        )
    ) else (
        echo   [안내] Remote 설정이 필요합니다.
    )
) else (
    echo   [O] Remote 설정됨: %REMOTE_NAME%
    for /f "tokens=2" %%u in ('git remote get-url %REMOTE_NAME% 2^>nul') do echo   URL: %%u
    git remote get-url %REMOTE_NAME% 2>nul
)

:: ============================================================
:: 7단계: Upstream 및 인증 테스트
:: ============================================================
:CHECK_UPSTREAM
echo.
echo [7/7] Upstream 및 연결 테스트...

:: 현재 브랜치 확인
for /f "tokens=*" %%b in ('git branch --show-current 2^>nul') do set CURRENT_BRANCH=%%b

if "%CURRENT_BRANCH%"=="" (
    echo   [X] 현재 브랜치를 확인할 수 없습니다.
    echo   [안내] 최소 1개의 커밋이 필요합니다.
    goto :SUMMARY
)

echo   현재 브랜치: %CURRENT_BRANCH%

:: Upstream 확인
for /f "tokens=*" %%u in ('git rev-parse --abbrev-ref %CURRENT_BRANCH%@{upstream} 2^>nul') do set UPSTREAM=%%u

if "%UPSTREAM%"=="" (
    echo   [X] Upstream 브랜치가 설정되지 않았습니다.

    if %CHECK_ONLY%==1 goto :SUMMARY

    if not "%REMOTE_NAME%"=="" (
        echo.
        set /p SET_UPSTREAM="   Upstream을 설정하고 Push하시겠습니까? (Y/N): "
        if /i "!SET_UPSTREAM!"=="Y" (
            echo.
            echo   Push 중... (처음이면 인증 창이 나타날 수 있습니다)
            git push --set-upstream %REMOTE_NAME% %CURRENT_BRANCH%

            if errorlevel 1 (
                echo   [X] Push 실패 - 인증 또는 권한을 확인하세요.
            ) else (
                echo   [O] Upstream 설정 및 Push 완료
                set UPSTREAM=%REMOTE_NAME%/%CURRENT_BRANCH%
            )
        )
    )
) else (
    echo   [O] Upstream: %UPSTREAM%

    :: 연결 테스트
    echo   연결 테스트 중...
    git ls-remote --exit-code %REMOTE_NAME% >nul 2>&1
    if errorlevel 1 (
        echo   [X] 원격 저장소 연결 실패
        echo   [안내] 인터넷 연결 및 인증 정보를 확인하세요.
    ) else (
        echo   [O] 원격 저장소 연결 성공
    )
)

:: ============================================================
:: 결과 요약
:: ============================================================
:SUMMARY
echo.
echo ============================================================

:: 최종 상태 재확인
set FINAL_OK=1

:: .git 폴더 존재 확인
if not exist ".git" set FINAL_OK=0

:: Remote 설정 확인
for /f "tokens=1" %%r in ('git remote 2^>nul') do set CHK_REMOTE=%%r
if "%CHK_REMOTE%"=="" set FINAL_OK=0

:: 현재 브랜치 확인
for /f "tokens=*" %%b in ('git branch --show-current 2^>nul') do set CHK_BRANCH=%%b
if "%CHK_BRANCH%"=="" set FINAL_OK=0

:: Upstream 확인
for /f "tokens=*" %%u in ('git rev-parse --abbrev-ref %CHK_BRANCH%@{upstream} 2^>nul') do set CHK_UPSTREAM=%%u
if "%CHK_UPSTREAM%"=="" set FINAL_OK=0

if %FINAL_OK%==1 (
    echo  [결과] 모든 Git 설정이 완료되었습니다!
    echo.
    echo  이제 다음 명령을 사용할 수 있습니다:
    echo    - deploy.bat       : 단일 클라이언트 배포
    echo    - deploy_all.bat   : 전체 클라이언트 배포
) else (
    echo  [결과] 일부 설정이 필요합니다.
    echo.
    echo  위의 안내를 따라 설정을 완료한 후 다시 실행하세요.
)
echo ============================================================
goto :SHOW_STATUS

:SUMMARY_FAILED
echo.
echo ============================================================
echo  [결과] Git 설치가 필요합니다.
echo ============================================================
goto :END

:: ============================================================
:: 현재 상태 표시
:: ============================================================
:SHOW_STATUS
echo.
echo [현재 Git 설정 요약]
echo   사용자: %GIT_USER_NAME% ^<%GIT_USER_EMAIL%^>
echo   저장소: %CD%
if not "%REMOTE_NAME%"=="" echo   Remote: %REMOTE_NAME%
if not "%CURRENT_BRANCH%"=="" echo   브랜치: %CURRENT_BRANCH%
if not "%UPSTREAM%"=="" echo   Upstream: %UPSTREAM%
echo.

:END
pause
