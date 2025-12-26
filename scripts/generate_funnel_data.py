"""
GA4 데이터를 기반으로 AARRR 퍼널 분석 데이터 생성

통합 버전: 통계 분석 + 마케터 친화적 인사이트
- K-Means 클러스터링 + BCG Matrix 분석
- 카이제곱 A/B 테스트 + 매출 임팩트 환산
- 7일/30일 이탈 예측 + CRM 레시피
- 카테고리별 임계값 설정
- 다중 기간 필터링 지원 (--days 파라미터)
"""
import pandas as pd
import json
import os
import numpy as np
import argparse
from pathlib import Path
from datetime import datetime, timedelta
from scipy import stats
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

# ============================================================================
# 커맨드라인 인자 파싱 (기간 필터링용)
# ============================================================================
parser = argparse.ArgumentParser(description='GA4 퍼널 분석 인사이트 생성')
parser.add_argument('--days', type=int, default=0,
                    help='최근 N일 데이터만 사용 (0=전체기간, 30/90/180 등)')
parser.add_argument('--category', type=str, default=None,
                    help='비즈니스 카테고리 (default/fashion/food/electronics)')
args, unknown = parser.parse_known_args()


def filter_by_days(df, days, date_column='Day'):
    """
    최근 N일 데이터만 필터링

    Args:
        df: DataFrame
        days: 필터링할 일수 (0이면 전체)
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
    filtered = df_copy[df_copy[date_column] >= cutoff_date].copy()

    return filtered


# ============================================================================
# 1. 설정 및 상수 정의 (Configuration)
# ============================================================================

# 기본 경로 설정
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / 'data'
GA4_DIR = DATA_DIR / 'GA4'
FUNNEL_DIR = DATA_DIR / 'funnel'

# 퍼널 순서 및 친절한 이름 매핑
FUNNEL_ORDER = ['유입', '활동', '관심', '결제진행', '구매완료']
FUNNEL_MAPPING = {
    '유입': 'Acquisition',
    '활동': 'Activation',
    '관심': 'Consideration',
    '결제진행': 'Conversion',
    '구매완료': 'Purchase'
}
FRIENDLY_NAMES = {
    '유입': '매장 방문 (유입)',
    '활동': '상품 구경 (활동)',
    '관심': '장바구니 (관심)',
    '결제진행': '결제창 진입',
    '구매완료': '구매 성공'
}

# ============================================================================
# 카테고리별 임계값 설정 (Thresholds by Category)
# ============================================================================
CATEGORY_THRESHOLDS = {
    'default': {
        'activation_rate_warning': 50.0,      # 유입→활동 전환 경고 기준 (%)
        'cart_conversion_warning': 20.0,      # 관심→구매 전환 경고 기준 (%)
        'checkout_conversion_warning': 50.0,  # 결제진행→구매 전환 경고 기준 (%)
        'ab_significance': 0.05,              # A/B 테스트 유의수준 (p-value)
        'churn_alert_threshold': -20.0,       # 이탈 경고 기준 (%)
        'improvement_threshold': 20.0,        # 성과 개선 기준 (%)
        'high_risk_threshold': -30.0,         # 고위험 기준 (%)
        'high_improvement_threshold': 30.0,   # 고성장 기준 (%)
        'min_sample_size': 5,                 # 카이제곱 최소 샘플
        'min_users_for_analysis': 100,        # 분석 최소 유저 수
        'potential_uplift_min': 100000        # 최소 매출 임팩트 (원)
    },
    'fashion': {  # 패션: 충동구매 多, 전환율 낮음
        'activation_rate_warning': 40.0,
        'cart_conversion_warning': 15.0,
        'checkout_conversion_warning': 45.0,
        'ab_significance': 0.05,
        'churn_alert_threshold': -25.0,
        'improvement_threshold': 25.0,
        'high_risk_threshold': -35.0,
        'high_improvement_threshold': 35.0,
        'min_sample_size': 5,
        'min_users_for_analysis': 100,
        'potential_uplift_min': 100000
    },
    'food': {  # 식품: 재구매 多, 전환율 높음
        'activation_rate_warning': 60.0,
        'cart_conversion_warning': 30.0,
        'checkout_conversion_warning': 60.0,
        'ab_significance': 0.05,
        'churn_alert_threshold': -15.0,
        'improvement_threshold': 15.0,
        'high_risk_threshold': -25.0,
        'high_improvement_threshold': 25.0,
        'min_sample_size': 5,
        'min_users_for_analysis': 50,
        'potential_uplift_min': 50000
    },
    'electronics': {  # 가전: 고관여, 전환율 낮지만 객단가 높음
        'activation_rate_warning': 45.0,
        'cart_conversion_warning': 10.0,
        'checkout_conversion_warning': 40.0,
        'ab_significance': 0.05,
        'churn_alert_threshold': -20.0,
        'improvement_threshold': 20.0,
        'high_risk_threshold': -30.0,
        'high_improvement_threshold': 30.0,
        'min_sample_size': 3,
        'min_users_for_analysis': 30,
        'potential_uplift_min': 500000
    }
}

# 현재 사용할 카테고리 (환경변수 또는 기본값)
CURRENT_CATEGORY = os.environ.get('BUSINESS_CATEGORY', 'default')

# CRM 액션 가이드 (이탈 발생 시 제안할 레시피)
CRM_RECIPES = {
    '활동': {
        'diagnosis': "고객들이 상품을 잘 안 눌러봅니다.",
        'action': "👀 '요즘 이게 제일 잘 나가요🔥' 베스트 상품 큐레이션 배너를 메인에 띄워보세요.",
        'technical': "랜딩페이지 최적화가 필요합니다."
    },
    '관심': {
        'diagnosis': "장바구니에 담고 잊어버린 분들이 많아요.",
        'action': "🛒 이탈 1시간 후 '고객님, 담아두신 상품이 곧 품절돼요' 알림톡을 발송하세요.",
        'technical': "장바구니 리마인더 캠페인을 설정하세요."
    },
    '결제진행': {
        'diagnosis': "다 사려다가 결제 직전에 나갔어요.",
        'action': "💳 결제 오류가 없는지 확인하고, '지금 결제하면 내일 도착 🚚' 문구로 안심시켜주세요.",
        'technical': "결제 프로세스 UX 점검이 필요합니다."
    },
    '유입': {
        'diagnosis': "방문자 자체가 줄고 있어요.",
        'action': "📢 광고 노출이 줄었거나, 시즌 이슈일 수 있어요. 캠페인 예산과 키워드를 점검하세요.",
        'technical': "마케팅 캠페인 점검이 필요합니다."
    }
}

# BCG Matrix 정의
BCG_MATRIX = {
    'cash_cow': {
        'type': 'Cash Cow (효자 채널)',
        'icon': '👑',
        'message': '방문자도 많고 구매도 잘해요! 우리 쇼핑몰의 기둥입니다.',
        'action': '👉 지금 고객들에게 \'세트 상품\'을 추천해서 객단가를 더 높여보세요.'
    },
    'hidden_gem': {
        'type': 'Hidden Gem (숨은 보석)',
        'icon': '💎',
        'message': '아직 소문이 덜 났지만, 들어오면 무조건 사네요!',
        'action': '👉 확신을 가지세요! 이 채널 예산을 20%만 늘려도 매출이 튈 겁니다.'
    },
    'money_pit': {
        'type': 'Money Pit (밑 빠진 독)',
        'icon': '💸',
        'message': '사람만 북적이고 실속이 없어요. 헛돈 쓰고 있을 수 있습니다.',
        'action': '👉 타겟이 너무 넓어요. \'제외 키워드\'를 설정해서 허수를 걸러내세요.'
    },
    'dog': {
        'type': 'Dog (아픈 손가락)',
        'icon': '🤔',
        'message': '방문도 적고 반응도 없어요.',
        'action': '👉 잠시 운영을 멈추거나, 이미지와 문구를 완전히 새롭게 바꿔보세요.'
    }
}

# ============================================================================
# 카테고리별 맞춤 처방 (Category Advice Map) - Upgrade Guide 반영
# ============================================================================
CATEGORY_ADVICE_MAP = {
    'SA': {  # 검색 광고 (Search Ads)
        'activation': "검색 키워드의 '의도(Intent)'와 랜딩페이지 내용이 일치하지 않습니다. T&D(Title & Description)를 점검하세요.",
        'conversion': "가격 비교 중인 고관여 유저입니다. 상단에 '경쟁사 대비 강점 비교표'를 배치하세요."
    },
    'DA': {  # 디스플레이 광고 (Display Ads)
        'activation': "Fat Finger(오클릭) 비율이 높거나 게재 지면 품질이 낮습니다. 앱/게임 등 저효율 지면을 제외하세요.",
        'conversion': "이미 구매한 상품이 노출되고 있습니다. 리타겟팅 모수에 Burn Pixel(구매자 제외)을 적용하세요."
    },
    'SNS': {  # 소셜 미디어 (Social Network)
        'activation': "광고 소재(Hook)와 랜딩페이지(Body)의 톤앤매너가 다릅니다. 낚시성 소재 여부를 점검하세요.",
        'conversion': "충동 구매 성향이 강합니다. '마감 임박', '한정 수량' 등 긴급성(Urgency) 트리거를 활용하세요."
    },
    'CRM': {  # 고객 관계 관리 (Customer Relationship Management)
        'activation': "메시지 제목(Title)의 약속이 본문에서 지켜지지 않았습니다. 혜택을 첫 화면에 즉시 노출하세요.",
        'conversion': "기존 고객입니다. 신규 가입 혜택보다는 '등급별 혜택'이나 '재구매 할인'을 제안하세요."
    },
    'PR': {  # 홍보/언론 (Public Relations)
        'activation': "기사/콘텐츠 내용을 기대하고 왔으나 정보가 부족합니다. 해당 이슈 전용 랜딩페이지를 연결하세요.",
        'conversion': "신뢰 기반 유입입니다. 언론 보도 내용이나 공식 인증 마크(Trustmark)를 강조하세요."
    },
    'Organic': {  # 자연 유입 (Organic Traffic)
        'activation': "페이지 로딩 속도가 느리거나 모바일 가독성이 떨어집니다. Core Web Vitals를 점검하세요.",
        'conversion': "회원가입 절차가 복잡합니다. 간편 로그인(소셜) 버튼을 상단으로 배치하세요."
    },
    'etc': {  # 기타 (Unknown/Other)
        'activation': "유입 경로를 정확히 파악하기 어렵습니다. UTM 파라미터 설정을 점검하세요.",
        'conversion': "상세 로그 분석을 통해 이탈 원인을 파악하고 UX를 개선하세요."
    }
}

# 마이크로 세그먼트 정의 (Micro-Segmentation)
MICRO_SEGMENT_DEFINITIONS = {
    'vip_segment': {
        'type': 'Hidden VIP (숨은 큰손)',
        'icon': '👑',
        'severity': 'opportunity',
        'description': '전환은 드물지만, 한 번 구매 시 객단가가 매우 높은 채널',
        'condition': '유입→활동 높음 + 전환율 낮음 + RPV 상위 25%',
        'action_hint': '타겟팅 정밀화로 고가치 고객 집중 공략'
    },
    'traffic_leak': {
        'type': 'Traffic Waste (밑 빠진 독)',
        'icon': '💸',
        'severity': 'high',
        'description': '사람만 많이 오고 실속이 없음. 예산 누수의 주범',
        'condition': '유입 상위 25% + 유입→활동 하위 25% + 전환율 하위 25%',
        'action_hint': '타겟팅/크리에이티브 점검 또는 예산 재배분'
    },
    'checkout_friction': {
        'type': 'Checkout Friction (결제 장벽)',
        'icon': '🚧',
        'severity': 'critical',
        'description': '구매 의사는 있으나 결제 과정에서 이탈 (기술적 오류 가능성)',
        'condition': '관심→구매 전환율 하위 25% + 관심 단계 유입 충분',
        'action_hint': '결제 UX 점검, 이탈 원인 분석 필요'
    },
    'growth_engine': {
        'type': 'Rising Star (성장 엔진)',
        'icon': '🚀',
        'severity': 'opportunity',
        'description': '규모는 작지만 반응률이 압도적. 예산 증액 시 고성장 예상',
        'condition': '유입→활동 상위 25% + 전환율 상위 25% + 유입 하위 50%',
        'action_hint': '예산 증액으로 스케일업 추진'
    }
}

# 데이터 부족 시 메시지
INSUFFICIENT_DATA_MESSAGES = {
    'default': "아직 데이터가 모자라요! 조금만 더 기다려주세요 🥚",
    'no_file': "데이터 파일을 찾을 수 없어요! 파일 경로를 확인해주세요 📂",
    'empty_data': "데이터가 텅 비어있어요! GA4 연동을 확인해주세요 🔌",
    'few_channels': "채널이 3개 미만이라 클러스터링이 어려워요. 채널을 더 추가해주세요 📊",
    'few_days': "분석하려면 최소 14일치 데이터가 필요해요. 조금만 기다려주세요 📅",
    'few_users': "방문자가 너무 적어서 통계적 의미가 없어요. 트래픽을 먼저 늘려보세요 👥",
    'no_conversion': "아직 구매 전환이 없어요! 첫 구매를 기다리는 중... 🎯"
}


# ============================================================================
# 2. 유틸리티 함수 (Helper Functions)
# ============================================================================

def get_thresholds(category=None):
    """카테고리별 임계값 반환"""
    if category is None:
        category = CURRENT_CATEGORY
    return CATEGORY_THRESHOLDS.get(category, CATEGORY_THRESHOLDS['default'])


def format_korean_currency(value):
    """숫자를 읽기 쉬운 한국 화폐 단위로 변환 (예: 15000000 -> 1,500만 원)"""
    if value is None or pd.isna(value):
        return "0원"
    value = float(value)
    if value >= 100000000:  # 1억 이상
        return f"{value/100000000:.1f}억 원"
    elif value >= 10000000:  # 1천만 이상
        return f"{value/10000000:.0f}천만 원"
    elif value >= 10000:  # 1만 이상
        return f"{value/10000:,.0f}만 원"
    else:
        return f"{int(value):,}원"


def format_number(value):
    """숫자에 천 단위 콤마 추가"""
    if value is None or pd.isna(value):
        return "0"
    return f"{int(value):,}"


def safe_division(numerator, denominator, multiply=100):
    """0으로 나누기 방지"""
    if denominator is None or denominator == 0:
        return 0
    return float(numerator / denominator * multiply)


def convert_to_serializable(obj):
    """numpy/pandas 타입을 JSON 직렬화 가능한 Python 타입으로 변환"""
    if isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        return float(obj)
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: convert_to_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_serializable(i) for i in obj]
    elif pd.isna(obj):
        return None
    return obj


def check_data_sufficiency(df, thresholds):
    """데이터 충분성 체크"""
    issues = []

    if df is None or df.empty:
        return [{'type': 'empty_data', 'message': INSUFFICIENT_DATA_MESSAGES['empty_data']}]

    total_users = df[df['funnel'] == '유입']['Total users'].sum() if '유입' in df['funnel'].values else 0
    if total_users < thresholds['min_users_for_analysis']:
        issues.append({
            'type': 'few_users',
            'message': INSUFFICIENT_DATA_MESSAGES['few_users'],
            'detail': f"현재 {format_number(total_users)}명 (최소 {thresholds['min_users_for_analysis']}명 필요)"
        })

    total_purchase = df[df['funnel'] == '구매완료']['Total users'].sum() if '구매완료' in df['funnel'].values else 0
    if total_purchase == 0:
        issues.append({
            'type': 'no_conversion',
            'message': INSUFFICIENT_DATA_MESSAGES['no_conversion']
        })

    unique_days = df['Day'].nunique() if 'Day' in df.columns else 0
    if unique_days < 14:
        issues.append({
            'type': 'few_days',
            'message': INSUFFICIENT_DATA_MESSAGES['few_days'],
            'detail': f"현재 {unique_days}일 (최소 14일 필요)"
        })

    return issues


# ============================================================================
# 2-1. RPV 및 동적 임계값 함수 (Upgrade Guide 반영)
# ============================================================================

def calculate_rpv_metrics(channel_funnel_pivot):
    """
    [지표 계산] RPV, Log Score, Traffic Rank 등 파생 변수 생성

    Args:
        channel_funnel_pivot: 채널별 퍼널 피벗 DataFrame

    Returns:
        DataFrame with RPV metrics added
    """
    df = channel_funnel_pivot.copy()

    # RPV (Revenue Per Visitor) 계산 (ZeroDivision 방지)
    df['rpv'] = df.apply(
        lambda x: x['Revenue'] / x['유입'] if x.get('유입', 0) > 0 else 0,
        axis=1
    )

    # Log RPV 계산 (왜도 보정, 내부 판단용)
    df['rpv_log'] = np.log1p(df['rpv'])

    # Traffic Rank (백분위) 계산
    if '유입' in df.columns and len(df) > 0:
        df['traffic_rank_pct'] = df['유입'].rank(pct=True)
    else:
        df['traffic_rank_pct'] = 0

    return df


def get_dynamic_thresholds(channel_funnel_pivot):
    """
    [동적 임계값] 현재 데이터셋의 분포(Quantile)를 기준으로 기준선 설정

    Args:
        channel_funnel_pivot: 채널별 퍼널 피벗 DataFrame (RPV 계산 완료)

    Returns:
        dict: 동적 임계값 딕셔너리
    """
    df = channel_funnel_pivot

    # 기본값 (데이터 부족 시)
    defaults = {
        'traffic_high': 100,
        'traffic_low': 50,
        'rpv_high': 10000,
        'rpv_low': 3000
    }

    if df.empty or len(df) < 3:
        return defaults

    try:
        return {
            'traffic_high': df['유입'].quantile(0.8) if '유입' in df.columns else defaults['traffic_high'],
            'traffic_low': df['유입'].quantile(0.5) if '유입' in df.columns else defaults['traffic_low'],
            'rpv_high': df['rpv'].quantile(0.8) if 'rpv' in df.columns else defaults['rpv_high'],
            'rpv_low': df['rpv'].quantile(0.4) if 'rpv' in df.columns else defaults['rpv_low']
        }
    except Exception:
        return defaults


def get_category_advice(category, issue_type):
    """
    [전문가 진단] Category별 맞춤 액션 가이드 반환 (O(1) Lookup)

    Args:
        category: 채널 카테고리 (SA, DA, SNS, CRM, PR, Organic, etc)
        issue_type: 이슈 유형 ('activation' 또는 'conversion')

    Returns:
        str: 카테고리별 맞춤 처방 메시지
    """
    default_msg = "상세 로그 분석을 통해 이탈 원인을 파악하고 UX를 개선하세요."

    # 카테고리 정규화 (대소문자, 공백 처리)
    if category is None:
        category = 'etc'
    category = str(category).strip()

    # CATEGORY_ADVICE_MAP에서 조회
    return CATEGORY_ADVICE_MAP.get(category, CATEGORY_ADVICE_MAP.get('etc', {})).get(issue_type, default_msg)


def generate_micro_segment_alerts(channel_funnel_pivot, df_raw, thresholds):
    """
    [마이크로 세그먼트] 데이터 분석 및 마이크로 세그먼트 Alert 생성

    Args:
        channel_funnel_pivot: 채널별 퍼널 피벗 DataFrame (RPV 계산 완료)
        df_raw: 원본 GA4 데이터 (category 컬럼 포함)
        thresholds: 카테고리별 임계값

    Returns:
        tuple: (alerts list, channel_metrics_enhanced dict, dynamic_thresholds dict)
    """
    # RPV 지표 계산
    df = calculate_rpv_metrics(channel_funnel_pivot)

    # 동적 임계값 계산
    dynamic_th = get_dynamic_thresholds(df)

    alerts = []
    channel_metrics = {}

    # 채널별 category 매핑 (원본 데이터에서 추출)
    channel_category_map = {}
    if 'channel' in df_raw.columns and 'category' in df_raw.columns:
        channel_category_map = df_raw.groupby('channel')['category'].first().to_dict()

    for _, row in df.iterrows():
        channel = row['channel']
        category = channel_category_map.get(channel, 'etc')

        # 지표 추출
        acq = row.get('유입', 0)
        activation = row.get('활동', 0)
        consideration = row.get('관심', 0)
        purchase = row.get('구매완료', 0)
        revenue = row.get('Revenue', 0)
        rpv = row.get('rpv', 0)

        # 전환율 계산
        act_rate = (activation / acq * 100) if acq > 0 else 0
        cvr = (purchase / acq * 100) if acq > 0 else 0
        cart_rate = (purchase / consideration * 100) if consideration > 0 else 0

        # 예상 손실 유저 (Impact 산출용)
        avg_act_rate = df['활동'].sum() / df['유입'].sum() * 100 if df['유입'].sum() > 0 else 0
        loss_users = int(acq * (avg_act_rate - act_rate) / 100) if act_rate < avg_act_rate else 0

        # 세그먼트 분류
        segment_type = None

        # ----------------------------------------------------------------
        # [Logic A] Hidden VIP (저전환/고가치) -> Opportunity
        # ----------------------------------------------------------------
        if (cvr < 1.0) and (rpv >= dynamic_th['rpv_high']) and rpv > 0:
            segment_type = 'vip_segment'
            seg_def = MICRO_SEGMENT_DEFINITIONS[segment_type]
            alerts.append({
                'type': 'opportunity',
                'sub_type': segment_type,
                'severity': seg_def['severity'],
                'title': f"{seg_def['icon']} {channel}: VIP 채널 발견 ({category})",
                'message': f"전환율은 낮지만, 객단가가 높아 방문당 {int(rpv):,}원의 가치를 창출합니다.",
                'action': "전환율보다는 ROAS 유지에 집중하세요. 섣불리 예산을 줄이지 마세요.",
                'category': category,
                'metrics': {'유입→활동': round(act_rate, 1), '전환율': round(cvr, 2), 'RPV': int(rpv)}
            })

        # ----------------------------------------------------------------
        # [Logic B] Traffic Waste (고유입/저효율) -> High Alert
        # ----------------------------------------------------------------
        elif (acq >= dynamic_th['traffic_high']) and (act_rate < 40) and (rpv < dynamic_th['rpv_low']):
            segment_type = 'traffic_leak'
            seg_def = MICRO_SEGMENT_DEFINITIONS[segment_type]
            advice = get_category_advice(category, 'activation')

            alerts.append({
                'type': 'problem',
                'sub_type': segment_type,
                'severity': seg_def['severity'],
                'title': f"{seg_def['icon']} {channel}: 예산 누수 경고",
                'message': f"[{category}] 유입은 많지만(Top 20%) 실속이 없습니다. 예상 손실 유저: {loss_users:,}명",
                'diagnosis': f"[{category}] 채널 특성에 맞지 않는 랜딩페이지 전략입니다.",
                'action': advice,
                'category': category,
                'metrics': {'유입→활동': round(act_rate, 1), '전환율': round(cvr, 2), '유입': int(acq)}
            })

        # ----------------------------------------------------------------
        # [Logic C] Checkout Friction (결제 이탈) -> Critical Alert
        # ----------------------------------------------------------------
        if (consideration > 50) and (cart_rate < 10):
            segment_type = 'checkout_friction'
            seg_def = MICRO_SEGMENT_DEFINITIONS[segment_type]
            advice = get_category_advice(category, 'conversion')

            alerts.append({
                'type': 'problem',
                'sub_type': segment_type,
                'severity': seg_def['severity'],
                'title': f"{seg_def['icon']} {channel}: 결제 장벽 감지",
                'message': f"관심→구매 전환율이 {cart_rate:.1f}%로 매우 낮습니다. (기준 10% 대비 -{(10-cart_rate):.1f}%p)",
                'diagnosis': f"[{category}] 유저의 구매 결정을 막는 요소가 있습니다.",
                'action': advice,
                'category': category,
                'metrics': {'유입→활동': round(act_rate, 1), '전환율': round(cvr, 2), '관심→구매': round(cart_rate, 1)}
            })

        # ----------------------------------------------------------------
        # [Logic D] Rising Star (성장 기회) -> Opportunity
        # ----------------------------------------------------------------
        elif (acq < dynamic_th['traffic_low']) and (act_rate > 70) and acq > 0:
            segment_type = 'growth_engine'
            seg_def = MICRO_SEGMENT_DEFINITIONS[segment_type]

            alerts.append({
                'type': 'opportunity',
                'sub_type': segment_type,
                'severity': seg_def['severity'],
                'title': f"{seg_def['icon']} {channel}: 성장 엔진 점화",
                'message': f"방문자의 {act_rate:.1f}%가 반응하는 알짜 채널입니다. 예산 증액 시 성장이 확실시됩니다.",
                'action': "트래픽 볼륨을 확보하여 매출 규모를 키우세요.",
                'category': category,
                'metrics': {'유입→활동': round(act_rate, 1), '전환율': round(cvr, 2), '유입': int(acq)}
            })

        # 채널별 확장 메트릭스 저장
        channel_metrics[channel] = {
            'category': category,
            'rpv': round(rpv, 2),
            'rpv_log': round(row.get('rpv_log', 0), 4),
            'traffic_rank_pct': round(row.get('traffic_rank_pct', 0), 2),
            'segment_type': segment_type,
            'activation_rate': round(act_rate, 1),
            'cvr': round(cvr, 2),
            'cart_conversion_rate': round(cart_rate, 1)
        }

    return alerts, channel_metrics, dynamic_th


# ============================================================================
# 3. 자연어 메시지 생성 함수 (Natural Language Generation)
# ============================================================================

def generate_friendly_message(message_type, **kwargs):
    """친절한 자연어 메시지 생성"""

    templates = {
        # 성과 요약
        'performance_good': "이번 달 성과가 좋아요! 전환율 {cvr}%로 순항 중 💪",
        'performance_warning': "분발해야 합니다! 이탈률 방어가 시급해요 🚨",
        'performance_stable': "안정적으로 운영되고 있어요. 이대로 유지해주세요 👍",

        # 퍼널 이탈 알림
        'activation_low_paid': "🚨 [{channel}] 광고비가 새고 있어요!\n광고를 클릭한 10명 중 {drop_count}명이 3초 만에 나갑니다.\n💡 광고 문구와 상세페이지 내용이 달라서 고객이 실망했을 확률이 높아요!",
        'activation_low_organic': "🐢 [{channel}] 페이지가 너무 느린가요?\n검색해서 들어온 분들은 참을성이 없어서 로딩이 길면 바로 나갑니다.\n💡 상세페이지의 고용량 이미지를 압축해서 로딩 속도를 높여주세요.",
        'cart_abandonment': "🛒 [{channel}] 다 골라놓고 망설이고 있어요!\n장바구니까지 온 고객의 {abandon_rate:.1f}%가 결제 없이 이탈했습니다.\n💡 배송비가 비싸거나, 회원가입이 귀찮아서 그럴 수 있어요. 이탈 시점에 '첫 구매 무료배송' 팝업을 띄워보세요.",

        # 이탈/개선 예측
        'churn_warning': "📉 [{stage}] 지난주보다 {change:.1f}% 줄었어요.\n{diagnosis}\n💡 {action}",
        'improvement_notice': "📈 [{stage}] 지난주보다 {change:.1f}% 늘었어요! 🎉\n현재 전략이 효과를 보고 있습니다. 계속 유지하세요!",

        # A/B 테스트
        'ab_winner': "🎉 [{winner}] 채널 효율이 압도적으로 좋습니다!\n전환율이 {diff:.1f}%p 더 높습니다.\n💰 만약 [{loser}] 대신 [{winner}]에 집중했다면, 약 {potential}을 더 벌었을 거예요.",
        'ab_no_difference': "두 채널 간 유의미한 차이가 없어요. 좀 더 지켜봐야 합니다 🔍",

        # 클러스터링
        'cluster_high': "🏆 고성과 그룹: {channels}\n이 채널들이 매출의 핵심이에요!",
        'cluster_mid': "📊 성장 가능 그룹: {channels}\n잠재력이 있어요. 투자를 고려해보세요.",
        'cluster_low': "⚠️ 개선 필요 그룹: {channels}\n효율이 낮아요. 전략 재검토가 필요합니다.",

        # 데이터 부족
        'insufficient_data': "😅 {reason}\n{detail}"
    }

    template = templates.get(message_type, message_type)
    try:
        return template.format(**kwargs)
    except KeyError:
        return template


def generate_alert_message(alert_type, channel, rate, thresholds):
    """알림 메시지 생성"""

    if alert_type == 'activation_low':
        if 'Paid' in channel or 'Display' in channel or 'CPC' in channel:
            return {
                'severity': 'high',
                'title': f"🚨 [{channel}] 광고비가 새고 있어요!",
                'message': f"광고를 클릭한 10명 중 {10 - int(rate/10)}명이 3초 만에 나갑니다.",
                'reason': "광고 문구와 상세페이지 내용이 달라서 고객이 실망했을 확률 90%!",
                'action': "광고 소재와 랜딩페이지 첫 화면이 일치하는지 지금 바로 확인하세요.",
                'technical': f"유입→활동 전환율이 {rate:.1f}%로 기준({thresholds['activation_rate_warning']}%) 미달"
            }
        else:
            return {
                'severity': 'medium',
                'title': f"🐢 [{channel}] 페이지가 너무 느린가요?",
                'message': "검색해서 들어온 분들은 참을성이 없어서 로딩이 길면 바로 나갑니다.",
                'reason': "페이지 로딩 속도나 첫 화면 콘텐츠 문제일 수 있어요.",
                'action': "상세페이지의 고용량 이미지를 압축해서 로딩 속도를 높여주세요.",
                'technical': f"유입→활동 전환율이 {rate:.1f}%로 기준({thresholds['activation_rate_warning']}%) 미달"
            }

    elif alert_type == 'cart_abandonment':
        return {
            'severity': 'high',
            'title': f"🛒 [{channel}] 다 골라놓고 망설이고 있어요!",
            'message': f"장바구니까지 온 고객의 {100-rate:.1f}%가 결제 없이 이탈했습니다.",
            'reason': "배송비가 비싸거나, 회원가입이 귀찮아서 그럴 수 있어요.",
            'action': "이탈 시점에 '첫 구매 무료배송' 팝업을 띄워보세요.",
            'technical': f"관심→구매 전환율이 {rate:.1f}%로 기준({thresholds['cart_conversion_warning']}%) 미달"
        }

    return None


def generate_churn_message(stage, change_pct, thresholds):
    """이탈 예측 메시지 생성"""
    recipe = CRM_RECIPES.get(stage, CRM_RECIPES['유입'])
    friendly_stage = FRIENDLY_NAMES.get(stage, stage)

    risk_level = 'high' if change_pct < thresholds['high_risk_threshold'] else 'medium'

    return {
        'stage': stage,
        'stage_friendly': friendly_stage,
        'risk_level': risk_level,
        'change_pct': round(change_pct, 2),
        'trend_message': f"📉 지난주보다 {abs(change_pct):.1f}% 줄었어요.",
        'diagnosis': recipe['diagnosis'],
        'action': recipe['action'],
        'technical': recipe['technical']
    }


def generate_improvement_message(stage, change_pct, thresholds):
    """성과 개선 메시지 생성"""
    friendly_stage = FRIENDLY_NAMES.get(stage, stage)

    improvement_level = 'high' if change_pct > thresholds['high_improvement_threshold'] else 'medium'

    return {
        'stage': stage,
        'stage_friendly': friendly_stage,
        'improvement_level': improvement_level,
        'change_pct': round(change_pct, 2),
        'trend_message': f"📈 지난주보다 {change_pct:.1f}% 늘었어요! 🎉",
        'message': "현재 전략이 효과를 보고 있습니다. 계속 유지하세요!",
        'action': f"{friendly_stage} 단계의 성과가 개선되고 있습니다. 예산 확대를 검토하세요."
    }


# ============================================================================
# 4. 분석 모듈 (Analysis Modules)
# ============================================================================

def analyze_bcg_matrix(channel_funnel_pivot, thresholds):
    """
    채널 성과 매트릭스 분석 (BCG Matrix 응용)
    Traffic(규모) vs Efficiency(효율)로 4사분면 분류
    """
    if channel_funnel_pivot.empty:
        return {'status': 'insufficient_data', 'message': INSUFFICIENT_DATA_MESSAGES['few_channels']}

    results = {}

    # 전체 평균 계산
    avg_traffic = channel_funnel_pivot['유입'].mean() if '유입' in channel_funnel_pivot.columns else 0

    # CVR은 단순 평균이 아닌, 전체 구매/전체 유입으로 계산 (트래픽 가중 평균)
    total_acquisition = channel_funnel_pivot['유입'].sum() if '유입' in channel_funnel_pivot.columns else 0
    total_purchase = channel_funnel_pivot['구매완료'].sum() if '구매완료' in channel_funnel_pivot.columns else 0
    avg_cvr = (total_purchase / total_acquisition * 100) if total_acquisition > 0 else 0

    for _, row in channel_funnel_pivot.iterrows():
        channel = row['channel']
        traffic = row.get('유입', 0)
        cvr = row.get('CVR', 0)
        revenue = row.get('Revenue', 0)

        # 4사분면 분류
        if traffic >= avg_traffic and cvr >= avg_cvr:
            matrix_type = 'cash_cow'
        elif traffic < avg_traffic and cvr >= avg_cvr:
            matrix_type = 'hidden_gem'
        elif traffic >= avg_traffic and cvr < avg_cvr:
            matrix_type = 'money_pit'
        else:
            matrix_type = 'dog'

        bcg_info = BCG_MATRIX[matrix_type]

        results[channel] = {
            'stats': {
                'users': int(traffic),
                'users_formatted': format_number(traffic),
                'cvr': round(cvr, 2),
                'revenue': float(revenue),
                'revenue_formatted': format_korean_currency(revenue)
            },
            'bcg_matrix': {
                'quadrant': matrix_type,
                'type': bcg_info['type'],
                'icon': bcg_info['icon'],
                'message': bcg_info['message'],
                'action': bcg_info['action']
            }
        }

    return {
        'status': 'success',
        'avg_traffic': int(avg_traffic),
        'avg_cvr': round(avg_cvr, 2),
        'channels': results
    }


def analyze_contextual_alerts(df, channel_funnel_pivot, thresholds):
    """
    상황(Context) 인식형 경고 생성
    채널 특성에 따른 원인 추론
    """
    alerts = []

    for _, row in channel_funnel_pivot.iterrows():
        channel = row['channel']
        users = row.get('유입', 0)

        if users < thresholds['min_users_for_analysis']:
            continue

        activation = row.get('활동', 0)
        consideration = row.get('관심', 0)
        purchase = row.get('구매완료', 0)

        act_rate = safe_division(activation, users)
        cart_to_pay_rate = safe_division(purchase, consideration)

        # 1. 유입→활동 전환율 체크
        if act_rate < thresholds['activation_rate_warning']:
            alert = generate_alert_message('activation_low', channel, act_rate, thresholds)
            if alert:
                alerts.append(alert)

        # 2. 관심→구매 전환율 체크
        if consideration > 50 and cart_to_pay_rate < thresholds['cart_conversion_warning']:
            alert = generate_alert_message('cart_abandonment', channel, cart_to_pay_rate, thresholds)
            if alert:
                alerts.append(alert)

    return alerts


def analyze_ab_with_revenue_impact(channel_funnel_pivot, thresholds):
    """
    A/B 테스트 및 매출 임팩트 분석
    통계적 유의성 + 돈으로 환산
    """
    ab_results = []
    revenue_insights = []

    if len(channel_funnel_pivot) < 2:
        return ab_results, [{'status': 'insufficient_data', 'message': INSUFFICIENT_DATA_MESSAGES['few_channels']}]

    channels = channel_funnel_pivot['channel'].values

    for i, ch_a in enumerate(channels):
        for ch_b in channels[i+1:]:
            try:
                row_a = channel_funnel_pivot[channel_funnel_pivot['channel'] == ch_a].iloc[0]
                row_b = channel_funnel_pivot[channel_funnel_pivot['channel'] == ch_b].iloc[0]

                users_a = row_a.get('유입', 0)
                conv_a = row_a.get('구매완료', 0)
                rev_a = row_a.get('Revenue', 0)

                users_b = row_b.get('유입', 0)
                conv_b = row_b.get('구매완료', 0)
                rev_b = row_b.get('Revenue', 0)

                # 카이제곱 검정
                contingency_table = np.array([
                    [conv_a, users_a - conv_a],
                    [conv_b, users_b - conv_b]
                ])

                if contingency_table.min() < thresholds['min_sample_size']:
                    continue

                chi2, p_value, _, _ = stats.chi2_contingency(contingency_table)

                cvr_a = safe_division(conv_a, users_a)
                cvr_b = safe_division(conv_b, users_b)

                is_significant = bool(p_value < thresholds['ab_significance'])

                ab_result = {
                    'type': 'channel_comparison',
                    'group_a': ch_a,
                    'group_b': ch_b,
                    'metric': 'conversion_rate',
                    'chi2_statistic': float(chi2),
                    'p_value': float(p_value),
                    'significant': is_significant,
                    'cvr_a': round(float(cvr_a), 2),
                    'cvr_b': round(float(cvr_b), 2)
                }

                # 유의미한 경우 매출 임팩트 계산
                if is_significant:
                    winner = ch_a if cvr_a > cvr_b else ch_b
                    loser = ch_b if cvr_a > cvr_b else ch_a
                    cvr_diff = abs(cvr_a - cvr_b) / 100

                    # 평균 객단가
                    total_conv = conv_a + conv_b
                    total_rev = rev_a + rev_b
                    arpu = total_rev / total_conv if total_conv > 0 else 0

                    # 잠재 매출
                    loser_users = users_b if cvr_a > cvr_b else users_a
                    potential_revenue = loser_users * cvr_diff * arpu

                    if potential_revenue > thresholds['potential_uplift_min']:
                        revenue_insights.append({
                            'test_pair': f"{ch_a} vs {ch_b}",
                            'winner': winner,
                            'loser': loser,
                            'message': f"🎉 [{winner}] 채널 효율이 압도적으로 좋습니다!",
                            'detail': f"전환율이 {abs(cvr_a-cvr_b):.1f}%p 더 높습니다.",
                            'impact': f"💰 만약 [{loser}] 대신 [{winner}]에 집중했다면, 약 {format_korean_currency(potential_revenue)}을 더 벌었을 거예요.",
                            'potential_revenue': potential_revenue,
                            'potential_revenue_formatted': format_korean_currency(potential_revenue),
                            'action': f"이제 고민 끝! [{winner}] 스타일의 전략을 확대 적용하세요."
                        })

                ab_results.append(ab_result)

            except Exception as e:
                continue

    return ab_results, revenue_insights


def analyze_kmeans_clustering(channel_funnel_pivot, thresholds):
    """
    K-Means 클러스터링으로 채널 퍼널 건강도 분석

    BCG Matrix와의 차별점:
    - BCG: 트래픽 + CVR (결과 기반, "어디에 투자?")
    - K-Means: 퍼널 전 단계 효율 (과정 기반, "어디를 고쳐?")
    """

    if len(channel_funnel_pivot) < 3:
        return {
            'status': 'insufficient_data',
            'message': INSUFFICIENT_DATA_MESSAGES['few_channels']
        }

    try:
        clustering_features = []
        channel_names = []
        channel_stage_rates = []  # 각 채널의 단계별 전환율 저장

        for _, row in channel_funnel_pivot.iterrows():
            total_acquisition = row.get('유입', 0)
            if total_acquisition > 0:
                # 각 단계별 전환율 계산
                activation_rate = row.get('활동', 0) / total_acquisition
                consideration_rate = row.get('관심', 0) / total_acquisition
                conversion_rate = row.get('결제진행', 0) / total_acquisition
                purchase_rate = row.get('구매완료', 0) / total_acquisition

                features = [
                    activation_rate,
                    consideration_rate,
                    conversion_rate,
                    purchase_rate,
                    row.get('CVR', 0) / 100,
                    row.get('Revenue', 0) / total_acquisition
                ]
                clustering_features.append(features)
                channel_names.append(row['channel'])

                # 단계별 전환율 저장 (퍼널 건강도 계산용)
                channel_stage_rates.append({
                    'activation': activation_rate,
                    'consideration': consideration_rate,
                    'conversion': conversion_rate,
                    'purchase': purchase_rate
                })

        if len(clustering_features) < 3:
            return {
                'status': 'insufficient_data',
                'message': INSUFFICIENT_DATA_MESSAGES['few_channels']
            }

        X = np.array(clustering_features)
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        n_clusters = min(3, len(channel_names))
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        cluster_labels = kmeans.fit_predict(X_scaled)

        # 클러스터별 퍼널 건강도로 순위 결정 (CVR만이 아닌 전 단계 평균)
        cluster_performance = {}
        for i in range(n_clusters):
            cluster_indices = [j for j, label in enumerate(cluster_labels) if label == i]
            # 퍼널 건강도 = 각 단계별 전환율의 평균 (유입→활동, 활동→관심, 관심→결제, 결제→구매)
            funnel_health_scores = []
            for j in cluster_indices:
                rates = channel_stage_rates[j]
                # 4개 단계 전환율의 평균
                health_score = np.mean([
                    rates['activation'],
                    rates['consideration'],
                    rates['conversion'],
                    rates['purchase']
                ])
                funnel_health_scores.append(health_score)
            cluster_performance[i] = np.mean(funnel_health_scores)

        # 퍼널 건강도 순으로 정렬
        sorted_clusters = sorted(cluster_performance.items(), key=lambda x: x[1], reverse=True)
        cluster_rank = {old: new for new, (old, _) in enumerate(sorted_clusters)}

        # 클러스터별 채널 그룹화
        clusters = {'healthy': [], 'partial': [], 'needs_attention': []}
        cluster_labels_map = {0: 'healthy', 1: 'partial', 2: 'needs_attention'}

        for channel, label in zip(channel_names, cluster_labels):
            new_label = cluster_rank[label]
            group = cluster_labels_map.get(new_label, 'partial')
            clusters[group].append(channel)

        return {
            'status': 'success',
            'n_clusters': n_clusters,
            'clusters': clusters,
            'description': {
                'healthy': '🩺 퍼널 건강 - 모든 단계가 원활해요! 현재 전략을 유지하세요.',
                'partial': '🔧 부분 최적화 필요 - 일부 단계에서 이탈이 발생해요. 병목 구간을 점검하세요.',
                'needs_attention': '🚨 퍼널 점검 필요 - 여러 단계에서 이탈이 심해요. 전면 재검토가 필요합니다.'
            },
            'recommendations': {
                'healthy': '벤치마킹 대상 - 이 채널의 랜딩페이지/UX를 다른 채널에 적용해보세요.',
                'partial': '단계별 분석 필요 - 어느 단계에서 이탈이 큰지 확인하고 해당 구간을 개선하세요.',
                'needs_attention': '근본 원인 파악 - 타겟 고객이 맞는지, 광고 메시지가 적절한지 점검하세요.'
            },
            'analysis_method': '퍼널 건강도 (유입→활동→관심→결제 각 단계 전환율 평균)'
        }

    except Exception as e:
        return {
            'status': 'error',
            'message': f"클러스터링 분석 중 오류: {str(e)}"
        }


def analyze_churn_and_improvement(daily_funnel_pivot, thresholds, filter_days=0):
    """
    이탈 예측 및 성과 개선 분석

    시점 간 추이 분석 방식:
    - d_day (마지막 7일 평균) vs d_day-N (N일 전 7일 평균)
    - 변화율 = (d_day_value - d_day-N_value) / d_day_value × 100
    - 180d, 90d, 30d 각각의 추이를 분석
    """

    results = {
        'churn_7d': [],
        'churn_30d': [],
        'improvement_7d': [],
        'improvement_30d': [],
        'crm_actions': [],
        'crm_actions_by_trend': {
            'full': [],
            '180d': [],
            '90d': [],
            '30d': []
        }
    }

    data_len = len(daily_funnel_pivot)

    if data_len < 14:
        results['status'] = 'insufficient_data'
        results['message'] = INSUFFICIENT_DATA_MESSAGES['few_days']
        return results

    # 시점 간 추이 분석 (주간 평균 사용)
    # d_day: 마지막 7일 평균
    # d_day-N: N일 전 시점의 7일 평균
    trend_periods = [
        {'key': '180d', 'days': 180, 'label': '180일 전 대비', 'min_data': 187},
        {'key': '90d', 'days': 90, 'label': '90일 전 대비', 'min_data': 97},
        {'key': '30d', 'days': 30, 'label': '30일 전 대비', 'min_data': 37}
    ]

    for stage in ['유입', '활동', '관심', '결제진행']:
        if stage not in daily_funnel_pivot.columns:
            continue

        # d_day: 마지막 7일 평균
        d_day_value = daily_funnel_pivot[stage].tail(7).mean()

        if d_day_value <= 0:
            continue

        # 각 기간별 추이 분석
        for period in trend_periods:
            if data_len >= period['min_data']:
                # d_day-N: N일 전 시점의 7일 평균 (예: -37:-30 = 30일 전 기준 7일)
                start_idx = -(period['days'] + 7)
                end_idx = -period['days']
                d_day_n_value = daily_funnel_pivot[stage].iloc[start_idx:end_idx].mean()

                if d_day_n_value > 0:
                    # 변화율 = (현재 - 과거) / 현재 × 100
                    change_pct = ((d_day_value - d_day_n_value) / d_day_value) * 100

                    # 이탈 위험 판단 (값이 감소한 경우, 즉 change_pct가 음수)
                    if change_pct < thresholds['churn_alert_threshold']:
                        priority = 'high' if change_pct < thresholds['high_risk_threshold'] else 'medium'
                        results['crm_actions_by_trend'][period['key']].append({
                            'stage': FRIENDLY_NAMES.get(stage, stage),
                            'trend': f"📉 {period['label']} {abs(change_pct):.1f}% 감소",
                            'diagnosis': CRM_RECIPES.get(stage, CRM_RECIPES['유입'])['diagnosis'],
                            'prescription': CRM_RECIPES.get(stage, CRM_RECIPES['유입'])['action'],
                            'priority': priority,
                            'change_pct': round(change_pct, 1),
                            'd_day_value': round(d_day_value, 1),
                            'd_day_n_value': round(d_day_n_value, 1),
                            'period_days': period['days']
                        })

    # 전체 기간용 crm_actions (기존 7일 비교 방식 유지)
    results['crm_actions_by_trend']['full'] = results['crm_actions_by_trend']['30d'].copy() if results['crm_actions_by_trend']['30d'] else []

    # 하위 호환성을 위한 crm_actions (전체 기간 = 30d 추이 사용)
    results['crm_actions'] = results['crm_actions_by_trend']['30d'].copy()

    # 기존 7일 비교 (churn_7d, improvement_7d용 - 전체 기간용)
    for stage in ['유입', '활동', '관심', '결제진행']:
        if stage not in daily_funnel_pivot.columns:
            continue

        if filter_days == 0 and data_len >= 14:
            recent_7d = daily_funnel_pivot[stage].tail(7).mean()
            previous_7d = daily_funnel_pivot[stage].iloc[-14:-7].mean()

            if previous_7d > 0:
                change_pct = ((recent_7d - previous_7d) / previous_7d) * 100

                if change_pct < thresholds['churn_alert_threshold']:
                    churn_msg = generate_churn_message(stage, change_pct, thresholds)
                    churn_msg['period'] = '7d'
                    churn_msg['recent_avg'] = round(recent_7d, 2)
                    churn_msg['previous_avg'] = round(previous_7d, 2)
                    results['churn_7d'].append(churn_msg)

                elif change_pct > thresholds['improvement_threshold']:
                    improvement_msg = generate_improvement_message(stage, change_pct, thresholds)
                    improvement_msg['period'] = '7d'
                    improvement_msg['recent_avg'] = round(recent_7d, 2)
                    improvement_msg['previous_avg'] = round(previous_7d, 2)
                    results['improvement_7d'].append(improvement_msg)

        # 기존 30일 비교 (churn_30d, improvement_30d용 - 전체 기간용)
        if filter_days == 0 and data_len >= 60:
            recent_30d = daily_funnel_pivot[stage].tail(30).mean()
            previous_30d = daily_funnel_pivot[stage].iloc[-60:-30].mean()

            if previous_30d > 0:
                change_pct = ((recent_30d - previous_30d) / previous_30d) * 100

                if change_pct < thresholds['churn_alert_threshold']:
                    churn_msg = generate_churn_message(stage, change_pct, thresholds)
                    churn_msg['period'] = '30d'
                    churn_msg['recent_avg'] = round(recent_30d, 2)
                    churn_msg['previous_avg'] = round(previous_30d, 2)
                    results['churn_30d'].append(churn_msg)

                elif change_pct > thresholds['improvement_threshold']:
                    improvement_msg = generate_improvement_message(stage, change_pct, thresholds)
                    improvement_msg['period'] = '30d'
                    improvement_msg['recent_avg'] = round(recent_30d, 2)
                    improvement_msg['previous_avg'] = round(previous_30d, 2)
                    results['improvement_30d'].append(improvement_msg)

    results['status'] = 'success'
    return results


# ============================================================================
# 5. 메인 실행 함수 (Main Executor)
# ============================================================================

def generate_funnel_insights(category='default', ga4_file=None):
    """퍼널 인사이트 생성 메인 함수"""

    print("🚀 퍼널 분석을 시작합니다...")
    print(f"   카테고리: {category}")

    # 임계값 로드
    thresholds = get_thresholds(category)
    print(f"   임계값 프리셋: {category}")

    # 출력 디렉토리 생성
    FUNNEL_DIR.mkdir(parents=True, exist_ok=True)

    # 데이터 로드
    if ga4_file is None:
        ga4_file = GA4_DIR / 'GA4_data.csv'

    if not os.path.exists(ga4_file):
        print(f"❌ {INSUFFICIENT_DATA_MESSAGES['no_file']}")
        print(f"   경로: {ga4_file}")

        # 빈 인사이트 저장
        empty_insights = {
            'status': 'no_data',
            'message': INSUFFICIENT_DATA_MESSAGES['no_file'],
            'generated_at': datetime.now().isoformat()
        }
        with open(FUNNEL_DIR / 'insights.json', 'w', encoding='utf-8') as f:
            json.dump(empty_insights, f, ensure_ascii=False, indent=2)
        return empty_insights

    print(f"   데이터 파일: {ga4_file}")

    df = pd.read_csv(ga4_file, encoding='utf-8-sig')
    df['Day'] = pd.to_datetime(df['Day'])
    if 'week' in df.columns:
        df['week'] = pd.to_datetime(df['week'])

    # ========================================
    # 날짜 필터링 적용 (--days 파라미터)
    # ========================================
    filter_days = args.days
    original_count = len(df)
    original_start = df['Day'].min()
    original_end = df['Day'].max()

    if filter_days > 0:
        print(f"\n⏰ 최근 {filter_days}일 데이터로 필터링 적용 중...")
        df = filter_by_days(df, filter_days, 'Day')
        print(f"   - 전체 데이터: {original_count:,}행 → {len(df):,}행")
        if len(df) > 0:
            print(f"   - 필터링 기간: {df['Day'].min().strftime('%Y-%m-%d')} ~ {df['Day'].max().strftime('%Y-%m-%d')}")
    else:
        print("\n📊 전체 기간 데이터 사용")

    # 데이터 충분성 체크
    data_issues = check_data_sufficiency(df, thresholds)
    if any(issue['type'] in ['empty_data', 'no_conversion'] for issue in data_issues):
        print(f"⚠️ {data_issues[0]['message']}")

    # ========================================
    # CSV 파일 생성
    # ========================================
    print("\n📊 CSV 파일 생성 중...")

    # 1. 일별 퍼널
    daily_funnel = df.groupby(['Day', 'funnel']).agg({
        'Total users': 'sum',
        'New users': 'sum',
        'Event count': 'sum',
        'Event value': 'sum',
        'Sessions': 'sum'
    }).reset_index()

    daily_funnel_pivot = daily_funnel.pivot_table(
        index='Day', columns='funnel', values='Total users',
        aggfunc='sum', fill_value=0
    ).reset_index()

    existing_cols = [col for col in FUNNEL_ORDER if col in daily_funnel_pivot.columns]
    daily_funnel_pivot = daily_funnel_pivot[['Day'] + existing_cols]

    if '유입' in daily_funnel_pivot.columns and '구매완료' in daily_funnel_pivot.columns:
        daily_funnel_pivot['CVR'] = (daily_funnel_pivot['구매완료'] / daily_funnel_pivot['유입'] * 100).fillna(0)

    daily_funnel_pivot.to_csv(FUNNEL_DIR / 'daily_funnel.csv', index=False, encoding='utf-8-sig')
    print(f"   ✓ 일별 퍼널: {len(daily_funnel_pivot)} rows")

    # 1-2. 채널별 일별 퍼널 (channel_daily_funnel.csv)
    channel_daily_funnel = df.groupby(['channel', 'Day', 'funnel']).agg({
        'Total users': 'sum',
        'Event value': 'sum'
    }).reset_index()

    channel_daily_pivot = channel_daily_funnel.pivot_table(
        index=['channel', 'Day'], columns='funnel', values='Total users',
        aggfunc='sum', fill_value=0
    ).reset_index()

    existing_cols_cd = [col for col in FUNNEL_ORDER if col in channel_daily_pivot.columns]
    channel_daily_pivot = channel_daily_pivot[['channel', 'Day'] + existing_cols_cd]

    if '유입' in channel_daily_pivot.columns and '구매완료' in channel_daily_pivot.columns:
        channel_daily_pivot['CVR'] = (channel_daily_pivot['구매완료'] / channel_daily_pivot['유입'] * 100).fillna(0)

    channel_daily_pivot.to_csv(FUNNEL_DIR / 'channel_daily_funnel.csv', index=False, encoding='utf-8-sig')
    print(f"   ✓ 채널별 일별 퍼널: {len(channel_daily_pivot)} rows")

    # 2. 주별 퍼널
    if 'week' in df.columns:
        weekly_funnel = df.groupby(['week', 'funnel']).agg({
            'Total users': 'sum', 'New users': 'sum',
            'Event count': 'sum', 'Event value': 'sum'
        }).reset_index()

        weekly_funnel_pivot = weekly_funnel.pivot_table(
            index='week', columns='funnel', values='Total users',
            aggfunc='sum', fill_value=0
        ).reset_index()

        existing_cols_weekly = [col for col in FUNNEL_ORDER if col in weekly_funnel_pivot.columns]
        weekly_funnel_pivot = weekly_funnel_pivot[['week'] + existing_cols_weekly]

        if '유입' in weekly_funnel_pivot.columns and '구매완료' in weekly_funnel_pivot.columns:
            weekly_funnel_pivot['CVR'] = (weekly_funnel_pivot['구매완료'] / weekly_funnel_pivot['유입'] * 100).fillna(0)

        weekly_funnel_pivot.to_csv(FUNNEL_DIR / 'weekly_funnel.csv', index=False, encoding='utf-8-sig')
        print(f"   ✓ 주별 퍼널: {len(weekly_funnel_pivot)} rows")

    # 3. 채널별 퍼널
    channel_funnel = df.groupby(['channel', 'funnel']).agg({
        'Total users': 'sum', 'Event value': 'sum'
    }).reset_index()

    channel_funnel_pivot = channel_funnel.pivot_table(
        index='channel', columns='funnel', values='Total users',
        aggfunc='sum', fill_value=0
    ).reset_index()

    channel_revenue = df[df['funnel'] == '구매완료'].groupby('channel')['Event value'].sum().reset_index()
    channel_revenue.columns = ['channel', 'Revenue']

    channel_funnel_pivot = channel_funnel_pivot.merge(channel_revenue, on='channel', how='left')
    channel_funnel_pivot['Revenue'] = channel_funnel_pivot['Revenue'].fillna(0)

    if '유입' in channel_funnel_pivot.columns and '구매완료' in channel_funnel_pivot.columns:
        channel_funnel_pivot['CVR'] = (channel_funnel_pivot['구매완료'] / channel_funnel_pivot['유입'] * 100).fillna(0)

    channel_funnel_pivot.to_csv(FUNNEL_DIR / 'channel_funnel.csv', index=False, encoding='utf-8-sig')
    print(f"   ✓ 채널별 퍼널: {len(channel_funnel_pivot)} rows")

    # 4. 캠페인별 퍼널
    campaign_funnel = df.groupby(['Session campaign', 'funnel']).agg({
        'Total users': 'sum', 'Event value': 'sum'
    }).reset_index()

    top_campaigns = df[df['funnel'] == '유입'].groupby('Session campaign')['Total users'].sum().nlargest(20).index
    campaign_funnel_top = campaign_funnel[campaign_funnel['Session campaign'].isin(top_campaigns)]

    campaign_funnel_pivot = campaign_funnel_top.pivot_table(
        index='Session campaign', columns='funnel', values='Total users',
        aggfunc='sum', fill_value=0
    ).reset_index()

    campaign_revenue = df[df['funnel'] == '구매완료'].groupby('Session campaign')['Event value'].sum().reset_index()
    campaign_revenue.columns = ['Session campaign', 'Revenue']

    campaign_funnel_pivot = campaign_funnel_pivot.merge(campaign_revenue, on='Session campaign', how='left')
    campaign_funnel_pivot['Revenue'] = campaign_funnel_pivot['Revenue'].fillna(0)

    if '유입' in campaign_funnel_pivot.columns and '구매완료' in campaign_funnel_pivot.columns:
        campaign_funnel_pivot['CVR'] = (campaign_funnel_pivot['구매완료'] / campaign_funnel_pivot['유입'] * 100).fillna(0)

    campaign_funnel_pivot.to_csv(FUNNEL_DIR / 'campaign_funnel.csv', index=False, encoding='utf-8-sig')
    print(f"   ✓ 캠페인별 퍼널: {len(campaign_funnel_pivot)} rows")

    # 5. 신규 vs 재방문
    new_vs_returning = df.groupby(['Day', 'funnel']).agg({
        'Total users': 'sum', 'New users': 'sum'
    }).reset_index()

    new_vs_returning['Returning users'] = new_vs_returning['Total users'] - new_vs_returning['New users']
    new_vs_returning['New user %'] = (new_vs_returning['New users'] / new_vs_returning['Total users'] * 100).fillna(0)

    new_vs_returning.to_csv(FUNNEL_DIR / 'new_vs_returning.csv', index=False, encoding='utf-8-sig')
    print(f"   ✓ 신규/재방문: {len(new_vs_returning)} rows")

    # ========================================
    # 인사이트 생성
    # ========================================
    print("\n🔍 인사이트 분석 중...")

    # 기본 요약
    total_acquisition = int(df[df['funnel'] == '유입']['Total users'].sum())
    total_activation = int(df[df['funnel'] == '활동']['Total users'].sum())
    total_consideration = int(df[df['funnel'] == '관심']['Total users'].sum())
    total_conversion = int(df[df['funnel'] == '결제진행']['Total users'].sum())
    total_purchase = int(df[df['funnel'] == '구매완료']['Total users'].sum())
    total_revenue = float(df[df['funnel'] == '구매완료']['Event value'].sum())
    overall_cvr = safe_division(total_purchase, total_acquisition)

    start_date = df['Day'].min().strftime('%Y-%m-%d')
    end_date = df['Day'].max().strftime('%Y-%m-%d')

    # 성과 메시지 결정
    if overall_cvr > 3.0:
        status_message = generate_friendly_message('performance_good', cvr=f"{overall_cvr:.1f}")
    elif overall_cvr < 1.0:
        status_message = generate_friendly_message('performance_warning')
    else:
        status_message = generate_friendly_message('performance_stable')

    # 상위 채널/캠페인
    top_channels = []
    channel_summary = df[df['funnel'] == '구매완료'].groupby('channel').agg({
        'Total users': 'sum', 'Event value': 'sum'
    }).reset_index().nlargest(5, 'Event value')

    for _, row in channel_summary.iterrows():
        top_channels.append({
            'name': row['channel'],
            'purchases': int(row['Total users']),
            'revenue': float(row['Event value']),
            'revenue_formatted': format_korean_currency(row['Event value'])
        })

    top_campaigns_list = []
    campaign_summary = df[df['funnel'] == '구매완료'].groupby('Session campaign').agg({
        'Total users': 'sum', 'Event value': 'sum'
    }).reset_index().nlargest(5, 'Event value')

    for _, row in campaign_summary.iterrows():
        top_campaigns_list.append({
            'name': row['Session campaign'],
            'purchases': int(row['Total users']),
            'revenue': float(row['Event value']),
            'revenue_formatted': format_korean_currency(row['Event value'])
        })

    # 각 분석 모듈 실행
    print("   - BCG Matrix 분석...")
    bcg_analysis = analyze_bcg_matrix(channel_funnel_pivot, thresholds)

    print("   - 상황 인식형 알림 생성...")
    contextual_alerts = analyze_contextual_alerts(df, channel_funnel_pivot, thresholds)

    print("   - A/B 테스트 & 매출 임팩트...")
    ab_results, revenue_insights = analyze_ab_with_revenue_impact(channel_funnel_pivot, thresholds)

    print("   - K-Means 클러스터링...")
    kmeans_result = analyze_kmeans_clustering(channel_funnel_pivot, thresholds)

    print("   - 이탈/개선 예측...")
    churn_analysis = analyze_churn_and_improvement(daily_funnel_pivot, thresholds, filter_days)

    print("   - 마이크로 세그먼트 분석 (Upgrade Guide)...")
    micro_alerts, channel_metrics_enhanced, dynamic_thresholds = generate_micro_segment_alerts(
        channel_funnel_pivot, df, thresholds
    )

    # 기본 퍼널 경고 (원본 유지)
    basic_alerts = []
    funnel_totals = df.groupby('funnel')['Total users'].sum()

    if '유입' in funnel_totals.index and '활동' in funnel_totals.index:
        activation_rate = funnel_totals['활동'] / funnel_totals['유입'] * 100
        if activation_rate < thresholds['activation_rate_warning']:
            basic_alerts.append({
                'type': 'low_activation',
                'message': f"유입→활동 전환율이 {activation_rate:.1f}%로 낮습니다. 랜딩페이지 최적화가 필요합니다.",
                'message_friendly': f"😅 방문자의 {100-activation_rate:.0f}%가 구경도 안 하고 나가요!",
                'severity': 'high'
            })

    if '관심' in funnel_totals.index and '구매완료' in funnel_totals.index:
        cart_rate = funnel_totals['구매완료'] / funnel_totals['관심'] * 100
        if cart_rate < thresholds['cart_conversion_warning']:
            basic_alerts.append({
                'type': 'low_consideration_conversion',
                'message': f"장바구니→구매 전환율이 {cart_rate:.1f}%로 낮습니다. 결제 프로세스 개선이 필요합니다.",
                'message_friendly': f"🛒 장바구니에 담은 고객의 {100-cart_rate:.0f}%가 구매를 포기했어요!",
                'severity': 'medium'
            })

    # ========================================
    # 최종 JSON 구조 조립
    # ========================================
    insights = {
        'generated_at': datetime.now().isoformat(),
        'category': category,
        'thresholds_used': thresholds,

        # 기간 필터 정보
        'filter_info': {
            'days': filter_days,
            'label': '전체 기간' if filter_days == 0 else f'최근 {filter_days}일',
            'is_filtered': filter_days > 0
        },

        # 메타 정보 (친절한 버전)
        'meta': {
            'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M'),
            'analysis_period': f"{start_date} ~ {end_date}",
            'category': category
        },

        # 요약 카드 (친절한 버전)
        'summary_card': {
            'title': '이번 달 성과 요약',
            'revenue_text': format_korean_currency(total_revenue),
            'cvr_text': f"{overall_cvr:.1f}%",
            'visitors_text': format_number(total_acquisition),
            'purchasers_text': format_number(total_purchase),
            'status_message': status_message
        },

        # 요약 (원본 호환)
        'summary': {
            'total_acquisition': total_acquisition,
            'total_activation': total_activation,
            'total_consideration': total_consideration,
            'total_conversion': total_conversion,
            'total_purchase': total_purchase,
            'total_revenue': total_revenue,
            'total_revenue_formatted': format_korean_currency(total_revenue),
            'overall_cvr': round(overall_cvr, 2)
        },

        # 전체 기간 (원본 호환)
        'overall': {
            'current_period': {
                'start_date': start_date,
                'end_date': end_date,
                'total_acquisition': total_acquisition,
                'total_activation': total_activation,
                'total_consideration': total_consideration,
                'total_conversion': total_conversion,
                'total_purchase': total_purchase,
                'total_revenue': total_revenue,
                'total_revenue_formatted': format_korean_currency(total_revenue),
                'overall_cvr': round(overall_cvr, 2)
            },
            'trend': {
                'direction': 'improving' if len(churn_analysis.get('improvement_7d', [])) > len(churn_analysis.get('churn_7d', [])) else
                             'declining' if len(churn_analysis.get('churn_7d', [])) > 0 else 'stable'
            }
        },

        # 상위 채널/캠페인
        'top_channels': top_channels,
        'top_campaigns': top_campaigns_list,

        # 알림 (통합)
        'alerts': basic_alerts,
        'urgent_alerts': contextual_alerts,

        # BCG Matrix 분석 (새로운 기능)
        'channel_strategy': bcg_analysis,

        # A/B 테스트 (원본 + 매출 임팩트)
        'ab_test_results': ab_results,
        'opportunity_spotlight': revenue_insights,

        # K-Means 클러스터링 (원본 호환 + 개선)
        'channel_clusters': kmeans_result,

        # 이탈/개선 예측 (원본 호환)
        'churn_predictions_7d': churn_analysis.get('churn_7d', []),
        'churn_predictions_30d': churn_analysis.get('churn_30d', []),
        'improvement_predictions_7d': churn_analysis.get('improvement_7d', []),
        'improvement_predictions_30d': churn_analysis.get('improvement_30d', []),
        'churn_predictions': churn_analysis.get('churn_7d', []),  # 하위 호환

        # CRM 액션 (새로운 기능)
        'crm_actions': churn_analysis.get('crm_actions', []),

        # CRM 액션 추이 분석 (시점 간 비교: d_day vs d_day-N)
        'crm_actions_by_trend': churn_analysis.get('crm_actions_by_trend', {}),

        # ========== 신규 추가 (Upgrade Guide 반영) ==========
        # 마이크로 세그먼트 알림 (Hidden VIP, Traffic Waste, Checkout Friction, Rising Star)
        'micro_segment_alerts': micro_alerts,

        # 채널별 확장 메트릭스 (RPV, Log RPV, Traffic Rank, Segment Type)
        'channel_metrics_enhanced': channel_metrics_enhanced,

        # 동적 임계값 (현재 데이터 기준 Quantile)
        'dynamic_thresholds': dynamic_thresholds,

        # 카테고리별 처방 가이드 (참조용)
        'category_advice_guide': CATEGORY_ADVICE_MAP,

        # 마이크로 세그먼트 정의 (참조용)
        'micro_segment_definitions': MICRO_SEGMENT_DEFINITIONS,

        # 데이터 이슈
        'data_issues': data_issues,

        # 상세 통계
        'details': {
            'total_channels': len(channel_funnel_pivot),
            'total_campaigns': len(campaign_funnel_pivot),
            'analysis_period_days': len(daily_funnel_pivot),
            'ab_tests_conducted': len(ab_results),
            'significant_ab_tests': len([t for t in ab_results if t.get('significant', False)]),
            'churn_risk_stages_7d': len(churn_analysis.get('churn_7d', [])),
            'churn_risk_stages_30d': len(churn_analysis.get('churn_30d', [])),
            'improvement_stages_7d': len(churn_analysis.get('improvement_7d', [])),
            'improvement_stages_30d': len(churn_analysis.get('improvement_30d', [])),
            # 신규 통계
            'micro_segment_alerts_count': len(micro_alerts),
            'micro_segment_opportunities': len([a for a in micro_alerts if a.get('type') == 'opportunity']),
            'micro_segment_problems': len([a for a in micro_alerts if a.get('type') == 'problem'])
        }
    }

    # JSON 저장 (numpy 타입 변환 적용)
    serializable_insights = convert_to_serializable(insights)
    with open(FUNNEL_DIR / 'insights.json', 'w', encoding='utf-8') as f:
        json.dump(serializable_insights, f, ensure_ascii=False, indent=2)

    # 결과 출력
    print("\n" + "="*60)
    print("✅ 퍼널 분석 완료!")
    print("="*60)
    print(f"\n📊 성과 요약:")
    print(f"   - 총 방문자: {format_number(total_acquisition)}명")
    print(f"   - 총 구매자: {format_number(total_purchase)}명")
    print(f"   - 총 매출: {format_korean_currency(total_revenue)}")
    print(f"   - 전환율: {overall_cvr:.2f}%")
    print(f"\n📈 고급 분석:")
    print(f"   - A/B 테스트: {len(ab_results)}개 (유의미: {len([t for t in ab_results if t.get('significant', False)])}개)")
    print(f"   - 채널 클러스터: {kmeans_result.get('n_clusters', 0)}개 그룹")
    print(f"   - 이탈 위험 (7일): {len(churn_analysis.get('churn_7d', []))}개")
    print(f"   - 성과 개선 (7일): {len(churn_analysis.get('improvement_7d', []))}개")
    print(f"   - 긴급 알림: {len(contextual_alerts)}개")
    print(f"\n🎯 마이크로 세그먼트 (Upgrade Guide):")
    print(f"   - 마이크로 알림: {len(micro_alerts)}개")
    print(f"   - 기회 발견: {len([a for a in micro_alerts if a.get('type') == 'opportunity'])}개")
    print(f"   - 문제 감지: {len([a for a in micro_alerts if a.get('type') == 'problem'])}개")
    print(f"   - 동적 임계값: 트래픽 상위 {dynamic_thresholds.get('traffic_high', 0):.0f}명 / RPV 상위 {dynamic_thresholds.get('rpv_high', 0):,.0f}원")
    print(f"\n📁 생성된 파일:")
    print(f"   - {FUNNEL_DIR / 'insights.json'}")
    print(f"   - {FUNNEL_DIR / 'daily_funnel.csv'}")
    print(f"   - {FUNNEL_DIR / 'weekly_funnel.csv'}")
    print(f"   - {FUNNEL_DIR / 'channel_funnel.csv'}")
    print(f"   - {FUNNEL_DIR / 'campaign_funnel.csv'}")
    print(f"   - {FUNNEL_DIR / 'new_vs_returning.csv'}")

    return insights


# ============================================================================
# 6. 스크립트 실행
# ============================================================================

if __name__ == '__main__':
    import sys

    # 카테고리 인자 처리 (기본값: default)
    category = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('BUSINESS_CATEGORY', 'default')

    # 사용 가능한 카테고리 출력
    if category == '--help' or category == '-h':
        print("사용법: python generate_funnel_data.py [category]")
        print("\n사용 가능한 카테고리:")
        for cat in CATEGORY_THRESHOLDS.keys():
            print(f"  - {cat}")
        print("\n예시:")
        print("  python generate_funnel_data.py fashion")
        print("  python generate_funnel_data.py food")
        print("  python generate_funnel_data.py electronics")
        sys.exit(0)

    # 인사이트 생성
    generate_funnel_insights(category=category)
