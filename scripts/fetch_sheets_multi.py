"""
여러 개의 Google Sheets 데이터 가져오기 및 통합 스크립트

설명:
- config_multi.json에서 여러 개의 sheet ID를 읽어옴
- 각 시트에서 동일한 worksheet의 데이터를 가져옴
- 모든 데이터를 하나의 CSV 파일로 통합 (헤더 중복 제거)

입력:
- config_multi.json 파일 필요

출력:
- data/type/{각 시트별}.csv
- data/type/merged_data.csv (통합 파일)
"""

import os
import sys
import json
import csv
from datetime import datetime
from pathlib import Path
import gspread
from oauth2client.service_account import ServiceAccountCredentials

# 경로 설정 (동적 경로 - 스크립트 위치 기준)
BASE_DIR = Path(__file__).parent.parent


def load_config():
    """config_multi.json 파일 로드"""
    config_path = BASE_DIR / 'config_multi.json'

    if not config_path.exists():
        print(f"\n❌ 오류: {config_path} 파일을 찾을 수 없습니다")
        sys.exit(1)

    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        return config
    except json.JSONDecodeError as e:
        print(f"\n❌ 오류: {config_path} JSON 파싱 실패")
        print(f"   {e}")
        sys.exit(1)


def authenticate_google(credentials_path):
    """Google Service Account 인증"""
    print("\n🔐 Google 인증 중...")

    if not os.path.exists(credentials_path):
        print(f"\n❌ 오류: 인증 파일을 찾을 수 없습니다: {credentials_path}")
        sys.exit(1)

    try:
        # 인증 scope
        scope = [
            'https://spreadsheets.google.com/feeds',
            'https://www.googleapis.com/auth/drive'
        ]

        credentials = ServiceAccountCredentials.from_json_keyfile_name(
            credentials_path,
            scope
        )

        client = gspread.authorize(credentials)

        # Service Account 이메일 읽기
        with open(credentials_path, 'r', encoding='utf-8') as f:
            cred_dict = json.load(f)
            service_email = cred_dict.get('client_email', 'N/A')

        print(f"   ✅ 인증 성공")
        print(f"   └ Service Account: {service_email}")

        return client

    except Exception as e:
        print(f"\n❌ 인증 실패: {e}")
        sys.exit(1)


def fetch_sheet_data(client, sheet_id, worksheet_name, sheet_index):
    """단일 시트에서 데이터 가져오기"""
    try:
        print(f"\n📄 [{sheet_index}] Spreadsheet 열기...")
        print(f"   └ Sheet ID: {sheet_id}")

        spreadsheet = client.open_by_key(sheet_id)
        print(f"   ✅ Spreadsheet: '{spreadsheet.title}'")

        print(f"\n📋 [{sheet_index}] Worksheet 열기...")
        print(f"   └ Worksheet: '{worksheet_name}'")

        worksheet = spreadsheet.worksheet(worksheet_name)

        print(f"\n📥 [{sheet_index}] 데이터 가져오는 중...")

        data = worksheet.get_all_values()

        if not data:
            print(f"\n⚠️  경고: [{sheet_index}] 워크시트가 비어있습니다")
            return None

        print(f"   ✅ 데이터 가져오기 완료!")
        print(f"   ├ 총 행 수: {len(data):,}")
        print(f"   ├ 총 컬럼 수: {len(data[0]) if data else 0}")

        if len(data) > 0:
            print(f"   └ 헤더: {', '.join(data[0][:5])}{'...' if len(data[0]) > 5 else ''}")

        return data

    except gspread.exceptions.WorksheetNotFound:
        print(f"\n❌ 오류: [{sheet_index}] 워크시트 '{worksheet_name}'를 찾을 수 없습니다")
        return None
    except gspread.exceptions.APIError as e:
        print(f"\n❌ Google Sheets API 오류 [{sheet_index}]: {e}")
        print("   - Service Account에 시트 접근 권한이 있는지 확인하세요")
        return None
    except Exception as e:
        print(f"\n❌ 오류 발생 [{sheet_index}]: {e}")
        return None


def save_individual_csv(data, output_dir, sheet_info, sheet_index):
    """개별 시트 데이터를 CSV로 저장"""
    if not data:
        return None

    # 파일명 생성 (순서 기반 고정 파일명 - overwrite 방식)
    output_filename = f"multi_{sheet_index}.csv"
    output_path = os.path.join(output_dir, output_filename)

    # CSV로 저장
    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(data)

    file_size = os.path.getsize(output_path) / 1024  # KB

    print(f"\n💾 [{sheet_index}] 개별 CSV 파일 저장 완료!")
    print(f"   ├ 파일명: {output_path}")
    print(f"   └ 크기: {file_size:.1f} KB")

    return output_path


