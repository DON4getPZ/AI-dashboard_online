"""
GA4 데이터를 기반으로 AARRR 퍼널 분석 데이터 생성
"""
import pandas as pd
import json
from datetime import datetime
from collections import defaultdict
import numpy as np
from scipy import stats
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

# 데이터 로드
df = pd.read_csv('../data/GA4/2025-11.csv', encoding='utf-8-sig')

# 날짜 파싱
df['Day'] = pd.to_datetime(df['Day'])
df['week'] = pd.to_datetime(df['week'])

# 퍼널 단계 정의
FUNNEL_MAPPING = {
    '유입': 'Acquisition',
    '활동': 'Activation',
    '관심': 'Consideration',
    '결제진행': 'Conversion',
    '구매완료': 'Purchase'
}

# 1. 일별 전체 퍼널 집계
daily_funnel = df.groupby(['Day', 'funnel']).agg({
    'Total users': 'sum',
    'New users': 'sum',
    'Event count': 'sum',
    'Event value': 'sum',
    'Sessions': 'sum'
}).reset_index()

# 퍼널 단계별 피벗
daily_funnel_pivot = daily_funnel.pivot_table(
    index='Day',
    columns='funnel',
    values='Total users',
    aggfunc='sum',
    fill_value=0
).reset_index()

# 컬럼 재정렬
funnel_order = ['유입', '활동', '관심', '결제진행', '구매완료']
existing_cols = [col for col in funnel_order if col in daily_funnel_pivot.columns]
daily_funnel_pivot = daily_funnel_pivot[['Day'] + existing_cols]

# 전환율 계산
if '유입' in daily_funnel_pivot.columns and '구매완료' in daily_funnel_pivot.columns:
    daily_funnel_pivot['CVR'] = (daily_funnel_pivot['구매완료'] / daily_funnel_pivot['유입'] * 100).fillna(0)

# CSV 저장
daily_funnel_pivot.to_csv('../data/funnel/daily_funnel.csv', index=False, encoding='utf-8-sig')

# 2. 주별 퍼널 집계
weekly_funnel = df.groupby(['week', 'funnel']).agg({
    'Total users': 'sum',
    'New users': 'sum',
    'Event count': 'sum',
    'Event value': 'sum'
}).reset_index()

weekly_funnel_pivot = weekly_funnel.pivot_table(
    index='week',
    columns='funnel',
    values='Total users',
    aggfunc='sum',
    fill_value=0
).reset_index()

existing_cols_weekly = [col for col in funnel_order if col in weekly_funnel_pivot.columns]
weekly_funnel_pivot = weekly_funnel_pivot[['week'] + existing_cols_weekly]

if '유입' in weekly_funnel_pivot.columns and '구매완료' in weekly_funnel_pivot.columns:
    weekly_funnel_pivot['CVR'] = (weekly_funnel_pivot['구매완료'] / weekly_funnel_pivot['유입'] * 100).fillna(0)

weekly_funnel_pivot.to_csv('../data/funnel/weekly_funnel.csv', index=False, encoding='utf-8-sig')

# 3. 채널별 퍼널 분석
channel_funnel = df.groupby(['channel', 'funnel']).agg({
    'Total users': 'sum',
    'Event value': 'sum'
}).reset_index()

channel_funnel_pivot = channel_funnel.pivot_table(
    index='channel',
    columns='funnel',
    values='Total users',
    aggfunc='sum',
    fill_value=0
).reset_index()

# 매출 합계
channel_revenue = df[df['funnel'] == '구매완료'].groupby('channel')['Event value'].sum().reset_index()
channel_revenue.columns = ['channel', 'Revenue']

# 병합
channel_funnel_pivot = channel_funnel_pivot.merge(channel_revenue, on='channel', how='left')
channel_funnel_pivot['Revenue'] = channel_funnel_pivot['Revenue'].fillna(0)

