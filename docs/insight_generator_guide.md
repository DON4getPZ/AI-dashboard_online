# insight_generator.py 상세 가이드

> Prophet 예측 기반 마케팅 인사이트 생성 클래스

## 개요

| 항목 | 내용 |
|-----|------|
| **파일 위치** | `scripts/insight_generator.py` |
| **출력 파일** | `data/forecast/insights.json` |
| **코드 라인** | 약 820줄 |
| **클래스** | `InsightGenerator` |
| **의존성** | pandas, numpy, segment_processor.py |

---

## 입력 데이터 구조

### 세그먼트 예측 파일
```
data/forecast/
├── segment_brand.csv       # 브랜드별 예측
├── segment_channel.csv     # 채널별 예측
├── segment_product.csv     # 상품별 예측
├── segment_promotion.csv   # 프로모션별 예측
└── segment_stats.json      # 세그먼트 통계
```

### 일별 예측 파일
```
data/forecast/
├── predictions_daily.csv   # 일별 예측 (필수)
├── predictions_weekly.csv  # 주별 예측 (선택)
└── predictions_monthly.csv # 월별 예측 (선택)
```

### 필수 컬럼
| 파일 | 필수 컬럼 |
|-----|----------|
| segment_*.csv | `일 구분`, `type`, `비용_예측`, `전환수_예측`, `전환값_예측`, 세그먼트 컬럼 |
| predictions_daily.csv | `일 구분`, `type`, `비용_예측`, `전환수_예측`, `전환값_예측` |

---

## 클래스 구조

### InsightGenerator 클래스
```python
class InsightGenerator:
    def __init__(self)           # 초기화 및 임계값 설정
    def load_data()              # 데이터 로드
    def analyze_forecasts()      # 예측 분석
    def analyze_overall()        # 전체 성과 분석
    def analyze_performance_trends()  # 7일/30일 트렌드
    def detect_alerts()          # 경고 감지
    def generate_recommendations()    # 투자 권장 생성
    def generate_summary()       # 자연어 요약 생성
    def save_insights()          # JSON 저장
    def generate()               # 전체 실행
```

---

## 핵심 설정값 (커스터마이징 필수)

### 1. 임계값 설정 (라인 62-68)

```python
self.thresholds = {
    'decline_alert_pct': 10,   # KPI 하락 경고 기준 (%)
    'efficiency_top_pct': 20,  # 상위 효율 세그먼트 기준 (%)
    'growth_threshold': 0,     # 성장 판단 기준
    'stability_cv': 0.3        # 변동계수 안정성 기준
}
```

**수정 예시:**
```python
# 더 민감한 경고
self.thresholds = {
    'decline_alert_pct': 5,    # 5% 하락 시 경고
    'efficiency_top_pct': 10,  # 상위 10%
    'growth_threshold': 5,     # 5% 이상 성장
    'stability_cv': 0.2        # 더 엄격한 안정성
}
```

### 2. 월 예산 설정 (라인 294)

```python
monthly_budget = 20000000  # 2천만원
```

**수정 예시:**
```python
monthly_budget = 50000000  # 5천만원으로 변경
```

---

## 분석 모듈별 상세

### 1. 전체 성과 분석 - analyze_overall() (라인 190-350)

**분석 내용:**
- 현재 기간 집계 (actual)
- 예측 기간 집계 (forecast)
- 트렌드 방향 판단
- 예산 소진율 알림
- 일별 실제 vs 예측 비교

