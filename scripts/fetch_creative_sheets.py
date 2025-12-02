"""
Google Sheets 크리에이티브 데이터 가져오기 스크립트

환경변수:
- GOOGLE_CREDENTIALS: Service Account JSON 전체 내용
- SHEET_ID: Google Sheets ID
- WORKSHEET_NAME: 워크시트 이름 (기본값: Sheet1)

출력:
- data/creative/{YYYY-MM}.csv 형식으로 저장
"""

import os
import sys
import json
import csv
from datetime import datetime
import gspread
from oauth2client.service_account import ServiceAccountCredentials


def fetch_creative_sheets_data():
    """Google Sheets에서 크리에이티브 데이터 가져오기"""
    print("="*80)
    print("📊 Google Sheets Creative 데이터 가져오기 시작")
    print("="*80)

    # 환경변수 확인
    credentials_json = os.environ.get('GOOGLE_CREDENTIALS')
    sheet_id = os.environ.get('SHEET_ID')
    worksheet_name = os.environ.get('WORKSHEET_NAME', 'Sheet1')

    if not credentials_json:
        print("\n❌ 오류: GOOGLE_CREDENTIALS 환경변수가 설정되지 않았습니다")
        print("   Service Account JSON을 설정하세요")
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

        # data/creative 디렉토리 생성
        output_dir = os.path.join('data', 'creative')
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        # 고정 파일명 사용 (overwrite 방식)
        output_filename = "Creative_data.csv"
        output_path = os.path.join(output_dir, output_filename)

        # CSV로 저장
        with open(output_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(data)

        file_size = os.path.getsize(output_path) / 1024  # KB

        print(f"\n✅ CSV 파일 저장 완료!")
        print(f"   ├ 파일명: {output_path}")
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
    fetch_creative_sheets_data()
