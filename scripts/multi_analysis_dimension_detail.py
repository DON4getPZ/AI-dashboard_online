"""
마케팅 데이터 차원별 상세 분석 V3

각 타입 내에서 세부 차원별 성과 분석:
- Type1: 캠페인별 → 광고세트 성과
- Type2: 광고세트별 → 연령x성별 pivot 성과
- Type3: 광고세트별 → 연령 성과
- Type4: 광고세트별 → 성별 성과
- Type5: 광고세트별 → 기기유형 성과
- Type6: 광고세트별 → 플랫폼 성과
- Type7: 광고세트별 → 기기플랫폼 성과
"""

import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# 경로 설정 (동적 경로)
BASE_DIR = Path(__file__).parent.parent
DATA_TYPE_DIR = BASE_DIR / 'data' / 'type'

# ============================================================================
# 성별/연령 통합 매핑 (data_mapping_guide.md 기준)
# ============================================================================
GENDER_MAP = {
    # 남성 통합
    'MALE': '남성',
    'male': '남성',
    'Male': '남성',
    '남자': '남성',
    # 여성 통합
    'FEMALE': '여성',
    'female': '여성',
    'Female': '여성',
    '여자': '여성',
    # 알 수 없음 통합
    'UNDETERMINED': '알 수 없음',
    'Unknown': '알 수 없음'
}

AGE_MAP = {
    # 영문 → 한글 변환
    'AGE_RANGE_18_24': '19세 ~ 24세',
    '18-24': '19세 ~ 24세',
    'AGE_RANGE_25_34': '25세 ~ 34세',
    '25-34': '25세 ~ 34세',
    'AGE_RANGE_35_44': '35세 ~ 44세',
    '35-44': '35세 ~ 44세',
    'AGE_RANGE_45_54': '45세 ~ 54세',
    '45-54': '45세 ~ 54세',
    'AGE_RANGE_55_64': '55세 ~ 64세',
    '55-64': '55세 ~ 64세',
    'AGE_RANGE_65_UP': '65세 이상',
    '65+': '65세 이상',
    'AGE_RANGE_UNDETERMINED': '알 수 없음',
    'Unknown': '알 수 없음',
    # 한글 세부 연령대 → 10세 단위 통합
    '25세 ~ 29세': '25세 ~ 34세',
    '30세 ~ 34세': '25세 ~ 34세',
    '35세 ~ 39세': '35세 ~ 44세',
    '40세 ~ 44세': '35세 ~ 44세',
    '45세 ~ 49세': '45세 ~ 54세',
    '50세 ~ 54세': '45세 ~ 54세',
    '55세 ~ 59세': '55세 ~ 64세',
    '60세 ~ 99세': '65세 이상'
}

# 기기유형 통합 매핑 (data_mapping_guide.md 기준)
DEVICE_MAP = {
    # 안드로이드 (Meta)
    'Android Smartphone': '안드로이드',
    'Android Tablet': '안드로이드',
    # 애플 (Meta)
    'iPhone': '애플',
    'iPad': '애플',
    # 모바일 (Google Ads - OS 구분 불가)
    'Mobile phones': '모바일',
    'Tablets': '모바일',
    # 웹/데스크톱
    'Computers': '웹',
    'Desktop': '웹',
    # TV
    'TV screens': 'TV'
}

# 기기플랫폼 통합 매핑 (data_mapping_guide.md 기준)
PLATFORM_MAP = {
    'Mobile app': '앱',
    'Mobile web': '모바일',
    'Desktop': '웹',
    'PC': '웹',
    'pc': '웹'
}

def apply_gender_mapping(df):
    """성별 통합 컬럼 추가"""
    if '성별' in df.columns:
        df['성별_통합'] = df['성별'].replace(GENDER_MAP)
        # 매핑되지 않은 값은 원본 유지
        df['성별_통합'] = df.apply(
            lambda row: row['성별_통합'] if row['성별_통합'] != row['성별'] or row['성별'] in ['남성', '여성', '알 수 없음', '-'] else row['성별'],
            axis=1
        )
    return df

