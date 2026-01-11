"""
마케팅 데이터 전처리 및 분석 스크립트 v2.1

기능:
1. 원본 CSV 데이터 로드 및 정제
2. 월별 데이터 분리 저장
3. 통계 분석 (평균, 표준편차, 이상치 탐지)
4. 시계열 예측 (Prophet 또는 간단한 이동평균)
5. 메타데이터 생성
6. 최근 365일 데이터 기반 학습 (연간 계절성 반영)

환경변수:
- INPUT_CSV_PATH: 입력 CSV 파일 경로 (기본값: raw_data.csv)
"""

from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from scripts.common.paths import ClientPaths, get_client_config, parse_client_arg, PROJECT_ROOT

import os
import json
import argparse
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import warnings

# UTF-8 출력 설정 (Windows 콘솔 호환)
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import pandas as pd
import numpy as np
from scipy import stats
import matplotlib
matplotlib.use('Agg')  # GUI 없는 환경에서 사용
import matplotlib.pyplot as plt
import seaborn as sns
from statsmodels.tsa.seasonal import seasonal_decompose

# Prophet 시계열 예측 라이브러리
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    print("⚠️ Prophet이 설치되지 않음. 단순 예측만 사용합니다.")

warnings.filterwarnings('ignore')

# 디렉토리 설정 (레거시 호환성 유지, 실제 경로는 ClientPaths로 관리)
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / 'data'
RAW_DIR = DATA_DIR / 'raw'
META_DIR = DATA_DIR / 'meta'
FORECAST_DIR = DATA_DIR / 'forecast'
STATS_DIR = DATA_DIR / 'statistics'
VISUAL_DIR = DATA_DIR / 'visualizations'

# 디렉토리 생성은 main()에서 ClientPaths.ensure_dirs()로 처리

# 한글 폰트 설정 (Windows)
plt.rcParams['font.family'] = 'Malgun Gothic'
plt.rcParams['axes.unicode_minus'] = False

# 명령줄 인자 파싱
parser = argparse.ArgumentParser(description='마케팅 데이터 전처리 및 Prophet 예측 - 기간별 학습 지원')
parser.add_argument('--client', type=str, default=None,
                    help='클라이언트 ID (멀티클라이언트 모드)')
parser.add_argument('--days', type=int, default=0,
                    help='학습 데이터 기간 (0=전체/365일, 180=최근180일, 90=최근90일)')
parser.add_argument('--output-days', type=int, default=30,
                    help='예측 기간 (기본 30일)')
args = parser.parse_args()

# 클라이언트 ID
CLIENT_ID = args.client
# 학습 기간 설정 (일) - 명령줄 인자 또는 기본값
TRAINING_DAYS = args.days if args.days > 0 else 365
# 출력 기간 설정 (일) - 예측 데이터
OUTPUT_DAYS = args.output_days


def load_and_clean_data(file_path: str) -> pd.DataFrame:
    """원본 CSV 로드 및 기본 정제"""
    print("📥 데이터 로딩 중...")
    
    # UTF-8 인코딩으로 읽기 (GitHub Actions Linux 환경 호환)
    try:
        df = pd.read_csv(file_path, encoding='utf-8')
    except UnicodeDecodeError:
        # Windows에서 생성된 파일인 경우 CP949 시도
        try:
            df = pd.read_csv(file_path, encoding='cp949')
        except:
            df = pd.read_csv(file_path, encoding='latin-1')
    
    print(f"   ├ 로드된 행 수: {len(df):,}")
    print(f"   ├ 로드된 컬럼 수: {len(df.columns)}")
    print(f"   └ 첫 번째 컬럼들: {list(df.columns[:5])}")
    
    # 컬럼명 정리 (공백 제거)
    df.columns = df.columns.str.strip()
    
    # 기대하는 컬럼
    expected_columns = [
        '월 구분', '주 구분', '브랜드명', '상품명', '추가 구분', '유형구분',
        '일 구분', '목표', '캠페인', '세트이름', '비용', '노출', '클릭', '전환수', '전환값'
    ]
    
    # 컬럼이 15개가 아니면 경고
    if len(df.columns) != 15:
        print(f"\n⚠️  경고: 컬럼 수가 {len(df.columns)}개입니다 (예상: 15개)")
        print(f"   실제 컬럼: {list(df.columns)}")
    
    # 필수 컬럼이 없으면 오류
    missing_cols = [col for col in ['월 구분', '일 구분', '비용'] if col not in df.columns]
    if missing_cols:
        raise ValueError(f"필수 컬럼이 없습니다: {missing_cols}\n현재 컬럼: {list(df.columns)}")
    
    return df


def clean_and_convert_types(df: pd.DataFrame) -> pd.DataFrame:
    """데이터 타입 변환 및 결측치 처리"""
    print("\n🔧 데이터 타입 변환 중...")
    
    # 날짜 컬럼 변환
    df['일 구분'] = pd.to_datetime(df['일 구분'], errors='coerce')
    
    # 숫자 컬럼 변환
    numeric_cols = ['비용', '노출', '클릭', '전환수', '전환값']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    
    # 결측치 확인
    null_counts = df.isnull().sum()
    if null_counts.sum() > 0:
        print(f"   ⚠️  결측치 발견:")
        for col, count in null_counts[null_counts > 0].items():
            print(f"      - {col}: {count}개")
    
    # 날짜가 없는 행 제거
    df = df.dropna(subset=['일 구분'])
    
    print(f"   ├ 정제 후 행 수: {len(df):,}")
    print(f"   └ 날짜 범위: {df['일 구분'].min()} ~ {df['일 구분'].max()}")
    
    return df


def calculate_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """마케팅 지표 계산"""
    print("\n📊 마케팅 지표 계산 중...")
    
    # CTR (Click Through Rate)
    df['ctr'] = np.where(df['노출'] > 0, (df['클릭'] / df['노출'] * 100).round(2), 0)
    
    # CPC (Cost Per Click)
    df['cpc'] = np.where(df['클릭'] > 0, (df['비용'] / df['클릭']).round(0), 0)
    
    # CPA (Cost Per Acquisition)
    df['cpa'] = np.where(df['전환수'] > 0, (df['비용'] / df['전환수']).round(0), 0)
    
    # CVR (Conversion Rate)
    df['cvr'] = np.where(df['클릭'] > 0, (df['전환수'] / df['클릭'] * 100).round(2), 0)
    
    # ROAS (Return On Ad Spend)
    df['roas'] = np.where(df['비용'] > 0, (df['전환값'] / df['비용'] * 100).round(0), 0)
    
    print(f"   ✅ 지표 계산 완료")
    
    return df


