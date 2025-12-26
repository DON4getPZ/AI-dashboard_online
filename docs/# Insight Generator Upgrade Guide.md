# Insight Generator Upgrade Guide (`insight_generator.py`)

> **목적:** 정적 임계값(Static Threshold) 방식을 탈피하고, **Prophet 예측(미래)**과 **현재 성과(현재)**를 결합하여 입체적인 세그먼트 진단을 수행합니다.
> **핵심:** **Forecast Matrix (4분면 분석)** 도입 및 세그먼트 유형별(Brand, Product, Channel) 맞춤 처방 강화.

---

## 1. 핵심 개선 전략

| 구분 | 기존 (Legacy) | 변경 (Advanced) |
| :--- | :--- | :--- |
| **평가 기준** | 절대 평가 (예: ROAS > 300%) | **상대 평가** (예: 해당 그룹 내 상위 30%) |
| **분석 차원** | 단일 차원 (현재 효율 OR 등락폭) | **매트릭스 분석** (현재 효율 × **미래 성장률**) |
| **세그먼트 분류** | 단순 나열 (Scale Up, Hidden Gem) | **4분면 진단** (Super Star, Fading Hero, Rising Potential, Problem Child) |
| **액션 제안** | 일반적 조언 | **세그먼트 유형별(Brand/Product/Channel) 전문 처방** |

---

## 2. 분석 매트릭스 정의 (Forecast Matrix)

**X축(현재 효율)**과 **Y축(예측 성장률)**을 기준으로 4가지 마이크로 세그먼트를 정의합니다.

| 구분 | **고성장 예측 (Forecast ▲)** | **역성장 예측 (Forecast ▼)** |
| :--- | :--- | :--- |
| **고효율**<br>(High ROAS) | **🚀 Super Star (슈퍼스타)**<br>현재도 잘하고 미래도 밝음.<br>**Action:** 예산 공격적 증액 및 점유율 확대 | **🛡️ Fading Hero (지는 해)**<br>돈은 잘 벌지만 하락세 진입.<br>**Action:** 신규 소재 수혈, 단가 방어, 리브랜딩 |
| **저효율**<br>(Low ROAS) | **🌱 Rising Potential (유망주)**<br>효율은 낮지만 트렌드가 뜸.<br>**Action:** 테스트 예산 투입, 상세페이지/CRO 최적화 | **🗑️ Problem Child (문제아)**<br>효율도 낮고 전망도 어두움.<br>**Action:** 과감한 예산 삭감, 구조조정, 품절 처리 |

---

## 3. 신규 변수 및 지표 정의 (Internal Metrics)

DB 설정 없이, 데이터 프레임 내부에서 계산해야 할 필수 파생 변수입니다.

### 3.1 파생 변수 (Calculated Variables)

| 변수명 | 계산식 / 로직 | 용도 |
| :--- | :--- | :--- |
| **`efficiency_score`** | `ROAS` (결측 시 0) 또는 `1/CPA` (정규화 필요) | 현재 성과(X축) 판단 기준 |
| **`forecast_growth_rate`** | `(forecast_total - current_total) / current_total` | 미래 성장성(Y축) 판단 기준 |
| **`revenue_impact_share`** | `current_revenue / sum(total_revenue)` | **Core Risk** (심각한 문제아) 식별용 |
| **`segment_context`** | `brand`, `product`, `channel`, `promotion` | 맞춤형 조언(Advice) 매핑 키 |

### 3.2 동적 임계값 (Dynamic Thresholds)

전체 세그먼트 데이터의 분포를 기반으로 상대적인 우위를 판단합니다.

| 임계값 변수 | 기준 (Default) | 설명 |
| :--- | :--- | :--- |
| **`th_eff_high`** | `efficiency_score`의 **상위 30% (Quantile 0.7)** | 고효율 기준선 |
| **`th_eff_low`** | `efficiency_score`의 **하위 30% (Quantile 0.3)** | 저효율 기준선 |
| **`th_growth_high`** | **+5.0%** (0.05) | 유의미한 성장 기준 (절대값 권장) |
| **`th_growth_low`** | **-5.0%** (-0.05) | 유의미한 하락 기준 (절대값 권장) |
| **`th_impact_core`** | **10.0%** (0.1) | 전체 매출의 10% 이상 차지 시 '핵심 세그먼트'로 간주 |

---

## 4. 세그먼트 유형별 맞춤 처방 (Advice Context Map)

`segment_context`에 따라 AI의 조언을 다르게 매핑합니다. (하드코딩된 딕셔너리 구조)

### 4.1 ADVICE_CONTEXT_MAP

