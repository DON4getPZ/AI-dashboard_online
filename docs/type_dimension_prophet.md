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

## CSV 컬럼 스펙

### Prophet CSV 주요 컬럼명

| Prophet CSV | 그룹 컬럼 | 값 예시 |
|-------------|----------|--------|
| `prophet_forecast_by_device.csv` | `기기유형_통합` | `mobile`, `desktop` |
| `prophet_forecast_by_platform.csv` | `플랫폼` | `Instagram`, `Facebook`, `Messenger` |
| `prophet_forecast_by_deviceplatform.csv` | `기기플랫폼_통합` | `android_smartphone`, `ios_smartphone` |

### 공통 컬럼 구조

```
일자, 예측_비용, 예측_노출, 예측_클릭, 예측_전환수, 예측_전환값, 예측_ROAS, 예측_CPA, type
```

- `type`: `actual` (실제 데이터) / `forecast` (예측 데이터)

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

## Dashboard 데이터 참조 (type_dashboard.html)

### insights.json 키 매핑

| insights.json 키 | Prophet CSV | 용도 |
|-----------------|-------------|------|
| `by_device` | `prophet_forecast_by_device.csv` | 기기별 예측 |
| `by_platform` | `prophet_forecast_by_platform.csv` | 플랫폼별 예측 |
| `by_deviceplatform` | `prophet_forecast_by_deviceplatform.csv` | 기기플랫폼별 예측 (AI 예측 탭 사용) |

### 타겟 분석 탭 데이터 소스

| UI 섹션 | 데이터 소스 | 속성명 |
|--------|-----------|-------|
| 🏆 가장 효과적인 타겟 - 기기 | `device_performance` | `.device` |
| 📱 기기플랫폼별 성과 | `deviceplatform_performance` | `.deviceplatform` |
| 💻 기기별 성과 | `device_performance` | `.device` |
| 📱 최적 기기 | `device_performance` | `.device` |

**코드 참조** (`type_dashboard.html`):
```javascript
// 타겟 분석 데이터 로드
const deviceData = (periodData.device_performance || []).filter(d =>
    d.device && d.device.toLowerCase() !== 'uncategorized' && d.device.toLowerCase() !== 'unknown'
);

// 최고 기기유형
const topDevice = deviceData.length > 0 ? [...deviceData].sort((a, b) => b.roas - a.roas)[0] : null;
```

### AI 예측 탭 서브탭

| 서브탭 | data-subtab | 데이터 참조 | 속성명 |
|-------|-------------|-----------|-------|
| 🛍️ 상품별 | `product` | `forecast.by_product` | `.product` |
| 👫 성별&연령 | `gender-age` | `forecast.by_gender`, `forecast.by_age` | `.gender`, `.age` |
| 📱 기기플랫폼 | `deviceplatform` | `forecast.by_deviceplatform` | `.deviceplatform` |
| 📊 채널 | `category` | `forecast.by_category` | `.category` |

**코드 참조** (`type_dashboard.html`):
```javascript
} else if (tab === 'deviceplatform') {
    // 기기플랫폼 예측
    if (forecast.by_deviceplatform && forecast.by_deviceplatform.length > 0) {
        const sorted = [...forecast.by_deviceplatform].sort((a, b) => (b.avg_forecast_roas || 0) - (a.avg_forecast_roas || 0));
        sorted.forEach((dev, idx) => {
            html += `<div>${dev.deviceplatform}</div>`;
        });
    }
}
```

---

## generate_type_insights.py 참조

### Prophet 파일 로딩

```python
prophet_files = {
    'platform': 'prophet_forecast_by_platform.csv',
    'deviceplatform': 'prophet_forecast_by_deviceplatform.csv',
    'device': 'prophet_forecast_by_device.csv',
    # ...
}
```

### 컬럼 매핑 로직

```python
# 플랫폼별 예측 (Type6 기반)
platform_col = '플랫폼' if '플랫폼' in platform_df.columns else None

# 기기플랫폼별 예측 (Type7 기반)
deviceplatform_col = '기기플랫폼_통합' if '기기플랫폼_통합' in deviceplatform_df.columns else '기기플랫폼'

# 기기유형별 예측 (Type5 기반)
device_col = '기기유형_통합' if '기기유형_통합' in device_df.columns else '기기유형'
```

---

## 실행 순서

1. `multi_analysis_dimension_detail.py` 실행 (dimension CSV 생성)
2. `multi_analysis_prophet_forecast.py` 실행 (prophet CSV 생성)
3. `generate_type_insights.py` 실행 (insights.json 생성)

> Prophet 스크립트는 dimension CSV를 로드하므로 반드시 dimension 스크립트를 먼저 실행해야 합니다.

**배치 파일 (`run_analysis_final.bat`):**
```batch
echo [8/10] Generating dimension-level detail analysis...
python scripts\multi_analysis_dimension_detail.py

echo [9/10] Running Prophet time-series forecasting...
python scripts\multi_analysis_prophet_forecast.py

echo [10/10] Generating multi-period type insights...
python scripts\generate_type_insights_multiperiod.py
```

---

## 용어 정리

| 용어 | Type | 데이터 예시 | CSV 컬럼 |
|-----|------|-----------|---------|
| 기기유형 | Type5 | `안드로이드`, `애플`, `모바일`, `웹` | `기기유형_통합` |
| 플랫폼 | Type6 | `Instagram`, `Facebook` | `플랫폼` |
| 기기플랫폼 | Type7 | `앱`, `모바일웹`, `웹` | `기기플랫폼_통합` |

> **주의**: '기기유형'의 `모바일`과 '기기플랫폼'의 `모바일웹`은 서로 다른 개념입니다.
> - 기기유형 `모바일`: Google Ads의 Mobile phones/Tablets (OS 구분 불가)
> - 기기플랫폼 `모바일웹`: Mobile web 브라우저 환경

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2025-12-03 | 기기플랫폼 매핑: 'Mobile web' → '모바일웹'으로 변경 (기기유형 '모바일'과 혼동 방지) |
| 2025-12-03 | AI 예측 탭: '기기' 서브탭 → '기기플랫폼' 서브탭으로 변경 (`forecast.by_deviceplatform` 참조) |
| 2025-12-03 | 타겟 분석 탭: '기기유형별 성과' → '기기플랫폼별 성과'로 변경 (deviceplatform_performance 참조) |
| 2025-12-03 | 타겟 분석 탭: '기기유형별 세부 성과' → '기기별 성과'로 변경 (device_performance 유지) |
| 2025-12-03 | 추이 분석 탭: '기기유형 추이' → '기기 추이'로 변경 |
| 2025-12-03 | Dashboard 데이터 참조 섹션 추가 |
| 2025-12-03 | Type6(플랫폼) → `prophet_forecast_by_platform.csv` 신규 추가 |
| 2025-12-03 | Type7(기기플랫폼) → `prophet_forecast_by_deviceplatform.csv` 이름 변경 |
| 2025-12-02 | `prophet_forecast_by_category.csv` 필터에 `Type1_캠페인+광고세트` 조건 추가 |
