# Prophet 계절성 예측 가이드

## 개요

이 문서는 `prophet_forecast_by_seasonality.csv` 생성 과정에서 적용된 Prophet 모델 설정과 데이터 후처리 방법을 정리합니다.

---

## 1. 음수 예측값 문제와 해결

### 1.1 문제 상황

Prophet이 장기간(365일) 예측 시, 하락 추세(trend)를 외삽(extrapolation)하여 **음수 값**이 발생할 수 있습니다.

```
예측_비용: -2,237,945원  (비정상)
예측_전환값: -5,063,753원  (비정상)
```

광고 비용, 전환수, 전환값 등은 **절대로 음수가 될 수 없는 지표**입니다.

### 1.2 1차 해결: `.clip(lower=0)`

예측 후 음수 값을 0으로 클리핑하여 해결합니다.

```python
# 모든 예측값에 적용
forecast['yhat'] = forecast['yhat'].clip(lower=0)
```

**한계점**: 하락 추세가 심할 경우, 대부분의 미래 예측값이 0이 되는 문제 발생

### 1.3 2차 해결: 하이브리드 접근법 (현재 적용)

**문제**: 미래 365일 예측 → 하락 추세 외삽 → clip(0) 적용 → 특정 월(3-4월 등)이 모두 0

**해결**: 계절성 분석에는 **과거 fitted 값** 사용, 미래 예측은 **단기(90일)**만 사용

```python
def forecast_seasonality_with_history(data, forecast_days=90):
    """Prophet으로 과거 fitted 값 + 단기 예측 반환"""

    model.fit(prophet_df)  # 365일 학습

    future = model.make_future_dataframe(periods=forecast_days)
    forecast = model.predict(future)

    # 1. 과거 fitted 값 (계절성 패턴 분석용)
    history_forecast = forecast[forecast['ds'] <= prophet_df['ds'].max()].copy()
    history_forecast['yhat'] = history_forecast['yhat'].clip(lower=0)

    # 2. 미래 예측값 (단기 90일)
    future_forecast = forecast[forecast['ds'] > prophet_df['ds'].max()].copy()
    future_forecast['yhat'] = future_forecast['yhat'].clip(lower=0)

    return history_forecast, future_forecast
```

### 1.4 대안적 해결 방법

1. **Logistic Growth 모델 사용**
   ```python
   model = Prophet(growth='logistic')
   prophet_df['floor'] = 0
   prophet_df['cap'] = prophet_df['y'].max() * 2  # 상한선 설정
   ```
   - 장점: 모델 수준에서 제약
   - 단점: cap 값 설정이 필요하고, 수렴 문제 발생 가능

2. **예측 기간 단축**
   - 365일 → 90일로 줄이면 음수 발생 확률 감소
   - 단점: 연간 계절성 패턴 분석이 제한됨

---

## 2. 현재 알고리즘 구조

### 2.1 전체 프로세스 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                    Prophet 학습 (365일)                          │
│                          ↓                                       │
│              model.predict(future)                               │
│                          ↓                                       │
│              .clip(lower=0) 적용                                 │
│                          ↓                                       │
│    ┌─────────────────────┴─────────────────────┐                │
│    ↓                                           ↓                │
│ 과거 fitted 값                            미래 예측값            │
│ (학습 기간 내 데이터)                      (90일 단기 예측)       │
│    ↓                                           ↓                │
│ ┌──────────────┐                         ┌──────────────┐       │
│ │ 요일별 평균   │                         │ 일별 예측     │       │
│ │ 월별 합계    │                         │ (미래 90일)  │       │
│ │ 분기별 평균  │                         └──────────────┘       │
│ └──────────────┘                               ↓                │
│        ↓                                       ↓                │
│        └───────────────────┬───────────────────┘                │
│                            ↓                                    │
│              prophet_forecast_by_seasonality.csv                │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 기간유형별 데이터 소스

