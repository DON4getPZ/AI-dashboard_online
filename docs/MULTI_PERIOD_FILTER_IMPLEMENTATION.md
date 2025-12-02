# 다중 기간 필터링 기능 구현 가이드

## 개요

마케팅 대시보드에 기간별 필터링 기능을 구현한 내용을 정리합니다.

### 적용 대시보드

| 대시보드 | 구현일 | 필터 옵션 | 제외 항목 |
|----------|--------|-----------|-----------|
| `type_dashboard.html` | 2025-12-01 | 전체/180일/90일/30일 | 계절성 분석 |
| `funnel_dashboard.html` | 2025-12-02 | 전체/180일/90일/30일 | 이탈 위험/성과 개선 |
| `timeseries_analysis.html` | 2025-12-02 | 전체/180일/90일/30일 | - |

### 공통 사항
- **필터 옵션**: 전체기간, 최근 180일, 최근 90일, 최근 30일
- **데이터 구조**: 중첩 구조(Nested Structure) - `by_period` 키 사용

---

## 1. 구현 배경

### 요구사항
- 사용자가 기간별로 마케팅 성과를 비교 분석할 수 있어야 함
- 버튼 클릭으로 즉시 기간 전환 가능해야 함
- 분기별 추이(seasonality)는 전체 기간 데이터를 유지해야 함

### 접근 방식 검토

| 방식 | 설명 | 장점 | 단점 |
|------|------|------|------|
| A. 서버 재생성 | 버튼 클릭 시 Python 스크립트 재실행 | 최신 데이터 | 느림, 서버 필요 |
| B. 클라이언트 필터링 | JS에서 원본 데이터 필터링 | 빠름 | 복잡한 집계 로직 필요 |
| **C. 사전 생성 (채택)** | 모든 기간 데이터를 미리 생성 | 빠름, 정확함 | 파일 크기 증가 |

### 데이터 구조 결정

**중첩 구조(Nested Structure)** 채택:
```json
{
  "by_period": {
    "full": { ... },
    "180d": { ... },
    "90d": { ... },
    "30d": { ... }
  },
  "seasonality": { ... },
  "generated_at": "2025-12-01T...",
  "available_periods": [...]
}
```

**장점**:
- 단일 파일 관리
- 일관된 참조 구조 (`data.by_period[currentPeriod]`)
- seasonality 데이터 공유 용이

---

## 2. 구현 상세

### 2.1 Python 스크립트 수정

#### `generate_type_insights.py` 변경사항

**1) argparse 추가 (Line 23-28)**
```python
import argparse

parser = argparse.ArgumentParser(description='Type 분석 기반 인사이트 생성')
parser.add_argument('--days', type=int, default=0,
                    help='최근 N일 데이터만 사용 (0=전체기간, 30/90/180 등)')
args = parser.parse_args()
```

**2) filter_by_days 함수 추가 (Line 30-45)**
```python
def filter_by_days(df, days, date_column='일'):
    """최근 N일 데이터만 필터링"""
    if days <= 0:
        return df
    if date_column not in df.columns:
        return df
    df_copy = df.copy()
    df_copy[date_column] = pd.to_datetime(df_copy[date_column])
    max_date = df_copy[date_column].max()
    cutoff_date = max_date - timedelta(days=days)
    return df_copy[df_copy[date_column] >= cutoff_date].copy()
```

**3) 데이터 필터링 적용 (Line 328-350)**
```python
if args.days > 0:
    print(f"\n⏰ 최근 {args.days}일 데이터로 필터링 적용 중...")

    # daily_summary 필터링
    daily_summary = filter_by_days(daily_summary, args.days, '일')

    # dimensions 필터링
    for key in dimensions:
        if '일' in dimensions[key].columns:
            dimensions[key] = filter_by_days(dimensions[key], args.days, '일')
```

**4) summary 계산 수정 (Line 382-386)**

수정 전 (문제):
```python
# category_summary는 사전 집계 파일로 날짜 필터링 불가
total_cost = category_summary['비용'].sum()
```

