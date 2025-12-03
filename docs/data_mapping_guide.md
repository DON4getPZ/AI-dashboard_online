# 데이터 매핑 가이드

마케팅 데이터 분석 시 사용되는 성별, 연령, 기기유형, 기기플랫폼 등 차원 데이터의 통합 매핑 규칙을 정의합니다.

---

## 1. 성별 (Gender) 매핑

### 1.1 매핑 테이블

| 통합값 | 매핑 대상 | 비고 |
|--------|----------|------|
| **남성** | `남성`, `남자`, `MALE`, `male`, `Male` | 한글/영문 대소문자 통합 |
| **여성** | `여성`, `여자`, `FEMALE`, `female`, `Female` | 한글/영문 대소문자 통합 |
| **알 수 없음** | `알 수 없음`, `UNDETERMINED` | 미식별 데이터 |

### 1.2 코드 예시

```python
gender_map = {
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
    'UNDETERMINED': '알 수 없음'
}

df['성별_통합'] = df['성별'].replace(gender_map)
```

### 1.3 적용 파일
- `scripts/multi_analysis_dimension_detail.py` (dimension_type*.csv 생성 시)
- `scripts/multi_analysis_prophet_forecast.py` (8. 성별 다중 지표 예측 섹션)

---

## 2. 연령 (Age) 매핑

### 2.1 매핑 테이블

| 통합값 | 매핑 대상 | 비고 |
|--------|----------|------|
| **14세 미만** | `14세 미만` | 변경 없음 |
| **14세 ~ 18세** | `14세 ~ 18세` | 변경 없음 |
| **19세 ~ 24세** | `19세 ~ 24세`, `AGE_RANGE_18_24` | 영문 코드 통합 |
| **25세 ~ 34세** | `25세 ~ 29세`, `30세 ~ 34세`, `AGE_RANGE_25_34` | 10세 단위 통합 |
| **35세 ~ 44세** | `35세 ~ 39세`, `40세 ~ 44세`, `AGE_RANGE_35_44` | 10세 단위 통합 |
| **45세 ~ 54세** | `45세 ~ 49세`, `50세 ~ 54세`, `AGE_RANGE_45_54` | 10세 단위 통합 |
| **55세 ~ 64세** | `55세 ~ 59세`, `AGE_RANGE_55_64` | 10세 단위 통합 |
| **65세 이상** | `60세 ~ 99세`, `AGE_RANGE_65_UP` | 고연령대 통합 |
| **알 수 없음** | `알 수 없음`, `AGE_RANGE_UNDETERMINED` | 미식별 데이터 |

### 2.2 코드 예시

```python
age_map = {
    # 영문 → 한글 변환
    'AGE_RANGE_18_24': '19세 ~ 24세',
    'AGE_RANGE_25_34': '25세 ~ 34세',
    'AGE_RANGE_35_44': '35세 ~ 44세',
    'AGE_RANGE_45_54': '45세 ~ 54세',
    'AGE_RANGE_55_64': '55세 ~ 64세',
    'AGE_RANGE_65_UP': '65세 이상',
    'AGE_RANGE_UNDETERMINED': '알 수 없음',
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

df['연령_통합'] = df['연령'].replace(age_map)
```

### 2.3 적용 파일
- `scripts/multi_analysis_dimension_detail.py` (dimension_type*.csv 생성 시)
- `scripts/multi_analysis_prophet_forecast.py` (9. 연령별 다중 지표 예측 섹션)

---

## 3. 기기유형 (Device Type) 매핑

### 3.1 개요

기기유형은 플랫폼(Google Ads, Meta)에 따라 다른 형식으로 제공됩니다.
- **Google Ads**: `Computers`, `Mobile phones`, `Tablets`, `TV screens`
- **Meta**: `Android Smartphone`, `Android Tablet`, `iPhone`, `iPad`, `Desktop`

OS(안드로이드/애플) 기반으로 통합하여 분석 정확도를 높입니다.