**출력 구조:**
```json
{
  "overall": {
    "current_period": {
      "start_date": "2024-11-01",
      "end_date": "2024-11-28",
      "total_cost": 45000000,
      "total_conversions": 1200,
      "total_revenue": 67500000,
      "total_clicks": 50000,
      "total_impressions": 1000000,
      "roas": 150.0,
      "avg_cpa": 37500,
      "cvr": 2.4,
      "ctr": 5.0
    },
    "forecast_period": {
      "start_date": "2024-11-29",
      "end_date": "2024-12-28",
      "total_cost": 48000000,
      "total_conversions": 1350,
      "total_revenue": 74250000,
      "roas": 154.7,
      "avg_cpa": 35555
    },
    "trend": {
      "roas_change": 4.7,
      "conversion_change": 12.5,
      "direction": "improving"  // improving / declining / stable
    },
    "alerts": [
      {
        "type": "budget_alert",
        "severity": "medium",
        "message": "월 예산 대비 85.0% 소진 (2024-11-28 기준)"
      }
    ],
    "daily_comparison": {
      "date": "2024-11-28",
      "actual": { "cost": 1500000, "conversions": 45, "revenue": 2250000 },
      "forecast": { "cost": 1600000, "conversions": 48, "revenue": 2400000 },
      "accuracy": 93.8
    }
  }
}
```

**트렌드 방향 기준 (라인 283):**
```python
'direction': 'improving' if roas_change > 0 else 'declining' if roas_change < -1 else 'stable'
```

**수정 예시:**
```python
# 더 민감한 트렌드 판단
'direction': 'improving' if roas_change > 2 else 'declining' if roas_change < -2 else 'stable'
```

**예산 알림 기준 (라인 297-308):**
```python
if budget_used_pct > 90:
    severity = 'high'
elif budget_used_pct > 75:
    severity = 'medium'
```

**수정 예시:**
```python
# 더 일찍 경고
if budget_used_pct > 80:
    severity = 'high'
elif budget_used_pct > 60:
    severity = 'medium'
```

---

### 2. 성과 트렌드 분석 - analyze_performance_trends() (라인 351-519)

**비교 기간:**
| 기간 | 최근 | 이전 | 최소 데이터 |
|-----|------|------|-----------|
| 7일 | 최근 7일 | 그 전 7일 | 14일 |
| 30일 | 최근 30일 | 그 전 30일 | 60일 |

**분석 지표:**
- 비용 (`비용_예측`)
- 전환수 (`전환수_예측`)
- 전환값 (`전환값_예측`)
- ROAS (계산)

**개선/하락 판단 기준 (라인 395-443):**
```python
# 20% 이상 증가 → 개선
if change_pct > 20:
    improvement_level = 'high' if change_pct > 30 else 'medium'

# 20% 이상 감소 → 하락
elif change_pct < -20:
    risk_level = 'high' if change_pct < -30 else 'medium'
```

**수정 예시:**
```python
# 더 민감하게 (10% 기준)
if change_pct > 10:
    improvement_level = 'high' if change_pct > 20 else 'medium'
elif change_pct < -10:
    risk_level = 'high' if change_pct < -20 else 'medium'
```

**출력 구조:**
```json
{
  "performance_trends": {
    "improvements_7d": [
      {
        "metric": "전환수",
        "period": "7d",
        "improvement_level": "high",
        "change_pct": 35.5,
        "recent_avg": 48.5,
        "previous_avg": 35.8,
        "recommendation": "전환수이(가) 개선되고 있습니다. 현재 전략을 유지하고 확대하세요."
      }
    ],
    "improvements_30d": [...],
    "declines_7d": [
      {
        "metric": "ROAS",
        "period": "7d",
        "risk_level": "medium",
        "change_pct": -22.3,
        "recent_avg": 145.2,
        "previous_avg": 186.8,
        "recommendation": "ROAS가 하락하고 있습니다. 광고 효율성 점검이 필요합니다."
      }
    ],
    "declines_30d": [...]
  }
}
```

**추천 메시지 변경 (라인 403, 413 등):**
```python
# 현재
'recommendation': f'{metric_name}이(가) 개선되고 있습니다. 현재 전략을 유지하고 확대하세요.'

# 변경 예시
'recommendation': f'{metric_name} 성과가 {change_pct:.1f}% 상승했습니다. 예산 증액을 검토하세요.'
```

---

### 3. 경고 감지 - detect_alerts() (라인 521-570)