수정 후:
```python
# 필터링된 daily_summary에서 총합 계산
total_cost = daily_summary['비용'].sum()
total_conversions = daily_summary['전환수'].sum()
total_revenue = daily_summary['전환값'].sum()
```

**5) top_categories 계산 수정 (Line 407-434)**

수정 전:
```python
paid_categories = category_summary[category_summary['비용'] > 0].copy()
```

수정 후:
```python
# 필터링된 dimensions['type1']에서 유형구분별 집계
if 'type1' in dimensions and '유형구분' in dimensions['type1'].columns:
    type1_df = dimensions['type1'].copy()
    category_agg = type1_df.groupby('유형구분').agg({
        '비용': 'sum',
        '전환수': 'sum',
        '전환값': 'sum'
    }).reset_index()

    # ROAS, CPA 재계산 (총합 기준)
    category_agg['ROAS'] = np.where(
        category_agg['비용'] > 0,
        (category_agg['전환값'] / category_agg['비용']) * 100,
        0
    )
```

#### `generate_type_insights_multiperiod.py` 신규 생성

4개 기간의 인사이트를 순차 생성하여 중첩 구조로 저장:

```python
PERIODS = [
    {'key': 'full', 'days': 0, 'label': '전체 기간'},
    {'key': '180d', 'days': 180, 'label': '최근 180일'},
    {'key': '90d', 'days': 90, 'label': '최근 90일'},
    {'key': '30d', 'days': 30, 'label': '최근 30일'}
]

def main():
    period_insights = {}
    seasonality_data = None

    for period in PERIODS:
        insights = run_insights_generation(period['days'], period['key'])

        if insights:
            # 전체 기간에서 seasonality 데이터 저장
            if period['key'] == 'full':
                seasonality_data = {
                    'seasonality_analysis': insights.get('seasonality_analysis', {}),
                    'seasonality_insights': insights.get('seasonality_insights', [])
                }

            # 기간별 데이터 저장 (seasonality 제외)
            period_data = {k: v for k, v in insights.items()
                          if k not in ['seasonality_analysis', 'seasonality_insights']}
            period_insights[period['key']] = period_data

    # 중첩 구조로 결합
    combined_insights = {
        'by_period': period_insights,
        'seasonality': seasonality_data,
        'generated_at': datetime.now().isoformat(),
        'available_periods': [...]
    }
```

---

### 2.2 HTML/JavaScript 수정

#### 전역 변수 및 헬퍼 함수 추가

```javascript
let currentPeriod = 'full';

// 현재 선택된 기간의 데이터 반환
function getPeriodData() {
    if (!insightsData || !insightsData.by_period) {
        return insightsData;  // 이전 구조 호환
    }
    return insightsData.by_period[currentPeriod] || insightsData.by_period['full'];
}

// 분기별 추이 데이터 반환 (항상 전체 기간)
function getSeasonalityData() {
    if (!insightsData) return null;
    return insightsData.seasonality || {
        seasonality_analysis: {},
        seasonality_insights: []
    };
}
```

#### 기간 필터 버튼 UI

```html
<div class="period-filter-container" style="...">
    <span style="...">기간:</span>
    <button class="period-filter-btn active" data-period="full"
            onclick="switchPeriod('full')">전체기간</button>
    <button class="period-filter-btn" data-period="180d"
            onclick="switchPeriod('180d')">180일</button>
    <button class="period-filter-btn" data-period="90d"
            onclick="switchPeriod('90d')">90일</button>
    <button class="period-filter-btn" data-period="30d"
            onclick="switchPeriod('30d')">30일</button>
    <span id="periodDateRange" style="..."></span>
</div>
```

#### switchPeriod 함수

