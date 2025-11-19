# 🔧 Google Sheets 특정 시트 사용 가이드

## 📝 변경 사항

### 수정된 파일: `fetch_google_sheets.py`

**주요 변경점:**
1. ✅ 특정 워크시트 이름으로 데이터 추출: **'데이터_통합분류'**
2. ✅ 워크시트 이름을 환경변수로 설정 가능
3. ✅ 워크시트가 없을 경우 사용 가능한 목록 출력
4. ✅ 에러 처리 강화

---

## 🚀 사용 방법

### 1. 로컬 테스트

```bash
# 환경변수 설정
export GOOGLE_CREDENTIALS='<Service Account JSON 전체>'
export SHEET_ID='<Google Sheets ID>'

# (선택) 다른 워크시트를 사용하려면
export WORKSHEET_NAME='데이터_통합분류'

# 스크립트 실행
python scripts/fetch_google_sheets.py

# 결과 확인
cat raw_data.csv
```

### 2. GitHub Actions에서 사용

`.github/workflows/sync-data.yml`은 수정 불필요! 

기존 Secrets만 사용:
- ✅ `GOOGLE_CREDENTIALS`
- ✅ `SHEET_ID`

**새로운 Secret 추가 (선택사항):**

만약 다른 워크시트를 사용하려면 GitHub Secrets에 추가:

```
WORKSHEET_NAME = 데이터_통합분류
```

그리고 워크플로우 수정:

```yaml
- name: 📊 Fetch data from Google Sheets
  env:
    GOOGLE_CREDENTIALS: ${{ secrets.GOOGLE_CREDENTIALS }}
    SHEET_ID: ${{ secrets.SHEET_ID }}
    WORKSHEET_NAME: ${{ secrets.WORKSHEET_NAME }}  # 추가
  run: python scripts/fetch_google_sheets.py
```

---

## 🔍 주요 기능

### 1. 특정 워크시트 지정

```python
# 기본값: '데이터_통합분류'
worksheet = sheet.worksheet('데이터_통합분류')
```

### 2. 워크시트가 없을 때

스크립트 실행 시 해당 워크시트가 없으면:

```
❌ 오류: '데이터_통합분류' 워크시트를 찾을 수 없습니다.

사용 가능한 워크시트 목록:
   1. Sheet1
   2. 데이터_원본
   3. 데이터_통합분류
   4. 분석_결과
```

### 3. 데이터 미리보기

```
📋 데이터 정보:
   ├ 행 수: 1,234
   └ 컬럼 수: 15

📌 헤더 (첫 번째 행):
   월 구분, 주 구분, 브랜드명, 상품명, 추가 구분...
```

---

## 📊 Google Sheets 구조 확인

### 현재 설정

```
Google Sheets: [마케팅 데이터 통합]
├── 📄 데이터_통합분류  ← ✅ 이 시트 사용
├── 📄 Sheet1
└── 📄 기타 시트들
```

### 데이터 구조 확인 사항

**'데이터_통합분류' 시트가 다음 구조를 가져야 합니다:**

| 월 구분 | 주 구분 | 브랜드명 | 상품명 | 추가 구분 | 유형구분 | 일 구분 | 목표 | 캠페인 | 세트이름 | 비용 | 노출 | 클릭 | 전환수 | 전환값 |
|---------|---------|----------|--------|-----------|----------|---------|------|--------|----------|------|------|------|--------|--------|
| 2025-01 | 2025-W01| 기존제품 | 제품A  | ...       | ...      | 2025-01-01 | ... | ... | ... | 100000 | 1000 | 50 | 5 | 500000 |

**총 15개 컬럼이 필수입니다.**

---

## ⚠️ 주의사항

### 1. 워크시트 이름 정확히 입력

```python
# ✅ 올바름
worksheet_name = '데이터_통합분류'

# ❌ 틀림 (공백, 오타)
worksheet_name = '데이터_통합분류 '  # 뒤에 공백
worksheet_name = '데이터통합분류'    # 언더스코어 누락
```

