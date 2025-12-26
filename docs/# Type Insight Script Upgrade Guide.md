# Type Insight Script Upgrade Guide (`generate_type_insights.py`)

> **목적:** 절대적인 ROAS 기준 평가를 넘어, **그룹 내 상대 평가**와 **효율×규모 매트릭스**를 도입하여 차원별(성별/연령/기기) 최적화 전략을 제시합니다.
> **핵심:** **Efficiency-Scale Matrix (4분면)** 도입 및 분석 차원(Dimension)별 맞춤형 액션 강화.

---

## 1. 핵심 개선 전략

| 구분 | 기존 (Legacy) | 변경 (Advanced) |
| :--- | :--- | :--- |
| **평가 기준** | 절대 평가 (예: ROAS > 500%) | **상대 평가** (예: 해당 그룹 내 상위 20%) |
| **분석 차원** | 단일 지표 (ROAS or CPA) | **매트릭스 분석** (효율 지표 × **지출 규모**) |
| **세그먼트 분류** | 단순 등급 (우수, 양호, 미흡) | **4분면 진단** (Core Driver, Efficiency Star, Budget Bleeder, Underperformer) |
| **액션 제안** | 일반적 조언 | **차원별(성별/기기/시간) 전문 처방** |

---

## 2. 분석 매트릭스 정의 (Efficiency-Scale Matrix)

광고 성과 분석의 핵심인 **X축(지출 규모/Scale)**과 **Y축(효율/Efficiency)**을 기준으로 4가지 유형을 정의합니다.

> **Note:** 효율 지표는 캠페인 목적에 따라 `ROAS`(전환) 또는 `1/CPC`(트래픽)를 사용합니다.

| 구분 | **고효율 (High Efficiency)** | **저효율 (Low Efficiency)** |
| :--- | :--- | :--- |
| **고지출**<br>(High Spend) | **👑 Core Driver (핵심 동력)**<br>돈도 많이 쓰고 성과도 좋음.<br>**Action:** 현재 상태 유지 및 예산 우선 배정 | **💸 Budget Bleeder (예산 누수)**<br>돈은 많이 쓰는데 성과는 나쁨.<br>**Action:** 즉시 감액, 소재/타겟 전면 수정 |
| **저지출**<br>(Low Spend) | **💎 Efficiency Star (효율 스타)**<br>돈은 적게 쓰는데 성과는 좋음.<br>**Action:** 예산 증액하여 Scale-up 시도 | **💤 Underperformer (성과 미달)**<br>돈도 적게 쓰고 성과도 나쁨.<br>**Action:** 소재 테스트 후 OFF 또는 제외 처리 |

---

## 3. 신규 변수 및 지표 정의

### 3.1 파생 변수 (Calculated Variables)

| 변수명 | 계산식 / 로직 | 용도 |
| :--- | :--- | :--- |
| **`norm_efficiency`** | 전환목적: `ROAS`<br>트래픽목적: `1 / CPC` (CPC가 낮을수록 점수 높음) | 통합 효율 점수 (높을수록 좋음) |
| **`spend_rank`** | `spend.rank(pct=True)` | 지출 규모의 상대적 위치 (0.0~1.0) |
| **`eff_rank`** | `norm_efficiency.rank(pct=True)` | 효율의 상대적 위치 (0.0~1.0) |
| **`dimension_type`** | `gender`, `age`, `device`, `platform`, `time` | 맞춤형 조언 매핑 키 |

### 3.2 동적 임계값 (Dynamic Thresholds)

데이터셋 내에서의 상대적 우위를 판단합니다.

| 임계값 변수 | 기준 (Default) | 설명 |
| :--- | :--- | :--- |
| **`th_spend_high`** | 지출 상위 40% (Quantile 0.6) | '주력 예산'으로 간주하는 기준 |
| **`th_eff_high`** | 효율 상위 30% (Quantile 0.7) | '고효율'로 간주하는 기준 |
| **`th_eff_low`** | 효율 하위 30% (Quantile 0.3) | '저효율'로 간주하는 기준 |

---

## 4. 차원별 맞춤 처방 (Dimension Advice Map)

분석하는 차원(`dimension_type`)에 따라 마케터가 수행해야 할 구체적인 액션을 매핑합니다.

### 4.1 DIMENSION_ADVICE_MAP

