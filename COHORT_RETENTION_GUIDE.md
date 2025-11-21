# Cohort Retention 분석을 위한 GA4 데이터 요구사항

## 📋 현재 상황 요약

### ✅ 현재 가능한 분석
- 일별/주별 AARRR 퍼널 분석
- 채널별 성과 비교
- 캠페인별 전환율
- 신규 vs 재방문 비율 (집계 수준)

### ❌ 현재 불가능한 분석
- **Cohort Retention** (사용자 단위 추적 불가)
- 재구매율 (첫 구매자 추적 불가)
- Customer Lifetime Value (개별 사용자 매출 추적 불가)
- 정밀한 사용자 여정 분석

---

## 필요한 Dimensions (차원)

### 1️⃣ 필수 차원

| 차원 이름 (GA4) | 설명 | 용도 |
|----------------|------|------|
| `user_pseudo_id` | 사용자 고유 식별자 (쿠키 기반) | 개별 사용자 추적 |
| `user_id` | 로그인 사용자 ID (옵션) | 로그인 사용자 추적 |
| `event_date` | 이벤트 발생 날짜 (YYYYMMDD) | 일별 집계 |
| `event_timestamp` | 이벤트 발생 타임스탬프 (마이크로초) | 정밀한 시간 추적 |
| `event_name` | 이벤트 이름 | 행동 추적 (purchase, session_start 등) |

### 2️⃣ 코호트 정의용 차원

| 차원 이름 | GA4 필드/계산 | 설명 |
|----------|--------------|------|
| `first_visit_date` | 사용자 속성 또는 계산 | 첫 방문 날짜 |
| `first_purchase_date` | 사용자 속성 또는 계산 | 첫 구매 날짜 |
| `cohort_month` | 계산 필드 | 코호트 월 (예: 2025-01) |
| `cohort_week` | 계산 필드 | 코호트 주 (예: 2025-W01) |

### 3️⃣ 세그먼트 분석용 차원

| 차원 이름 | GA4 필드 | 설명 |
|----------|---------|------|
| `traffic_source.source` | 세션 소스 | 유입 출처 (google, facebook 등) |
| `traffic_source.medium` | 세션 매체 | 유입 매체 (cpc, organic 등) |
| `traffic_source.campaign` | 캠페인 이름 | 마케팅 캠페인 |
| `device.category` | 디바이스 카테고리 | mobile, desktop, tablet |
| `geo.country` | 국가 | 지리적 세그먼트 |

---

## 필요한 Metrics (측정항목)

### 1️⃣ 기본 행동 지표

| Metric 이름 | 계산 방법 | 용도 |
|------------|----------|------|
| `active_users` | COUNT(DISTINCT user_pseudo_id) | 활성 사용자 수 |
| `sessions` | COUNT(session_id) | 세션 수 |
| `event_count` | COUNT(*) | 총 이벤트 수 |
| `purchase_count` | COUNT(event_name = 'purchase') | 구매 건수 |

### 2️⃣ 리텐션 지표

| Metric 이름 | 계산 방법 | 설명 |
|------------|----------|------|
| `day_n_retention` | 코호트 Day N에 돌아온 사용자 / 코호트 초기 사용자 | Day N 리텐션율 |
| `returning_users` | 코호트에서 재방문한 사용자 수 | 재방문 사용자 |
| `cohort_size` | 코호트 초기 사용자 수 | 코호트 크기 |

### 3️⃣ 매출 지표

| Metric 이름 | GA4 이벤트 파라미터 | 설명 |
|------------|-------------------|------|
| `purchase_revenue` | ecommerce.purchase_revenue | 구매 금액 |
| `transaction_id` | ecommerce.transaction_id | 거래 ID |
| `user_lifetime_revenue` | 사용자별 누적 매출 | LTV 계산용 |

---

## BigQuery 코호트 리텐션 분석 SQL

```sql
-- 1단계: 첫 구매 날짜 계산
WITH first_purchase AS (
  SELECT
    user_pseudo_id,
    MIN(PARSE_DATE('%Y%m%d', event_date)) AS first_purchase_date
  FROM `project_id.analytics_PROPERTY_ID.events_*`
  WHERE event_name = 'purchase'
    AND _TABLE_SUFFIX BETWEEN '20250101' AND '20250131'
  GROUP BY user_pseudo_id
),

-- 2단계: 코호트 정의
cohorts AS (
  SELECT
    user_pseudo_id,
    first_purchase_date,
    FORMAT_DATE('%Y-%m', first_purchase_date) AS cohort_month
  FROM first_purchase
),

-- 3단계: 재구매 이벤트
repurchases AS (
  SELECT
    e.user_pseudo_id,
    PARSE_DATE('%Y%m%d', e.event_date) AS purchase_date,
    e.ecommerce.purchase_revenue AS revenue
  FROM `project_id.analytics_PROPERTY_ID.events_*` e
  WHERE e.event_name = 'purchase'
    AND _TABLE_SUFFIX BETWEEN '20250101' AND '20250228'
),

-- 4단계: 코호트 리텐션 계산
SELECT
  c.cohort_month,
  COUNT(DISTINCT CASE WHEN DATE_DIFF(r.purchase_date, c.first_purchase_date, DAY) = 0
    THEN c.user_pseudo_id END) AS cohort_size,
  COUNT(DISTINCT CASE WHEN DATE_DIFF(r.purchase_date, c.first_purchase_date, DAY) BETWEEN 1 AND 7
    THEN c.user_pseudo_id END) AS day_7_returning,
  COUNT(DISTINCT CASE WHEN DATE_DIFF(r.purchase_date, c.first_purchase_date, DAY) BETWEEN 1 AND 30
    THEN c.user_pseudo_id END) AS day_30_returning,
  ROUND(COUNT(DISTINCT CASE WHEN DATE_DIFF(r.purchase_date, c.first_purchase_date, DAY) BETWEEN 1 AND 7
    THEN c.user_pseudo_id END) * 100.0 /
    NULLIF(COUNT(DISTINCT CASE WHEN DATE_DIFF(r.purchase_date, c.first_purchase_date, DAY) = 0
    THEN c.user_pseudo_id END), 0), 2) AS retention_day_7_pct
FROM cohorts c
LEFT JOIN repurchases r ON c.user_pseudo_id = r.user_pseudo_id
GROUP BY c.cohort_month
ORDER BY c.cohort_month;
```