### 3.2 매핑 테이블

| 통합값 | 매핑 대상 | 비고 |
|--------|----------|------|
| **안드로이드** | `Android Smartphone`, `Android Tablet` | Meta - Android OS 기기 |
| **애플** | `iPhone`, `iPad` | Meta - iOS 기기 |
| **모바일** | `Mobile phones`, `Tablets` | Google Ads - OS 구분 불가 |
| **웹** | `Computers`, `Desktop` | PC/데스크톱 |
| **TV** | `TV screens` | 변경 없음 |

### 3.3 코드 예시

```python
device_map = {
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

df['기기유형_통합'] = df['기기유형'].replace(device_map)
```

### 3.4 적용 파일
- `scripts/multi_analysis_dimension_detail.py` (dimension_type5_adset_device.csv 생성 시)
- `scripts/multi_analysis_prophet_forecast.py` (기기유형별 예측 시 - 향후 확장 예정)

### 3.5 통합 효과

| 항목 | 통합 전 | 통합 후 |
|------|--------|--------|
| 카테고리 수 | 9개 (분산) | 5개 (통합) |
| 분석 가독성 | 복잡 | 단순화 |
| Prophet 학습 | 데이터 분산 | OS별 통합으로 학습 데이터 증가 |

---

## 4. 기기플랫폼 (Device Platform) 매핑

### 4.1 개요

기기플랫폼은 사용자의 접속 환경(앱/웹)을 구분합니다.
- 기기유형과 다른 차원의 데이터
- 현재 Meta 데이터에서만 제공

### 4.2 매핑 테이블

| 통합값 | 매핑 대상 | 비고 |
|--------|----------|------|
| **앱** | `Mobile app` | 모바일 앱 |
| **모바일웹** | `Mobile web` | 모바일 브라우저 (기기유형 '모바일'과 혼동 방지) |
| **웹** | `Desktop`, `PC`, `pc` | PC 브라우저 |

> **주의**: 기기유형의 `모바일`(Google Ads Mobile phones/Tablets)과 기기플랫폼의 `모바일웹`(Mobile web 브라우저)은 서로 다른 개념입니다.

### 4.3 코드 예시

```python
platform_map = {
    # 앱
    'Mobile app': '앱',
    # 모바일웹 (기기유형 '모바일'과 혼동 방지를 위해 '모바일웹'으로 명명)
    'Mobile web': '모바일웹',
    # 웹
    'Desktop': '웹',
    'PC': '웹',
    'pc': '웹'
}

df['기기플랫폼_통합'] = df['기기플랫폼'].replace(platform_map)
```

### 4.4 적용 파일
- `scripts/multi_analysis_dimension_detail.py` (dimension_type7_adset_deviceplatform.csv 생성 시)
- `scripts/multi_analysis_prophet_forecast.py` (10. 기기플랫폼별 다중 지표 예측 섹션)

### 4.5 기기유형 vs 기기플랫폼 차이

| 구분 | 기기유형 (Type5) | 기기플랫폼 (Type7) |
|------|------------------|-------------------|
| **의미** | 기기 종류 + OS | 접속 환경 |
| **질문** | "어떤 기기로 봤나?" | "앱으로 봤나, 웹으로 봤나?" |
| **통합값** | 안드로이드, 애플, 모바일, 웹, TV | 앱, 모바일웹, 웹 |
| **데이터 출처** | Google Ads + Meta | Meta |

> **혼동 방지**: 기기유형의 `모바일`과 기기플랫폼의 `모바일웹`은 이름이 비슷하지만 완전히 다른 개념입니다.

---

## 5. 하이브리드 접근법

### 5.1 개요

원본 컬럼(`연령`, `성별`, `기기유형`, `기기플랫폼`)을 유지하면서 통합 컬럼(`*_통합`)을 추가하는 방식입니다.

