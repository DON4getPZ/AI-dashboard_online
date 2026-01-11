"""
Google Sheets URL 데이터 다운로드 스크립트

환경변수:
- GOOGLE_CREDENTIALS: Service Account JSON 전체 내용
- SHEET_ID: Google Sheets ID (--client 사용 시 config에서 자동 로드)
- WORKSHEET_NAME: 워크시트 이름 (기본값: Sheet1)

사용법:
- 레거시: python fetch_creative_url.py
- 멀티클라이언트: python fetch_creative_url.py --client clientA

출력:
- 레거시: data/creative/Creative_url.csv
- 멀티클라이언트: data/{client}/creative/Creative_url.csv
"""

import os
import sys
import json
import csv
from pathlib import Path
from typing import Optional

import gspread
from oauth2client.service_account import ServiceAccountCredentials

# 프로젝트 루트를 path에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.common.paths import ClientPaths, get_client_config, get_google_credentials_path, parse_client_arg, PROJECT_ROOT


def fetch_url_data(client_id: Optional[str] = None):
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
    fetch_url_data(client_id)
