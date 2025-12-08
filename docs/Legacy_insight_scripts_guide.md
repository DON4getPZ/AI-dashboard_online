# 인사이트 생성 스크립트 가이드

> 마케터가 인사이트 로직을 쉽게 커스터마이징할 수 있도록 작성된 가이드

---

## 📋 목차

### 개요
- [개요](#개요)

### 스크립트별 가이드
- [1. generate_type_insights.py](#1-generate_type_insightspy)
  - [1.1 파일 위치 및 실행](#11-파일-위치-및-실행)
  - [1.2 입력 데이터](#12-입력-데이터)
  - [1.3 출력 JSON 구조](#13-출력-json-구조)
  - [1.4 커스터마이징 포인트](#14-커스터마이징-포인트)
- [2. insight_generator.py](#2-insight_generatorpy)
  - [2.1 파일 위치 및 실행](#21-파일-위치-및-실행)
  - [2.2 입력 데이터](#22-입력-데이터)
  - [2.3 출력 JSON 구조](#23-출력-json-구조)
  - [2.4 커스터마이징 포인트](#24-커스터마이징-포인트)
- [3. generate_funnel_data.py](#3-generate_funnel_datapy)
  - [3.1 파일 위치 및 실행](#31-파일-위치-및-실행)
  - [3.2 입력 데이터](#32-입력-데이터)
  - [3.3 퍼널 단계 정의](#33-퍼널-단계-정의)
  - [3.4 출력 JSON 구조](#34-출력-json-구조)
  - [3.5 커스터마이징 포인트](#35-커스터마이징-포인트)

### 공통 가이드
- [공통 수정 가이드](#공통-수정-가이드)
- [실행 순서](#실행-순서)
- [문의 및 참고](#문의-및-참고)

### 자연어 인사이트 생성 체계
- [4. 자연어 인사이트 생성 체계](#4-자연어-인사이트-생성-체계)
  - [4.1 AI 비서 톤앤매너](#41-ai-비서-톤앤매너)
  - [4.2 메시지 템플릿 구조](#42-메시지-템플릿-구조)
  - [4.3 페르소나 기반 액션 가이드](#43-페르소나-기반-액션-가이드)
  - [4.4 인사이트 유형별 JSON 구조](#44-인사이트-유형별-json-구조)
  - [4.5 MCP 통합 활용 가이드](#45-mcp-통합-활용-가이드)

---

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

---

## 4. 자연어 인사이트 생성 체계

> MCP(Model Context Protocol)를 활용해 외부 컨텍스트와 조합하여 사용자 친화적인 분석 결과를 제공하기 위한 가이드

### 4.1 AI 비서 톤앤매너

모든 스크립트는 **친화적인 AI 마케팅 컨설턴트** 톤을 사용합니다.

#### 핵심 원칙
| 원칙 | 설명 | 예시 |
|-----|------|------|
| **친근한 제목** | 이모지 + 직관적 메시지 | "🎯 우리 브랜드의 찐팬은 '30대 여성'입니다!" |
| **구체적 수치** | 모든 메시지에 정량 데이터 포함 | "ROAS가 850%로 압도적입니다" |
| **즉시 실행 가능한 액션** | 추상적 조언 대신 구체적 행동 | "이번 주 예산의 70%를 집중하세요" |
| **맥락 기반 진단** | 원인 추론 + 해결책 제시 | "광고 문구와 랜딩페이지가 달라서 실망했을 확률 90%!" |

#### 심각도(Severity) 분류
```python
severity_levels = {
    'positive': '긍정적 성과 (파란색/초록색)',      # 📈 성장, 달성
    'opportunity': '기회 발견 (주황색)',            # 💎 숨은 보석, 투자 대상
    'warning': '주의 필요 (노란색)',                # ⚠️ 하락 추세, 효율 저하
    'high': '긴급 조치 필요 (빨간색)'               # 🚨 매출 급락, 예산 초과
}
```

### 4.2 메시지 템플릿 구조

#### generate_type_insights.py - 광고 성과 메시지

```python
# FRIENDLY_MESSAGES 딕셔너리 (라인 102-153)
FRIENDLY_MESSAGES = {
    'high_roas_opportunity': {
        'title': "🎯 우리 브랜드의 찐팬은 '{target}' 입니다!",
        'message': "{target}의 ROAS가 {roas:.0f}%로 압도적입니다.",
        'action': "이번 주 광고 예산의 70%를 {target} 타겟에 집중해보세요."
    },
    'low_roas_warning': {
        'title': "⚠️ '{target}' 캠페인 점검이 필요해요",
        'message': "{target}의 ROAS가 {roas:.0f}%로 낮습니다.",
        'action': "소재를 교체하거나, 타겟팅을 좁혀보세요."
    },
    'gender_opportunity': {
        'title': "🎯 {gender} 고객이 열광하고 있어요!",
        'message': "{gender} 타겟팅의 ROAS가 {roas:.0f}%로 우수합니다.",
        'action': "{gender} 대상 광고 비중을 높이세요."
    },
    'revenue_growth': {
        'title': "📈 매출이 쑥쑥 오르고 있어요!",
        'message': "최근 30일 매출이 이전 대비 {change:.1f}% 증가했습니다!",
        'action': "현재 전략을 유지하면서 성과 요인을 분석해보세요."
    },
    'brand_opportunity': {
        'title': "⭐ '{brand}' 브랜드가 대세예요!",
        'message': "{brand} 브랜드의 ROAS가 {roas:.0f}%로 가장 높습니다.",
        'action': "해당 브랜드 광고 비중을 확대하세요."
    },
    'product_opportunity': {
        'title': "🚀 라이징 스타: '{product}'",
        'message': "{product} 상품의 ROAS가 {roas:.0f}%로 가장 효율적입니다.",
        'action': "이 상품을 메인 배너 가장 잘 보이는 곳에 배치하세요."
    },
    'forecast_positive': {
        'title': "🔮 다음 30일, 맑음이 예상됩니다!",
        'message': "AI가 분석한 결과, 약 {forecast}의 매출이 예상됩니다.",
        'action': "재고 부족이 발생하지 않도록 미리 물류를 점검해주세요."
    }
}
```

#### insight_generator.py - 예측 기반 메시지

```python
# ACTION_GUIDES 딕셔너리 (라인 77-85)
ACTION_GUIDES = {
    'roas_decline': "경쟁사 입찰 단가(CPC)가 상승했거나, 광고 소재의 피로도가 높아졌을 수 있습니다. 소재를 교체하거나 제외 타겟을 설정해보세요.",
    'conversion_drop': "유입은 되는데 구매를 안 하네요. 상세페이지 로딩 속도나 품절 옵션을 체크하고, 장바구니 리타겟팅을 강화하세요.",
    'cost_surge': "지출이 급증하고 있습니다. 자동 입찰 전략이 오작동하는지 확인하고, 일예산 상한선(Cap)을 점검하세요.",
    'opportunity': "물 들어올 때 노 저으세요! 성과가 좋은 이 영역에 예산을 20% 증액하여 매출 볼륨을 키우세요.",
    'hidden_gem': "아직 예산은 적지만 효율이 터지고 있습니다. 테스트 예산을 2배로 늘려 트래픽을 모아보세요.",
    'budget_warning': "예산 소진이 빠릅니다. 월말까지 페이싱을 조절하거나, 추가 예산 확보를 검토하세요.",
    'maintain': "현재 전략이 잘 작동하고 있습니다. 큰 변경 없이 모니터링을 유지하세요."
}

# FRIENDLY_TITLES 딕셔너리 (라인 90-102)
FRIENDLY_TITLES = {
    'revenue_drop': "📉 {target} 매출 급락 경보",
    'roas_drop': "💸 {target} 효율 저하 주의",
    'conversion_drop': "🛒 {target} 전환율 하락",
    'cost_surge': "🔥 {target} 비용 급증",
    'budget_alert': "💰 예산 소진 경고",
    'growth_acceleration': "🚀 성장 가속화",
    'stable_growth': "⚖️ 외형 성장 중 (효율 주의)",
    'declining': "📉 하락세 감지",
    'stable': "⚓ 안정적 유지",
    'scale_up': "🚀 강력 추천: 예산 증액",
    'hidden_gem': "💎 숨은 보석 발견"
}
```

#### generate_funnel_data.py - 퍼널 이탈 메시지

```python
# CRM_RECIPES 딕셔너리 (라인 149-171)
CRM_RECIPES = {
    '활동': {
        'diagnosis': "고객들이 상품을 잘 안 눌러봅니다.",
        'action': "👀 '요즘 이게 제일 잘 나가요🔥' 베스트 상품 큐레이션 배너를 메인에 띄워보세요.",
        'technical': "랜딩페이지 최적화가 필요합니다."
    },
    '관심': {
        'diagnosis': "장바구니에 담고 잊어버린 분들이 많아요.",
        'action': "🛒 이탈 1시간 후 '고객님, 담아두신 상품이 곧 품절돼요' 알림톡을 발송하세요.",
        'technical': "장바구니 리마인더 캠페인을 설정하세요."
    },
    '결제진행': {
        'diagnosis': "다 사려다가 결제 직전에 나갔어요.",
        'action': "💳 결제 오류가 없는지 확인하고, '지금 결제하면 내일 도착 🚚' 문구로 안심시켜주세요.",
        'technical': "결제 프로세스 UX 점검이 필요합니다."
    },
    '유입': {
        'diagnosis': "방문자 자체가 줄고 있어요.",
        'action': "📢 광고 노출이 줄었거나, 시즌 이슈일 수 있어요. 캠페인 예산과 키워드를 점검하세요.",
        'technical': "마케팅 캠페인 점검이 필요합니다."
    }
}

# BCG_MATRIX 채널 분류 (라인 173-199)
BCG_MATRIX = {
    'cash_cow': {
        'type': 'Cash Cow (효자 채널)',
        'icon': '👑',
        'message': '방문자도 많고 구매도 잘해요! 우리 쇼핑몰의 기둥입니다.',
        'action': '👉 지금 고객들에게 \'세트 상품\'을 추천해서 객단가를 더 높여보세요.'
    },
    'hidden_gem': {
        'type': 'Hidden Gem (숨은 보석)',
        'icon': '💎',
        'message': '아직 소문이 덜 났지만, 들어오면 무조건 사네요!',
        'action': '👉 확신을 가지세요! 이 채널 예산을 20%만 늘려도 매출이 튈 겁니다.'
    },
    'money_pit': {
        'type': 'Money Pit (밑 빠진 독)',
        'icon': '💸',
        'message': '사람만 북적이고 실속이 없어요. 헛돈 쓰고 있을 수 있습니다.',
        'action': '👉 타겟이 너무 넓어요. \'제외 키워드\'를 설정해서 허수를 걸러내세요.'
    },
    'dog': {
        'type': 'Dog (아픈 손가락)',
        'icon': '🤔',
        'message': '방문도 적고 반응도 없어요.',
        'action': '👉 잠시 운영을 멈추거나, 이미지와 문구를 완전히 새롭게 바꿔보세요.'
    }
}
```

### 4.3 페르소나 기반 액션 가이드

#### 연령+성별 조합별 추천 액션

```python
# PERSONA_ACTIONS 딕셔너리 (generate_type_insights.py 라인 78-97)
PERSONA_ACTIONS = {
    # 연령 + 성별 조합
    '20대_여성': "트렌드에 민감한 20대 여성이 반응하고 있습니다. 인스타그램 릴스나 감성적인 이미지 소재를 늘려보세요.",
    '20대_남성': "20대 남성은 유튜브와 숏폼 콘텐츠에 반응합니다. 재미있는 영상 광고나 밈 형태의 소재를 시도해보세요.",
    '30대_여성': "구매력이 높은 30대 여성입니다. 실용적인 혜택(무료배송, 1+1)을 강조하면 전환율이 오를 거예요.",
    '30대_남성': "30대 남성은 가성비와 리뷰를 중시합니다. 사용자 후기와 비교 데이터를 활용하세요.",
    '40대_여성': "40대 여성은 품질과 신뢰를 중요시합니다. 브랜드 스토리와 품질 보증을 강조하세요.",
    '40대_남성': "기능과 스펙을 중시하는 40대 남성입니다. 상세페이지에서 제품의 성능 데이터를 확실하게 보여주세요.",
    '50대_여성': "50대 여성은 건강과 웰빙에 관심이 높습니다. 제품의 안전성과 건강 혜택을 부각하세요.",
    '50대_남성': "50대 남성은 프리미엄 제품에 투자할 여력이 있습니다. 고급스러운 이미지와 A/S 보장을 강조하세요.",

    # 기기/플랫폼 기반
    '모바일_iOS': "아이폰 유저들의 구매율이 높습니다. 결제 과정이 매끄러운지(애플페이 등) 확인해보세요.",
    '모바일_Android': "안드로이드 유저가 많습니다. 다양한 결제 옵션(카카오페이, 네이버페이)을 제공하세요.",
    '데스크톱_웹': "PC 사용자는 꼼꼼히 비교하는 경향이 있습니다. 상세한 제품 정보와 리뷰를 제공하세요.",

    # 성별 단독
    '남성': "남성 타겟의 반응이 좋습니다. 간결하고 직관적인 메시지로 핵심 가치를 전달하세요.",
    '여성': "여성 타겟의 반응이 좋습니다. 감성적인 스토리텔링과 비주얼에 투자하세요."
}
```

#### 페르소나 액션 조회 함수

```python
def get_persona_action(age=None, gender=None, device=None, platform=None):
    """페르소나 기반 추천 액션 조회"""
    # 연령 + 성별 조합 우선
    if age and gender:
        key = f"{age}_{gender}"
        if key in PERSONA_ACTIONS:
            return PERSONA_ACTIONS[key]

    # 기기 + 플랫폼 조합
    if device and platform:
        key = f"{device}_{platform}"
        if key in PERSONA_ACTIONS:
            return PERSONA_ACTIONS[key]

    # 성별만
    if gender and gender in PERSONA_ACTIONS:
        return PERSONA_ACTIONS[gender]

    return None
```

### 4.4 인사이트 유형별 JSON 구조

#### Alert (경고/알림) 구조

```json
{
    "type": "revenue_decline",           // 알림 유형 식별자
    "title": "📉 매출이 주춤하고 있어요",   // 친화적 제목 (이모지 포함)
    "message": "최근 30일 매출이 이전 대비 -15.3% 감소했습니다.", // 상세 메시지
    "action": "캠페인 소재와 타겟팅을 점검해주세요.",  // 즉시 실행 가능한 액션
    "severity": "high",                  // 심각도: positive/opportunity/warning/high
    "category": "매출 분석",              // 분류 카테고리
    "score": 5,                          // 우선순위 점수 (1-5, 높을수록 중요)
    "value": -15.3,                       // 관련 수치
    "financial_impact": "예상 손실액: 1,500만 원"  // 재무적 영향 (선택적)
}
```

#### Recommendation (추천) 구조

```json
{
    "title": "💰 예산 재배분으로 효율 UP!",
    "description": "브랜드A (ROAS 850%)의 예산을 늘리고, 브랜드B의 예산을 유지하세요.",
    "action": "브랜드A에 예산 30% 증액을 권장합니다.",
    "priority": "high",                  // high/medium/low
    "category": "예산 전략",
    "score": 5,
    "expected_impact": "ROAS 10-20% 개선 예상",
    "reasons": ["ROAS 850%로 최고 효율", "전환수 지속 상승 중"],
    "based_on": "prophet_forecast"       // 근거 데이터 출처
}
```

#### Opportunity (기회) 구조

```json
{
    "type": "scale_up",
    "tag": "🚀 강력 추천: 예산 증액",
    "segment_type": "brand",
    "segment_value": "브랜드A",
    "title": "🚀 브랜드A: 수익성 최고조!",
    "message": "예상 ROAS가 850%로 매우 높습니다. 물 들어올 때 노 저으세요!",
    "action": "예산 20% 증액 시, 약 2,000만 원 추가 매출 기대",
    "financial_impact": "예산 20% 증액 시, 약 2,000만 원 추가 매출 기대",
    "potential_uplift": 20000000,
    "roas": 850,
    "priority": 1
}
```

#### Summary Card (요약 카드) 구조

```json
{
    "status_title": "🚀 성장 가속화",
    "status_message": "매출과 효율이 모두 오르고 있습니다. 아주 훌륭해요!",
    "status_color": "green",              // green/blue/orange/red
    "metrics": {
        "current_revenue": "1.5억 원",
        "forecast_revenue": "1.8억 원",
        "revenue_change_pct": 20.5,
        "current_roas": 450,
        "forecast_roas": 520,
        "roas_change_val": 70.0
    },
    "period": "예측 기간: 2024-12-01 ~ 2024-12-31"
}
```

### 4.5 MCP 통합 활용 가이드

#### MCP 서버에서 인사이트 JSON 활용 방법

1. **인사이트 JSON 파일 경로**
```
data/type/insights.json      # 광고 Type 분석
data/forecast/insights.json  # Prophet 예측 기반
data/funnel/insights.json    # AARRR 퍼널 분석
```

2. **MCP Tool 정의 예시**
```json
{
    "name": "get_marketing_insights",
    "description": "마케팅 성과 인사이트 조회",
    "input_schema": {
        "type": "object",
        "properties": {
            "insight_type": {
                "type": "string",
                "enum": ["type", "forecast", "funnel"],
                "description": "인사이트 유형"
            },
            "section": {
                "type": "string",
                "enum": ["summary", "alerts", "recommendations", "opportunities"],
                "description": "조회할 섹션"
            }
        }
    }
}
```

#### 자연어 응답 생성 패턴

```python
# MCP 핸들러에서 인사이트 JSON을 자연어로 변환하는 예시

def generate_natural_response(insights: dict) -> str:
    """인사이트 JSON을 자연어 응답으로 변환"""

    response_parts = []

    # 1. Summary Card 활용
    if 'summary_card' in insights:
        card = insights['summary_card']
        response_parts.append(f"{card['status_title']}")
        response_parts.append(f"{card['status_message']}")
        response_parts.append(f"현재 매출: {card['metrics']['current_revenue']}")

    # 2. 긴급 알림 우선 표시
    if 'alerts' in insights:
        high_alerts = [a for a in insights['alerts'] if a.get('severity') == 'high']
        for alert in high_alerts[:3]:
            response_parts.append(f"\n{alert['title']}")
            response_parts.append(f"  {alert['message']}")
            response_parts.append(f"  💡 {alert['action']}")

    # 3. Top 추천사항
    if 'recommendations' in insights:
        top_recs = sorted(insights['recommendations'],
                         key=lambda x: x.get('score', 0), reverse=True)[:3]
        for rec in top_recs:
            response_parts.append(f"\n{rec['title']}")
            response_parts.append(f"  {rec['description']}")
            response_parts.append(f"  예상 효과: {rec['expected_impact']}")

    return '\n'.join(response_parts)
```

#### 외부 컨텍스트와 조합하는 방법

```python
# 외부 데이터(날씨, 시즌, 경쟁사 등)와 인사이트를 조합하는 예시

def enrich_insights_with_context(insights: dict, external_context: dict) -> dict:
    """외부 컨텍스트와 인사이트 조합"""

    enriched = insights.copy()

    # 시즌 컨텍스트 적용
    if external_context.get('season') == 'holiday':
        enriched['context_message'] = "🎄 연말 시즌에는 선물 수요가 급증합니다!"
        # 추천사항 우선순위 재조정
        for rec in enriched.get('recommendations', []):
            if '선물' in rec.get('category', '') or '프로모션' in rec.get('category', ''):
                rec['score'] = min(rec.get('score', 0) + 2, 5)

    # 경쟁사 컨텍스트 적용
    if external_context.get('competitor_promo'):
        enriched['alerts'].insert(0, {
            'type': 'competitor_alert',
            'title': '⚡ 경쟁사 프로모션 진행 중!',
            'message': f"{external_context['competitor_name']}에서 할인 행사 진행 중입니다.",
            'action': '우리도 대응 프로모션을 검토하거나, 차별화된 가치를 강조하세요.',
            'severity': 'warning'
        })

    return enriched
```

#### 대화형 인사이트 제공 패턴

```python
# 사용자 질문 유형별 응답 생성 예시

USER_QUERY_PATTERNS = {
    '성과': {
        'sections': ['summary', 'overall'],
        'template': "현재 마케팅 성과를 분석해드릴게요.\n{summary_card}\n\n상세 지표:\n{metrics}"
    },
    '문제': {
        'sections': ['alerts'],
        'filter': lambda x: x.get('severity') in ['high', 'warning'],
        'template': "현재 주의가 필요한 영역이에요.\n{alerts}"
    },
    '추천': {
        'sections': ['recommendations', 'opportunities'],
        'template': "지금 실행하면 좋을 액션들이에요.\n{recommendations}"
    },
    '예측': {
        'sections': ['prophet_forecast', 'performance_trends'],
        'template': "향후 성과를 예측해드릴게요.\n{forecast}"
    },
    '퍼널': {
        'sections': ['summary', 'churn_predictions', 'crm_actions'],
        'template': "고객 여정(퍼널)을 분석해드릴게요.\n{funnel_analysis}"
    }
}

def route_user_query(query: str, insights: dict) -> str:
    """사용자 질문을 분석하여 적절한 인사이트 응답 생성"""

    for keyword, config in USER_QUERY_PATTERNS.items():
        if keyword in query:
            relevant_data = {}
            for section in config['sections']:
                if section in insights:
                    data = insights[section]
                    if 'filter' in config:
                        data = [x for x in data if config['filter'](x)]
                    relevant_data[section] = data

            return config['template'].format(**relevant_data)

    # 기본 응답: 주요 하이라이트
    return generate_natural_response(insights)
```

#### 한국어 화폐 포맷팅 유틸리티

```python
def format_korean_currency(value: float) -> str:
    """숫자를 읽기 쉬운 한국 화폐 단위로 변환

    Examples:
        150000000 -> "1.5억 원"
        25000000 -> "2,500만 원"
        15000 -> "15,000원"
    """
    if value is None or pd.isna(value):
        return "0원"
    val = float(value)
    if val >= 100000000:  # 1억 이상
        return f"{val/100000000:.1f}억 원"
    elif val >= 10000:    # 1만 이상
        return f"{val/10000:,.0f}만 원"
    else:
        return f"{int(val):,}원"
```

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|-----|------|----------|
| 2024-12-08 | v2.0 | 자연어 인사이트 생성 체계 섹션 추가 (MCP 통합 가이드 포함) |
