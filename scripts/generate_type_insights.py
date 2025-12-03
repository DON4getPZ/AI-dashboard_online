"""
Type 분석 기반 인사이트 생성

analysis_*.csv와 dimension_type*.csv 파일들을 분석하여
사용자 친화적인 인사이트를 JSON으로 생성합니다.

v2.0 업데이트:
- AI 비서 톤앤매너: 친화적인 제목과 이모지 사용
- 맥락 기반 액션: PERSONA_ACTIONS 딕셔너리를 통한 마케팅 솔루션 제공
- 우선순위(Score) 시스템: top_recommendations 상위 5개 핵심 제안
- 안전성: NpEncoder 클래스로 JSON 에러 원천 차단
"""

import pandas as pd
import numpy as np
import json
import re
import argparse
from datetime import datetime, timedelta
from pathlib import Path

# ============================================================================
# 명령줄 인자 파싱
# ============================================================================
parser = argparse.ArgumentParser(description='Type 분석 기반 인사이트 생성')
parser.add_argument('--days', type=int, default=0,
                    help='최근 N일 데이터만 사용 (0=전체기간, 30/90/180 등)')
args = parser.parse_args()

def filter_by_days(df, days, date_column='일'):
    """
    최근 N일 데이터만 필터링

    Args:
        df: DataFrame
        days: 필터링할 일수 (0이면 전체 데이터 반환)
        date_column: 날짜 컬럼명

    Returns:
        필터링된 DataFrame
    """
    if days <= 0:
        return df

    if date_column not in df.columns:
        return df

    df_copy = df.copy()
    df_copy[date_column] = pd.to_datetime(df_copy[date_column])
    max_date = df_copy[date_column].max()
    cutoff_date = max_date - timedelta(days=days)

    return df_copy[df_copy[date_column] >= cutoff_date].copy()

# ============================================================================
# 분석 임계값 설정 (업종에 맞게 튜닝 가능)
# ============================================================================
THRESHOLDS = {
    'high_roas': 500.0,      # 성과 우수 기준 (%)
    'low_roas': 100.0,       # 성과 저조 기준 (%)
    'growth_signal': 20.0,   # 급상승 기준 (%)
    'drop_signal': -20.0,    # 급락 기준 (%)
    'high_cpa': 50000,       # CPA 경고 기준 (원)
    'excellent_roas': 1000.0 # 매우 우수 기준 (%)
}

# 업종별 임계값 프리셋 (필요시 활성화)
CATEGORY_THRESHOLDS = {
    'fashion': {'high_roas': 400.0, 'low_roas': 80.0, 'high_cpa': 40000},
    'food': {'high_roas': 300.0, 'low_roas': 60.0, 'high_cpa': 20000},
    'electronics': {'high_roas': 600.0, 'low_roas': 120.0, 'high_cpa': 80000},
    'beauty': {'high_roas': 450.0, 'low_roas': 90.0, 'high_cpa': 35000}
}

# ============================================================================
# 마케팅 페르소나 매핑 (연령/성별/플랫폼별 추천 액션)
# ============================================================================
PERSONA_ACTIONS = {
    # 연령 + 성별 조합
    '20대_여성': "트렌드에 민감한 20대 여성이 반응하고 있습니다. 인스타그램 릴스나 감성적인 이미지 소재를 늘려보세요.",
    '20대_남성': "20대 남성은 유튜브와 숏폼 콘텐츠에 반응합니다. 재미있는 영상 광고나 밈 형태의 소재를 시도해보세요.",
    '30대_여성': "구매력이 높은 30대 여성입니다. 실용적인 혜택(무료배송, 1+1)을 강조하면 전환율이 오를 거예요.",
    '30대_남성': "30대 남성은 가성비와 리뷰를 중시합니다. 사용자 후기와 비교 데이터를 활용하세요.",
    '40대_여성': "40대 여성은 품질과 신뢰를 중요시합니다. 브랜드 스토리와 품질 보증을 강조하세요.",
    '40대_남성': "기능과 스펙을 중시하는 40대 남성입니다. 상세페이지에서 제품의 성능 데이터를 확실하게 보여주세요.",
    '50대_여성': "50대 여성은 건강과 웰빙에 관심이 높습니다. 제품의 안전성과 건강 혜택을 부각하세요.",
    '50대_남성': "50대 남성은 프리미엄 제품에 투자할 여력이 있습니다. 고급스러운 이미지와 A/S 보장을 강조하세요.",

    # 기기/플랫폼 기반
    '모바일_iOS': "아이폰 유저들의 구매율이 높습니다. 결제 과정이 매끄러운지(애플페이 등) 확인해보세요.",
    '모바일_Android': "안드로이드 유저가 많습니다. 다양한 결제 옵션(카카오페이, 네이버페이)을 제공하세요.",
    '데스크톱_웹': "PC 사용자는 꼼꼼히 비교하는 경향이 있습니다. 상세한 제품 정보와 리뷰를 제공하세요.",

    # 성별 단독
    '남성': "남성 타겟의 반응이 좋습니다. 간결하고 직관적인 메시지로 핵심 가치를 전달하세요.",
    '여성': "여성 타겟의 반응이 좋습니다. 감성적인 스토리텔링과 비주얼에 투자하세요."
}

# ============================================================================
# 친화적 메시지 템플릿
# ============================================================================
FRIENDLY_MESSAGES = {
    'high_roas_opportunity': {
        'title': "🎯 우리 브랜드의 찐팬은 '{target}' 입니다!",
        'message': "{target}의 ROAS가 {roas:.0f}%로 압도적입니다.",
        'action': "이번 주 광고 예산의 70%를 {target} 타겟에 집중해보세요."
    },
    'low_roas_warning': {
        'title': "⚠️ '{target}' 캠페인 점검이 필요해요",
        'message': "{target}의 ROAS가 {roas:.0f}%로 낮습니다.",
        'action': "소재를 교체하거나, 타겟팅을 좁혀보세요."
    },
    'gender_opportunity': {
        'title': "🎯 {gender} 고객이 열광하고 있어요!",
        'message': "{gender} 타겟팅의 ROAS가 {roas:.0f}%로 우수합니다.",
        'action': "{gender} 대상 광고 비중을 높이세요."
    },
    'revenue_growth': {
        'title': "📈 매출이 쑥쑥 오르고 있어요!",
        'message': "최근 30일 매출이 이전 대비 {change:.1f}% 증가했습니다!",
        'action': "현재 전략을 유지하면서 성과 요인을 분석해보세요."
    },
    'revenue_decline': {
        'title': "📉 매출이 주춤하고 있어요",
        'message': "최근 30일 매출이 이전 대비 {change:.1f}% 감소했습니다.",
        'action': "캠페인 소재와 타겟팅을 점검해주세요."
    },
    'best_day': {
        'title': "📅 황금 요일은 '{day}' 입니다!",
        'message': "{day}에는 평균적으로 {roas:.0f}%의 수익률을 기록하고 있어요.",
        'action': "{day} 전날 저녁부터 광고 입찰가를 20% 상향 조정하세요."
    },
    'worst_day': {
        'title': "💸 '{day}'에는 잠시 쉬어가도 좋아요",
        'message': "효율이 낮은 {day}에는 예산을 줄이는 게 이득입니다.",
        'action': "자동 규칙을 설정해 해당 요일 예산을 30% 감액하세요."
    },
    'forecast_positive': {
        'title': "🔮 다음 30일, 맑음이 예상됩니다!",
        'message': "AI가 분석한 결과, 약 {forecast}의 매출이 예상됩니다.",
        'action': "재고 부족이 발생하지 않도록 미리 물류를 점검해주세요."
    },
    'brand_opportunity': {
        'title': "⭐ '{brand}' 브랜드가 대세예요!",
        'message': "{brand} 브랜드의 ROAS가 {roas:.0f}%로 가장 높습니다.",
        'action': "해당 브랜드 광고 비중을 확대하세요."
    },
    'product_opportunity': {
        'title': "🚀 라이징 스타: '{product}'",
        'message': "{product} 상품의 ROAS가 {roas:.0f}%로 가장 효율적입니다.",
        'action': "이 상품을 메인 배너 가장 잘 보이는 곳에 배치하세요."
    }
}

# ============================================================================
# 성별/연령 데이터 정규화 및 필터링 함수
# (CSV에 성별_통합, 연령_통합 컬럼이 있으면 해당 컬럼 사용)
# ============================================================================
def get_gender_column(df):
    """성별 컬럼명 반환 (성별_통합 우선)"""
    if '성별_통합' in df.columns:
        return '성별_통합'
    return '성별'

def get_age_column(df):
    """연령 컬럼명 반환 (연령_통합 우선)"""
    if '연령_통합' in df.columns:
        return '연령_통합'
    return '연령'

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

def format_korean_currency(value):
    """숫자를 읽기 쉬운 한국 화폐 단위로 변환"""
    if value is None or pd.isna(value):
        return "0원"
    val = float(value)
    if val >= 100000000:  # 1억 이상
        return f"{val/100000000:.1f}억 원"
    elif val >= 10000:    # 1만 이상
        return f"{val/10000:,.0f}만 원"
    else:
        return f"{int(val):,}원"

def get_persona_action(age=None, gender=None, device=None, platform=None):
    """페르소나 기반 추천 액션 조회"""
    # 연령 + 성별 조합 우선
    if age and gender:
        key = f"{age}_{gender}"
        if key in PERSONA_ACTIONS:
            return PERSONA_ACTIONS[key]

    # 기기 + 플랫폼 조합
    if device and platform:
        key = f"{device}_{platform}"
        if key in PERSONA_ACTIONS:
            return PERSONA_ACTIONS[key]

    # 성별만
    if gender and gender in PERSONA_ACTIONS:
        return PERSONA_ACTIONS[gender]

    return None

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

# 경로 설정 (동적 경로)
BASE_DIR = Path(__file__).parent.parent
data_dir = BASE_DIR / 'data' / 'type'

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
# 날짜 필터링 적용 (--days 파라미터)
# 주의: 분기별 추이 분석은 prophet_forecasts['seasonality']를 사용하므로 필터링 제외
# ============================================================================
if args.days > 0:
    print(f"\n⏰ 최근 {args.days}일 데이터로 필터링 적용 중...")

    # daily_summary 필터링
    original_daily_count = len(daily_summary)
    daily_summary = filter_by_days(daily_summary, args.days, '일')
    print(f"  - daily_summary: {original_daily_count:,}행 → {len(daily_summary):,}행")

    # dimensions 필터링
    for key in dimensions:
        if '일' in dimensions[key].columns:
            original_count = len(dimensions[key])
            dimensions[key] = filter_by_days(dimensions[key], args.days, '일')
            print(f"  - {key}: {original_count:,}행 → {len(dimensions[key]):,}행")

    # 필터링된 날짜 범위 출력
    if '일' in daily_summary.columns and len(daily_summary) > 0:
        min_date = daily_summary['일'].min().strftime('%Y-%m-%d')
        max_date = daily_summary['일'].max().strftime('%Y-%m-%d')
        print(f"  ✓ 필터링 완료: {min_date} ~ {max_date}")
else:
    print("\n📊 전체 기간 데이터 사용")