def calculate_statistics(df: pd.DataFrame, paths: Optional[ClientPaths] = None) -> Dict[str, Any]:
    """통계 분석"""
    print("\n📈 통계 분석 중...")

    metrics = ['비용', '노출', '클릭', '전환수', '전환값', 'ctr', 'cpc', 'cpa', 'cvr', 'roas']
    statistics = {}

    for metric in metrics:
        if metric not in df.columns:
            continue

        data = df[metric].replace([np.inf, -np.inf], np.nan).dropna()

        if len(data) == 0:
            continue

        # 기본 통계
        mean_val = float(data.mean())
        median_val = float(data.median())
        std_val = float(data.std())
        min_val = float(data.min())
        max_val = float(data.max())
        q25 = float(data.quantile(0.25))
        q75 = float(data.quantile(0.75))

        # 왜도, 첨도
        skewness = float(stats.skew(data))
        kurtosis = float(stats.kurtosis(data))

        # Z-Score 기반 이상치 탐지
        z_scores = np.abs(stats.zscore(data))
        outliers = df[z_scores > 2.5]['일 구분'].dt.strftime('%Y-%m-%d').tolist()

        # 성과 등급 기준
        high_threshold = mean_val + std_val
        low_threshold = mean_val - std_val

        statistics[metric] = {
            'mean': round(mean_val, 2),
            'median': round(median_val, 2),
            'std': round(std_val, 2),
            'min': round(min_val, 2),
            'max': round(max_val, 2),
            'q25': round(q25, 2),
            'q75': round(q75, 2),
            'skewness': round(skewness, 2),
            'kurtosis': round(kurtosis, 2),
            'outliers': outliers[:10],  # 최대 10개
            'grade_thresholds': {
                'high': round(high_threshold, 2),
                'low': round(low_threshold, 2)
            }
        }

        print(f"   ├ {metric}: 평균={mean_val:.1f}, 표준편차={std_val:.1f}")

    # 통계 JSON 저장
    stats_file = paths.statistics_json if paths else STATS_DIR / 'statistics.json'
    stats_file.parent.mkdir(parents=True, exist_ok=True)
    with open(stats_file, 'w', encoding='utf-8') as f:
        json.dump(statistics, f, ensure_ascii=False, indent=2)

    print(f"   ✅ {stats_file.name} 저장 완료")

    return statistics


def calculate_daily_statistics(df: pd.DataFrame, statistics: Dict, paths: Optional[ClientPaths] = None) -> None:
    """일별 통계 데이터 생성"""
    print("\n📊 일별 통계 계산 중...")

    daily_stats = df.copy()

    # 각 지표별 Z-Score 및 등급 계산
    for metric, stat_info in statistics.items():
        if metric not in daily_stats.columns:
            continue

        mean_val = stat_info['mean']
        std_val = stat_info['std']
        high_threshold = stat_info['grade_thresholds']['high']
        low_threshold = stat_info['grade_thresholds']['low']

        # Z-Score
        daily_stats[f'{metric}_zscore'] = ((daily_stats[metric] - mean_val) / std_val).round(2)

        # 등급
        daily_stats[f'{metric}_grade'] = daily_stats[metric].apply(
            lambda x: '상' if x >= high_threshold else ('하' if x <= low_threshold else '중')
        )

    # CSV 저장
    daily_csv = paths.daily_statistics if paths else STATS_DIR / 'daily_statistics.csv'
    daily_csv.parent.mkdir(parents=True, exist_ok=True)
    daily_stats.to_csv(daily_csv, index=False, encoding='utf-8')

    print(f"   ✅ {daily_csv.name} 저장 완료 ({len(daily_stats):,}행)")


def simple_forecast(df: pd.DataFrame, days: int = OUTPUT_DAYS, paths: Optional[ClientPaths] = None) -> pd.DataFrame:
    """최근 90일 데이터 기반 예측 (주간 패턴 반영)"""
    print(f"\n🔮 시계열 예측 중 ({days}일)...")

    # 일별 집계
    daily = df.groupby('일 구분').agg({
        '비용': 'sum',
        '노출': 'sum',
        '클릭': 'sum',
        '전환수': 'sum',
        '전환값': 'sum'
    }).reset_index()

    daily = daily.sort_values('일 구분')

    # 최근 90일 데이터 사용 (학습 기간)
    learning_period = min(90, len(daily))
    learning_data = daily.tail(learning_period).copy()

    print(f"   ├ 학습 기간: 최근 {learning_period}일")

    # 각 지표별 기준값 계산
    metrics = ['비용', '노출', '클릭', '전환수', '전환값']
    base_values = {}
    std_values = {}
    weekly_patterns = {}

    for metric in metrics:
        # 하위 10% 제외 (캠페인 중단일 등 이상치 제거)
        metric_data = learning_data[metric].copy()
        threshold = metric_data.quantile(0.10)
        filtered_data = metric_data[metric_data >= threshold]

        if len(filtered_data) < 10:
            filtered_data = metric_data

        # 평균과 표준편차 계산
        base_values[metric] = filtered_data.mean()
        std_values[metric] = filtered_data.std() * 0.1  # 변동성 10%만 반영

        # 주간 패턴 계산 (요일별 평균 비율)
        learning_data['dayofweek'] = pd.to_datetime(learning_data['일 구분']).dt.dayofweek
        weekly_avg = learning_data.groupby('dayofweek')[metric].mean()
        overall_avg = learning_data[metric].mean()
        if overall_avg > 0:
            weekly_patterns[metric] = (weekly_avg / overall_avg).to_dict()
        else:
            weekly_patterns[metric] = {i: 1.0 for i in range(7)}

        print(f"   ├ {metric}: 90일평균={base_values[metric]:.1f}, 표준편차={std_values[metric]:.1f}")

    # 예측 데이터 생성 (주간 패턴 + 약간의 변동성)
    predictions = []
    last_date = daily['일 구분'].max()
    np.random.seed(42)  # 재현성을 위한 시드 설정

    for i in range(1, days + 1):
        pred_date = last_date + timedelta(days=i)
        dayofweek = pred_date.dayofweek

        # 주간 패턴과 랜덤 변동성을 반영한 예측값
        pred_row = {
            '일 구분': pred_date.strftime('%Y-%m-%d'),
            '비용_예측': max(0, float(base_values['비용'] * weekly_patterns['비용'].get(dayofweek, 1.0) + np.random.normal(0, std_values['비용']))),
            '노출_예측': max(0, int(base_values['노출'] * weekly_patterns['노출'].get(dayofweek, 1.0) + np.random.normal(0, std_values['노출']))),
            '클릭_예측': max(0, int(base_values['클릭'] * weekly_patterns['클릭'].get(dayofweek, 1.0) + np.random.normal(0, std_values['클릭']))),
            '전환수_예측': max(0, float(base_values['전환수'] * weekly_patterns['전환수'].get(dayofweek, 1.0) + np.random.normal(0, std_values['전환수']))),
            '전환값_예측': max(0, float(base_values['전환값'] * weekly_patterns['전환값'].get(dayofweek, 1.0) + np.random.normal(0, std_values['전환값']))),
            'type': 'forecast'
        }

        predictions.append(pred_row)

    # 실제 데이터 추가 (OUTPUT_DAYS만큼)
    actual = daily.tail(OUTPUT_DAYS).copy()
    actual['type'] = 'actual'
    actual = actual.rename(columns={
        '비용': '비용_예측',
        '노출': '노출_예측',
        '클릭': '클릭_예측',
        '전환수': '전환수_예측',
        '전환값': '전환값_예측'
    })
    actual['일 구분'] = actual['일 구분'].dt.strftime('%Y-%m-%d')

    # 합치기
    forecast_df = pd.concat([actual, pd.DataFrame(predictions)], ignore_index=True)

    # CSV 저장 - predictions_daily.csv로 저장
    forecast_file = paths.predictions_daily if paths else FORECAST_DIR / 'predictions_daily.csv'
    forecast_file.parent.mkdir(parents=True, exist_ok=True)
    forecast_df.to_csv(forecast_file, index=False, encoding='utf-8')

    print(f"   ✅ {forecast_file.name} 저장 완료")
    print(f"   ├ 실제 데이터: {len(actual)}일")
    print(f"   └ 예측 데이터: {len(predictions)}일")

    return forecast_df


