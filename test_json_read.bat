@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ================================================================================
echo JSON File Read Test
echo ================================================================================
echo.

REM JSON 파일 경로 입력
set /p JSON_FILE="Enter JSON file path: "

echo.
echo Testing: %JSON_FILE%
echo.

REM 1. 파일 존재 확인
echo [1/4] Checking file exists...
if not exist "%JSON_FILE%" (
    echo [FAIL] File not found: %JSON_FILE%
    pause
    exit /b 1
)
echo [PASS] File exists

REM 2. Python으로 JSON 유효성 검증
echo.
echo [2/4] Validating JSON format...
python -c "import json; data=json.load(open(r'%JSON_FILE%', encoding='utf-8')); print('      Keys:', list(data.keys())[:5])" 2>nul
if errorlevel 1 (
    echo [FAIL] Invalid JSON format
    echo.
    echo Trying to show error:
    python -c "import json; json.load(open(r'%JSON_FILE%', encoding='utf-8'))"
    pause
    exit /b 1
)
echo [PASS] JSON format is valid

REM 3. PowerShell로 읽기 (기존 방식)
echo.
echo [3/4] Reading with PowerShell (old method)...
for /f "delims=" %%i in ('powershell -Command "Get-Content '%JSON_FILE%' -Raw"') do set JSON_OLD=%%i

if not defined JSON_OLD (
    echo [FAIL] Old method failed
) else (
    echo [PASS] Old method succeeded
    echo       Length: !JSON_OLD:~0,80!...
)

REM 4. PowerShell로 읽기 (개선된 방식)
echo.
echo [4/4] Reading with PowerShell (new method)...
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "$json = Get-Content -Path '%JSON_FILE%' -Raw -Encoding UTF8; $json -replace '[\r\n]+', ' '"`) do set JSON_NEW=%%i

if not defined JSON_NEW (
    echo [FAIL] New method failed
    echo.
    echo Troubleshooting:
    echo - Check if file path has special characters
    echo - Ensure file is readable
    echo - Try using absolute path
) else (
    echo [PASS] New method succeeded
    echo       Length: !JSON_NEW:~0,80!...
    echo.
    echo Full preview (first 200 chars):
    echo !JSON_NEW:~0,200!
)

echo.
echo ================================================================================
if defined JSON_NEW (
    echo [RESULT] SUCCESS - JSON file can be read correctly
    echo.
    echo You can use this file with setup_fixed.bat
) else (
    echo [RESULT] FAILED - JSON file reading has issues
    echo.
    echo Please check:
    echo 1. File encoding is UTF-8
    echo 2. File path has no special characters
    echo 3. File is a valid JSON
)
echo ================================================================================
echo.
pause
