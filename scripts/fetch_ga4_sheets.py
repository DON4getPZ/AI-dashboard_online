"""
Google Sheets GA4 데이터 가져오기 스크립트

환경변수:
- GOOGLE_CREDENTIALS: Service Account JSON 전체 내용
- SHEET_ID: Google Sheets ID (--client 사용 시 config에서 자동 로드)
- WORKSHEET_NAME: 워크시트 이름 (기본값: Sheet1)

사용법:
- 레거시: python fetch_ga4_sheets.py
- 멀티클라이언트: python fetch_ga4_sheets.py --client clientA

출력:
- 레거시: data/GA4/GA4_data.csv
- 멀티클라이언트: data/{client}/GA4/GA4_data.csv
"""

import os
import sys
import json
import csv
from datetime import datetime
from pathlib import Path
from typing import Optional

import gspread
from oauth2client.service_account import ServiceAccountCredentials

# 프로젝트 루트를 path에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.common.paths import ClientPaths, get_client_config, get_google_credentials_path, parse_client_arg, PROJECT_ROOT


def fetch_ga4_sheets_data(client_id: Optional[str] = None):
    """Google Sheets에서 GA4 데이터 가져오기"""
    print("="*80)
    print("📊 Google Sheets GA4 데이터 가져오기 시작")
    if client_id:
        print(f"   클라이언트: {client_id}")
    print("="*80)

    # 클라이언트 모드: config에서 설정 로드
    paths = None
    if client_id:
        paths = ClientPaths(client_id).ensure_dirs()
        try:
            config = get_client_config(client_id)
            sheets_config = config.get('sheets', {}).get('ga4', {})
        except (FileNotFoundError, ValueError) as e:
            print(f"\n⚠️ 클라이언트 설정 로드 실패: {e}")
            print("   환경변수에서 설정을 읽습니다.")
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
            credentials_source = "환경변수 GOOGLE_CREDENTIALS"

    print(f"\n🔍 설정 확인...")
    print(f"   ├ GOOGLE_CREDENTIALS: {'✅ ' + credentials_source if credentials_json else '❌ 없음'}")
    print(f"   ├ SHEET_ID: {sheet_id if sheet_id else '❌ 없음'}")
    print(f"   └ WORKSHEET_NAME: {worksheet_name}")

    if not credentials_json:
        print("\n❌ 오류: Google Credentials가 설정되지 않았습니다")
        print("   다음 중 하나를 설정하세요:")
        print("   1. config/clients.json의 google.credentials_path")
        print("   2. 환경변수 GOOGLE_CREDENTIALS")
        sys.exit(1)

    if not sheet_id:
        print("\n❌ 오류: SHEET_ID 환경변수가 설정되지 않았습니다")
        print("   Google Sheets ID를 설정하세요")
        sys.exit(1)

    try:
        # Service Account 인증
        print("\n🔐 Google 인증 중...")

        # JSON 파싱
        try:
            credentials_dict = json.loads(credentials_json)
        except json.JSONDecodeError as e:
            print(f"\n❌ 오류: GOOGLE_CREDENTIALS JSON 파싱 실패")
            print(f"   {e}")
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

        print(f"   ✅ 인증 성공")
        print(f"   └ Service Account: {credentials_dict.get('client_email', 'N/A')}")

        # Spreadsheet 열기
        print(f"\n📄 Spreadsheet 열기...")
        print(f"   └ Sheet ID: {sheet_id}")

        spreadsheet = client.open_by_key(sheet_id)

        print(f"   ✅ Spreadsheet: '{spreadsheet.title}'")

        # Worksheet 열기
        print(f"\n📋 Worksheet 열기...")
        print(f"   └ Worksheet: '{worksheet_name}'")

        worksheet = spreadsheet.worksheet(worksheet_name)

        # 데이터 가져오기
        print(f"\n📥 데이터 가져오는 중...")

        data = worksheet.get_all_values()

        if not data:
            print("\n❌ 오류: 워크시트가 비어있습니다")
            sys.exit(1)

        print(f"   ✅ 데이터 가져오기 완료!")
        print(f"   ├ 총 행 수: {len(data):,}")
        print(f"   ├ 총 컬럼 수: {len(data[0]) if data else 0}")

        if len(data) > 0:
            print(f"   └ 헤더: {', '.join(data[0][:5])}{'...' if len(data[0]) > 5 else ''}")

        # 출력 경로 설정 (클라이언트 모드 vs 레거시 모드)
        if paths:
            output_path = paths.ga4_data
            output_path.parent.mkdir(parents=True, exist_ok=True)
        else:
            output_dir = os.path.join('data', 'GA4')
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)
            output_path = os.path.join(output_dir, "GA4_data.csv")

        # CSV로 저장
        output_path_str = str(output_path)
        with open(output_path_str, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(data)

        file_size = os.path.getsize(output_path_str) / 1024  # KB

        print(f"\n✅ CSV 파일 저장 완료!")
        print(f"   ├ 파일명: {output_path_str}")
        print(f"   ├ 크기: {file_size:.1f} KB")
        if len(data) > 0:
            print(f"   ├ 헤더: {', '.join(data[0][:5])}{'...' if len(data[0]) > 5 else ''}")
        print(f"   └ 워크시트: '{worksheet_name}'")

        return output_path

    except gspread.exceptions.APIError as e:
        print(f"\n❌ Google Sheets API 오류: {e}")
        print("   - Service Account에 시트 접근 권한이 있는지 확인하세요")
        print("   - Google Sheets API가 활성화되어 있는지 확인하세요")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    client_id = parse_client_arg(required=False)
    fetch_ga4_sheets_data(client_id)
