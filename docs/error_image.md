============================================================
 [3/3] 데이터 Analysis 테스트 (가공 데이터 → 분석/시각화)
============================================================

[설정 확인] config\clients.json 파일이 존재합니다.

현재 등록된 클라이언트:
------------------------------------------------------------
      "id": "test_1",
      "name": "테스트",
------------------------------------------------------------

[1] 기존 설정 사용
[Q] 종료

선택: 1

============================================================
 클라이언트 선택
============================================================
클라이언트 ID 입력 (빈값=레거시 모드): test_1

[멀티클라이언트 모드] data/test_1/ 경로 사용

[데이터 확인]
  merged_data.csv: 존재함

============================================================
 실행할 스크립트 선택
============================================================

[분석 스크립트]
[1] run_multi_analysis.py            - 통합 분석 (유형별/일별)
[2] multi_analysis_dimension_detail.py - 차원별 세부 분석
[3] multi_analysis_prophet_forecast.py - Prophet 예측 분석
[4] generate_type_insights.py        - 유형별 인사이트 생성

[세그먼트/퍼널 스크립트]
[5] segment_processor.py             - 세그먼트 분석
[6] insight_generator.py             - 인사이트 생성
[7] visualization_generator.py       - 시각화 데이터 생성
[8] generate_funnel_data.py          - 퍼널 데이터 생성
[9] generate_engagement_data.py      - 참여도 데이터 생성

[Multiperiod 스크립트]
[10] generate_funnel_data_multiperiod.py  - 멀티기간 퍼널 데이터
[11] generate_insights_multiperiod.py     - 멀티기간 인사이트
[12] generate_type_insights_multiperiod.py - 멀티기간 유형별 인사이트

[내보내기]
[E] export_json.py                   - CSV to JSON 변환

[일괄 실행]
[A] 전체 실행 (권장 순서)
[Q] 종료

선택: a

============================================================
 전체 Analysis 실행 (권장 순서)
============================================================

[1/13] run_multi_analysis.py (통합 분석)
[멀티클라이언트 모드] 클라이언트: test_1
====================================================================================================
통합 마케팅 데이터 분석 시작
클라이언트: test_1
====================================================================================================
시작 시간: 2026-01-11 16:55:25
입력 파일: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\type\merged_data.csv
출력 디렉토리: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\type

데이터 로딩 중...
총 데이터: 25,025행, 21개 컬럼

====================================================================================================
1단계: 유형구분별 성과 분석
====================================================================================================

유형구분별 성과:
  메타_전환: ROAS 839.5%, CPA 12,416원
  메타_트래픽: ROAS 9.3%, CPA 1,104원

✓ 저장 완료: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\type\analysis_category_summary.csv

====================================================================================================
2단계: 일별 집계 데이터 생성
====================================================================================================
일별 데이터: 371일
기간: 2025-01-02 ~ 2026-01-11
✓ 저장 완료: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\type\analysis_daily_summary.csv

====================================================================================================
분석 완료!
클라이언트: test_1
====================================================================================================

종료 시간: 2026-01-11 16:55:25

생성된 파일:
  1. C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\type\analysis_category_summary.csv - 유형구분별 성과
  2. C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\type\analysis_daily_summary.csv - 일별 집계

주요 인사이트:
  - 총 25,025개 데이터 분석
  - 2개 유형구분 분석
  - 371일 시계열 데이터 생성

💡 차원별 세부 분석은 multi_analysis_dimension_detail.py를 실행하세요

====================================================================================================

[2/13] multi_analysis_dimension_detail.py (차원별 세부)
[멀티클라이언트 모드] 클라이언트: test_1
====================================================================================================
마케팅 데이터 차원별 상세 분석 V3
클라이언트: test_1
====================================================================================================
분석일: 2026-01-11 16:55:26
데이터 기간: 2025-01-02 ~ 2026-01-11
총 데이터: 25,025행

====================================================================================================
Type1: 캠페인별 → 광고세트 상세 성과
====================================================================================================
✓ 저장: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\type\dimension_type1_campaign_adset.csv
  - 캠페인 수: 73개
  - 광고세트 수: 80개
  - 총 조합: 1323개

====================================================================================================
Type2: 광고세트별 → 연령x성별 PIVOT 성과
====================================================================================================
✓ 저장: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\type\dimension_type2_adset_age_gender.csv
  - 광고세트 수: 80개
  - 연령대 수: 7개
  - 성별 수: 3개
  - 총 조합: 12892개

[파트너쉽 광고 세트] 연령x성별 ROAS:
성별            Female         Male  Unknown
연령
18-24    1442.719936     0.000000      0.0
25-34    1707.792890   747.435271      0.0
35-44    1495.213068  1393.922575      0.0
45-54     841.050457   803.059273      0.0
55-64     496.837173     0.000000      0.0
65+         0.000000     0.000000      0.0
Unknown     0.000000     0.000000      0.0

[Instagram Post] 연령x성별 ROAS:
성별     Female  Male  Unknown
연령
18-24     0.0   0.0      0.0
25-34     0.0   0.0      0.0
35-44     0.0   0.0      0.0
45-54     0.0   0.0      0.0
55-64     0.0   0.0      0.0
65+       0.0   0.0      0.0

[메타-트래픽-안토메-25SS컬렉션런칭] 연령x성별 ROAS:
성별     Female  Male  Unknown
연령
25-34     0.0   0.0      0.0
35-44     0.0   0.0      0.0
45-54     0.0   0.0      0.0
55-64     0.0   0.0      0.0
65+       0.0   0.0      0.0

[메타-트래픽-안토메-25SS컬렉션런칭-2540-여성] 연령x성별 ROAS:
성별     Female  Male  Unknown
연령
25-34     0.0   0.0      0.0
35-44     0.0   0.0      0.0
45-54     0.0   0.0      0.0
55-64     0.0   0.0      0.0
65+       0.0   0.0      0.0

[메타-전환-안토메-25SS컬렉션런칭-2540-여성-리테일_관심사] 연령x성별 ROAS:
성별     Female  Male
연령
25-34     0.0   0.0
35-44     0.0   0.0
45-54     0.0   0.0
55-64     0.0   0.0
65+       0.0   0.0

====================================================================================================
Type3: 광고세트별 → 연령 성과 (Type2 데이터 포함)
====================================================================================================
✓ 저장: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\type\dimension_type3_adset_age.csv
  - 광고세트 수: 80개
  - 연령대 수: 7개
  - 총 조합: 6415개

====================================================================================================
Type4: 광고세트별 → 성별 성과 (Type2 데이터 포함)
====================================================================================================
✓ 저장: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\type\dimension_type4_adset_gender.csv
  - 광고세트 수: 80개
  - 성별 수: 3개
  - 총 조합: 3174개

성별 성과 비교:
                   비용  전환수          전환값        ROAS
성별
Female   8.288463e+06  697  69850207.16  842.740150
Male     2.423167e+05   14   1351563.99  557.767473
Unknown  1.905537e+04    0         0.00    0.000000

====================================================================================================
Type5: 광고세트별 → 기기유형 성과
====================================================================================================
✓ 저장: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\type\dimension_type5_adset_device.csv
  - 광고세트 수: 80개
  - 기기유형 수: 7개
  - 기기유형_통합 수: 5개
  - 총 조합: 4081개

====================================================================================================
Type6: 광고세트별 → 플랫폼 성과
====================================================================================================
✓ 저장: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\type\dimension_type6_adset_platform.csv
  - 광고세트 수: 80개
  - 플랫폼 수: 6개
  - 총 조합: 2555개

====================================================================================================
Type7: 광고세트별 → 기기플랫폼 성과
====================================================================================================
✓ 저장: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\type\dimension_type7_adset_deviceplatform.csv
  - 광고세트 수: 80개
  - 기기플랫폼 수: 4개
  - 기기플랫폼_통합 수: 4개
  - 총 조합: 2231개

기기플랫폼_통합 성과 비교:
                         비용  전환수          전환값        ROAS
기기플랫폼_통합
Uncategorized  0.000000e+00    1        82.68         inf
모바일웹           2.724851e+03    0         0.00    0.000000
앱              8.541381e+06  710  71201687.49  833.608644
웹              5.803029e+03    0         0.00    0.000000

====================================================================================================
차원별 상세 분석 완료!
클라이언트: test_1
====================================================================================================

