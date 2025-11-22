# 퍼널 대시보드 투자 효율성 분석 로직 문서

## 개요
이 문서는 `funnel_dashboard.html`의 채널별 투자 효율성 분석 기능(`updateAdvancedAnalysis()` 함수)의 로직을 자연어로 설명합니다.

---

## 1. 함수 목적

**함수명:** `updateAdvancedAnalysis()`

**목적:** 각 마케팅 채널의 전환율(CVR), 평균 객단가(ARPU), 실제 성과 데이터를 종합하여 100만원 투자 시 예상되는 구체적인 성과를 시뮬레이션하고, ROI(투자수익률) 기준으로 채널을 정렬하여 표시합니다.

**위치:** `funnel_dashboard.html` 2280-2520줄

---

## 2. 핵심 로직 흐름

### 2.1 데이터 수집 및 기본 지표 계산

각 채널별로 다음 데이터를 수집합니다:

- **유입(Acquisition):** 채널을 통해 유입된 방문자 수
- **구매완료(Purchase):** 실제 구매한 고객 수
- **매출(Revenue):** 총 매출액
- **전환율(CVR):** (구매완료 / 유입) × 100
- **평균 객단가(ARPU):** 매출 ÷ 구매완료

```javascript
const acquisition = parseFloat(channel['유입']) || 0;
const purchase = parseFloat(channel['구매완료']) || 0;
const revenue = parseFloat(channel['Revenue']) || 0;
const cvr = parseFloat(channel['CVR']) || 0;
const arpu = purchase > 0 ? revenue / purchase : 0;
```

---

### 2.2 데이터 신뢰도 평가

유입 수가 많을수록 데이터의 통계적 신뢰도가 높아집니다. 신뢰도는 5단계로 분류됩니다:

| 유입 수 범위 | 신뢰도 등급 | 신뢰도 점수 |
|-------------|-----------|-----------|
| 100,000명 이상 | 매우 높음 | 4점 |
| 10,000 ~ 99,999명 | 높음 | 3점 |
| 1,000 ~ 9,999명 | 보통 | 2점 |
| 100 ~ 999명 | 낮음 | 1점 |
| 100명 미만 | (표시 안 됨) | 0점 |

```javascript
let confidence = '낮음';
let confidenceScore = 0;

if (acquisition >= 100000) {
    confidence = '매우 높음';
    confidenceScore = 4;
} else if (acquisition >= 10000) {
    confidence = '높음';
    confidenceScore = 3;
} else if (acquisition >= 1000) {
    confidence = '보통';
    confidenceScore = 2;
} else if (acquisition >= 100) {
    confidence = '낮음';
    confidenceScore = 1;
}
```

**의미:**
- 신뢰도 점수는 투자 효율성 점수 계산에 가중치로 사용됩니다
- 데이터가 부족한 채널(유입 100명 미만)은 예측 정확도가 떨어지므로 경고 메시지를 표시합니다

---

### 2.3 채널 타입 분류 및 CPA 추정

각 채널을 4가지 타입으로 분류하고, 타입별 예상 CPA(Cost Per Acquisition, 방문자 1명당 유입 비용)를 설정합니다:

| 채널 타입 | 조건 | 예상 CPA | 설명 |
|---------|-----|---------|------|
| **paid** (유료 광고) | 채널명에 '광고', 'ad', 'paid' 포함 | 1,500원/방문자 | 구글 광고, 페이스북 광고 등 |
| **organic_optimizable** (오가닉 최적화 가능) | 채널명에 'organic', '쇼핑', '블로그' 포함 | 300원/방문자 | SEO, 콘텐츠 마케팅 투자 |
| **referral** (레퍼럴) | 위 조건에 해당 없음 | 500원/방문자 | 파트너십, 제휴 채널 |
| **direct** (자연 유입) | 채널명이 'direct' | 0원 (투자 불가) | 직접 URL 입력, 북마크 |

```javascript
const channelName = channel['channel'].toLowerCase();
let channelType = 'organic';
let estimatedCPA = 0;

if (channelName.includes('광고') || channelName.includes('ad') || channelName.includes('paid')) {
    channelType = 'paid';
    estimatedCPA = 1500; // 유료 광고 평균 CPA
} else if (channelName.includes('direct') || channelName === 'direct') {
    channelType = 'direct';
    estimatedCPA = 0; // Direct는 자연 유입, 투자 불가
} else if (channelName.includes('organic') || channelName.includes('쇼핑') || channelName.includes('블로그')) {
    channelType = 'organic_optimizable';
    estimatedCPA = 300; // 오가닉 최적화 비용
} else {
    channelType = 'referral';
    estimatedCPA = 500; // 레퍼럴/기타 채널
}
```

**주요 가정:**
- 유료 광고는 방문자당 평균 1,500원이 소요됩니다
- SEO/콘텐츠 최적화는 광고 대비 1/5 수준의 비용으로 트래픽을 확보할 수 있습니다
- Direct 채널은 광고 투자 대상이 아니므로 별도 처리합니다

---

### 2.4 투자 효율성 점수 계산

투자 효율성 점수는 다음 공식으로 계산됩니다:

```
투자 효율성 점수 = CVR × ARPU × (1 + 신뢰도점수 × 0.1)
```

