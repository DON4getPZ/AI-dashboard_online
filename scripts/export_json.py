"""
CSV/JSON 데이터를 Next.js용 JSON으로 변환하는 스크립트

사용법:
    python scripts/export_json.py --client clientA

출력:
    public/data/{clientId}/
    ├── kpi.json          # 핵심 KPI 요약
    ├── forecast.json     # Prophet 예측 데이터
    ├── funnel.json       # AARRR 퍼널 데이터
    ├── creative.json     # 크리에이티브 성과
    ├── segments.json     # 세그먼트별 데이터
    ├── dimensions.json   # 차원별 분석 데이터
    ├── insights.json     # 통합 인사이트
    └── meta.json         # 메타데이터 (업데이트 시간 등)
"""

import os
import sys
import json
import csv
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional

# 프로젝트 루트를 sys.path에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.common.paths import ClientPaths, parse_client_arg, PROJECT_ROOT

import pandas as pd
import numpy as np


class NpEncoder(json.JSONEncoder):
    """NumPy/Pandas 타입을 JSON으로 변환하는 인코더"""
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            if np.isnan(obj) or np.isinf(obj):
                return None
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, pd.Timestamp):
            return obj.isoformat()
        if pd.isna(obj):
            return None
        return super().default(obj)


def load_csv_as_dict(file_path: Path) -> List[Dict]:
    """CSV 파일을 딕셔너리 리스트로 로드"""
    if not file_path.exists():
        print(f"  ⚠️ 파일 없음: {file_path.name}")
        return []

    try:
        df = pd.read_csv(file_path, encoding='utf-8')
        # NaN을 None으로 변환
        df = df.where(pd.notnull(df), None)
        return df.to_dict('records')
    except Exception as e:
        print(f"  ❌ 로드 실패 {file_path.name}: {e}")
        return []


def load_json_file(file_path: Path) -> Dict:
    """JSON 파일 로드"""
    if not file_path.exists():
        print(f"  ⚠️ 파일 없음: {file_path.name}")
        return {}

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"  ❌ 로드 실패 {file_path.name}: {e}")
        return {}


def save_json(data: Any, file_path: Path) -> bool:
    """JSON 파일 저장"""
    try:
        file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2, cls=NpEncoder)
        return True
    except Exception as e:
        print(f"  ❌ 저장 실패 {file_path.name}: {e}")
        return False


def export_kpi(paths: ClientPaths) -> Dict:
    """KPI 데이터 추출"""
    print("\n📊 KPI 데이터 추출 중...")

    kpi_data = {
        "summary": {},
        "daily": [],
        "statistics": {}
    }

    # statistics.json 로드
    stats = load_json_file(paths.statistics_json)
    if stats:
        kpi_data["statistics"] = stats
        print(f"  ✓ statistics.json 로드 완료")

    # daily_statistics.csv 로드
    daily = load_csv_as_dict(paths.daily_statistics)
    if daily:
        kpi_data["daily"] = daily
        print(f"  ✓ daily_statistics.csv 로드 완료 ({len(daily)}행)")

    return kpi_data


def export_forecast(paths: ClientPaths) -> Dict:
    """예측 데이터 추출"""
    print("\n🔮 예측 데이터 추출 중...")

    forecast_data = {
        "predictions": {
            "daily": [],
            "weekly": [],
            "monthly": []
        },
        "segments": {
            "brand": [],
            "channel": [],
            "product": [],
            "promotion": []
        },
        "insights": {}
    }

    # 예측 데이터
    forecast_data["predictions"]["daily"] = load_csv_as_dict(paths.predictions_daily)
    forecast_data["predictions"]["weekly"] = load_csv_as_dict(paths.predictions_weekly)
    forecast_data["predictions"]["monthly"] = load_csv_as_dict(paths.predictions_monthly)

    # 세그먼트 데이터
    forecast_data["segments"]["brand"] = load_csv_as_dict(paths.segment_brand)
    forecast_data["segments"]["channel"] = load_csv_as_dict(paths.segment_channel)
    forecast_data["segments"]["product"] = load_csv_as_dict(paths.segment_product)
    forecast_data["segments"]["promotion"] = load_csv_as_dict(paths.segment_promotion)

    # 인사이트
    forecast_data["insights"] = load_json_file(paths.forecast_insights_json)

    # 요약
    if forecast_data["predictions"]["daily"]:
        print(f"  ✓ 예측 데이터 로드 완료 (일별: {len(forecast_data['predictions']['daily'])}행)")

    return forecast_data