def merge_csv_files(all_data_list, output_dir, merged_filename):
    """여러 CSV 데이터를 하나로 통합 (헤더 중복 제거)"""
    if not all_data_list:
        print("\n❌ 오류: 통합할 데이터가 없습니다")
        return None

    print(f"\n🔗 CSV 파일 통합 중...")
    print(f"   └ 총 {len(all_data_list)}개의 시트 데이터를 통합합니다")

    # 헤더 추출 (첫 번째 데이터의 헤더 사용)
    header = all_data_list[0][0] if all_data_list[0] else []

    # 통합 데이터 생성
    merged_data = [header]  # 헤더 한 번만 추가

    total_rows = 0
    for idx, data in enumerate(all_data_list, 1):
        if not data:
            continue

        # 첫 번째 시트는 헤더 포함, 나머지는 헤더 제외
        if idx == 1:
            merged_data.extend(data[1:])  # 헤더 제외하고 데이터만 추가
            total_rows += len(data) - 1
        else:
            merged_data.extend(data[1:])  # 헤더 제외하고 데이터만 추가
            total_rows += len(data) - 1

        print(f"   ├ [{idx}] {len(data) - 1:,}개 행 추가")

    # 통합 파일 저장
    output_path = os.path.join(output_dir, merged_filename)

    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(merged_data)

    file_size = os.path.getsize(output_path) / 1024  # KB

    print(f"\n✅ 통합 CSV 파일 저장 완료!")
    print(f"   ├ 파일명: {output_path}")
    print(f"   ├ 크기: {file_size:.1f} KB")
    print(f"   ├ 총 행 수: {len(merged_data):,} (헤더 포함)")
    print(f"   ├ 데이터 행 수: {total_rows:,}")
    print(f"   └ 헤더: {', '.join(header[:5])}{'...' if len(header) > 5 else ''}")

    return output_path


def main():
    """메인 실행 함수"""
    print("="*80)
    print("📊 여러 개의 Google Sheets 데이터 가져오기 및 통합")
    print("="*80)

    # 1. Config 파일 로드
    print("\n[단계 1/5] Config 파일 로드 중...")
    config = load_config()

    credentials_path = config['google']['credentials_path']
    sheets = config['google']['sheets']
    output_dir = config['google']['output']['directory']
    merged_filename = config['google']['output']['merged_filename']

    print(f"   ✅ Config 로드 완료")
    print(f"   ├ 인증 파일: {credentials_path}")
    print(f"   ├ 시트 개수: {len(sheets)}")
    print(f"   └ 출력 디렉토리: {output_dir}")

    # 2. 출력 디렉토리 생성
    print("\n[단계 2/5] 출력 디렉토리 생성 중...")
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"   ✅ 디렉토리 생성: {output_dir}")
    else:
        print(f"   ✅ 디렉토리 존재: {output_dir}")

    # 3. Google 인증
    print("\n[단계 3/5] Google 인증")
    client = authenticate_google(credentials_path)

    # 4. 각 시트에서 데이터 가져오기
    print("\n[단계 4/5] 데이터 가져오기")
    print("="*80)

    all_data_list = []
    successful_sheets = 0

    for idx, sheet_info in enumerate(sheets, 1):
        sheet_id = sheet_info['sheet_id']
        worksheet_name = sheet_info['worksheet_name']
        description = sheet_info.get('description', '')

        print(f"\n{'='*80}")
        print(f"시트 [{idx}/{len(sheets)}]: {description}")
        print(f"{'='*80}")

        # 데이터 가져오기
        data = fetch_sheet_data(client, sheet_id, worksheet_name, idx)

        if data:
            # 개별 CSV 저장
            save_individual_csv(data, output_dir, sheet_info, idx)
            all_data_list.append(data)
            successful_sheets += 1
        else:
            print(f"\n⚠️  경고: [{idx}] 시트 데이터를 가져오지 못했습니다")

    print(f"\n{'='*80}")
    print(f"✅ 데이터 가져오기 완료: {successful_sheets}/{len(sheets)} 성공")
    print(f"{'='*80}")

    # 5. CSV 파일 통합
    print("\n[단계 5/5] CSV 파일 통합")
    print("="*80)

    if all_data_list:
        merged_path = merge_csv_files(all_data_list, output_dir, merged_filename)

        if merged_path:
            print("\n" + "="*80)
            print("🎉 모든 작업 완료!")
            print("="*80)
            print(f"\n📁 저장된 파일:")
            print(f"   ├ 개별 파일: {successful_sheets}개")
            print(f"   └ 통합 파일: {merged_path}")
            print()
        else:
            print("\n❌ 통합 파일 생성 실패")
            sys.exit(1)
    else:
        print("\n❌ 가져온 데이터가 없어 통합할 수 없습니다")
        sys.exit(1)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  사용자에 의해 중단되었습니다")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 예상치 못한 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