```javascript
const investmentScore = cvr * arpu * (1 + confidenceScore * 0.1);
```

**의미:**
- 전환율(CVR)과 객단가(ARPU)가 높을수록 점수가 높아집니다
- 신뢰도가 높을수록 가중치가 더해집니다 (최대 +40%)
- 이 점수는 초기 스크리닝 용도로만 사용되며, **최종 정렬에는 ROI를 사용합니다**

---

### 2.5 100만원 투자 시 성과 시뮬레이션

#### 2.5.1 Direct 채널 처리

Direct 채널은 자연 유입이므로 광고 투자 대상이 아닙니다:

```javascript
if (channelType === 'direct') {
    isInvestable = false; // 투자 불가 플래그 설정
}
```

#### 2.5.2 투자 가능 채널의 성과 계산

100만원을 투자했을 때의 성과를 다음과 같이 계산합니다:

**1단계: 예상 유입 방문자 수 계산**

```
예상 방문자 수 = 투자금액 ÷ CPA
```

```javascript
estimatedVisitors = 1000000 / estimatedCPA;
```

**예시:**
- 유료 광고 채널 (CPA 1,500원): 100만원 ÷ 1,500원 = 약 667명
- 오가닉 최적화 (CPA 300원): 100만원 ÷ 300원 = 약 3,333명

---

**2단계: 예상 구매 건수 계산**

```
예상 구매 건수 = 예상 방문자 수 × (CVR ÷ 100)
```

```javascript
expectedPurchases = estimatedVisitors * (cvr / 100);
```

**예시:**
- 예상 방문자 667명, CVR 2.5%인 경우
- 667명 × 0.025 = 약 16.7건

---

**3단계: 예상 매출액 계산**

```
예상 매출액 = 예상 구매 건수 × ARPU
```

```javascript
expectedRevenue = expectedPurchases * arpu;
```

**예시:**
- 예상 구매 16.7건, 평균 객단가 80,000원인 경우
- 16.7건 × 80,000원 = 약 1,336,000원

---

**4단계: ROI (투자수익률) 계산**

```
ROI(%) = ((예상 매출액 - 투자금액) ÷ 투자금액) × 100
```

```javascript
roi = expectedRevenue > 0 ? ((expectedRevenue - 1000000) / 1000000 * 100) : -100;
```

**예시:**
- 예상 매출 1,336,000원, 투자 1,000,000원인 경우
- ((1,336,000 - 1,000,000) ÷ 1,000,000) × 100 = +33.6%
- **순이익: 336,000원**

---

### 2.6 데이터 구조 정리

각 채널별로 계산된 모든 지표를 객체로 반환합니다:

```javascript
return {
    channel: channel['channel'],           // 채널명
    cvr: cvr,                              // 전환율
    revenue: revenue,                      // 실제 매출
    purchase: purchase,                    // 실제 구매 건수
    acquisition: acquisition,              // 실제 유입 수
    arpu: arpu,                           // 평균 객단가
    confidence: confidence,                // 신뢰도 등급 (문자열)
    confidenceScore: confidenceScore,      // 신뢰도 점수 (숫자)
    investmentScore: investmentScore,      // 투자 효율성 점수
    channelType: channelType,              // 채널 타입
    estimatedCPA: estimatedCPA,            // 예상 CPA
    isInvestable: isInvestable,            // 투자 가능 여부
    estimatedVisitors: estimatedVisitors,  // 예상 유입 수
    expectedPurchases: expectedPurchases,  // 예상 구매 건수
    expectedRevenue: expectedRevenue,      // 예상 매출액
    roi: roi                               // ROI (투자수익률)
};
```

---

### 2.7 필터링 및 정렬

#### 2.7.1 필터링 조건

다음 조건을 만족하는 채널만 표시합니다:

```javascript
.filter(item => item.acquisition > 0 && item.cvr > 0)
```

- **유입이 0보다 큰 채널:** 실제 트래픽이 있는 채널만
- **전환율이 0보다 큰 채널:** 실제 구매가 발생한 채널만

#### 2.7.2 정렬 기준

**ROI(투자수익률) 내림차순**으로 정렬합니다:

```javascript
.sort((a, b) => b.roi - a.roi)
```

**정렬 로직:**
- ROI가 높은 채널 (예: +200%)이 상위에 표시됩니다
- ROI가 낮거나 손실인 채널 (예: -50%)은 하위에 표시됩니다
- **가장 투자 대비 수익률이 높은 채널을 먼저 볼 수 있습니다**

#### 2.7.3 표시 개수 제한

상위 8개 채널만 표시합니다:

```javascript
.slice(0, 8)
```

---

## 3. UI 렌더링 로직

### 3.1 순위 표시

채널별로 순위 이모지를 표시합니다:

```javascript
const rankEmoji = index === 0 ? '🥇' :
                  index === 1 ? '🥈' :
                  index === 2 ? '🥉' :
                  `${index + 1}위`;
```

- 1위: 🥇 (금메달)
- 2위: 🥈 (은메달)
- 3위: 🥉 (동메달)
- 4위 이하: 숫자 표시 (예: 4위, 5위...)

---

