# scripts/common/paths.py
"""
멀티클라이언트 경로 관리 모듈

사용법:
    from scripts.common.paths import ClientPaths, parse_client_arg

    client_id = parse_client_arg()
    paths = ClientPaths(client_id)

    # 경로 접근
    raw_data = paths.raw_data          # data/{client}/raw/raw_data.csv
    predictions = paths.predictions     # data/{client}/forecast/predictions.csv
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Optional, Dict, Any

# 프로젝트 루트 디렉토리
PROJECT_ROOT = Path(__file__).parent.parent.parent


class ClientPaths:
    """클라이언트별 경로 관리 클래스"""

    def __init__(self, client_id: str):
        """
        Args:
            client_id: 클라이언트 식별자 (예: 'clientA', 'clientB')
        """
        self.client_id = client_id
        self.base = PROJECT_ROOT / 'data' / client_id

        # 하위 디렉토리
        self.raw = self.base / 'raw'
        self.forecast = self.base / 'forecast'
        self.funnel = self.base / 'funnel'
        self.type = self.base / 'type'
        self.creative = self.base / 'creative'
        self.ga4 = self.base / 'GA4'
        self.statistics = self.base / 'statistics'
        self.meta = self.base / 'meta'
        self.visualizations = self.base / 'visualizations'

        # JSON 출력 디렉토리 (Next.js용)
        self.public_data = PROJECT_ROOT / 'public' / 'data' / client_id

    def ensure_dirs(self) -> 'ClientPaths':
        """모든 필요 디렉토리 생성"""
        dirs = [
            self.raw, self.forecast, self.funnel, self.type,
            self.creative, self.ga4, self.statistics, self.meta,
            self.visualizations, self.public_data
        ]
        for d in dirs:
            d.mkdir(parents=True, exist_ok=True)
        return self

    # ===== Raw Data =====
    @property
    def raw_data(self) -> Path:
        return self.raw / 'raw_data.csv'

    # ===== Forecast =====
    @property
    def predictions(self) -> Path:
        return self.forecast / 'predictions.csv'

    @property
    def predictions_daily(self) -> Path:
        return self.forecast / 'predictions_daily.csv'

    @property
    def predictions_weekly(self) -> Path:
        return self.forecast / 'predictions_weekly.csv'

    @property
    def predictions_monthly(self) -> Path:
        return self.forecast / 'predictions_monthly.csv'

    @property
    def segment_brand(self) -> Path:
        return self.forecast / 'segment_brand.csv'

    @property
    def segment_channel(self) -> Path:
        return self.forecast / 'segment_channel.csv'

    @property
    def segment_product(self) -> Path:
        return self.forecast / 'segment_product.csv'

    @property
    def segment_promotion(self) -> Path:
        return self.forecast / 'segment_promotion.csv'

    @property
    def segment_stats_json(self) -> Path:
        return self.forecast / 'segment_stats.json'

    @property
    def forecast_insights_json(self) -> Path:
        return self.forecast / 'insights.json'

    # ===== Funnel =====
    @property
    def daily_funnel(self) -> Path:
        return self.funnel / 'daily_funnel.csv'

    @property
    def weekly_funnel(self) -> Path:
        return self.funnel / 'weekly_funnel.csv'

    @property
    def channel_funnel(self) -> Path:
        return self.funnel / 'channel_funnel.csv'

    @property
    def campaign_funnel(self) -> Path:
        return self.funnel / 'campaign_funnel.csv'

    @property
    def new_vs_returning(self) -> Path:
        return self.funnel / 'new_vs_returning.csv'

    @property
    def channel_engagement(self) -> Path:
        return self.funnel / 'channel_engagement.csv'

    @property
    def funnel_insights_json(self) -> Path:
        return self.funnel / 'insights.json'

    # ===== Type (Dimension Analysis) =====
    @property
    def merged_data(self) -> Path:
        return self.type / 'merged_data.csv'

    @property
    def dimension_type1(self) -> Path:
        return self.type / 'dimension_type1_campaign_adset.csv'

    @property
    def dimension_type2(self) -> Path:
        return self.type / 'dimension_type2_adset_age_gender.csv'

    @property
    def dimension_type3(self) -> Path:
        return self.type / 'dimension_type3_adset_age.csv'

    @property
    def dimension_type4(self) -> Path:
        return self.type / 'dimension_type4_adset_gender.csv'

    @property
    def dimension_type5(self) -> Path:
        return self.type / 'dimension_type5_adset_device.csv'

    @property
    def dimension_type6(self) -> Path:
        return self.type / 'dimension_type6_adset_platform.csv'

    @property
    def dimension_type7(self) -> Path:
        return self.type / 'dimension_type7_adset_deviceplatform.csv'

    @property
    def type_insights_json(self) -> Path:
        return self.type / 'insights.json'

    # ===== Creative =====
    @property
    def creative_data(self) -> Path:
        return self.creative / 'Creative_data.csv'

    @property
    def creative_url(self) -> Path:
        return self.creative / 'Creative_url.csv'

    # ===== GA4 =====
    @property
    def ga4_data(self) -> Path:
        return self.ga4 / 'GA4_data.csv'

    # ===== Statistics =====
    @property
    def statistics_json(self) -> Path:
        return self.statistics / 'statistics.json'

    @property
    def daily_statistics(self) -> Path:
        return self.statistics / 'daily_statistics.csv'

    # ===== Meta =====
    @property
    def meta_latest_json(self) -> Path:
        return self.meta / 'latest.json'

    # ===== Public JSON (Next.js) =====
    @property
    def public_kpi_json(self) -> Path:
        return self.public_data / 'kpi.json'

    @property
    def public_forecast_json(self) -> Path:
        return self.public_data / 'forecast.json'

    @property
    def public_funnel_json(self) -> Path:
        return self.public_data / 'funnel.json'

    @property
    def public_creative_json(self) -> Path:
        return self.public_data / 'creative.json'

    @property
    def public_segments_json(self) -> Path:
        return self.public_data / 'segments.json'

    @property
    def public_dimensions_json(self) -> Path:
        return self.public_data / 'dimensions.json'

    @property
    def public_insights_json(self) -> Path:
        return self.public_data / 'insights.json'

    @property
    def public_meta_json(self) -> Path:
        return self.public_data / 'meta.json'


def load_clients_config() -> Dict[str, Any]:
    """
    clients.json 전체 설정 로드

    Returns:
        전체 설정 딕셔너리

    Raises:
        FileNotFoundError: 설정 파일이 없는 경우
    """
    config_path = PROJECT_ROOT / 'config' / 'clients.json'

    if not config_path.exists():
        raise FileNotFoundError(f"클라이언트 설정 파일을 찾을 수 없습니다: {config_path}")

    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_google_credentials_path() -> Optional[Path]:
    """
    clients.json에서 Google credentials 경로 조회

    Returns:
        credentials 파일 경로 또는 None
    """
    try:
        config = load_clients_config()
        cred_path = config.get('google', {}).get('credentials_path')
        if cred_path:
            return Path(cred_path)
        return None
    except FileNotFoundError:
        return None


def get_client_config(client_id: str) -> Dict[str, Any]:
    """
    클라이언트 설정 조회

    Args:
        client_id: 클라이언트 식별자

    Returns:
        클라이언트 설정 딕셔너리

    Raises:
        ValueError: 클라이언트를 찾을 수 없는 경우
    """
    config = load_clients_config()

    for client in config.get('clients', []):
        if client.get('id') == client_id:
            # defaults 병합
            defaults = config.get('defaults', {})
            return {**defaults, **client}

    raise ValueError(f"클라이언트를 찾을 수 없습니다: {client_id}")


def parse_client_arg(required: bool = True) -> Optional[str]:
    """
    명령줄에서 --client 인자 파싱

    Args:
        required: 필수 여부 (기본 True)

    Returns:
        클라이언트 ID 또는 None

    Usage:
        python script.py --client clientA
    """
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument('--client', type=str, required=required,
                        help='클라이언트 ID (예: clientA)')

    # 알려진 인자만 파싱 (다른 인자는 무시)
    args, _ = parser.parse_known_args()

    return args.client


# ===== 레거시 호환성 =====
# 기존 단일 클라이언트 경로 (마이그레이션 기간 동안 유지)
LEGACY_DATA_DIR = PROJECT_ROOT / 'data'


def get_legacy_paths() -> Dict[str, Path]:
    """레거시 경로 반환 (마이그레이션 기간용)"""
    return {
        'raw_data': LEGACY_DATA_DIR / 'raw' / 'raw_data.csv',
        'predictions': LEGACY_DATA_DIR / 'forecast' / 'predictions.csv',
        'funnel_insights': LEGACY_DATA_DIR / 'funnel' / 'insights.json',
        'type_insights': LEGACY_DATA_DIR / 'type' / 'insights.json',
    }


if __name__ == '__main__':
    # 테스트
    client_id = parse_client_arg(required=False) or 'clientA'
    paths = ClientPaths(client_id)

    print(f"클라이언트: {client_id}")
    print(f"기본 경로: {paths.base}")
    print(f"원본 데이터: {paths.raw_data}")
    print(f"예측 데이터: {paths.predictions_daily}")
    print(f"퍼널 인사이트: {paths.funnel_insights_json}")
    print(f"Public JSON: {paths.public_kpi_json}")
