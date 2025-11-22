# -*- coding: utf-8 -*-
"""
채널별 참여도 및 재방문율 분석 데이터 생성 스크립트
"""

import pandas as pd
import numpy as np
from pathlib import Path

# 데이터 경로 설정 (scripts 디렉토리에서 상위의 data 디렉토리 참조)
BASE_DIR = Path(__file__).parent.parent / 'data'
GA4_FILE = BASE_DIR / 'GA4' / '2025-11.csv'
NEW_VS_RETURNING_FILE = BASE_DIR / 'funnel' / 'new_vs_returning.csv'
CHANNEL_FUNNEL_FILE = BASE_DIR / 'funnel' / 'channel_funnel.csv'

# 출력 파일 경로
OUTPUT_ENGAGEMENT = BASE_DIR / 'funnel' / 'channel_engagement.csv'
OUTPUT_NEW_VS_RETURNING_CVR = BASE_DIR / 'funnel' / 'new_vs_returning_conversion.csv'

def generate_channel_engagement_data():
    """
    채널별 참여도 및 재방문율 데이터 생성
    - Sessions, Engaged sessions, Avg session duration, Bounce rate
    - Return rate (100 - New user %)
    """
    print("=== 채널별 참여도 데이터 생성 시작 ===")

    # GA4 데이터 로드
    print(f"GA4 데이터 로드 중: {GA4_FILE}")
    ga4_df = pd.read_csv(GA4_FILE, encoding='utf-8-sig')

    # new_vs_returning 데이터 로드 (재방문율 계산용)
    print(f"재방문 데이터 로드 중: {NEW_VS_RETURNING_FILE}")
    nvr_df = pd.read_csv(NEW_VS_RETURNING_FILE, encoding='utf-8-sig')

    # 채널별로 집계
    print("채널별 집계 중...")

    # GA4 데이터에서 채널별 참여도 지표 계산
    channel_stats = ga4_df.groupby('channel').agg({
        'Sessions': 'sum',
        'Engaged sessions': 'sum',
        'Average session duration': 'mean',
        'Bounce rate': 'mean',
        'Total users': 'sum',
        'New users': 'sum'
    }).reset_index()

    # 참여율 계산 (Engaged sessions / Total sessions * 100)
    channel_stats['Engagement rate'] = (
        channel_stats['Engaged sessions'] / channel_stats['Sessions'] * 100
    ).round(2)

    # 재방문율 계산 (100 - New user %)
    channel_stats['New user %'] = (
        channel_stats['New users'] / channel_stats['Total users'] * 100
    ).round(2)
    channel_stats['Return rate'] = (100 - channel_stats['New user %']).round(2)

    # 세션 시간을 초 단위로 반올림
    channel_stats['Average session duration'] = channel_stats['Average session duration'].round(1)

    # Bounce rate를 퍼센트로 변환 (이미 0-1 사이 값이므로 100을 곱함)
    channel_stats['Bounce rate'] = (channel_stats['Bounce rate'] * 100).round(2)

    # 필요한 컬럼만 선택
    result = channel_stats[[
        'channel',
        'Sessions',
        'Engaged sessions',
        'Engagement rate',
        'Average session duration',
        'Bounce rate',
        'Return rate'
    ]]

    # CSV 저장
    print(f"데이터 저장 중: {OUTPUT_ENGAGEMENT}")
    result.to_csv(OUTPUT_ENGAGEMENT, index=False, encoding='utf-8-sig')
    print(f"✓ 채널별 참여도 데이터 생성 완료: {len(result)}개 채널")
    print(f"\n생성된 데이터 샘플:")
    print(result.head())

    return result


def generate_new_vs_returning_conversion():
    """
    신규 vs 재방문 고객의 퍼널 단계별 전환율 비교 데이터 생성
    """
    print("\n=== 신규 vs 재방문 고객 전환율 비교 데이터 생성 시작 ===")

    # new_vs_returning 데이터 로드
    print(f"재방문 데이터 로드 중: {NEW_VS_RETURNING_FILE}")
    nvr_df = pd.read_csv(NEW_VS_RETURNING_FILE, encoding='utf-8-sig')

    print(f"데이터 행 수: {len(nvr_df)}")
    print(f"컬럼: {nvr_df.columns.tolist()}")

    # 퍼널 단계별로 신규/재방문 고객 수 집계
    funnel_stages = ['유입', '활동', '관심', '결제진행', '구매완료']

    results = []

    for stage in funnel_stages:
        stage_data = nvr_df[nvr_df['funnel'] == stage]

        if len(stage_data) == 0:
            print(f"경고: {stage} 단계 데이터 없음")
            continue

        total_users = stage_data['Total users'].sum()
        new_users = stage_data['New users'].sum()
        returning_users = stage_data['Returning users'].sum()

        results.append({
            'funnel_stage': stage,
            'Total users': total_users,
            'New users': new_users,
            'Returning users': returning_users,
            'New user %': round(new_users / total_users * 100, 2) if total_users > 0 else 0,
            'Returning user %': round(returning_users / total_users * 100, 2) if total_users > 0 else 0
        })

    result_df = pd.DataFrame(results)

    # 전환율 계산 (각 단계 / 유입 단계)
    if len(result_df) > 0:
        acquisition_new = result_df[result_df['funnel_stage'] == '유입']['New users'].values[0]
        acquisition_returning = result_df[result_df['funnel_stage'] == '유입']['Returning users'].values[0]

        result_df['New user CVR'] = (
            result_df['New users'] / acquisition_new * 100
        ).round(2) if acquisition_new > 0 else 0

        result_df['Returning user CVR'] = (
            result_df['Returning users'] / acquisition_returning * 100
        ).round(2) if acquisition_returning > 0 else 0

    # CSV 저장
    print(f"데이터 저장 중: {OUTPUT_NEW_VS_RETURNING_CVR}")
    result_df.to_csv(OUTPUT_NEW_VS_RETURNING_CVR, index=False, encoding='utf-8-sig')
    print(f"✓ 신규 vs 재방문 고객 전환율 데이터 생성 완료: {len(result_df)}개 단계")
    print(f"\n생성된 데이터:")
    print(result_df)

    return result_df


def main():
    """메인 실행 함수"""
    print("=" * 60)
    print("재방문 및 참여도 분석 데이터 생성 스크립트")
    print("=" * 60)

    try:
        # 1. 채널별 참여도 데이터 생성
        engagement_data = generate_channel_engagement_data()

        # 2. 신규 vs 재방문 고객 전환율 비교 데이터 생성
        conversion_data = generate_new_vs_returning_conversion()

        print("\n" + "=" * 60)
        print("✓ 모든 데이터 생성 완료!")
        print("=" * 60)
        print(f"\n생성된 파일:")
        print(f"  1. {OUTPUT_ENGAGEMENT}")
        print(f"  2. {OUTPUT_NEW_VS_RETURNING_CVR}")

    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
