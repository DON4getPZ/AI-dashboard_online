"""
세그먼트별 데이터 처리 및 예측 모듈 v1.0

기능:
1. 브랜드/채널/상품별 데이터 집계
2. 세그먼트별 시계열 예측 (데이터 양에 따라 모델 자동 선택)
3. data/forecast/에 세그먼트별 예측 CSV 저장

환경변수:
- INPUT_CSV_PATH: 입력 CSV 파일 경로 (기본값: raw_data.csv)
"""

import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple
import warnings

# UTF-8 출력 설정 (Windows 콘솔 호환)
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import pandas as pd
import numpy as np

# Prophet 시계열 예측 라이브러리
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    print("Warning: Prophet not installed. Using simple forecasting.")

warnings.filterwarnings('ignore')

# 디렉토리 설정
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / 'data'
RAW_DIR = DATA_DIR / 'raw'
FORECAST_DIR = DATA_DIR / 'forecast'

# 디렉토리 생성
FORECAST_DIR.mkdir(parents=True, exist_ok=True)


class SegmentProcessor:
    """세그먼트별 데이터 처리 및 예측 클래스"""

    def __init__(self, input_file: str = None):
        """
        초기화

        Args:
            input_file: 입력 CSV 파일 경로. None이면 모든 월별 데이터 로드
        """
        self.input_file = input_file
        self.df = None
        self.segment_configs = [
            {'name': 'brand', 'column': '브랜드명', 'min_days': 14},
            {'name': 'channel', 'column': '유형구분', 'min_days': 7},
            {'name': 'product', 'column': '상품명', 'min_days': 14}
        ]
        self.metrics = ['비용', '노출', '클릭', '전환수', '전환값']
        self.forecast_days = 14

    def load_data(self) -> pd.DataFrame:
        """데이터 로드"""
        print("\n" + "="*60)
        print("Segment Processor v1.0")
        print("="*60)
        print("\n[1/4] Loading data...")

        if self.input_file and os.path.exists(self.input_file):
            # 단일 파일 로드
            df = pd.read_csv(self.input_file, encoding='utf-8')
            print(f"   Loaded from: {self.input_file}")
        else:
            # 모든 월별 데이터 로드
            all_data = []
            for f in sorted(RAW_DIR.glob('*.csv')):
                try:
                    month_df = pd.read_csv(f, encoding='utf-8')
                    all_data.append(month_df)
                except Exception as e:
                    print(f"   Warning: Failed to load {f.name}: {e}")

            if not all_data:
                raise ValueError("No data files found in data/raw/")

            df = pd.concat(all_data, ignore_index=True)
            print(f"   Loaded {len(all_data)} monthly files")

        # 날짜 변환
        df['일 구분'] = pd.to_datetime(df['일 구분'], errors='coerce')
        df = df.dropna(subset=['일 구분'])

        # 숫자 컬럼 변환
        for col in self.metrics:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

        print(f"   Total rows: {len(df):,}")
        print(f"   Date range: {df['일 구분'].min().strftime('%Y-%m-%d')} ~ {df['일 구분'].max().strftime('%Y-%m-%d')}")
        print(f"   Unique dates: {df['일 구분'].nunique()}")

        self.df = df
        return df

    def aggregate_by_segment(self, segment_col: str) -> Dict[str, pd.DataFrame]:
        """세그먼트별 일별 집계"""
        results = {}

        for segment_value in self.df[segment_col].dropna().unique():
            segment_df = self.df[self.df[segment_col] == segment_value]

            # 일별 집계
            daily = segment_df.groupby('일 구분').agg({
                col: 'sum' for col in self.metrics if col in segment_df.columns
            }).reset_index()

            daily = daily.sort_values('일 구분')
            results[segment_value] = daily

        return results

    def select_forecast_model(self, days: int) -> str:
        """데이터 일수에 따라 예측 모델 선택"""
        if days >= 100 and PROPHET_AVAILABLE:
            return 'prophet_full'
        elif days >= 30 and PROPHET_AVAILABLE:
            return 'prophet_weekly'
        elif days >= 14:
            return 'weighted_ma'
        elif days >= 7:
            return 'simple_ma'
        else:
            return 'last_value'

    def forecast_prophet(self, daily: pd.DataFrame, metric: str,
                        weekly_seasonality: bool = True) -> pd.Series:
        """Prophet을 사용한 예측"""
        prophet_df = daily[['일 구분', metric]].copy()
        prophet_df.columns = ['ds', 'y']
        prophet_df['y'] = prophet_df['y'].fillna(0)

        model = Prophet(
            yearly_seasonality=False,
            weekly_seasonality=weekly_seasonality,
            daily_seasonality=False,
            seasonality_mode='additive',
            changepoint_prior_scale=0.05
        )

        model.fit(prophet_df)

        future = model.make_future_dataframe(periods=self.forecast_days)
        forecast = model.predict(future)

        # 마지막 forecast_days개 추출
        predictions = forecast.tail(self.forecast_days)[['ds', 'yhat']].copy()
        predictions['yhat'] = predictions['yhat'].clip(lower=0)

        return pd.Series(
            predictions['yhat'].values,
            index=pd.DatetimeIndex(predictions['ds'].values)
        )

    def forecast_weighted_ma(self, daily: pd.DataFrame, metric: str) -> pd.Series:
        """가중 이동평균 예측"""
        # 최근 14일 데이터 사용, 최근 데이터에 더 높은 가중치
        recent = daily.tail(14)[metric].values
        weights = np.arange(1, len(recent) + 1)
        weighted_avg = np.average(recent, weights=weights)

        last_date = daily['일 구분'].max()
        forecast_dates = pd.date_range(
            start=last_date + timedelta(days=1),
            periods=self.forecast_days,
            freq='D'
        )

        return pd.Series([max(0, weighted_avg)] * self.forecast_days, index=forecast_dates)

    def forecast_simple_ma(self, daily: pd.DataFrame, metric: str) -> pd.Series:
        """단순 이동평균 예측"""
        avg = daily.tail(7)[metric].mean()

        last_date = daily['일 구분'].max()
        forecast_dates = pd.date_range(
            start=last_date + timedelta(days=1),
            periods=self.forecast_days,
            freq='D'
        )

        return pd.Series([max(0, avg)] * self.forecast_days, index=forecast_dates)

    def forecast_last_value(self, daily: pd.DataFrame, metric: str) -> pd.Series:
        """최근값 사용 (데이터 부족 시)"""
        last_val = daily[metric].iloc[-1] if len(daily) > 0 else 0

        last_date = daily['일 구분'].max()
        forecast_dates = pd.date_range(
            start=last_date + timedelta(days=1),
            periods=self.forecast_days,
            freq='D'
        )

        return pd.Series([max(0, last_val)] * self.forecast_days, index=forecast_dates)

    def forecast_segment(self, daily: pd.DataFrame, model_type: str) -> Dict[str, pd.Series]:
        """세그먼트 데이터에 대해 모든 메트릭 예측"""
        forecasts = {}

        for metric in self.metrics:
            if metric not in daily.columns:
                continue

            try:
                if model_type == 'prophet_full':
                    forecasts[metric] = self.forecast_prophet(daily, metric, weekly_seasonality=True)
                elif model_type == 'prophet_weekly':
                    forecasts[metric] = self.forecast_prophet(daily, metric, weekly_seasonality=True)
                elif model_type == 'weighted_ma':
                    forecasts[metric] = self.forecast_weighted_ma(daily, metric)
                elif model_type == 'simple_ma':
                    forecasts[metric] = self.forecast_simple_ma(daily, metric)
                else:
                    forecasts[metric] = self.forecast_last_value(daily, metric)
            except Exception as e:
                # 실패 시 단순 평균 사용
                forecasts[metric] = self.forecast_simple_ma(daily, metric)

        return forecasts

    def process_segment(self, segment_config: Dict) -> pd.DataFrame:
        """단일 세그먼트 차원 처리"""
        name = segment_config['name']
        column = segment_config['column']
        min_days = segment_config['min_days']

        print(f"\n   Processing {name} segments...")

        if column not in self.df.columns:
            print(f"   Warning: Column '{column}' not found")
            return pd.DataFrame()

        # 세그먼트별 집계
        segment_data = self.aggregate_by_segment(column)

        all_forecasts = []

        for segment_value, daily in segment_data.items():
            days = len(daily)

            # 모델 선택
            model_type = self.select_forecast_model(days)

            # 예측
            forecasts = self.forecast_segment(daily, model_type)

            if not forecasts:
                continue

            # 실제 데이터 (최근 14일)
            actual = daily.tail(14).copy()
            for _, row in actual.iterrows():
                all_forecasts.append({
                    '일 구분': row['일 구분'].strftime('%Y-%m-%d'),
                    name: segment_value,
                    '비용_예측': row.get('비용', 0),
                    '노출_예측': int(row.get('노출', 0)),
                    '클릭_예측': int(row.get('클릭', 0)),
                    '전환수_예측': row.get('전환수', 0),
                    '전환값_예측': row.get('전환값', 0),
                    'type': 'actual',
                    'model': 'actual'
                })

            # 예측 데이터
            forecast_dates = forecasts[list(forecasts.keys())[0]].index
            for date in forecast_dates:
                all_forecasts.append({
                    '일 구분': date.strftime('%Y-%m-%d'),
                    name: segment_value,
                    '비용_예측': forecasts.get('비용', pd.Series([0]))[date] if '비용' in forecasts else 0,
                    '노출_예측': int(forecasts.get('노출', pd.Series([0]))[date]) if '노출' in forecasts else 0,
                    '클릭_예측': int(forecasts.get('클릭', pd.Series([0]))[date]) if '클릭' in forecasts else 0,
                    '전환수_예측': forecasts.get('전환수', pd.Series([0]))[date] if '전환수' in forecasts else 0,
                    '전환값_예측': forecasts.get('전환값', pd.Series([0]))[date] if '전환값' in forecasts else 0,
                    'type': 'forecast',
                    'model': model_type
                })

            print(f"      - {segment_value}: {days} days, model={model_type}")

        return pd.DataFrame(all_forecasts)

    def run(self) -> Dict[str, pd.DataFrame]:
        """전체 처리 실행"""
        # 데이터 로드
        self.load_data()

        print("\n[2/4] Processing segments...")

        results = {}

        for config in self.segment_configs:
            result_df = self.process_segment(config)

            if not result_df.empty:
                # CSV 저장
                output_file = FORECAST_DIR / f"segment_{config['name']}.csv"
                result_df.to_csv(output_file, index=False, encoding='utf-8')
                results[config['name']] = result_df
                print(f"   Saved: {output_file.name}")

        print("\n[3/4] Calculating segment statistics...")

        # 세그먼트별 성과 통계 계산
        self.calculate_segment_stats(results)

        print("\n[4/4] Segment processing complete!")
        print("\nGenerated files:")
        for name in results.keys():
            print(f"   - data/forecast/segment_{name}.csv")

        return results

    def calculate_segment_stats(self, results: Dict[str, pd.DataFrame]) -> None:
        """세그먼트별 성과 통계 계산 (인사이트 생성용)"""
        stats = {}

        for segment_name, df in results.items():
            if df.empty:
                continue

            # 실제 데이터만 사용
            actual = df[df['type'] == 'actual'].copy()

            if actual.empty:
                continue

            segment_col = segment_name
            segment_stats = {}

            for segment_value in actual[segment_col].unique():
                seg_data = actual[actual[segment_col] == segment_value]

                total_cost = seg_data['비용_예측'].sum()
                total_revenue = seg_data['전환값_예측'].sum()
                total_conversions = seg_data['전환수_예측'].sum()
                total_clicks = seg_data['클릭_예측'].sum()

                # KPI 계산
                roas = (total_revenue / total_cost * 100) if total_cost > 0 else 0
                cpa = (total_cost / total_conversions) if total_conversions > 0 else 0
                cvr = (total_conversions / total_clicks * 100) if total_clicks > 0 else 0

                segment_stats[segment_value] = {
                    'total_cost': float(total_cost),
                    'total_revenue': float(total_revenue),
                    'total_conversions': float(total_conversions),
                    'roas': round(roas, 2),
                    'cpa': round(cpa, 2),
                    'cvr': round(cvr, 2)
                }

            stats[segment_name] = segment_stats

        # JSON으로 저장 (인사이트 생성기가 사용)
        import json
        stats_file = FORECAST_DIR / 'segment_stats.json'
        with open(stats_file, 'w', encoding='utf-8') as f:
            json.dump(stats, f, ensure_ascii=False, indent=2)

        print(f"   Saved: {stats_file.name}")


def main():
    """메인 실행 함수"""
    input_file = os.environ.get('INPUT_CSV_PATH', None)

    processor = SegmentProcessor(input_file)

    try:
        results = processor.run()
        print("\n" + "="*60)
        print("Segment processing completed successfully!")
        print("="*60)

    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