def apply_age_mapping(df):
    """연령 통합 컬럼 추가"""
    if '연령' in df.columns:
        df['연령_통합'] = df['연령'].replace(AGE_MAP)
        # 매핑되지 않은 값은 원본 유지 (이미 통합 형식인 경우)
    return df

def apply_device_mapping(df):
    """기기유형 통합 컬럼 추가"""
    if '기기유형' in df.columns:
        df['기기유형_통합'] = df['기기유형'].replace(DEVICE_MAP)
        # 매핑되지 않은 값은 원본 유지
    return df

def apply_platform_mapping(df):
    """기기플랫폼 통합 컬럼 추가"""
    if '기기플랫폼' in df.columns:
        df['기기플랫폼_통합'] = df['기기플랫폼'].replace(PLATFORM_MAP)
        # 매핑되지 않은 값은 원본 유지
    return df

# CSV 파일 읽기
file_path = DATA_TYPE_DIR / 'merged_data.csv'
output_dir = DATA_TYPE_DIR

df = pd.read_csv(file_path, thousands=',', low_memory=False)
df['일'] = pd.to_datetime(df['일'])

# 수치형 컬럼 변환
numeric_cols = ['비용', '노출', '클릭', '전환수', '전환값']
for col in numeric_cols:
    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

# 월, 주 컬럼 추가
df['월'] = df['일'].dt.to_period('M').astype(str)
df['주'] = df['일'].dt.to_period('W').astype(str)

