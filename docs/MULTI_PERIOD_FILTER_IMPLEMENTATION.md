# 다중 기간 필터링 기능 구현 가이드

## 개요

`type_dashboard.html`의 '데이터 기반 의사결정 도구' 탭에 기간별 필터링 기능을 구현한 내용을 정리합니다.

- **구현일**: 2025-12-01
- **필터 옵션**: 전체기간, 최근 180일, 최근 90일, 최근 30일
- **제외 항목**: '분기별 추이'는 전체 기간 데이터만 사용

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

## 6. 관련 파일

| 파일 | 설명 |
|------|------|
| `scripts/generate_type_insights.py` | 기간별 인사이트 생성 (--days 파라미터) |
| `scripts/generate_type_insights_multiperiod.py` | 다중 기간 인사이트 일괄 생성 |
| `data/type/insights.json` | 중첩 구조의 인사이트 데이터 |
| `data/type_dashboard.html` | 대시보드 HTML (기간 필터 UI 포함) |
| `docs/RATIO_METRIC_CALCULATION_FIX.md` | 비율 지표 계산 규칙 |

---

## 7. 변경 이력

| 일자 | 내용 |
|------|------|
| 2025-12-01 | 초기 구현 완료 |
| 2025-12-01 | summary 계산 버그 수정 (category_summary → daily_summary) |
| 2025-12-01 | top_categories 계산 버그 수정 (필터링된 dimensions['type1'] 사용) |