### 3.2 신뢰도 기반 색상 코딩

신뢰도 점수에 따라 배경색과 테두리 색상을 다르게 표시합니다:

| 신뢰도 점수 | 배경색 | 테두리 색상 | 의미 |
|-----------|-------|-----------|------|
| 3점 이상 (높음, 매우 높음) | 초록색 그라데이션 | 초록색 | 신뢰할 수 있는 예측 |
| 2점 (보통) | 주황색 그라데이션 | 주황색 | 참고용 예측 |
| 1점 이하 (낮음) | 회색 | 회색 | 데이터 부족 경고 |

```javascript
const confidenceColor = channel.confidenceScore >= 3 ? 'var(--success-main)' :
                       channel.confidenceScore === 2 ? 'var(--warning-main)' : 'var(--grey-400)';

const bgColor = channel.confidenceScore >= 3 ? 'linear-gradient(135deg, var(--success-light) 0%, #f0fff4 100%)' :
               channel.confidenceScore === 2 ? 'linear-gradient(135deg, var(--warning-light) 0%, #fff9e6 100%)' :
               'var(--grey-50)';

const borderColor = channel.confidenceScore >= 3 ? 'var(--success-main)' :
                   channel.confidenceScore === 2 ? 'var(--warning-main)' : 'var(--grey-300)';
```

---

### 3.3 투자 성과 표시 (신뢰도 2점 이상)

신뢰도가 2점(보통) 이상인 채널에 대해서만 투자 성과를 표시합니다:

#### 3.3.1 투자 가능 채널

다음 정보를 카드 형태로 표시합니다:

**기본 지표 (흰색 박스):**
- 전환율 (파란색, 퍼센트)
- 평균 객단가 (초록색, 원화)
- 데이터 신뢰도 (신뢰도 색상)

**100만원 투자 시 예상 성과 (흰색 박스):**
- 예상 CPA (작은 글씨로 표시)
- 예상 유입 (보라색, 명 단위)
- 예상 구매 (파란색, 건 단위)
- 예상 매출 (초록색, 원화)

**ROI 하이라이트 (색상 배경 박스):**
- ROI > 100%: 연초록 배경
- 0% < ROI < 100%: 주황 배경
- ROI < 0%: 연빨강 배경
- 순이익도 함께 표시 (예: 순이익: +336,000원)

#### 3.3.2 Direct 채널 (투자 불가)

Direct 채널은 투자 대상이 아니므로 특별한 안내를 표시합니다:

```
ℹ️ Direct 자연 유입 채널

이 채널은 자연 유입(Direct Traffic)으로, 직접적인 광고 투자 대상이 아닙니다.

현재 성과:
• 전환율: X.XX%
• 평균 객단가: XX,XXX원
• 총 매출: XXX,XXX원

💡 개선 방안: 브랜드 인지도 향상, 이메일 마케팅, 리마케팅 등을 통해
Direct 유입을 늘릴 수 있습니다.
```

---

### 3.4 투자 전략 가이드 (신뢰도 2점 이상)

채널 타입과 ROI에 따라 맞춤형 투자 전략을 제시합니다:

#### 3.4.1 유료 광고 채널 (paid)

| ROI 범위 | 전략 메시지 |
|---------|-----------|
| ROI > 200% | "매우 높은 수익률(+XXX%). 추가 예산 투입을 적극 권장합니다." |
| 100% < ROI ≤ 200% | "양호한 수익률(+XXX%). 예산 증액 고려를 추천합니다." |
| 0% < ROI ≤ 100% | "수익성이 있으나 다른 채널 대비 효율이 낮습니다. 광고 소재와 타겟팅 개선 권장." |
| ROI < 0% | "현재 손실(XXX%)이 예상됩니다. 캠페인 최적화 또는 예산 재분배가 필요합니다." |

#### 3.4.2 오가닉 최적화 채널 (organic_optimizable)

| ROI 범위 | 전략 메시지 |
|---------|-----------|
| ROI > 200% | "SEO/콘텐츠 최적화 투자 시 매우 효율적인 투자처입니다." |
| ROI > 0% | "오가닉 트래픽 최적화를 통해 수익 창출 가능. SEO, 블로그 콘텐츠 투자 권장." |
| ROI < 0% | "투자 전 콘텐츠 품질과 사용자 경험 개선이 우선입니다." |

#### 3.4.3 레퍼럴 채널 (referral)

```
"전환율 X.XX%, 객단가 XX,XXX원으로 투자 효율성이 확인되었습니다.
파트너십 강화나 제휴 확대를 고려해보세요."
```

---

### 3.5 데이터 부족 경고 (신뢰도 1점 이하)

신뢰도가 낮은 채널에는 다음과 같은 경고 메시지를 표시합니다:

```
⚠️ 데이터가 충분하지 않아 정확한 투자 성과 예측이 어렵습니다.
더 많은 데이터를 수집한 후 재평가하세요. (현재 유입: XXX명)
```

---

## 4. 주요 가정 및 제약사항

### 4.1 가정사항

1. **CPA 추정치:**
   - 유료 광고: 1,500원/방문자
   - 오가닉 최적화: 300원/방문자
   - 레퍼럴: 500원/방문자
   - 실제 CPA는 산업군, 경쟁 강도, 시즌에 따라 달라질 수 있습니다

