[5/10] Generating AARRR funnel analysis with advanced analytics...
🚀 퍼널 분석을 시작합니다...
   카테고리: default
   임계값 프리셋: default
   데이터 파일: C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\data\GA4\2025-11.csv

📊 CSV 파일 생성 중...
   ✓ 일별 퍼널: 288 rows
   ✓ 주별 퍼널: 42 rows
   ✓ 채널별 퍼널: 18 rows
   ✓ 캠페인별 퍼널: 20 rows
   ✓ 신규/재방문: 1183 rows

🔍 인사이트 분석 중...
   - BCG Matrix 분석...
   - 상황 인식형 알림 생성...
   - A/B 테스트 & 매출 임팩트...
   - K-Means 클러스터링...
   - 이탈/개선 예측...
Traceback (most recent call last):
  File "C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\scripts\generate_funnel_data.py", line 1111, in <module>
    generate_funnel_insights(category=category)
    ~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^
  File "C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\scripts\generate_funnel_data.py", line 1060, in generate_funnel_insights
    json.dump(insights, f, ensure_ascii=False, indent=2)
    ~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\json\__init__.py", line 179, in dump
    for chunk in iterable:
                 ^^^^^^^^
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\json\encoder.py", line 442, in _iterencode
    yield from _iterencode_dict(o, _current_indent_level)
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\json\encoder.py", line 411, in _iterencode_dict
    yield from chunks
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\json\encoder.py", line 324, in _iterencode_list
    yield from chunks
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\json\encoder.py", line 411, in _iterencode_dict
    yield from chunks
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\json\encoder.py", line 449, in _iterencode
    newobj = _default(o)
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\json\encoder.py", line 180, in default
    raise TypeError(f'Object of type {o.__class__.__name__} '
                    f'is not JSON serializable')
TypeError: Object of type bool is not JSON serializable