```javascript
function switchPeriod(period) {
    currentPeriod = period;

    // 버튼 스타일 업데이트
    document.querySelectorAll('.period-filter-btn').forEach(btn => {
        if (btn.dataset.period === period) {
            btn.style.background = '#1a73e8';
            btn.style.color = 'white';
            btn.classList.add('active');
        } else {
            btn.style.background = 'white';
            btn.style.color = '#495057';
            btn.classList.remove('active');
        }
    });

    // 날짜 범위 표시 업데이트
    updatePeriodDateRange();

    // 모든 탭 다시 렌더링 (분기별 추이 제외)
    renderSummaryTab();
    renderOpportunityTab();
    renderWarningTab();
    renderTargetingTab();
    renderForecastTab();
    renderBudgetGuideTab();
    // 계절성 분석은 전체 기간 데이터만 사용하므로 다시 렌더링하지 않음
}
```

#### 렌더링 함수 수정 패턴

모든 렌더링 함수에서 `insightsData` 대신 `periodData` 사용:

```javascript
// 수정 전
function renderSomeTab() {
    const data = insightsData.some_data;
    // ...
}

// 수정 후
function renderSomeTab() {
    const periodData = getPeriodData();
    const data = periodData.some_data;
    // ...
}
```

**수정된 함수 목록**:
- `updatePeriodInfo()`
- `renderKPICards()`
- `renderSummaryTab()`
- `renderOpportunityTab()`
- `renderWarningTab()`
- `renderTargetingTab()`
- `renderForecastTab()`
- `renderBudgetGuideTab()`
- `generateAIOpportunities()`
- `generateAIActions()`
- `renderGenderChart()`
- `renderPlatformChart()`
- `generateBrandInsight()`
- `generateProductInsight()`
- `generatePromotionInsight()`
- `renderAgeGenderRetargetTable()`
- `renderDeviceRetargetTable()`
- `renderPlatformRetargetTable()`
- `renderDevicePlatformRetargetTable()`

---

## 3. 검증 결과

### 기간별 성과 비교

| 기간 | 일수 | 총비용 | 총전환값 | ROAS | CPA |
|------|------|--------|----------|------|-----|
| 전체 | 433일 | 13.1억원 | 24.8억원 | 189.9% | 18,053원 |
| 180일 | 181일 | 10.6억원 | 20.8억원 | 196.0% | 17,846원 |
| 90일 | 91일 | 4.8억원 | 9.1억원 | 189.3% | 20,409원 |
| 30일 | 31일 | 1.2억원 | 2.5억원 | 206.8% | 22,468원 |

### JSON 구조 검증

```
insights.json
├── by_period
│   ├── full (전체 기간 데이터)
│   ├── 180d (최근 180일 데이터)
│   ├── 90d (최근 90일 데이터)
│   └── 30d (최근 30일 데이터)
├── seasonality (분기별 추이 - 전체 기간만)
├── generated_at
└── available_periods
```

---

## 4. 사용 방법

### 인사이트 데이터 생성

```bash
# 다중 기간 인사이트 한번에 생성
python scripts/generate_type_insights_multiperiod.py

# 개별 기간 인사이트 생성 (필요시)
python scripts/generate_type_insights.py              # 전체 기간
python scripts/generate_type_insights.py --days 180   # 최근 180일
python scripts/generate_type_insights.py --days 90    # 최근 90일
python scripts/generate_type_insights.py --days 30    # 최근 30일
```

### 대시보드 사용

1. `type_dashboard.html` 열기
2. '데이터 기반 의사결정 도구' 탭 선택
3. 상단 기간 버튼 (전체기간/180일/90일/30일) 클릭
4. 선택된 기간에 맞는 데이터로 모든 탭이 갱신됨

---

## 5. 주의사항

### ROAS 계산 규칙 준수

비율 지표는 반드시 **총합 기준**으로 계산해야 합니다 (참조: `RATIO_METRIC_CALCULATION_FIX.md`):

```python
# 올바른 방식
total_revenue = df['전환값'].sum()
total_cost = df['비용'].sum()
roas = (total_revenue / total_cost * 100) if total_cost > 0 else 0

# 잘못된 방식 (사용 금지)
roas = df['ROAS'].mean()
```

### 분기별 추이 예외

분기별 추이(`seasonality`)는 장기 트렌드 분석 목적으로 **항상 전체 기간 데이터**를 사용합니다:

```javascript
// seasonality 데이터는 별도 함수로 접근
function getSeasonalityData() {
    return insightsData.seasonality;  // 항상 전체 기간
}
```

---

## 6. funnel_dashboard.html 구현 (2025-12-02)

### 6.1 특이사항: 독립적인 기간 필터 2개

funnel_dashboard는 **두 개의 독립적인 기간 필터**를 가집니다:

| 섹션 | 변수 | 헬퍼 함수 | 적용 탭 |
|------|------|-----------|---------|
| 인사이트 & 채널 전략 | `insightPeriod` | `getInsightPeriodData()` | 핵심 요약, 긴급 개선, 채널 전략(BCG) |
| 데이터 기반 의사결정 도구 | `currentPeriod` | `getPeriodData()` | 채널 그룹별 특성, 예산 투자 가이드 |

**전체 기간 고정 항목** (기간 필터 미적용):
- 이탈 위험 경고 (`churn_predictions_7d`, `churn_predictions_30d`)
- 성과 개선 분석 (`improvement_predictions_7d`, `improvement_predictions_30d`)
- CRM 액션 가이드 (`crm_actions`)

### 6.2 JSON 데이터 구조

```json
{
  "by_period": {
    "full": { "overall": {...}, "summary": {...}, "channel_strategy": {...}, ... },
    "180d": { ... },
    "90d": { ... },
    "30d": { ... }
  },
  "churn_analysis": {
    "churn_predictions_7d": [...],
    "churn_predictions_30d": [...],
    "improvement_predictions_7d": [...],
    "improvement_predictions_30d": [...],
    "crm_actions": [...]
  },
  "generated_at": "2025-12-02T...",
  "available_periods": [...]
}
```

### 6.3 Python 스크립트

#### `generate_funnel_data.py` 변경사항

```python
import argparse
from datetime import timedelta

parser = argparse.ArgumentParser(description='GA4 퍼널 분석 인사이트 생성')
parser.add_argument('--days', type=int, default=0,
                    help='최근 N일 데이터만 사용 (0=전체기간)')
args, unknown = parser.parse_known_args()

def filter_by_days(df, days, date_column='Day'):
    if days <= 0:
        return df
    df_copy = df.copy()
    df_copy[date_column] = pd.to_datetime(df_copy[date_column])
    max_date = df_copy[date_column].max()
    cutoff_date = max_date - timedelta(days=days)
    return df_copy[df_copy[date_column] >= cutoff_date].copy()
```

#### `generate_funnel_data_multiperiod.py` 신규 생성

```python
PERIODS = [
    {'key': 'full', 'days': 0, 'label': '전체 기간'},
    {'key': '180d', 'days': 180, 'label': '최근 180일'},
    {'key': '90d', 'days': 90, 'label': '최근 90일'},
    {'key': '30d', 'days': 30, 'label': '최근 30일'}
]

def main():
    period_insights = {}
    churn_data = None  # 전체 기간에서만 추출

    for period in PERIODS:
        insights = run_funnel_generation(period['days'])

        if period['key'] == 'full':
            # 이탈 분석 데이터 저장 (전체 기간만)
            churn_data = {
                'churn_predictions_7d': insights.get('churn_predictions_7d', []),
                'churn_predictions_30d': insights.get('churn_predictions_30d', []),
                'improvement_predictions_7d': insights.get('improvement_predictions_7d', []),
                'improvement_predictions_30d': insights.get('improvement_predictions_30d', []),
                'crm_actions': insights.get('crm_actions', [])
            }

        # 기간별 데이터 저장 (churn 관련 제외)
        period_data = {k: v for k, v in insights.items()
                      if not k.startswith(('churn_', 'improvement_', 'crm_'))}
        period_insights[period['key']] = period_data

    combined = {
        'by_period': period_insights,
        'churn_analysis': churn_data,
        'generated_at': datetime.now().isoformat(),
        'available_periods': [...]
    }
```

### 6.4 JavaScript 구현

#### 전역 변수 및 헬퍼 함수

