문제 발견: 이벤트 리스너가 매번 중첩 등록되고 있습니다!

  updateMicroSegmentAlerts() 함수 내에서:
  1. 서브탭 이벤트 리스너를 매번 등록
  2. 카테고리 필터 이벤트 리스너를 매번 등록
  3. updateChannelMetricsEnhanced()도 중복 호출

  → 클릭할 때마다 리스너가 누적되어 n번 클릭 시 n개의 함수가 동시 실행됩니다.