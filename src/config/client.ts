/**
 * 클라이언트 설정
 *
 * 현재 활성 클라이언트 ID를 관리합니다.
 * 추후 URL 파라미터나 환경변수로 확장 가능합니다.
 */

// 현재 활성 클라이언트 ID
export const CLIENT_ID = 'test_1'

// 클라이언트별 데이터 경로 생성
export const getClientDataPath = (filename: string): string => {
  return `/data/${CLIENT_ID}/${filename}`
}

// 레거시 경로 → 클라이언트 경로 매핑
export const DATA_PATHS = {
  // insights.json (type 페이지)
  insights: getClientDataPath('insights.json'),

  // dimensions.json (type 페이지 CSV 대체)
  dimensions: getClientDataPath('dimensions.json'),

  // forecast.json (timeseries 페이지)
  forecast: getClientDataPath('forecast.json'),

  // funnel.json (funnel 페이지)
  funnel: getClientDataPath('funnel.json'),

  // creative.json (creative 페이지)
  creative: getClientDataPath('creative.json'),

  // kpi.json (메인 대시보드)
  kpi: getClientDataPath('kpi.json'),

  // meta.json (메타 정보)
  meta: getClientDataPath('meta.json'),
} as const
