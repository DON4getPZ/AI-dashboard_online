# generate_funnel_data.py 상세 가이드

> GA4 기반 AARRR 퍼널 분석 및 인사이트 생성

## 개요

| 항목 | 내용 |
|-----|------|
| **파일 위치** | `scripts/generate_funnel_data.py` |
| **출력 파일** | `data/funnel/insights.json` |
| **코드 라인** | 약 460줄 |
| **의존성** | pandas, numpy, scipy, sklearn |
| **고급 분석** | A/B 테스트, K-Means 클러스터링, 이탈 예측 |

---

## 입력 데이터

### 필수 파일
```
data/GA4/
└── 2025-11.csv    # GA4 퍼널 이벤트 데이터
```

### 필수 컬럼
| 컬럼명 | 설명 | 예시 |
|-------|------|------|
| `Day` | 일자 | 2024-11-01 |
| `week` | 주 시작일 | 2024-10-28 |
| `funnel` | 퍼널 단계 | 유입, 활동, 관심, 결제진행, 구매완료 |
| `channel` | 유입 채널 | Organic, Paid, Direct |
| `Session campaign` | 캠페인명 | winter_sale_2024 |
| `Total users` | 총 사용자 | 1000 |
| `New users` | 신규 사용자 | 300 |
| `Event count` | 이벤트 수 | 5000 |
| `Event value` | 이벤트 값 (매출) | 15000000 |
| `Sessions` | 세션 수 | 1200 |

---

## 퍼널 단계 정의 (라인 23-29)

```python
FUNNEL_MAPPING = {
    '유입': 'Acquisition',      # 웹사이트 방문
    '활동': 'Activation',       # 페이지 탐색, 상품 조회
    '관심': 'Consideration',    # 장바구니 담기
    '결제진행': 'Conversion',   # 결제 페이지 진입
    '구매완료': 'Purchase'      # 구매 완료
}
```

**단계 추가/수정 예시:**
```python
FUNNEL_MAPPING = {
    '유입': 'Acquisition',
    '회원가입': 'Registration',   # 새 단계 추가
    '활동': 'Activation',
    '관심': 'Consideration',
    '결제진행': 'Conversion',
    '구매완료': 'Purchase',
    '재구매': 'Retention'         # 새 단계 추가
}
```

---

## 출력 데이터

### CSV 파일
```
data/funnel/
├── daily_funnel.csv      # 일별 퍼널 집계
├── weekly_funnel.csv     # 주별 퍼널 집계
├── channel_funnel.csv    # 채널별 퍼널
├── campaign_funnel.csv   # 캠페인별 퍼널 (상위 20개)
├── new_vs_returning.csv  # 신규/재방문 비교
└── insights.json         # 인사이트 JSON
```

---

## 분석 모듈별 상세

### 1. 일별/주별 퍼널 집계 (라인 31-83)

**출력 CSV 구조:**
```csv
Day,유입,활동,관심,결제진행,구매완료,CVR
2024-11-01,10000,5000,2000,500,300,3.0
2024-11-02,9500,4800,1900,480,290,3.05
```

**CVR 계산 (라인 56):**
```python
daily_funnel_pivot['CVR'] = (daily_funnel_pivot['구매완료'] / daily_funnel_pivot['유입'] * 100).fillna(0)
```

---

### 2. 채널별 퍼널 분석 (라인 85-111)

**출력 예시:**
```csv
channel,유입,활동,관심,결제진행,구매완료,Revenue,CVR
Organic Search,5000,2500,1000,250,150,7500000,3.0
Paid Search,3000,1500,600,150,90,4500000,3.0
Direct,2000,1000,400,100,60,3000000,3.0
```

---

### 3. 기본 인사이트 (라인 155-224)

**summary 구조:**
```json
{
  "summary": {
    "total_acquisition": 10000,
    "total_activation": 5000,
    "total_consideration": 2000,
    "total_conversion": 500,
    "total_purchase": 300,
    "total_revenue": 15000000,
    "overall_cvr": 3.0
  }
}
```