def advanced_detailed_forecast(df: pd.DataFrame, days: int = OUTPUT_DAYS, paths: Optional[ClientPaths] = None) -> Dict[str, pd.DataFrame]:
    """상세 시계열 분석 및 예측 (Prophet 사용, 최근 365일 데이터 활용)"""
    print(f"\n🔬 상세 시계열 분석 시작 ({days}일 예측)...")

    if not PROPHET_AVAILABLE:
        print("   ⚠️ Prophet이 설치되지 않아 단순 예측을 사용합니다.")
        # 단순 예측으로 대체
        return simple_forecast_as_detailed(df, days, paths)

    # 일별 집계
    daily = df.groupby('일 구분').agg({
        '비용': 'sum',
        '노출': 'sum',
        '클릭': 'sum',
        '전환수': 'sum',
        '전환값': 'sum'
    }).reset_index()

    daily = daily.sort_values('일 구분')

    # 최근 365일 데이터만 필터링
    max_date = daily['일 구분'].max()
    cutoff_date = max_date - timedelta(days=TRAINING_DAYS)
    daily_filtered = daily[daily['일 구분'] >= cutoff_date].copy()

    daily_indexed = daily_filtered.set_index('일 구분')

    # 학습 기간 계산 및 메시지 출력
    total_data_days = (daily_filtered['일 구분'].max() - daily_filtered['일 구분'].min()).days + 1

    print(f"   ├ 학습 기준: 최근 {TRAINING_DAYS}일 (연간 학습)")
    print(f"   ├ 실제 학습 데이터: {len(daily_filtered)}일")
    print(f"   ├ 기간: {daily_filtered['일 구분'].min()} ~ {daily_filtered['일 구분'].max()}")

    if total_data_days < TRAINING_DAYS:
        print(f"   ├ ⚠️ 데이터 {total_data_days}일 ({TRAINING_DAYS}일 미만)")
        print(f"   ├    → 연간 계절성 비활성화, 주간 패턴만 학습")
    else:
        print(f"   ├ ✓ 연간 학습 가능 ({total_data_days}일)")

    metrics = ['비용', '노출', '클릭', '전환수', '전환값']
    forecasts = {}

    for metric in metrics:
        print(f"   ├ {metric} 분석 중...")

        try:
            # Prophet용 데이터 준비 (ds, y 컬럼 필요)
            prophet_df = daily_filtered[['일 구분', metric]].copy()
            prophet_df.columns = ['ds', 'y']
            prophet_df['ds'] = pd.to_datetime(prophet_df['ds'])

            # 결측치 처리
            prophet_df['y'] = prophet_df['y'].fillna(0)

            # 데이터 기간 확인하여 연간 계절성 자동 설정
            data_days = (prophet_df['ds'].max() - prophet_df['ds'].min()).days
            use_yearly = data_days >= 365

            # Prophet 모델 생성 (연간 계절성 자동 설정)
            model = Prophet(
                yearly_seasonality=use_yearly,  # 365일 이상일 때만 활성화
                weekly_seasonality=True,        # 주간 계절성
                daily_seasonality=False,        # 일간 계절성
                seasonality_mode='additive',
                changepoint_prior_scale=0.05    # 추세 변화 민감도
            )

            # 모델 학습
            model.fit(prophet_df)

            # 미래 날짜 생성
            future = model.make_future_dataframe(periods=days)

            # 예측
            forecast_result = model.predict(future)

            # 예측값 추출 (마지막 days개)
            forecast_values = forecast_result.tail(days)[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].copy()

            # 음수 방지
            forecast_values['yhat'] = forecast_values['yhat'].clip(lower=0)
            forecast_values['yhat_lower'] = forecast_values['yhat_lower'].clip(lower=0)
            forecast_values['yhat_upper'] = forecast_values['yhat_upper'].clip(lower=0)

            # 결과 저장
            forecast_series = pd.Series(
                forecast_values['yhat'].values,
                index=pd.DatetimeIndex(forecast_values['ds'].values)
            )

            # 신뢰구간 데이터프레임
            conf_int = pd.DataFrame({
                'lower': forecast_values['yhat_lower'].values,
                'upper': forecast_values['yhat_upper'].values
            }, index=pd.DatetimeIndex(forecast_values['ds'].values))

            forecasts[metric] = {
                'forecast': forecast_series,
                'conf_int': conf_int,
                'model': model,
                'model_type': 'Prophet'
            }

            # 모델 성능 지표 (MAE 계산)
            in_sample = forecast_result[forecast_result['ds'].isin(prophet_df['ds'])]
            mae = np.mean(np.abs(in_sample['yhat'].values - prophet_df['y'].values))
            print(f"      └ MAE={mae:.1f}, 주간계절성=예")

        except Exception as e:
            print(f"      └ 경고: {metric} Prophet 모델링 실패, 단순 예측 사용 ({str(e)[:50]})")
            # 실패시 이동평균 사용
            mean_val = daily_indexed[metric].tail(14).mean()
            forecast = pd.Series([mean_val] * days, index=pd.date_range(
                start=daily_indexed.index.max() + timedelta(days=1), periods=days, freq='D'
            ))
            forecasts[metric] = {
                'forecast': forecast,
                'conf_int': None,
                'model': None,
                'model_type': 'Simple'
            }

    # 예측 데이터프레임 생성
    forecast_dates = pd.date_range(
        start=daily_indexed.index.max() + timedelta(days=1),
        periods=days,
        freq='D'
    )

    predictions = pd.DataFrame({
        '일 구분': forecast_dates.strftime('%Y-%m-%d'),
        '비용_예측': forecasts['비용']['forecast'].values,
        '노출_예측': forecasts['노출']['forecast'].values.astype(int),
        '클릭_예측': forecasts['클릭']['forecast'].values.astype(int),
        '전환수_예측': forecasts['전환수']['forecast'].values,
        '전환값_예측': forecasts['전환값']['forecast'].values,
        'type': 'forecast'
    })

    # 실제 데이터 (최근 OUTPUT_DAYS일)
    actual = daily_indexed.tail(OUTPUT_DAYS).reset_index()
    actual['type'] = 'actual'
    actual = actual.rename(columns={
        '비용': '비용_예측',
        '노출': '노출_예측',
        '클릭': '클릭_예측',
        '전환수': '전환수_예측',
        '전환값': '전환값_예측'
    })
    actual['일 구분'] = pd.to_datetime(actual['일 구분']).dt.strftime('%Y-%m-%d')

    # 합치기
    detailed_forecast = pd.concat([actual, predictions], ignore_index=True)

    # 저장
    detailed_file = paths.forecast / 'predictions_detailed.csv' if paths else FORECAST_DIR / 'predictions_detailed.csv'
    detailed_file.parent.mkdir(parents=True, exist_ok=True)
    detailed_forecast.to_csv(detailed_file, index=False, encoding='utf-8')

    print(f"   ✅ {detailed_file.name} 저장 완료")

    return {
        'daily': daily_indexed,
        'forecasts': forecasts,
        'predictions': detailed_forecast
    }