# Prophet 예측 파일들 로드 (분기별 추이 포함 - 필터링 제외)
print("\nProphet 예측 데이터 로딩 중...")
prophet_files = {
    'overall': 'prophet_forecast_overall.csv',
    'category': 'prophet_forecast_by_category.csv',
    'brand': 'prophet_forecast_by_brand.csv',
    'product': 'prophet_forecast_by_product.csv',
    'gender': 'prophet_forecast_by_gender.csv',
    'age': 'prophet_forecast_by_age.csv',
    'platform': 'prophet_forecast_by_platform.csv',
    'deviceplatform': 'prophet_forecast_by_deviceplatform.csv',
    'device': 'prophet_forecast_by_device.csv',
    'promotion': 'prophet_forecast_by_promotion.csv',
    'age_gender': 'prophet_forecast_by_age_gender.csv',
    'seasonality': 'prophet_forecast_by_seasonality.csv'
}

prophet_forecasts = {}
prophet_actuals = {}  # 실제 데이터 저장용

for key, filename in prophet_files.items():
    file_path = data_dir / filename
    if file_path.exists():
        df = pd.read_csv(file_path)
        # seasonality 파일은 일자 컬럼이 없음
        if key != 'seasonality' and '일자' in df.columns:
            df['일자'] = pd.to_datetime(df['일자'])

        # type 컬럼이 있으면 actual/forecast 분리
        if 'type' in df.columns:
            prophet_actuals[key] = df[df['type'] == 'actual'].copy()
            prophet_forecasts[key] = df[df['type'] == 'forecast'].copy()
            print(f"✓ {filename} 로드 완료 (actual: {len(prophet_actuals[key])}행, forecast: {len(prophet_forecasts[key])}행)")
        else:
            # type 컬럼이 없으면 전체를 forecast로 처리 (이전 버전 호환)
            prophet_forecasts[key] = df
            print(f"✓ {filename} 로드 완료 ({len(df)}행)")


def get_prophet_data(key, data_type='forecast'):
    """Prophet 데이터 조회 헬퍼 함수

    Args:
        key: 데이터 키 (overall, category, brand 등)
        data_type: 'forecast', 'actual', 'all'

    Returns:
        DataFrame 또는 None
    """
    if data_type == 'actual' and key in prophet_actuals:
        return prophet_actuals[key]
    elif data_type == 'forecast' and key in prophet_forecasts:
        return prophet_forecasts[key]
    elif data_type == 'all':
        # actual + forecast 결합
        parts = []
        if key in prophet_actuals:
            parts.append(prophet_actuals[key])
        if key in prophet_forecasts:
            parts.append(prophet_forecasts[key])
        if parts:
            return pd.concat(parts, ignore_index=True)
    return prophet_forecasts.get(key)

# ============================================================================
# 전체 요약 (캠페인+광고세트 기준 필터링된 데이터 사용 - KPI 카드와 동일)
# ============================================================================
print("\n전체 요약 생성 중...")

# dimensions['type1'] 사용: 캠페인이름 + 광고세트가 존재하는 행만 집계 (KPI 카드와 동일한 기준)
if 'type1' in dimensions and len(dimensions['type1']) > 0:
    type1_for_summary = dimensions['type1']
    total_cost = type1_for_summary['비용'].sum()
    total_conversions = type1_for_summary['전환수'].sum()
    total_revenue = type1_for_summary['전환값'].sum()
    # 날짜 범위는 type1 데이터에서 가져옴
    if '일' in type1_for_summary.columns:
        start_date = type1_for_summary['일'].min()
        end_date = type1_for_summary['일'].max()
        if hasattr(start_date, 'strftime'):
            start_date_str = start_date.strftime('%Y-%m-%d')
            end_date_str = end_date.strftime('%Y-%m-%d')
        else:
            start_date_str = str(start_date)[:10]
            end_date_str = str(end_date)[:10]
        total_days = type1_for_summary['일'].nunique()
    else:
        start_date_str = daily_summary['일'].min().strftime('%Y-%m-%d')
        end_date_str = daily_summary['일'].max().strftime('%Y-%m-%d')
        total_days = len(daily_summary)
    print(f"  - dimensions['type1'] 기준 집계: 비용={total_cost:,.0f}, 전환값={total_revenue:,.0f}")
else:
    # fallback: daily_summary 사용
    total_cost = daily_summary['비용'].sum()
    total_conversions = daily_summary['전환수'].sum()
    total_revenue = daily_summary['전환값'].sum()
    start_date_str = daily_summary['일'].min().strftime('%Y-%m-%d')
    end_date_str = daily_summary['일'].max().strftime('%Y-%m-%d')
    total_days = len(daily_summary)
    print(f"  - daily_summary 기준 집계 (fallback)")

overall_roas = (total_revenue / total_cost * 100) if total_cost > 0 else 0
overall_cpa = (total_cost / total_conversions) if total_conversions > 0 else 0

summary = {
    "total_cost": float(total_cost),
    "total_conversions": float(total_conversions),
    "total_revenue": float(total_revenue),
    "overall_roas": float(overall_roas),
    "overall_cpa": float(overall_cpa),
    "analysis_period": {
        "start_date": start_date_str,
        "end_date": end_date_str,
        "total_days": total_days
    }
}

# ============================================================================
# 상위 유형구분 (필터링된 dimensions['type1']에서 재계산)
# ============================================================================
print("상위 유형구분 분석 중...")

# 필터링된 dimensions['type1']에서 유형구분별 집계
if 'type1' in dimensions and '유형구분' in dimensions['type1'].columns:
    type1_df = dimensions['type1'].copy()
    category_agg = type1_df.groupby('유형구분').agg({
        '비용': 'sum',
        '전환수': 'sum',
        '전환값': 'sum'
    }).reset_index()

    # ROAS, CPA 재계산 (총합 기준)
    category_agg['ROAS'] = np.where(
        category_agg['비용'] > 0,
        (category_agg['전환값'] / category_agg['비용']) * 100,
        0
    )
    category_agg['CPA'] = np.where(
        category_agg['전환수'] > 0,
        category_agg['비용'] / category_agg['전환수'],
        0
    )

    # 비용이 있는 유형구분만 필터링
    paid_categories = category_agg[category_agg['비용'] > 0].copy()
    top_categories = paid_categories.nlargest(5, 'ROAS')[['유형구분', '비용', '전환수', '전환값', 'ROAS', 'CPA']].to_dict('records')
else:
    # fallback: 기존 category_summary 사용 (필터링 불가)
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

    # 성별_통합 컬럼 사용 (없으면 기존 방식으로 정규화)
    gender_col = get_gender_column(type4_df)
    if gender_col == '성별_통합':
        # 이미 통합된 컬럼 사용 - 알수없음만 필터링
        type4_df = type4_df[type4_df[gender_col].apply(is_valid_gender)]
        type4_df['성별_정규화'] = type4_df[gender_col]
    else:
        # 기존 방식: 정규화 후 필터링
        type4_df['성별_정규화'] = type4_df['성별'].apply(normalize_gender)
        type4_df = type4_df[type4_df['성별_정규화'].notna()]

    # 성별별 집계
    gender_summary = type4_df.groupby('성별_정규화').agg({
        '비용': 'sum',
        '전환수': 'sum',
        '전환값': 'sum'
    }).reset_index()

    # ROAS 재계산 (전체 기간 기준) - 평균이 아닌 총합 기준
    gender_summary['ROAS'] = np.where(
        gender_summary['비용'] > 0,
        (gender_summary['전환값'] / gender_summary['비용']) * 100,
        0
    )

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

    # 광고세트별로 전체 기간 데이터 집계 (일별 데이터를 합산)
    adset_agg = type1_df.groupby(['캠페인이름', '광고세트', '유형구분']).agg({
        '비용': 'sum',
        '전환수': 'sum',
        '전환값': 'sum'
    }).reset_index()

    # ROAS 재계산 (전체 기간 기준)
    adset_agg['ROAS'] = np.where(
        adset_agg['비용'] > 0,
        (adset_agg['전환값'] / adset_agg['비용']) * 100,
        0
    )

    # CPA 계산
    adset_agg['CPA'] = np.where(
        adset_agg['전환수'] > 0,
        adset_agg['비용'] / adset_agg['전환수'],
        0
    )

    # 전환수 > 0인 것만 필터링하고 ROAS 기준 상위 10개
    adset_filtered = adset_agg[adset_agg['전환수'] > 0].copy()
    top_10_adsets = adset_filtered.nlargest(10, 'ROAS')

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

    # 성별_통합/연령_통합 컬럼 사용
    gender_col = get_gender_column(type2_df)
    age_col = get_age_column(type2_df)

    if gender_col == '성별_통합':
        type2_df = type2_df[type2_df[gender_col].apply(is_valid_gender)]
        type2_df['성별_정규화'] = type2_df[gender_col]
    else:
        type2_df['성별_정규화'] = type2_df['성별'].apply(normalize_gender)
        type2_df = type2_df[type2_df['성별_정규화'].notna()]

    # 연령 알수없음 필터링
    type2_df = type2_df[type2_df[age_col].apply(is_valid_age)]
    type2_df['연령_정규화'] = type2_df[age_col]

    # 연령x성별 조합별로 전체 기간 데이터 집계 (일별 데이터를 합산)
    age_gender_agg = type2_df.groupby(['광고세트', '연령_정규화', '성별_정규화']).agg({
        '비용': 'sum',
        '전환수': 'sum',
        '전환값': 'sum'
    }).reset_index()

    # ROAS 재계산 (전체 기간 기준)
    age_gender_agg['ROAS'] = np.where(
        age_gender_agg['비용'] > 0,
        (age_gender_agg['전환값'] / age_gender_agg['비용']) * 100,
        0
    )

    # 전환수 > 0인 것만 필터링하고 ROAS 기준 상위 5개
    age_gender_filtered = age_gender_agg[age_gender_agg['전환수'] > 0].copy()
    top_combinations = age_gender_filtered.nlargest(5, 'ROAS')

    for _, row in top_combinations.iterrows():
        age_gender_insights.append({
            "adset": row['광고세트'],
            "age": row['연령_정규화'],
            "gender": row['성별_정규화'],
            "roas": float(row['ROAS']),
            "conversions": float(row['전환수']),
            "recommendation": f"{row['연령_정규화']} {row['성별_정규화']} 타겟팅이 효과적입니다"
        })

# ============================================================================
# 기기유형 분석 (Type5)
# ============================================================================
print("기기유형 인사이트 생성 중...")

device_insights = []
if 'type5' in dimensions:
    type5_df = dimensions['type5']

    # 기기유형_통합 컬럼 사용 (fallback: 기기유형)
    device_col = '기기유형_통합' if '기기유형_통합' in type5_df.columns else '기기유형'

    device_summary = type5_df.groupby(device_col).agg({
        '비용': 'sum',
        '전환수': 'sum',
        '전환값': 'sum'
    }).reset_index()

    device_summary['ROAS'] = (device_summary['전환값'] / device_summary['비용'] * 100).replace([np.inf, -np.inf], 0)
    device_summary = device_summary[device_summary['전환수'] > 0]

    for _, row in device_summary.iterrows():
        device_insights.append({
            "device": row[device_col],
            "cost": float(row['비용']),
            "conversions": float(row['전환수']),
            "revenue": float(row['전환값']),
            "roas": float(row['ROAS'])
        })

# ============================================================================
# 기기플랫폼 분석 (Type7)
# ============================================================================
print("기기플랫폼 인사이트 생성 중...")