생성된 파일 (C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\type 디렉토리):
  1. dimension_type1_campaign_adset.csv - 캠페인별 광고세트 성과
  2. dimension_type2_adset_age_gender.csv - 광고세트별 연령x성별 성과
  3. dimension_type3_adset_age.csv - 광고세트별 연령 성과
  4. dimension_type4_adset_gender.csv - 광고세트별 성별 성과
  5. dimension_type5_adset_device.csv - 광고세트별 기기유형 성과
  6. dimension_type6_adset_platform.csv - 광고세트별 플랫폼 성과
  7. dimension_type7_adset_deviceplatform.csv - 광고세트별 기기플랫폼 성과

[3/13] multi_analysis_prophet_forecast.py (Prophet 예측)
[멀티클라이언트 모드] 클라이언트: test_1
====================================================================================================
Prophet 시계열 예측 V5 - 연간 학습 기반 다중 지표 예측
클라이언트: test_1
====================================================================================================
데이터 기간: 2025-01-02 ~ 2026-01-11
총 데이터: 25,025행
학습 기준: 최근 365일 (연간 학습)
✓ 현재 데이터: 375일 (연간 학습 가능)

일별 집계 데이터: 371일

주요 지표 (일평균):
  평균 일 광고비: 116,923원
  평균 일 전환수: 9.7건
  평균 일 전환값: 978,870원
  평균 ROAS: 837.2%

====================================================================================================
유형구분별 데이터 현황
====================================================================================================

유형구분별 전체 성과:
  메타_전환: 비용 43,257,060원, 전환수 3,484건, 전환값 363,149,451원, ROAS 839.5%
  메타_트래픽: 비용 121,477원, 전환수 110건, 전환값 11,309원, ROAS 9.3%

====================================================================================================
1. 전체 다중 지표 예측 (실제 30일 + 예측 30일)
====================================================================================================

Prophet 모델 학습 중... (비용, 노출, 클릭, 전환수, 전환값)
16:55:30 - cmdstanpy - INFO - Chain [1] start processing
16:55:30 - cmdstanpy - INFO - Chain [1] done processing
16:55:30 - cmdstanpy - INFO - Chain [1] start processing
16:55:30 - cmdstanpy - INFO - Chain [1] done processing
16:55:30 - cmdstanpy - INFO - Chain [1] start processing
16:55:30 - cmdstanpy - INFO - Chain [1] done processing
16:55:30 - cmdstanpy - INFO - Chain [1] start processing
16:55:30 - cmdstanpy - INFO - Chain [1] done processing
16:55:31 - cmdstanpy - INFO - Chain [1] start processing
16:55:31 - cmdstanpy - INFO - Chain [1] done processing

데이터 구성:
  - 실제 데이터: 30일
  - 예측 데이터: 30일

예측 요약 (30일 총합):
  비용: 2,354,220
  노출: 491,093
  클릭: 17,524
  전환수: 260
  전환값: 11,313,010
  평균 ROAS: 480.5%
  평균 CPA: 9,069원

✓ 전체 예측 결과 저장: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\type\prophet_forecast_overall.csv

====================================================================================================
2. 주요 유형구분별 다중 지표 예측 (실제 30일 + 예측 30일)
====================================================================================================

[메타_전환] 다중 지표 예측
학습 데이터: 367일
16:55:31 - cmdstanpy - INFO - Chain [1] start processing
16:55:31 - cmdstanpy - INFO - Chain [1] done processing
16:55:31 - cmdstanpy - INFO - Chain [1] start processing
16:55:31 - cmdstanpy - INFO - Chain [1] done processing
16:55:31 - cmdstanpy - INFO - Chain [1] start processing
16:55:31 - cmdstanpy - INFO - Chain [1] done processing
16:55:32 - cmdstanpy - INFO - Chain [1] start processing
16:55:32 - cmdstanpy - INFO - Chain [1] done processing
16:55:32 - cmdstanpy - INFO - Chain [1] start processing
16:55:32 - cmdstanpy - INFO - Chain [1] done processing
향후 30일 예상 총 전환값: 9,035,619원
평균 예측 ROAS: 1316.2%

[네이버_쇼핑검색]: 데이터 부족 (건수: 0)

[메타_트래픽] 다중 지표 예측
학습 데이터: 226일
16:55:32 - cmdstanpy - INFO - Chain [1] start processing
16:55:32 - cmdstanpy - INFO - Chain [1] done processing
16:55:32 - cmdstanpy - INFO - Chain [1] start processing
16:55:32 - cmdstanpy - INFO - Chain [1] done processing
16:55:33 - cmdstanpy - INFO - Chain [1] start processing
16:55:33 - cmdstanpy - INFO - Chain [1] done processing
16:55:33 - cmdstanpy - INFO - Chain [1] start processing
16:55:33 - cmdstanpy - INFO - Chain [1] done processing
16:55:33 - cmdstanpy - INFO - Chain [1] start processing
16:55:33 - cmdstanpy - INFO - Chain [1] done processing
향후 30일 예상 총 전환값: 3,550원
평균 예측 ROAS: 1048.2%

✓ 유형구분별 예측 결과 저장: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\type\prophet_forecast_by_category.csv

====================================================================================================
3. 유형구분별 트렌드 분석
====================================================================================================

최근 30일 vs 이전 30일 비교 (유형구분별):

[메타_전환]
  최근 30일: 16,080,255원
  이전 30일: 17,905,877원
  변화율: -10.2%

[메타_트래픽]
  최근 30일: 572원
  이전 30일: 2,139원
  변화율: -73.3%

✓ 트렌드 분석 결과 저장: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\type\prophet_trend_analysis.csv

====================================================================================================
6. 브랜드별 다중 지표 예측
====================================================================================================

[앳드맹] 다중 지표 예측
학습 데이터: 318일
16:55:33 - cmdstanpy - INFO - Chain [1] start processing
16:55:33 - cmdstanpy - INFO - Chain [1] done processing
16:55:34 - cmdstanpy - INFO - Chain [1] start processing
16:55:34 - cmdstanpy - INFO - Chain [1] done processing
16:55:34 - cmdstanpy - INFO - Chain [1] start processing
16:55:34 - cmdstanpy - INFO - Chain [1] done processing
16:55:34 - cmdstanpy - INFO - Chain [1] start processing
16:55:34 - cmdstanpy - INFO - Chain [1] done processing
16:55:34 - cmdstanpy - INFO - Chain [1] start processing
16:55:34 - cmdstanpy - INFO - Chain [1] done processing
향후 30일 예상 총 전환값: 10,057,075원

[안토메] 다중 지표 예측
학습 데이터: 281일
16:55:35 - cmdstanpy - INFO - Chain [1] start processing
16:55:35 - cmdstanpy - INFO - Chain [1] done processing
16:55:35 - cmdstanpy - INFO - Chain [1] start processing
16:55:35 - cmdstanpy - INFO - Chain [1] done processing
16:55:35 - cmdstanpy - INFO - Chain [1] start processing
16:55:35 - cmdstanpy - INFO - Chain [1] done processing
16:55:35 - cmdstanpy - INFO - Chain [1] start processing
16:55:36 - cmdstanpy - INFO - Chain [1] done processing
16:55:36 - cmdstanpy - INFO - Chain [1] start processing
16:55:36 - cmdstanpy - INFO - Chain [1] done processing
향후 30일 예상 총 전환값: 7,406원

[기타] 다중 지표 예측
학습 데이터: 75일
16:55:36 - cmdstanpy - INFO - Chain [1] start processing
16:55:37 - cmdstanpy - INFO - Chain [1] done processing
16:55:37 - cmdstanpy - INFO - Chain [1] start processing
16:55:37 - cmdstanpy - INFO - Chain [1] done processing
16:55:37 - cmdstanpy - INFO - Chain [1] start processing
16:55:37 - cmdstanpy - INFO - Chain [1] done processing
16:55:37 - cmdstanpy - INFO - Chain [1] start processing
16:55:37 - cmdstanpy - INFO - Chain [1] done processing
16:55:37 - cmdstanpy - INFO - Chain [1] start processing
16:55:37 - cmdstanpy - INFO - Chain [1] done processing
향후 30일 예상 총 전환값: 3,640원

✓ 브랜드별 예측 결과 저장: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\type\prophet_forecast_by_brand.csv

====================================================================================================
7. 상품별 다중 지표 예측
====================================================================================================

[기타] 다중 지표 예측
학습 데이터: 318일
16:55:38 - cmdstanpy - INFO - Chain [1] start processing
16:55:38 - cmdstanpy - INFO - Chain [1] done processing
16:55:38 - cmdstanpy - INFO - Chain [1] start processing
16:55:38 - cmdstanpy - INFO - Chain [1] done processing
16:55:38 - cmdstanpy - INFO - Chain [1] start processing
16:55:38 - cmdstanpy - INFO - Chain [1] done processing
16:55:38 - cmdstanpy - INFO - Chain [1] start processing
16:55:38 - cmdstanpy - INFO - Chain [1] done processing
16:55:38 - cmdstanpy - INFO - Chain [1] start processing
16:55:38 - cmdstanpy - INFO - Chain [1] done processing
향후 30일 예상 총 전환값: 10,057,075원

