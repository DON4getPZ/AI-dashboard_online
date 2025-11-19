#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HTML 프로토타입 생성 스크립트
기존 HTML 파일들을 외부에서 열람 가능한 독립적인 파일로 변환합니다.
CSV 데이터를 인라인 JavaScript 변수로 포함시킵니다.
"""

import os
import re
import json

# 기본 경로 설정
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

def read_csv_as_text(filepath):
    """CSV 파일을 텍스트로 읽기"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return ""

def escape_for_js(text):
    """JavaScript 문자열로 이스케이프"""
    # 백슬래시, 따옴표, 개행문자 이스케이프
    text = text.replace('\\', '\\\\')
    text = text.replace('`', '\\`')
    text = text.replace('${', '\\${')
    return text

def generate_creative_analysis_prototype():
    """creative_analysis.html의 프로토타입 생성"""
    html_path = os.path.join(DATA_DIR, 'creative_analysis.html')
    output_path = os.path.join(DATA_DIR, 'creative_analysis_prototype.html')

    # 원본 HTML 읽기
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # CSV 데이터 읽기
    creative_csv = read_csv_as_text(os.path.join(DATA_DIR, 'creative', '2025-11.csv'))
    url_csv = read_csv_as_text(os.path.join(DATA_DIR, 'creative', 'Meta-이미지-URL_url.csv'))

    # 인라인 데이터 JavaScript 코드 생성
    inline_data_script = f'''
    <script>
        // 인라인 CSV 데이터 (외부 열람용)
        const INLINE_CREATIVE_DATA = `{escape_for_js(creative_csv)}`;
        const INLINE_URL_DATA = `{escape_for_js(url_csv)}`;
    </script>
    '''

    # </head> 앞에 인라인 데이터 삽입
    html_content = html_content.replace('</head>', f'{inline_data_script}\n</head>')

    # loadData 함수 수정 - fetch 대신 인라인 데이터 사용
    # 기존 fetch 호출을 인라인 데이터로 대체

    # 이미지 URL 로드 부분 수정
    old_url_fetch = '''const urlResponse = await fetch(imageUrlFile);
                if (urlResponse.ok) {
                    const urlText = await urlResponse.text();'''
    new_url_fetch = '''// 인라인 데이터 사용 (외부 열람용)
                const urlText = INLINE_URL_DATA;
                if (urlText) {'''
    html_content = html_content.replace(old_url_fetch, new_url_fetch)

    # 소재 데이터 로드 부분 수정
    old_data_fetch = '''const dataResponse = await fetch(creativeDataFile);
                if (!dataResponse.ok) throw new Error('Failed to load creative data');
                const dataText = await dataResponse.text();'''
    new_data_fetch = '''// 인라인 데이터 사용 (외부 열람용)
                const dataText = INLINE_CREATIVE_DATA;'''
    html_content = html_content.replace(old_data_fetch, new_data_fetch)

    # 결과 저장
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"Created: {output_path}")

