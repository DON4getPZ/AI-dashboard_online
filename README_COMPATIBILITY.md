# Marketing Dashboard v3.0 - Python 3.13 호환성 가이드

## 📋 개요

이 프로젝트는 **Python 3.13+**에서 작동하도록 최적화되었으며, **C++ 컴파일러 없이** 설치할 수 있습니다.

## 🔧 주요 변경사항

### 1. 패키지 버전 업데이트

기존 `requirements.txt`에서 Python 3.13 호환 버전으로 업데이트:

| 패키지 | 기존 버전 | 수정 버전 | 이유 |
|--------|-----------|-----------|------|
| pandas | 2.1.4 | ≥2.2.0 | Python 3.13 지원 |
| numpy | 1.26.2 | ≥2.0.0 | Python 3.13 지원 |
| scipy | 1.11.4 | ≥1.14.0 | Python 3.13 지원 |
| statsmodels | 0.14.1 | ≥0.14.4 | Python 3.13 지원 |
| matplotlib | 3.8.2 | ≥3.9.0 | Python 3.13 지원 |

### 2. 바이너리 휠 사용

모든 패키지는 PyPI에서 **사전 빌드된 바이너리 휠(wheel)**을 제공하므로:
- ✅ C++ 컴파일러 불필요
- ✅ Visual Studio 불필요
- ✅ 빠른 설치 속도

## 🚀 설치 방법

### Option 1: 자동 설치 (권장)

```bash
setup_fixed.bat
```

이 스크립트는 다음을 자동으로 수행합니다:
1. Python 3.13+ 확인
2. `requirements_fixed.txt` 사용하여 패키지 설치
3. 설치된 패키지 검증
4. 환경 설정

### Option 2: 수동 설치

```bash
# 1. pip 업그레이드
python -m pip install --upgrade pip

# 2. 패키지 설치
pip install -r requirements_fixed.txt

# 3. 검증
python -c "import pandas; print('pandas:', pandas.__version__)"
python -c "import numpy; print('numpy:', numpy.__version__)"
python -c "import scipy; print('scipy:', scipy.__version__)"
```

## 🧪 호환성 테스트

### 1. Python 버전 확인

```bash
python --version
```

**권장**: Python 3.13.0 이상

### 2. 패키지 설치 테스트

```bash
# 패키지별 개별 설치 테스트
pip install pandas>=2.2.0
pip install numpy>=2.0.0
pip install scipy>=1.14.0
pip install statsmodels>=0.14.4
pip install gspread>=5.12.0
pip install oauth2client>=4.1.3
```

### 3. 기능 테스트

#### 테스트 1: 데이터 처리 기능

```bash
python -c "
import pandas as pd
import numpy as np
from scipy import stats

# 샘플 데이터 생성
df = pd.DataFrame({
    '일 구분': pd.date_range('2024-01-01', periods=10),
    '비용': np.random.randint(10000, 50000, 10),
    '노출': np.random.randint(1000, 5000, 10),
    '클릭': np.random.randint(100, 500, 10)
})

# 지표 계산
df['ctr'] = (df['클릭'] / df['노출'] * 100).round(2)
print('✅ 데이터 처리 성공')
print(df.head())
"
```

#### 테스트 2: Google Sheets 연동 테스트

```bash
python -c "
import gspread
from oauth2client.service_account import ServiceAccountCredentials
print('✅ Google Sheets 라이브러리 로드 성공')
"
```

#### 테스트 3: 전체 데이터 처리 파이프라인 (데이터 파일 필요)

```bash
# raw_data.csv가 있는 경우
set INPUT_CSV_PATH=raw_data.csv
python scripts/process_marketing_data.py
```

## ⚠️ 문제 해결

### 문제 1: pandas 설치 실패

**증상**:
```
ERROR: Failed to build 'pandas' when installing build dependencies
```

**해결**:
```bash
# pip 업그레이드
python -m pip install --upgrade pip

# 특정 버전 설치
pip install pandas==2.2.0

# 바이너리 휠 강제 사용
pip install pandas --only-binary :all:
```

