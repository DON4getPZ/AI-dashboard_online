"""
통합 분석 실행 스크립트

유형구분별 성과 분석과 일별 집계를 생성합니다.
차원별 세부 분석은 multi_analysis_dimension_detail.py를 사용하세요.

결과는 data/type/ 디렉토리에 저장됩니다.
"""

import pandas as pd
import numpy as np
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# CSV 파일 경로
input_file = r'c:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\type\merged_data.csv'
output_dir = r'c:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\type'

print("=" * 100)
print("통합 마케팅 데이터 분석 시작")
print("=" * 100)
print(f"시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"입력 파일: {input_file}")
print(f"출력 디렉토리: {output_dir}")

# 데이터 로드
print("\n데이터 로딩 중...")
df = pd.read_csv(input_file, thousands=',', low_memory=False)
df['일'] = pd.to_datetime(df['일'])

# 수치형 컬럼 변환
numeric_cols = ['비용', '노출', '링크클릭', '전환수', '전환값']
for col in numeric_cols:
    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

print(f"총 데이터: {len(df):,}행, {len(df.columns)}개 컬럼")

# ============================================================================
# 1. 유형구분별 성과 분석
# ============================================================================
print("\n" + "=" * 100)
print("1단계: 유형구분별 성과 분석")
print("=" * 100)

category_summary = df.groupby('유형구분').agg({
    '비용': 'sum',
    '노출': 'sum',
    '링크클릭': 'sum',
    '전환수': 'sum',
    '전환값': 'sum'
}).reset_index()

category_summary['ROAS'] = (category_summary['전환값'] / category_summary['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
category_summary['CPA'] = (category_summary['비용'] / category_summary['전환수']).replace([np.inf, -np.inf], 0).fillna(0)
category_summary['CPC'] = (category_summary['비용'] / category_summary['링크클릭']).replace([np.inf, -np.inf], 0).fillna(0)
category_summary['CTR'] = (category_summary['링크클릭'] / category_summary['노출'] * 100).fillna(0)
category_summary['CVR'] = (category_summary['전환수'] / category_summary['링크클릭'] * 100).fillna(0)

print("\n유형구분별 성과:")
for _, row in category_summary.iterrows():
    print(f"  {row['유형구분']}: ROAS {row['ROAS']:.1f}%, CPA {row['CPA']:,.0f}원")

output_file_1 = f"{output_dir}/analysis_category_summary.csv"
category_summary.to_csv(output_file_1, index=False, encoding='utf-8-sig')
print(f"\n✓ 저장 완료: {output_file_1}")

# ============================================================================
# 2. 일별 집계 데이터
# ============================================================================
print("\n" + "=" * 100)
print("2단계: 일별 집계 데이터 생성")
print("=" * 100)

daily_data = df.groupby('일').agg({
    '비용': 'sum',
    '노출': 'sum',
    '링크클릭': 'sum',
    '전환수': 'sum',
    '전환값': 'sum'
}).reset_index()

daily_data['ROAS'] = (daily_data['전환값'] / daily_data['비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
daily_data['CPA'] = (daily_data['비용'] / daily_data['전환수']).replace([np.inf, -np.inf], 0).fillna(0)
daily_data['CTR'] = (daily_data['링크클릭'] / daily_data['노출'] * 100).fillna(0)
daily_data['CVR'] = (daily_data['전환수'] / daily_data['링크클릭'] * 100).fillna(0)

print(f"일별 데이터: {len(daily_data)}일")
print(f"기간: {daily_data['일'].min().date()} ~ {daily_data['일'].max().date()}")

output_file_2 = f"{output_dir}/analysis_daily_summary.csv"
daily_data.to_csv(output_file_2, index=False, encoding='utf-8-sig')
print(f"✓ 저장 완료: {output_file_2}")

# ============================================================================
# 최종 요약
# ============================================================================
print("\n" + "=" * 100)
print("분석 완료!")
print("=" * 100)

print(f"\n종료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("\n생성된 파일:")
print(f"  1. {output_file_1} - 유형구분별 성과")
print(f"  2. {output_file_2} - 일별 집계")

print("\n주요 인사이트:")
print(f"  - 총 {len(df):,}개 데이터 분석")
print(f"  - {len(category_summary)}개 유형구분 분석")
print(f"  - {len(daily_data)}일 시계열 데이터 생성")
print(f"\n💡 차원별 세부 분석은 multi_analysis_dimension_detail.py를 실행하세요")

print("\n" + "=" * 100)