```python
DIMENSION_ADVICE_MAP = {
    # 1. 성별/연령 (Demographic)
    'demographic': {
        'core_driver': "가장 반응이 좋은 핵심 타겟입니다. 유사 타겟(Lookalike) 소스로 활용하여 모수를 확장하세요.",
        'efficiency_star': "효율은 검증되었습니다. 예산을 20%씩 증액하여 반응이 유지되는지 테스트하세요 (Scale-up).",
        'budget_bleeder': "광고 피로도가 높거나 핏이 안 맞습니다. 해당 타겟 전용 소재로 교체하거나 입찰가를 낮추세요.",
        'underperformer': "성과가 저조합니다. 연령/성별 제외 설정을 통해 예산 낭비를 막으세요."
    },
    # 2. 기기/플랫폼 (Device/Platform)
    'device': {
        'core_driver': "주력 매출 발생 기기입니다. 결제 UX에 문제가 없는지 주기적으로 점검하세요.",
        'efficiency_star': "잠재력이 높은 기기입니다. 특정 OS/기기 전용 입찰 전략을 테스트해보세요.",
        'budget_bleeder': "오클릭이 많거나(모바일), 결제가 불편할 수 있습니다. 랜딩페이지 최적화(LPO)가 시급합니다.",
        'underperformer': "효율이 나쁩니다. 디스플레이 광고라면 해당 기기 노출을 제외하세요."
    },
    # 3. 시간대/요일 (Time)
    'time': {
        'core_driver': "구매가 집중되는 골든타임입니다. 예산이 조기 소진되지 않도록 '광고 게재 스케줄'을 확보하세요.",
        'efficiency_star': "경쟁이 덜한 틈새 시간대일 수 있습니다. 입찰가를 조금 더 높여 점유율을 가져오세요.",
        'budget_bleeder': "전환 없이 클릭만 발생하는 시간대입니다. 시간대별 입찰 조정(Dayparting)으로 비중을 줄이세요.",
        'underperformer': "성과가 없는 시간대입니다. 광고 운영 시간에서 제외하는 것을 고려하세요."
    }
}

```

## 5. 구현 코드 제안 (`generate_type_insights.py`)

기존의 단순 성과 비교 로직을 대체하는 `TypeMicroAnalyzer` 클래스입니다.

