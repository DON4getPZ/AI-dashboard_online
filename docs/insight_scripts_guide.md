# 인사이트 생성 스크립트 가이드

> 마케터가 인사이트 로직을 쉽게 커스터마이징할 수 있도록 작성된 가이드

## 개요

| 스크립트 | 출력 파일 | 주요 용도 |
|---------|----------|----------|
| `generate_type_insights.py` | `data/type/insights.json` | 광고 Type 분석 (캠페인/광고세트/타겟팅) |
| `insight_generator.py` | `data/forecast/insights.json` | Prophet 예측 기반 세그먼트 분석 |
| `generate_funnel_data.py` | `data/funnel/insights.json` | AARRR 퍼널 분석 (GA4 기반) |

---

## 1. generate_type_insights.py

### 1.1 파일 위치 및 실행
```bash
python scripts/generate_type_insights.py
```

### 1.2 입력 데이터
| 파일명 | 설명 |
|-------|------|
| `analysis_category_summary.csv` | 유형구분별 성과 집계 |
| `analysis_daily_summary.csv` | 일별 성과 집계 |
| `dimension_type1_*.csv` ~ `dimension_type7_*.csv` | 차원별 세부 분석 |
| `prophet_forecast_*.csv` | Prophet 예측 결과 (11종) |

### 1.3 출력 JSON 구조
```json
{
  "summary": { ... },           // 전체 요약 (ROAS, CPA, 비용, 전환)
  "top_categories": [...],      // 상위 유형구분
  "gender_insights": [...],     // 성별 분석
  "age_gender_insights": [...], // 연령x성별 조합
  "device_insights": [...],     // 기기유형 분석
  "platform_insights": [...],   // 기기플랫폼 분석
  "brand_performance": [...],   // 브랜드별 성과
  "product_performance": [...], // 상품별 성과
  "promotion_performance": [...], // 프로모션별 성과
  "time_analysis": { ... },     // 시계열 분석 (월별/주별)
  "prophet_forecast": { ... },  // Prophet 예측 인사이트
  "alerts": [...],              // 경고 알림
  "recommendations": [...]      // 추천 액션
}
```

### 1.4 커스터마이징 포인트

#### A. 성과 레벨 기준 변경 (라인 242-249)
```python
# 현재 기준
if roas_val > 5000:
    performance = "매우 우수"
elif roas_val > 1000:
    performance = "우수"
elif roas_val > 200:
    performance = "양호"
else:
    performance = "개선 필요"
```
**수정 방법**: ROAS 임계값을 비즈니스에 맞게 조정

#### B. 알림 생성 기준 변경 (라인 1364-1429)
```python
# 예: ROAS 하락 알림 기준
if roas_change < -20:  # 20% 이상 하락 시 경고
    alerts.append({
        "type": "roas_decline",
        "severity": "high",
        ...
    })
```
**수정 방법**: `-20`을 원하는 하락 기준(%)으로 변경

#### C. 추천 액션 로직 변경 (라인 1429-1500)
```python
# 예: 최고 성과 성별 추천
if len(gender_insights) > 0:
    best_gender = max(gender_insights, key=lambda x: x['roas'])
    recommendations.append({
        "type": "target_optimization",
        "priority": 1,
        "message": f"{best_gender['gender']} 타겟팅 강화 권장",
        ...
    })
```

#### D. Prophet 예측 기반 알림 기준 (라인 1121-1145)
```python
# 실제 vs 예측 성과 비교
performance_ratio = (recent_7days_actual / forecast_7days - 1) * 100
if performance_ratio > 20:  # 예측 대비 20% 초과 달성
    prophet_alerts.append({...})
elif performance_ratio < -20:  # 예측 대비 20% 미달
    prophet_alerts.append({...})
```

---

## 2. insight_generator.py

### 2.1 파일 위치 및 실행
```bash
python scripts/insight_generator.py
```

### 2.2 입력 데이터
| 파일명 | 설명 |
|-------|------|
| `segment_brand.csv` | 브랜드별 예측 |
| `segment_channel.csv` | 채널별 예측 |
| `segment_product.csv` | 상품별 예측 |
| `segment_promotion.csv` | 프로모션별 예측 |
| `segment_stats.json` | 세그먼트 통계 |
| `predictions_daily.csv` | 일별 예측 |

### 2.3 출력 JSON 구조
```json
{
  "generated_at": "2024-...",
  "overall": {
    "current_period": { ... },   // 현재 기간 성과
    "forecast_period": { ... },  // 예측 기간 성과
    "trend": { ... },            // 트렌드 방향
    "alerts": [...]              // 전체 알림
  },
  "segments": {
    "alerts": [...],             // 세그먼트별 경고
    "recommendations": [...]     // 투자 권장
  },
  "performance_trends": {
    "improvements_7d": [...],    // 7일 개선
    "improvements_30d": [...],   // 30일 개선
    "declines_7d": [...],        // 7일 하락
    "declines_30d": [...]        // 30일 하락
  },
  "summary": "...",              // 자연어 요약
  "details": { ... }             // 메타데이터
}
```

### 2.4 커스터마이징 포인트

#### A. 임계값 설정 (라인 62-68)
```python
self.thresholds = {
    'decline_alert_pct': 10,   # 10% 이상 하락 시 경고
    'efficiency_top_pct': 20,  # 상위 20% 효율
    'growth_threshold': 0,     # 성장률 임계값
    'stability_cv': 0.3        # 변동계수 임계값
}
```
**수정 방법**: 각 값을 비즈니스 기준에 맞게 조정

#### B. 예산 알림 기준 (라인 293-308)
```python
# 월 예산 설정
monthly_budget = 20000000  # 2천만원

# 알림 기준
if budget_used_pct > 90:
    severity = 'high'
elif budget_used_pct > 75:
    severity = 'medium'
```
**수정 방법**: `monthly_budget` 값과 경고 기준(%) 조정