def simple_forecast_as_detailed(df: pd.DataFrame, days: int = OUTPUT_DAYS, paths: Optional[ClientPaths] = None) -> Dict[str, pd.DataFrame]:
    """Prophet 미설치 시 단순 예측으로 대체"""
    # 일별 집계
    daily = df.groupby('일 구분').agg({
        '비용': 'sum',
        '노출': 'sum',
        '클릭': 'sum',
        '전환수': 'sum',
        '전환값': 'sum'
    }).reset_index()

    daily = daily.sort_values('일 구분')
    daily_indexed = daily.set_index('일 구분')

    metrics = ['비용', '노출', '클릭', '전환수', '전환값']
    forecasts = {}

    for metric in metrics:
        mean_val = daily_indexed[metric].tail(14).mean()
        forecast = pd.Series([mean_val] * days, index=pd.date_range(
            start=daily_indexed.index.max() + timedelta(days=1), periods=days, freq='D'
        ))
        forecasts[metric] = {
            'forecast': forecast,
            'conf_int': None,
            'model': None,
            'model_type': 'Simple'
        }

    # 예측 데이터프레임 생성
    forecast_dates = pd.date_range(
        start=daily_indexed.index.max() + timedelta(days=1),
        periods=days,
        freq='D'
    )

    predictions = pd.DataFrame({
        '일 구분': forecast_dates.strftime('%Y-%m-%d'),
        '비용_예측': forecasts['비용']['forecast'].values,
        '노출_예측': forecasts['노출']['forecast'].values.astype(int),
        '클릭_예측': forecasts['클릭']['forecast'].values.astype(int),
        '전환수_예측': forecasts['전환수']['forecast'].values,
        '전환값_예측': forecasts['전환값']['forecast'].values,
        'type': 'forecast'
    })

    # 실제 데이터 (최근 OUTPUT_DAYS일)
    actual = daily_indexed.tail(OUTPUT_DAYS).reset_index()
    actual['type'] = 'actual'
    actual = actual.rename(columns={
        '비용': '비용_예측',
        '노출': '노출_예측',
        '클릭': '클릭_예측',
        '전환수': '전환수_예측',
        '전환값': '전환값_예측'
    })
    actual['일 구분'] = pd.to_datetime(actual['일 구분']).dt.strftime('%Y-%m-%d')

    detailed_forecast = pd.concat([actual, predictions], ignore_index=True)

    detailed_file = paths.forecast / 'predictions_detailed.csv' if paths else FORECAST_DIR / 'predictions_detailed.csv'
    detailed_file.parent.mkdir(parents=True, exist_ok=True)
    detailed_forecast.to_csv(detailed_file, index=False, encoding='utf-8')

    print(f"   ✅ {detailed_file.name} 저장 완료 (단순 예측)")

    return {
        'daily': daily_indexed,
        'forecasts': forecasts,
        'predictions': detailed_forecast
    }


