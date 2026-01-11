"""
퍼널 분석 인사이트 생성 - 다중 기간 버전

4개 기간(전체, 180일, 90일, 30일)의 인사이트를 중첩 구조로 생성합니다.
이탈 예측(churn) 분석은 전체 기간 데이터만 사용합니다.

사용법:
    python scripts/generate_funnel_data_multiperiod.py
    python scripts/generate_funnel_data_multiperiod.py --client clientA
    python scripts/generate_funnel_data_multiperiod.py --category fashion
"""

import pandas as pd
import numpy as np
import json
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

# 프로젝트 루트를 path에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.common.paths import ClientPaths, parse_client_arg

# 기간 설정
PERIODS = [
    {'key': 'full', 'days': 0, 'label': '전체 기간'},
    {'key': '180d', 'days': 180, 'label': '최근 180일'},
    {'key': '90d', 'days': 90, 'label': '최근 90일'},
    {'key': '30d', 'days': 30, 'label': '최근 30일'}
]

# 경로 설정
SCRIPT_DIR = Path(__file__).parent
INSIGHTS_SCRIPT = SCRIPT_DIR / 'generate_funnel_data.py'


def get_data_dir(client_id: Optional[str] = None) -> Path:
    """클라이언트별 데이터 디렉토리 반환"""
    if client_id:
        return ClientPaths(client_id).funnel
    return SCRIPT_DIR.parent / 'data' / 'funnel'


def run_insights_generation(days, category='default', client_id: Optional[str] = None):
    """generate_funnel_data.py를 특정 기간으로 실행"""
    cmd = [sys.executable, str(INSIGHTS_SCRIPT), '--days', str(days)]
    if client_id:
        cmd.extend(['--client', client_id])
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
    data_dir = get_data_dir(client_id)
    insights_file = data_dir / 'insights.json'
    if insights_file.exists():
        with open(insights_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None


def main(category='default', client_id: Optional[str] = None):
    print("=" * 100)
    print("다중 기간 퍼널 인사이트 생성 (중첩 구조)")
    if client_id:
        print(f"클라이언트: {client_id}")
    print("=" * 100)
    print(f"생성일: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"카테고리: {category}")
    print(f"기간: {', '.join([p['label'] for p in PERIODS])}")

    # 각 기간별 인사이트 생성
    period_insights = {}
    churn_data = None
    crm_actions_by_period = {}  # 기간별 CRM 액션 (추이 분석 기반)
    crm_actions_by_trend = None  # 전체 기간에서 추출한 추이 분석 결과

    for period in PERIODS:
        print(f"\n\n{'#'*100}")
        print(f"# {period['label']} 데이터 생성 중...")
        print('#'*100)

        insights = run_insights_generation(period['days'], category, client_id)

        if insights:
            # 전체 기간에서 churn 데이터 및 추이 분석 결과 저장
            if period['key'] == 'full':
                churn_data = {
                    'churn_predictions_7d': insights.get('churn_predictions_7d', []),
                    'churn_predictions_30d': insights.get('churn_predictions_30d', []),
                    'improvement_predictions_7d': insights.get('improvement_predictions_7d', []),
                    'improvement_predictions_30d': insights.get('improvement_predictions_30d', [])
                }
                # 추이 분석 결과 저장 (전체 기간에서만 생성됨)
                crm_actions_by_trend = insights.get('crm_actions_by_trend', {})

            # 기간별 데이터 저장 (churn 관련 데이터 제외, crm_actions는 별도 관리)
            period_data = {k: v for k, v in insights.items()
                          if k not in ['churn_predictions_7d', 'churn_predictions_30d',
                                       'improvement_predictions_7d', 'improvement_predictions_30d',
                                       'crm_actions', 'crm_actions_by_trend', 'churn_predictions']}
            period_data['period_info'] = {
                'key': period['key'],
                'days': period['days'],
                'label': period['label']
            }
            period_insights[period['key']] = period_data

            print(f"✓ {period['label']} 완료")
        else:
            print(f"✗ {period['label']} 실패")

    # CRM 액션을 추이 분석 기반으로 구성 (시점 간 비교)
    # 전체 데이터에서 d_day vs d_day-N 방식으로 분석된 결과 사용
    if crm_actions_by_trend:
        for period in PERIODS:
            period_key = period['key']
            crm_actions_by_period[period_key] = {
                'period_label': period['label'],
                'analysis_method': f"d_day vs d_day-{period['days']}d (주간 평균)" if period['days'] > 0 else "30일 전 대비 추이",
                'crm_actions': crm_actions_by_trend.get(period_key, [])
            }
        print(f"\n✓ CRM 추이 분석 완료 (시점 간 비교 방식)")
    else:
        # fallback: 추이 분석 결과가 없는 경우
        for period in PERIODS:
            crm_actions_by_period[period['key']] = {
                'period_label': period['label'],
                'crm_actions': []
            }

    # 중첩 구조로 결합
    combined_insights = {
        'by_period': period_insights,
        'churn_analysis': churn_data,  # 이탈 분석은 전체 기간 데이터만 사용
        'crm_actions_by_period': crm_actions_by_period,  # 기간별 CRM 액션
        'generated_at': datetime.now().isoformat(),
        'available_periods': [{'key': p['key'], 'label': p['label']} for p in PERIODS]
    }

    # 최종 JSON 저장
    data_dir = get_data_dir(client_id)
    data_dir.mkdir(parents=True, exist_ok=True)
    output_file = data_dir / 'insights.json'
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

    print(f"\n✓ CRM 액션 (시점 간 추이 분석):")
    print(f"  분석 방식: d_day (최근 7일 평균) vs d_day-N (N일 전 7일 평균)")
    for period_key, crm_data in crm_actions_by_period.items():
        crm_count = len(crm_data.get('crm_actions', []))
        period_label = crm_data.get('period_label', period_key)
        method = crm_data.get('analysis_method', '')
        print(f"  - {period_label}: {crm_count}건 ({method})")

    return combined_insights


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='다중 기간 퍼널 인사이트 생성')
    parser.add_argument('--client', type=str, default=None,
                        help='클라이언트 ID (멀티클라이언트 모드)')
    parser.add_argument('--category', type=str, default='default',
                        help='비즈니스 카테고리 (default/fashion/food/electronics)')
    args = parser.parse_args()

    main(category=args.category, client_id=args.client)
