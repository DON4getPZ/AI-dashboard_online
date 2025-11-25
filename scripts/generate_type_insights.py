"""
Type 분석 기반 인사이트 생성

analysis_*.csv와 dimension_type*.csv 파일들을 분석하여
사용자 친화적인 인사이트를 JSON으로 생성합니다.
"""

import pandas as pd
import numpy as np
import json
import re
from datetime import datetime
from pathlib import Path

# ============================================================================
# 성별/연령 데이터 정규화 및 필터링 함수
# ============================================================================
def normalize_gender(gender_value):
    """성별 값을 정규화하고 알수없음은 None 반환"""
    if pd.isna(gender_value) or gender_value == '-':
        return None

    gender_str = str(gender_value).strip().lower()

    # 알수없음 패턴 (제외 대상)
    unknown_pattern = r'^(구분없음|알\s?수\s?없음|un.*|unknown)$'
    if re.match(unknown_pattern, gender_str, re.IGNORECASE):
        return None

    # 남자 패턴
    male_pattern = r'^(남자|남성|male|m)$'
    if re.match(male_pattern, gender_str, re.IGNORECASE):
        return '남성'

    # 여자 패턴
    female_pattern = r'^(여자|여성|female|f)$'
    if re.match(female_pattern, gender_str, re.IGNORECASE):
        return '여성'

    # 그 외는 원본 반환 (필요시 추가 처리)
    return gender_value

def is_valid_gender(gender_value):
    """유효한 성별 데이터인지 확인 (알수없음 제외)"""
    return normalize_gender(gender_value) is not None

def is_valid_age(age_value):
    """유효한 연령 데이터인지 확인 (알수없음 제외)"""
    if pd.isna(age_value) or age_value == '-':
        return False

    age_str = str(age_value).strip().lower()

    # 알수없음 패턴 (제외 대상)
    unknown_pattern = r'^(구분없음|알\s?수\s?없음|un.*|unknown)$'
    if re.match(unknown_pattern, age_str, re.IGNORECASE):
        return False

    return True

def safe_float(value):
    """NaN, Inf 값을 None으로 변환하여 JSON 표준 준수"""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        if pd.isna(value) or np.isinf(value):
            return None
        return float(value)
    return value

def clean_dict_for_json(obj):
    """딕셔너리/리스트 내의 모든 NaN/Inf 값을 None으로 재귀적으로 변환"""
    if isinstance(obj, dict):
        return {k: clean_dict_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_dict_for_json(item) for item in obj]
    elif isinstance(obj, (int, float)):
        if pd.isna(obj) or np.isinf(obj):
            return None
        return obj
    else:
        return obj

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

# Prophet 예측 파일들 로드
print("\nProphet 예측 데이터 로딩 중...")
prophet_files = {
    'overall': 'prophet_forecast_overall.csv',
    'category': 'prophet_forecast_by_category.csv',
    'brand': 'prophet_forecast_by_brand.csv',
    'product': 'prophet_forecast_by_product.csv',
    'gender': 'prophet_forecast_by_gender.csv',
    'age': 'prophet_forecast_by_age.csv',
    'platform': 'prophet_forecast_by_platform.csv',
    'promotion': 'prophet_forecast_by_promotion.csv',
    'age_gender': 'prophet_forecast_by_age_gender.csv'
}

prophet_forecasts = {}
for key, filename in prophet_files.items():
    file_path = data_dir / filename
    if file_path.exists():
        prophet_forecasts[key] = pd.read_csv(file_path)
        prophet_forecasts[key]['일자'] = pd.to_datetime(prophet_forecasts[key]['일자'])
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
print("성별 인사이트 생성 중...")

