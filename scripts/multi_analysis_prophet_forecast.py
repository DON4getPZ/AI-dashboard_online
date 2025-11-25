"""
Prophet 시계열 예측 V3 - 유형구분별 + Dimension Type별 예측

- Prophet 1.2.0+ (cmdstanpy 백엔드, Python 3.13 지원)
- 유형구분별 일별 매출 예측 (향후 30일)
- Dimension Type별 예측 (브랜드, 상품, 성별, 연령, 기기플랫폼)
- 계절성 분석
- 이상치 탐지
"""

import pandas as pd
import numpy as np
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    print("Prophet이 설치되지 않았습니다.")
    print("설치 방법: pip install prophet>=1.2.0 cmdstanpy>=1.3.0")

# CSV 파일 읽기
file_path = r'c:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\type\merged_data.csv'
df = pd.read_csv(file_path, thousands=',', low_memory=False)
df['일'] = pd.to_datetime(df['일'])

# 수치형 컬럼 변환
numeric_cols = ['비용', '노출', '클릭', '전환수', '전환값']
for col in numeric_cols:
    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

print("=" * 100)
print("Prophet 시계열 예측 V3 - 유형구분별 + Dimension Type별 예측")
print("=" * 100)
print(f"데이터 기간: {df['일'].min().date()} ~ {df['일'].max().date()}")
print(f"총 데이터: {len(df):,}행")

# 데이터 타입 분류 함수 (multi_analysis_dimension_detail.py와 동일)
def classify_data_type_v2(row):
    has_campaign = row['캠페인이름'] != '-'
    has_adset = row['광고세트'] != '-'
    has_age = row['연령'] != '-'
    has_gender = row['성별'] != '-'
    has_device_type = row['기기유형'] != '-'
    has_platform = row['플랫폼'] != '-'
    has_device_platform = row['기기플랫폼'] != '-'

    if has_campaign and has_adset and not has_age and not has_gender and not has_device_type and not has_platform and not has_device_platform:
        return 'Type1_캠페인+광고세트'
    if not has_campaign and has_adset and has_age and has_gender and not has_device_type and not has_platform and not has_device_platform:
        return 'Type2_광고세트+연령+성별'
    if not has_campaign and has_adset and has_age and not has_gender and not has_device_type and not has_platform and not has_device_platform:
        return 'Type3_광고세트+연령'
    if not has_campaign and has_adset and not has_age and has_gender and not has_device_type and not has_platform and not has_device_platform:
        return 'Type4_광고세트+성별'
    if not has_campaign and has_adset and not has_age and not has_gender and has_device_type and not has_platform and not has_device_platform:
        return 'Type5_광고세트+기기유형'
    if not has_campaign and has_adset and not has_age and not has_gender and not has_device_type and has_platform and not has_device_platform:
        return 'Type6_광고세트+플랫폼'
    if not has_campaign and has_adset and not has_age and not has_gender and not has_device_type and not has_platform and has_device_platform:
        return 'Type7_광고세트+기기플랫폼'
    return 'Other_미분류'

df['data_type'] = df.apply(classify_data_type_v2, axis=1)

# 전체 일별 집계
daily_data = df.groupby('일').agg({
    '비용': 'sum',
    '노출': 'sum',
    '클릭': 'sum',
    '전환수': 'sum',
    '전환값': 'sum'
}).reset_index()

# KPI 계산
daily_data['ROAS'] = (daily_data['전환값'] / daily_data['비용'] * 100).fillna(0).replace([np.inf, -np.inf], 0)
daily_data['CPA'] = (daily_data['비용'] / daily_data['전환수']).replace([np.inf, -np.inf], 0).fillna(0)

