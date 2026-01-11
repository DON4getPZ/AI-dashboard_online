# Marketing Dashboard 사용자 가이드

**작성일**: 2026-01-11
**버전**: 1.0

---

## 목차

1. [개요](#개요)
2. [사전 요구사항](#사전-요구사항)
3. [파일 구조](#파일-구조)
4. [사용자 플로우](#사용자-플로우)
5. [스크립트 상세](#스크립트-상세)
6. [제약사항 및 주의사항](#제약사항-및-주의사항)
7. [문제 해결](#문제-해결)

---

## 개요

Marketing Dashboard는 Google Sheets 데이터를 가져와 분석하고, Next.js 대시보드로 시각화하는 ETL 파이프라인입니다.

### 핵심 기능

| 기능 | 설명 |
|------|------|
| 멀티클라이언트 | 여러 클라이언트 데이터를 분리 관리 |
| 자동화 | Windows 스케줄러로 매일 자동 실행 |
| Git 연동 | 데이터 변경 시 자동 커밋/푸시 |

### 전체 플로우

```
[설정] → [테스트] → [자동화] → [배포]

test_1_fetch.bat     → 클라이언트 설정 + Fetch 테스트
test_2_mapping.bat   → 데이터 가공 테스트
test_3_analysis.bat  → 분석/시각화 테스트
        ↓
run_all_clients.bat  → ETL 일괄 실행
        ↓
deploy.bat           → Git Commit + Push
deploy_all.bat       → 전체 클라이언트 배포
        ↓
scheduler_register.bat → 자동화 등록
```

---

## 사전 요구사항

### 필수 설치

| 소프트웨어 | 버전 | 용도 |
|-----------|------|------|
| Python | 3.8+ | ETL 스크립트 실행 |
| Git | 2.0+ | 버전 관리 및 배포 |
| Node.js | 18+ | Next.js 대시보드 (선택) |

### Python 패키지

```bash
pip install pandas numpy prophet gspread oauth2client
```

### Google API 설정

1. Google Cloud Console에서 프로젝트 생성
2. Google Sheets API 활성화
3. Service Account 생성 및 JSON 키 다운로드
4. Google Sheets에 Service Account 이메일 공유 권한 부여

---

## 파일 구조

```
marketing-dashboard/
├── config/
│   └── clients.json           # 클라이언트 설정 (자동 생성)
├── data/
│   └── {client_id}/           # 클라이언트별 데이터
│       ├── raw/               # 원본 CSV
│       ├── type/              # 가공 데이터
│       ├── forecast/          # 예측 데이터
│       ├── funnel/            # 퍼널 데이터
│       └── json/              # JSON 내보내기
├── scripts/
│   ├── run_all_clients.py     # ETL 핵심 로직
│   ├── add_client.py          # 클라이언트 추가 헬퍼
│   └── ...                    # 개별 스크립트 (19개)
├── test_1_fetch.bat           # [1단계] Fetch 테스트
├── test_2_mapping.bat         # [2단계] Mapping 테스트
├── test_3_analysis.bat        # [3단계] Analysis 테스트
├── run_all_clients.bat        # ETL 일괄 실행
├── deploy.bat                 # 단일 클라이언트 배포
├── deploy_all.bat             # 전체 클라이언트 배포
└── scheduler_register.bat     # 스케줄러 등록
```

---

## 사용자 플로우

### Phase 1: 초기 설정 (최초 1회)

#### Step 1: 첫 번째 클라이언트 설정

```
test_1_fetch.bat 실행
    ↓
[3] 전체 설정 초기화 선택
    ↓
Google Credentials 경로 입력
    ↓
클라이언트 정보 입력:
  - 클라이언트 ID (예: clientA)
  - 클라이언트 이름
  - Google Sheets ID/Worksheet 설정
    ↓
clients.json 생성됨
```

**결과물**: `config/clients.json`

#### Step 2: Fetch 테스트

```
test_1_fetch.bat 실행
    ↓
[1] 기존 설정 사용
    ↓
클라이언트 ID 입력
    ↓
[A] 전체 실행
    ↓
5개 스크립트 순차 실행
```

**결과물**: `data/{client_id}/raw/*.csv`

#### Step 3: Mapping 테스트

```
test_2_mapping.bat 실행
    ↓
[1] Mapping 테스트 진행
    ↓
클라이언트 ID 입력
    ↓
[A] 전체 실행
```

**결과물**: `data/{client_id}/type/merged_data.csv`

#### Step 4: Analysis 테스트

```
test_3_analysis.bat 실행
    ↓
[1] Analysis 테스트 진행
    ↓
클라이언트 ID 입력
    ↓
[A] 전체 실행
    ↓
13개 스크립트 순차 실행
```

**결과물**:
- `data/{client_id}/type/insights.json`
- `data/{client_id}/forecast/insights.json`
- `data/{client_id}/funnel/insights.json`
- `data/{client_id}/json/*.json`

---

### Phase 2: 추가 클라이언트 등록

```
test_1_fetch.bat 실행
    ↓
[2] 신규 클라이언트 추가 선택
    ↓
새 클라이언트 정보 입력
    ↓
clients.json에 추가됨
    ↓
자동으로 Fetch 테스트 진행
    ↓
test_2, test_3으로 개별 테스트
```

**주의**: 기존 클라이언트 설정은 유지됨

---

### Phase 3: 일괄 실행

#### ETL만 실행 (Git 없이)

```bash
run_all_clients.bat
```

또는

```bash
python scripts/run_all_clients.py
python scripts/run_all_clients.py --client clientA    # 특정 클라이언트
python scripts/run_all_clients.py --stage fetch       # 특정 단계만
python scripts/run_all_clients.py --dry-run           # 테스트 실행
```

**결과물**: 모든 클라이언트의 데이터 갱신

---

### Phase 4: 배포 (Git Push)

#### 단일 클라이언트 배포

```bash
deploy.bat                      # 대화형
deploy.bat --client clientA     # 특정 클라이언트
deploy.bat --skip-etl           # ETL 건너뛰기
```

**플로우**:
```
Git 환경 체크
    ↓ (미설정 시 설정 진행)
클라이언트 선택
    ↓
ETL 실행 (19개 스크립트)
    ↓
Git 상태 확인
    ↓
Git Commit (확인)
    ↓
Git Push (확인)
```

#### 전체 클라이언트 배포

```bash
deploy_all.bat                  # 대화형
deploy_all.bat --auto           # 자동 실행 (스케줄러용)
deploy_all.bat --skip-etl       # ETL 건너뛰기
```

---

### Phase 5: 자동화 설정

```bash
scheduler_register.bat          # 관리자 권한 필요
```

**플로우**:
```
관리자 권한 확인
    ↓
실행 시간 입력 (기본: 06:00)
    ↓
Windows 작업 스케줄러 등록
    ↓
매일 지정 시간에 deploy_all.bat --auto 실행
```

**관리 명령어**:
```bash
schtasks /query /tn "MarketingDashboard_DailyETL"   # 확인
schtasks /run /tn "MarketingDashboard_DailyETL"     # 수동 실행
schtasks /delete /tn "MarketingDashboard_DailyETL" /f  # 삭제
```

---

## 스크립트 상세

### ETL 스크립트 목록 (19개)

| 단계 | 스크립트 | 설명 |
|------|---------|------|
| **Fetch** | fetch_google_sheets.py | 광고 성과 원본 |
| | fetch_sheets_multi.py | 다중 시트 (채널별) |
| | fetch_creative_sheets.py | 크리에이티브 성과 |
| | fetch_creative_url.py | 이미지 URL |
| | fetch_ga4_sheets.py | GA4 퍼널 |
| **Mapping** | process_marketing_data.py | 데이터 가공 |
| **Analysis** | run_multi_analysis.py | 통합 분석 |
| | multi_analysis_dimension_detail.py | 차원별 분석 |
| | multi_analysis_prophet_forecast.py | Prophet 예측 |
| | generate_type_insights.py | 유형별 인사이트 |
| | segment_processor.py | 세그먼트 분석 |
| | insight_generator.py | 인사이트 생성 |
| | visualization_generator.py | 시각화 데이터 |
| | generate_funnel_data.py | 퍼널 데이터 |
| | generate_engagement_data.py | 참여도 데이터 |
| | generate_funnel_data_multiperiod.py | 멀티기간 퍼널 |
| | generate_insights_multiperiod.py | 멀티기간 인사이트 |
| | generate_type_insights_multiperiod.py | 멀티기간 유형별 |
| | export_json.py | JSON 내보내기 |

### CLI 옵션

| 스크립트 | 옵션 | 설명 |
|---------|------|------|
| run_all_clients.py | `--client ID` | 특정 클라이언트만 실행 |
| | `--stage fetch/mapping/analysis` | 특정 단계만 실행 |
| | `--dry-run` | 실행 없이 계획만 출력 |
| | `--legacy` | 레거시 모드 (data/ 경로) |
| add_client.py | `--list` | 클라이언트 목록 출력 |
| | `--id`, `--name` | 클라이언트 정보 |

---

## 제약사항 및 주의사항

### 1. Google Sheets 제약

| 항목 | 제약 |
|------|------|
| API 할당량 | 분당 100건 요청 제한 |
| 셀 수 | 시트당 최대 1000만 셀 |
| 공유 권한 | Service Account에 뷰어 이상 권한 필요 |

### 2. 파일/경로 제약

| 항목 | 제약 |
|------|------|
| 클라이언트 ID | 영문, 숫자, 언더스코어만 (공백 불가) |
| 경로 | 한글 경로 가능하나 영문 권장 |
| CSV 인코딩 | UTF-8 필수 |

### 3. Git 제약

| 항목 | 제약 |
|------|------|
| 파일 크기 | GitHub 100MB 제한 |
| 인증 | HTTPS: PAT 필요, SSH: 키 설정 필요 |
| --auto 모드 | Git 환경 사전 설정 필수 |

### 4. 스케줄러 제약

| 항목 | 제약 |
|------|------|
| 권한 | 관리자 권한 필요 |
| 실행 조건 | PC가 켜져 있어야 함 |
| 네트워크 | 인터넷 연결 필요 |

### 5. 데이터 의존성

```
fetch (raw/*.csv)
    ↓ 필수
mapping (type/merged_data.csv)
    ↓ 필수
analysis (insights.json, *.json)
```

**주의**: 이전 단계가 실패하면 다음 단계도 실패함

### 6. 동시 실행 제약

- 같은 클라이언트에 대해 동시 실행 금지
- 스케줄러와 수동 실행 겹치지 않도록 주의

---

## 문제 해결

### Q1: Google Sheets 인증 오류

```
gspread.exceptions.APIError: 403 PERMISSION_DENIED
```

**해결**:
1. Service Account 이메일이 시트에 공유되어 있는지 확인
2. credentials.json 경로가 올바른지 확인
3. Google Sheets API가 활성화되어 있는지 확인

### Q2: Git Push 실패

```
fatal: Authentication failed
```

**해결**:
1. HTTPS 사용 시: Personal Access Token 재생성
2. SSH 사용 시: `ssh -T git@github.com`으로 연결 테스트
3. `git remote -v`로 URL 확인

### Q3: Prophet 설치 오류

```
ERROR: Could not build wheels for prophet
```

**해결**:
```bash
pip install pystan==2.19.1.1
pip install prophet
```

또는 conda 사용:
```bash
conda install -c conda-forge prophet
```

### Q4: 스케줄러 등록 실패

```
오류: 액세스가 거부되었습니다.
```

**해결**:
- scheduler_register.bat을 우클릭 → "관리자 권한으로 실행"

### Q5: 데이터가 갱신되지 않음

**체크리스트**:
1. Google Sheets 데이터가 실제로 변경되었는지 확인
2. `run_all_clients.py --dry-run`으로 실행 계획 확인
3. `data/{client_id}/raw/` 폴더의 CSV 타임스탬프 확인

---

## 부록: 빠른 시작 가이드

### 최초 설정 (5분)

```bash
# 1. 첫 클라이언트 설정
test_1_fetch.bat
# → [3] 전체 설정 초기화
# → Google Credentials, Sheet ID 입력

# 2. 테스트 실행
test_1_fetch.bat    # Fetch 테스트
test_2_mapping.bat  # Mapping 테스트
test_3_analysis.bat # Analysis 테스트

# 3. 결과 확인
dir data\{client_id}\json\
```

### 일일 운영

```bash
# 수동 실행
deploy_all.bat

# 또는 자동화
scheduler_register.bat  # 최초 1회
```

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-11 | 1.0 | 초기 작성 |
