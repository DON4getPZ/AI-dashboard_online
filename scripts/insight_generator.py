"""
마케팅 인사이트 생성 모듈 v1.0

기능:
1. 세그먼트별 예측 데이터 분석
2. KPI 하락 예측 감지
3. 최적 투자 대상 추천 (효율성/성장성/안정성 기반)
4. 자연어 인사이트 생성
5. data/forecast/insights.json 저장

의존성:
- segment_processor.py가 먼저 실행되어야 함
- data/forecast/segment_*.csv 파일 필요
- data/forecast/segment_stats.json 파일 필요
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Tuple
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


class InsightGenerator:
    """마케팅 인사이트 생성 클래스"""

    def __init__(self):
        """초기화"""
        self.segment_data = {}
        self.segment_stats = {}
        self.forecasts = {}
        self.insights = {
            'generated_at': datetime.now().isoformat(),
            'alerts': [],
            'recommendations': [],
            'summary': '',
            'details': {}
        }

        # KPI 임계값 설정
        self.thresholds = {
            'decline_alert_pct': 10,  # 10% 이상 하락 시 경고
            'efficiency_top_pct': 20,  # 상위 20% 효율
            'growth_threshold': 0,  # 성장률 임계값
            'stability_cv': 0.3  # 변동계수 임계값
        }

    def load_data(self) -> bool:
        """세그먼트 데이터 로드"""
        print("\n" + "="*60)
        print("Insight Generator v1.0")
        print("="*60)
        print("\n[1/5] Loading segment data...")

        # 세그먼트별 예측 데이터 로드
        segment_files = {
            'brand': FORECAST_DIR / 'segment_brand.csv',
            'channel': FORECAST_DIR / 'segment_channel.csv',
            'product': FORECAST_DIR / 'segment_product.csv'
        }

        loaded_count = 0
        for name, filepath in segment_files.items():
            if filepath.exists():
                self.segment_data[name] = pd.read_csv(filepath, encoding='utf-8')
                loaded_count += 1
                print(f"   Loaded: {filepath.name}")
            else:
                print(f"   Warning: {filepath.name} not found")

        # 세그먼트 통계 로드
        stats_file = FORECAST_DIR / 'segment_stats.json'
        if stats_file.exists():
            with open(stats_file, 'r', encoding='utf-8') as f:
                self.segment_stats = json.load(f)
            print(f"   Loaded: {stats_file.name}")
        else:
            print(f"   Warning: {stats_file.name} not found")

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

    def detect_alerts(self) -> None:
        """KPI 하락 경고 감지"""
        print("\n[3/5] Detecting alerts...")

        alerts = []

        for segment_name, analysis in self.forecasts.items():
            for segment_value, data in analysis.items():
                changes = data['changes']

                # 전환수 하락 감지
                if changes.get('전환수', 0) < -self.thresholds['decline_alert_pct']:
                    alerts.append({
                        'type': 'conversion_decline',
                        'segment_type': segment_name,
                        'segment_value': segment_value,
                        'metric': '전환수',
                        'change_pct': changes['전환수'],
                        'severity': 'high' if changes['전환수'] < -20 else 'medium'
                    })

                # 전환값 하락 감지
                if changes.get('전환값', 0) < -self.thresholds['decline_alert_pct']:
                    alerts.append({
                        'type': 'revenue_decline',
                        'segment_type': segment_name,
                        'segment_value': segment_value,
                        'metric': '전환값',
                        'change_pct': changes['전환값'],
                        'severity': 'high' if changes['전환값'] < -20 else 'medium'
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
                        'severity': 'high' if roas_change < -20 else 'medium'
                    })

        self.insights['alerts'] = alerts
        print(f"   Detected {len(alerts)} alerts")

        for alert in alerts[:5]:  # 상위 5개만 출력
            print(f"      - {alert['segment_type']}/{alert['segment_value']}: "
                  f"{alert['metric']} {alert['change_pct']}%")

    def generate_recommendations(self) -> None:
        """투자 권장 세그먼트 도출"""
        print("\n[4/5] Generating recommendations...")

        recommendations = []

        # 각 세그먼트 타입별로 권장 대상 도출
        for segment_name in ['channel', 'product', 'brand']:
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

        self.insights['recommendations'] = recommendations
        print(f"   Generated {len(recommendations)} recommendations")

        for rec in recommendations:
            print(f"      - {rec['target']['type']}/{rec['target']['value']}: {rec['action']}")

    def generate_summary(self) -> None:
        """자연어 요약 생성"""
        print("\n[5/5] Generating natural language summary...")

        alerts = self.insights['alerts']
        recommendations = self.insights['recommendations']

        # 요약 텍스트 생성
        summary_parts = []

        # 경고 요약
        if alerts:
            high_alerts = [a for a in alerts if a['severity'] == 'high']
            if high_alerts:
                alert = high_alerts[0]
                summary_parts.append(
                    f"주의: {alert['segment_type']} '{alert['segment_value']}'의 "
                    f"{alert['metric']}이(가) {abs(alert['change_pct'])}% 하락할 것으로 예측됩니다."
                )

        # 권장 요약
        if recommendations:
            rec = recommendations[0]
            reasons_text = ', '.join(rec['reasons'][:2]) if rec['reasons'] else '높은 효율성'
            summary_parts.append(
                f"권장: {rec['target']['type']} '{rec['target']['value']}'에 "
                f"{rec['action']}을 권장합니다. ({reasons_text})"
            )
            summary_parts.append(f"예상 효과: {rec['expected_impact']}")

        # 추가 인사이트
        if len(recommendations) > 1:
            other_targets = [f"{r['target']['value']}" for r in recommendations[1:3]]
            if other_targets:
                summary_parts.append(
                    f"추가 검토 대상: {', '.join(other_targets)}"
                )

        # 요약이 없는 경우
        if not summary_parts:
            summary_parts.append("현재 모든 세그먼트가 안정적으로 운영되고 있습니다.")
            summary_parts.append("지속적인 모니터링을 권장합니다.")

        self.insights['summary'] = '\n'.join(summary_parts)
        self.insights['details'] = {
            'total_alerts': len(alerts),
            'high_severity_alerts': len([a for a in alerts if a['severity'] == 'high']),
            'total_recommendations': len(recommendations),
            'analyzed_segments': {
                name: len(data) for name, data in self.forecasts.items()
            }
        }

        print(f"\n   Summary:")
        for line in summary_parts:
            print(f"      {line}")

    def save_insights(self) -> None:
        """인사이트 저장"""
        output_file = FORECAST_DIR / 'insights.json'

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.insights, f, ensure_ascii=False, indent=2)

        print(f"\n   Saved: {output_file.name}")

    def generate(self) -> Dict[str, Any]:
        """전체 인사이트 생성 실행"""
        # 데이터 로드
        if not self.load_data():
            return self.insights

        # 예측 분석
        self.analyze_forecasts()

        # 경고 감지
        self.detect_alerts()

        # 권장 생성
        self.generate_recommendations()

        # 요약 생성
        self.generate_summary()

        # 저장
        self.save_insights()

        print("\n" + "="*60)
        print("Insight generation completed successfully!")
        print("="*60)
        print("\nGenerated file:")
        print("   - data/forecast/insights.json")

        return self.insights


def main():
    """메인 실행 함수"""
    generator = InsightGenerator()

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
