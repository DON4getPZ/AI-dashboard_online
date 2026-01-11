@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ============================================================
echo  [3/3] 데이터 Analysis 테스트 (가공 데이터 → 분석/시각화)
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
    echo [1] Analysis 테스트 진행
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
if exist "%DATA_PATH%\type\merged_data.csv" (
    echo   merged_data.csv: 존재함
) else (
    echo   merged_data.csv: 존재하지 않음
    echo.
    echo [경고] 먼저 test_2_mapping.bat 로 데이터를 가공하세요.
)

echo.
echo ============================================================
echo  실행할 스크립트 선택
echo ============================================================
echo.
echo [분석 스크립트]
echo [1] run_multi_analysis.py            - 통합 분석 (유형별/일별)
echo [2] multi_analysis_dimension_detail.py - 차원별 세부 분석
echo [3] multi_analysis_prophet_forecast.py - Prophet 예측 분석
echo [4] generate_type_insights.py        - 유형별 인사이트 생성
echo.
echo [세그먼트/퍼널 스크립트]
echo [5] segment_processor.py             - 세그먼트 분석
echo [6] insight_generator.py             - 인사이트 생성
echo [7] visualization_generator.py       - 시각화 데이터 생성
echo [8] generate_funnel_data.py          - 퍼널 데이터 생성
echo [9] generate_engagement_data.py      - 참여도 데이터 생성
echo.
echo [Multiperiod 스크립트]
echo [10] generate_funnel_data_multiperiod.py  - 멀티기간 퍼널 데이터
echo [11] generate_insights_multiperiod.py     - 멀티기간 인사이트
echo [12] generate_type_insights_multiperiod.py - 멀티기간 유형별 인사이트
echo.
echo [내보내기]
echo [E] export_json.py                   - CSV to JSON 변환
echo.
echo [일괄 실행]
echo [A] 전체 실행 (권장 순서)
echo [Q] 종료
echo.
set /p CHOICE="선택: "

if /i "%CHOICE%"=="Q" goto :EOF
if /i "%CHOICE%"=="1" goto :RUN_MULTI
if /i "%CHOICE%"=="2" goto :DIMENSION_DETAIL
if /i "%CHOICE%"=="3" goto :PROPHET
if /i "%CHOICE%"=="4" goto :TYPE_INSIGHTS
if /i "%CHOICE%"=="5" goto :SEGMENT
if /i "%CHOICE%"=="6" goto :INSIGHT
if /i "%CHOICE%"=="7" goto :VISUAL
if /i "%CHOICE%"=="8" goto :FUNNEL
if /i "%CHOICE%"=="9" goto :ENGAGEMENT
if /i "%CHOICE%"=="10" goto :FUNNEL_MULTI
if /i "%CHOICE%"=="11" goto :INSIGHTS_MULTI
if /i "%CHOICE%"=="12" goto :TYPE_INSIGHTS_MULTI
if /i "%CHOICE%"=="E" goto :EXPORT
if /i "%CHOICE%"=="A" goto :RUN_ALL

echo 잘못된 선택입니다.
goto :EOF

:RUN_MULTI
echo.
echo [실행] python scripts/run_multi_analysis.py %CLIENT_ARG%
python scripts/run_multi_analysis.py %CLIENT_ARG%
goto :DONE

:DIMENSION_DETAIL
echo.
echo [실행] python scripts/multi_analysis_dimension_detail.py %CLIENT_ARG%
python scripts/multi_analysis_dimension_detail.py %CLIENT_ARG%
goto :DONE

:PROPHET
echo.
echo [실행] python scripts/multi_analysis_prophet_forecast.py %CLIENT_ARG%
python scripts/multi_analysis_prophet_forecast.py %CLIENT_ARG%
goto :DONE

:TYPE_INSIGHTS
echo.
echo [실행] python scripts/generate_type_insights.py %CLIENT_ARG%
python scripts/generate_type_insights.py %CLIENT_ARG%
goto :DONE

:SEGMENT
echo.
echo [실행] python scripts/segment_processor.py %CLIENT_ARG%
python scripts/segment_processor.py %CLIENT_ARG%
goto :DONE

:INSIGHT
echo.
echo [실행] python scripts/insight_generator.py %CLIENT_ARG%
python scripts/insight_generator.py %CLIENT_ARG%
goto :DONE

:VISUAL
echo.
echo [실행] python scripts/visualization_generator.py %CLIENT_ARG%
python scripts/visualization_generator.py %CLIENT_ARG%
goto :DONE

:FUNNEL
echo.
echo [실행] python scripts/generate_funnel_data.py %CLIENT_ARG%
python scripts/generate_funnel_data.py %CLIENT_ARG%
goto :DONE

:ENGAGEMENT
echo.
echo [실행] python scripts/generate_engagement_data.py %CLIENT_ARG%
python scripts/generate_engagement_data.py %CLIENT_ARG%
goto :DONE