```python
import pandas as pd
import numpy as np

class TypeMicroAnalyzer:
    def __init__(self):
        self.advice_map = DIMENSION_ADVICE_MAP

    def _calculate_metrics(self, df, objective_type='conversion'):
        """
        [지표 계산] 통합 효율 점수 및 랭킹 산출
        objective_type: 'conversion' (ROAS 중심) / 'traffic' (CPC 중심)
        """
        # 1. 통합 효율 점수 계산 (Normalized Efficiency)
        if objective_type == 'traffic':
            # CPC는 낮을수록 좋으므로 역수 취함 (0 방지)
            df['norm_efficiency'] = 1 / df['cpc'].replace(0, 0.01)
        else:
            # 기본은 ROAS
            df['norm_efficiency'] = df['roas'].fillna(0)

        # 2. 상대적 랭킹 (Quantile Rank)
        # pct=True: 0~1 사이 값으로 변환
        df['spend_rank'] = df['cost'].rank(pct=True)
        df['eff_rank'] = df['norm_efficiency'].rank(pct=True)
        
        return df

    def _get_advice(self, dim_type, matrix_type):
        """
        [전문가 진단] Dimension x Matrix Type 맞춤 조언 반환
        dim_type이 매핑에 없으면 'demographic'을 기본값으로 사용
        """
        category = dim_type if dim_type in self.advice_map else 'demographic'
        return self.advice_map.get(category, {}).get(matrix_type, "성과를 모니터링하세요.")

    def generate_dimension_insights(self, df, dimension_name, objective_type='conversion'):
        """
        [메인 로직] Dimension 별 매트릭스 인사이트 생성
        dimension_name: 'gender', 'age', 'device' 등 (Advice Map 키 결정용)
        """
        if df.empty: return []

        # 1. 지표 계산
        df = self._calculate_metrics(df, objective_type)
        
        # 2. 동적 임계값 설정 (현재 데이터 기준)
        th_spend_high = 0.6  # 지출 상위 40% 이상
        th_eff_high = 0.7    # 효율 상위 30% 이상
        th_eff_low = 0.3     # 효율 하위 30% 이하
        
        insights = []

        for _, row in df.iterrows():
            label = row['dimension_value'] # 예: '여성', '30대', 'Mobile'
            spend_r = row['spend_rank']
            eff_r = row['eff_rank']
            
            # 실제 수치 (Display용)
            display_eff = row['cpc'] if objective_type == 'traffic' else row['roas']
            
            matrix_type = None
            severity = 'medium'
            
            # ---------------------------------------------------------
            # Quadrant 1: Core Driver (고지출 + 고효율)
            # ---------------------------------------------------------
            if (spend_r >= th_spend_high) and (eff_r >= th_eff_high):
                matrix_type = 'core_driver'
                severity = 'positive' # Green
                title = f"👑 {label}: 핵심 동력 (Core Driver)"
                message = f"예산 비중이 높고 효율도 최상위권입니다. (상위 {int((1-eff_r)*100)}%)"

            # ---------------------------------------------------------
            # Quadrant 2: Efficiency Star (저지출 + 고효율)
            # ---------------------------------------------------------
            elif (spend_r < th_spend_high) and (eff_r >= th_eff_high):
                matrix_type = 'efficiency_star'
                severity = 'opportunity' # Blue
                title = f"💎 {label}: 효율 스타 (Scale-up 기회)"
                message = f"적은 예산으로 높은 효율을 내고 있습니다. 예산 증액 시 성장이 기대됩니다."

            # ---------------------------------------------------------
            # Quadrant 3: Budget Bleeder (고지출 + 저효율)
            # ---------------------------------------------------------
            elif (spend_r >= th_spend_high) and (eff_r <= th_eff_low):
                matrix_type = 'budget_bleeder'
                severity = 'high' # Red
                title = f"💸 {label}: 예산 누수 경고"
                message = f"예산은 많이 쓰는데 효율은 하위권입니다. (하위 {int(eff_r*100)}%)"

            # ---------------------------------------------------------
            # Quadrant 4: Underperformer (저지출 + 저효율)
            # ---------------------------------------------------------
            elif (spend_r < th_spend_high) and (eff_r <= th_eff_low):
                matrix_type = 'underperformer'
                severity = 'warning' # Yellow
                title = f"💤 {label}: 성과 부진"
                message = f"효율이 낮아 예산 투입 매력이 떨어집니다."

            # ---------------------------------------------------------
            # Insight 생성
            # ---------------------------------------------------------
            if matrix_type:
                # 차원 이름 매핑 (gender/age -> demographic, device -> device)
                dim_category = 'device' if 'device' in dimension_name else 'demographic'
                if 'time' in dimension_name or 'hour' in dimension_name: dim_category = 'time'
                
                advice = self._get_advice(dim_category, matrix_type)
                
                insights.append({
                    'type': 'dimension_insight',
                    'sub_type': matrix_type,
                    'dimension': dimension_name,
                    'target': label,
                    'severity': severity,
                    'title': title,
                    'message': message,
                    'action': advice,
                    'metrics': {
                        'efficiency_value': int(display_eff), # ROAS or CPC
                        'spend_rank_pct': round(spend_r, 2),
                        'eff_rank_pct': round(eff_r, 2)
                    }
                })

        return insights

```


## 6. 최종 출력 JSON 예시
Case A: 성별 분석 (전환 캠페인)

```JSON
{
  "gender_insights": [
    {
      "type": "dimension_insight",
      "sub_type": "core_driver",
      "dimension": "gender",
      "target": "여성",
      "severity": "positive",
      "title": "👑 여성: 핵심 동력 (Core Driver)",
      "message": "예산 비중이 높고 효율도 최상위권입니다. (상위 5%)",
      "action": "가장 반응이 좋은 핵심 타겟입니다. 유사 타겟(Lookalike) 소스로 활용하여 모수를 확장하세요.",
      "metrics": {
        "efficiency_value": 850,
        "spend_rank_pct": 0.95
      }
    },
    {
      "type": "dimension_insight",
      "sub_type": "budget_bleeder",
      "dimension": "gender",
      "target": "남성",
      "severity": "high",
      "title": "💸 남성: 예산 누수 경고",
      "message": "예산은 많이 쓰는데 효율은 하위권입니다. (하위 10%)",
      "action": "광고 피로도가 높거나 핏이 안 맞습니다. 해당 타겟 전용 소재로 교체하거나 입찰가를 낮추세요.",
      "metrics": {
        "efficiency_value": 120,
        "spend_rank_pct": 0.80
      }
    }
  ]
}
```