```
┌─────────────────────────────────────────────────────────────┐
│                    하이브리드 접근법                         │
├─────────────────────────────────────────────────────────────┤
│  원본 컬럼 (보존)          통합 컬럼 (추가)                  │
│  ├── 연령                  ├── 연령_통합                    │
│  ├── 성별                  ├── 성별_통합                    │
│  ├── 기기유형              ├── 기기유형_통합                 │
│  └── 기기플랫폼            └── 기기플랫폼_통합               │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 장점

| 항목 | 설명 |
|------|------|
| **원본 데이터 보존** | 원시 데이터 분석 가능 |
| **하위 호환성** | 기존 코드 동작 보장 |
| **유연성** | 용도에 따라 원본/통합 선택 가능 |
| **디버깅 용이** | 매핑 전후 비교 가능 |

### 5.3 적용 위치

`scripts/multi_analysis_dimension_detail.py`에서 dimension_type*.csv 생성 시 적용:

```python
# 성별 매핑 (원본 유지 + 통합 컬럼 추가)
if '성별' in df.columns:
    df['성별_통합'] = df['성별'].replace(gender_map)

# 연령 매핑 (원본 유지 + 통합 컬럼 추가)
if '연령' in df.columns:
    df['연령_통합'] = df['연령'].replace(age_map)

# 기기유형 매핑 (원본 유지 + 통합 컬럼 추가)
if '기기유형' in df.columns:
    df['기기유형_통합'] = df['기기유형'].replace(device_map)

# 기기플랫폼 매핑 (원본 유지 + 통합 컬럼 추가)
if '기기플랫폼' in df.columns:
    df['기기플랫폼_통합'] = df['기기플랫폼'].replace(platform_map)
```

---

## 6. Fallback 로직

### 6.1 개요

`_통합` 컬럼을 우선 사용하고, 없으면 기존 컬럼으로 fallback하는 패턴입니다.

### 6.2 Python (generate_type_insights.py)

```python
# 헬퍼 함수 정의
def get_gender_column(df):
    """성별 컬럼명 반환 (성별_통합 우선)"""
    return '성별_통합' if '성별_통합' in df.columns else '성별'

def get_age_column(df):
    """연령 컬럼명 반환 (연령_통합 우선)"""
    return '연령_통합' if '연령_통합' in df.columns else '연령'

def get_device_column(df):
    """기기유형 컬럼명 반환 (기기유형_통합 우선)"""
    return '기기유형_통합' if '기기유형_통합' in df.columns else '기기유형'

def get_platform_column(df):
    """기기플랫폼 컬럼명 반환 (기기플랫폼_통합 우선)"""
    return '기기플랫폼_통합' if '기기플랫폼_통합' in df.columns else '기기플랫폼'

# 사용 예시
gender_col = get_gender_column(type4_df)
age_col = get_age_column(type3_df)
device_col = get_device_column(type5_df)
platform_col = get_platform_column(type7_df)
```

### 6.3 JavaScript (type_dashboard.html)

```javascript
// 성별 참조
const rawGender = row['성별_통합'] || row['성별'];

// 연령 참조
const age = row['연령_통합'] || row['연령'];

// 기기유형 참조
const device = row['기기유형_통합'] || row['기기유형'];

