# Dimension CSV ↔ Prophet CSV 필터조건 가이드

## 개요

마케팅 데이터 분석 파이프라인에서 두 스크립트가 CSV 파일을 생성합니다:
- `multi_analysis_dimension_detail.py`: Dimension CSV 생성
- `multi_analysis_prophet_forecast.py`: Prophet 예측 CSV 생성

---

## Dimension CSV ↔ Prophet CSV 필터조건 대조표

| Dimension CSV | Dimension 필터조건 | Prophet CSV | Prophet 필터조건 |
|---------------|-------------------|-------------|-----------------|
| `dimension_type1_campaign_adset.csv` | `Type1_캠페인+광고세트` | `prophet_forecast_by_category.csv` | `Type1` + 유형구분 |
| `dimension_type1_campaign_adset.csv` | `Type1_캠페인+광고세트` | `prophet_forecast_by_brand.csv` | `Type1` → 브랜드명 |
| `dimension_type1_campaign_adset.csv` | `Type1_캠페인+광고세트` | `prophet_forecast_by_product.csv` | `Type1` → 상품명 |
| `dimension_type1_campaign_adset.csv` | `Type1_캠페인+광고세트` | `prophet_forecast_by_promotion.csv` | `Type1` → 프로모션 |
| `dimension_type2_adset_age_gender.csv` | `Type2_광고세트+연령+성별` | `prophet_forecast_by_age_gender.csv` | dimension_type2 CSV 로드 |
| `dimension_type3_adset_age.csv` | `Type3` **OR** `Type2` | `prophet_forecast_by_age.csv` | dimension_type3 CSV 로드 |
| `dimension_type4_adset_gender.csv` | `Type4` **OR** `Type2` | `prophet_forecast_by_gender.csv` | dimension_type4 CSV 로드 |
| `dimension_type5_adset_device.csv` | `Type5_광고세트+기기유형` | `prophet_forecast_by_device.csv` | dimension_type5 CSV 로드 |
| `dimension_type6_adset_platform.csv` | `Type6_광고세트+플랫폼` | `prophet_forecast_by_platform.csv` | dimension_type6 CSV 로드 |
| `dimension_type7_adset_deviceplatform.csv` | `Type7_광고세트+기기플랫폼` | `prophet_forecast_by_deviceplatform.csv` | dimension_type7 CSV 로드 |
| *(merged_data 전체)* | 전체 | `prophet_forecast_overall.csv` | 전체 |
| *(merged_data 전체)* | 전체 | `prophet_forecast_by_seasonality.csv` | 전체 |

---

## 데이터 타입 분류 기준

`merged_data.csv`의 각 행은 다음 조건에 따라 data_type이 분류됩니다:

| data_type | 캠페인 | 광고세트 | 연령 | 성별 | 기기유형 | 플랫폼 | 기기플랫폼 |
|-----------|:------:|:-------:|:----:|:----:|:-------:|:------:|:---------:|
| Type1_캠페인+광고세트 | O | O | X | X | X | X | X |
| Type2_광고세트+연령+성별 | X | O | O | O | X | X | X |
| Type3_광고세트+연령 | X | O | O | X | X | X | X |
| Type4_광고세트+성별 | X | O | X | O | X | X | X |
| Type5_광고세트+기기유형 | X | O | X | X | O | X | X |
| Type6_광고세트+플랫폼 | X | O | X | X | X | O | X |
| Type7_광고세트+기기플랫폼 | X | O | X | X | X | X | O |

> O = 값 있음 (`!= '-'`), X = 값 없음 (`== '-'`)

---

## 중복 포함 관계

### Type2 데이터 중복 포함

연령+성별 데이터(Type2)는 연령 분석과 성별 분석 모두에 필요하므로 다음과 같이 포함됩니다:

```
dimension_type3 (연령) = Type3 + Type2
dimension_type4 (성별) = Type4 + Type2
```

**코드 참조** (`multi_analysis_dimension_detail.py`):
```python
# Type3: 연령만 + 연령+성별 데이터
type3_data = df[(df['data_type'] == 'Type3_광고세트+연령') |
                (df['data_type'] == 'Type2_광고세트+연령+성별')]

# Type4: 성별만 + 연령+성별 데이터
type4_data = df[(df['data_type'] == 'Type4_광고세트+성별') |
                (df['data_type'] == 'Type2_광고세트+연령+성별')]
```

---

## 데이터 흐름도

```
merged_data.csv
       │
       ├─── multi_analysis_dimension_detail.py
       │         │
       │         ├── dimension_type1_campaign_adset.csv
       │         ├── dimension_type2_adset_age_gender.csv
       │         ├── dimension_type3_adset_age.csv (Type2+Type3)
       │         ├── dimension_type4_adset_gender.csv (Type2+Type4)
       │         ├── dimension_type5_adset_device.csv
       │         ├── dimension_type6_adset_platform.csv
       │         └── dimension_type7_adset_deviceplatform.csv
       │
       └─── multi_analysis_prophet_forecast.py
                 │
                 ├── [직접 필터] Type1 기반
                 │     ├── prophet_forecast_by_category.csv
                 │     ├── prophet_forecast_by_brand.csv
                 │     ├── prophet_forecast_by_product.csv
                 │     └── prophet_forecast_by_promotion.csv
                 │
                 ├── [CSV 로드] dimension_type CSV 활용
                 │     ├── prophet_forecast_by_age.csv ← type3
                 │     ├── prophet_forecast_by_gender.csv ← type4
                 │     ├── prophet_forecast_by_device.csv ← type5
                 │     ├── prophet_forecast_by_platform.csv ← type6
                 │     ├── prophet_forecast_by_deviceplatform.csv ← type7
                 │     └── prophet_forecast_by_age_gender.csv ← type2
                 │
                 └── [전체 데이터]
                       ├── prophet_forecast_overall.csv
                       └── prophet_forecast_by_seasonality.csv
```

---

## 실행 순서

1. `multi_analysis_dimension_detail.py` 실행 (dimension CSV 생성)
2. `multi_analysis_prophet_forecast.py` 실행 (prophet CSV 생성)

> Prophet 스크립트는 dimension CSV를 로드하므로 반드시 dimension 스크립트를 먼저 실행해야 합니다.

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2025-12-03 | Type6(플랫폼) → `prophet_forecast_by_platform.csv` 신규 추가 |
| 2025-12-03 | Type7(기기플랫폼) → `prophet_forecast_by_deviceplatform.csv` 이름 변경 |
| 2025-12-02 | `prophet_forecast_by_category.csv` 필터에 `Type1_캠페인+광고세트` 조건 추가 |
