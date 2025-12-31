"""
Meta 광고 이미지 수집 스크립트 (Python 버전)
Key: ad_name 기준 매핑

원본: Google Apps Script → Python 변환
"""

import os
import re
import json
import time
import requests
import pandas as pd
from datetime import datetime
from typing import Optional, Dict, List, Any
from dataclasses import dataclass, field
from concurrent.futures import ThreadPoolExecutor, as_completed


# ========================================
# 설정
# ========================================

@dataclass
class Config:
    API_VERSION: str = "v21.0"
    BATCH_SIZE: int = 20
    API_DELAY: float = 1.0  # 초 단위 (Rate limit 방지)
    MAX_PAGES: int = 500
    FETCH_LIMIT: int = 25  # 1회 API 호출당 광고 수
    OUTPUT_FILE: str = "광고데이터.csv"
    

@dataclass
class Settings:
    account_id: str = ""
    access_token: str = ""
    start_date: Optional[str] = None
    end_date: Optional[str] = None


@dataclass
class AdData:
    ad_name: str = ""
    ad_id: str = ""
    preview_link: str = ""
    creative_id: str = ""
    image_url: str = ""
    image_source: str = ""


# ========================================
# 유틸리티 함수
# ========================================

def date_to_timestamp(date_str: str) -> Optional[int]:
    """날짜 문자열을 Unix timestamp로 변환"""
    if not date_str:
        return None
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return int(dt.timestamp())
    except ValueError:
        print(f"⚠️ 잘못된 날짜 형식: {date_str} (yyyy-mm-dd 형식 필요)")
        return None


def decode_html(html: str) -> str:
    """HTML 이스케이프 문자 디코딩"""
    if not html:
        return ""
    
    decoded = html
    
    # 유니코드 이스케이프 처리
    if "\\u" in html:
        try:
            decoded = json.loads(f'"{html}"')
        except json.JSONDecodeError:
            # 수동 변환
            decoded = (html
                .replace("\\u003c", "<")
                .replace("\\u003e", ">")
                .replace("\\u0022", '"')
                .replace("\\u0027", "'")
                .replace("\\/", "/")
                .replace("\\n", "")
            )
    
    # HTML 엔티티 변환
    decoded = decoded.replace("&amp;", "&").replace("&quot;", '"')
    
    return decoded


# ========================================
# 이미지 URL 추출
# ========================================

def extract_image_url(ad: Dict[str, Any]) -> Dict[str, str]:
    """광고 데이터에서 이미지 URL 추출 (우선순위별)"""
    creative = ad.get("creative", {}) or {}
    spec = creative.get("object_story_spec", {}) or {}
    link_data = spec.get("link_data", {}) or {}
    video_data = spec.get("video_data", {}) or {}

    # 1순위: creative.image_url
    if creative.get("image_url"):
        return {"url": creative["image_url"], "source": "creative_image_url"}

    # 2순위: video_data.image_url
    if video_data.get("image_url"):
        return {"url": video_data["image_url"], "source": "video_data_image_url"}

    # 3순위: link_data.picture
    if link_data.get("picture"):
        return {"url": link_data["picture"], "source": "link_data_picture"}

    return {"url": "", "source": ""}


