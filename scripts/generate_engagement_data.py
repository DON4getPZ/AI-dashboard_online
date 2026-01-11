# -*- coding: utf-8 -*-
"""
채널별 참여도 및 재방문율 분석 데이터 생성 스크립트

사용법:
- 레거시: python generate_engagement_data.py
- 멀티클라이언트: python generate_engagement_data.py --client clientA
"""

import argparse
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Optional
import sys

# 프로젝트 루트를 path에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.common.paths import ClientPaths, parse_client_arg, PROJECT_ROOT

# 데이터 경로 설정 (레거시 호환용)
BASE_DIR = Path(__file__).parent.parent / 'data'
GA4_FILE = BASE_DIR / 'GA4' / 'GA4_data.csv'
NEW_VS_RETURNING_FILE = BASE_DIR / 'funnel' / 'new_vs_returning.csv'
CHANNEL_FUNNEL_FILE = BASE_DIR / 'funnel' / 'channel_funnel.csv'

# 출력 파일 경로 (레거시)
OUTPUT_ENGAGEMENT = BASE_DIR / 'funnel' / 'channel_engagement.csv'
OUTPUT_NEW_VS_RETURNING_CVR = BASE_DIR / 'funnel' / 'new_vs_returning_conversion.csv'


def generate_channel_engagement_data(paths: Optional[ClientPaths] = None):
    """
    채널별 참여도 및 재방문율 데이터 생성
    - Sessions, Engaged sessions, Avg session duration, Bounce rate
    - Return rate (100 - New user %)
    """
    print("=== 채널별 참여도 데이터 생성 시작 ===")

    # 경로 설정 (클라이언트 모드 vs 레거시 모드)
    if paths:
        ga4_file = paths.ga4_data
        nvr_file = paths.new_vs_returning
        output_file = paths.channel_engagement
    else:
        ga4_file = GA4_FILE
        nvr_file = NEW_VS_RETURNING_FILE
        output_file = OUTPUT_ENGAGEMENT

    # GA4 데이터 로드
    print(f"GA4 데이터 로드 중: {ga4_file}")
    ga4_df = pd.read_csv(ga4_file, encoding='utf-8-sig')

    # new_vs_returning 데이터 로드 (재방문율 계산용)
    print(f"재방문 데이터 로드 중: {nvr_file}")
    nvr_df = pd.read_csv(nvr_file, encoding='utf-8-sig')

    # 채널별로 집계
    print("채널별 집계 중...")

    # GA4 데이터에서 채널별 참여도 지표 계산
    channel_stats = ga4_df.groupby('channel').agg({
        'Sessions': 'sum',
        'Engaged sessions': 'sum',
        'Total users': 'sum',
        'New users': 'sum'
    }).reset_index()

    # Average session duration 세션 가중 평균 계산
    # = sum(duration × sessions) / sum(sessions)
    weighted_duration = ga4_df.groupby('channel').apply(
        lambda x: (x['Average session duration'] * x['Sessions']).sum() / x['Sessions'].sum()
        if x['Sessions'].sum() > 0 else 0,
        include_groups=False
    ).reset_index(name='Average session duration')
    channel_stats = channel_stats.merge(weighted_duration, on='channel', how='left')

    # 참여율 계산 (Engaged sessions / Total sessions * 100)
    channel_stats['Engagement rate'] = (
        channel_stats['Engaged sessions'] / channel_stats['Sessions'] * 100
    ).round(2)

    # Bounce rate 직접 계산 (세션 기반)
    # Bounce rate = (Sessions - Engaged sessions) / Sessions × 100
    channel_stats['Bounce rate'] = (
        (channel_stats['Sessions'] - channel_stats['Engaged sessions'])
        / channel_stats['Sessions'] * 100
    ).round(2)

    # 재방문율 계산 (100 - New user %)
    channel_stats['New user %'] = (
        channel_stats['New users'] / channel_stats['Total users'] * 100
    ).round(2)
    channel_stats['Return rate'] = (100 - channel_stats['New user %']).round(2)

    # 세션 시간을 초 단위로 반올림
    channel_stats['Average session duration'] = channel_stats['Average session duration'].round(1)

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
    output_file.parent.mkdir(parents=True, exist_ok=True)
    print(f"데이터 저장 중: {output_file}")
    result.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"✓ 채널별 참여도 데이터 생성 완료: {len(result)}개 채널")
    print(f"\n생성된 데이터 샘플:")
    print(result.head())

    return result


def generate_new_vs_returning_conversion(paths: Optional[ClientPaths] = None):
    """
    신규 vs 재방문 고객의 퍼널 단계별 전환율 비교 데이터 생성
    """
    print("\n=== 신규 vs 재방문 고객 전환율 비교 데이터 생성 시작 ===")

    # 경로 설정 (클라이언트 모드 vs 레거시 모드)
    if paths:
        nvr_file = paths.new_vs_returning
        output_file = paths.funnel / 'new_vs_returning_conversion.csv'
    else:
        nvr_file = NEW_VS_RETURNING_FILE
        output_file = OUTPUT_NEW_VS_RETURNING_CVR

    # new_vs_returning 데이터 로드
    print(f"재방문 데이터 로드 중: {nvr_file}")
    nvr_df = pd.read_csv(nvr_file, encoding='utf-8-sig')

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
    output_file.parent.mkdir(parents=True, exist_ok=True)
    print(f"데이터 저장 중: {output_file}")
    result_df.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"✓ 신규 vs 재방문 고객 전환율 데이터 생성 완료: {len(result_df)}개 단계")
    print(f"\n생성된 데이터:")
    print(result_df)

    return result_df


def main(client_id: Optional[str] = None):
    """메인 실행 함수"""
    parser = argparse.ArgumentParser(description='재방문 및 참여도 분석 데이터 생성')
    parser.add_argument('--client', type=str, default=None,
                        help='클라이언트 ID (멀티클라이언트 모드)')
    args = parser.parse_args()

    actual_client_id = args.client or client_id

    # 클라이언트 모드 설정
    paths = None
    if actual_client_id:
        paths = ClientPaths(actual_client_id).ensure_dirs()

    print("=" * 60)
    print("재방문 및 참여도 분석 데이터 생성 스크립트")
    if actual_client_id:
        print(f"Client: {actual_client_id}")
    print("=" * 60)

    try:
        # 1. 채널별 참여도 데이터 생성
        engagement_data = generate_channel_engagement_data(paths)

        # 2. 신규 vs 재방문 고객 전환율 비교 데이터 생성
        conversion_data = generate_new_vs_returning_conversion(paths)

        print("\n" + "=" * 60)
        print("✓ 모든 데이터 생성 완료!")
        if actual_client_id:
            print(f"Client: {actual_client_id}")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
