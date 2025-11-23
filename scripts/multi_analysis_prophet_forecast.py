"""
Prophet 시계열 예측 V2 - 유형구분별 예측

- Prophet 1.2.0+ (cmdstanpy 백엔드, Python 3.13 지원)
- 유형구분별 일별 매출 예측 (향후 30일)
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
numeric_cols = ['비용', '노출', '링크클릭', '전환수', '전환값']
for col in numeric_cols:
    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

print("=" * 100)
print("Prophet 시계열 예측 V2 - 유형구분별 예측")
print("=" * 100)
print(f"데이터 기간: {df['일'].min().date()} ~ {df['일'].max().date()}")
print(f"총 데이터: {len(df):,}행")

# 전체 일별 집계
daily_data = df.groupby('일').agg({
    '비용': 'sum',
    '노출': 'sum',
    '링크클릭': 'sum',
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

    print("\n" + "=" * 100)
    print("3. 유형구분별 트렌드 분석")
    print("=" * 100)

    # 최근 30일 vs 이전 30일 (유형구분별)
    recent_data = df[df['일'] >= (df['일'].max() - pd.Timedelta(days=29))]
    previous_data = df[(df['일'] >= (df['일'].max() - pd.Timedelta(days=59))) &
                       (df['일'] < (df['일'].max() - pd.Timedelta(days=29)))]

    print("\n최근 30일 vs 이전 30일 비교 (유형구분별):")

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
        else:
            print(f"\n[{category}]: 이전 기간 데이터 없음")

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

    # 주요 유형구분별 요일 패턴
    print("\n주요 유형구분별 요일 패턴:")
    for category in ['메타_전환', '네이버_쇼핑검색']:
        cat_data = df[df['유형구분'] == category].copy()
        cat_data['요일번호'] = cat_data['일'].dt.dayofweek

        cat_dow = cat_data.groupby('요일번호').agg({'전환값': 'mean'}).reset_index()
        cat_dow['요일명'] = [dow_names[i] for i in cat_dow['요일번호']]

        print(f"\n[{category}]")
        for _, row in cat_dow.iterrows():
            print(f"  {row['요일명']}: {row['전환값']:,.0f}원")

    print("\n" + "=" * 100)
    print("5. 이상치 탐지 (유형구분별)")
    print("=" * 100)

    from scipy import stats

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
        else:
            print(f"\n[{category}]: 이상치 없음")

else:
    print("\n" + "=" * 100)
    print("Prophet 라이브러리를 설치해주세요")
    print("=" * 100)
    print("\n설치 명령어:")
    print("  pip install prophet>=1.2.0 cmdstanpy>=1.3.0")

print("\n" + "=" * 100)
print("분석 완료")
print("=" * 100)