// 기기플랫폼 참조
const platform = row['기기플랫폼_통합'] || row['기기플랫폼'];
```

### 6.4 Fallback 적용 위치

#### 성별/연령 Fallback

| 파일 | 라인 | 용도 |
|------|------|------|
| `type_dashboard.html` | 5521 | 성별 필터링 |
| `type_dashboard.html` | 5846 | 연령 필터링 |
| `type_dashboard.html` | 6799 | 성별 목록 추출 |
| `type_dashboard.html` | 6834 | 성별별 일별 집계 |
| `type_dashboard.html` | 7158 | 연령 목록 추출 |
| `type_dashboard.html` | 7191 | 연령별 일별 집계 |
| `type_dashboard.html` | 9102 | PIVOT 성별 |
| `type_dashboard.html` | 9104 | PIVOT 연령 |
| `generate_type_insights.py` | 211-219 | Type4 성별 분석 |
| `generate_type_insights.py` | 662-664 | Type3 연령 분석 |
| `generate_type_insights.py` | 919 | Prophet 성별 예측 |
| `generate_type_insights.py` | 947 | Prophet 연령 예측 |

#### 기기유형/기기플랫폼 Fallback

| 파일 | 위치 | 용도 |
|------|------|------|
| `multi_analysis_dimension_detail.py` | 338-339 | Type5 기기유형 매핑 적용 |
| `multi_analysis_dimension_detail.py` | 396-397 | Type7 기기플랫폼 매핑 적용 |
| `multi_analysis_prophet_forecast.py` | 섹션 10 | 기기플랫폼별 Prophet 예측 |
| `multi_analysis_prophet_forecast.py` | 섹션 10-2 | 기기유형별 Prophet 예측 |
| `generate_type_insights.py` | 320-347 | Type5 기기유형 분석 |
| `generate_type_insights.py` | 351-377 | Type7 기기플랫폼 분석 |
| `generate_type_insights.py` | 1027-1047 | 기기유형별 예측 인사이트 |
| `type_dashboard.html` | (향후 추가) | 기기유형 필터링 |
| `type_dashboard.html` | (향후 추가) | 기기플랫폼 필터링 |

---

## 7. 데이터 타입별 참조 구조

### 7.1 데이터 타입 정의

| Type | 설명 | 포함 차원 |
|------|------|----------|
| Type2 | 광고세트+연령+성별 | 연령_통합 + 성별_통합 |
| Type3 | 광고세트+연령 | 연령_통합 |
| Type4 | 광고세트+성별 | 성별_통합 |
| Type5 | 광고세트+기기유형 | 기기유형_통합 |
| Type7 | 광고세트+기기플랫폼 | 기기플랫폼_통합 |

### 7.2 CSV 파일별 데이터 구조

```
┌─────────────────────────────────────────────────────────────┐
│              dimension_type*.csv 구조                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  dimension_type2_adset_age_gender.csv                       │
│  └── Type2 데이터만 (연령_통합 + 성별_통합 둘 다 있음)        │
│                                                             │
│  dimension_type3_adset_age.csv                              │
│  └── Type3 데이터 + Type2 데이터                            │
│      (연령_통합 있는 모든 데이터)                            │
│                                                             │
│  dimension_type4_adset_gender.csv                           │
│  └── Type4 데이터 + Type2 데이터                            │
│      (성별_통합 있는 모든 데이터)                            │
│                                                             │
│  dimension_type5_adset_device.csv                           │
│  └── Type5 데이터 (기기유형_통합 있음)                       │
│      (안드로이드/애플/모바일/웹/TV로 통합)                   │
│                                                             │
│  dimension_type7_adset_deviceplatform.csv                   │
│  └── Type7 데이터 (기기플랫폼_통합 있음)                     │
│      (앱/모바일웹/웹으로 통합)                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Prophet 예측 CSV 구조

```
┌─────────────────────────────────────────────────────────────┐
│           prophet_forecast_*.csv 구조                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  prophet_forecast_by_gender.csv                             │
│  └── dimension_type4 참조 (Type4 + Type2)                   │
│  └── 컬럼: 성별_통합, 일자, 예측_비용, 예측_전환수, ...       │
│                                                             │
│  prophet_forecast_by_age.csv                                │
│  └── dimension_type3 참조 (Type3 + Type2)                   │
│  └── 컬럼: 연령_통합, 일자, 예측_비용, 예측_전환수, ...       │
│                                                             │
│  prophet_forecast_by_age_gender.csv                         │
│  └── dimension_type2 참조 (Type2만)                         │
│  └── 컬럼: 연령_통합, 성별_통합, 일자, 예측_비용, ...        │
│      (개별 컬럼으로 분리, 조합 컬럼 아님)                    │
│                                                             │
│  prophet_forecast_by_deviceplatform.csv                     │
│  └── dimension_type7 참조 (Type7)                           │
│  └── 컬럼: 기기플랫폼_통합, 일자, 예측_비용, 예측_전환수, ... │
│      (앱/모바일웹/웹 별 예측)                                │
│                                                             │
│  prophet_forecast_by_device.csv                             │
│  └── dimension_type5 참조 (Type5)                           │
│  └── 컬럼: 기기유형_통합, 일자, 예측_비용, 예측_전환수, ...   │
│      (안드로이드/애플/모바일/웹/TV 별 예측)                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.4 데이터 흐름도

```
merged_data.csv
      │
      ▼