---

### 4. 퍼널 이탈 알림 (라인 205-224)

**알림 기준:**
| 전환 | 기준 | 심각도 |
|-----|------|--------|
| 유입→활동 | < 50% | high |
| 관심→구매 | < 20% | medium |

**코드 위치:** 라인 208-224
```python
# 유입→활동 전환율 경고
if activation_rate < 50:
    alerts.append({
        'type': 'low_activation',
        'message': f'유입→활동 전환율이 {activation_rate:.1f}%로 낮습니다. 랜딩페이지 최적화가 필요합니다.',
        'severity': 'high'
    })

# 관심→구매 전환율 경고
if purchase_from_consideration < 20:
    alerts.append({
        'type': 'low_consideration_conversion',
        'message': f'장바구니→구매 전환율이 {purchase_from_consideration:.1f}%로 낮습니다. 결제 프로세스 개선이 필요합니다.',
        'severity': 'medium'
    })
```

**수정 예시:**
```python
# 더 엄격한 기준
if activation_rate < 60:  # 50 → 60
    severity = 'high'
    message = '유입→활동 전환율이 낮습니다. UX 개선이 시급합니다.'

if purchase_from_consideration < 30:  # 20 → 30
    severity = 'high'  # medium → high
    message = '장바구니 이탈률이 높습니다. 결제 프로세스를 점검하세요.'
```

---

### 5. A/B 테스트 - 카이제곱 검정 (라인 250-289)

**분석 내용:**
- 채널 간 전환율 비교
- 통계적 유의성 검정 (p-value < 0.05)

**출력 구조:**
```json
{
  "ab_test_results": [
    {
      "type": "channel_comparison",
      "group_a": "Organic Search",
      "group_b": "Paid Search",
      "metric": "conversion_rate",
      "chi2_statistic": 12.5,
      "p_value": 0.0004,
      "significant": true,
      "cvr_a": 3.0,
      "cvr_b": 2.5
    }
  ]
}
```

**유의수준 변경 (라인 282):**
```python
# 현재: p < 0.05
'significant': bool(float(p_value) < 0.05)

# 더 엄격하게 (p < 0.01)
'significant': bool(float(p_value) < 0.01)

# 더 관대하게 (p < 0.10)
'significant': bool(float(p_value) < 0.10)
```

**최소 샘플 크기 변경 (라인 272):**
```python
# 현재: 최소 5
if contingency_table.min() > 5:

# 더 엄격하게: 최소 10
if contingency_table.min() > 10:
```

---

### 6. K-Means 클러스터링 (라인 291-341)

**클러스터링 특성:**
- 활동 전환율
- 관심 전환율
- 결제진행 전환율
- 구매완료 전환율
- CVR
- ARPU (사용자당 매출)

**출력 구조:**
```json
{
  "channel_clusters": {
    "n_clusters": 3,
    "clusters": {
      "cluster_0": ["Organic Search", "Direct"],
      "cluster_1": ["Paid Search", "Email"],
      "cluster_2": ["Social", "Referral"]
    },
    "description": {
      "cluster_0": "고성과 채널",
      "cluster_1": "중간 성과 채널",
      "cluster_2": "저성과 채널"
    }
  }
}
```

**클러스터 수 변경 (라인 318):**
```python
# 현재: 3개 클러스터
n_clusters = min(3, len(channel_names))

# 4개 클러스터로 변경
n_clusters = min(4, len(channel_names))
```

**클러스터 설명 커스터마이징 (라인 333-337):**
```python
# 현재
'description': {
    'cluster_0': '고성과 채널',
    'cluster_1': '중간 성과 채널',
    'cluster_2': '저성과 채널'
}

# 변경 예시
'description': {
    'cluster_0': '핵심 수익 채널',
    'cluster_1': '성장 가능 채널',
    'cluster_2': '효율 개선 필요 채널',
    'cluster_3': '테스트 채널'  # 4개일 때
}
```

---

### 7. 이탈/개선 예측 (라인 343-426)