def generate_weekly_predictions(daily_forecast: pd.DataFrame, paths: Optional[ClientPaths] = None) -> pd.DataFrame:
    """일별 예측을 주별로 집계"""
    print(f"\n📅 주별 예측 생성 중...")

    df = daily_forecast.copy()
    df['일 구분'] = pd.to_datetime(df['일 구분'])
    df['주 구분'] = df['일 구분'].dt.to_period('W').astype(str)

    # 주별 집계
    weekly = df.groupby(['주 구분', 'type']).agg({
        '비용_예측': 'sum',
        '노출_예측': 'sum',
        '클릭_예측': 'sum',
        '전환수_예측': 'sum',
        '전환값_예측': 'sum'
    }).reset_index()

    # 저장
    weekly_file = paths.predictions_weekly if paths else FORECAST_DIR / 'predictions_weekly.csv'
    weekly_file.parent.mkdir(parents=True, exist_ok=True)
    weekly.to_csv(weekly_file, index=False, encoding='utf-8')

    print(f"   ✅ {weekly_file.name} 저장 완료 ({len(weekly)}주)")

    return weekly


def generate_monthly_predictions(daily_forecast: pd.DataFrame, paths: Optional[ClientPaths] = None) -> pd.DataFrame:
    """일별 예측을 월별로 집계"""
    print(f"\n📅 월별 예측 생성 중...")

    df = daily_forecast.copy()
    df['일 구분'] = pd.to_datetime(df['일 구분'])
    df['월 구분'] = df['일 구분'].dt.to_period('M').astype(str)

    # 월별 집계
    monthly = df.groupby(['월 구분', 'type']).agg({
        '비용_예측': 'sum',
        '노출_예측': 'sum',
        '클릭_예측': 'sum',
        '전환수_예측': 'sum',
        '전환값_예측': 'sum'
    }).reset_index()

    # 저장
    monthly_file = paths.predictions_monthly if paths else FORECAST_DIR / 'predictions_monthly.csv'
    monthly_file.parent.mkdir(parents=True, exist_ok=True)
    monthly.to_csv(monthly_file, index=False, encoding='utf-8')

    print(f"   ✅ {monthly_file.name} 저장 완료 ({len(monthly)}개월)")

    return monthly


def visualize_analysis(df: pd.DataFrame, forecast_data: Dict[str, Any], paths: Optional[ClientPaths] = None) -> None:
    """데이터 분석 시각화 (정규분포, 시계열, 추세 등)"""
    print(f"\n📊 시각화 생성 중...")

    # 시각화 디렉토리 설정
    visual_dir = paths.visualizations if paths else VISUAL_DIR
    visual_dir.mkdir(parents=True, exist_ok=True)

    daily = forecast_data['daily']
    forecasts = forecast_data['forecasts']
    predictions = forecast_data['predictions']

    metrics = {
        '비용': 'Cost',
        '노출': 'Impressions',
        '클릭': 'Clicks',
        '전환수': 'Conversions',
        '전환값': 'Revenue'
    }

    # 1. 시계열 + 예측 그래프
    print(f"   ├ 시계열 예측 그래프 생성 중...")
    fig, axes = plt.subplots(3, 2, figsize=(16, 12))
    fig.suptitle('마케팅 지표 시계열 분석 및 예측', fontsize=16, fontweight='bold')

    for idx, (metric_kr, metric_en) in enumerate(metrics.items()):
        row = idx // 2
        col = idx % 2
        ax = axes[row, col]

        # 실제 데이터
        ax.plot(daily.index, daily[metric_kr], label='실제 데이터', color='blue', linewidth=2)

        # 예측 데이터
        if forecasts[metric_kr]['forecast'] is not None:
            forecast_series = forecasts[metric_kr]['forecast']
            ax.plot(forecast_series.index, forecast_series.values,
                   label='예측', color='red', linewidth=2, linestyle='--')

            # 신뢰구간
            if forecasts[metric_kr]['conf_int'] is not None:
                conf_int = forecasts[metric_kr]['conf_int']
                ax.fill_between(conf_int.index,
                              conf_int.iloc[:, 0],
                              conf_int.iloc[:, 1],
                              alpha=0.3, color='red', label='95% 신뢰구간')

        ax.set_title(f'{metric_kr} ({metric_en})', fontsize=12, fontweight='bold')
        ax.set_xlabel('날짜')
        ax.set_ylabel('값')
        ax.legend()
        ax.grid(True, alpha=0.3)

        # x축 날짜 포맷
        ax.tick_params(axis='x', rotation=45)

    # 마지막 subplot 제거
    fig.delaxes(axes[2, 1])

    plt.tight_layout()
    timeseries_file = visual_dir / 'timeseries_forecast.png'
    plt.savefig(timeseries_file, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"      └ {timeseries_file.name} 저장 완료")

    # 2. 정규분포 분석
    print(f"   ├ 정규분포 분석 그래프 생성 중...")
    fig, axes = plt.subplots(3, 2, figsize=(16, 12))
    fig.suptitle('마케팅 지표 정규분포 분석', fontsize=16, fontweight='bold')

    for idx, (metric_kr, metric_en) in enumerate(metrics.items()):
        row = idx // 2
        col = idx % 2
        ax = axes[row, col]

        data = daily[metric_kr].dropna()

        # 히스토그램
        ax.hist(data, bins=30, density=True, alpha=0.7, color='skyblue', edgecolor='black')

        # 정규분포 곡선
        mu, sigma = data.mean(), data.std()
        x = np.linspace(data.min(), data.max(), 100)
        ax.plot(x, stats.norm.pdf(x, mu, sigma), 'r-', linewidth=2, label='정규분포')

        # 통계 정보
        skewness = stats.skew(data)
        kurtosis_val = stats.kurtosis(data)

        ax.axvline(mu, color='green', linestyle='--', linewidth=2, label=f'평균: {mu:.1f}')
        ax.axvline(mu + sigma, color='orange', linestyle=':', linewidth=1.5, label=f'±1σ')
        ax.axvline(mu - sigma, color='orange', linestyle=':', linewidth=1.5)

        ax.set_title(f'{metric_kr} 분포\n왜도={skewness:.2f}, 첨도={kurtosis_val:.2f}',
                    fontsize=11, fontweight='bold')
        ax.set_xlabel('값')
        ax.set_ylabel('밀도')
        ax.legend()
        ax.grid(True, alpha=0.3)

    fig.delaxes(axes[2, 1])

    plt.tight_layout()
    distribution_file = visual_dir / 'distribution_analysis.png'
    plt.savefig(distribution_file, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"      └ {distribution_file.name} 저장 완료")

    # 3. 계절성 분해 (비용만)
    print(f"   ├ 계절성 분해 그래프 생성 중...")

    try:
        # 최소 2주기(14일) 필요
        if len(daily) >= 14:
            series = daily['비용'].ffill()

            # 계절성 분해
            decomposition = seasonal_decompose(series, model='additive', period=7)

            fig, axes = plt.subplots(4, 1, figsize=(14, 10))
            fig.suptitle('비용 시계열 분해 (추세, 계절성, 잔차)', fontsize=14, fontweight='bold')

            decomposition.observed.plot(ax=axes[0], title='원본 데이터')
            axes[0].set_ylabel('비용')

            decomposition.trend.plot(ax=axes[1], title='추세 (Trend)')
            axes[1].set_ylabel('비용')

            decomposition.seasonal.plot(ax=axes[2], title='계절성 (Seasonality - 7일 주기)')
            axes[2].set_ylabel('비용')

            decomposition.resid.plot(ax=axes[3], title='잔차 (Residual)')
            axes[3].set_ylabel('비용')
            axes[3].set_xlabel('날짜')

            for ax in axes:
                ax.grid(True, alpha=0.3)

            plt.tight_layout()
            seasonal_file = visual_dir / 'seasonal_decomposition.png'
            plt.savefig(seasonal_file, dpi=300, bbox_inches='tight')
            plt.close()
            print(f"      └ {seasonal_file.name} 저장 완료")
    except Exception as e:
        print(f"      └ 경고: 계절성 분해 실패 ({str(e)[:50]})")

    # 4. 상관관계 히트맵
    print(f"   ├ 상관관계 히트맵 생성 중...")
    fig, ax = plt.subplots(figsize=(10, 8))

    corr_data = daily[['비용', '노출', '클릭', '전환수', '전환값']].corr()

    sns.heatmap(corr_data, annot=True, fmt='.2f', cmap='coolwarm',
                center=0, square=True, ax=ax, cbar_kws={'label': '상관계수'})

    ax.set_title('마케팅 지표 간 상관관계', fontsize=14, fontweight='bold', pad=20)

    plt.tight_layout()
    corr_file = visual_dir / 'correlation_heatmap.png'
    plt.savefig(corr_file, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"      └ {corr_file.name} 저장 완료")

    # 5. 박스플롯 (이상치 탐지)
    print(f"   ├ 박스플롯 (이상치 분석) 생성 중...")
    fig, axes = plt.subplots(1, 5, figsize=(18, 5))
    fig.suptitle('마케팅 지표 박스플롯 (이상치 탐지)', fontsize=14, fontweight='bold')

    for idx, (metric_kr, metric_en) in enumerate(metrics.items()):
        ax = axes[idx]
        data = daily[metric_kr].dropna()

        box = ax.boxplot([data], labels=[metric_kr], patch_artist=True)
        box['boxes'][0].set_facecolor('lightblue')

        # 이상치 개수
        q1 = data.quantile(0.25)
        q3 = data.quantile(0.75)
        iqr = q3 - q1
        outliers = data[(data < q1 - 1.5*iqr) | (data > q3 + 1.5*iqr)]

        ax.set_title(f'{metric_kr}\n이상치: {len(outliers)}개', fontsize=10)
        ax.grid(True, alpha=0.3, axis='y')

    plt.tight_layout()
    boxplot_file = visual_dir / 'boxplot_outliers.png'
    plt.savefig(boxplot_file, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"      └ {boxplot_file.name} 저장 완료")

    print(f"   ✅ 모든 시각화 완료!")


