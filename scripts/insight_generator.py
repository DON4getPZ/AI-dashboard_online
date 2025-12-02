"""
마케팅 인사이트 생성 모듈 v2.1 (AI Consultant Edition + Multi-Period)

기능:
1. 세그먼트별 예측 데이터 분석
2. KPI 하락 예측 감지 (Financial Impact 포함)
3. 최적 투자 대상 추천 (효율성/성장성/안정성 기반)
4. 숨은 기회 발굴 (Opportunities)
5. AI 비서 톤의 자연어 인사이트 생성
6. data/forecast/insights.json 저장

v2.1 업데이트:
- Multi-Period 지원: --days 파라미터로 기간 필터링 (full, 180, 90, 30)
- 기간별 인사이트 생성 지원

v2.0 업데이트:
- AI Consultant Persona: 친화적이고 직관적인 메시지
- Action-First Architecture: 즉시 실행 가능한 액션 제안
- Financial Impact: 예상 손실액/기대 수익 계산
- Risk & Opportunity Matrix: 방어/공격 전략 동시 수립

의존성:
- segment_processor.py가 먼저 실행되어야 함
- data/forecast/segment_*.csv 파일 필요
- data/forecast/segment_stats.json 파일 필요
"""

import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple, Optional
import warnings

# UTF-8 출력 설정 (Windows 콘솔 호환)
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import pandas as pd
import numpy as np

warnings.filterwarnings('ignore')

# 디렉토리 설정
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / 'data'
FORECAST_DIR = DATA_DIR / 'forecast'

# ============================================================================
# 분석 임계값 설정 (업종에 맞게 튜닝 가능)
# ============================================================================
THRESHOLDS = {
    'high_roas': 300.0,       # 고효율 기준 (%)
    'low_roas': 150.0,        # 저효율 기준 (%)
    'growth_star': 10.0,      # 고성장 기준 (%)
    'risk_critical': -20.0,   # 위험 경고 기준 (%)
    'risk_warning': -10.0,    # 주의 필요 기준 (%)
    'budget_alert': 90.0,     # 예산 소진 경고 (%)
    'opportunity_roas': 200.0 # 기회 발굴 기준 (%)
}

# ============================================================================
# AI 컨설턴트 액션 가이드 (Action-First Architecture)
# ============================================================================
ACTION_GUIDES = {
    'roas_decline': "경쟁사 입찰 단가(CPC)가 상승했거나, 광고 소재의 피로도가 높아졌을 수 있습니다. 소재를 교체하거나 제외 타겟을 설정해보세요.",
    'conversion_drop': "유입은 되는데 구매를 안 하네요. 상세페이지 로딩 속도나 품절 옵션을 체크하고, 장바구니 리타겟팅을 강화하세요.",
    'cost_surge': "지출이 급증하고 있습니다. 자동 입찰 전략이 오작동하는지 확인하고, 일예산 상한선(Cap)을 점검하세요.",
    'opportunity': "물 들어올 때 노 저으세요! 성과가 좋은 이 영역에 예산을 20% 증액하여 매출 볼륨을 키우세요.",
    'hidden_gem': "아직 예산은 적지만 효율이 터지고 있습니다. 테스트 예산을 2배로 늘려 트래픽을 모아보세요.",
    'budget_warning': "예산 소진이 빠릅니다. 월말까지 페이싱을 조절하거나, 추가 예산 확보를 검토하세요.",
    'maintain': "현재 전략이 잘 작동하고 있습니다. 큰 변경 없이 모니터링을 유지하세요."
}

# ============================================================================
# 친화적 메시지 템플릿
# ============================================================================
FRIENDLY_TITLES = {
    'revenue_drop': "📉 {target} 매출 급락 경보",
    'roas_drop': "💸 {target} 효율 저하 주의",
    'conversion_drop': "🛒 {target} 전환율 하락",
    'cost_surge': "🔥 {target} 비용 급증",
    'budget_alert': "💰 예산 소진 경고",
    'growth_acceleration': "🚀 성장 가속화",
    'stable_growth': "⚖️ 외형 성장 중 (효율 주의)",
    'declining': "📉 하락세 감지",
    'stable': "⚓ 안정적 유지",
    'scale_up': "🚀 강력 추천: 예산 증액",
    'hidden_gem': "💎 숨은 보석 발견"
}

# ============================================================================
# 헬퍼 함수
# ============================================================================
def format_currency(value):
    """원화 포맷팅 (예: 1,500만 원)"""
    if pd.isna(value) or value == 0:
        return "0원"
    val = float(value)
    if abs(val) >= 100000000:
        return f"{val/100000000:.1f}억 원"
    elif abs(val) >= 10000:
        return f"{val/10000:,.0f}만 원"
    else:
        return f"{int(val):,}원"

def safe_div(numerator, denominator):
    """안전한 나눗셈 (0 division 방지)"""
    return numerator / denominator if denominator and denominator != 0 else 0

def safe_float(val):
    """JSON 직렬화를 위한 안전한 float 변환"""
    if pd.isna(val) or np.isinf(val):
        return 0.0
    return float(val)

# JSON 인코더 (NaN, Inf, numpy 타입 안전 처리)
class NpEncoder(json.JSONEncoder):
    """numpy 타입과 NaN/Inf를 JSON 안전하게 변환하는 인코더"""
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            if np.isnan(obj) or np.isinf(obj):
                return None
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if pd.isna(obj):
            return None
        return super(NpEncoder, self).default(obj)


