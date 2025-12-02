"""
Google Sheets URL 데이터 다운로드 스크립트

환경변수:
- GOOGLE_CREDENTIALS: Service Account JSON 전체 내용
- SHEET_ID: Google Sheets ID
- WORKSHEET_NAME: 워크시트 이름 (기본값: Sheet1)

출력:
- data/creative/{worksheet_name}_url.csv 형식으로 저장
"""

import os
import sys
import json
import csv
import gspread
from oauth2client.service_account import ServiceAccountCredentials


def fetch_url_data():
    """Google Sheets에서 URL 데이터 가져오기"""
    print("="*80)
    print("Google Sheets URL Data Downloader")
    print("="*80)

    # 환경변수 확인
    credentials_json = os.environ.get('GOOGLE_CREDENTIALS')
    sheet_id = os.environ.get('SHEET_ID')
    worksheet_name = os.environ.get('WORKSHEET_NAME', 'Sheet1')

    if not credentials_json:
        print("\n[ERROR] GOOGLE_CREDENTIALS environment variable not set")
        print("        Please set Service Account JSON")
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

        # data/creative 디렉토리 생성
        output_dir = os.path.join('data', 'creative')
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        # 고정 파일명 사용 (overwrite 방식)
        output_filename = "Creative_url.csv"
        output_path = os.path.join(output_dir, output_filename)

        # CSV로 저장
        with open(output_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(data)

        file_size = os.path.getsize(output_path) / 1024  # KB

        print(f"\n" + "="*80)
        print(f"[SUCCESS] CSV file saved!")
        print(f"="*80)
        print(f"  File: {output_path}")
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
    fetch_url_data()
