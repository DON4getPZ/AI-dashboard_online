"""
Prophet 시계열 예측 V5 - 연간 학습 기반 다중 지표 예측

- Prophet 1.2.0+ (cmdstanpy 백엔드, Python 3.13 지원)
- 최근 365일 데이터 기반 학습 (연간 계절성 반영)
- 유형구분별 일별 다중 지표 예측 (향후 30일)
- Dimension Type별 예측 (브랜드, 상품, 성별, 연령, 기기플랫폼)
- 비용, 노출, 클릭, 전환수, 전환값 모두 예측
- 예측 ROAS, CPA 자동 계산
- 365일 미만 데이터도 정상 동작 (경고 메시지 출력)

사용법:
- 레거시: python multi_analysis_prophet_forecast.py
- 멀티클라이언트: python multi_analysis_prophet_forecast.py --client clientA
- 옵션: --days 365 --output-days 30
"""

import argparse
import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import Optional
import sys
import warnings
warnings.filterwarnings('ignore')

# 프로젝트 루트를 path에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.common.paths import ClientPaths, parse_client_arg, PROJECT_ROOT

# Prophet 가용성 체크
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    print("Prophet이 설치되지 않았습니다.")
    print("설치 방법: pip install prophet>=1.2.0 cmdstanpy>=1.3.0")

# 레거시 경로 설정 (기본값)
BASE_DIR = Path(__file__).parent.parent
DATA_TYPE_DIR = BASE_DIR / 'data' / 'type'

# 예측 대상 지표 목록
FORECAST_METRICS = ['비용', '노출', '클릭', '전환수', '전환값']


def forecast_multiple_metrics(daily_data, metrics=FORECAST_METRICS, periods=30, training_days=365):
    """
    여러 지표를 동시에 예측하는 함수 (최근 training_days일 데이터 사용)
    """
    forecasts = {}

    # 최근 training_days일 데이터만 필터링
    if '일' in daily_data.columns:
        max_date = daily_data['일'].max()
        cutoff_date = max_date - pd.Timedelta(days=training_days)
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

        # 음수 값을 0으로 클리핑
        forecast_result = forecast.tail(periods)[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].copy()
        forecast_result['yhat'] = forecast_result['yhat'].clip(lower=0)
        forecast_result['yhat_lower'] = forecast_result['yhat_lower'].clip(lower=0)
        forecast_result['yhat_upper'] = forecast_result['yhat_upper'].clip(lower=0)
        forecasts[metric] = forecast_result

    return forecasts