2. **선형 확장 가정:**
   - 100만원 투자 시 성과가 과거 데이터와 동일한 비율로 확장된다고 가정합니다
   - 실제로는 광고비가 증가하면 CPA가 상승할 수 있습니다 (광고 경매 경쟁 심화)

3. **시장 환경 불변:**
   - 계절성, 경쟁사 마케팅, 트렌드 변화 등을 고려하지 않습니다

### 4.2 제약사항

1. **과거 데이터 의존:**
   - 과거 성과가 미래를 보장하지 않습니다
   - 신규 채널이나 최근 변화가 큰 채널은 예측 정확도가 낮을 수 있습니다

2. **단일 투자금액 시뮬레이션:**
   - 100만원 고정 금액으로만 시뮬레이션합니다
   - 다른 예산 수준에서는 ROI가 달라질 수 있습니다

3. **채널 간 상호작용 미고려:**
   - 여러 채널을 동시에 활용할 때의 시너지나 상충 효과를 고려하지 않습니다

---

## 5. 사용 예시

### 예시 1: 고효율 유료 광고 채널

**입력 데이터:**
- 채널명: "구글 광고"
- 유입: 50,000명
- 구매: 1,500건
- 매출: 120,000,000원
- CVR: 3.0%
- ARPU: 80,000원

**계산 과정:**
1. 신뢰도: 높음 (유입 50,000명 → 3점)
2. 채널 타입: paid (CPA 1,500원)
3. 예상 방문자: 1,000,000 ÷ 1,500 = 약 667명
4. 예상 구매: 667 × 0.03 = 약 20건
5. 예상 매출: 20 × 80,000 = 1,600,000원
6. ROI: (1,600,000 - 1,000,000) ÷ 1,000,000 × 100 = +60%
7. 순이익: +600,000원

**결과:**
- 정렬 순위: 상위권 (ROI +60%)
- 색상: 초록색 (신뢰도 높음)
- 전략 메시지: "수익성이 있으나 다른 채널 대비 효율이 낮습니다. 광고 소재와 타겟팅 개선 권장."

---

### 예시 2: 초고효율 오가닉 채널

**입력 데이터:**
- 채널명: "네이버 쇼핑"
- 유입: 120,000명
- 구매: 4,800건
- 매출: 384,000,000원
- CVR: 4.0%
- ARPU: 80,000원

**계산 과정:**
1. 신뢰도: 매우 높음 (유입 120,000명 → 4점)
2. 채널 타입: organic_optimizable (CPA 300원)
3. 예상 방문자: 1,000,000 ÷ 300 = 약 3,333명
4. 예상 구매: 3,333 × 0.04 = 약 133건
5. 예상 매출: 133 × 80,000 = 10,640,000원
6. ROI: (10,640,000 - 1,000,000) ÷ 1,000,000 × 100 = +964%
7. 순이익: +9,640,000원

**결과:**
- 정렬 순위: 1위 🥇 (ROI +964%)
- 색상: 초록색 (신뢰도 매우 높음)
- 전략 메시지: "SEO/콘텐츠 최적화에 100만원 투자 시 약 3,333명의 추가 유입과 10,640,000원의 매출이 예상됩니다. 매우 효율적인 투자처입니다."

---

### 예시 3: Direct 자연 유입 채널

**입력 데이터:**
- 채널명: "direct"
- 유입: 30,000명
- 구매: 900건
- 매출: 72,000,000원
- CVR: 3.0%
- ARPU: 80,000원

**계산 과정:**
1. 신뢰도: 높음 (유입 30,000명 → 3점)
2. 채널 타입: direct (투자 불가)
3. isInvestable: false

**결과:**
- 투자 성과 표시 안 함
- 특별 안내 메시지: "이 채널은 자연 유입(Direct Traffic)으로, 직접적인 광고 투자 대상이 아닙니다."
- 개선 방안: "브랜드 인지도 향상, 이메일 마케팅, 리마케팅 등을 통해 Direct 유입을 늘릴 수 있습니다."

---

## 6. 버전 히스토리

### v1.0 (2025-11-22)
- 초기 버전: 채널별 투자 효율성 분석 기능 구현
- 채널 타입 분류 및 CPA 추정 로직 추가
- 100만원 투자 시뮬레이션 기능 구현

### v1.1 (2025-11-22)
- 버그 수정: 모든 채널이 동일한 예상 매출(100만원)을 표시하던 문제 해결
- CPA 기반 방문자 수 계산 로직으로 변경
- 채널 타입별 차별화된 CPA 적용

### v1.2 (2025-11-22)
- 정렬 기준 변경: `investmentScore` → `roi`
- ROI(투자수익률) 내림차순으로 정렬하여 실제 수익성 기준으로 채널 표시

---

## 7. 향후 개선 방향

### 7.1 단기 개선 과제

1. **동적 CPA 계산:**
   - 실제 광고 집행 데이터에서 CPA를 추출하여 사용
   - 채널별 과거 CPA 추이 분석

2. **다양한 예산 시뮬레이션:**
   - 50만원, 100만원, 300만원, 500만원 등 다양한 예산 옵션 제공
   - 예산별 ROI 변화 그래프 시각화