def generate_marketing_dashboard_prototype(version=''):
    """marketing_dashboard.html의 프로토타입 생성"""
    suffix = f'_v{version}' if version else ''
    html_path = os.path.join(DATA_DIR, f'marketing_dashboard{suffix}.html')
    output_path = os.path.join(DATA_DIR, f'marketing_dashboard{suffix}_prototype.html')

    if not os.path.exists(html_path):
        print(f"File not found: {html_path}")
        return

    # 원본 HTML 읽기
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # 모든 raw CSV 데이터 읽기 및 병합
    all_csv_data = []
    csv_files = [f'2025-{str(i).zfill(2)}.csv' for i in range(1, 12)]

    for csv_file in csv_files:
        csv_path = os.path.join(DATA_DIR, 'raw', csv_file)
        if os.path.exists(csv_path):
            csv_content = read_csv_as_text(csv_path)
            all_csv_data.append(csv_content)

    # CSV 데이터를 JavaScript 배열로 변환
    inline_data_script = '''
    <script>
        // 인라인 CSV 데이터 (외부 열람용)
        const INLINE_CSV_DATA = [
'''

    for i, csv_data in enumerate(all_csv_data):
        inline_data_script += f'            `{escape_for_js(csv_data)}`'
        if i < len(all_csv_data) - 1:
            inline_data_script += ','
        inline_data_script += '\n'

    inline_data_script += '''        ];
    </script>
    '''

    # </head> 앞에 인라인 데이터 삽입
    html_content = html_content.replace('</head>', f'{inline_data_script}\n</head>')

    # loadData 함수 수정 - fetch 대신 인라인 데이터 사용
    old_load_data = '''async function loadData() {
            const promises = csvFiles.map(file =>
                fetch(file)
                    .then(response => {
                        if (!response.ok) throw new Error(`Failed to load ${file}`);
                        return response.text();
                    })
                    .then(text => parseCSV(text))
                    .catch(err => {
                        console.warn(`Could not load ${file}:`, err);
                        return [];
                    })
            );

            const results = await Promise.all(promises);
            allData = results.flat();'''

    new_load_data = '''async function loadData() {
            // 인라인 데이터 사용 (외부 열람용)
            const results = INLINE_CSV_DATA.map(csvText => parseCSV(csvText));
            allData = results.flat();'''

    html_content = html_content.replace(old_load_data, new_load_data)

    # 결과 저장
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"Created: {output_path}")

def generate_dashboard_prototype():
    """dashboard.html의 프로토타입 생성"""
    html_path = os.path.join(DATA_DIR, 'dashboard.html')
    output_path = os.path.join(DATA_DIR, 'dashboard_prototype.html')

    if not os.path.exists(html_path):
        print(f"File not found: {html_path}")
        return

    # 원본 HTML 읽기
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # dashboard.html이 어떤 CSV를 사용하는지 확인
    # forecast 데이터를 사용하는 경우 처리

    # forecast 디렉토리의 CSV 파일들 확인
    forecast_dir = os.path.join(DATA_DIR, 'forecast')
    forecast_data = {}

    if os.path.exists(forecast_dir):
        for filename in os.listdir(forecast_dir):
            if filename.endswith('.csv'):
                filepath = os.path.join(forecast_dir, filename)
                forecast_data[filename] = read_csv_as_text(filepath)

    # 인라인 데이터 스크립트 생성
    inline_data_script = '''
    <script>
        // 인라인 CSV 데이터 (외부 열람용)
        const INLINE_FORECAST_DATA = {
'''

    for i, (filename, data) in enumerate(forecast_data.items()):
        key = filename.replace('.csv', '').replace('-', '_')
        inline_data_script += f'            "{key}": `{escape_for_js(data)}`'
        if i < len(forecast_data) - 1:
            inline_data_script += ','
        inline_data_script += '\n'

    inline_data_script += '''        };
    </script>
    '''

    # </head> 앞에 인라인 데이터 삽입
    html_content = html_content.replace('</head>', f'{inline_data_script}\n</head>')

    # fetch 호출을 인라인 데이터로 대체하는 패턴 찾기
    # dashboard.html의 구조에 따라 조정 필요

    # 일반적인 fetch 패턴 대체
    # fetch('./forecast/...')를 INLINE_FORECAST_DATA로 대체

    # 결과 저장
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"Created: {output_path}")

def main():
    """메인 함수"""
    print("프로토타입 HTML 파일 생성 시작...")
    print(f"기본 경로: {BASE_DIR}")
    print(f"데이터 경로: {DATA_DIR}")
    print()

    # 각 HTML 파일의 프로토타입 생성
    generate_creative_analysis_prototype()
    generate_marketing_dashboard_prototype()  # 기본 버전
    generate_marketing_dashboard_prototype('2')  # v2
    generate_marketing_dashboard_prototype('3')  # v3
    generate_dashboard_prototype()

    print()
    print("프로토타입 생성 완료!")
    print("생성된 파일들은 data 디렉토리에 *_prototype.html 형태로 저장되었습니다.")

if __name__ == '__main__':
    main()
