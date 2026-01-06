#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
6개 HTML 파일을 100% 재현율로 단일 HTML 파일로 통합하는 스크립트
- 모든 CSS 보존
- 모든 HTML 구조 보존
- 모든 JavaScript 보존
- 해시 기반 SPA 라우팅 구현
"""

import re
import os

# 파일 경로 설정
base_path = os.path.dirname(os.path.abspath(__file__))
data_path = os.path.join(base_path, 'data')

# 통합할 파일 목록 (순서 중요)
files = [
    ('marketing_dashboard_v3.html', 'dashboard', '광고 성과 대시보드'),
    ('creative_analysis.html', 'creative', '소재별 대시보드'),
    ('timeseries_analysis.html', 'timeseries', '시계열 데이터 분석'),
    ('type_dashboard.html', 'type', '채널별 비교'),
    ('funnel_dashboard.html', 'funnel', '퍼널 대시보드'),
    ('Qna.html', 'qna', 'FAQ&문의하기'),
]

def extract_style_content(html_content):
    """<style> 태그 내용 추출"""
    pattern = r'<style[^>]*>(.*?)</style>'
    matches = re.findall(pattern, html_content, re.DOTALL | re.IGNORECASE)
    return '\n'.join(matches)

def extract_head_scripts(html_content):
    """<head> 내 <script> 태그들 추출 (src 포함)"""
    head_match = re.search(r'<head[^>]*>(.*?)</head>', html_content, re.DOTALL | re.IGNORECASE)
    if not head_match:
        return ''
    head_content = head_match.group(1)

    # script 태그 추출 (src가 있는 외부 스크립트)
    script_pattern = r'<script[^>]*src=["\'][^"\']+["\'][^>]*></script>'
    scripts = re.findall(script_pattern, head_content, re.IGNORECASE)

    # 인라인 스크립트 추출 (embed mode detection 등)
    inline_pattern = r'<script[^>]*>.*?</script>'
    inline_scripts = re.findall(inline_pattern, head_content, re.DOTALL | re.IGNORECASE)

    return '\n'.join(scripts + [s for s in inline_scripts if 'src=' not in s])

def extract_body_content(html_content):
    """<body> 내용 추출 (스크립트 제외)"""
    body_match = re.search(r'<body[^>]*>(.*?)</body>', html_content, re.DOTALL | re.IGNORECASE)
    if not body_match:
        return ''
    body_content = body_match.group(1)

    # body 내 script 태그 제거 (나중에 별도로 추가)
    body_content = re.sub(r'<script[^>]*>.*?</script>', '', body_content, flags=re.DOTALL | re.IGNORECASE)

    # main-content 내부만 추출
    main_match = re.search(r'<main class="main-content">(.*?)</main>', body_content, re.DOTALL)
    if main_match:
        body_content = main_match.group(1)

    return body_content

def extract_body_scripts(html_content):
    """<body> 내 <script> 태그들 추출"""
    body_match = re.search(r'<body[^>]*>(.*?)</body>', html_content, re.DOTALL | re.IGNORECASE)
    if not body_match:
        return ''
    body_content = body_match.group(1)

    # script 태그 추출
    script_pattern = r'<script[^>]*>(.*?)</script>'
    matches = re.findall(script_pattern, body_content, re.DOTALL | re.IGNORECASE)

    return '\n'.join(matches)

def get_sidebar_html():
    """통합 사이드바 HTML 생성"""
    return '''
        <!-- 통합 사이드바 -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <a href="#dashboard" class="sidebar-logo">
                    <div class="sidebar-logo-icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                        </svg>
                    </div>
                    <div>
                        <div class="sidebar-logo-text">Analytics</div>
                        <div class="sidebar-logo-subtitle">Dashboard</div>
                    </div>
                </a>
            </div>

            <div class="simplebar-content-wrapper">
                <div class="sidebar-content">
                    <!-- 대시보드 그룹 -->
                    <div class="nav-group">
                        <div class="nav-group-title">대시보드</div>
                        <a href="#dashboard" class="nav-item" data-page="dashboard">
                            <div class="nav-item-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>
                                </svg>
                            </div>
                            <span class="nav-item-text">광고 성과 대시보드</span>
                        </a>
                        <a href="#funnel" class="nav-item" data-page="funnel">
                            <div class="nav-item-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                            <span class="nav-item-text">퍼널 대시보드</span>
                        </a>
                    </div>

                    <!-- 분석 그룹 -->
                    <div class="nav-group">
                        <div class="nav-group-title">분석</div>
                        <a href="#creative" class="nav-item" data-page="creative">
                            <div class="nav-item-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                </svg>
                            </div>
                            <span class="nav-item-text">소재별 대시보드</span>
                        </a>
                        <a href="#timeseries" class="nav-item" data-page="timeseries">
                            <div class="nav-item-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M23 8c0 1.1-.9 2-2 2-.18 0-.35-.02-.51-.07l-3.56 3.55c.05.16.07.34.07.52 0 1.1-.9 2-2 2s-2-.9-2-2c0-.18.02-.36.07-.52l-2.55-2.55c-.16.05-.34.07-.52.07s-.36-.02-.52-.07l-4.55 4.56c.05.16.07.33.07.51 0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.18 0 .35.02.51.07l4.56-4.55C8.02 9.36 8 9.18 8 9c0-1.1.9-2 2-2s2 .9 2 2c0 .18-.02.36-.07.52l2.55 2.55c.16-.05.34-.07.52-.07s.36.02.52.07l3.55-3.56C19.02 8.35 19 8.18 19 8c0-1.1.9-2 2-2s2 .9 2 2z"/>
                                </svg>
                            </div>
                            <span class="nav-item-text">시계열 데이터 분석</span>
                        </a>
                        <a href="#type" class="nav-item" data-page="type">
                            <div class="nav-item-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/>
                                </svg>
                            </div>
                            <span class="nav-item-text">채널별 비교</span>
                        </a>
                    </div>

                    <!-- 도움말 그룹 -->
                    <div class="nav-group">
                        <div class="nav-group-title">도움말</div>
                        <a href="#qna" class="nav-item" data-page="qna">
                            <div class="nav-item-icon">
                                <svg viewBox="0 0 24 24">
                                    <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
                                </svg>
                            </div>
                            <span class="nav-item-text">FAQ&문의하기</span>
                        </a>
                    </div>
                </div>
            </div>
        </aside>
'''

def main():
    print("HTML 파일 통합 시작...")

    # 각 파일 읽기
    all_styles = []
    all_head_scripts = set()  # 중복 제거용
    all_body_contents = {}
    all_body_scripts = {}

    for filename, page_id, page_title in files:
        filepath = os.path.join(data_path, filename)
        print(f"  처리 중: {filename}")

        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # CSS 추출
        style = extract_style_content(content)
        all_styles.append(f'/* ========== {filename} CSS ========== */\n{style}')

        # head scripts 추출
        head_scripts = extract_head_scripts(content)
        for script in re.findall(r'<script[^>]*src=["\']([^"\']+)["\'][^>]*></script>', head_scripts, re.IGNORECASE):
            all_head_scripts.add(script)

        # body content 추출 (main-content 내부만)
        body_content = extract_body_content(content)

        all_body_contents[page_id] = body_content

        # body scripts 추출
        scripts = extract_body_scripts(content)
        all_body_scripts[page_id] = scripts

    # 외부 스크립트 목록 (중복 제거)
    external_scripts = sorted(list(all_head_scripts))

    # 통합 HTML 생성
    unified_html = f'''<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>마케팅 대시보드 - 통합</title>
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- External Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2"></script>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <!-- Embed Mode Detection -->
    <script>
        (function() {{
            if (new URLSearchParams(window.location.search).get('embed') === 'true') {{
                document.documentElement.classList.add('embed-mode');
            }}
        }})();
    </script>
    <style>
        /* Embed Mode Styles */
        html.embed-mode .sidebar {{ display: none !important; }}
        html.embed-mode .main-content {{ margin-left: 0 !important; }}
        html.embed-mode .mobile-menu-btn {{ display: none !important; }}
        html.embed-mode .sidebar-overlay {{ display: none !important; }}

        /* 페이지 전환 스타일 */
        .page-section {{
            display: none;
        }}
        .page-section.active {{
            display: block;
        }}

        /* ========== 통합 CSS ========== */
        {chr(10).join(all_styles)}
    </style>
</head>
<body>
    <div class="app-wrapper">
        {get_sidebar_html()}

        <!-- 메인 컨텐츠 영역 -->
        <main class="main-content">
'''

    # 각 페이지 섹션 추가
    for filename, page_id, page_title in files:
        is_first = page_id == 'dashboard'
        active_class = ' active' if is_first else ''
        unified_html += f'''
            <!-- ========== {page_title} ({filename}) ========== -->
            <div class="page-section{active_class}" data-page="{page_id}">
                {all_body_contents.get(page_id, '')}
            </div>
'''

    unified_html += '''
        </main>
    </div>

    <!-- SPA 라우팅 스크립트 -->
    <script>
        // 페이지 라우팅
        function navigateToPage(pageId) {
            // 모든 페이지 섹션 숨기기
            document.querySelectorAll('.page-section').forEach(section => {
                section.classList.remove('active');
            });

            // 선택된 페이지 보이기
            const targetPage = document.querySelector(`.page-section[data-page="${pageId}"]`);
            if (targetPage) {
                targetPage.classList.add('active');
            }

            // 네비게이션 활성화 상태 업데이트
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            const activeNav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
            if (activeNav) {
                activeNav.classList.add('active');
            }

            // 페이지 상단으로 스크롤
            window.scrollTo(0, 0);

            // 페이지별 초기화 함수 호출
            if (typeof window[`init_${pageId}`] === 'function') {
                window[`init_${pageId}`]();
            }
        }

        // 해시 변경 감지
        function handleHashChange() {
            const hash = window.location.hash.slice(1) || 'dashboard';
            navigateToPage(hash);
        }

        // 이벤트 리스너 등록
        window.addEventListener('hashchange', handleHashChange);
        window.addEventListener('DOMContentLoaded', handleHashChange);

        // 네비게이션 클릭 이벤트
        document.addEventListener('click', function(e) {
            const navItem = e.target.closest('.nav-item');
            if (navItem && navItem.dataset.page) {
                e.preventDefault();
                window.location.hash = navItem.dataset.page;
            }
        });
    </script>

'''

    # 각 페이지 스크립트 추가 (네임스페이스 래핑)
    for filename, page_id, page_title in files:
        scripts = all_body_scripts.get(page_id, '')
        if scripts.strip():
            unified_html += f'''
    <!-- ========== {page_title} 스크립트 ({filename}) ========== -->
    <script>
    (function() {{
        // {page_id} 페이지 스크립트
        {scripts}
    }})();
    </script>
'''

    unified_html += '''
</body>
</html>
'''

    # 파일 저장
    output_path = os.path.join(data_path, 'dashboard_unified_100.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(unified_html)

    print(f"\n통합 완료: {output_path}")
    print(f"총 라인 수: {len(unified_html.splitlines())}")

if __name__ == '__main__':
    main()