print("=" * 100)
print("마케팅 데이터 차원별 상세 분석 V3")
print("=" * 100)
print(f"분석일: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"데이터 기간: {df['일'].min().date()} ~ {df['일'].max().date()}")
print(f"총 데이터: {len(df):,}행")

# 데이터 타입 분류
def classify_data_type_v2(row):
    has_campaign = row['캠페인이름'] != '-'
    has_adset = row['광고세트'] != '-'
    has_age = row['연령'] != '-'
    has_gender = row['성별'] != '-'
    has_device_type = row['기기유형'] != '-'
    has_platform = row['플랫폼'] != '-'
    has_device_platform = row['기기플랫폼'] != '-'

    if has_campaign and has_adset and not has_age and not has_gender and not has_device_type and not has_platform and not has_device_platform:
        return 'Type1_캠페인+광고세트'
    if not has_campaign and has_adset and has_age and has_gender and not has_device_type and not has_platform and not has_device_platform:
        return 'Type2_광고세트+연령+성별'
    if not has_campaign and has_adset and has_age and not has_gender and not has_device_type and not has_platform and not has_device_platform:
        return 'Type3_광고세트+연령'
    if not has_campaign and has_adset and not has_age and has_gender and not has_device_type and not has_platform and not has_device_platform:
        return 'Type4_광고세트+성별'
    if not has_campaign and has_adset and not has_age and not has_gender and has_device_type and not has_platform and not has_device_platform:
        return 'Type5_광고세트+기기유형'
    if not has_campaign and has_adset and not has_age and not has_gender and not has_device_type and has_platform and not has_device_platform:
        return 'Type6_광고세트+플랫폼'
    if not has_campaign and has_adset and not has_age and not has_gender and not has_device_type and not has_platform and has_device_platform:
        return 'Type7_광고세트+기기플랫폼'
    return 'Other_미분류'

df['data_type'] = df.apply(classify_data_type_v2, axis=1)

# ============================================================================
# Type1: 캠페인별 광고세트 성과 분석
# ============================================================================
print("\n" + "=" * 100)
print("Type1: 캠페인별 → 광고세트 상세 성과")
print("=" * 100)

type1_data = df[df['data_type'] == 'Type1_캠페인+광고세트']
if len(type1_data) > 0:
    type1_analysis = type1_data.groupby(['월', '주', '일', '캠페인이름', '광고세트', '유형구분', '타겟팅', '브랜드명', '상품명', '프로모션']).agg({
        '비용': 'sum',
        '노출': 'sum',
        '클릭': 'sum',
        '전환수': 'sum',
        '전환값': 'sum'
    }).reset_index()

    type1_analysis['ROAS'] = (type1_analysis['전환값'] / type1_analysis['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
    type1_analysis['CPA'] = (type1_analysis['비용'] / type1_analysis['전환수']).replace([np.inf, -np.inf], 0).fillna(0)

    output_file = f"{output_dir}/dimension_type1_campaign_adset.csv"
    type1_analysis.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"✓ 저장: {output_file}")
    print(f"  - 캠페인 수: {type1_analysis['캠페인이름'].nunique()}개")
    print(f"  - 광고세트 수: {type1_analysis['광고세트'].nunique()}개")
    print(f"  - 총 조합: {len(type1_analysis)}개")

# ============================================================================
# Type2: 광고세트별 연령x성별 pivot 성과
# ============================================================================
print("\n" + "=" * 100)
print("Type2: 광고세트별 → 연령x성별 PIVOT 성과")
print("=" * 100)

type2_data = df[df['data_type'] == 'Type2_광고세트+연령+성별']
if len(type2_data) > 0:
    type2_analysis = type2_data.groupby(['월', '주', '일', '광고세트', '연령', '성별', '유형구분', '타겟팅', '브랜드명', '상품명', '프로모션']).agg({
        '비용': 'sum',
        '노출': 'sum',
        '클릭': 'sum',
        '전환수': 'sum',
        '전환값': 'sum'
    }).reset_index()

    type2_analysis['ROAS'] = (type2_analysis['전환값'] / type2_analysis['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
    type2_analysis['CPA'] = (type2_analysis['비용'] / type2_analysis['전환수']).replace([np.inf, -np.inf], 0).fillna(0)

    # 성별_통합, 연령_통합 컬럼 추가
    type2_analysis = apply_gender_mapping(type2_analysis)
    type2_analysis = apply_age_mapping(type2_analysis)

    output_file = f"{output_dir}/dimension_type2_adset_age_gender.csv"
    type2_analysis.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"✓ 저장: {output_file}")
    print(f"  - 광고세트 수: {type2_analysis['광고세트'].nunique()}개")
    print(f"  - 연령대 수: {type2_analysis['연령'].nunique()}개")
    print(f"  - 성별 수: {type2_analysis['성별'].nunique()}개")
    print(f"  - 총 조합: {len(type2_analysis)}개")

    # Pivot 테이블 생성 (광고세트별로)
    for adset in type2_analysis['광고세트'].unique()[:5]:  # 상위 5개만 출력
        adset_data = type2_analysis[type2_analysis['광고세트'] == adset]
        pivot = adset_data.pivot_table(
            values='ROAS',
            index='연령',
            columns='성별',
            aggfunc='mean',
            fill_value=0
        )
        print(f"\n[{adset}] 연령x성별 ROAS:")
        print(pivot.to_string())

# ============================================================================
# Type3: 광고세트별 연령 성과 (Type2 데이터 포함 - 메타_* 유형구분 누락 방지)
# ============================================================================
print("\n" + "=" * 100)
print("Type3: 광고세트별 → 연령 성과 (Type2 데이터 포함)")
print("=" * 100)

# Type3 조건: 연령만 있는 데이터 + Type2 조건(연령+성별 둘 다 있는 데이터)
type3_data = df[(df['data_type'] == 'Type3_광고세트+연령') | (df['data_type'] == 'Type2_광고세트+연령+성별')]
if len(type3_data) > 0:
    type3_analysis = type3_data.groupby(['월', '주', '일', '광고세트', '연령', '유형구분', '타겟팅', '브랜드명', '상품명', '프로모션']).agg({
        '비용': 'sum',
        '노출': 'sum',
        '클릭': 'sum',
        '전환수': 'sum',
        '전환값': 'sum'
    }).reset_index()

    type3_analysis['ROAS'] = (type3_analysis['전환값'] / type3_analysis['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
    type3_analysis['CPA'] = (type3_analysis['비용'] / type3_analysis['전환수']).replace([np.inf, -np.inf], 0).fillna(0)

    # 연령_통합 컬럼 추가
    type3_analysis = apply_age_mapping(type3_analysis)

    output_file = f"{output_dir}/dimension_type3_adset_age.csv"
    type3_analysis.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"✓ 저장: {output_file}")
    print(f"  - 광고세트 수: {type3_analysis['광고세트'].nunique()}개")
    print(f"  - 연령대 수: {type3_analysis['연령'].nunique()}개")
    print(f"  - 총 조합: {len(type3_analysis)}개")

# ============================================================================
# Type4: 광고세트별 성별 성과 (Type2 데이터 포함 - 메타_* 유형구분 누락 방지)
# ============================================================================
print("\n" + "=" * 100)
print("Type4: 광고세트별 → 성별 성과 (Type2 데이터 포함)")
print("=" * 100)

# Type4 조건: 성별만 있는 데이터 + Type2 조건(연령+성별 둘 다 있는 데이터)
type4_data = df[(df['data_type'] == 'Type4_광고세트+성별') | (df['data_type'] == 'Type2_광고세트+연령+성별')]
if len(type4_data) > 0:
    type4_analysis = type4_data.groupby(['월', '주', '일', '광고세트', '성별', '유형구분', '타겟팅', '브랜드명', '상품명', '프로모션']).agg({
        '비용': 'sum',
        '노출': 'sum',
        '클릭': 'sum',
        '전환수': 'sum',
        '전환값': 'sum'
    }).reset_index()

    type4_analysis['ROAS'] = (type4_analysis['전환값'] / type4_analysis['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
    type4_analysis['CPA'] = (type4_analysis['비용'] / type4_analysis['전환수']).replace([np.inf, -np.inf], 0).fillna(0)

    # 성별_통합 컬럼 추가
    type4_analysis = apply_gender_mapping(type4_analysis)

    output_file = f"{output_dir}/dimension_type4_adset_gender.csv"
    type4_analysis.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"✓ 저장: {output_file}")
    print(f"  - 광고세트 수: {type4_analysis['광고세트'].nunique()}개")
    print(f"  - 성별 수: {type4_analysis['성별'].nunique()}개")
    print(f"  - 총 조합: {len(type4_analysis)}개")

    # 성별 성과 비교
    print("\n성별 성과 비교:")
    gender_summary = type4_analysis.groupby('성별').agg({
        '비용': 'sum',
        '전환수': 'sum',
        '전환값': 'sum'
    })
    gender_summary['ROAS'] = (gender_summary['전환값'] / gender_summary['비용'] * 100)
    print(gender_summary.to_string())

# ============================================================================
# Type5: 광고세트별 기기유형 성과
# ============================================================================
print("\n" + "=" * 100)
print("Type5: 광고세트별 → 기기유형 성과")
print("=" * 100)

type5_data = df[df['data_type'] == 'Type5_광고세트+기기유형']
if len(type5_data) > 0:
    type5_analysis = type5_data.groupby(['월', '주', '일', '광고세트', '기기유형', '유형구분', '타겟팅', '브랜드명', '상품명', '프로모션']).agg({
        '비용': 'sum',
        '노출': 'sum',
        '클릭': 'sum',
        '전환수': 'sum',
        '전환값': 'sum'
    }).reset_index()

    type5_analysis['ROAS'] = (type5_analysis['전환값'] / type5_analysis['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
    type5_analysis['CPA'] = (type5_analysis['비용'] / type5_analysis['전환수']).replace([np.inf, -np.inf], 0).fillna(0)

    # 기기유형_통합 컬럼 추가
    type5_analysis = apply_device_mapping(type5_analysis)

    output_file = f"{output_dir}/dimension_type5_adset_device.csv"
    type5_analysis.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"✓ 저장: {output_file}")
    print(f"  - 광고세트 수: {type5_analysis['광고세트'].nunique()}개")
    print(f"  - 기기유형 수: {type5_analysis['기기유형'].nunique()}개")
    print(f"  - 기기유형_통합 수: {type5_analysis['기기유형_통합'].nunique()}개")
    print(f"  - 총 조합: {len(type5_analysis)}개")

# ============================================================================
# Type6: 광고세트별 플랫폼 성과
# ============================================================================
print("\n" + "=" * 100)
print("Type6: 광고세트별 → 플랫폼 성과")
print("=" * 100)

type6_data = df[df['data_type'] == 'Type6_광고세트+플랫폼']
if len(type6_data) > 0:
    type6_analysis = type6_data.groupby(['월', '주', '일', '광고세트', '플랫폼', '유형구분', '타겟팅', '브랜드명', '상품명', '프로모션']).agg({
        '비용': 'sum',
        '노출': 'sum',
        '클릭': 'sum',
        '전환수': 'sum',
        '전환값': 'sum'
    }).reset_index()

    type6_analysis['ROAS'] = (type6_analysis['전환값'] / type6_analysis['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
    type6_analysis['CPA'] = (type6_analysis['비용'] / type6_analysis['전환수']).replace([np.inf, -np.inf], 0).fillna(0)

    output_file = f"{output_dir}/dimension_type6_adset_platform.csv"
    type6_analysis.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"✓ 저장: {output_file}")
    print(f"  - 광고세트 수: {type6_analysis['광고세트'].nunique()}개")
    print(f"  - 플랫폼 수: {type6_analysis['플랫폼'].nunique()}개")
    print(f"  - 총 조합: {len(type6_analysis)}개")

# ============================================================================
# Type7: 광고세트별 기기플랫폼 성과
# ============================================================================
print("\n" + "=" * 100)
print("Type7: 광고세트별 → 기기플랫폼 성과")
print("=" * 100)

type7_data = df[df['data_type'] == 'Type7_광고세트+기기플랫폼']
if len(type7_data) > 0:
    type7_analysis = type7_data.groupby(['월', '주', '일', '광고세트', '기기플랫폼', '유형구분', '타겟팅', '브랜드명', '상품명', '프로모션']).agg({
        '비용': 'sum',
        '노출': 'sum',
        '클릭': 'sum',
        '전환수': 'sum',
        '전환값': 'sum'
    }).reset_index()

    type7_analysis['ROAS'] = (type7_analysis['전환값'] / type7_analysis['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
    type7_analysis['CPA'] = (type7_analysis['비용'] / type7_analysis['전환수']).replace([np.inf, -np.inf], 0).fillna(0)

    # 기기플랫폼_통합 컬럼 추가
    type7_analysis = apply_platform_mapping(type7_analysis)

    output_file = f"{output_dir}/dimension_type7_adset_deviceplatform.csv"
    type7_analysis.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"✓ 저장: {output_file}")
    print(f"  - 광고세트 수: {type7_analysis['광고세트'].nunique()}개")
    print(f"  - 기기플랫폼 수: {type7_analysis['기기플랫폼'].nunique()}개")
    print(f"  - 기기플랫폼_통합 수: {type7_analysis['기기플랫폼_통합'].nunique()}개")
    print(f"  - 총 조합: {len(type7_analysis)}개")

    # 기기플랫폼_통합 기준 성과 비교
    print("\n기기플랫폼_통합 성과 비교:")
    platform_summary = type7_analysis.groupby('기기플랫폼_통합').agg({
        '비용': 'sum',
        '전환수': 'sum',
        '전환값': 'sum'
    })
    platform_summary['ROAS'] = (platform_summary['전환값'] / platform_summary['비용'] * 100)
    print(platform_summary.to_string())

print("\n" + "=" * 100)
print("차원별 상세 분석 완료!")
print("=" * 100)
print(f"\n생성된 파일 (data/type 디렉토리):")
print(f"  1. dimension_type1_campaign_adset.csv - 캠페인별 광고세트 성과")
print(f"  2. dimension_type2_adset_age_gender.csv - 광고세트별 연령x성별 성과")
print(f"  3. dimension_type3_adset_age.csv - 광고세트별 연령 성과")
print(f"  4. dimension_type4_adset_gender.csv - 광고세트별 성별 성과")
print(f"  5. dimension_type5_adset_device.csv - 광고세트별 기기유형 성과")
print(f"  6. dimension_type6_adset_platform.csv - 광고세트별 플랫폼 성과")
print(f"  7. dimension_type7_adset_deviceplatform.csv - 광고세트별 기기플랫폼 성과")
