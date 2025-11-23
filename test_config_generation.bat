@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ===== Config 생성 테스트 =====
echo.

REM 테스트 변수 설정
set GOOGLE_JSON=C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\gen-lang-client-0329230680-18d87ad74357.json
set WORKSHEET_NAME=Meta-주요성과
set SHEET_IDS=1mPNJfLyZ0JLQQIbR3exyVzJQWeitsl1QiAwMl9LGBAs,SHEET_ID_2,SHEET_ID_3
set SHEET_DESCS=첫 번째 시트,두 번째 시트,세 번째 시트

echo 변수 확인:
echo   GOOGLE_JSON: %GOOGLE_JSON%
echo   WORKSHEET_NAME: %WORKSHEET_NAME%
echo   SHEET_IDS: %SHEET_IDS%
echo   SHEET_DESCS: %SHEET_DESCS%
echo.

echo PowerShell 실행 중...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"try { " ^
"    Write-Host 'PowerShell 시작...'; " ^
"    $sheets = @(); " ^
"    $ids = '%SHEET_IDS%' -split ','; " ^
"    $descs = '%SHEET_DESCS%' -split ','; " ^
"    Write-Host ('IDs: ' + $ids.Length + ' items'); " ^
"    Write-Host ('Descs: ' + $descs.Length + ' items'); " ^
"    for ($i = 0; $i -lt $ids.Length; $i++) { " ^
"        Write-Host ('Adding sheet ' + $i + ': ' + $ids[$i]); " ^
"        $sheets += @{ " ^
"            sheet_id = $ids[$i]; " ^
"            worksheet_name = '%WORKSHEET_NAME%'; " ^
"            description = $descs[$i] " ^
"        } " ^
"    }; " ^
"    Write-Host 'Creating config object...'; " ^
"    $config = @{ " ^
"        google = @{ " ^
"            credentials_path = '%GOOGLE_JSON:\=\\%'; " ^
"            sheets = $sheets; " ^
"            output = @{ " ^
"                directory = 'data/type'; " ^
"                merged_filename = 'merged_data.csv' " ^
"            } " ^
"        } " ^
"    }; " ^
"    Write-Host 'Converting to JSON...'; " ^
"    $json = $config | ConvertTo-Json -Depth 10; " ^
"    Write-Host 'Saving to file...'; " ^
"    $json | Out-File -Encoding UTF8 'test_config.json'; " ^
"    Write-Host 'Success!'; " ^
"    exit 0 " ^
"} catch { " ^
"    Write-Host 'PowerShell Error:' $_.Exception.Message; " ^
"    Write-Host $_.ScriptStackTrace; " ^
"    exit 1 " ^
"}"

echo.
echo PowerShell errorlevel: %errorlevel%
echo.

if exist test_config.json (
    echo [성공] test_config.json 생성됨
    echo.
    echo 파일 내용:
    type test_config.json
) else (
    echo [실패] test_config.json 생성 안됨
)

echo.
pause