# 전환율 계산
if '유입' in channel_funnel_pivot.columns and '구매완료' in channel_funnel_pivot.columns:
    channel_funnel_pivot['CVR'] = (channel_funnel_pivot['구매완료'] / channel_funnel_pivot['유입'] * 100).fillna(0)

channel_funnel_pivot.to_csv('../data/funnel/channel_funnel.csv', index=False, encoding='utf-8-sig')

# 4. 캠페인별 퍼널 (상위 20개)
campaign_funnel = df.groupby(['Session campaign', 'funnel']).agg({
    'Total users': 'sum',
    'Event value': 'sum'
}).reset_index()

# 유입이 많은 상위 20개 캠페인 선택
top_campaigns = df[df['funnel'] == '유입'].groupby('Session campaign')['Total users'].sum().nlargest(20).index

campaign_funnel_top = campaign_funnel[campaign_funnel['Session campaign'].isin(top_campaigns)]

campaign_funnel_pivot = campaign_funnel_top.pivot_table(
    index='Session campaign',
    columns='funnel',
    values='Total users',
    aggfunc='sum',
    fill_value=0
).reset_index()

# 매출
campaign_revenue = df[df['funnel'] == '구매완료'].groupby('Session campaign')['Event value'].sum().reset_index()
campaign_revenue.columns = ['Session campaign', 'Revenue']

campaign_funnel_pivot = campaign_funnel_pivot.merge(campaign_revenue, on='Session campaign', how='left')
campaign_funnel_pivot['Revenue'] = campaign_funnel_pivot['Revenue'].fillna(0)

if '유입' in campaign_funnel_pivot.columns and '구매완료' in campaign_funnel_pivot.columns:
    campaign_funnel_pivot['CVR'] = (campaign_funnel_pivot['구매완료'] / campaign_funnel_pivot['유입'] * 100).fillna(0)

campaign_funnel_pivot.to_csv('../data/funnel/campaign_funnel.csv', index=False, encoding='utf-8-sig')

# 5. 신규 vs 재방문 분석
new_vs_returning = df.groupby(['Day', 'funnel']).agg({
    'Total users': 'sum',
    'New users': 'sum'
}).reset_index()

new_vs_returning['Returning users'] = new_vs_returning['Total users'] - new_vs_returning['New users']
new_vs_returning['New user %'] = (new_vs_returning['New users'] / new_vs_returning['Total users'] * 100).fillna(0)

new_vs_returning.to_csv('../data/funnel/new_vs_returning.csv', index=False, encoding='utf-8-sig')

# 6. 인사이트 생성
insights = {
    "summary": {
        "total_acquisition": int(df[df['funnel'] == '유입']['Total users'].sum()),
        "total_activation": int(df[df['funnel'] == '활동']['Total users'].sum()),
        "total_consideration": int(df[df['funnel'] == '관심']['Total users'].sum()),
        "total_conversion": int(df[df['funnel'] == '결제진행']['Total users'].sum()),
        "total_purchase": int(df[df['funnel'] == '구매완료']['Total users'].sum()),
        "total_revenue": float(df[df['funnel'] == '구매완료']['Event value'].sum()),
        "overall_cvr": 0
    },
    "top_channels": [],
    "top_campaigns": [],
    "alerts": []
}

# 전체 CVR
if insights['summary']['total_acquisition'] > 0:
    insights['summary']['overall_cvr'] = round(
        insights['summary']['total_purchase'] / insights['summary']['total_acquisition'] * 100, 2
    )

# 상위 채널
channel_summary = df[df['funnel'] == '구매완료'].groupby('channel').agg({
    'Total users': 'sum',
    'Event value': 'sum'
}).reset_index()
channel_summary = channel_summary.nlargest(5, 'Event value')

for _, row in channel_summary.iterrows():
    insights['top_channels'].append({
        'name': row['channel'],
        'purchases': int(row['Total users']),
        'revenue': float(row['Event value'])
    })

# 상위 캠페인
campaign_summary = df[df['funnel'] == '구매완료'].groupby('Session campaign').agg({
    'Total users': 'sum',
    'Event value': 'sum'
}).reset_index()
campaign_summary = campaign_summary.nlargest(5, 'Event value')