**분석 기간:**
| 기간 | 최근 | 이전 | 최소 데이터 |
|-----|------|------|-----------|
| 7일 | 최근 7일 | 그 전 7일 | 14일 |
| 30일 | 최근 30일 | 그 전 30일 | 60일 |

**판단 기준 (라인 363-384):**
```python
# 20% 이상 감소 → 이탈 위험
if change_pct < -20:
    risk_level = 'high' if change_pct < -30 else 'medium'
    recommendation = f'{funnel_stage} 단계의 사용자 이탈이 증가하고 있습니다. 마케팅 캠페인 점검이 필요합니다.'

# 20% 이상 증가 → 성과 개선
elif change_pct > 20:
    improvement_level = 'high' if change_pct > 30 else 'medium'
    recommendation = f'{funnel_stage} 단계의 성과가 개선되고 있습니다. 현재 전략을 유지하고 확대하세요.'
```

**출력 구조:**
```json
{
  "churn_predictions_7d": [
    {
      "stage": "활동",
      "period": "7d",
      "risk_level": "high",
      "change_pct": -35.5,
      "recent_avg": 3200,
      "previous_avg": 4960,
      "recommendation": "활동 단계의 사용자 이탈이 증가하고 있습니다. 마케팅 캠페인 점검이 필요합니다."
    }
  ],
  "improvement_predictions_7d": [
    {
      "stage": "구매완료",
      "period": "7d",
      "improvement_level": "medium",
      "change_pct": 25.3,
      "recent_avg": 320,
      "previous_avg": 255,
      "recommendation": "구매완료 단계의 성과가 개선되고 있습니다. 현재 전략을 유지하고 확대하세요."
    }
  ],
  "churn_predictions_30d": [...],
  "improvement_predictions_30d": [...]
}
```

**기준값 변경 예시:**
```python
# 더 민감하게 (10% 기준)
if change_pct < -10:  # -20 → -10
    risk_level = 'high' if change_pct < -20 else 'medium'  # -30 → -20

elif change_pct > 10:  # 20 → 10
    improvement_level = 'high' if change_pct > 20 else 'medium'  # 30 → 20
```

---

## 출력 JSON 전체 구조

```json
{
  "generated_at": "2024-11-28T10:00:00",
  "summary": {
    "total_acquisition": 10000,
    "total_activation": 5000,
    "total_consideration": 2000,
    "total_conversion": 500,
    "total_purchase": 300,
    "total_revenue": 15000000,
    "overall_cvr": 3.0
  },
  "overall": {
    "current_period": {
      "start_date": "2024-11-01",
      "end_date": "2024-11-30",
      "total_acquisition": 10000,
      "total_activation": 5000,
      "total_consideration": 2000,
      "total_conversion": 500,
      "total_purchase": 300,
      "total_revenue": 15000000,
      "overall_cvr": 3.0
    },
    "trend": {
      "direction": "stable"
    }
  },
  "top_channels": [
    {
      "name": "Organic Search",
      "purchases": 150,
      "revenue": 7500000
    }
  ],
  "top_campaigns": [
    {
      "name": "winter_sale_2024",
      "purchases": 80,
      "revenue": 4000000
    }
  ],
  "alerts": [
    {
      "type": "low_activation",
      "message": "유입→활동 전환율이 45.0%로 낮습니다...",
      "severity": "high"
    }
  ],
  "ab_test_results": [...],
  "channel_clusters": {...},
  "churn_predictions_7d": [...],
  "churn_predictions_30d": [...],
  "improvement_predictions_7d": [...],
  "improvement_predictions_30d": [...],
  "churn_predictions": [...],  // 하위 호환 (7일 데이터)
  "details": {
    "total_channels": 6,
    "total_campaigns": 20,
    "analysis_period_days": 30,
    "ab_tests_conducted": 15,
    "significant_ab_tests": 5,
    "churn_risk_stages_7d": 2,
    "churn_risk_stages_30d": 1,
    "improvement_stages_7d": 1,
    "improvement_stages_30d": 2
  }
}
```