```javascript
let currentPeriod = 'full';   // 데이터 기반 의사결정 도구용
let insightPeriod = 'full';   // 인사이트 & 채널 전략용

// 데이터 기반 의사결정 도구 기간 데이터
function getPeriodData() {
    if (!insightsData || !insightsData.by_period) {
        return insightsData;
    }
    return insightsData.by_period[currentPeriod] || insightsData.by_period['full'];
}

// 인사이트 & 채널 전략 기간 데이터
function getInsightPeriodData() {
    if (!insightsData || !insightsData.by_period) {
        return insightsData;
    }
    return insightsData.by_period[insightPeriod] || insightsData.by_period['full'];
}

// 이탈 분석 데이터 (전체 기간만)
function getChurnData() {
    if (!insightsData) return null;
    return insightsData.churn_analysis || {};
}
```

#### 기간 전환 함수 (2개)

```javascript
// 데이터 기반 의사결정 도구용
function switchPeriod(period) {
    currentPeriod = period;
    // 버튼 스타일 업데이트 (.period-filter-btn)
    updatePeriodDateRange();
    updateAdvancedAnalysis();  // 채널 그룹별 특성, 예산 투자 가이드
}

// 인사이트 & 채널 전략용
function switchInsightPeriod(period) {
    insightPeriod = period;
    // 버튼 스타일 업데이트 (.insight-period-btn)
    updateInsightPeriodDateRange();
    updateInsights();       // 핵심 요약
    updateUrgentAlerts();   // 긴급 개선
    updateBCGMatrix();      // 채널 전략
}
```

### 6.5 수정된 함수 목록

**인사이트 & 채널 전략 (getInsightPeriodData 사용)**:
- `updateInsights()`
- `updateUrgentAlerts()`
- `updateBCGMatrix()`

**데이터 기반 의사결정 도구 (getPeriodData 사용)**:
- `updateAdvancedAnalysis()` - 예산 투자 가이드, 채널 클러스터링, A/B 테스트 통계

**이탈 분석 (getChurnData 사용 - 전체 기간 고정)**:
- `updateChurnPredictions()`
- `updateImprovementPredictions()`

### 6.6 UI 디자인 구분

기간 필터 적용/미적용 영역을 시각적으로 구분:

```html
<!-- 기간 필터 적용 탭 -->
<button class="period-filter-enabled" title="선택한 기간 필터가 적용됩니다">
    채널 그룹별 특성
</button>

<!-- 기간 필터 미적용 탭 (전체 기간 고정) -->
<button class="period-filter-disabled" title="전체 기간 데이터만 사용됩니다">
    이탈 위험 경고
    <span style="...">전체</span>  <!-- 배지 표시 -->
</button>

<!-- 범례 -->
<div class="filter-legend">
    <span>🟣 기간 필터 적용</span>
    <span>⚫ 전체 기간 고정</span>
</div>
```

### 6.7 기간별 검증 결과

| 기간 | 분석 기간 | CVR | 클러스터 분포 |
|------|-----------|-----|---------------|
| 전체 | 2025-02-12 ~ 2025-12-01 | 0.65% | high:4, mid:7, low:7 |
| 180일 | 2025-06-04 ~ 2025-12-01 | 0.72% | high:2, mid:4, low:12 |
| 90일 | 2025-09-02 ~ 2025-12-01 | 0.68% | high:4, mid:7, low:4 |
| 30일 | 2025-11-01 ~ 2025-12-01 | 0.94% | high:1, mid:4, low:10 |

---

## 7. timeseries_analysis.html 구현 (2025-12-02)

### 7.1 개요

시계열 분석 대시보드에 기간 필터링 기능을 추가했습니다.

| 항목 | 내용 |
|------|------|
| 기간 변수 | `currentPeriod` |
| 헬퍼 함수 | `getPeriodData()` |
| 데이터 소스 | `data/forecast/insights.json` |

### 7.2 Python 스크립트 수정

#### `insight_generator.py` 변경사항 (v2.1)

