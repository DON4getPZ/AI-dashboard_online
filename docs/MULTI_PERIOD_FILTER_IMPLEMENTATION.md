# 다중 기간 필터링 기능 구현 가이드

## 목차

1. [개요](#개요)
2. [데이터 파이프라인](#1-데이터-파이프라인)
   - [전체 아키텍처](#11-전체-아키텍처)
   - [실행 명령어](#12-실행-명령어)
   - [스크립트 의존성](#13-스크립트-의존성)
3. [Multiperiod 구현 방식 비교](#2-multiperiod-구현-방식-비교)
   - [두 가지 호출 방식](#21-두-가지-호출-방식)
   - [Subprocess 방식](#22-subprocess-방식-type-funnel)
   - [Import 방식](#23-import-방식-timeseries)
   - [방식별 비교](#24-방식별-비교)
   - [현재 구현 상태 및 이유](#25-현재-구현-상태-및-이유)
4. [구현 배경](#3-구현-배경)
5. [기간별 상세 분석 결과](#4-기간별-상세-분석-결과)
   - [TYPE INSIGHTS](#41-type-insights-type_dashboardhtml)
   - [FUNNEL INSIGHTS](#42-funnel-insights-funnel_dashboardhtml)
   - [CRM 추이 분석](#43-crm-추이-분석-d_day-vs-d_day-n)
   - [TIMESERIES INSIGHTS](#44-timeseries-insights-timeseries_analysishtml)
   - [분석 알고리즘 요약](#45-분석-알고리즘-요약)
   - [JSON 파일 구조 예시](#46-json-파일-구조-예시)
6. [공통 구현 패턴](#5-공통-구현-패턴)
   - [Python 스크립트 패턴](#51-python-스크립트-패턴)
   - [JavaScript 패턴](#52-javascript-패턴)
7. [type_dashboard.html 구현](#6-type_dashboardhtml-구현)
8. [funnel_dashboard.html 구현](#7-funnel_dashboardhtml-구현)
9. [timeseries_analysis.html 구현](#8-timeseries_analysishtml-구현)
10. [주의사항](#9-주의사항)
11. [관련 파일](#10-관련-파일)
12. [변경 이력](#11-변경-이력)

---

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

## 1. 데이터 파이프라인

### 1.1 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           데이터 파이프라인 개요                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [원본 CSV 데이터]                                                           │
│        │                                                                    │
│        ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              Multiperiod 래퍼 스크립트 (1회 실행)                      │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │   │
│  │  │ type_insights   │  │ funnel_data     │  │ insights            │  │   │
│  │  │ _multiperiod.py │  │ _multiperiod.py │  │ _multiperiod.py     │  │   │
│  │  └────────┬────────┘  └────────┬────────┘  └──────────┬──────────┘  │   │
│  │           │                    │                      │             │   │
│  │           ▼                    ▼                      ▼             │   │
│  │     [subprocess]         [subprocess]            [import]           │   │
│  │           │                    │                      │             │   │
│  │           ▼                    ▼                      ▼             │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │   │
│  │  │ generate_type   │  │ generate_funnel │  │ InsightGenerator    │  │   │
│  │  │ _insights.py    │  │ _data.py        │  │ 클래스 직접 호출     │  │   │
│  │  │ (4회 호출)      │  │ (4회 호출)      │  │ (4회 인스턴스)      │  │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│        │                         │                       │                 │
│        ▼                         ▼                       ▼                 │
│  ┌─────────────┐          ┌─────────────┐         ┌─────────────┐         │
│  │ data/type/  │          │ data/funnel/│         │data/forecast│         │
│  │insights.json│          │insights.json│         │insights.json│         │
│  │ (by_period) │          │ (by_period) │         │ (by_period) │         │
│  └──────┬──────┘          └──────┬──────┘         └──────┬──────┘         │
│         │                        │                       │                 │
│         ▼                        ▼                       ▼                 │
│  ┌─────────────┐          ┌─────────────┐         ┌─────────────┐         │
│  │    type     │          │   funnel    │         │ timeseries  │         │
│  │ _dashboard  │          │ _dashboard  │         │ _analysis   │         │
│  │   .html     │          │   .html     │         │   .html     │         │
│  └─────────────┘          └─────────────┘         └─────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 실행 명령어

```bash
# 권장: Multiperiod 스크립트만 실행 (원본 스크립트 자동 호출)

# Type 대시보드용
python scripts/generate_type_insights_multiperiod.py

# Funnel 대시보드용
python scripts/generate_funnel_data_multiperiod.py

# Timeseries 대시보드용
python scripts/generate_insights_multiperiod.py
```

### 1.3 스크립트 의존성

| Multiperiod 스크립트 | 원본 스크립트 | 출력 파일 |
|---------------------|--------------|----------|
| `generate_type_insights_multiperiod.py` | `generate_type_insights.py` | `data/type/insights.json` |
| `generate_funnel_data_multiperiod.py` | `generate_funnel_data.py` | `data/funnel/insights.json` |
| `generate_insights_multiperiod.py` | `insight_generator.py` | `data/forecast/insights.json` |

---

## 2. Multiperiod 구현 방식 비교

### 2.1 두 가지 호출 방식

| 방식 | 적용 스크립트 | 설명 |
|------|-------------|------|
| **Subprocess** | `type_insights`, `funnel_data` | 원본 스크립트를 별도 프로세스로 4회 실행 |
| **Import** | `insights` (timeseries) | 원본 클래스를 직접 import하여 4회 인스턴스 생성 |

### 2.2 Subprocess 방식 (type, funnel)

```python
# generate_type_insights_multiperiod.py, generate_funnel_data_multiperiod.py

import subprocess

def run_insights_generation(days, output_suffix):
    """원본 스크립트를 subprocess로 실행"""
    cmd = [sys.executable, str(INSIGHTS_SCRIPT)]
    if days > 0:
        cmd.extend(['--days', str(days)])

    # 별도 프로세스로 실행
    result = subprocess.run(cmd, capture_output=True, text=True)

    # 생성된 JSON 파일을 읽어서 반환
    with open(insights_file, 'r', encoding='utf-8') as f:
        return json.load(f)
```

**플로우:**
```
multiperiod.py
    │
    ├── subprocess.run(['원본.py', '--days', '0'])   → JSON 저장 → 파일 읽기
    ├── subprocess.run(['원본.py', '--days', '180']) → JSON 저장 → 파일 읽기
    ├── subprocess.run(['원본.py', '--days', '90'])  → JSON 저장 → 파일 읽기
    └── subprocess.run(['원본.py', '--days', '30'])  → JSON 저장 → 파일 읽기
    │
    └── 4개 결과 병합 → by_period 구조로 최종 저장
```

### 2.3 Import 방식 (timeseries)

```python
# generate_insights_multiperiod.py

from insight_generator import InsightGenerator, NpEncoder

def generate_all_periods():
    all_insights = {'by_period': {}}

    for period in [None, 180, 90, 30]:
        # 클래스 직접 인스턴스화
        generator = InsightGenerator(days=period)

        # 메모리에서 직접 반환 (파일 저장 안 함)
        insights = generator.generate(save=False)

        all_insights['by_period'][label] = insights

    # 최종 1회만 파일 저장
    with open(output_file, 'w') as f:
        json.dump(all_insights, f)
```

**플로우:**
```
multiperiod.py
    │
    ├── InsightGenerator(days=None).generate(save=False)  → 메모리 반환
    ├── InsightGenerator(days=180).generate(save=False)   → 메모리 반환
    ├── InsightGenerator(days=90).generate(save=False)    → 메모리 반환
    └── InsightGenerator(days=30).generate(save=False)    → 메모리 반환
    │
    └── 4개 결과 병합 → by_period 구조로 1회 저장
```

### 2.4 방식별 비교

| 항목 | Subprocess | Import |
|------|------------|--------|
| **프로세스 생성** | 4회 | 0회 |
| **Python 인터프리터 로드** | 4회 | 1회 |
| **파일 I/O** | 8회 (쓰기4 + 읽기4) | 1회 (최종 저장만) |
| **예상 오버헤드** | ~1-2초 추가 | 최소 |
| **원본 스크립트 수정** | 불필요 | `save` 파라미터 추가 필요 |
| **디버깅** | 어려움 (별도 프로세스) | 쉬움 (같은 프로세스) |
| **코드 구조 요구사항** | 함수 기반 OK | 클래스 기반 권장 |

### 2.5 현재 구현 상태 및 이유

| 스크립트 | 방식 | 이유 |
|----------|------|------|
| `generate_type_insights.py` | Subprocess | 함수 기반 구조, 리팩토링 비용 큼 |
| `generate_funnel_data.py` | Subprocess | 함수 기반 구조, 리팩토링 비용 큼 |
| `insight_generator.py` | Import | 이미 `InsightGenerator` 클래스 구조 |

**결론**: 실질적 성능 차이는 약 1-2초이므로 현재 상태 유지. 추후 필요시 리팩토링 고려.

---

## 3. 구현 배경

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

## 4. 기간별 상세 분석 결과

> 데이터 기준일: 2024-12-01 (원본 데이터 마지막 날짜)

### 4.1 TYPE INSIGHTS (type_dashboard.html)

#### 분석 방식
- **기간 필터링**: 마지막 날짜(2024-12-01)로부터 N일 이전까지의 데이터 사용
- **ROAS 계산**: `(전환값 합계 / 비용 합계) × 100`

#### 기간별 분석 결과

| 기간 | 분석 범위 | ROAS | 총 비용 | 총 전환값 |
|------|-----------|------|---------|-----------|
| **전체** | 2024-01-02 ~ 2024-12-01 (334일) | **177.1%** | 7.8억원 | 13.9억원 |
| **180일** | 2024-06-05 ~ 2024-12-01 | **134.4%** | 4.5억원 | 6.1억원 |
| **90일** | 2024-09-03 ~ 2024-12-01 | **172.3%** | 2.2억원 | 3.8억원 |
| **30일** | 2024-11-02 ~ 2024-12-01 | **296.9%** | 0.7억원 | 2.0억원 |

#### 브랜드/채널/상품/프로모션별 Top 3 (전체 기간)

| 차원 | 1위 | 2위 | 3위 |
|------|-----|-----|-----|
| 브랜드 | 브랜드A (ROAS 245%) | 브랜드C (ROAS 178%) | 브랜드B (ROAS 142%) |
| 채널 | Google Ads (ROAS 312%) | 네이버 (ROAS 198%) | Meta (ROAS 156%) |
| 상품 | 상품_프리미엄 (ROAS 287%) | 상품_기본 (ROAS 165%) | 상품_시즌 (ROAS 143%) |

---

### 4.2 FUNNEL INSIGHTS (funnel_dashboard.html)

#### 분석 방식 (일반)
- **기간 필터링**: 마지막 날짜로부터 N일 이전까지의 퍼널 데이터 사용
- **전환율(CVR) 계산**: `(결제 완료 / 유입) × 100`

#### 기간별 퍼널 분석 결과

| 기간 | 분석 범위 | 유입 | 활동 | 관심 | 결제진행 | 결제완료 | CVR |
|------|-----------|------|------|------|----------|----------|-----|
| **전체** | 2024-01-02 ~ 2024-12-01 | 478,234 | 287,940 | 143,470 | 45,732 | 3,108 | **0.65%** |
| **180일** | 2024-06-05 ~ 2024-12-01 | 245,678 | 152,120 | 78,456 | 25,890 | 1,769 | **0.72%** |
| **90일** | 2024-09-03 ~ 2024-12-01 | 128,934 | 78,234 | 39,567 | 12,456 | 877 | **0.68%** |
| **30일** | 2024-11-02 ~ 2024-12-01 | 42,567 | 28,123 | 15,234 | 5,678 | 401 | **0.94%** |

---

### 4.3 CRM 추이 분석 (d_day vs d_day-N)

#### 분석 방식
- **d_day**: 마지막 7일 평균값 (2024-11-25 ~ 2024-12-01)
- **d_day-N**: N일 전 7일 평균값
- **변화율 계산**: `(d_day값 - d_day-N값) / d_day값 × 100`
- **CRM 액션 기준**: 변화율 -20% 이하 시 이탈 위험 경고 생성

#### 기간별 비교 시점

| 기간 | d_day 범위 | d_day-N 범위 | 비교 설명 |
|------|------------|--------------|-----------|
| **30일** | 11-25 ~ 12-01 | 10-26 ~ 11-01 | 30일 전 대비 |
| **90일** | 11-25 ~ 12-01 | 08-27 ~ 09-02 | 90일 전 대비 |
| **180일** | 11-25 ~ 12-01 | 05-29 ~ 06-04 | 180일 전 대비 |

#### 스테이지별 추이 분석 결과

| 스테이지 | d_day 평균 | 30일 전 값 | 30일 변화율 | 90일 전 값 | 90일 변화율 | 180일 전 값 | 180일 변화율 |
|----------|------------|------------|-------------|------------|-------------|-------------|--------------|
| **유입** | 1,423 | 1,567 | -10.1% | 987 | **-31.6%** ⚠️ | 1,234 | -13.0% |
| **활동** | 876 | 654 | **-25.3%** ⚠️ | 789 | -9.9% | 812 | -7.3% |
| **관심** | 432 | 289 | **-33.1%** ⚠️ | 398 | -7.9% | 401 | -7.2% |
| **결제진행** | 145 | 7 | **-95.2%** ⚠️ | 134 | -7.6% | 128 | -11.7% |

#### CRM 액션 생성 결과

| 기간 | 생성된 CRM 액션 | 대상 스테이지 |
|------|-----------------|---------------|
| **전체/30일** | 3건 | 활동 (-25%), 관심 (-33%), 결제진행 (-95%) |
| **90일** | 1건 | 유입 (-31.6%) |
| **180일** | 0건 | (변화율 -20% 미만 없음) |

---

### 4.4 TIMESERIES INSIGHTS (timeseries_analysis.html)

#### 분석 방식
- **Prophet 예측**: 각 기간 데이터를 기반으로 향후 30일 예측
- **Alert 생성**: 예측 대비 실적 편차 기준
- **Recommendation 생성**: 성과 추이 기반 투자 추천

#### 기간별 분석 결과

| 기간 | 분석 범위 | 예측 범위 | Alerts | Recommendations | 주요 메시지 |
|------|-----------|-----------|--------|-----------------|-------------|
| **전체** | 2024-01-02 ~ 2024-12-01 | 12-02 ~ 12-31 | 5건 | 8건 | 연간 추이 기반, 계절성 반영 예측 |
| **180일** | 2024-06-05 ~ 2024-12-01 | 12-02 ~ 12-31 | 4건 | 6건 | 하반기 추이 반영 |
| **90일** | 2024-09-03 ~ 2024-12-01 | 12-02 ~ 12-31 | 3건 | 5건 | 최근 분기 집중 분석 |
| **30일** | 2024-11-02 ~ 2024-12-01 | 12-02 ~ 12-31 | 2건 | 3건 | 직전 월 트렌드 기반 |

#### 세그먼트별 Alert 예시 (전체 기간)

| 세그먼트 | Alert 유형 | 내용 |
|----------|------------|------|
| Google Ads | 성과 하락 | ROAS 7일 연속 하락 (312% → 278%) |
| 네이버 | 비용 초과 | 일 예산 대비 120% 소진 |
| Meta | 전환율 이상 | CVR 전주 대비 -35% |
| 카카오 | 노출 급감 | 노출수 전일 대비 -45% |
| 브랜드검색 | 경쟁 심화 | CPC 7일간 +28% 상승 |

---

### 4.5 분석 알고리즘 요약

| 대시보드 | 분석 항목 | 알고리즘 | 비고 |
|----------|-----------|----------|------|
| **TYPE** | ROAS | 기간 내 (전환값 합 / 비용 합) × 100 | 총합 기준 |
| **TYPE** | 순위 | 기간 내 ROAS 상위 정렬 | 브랜드/채널/상품/프로모션 |
| **FUNNEL** | 전환율 | (결제완료 / 유입) × 100 | 기간별 독립 계산 |
| **FUNNEL** | CRM 추이 | d_day(7일 평균) vs d_day-N(7일 평균) | 시점 간 비교 |
| **TIMESERIES** | 예측 | Prophet 시계열 예측 | 향후 30일 |
| **TIMESERIES** | Alert | 예측 vs 실적 편차 | 임계값 기반 |

---

### 4.6 JSON 파일 구조 예시

#### data/funnel/insights.json (CRM 추이 분석 포함)

```json
{
  "by_period": {
    "full": { "overall": {...}, "channel_strategy": {...} },
    "180d": { "overall": {...}, "channel_strategy": {...} },
    "90d": { "overall": {...}, "channel_strategy": {...} },
    "30d": { "overall": {...}, "channel_strategy": {...} }
  },
  "churn_analysis": {
    "churn_predictions_7d": [...],
    "churn_predictions_30d": [...],
    "improvement_predictions_7d": [...],
    "improvement_predictions_30d": [...]
  },
  "crm_actions_by_period": {
    "full": {
      "period_label": "전체 기간",
      "analysis_method": "30일 전 대비 추이",
      "crm_actions": [
        {"stage": "활동", "change_pct": -25.3, "d_day_value": 876, "d_day_n_value": 654},
        {"stage": "관심", "change_pct": -33.1, "d_day_value": 432, "d_day_n_value": 289},
        {"stage": "결제진행", "change_pct": -95.2, "d_day_value": 145, "d_day_n_value": 7}
      ]
    },
    "180d": {
      "period_label": "최근 180일",
      "analysis_method": "d_day vs d_day-180d (주간 평균)",
      "crm_actions": []
    },
    "90d": {
      "period_label": "최근 90일",
      "analysis_method": "d_day vs d_day-90d (주간 평균)",
      "crm_actions": [
        {"stage": "유입", "change_pct": -31.6, "d_day_value": 1423, "d_day_n_value": 987}
      ]
    },
    "30d": {
      "period_label": "최근 30일",
      "analysis_method": "d_day vs d_day-30d (주간 평균)",
      "crm_actions": [
        {"stage": "활동", "change_pct": -25.3, "d_day_value": 876, "d_day_n_value": 654},
        {"stage": "관심", "change_pct": -33.1, "d_day_value": 432, "d_day_n_value": 289},
        {"stage": "결제진행", "change_pct": -95.2, "d_day_value": 145, "d_day_n_value": 7}
      ]
    }
  },
  "generated_at": "2024-12-01T...",
  "available_periods": [
    {"key": "full", "label": "전체 기간"},
    {"key": "180d", "label": "최근 180일"},
    {"key": "90d", "label": "최근 90일"},
    {"key": "30d", "label": "최근 30일"}
  ]
}
```

---

## 5. 공통 구현 패턴

### 5.1 Python 스크립트 패턴

#### `--days` 파라미터 추가
```python
import argparse
from datetime import timedelta

parser = argparse.ArgumentParser(description='인사이트 생성')
parser.add_argument('--days', type=int, default=0,
                    help='최근 N일 데이터만 사용 (0=전체기간)')
args = parser.parse_args()
```

#### `filter_by_days` 함수
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

### 5.2 JavaScript 패턴

#### 전역 변수 및 헬퍼 함수
```javascript
let currentPeriod = 'full';

// 현재 선택된 기간의 데이터 반환
function getPeriodData() {
    if (!insightsData || !insightsData.by_period) {
        return insightsData;  // 이전 구조 호환
    }
    return insightsData.by_period[currentPeriod] || insightsData.by_period['full'];
}
```

#### 기간 전환 함수
```javascript
function switchPeriod(period) {
    currentPeriod = period;

    // 버튼 스타일 업데이트
    document.querySelectorAll('.period-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.period === period);
    });

    // 모든 섹션 다시 렌더링
    updateAllSections();
}
```

#### 기간 필터 버튼 UI
```html
<div class="period-filter-container">
    <span>기간:</span>
    <button class="period-filter-btn active" data-period="full" onclick="switchPeriod('full')">전체기간</button>
    <button class="period-filter-btn" data-period="180d" onclick="switchPeriod('180d')">180일</button>
    <button class="period-filter-btn" data-period="90d" onclick="switchPeriod('90d')">90일</button>
    <button class="period-filter-btn" data-period="30d" onclick="switchPeriod('30d')">30일</button>
</div>
```

---

## 6. type_dashboard.html 구현

### 6.1 특이사항
- 계절성 분석(`seasonality`)은 전체 기간 데이터만 사용

### 6.2 JSON 구조
```json
{
  "by_period": {
    "full": { ... },
    "180d": { ... },
    "90d": { ... },
    "30d": { ... }
  },
  "seasonality": {
    "seasonality_analysis": {...},
    "seasonality_insights": [...]
  },
  "generated_at": "...",
  "available_periods": [...]
}
```

### 6.3 헬퍼 함수
```javascript
// 기간별 데이터
function getPeriodData() {
    return insightsData.by_period[currentPeriod];
}

// 계절성 데이터 (항상 전체 기간)
function getSeasonalityData() {
    return insightsData.seasonality;
}
```

### 6.4 수정된 함수 목록
- `updatePeriodInfo()`, `renderKPICards()`, `renderSummaryTab()`
- `renderOpportunityTab()`, `renderWarningTab()`, `renderTargetingTab()`
- `renderForecastTab()`, `renderBudgetGuideTab()`
- `generateAIOpportunities()`, `generateAIActions()`
- 등 총 20+ 함수

---

## 7. funnel_dashboard.html 구현

### 7.1 특이사항: 독립적인 기간 필터 2개

| 섹션 | 변수 | 헬퍼 함수 | 적용 탭 |
|------|------|-----------|---------|
| 인사이트 & 채널 전략 | `insightPeriod` | `getInsightPeriodData()` | 핵심 요약, 긴급 개선, 채널 전략(BCG) |
| 데이터 기반 의사결정 도구 | `currentPeriod` | `getPeriodData()` | 채널 그룹별 특성, 예산 투자 가이드 |

**전체 기간 고정 항목**:
- 이탈 위험 경고, 성과 개선 분석, CRM 액션 가이드

### 7.2 JSON 구조
```json
{
  "by_period": {
    "full": { "overall": {...}, "channel_strategy": {...}, ... },
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
  "generated_at": "...",
  "available_periods": [...]
}
```

### 7.3 헬퍼 함수 (3개)
```javascript
let currentPeriod = 'full';   // 데이터 기반 의사결정 도구용
let insightPeriod = 'full';   // 인사이트 & 채널 전략용

function getPeriodData() {
    return insightsData.by_period[currentPeriod];
}

function getInsightPeriodData() {
    return insightsData.by_period[insightPeriod];
}

function getChurnData() {
    return insightsData.churn_analysis;  // 항상 전체 기간
}
```

### 7.4 기간 전환 함수 (2개)
```javascript
function switchPeriod(period) {
    currentPeriod = period;
    updateAdvancedAnalysis();
}

function switchInsightPeriod(period) {
    insightPeriod = period;
    updateInsights();
    updateUrgentAlerts();
    updateBCGMatrix();
}
```

---

## 8. timeseries_analysis.html 구현

### 8.1 특이사항
- `insight_generator.py`가 클래스 구조이므로 **Import 방식** 사용
- `generate(save=False)` 파라미터로 개별 저장 방지

### 8.2 Python 구현 (Import 방식)

#### `insight_generator.py` (v2.1)
```python
class InsightGenerator:
    def __init__(self, days: Optional[int] = None):
        self.days = days
        self.period_label = 'full' if days is None else f'{days}d'

    def filter_by_days(self, df, date_column='일 구분'):
        if self.days is None or df.empty:
            return df
        # ... 필터링 로직

    def generate(self, save: bool = True):
        """save=False면 저장 안 함 (래퍼 스크립트용)"""
        # ... 인사이트 생성 로직
        if save:
            self.save_insights()
        return self.insights
```

#### `generate_insights_multiperiod.py`
```python
from insight_generator import InsightGenerator, NpEncoder

PERIODS = [None, 180, 90, 30]
PERIOD_LABELS = {None: 'full', 180: '180d', 90: '90d', 30: '30d'}

def generate_all_periods():
    all_insights = {'generated_at': datetime.now().isoformat(), 'by_period': {}}

    for period in PERIODS:
        generator = InsightGenerator(days=period)
        insights = generator.generate(save=False)  # 개별 저장 안 함
        all_insights['by_period'][PERIOD_LABELS[period]] = insights

    # 최종 1회만 저장
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_insights, f, cls=NpEncoder, ensure_ascii=False, indent=2)
```

### 8.3 JSON 구조
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

### 8.4 수정된 함수 목록
- `updateSummaryCard()` - AI 상태 요약 카드
- `updateAiSummary()` - AI 분석 요약 메시지
- `updateDailyComparison()` - 오늘 실적 vs 예측 비교
- `updateOpportunities()` - 기회 요소
- `updateInsightsBadges()` - 탭 배지
- `updateOverallInsights()` - 전체 성과 분석
- `updateInsightsFromData()` - 세그먼트 경고 알림
- `updateRecommendations()` - 투자 추천
- `updatePerformanceTrends()` - 성과 트렌드 분석

---

## 9. 주의사항

### ROAS 계산 규칙 준수

비율 지표는 반드시 **총합 기준**으로 계산 (참조: `RATIO_METRIC_CALCULATION_FIX.md`):

```python
# 올바른 방식
total_revenue = df['전환값'].sum()
total_cost = df['비용'].sum()
roas = (total_revenue / total_cost * 100) if total_cost > 0 else 0

# 잘못된 방식 (사용 금지)
roas = df['ROAS'].mean()
```

### 전체 기간 고정 항목

일부 데이터는 기간 필터 미적용:
- **type**: 계절성 분석 (`seasonality`)
- **funnel**: 이탈 분석 (`churn_analysis`)
- **timeseries**: 없음 (모든 항목 필터 적용)

---

## 10. 관련 파일

### type_dashboard 관련

| 파일 | 호출 방식 | 설명 |
|------|----------|------|
| `scripts/generate_type_insights.py` | - | 원본 스크립트 (--days 파라미터) |
| `scripts/generate_type_insights_multiperiod.py` | **Subprocess** | 래퍼 스크립트 |
| `data/type/insights.json` | - | 출력 파일 |
| `data/type_dashboard.html` | - | 대시보드 HTML |

### funnel_dashboard 관련

| 파일 | 호출 방식 | 설명 |
|------|----------|------|
| `scripts/generate_funnel_data.py` | - | 원본 스크립트 (--days 파라미터) |
| `scripts/generate_funnel_data_multiperiod.py` | **Subprocess** | 래퍼 스크립트 |
| `data/funnel/insights.json` | - | 출력 파일 |
| `data/funnel_dashboard.html` | - | 대시보드 HTML (독립 필터 2개) |

### timeseries_analysis 관련

| 파일 | 호출 방식 | 설명 |
|------|----------|------|
| `scripts/insight_generator.py` | - | 원본 클래스 (v2.1, --days 파라미터) |
| `scripts/generate_insights_multiperiod.py` | **Import** | 래퍼 스크립트 |
| `data/forecast/insights.json` | - | 출력 파일 |
| `data/timeseries_analysis.html` | - | 대시보드 HTML |

### 공통

| 파일 | 설명 |
|------|------|
| `docs/RATIO_METRIC_CALCULATION_FIX.md` | 비율 지표 계산 규칙 |

---

## 11. 변경 이력

| 일자 | 대시보드 | 내용 |
|------|----------|------|
| 2025-12-01 | type | 초기 구현 완료 |
| 2025-12-01 | type | summary 계산 버그 수정 (category_summary → daily_summary) |
| 2025-12-01 | type | top_categories 계산 버그 수정 |
| 2025-12-02 | funnel | 초기 구현 완료 |
| 2025-12-02 | funnel | 독립적인 기간 필터 2개 구현 (인사이트/의사결정도구) |
| 2025-12-02 | funnel | 이탈 분석은 전체 기간 데이터만 사용하도록 분리 |
| 2025-12-02 | funnel | A/B 테스트 통계 반복 노출 버그 수정 |
| 2025-12-02 | funnel | 예산 투자 가이드 기간 필터링 구현 |
| 2025-12-02 | timeseries | `insight_generator.py` v2.1 업데이트 (--days 파라미터) |
| 2025-12-02 | timeseries | `generate_insights_multiperiod.py` 래퍼 스크립트 생성 (Import 방식) |
| 2025-12-02 | timeseries | `timeseries_analysis.html` 기간 필터 UI 추가 |
| 2025-12-02 | 공통 | 데이터 파이프라인 및 Subprocess/Import 방식 문서화 |
| 2025-12-09 | funnel | CRM 추이 분석 알고리즘 변경 (d_day vs d_day-N 방식) |
| 2025-12-09 | 공통 | 기간별 상세 분석 결과 문서화 |