def export_funnel(paths: ClientPaths) -> Dict:
    """퍼널 데이터 추출"""
    print("\n🔻 퍼널 데이터 추출 중...")

    funnel_data = {
        "daily": [],
        "weekly": [],
        "channel": [],
        "campaign": [],
        "new_vs_returning": [],
        "channel_engagement": [],
        "insights": {}
    }

    funnel_data["daily"] = load_csv_as_dict(paths.daily_funnel)
    funnel_data["weekly"] = load_csv_as_dict(paths.weekly_funnel)
    funnel_data["channel"] = load_csv_as_dict(paths.channel_funnel)
    funnel_data["campaign"] = load_csv_as_dict(paths.campaign_funnel)
    funnel_data["new_vs_returning"] = load_csv_as_dict(paths.new_vs_returning)
    funnel_data["channel_engagement"] = load_csv_as_dict(paths.channel_engagement)
    funnel_data["insights"] = load_json_file(paths.funnel_insights_json)

    if funnel_data["daily"]:
        print(f"  ✓ 퍼널 데이터 로드 완료 (일별: {len(funnel_data['daily'])}행)")

    return funnel_data


def export_creative(paths: ClientPaths) -> Dict:
    """크리에이티브 데이터 추출"""
    print("\n🎨 크리에이티브 데이터 추출 중...")

    creative_data = {
        "performance": [],
        "urls": []
    }

    creative_data["performance"] = load_csv_as_dict(paths.creative_data)
    creative_data["urls"] = load_csv_as_dict(paths.creative_url)

    if creative_data["performance"]:
        print(f"  ✓ 크리에이티브 데이터 로드 완료 ({len(creative_data['performance'])}개)")

    return creative_data


def export_dimensions(paths: ClientPaths) -> Dict:
    """차원별 분석 데이터 추출"""
    print("\n📐 차원별 분석 데이터 추출 중...")

    dimensions_data = {
        "campaign_adset": [],      # type1
        "adset_age_gender": [],    # type2
        "adset_age": [],           # type3
        "adset_gender": [],        # type4
        "adset_device": [],        # type5
        "adset_platform": [],      # type6
        "adset_deviceplatform": [] # type7
    }

    dimensions_data["campaign_adset"] = load_csv_as_dict(paths.dimension_type1)
    dimensions_data["adset_age_gender"] = load_csv_as_dict(paths.dimension_type2)
    dimensions_data["adset_age"] = load_csv_as_dict(paths.dimension_type3)
    dimensions_data["adset_gender"] = load_csv_as_dict(paths.dimension_type4)
    dimensions_data["adset_device"] = load_csv_as_dict(paths.dimension_type5)
    dimensions_data["adset_platform"] = load_csv_as_dict(paths.dimension_type6)
    dimensions_data["adset_deviceplatform"] = load_csv_as_dict(paths.dimension_type7)

    total = sum(len(v) for v in dimensions_data.values())
    print(f"  ✓ 차원별 데이터 로드 완료 (총 {total}행)")

    return dimensions_data


def export_insights(paths: ClientPaths) -> Dict:
    """통합 인사이트 추출"""
    print("\n💡 통합 인사이트 추출 중...")

    insights_data = {
        "type": {},
        "funnel": {},
        "forecast": {}
    }

    insights_data["type"] = load_json_file(paths.type_insights_json)
    insights_data["funnel"] = load_json_file(paths.funnel_insights_json)
    insights_data["forecast"] = load_json_file(paths.forecast_insights_json)

    # 인사이트 개수 출력
    type_count = len(insights_data["type"].get("recommendations", []))
    funnel_count = len(insights_data["funnel"].get("insights", []))

    print(f"  ✓ Type 인사이트: {type_count}개 추천사항")
    print(f"  ✓ Funnel 인사이트: {funnel_count}개")

    return insights_data


