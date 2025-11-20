"""
메모리 최적화 마케팅 데이터 처리 스크립트

메모리 최적화 기법:
1. 청크 단위 데이터 읽기/처리
2. 데이터 타입 최적화 (float64 → float32, object → category)
3. 가비지 컬렉션 강제 실행
4. Prophet 모델 순차 학습 후 즉시 메모리 해제
5. 중간 데이터프레임 즉시 삭제
6. 메모리 사용량 모니터링

환경변수:
- INPUT_CSV_PATH: 입력 CSV 파일 경로 (기본값: raw_data.csv)
"""

import os
import sys
import json
import gc
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Any
import warnings

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import pandas as pd
import numpy as np
from scipy import stats
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

# Prophet
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    print("⚠️ Prophet이 설치되지 않음. 단순 예측만 사용합니다.")

warnings.filterwarnings('ignore')

# 디렉토리 설정
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / 'data'
RAW_DIR = DATA_DIR / 'raw'
META_DIR = DATA_DIR / 'meta'
FORECAST_DIR = DATA_DIR / 'forecast'
STATS_DIR = DATA_DIR / 'statistics'
VISUAL_DIR = DATA_DIR / 'visualizations'

for dir_path in [RAW_DIR, META_DIR, FORECAST_DIR, STATS_DIR, VISUAL_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

plt.rcParams['font.family'] = 'Malgun Gothic'
plt.rcParams['axes.unicode_minus'] = False


def get_memory_usage():
    """현재 프로세스의 메모리 사용량 확인 (MB)"""
    try:
        import psutil
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / 1024 / 1024  # MB
    except ImportError:
        return -1


def optimize_dtypes(df: pd.DataFrame) -> pd.DataFrame:
    """데이터 타입 최적화로 메모리 절약"""
    print("🔧 데이터 타입 최적화 중...")

    original_mem = df.memory_usage(deep=True).sum() / 1024 / 1024

    # 숫자형 컬럼 최적화
    for col in df.select_dtypes(include=['float64']).columns:
        df[col] = df[col].astype('float32')

    for col in df.select_dtypes(include=['int64']).columns:
        df[col] = df[col].astype('int32')

    # 문자열 컬럼을 category로 변환 (반복되는 값이 많은 경우)
    for col in df.select_dtypes(include=['object']).columns:
        num_unique_values = len(df[col].unique())
        num_total_values = len(df[col])
        if num_unique_values / num_total_values < 0.5:  # 50% 이하면 category로
            df[col] = df[col].astype('category')

    optimized_mem = df.memory_usage(deep=True).sum() / 1024 / 1024
    saved = original_mem - optimized_mem

    print(f"   ├ 최적화 전: {original_mem:.2f} MB")
    print(f"   ├ 최적화 후: {optimized_mem:.2f} MB")
    print(f"   └ 절약: {saved:.2f} MB ({saved/original_mem*100:.1f}%)")

    return df


def load_and_clean_data_chunked(file_path: str) -> pd.DataFrame:
    """청크 단위로 데이터 로드 (메모리 효율적)"""
    print("📥 데이터 로딩 중 (청크 모드)...")

    mem_before = get_memory_usage()
    if mem_before > 0:
        print(f"   ├ 시작 메모리: {mem_before:.1f} MB")

    # 첫 번째 청크로 컬럼 확인
    sample = pd.read_csv(file_path, encoding='utf-8', nrows=100)
    print(f"   ├ 컬럼 수: {len(sample.columns)}")
    print(f"   └ 컬럼명: {list(sample.columns[:5])}")

    # 청크 크기 결정 (시스템 메모리에 따라 조정)
    chunk_size = 5000
    chunks = []

    try:
        for i, chunk in enumerate(pd.read_csv(file_path, encoding='utf-8', chunksize=chunk_size)):
            # 청크별 메모리 최적화
            chunk = optimize_dtypes(chunk)
            chunks.append(chunk)

            if (i + 1) % 10 == 0:
                print(f"   ├ 처리된 청크: {i+1} ({len(chunk) * (i+1):,} rows)")
                gc.collect()  # 가비지 컬렉션
    except UnicodeDecodeError:
        print("   ├ UTF-8 실패, CP949 시도...")
        for chunk in pd.read_csv(file_path, encoding='cp949', chunksize=chunk_size):
            chunk = optimize_dtypes(chunk)
            chunks.append(chunk)
            gc.collect()

    # 청크 병합
    print("   ├ 청크 병합 중...")
    df = pd.concat(chunks, ignore_index=True)
    del chunks  # 메모리 해제
    gc.collect()

    print(f"   ├ 로드된 행 수: {len(df):,}")

    mem_after = get_memory_usage()
    if mem_after > 0:
        print(f"   └ 현재 메모리: {mem_after:.1f} MB (증가: +{mem_after - mem_before:.1f} MB)")

    return df


def forecast_with_memory_control(daily_df: pd.DataFrame, days: int = 30) -> pd.DataFrame:
    """메모리 제어가 가능한 예측 함수"""
    print("🔮 예측 생성 중 (메모리 최적화)...")

    if not PROPHET_AVAILABLE:
        return simple_forecast(daily_df, days)

    metrics = ['비용', '노출', '클릭', '전환수', '전환값']
    all_predictions = []

    mem_start = get_memory_usage()

    for idx, metric in enumerate(metrics):
        print(f"   ├ [{idx+1}/{len(metrics)}] {metric} 예측 중...")

        try:
            # Prophet 데이터 준비 (float32 사용)
            prophet_df = daily_df[['일 구분', metric]].copy()
            prophet_df.columns = ['ds', 'y']
            prophet_df['y'] = prophet_df['y'].astype('float32')

            # Prophet 모델 생성 및 학습
            model = Prophet(
                yearly_seasonality=False,
                weekly_seasonality=True,
                daily_seasonality=False,
                seasonality_mode='additive',
                changepoint_prior_scale=0.05
            )
            model.fit(prophet_df)

            # 예측
            future = model.make_future_dataframe(periods=days)
            forecast = model.predict(future)

            # 필요한 컬럼만 추출 (메모리 절약)
            forecast = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(days).copy()
            forecast.columns = ['일 구분', f'{metric}_예측', f'{metric}_하한', f'{metric}_상한']
            forecast[f'{metric}_예측'] = forecast[f'{metric}_예측'].astype('float32')
            forecast[f'{metric}_하한'] = forecast[f'{metric}_하한'].astype('float32')
            forecast[f'{metric}_상한'] = forecast[f'{metric}_상한'].astype('float32')

            all_predictions.append(forecast)

            # 모델 즉시 삭제 및 가비지 컬렉션
            del model, prophet_df, future
            gc.collect()

            mem_current = get_memory_usage()
            if mem_current > 0:
                print(f"      메모리: {mem_current:.1f} MB")

        except Exception as e:
            print(f"   ├ ⚠️ {metric} 예측 실패: {str(e)}")
            # 실패 시 간단한 예측으로 대체
            simple_pred = simple_forecast_single(daily_df, metric, days)
            all_predictions.append(simple_pred)

    # 모든 예측 병합
    result = all_predictions[0]
    for pred in all_predictions[1:]:
        result = result.merge(pred, on='일 구분', how='outer')

    del all_predictions
    gc.collect()

    mem_end = get_memory_usage()
    if mem_end > 0 and mem_start > 0:
        print(f"   └ 메모리 변화: {mem_start:.1f} MB → {mem_end:.1f} MB")

    return result


def simple_forecast_single(df: pd.DataFrame, metric: str, days: int = 30) -> pd.DataFrame:
    """단일 메트릭에 대한 간단한 예측"""
    daily = df.groupby('일 구분')[metric].sum().reset_index()
    daily['일 구분'] = pd.to_datetime(daily['일 구분'])
    daily = daily.sort_values('일 구분')

    # 최근 데이터 기반 예측
    recent_avg = daily[metric].tail(30).mean()

    last_date = daily['일 구분'].max()
    future_dates = pd.date_range(start=last_date + timedelta(days=1), periods=days, freq='D')

    predictions = pd.DataFrame({
        '일 구분': future_dates,
        f'{metric}_예측': recent_avg,
        f'{metric}_하한': recent_avg * 0.8,
        f'{metric}_상한': recent_avg * 1.2
    })

    for col in [f'{metric}_예측', f'{metric}_하한', f'{metric}_상한']:
        predictions[col] = predictions[col].astype('float32')

    return predictions


def simple_forecast(df: pd.DataFrame, days: int = 30) -> pd.DataFrame:
    """간단한 예측 (Prophet 없이)"""
    print("   ├ 간단한 통계 기반 예측 사용")

    metrics = ['비용', '노출', '클릭', '전환수', '전환값']
    all_predictions = []

    for metric in metrics:
        pred = simple_forecast_single(df, metric, days)
        all_predictions.append(pred)

    result = all_predictions[0]
    for pred in all_predictions[1:]:
        result = result.merge(pred, on='일 구분', how='outer')

    return result


def main():
    """메인 실행 함수"""
    print("=" * 80)
    print("🚀 마케팅 데이터 처리 시작 (메모리 최적화 버전)")
    print("=" * 80)
    print()

    # 시작 시 메모리 상태
    mem_initial = get_memory_usage()
    if mem_initial > 0:
        print(f"💾 초기 메모리 사용량: {mem_initial:.1f} MB")
        print()

    # 입력 파일 경로
    input_file = os.environ.get('INPUT_CSV_PATH', 'raw_data.csv')

    if not os.path.exists(input_file):
        print(f"❌ 오류: {input_file} 파일을 찾을 수 없습니다.")
        sys.exit(1)

    # 1. 데이터 로드 (청크 모드)
    df = load_and_clean_data_chunked(input_file)

    # 컬럼명 정리
    df.columns = df.columns.str.strip()

    # 2. 날짜 처리
    print("\n📅 날짜 컬럼 처리 중...")
    df['일 구분'] = pd.to_datetime(df['일 구분'], errors='coerce')
    df = df.dropna(subset=['일 구분'])

    # 3. 월별 데이터 저장
    print("\n💾 월별 데이터 저장 중...")
    for year_month, group in df.groupby(df['일 구분'].dt.to_period('M')):
        output_file = RAW_DIR / f"{year_month}.csv"
        # float32로 저장하여 파일 크기도 절약
        group.to_csv(output_file, index=False, encoding='utf-8')
        print(f"   ├ {output_file.name}: {len(group):,} rows")

    gc.collect()

    # 4. 통계 생성
    print("\n📊 통계 생성 중...")
    daily_stats = df.groupby('일 구분').agg({
        '비용': 'sum',
        '노출': 'sum',
        '클릭': 'sum',
        '전환수': 'sum',
        '전환값': 'sum'
    }).reset_index()

    # float32 변환
    for col in ['비용', '노출', '클릭', '전환수', '전환값']:
        daily_stats[col] = daily_stats[col].astype('float32')

    stats_summary = {
        'total_days': len(daily_stats),
        'date_range': {
            'start': daily_stats['일 구분'].min().strftime('%Y-%m-%d'),
            'end': daily_stats['일 구분'].max().strftime('%Y-%m-%d')
        },
        'totals': {
            '비용': float(daily_stats['비용'].sum()),
            '노출': int(daily_stats['노출'].sum()),
            '클릭': int(daily_stats['클릭'].sum()),
            '전환수': int(daily_stats['전환수'].sum()),
            '전환값': float(daily_stats['전환값'].sum())
        },
        'averages': {
            '비용': float(daily_stats['비용'].mean()),
            '노출': float(daily_stats['노출'].mean()),
            '클릭': float(daily_stats['클릭'].mean()),
            '전환수': float(daily_stats['전환수'].mean()),
            '전환값': float(daily_stats['전환값'].mean())
        }
    }

    with open(STATS_DIR / 'statistics.json', 'w', encoding='utf-8') as f:
        json.dump(stats_summary, f, ensure_ascii=False, indent=2)

    print("   └ 통계 저장 완료")

    # 5. 예측 생성
    print("\n🔮 예측 생성 중...")
    predictions = forecast_with_memory_control(df, days=30)

    # 예측 저장
    predictions.to_csv(FORECAST_DIR / 'predictions_daily.csv', index=False, encoding='utf-8')
    print("   └ 예측 저장 완료")

    # 6. 메타데이터
    metadata = {
        'last_updated': datetime.now().isoformat(),
        'data_source': input_file,
        'total_records': len(df),
        'date_range': stats_summary['date_range'],
        'optimization': 'memory_optimized',
        'prophet_used': PROPHET_AVAILABLE
    }

    with open(META_DIR / 'latest.json', 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    # 최종 메모리 정리
    del df, daily_stats, predictions
    gc.collect()

    mem_final = get_memory_usage()

    print("\n" + "=" * 80)
    print("✅ 처리 완료!")
    print("=" * 80)
    if mem_initial > 0 and mem_final > 0:
        print(f"\n💾 메모리 사용량: {mem_initial:.1f} MB → {mem_final:.1f} MB")
        print(f"   피크 메모리 증가: +{mem_final - mem_initial:.1f} MB")
    print()


if __name__ == '__main__':
    try:
        main()
    except MemoryError:
        print("\n" + "=" * 80)
        print("❌ 메모리 부족 오류!")
        print("=" * 80)
        print("\n해결 방법:")
        print("1. 64-bit Python 사용 (추천)")
        print("2. process_lite.bat 실행 (더 가벼운 버전)")
        print("3. 다른 프로그램 종료 후 재시도")
        print("4. 데이터를 작은 기간으로 분할")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