```python
ADVICE_CONTEXT_MAP = {
    # 1. 브랜드 (Brand) 관점
    'brand': {
        'super_star': "브랜드 인지도가 상승세입니다. 경쟁사 키워드 점유율을 높여 시장을 장악하세요.",
        'fading_hero': "브랜드 노후화가 우려됩니다. 리브랜딩 캠페인이나 콜라보레이션으로 신선함을 주세요.",
        'rising_potential': "니치(Niche) 마켓에서 반응이 오고 있습니다. 해당 타겟을 위한 전용 랜딩페이지를 만드세요.",
        'problem_child': "브랜드 매력도가 떨어졌습니다. 할인보다는 브랜드 스토리텔링을 다시 점검해야 합니다."
    },
    # 2. 상품 (Product) 관점
    'product': {
        'super_star': "메인 배너와 추천 영역 1순위에 배치하세요. 재고 부족(OOS)을 미리 대비해야 합니다.",
        'fading_hero': "제품 수명 주기(PLC)가 쇠퇴기입니다. 번들(Bundle) 구성으로 객단가를 높여 수익을 방어하세요.",
        'rising_potential': "상세페이지 개선(CRO)이 시급합니다. 유입은 늘고 있으니 구매 전환만 잡으면 터집니다.",
        'problem_child': "악성 재고가 될 위험이 큽니다. 클리어런스 세일로 재고를 털어내세요."
    },
    # 3. 채널 (Channel) 관점
    'channel': {
        'super_star': "가장 확실한 수익원입니다. 예산 한도(Cap)를 풀고 ROAS가 꺾일 때까지 증액하세요.",
        'fading_hero': "채널 내 경쟁 강도가 높아졌습니다(CPC 상승). 소재 차별화로 CTR을 높여 비용을 낮추세요.",
        'rising_potential': "아직 최적화 단계입니다. 자동 입찰(Target ROAS) 머신러닝이 완료될 때까지 기다리세요.",
        'problem_child': "타겟팅이 너무 넓거나 좁습니다. 타겟 모수를 전면 재검토하거나 채널을 OFF 하세요."
    },
    # 4. 프로모션 (Promotion) 관점
    'promotion': {
        'super_star': "대성공 프로모션입니다. 기간을 연장하거나 앵콜 기획전을 준비하세요.",
        'fading_hero': "이벤트 피로도가 쌓였습니다. 혜택 구조를 바꾸거나 새로운 메인 상품을 내세우세요.",
        'rising_potential': "입소문을 타기 시작했습니다. SNS 광고를 집중하여 트래픽을 부으세요.",
        'problem_child': "혜택이 매력적이지 않습니다. 할인율 조정보다는 '사은품'이나 '한정판' 요소를 더하세요."
    }
}

```

## 5. 구현 코드 제안 (insight_generator.py)
기존 `find_opportunities` 함수 등을 대체하거나 보강하는 클래스 모듈입니다.


