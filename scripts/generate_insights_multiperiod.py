"""
다중 기간 인사이트 생성 스크립트

기능:
1. insight_generator.py를 여러 기간(전체, 180일, 90일, 30일)에 대해 실행
2. 결과를 by_period 구조로 통합
3. data/forecast/insights.json에 저장

사용법:
    python generate_insights_multiperiod.py

출력 구조:
{
    "generated_at": "2024-01-01T00:00:00",
    "by_period": {
        "full": { ... },
        "180d": { ... },
        "90d": { ... },
        "30d": { ... }
    }
}

의존성:
- insight_generator.py
- segment_processor.py가 먼저 실행되어야 함
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime

# UTF-8 출력 설정 (Windows 콘솔 호환)
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# 스크립트 디렉토리를 path에 추가
SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR))

from insight_generator import InsightGenerator, NpEncoder

# 디렉토리 설정
BASE_DIR = SCRIPT_DIR.parent
DATA_DIR = BASE_DIR / 'data'
FORECAST_DIR = DATA_DIR / 'forecast'

# 분석 기간 설정 (None = 전체)
PERIODS = [None, 180, 90, 30]
PERIOD_LABELS = {None: 'full', 180: '180d', 90: '90d', 30: '30d'}


def generate_all_periods():
    """모든 기간에 대해 인사이트 생성"""
    print("\n" + "="*70)
    print("🔄 Multi-Period Insight Generator")
    print("="*70)
    print(f"   📅 기간: 전체, 180일, 90일, 30일")
    print(f"   📁 출력: data/forecast/insights.json")
    print("="*70)

    all_insights = {
        'generated_at': datetime.now().isoformat(),
        'by_period': {}
    }

    for period in PERIODS:
        period_label = PERIOD_LABELS[period]
        period_display = "전체" if period is None else f"최근 {period}일"

        print(f"\n{'='*60}")
        print(f"📊 [{period_label}] {period_display} 분석 시작...")
        print('='*60)

        try:
            # InsightGenerator 실행 (개별 저장 안 함)
            generator = InsightGenerator(days=period)
            insights = generator.generate(save=False)

            # 결과 저장 (period 키 제거하여 중복 방지)
            if 'period' in insights:
                del insights['period']

            # 네이티브 타입으로 변환
            insights_converted = generator.convert_to_native_types(insights)
            all_insights['by_period'][period_label] = insights_converted

            print(f"\n   ✅ [{period_label}] 완료")

        except Exception as e:
            print(f"\n   ❌ [{period_label}] 오류: {e}")
            import traceback
            traceback.print_exc()
            # 오류 발생 시에도 빈 객체로 저장
            all_insights['by_period'][period_label] = {
                'error': str(e),
                'generated_at': datetime.now().isoformat()
            }

    # 최종 JSON 저장 (NpEncoder로 안전한 직렬화)
    output_file = FORECAST_DIR / 'insights.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_insights, f, cls=NpEncoder, ensure_ascii=False, indent=2)

    print("\n" + "="*70)
    print("🎯 Multi-Period Insight Generator 완료!")
    print("="*70)
    print(f"\n📁 Generated file: {output_file}")
    print("\n📊 JSON Structure:")
    print("   {")
    print("     'generated_at': '...',")
    print("     'by_period': {")
    for period_label in ['full', '180d', '90d', '30d']:
        status = '✅' if period_label in all_insights['by_period'] and 'error' not in all_insights['by_period'][period_label] else '❌'
        print(f"       '{period_label}': {{ ... }},  {status}")
    print("     }")
    print("   }")

    return all_insights


def main():
    """메인 실행 함수"""
    try:
        insights = generate_all_periods()

        # 간단한 요약 출력
        print("\n" + "="*60)
        print("MULTI-PERIOD INSIGHTS SUMMARY")
        print("="*60)

        for period_label in ['full', '180d', '90d', '30d']:
            if period_label in insights['by_period']:
                period_data = insights['by_period'][period_label]
                if 'error' not in period_data:
                    alerts_count = len(period_data.get('segments', {}).get('alerts', []))
                    opps_count = len(period_data.get('opportunities', []))
                    print(f"   [{period_label}] 경고: {alerts_count}건, 기회: {opps_count}건")
                else:
                    print(f"   [{period_label}] 오류 발생")

    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