def extract_image_from_html(html: str) -> str:
    """HTML에서 이미지 URL 추출"""
    if not html:
        return ""

    decoded = decode_html(html)
    urls = []

    # img 태그에서 src 추출
    img_pattern = r'<img[^>]+src=["\']?(https?://[^"\'\s>]+)["\']?'
    urls.extend(re.findall(img_pattern, decoded, re.IGNORECASE))

    # background-image에서 url 추출
    bg_pattern = r'background-image:\s*url\(["\']?(https?://[^"\')]+)["\']?\)'
    urls.extend(re.findall(bg_pattern, decoded, re.IGNORECASE))

    # data-src 속성에서 추출
    data_src_pattern = r'data-src=["\']?(https?://[^"\'\s>]+)["\']?'
    urls.extend(re.findall(data_src_pattern, decoded, re.IGNORECASE))

    # style 내 url() 추출
    style_url_pattern = r'url\(["\']?(https?://[^"\')]+)["\']?\)'
    urls.extend(re.findall(style_url_pattern, decoded, re.IGNORECASE))

    # URL 정리 및 필터링
    valid_urls = []
    for url in urls:
        url = url.replace("&amp;", "&")

        # 아이콘, 이모지, 저화질 제외
        if any(keyword in url.lower() for keyword in ["emoji", "icon", "logo", "profile", "avatar"]):
            continue
        if any(size in url for size in ["/p50x50/", "/p32x32/", "/p24x24/", "/s32x32/", "/t51.1-8/"]):
            continue

        # 이미지 확장자 또는 Meta CDN 도메인 확인
        is_image_ext = any(ext in url.lower() for ext in [".jpg", ".jpeg", ".png", ".webp", ".gif"])
        is_meta_cdn = any(domain in url for domain in ["scontent", "fbcdn", "facebook", "fb.com", "cdninstagram"])

        if is_image_ext or is_meta_cdn:
            valid_urls.append(url)

    if not valid_urls:
        return ""

    # 해상도 점수 기반 정렬 (고화질 우선)
    def resolution_score(url: str) -> int:
        # 고해상도 키워드
        if any(k in url for k in ["1080", "p1080", "s1080", "w1080"]):
            return 100
        if any(k in url for k in ["720", "p720", "s720", "w720"]):
            return 80
        if any(k in url for k in ["600", "p600", "s600", "w600"]):
            return 60
        if any(k in url for k in ["480", "p480", "s480"]):
            return 40
        # 저해상도 페널티
        if any(k in url for k in ["/s150", "/p150", "/s130", "/p130", "/s100", "/p100"]):
            return 5
        return 30

    valid_urls.sort(key=resolution_score, reverse=True)
    return valid_urls[0]


# ========================================
# Meta API 호출
# ========================================