**1) argparse 추가**
```python
import argparse
from datetime import datetime, timedelta

parser = argparse.ArgumentParser(
    description='마케팅 인사이트 생성 모듈 v2.1 (Multi-Period 지원)'
)
parser.add_argument(
    '--days',
    type=int,
    choices=[180, 90, 30],
    default=None,
    help='분석 기간 (일 수). 미지정시 전체 기간 분석.'
)
```

**2) InsightGenerator 클래스 수정**
```python
class InsightGenerator:
    def __init__(self, days: Optional[int] = None):
        self.days = days
        self.period_label = 'full' if days is None else f'{days}d'
        # ...

    def filter_by_days(self, df, date_column='일 구분'):
        """데이터프레임을 days 기준으로 필터링"""
        if self.days is None or df.empty:
            return df
        df = df.copy()
        df[date_column] = pd.to_datetime(df[date_column], errors='coerce')
        max_date = df[date_column].max()
        cutoff_date = max_date - timedelta(days=self.days)
        return df[df[date_column] >= cutoff_date]

    def generate(self, save: bool = True):
        """인사이트 생성 (save=False면 저장 안 함)"""
        # ...
```

#### `generate_insights_multiperiod.py` 신규 생성

```python
PERIODS = [None, 180, 90, 30]
PERIOD_LABELS = {None: 'full', 180: '180d', 90: '90d', 30: '30d'}

def generate_all_periods():
    all_insights = {
        'generated_at': datetime.now().isoformat(),
        'by_period': {}
    }

    for period in PERIODS:
        generator = InsightGenerator(days=period)
        insights = generator.generate(save=False)  # 개별 저장 안 함
        insights_converted = generator.convert_to_native_types(insights)
        all_insights['by_period'][PERIOD_LABELS[period]] = insights_converted

    # 최종 JSON 저장
    with open('data/forecast/insights.json', 'w', encoding='utf-8') as f:
        json.dump(all_insights, f, cls=NpEncoder, ensure_ascii=False, indent=2)
```

### 7.3 JSON 데이터 구조

```json
{
  "generated_at": "2025-12-02T...",
  "by_period": {
    "full": {
      "summary_card": {...},
      "overall": {...},
      "segments": { "alerts": [...], "recommendations": [...] },
      "opportunities": [...],
      "performance_trends": {...}
    },
    "180d": { ... },
    "90d": { ... },
    "30d": { ... }
  }
}
```

### 7.4 JavaScript 구현

#### 전역 변수 및 헬퍼 함수

```javascript
let currentPeriod = 'full';

function getPeriodData() {
    if (!insightsData) return null;
    if (insightsData.by_period) {
        return insightsData.by_period[currentPeriod] || insightsData.by_period['full'];
    }
    return insightsData;  // 이전 버전 호환
}

function switchPeriod(period) {
    currentPeriod = period;
    // 버튼 스타일 업데이트
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.period === period) btn.classList.add('active');
    });
    // 모든 인사이트 섹션 업데이트
    if (insightsData) updateAllInsights();
}

function updateAllInsights() {
    updateSummaryCard();
    updateAiSummary();
    updateDailyComparison();
    updateOpportunities();
    updateInsightsBadges();
    updateOverallInsights();
    updateInsightsFromData();
    updateRecommendations();
    updatePerformanceTrends();
}
```

#### 기간 필터 버튼 UI

```html
<div class="header">
    <div>
        <h1>시계열 데이터 분석</h1>
        <div class="header-subtitle">...</div>
    </div>
    <!-- 분석 기간 필터 -->
    <div class="view-type-section" style="margin-bottom: 0;">
        <span style="...">분석 기간:</span>
        <button class="view-btn period-btn active" data-period="full" onclick="switchPeriod('full')">전체</button>
        <button class="view-btn period-btn" data-period="180d" onclick="switchPeriod('180d')">180일</button>
        <button class="view-btn period-btn" data-period="90d" onclick="switchPeriod('90d')">90일</button>
        <button class="view-btn period-btn" data-period="30d" onclick="switchPeriod('30d')">30일</button>
    </div>
</div>
```

### 7.5 수정된 함수 목록

