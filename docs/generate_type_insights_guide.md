# generate_type_insights.py 상세 가이드

> Type 분석 기반 마케팅 인사이트 생성 스크립트

## 개요

| 항목 | 내용 |
|-----|------|
| **파일 위치** | `scripts/generate_type_insights.py` |
| **출력 파일** | `data/type/insights.json` |
| **코드 라인** | 약 2,300줄 |
| **의존성** | pandas, numpy |

---

## 입력 데이터 구조

### 필수 파일
```
data/type/
├── analysis_category_summary.csv    # 유형구분별 집계
├── analysis_daily_summary.csv       # 일별 집계
├── dimension_type1_campaign_adset.csv
├── dimension_type2_adset_age_gender.csv
├── dimension_type3_adset_age.csv
├── dimension_type4_adset_gender.csv
├── dimension_type5_adset_device.csv
├── dimension_type6_adset_platform.csv
└── dimension_type7_adset_deviceplatform.csv
```

### Prophet 예측 파일 (선택)
```
data/type/
├── prophet_forecast_overall.csv
├── prophet_forecast_by_category.csv
├── prophet_forecast_by_brand.csv
├── prophet_forecast_by_product.csv
├── prophet_forecast_by_gender.csv
├── prophet_forecast_by_age.csv
├── prophet_forecast_by_platform.csv
├── prophet_forecast_by_device.csv
├── prophet_forecast_by_promotion.csv
├── prophet_forecast_by_age_gender.csv
└── prophet_forecast_by_seasonality.csv
```

---

## 분석 모듈별 상세

### 1. 전체 요약 (라인 162-184)

**출력 예시:**
```json
{
  "summary": {
    "total_cost": 50000000,
    "total_conversions": 1500,
    "total_revenue": 75000000,
    "overall_roas": 150.0,
    "overall_cpa": 33333.33,
    "analysis_period": {
      "start_date": "2024-11-01",
      "end_date": "2024-11-30",
      "total_days": 30
    }
  }
}
```

**커스터마이징:**
- KPI 추가 시 `summary` 딕셔너리에 새 키 추가

---

### 2. 성별 분석 (라인 207-259)

**성과 레벨 기준:**
| ROAS | 레벨 |
|------|------|
| > 5000% | 매우 우수 |
| > 1000% | 우수 |
| > 200% | 양호 |
| ≤ 200% | 개선 필요 |

**수정 위치:** 라인 242-249
```python
# 기준값 변경 예시
if roas_val > 3000:      # 5000 → 3000
    performance = "매우 우수"
elif roas_val > 500:     # 1000 → 500
    performance = "우수"
elif roas_val > 100:     # 200 → 100
    performance = "양호"
else:
    performance = "개선 필요"
```

---

### 3. 연령x성별 분석 (라인 284-319)

**출력 예시:**
```json
{
  "age_gender_insights": [
    {
      "adset": "캠페인A_30대여성",
      "age": "30-39",
      "gender": "여성",
      "roas": 850.5,
      "conversions": 120,
      "recommendation": "30-39 여성 타겟팅이 효과적입니다"
    }
  ]
}
```

**추천 메시지 변경:** 라인 318
```python
"recommendation": f"{row['연령_정규화']} {row['성별_정규화']} 타겟팅이 효과적입니다"
# 변경 예시
"recommendation": f"{row['연령_정규화']} {row['성별_정규화']} 세그먼트에 예산 집중 권장"
```

---

### 4. 시계열 트렌드 (라인 468-862)

**분석 종류:**
| 분석 | 출력 키 | 설명 |
|-----|---------|------|
| 월별 트렌드 | `monthly_trend` | 월별 KPI 추이 |
| 주별 트렌드 | `weekly_trend` | 최근 12주 추이 |
| 브랜드별 주별 | `brand_weekly_trend` | 브랜드별 8주 추이 |
| 상품별 주별 | `product_weekly_trend` | 상품별 8주 추이 |
| 성별 주별 | `gender_weekly_trend` | 성별 8주 추이 |
| 연령별 주별 | `age_weekly_trend` | 연령별 8주 추이 |