```python
import pandas as pd
import numpy as np

class InsightMicroAnalyzer:
    def __init__(self):
        # 상단에 정의된 Advice Map 로드
        self.advice_map = ADVICE_CONTEXT_MAP

    def _calculate_metrics(self, df):
        """
        [지표 계산] 효율성, 예측 성장률, 매출 비중 계산
        Input df: Prophet 예측(forecast_total)과 실제(current_total)가 병합된 DataFrame
        """
        # 1. 효율성 점수 (ROAS 기준, 결측치 0 처리)
        # CPA 기반일 경우: 1 / df['cpa'] 로 변환 필요
        df['efficiency_score'] = df['roas'].fillna(0)
        
        # 2. 예측 성장률 (Forecast Growth Rate)
        # 0 나누기 방지 (replace 0 with 1)
        df['forecast_growth_rate'] = (
            (df['forecast_total'] - df['current_total']) / 
            df['current_total'].replace(0, 1)
        )
        
        # 3. 매출 비중 (Revenue Impact Share)
        total_rev = df['current_revenue'].sum()
        df['revenue_impact_share'] = (
            df['current_revenue'] / total_rev 
            if total_rev > 0 else 0
        )
        
        return df

    def _get_dynamic_thresholds(self, df):
        """
        [동적 임계값] 현재 데이터셋 내에서의 상대적 위치(Quantile) 산출
        """
        return {
            'th_eff_high': df['efficiency_score'].quantile(0.7), # 상위 30%
            'th_eff_low': df['efficiency_score'].quantile(0.3),  # 하위 30%
            'th_growth_high': 0.05,  # 성장률 +5% 이상 (절대기준)
            'th_growth_low': -0.05,  # 역성장 -5% 이하 (절대기준)
            'th_impact_core': 0.10   # 매출 비중 10% 이상 (절대기준)
        }

    def _get_advice(self, context, matrix_type):
        """
        [전문가 진단] Context x Matrix Type 맞춤 조언 반환
        """
        return self.advice_map.get(context, {}).get(matrix_type, "상세 리포트를 확인하고 전략을 수립하세요.")

    def generate_matrix_insights(self, df, segment_context='channel'):
        """
        [메인 로직] Forecast Matrix 기반 마이크로 인사이트 생성
        """
        # 1. 지표 계산 및 임계값 설정
        df = self._calculate_metrics(df)
        th = self._get_dynamic_thresholds(df)
        
        insights = []

        for _, row in df.iterrows():
            name = row['segment_name']
            eff = row['efficiency_score']
            growth = row['forecast_growth_rate']
            impact = row['revenue_impact_share']
            
            matrix_type = None
            severity = 'medium'
            
            # ---------------------------------------------------------
            # Quadrant 1: Super Star (고효율 + 고성장)
            # ---------------------------------------------------------
            if (eff >= th['th_eff_high']) and (growth >= th['th_growth_high']):
                matrix_type = 'super_star'
                severity = 'opportunity' # Frontend Color: Green/Blue
                title = f"🚀 {name}: 초격차 슈퍼스타"
                message = f"효율(ROAS {int(eff)}%)도 좋고, 향후 {growth*100:.1f}% 성장이 예측됩니다."

            # ---------------------------------------------------------
            # Quadrant 2: Fading Hero (고효율 + 역성장)
            # ---------------------------------------------------------
            elif (eff >= th['th_eff_high']) and (growth <= th['th_growth_low']):
                matrix_type = 'fading_hero'
                severity = 'warning' # Frontend Color: Yellow
                title = f"🛡️ {name}: 지는 해 방어 필요"
                message = f"현재 효율은 좋지만, 매출이 {abs(growth)*100:.1f}% 감소할 것으로 예측됩니다."

            # ---------------------------------------------------------
            # Quadrant 3: Rising Potential (저효율 + 고성장)
            # ---------------------------------------------------------
            elif (eff <= th['th_eff_low']) and (growth >= th['th_growth_high']):
                matrix_type = 'rising_potential'
                severity = 'opportunity' # Frontend Color: Blue
                title = f"🌱 {name}: 잠재력 폭발 직전"
                message = f"효율은 아직 낮지만, 트렌드가 상승세({growth*100:.1f}%)를 탔습니다."

            # ---------------------------------------------------------
            # Quadrant 4: Problem Child (저효율 + 역성장)
            # ---------------------------------------------------------
            elif (eff <= th['th_eff_low']) and (growth <= th['th_growth_low']):
                matrix_type = 'problem_child'
                severity = 'high' # Frontend Color: Red
                
                # [Core Risk Check] 매출 비중이 큰데 성과가 나쁘면 Critical
                if impact >= th['th_impact_core']:
                    severity = 'critical'
                    title = f"🚨 {name}: 구조조정 시급 (Core Risk)"
                    message = f"매출 비중이 큰데({impact*100:.1f}%), 효율과 전망이 모두 나쁩니다."
                else:
                    title = f"🗑️ {name}: 성과 부진 지속"
                    message = f"효율도 낮고 전망도 어둡습니다. 예산 삭감을 검토하세요."

            # ---------------------------------------------------------
            # Insight 생성 및 추가
            # ---------------------------------------------------------
            if matrix_type:
                advice = self._get_advice(segment_context, matrix_type)
                
                insights.append({
                    'type': 'matrix_insight',
                    'sub_type': matrix_type,
                    'severity': severity,
                    'title': title,
                    'message': message,
                    'action': advice,
                    'metrics': {
                        'current_roas': int(eff),
                        'forecast_growth_pct': round(growth * 100, 1),
                        'revenue_share_pct': round(impact * 100, 1)
                    }
                })

        return insights
```


## 6. 최종 출력 JSON 예시
프론트엔드는 `metrics` 데이터를 활용해 툴팁을 표시하고, `severity`에 따라 카드 색상을 결정합니다.


```JSON

{
  "alerts": [
    {
      "type": "matrix_insight",
      "sub_type": "fading_hero",
      "severity": "warning",
      "title": "🛡️ Nike_Shoes: 지는 해 방어 필요",
      "message": "현재 효율(ROAS 450%)은 좋지만, 매출이 15.2% 감소할 것으로 예측됩니다.",
      "action": "제품 수명 주기(PLC)가 쇠퇴기입니다. 번들(Bundle) 구성으로 객단가를 높여 수익을 방어하세요.",
      "metrics": {
        "current_roas": 450,
        "forecast_growth_pct": -15.2,
        "revenue_share_pct": 12.5
      }
    },
    {
      "type": "matrix_insight",
      "sub_type": "problem_child",
      "severity": "critical",
      "title": "🚨 Adidas_Old: 구조조정 시급 (Core Risk)",
      "message": "매출 비중이 큰데(14.2%), 효율과 전망이 모두 나쁩니다.",
      "action": "악성 재고가 될 위험이 큽니다. 클리어런스 세일로 재고를 털어내세요.",
      "metrics": {
        "current_roas": 80,
        "forecast_growth_pct": -22.4,
        "revenue_share_pct": 14.2
      }
    }
  ]
}
```