print(f"\n일별 집계 데이터: {len(daily_data)}일")
print("\n주요 지표 (일평균):")
print(f"  평균 일 광고비: {daily_data['비용'].mean():,.0f}원")
print(f"  평균 일 전환수: {daily_data['전환수'].mean():,.1f}건")
print(f"  평균 일 전환값: {daily_data['전환값'].mean():,.0f}원")
print(f"  평균 ROAS: {daily_data['ROAS'].mean():.1f}%")

print("\n" + "=" * 100)
print("유형구분별 데이터 현황")
print("=" * 100)

# 유형구분별 집계
category_summary = df.groupby('유형구분').agg({
    '비용': 'sum',
    '전환수': 'sum',
    '전환값': 'sum'
}).reset_index()

category_summary['ROAS'] = (category_summary['전환값'] / category_summary['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)

print("\n유형구분별 전체 성과:")
for _, row in category_summary.iterrows():
    print(f"  {row['유형구분']}: 비용 {row['비용']:,.0f}원, 전환수 {row['전환수']:,.0f}건, "
          f"전환값 {row['전환값']:,.0f}원, ROAS {row['ROAS']:.1f}%")

if PROPHET_AVAILABLE:
    print("\n" + "=" * 100)
    print("1. 전체 전환값 예측 (향후 30일)")
    print("=" * 100)

    # Prophet 데이터 준비
    prophet_df = daily_data[['일', '전환값']].copy()
    prophet_df.columns = ['ds', 'y']
    prophet_df = prophet_df[prophet_df['y'] > 0]

    # Prophet 모델
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False,
        changepoint_prior_scale=0.05,
        seasonality_prior_scale=10.0,
    )

    print("\nProphet 모델 학습 중...")
    model.fit(prophet_df)

    # 미래 30일 예측
    future = model.make_future_dataframe(periods=30)
    forecast = model.predict(future)

    forecast_future = forecast.tail(30)
    print("\n향후 30일 전환값 예측 (상위 10일):")
    print(forecast_future[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].head(10).to_string(index=False))

    print(f"\n예측 요약:")
    print(f"  향후 30일 예상 총 전환값: {forecast_future['yhat'].sum():,.0f}원")
    print(f"  일평균 예상 전환값: {forecast_future['yhat'].mean():,.0f}원")

    # 전체 예측 결과 저장
    forecast_output = forecast_future[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].copy()
    forecast_output.columns = ['일자', '예측값', '하한값', '상한값']
    forecast_output.to_csv(r'c:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\type\prophet_forecast_overall.csv',
                          index=False, encoding='utf-8-sig')
    print("\n✓ 전체 예측 결과 저장: data/type/prophet_forecast_overall.csv")

    print("\n" + "=" * 100)
    print("2. 주요 유형구분별 예측 (향후 30일)")
    print("=" * 100)

    # 주요 유형구분 (상위 3개)
    top_categories = ['메타_전환', '네이버_쇼핑검색', '메타_트래픽']

    category_forecasts = {}

    for category in top_categories:
        category_data = df[df['유형구분'] == category]

        if len(category_data) < 10:
            print(f"\n[{category}]: 데이터 부족 (건수: {len(category_data)})")
            continue

        daily_category = category_data.groupby('일').agg({
            '전환값': 'sum'
        }).reset_index()

        prophet_cat_df = daily_category[['일', '전환값']].copy()
        prophet_cat_df.columns = ['ds', 'y']
        prophet_cat_df = prophet_cat_df[prophet_cat_df['y'] > 0]

        if len(prophet_cat_df) < 10:
            print(f"\n[{category}]: 유효 데이터 부족")
            continue

        print(f"\n[{category}] 예측")
        print(f"학습 데이터: {len(prophet_cat_df)}일")

        model_cat = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            changepoint_prior_scale=0.05,
        )

        model_cat.fit(prophet_cat_df)

        future_cat = model_cat.make_future_dataframe(periods=30)
        forecast_cat = model_cat.predict(future_cat)

        forecast_cat_future = forecast_cat.tail(30)
        category_forecasts[category] = forecast_cat_future

        print(f"향후 30일 예상 총 전환값: {forecast_cat_future['yhat'].sum():,.0f}원")
        print(f"일평균 예상 전환값: {forecast_cat_future['yhat'].mean():,.0f}원")

    # 유형구분별 예측 결과 통합 저장
    if category_forecasts:
        all_category_forecasts = []
        for category, forecast_data in category_forecasts.items():
            cat_output = forecast_data[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].copy()
            cat_output['유형구분'] = category
            all_category_forecasts.append(cat_output)

        combined_forecasts = pd.concat(all_category_forecasts, ignore_index=True)
        combined_forecasts.columns = ['일자', '예측값', '하한값', '상한값', '유형구분']
        combined_forecasts = combined_forecasts[['유형구분', '일자', '예측값', '하한값', '상한값']]
        combined_forecasts.to_csv(r'c:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\type\prophet_forecast_by_category.csv',
                                  index=False, encoding='utf-8-sig')
        print("\n✓ 유형구분별 예측 결과 저장: data/type/prophet_forecast_by_category.csv")

    print("\n" + "=" * 100)
    print("3. 유형구분별 트렌드 분석")
    print("=" * 100)

    # 최근 30일 vs 이전 30일 (유형구분별)
    recent_data = df[df['일'] >= (df['일'].max() - pd.Timedelta(days=29))]
    previous_data = df[(df['일'] >= (df['일'].max() - pd.Timedelta(days=59))) &
                       (df['일'] < (df['일'].max() - pd.Timedelta(days=29)))]

    print("\n최근 30일 vs 이전 30일 비교 (유형구분별):")

    trend_analysis_list = []
    for category in category_summary.head(5)['유형구분']:
        recent_cat = recent_data[recent_data['유형구분'] == category]
        previous_cat = previous_data[previous_data['유형구분'] == category]

        recent_value = recent_cat['전환값'].sum()
        previous_value = previous_cat['전환값'].sum()

        if previous_value > 0:
            change = ((recent_value - previous_value) / previous_value * 100)
            print(f"\n[{category}]")
            print(f"  최근 30일: {recent_value:,.0f}원")
            print(f"  이전 30일: {previous_value:,.0f}원")
            print(f"  변화율: {change:+.1f}%")

            trend_analysis_list.append({
                '유형구분': category,
                '최근_30일': recent_value,
                '이전_30일': previous_value,
                '변화율': change
            })
        else:
            print(f"\n[{category}]: 이전 기간 데이터 없음")

    # 트렌드 분석 결과 저장
    if trend_analysis_list:
        trend_df = pd.DataFrame(trend_analysis_list)
        trend_df.to_csv(r'c:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\type\prophet_trend_analysis.csv',
                       index=False, encoding='utf-8-sig')
        print("\n✓ 트렌드 분석 결과 저장: data/type/prophet_trend_analysis.csv")

    print("\n" + "=" * 100)
    print("4. 계절성 분석 (유형구분별)")
    print("=" * 100)

    # 요일별 패턴 (전체)
    daily_data_with_dow = daily_data.copy()
    daily_data_with_dow['요일번호'] = daily_data_with_dow['일'].dt.dayofweek

    dow_performance = daily_data_with_dow.groupby('요일번호').agg({
        '전환값': 'mean'
    }).reset_index()

    dow_names = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일']
    dow_performance['요일명'] = [dow_names[i] for i in dow_performance['요일번호']]

    print("\n전체 요일별 평균 전환값:")
    for _, row in dow_performance.iterrows():
        print(f"  {row['요일명']}: {row['전환값']:,.0f}원")

    # 전체 요일별 패턴 저장
    dow_output = dow_performance[['요일명', '전환값']].copy()
    dow_output['유형구분'] = '전체'
    dow_output.columns = ['요일', '평균_전환값', '유형구분']

    # 주요 유형구분별 요일 패턴
    print("\n주요 유형구분별 요일 패턴:")
    all_seasonality_data = [dow_output]

    for category in ['메타_전환', '네이버_쇼핑검색']:
        cat_data = df[df['유형구분'] == category].copy()
        cat_data['요일번호'] = cat_data['일'].dt.dayofweek

        cat_dow = cat_data.groupby('요일번호').agg({'전환값': 'mean'}).reset_index()
        cat_dow['요일명'] = [dow_names[i] for i in cat_dow['요일번호']]

        print(f"\n[{category}]")
        for _, row in cat_dow.iterrows():
            print(f"  {row['요일명']}: {row['전환값']:,.0f}원")

        # 유형구분별 요일 패턴 저장용
        cat_dow_output = cat_dow[['요일명', '전환값']].copy()
        cat_dow_output['유형구분'] = category
        cat_dow_output.columns = ['요일', '평균_전환값', '유형구분']
        all_seasonality_data.append(cat_dow_output)

    # 계절성 분석 결과 통합 저장
    seasonality_df = pd.concat(all_seasonality_data, ignore_index=True)
    seasonality_df = seasonality_df[['유형구분', '요일', '평균_전환값']]
    seasonality_df.to_csv(r'c:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\type\prophet_seasonality.csv',
                         index=False, encoding='utf-8-sig')
    print("\n✓ 계절성 분석 결과 저장: data/type/prophet_seasonality.csv")

    print("\n" + "=" * 100)
    print("5. 이상치 탐지 (유형구분별)")
    print("=" * 100)

    from scipy import stats

    all_outliers = []
    for category in ['메타_전환', '네이버_쇼핑검색']:
        cat_daily = df[df['유형구분'] == category].groupby('일').agg({'전환값': 'sum'}).reset_index()

        if len(cat_daily) < 10:
            continue

        cat_daily['zscore'] = np.abs(stats.zscore(cat_daily['전환값'].fillna(0)))

        outliers = cat_daily[cat_daily['zscore'] > 3].sort_values('전환값', ascending=False)

        if len(outliers) > 0:
            print(f"\n[{category}] 이상치 탐지 (상위 5개):")
            for _, row in outliers.head(5).iterrows():
                print(f"  {row['일'].date()}: 전환값 {row['전환값']:,.0f}원 (Z-score: {row['zscore']:.2f})")

            # 이상치 저장용
            outliers_output = outliers[['일', '전환값', 'zscore']].copy()
            outliers_output['유형구분'] = category
            all_outliers.append(outliers_output)
        else:
            print(f"\n[{category}]: 이상치 없음")

    # 이상치 탐지 결과 저장
    if all_outliers:
        outliers_df = pd.concat(all_outliers, ignore_index=True)
        outliers_df = outliers_df[['유형구분', '일', '전환값', 'zscore']]
        outliers_df.columns = ['유형구분', '일자', '전환값', 'Z_Score']
        outliers_df.to_csv(r'c:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\type\prophet_outliers.csv',
                          index=False, encoding='utf-8-sig')
        print("\n✓ 이상치 탐지 결과 저장: data/type/prophet_outliers.csv")

    # ============================================================================
    # 6. 브랜드별 예측 (Type1 데이터 기반)
    # ============================================================================
    print("\n" + "=" * 100)
    print("6. 브랜드별 예측 (향후 30일)")
    print("=" * 100)

    type1_data = df[df['data_type'] == 'Type1_캠페인+광고세트']
    brand_forecasts = []

    if len(type1_data) > 0:
        # 상위 브랜드 추출 (전환값 기준)
        brand_summary = type1_data.groupby('브랜드명').agg({'전환값': 'sum'}).reset_index()
        brand_summary = brand_summary[brand_summary['브랜드명'] != '-']
        top_brands = brand_summary.nlargest(5, '전환값')['브랜드명'].tolist()

        for brand in top_brands:
            brand_data = type1_data[type1_data['브랜드명'] == brand]
            daily_brand = brand_data.groupby('일').agg({'전환값': 'sum'}).reset_index()

            prophet_brand_df = daily_brand[['일', '전환값']].copy()
            prophet_brand_df.columns = ['ds', 'y']
            prophet_brand_df = prophet_brand_df[prophet_brand_df['y'] > 0]

            if len(prophet_brand_df) < 10:
                print(f"\n[{brand}]: 데이터 부족 ({len(prophet_brand_df)}일)")
                continue

            print(f"\n[{brand}] 예측")
            print(f"학습 데이터: {len(prophet_brand_df)}일")

            model_brand = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                changepoint_prior_scale=0.05,
            )

            model_brand.fit(prophet_brand_df)
            future_brand = model_brand.make_future_dataframe(periods=30)
            forecast_brand = model_brand.predict(future_brand)
            forecast_brand_future = forecast_brand.tail(30)

            print(f"향후 30일 예상 총 전환값: {forecast_brand_future['yhat'].sum():,.0f}원")
            print(f"일평균 예상 전환값: {forecast_brand_future['yhat'].mean():,.0f}원")

            # 저장용
            brand_output = forecast_brand_future[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].copy()
            brand_output['브랜드명'] = brand
            brand_forecasts.append(brand_output)

    # 브랜드별 예측 결과 저장
    if brand_forecasts:
        brand_forecast_df = pd.concat(brand_forecasts, ignore_index=True)
        brand_forecast_df.columns = ['일자', '예측값', '하한값', '상한값', '브랜드명']
        brand_forecast_df = brand_forecast_df[['브랜드명', '일자', '예측값', '하한값', '상한값']]
        brand_forecast_df.to_csv(r'c:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\type\prophet_forecast_by_brand.csv',
                                index=False, encoding='utf-8-sig')
        print("\n✓ 브랜드별 예측 결과 저장: data/type/prophet_forecast_by_brand.csv")

    # ============================================================================
    # 7. 상품별 예측 (Type1 데이터 기반)
    # ============================================================================
    print("\n" + "=" * 100)
    print("7. 상품별 예측 (향후 30일)")
    print("=" * 100)

    product_forecasts = []

    if len(type1_data) > 0:
        # 상위 상품 추출 (전환값 기준)
        product_summary = type1_data.groupby('상품명').agg({'전환값': 'sum'}).reset_index()
        product_summary = product_summary[product_summary['상품명'] != '-']
        top_products = product_summary.nlargest(5, '전환값')['상품명'].tolist()

        for product in top_products:
            product_data = type1_data[type1_data['상품명'] == product]
            daily_product = product_data.groupby('일').agg({'전환값': 'sum'}).reset_index()

            prophet_product_df = daily_product[['일', '전환값']].copy()
            prophet_product_df.columns = ['ds', 'y']
            prophet_product_df = prophet_product_df[prophet_product_df['y'] > 0]

            if len(prophet_product_df) < 10:
                print(f"\n[{product}]: 데이터 부족 ({len(prophet_product_df)}일)")
                continue

            print(f"\n[{product}] 예측")
            print(f"학습 데이터: {len(prophet_product_df)}일")

            model_product = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                changepoint_prior_scale=0.05,
            )

            model_product.fit(prophet_product_df)
            future_product = model_product.make_future_dataframe(periods=30)
            forecast_product = model_product.predict(future_product)
            forecast_product_future = forecast_product.tail(30)

            print(f"향후 30일 예상 총 전환값: {forecast_product_future['yhat'].sum():,.0f}원")
            print(f"일평균 예상 전환값: {forecast_product_future['yhat'].mean():,.0f}원")

            # 저장용
            product_output = forecast_product_future[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].copy()
            product_output['상품명'] = product
            product_forecasts.append(product_output)

    # 상품별 예측 결과 저장
    if product_forecasts:
        product_forecast_df = pd.concat(product_forecasts, ignore_index=True)
        product_forecast_df.columns = ['일자', '예측값', '하한값', '상한값', '상품명']
        product_forecast_df = product_forecast_df[['상품명', '일자', '예측값', '하한값', '상한값']]
        product_forecast_df.to_csv(r'c:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\type\prophet_forecast_by_product.csv',
                                  index=False, encoding='utf-8-sig')
        print("\n✓ 상품별 예측 결과 저장: data/type/prophet_forecast_by_product.csv")

    # ============================================================================
    # 8. 성별 예측 (Type4 데이터 기반)
    # ============================================================================
    print("\n" + "=" * 100)
    print("8. 성별 예측 (향후 30일)")
    print("=" * 100)

    type4_data = df[df['data_type'] == 'Type4_광고세트+성별']
    gender_forecasts = []

    if len(type4_data) > 0:
        genders = type4_data[type4_data['성별'] != '-']['성별'].unique()

        for gender in genders:
            gender_data = type4_data[type4_data['성별'] == gender]
            daily_gender = gender_data.groupby('일').agg({'전환값': 'sum'}).reset_index()

            prophet_gender_df = daily_gender[['일', '전환값']].copy()
            prophet_gender_df.columns = ['ds', 'y']
            prophet_gender_df = prophet_gender_df[prophet_gender_df['y'] > 0]

            if len(prophet_gender_df) < 10:
                print(f"\n[{gender}]: 데이터 부족 ({len(prophet_gender_df)}일)")
                continue

            print(f"\n[{gender}] 예측")
            print(f"학습 데이터: {len(prophet_gender_df)}일")

            model_gender = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                changepoint_prior_scale=0.05,
            )

            model_gender.fit(prophet_gender_df)
            future_gender = model_gender.make_future_dataframe(periods=30)
            forecast_gender = model_gender.predict(future_gender)
            forecast_gender_future = forecast_gender.tail(30)

            print(f"향후 30일 예상 총 전환값: {forecast_gender_future['yhat'].sum():,.0f}원")
            print(f"일평균 예상 전환값: {forecast_gender_future['yhat'].mean():,.0f}원")

            # 저장용
            gender_output = forecast_gender_future[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].copy()
            gender_output['성별'] = gender
            gender_forecasts.append(gender_output)

    # 성별 예측 결과 저장
    if gender_forecasts:
        gender_forecast_df = pd.concat(gender_forecasts, ignore_index=True)
        gender_forecast_df.columns = ['일자', '예측값', '하한값', '상한값', '성별']
        gender_forecast_df = gender_forecast_df[['성별', '일자', '예측값', '하한값', '상한값']]
        gender_forecast_df.to_csv(r'c:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\type\prophet_forecast_by_gender.csv',
                                 index=False, encoding='utf-8-sig')
        print("\n✓ 성별 예측 결과 저장: data/type/prophet_forecast_by_gender.csv")

    # ============================================================================
    # 9. 연령별 예측 (Type3 데이터 기반)
    # ============================================================================
    print("\n" + "=" * 100)
    print("9. 연령별 예측 (향후 30일)")
    print("=" * 100)

    type3_data = df[df['data_type'] == 'Type3_광고세트+연령']
    age_forecasts = []

    if len(type3_data) > 0:
        ages = type3_data[type3_data['연령'] != '-']['연령'].unique()

        for age in ages:
            age_data = type3_data[type3_data['연령'] == age]
            daily_age = age_data.groupby('일').agg({'전환값': 'sum'}).reset_index()

            prophet_age_df = daily_age[['일', '전환값']].copy()
            prophet_age_df.columns = ['ds', 'y']
            prophet_age_df = prophet_age_df[prophet_age_df['y'] > 0]

            if len(prophet_age_df) < 10:
                print(f"\n[{age}]: 데이터 부족 ({len(prophet_age_df)}일)")
                continue

            print(f"\n[{age}] 예측")
            print(f"학습 데이터: {len(prophet_age_df)}일")

            model_age = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                changepoint_prior_scale=0.05,
            )

            model_age.fit(prophet_age_df)
            future_age = model_age.make_future_dataframe(periods=30)
            forecast_age = model_age.predict(future_age)
            forecast_age_future = forecast_age.tail(30)

            print(f"향후 30일 예상 총 전환값: {forecast_age_future['yhat'].sum():,.0f}원")
            print(f"일평균 예상 전환값: {forecast_age_future['yhat'].mean():,.0f}원")

            # 저장용
            age_output = forecast_age_future[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].copy()
            age_output['연령'] = age
            age_forecasts.append(age_output)

    # 연령별 예측 결과 저장
    if age_forecasts:
        age_forecast_df = pd.concat(age_forecasts, ignore_index=True)
        age_forecast_df.columns = ['일자', '예측값', '하한값', '상한값', '연령']
        age_forecast_df = age_forecast_df[['연령', '일자', '예측값', '하한값', '상한값']]
        age_forecast_df.to_csv(r'c:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\type\prophet_forecast_by_age.csv',
                              index=False, encoding='utf-8-sig')
        print("\n✓ 연령별 예측 결과 저장: data/type/prophet_forecast_by_age.csv")

    # ============================================================================
    # 10. 기기플랫폼별 예측 (Type7 데이터 기반)
    # ============================================================================
    print("\n" + "=" * 100)
    print("10. 기기플랫폼별 예측 (향후 30일)")
    print("=" * 100)

    type7_data = df[df['data_type'] == 'Type7_광고세트+기기플랫폼']
    platform_forecasts = []

    if len(type7_data) > 0:
        platforms = type7_data[type7_data['기기플랫폼'] != '-']['기기플랫폼'].unique()

        for platform in platforms:
            platform_data = type7_data[type7_data['기기플랫폼'] == platform]
            daily_platform = platform_data.groupby('일').agg({'전환값': 'sum'}).reset_index()

            prophet_platform_df = daily_platform[['일', '전환값']].copy()
            prophet_platform_df.columns = ['ds', 'y']
            prophet_platform_df = prophet_platform_df[prophet_platform_df['y'] > 0]

            if len(prophet_platform_df) < 10:
                print(f"\n[{platform}]: 데이터 부족 ({len(prophet_platform_df)}일)")
                continue

            print(f"\n[{platform}] 예측")
            print(f"학습 데이터: {len(prophet_platform_df)}일")

            model_platform = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                changepoint_prior_scale=0.05,
            )

            model_platform.fit(prophet_platform_df)
            future_platform = model_platform.make_future_dataframe(periods=30)
            forecast_platform = model_platform.predict(future_platform)
            forecast_platform_future = forecast_platform.tail(30)

            print(f"향후 30일 예상 총 전환값: {forecast_platform_future['yhat'].sum():,.0f}원")
            print(f"일평균 예상 전환값: {forecast_platform_future['yhat'].mean():,.0f}원")

            # 저장용
            platform_output = forecast_platform_future[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].copy()
            platform_output['기기플랫폼'] = platform
            platform_forecasts.append(platform_output)

    # 기기플랫폼별 예측 결과 저장
    if platform_forecasts:
        platform_forecast_df = pd.concat(platform_forecasts, ignore_index=True)
        platform_forecast_df.columns = ['일자', '예측값', '하한값', '상한값', '기기플랫폼']
        platform_forecast_df = platform_forecast_df[['기기플랫폼', '일자', '예측값', '하한값', '상한값']]
        platform_forecast_df.to_csv(r'c:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\type\prophet_forecast_by_platform.csv',
                                   index=False, encoding='utf-8-sig')
        print("\n✓ 기기플랫폼별 예측 결과 저장: data/type/prophet_forecast_by_platform.csv")

    # ============================================================================
    # 11. 프로모션별 예측 (Type1 데이터 기반)
    # ============================================================================
    print("\n" + "=" * 100)
    print("11. 프로모션별 예측 (향후 30일)")
    print("=" * 100)

    promotion_forecasts = []

    if len(type1_data) > 0:
        # 상위 프로모션 추출 (전환값 기준)
        promotion_summary = type1_data.groupby('프로모션').agg({'전환값': 'sum'}).reset_index()
        promotion_summary = promotion_summary[promotion_summary['프로모션'] != '-']
        top_promotions = promotion_summary.nlargest(5, '전환값')['프로모션'].tolist()

        for promotion in top_promotions:
            promotion_data = type1_data[type1_data['프로모션'] == promotion]
            daily_promotion = promotion_data.groupby('일').agg({'전환값': 'sum'}).reset_index()

            prophet_promotion_df = daily_promotion[['일', '전환값']].copy()
            prophet_promotion_df.columns = ['ds', 'y']
            prophet_promotion_df = prophet_promotion_df[prophet_promotion_df['y'] > 0]

            if len(prophet_promotion_df) < 10:
                print(f"\n[{promotion}]: 데이터 부족 ({len(prophet_promotion_df)}일)")
                continue

            print(f"\n[{promotion}] 예측")
            print(f"학습 데이터: {len(prophet_promotion_df)}일")

            model_promotion = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                changepoint_prior_scale=0.05,
            )

            model_promotion.fit(prophet_promotion_df)
            future_promotion = model_promotion.make_future_dataframe(periods=30)
            forecast_promotion = model_promotion.predict(future_promotion)
            forecast_promotion_future = forecast_promotion.tail(30)

            print(f"향후 30일 예상 총 전환값: {forecast_promotion_future['yhat'].sum():,.0f}원")
            print(f"일평균 예상 전환값: {forecast_promotion_future['yhat'].mean():,.0f}원")

            # 저장용
            promotion_output = forecast_promotion_future[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].copy()
            promotion_output['프로모션'] = promotion
            promotion_forecasts.append(promotion_output)

    # 프로모션별 예측 결과 저장
    if promotion_forecasts:
        promotion_forecast_df = pd.concat(promotion_forecasts, ignore_index=True)
        promotion_forecast_df.columns = ['일자', '예측값', '하한값', '상한값', '프로모션']
        promotion_forecast_df = promotion_forecast_df[['프로모션', '일자', '예측값', '하한값', '상한값']]
        promotion_forecast_df.to_csv(r'c:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\type\prophet_forecast_by_promotion.csv',
                                    index=False, encoding='utf-8-sig')
        print("\n✓ 프로모션별 예측 결과 저장: data/type/prophet_forecast_by_promotion.csv")

else:
    print("\n" + "=" * 100)
    print("Prophet 라이브러리를 설치해주세요")
    print("=" * 100)
    print("\n설치 명령어:")
    print("  pip install prophet>=1.2.0 cmdstanpy>=1.3.0")

print("\n" + "=" * 100)
print("분석 완료")
print("=" * 100)
print("\n생성된 파일 목록:")
print("  1. prophet_forecast_overall.csv - 전체 전환값 예측")
print("  2. prophet_forecast_by_category.csv - 유형구분별 예측")
print("  3. prophet_trend_analysis.csv - 트렌드 분석")
print("  4. prophet_seasonality.csv - 계절성 분석")
print("  5. prophet_outliers.csv - 이상치 탐지")
print("  6. prophet_forecast_by_brand.csv - 브랜드별 예측")
print("  7. prophet_forecast_by_product.csv - 상품별 예측")
print("  8. prophet_forecast_by_gender.csv - 성별 예측")
print("  9. prophet_forecast_by_age.csv - 연령별 예측")
print("  10. prophet_forecast_by_platform.csv - 기기플랫폼별 예측")
print("  11. prophet_forecast_by_promotion.csv - 프로모션별 예측")
