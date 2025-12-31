# Meta 광고 이미지 수집기 가이드

## 개요

`scripts/meta_ad_image_collector.py`는 Meta(Facebook) 광고 계정에서 광고 이미지 URL을 수집하는 Python 스크립트입니다.

## 파일 위치

- 스크립트: `scripts/meta_ad_image_collector.py`
- 설정 파일: `config_meta_image.json`
- 출력 파일: `광고데이터.csv`

---

## 설정 파일 (config_meta_image.json)

```json
{
    "meta": {
        "account_id": "act_XXXXXXXXXX",
        "access_token": "YOUR_ACCESS_TOKEN",
        "start_date": "2025-01-01",
        "end_date": "2025-12-01"
    }
}
```

| 필드 | 설명 |
|------|------|
| account_id | Meta 광고 계정 ID (act_ 접두사 포함) |
| access_token | Graph API 액세스 토큰 |
| start_date | 수집 시작일 (yyyy-mm-dd) |
| end_date | 수집 종료일 (yyyy-mm-dd) |

---

## 이미지 수집 우선순위

스크립트는 다음 우선순위로 이미지 URL을 수집합니다:

### 1단계: Ads API (기본 조회)
1. `creative.image_url`
2. `video_data.image_url`
3. `link_data.picture`

### 2단계: Creative API Fallback
4. `creative.image_url` (직접 조회)
5. `object_story_spec.video_data.image_url`
6. `object_story_spec.link_data.picture`
7. `link_data.child_attachments[].image_hash` (캐러셀)
8. `asset_feed_spec.images[].hash` (이미지 해시 → URL 변환)
9. `thumbnail_url` (고해상도 1200x1200)
10. `effective_instagram_media_id` → Instagram Graph API `media_url`

### 3단계: Preview API Fallback
11. Preview iframe 내 scontent URL 추출

---

## 주요 기능

### 고해상도 썸네일 수집

Creative API 요청 시 `thumbnail_width=1200&thumbnail_height=1200` 파라미터를 추가하여 고해상도 썸네일을 수집합니다.

```python
url = (
    f"{self.base_url}/{ad.creative_id}"
    f"?fields=object_story_spec,image_url,asset_feed_spec,thumbnail_url,effective_instagram_media_id"
    f"&thumbnail_width=1200&thumbnail_height=1200"
    f"&access_token={self.settings.access_token}"
)
```

- 기본 썸네일: 64x64 픽셀 (~1.6KB)
- 고해상도 썸네일: 1200x1200 픽셀 (~72KB)

### Rate Limit 대응

API 호출 시 rate limit 오류가 발생하면 자동으로 재시도합니다:

- `_make_request()`: 최대 5회 재시도, 10초/20초/30초... 대기
- `fetch_creative_image()`: 최대 3회 재시도, 2초/4초/6초 대기
- 배치 처리 시 동시 요청 수 5개로 제한
- 페이지 간 1.5초 딜레이

### 이미지 해시 → URL 변환

`asset_feed_spec.images[].hash` 또는 `child_attachments[].image_hash`가 있는 경우:

```python
def _get_image_url_from_hash(self, image_hash: str) -> Optional[str]:
    url = f"{self.base_url}/{self.settings.account_id}/adimages?hashes=[\"{image_hash}\"]&fields=url&access_token={self.settings.access_token}"
```

### Instagram 연동 광고 처리

Creative에 `effective_instagram_media_id`가 있는 경우, Instagram Graph API로 `media_url`을 조회합니다:

```python
def _get_instagram_media_url(self, ig_media_id: str) -> Optional[str]:
    url = f"{self.base_url}/{ig_media_id}?fields=media_url,thumbnail_url&access_token={self.settings.access_token}"
```

- Instagram에 게시된 광고는 Creative API에서 image 관련 필드가 비어있는 경우가 있음
- `effective_instagram_media_id`로 Instagram CDN의 `media_url` 직접 조회 가능

---

## 출력 파일 (광고데이터.csv)

| 컬럼 | 설명 |
|------|------|
| ad_name | 광고 이름 |
| ad_id | 광고 ID |
| preview_link | 미리보기 링크 |
| image_url | 수집된 이미지 URL |
| image_source | 이미지 출처 |

### image_source 값

