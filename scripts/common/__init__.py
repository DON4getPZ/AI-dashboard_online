# scripts/common/__init__.py
"""
공통 모듈 패키지
- paths: 클라이언트별 경로 관리
"""

from .paths import ClientPaths, get_client_config, parse_client_arg, PROJECT_ROOT

__all__ = ['ClientPaths', 'get_client_config', 'parse_client_arg', 'PROJECT_ROOT']
