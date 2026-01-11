============================================================
 Marketing Dashboard - Deploy (Single Client)
============================================================

[등록된 클라이언트]
------------------------------------------------------------

등록된 클라이언트: 1개
--------------------------------------------------
  [test_1] 테스트 (활성)
--------------------------------------------------
------------------------------------------------------------

배포할 클라이언트 ID 입력: test_1

============================================================
 배포 대상: test_1
============================================================

[1/3] ETL 실행 중... 클라이언트: test_1

======================================================================
전체 클라이언트 ETL 파이프라인
======================================================================
실행 시간: 2026-01-11 23:36:53
설정 파일: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\config\clients.json
실행 단계: all
이미지 다운로드: 포함
스크립트 수: 19개
모드: 단일 클라이언트 (test_1)

======================================================================
클라이언트: test_1
실행 스크립트: 19개
이미지 다운로드: 포함
======================================================================

[1/19] fetch_google_sheets.py (광고 성과 원본 데이터)
  [test_1] python scripts/fetch_google_sheets.py --client test_1
  [완료] 14.5초

[2/19] fetch_sheets_multi.py (다중 시트 (채널별 분석))
  [test_1] python scripts/fetch_sheets_multi.py --client test_1
  [완료] 17.9초

[3/19] fetch_creative_sheets.py (크리에이티브 성과 데이터)
  [test_1] python scripts/fetch_creative_sheets.py --client test_1
  [완료] 7.1초

[4/19] fetch_creative_url.py (크리에이티브 이미지 URL)
  [test_1] python scripts/fetch_creative_url.py --client test_1
  [완료] 3.8초

[5/19] fetch_ga4_sheets.py (GA4 퍼널 데이터)
  [test_1] python scripts/fetch_ga4_sheets.py --client test_1
  [완료] 7.5초

[6/19] process_marketing_data.py (마케팅 원본 데이터 가공)
  [test_1] python scripts/process_marketing_data.py --client test_1
  [완료] 19.1초

[7/19] run_multi_analysis.py (통합 분석 (유형별/일별))
  [test_1] python scripts/run_multi_analysis.py --client test_1
  [완료] 0.9초

[8/19] multi_analysis_dimension_detail.py (차원별 세부 분석)
  [test_1] python scripts/multi_analysis_dimension_detail.py --client test_1
  [완료] 2.0초

[9/19] multi_analysis_prophet_forecast.py (Prophet 예측 분석)
  [test_1] python scripts/multi_analysis_prophet_forecast.py --client test_1
  [완료] 11.6초

[10/19] generate_type_insights.py (유형별 인사이트 생성)
  [test_1] python scripts/generate_type_insights.py --client test_1
  [완료] 1.5초

[11/19] segment_processor.py (세그먼트 분석)
  [test_1] python scripts/segment_processor.py --client test_1
  [완료] 14.3초

[12/19] insight_generator.py (인사이트 생성)
  [test_1] python scripts/insight_generator.py --client test_1
  [완료] 0.9초

[13/19] visualization_generator.py (시각화 데이터 생성)
  [test_1] python scripts/visualization_generator.py --client test_1
  [완료] 2.2초

[14/19] generate_funnel_data.py (퍼널 데이터 생성)
  [test_1] python scripts/generate_funnel_data.py --client test_1
  [완료] 6.8초

[15/19] generate_engagement_data.py (참여도 데이터 생성)
  [test_1] python scripts/generate_engagement_data.py --client test_1
  [완료] 1.1초

[16/19] generate_funnel_data_multiperiod.py (멀티기간 퍼널 데이터)
  [test_1] python scripts/generate_funnel_data_multiperiod.py --client test_1
  [완료] 20.8초

[17/19] generate_insights_multiperiod.py (멀티기간 인사이트)
  [test_1] python scripts/generate_insights_multiperiod.py --client test_1
  [완료] 1.2초

[18/19] generate_type_insights_multiperiod.py (멀티기간 유형별 인사이트)
  [test_1] python scripts/generate_type_insights_multiperiod.py --client test_1
  [완료] 51.4초

[19/19] export_json.py (CSV to JSON 변환)
  [test_1] python scripts/export_json.py --client test_1
  [완료] 3.0초

----------------------------------------------------------------------
[test_1] 완료: 19/19 성공

======================================================================
전체 실행 완료
======================================================================
총 소요 시간: 187.6초
클라이언트 수: 1개
총 스크립트: 19개 (성공: 19, 실패: 0)

모든 스크립트가 성공적으로 완료되었습니다.

[완료] ETL 성공

[2/3] Git 상태 확인 중...

 M data/test_1/dashboard.html
 M data/test_1/forecast/insights.json
 M data/test_1/funnel/insights.json
 M data/test_1/meta/latest.json
 M data/test_1/type/insights.json
 M public/data/test_1/creative.json
 M public/data/test_1/forecast.json
 M public/data/test_1/funnel.json
 M public/data/test_1/insights.json
 M public/data/test_1/meta.json

[3/3] Git Commit & Push

커밋 메시지: [test_1] Data update 2026-01-11 23:40

[main 78279f4] [test_1] Data update 2026-01-11 23:40
 5 files changed, 20 insertions(+), 20 deletions(-)

[완료] 커밋 성공

원격 저장소에 Push 하시겠습니까? [Y/N]: y

Push 중...
Enumerating objects: 24, done.
Counting objects: 100% (24/24), done.
Delta compression using up to 12 threads
Compressing objects: 100% (12/12), done.
Writing objects: 100% (13/13), 49.49 KiB | 4.50 MiB/s, done.
Total 13 (delta 9), reused 0 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (9/9), completed with 9 local objects.
To https://github.com/DON4getPZ/AI-dashboard_online
   6d391e3..78279f4  main -> main
[완료] Push 성공

============================================================
 배포 완료
============================================================
 클라이언트: test_1
 데이터 경로: data/test_1/

Press any key to continue . . .