gender_insights = []
if 'type4' in dimensions:
    type4_df = dimensions['type4'].copy()

    # 성별 정규화 및 알수없음 필터링
    type4_df['성별_정규화'] = type4_df['성별'].apply(normalize_gender)
    type4_df = type4_df[type4_df['성별_정규화'].notna()]

    # 성별별 집계
    gender_summary = type4_df.groupby('성별_정규화').agg({
        '비용': 'sum',
        '전환수': 'sum',
        '전환값': 'sum',
        'ROAS': 'mean'
    }).reset_index()

    # 성별별 성과가 있는 것만
    gender_summary = gender_summary[gender_summary['전환수'] > 0]

    for _, row in gender_summary.iterrows():
        gender_name = row['성별_정규화']
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
    type2_df = dimensions['type2'].copy()

    # 성별 정규화 및 알수없음 필터링
    type2_df['성별_정규화'] = type2_df['성별'].apply(normalize_gender)
    type2_df = type2_df[type2_df['성별_정규화'].notna()]

    # 연령 알수없음 필터링
    type2_df = type2_df[type2_df['연령'].apply(is_valid_age)]

    # 광고세트별 최고 성과 연령x성별 조합 찾기
    top_combinations = type2_df.nlargest(5, 'ROAS')

    for _, row in top_combinations.iterrows():
        age_gender_insights.append({
            "adset": row['광고세트'],
            "age": row['연령'],
            "gender": row['성별_정규화'],
            "roas": float(row['ROAS']),
            "conversions": float(row['전환수']),
            "recommendation": f"{row['연령']} {row['성별_정규화']} 타겟팅이 효과적입니다"
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
# 시계열 분석 - 월별 트렌드
# ============================================================================
print("월별 트렌드 분석 중...")

monthly_trend = []
monthly_growth = []
if 'type1' in dimensions:
    type1_df = dimensions['type1']

    if '월' in type1_df.columns:
        monthly_summary = type1_df.groupby('월').agg({
            '비용': 'sum',
            '클릭': 'sum',
            '전환수': 'sum',
            '전환값': 'sum'
        }).reset_index()

        monthly_summary['ROAS'] = (monthly_summary['전환값'] / monthly_summary['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
        monthly_summary['CPA'] = (monthly_summary['비용'] / monthly_summary['전환수']).replace([np.inf, -np.inf], 0).fillna(0)
        monthly_summary = monthly_summary.sort_values('월')

        for _, row in monthly_summary.iterrows():
            monthly_trend.append({
                "month": row['월'],
                "cost": float(row['비용']),
                "clicks": float(row['클릭']),
                "conversions": float(row['전환수']),
                "revenue": float(row['전환값']),
                "roas": float(row['ROAS']),
                "cpa": float(row['CPA'])
            })

        # 월별 성장률 계산
        if len(monthly_summary) >= 2:
            for i in range(1, len(monthly_summary)):
                prev = monthly_summary.iloc[i-1]
                curr = monthly_summary.iloc[i]

                revenue_growth = ((curr['전환값'] - prev['전환값']) / prev['전환값'] * 100) if prev['전환값'] > 0 else 0
                cost_growth = ((curr['비용'] - prev['비용']) / prev['비용'] * 100) if prev['비용'] > 0 else 0
                roas_change = curr['ROAS'] - prev['ROAS']

                monthly_growth.append({
                    "month": curr['월'],
                    "prev_month": prev['월'],
                    "revenue_growth_pct": float(revenue_growth),
                    "cost_growth_pct": float(cost_growth),
                    "roas_change": float(roas_change),
                    "trend": "상승" if revenue_growth > 10 else "하락" if revenue_growth < -10 else "유지"
                })

# ============================================================================
# 시계열 분석 - 주별 트렌드
# ============================================================================
print("주별 트렌드 분석 중...")

weekly_trend = []
weekly_growth = []
if 'type1' in dimensions:
    type1_df = dimensions['type1']

    if '주' in type1_df.columns:
        weekly_summary = type1_df.groupby('주').agg({
            '비용': 'sum',
            '클릭': 'sum',
            '전환수': 'sum',
            '전환값': 'sum'
        }).reset_index()

        weekly_summary['ROAS'] = (weekly_summary['전환값'] / weekly_summary['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
        weekly_summary['CPA'] = (weekly_summary['비용'] / weekly_summary['전환수']).replace([np.inf, -np.inf], 0).fillna(0)
        weekly_summary = weekly_summary.sort_values('주')

        # 최근 12주 저장
        recent_weeks = weekly_summary.tail(12)
        for _, row in recent_weeks.iterrows():
            weekly_trend.append({
                "week": row['주'],
                "cost": float(row['비용']),
                "clicks": float(row['클릭']),
                "conversions": float(row['전환수']),
                "revenue": float(row['전환값']),
                "roas": float(row['ROAS']),
                "cpa": float(row['CPA'])
            })

        # 주별 성장률 계산
        if len(weekly_summary) >= 2:
            for i in range(1, len(weekly_summary)):
                prev = weekly_summary.iloc[i-1]
                curr = weekly_summary.iloc[i]

                revenue_growth = ((curr['전환값'] - prev['전환값']) / prev['전환값'] * 100) if prev['전환값'] > 0 else 0
                cost_growth = ((curr['비용'] - prev['비용']) / prev['비용'] * 100) if prev['비용'] > 0 else 0
                roas_change = curr['ROAS'] - prev['ROAS']

                weekly_growth.append({
                    "week": curr['주'],
                    "prev_week": prev['주'],
                    "revenue_growth_pct": float(revenue_growth),
                    "cost_growth_pct": float(cost_growth),
                    "roas_change": float(roas_change),
                    "trend": "상승" if revenue_growth > 10 else "하락" if revenue_growth < -10 else "유지"
                })

# ============================================================================
# 시계열 분석 - 브랜드별 주별 트렌드
# ============================================================================
print("브랜드별 주별 트렌드 분석 중...")

brand_weekly_trend = []
if 'type1' in dimensions:
    type1_df = dimensions['type1']

    if '주' in type1_df.columns and '브랜드명' in type1_df.columns:
        brand_weekly = type1_df.groupby(['브랜드명', '주']).agg({
            '비용': 'sum',
            '전환수': 'sum',
            '전환값': 'sum'
        }).reset_index()

        brand_weekly['ROAS'] = (brand_weekly['전환값'] / brand_weekly['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)

        # 브랜드별로 주별 데이터 정리
        for brand in brand_weekly['브랜드명'].unique():
            if brand == '-':
                continue
            brand_data = brand_weekly[brand_weekly['브랜드명'] == brand].sort_values('주')

            # 최근 8주만
            brand_data_recent = brand_data.tail(8)

            if len(brand_data_recent) >= 2:
                first_week = brand_data_recent.iloc[0]
                last_week = brand_data_recent.iloc[-1]

                total_growth = ((last_week['전환값'] - first_week['전환값']) / first_week['전환값'] * 100) if first_week['전환값'] > 0 else 0

                brand_weekly_trend.append({
                    "brand": brand,
                    "weeks_data": brand_data_recent[['주', '비용', '전환수', '전환값', 'ROAS']].to_dict('records'),
                    "total_growth_pct": float(total_growth),
                    "trend": "성장" if total_growth > 20 else "하락" if total_growth < -20 else "안정"
                })

# ============================================================================
# 시계열 분석 - 상품별 주별 트렌드
# ============================================================================
print("상품별 주별 트렌드 분석 중...")

product_weekly_trend = []
if 'type1' in dimensions:
    type1_df = dimensions['type1']

    if '주' in type1_df.columns and '상품명' in type1_df.columns:
        product_weekly = type1_df.groupby(['상품명', '주']).agg({
            '비용': 'sum',
            '전환수': 'sum',
            '전환값': 'sum'
        }).reset_index()

        product_weekly['ROAS'] = (product_weekly['전환값'] / product_weekly['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)

        # 상품별로 주별 데이터 정리
        for product in product_weekly['상품명'].unique():
            if product == '-':
                continue
            product_data = product_weekly[product_weekly['상품명'] == product].sort_values('주')

            # 최근 8주만
            product_data_recent = product_data.tail(8)

            if len(product_data_recent) >= 2:
                first_week = product_data_recent.iloc[0]
                last_week = product_data_recent.iloc[-1]

                total_growth = ((last_week['전환값'] - first_week['전환값']) / first_week['전환값'] * 100) if first_week['전환값'] > 0 else 0

                product_weekly_trend.append({
                    "product": product,
                    "weeks_data": product_data_recent[['주', '비용', '전환수', '전환값', 'ROAS']].to_dict('records'),
                    "total_growth_pct": float(total_growth),
                    "trend": "성장" if total_growth > 20 else "하락" if total_growth < -20 else "안정"
                })

# ============================================================================
# 시계열 분석 - 성별 주별 트렌드
# ============================================================================
print("성별 주별 트렌드 분석 중...")

gender_weekly_trend = []
if 'type4' in dimensions:
    type4_df = dimensions['type4'].copy()

    # 성별 정규화 및 알수없음 필터링
    type4_df['성별_정규화'] = type4_df['성별'].apply(normalize_gender)
    type4_df = type4_df[type4_df['성별_정규화'].notna()]

    if '주' in type4_df.columns:
        gender_weekly = type4_df.groupby(['성별_정규화', '주']).agg({
            '비용': 'sum',
            '전환수': 'sum',
            '전환값': 'sum'
        }).reset_index()

        gender_weekly['ROAS'] = (gender_weekly['전환값'] / gender_weekly['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)

        for gender in gender_weekly['성별_정규화'].unique():
            gender_data = gender_weekly[gender_weekly['성별_정규화'] == gender].sort_values('주')
            gender_data_recent = gender_data.tail(8)

            gender_weekly_trend.append({
                "gender": gender,
                "weeks_data": gender_data_recent[['주', '비용', '전환수', '전환값', 'ROAS']].to_dict('records')
            })

# ============================================================================
# 시계열 분석 - 연령별 주별 트렌드
# ============================================================================
print("연령별 주별 트렌드 분석 중...")

age_weekly_trend = []
if 'type3' in dimensions:
    type3_df = dimensions['type3'].copy()

    # 연령 알수없음 필터링
    type3_df = type3_df[type3_df['연령'].apply(is_valid_age)]

    if '주' in type3_df.columns:
        age_weekly = type3_df.groupby(['연령', '주']).agg({
            '비용': 'sum',
            '전환수': 'sum',
            '전환값': 'sum'
        }).reset_index()

        age_weekly['ROAS'] = (age_weekly['전환값'] / age_weekly['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)

        for age in age_weekly['연령'].unique():
            age_data = age_weekly[age_weekly['연령'] == age].sort_values('주')
            age_data_recent = age_data.tail(8)

            age_weekly_trend.append({
                "age": age,
                "weeks_data": age_data_recent[['주', '비용', '전환수', '전환값', 'ROAS']].to_dict('records')
            })

# ============================================================================
# 시계열 분석 - 브랜드별 월별 트렌드
# ============================================================================
print("브랜드별 월별 트렌드 분석 중...")

brand_monthly_trend = []
if 'type1' in dimensions:
    type1_df = dimensions['type1']

    if '월' in type1_df.columns and '브랜드명' in type1_df.columns:
        brand_monthly = type1_df.groupby(['브랜드명', '월']).agg({
            '비용': 'sum',
            '전환수': 'sum',
            '전환값': 'sum'
        }).reset_index()

        brand_monthly['ROAS'] = (brand_monthly['전환값'] / brand_monthly['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)

        # 브랜드별로 월별 데이터 정리
        for brand in brand_monthly['브랜드명'].unique():
            if brand == '-':
                continue
            brand_data = brand_monthly[brand_monthly['브랜드명'] == brand].sort_values('월')

            if len(brand_data) >= 2:
                first_month = brand_data.iloc[0]
                last_month = brand_data.iloc[-1]

                total_growth = ((last_month['전환값'] - first_month['전환값']) / first_month['전환값'] * 100) if first_month['전환값'] > 0 else 0

                brand_monthly_trend.append({
                    "brand": brand,
                    "months_data": brand_data[['월', '비용', '전환수', '전환값', 'ROAS']].to_dict('records'),
                    "total_growth_pct": float(total_growth),
                    "trend": "성장" if total_growth > 20 else "하락" if total_growth < -20 else "안정"
                })

# ============================================================================
# 시계열 분석 - 상품별 월별 트렌드
# ============================================================================
print("상품별 월별 트렌드 분석 중...")

product_monthly_trend = []
if 'type1' in dimensions:
    type1_df = dimensions['type1']

    if '월' in type1_df.columns and '상품명' in type1_df.columns:
        product_monthly = type1_df.groupby(['상품명', '월']).agg({
            '비용': 'sum',
            '전환수': 'sum',
            '전환값': 'sum'
        }).reset_index()

        product_monthly['ROAS'] = (product_monthly['전환값'] / product_monthly['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)

        # 상품별로 월별 데이터 정리
        for product in product_monthly['상품명'].unique():
            if product == '-':
                continue
            product_data = product_monthly[product_monthly['상품명'] == product].sort_values('월')

            if len(product_data) >= 2:
                first_month = product_data.iloc[0]
                last_month = product_data.iloc[-1]

                total_growth = ((last_month['전환값'] - first_month['전환값']) / first_month['전환값'] * 100) if first_month['전환값'] > 0 else 0

                product_monthly_trend.append({
                    "product": product,
                    "months_data": product_data[['월', '비용', '전환수', '전환값', 'ROAS']].to_dict('records'),
                    "total_growth_pct": float(total_growth),
                    "trend": "성장" if total_growth > 20 else "하락" if total_growth < -20 else "안정"
                })

# ============================================================================
# 시계열 분석 - 성별 월별 트렌드
# ============================================================================
print("성별 월별 트렌드 분석 중...")

gender_monthly_trend = []
if 'type4' in dimensions:
    type4_df = dimensions['type4'].copy()

    # 성별 정규화 및 알수없음 필터링
    type4_df['성별_정규화'] = type4_df['성별'].apply(normalize_gender)
    type4_df = type4_df[type4_df['성별_정규화'].notna()]

    if '월' in type4_df.columns:
        gender_monthly = type4_df.groupby(['성별_정규화', '월']).agg({
            '비용': 'sum',
            '전환수': 'sum',
            '전환값': 'sum'
        }).reset_index()

        gender_monthly['ROAS'] = (gender_monthly['전환값'] / gender_monthly['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)

        for gender in gender_monthly['성별_정규화'].unique():
            gender_data = gender_monthly[gender_monthly['성별_정규화'] == gender].sort_values('월')

            gender_monthly_trend.append({
                "gender": gender,
                "months_data": gender_data[['월', '비용', '전환수', '전환값', 'ROAS']].to_dict('records')
            })

# ============================================================================
# 시계열 분석 - 연령별 월별 트렌드
# ============================================================================
print("연령별 월별 트렌드 분석 중...")

age_monthly_trend = []
if 'type3' in dimensions:
    type3_df = dimensions['type3'].copy()

    # 연령 알수없음 필터링
    type3_df = type3_df[type3_df['연령'].apply(is_valid_age)]

    if '월' in type3_df.columns:
        age_monthly = type3_df.groupby(['연령', '월']).agg({
            '비용': 'sum',
            '전환수': 'sum',
            '전환값': 'sum'
        }).reset_index()

        age_monthly['ROAS'] = (age_monthly['전환값'] / age_monthly['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)

        for age in age_monthly['연령'].unique():
            age_data = age_monthly[age_monthly['연령'] == age].sort_values('월')

            age_monthly_trend.append({
                "age": age,
                "months_data": age_data[['월', '비용', '전환수', '전환값', 'ROAS']].to_dict('records')
            })

# ============================================================================
# Prophet 예측 기반 인사이트
# ============================================================================
print("\nProphet 예측 인사이트 생성 중...")

# 전체 예측 요약
forecast_summary = {}
if 'overall' in prophet_forecasts:
    overall_df = prophet_forecasts['overall']
    forecast_summary['overall'] = {
        "forecast_period": {
            "start_date": overall_df['일자'].min().strftime('%Y-%m-%d'),
            "end_date": overall_df['일자'].max().strftime('%Y-%m-%d'),
            "total_days": len(overall_df)
        },
        "total_forecast_revenue": float(overall_df['예측_전환값'].sum()),
        "avg_daily_forecast": float(overall_df['예측_전환값'].mean()),
        "avg_forecast_roas": float(overall_df['예측_ROAS'].mean()) if '예측_ROAS' in overall_df.columns else 0,
        "avg_forecast_cpa": float(overall_df['예측_CPA'].mean()) if '예측_CPA' in overall_df.columns else 0,
        "total_forecast_cost": float(overall_df['예측_비용'].sum()) if '예측_비용' in overall_df.columns else 0,
        "total_forecast_conversions": float(overall_df['예측_전환수'].sum()) if '예측_전환수' in overall_df.columns else 0
    }

# 유형구분별 예측
category_forecast_insights = []
if 'category' in prophet_forecasts:
    cat_df = prophet_forecasts['category']
    for category in cat_df['유형구분'].unique():
        cat_data = cat_df[cat_df['유형구분'] == category]
        total_forecast = cat_data['예측_전환값'].sum()
        avg_forecast = cat_data['예측_전환값'].mean()

        # 첫 주 vs 마지막 주 비교로 트렌드 파악
        first_week = cat_data.head(7)['예측_전환값'].mean()
        last_week = cat_data.tail(7)['예측_전환값'].mean()
        trend_direction = "상승" if last_week > first_week * 1.1 else "하락" if last_week < first_week * 0.9 else "유지"

        category_forecast_insights.append({
            "category": category,
            "total_30day_forecast": float(total_forecast),
            "avg_daily_forecast": float(avg_forecast),
            "trend_direction": trend_direction,
            "first_week_avg": float(first_week),
            "last_week_avg": float(last_week),
            "avg_forecast_roas": float(cat_data['예측_ROAS'].mean()) if '예측_ROAS' in cat_data.columns else 0,
            "avg_forecast_cpa": float(cat_data['예측_CPA'].mean()) if '예측_CPA' in cat_data.columns else 0
        })

# 브랜드별 예측
brand_forecast_insights = []
if 'brand' in prophet_forecasts:
    brand_df = prophet_forecasts['brand']
    for brand in brand_df['브랜드명'].unique():
        brand_data = brand_df[brand_df['브랜드명'] == brand]
        total_forecast = brand_data['예측_전환값'].sum()
        avg_forecast = brand_data['예측_전환값'].mean()

        brand_forecast_insights.append({
            "brand": brand,
            "total_30day_forecast": float(total_forecast),
            "avg_daily_forecast": float(avg_forecast),
            "avg_forecast_roas": float(brand_data['예측_ROAS'].mean()) if '예측_ROAS' in brand_data.columns else 0,
            "avg_forecast_cpa": float(brand_data['예측_CPA'].mean()) if '예측_CPA' in brand_data.columns else 0,
            "total_forecast_cost": float(brand_data['예측_비용'].sum()) if '예측_비용' in brand_data.columns else 0
        })

    # 예측 매출 기준 정렬
    brand_forecast_insights = sorted(brand_forecast_insights, key=lambda x: x['total_30day_forecast'], reverse=True)

# 상품별 예측
product_forecast_insights = []
if 'product' in prophet_forecasts:
    product_df = prophet_forecasts['product']
    for product in product_df['상품명'].unique():
        product_data = product_df[product_df['상품명'] == product]
        total_forecast = product_data['예측_전환값'].sum()
        avg_forecast = product_data['예측_전환값'].mean()

        product_forecast_insights.append({
            "product": product,
            "total_30day_forecast": float(total_forecast),
            "avg_daily_forecast": float(avg_forecast),
            "avg_forecast_roas": float(product_data['예측_ROAS'].mean()) if '예측_ROAS' in product_data.columns else 0,
            "avg_forecast_cpa": float(product_data['예측_CPA'].mean()) if '예측_CPA' in product_data.columns else 0,
            "total_forecast_cost": float(product_data['예측_비용'].sum()) if '예측_비용' in product_data.columns else 0
        })

    product_forecast_insights = sorted(product_forecast_insights, key=lambda x: x['total_30day_forecast'], reverse=True)

# 성별 예측
gender_forecast_insights = []
if 'gender' in prophet_forecasts:
    gender_df = prophet_forecasts['gender'].copy()

    # 성별 정규화 및 알수없음 필터링
    gender_df['성별_정규화'] = gender_df['성별'].apply(normalize_gender)
    gender_df = gender_df[gender_df['성별_정규화'].notna()]

    for gender in gender_df['성별_정규화'].unique():
        gender_data = gender_df[gender_df['성별_정규화'] == gender]
        total_forecast = gender_data['예측_전환값'].sum()
        avg_forecast = gender_data['예측_전환값'].mean()

        gender_forecast_insights.append({
            "gender": gender,
            "total_30day_forecast": float(total_forecast),
            "avg_daily_forecast": float(avg_forecast),
            "avg_forecast_roas": float(gender_data['예측_ROAS'].mean()) if '예측_ROAS' in gender_data.columns else 0,
            "avg_forecast_cpa": float(gender_data['예측_CPA'].mean()) if '예측_CPA' in gender_data.columns else 0,
            "total_forecast_cost": float(gender_data['예측_비용'].sum()) if '예측_비용' in gender_data.columns else 0
        })

    gender_forecast_insights = sorted(gender_forecast_insights, key=lambda x: x['total_30day_forecast'], reverse=True)

# 연령별 예측
age_forecast_insights = []
if 'age' in prophet_forecasts:
    age_df = prophet_forecasts['age'].copy()

    # 연령 알수없음 필터링
    age_df = age_df[age_df['연령'].apply(is_valid_age)]

    for age in age_df['연령'].unique():
        age_data = age_df[age_df['연령'] == age]
        total_forecast = age_data['예측_전환값'].sum()
        avg_forecast = age_data['예측_전환값'].mean()

        age_forecast_insights.append({
            "age": age,
            "total_30day_forecast": float(total_forecast),
            "avg_daily_forecast": float(avg_forecast),
            "avg_forecast_roas": float(age_data['예측_ROAS'].mean()) if '예측_ROAS' in age_data.columns else 0,
            "avg_forecast_cpa": float(age_data['예측_CPA'].mean()) if '예측_CPA' in age_data.columns else 0,
            "total_forecast_cost": float(age_data['예측_비용'].sum()) if '예측_비용' in age_data.columns else 0
        })

    age_forecast_insights = sorted(age_forecast_insights, key=lambda x: x['total_30day_forecast'], reverse=True)

# 기기플랫폼별 예측
platform_forecast_insights = []
if 'platform' in prophet_forecasts:
    platform_df = prophet_forecasts['platform']
    for platform in platform_df['기기플랫폼'].unique():
        platform_data = platform_df[platform_df['기기플랫폼'] == platform]
        total_forecast = platform_data['예측_전환값'].sum()
        avg_forecast = platform_data['예측_전환값'].mean()

        platform_forecast_insights.append({
            "platform": platform,
            "total_30day_forecast": float(total_forecast),
            "avg_daily_forecast": float(avg_forecast),
            "avg_forecast_roas": float(platform_data['예측_ROAS'].mean()) if '예측_ROAS' in platform_data.columns else 0,
            "avg_forecast_cpa": float(platform_data['예측_CPA'].mean()) if '예측_CPA' in platform_data.columns else 0,
            "total_forecast_cost": float(platform_data['예측_비용'].sum()) if '예측_비용' in platform_data.columns else 0
        })

    platform_forecast_insights = sorted(platform_forecast_insights, key=lambda x: x['total_30day_forecast'], reverse=True)

# 프로모션별 예측
promotion_forecast_insights = []
if 'promotion' in prophet_forecasts:
    promotion_df = prophet_forecasts['promotion']
    for promotion in promotion_df['프로모션'].unique():
        promotion_data = promotion_df[promotion_df['프로모션'] == promotion]
        total_forecast = promotion_data['예측_전환값'].sum()
        avg_forecast = promotion_data['예측_전환값'].mean()

        promotion_forecast_insights.append({
            "promotion": promotion,
            "total_30day_forecast": float(total_forecast),
            "avg_daily_forecast": float(avg_forecast),
            "avg_forecast_roas": float(promotion_data['예측_ROAS'].mean()) if '예측_ROAS' in promotion_data.columns else 0,
            "avg_forecast_cpa": float(promotion_data['예측_CPA'].mean()) if '예측_CPA' in promotion_data.columns else 0,
            "total_forecast_cost": float(promotion_data['예측_비용'].sum()) if '예측_비용' in promotion_data.columns else 0
        })

    promotion_forecast_insights = sorted(promotion_forecast_insights, key=lambda x: x['total_30day_forecast'], reverse=True)

# 연령+성별 조합별 예측
age_gender_forecast_insights = []
if 'age_gender' in prophet_forecasts:
    age_gender_df = prophet_forecasts['age_gender']
    for age_gender in age_gender_df['연령_성별'].unique():
        age_gender_data = age_gender_df[age_gender_df['연령_성별'] == age_gender]
        total_forecast = age_gender_data['예측_전환값'].sum()
        avg_forecast = age_gender_data['예측_전환값'].mean()

        # 연령과 성별 분리
        parts = age_gender.split('_')
        age_part = parts[0] if len(parts) >= 1 else age_gender
        gender_part = parts[1] if len(parts) >= 2 else ''

        age_gender_forecast_insights.append({
            "age_gender": age_gender,
            "age": age_part,
            "gender": gender_part,
            "total_30day_forecast": float(total_forecast),
            "avg_daily_forecast": float(avg_forecast),
            "avg_forecast_roas": float(age_gender_data['예측_ROAS'].mean()) if '예측_ROAS' in age_gender_data.columns else 0,
            "avg_forecast_cpa": float(age_gender_data['예측_CPA'].mean()) if '예측_CPA' in age_gender_data.columns else 0,
            "total_forecast_cost": float(age_gender_data['예측_비용'].sum()) if '예측_비용' in age_gender_data.columns else 0,
            "total_forecast_conversions": float(age_gender_data['예측_전환수'].sum()) if '예측_전환수' in age_gender_data.columns else 0
        })

    age_gender_forecast_insights = sorted(age_gender_forecast_insights, key=lambda x: x['total_30day_forecast'], reverse=True)

# Prophet 예측 기반 알림 생성
prophet_alerts = []

# 1. 전체 예측 대비 현재 성과 비교
if 'overall' in prophet_forecasts and len(daily_summary) >= 7:
    recent_7days_actual = daily_summary.tail(7)['전환값'].mean()
    forecast_7days = prophet_forecasts['overall'].head(7)['예측_전환값'].mean()

    if forecast_7days > 0:
        performance_ratio = (recent_7days_actual / forecast_7days - 1) * 100
        if performance_ratio > 20:
            prophet_alerts.append({
                "type": "forecast_overperformance",
                "message": f"최근 7일 실적이 예측 대비 {performance_ratio:.1f}% 초과 달성 중입니다!",
                "severity": "positive",
                "value": performance_ratio
            })
        elif performance_ratio < -20:
            prophet_alerts.append({
                "type": "forecast_underperformance",
                "message": f"최근 7일 실적이 예측 대비 {abs(performance_ratio):.1f}% 미달입니다. 캠페인 점검이 필요합니다.",
                "severity": "warning",
                "value": performance_ratio
            })

# 2. 브랜드별 예측 기반 알림
if len(brand_forecast_insights) > 0:
    top_forecast_brand = brand_forecast_insights[0]
    if top_forecast_brand['total_30day_forecast'] > 0:
        prophet_alerts.append({
            "type": "brand_forecast_leader",
            "message": f"{top_forecast_brand['brand']} 브랜드가 향후 30일간 {top_forecast_brand['total_30day_forecast']:,.0f}원의 매출이 예상됩니다.",
            "severity": "opportunity",
            "brand": top_forecast_brand['brand'],
            "value": top_forecast_brand['total_30day_forecast']
        })

# 3. 성별 예측 기반 타겟팅 추천
if len(gender_forecast_insights) >= 2:
    sorted_gender_forecast = sorted(gender_forecast_insights, key=lambda x: x['total_30day_forecast'], reverse=True)
    best_gender_forecast = sorted_gender_forecast[0]
    if best_gender_forecast['total_30day_forecast'] > 0:
        prophet_alerts.append({
            "type": "gender_forecast_opportunity",
            "message": f"{best_gender_forecast['gender']} 타겟이 향후 30일간 가장 높은 전환값({best_gender_forecast['total_30day_forecast']:,.0f}원)이 예상됩니다.",
            "severity": "opportunity",
            "gender": best_gender_forecast['gender'],
            "value": best_gender_forecast['total_30day_forecast']
        })

# 4. 연령별 예측 기반 알림
if len(age_forecast_insights) > 0:
    top_age_forecast = age_forecast_insights[0]
    if top_age_forecast['total_30day_forecast'] > 0:
        prophet_alerts.append({
            "type": "age_forecast_opportunity",
            "message": f"{top_age_forecast['age']} 연령대가 향후 30일간 {top_age_forecast['total_30day_forecast']:,.0f}원의 전환값이 예상됩니다.",
            "severity": "opportunity",
            "age": top_age_forecast['age'],
            "value": top_age_forecast['total_30day_forecast']
        })

# 5. 연령+성별 조합 예측 기반 알림
if len(age_gender_forecast_insights) > 0:
    top_age_gender_forecast = age_gender_forecast_insights[0]
    if top_age_gender_forecast['total_30day_forecast'] > 0:
        prophet_alerts.append({
            "type": "age_gender_forecast_opportunity",
            "message": f"{top_age_gender_forecast['age']} {top_age_gender_forecast['gender']} 타겟이 향후 30일간 {top_age_gender_forecast['total_30day_forecast']:,.0f}원의 전환값이 예상됩니다.",
            "severity": "opportunity",
            "age_gender": top_age_gender_forecast['age_gender'],
            "age": top_age_gender_forecast['age'],
            "gender": top_age_gender_forecast['gender'],
            "value": top_age_gender_forecast['total_30day_forecast']
        })

# Prophet 예측 기반 추천사항
prophet_recommendations = []

# 1. 브랜드 집중 투자 추천
if len(brand_forecast_insights) >= 2:
    top_brands = brand_forecast_insights[:3]
    brand_names = [b['brand'] for b in top_brands]
    total_top_forecast = sum(b['total_30day_forecast'] for b in top_brands)

    if total_top_forecast > 0:
        prophet_recommendations.append({
            "title": "브랜드 집중 투자 전략 (예측 기반)",
            "description": f"향후 30일 예측 매출 상위 브랜드: {', '.join(brand_names)}. 해당 브랜드에 마케팅 예산을 집중하세요.",
            "priority": "high",
            "expected_impact": f"예상 총 매출: {total_top_forecast:,.0f}원",
            "based_on": "prophet_forecast"
        })

# 2. 상품 포트폴리오 추천
if len(product_forecast_insights) >= 2:
    top_products = product_forecast_insights[:3]
    product_names = [p['product'] for p in top_products]

    prophet_recommendations.append({
        "title": "상품 포트폴리오 최적화 (예측 기반)",
        "description": f"향후 30일 예측 매출 상위 상품: {', '.join(product_names)}. 재고 확보 및 광고 강화를 추천합니다.",
        "priority": "high",
        "expected_impact": "매출 극대화 기대",
        "based_on": "prophet_forecast"
    })

# 3. 타겟팅 최적화 추천 (성별 + 연령)
if len(gender_forecast_insights) > 0 and len(age_forecast_insights) > 0:
    best_gender = gender_forecast_insights[0]['gender'] if gender_forecast_insights[0]['total_30day_forecast'] > 0 else None
    best_age = age_forecast_insights[0]['age'] if age_forecast_insights[0]['total_30day_forecast'] > 0 else None

    if best_gender and best_age:
        prophet_recommendations.append({
            "title": "타겟 오디언스 최적화 (예측 기반)",
            "description": f"예측 분석 결과, {best_age} {best_gender} 타겟이 가장 높은 전환이 예상됩니다. 해당 타겟 광고 비중을 확대하세요.",
            "priority": "medium",
            "expected_impact": "전환율 15-25% 개선 예상",
            "based_on": "prophet_forecast"
        })

# 4. 플랫폼 최적화 추천
if len(platform_forecast_insights) > 0:
    best_platform = platform_forecast_insights[0]
    if best_platform['total_30day_forecast'] > 0:
        prophet_recommendations.append({
            "title": "플랫폼 집중 전략 (예측 기반)",
            "description": f"{best_platform['platform']} 플랫폼에서 향후 30일간 {best_platform['total_30day_forecast']:,.0f}원의 전환이 예상됩니다. 해당 플랫폼 광고에 집중하세요.",
            "priority": "medium",
            "expected_impact": "ROAS 10-20% 개선 예상",
            "based_on": "prophet_forecast"
        })

# 5. 연령+성별 조합 타겟팅 추천
if len(age_gender_forecast_insights) >= 3:
    top_age_gender_combos = age_gender_forecast_insights[:3]
    combo_names = [f"{c['age']} {c['gender']}" for c in top_age_gender_combos]
    total_top_combo_forecast = sum(c['total_30day_forecast'] for c in top_age_gender_combos)

    if total_top_combo_forecast > 0:
        prophet_recommendations.append({
            "title": "연령+성별 타겟팅 최적화 (예측 기반)",
            "description": f"향후 30일 예측 매출 상위 타겟: {', '.join(combo_names)}. 해당 타겟에 광고 예산을 집중 배분하세요.",
            "priority": "high",
            "expected_impact": f"예상 총 매출: {total_top_combo_forecast:,.0f}원",
            "based_on": "prophet_forecast"
        })

# ============================================================================
# 시계열 인사이트 생성
# ============================================================================
print("시계열 인사이트 생성 중...")

timeseries_insights = []

# 최근 월 성장률 기반 인사이트
if len(monthly_growth) > 0:
    latest_growth = monthly_growth[-1]
    if latest_growth['revenue_growth_pct'] > 20:
        timeseries_insights.append({
            "type": "revenue_surge",
            "message": f"{latest_growth['month']} 매출이 전월 대비 {latest_growth['revenue_growth_pct']:.1f}% 급증했습니다!",
            "severity": "positive",
            "value": latest_growth['revenue_growth_pct']
        })
    elif latest_growth['revenue_growth_pct'] < -20:
        timeseries_insights.append({
            "type": "revenue_drop",
            "message": f"{latest_growth['month']} 매출이 전월 대비 {abs(latest_growth['revenue_growth_pct']):.1f}% 감소했습니다. 원인 분석이 필요합니다.",
            "severity": "warning",
            "value": latest_growth['revenue_growth_pct']
        })

# 브랜드 성장 인사이트
growing_brands = [b for b in brand_monthly_trend if b['trend'] == '성장']
if len(growing_brands) > 0:
    best_growing = max(growing_brands, key=lambda x: x['total_growth_pct'])
    timeseries_insights.append({
        "type": "brand_growth",
        "message": f"{best_growing['brand']} 브랜드가 {best_growing['total_growth_pct']:.1f}% 성장하여 가장 높은 성장률을 보이고 있습니다.",
        "severity": "opportunity",
        "brand": best_growing['brand'],
        "value": best_growing['total_growth_pct']
    })

# 상품 성장 인사이트
growing_products = [p for p in product_monthly_trend if p['trend'] == '성장']
if len(growing_products) > 0:
    best_growing_product = max(growing_products, key=lambda x: x['total_growth_pct'])
    timeseries_insights.append({
        "type": "product_growth",
        "message": f"{best_growing_product['product']} 상품이 {best_growing_product['total_growth_pct']:.1f}% 성장 중입니다. 마케팅 강화를 추천합니다.",
        "severity": "opportunity",
        "product": best_growing_product['product'],
        "value": best_growing_product['total_growth_pct']
    })

# 최근 주 성장률 기반 인사이트
if len(weekly_growth) > 0:
    latest_weekly = weekly_growth[-1]
    if latest_weekly['revenue_growth_pct'] > 30:
        timeseries_insights.append({
            "type": "weekly_revenue_surge",
            "message": f"{latest_weekly['week']} 주간 매출이 전주 대비 {latest_weekly['revenue_growth_pct']:.1f}% 급증했습니다!",
            "severity": "positive",
            "value": latest_weekly['revenue_growth_pct']
        })
    elif latest_weekly['revenue_growth_pct'] < -30:
        timeseries_insights.append({
            "type": "weekly_revenue_drop",
            "message": f"{latest_weekly['week']} 주간 매출이 전주 대비 {abs(latest_weekly['revenue_growth_pct']):.1f}% 감소했습니다. 즉각적인 점검이 필요합니다.",
            "severity": "warning",
            "value": latest_weekly['revenue_growth_pct']
        })

# 주별 브랜드 성장 인사이트
growing_brands_weekly = [b for b in brand_weekly_trend if b['trend'] == '성장']
if len(growing_brands_weekly) > 0:
    best_growing_weekly = max(growing_brands_weekly, key=lambda x: x['total_growth_pct'])
    timeseries_insights.append({
        "type": "brand_weekly_growth",
        "message": f"{best_growing_weekly['brand']} 브랜드가 최근 8주간 {best_growing_weekly['total_growth_pct']:.1f}% 성장 중입니다.",
        "severity": "opportunity",
        "brand": best_growing_weekly['brand'],
        "value": best_growing_weekly['total_growth_pct']
    })

# 주별 상품 성장 인사이트
growing_products_weekly = [p for p in product_weekly_trend if p['trend'] == '성장']
if len(growing_products_weekly) > 0:
    best_growing_product_weekly = max(growing_products_weekly, key=lambda x: x['total_growth_pct'])
    timeseries_insights.append({
        "type": "product_weekly_growth",
        "message": f"{best_growing_product_weekly['product']} 상품이 최근 8주간 {best_growing_product_weekly['total_growth_pct']:.1f}% 성장 중입니다.",
        "severity": "opportunity",
        "product": best_growing_product_weekly['product'],
        "value": best_growing_product_weekly['total_growth_pct']
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
    "timeseries": {
        "monthly_trend": monthly_trend,
        "monthly_growth": monthly_growth,
        "weekly_trend": weekly_trend,
        "weekly_growth": weekly_growth,
        "brand_monthly_trend": brand_monthly_trend[:10] if len(brand_monthly_trend) > 0 else [],
        "brand_weekly_trend": brand_weekly_trend[:10] if len(brand_weekly_trend) > 0 else [],
        "product_monthly_trend": product_monthly_trend[:10] if len(product_monthly_trend) > 0 else [],
        "product_weekly_trend": product_weekly_trend[:10] if len(product_weekly_trend) > 0 else [],
        "gender_monthly_trend": gender_monthly_trend,
        "gender_weekly_trend": gender_weekly_trend,
        "age_monthly_trend": age_monthly_trend,
        "age_weekly_trend": age_weekly_trend
    },
    "timeseries_insights": timeseries_insights,
    "prophet_forecast": {
        "summary": forecast_summary,
        "by_category": category_forecast_insights,
        "by_brand": brand_forecast_insights[:10] if len(brand_forecast_insights) > 0 else [],
        "by_product": product_forecast_insights[:10] if len(product_forecast_insights) > 0 else [],
        "by_gender": gender_forecast_insights,
        "by_age": age_forecast_insights,
        "by_platform": platform_forecast_insights,
        "by_promotion": promotion_forecast_insights[:10] if len(promotion_forecast_insights) > 0 else [],
        "by_age_gender": age_gender_forecast_insights[:10] if len(age_gender_forecast_insights) > 0 else [],
        "alerts": prophet_alerts,
        "recommendations": prophet_recommendations
    },
    "alerts": alerts + prophet_alerts,
    "recommendations": recommendations + prophet_recommendations,
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
        "alerts_count": len(alerts) + len(prophet_alerts),
        "recommendations_count": len(recommendations) + len(prophet_recommendations),
        "timeseries_insights_count": len(timeseries_insights),
        "prophet_forecast_available": len(prophet_forecasts) > 0
    }
}

# JSON 파일 저장 (NaN/Inf 값을 null로 변환)
output_file = data_dir / 'insights.json'
insights_cleaned = clean_dict_for_json(insights)
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(insights_cleaned, f, ensure_ascii=False, indent=2)

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

print("\n[시계열 분석 - 월별]")
print(f"  - 월별 트렌드: {len(monthly_trend)}개월")
print(f"  - 월별 성장률: {len(monthly_growth)}개")
print(f"  - 브랜드별 월별 트렌드: {len(brand_monthly_trend)}개")
print(f"  - 상품별 월별 트렌드: {len(product_monthly_trend)}개")
print(f"  - 성별 월별 트렌드: {len(gender_monthly_trend)}개")
print(f"  - 연령별 월별 트렌드: {len(age_monthly_trend)}개")

print("\n[시계열 분석 - 주별]")
print(f"  - 주별 트렌드: {len(weekly_trend)}주")
print(f"  - 주별 성장률: {len(weekly_growth)}개")
print(f"  - 브랜드별 주별 트렌드: {len(brand_weekly_trend)}개")
print(f"  - 상품별 주별 트렌드: {len(product_weekly_trend)}개")
print(f"  - 성별 주별 트렌드: {len(gender_weekly_trend)}개")
print(f"  - 연령별 주별 트렌드: {len(age_weekly_trend)}개")

print(f"\n[시계열 인사이트: {len(timeseries_insights)}개]")

print("\n[Prophet 예측 분석]")
print(f"  - Prophet 예측 파일 로드: {len(prophet_forecasts)}개")
if 'overall' in forecast_summary:
    print(f"  - 예측 기간: {forecast_summary['overall']['forecast_period']['start_date']} ~ {forecast_summary['overall']['forecast_period']['end_date']}")
    print(f"  - 30일 총 예측 전환값: {forecast_summary['overall']['total_forecast_revenue']:,.0f}원")
print(f"  - 유형구분별 예측: {len(category_forecast_insights)}개")
print(f"  - 브랜드별 예측: {len(brand_forecast_insights)}개")
print(f"  - 상품별 예측: {len(product_forecast_insights)}개")
print(f"  - 성별 예측: {len(gender_forecast_insights)}개")
print(f"  - 연령별 예측: {len(age_forecast_insights)}개")
print(f"  - 플랫폼별 예측: {len(platform_forecast_insights)}개")
print(f"  - 프로모션별 예측: {len(promotion_forecast_insights)}개")
print(f"  - 연령+성별 조합별 예측: {len(age_gender_forecast_insights)}개")
print(f"  - Prophet 알림: {len(prophet_alerts)}개")
print(f"  - Prophet 추천사항: {len(prophet_recommendations)}개")

print("\n" + "=" * 100)
print("인사이트 생성 완료!")
print("=" * 100)
