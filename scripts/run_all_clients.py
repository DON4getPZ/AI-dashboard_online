"""
전체 클라이언트 ETL 파이프라인 실행

test_1_fetch.bat, test_2_mapping.bat, test_3_analysis.bat에서 검증된
스크립트 목록과 실행 순서를 기반으로 구현.

사용법:
    python scripts/run_all_clients.py                    # 모든 active 클라이언트
    python scripts/run_all_clients.py --client clientA   # 특정 클라이언트만
    python scripts/run_all_clients.py --stage fetch      # 특정 단계만
    python scripts/run_all_clients.py --dry-run          # 실행 없이 계획만 출력
    python scripts/run_all_clients.py --with-images      # 소재 이미지 다운로드 포함
"""

import json
import subprocess
import sys
import time
import argparse
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any

# 프로젝트 루트
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
CONFIG_FILE = PROJECT_ROOT / 'config' / 'clients.json'

# ============================================================
# 스크립트 목록 (test_*.bat에서 검증된 순서)
# ============================================================

# test_1_fetch.bat (5개)
FETCH_SCRIPTS = [
    ('fetch_google_sheets.py', '광고 성과 원본 데이터'),
    ('fetch_sheets_multi.py', '다중 시트 (채널별 분석)'),
    ('fetch_creative_sheets.py', '크리에이티브 성과 데이터'),
    ('fetch_creative_url.py', '크리에이티브 이미지 URL'),
    ('fetch_ga4_sheets.py', 'GA4 퍼널 데이터'),
]

# test_2_mapping.bat (1개)
MAPPING_SCRIPTS = [
    ('process_marketing_data.py', '마케팅 원본 데이터 가공'),
]

# test_3_analysis.bat (13개)
ANALYSIS_SCRIPTS = [
    ('run_multi_analysis.py', '통합 분석 (유형별/일별)'),
    ('multi_analysis_dimension_detail.py', '차원별 세부 분석'),
    ('multi_analysis_prophet_forecast.py', 'Prophet 예측 분석'),
    ('generate_type_insights.py', '유형별 인사이트 생성'),
    ('segment_processor.py', '세그먼트 분석'),
    ('insight_generator.py', '인사이트 생성'),
    ('visualization_generator.py', '시각화 데이터 생성'),
    ('generate_funnel_data.py', '퍼널 데이터 생성'),
    ('generate_engagement_data.py', '참여도 데이터 생성'),
    ('generate_funnel_data_multiperiod.py', '멀티기간 퍼널 데이터'),
    ('generate_insights_multiperiod.py', '멀티기간 인사이트'),
    ('generate_type_insights_multiperiod.py', '멀티기간 유형별 인사이트'),
    ('export_json.py', 'CSV to JSON 변환'),
]

# 전체 스크립트 (19개)
ALL_SCRIPTS = FETCH_SCRIPTS + MAPPING_SCRIPTS + ANALYSIS_SCRIPTS

# 단계별 매핑
STAGES = {
    'fetch': FETCH_SCRIPTS,
    'mapping': MAPPING_SCRIPTS,
    'analysis': ANALYSIS_SCRIPTS,
    'all': ALL_SCRIPTS,
}


def load_clients(config_path: Path) -> List[Dict[str, Any]]:
    """clients.json에서 active 클라이언트 목록 로드"""
    if not config_path.exists():
        print(f"[오류] 설정 파일이 존재하지 않습니다: {config_path}")
        print("[안내] test_1_fetch.bat을 먼저 실행하여 설정을 생성하세요.")
        sys.exit(1)

    with open(config_path, 'r', encoding='utf-8') as f:
        config = json.load(f)

    clients = config.get('clients', [])
    # active 클라이언트만 필터링 (active 키가 없으면 기본 True)
    active_clients = [c for c in clients if c.get('active', True)]

    return active_clients


def run_script(script_name: str, client_id: Optional[str],
               index: int, total: int, description: str,
               dry_run: bool = False, with_images: bool = False) -> bool:
    """
    단일 스크립트 실행

    Returns:
        bool: 성공 여부
    """
    script_path = SCRIPT_DIR / script_name

    # 명령어 구성
    cmd = [sys.executable, str(script_path)]
    if client_id:
        cmd.extend(['--client', client_id])

    # fetch_creative_url.py 실행 시 이미지 다운로드 옵션 추가
    if script_name == 'fetch_creative_url.py' and with_images:
        cmd.extend(['--download-images'])

    # 진행 표시 (test_*.bat 패턴)
    client_display = f"[{client_id}]" if client_id else "[레거시]"
    print(f"\n[{index}/{total}] {script_name} ({description})")
    print(f"  {client_display} python scripts/{script_name}" +
          (f" --client {client_id}" if client_id else ""))

    if dry_run:
        print("  [DRY-RUN] 실행 건너뜀")
        return True

    # 스크립트 실행
    start_time = time.time()
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            cwd=PROJECT_ROOT
        )
        elapsed = time.time() - start_time

        if result.returncode != 0:
            print(f"  [경고] {script_name} 실패 (exit code: {result.returncode}) - 계속 진행")
            if result.stderr:
                # 에러 메시지 첫 3줄만 출력
                error_lines = result.stderr.strip().split('\n')[:3]
                for line in error_lines:
                    print(f"    {line}")
            return False
        else:
            print(f"  [완료] {elapsed:.1f}초")
            return True

    except Exception as e:
        print(f"  [오류] 실행 중 예외 발생: {e}")
        return False