---

## 자주 사용하는 수정 예시

### 1. 새로운 퍼널 단계 추가
```python
# 라인 23-29 수정
FUNNEL_MAPPING = {
    '유입': 'Acquisition',
    '회원가입': 'Registration',  # 추가
    '활동': 'Activation',
    '관심': 'Consideration',
    '결제진행': 'Conversion',
    '구매완료': 'Purchase'
}

# 라인 50 수정
funnel_order = ['유입', '회원가입', '활동', '관심', '결제진행', '구매완료']
```

### 2. 입력 파일 경로 변경
```python
# 라인 16 - 동적 파일명 사용
import datetime
current_month = datetime.datetime.now().strftime('%Y-%m')
df = pd.read_csv(f'../data/GA4/{current_month}.csv', encoding='utf-8-sig')
```

### 3. 상위 캠페인 개수 변경
```python
# 라인 120 - 상위 20개 → 30개
top_campaigns = df[df['funnel'] == '유입'].groupby('Session campaign')['Total users'].sum().nlargest(30).index
```

### 4. 새로운 알림 타입 추가
```python
# 라인 224 이후에 추가
# 신규 사용자 비율 알림
new_user_ratio = df['New users'].sum() / df['Total users'].sum() * 100
if new_user_ratio < 20:
    insights['alerts'].append({
        'type': 'low_new_users',
        'message': f'신규 사용자 비율이 {new_user_ratio:.1f}%로 낮습니다. 신규 유입 확대가 필요합니다.',
        'severity': 'medium'
    })
```

### 5. 클러스터별 권장 액션 추가
```python
# 라인 337 이후에 추가
insights['channel_clusters']['recommendations'] = {
    'cluster_0': '현재 투자 수준 유지 및 모니터링',
    'cluster_1': '성과 개선 가능성 테스트 - 예산 10% 증액',
    'cluster_2': '효율 분석 후 예산 재배분 검토'
}
```

---

## 실행 및 테스트

```bash
# 실행
python scripts/generate_funnel_data.py

# 출력 확인
cat data/funnel/insights.json | python -m json.tool
```

**로그 출력 예시:**
```
✅ 퍼널 데이터 생성 완료
  - 일별 퍼널: 30 rows
  - 주별 퍼널: 5 rows
  - 채널별 퍼널: 6 rows
  - 캠페인별 퍼널: 20 rows
  - 전체 CVR: 3.0%

📊 고급 분석:
  - A/B 테스트: 15개 수행 (유의미: 5개)
  - 채널 클러스터: 3개 그룹
  - 이탈 위험 (7일): 2개 / (30일): 1개
  - 성과 개선 (7일): 1개 / (30일): 2개
  - 분석 기간: 2024-11-01 ~ 2024-11-30
```

---

## 대시보드 연동

### funnel_dashboard.html에서 사용
```javascript
// insights.json 로드
fetch('data/funnel/insights.json')
  .then(response => response.json())
  .then(data => {
    // 요약 표시
    document.getElementById('total-cvr').textContent = data.summary.overall_cvr + '%';

    // 알림 표시
    data.alerts.forEach(alert => {
      showAlert(alert.message, alert.severity);
    });

    // A/B 테스트 결과
    const significantTests = data.ab_test_results.filter(t => t.significant);
    renderABTestResults(significantTests);

    // 클러스터 시각화
    renderClusterChart(data.channel_clusters);
  });
```

---

## 통계 분석 참고

### 카이제곱 검정 해석
| p-value | 해석 |
|---------|------|
| < 0.01 | 매우 유의미한 차이 |
| < 0.05 | 유의미한 차이 |
| < 0.10 | 약한 유의미성 |
| ≥ 0.10 | 유의미하지 않음 |

### K-Means 클러스터링 해석
- **cluster_0**: 전환율, CVR, ARPU 모두 높음 → 핵심 채널
- **cluster_1**: 중간 수준 → 성장 가능 채널
- **cluster_2**: 낮은 수준 → 효율 개선 필요