def generate_html_dashboard(df: pd.DataFrame, forecast_data: Dict[str, Any], statistics: Dict, paths: Optional[ClientPaths] = None) -> None:
    """HTML 대시보드 생성 (인터랙티브 차트 포함)"""
    print(f"\n🌐 HTML 대시보드 생성 중...")

    try:
        import plotly.graph_objects as go
        from plotly.subplots import make_subplots
        import plotly.express as px
        plotly_available = True
    except ImportError:
        print(f"   ⚠️ Plotly가 설치되지 않음. 이미지 기반 HTML만 생성합니다.")
        plotly_available = False

    daily = forecast_data['daily']
    forecasts = forecast_data['forecasts']
    predictions = forecast_data['predictions']

    # 메타 정보
    total_cost = float(df['비용'].sum())
    total_conversions = int(df['전환수'].sum())
    total_revenue = float(df['전환값'].sum())
    roas = (total_revenue / total_cost * 100) if total_cost > 0 else 0

    # HTML 시작
    html_content = f"""<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>마케팅 데이터 분석 대시보드</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            color: #333;
        }}
        .container {{
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }}
        .header h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
        }}
        .header p {{
            font-size: 1.1em;
            opacity: 0.9;
        }}
        .stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 40px;
            background: #f8f9fa;
        }}
        .stat-card {{
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }}
        .stat-card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 8px 15px rgba(0,0,0,0.2);
        }}
        .stat-card h3 {{
            color: #666;
            font-size: 0.9em;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        .stat-card .value {{
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }}
        .stat-card .label {{
            color: #999;
            font-size: 0.85em;
        }}
        .content {{
            padding: 40px;
        }}
        .section {{
            margin-bottom: 50px;
        }}
        .section h2 {{
            font-size: 1.8em;
            margin-bottom: 20px;
            color: #333;
            border-left: 5px solid #667eea;
            padding-left: 15px;
        }}
        .chart-container {{
            background: white;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }}
        .chart-container img {{
            width: 100%;
            height: auto;
            border-radius: 10px;
        }}
        .grid-2 {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 30px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }}
        th, td {{
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }}
        th {{
            background: #667eea;
            color: white;
            font-weight: 600;
        }}
        tr:hover {{
            background: #f8f9fa;
        }}
        .footer {{
            background: #2d3748;
            color: white;
            padding: 30px;
            text-align: center;
        }}
        .badge {{
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            margin-left: 10px;
        }}
        .badge-success {{
            background: #48bb78;
            color: white;
        }}
        .badge-warning {{
            background: #ed8936;
            color: white;
        }}
        .badge-info {{
            background: #4299e1;
            color: white;
        }}
    </style>
"""

    if plotly_available:
        html_content += """    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
"""

    html_content += f"""</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 마케팅 데이터 분석 대시보드</h1>
            <p>상세 시계열 분석 및 예측 리포트</p>
            <p style="font-size: 0.9em; margin-top: 10px;">
                분석 기간: {daily.index.min().strftime('%Y-%m-%d')} ~ {daily.index.max().strftime('%Y-%m-%d')}
                <span class="badge badge-info">{len(daily)}일</span>
            </p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <h3>총 광고비</h3>
                <div class="value">₩{total_cost:,.0f}</div>
                <div class="label">Total Cost</div>
            </div>
            <div class="stat-card">
                <h3>총 전환수</h3>
                <div class="value">{total_conversions:,}</div>
                <div class="label">Total Conversions</div>
            </div>
            <div class="stat-card">
                <h3>총 전환값</h3>
                <div class="value">₩{total_revenue:,.0f}</div>
                <div class="label">Total Revenue</div>
            </div>
            <div class="stat-card">
                <h3>ROAS</h3>
                <div class="value">{roas:.1f}%</div>
                <div class="label">Return on Ad Spend</div>
            </div>
        </div>

        <div class="content">
"""

    # Plotly 인터랙티브 차트
    if plotly_available:
        print(f"   ├ 인터랙티브 차트 생성 중...")

        # 1. 시계열 예측 인터랙티브 차트
        fig = make_subplots(
            rows=3, cols=2,
            subplot_titles=('비용 (Cost)', '노출 (Impressions)', '클릭 (Clicks)',
                          '전환수 (Conversions)', '전환값 (Revenue)'),
            vertical_spacing=0.12,
            horizontal_spacing=0.1
        )

        metrics = ['비용', '노출', '클릭', '전환수', '전환값']
        positions = [(1,1), (1,2), (2,1), (2,2), (3,1)]

        for metric, (row, col) in zip(metrics, positions):
            # 실제 데이터
            fig.add_trace(
                go.Scatter(x=daily.index, y=daily[metric],
                          mode='lines', name=f'{metric} (실제)',
                          line=dict(color='rgb(31, 119, 180)', width=2)),
                row=row, col=col
            )

            # 예측 데이터
            if forecasts[metric]['forecast'] is not None:
                forecast_series = forecasts[metric]['forecast']
                fig.add_trace(
                    go.Scatter(x=forecast_series.index, y=forecast_series.values,
                              mode='lines', name=f'{metric} (예측)',
                              line=dict(color='rgb(255, 127, 14)', width=2, dash='dash')),
                    row=row, col=col
                )

                # 신뢰구간
                if forecasts[metric]['conf_int'] is not None:
                    conf_int = forecasts[metric]['conf_int']
                    fig.add_trace(
                        go.Scatter(
                            x=conf_int.index.tolist() + conf_int.index.tolist()[::-1],
                            y=conf_int.iloc[:, 1].tolist() + conf_int.iloc[:, 0].tolist()[::-1],
                            fill='toself',
                            fillcolor='rgba(255, 127, 14, 0.2)',
                            line=dict(color='rgba(255,255,255,0)'),
                            showlegend=False,
                            name='95% 신뢰구간'
                        ),
                        row=row, col=col
                    )

        fig.update_layout(
            height=1000,
            title_text="마케팅 지표 시계열 분석 및 예측 (인터랙티브)",
            showlegend=True,
            hovermode='x unified'
        )

        interactive_chart_html = fig.to_html(include_plotlyjs=False, div_id="timeseries_chart")

        html_content += f"""
            <div class="section">
                <h2>📈 시계열 예측 <span class="badge badge-success">인터랙티브</span></h2>
                <div class="chart-container">
                    {interactive_chart_html}
                </div>
            </div>
"""

    # 정적 이미지 차트들
    html_content += """
            <div class="section">
                <h2>📊 정규분포 분석</h2>
                <div class="chart-container">
                    <img src="visualizations/distribution_analysis.png" alt="정규분포 분석">
                </div>
            </div>

            <div class="section">
                <h2>🔄 계절성 분해 (7일 주기)</h2>
                <div class="chart-container">
                    <img src="visualizations/seasonal_decomposition.png" alt="계절성 분해">
                </div>
            </div>

            <div class="section">
                <h2>🔗 상관관계 & 이상치 분석</h2>
                <div class="grid-2">
                    <div class="chart-container">
                        <h3 style="margin-bottom: 15px;">상관관계 히트맵</h3>
                        <img src="visualizations/correlation_heatmap.png" alt="상관관계">
                    </div>
                    <div class="chart-container">
                        <h3 style="margin-bottom: 15px;">이상치 탐지</h3>
                        <img src="visualizations/boxplot_outliers.png" alt="박스플롯">
                    </div>
                </div>
            </div>
"""

    # 통계 테이블
    html_content += """
            <div class="section">
                <h2>📋 주요 통계 지표</h2>
                <div style="overflow-x: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>지표</th>
                                <th>평균</th>
                                <th>중앙값</th>
                                <th>표준편차</th>
                                <th>최소값</th>
                                <th>최대값</th>
                                <th>왜도</th>
                                <th>첨도</th>
                            </tr>
                        </thead>
                        <tbody>
"""

    for metric, stats_data in statistics.items():
        if metric in ['비용', '노출', '클릭', '전환수', '전환값']:
            html_content += f"""
                            <tr>
                                <td><strong>{metric}</strong></td>
                                <td>{stats_data['mean']:,.1f}</td>
                                <td>{stats_data['median']:,.1f}</td>
                                <td>{stats_data['std']:,.1f}</td>
                                <td>{stats_data['min']:,.1f}</td>
                                <td>{stats_data['max']:,.1f}</td>
                                <td>{stats_data['skewness']:.2f}</td>
                                <td>{stats_data['kurtosis']:.2f}</td>
                            </tr>
"""

    html_content += """
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="section">
                <h2>🔮 예측 모델 정보</h2>
                <div style="overflow-x: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>지표</th>
                                <th>모델</th>
                                <th>주간 계절성</th>
                                <th>상태</th>
                            </tr>
                        </thead>
                        <tbody>
"""

    for metric in ['비용', '노출', '클릭', '전환수', '전환값']:
        forecast_info = forecasts[metric]
        model_type = forecast_info.get('model_type', 'Prophet')
        status = "정상" if forecast_info.get('model') else "대체 모델"

        html_content += f"""
                            <tr>
                                <td><strong>{metric}</strong></td>
                                <td>{model_type}</td>
                                <td>{'예' if model_type == 'Prophet' else '아니오'}</td>
                                <td>{status}</td>
                            </tr>
"""

    html_content += f"""
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>🚀 마케팅 대시보드 v3.0 | 생성일: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p style="margin-top: 10px; font-size: 0.9em; opacity: 0.8;">
                분석 엔진: Prophet | 시각화: Matplotlib, Seaborn{'& Plotly' if plotly_available else ''}
            </p>
        </div>
    </div>
</body>
</html>
"""

    # HTML 파일 저장
    data_dir = paths.base if paths else DATA_DIR
    data_dir.mkdir(parents=True, exist_ok=True)
    html_file = data_dir / 'dashboard.html'
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"   ✅ {html_file.name} 저장 완료")
    print(f"   📂 위치: {html_file.absolute()}")