3. **계절성 반영:**
   - 월별, 분기별 성과 차이를 분석하여 시즌별 예측 제공

### 7.2 중기 개선 과제

1. **A/B 테스트 결과 연동:**
   - 실제 광고 테스트 결과와 예측값 비교
   - 예측 정확도 지표 표시

2. **채널 조합 최적화:**
   - 여러 채널에 예산을 분산했을 때의 최적 포트폴리오 제안
   - 리스크 분산 고려

3. **기계학습 모델 적용:**
   - 과거 데이터 학습을 통한 더 정확한 ROI 예측
   - 이상치 탐지 및 트렌드 변화 감지

---

## 8. 개발자를 위한 완전한 구현 가이드

### 8.1 전체 함수 구조

```javascript
/**
 * 채널별 투자 효율성 분석 메인 함수
 * @description 채널 데이터를 분석하여 ROI 기반 투자 가이드를 생성합니다
 * @requires channelData - 글로벌 변수, 채널별 성과 데이터 배열
 * @requires insightsData - 글로벌 변수, 인사이트 데이터 객체
 * @modifies DOM - #abTestResults 엘리먼트의 innerHTML 수정
 * @returns {void}
 */
function updateAdvancedAnalysis() {
    if (!insightsData) return;

    const abTestContainer = document.getElementById('abTestResults');

    if (channelData && channelData.length > 0) {
        const channelInvestmentScores = analyzeChannelInvestments(channelData);
        renderInvestmentAnalysis(abTestContainer, channelInvestmentScores);
    } else {
        abTestContainer.innerHTML = '<p style="color: var(--grey-500);">채널 데이터를 불러오는 중...</p>';
    }

    // ... 기타 분석 로직 (채널 클러스터링 등)
}
```

---

### 8.2 모듈화된 서브 함수

#### 8.2.1 투자 분석 함수

```javascript
/**
 * 채널별 투자 효율성 분석
 * @param {Array<Object>} channels - 채널 데이터 배열
 * @param {Object} config - 설정 객체 (선택)
 * @returns {Array<Object>} 분석된 채널 정보 배열 (ROI 내림차순, 상위 8개)
 */
function analyzeChannelInvestments(channels, config = {}) {
    // 기본 설정
    const defaultConfig = {
        investmentAmount: 1000000,     // 투자 금액 (원)
        maxChannels: 8,                 // 최대 표시 채널 수
        cpa: {
            paid: 1500,                 // 유료 광고 CPA
            organic: 300,               // 오가닉 CPA
            referral: 500,              // 레퍼럴 CPA
            direct: 0                   // Direct (투자 불가)
        },
        confidenceThresholds: {
            veryHigh: 100000,
            high: 10000,
            medium: 1000,
            low: 100
        }
    };

    const settings = { ...defaultConfig, ...config };

    // 각 채널 분석
    const analyzed = channels.map(channel => {
        return analyzeChannel(channel, settings);
    });

    // 필터링 및 정렬
    return analyzed
        .filter(item => item.acquisition > 0 && item.cvr > 0)
        .sort((a, b) => b.roi - a.roi)
        .slice(0, settings.maxChannels);
}

/**
 * 단일 채널 분석
 * @param {Object} channel - 채널 데이터
 * @param {Object} settings - 설정 객체
 * @returns {Object} 분석 결과 객체
 */
function analyzeChannel(channel, settings) {
    // 1. 기본 데이터 추출
    const acquisition = parseFloat(channel['유입']) || 0;
    const purchase = parseFloat(channel['구매완료']) || 0;
    const revenue = parseFloat(channel['Revenue']) || 0;
    const cvr = parseFloat(channel['CVR']) || 0;
    const arpu = purchase > 0 ? revenue / purchase : 0;

    // 2. 신뢰도 계산
    const { confidence, confidenceScore } = calculateConfidence(
        acquisition,
        settings.confidenceThresholds
    );

    // 3. 채널 타입 및 CPA 결정
    const { channelType, estimatedCPA } = classifyChannel(
        channel['channel'],
        settings.cpa
    );

    // 4. 투자 효율성 점수
    const investmentScore = cvr * arpu * (1 + confidenceScore * 0.1);

    // 5. 투자 시뮬레이션
    const simulation = simulateInvestment({
        channelType,
        estimatedCPA,
        cvr,
        arpu,
        investmentAmount: settings.investmentAmount
    });

    // 6. 결과 반환
    return {
        channel: channel['channel'],
        cvr,
        revenue,
        purchase,
        acquisition,
        arpu,
        confidence,
        confidenceScore,
        investmentScore,
        channelType,
        estimatedCPA,
        ...simulation
    };
}

/**
 * 신뢰도 계산
 * @param {number} acquisition - 유입 수
 * @param {Object} thresholds - 신뢰도 임계값
 * @returns {Object} { confidence: string, confidenceScore: number }
 */
function calculateConfidence(acquisition, thresholds) {
    if (acquisition >= thresholds.veryHigh) {
        return { confidence: '매우 높음', confidenceScore: 4 };
    } else if (acquisition >= thresholds.high) {
        return { confidence: '높음', confidenceScore: 3 };
    } else if (acquisition >= thresholds.medium) {
        return { confidence: '보통', confidenceScore: 2 };
    } else if (acquisition >= thresholds.low) {
        return { confidence: '낮음', confidenceScore: 1 };
    } else {
        return { confidence: '매우 낮음', confidenceScore: 0 };
    }
}

/**
 * 채널 타입 분류
 * @param {string} channelName - 채널명
 * @param {Object} cpaConfig - CPA 설정 객체
 * @returns {Object} { channelType: string, estimatedCPA: number }
 */
function classifyChannel(channelName, cpaConfig) {
    const name = channelName.toLowerCase();

    if (name.includes('광고') || name.includes('ad') || name.includes('paid')) {
        return { channelType: 'paid', estimatedCPA: cpaConfig.paid };
    } else if (name.includes('direct') || name === 'direct') {
        return { channelType: 'direct', estimatedCPA: cpaConfig.direct };
    } else if (name.includes('organic') || name.includes('쇼핑') || name.includes('블로그')) {
        return { channelType: 'organic_optimizable', estimatedCPA: cpaConfig.organic };
    } else {
        return { channelType: 'referral', estimatedCPA: cpaConfig.referral };
    }
}

/**
 * 투자 시뮬레이션
 * @param {Object} params - 시뮬레이션 파라미터
 * @returns {Object} 시뮬레이션 결과
 */
function simulateInvestment({ channelType, estimatedCPA, cvr, arpu, investmentAmount }) {
    let isInvestable = true;
    let estimatedVisitors = 0;
    let expectedPurchases = 0;
    let expectedRevenue = 0;
    let roi = -100;

    if (channelType === 'direct') {
        isInvestable = false;
    } else if (estimatedCPA > 0) {
        estimatedVisitors = investmentAmount / estimatedCPA;
        expectedPurchases = estimatedVisitors * (cvr / 100);
        expectedRevenue = expectedPurchases * arpu;
        roi = expectedRevenue > 0
            ? ((expectedRevenue - investmentAmount) / investmentAmount * 100)
            : -100;
    }

    return {
        isInvestable,
        estimatedVisitors,
        expectedPurchases,
        expectedRevenue,
        roi
    };
}
```

