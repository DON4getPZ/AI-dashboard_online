# 설치 문제 해결 가이드

## 문제점
Python 3.13 환경에서 pandas, numpy 설치 시 C++ 컴파일러가 없어서 설치 실패

## 해결 방법

### 방법 1: setup_fixed.bat 사용 (권장)
```batch
setup_fixed.bat
```

이 스크립트는:
- Python 3.13 호환 패키지 버전 사용
- pre-built wheel만 설치 (컴파일 불필요)
- 자동 fallback 메커니즘 포함

### 방법 2: 수동 설치
```batch
# pip 업그레이드
python -m pip install --upgrade pip setuptools wheel

# 호환 패키지 설치
python -m pip install --only-binary :all: -r requirements_fixed.txt
```

## 변경된 패키지 버전

| 패키지 | 이전 버전 | 새 버전 | 이유 |
|--------|-----------|---------|------|
| pandas | 2.1.4 | 2.2.0+ | Python 3.13 wheel 지원 |
| numpy | 1.26.2 | 1.26.0+ | Python 3.13 호환 |
| scipy | 1.11.4 | 1.12.0+ | Python 3.13 호환 |
| gspread | 5.12.0 | 6.0.0+ | 최신 안정 버전 |
| google-auth | - | 2.25.0+ | oauth2client 대체 |

## 시계열 분석 지원

### 기본 패키지 (필수)
- **pandas**: 시계열 데이터 처리
- **numpy**: 수치 계산
- **scipy**: 통계 분석
- **statsmodels**: 시계열 모델링 (ARIMA, etc.)

### 추가 예측 패키지 (선택)
1. **statsforecast** (Prophet 대안)
   - C++ 컴파일러 불필요
   - Prophet보다 빠름
   - 설치: `pip install statsforecast --only-binary :all:`

2. **scikit-learn** (머신러닝 기반)
   - 다양한 예측 모델 제공
   - 설치: `pip install scikit-learn --only-binary :all:`

3. **Prophet** (원본, C++ 필요)
   - Microsoft C++ Build Tools 필요
   - 설치: https://visualstudio.microsoft.com/visual-cpp-build-tools/

## 코드 수정 예시

### 기존 코드 (Prophet)
```python
from prophet import Prophet

model = Prophet()
model.fit(df)
forecast = model.predict(future)
```

### 대체 1: statsforecast
```python
from statsforecast import StatsForecast
from statsforecast.models import AutoARIMA

model = StatsForecast(
    models=[AutoARIMA(season_length=7)],
    freq='D'
)
forecast = model.forecast(h=30)
```

### 대체 2: scikit-learn
```python
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler

model = RandomForestRegressor()
model.fit(X_train, y_train)
forecast = model.predict(X_test)
```

## 검증 방법

### 패키지 설치 확인
```batch
python -c "import pandas; print('pandas:', pandas.__version__)"
python -c "import numpy; print('numpy:', numpy.__version__)"
python -c "import gspread; print('gspread:', gspread.__version__)"
```

### 시계열 분석 테스트
```python
import pandas as pd
import numpy as np
from scipy import stats
from statsmodels.tsa.arima.model import ARIMA

# 샘플 데이터 생성
dates = pd.date_range('2024-01-01', periods=100)
values = np.random.randn(100).cumsum()
df = pd.DataFrame({'date': dates, 'value': values})
df.set_index('date', inplace=True)

# ARIMA 모델
model = ARIMA(df['value'], order=(1,1,1))
result = model.fit()
forecast = result.forecast(steps=10)

print('시계열 분석 성공!')
print(forecast)
```

## 문제 해결

### 여전히 컴파일 에러가 발생하는 경우
1. Python 버전 확인
   ```batch
   python --version
   ```
   - Python 3.12 또는 3.13 권장

2. pip 업그레이드
   ```batch
   python -m pip install --upgrade pip setuptools wheel
   ```

3. 캐시 삭제 후 재설치
   ```batch
   python -m pip cache purge
   python -m pip install --only-binary :all: -r requirements_fixed.txt
   ```

4. 관리자 권한으로 실행
   - setup_fixed.bat 우클릭 → "관리자 권한으로 실행"

### 인터넷 연결 문제
- 회사 방화벽/프록시 환경인 경우:
  ```batch
  python -m pip install --proxy=http://proxy.company.com:port -r requirements_fixed.txt
  ```

## 지원

문제가 계속되면 다음 정보와 함께 문의하세요:
1. Python 버전: `python --version`
2. pip 버전: `pip --version`
3. 전체 에러 메시지
4. 운영체제 정보

---
**업데이트**: 2025-11-18
**호환성**: Python 3.12, 3.13
**C++ 컴파일러**: 불필요
