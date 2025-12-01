"""
퍼널 분석 인사이트 생성 - 다중 기간 버전

4개 기간(전체, 180일, 90일, 30일)의 인사이트를 중첩 구조로 생성합니다.
이탈 예측(churn) 분석은 전체 기간 데이터만 사용합니다.

사용법:
    python scripts/generate_funnel_data_multiperiod.py
    python scripts/generate_funnel_data_multiperiod.py --category fashion
"""

import pandas as pd
import numpy as np
import json
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

# 기간 설정
PERIODS = [
    {'key': 'full', 'days': 0, 'label': '전체 기간'},
    {'key': '180d', 'days': 180, 'label': '최근 180일'},
    {'key': '90d', 'days': 90, 'label': '최근 90일'},
    {'key': '30d', 'days': 30, 'label': '최근 30일'}
]

# 경로 설정
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / 'data' / 'funnel'
INSIGHTS_SCRIPT = SCRIPT_DIR / 'generate_funnel_data.py'


def run_insights_generation(days, category='default'):
    """generate_funnel_data.py를 특정 기간으로 실행"""
    cmd = [sys.executable, str(INSIGHTS_SCRIPT), '--days', str(days)]
    if category and category != 'default':
        cmd.extend(['--category', category])

    print(f"\n{'='*60}")
    print(f"기간: {'전체' if days == 0 else f'{days}일'} (--days {days})")
    print('='*60)

    result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')

    if result.returncode != 0:
        print(f"오류 발생: {result.stderr}")
        return None

    # 생성된 insights.json 로드
    insights_file = DATA_DIR / 'insights.json'
    if insights_file.exists():
        with open(insights_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None


def main(category='default'):
    print("=" * 100)
    print("다중 기간 퍼널 인사이트 생성 (중첩 구조)")
    print("=" * 100)
    print(f"생성일: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"카테고리: {category}")
    print(f"기간: {', '.join([p['label'] for p in PERIODS])}")

    # 각 기간별 인사이트 생성
    period_insights = {}
    churn_data = None

    for period in PERIODS:
        print(f"\n\n{'#'*100}")
        print(f"# {period['label']} 데이터 생성 중...")
        print('#'*100)

        insights = run_insights_generation(period['days'], category)

        if insights:
            # 전체 기간에서 churn 데이터 저장 (이탈 예측용)
            if period['key'] == 'full':
                churn_data = {
                    'churn_predictions_7d': insights.get('churn_predictions_7d', []),
                    'churn_predictions_30d': insights.get('churn_predictions_30d', []),
                    'improvement_predictions_7d': insights.get('improvement_predictions_7d', []),
                    'improvement_predictions_30d': insights.get('improvement_predictions_30d', []),
                    'crm_actions': insights.get('crm_actions', [])
                }

            # 기간별 데이터 저장 (churn 관련 데이터 제외)
            period_data = {k: v for k, v in insights.items()
                          if k not in ['churn_predictions_7d', 'churn_predictions_30d',
                                       'improvement_predictions_7d', 'improvement_predictions_30d',
                                       'crm_actions', 'churn_predictions']}
            period_data['period_info'] = {
                'key': period['key'],
                'days': period['days'],
                'label': period['label']
            }
            period_insights[period['key']] = period_data

            print(f"✓ {period['label']} 완료")
        else:
            print(f"✗ {period['label']} 실패")

    # 중첩 구조로 결합
    combined_insights = {
        'by_period': period_insights,
        'churn_analysis': churn_data,  # 이탈 분석은 전체 기간 데이터만 사용
        'generated_at': datetime.now().isoformat(),
        'available_periods': [{'key': p['key'], 'label': p['label']} for p in PERIODS]
    }

    # 최종 JSON 저장
    output_file = DATA_DIR / 'insights.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(combined_insights, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 100)
    print("다중 기간 퍼널 인사이트 생성 완료!")
    print("=" * 100)
    print(f"\n✓ 저장 위치: {output_file}")
    print(f"✓ 포함 기간: {len(period_insights)}개")
    for key, data in period_insights.items():
        period_info = data.get('period_info', {})
        overall = data.get('overall', {})
        current = overall.get('current_period', {})
        print(f"  - {period_info.get('label', key)}: {current.get('start_date', 'N/A')} ~ {current.get('end_date', 'N/A')}")

    print(f"\n✓ 이탈 분석: 전체 기간 데이터 사용")
    if churn_data:
        print(f"  - 7일 이탈 위험: {len(churn_data.get('churn_predictions_7d', []))}건")
        print(f"  - 30일 이탈 위험: {len(churn_data.get('churn_predictions_30d', []))}건")
        print(f"  - CRM 액션: {len(churn_data.get('crm_actions', []))}건")

    return combined_insights


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='다중 기간 퍼널 인사이트 생성')
    parser.add_argument('--category', type=str, default='default',
                        help='비즈니스 카테고리 (default/fashion/food/electronics)')
    args = parser.parse_args()

    main(category=args.category)
