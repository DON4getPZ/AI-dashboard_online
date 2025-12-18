# 유형구분별 KPI 매핑 가이드

## 개요

마케팅 캠페인의 유형(트래픽/전환)에 따라 적합한 KPI를 다르게 적용하여 정확한 성과 분석을 제공합니다.

## 유형구분_통합 매핑 규칙 (v1.3 변경)

### 매핑 기준: 광고세트 컬럼

| 조건 | 유형구분_통합 | 설명 |
|------|---------------|------|
| 광고세트 LIKE '%트래픽%' | 트래픽 | 트래픽 목적 광고세트 |
| 그 외 | 전환 | 전환 목적 광고세트 |

**SQL 표현**:
```sql
CASE
  WHEN 광고세트 LIKE '%트래픽%' THEN '트래픽'
  ELSE '전환'
END AS 유형구분_통합
```

> **v1.3 변경사항**: 기존 '유형구분' 컬럼 기준에서 '광고세트' 컬럼 기준으로 변경

## KPI 적용 기준

### 트래픽 캠페인 (유형구분_통합 = '트래픽')

**메인 KPI**: CPC (Cost Per Click)

| 지표 | 설명 | 판단 기준 |
|------|------|----------|
| CPC | 클릭당 비용 | 낮을수록 우수 |
| CTR | 클릭률 | 높을수록 우수 |
| 클릭수 | 총 클릭 수 | 많을수록 우수 |

**성과 임계값**:
```python
TRAFFIC_THRESHOLDS = {
    'excellent_cpc': 200,    # CPC 매우 우수 (원)
    'good_cpc': 500,         # CPC 우수 (원)
    'warning_cpc': 1000,     # CPC 경고 (원)
    'high_ctr': 3.0,         # CTR 우수 (%)
    'low_ctr': 1.0,          # CTR 저조 (%)
}
```

### 전환 캠페인 (유형구분_통합 = '전환')

**메인 KPI**: ROAS, CPA

| 지표 | 설명 | 판단 기준 |
|------|------|----------|
| ROAS | 광고 수익률 | 높을수록 우수 |
| CPA | 전환당 비용 | 낮을수록 우수 |
| 전환수 | 총 전환 수 | 많을수록 우수 |

**성과 임계값**:
```python
CONVERSION_THRESHOLDS = {
    'excellent_roas': 1000.0,  # ROAS 매우 우수 (%)
    'high_roas': 500.0,        # ROAS 우수 (%)
    'low_roas': 100.0,         # ROAS 저조 (%)
    'high_cpa': 50000,         # CPA 경고 (원)
}
```

## 구현 영향 분석

### 1. multi_analysis_dimension_detail.py

**변경 사항**:
- `apply_campaign_type_mapping()` 함수 추가
- 모든 dimension_type*.csv에 `유형구분_통합` 컬럼 추가
- 모든 dimension_type*.csv에 `CPC` 컬럼 추가 (v1.4)

**CPC 계산 로직** (v1.4 추가):
```python
# 모든 Type 분석에서 CPC 계산
analysis['CPC'] = (analysis['비용'] / analysis['클릭']).replace([np.inf, -np.inf], 0).fillna(0)
```

**영향받는 출력 파일**:
- dimension_type1_campaign_adset.csv
- dimension_type2_adset_age_gender.csv
- dimension_type3_adset_age.csv
- dimension_type4_adset_gender.csv
- dimension_type5_adset_device.csv
- dimension_type6_adset_platform.csv
- dimension_type7_adset_deviceplatform.csv

### 2. generate_type_insights.py

**변경 사항**:
- 유형구분_통합 기반 KPI 분기 로직 추가
- 트래픽 캠페인용 인사이트 템플릿 추가
- CPC 기반 성과 판단 로직 추가
- v1.5: 유형구분_통합 매핑 조건을 v1.3 기준으로 통일 ('트래픽' 키워드만 검색)

**유형구분_통합 매핑 로직** (v1.5):
```python
def get_campaign_type(value):
    if '트래픽' in value_str:  # '도달', '인지' 제거
        return '트래픽'
    return '전환'
```

**차원별 분석 분기** (v1.7 추가):
- 성별 분석: `gender_insights` (전환/ROAS), `gender_traffic_insights` (트래픽/CPC)
- 연령x성별 분석: `age_gender_insights` (전환/ROAS), `age_gender_traffic_insights` (트래픽/CPC)
- 기기유형 분석: `device_insights` (전환/ROAS), `device_traffic_insights` (트래픽/CPC)
- 기기플랫폼 분석: `deviceplatform_insights` (전환/ROAS), `deviceplatform_traffic_insights` (트래픽/CPC)

**영향받는 섹션**:
1. 상위 유형구분 분석 (라인 470-511)
2. 알림 생성 (라인 1786-1817)
3. 추천사항 생성 (라인 1877-1927)
4. 주간/월간 트렌드 (라인 835-912)

### 3. multi_analysis_prophet_forecast.py

**변경 사항** (v1.6):
- 모든 예측 결과에 `예측_CPC` 컬럼 추가
- CPC 계산: `예측_비용 / 예측_클릭`

**영향받는 출력 파일**:
- prophet_forecast_overall.csv
- prophet_forecast_by_category.csv
- prophet_forecast_by_seasonality.csv
- prophet_forecast_by_brand.csv
- prophet_forecast_by_product.csv
- prophet_forecast_by_gender.csv
- prophet_forecast_by_age.csv
- prophet_forecast_by_deviceplatform.csv
- prophet_forecast_by_platform.csv
- prophet_forecast_by_device.csv
- prophet_forecast_by_promotion.csv
- prophet_forecast_by_age_gender.csv