[전제품] 다중 지표 예측
학습 데이터: 281일
16:55:39 - cmdstanpy - INFO - Chain [1] start processing
16:55:39 - cmdstanpy - INFO - Chain [1] done processing
16:55:39 - cmdstanpy - INFO - Chain [1] start processing
16:55:39 - cmdstanpy - INFO - Chain [1] done processing
16:55:39 - cmdstanpy - INFO - Chain [1] start processing
16:55:39 - cmdstanpy - INFO - Chain [1] done processing
16:55:39 - cmdstanpy - INFO - Chain [1] start processing
16:55:39 - cmdstanpy - INFO - Chain [1] done processing
16:55:39 - cmdstanpy - INFO - Chain [1] start processing
16:55:39 - cmdstanpy - INFO - Chain [1] done processing
향후 30일 예상 총 전환값: 7,803원

✓ 상품별 예측 결과 저장: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\type\prophet_forecast_by_product.csv

====================================================================================================
분석 완료
클라이언트: test_1
====================================================================================================

[학습 설정 요약]
  - 학습 기준: 최근 365일 (연간 학습)
  - 실제 데이터: 375일
  - 연간 계절성: 활성화

생성된 파일 목록 (다중 지표 예측: 비용, 노출, 클릭, 전환수, 전환값, ROAS, CPA, CPC):
  1. prophet_forecast_overall.csv - 전체 다중 지표 예측
  2. prophet_forecast_by_category.csv - 유형구분별 다중 지표 예측
  3. prophet_trend_analysis.csv - 트렌드 분석
  4. prophet_forecast_by_brand.csv - 브랜드별 다중 지표 예측
  5. prophet_forecast_by_product.csv - 상품별 다중 지표 예측

[4/13] generate_type_insights.py (유형별 인사이트)
[멀티클라이언트 모드] 클라이언트: test_1
====================================================================================================
Type 분석 인사이트 생성
====================================================================================================
생성일: 2026-01-11 16:55:40

데이터 로딩 중...
✓ dimension_type1_campaign_adset.csv 로드 완료
✓ dimension_type2_adset_age_gender.csv 로드 완료
✓ dimension_type3_adset_age.csv 로드 완료
✓ dimension_type4_adset_gender.csv 로드 완료
✓ dimension_type5_adset_device.csv 로드 완료
✓ dimension_type6_adset_platform.csv 로드 완료
✓ dimension_type7_adset_deviceplatform.csv 로드 완료

📊 전체 기간 데이터 사용

Prophet 예측 데이터 로딩 중...
✓ prophet_forecast_overall.csv 로드 완료 (actual: 30행, forecast: 30행)
✓ prophet_forecast_by_category.csv 로드 완료 (actual: 60행, forecast: 60행)
✓ prophet_forecast_by_brand.csv 로드 완료 (actual: 90행, forecast: 90행)
✓ prophet_forecast_by_product.csv 로드 완료 (actual: 60행, forecast: 60행)

전체 요약 생성 중...
  - dimensions['type1'] 기준 집계: 비용=9,177,385, 전환값=78,353,678
상위 유형구분 분석 중...
성별 인사이트 생성 중...
  - 성별 4분면 인사이트: 1개
최고 성과 광고세트 분석 중...
연령x성별 인사이트 생성 중...
  - 연령x성별 4분면 인사이트: 7개
기기유형 인사이트 생성 중...
  - 기기유형 4분면 인사이트: 4개
기기플랫폼 인사이트 생성 중...
  - 기기플랫폼 4분면 인사이트: 1개
브랜드명 인사이트 생성 중...
상품명 인사이트 생성 중...
프로모션 인사이트 생성 중...
월별 트렌드 분석 중...
주별 트렌드 분석 중...
브랜드별 주별 트렌드 분석 중...
상품별 주별 트렌드 분석 중...
성별 주별 트렌드 분석 중...
연령별 주별 트렌드 분석 중...
브랜드별 월별 트렌드 분석 중...
상품별 월별 트렌드 분석 중...
성별 월별 트렌드 분석 중...
연령별 월별 트렌드 분석 중...

Prophet 예측 인사이트 생성 중...
시계열 인사이트 생성 중...
알림 및 추천사항 생성 중... (친화적 메시지 적용)
요일별 계절성 분석 중... (다중 지표: cost, conversions, revenue, roas, cpa)
  - prophet_forecast_by_seasonality.csv 파일 없음
리타겟팅 성과 분석 중...
  - Type2 리타겟팅 데이터: 944행
  - Type5 리타겟팅 데이터: 266행
  - Type6 리타겟팅 데이터: 208행
  - Type7 리타겟팅 데이터: 128행
  - 리타겟팅 연령+성별 분석: 12개
  - 리타겟팅 기기유형 분석: 4개
  - 리타겟팅 플랫폼 분석: 6개
  - 리타겟팅 노출기기 분석: 4개
  - 리타겟팅 인사이트: 5개

✓ 인사이트 생성 완료: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\type\insights.json

====================================================================================================
생성된 인사이트 요약 (AI 비서 톤앤매너 적용)
====================================================================================================

📊 전체 ROAS: 853.8%
💰 전체 CPA: 12,237원
📈 전체 매출: 7,835만 원

🏆 상위 유형구분: 2개
🔔 알림: 3개 (친화적 메시지 포함)
💡 추천사항: 6개 (Score 시스템 적용)
⭐ Top Recommendations: 5개 (대시보드 상단 표시용)

[시계열 분석 - 월별]
  - 월별 트렌드: 13개월
  - 월별 성장률: 12개
  - 브랜드별 월별 트렌드: 3개
  - 상품별 월별 트렌드: 2개
  - 성별 월별 트렌드: 2개
  - 연령별 월별 트렌드: 6개

[시계열 분석 - 주별]
  - 주별 트렌드: 12주
  - 주별 성장률: 53개
  - 브랜드별 주별 트렌드: 3개
  - 상품별 주별 트렌드: 2개
  - 성별 주별 트렌드: 2개
  - 연령별 주별 트렌드: 6개

[시계열 인사이트: 2개]

[Prophet 예측 분석]
  - Prophet 예측 파일 로드: 4개
  - 예측 기간: 2026-01-12 ~ 2026-02-10
  - 30일 총 예측 전환값: 11,313,010원
  - 유형구분별 예측: 2개
  - 브랜드별 예측: 3개
  - 상품별 예측: 2개
  - 성별 예측: 0개
  - 연령별 예측: 0개
  - 기기유형별 예측: 0개
  - 플랫폼별 예측: 0개
  - 기기플랫폼별 예측: 0개
  - 프로모션별 예측: 0개
  - 연령+성별 조합별 예측: 0개
  - Prophet 알림: 2개
  - Prophet 추천사항: 2개

[요일별 계절성 분석]
  - 전체 요일별: 0개
  - 유형구분별 요일: 0개 카테고리
  - 계절성 인사이트: 0개

[리타겟팅 분석]
  - 연령+성별 조합 (Type2): 12개
  - 기기유형 (Type5): 4개
  - 플랫폼 (Type6): 6개
  - 노출기기 (Type7): 4개
  - 리타겟팅 인사이트: 5개

====================================================================================================
인사이트 생성 완료! (v2.0 - AI 비서 톤앤매너)
====================================================================================================

[v2.0 신규 기능]
  ✓ AI 비서 톤앤매너: 이모지와 친화적인 제목 사용
  ✓ PERSONA_ACTIONS: 연령/성별/플랫폼별 맞춤 액션 제안
  ✓ Score 시스템: 우선순위 기반 top_recommendations 5개
  ✓ format_korean_currency: 억 원, 만 원 단위 표시
  ✓ NpEncoder: NaN/Inf JSON 에러 원천 차단
====================================================================================================

