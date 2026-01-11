"""
클라이언트 추가 헬퍼 스크립트

기존 clients.json에 새 클라이언트를 추가합니다.
test_1_fetch.bat에서 호출됩니다.

사용법:
    python scripts/add_client.py --id clientB --name "클라이언트B" \
        --raw-sheet-id "SHEET_ID" --raw-worksheet "data_integration" \
        --creative-sheet-id "SHEET_ID" --creative-worksheet "creative_data" \
        --creative-url-sheet-id "SHEET_ID" --creative-url-worksheet "creative_url" \
        --ga4-sheet-id "SHEET_ID" --ga4-worksheet "ga4_funnel" \
        --multi-sheets "SHEET_ID1:worksheet1,SHEET_ID2:worksheet2"
"""

import json
import argparse
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
CONFIG_FILE = PROJECT_ROOT / 'config' / 'clients.json'


def load_config():
    """기존 설정 로드"""
    if not CONFIG_FILE.exists():
        return None

    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_config(config):
    """설정 저장"""
    CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)


def parse_multi_sheets(multi_sheets_str):
    """멀티 시트 문자열 파싱: "ID1:name1,ID2:name2" -> [{"sheetId": ..., "worksheet": ...}]"""
    if not multi_sheets_str:
        return []

    result = []
    for item in multi_sheets_str.split(','):
        item = item.strip()
        if ':' in item:
            sheet_id, worksheet = item.split(':', 1)
            result.append({
                'sheetId': sheet_id.strip(),
                'worksheet': worksheet.strip()
            })

    return result


def client_exists(config, client_id):
    """클라이언트 ID 중복 확인"""
    if not config or 'clients' not in config:
        return False

    return any(c.get('id') == client_id for c in config.get('clients', []))


def add_client(args):
    """클라이언트 추가"""
    config = load_config()

    if config is None:
        print(f"[오류] {CONFIG_FILE} 파일이 존재하지 않습니다.")
        print("[안내] 먼저 '전체 설정 초기화'로 기본 설정을 생성하세요.")
        return 1

    # 중복 확인
    if client_exists(config, args.id):
        print(f"[오류] 클라이언트 ID '{args.id}'가 이미 존재합니다.")
        return 1

    # 새 클라이언트 생성
    new_client = {
        'id': args.id,
        'name': args.name,
        'subdomain': args.id,
        'sheets': {
            'raw': {
                'sheetId': args.raw_sheet_id,
                'worksheet': args.raw_worksheet or 'data_integration'
            },
            'multi': parse_multi_sheets(args.multi_sheets),
            'creative': {
                'sheetId': args.creative_sheet_id or args.raw_sheet_id,
                'worksheet': args.creative_worksheet or 'creative_data'
            },
            'creativeUrl': {
                'sheetId': args.creative_url_sheet_id or args.creative_sheet_id or args.raw_sheet_id,
                'worksheet': args.creative_url_worksheet or 'creative_url'
            },
            'ga4': {
                'sheetId': args.ga4_sheet_id or args.raw_sheet_id,
                'worksheet': args.ga4_worksheet or 'ga4_funnel'
            }
        },
        'active': True
    }

    # 클라이언트 추가
    config['clients'].append(new_client)

    # 저장
    save_config(config)

    print(f"[완료] 클라이언트 '{args.id}' 추가됨")
    print(f"  - 이름: {args.name}")
    print(f"  - Raw Sheet: {args.raw_sheet_id}")
    print(f"  - 총 클라이언트 수: {len(config['clients'])}개")

    return 0


def list_clients():
    """등록된 클라이언트 목록 출력"""
    config = load_config()

    if config is None:
        print("[안내] 등록된 클라이언트가 없습니다.")
        return

    clients = config.get('clients', [])
    print(f"\n등록된 클라이언트: {len(clients)}개")
    print("-" * 50)
    for c in clients:
        status = "활성" if c.get('active', True) else "비활성"
        print(f"  [{c.get('id')}] {c.get('name', 'N/A')} ({status})")
    print("-" * 50)


def main():
    parser = argparse.ArgumentParser(description='클라이언트 추가')
    parser.add_argument('--list', action='store_true', help='클라이언트 목록 출력')
    parser.add_argument('--id', default='', help='클라이언트 ID')
    parser.add_argument('--name', default='', help='클라이언트 이름')
    parser.add_argument('--raw-sheet-id', default='', help='Raw 데이터 Sheet ID')
    parser.add_argument('--raw-worksheet', default='data_integration', help='Raw 데이터 Worksheet')
    parser.add_argument('--multi-sheets', default='', help='Multi Sheets (ID1:name1,ID2:name2)')
    parser.add_argument('--creative-sheet-id', default='', help='Creative Sheet ID')
    parser.add_argument('--creative-worksheet', default='creative_data', help='Creative Worksheet')
    parser.add_argument('--creative-url-sheet-id', default='', help='Creative URL Sheet ID')
    parser.add_argument('--creative-url-worksheet', default='creative_url', help='Creative URL Worksheet')
    parser.add_argument('--ga4-sheet-id', default='', help='GA4 Sheet ID')
    parser.add_argument('--ga4-worksheet', default='ga4_funnel', help='GA4 Worksheet')

    args = parser.parse_args()

    if args.list:
        list_clients()
        return 0

    # 필수 인자 검증
    if not args.id:
        print("[오류] --id는 필수입니다.")
        return 1
    if not args.name:
        print("[오류] --name은 필수입니다.")
        return 1
    if not args.raw_sheet_id:
        print("[오류] --raw-sheet-id는 필수입니다.")
        return 1

    return add_client(args)


if __name__ == '__main__':
    sys.exit(main())
