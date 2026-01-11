"""
Google Sheets URL 데이터 다운로드 스크립트

환경변수:
- GOOGLE_CREDENTIALS: Service Account JSON 전체 내용
- SHEET_ID: Google Sheets ID (--client 사용 시 config에서 자동 로드)
- WORKSHEET_NAME: 워크시트 이름 (기본값: Sheet1)

사용법:
- 레거시: python fetch_creative_url.py
- 멀티클라이언트: python fetch_creative_url.py --client clientA
- 이미지 다운로드: python fetch_creative_url.py --download-images

출력:
- 레거시: data/creative/Creative_url.csv
- 멀티클라이언트: data/{client}/creative/Creative_url.csv
- 이미지: public/creative/images/
"""

import os
import sys
import json
import csv
import hashlib
import re
from pathlib import Path
from typing import Optional, Tuple

import requests
import gspread
from oauth2client.service_account import ServiceAccountCredentials

# 프로젝트 루트를 path에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.common.paths import ClientPaths, get_client_config, get_google_credentials_path, parse_client_arg, PROJECT_ROOT


# ========================================
# 이미지 다운로드 관련 함수
# ========================================

def get_image_filename(creative_name: str, url: str) -> str:
    """소재명과 URL로 고유한 파일명 생성"""
    # 소재명 정제 (파일명에 사용 불가능한 문자 및 제어 문자 제거)
    # 1. 제어 문자 제거 (0x00-0x1F, 0x7F)
    safe_name = re.sub(r'[\x00-\x1f\x7f]', '', creative_name)
    # 2. 파일명에 사용 불가능한 문자 제거
    safe_name = re.sub(r'[<>:"/\\|?*]', '_', safe_name)
    # 3. 앞뒤 공백 및 점 제거
    safe_name = safe_name.strip(' .')
    # 4. 최대 50자
    safe_name = safe_name[:50]
    # 5. 빈 이름 처리
    if not safe_name:
        safe_name = 'unnamed'

    # URL 해시로 고유성 보장
    url_hash = hashlib.md5(url.encode()).hexdigest()[:8]

    return f"{safe_name}_{url_hash}.jpg"


def is_downloadable_url(url: str) -> bool:
    """다운로드 대상 URL인지 확인 (Facebook/scontent)"""
    if not url:
        return False

    downloadable_patterns = [
        'facebook.com/ads/image',
        'scontent',
        'fbcdn.net',
    ]

    # Google Drive는 제외 (이미 작동함)
    if 'drive.google.com' in url:
        return False

    return any(pattern in url for pattern in downloadable_patterns)