[5/13] segment_processor.py (세그먼트 분석)
16:55:42 - cmdstanpy - INFO - Chain [1] start processing
16:55:42 - cmdstanpy - INFO - Chain [1] done processing
16:55:42 - cmdstanpy - INFO - Chain [1] start processing
16:55:42 - cmdstanpy - INFO - Chain [1] done processing
16:55:43 - cmdstanpy - INFO - Chain [1] start processing
16:55:43 - cmdstanpy - INFO - Chain [1] done processing
16:55:43 - cmdstanpy - INFO - Chain [1] start processing
16:55:43 - cmdstanpy - INFO - Chain [1] done processing
16:55:43 - cmdstanpy - INFO - Chain [1] start processing
16:55:43 - cmdstanpy - INFO - Chain [1] done processing
16:55:43 - cmdstanpy - INFO - Chain [1] start processing
16:55:43 - cmdstanpy - INFO - Chain [1] done processing
16:55:43 - cmdstanpy - INFO - Chain [1] start processing
16:55:43 - cmdstanpy - INFO - Chain [1] done processing
16:55:44 - cmdstanpy - INFO - Chain [1] start processing
16:55:44 - cmdstanpy - INFO - Chain [1] done processing
16:55:44 - cmdstanpy - INFO - Chain [1] start processing
16:55:44 - cmdstanpy - INFO - Chain [1] done processing
16:55:44 - cmdstanpy - INFO - Chain [1] start processing
16:55:44 - cmdstanpy - INFO - Chain [1] done processing
16:55:44 - cmdstanpy - INFO - Chain [1] start processing
16:55:44 - cmdstanpy - INFO - Chain [1] done processing
16:55:44 - cmdstanpy - INFO - Chain [1] start processing
16:55:45 - cmdstanpy - INFO - Chain [1] done processing
16:55:45 - cmdstanpy - INFO - Chain [1] start processing
16:55:45 - cmdstanpy - INFO - Chain [1] done processing
16:55:45 - cmdstanpy - INFO - Chain [1] start processing
16:55:45 - cmdstanpy - INFO - Chain [1] done processing
16:55:45 - cmdstanpy - INFO - Chain [1] start processing
16:55:45 - cmdstanpy - INFO - Chain [1] done processing
16:55:45 - cmdstanpy - INFO - Chain [1] start processing
16:55:46 - cmdstanpy - INFO - Chain [1] done processing
16:55:46 - cmdstanpy - INFO - Chain [1] start processing
16:55:46 - cmdstanpy - INFO - Chain [1] done processing
16:55:46 - cmdstanpy - INFO - Chain [1] start processing
16:55:46 - cmdstanpy - INFO - Chain [1] done processing
16:55:46 - cmdstanpy - INFO - Chain [1] start processing
16:55:47 - cmdstanpy - INFO - Chain [1] done processing
16:55:47 - cmdstanpy - INFO - Chain [1] start processing
16:55:47 - cmdstanpy - INFO - Chain [1] done processing
16:55:47 - cmdstanpy - INFO - Chain [1] start processing
16:55:47 - cmdstanpy - INFO - Chain [1] done processing
16:55:47 - cmdstanpy - INFO - Chain [1] start processing
16:55:48 - cmdstanpy - INFO - Chain [1] done processing
16:55:48 - cmdstanpy - INFO - Chain [1] start processing
16:55:48 - cmdstanpy - INFO - Chain [1] done processing
16:55:48 - cmdstanpy - INFO - Chain [1] start processing
16:55:48 - cmdstanpy - INFO - Chain [1] done processing
16:55:48 - cmdstanpy - INFO - Chain [1] start processing
16:55:48 - cmdstanpy - INFO - Chain [1] done processing
16:55:49 - cmdstanpy - INFO - Chain [1] start processing
16:55:49 - cmdstanpy - INFO - Chain [1] done processing
16:55:49 - cmdstanpy - INFO - Chain [1] start processing
16:55:49 - cmdstanpy - INFO - Chain [1] done processing
16:55:49 - cmdstanpy - INFO - Chain [1] start processing
16:55:49 - cmdstanpy - INFO - Chain [1] done processing
16:55:49 - cmdstanpy - INFO - Chain [1] start processing
16:55:49 - cmdstanpy - INFO - Chain [1] done processing
16:55:49 - cmdstanpy - INFO - Chain [1] start processing
16:55:50 - cmdstanpy - INFO - Chain [1] done processing
16:55:50 - cmdstanpy - INFO - Chain [1] start processing
16:55:50 - cmdstanpy - INFO - Chain [1] done processing
16:55:50 - cmdstanpy - INFO - Chain [1] start processing
16:55:50 - cmdstanpy - INFO - Chain [1] done processing
16:55:50 - cmdstanpy - INFO - Chain [1] start processing
16:55:50 - cmdstanpy - INFO - Chain [1] done processing
16:55:50 - cmdstanpy - INFO - Chain [1] start processing
16:55:50 - cmdstanpy - INFO - Chain [1] done processing
16:55:51 - cmdstanpy - INFO - Chain [1] start processing
16:55:51 - cmdstanpy - INFO - Chain [1] done processing
16:55:51 - cmdstanpy - INFO - Chain [1] start processing
16:55:51 - cmdstanpy - INFO - Chain [1] done processing
16:55:51 - cmdstanpy - INFO - Chain [1] start processing
16:55:51 - cmdstanpy - INFO - Chain [1] done processing
16:55:51 - cmdstanpy - INFO - Chain [1] start processing
16:55:51 - cmdstanpy - INFO - Chain [1] done processing
16:55:51 - cmdstanpy - INFO - Chain [1] start processing
16:55:51 - cmdstanpy - INFO - Chain [1] done processing
16:55:52 - cmdstanpy - INFO - Chain [1] start processing
16:55:52 - cmdstanpy - INFO - Chain [1] done processing
16:55:52 - cmdstanpy - INFO - Chain [1] start processing
16:55:52 - cmdstanpy - INFO - Chain [1] done processing
16:55:52 - cmdstanpy - INFO - Chain [1] start processing
16:55:52 - cmdstanpy - INFO - Chain [1] done processing
16:55:52 - cmdstanpy - INFO - Chain [1] start processing
16:55:52 - cmdstanpy - INFO - Chain [1] done processing
16:55:52 - cmdstanpy - INFO - Chain [1] start processing
16:55:52 - cmdstanpy - INFO - Chain [1] done processing
16:55:52 - cmdstanpy - INFO - Chain [1] start processing
16:55:53 - cmdstanpy - INFO - Chain [1] done processing
16:55:53 - cmdstanpy - INFO - Chain [1] start processing
16:55:53 - cmdstanpy - INFO - Chain [1] done processing
16:55:53 - cmdstanpy - INFO - Chain [1] start processing
16:55:53 - cmdstanpy - INFO - Chain [1] done processing
16:55:53 - cmdstanpy - INFO - Chain [1] start processing
16:55:53 - cmdstanpy - INFO - Chain [1] done processing
16:55:53 - cmdstanpy - INFO - Chain [1] start processing
16:55:53 - cmdstanpy - INFO - Chain [1] done processing
16:55:53 - cmdstanpy - INFO - Chain [1] start processing
16:55:54 - cmdstanpy - INFO - Chain [1] done processing
[Multi-Client Mode] Client: test_1

============================================================
Segment Processor v1.2
Client: test_1
============================================================

[1/4] Loading data...
   Loaded from: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\raw\raw_data.csv
   Total rows: 1,210
   Date range: 2025-01-02 ~ 2026-01-11
   Unique dates: 318

[2/4] Processing segments...

   Processing brand segments...
      - 앳드맹: 318 days, model=prophet_full
   Saved: segment_brand.csv

   Processing channel segments...
      - 메타_전환: 318 days, model=prophet_full
      - 메타_트래픽: 3 days, model=last_value
   Saved: segment_channel.csv

   Processing product segments...
      - 기타: 310 days, model=prophet_full
      - 트위스트 셔츠: 29 days, model=weighted_ma
      - 자켓: 27 days, model=weighted_ma
      - 니트: 15 days, model=weighted_ma
      - Ellie: 66 days, model=prophet_weekly
      - 레미니스: 66 days, model=prophet_weekly
      - 티셔츠: 48 days, model=prophet_weekly
      - 블라우스: 51 days, model=prophet_weekly
   Saved: segment_product.csv

   Processing promotion segments...
      - 파트너쉽: 199 days, model=prophet_full
      - 기타: 113 days, model=prophet_full
      - 25FW: 32 days, model=prophet_weekly
   Saved: segment_promotion.csv

[3/4] Calculating segment statistics...
   Saved: segment_stats.json

[4/4] Segment processing complete!

Generated files:
   - data/forecast/segment_brand.csv
   - data/forecast/segment_channel.csv
   - data/forecast/segment_product.csv
   - data/forecast/segment_promotion.csv

============================================================
Segment processing completed successfully!
Client: test_1
============================================================

[6/13] insight_generator.py (인사이트 생성)
[Multi-Client Mode] Client: test_1