class MetaAdImageCollector:
    """Meta 광고 이미지 수집기"""
    
    def __init__(self, settings: Settings, config: Config = None):
        self.settings = settings
        self.config = config or Config()
        self.base_url = f"https://graph.facebook.com/{self.config.API_VERSION}"
    
    def _make_request(self, url: str, retry_count: int = 0) -> Dict[str, Any]:
        """API 요청 실행 (재시도 포함)"""
        MAX_RETRIES = 5

        try:
            response = requests.get(url, timeout=30)

            # Rate limit 또는 서버 오류 시 재시도
            if response.status_code in [429, 500, 502, 503, 504]:
                if retry_count < MAX_RETRIES:
                    wait_time = (retry_count + 1) * 10  # 10초, 20초, 30초...
                    print(f"⏳ Rate limit - {wait_time}초 대기 후 재시도 ({retry_count + 1}/{MAX_RETRIES})...")
                    time.sleep(wait_time)
                    return self._make_request(url, retry_count + 1)

            data = response.json()

            if "error" in data:
                error_msg = data["error"].get("message", "알 수 없는 오류")
                # Rate limit 오류 확인
                if "too many calls" in error_msg.lower() or "rate limit" in error_msg.lower():
                    if retry_count < MAX_RETRIES:
                        wait_time = (retry_count + 1) * 10
                        print(f"⏳ Rate limit - {wait_time}초 대기 후 재시도 ({retry_count + 1}/{MAX_RETRIES})...")
                        time.sleep(wait_time)
                        return self._make_request(url, retry_count + 1)
                raise Exception(f"API 오류: {error_msg}")

            return data
        except requests.RequestException as e:
            if retry_count < MAX_RETRIES:
                wait_time = (retry_count + 1) * 5
                print(f"⏳ 요청 오류 - {wait_time}초 대기 후 재시도...")
                time.sleep(wait_time)
                return self._make_request(url, retry_count + 1)
            raise Exception(f"요청 실패: {str(e)}")
    
    def fetch_ad_list(self) -> List[AdData]:
        """광고 목록 가져오기"""
        ads = []
        
        # 필터 설정
        filters = []
        if self.settings.start_date:
            ts = date_to_timestamp(self.settings.start_date)
            if ts:
                filters.append({
                    "field": "created_time",
                    "operator": "GREATER_THAN",
                    "value": ts
                })
        
        if self.settings.end_date:
            ts = date_to_timestamp(self.settings.end_date)
            if ts:
                filters.append({
                    "field": "created_time",
                    "operator": "LESS_THAN",
                    "value": ts
                })
        
        filter_param = ""
        if filters:
            filter_param = f"&filtering={requests.utils.quote(json.dumps(filters))}"
        
        # API 필드 (간소화 - 나머지는 Creative API fallback에서 처리)
        fields = ",".join([
            "id",
            "name",
            "preview_shareable_link",
            "creative{id,image_url,object_story_spec{video_data{image_url},link_data{picture}}}"
        ])
        
        url = (
            f"{self.base_url}/{self.settings.account_id}/ads"
            f"?fields={requests.utils.quote(fields)}"
            f"&limit={self.config.FETCH_LIMIT}{filter_param}"
            f"&access_token={self.settings.access_token}"
        )
        
        page_count = 0
        
        while url and page_count < self.config.MAX_PAGES:
            page_count += 1
            print(f"📄 페이지 {page_count} 조회 중...")
            
            data = self._make_request(url)
            
            if not data.get("data"):
                break
            
            for ad in data["data"]:
                image_info = extract_image_url(ad)
                
                ads.append(AdData(
                    ad_name=ad.get("name", ""),
                    ad_id=ad.get("id", ""),
                    preview_link=ad.get("preview_shareable_link", ""),
                    creative_id=ad.get("creative", {}).get("id", "") if ad.get("creative") else "",
                    image_url=image_info["url"],
                    image_source=image_info["source"]
                ))
            
            # 다음 페이지
            url = data.get("paging", {}).get("next")
            if url:
                time.sleep(1.5)  # Rate limit 방지 (더 긴 딜레이)
        
        return ads
    
    def fetch_creative_image(self, ad: AdData, retry_count: int = 0) -> None:
        """Creative API로 이미지 가져오기 (Fallback)"""
        MAX_RETRIES = 3

        if ad.image_url:  # 이미 이미지 있으면 스킵
            return

        if not ad.creative_id:
            return

        url = (
            f"{self.base_url}/{ad.creative_id}"
            f"?fields=object_story_spec,image_url,asset_feed_spec,thumbnail_url,effective_instagram_media_id"
            f"&thumbnail_width=1200&thumbnail_height=1200"
            f"&access_token={self.settings.access_token}"
        )

        try:
            response = requests.get(url, timeout=30)

            # Rate limit 또는 서버 오류 시 재시도
            if response.status_code in [429, 500, 502, 503, 504]:
                if retry_count < MAX_RETRIES:
                    wait_time = (retry_count + 1) * 2  # 2초, 4초, 6초
                    time.sleep(wait_time)
                    return self.fetch_creative_image(ad, retry_count + 1)
                else:
                    print(f"⚠️ Creative API 재시도 실패 (status {response.status_code}): {ad.ad_name[:40]}")
                    return

            if response.status_code != 200:
                print(f"⚠️ Creative API 오류 (status {response.status_code}): {ad.ad_name[:40]}")
                return

            data = response.json()

            if "error" in data:
                error_msg = data["error"].get("message", "Unknown")
                if "rate limit" in error_msg.lower() and retry_count < MAX_RETRIES:
                    time.sleep((retry_count + 1) * 2)
                    return self.fetch_creative_image(ad, retry_count + 1)
                return

            # 1순위: creative.image_url
            if data.get("image_url"):
                ad.image_url = data["image_url"]
                ad.image_source = "creative_direct"
                print(f"✅ Creative 성공: {ad.ad_name[:50]}")
                return

            # 2순위: object_story_spec에서 추출
            spec = data.get("object_story_spec", {})

            # video_data.image_url
            video_data = spec.get("video_data", {})
            if video_data.get("image_url"):
                ad.image_url = video_data["image_url"]
                ad.image_source = "creative_video_data"
                print(f"✅ Creative 성공: {ad.ad_name[:50]}")
                return

            # link_data.picture
            link_data = spec.get("link_data", {})
            if link_data.get("picture"):
                ad.image_url = link_data["picture"]
                ad.image_source = "creative_link_data"
                print(f"✅ Creative 성공: {ad.ad_name[:50]}")
                return

            # 3순위: link_data.child_attachments에서 이미지 해시 (캐러셀)
            child_attachments = link_data.get("child_attachments", [])
            if child_attachments:
                for child in child_attachments:
                    img_hash = child.get("image_hash")
                    if img_hash:
                        img_url = self._get_image_url_from_hash(img_hash)
                        if img_url:
                            ad.image_url = img_url
                            ad.image_source = "carousel_hash"
                            print(f"✅ Creative 성공 (carousel): {ad.ad_name[:50]}")
                            return

            # 4순위: asset_feed_spec에서 이미지 해시 추출
            asset_feed = data.get("asset_feed_spec", {})
            images = asset_feed.get("images", [])
            if images:
                for img in images:
                    img_hash = img.get("hash")
                    if img_hash:
                        img_url = self._get_image_url_from_hash(img_hash)
                        if img_url:
                            ad.image_url = img_url
                            ad.image_source = "asset_feed_hash"
                            print(f"✅ Creative 성공 (hash): {ad.ad_name[:50]}")
                            return

            # 5순위: thumbnail_url 고해상도 (1200x1200 파라미터 적용됨)
            if data.get("thumbnail_url"):
                ad.image_url = data["thumbnail_url"]
                ad.image_source = "thumbnail_hires"
                print(f"✅ Creative 성공 (thumbnail): {ad.ad_name[:50]}")
                return

            # 6순위: Instagram 연동 광고 - effective_instagram_media_id로 media_url 조회
            ig_media_id = data.get("effective_instagram_media_id")
            if ig_media_id:
                ig_url = self._get_instagram_media_url(ig_media_id)
                if ig_url:
                    ad.image_url = ig_url
                    ad.image_source = "instagram_media"
                    print(f"✅ Creative 성공 (instagram): {ad.ad_name[:50]}")
                    return

            # 어떤 소스에서도 이미지를 찾지 못함
            print(f"⚠️ Creative API 이미지 없음: {ad.ad_name[:40]}")

        except requests.exceptions.Timeout:
            if retry_count < MAX_RETRIES:
                time.sleep((retry_count + 1) * 2)
                return self.fetch_creative_image(ad, retry_count + 1)
            print(f"⚠️ Creative API 타임아웃: {ad.ad_name[:40]}")
        except requests.exceptions.RequestException as e:
            if retry_count < MAX_RETRIES:
                time.sleep((retry_count + 1) * 2)
                return self.fetch_creative_image(ad, retry_count + 1)
            print(f"⚠️ Creative API 요청 오류: {ad.ad_name[:40]} - {str(e)[:50]}")

    def fetch_preview_image(self, ad: AdData) -> None:
        """Preview API iframe에서 이미지 가져오기 (최종 Fallback)"""
        if ad.image_url:  # 이미 이미지 있으면 스킵
            return

        if not ad.ad_id:
            return

        try:
            # Step 1: Preview API 호출
            preview_url = (
                f"{self.base_url}/{ad.ad_id}/previews"
                f"?ad_format=DESKTOP_FEED_STANDARD"
                f"&access_token={self.settings.access_token}"
            )

            response = requests.get(preview_url, timeout=30)
            if response.status_code != 200:
                return

            data = response.json()
            if "error" in data or not data.get("data"):
                return

            body = data["data"][0].get("body", "")
            if not body:
                return

            # Step 2: iframe src URL 추출
            iframe_match = re.search(r'<iframe[^>]+src=["\']?([^"\'>\s]+)["\']?', body)
            if not iframe_match:
                return

            iframe_src = iframe_match.group(1)
            # 이스케이프 문자 처리
            iframe_src = iframe_src.replace("\\/", "/").replace("&amp;", "&")

            # Step 3: iframe URL 콘텐츠 가져오기
            iframe_response = requests.get(iframe_src, timeout=30, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            })

            if iframe_response.status_code != 200:
                return

            content = iframe_response.text

            # Step 4: scontent 이미지 URL 추출
            # 일반 URL 패턴 매칭
            raw_urls = re.findall(r'https://scontent[^"\'\s<>]+', content)

            if not raw_urls:
                return

            # URL 필터링
            valid_urls = []
            for url in raw_urls:
                # HTML 엔티티 디코딩
                decoded = url.replace("&amp;", "&")

                # 저해상도/아이콘 제외
                if any(x in decoded for x in ["p64x64", "s64x64", "p32x32", "s32x32", "emoji", "icon"]):
                    continue

                # keyframe 형식 제외 (image/x.fb.keyframes - 브라우저에서 다운로드됨)
                if "/m1/v/t6/" in decoded:
                    continue

                valid_urls.append(decoded)

            if not valid_urls:
                return

            # 고유 URL만 추출하고 첫 번째 사용
            unique_urls = list(set(valid_urls))

            # URL 유효성 검증
            for url in unique_urls[:3]:  # 최대 3개까지 시도
                try:
                    test_resp = requests.head(url, timeout=10, allow_redirects=True)
                    if test_resp.status_code == 200:
                        ad.image_url = url
                        ad.image_source = "preview_iframe"
                        print(f"✅ Preview 성공: {ad.ad_name[:50]}")
                        return
                except:
                    continue

        except Exception as e:
            pass

    def fetch_preview_images_batch(self, ads: List[AdData]) -> None:
        """Preview API로 이미지 일괄 가져오기 (병렬 처리)"""
        ads_without_image = [ad for ad in ads if not ad.image_url and ad.ad_id]

        if not ads_without_image:
            return

        print(f"\n🔄 Preview API Fallback 시작 ({len(ads_without_image)}개)...")

        for i in range(0, len(ads_without_image), self.config.BATCH_SIZE):
            chunk = ads_without_image[i:i + self.config.BATCH_SIZE]
            print(f"📦 배치 처리 중: {i + 1} ~ {i + len(chunk)} / {len(ads_without_image)}")

            # 병렬 처리 (동시 요청 수 제한)
            with ThreadPoolExecutor(max_workers=5) as executor:
                futures = {executor.submit(self.fetch_preview_image, ad): ad for ad in chunk}
                for future in as_completed(futures):
                    try:
                        future.result()
                    except Exception as e:
                        pass

            # 배치 간 딜레이 (Rate limit 방지)
            if i + self.config.BATCH_SIZE < len(ads_without_image):
                time.sleep(self.config.API_DELAY * 2)

    def _get_image_url_from_hash(self, image_hash: str) -> Optional[str]:
        """이미지 해시로 URL 가져오기"""
        url = (
            f"{self.base_url}/{self.settings.account_id}/adimages"
            f"?hashes=[\"{image_hash}\"]&fields=url"
            f"&access_token={self.settings.access_token}"
        )

        try:
            response = requests.get(url, timeout=30)
            data = response.json()

            if data.get("data") and len(data["data"]) > 0:
                return data["data"][0].get("url")
        except:
            pass

        return None

    def _get_instagram_media_url(self, ig_media_id: str) -> Optional[str]:
        """Instagram Media ID로 이미지 URL 가져오기"""
        url = (
            f"{self.base_url}/{ig_media_id}"
            f"?fields=media_url,thumbnail_url"
            f"&access_token={self.settings.access_token}"
        )

        try:
            response = requests.get(url, timeout=30)
            data = response.json()

            if "error" not in data:
                # media_url 우선, 없으면 thumbnail_url
                return data.get("media_url") or data.get("thumbnail_url")
        except:
            pass

        return None

    def fetch_creative_images_batch(self, ads: List[AdData]) -> None:
        """Creative API로 이미지 일괄 가져오기 (병렬 처리)"""
        ads_without_image = [ad for ad in ads if not ad.image_url and ad.creative_id]

        if not ads_without_image:
            return

        print(f"\n🔄 Creative API Fallback 시작 ({len(ads_without_image)}개)...")

        for i in range(0, len(ads_without_image), self.config.BATCH_SIZE):
            chunk = ads_without_image[i:i + self.config.BATCH_SIZE]
            print(f"📦 배치 처리 중: {i + 1} ~ {i + len(chunk)} / {len(ads_without_image)}")

            # 병렬 처리 (동시 요청 수 5개로 제한 - rate limit 방지)
            with ThreadPoolExecutor(max_workers=5) as executor:
                futures = {executor.submit(self.fetch_creative_image, ad): ad for ad in chunk}
                for future in as_completed(futures):
                    try:
                        future.result()
                    except Exception as e:
                        ad = futures[future]
                        print(f"⚠️ 처리 실패: {ad.ad_name[:40]} - {str(e)[:50]}")

            # 배치 간 딜레이 (rate limit 방지)
            if i + self.config.BATCH_SIZE < len(ads_without_image):
                time.sleep(self.config.API_DELAY * 2)
    
    def collect(self) -> pd.DataFrame:
        """메인 수집 함수"""
        print("=" * 50)
        print("🚀 Meta 광고 이미지 수집 시작")
        print("=" * 50)
        
        # Step 1: 광고 목록 가져오기
        print("\n📋 Step 1: 광고 목록 조회...")
        ads = self.fetch_ad_list()
        print(f"✅ 광고 {len(ads)}개 조회됨")
        
        if not ads:
            print("⚠️ 조회된 광고가 없습니다.")
            return pd.DataFrame()
        
        # 현재 상태 확인
        ads_with_image = [ad for ad in ads if ad.image_url]
        print(f"   - 이미지 있는 광고: {len(ads_with_image)}개")
        print(f"   - 이미지 없는 광고: {len(ads) - len(ads_with_image)}개")
        
        # Step 2: Creative API로 보완
        print("\n📋 Step 2: Creative API Fallback...")
        self.fetch_creative_images_batch(ads)

        # 중간 결과 확인
        ads_with_image = [ad for ad in ads if ad.image_url]
        ads_without_image = [ad for ad in ads if not ad.image_url]
        print(f"   - 이미지 수집 성공: {len(ads_with_image)}개")
        print(f"   - 이미지 없는 광고: {len(ads_without_image)}개")

        # Step 3: Preview API로 최종 보완
        if ads_without_image:
            print("\n📋 Step 3: Preview API Fallback...")
            self.fetch_preview_images_batch(ads)

        # 최종 결과
        success_count = len([ad for ad in ads if ad.image_url])
        print(f"\n✅ 이미지 수집 완료: {success_count} / {len(ads)}개")
        
        # DataFrame 생성
        df = pd.DataFrame([
            {
                "ad_name": ad.ad_name,
                "ad_id": ad.ad_id,
                "preview_link": ad.preview_link,
                "image_url": ad.image_url,
                "image_source": ad.image_source
            }
            for ad in ads
        ])
        
        return df
    
    def save_to_csv(self, df: pd.DataFrame, filename: str = None) -> str:
        """결과를 CSV 파일로 저장"""
        filename = filename or self.config.OUTPUT_FILE

        # UTF-8 with BOM으로 저장 (Excel 호환)
        df.to_csv(filename, index=False, encoding="utf-8-sig")

        print(f"\n📁 파일 저장 완료: {filename}")
        return filename


