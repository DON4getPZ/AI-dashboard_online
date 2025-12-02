# Prophet 기간별 학습 구현 계획

## 1. 현재 Prophet 스크립트 분석

### 1.1 Prophet을 사용하는 스크립트

| 스크립트 | 역할 | TRAINING_DAYS | OUTPUT_DAYS |
|---------|------|---------------|-------------|
| `multi_analysis_prophet_forecast.py` | 메인 Prophet 예측 생성 | 365일 | 180일 |
| `process_marketing_data.py` | 마케팅 데이터 처리 + 예측 | 365일 | 180일 |
| `segment_processor.py` | 세그먼트별 예측 | 365일 | 180일 |
| `generate_type_insights.py` | Prophet 파일 읽기만 (학습 X) | - | - |

### 1.2 현재 구조의 문제점

```
현재 흐름:
┌─────────────────────────────────────┐
│ multi_analysis_prophet_forecast.py  │
│   - 전체 365일 데이터로 학습        │
│   - 180일 예측 생성                 │
│   - prophet_forecast_*.csv 저장     │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ generate_type_insights_multiperiod  │
│   - 3번 실행 (full, 180d, 90d)      │
│   - Prophet 예측은 재생성 안함 ❌    │
│   - 동일한 prophet_forecast 사용    │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ insights.json                       │
│   - 모든 기간에 동일한 Prophet 예측 │
└─────────────────────────────────────┘
```

## 2. 원하는 기간별 학습 구조

| 기간 선택 | Prophet 학습 데이터 | 예측 기간 |
|----------|-------------------|----------|
| 전체     | 전체 (365일)       | 30일     |
| 180일    | 최근 180일         | 30일     |
| 90일     | 최근 90일          | 30일     |

```
원하는 흐름:
┌─────────────────────────────────────────────────────┐
│ generate_type_insights_multiperiod.py (수정)         │
│                                                     │
│   for period in [full, 180d, 90d]:                 │
│       1. multi_analysis_prophet_forecast.py 실행    │
│          --days={period} --output-days=30          │
│       2. generate_type_insights.py 실행             │
│          --days={period}                           │
│       3. 결과 수집                                  │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ insights.json                                       │
│   by_period:                                        │
│     full:   { prophet_forecast: 365일학습→30일예측 } │
│     180d:   { prophet_forecast: 180일학습→30일예측 } │
│     90d:    { prophet_forecast: 90일학습→30일예측 }  │
└─────────────────────────────────────────────────────┘
```

## 3. 필요한 수정 사항

### 3.1 multi_analysis_prophet_forecast.py 수정

```python
# 현재
TRAINING_DAYS = 365
OUTPUT_DAYS = 180

# 수정 후
import argparse
parser = argparse.ArgumentParser()
parser.add_argument('--days', type=int, default=0,
                    help='학습 데이터 기간 (0=전체/365일)')
parser.add_argument('--output-days', type=int, default=30,
                    help='예측 기간 (기본 30일)')
args = parser.parse_args()

TRAINING_DAYS = args.days if args.days > 0 else 365
OUTPUT_DAYS = args.output_days
```

#### 주요 변경 포인트

| 라인 | 현재 | 수정 |
|-----|------|------|
| 36 | `TRAINING_DAYS = 365` | `argparse`로 동적 설정 |
| 38 | `OUTPUT_DAYS = 180` | `--output-days` 파라미터 (기본값 30) |
| 54-58 | 365일 고정 필터링 | `TRAINING_DAYS` 변수 사용 |

### 3.2 generate_type_insights_multiperiod.py 수정

```python
# 기간 설정 변경
PERIODS = [
    {'key': 'full', 'days': 0, 'label': '전체 기간'},
    {'key': '180d', 'days': 180, 'label': '최근 180일'},
    {'key': '90d', 'days': 90, 'label': '최근 90일'}
]

# Prophet 예측 생성 함수 추가
def run_prophet_forecast(days):
    """기간별 Prophet 예측 생성"""
    cmd = [sys.executable, str(PROPHET_SCRIPT)]
    if days > 0:
        cmd.extend(['--days', str(days)])
    cmd.extend(['--output-days', '30'])
    subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')

def run_insights_generation(days, output_suffix):
    # 1. Prophet 예측 먼저 생성
    run_prophet_forecast(days)

    # 2. Insights 생성
    cmd = [sys.executable, str(INSIGHTS_SCRIPT)]
    if days > 0:
        cmd.extend(['--days', str(days)])
    # ...
```

### 3.3 process_marketing_data.py / segment_processor.py

이 스크립트들도 동일하게 `--days` 파라미터 지원 추가 필요.
단, `multi_analysis_prophet_forecast.py`가 메인이므로 우선순위 낮음.

## 4. 구현 순서

### Phase 1: multi_analysis_prophet_forecast.py 수정
1. `argparse` 추가 (--days, --output-days)
2. `TRAINING_DAYS` 동적 설정
3. `OUTPUT_DAYS` 기본값 180 → 30으로 변경
4. 기존 로직에서 하드코딩된 365, 180 제거

