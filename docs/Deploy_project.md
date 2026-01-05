# Marketing Dashboard 배포 프로젝트 설계서

**버전**: 1.1.0
**작성일**: 2025-01-05
**프로젝트**: 멀티클라이언트 마케팅 대시보드

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [아키텍처 분류](#2-아키텍처-분류)
3. [풀퍼널 커버리지](#3-풀퍼널-커버리지)
4. [아키텍처 결정 과정](#4-아키텍처-결정-과정)
5. [최종 아키텍처](#5-최종-아키텍처)
6. [데이터 파이프라인](#6-데이터-파이프라인)
7. [보안 구조](#7-보안-구조)
8. [장단점 분석](#8-장단점-분석)
9. [예상 작업 일정](#9-예상-작업-일정)
10. [운영 가이드](#10-운영-가이드)

---

## 1. 프로젝트 개요

### 1.1 현재 상태

```
현재 시스템: Standalone HTML 기반
├── generate_standalone.py로 30MB HTML 생성
├── 모든 데이터가 HTML에 임베드
├── 서버 없이 브라우저에서 실행
└── 단일 클라이언트 대응
```

### 1.2 목표 상태

```
목표 시스템: 멀티클라이언트 웹 대시보드
├── 단일 Next.js 앱으로 N개 클라이언트 서비스
├── 클라이언트별 서브도메인 (clienta.dashboard.com)
├── Cloudflare Access로 접근 제어
├── 기존 Python 분석 파이프라인 유지 (Prophet 포함)
└── 연 비용 ~$12 (도메인만)
```

### 1.3 핵심 요구사항

| 요구사항 | 우선순위 | 설명 |
|---------|---------|------|
| Prophet 예측 유지 | 필수 | 기존 시계열 예측 기능 그대로 |
| 멀티클라이언트 | 필수 | 동일 UI, 다른 데이터 |
| 데이터 보안 | 필수 | 클라이언트 간 데이터 격리 |
| 비용 최소화 | 필수 | 서버 비용 없이 운영 |
| 접근 제어 | 필수 | 허가된 사용자만 접근 |

---

## 2. 아키텍처 분류

### 2.1 기술 스택 분류

본 프로젝트는 **"Serverless Full Stack"** 또는 **"JAMstack"** 아키텍처에 해당합니다.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         아키텍처 분류 비교                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  전통적 Full Stack              본 프로젝트 (JAMstack)                       │
│  ─────────────────              ──────────────────────                       │
│  ┌─────────────┐                ┌─────────────┐                             │
│  │  Frontend   │                │  React/Next │ ← Vercel CDN                │
│  │  (React)    │                │  (Frontend) │                             │
│  └──────┬──────┘                └──────┬──────┘                             │
│         │                              │                                     │
│         ↓                              ↓                                     │
│  ┌─────────────┐                ┌─────────────┐                             │
│  │  Backend    │                │  Static JSON│ ← Git 저장소                 │
│  │  (Node/Py)  │                │  (API 대체) │                             │
│  └──────┬──────┘                └──────┬──────┘                             │
│         │                              │                                     │
│         ↓                              ↓                                     │
│  ┌─────────────┐                ┌─────────────┐                             │
│  │  Database   │                │  로컬 Python│ ← ETL 파이프라인             │
│  │  (SQL/NoSQL)│                │  (Prophet)  │                             │
│  └─────────────┘                └─────────────┘                             │
│                                                                             │
│  서버 비용: $20~100+/월          서버 비용: $0 (Vercel 무료)                  │
│  DB 비용: $10~50+/월             DB 비용: $0 (Git 저장)                      │
│  보안 관리: 복잡                 보안 관리: 최소화 (정적 파일)                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 풀스택 판정

| 전통적 풀스택 요소 | 본 프로젝트 구현 | 판정 |
|-------------------|-----------------|------|
| Frontend | React + Next.js on Vercel | ✅ 동일 |
| Backend Server | 로컬 Python + Git | ✅ 대체됨 |
| Database | JSON/CSV in Git | ✅ 대체됨 |
| API Layer | Static JSON fetch | ✅ 대체됨 |
| CI/CD | GitHub Actions + Vercel | ✅ 자동화 |
| CDN | Vercel Edge Network | ✅ 포함 |

**결론**: **"비용 최적화된 Serverless Full Stack"**

### 2.3 아키텍처 특성

| 특성 | 설명 |
|------|------|
| **JAMstack** | JavaScript + APIs + Markup 구조 |
| **Serverless** | 상시 운영 서버 없음, 정적 파일 기반 |
| **Edge Computing** | Vercel CDN으로 전 세계 빠른 응답 |
| **Git-based CMS** | Git이 데이터 버전 관리 역할 |

### 2.4 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              데이터 흐름                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [1] .bat 트리거        [2] .bat 트리거       [3] GitHub Actions  [4] Vercel │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐    ┌─────────┐ │
│  │ Python ETL  │  ───→ │ Git Commit  │  ───→ │ Next.js     │ ─→ │ React   │ │
│  │ 데이터 수집 │       │ + Push      │       │ 빌드        │    │ 앱 서빙 │ │
│  │ 분석/변환   │       │             │       │             │    │         │ │
│  └─────────────┘       └─────────────┘       └─────────────┘    └─────────┘ │
│       ↓                      ↓                     ↓                 ↓      │
│  public/data/*.json    origin/main           Vercel Deploy      CDN 배포   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

단계별 상세:
1. .bat 트리거 → Python ETL: 데이터 다운로드(Google Sheets) + 분석(Prophet) + JSON 변환
2. .bat 트리거 → Git: public/data/ 변경사항 commit + push to main
3. GitHub Actions → Next.js: push 이벤트 감지 → Next.js 빌드 → Vercel 배포
4. Vercel → React: 정적 빌드된 React 앱 + JSON 데이터 CDN 서빙
```

---

## 3. 풀퍼널 커버리지

### 3.1 AARRR 프레임워크 기준

| 단계 | 커버리지 | 구현 내용 | 데이터 소스 |
|------|----------|-----------|-------------|
| **Acquisition** | ✅ 완전 | 채널별 유입 분석, 광고 성과, 트래픽 KPI | Meta/Google/Kakao Ads |
| **Activation** | ✅ 완전 | 활성화 지표, 전환 퍼널, BCG Matrix | GA4 Funnel |
| **Retention** | ⚠️ 부분 | 이탈 위험 경고, CRM 액션 가이드 | GA4 (Cohort 가이드만) |
| **Revenue** | ✅ 완전 | ROAS, CPA, 전환값, 예산 시뮬레이션 | Ads + GA4 |
| **Referral** | ❌ 미구현 | 추천/공유 지표 없음 | - |

### 3.2 현재 수준 평가

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         풀퍼널 커버리지 현황                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ACQUISITION ──→ ACTIVATION ──→ RETENTION ──→ REVENUE ──→ REFERRAL         │
│      ███           ███            ▓▓▓           ███          ░░░            │
│     100%          100%            60%          100%           0%            │
│                                                                             │
│  ███ = 완전 구현    ▓▓▓ = 부분 구현    ░░░ = 미구현                          │
│                                                                             │
│  현재 수준: "Acquisition-Revenue 중심 퍼널 (4/5단계)"                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 강점 (잘 구현된 영역)

| 영역 | 구현 내용 |
|------|----------|
| 광고 채널 분석 | Meta, Google, Kakao 통합 성과 분석 |
| 전환 퍼널 시각화 | D3.js 기반 인터랙티브 퍼널 |
| 시계열 예측 | Prophet 기반 90일 예측 + 예산 시뮬레이션 |
| 크리에이티브 분석 | 이미지별 KPI 성과 비교 |
| 세그먼트 분석 | 연령/성별/기기/플랫폼별 상세 분석 |

### 3.4 풀퍼널 완성을 위한 로드맵

| 우선순위 | 영역 | 현재 | 목표 | 필요 작업 |
|---------|------|------|------|-----------|
| 1 | Retention | GA4 이탈 분석 | 실제 Cohort 대시보드 | BigQuery 연동, 코호트 시각화 |
| 2 | Retention | - | LTV 분석 | 고객 생애 가치 계산 로직 |
| 3 | Referral | - | NPS 추적 | 설문 데이터 연동 |
| 4 | Referral | - | 바이럴 계수 | 추천 코드 성과 분석 |
| 5 | Organic | - | SEO 성과 | Search Console 연동 |

### 3.5 데이터 소스별 커버리지

| 데이터 소스 | 현재 연동 | 커버 영역 |
|------------|----------|-----------|
| Meta Ads | ✅ | Acquisition, Revenue |
| Google Ads | ✅ | Acquisition, Revenue |
| Kakao Moment | ✅ | Acquisition, Revenue |
| GA4 | ✅ | Activation, Retention (부분) |
| BigQuery | ⚠️ 가이드만 | Retention (Cohort) |
| CRM | ❌ | Retention, Referral |
| Search Console | ❌ | Acquisition (Organic) |

---

## 4. 아키텍처 결정 과정

### 4.1 검토된 옵션들

#### 옵션 A: Django 프레임워크
```
장점: 풀스택, 관리자 페이지, ORM
단점: 서버 필요, Vercel 부적합, Cold start 느림
결론: ❌ 기각 - Vercel Serverless 환경에 부적합
```

#### 옵션 B: 현재 Standalone + Vercel 정적 배포
```
장점: 변경 없음, 즉시 배포
단점: 30MB 파일, 멀티클라이언트 어려움, 데이터 갱신 시 전체 재생성
결론: ❌ 기각 - 확장성 부족
```

#### 옵션 C: Next.js 전환 (Full)
```
장점: Vercel 최적화, React 생태계
단점: Prophet을 JS로 포팅 불가, 6-10주 소요
결론: ❌ 기각 - Prophet 포팅 비현실적
```

#### 옵션 D: 로컬 Python + Vercel React (하이브리드)
```
장점: Python 유지, Prophet 그대로, React UI
단점: 로컬 PC 의존
결론: ⭕ 채택 - 최적의 균형점
```

### 4.2 하이브리드 구조 발전 과정

```
Step 1: 기본 개념
        로컬 분석 → JSON → Vercel 배포

Step 2: 보안 추가
        + Cloudflare Access (이메일 인증)

Step 3: 멀티클라이언트 확장
        + 서브도메인 라우팅
        + 클라이언트별 데이터 분리

Step 4: 기존 스크립트 통합
        + --client 파라미터 추가
        + 공통 경로 관리 모듈
```

### 4.3 주요 결정 사항

| 결정 | 선택 | 이유 |
|------|------|------|
| 프론트엔드 | Next.js + React | Vercel 최적화, SSG/SSR 지원 |
| 백엔드 분석 | Python (로컬) | Prophet 호환, 기존 코드 재사용 |
| 데이터 전달 | JSON 파일 | 단순, 캐싱 효율적 |
| 호스팅 | Vercel | 무료, CDN, 서브도메인 |
| 인증 | Cloudflare Access | 무료 (50명), 이메일 OTP |
| 라우팅 | 서브도메인 | 클라이언트 격리 명확 |

---

## 5. 최종 아키텍처

### 5.1 시스템 구성도

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              최종 아키텍처                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                  [1] 로컬 PC - .bat 트리거 (데이터 처리)              │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │                                                                       │ │
│  │  [config/clients.json] ─── 클라이언트 설정 (Sheet ID, 인증 정책)      │ │
│  │           │                                                           │ │
│  │           ↓                                                           │ │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐   │ │
│  │  │ 1단계: 수집     │    │ 2단계: 분석     │    │ 3단계: 변환     │   │ │
│  │  │ fetch_*.py      │ →  │ process_*.py    │ →  │ export_json.py  │   │ │
│  │  │ --client 파라미터│    │ Prophet 예측    │    │ CSV → JSON      │   │ │
│  │  └─────────────────┘    └─────────────────┘    └─────────────────┘   │ │
│  │           │                      │                      │             │ │
│  │           ↓                      ↓                      ↓             │ │
│  │  data/{clientId}/raw/   data/{clientId}/forecast/   public/data/     │ │
│  │                                                     └── {clientId}/   │ │
│  │                                                         ├── kpi.json │ │
│  │                                                         └── ...      │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                         │                                   │
│                                         │ [2] .bat 트리거: git commit + push│
│                                         ↓                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      GitHub Actions (CI/CD)                           │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │  [3] on: push to main                                                 │ │
│  │  ├── Next.js 빌드                                                     │ │
│  │  └── Vercel 배포 트리거                                               │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                         │                                   │
│                                         ↓                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      Cloudflare Access (보안)                          │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │  clienta.dashboard.com → @clienta.com 만 접근                         │ │
│  │  clientb.dashboard.com → @clientb.co.kr 만 접근                       │ │
│  │  이메일 OTP 인증                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                         │                                   │
│                                         ↓                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    [4] Vercel (React 앱 서빙)                         │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │                                                                       │ │
│  │  Next.js App (단일 코드베이스) - 정적 빌드 + CDN 배포                 │ │
│  │  ├── middleware.ts: 서브도메인 → clientId 추출                        │ │
│  │  ├── src/app/: React 컴포넌트 (차트, KPI, 테이블)                     │ │
│  │  └── public/data/{clientId}/: JSON 데이터                            │ │
│  │                                                                       │ │
│  │  서브도메인 라우팅:                                                    │ │
│  │  ├── clienta.dashboard.com → /data/clientA/*.json                    │ │
│  │  ├── clientb.dashboard.com → /data/clientB/*.json                    │ │
│  │  └── clientc.dashboard.com → /data/clientC/*.json                    │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 디렉토리 구조

```
marketing-dashboard/
│
├── config/                           # 설정 파일
│   ├── clients.json                  # 클라이언트 마스터 설정
│   ├── google-credentials.json       # Google API (git 제외)
│   └── cloudflare-access.md          # 접근 정책 문서
│
├── scripts/                          # Python 데이터 파이프라인
│   ├── common/                       # 공통 모듈 [신규]
│   │   ├── __init__.py
│   │   └── paths.py                  # 클라이언트별 경로 관리
│   │
│   ├── fetch_google_sheets.py        # [수정] --client 파라미터
│   ├── fetch_sheets_multi.py         # [수정] --client 파라미터
│   ├── fetch_creative_sheets.py      # [수정] --client 파라미터
│   ├── fetch_creative_url.py         # [수정] --client 파라미터
│   ├── fetch_ga4_sheets.py           # [수정] --client 파라미터
│   ├── process_marketing_data.py     # [수정] --client 파라미터
│   ├── segment_processor.py          # [수정] --client 파라미터
│   ├── insight_generator.py          # [수정] --client 파라미터
│   ├── visualization_generator.py    # [수정] --client 파라미터
│   ├── generate_funnel_data.py       # [수정] --client 파라미터
│   ├── generate_engagement_data.py   # [수정] --client 파라미터
│   ├── run_multi_analysis.py         # [수정] --client 파라미터
│   ├── multi_analysis_dimension_detail.py  # [수정]
│   ├── multi_analysis_prophet_forecast.py  # [수정]
│   ├── generate_type_insights.py     # [수정] --client 파라미터
│   │
│   ├── export_json.py                # [신규] CSV → JSON 변환
│   └── run_all_clients.py            # [신규] 전체 클라이언트 실행
│
├── src/                              # Next.js React 앱 [신규]
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # 메인 대시보드
│   │   ├── forecast/page.tsx         # 예측 탭
│   │   ├── funnel/page.tsx           # 퍼널 탭
│   │   └── creative/page.tsx         # 크리에이티브 탭
│   │   └── type/page.tsx             # 채널 탭
│   │
│   ├── components/
│   │   ├── Dashboard/
│   │   ├── Charts/
│   │   ├── KPICards/
│   │   └── Navigation/
│   │
│   ├── lib/
│   │   ├── client.ts                 # 클라이언트 컨텍스트
│   │   ├── data.ts                   # 데이터 fetch 유틸
│   │   └── utils.ts
│   │
│   └── middleware.ts                 # 서브도메인 라우팅
│
├── data/                             # 클라이언트별 원본 데이터
│   ├── clientA/
│   │   ├── raw/                     # 광고 성과 원본
│   │   ├── type/                    # 채널별 통합 데이터
│   │   ├── forecast/                # Prophet 예측 결과
│   │   ├── funnel/                  # 퍼널 분석 결과
│   │   ├── creative/                # 크리에이티브 데이터
│   │   ├── GA4/                     # GA4 원본 데이터
│   │   ├── statistics/              # 통계 데이터
│   │   └── visualizations/          # 차트 이미지
│   └── clientB/
│       └── ...
│
├── public/                           # Next.js 정적 파일
│   └── data/                         # 클라이언트별 JSON
│       ├── clientA/
│       │   ├── kpi.json
│       │   ├── forecast.json
│       │   ├── funnel.json
│       │   ├── creative.json
│       │   ├── segments.json
│       │   ├── dimensions.json
│       │   ├── insights.json
│       │   └── meta.json
│       └── clientB/
│           └── ...
│
├── deploy.bat                        # 단일 클라이언트 배포
├── deploy_all.bat                    # 전체 클라이언트 배포
├── vercel.json                       # Vercel 설정
├── package.json
├── next.config.js
└── README.md
```

---

## 6. 데이터 파이프라인

### 6.1 파이프라인 개요

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         데이터 파이프라인 흐름                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  config/clients.json                                                        │
│  └── clientA: { sheetId: "...", worksheets: {...} }                        │
│                    │                                                        │
│                    ↓                                                        │
│  ╔═══════════════════════════════════════════════════════════════════════╗ │
│  ║ 1단계: 데이터 수집 (Google Sheets → CSV)                              ║ │
│  ╠═══════════════════════════════════════════════════════════════════════╣ │
│  ║                                                                       ║ │
│  ║  fetch_google_sheets.py --client clientA                              ║ │
│  ║  └── data/clientA/raw/raw_data.csv                                    ║ │
│  ║                                                                       ║ │
│  ║  fetch_sheets_multi.py --client clientA                               ║ │
│  ║  └── data/clientA/type/merged_data.csv                                ║ │
│  ║                                                                       ║ │
│  ║  fetch_creative_sheets.py --client clientA                            ║ │
│  ║  └── data/clientA/creative/creative_data.csv                          ║ │
│  ║                                                                       ║ │
│  ║  fetch_creative_url.py --client clientA                               ║ │
│  ║  └── data/clientA/creative/creative_url.csv                           ║ │
│  ║                                                                       ║ │
│  ║  fetch_ga4_sheets.py --client clientA                                 ║ │
│  ║  └── data/clientA/GA4/*.csv                                           ║ │
│  ║                                                                       ║ │
│  ╚═══════════════════════════════════════════════════════════════════════╝ │
│                    │                                                        │
│                    ↓                                                        │
│  ╔═══════════════════════════════════════════════════════════════════════╗ │
│  ║ 2단계: 데이터 분석 (CSV → 분석 결과)                                  ║ │
│  ╠═══════════════════════════════════════════════════════════════════════╣ │
│  ║                                                                       ║ │
│  ║  process_marketing_data.py --client clientA                           ║ │
│  ║  ├── Prophet 시계열 예측 (90일)                                       ║ │
│  ║  └── data/clientA/forecast/predictions_*.csv                          ║ │
│  ║                                                                       ║ │
│  ║  segment_processor.py --client clientA                                ║ │
│  ║  └── data/clientA/forecast/segment_*.csv                              ║ │
│  ║                                                                       ║ │
│  ║  multi_analysis_prophet_forecast.py --client clientA                  ║ │
│  ║  └── data/clientA/type/prophet_*.csv                                  ║ │
│  ║                                                                       ║ │
│  ║  generate_funnel_data.py --client clientA                             ║ │
│  ║  └── data/clientA/funnel/*.csv                                        ║ │
│  ║                                                                       ║ │
│  ║  generate_type_insights.py --client clientA                           ║ │
│  ║  └── data/clientA/type/insights.json                                  ║ │
│  ║                                                                       ║ │
│  ╚═══════════════════════════════════════════════════════════════════════╝ │
│                    │                                                        │
│                    ↓                                                        │
│  ╔═══════════════════════════════════════════════════════════════════════╗ │
│  ║ 3단계: JSON 변환 (CSV → Next.js용 JSON)                               ║ │
│  ╠═══════════════════════════════════════════════════════════════════════╣ │
│  ║                                                                       ║ │
│  ║  export_json.py --client clientA                                      ║ │
│  ║  ├── 입력: data/clientA/**/*.csv, **/insights.json                    ║ │
│  ║  └── 출력: public/data/clientA/                                       ║ │
│  ║            ├── kpi.json                                               ║ │
│  ║            ├── forecast.json                                          ║ │
│  ║            ├── funnel.json                                            ║ │
│  ║            ├── creative.json                                          ║ │
│  ║            ├── segments.json                                          ║ │
│  ║            ├── dimensions.json                                        ║ │
│  ║            ├── insights.json                                          ║ │
│  ║            └── meta.json                                              ║ │
│  ║                                                                       ║ │
│  ╚═══════════════════════════════════════════════════════════════════════╝ │
│                    │                                                        │
│                    ↓                                                        │
│  ╔═══════════════════════════════════════════════════════════════════════╗ │
│  ║ 4단계: .bat 트리거 → Git Commit + Push                                ║ │
│  ╠═══════════════════════════════════════════════════════════════════════╣ │
│  ║                                                                       ║ │
│  ║  deploy.bat 실행:                                                     ║ │
│  ║  ├── git add public/data/                                             ║ │
│  ║  ├── git commit -m "Update data %date%"                               ║ │
│  ║  └── git push origin main                                             ║ │
│  ║                                                                       ║ │
│  ╚═══════════════════════════════════════════════════════════════════════╝ │
│                    │                                                        │
│                    ↓                                                        │
│  ╔═══════════════════════════════════════════════════════════════════════╗ │
│  ║ 5단계: GitHub Actions → Next.js 빌드                                  ║ │
│  ╠═══════════════════════════════════════════════════════════════════════╣ │
│  ║                                                                       ║ │
│  ║  on: push to main                                                     ║ │
│  ║  ├── Next.js 정적 빌드 (npm run build)                                ║ │
│  ║  └── Vercel 배포 트리거                                               ║ │
│  ║                                                                       ║ │
│  ╚═══════════════════════════════════════════════════════════════════════╝ │
│                    │                                                        │
│                    ↓                                                        │
│  ╔═══════════════════════════════════════════════════════════════════════╗ │
│  ║ 6단계: Vercel → React 앱 서빙                                         ║ │
│  ╠═══════════════════════════════════════════════════════════════════════╣ │
│  ║                                                                       ║ │
│  ║  Vercel CDN 배포:                                                     ║ │
│  ║  ├── 정적 빌드된 React 앱                                             ║ │
│  ║  └── public/data/*.json CDN 캐싱                                      ║ │
│  ║                                                                       ║ │
│  ╚═══════════════════════════════════════════════════════════════════════╝ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 스크립트별 상세 역할

#### 1단계: 데이터 수집

| 스크립트 | 입력 | 출력 | 역할 |
|---------|------|------|------|
| `fetch_google_sheets.py` | config/clients.json | data/{client}/raw/raw_data.csv | 광고 성과 원본 데이터 수집 |
| `fetch_sheets_multi.py` | config/clients.json | data/{client}/type/merged_data.csv | 채널별(Meta, Google, Kakao) 데이터 통합 |
| `fetch_creative_sheets.py` | config/clients.json | data/{client}/creative/*.csv | 크리에이티브 성과 데이터 |
| `fetch_creative_url.py` | config/clients.json | data/{client}/creative/*_url.csv | 크리에이티브 이미지 URL |
| `fetch_ga4_sheets.py` | config/clients.json | data/{client}/GA4/*.csv | GA4 퍼널/이벤트 데이터 |

#### 2단계: 데이터 분석

| 스크립트 | 입력 | 출력 | 역할 |
|---------|------|------|------|
| `process_marketing_data.py` | raw/raw_data.csv | forecast/predictions_*.csv | Prophet 예측, 일/주/월 집계 |
| `segment_processor.py` | raw/raw_data.csv | forecast/segment_*.csv | 캠페인/연령/성별/기기별 세그먼트 |
| `insight_generator.py` | forecast/*.csv | forecast/insights.json | AI 인사이트 생성 |
| `visualization_generator.py` | forecast/*.csv | visualizations/*.png | 차트 이미지 생성 |
| `generate_funnel_data.py` | GA4/*.csv | funnel/*.csv, insights.json | 퍼널 전환율 계산 |
| `generate_engagement_data.py` | GA4/*.csv | funnel/channel_engagement.csv | 채널별 참여도 |
| `run_multi_analysis.py` | type/merged_data.csv | type/analysis_*.csv | 멀티채널 종합 분석 |
| `multi_analysis_dimension_detail.py` | type/merged_data.csv | type/dimension_type*.csv | 차원별 상세 분석 |
| `multi_analysis_prophet_forecast.py` | type/merged_data.csv | type/prophet_*.csv | 채널별 Prophet 예측 |
| `generate_type_insights.py` | type/*.csv | type/insights.json | 타입별 인사이트 |

#### 3단계: JSON 변환

| 스크립트 | 입력 | 출력 | 역할 |
|---------|------|------|------|
| `export_json.py` | data/{client}/**/* | public/data/{client}/*.json | 모든 분석 결과를 JSON으로 변환 |

### 6.3 파일 의존성 다이어그램

```
                                config/clients.json
                                        │
        ┌───────────────┬───────────────┼───────────────┬───────────────┐
        │               │               │               │               │
        ↓               ↓               ↓               ↓               ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ fetch_google │ │ fetch_sheets │ │ fetch_       │ │ fetch_       │ │ fetch_ga4_   │
│ _sheets.py   │ │ _multi.py    │ │ creative_    │ │ creative_    │ │ sheets.py    │
│              │ │              │ │ sheets.py    │ │ url.py       │ │              │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │                │                │
       ↓                ↓                ↓                ↓                ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ data/{client}│ │ data/{client}│ │ data/{client}│ │ data/{client}│ │ data/{client}│
│ /raw/        │ │ /type/       │ │ /creative/   │ │ /creative/   │ │ /GA4/        │
│ raw_data.csv │ │ merged_data  │ │ creative_    │ │ *_url.csv    │ │ *.csv        │
└──────┬───────┘ └──────┬───────┘ │ data.csv     │ └──────┬───────┘ └──────┬───────┘
       │                │         └──────┬───────┘        │                │
       │                │                │                │                │
       │                │                └────────┬───────┘                │
       │                │                         │                        │
       ↓                ↓                         ↓                        ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              2단계: 데이터 분석                                   │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  raw_data.csv 기반:                    merged_data 기반:                         │
│  ┌─────────────────┐                   ┌─────────────────┐                      │
│  │ process_        │                   │ run_multi_      │                      │
│  │ marketing_data  │                   │ analysis.py     │                      │
│  │ .py (Prophet)   │                   └────────┬────────┘                      │
│  └────────┬────────┘                            │                               │
│           │                            ┌────────┴────────┐                      │
│           ↓                            ↓                 ↓                      │
│  ┌─────────────────┐          ┌─────────────────┐ ┌─────────────────┐          │
│  │ segment_        │          │ multi_analysis_ │ │ multi_analysis_ │          │
│  │ processor.py    │          │ dimension_      │ │ prophet_        │          │
│  └────────┬────────┘          │ detail.py       │ │ forecast.py     │          │
│           │                   └────────┬────────┘ └────────┬────────┘          │
│           ↓                            │                   │                    │
│  ┌─────────────────┐                   ↓                   ↓                    │
│  │ insight_        │          ┌─────────────────┐ ┌─────────────────┐          │
│  │ generator.py    │          │ type/dimension_ │ │ type/prophet_   │          │
│  └────────┬────────┘          │ type*.csv       │ │ *.csv           │          │
│           │                   └─────────────────┘ └─────────────────┘          │
│           ↓                                                                     │
│  ┌─────────────────┐                                                           │
│  │ forecast/       │                                                           │
│  │ predictions_*   │                                                           │
│  │ segment_*.csv   │                                                           │
│  │ insights.json   │                                                           │
│  └─────────────────┘                                                           │
│                                                                                  │
│  GA4 데이터 기반:                       Creative 데이터:                         │
│  ┌─────────────────┐                   ┌─────────────────┐                      │
│  │ generate_       │                   │ (직접 JSON 변환)│                      │
│  │ funnel_data.py  │                   │ creative_data   │                      │
│  └────────┬────────┘                   │ + creative_url  │                      │
│           │                            └────────┬────────┘                      │
│           ↓                                     │                               │
│  ┌─────────────────┐                            │                               │
│  │ generate_       │                            │                               │
│  │ engagement_     │                            │                               │
│  │ data.py         │                            │                               │
│  └────────┬────────┘                            │                               │
│           │                                     │                               │
│           ↓                                     │                               │
│  ┌─────────────────┐                            │                               │
│  │ funnel/         │                            │                               │
│  │ daily_funnel    │                            │                               │
│  │ channel_funnel  │                            │                               │
│  │ engagement.csv  │                            │                               │
│  │ insights.json   │                            │                               │
│  └─────────────────┘                            │                               │
│                                                 │                               │
└──────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ↓
                    ┌───────────────────────────────────────┐
                    │           export_json.py              │
                    │                                       │
                    │  입력:                                │
                    │  ├── forecast/*.csv, insights.json    │
                    │  ├── type/*.csv, insights.json        │
                    │  ├── funnel/*.csv, insights.json      │
                    │  └── creative/*.csv                   │
                    │                                       │
                    │  출력: public/data/{client}/          │
                    │  ├── kpi.json                         │
                    │  ├── forecast.json                    │
                    │  ├── funnel.json                      │
                    │  ├── creative.json                    │
                    │  ├── segments.json                    │
                    │  ├── dimensions.json                  │
                    │  ├── insights.json                    │
                    │  └── meta.json                        │
                    └───────────────────┬───────────────────┘
                                        │
                                        ↓
                              ┌─────────────────┐
                              │ vercel deploy   │
                              │ --prod --yes    │
                              └─────────────────┘
```

---

## 7. 보안 구조

### 7.1 보안 계층

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              보안 계층 구조                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Layer 1: 인프라 보안                                                       │
│  ├── Google Credentials: 로컬 PC에만 존재 (외부 노출 없음)                  │
│  ├── Vercel: HTTPS 강제, DDoS 보호                                         │
│  └── Cloudflare: WAF, Bot 방어                                             │
│                                                                             │
│  Layer 2: 접근 제어 (Cloudflare Access)                                     │
│  ├── 이메일 OTP 인증                                                        │
│  ├── 클라이언트별 도메인 분리                                               │
│  └── 허용된 이메일 도메인/개인만 접근                                       │
│                                                                             │
│  Layer 3: 데이터 격리                                                       │
│  ├── 클라이언트별 서브도메인 (clienta.dashboard.com)                        │
│  ├── 클라이언트별 데이터 폴더 (/data/clientA/)                              │
│  └── 서버 사이드에서 clientId 검증                                          │
│                                                                             │
│  Layer 4: 애플리케이션 보안                                                  │
│  ├── middleware.ts: 서브도메인 → clientId 매핑 검증                         │
│  ├── 유효하지 않은 clientId → 404 리다이렉트                                │
│  └── JSON 파일에 민감 정보 제외 (원본 CSV, API 키 등)                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Cloudflare Access 정책

| 클라이언트 | 서브도메인 | 허용 정책 |
|-----------|-----------|----------|
| Client A | clienta.dashboard.com | *@clienta.com + 개별 이메일 |
| Client B | clientb.dashboard.com | *@clientb.co.kr |
| Admin | admin.dashboard.com | 관리자 이메일 목록 |

### 7.3 데이터 노출 범위

| 데이터 | 로컬 | Vercel | 사용자 |
|--------|------|--------|--------|
| Google Credentials | ✅ | ❌ | ❌ |
| 원본 CSV | ✅ | ❌ | ❌ |
| 분석 결과 JSON | ✅ | ✅ | ✅ (인증 후) |
| 캠페인/광고세트명 | ✅ | ✅ | ✅ (인증 후) |
| 비용/매출 집계 | ✅ | ✅ | ✅ (인증 후) |

---

## 8. 장단점 분석

### 8.1 장점

| 카테고리 | 장점 | 상세 설명 |
|---------|------|----------|
| **비용** | 연 ~$12 | 도메인 비용만, 서버/DB 비용 없음 |
| | 클라이언트 추가 $0 | 무제한 클라이언트 (무료 범위 내) |
| **기술** | Python 100% 재사용 | 기존 15개 스크립트 유지, --client만 추가 |
| | Prophet 완벽 지원 | 로컬 실행이라 라이브러리 제약 없음 |
| | 빠른 로딩 | 30MB → ~5MB (85% 감소) |
| | CDN 캐싱 | Vercel Edge Network로 전 세계 빠른 응답 |
| **운영** | 단일 코드베이스 | N개 클라이언트를 1개 React 앱으로 관리 |
| | 클라이언트 추가 용이 | config 추가 + deploy = 15-20분 |
| | UI 일괄 업데이트 | 1회 배포로 모든 클라이언트 반영 |
| **보안** | API 토큰 로컬 보관 | Google Credentials 외부 노출 없음 |
| | 데이터 격리 | 클라이언트 간 완전 분리 |
| | 접근 제어 | Cloudflare Access 이메일 인증 |

### 8.2 단점

| 카테고리 | 단점 | 심각도 | 완화 방안 |
|---------|------|--------|----------|
| **인프라** | 로컬 PC 의존 | 🟡 중간 | 전용 PC 상시 운영 또는 VM 전환 |
| | 실시간 갱신 불가 | 🟢 낮음 | 스케줄 주기 단축 (1시간) |
| | 단일 장애점 | 🟡 중간 | GitHub Actions 백업 |
| **개발** | React 개발 필요 | 🟡 중간 | 2-3주 투자 |
| | 스크립트 수정 | 🟢 낮음 | 1-2일 (파라미터 추가) |
| **확장** | 50명 초과 시 유료 | 🟡 중간 | Cloudflare 유료($3/user) |
| | 100+ 클라이언트 | 🟢 낮음 | 처리 시간 증가 (병렬화로 해결) |

### 8.3 한계

| 한계 | 설명 | 대안 |
|------|------|------|
| 실시간 데이터 | 배포 주기에 따른 지연 (최소 1시간) | 실시간 필요 시 별도 API 서버 |
| 클라이언트별 UI 커스텀 | 동일 UI만 제공 | 테마/설정 옵션으로 일부 대응 |
| 복잡한 권한 | 역할 기반 권한 미지원 | NextAuth.js로 자체 구현 |
| 대용량 데이터 | JSON 파일 크기 제한 (~10MB 권장) | 페이지네이션, 데이터 분할 |

---

## 9. 예상 작업 일정

### 9.1 단계별 일정

| 단계 | 작업 내용 | 예상 기간 | 담당 |
|------|----------|----------|------|
| **1단계** | 환경 설정 | 1일 | 개발 |
| | Next.js 프로젝트 생성 | | |
| | Vercel 연동 | | |
| | 도메인/Cloudflare 설정 | | |
| **2단계** | Python 스크립트 수정 | 1-2일 | 개발 |
| | common/paths.py 생성 | | |
| | 15개 스크립트 --client 추가 | | |
| | export_json.py 신규 작성 | | |
| **3단계** | React 대시보드 개발 | 2-3주 | 개발 |
| | 메인 대시보드 | | |
| | 예측 탭 (Prophet 차트) | | |
| | 퍼널 탭 | | |
| | 크리에이티브 탭 | | |
| | 공통 컴포넌트 (KPI, 차트) | | |
| **4단계** | 통합 테스트 | 3-5일 | QA |
| | 파이프라인 E2E 테스트 | | |
| | 멀티클라이언트 테스트 | | |
| | 보안/접근 제어 테스트 | | |
| **5단계** | 배포 및 문서화 | 2-3일 | 개발 |
| | 프로덕션 배포 | | |
| | 운영 가이드 작성 | | |
| | 클라이언트 온보딩 프로세스 | | |

### 9.2 총 예상 기간

| 시나리오 | 기간 | 조건 |
|---------|------|------|
| **최소** | 3주 | React 숙련자, 풀타임 |
| **표준** | 4주 | 일반 개발자, 풀타임 |
| **최대** | 6주 | React 학습 포함, 파트타임 |

### 9.3 마일스톤

```
Week 1: 환경 설정 + Python 수정 완료
        ├── Next.js 프로젝트 생성
        ├── common/paths.py 완성
        └── 모든 스크립트 --client 지원

Week 2: 핵심 UI 완료
        ├── 메인 대시보드
        ├── KPI 카드 컴포넌트
        └── 기본 차트 (Line, Bar)

Week 3: 전체 탭 완료
        ├── 예측 탭
        ├── 퍼널 탭
        ├── 크리에이티브 탭
        └── 서브도메인 라우팅

Week 4: 테스트 + 배포
        ├── 통합 테스트
        ├── Cloudflare Access 설정
        ├── 프로덕션 배포
        └── 문서화
```

---

## 10. 운영 가이드

### 10.1 일일 운영

**옵션 A: 로컬 트리거 + Git Push (권장)**

```batch
:: 자동 실행 (Windows 작업 스케줄러)
:: 매일 09:00 실행

:: 1. 데이터 수집 및 분석
python scripts/run_all_clients.py

:: 2. Git Commit + Push → GitHub Actions 자동 배포
git add public/data/
git commit -m "Daily data update %date%"
git push origin main
```

**옵션 B: GitHub Actions Cron (완전 자동화)**

```yaml
# .github/workflows/daily-deploy.yml
on:
  schedule:
    - cron: '0 0 * * *'  # UTC 00:00 = KST 09:00
```
> 상세 설정: 10.5 옵션 C 참조

### 10.2 신규 클라이언트 추가

```
1. config/clients.json에 클라이언트 추가 (5분)
2. Google Sheet 공유 설정 (5분)
3. 데이터 파이프라인 실행 (10분)
   python scripts/run_all_clients.py --client {clientId}
4. Git Commit + Push (2분)
   git add . && git commit -m "Add client {clientId}" && git push
5. GitHub Actions 자동 배포 확인 (3분)
6. Vercel에 서브도메인 추가 (2분)
7. Cloudflare Access 정책 추가 (5분)
8. 클라이언트에 URL 전달

총 소요: 20-25분
```

### 10.3 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| 데이터 미갱신 | 스케줄러 미실행 | 작업 스케줄러 확인 |
| 특정 클라이언트 오류 | Sheet 권한/구조 | 해당 클라이언트만 재실행 |
| 배포 실패 | Vercel 토큰 만료 | `vercel login` 재인증 |
| 접근 불가 | Cloudflare 정책 | Access 정책 확인 |

### 10.4 모니터링 체크리스트

```
□ 일일: 배포 로그 확인
□ 주간: 클라이언트별 데이터 정합성
□ 월간: Vercel 사용량, Cloudflare 로그
```

### 10.5 로컬 PC 의존 완화 방안

현재 아키텍처는 로컬 PC에서 데이터 파이프라인을 실행합니다. 이 의존성을 완화하는 옵션들:

| 옵션 | 설명 | 비용 | 복잡도 |
|------|------|------|--------|
| **A. 전용 PC** | 항상 켜둔 전용 PC + Windows 작업 스케줄러 | $0 | 낮음 |
| **B. 클라우드 VM** | AWS EC2/Azure VM에서 스케줄 실행 | $5-20/월 | 중간 |
| **C. GitHub Actions** | 프라이빗 레포에서 Cron 실행 | $0 (2000분/월) | 중간 |
| **D. 하이브리드** | 로컬 PC (주) + GitHub Actions (백업) | $0 | 높음 |

#### 옵션 C: GitHub Actions 예시

```yaml
# .github/workflows/daily-deploy.yml
name: Daily Dashboard Deploy

on:
  schedule:
    - cron: '0 0 * * *'  # UTC 00:00 = KST 09:00
  workflow_dispatch:      # 수동 트리거

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run pipeline
        run: python scripts/run_all_clients.py
        env:
          GOOGLE_CREDENTIALS: ${{ secrets.GOOGLE_CREDENTIALS }}

      - name: Deploy to Vercel
        run: vercel deploy --prod --yes --token=${{ secrets.VERCEL_TOKEN }}
```

**주의**: GitHub Actions에서 Prophet 실행 시 빌드 시간이 길어질 수 있음 (5-10분)

### 10.6 데이터 백업

```
권장 백업 정책:

1. 로컬 data/ 폴더
   └── 주 1회 외장 드라이브 또는 클라우드 스토리지 백업

2. config/clients.json
   └── Git 버전 관리 (민감 정보 제외)

3. public/data/ (JSON)
   └── Vercel 배포 히스토리로 자동 보관 (최근 10개)

4. Google Sheets 원본
   └── Google 자체 버전 히스토리 활용
```

---

## 부록

### A. 비용 상세

| 항목 | 월 비용 | 연 비용 | 비고 |
|------|--------|--------|------|
| Vercel | $0 | $0 | 무료 티어 (100GB/월) |
| Cloudflare Access | $0 | $0 | 50명까지 무료 |
| 도메인 (.com) | $1 | $12 | 연간 결제 |
| **합계** | **~$1** | **~$12** | |

### B. 기술 스택

| 분류 | 기술 | 버전 |
|------|------|------|
| 분석 | Python | 3.10+ |
| | Prophet | 1.1+ |
| | Pandas | 2.0+ |
| 프론트엔드 | Next.js | 14+ |
| | React | 18+ |
| | TypeScript | 5+ |
| 차트 | Recharts 또는 React-Plotly | 최신 |
| 호스팅 | Vercel | - |
| 보안 | Cloudflare Access | - |

### C. 참고 문서

- [Next.js 공식 문서](https://nextjs.org/docs)
- [Vercel 배포 가이드](https://vercel.com/docs)
- [Cloudflare Access 설정](https://developers.cloudflare.com/cloudflare-one/policies/access/)
- [Prophet 문서](https://facebook.github.io/prophet/docs/)

### D. JSON 출력 스키마

#### kpi.json
```json
{
  "daily": [
    {
      "date": "2025-01-15",
      "cost": 1500000,
      "revenue": 4500000,
      "conversions": 45,
      "clicks": 1200,
      "impressions": 50000,
      "roas": 3.0,
      "cpa": 33333,
      "ctr": 2.4
    }
  ],
  "weekly": [...],
  "monthly": [...],
  "summary": {
    "totalCost": 45000000,
    "totalRevenue": 135000000,
    "totalConversions": 1350,
    "avgROAS": 3.0,
    "avgCPA": 33333,
    "dataPoints": 30,
    "dateRange": {
      "start": "2025-01-01",
      "end": "2025-01-30"
    }
  }
}
```

#### forecast.json
```json
{
  "predictions": [
    {
      "date": "2025-02-01",
      "actual": null,
      "predicted": 4800000,
      "lower": 4200000,
      "upper": 5400000,
      "trend": 4500000,
      "weekly_seasonality": 1.05,
      "yearly_seasonality": 0.98
    }
  ],
  "byMetric": {
    "cost": [...],
    "revenue": [...],
    "conversions": [...]
  }
}
```

#### funnel.json
```json
{
  "daily": [
    {
      "date": "2025-01-15",
      "stage": "session_start",
      "users": 10000,
      "conversionRate": 100
    },
    {
      "date": "2025-01-15",
      "stage": "view_item",
      "users": 5000,
      "conversionRate": 50
    }
  ],
  "channel": [...],
  "engagement": [
    {
      "channel": "organic_search",
      "sessions": 5000,
      "avgSessionDuration": 180,
      "bounceRate": 45.2,
      "pagesPerSession": 3.5
    }
  ],
  "insights": {
    "topChannel": "paid_search",
    "conversionBottleneck": "add_to_cart"
  }
}
```

#### meta.json
```json
{
  "clientId": "clientA",
  "clientName": "A 회사",
  "lastUpdated": "2025-01-15T09:00:00+09:00",
  "timezone": "Asia/Seoul",
  "currency": "KRW",
  "files": [
    "kpi.json",
    "forecast.json",
    "funnel.json",
    "creative.json",
    "segments.json",
    "dimensions.json",
    "insights.json",
    "meta.json"
  ],
  "version": "1.0.0"
}
```

### E. clients.json 스키마

```json
{
  "clients": [
    {
      "id": "clientA",
      "name": "A 회사",
      "subdomain": "clienta",
      "sheets": {
        "raw": {
          "sheetId": "1ABC_SHEET_ID",
          "worksheet": "data_integration"
        },
        "multi": {
          "sheetId": "1DEF_SHEET_ID",
          "worksheets": ["meta_ads", "google_ads", "kakao_moment"]
        },
        "creative": {
          "sheetId": "1GHI_SHEET_ID",
          "worksheet": "creative_data"
        },
        "creativeUrl": {
          "sheetId": "1JKL_SHEET_ID",
          "worksheet": "creative_url"
        },
        "ga4": {
          "sheetId": "1MNO_SHEET_ID",
          "worksheet": "ga4_funnel"
        }
      },
      "accessPolicy": {
        "allowedDomains": ["clienta.com"],
        "allowedEmails": ["external@gmail.com"]
      }
    }
  ],
  "defaults": {
    "timezone": "Asia/Seoul",
    "currency": "KRW",
    "dateFormat": "YYYY-MM-DD",
    "forecastDays": 90
  }
}
```

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2024-11-28 | 1.0.0 | 초안 작성 |
| 2025-01-05 | 1.1.0 | 아키텍처 분류 섹션 추가 (JAMstack/Serverless Full Stack) |
|            |       | 풀퍼널 커버리지 섹션 추가 (AARRR 4/5단계) |
|            |       | 데이터 흐름 정리: .bat → Git Push → GitHub Actions → Vercel |

---

**문서 끝**