============================================================
🧠 AI Marketing Insight Generator v2.2 (Multi-Client + Multi-Period)
   📁 Client: test_1
============================================================
   📅 분석 기간: 전체

[1/6] Loading segment data...
   Loaded: segment_brand.csv
   Loaded: segment_channel.csv
   Loaded: segment_product.csv
   Loaded: segment_promotion.csv
   Calculated segment_stats from filtered data (4 segments)
   Loaded: predictions_daily.csv
   Loaded: predictions_weekly.csv
   Loaded: predictions_monthly.csv

[2/5] Analyzing forecasts...
   Analyzed 1 brand segments
   Analyzed 2 channel segments
   Analyzed 8 product segments
   Analyzed 3 promotion segments

[2.5/5] Analyzing overall performance...
   Current period: 2025-12-12 ~ 2026-01-11
   Total conversions: 53.0
   ROAS: 957.86%

[2.7/5] Analyzing performance trends (7d/14d/30d)...
   7-day improvements: 0, declines: 3
   14-day improvements: 3, declines: 0
   30-day improvements: 0, declines: 0

[3/6] Detecting alerts (Risk Management)...
   Detected 21 segment alerts (Risk signals)
      - 💸 레미니스 효율 저하 주의: ROAS -1324.5%
      - 💸 자켓 효율 저하 주의: ROAS -221.8%
      - 💸 기타 효율 저하 주의: ROAS -205.2%
      - 💸 블라우스 효율 저하 주의: ROAS -161.3%
      - 💸 니트 효율 저하 주의: ROAS -99.7%

[4/6] Finding opportunities (Growth Hacking)...
   Found 9 opportunities (Growth signals)
      - 🚀 레미니스: 수익성 최고조!: ROAS 1324%
      - 🚀 트위스트 셔츠: 수익성 최고조!: ROAS 1107%
      - 🚀 메타_전환: 수익성 최고조!: ROAS 958%

[4.5/6] Analyzing Forecast Matrix (4-Quadrant)...
   brand: 🚀1 🛡️0 🌱0 🗑️0
   product: 🚀0 🛡️2 🌱0 🗑️2
   channel: 🚀1 🛡️0 🌱0 🗑️0
   promotion: 🚀1 🛡️0 🌱0 🗑️1
   Total matrix insights: 8

[5/6] Generating recommendations...
   Generated 4 segment recommendations
      - channel/메타_전환: [scale_up] '메타_전환' 채널 예산을 30% 증액하고, 일예산 상한(Cap)을 해제...
      - brand/앳드맹: [scale_up] '앳드맹' 브랜드 키워드 점유율을 높이고, 경쟁사 키워드도 공략하세요....
      - promotion/파트너쉽: [scale_up] '파트너쉽' 프로모션 기간을 연장하거나, 앵콜 기획전을 준비하세요....
      - product/레미니스: [defend] '레미니스' 상품의 번들 구성으로 객단가를 높여 수익을 방어하세요....

[6/6] Generating natural language summary...

   Summary:
      📊 전체 성과 (2025-12-12 ~ 2026-01-11): ROAS 957.86%, 전환수 53, 전환값 9,158,332원
      📉 트렌드: ROAS -590.2%p 하락 예상

      🚨 주의: product '레미니스'의 ROAS이(가) 1324.5% 하락할 것으로 예측됩니다.
      💡 권장: channel '메타_전환'에 '메타_전환' 채널 예산을 30% 증액하고, 일예산 상한(Cap)을 해제하세요.을 권장합니다. (ROAS 958%로 양호한 효율, CVR 1.72%)
         예상 효과: 예상 추가 매출 275만 원, 전환 +15건
      🔍 추가 검토 대상: 앳드맹, 파트너쉽

   ✅ Saved: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\forecast\insights.json

============================================================
🎯 AI Marketing Insight Generator v2.2 완료! (전체)
============================================================

[v2.2 신규 기능]
   ✓ Forecast Matrix (4분면): Super Star, Fading Hero, Rising Potential, Problem Child
   ✓ 동적 임계값 (Quantile 기반): 상대 평가
   ✓ 세그먼트 유형별 맞춤 처방: brand/product/channel/promotion
   ✓ Core Risk 감지: 매출 비중 10% 이상 + 저효율 + 역성장

📁 Generated file: data/forecast/insights.json

📊 Insight structure:
   - period: 분석 기간
   - summary_card: AI 비서 스타일 요약 카드
   - matrix_insights: 4분면 인사이트 (v2.2)
   - overall: 전체 성과 분석
   - segments: 세그먼트별 경고 및 추천
   - opportunities: 숨은 기회 발굴
   - performance_trends: 7d/30d 트렌드

============================================================
MARKETING INSIGHTS SUMMARY
Client: test_1
============================================================
📊 전체 성과 (2025-12-12 ~ 2026-01-11): ROAS 957.86%, 전환수 53, 전환값 9,158,332원
📉 트렌드: ROAS -590.2%p 하락 예상

🚨 주의: product '레미니스'의 ROAS이(가) 1324.5% 하락할 것으로 예측됩니다.
💡 권장: channel '메타_전환'에 '메타_전환' 채널 예산을 30% 증액하고, 일예산 상한(Cap)을 해제하세요.을 권장합니다. (ROAS 958%로 양호한 효율, CVR 1.72%)
   예상 효과: 예상 추가 매출 275만 원, 전환 +15건
🔍 추가 검토 대상: 앳드맹, 파트너쉽

[7/13] visualization_generator.py (시각화 데이터)
[Multi-Client Mode] Client: test_1

============================================================
Business Visualization Generator v1.1
Client: test_1
============================================================

[1/4] Loading data...
   Loaded: segment_stats.json
   Loaded: insights.json

[2/4] Creating channel ROAS comparison chart...
   Saved: channel_roas_comparison.png

[3/4] Creating product revenue contribution chart...
   Saved: product_revenue_pie.png

[4/4] Creating budget consumption gauge...
   [WARNING] No budget alert found

============================================================
Business visualizations generated successfully!
Client: test_1
============================================================

[8/13] generate_funnel_data.py (퍼널 데이터)
🚀 퍼널 분석을 시작합니다...
   카테고리: default
   클라이언트: test_1
   임계값 프리셋: default
   데이터 파일: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\GA4\GA4_data.csv

📊 전체 기간 데이터 사용

📊 CSV 파일 생성 중...
   ✓ 일별 퍼널: 334 rows
   ✓ 채널별 일별 퍼널: 2044 rows
   ✓ 주별 퍼널: 48 rows
   ✓ 채널별 퍼널: 18 rows
   ✓ 캠페인별 퍼널: 20 rows
   ✓ 신규/재방문: 1395 rows

🔍 인사이트 분석 중...
   - BCG Matrix 분석...
   - 상황 인식형 알림 생성...
   - A/B 테스트 & 매출 임팩트...
   - K-Means 클러스터링...
   - 이탈/개선 예측...
   - 성과 트렌드 분석 (7d/14d/30d)...
   - 마이크로 세그먼트 분석 (Upgrade Guide)...

============================================================
✅ 퍼널 분석 완료!
============================================================

📊 성과 요약:
   - 총 방문자: 45,572명
   - 총 구매자: 310명
   - 총 매출: 0원
   - 전환율: 0.68%

📈 고급 분석:
   - A/B 테스트: 21개 (유의미: 2개)
   - 채널 클러스터: 3개 그룹
   - 이탈 위험 (7일): 0개
   - 성과 개선 (7일): 2개
   - 긴급 알림: 18개

🎯 마이크로 세그먼트 (Upgrade Guide):
   - 마이크로 알림: 19개
   - 기회 발견: 2개
   - 문제 감지: 17개

📈 성과 트렌드 분석 (최근 변화 인사이트):
   - 개선 항목 (7일): 4개
   - 개선 항목 (14일): 0개
   - 하락 항목 (7일): 0개
   - 하락 항목 (14일): 0개
   - 동적 임계값: 트래픽 상위 2710명 / RPV 상위 0원

📁 생성된 파일:
   - C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\funnel\insights.json
   - C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\funnel\daily_funnel.csv
   - C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\funnel\weekly_funnel.csv
   - C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\funnel\channel_funnel.csv
   - C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\funnel\campaign_funnel.csv
   - C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\funnel\new_vs_returning.csv

[9/13] generate_engagement_data.py (참여도 데이터)
============================================================
재방문 및 참여도 분석 데이터 생성 스크립트
Client: test_1
============================================================
=== 채널별 참여도 데이터 생성 시작 ===
GA4 데이터 로드 중: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\GA4\GA4_data.csv
재방문 데이터 로드 중: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\funnel\new_vs_returning.csv
채널별 집계 중...
데이터 저장 중: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\funnel\channel_engagement.csv
✓ 채널별 참여도 데이터 생성 완료: 18개 채널