# ========================================
# CLI 인터페이스
# ========================================

def get_user_input() -> Settings:
    """사용자 입력 받기"""
    print("\n" + "=" * 50)
    print("⚙️  Meta 광고 이미지 수집 설정")
    print("=" * 50)
    
    settings = Settings()
    
    # 광고계정 ID
    settings.account_id = input("\n📂 광고계정 ID (예: act_123456789): ").strip()
    if not settings.account_id:
        raise ValueError("광고계정 ID는 필수입니다.")
    
    # 액세스 토큰
    settings.access_token = input("🔑 액세스 토큰: ").strip()
    if not settings.access_token:
        raise ValueError("액세스 토큰은 필수입니다.")
    
    # 날짜 범위 (선택)
    start = input("📅 시작 날짜 (yyyy-mm-dd, Enter로 스킵): ").strip()
    if start:
        settings.start_date = start
    
    end = input("📅 종료 날짜 (yyyy-mm-dd, Enter로 스킵): ").strip()
    if end:
        settings.end_date = end
    
    return settings


def load_config_from_file() -> Optional[Settings]:
    """config_meta_image.json에서 설정 로드"""
    config_path = os.path.join(os.path.dirname(__file__), "..", "config_meta_image.json")

    if not os.path.exists(config_path):
        return None

    try:
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)

        meta = config.get("meta", {})
        if meta.get("account_id") and meta.get("access_token"):
            return Settings(
                account_id=meta["account_id"],
                access_token=meta["access_token"],
                start_date=meta.get("start_date") or None,
                end_date=meta.get("end_date") or None
            )
    except Exception as e:
        print(f"설정 파일 로드 오류: {e}")

    return None