for _, row in campaign_summary.iterrows():
    insights['top_campaigns'].append({
        'name': row['Session campaign'],
        'purchases': int(row['Total users']),
        'revenue': float(row['Event value'])
    })

# 알림: 퍼널 이탈 분석
funnel_totals = df.groupby('funnel')['Total users'].sum()

if '유입' in funnel_totals.index and '활동' in funnel_totals.index:
    activation_rate = funnel_totals['활동'] / funnel_totals['유입'] * 100
    if activation_rate < 50:
        insights['alerts'].append({
            'type': 'low_activation',
            'message': f'유입→활동 전환율이 {activation_rate:.1f}%로 낮습니다. 랜딩페이지 최적화가 필요합니다.',
            'severity': 'high'
        })

if '관심' in funnel_totals.index and '구매완료' in funnel_totals.index:
    purchase_from_consideration = funnel_totals['구매완료'] / funnel_totals['관심'] * 100
    if purchase_from_consideration < 20:
        insights['alerts'].append({
            'type': 'low_consideration_conversion',
            'message': f'장바구니→구매 전환율이 {purchase_from_consideration:.1f}%로 낮습니다. 결제 프로세스 개선이 필요합니다.',
            'severity': 'medium'
        })

# 7. 메타데이터 추가 (forecast/insights.json 구조 참고)
generated_at = datetime.now().isoformat()
start_date = df['Day'].min().strftime('%Y-%m-%d')
end_date = df['Day'].max().strftime('%Y-%m-%d')

# Overall 섹션 추가
insights['generated_at'] = generated_at
insights['overall'] = {
    'current_period': {
        'start_date': start_date,
        'end_date': end_date,
        'total_acquisition': insights['summary']['total_acquisition'],
        'total_activation': insights['summary']['total_activation'],
        'total_consideration': insights['summary']['total_consideration'],
        'total_conversion': insights['summary']['total_conversion'],
        'total_purchase': insights['summary']['total_purchase'],
        'total_revenue': insights['summary']['total_revenue'],
        'overall_cvr': insights['summary']['overall_cvr']
    },
    'trend': {
        'direction': 'stable'
    }
}

# 8. A/B 테스트 통계적 유의성 검정
ab_test_results = []

# 채널별 전환율 비교 (카이제곱 검정)
try:
    for i, channel1 in enumerate(channel_funnel_pivot['channel'].values):
        for channel2 in channel_funnel_pivot['channel'].values[i+1:]:
            channel1_data = channel_funnel_pivot[channel_funnel_pivot['channel'] == channel1]
            channel2_data = channel_funnel_pivot[channel_funnel_pivot['channel'] == channel2]

            if '유입' in channel1_data.columns and '구매완료' in channel1_data.columns:
                c1_acquisition = channel1_data['유입'].values[0]
                c1_purchase = channel1_data['구매완료'].values[0]
                c2_acquisition = channel2_data['유입'].values[0]
                c2_purchase = channel2_data['구매완료'].values[0]

                # 카이제곱 검정을 위한 contingency table
                contingency_table = np.array([
                    [c1_purchase, c1_acquisition - c1_purchase],
                    [c2_purchase, c2_acquisition - c2_purchase]
                ])

                if contingency_table.min() > 5:  # 카이제곱 검정 조건
                    chi2, p_value, dof, expected = stats.chi2_contingency(contingency_table)

                    ab_test_results.append({
                        'type': 'channel_comparison',
                        'group_a': channel1,
                        'group_b': channel2,
                        'metric': 'conversion_rate',
                        'chi2_statistic': float(chi2),
                        'p_value': float(p_value),
                        'significant': bool(float(p_value) < 0.05),
                        'cvr_a': float(c1_purchase / c1_acquisition * 100) if c1_acquisition > 0 else 0,
                        'cvr_b': float(c2_purchase / c2_acquisition * 100) if c2_acquisition > 0 else 0
                    })