---

### 8.3 데이터 타입 정의 (TypeScript 스타일)

```typescript
// 입력 타입
interface ChannelData {
    channel: string;           // 채널명
    '유입': string | number;   // 유입 수
    '구매완료': string | number; // 구매 건수
    'Revenue': string | number; // 매출액
    'CVR': string | number;     // 전환율
}

// 설정 타입
interface InvestmentConfig {
    investmentAmount?: number;
    maxChannels?: number;
    cpa?: {
        paid?: number;
        organic?: number;
        referral?: number;
        direct?: number;
    };
    confidenceThresholds?: {
        veryHigh?: number;
        high?: number;
        medium?: number;
        low?: number;
    };
}

// 출력 타입
interface ChannelInvestmentResult {
    channel: string;
    cvr: number;
    revenue: number;
    purchase: number;
    acquisition: number;
    arpu: number;
    confidence: '매우 높음' | '높음' | '보통' | '낮음' | '매우 낮음';
    confidenceScore: 0 | 1 | 2 | 3 | 4;
    investmentScore: number;
    channelType: 'paid' | 'organic_optimizable' | 'referral' | 'direct';
    estimatedCPA: number;
    isInvestable: boolean;
    estimatedVisitors: number;
    expectedPurchases: number;
    expectedRevenue: number;
    roi: number;
}
```

---

### 8.4 테스트 케이스

```javascript
// 테스트 데이터
const testChannelData = [
    {
        channel: '구글 광고',
        '유입': '50000',
        '구매완료': '1500',
        'Revenue': '120000000',
        'CVR': '3.0'
    },
    {
        channel: '네이버 쇼핑',
        '유입': '120000',
        '구매완료': '4800',
        'Revenue': '384000000',
        'CVR': '4.0'
    },
    {
        channel: 'direct',
        '유입': '30000',
        '구매완료': '900',
        'Revenue': '72000000',
        'CVR': '3.0'
    }
];

// 테스트 실행
function runTests() {
    console.log('=== 투자 효율성 분석 테스트 시작 ===');

    const results = analyzeChannelInvestments(testChannelData);

    console.log(`총 ${results.length}개 채널 분석 완료`);

    results.forEach((channel, index) => {
        console.log(`\n[${index + 1}위] ${channel.channel}`);
        console.log(`  - ROI: ${channel.roi.toFixed(2)}%`);
        console.log(`  - 예상 매출: ${channel.expectedRevenue.toLocaleString()}원`);
        console.log(`  - 신뢰도: ${channel.confidence} (${channel.confidenceScore}점)`);
        console.log(`  - 투자 가능: ${channel.isInvestable ? 'Yes' : 'No'}`);
    });

    // 검증
    assert(results[0].channel === '네이버 쇼핑', '1위는 네이버 쇼핑이어야 함');
    assert(results[0].roi > results[1].roi, 'ROI 내림차순 정렬 확인');
    assert(results.find(c => c.channel === 'direct').isInvestable === false,
           'Direct 채널은 투자 불가');
}

// 간단한 assert 함수
function assert(condition, message) {
    if (!condition) {
        throw new Error(`테스트 실패: ${message}`);
    }
    console.log(`✓ ${message}`);
}
```

