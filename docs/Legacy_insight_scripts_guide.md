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
  - [2.5 THRESHOLDS 상세](#25-thresholds-상세)
  - [2.6 Alert Trigger 조건](#26-alert-trigger-조건)
  - [2.7 Opportunity 유형별 Trigger 조건](#27-opportunity-유형별-trigger-조건)
- [3. 다중 기간 인사이트 생성 스크립트](#3-다중-기간-인사이트-생성-스크립트)
  - [3.1 generate_insights_multiperiod.py](#31-generate_insights_multiperiodpy)
  - [3.2 generate_type_insights_multiperiod.py](#32-generate_type_insights_multiperiodpy)
  - [3.3 generate_funnel_data_multiperiod.py](#33-generate_funnel_data_multiperiodpy)
- [4. generate_funnel_data.py](#4-generate_funnel_datapy)
  - [4.1 파일 위치 및 실행](#41-파일-위치-및-실행)
  - [4.2 입력 데이터](#42-입력-데이터)
  - [4.3 퍼널 단계 정의](#43-퍼널-단계-정의)
  - [4.4 출력 JSON 구조](#44-출력-json-구조)
  - [4.5 커스터마이징 포인트](#45-커스터마이징-포인트)

### 공통 가이드
- [공통 수정 가이드](#공통-수정-가이드)
- [실행 순서](#실행-순서)
- [문의 및 참고](#문의-및-참고)

### 자연어 인사이트 생성 체계
- [5. 자연어 인사이트 생성 체계](#5-자연어-인사이트-생성-체계)
  - [5.1 AI 비서 톤앤매너](#51-ai-비서-톤앤매너)
  - [5.2 메시지 템플릿 구조](#52-메시지-템플릿-구조)
  - [5.3 페르소나 기반 액션 가이드](#53-페르소나-기반-액션-가이드)
  - [5.4 인사이트 유형별 JSON 구조](#54-인사이트-유형별-json-구조)
  - [5.5 MCP 통합 활용 가이드](#55-mcp-통합-활용-가이드)

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
  "recommendations": [...],     // 추천 액션

  // ===== v2.7 신규: 4분면 매트릭스 인사이트 =====
  "gender_matrix_insights": [...],         // 성별 4분면 분석
  "age_gender_matrix_insights": [...],     // 연령x성별 4분면 분석
  "device_matrix_insights": [...],         // 기기유형 4분면 분석
  "deviceplatform_matrix_insights": [...]  // 기기플랫폼 4분면 분석
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

#### E. 4분면 매트릭스 분석 (Efficiency-Scale Matrix) - v2.7

> **핵심 개선**: 절대 평가(ROAS > 500%)를 **상대 평가(그룹 내 상위 N%)**로 전환하여 차원별(성별/연령/기기) 최적화 전략 제시

##### E.1 매트릭스 정의

| 구분 | **고효율 (High Efficiency)** | **저효율 (Low Efficiency)** |
| :--- | :--- | :--- |
| **고지출** | **👑 Core Driver (핵심 동력)**<br>예산도 많고 성과도 좋음<br>→ 현재 상태 유지, 예산 우선 배정 | **💸 Budget Bleeder (예산 누수)**<br>예산은 많은데 성과는 나쁨<br>→ 즉시 감액, 소재/타겟 수정 |
| **저지출** | **💎 Efficiency Star (효율 스타)**<br>예산은 적은데 성과는 좋음<br>→ 예산 증액하여 Scale-up | **💤 Underperformer (성과 미달)**<br>예산도 적고 성과도 나쁨<br>→ 소재 테스트 후 OFF 처리 |

##### E.2 상수 정의 (라인 107-139)

```python
# 동적 임계값 (Quantile 기준)
MATRIX_THRESHOLDS = {
    'th_spend_high': 0.6,  # 지출 상위 40% (Quantile 0.6)
    'th_eff_high': 0.7,    # 효율 상위 30% (Quantile 0.7)
    'th_eff_low': 0.3      # 효율 하위 30% (Quantile 0.3)
}

# 차원별 맞춤 처방
DIMENSION_ADVICE_MAP = {
    'demographic': {  # 성별/연령
        'core_driver': "유사 타겟(Lookalike) 소스로 활용하여 모수를 확장하세요.",
        'efficiency_star': "예산을 20%씩 증액하여 Scale-up 테스트하세요.",
        'budget_bleeder': "해당 타겟 전용 소재로 교체하거나 입찰가를 낮추세요.",
        'underperformer': "연령/성별 제외 설정을 통해 예산 낭비를 막으세요."
    },
    'device': {  # 기기/플랫폼
        'core_driver': "결제 UX에 문제가 없는지 주기적으로 점검하세요.",
        'efficiency_star': "특정 OS/기기 전용 입찰 전략을 테스트해보세요.",
        'budget_bleeder': "랜딩페이지 최적화(LPO)가 시급합니다.",
        'underperformer': "해당 기기 노출을 제외하세요."
    },
    'time': {  # 시간대/요일
        'core_driver': "골든타임 예산 조기 소진 방지를 위해 스케줄 확보하세요.",
        'efficiency_star': "틈새 시간대 입찰가를 높여 점유율을 확보하세요.",
        'budget_bleeder': "Dayparting으로 해당 시간대 비중을 줄이세요.",
        'underperformer': "광고 운영 시간에서 제외를 고려하세요."
    }
}
```

##### E.3 TypeMicroAnalyzer 클래스 (라인 218-384)

```python
class TypeMicroAnalyzer:
    """4분면 매트릭스 기반 차원별 인사이트 생성"""

    def _calculate_metrics(self, df, objective_type='conversion'):
        """통합 효율 점수 및 랭킹 산출"""
        if objective_type == 'traffic':
            df['norm_efficiency'] = 1 / df['cpc'].replace(0, 0.01)
        else:
            df['norm_efficiency'] = df['roas'].fillna(0)

        df['spend_rank'] = df['cost'].rank(pct=True)  # 0.0~1.0
        df['eff_rank'] = df['norm_efficiency'].rank(pct=True)
        return df

    def _classify_quadrant(self, spend_rank, eff_rank):
        """4분면 분류"""
        th = MATRIX_THRESHOLDS
        if spend_rank >= th['th_spend_high'] and eff_rank >= th['th_eff_high']:
            return 'core_driver', 'positive'
        elif spend_rank < th['th_spend_high'] and eff_rank >= th['th_eff_high']:
            return 'efficiency_star', 'opportunity'
        elif spend_rank >= th['th_spend_high'] and eff_rank <= th['th_eff_low']:
            return 'budget_bleeder', 'high'
        elif spend_rank < th['th_spend_high'] and eff_rank <= th['th_eff_low']:
            return 'underperformer', 'warning'
        return None, None

    def generate_dimension_insights(self, df, dimension_name, objective_type='conversion'):
        """차원별 4분면 인사이트 생성"""
        # ... 분류 및 인사이트 생성 로직
```

##### E.4 4분면 Trigger 조건

| Matrix Type | Trigger 조건 | Severity | Icon |
|-------------|-------------|----------|------|
| `core_driver` | spend_rank ≥ 0.6 AND eff_rank ≥ 0.7 | positive | 👑 |
| `efficiency_star` | spend_rank < 0.6 AND eff_rank ≥ 0.7 | opportunity | 💎 |
| `budget_bleeder` | spend_rank ≥ 0.6 AND eff_rank ≤ 0.3 | high | 💸 |
| `underperformer` | spend_rank < 0.6 AND eff_rank ≤ 0.3 | warning | 💤 |

##### E.5 JSON 출력 예시

```json
{
  "gender_matrix_insights": [
    {
      "type": "dimension_insight",
      "sub_type": "core_driver",
      "dimension": "gender",
      "target": "여성",
      "severity": "positive",
      "title": "👑 여성: 핵심 동력 (Core Driver)",
      "message": "예산 비중이 높고 효율도 최상위권입니다. (상위 5%)",
      "action": "유사 타겟(Lookalike) 소스로 활용하여 모수를 확장하세요.",
      "metrics": {
        "efficiency_value": 850,
        "spend_rank_pct": 0.95,
        "eff_rank_pct": 0.95
      }
    }
  ]
}
```

##### E.6 대시보드 연동 (type_dashboard.html)

| 섹션 | 위치 | 표시 내용 |
|------|------|----------|
| 성별 비교 | 타겟팅 탭 | 4분면 배지 + 색상 표시 |
| 효율-규모 매트릭스 | 타겟팅 탭 | 4분면 그리드 + 추천 액션 |

```javascript
// severityConfig에 positive 추가
const severityConfig = {
    'positive': { border: '#2e7d32', bg: '#e8f5e9', icon: '👑' },
    'opportunity': { border: '#1976d2', bg: '#e3f2fd', icon: '💎' },
    'high': { border: '#ef5350', bg: '#ffebee', icon: '💸' },
    'warning': { border: '#ff9800', bg: '#fff3e0', icon: '💤' }
};

// 4분면 배지 렌더링
function renderMatrixBadge(matrixType) {
    const badges = {
        'core_driver': { label: '핵심 동력', bg: '#2e7d32', icon: '👑' },
        'efficiency_star': { label: '효율 스타', bg: '#1976d2', icon: '💎' },
        'budget_bleeder': { label: '예산 누수', bg: '#d32f2f', icon: '💸' },
        'underperformer': { label: '성과 부진', bg: '#ff9800', icon: '💤' }
    };
    // ...
}
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
  // ===== v2.8 신규: Forecast Matrix 4분면 인사이트 =====
  "matrix_insights": {
    "brand": [...],              // 브랜드별 4분면 분류
    "product": [...],            // 상품별 4분면 분류
    "channel": [...],            // 채널별 4분면 분류
    "promotion": [...]           // 프로모션별 4분면 분류
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

#### E. THRESHOLDS 상세 (라인 64-72)

```python
THRESHOLDS = {
    'high_roas': 300.0,       # 고효율 기준 (%) - scale_up 트리거
    'low_roas': 150.0,        # 저효율 기준 (%)
    'growth_star': 10.0,      # 고성장 기준 (%) - growth_momentum 트리거
    'risk_critical': -20.0,   # 위험 경고 기준 (%) - severity: high
    'risk_warning': -10.0,    # 주의 필요 기준 (%) - severity: medium
    'budget_alert': 90.0,     # 예산 소진 경고 (%)
    'opportunity_roas': 200.0 # 기회 발굴 기준 (%) - hidden_gem 트리거
}
```

#### F. Alert Trigger 조건

| Alert Type | Trigger 조건 | Severity | Financial Impact |
|------------|-------------|----------|------------------|
| `conversion_decline` | 전환수 변화 < -10% | medium (< -20%: high) | 예상 손실 전환: N건 |
| `revenue_decline` | 전환값 변화 < -10% | medium (< -20%: high) | 예상 손실액: N만 원 |
| `roas_decline` | ROAS 변화 < -10%p | medium (< -20%p: high) | ROAS 변화 표시 |

```python
# detect_alerts() 로직 (라인 859-935)
if conv_change < -self.thresholds['decline_alert_pct']:  # -10%
    severity = 'high' if conv_change < -self.thresholds['critical_decline_pct'] else 'medium'
    alerts.append({
        'type': 'conversion_decline',
        'severity': severity,
        'title': "🛒 {segment_value} 전환율 하락",
        'message': f"다음 주 전환수가 {abs(conv_change):.1f}% 감소할 것으로 예상됩니다.",
        'action': ACTION_GUIDES['conversion_drop'],
        'financial_impact': f"예상 손실 전환: {int(loss_conversions):,}건"
    })
```

#### G. Opportunity 유형별 Trigger 조건

| Opportunity Type | Trigger 조건 | Priority | 메시지 |
|-----------------|--------------|----------|--------|
| `scale_up` | ROAS > 300% | 1 | "🚀 수익성 최고조! 예산 20% 증액 권장" |
| `hidden_gem` | ROAS > 200% AND 비용 < 100만원 | 2 | "💎 숨은 보석 발견! 테스트 예산 2배 확대" |
| `growth_momentum` | 전환수 증가 > 10% AND ROAS > 150% | 3 | "📈 성장 가속 중! 예산 10% 증액" |

```python
# find_opportunities() 로직 (라인 940-1028)
# Opportunity 1: High ROAS (Star/Cash Cow)
if roas > THRESHOLDS['high_roas']:  # > 300%
    opportunities.append({
        'type': 'scale_up',
        'tag': "🚀 강력 추천: 예산 증액",
        'action': "물 들어올 때 노 저으세요! 성과가 좋은 이 영역에 예산을 20% 증액",
        'financial_impact': f"예산 20% 증액 시, 약 {format_currency(potential_uplift)} 추가 매출 기대",
        'priority': 1
    })

# Opportunity 2: Hidden Gem (저예산 고효율)
elif roas > THRESHOLDS['opportunity_roas'] and total_cost < 1000000:  # > 200%, < 100만원
    opportunities.append({
        'type': 'hidden_gem',
        'tag': "💎 숨은 보석 발견",
        'action': "아직 예산은 적지만 효율이 터지고 있습니다. 테스트 예산을 2배로 늘려보세요.",
        'priority': 2
    })

# Opportunity 3: Growth Momentum
elif changes.get('전환수', 0) > THRESHOLDS['growth_star'] and roas > THRESHOLDS['low_roas']:  # > 10%, > 150%
    opportunities.append({
        'type': 'growth_momentum',
        'tag': "📈 성장 모멘텀",
        'action': "현재 전략을 유지하고, 예산을 10% 증액하여 성장을 가속화하세요.",
        'priority': 3
    })
```

#### H. Forecast Matrix 4분면 분석 (v2.8)

> **핵심 개선**: 절대 평가(ROAS > 300%) 대신 **현재 효율(X축) × 예측 성장률(Y축)** 매트릭스로 세그먼트 분류

##### Forecast Matrix 정의

| 구분 | **고성장 (High Growth)** | **역성장 (Negative Growth)** |
|------|-------------------------|------------------------------|
| **고효율** (High Eff) | 🚀 **Super Star** (슈퍼스타)<br>돈도 벌고 미래도 밝음<br>**Action:** 예산 증액 + Lookalike 확장 | 🛡️ **Fading Hero** (지는 해)<br>지금은 좋지만 미래가 어두움<br>**Action:** 조기 방어, 신규 소재 준비 |
| **저효율** (Low Eff) | 🌱 **Rising Potential** (씨앗)<br>지금은 별로지만 미래가 밝음<br>**Action:** 지켜보면서 Scale-up 준비 | 🗑️ **Problem Child** (문제아)<br>지금도 미래도 안 좋음<br>**Action:** 예산 감액 또는 OFF |

##### FORECAST_MATRIX_THRESHOLDS (라인 77-83)

```python
FORECAST_MATRIX_THRESHOLDS = {
    'th_eff_high': 0.7,      # 효율 상위 30% (Quantile 0.7)
    'th_eff_low': 0.3,       # 효율 하위 30% (Quantile 0.3)
    'th_growth_high': 0.05,  # 성장률 +5% 이상
    'th_growth_low': -0.05,  # 역성장 -5% 이하
    'th_impact_core': 0.10   # 매출 비중 10% 이상 = Core Risk
}
```

##### ADVICE_CONTEXT_MAP (라인 88-117)

| Segment Context | super_star | fading_hero | rising_potential | problem_child |
|-----------------|------------|-------------|------------------|---------------|
| **brand** | 경쟁사 키워드 점유율 확대 | 리브랜딩/콜라보로 신선함 | 니치마켓 전용 랜딩페이지 | 브랜드 스토리텔링 점검 |
| **product** | 품절 방지, 재고 확보 | 상품 단종 or 묶음 판매 | 메인 배너 노출 테스트 | 가격/구성 재검토 |
| **channel** | 예산 우선 배정 | 채널 특성 맞는 신규 소재 | 테스트 예산 증액 | 소재/타겟 전면 교체 |
| **promotion** | 프로모션 기간 연장 | 신규 프로모션 기획 | 프로모션 범위 확대 | 프로모션 중단 검토 |

##### InsightMicroAnalyzer 클래스 (라인 194-404)

```python
class InsightMicroAnalyzer:
    def __init__(self):
        self.advice_map = ADVICE_CONTEXT_MAP
        self.thresholds = FORECAST_MATRIX_THRESHOLDS

    def _calculate_metrics(self, segment_stats, forecast_data) -> dict:
        """효율 점수, 예측 성장률, 총 매출 계산"""

    def _get_dynamic_thresholds(self, all_metrics) -> dict:
        """Quantile 기반 동적 임계값 반환"""

    def generate_matrix_insights(self, segment_stats, forecasts, segment_context) -> list:
        """4분면 매트릭스 인사이트 생성"""
```

##### Matrix Insight JSON 출력 예시

```json
{
  "matrix_insights": {
    "brand": [
      {
        "type": "matrix_insight",
        "sub_type": "fading_hero",
        "segment_type": "brand",
        "segment_value": "브랜드A",
        "severity": "warning",
        "title": "🛡️ 브랜드A: 지는 해 방어 필요",
        "message": "현재 효율(ROAS 691%)은 좋지만, 매출이 62.9% 감소할 것으로 예측됩니다.",
        "action": "브랜드 노후화가 우려됩니다. 리브랜딩 캠페인이나 콜라보레이션으로 신선함을 주세요.",
        "metrics": {
          "roas": 691,
          "forecast_growth_rate": -0.629,
          "total_revenue": 5230000,
          "revenue_impact_share": 0.08,
          "eff_rank_pct": 0.85
        }
      }
    ],
    "product": [...],
    "channel": [...],
    "promotion": [...]
  }
}
```

##### Severity 기준

| Matrix Type | Severity | 조건 |
|-------------|----------|------|
| `super_star` | opportunity | 고효율 + 고성장 |
| `fading_hero` | warning | 고효율 + 역성장 |
| `rising_potential` | opportunity | 저효율 + 고성장 |
| `problem_child` | high | 저효율 + 역성장 |
| `problem_child` (Core Risk) | critical | 저효율 + 역성장 + 매출비중 ≥ 10% |

---

## 3. 다중 기간 인사이트 생성 스크립트

### 3.1 generate_insights_multiperiod.py

> insight_generator.py를 여러 기간에 대해 실행하여 통합 JSON 생성

#### 파일 위치 및 실행
```bash
python scripts/generate_insights_multiperiod.py
```

#### 분석 기간
| 기간 Key | 설명 | 사용 데이터 |
|---------|------|-----------|
| `full` | 전체 기간 | 모든 데이터 |
| `180d` | 최근 180일 | 최근 6개월 |
| `90d` | 최근 90일 | 최근 3개월 |
| `30d` | 최근 30일 | 최근 1개월 |

#### 출력 JSON 구조
```json
{
  "generated_at": "2024-12-18T...",
  "by_period": {
    "full": { /* insight_generator.py 결과 */ },
    "180d": { /* 180일 기준 결과 */ },
    "90d": { /* 90일 기준 결과 */ },
    "30d": { /* 30일 기준 결과 */ }
  }
}
```

#### 출력 파일
- `data/forecast/insights.json`

### 3.2 generate_type_insights_multiperiod.py

> generate_type_insights.py를 여러 기간에 대해 실행 (Prophet 예측 포함)

#### 파일 위치 및 실행
```bash
python scripts/generate_type_insights_multiperiod.py
```

#### 분석 기간
| 기간 Key | 설명 | Prophet 학습 데이터 |
|---------|------|-------------------|
| `full` | 전체 기간 (365일) | 전체 데이터 |
| `180d` | 최근 180일 | 최근 6개월 |
| `90d` | 최근 90일 | 최근 3개월 |

> **참고**: 30일은 Prophet 학습에 충분하지 않아 제외

#### 실행 순서
1. 각 기간별 Prophet 예측 생성 (`multi_analysis_prophet_forecast.py --days N`)
2. 각 기간별 인사이트 생성 (`generate_type_insights.py --days N`)
3. 결과 통합

#### 출력 JSON 구조
```json
{
  "by_period": {
    "full": { /* generate_type_insights.py 결과 (seasonality 제외) */ },
    "180d": { /* 180일 기준 결과 */ },
    "90d": { /* 90일 기준 결과 */ }
  },
  "seasonality": {
    "seasonality_analysis": { /* 전체 기간 기준 요일별 분석 */ },
    "seasonality_insights": [ /* 요일별 인사이트 */ ]
  },
  "generated_at": "2024-12-18T...",
  "available_periods": [
    {"key": "full", "label": "전체 기간"},
    {"key": "180d", "label": "최근 180일"},
    {"key": "90d", "label": "최근 90일"}
  ]
}
```

#### 출력 파일
- `data/type/insights.json`

### 3.3 generate_funnel_data_multiperiod.py

> generate_funnel_data.py를 여러 기간에 대해 실행하여 통합 JSON 생성 (마이크로 세그먼트 포함)

#### 파일 위치 및 실행
```bash
python scripts/generate_funnel_data_multiperiod.py
python scripts/generate_funnel_data_multiperiod.py --category fashion
```

#### 분석 기간
| 기간 Key | 설명 | 사용 데이터 |
|---------|------|-----------|
| `full` | 전체 기간 | 모든 데이터 |
| `180d` | 최근 180일 | 최근 6개월 |
| `90d` | 최근 90일 | 최근 3개월 |
| `30d` | 최근 30일 | 최근 1개월 |

#### 출력 JSON 구조
```json
{
  "by_period": {
    "full": {
      "summary": { ... },
      "channel_strategy": { ... },
      "micro_segment_alerts": [ ... ],
      "channel_metrics_enhanced": { ... },
      "dynamic_thresholds": { ... },
      "period_info": { "key": "full", "days": 0, "label": "전체 기간" }
    },
    "180d": { /* 180일 기준 결과 */ },
    "90d": { /* 90일 기준 결과 */ },
    "30d": { /* 30일 기준 결과 */ }
  },
  "churn_analysis": {
    "churn_predictions_7d": [ ... ],
    "churn_predictions_30d": [ ... ],
    "improvement_predictions_7d": [ ... ],
    "improvement_predictions_30d": [ ... ]
  },
  "crm_actions_by_period": {
    "full": { "period_label": "전체 기간", "crm_actions": [ ... ] },
    "180d": { "period_label": "최근 180일", "crm_actions": [ ... ] },
    "90d": { "period_label": "최근 90일", "crm_actions": [ ... ] },
    "30d": { "period_label": "최근 30일", "crm_actions": [ ... ] }
  },
  "generated_at": "2025-12-26T...",
  "available_periods": [
    {"key": "full", "label": "전체 기간"},
    {"key": "180d", "label": "최근 180일"},
    {"key": "90d", "label": "최근 90일"},
    {"key": "30d", "label": "최근 30일"}
  ]
}
```

#### 기간별 포함 분석
| 분석 항목 | full | 180d | 90d | 30d |
|----------|------|------|-----|-----|
| BCG Matrix | ✅ | ✅ | ✅ | ✅ |
| K-Means 클러스터링 | ✅ | ✅ | ✅ | ✅ |
| A/B 테스트 | ✅ | ✅ | ✅ | ✅ |
| 마이크로 세그먼트 | ✅ | ✅ | ✅ | ✅ |
| 이탈/개선 예측 | ✅ (전체만) | ❌ | ❌ | ❌ |
| CRM 추이 분석 | ✅ | ✅ | ✅ | ✅ |

#### CRM 추이 분석 방식
- **분석 방식**: `d_day (최근 7일 평균) vs d_day-N (N일 전 7일 평균)`
- **180d**: 180일 전 시점 대비 현재 변화율
- **90d**: 90일 전 시점 대비 현재 변화율
- **30d**: 30일 전 시점 대비 현재 변화율

#### 출력 파일
- `data/funnel/insights.json`

---

## 4. generate_funnel_data.py

### 4.1 파일 위치 및 실행
```bash
python scripts/generate_funnel_data.py
```

### 4.2 입력 데이터
| 파일명 | 설명 |
|-------|------|
| `data/GA4/2025-11.csv` | GA4 퍼널 이벤트 데이터 |

### 4.3 퍼널 단계 정의 (라인 23-29)
```python
FUNNEL_MAPPING = {
    '유입': 'Acquisition',      # 방문
    '활동': 'Activation',       # 활성화
    '관심': 'Consideration',    # 장바구니
    '결제진행': 'Conversion',   # 결제 시도
    '구매완료': 'Purchase'      # 구매 완료
}
```

### 4.4 출력 JSON 구조
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

### 4.5 커스터마이징 포인트

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

## 5. 자연어 인사이트 생성 체계

> MCP(Model Context Protocol)를 활용해 외부 컨텍스트와 조합하여 사용자 친화적인 분석 결과를 제공하기 위한 가이드

### 5.1 AI 비서 톤앤매너

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

### 5.2 메시지 템플릿 구조

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
    },
    # 트래픽 캠페인용 메시지 템플릿 (v1.7 추가)
    'excellent_cpc_opportunity': {
        'title': "🎯 '{target}' 트래픽 캠페인이 효율적이에요!",
        'message': "{target}의 CPC가 {cpc:,}원으로 매우 우수합니다.",
        'action': "현재 전략을 유지하면서 예산 확대를 고려하세요."
    },
    'high_cpc_warning': {
        'title': "⚠️ '{target}' 트래픽 비용이 높아요",
        'message': "{target}의 CPC가 {cpc:,}원으로 높습니다.",
        'action': "타겟팅을 좁히거나 소재를 개선해보세요."
    },
    'high_ctr_opportunity': {
        'title': "👆 '{target}'의 클릭률이 좋아요!",
        'message': "{target}의 CTR이 {ctr:.2f}%로 우수합니다.",
        'action': "관심을 끌고 있으니 랜딩페이지 최적화에 집중하세요."
    },
    'low_ctr_warning': {
        'title': "⚠️ '{target}' 클릭률이 낮아요",
        'message': "{target}의 CTR이 {ctr:.2f}%로 저조합니다.",
        'action': "광고 소재와 카피를 개선해보세요."
    }
}
```

#### 유형구분_통합 기반 KPI 분기 (v1.7)

> **중요**: `유형구분_통합`은 `광고세트` 컬럼에 '트래픽' 문구 포함 여부로 결정됩니다.
> - 광고세트에 '트래픽' 포함 → `유형구분_통합 = '트래픽'` → **CPC 기준** 인사이트
> - 그 외 → `유형구분_통합 = '전환'` → **ROAS/CPA 기준** 인사이트

##### KPI 임계값 설정 (THRESHOLDS)

```python
# generate_type_insights.py (라인 58-73)
THRESHOLDS = {
    # ═══════════════════════════════════════════════════════════════
    # 전환 캠페인용 (ROAS/CPA 기준)
    # ═══════════════════════════════════════════════════════════════
    'excellent_roas': 1000.0,  # ROAS 매우 우수 기준 (%)
    'high_roas': 500.0,        # ROAS 우수 기준 (%)
    'low_roas': 100.0,         # ROAS 저조 기준 (%) - 경고 트리거
    'high_cpa': 50000,         # CPA 경고 기준 (원)
    'growth_signal': 20.0,     # 매출 급상승 기준 (%)
    'drop_signal': -20.0,      # 매출 급락 기준 (%)

    # ═══════════════════════════════════════════════════════════════
    # 트래픽 캠페인용 (CPC/CTR 기준)
    # ═══════════════════════════════════════════════════════════════
    'excellent_cpc': 200,      # CPC 매우 우수 (원) - 낮을수록 좋음
    'good_cpc': 500,           # CPC 우수 (원)
    'warning_cpc': 1000,       # CPC 경고 (원) - 높으면 경고
    'high_ctr': 3.0,           # CTR 우수 (%) - 높을수록 좋음
    'low_ctr': 1.0,            # CTR 저조 (%)
}
```

##### 성과 레벨 판단 로직

| 캠페인 유형 | 기준 지표 | 매우 우수 | 우수 | 양호 | 개선 필요 |
|------------|----------|----------|------|------|----------|
| **전환** (유형구분_통합='전환') | ROAS | > 5000% | > 1000% | > 200% | ≤ 200% |
| **트래픽** (유형구분_통합='트래픽') | CPC | ≤ 200원 | ≤ 500원 | ≤ 1000원 | > 1000원 |

```python
# 전환 캠페인 성과 레벨 판단 (ROAS 기준 - 높을수록 우수)
if roas_val > 5000:
    performance = "매우 우수"
elif roas_val > 1000:
    performance = "우수"
elif roas_val > 200:
    performance = "양호"
else:
    performance = "개선 필요"

# 트래픽 캠페인 성과 레벨 판단 (CPC 기준 - 낮을수록 우수)
if cpc_val <= THRESHOLDS['excellent_cpc']:  # ≤ 200원
    performance = "매우 우수"
elif cpc_val <= THRESHOLDS['good_cpc']:      # ≤ 500원
    performance = "우수"
elif cpc_val <= THRESHOLDS['warning_cpc']:   # ≤ 1000원
    performance = "양호"
else:                                         # > 1000원
    performance = "개선 필요"
```

##### Alert Trigger 조건

| Alert Type | 캠페인 유형 | Trigger 조건 | Severity |
|------------|------------|--------------|----------|
| `high_roas_opportunity` | 전환 | ROAS > 1000% | opportunity |
| `low_roas_warning` | 전환 | ROAS < 100% | warning |
| `excellent_cpc_opportunity` | 트래픽 | CPC ≤ 200원 | opportunity |
| `high_cpc_warning` | 트래픽 | CPC > 1000원 | warning |
| `high_ctr_opportunity` | 트래픽 | CTR ≥ 3.0% | opportunity |
| `revenue_growth` | 공통 | 30일 매출 변화 > +20% | positive |
| `revenue_decline` | 공통 | 30일 매출 변화 < -20% | high |
| `forecast_overperformance` | 공통 | 예측 대비 > +20% | positive |
| `forecast_underperformance` | 공통 | 예측 대비 < -20% | warning |

##### 차원별 분석 분기 (v1.7)

각 차원(성별, 연령, 기기 등) 분석에서 `유형구분_통합`에 따라 다른 KPI로 인사이트를 생성합니다.

| 차원 | 전환 캠페인 (ROAS 기준) | 트래픽 캠페인 (CPC 기준) |
|------|------------------------|------------------------|
| 성별 | `gender_insights` | `gender_traffic_insights` |
| 연령×성별 | `age_gender_insights` | `age_gender_traffic_insights` |
| 기기유형 | `device_insights` | `device_traffic_insights` |
| 기기플랫폼 | `deviceplatform_insights` | `deviceplatform_traffic_insights` |

**JSON 출력 예시**:
```json
{
  "gender_performance": [
    {"gender": "여성", "campaign_type": "전환", "roas": 850, "performance_level": "우수"}
  ],
  "gender_traffic_performance": [
    {"gender": "여성", "campaign_type": "트래픽", "cpc": 180, "ctr": 3.5, "performance_level": "매우 우수"}
  ]
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

##### insight_generator.py Alert Trigger 조건

> 섹션 2.5~2.7에서 상세 설명된 내용의 요약

| Alert Type | Trigger 조건 | Severity | Financial Impact |
|------------|-------------|----------|------------------|
| `conversion_decline` | 전환수 변화 < -10% | medium (< -20%: high) | 예상 손실 전환: N건 |
| `revenue_decline` | 전환값 변화 < -10% | medium (< -20%: high) | 예상 손실액: N만 원 |
| `roas_decline` | ROAS 변화 < -10%p | medium (< -20%p: high) | ROAS 변화 표시 |

##### insight_generator.py Opportunity Trigger 조건

| Opportunity Type | Trigger 조건 | Priority | 메시지 |
|-----------------|--------------|----------|--------|
| `scale_up` | ROAS > 300% | 1 | "🚀 수익성 최고조! 예산 20% 증액 권장" |
| `hidden_gem` | ROAS > 200% AND 비용 < 100만원 | 2 | "💎 숨은 보석 발견! 테스트 예산 2배 확대" |
| `growth_momentum` | 전환수 증가 > 10% AND ROAS > 150% | 3 | "📈 성장 가속 중! 예산 10% 증액" |

##### THRESHOLDS 참조 (insight_generator.py)
```python
THRESHOLDS = {
    'high_roas': 300.0,           # scale_up 트리거
    'opportunity_roas': 200.0,    # hidden_gem 트리거
    'low_roas': 150.0,            # growth_momentum 하한
    'growth_star': 10.0,          # 성장 모멘텀 기준 (%)
    'decline_alert_pct': 10,      # 하락 경고 기준 (%)
    'critical_decline_pct': 20    # 고위험 기준 (%)
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

##### generate_funnel_data.py Alert Trigger 조건

| Alert Type | Trigger 조건 | Severity | 채널 특성 |
|------------|-------------|----------|----------|
| `activation_low` (Paid 채널) | 유입→활동 전환율 < 50% | high | 광고 문구/랜딩페이지 불일치 의심 |
| `activation_low` (Organic 채널) | 유입→활동 전환율 < 50% | medium | 페이지 로딩 속도 문제 의심 |
| `cart_abandonment` | 관심→구매 전환율 < 20% AND 관심 > 50명 | high | 결제 과정 이탈 |

##### generate_funnel_data.py BCG Matrix Trigger 조건

| Matrix Type | Trigger 조건 | 아이콘 |
|-------------|-------------|--------|
| `cash_cow` | 트래픽 ≥ 평균 AND CVR ≥ 평균 | 👑 효자 채널 |
| `hidden_gem` | 트래픽 < 평균 AND CVR ≥ 평균 | 💎 숨은 보석 |
| `money_pit` | 트래픽 ≥ 평균 AND CVR < 평균 | 💸 밑 빠진 독 |
| `dog` | 트래픽 < 평균 AND CVR < 평균 | 🤔 아픈 손가락 |

##### generate_funnel_data.py 이탈/개선 예측 Trigger 조건

| Prediction Type | Trigger 조건 | Risk Level | 기간 |
|-----------------|-------------|------------|------|
| `churn_7d` | 7일 변화율 < -20% | medium (< -30%: high) | 7일 |
| `churn_30d` | 30일 변화율 < -20% | medium (< -30%: high) | 30일 |
| `improvement_7d` | 7일 변화율 > +20% | medium (> +30%: high) | 7일 |
| `improvement_30d` | 30일 변화율 > +20% | medium (> +30%: high) | 30일 |

##### CATEGORY_THRESHOLDS 참조 (generate_funnel_data.py)

| 임계값 | default | fashion | food | electronics |
|--------|---------|---------|------|-------------|
| `activation_rate_warning` | 50% | 40% | 60% | 45% |
| `cart_conversion_warning` | 20% | 15% | 30% | 10% |
| `churn_alert_threshold` | -20% | -25% | -15% | -20% |
| `improvement_threshold` | +20% | +25% | +15% | +20% |
| `high_risk_threshold` | -30% | -35% | -25% | -30% |
| `high_improvement_threshold` | +30% | +35% | +25% | +30% |
| `ab_significance` | 0.05 | 0.05 | 0.05 | 0.05 |

> **Note**: 카테고리별로 임계값이 다릅니다. 패션(fashion)은 충동구매가 많아 전환율이 낮고, 식품(food)은 재구매가 많아 전환율이 높습니다.

##### 마이크로 세그먼트 분석 (Upgrade Guide v2.4)

> **핵심 개선**: 정적 임계값 대신 **동적 상대 평가(Quantile)**와 **채널 카테고리(Context)**를 결합한 전문적인 마케팅 진단

###### 파생 지표 (Internal Metrics)

| 지표 | 계산식 | 목적 |
|------|--------|------|
| **RPV (Revenue Per Visitor)** | `Revenue / Acquisition` | 전환율은 낮지만 객단가가 높은 'VIP 채널' 오판 방지 |
| **Log RPV Score** | `np.log1p(RPV)` | 매출 데이터의 극단적 편차(Skewness) 보정 |
| **Traffic Rank** | `df['유입'].rank(pct=True)` | 해당 채널의 트래픽이 전체 중 상위 몇 %인지 판단 |

###### 동적 임계값 (Dynamic Thresholds)

| 임계값 | Quantile | 설명 |
|--------|----------|------|
| `traffic_high` | 0.8 (상위 20%) | 고유입 채널 기준선 |
| `traffic_low` | 0.5 (하위 50%) | 저유입 채널 기준선 |
| `rpv_high` | 0.8 (상위 20%) | 고가치 채널 기준선 |
| `rpv_low` | 0.4 (하위 40%) | 저효율 채널 기준선 |

###### 마이크로 세그먼트 Trigger 조건

| Segment | Trigger 조건 | Severity | Icon |
|---------|-------------|----------|------|
| **Hidden VIP** | CVR < 1% AND RPV ≥ 상위 20% | opportunity | 👑 |
| **Traffic Waste** | 트래픽 ≥ 상위 20% AND 활동전환율 < 40% AND RPV < 하위 40% | high | 💸 |
| **Checkout Friction** | 장바구니 > 50명 AND 장바구니→구매 < 10% | critical | 🚧 |
| **Rising Star** | 트래픽 < 하위 50% AND 활동전환율 > 70% | opportunity | 🚀 |
| **Activation Drop** | 유입→활동 전환율 < 50% AND 트래픽 ≥ 중간 | high | 🚪 |
| **Engagement Gap** | 활동 > 50명 AND 유입→활동 ≥ 50% AND 활동→관심 < 평균×60% | medium | 🔍 |
| **Silent Majority** | 트래픽 ≥ 최소기준 AND 모든 전환율이 평균 대비 -20% 이상 낮음 | medium | 😶 |

> **v2.6 신규**: Activation Drop, Engagement Gap, Silent Majority 세그먼트가 추가되어 기존 `urgent_alerts`의 역할을 통합

###### 카테고리별 맞춤 처방 (CATEGORY_ADVICE_MAP)

| Category | Activation Issue | Conversion Issue |
|----------|-----------------|------------------|
| **SA** (검색) | 키워드 의도(Intent)와 랜딩페이지 불일치 | 경쟁사 비교 우위표 배치 |
| **DA** (배너) | Fat Finger(오클릭) 또는 저품질 지면 | Burn Pixel(구매자 제외) 적용 |
| **SNS** (소셜) | 광고 소재와 랜딩페이지 톤앤매너 불일치 | 긴급성 트리거(한정수량, 마감임박) |
| **CRM** (고객) | 메시지 제목과 본문 혜택 불일치 | 재구매/등급별 혜택 제안 |
| **PR** (홍보) | 전용 랜딩페이지 부재 | 언론 보도/Trustmark 강조 |
| **Organic** | 페이지 로딩 속도/모바일 UX 문제 | 회원가입 절차 간소화 |
| **etc** | UTM 파라미터 설정 점검 | 상세 로그 분석으로 UX 개선 |

###### 카테고리 × 세그먼트 액션 매트릭스 (CATEGORY_SEGMENT_ACTIONS) - v2.6

> **핵심 개선**: 카테고리와 세그먼트 조합별 3단계 액션(primary, secondary, ab_test)을 제공하여 정밀한 마케팅 처방 가능

```python
CATEGORY_SEGMENT_ACTIONS = {
    ('SA', 'activation_drop'): {
        'primary': "검색어 의도(Intent)와 랜딩페이지 불일치. T&D(Title & Description) 점검 필요.",
        'secondary': "품질점수(QS) 개선을 위해 키워드-광고문구-랜딩 일관성 확보",
        'ab_test': "헤드라인 A/B 테스트: 혜택 강조 vs 문제 해결형"
    },
    ('DA', 'checkout_friction'): {
        'primary': "이미 구매한 상품이 노출되거나 관심 없는 상품 추천 중.",
        'secondary': "리타겟팅 모수에 Burn Pixel(구매자 제외) 적용",
        'ab_test': "크리에이티브 A/B 테스트: 상품 이미지 vs 라이프스타일 이미지"
    },
    ('SNS', 'engagement_gap'): {
        'primary': "피드 스크롤 중 유입된 저관여 유저. 관심 유도 콘텐츠 부족.",
        'secondary': "인터랙티브 요소(퀴즈, 스와이프) 또는 숏폼 영상 추가",
        'ab_test': "콘텐츠 A/B 테스트: 정적 이미지 vs 동적 캐러셀"
    },
    # ... 총 18개 카테고리×세그먼트 조합 정의
}
```

| Category | activation_drop | checkout_friction | engagement_gap |
|----------|-----------------|-------------------|----------------|
| **SA** | T&D 점검, 품질점수 개선 | 경쟁사 비교표 배치 | 카테고리 구조 점검 |
| **DA** | 오클릭 방지, 지면 품질 점검 | Burn Pixel 적용 | CTA 추가, 딥링크 연결 |
| **SNS** | 톤앤매너 일치 점검 | FOMO 요소 추가 | 인터랙티브 콘텐츠 |
| **CRM** | 제목-본문 일치 점검 | 재구매 혜택 제안 | 개인화 추천 강화 |
| **Organic** | 로딩 속도/모바일 UX | 간편 로그인 도입 | 콘텐츠 하단 CTA 추가 |

###### 긴급도 점수 계산 (Urgency Score) - v2.6

> 알림의 우선순위를 0-100점으로 정량화하여 '긴급 개선' 탭에서 중요도 순으로 정렬

```python
def calculate_urgency_score(alert, channel_metrics, avg_metrics):
    """[긴급도 점수] 알림의 우선순위 점수 계산 (0-100)"""
    score = 0

    # 1. Severity 기본 점수 (40점 만점)
    severity_scores = {'critical': 40, 'high': 30, 'medium': 20, 'opportunity': 10}
    score += severity_scores.get(alert.get('severity', 'medium'), 20)

    # 2. Traffic Volume 가중치 (30점 만점)
    traffic = channel_metrics.get('acquisition', 0)
    traffic_ratio = traffic / avg_metrics.get('avg_traffic', 1)
    score += min(30, int(traffic_ratio * 15))

    # 3. Gap 심각도 (20점 만점)
    gap = alert.get('benchmark', {}).get('gap', 0)
    score += min(20, int(abs(gap) * 2))

    # 4. 잠재 손실 규모 (10점 만점)
    impact = alert.get('impact', {})
    if impact.get('potential_revenue', 0) > 1000000:
        score += 10
    elif impact.get('lost_users', 0) > 100:
        score += 7

    return min(round(score), 100)
```

| 점수 구성 | 배점 | 산정 기준 |
|----------|------|----------|
| Severity 기본점수 | 40점 | critical=40, high=30, medium=20, opportunity=10 |
| Traffic Volume | 30점 | 평균 대비 트래픽 비율 × 15 (최대 30) |
| Gap 심각도 | 20점 | 벤치마크 대비 Gap × 2 (최대 20) |
| 잠재 손실 규모 | 10점 | 잠재손실 > 100만원: 10점, 이탈 > 100명: 7점 |

###### 신규 JSON 출력 필드 (v2.6 확장)

```json
{
  // 마이크로 세그먼트 알림 (v2.6 확장)
  "micro_segment_alerts": [
    {
      "type": "opportunity|problem",
      "sub_type": "vip_segment|traffic_leak|checkout_friction|growth_engine|activation_drop|engagement_gap|silent_majority",
      "segment_type": "checkout_friction",
      "severity": "opportunity|high|critical|medium",
      "title": "🚧 메타 광고: 결제 장벽 감지",
      "message": "장바구니에 담았지만 결제하지 않는 고객이 많습니다.",
      "diagnosis": "[DA] 유저의 구매 결정을 막는 요소가 있습니다.",
      "action": "결제 과정 UX 점검 필요",
      "category": "DA",
      "metrics": { "rpv": 15000, "cvr": 0.8 },

      // ===== v2.6 신규 필드 =====
      "urgency_score": 81,           // 긴급도 점수 (0-100)
      "priority_rank": 1,            // 우선순위 순위 (1부터 시작)
      "impact": {                    // 영향 추정
        "lost_users": 150,           // 이탈 추정 인원
        "potential_revenue": 1500000 // 잠재 손실 금액 (원)
      },
      "benchmark": {                 // 벤치마크 비교
        "channel_avg": 5.8,          // 채널 평균값
        "your_value": 8.5,           // 해당 채널 값
        "gap": 2.8                   // Gap (양수: 초과, 음수: 미달)
      },
      "action_detail": {             // 3단계 상세 액션
        "primary": "이미 구매한 상품이 노출되거나 관심 없는 상품 추천 중.",
        "secondary": "리타겟팅 모수에 Burn Pixel(구매자 제외) 적용",
        "ab_test": "크리에이티브 A/B 테스트: 상품 이미지 vs 라이프스타일 이미지"
      }
    }
  ],
  // 채널별 확장 메트릭스
  "channel_metrics_enhanced": {
    "채널명": {
      "category": "DA",
      "rpv": 15000,
      "rpv_log": 9.62,
      "traffic_rank_pct": 0.85,
      "segment_type": "vip_segment"
    }
  },
  // 동적 임계값 (현재 데이터 기준)
  "dynamic_thresholds": {
    "traffic_high": 500,
    "traffic_low": 100,
    "rpv_high": 12000,
    "rpv_low": 3000
  }
}
```

###### 프론트엔드 통합 (긴급 개선 탭)

> **v2.6 변경**: '긴급 개선' 탭이 `urgent_alerts` 대신 `micro_segment_alerts`의 problem 유형을 사용

```javascript
// updateUrgentAlerts() - funnel_dashboard.html
function updateUrgentAlerts() {
    const periodData = getPeriodData();

    // micro_segment_alerts에서 problem 유형만 필터링
    const microAlerts = periodData?.micro_segment_alerts || [];
    const problemAlerts = microAlerts
        .filter(a => a.type === 'problem')
        .sort((a, b) => (b.urgency_score || 0) - (a.urgency_score || 0));  // 긴급도 순 정렬

    // 심각도별로 그룹화
    urgentAlertsData.high = problemAlerts.filter(a => ['critical', 'high'].includes(a.severity));
    urgentAlertsData.medium = problemAlerts.filter(a => a.severity === 'medium');
}
```

| 탭 | 데이터 소스 | 필터 조건 |
|---|------------|----------|
| **즉시 조치** (high) | micro_segment_alerts | type='problem' AND severity IN ('critical', 'high') |
| **개선 권장** (medium) | micro_segment_alerts | type='problem' AND severity='medium' |

### 5.3 페르소나 기반 액션 가이드

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

### 5.4 인사이트 유형별 JSON 구조

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

### 5.5 MCP 통합 활용 가이드

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
| 2024-12-18 | v2.1 | 유형구분_통합 기반 KPI 분기 상세 기재 (트래픽: CPC, 전환: ROAS) |
| 2024-12-18 | v2.2 | 다중 기간 스크립트 섹션 추가, insight_generator.py Alert/Opportunity Trigger 조건 상세화 |
| 2025-12-26 | v2.3 | 섹션 5.2에 insight_generator.py 및 generate_funnel_data.py의 Alert/Opportunity/BCG Matrix/이탈예측 Trigger 조건 추가 |
| 2025-12-26 | v2.4 | **[Upgrade Guide 반영]** 마이크로 세그먼트 분석 추가 (RPV, 동적 임계값, 카테고리별 처방) |
| 2025-12-26 | v2.5 | 섹션 3.3 추가: generate_funnel_data_multiperiod.py (다중 기간 퍼널 분석) |
| 2025-12-26 | v2.6 | **[urgent_alerts 통합]** micro_segment_alerts로 긴급 개선 탭 데이터 소스 통합. 신규 세그먼트 3개 추가 (activation_drop, engagement_gap, silent_majority). CATEGORY_SEGMENT_ACTIONS 매트릭스, urgency_score 계산 로직, impact/benchmark/action_detail 필드 추가 |
| 2025-12-26 | v2.7 | **[4분면 매트릭스]** generate_type_insights.py에 Efficiency-Scale Matrix(4분면) 도입. TypeMicroAnalyzer 클래스, DIMENSION_ADVICE_MAP, MATRIX_THRESHOLDS 추가. 성별/연령/기기별 상대 평가 기반 인사이트 생성. type_dashboard.html에 4분면 시각화 및 추천 액션 표시 |
| 2025-12-26 | v2.8 | **[Forecast Matrix]** insight_generator.py에 Forecast Matrix(4분면) 도입. InsightMicroAnalyzer 클래스, ADVICE_CONTEXT_MAP, FORECAST_MATRIX_THRESHOLDS 추가. 현재 효율 × 예측 성장률 기반 세그먼트 분류 (Super Star, Fading Hero, Rising Potential, Problem Child). matrix_insights JSON 필드 추가 |