#### C. 트렌드 분석 기간 (라인 351-520)
```python
# 7일 비교
recent_7d = actual.tail(7)
previous_7d = actual.iloc[-14:-7]

# 30일 비교
recent_30d = actual.tail(30)
previous_30d = actual.iloc[-60:-30]
```
**수정 방법**: 비교 기간 일수 변경

#### D. 투자 권장 액션 로직 (라인 614-622)
```python
if changes.get('전환수', 0) >= 0 and segment_stats_data['roas'] > 100:
    action = '예산 20% 증액'
    expected_impact = '전환수 15-20% 증가 예상'
elif segment_stats_data['roas'] > 200:
    action = '예산 30% 증액'
    expected_impact = '전환값 25-30% 증가 예상'
else:
    action = '예산 유지 및 모니터링'
```
**수정 방법**: ROAS 기준값과 예산 증액 비율 조정

---

## 3. generate_funnel_data.py

### 3.1 파일 위치 및 실행
```bash
python scripts/generate_funnel_data.py
```

### 3.2 입력 데이터
| 파일명 | 설명 |
|-------|------|
| `data/GA4/2025-11.csv` | GA4 퍼널 이벤트 데이터 |

### 3.3 퍼널 단계 정의 (라인 23-29)
```python
FUNNEL_MAPPING = {
    '유입': 'Acquisition',      # 방문
    '활동': 'Activation',       # 활성화
    '관심': 'Consideration',    # 장바구니
    '결제진행': 'Conversion',   # 결제 시도
    '구매완료': 'Purchase'      # 구매 완료
}
```

### 3.4 출력 JSON 구조
```json
{
  "generated_at": "2024-...",
  "summary": {
    "total_acquisition": 10000,
    "total_activation": 5000,
    "total_consideration": 2000,
    "total_conversion": 500,
    "total_purchase": 300,
    "total_revenue": 15000000,
    "overall_cvr": 3.0
  },
  "overall": { ... },
  "top_channels": [...],
  "top_campaigns": [...],
  "alerts": [...],
  "ab_test_results": [...],      // 카이제곱 검정 결과
  "channel_clusters": {...},     // K-Means 클러스터링
  "churn_predictions_7d": [...], // 7일 이탈 예측
  "churn_predictions_30d": [...],// 30일 이탈 예측
  "improvement_predictions_7d": [...],  // 7일 개선
  "improvement_predictions_30d": [...], // 30일 개선
  "details": { ... }
}
```

### 3.5 커스터마이징 포인트

#### A. 퍼널 이탈 경고 기준 (라인 208-224)
```python
# 유입→활동 전환율 경고
if activation_rate < 50:  # 50% 미만일 때 경고
    alerts.append({
        'type': 'low_activation',
        'severity': 'high',
        ...
    })

# 관심→구매 전환율 경고
if purchase_from_consideration < 20:  # 20% 미만일 때 경고
    alerts.append({
        'type': 'low_consideration_conversion',
        'severity': 'medium',
        ...
    })
```
**수정 방법**: 전환율 기준(%) 조정

#### B. A/B 테스트 유의수준 (라인 282)
```python
'significant': bool(float(p_value) < 0.05)  # p-value 0.05 기준
```
**수정 방법**: `0.05`를 `0.01`(더 엄격) 또는 `0.10`(더 관대)으로 변경

#### C. K-Means 클러스터 수 (라인 318)
```python
n_clusters = min(3, len(channel_names))  # 3개 클러스터
```
**수정 방법**: `3`을 원하는 클러스터 수로 변경

#### D. 이탈/개선 판단 기준 (라인 363-416)
```python
# 20% 이상 감소 → 이탈 위험
if change_pct < -20:
    risk_level = 'high' if change_pct < -30 else 'medium'

# 20% 이상 증가 → 성과 개선
elif change_pct > 20:
    improvement_level = 'high' if change_pct > 30 else 'medium'
```
**수정 방법**: `-20`, `-30`, `20`, `30` 기준값 조정

---

## 공통 수정 가이드

### JSON 출력 필드 추가하기
```python
# 기존 insights 딕셔너리에 새 필드 추가
insights['new_section'] = {
    'custom_metric': calculated_value,
    'custom_list': [...]
}
```

### 새로운 알림 타입 추가하기
```python
alerts.append({
    'type': 'custom_alert_type',    # 알림 식별자
    'severity': 'high',              # high / medium / low
    'message': '알림 메시지',
    'value': metric_value,           # 관련 수치
    'recommendation': '권장 액션'
})
```

### 새로운 추천 액션 추가하기
```python
recommendations.append({
    'type': 'custom_recommendation',
    'priority': 1,                   # 1 = 최우선
    'target': {
        'type': 'segment_type',
        'value': 'segment_value'
    },
    'action': '권장 액션',
    'expected_impact': '예상 효과',
    'reasons': ['이유1', '이유2']
})
```

---

## 실행 순서

```bash
# 1. 데이터 전처리 (Type 분석 기반)
python scripts/multi_analysis_dimension_detail.py
python scripts/multi_analysis_prophet_forecast.py

# 2. 인사이트 생성
python scripts/generate_type_insights.py      # Type 분석 인사이트
python scripts/segment_processor.py           # 세그먼트 처리
python scripts/insight_generator.py           # 예측 기반 인사이트
python scripts/generate_funnel_data.py        # 퍼널 인사이트
```

---

## 문의 및 참고

- **데이터 매핑 가이드**: `docs/data_mapping_guide.md`
- **Prophet 예측 로직**: `scripts/multi_analysis_prophet_forecast.py`
- **세그먼트 처리**: `scripts/segment_processor.py`