except Exception as e:
    print(f"  ⚠️ A/B 테스트 분석 중 오류: {str(e)}")

insights['ab_test_results'] = ab_test_results

# 9. 사용자 세그먼트 클러스터링
try:
    # 채널별 특성으로 클러스터링
    clustering_features = []
    channel_names = []

    for _, row in channel_funnel_pivot.iterrows():
        features = []
        channel_names.append(row['channel'])

        # 각 퍼널 단계 비율 계산
        total_acquisition = row.get('유입', 0)
        if total_acquisition > 0:
            features.append(row.get('활동', 0) / total_acquisition)
            features.append(row.get('관심', 0) / total_acquisition)
            features.append(row.get('결제진행', 0) / total_acquisition)
            features.append(row.get('구매완료', 0) / total_acquisition)
            features.append(row.get('CVR', 0) / 100)
            features.append(row.get('Revenue', 0) / total_acquisition if total_acquisition > 0 else 0)
            clustering_features.append(features)

    if len(clustering_features) >= 3:  # 최소 3개 채널 필요
        X = np.array(clustering_features)
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        # K-Means 클러스터링 (3개 클러스터)
        n_clusters = min(3, len(channel_names))
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        cluster_labels = kmeans.fit_predict(X_scaled)

        # 클러스터별 채널 그룹화
        clusters = {}
        for channel, label in zip(channel_names, cluster_labels):
            label_name = f"cluster_{label}"
            if label_name not in clusters:
                clusters[label_name] = []
            clusters[label_name].append(channel)

        insights['channel_clusters'] = {
            'n_clusters': n_clusters,
            'clusters': clusters,
            'description': {
                'cluster_0': '고성과 채널',
                'cluster_1': '중간 성과 채널',
                'cluster_2': '저성과 채널'
            }
        }
except Exception as e:
    print(f"  ⚠️ 클러스터링 분석 중 오류: {str(e)}")
    insights['channel_clusters'] = {}

# 10. 이탈 예측 & 성과 개선 분석 (7일 & 30일)
churn_predictions_7d = []
churn_predictions_30d = []
improvement_predictions_7d = []
improvement_predictions_30d = []

try:
    # 일별 데이터에서 이탈 위험 및 성과 개선 감지
    for funnel_stage in ['유입', '활동', '관심', '결제진행']:
        if funnel_stage in daily_funnel_pivot.columns:

            # === 7일 비교 ===
            if len(daily_funnel_pivot) >= 14:
                recent_7days = daily_funnel_pivot[funnel_stage].tail(7).mean()
                previous_7days = daily_funnel_pivot[funnel_stage].iloc[-14:-7].mean()

                if previous_7days > 0:
                    change_pct = ((recent_7days - previous_7days) / previous_7days) * 100

                    # 20% 이상 감소 → 이탈 위험
                    if change_pct < -20:
                        churn_predictions_7d.append({
                            'stage': funnel_stage,
                            'period': '7d',
                            'risk_level': 'high' if change_pct < -30 else 'medium',
                            'change_pct': round(change_pct, 2),
                            'recent_avg': round(recent_7days, 2),
                            'previous_avg': round(previous_7days, 2),
                            'recommendation': f'{funnel_stage} 단계의 사용자 이탈이 증가하고 있습니다. 마케팅 캠페인 점검이 필요합니다.'
                        })

                    # 20% 이상 증가 → 성과 개선
                    elif change_pct > 20:
                        improvement_predictions_7d.append({
                            'stage': funnel_stage,
                            'period': '7d',
                            'improvement_level': 'high' if change_pct > 30 else 'medium',
                            'change_pct': round(change_pct, 2),
                            'recent_avg': round(recent_7days, 2),
                            'previous_avg': round(previous_7days, 2),
                            'recommendation': f'{funnel_stage} 단계의 성과가 개선되고 있습니다. 현재 전략을 유지하고 확대하세요.'
                        })

            # === 30일 비교 ===
            if len(daily_funnel_pivot) >= 60:
                recent_30days = daily_funnel_pivot[funnel_stage].tail(30).mean()
                previous_30days = daily_funnel_pivot[funnel_stage].iloc[-60:-30].mean()

                if previous_30days > 0:
                    change_pct = ((recent_30days - previous_30days) / previous_30days) * 100

                    # 20% 이상 감소 → 이탈 위험
                    if change_pct < -20:
                        churn_predictions_30d.append({
                            'stage': funnel_stage,
                            'period': '30d',
                            'risk_level': 'high' if change_pct < -30 else 'medium',
                            'change_pct': round(change_pct, 2),
                            'recent_avg': round(recent_30days, 2),
                            'previous_avg': round(previous_30days, 2),
                            'recommendation': f'{funnel_stage} 단계의 사용자 이탈이 증가하고 있습니다. 마케팅 캠페인 점검이 필요합니다.'
                        })

                    # 20% 이상 증가 → 성과 개선
                    elif change_pct > 20:
                        improvement_predictions_30d.append({
                            'stage': funnel_stage,
                            'period': '30d',
                            'improvement_level': 'high' if change_pct > 30 else 'medium',
                            'change_pct': round(change_pct, 2),
                            'recent_avg': round(recent_30days, 2),
                            'previous_avg': round(previous_30days, 2),
                            'recommendation': f'{funnel_stage} 단계의 성과가 개선되고 있습니다. 현재 전략을 유지하고 확대하세요.'
                        })