**예상 출력:**
```
=== 투자 효율성 분석 테스트 시작 ===
총 3개 채널 분석 완료

[1위] 네이버 쇼핑
  - ROI: 964.00%
  - 예상 매출: 10,640,000원
  - 신뢰도: 매우 높음 (4점)
  - 투자 가능: Yes

[2위] 구글 광고
  - ROI: 60.00%
  - 예상 매출: 1,600,000원
  - 신뢰도: 높음 (3점)
  - 투자 가능: Yes

[3위] direct
  - ROI: -100.00%
  - 예상 매출: 0원
  - 신뢰도: 높음 (3점)
  - 투자 가능: No

✓ 1위는 네이버 쇼핑이어야 함
✓ ROI 내림차순 정렬 확인
✓ Direct 채널은 투자 불가
```

---

### 8.5 에러 핸들링

```javascript
/**
 * 안전한 투자 분석 함수 (에러 핸들링 포함)
 * @param {Array<Object>} channels - 채널 데이터
 * @param {Object} config - 설정
 * @returns {Array<Object>|null} 분석 결과 또는 null (에러 시)
 */
function analyzeChannelInvestmentsSafe(channels, config = {}) {
    try {
        // 입력 검증
        if (!Array.isArray(channels)) {
            throw new Error('channels는 배열이어야 합니다');
        }

        if (channels.length === 0) {
            console.warn('채널 데이터가 비어있습니다');
            return [];
        }

        // 필수 필드 검증
        const requiredFields = ['channel', '유입', '구매완료', 'Revenue', 'CVR'];
        const invalidChannels = channels.filter(channel =>
            requiredFields.some(field => !(field in channel))
        );

        if (invalidChannels.length > 0) {
            console.error('필수 필드가 없는 채널:', invalidChannels);
            throw new Error(`${invalidChannels.length}개 채널에 필수 필드가 없습니다`);
        }

        // 설정 검증
        if (config.investmentAmount && config.investmentAmount <= 0) {
            throw new Error('투자 금액은 0보다 커야 합니다');
        }

        if (config.maxChannels && config.maxChannels < 1) {
            throw new Error('최대 채널 수는 1 이상이어야 합니다');
        }

        // 분석 실행
        return analyzeChannelInvestments(channels, config);

    } catch (error) {
        console.error('투자 분석 중 오류 발생:', error.message);
        console.error('스택 트레이스:', error.stack);

        // 에러 로깅 (선택적으로 서버에 전송)
        logError({
            type: 'INVESTMENT_ANALYSIS_ERROR',
            message: error.message,
            timestamp: new Date().toISOString(),
            data: { channelsCount: channels?.length, config }
        });

        return null;
    }
}

// 에러 로깅 함수 (예시)
function logError(errorInfo) {
    // 개발 환경에서는 콘솔에만 출력
    if (window.location.hostname === 'localhost') {
        console.error('[ERROR LOG]', errorInfo);
        return;
    }

    // 프로덕션에서는 서버로 전송
    // fetch('/api/log-error', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(errorInfo)
    // });
}
```

---

### 8.6 사용 예시 (실전)

```javascript
// 기본 사용
const results = analyzeChannelInvestments(channelData);

// 커스텀 설정 사용
const customResults = analyzeChannelInvestments(channelData, {
    investmentAmount: 5000000,  // 500만원 투자 시뮬레이션
    maxChannels: 10,            // 상위 10개 채널
    cpa: {
        paid: 2000,             // 광고 CPA 상향 조정
        organic: 400,
        referral: 600
    }
});

// 에러 핸들링 버전 사용
const safeResults = analyzeChannelInvestmentsSafe(channelData);
if (safeResults) {
    renderInvestmentAnalysis(container, safeResults);
} else {
    container.innerHTML = '<p>분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>';
}
```

---

### 8.7 성능 최적화

```javascript
/**
 * 대량 데이터 처리를 위한 최적화된 버전
 * @param {Array<Object>} channels - 채널 데이터 (수천 개)
 * @param {Object} config - 설정
 * @returns {Promise<Array<Object>>} 분석 결과 (비동기)
 */
async function analyzeChannelInvestmentsAsync(channels, config = {}) {
    // 청크 단위로 처리 (UI 블로킹 방지)
    const CHUNK_SIZE = 100;
    const results = [];

    for (let i = 0; i < channels.length; i += CHUNK_SIZE) {
        const chunk = channels.slice(i, i + CHUNK_SIZE);
        const chunkResults = chunk.map(ch => analyzeChannel(ch, config));
        results.push(...chunkResults);

        // 다음 이벤트 루프에서 처리 (UI 반응성 유지)
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    return results
        .filter(item => item.acquisition > 0 && item.cvr > 0)
        .sort((a, b) => b.roi - a.roi)
        .slice(0, config.maxChannels || 8);
}

// 사용 예시
async function updateAdvancedAnalysisAsync() {
    const container = document.getElementById('abTestResults');
    container.innerHTML = '<p>분석 중...</p>';

    const results = await analyzeChannelInvestmentsAsync(channelData);
    renderInvestmentAnalysis(container, results);
}
```