### 4. type_dashboard.html

**변경 불필요**:
- CPC 지표 이미 지원
- JSON 기반 렌더링으로 자동 반영

## 인사이트 메시지 템플릿

### 트래픽 캠페인용

```python
TRAFFIC_MESSAGES = {
    'excellent_cpc': {
        'title': "🎯 '{target}' 트래픽 캠페인이 효율적이에요!",
        'message': "{target}의 CPC가 {cpc:,}원으로 매우 우수합니다.",
        'action': "현재 전략을 유지하면서 예산 확대를 고려하세요."
    },
    'high_cpc_warning': {
        'title': "⚠️ '{target}' 트래픽 비용이 높아요",
        'message': "{target}의 CPC가 {cpc:,}원으로 높습니다.",
        'action': "타겟팅을 좁히거나 소재를 개선해보세요."
    }
}
```

### 전환 캠페인용 (기존 유지)

```python
CONVERSION_MESSAGES = {
    'high_roas_opportunity': {
        'title': "🎯 우리 브랜드의 찐팬은 '{target}' 입니다!",
        'message': "{target}의 ROAS가 {roas:.0f}%로 압도적입니다.",
        'action': "이번 주 광고 예산의 70%를 {target} 타겟에 집중해보세요."
    },
    'low_roas_warning': {
        'title': "⚠️ '{target}' 캠페인 점검이 필요해요",
        'message': "{target}의 ROAS가 {roas:.0f}%로 낮습니다.",
        'action': "소재를 교체하거나, 타겟팅을 좁혀보세요."
    }
}
```

## 파이프라인 실행 순서

```
1. multi_analysis_dimension_detail.py
   └─ 유형구분_통합 컬럼 추가된 CSV 생성

2. generate_type_insights.py
   └─ 유형구분_통합 기반 KPI 분기 처리
   └─ 트래픽: CPC 기준 인사이트
   └─ 전환: ROAS/CPA 기준 인사이트

3. type_insights.json 생성
   └─ 유형별 적절한 KPI 메시지 포함

4. type_dashboard.html
   └─ JSON 렌더링 (변경 불필요)
```

## 주의사항

1. **광고세트 기준 분류**: v1.3부터 '광고세트' 컬럼 기준으로 트래픽/전환 분류
2. **CPC 계산**: v1.4부터 모든 CSV에 CPC 컬럼 포함 (`비용/클릭`)
3. **하위 호환성**: 기존 `유형구분` 컬럼 유지

## 실제 적용 결과

### v1.3+ 기준 (광고세트 기준 분류)
| 광고세트 조건 | 유형구분_통합 | 메인 KPI | 비고 |
|--------------|---------------|----------|------|
| '트래픽' 키워드 포함 | 트래픽 | CPC | 클릭당 비용 기준 성과 평가 |
| 그 외 | 전환 | ROAS, CPA | 전환 효율 기준 성과 평가 |

### CSV 출력 컬럼 (v1.4+)
모든 dimension_type*.csv 파일에 다음 컬럼 포함:
- `CPC`: 비용/클릭 (클릭 0일 경우 0 처리)
- `유형구분_통합`: 트래픽 또는 전환

### 중요: 유형구분과 유형구분_통합의 차이

> **주의**: `유형구분`(예: 메타_트래픽, 메타_전환)과 `유형구분_통합`(트래픽/전환)은 다릅니다.
>
> - `유형구분_통합`은 **광고세트 컬럼**에 '트래픽' 포함 여부로 결정됩니다.
> - `유형구분`이 '메타_트래픽'이더라도 해당 행의 `광고세트`에 '트래픽'이 없으면 → `유형구분_통합 = '전환'` → KPI는 ROAS/CPA

**예시**:
| 유형구분 | 광고세트 | 유형구분_통합 | 메인 KPI |
|----------|----------|---------------|----------|
| 메타_트래픽 | 브랜드_트래픽_2024 | 트래픽 | CPC |
| 메타_트래픽 | 브랜드_인지도_2024 | 전환 | ROAS, CPA |
| 메타_전환 | 신규고객_트래픽_캠페인 | 트래픽 | CPC |
| 메타_전환 | 신규고객_전환_캠페인 | 전환 | ROAS, CPA |

### 생성된 인사이트 예시
```json
{
  "type": "excellent_cpc_opportunity",
  "title": "🎯 트래픽 캠페인이 효율적이에요!",
  "message": "해당 광고세트의 CPC가 105원으로 매우 우수합니다."
}
```

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2024-12-18 | 1.0 | 초안 작성 |
| 2024-12-18 | 1.1 | 구현 완료 및 테스트 결과 추가 |
| 2024-12-18 | 1.2 | 메타_인지를 트래픽으로 매핑 변경 |
| 2024-12-18 | 1.3 | 매핑 기준 변경: 유형구분 → 광고세트 (LIKE '%트래픽%') |
| 2024-12-18 | 1.4 | 모든 dimension_type*.csv에 CPC 컬럼 추가 |
| 2024-12-18 | 1.5 | generate_type_insights.py 매핑 조건 v1.3 기준 통일 |
| 2024-12-18 | 1.6 | multi_analysis_prophet_forecast.py에 예측_CPC 추가 |
| 2024-12-18 | 1.7 | generate_type_insights.py 차원별 분석에 유형구분_통합 분기 추가 |
| 2024-12-18 | 1.8 | 문서 명확화: 유형구분 vs 유형구분_통합 차이 설명, 광고세트 기준 분류 예시 추가 |