deviceplatform_insights = []
if 'type7' in dimensions:
    type7_df = dimensions['type7']

    # 기기플랫폼_통합 컬럼 사용 (fallback: 기기플랫폼)
    deviceplatform_col = '기기플랫폼_통합' if '기기플랫폼_통합' in type7_df.columns else '기기플랫폼'

    deviceplatform_summary = type7_df.groupby(deviceplatform_col).agg({
        '비용': 'sum',
        '전환수': 'sum',
        '전환값': 'sum'
    }).reset_index()

    deviceplatform_summary['ROAS'] = (deviceplatform_summary['전환값'] / deviceplatform_summary['비용'] * 100).replace([np.inf, -np.inf], 0)
    deviceplatform_summary = deviceplatform_summary[deviceplatform_summary['전환수'] > 0]

    for _, row in deviceplatform_summary.iterrows():
        deviceplatform_insights.append({
            "deviceplatform": row[deviceplatform_col],
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

    # 성별_통합 컬럼 사용
    gender_col = get_gender_column(type4_df)
    if gender_col == '성별_통합':
        type4_df = type4_df[type4_df[gender_col].apply(is_valid_gender)]
        type4_df['성별_정규화'] = type4_df[gender_col]
    else:
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

    # 연령_통합 컬럼 사용
    age_col = get_age_column(type3_df)
    type3_df = type3_df[type3_df[age_col].apply(is_valid_age)]
    type3_df['연령_정규화'] = type3_df[age_col]

    if '주' in type3_df.columns:
        age_weekly = type3_df.groupby(['연령_정규화', '주']).agg({
            '비용': 'sum',
            '전환수': 'sum',
            '전환값': 'sum'
        }).reset_index()

        age_weekly['ROAS'] = (age_weekly['전환값'] / age_weekly['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)

        for age in age_weekly['연령_정규화'].unique():
            age_data = age_weekly[age_weekly['연령_정규화'] == age].sort_values('주')
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

    # 성별_통합 컬럼 사용
    gender_col = get_gender_column(type4_df)
    if gender_col == '성별_통합':
        type4_df = type4_df[type4_df[gender_col].apply(is_valid_gender)]
        type4_df['성별_정규화'] = type4_df[gender_col]
    else:
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

    # 연령_통합 컬럼 사용
    age_col = get_age_column(type3_df)
    type3_df = type3_df[type3_df[age_col].apply(is_valid_age)]
    type3_df['연령_정규화'] = type3_df[age_col]

    if '월' in type3_df.columns:
        age_monthly = type3_df.groupby(['연령_정규화', '월']).agg({
            '비용': 'sum',
            '전환수': 'sum',
            '전환값': 'sum'
        }).reset_index()

        age_monthly['ROAS'] = (age_monthly['전환값'] / age_monthly['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)

        for age in age_monthly['연령_정규화'].unique():
            age_data = age_monthly[age_monthly['연령_정규화'] == age].sort_values('월')

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
    # ROAS는 mean이 아닌 sum(전환값)/sum(비용)*100으로 계산
    overall_total_cost = float(overall_df['예측_비용'].sum()) if '예측_비용' in overall_df.columns else 0
    overall_total_revenue = float(overall_df['예측_전환값'].sum())
    overall_total_conversions = float(overall_df['예측_전환수'].sum()) if '예측_전환수' in overall_df.columns else 0
    forecast_summary['overall'] = {
        "forecast_period": {
            "start_date": overall_df['일자'].min().strftime('%Y-%m-%d'),
            "end_date": overall_df['일자'].max().strftime('%Y-%m-%d'),
            "total_days": len(overall_df)
        },
        "total_forecast_revenue": overall_total_revenue,
        "avg_daily_forecast": float(overall_df['예측_전환값'].mean()),
        "avg_forecast_roas": float((overall_total_revenue / overall_total_cost * 100) if overall_total_cost > 0 else 0),
        "avg_forecast_cpa": float((overall_total_cost / overall_total_conversions) if overall_total_conversions > 0 else 0),
        "total_forecast_cost": overall_total_cost,
        "total_forecast_conversions": overall_total_conversions
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

        # ROAS/CPA는 sum 기반으로 계산
        cat_total_cost = float(cat_data['예측_비용'].sum()) if '예측_비용' in cat_data.columns else 0
        cat_total_conversions = float(cat_data['예측_전환수'].sum()) if '예측_전환수' in cat_data.columns else 0

        category_forecast_insights.append({
            "category": category,
            "total_30day_forecast": float(total_forecast),
            "avg_daily_forecast": float(avg_forecast),
            "trend_direction": trend_direction,
            "first_week_avg": float(first_week),
            "last_week_avg": float(last_week),
            "avg_forecast_roas": float((total_forecast / cat_total_cost * 100) if cat_total_cost > 0 else 0),
            "avg_forecast_cpa": float((cat_total_cost / cat_total_conversions) if cat_total_conversions > 0 else 0)
        })

# 브랜드별 예측
brand_forecast_insights = []
if 'brand' in prophet_forecasts:
    brand_df = prophet_forecasts['brand']
    for brand in brand_df['브랜드명'].unique():
        brand_data = brand_df[brand_df['브랜드명'] == brand]
        total_forecast = brand_data['예측_전환값'].sum()
        avg_forecast = brand_data['예측_전환값'].mean()

        # ROAS/CPA는 sum 기반으로 계산
        brand_total_cost = float(brand_data['예측_비용'].sum()) if '예측_비용' in brand_data.columns else 0
        brand_total_conversions = float(brand_data['예측_전환수'].sum()) if '예측_전환수' in brand_data.columns else 0

        brand_forecast_insights.append({
            "brand": brand,
            "total_30day_forecast": float(total_forecast),
            "avg_daily_forecast": float(avg_forecast),
            "avg_forecast_roas": float((total_forecast / brand_total_cost * 100) if brand_total_cost > 0 else 0),
            "avg_forecast_cpa": float((brand_total_cost / brand_total_conversions) if brand_total_conversions > 0 else 0),
            "total_forecast_cost": brand_total_cost
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

        # ROAS/CPA는 sum 기반으로 계산
        product_total_cost = float(product_data['예측_비용'].sum()) if '예측_비용' in product_data.columns else 0
        product_total_conversions = float(product_data['예측_전환수'].sum()) if '예측_전환수' in product_data.columns else 0

        product_forecast_insights.append({
            "product": product,
            "total_30day_forecast": float(total_forecast),
            "avg_daily_forecast": float(avg_forecast),
            "avg_forecast_roas": float((total_forecast / product_total_cost * 100) if product_total_cost > 0 else 0),
            "avg_forecast_cpa": float((product_total_cost / product_total_conversions) if product_total_conversions > 0 else 0),
            "total_forecast_cost": product_total_cost
        })

    product_forecast_insights = sorted(product_forecast_insights, key=lambda x: x['total_30day_forecast'], reverse=True)

# 성별 예측
gender_forecast_insights = []
if 'gender' in prophet_forecasts:
    gender_df = prophet_forecasts['gender'].copy()

    # 성별 컬럼 확인 (성별_통합 우선)
    gender_col = '성별_통합' if '성별_통합' in gender_df.columns else '성별'

    # 성별 정규화 및 알수없음 필터링
    gender_df['성별_정규화'] = gender_df[gender_col].apply(normalize_gender)
    gender_df = gender_df[gender_df['성별_정규화'].notna()]

    for gender in gender_df['성별_정규화'].unique():
        gender_data = gender_df[gender_df['성별_정규화'] == gender]
        total_forecast = gender_data['예측_전환값'].sum()
        avg_forecast = gender_data['예측_전환값'].mean()

        # ROAS/CPA는 sum 기반으로 계산
        gender_total_cost = float(gender_data['예측_비용'].sum()) if '예측_비용' in gender_data.columns else 0
        gender_total_conversions = float(gender_data['예측_전환수'].sum()) if '예측_전환수' in gender_data.columns else 0

        gender_forecast_insights.append({
            "gender": gender,
            "total_30day_forecast": float(total_forecast),
            "avg_daily_forecast": float(avg_forecast),
            "avg_forecast_roas": float((total_forecast / gender_total_cost * 100) if gender_total_cost > 0 else 0),
            "avg_forecast_cpa": float((gender_total_cost / gender_total_conversions) if gender_total_conversions > 0 else 0),
            "total_forecast_cost": gender_total_cost
        })

    gender_forecast_insights = sorted(gender_forecast_insights, key=lambda x: x['total_30day_forecast'], reverse=True)

# 연령별 예측
age_forecast_insights = []
if 'age' in prophet_forecasts:
    age_df = prophet_forecasts['age'].copy()

    # 연령 컬럼 확인 (연령_통합 우선)
    age_col = '연령_통합' if '연령_통합' in age_df.columns else '연령'

    # 연령 알수없음 필터링
    age_df = age_df[age_df[age_col].apply(is_valid_age)]

    for age in age_df[age_col].unique():
        age_data = age_df[age_df[age_col] == age]
        total_forecast = age_data['예측_전환값'].sum()
        avg_forecast = age_data['예측_전환값'].mean()

        # ROAS/CPA는 sum 기반으로 계산
        age_total_cost = float(age_data['예측_비용'].sum()) if '예측_비용' in age_data.columns else 0
        age_total_conversions = float(age_data['예측_전환수'].sum()) if '예측_전환수' in age_data.columns else 0

        age_forecast_insights.append({
            "age": age,
            "total_30day_forecast": float(total_forecast),
            "avg_daily_forecast": float(avg_forecast),
            "avg_forecast_roas": float((total_forecast / age_total_cost * 100) if age_total_cost > 0 else 0),
            "avg_forecast_cpa": float((age_total_cost / age_total_conversions) if age_total_conversions > 0 else 0),
            "total_forecast_cost": age_total_cost
        })

    age_forecast_insights = sorted(age_forecast_insights, key=lambda x: x['total_30day_forecast'], reverse=True)

# 기기플랫폼별 예측
deviceplatform_forecast_insights = []
if 'deviceplatform' in prophet_forecasts:
    deviceplatform_df = prophet_forecasts['deviceplatform']
    # 기기플랫폼_통합 컬럼 사용 (fallback: 기기플랫폼)
    deviceplatform_col = '기기플랫폼_통합' if '기기플랫폼_통합' in deviceplatform_df.columns else '기기플랫폼'
    for deviceplatform in deviceplatform_df[deviceplatform_col].unique():
        deviceplatform_data = deviceplatform_df[deviceplatform_df[deviceplatform_col] == deviceplatform]
        total_forecast = deviceplatform_data['예측_전환값'].sum()
        avg_forecast = deviceplatform_data['예측_전환값'].mean()

        # ROAS/CPA는 sum 기반으로 계산
        deviceplatform_total_cost = float(deviceplatform_data['예측_비용'].sum()) if '예측_비용' in deviceplatform_data.columns else 0
        deviceplatform_total_conversions = float(deviceplatform_data['예측_전환수'].sum()) if '예측_전환수' in deviceplatform_data.columns else 0

        deviceplatform_forecast_insights.append({
            "deviceplatform": deviceplatform,
            "total_30day_forecast": float(total_forecast),
            "avg_daily_forecast": float(avg_forecast),
            "avg_forecast_roas": float((total_forecast / deviceplatform_total_cost * 100) if deviceplatform_total_cost > 0 else 0),
            "avg_forecast_cpa": float((deviceplatform_total_cost / deviceplatform_total_conversions) if deviceplatform_total_conversions > 0 else 0),
            "total_forecast_cost": deviceplatform_total_cost
        })

    deviceplatform_forecast_insights = sorted(deviceplatform_forecast_insights, key=lambda x: x['total_30day_forecast'], reverse=True)

# 플랫폼별 예측 (Type6 기반)
platform_forecast_insights = []
if 'platform' in prophet_forecasts:
    platform_df = prophet_forecasts['platform']
    # 플랫폼 컬럼 사용
    platform_col = '플랫폼' if '플랫폼' in platform_df.columns else None
    if platform_col:
        for platform in platform_df[platform_col].unique():
            platform_data = platform_df[platform_df[platform_col] == platform]
            total_forecast = platform_data['예측_전환값'].sum()
            avg_forecast = platform_data['예측_전환값'].mean()

            # ROAS/CPA는 sum 기반으로 계산
            platform_total_cost = float(platform_data['예측_비용'].sum()) if '예측_비용' in platform_data.columns else 0
            platform_total_conversions = float(platform_data['예측_전환수'].sum()) if '예측_전환수' in platform_data.columns else 0

            platform_forecast_insights.append({
                "platform": platform,
                "total_30day_forecast": float(total_forecast),
                "avg_daily_forecast": float(avg_forecast),
                "avg_forecast_roas": float((total_forecast / platform_total_cost * 100) if platform_total_cost > 0 else 0),
                "avg_forecast_cpa": float((platform_total_cost / platform_total_conversions) if platform_total_conversions > 0 else 0),
                "total_forecast_cost": platform_total_cost
            })

        platform_forecast_insights = sorted(platform_forecast_insights, key=lambda x: x['total_30day_forecast'], reverse=True)

# 기기유형별 예측
device_forecast_insights = []
if 'device' in prophet_forecasts:
    device_df = prophet_forecasts['device']
    # 기기유형_통합 컬럼 사용 (fallback: 기기유형)
    device_col = '기기유형_통합' if '기기유형_통합' in device_df.columns else '기기유형'
    for device in device_df[device_col].unique():
        device_data = device_df[device_df[device_col] == device]
        total_forecast = device_data['예측_전환값'].sum()
        avg_forecast = device_data['예측_전환값'].mean()

        # ROAS/CPA는 sum 기반으로 계산
        device_total_cost = float(device_data['예측_비용'].sum()) if '예측_비용' in device_data.columns else 0
        device_total_conversions = float(device_data['예측_전환수'].sum()) if '예측_전환수' in device_data.columns else 0

        device_forecast_insights.append({
            "device": device,
            "total_30day_forecast": float(total_forecast),
            "avg_daily_forecast": float(avg_forecast),
            "avg_forecast_roas": float((total_forecast / device_total_cost * 100) if device_total_cost > 0 else 0),
            "avg_forecast_cpa": float((device_total_cost / device_total_conversions) if device_total_conversions > 0 else 0),
            "total_forecast_cost": device_total_cost
        })

    device_forecast_insights = sorted(device_forecast_insights, key=lambda x: x['total_30day_forecast'], reverse=True)

# 프로모션별 예측
promotion_forecast_insights = []
if 'promotion' in prophet_forecasts:
    promotion_df = prophet_forecasts['promotion']
    for promotion in promotion_df['프로모션'].unique():
        promotion_data = promotion_df[promotion_df['프로모션'] == promotion]
        total_forecast = promotion_data['예측_전환값'].sum()
        avg_forecast = promotion_data['예측_전환값'].mean()

        # ROAS/CPA는 sum 기반으로 계산
        promotion_total_cost = float(promotion_data['예측_비용'].sum()) if '예측_비용' in promotion_data.columns else 0
        promotion_total_conversions = float(promotion_data['예측_전환수'].sum()) if '예측_전환수' in promotion_data.columns else 0

        promotion_forecast_insights.append({
            "promotion": promotion,
            "total_30day_forecast": float(total_forecast),
            "avg_daily_forecast": float(avg_forecast),
            "avg_forecast_roas": float((total_forecast / promotion_total_cost * 100) if promotion_total_cost > 0 else 0),
            "avg_forecast_cpa": float((promotion_total_cost / promotion_total_conversions) if promotion_total_conversions > 0 else 0),
            "total_forecast_cost": promotion_total_cost
        })

    promotion_forecast_insights = sorted(promotion_forecast_insights, key=lambda x: x['total_30day_forecast'], reverse=True)

# 연령+성별 조합별 예측
age_gender_forecast_insights = []
if 'age_gender' in prophet_forecasts:
    age_gender_df = prophet_forecasts['age_gender']

    # 새로운 컬럼 구조 확인 (연령_통합, 성별_통합 개별 컬럼)
    if '연령_통합' in age_gender_df.columns and '성별_통합' in age_gender_df.columns:
        # 연령_통합 + 성별_통합 조합으로 그룹화
        for (age, gender), group_data in age_gender_df.groupby(['연령_통합', '성별_통합']):
            total_forecast = group_data['예측_전환값'].sum()
            avg_forecast = group_data['예측_전환값'].mean()

            # ROAS/CPA는 sum 기반으로 계산
            ag_total_cost = float(group_data['예측_비용'].sum()) if '예측_비용' in group_data.columns else 0
            ag_total_conversions = float(group_data['예측_전환수'].sum()) if '예측_전환수' in group_data.columns else 0

            age_gender_forecast_insights.append({
                "age_gender": f"{age}_{gender}",
                "age": age,
                "gender": gender,
                "total_30day_forecast": float(total_forecast),
                "avg_daily_forecast": float(avg_forecast),
                "avg_forecast_roas": float((total_forecast / ag_total_cost * 100) if ag_total_cost > 0 else 0),
                "avg_forecast_cpa": float((ag_total_cost / ag_total_conversions) if ag_total_conversions > 0 else 0),
                "total_forecast_cost": ag_total_cost,
                "total_forecast_conversions": ag_total_conversions
            })
    else:
        # 기존 컬럼 구조 (연령_성별_통합 또는 연령_성별)
        age_gender_col = '연령_성별_통합' if '연령_성별_통합' in age_gender_df.columns else '연령_성별'
        for age_gender in age_gender_df[age_gender_col].unique():
            age_gender_data = age_gender_df[age_gender_df[age_gender_col] == age_gender]
            total_forecast = age_gender_data['예측_전환값'].sum()
            avg_forecast = age_gender_data['예측_전환값'].mean()

            # 연령과 성별 분리
            parts = age_gender.split('_')
            age_part = parts[0] if len(parts) >= 1 else age_gender
            gender_part = parts[1] if len(parts) >= 2 else ''

            # ROAS/CPA는 sum 기반으로 계산
            ag_total_cost = float(age_gender_data['예측_비용'].sum()) if '예측_비용' in age_gender_data.columns else 0
            ag_total_conversions = float(age_gender_data['예측_전환수'].sum()) if '예측_전환수' in age_gender_data.columns else 0

            age_gender_forecast_insights.append({
                "age_gender": age_gender,
                "age": age_part,
                "gender": gender_part,
                "total_30day_forecast": float(total_forecast),
                "avg_daily_forecast": float(avg_forecast),
                "avg_forecast_roas": float((total_forecast / ag_total_cost * 100) if ag_total_cost > 0 else 0),
                "avg_forecast_cpa": float((ag_total_cost / ag_total_conversions) if ag_total_conversions > 0 else 0),
                "total_forecast_cost": ag_total_cost,
                "total_forecast_conversions": ag_total_conversions
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

# 4. 기기플랫폼 최적화 추천
if len(deviceplatform_forecast_insights) > 0:
    best_deviceplatform = deviceplatform_forecast_insights[0]
    if best_deviceplatform['total_30day_forecast'] > 0:
        prophet_recommendations.append({
            "title": "기기플랫폼 집중 전략 (예측 기반)",
            "description": f"{best_deviceplatform['deviceplatform']} 기기플랫폼에서 향후 30일간 {best_deviceplatform['total_30day_forecast']:,.0f}원의 전환이 예상됩니다. 해당 기기플랫폼 광고에 집중하세요.",
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
# 알림 및 추천사항 (AI 비서 톤앤매너 적용)
# ============================================================================
print("알림 및 추천사항 생성 중... (친화적 메시지 적용)")

alerts = []

# 1. 최고 성과 유형구분 강조
if len(top_categories_list) > 0:
    best_category = top_categories_list[0]
    if best_category['roas'] > THRESHOLDS['excellent_roas']:
        alerts.append({
            "type": "high_roas_opportunity",
            "title": f"🎯 우리 브랜드의 찐팬은 '{best_category['name']}' 입니다!",
            "message": f"{best_category['name']}의 ROAS가 {best_category['roas']:.0f}%로 압도적입니다.",
            "action": f"이번 주 광고 예산의 70%를 {best_category['name']} 타겟에 집중해보세요.",
            "severity": "opportunity",
            "category": "타겟팅",
            "score": 5,
            "value": best_category['roas']
        })

# 2. 저성과 유형구분 경고
low_roas_categories = paid_categories[paid_categories['ROAS'] < THRESHOLDS['low_roas']]
if len(low_roas_categories) > 0:
    for idx, (_, cat) in enumerate(low_roas_categories.iterrows()):
        if idx >= 3:  # 최대 3개만
            break
        alerts.append({
            "type": "low_roas_warning",
            "title": f"⚠️ '{cat['유형구분']}' 캠페인 점검이 필요해요",
            "message": f"{cat['유형구분']}의 ROAS가 {cat['ROAS']:.0f}%로 낮습니다.",
            "action": "소재를 교체하거나, 타겟팅을 좁혀보세요.",
            "severity": "warning",
            "category": "효율 개선",
            "score": 4,
            "target": cat['유형구분'],
            "value": float(cat['ROAS'])
        })

# 3. 성별 타겟팅 추천
if len(gender_insights) > 0:
    best_gender = max(gender_insights, key=lambda x: x['roas'])
    if best_gender['roas'] > THRESHOLDS['high_roas']:
        # 페르소나 기반 액션 조회
        persona_action = get_persona_action(gender=best_gender['gender'])
        action_text = persona_action if persona_action else f"{best_gender['gender']} 대상 광고 비중을 높이세요."

        alerts.append({
            "type": "gender_targeting_opportunity",
            "title": f"🎯 {best_gender['gender']} 고객이 열광하고 있어요!",
            "message": f"{best_gender['gender']} 타겟팅의 ROAS가 {best_gender['roas']:.0f}%로 우수합니다.",
            "action": action_text,
            "severity": "opportunity",
            "category": "타겟팅",
            "score": 5,
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

    if revenue_change < THRESHOLDS['drop_signal']:
        alerts.append({
            "type": "revenue_decline",
            "title": "📉 매출이 주춤하고 있어요",
            "message": f"최근 30일 매출이 이전 대비 {revenue_change:.1f}% 감소했습니다.",
            "action": "캠페인 소재와 타겟팅을 점검해주세요.",
            "severity": "high",
            "category": "매출 분석",
            "score": 5,
            "value": revenue_change
        })
    elif revenue_change > THRESHOLDS['growth_signal']:
        alerts.append({
            "type": "revenue_growth",
            "title": "📈 매출이 쑥쑥 오르고 있어요!",
            "message": f"최근 30일 매출이 이전 대비 {revenue_change:.1f}% 증가했습니다!",
            "action": "현재 전략을 유지하면서 성과 요인을 분석해보세요.",
            "severity": "positive",
            "category": "매출 분석",
            "score": 4,
            "value": revenue_change
        })

# ============================================================================
# 추천사항 (Score 시스템 적용 - 상위 5개를 top_recommendations로 추출)
# ============================================================================
recommendations = []

# 1. 예산 재배분 추천
if len(top_categories_list) >= 2:
    best = top_categories_list[0]
    second = top_categories_list[1]

    recommendations.append({
        "title": "💰 예산 재배분으로 효율 UP!",
        "description": f"{best['name']} (ROAS {best['roas']:.0f}%)의 예산을 늘리고, {second['name']}의 예산을 유지하세요.",
        "action": f"{best['name']}에 예산 30% 증액을 권장합니다.",
        "priority": "high",
        "category": "예산 전략",
        "score": 5,
        "expected_impact": "ROAS 10-20% 개선 예상"
    })

# 2. 성별 타겟팅 최적화
if len(gender_insights) >= 2:
    sorted_genders = sorted(gender_insights, key=lambda x: x['roas'], reverse=True)
    best_gender = sorted_genders[0]

    # 페르소나 기반 액션
    persona_action = get_persona_action(gender=best_gender['gender'])
    action_text = persona_action if persona_action else f"{best_gender['gender']} 대상 광고 비중을 높이세요."

    recommendations.append({
        "title": f"🎯 {best_gender['gender']} 타겟팅 강화하기",
        "description": f"{best_gender['gender']} 타겟 광고의 비중을 높이세요. 현재 ROAS {best_gender['roas']:.0f}%로 가장 높습니다.",
        "action": action_text,
        "priority": "high",
        "category": "타겟팅",
        "score": 5,
        "expected_impact": "CPA 15-25% 절감 가능"
    })

# 3. 기기플랫폼 최적화
if len(deviceplatform_insights) > 0:
    best_deviceplatform = max(deviceplatform_insights, key=lambda x: x['roas'])

    # 기기플랫폼 기반 페르소나 액션
    deviceplatform_action = get_persona_action(platform=best_deviceplatform['deviceplatform'])
    action_text = deviceplatform_action if deviceplatform_action else f"{best_deviceplatform['deviceplatform']} 기기플랫폼 광고에 집중하세요."

    recommendations.append({
        "title": f"📱 {best_deviceplatform['deviceplatform']} 기기플랫폼이 효자예요!",
        "description": f"{best_deviceplatform['deviceplatform']} 기기플랫폼 광고에 집중하세요. ROAS {best_deviceplatform['roas']:.0f}%로 가장 효율적입니다.",
        "action": action_text,
        "priority": "medium",
        "category": "기기플랫폼",
        "score": 4,
        "expected_impact": "전환율 10-15% 개선 예상"
    })

# ============================================================================
# 브랜드/상품/프로모션 추천사항 (친화적 메시지)
# ============================================================================
# 최고 성과 브랜드 추천
if len(brand_insights) > 0:
    best_brand = brand_insights[0]
    if best_brand['roas'] > THRESHOLDS['low_roas']:
        recommendations.append({
            "title": f"⭐ '{best_brand['brand']}' 브랜드가 대세예요!",
            "description": f"{best_brand['brand']} 브랜드의 ROAS가 {best_brand['roas']:.0f}%로 가장 높습니다.",
            "action": "해당 브랜드 광고 비중을 확대하세요.",
            "priority": "high",
            "category": "브랜드",
            "score": 5,
            "expected_impact": "ROAS 15-30% 개선 가능"
        })

# 최고 성과 상품 추천
if len(product_insights) > 0:
    best_product = product_insights[0]
    if best_product['roas'] > THRESHOLDS['low_roas']:
        recommendations.append({
            "title": f"🚀 라이징 스타: '{best_product['product']}'",
            "description": f"{best_product['product']} 상품의 ROAS가 {best_product['roas']:.0f}%로 가장 효율적입니다.",
            "action": "이 상품을 메인 배너 가장 잘 보이는 곳에 배치하세요.",
            "priority": "high",
            "category": "상품 전략",
            "score": 5,
            "expected_impact": "매출 20-35% 증가 예상"
        })

# 최고 성과 프로모션 추천
if len(promotion_insights) > 0:
    best_promotion = promotion_insights[0]
    if best_promotion['roas'] > THRESHOLDS['low_roas']:
        recommendations.append({
            "title": f"🎁 '{best_promotion['promotion']}' 프로모션 대박!",
            "description": f"{best_promotion['promotion']} 프로모션의 ROAS가 {best_promotion['roas']:.0f}%입니다.",
            "action": "유사한 프로모션을 기획하여 성공 패턴을 복제하세요.",
            "priority": "medium",
            "category": "프로모션",
            "score": 4,
            "expected_impact": "전환율 10-20% 개선 예상"
        })

# ============================================================================
# 요일별 계절성 분석 (prophet_forecast_by_seasonality.csv 활용) - 다중 지표
# ============================================================================
print("요일별 계절성 분석 중... (다중 지표: cost, conversions, revenue, roas, cpa)")

seasonality_analysis = {
    "overall": [],
    "by_category": {}
}
seasonality_insights = []

if 'seasonality' in prophet_forecasts:
    seasonality_df = prophet_forecasts['seasonality']

    # 요일 순서 정의
    day_order = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일']

    # 컬럼 매핑 (새 다중 지표 컬럼 지원, 기존 컬럼도 호환)
    has_multi_metrics = '예측_비용' in seasonality_df.columns

    # 기간유형 필터링 (요일별 데이터만 선택, 새 구조 지원)
    if '기간유형' in seasonality_df.columns:
        dow_df = seasonality_df[seasonality_df['기간유형'] == '요일별'].copy()
    else:
        dow_df = seasonality_df.copy()  # 기존 구조 호환

    # 유형구분별 분석 (요일별 데이터)
    for category in dow_df['유형구분'].unique():
        cat_data = dow_df[dow_df['유형구분'] == category].copy()

        # 요일별 데이터 정리 (다중 지표 포함)
        day_data = []
        for _, row in cat_data.iterrows():
            day_item = {
                "day": row['요일'],
                "avg_revenue": float(row.get('예측_전환값', 0))
            }

            # 다중 지표가 있는 경우 추가
            if has_multi_metrics:
                day_item["avg_cost"] = float(row.get('예측_비용', 0))
                day_item["avg_impressions"] = float(row.get('예측_노출', 0))
                day_item["avg_clicks"] = float(row.get('예측_클릭', 0))
                day_item["avg_conversions"] = float(row.get('예측_전환수', 0))
                day_item["avg_roas"] = float(row.get('예측_ROAS', 0))
                day_item["avg_cpa"] = float(row.get('예측_CPA', 0))

            day_data.append(day_item)

        # 요일 순서대로 정렬
        day_data_sorted = sorted(day_data, key=lambda x: day_order.index(x['day']) if x['day'] in day_order else 99)

        if category == '전체':
            seasonality_analysis['overall'] = day_data_sorted
        else:
            seasonality_analysis['by_category'][category] = day_data_sorted

        # 최고/최저 성과 요일 찾기 (ROAS 기준)
        if len(day_data) > 0:
            # 전체 데이터에서만 상세 인사이트 생성
            if category == '전체':
                # 주중 vs 주말 비교를 위한 데이터 준비
                weekdays = [d for d in day_data if d['day'] in ['월요일', '화요일', '수요일', '목요일', '금요일']]
                weekends = [d for d in day_data if d['day'] in ['토요일', '일요일']]

                weekday_avg_revenue = sum(d['avg_revenue'] for d in weekdays) / 5 if weekdays else 0
                weekend_avg_revenue = sum(d['avg_revenue'] for d in weekends) / 2 if weekends else 0

                # 다중 지표가 있는 경우 ROAS 기준으로 분석
                if has_multi_metrics:
                    # ROAS 기준 최고/최저 요일 (메인 인사이트)
                    best_day_roas = max(day_data, key=lambda x: x.get('avg_roas', 0))
                    worst_day_roas = min(day_data, key=lambda x: x.get('avg_roas', 0))

                    seasonality_insights.append({
                        "type": "best_day_overall",
                        "message": f"전체 기준 {best_day_roas['day']}이 평균 ROAS {best_day_roas.get('avg_roas', 0):.1f}%로 광고 효율이 가장 높습니다.",
                        "severity": "opportunity",
                        "day": best_day_roas['day'],
                        "value": best_day_roas.get('avg_roas', 0),
                        "avg_roas": best_day_roas.get('avg_roas', 0),
                        "avg_cost": best_day_roas.get('avg_cost', 0),
                        "avg_revenue": best_day_roas.get('avg_revenue', 0),
                        "avg_conversions": best_day_roas.get('avg_conversions', 0),
                        "avg_cpa": best_day_roas.get('avg_cpa', 0)
                    })

                    seasonality_insights.append({
                        "type": "worst_day_overall",
                        "message": f"전체 기준 {worst_day_roas['day']}이 평균 ROAS {worst_day_roas.get('avg_roas', 0):.1f}%로 광고 효율이 가장 낮습니다. 해당 요일 예산 재검토를 권장합니다.",
                        "severity": "warning",
                        "day": worst_day_roas['day'],
                        "value": worst_day_roas.get('avg_roas', 0),
                        "avg_roas": worst_day_roas.get('avg_roas', 0),
                        "avg_cost": worst_day_roas.get('avg_cost', 0),
                        "avg_revenue": worst_day_roas.get('avg_revenue', 0),
                        "avg_conversions": worst_day_roas.get('avg_conversions', 0),
                        "avg_cpa": worst_day_roas.get('avg_cpa', 0)
                    })

                    # CPA 기준 최고(낮은)/최저(높은) 요일
                    valid_cpa_days = [d for d in day_data if d.get('avg_cpa', 0) > 0]
                    if valid_cpa_days:
                        best_day_cpa = min(valid_cpa_days, key=lambda x: x.get('avg_cpa', float('inf')))
                        worst_day_cpa = max(valid_cpa_days, key=lambda x: x.get('avg_cpa', 0))

                        seasonality_insights.append({
                            "type": "best_cpa_day",
                            "message": f"{best_day_cpa['day']}이 평균 CPA {best_day_cpa.get('avg_cpa', 0):,.0f}원으로 전환 비용이 가장 낮습니다.",
                            "severity": "opportunity",
                            "day": best_day_cpa['day'],
                            "value": best_day_cpa.get('avg_cpa', 0),
                            "avg_cpa": best_day_cpa.get('avg_cpa', 0),
                            "avg_conversions": best_day_cpa.get('avg_conversions', 0),
                            "avg_roas": best_day_cpa.get('avg_roas', 0)
                        })

                        seasonality_insights.append({
                            "type": "worst_cpa_day",
                            "message": f"{worst_day_cpa['day']}이 평균 CPA {worst_day_cpa.get('avg_cpa', 0):,.0f}원으로 전환 비용이 가장 높습니다.",
                            "severity": "warning",
                            "day": worst_day_cpa['day'],
                            "value": worst_day_cpa.get('avg_cpa', 0),
                            "avg_cpa": worst_day_cpa.get('avg_cpa', 0),
                            "avg_conversions": worst_day_cpa.get('avg_conversions', 0),
                            "avg_roas": worst_day_cpa.get('avg_roas', 0)
                        })

                    # 주중/주말 평균 계산
                    weekday_avg_cost = sum(d.get('avg_cost', 0) for d in weekdays) / 5 if weekdays else 0
                    weekend_avg_cost = sum(d.get('avg_cost', 0) for d in weekends) / 2 if weekends else 0
                    weekday_avg_roas = sum(d.get('avg_roas', 0) for d in weekdays) / 5 if weekdays else 0
                    weekend_avg_roas = sum(d.get('avg_roas', 0) for d in weekends) / 2 if weekends else 0
                    weekday_avg_cpa = sum(d.get('avg_cpa', 0) for d in weekdays) / 5 if weekdays else 0
                    weekend_avg_cpa = sum(d.get('avg_cpa', 0) for d in weekends) / 2 if weekends else 0
                    weekday_avg_conversions = sum(d.get('avg_conversions', 0) for d in weekdays) / 5 if weekdays else 0
                    weekend_avg_conversions = sum(d.get('avg_conversions', 0) for d in weekends) / 2 if weekends else 0

                    # ROAS 기준 주중 vs 주말 비교 (메인 비교)
                    if weekday_avg_roas > 0 and weekend_avg_roas > 0:
                        if weekend_avg_roas > weekday_avg_roas:
                            roas_diff = ((weekend_avg_roas - weekday_avg_roas) / weekday_avg_roas) * 100
                            seasonality_insights.append({
                                "type": "weekend_better",
                                "message": f"주말 평균 ROAS가 주중보다 {roas_diff:.1f}% 높습니다. 주말 예산 증액을 고려하세요. (주말 {weekend_avg_roas:.1f}% vs 주중 {weekday_avg_roas:.1f}%)",
                                "severity": "opportunity",
                                "weekday_avg_roas": weekday_avg_roas,
                                "weekend_avg_roas": weekend_avg_roas,
                                "weekday_avg_revenue": weekday_avg_revenue,
                                "weekend_avg_revenue": weekend_avg_revenue,
                                "weekday_avg_cost": weekday_avg_cost,
                                "weekend_avg_cost": weekend_avg_cost,
                                "weekday_avg_cpa": weekday_avg_cpa,
                                "weekend_avg_cpa": weekend_avg_cpa,
                                "weekday_avg_conversions": weekday_avg_conversions,
                                "weekend_avg_conversions": weekend_avg_conversions,
                                "diff_percent": roas_diff
                            })
                        else:
                            roas_diff = ((weekday_avg_roas - weekend_avg_roas) / weekend_avg_roas) * 100
                            seasonality_insights.append({
                                "type": "weekday_better",
                                "message": f"주중 평균 ROAS가 주말보다 {roas_diff:.1f}% 높습니다. 주중 집중 운영을 권장합니다. (주중 {weekday_avg_roas:.1f}% vs 주말 {weekend_avg_roas:.1f}%)",
                                "severity": "info",
                                "weekday_avg_roas": weekday_avg_roas,
                                "weekend_avg_roas": weekend_avg_roas,
                                "weekday_avg_revenue": weekday_avg_revenue,
                                "weekend_avg_revenue": weekend_avg_revenue,
                                "weekday_avg_cost": weekday_avg_cost,
                                "weekend_avg_cost": weekend_avg_cost,
                                "weekday_avg_cpa": weekday_avg_cpa,
                                "weekend_avg_cpa": weekend_avg_cpa,
                                "weekday_avg_conversions": weekday_avg_conversions,
                                "weekend_avg_conversions": weekend_avg_conversions,
                                "diff_percent": roas_diff
                            })

                else:
                    # 다중 지표가 없는 경우 전환값 기준 (하위 호환)
                    best_day_revenue = max(day_data, key=lambda x: x['avg_revenue'])
                    worst_day_revenue = min(day_data, key=lambda x: x['avg_revenue'])

                    seasonality_insights.append({
                        "type": "best_day_overall",
                        "message": f"전체 기준 {best_day_revenue['day']}이 평균 전환값 {best_day_revenue['avg_revenue']:,.0f}원으로 가장 높습니다.",
                        "severity": "opportunity",
                        "day": best_day_revenue['day'],
                        "value": best_day_revenue['avg_revenue']
                    })
                    seasonality_insights.append({
                        "type": "worst_day_overall",
                        "message": f"전체 기준 {worst_day_revenue['day']}이 평균 전환값 {worst_day_revenue['avg_revenue']:,.0f}원으로 가장 낮습니다.",
                        "severity": "warning",
                        "day": worst_day_revenue['day'],
                        "value": worst_day_revenue['avg_revenue']
                    })

                    # 주중 vs 주말 비교 (전환값 기준)
                    if weekend_avg_revenue > weekday_avg_revenue and weekday_avg_revenue > 0:
                        diff_pct = ((weekend_avg_revenue - weekday_avg_revenue) / weekday_avg_revenue) * 100
                        seasonality_insights.append({
                            "type": "weekend_better",
                            "message": f"주말 평균 전환값이 주중보다 {diff_pct:.1f}% 높습니다. 주말 예산 증액을 고려하세요.",
                            "severity": "opportunity",
                            "weekday_avg_revenue": weekday_avg_revenue,
                            "weekend_avg_revenue": weekend_avg_revenue,
                            "diff_percent": diff_pct
                        })
                    elif weekend_avg_revenue > 0:
                        diff_pct = ((weekday_avg_revenue - weekend_avg_revenue) / weekend_avg_revenue) * 100
                        seasonality_insights.append({
                            "type": "weekday_better",
                            "message": f"주중 평균 전환값이 주말보다 {diff_pct:.1f}% 높습니다. 주중 집중 운영을 권장합니다.",
                            "severity": "info",
                            "weekday_avg_revenue": weekday_avg_revenue,
                            "weekend_avg_revenue": weekend_avg_revenue,
                            "diff_percent": diff_pct
                        })

            else:
                # 유형구분별 최고 성과 요일 (ROAS 기준)
                if has_multi_metrics:
                    best_day_roas = max(day_data, key=lambda x: x.get('avg_roas', 0))
                    seasonality_insights.append({
                        "type": f"best_day_{category}",
                        "message": f"{category}에서 {best_day_roas['day']}이 평균 ROAS {best_day_roas.get('avg_roas', 0):.1f}%로 최고입니다.",
                        "severity": "info",
                        "category": category,
                        "day": best_day_roas['day'],
                        "value": best_day_roas.get('avg_roas', 0),
                        "avg_roas": best_day_roas.get('avg_roas', 0),
                        "avg_cost": best_day_roas.get('avg_cost', 0),
                        "avg_revenue": best_day_roas.get('avg_revenue', 0),
                        "avg_cpa": best_day_roas.get('avg_cpa', 0),
                        "avg_conversions": best_day_roas.get('avg_conversions', 0)
                    })
                else:
                    best_day_revenue = max(day_data, key=lambda x: x['avg_revenue'])
                    seasonality_insights.append({
                        "type": f"best_day_{category}",
                        "message": f"{category}에서 {best_day_revenue['day']}이 평균 전환값 {best_day_revenue['avg_revenue']:,.0f}원으로 최고입니다.",
                        "severity": "info",
                        "category": category,
                        "day": best_day_revenue['day'],
                        "value": best_day_revenue['avg_revenue'],
                        "avg_revenue": best_day_revenue['avg_revenue']
                    })

    print(f"  - 전체 요일별 분석: {len(seasonality_analysis['overall'])}개")
    print(f"  - 유형구분별 요일 분석: {len(seasonality_analysis['by_category'])}개 카테고리")
    print(f"  - 계절성 인사이트: {len(seasonality_insights)}개")
    if has_multi_metrics:
        print("  - 다중 지표 포함: cost, conversions, revenue, roas, cpa")

    # ========== 분기별/월별 분석 추가 ==========
    print("\n분기별/월별 분석 중...")

    # 기간유형 컬럼이 있는지 확인
    has_period_type = '기간유형' in seasonality_df.columns

    if has_period_type:
        # 분기별 분석
        quarterly_data = seasonality_df[seasonality_df['기간유형'] == '분기별'].copy()
        if len(quarterly_data) > 0:
            seasonality_analysis['quarterly'] = {}
            seasonality_analysis['quarterly_overall'] = []

            quarter_order = ['Q1(1~3월)', 'Q2(4~6월)', 'Q3(7~9월)', 'Q4(10~12월)']

            for category in quarterly_data['유형구분'].unique():
                cat_quarterly = quarterly_data[quarterly_data['유형구분'] == category].copy()
                quarter_items = []

                for _, row in cat_quarterly.iterrows():
                    quarter_item = {
                        "quarter": row['요일'],  # 분기명이 요일 컬럼에 저장됨
                        "avg_cost": float(row.get('예측_비용', 0)),
                        "avg_impressions": float(row.get('예측_노출', 0)),
                        "avg_clicks": float(row.get('예측_클릭', 0)),
                        "avg_conversions": float(row.get('예측_전환수', 0)),
                        "avg_revenue": float(row.get('예측_전환값', 0)),
                        "avg_roas": float(row.get('예측_ROAS', 0)),
                        "avg_cpa": float(row.get('예측_CPA', 0))
                    }
                    quarter_items.append(quarter_item)

                # 분기 순서대로 정렬
                quarter_items_sorted = sorted(quarter_items, key=lambda x: quarter_order.index(x['quarter']) if x['quarter'] in quarter_order else 99)

                if category == '전체':
                    seasonality_analysis['quarterly_overall'] = quarter_items_sorted
                else:
                    seasonality_analysis['quarterly'][category] = quarter_items_sorted

            # 분기별 인사이트 생성
            if seasonality_analysis.get('quarterly_overall'):
                q_data = seasonality_analysis['quarterly_overall']
                if len(q_data) >= 2:
                    # ROAS 기준 최고/최저 분기
                    best_quarter = max(q_data, key=lambda x: x.get('avg_roas', 0))
                    worst_quarter = min(q_data, key=lambda x: x.get('avg_roas', 0))

                    seasonality_insights.append({
                        "type": "best_quarter",
                        "message": f"{best_quarter['quarter']}이 평균 ROAS {best_quarter['avg_roas']:.1f}%로 가장 효율적인 분기입니다.",
                        "severity": "opportunity",
                        "quarter": best_quarter['quarter'],
                        "avg_roas": best_quarter['avg_roas'],
                        "avg_revenue": best_quarter['avg_revenue'],
                        "avg_cost": best_quarter['avg_cost']
                    })

                    seasonality_insights.append({
                        "type": "worst_quarter",
                        "message": f"{worst_quarter['quarter']}이 평균 ROAS {worst_quarter['avg_roas']:.1f}%로 효율이 가장 낮습니다. 시즌별 전략 검토가 필요합니다.",
                        "severity": "warning",
                        "quarter": worst_quarter['quarter'],
                        "avg_roas": worst_quarter['avg_roas'],
                        "avg_revenue": worst_quarter['avg_revenue'],
                        "avg_cost": worst_quarter['avg_cost']
                    })

                    # 전환값 기준 분기 비교
                    best_revenue_q = max(q_data, key=lambda x: x.get('avg_revenue', 0))
                    seasonality_insights.append({
                        "type": "best_revenue_quarter",
                        "message": f"{best_revenue_q['quarter']}에 평균 전환값이 {best_revenue_q['avg_revenue']:,.0f}원으로 가장 높습니다. 이 시기에 예산을 집중하는 것을 권장합니다.",
                        "severity": "opportunity",
                        "quarter": best_revenue_q['quarter'],
                        "avg_revenue": best_revenue_q['avg_revenue']
                    })

            print(f"  - 분기별 분석: {len(seasonality_analysis.get('quarterly_overall', []))}개 분기")

        # 월별 분석
        monthly_data = seasonality_df[seasonality_df['기간유형'] == '월별'].copy()
        if len(monthly_data) > 0:
            seasonality_analysis['monthly'] = {}
            seasonality_analysis['monthly_overall'] = []

            for category in monthly_data['유형구분'].unique():
                cat_monthly = monthly_data[monthly_data['유형구분'] == category].copy()
                monthly_items = []

                for _, row in cat_monthly.iterrows():
                    monthly_item = {
                        "month": row['요일'],  # 년월이 요일 컬럼에 저장됨
                        "total_cost": float(row.get('예측_비용', 0)),
                        "total_impressions": float(row.get('예측_노출', 0)),
                        "total_clicks": float(row.get('예측_클릭', 0)),
                        "total_conversions": float(row.get('예측_전환수', 0)),
                        "total_revenue": float(row.get('예측_전환값', 0)),
                        "roas": float(row.get('예측_ROAS', 0)),
                        "cpa": float(row.get('예측_CPA', 0))
                    }
                    monthly_items.append(monthly_item)

                # 월별 정렬
                monthly_items_sorted = sorted(monthly_items, key=lambda x: x['month'])

                if category == '전체':
                    seasonality_analysis['monthly_overall'] = monthly_items_sorted
                else:
                    seasonality_analysis['monthly'][category] = monthly_items_sorted

            # 월별 인사이트 생성
            if seasonality_analysis.get('monthly_overall') and len(seasonality_analysis['monthly_overall']) >= 2:
                m_data = seasonality_analysis['monthly_overall']

                # 최근 2개월 비교 (트렌드)
                if len(m_data) >= 2:
                    recent_month = m_data[-1]
                    prev_month = m_data[-2]

                    roas_change = recent_month['roas'] - prev_month['roas']
                    revenue_change_pct = ((recent_month['total_revenue'] - prev_month['total_revenue']) / prev_month['total_revenue'] * 100) if prev_month['total_revenue'] > 0 else 0

                    if roas_change > 5:
                        seasonality_insights.append({
                            "type": "monthly_trend_up",
                            "message": f"{recent_month['month']}의 ROAS가 전월 대비 {roas_change:.1f}%p 상승했습니다. 현재 전략이 효과적입니다.",
                            "severity": "opportunity",
                            "current_month": recent_month['month'],
                            "prev_month": prev_month['month'],
                            "roas_change": roas_change,
                            "current_roas": recent_month['roas'],
                            "prev_roas": prev_month['roas']
                        })
                    elif roas_change < -5:
                        seasonality_insights.append({
                            "type": "monthly_trend_down",
                            "message": f"{recent_month['month']}의 ROAS가 전월 대비 {abs(roas_change):.1f}%p 하락했습니다. 원인 분석이 필요합니다.",
                            "severity": "warning",
                            "current_month": recent_month['month'],
                            "prev_month": prev_month['month'],
                            "roas_change": roas_change,
                            "current_roas": recent_month['roas'],
                            "prev_roas": prev_month['roas']
                        })

            print(f"  - 월별 분석: {len(seasonality_analysis.get('monthly_overall', []))}개 월")

        # 일별 분석 (트렌드용)
        daily_detail_data = seasonality_df[seasonality_df['기간유형'] == '일별'].copy()
        if len(daily_detail_data) > 0:
            seasonality_analysis['daily'] = []

            # 전체 일별 데이터만 저장
            overall_daily = daily_detail_data[daily_detail_data['유형구분'] == '전체'].copy()
            for _, row in overall_daily.iterrows():
                daily_item = {
                    "date": row['요일'],  # 날짜가 요일 컬럼에 저장됨
                    "cost": float(row.get('예측_비용', 0)),
                    "impressions": float(row.get('예측_노출', 0)),
                    "clicks": float(row.get('예측_클릭', 0)),
                    "conversions": float(row.get('예측_전환수', 0)),
                    "revenue": float(row.get('예측_전환값', 0)),
                    "roas": float(row.get('예측_ROAS', 0)),
                    "cpa": float(row.get('예측_CPA', 0))
                }
                seasonality_analysis['daily'].append(daily_item)

            # 날짜순 정렬
            seasonality_analysis['daily'] = sorted(seasonality_analysis['daily'], key=lambda x: x['date'])
            print(f"  - 일별 상세 데이터: {len(seasonality_analysis['daily'])}일")
    else:
        print("  - 기간유형 컬럼 없음 (요일별 데이터만 사용)")

    print(f"  - 총 계절성 인사이트: {len(seasonality_insights)}개")
else:
    print("  - prophet_forecast_by_seasonality.csv 파일 없음")

# ============================================================================
# 리타겟팅 분석 (타겟팅='리타겟팅' 데이터 분석)
# Type2: 연령+성별, Type5: 기기유형, Type6: 플랫폼, Type7: 노출기기(기기플랫폼)
# ============================================================================
print("리타겟팅 성과 분석 중...")

retargeting_analysis = {
    "summary": {},
    "by_age_gender": [],
    "by_device": [],
    "by_platform": [],
    "by_device_platform": []
}

# Type2에서 리타겟팅 연령+성별 조합 분석
if 'type2' in dimensions:
    type2_df = dimensions['type2'].copy()

    if '타겟팅' in type2_df.columns:
        retargeting_df = type2_df[type2_df['타겟팅'] == '리타겟팅'].copy()

        if len(retargeting_df) > 0:
            print(f"  - Type2 리타겟팅 데이터: {len(retargeting_df)}행")

            # 전체 요약 (Type2 기준)
            total_cost = retargeting_df['비용'].sum()
            total_conversions = retargeting_df['전환수'].sum()
            total_revenue = retargeting_df['전환값'].sum()

            retargeting_analysis['summary'] = {
                "total_cost": float(total_cost),
                "total_conversions": float(total_conversions),
                "total_revenue": float(total_revenue),
                "roas": float((total_revenue / total_cost * 100) if total_cost > 0 else 0),
                "cpa": float((total_cost / total_conversions) if total_conversions > 0 else 0),
                "data_rows": len(retargeting_df)
            }

            # 성별_통합/연령_통합 컬럼 사용
            gender_col = get_gender_column(retargeting_df)
            age_col = get_age_column(retargeting_df)

            # 연령+성별 조합 분석
            if gender_col in retargeting_df.columns and age_col in retargeting_df.columns:
                retargeting_df_combo = retargeting_df[
                    retargeting_df[gender_col].apply(is_valid_gender) &
                    retargeting_df[age_col].apply(is_valid_age)
                ].copy()
                retargeting_df_combo['성별_정규화'] = retargeting_df_combo[gender_col].apply(normalize_gender)
                retargeting_df_combo['연령_정규화'] = retargeting_df_combo[age_col]

                combo_summary = retargeting_df_combo.groupby(['연령_정규화', '성별_정규화']).agg({
                    '비용': 'sum',
                    '전환수': 'sum',
                    '전환값': 'sum'
                }).reset_index()

                combo_summary['ROAS'] = (combo_summary['전환값'] / combo_summary['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
                combo_summary['CPA'] = (combo_summary['비용'] / combo_summary['전환수']).replace([np.inf, -np.inf], 0).fillna(0)

                for _, row in combo_summary.iterrows():
                    retargeting_analysis['by_age_gender'].append({
                        "age": row['연령_정규화'],
                        "gender": row['성별_정규화'],
                        "label": f"{row['연령_정규화']} {row['성별_정규화']}",
                        "cost": float(row['비용']),
                        "conversions": float(row['전환수']),
                        "revenue": float(row['전환값']),
                        "roas": float(row['ROAS']),
                        "cpa": float(row['CPA'])
                    })

# Type5에서 리타겟팅 기기유형 분석
if 'type5' in dimensions:
    type5_df = dimensions['type5'].copy()

    if '타겟팅' in type5_df.columns and '기기유형' in type5_df.columns:
        retargeting_device = type5_df[type5_df['타겟팅'] == '리타겟팅'].copy()

        if len(retargeting_device) > 0:
            print(f"  - Type5 리타겟팅 데이터: {len(retargeting_device)}행")

            device_summary = retargeting_device.groupby('기기유형').agg({
                '비용': 'sum',
                '전환수': 'sum',
                '전환값': 'sum'
            }).reset_index()

            device_summary['ROAS'] = (device_summary['전환값'] / device_summary['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
            device_summary['CPA'] = (device_summary['비용'] / device_summary['전환수']).replace([np.inf, -np.inf], 0).fillna(0)

            for _, row in device_summary.iterrows():
                retargeting_analysis['by_device'].append({
                    "device": row['기기유형'],
                    "cost": float(row['비용']),
                    "conversions": float(row['전환수']),
                    "revenue": float(row['전환값']),
                    "roas": float(row['ROAS']),
                    "cpa": float(row['CPA'])
                })

# Type6에서 리타겟팅 플랫폼 분석
if 'type6' in dimensions:
    type6_df = dimensions['type6'].copy()

    if '타겟팅' in type6_df.columns and '플랫폼' in type6_df.columns:
        retargeting_platform = type6_df[type6_df['타겟팅'] == '리타겟팅'].copy()

        if len(retargeting_platform) > 0:
            print(f"  - Type6 리타겟팅 데이터: {len(retargeting_platform)}행")

            platform_summary = retargeting_platform.groupby('플랫폼').agg({
                '비용': 'sum',
                '전환수': 'sum',
                '전환값': 'sum'
            }).reset_index()

            platform_summary['ROAS'] = (platform_summary['전환값'] / platform_summary['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
            platform_summary['CPA'] = (platform_summary['비용'] / platform_summary['전환수']).replace([np.inf, -np.inf], 0).fillna(0)

            for _, row in platform_summary.iterrows():
                retargeting_analysis['by_platform'].append({
                    "platform": row['플랫폼'],
                    "cost": float(row['비용']),
                    "conversions": float(row['전환수']),
                    "revenue": float(row['전환값']),
                    "roas": float(row['ROAS']),
                    "cpa": float(row['CPA'])
                })

# Type7에서 리타겟팅 노출기기(기기플랫폼) 분석
if 'type7' in dimensions:
    type7_df = dimensions['type7'].copy()

    if '타겟팅' in type7_df.columns and '기기플랫폼' in type7_df.columns:
        retargeting_deviceplatform = type7_df[type7_df['타겟팅'] == '리타겟팅'].copy()

        if len(retargeting_deviceplatform) > 0:
            print(f"  - Type7 리타겟팅 데이터: {len(retargeting_deviceplatform)}행")

            deviceplatform_summary = retargeting_deviceplatform.groupby('기기플랫폼').agg({
                '비용': 'sum',
                '전환수': 'sum',
                '전환값': 'sum'
            }).reset_index()

            deviceplatform_summary['ROAS'] = (deviceplatform_summary['전환값'] / deviceplatform_summary['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
            deviceplatform_summary['CPA'] = (deviceplatform_summary['비용'] / deviceplatform_summary['전환수']).replace([np.inf, -np.inf], 0).fillna(0)

            for _, row in deviceplatform_summary.iterrows():
                retargeting_analysis['by_device_platform'].append({
                    "device_platform": row['기기플랫폼'],
                    "cost": float(row['비용']),
                    "conversions": float(row['전환수']),
                    "revenue": float(row['전환값']),
                    "roas": float(row['ROAS']),
                    "cpa": float(row['CPA'])
                })

# 리타겟팅 인사이트 생성
retargeting_insights = []

# 전체 요약 인사이트
if retargeting_analysis['summary'].get('total_cost', 0) > 0:
    summary_data = retargeting_analysis['summary']
    retargeting_insights.append({
        "type": "retargeting_summary",
        "message": f"리타겟팅 캠페인 전체 ROAS: {summary_data['roas']:.1f}%, 총 전환값: {summary_data['total_revenue']:,.0f}원",
        "severity": "info",
        "value": summary_data['roas']
    })

# 최고 성과 연령+성별 조합
if len(retargeting_analysis['by_age_gender']) > 0:
    best_combo = max(retargeting_analysis['by_age_gender'], key=lambda x: x['roas'])
    if best_combo['roas'] > 0:
        retargeting_insights.append({
            "type": "retargeting_best_age_gender",
            "message": f"리타겟팅에서 {best_combo['label']} 타겟이 ROAS {best_combo['roas']:.1f}%로 최고 성과입니다.",
            "severity": "opportunity",
            "label": best_combo['label'],
            "value": best_combo['roas']
        })

# 최고 성과 기기유형
if len(retargeting_analysis['by_device']) > 0:
    best_device = max(retargeting_analysis['by_device'], key=lambda x: x['roas'])
    if best_device['roas'] > 0:
        retargeting_insights.append({
            "type": "retargeting_best_device",
            "message": f"리타겟팅에서 {best_device['device']} 기기가 ROAS {best_device['roas']:.1f}%로 가장 효율적입니다.",
            "severity": "opportunity",
            "device": best_device['device'],
            "value": best_device['roas']
        })

# 최고 성과 플랫폼
if len(retargeting_analysis['by_platform']) > 0:
    best_platform = max(retargeting_analysis['by_platform'], key=lambda x: x['roas'])
    if best_platform['roas'] > 0:
        retargeting_insights.append({
            "type": "retargeting_best_platform",
            "message": f"리타겟팅에서 {best_platform['platform']} 플랫폼이 ROAS {best_platform['roas']:.1f}%로 가장 효율적입니다.",
            "severity": "opportunity",
            "platform": best_platform['platform'],
            "value": best_platform['roas']
        })

# 최고 성과 노출기기
if len(retargeting_analysis['by_device_platform']) > 0:
    best_dp = max(retargeting_analysis['by_device_platform'], key=lambda x: x['roas'])
    if best_dp['roas'] > 0:
        retargeting_insights.append({
            "type": "retargeting_best_device_platform",
            "message": f"리타겟팅에서 {best_dp['device_platform']} 노출기기가 ROAS {best_dp['roas']:.1f}%로 가장 효율적입니다.",
            "severity": "opportunity",
            "device_platform": best_dp['device_platform'],
            "value": best_dp['roas']
        })

print(f"  - 리타겟팅 연령+성별 분석: {len(retargeting_analysis['by_age_gender'])}개")
print(f"  - 리타겟팅 기기유형 분석: {len(retargeting_analysis['by_device'])}개")
print(f"  - 리타겟팅 플랫폼 분석: {len(retargeting_analysis['by_platform'])}개")
print(f"  - 리타겟팅 노출기기 분석: {len(retargeting_analysis['by_device_platform'])}개")
print(f"  - 리타겟팅 인사이트: {len(retargeting_insights)}개")

# ============================================================================
# 최종 JSON 생성 (top_recommendations 추가)
# ============================================================================

# 모든 알림 + 추천사항에서 score 기준 상위 5개 추출
all_scored_items = []

# alerts에서 score가 있는 항목 수집
for alert in alerts + prophet_alerts:
    if 'score' in alert:
        all_scored_items.append({
            "source": "alert",
            "title": alert.get('title', alert.get('type', '')),
            "message": alert.get('message', ''),
            "action": alert.get('action', ''),
            "category": alert.get('category', '알림'),
            "score": alert.get('score', 0),
            "severity": alert.get('severity', 'info')
        })

# recommendations에서 score가 있는 항목 수집
for rec in recommendations + prophet_recommendations:
    if 'score' in rec:
        all_scored_items.append({
            "source": "recommendation",
            "title": rec.get('title', ''),
            "message": rec.get('description', ''),
            "action": rec.get('action', ''),
            "category": rec.get('category', '추천'),
            "score": rec.get('score', 0),
            "priority": rec.get('priority', 'medium'),
            "expected_impact": rec.get('expected_impact', '')
        })

# score 기준 내림차순 정렬, 상위 5개 선택
all_scored_items.sort(key=lambda x: x.get('score', 0), reverse=True)
top_recommendations = all_scored_items[:5]

# Summary Card 생성 (AI 비서 톤)
overall_roas = summary["overall_roas"]
if overall_roas > THRESHOLDS['excellent_roas']:
    summary_message = "전반적으로 성과가 매우 우수합니다! 🔥 지금 전략을 유지하면서 스케일업을 고려하세요."
elif overall_roas > THRESHOLDS['high_roas']:
    summary_message = "성과가 좋습니다! 😊 약간의 최적화로 더 좋은 결과를 낼 수 있어요."
elif overall_roas > THRESHOLDS['low_roas']:
    summary_message = "기본적인 성과는 나오고 있어요. 🧐 타겟팅과 소재를 점검해보세요."
else:
    summary_message = "효율 개선이 필요한 시점입니다. 💡 추천 액션을 확인해주세요."

summary_card = {
    "title": "마케팅 종합 진단",
    "total_roas": f"{overall_roas:.1f}%",
    "total_roas_formatted": f"ROAS {overall_roas:.0f}%",
    "total_revenue_formatted": format_korean_currency(summary["total_revenue"]),
    "total_cost_formatted": format_korean_currency(summary["total_cost"]),
    "message": summary_message
}

insights = {
    "summary": summary,
    "summary_card": summary_card,  # AI 비서 스타일 요약 카드
    "top_recommendations": top_recommendations,  # Score 기반 상위 5개 핵심 제안
    "top_categories": top_categories_list,
    "gender_performance": gender_insights,
    "top_adsets": top_adsets[:10] if len(top_adsets) > 0 else [],
    "age_gender_combinations": age_gender_insights,
    "device_performance": device_insights,
    "deviceplatform_performance": deviceplatform_insights,
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
        "by_device": device_forecast_insights,
        "by_platform": platform_forecast_insights,
        "by_deviceplatform": deviceplatform_forecast_insights,
        "by_promotion": promotion_forecast_insights[:10] if len(promotion_forecast_insights) > 0 else [],
        "by_age_gender": age_gender_forecast_insights[:10] if len(age_gender_forecast_insights) > 0 else [],
        "alerts": prophet_alerts,
        "recommendations": prophet_recommendations
    },
    "alerts": alerts + prophet_alerts,
    "recommendations": recommendations + prophet_recommendations,
    "generated_at": datetime.now().isoformat(),
    "filter_info": {
        "days": args.days,
        "label": "전체 기간" if args.days == 0 else f"최근 {args.days}일",
        "is_filtered": args.days > 0
    },
    "overall": {
        "current_period": {
            "start_date": summary["analysis_period"]["start_date"],
            "end_date": summary["analysis_period"]["end_date"],
            "total_cost": summary["total_cost"],
            "total_cost_formatted": format_korean_currency(summary["total_cost"]),
            "total_conversions": summary["total_conversions"],
            "total_revenue": summary["total_revenue"],
            "total_revenue_formatted": format_korean_currency(summary["total_revenue"]),
            "overall_roas": summary["overall_roas"],
            "overall_cpa": summary["overall_cpa"],
            "overall_cpa_formatted": format_korean_currency(summary["overall_cpa"])
        },
        "trend": {
            "direction": "growing" if revenue_change > 10 else "stable" if revenue_change > -10 else "declining",
            "change_percent": float(revenue_change) if previous_revenue > 0 else 0
        }
    },
    "details": {
        "total_categories": len(category_agg) if 'type1' in dimensions and '유형구분' in dimensions['type1'].columns else len(category_summary),
        "paid_categories": len(paid_categories),
        "top_roas_category": top_categories_list[0]['name'] if len(top_categories_list) > 0 else None,
        "analysis_period_days": summary["analysis_period"]["total_days"],
        "alerts_count": len(alerts) + len(prophet_alerts),
        "recommendations_count": len(recommendations) + len(prophet_recommendations),
        "top_recommendations_count": len(top_recommendations),
        "timeseries_insights_count": len(timeseries_insights),
        "prophet_forecast_available": len(prophet_forecasts) > 0
    },
    "retargeting_analysis": retargeting_analysis,
    "retargeting_insights": retargeting_insights,
    "seasonality_analysis": seasonality_analysis,
    "seasonality_insights": seasonality_insights
}

# JSON 파일 저장 (NpEncoder로 NaN/Inf/numpy 타입 안전 처리)
output_file = data_dir / 'insights.json'
insights_cleaned = clean_dict_for_json(insights)
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(insights_cleaned, f, cls=NpEncoder, ensure_ascii=False, indent=2)

print(f"\n✓ 인사이트 생성 완료: {output_file}")

# 요약 출력
print("\n" + "=" * 100)
print("생성된 인사이트 요약 (AI 비서 톤앤매너 적용)")
print("=" * 100)
print(f"\n📊 전체 ROAS: {summary['overall_roas']:.1f}%")
print(f"💰 전체 CPA: {summary['overall_cpa']:,.0f}원")
print(f"📈 전체 매출: {format_korean_currency(summary['total_revenue'])}")
print(f"\n🏆 상위 유형구분: {len(top_categories_list)}개")
print(f"🔔 알림: {len(alerts)}개 (친화적 메시지 포함)")
print(f"💡 추천사항: {len(recommendations)}개 (Score 시스템 적용)")
print(f"⭐ Top Recommendations: {len(top_recommendations)}개 (대시보드 상단 표시용)")

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
print(f"  - 기기유형별 예측: {len(device_forecast_insights)}개")
print(f"  - 플랫폼별 예측: {len(platform_forecast_insights)}개")
print(f"  - 기기플랫폼별 예측: {len(deviceplatform_forecast_insights)}개")
print(f"  - 프로모션별 예측: {len(promotion_forecast_insights)}개")
print(f"  - 연령+성별 조합별 예측: {len(age_gender_forecast_insights)}개")
print(f"  - Prophet 알림: {len(prophet_alerts)}개")
print(f"  - Prophet 추천사항: {len(prophet_recommendations)}개")

print("\n[요일별 계절성 분석]")
print(f"  - 전체 요일별: {len(seasonality_analysis['overall'])}개")
print(f"  - 유형구분별 요일: {len(seasonality_analysis['by_category'])}개 카테고리")
print(f"  - 계절성 인사이트: {len(seasonality_insights)}개")

print("\n[리타겟팅 분석]")
print(f"  - 연령+성별 조합 (Type2): {len(retargeting_analysis['by_age_gender'])}개")
print(f"  - 기기유형 (Type5): {len(retargeting_analysis['by_device'])}개")
print(f"  - 플랫폼 (Type6): {len(retargeting_analysis['by_platform'])}개")
print(f"  - 노출기기 (Type7): {len(retargeting_analysis['by_device_platform'])}개")
print(f"  - 리타겟팅 인사이트: {len(retargeting_insights)}개")

print("\n" + "=" * 100)
print("인사이트 생성 완료! (v2.0 - AI 비서 톤앤매너)")
print("=" * 100)
print("\n[v2.0 신규 기능]")
print("  ✓ AI 비서 톤앤매너: 이모지와 친화적인 제목 사용")
print("  ✓ PERSONA_ACTIONS: 연령/성별/플랫폼별 맞춤 액션 제안")
print("  ✓ Score 시스템: 우선순위 기반 top_recommendations 5개")
print("  ✓ format_korean_currency: 억 원, 만 원 단위 표시")
print("  ✓ NpEncoder: NaN/Inf JSON 에러 원천 차단")
print("=" * 100)
