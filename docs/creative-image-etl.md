# 소재 이미지 ETL 다운로드 시스템

## 1. 개발 배경

### 문제 상황
소재별 대시보드에서 Facebook 광고 이미지가 대부분 로드되지 않는 현상 발생.

### 원인 분석
| 이미지 소스 | 상태 | 원인 |
|------------|------|------|
| Google Drive | 정상 | CORS 허용 |
| Facebook (scontent) | **차단** | CORS 정책 |
| Facebook Ads Image | **차단** | CORS 정책 |

**CORS (Cross-Origin Resource Sharing)**
- 브라우저 보안 정책으로, 다른 도메인의 리소스 요청을 제한
- Facebook CDN(scontent)은 외부 사이트에서의 직접 이미지 로드를 차단
- 서버 사이드에서는 CORS 제한 없음 (브라우저 전용 정책)

### 해결 방안 검토

| 방안 | 장점 | 단점 | 서버 부하 |
|------|------|------|----------|
| A. 수동 업로드 | 확실한 해결 | 운영 부담 큼 | 없음 |
| B. Google Drive 변환 | 기존 시스템 활용 | 수동 작업 필요 | 없음 |
| C. API Proxy | 실시간 처리 | 서버 부하, 속도 저하 | **높음** |
| **D. ETL 다운로드** | 자동화, CORS 우회 | 저장 공간 필요 | **없음** |

**선택: D. ETL 자동 다운로드**
- 데이터 fetch 시점에 서버에서 이미지 다운로드
- 로컬 파일로 서빙하여 CORS 완전 우회
- 런타임 서버 부하 없음

---

## 2. 구현 방식

### 아키텍처
```
[Google Sheets]     [Facebook CDN]
      │                   │
      ▼                   ▼
┌─────────────────────────────────────┐
│  fetch_creative_url.py              │
│  --download-images 옵션             │
│                                     │
│  1. CSV 데이터 fetch                │
│  2. Facebook URL 감지               │
│  3. 이미지 다운로드 (서버 사이드)   │
│  4. local_image_path 컬럼 추가      │
└─────────────────────────────────────┘
      │                   │
      ▼                   ▼
[data/creative/       [public/creative/
 Creative_url.csv]     images/*.jpg]
      │                   │
      └─────────┬─────────┘
                ▼
        [Next.js Frontend]
        로컬 이미지 우선 로드
```

### 핵심 로직

#### 파일명 생성 (소재명 기준)
```python
def get_image_filename(creative_name: str) -> str:
    # 소재명 정제
    safe_name = re.sub(r'[\x00-\x1f\x7f]', '', creative_name)  # 제어문자 제거
    safe_name = re.sub(r'[<>:"/\\|?*]', '_', safe_name)        # 특수문자 치환
    safe_name = safe_name.strip(' .')[:50]

    # 소재명 해시로 고유성 보장 (URL과 무관)
    name_hash = hashlib.md5(creative_name.encode()).hexdigest()[:8]

    return f"{safe_name}_{name_hash}.jpg"
```

**설계 의도:**
- URL 해시가 아닌 **소재명 해시** 사용
- Facebook URL이 매일 갱신되어도 동일 소재는 같은 파일명
- 저장 공간 누적 방지

#### 다운로드 대상 필터링
```python
def is_downloadable_url(url: str) -> bool:
    downloadable_patterns = [
        'facebook.com/ads/image',
        'scontent',
        'fbcdn.net',
    ]
    # Google Drive는 제외 (이미 CORS 허용)
    if 'drive.google.com' in url:
        return False
    return any(pattern in url for pattern in downloadable_patterns)
```

#### 캐싱 로직
```python
# 이미 존재하면 스킵 (소재명 기준 캐싱)
if save_path.exists():
    local_path_map[creative_name] = f"/creative/images/{filename}"
    skip_count += 1
    return  # 다음 소재로
```

### 프론트엔드 연동
```typescript
// ReactView.tsx - 이미지 URL 우선순위
const localImagePath = row['local_image_path'] || ''

if (localImagePath) {
  // 1순위: 로컬 이미지 (ETL 다운로드)
  newImageUrlMap[creativeName] = localImagePath
  return
}
// 2순위: Google Drive
// 3순위: Facebook/YouTube 원본 URL
```

---

## 3. 실행 결과

### 다운로드 통계
| 항목 | 값 |
|------|-----|
| 전체 소재 | 548개 |
| 다운로드 대상 | 348개 (Facebook/scontent) |
| 스킵 (Google Drive 등) | 200개 |
| 실패 | 0개 |
| 총 용량 | 60MB |

