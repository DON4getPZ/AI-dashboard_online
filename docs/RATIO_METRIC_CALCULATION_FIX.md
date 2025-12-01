# 비율 지표 계산 이슈 점검 및 수정 가이드

## 개요

비율 지표(ROAS, CVR, CPA 등)의 평균 계산 시 `.mean()` 함수를 직접 사용하면 잘못된 결과가 산출되는 이슈를 발견하고 수정한 내용을 정리합니다.

## 문제 정의

### 잘못된 계산 방식
```python
# 잘못된 방식: 일별 ROAS의 단순 평균
avg_roas = df['ROAS'].mean()
```

### 왜 잘못되었는가?

| 일자 | 비용 | 전환값 | 일별 ROAS |
|------|------|--------|-----------|
| Day1 | 100 | 500 | 500% |
| Day2 | 900 | 450 | 50% |

- **잘못된 계산**: `(500% + 50%) / 2 = 275%`
- **올바른 계산**: `(500 + 450) / (100 + 900) * 100 = 95%`

단순 평균은 각 일자의 비용 규모(가중치)를 무시하므로, 비용이 적은 날의 높은 ROAS가 과대 반영됩니다.

### 올바른 계산 방식
```python
# 올바른 방식: 총합 기준 계산
total_cost = df['비용'].sum()
total_revenue = df['전환값'].sum()
avg_roas = (total_revenue / total_cost * 100) if total_cost > 0 else 0
```

## 영향받는 지표

| 지표 | 정의 | 올바른 계산 |
|------|------|-------------|
| ROAS | Return On Ad Spend | `sum(전환값) / sum(비용) * 100` |
| CPA | Cost Per Acquisition | `sum(비용) / sum(전환수)` |
| CVR | Conversion Rate | `sum(전환수) / sum(클릭수) * 100` |
| CTR | Click Through Rate | `sum(클릭수) / sum(노출수) * 100` |
| CPM | Cost Per Mille | `sum(비용) / sum(노출수) * 1000` |

## 수정된 파일 목록

### 1. generate_funnel_data.py (Line 396-397)

**수정 전:**
```python
avg_cvr = channel_funnel_pivot['CVR'].mean() if 'CVR' in channel_funnel_pivot.columns else 0
```

**수정 후:**
```python
total_acquisition = channel_funnel_pivot['유입'].sum() if '유입' in channel_funnel_pivot.columns else 0
total_purchase = channel_funnel_pivot['구매완료'].sum() if '구매완료' in channel_funnel_pivot.columns else 0
avg_cvr = (total_purchase / total_acquisition * 100) if total_acquisition > 0 else 0
```

---

### 2. multi_analysis_dimension_detail.py (Lines 240-263)

**수정 전:**
```python
pivot = adset_data.pivot_table(
    values='ROAS',
    index='연령',
    columns='성별',
    aggfunc='mean',
    fill_value=0
)
```

**수정 후:**
```python
adset_agg = adset_data.groupby(['연령', '성별']).agg({
    '비용': 'sum',
    '전환값': 'sum'
}).reset_index()
adset_agg['ROAS'] = np.where(
    adset_agg['비용'] > 0,
    (adset_agg['전환값'] / adset_agg['비용']) * 100,
    0
)
pivot = adset_agg.pivot_table(
    values='ROAS',
    index='연령',
    columns='성별',
    aggfunc='first',
    fill_value=0
)
```

---

### 3. generate_type_insights.py (Lines 1065-1358)

11개 섹션에서 `예측_ROAS.mean()` 및 `예측_CPA.mean()` 수정:

| 섹션 | 수정 내용 |
|------|----------|
| overall | 전체 예측 ROAS/CPA |
| category | 카테고리별 예측 |
| brand | 브랜드별 예측 |
| product | 제품별 예측 |
| gender | 성별 예측 |
| age | 연령별 예측 |
| platform | 플랫폼별 예측 |
| device | 기기유형별 예측 |
| promotion | 프로모션별 예측 |
| age_gender (2개 분기) | 연령+성별 조합 예측 |

**수정 패턴:**
```python
# 수정 전
"avg_forecast_roas": float(cat_data['예측_ROAS'].mean()),
"avg_forecast_cpa": float(cat_data['예측_CPA'].mean())

# 수정 후
cat_total_cost = float(cat_data['예측_비용'].sum()) if '예측_비용' in cat_data.columns else 0
cat_total_revenue = float(cat_data['예측_전환값'].sum()) if '예측_전환값' in cat_data.columns else 0
cat_total_conversions = float(cat_data['예측_전환수'].sum()) if '예측_전환수' in cat_data.columns else 0
...
"avg_forecast_roas": float((cat_total_revenue / cat_total_cost * 100) if cat_total_cost > 0 else 0),
"avg_forecast_cpa": float((cat_total_cost / cat_total_conversions) if cat_total_conversions > 0 else 0)
```

---

### 4. multi_analysis_prophet_forecast.py (12개 위치)

| 위치 | 대상 | 라인 번호 |
|------|------|-----------|
| 실제 데이터 | 평균 ROAS 출력 | ~198 |
| overall | 전체 예측 | ~239-251 |
| category | 카테고리별 | ~292-301 |
| brand | 브랜드별 | ~694-703 |
| product | 제품별 | ~753-762 |
| gender | 성별 | ~820-829 |
| age | 연령별 | ~891-900 |
| platform | 플랫폼별 | ~967-970 |
| device | 기기유형별 | ~1037-1040 |
| promotion | 프로모션별 | ~1099-1102 |
| age_gender | 연령+성별 조합 | ~1181-1184 |

**수정 패턴:**
```python
# 수정 전
print(f"평균 예측 ROAS: {result['예측_ROAS'].mean():.1f}%")

# 수정 후
total_cost = result['예측_비용'].sum() if '예측_비용' in result.columns else 0
total_revenue = result['예측_전환값'].sum() if '예측_전환값' in result.columns else 0
roas = (total_revenue / total_cost * 100) if total_cost > 0 else 0
print(f"평균 예측 ROAS: {roas:.1f}%")
```

## 점검 결과 (CPA, CTR, CPM)

추가로 CPA, CTR, CPM 지표에 대해서도 동일한 이슈가 있는지 점검한 결과:

| 지표 | `.mean()` 직접 사용 | pivot `aggfunc='mean'` | 상태 |
|------|---------------------|------------------------|------|
| CPA | 없음 | 없음 | 정상 |
| CTR | 없음 | 없음 | 정상 |
| CPM | 없음 | 없음 | 정상 |
| CVR | 없음 (수정됨) | 없음 | 정상 |
| ROAS | 없음 (수정됨) | 없음 (수정됨) | 정상 |

## 점검 방법

향후 동일 이슈 발생 방지를 위한 점검 명령어:

```bash
# ROAS mean() 사용 검색
grep -rn "ROAS.*mean\|mean.*ROAS" scripts/

# 모든 비율 지표 mean() 검색
grep -rn "\['(CPA|CTR|CPM|CVR|ROAS)'\]\.mean" scripts/

# pivot table aggfunc='mean' 검색
grep -rn "aggfunc.*mean" scripts/
```

## 권장 사항

1. **새로운 스크립트 작성 시**: 비율 지표는 반드시 총합 기준으로 계산
2. **코드 리뷰 시**: `.mean()` 사용 시 해당 컬럼이 비율 지표인지 확인
3. **pivot_table 사용 시**: 비율 지표에 `aggfunc='mean'` 사용 금지

## 수정 일자

- **최초 작성**: 2025-12-01
- **수정 완료**: 4개 파일, 총 24개 위치 수정
