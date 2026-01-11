"""
Google Sheets 데이터 가져오기 스크립트

사용법:
    python scripts/fetch_google_sheets.py --client clientA

환경변수 (레거시 호환):
- GOOGLE_CREDENTIALS: Service Account JSON 전체 내용
- SHEET_ID: Google Sheets ID
- WORKSHEET_NAME: 워크시트 이름 (기본값: data_integration)
"""

import os
import sys
import json
import csv
from pathlib import Path

# 프로젝트 루트를 sys.path에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

import gspread
from oauth2client.service_account import ServiceAccountCredentials

from scripts.common.paths import ClientPaths, get_client_config, get_google_credentials_path, parse_client_arg, PROJECT_ROOT


def fetch_google_sheets_data(client_id: str = None):
    """Google Sheets에서 데이터 가져오기

    Args:
        client_id: 클라이언트 ID (None이면 환경변수 사용)
    """
    print("="*80)
    print("📊 Google Sheets 데이터 가져오기 시작")
    print("="*80)

    # 현재 작업 디렉토리 출력
    print(f"\n📂 작업 디렉토리: {os.getcwd()}")

    # 클라이언트 설정 로드
    if client_id:
        print(f"\n👤 클라이언트 모드: {client_id}")
        try:
            client_config = get_client_config(client_id)
            paths = ClientPaths(client_id).ensure_dirs()

            # clients.json에서 설정 가져오기
            sheets_config = client_config.get('sheets', {}).get('raw', {})
            sheet_id = sheets_config.get('sheetId') or os.environ.get('SHEET_ID')
            worksheet_name = sheets_config.get('worksheet') or os.environ.get('WORKSHEET_NAME', 'data_integration')
        except (FileNotFoundError, ValueError) as e:
            print(f"\n⚠️ 클라이언트 설정 로드 실패: {e}")
            print("   환경변수로 대체합니다.")
            paths = None
            sheet_id = os.environ.get('SHEET_ID')
            worksheet_name = os.environ.get('WORKSHEET_NAME', 'data_integration')
    else:
        print("\n📋 레거시 모드 (환경변수 사용)")
        paths = None
        sheet_id = os.environ.get('SHEET_ID')
        worksheet_name = os.environ.get('WORKSHEET_NAME', 'data_integration')

    # Credentials 로드 우선순위:
    # 1. clients.json의 google.credentials_path
    # 2. 환경변수 GOOGLE_CREDENTIALS
    # 3. config/google-credentials.json 파일
    credentials_json = None
    credentials_source = None

    # 1. clients.json에서 credentials 경로 확인
    cred_path = get_google_credentials_path()
    if cred_path and cred_path.exists():
        print(f"   📁 clients.json credentials 사용: {cred_path}")
        with open(cred_path, 'r', encoding='utf-8') as f:
            credentials_json = f.read()
        credentials_source = f"clients.json ({cred_path})"

    # 2. 환경변수에서 credentials 가져오기
    if not credentials_json:
        credentials_json = os.environ.get('GOOGLE_CREDENTIALS')
        if credentials_json:
            credentials_source = "환경변수 GOOGLE_CREDENTIALS"

    # 3. 기본 로컬 credentials 파일 사용
    if not credentials_json:
        credentials_file = PROJECT_ROOT / 'config' / 'google-credentials.json'
        if credentials_file.exists():
            print(f"   📁 기본 credentials 파일 사용: {credentials_file}")
            with open(credentials_file, 'r', encoding='utf-8') as f:
                credentials_json = f.read()
            credentials_source = f"config/google-credentials.json"

    print(f"\n🔍 설정 확인...")
    print(f"   ├ GOOGLE_CREDENTIALS: {'✅ ' + credentials_source if credentials_json else '❌ 없음'}")
    print(f"   ├ SHEET_ID: {sheet_id if sheet_id else '❌ 없음'}")
    print(f"   └ WORKSHEET_NAME: {worksheet_name}")

    if not credentials_json:
        print("\n❌ 오류: Google Credentials가 설정되지 않았습니다")
        print("   다음 중 하나를 설정하세요:")
        print("   1. config/clients.json의 google.credentials_path")
        print("   2. 환경변수 GOOGLE_CREDENTIALS")
        print("   3. config/google-credentials.json 파일")
        sys.exit(1)

    if not sheet_id:
        print("\n❌ 오류: SHEET_ID 환경변수가 설정되지 않았습니다")
        print("   Google Sheets ID를 GitHub Secrets에 추가하세요")
        sys.exit(1)

    try:
        # Service Account 인증
        print("\n🔐 Google 인증 중...")

        # JSON 파싱
        try:
            credentials_dict = json.loads(credentials_json)
            print(f"   ├ JSON 파싱 성공")
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

        try:
            spreadsheet = client.open_by_key(sheet_id)
            print(f"   ✅ Spreadsheet: '{spreadsheet.title}'")
        except gspread.exceptions.SpreadsheetNotFound:
            print(f"\n❌ 오류: Spreadsheet를 찾을 수 없습니다")
            print(f"   - Sheet ID가 올바른지 확인하세요: {sheet_id}")
            print(f"   - Service Account에 시트 공유 권한이 있는지 확인하세요")
            sys.exit(1)

        # Worksheet 열기
        print(f"\n📋 Worksheet 열기...")
        print(f"   └ Worksheet: '{worksheet_name}'")

        try:
            worksheet = spreadsheet.worksheet(worksheet_name)
            print(f"   ✅ Worksheet 열기 성공")
        except gspread.exceptions.WorksheetNotFound:
            print(f"\n❌ 오류: Worksheet를 찾을 수 없습니다: '{worksheet_name}'")
            print(f"   사용 가능한 워크시트:")
            for ws in spreadsheet.worksheets():
                print(f"   - {ws.title}")
            sys.exit(1)

        # 데이터 가져오기 (배치 방식으로 개선)
        print(f"\n📥 데이터 가져오는 중...")
        print(f"   ├ 메모리 효율적인 방식으로 가져오는 중...")

        # 먼저 데이터 크기 확인
        row_count = worksheet.row_count
        col_count = worksheet.col_count
        print(f"   ├ Worksheet 크기: {row_count} 행 x {col_count} 열")

        # 데이터 가져오기
        data = worksheet.get_all_values()

        if not data:
            print("\n❌ 오류: 워크시트가 비어있습니다")
            sys.exit(1)

        # 실제 데이터 행 수 (빈 행 제외)
        non_empty_rows = sum(1 for row in data if any(cell.strip() for cell in row))

        print(f"   ✅ 데이터 가져오기 완료!")
        print(f"   ├ 총 행 수: {len(data):,} (비어있지 않은 행: {non_empty_rows:,})")
        print(f"   ├ 총 컬럼 수: {len(data[0]) if data else 0}")

        if len(data) > 0:
            print(f"   └ 헤더: {', '.join(data[0][:5])}{'...' if len(data[0]) > 5 else ''}")

        # CSV로 저장 (csv 라이브러리 사용)
        # 클라이언트 모드: ClientPaths 사용, 레거시 모드: 기존 경로 사용
        if paths:
            output_file = paths.raw_data
            output_dir = paths.raw
        else:
            output_dir = Path(os.getcwd()) / 'data' / 'raw'
            output_dir.mkdir(parents=True, exist_ok=True)
            output_file = output_dir / 'raw_data.csv'

        output_file_abs = str(output_file.resolve())

        print(f"\n💾 CSV 파일 저장 중...")
        print(f"   ├ 저장 위치: {output_file_abs}")

        try:
            with open(output_file, 'w', encoding='utf-8', newline='') as f:
                writer = csv.writer(f)

                # 배치로 쓰기 (메모리 효율)
                batch_size = 1000
                for i in range(0, len(data), batch_size):
                    batch = data[i:i+batch_size]
                    writer.writerows(batch)

                    # 진행상황 표시 (데이터가 큰 경우)
                    if len(data) > 10000:
                        progress = min(100, (i + batch_size) * 100 // len(data))
                        print(f"   ├ 진행률: {progress}% ({i+batch_size:,}/{len(data):,})")

            # 파일이 실제로 생성되었는지 확인
            if not os.path.exists(output_file):
                print(f"\n❌ 오류: 파일 저장 실패 - 파일이 생성되지 않음")
                sys.exit(1)

            file_size = os.path.getsize(output_file)
            file_size_kb = file_size / 1024
            file_size_mb = file_size / (1024 * 1024)

            print(f"\n✅ CSV 파일 저장 완료!")
            print(f"   ├ 파일명: {output_file}")
            print(f"   ├ 절대경로: {output_file_abs}")
            if file_size_mb >= 1:
                print(f"   ├ 크기: {file_size_mb:.2f} MB ({file_size:,} bytes)")
            else:
                print(f"   ├ 크기: {file_size_kb:.1f} KB ({file_size:,} bytes)")
            print(f"   ├ 헤더: {', '.join(data[0][:5])}...")
            print(f"   └ 워크시트: '{worksheet_name}'")

            # 파일 크기 경고
            if file_size_mb > 50:
                print(f"\n⚠️  경고: 파일 크기가 큽니다 ({file_size_mb:.2f} MB)")
                print(f"   데이터 처리 시 시간이 오래 걸릴 수 있습니다")

        except IOError as e:
            print(f"\n❌ 파일 저장 오류: {e}")
            sys.exit(1)

        return output_file

    except gspread.exceptions.APIError as e:
        print(f"\n❌ Google Sheets API 오류: {e}")
        print("   - Service Account에 시트 접근 권한이 있는지 확인하세요")
        print("   - Google Sheets API가 활성화되어 있는지 확인하세요")
        sys.exit(1)
    except MemoryError:
        print(f"\n❌ 메모리 부족 오류")
        print("   - 데이터가 너무 큽니다")
        print("   - 데이터를 분할하거나 불필요한 열을 제거하세요")
        sys.exit(1)
    except KeyboardInterrupt:
        print(f"\n\n⚠️  사용자에 의해 중단되었습니다")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 예상치 못한 오류 발생: {e}")
        print(f"   오류 타입: {type(e).__name__}")
        import traceback
        print("\n상세 오류 정보:")
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    try:
        # --client 인자 파싱 (선택적)
        client_id = parse_client_arg(required=False)

        fetch_google_sheets_data(client_id)
        print("\n" + "="*80)
        print("✅ 데이터 가져오기 완료!")
        if client_id:
            print(f"   클라이언트: {client_id}")
        print("="*80)
        sys.exit(0)
    except SystemExit:
        raise
    except Exception as e:
        print(f"\n❌ 치명적 오류: {e}")
        sys.exit(1)