def run_client_pipeline(client_id: Optional[str],
                        scripts: List[tuple],
                        dry_run: bool = False,
                        with_images: bool = False) -> Dict[str, Any]:
    """
    단일 클라이언트에 대해 전체 파이프라인 실행

    Returns:
        dict: 실행 결과 요약
    """
    client_display = client_id if client_id else "레거시 모드"
    total = len(scripts)

    print("\n" + "=" * 70)
    print(f"클라이언트: {client_display}")
    print(f"실행 스크립트: {total}개")
    if with_images:
        print("이미지 다운로드: 포함")
    print("=" * 70)

    results = {
        'client_id': client_id,
        'total': total,
        'success': 0,
        'failed': 0,
        'failed_scripts': [],
        'start_time': datetime.now().isoformat(),
    }

    for idx, (script_name, description) in enumerate(scripts, 1):
        success = run_script(
            script_name=script_name,
            client_id=client_id,
            index=idx,
            total=total,
            description=description,
            dry_run=dry_run,
            with_images=with_images
        )

        if success:
            results['success'] += 1
        else:
            results['failed'] += 1
            results['failed_scripts'].append(script_name)

    results['end_time'] = datetime.now().isoformat()

    # 클라이언트 요약
    print("\n" + "-" * 70)
    print(f"[{client_display}] 완료: {results['success']}/{total} 성공")
    if results['failed_scripts']:
        print(f"  실패 스크립트: {', '.join(results['failed_scripts'])}")

    return results


def main():
    parser = argparse.ArgumentParser(
        description='전체 클라이언트 ETL 파이프라인 실행',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예시:
  python scripts/run_all_clients.py                    # 모든 active 클라이언트
  python scripts/run_all_clients.py --client clientA   # 특정 클라이언트만
  python scripts/run_all_clients.py --stage fetch      # fetch 단계만
  python scripts/run_all_clients.py --stage analysis   # analysis 단계만
  python scripts/run_all_clients.py --dry-run          # 실행 없이 계획만 출력
        """
    )
    parser.add_argument(
        '--client',
        type=str,
        default=None,
        help='특정 클라이언트 ID (미지정 시 모든 active 클라이언트)'
    )
    parser.add_argument(
        '--stage',
        type=str,
        choices=['fetch', 'mapping', 'analysis', 'all'],
        default='all',
        help='실행할 단계 (기본: all)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='실행 없이 계획만 출력'
    )
    parser.add_argument(
        '--legacy',
        action='store_true',
        help='레거시 모드 (data/ 경로, --client 없이 실행)'
    )
    parser.add_argument(
        '--with-images',
        action='store_true',
        help='소재 이미지 다운로드 포함 (fetch_creative_url.py에 --download-images 전달)'
    )

    args = parser.parse_args()

    # 시작 메시지
    print("=" * 70)
    print("전체 클라이언트 ETL 파이프라인")
    print("=" * 70)
    print(f"실행 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"설정 파일: {CONFIG_FILE}")
    print(f"실행 단계: {args.stage}")
    if args.with_images:
        print("이미지 다운로드: 포함")
    if args.dry_run:
        print("[DRY-RUN 모드] 실행 없이 계획만 출력합니다.")

    # 스크립트 목록 선택
    scripts = STAGES[args.stage]
    print(f"스크립트 수: {len(scripts)}개")

    # 클라이언트 목록 결정
    if args.legacy:
        # 레거시 모드: client_id 없이 실행
        clients_to_run = [None]
        print("모드: 레거시 (data/ 경로)")
    elif args.client:
        # 특정 클라이언트만
        clients_to_run = [args.client]
        print(f"모드: 단일 클라이언트 ({args.client})")
    else:
        # 모든 active 클라이언트
        active_clients = load_clients(CONFIG_FILE)
        if not active_clients:
            print("[경고] active 클라이언트가 없습니다.")
            sys.exit(0)

        clients_to_run = [c['id'] for c in active_clients]
        print(f"모드: 멀티클라이언트 ({len(clients_to_run)}개)")
        for c in active_clients:
            print(f"  - {c['id']}: {c.get('name', 'N/A')}")

    # 실행
    all_results = []
    total_start = time.time()

    for client_id in clients_to_run:
        result = run_client_pipeline(
            client_id=client_id,
            scripts=scripts,
            dry_run=args.dry_run,
            with_images=args.with_images
        )
        all_results.append(result)

    total_elapsed = time.time() - total_start

    # 최종 요약
    print("\n" + "=" * 70)
    print("전체 실행 완료")
    print("=" * 70)
    print(f"총 소요 시간: {total_elapsed:.1f}초")
    print(f"클라이언트 수: {len(all_results)}개")

    total_success = sum(r['success'] for r in all_results)
    total_failed = sum(r['failed'] for r in all_results)
    total_scripts = sum(r['total'] for r in all_results)

    print(f"총 스크립트: {total_scripts}개 (성공: {total_success}, 실패: {total_failed})")

    if total_failed > 0:
        print("\n[실패 요약]")
        for result in all_results:
            if result['failed_scripts']:
                client_display = result['client_id'] or '레거시'
                print(f"  [{client_display}] {', '.join(result['failed_scripts'])}")
        sys.exit(1)
    else:
        print("\n모든 스크립트가 성공적으로 완료되었습니다.")
        sys.exit(0)


if __name__ == '__main__':
    main()