**getPeriodData() 사용으로 수정된 함수**:
- `updateSummaryCard()` - AI 상태 요약 카드
- `updateAiSummary()` - AI 분석 요약 메시지
- `updateDailyComparison()` - 오늘 실적 vs 예측 비교
- `updateOpportunities()` - 기회 요소
- `updateInsightsBadges()` - 탭 배지 (경고/추천 개수)
- `updateOverallInsights()` - 전체 성과 분석
- `updateInsightsFromData()` - 세그먼트 경고 알림
- `updateRecommendations()` - 투자 추천
- `updatePerformanceTrends()` - 성과 트렌드 분석

### 7.6 사용 방법

```bash
# 다중 기간 인사이트 한번에 생성
python scripts/generate_insights_multiperiod.py

# 개별 기간 인사이트 생성 (필요시)
python scripts/insight_generator.py              # 전체 기간
python scripts/insight_generator.py --days 180   # 최근 180일
python scripts/insight_generator.py --days 90    # 최근 90일
python scripts/insight_generator.py --days 30    # 최근 30일
```

---

## 8. 관련 파일 (전체)

### type_dashboard 관련

| 파일 | 설명 |
|------|------|
| `scripts/generate_type_insights.py` | 기간별 인사이트 생성 (--days 파라미터) |
| `scripts/generate_type_insights_multiperiod.py` | 다중 기간 인사이트 일괄 생성 |
| `data/type/insights.json` | 중첩 구조의 인사이트 데이터 |
| `data/type_dashboard.html` | 대시보드 HTML (기간 필터 UI 포함) |

### funnel_dashboard 관련

| 파일 | 설명 |
|------|------|
| `scripts/generate_funnel_data.py` | 기간별 퍼널 인사이트 생성 (--days 파라미터) |
| `scripts/generate_funnel_data_multiperiod.py` | 다중 기간 퍼널 인사이트 일괄 생성 |
| `data/funnel/insights.json` | 중첩 구조의 퍼널 인사이트 데이터 |
| `data/funnel_dashboard.html` | 대시보드 HTML (독립 기간 필터 2개) |

### timeseries_analysis 관련

| 파일 | 설명 |
|------|------|
| `scripts/insight_generator.py` | 기간별 인사이트 생성 (--days 파라미터, v2.1) |
| `scripts/generate_insights_multiperiod.py` | 다중 기간 인사이트 일괄 생성 |
| `data/forecast/insights.json` | 중첩 구조의 예측 인사이트 데이터 |
| `data/timeseries_analysis.html` | 대시보드 HTML (기간 필터 UI) |

### 공통

| 파일 | 설명 |
|------|------|
| `docs/RATIO_METRIC_CALCULATION_FIX.md` | 비율 지표 계산 규칙 |

---

## 9. 변경 이력

| 일자 | 대시보드 | 내용 |
|------|----------|------|
| 2025-12-01 | type | 초기 구현 완료 |
| 2025-12-01 | type | summary 계산 버그 수정 (category_summary → daily_summary) |
| 2025-12-01 | type | top_categories 계산 버그 수정 |
| 2025-12-02 | funnel | 초기 구현 완료 |
| 2025-12-02 | funnel | 독립적인 기간 필터 2개 구현 (인사이트/의사결정도구) |
| 2025-12-02 | funnel | 이탈 분석은 전체 기간 데이터만 사용하도록 분리 |
| 2025-12-02 | funnel | A/B 테스트 통계 반복 노출 버그 수정 |
| 2025-12-02 | funnel | 예산 투자 가이드 기간 필터링 구현 (channel_strategy 사용) |
| 2025-12-02 | timeseries | `insight_generator.py` v2.1 업데이트 (--days 파라미터) |
| 2025-12-02 | timeseries | `generate_insights_multiperiod.py` 래퍼 스크립트 생성 |
| 2025-12-02 | timeseries | `timeseries_analysis.html` 기간 필터 UI 추가 |
| 2025-12-02 | timeseries | 모든 인사이트 함수 getPeriodData() 사용으로 수정 |
