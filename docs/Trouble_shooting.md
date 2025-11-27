# Trouble Shooting Guide

Python 프로젝트 개발 시 자주 발생하는 문제와 해결 패턴을 정리한 가이드입니다.

---

## 1. 하드코딩 경로 → 동적 경로 변환

### 문제 상황

```python
# 특정 PC에서만 동작하는 하드코딩 경로
file_path = r'c:\Users\username\Desktop\project\data\file.csv'
output_dir = r'c:\Users\username\Desktop\project\data'
```

**증상:**
- 다른 PC에서 `FileNotFoundError` 발생
- 프로젝트 폴더 이동 시 경로 수정 필요
- 협업 시 각자 경로 수정 필요

### 해결 패턴

```python
from pathlib import Path

# 스크립트 파일 위치 기준으로 프로젝트 루트 찾기
BASE_DIR = Path(__file__).parent.parent  # scripts/ 폴더의 부모

# 상대 경로로 파일 참조
file_path = BASE_DIR / 'data' / 'file.csv'
output_dir = BASE_DIR / 'data'
```

### 적용 체크리스트

```
□ pathlib 임포트 추가: from pathlib import Path
□ BASE_DIR 변수 정의 (파일 상단, import 직후)
□ 모든 하드코딩 경로를 BASE_DIR 기준으로 변경
□ 문자열 경로 → Path 객체로 변환
```

### 디렉토리 구조별 BASE_DIR 설정

```python
# scripts/analysis.py에서 프로젝트 루트 참조
BASE_DIR = Path(__file__).parent.parent

# src/utils/helper.py에서 프로젝트 루트 참조
BASE_DIR = Path(__file__).parent.parent.parent

# 프로젝트 루트의 main.py에서
BASE_DIR = Path(__file__).parent
```

### 검증 방법

```bash
# 하드코딩 경로 검색 (프로젝트 내 잔여 확인)
grep -r "c:\\Users" scripts/
grep -r "/Users/" scripts/
grep -r "/home/" scripts/
```

---

## 2. DataFrame 컬럼 접근 시 KeyError 방지

### 문제 상황

```python
# 컬럼이 없으면 KeyError 발생
print(f"전환값: {df['전환값'].sum()}")
```

**에러 메시지:**
```
KeyError: '전환값'
```

**발생 원인:**
- 데이터 특성상 해당 컬럼이 생성되지 않음
- 조건부 로직에서 컬럼 생성이 스킵됨
- 데이터 소스에 해당 필드가 없음

### 해결 패턴

```python
# 패턴 1: 단순 존재 여부 체크
if '전환값' in df.columns:
    print(f"전환값: {df['전환값'].sum()}")

# 패턴 2: get() 메서드 (기본값 지정)
value = df.get('전환값', pd.Series([0])).sum()

# 패턴 3: 조건부 표현식
value = df['전환값'].sum() if '전환값' in df.columns else 0
```

### 실제 적용 예시

**Before (에러 발생):**
```python
if result is not None:
    results.append(result)
    print(f"전환값: {result['예측_전환값'].sum():,.0f}원")
    if '예측_ROAS' in result.columns:
        print(f"ROAS: {result['예측_ROAS'].mean():.1f}%")
```

**After (안전한 코드):**
```python
if result is not None:
    results.append(result)
    if '예측_전환값' in result.columns:
        print(f"전환값: {result['예측_전환값'].sum():,.0f}원")
    if '예측_ROAS' in result.columns:
        print(f"ROAS: {result['예측_ROAS'].mean():.1f}%")
```

### 적용 체크리스트

```
□ DataFrame 컬럼 직접 접근 코드 검색: df['컬럼명']
□ 동적으로 생성되는 컬럼인지 확인
□ 컬럼 존재 여부 체크 코드 추가
□ 테스트: 해당 컬럼 없는 데이터로 실행 확인
```

---

## 3. 데이터 필터링으로 인한 빈 결과 처리

### 문제 상황

```python
# 필터링 후 데이터가 없으면 후속 처리에서 에러
filtered_df = df[df['value'] > 0]
model.fit(filtered_df)  # 빈 DataFrame이면 에러
```

### 해결 패턴

```python
filtered_df = df[df['value'] > 0]

# 최소 데이터 수 체크
if len(filtered_df) < MIN_ROWS:
    print(f"데이터 부족: {len(filtered_df)}행 (최소 {MIN_ROWS}행 필요)")
    continue  # 또는 return None

model.fit(filtered_df)
```

### 실제 적용 예시 (Prophet 예측)

```python
MIN_ROWS = 10  # Prophet 최소 학습 데이터

for metric in metrics:
    prophet_df = data[['date', metric]].copy()
    prophet_df = prophet_df[prophet_df[metric] > 0]  # 양수만 필터링

    if len(prophet_df) < MIN_ROWS:
        print(f"[{metric}] 유효 데이터 부족 ({len(prophet_df)}행)")
        continue  # 해당 지표 예측 스킵

    model = Prophet()
    model.fit(prophet_df)
```

---

## 4. 빠른 트러블슈팅 가이드

### 에러 유형별 체크포인트