| 기간유형 | 데이터 소스 | 집계 방식 | 설명 |
|---------|------------|----------|------|
| **요일별** | 과거 fitted (365일) | 요일별 평균 | 실제 과거 패턴 기반 |
| **월별** | 과거 fitted (365일) | 월별 합계 | 12개월 전체 포함 |
| **분기별** | 과거 fitted (365일) | 분기별 평균 | Q1~Q4 전체 포함 |
| **일별** | 과거 fitted + 미래 예측 | 개별 값 | 365일 + 90일 = 455일 |

### 2.3 왜 이 방식인가?

**미래 예측만 사용 시 문제:**
```
학습 데이터: 2024-11 ~ 2025-11 (365일)
미래 예측: 2025-11-27 ~ 2026-11-26 (365일)

→ 3월, 4월 데이터 = 2026년 3월, 4월 예측값
→ 하락 추세 외삽 + clip(0) = 모두 0
```

**과거 fitted 값 사용 시:**
```
학습 데이터: 2024-11 ~ 2025-11 (365일)
과거 fitted: 2024-11 ~ 2025-11 (365일)

→ 3월, 4월 데이터 = 2025년 3월, 4월 fitted 값
→ 실제 데이터에 맞춘 값이므로 정상 출력
```

---

## 3. Prophet 학습 기간 설정

### 현재 설정

```python
TRAINING_DAYS = 365  # 연간 학습 (변경 없음)
```

### 학습 기간별 특성

| 학습 기간 | 계절성 | 장점 | 단점 |
|----------|--------|------|------|
| 90일 | 주간만 | 빠른 학습, 최신 트렌드 반영 | 연간 패턴 학습 불가 |
| 180일 | 주간 + 부분 연간 | 균형잡힌 학습 | 완전한 연간 패턴 아님 |
| **365일** | 주간 + 연간 | 완전한 계절성 학습 | 오래된 데이터 포함 |
| 730일 | 주간 + 연간 + 장기 | 장기 트렌드 파악 | 과거 데이터에 과적합 |

### 학습 기간 동적 설정

```python
# 데이터 양에 따른 자동 설정
total_data_days = (df['일'].max() - df['일'].min()).days + 1

if total_data_days < 365:
    print(f"⚠️ 현재 데이터: {total_data_days}일 (365일 미만)")
    print("   → 연간 계절성(yearly_seasonality) 비활성화")
    use_yearly = False
else:
    use_yearly = True

model = Prophet(
    yearly_seasonality=use_yearly,
    weekly_seasonality=True,
    daily_seasonality=False
)
```

---

## 4. Prophet 주요 파라미터

### 계절성 설정

```python
model = Prophet(
    yearly_seasonality=True,   # 연간 계절성 (1년 이상 데이터 필요)
    weekly_seasonality=True,   # 주간 계절성 (기본 활성화)
    daily_seasonality=False    # 일간 계절성 (시간별 데이터 필요)
)
```

### 트렌드 유연성

```python
model = Prophet(
    changepoint_prior_scale=0.05  # 기본값: 0.05
)
```

| 값 | 효과 |
|----|------|
| 0.001 | 매우 부드러운 트렌드, 변화점 거의 없음 |
| **0.05** | 기본값, 적절한 유연성 |
| 0.5 | 높은 유연성, 급격한 트렌드 변화 허용 |
| 1.0 | 과적합 위험, 노이즈까지 학습 |

### 계절성 강도

```python
model = Prophet(
    seasonality_prior_scale=10  # 기본값: 10
)
```

| 값 | 효과 |
|----|------|
| 0.01 | 계절성 영향 최소화 |
| 1.0 | 약한 계절성 |
| **10.0** | 기본값, 적절한 계절성 |
| 25.0 | 강한 계절성 반영 |

---

## 5. 계절성 예측 데이터 구조

### 파일: `prophet_forecast_by_seasonality.csv`