### 파일 구조
```
public/creative/images/
├── [GM]250214_프라이싱_마케팅_017eaa18.jpg
├── [GM]250214_프라이싱_성장관리_4b5bda16.jpg
├── 240308_테스트_001_2ed9f84a.jpg
└── ... (348개 파일)
```

### 동작 방식 요약
| 상황 | 동작 | 결과 |
|------|------|------|
| 신규 소재 | 다운로드 | 새 파일 생성 |
| 동일 소재 + 동일 URL | 스킵 | 기존 파일 재사용 |
| 동일 소재 + 다른 URL | **스킵** | 기존 파일 재사용 |
| Google Drive URL | 스킵 | 원본 URL 사용 |

---

## 4. 사용법

### 이미지 포함 데이터 fetch
```bash
python scripts/fetch_creative_url.py --client test_1 --download-images
```

### 데이터만 fetch (기존 방식)
```bash
python scripts/fetch_creative_url.py --client test_1
```

### 배치 파일 연동
현재 `test_1_fetch.bat`, `deploy.bat`에는 `--download-images` 미포함.
필요 시 수동 실행 또는 배치 파일 수정 필요.

---

## 5. 대안: Proxy + Cache 방식

### 개요
ETL 다운로드 대신 런타임에 서버가 이미지를 프록시하는 방식.

### 아키텍처
```
[Browser] → [Next.js API Route] → [Facebook CDN]
              /api/image-proxy
              ?url=encoded_url
                    │
                    ▼
              [Redis/Memory Cache]
              TTL: 30일
```

### 구현 예시
```typescript
// pages/api/image-proxy.ts
export default async function handler(req, res) {
  const { url } = req.query
  const cacheKey = `img:${md5(url)}`

  // 캐시 확인
  const cached = await redis.get(cacheKey)
  if (cached) {
    res.setHeader('Cache-Control', 'public, max-age=2592000')
    return res.send(Buffer.from(cached, 'base64'))
  }

  // 원본 fetch
  const response = await fetch(decodeURIComponent(url))
  const buffer = await response.buffer()

  // 캐시 저장 (30일)
  await redis.setex(cacheKey, 2592000, buffer.toString('base64'))

  res.setHeader('Content-Type', 'image/jpeg')
  res.setHeader('Cache-Control', 'public, max-age=2592000')
  res.send(buffer)
}
```

### 장단점 비교

| 항목 | ETL 다운로드 (현재) | Proxy + Cache |
|------|---------------------|---------------|
| **서버 부하** | 없음 (정적 파일) | 있음 (API 호출) |
| **저장 위치** | Git/파일시스템 | Redis/메모리 |
| **실시간성** | fetch 시점 | 요청 시점 |
| **저장 공간** | 60MB (Git) | Redis 메모리 |
| **인프라** | 불필요 | Redis 필요 |
| **URL 갱신 대응** | 수동 재다운로드 | 자동 (캐시 만료 후) |
| **Vercel 호환** | 완벽 | 제한적 (Edge 함수) |

### Proxy + Cache 적합 상황
1. 이미지가 자주 변경되는 경우
2. 저장 공간을 Git에 포함하기 어려운 경우
3. Redis 등 캐시 인프라가 이미 있는 경우
4. 실시간 이미지 갱신이 필요한 경우

### 현재 선택 이유
| 고려 사항 | 판단 |
|-----------|------|
| 이미지 변경 빈도 | 낮음 (소재 자체는 고정) |
| 인프라 복잡도 | 최소화 우선 |
| Vercel 무료 플랜 | API 호출 제한 |
| 운영 편의성 | ETL 다운로드가 단순 |

---

## 6. 향후 개선 가능성

### 단기
- [ ] 배치 파일에 `--download-images` 옵션 통합
- [ ] 이미지 정리 스크립트 (사용되지 않는 이미지 삭제)

### 중기
- [ ] 이미지 압축 최적화 (WebP 변환)
- [ ] CDN 연동 (Vercel Edge Network 활용)

### 장기 (필요 시)
- [ ] Proxy + Cache 방식으로 전환
- [ ] 이미지 저장소 분리 (S3, Cloudflare R2)

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-01-11 | 최초 구현 - ETL 이미지 다운로드 |
| 2026-01-11 | 파일명 로직 변경 (URL해시 → 소재명해시) |