| 에러 | 첫 번째 확인 | 해결 패턴 |
|------|-------------|----------|
| `FileNotFoundError` | 경로 하드코딩 여부 | 동적 경로 변환 |
| `KeyError` (DataFrame) | 컬럼 존재 여부 | `if col in df.columns` |
| `KeyError` (dict) | 키 존재 여부 | `dict.get(key, default)` |
| `ValueError: empty` | 필터링 후 빈 데이터 | 최소 행 수 체크 |
| `TypeError: NoneType` | 함수 반환값 None | `if result is not None` |

### 방어적 코딩 템플릿

```python
def safe_process(df, column_name):
    """안전한 데이터 처리 템플릿"""

    # 1. None 체크
    if df is None:
        return None

    # 2. 빈 DataFrame 체크
    if len(df) == 0:
        return None

    # 3. 컬럼 존재 여부 체크
    if column_name not in df.columns:
        return None

    # 4. 실제 처리
    result = df[column_name].sum()

    return result
```

---

## 5. Batch 파일 동적 경로 패턴

### 문제 상황

```batch
REM 상대 경로 - 실행 위치(CWD)에 따라 달라짐
if exist config.json (
    ...
)
```

### 해결 패턴

```batch
@echo off
setlocal enabledelayedexpansion

REM 스크립트 위치 기준 동적 경로 설정
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM 스크립트 위치 기준 config 파일 참조
if exist "%SCRIPT_DIR%config.json" (
    for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-Content '%SCRIPT_DIR%config.json' | ConvertFrom-Json).google.credentials_path"`) do set GOOGLE_JSON=%%i
)
```

### `%~dp0` 설명

| 변수 | 의미 | 예시 |
|------|------|------|
| `%~dp0` | 배치 파일의 드라이브+경로 | `C:\project\` |
| `%~d0` | 드라이브만 | `C:` |
| `%~p0` | 경로만 | `\project\` |
| `%~n0` | 파일명만 | `setup` |

---

## 6. 변경 이력

| 날짜 | 항목 | 파일 | 내용 |
|------|------|------|------|
| 2025-11-27 | 경로 동적화 | `generate_type_insights.py` | BASE_DIR 추가, data_dir 동적화 |
| 2025-11-27 | 경로 동적화 | `multi_analysis_dimension_detail.py` | BASE_DIR, DATA_TYPE_DIR 추가 (2개 경로) |
| 2025-11-27 | 경로 동적화 | `run_multi_analysis.py` | BASE_DIR, DATA_TYPE_DIR 추가 (2개 경로) |
| 2025-11-27 | 경로 동적화 | `multi_analysis_prophet_forecast.py` | BASE_DIR, DATA_TYPE_DIR 추가 (19개 경로 동적화) |
| 2025-11-27 | KeyError 방지 | `multi_analysis_prophet_forecast.py:286` | `'예측_전환값'` 컬럼 체크 추가 (cat_result) |
| 2025-11-27 | KeyError 방지 | `multi_analysis_prophet_forecast.py:684` | `'예측_전환값'` 컬럼 체크 추가 (brand_result) |
| 2025-11-27 | KeyError 방지 | `multi_analysis_prophet_forecast.py:739` | `'예측_전환값'` 컬럼 체크 추가 (product_result) |
| 2025-11-27 | KeyError 방지 | `multi_analysis_prophet_forecast.py:802,869,936,1003,1062,1141` | 이미 적용됨 확인 (gender, age, platform, device, promotion, age_gender) |
| 2025-11-27 | 경로 동적화 | `fetch_sheets_multi.py` | BASE_DIR 추가, config_multi.json 동적화 |
| 2025-11-27 | 경로 동적화 | `run_data_pipeline.bat` | SCRIPT_DIR 추가, config.json 동적화 |
| 2025-11-27 | 경로 동적화 | `setup_multi.bat` | SCRIPT_DIR 추가, config_multi.json 동적화 |
| 2025-11-27 | 경로 동적화 | `setup_analysis_fixed.bat` | SCRIPT_DIR 추가, config.json 동적화 |

---

## 7. 부록: 유용한 검증 스크립트

```python
# validate_project.py
from pathlib import Path
import re

def check_hardcoded_paths(directory):
    """하드코딩된 경로 검출"""
    patterns = [
        r'[A-Z]:\\Users\\',  # Windows
        r'/Users/',          # macOS
        r'/home/',           # Linux
    ]

    issues = []
    for py_file in Path(directory).rglob('*.py'):
        content = py_file.read_text(encoding='utf-8')
        for pattern in patterns:
            if re.search(pattern, content):
                issues.append(str(py_file))
                break

    return issues

def check_unsafe_column_access(directory):
    """안전하지 않은 DataFrame 컬럼 접근 검출"""
    # df['col'] 패턴 중 if문 없이 사용된 경우 (간이 검출)
    pattern = r"(?<!if\s)(?<!in\s)\w+\['[^']+'\]\.sum\(\)"

    issues = []
    for py_file in Path(directory).rglob('*.py'):
        content = py_file.read_text(encoding='utf-8')
        matches = re.findall(pattern, content)
        if matches:
            issues.append((str(py_file), matches))

    return issues

if __name__ == '__main__':
    print("=== 하드코딩 경로 검출 ===")
    for issue in check_hardcoded_paths('scripts'):
        print(f"  - {issue}")

    print("\n=== 안전하지 않은 컬럼 접근 ===")
    for file, matches in check_unsafe_column_access('scripts'):
        print(f"  - {file}: {matches}")
```