def generate_metadata(df: pd.DataFrame, month_info: List[Dict] = None, paths: Optional[ClientPaths] = None) -> Dict[str, Any]:
    """메타데이터 생성"""
    print("\n📋 메타데이터 생성 중...")

    total_metrics = {
        'cost': float(df['비용'].sum()),
        'impressions': int(df['노출'].sum()),
        'clicks': int(df['클릭'].sum()),
        'conversions': int(df['전환수'].sum()),
        'revenue': float(df['전환값'].sum())
    }

    # 전체 KPI
    kpis = {
        'ctr': round(total_metrics['clicks'] / total_metrics['impressions'] * 100, 2) if total_metrics['impressions'] > 0 else 0,
        'cpc': round(total_metrics['cost'] / total_metrics['clicks'], 0) if total_metrics['clicks'] > 0 else 0,
        'cpa': round(total_metrics['cost'] / total_metrics['conversions'], 0) if total_metrics['conversions'] > 0 else 0,
        'cvr': round(total_metrics['conversions'] / total_metrics['clicks'] * 100, 2) if total_metrics['clicks'] > 0 else 0,
        'roas': round(total_metrics['revenue'] / total_metrics['cost'] * 100, 0) if total_metrics['cost'] > 0 else 0
    }

    metadata = {
        'last_updated': datetime.now().isoformat(),
        'total_rows': len(df),
        'date_range': {
            'start': df['일 구분'].min().strftime('%Y-%m-%d'),
            'end': df['일 구분'].max().strftime('%Y-%m-%d')
        },
        'total_metrics': total_metrics,
        'kpis': kpis
    }

    # JSON 저장
    meta_file = paths.meta_latest_json if paths else META_DIR / 'latest.json'
    meta_file.parent.mkdir(parents=True, exist_ok=True)
    with open(meta_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print(f"   ✅ {meta_file.name} 저장 완료")
    print(f"\n📊 전체 성과 요약:")
    print(f"   ├ 총 광고비: ₩{total_metrics['cost']:,.0f}")
    print(f"   ├ 총 전환수: {total_metrics['conversions']:,}건")
    print(f"   └ ROAS: {kpis['roas']}%")
    
    return metadata


def main(client_id: Optional[str] = None):
    """메인 실행 함수"""
    print("="*80)
    print("🚀 마케팅 데이터 전처리 시작 v2.0")
    print("="*80)

    # 경로 설정
    paths = None
    if client_id:
        paths = ClientPaths(client_id)
        paths.ensure_dirs()
        input_file = str(paths.raw_data)
        print(f"   클라이언트: {client_id}")
        print(f"   데이터 경로: {paths.base}")
    else:
        # 레거시 모드: 환경변수 또는 기본값 사용
        input_file = os.environ.get('INPUT_CSV_PATH', str(PROJECT_ROOT / 'data' / 'raw' / 'raw_data.csv'))
        # 레거시 디렉토리 생성
        for dir_path in [RAW_DIR, META_DIR, FORECAST_DIR, STATS_DIR, VISUAL_DIR]:
            dir_path.mkdir(parents=True, exist_ok=True)

    if not os.path.exists(input_file):
        print(f"\n❌ 오류: 입력 파일을 찾을 수 없습니다: {input_file}")
        sys.exit(1)

    try:
        # 1. 데이터 로드
        df = load_and_clean_data(input_file)

        # 2. 데이터 정제
        df = clean_and_convert_types(df)

        # 3. 지표 계산
        df = calculate_metrics(df)

        # 4. 통계 분석
        statistics = calculate_statistics(df, paths)

        # 5. 일별 통계
        calculate_daily_statistics(df, statistics, paths)

        # 6. 기본 예측 데이터 생성 (단순 버전)
        simple_forecast(df, paths=paths)

        # 7. 상세 예측 데이터 생성 (Prophet - 전체 데이터 활용)
        forecast_data = advanced_detailed_forecast(df, days=30, paths=paths)

        # 8. 주별/월별 예측 생성
        generate_weekly_predictions(forecast_data['predictions'], paths)
        generate_monthly_predictions(forecast_data['predictions'], paths)

        # 9. 시각화 생성
        visualize_analysis(df, forecast_data, paths)

        # 10. HTML 대시보드 생성
        generate_html_dashboard(df, forecast_data, statistics, paths)

        # 11. 메타데이터 생성
        generate_metadata(df, paths=paths)

        # 출력 경로 정보
        output_base = paths.base if paths else DATA_DIR

        print("\n" + "="*80)
        print("✅ 모든 처리 완료!")
        print("="*80)
        print(f"\n생성된 파일 ({output_base}):")
        print("   📁 forecast/")
        print("      ├ predictions_daily.csv (일별 - 단순 예측)")
        print("      ├ predictions_detailed.csv (일별 - Prophet 예측)")
        print("      ├ predictions_weekly.csv (주별 집계)")
        print("      └ predictions_monthly.csv (월별 집계)")
        print("   📁 visualizations/")
        print("      ├ timeseries_forecast.png (시계열 예측 그래프)")
        print("      ├ distribution_analysis.png (정규분포 분석)")
        print("      ├ seasonal_decomposition.png (계절성 분해)")
        print("      ├ correlation_heatmap.png (상관관계)")
        print("      └ boxplot_outliers.png (이상치 분석)")
        print("   📁 /")
        print("      └ dashboard.html (인터랙티브 대시보드)")

    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    # CLIENT_ID는 모듈 레벨에서 argparse로 파싱됨
    main(CLIENT_ID)