| 값 | 설명 |
|----|------|
| creative_image_url | Ads API creative.image_url |
| video_data_image_url | Ads API video_data.image_url |
| link_data_picture | Ads API link_data.picture |
| creative_direct | Creative API image_url |
| creative_video_data | Creative API video_data.image_url |
| creative_link_data | Creative API link_data.picture |
| carousel_hash | 캐러셀 이미지 해시 변환 |
| asset_feed_hash | asset_feed_spec 이미지 해시 변환 |
| thumbnail_hires | 고해상도 썸네일 (1200x1200) |
| instagram_media | Instagram 연동 광고 media_url |
| preview_iframe | Preview API iframe 추출 |

---

## 실행 방법

```bash
cd "C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본"
python scripts/meta_ad_image_collector.py
```

---

## 작업 이력

### 2025-12-31 업데이트

#### 1. scontent URL 서명 불일치 문제 해결

**문제**: CSV에 저장된 scontent URL이 "URL signature mismatch" 오류 발생

**원인**: `_convert_to_high_res()` 함수가 URL 파라미터를 수정하여 서명이 깨짐

**해결**: URL 수정 함수 제거, 원본 URL 그대로 사용

#### 2. keyframe 형식 URL 필터링

**문제**: Preview API에서 추출한 `/m1/v/t6/` 경로 URL이 브라우저에서 이미지로 표시되지 않음

**원인**: `image/x.fb.keyframes` 형식 (Facebook 전용 비디오 키프레임)

**해결**: Preview API URL 필터링 시 keyframe URL 제외

```python
if "/m1/v/t6/" in decoded:
    continue
```

#### 3. 고해상도 썸네일 파라미터 적용

**문제**: 기본 thumbnail_url이 64x64 저화질

**해결**: Creative API 요청 시 `thumbnail_width=1200&thumbnail_height=1200` 파라미터 추가

**결과**:
- 이전: 691/889 (77.7%)
- 이후: 809/889 (91.0%)
- 신규 소스 `thumbnail_hires`: 153개 추가 수집

#### 4. Rate Limit 재시도 로직 추가

**문제**: API rate limit 발생 시 요청이 무시되어 이미지 수집 실패

**해결**:
- `_make_request()`: 5회 재시도, 점진적 대기 시간
- `fetch_creative_image()`: 3회 재시도
- 배치 처리 동시 요청 수 10 → 5로 감소
- 예외 발생 시 로깅 추가

#### 5. Instagram 연동 광고 지원 추가

**문제**: `250502_mb_conv_avt_zins` 광고가 이미지 수집 실패
- Creative API: `id`만 반환, image 관련 필드 없음
- Preview iframe: keyframe URL만 존재

**분석**: Creative의 `effective_instagram_media_id` 필드 발견
- Instagram Graph API로 `media_url` 조회 가능

**해결**:
1. Creative API 요청에 `effective_instagram_media_id` 필드 추가
2. `_get_instagram_media_url()` 메서드 추가
3. 6순위 폴백으로 Instagram media_url 수집

#### 6. 최종 결과

새 계정(act_277364410152239) 테스트:
- 총 광고: 462개
- 수집 성공: 462개 (100%)
- 수집 실패: 0개

---

## 수집 불가 케이스

다음 경우 이미지 수집이 불가능합니다:

1. **Creative API 필드 없음**: Creative가 image 관련 메타데이터를 포함하지 않음
2. **비디오 전용 광고**: 썸네일 없이 비디오만 있는 광고
3. **keyframe만 존재**: Preview iframe에 `image/x.fb.keyframes` 형식만 포함

---

## 이미지 소스별 통계 예시

```
📈 이미지 소스별 통계:
   - video_data_image_url: 242개
   - thumbnail_hires: 101개
   - creative_image_url: 72개
   - asset_feed_hash: 35개
   - carousel_hash: 11개
   - instagram_media: 1개
```

---

## 참고 사항

### URL 만료

Meta API에서 반환하는 이미지 URL은 임시 URL로, 약 5일 후 만료됩니다.
- URL의 `oe=` 파라미터가 만료 시간 (Unix hex timestamp)

### API 버전

현재 사용 버전: `v21.0`

```python
API_VERSION: str = "v21.0"
```

### 의존성

```
requests
pandas
```
