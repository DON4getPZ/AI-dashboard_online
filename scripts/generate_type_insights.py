"""
Type 분석 기반 인사이트 생성

analysis_*.csv와 dimension_type*.csv 파일들을 분석하여
사용자 친화적인 인사이트를 JSON으로 생성합니다.
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime
from pathlib import Path

# 경로 설정
data_dir = Path(r'c:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\type')

print("=" * 100)
print("Type 분석 인사이트 생성")
print("=" * 100)
print(f"생성일: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

# ============================================================================
# 데이터 로드
# ============================================================================
print("\n데이터 로딩 중...")

# 유형구분별 성과
category_summary = pd.read_csv(data_dir / 'analysis_category_summary.csv')

# 일별 집계
daily_summary = pd.read_csv(data_dir / 'analysis_daily_summary.csv')
daily_summary['일'] = pd.to_datetime(daily_summary['일'])

# 차원별 분석 파일들
dimension_files = {
    'type1': 'dimension_type1_campaign_adset.csv',
    'type2': 'dimension_type2_adset_age_gender.csv',
    'type3': 'dimension_type3_adset_age.csv',
    'type4': 'dimension_type4_adset_gender.csv',
    'type5': 'dimension_type5_adset_device.csv',
    'type6': 'dimension_type6_adset_platform.csv',
    'type7': 'dimension_type7_adset_deviceplatform.csv'
}

dimensions = {}
for key, filename in dimension_files.items():
    file_path = data_dir / filename
    if file_path.exists():
        dimensions[key] = pd.read_csv(file_path)
        print(f"✓ {filename} 로드 완료")

# ============================================================================
# 전체 요약
# ============================================================================
print("\n전체 요약 생성 중...")

total_cost = category_summary['비용'].sum()
total_conversions = category_summary['전환수'].sum()
total_revenue = category_summary['전환값'].sum()
overall_roas = (total_revenue / total_cost * 100) if total_cost > 0 else 0
overall_cpa = (total_cost / total_conversions) if total_conversions > 0 else 0

summary = {
    "total_cost": float(total_cost),
    "total_conversions": float(total_conversions),
    "total_revenue": float(total_revenue),
    "overall_roas": float(overall_roas),
    "overall_cpa": float(overall_cpa),
    "analysis_period": {
        "start_date": daily_summary['일'].min().strftime('%Y-%m-%d'),
        "end_date": daily_summary['일'].max().strftime('%Y-%m-%d'),
        "total_days": len(daily_summary)
    }
}

# ============================================================================
# 상위 유형구분
# ============================================================================
print("상위 유형구분 분석 중...")

# 비용이 있는 유형구분만 필터링
paid_categories = category_summary[category_summary['비용'] > 0].copy()
top_categories = paid_categories.nlargest(5, 'ROAS')[['유형구분', '비용', '전환수', '전환값', 'ROAS', 'CPA']].to_dict('records')

top_categories_list = []
for cat in top_categories:
    top_categories_list.append({
        "name": cat['유형구분'],
        "cost": float(cat['비용']),
        "conversions": float(cat['전환수']),
        "revenue": float(cat['전환값']),
        "roas": float(cat['ROAS']),
        "cpa": float(cat['CPA'])
    })

# ============================================================================
# Type4 성별 분석 (가장 중요한 인사이트)
# ============================================================================
print("Type4 성별 인사이트 생성 중...")

gender_insights = []
if 'type4' in dimensions:
    type4_df = dimensions['type4']

    # 성별별 집계
    gender_summary = type4_df.groupby('성별').agg({
        '비용': 'sum',
        '전환수': 'sum',
        '전환값': 'sum',
        'ROAS': 'mean'
    }).reset_index()

    # 성별별 성과가 있는 것만
    gender_summary = gender_summary[gender_summary['전환수'] > 0]

    for _, row in gender_summary.iterrows():
        gender_name = row['성별']
        roas_val = float(row['ROAS']) if pd.notna(row['ROAS']) else 0

        # 성과 레벨 판단
        if roas_val > 5000:
            performance = "매우 우수"
        elif roas_val > 1000:
            performance = "우수"
        elif roas_val > 200:
            performance = "양호"
        else:
            performance = "개선 필요"

        gender_insights.append({
            "gender": gender_name,
            "cost": float(row['비용']),
            "conversions": float(row['전환수']),
            "revenue": float(row['전환값']),
            "roas": roas_val,
            "performance_level": performance
        })

# ============================================================================
# 최고 성과 광고세트 (Type1)
# ============================================================================
print("최고 성과 광고세트 분석 중...")

top_adsets = []
if 'type1' in dimensions:
    type1_df = dimensions['type1']

    # ROAS 기준 상위 10개
    type1_df_filtered = type1_df[type1_df['전환수'] > 0].copy()
    top_10_adsets = type1_df_filtered.nlargest(10, 'ROAS')

    for _, row in top_10_adsets.iterrows():
        top_adsets.append({
            "campaign": row['캠페인이름'],
            "adset": row['광고세트'],
            "category": row['유형구분'],
            "cost": float(row['비용']),
            "conversions": float(row['전환수']),
            "revenue": float(row['전환값']),
            "roas": float(row['ROAS'])
        })

# ============================================================================
# 연령x성별 히트맵 인사이트 (Type2)
# ============================================================================
print("연령x성별 인사이트 생성 중...")

age_gender_insights = []
if 'type2' in dimensions:
    type2_df = dimensions['type2']

    # 광고세트별 최고 성과 연령x성별 조합 찾기
    top_combinations = type2_df.nlargest(5, 'ROAS')

    for _, row in top_combinations.iterrows():
        age_gender_insights.append({
            "adset": row['광고세트'],
            "age": row['연령'],
            "gender": row['성별'],
            "roas": float(row['ROAS']),
            "conversions": float(row['전환수']),
            "recommendation": f"{row['연령']}세 {row['성별']} 타겟팅이 효과적입니다"
        })

# ============================================================================
# 기기플랫폼 분석 (Type7)
# ============================================================================
print("기기플랫폼 인사이트 생성 중...")

platform_insights = []
if 'type7' in dimensions:
    type7_df = dimensions['type7']

    platform_summary = type7_df.groupby('기기플랫폼').agg({
        '비용': 'sum',
        '전환수': 'sum',
        '전환값': 'sum'
    }).reset_index()

    platform_summary['ROAS'] = (platform_summary['전환값'] / platform_summary['비용'] * 100).replace([np.inf, -np.inf], 0)
    platform_summary = platform_summary[platform_summary['전환수'] > 0]

    for _, row in platform_summary.iterrows():
        platform_insights.append({
            "platform": row['기기플랫폼'],
            "cost": float(row['비용']),
            "conversions": float(row['전환수']),
            "revenue": float(row['전환값']),
            "roas": float(row['ROAS'])
        })

# ============================================================================
# 브랜드명별 분석
# ============================================================================
print("브랜드명 인사이트 생성 중...")

brand_insights = []
if 'type1' in dimensions:
    type1_df = dimensions['type1']

    if '브랜드명' in type1_df.columns:
        brand_summary = type1_df.groupby('브랜드명').agg({
            '비용': 'sum',
            '전환수': 'sum',
            '전환값': 'sum'
        }).reset_index()

        brand_summary['ROAS'] = (brand_summary['전환값'] / brand_summary['비용'] * 100).replace([np.inf, -np.inf], 0)
        brand_summary = brand_summary[brand_summary['전환수'] > 0]
        brand_summary = brand_summary.nlargest(10, 'ROAS')

        for _, row in brand_summary.iterrows():
            brand_insights.append({
                "brand": row['브랜드명'],
                "cost": float(row['비용']),
                "conversions": float(row['전환수']),
                "revenue": float(row['전환값']),
                "roas": float(row['ROAS'])
            })

# ============================================================================
# 상품명별 분석
# ============================================================================
print("상품명 인사이트 생성 중...")

product_insights = []
if 'type1' in dimensions:
    type1_df = dimensions['type1']

    if '상품명' in type1_df.columns:
        product_summary = type1_df.groupby('상품명').agg({
            '비용': 'sum',
            '전환수': 'sum',
            '전환값': 'sum'
        }).reset_index()

        product_summary['ROAS'] = (product_summary['전환값'] / product_summary['비용'] * 100).replace([np.inf, -np.inf], 0)
        product_summary = product_summary[product_summary['전환수'] > 0]
        product_summary = product_summary.nlargest(10, 'ROAS')

        for _, row in product_summary.iterrows():
            product_insights.append({
                "product": row['상품명'],
                "cost": float(row['비용']),
                "conversions": float(row['전환수']),
                "revenue": float(row['전환값']),
                "roas": float(row['ROAS'])
            })

# ============================================================================
# 프로모션별 분석
# ============================================================================
print("프로모션 인사이트 생성 중...")

promotion_insights = []
if 'type1' in dimensions:
    type1_df = dimensions['type1']

    if '프로모션' in type1_df.columns:
        promotion_summary = type1_df.groupby('프로모션').agg({
            '비용': 'sum',
            '전환수': 'sum',
            '전환값': 'sum'
        }).reset_index()

        promotion_summary['ROAS'] = (promotion_summary['전환값'] / promotion_summary['비용'] * 100).replace([np.inf, -np.inf], 0)
        promotion_summary = promotion_summary[promotion_summary['전환수'] > 0]
        promotion_summary = promotion_summary.nlargest(10, 'ROAS')

        for _, row in promotion_summary.iterrows():
            promotion_insights.append({
                "promotion": row['프로모션'],
                "cost": float(row['비용']),
                "conversions": float(row['전환수']),
                "revenue": float(row['전환값']),
                "roas": float(row['ROAS'])
            })

# ============================================================================
# 알림 및 추천사항
# ============================================================================
print("알림 및 추천사항 생성 중...")

alerts = []

# 1. 최고 성과 유형구분 강조
if len(top_categories_list) > 0:
    best_category = top_categories_list[0]
    if best_category['roas'] > 1000:
        alerts.append({
            "type": "high_roas_opportunity",
            "message": f"{best_category['name']}의 ROAS가 {best_category['roas']:.1f}%로 매우 높습니다. 예산 증액을 고려하세요.",
            "severity": "opportunity",
            "value": best_category['roas']
        })

# 2. 저성과 유형구분 경고
low_roas_categories = paid_categories[paid_categories['ROAS'] < 50]
if len(low_roas_categories) > 0:
    for _, cat in low_roas_categories.iterrows():
        alerts.append({
            "type": "low_roas_warning",
            "message": f"{cat['유형구분']}의 ROAS가 {cat['ROAS']:.1f}%로 낮습니다. 캠페인 최적화가 필요합니다.",
            "severity": "warning",
            "category": cat['유형구분'],
            "value": float(cat['ROAS'])
        })

# 3. 성별 타겟팅 추천
if len(gender_insights) > 0:
    best_gender = max(gender_insights, key=lambda x: x['roas'])
    if best_gender['roas'] > 1000:
        alerts.append({
            "type": "gender_targeting_opportunity",
            "message": f"{best_gender['gender']} 타겟팅의 ROAS가 {best_gender['roas']:.1f}%로 우수합니다. 해당 성별 집중 광고를 추천합니다.",
            "severity": "opportunity",
            "gender": best_gender['gender'],
            "value": best_gender['roas']
        })

# 4. 일별 트렌드 분석
recent_30days = daily_summary.tail(30)
previous_30days = daily_summary.iloc[-60:-30] if len(daily_summary) >= 60 else daily_summary.iloc[:30]

recent_revenue = recent_30days['전환값'].sum()
previous_revenue = previous_30days['전환값'].sum()

if previous_revenue > 0:
    revenue_change = ((recent_revenue - previous_revenue) / previous_revenue * 100)

    if revenue_change < -20:
        alerts.append({
            "type": "revenue_decline",
            "message": f"최근 30일 매출이 이전 대비 {revenue_change:.1f}% 감소했습니다. 캠페인 점검이 필요합니다.",
            "severity": "high",
            "value": revenue_change
        })
    elif revenue_change > 20:
        alerts.append({
            "type": "revenue_growth",
            "message": f"최근 30일 매출이 이전 대비 {revenue_change:.1f}% 증가했습니다! 현재 전략을 유지하세요.",
            "severity": "positive",
            "value": revenue_change
        })

# ============================================================================
# 추천사항
# ============================================================================
recommendations = []

# 1. 예산 재배분 추천
if len(top_categories_list) >= 2:
    best = top_categories_list[0]
    second = top_categories_list[1]

    recommendations.append({
        "title": "예산 재배분 제안",
        "description": f"{best['name']} (ROAS {best['roas']:.1f}%)의 예산을 늘리고, {second['name']} (ROAS {second['roas']:.1f}%)의 예산을 유지하세요.",
        "priority": "high",
        "expected_impact": "ROAS 10-20% 개선 예상"
    })

# 2. 성별 타겟팅 최적화
if len(gender_insights) >= 2:
    sorted_genders = sorted(gender_insights, key=lambda x: x['roas'], reverse=True)
    best_gender = sorted_genders[0]

    recommendations.append({
        "title": "성별 타겟팅 최적화",
        "description": f"{best_gender['gender']} 타겟 광고의 비중을 높이세요. 현재 ROAS {best_gender['roas']:.1f}%로 가장 높습니다.",
        "priority": "medium",
        "expected_impact": "CPA 15-25% 절감 가능"
    })

# 3. 플랫폼 최적화
if len(platform_insights) > 0:
    best_platform = max(platform_insights, key=lambda x: x['roas'])

    recommendations.append({
        "title": "기기 플랫폼 최적화",
        "description": f"{best_platform['platform']} 플랫폼 광고에 집중하세요. ROAS {best_platform['roas']:.1f}%로 가장 효율적입니다.",
        "priority": "medium",
        "expected_impact": "전환율 10-15% 개선 예상"
    })

# ============================================================================
# 브랜드/상품/프로모션 추천사항 추가
# ============================================================================
# 최고 성과 브랜드 추천
if len(brand_insights) > 0:
    best_brand = brand_insights[0]
    if best_brand['roas'] > 100:  # 조건 완화: 100% 이상
        recommendations.append({
            "title": "브랜드 집중 전략",
            "description": f"{best_brand['brand']} 브랜드의 ROAS가 {best_brand['roas']:.1f}%로 가장 높습니다. 해당 브랜드 광고 비중을 확대하세요.",
            "priority": "high",
            "expected_impact": "ROAS 15-30% 개선 가능"
        })

# 최고 성과 상품 추천
if len(product_insights) > 0:
    best_product = product_insights[0]
    if best_product['roas'] > 100:  # 조건 완화: 100% 이상
        recommendations.append({
            "title": "상품 포트폴리오 최적화",
            "description": f"{best_product['product']} 상품의 ROAS가 {best_product['roas']:.1f}%로 가장 효율적입니다. 주력 상품으로 설정하세요.",
            "priority": "high",
            "expected_impact": "매출 20-35% 증가 예상"
        })

# 최고 성과 프로모션 추천
if len(promotion_insights) > 0:
    best_promotion = promotion_insights[0]
    if best_promotion['roas'] > 100:  # 조건 완화: 100% 이상
        recommendations.append({
            "title": "프로모션 전략 강화",
            "description": f"{best_promotion['promotion']} 프로모션의 ROAS가 {best_promotion['roas']:.1f}%입니다. 유사한 프로모션 기획을 추천합니다.",
            "priority": "medium",
            "expected_impact": "전환율 10-20% 개선 예상"
        })

# ============================================================================
# 최종 JSON 생성
# ============================================================================
insights = {
    "summary": summary,
    "top_categories": top_categories_list,
    "gender_performance": gender_insights,
    "top_adsets": top_adsets[:10] if len(top_adsets) > 0 else [],
    "age_gender_combinations": age_gender_insights,
    "platform_performance": platform_insights,
    "brand_performance": brand_insights[:10] if len(brand_insights) > 0 else [],
    "product_performance": product_insights[:10] if len(product_insights) > 0 else [],
    "promotion_performance": promotion_insights[:10] if len(promotion_insights) > 0 else [],
    "alerts": alerts,
    "recommendations": recommendations,
    "generated_at": datetime.now().isoformat(),
    "overall": {
        "current_period": {
            "start_date": summary["analysis_period"]["start_date"],
            "end_date": summary["analysis_period"]["end_date"],
            "total_cost": summary["total_cost"],
            "total_conversions": summary["total_conversions"],
            "total_revenue": summary["total_revenue"],
            "overall_roas": summary["overall_roas"],
            "overall_cpa": summary["overall_cpa"]
        },
        "trend": {
            "direction": "growing" if revenue_change > 10 else "stable" if revenue_change > -10 else "declining",
            "change_percent": float(revenue_change) if previous_revenue > 0 else 0
        }
    },
    "details": {
        "total_categories": len(category_summary),
        "paid_categories": len(paid_categories),
        "top_roas_category": top_categories_list[0]['name'] if len(top_categories_list) > 0 else None,
        "analysis_period_days": summary["analysis_period"]["total_days"],
        "alerts_count": len(alerts),
        "recommendations_count": len(recommendations)
    }
}

# JSON 파일 저장
output_file = data_dir / 'insights.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(insights, f, ensure_ascii=False, indent=2)

print(f"\n✓ 인사이트 생성 완료: {output_file}")

# 요약 출력
print("\n" + "=" * 100)
print("생성된 인사이트 요약")
print("=" * 100)
print(f"\n전체 ROAS: {summary['overall_roas']:.1f}%")
print(f"전체 CPA: {summary['overall_cpa']:,.0f}원")
print(f"\n상위 유형구분: {len(top_categories_list)}개")
print(f"알림: {len(alerts)}개")
print(f"추천사항: {len(recommendations)}개")

print("\n" + "=" * 100)
print("인사이트 생성 완료!")
print("=" * 100)