```
유형구분,기간유형,요일,예측_비용,예측_노출,예측_클릭,예측_전환수,예측_전환값,예측_ROAS,예측_CPA
전체,요일별,월요일,3529508.23,387794.41,4639.27,205.75,6998561.59,198.29,17154.04
전체,월별,3월,42707617.48,4714157.26,55972.37,2221.16,68561047.15,160.54,19227.63
전체,분기별,Q1(1~3월),1094505.79,130559.36,1509.75,58.26,1798474.39,164.32,18785.37
전체,일별,2025-03-15,1370214.34,137504.70,1913.64,65.57,1974483.30,144.10,20897.54
```

### 기간유형별 집계 방식 (현재)

| 기간유형 | 데이터 소스 | 집계 방식 | 용도 |
|---------|------------|----------|------|
| 요일별 | 과거 365일 fitted | 요일별 평균 | 요일 패턴 분석 |
| 월별 | 과거 365일 fitted | 월별 합계 | 월간 예산 계획 |
| 분기별 | 과거 365일 fitted | 분기별 평균 | 분기 전략 수립 |
| 일별 | 과거 365일 + 미래 90일 | 개별 값 | 상세 트렌드 분석 |

---

## 6. 데이터 흐름

```
merged_data.csv (원본 데이터)
       ↓
multi_analysis_prophet_forecast.py
       ↓ Prophet 모델 학습 (최근 365일)
       ↓ .clip(lower=0) 적용
       ↓
       ├── 과거 fitted 값 → 요일별/월별/분기별 집계
       └── 미래 90일 예측 → 일별 데이터에 추가
       ↓
prophet_forecast_by_seasonality.csv
       ↓
generate_type_insights.py
       ↓ seasonality_analysis 생성
       ↓
insights.json
       ↓
type_dashboard.html (insightsData.seasonality_analysis)
```

---

## 7. 다른 Prophet 알고리즘에 하이브리드 접근법 적용 시 고려사항

### 7.1 적용 필요성 판단 기준

| 상황 | 적용 필요성 | 이유 |
|------|------------|------|
| 하락 추세 데이터 + 장기 예측 | **높음** | 음수 예측 → 0 클리핑 문제 |
| 상승 추세 데이터 | 낮음 | 음수 발생 가능성 낮음 |
| 안정적 추세 데이터 | 낮음 | 외삽 시에도 정상 범위 유지 |
| 계절성 패턴 분석 목적 | **높음** | 과거 패턴이 더 신뢰성 있음 |
| 미래 예측이 주 목적 | 낮음 | 미래 예측값 그대로 사용 |

### 7.2 장점

1. **데이터 손실 방지**
   - 하락 추세 시 0으로 클리핑되는 문제 해결
   - 모든 월/분기 데이터 정상 출력

2. **계절성 패턴 신뢰도 향상**
   - 실제 과거 데이터에 기반한 fitted 값 사용
   - 외삽으로 인한 왜곡 방지

3. **비즈니스 활용도 증가**
   - 월별/분기별 예산 계획 수립 가능
   - 요일별 패턴 분석으로 광고 스케줄 최적화

### 7.3 단점

1. **미래 트렌드 미반영**
   - 계절성 분석은 과거 패턴만 반영
   - 시장 변화, 신제품 출시 등 미반영

2. **과거 데이터 의존성**
   - 최소 1년 이상 데이터 필요
   - 과거에 없던 이벤트 예측 불가

3. **일관성 문제**
   - 요일별/월별: 과거 fitted
   - 일별: 과거 + 미래 혼합
   - 해석 시 주의 필요

### 7.4 적용 가이드라인

```python
# 적용 권장 상황
if (trend == 'declining' and forecast_days > 90) or purpose == 'seasonality_analysis':
    use_hybrid_approach = True

# 적용 비권장 상황
if (trend == 'stable' or trend == 'growing') and purpose == 'future_forecast':
    use_hybrid_approach = False
```