생성된 데이터 샘플:
           channel  Sessions  Engaged sessions  Engagement rate  Average session duration  Bounce rate  Return rate
0           Direct     12280              8292            67.52                      52.3        32.48        81.60
1       구글 Organic      8056              6494            80.61                      70.8        19.39        91.68
2            구글 검색      3019              1483            49.12                      23.5        50.88        74.94
3  구분 불가 (not set)       132                 0             0.00                      31.8       100.00        79.20
4               기타      1342               984            73.32                      72.7        26.68        89.04

=== 신규 vs 재방문 고객 전환율 비교 데이터 생성 시작 ===
재방문 데이터 로드 중: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\funnel\new_vs_returning.csv
데이터 행 수: 1395
컬럼: ['Day', 'funnel', 'Total users', 'New users', 'Returning users', 'New user %']
데이터 저장 중: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\funnel\new_vs_returning_conversion.csv
✓ 신규 vs 재방문 고객 전환율 데이터 생성 완료: 5개 단계

생성된 데이터:
  funnel_stage  Total users  New users  Returning users  New user %  Returning user %  New user CVR  Returning user CVR
0           유입        45572      13094            32478       28.73             71.27         100.0              100.00
1           활동        14392          0            14392        0.00            100.00           0.0               44.31
2           관심         5469          0             5469        0.00            100.00           0.0               16.84
3         결제진행          692          0              692        0.00            100.00           0.0                2.13
4         구매완료          310          0              310        0.00            100.00           0.0                0.95

============================================================
✓ 모든 데이터 생성 완료!
Client: test_1
============================================================

[10/13] generate_funnel_data_multiperiod.py (멀티기간 퍼널)
====================================================================================================
다중 기간 퍼널 인사이트 생성 (중첩 구조)
클라이언트: test_1
====================================================================================================
생성일: 2026-01-11 16:56:02
카테고리: default
기간: 전체 기간, 최근 180일, 최근 90일, 최근 30일


####################################################################################################
# 전체 기간 데이터 생성 중...
####################################################################################################

============================================================
기간: 전체 (--days 0)
============================================================
✓ 전체 기간 완료


####################################################################################################
# 최근 180일 데이터 생성 중...
####################################################################################################

============================================================
기간: 180일 (--days 180)
============================================================
✓ 최근 180일 완료


####################################################################################################
# 최근 90일 데이터 생성 중...
####################################################################################################

============================================================
기간: 90일 (--days 90)
============================================================
✓ 최근 90일 완료


####################################################################################################
# 최근 30일 데이터 생성 중...
####################################################################################################

============================================================
기간: 30일 (--days 30)
============================================================
✓ 최근 30일 완료

✓ CRM 추이 분석 완료 (시점 간 비교 방식)

====================================================================================================
다중 기간 퍼널 인사이트 생성 완료!
====================================================================================================

✓ 저장 위치: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\funnel\insights.json
✓ 포함 기간: 4개
  - 전체 기간: 2025-02-12 ~ 2026-01-11
  - 최근 180일: 2025-07-15 ~ 2026-01-11
  - 최근 90일: 2025-10-13 ~ 2026-01-11
  - 최근 30일: 2025-12-12 ~ 2026-01-11

✓ 이탈 분석: 전체 기간 데이터 사용
  - 7일 이탈 위험: 0건
  - 30일 이탈 위험: 3건

✓ CRM 액션 (시점 간 추이 분석):
  분석 방식: d_day (최근 7일 평균) vs d_day-N (N일 전 7일 평균)
  - 전체 기간: 0건 (30일 전 대비 추이)
  - 최근 180일: 0건 (d_day vs d_day-180d (주간 평균))
  - 최근 90일: 0건 (d_day vs d_day-90d (주간 평균))
  - 최근 30일: 0건 (d_day vs d_day-30d (주간 평균))

[11/13] generate_insights_multiperiod.py (멀티기간 인사이트)

======================================================================
🔄 Multi-Period Insight Generator
   📁 클라이언트: test_1
======================================================================
   📅 기간: 전체, 180일, 90일, 30일
   📁 출력: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\forecast\insights.json
======================================================================

============================================================
📊 [full] 전체 분석 시작...
============================================================

============================================================
🧠 AI Marketing Insight Generator v2.2 (Multi-Client + Multi-Period)
   📁 Client: test_1
============================================================
   📅 분석 기간: 전체

[1/6] Loading segment data...
   Loaded: segment_brand.csv
   Loaded: segment_channel.csv
   Loaded: segment_product.csv
   Loaded: segment_promotion.csv
   Calculated segment_stats from filtered data (4 segments)
   Loaded: predictions_daily.csv
   Loaded: predictions_weekly.csv
   Loaded: predictions_monthly.csv

[2/5] Analyzing forecasts...
   Analyzed 1 brand segments
   Analyzed 2 channel segments
   Analyzed 8 product segments
   Analyzed 3 promotion segments

[2.5/5] Analyzing overall performance...
   Current period: 2025-12-12 ~ 2026-01-11
   Total conversions: 53.0
   ROAS: 957.86%

[2.7/5] Analyzing performance trends (7d/14d/30d)...
   7-day improvements: 0, declines: 3
   14-day improvements: 3, declines: 0
   30-day improvements: 0, declines: 0

[3/6] Detecting alerts (Risk Management)...
   Detected 21 segment alerts (Risk signals)
      - 💸 레미니스 효율 저하 주의: ROAS -1324.5%
      - 💸 자켓 효율 저하 주의: ROAS -221.8%
      - 💸 기타 효율 저하 주의: ROAS -205.2%
      - 💸 블라우스 효율 저하 주의: ROAS -161.3%
      - 💸 니트 효율 저하 주의: ROAS -99.7%

[4/6] Finding opportunities (Growth Hacking)...
   Found 9 opportunities (Growth signals)
      - 🚀 레미니스: 수익성 최고조!: ROAS 1324%
      - 🚀 트위스트 셔츠: 수익성 최고조!: ROAS 1107%
      - 🚀 메타_전환: 수익성 최고조!: ROAS 958%

[4.5/6] Analyzing Forecast Matrix (4-Quadrant)...
   brand: 🚀1 🛡️0 🌱0 🗑️0
   product: 🚀0 🛡️2 🌱0 🗑️2
   channel: 🚀1 🛡️0 🌱0 🗑️0
   promotion: 🚀1 🛡️0 🌱0 🗑️1
   Total matrix insights: 8

[5/6] Generating recommendations...
   Generated 4 segment recommendations
      - channel/메타_전환: [scale_up] '메타_전환' 채널 예산을 30% 증액하고, 일예산 상한(Cap)을 해제...
      - brand/앳드맹: [scale_up] '앳드맹' 브랜드 키워드 점유율을 높이고, 경쟁사 키워드도 공략하세요....
      - promotion/파트너쉽: [scale_up] '파트너쉽' 프로모션 기간을 연장하거나, 앵콜 기획전을 준비하세요....
      - product/레미니스: [defend] '레미니스' 상품의 번들 구성으로 객단가를 높여 수익을 방어하세요....

[6/6] Generating natural language summary...

   Summary:
      📊 전체 성과 (2025-12-12 ~ 2026-01-11): ROAS 957.86%, 전환수 53, 전환값 9,158,332원
      📉 트렌드: ROAS -590.2%p 하락 예상

      🚨 주의: product '레미니스'의 ROAS이(가) 1324.5% 하락할 것으로 예측됩니다.
      💡 권장: channel '메타_전환'에 '메타_전환' 채널 예산을 30% 증액하고, 일예산 상한(Cap)을 해제하세요.을 권장합니다. (ROAS 958%로 양호한 효율, CVR 1.72%)
         예상 효과: 예상 추가 매출 275만 원, 전환 +15건
      🔍 추가 검토 대상: 앳드맹, 파트너쉽

============================================================
🎯 AI Marketing Insight Generator v2.2 완료! (전체)
============================================================

[v2.2 신규 기능]
   ✓ Forecast Matrix (4분면): Super Star, Fading Hero, Rising Potential, Problem Child
   ✓ 동적 임계값 (Quantile 기반): 상대 평가
   ✓ 세그먼트 유형별 맞춤 처방: brand/product/channel/promotion
   ✓ Core Risk 감지: 매출 비중 10% 이상 + 저효율 + 역성장

📁 Generated file: data/forecast/insights.json