┌──────────────────────────────────────────────────────────┐
│           multi_analysis_dimension_detail.py              │
│   (연령_통합, 성별_통합, 기기유형_통합, 기기플랫폼_통합 추가) │
└──────────────────────────────────────────────────────────┘
      │
      ├─► dimension_type2 (연령+성별)
      ├─► dimension_type3 (연령)
      ├─► dimension_type4 (성별)
      ├─► dimension_type5 (기기유형)
      └─► dimension_type7 (기기플랫폼)
      │
      ▼
┌─────────────────────────────────────────┐
│   multi_analysis_prophet_forecast.py    │
│   (dimension_type*.csv 참조)            │
└─────────────────────────────────────────┘
      │
      ├─► prophet_forecast_by_gender.csv (dimension_type4 참조, 성별_통합)
      ├─► prophet_forecast_by_age.csv (dimension_type3 참조, 연령_통합)
      ├─► prophet_forecast_by_age_gender.csv (dimension_type2 참조, 연령_통합+성별_통합)
      ├─► prophet_forecast_by_deviceplatform.csv (dimension_type7 참조, 기기플랫폼_통합)
      └─► prophet_forecast_by_device.csv (dimension_type5 참조, 기기유형_통합)
      │
      ▼
┌─────────────────────────────────────────┐
│     generate_type_insights.py           │
│     (fallback 로직으로 컬럼 참조)        │
└─────────────────────────────────────────┘
      │
      ▼
insights.json
      │
      ▼