def export_meta(paths: ClientPaths, client_id: str) -> Dict:
    """메타데이터 생성"""
    print("\n📝 메타데이터 생성 중...")

    meta_data = {
        "clientId": client_id,
        "lastUpdated": datetime.now().isoformat(),
        "generatedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "version": "1.0.0",
        "files": {
            "kpi": "kpi.json",
            "forecast": "forecast.json",
            "funnel": "funnel.json",
            "creative": "creative.json",
            "dimensions": "dimensions.json",
            "insights": "insights.json"
        }
    }

    print(f"  ✓ 메타데이터 생성 완료")

    return meta_data


def export_json(client_id: str):
    """메인 내보내기 함수"""
    print("=" * 80)
    print("📦 Next.js용 JSON 내보내기")
    print("=" * 80)
    print(f"\n클라이언트: {client_id}")

    # 경로 설정
    paths = ClientPaths(client_id)

    # 소스 디렉토리 확인
    if not paths.base.exists():
        print(f"\n❌ 오류: 데이터 디렉토리가 존재하지 않습니다: {paths.base}")
        print("   먼저 데이터 수집 및 분석을 실행하세요.")
        sys.exit(1)

    # 출력 디렉토리 생성
    paths.public_data.mkdir(parents=True, exist_ok=True)
    print(f"\n출력 경로: {paths.public_data}")

    # 각 데이터 타입별 내보내기
    results = {}

    # KPI
    kpi_data = export_kpi(paths)
    if save_json(kpi_data, paths.public_kpi_json):
        results["kpi"] = True

    # Forecast
    forecast_data = export_forecast(paths)
    if save_json(forecast_data, paths.public_forecast_json):
        results["forecast"] = True

    # Funnel
    funnel_data = export_funnel(paths)
    if save_json(funnel_data, paths.public_funnel_json):
        results["funnel"] = True

    # Creative
    creative_data = export_creative(paths)
    if save_json(creative_data, paths.public_creative_json):
        results["creative"] = True

    # Dimensions
    dimensions_data = export_dimensions(paths)
    if save_json(dimensions_data, paths.public_dimensions_json):
        results["dimensions"] = True

    # Insights
    insights_data = export_insights(paths)
    if save_json(insights_data, paths.public_insights_json):
        results["insights"] = True

    # Meta
    meta_data = export_meta(paths, client_id)
    if save_json(meta_data, paths.public_meta_json):
        results["meta"] = True

    # 결과 요약
    print("\n" + "=" * 80)
    print("📊 내보내기 결과")
    print("=" * 80)

    success_count = sum(1 for v in results.values() if v)
    total_count = len(results)

    for name, success in results.items():
        status = "✅" if success else "❌"
        print(f"  {status} {name}.json")

    print(f"\n총 {success_count}/{total_count} 파일 생성 완료")
    print(f"출력 경로: {paths.public_data}")

    # 파일 크기 출력
    print("\n📁 생성된 파일 크기:")
    for json_file in paths.public_data.glob("*.json"):
        size = json_file.stat().st_size
        if size > 1024 * 1024:
            size_str = f"{size / (1024*1024):.1f} MB"
        elif size > 1024:
            size_str = f"{size / 1024:.1f} KB"
        else:
            size_str = f"{size} bytes"
        print(f"  {json_file.name}: {size_str}")

    return results


if __name__ == '__main__':
    # --client 인자 파싱 (필수)
    client_id = parse_client_arg(required=True)

    if not client_id:
        print("❌ 오류: --client 인자가 필요합니다")
        print("   사용법: python scripts/export_json.py --client clientA")
        sys.exit(1)

    export_json(client_id)

    print("\n" + "=" * 80)
    print("✅ JSON 내보내기 완료!")
    print("=" * 80)