### 7.5 다른 예측 파일에 적용 여부

| 파일명 | 현재 방식 | 하이브리드 적용 | 권장 |
|--------|----------|----------------|------|
| prophet_forecast_overall.csv | 미래 30일 예측 | 불필요 | 현재 유지 |
| prophet_forecast_by_category.csv | 미래 30일 예측 | 불필요 | 현재 유지 |
| prophet_forecast_by_brand.csv | 미래 30일 예측 | 불필요 | 현재 유지 |
| **prophet_forecast_by_seasonality.csv** | **하이브리드** | **적용됨** | 현재 유지 |

**이유**: 다른 예측 파일은 30일 단기 예측이므로 음수 발생 가능성이 낮고, 미래 예측이 주 목적입니다.

---

## 8. 트러블슈팅

### 문제: 특정 월(3-4월 등)이 0으로 나옴

**원인**: 미래 예측만 사용 + 하락 추세 + clip(0)

**해결**: 하이브리드 접근법 적용 (현재 적용됨)
```python
# 월별/분기별/요일별: 과거 fitted 값 사용
monthly_forecast = history_df.groupby('월').agg({...})
```

### 문제: 예측값이 전체적으로 0

**원인**: 데이터 전체가 음수로 예측되어 클리핑됨

**해결**:
1. 하이브리드 접근법 적용
2. 학습 기간 단축 (365일 → 180일)
3. `changepoint_prior_scale` 값 조정

### 문제: ROAS/CPA가 비정상적으로 높음

**원인**: 비용이 0에 가깝게 예측되어 나눗셈 오류

**해결**:
```python
# 0 나눗셈 방지
result['예측_ROAS'] = (result['예측_전환값'] / result['예측_비용'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
result['예측_CPA'] = (result['예측_비용'] / result['예측_전환수']).replace([np.inf, -np.inf], 0).fillna(0)
```

### 문제: 유형구분별 예측 실패

**원인**: 해당 유형구분의 데이터가 30일 미만

**해결**:
```python
if len(cat_daily) < 30:
    print(f"[{category}]: 데이터 부족 (30일 미만)")
    continue
```

---

## 9. 향후 개선 방향

### 9.1 외부 변수(Regressor) 추가

```python
model = Prophet()
model.add_regressor('holiday_effect')  # 공휴일 효과
model.add_regressor('promotion')       # 프로모션 기간
model.fit(prophet_df)
```

### 9.2 한국 공휴일 적용

```python
from prophet import Prophet
from prophet.make_holidays import make_holidays_df

# 한국 공휴일
model = Prophet(holidays=make_holidays_df(year_list=[2024, 2025], country='KR'))
```

### 9.3 Cross-Validation 적용

```python
from prophet.diagnostics import cross_validation, performance_metrics

df_cv = cross_validation(model, initial='180 days', period='30 days', horizon='30 days')
df_p = performance_metrics(df_cv)
print(df_p[['horizon', 'mape', 'rmse']])
```

### 9.4 Logistic Growth로 음수 원천 방지

```python
model = Prophet(growth='logistic')
prophet_df['floor'] = 0  # 최소값 0
prophet_df['cap'] = prophet_df['y'].max() * 1.5  # 상한선
```

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2025-11-27 | 음수 예측값 클리핑 (.clip(lower=0)) 추가 |
| 2025-11-27 | prophet_seasonality.csv → prophet_forecast_by_seasonality.csv 파일명 변경 |
| 2025-11-27 | 365일 Prophet 예측 기반 계절성 분석 구현 |
| 2025-11-27 | **하이브리드 접근법 적용**: 계절성 분석에 과거 fitted 값 사용, 일별은 과거 365일 + 미래 90일 결합 |
| 2025-11-27 | 3-4월 등 특정 월 0값 문제 해결 |
| 2025-11-27 | 다른 Prophet 알고리즘 적용 시 장단점 문서화 |
