"""
Type 분석 인사이트 생성 - 다중 기간 버전

3개 기간(전체, 180일, 90일)의 인사이트를 중첩 구조로 생성합니다.
각 기간별로 Prophet 예측을 새로 생성합니다 (기간별 학습 데이터 사용).
분기별 추이(seasonality)는 전체 기간 데이터만 사용합니다.

사용법:
    python scripts/generate_type_insights_multiperiod.py
"""

import pandas as pd
import numpy as np
import json
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

# 기간 설정 (365일, 180일, 90일 - 30일 제외)
PERIODS = [
    {'key': 'full', 'days': 0, 'label': '전체 기간'},
    {'key': '180d', 'days': 180, 'label': '최근 180일'},
    {'key': '90d', 'days': 90, 'label': '최근 90일'}
]

# 경로 설정
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / 'data' / 'type'
INSIGHTS_SCRIPT = SCRIPT_DIR / 'generate_type_insights.py'
PROPHET_SCRIPT = SCRIPT_DIR / 'multi_analysis_prophet_forecast.py'

def run_prophet_forecast(days):
    """기간별 Prophet 예측 생성"""
    cmd = [sys.executable, str(PROPHET_SCRIPT)]
    if days > 0:
        cmd.extend(['--days', str(days)])
    cmd.extend(['--output-days', '30'])  # 모든 기간에서 30일 예측

    print(f"\n  [Prophet] 학습 데이터: {'전체(365일)' if days == 0 else f'최근 {days}일'}, 예측: 30일")

    result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')

    if result.returncode != 0:
        print(f"  [Prophet] 오류 발생: {result.stderr[:500] if result.stderr else 'Unknown error'}")
        return False

    print(f"  [Prophet] 완료")
    return True


def run_insights_generation(days, output_suffix):
    """generate_type_insights.py를 특정 기간으로 실행"""
    cmd = [sys.executable, str(INSIGHTS_SCRIPT)]
    if days > 0:
        cmd.extend(['--days', str(days)])

    print(f"\n{'='*60}")
    print(f"기간: {output_suffix} (--days {days})")
    print('='*60)

    # 1. Prophet 예측 먼저 생성 (기간별 학습 데이터 사용)
    print("\n  [Step 1] Prophet 예측 생성 중...")
    prophet_success = run_prophet_forecast(days)
    if not prophet_success:
        print("  [Warning] Prophet 예측 생성 실패, 인사이트 생성 계속 진행")

    # 2. Insights 생성
    print("\n  [Step 2] 인사이트 생성 중...")
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

def main():
    print("=" * 100)
    print("다중 기간 인사이트 생성 (중첩 구조)")
    print("=" * 100)
    print(f"생성일: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"기간: {', '.join([p['label'] for p in PERIODS])}")

    # 각 기간별 인사이트 생성
    period_insights = {}
    seasonality_data = None

    for period in PERIODS:
        print(f"\n\n{'#'*100}")
        print(f"# {period['label']} 데이터 생성 중...")
        print('#'*100)

        insights = run_insights_generation(period['days'], period['key'])

        if insights:
            # 전체 기간에서 seasonality 데이터 저장 (분기별 추이용)
            if period['key'] == 'full':
                seasonality_data = {
                    'seasonality_analysis': insights.get('seasonality_analysis', {}),
                    'seasonality_insights': insights.get('seasonality_insights', [])
                }

            # 기간별 데이터 저장 (seasonality 제외)
            period_data = {k: v for k, v in insights.items()
                          if k not in ['seasonality_analysis', 'seasonality_insights']}
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
        'seasonality': seasonality_data,  # 분기별 추이는 전체 기간 데이터만 사용
        'generated_at': datetime.now().isoformat(),
        'available_periods': [{'key': p['key'], 'label': p['label']} for p in PERIODS]
    }

    # 최종 JSON 저장
    output_file = DATA_DIR / 'insights.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(combined_insights, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 100)
    print("다중 기간 인사이트 생성 완료!")
    print("=" * 100)
    print(f"\n✓ 저장 위치: {output_file}")
    print(f"✓ 포함 기간: {len(period_insights)}개")
    for key, data in period_insights.items():
        period_info = data.get('period_info', {})
        summary = data.get('summary', {})
        analysis_period = summary.get('analysis_period', {})
        print(f"  - {period_info.get('label', key)}: {analysis_period.get('start_date', 'N/A')} ~ {analysis_period.get('end_date', 'N/A')}")

    print(f"\n✓ 분기별 추이: 전체 기간 데이터 사용")

    return combined_insights

if __name__ == '__main__':
    main()