def combine_metric_forecasts(forecasts, key_column=None, key_value=None):
    """여러 지표 예측 결과를 하나의 DataFrame으로 결합"""
    if not forecasts:
        return None

    first_metric = list(forecasts.keys())[0]
    result = forecasts[first_metric][['ds']].copy()
    result.columns = ['일자']

    for metric, forecast_df in forecasts.items():
        result[f'예측_{metric}'] = forecast_df['yhat'].values

    # 모든 예측 지표에 음수 클리핑 적용
    for col in result.columns:
        if col.startswith('예측_') and result[col].dtype in ['int64', 'float64']:
            result[col] = result[col].clip(lower=0)

    # 예측 ROAS, CPA, CPC 계산
    if '예측_전환값' in result.columns and '예측_비용' in result.columns:
        result['예측_ROAS'] = (result['예측_전환값'] / result['예측_비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
        result['예측_ROAS'] = result['예측_ROAS'].clip(lower=0)

    if '예측_비용' in result.columns and '예측_전환수' in result.columns:
        result['예측_CPA'] = (result['예측_비용'] / result['예측_전환수']).replace([np.inf, -np.inf], 0).fillna(0)
        result['예측_CPA'] = result['예측_CPA'].clip(lower=0)

    if '예측_비용' in result.columns and '예측_클릭' in result.columns:
        result['예측_CPC'] = (result['예측_비용'] / result['예측_클릭']).replace([np.inf, -np.inf], 0).fillna(0)
        result['예측_CPC'] = result['예측_CPC'].clip(lower=0)

    if key_column and key_value:
        result[key_column] = key_value

    return result


def create_actual_data(daily_data, output_days=30, key_column=None, key_value=None):
    """실제 데이터를 예측 결과와 동일한 형식으로 변환"""
    actual = daily_data.tail(output_days).copy()

    result = pd.DataFrame()
    result['일자'] = actual['일'].dt.strftime('%Y-%m-%d')

    for metric in FORECAST_METRICS:
        if metric in actual.columns:
            result[f'예측_{metric}'] = actual[metric].values

    # ROAS, CPA, CPC 계산
    if '예측_전환값' in result.columns and '예측_비용' in result.columns:
        result['예측_ROAS'] = (result['예측_전환값'] / result['예측_비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)

    if '예측_비용' in result.columns and '예측_전환수' in result.columns:
        result['예측_CPA'] = (result['예측_비용'] / result['예측_전환수']).replace([np.inf, -np.inf], 0).fillna(0)

    if '예측_비용' in result.columns and '예측_클릭' in result.columns:
        result['예측_CPC'] = (result['예측_비용'] / result['예측_클릭']).replace([np.inf, -np.inf], 0).fillna(0)

    result['type'] = 'actual'

    if key_column and key_value:
        result[key_column] = key_value

    return result


def combine_actual_and_forecast(actual_df, forecast_df):
    """실제 데이터와 예측 데이터를 결합"""
    if forecast_df is None:
        return actual_df

    forecast_df = forecast_df.copy()
    forecast_df['type'] = 'forecast'

    if '일자' in forecast_df.columns:
        forecast_df['일자'] = pd.to_datetime(forecast_df['일자']).dt.strftime('%Y-%m-%d')

    combined = pd.concat([actual_df, forecast_df], ignore_index=True)
    return combined


def classify_data_type_v2(row):
    """데이터 타입 분류"""
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


def run_prophet_forecast(paths: Optional[ClientPaths] = None, training_days: int = 365, output_days: int = 30):
    """
    Prophet 예측 실행

    Args:
        paths: ClientPaths 객체 (멀티클라이언트 모드) 또는 None (레거시 모드)
        training_days: 학습 데이터 기간 (일)
        output_days: 예측 기간 (일)
    """
    # 경로 설정 (클라이언트 모드 vs 레거시 모드)
    if paths:
        data_type_dir = paths.type
    else:
        data_type_dir = DATA_TYPE_DIR

    file_path = data_type_dir / 'merged_data.csv'

    # 입력 파일 존재 확인
    if not file_path.exists():
        print(f"\n❌ 오류: 입력 파일이 존재하지 않습니다: {file_path}")
        return None

    # CSV 파일 읽기
    df = pd.read_csv(file_path, thousands=',', low_memory=False)
    df['일'] = pd.to_datetime(df['일'])

    # 수치형 컬럼 변환
    numeric_cols = ['비용', '노출', '클릭', '전환수', '전환값']
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    print("=" * 100)
    print("Prophet 시계열 예측 V5 - 연간 학습 기반 다중 지표 예측")
    if paths:
        print(f"클라이언트: {paths.client_id}")
    print("=" * 100)
    print(f"데이터 기간: {df['일'].min().date()} ~ {df['일'].max().date()}")
    print(f"총 데이터: {len(df):,}행")

    # 학습 기간 계산 및 메시지 출력
    total_data_days = (df['일'].max() - df['일'].min()).days + 1
    print(f"학습 기준: 최근 {training_days}일 (연간 학습)")

    if total_data_days < training_days:
        print(f"⚠️ 현재 데이터: {total_data_days}일 ({training_days}일 미만)")
        print(f"   → 연간 계절성(yearly_seasonality) 비활성화, 주간 패턴만 학습")
    else:
        print(f"✓ 현재 데이터: {total_data_days}일 (연간 학습 가능)")

    # 데이터 타입 분류
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
    daily_data['CPC'] = (daily_data['비용'] / daily_data['클릭']).replace([np.inf, -np.inf], 0).fillna(0)

    print(f"\n일별 집계 데이터: {len(daily_data)}일")
    print("\n주요 지표 (일평균):")
    print(f"  평균 일 광고비: {daily_data['비용'].mean():,.0f}원")
    print(f"  평균 일 전환수: {daily_data['전환수'].mean():,.1f}건")
    print(f"  평균 일 전환값: {daily_data['전환값'].mean():,.0f}원")

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

    # 출력 디렉토리 생성
    data_type_dir.mkdir(parents=True, exist_ok=True)

    if not PROPHET_AVAILABLE:
        print("\n" + "=" * 100)
        print("Prophet 라이브러리를 설치해주세요")
        print("=" * 100)
        print("\n설치 명령어:")
        print("  pip install prophet>=1.2.0 cmdstanpy>=1.3.0")
        return

    # ============================================================================
    # 1. 전체 다중 지표 예측
    # ============================================================================
    print("\n" + "=" * 100)
    print(f"1. 전체 다중 지표 예측 (실제 {output_days}일 + 예측 {output_days}일)")
    print("=" * 100)

    print("\nProphet 모델 학습 중... (비용, 노출, 클릭, 전환수, 전환값)")

    overall_forecasts = forecast_multiple_metrics(daily_data, periods=output_days, training_days=training_days)
    overall_forecast_result = combine_metric_forecasts(overall_forecasts)

    overall_actual_result = create_actual_data(daily_data, output_days=output_days)

    overall_result = combine_actual_and_forecast(overall_actual_result, overall_forecast_result)

    if overall_result is not None:
        print(f"\n데이터 구성:")
        print(f"  - 실제 데이터: {len(overall_result[overall_result['type'] == 'actual'])}일")
        print(f"  - 예측 데이터: {len(overall_result[overall_result['type'] == 'forecast'])}일")

        forecast_only = overall_result[overall_result['type'] == 'forecast']
        print(f"\n예측 요약 ({len(forecast_only)}일 총합):")
        for metric in FORECAST_METRICS:
            col = f'예측_{metric}'
            if col in forecast_only.columns:
                print(f"  {metric}: {forecast_only[col].sum():,.0f}")

        forecast_total_cost = forecast_only['예측_비용'].sum() if '예측_비용' in forecast_only.columns else 0
        forecast_total_revenue = forecast_only['예측_전환값'].sum() if '예측_전환값' in forecast_only.columns else 0
        forecast_total_conversions = forecast_only['예측_전환수'].sum() if '예측_전환수' in forecast_only.columns else 0
        if forecast_total_cost > 0:
            avg_roas = (forecast_total_revenue / forecast_total_cost * 100)
            print(f"  평균 ROAS: {avg_roas:.1f}%")
        if forecast_total_conversions > 0:
            avg_cpa = (forecast_total_cost / forecast_total_conversions)
            print(f"  평균 CPA: {avg_cpa:,.0f}원")

        overall_result.to_csv(data_type_dir / 'prophet_forecast_overall.csv',
                              index=False, encoding='utf-8-sig')
        print(f"\n✓ 전체 예측 결과 저장: {data_type_dir / 'prophet_forecast_overall.csv'}")

    # ============================================================================
    # 2. 유형구분별 예측
    # ============================================================================
    print("\n" + "=" * 100)
    print(f"2. 주요 유형구분별 다중 지표 예측 (실제 {output_days}일 + 예측 {output_days}일)")
    print("=" * 100)

    top_categories = ['메타_전환', '네이버_쇼핑검색', '메타_트래픽']
    category_forecast_results = []

    for category in top_categories:
        category_data = df[(df['data_type'] == 'Type1_캠페인+광고세트') & (df['유형구분'] == category)]

        if len(category_data) < 10:
            print(f"\n[{category}]: 데이터 부족 (건수: {len(category_data)})")
            continue

        daily_category = category_data.groupby('일').agg({
            '비용': 'sum', '노출': 'sum', '클릭': 'sum', '전환수': 'sum', '전환값': 'sum'
        }).reset_index()

        if len(daily_category) < 10:
            print(f"\n[{category}]: 유효 데이터 부족")
            continue

        print(f"\n[{category}] 다중 지표 예측")
        print(f"학습 데이터: {len(daily_category)}일")

        cat_forecasts = forecast_multiple_metrics(daily_category, periods=output_days, training_days=training_days)
        cat_forecast_result = combine_metric_forecasts(cat_forecasts, '유형구분', category)
        cat_actual_result = create_actual_data(daily_category, output_days=output_days, key_column='유형구분', key_value=category)
        cat_result = combine_actual_and_forecast(cat_actual_result, cat_forecast_result)

        if cat_result is not None:
            category_forecast_results.append(cat_result)
            forecast_only = cat_result[cat_result['type'] == 'forecast']
            if '예측_전환값' in forecast_only.columns:
                print(f"향후 {len(forecast_only)}일 예상 총 전환값: {forecast_only['예측_전환값'].sum():,.0f}원")
            if '예측_비용' in forecast_only.columns and '예측_전환값' in forecast_only.columns:
                cat_f_cost = forecast_only['예측_비용'].sum()
                cat_f_revenue = forecast_only['예측_전환값'].sum()
                if cat_f_cost > 0:
                    print(f"평균 예측 ROAS: {(cat_f_revenue / cat_f_cost * 100):.1f}%")

    if category_forecast_results:
        combined_category = pd.concat(category_forecast_results, ignore_index=True)
        cols = ['유형구분', '일자'] + [f'예측_{m}' for m in FORECAST_METRICS if f'예측_{m}' in combined_category.columns]
        for kpi_col in ['예측_ROAS', '예측_CPA', '예측_CPC']:
            if kpi_col in combined_category.columns:
                cols.append(kpi_col)
        cols.append('type')
        combined_category = combined_category[[c for c in cols if c in combined_category.columns]]
        combined_category.to_csv(data_type_dir / 'prophet_forecast_by_category.csv',
                                  index=False, encoding='utf-8-sig')
        print(f"\n✓ 유형구분별 예측 결과 저장: {data_type_dir / 'prophet_forecast_by_category.csv'}")

    # ============================================================================
    # 3. 트렌드 분석
    # ============================================================================
    print("\n" + "=" * 100)
    print("3. 유형구분별 트렌드 분석")
    print("=" * 100)

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

    if trend_analysis_list:
        trend_df = pd.DataFrame(trend_analysis_list)
        trend_df.to_csv(data_type_dir / 'prophet_trend_analysis.csv',
                       index=False, encoding='utf-8-sig')
        print(f"\n✓ 트렌드 분석 결과 저장: {data_type_dir / 'prophet_trend_analysis.csv'}")

    # ============================================================================
    # 4~12. 세부 예측 (브랜드, 상품, 성별, 연령, 기기플랫폼 등)
    # ============================================================================
    # Type1 데이터 추출
    type1_data = df[df['data_type'] == 'Type1_캠페인+광고세트']

    # 6. 브랜드별 예측
    print("\n" + "=" * 100)
    print(f"6. 브랜드별 다중 지표 예측")
    print("=" * 100)

    brand_forecast_results = []
    if len(type1_data) > 0:
        brand_summary = type1_data.groupby('브랜드명').agg({'전환값': 'sum'}).reset_index()
        brand_summary = brand_summary[brand_summary['브랜드명'] != '-']
        top_brands = brand_summary.nlargest(5, '전환값')['브랜드명'].tolist()

        for brand in top_brands:
            brand_data = type1_data[type1_data['브랜드명'] == brand]
            daily_brand = brand_data.groupby('일').agg({
                '비용': 'sum', '노출': 'sum', '클릭': 'sum', '전환수': 'sum', '전환값': 'sum'
            }).reset_index()

            if len(daily_brand) < 10:
                print(f"\n[{brand}]: 데이터 부족 ({len(daily_brand)}일)")
                continue

            print(f"\n[{brand}] 다중 지표 예측")
            print(f"학습 데이터: {len(daily_brand)}일")

            brand_forecasts = forecast_multiple_metrics(daily_brand, periods=output_days, training_days=training_days)
            brand_forecast_result = combine_metric_forecasts(brand_forecasts, '브랜드명', brand)
            brand_actual_result = create_actual_data(daily_brand, output_days=output_days, key_column='브랜드명', key_value=brand)
            brand_result = combine_actual_and_forecast(brand_actual_result, brand_forecast_result)

            if brand_result is not None:
                brand_forecast_results.append(brand_result)
                forecast_only = brand_result[brand_result['type'] == 'forecast']
                if '예측_전환값' in forecast_only.columns:
                    print(f"향후 {len(forecast_only)}일 예상 총 전환값: {forecast_only['예측_전환값'].sum():,.0f}원")

    if brand_forecast_results:
        combined_brand = pd.concat(brand_forecast_results, ignore_index=True)
        cols = ['브랜드명', '일자'] + [f'예측_{m}' for m in FORECAST_METRICS if f'예측_{m}' in combined_brand.columns]
        for kpi_col in ['예측_ROAS', '예측_CPA', '예측_CPC']:
            if kpi_col in combined_brand.columns:
                cols.append(kpi_col)
        cols.append('type')
        combined_brand = combined_brand[[c for c in cols if c in combined_brand.columns]]
        combined_brand.to_csv(data_type_dir / 'prophet_forecast_by_brand.csv',
                                index=False, encoding='utf-8-sig')
        print(f"\n✓ 브랜드별 예측 결과 저장: {data_type_dir / 'prophet_forecast_by_brand.csv'}")

    # 7. 상품별 예측
    print("\n" + "=" * 100)
    print(f"7. 상품별 다중 지표 예측")
    print("=" * 100)

    product_forecast_results = []
    if len(type1_data) > 0:
        product_summary = type1_data.groupby('상품명').agg({'전환값': 'sum'}).reset_index()
        product_summary = product_summary[product_summary['상품명'] != '-']
        top_products = product_summary.nlargest(5, '전환값')['상품명'].tolist()

        for product in top_products:
            product_data = type1_data[type1_data['상품명'] == product]
            daily_product = product_data.groupby('일').agg({
                '비용': 'sum', '노출': 'sum', '클릭': 'sum', '전환수': 'sum', '전환값': 'sum'
            }).reset_index()

            if len(daily_product) < 10:
                print(f"\n[{product}]: 데이터 부족 ({len(daily_product)}일)")
                continue

            print(f"\n[{product}] 다중 지표 예측")
            print(f"학습 데이터: {len(daily_product)}일")

            product_forecasts = forecast_multiple_metrics(daily_product, periods=output_days, training_days=training_days)
            product_forecast_result = combine_metric_forecasts(product_forecasts, '상품명', product)
            product_actual_result = create_actual_data(daily_product, output_days=output_days, key_column='상품명', key_value=product)
            product_result = combine_actual_and_forecast(product_actual_result, product_forecast_result)

            if product_result is not None:
                product_forecast_results.append(product_result)
                forecast_only = product_result[product_result['type'] == 'forecast']
                if '예측_전환값' in forecast_only.columns:
                    print(f"향후 {len(forecast_only)}일 예상 총 전환값: {forecast_only['예측_전환값'].sum():,.0f}원")

    if product_forecast_results:
        combined_product = pd.concat(product_forecast_results, ignore_index=True)
        cols = ['상품명', '일자'] + [f'예측_{m}' for m in FORECAST_METRICS if f'예측_{m}' in combined_product.columns]
        for kpi_col in ['예측_ROAS', '예측_CPA', '예측_CPC']:
            if kpi_col in combined_product.columns:
                cols.append(kpi_col)
        cols.append('type')
        combined_product = combined_product[[c for c in cols if c in combined_product.columns]]
        combined_product.to_csv(data_type_dir / 'prophet_forecast_by_product.csv',
                                  index=False, encoding='utf-8-sig')
        print(f"\n✓ 상품별 예측 결과 저장: {data_type_dir / 'prophet_forecast_by_product.csv'}")

    # ============================================================================
    # 최종 요약
    # ============================================================================
    print("\n" + "=" * 100)
    print("분석 완료")
    if paths:
        print(f"클라이언트: {paths.client_id}")
    print("=" * 100)

    print(f"\n[학습 설정 요약]")
    print(f"  - 학습 기준: 최근 {training_days}일 (연간 학습)")
    print(f"  - 실제 데이터: {total_data_days}일")
    if total_data_days < training_days:
        print(f"  - 연간 계절성: 비활성화 (데이터 {training_days}일 미만)")
    else:
        print(f"  - 연간 계절성: 활성화")

    print("\n생성된 파일 목록 (다중 지표 예측: 비용, 노출, 클릭, 전환수, 전환값, ROAS, CPA, CPC):")
    print("  1. prophet_forecast_overall.csv - 전체 다중 지표 예측")
    print("  2. prophet_forecast_by_category.csv - 유형구분별 다중 지표 예측")
    print("  3. prophet_trend_analysis.csv - 트렌드 분석")
    print("  4. prophet_forecast_by_brand.csv - 브랜드별 다중 지표 예측")
    print("  5. prophet_forecast_by_product.csv - 상품별 다중 지표 예측")


def main(client_id: Optional[str] = None):
    """메인 함수"""
    parser = argparse.ArgumentParser(description='Prophet 시계열 예측 - 기간별 학습 지원')
    parser.add_argument('--client', type=str, default=None,
                        help='클라이언트 ID (멀티클라이언트 모드)')
    parser.add_argument('--days', type=int, default=0,
                        help='학습 데이터 기간 (0=전체/365일, 180=최근180일, 90=최근90일)')
    parser.add_argument('--output-days', type=int, default=30,
                        help='예측 기간 (기본 30일)')
    args = parser.parse_args()

    actual_client_id = args.client or client_id

    # 학습 기간 설정
    training_days = args.days if args.days > 0 else 365
    output_days = args.output_days

    # 클라이언트 모드 설정
    paths = None
    if actual_client_id:
        paths = ClientPaths(actual_client_id).ensure_dirs()
        print(f"[멀티클라이언트 모드] 클라이언트: {actual_client_id}")

    try:
        run_prophet_forecast(paths, training_days=training_days, output_days=output_days)
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