### Phase 2: generate_type_insights_multiperiod.py 수정
1. PERIODS에서 30d 제거 (full, 180d, 90d만 유지)
2. Prophet 예측 생성 함수 추가
3. 각 기간별로 Prophet 예측 → Insights 순서로 실행
4. 결과 통합

### Phase 3: 대시보드 수정
1. 기간 필터 버튼에서 "최근 30일" 제거
2. full, 180d, 90d 3개 기간만 지원

### Phase 4: 테스트
1. 각 기간별 Prophet 예측이 다른지 확인
2. insights.json에 기간별 다른 prophet_forecast 포함 확인
3. 대시보드에서 기간 전환 시 데이터 변경 확인

## 5. 예상 결과

### 5.1 Prophet 예측 파일
```
data/type/
  prophet_forecast_overall.csv      # 마지막 실행 결과
  prophet_forecast_by_category.csv
  prophet_forecast_by_brand.csv
  prophet_forecast_by_product.csv
  prophet_forecast_by_gender.csv
  prophet_forecast_by_age.csv
  prophet_forecast_by_platform.csv
  prophet_forecast_by_device.csv
  prophet_forecast_by_promotion.csv
  prophet_forecast_by_age_gender.csv
  prophet_forecast_by_seasonality.csv
```

### 5.2 insights.json (기간별 다른 예측)
```json
{
  "by_period": {
    "full": {
      "prophet_forecast": {
        "summary": {
          "overall": {
            "forecast_period": {
              "start_date": "2025-12-02",
              "end_date": "2026-01-01",
              "total_days": 30
            },
            "avg_forecast_roas": 185.5,
            "total_forecast_revenue": 150000000
          }
        },
        "by_category": [...],
        "by_brand": [...],
        "by_product": [...]
      }
    },
    "180d": {
      "prophet_forecast": {
        "summary": {
          "overall": {
            "forecast_period": {
              "start_date": "2025-12-02",
              "end_date": "2026-01-01",
              "total_days": 30
            },
            "avg_forecast_roas": 192.3,
            "total_forecast_revenue": 145000000
          }
        }
      }
    },
    "90d": {
      "prophet_forecast": {
        "summary": {
          "overall": {
            "avg_forecast_roas": 198.7,
            "total_forecast_revenue": 140000000
          }
        }
      }
    }
  },
  "seasonality": { ... },
  "generated_at": "2025-12-02T...",
  "available_periods": [
    {"key": "full", "label": "전체 기간"},
    {"key": "180d", "label": "최근 180일"},
    {"key": "90d", "label": "최근 90일"}
  ]
}
```

## 6. 주의사항

### 6.1 학습 데이터 최소 요건
- Prophet은 최소 2개 이상의 계절 주기 필요
- 주간 계절성: 최소 14일+ 데이터
- 연간 계절성: 최소 365일+ 데이터
- 90일 학습 시: weekly_seasonality만 사용 (yearly 비활성화)

### 6.2 실행 시간
- 현재: Prophet 1회 실행
- 수정 후: Prophet 3회 실행 (기간당 1회)
- 예상 소요 시간: 약 3배 증가

### 6.3 메모리 사용
- Prophet 모델 3회 학습으로 메모리 사용량 증가
- 각 기간별로 모델 학습 후 메모리 해제 필요

## 7. 기간별 학습 특성

| 기간 | 학습 데이터 | yearly_seasonality | weekly_seasonality | 예측 특성 |
|-----|-----------|-------------------|-------------------|----------|
| 전체 (365일) | 1년치 | ✅ 활성화 | ✅ 활성화 | 연간+주간 패턴 반영 |
| 180일 | 6개월치 | ❌ 비활성화 | ✅ 활성화 | 주간 패턴만 반영 |
| 90일 | 3개월치 | ❌ 비활성화 | ✅ 활성화 | 최근 트렌드 반영 |

## 8. 파일 수정 체크리스트

### 8.1 스크립트 수정
- [x] `multi_analysis_prophet_forecast.py` - argparse 추가 (--days, --output-days, default=30)
- [x] `generate_type_insights_multiperiod.py` - Prophet 호출 추가, PERIODS 수정 (30d 제거)
- [x] `process_marketing_data.py` - argparse 추가 (--days, --output-days, default=30)
- [x] `segment_processor.py` - argparse 추가 (--days, --output-days, default=30)

### 8.2 대시보드 수정
- [x] `type_dashboard.html` - 기간 필터 버튼 수정 (3개만: full, 180d, 90d)
- [x] `type_dashboard.html` - periodLabels 상수 수정

### 8.3 설정 파일 수정
- [x] `generate_type_insights_multiperiod.py` - PERIODS 배열 수정 (30d 제거)

## 9. 구현 완료 (2025-12-02)

### 변경된 Prophet 예측 결과 (기간별 비교)

| 기간 | 예측 ROAS | 예측 매출 | 예측 비용 |
|-----|----------|----------|----------|
| full (365일) | 234.2% | 190M | 81M |
| 180d | 237.9% | 187M | 79M |
| 90d | 306.0% | 192M | 63M |

90일 기간에서 ROAS가 특히 높은 이유: 최근 3개월의 성과 개선 트렌드가 예측에 더 강하게 반영됨
