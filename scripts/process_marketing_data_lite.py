"""
마케팅 데이터 전처리 - 경량 버전 (메모리 절약)

기능:
1. 원본 CSV 데이터 로드 및 정제
2. 월별 데이터 분리 저장
3. 통계 분석 (평균, 표준편차, 이상치 탐지)
4. 단순 예측 (Prophet 미사용, 메모리 절약)
5. 메타데이터 생성

환경변수:
- INPUT_CSV_PATH: 입력 CSV 파일 경로 (기본값: raw_data.csv)
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Any
import warnings

# UTF-8 출력 설정 (Windows 콘솔 호환)
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import pandas as pd
import numpy as np
from scipy import stats

warnings.filterwarnings('ignore')

# 디렉토리 설정
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / 'data'
RAW_DIR = DATA_DIR / 'raw'
META_DIR = DATA_DIR / 'meta'
FORECAST_DIR = DATA_DIR / 'forecast'
STATS_DIR = DATA_DIR / 'statistics'

# 디렉토리 생성
for dir_path in [RAW_DIR, META_DIR, FORECAST_DIR, STATS_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)


def load_and_clean_data(file_path: str) -> pd.DataFrame:
    """원본 CSV 로드 및 기본 정제"""
    print("📥 데이터 로딩 중...")

    # UTF-8 인코딩으로 읽기
    try:
        df = pd.read_csv(file_path, encoding='utf-8')
    except UnicodeDecodeError:
        try:
            df = pd.read_csv(file_path, encoding='cp949')
        except:
            df = pd.read_csv(file_path, encoding='latin-1')

    print(f"   ├ 로드된 행 수: {len(df):,}")
    print(f"   ├ 로드된 컬럼 수: {len(df.columns)}")

    # 컬럼명 정리
    df.columns = df.columns.str.strip()

    # 필수 컬럼 확인
    missing_cols = [col for col in ['월 구분', '일 구분', '비용'] if col not in df.columns]
    if missing_cols:
        raise ValueError(f"필수 컬럼이 없습니다: {missing_cols}")

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

    # 날짜가 없는 행 제거
    df = df.dropna(subset=['일 구분'])

    print(f"   ├ 정제 후 행 수: {len(df):,}")
    print(f"   └ 날짜 범위: {df['일 구분'].min()} ~ {df['일 구분'].max()}")

    return df


def calculate_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """마케팅 지표 계산"""
    print("\n📊 마케팅 지표 계산 중...")

    # CTR, CPC, CPA, CVR, ROAS
    df['ctr'] = np.where(df['노출'] > 0, (df['클릭'] / df['노출'] * 100).round(2), 0)
    df['cpc'] = np.where(df['클릭'] > 0, (df['비용'] / df['클릭']).round(0), 0)
    df['cpa'] = np.where(df['전환수'] > 0, (df['비용'] / df['전환수']).round(0), 0)
    df['cvr'] = np.where(df['클릭'] > 0, (df['전환수'] / df['클릭'] * 100).round(2), 0)
    df['roas'] = np.where(df['비용'] > 0, (df['전환값'] / df['비용'] * 100).round(0), 0)

    print(f"   ✅ 지표 계산 완료")

    return df


def split_by_month(df: pd.DataFrame) -> Dict[str, pd.DataFrame]:
    """월별로 데이터 분리"""
    print("\n📅 월별 데이터 분리 중...")

    monthly_data = {}
    df['year_month'] = df['일 구분'].dt.to_period('M')

    for period, group in df.groupby('year_month'):
        month_str = str(period)
        monthly_data[month_str] = group.copy()
        print(f"   ├ {month_str}: {len(group):,}행")

    return monthly_data


def save_monthly_csv(monthly_data: Dict[str, pd.DataFrame]) -> List[Dict]:
    """월별 CSV 저장"""
    print("\n💾 월별 CSV 저장 중...")

    month_info = []

    for month_str, df_month in monthly_data.items():
        df_save = df_month.drop(columns=['year_month'], errors='ignore')

        filename = f"{month_str}.csv"
        filepath = RAW_DIR / filename

        df_save.to_csv(filepath, index=False, encoding='utf-8')

        file_size = filepath.stat().st_size / 1024

        metrics = {
            'total_cost': float(df_month['비용'].sum()),
            'total_impressions': int(df_month['노출'].sum()),
            'total_clicks': int(df_month['클릭'].sum()),
            'total_conversions': int(df_month['전환수'].sum()),
            'total_revenue': float(df_month['전환값'].sum())
        }

        month_info.append({
            'month': month_str,
            'filename': filename,
            'rows': len(df_month),
            'size_kb': round(file_size, 1),
            'date_range': {
                'start': df_month['일 구분'].min().strftime('%Y-%m-%d'),
                'end': df_month['일 구분'].max().strftime('%Y-%m-%d')
            },
            'metrics': metrics
        })

        print(f"   ├ {filename} ({file_size:.1f} KB)")

    return month_info


def calculate_statistics(df: pd.DataFrame) -> Dict[str, Any]:
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

        mean_val = float(data.mean())
        median_val = float(data.median())
        std_val = float(data.std())

        statistics[metric] = {
            'mean': round(mean_val, 2),
            'median': round(median_val, 2),
            'std': round(std_val, 2),
            'min': round(float(data.min()), 2),
            'max': round(float(data.max()), 2),
            'q25': round(float(data.quantile(0.25)), 2),
            'q75': round(float(data.quantile(0.75)), 2)
        }

        print(f"   ├ {metric}: 평균={mean_val:.1f}")

    stats_file = STATS_DIR / 'statistics.json'
    with open(stats_file, 'w', encoding='utf-8') as f:
        json.dump(statistics, f, ensure_ascii=False, indent=2)

    print(f"   ✅ {stats_file.name} 저장 완료")

    return statistics


def simple_forecast(df: pd.DataFrame, days: int = 30) -> pd.DataFrame:
    """최근 90일 데이터 기반 단순 예측 (주간 패턴 반영)"""
    print(f"\n🔮 시계열 예측 중 ({days}일, 메모리 절약 모드)...")

    # 일별 집계
    daily = df.groupby('일 구분').agg({
        '비용': 'sum',
        '노출': 'sum',
        '클릭': 'sum',
        '전환수': 'sum',
        '전환값': 'sum'
    }).reset_index()

    daily = daily.sort_values('일 구분')

    # 최근 90일 데이터 사용
    learning_period = min(90, len(daily))
    learning_data = daily.tail(learning_period).copy()

    print(f"   ├ 학습 기간: 최근 {learning_period}일")

    metrics = ['비용', '노출', '클릭', '전환수', '전환값']
    base_values = {}
    std_values = {}
    weekly_patterns = {}

    for metric in metrics:
        metric_data = learning_data[metric].copy()
        threshold = metric_data.quantile(0.10)
        filtered_data = metric_data[metric_data >= threshold]

        if len(filtered_data) < 10:
            filtered_data = metric_data

        base_values[metric] = filtered_data.mean()
        std_values[metric] = filtered_data.std() * 0.1

        # 주간 패턴
        learning_data['dayofweek'] = pd.to_datetime(learning_data['일 구분']).dt.dayofweek
        weekly_avg = learning_data.groupby('dayofweek')[metric].mean()
        overall_avg = learning_data[metric].mean()
        if overall_avg > 0:
            weekly_patterns[metric] = (weekly_avg / overall_avg).to_dict()
        else:
            weekly_patterns[metric] = {i: 1.0 for i in range(7)}

    # 예측 데이터 생성
    predictions = []
    last_date = daily['일 구분'].max()
    np.random.seed(42)

    for i in range(1, days + 1):
        pred_date = last_date + timedelta(days=i)
        dayofweek = pred_date.dayofweek

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

    # 실제 데이터 추가
    actual = daily.tail(30).copy()
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

    # 저장
    for timeframe in ['daily', 'detailed', 'weekly', 'monthly']:
        if timeframe == 'weekly':
            # 주별 집계
            df_temp = forecast_df.copy()
            df_temp['일 구분'] = pd.to_datetime(df_temp['일 구분'])
            df_temp['주 구분'] = df_temp['일 구분'].dt.to_period('W').astype(str)
            weekly = df_temp.groupby(['주 구분', 'type']).agg({
                '비용_예측': 'sum',
                '노출_예측': 'sum',
                '클릭_예측': 'sum',
                '전환수_예측': 'sum',
                '전환값_예측': 'sum'
            }).reset_index()
            forecast_file = FORECAST_DIR / f'predictions_{timeframe}.csv'
            weekly.to_csv(forecast_file, index=False, encoding='utf-8')
        elif timeframe == 'monthly':
            # 월별 집계
            df_temp = forecast_df.copy()
            df_temp['일 구분'] = pd.to_datetime(df_temp['일 구분'])
            df_temp['월 구분'] = df_temp['일 구분'].dt.to_period('M').astype(str)
            monthly = df_temp.groupby(['월 구분', 'type']).agg({
                '비용_예측': 'sum',
                '노출_예측': 'sum',
                '클릭_예측': 'sum',
                '전환수_예측': 'sum',
                '전환값_예측': 'sum'
            }).reset_index()
            forecast_file = FORECAST_DIR / f'predictions_{timeframe}.csv'
            monthly.to_csv(forecast_file, index=False, encoding='utf-8')
        else:
            forecast_file = FORECAST_DIR / f'predictions_{timeframe}.csv'
            forecast_df.to_csv(forecast_file, index=False, encoding='utf-8')

    print(f"   ✅ 예측 파일 저장 완료")
    print(f"   ├ 실제 데이터: {len(actual)}일")
    print(f"   └ 예측 데이터: {len(predictions)}일")

    return forecast_df


def generate_metadata(df: pd.DataFrame, month_info: List[Dict]) -> Dict[str, Any]:
    """메타데이터 생성"""
    print("\n📋 메타데이터 생성 중...")

    total_metrics = {
        'cost': float(df['비용'].sum()),
        'impressions': int(df['노출'].sum()),
        'clicks': int(df['클릭'].sum()),
        'conversions': int(df['전환수'].sum()),
        'revenue': float(df['전환값'].sum())
    }

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
        'months': sorted(month_info, key=lambda x: x['month'], reverse=True),
        'total_metrics': total_metrics,
        'kpis': kpis,
        'processing_mode': 'lite'
    }

    meta_file = META_DIR / 'latest.json'
    with open(meta_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print(f"   ✅ {meta_file.name} 저장 완료")
    print(f"\n📊 전체 성과 요약:")
    print(f"   ├ 총 광고비: ₩{total_metrics['cost']:,.0f}")
    print(f"   ├ 총 전환수: {total_metrics['conversions']:,}건")
    print(f"   └ ROAS: {kpis['roas']}%")

    return metadata


def main():
    """메인 실행 함수"""
    print("="*80)
    print("🚀 마케팅 데이터 전처리 시작 (경량 버전)")
    print("="*80)
    print("\n💡 메모리 절약 모드: Prophet 미사용, 단순 예측만 수행")

    input_file = os.environ.get('INPUT_CSV_PATH', 'raw_data.csv')

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

        # 4. 월별 분리
        monthly_data = split_by_month(df)

        # 5. 월별 CSV 저장
        month_info = save_monthly_csv(monthly_data)

        # 6. 통계 분석
        statistics = calculate_statistics(df)

        # 7. 단순 예측 (Prophet 미사용)
        simple_forecast(df)

        # 8. 메타데이터 생성
        generate_metadata(df, month_info)

        print("\n" + "="*80)
        print("✅ 모든 처리 완료! (경량 모드)")
        print("="*80)
        print("\n생성된 파일:")
        print("   📁 data/forecast/")
        print("      ├ predictions_daily.csv")
        print("      ├ predictions_detailed.csv")
        print("      ├ predictions_weekly.csv")
        print("      └ predictions_monthly.csv")
        print("   📁 data/statistics/")
        print("      └ statistics.json")
        print("   📁 data/meta/")
        print("      └ latest.json")

    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