class InsightGenerator:
    """마케팅 인사이트 생성 클래스 (AI Consultant Edition + Multi-Period)"""

    def __init__(self, days: Optional[int] = None):
        """초기화

        Args:
            days: 분석 기간 (None=전체, 180, 90, 30)
        """
        self.days = days
        self.period_label = 'full' if days is None else f'{days}d'
        self.segment_data = {}
        self.segment_stats = {}
        self.forecasts = {}
        self.predictions_data = {}  # predictions_*.csv 데이터
        self.insights = {
            'generated_at': datetime.now().isoformat(),
            'period': self.period_label,  # 분석 기간 표시
            'summary_card': {},  # AI 비서 스타일 요약 카드
            'overall': {},  # 전체 성과 분석
            'segments': {
                'alerts': [],
                'recommendations': []
            },
            'opportunities': [],  # 숨은 기회 발굴 (공격 전략)
            'summary': '',
            'details': {},
            'performance_trends': {}  # 7d/30d 트렌드
        }

        # KPI 임계값 설정 (글로벌 THRESHOLDS와 병합)
        self.thresholds = {
            'decline_alert_pct': abs(THRESHOLDS['risk_warning']),  # 10% 이상 하락 시 경고
            'critical_decline_pct': abs(THRESHOLDS['risk_critical']),  # 20% 이상 심각 경고
            'efficiency_top_pct': 20,  # 상위 20% 효율
            'growth_threshold': THRESHOLDS['growth_star'],  # 성장률 임계값
            'stability_cv': 0.3  # 변동계수 임계값
        }

    def filter_by_days(self, df: pd.DataFrame, date_column: str = '일 구분') -> pd.DataFrame:
        """데이터프레임을 days 기준으로 필터링

        Args:
            df: 필터링할 데이터프레임
            date_column: 날짜 컬럼명

        Returns:
            필터링된 데이터프레임
        """
        if self.days is None or df.empty:
            return df

        if date_column not in df.columns:
            return df

        try:
            # 날짜 컬럼을 datetime으로 변환
            df = df.copy()
            df[date_column] = pd.to_datetime(df[date_column], errors='coerce')

            # 최신 날짜 기준으로 필터링
            max_date = df[date_column].max()
            if pd.isna(max_date):
                return df

            cutoff_date = max_date - timedelta(days=self.days)
            filtered_df = df[df[date_column] >= cutoff_date]

            # 날짜를 다시 문자열로 변환 (원래 형식 유지)
            filtered_df[date_column] = filtered_df[date_column].dt.strftime('%Y-%m-%d')

            return filtered_df
        except Exception as e:
            print(f"   Warning: Date filtering failed - {e}")
            return df

    def load_data(self) -> bool:
        """세그먼트 데이터 로드 및 기간 필터링"""
        print("\n" + "="*60)
        print("🧠 AI Marketing Insight Generator v2.1 (Multi-Period)")
        print("="*60)
        period_display = "전체" if self.days is None else f"최근 {self.days}일"
        print(f"   📅 분석 기간: {period_display}")
        print("\n[1/6] Loading segment data...")

        # 세그먼트별 예측 데이터 로드
        segment_files = {
            'brand': FORECAST_DIR / 'segment_brand.csv',
            'channel': FORECAST_DIR / 'segment_channel.csv',
            'product': FORECAST_DIR / 'segment_product.csv',
            'promotion': FORECAST_DIR / 'segment_promotion.csv'
        }

        loaded_count = 0
        for name, filepath in segment_files.items():
            if filepath.exists():
                df = pd.read_csv(filepath, encoding='utf-8')
                # 기간 필터링 적용
                self.segment_data[name] = self.filter_by_days(df)
                loaded_count += 1
                original_len = len(df)
                filtered_len = len(self.segment_data[name])
                if self.days and original_len != filtered_len:
                    print(f"   Loaded: {filepath.name} ({filtered_len}/{original_len} rows)")
                else:
                    print(f"   Loaded: {filepath.name}")
            else:
                print(f"   Warning: {filepath.name} not found")

        # 세그먼트 통계 로드 (JSON은 필터링 불가, 전체 데이터 사용)
        stats_file = FORECAST_DIR / 'segment_stats.json'
        if stats_file.exists():
            with open(stats_file, 'r', encoding='utf-8') as f:
                self.segment_stats = json.load(f)
            print(f"   Loaded: {stats_file.name}")
        else:
            print(f"   Warning: {stats_file.name} not found")

        # predictions_*.csv 파일 로드
        predictions_files = {
            'daily': FORECAST_DIR / 'predictions_daily.csv',
            'weekly': FORECAST_DIR / 'predictions_weekly.csv',
            'monthly': FORECAST_DIR / 'predictions_monthly.csv'
        }

        for name, filepath in predictions_files.items():
            if filepath.exists():
                df = pd.read_csv(filepath, encoding='utf-8')
                # 기간 필터링 적용
                self.predictions_data[name] = self.filter_by_days(df)
                original_len = len(df)
                filtered_len = len(self.predictions_data[name])
                if self.days and original_len != filtered_len:
                    print(f"   Loaded: {filepath.name} ({filtered_len}/{original_len} rows)")
                else:
                    print(f"   Loaded: {filepath.name}")
            else:
                print(f"   Info: {filepath.name} not found (optional)")

        if loaded_count == 0:
            print("\n   Error: No segment data found. Run segment_processor.py first.")
            return False

        return True

    def analyze_forecasts(self) -> None:
        """예측 데이터 분석"""
        print("\n[2/5] Analyzing forecasts...")

        for segment_name, df in self.segment_data.items():
            if df.empty:
                continue

            segment_col = segment_name

            # 실제 vs 예측 비교
            actual = df[df['type'] == 'actual']
            forecast = df[df['type'] == 'forecast']

            if actual.empty or forecast.empty:
                continue

            # 각 세그먼트별 분석
            segment_analysis = {}

            for segment_value in df[segment_col].unique():
                seg_actual = actual[actual[segment_col] == segment_value]
                seg_forecast = forecast[forecast[segment_col] == segment_value]

                if seg_actual.empty or seg_forecast.empty:
                    continue

                # 실제 평균 vs 예측 평균
                actual_metrics = {
                    '비용': seg_actual['비용_예측'].mean(),
                    '전환수': seg_actual['전환수_예측'].mean(),
                    '전환값': seg_actual['전환값_예측'].mean()
                }

                forecast_metrics = {
                    '비용': seg_forecast['비용_예측'].mean(),
                    '전환수': seg_forecast['전환수_예측'].mean(),
                    '전환값': seg_forecast['전환값_예측'].mean()
                }

                # 변화율 계산
                changes = {}
                for metric in ['비용', '전환수', '전환값']:
                    if actual_metrics[metric] > 0:
                        change = ((forecast_metrics[metric] - actual_metrics[metric])
                                 / actual_metrics[metric] * 100)
                        changes[metric] = round(change, 1)
                    else:
                        changes[metric] = 0

                # ROAS 변화
                actual_roas = (actual_metrics['전환값'] / actual_metrics['비용'] * 100
                              if actual_metrics['비용'] > 0 else 0)
                forecast_roas = (forecast_metrics['전환값'] / forecast_metrics['비용'] * 100
                                if forecast_metrics['비용'] > 0 else 0)

                segment_analysis[segment_value] = {
                    'actual_avg': actual_metrics,
                    'forecast_avg': forecast_metrics,
                    'changes': changes,
                    'actual_roas': round(actual_roas, 1),
                    'forecast_roas': round(forecast_roas, 1)
                }

            self.forecasts[segment_name] = segment_analysis
            print(f"   Analyzed {len(segment_analysis)} {segment_name} segments")

    def analyze_overall(self) -> None:
        """전체 성과 분석 (predictions_*.csv 기반)"""
        print("\n[2.5/5] Analyzing overall performance...")

        if 'daily' not in self.predictions_data or self.predictions_data['daily'].empty:
            print("   Warning: No daily predictions data available")
            return

        daily_df = self.predictions_data['daily']

        # actual vs forecast 데이터 분리
        actual = daily_df[daily_df['type'] == 'actual']
        forecast = daily_df[daily_df['type'] == 'forecast']

        overall_insights = {}

        # 현재 기간 (actual) 집계
        if not actual.empty:
            current_period = {
                'start_date': actual['일 구분'].min(),
                'end_date': actual['일 구분'].max(),
                'total_cost': round(actual['비용_예측'].sum(), 2),
                'total_conversions': round(actual['전환수_예측'].sum(), 2),
                'total_revenue': round(actual['전환값_예측'].sum(), 2),
                'total_clicks': round(actual['클릭_예측'].sum(), 2) if '클릭_예측' in actual.columns else 0,
                'total_impressions': round(actual['노출_예측'].sum(), 2) if '노출_예측' in actual.columns else 0
            }

            # ROAS, CPA 계산
            if current_period['total_cost'] > 0:
                current_period['roas'] = round((current_period['total_revenue'] / current_period['total_cost']) * 100, 2)
                current_period['avg_cpa'] = round(current_period['total_cost'] / current_period['total_conversions'], 2) if current_period['total_conversions'] > 0 else 0
            else:
                current_period['roas'] = 0
                current_period['avg_cpa'] = 0

            # CVR, CTR 계산
            if current_period['total_clicks'] > 0:
                current_period['cvr'] = round((current_period['total_conversions'] / current_period['total_clicks']) * 100, 2)
            else:
                current_period['cvr'] = 0

            if current_period['total_impressions'] > 0:
                current_period['ctr'] = round((current_period['total_clicks'] / current_period['total_impressions']) * 100, 2)
            else:
                current_period['ctr'] = 0

            overall_insights['current_period'] = current_period

        # 예측 기간 (forecast) 집계
        if not forecast.empty:
            forecast_period = {
                'start_date': forecast['일 구분'].min(),
                'end_date': forecast['일 구분'].max(),
                'total_cost': round(forecast['비용_예측'].sum(), 2),
                'total_conversions': round(forecast['전환수_예측'].sum(), 2),
                'total_revenue': round(forecast['전환값_예측'].sum(), 2),
                'total_clicks': round(forecast['클릭_예측'].sum(), 2) if '클릭_예측' in forecast.columns else 0,
                'total_impressions': round(forecast['노출_예측'].sum(), 2) if '노출_예측' in forecast.columns else 0
            }

            # ROAS, CPA 계산
            if forecast_period['total_cost'] > 0:
                forecast_period['roas'] = round((forecast_period['total_revenue'] / forecast_period['total_cost']) * 100, 2)
                forecast_period['avg_cpa'] = round(forecast_period['total_cost'] / forecast_period['total_conversions'], 2) if forecast_period['total_conversions'] > 0 else 0
            else:
                forecast_period['roas'] = 0
                forecast_period['avg_cpa'] = 0

            # CVR, CTR 계산
            if forecast_period['total_clicks'] > 0:
                forecast_period['cvr'] = round((forecast_period['total_conversions'] / forecast_period['total_clicks']) * 100, 2)
            else:
                forecast_period['cvr'] = 0

            if forecast_period['total_impressions'] > 0:
                forecast_period['ctr'] = round((forecast_period['total_clicks'] / forecast_period['total_impressions']) * 100, 2)
            else:
                forecast_period['ctr'] = 0

            overall_insights['forecast_period'] = forecast_period

        # 트렌드 분석
        if 'current_period' in overall_insights and 'forecast_period' in overall_insights:
            current = overall_insights['current_period']
            forecast_p = overall_insights['forecast_period']

            roas_change = forecast_p['roas'] - current['roas']
            conv_change = ((forecast_p['total_conversions'] - current['total_conversions']) / current['total_conversions'] * 100) if current['total_conversions'] > 0 else 0

            trend = {
                'roas_change': round(roas_change, 2),
                'conversion_change': round(conv_change, 2),
                'direction': 'improving' if roas_change > 0 else 'declining' if roas_change < -1 else 'stable'
            }

            overall_insights['trend'] = trend

        # ================================================================
        # Summary Card 생성 (AI 비서 톤)
        # ================================================================
        if 'current_period' in overall_insights and 'forecast_period' in overall_insights:
            current = overall_insights['current_period']
            forecast_p = overall_insights['forecast_period']

            # 향후 7일 데이터로 트렌드 판단
            rev_change = safe_div(forecast_p['total_revenue'] - current['total_revenue'], current['total_revenue']) * 100
            roas_change = forecast_p['roas'] - current['roas']

            # 상태 결정
            if rev_change > 5 and roas_change > 0:
                status_key = 'growth_acceleration'
                status_msg = "매출과 효율이 모두 오르고 있습니다. 아주 훌륭해요!"
                status_color = "green"
            elif rev_change > 5 and roas_change < -10:
                status_key = 'stable_growth'
                status_msg = "매출은 늘지만 이익률이 떨어지고 있어요. 마진을 체크하세요."
                status_color = "orange"
            elif rev_change < -5:
                status_key = 'declining'
                status_msg = "향후 매출 감소가 예상됩니다. 긴급 점검이 필요해요."
                status_color = "red"
            else:
                status_key = 'stable'
                status_msg = "큰 변동 없이 안정적인 흐름을 보이고 있습니다."
                status_color = "blue"

            self.insights['summary_card'] = {
                'status_title': FRIENDLY_TITLES.get(status_key, "📊 성과 분석"),
                'status_message': status_msg,
                'status_color': status_color,
                'metrics': {
                    'current_revenue': format_currency(current['total_revenue']),
                    'forecast_revenue': format_currency(forecast_p['total_revenue']),
                    'revenue_change_pct': round(rev_change, 1),
                    'current_roas': round(current['roas'], 0),
                    'forecast_roas': round(forecast_p['roas'], 0),
                    'roas_change_val': round(roas_change, 1)
                },
                'period': f"예측 기간: {forecast_p.get('start_date', 'N/A')} ~ {forecast_p.get('end_date', 'N/A')}"
            }

        # ================================================================
        # Overall alerts 생성 (친화적 메시지 + Action)
        # ================================================================
        alerts = []
        if 'current_period' in overall_insights:
            current = overall_insights['current_period']

            # 예산 소진율 계산 (가정: 월 예산 2000만원)
            monthly_budget = 20000000
            if current['total_cost'] > 0:
                budget_used_pct = (current['total_cost'] / monthly_budget) * 100
                if budget_used_pct > THRESHOLDS['budget_alert']:
                    alerts.append({
                        'type': 'budget_alert',
                        'severity': 'high',
                        'title': FRIENDLY_TITLES['budget_alert'],
                        'message': f"월 예산 대비 {round(budget_used_pct, 1)}% 소진! ({current['end_date']} 기준)",
                        'action': ACTION_GUIDES['budget_warning'],
                        'financial_impact': f"남은 예산: {format_currency(monthly_budget - current['total_cost'])}"
                    })
                elif budget_used_pct > 75:
                    alerts.append({
                        'type': 'budget_alert',
                        'severity': 'medium',
                        'title': "💰 예산 소진 주의",
                        'message': f"월 예산 대비 {round(budget_used_pct, 1)}% 소진 ({current['end_date']} 기준)",
                        'action': "페이싱을 모니터링하고, 필요시 일예산을 조정하세요.",
                        'financial_impact': f"남은 예산: {format_currency(monthly_budget - current['total_cost'])}"
                    })

        overall_insights['alerts'] = alerts

        # 오늘 데이터 비교 (최신 actual vs 해당일 forecast)
        if not actual.empty and not forecast.empty:
            latest_actual_date = actual['일 구분'].max()
            latest_actual = actual[actual['일 구분'] == latest_actual_date]

            if not latest_actual.empty:
                latest_actual_row = latest_actual.iloc[0]
                daily_comparison = {
                    'date': latest_actual_date,
                    'actual': {
                        'cost': round(latest_actual_row['비용_예측'], 2),
                        'conversions': round(latest_actual_row['전환수_예측'], 2),
                        'revenue': round(latest_actual_row['전환값_예측'], 2)
                    }
                }

                # 같은 날짜의 forecast 데이터 찾기 (있다면)
                forecast_same_date = forecast[forecast['일 구분'] == latest_actual_date]
                if not forecast_same_date.empty:
                    forecast_row = forecast_same_date.iloc[0]
                    daily_comparison['forecast'] = {
                        'cost': round(forecast_row['비용_예측'], 2),
                        'conversions': round(forecast_row['전환수_예측'], 2),
                        'revenue': round(forecast_row['전환값_예측'], 2)
                    }

                    # 정확도 계산
                    if daily_comparison['forecast']['conversions'] > 0:
                        accuracy = (daily_comparison['actual']['conversions'] / daily_comparison['forecast']['conversions']) * 100
                        daily_comparison['accuracy'] = round(accuracy, 1)

                overall_insights['daily_comparison'] = daily_comparison

        self.insights['overall'] = overall_insights

        print(f"   Current period: {overall_insights.get('current_period', {}).get('start_date')} ~ {overall_insights.get('current_period', {}).get('end_date')}")
        print(f"   Total conversions: {overall_insights.get('current_period', {}).get('total_conversions', 0)}")
        print(f"   ROAS: {overall_insights.get('current_period', {}).get('roas', 0)}%")

    def analyze_performance_trends(self) -> None:
        """성과 트렌드 분석 (7일/30일 비교)"""
        print("\n[2.7/5] Analyzing performance trends (7d/30d)...")

        if 'daily' not in self.predictions_data or self.predictions_data['daily'].empty:
            print("   Warning: No daily predictions data for trend analysis")
            return

        daily_df = self.predictions_data['daily']
        actual = daily_df[daily_df['type'] == 'actual'].copy()

        if actual.empty or len(actual) < 14:
            print("   Warning: Insufficient data for trend analysis (need at least 14 days)")
            return

        # 날짜 정렬
        actual = actual.sort_values('일 구분')

        improvements_7d = []
        declines_7d = []
        improvements_30d = []
        declines_30d = []

        metrics = {
            '비용': '비용_예측',
            '전환수': '전환수_예측',
            '전환값': '전환값_예측'
        }

        # 7일 비교
        if len(actual) >= 14:
            recent_7d = actual.tail(7)
            previous_7d = actual.iloc[-14:-7]

            for metric_name, col_name in metrics.items():
                if col_name not in actual.columns:
                    continue

                recent_avg = recent_7d[col_name].mean()
                previous_avg = previous_7d[col_name].mean()

                if previous_avg > 0:
                    change_pct = ((recent_avg - previous_avg) / previous_avg) * 100

                    if change_pct > 20:  # 20% 이상 증가
                        improvements_7d.append({
                            'metric': metric_name,
                            'period': '7d',
                            'improvement_level': 'high' if change_pct > 30 else 'medium',
                            'change_pct': round(change_pct, 2),
                            'recent_avg': round(recent_avg, 2),
                            'previous_avg': round(previous_avg, 2),
                            'recommendation': f'{metric_name}이(가) 개선되고 있습니다. 현재 전략을 유지하고 확대하세요.'
                        })
                    elif change_pct < -20:  # 20% 이상 감소
                        declines_7d.append({
                            'metric': metric_name,
                            'period': '7d',
                            'risk_level': 'high' if change_pct < -30 else 'medium',
                            'change_pct': round(change_pct, 2),
                            'recent_avg': round(recent_avg, 2),
                            'previous_avg': round(previous_avg, 2),
                            'recommendation': f'{metric_name}이(가) 하락하고 있습니다. 마케팅 전략 점검이 필요합니다.'
                        })

            # ROAS 계산 (7일)
            recent_roas_7d = (recent_7d['전환값_예측'].sum() / recent_7d['비용_예측'].sum() * 100) if recent_7d['비용_예측'].sum() > 0 else 0
            previous_roas_7d = (previous_7d['전환값_예측'].sum() / previous_7d['비용_예측'].sum() * 100) if previous_7d['비용_예측'].sum() > 0 else 0

            if previous_roas_7d > 0:
                roas_change = recent_roas_7d - previous_roas_7d
                roas_change_pct = (roas_change / previous_roas_7d) * 100

                if roas_change_pct > 20:
                    improvements_7d.append({
                        'metric': 'ROAS',
                        'period': '7d',
                        'improvement_level': 'high' if roas_change_pct > 30 else 'medium',
                        'change_pct': round(roas_change_pct, 2),
                        'recent_avg': round(recent_roas_7d, 2),
                        'previous_avg': round(previous_roas_7d, 2),
                        'recommendation': 'ROAS가 크게 개선되었습니다. 현재 캠페인 전략을 강화하세요.'
                    })
                elif roas_change_pct < -20:
                    declines_7d.append({
                        'metric': 'ROAS',
                        'period': '7d',
                        'risk_level': 'high' if roas_change_pct < -30 else 'medium',
                        'change_pct': round(roas_change_pct, 2),
                        'recent_avg': round(recent_roas_7d, 2),
                        'previous_avg': round(previous_roas_7d, 2),
                        'recommendation': 'ROAS가 하락하고 있습니다. 광고 효율성 점검이 필요합니다.'
                    })

        # 30일 비교
        if len(actual) >= 60:
            recent_30d = actual.tail(30)
            previous_30d = actual.iloc[-60:-30]

            for metric_name, col_name in metrics.items():
                if col_name not in actual.columns:
                    continue

                recent_avg = recent_30d[col_name].mean()
                previous_avg = previous_30d[col_name].mean()

                if previous_avg > 0:
                    change_pct = ((recent_avg - previous_avg) / previous_avg) * 100

                    if change_pct > 20:
                        improvements_30d.append({
                            'metric': metric_name,
                            'period': '30d',
                            'improvement_level': 'high' if change_pct > 30 else 'medium',
                            'change_pct': round(change_pct, 2),
                            'recent_avg': round(recent_avg, 2),
                            'previous_avg': round(previous_avg, 2),
                            'recommendation': f'{metric_name}이(가) 지속적으로 개선되고 있습니다. 장기 전략으로 확대하세요.'
                        })
                    elif change_pct < -20:
                        declines_30d.append({
                            'metric': metric_name,
                            'period': '30d',
                            'risk_level': 'high' if change_pct < -30 else 'medium',
                            'change_pct': round(change_pct, 2),
                            'recent_avg': round(recent_avg, 2),
                            'previous_avg': round(previous_avg, 2),
                            'recommendation': f'{metric_name}의 장기 하락 추세가 감지되었습니다. 전략 재검토가 필요합니다.'
                        })

            # ROAS 계산 (30일)
            recent_roas_30d = (recent_30d['전환값_예측'].sum() / recent_30d['비용_예측'].sum() * 100) if recent_30d['비용_예측'].sum() > 0 else 0
            previous_roas_30d = (previous_30d['전환값_예측'].sum() / previous_30d['비용_예측'].sum() * 100) if previous_30d['비용_예측'].sum() > 0 else 0

            if previous_roas_30d > 0:
                roas_change = recent_roas_30d - previous_roas_30d
                roas_change_pct = (roas_change / previous_roas_30d) * 100

                if roas_change_pct > 20:
                    improvements_30d.append({
                        'metric': 'ROAS',
                        'period': '30d',
                        'improvement_level': 'high' if roas_change_pct > 30 else 'medium',
                        'change_pct': round(roas_change_pct, 2),
                        'recent_avg': round(recent_roas_30d, 2),
                        'previous_avg': round(previous_roas_30d, 2),
                        'recommendation': 'ROAS의 장기 개선 추세가 확인되었습니다. 성공 전략을 확대 적용하세요.'
                    })
                elif roas_change_pct < -20:
                    declines_30d.append({
                        'metric': 'ROAS',
                        'period': '30d',
                        'risk_level': 'high' if roas_change_pct < -30 else 'medium',
                        'change_pct': round(roas_change_pct, 2),
                        'recent_avg': round(recent_roas_30d, 2),
                        'previous_avg': round(previous_roas_30d, 2),
                        'recommendation': 'ROAS의 장기 하락 추세가 심각합니다. 즉시 개선 조치가 필요합니다.'
                    })

        # insights에 추가
        self.insights['performance_trends'] = {
            'improvements_7d': improvements_7d,
            'improvements_30d': improvements_30d,
            'declines_7d': declines_7d,
            'declines_30d': declines_30d
        }

        print(f"   7-day improvements: {len(improvements_7d)}, declines: {len(declines_7d)}")
        print(f"   30-day improvements: {len(improvements_30d)}, declines: {len(declines_30d)}")

    def detect_alerts(self) -> None:
        """KPI 하락 경고 감지 (Financial Impact 포함)"""
        print("\n[3/6] Detecting alerts (Risk Management)...")

        alerts = []

        for segment_name, analysis in self.forecasts.items():
            for segment_value, data in analysis.items():
                changes = data['changes']
                actual_avg = data.get('actual_avg', {})
                forecast_avg = data.get('forecast_avg', {})

                # 전환수 하락 감지
                conv_change = changes.get('전환수', 0)
                if conv_change < -self.thresholds['decline_alert_pct']:
                    # 예상 손실 계산
                    actual_conv = actual_avg.get('전환수', 0) * 7  # 7일 기준
                    forecast_conv = forecast_avg.get('전환수', 0) * 7
                    loss_conversions = actual_conv - forecast_conv

                    alerts.append({
                        'type': 'conversion_decline',
                        'segment_type': segment_name,
                        'segment_value': segment_value,
                        'metric': '전환수',
                        'change_pct': conv_change,
                        'severity': 'high' if conv_change < -self.thresholds['critical_decline_pct'] else 'medium',
                        'title': FRIENDLY_TITLES['conversion_drop'].format(target=segment_value),
                        'message': f"다음 주 전환수가 {abs(conv_change):.1f}% 감소할 것으로 예상됩니다.",
                        'action': ACTION_GUIDES['conversion_drop'],
                        'financial_impact': f"예상 손실 전환: {int(loss_conversions):,}건"
                    })

                # 전환값(매출) 하락 감지
                rev_change = changes.get('전환값', 0)
                if rev_change < -self.thresholds['decline_alert_pct']:
                    # 예상 손실액 계산
                    actual_rev = actual_avg.get('전환값', 0) * 7
                    forecast_rev = forecast_avg.get('전환값', 0) * 7
                    loss_amount = actual_rev - forecast_rev

                    alerts.append({
                        'type': 'revenue_decline',
                        'segment_type': segment_name,
                        'segment_value': segment_value,
                        'metric': '전환값',
                        'change_pct': rev_change,
                        'severity': 'high' if rev_change < -self.thresholds['critical_decline_pct'] else 'medium',
                        'title': FRIENDLY_TITLES['revenue_drop'].format(target=segment_value),
                        'message': f"다음 주 매출이 {abs(rev_change):.1f}% 빠질 것으로 예상됩니다.",
                        'action': ACTION_GUIDES['conversion_drop'],
                        'financial_impact': f"예상 손실액: {format_currency(loss_amount)}",
                        'loss_amount': safe_float(loss_amount)
                    })

                # ROAS 하락 감지
                roas_change = data['forecast_roas'] - data['actual_roas']
                if roas_change < -self.thresholds['decline_alert_pct']:
                    alerts.append({
                        'type': 'roas_decline',
                        'segment_type': segment_name,
                        'segment_value': segment_value,
                        'metric': 'ROAS',
                        'change_pct': round(roas_change, 1),
                        'severity': 'high' if roas_change < -self.thresholds['critical_decline_pct'] else 'medium',
                        'title': FRIENDLY_TITLES['roas_drop'].format(target=segment_value),
                        'message': f"ROAS가 {data['actual_roas']:.0f}%에서 {data['forecast_roas']:.0f}%로 떨어질 전망입니다.",
                        'action': ACTION_GUIDES['roas_decline'],
                        'actual_roas': data['actual_roas'],
                        'forecast_roas': data['forecast_roas']
                    })

        # 심각도 순 정렬 (high > medium)
        alerts = sorted(alerts, key=lambda x: (x['severity'] == 'high', abs(x.get('change_pct', 0))), reverse=True)

        self.insights['segments']['alerts'] = alerts
        print(f"   Detected {len(alerts)} segment alerts (Risk signals)")

        for alert in alerts[:5]:  # 상위 5개만 출력
            print(f"      - {alert.get('title', alert['segment_value'])}: {alert['metric']} {alert['change_pct']:.1f}%")

    def find_opportunities(self) -> None:
        """숨은 기회 발굴 (Growth Hacking) - Financial Impact 포함"""
        print("\n[4/6] Finding opportunities (Growth Hacking)...")

        opportunities = []

        # 채널/상품/브랜드 포트폴리오 분석
        for segment_name in ['channel', 'product', 'brand']:
            if segment_name not in self.segment_stats:
                continue

            stats = self.segment_stats[segment_name]

            for segment_value, segment_data in stats.items():
                roas = segment_data.get('roas', 0)
                total_cost = segment_data.get('total_cost', 0)
                total_revenue = segment_data.get('total_revenue', 0)

                # 예측 데이터에서 트렌드 확인
                forecast_data = self.forecasts.get(segment_name, {}).get(segment_value, {})
                forecast_avg = forecast_data.get('forecast_avg', {})
                changes = forecast_data.get('changes', {})

                # ================================================================
                # Opportunity 1: High ROAS (Star/Cash Cow) - 강력 추천
                # ================================================================
                if roas > THRESHOLDS['high_roas']:
                    # 예상 추가 매출 (예산 20% 증액 시)
                    potential_uplift = total_revenue * 0.2  # 선형 가정

                    opportunities.append({
                        'type': 'scale_up',
                        'tag': FRIENDLY_TITLES['scale_up'],
                        'segment_type': segment_name,
                        'segment_value': segment_value,
                        'title': f"🚀 {segment_value}: 수익성 최고조!",
                        'message': f"예상 ROAS가 {roas:.0f}%로 매우 높습니다. 물 들어올 때 노 저으세요!",
                        'action': ACTION_GUIDES['opportunity'],
                        'financial_impact': f"예산 20% 증액 시, 약 {format_currency(potential_uplift)} 추가 매출 기대",
                        'potential_uplift': safe_float(potential_uplift),
                        'roas': roas,
                        'priority': 1
                    })

                # ================================================================
                # Opportunity 2: Hidden Gem (저예산 고효율) - 숨은 보석
                # ================================================================
                elif roas > THRESHOLDS['opportunity_roas'] and total_cost < 1000000:  # 100만원 미만
                    opportunities.append({
                        'type': 'hidden_gem',
                        'tag': FRIENDLY_TITLES['hidden_gem'],
                        'segment_type': segment_name,
                        'segment_value': segment_value,
                        'title': f"💎 숨은 보석 발견: {segment_value}",
                        'message': f"아직 예산은 {format_currency(total_cost)}이지만 ROAS {roas:.0f}%로 효율이 터지고 있어요!",
                        'action': ACTION_GUIDES['hidden_gem'],
                        'financial_impact': "예산 2배 증액 시, 매출 2배 성장 가능 (ROAS 유지 가정)",
                        'potential_uplift': safe_float(total_revenue),  # 2배 기대
                        'roas': roas,
                        'priority': 2
                    })

                # ================================================================
                # Opportunity 3: 성장 가속 (전환수 증가 + 양호한 ROAS)
                # ================================================================
                elif changes.get('전환수', 0) > THRESHOLDS['growth_star'] and roas > THRESHOLDS['low_roas']:
                    growth_pct = changes.get('전환수', 0)
                    opportunities.append({
                        'type': 'growth_momentum',
                        'tag': "📈 성장 모멘텀",
                        'segment_type': segment_name,
                        'segment_value': segment_value,
                        'title': f"📈 {segment_value}: 성장 가속 중!",
                        'message': f"전환수가 {growth_pct:.1f}% 증가하면서 ROAS {roas:.0f}%를 유지하고 있어요.",
                        'action': "현재 전략을 유지하고, 예산을 10% 증액하여 성장을 가속화하세요.",
                        'financial_impact': f"예상 추가 전환: {int(forecast_avg.get('전환수', 0) * 7 * 0.1):,}건/주",
                        'roas': roas,
                        'priority': 3
                    })

        # ROAS 높은 순 + 우선순위 순 정렬
        opportunities = sorted(opportunities, key=lambda x: (x.get('priority', 99), -x.get('roas', 0)))

        # 상위 5개만 저장
        self.insights['opportunities'] = opportunities[:5]
        print(f"   Found {len(opportunities)} opportunities (Growth signals)")

        for opp in opportunities[:3]:
            print(f"      - {opp.get('title', opp['segment_value'])}: ROAS {opp['roas']:.0f}%")

    def generate_recommendations(self) -> None:
        """투자 권장 세그먼트 도출 (Action-First)"""
        print("\n[5/6] Generating recommendations...")

        recommendations = []

        # 각 세그먼트 타입별로 권장 대상 도출
        for segment_name in ['channel', 'product', 'brand', 'promotion']:
            if segment_name not in self.segment_stats:
                continue

            stats = self.segment_stats[segment_name]

            # 효율성 기준 랭킹 (ROAS 기준)
            ranked = sorted(
                [(k, v) for k, v in stats.items() if v.get('roas', 0) > 0],
                key=lambda x: x[1]['roas'],
                reverse=True
            )

            if not ranked:
                continue

            # 상위 효율 세그먼트
            top_segment = ranked[0]
            segment_value = top_segment[0]
            segment_stats_data = top_segment[1]

            # 예측 데이터에서 트렌드 확인
            forecast_data = self.forecasts.get(segment_name, {}).get(segment_value, {})
            changes = forecast_data.get('changes', {})

            # 권장 이유 생성
            reasons = []
            if segment_stats_data['roas'] > 100:
                reasons.append(f"ROAS {segment_stats_data['roas']}%로 높은 효율")
            if segment_stats_data['cvr'] > 0:
                reasons.append(f"CVR {segment_stats_data['cvr']}%")
            if changes.get('전환수', 0) > 0:
                reasons.append(f"전환수 {changes['전환수']}% 증가 예상")

            # 권장 액션 결정
            if changes.get('전환수', 0) >= 0 and segment_stats_data['roas'] > 100:
                action = '예산 20% 증액'
                expected_impact = '전환수 15-20% 증가 예상'
            elif segment_stats_data['roas'] > 200:
                action = '예산 30% 증액'
                expected_impact = '전환값 25-30% 증가 예상'
            else:
                action = '예산 유지 및 모니터링'
                expected_impact = '현 성과 유지'

            recommendations.append({
                'priority': len(recommendations) + 1,
                'action': action,
                'target': {
                    'type': segment_name,
                    'value': segment_value
                },
                'reasons': reasons,
                'expected_impact': expected_impact,
                'metrics': {
                    'roas': segment_stats_data['roas'],
                    'cvr': segment_stats_data['cvr'],
                    'cpa': segment_stats_data['cpa']
                }
            })

        self.insights['segments']['recommendations'] = recommendations
        print(f"   Generated {len(recommendations)} segment recommendations")

        for rec in recommendations:
            print(f"      - {rec['target']['type']}/{rec['target']['value']}: {rec['action']}")

    def generate_summary(self) -> None:
        """자연어 요약 생성 (AI 컨설턴트 톤)"""
        print("\n[6/6] Generating natural language summary...")

        alerts = self.insights['segments']['alerts']
        recommendations = self.insights['segments']['recommendations']
        opportunities = self.insights.get('opportunities', [])
        overall = self.insights.get('overall', {})

        # 요약 텍스트 생성
        summary_parts = []

        # Overall 성과 요약
        if 'current_period' in overall:
            current = overall['current_period']
            summary_parts.append(
                f"📊 전체 성과 ({current['start_date']} ~ {current['end_date']}): "
                f"ROAS {current['roas']}%, 전환수 {int(current['total_conversions'])}, "
                f"전환값 {int(current['total_revenue']):,}원"
            )

        if 'trend' in overall:
            trend = overall['trend']
            if trend['direction'] == 'improving':
                summary_parts.append(f"📈 트렌드: ROAS {trend['roas_change']:+.1f}%p 개선 예상")
            elif trend['direction'] == 'declining':
                summary_parts.append(f"📉 트렌드: ROAS {trend['roas_change']:+.1f}%p 하락 예상")
            else:
                summary_parts.append(f"➡️ 트렌드: 안정적 유지")

        # Overall alerts
        if 'alerts' in overall and overall['alerts']:
            for alert in overall['alerts']:
                summary_parts.append(f"⚠️ {alert['message']}")

        summary_parts.append("")  # 빈 줄

        # 세그먼트 경고 요약
        if alerts:
            high_alerts = [a for a in alerts if a['severity'] == 'high']
            if high_alerts:
                alert = high_alerts[0]
                summary_parts.append(
                    f"🚨 주의: {alert['segment_type']} '{alert['segment_value']}'의 "
                    f"{alert['metric']}이(가) {abs(alert['change_pct'])}% 하락할 것으로 예측됩니다."
                )

        # 권장 요약
        if recommendations:
            rec = recommendations[0]
            reasons_text = ', '.join(rec['reasons'][:2]) if rec['reasons'] else '높은 효율성'
            summary_parts.append(
                f"💡 권장: {rec['target']['type']} '{rec['target']['value']}'에 "
                f"{rec['action']}을 권장합니다. ({reasons_text})"
            )
            summary_parts.append(f"   예상 효과: {rec['expected_impact']}")

        # 추가 인사이트
        if len(recommendations) > 1:
            other_targets = [f"{r['target']['value']}" for r in recommendations[1:3]]
            if other_targets:
                summary_parts.append(
                    f"🔍 추가 검토 대상: {', '.join(other_targets)}"
                )

        # 요약이 없는 경우
        if not alerts and not recommendations:
            summary_parts.append("✅ 현재 모든 세그먼트가 안정적으로 운영되고 있습니다.")
            summary_parts.append("   지속적인 모니터링을 권장합니다.")

        self.insights['summary'] = '\n'.join(summary_parts)
        self.insights['details'] = {
            'total_segment_alerts': len(alerts),
            'high_severity_alerts': len([a for a in alerts if a['severity'] == 'high']),
            'total_overall_alerts': len(overall.get('alerts', [])),
            'total_recommendations': len(recommendations),
            'analyzed_segments': {
                name: len(data) for name, data in self.forecasts.items()
            },
            'overall_roas': overall.get('current_period', {}).get('roas', 0),
            'forecast_roas': overall.get('forecast_period', {}).get('roas', 0)
        }

        print(f"\n   Summary:")
        for line in summary_parts:
            print(f"      {line}")

    def convert_to_native_types(self, obj):
        """pandas 타입을 Python 네이티브 타입으로 변환"""
        if isinstance(obj, dict):
            return {key: self.convert_to_native_types(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self.convert_to_native_types(item) for item in obj]
        elif isinstance(obj, (np.int64, np.int32)):
            return int(obj)
        elif isinstance(obj, (np.float64, np.float32)):
            return float(obj)
        elif pd.isna(obj):
            return None
        else:
            return obj

    def save_insights(self) -> None:
        """인사이트 저장 (NpEncoder로 안전한 JSON 직렬화)"""
        output_file = FORECAST_DIR / 'insights.json'

        # pandas 타입을 Python 네이티브 타입으로 변환 후 NpEncoder로 저장
        insights_converted = self.convert_to_native_types(self.insights)

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(insights_converted, f, cls=NpEncoder, ensure_ascii=False, indent=2)

        print(f"\n   ✅ Saved: {output_file.name}")

    def generate(self, save: bool = True) -> Dict[str, Any]:
        """전체 인사이트 생성 실행

        Args:
            save: True면 JSON 파일 저장, False면 저장 안 함 (래퍼 스크립트용)
        """
        # 데이터 로드
        if not self.load_data():
            return self.insights

        # 예측 분석
        self.analyze_forecasts()

        # 전체 성과 분석 (predictions_*.csv)
        self.analyze_overall()

        # 성과 트렌드 분석 (7일/30일)
        self.analyze_performance_trends()

        # 경고 감지 (Risk Management)
        self.detect_alerts()

        # 기회 발굴 (Growth Hacking)
        self.find_opportunities()

        # 권장 생성
        self.generate_recommendations()

        # 요약 생성
        self.generate_summary()

        # 저장 (옵션)
        if save:
            self.save_insights()

        period_display = "전체" if self.days is None else f"최근 {self.days}일"
        print("\n" + "="*60)
        print(f"🎯 AI Marketing Insight Generator v2.1 완료! ({period_display})")
        print("="*60)
        print("\n[v2.1 신규 기능]")
        print("   ✓ Multi-Period 지원: --days 파라미터로 기간 필터링")
        print("   ✓ AI Consultant Persona: 친화적이고 직관적인 메시지")
        print("   ✓ Action-First Architecture: 즉시 실행 가능한 액션")
        print("   ✓ Financial Impact: 예상 손실액/기대 수익 계산")
        print("   ✓ Risk & Opportunity Matrix: 방어/공격 전략 동시 수립")
        print(f"\n📁 Generated file: data/forecast/insights.json")
        print("\n📊 Insight structure:")
        print("   - period: 분석 기간")
        print("   - summary_card: AI 비서 스타일 요약 카드")
        print("   - overall: 전체 성과 분석")
        print("   - segments: 세그먼트별 경고 및 추천")
        print("   - opportunities: 숨은 기회 발굴")
        print("   - performance_trends: 7d/30d 트렌드")

        return self.insights


def main():
    """메인 실행 함수 (커맨드라인 인자 지원)"""
    parser = argparse.ArgumentParser(
        description='마케팅 인사이트 생성 모듈 v2.1 (Multi-Period 지원)'
    )
    parser.add_argument(
        '--days',
        type=int,
        choices=[180, 90, 30],
        default=None,
        help='분석 기간 (일 수). 미지정시 전체 기간 분석. 예: --days 30'
    )

    args = parser.parse_args()

    generator = InsightGenerator(days=args.days)

    try:
        insights = generator.generate()

        # 최종 요약 출력
        print("\n" + "="*60)
        print("MARKETING INSIGHTS SUMMARY")
        print("="*60)
        print(insights['summary'])

    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