**트렌드 판단 기준:** 라인 517, 571, 611, 651, 756, 793
```python
# 현재 기준
"trend": "상승" if revenue_growth > 10 else "하락" if revenue_growth < -10 else "유지"

# 기준 변경 예시 (더 민감하게)
"trend": "상승" if revenue_growth > 5 else "하락" if revenue_growth < -5 else "유지"
```

---

### 5. Prophet 예측 인사이트 (라인 863-1119)

**예측 항목:**
- 전체 예측 (`forecast_summary`)
- 유형구분별 (`category_forecast_insights`)
- 브랜드별 (`brand_forecast_insights`)
- 상품별 (`product_forecast_insights`)
- 성별 (`gender_forecast_insights`)
- 연령별 (`age_forecast_insights`)
- 플랫폼별 (`platform_forecast_insights`)
- 기기유형별 (`device_forecast_insights`)
- 프로모션별 (`promotion_forecast_insights`)
- 연령x성별 (`age_gender_forecast_insights`)

**출력 예시:**
```json
{
  "prophet_forecast": {
    "summary": {
      "overall": {
        "forecast_period": {
          "start_date": "2024-12-01",
          "end_date": "2024-12-30"
        },
        "total_forecast_revenue": 80000000,
        "avg_daily_forecast": 2666666.67,
        "avg_forecast_roas": 155.5
      }
    },
    "by_brand": [
      {
        "brand": "브랜드A",
        "total_30day_forecast": 25000000,
        "avg_daily_forecast": 833333.33,
        "avg_forecast_roas": 180.0
      }
    ]
  }
}
```

---

### 6. 알림(Alerts) 생성 (라인 1364-1429)

**알림 타입:**
| 타입 | 설명 | 심각도 기준 |
|-----|------|------------|
| `roas_decline` | ROAS 하락 | 20% 하락 시 |
| `conversion_decline` | 전환수 하락 | 15% 하락 시 |
| `cpa_increase` | CPA 상승 | 20% 상승 시 |
| `cost_spike` | 비용 급증 | 30% 증가 시 |
| `performance_gap` | 성과 편차 | 최상위 대비 50% 미만 |

**알림 기준 변경:** 라인 1370-1429
```python
# ROAS 하락 알림 (라인 1370)
if roas_change < -20:  # -20% → 원하는 기준
    alerts.append({
        "type": "roas_decline",
        "severity": "high" if roas_change < -30 else "medium",
        ...
    })
```

**새 알림 추가 예시:**
```python
# CTR 하락 알림 추가
if ctr_change < -15:
    alerts.append({
        "type": "ctr_decline",
        "severity": "high" if ctr_change < -25 else "medium",
        "message": f"CTR이 전주 대비 {abs(ctr_change):.1f}% 하락했습니다.",
        "metric": "CTR",
        "change_pct": ctr_change
    })
```

---

### 7. 추천(Recommendations) 생성 (라인 1429-1500)

**추천 타입:**
| 타입 | 설명 | 조건 |
|-----|------|------|
| `target_optimization` | 타겟팅 최적화 | 최고 성과 성별/연령 |
| `budget_allocation` | 예산 배분 | ROAS 상위 브랜드 |
| `product_focus` | 상품 집중 | 전환률 상위 상품 |
| `promotion_strategy` | 프로모션 전략 | 효율 상위 프로모션 |

**추천 메시지 변경:** 라인 1440-1447
```python
recommendations.append({
    "type": "target_optimization",
    "priority": 1,
    "message": f"{best_gender['gender']} 타겟팅 강화 권장",
    "reason": f"ROAS {best_gender['roas']:.1f}%로 최고 효율",
    "expected_impact": "전환수 10-15% 증가 예상"  # 수정 가능
})
```

---

### 8. 요일별 계절성 분석 (라인 1503-1932)

**분석 지표:**
- 비용 계절성 (`cost_seasonality`)
- 클릭 계절성 (`clicks_seasonality`)
- 전환수 계절성 (`conversions_seasonality`)
- 전환값 계절성 (`revenue_seasonality`)
- ROAS 계절성 (`roas_seasonality`)
- CPA 계절성 (`cpa_seasonality`)
- 추천 요일 (`recommended_days`)