### 2. Service Account 권한 확인

Google Sheets에서:
1. 상단 "공유" 클릭
2. Service Account 이메일 확인
3. 권한: **편집자** 이상

### 3. 여러 워크시트 사용하려면?

**방법 1: 환경변수로 전환**

```bash
# 오늘은 이 시트
export WORKSHEET_NAME='데이터_통합분류'

# 내일은 다른 시트
export WORKSHEET_NAME='데이터_원본'
```

**방법 2: 모든 워크시트 병합**

```python
# fetch_google_sheets.py 수정
all_data = []
for ws_name in ['데이터_통합분류', '데이터_원본']:
    ws = sheet.worksheet(ws_name)
    data = ws.get_all_values()
    all_data.extend(data[1:])  # 헤더 제외
```

---

## 🐛 트러블슈팅

### 문제 1: 워크시트를 찾을 수 없음

```
❌ 오류: '데이터_통합분류' 워크시트를 찾을 수 없습니다.
```

**해결:**
1. Google Sheets에서 워크시트 이름 확인 (정확한 이름, 공백 주의)
2. 시트 이름을 복사해서 스크립트에 붙여넣기
3. 사용 가능한 워크시트 목록 확인

### 문제 2: 권한 오류

```
❌ Google Sheets API 오류: [403] The caller does not have permission
```

**해결:**
1. Google Sheets → 공유 → Service Account 이메일 추가
2. 권한: "편집자" 선택
3. 5분 후 다시 시도

### 문제 3: 빈 데이터

```
❌ 워크시트에 데이터가 없습니다.
```

**해결:**
1. '데이터_통합분류' 시트에 데이터가 있는지 확인
2. 첫 번째 행이 헤더인지 확인
3. 빈 행이 없는지 확인

---

## 📝 체크리스트

### 설정 전
- [ ] Google Sheets에 '데이터_통합분류' 워크시트 존재
- [ ] 15개 컬럼 구조 확인
- [ ] Service Account 권한 부여 (편집자)
- [ ] Google Sheets API 활성화

### 로컬 테스트
- [ ] `GOOGLE_CREDENTIALS` 환경변수 설정
- [ ] `SHEET_ID` 환경변수 설정
- [ ] `python scripts/fetch_google_sheets.py` 실행
- [ ] `raw_data.csv` 파일 생성 확인

### GitHub Actions
- [ ] `scripts/fetch_google_sheets.py` 파일 교체
- [ ] GitHub에 Push
- [ ] Actions 탭에서 워크플로우 수동 실행
- [ ] `data/raw/*.csv` 파일 생성 확인

---

## 💡 추가 팁

### 1. 다중 워크시트 통합

만약 여러 시트를 합쳐야 한다면:

```python
# 수정 예시
sheet_names = ['데이터_통합분류', '데이터_추가']
all_data = []

for name in sheet_names:
    ws = sheet.worksheet(name)
    data = ws.get_all_values()
    
    if all_data:
        all_data.extend(data[1:])  # 헤더 제외
    else:
        all_data.extend(data)      # 첫 시트는 헤더 포함
```

### 2. 특정 범위만 가져오기

```python
# A1:O1000 범위만
data = worksheet.get('A1:O1000')
```

### 3. 날짜 필터링

```python
# 최근 3개월 데이터만
from datetime import datetime, timedelta

three_months_ago = datetime.now() - timedelta(days=90)
# 필터링 로직 추가
```

---

## 🎯 완료!

이제 '데이터_통합분류' 시트의 데이터만 사용하여 마케팅 대시보드를 구축할 수 있습니다.

**다음 단계:**
1. ✅ 수정된 `fetch_google_sheets.py` 파일을 `scripts/` 디렉토리에 배치
2. ✅ 로컬 테스트 실행
3. ✅ GitHub에 Push
4. ✅ Actions 워크플로우 실행 확인

궁금한 점이 있으면 언제든 물어보세요! 🚀