📊 Insight structure:
   - period: 분석 기간
   - summary_card: AI 비서 스타일 요약 카드
   - matrix_insights: 4분면 인사이트 (v2.2)
   - overall: 전체 성과 분석
   - segments: 세그먼트별 경고 및 추천
   - opportunities: 숨은 기회 발굴
   - performance_trends: 7d/30d 트렌드

   ✅ [full] 완료

============================================================
📊 [180d] 최근 180일 분석 시작...
============================================================

============================================================
🧠 AI Marketing Insight Generator v2.2 (Multi-Client + Multi-Period)
   📁 Client: test_1
============================================================
   📅 분석 기간: 최근 180일

[1/6] Loading segment data...
   Loaded: segment_brand.csv
   Loaded: segment_channel.csv (60/93 rows)
   Loaded: segment_product.csv (288/461 rows)
   Loaded: segment_promotion.csv
   Calculated segment_stats from filtered data (4 segments)
   Loaded: predictions_daily.csv
   Loaded: predictions_weekly.csv
   Loaded: predictions_monthly.csv

[2/5] Analyzing forecasts...
   Analyzed 1 brand segments
   Analyzed 1 channel segments
   Analyzed 5 product segments
   Analyzed 3 promotion segments

[2.5/5] Analyzing overall performance...
   Current period: 2025-12-12 ~ 2026-01-11
   Total conversions: 53.0
   ROAS: 957.86%

[2.7/5] Analyzing performance trends (7d/14d/30d)...
   7-day improvements: 0, declines: 3
   14-day improvements: 3, declines: 0
   30-day improvements: 0, declines: 0

[3/6] Detecting alerts (Risk Management)...
   Detected 13 segment alerts (Risk signals)
      - 💸 레미니스 효율 저하 주의: ROAS -2028.8%
      - 💸 기타 효율 저하 주의: ROAS -205.2%
      - 💸 블라우스 효율 저하 주의: ROAS -143.2%
      - 🛒 블라우스 전환율 하락: 전환수 -65.7%
      - 📉 블라우스 매출 급락 경보: 전환값 -52.9%

[4/6] Finding opportunities (Growth Hacking)...
   Found 6 opportunities (Growth signals)
      - 🚀 레미니스: 수익성 최고조!: ROAS 2029%
      - 🚀 메타_전환: 수익성 최고조!: ROAS 958%
      - 🚀 기타: 수익성 최고조!: ROAS 958%

[4.5/6] Analyzing Forecast Matrix (4-Quadrant)...
   brand: 🚀1 🛡️0 🌱0 🗑️0
   product: 🚀0 🛡️1 🌱0 🗑️1
   channel: 🚀1 🛡️0 🌱0 🗑️0
   promotion: 🚀1 🛡️0 🌱0 🗑️1
   Total matrix insights: 6

[5/6] Generating recommendations...
   Generated 4 segment recommendations
      - channel/메타_전환: [scale_up] '메타_전환' 채널 예산을 30% 증액하고, 일예산 상한(Cap)을 해제...
      - brand/앳드맹: [scale_up] '앳드맹' 브랜드 키워드 점유율을 높이고, 경쟁사 키워드도 공략하세요....
      - promotion/파트너쉽: [scale_up] '파트너쉽' 프로모션 기간을 연장하거나, 앵콜 기획전을 준비하세요....
      - product/레미니스: [defend] '레미니스' 상품의 번들 구성으로 객단가를 높여 수익을 방어하세요....

[6/6] Generating natural language summary...

   Summary:
      📊 전체 성과 (2025-12-12 ~ 2026-01-11): ROAS 957.86%, 전환수 53, 전환값 9,158,332원
      📉 트렌드: ROAS -590.2%p 하락 예상

      🚨 주의: product '레미니스'의 ROAS이(가) 2028.8% 하락할 것으로 예측됩니다.
      💡 권장: channel '메타_전환'에 '메타_전환' 채널 예산을 30% 증액하고, 일예산 상한(Cap)을 해제하세요.을 권장합니다. (ROAS 958%로 양호한 효율, CVR 1.72%)
         예상 효과: 예상 추가 매출 275만 원, 전환 +15건
      🔍 추가 검토 대상: 앳드맹, 파트너쉽

============================================================
🎯 AI Marketing Insight Generator v2.2 완료! (최근 180일)
============================================================

[v2.2 신규 기능]
   ✓ Forecast Matrix (4분면): Super Star, Fading Hero, Rising Potential, Problem Child
   ✓ 동적 임계값 (Quantile 기반): 상대 평가
   ✓ 세그먼트 유형별 맞춤 처방: brand/product/channel/promotion
   ✓ Core Risk 감지: 매출 비중 10% 이상 + 저효율 + 역성장

📁 Generated file: data/forecast/insights.json

📊 Insight structure:
   - period: 분석 기간
   - summary_card: AI 비서 스타일 요약 카드
   - matrix_insights: 4분면 인사이트 (v2.2)
   - overall: 전체 성과 분석
   - segments: 세그먼트별 경고 및 추천
   - opportunities: 숨은 기회 발굴
   - performance_trends: 7d/30d 트렌드

   ✅ [180d] 완료

============================================================
📊 [90d] 최근 90일 분석 시작...
============================================================

============================================================
🧠 AI Marketing Insight Generator v2.2 (Multi-Client + Multi-Period)
   📁 Client: test_1
============================================================
   📅 분석 기간: 최근 90일

[1/6] Loading segment data...
   Loaded: segment_brand.csv
   Loaded: segment_channel.csv (60/93 rows)
   Loaded: segment_product.csv (60/461 rows)
   Loaded: segment_promotion.csv (72/180 rows)
   Calculated segment_stats from filtered data (4 segments)
   Loaded: predictions_daily.csv
   Loaded: predictions_weekly.csv
   Loaded: predictions_monthly.csv

[2/5] Analyzing forecasts...
   Analyzed 1 brand segments
   Analyzed 1 channel segments
   Analyzed 1 product segments
   Analyzed 1 promotion segments

[2.5/5] Analyzing overall performance...
   Current period: 2025-12-12 ~ 2026-01-11
   Total conversions: 53.0
   ROAS: 957.86%

[2.7/5] Analyzing performance trends (7d/14d/30d)...
   7-day improvements: 0, declines: 3
   14-day improvements: 3, declines: 0
   30-day improvements: 0, declines: 0

[3/6] Detecting alerts (Risk Management)...
   Detected 3 segment alerts (Risk signals)
      - 💸 기타 효율 저하 주의: ROAS -205.2%
      - 📉 기타 매출 급락 경보: 전환값 -16.2%
      - 🛒 기타 전환율 하락: 전환수 -12.4%

[4/6] Finding opportunities (Growth Hacking)...
   Found 3 opportunities (Growth signals)
      - 🚀 메타_전환: 수익성 최고조!: ROAS 958%
      - 🚀 기타: 수익성 최고조!: ROAS 958%
      - 🚀 앳드맹: 수익성 최고조!: ROAS 958%

[4.5/6] Analyzing Forecast Matrix (4-Quadrant)...
   brand: 🚀1 🛡️0 🌱0 🗑️0
   product: 🚀0 🛡️1 🌱0 🗑️0
   channel: 🚀1 🛡️0 🌱0 🗑️0
   promotion: 🚀1 🛡️0 🌱0 🗑️0
   Total matrix insights: 4

[5/6] Generating recommendations...
   Generated 4 segment recommendations
      - channel/메타_전환: [scale_up] '메타_전환' 채널 예산을 30% 증액하고, 일예산 상한(Cap)을 해제...
      - brand/앳드맹: [scale_up] '앳드맹' 브랜드 키워드 점유율을 높이고, 경쟁사 키워드도 공략하세요....
      - promotion/파트너쉽: [scale_up] '파트너쉽' 프로모션 기간을 연장하거나, 앵콜 기획전을 준비하세요....
      - product/기타: [defend] '기타' 상품의 번들 구성으로 객단가를 높여 수익을 방어하세요....

[6/6] Generating natural language summary...

   Summary:
      📊 전체 성과 (2025-12-12 ~ 2026-01-11): ROAS 957.86%, 전환수 53, 전환값 9,158,332원
      📉 트렌드: ROAS -590.2%p 하락 예상

      🚨 주의: product '기타'의 ROAS이(가) 205.2% 하락할 것으로 예측됩니다.
      💡 권장: channel '메타_전환'에 '메타_전환' 채널 예산을 30% 증액하고, 일예산 상한(Cap)을 해제하세요.을 권장합니다. (ROAS 958%로 양호한 효율, CVR 1.72%)
         예상 효과: 예상 추가 매출 275만 원, 전환 +15건
      🔍 추가 검토 대상: 앳드맹, 파트너쉽