---

### 8.8 유닛 테스트 (Jest 스타일)

```javascript
describe('투자 효율성 분석', () => {
    describe('calculateConfidence', () => {
        it('유입 100,000명 이상이면 매우 높음을 반환해야 함', () => {
            const thresholds = { veryHigh: 100000, high: 10000, medium: 1000, low: 100 };
            const result = calculateConfidence(150000, thresholds);
            expect(result.confidence).toBe('매우 높음');
            expect(result.confidenceScore).toBe(4);
        });

        it('유입 50명이면 매우 낮음을 반환해야 함', () => {
            const thresholds = { veryHigh: 100000, high: 10000, medium: 1000, low: 100 };
            const result = calculateConfidence(50, thresholds);
            expect(result.confidence).toBe('매우 낮음');
            expect(result.confidenceScore).toBe(0);
        });
    });

    describe('classifyChannel', () => {
        const cpaConfig = { paid: 1500, organic: 300, referral: 500, direct: 0 };

        it('광고 키워드가 있으면 paid로 분류해야 함', () => {
            const result = classifyChannel('구글 광고', cpaConfig);
            expect(result.channelType).toBe('paid');
            expect(result.estimatedCPA).toBe(1500);
        });

        it('direct 채널은 CPA 0으로 설정해야 함', () => {
            const result = classifyChannel('direct', cpaConfig);
            expect(result.channelType).toBe('direct');
            expect(result.estimatedCPA).toBe(0);
        });
    });

    describe('simulateInvestment', () => {
        it('Direct 채널은 투자 불가로 표시해야 함', () => {
            const result = simulateInvestment({
                channelType: 'direct',
                estimatedCPA: 0,
                cvr: 3.0,
                arpu: 80000,
                investmentAmount: 1000000
            });
            expect(result.isInvestable).toBe(false);
            expect(result.estimatedVisitors).toBe(0);
        });

        it('유료 광고 ROI를 정확히 계산해야 함', () => {
            const result = simulateInvestment({
                channelType: 'paid',
                estimatedCPA: 1500,
                cvr: 3.0,
                arpu: 80000,
                investmentAmount: 1000000
            });

            // 예상: 667명 유입, 20건 구매, 1,600,000원 매출, ROI 60%
            expect(Math.round(result.estimatedVisitors)).toBe(667);
            expect(Math.round(result.expectedPurchases)).toBe(20);
            expect(Math.round(result.expectedRevenue)).toBe(1600000);
            expect(Math.round(result.roi)).toBe(60);
        });
    });
});
```

---

### 8.9 디버깅 팁

```javascript
// 디버그 모드 활성화
const DEBUG = true;

function analyzeChannelDebug(channel, settings) {
    if (DEBUG) {
        console.group(`📊 채널 분석: ${channel.channel}`);
        console.log('입력 데이터:', channel);
    }

    const result = analyzeChannel(channel, settings);

    if (DEBUG) {
        console.log('분석 결과:', result);
        console.log(`ROI: ${result.roi.toFixed(2)}%`);
        console.log(`예상 매출: ${result.expectedRevenue.toLocaleString()}원`);
        console.groupEnd();
    }

    return result;
}

// 성능 측정
function analyzeChannelInvestmentsPerfTest(channels, config) {
    console.time('투자 분석 실행 시간');
    const results = analyzeChannelInvestments(channels, config);
    console.timeEnd('투자 분석 실행 시간');
    console.log(`총 ${channels.length}개 채널 중 ${results.length}개 분석 완료`);
    return results;
}
```

---

### 8.10 마이그레이션 가이드

기존 코드에서 모듈화된 코드로 전환하는 방법:

**Before (기존 코드):**
```javascript
function updateAdvancedAnalysis() {
    // ... 200줄 이상의 중첩된 로직
}
```

**After (개선 코드):**
```javascript
function updateAdvancedAnalysis() {
    if (!insightsData) return;

    const abTestContainer = document.getElementById('abTestResults');

    if (channelData && channelData.length > 0) {
        // 모듈화된 함수 사용
        const results = analyzeChannelInvestmentsSafe(channelData);

        if (results) {
            renderInvestmentAnalysis(abTestContainer, results);
        } else {
            abTestContainer.innerHTML = '<p style="color: var(--error-main);">분석 중 오류가 발생했습니다.</p>';
        }
    } else {
        abTestContainer.innerHTML = '<p style="color: var(--grey-500);">채널 데이터를 불러오는 중...</p>';
    }
}
```

**장점:**
- 테스트 가능: 각 함수를 독립적으로 테스트할 수 있음
- 재사용성: 다른 프로젝트에서도 사용 가능
- 유지보수성: 로직이 명확하게 분리되어 수정이 쉬움
- 확장성: 새로운 기능 추가가 용이함

---

## 9. 문의 및 지원

이 문서에 대한 문의사항이나 개선 제안은 개발팀에 문의하시기 바랍니다.

**문서 버전:** 2.0 (개발자 친화 버전)
**최종 수정일:** 2025-11-22
**작성자:** Claude Code
