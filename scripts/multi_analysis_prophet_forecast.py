"""
Prophet 시계열 예측 V5 - 연간 학습 기반 다중 지표 예측

- Prophet 1.2.0+ (cmdstanpy 백엔드, Python 3.13 지원)
- 최근 365일 데이터 기반 학습 (연간 계절성 반영)
- 유형구분별 일별 다중 지표 예측 (향후 30일)
- Dimension Type별 예측 (브랜드, 상품, 성별, 연령, 기기플랫폼)
- 비용, 노출, 클릭, 전환수, 전환값 모두 예측
- 예측 ROAS, CPA 자동 계산
- 365일 미만 데이터도 정상 동작 (경고 메시지 출력)
"""

import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path
import argparse
import warnings
warnings.filterwarnings('ignore')

try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    print("Prophet이 설치되지 않았습니다.")
    print("설치 방법: pip install prophet>=1.2.0 cmdstanpy>=1.3.0")

# 경로 설정 (동적 경로)
BASE_DIR = Path(__file__).parent.parent
DATA_TYPE_DIR = BASE_DIR / 'data' / 'type'

# 예측 대상 지표 목록
FORECAST_METRICS = ['비용', '노출', '클릭', '전환수', '전환값']

# 명령줄 인자 파싱
parser = argparse.ArgumentParser(description='Prophet 시계열 예측 - 기간별 학습 지원')
parser.add_argument('--days', type=int, default=0,
                    help='학습 데이터 기간 (0=전체/365일, 180=최근180일, 90=최근90일)')
parser.add_argument('--output-days', type=int, default=30,
                    help='예측 기간 (기본 30일)')
args = parser.parse_args()

# 학습 기간 설정 (일) - 명령줄 인자 또는 기본값
TRAINING_DAYS = args.days if args.days > 0 else 365
# 출력 기간 설정 (일) - 예측 데이터
OUTPUT_DAYS = args.output_days

def forecast_multiple_metrics(daily_data, metrics=FORECAST_METRICS, periods=OUTPUT_DAYS):
    """
    여러 지표를 동시에 예측하는 함수 (최근 365일 데이터 사용)

    Args:
        daily_data: 일별 집계 데이터 (DataFrame, '일' 컬럼 필수)
        metrics: 예측할 지표 리스트
        periods: 예측 기간 (일)

    Returns:
        dict: {metric: forecast_df} 형태의 딕셔너리
    """
    forecasts = {}

    # 최근 365일 데이터만 필터링
    if '일' in daily_data.columns:
        max_date = daily_data['일'].max()
        cutoff_date = max_date - pd.Timedelta(days=TRAINING_DAYS)
        filtered_data = daily_data[daily_data['일'] >= cutoff_date].copy()
    else:
        filtered_data = daily_data.copy()

    for metric in metrics:
        if metric not in filtered_data.columns:
            continue

        prophet_df = filtered_data[['일', metric]].copy()
        prophet_df.columns = ['ds', 'y']
        prophet_df = prophet_df[prophet_df['y'] > 0]

        if len(prophet_df) < 10:
            continue

        # 데이터 기간 확인하여 연간 계절성 자동 설정
        data_days = (prophet_df['ds'].max() - prophet_df['ds'].min()).days
        use_yearly = data_days >= 365

        model = Prophet(
            yearly_seasonality=use_yearly,
            weekly_seasonality=True,
            daily_seasonality=False,
            changepoint_prior_scale=0.05,
        )

        model.fit(prophet_df)
        future = model.make_future_dataframe(periods=periods)
        forecast = model.predict(future)

        # 음수 값을 0으로 클리핑 (비용, 전환 등은 음수가 될 수 없음)
        forecast_result = forecast.tail(periods)[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].copy()
        forecast_result['yhat'] = forecast_result['yhat'].clip(lower=0)
        forecast_result['yhat_lower'] = forecast_result['yhat_lower'].clip(lower=0)
        forecast_result['yhat_upper'] = forecast_result['yhat_upper'].clip(lower=0)
        forecasts[metric] = forecast_result

    return forecasts