============================================================
🎯 AI Marketing Insight Generator v2.2 완료! (최근 90일)
============================================================

[v2.2 신규 기능]
   ✓ Forecast Matrix (4분면): Super Star, Fading Hero, Rising Potential, Problem Child
   ✓ 동적 임계값 (Quantile 기반): 상대 평가
   ✓ 세그먼트 유형별 맞춤 처방: brand/product/channel/promotion
   ✓ Core Risk 감지: 매출 비중 10% 이상 + 저효율 + 역성장

📁 Generated file: data/forecast/insights.json

📊 Insight structure:
   - period: 분석 기간
   - summary_card: AI 비서 스타일 요약 카드
   - matrix_insights: 4분면 인사이트 (v2.2)
   - overall: 전체 성과 분석
   - segments: 세그먼트별 경고 및 추천
   - opportunities: 숨은 기회 발굴
   - performance_trends: 7d/30d 트렌드

   ✅ [90d] 완료

============================================================
📊 [30d] 최근 30일 분석 시작...
============================================================

============================================================
🧠 AI Marketing Insight Generator v2.2 (Multi-Client + Multi-Period)
   📁 Client: test_1
============================================================
   📅 분석 기간: 최근 30일

[1/6] Loading segment data...
   Loaded: segment_brand.csv (31/60 rows)
   Loaded: segment_channel.csv (31/93 rows)
   Loaded: segment_product.csv (31/461 rows)
   Loaded: segment_promotion.csv (31/180 rows)
   Calculated segment_stats from filtered data (4 segments)
   Loaded: predictions_daily.csv (31/60 rows)
   Loaded: predictions_weekly.csv
   Loaded: predictions_monthly.csv

[2/5] Analyzing forecasts...
   Analyzed 1 brand segments
   Analyzed 1 channel segments
   Analyzed 1 product segments
   Analyzed 1 promotion segments

[2.5/5] Analyzing overall performance...
   Current period: 2026-01-11 ~ 2026-01-11
   Total conversions: 0.0
   ROAS: 0.0%

[2.7/5] Analyzing performance trends (7d/14d/30d)...
   Warning: Insufficient data for trend analysis (need at least 14 days)

[3/6] Detecting alerts (Risk Management)...
   Detected 0 segment alerts (Risk signals)

[4/6] Finding opportunities (Growth Hacking)...
   Found 0 opportunities (Growth signals)

[4.5/6] Analyzing Forecast Matrix (4-Quadrant)...
   Total matrix insights: 0

[5/6] Generating recommendations...
   Generated 0 segment recommendations

[6/6] Generating natural language summary...

   Summary:
      📊 전체 성과 (2026-01-11 ~ 2026-01-11): ROAS 0.0%, 전환수 0, 전환값 0원
      📈 트렌드: ROAS +367.7%p 개선 예상

      ✅ 현재 모든 세그먼트가 안정적으로 운영되고 있습니다.
         지속적인 모니터링을 권장합니다.

============================================================
🎯 AI Marketing Insight Generator v2.2 완료! (최근 30일)
============================================================

[v2.2 신규 기능]
   ✓ Forecast Matrix (4분면): Super Star, Fading Hero, Rising Potential, Problem Child
   ✓ 동적 임계값 (Quantile 기반): 상대 평가
   ✓ 세그먼트 유형별 맞춤 처방: brand/product/channel/promotion
   ✓ Core Risk 감지: 매출 비중 10% 이상 + 저효율 + 역성장

📁 Generated file: data/forecast/insights.json

📊 Insight structure:
   - period: 분석 기간
   - summary_card: AI 비서 스타일 요약 카드
   - matrix_insights: 4분면 인사이트 (v2.2)
   - overall: 전체 성과 분석
   - segments: 세그먼트별 경고 및 추천
   - opportunities: 숨은 기회 발굴
   - performance_trends: 7d/30d 트렌드

   ✅ [30d] 완료

======================================================================
🎯 Multi-Period Insight Generator 완료!
======================================================================

📁 Generated file: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\forecast\insights.json

📊 JSON Structure:
   {
     'generated_at': '...',
     'by_period': {
       'full': { ... },  ✅
       '180d': { ... },  ✅
       '90d': { ... },  ✅
       '30d': { ... },  ✅
     }
   }

============================================================
MULTI-PERIOD INSIGHTS SUMMARY
============================================================
   [full] 경고: 21건, 기회: 5건
   [180d] 경고: 13건, 기회: 5건
   [90d] 경고: 3건, 기회: 3건
   [30d] 경고: 0건, 기회: 0건

[12/13] generate_type_insights_multiperiod.py (멀티기간 유형별)
====================================================================================================
다중 기간 인사이트 생성 (중첩 구조)
클라이언트: test_1
====================================================================================================
생성일: 2026-01-11 16:56:21
기간: 전체 기간, 최근 180일, 최근 90일


####################################################################################################
# 전체 기간 데이터 생성 중...
####################################################################################################

============================================================
기간: full (--days 0)
============================================================

  [Step 1] Prophet 예측 생성 중...

  [Prophet] 학습 데이터: 전체(365일), 예측: 30일
  [Prophet] 완료

  [Step 2] 인사이트 생성 중...
✓ 전체 기간 완료


####################################################################################################
# 최근 180일 데이터 생성 중...
####################################################################################################

============================================================
기간: 180d (--days 180)
============================================================

  [Step 1] Prophet 예측 생성 중...

  [Prophet] 학습 데이터: 최근 180일, 예측: 30일
  [Prophet] 완료

  [Step 2] 인사이트 생성 중...
✓ 최근 180일 완료


####################################################################################################
# 최근 90일 데이터 생성 중...
####################################################################################################

============================================================
기간: 90d (--days 90)
============================================================

  [Step 1] Prophet 예측 생성 중...

  [Prophet] 학습 데이터: 최근 90일, 예측: 30일
  [Prophet] 완료

  [Step 2] 인사이트 생성 중...
✓ 최근 90일 완료

====================================================================================================
다중 기간 인사이트 생성 완료!
====================================================================================================

✓ 저장 위치: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\test_1\type\insights.json
✓ 포함 기간: 3개
  - 전체 기간: 2025-01-02 ~ 2026-01-11
  - 최근 180일: 2025-07-15 ~ 2026-01-11
  - 최근 90일: 2025-10-13 ~ 2026-01-11

✓ 분기별 추이: 전체 기간 데이터 사용

[13/13] export_json.py (JSON 내보내기)
================================================================================
📦 Next.js용 JSON 내보내기
================================================================================

클라이언트: test_1

출력 경로: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\public\data\test_1

📊 KPI 데이터 추출 중...
  ✓ statistics.json 로드 완료
  ✓ daily_statistics.csv 로드 완료 (1210행)

🔮 예측 데이터 추출 중...
  ✓ 예측 데이터 로드 완료 (일별: 60행)

🔻 퍼널 데이터 추출 중...
  ✓ 퍼널 데이터 로드 완료 (일별: 31행)

🎨 크리에이티브 데이터 추출 중...
  ✓ 크리에이티브 데이터 로드 완료 (2864개)

📐 차원별 분석 데이터 추출 중...
  ✓ 차원별 데이터 로드 완료 (총 32671행)

💡 통합 인사이트 추출 중...
  ✓ Type 인사이트: 0개 추천사항
  ✓ Funnel 인사이트: 0개

📝 메타데이터 생성 중...
  ✓ 메타데이터 생성 완료

================================================================================
📊 내보내기 결과
================================================================================
  ✅ kpi.json
  ✅ forecast.json
  ✅ funnel.json
  ✅ creative.json
  ✅ dimensions.json
  ✅ insights.json
  ✅ meta.json

총 7/7 파일 생성 완료
출력 경로: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\public\data\test_1

📁 생성된 파일 크기:
  creative.json: 1.9 MB
  dimensions.json: 21.1 MB
  forecast.json: 351.7 KB
  funnel.json: 299.7 KB
  insights.json: 691.1 KB
  kpi.json: 1.4 MB
  meta.json: 353 bytes

================================================================================
✅ JSON 내보내기 완료!
================================================================================

============================================================
 Analysis 완료
============================================================
 출력 경로: data/test_1/

 주요 생성 폴더:
   - type/         (유형별 분석 결과)
   - forecast/     (예측 데이터)
   - ga4_data/     (GA4 퍼널 데이터)
   - multiperiod/  (멀티기간 분석 데이터)
   - json/         (JSON 내보내기)

Press any key to continue . . .
