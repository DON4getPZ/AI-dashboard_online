# Prophet 설치 가이드

Prophet은 시계열 예측을 위한 강력한 라이브러리입니다. 설치 과정에서 문제가 발생할 수 있으므로, 운영체제별 상세 가이드를 제공합니다.

## Windows

### 방법 1: Microsoft C++ Build Tools 설치 (권장)

1. **Microsoft C++ Build Tools 다운로드**
   - https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - "Build Tools for Visual Studio 2022" 다운로드

2. **설치 시 선택 사항**
   - "C++ build tools" 체크
   - "MSVC v142" 또는 최신 버전 선택
   - "Windows 10 SDK" 선택

3. **Prophet 설치**
   ```cmd
   pip install prophet
   ```

### 방법 2: Anaconda 사용

```cmd
# Anaconda 설치 후
conda install -c conda-forge prophet

# 가상환경에서 사용
conda create -n marketing python=3.12
conda activate marketing
conda install -c conda-forge prophet
```

### 방법 3: 사전 빌드 패키지 (빠른 방법)

```cmd
pip install prophet --no-build-isolation
```

## Mac

### Homebrew 설치 (필수)

```bash
# Homebrew가 없다면
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# GCC 설치
brew install gcc

# Prophet 설치
pip3 install prophet
```

### Apple Silicon (M1/M2/M3)

```bash
# Xcode Command Line Tools 설치
xcode-select --install

# Prophet 설치
arch -arm64 pip3 install prophet
```

## Linux (Ubuntu/Debian)

```bash
# 의존성 설치
sudo apt-get update
sudo apt-get install build-essential
sudo apt-get install python3-dev

# Prophet 설치
pip3 install prophet
```

## 설치 확인

```python
# test_prophet.py
from prophet import Prophet
import pandas as pd

# 샘플 데이터
df = pd.DataFrame({
    'ds': pd.date_range('2024-01-01', periods=30),
    'y': range(30)
})

# 모델 학습
model = Prophet()
model.fit(df)

# 예측
future = model.make_future_dataframe(periods=7)
forecast = model.predict(future)

print("✅ Prophet 설치 성공!")
print(forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail())
```

실행:
```bash
python test_prophet.py
```

## 문제 해결

### Windows: "error: Microsoft Visual C++ 14.0 is required"

**해결:**
1. Microsoft C++ Build Tools 설치
2. 재부팅
3. 다시 pip install prophet

### Mac: "command 'gcc' failed"

**해결:**
```bash
brew install gcc
brew link gcc
```

### Linux: "fatal error: Python.h: No such file or directory"

**해결:**
```bash
sudo apt-get install python3-dev
```

### 모든 OS: 시간 초과 오류

**해결:**
```bash
# 타임아웃 시간 늘리기
pip install prophet --timeout 1000

# 또는 캐시 없이 설치
pip install prophet --no-cache-dir
```

## Prophet 없이 사용하기

Prophet 설치가 불가능하거나 원하지 않는 경우, setup.bat/setup.sh에서 Prophet 설치를 건너뛰면 자동으로 간단한 이동평균 예측을 사용합니다.

```bash
# setup 시 Prophet 설치 건너뛰기
Prophet을 설치하시겠습니까? (Y/N): N
```

이 경우에도 대시보드의 모든 기능은 정상 작동하며, 예측 기능만 간단한 방식으로 대체됩니다.

## 권장 사항

- **개발/테스트**: 간단한 이동평균 사용
- **프로덕션**: Prophet 설치 권장
- **대규모 데이터**: Anaconda 환경 권장

## 추가 리소스

- Prophet 공식 문서: https://facebook.github.io/prophet/
- Prophet GitHub: https://github.com/facebook/prophet