def combine_metric_forecasts(forecasts, key_column=None, key_value=None):
    """
    여러 지표 예측 결과를 하나의 DataFrame으로 결합

    Args:
        forecasts: {metric: forecast_df} 딕셔너리
        key_column: 그룹 키 컬럼명 (예: '브랜드명', '성별')
        key_value: 그룹 키 값

    Returns:
        DataFrame: 결합된 예측 결과
    """
    if not forecasts:
        return None

    # 기준 날짜 가져오기
    first_metric = list(forecasts.keys())[0]
    result = forecasts[first_metric][['ds']].copy()
    result.columns = ['일자']

    # 각 지표별 예측값 추가
    for metric, forecast_df in forecasts.items():
        result[f'예측_{metric}'] = forecast_df['yhat'].values

    # 모든 예측 지표에 음수 클리핑 적용
    for col in result.columns:
        if col.startswith('예측_') and result[col].dtype in ['int64', 'float64']:
            result[col] = result[col].clip(lower=0)

    # 예측 ROAS, CPA 계산 (음수 클리핑 후 계산)
    if '예측_전환값' in result.columns and '예측_비용' in result.columns:
        result['예측_ROAS'] = (result['예측_전환값'] / result['예측_비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
        result['예측_ROAS'] = result['예측_ROAS'].clip(lower=0)

    if '예측_비용' in result.columns and '예측_전환수' in result.columns:
        result['예측_CPA'] = (result['예측_비용'] / result['예측_전환수']).replace([np.inf, -np.inf], 0).fillna(0)
        result['예측_CPA'] = result['예측_CPA'].clip(lower=0)

    # 키 컬럼 추가
    if key_column and key_value:
        result[key_column] = key_value

    return result


def create_actual_data(daily_data, key_column=None, key_value=None):
    """
    실제 데이터를 예측 결과와 동일한 형식으로 변환 (최근 OUTPUT_DAYS일)

    Args:
        daily_data: 일별 집계 데이터 (DataFrame)
        key_column: 그룹 키 컬럼명 (예: '브랜드명', '성별')
        key_value: 그룹 키 값

    Returns:
        DataFrame: 실제 데이터 (예측 형식과 동일)
    """
    # 최근 OUTPUT_DAYS일 데이터 추출
    actual = daily_data.tail(OUTPUT_DAYS).copy()

    # 컬럼명 변환 (예측 형식과 일치)
    result = pd.DataFrame()
    result['일자'] = actual['일'].dt.strftime('%Y-%m-%d')

    for metric in FORECAST_METRICS:
        if metric in actual.columns:
            result[f'예측_{metric}'] = actual[metric].values

    # ROAS, CPA 계산
    if '예측_전환값' in result.columns and '예측_비용' in result.columns:
        result['예측_ROAS'] = (result['예측_전환값'] / result['예측_비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)

    if '예측_비용' in result.columns and '예측_전환수' in result.columns:
        result['예측_CPA'] = (result['예측_비용'] / result['예측_전환수']).replace([np.inf, -np.inf], 0).fillna(0)

    # 타입 표시
    result['type'] = 'actual'

    # 키 컬럼 추가
    if key_column and key_value:
        result[key_column] = key_value

    return result


def combine_actual_and_forecast(actual_df, forecast_df):
    """
    실제 데이터와 예측 데이터를 결합

    Args:
        actual_df: 실제 데이터 DataFrame
        forecast_df: 예측 데이터 DataFrame

    Returns:
        DataFrame: 결합된 데이터 (actual + forecast)
    """
    if forecast_df is None:
        return actual_df

    # 예측 데이터에 type 추가
    forecast_df = forecast_df.copy()
    forecast_df['type'] = 'forecast'

    # 일자 형식 통일
    if 'forecast_df' in dir() and '일자' in forecast_df.columns:
        forecast_df['일자'] = pd.to_datetime(forecast_df['일자']).dt.strftime('%Y-%m-%d')

    # 결합
    combined = pd.concat([actual_df, forecast_df], ignore_index=True)

    return combined


# CSV 파일 읽기
file_path = DATA_TYPE_DIR / 'merged_data.csv'
df = pd.read_csv(file_path, thousands=',', low_memory=False)
df['일'] = pd.to_datetime(df['일'])

# 수치형 컬럼 변환
numeric_cols = ['비용', '노출', '클릭', '전환수', '전환값']
for col in numeric_cols:
    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

print("=" * 100)
print("Prophet 시계열 예측 V5 - 연간 학습 기반 다중 지표 예측")
print("=" * 100)
print(f"데이터 기간: {df['일'].min().date()} ~ {df['일'].max().date()}")
print(f"총 데이터: {len(df):,}행")

# 학습 기간 계산 및 메시지 출력
total_data_days = (df['일'].max() - df['일'].min()).days + 1
print(f"학습 기준: 최근 {TRAINING_DAYS}일 (연간 학습)")

if total_data_days < TRAINING_DAYS:
    print(f"⚠️ 현재 데이터: {total_data_days}일 ({TRAINING_DAYS}일 미만)")
    print(f"   → 연간 계절성(yearly_seasonality) 비활성화, 주간 패턴만 학습")
else:
    print(f"✓ 현재 데이터: {total_data_days}일 (연간 학습 가능)")

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
# ROAS는 mean이 아닌 sum 기반으로 계산
total_cost_actual = daily_data['비용'].sum()
total_revenue_actual = daily_data['전환값'].sum()
actual_roas = (total_revenue_actual / total_cost_actual * 100) if total_cost_actual > 0 else 0
print(f"  평균 ROAS: {actual_roas:.1f}%")

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
    print(f"1. 전체 다중 지표 예측 (실제 {OUTPUT_DAYS}일 + 예측 {OUTPUT_DAYS}일)")
    print("=" * 100)

    print("\nProphet 모델 학습 중... (비용, 노출, 클릭, 전환수, 전환값)")

    # 전체 다중 지표 예측
    overall_forecasts = forecast_multiple_metrics(daily_data)
    overall_forecast_result = combine_metric_forecasts(overall_forecasts)

    # 실제 데이터 생성
    overall_actual_result = create_actual_data(daily_data)

    # 실제 + 예측 결합
    overall_result = combine_actual_and_forecast(overall_actual_result, overall_forecast_result)

    if overall_result is not None:
        print(f"\n데이터 구성:")
        print(f"  - 실제 데이터: {len(overall_result[overall_result['type'] == 'actual'])}일")
        print(f"  - 예측 데이터: {len(overall_result[overall_result['type'] == 'forecast'])}일")

        # 예측 데이터만 요약
        forecast_only = overall_result[overall_result['type'] == 'forecast']
        print(f"\n예측 요약 ({len(forecast_only)}일 총합):")
        for metric in FORECAST_METRICS:
            col = f'예측_{metric}'
            if col in forecast_only.columns:
                print(f"  {metric}: {forecast_only[col].sum():,.0f}")
        # ROAS/CPA는 sum 기반으로 계산
        forecast_total_cost = forecast_only['예측_비용'].sum() if '예측_비용' in forecast_only.columns else 0
        forecast_total_revenue = forecast_only['예측_전환값'].sum() if '예측_전환값' in forecast_only.columns else 0
        forecast_total_conversions = forecast_only['예측_전환수'].sum() if '예측_전환수' in forecast_only.columns else 0
        if forecast_total_cost > 0:
            avg_roas = (forecast_total_revenue / forecast_total_cost * 100)
            print(f"  평균 ROAS: {avg_roas:.1f}%")
        if forecast_total_conversions > 0:
            avg_cpa = (forecast_total_cost / forecast_total_conversions)
            print(f"  평균 CPA: {avg_cpa:,.0f}원")

        # 전체 예측 결과 저장 (actual + forecast)
        overall_result.to_csv(DATA_TYPE_DIR / 'prophet_forecast_overall.csv',
                              index=False, encoding='utf-8-sig')
        print("\n✓ 전체 예측 결과 저장: data/type/prophet_forecast_overall.csv")

    print("\n" + "=" * 100)
    print(f"2. 주요 유형구분별 다중 지표 예측 (실제 {OUTPUT_DAYS}일 + 예측 {OUTPUT_DAYS}일)")
    print("=" * 100)

    # 주요 유형구분 (상위 3개)
    top_categories = ['메타_전환', '네이버_쇼핑검색', '메타_트래픽']

    category_forecast_results = []

    for category in top_categories:
        category_data = df[(df['data_type'] == 'Type1_캠페인+광고세트') & (df['유형구분'] == category)]

        if len(category_data) < 10:
            print(f"\n[{category}]: 데이터 부족 (건수: {len(category_data)})")
            continue

        daily_category = category_data.groupby('일').agg({
            '비용': 'sum',
            '노출': 'sum',
            '클릭': 'sum',
            '전환수': 'sum',
            '전환값': 'sum'
        }).reset_index()

        if len(daily_category) < 10:
            print(f"\n[{category}]: 유효 데이터 부족")
            continue

        print(f"\n[{category}] 다중 지표 예측")
        print(f"학습 데이터: {len(daily_category)}일")

        # 예측 데이터 생성
        cat_forecasts = forecast_multiple_metrics(daily_category)
        cat_forecast_result = combine_metric_forecasts(cat_forecasts, '유형구분', category)

        # 실제 데이터 생성
        cat_actual_result = create_actual_data(daily_category, '유형구분', category)

        # 실제 + 예측 결합
        cat_result = combine_actual_and_forecast(cat_actual_result, cat_forecast_result)

        if cat_result is not None:
            category_forecast_results.append(cat_result)
            forecast_only = cat_result[cat_result['type'] == 'forecast']
            if '예측_전환값' in forecast_only.columns:
                print(f"향후 {len(forecast_only)}일 예상 총 전환값: {forecast_only['예측_전환값'].sum():,.0f}원")
            # ROAS는 sum 기반으로 계산
            if '예측_비용' in forecast_only.columns and '예측_전환값' in forecast_only.columns:
                cat_f_cost = forecast_only['예측_비용'].sum()
                cat_f_revenue = forecast_only['예측_전환값'].sum()
                if cat_f_cost > 0:
                    print(f"평균 예측 ROAS: {(cat_f_revenue / cat_f_cost * 100):.1f}%")

    # 유형구분별 예측 결과 통합 저장 (actual + forecast)
    if category_forecast_results:
        combined_category = pd.concat(category_forecast_results, ignore_index=True)
        # 컬럼 순서 정리
        cols = ['유형구분', '일자'] + [f'예측_{m}' for m in FORECAST_METRICS if f'예측_{m}' in combined_category.columns]
        if '예측_ROAS' in combined_category.columns:
            cols.append('예측_ROAS')
        if '예측_CPA' in combined_category.columns:
            cols.append('예측_CPA')
        cols.append('type')
        combined_category = combined_category[[c for c in cols if c in combined_category.columns]]
        combined_category.to_csv(DATA_TYPE_DIR / 'prophet_forecast_by_category.csv',
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
        trend_df.to_csv(DATA_TYPE_DIR / 'prophet_trend_analysis.csv',
                       index=False, encoding='utf-8-sig')
        print("\n✓ 트렌드 분석 결과 저장: data/type/prophet_trend_analysis.csv")

    print("\n" + "=" * 100)
    print("4. 계절성 예측 분석 (Prophet 기반) - 다중 지표")
    print("=" * 100)

    # 하이브리드 방식: 과거 데이터 fitted 값 + 예측(OUTPUT_DAYS일)
    SEASONALITY_FORECAST_DAYS = OUTPUT_DAYS  # 출력 기간과 동일하게 설정

    def forecast_seasonality_metrics(data, forecast_days=OUTPUT_DAYS):
        """Prophet으로 365일 미래 예측 반환 (개별 유형구분용)"""
        forecasts = {}

        for metric in FORECAST_METRICS:
            prophet_df = data[['일', metric]].copy()
            prophet_df.columns = ['ds', 'y']
            prophet_df['ds'] = pd.to_datetime(prophet_df['ds'])

            # 학습 기간 제한
            if len(prophet_df) > TRAINING_DAYS:
                prophet_df = prophet_df.tail(TRAINING_DAYS)

            # 연간 학습 가능 여부 확인
            data_days = (prophet_df['ds'].max() - prophet_df['ds'].min()).days
            use_yearly = data_days >= TRAINING_DAYS

            model = Prophet(
                yearly_seasonality=use_yearly,
                weekly_seasonality=True,
                daily_seasonality=False
            )
            model.fit(prophet_df)

            future = model.make_future_dataframe(periods=forecast_days)
            forecast = model.predict(future)

            # 미래 예측값만 추출
            forecast_only = forecast[forecast['ds'] > prophet_df['ds'].max()].copy()

            # 음수 값을 0으로 클리핑 (비용, 전환 등은 음수가 될 수 없음)
            forecast_only['yhat'] = forecast_only['yhat'].clip(lower=0)

            forecasts[metric] = forecast_only[['ds', 'yhat']]

        return forecasts

    def forecast_seasonality_with_history(data, forecast_days=OUTPUT_DAYS):
        """Prophet으로 과거 fitted 값 + 단기 예측 반환 (계절성 분석용)"""
        forecasts_history = {}  # 과거 데이터 fitted 값
        forecasts_future = {}   # 미래 예측값

        for metric in FORECAST_METRICS:
            prophet_df = data[['일', metric]].copy()
            prophet_df.columns = ['ds', 'y']
            prophet_df['ds'] = pd.to_datetime(prophet_df['ds'])

            # 학습 기간 제한
            if len(prophet_df) > TRAINING_DAYS:
                prophet_df = prophet_df.tail(TRAINING_DAYS)

            # 연간 학습 가능 여부 확인
            data_days = (prophet_df['ds'].max() - prophet_df['ds'].min()).days
            use_yearly = data_days >= TRAINING_DAYS

            model = Prophet(
                yearly_seasonality=use_yearly,
                weekly_seasonality=True,
                daily_seasonality=False
            )
            model.fit(prophet_df)

            # 과거 + 미래 전체 예측
            future = model.make_future_dataframe(periods=forecast_days)
            forecast = model.predict(future)

            # 과거 데이터 fitted 값 (계절성 패턴 분석용)
            history_forecast = forecast[forecast['ds'] <= prophet_df['ds'].max()].copy()
            history_forecast['yhat'] = history_forecast['yhat'].clip(lower=0)
            forecasts_history[metric] = history_forecast[['ds', 'yhat']]

            # 미래 예측값 (단기)
            future_forecast = forecast[forecast['ds'] > prophet_df['ds'].max()].copy()
            future_forecast['yhat'] = future_forecast['yhat'].clip(lower=0)
            forecasts_future[metric] = future_forecast[['ds', 'yhat']]

        return forecasts_history, forecasts_future

    print("\n전체 Prophet 계절성 분석 중 (과거 fitted + 90일 예측)...")
    history_forecasts, future_forecasts = forecast_seasonality_with_history(daily_data, SEASONALITY_FORECAST_DAYS)

    # ========== 과거 데이터 기반 계절성 분석 ==========
    # 과거 fitted 값으로 요일별/월별/분기별 패턴 추출
    first_metric = list(history_forecasts.keys())[0]
    history_df = history_forecasts[first_metric][['ds']].copy()
    history_df.columns = ['일자']

    for metric, forecast_df in history_forecasts.items():
        history_df[f'예측_{metric}'] = forecast_df['yhat'].values

    # ROAS, CPA 계산
    history_df['예측_ROAS'] = (history_df['예측_전환값'] / history_df['예측_비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
    history_df['예측_CPA'] = (history_df['예측_비용'] / history_df['예측_전환수']).replace([np.inf, -np.inf], 0).fillna(0)

    # 요일/월/분기 정보 추가
    history_df['요일번호'] = pd.to_datetime(history_df['일자']).dt.dayofweek
    history_df['월'] = pd.to_datetime(history_df['일자']).dt.month
    history_df['년월'] = pd.to_datetime(history_df['일자']).dt.to_period('M').astype(str)
    history_df['분기'] = history_df['월'].apply(
        lambda x: 'Q1(1~3월)' if x <= 3 else ('Q2(4~6월)' if x <= 6 else ('Q3(7~9월)' if x <= 9 else 'Q4(10~12월)'))
    )

    dow_names = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일']

    # ========== 요일별 패턴 (과거 데이터 기반) ==========
    print("\n요일별 예측 성과 분석 (과거 데이터 기반)...")
    dow_forecast = history_df.groupby('요일번호').agg({
        '예측_비용': 'mean',
        '예측_노출': 'mean',
        '예측_클릭': 'mean',
        '예측_전환수': 'mean',
        '예측_전환값': 'mean'
    }).reset_index()

    dow_forecast['예측_ROAS'] = (dow_forecast['예측_전환값'] / dow_forecast['예측_비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
    dow_forecast['예측_CPA'] = (dow_forecast['예측_비용'] / dow_forecast['예측_전환수']).replace([np.inf, -np.inf], 0).fillna(0)
    dow_forecast['요일'] = [dow_names[i] for i in dow_forecast['요일번호']]

    print("\n전체 요일별 예측 성과:")
    for _, row in dow_forecast.iterrows():
        print(f"  {row['요일']}: 비용 {row['예측_비용']:,.0f}원, 전환값 {row['예측_전환값']:,.0f}원, ROAS {row['예측_ROAS']:.1f}%")

    dow_output = dow_forecast[['요일', '예측_비용', '예측_노출', '예측_클릭', '예측_전환수', '예측_전환값', '예측_ROAS', '예측_CPA']].copy()
    dow_output['유형구분'] = '전체'
    dow_output['기간유형'] = '요일별'

    all_seasonality_data = [dow_output]

    # 주요 유형구분별 요일 예측
    print("\n주요 유형구분별 요일 예측 패턴:")
    for category in ['메타_전환', '네이버_쇼핑검색']:
        cat_data = df[df['유형구분'] == category].copy()
        cat_daily = cat_data.groupby('일').agg({
            '비용': 'sum', '노출': 'sum', '클릭': 'sum', '전환수': 'sum', '전환값': 'sum'
        }).reset_index()

        if len(cat_daily) < 30:
            print(f"\n[{category}]: 데이터 부족 (30일 미만)")
            continue

        try:
            cat_forecasts = forecast_seasonality_metrics(cat_daily, SEASONALITY_FORECAST_DAYS)

            # 예측 결과 통합
            cat_forecast_df = cat_forecasts[first_metric][['ds']].copy()
            cat_forecast_df.columns = ['일자']
            for metric, forecast_df in cat_forecasts.items():
                cat_forecast_df[f'예측_{metric}'] = forecast_df['yhat'].values

            cat_forecast_df['예측_ROAS'] = (cat_forecast_df['예측_전환값'] / cat_forecast_df['예측_비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
            cat_forecast_df['예측_CPA'] = (cat_forecast_df['예측_비용'] / cat_forecast_df['예측_전환수']).replace([np.inf, -np.inf], 0).fillna(0)
            cat_forecast_df['요일번호'] = pd.to_datetime(cat_forecast_df['일자']).dt.dayofweek

            # 요일별 집계
            cat_dow = cat_forecast_df.groupby('요일번호').agg({
                '예측_비용': 'mean', '예측_노출': 'mean', '예측_클릭': 'mean',
                '예측_전환수': 'mean', '예측_전환값': 'mean'
            }).reset_index()
            cat_dow['예측_ROAS'] = (cat_dow['예측_전환값'] / cat_dow['예측_비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
            cat_dow['예측_CPA'] = (cat_dow['예측_비용'] / cat_dow['예측_전환수']).replace([np.inf, -np.inf], 0).fillna(0)
            cat_dow['요일'] = [dow_names[i] for i in cat_dow['요일번호']]

            print(f"\n[{category}]")
            for _, row in cat_dow.iterrows():
                print(f"  {row['요일']}: 비용 {row['예측_비용']:,.0f}원, 전환값 {row['예측_전환값']:,.0f}원, ROAS {row['예측_ROAS']:.1f}%")

            cat_dow_output = cat_dow[['요일', '예측_비용', '예측_노출', '예측_클릭', '예측_전환수', '예측_전환값', '예측_ROAS', '예측_CPA']].copy()
            cat_dow_output['유형구분'] = category
            cat_dow_output['기간유형'] = '요일별'
            all_seasonality_data.append(cat_dow_output)
        except Exception as e:
            print(f"\n[{category}]: 예측 오류 - {str(e)}")

    # ========== 월별 예측 집계 (과거 fitted 데이터 기반) ==========
    print("\n월별 예측 성과 분석 (과거 데이터 기반)...")
    monthly_forecast = history_df.groupby('월').agg({
        '예측_비용': 'sum',
        '예측_노출': 'sum',
        '예측_클릭': 'sum',
        '예측_전환수': 'sum',
        '예측_전환값': 'sum'
    }).reset_index()
    monthly_forecast['예측_ROAS'] = (monthly_forecast['예측_전환값'] / monthly_forecast['예측_비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
    monthly_forecast['예측_CPA'] = (monthly_forecast['예측_비용'] / monthly_forecast['예측_전환수']).replace([np.inf, -np.inf], 0).fillna(0)
    monthly_forecast['월명'] = monthly_forecast['월'].apply(lambda x: f"{x}월")

    monthly_output = monthly_forecast[['월명', '예측_비용', '예측_노출', '예측_클릭', '예측_전환수', '예측_전환값', '예측_ROAS', '예측_CPA']].copy()
    monthly_output.columns = ['요일', '예측_비용', '예측_노출', '예측_클릭', '예측_전환수', '예측_전환값', '예측_ROAS', '예측_CPA']
    monthly_output['유형구분'] = '전체'
    monthly_output['기간유형'] = '월별'

    all_monthly_data = [monthly_output]
    print(f"  ✓ 월별 예측 데이터: {len(monthly_output)}행")

    # ========== 분기별 예측 집계 (과거 fitted 데이터 기반) ==========
    print("\n분기별 예측 성과 분석 (과거 데이터 기반)...")
    quarterly_forecast = history_df.groupby('분기').agg({
        '예측_비용': 'mean',
        '예측_노출': 'mean',
        '예측_클릭': 'mean',
        '예측_전환수': 'mean',
        '예측_전환값': 'mean'
    }).reset_index()
    quarterly_forecast['예측_ROAS'] = (quarterly_forecast['예측_전환값'] / quarterly_forecast['예측_비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
    quarterly_forecast['예측_CPA'] = (quarterly_forecast['예측_비용'] / quarterly_forecast['예측_전환수']).replace([np.inf, -np.inf], 0).fillna(0)

    quarterly_output = quarterly_forecast[['분기', '예측_비용', '예측_노출', '예측_클릭', '예측_전환수', '예측_전환값', '예측_ROAS', '예측_CPA']].copy()
    quarterly_output.columns = ['요일', '예측_비용', '예측_노출', '예측_클릭', '예측_전환수', '예측_전환값', '예측_ROAS', '예측_CPA']
    quarterly_output['유형구분'] = '전체'
    quarterly_output['기간유형'] = '분기별'

    all_quarterly_data = [quarterly_output]
    print(f"  ✓ 분기별 예측 데이터: {len(quarterly_output)}행")

    # ========== 일별 예측 데이터 (과거 fitted + 미래 예측) ==========
    print("\n일별 예측 데이터 추가 (과거 fitted + 90일 미래 예측)...")

    # 미래 예측 데이터 구성
    first_metric = list(future_forecasts.keys())[0]
    future_df = future_forecasts[first_metric][['ds']].copy()
    future_df.columns = ['일자']

    for metric, forecast_df in future_forecasts.items():
        future_df[f'예측_{metric}'] = forecast_df['yhat'].values

    future_df['예측_ROAS'] = (future_df['예측_전환값'] / future_df['예측_비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
    future_df['예측_CPA'] = (future_df['예측_비용'] / future_df['예측_전환수']).replace([np.inf, -np.inf], 0).fillna(0)

    # 과거 fitted + 미래 예측 결합
    combined_daily = pd.concat([
        history_df[['일자', '예측_비용', '예측_노출', '예측_클릭', '예측_전환수', '예측_전환값', '예측_ROAS', '예측_CPA']],
        future_df[['일자', '예측_비용', '예측_노출', '예측_클릭', '예측_전환수', '예측_전환값', '예측_ROAS', '예측_CPA']]
    ], ignore_index=True)

    daily_output = combined_daily.copy()
    daily_output['일자'] = pd.to_datetime(daily_output['일자']).dt.strftime('%Y-%m-%d')
    daily_output.columns = ['요일', '예측_비용', '예측_노출', '예측_클릭', '예측_전환수', '예측_전환값', '예측_ROAS', '예측_CPA']
    daily_output['유형구분'] = '전체'
    daily_output['기간유형'] = '일별'
    print(f"  ✓ 일별 예측 데이터: {len(daily_output)}행 (과거 {len(history_df)}일 + 미래 {len(future_df)}일)")

    # 전체 데이터 통합
    seasonality_df = pd.concat(all_seasonality_data, ignore_index=True)
    monthly_df = pd.concat(all_monthly_data, ignore_index=True)
    quarterly_df = pd.concat(all_quarterly_data, ignore_index=True)

    final_seasonality_df = pd.concat([seasonality_df, monthly_df, quarterly_df, daily_output], ignore_index=True)
    final_seasonality_df = final_seasonality_df[['유형구분', '기간유형', '요일', '예측_비용', '예측_노출', '예측_클릭', '예측_전환수', '예측_전환값', '예측_ROAS', '예측_CPA']]
    final_seasonality_df.to_csv(DATA_TYPE_DIR / 'prophet_forecast_by_seasonality.csv',
                         index=False, encoding='utf-8-sig')
    print("\n✓ 계절성 예측 결과 저장: data/type/prophet_forecast_by_seasonality.csv")
    print("  포함 데이터: 요일별, 월별, 분기별 (과거 fitted 기반), 일별 (과거 fitted + 90일 미래 예측)")
    print("  포함 지표: 예측_비용, 예측_노출, 예측_클릭, 예측_전환수, 예측_전환값, 예측_ROAS, 예측_CPA")

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
        outliers_df.to_csv(DATA_TYPE_DIR / 'prophet_outliers.csv',
                          index=False, encoding='utf-8-sig')
        print("\n✓ 이상치 탐지 결과 저장: data/type/prophet_outliers.csv")

    # ============================================================================
    # 6. 브랜드별 다중 지표 예측 (Type1 데이터 기반)
    # ============================================================================
    print("\n" + "=" * 100)
    print(f"6. 브랜드별 다중 지표 예측 (실제 {OUTPUT_DAYS}일 + 예측 {OUTPUT_DAYS}일)")
    print("=" * 100)

    type1_data = df[df['data_type'] == 'Type1_캠페인+광고세트']
    brand_forecast_results = []

    if len(type1_data) > 0:
        # 상위 브랜드 추출 (전환값 기준)
        brand_summary = type1_data.groupby('브랜드명').agg({'전환값': 'sum'}).reset_index()
        brand_summary = brand_summary[brand_summary['브랜드명'] != '-']
        top_brands = brand_summary.nlargest(5, '전환값')['브랜드명'].tolist()

        for brand in top_brands:
            brand_data = type1_data[type1_data['브랜드명'] == brand]
            daily_brand = brand_data.groupby('일').agg({
                '비용': 'sum',
                '노출': 'sum',
                '클릭': 'sum',
                '전환수': 'sum',
                '전환값': 'sum'
            }).reset_index()

            if len(daily_brand) < 10:
                print(f"\n[{brand}]: 데이터 부족 ({len(daily_brand)}일)")
                continue

            print(f"\n[{brand}] 다중 지표 예측")
            print(f"학습 데이터: {len(daily_brand)}일")

            # 예측 데이터 생성
            brand_forecasts = forecast_multiple_metrics(daily_brand)
            brand_forecast_result = combine_metric_forecasts(brand_forecasts, '브랜드명', brand)

            # 실제 데이터 생성
            brand_actual_result = create_actual_data(daily_brand, '브랜드명', brand)

            # 실제 + 예측 결합
            brand_result = combine_actual_and_forecast(brand_actual_result, brand_forecast_result)

            if brand_result is not None:
                brand_forecast_results.append(brand_result)
                forecast_only = brand_result[brand_result['type'] == 'forecast']
                if '예측_전환값' in forecast_only.columns:
                    print(f"향후 {len(forecast_only)}일 예상 총 전환값: {forecast_only['예측_전환값'].sum():,.0f}원")
                # ROAS는 sum 기반으로 계산
                if '예측_비용' in forecast_only.columns and '예측_전환값' in forecast_only.columns:
                    brand_f_cost = forecast_only['예측_비용'].sum()
                    brand_f_revenue = forecast_only['예측_전환값'].sum()
                    if brand_f_cost > 0:
                        print(f"평균 예측 ROAS: {(brand_f_revenue / brand_f_cost * 100):.1f}%")

    # 브랜드별 예측 결과 저장 (actual + forecast)
    if brand_forecast_results:
        combined_brand = pd.concat(brand_forecast_results, ignore_index=True)
        cols = ['브랜드명', '일자'] + [f'예측_{m}' for m in FORECAST_METRICS if f'예측_{m}' in combined_brand.columns]
        if '예측_ROAS' in combined_brand.columns:
            cols.append('예측_ROAS')
        if '예측_CPA' in combined_brand.columns:
            cols.append('예측_CPA')
        cols.append('type')
        combined_brand = combined_brand[[c for c in cols if c in combined_brand.columns]]
        combined_brand.to_csv(DATA_TYPE_DIR / 'prophet_forecast_by_brand.csv',
                                index=False, encoding='utf-8-sig')
        print("\n✓ 브랜드별 예측 결과 저장: data/type/prophet_forecast_by_brand.csv")

    # ============================================================================
    # 7. 상품별 다중 지표 예측 (Type1 데이터 기반)
    # ============================================================================
    print("\n" + "=" * 100)
    print(f"7. 상품별 다중 지표 예측 (실제 {OUTPUT_DAYS}일 + 예측 {OUTPUT_DAYS}일)")
    print("=" * 100)

    product_forecast_results = []

    if len(type1_data) > 0:
        # 상위 상품 추출 (전환값 기준)
        product_summary = type1_data.groupby('상품명').agg({'전환값': 'sum'}).reset_index()
        product_summary = product_summary[product_summary['상품명'] != '-']
        top_products = product_summary.nlargest(5, '전환값')['상품명'].tolist()

        for product in top_products:
            product_data = type1_data[type1_data['상품명'] == product]
            daily_product = product_data.groupby('일').agg({
                '비용': 'sum',
                '노출': 'sum',
                '클릭': 'sum',
                '전환수': 'sum',
                '전환값': 'sum'
            }).reset_index()

            if len(daily_product) < 10:
                print(f"\n[{product}]: 데이터 부족 ({len(daily_product)}일)")
                continue

            print(f"\n[{product}] 다중 지표 예측")
            print(f"학습 데이터: {len(daily_product)}일")

            # 예측 데이터 생성
            product_forecasts = forecast_multiple_metrics(daily_product)
            product_forecast_result = combine_metric_forecasts(product_forecasts, '상품명', product)

            # 실제 데이터 생성
            product_actual_result = create_actual_data(daily_product, '상품명', product)

            # 실제 + 예측 결합
            product_result = combine_actual_and_forecast(product_actual_result, product_forecast_result)

            if product_result is not None:
                product_forecast_results.append(product_result)
                forecast_only = product_result[product_result['type'] == 'forecast']
                if '예측_전환값' in forecast_only.columns:
                    print(f"향후 {len(forecast_only)}일 예상 총 전환값: {forecast_only['예측_전환값'].sum():,.0f}원")
                # ROAS는 sum 기반으로 계산
                if '예측_비용' in forecast_only.columns and '예측_전환값' in forecast_only.columns:
                    product_f_cost = forecast_only['예측_비용'].sum()
                    product_f_revenue = forecast_only['예측_전환값'].sum()
                    if product_f_cost > 0:
                        print(f"평균 예측 ROAS: {(product_f_revenue / product_f_cost * 100):.1f}%")

    # 상품별 예측 결과 저장 (actual + forecast)
    if product_forecast_results:
        combined_product = pd.concat(product_forecast_results, ignore_index=True)
        cols = ['상품명', '일자'] + [f'예측_{m}' for m in FORECAST_METRICS if f'예측_{m}' in combined_product.columns]
        if '예측_ROAS' in combined_product.columns:
            cols.append('예측_ROAS')
        if '예측_CPA' in combined_product.columns:
            cols.append('예측_CPA')
        cols.append('type')
        combined_product = combined_product[[c for c in cols if c in combined_product.columns]]
        combined_product.to_csv(DATA_TYPE_DIR / 'prophet_forecast_by_product.csv',
                                  index=False, encoding='utf-8-sig')
        print("\n✓ 상품별 예측 결과 저장: data/type/prophet_forecast_by_product.csv")

    # ============================================================================
    # 8. 성별 다중 지표 예측 (dimension_type4 CSV 활용 - 이미 매핑된 데이터)
    # ============================================================================
    print("\n" + "=" * 100)
    print(f"8. 성별 다중 지표 예측 (실제 {OUTPUT_DAYS}일 + 예측 {OUTPUT_DAYS}일) - dimension_type4 CSV 활용")
    print("=" * 100)

    # dimension_type4 CSV 파일 로드 (이미 성별_통합 컬럼 포함)
    type4_csv_path = DATA_TYPE_DIR / 'dimension_type4_adset_gender.csv'
    gender_forecast_results = []

    try:
        type4_data = pd.read_csv(type4_csv_path, thousands=',', low_memory=False)
        type4_data['일'] = pd.to_datetime(type4_data['일'])
        for col in numeric_cols:
            if col in type4_data.columns:
                type4_data[col] = pd.to_numeric(type4_data[col], errors='coerce').fillna(0)
        print(f"dimension_type4 CSV 로드 완료: {len(type4_data):,}행")
        print("성별_통합 컬럼 활용 (이미 매핑 완료)")

        # 통합된 성별 목록 (성별_통합 컬럼 사용)
        genders = type4_data[type4_data['성별_통합'] != '-']['성별_통합'].unique()

        for gender in genders:
            gender_data = type4_data[type4_data['성별_통합'] == gender]
            daily_gender = gender_data.groupby('일').agg({
                '비용': 'sum',
                '노출': 'sum',
                '클릭': 'sum',
                '전환수': 'sum',
                '전환값': 'sum'
            }).reset_index()

            if len(daily_gender) < 10:
                print(f"\n[{gender}]: 데이터 부족 ({len(daily_gender)}일)")
                continue

            print(f"\n[{gender}] 다중 지표 예측")
            print(f"학습 데이터: {len(daily_gender)}일")

            # 예측 데이터 생성
            gender_forecasts = forecast_multiple_metrics(daily_gender)
            gender_forecast_result = combine_metric_forecasts(gender_forecasts, '성별_통합', gender)

            # 실제 데이터 생성
            gender_actual_result = create_actual_data(daily_gender, '성별_통합', gender)

            # 실제 + 예측 결합
            gender_result = combine_actual_and_forecast(gender_actual_result, gender_forecast_result)

            if gender_result is not None:
                gender_forecast_results.append(gender_result)
                forecast_only = gender_result[gender_result['type'] == 'forecast']
                if '예측_전환값' in forecast_only.columns:
                    print(f"향후 {len(forecast_only)}일 예상 총 전환값: {forecast_only['예측_전환값'].sum():,.0f}원")
                # ROAS는 sum 기반으로 계산
                if '예측_비용' in forecast_only.columns and '예측_전환값' in forecast_only.columns:
                    gender_f_cost = forecast_only['예측_비용'].sum()
                    gender_f_revenue = forecast_only['예측_전환값'].sum()
                    if gender_f_cost > 0:
                        print(f"평균 예측 ROAS: {(gender_f_revenue / gender_f_cost * 100):.1f}%")

        # 성별 예측 결과 저장 (actual + forecast)
        if gender_forecast_results:
            combined_gender = pd.concat(gender_forecast_results, ignore_index=True)
            cols = ['성별_통합', '일자'] + [f'예측_{m}' for m in FORECAST_METRICS if f'예측_{m}' in combined_gender.columns]
            if '예측_ROAS' in combined_gender.columns:
                cols.append('예측_ROAS')
            if '예측_CPA' in combined_gender.columns:
                cols.append('예측_CPA')
            cols.append('type')
            combined_gender = combined_gender[[c for c in cols if c in combined_gender.columns]]
            combined_gender.to_csv(DATA_TYPE_DIR / 'prophet_forecast_by_gender.csv',
                                     index=False, encoding='utf-8-sig')
            print("\n✓ 성별 예측 결과 저장: data/type/prophet_forecast_by_gender.csv")

    except Exception as e:
        print(f"\n성별 예측 오류: {e}")
        print("dimension_type4 CSV 파일을 확인해주세요.")

    # ============================================================================
    # 9. 연령별 다중 지표 예측 (dimension_type3 CSV 활용 - 이미 매핑된 데이터)
    # ============================================================================
    print("\n" + "=" * 100)
    print(f"9. 연령별 다중 지표 예측 (실제 {OUTPUT_DAYS}일 + 예측 {OUTPUT_DAYS}일) - dimension_type3 CSV 활용")
    print("=" * 100)

    # dimension_type3 CSV 파일 로드 (이미 연령_통합 컬럼 포함)
    type3_csv_path = DATA_TYPE_DIR / 'dimension_type3_adset_age.csv'
    age_forecast_results = []

    try:
        type3_data = pd.read_csv(type3_csv_path, thousands=',', low_memory=False)
        type3_data['일'] = pd.to_datetime(type3_data['일'])
        for col in numeric_cols:
            if col in type3_data.columns:
                type3_data[col] = pd.to_numeric(type3_data[col], errors='coerce').fillna(0)
        print(f"dimension_type3 CSV 로드 완료: {len(type3_data):,}행")
        print("연령_통합 컬럼 활용 (이미 매핑 완료)")

        # 통합된 연령 목록 (연령_통합 컬럼 사용)
        ages = type3_data[type3_data['연령_통합'] != '-']['연령_통합'].unique()

        for age in ages:
            age_data = type3_data[type3_data['연령_통합'] == age]
            daily_age = age_data.groupby('일').agg({
                '비용': 'sum',
                '노출': 'sum',
                '클릭': 'sum',
                '전환수': 'sum',
                '전환값': 'sum'
            }).reset_index()

            if len(daily_age) < 10:
                print(f"\n[{age}]: 데이터 부족 ({len(daily_age)}일)")
                continue

            print(f"\n[{age}] 다중 지표 예측")
            print(f"학습 데이터: {len(daily_age)}일")

            # 예측 데이터 생성
            age_forecasts = forecast_multiple_metrics(daily_age)
            age_forecast_result = combine_metric_forecasts(age_forecasts, '연령_통합', age)

            # 실제 데이터 생성
            age_actual_result = create_actual_data(daily_age, '연령_통합', age)

            # 실제 + 예측 결합
            age_result = combine_actual_and_forecast(age_actual_result, age_forecast_result)

            if age_result is not None:
                age_forecast_results.append(age_result)
                forecast_only = age_result[age_result['type'] == 'forecast']
                if '예측_전환값' in forecast_only.columns:
                    print(f"향후 {len(forecast_only)}일 예상 총 전환값: {forecast_only['예측_전환값'].sum():,.0f}원")
                # ROAS는 sum 기반으로 계산
                if '예측_비용' in forecast_only.columns and '예측_전환값' in forecast_only.columns:
                    age_f_cost = forecast_only['예측_비용'].sum()
                    age_f_revenue = forecast_only['예측_전환값'].sum()
                    if age_f_cost > 0:
                        print(f"평균 예측 ROAS: {(age_f_revenue / age_f_cost * 100):.1f}%")

        # 연령별 예측 결과 저장 (actual + forecast)
        if age_forecast_results:
            combined_age = pd.concat(age_forecast_results, ignore_index=True)
            cols = ['연령_통합', '일자'] + [f'예측_{m}' for m in FORECAST_METRICS if f'예측_{m}' in combined_age.columns]
            if '예측_ROAS' in combined_age.columns:
                cols.append('예측_ROAS')
            if '예측_CPA' in combined_age.columns:
                cols.append('예측_CPA')
            cols.append('type')
            combined_age = combined_age[[c for c in cols if c in combined_age.columns]]
            combined_age.to_csv(DATA_TYPE_DIR / 'prophet_forecast_by_age.csv',
                                  index=False, encoding='utf-8-sig')
            print("\n✓ 연령별 예측 결과 저장: data/type/prophet_forecast_by_age.csv")

    except Exception as e:
        print(f"\n연령 예측 오류: {e}")
        print("dimension_type3 CSV 파일을 확인해주세요.")

    # ============================================================================
    # 10. 기기플랫폼별 다중 지표 예측 (dimension_type7 CSV 활용 - 이미 매핑된 데이터)
    # ============================================================================
    print("\n" + "=" * 100)
    print(f"10. 기기플랫폼별 다중 지표 예측 (실제 {OUTPUT_DAYS}일 + 예측 {OUTPUT_DAYS}일) - dimension_type7 CSV 활용")
    print("=" * 100)

    # dimension_type7 CSV 파일 로드 (이미 기기플랫폼_통합 컬럼 포함)
    type7_csv_path = DATA_TYPE_DIR / 'dimension_type7_adset_deviceplatform.csv'
    platform_forecast_results = []

    try:
        type7_data = pd.read_csv(type7_csv_path, thousands=',', low_memory=False)
        type7_data['일'] = pd.to_datetime(type7_data['일'])
        for col in numeric_cols:
            if col in type7_data.columns:
                type7_data[col] = pd.to_numeric(type7_data[col], errors='coerce').fillna(0)
        print(f"dimension_type7 CSV 로드 완료: {len(type7_data):,}행")
        print("기기플랫폼_통합 컬럼 활용 (이미 매핑 완료)")

        # 통합된 기기플랫폼 목록 (기기플랫폼_통합 컬럼 사용)
        platforms = type7_data[type7_data['기기플랫폼_통합'] != '-']['기기플랫폼_통합'].unique()

        for platform in platforms:
            platform_data = type7_data[type7_data['기기플랫폼_통합'] == platform]
            daily_platform = platform_data.groupby('일').agg({
                '비용': 'sum',
                '노출': 'sum',
                '클릭': 'sum',
                '전환수': 'sum',
                '전환값': 'sum'
            }).reset_index()

            if len(daily_platform) < 10:
                print(f"\n[{platform}]: 데이터 부족 ({len(daily_platform)}일)")
                continue

            print(f"\n[{platform}] 다중 지표 예측")
            print(f"학습 데이터: {len(daily_platform)}일")

            # 예측 데이터 생성
            platform_forecasts = forecast_multiple_metrics(daily_platform)
            platform_forecast_result = combine_metric_forecasts(platform_forecasts, '기기플랫폼_통합', platform)

            # 실제 데이터 생성
            platform_actual_result = create_actual_data(daily_platform, '기기플랫폼_통합', platform)

            # 실제 + 예측 결합
            platform_result = combine_actual_and_forecast(platform_actual_result, platform_forecast_result)

            if platform_result is not None:
                platform_forecast_results.append(platform_result)
                forecast_only = platform_result[platform_result['type'] == 'forecast']
                if '예측_전환값' in forecast_only.columns:
                    print(f"향후 {len(forecast_only)}일 예상 총 전환값: {forecast_only['예측_전환값'].sum():,.0f}원")
                platform_total_cost = forecast_only['예측_비용'].sum() if '예측_비용' in forecast_only.columns else 0
                platform_total_revenue = forecast_only['예측_전환값'].sum() if '예측_전환값' in forecast_only.columns else 0
                platform_roas = (platform_total_revenue / platform_total_cost * 100) if platform_total_cost > 0 else 0
                print(f"평균 예측 ROAS: {platform_roas:.1f}%")

        # 기기플랫폼별 예측 결과 저장 (actual + forecast)
        if platform_forecast_results:
            combined_platform = pd.concat(platform_forecast_results, ignore_index=True)
            cols = ['기기플랫폼_통합', '일자'] + [f'예측_{m}' for m in FORECAST_METRICS if f'예측_{m}' in combined_platform.columns]
            if '예측_ROAS' in combined_platform.columns:
                cols.append('예측_ROAS')
            if '예측_CPA' in combined_platform.columns:
                cols.append('예측_CPA')
            cols.append('type')
            combined_platform = combined_platform[[c for c in cols if c in combined_platform.columns]]
            combined_platform.to_csv(DATA_TYPE_DIR / 'prophet_forecast_by_platform.csv',
                                       index=False, encoding='utf-8-sig')
            print("\n✓ 기기플랫폼별 예측 결과 저장: data/type/prophet_forecast_by_platform.csv")

    except Exception as e:
        print(f"\n기기플랫폼 예측 오류: {e}")
        print("dimension_type7 CSV 파일을 확인해주세요.")

    # ============================================================================
    # 10-2. 기기유형별 다중 지표 예측 (dimension_type5 CSV 활용 - 이미 매핑된 데이터)
    # ============================================================================
    print("\n" + "=" * 100)
    print(f"10-2. 기기유형별 다중 지표 예측 (실제 {OUTPUT_DAYS}일 + 예측 {OUTPUT_DAYS}일) - dimension_type5 CSV 활용")
    print("=" * 100)

    # dimension_type5 CSV 파일 로드 (이미 기기유형_통합 컬럼 포함)
    type5_csv_path = DATA_TYPE_DIR / 'dimension_type5_adset_device.csv'
    device_forecast_results = []

    try:
        type5_data = pd.read_csv(type5_csv_path, thousands=',', low_memory=False)
        type5_data['일'] = pd.to_datetime(type5_data['일'])
        for col in numeric_cols:
            if col in type5_data.columns:
                type5_data[col] = pd.to_numeric(type5_data[col], errors='coerce').fillna(0)
        print(f"dimension_type5 CSV 로드 완료: {len(type5_data):,}행")
        print("기기유형_통합 컬럼 활용 (이미 매핑 완료)")

        # 통합된 기기유형 목록 (기기유형_통합 컬럼 사용)
        devices = type5_data[type5_data['기기유형_통합'] != '-']['기기유형_통합'].unique()

        for device in devices:
            device_data = type5_data[type5_data['기기유형_통합'] == device]
            daily_device = device_data.groupby('일').agg({
                '비용': 'sum',
                '노출': 'sum',
                '클릭': 'sum',
                '전환수': 'sum',
                '전환값': 'sum'
            }).reset_index()

            if len(daily_device) < 10:
                print(f"\n[{device}]: 데이터 부족 ({len(daily_device)}일)")
                continue

            print(f"\n[{device}] 다중 지표 예측")
            print(f"학습 데이터: {len(daily_device)}일")

            # 예측 데이터 생성
            device_forecasts = forecast_multiple_metrics(daily_device)
            device_forecast_result = combine_metric_forecasts(device_forecasts, '기기유형_통합', device)

            # 실제 데이터 생성
            device_actual_result = create_actual_data(daily_device, '기기유형_통합', device)

            # 실제 + 예측 결합
            device_result = combine_actual_and_forecast(device_actual_result, device_forecast_result)

            if device_result is not None:
                device_forecast_results.append(device_result)
                forecast_only = device_result[device_result['type'] == 'forecast']
                if '예측_전환값' in forecast_only.columns:
                    print(f"향후 {len(forecast_only)}일 예상 총 전환값: {forecast_only['예측_전환값'].sum():,.0f}원")
                device_total_cost = forecast_only['예측_비용'].sum() if '예측_비용' in forecast_only.columns else 0
                device_total_revenue = forecast_only['예측_전환값'].sum() if '예측_전환값' in forecast_only.columns else 0
                device_roas = (device_total_revenue / device_total_cost * 100) if device_total_cost > 0 else 0
                print(f"평균 예측 ROAS: {device_roas:.1f}%")

        # 기기유형별 예측 결과 저장 (actual + forecast)
        if device_forecast_results:
            combined_device = pd.concat(device_forecast_results, ignore_index=True)
            cols = ['기기유형_통합', '일자'] + [f'예측_{m}' for m in FORECAST_METRICS if f'예측_{m}' in combined_device.columns]
            if '예측_ROAS' in combined_device.columns:
                cols.append('예측_ROAS')
            if '예측_CPA' in combined_device.columns:
                cols.append('예측_CPA')
            cols.append('type')
            combined_device = combined_device[[c for c in cols if c in combined_device.columns]]
            combined_device.to_csv(DATA_TYPE_DIR / 'prophet_forecast_by_device.csv',
                                     index=False, encoding='utf-8-sig')
            print("\n✓ 기기유형별 예측 결과 저장: data/type/prophet_forecast_by_device.csv")

    except Exception as e:
        print(f"\n기기유형 예측 오류: {e}")
        print("dimension_type5 CSV 파일을 확인해주세요.")

    # ============================================================================
    # 11. 프로모션별 다중 지표 예측 (Type1 데이터 기반)
    # ============================================================================
    print("\n" + "=" * 100)
    print(f"11. 프로모션별 다중 지표 예측 (실제 {OUTPUT_DAYS}일 + 예측 {OUTPUT_DAYS}일)")
    print("=" * 100)

    promotion_forecast_results = []

    if len(type1_data) > 0:
        # 상위 프로모션 추출 (전환값 기준)
        promotion_summary = type1_data.groupby('프로모션').agg({'전환값': 'sum'}).reset_index()
        promotion_summary = promotion_summary[promotion_summary['프로모션'] != '-']
        top_promotions = promotion_summary.nlargest(5, '전환값')['프로모션'].tolist()

        for promotion in top_promotions:
            promotion_data = type1_data[type1_data['프로모션'] == promotion]
            daily_promotion = promotion_data.groupby('일').agg({
                '비용': 'sum',
                '노출': 'sum',
                '클릭': 'sum',
                '전환수': 'sum',
                '전환값': 'sum'
            }).reset_index()

            if len(daily_promotion) < 10:
                print(f"\n[{promotion}]: 데이터 부족 ({len(daily_promotion)}일)")
                continue

            print(f"\n[{promotion}] 다중 지표 예측")
            print(f"학습 데이터: {len(daily_promotion)}일")

            # 예측 데이터 생성
            promotion_forecasts = forecast_multiple_metrics(daily_promotion)
            promotion_forecast_result = combine_metric_forecasts(promotion_forecasts, '프로모션', promotion)

            # 실제 데이터 생성
            promotion_actual_result = create_actual_data(daily_promotion, '프로모션', promotion)

            # 실제 + 예측 결합
            promotion_result = combine_actual_and_forecast(promotion_actual_result, promotion_forecast_result)

            if promotion_result is not None:
                promotion_forecast_results.append(promotion_result)
                forecast_only = promotion_result[promotion_result['type'] == 'forecast']
                if '예측_전환값' in forecast_only.columns:
                    print(f"향후 {len(forecast_only)}일 예상 총 전환값: {forecast_only['예측_전환값'].sum():,.0f}원")
                promotion_total_cost = forecast_only['예측_비용'].sum() if '예측_비용' in forecast_only.columns else 0
                promotion_total_revenue = forecast_only['예측_전환값'].sum() if '예측_전환값' in forecast_only.columns else 0
                promotion_roas = (promotion_total_revenue / promotion_total_cost * 100) if promotion_total_cost > 0 else 0
                print(f"평균 예측 ROAS: {promotion_roas:.1f}%")

    # 프로모션별 예측 결과 저장 (actual + forecast)
    if promotion_forecast_results:
        combined_promotion = pd.concat(promotion_forecast_results, ignore_index=True)
        cols = ['프로모션', '일자'] + [f'예측_{m}' for m in FORECAST_METRICS if f'예측_{m}' in combined_promotion.columns]
        if '예측_ROAS' in combined_promotion.columns:
            cols.append('예측_ROAS')
        if '예측_CPA' in combined_promotion.columns:
            cols.append('예측_CPA')
        cols.append('type')
        combined_promotion = combined_promotion[[c for c in cols if c in combined_promotion.columns]]
        combined_promotion.to_csv(DATA_TYPE_DIR / 'prophet_forecast_by_promotion.csv',
                                    index=False, encoding='utf-8-sig')
        print("\n✓ 프로모션별 예측 결과 저장: data/type/prophet_forecast_by_promotion.csv")

    # ============================================================================
    # 12. 연령+성별 조합별 다중 지표 예측 (dimension_type2 CSV 활용 - 이미 매핑된 데이터)
    # ============================================================================
    print("\n" + "=" * 100)
    print("12. 연령+성별 조합별 다중 지표 예측 (향후 30일) - dimension_type2 CSV 활용")
    print("=" * 100)

    # dimension_type2 CSV 파일 로드 (이미 연령_통합, 성별_통합 컬럼 포함)
    type2_csv_path = DATA_TYPE_DIR / 'dimension_type2_adset_age_gender.csv'
    age_gender_forecast_results = []

    try:
        type2_data = pd.read_csv(type2_csv_path, thousands=',', low_memory=False)
        type2_data['일'] = pd.to_datetime(type2_data['일'])
        for col in numeric_cols:
            if col in type2_data.columns:
                type2_data[col] = pd.to_numeric(type2_data[col], errors='coerce').fillna(0)
        print(f"dimension_type2 CSV 로드 완료: {len(type2_data):,}행")
        print("연령_통합, 성별_통합 컬럼 활용 (이미 매핑 완료)")

        # 유효한 조합만 필터링 (-, 알 수 없음 제외)
        valid_data = type2_data[
            (type2_data['연령_통합'] != '-') &
            (type2_data['성별_통합'] != '-') &
            (type2_data['연령_통합'] != '알 수 없음') &
            (type2_data['성별_통합'] != '알 수 없음')
        ]

        # 상위 조합 추출 (전환값 기준) - 연령_통합 + 성별_통합 조합
        valid_data = valid_data.copy()
        valid_data['연령_성별_조합'] = valid_data['연령_통합'] + '_' + valid_data['성별_통합']
        combo_summary = valid_data.groupby(['연령_통합', '성별_통합']).agg({'전환값': 'sum'}).reset_index()
        combo_summary['연령_성별_조합'] = combo_summary['연령_통합'] + '_' + combo_summary['성별_통합']
        top_combos = combo_summary.nlargest(10, '전환값')[['연령_통합', '성별_통합']].values.tolist()

        for age, gender in top_combos:
            combo_data = valid_data[(valid_data['연령_통합'] == age) & (valid_data['성별_통합'] == gender)]
            daily_combo = combo_data.groupby('일').agg({
                '비용': 'sum',
                '노출': 'sum',
                '클릭': 'sum',
                '전환수': 'sum',
                '전환값': 'sum'
            }).reset_index()

            combo_label = f"{age}_{gender}"
            if len(daily_combo) < 10:
                print(f"\n[{combo_label}]: 데이터 부족 ({len(daily_combo)}일)")
                continue

            print(f"\n[{combo_label}] 다중 지표 예측")
            print(f"학습 데이터: {len(daily_combo)}일")

            # 예측 데이터 생성
            combo_forecasts = forecast_multiple_metrics(daily_combo)
            combo_forecast_result = combine_metric_forecasts(combo_forecasts)

            # 실제 데이터 생성
            combo_actual_result = create_actual_data(daily_combo)

            # 연령_통합, 성별_통합 컬럼 개별 추가 (actual에도 추가)
            if combo_actual_result is not None:
                combo_actual_result['연령_통합'] = age
                combo_actual_result['성별_통합'] = gender

            if combo_forecast_result is not None:
                combo_forecast_result['연령_통합'] = age
                combo_forecast_result['성별_통합'] = gender

            # 실제 + 예측 결합
            combo_result = combine_actual_and_forecast(combo_actual_result, combo_forecast_result)

            if combo_result is not None:
                age_gender_forecast_results.append(combo_result)
                forecast_only = combo_result[combo_result['type'] == 'forecast']
                if '예측_전환값' in forecast_only.columns:
                    print(f"향후 {len(forecast_only)}일 예상 총 전환값: {forecast_only['예측_전환값'].sum():,.0f}원")
                # ROAS는 sum 기반으로 계산
                if '예측_비용' in forecast_only.columns and '예측_전환값' in forecast_only.columns:
                    combo_f_cost = forecast_only['예측_비용'].sum()
                    combo_f_revenue = forecast_only['예측_전환값'].sum()
                    if combo_f_cost > 0:
                        print(f"평균 예측 ROAS: {(combo_f_revenue / combo_f_cost * 100):.1f}%")

        # 연령+성별 조합별 예측 결과 저장 (actual + forecast)
        if age_gender_forecast_results:
            combined_age_gender = pd.concat(age_gender_forecast_results, ignore_index=True)
            cols = ['연령_통합', '성별_통합', '일자'] + [f'예측_{m}' for m in FORECAST_METRICS if f'예측_{m}' in combined_age_gender.columns]
            if '예측_ROAS' in combined_age_gender.columns:
                cols.append('예측_ROAS')
            if '예측_CPA' in combined_age_gender.columns:
                cols.append('예측_CPA')
            cols.append('type')
            combined_age_gender = combined_age_gender[[c for c in cols if c in combined_age_gender.columns]]
            combined_age_gender.to_csv(DATA_TYPE_DIR / 'prophet_forecast_by_age_gender.csv',
                                         index=False, encoding='utf-8-sig')
            print("\n✓ 연령+성별 조합별 예측 결과 저장: data/type/prophet_forecast_by_age_gender.csv")

    except Exception as e:
        print(f"\n연령+성별 조합 예측 오류: {e}")
        print("dimension_type2 CSV 파일을 확인해주세요.")

else:
    print("\n" + "=" * 100)
    print("Prophet 라이브러리를 설치해주세요")
    print("=" * 100)
    print("\n설치 명령어:")
    print("  pip install prophet>=1.2.0 cmdstanpy>=1.3.0")

print("\n" + "=" * 100)
print("분석 완료")
print("=" * 100)

# 최종 학습 기간 요약
print(f"\n[학습 설정 요약]")
print(f"  - 학습 기준: 최근 {TRAINING_DAYS}일 (연간 학습)")
print(f"  - 실제 데이터: {total_data_days}일")
if total_data_days < TRAINING_DAYS:
    print(f"  - 연간 계절성: 비활성화 (데이터 {TRAINING_DAYS}일 미만)")
else:
    print(f"  - 연간 계절성: 활성화")

print("\n생성된 파일 목록 (다중 지표 예측: 비용, 노출, 클릭, 전환수, 전환값, ROAS, CPA):")
print("  1. prophet_forecast_overall.csv - 전체 다중 지표 예측")
print("  2. prophet_forecast_by_category.csv - 유형구분별 다중 지표 예측")
print("  3. prophet_trend_analysis.csv - 트렌드 분석")
print("  4. prophet_forecast_by_seasonality.csv - 계절성 예측 분석")
print("  5. prophet_outliers.csv - 이상치 탐지")
print("  6. prophet_forecast_by_brand.csv - 브랜드별 다중 지표 예측")
print("  7. prophet_forecast_by_product.csv - 상품별 다중 지표 예측")
print("  8. prophet_forecast_by_gender.csv - 성별 다중 지표 예측")
print("  9. prophet_forecast_by_age.csv - 연령별 다중 지표 예측")
print("  10. prophet_forecast_by_platform.csv - 기기플랫폼별 다중 지표 예측")
print("  11. prophet_forecast_by_device.csv - 기기유형별 다중 지표 예측")
print("  12. prophet_forecast_by_promotion.csv - 프로모션별 다중 지표 예측")
print("  13. prophet_forecast_by_age_gender.csv - 연령+성별 조합별 다중 지표 예측")
print("\n각 CSV 파일에는 다음 컬럼이 포함됩니다:")
print("  - 예측_비용, 예측_노출, 예측_클릭, 예측_전환수, 예측_전환값")
print("  - 예측_ROAS (= 예측_전환값 / 예측_비용 * 100)")
print("  - 예측_CPA (= 예측_비용 / 예측_전환수)")