### 문제 2: numpy 설치 실패

**증상**:
```
ERROR: Unknown compiler(s): [['icl'], ['cl'], ['cc'], ['gcc']...]
```

**해결**:
```bash
# numpy 2.x 설치 (바이너리 휠 포함)
pip install numpy>=2.0.0 --only-binary :all:
```

### 문제 3: 전체 패키지 설치 실패

**해결**:
```bash
# 1. pip, setuptools, wheel 업그레이드
python -m pip install --upgrade pip setuptools wheel

# 2. 캐시 삭제 후 재설치
pip cache purge
pip install -r requirements_fixed.txt

# 3. 개별 설치
pip install pandas>=2.2.0
pip install numpy>=2.0.0
pip install scipy>=1.14.0
pip install statsmodels>=0.14.4
pip install gspread>=5.12.0
pip install oauth2client>=4.1.3
pip install matplotlib>=3.9.0
pip install seaborn>=0.13.0
pip install python-dateutil>=2.8.2
pip install pytz>=2024.1
```

### 문제 4: Python 버전이 3.13 미만

**해결**:
- Python 3.13.x 다운로드: https://www.python.org/downloads/
- 또는 기존 `requirements.txt` 사용 (Python 3.12 권장)

## 📊 시계열 분석 기능

### 현재 지원 기능

1. **기본 통계 분석** (scipy 사용)
   - 평균, 표준편차, 왜도, 첨도
   - Z-Score 기반 이상치 탐지
   - 분위수 계산

2. **시계열 예측** (간단한 이동평균)
   - 최근 30일 평균 기반 예측
   - `scripts/process_marketing_data.py:289` 참조

3. **통계 모델링** (statsmodels 사용)
   - 시계열 분해
   - 추세 분석

### Prophet 사용 (선택사항)

Prophet는 C++ 컴파일러가 필요하므로 기본 설치에서 제외되었습니다.

사용하려면:
```bash
# Windows: Visual Studio Build Tools 필요
# https://visualstudio.microsoft.com/downloads/

pip install prophet
```

대안으로 현재 구현된 **간단한 이동평균 예측**을 사용하세요.

## 🎯 설치 검증 체크리스트

- [ ] Python 3.13+ 설치됨
- [ ] `requirements_fixed.txt` 패키지 모두 설치됨
- [ ] pandas 2.2.0+ 설치 확인
- [ ] numpy 2.0.0+ 설치 확인
- [ ] scipy 1.14.0+ 설치 확인
- [ ] gspread 설치 확인
- [ ] 테스트 스크립트 실행 성공
- [ ] 데이터 처리 파이프라인 작동 확인

## 📝 추가 정보

### 지원 환경

- **OS**: Windows 10/11, macOS, Linux
- **Python**: 3.13.0 이상
- **Node.js**: 18+ (React 대시보드용)
- **Git**: 2.x

### 기술 스택

- **데이터 처리**: pandas 2.2+, numpy 2.0+
- **통계 분석**: scipy 1.14+, statsmodels 0.14.4+
- **시각화**: matplotlib 3.9+, seaborn 0.13+
- **Google Sheets**: gspread 5.12+, oauth2client 4.1.3+

### 참고 문서

- [Python 3.13 릴리즈 노트](https://docs.python.org/3.13/whatsnew/3.13.html)
- [pandas 2.2 마이그레이션 가이드](https://pandas.pydata.org/docs/whatsnew/v2.2.0.html)
- [numpy 2.0 마이그레이션 가이드](https://numpy.org/devdocs/numpy_2_0_migration_guide.html)

## 🆘 도움 받기

문제가 발생하면:

1. 에러 메시지를 `docs/error.md`에 저장
2. GitHub Issues에 보고
3. 다음 정보 포함:
   - Python 버전 (`python --version`)
   - OS 정보
   - 전체 에러 로그

---

**마지막 업데이트**: 2025-11-18
**버전**: 3.0 (Python 3.13 Compatible)