:FUNNEL_MULTI
echo.
echo [실행] python scripts/generate_funnel_data_multiperiod.py %CLIENT_ARG%
python scripts/generate_funnel_data_multiperiod.py %CLIENT_ARG%
goto :DONE

:INSIGHTS_MULTI
echo.
echo [실행] python scripts/generate_insights_multiperiod.py %CLIENT_ARG%
python scripts/generate_insights_multiperiod.py %CLIENT_ARG%
goto :DONE

:TYPE_INSIGHTS_MULTI
echo.
echo [실행] python scripts/generate_type_insights_multiperiod.py %CLIENT_ARG%
python scripts/generate_type_insights_multiperiod.py %CLIENT_ARG%
goto :DONE

:EXPORT
echo.
echo [실행] python scripts/export_json.py %CLIENT_ARG%
python scripts/export_json.py %CLIENT_ARG%
goto :DONE

:RUN_ALL
echo.
echo ============================================================
echo  전체 Analysis 실행 (권장 순서)
echo ============================================================

echo.
echo [1/13] run_multi_analysis.py (통합 분석)
python scripts/run_multi_analysis.py %CLIENT_ARG%
if errorlevel 1 (
    echo [경고] run_multi_analysis.py 실패 - 계속 진행
)

echo.
echo [2/13] multi_analysis_dimension_detail.py (차원별 세부)
python scripts/multi_analysis_dimension_detail.py %CLIENT_ARG%
if errorlevel 1 (
    echo [경고] multi_analysis_dimension_detail.py 실패 - 계속 진행
)

echo.
echo [3/13] multi_analysis_prophet_forecast.py (Prophet 예측)
python scripts/multi_analysis_prophet_forecast.py %CLIENT_ARG%
if errorlevel 1 (
    echo [경고] multi_analysis_prophet_forecast.py 실패 - 계속 진행
)

echo.
echo [4/13] generate_type_insights.py (유형별 인사이트)
python scripts/generate_type_insights.py %CLIENT_ARG%
if errorlevel 1 (
    echo [경고] generate_type_insights.py 실패 - 계속 진행
)

echo.
echo [5/13] segment_processor.py (세그먼트 분석)
python scripts/segment_processor.py %CLIENT_ARG%
if errorlevel 1 (
    echo [경고] segment_processor.py 실패 - 계속 진행
)

echo.
echo [6/13] insight_generator.py (인사이트 생성)
python scripts/insight_generator.py %CLIENT_ARG%
if errorlevel 1 (
    echo [경고] insight_generator.py 실패 - 계속 진행
)

echo.
echo [7/13] visualization_generator.py (시각화 데이터)
python scripts/visualization_generator.py %CLIENT_ARG%
if errorlevel 1 (
    echo [경고] visualization_generator.py 실패 - 계속 진행
)

echo.
echo [8/13] generate_funnel_data.py (퍼널 데이터)
python scripts/generate_funnel_data.py %CLIENT_ARG%
if errorlevel 1 (
    echo [경고] generate_funnel_data.py 실패 - 계속 진행
)

echo.
echo [9/13] generate_engagement_data.py (참여도 데이터)
python scripts/generate_engagement_data.py %CLIENT_ARG%
if errorlevel 1 (
    echo [경고] generate_engagement_data.py 실패 - 계속 진행
)

echo.
echo [10/13] generate_funnel_data_multiperiod.py (멀티기간 퍼널)
python scripts/generate_funnel_data_multiperiod.py %CLIENT_ARG%
if errorlevel 1 (
    echo [경고] generate_funnel_data_multiperiod.py 실패 - 계속 진행
)

echo.
echo [11/13] generate_insights_multiperiod.py (멀티기간 인사이트)
python scripts/generate_insights_multiperiod.py %CLIENT_ARG%
if errorlevel 1 (
    echo [경고] generate_insights_multiperiod.py 실패 - 계속 진행
)

echo.
echo [12/13] generate_type_insights_multiperiod.py (멀티기간 유형별)
python scripts/generate_type_insights_multiperiod.py %CLIENT_ARG%
if errorlevel 1 (
    echo [경고] generate_type_insights_multiperiod.py 실패 - 계속 진행
)

echo.
echo [13/13] export_json.py (JSON 내보내기)
python scripts/export_json.py %CLIENT_ARG%
if errorlevel 1 (
    echo [경고] export_json.py 실패
)

goto :DONE

:DONE
echo.
echo ============================================================
echo  Analysis 완료
echo ============================================================
if not "%CLIENT_ID%"=="" (
    echo  출력 경로: data/%CLIENT_ID%/
)
echo.
echo  주요 생성 폴더:
echo    - type/         (유형별 분석 결과)
echo    - forecast/     (예측 데이터)
echo    - ga4_data/     (GA4 퍼널 데이터)
echo    - multiperiod/  (멀티기간 분석 데이터)
echo    - json/         (JSON 내보내기)
echo.
pause