def main():
    """메인 실행 함수"""
    try:
        # 1순위: config 파일에서 읽기
        settings = load_config_from_file()

        # 2순위: 환경변수에서 읽기
        if not settings:
            settings = Settings(
                account_id=os.environ.get("META_AD_ACCOUNT_ID", ""),
                access_token=os.environ.get("META_ACCESS_TOKEN", ""),
                start_date=os.environ.get("META_START_DATE"),
                end_date=os.environ.get("META_END_DATE")
            )

        # 3순위: 사용자 입력
        if not settings.account_id or not settings.access_token:
            settings = get_user_input()
        
        # 수집기 실행
        collector = MetaAdImageCollector(settings)
        df = collector.collect()
        
        if not df.empty:
            # CSV 저장
            collector.save_to_csv(df)
            
            # 요약 출력
            print("\n" + "=" * 50)
            print("📊 수집 결과 요약")
            print("=" * 50)
            print(f"총 광고 수: {len(df)}")
            print(f"이미지 수집 성공: {len(df[df['image_url'] != ''])}개")
            print(f"이미지 수집 실패: {len(df[df['image_url'] == ''])}개")
            
            # 소스별 통계
            print("\n📈 이미지 소스별 통계:")
            source_counts = df[df['image_source'] != '']['image_source'].value_counts()
            for source, count in source_counts.items():
                print(f"   - {source}: {count}개")
        
    except KeyboardInterrupt:
        print("\n\n❌ 사용자에 의해 중단됨")
    except Exception as e:
        print(f"\n❌ 오류 발생: {str(e)}")
        raise


# ========================================
# 프로그래매틱 사용 예시
# ========================================

def example_programmatic_usage():
    """프로그래매틱 사용 예시"""
    # 설정 생성
    settings = Settings(
        account_id="act_123456789",
        access_token="YOUR_ACCESS_TOKEN",
        start_date="2024-01-01",
        end_date="2024-12-31"
    )

    # 수집기 실행
    collector = MetaAdImageCollector(settings)
    df = collector.collect()

    # DataFrame으로 추가 분석 가능
    print(df.head())

    # CSV 저장
    collector.save_to_csv(df, "my_ads.csv")


if __name__ == "__main__":
    main()