┌─────────────────────────────────────────┐
│        type_dashboard.html              │
│        (fallback 로직으로 컬럼 참조)     │
└─────────────────────────────────────────┘
```

---

## 8. 매핑 적용 효과

### 8.1 데이터 통합 전후 비교

| 차원 | 통합 전 | 통합 후 | 개선 효과 |
|------|--------|--------|----------|
| 성별 (남성) | 27일 + 31일 (분리) | 58일 (통합) | 학습 데이터 2배 증가 |
| 성별 (여성) | 27일 + 31일 (분리) | 58일 (통합) | 학습 데이터 2배 증가 |
| 연령 (25~34세) | 27일 + 31일 (분리) | 58일 (통합) | 학습 데이터 2배 증가 |

### 8.2 Prophet 예측 정확도 향상
- 학습 데이터 증가로 시계열 패턴 학습 개선
- 주간 계절성 더 정확하게 반영
- 결측치(NaN) 발생 감소

---

## 9. 데이터 소스별 형식

### 9.1 플랫폼별 데이터 형식

| 플랫폼 | 성별 형식 | 연령 형식 | 기기유형 형식 | 기기플랫폼 형식 |
|--------|----------|----------|--------------|----------------|
| **메타** | `남성`, `여성`, `알 수 없음` | `19세 ~ 24세` 등 (한글) | `Android Smartphone`, `iPhone` 등 | `Mobile app`, `Mobile web`, `Desktop` |
| **구글** | `MALE`, `FEMALE`, `UNDETERMINED` | `AGE_RANGE_18_24` 등 (영문) | `Mobile phones`, `Computers` 등 | - |
| **네이버** | `남자`, `여자` | - | - | - |

### 9.2 통합 필요성
- 여러 플랫폼 데이터를 통합 분석할 때 동일한 기준으로 집계 필요
- Prophet 예측 시 충분한 학습 데이터 확보

---

## 10. 주의사항

### 10.1 매핑 순서
```python
# 올바른 순서: 영문 먼저, 한글 세부 연령대 나중에
df['연령_통합'] = df['연령'].replace(age_map)
```

### 10.2 원본 데이터 보존
```python
# 하이브리드 방식: 원본 컬럼 유지 + 통합 컬럼 추가
# df['성별'] 은 그대로 유지
df['성별_통합'] = df['성별'].replace(gender_map)
```

### 10.3 새로운 값 발생 시
- 매핑되지 않은 새 값은 그대로 유지됨
- 정기적으로 미매핑 값 확인 필요:
```python
unmapped = df[~df['성별'].isin(gender_map.keys()) & (df['성별'] != '-')]['성별'].unique()
print(f"미매핑 성별 값: {unmapped}")
```

### 10.4 Fallback 사용 시 주의
- `_통합` 컬럼이 없는 레거시 CSV도 정상 동작하도록 fallback 필수
- 새 CSV 생성 시 반드시 `_통합` 컬럼 포함

---

## 11. 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2025-11-25 | v1.0 | 최초 작성 - 성별/연령 매핑 규칙 정의 |
| 2025-11-26 | v2.0 | 하이브리드 접근법 및 Fallback 로직 추가, 데이터 타입별 참조 구조 문서화 |
| 2025-11-27 | v3.0 | 기기유형(Device Type), 기기플랫폼(Device Platform) 매핑 규칙 추가 |
| 2025-11-27 | v3.1 | multi_analysis_dimension_detail.py, multi_analysis_prophet_forecast.py에 기기유형_통합, 기기플랫폼_통합 적용 |
| 2025-11-27 | v3.2 | Fallback 적용 위치에 기기유형/기기플랫폼 항목 추가, Prophet 예측 CSV 구조 및 데이터 흐름도 업데이트 |
| 2025-11-27 | v3.3 | multi_analysis_prophet_forecast.py에 기기유형별 예측(섹션 10-2) 구현, generate_type_insights.py에 기기유형 분석 및 예측 인사이트 추가 |
| 2025-12-03 | v3.4 | 기기플랫폼 매핑 변경: `Mobile web` → `모바일웹` (기기유형 `모바일`과 혼동 방지) |

---

## 12. 관련 파일

| 파일 경로 | 설명 |
|----------|------|
| `scripts/multi_analysis_dimension_detail.py` | 차원별 CSV 생성 (매핑 적용) |
| `scripts/multi_analysis_prophet_forecast.py` | Prophet 시계열 예측 |
| `scripts/generate_type_insights.py` | 인사이트 JSON 생성 (fallback 로직) |
| `data/type_dashboard.html` | 대시보드 (fallback 로직) |
| `data/type/dimension_type2_adset_age_gender.csv` | Type2 차원 데이터 (연령+성별) |
| `data/type/dimension_type3_adset_age.csv` | Type3 차원 데이터 (연령) |
| `data/type/dimension_type4_adset_gender.csv` | Type4 차원 데이터 (성별) |
| `data/type/dimension_type5_adset_device.csv` | Type5 차원 데이터 (기기유형) |
| `data/type/dimension_type7_adset_deviceplatform.csv` | Type7 차원 데이터 (기기플랫폼) |
| `data/type/prophet_forecast_by_gender.csv` | 성별별 예측 결과 (성별_통합) |
| `data/type/prophet_forecast_by_age.csv` | 연령별 예측 결과 (연령_통합) |
| `data/type/prophet_forecast_by_age_gender.csv` | 연령+성별 예측 결과 (연령_통합+성별_통합) |
| `data/type/prophet_forecast_by_deviceplatform.csv` | 기기플랫폼별 예측 결과 (기기플랫폼_통합) |
| `data/type/prophet_forecast_by_device.csv` | 기기유형별 예측 결과 (기기유형_통합) |
| `data/type/insights.json` | 생성된 인사이트 데이터 |