**출력 예시:**
```json
{
  "seasonality": {
    "revenue_seasonality": {
      "weekday_avg": {
        "월요일": 2500000,
        "화요일": 2800000,
        ...
      },
      "best_day": "화요일",
      "worst_day": "일요일",
      "weekday_vs_weekend": {
        "weekday_avg": 2700000,
        "weekend_avg": 1800000,
        "difference_pct": 50.0
      }
    },
    "recommended_days": {
      "for_cost_efficiency": "화요일",
      "for_conversions": "수요일",
      "for_revenue": "화요일",
      "for_roas": "목요일"
    }
  }
}
```

---

## 출력 JSON 전체 구조

```json
{
  "generated_at": "2024-11-28T10:00:00",
  "summary": { ... },
  "top_categories": [...],
  "top_adsets": [...],
  "gender_insights": [...],
  "age_gender_insights": [...],
  "device_insights": [...],
  "platform_insights": [...],
  "brand_performance": [...],
  "product_performance": [...],
  "promotion_performance": [...],
  "time_analysis": {
    "monthly_trend": [...],
    "monthly_growth": [...],
    "weekly_trend": [...],
    "weekly_growth": [...],
    "brand_weekly_trend": [...],
    "product_weekly_trend": [...],
    "gender_weekly_trend": [...],
    "age_weekly_trend": [...],
    "brand_monthly_trend": [...],
    "product_monthly_trend": [...]
  },
  "prophet_forecast": {
    "summary": { ... },
    "by_category": [...],
    "by_brand": [...],
    "by_product": [...],
    "by_gender": [...],
    "by_age": [...],
    "by_device": [...],
    "by_platform": [...],
    "by_promotion": [...],
    "by_age_gender": [...],
    "alerts": [...],
    "recommendations": [...]
  },
  "seasonality": { ... },
  "alerts": [...],
  "recommendations": [...],
  "metadata": { ... }
}
```

---

## 자주 사용하는 수정 예시

### 1. 새로운 KPI 추가
```python
# 라인 173 부근에 추가
summary = {
    ...
    "overall_cvr": float((total_conversions / total_clicks) * 100) if total_clicks > 0 else 0,
    "overall_ctr": float((total_clicks / total_impressions) * 100) if total_impressions > 0 else 0,
}
```

### 2. 분석 기간 변경
```python
# 주별 트렌드: 12주 → 8주
recent_weeks = weekly_summary.tail(8)  # 라인 543

# 브랜드별: 8주 → 4주
brand_data_recent = brand_data.tail(4)  # 라인 599
```

### 3. 상위 N개 제한 변경
```python
# 브랜드 상위 10개 → 15개
brand_summary = brand_summary.nlargest(15, 'ROAS')  # 라인 399

# 상품 상위 10개 → 20개
product_summary = product_summary.nlargest(20, 'ROAS')  # 라인 428
```

### 4. 알림 심각도 기준 조정
```python
# 라인 1372 - 더 민감하게
"severity": "high" if roas_change < -15 else "medium"  # -30 → -15
```

---

## 실행 및 테스트

```bash
# 실행
python scripts/generate_type_insights.py

# 출력 확인
cat data/type/insights.json | python -m json.tool | head -100
```

**로그 출력 예시:**
```
================================================================================
Type 분석 인사이트 생성
================================================================================
생성일: 2024-11-28 10:00:00

데이터 로딩 중...
✓ dimension_type1_campaign_adset.csv 로드 완료
✓ dimension_type2_adset_age_gender.csv 로드 완료
...

Prophet 예측 데이터 로딩 중...
✓ prophet_forecast_overall.csv 로드 완료
...

전체 요약 생성 중...
상위 유형구분 분석 중...
성별 인사이트 생성 중...
...

[인사이트 요약]
총 비용: 50,000,000원
총 전환: 1,500건
총 매출: 75,000,000원
평균 ROAS: 150.0%
알림: 3개
추천사항: 5개
```