def download_image(url: str, save_path: Path, timeout: int = 30) -> Tuple[bool, str]:
    """이미지 다운로드"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

        response = requests.get(url, headers=headers, timeout=timeout, stream=True)
        response.raise_for_status()

        # Content-Type 확인
        content_type = response.headers.get('Content-Type', '')
        if not content_type.startswith('image/'):
            return False, f"Not an image: {content_type}"

        # 파일 저장
        save_path.parent.mkdir(parents=True, exist_ok=True)
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        return True, "OK"

    except requests.exceptions.Timeout:
        return False, "Timeout"
    except requests.exceptions.RequestException as e:
        return False, str(e)[:50]


def download_creative_images(csv_path: Path, images_dir: Path) -> dict:
    """CSV에서 URL 읽어서 이미지 다운로드, 로컬 경로 매핑 반환"""
    print(f"\n[IMAGE DOWNLOAD] Starting...")
    print(f"  CSV: {csv_path}")
    print(f"  Images Dir: {images_dir}")

    # CSV 읽기
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    if not rows:
        print("  [WARN] No data in CSV")
        return {}

    # 헤더 확인
    headers = rows[0].keys()
    url_col = 'url' if 'url' in headers else None
    name_col = '광고,에셋이름' if '광고,에셋이름' in headers else '광고'

    if not url_col:
        print("  [WARN] 'url' column not found")
        return {}

    # 이미지 다운로드
    local_path_map = {}
    download_count = 0
    skip_count = 0
    fail_count = 0

    total = len(rows)
    print(f"  Total rows: {total}")

    for i, row in enumerate(rows, 1):
        url = row.get(url_col, '')
        creative_name = row.get(name_col, f'creative_{i}')

        if not is_downloadable_url(url):
            skip_count += 1
            continue

        # 파일명 생성
        filename = get_image_filename(creative_name, url)
        save_path = images_dir / filename

        # 이미 존재하면 스킵 (캐싱)
        if save_path.exists():
            local_path_map[creative_name] = f"/creative/images/{filename}"
            skip_count += 1
            continue

        # 다운로드
        success, msg = download_image(url, save_path)

        if success:
            local_path_map[creative_name] = f"/creative/images/{filename}"
            download_count += 1
            if download_count % 10 == 0:
                print(f"  Progress: {download_count} downloaded...")
        else:
            fail_count += 1
            if fail_count <= 5:
                print(f"  [FAIL] {creative_name[:30]}: {msg}")

    print(f"\n  [DONE] Downloaded: {download_count}, Skipped: {skip_count}, Failed: {fail_count}")

    return local_path_map


def update_csv_with_local_paths(csv_path: Path, local_path_map: dict):
    """CSV에 로컬 이미지 경로 컬럼 추가"""
    if not local_path_map:
        print("  [SKIP] No local paths to update")
        return

    # CSV 읽기
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames or []

    # 로컬 경로 컬럼 추가
    if 'local_image_path' not in fieldnames:
        fieldnames = list(fieldnames) + ['local_image_path']

    name_col = '광고,에셋이름' if '광고,에셋이름' in fieldnames else '광고'

    # 로컬 경로 매핑
    for row in rows:
        creative_name = row.get(name_col, '')
        if creative_name in local_path_map:
            row['local_image_path'] = local_path_map[creative_name]
        else:
            row['local_image_path'] = ''

    # CSV 저장
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"  [OK] CSV updated with local_image_path column")


def fetch_url_data(client_id: Optional[str] = None, download_images: bool = False):
    """Google Sheets에서 URL 데이터 가져오기"""
    print("="*80)
    print("Google Sheets URL Data Downloader")
    if client_id:
        print(f"   Client: {client_id}")
    print("="*80)

    # 클라이언트 모드: config에서 설정 로드
    paths = None
    if client_id:
        paths = ClientPaths(client_id).ensure_dirs()
        try:
            config = get_client_config(client_id)
            sheets_config = config.get('sheets', {}).get('creativeUrl', {})
        except (FileNotFoundError, ValueError) as e:
            print(f"\n[WARN] Failed to load client config: {e}")
            print("       Using environment variables.")
            sheets_config = {}
    else:
        sheets_config = {}

    # Sheet 설정 (클라이언트 설정 > 환경변수)
    sheet_id = sheets_config.get('sheetId') or os.environ.get('SHEET_ID')
    worksheet_name = sheets_config.get('worksheet') or os.environ.get('WORKSHEET_NAME', 'Sheet1')

    # Credentials 로드 우선순위:
    # 1. clients.json의 google.credentials_path
    # 2. 환경변수 GOOGLE_CREDENTIALS
    credentials_json = None
    credentials_source = None

    cred_path = get_google_credentials_path()
    if cred_path and cred_path.exists():
        with open(cred_path, 'r', encoding='utf-8') as f:
            credentials_json = f.read()
        credentials_source = f"clients.json ({cred_path})"

    if not credentials_json:
        credentials_json = os.environ.get('GOOGLE_CREDENTIALS')
        if credentials_json:
            credentials_source = "ENV GOOGLE_CREDENTIALS"

    print(f"\n[CONFIG]")
    print(f"   GOOGLE_CREDENTIALS: {'OK - ' + credentials_source if credentials_json else 'NOT SET'}")
    print(f"   SHEET_ID: {sheet_id if sheet_id else 'NOT SET'}")
    print(f"   WORKSHEET_NAME: {worksheet_name}")

    if not credentials_json:
        print("\n[ERROR] Google Credentials not configured")
        print("        Set one of the following:")
        print("        1. config/clients.json google.credentials_path")
        print("        2. ENV GOOGLE_CREDENTIALS")
        sys.exit(1)

    if not sheet_id:
        print("\n[ERROR] SHEET_ID environment variable not set")
        print("        Please set Google Sheets ID")
        sys.exit(1)

    try:
        # Service Account 인증
        print("\n[1/4] Authenticating with Google...")

        # JSON 파싱
        try:
            credentials_dict = json.loads(credentials_json)
        except json.JSONDecodeError as e:
            print(f"\n[ERROR] Failed to parse GOOGLE_CREDENTIALS JSON")
            print(f"        {e}")
            sys.exit(1)

        # 인증 scope
        scope = [
            'https://spreadsheets.google.com/feeds',
            'https://www.googleapis.com/auth/drive'
        ]

        credentials = ServiceAccountCredentials.from_json_keyfile_dict(
            credentials_dict,
            scope
        )

        client = gspread.authorize(credentials)

        print(f"      [OK] Authentication successful")
        print(f"          Service Account: {credentials_dict.get('client_email', 'N/A')}")

        # Spreadsheet 열기
        print(f"\n[2/4] Opening Spreadsheet...")
        print(f"      Sheet ID: {sheet_id}")

        spreadsheet = client.open_by_key(sheet_id)

        print(f"      [OK] Spreadsheet: '{spreadsheet.title}'")

        # Worksheet 열기
        print(f"\n[3/4] Opening Worksheet...")
        print(f"      Worksheet: '{worksheet_name}'")

        worksheet = spreadsheet.worksheet(worksheet_name)

        # 데이터 가져오기
        print(f"\n[4/4] Fetching data...")

        data = worksheet.get_all_values()

        if not data:
            print("\n[ERROR] Worksheet is empty")
            sys.exit(1)

        print(f"      [OK] Data fetched successfully!")
        print(f"          Total rows: {len(data):,}")
        print(f"          Total columns: {len(data[0]) if data else 0}")

        if len(data) > 0:
            headers = ', '.join(data[0][:3])
            if len(data[0]) > 3:
                headers += '...'
            print(f"          Headers: {headers}")

        # 출력 경로 설정 (클라이언트 모드 vs 레거시 모드)
        if paths:
            output_path = paths.creative_url
            output_path.parent.mkdir(parents=True, exist_ok=True)
        else:
            output_dir = os.path.join('data', 'creative')
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)
            output_path = os.path.join(output_dir, "Creative_url.csv")

        # CSV로 저장
        output_path_str = str(output_path)
        with open(output_path_str, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(data)

        file_size = os.path.getsize(output_path_str) / 1024  # KB

        print(f"\n" + "="*80)
        print(f"[SUCCESS] CSV file saved!")
        print(f"="*80)
        print(f"  File: {output_path_str}")
        print(f"  Size: {file_size:.1f} KB")
        print(f"  Rows: {len(data):,}")
        print(f"  Worksheet: '{worksheet_name}'")
        print(f"="*80)

        # 이미지 다운로드 옵션
        if download_images:
            images_dir = PROJECT_ROOT / 'public' / 'creative' / 'images'
            csv_path = Path(output_path_str)

            local_path_map = download_creative_images(csv_path, images_dir)
            update_csv_with_local_paths(csv_path, local_path_map)

            # public/creative/에도 복사 (Next.js 서빙용)
            public_csv_path = PROJECT_ROOT / 'public' / 'creative' / 'Creative_url.csv'
            if csv_path != public_csv_path:
                import shutil
                public_csv_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy(csv_path, public_csv_path)
                print(f"  [OK] Copied to {public_csv_path}")

        return output_path

    except gspread.exceptions.APIError as e:
        print(f"\n[ERROR] Google Sheets API Error: {e}")
        print("        - Check if Service Account has access to the sheet")
        print("        - Check if Google Sheets API is enabled")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    client_id = parse_client_arg(required=False)
    download_images = '--download-images' in sys.argv or '-d' in sys.argv
    fetch_url_data(client_id, download_images=download_images)
