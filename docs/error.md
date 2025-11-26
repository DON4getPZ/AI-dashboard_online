====================================================================================================
6. 브랜드별 다중 지표 예측 (향후 30일)
====================================================================================================

[기타] 다중 지표 예측
학습 데이터: 328일
16:51:25 - cmdstanpy - INFO - Chain [1] start processing
16:51:25 - cmdstanpy - INFO - Chain [1] done processing
16:51:25 - cmdstanpy - INFO - Chain [1] start processing
16:51:25 - cmdstanpy - INFO - Chain [1] done processing
16:51:25 - cmdstanpy - INFO - Chain [1] start processing
16:51:25 - cmdstanpy - INFO - Chain [1] done processing
16:51:25 - cmdstanpy - INFO - Chain [1] start processing
16:51:25 - cmdstanpy - INFO - Chain [1] done processing
Traceback (most recent call last):
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\pandas\core\indexes\base.py", line 3812, in get_loc
    return self._engine.get_loc(casted_key)
           ~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^
  File "pandas/_libs/index.pyx", line 167, in pandas._libs.index.IndexEngine.get_loc
  File "pandas/_libs/index.pyx", line 196, in pandas._libs.index.IndexEngine.get_loc
  File "pandas/_libs/hashtable_class_helper.pxi", line 7088, in pandas._libs.hashtable.PyObjectHashTable.get_item
  File "pandas/_libs/hashtable_class_helper.pxi", line 7096, in pandas._libs.hashtable.PyObjectHashTable.get_item
KeyError: '예측_전환값'

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\scripts\multi_analysis_prophet_forecast.py", line 469, in <module>
    print(f"향후 30일 예상 총 전환값: {brand_result['예측_전환값'].sum():,.0f}원")
                                       ~~~~~~~~~~~~^^^^^^^^^^^^^^^
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\pandas\core\frame.py", line 4113, in __getitem__
    indexer = self.columns.get_loc(key)
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\pandas\core\indexes\base.py", line 3819, in get_loc
    raise KeyError(key) from err
KeyError: '예측_전환값'
[WARNING] Prophet forecasting failed

[9/9] Generating type insights (brand/product/promotion)...
====================================================================================================
Type 분석 인사이트 생성
====================================================================================================
생성일: 2025-11-26 16:51:26

데이터 로딩 중...
✓ dimension_type1_campaign_adset.csv 로드 완료
✓ dimension_type2_adset_age_gender.csv 로드 완료
✓ dimension_type3_adset_age.csv 로드 완료
✓ dimension_type4_adset_gender.csv 로드 완료
✓ dimension_type5_adset_device.csv 로드 완료
✓ dimension_type6_adset_platform.csv 로드 완료
✓ dimension_type7_adset_deviceplatform.csv 로드 완료

Prophet 예측 데이터 로딩 중...
✓ prophet_forecast_overall.csv 로드 완료
✓ prophet_forecast_by_category.csv 로드 완료
✓ prophet_forecast_by_brand.csv 로드 완료
✓ prophet_forecast_by_product.csv 로드 완료
✓ prophet_forecast_by_gender.csv 로드 완료
✓ prophet_forecast_by_age.csv 로드 완료
✓ prophet_forecast_by_platform.csv 로드 완료
✓ prophet_forecast_by_promotion.csv 로드 완료
✓ prophet_forecast_by_age_gender.csv 로드 완료
✓ prophet_seasonality.csv 로드 완료

전체 요약 생성 중...
상위 유형구분 분석 중...
성별 인사이트 생성 중...
최고 성과 광고세트 분석 중...
연령x성별 인사이트 생성 중...
기기플랫폼 인사이트 생성 중...
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
Traceback (most recent call last):
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\pandas\core\indexes\base.py", line 3812, in get_loc
    return self._engine.get_loc(casted_key)
           ~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^
  File "pandas/_libs/index.pyx", line 167, in pandas._libs.index.IndexEngine.get_loc
  File "pandas/_libs/index.pyx", line 196, in pandas._libs.index.IndexEngine.get_loc
  File "pandas/_libs/hashtable_class_helper.pxi", line 7088, in pandas._libs.hashtable.PyObjectHashTable.get_item
  File "pandas/_libs/hashtable_class_helper.pxi", line 7096, in pandas._libs.hashtable.PyObjectHashTable.get_item
KeyError: '예측_전환값'

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\scripts\generate_type_insights.py", line 842, in <module>
    "total_forecast_revenue": float(overall_df['예측_전환값'].sum()),
                                    ~~~~~~~~~~^^^^^^^^^^^^^^^
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\pandas\core\frame.py", line 4113, in __getitem__
    indexer = self.columns.get_loc(key)
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\pandas\core\indexes\base.py", line 3819, in get_loc
    raise KeyError(key) from err
KeyError: '예측_전환값'
[WARNING] Type insights generation failed