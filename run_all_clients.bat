@echo off
chcp 65001 > nul

:: ============================================================
:: 전체 클라이언트 ETL 파이프라인 실행
:: ============================================================
::
:: 사용법:
::   run_all_clients.bat                    - 모든 active 클라이언트 전체 실행
::   run_all_clients.bat --client clientA   - 특정 클라이언트만
::   run_all_clients.bat --stage fetch      - fetch 단계만
::   run_all_clients.bat --dry-run          - 실행 없이 계획만 출력
::   run_all_clients.bat --legacy           - 레거시 모드 (data/ 경로)
::
:: Windows 작업 스케줄러 등록 예시:
::   프로그램: C:\path\to\run_all_clients.bat
::   시작 위치: C:\path\to\marketing-dashboard
::   트리거: 매일 AM 6:00
::
:: ============================================================

echo ============================================================
echo  Marketing Dashboard - ETL Pipeline
echo ============================================================
echo.

:: Python 스크립트 실행
python scripts/run_all_clients.py %*

:: 결과 확인 대기 (스케줄러에서는 자동 스킵)
echo.
pause

:: 종료 코드 전달
exit /b %ERRORLEVEL%