**경고 타입:**
| 타입 | 설명 |
|-----|------|
| `conversion_decline` | 전환수 하락 예측 |
| `revenue_decline` | 전환값 하락 예측 |
| `roas_decline` | ROAS 하락 예측 |

**경고 생성 기준 (라인 532-563):**
```python
# 전환수 하락 (라인 532)
if changes.get('전환수', 0) < -self.thresholds['decline_alert_pct']:
    severity = 'high' if changes['전환수'] < -20 else 'medium'

# 전환값 하락 (라인 543)
if changes.get('전환값', 0) < -self.thresholds['decline_alert_pct']:
    severity = 'high' if changes['전환값'] < -20 else 'medium'

# ROAS 하락 (라인 554)
if roas_change < -self.thresholds['decline_alert_pct']:
    severity = 'high' if roas_change < -20 else 'medium'
```

**출력 구조:**
```json
{
  "segments": {
    "alerts": [
      {
        "type": "conversion_decline",
        "segment_type": "brand",
        "segment_value": "브랜드A",
        "metric": "전환수",
        "change_pct": -15.3,
        "severity": "medium"
      }
    ]
  }
}
```

---

### 4. 투자 권장 - generate_recommendations() (라인 572-644)

**권장 기준:**
1. ROAS 상위 세그먼트 우선
2. 예측 트렌드 반영
3. 안정성 고려

**액션 결정 로직 (라인 614-622):**
```python
if changes.get('전환수', 0) >= 0 and segment_stats_data['roas'] > 100:
    action = '예산 20% 증액'
    expected_impact = '전환수 15-20% 증가 예상'
elif segment_stats_data['roas'] > 200:
    action = '예산 30% 증액'
    expected_impact = '전환값 25-30% 증가 예상'
else:
    action = '예산 유지 및 모니터링'
    expected_impact = '현 성과 유지'
```

**수정 예시:**
```python
# 더 공격적인 투자 권장
if changes.get('전환수', 0) >= 0 and segment_stats_data['roas'] > 150:
    action = '예산 30% 증액'
    expected_impact = '전환수 20-25% 증가 예상'
elif segment_stats_data['roas'] > 300:
    action = '예산 50% 증액'
    expected_impact = '전환값 40-50% 증가 예상'
else:
    action = '예산 10% 증액 후 모니터링'
    expected_impact = '소폭 성과 개선'
```

**출력 구조:**
```json
{
  "segments": {
    "recommendations": [
      {
        "priority": 1,
        "action": "예산 30% 증액",
        "target": {
          "type": "channel",
          "value": "네이버"
        },
        "reasons": [
          "ROAS 250%로 높은 효율",
          "CVR 3.5%",
          "전환수 12% 증가 예상"
        ],
        "expected_impact": "전환값 25-30% 증가 예상",
        "metrics": {
          "roas": 250.0,
          "cvr": 3.5,
          "cpa": 28000
        }
      }
    ]
  }
}
```

---

### 5. 자연어 요약 - generate_summary() (라인 646-730)

**요약 구성요소:**
1. 전체 성과 (기간, ROAS, 전환수, 전환값)
2. 트렌드 방향 (개선/하락/안정)
3. 주요 알림 (예산, 성과 하락)
4. 핵심 권장 (최우선 액션)

**출력 예시:**
```
📊 전체 성과 (2024-11-01 ~ 2024-11-28): ROAS 150%, 전환수 1200, 전환값 67,500,000원
📈 트렌드: ROAS +4.7%p 개선 예상

🚨 주의: brand '브랜드A'의 전환수이(가) 15.3% 하락할 것으로 예측됩니다.

💡 권장: channel '네이버'에 예산 30% 증액을 권장합니다. (ROAS 250%로 높은 효율, CVR 3.5%)
   예상 효과: 전환값 25-30% 증가 예상

🔍 추가 검토 대상: 카카오, 구글
```

---

## 출력 JSON 전체 구조