### 결과 예시

| cohort_month | cohort_size | day_7_returning | day_30_returning | retention_day_7_pct |
|--------------|-------------|-----------------|------------------|---------------------|
| 2025-01      | 500         | 150             | 200              | 30.0%               |
| 2025-02      | 450         | 140             | 180              | 31.1%               |

---

## GA4 Data API 설정 (Python)

### 설치

```bash
pip install google-analytics-data google-auth
```

### 코드 예시

```python
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange, Dimension, Metric, RunReportRequest
)
import pandas as pd

# 클라이언트 생성
client = BetaAnalyticsDataClient()

# 데이터 요청
request = RunReportRequest(
    property=f"properties/{GA4_PROPERTY_ID}",
    dimensions=[
        Dimension(name="date"),
        Dimension(name="customUser:userId"),
        Dimension(name="eventName"),
    ],
    metrics=[
        Metric(name="activeUsers"),
        Metric(name="eventCount"),
        Metric(name="purchaseRevenue"),
    ],
    date_ranges=[DateRange(start_date="2025-01-01", end_date="2025-01-31")],
)

response = client.run_report(request)

# DataFrame 변환
data = []
for row in response.rows:
    data.append({
        'date': row.dimension_values[0].value,
        'user_id': row.dimension_values[1].value,
        'event_name': row.dimension_values[2].value,
        'active_users': row.metric_values[0].value,
        'event_count': row.metric_values[1].value,
        'purchase_revenue': row.metric_values[2].value,
    })

df = pd.DataFrame(data)
df.to_csv('ga4_cohort_data.csv', index=False)
```

---

## GTM/gtag.js User Property 설정

```javascript
// 첫 구매 시 User Property 설정
gtag('set', 'user_properties', {
  first_purchase_date: '2025-01-15',
  total_purchase_count: 1,
  customer_lifetime_value: 50000
});

// 구매 이벤트와 함께 전송
gtag('event', 'purchase', {
  transaction_id: 'T12345',
  value: 50000,
  currency: 'KRW',
  items: [...]
});
```

---

## 즉시 시작 가이드

### 🔴 1단계: BigQuery Export 활성화 (필수)

1. GA4 관리자 페이지 접속
2. "BigQuery Links" 메뉴 선택
3. "Link" 버튼 클릭
4. GCP 프로젝트 선택
5. **"Daily export" 체크** (필수)
6. "Streaming export" (선택사항)
7. 링크 생성

### 🔴 2단계: User Property 생성

**GA4 설정:**
1. GA4 → Configure → Custom definitions
2. "Create custom dimension" 클릭
3. 이름: `first_purchase_date`
4. 범위: User
5. 저장

**GTM/웹사이트 구현:**
```javascript
// 첫 구매자 식별 후 설정
if (isFirstPurchase) {
  gtag('set', 'user_properties', {
    first_purchase_date: new Date().toISOString().split('T')[0]
  });
}
```

### 🟡 3단계: BigQuery 쿼리 실행

1. BigQuery Console 접속
2. 위의 SQL 쿼리 복사
3. `project_id`, `analytics_PROPERTY_ID` 수정
4. 쿼리 실행
5. 결과를 CSV로 다운로드

### 🟡 4단계: 대시보드 연동

**옵션 A: Python 자동화**
```python
# 매주 실행하여 데이터 업데이트
python scripts/update_cohort_data.py
```

**옵션 B: Looker Studio**
1. Looker Studio에서 BigQuery 연결
2. 위의 SQL을 Custom Query로 추가
3. 코호트 테이블 시각화

---

## 체크리스트

- [ ] GA4 BigQuery Export 활성화
- [ ] User Property (first_purchase_date) 설정
- [ ] GTM 또는 웹사이트에 User Property 코드 추가
- [ ] BigQuery 코호트 쿼리 작성 및 테스트
- [ ] Python 스크립트로 자동화
- [ ] 코호트 대시보드 구현

---

## 참고 자료

- [GA4 BigQuery Export 스키마](https://support.google.com/analytics/answer/7029846)
- [GA4 Data API 문서](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [BigQuery ML 예측 분석](https://cloud.google.com/bigquery-ml/docs)

---

**작성일**: 2025-01-21
**버전**: 1.0
**담당**: Marketing Analytics Team