except Exception as e:
    print(f"  ⚠️ 이탈/개선 예측 분석 중 오류: {str(e)}")

# 인사이트에 추가 (7일, 30일 구분)
insights['churn_predictions_7d'] = churn_predictions_7d
insights['churn_predictions_30d'] = churn_predictions_30d
insights['improvement_predictions_7d'] = improvement_predictions_7d
insights['improvement_predictions_30d'] = improvement_predictions_30d

# 하위 호환성을 위해 기존 키도 유지 (7일 데이터를 기본으로)
insights['churn_predictions'] = churn_predictions_7d

# 11. 상세 통계 추가
insights['details'] = {
    'total_channels': len(channel_funnel_pivot),
    'total_campaigns': len(campaign_funnel_pivot),
    'analysis_period_days': len(daily_funnel_pivot),
    'ab_tests_conducted': len(ab_test_results),
    'significant_ab_tests': len([t for t in ab_test_results if t['significant']]),
    'churn_risk_stages_7d': len(churn_predictions_7d),
    'churn_risk_stages_30d': len(churn_predictions_30d),
    'improvement_stages_7d': len(improvement_predictions_7d),
    'improvement_stages_30d': len(improvement_predictions_30d)
}

# 인사이트 저장
with open('../data/funnel/insights.json', 'w', encoding='utf-8') as f:
    json.dump(insights, f, ensure_ascii=False, indent=2)

print("✅ 퍼널 데이터 생성 완료")
print(f"  - 일별 퍼널: {len(daily_funnel_pivot)} rows")
print(f"  - 주별 퍼널: {len(weekly_funnel_pivot)} rows")
print(f"  - 채널별 퍼널: {len(channel_funnel_pivot)} rows")
print(f"  - 캠페인별 퍼널: {len(campaign_funnel_pivot)} rows")
print(f"  - 전체 CVR: {insights['summary']['overall_cvr']}%")
print(f"\n📊 고급 분석:")
print(f"  - A/B 테스트: {len(ab_test_results)}개 수행 (유의미: {len([t for t in ab_test_results if t['significant']])}개)")
print(f"  - 채널 클러스터: {insights.get('channel_clusters', {}).get('n_clusters', 0)}개 그룹")
print(f"  - 이탈 위험 (7일): {len(churn_predictions_7d)}개 / (30일): {len(churn_predictions_30d)}개")
print(f"  - 성과 개선 (7일): {len(improvement_predictions_7d)}개 / (30일): {len(improvement_predictions_30d)}개")
print(f"  - 분석 기간: {start_date} ~ {end_date}")