```json
{
  "generated_at": "2024-11-28T10:00:00",
  "overall": {
    "current_period": { ... },
    "forecast_period": { ... },
    "trend": { ... },
    "alerts": [...],
    "daily_comparison": { ... }
  },
  "segments": {
    "alerts": [...],
    "recommendations": [...]
  },
  "performance_trends": {
    "improvements_7d": [...],
    "improvements_30d": [...],
    "declines_7d": [...],
    "declines_30d": [...]
  },
  "summary": "📊 전체 성과...",
  "details": {
    "total_segment_alerts": 5,
    "high_severity_alerts": 2,
    "total_overall_alerts": 1,
    "total_recommendations": 4,
    "analyzed_segments": {
      "brand": 10,
      "channel": 5,
      "product": 20,
      "promotion": 8
    },
    "overall_roas": 150.0,
    "forecast_roas": 154.7
  }
}
```

---

## 자주 사용하는 수정 예시

### 1. 새로운 세그먼트 타입 추가
```python
# 라인 579 - 세그먼트 목록에 추가
for segment_name in ['channel', 'product', 'brand', 'promotion', 'device']:  # device 추가
```

### 2. 추가 KPI 계산
```python
# analyze_overall() 내에 추가
current_period['arpu'] = round(
    current_period['total_revenue'] / current_period['total_conversions'], 2
) if current_period['total_conversions'] > 0 else 0
```

### 3. 사용자 정의 알림 추가
```python
# detect_alerts() 마지막에 추가
# CPA 상승 알림
if segment_stats_data['cpa'] > overall_avg_cpa * 1.5:
    alerts.append({
        'type': 'high_cpa',
        'segment_type': segment_name,
        'segment_value': segment_value,
        'metric': 'CPA',
        'value': segment_stats_data['cpa'],
        'severity': 'medium'
    })
```

### 4. 요약 메시지 커스터마이징
```python
# generate_summary() 내 수정
summary_parts.append(
    f"🎯 핵심 지표: ROAS {current['roas']}% | CPA {current['avg_cpa']:,}원 | CVR {current['cvr']}%"
)
```

---

## 실행 및 테스트

```bash
# 선행 작업 필수
python scripts/segment_processor.py

# 실행
python scripts/insight_generator.py

# 출력 확인
cat data/forecast/insights.json | python -m json.tool
```

**로그 출력 예시:**
```
============================================================
Insight Generator v1.0
============================================================

[1/5] Loading segment data...
   Loaded: segment_brand.csv
   Loaded: segment_channel.csv
   Loaded: segment_product.csv
   Loaded: segment_promotion.csv
   Loaded: segment_stats.json
   Loaded: predictions_daily.csv

[2/5] Analyzing forecasts...
   Analyzed 10 brand segments
   Analyzed 5 channel segments
   Analyzed 20 product segments
   Analyzed 8 promotion segments

[2.5/5] Analyzing overall performance...
   Current period: 2024-11-01 ~ 2024-11-28
   Total conversions: 1200
   ROAS: 150.0%

[2.7/5] Analyzing performance trends (7d/30d)...
   7-day improvements: 2, declines: 1
   30-day improvements: 1, declines: 0

[3/5] Detecting alerts...
   Detected 3 segment alerts
      - brand/브랜드A: 전환수 -15.3%
      - product/상품B: ROAS -12.5%
      - channel/구글: 전환값 -18.2%

[4/5] Generating recommendations...
   Generated 4 segment recommendations
      - channel/네이버: 예산 30% 증액
      - brand/브랜드B: 예산 20% 증액
      - product/상품A: 예산 유지 및 모니터링
      - promotion/이벤트1: 예산 20% 증액

[5/5] Generating natural language summary...

   Summary:
      📊 전체 성과 (2024-11-01 ~ 2024-11-28): ROAS 150%, 전환수 1200, 전환값 67,500,000원
      📈 트렌드: ROAS +4.7%p 개선 예상
      ...

   Saved: insights.json

============================================================
Insight generation completed successfully!
============================================================
```
