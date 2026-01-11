'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Bar, Line, Chart } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartDataLabels
)

// ========================================
// 타입 정의
// ========================================

interface SummaryCard {
  title: string
  total_roas: string
  total_roas_formatted: string
  total_revenue_formatted: string
  total_cost_formatted: string
  message: string
}

interface Recommendation {
  source?: string
  title: string
  message: string
  action?: string
  category?: string
  score?: number
  severity?: string
  priority?: string
  expected_impact?: string
}

interface CategoryData {
  name: string
  cost: number
  conversions: number
  revenue: number
  roas: number
  cpa: number
}

interface GenderPerformance {
  gender: string
  campaign_type?: string
  cost: number
  clicks?: number
  conversions: number
  revenue: number
  roas: number
  cpc?: number
  performance_level?: string
}

interface DevicePerformance {
  device: string
  campaign_type?: string
  cost: number
  clicks?: number
  conversions: number
  revenue: number
  roas: number
  cpc?: number
}

interface DevicePlatformPerformance {
  deviceplatform: string
  campaign_type?: string
  cost: number
  clicks?: number
  conversions: number
  revenue: number
  roas: number
  cpc?: number
}

interface MatrixInsight {
  type: string
  sub_type: string
  dimension: string
  target: string
  severity: string
  title: string
  message: string
  action: string
  metrics: {
    efficiency_value: number
    spend_rank_pct: number
    eff_rank_pct: number
    cost: number
  }
}

interface TopAdset {
  campaign: string
  adset: string
  category: string
  cost: number
  conversions: number
  revenue: number
  roas: number
}

interface AgeGenderCombination {
  adset?: string
  age: string
  gender: string
  campaign_type?: string
  roas: number
  conversions: number
  recommendation?: string
  cpc?: number
}

interface ProductPerformance {
  product: string
  cost: number
  conversions: number
  revenue: number
  roas: number
}

interface Alert {
  type?: string
  title?: string
  message: string
  severity: string
  action?: string
  financial_impact?: {
    loss_amount?: string
    potential_uplift?: string
  }
}

interface MonthlyTrend {
  month: string
  cost: number
  conversions: number
  revenue: number
  roas?: number
  roas_change?: number
}

interface InsightsData {
  summary: {
    total_cost: number
    total_conversions: number
    total_revenue: number
    overall_roas: number
    overall_cpa: number
    analysis_period: {
      start_date: string
      end_date: string
      total_days: number
    }
  }
  summary_card?: SummaryCard
  top_recommendations?: Recommendation[]
  top_categories?: CategoryData[]
  gender_performance?: GenderPerformance[]
  gender_matrix_insights?: MatrixInsight[]
  device_performance?: DevicePerformance[]
  device_matrix_insights?: MatrixInsight[]
  deviceplatform_performance?: DevicePlatformPerformance[]
  deviceplatform_matrix_insights?: MatrixInsight[]
  top_adsets?: TopAdset[]
  age_gender_combinations?: AgeGenderCombination[]
  product_performance?: ProductPerformance[]
  alerts?: Alert[]
  timeseries?: {
    monthly_trend?: MonthlyTrend[]
    monthly_growth?: MonthlyTrend[]
  }
  prophet_forecast?: {
    summary?: {
      overall?: {
        avg_forecast_roas?: number
        avg_forecast_cpa?: number
        total_forecast_conversions?: number
      }
    }
    by_category?: Array<{ category: string; trend_direction?: string; avg_forecast_roas?: number; avg_forecast_cpa?: number }>
    by_product?: Array<{ product: string; total_30day_forecast?: number; avg_forecast_roas?: number; avg_forecast_cpa?: number }>
    by_gender?: Array<{ gender: string; avg_forecast_roas?: number; avg_forecast_cpa?: number }>
    by_age?: Array<{ age: string; avg_forecast_roas?: number; avg_forecast_cpa?: number }>
    by_device?: Array<{ device: string; avg_forecast_roas?: number; avg_forecast_cpa?: number }>
    by_deviceplatform?: Array<{ deviceplatform: string; avg_forecast_roas?: number; avg_forecast_cpa?: number }>
  }
  seasonality_analysis?: SeasonalityAnalysis
  [key: string]: unknown
}

interface DimensionRow {
  [key: string]: string | number
}

interface SeasonalityOverall {
  day: string
  avg_revenue: number
  avg_cost: number
  avg_roas: number
  avg_cpa: number
  avg_conversions?: number
}

interface QuarterlyOverall {
  quarter: string
  avg_cost: number
  avg_impressions?: number
  avg_clicks?: number
  avg_conversions: number
  avg_revenue: number
  avg_roas: number
  avg_cpa: number
}

interface CategoryDayData {
  day: string
  avg_revenue: number
  avg_cost: number
  avg_roas: number
  avg_cpa: number
}

interface SeasonalityAnalysis {
  overall?: SeasonalityOverall[]
  quarterly_overall?: QuarterlyOverall[]
  by_category?: Record<string, CategoryDayData[]>
  quarterly?: Record<string, unknown>
}

// ========================================
// CSS 스타일
// ========================================

const styles = `
  :root {
    --primary-main: #673ab7;
    --primary-light: #ede7f6;
    --primary-dark: #5e35b1;
    --secondary-main: #2196f3;
    --secondary-light: #e3f2fd;
    --success-main: #00c853;
    --success-light: #b9f6ca;
    --warning-main: #ffab00;
    --warning-light: #fff8e1;
    --error-main: #ff1744;
    --error-light: #ffeaea;
    --grey-50: #fafafa;
    --grey-100: #f5f5f5;
    --grey-200: #eeeeee;
    --grey-300: #e0e0e0;
    --grey-500: #9e9e9e;
    --grey-600: #757575;
    --grey-700: #616161;
    --grey-900: #212121;
    --paper: #ffffff;
    --background: #f8fafc;
  }

  .type-dashboard {
    font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: var(--background);
    color: var(--grey-900);
    line-height: 1.5;
    padding: 24px;
    min-height: 100vh;
  }

  .type-dashboard * {
    box-sizing: border-box;
  }

  .dashboard-header {
    margin-bottom: 32px;
  }

  .dashboard-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--grey-900);
    margin: 0 0 8px 0;
  }

  .dashboard-subtitle {
    font-size: 14px;
    color: var(--grey-600);
    margin: 0;
  }

  /* 카드 스타일 */
  .card {
    background: var(--paper);
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid var(--grey-200);
    margin-bottom: 24px;
  }

  /* 정렬 가능한 테이블 헤더 - HTML 동일 */
  .sortable-header {
    cursor: pointer;
    user-select: none;
    position: relative;
    padding-right: 24px !important;
    transition: background 0.2s ease;
  }

  .sortable-header:hover {
    background: var(--grey-100);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .card-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--grey-900);
    margin: 0;
  }

  /* KPI 토글 */
  .kpi-view-toggle {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  .kpi-view-btn {
    padding: 10px 24px;
    border: none;
    background: var(--paper);
    color: var(--grey-700);
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }

  .kpi-view-btn:hover {
    background: var(--primary-light);
    color: var(--primary-main);
  }

  .kpi-view-btn.active {
    background: var(--primary-main);
    color: white;
    box-shadow: 0 4px 12px rgba(103, 58, 183, 0.4);
  }

  /* KPI 섹션 */
  .kpi-section {
    margin-bottom: 24px;
  }

  /* KPI 그리드 */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .kpi-grid-secondary {
    margin-top: 16px;
  }

  .kpi-card {
    background: var(--paper);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    position: relative;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .kpi-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.1);
  }

  .kpi-card.highlight {
    border-left: 4px solid var(--primary-main);
  }

  .kpi-card.secondary {
    background: var(--grey-50);
  }

  .kpi-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .kpi-title {
    font-size: 13px;
    color: var(--grey-600);
    font-weight: 600;
  }

  .kpi-icon {
    width: 36px;
    height: 36px;
    background: var(--grey-100);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .kpi-value {
    font-size: 26px;
    font-weight: 700;
    color: var(--grey-900);
    margin-bottom: 8px;
  }

  .kpi-value.highlight-value {
    color: var(--primary-main);
  }

  .kpi-trend {
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--grey-500);
  }

  /* 접기/펼치기 섹션 */
  .collapsible-section {
    margin-bottom: 24px;
  }

  .collapsible-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    background: var(--paper);
    border-radius: 12px;
    cursor: pointer;
    user-select: none;
    transition: box-shadow 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid var(--grey-200);
  }

  .collapsible-header:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  .collapsible-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 18px;
    font-weight: 600;
    color: var(--grey-900);
  }

  .collapsible-icon {
    font-size: 24px;
  }

  .collapsible-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--primary-light);
    color: var(--primary-main);
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .collapsible-toggle:hover {
    background: var(--primary-main);
    color: white;
  }

  .collapsible-content {
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    padding: 0 24px;
    transition: max-height 0.3s ease, opacity 0.2s ease, padding 0.3s ease;
  }

  .collapsible-content.expanded {
    max-height: 5000px;
    opacity: 1;
    padding: 24px;
  }

  /* 기간 필터 버튼 */
  .period-filter-bar {
    margin-bottom: 12px;
    padding: 12px 16px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 10px;
    border: 1px solid #dee2e6;
  }

  .period-filter-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .period-filter-label {
    font-size: 12px;
    font-weight: 600;
    color: #495057;
  }

  .period-filter-btns {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .period-filter-btn {
    padding: 6px 14px;
    font-size: 11px;
    font-weight: 600;
    border: 1px solid #dee2e6;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s;
    background: white;
    color: #495057;
  }

  .period-filter-btn.active {
    background: #673ab7;
    color: white;
    border-color: #673ab7;
  }

  .period-date-range {
    font-size: 11px;
    color: #6c757d;
    margin-left: auto;
  }

  /* 탭 버튼 */
  .view-type-section {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 16px;
    align-items: center;
  }

  .view-btn {
    padding: 10px 20px;
    background: var(--grey-100);
    color: var(--grey-700);
    border: 1px solid var(--grey-300);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .view-btn:hover {
    background: var(--grey-200);
  }

  .view-btn.active {
    background: var(--primary-main);
    color: white;
    border-color: var(--primary-main);
  }

  .view-btn .badge {
    position: absolute;
    top: -6px;
    right: -6px;
    background: #78909c;
    color: white;
    font-size: 8px;
    padding: 2px 4px;
    border-radius: 8px;
    font-weight: 600;
  }

  .tab-legend {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 10px;
    color: #6c757d;
  }

  .tab-legend-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .tab-legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }

  /* 탭 컨텐츠 */
  .tab-content {
    display: none;
  }

  .tab-content.active {
    display: block;
  }

  /* 인사이트 카드 */
  .insights-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .insight-card {
    padding: 16px;
    border-radius: 8px;
    border-left: 4px solid;
  }

  .insight-card.high {
    background: var(--error-light);
    border-left-color: var(--error-main);
  }

  .insight-card.medium {
    background: var(--warning-light);
    border-left-color: var(--warning-main);
  }

  .insight-card.low {
    background: var(--success-light);
    border-left-color: var(--success-main);
  }

  .insight-card.opportunity {
    background: var(--secondary-light);
    border-left-color: var(--secondary-main);
  }

  .insight-type {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    color: var(--grey-600);
  }

  .insight-message {
    font-size: 14px;
    color: var(--grey-900);
    font-weight: 500;
    margin-bottom: 8px;
  }

  .insight-value {
    font-size: 12px;
    color: var(--grey-600);
  }

  /* 테이블 스타일 */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 16px;
  }

  .data-table th {
    text-align: left;
    padding: 12px;
    font-size: 12px;
    font-weight: 600;
    color: var(--grey-600);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid var(--grey-200);
    background: var(--grey-50);
  }

  .data-table th.text-right {
    text-align: right;
  }

  .data-table th.text-center {
    text-align: center;
  }

  .data-table td {
    padding: 12px;
    font-size: 14px;
    color: var(--grey-900);
    border-bottom: 1px solid var(--grey-200);
  }

  .data-table td.text-right {
    text-align: right;
  }

  .data-table td.text-center {
    text-align: center;
  }

  .data-table tr:hover {
    background: var(--grey-50);
  }

  /* Badge */
  .badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .badge.high {
    background: var(--error-light);
    color: var(--error-main);
  }

  .badge.medium {
    background: var(--warning-light);
    color: var(--warning-main);
  }

  .badge.low {
    background: var(--success-light);
    color: var(--success-main);
  }

  /* 차트 컨테이너 */
  .chart-container {
    position: relative;
    height: 400px;
    margin-top: 20px;
  }

  .chart-container.small {
    height: 300px;
  }

  /* 로딩 */
  .loading {
    text-align: center;
    padding: 60px 40px;
    color: var(--grey-500);
  }

  /* 서브탭 */
  .subtab-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 16px;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
  }

  .subtab-btn {
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid #b0bec5;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s;
    background: white;
    color: #546e7a;
  }

  .subtab-btn.active {
    background: #673ab7;
    color: white;
    border-color: #673ab7;
  }

  /* 인사이트 배너 */
  .insight-banner {
    padding: 20px 24px;
    border-bottom: 1px solid #e9ecef;
  }

  .insight-banner.blue {
    background: linear-gradient(135deg, #e3f2fd 0%, #f5faff 100%);
  }

  .insight-banner.yellow {
    background: linear-gradient(135deg, #fff8e1 0%, #fffef5 100%);
  }

  .insight-banner.green {
    background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  }

  .insight-banner-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .insight-banner-title.blue {
    color: #1565c0;
  }

  .insight-banner-title.yellow {
    color: #f57c00;
  }

  .insight-banner-title.green {
    color: #1b5e20;
  }

  .insight-banner-text {
    font-size: 13px;
    color: #424242;
    line-height: 1.8;
  }

  /* AI 컨설턴트 카드 */
  .ai-consultant-card {
    margin-bottom: 20px;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  }

  .ai-consultant-card-inner {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  .ai-consultant-icon {
    font-size: 48px;
    line-height: 1;
  }

  .ai-consultant-content {
    flex: 1;
  }

  .ai-consultant-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .ai-consultant-title {
    font-size: 18px;
    font-weight: 700;
  }

  .ai-consultant-period-badge {
    font-size: 11px;
    background: rgba(255,255,255,0.25);
    padding: 3px 10px;
    border-radius: 12px;
    margin-left: auto;
  }

  .ai-consultant-metrics {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 12px;
  }

  .ai-consultant-metric {
    padding: 6px 14px;
    background: rgba(255,255,255,0.2);
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
  }

  .ai-consultant-message {
    font-size: 14px;
    opacity: 0.95;
    line-height: 1.7;
    padding: 12px;
    background: rgba(255,255,255,0.15);
    border-radius: 10px;
  }

  /* KPI 대시보드 그리드 */
  .kpi-dashboard-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }

  .kpi-dashboard-card {
    padding: 16px;
    border-radius: 12px;
    position: relative;
  }

  .kpi-dashboard-label {
    font-size: 11px;
    color: var(--grey-600);
    margin-bottom: 4px;
  }

  .kpi-dashboard-value {
    font-size: 24px;
    font-weight: 800;
  }

  .kpi-status-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 600;
    color: white;
  }

  /* 스토리라인 요약 */
  .storyline-summary {
    margin-bottom: 20px;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 12px;
    border-left: 4px solid;
  }

  .storyline-text {
    font-size: 14px;
    color: var(--grey-900);
    line-height: 1.7;
  }

  /* 액션 가이드 섹션 */
  .action-guide-section {
    margin-bottom: 20px;
    border: 1px solid var(--grey-200);
    border-radius: 12px;
    overflow: hidden;
  }

  .action-guide-tabs {
    display: flex;
    background: #f8f9fa;
    border-bottom: 1px solid var(--grey-200);
  }

  .action-guide-tab {
    flex: 1;
    padding: 12px 16px;
    font-size: 12px;
    font-weight: 600;
    border: none;
    background: #f8f9fa;
    color: var(--grey-600);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }

  .action-guide-tab.active {
    background: white;
    color: var(--primary-main);
    border-bottom-color: var(--primary-main);
  }

  .action-guide-content {
    padding: 16px;
  }

  .action-cards-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  /* 액션 카드 */
  .action-card {
    border-radius: 10px;
    padding: 14px;
    transition: transform 0.2s;
  }

  .action-card:hover {
    transform: translateY(-2px);
  }

  .action-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .action-card-icon {
    font-size: 18px;
  }

  .action-card-title {
    font-size: 13px;
    font-weight: 700;
  }

  .action-card-subtitle {
    font-size: 10px;
    opacity: 0.8;
  }

  .action-card-badge {
    font-size: 9px;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 600;
    color: white;
  }

  .action-card-metrics {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }

  .action-card-metric {
    background: white;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 500;
  }

  .action-card-recommendation {
    background: #ffffff;
    border-radius: 6px;
    padding: 10px;
    border-left: 3px solid;
  }

  .action-card-rec-title {
    font-size: 10px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .action-card-rec-text {
    font-size: 11px;
    color: #333;
    line-height: 1.4;
  }

  /* 채널 성과 순위 테이블 */
  .channel-ranking-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }

  .channel-ranking-table th {
    padding: 10px 12px;
    text-align: left;
    font-weight: 600;
    color: var(--grey-700);
    background: #f5f5f5;
  }

  .channel-ranking-table th.text-right {
    text-align: right;
  }

  .channel-ranking-table th.text-center {
    text-align: center;
  }

  .channel-ranking-table td {
    padding: 10px 12px;
    border-bottom: 1px solid #f0f0f0;
  }

  .channel-ranking-table td.text-right {
    text-align: right;
  }

  .channel-ranking-table td.text-center {
    text-align: center;
  }

  .verdict-badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
  }

  /* 더보기 버튼 */
  .show-more-btn {
    padding: 8px 20px;
    font-size: 12px;
    font-weight: 500;
    border: 1px solid var(--grey-300);
    border-radius: 20px;
    cursor: pointer;
    background: white;
    color: var(--grey-700);
    transition: all 0.2s;
  }

  .show-more-btn:hover {
    background: var(--grey-100);
  }

  /* 타겟 요약 그리드 */
  .target-summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .target-summary-card {
    padding: 12px;
    border-radius: 10px;
    text-align: center;
  }

  .target-summary-icon {
    font-size: 24px;
    margin-bottom: 4px;
  }

  .target-summary-label {
    font-size: 10px;
    color: var(--grey-500);
    margin-bottom: 2px;
  }

  .target-summary-value {
    font-size: 16px;
    font-weight: 800;
  }

  .target-summary-metric {
    font-size: 11px;
    color: var(--grey-600);
    margin-top: 4px;
  }

  /* 4분면 매트릭스 그리드 */
  .matrix-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .matrix-card {
    border-radius: 10px;
    padding: 14px;
    transition: transform 0.2s;
  }

  .matrix-card:hover {
    transform: translateY(-2px);
  }

  .matrix-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .matrix-card-icon {
    font-size: 18px;
  }

  .matrix-card-title {
    font-size: 13px;
    font-weight: 700;
  }

  .matrix-card-subtitle {
    font-size: 10px;
    opacity: 0.8;
  }

  .matrix-card-targets {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }

  .matrix-target-badge {
    background: white;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 500;
  }

  /* 경고 서브탭 */
  .warning-subtabs {
    display: flex;
    gap: 8px;
    border-bottom: 2px solid var(--grey-200);
    padding-bottom: 0;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  .warning-subtab {
    padding: 10px 16px;
    font-size: 12px;
    font-weight: 600;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 8px 8px 0 0;
    border-bottom: 3px solid transparent;
    margin-bottom: -2px;
    transition: all 0.2s ease;
  }

  /* 반응형 */
  @media (max-width: 1400px) {
    .kpi-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 768px) {
    .type-dashboard {
      padding: 16px;
    }

    .kpi-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .insights-grid {
      grid-template-columns: 1fr;
    }
  }
`

// ========================================
// 유틸리티 함수
// ========================================

function formatCurrency(value: number): string {
  if (value === null || value === undefined) return '₩0'
  return '₩' + Math.round(value).toLocaleString('ko-KR')
}

function formatNumber(value: number): string {
  if (value === null || value === undefined) return '0'
  return Math.round(value).toLocaleString('ko-KR')
}

function formatPercent(value: number): string {
  if (value === null || value === undefined) return '0%'
  return value.toFixed(1) + '%'
}

function parseCSV(text: string): DimensionRow[] {
  const lines = text.trim().split('\n')

  function parseLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim())
  const result: DimensionRow[] = []

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue

    const values = parseLine(lines[i])
    const obj: DimensionRow = {}

    headers.forEach((header, index) => {
      let value = values[index] || ''
      value = value.replace(/^"|"$/g, '').trim()
      obj[header] = value
    })

    result.push(obj)
  }

  return result
}

// ========================================
// 메인 컴포넌트
// ========================================

export default function TypeDashboardReactView() {
  // ========================================
  // 상태 관리
  // ========================================
  const [insightsData, setInsightsData] = useState<InsightsData | null>(null)
  const [adsetDimensionData, setAdsetDimensionData] = useState<DimensionRow[]>([])
  const [dimensionData, setDimensionData] = useState<DimensionRow[]>([])
  // 각 탭별 dimension 데이터
  const [genderDimensionData, setGenderDimensionData] = useState<DimensionRow[]>([])
  const [ageDimensionData, setAgeDimensionData] = useState<DimensionRow[]>([])
  const [platformDimensionData, setPlatformDimensionData] = useState<DimensionRow[]>([])
  const [devicePlatformDimensionData, setDevicePlatformDimensionData] = useState<DimensionRow[]>([])
  const [deviceTypeDimensionData, setDeviceTypeDimensionData] = useState<DimensionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI 상태
  const [kpiView, setKpiView] = useState<'primary' | 'all'>('primary')
  const [decisionToolExpanded, setDecisionToolExpanded] = useState(false)
  const [currentPeriod, setCurrentPeriod] = useState<'full' | '180d' | '90d'>('full')
  const [activeTab, setActiveTab] = useState<string>('summary')
  const [dayAnalysisSubtab, setDayAnalysisSubtab] = useState<string>('quarterlyTrend')
  const [selectedChannelDay, setSelectedChannelDay] = useState<string>('')
  const [daySortConfig, setDaySortConfig] = useState<{ column: string; direction: 'asc' | 'desc' }>({ column: 'roas', direction: 'desc' })
  const [actionGuideTab, setActionGuideTab] = useState<'quickAction' | 'aiRecommend'>('quickAction')
  const [warningSubtab, setWarningSubtab] = useState<'aiAlert' | 'cpa' | 'products'>('aiAlert')
  const [showMoreRecommendations, setShowMoreRecommendations] = useState(false)

  // 성과 추이 분석 섹션 상태
  const [trendAnalysisExpanded, setTrendAnalysisExpanded] = useState(false)
  const [trendAnalysisTab, setTrendAnalysisTab] = useState<'timeseries' | 'gender' | 'age' | 'platform' | 'devicePlatform' | 'deviceType'>('timeseries')

  // 광고세트(Timeseries) 추이 필터 (HTML: timeseriesFilters)
  const [timeseriesFilters, setTimeseriesFilters] = useState<{
    channel: string[]
    product: string[]
    brand: string[]
    promotion: string[]
  }>({
    channel: [],
    product: [],
    brand: [],
    promotion: []
  })

  // 광고세트(Timeseries) 추이 전용 상태 변수 (HTML과 동일한 명칭)
  const [currentTimeseriesPeriod, setCurrentTimeseriesPeriod] = useState<string>('monthly')
  const [currentTimeseriesMetric, setCurrentTimeseriesMetric] = useState<string>('roas')
  const [timeseriesStartDate, setTimeseriesStartDate] = useState<string>('')
  const [timeseriesEndDate, setTimeseriesEndDate] = useState<string>('')

  // 연령 추이 전용 상태 변수 (HTML과 동일한 명칭)
  const [currentAgePeriod, setCurrentAgePeriod] = useState<string>('monthly')
  const [currentAgeMetric, setCurrentAgeMetric] = useState<string>('roas')
  const [ageStartDate, setAgeStartDate] = useState<string>('')
  const [ageEndDate, setAgeEndDate] = useState<string>('')

  // 플랫폼 추이 전용 상태 변수 (HTML과 동일한 명칭)
  const [currentPlatformPeriod, setCurrentPlatformPeriod] = useState<string>('monthly')
  const [currentPlatformMetric, setCurrentPlatformMetric] = useState<string>('roas')
  const [platformStartDate, setPlatformStartDate] = useState<string>('')
  const [platformEndDate, setPlatformEndDate] = useState<string>('')

  // 기기플랫폼 추이 전용 상태 변수 (HTML과 동일한 명칭)
  const [currentDevicePlatformPeriod, setCurrentDevicePlatformPeriod] = useState<string>('monthly')
  const [currentDevicePlatformMetric, setCurrentDevicePlatformMetric] = useState<string>('roas')
  const [devicePlatformStartDate, setDevicePlatformStartDate] = useState<string>('')
  const [devicePlatformEndDate, setDevicePlatformEndDate] = useState<string>('')

  // 기기유형 추이 전용 상태 변수 (HTML과 동일한 명칭)
  const [currentDeviceTypePeriod, setCurrentDeviceTypePeriod] = useState<string>('monthly')
  const [currentDeviceTypeMetric, setCurrentDeviceTypeMetric] = useState<string>('roas')
  const [deviceTypeStartDate, setDeviceTypeStartDate] = useState<string>('')
  const [deviceTypeEndDate, setDeviceTypeEndDate] = useState<string>('')
  // 드롭다운 열림 상태
  const [trendDropdownOpen, setTrendDropdownOpen] = useState<{
    channel: boolean
    product: boolean
    brand: boolean
    promotion: boolean
    adset: boolean
  }>({
    channel: false,
    product: false,
    brand: false,
    promotion: false,
    adset: false
  })

  // 성별 추이 필터 상태
  const [currentGenderFilters, setCurrentGenderFilters] = useState<{
    channel: string[]
    product: string[]
    brand: string[]
    promotion: string[]
    adset: string[]
  }>({
    channel: [],
    product: [],
    brand: [],
    promotion: [],
    adset: []
  })
  // 연령 추이 필터 상태
  const [currentAgeFilters, setCurrentAgeFilters] = useState<{
    channel: string[]
    product: string[]
    brand: string[]
    promotion: string[]
    adset: string[]
  }>({
    channel: [],
    product: [],
    brand: [],
    promotion: [],
    adset: []
  })
  // 플랫폼 추이 필터 상태
  const [currentPlatformFilters, setCurrentPlatformFilters] = useState<{
    channel: string[]
    product: string[]
    brand: string[]
    promotion: string[]
    adset: string[]
  }>({
    channel: [],
    product: [],
    brand: [],
    promotion: [],
    adset: []
  })
  // 기기플랫폼 추이 필터 상태
  const [currentDevicePlatformFilters, setCurrentDevicePlatformFilters] = useState<{
    channel: string[]
    product: string[]
    brand: string[]
    promotion: string[]
    adset: string[]
  }>({
    channel: [],
    product: [],
    brand: [],
    promotion: [],
    adset: []
  })
  // 기기 추이 필터 상태
  const [currentDeviceTypeFilters, setCurrentDeviceTypeFilters] = useState<{
    channel: string[]
    product: string[]
    brand: string[]
    promotion: string[]
    adset: string[]
  }>({
    channel: [],
    product: [],
    brand: [],
    promotion: [],
    adset: []
  })

  // 성별 추이 전용 상태 변수 (HTML과 동일한 명칭)
  const [currentGenderPeriod, setCurrentGenderPeriod] = useState<string>('monthly')
  const [currentGenderMetric, setCurrentGenderMetric] = useState<string>('roas')
  const [genderStartDate, setGenderStartDate] = useState<string>('')
  const [genderEndDate, setGenderEndDate] = useState<string>('')

  // ========================================
  // 성과 테이블 분석 상태 관리 (HTML perfTableState 1:1)
  // ========================================
  const [perfTableActiveTab, setPerfTableActiveTab] = useState<string>('adset')
  const [perfTableState, setPerfTableState] = useState<{
    adset: { filters: { channel: string[], product: string[], brand: string[], promotion: string[] }, startDate: string, endDate: string, sortColumn: string, sortDirection: string }
    gender: { filters: { channel: string[], product: string[], brand: string[], promotion: string[] }, startDate: string, endDate: string, sortColumn: string, sortDirection: string }
    age: { filters: { channel: string[], product: string[], brand: string[], promotion: string[] }, startDate: string, endDate: string, sortColumn: string, sortDirection: string }
    platform: { filters: { channel: string[], product: string[], brand: string[], promotion: string[] }, startDate: string, endDate: string, sortColumn: string, sortDirection: string }
    devicePlatform: { filters: { channel: string[], product: string[], brand: string[], promotion: string[] }, startDate: string, endDate: string, sortColumn: string, sortDirection: string }
    deviceType: { filters: { channel: string[], product: string[], brand: string[], promotion: string[] }, startDate: string, endDate: string, sortColumn: string, sortDirection: string }
    genderAge: { filters: { channel: string[], product: string[], brand: string[], promotion: string[] }, startDate: string, endDate: string }
  }>({
    adset: { filters: { channel: [], product: [], brand: [], promotion: [] }, startDate: '', endDate: '', sortColumn: 'roas', sortDirection: 'desc' },
    gender: { filters: { channel: [], product: [], brand: [], promotion: [] }, startDate: '', endDate: '', sortColumn: 'roas', sortDirection: 'desc' },
    age: { filters: { channel: [], product: [], brand: [], promotion: [] }, startDate: '', endDate: '', sortColumn: 'roas', sortDirection: 'desc' },
    platform: { filters: { channel: [], product: [], brand: [], promotion: [] }, startDate: '', endDate: '', sortColumn: 'roas', sortDirection: 'desc' },
    devicePlatform: { filters: { channel: [], product: [], brand: [], promotion: [] }, startDate: '', endDate: '', sortColumn: 'roas', sortDirection: 'desc' },
    deviceType: { filters: { channel: [], product: [], brand: [], promotion: [] }, startDate: '', endDate: '', sortColumn: 'roas', sortDirection: 'desc' },
    genderAge: { filters: { channel: [], product: [], brand: [], promotion: [] }, startDate: '', endDate: '' }
  })
  const [perfTableDropdownOpen, setPerfTableDropdownOpen] = useState<{ [key: string]: boolean }>({})
  const [pivotDimensionData, setPivotDimensionData] = useState<Record<string, unknown>[]>([])
  const [perfTableExpanded, setPerfTableExpanded] = useState<boolean>(false)

  // ========== 성과 구분 비교 분석 섹션 State (HTML 1:1) ==========
  const [perfAnalysisExpanded, setPerfAnalysisExpanded] = useState<boolean>(false)
  const [perfAnalysisActiveTab, setPerfAnalysisActiveTab] = useState<string>('brand')
  const [perfChartState, setPerfChartState] = useState<{
    brand: { kpi: string; sort: string; startDate: string; endDate: string; compareActive: boolean; startDateComp: string; endDateComp: string; showAll: boolean; totalCount: number }
    product: { kpi: string; sort: string; startDate: string; endDate: string; compareActive: boolean; startDateComp: string; endDateComp: string; showAll: boolean; totalCount: number }
    promotion: { kpi: string; sort: string; startDate: string; endDate: string; compareActive: boolean; startDateComp: string; endDateComp: string; showAll: boolean; totalCount: number }
    targeting: { kpi: string; sort: string; startDate: string; endDate: string; compareActive: boolean; startDateComp: string; endDateComp: string; showAll: boolean; totalCount: number }
  }>({
    brand: { kpi: 'roas', sort: 'desc', startDate: '', endDate: '', compareActive: false, startDateComp: '', endDateComp: '', showAll: false, totalCount: 0 },
    product: { kpi: 'roas', sort: 'desc', startDate: '', endDate: '', compareActive: false, startDateComp: '', endDateComp: '', showAll: false, totalCount: 0 },
    promotion: { kpi: 'roas', sort: 'desc', startDate: '', endDate: '', compareActive: false, startDateComp: '', endDateComp: '', showAll: false, totalCount: 0 },
    targeting: { kpi: 'roas', sort: 'desc', startDate: '', endDate: '', compareActive: false, startDateComp: '', endDateComp: '', showAll: false, totalCount: 0 }
  })

  // 성과 분석 상수 (HTML 1:1)
  const DETAIL_DEFAULT_LIMIT = 10
  const DETAIL_EXPANDED_LIMIT = 50

  // KPI별 색상 (HTML kpiColors 1:1)
  const kpiColors: Record<string, { bg: string; border: string }> = {
    roas: { bg: 'rgba(0, 200, 83, 0.8)', border: 'rgba(0, 200, 83, 1)' },
    cost: { bg: 'rgba(255, 152, 0, 0.8)', border: 'rgba(255, 152, 0, 1)' },
    cpa: { bg: 'rgba(244, 67, 54, 0.8)', border: 'rgba(244, 67, 54, 1)' },
    conversions: { bg: 'rgba(33, 150, 243, 0.8)', border: 'rgba(33, 150, 243, 1)' },
    revenue: { bg: 'rgba(156, 39, 176, 0.8)', border: 'rgba(156, 39, 176, 1)' }
  }

  // KPI별 라벨 (HTML kpiLabels 1:1)
  const kpiLabels: Record<string, string> = {
    roas: 'ROAS (%)',
    cost: '비용 (원)',
    cpa: 'CPA (원)',
    conversions: '전환수',
    revenue: '전환값 (원)'
  }

  // 비교 기간 색상 (HTML compareColors 1:1)
  const perfCompareColors = {
    current: { bg: 'rgba(0, 200, 83, 0.8)', border: 'rgba(0, 200, 83, 1)' },
    previous: { bg: 'rgba(158, 158, 158, 0.5)', border: 'rgba(158, 158, 158, 1)' }
  }

  // ========================================
  // 리타겟팅 분석 State (HTML retargetingSortState 1:1)
  // ========================================
  const [retargetingExpanded, setRetargetingExpanded] = useState<boolean>(false)
  const [retargetingActiveTab, setRetargetingActiveTab] = useState<string>('ageGender')
  const [retargetingSortState, setRetargetingSortState] = useState<{
    ageGender: { column: string; direction: string }
    device: { column: string; direction: string }
    platform: { column: string; direction: string }
    devicePlatform: { column: string; direction: string }
  }>({
    ageGender: { column: 'roas', direction: 'desc' },
    device: { column: 'roas', direction: 'desc' },
    platform: { column: 'roas', direction: 'desc' },
    devicePlatform: { column: 'roas', direction: 'desc' }
  })

  // 테이블 지표 정의 (HTML perfTableMetrics 1:1)
  const perfTableMetrics = [
    { key: 'cost', label: '비용', format: (v: number) => formatCurrency(v) },
    { key: 'impressions', label: '노출수', format: (v: number) => formatNumber(v) },
    { key: 'cpm', label: 'CPM', format: (v: number) => formatCurrency(v) },
    { key: 'clicks', label: '클릭수', format: (v: number) => formatNumber(v) },
    { key: 'cpc', label: 'CPC', format: (v: number) => formatCurrency(v) },
    { key: 'ctr', label: 'CTR', format: (v: number) => v.toFixed(2) + '%' },
    { key: 'conversions', label: '전환수', format: (v: number) => formatNumber(v) },
    { key: 'cpa', label: 'CPA', format: (v: number) => formatCurrency(v) },
    { key: 'cvr', label: '전환율', format: (v: number) => v.toFixed(2) + '%' },
    { key: 'revenue', label: '전환값', format: (v: number) => formatCurrency(v) },
    { key: 'roas', label: 'ROAS', format: (v: number) => v.toFixed(1) + '%' }
  ]

  // 색상 스케일 함수 (HTML getPerfTableColorScale 1:1)
  const getPerfTableColorScale = (value: number, min: number, max: number, isInverse: boolean = false): string => {
    if (max === min) return 'rgba(103, 58, 183, 0.1)'
    let ratio = (value - min) / (max - min)
    if (isInverse) ratio = 1 - ratio
    const r = Math.round(255 - (152 * ratio))
    const g = Math.round(255 - (197 * ratio))
    const b = Math.round(255 - (72 * ratio))
    const alpha = 0.1 + (ratio * 0.3)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // isValidAge 함수 (HTML 1:1)
  const isValidAge = (age: string | null | undefined): boolean => {
    if (!age || age === '-' || age === '') return false
    return true
  }

  // ========================================
  // 성별 추이 헬퍼 함수 (HTML 1:1 복사)
  // ========================================
  // HTML의 isValidGender 함수
  const isValidGender = (gender: string | null | undefined): boolean => {
    if (!gender || gender === '-') return false
    const genderStr = String(gender).trim().toLowerCase()
    const unknownPattern = /^(구분없음|알\s?수\s?없음|un.*|unknown)/i
    return !unknownPattern.test(genderStr)
  }

  // HTML의 normalizeGender 함수
  const normalizeGender = (gender: string | null | undefined): string | null => {
    if (!isValidGender(gender)) return null
    const genderStr = String(gender).trim().toLowerCase()
    if (/^(남자|남성|male|m)$/i.test(genderStr)) return '남성'
    if (/^(여자|여성|female|f)$/i.test(genderStr)) return '여성'
    return gender as string
  }

  // HTML의 getGenderDisplayName 함수
  const getGenderDisplayName = (normalizedGender: string): string | null => {
    if (normalizedGender === '남성' || normalizedGender === 'Male') return '남성'
    if (normalizedGender === '여성' || normalizedGender === 'Female') return '여성'
    return null
  }

  // HTML의 getPeriodKey 함수
  const getPeriodKey = (dateString: string, period: string): string => {
    const date = new Date(dateString)
    if (period === 'daily') {
      return dateString
    } else if (period === 'weekly') {
      // 해당 주의 월요일(시작일)을 구함
      const day = date.getDay()
      const diff = date.getDate() - day + (day === 0 ? -6 : 1) // 월요일로 조정
      const monday = new Date(date)
      monday.setDate(diff)
      const year = monday.getFullYear()
      const month = String(monday.getMonth() + 1).padStart(2, '0')
      const dayOfMonth = String(monday.getDate()).padStart(2, '0')
      return `${year}-${month}-${dayOfMonth}`
    } else if (period === 'monthly') {
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      return `${year}-${String(month).padStart(2, '0')}`
    }
    return dateString
  }

  const [showMoreAlerts, setShowMoreAlerts] = useState(false)
  const [showMoreCpa, setShowMoreCpa] = useState(false)
  const [expandedTopAdsets, setExpandedTopAdsets] = useState(false)
  const [expandedDevicePlatform, setExpandedDevicePlatform] = useState(false)
  const [expandedDevice, setExpandedDevice] = useState(false)
  const [expandedAgeGender, setExpandedAgeGender] = useState(false)
  const [expandedAiOpportunity, setExpandedAiOpportunity] = useState(false)
  const [expandedAiAction, setExpandedAiAction] = useState(false)
  const [forecastSubtab, setForecastSubtab] = useState<string>('product')

  // ========================================
  // 데이터 로딩
  // ========================================
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        // insights.json 로딩
        const insightsResponse = await fetch('/type/insights.json?t=' + Date.now())
        const insightsJson = await insightsResponse.json()
        setInsightsData(insightsJson)

        // adset dimension data 로딩
        try {
          const adsetResponse = await fetch('/type/dimension_type1_campaign_adset.csv')
          const adsetText = await adsetResponse.text()
          setAdsetDimensionData(parseCSV(adsetText))
        } catch (err) {
          console.warn('광고세트 차원 데이터 로딩 실패:', err)
        }

        // merged_data.csv 로딩
        try {
          const dimensionResponse = await fetch('/type/merged_data.csv')
          const dimensionText = await dimensionResponse.text()
          setDimensionData(parseCSV(dimensionText))
        } catch (err) {
          console.warn('차원 데이터 로딩 실패:', err)
        }

        // 성별 추이 데이터 로딩
        try {
          const genderResponse = await fetch('/type/dimension_type4_adset_gender.csv')
          const genderText = await genderResponse.text()
          setGenderDimensionData(parseCSV(genderText))
        } catch (err) {
          console.warn('성별 차원 데이터 로딩 실패:', err)
        }

        // 연령 추이 데이터 로딩
        try {
          const ageResponse = await fetch('/type/dimension_type3_adset_age.csv')
          const ageText = await ageResponse.text()
          setAgeDimensionData(parseCSV(ageText))
        } catch (err) {
          console.warn('연령 차원 데이터 로딩 실패:', err)
        }

        // 플랫폼 추이 데이터 로딩
        try {
          const platformResponse = await fetch('/type/dimension_type6_adset_platform.csv')
          const platformText = await platformResponse.text()
          setPlatformDimensionData(parseCSV(platformText))
        } catch (err) {
          console.warn('플랫폼 차원 데이터 로딩 실패:', err)
        }

        // 기기플랫폼 추이 데이터 로딩
        try {
          const devicePlatformResponse = await fetch('/type/dimension_type7_adset_deviceplatform.csv')
          const devicePlatformText = await devicePlatformResponse.text()
          setDevicePlatformDimensionData(parseCSV(devicePlatformText))
        } catch (err) {
          console.warn('기기플랫폼 차원 데이터 로딩 실패:', err)
        }

        // 기기 추이 데이터 로딩
        try {
          const deviceResponse = await fetch('/type/dimension_type5_adset_device.csv')
          const deviceText = await deviceResponse.text()
          setDeviceTypeDimensionData(parseCSV(deviceText))
        } catch (err) {
          console.warn('기기 차원 데이터 로딩 실패:', err)
        }

        // 성별연령 PIVOT 데이터 로딩 (성과 테이블 분석용)
        try {
          const pivotResponse = await fetch('/type/dimension_type2_adset_age_gender.csv')
          const pivotText = await pivotResponse.text()
          setPivotDimensionData(parseCSV(pivotText))
        } catch (err) {
          console.warn('성별연령 PIVOT 차원 데이터 로딩 실패:', err)
        }

        setLoading(false)
      } catch (err) {
        console.error('데이터 로딩 실패:', err)
        setError('데이터를 불러오는데 실패했습니다.')
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // 기간 및 필터 옵션 초기화
  useEffect(() => {
    if (adsetDimensionData.length > 0) {
      // 날짜 범위 추출
      const dates = adsetDimensionData
        .map(row => row['일'] as string)
        .filter(date => date && date !== '' && date !== '-')
        .map(date => new Date(date))
        .filter(date => !isNaN(date.getTime()))

      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
        const formatDate = (d: Date) => d.toISOString().split('T')[0]
        setTimeseriesStartDate(formatDate(minDate))
        setTimeseriesEndDate(formatDate(maxDate))
      }
    }
  }, [adsetDimensionData])

  // 성별 추이 기간 선택 초기값 설정 (HTML 1:1)
  useEffect(() => {
    if (genderDimensionData.length > 0) {
      const dates = genderDimensionData
        .map(row => row['일'] as string)
        .filter(date => date && date !== '' && date !== '-')
        .map(date => new Date(date))
        .filter(date => !isNaN(date.getTime()))

      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
        const formatDateForInput = (d: Date) => {
          const year = d.getFullYear()
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
        setGenderStartDate(formatDateForInput(minDate))
        setGenderEndDate(formatDateForInput(maxDate))
      }
    }
  }, [genderDimensionData])

  // 연령 추이 기간 선택 초기값 설정 (HTML 1:1)
  useEffect(() => {
    if (ageDimensionData.length > 0) {
      const dates = ageDimensionData
        .map(row => row['일'] as string)
        .filter(date => date && date !== '' && date !== '-')
        .map(date => new Date(date))
        .filter(date => !isNaN(date.getTime()))

      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
        const formatDateForInput = (d: Date) => {
          const year = d.getFullYear()
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
        setAgeStartDate(formatDateForInput(minDate))
        setAgeEndDate(formatDateForInput(maxDate))
      }
    }
  }, [ageDimensionData])

  // 플랫폼 추이 기간 선택 초기값 설정 (HTML 1:1)
  useEffect(() => {
    if (platformDimensionData.length > 0) {
      const dates = platformDimensionData
        .map(row => row['일'] as string)
        .filter(date => date && date !== '' && date !== '-')
        .map(date => new Date(date))
        .filter(date => !isNaN(date.getTime()))

      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
        const formatDateForInput = (d: Date) => {
          const year = d.getFullYear()
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
        setPlatformStartDate(formatDateForInput(minDate))
        setPlatformEndDate(formatDateForInput(maxDate))
      }
    }
  }, [platformDimensionData])

  // 기기플랫폼 추이 기간 선택 초기값 설정 (HTML 1:1)
  useEffect(() => {
    if (devicePlatformDimensionData.length > 0) {
      const dates = devicePlatformDimensionData
        .map(row => row['일'] as string)
        .filter(date => date && date !== '' && date !== '-')
        .map(date => new Date(date))
        .filter(date => !isNaN(date.getTime()))

      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
        const formatDateForInput = (d: Date) => {
          const year = d.getFullYear()
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
        setDevicePlatformStartDate(formatDateForInput(minDate))
        setDevicePlatformEndDate(formatDateForInput(maxDate))
      }
    }
  }, [devicePlatformDimensionData])

  // 기기 추이 기간 선택 초기값 설정 (HTML 1:1)
  useEffect(() => {
    if (deviceTypeDimensionData.length > 0) {
      const dates = deviceTypeDimensionData
        .map(row => row['일'] as string)
        .filter(date => date && date !== '' && date !== '-')
        .map(date => new Date(date))
        .filter(date => !isNaN(date.getTime()))

      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
        const formatDateForInput = (d: Date) => {
          const year = d.getFullYear()
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
        setDeviceTypeStartDate(formatDateForInput(minDate))
        setDeviceTypeEndDate(formatDateForInput(maxDate))
      }
    }
  }, [deviceTypeDimensionData])

  // 성과 테이블 분석 날짜 초기값 설정 (HTML initPerfTableDates 1:1)
  useEffect(() => {
    if (adsetDimensionData.length > 0) {
      const dates = adsetDimensionData.map(row => row['일'] as string).filter(d => d).sort()
      if (dates.length > 0) {
        const minDate = dates[0]
        const maxDate = dates[dates.length - 1]
        setPerfTableState(prev => ({
          ...prev,
          adset: { ...prev.adset, startDate: minDate, endDate: maxDate },
          gender: { ...prev.gender, startDate: minDate, endDate: maxDate },
          age: { ...prev.age, startDate: minDate, endDate: maxDate },
          platform: { ...prev.platform, startDate: minDate, endDate: maxDate },
          devicePlatform: { ...prev.devicePlatform, startDate: minDate, endDate: maxDate },
          deviceType: { ...prev.deviceType, startDate: minDate, endDate: maxDate },
          genderAge: { ...prev.genderAge, startDate: minDate, endDate: maxDate }
        }))
      }
    }
  }, [adsetDimensionData])

  // 성과 구분 비교 분석 날짜 초기값 설정 (HTML initPerfChartDates 1:1)
  useEffect(() => {
    if (adsetDimensionData.length > 0) {
      const dates = adsetDimensionData.map(row => row['일'] as string).filter(d => d).map(d => new Date(d)).filter(d => !isNaN(d.getTime()))
      if (dates.length > 0) {
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
        const startDate = new Date(maxDate)
        startDate.setDate(maxDate.getDate() - 29) // 최근 30일
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
        const adjustedStart = startDate < minDate ? minDate : startDate
        const startStr = adjustedStart.toISOString().split('T')[0]
        const endStr = maxDate.toISOString().split('T')[0]
        setPerfChartState(prev => ({
          ...prev,
          brand: { ...prev.brand, startDate: startStr, endDate: endStr },
          product: { ...prev.product, startDate: startStr, endDate: endStr },
          promotion: { ...prev.promotion, startDate: startStr, endDate: endStr },
          targeting: { ...prev.targeting, startDate: startStr, endDate: endStr }
        }))
      }
    }
  }, [adsetDimensionData])

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.trend-filter-dropdown')) {
        setTrendDropdownOpen({ channel: false, product: false, brand: false, promotion: false, adset: false })
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // 필터 옵션 계산 (adsetDimensionData에서 고유값 추출)
  const trendFilterOptions = useMemo(() => {
    if (adsetDimensionData.length === 0) {
      return { channels: [], products: [], brands: [], promotions: [] }
    }

    const channels = [...new Set(adsetDimensionData.map(row => row['유형구분'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const products = [...new Set(adsetDimensionData.map(row => row['상품명'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const brands = [...new Set(adsetDimensionData.map(row => row['브랜드명'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const promotions = [...new Set(adsetDimensionData.map(row => row['프로모션'] as string).filter(v => v && v !== '' && v !== '-'))].sort()

    return { channels, products, brands, promotions }
  }, [adsetDimensionData])

  // 필터링된 광고세트 수 및 차트 데이터 계산
  const filteredTrendData = useMemo(() => {
    if (adsetDimensionData.length === 0) {
      return { adsetsToShow: new Set<string>(), chartData: null, hasActiveFilters: false }
    }

    const filterMap: Record<string, string> = {
      'channel': '유형구분',
      'product': '상품명',
      'brand': '브랜드명',
      'promotion': '프로모션'
    }

    // 활성화된 필터가 있는지 확인
    const hasActiveFilters = Object.values(timeseriesFilters).some(arr => arr.length > 0)

    // 필터 조건을 만족하는 광고세트 찾기
    const adsetsToShow = new Set<string>()
    adsetDimensionData.forEach(row => {
      const adset = row['광고세트'] as string
      if (!adset || adset === '-') return

      // 날짜 필터
      const rowDate = row['일'] as string
      if (rowDate && timeseriesStartDate && timeseriesEndDate) {
        const d = new Date(rowDate)
        if (d < new Date(timeseriesStartDate) || d > new Date(timeseriesEndDate)) return
      }

      // 모든 필터를 AND 조건으로 확인
      let matchesAllFilters = true
      Object.keys(filterMap).forEach(filterKey => {
        const column = filterMap[filterKey]
        const selectedValues = timeseriesFilters[filterKey as keyof typeof timeseriesFilters]

        if (selectedValues && selectedValues.length > 0) {
          const rowValue = row[column] as string
          if (!selectedValues.includes(rowValue)) {
            matchesAllFilters = false
          }
        }
      })

      if (matchesAllFilters) {
        adsetsToShow.add(adset)
      }
    })

    if (!hasActiveFilters || adsetsToShow.size === 0) {
      return { adsetsToShow, chartData: null, hasActiveFilters }
    }

    // 광고세트별 기간별 데이터 집계
    const aggregatedData: Record<string, Record<string, { cost: number; revenue: number; conversions: number; impressions: number; clicks: number }>> = {}
    adsetsToShow.forEach(adset => {
      aggregatedData[adset] = {}
    })

    adsetDimensionData.forEach(row => {
      const adset = row['광고세트'] as string
      if (!adsetsToShow.has(adset)) return

      const rowDate = row['일'] as string
      if (!rowDate || rowDate === '-') return

      // 날짜 필터
      if (timeseriesStartDate && timeseriesEndDate) {
        const d = new Date(rowDate)
        if (d < new Date(timeseriesStartDate) || d > new Date(timeseriesEndDate)) return
      }

      // 필터 체크
      let matchesAllFilters = true
      Object.keys(filterMap).forEach(filterKey => {
        const column = filterMap[filterKey]
        const selectedValues = timeseriesFilters[filterKey as keyof typeof timeseriesFilters]
        if (selectedValues && selectedValues.length > 0) {
          const rowValue = row[column] as string
          if (!selectedValues.includes(rowValue)) {
            matchesAllFilters = false
          }
        }
      })
      if (!matchesAllFilters) return

      // 기간 집계 키 계산
      let periodKey = ''
      const date = new Date(rowDate)
      if (currentTimeseriesPeriod === 'monthly') {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      } else if (currentTimeseriesPeriod === 'weekly') {
        const startOfYear = new Date(date.getFullYear(), 0, 1)
        const weekNum = Math.ceil((((date.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7)
        periodKey = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
      } else {
        periodKey = rowDate
      }

      if (!aggregatedData[adset][periodKey]) {
        aggregatedData[adset][periodKey] = { cost: 0, revenue: 0, conversions: 0, impressions: 0, clicks: 0 }
      }

      aggregatedData[adset][periodKey].cost += parseFloat(String(row['비용'])) || 0
      aggregatedData[adset][periodKey].revenue += parseFloat(String(row['전환값'])) || 0
      aggregatedData[adset][periodKey].conversions += parseFloat(String(row['전환수'])) || 0
      aggregatedData[adset][periodKey].impressions += parseFloat(String(row['노출'])) || 0
      aggregatedData[adset][periodKey].clicks += parseFloat(String(row['클릭'])) || 0
    })

    // 모든 기간 정렬
    const allPeriods = [...new Set(Object.values(aggregatedData).flatMap(data => Object.keys(data)))].sort()

    // 지표별 데이터 계산
    const metricData: Record<string, Record<string, number>> = {}
    adsetsToShow.forEach(adset => {
      metricData[adset] = {}
      Object.entries(aggregatedData[adset]).forEach(([period, data]) => {
        let value = 0
        switch (currentTimeseriesMetric) {
          case 'roas':
            value = data.cost > 0 ? (data.revenue / data.cost) * 100 : 0
            break
          case 'cost':
            value = data.cost
            break
          case 'revenue':
            value = data.revenue
            break
          case 'conversions':
            value = data.conversions
            break
          case 'impressions':
            value = data.impressions
            break
          case 'clicks':
            value = data.clicks
            break
          case 'cpm':
            value = data.impressions > 0 ? (data.cost / data.impressions) * 1000 : 0
            break
          case 'cpc':
            value = data.clicks > 0 ? data.cost / data.clicks : 0
            break
          case 'cpa':
            value = data.conversions > 0 ? data.cost / data.conversions : 0
            break
          case 'ctr':
            value = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0
            break
          case 'cvr':
            value = data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0
            break
        }
        metricData[adset][period] = value
      })
    })

    // Chart.js 데이터 생성
    const colors = ['#673ab7', '#2196f3', '#4caf50', '#ff9800', '#f44336', '#e91e63', '#009688', '#795548', '#607d8b', '#3f51b5']
    const adsetArray = Array.from(adsetsToShow).sort()
    const datasets = adsetArray.map((adset, index) => ({
      label: adset,
      data: allPeriods.map(period => metricData[adset][period] || 0),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '20',
      borderWidth: 2,
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6
    }))

    const chartData = {
      labels: allPeriods,
      datasets,
      aggregatedData
    }

    return { adsetsToShow, chartData, hasActiveFilters }
  }, [adsetDimensionData, timeseriesFilters, timeseriesStartDate, timeseriesEndDate, currentTimeseriesPeriod, currentTimeseriesMetric])

  // ========================================
  // 성별 추이 필터 옵션 및 데이터 계산
  // ========================================
  const genderFilterOptions = useMemo(() => {
    if (genderDimensionData.length === 0) {
      return { channels: [], products: [], brands: [], promotions: [], adsets: [], genders: [] }
    }
    const channels = [...new Set(genderDimensionData.map(row => row['유형구분'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const products = [...new Set(genderDimensionData.map(row => row['상품명'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const brands = [...new Set(genderDimensionData.map(row => row['브랜드명'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const promotions = [...new Set(genderDimensionData.map(row => row['프로모션'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const adsets = [...new Set(genderDimensionData.map(row => row['광고세트'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const genders = [...new Set(genderDimensionData.map(row => row['성별'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    return { channels, products, brands, promotions, adsets, genders }
  }, [genderDimensionData])

  const filteredGenderData = useMemo(() => {
    if (genderDimensionData.length === 0) {
      return { gendersToShow: new Set<string>(), chartData: null, hasActiveFilters: false }
    }

    const filterMap: Record<string, string> = {
      'channel': '유형구분',
      'product': '상품명',
      'brand': '브랜드명',
      'promotion': '프로모션',
      'adset': '광고세트'
    }

    // 필터 조건을 만족하는 행만 필터링하는 헬퍼 함수
    const rowMatchesFilters = (row: Record<string, unknown>): boolean => {
      // 모든 필터가 비어있는지 확인
      const allFiltersEmpty = Object.values(currentGenderFilters).every(arr => !arr || arr.length === 0)

      // 모든 필터가 비어있으면 false 반환 (데이터 표시 안 함)
      if (allFiltersEmpty) {
        return false
      }

      // 모든 필터를 AND 조건으로 확인
      for (const filterKey of Object.keys(filterMap)) {
        const column = filterMap[filterKey]
        const selectedValues = currentGenderFilters[filterKey as keyof typeof currentGenderFilters]

        if (selectedValues && selectedValues.length > 0) {
          const rowValue = row[column] as string
          if (!selectedValues.includes(rowValue)) {
            return false
          }
        }
      }
      return true
    }

    // 성별 목록 가져오기 (성별_통합 컬럼 우선 사용)
    const gendersToShow = new Set<string>()
    genderDimensionData.forEach(row => {
      if (rowMatchesFilters(row)) {
        const rawGender = (row['성별_통합'] || row['성별']) as string
        const normalizedGenderValue = normalizeGender(rawGender)
        if (normalizedGenderValue) {
          gendersToShow.add(normalizedGenderValue)
        }
      }
    })

    // 모든 필터가 비어있는지 확인
    const allFiltersEmpty = Object.values(currentGenderFilters).every(arr => !arr || arr.length === 0)

    if (allFiltersEmpty || gendersToShow.size === 0) {
      return { gendersToShow, chartData: null, hasActiveFilters: !allFiltersEmpty }
    }

    // 성별별 일별 데이터 집계
    const timeSeriesData: Record<string, Record<string, { cost: number; revenue: number; conversions: number; impressions: number; clicks: number }>> = {}
    gendersToShow.forEach(gender => {
      timeSeriesData[gender] = {}
    })

    genderDimensionData.forEach(row => {
      if (!rowMatchesFilters(row)) return

      // 성별_통합 컬럼 우선 사용
      const rawGender = (row['성별_통합'] || row['성별']) as string
      const normalizedGenderValue = normalizeGender(rawGender)

      if (normalizedGenderValue && gendersToShow.has(normalizedGenderValue) && row['일']) {
        const date = row['일'] as string

        // 기간 필터링
        if (genderStartDate || genderEndDate) {
          const rowDate = new Date(date)
          if (isNaN(rowDate.getTime())) return
          if (genderStartDate && rowDate < new Date(genderStartDate)) return
          if (genderEndDate && rowDate > new Date(genderEndDate)) return
        }

        const cost = parseFloat(String(row['비용'])?.replace(/,/g, '') || String(row['비용'])) || 0
        const revenue = parseFloat(String(row['전환값'])?.replace(/,/g, '') || String(row['전환값'])) || 0
        const conversions = parseFloat(String(row['전환수'])?.replace(/,/g, '') || String(row['전환수'])) || 0
        const impressions = parseFloat(String(row['노출'])?.replace(/,/g, '') || String(row['노출'])) || 0
        const clicks = parseFloat(String(row['클릭'])?.replace(/,/g, '') || String(row['클릭'])) || 0

        if (!timeSeriesData[normalizedGenderValue][date]) {
          timeSeriesData[normalizedGenderValue][date] = {
            cost: 0,
            revenue: 0,
            conversions: 0,
            impressions: 0,
            clicks: 0
          }
        }
        timeSeriesData[normalizedGenderValue][date].cost += cost
        timeSeriesData[normalizedGenderValue][date].revenue += revenue
        timeSeriesData[normalizedGenderValue][date].conversions += conversions
        timeSeriesData[normalizedGenderValue][date].impressions += impressions
        timeSeriesData[normalizedGenderValue][date].clicks += clicks
      }
    })

    // 기간별 집계
    const aggregatedData: Record<string, Record<string, { cost: number; revenue: number; conversions: number; impressions: number; clicks: number }>> = {}
    gendersToShow.forEach(gender => {
      aggregatedData[gender] = {}
    })

    Object.keys(timeSeriesData).forEach(gender => {
      Object.keys(timeSeriesData[gender]).forEach(date => {
        const periodKey = getPeriodKey(date, currentGenderPeriod)
        if (!aggregatedData[gender][periodKey]) {
          aggregatedData[gender][periodKey] = {
            cost: 0,
            revenue: 0,
            conversions: 0,
            impressions: 0,
            clicks: 0
          }
        }
        aggregatedData[gender][periodKey].cost += timeSeriesData[gender][date].cost
        aggregatedData[gender][periodKey].revenue += timeSeriesData[gender][date].revenue
        aggregatedData[gender][periodKey].conversions += timeSeriesData[gender][date].conversions
        aggregatedData[gender][periodKey].impressions += timeSeriesData[gender][date].impressions
        aggregatedData[gender][periodKey].clicks += timeSeriesData[gender][date].clicks
      })
    })

    // 선택된 지표에 따라 데이터 계산
    const metricData: Record<string, Record<string, number>> = {}
    Object.keys(aggregatedData).forEach(gender => {
      metricData[gender] = {}
      Object.keys(aggregatedData[gender]).forEach(period => {
        const { cost, revenue, conversions, impressions, clicks } = aggregatedData[gender][period]

        switch(currentGenderMetric) {
          case 'roas':
            metricData[gender][period] = cost > 0 ? (revenue / cost * 100) : 0
            break
          case 'cost':
            metricData[gender][period] = cost
            break
          case 'revenue':
            metricData[gender][period] = revenue
            break
          case 'conversions':
            metricData[gender][period] = conversions
            break
          case 'impressions':
            metricData[gender][period] = impressions
            break
          case 'clicks':
            metricData[gender][period] = clicks
            break
          case 'cpm':
            metricData[gender][period] = impressions > 0 ? (cost / impressions * 1000) : 0
            break
          case 'cpc':
            metricData[gender][period] = clicks > 0 ? (cost / clicks) : 0
            break
          case 'cpa':
            metricData[gender][period] = conversions > 0 ? (cost / conversions) : 0
            break
          case 'ctr':
            metricData[gender][period] = impressions > 0 ? (clicks / impressions * 100) : 0
            break
          case 'cvr':
            metricData[gender][period] = clicks > 0 ? (conversions / clicks * 100) : 0
            break
          default:
            metricData[gender][period] = 0
        }
      })
    })

    // 기간 정렬
    const allPeriods = [...new Set(Object.values(metricData).flatMap(data => Object.keys(data)))].sort()

    // 데이터셋 생성
    const colors = ['#673ab7', '#2196f3', '#4caf50', '#ff9800', '#f44336']
    const genderArray = Array.from(gendersToShow).sort()
    const datasets = genderArray.map((gender, index) => {
      return {
        label: getGenderDisplayName(gender) || gender,
        data: allPeriods.map(period => metricData[gender][period] || 0),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        borderWidth: 2,
        tension: 0.3
      }
    })

    return { gendersToShow, chartData: { labels: allPeriods, datasets, aggregatedData, genderArray }, hasActiveFilters: !allFiltersEmpty }
  }, [genderDimensionData, currentGenderFilters, genderStartDate, genderEndDate, currentGenderPeriod, currentGenderMetric])

  // ========================================
  // 연령 추이 필터 옵션 및 데이터 계산
  // ========================================
  const ageFilterOptions = useMemo(() => {
    if (ageDimensionData.length === 0) {
      return { channels: [], products: [], brands: [], promotions: [], adsets: [], ages: [] }
    }
    const channels = [...new Set(ageDimensionData.map(row => row['유형구분'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const products = [...new Set(ageDimensionData.map(row => row['상품명'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const brands = [...new Set(ageDimensionData.map(row => row['브랜드명'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const promotions = [...new Set(ageDimensionData.map(row => row['프로모션'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const adsets = [...new Set(ageDimensionData.map(row => row['광고세트'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const ages = [...new Set(ageDimensionData.map(row => row['연령'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    return { channels, products, brands, promotions, adsets, ages }
  }, [ageDimensionData])

  const filteredAgeData = useMemo(() => {
    if (ageDimensionData.length === 0) {
      return { agesToShow: new Set<string>(), chartData: null, hasActiveFilters: false }
    }
    const filterMap: Record<string, string> = {
      'channel': '유형구분', 'product': '상품명', 'brand': '브랜드명', 'promotion': '프로모션', 'adset': '광고세트'
    }
    const hasActiveFilters = Object.values(currentAgeFilters).some(arr => arr.length > 0)
    const agesToShow = new Set<string>()
    ageDimensionData.forEach(row => {
      const age = (row['연령_통합'] || row['연령']) as string
      if (!age || age === '' || age === '-') return
      const rowDate = row['일'] as string
      if (rowDate && ageStartDate && ageEndDate) {
        const d = new Date(rowDate)
        if (d < new Date(ageStartDate) || d > new Date(ageEndDate)) return
      }
      let matchesAllFilters = true
      Object.keys(filterMap).forEach(filterKey => {
        const column = filterMap[filterKey]
        const selectedValues = currentAgeFilters[filterKey as keyof typeof currentAgeFilters]
        if (selectedValues && selectedValues.length > 0) {
          const rowValue = row[column] as string
          if (!selectedValues.includes(rowValue)) matchesAllFilters = false
        }
      })
      if (matchesAllFilters) agesToShow.add(age)
    })
    if (!hasActiveFilters || agesToShow.size === 0) {
      return { agesToShow, chartData: null, hasActiveFilters }
    }
    const aggregatedData: Record<string, Record<string, { cost: number; revenue: number; conversions: number; impressions: number; clicks: number }>> = {}
    agesToShow.forEach(a => { aggregatedData[a] = {} })
    ageDimensionData.forEach(row => {
      const age = (row['연령_통합'] || row['연령']) as string
      if (!agesToShow.has(age)) return
      const rowDate = row['일'] as string
      if (!rowDate || rowDate === '-') return
      if (ageStartDate && ageEndDate) {
        const d = new Date(rowDate)
        if (d < new Date(ageStartDate) || d > new Date(ageEndDate)) return
      }
      let matchesAllFilters = true
      Object.keys(filterMap).forEach(filterKey => {
        const column = filterMap[filterKey]
        const selectedValues = currentAgeFilters[filterKey as keyof typeof currentAgeFilters]
        if (selectedValues && selectedValues.length > 0) {
          const rowValue = row[column] as string
          if (!selectedValues.includes(rowValue)) matchesAllFilters = false
        }
      })
      if (!matchesAllFilters) return
      let periodKey = ''
      const date = new Date(rowDate)
      if (currentAgePeriod === 'monthly') {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      } else if (currentAgePeriod === 'weekly') {
        const startOfYear = new Date(date.getFullYear(), 0, 1)
        const weekNum = Math.ceil((((date.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7)
        periodKey = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
      } else {
        periodKey = rowDate
      }
      if (!aggregatedData[age][periodKey]) {
        aggregatedData[age][periodKey] = { cost: 0, revenue: 0, conversions: 0, impressions: 0, clicks: 0 }
      }
      aggregatedData[age][periodKey].cost += parseFloat(String(row['비용'])) || 0
      aggregatedData[age][periodKey].revenue += parseFloat(String(row['전환값'])) || 0
      aggregatedData[age][periodKey].conversions += parseFloat(String(row['전환수'])) || 0
      aggregatedData[age][periodKey].impressions += parseFloat(String(row['노출'])) || 0
      aggregatedData[age][periodKey].clicks += parseFloat(String(row['클릭'])) || 0
    })
    const allPeriods = [...new Set(Object.values(aggregatedData).flatMap(data => Object.keys(data)))].sort()
    const metricData: Record<string, Record<string, number>> = {}
    agesToShow.forEach(a => {
      metricData[a] = {}
      Object.entries(aggregatedData[a]).forEach(([period, data]) => {
        let value = 0
        switch (currentAgeMetric) {
          case 'roas': value = data.cost > 0 ? (data.revenue / data.cost) * 100 : 0; break
          case 'cost': value = data.cost; break
          case 'revenue': value = data.revenue; break
          case 'conversions': value = data.conversions; break
          case 'impressions': value = data.impressions; break
          case 'clicks': value = data.clicks; break
          case 'cpm': value = data.impressions > 0 ? (data.cost / data.impressions) * 1000 : 0; break
          case 'cpc': value = data.clicks > 0 ? data.cost / data.clicks : 0; break
          case 'cpa': value = data.conversions > 0 ? data.cost / data.conversions : 0; break
          case 'ctr': value = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0; break
          case 'cvr': value = data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0; break
        }
        metricData[a][period] = value
      })
    })
    const colors = ['#673ab7', '#2196f3', '#4caf50', '#ff9800', '#f44336']
    const ageArray = Array.from(agesToShow).sort()
    const datasets = ageArray.map((a, index) => ({
      label: a,
      data: allPeriods.map(period => metricData[a][period] || 0),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '20',
      borderWidth: 2, tension: 0.3
    }))
    return { agesToShow, chartData: { labels: allPeriods, datasets, aggregatedData }, hasActiveFilters }
  }, [ageDimensionData, currentAgeFilters, ageStartDate, ageEndDate, currentAgePeriod, currentAgeMetric])

  // ========================================
  // 플랫폼 추이 필터 옵션 및 데이터 계산
  // ========================================
  const platformFilterOptions = useMemo(() => {
    if (platformDimensionData.length === 0) {
      return { channels: [], products: [], brands: [], promotions: [], adsets: [], platforms: [] }
    }
    const channels = [...new Set(platformDimensionData.map(row => row['유형구분'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const products = [...new Set(platformDimensionData.map(row => row['상품명'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const brands = [...new Set(platformDimensionData.map(row => row['브랜드명'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const promotions = [...new Set(platformDimensionData.map(row => row['프로모션'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const adsets = [...new Set(platformDimensionData.map(row => row['광고세트'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const platforms = [...new Set(platformDimensionData.map(row => row['플랫폼'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    return { channels, products, brands, promotions, adsets, platforms }
  }, [platformDimensionData])

  const filteredPlatformData = useMemo(() => {
    if (platformDimensionData.length === 0) {
      return { platformsToShow: new Set<string>(), chartData: null, hasActiveFilters: false }
    }
    const filterMap: Record<string, string> = {
      'channel': '유형구분', 'product': '상품명', 'brand': '브랜드명', 'promotion': '프로모션', 'adset': '광고세트'
    }
    const hasActiveFilters = Object.values(currentPlatformFilters).some(arr => arr.length > 0)
    const platformsToShow = new Set<string>()
    platformDimensionData.forEach(row => {
      const platform = row['플랫폼'] as string
      if (!platform || platform === '-') return
      const rowDate = row['일'] as string
      if (rowDate && platformStartDate && platformEndDate) {
        const d = new Date(rowDate)
        if (d < new Date(platformStartDate) || d > new Date(platformEndDate)) return
      }
      let matchesAllFilters = true
      Object.keys(filterMap).forEach(filterKey => {
        const column = filterMap[filterKey]
        const selectedValues = currentPlatformFilters[filterKey as keyof typeof currentPlatformFilters]
        if (selectedValues && selectedValues.length > 0) {
          const rowValue = row[column] as string
          if (!selectedValues.includes(rowValue)) matchesAllFilters = false
        }
      })
      if (matchesAllFilters) platformsToShow.add(platform)
    })
    if (!hasActiveFilters || platformsToShow.size === 0) {
      return { platformsToShow, chartData: null, hasActiveFilters }
    }
    const aggregatedData: Record<string, Record<string, { cost: number; revenue: number; conversions: number; impressions: number; clicks: number }>> = {}
    platformsToShow.forEach(p => { aggregatedData[p] = {} })
    platformDimensionData.forEach(row => {
      const platform = row['플랫폼'] as string
      if (!platformsToShow.has(platform)) return
      const rowDate = row['일'] as string
      if (!rowDate || rowDate === '-') return
      if (platformStartDate && platformEndDate) {
        const d = new Date(rowDate)
        if (d < new Date(platformStartDate) || d > new Date(platformEndDate)) return
      }
      let matchesAllFilters = true
      Object.keys(filterMap).forEach(filterKey => {
        const column = filterMap[filterKey]
        const selectedValues = currentPlatformFilters[filterKey as keyof typeof currentPlatformFilters]
        if (selectedValues && selectedValues.length > 0) {
          const rowValue = row[column] as string
          if (!selectedValues.includes(rowValue)) matchesAllFilters = false
        }
      })
      if (!matchesAllFilters) return
      let periodKey = ''
      const date = new Date(rowDate)
      if (currentPlatformPeriod === 'monthly') {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      } else if (currentPlatformPeriod === 'weekly') {
        const startOfYear = new Date(date.getFullYear(), 0, 1)
        const weekNum = Math.ceil((((date.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7)
        periodKey = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
      } else {
        periodKey = rowDate
      }
      if (!aggregatedData[platform][periodKey]) {
        aggregatedData[platform][periodKey] = { cost: 0, revenue: 0, conversions: 0, impressions: 0, clicks: 0 }
      }
      aggregatedData[platform][periodKey].cost += parseFloat(String(row['비용'])) || 0
      aggregatedData[platform][periodKey].revenue += parseFloat(String(row['전환값'])) || 0
      aggregatedData[platform][periodKey].conversions += parseFloat(String(row['전환수'])) || 0
      aggregatedData[platform][periodKey].impressions += parseFloat(String(row['노출'])) || 0
      aggregatedData[platform][periodKey].clicks += parseFloat(String(row['클릭'])) || 0
    })
    const allPeriods = [...new Set(Object.values(aggregatedData).flatMap(data => Object.keys(data)))].sort()
    const metricData: Record<string, Record<string, number>> = {}
    platformsToShow.forEach(p => {
      metricData[p] = {}
      Object.entries(aggregatedData[p]).forEach(([period, data]) => {
        let value = 0
        switch (currentPlatformMetric) {
          case 'roas': value = data.cost > 0 ? (data.revenue / data.cost) * 100 : 0; break
          case 'cost': value = data.cost; break
          case 'revenue': value = data.revenue; break
          case 'conversions': value = data.conversions; break
          case 'impressions': value = data.impressions; break
          case 'clicks': value = data.clicks; break
          case 'cpm': value = data.impressions > 0 ? (data.cost / data.impressions) * 1000 : 0; break
          case 'cpc': value = data.clicks > 0 ? data.cost / data.clicks : 0; break
          case 'cpa': value = data.conversions > 0 ? data.cost / data.conversions : 0; break
          case 'ctr': value = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0; break
          case 'cvr': value = data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0; break
        }
        metricData[p][period] = value
      })
    })
    const colors = ['#673ab7', '#2196f3', '#4caf50', '#ff9800', '#f44336']
    const platformArray = Array.from(platformsToShow).sort()
    const datasets = platformArray.map((p, index) => ({
      label: p,
      data: allPeriods.map(period => metricData[p][period] || 0),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '20',
      borderWidth: 2, tension: 0.3
    }))
    return { platformsToShow, chartData: { labels: allPeriods, datasets, aggregatedData, platformArray }, hasActiveFilters }
  }, [platformDimensionData, currentPlatformFilters, platformStartDate, platformEndDate, currentPlatformPeriod, currentPlatformMetric])

  // ========================================
  // 기기플랫폼 추이 필터 옵션 및 데이터 계산
  // ========================================
  const devicePlatformFilterOptions = useMemo(() => {
    if (devicePlatformDimensionData.length === 0) {
      return { channels: [], products: [], brands: [], promotions: [], adsets: [], devicePlatforms: [] }
    }
    const channels = [...new Set(devicePlatformDimensionData.map(row => row['유형구분'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const products = [...new Set(devicePlatformDimensionData.map(row => row['상품명'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const brands = [...new Set(devicePlatformDimensionData.map(row => row['브랜드명'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const promotions = [...new Set(devicePlatformDimensionData.map(row => row['프로모션'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const adsets = [...new Set(devicePlatformDimensionData.map(row => row['광고세트'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const devicePlatforms = [...new Set(devicePlatformDimensionData.map(row => row['기기플랫폼'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    return { channels, products, brands, promotions, adsets, devicePlatforms }
  }, [devicePlatformDimensionData])

  const filteredDevicePlatformData = useMemo(() => {
    if (devicePlatformDimensionData.length === 0) {
      return { devicePlatformsToShow: new Set<string>(), chartData: null, hasActiveFilters: false }
    }
    const filterMap: Record<string, string> = {
      'channel': '유형구분', 'product': '상품명', 'brand': '브랜드명', 'promotion': '프로모션', 'adset': '광고세트'
    }
    const hasActiveFilters = Object.values(currentDevicePlatformFilters).some(arr => arr.length > 0)
    const devicePlatformsToShow = new Set<string>()
    devicePlatformDimensionData.forEach(row => {
      const dp = row['기기플랫폼'] as string
      if (!dp || dp === '-') return
      const rowDate = row['일'] as string
      if (rowDate && devicePlatformStartDate && devicePlatformEndDate) {
        const d = new Date(rowDate)
        if (d < new Date(devicePlatformStartDate) || d > new Date(devicePlatformEndDate)) return
      }
      let matchesAllFilters = true
      Object.keys(filterMap).forEach(filterKey => {
        const column = filterMap[filterKey]
        const selectedValues = currentDevicePlatformFilters[filterKey as keyof typeof currentDevicePlatformFilters]
        if (selectedValues && selectedValues.length > 0) {
          const rowValue = row[column] as string
          if (!selectedValues.includes(rowValue)) matchesAllFilters = false
        }
      })
      if (matchesAllFilters) devicePlatformsToShow.add(dp)
    })
    if (!hasActiveFilters || devicePlatformsToShow.size === 0) {
      return { devicePlatformsToShow, chartData: null, hasActiveFilters }
    }
    const aggregatedData: Record<string, Record<string, { cost: number; revenue: number; conversions: number; impressions: number; clicks: number }>> = {}
    devicePlatformsToShow.forEach(dp => { aggregatedData[dp] = {} })
    devicePlatformDimensionData.forEach(row => {
      const dp = row['기기플랫폼'] as string
      if (!devicePlatformsToShow.has(dp)) return
      const rowDate = row['일'] as string
      if (!rowDate || rowDate === '-') return
      if (devicePlatformStartDate && devicePlatformEndDate) {
        const d = new Date(rowDate)
        if (d < new Date(devicePlatformStartDate) || d > new Date(devicePlatformEndDate)) return
      }
      let matchesAllFilters = true
      Object.keys(filterMap).forEach(filterKey => {
        const column = filterMap[filterKey]
        const selectedValues = currentDevicePlatformFilters[filterKey as keyof typeof currentDevicePlatformFilters]
        if (selectedValues && selectedValues.length > 0) {
          const rowValue = row[column] as string
          if (!selectedValues.includes(rowValue)) matchesAllFilters = false
        }
      })
      if (!matchesAllFilters) return
      let periodKey = ''
      const date = new Date(rowDate)
      if (currentDevicePlatformPeriod === 'monthly') {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      } else if (currentDevicePlatformPeriod === 'weekly') {
        const startOfYear = new Date(date.getFullYear(), 0, 1)
        const weekNum = Math.ceil((((date.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7)
        periodKey = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
      } else {
        periodKey = rowDate
      }
      if (!aggregatedData[dp][periodKey]) {
        aggregatedData[dp][periodKey] = { cost: 0, revenue: 0, conversions: 0, impressions: 0, clicks: 0 }
      }
      aggregatedData[dp][periodKey].cost += parseFloat(String(row['비용'])) || 0
      aggregatedData[dp][periodKey].revenue += parseFloat(String(row['전환값'])) || 0
      aggregatedData[dp][periodKey].conversions += parseFloat(String(row['전환수'])) || 0
      aggregatedData[dp][periodKey].impressions += parseFloat(String(row['노출'])) || 0
      aggregatedData[dp][periodKey].clicks += parseFloat(String(row['클릭'])) || 0
    })
    const allPeriods = [...new Set(Object.values(aggregatedData).flatMap(data => Object.keys(data)))].sort()
    const metricData: Record<string, Record<string, number>> = {}
    devicePlatformsToShow.forEach(dp => {
      metricData[dp] = {}
      Object.entries(aggregatedData[dp]).forEach(([period, data]) => {
        let value = 0
        switch (currentDevicePlatformMetric) {
          case 'roas': value = data.cost > 0 ? (data.revenue / data.cost) * 100 : 0; break
          case 'cost': value = data.cost; break
          case 'revenue': value = data.revenue; break
          case 'conversions': value = data.conversions; break
          case 'impressions': value = data.impressions; break
          case 'clicks': value = data.clicks; break
          case 'cpm': value = data.impressions > 0 ? (data.cost / data.impressions) * 1000 : 0; break
          case 'cpc': value = data.clicks > 0 ? data.cost / data.clicks : 0; break
          case 'cpa': value = data.conversions > 0 ? data.cost / data.conversions : 0; break
          case 'ctr': value = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0; break
          case 'cvr': value = data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0; break
        }
        metricData[dp][period] = value
      })
    })
    const colors = ['#673ab7', '#2196f3', '#4caf50', '#ff9800', '#f44336']
    const devicePlatformArray = Array.from(devicePlatformsToShow).sort()
    const datasets = devicePlatformArray.map((dp, index) => ({
      label: dp,
      data: allPeriods.map(period => metricData[dp][period] || 0),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '20',
      borderWidth: 2, tension: 0.3
    }))
    return { devicePlatformsToShow, chartData: { labels: allPeriods, datasets, aggregatedData, devicePlatformArray }, hasActiveFilters }
  }, [devicePlatformDimensionData, currentDevicePlatformFilters, devicePlatformStartDate, devicePlatformEndDate, currentDevicePlatformPeriod, currentDevicePlatformMetric])

  // ========================================
  // 기기 추이 필터 옵션 및 데이터 계산
  // ========================================
  const deviceFilterOptions = useMemo(() => {
    if (deviceTypeDimensionData.length === 0) {
      return { channels: [], products: [], brands: [], promotions: [], adsets: [], devices: [] }
    }
    const channels = [...new Set(deviceTypeDimensionData.map(row => row['유형구분'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const products = [...new Set(deviceTypeDimensionData.map(row => row['상품명'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const brands = [...new Set(deviceTypeDimensionData.map(row => row['브랜드명'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const promotions = [...new Set(deviceTypeDimensionData.map(row => row['프로모션'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const adsets = [...new Set(deviceTypeDimensionData.map(row => row['광고세트'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const devices = [...new Set(deviceTypeDimensionData.map(row => row['기기유형'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    return { channels, products, brands, promotions, adsets, devices }
  }, [deviceTypeDimensionData])

  const filteredDeviceData = useMemo(() => {
    if (deviceTypeDimensionData.length === 0) {
      return { devicesToShow: new Set<string>(), chartData: null, hasActiveFilters: false }
    }
    const filterMap: Record<string, string> = {
      'channel': '유형구분', 'product': '상품명', 'brand': '브랜드명', 'promotion': '프로모션', 'adset': '광고세트'
    }
    const hasActiveFilters = Object.values(currentDeviceTypeFilters).some(arr => arr.length > 0)
    const devicesToShow = new Set<string>()
    deviceTypeDimensionData.forEach(row => {
      const device = row['기기유형'] as string
      if (!device || device === '-') return
      const rowDate = row['일'] as string
      if (rowDate && deviceTypeStartDate && deviceTypeEndDate) {
        const d = new Date(rowDate)
        if (d < new Date(deviceTypeStartDate) || d > new Date(deviceTypeEndDate)) return
      }
      let matchesAllFilters = true
      Object.keys(filterMap).forEach(filterKey => {
        const column = filterMap[filterKey]
        const selectedValues = currentDeviceTypeFilters[filterKey as keyof typeof currentDeviceTypeFilters]
        if (selectedValues && selectedValues.length > 0) {
          const rowValue = row[column] as string
          if (!selectedValues.includes(rowValue)) matchesAllFilters = false
        }
      })
      if (matchesAllFilters) devicesToShow.add(device)
    })
    if (!hasActiveFilters || devicesToShow.size === 0) {
      return { devicesToShow, chartData: null, hasActiveFilters: false }
    }
    const aggregatedData: Record<string, Record<string, { cost: number; revenue: number; conversions: number; impressions: number; clicks: number }>> = {}
    devicesToShow.forEach(d => { aggregatedData[d] = {} })
    deviceTypeDimensionData.forEach(row => {
      const device = row['기기유형'] as string
      if (!devicesToShow.has(device)) return
      const rowDate = row['일'] as string
      if (!rowDate || rowDate === '-') return
      if (deviceTypeStartDate && deviceTypeEndDate) {
        const d = new Date(rowDate)
        if (d < new Date(deviceTypeStartDate) || d > new Date(deviceTypeEndDate)) return
      }
      let matchesAllFilters = true
      Object.keys(filterMap).forEach(filterKey => {
        const column = filterMap[filterKey]
        const selectedValues = currentDeviceTypeFilters[filterKey as keyof typeof currentDeviceTypeFilters]
        if (selectedValues && selectedValues.length > 0) {
          const rowValue = row[column] as string
          if (!selectedValues.includes(rowValue)) matchesAllFilters = false
        }
      })
      if (!matchesAllFilters) return
      let periodKey = ''
      const date = new Date(rowDate)
      if (currentDeviceTypePeriod === 'monthly') {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      } else if (currentDeviceTypePeriod === 'weekly') {
        const startOfYear = new Date(date.getFullYear(), 0, 1)
        const weekNum = Math.ceil((((date.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7)
        periodKey = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
      } else {
        periodKey = rowDate
      }
      if (!aggregatedData[device][periodKey]) {
        aggregatedData[device][periodKey] = { cost: 0, revenue: 0, conversions: 0, impressions: 0, clicks: 0 }
      }
      aggregatedData[device][periodKey].cost += parseFloat(String(row['비용'])) || 0
      aggregatedData[device][periodKey].revenue += parseFloat(String(row['전환값'])) || 0
      aggregatedData[device][periodKey].conversions += parseFloat(String(row['전환수'])) || 0
      aggregatedData[device][periodKey].impressions += parseFloat(String(row['노출'])) || 0
      aggregatedData[device][periodKey].clicks += parseFloat(String(row['클릭'])) || 0
    })
    const allPeriods = [...new Set(Object.values(aggregatedData).flatMap(data => Object.keys(data)))].sort()
    const metricData: Record<string, Record<string, number>> = {}
    devicesToShow.forEach(d => {
      metricData[d] = {}
      Object.entries(aggregatedData[d]).forEach(([period, data]) => {
        let value = 0
        switch (currentDeviceTypeMetric) {
          case 'roas': value = data.cost > 0 ? (data.revenue / data.cost) * 100 : 0; break
          case 'cost': value = data.cost; break
          case 'revenue': value = data.revenue; break
          case 'conversions': value = data.conversions; break
          case 'impressions': value = data.impressions; break
          case 'clicks': value = data.clicks; break
          case 'cpm': value = data.impressions > 0 ? (data.cost / data.impressions) * 1000 : 0; break
          case 'cpc': value = data.clicks > 0 ? data.cost / data.clicks : 0; break
          case 'cpa': value = data.conversions > 0 ? data.cost / data.conversions : 0; break
          case 'ctr': value = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0; break
          case 'cvr': value = data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0; break
        }
        metricData[d][period] = value
      })
    })
    const colors = ['#673ab7', '#2196f3', '#4caf50', '#ff9800', '#f44336']
    const deviceTypeArray = Array.from(devicesToShow).sort()
    const datasets = deviceTypeArray.map((d, index) => ({
      label: d,
      data: allPeriods.map(period => metricData[d][period] || 0),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '20',
      borderWidth: 2, tension: 0.3
    }))
    return { devicesToShow, chartData: { labels: allPeriods, datasets, aggregatedData, deviceTypeArray }, hasActiveFilters }
  }, [deviceTypeDimensionData, currentDeviceTypeFilters, deviceTypeStartDate, deviceTypeEndDate, currentDeviceTypePeriod, currentDeviceTypeMetric])

  // ========================================
  // 성과 테이블 분석 필터 옵션 (HTML initPerfTableFilters 1:1)
  // ========================================
  const perfTableFilterOptions = useMemo(() => {
    if (adsetDimensionData.length === 0) {
      return { channels: [], products: [], brands: [], promotions: [] }
    }
    const channels = [...new Set(adsetDimensionData.map(row => row['유형구분'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const products = [...new Set(adsetDimensionData.map(row => row['상품명'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const brands = [...new Set(adsetDimensionData.map(row => row['브랜드명'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    const promotions = [...new Set(adsetDimensionData.map(row => row['프로모션'] as string).filter(v => v && v !== '' && v !== '-'))].sort()
    return { channels, products, brands, promotions }
  }, [adsetDimensionData])

  // 성과 테이블 필터 업데이트 함수 (HTML updatePerfTableFilters 1:1)
  const updatePerfTableFilters = (tabName: string, filterKey: string, values: string[]) => {
    setPerfTableState(prev => ({
      ...prev,
      [tabName]: {
        ...prev[tabName as keyof typeof prev],
        filters: {
          ...(prev[tabName as keyof typeof prev] as any).filters,
          [filterKey]: values
        }
      }
    }))
  }

  // 성과 테이블 정렬 변경 함수 (HTML setupPerfTableSortEvents 1:1)
  const handlePerfTableSort = (tabName: string, column: string) => {
    setPerfTableState(prev => {
      const currentState = prev[tabName as keyof typeof prev] as any
      const newDirection = currentState.sortColumn === column
        ? (currentState.sortDirection === 'desc' ? 'asc' : 'desc')
        : 'desc'
      return {
        ...prev,
        [tabName]: {
          ...currentState,
          sortColumn: column,
          sortDirection: newDirection
        }
      }
    })
  }

  // 성과 테이블 날짜 변경 함수 (HTML setupPerfTableDateEvents 1:1)
  const handlePerfTableDateChange = (tabName: string, isStart: boolean, value: string) => {
    setPerfTableState(prev => ({
      ...prev,
      [tabName]: {
        ...prev[tabName as keyof typeof prev],
        [isStart ? 'startDate' : 'endDate']: value
      }
    }))
  }

  // 광고세트 테이블 데이터 계산 (HTML renderPerfTableAdset 1:1)
  const perfTableAdsetData = useMemo(() => {
    const state = perfTableState.adset
    const filterMap: Record<string, string> = { 'channel': '유형구분', 'product': '상품명', 'brand': '브랜드명', 'promotion': '프로모션' }
    const allFiltersEmpty = Object.values(state.filters).every(arr => !arr || arr.length === 0)
    if (allFiltersEmpty) return { dataList: [], count: 0 }

    const aggregatedData: Record<string, { name: string, cost: number, revenue: number, conversions: number, impressions: number, clicks: number }> = {}
    adsetDimensionData.forEach(row => {
      for (const filterKey of Object.keys(filterMap)) {
        const column = filterMap[filterKey]
        const selectedValues = state.filters[filterKey as keyof typeof state.filters]
        if (selectedValues && selectedValues.length > 0) {
          if (!selectedValues.includes(row[column] as string)) return
        }
      }
      const date = row['일'] as string
      if (state.startDate || state.endDate) {
        const rowDate = new Date(date)
        if (isNaN(rowDate.getTime())) return
        if (state.startDate && rowDate < new Date(state.startDate)) return
        if (state.endDate && rowDate > new Date(state.endDate)) return
      }
      const adset = row['광고세트'] as string
      if (!adset || adset === '' || adset === '-') return
      if (!aggregatedData[adset]) {
        aggregatedData[adset] = { name: adset, cost: 0, revenue: 0, conversions: 0, impressions: 0, clicks: 0 }
      }
      aggregatedData[adset].cost += parseFloat(String(row['비용'])) || 0
      aggregatedData[adset].revenue += parseFloat(String(row['전환값'])) || 0
      aggregatedData[adset].conversions += parseFloat(String(row['전환수'])) || 0
      aggregatedData[adset].impressions += parseFloat(String(row['노출'])) || 0
      aggregatedData[adset].clicks += parseFloat(String(row['클릭'])) || 0
    })

    let dataList = Object.values(aggregatedData).map(item => ({
      ...item,
      roas: item.cost > 0 ? (item.revenue / item.cost * 100) : 0,
      cpm: item.impressions > 0 ? (item.cost / item.impressions * 1000) : 0,
      cpc: item.clicks > 0 ? (item.cost / item.clicks) : 0,
      cpa: item.conversions > 0 ? (item.cost / item.conversions) : 0,
      ctr: item.impressions > 0 ? (item.clicks / item.impressions * 100) : 0,
      cvr: item.clicks > 0 ? (item.conversions / item.clicks * 100) : 0
    }))
    dataList.sort((a, b) => {
      const aVal = (a as any)[state.sortColumn] || 0
      const bVal = (b as any)[state.sortColumn] || 0
      return state.sortDirection === 'desc' ? bVal - aVal : aVal - bVal
    })
    return { dataList, count: dataList.length }
  }, [adsetDimensionData, perfTableState.adset])

  // 범용 테이블 데이터 계산 함수 (HTML renderPerfTableGeneric 1:1)
  const getPerfTableGenericData = (tabName: string, dataSource: Record<string, unknown>[], dimensionColumn: string) => {
    const state = perfTableState[tabName as keyof typeof perfTableState] as any
    if (!state) return { dataList: [], count: 0 }
    const filterMap: Record<string, string> = { 'channel': '유형구분', 'product': '상품명', 'brand': '브랜드명', 'promotion': '프로모션' }
    const allFiltersEmpty = !state.filters || Object.values(state.filters).every((arr: any) => !arr || arr.length === 0)
    if (allFiltersEmpty) return { dataList: [], count: 0 }

    const aggregatedData: Record<string, { name: string, cost: number, revenue: number, conversions: number, impressions: number, clicks: number }> = {}
    dataSource.forEach(row => {
      if (state.filters) {
        for (const filterKey of Object.keys(filterMap)) {
          const column = filterMap[filterKey]
          const selectedValues = state.filters[filterKey]
          if (selectedValues && selectedValues.length > 0) {
            if (!selectedValues.includes(row[column] as string)) return
          }
        }
      }
      const date = row['일'] as string
      if (state.startDate || state.endDate) {
        const rowDate = new Date(date)
        if (isNaN(rowDate.getTime())) return
        if (state.startDate && rowDate < new Date(state.startDate)) return
        if (state.endDate && rowDate > new Date(state.endDate)) return
      }
      let dimensionValue = (row[dimensionColumn + '_통합'] || row[dimensionColumn]) as string
      if (!dimensionValue || dimensionValue === '' || dimensionValue === '-') return
      if (tabName === 'gender') {
        const normalized = normalizeGender(dimensionValue)
        if (!normalized || normalized === 'Unknown') return
        dimensionValue = normalized
      }
      if (!aggregatedData[dimensionValue]) {
        aggregatedData[dimensionValue] = { name: dimensionValue, cost: 0, revenue: 0, conversions: 0, impressions: 0, clicks: 0 }
      }
      aggregatedData[dimensionValue].cost += parseFloat(String(row['비용'])) || 0
      aggregatedData[dimensionValue].revenue += parseFloat(String(row['전환값'])) || 0
      aggregatedData[dimensionValue].conversions += parseFloat(String(row['전환수'])) || 0
      aggregatedData[dimensionValue].impressions += parseFloat(String(row['노출'])) || 0
      aggregatedData[dimensionValue].clicks += parseFloat(String(row['클릭'])) || 0
    })

    let dataList = Object.values(aggregatedData).map(item => ({
      ...item,
      roas: item.cost > 0 ? (item.revenue / item.cost * 100) : 0,
      cpm: item.impressions > 0 ? (item.cost / item.impressions * 1000) : 0,
      cpc: item.clicks > 0 ? (item.cost / item.clicks) : 0,
      cpa: item.conversions > 0 ? (item.cost / item.conversions) : 0,
      ctr: item.impressions > 0 ? (item.clicks / item.impressions * 100) : 0,
      cvr: item.clicks > 0 ? (item.conversions / item.clicks * 100) : 0
    }))
    dataList.sort((a, b) => {
      const aVal = (a as any)[state.sortColumn] || 0
      const bVal = (b as any)[state.sortColumn] || 0
      return state.sortDirection === 'desc' ? bVal - aVal : aVal - bVal
    })
    return { dataList, count: dataList.length }
  }

  // 각 탭별 데이터 계산 (HTML renderPerfTableGender, renderPerfTableAge 등 1:1)
  const perfTableGenderData = useMemo(() => getPerfTableGenericData('gender', genderDimensionData, '성별'), [genderDimensionData, perfTableState.gender])
  const perfTableAgeData = useMemo(() => getPerfTableGenericData('age', ageDimensionData, '연령'), [ageDimensionData, perfTableState.age])
  const perfTablePlatformData = useMemo(() => getPerfTableGenericData('platform', platformDimensionData, '플랫폼'), [platformDimensionData, perfTableState.platform])
  const perfTableDevicePlatformData = useMemo(() => getPerfTableGenericData('devicePlatform', devicePlatformDimensionData, '기기플랫폼'), [devicePlatformDimensionData, perfTableState.devicePlatform])
  const perfTableDeviceTypeData = useMemo(() => getPerfTableGenericData('deviceType', deviceTypeDimensionData, '기기유형'), [deviceTypeDimensionData, perfTableState.deviceType])

  // 성별x연령 PIVOT 테이블 데이터 계산 (HTML renderPerfTableGenderAge 1:1)
  const perfTableGenderAgeData = useMemo(() => {
    const state = perfTableState.genderAge
    const filterMap: Record<string, string> = { 'channel': '유형구분', 'product': '상품명', 'brand': '브랜드명', 'promotion': '프로모션' }
    const allFiltersEmpty = Object.values(state.filters).every(arr => !arr || arr.length === 0)
    if (allFiltersEmpty || pivotDimensionData.length === 0) return { pivotData: {}, genders: [], ages: [], totalStats: null, allFiltersEmpty }

    const rowMatchesFilters = (row: Record<string, unknown>) => {
      for (const filterKey of Object.keys(filterMap)) {
        const column = filterMap[filterKey]
        const selectedValues = state.filters[filterKey as keyof typeof state.filters]
        if (selectedValues && selectedValues.length > 0) {
          if (!selectedValues.includes(row[column] as string)) return false
        }
      }
      return true
    }

    const pivotData: Record<string, { gender: string, age: string, cost: number, revenue: number, conversions: number, impressions: number, clicks: number, roas: number, cpm: number, cpc: number, cpa: number }> = {}
    pivotDimensionData.forEach(row => {
      if (!rowMatchesFilters(row)) return
      const rawGender = (row['성별_통합'] || row['성별']) as string
      const normalizedGender = normalizeGender(rawGender)
      const age = (row['연령_통합'] || row['연령']) as string
      if (!normalizedGender || !age || age === '' || age === '-') return
      const date = row['일'] as string
      if (state.startDate || state.endDate) {
        const rowDate = new Date(date)
        if (isNaN(rowDate.getTime())) return
        if (state.startDate && rowDate < new Date(state.startDate)) return
        if (state.endDate && rowDate > new Date(state.endDate)) return
      }
      const key = `${normalizedGender}_${age}`
      if (!pivotData[key]) {
        pivotData[key] = { gender: normalizedGender, age, cost: 0, revenue: 0, conversions: 0, impressions: 0, clicks: 0, roas: 0, cpm: 0, cpc: 0, cpa: 0 }
      }
      pivotData[key].cost += parseFloat(String(row['비용'])) || 0
      pivotData[key].revenue += parseFloat(String(row['전환값'])) || 0
      pivotData[key].conversions += parseFloat(String(row['전환수'])) || 0
      pivotData[key].impressions += parseFloat(String(row['노출'])) || 0
      pivotData[key].clicks += parseFloat(String(row['클릭'])) || 0
    })

    Object.keys(pivotData).forEach(key => {
      const data = pivotData[key]
      data.roas = data.cost > 0 ? (data.revenue / data.cost * 100) : 0
      data.cpm = data.impressions > 0 ? (data.cost / data.impressions * 1000) : 0
      data.cpc = data.clicks > 0 ? (data.cost / data.clicks) : 0
      data.cpa = data.conversions > 0 ? (data.cost / data.conversions) : 0
    })

    let genders = [...new Set(Object.values(pivotData).map(d => d.gender))].filter(g => g === '남성' || g === '여성').sort()
    const ages = [...new Set(Object.values(pivotData).map(d => d.age))].filter(a => isValidAge(a)).sort()

    const totalCost = Object.values(pivotData).reduce((sum, d) => sum + d.cost, 0)
    const totalRevenue = Object.values(pivotData).reduce((sum, d) => sum + d.revenue, 0)
    const totalConversions = Object.values(pivotData).reduce((sum, d) => sum + d.conversions, 0)
    const totalImpressions = Object.values(pivotData).reduce((sum, d) => sum + d.impressions, 0)
    const totalClicks = Object.values(pivotData).reduce((sum, d) => sum + d.clicks, 0)
    const totalStats = {
      totalCost,
      avgRoas: totalCost > 0 ? (totalRevenue / totalCost * 100) : 0,
      avgCpm: totalImpressions > 0 ? (totalCost / totalImpressions * 1000) : 0,
      avgCpc: totalClicks > 0 ? (totalCost / totalClicks) : 0,
      avgCpa: totalConversions > 0 ? (totalCost / totalConversions) : 0
    }

    return { pivotData, genders, ages, totalStats, allFiltersEmpty }
  }, [pivotDimensionData, perfTableState.genderAge])

  // ========================================
  // 성과 구분 비교 분석 데이터 계산 (HTML 1:1)
  // ========================================
  // 기간별 데이터 필터링 함수 (HTML filterDataByDateRange 1:1)
  const filterDataByDateRange = (data: Record<string, unknown>[], startDate: string, endDate: string): Record<string, unknown>[] => {
    if (!startDate && !endDate) return data
    return data.filter(row => {
      const rowDate = row['일'] as string
      if (!rowDate) return true
      const date = new Date(rowDate)
      if (isNaN(date.getTime())) return true
      if (startDate && date < new Date(startDate)) return false
      if (endDate && date > new Date(endDate)) return false
      return true
    })
  }

  // 증감률 계산 함수 (HTML calculateChangeRate 1:1)
  const calculateChangeRate = (current: number, previous: number): number | null => {
    if (!previous || previous === 0) return null
    return ((current - previous) / previous) * 100
  }

  // 브랜드 데이터 집계 함수 (HTML aggregateBrandData 1:1)
  const aggregatePerfData = (data: Record<string, unknown>[], groupKey: string) => {
    const groupedData: Record<string, { name: string; cost: number; conversions: number; revenue: number }> = {}
    data.forEach(row => {
      const name = row[groupKey] as string
      if (!name || name === '-') return
      if (!groupedData[name]) {
        groupedData[name] = { name, cost: 0, conversions: 0, revenue: 0 }
      }
      groupedData[name].cost += parseFloat(String(row['비용'])) || 0
      groupedData[name].conversions += parseFloat(String(row['전환수'])) || 0
      groupedData[name].revenue += parseFloat(String(row['전환값'])) || 0
    })
    return Object.values(groupedData).map(g => ({
      ...g,
      roas: g.cost > 0 ? (g.revenue / g.cost) * 100 : 0,
      cpa: g.conversions > 0 ? g.cost / g.conversions : 0
    })).filter(g => g.cost > 0)
  }

  // 성과 분석 차트 데이터 계산 (HTML renderPerformanceChart 기반)
  const getPerfChartData = (category: 'brand' | 'product' | 'promotion' | 'targeting') => {
    const state = perfChartState[category]
    const groupKeyMap: Record<string, string> = { brand: '브랜드명', product: '상품명', promotion: '프로모션', targeting: '타겟팅' }
    const groupKey = groupKeyMap[category]

    // 현재 기간 데이터 필터링 및 집계
    let currentData: { name: string; cost: number; conversions: number; revenue: number; roas: number; cpa: number }[] = []
    let prevData: { name: string; cost: number; conversions: number; revenue: number; roas: number; cpa: number }[] = []

    if (adsetDimensionData.length > 0) {
      const filteredData = filterDataByDateRange(adsetDimensionData, state.startDate, state.endDate)
      currentData = aggregatePerfData(filteredData, groupKey)

      if (state.compareActive && state.startDateComp && state.endDateComp) {
        const prevFilteredData = filterDataByDateRange(adsetDimensionData, state.startDateComp, state.endDateComp)
        prevData = aggregatePerfData(prevFilteredData, groupKey)
      }
    }

    // 정렬
    const allSorted = [...currentData].sort((a, b) => {
      const aVal = a[state.kpi as keyof typeof a] as number
      const bVal = b[state.kpi as keyof typeof b] as number
      return state.sort === 'desc' ? bVal - aVal : aVal - bVal
    })
    const totalCount = allSorted.length
    const limit = state.showAll ? DETAIL_EXPANDED_LIMIT : DETAIL_DEFAULT_LIMIT
    const sorted = allSorted.slice(0, limit)

    // 비교 데이터 매핑
    const prevDataMap: Record<string, typeof prevData[0]> = {}
    prevData.forEach(item => { prevDataMap[item.name] = item })

    // 라벨에 증감 화살표 추가
    const labels = sorted.map(item => {
      if (state.compareActive && prevDataMap[item.name]) {
        const changeRate = calculateChangeRate(item[state.kpi as keyof typeof item] as number, prevDataMap[item.name][state.kpi as keyof typeof item] as number)
        const arrow = changeRate !== null ? (changeRate >= 0 ? ' ▲' : ' ▼') : ''
        return item.name + arrow
      }
      return item.name
    })

    const currentValues = sorted.map(item => item[state.kpi as keyof typeof item] as number)
    const prevValues = sorted.map(item => prevDataMap[item.name] ? prevDataMap[item.name][state.kpi as keyof typeof item] as number : 0)

    return { labels, currentValues, prevValues, totalCount, sorted, prevDataMap }
  }

  // 성과 분석 이벤트 핸들러 (HTML setupPerfChartDateEvents 1:1)
  const handlePerfChartKpiChange = (category: string, kpi: string) => {
    setPerfChartState(prev => ({ ...prev, [category]: { ...prev[category as keyof typeof prev], kpi } }))
  }

  const handlePerfChartSortChange = (category: string, sort: string) => {
    setPerfChartState(prev => ({ ...prev, [category]: { ...prev[category as keyof typeof prev], sort } }))
  }

  const handlePerfChartDateChange = (category: string, isStart: boolean, value: string, isComp: boolean = false) => {
    setPerfChartState(prev => {
      const key = isComp ? (isStart ? 'startDateComp' : 'endDateComp') : (isStart ? 'startDate' : 'endDate')
      return { ...prev, [category]: { ...prev[category as keyof typeof prev], [key]: value } }
    })
  }

  const handlePerfChartPresetChange = (category: string, days: number, isComp: boolean = false) => {
    const state = perfChartState[category as keyof typeof perfChartState]
    if (isComp) {
      const baseStart = state.startDate ? new Date(state.startDate) : new Date()
      const endDate = new Date(baseStart)
      endDate.setDate(baseStart.getDate() - 1)
      const startDate = new Date(endDate)
      startDate.setDate(endDate.getDate() - days + 1)
      setPerfChartState(prev => ({
        ...prev,
        [category]: { ...prev[category as keyof typeof prev], startDateComp: startDate.toISOString().split('T')[0], endDateComp: endDate.toISOString().split('T')[0] }
      }))
    } else {
      const dates = adsetDimensionData.map(row => row['일'] as string).filter(d => d).map(d => new Date(d)).filter(d => !isNaN(d.getTime()))
      if (dates.length === 0) return
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
      const startDate = new Date(maxDate)
      startDate.setDate(maxDate.getDate() - days + 1)
      setPerfChartState(prev => ({
        ...prev,
        [category]: { ...prev[category as keyof typeof prev], startDate: startDate.toISOString().split('T')[0], endDate: maxDate.toISOString().split('T')[0] }
      }))
    }
  }

  const handlePerfChartCompareToggle = (category: string) => {
    const state = perfChartState[category as keyof typeof perfChartState]
    if (!state.compareActive) {
      // 비교 모드 활성화 - 이전 기간 기본값 설정
      if (state.startDate && state.endDate) {
        const start = new Date(state.startDate)
        const end = new Date(state.endDate)
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        const prevEnd = new Date(start)
        prevEnd.setDate(prevEnd.getDate() - 1)
        const prevStart = new Date(prevEnd)
        prevStart.setDate(prevStart.getDate() - daysDiff)
        setPerfChartState(prev => ({
          ...prev,
          [category]: { ...prev[category as keyof typeof prev], compareActive: true, startDateComp: prevStart.toISOString().split('T')[0], endDateComp: prevEnd.toISOString().split('T')[0] }
        }))
      } else {
        setPerfChartState(prev => ({ ...prev, [category]: { ...prev[category as keyof typeof prev], compareActive: true } }))
      }
    } else {
      // 비교 모드 비활성화
      setPerfChartState(prev => ({ ...prev, [category]: { ...prev[category as keyof typeof prev], compareActive: false, startDateComp: '', endDateComp: '' } }))
    }
  }

  const handlePerfChartShowMoreToggle = (category: string) => {
    setPerfChartState(prev => ({ ...prev, [category]: { ...prev[category as keyof typeof prev], showAll: !prev[category as keyof typeof prev].showAll } }))
  }

  // ========================================
  // 리타겟팅 분석 Helper Functions (HTML 1:1)
  // ========================================
  // 효율 등급 반환 (HTML getEfficiencyGrade 1:1)
  const getEfficiencyGrade = (roas: number, maxRoas: number): JSX.Element => {
    if (maxRoas === 0) return <span style={{ background: '#f5f5f5', color: '#9e9e9e', padding: '4px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>-</span>
    const ratio = roas / maxRoas
    if (ratio >= 0.8) {
      return <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>A등급</span>
    } else if (ratio >= 0.5) {
      return <span style={{ background: '#e3f2fd', color: '#1565c0', padding: '4px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>B등급</span>
    } else if (ratio >= 0.2) {
      return <span style={{ background: '#fff3e0', color: '#e65100', padding: '4px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>C등급</span>
    } else {
      return <span style={{ background: '#ffebee', color: '#d32f2f', padding: '4px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>D등급</span>
    }
  }

  // 기기 아이콘 반환 (HTML getDeviceIcon 1:1)
  const getDeviceIcon = (device: string): string => {
    const icons: Record<string, string> = { 'Computers': '🖥️', 'Mobile phones': '📱', 'Tablets': '📱', 'TV screens': '📺', 'OTHER': '❓' }
    return icons[device] || '📊'
  }

  // 플랫폼 아이콘 반환 (HTML getPlatformIcon 1:1)
  const getPlatformIcon = (platform: string): string => {
    const icons: Record<string, string> = { 'Cross-network': '🌐', 'Display Network': '🖼️', 'Google search': '🔍', 'Search partners': '🔎', 'YouTube': '▶️' }
    return icons[platform] || '📊'
  }

  // 노출기기 아이콘 반환 (HTML getDevicePlatformIcon 1:1)
  const getDevicePlatformIcon = (devicePlatform: string): string => {
    const icons: Record<string, string> = { 'Mobile app': '📱', 'Mobile web': '📲', 'Desktop': '🖥️', 'Uncategorized': '❓' }
    return icons[devicePlatform] || '📊'
  }

  // 리타겟팅 테이블 정렬 핸들러 (HTML setupRetargetingSortEvents 1:1)
  const handleRetargetingSortChange = (tableType: 'ageGender' | 'device' | 'platform' | 'devicePlatform', column: string) => {
    setRetargetingSortState(prev => {
      const currentState = prev[tableType]
      if (currentState.column === column) {
        return { ...prev, [tableType]: { column, direction: currentState.direction === 'desc' ? 'asc' : 'desc' } }
      } else {
        return { ...prev, [tableType]: { column, direction: 'desc' } }
      }
    })
  }

  // 리타겟팅 테이블 데이터 계산 (HTML renderAgeGenderRetargetTable 기반)
  const getRetargetingTableData = (tableType: 'ageGender' | 'device' | 'platform' | 'devicePlatform') => {
    const retargeting = (insightsData as any)?.retargeting_analysis || {} as any
    const insights = ((insightsData as any)?.retargeting_insights || []) as any[]
    const sortState = retargetingSortState[tableType]

    let data: any[] = []
    let insightType = ''
    let labelKey = ''

    switch (tableType) {
      case 'ageGender':
        data = retargeting.by_age_gender || []
        insightType = 'retargeting_best_age_gender'
        labelKey = 'label'
        break
      case 'device':
        data = retargeting.by_device || []
        insightType = 'retargeting_best_device'
        labelKey = 'device'
        break
      case 'platform':
        data = retargeting.by_platform || []
        insightType = 'retargeting_best_platform'
        labelKey = 'platform'
        break
      case 'devicePlatform':
        data = retargeting.by_device_platform || []
        insightType = 'retargeting_best_device_platform'
        labelKey = 'device_platform'
        break
    }

    // 필터링 (ageGender, device는 roas > 0 필터)
    const filteredData = (tableType === 'ageGender' || tableType === 'device')
      ? data.filter((item: any) => item.roas > 0)
      : data

    // 정렬
    const sortedData = [...filteredData].sort((a: any, b: any) => {
      const aVal = a[sortState.column] || 0
      const bVal = b[sortState.column] || 0
      return sortState.direction === 'desc' ? bVal - aVal : aVal - bVal
    })

    const maxRoas = Math.max(...filteredData.filter((d: any) => d.roas > 0).map((d: any) => d.roas), 100)

    // 인사이트 찾기
    const insight = insights.find((i: any) => i.type === insightType)
    let insightText = ''
    if (insight) {
      insightText = insight.message
    } else if (sortedData.length > 0 && sortedData[0].roas > 0) {
      const firstItem = sortedData[0]
      const label = firstItem[labelKey] || firstItem.label || ''
      insightText = `<strong>${label}</strong> ${tableType === 'ageGender' ? '타겟' : tableType === 'device' ? '기기' : tableType === 'platform' ? '플랫폼' : '노출기기'}이 ROAS <strong>${formatPercent(firstItem.roas)}</strong>로 가장 높은 효율을 보이고 있습니다.`
    }

    return { sortedData, maxRoas, insightText, labelKey }
  }

  // ========================================
  // KPI 계산
  // ========================================
  const kpiData = useMemo(() => {
    if (adsetDimensionData.length === 0) {
      return {
        totalCost: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        cpm: 0,
        cpc: 0,
        cpa: 0,
        roas: 0
      }
    }

    let totalCost = 0
    let totalImpressions = 0
    let totalClicks = 0
    let totalConversions = 0
    let totalRevenue = 0

    adsetDimensionData.forEach(row => {
      const hasCampaign = row['캠페인이름'] && row['캠페인이름'] !== '-'
      const hasAdset = row['광고세트'] && row['광고세트'] !== '-'

      if (hasCampaign && hasAdset) {
        totalCost += parseFloat(String(row['비용'])) || 0
        totalImpressions += parseFloat(String(row['노출'])) || 0
        totalClicks += parseFloat(String(row['클릭'])) || 0
        totalConversions += parseFloat(String(row['전환수'])) || 0
        totalRevenue += parseFloat(String(row['전환값'])) || 0
      }
    })

    const cpm = totalImpressions > 0 ? (totalCost / totalImpressions * 1000) : 0
    const cpc = totalClicks > 0 ? (totalCost / totalClicks) : 0
    const cpa = totalConversions > 0 ? (totalCost / totalConversions) : 0
    const roas = totalCost > 0 ? (totalRevenue / totalCost * 100) : 0

    return {
      totalCost,
      totalImpressions,
      totalClicks,
      totalConversions,
      totalRevenue,
      cpm,
      cpc,
      cpa,
      roas
    }
  }, [adsetDimensionData])

  // ========================================
  // 기간 정보
  // ========================================
  const periodInfo = useMemo(() => {
    if (!insightsData?.summary?.analysis_period) {
      return { start: '', end: '', days: 0 }
    }
    const period = insightsData.summary.analysis_period
    return {
      start: period.start_date,
      end: period.end_date,
      days: period.total_days
    }
  }, [insightsData])

  // ========================================
  // 의사결정 도구용 데이터 계산
  // ========================================
  const decisionToolData = useMemo(() => {
    if (!insightsData) {
      return {
        summaryCard: null,
        summary: { overall_roas: 0, overall_cpa: 0, total_conversions: 0, total_revenue: 0, total_cost: 0 },
        topRecommendations: [],
        topCategories: [],
        productPerformance: [],
        genderData: [],
        deviceData: [],
        devicePlatformData: [],
        ageGenderData: [],
        genderMatrixInsights: [],
        deviceMatrixInsights: [],
        deviceplatformMatrixInsights: [],
        topAdsets: [],
        alerts: [],
        timeseries: { monthly_trend: [], monthly_growth: [] },
        forecast: null,
        seasonalityAnalysis: { overall: [], quarterly_overall: [], by_category: {} as Record<string, CategoryDayData[]> }
      }
    }

    // 유효한 성별 체크
    const isValidGender = (gender: string) => {
      if (!gender) return false
      const lower = gender.toLowerCase()
      return lower !== 'unknown' && lower !== 'uncategorized' && lower !== ''
    }

    const genderData = (insightsData.gender_performance || []).filter(g => isValidGender(g.gender))
    const deviceData = (insightsData.device_performance || []).filter(d =>
      d.device && d.device.toLowerCase() !== 'uncategorized' && d.device.toLowerCase() !== 'unknown'
    )
    const devicePlatformData = (insightsData.deviceplatform_performance || []).filter(d =>
      d.deviceplatform && d.deviceplatform.toLowerCase() !== 'uncategorized' && d.deviceplatform.toLowerCase() !== 'unknown'
    )
    const ageGenderData = (insightsData.age_gender_combinations || []).filter(item =>
      isValidGender(item.gender)
    )

    return {
      summaryCard: insightsData.summary_card || null,
      summary: insightsData.summary || { overall_roas: 0, overall_cpa: 0, total_conversions: 0, total_revenue: 0, total_cost: 0 },
      topRecommendations: insightsData.top_recommendations || [],
      topCategories: insightsData.top_categories || [],
      productPerformance: insightsData.product_performance || [],
      genderData,
      deviceData,
      devicePlatformData,
      ageGenderData,
      genderMatrixInsights: insightsData.gender_matrix_insights || [],
      deviceMatrixInsights: insightsData.device_matrix_insights || [],
      deviceplatformMatrixInsights: insightsData.deviceplatform_matrix_insights || [],
      topAdsets: insightsData.top_adsets || [],
      alerts: insightsData.alerts || [],
      timeseries: insightsData.timeseries || { monthly_trend: [], monthly_growth: [] },
      forecast: insightsData.prophet_forecast || null,
      seasonalityAnalysis: insightsData.seasonality_analysis || { overall: [], quarterly_overall: [], by_category: {} as Record<string, CategoryDayData[]> }
    }
  }, [insightsData])

  // 성과 상태 계산
  const performanceStatus = useMemo(() => {
    const avgRoas = decisionToolData.summary.overall_roas || 0
    const roasStatus = avgRoas >= 200 ? 'excellent' : avgRoas >= 150 ? 'good' : avgRoas >= 100 ? 'normal' : 'warning'

    const statusConfig: Record<string, { text: string; color: string; bg: string; icon: string }> = {
      excellent: { text: '매우 좋음', color: '#00c853', bg: '#e8f5e9', icon: '🎉' },
      good: { text: '양호', color: '#2e7d32', bg: '#e8f5e9', icon: '👍' },
      normal: { text: '보통', color: '#f57c00', bg: '#fff3e0', icon: '📊' },
      warning: { text: '개선 필요', color: '#d32f2f', bg: '#ffebee', icon: '⚠️' }
    }

    return statusConfig[roasStatus]
  }, [decisionToolData.summary.overall_roas])

  // 채널 성과 순위
  const sortedCategories = useMemo(() => {
    return [...decisionToolData.topCategories].sort((a, b) => b.roas - a.roas)
  }, [decisionToolData.topCategories])

  // 최고/최저 채널
  const channelAnalysis = useMemo(() => {
    const sortedByRoas = [...decisionToolData.topCategories].sort((a, b) => b.roas - a.roas)
    const sortedByCpa = [...decisionToolData.topCategories].sort((a, b) => a.cpa - b.cpa)
    return {
      topChannel: sortedByRoas[0] || null,
      lowCpaChannel: sortedByCpa[0] || null,
      poorChannel: sortedByRoas.length > 0 ? sortedByRoas[sortedByRoas.length - 1] : null
    }
  }, [decisionToolData.topCategories])

  // 최근 트렌드
  const recentTrend = useMemo(() => {
    const monthlyGrowth = decisionToolData.timeseries?.monthly_growth || []
    if (monthlyGrowth.length === 0) {
      return { text: '', icon: '' }
    }
    const lastMonth = monthlyGrowth[monthlyGrowth.length - 1]
    const roasChange = lastMonth?.roas_change || 0

    if (roasChange > 10) {
      return { text: `지난달 대비 ROAS ${roasChange.toFixed(1)}%p 상승`, icon: '📈' }
    } else if (roasChange < -10) {
      return { text: `지난달 대비 ROAS ${Math.abs(roasChange).toFixed(1)}%p 하락`, icon: '📉' }
    } else {
      return { text: '지난달과 비슷한 성과 유지 중', icon: '➡️' }
    }
  }, [decisionToolData.timeseries])

  // 추천 분류
  const recommendationGroups = useMemo(() => {
    const recs = decisionToolData.topRecommendations
    const severityOrder: Record<string, number> = { high: 0, warning: 1, opportunity: 2, info: 3 }

    const sortBySeverity = (a: Recommendation, b: Recommendation) => {
      const orderA = severityOrder[a.severity || 'info'] ?? 4
      const orderB = severityOrder[b.severity || 'info'] ?? 4
      return orderA - orderB
    }

    const urgentRecs = recs
      .filter(r => r.priority === 'high' || r.severity === 'high')
      .sort(sortBySeverity)
    const otherRecs = recs
      .filter(r => r.priority !== 'high' && r.severity !== 'high')
      .sort(sortBySeverity)

    return { urgentRecs, otherRecs }
  }, [decisionToolData.topRecommendations])

  // 경고 분류
  const warningGroups = useMemo(() => {
    const allAlerts = decisionToolData.alerts
    const warnings = allAlerts.filter(a => a.severity === 'warning' || a.severity === 'high')
    const avgCpa = decisionToolData.summary.overall_cpa || 0

    const highCpaCategories = decisionToolData.topCategories.filter(cat => cat.cpa > avgCpa * 1.5)
    const lowRoasProducts = decisionToolData.productPerformance.filter(prod => prod.roas < 100)

    return {
      warnings,
      highCpaCategories,
      lowRoasProducts,
      totalIssues: warnings.length + highCpaCategories.length + lowRoasProducts.length
    }
  }, [decisionToolData])

  // 타겟 분석 - 최고 성과 타겟
  const topTargets = useMemo(() => {
    const topGender = decisionToolData.genderData.length > 0
      ? [...decisionToolData.genderData].sort((a, b) => b.roas - a.roas)[0]
      : null
    const topDevice = decisionToolData.deviceData.length > 0
      ? [...decisionToolData.deviceData].sort((a, b) => b.roas - a.roas)[0]
      : null
    const topAgeGender = decisionToolData.ageGenderData.length > 0
      ? decisionToolData.ageGenderData[0]
      : null

    return { topGender, topDevice, topAgeGender }
  }, [decisionToolData.genderData, decisionToolData.deviceData, decisionToolData.ageGenderData])

  // 4분면 매트릭스 그룹핑
  const matrixQuadrants = useMemo(() => {
    const allMatrixInsights = [
      ...decisionToolData.genderMatrixInsights,
      ...decisionToolData.deviceMatrixInsights,
      ...decisionToolData.deviceplatformMatrixInsights
    ]

    return {
      core_driver: allMatrixInsights.filter(i => i.sub_type === 'core_driver'),
      efficiency_star: allMatrixInsights.filter(i => i.sub_type === 'efficiency_star'),
      budget_bleeder: allMatrixInsights.filter(i => i.sub_type === 'budget_bleeder'),
      underperformer: allMatrixInsights.filter(i => i.sub_type === 'underperformer')
    }
  }, [decisionToolData.genderMatrixInsights, decisionToolData.deviceMatrixInsights, decisionToolData.deviceplatformMatrixInsights])

  // 성별 표준화 함수 (normalizeGender 함수 사용 - 상단에 정의됨)

  // 특정 타겟에 대한 매트릭스 인사이트 찾기
  const getMatrixInsightForTarget = useCallback((insights: MatrixInsight[], target: string) => {
    return insights.find(i => i.target === target || i.target?.includes(target))
  }, [])

  // ========================================
  // 렌더링
  // ========================================
  if (loading) {
    return (
      <div className="type-dashboard">
        <style>{styles}</style>
        <div className="loading">데이터를 불러오는 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="type-dashboard">
        <style>{styles}</style>
        <div className="loading">{error}</div>
      </div>
    )
  }

  return (
    <div className="type-dashboard">
      <style>{styles}</style>

      {/* 대시보드 헤더 */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">채널별 분석 대시보드</h1>
        <p className="dashboard-subtitle">
          분석 기간: {periodInfo.start} ~ {periodInfo.end} ({periodInfo.days}일)
        </p>
      </div>

      {/* KPI 섹션 */}
      <div className="kpi-section">
        {/* KPI 토글 */}
        <div className="kpi-view-toggle">
        <button
          type="button"
          className={`kpi-view-btn ${kpiView === 'primary' ? 'active' : ''}`}
          onClick={() => setKpiView('primary')}
        >
          주요 성과
        </button>
        <button
          type="button"
          className={`kpi-view-btn ${kpiView === 'all' ? 'active' : ''}`}
          onClick={() => setKpiView('all')}
        >
          세부 성과
        </button>
      </div>

      {/* KPI 카드 - Primary */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">총 비용</span>
            <div className="kpi-icon">💰</div>
          </div>
          <div className="kpi-value">{formatCurrency(kpiData.totalCost)}</div>
          <div className="kpi-trend">전체 기간 합계</div>
        </div>

        <div className="kpi-card highlight">
          <div className="kpi-header">
            <span className="kpi-title">ROAS</span>
            <div className="kpi-icon">📈</div>
          </div>
          <div className="kpi-value highlight-value">{formatPercent(kpiData.roas)}</div>
          <div className="kpi-trend">광고 수익률</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">CPA</span>
            <div className="kpi-icon">🎯</div>
          </div>
          <div className="kpi-value">{formatCurrency(kpiData.cpa)}</div>
          <div className="kpi-trend">전환당 비용</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">CPC</span>
            <div className="kpi-icon">🖱️</div>
          </div>
          <div className="kpi-value">{formatCurrency(kpiData.cpc)}</div>
          <div className="kpi-trend">클릭당 비용</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">CPM</span>
            <div className="kpi-icon">👁️</div>
          </div>
          <div className="kpi-value">{formatCurrency(kpiData.cpm)}</div>
          <div className="kpi-trend">노출당 비용</div>
        </div>
      </div>

      {/* KPI 카드 - Secondary */}
      {kpiView === 'all' && (
        <div className="kpi-grid kpi-grid-secondary">
          <div className="kpi-card secondary">
            <div className="kpi-header">
              <span className="kpi-title">총 노출</span>
              <div className="kpi-icon">👀</div>
            </div>
            <div className="kpi-value">{formatNumber(kpiData.totalImpressions)}</div>
            <div className="kpi-trend">회</div>
          </div>

          <div className="kpi-card secondary">
            <div className="kpi-header">
              <span className="kpi-title">총 클릭</span>
              <div className="kpi-icon">👆</div>
            </div>
            <div className="kpi-value">{formatNumber(kpiData.totalClicks)}</div>
            <div className="kpi-trend">회</div>
          </div>

          <div className="kpi-card secondary">
            <div className="kpi-header">
              <span className="kpi-title">총 전환수</span>
              <div className="kpi-icon">✅</div>
            </div>
            <div className="kpi-value">{formatNumber(kpiData.totalConversions)}</div>
            <div className="kpi-trend">건</div>
          </div>

          <div className="kpi-card secondary">
            <div className="kpi-header">
              <span className="kpi-title">총 전환값</span>
              <div className="kpi-icon">💵</div>
            </div>
            <div className="kpi-value">{formatCurrency(kpiData.totalRevenue)}</div>
            <div className="kpi-trend">원</div>
          </div>
        </div>
      )}
      </div>

      {/* 데이터 기반 의사결정 도구 */}
      <div className="collapsible-section">
        <div
          className="collapsible-header"
          onClick={() => setDecisionToolExpanded(!decisionToolExpanded)}
        >
          <div className="collapsible-title">
            <span className="collapsible-icon">🔬</span>
            <span>데이터 기반 의사결정 도구</span>
          </div>
          <button className="collapsible-toggle">
            <span>{decisionToolExpanded ? '접기' : '펼치기'}</span>
            <span style={{ transform: decisionToolExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
          </button>
        </div>

        <div className={`collapsible-content ${decisionToolExpanded ? 'expanded' : ''}`}>
          {/* 기간 필터 */}
          <div className="period-filter-bar">
            <div className="period-filter-row">
              <span className="period-filter-label">📅 분석 기간:</span>
              <div className="period-filter-btns">
                <button
                  className={`period-filter-btn ${currentPeriod === 'full' ? 'active' : ''}`}
                  onClick={() => setCurrentPeriod('full')}
                >
                  전체 기간
                </button>
                <button
                  className={`period-filter-btn ${currentPeriod === '180d' ? 'active' : ''}`}
                  onClick={() => setCurrentPeriod('180d')}
                >
                  최근 180일
                </button>
                <button
                  className={`period-filter-btn ${currentPeriod === '90d' ? 'active' : ''}`}
                  onClick={() => setCurrentPeriod('90d')}
                >
                  최근 90일
                </button>
              </div>
              <span className="period-date-range">
                {periodInfo.start} ~ {periodInfo.end} ({periodInfo.days}일)
              </span>
            </div>
          </div>

          {/* 탭 버튼 */}
          <div className="view-type-section">
            <button
              className={`view-btn ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              📋 오늘의 요약
            </button>
            <button
              className={`view-btn ${activeTab === 'opportunity' ? 'active' : ''}`}
              onClick={() => setActiveTab('opportunity')}
            >
              🎯 성과 기회
            </button>
            <button
              className={`view-btn ${activeTab === 'warning' ? 'active' : ''}`}
              onClick={() => setActiveTab('warning')}
            >
              ⚠️ 주의 필요
            </button>
            <button
              className={`view-btn ${activeTab === 'targeting' ? 'active' : ''}`}
              onClick={() => setActiveTab('targeting')}
            >
              👥 타겟 분석
            </button>
            <button
              className={`view-btn ${activeTab === 'forecast' ? 'active' : ''}`}
              onClick={() => setActiveTab('forecast')}
              style={{ position: 'relative' }}
            >
              🔮 AI 예측
              <span className="badge">향후 30일</span>
            </button>
            <button
              className={`view-btn ${activeTab === 'dayAnalysis' ? 'active' : ''}`}
              onClick={() => setActiveTab('dayAnalysis')}
              style={{ position: 'relative' }}
            >
              📊 계절성 분석
              <span className="badge">전체 기간</span>
            </button>

            <div className="tab-legend">
              <span className="tab-legend-item">
                <span className="tab-legend-dot" style={{ background: '#673ab7' }}></span>
                기간 필터 적용
              </span>
              <span className="tab-legend-item">
                <span className="tab-legend-dot" style={{ background: '#78909c' }}></span>
                전체 기간 고정
              </span>
            </div>
          </div>

          {/* 탭 컨텐츠 - 오늘의 요약 */}
          <div className={`tab-content ${activeTab === 'summary' ? 'active' : ''}`}>
            {/* AI 컨설턴트 종합 진단 카드 */}
            {decisionToolData.summaryCard && (
              <div className="ai-consultant-card">
                <div className="ai-consultant-card-inner">
                  <div className="ai-consultant-icon">🤖</div>
                  <div className="ai-consultant-content">
                    <div className="ai-consultant-header">
                      <span className="ai-consultant-title">{decisionToolData.summaryCard.title || '마케팅 종합 진단'}</span>
                      <span className="ai-consultant-period-badge">전체 기간 기준</span>
                    </div>
                    <div className="ai-consultant-metrics">
                      <div className="ai-consultant-metric">
                        {decisionToolData.summaryCard.total_roas_formatted || `ROAS ${formatPercent(decisionToolData.summary.overall_roas)}`}
                      </div>
                      <div className="ai-consultant-metric">
                        매출 {decisionToolData.summaryCard.total_revenue_formatted || formatCurrency(decisionToolData.summary.total_revenue)}
                      </div>
                      <div className="ai-consultant-metric">
                        비용 {decisionToolData.summaryCard.total_cost_formatted || formatCurrency(decisionToolData.summary.total_cost)}
                      </div>
                    </div>
                    <div className="ai-consultant-message">
                      {decisionToolData.summaryCard.message || ''}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 핵심 지표 대시보드 */}
            <div className="kpi-dashboard-grid">
              <div className="kpi-dashboard-card" style={{ background: performanceStatus.bg, border: `1px solid ${performanceStatus.color}20` }}>
                <div className="kpi-status-badge" style={{ background: performanceStatus.color }}>
                  {performanceStatus.icon} {performanceStatus.text}
                </div>
                <div className="kpi-dashboard-label">ROAS</div>
                <div className="kpi-dashboard-value" style={{ color: performanceStatus.color }}>
                  {formatPercent(decisionToolData.summary.overall_roas)}
                </div>
              </div>
              <div className="kpi-dashboard-card" style={{ background: '#e3f2fd', border: '1px solid #90caf920' }}>
                <div className="kpi-dashboard-label">CPA</div>
                <div className="kpi-dashboard-value" style={{ color: '#1565c0' }}>
                  {formatCurrency(decisionToolData.summary.overall_cpa)}
                </div>
              </div>
              <div className="kpi-dashboard-card" style={{ background: '#f3e5f5', border: '1px solid #ce93d820' }}>
                <div className="kpi-dashboard-label">총 전환수</div>
                <div className="kpi-dashboard-value" style={{ color: '#7b1fa2' }}>
                  {formatNumber(decisionToolData.summary.total_conversions)}
                </div>
              </div>
              <div className="kpi-dashboard-card" style={{ background: '#fff8e1', border: '1px solid #ffcc8020' }}>
                <div className="kpi-dashboard-label">총 매출</div>
                <div className="kpi-dashboard-value" style={{ color: '#f57c00' }}>
                  {formatCurrency(decisionToolData.summary.total_revenue)}
                </div>
              </div>
            </div>

            {/* 한줄 요약 */}
            {(recentTrend.text || channelAnalysis.topChannel) && (
              <div className="storyline-summary" style={{ borderLeftColor: performanceStatus.color }}>
                <div className="storyline-text">
                  <span style={{ fontSize: 18, marginRight: 8 }}>{recentTrend.icon}</span>
                  {recentTrend.text && <><strong>{recentTrend.text}</strong>입니다. </>}
                  {channelAnalysis.topChannel && (
                    <>현재 <strong style={{ color: '#2e7d32' }}>{channelAnalysis.topChannel.name}</strong> 채널이 ROAS {formatPercent(channelAnalysis.topChannel.roas)}로 가장 좋은 성과를 보이고 있습니다.</>
                  )}
                </div>
              </div>
            )}

            {/* 액션 가이드 섹션 */}
            <div className="action-guide-section">
              <div className="action-guide-tabs">
                <button
                  type="button"
                  className={`action-guide-tab ${actionGuideTab === 'quickAction' ? 'active' : ''}`}
                  onClick={() => setActionGuideTab('quickAction')}
                >
                  ✅ 지금 바로 할 수 있는 일
                </button>
                <button
                  type="button"
                  className={`action-guide-tab ${actionGuideTab === 'aiRecommend' ? 'active' : ''}`}
                  onClick={() => setActionGuideTab('aiRecommend')}
                >
                  🎯 AI 핵심 추천 {recommendationGroups.urgentRecs.length > 0 && (
                    <span style={{ padding: '2px 6px', background: '#ff5722', color: 'white', borderRadius: 8, fontSize: 10, marginLeft: 4 }}>
                      {recommendationGroups.urgentRecs.length}
                    </span>
                  )}
                </button>
              </div>

              {/* 지금 바로 할 수 있는 일 */}
              {actionGuideTab === 'quickAction' && (
                <div className="action-guide-content">
                  <div className="action-cards-grid">
                    {/* 확대할 채널 */}
                    {channelAnalysis.topChannel && channelAnalysis.topChannel.roas >= 200 ? (
                      <div className="action-card" style={{ background: '#e8f5e9', border: '2px solid #4caf50' }}>
                        <div className="action-card-header">
                          <span className="action-card-icon">🔥</span>
                          <div style={{ flex: 1 }}>
                            <div className="action-card-title" style={{ color: '#2e7d32' }}>예산 늘리기</div>
                            <div className="action-card-subtitle" style={{ color: '#2e7d32' }}>고효율 채널</div>
                          </div>
                          <span className="action-card-badge" style={{ background: '#4caf50' }}>SCALE-UP</span>
                        </div>
                        <div className="action-card-metrics">
                          <span className="action-card-metric" style={{ color: '#2e7d32', border: '1px solid #81c784' }}>{channelAnalysis.topChannel.name}</span>
                          <span className="action-card-metric" style={{ color: '#1565c0', border: '1px solid #90caf9' }}>ROAS {formatPercent(channelAnalysis.topChannel.roas)}</span>
                        </div>
                        <div className="action-card-recommendation" style={{ borderLeftColor: '#4caf50' }}>
                          <div className="action-card-rec-title" style={{ color: '#2e7d32' }}>💡 추천 액션</div>
                          <div className="action-card-rec-text">예산을 <strong>10-20%</strong> 더 투자하세요</div>
                        </div>
                      </div>
                    ) : (
                      <div className="action-card" style={{ background: '#e3f2fd', border: '2px solid #2196f3' }}>
                        <div className="action-card-header">
                          <span className="action-card-icon">📊</span>
                          <div style={{ flex: 1 }}>
                            <div className="action-card-title" style={{ color: '#1565c0' }}>성과 분석</div>
                            <div className="action-card-subtitle" style={{ color: '#1565c0' }}>채널 비교</div>
                          </div>
                          <span className="action-card-badge" style={{ background: '#2196f3' }}>ANALYZE</span>
                        </div>
                        <div className="action-card-recommendation" style={{ borderLeftColor: '#2196f3' }}>
                          <div className="action-card-rec-title" style={{ color: '#1565c0' }}>💡 추천 액션</div>
                          <div className="action-card-rec-text">채널별 성과를 비교하여 <strong>가장 효율적인 채널</strong>을 찾아보세요</div>
                        </div>
                      </div>
                    )}

                    {/* CPA 최적화 */}
                    {channelAnalysis.lowCpaChannel && (
                      <div className="action-card" style={{ background: '#e3f2fd', border: '2px solid #2196f3' }}>
                        <div className="action-card-header">
                          <span className="action-card-icon">💰</span>
                          <div style={{ flex: 1 }}>
                            <div className="action-card-title" style={{ color: '#1565c0' }}>비용 효율화</div>
                            <div className="action-card-subtitle" style={{ color: '#1565c0' }}>CPA 최적화</div>
                          </div>
                          <span className="action-card-badge" style={{ background: '#2196f3' }}>EFFICIENT</span>
                        </div>
                        <div className="action-card-metrics">
                          <span className="action-card-metric" style={{ color: '#1565c0', border: '1px solid #90caf9' }}>{channelAnalysis.lowCpaChannel.name}</span>
                          <span className="action-card-metric" style={{ color: '#5e35b1', border: '1px solid #b39ddb' }}>CPA {formatCurrency(channelAnalysis.lowCpaChannel.cpa)}</span>
                        </div>
                        <div className="action-card-recommendation" style={{ borderLeftColor: '#2196f3' }}>
                          <div className="action-card-rec-title" style={{ color: '#1565c0' }}>💡 추천 액션</div>
                          <div className="action-card-rec-text">전환당 비용이 가장 낮은 채널에 집중하세요</div>
                        </div>
                      </div>
                    )}

                    {/* 개선 필요 or 타겟 최적화 */}
                    {channelAnalysis.poorChannel && channelAnalysis.poorChannel.roas < 100 ? (
                      <div className="action-card" style={{ background: '#fff3e0', border: '2px solid #ff9800' }}>
                        <div className="action-card-header">
                          <span className="action-card-icon">⚠️</span>
                          <div style={{ flex: 1 }}>
                            <div className="action-card-title" style={{ color: '#e65100' }}>점검 필요</div>
                            <div className="action-card-subtitle" style={{ color: '#e65100' }}>저효율 채널</div>
                          </div>
                          <span className="action-card-badge" style={{ background: '#ff9800' }}>REVIEW</span>
                        </div>
                        <div className="action-card-metrics">
                          <span className="action-card-metric" style={{ color: '#e65100', border: '1px solid #ffcc80' }}>{channelAnalysis.poorChannel.name}</span>
                          <span className="action-card-metric" style={{ color: '#c62828', border: '1px solid #ef9a9a' }}>ROAS {formatPercent(channelAnalysis.poorChannel.roas)}</span>
                        </div>
                        <div className="action-card-recommendation" style={{ borderLeftColor: '#ff9800' }}>
                          <div className="action-card-rec-title" style={{ color: '#e65100' }}>⚠️ 추천 액션</div>
                          <div className="action-card-rec-text">광고 소재를 교체해보세요</div>
                        </div>
                      </div>
                    ) : (
                      <div className="action-card" style={{ background: '#f3e5f5', border: '2px solid #9c27b0' }}>
                        <div className="action-card-header">
                          <span className="action-card-icon">🎯</span>
                          <div style={{ flex: 1 }}>
                            <div className="action-card-title" style={{ color: '#7b1fa2' }}>타겟 최적화</div>
                            <div className="action-card-subtitle" style={{ color: '#7b1fa2' }}>고객층 분석</div>
                          </div>
                          <span className="action-card-badge" style={{ background: '#9c27b0' }}>OPTIMIZE</span>
                        </div>
                        <div className="action-card-recommendation" style={{ borderLeftColor: '#9c27b0' }}>
                          <div className="action-card-rec-title" style={{ color: '#7b1fa2' }}>💡 추천 액션</div>
                          <div className="action-card-rec-text">&apos;타겟 분석&apos; 탭에서 가장 효과적인 <strong>고객층</strong>을 확인하세요</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI 핵심 추천 */}
              {actionGuideTab === 'aiRecommend' && (
                <div className="action-guide-content">
                  {decisionToolData.topRecommendations.length > 0 ? (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[...recommendationGroups.urgentRecs.slice(0, 3), ...(showMoreRecommendations ? [...recommendationGroups.urgentRecs.slice(3), ...recommendationGroups.otherRecs] : [])].map((rec, idx) => {
                          const severityConfig: Record<string, { border: string; bg: string; text: string; icon: string; badge: string }> = {
                            positive: { border: '#4caf50', bg: '#e8f5e9', text: '#2e7d32', icon: '👑', badge: 'SCALE-UP' },
                            high: { border: '#f44336', bg: '#ffebee', text: '#c62828', icon: '🚨', badge: 'URGENT' },
                            warning: { border: '#ff9800', bg: '#fff3e0', text: '#e65100', icon: '⚠️', badge: 'REVIEW' },
                            opportunity: { border: '#2196f3', bg: '#e3f2fd', text: '#1565c0', icon: '💎', badge: 'GROW' },
                            info: { border: '#2196f3', bg: '#e3f2fd', text: '#1565c0', icon: '💡', badge: 'INFO' }
                          }
                          const config = severityConfig[rec.severity || 'info'] || severityConfig.info

                          return (
                            <div key={idx} className="action-card" style={{ background: config.bg, border: `2px solid ${config.border}` }}>
                              <div className="action-card-header">
                                <span className="action-card-icon">{config.icon}</span>
                                <div style={{ flex: 1 }}>
                                  <div className="action-card-title" style={{ color: config.text }}>{rec.title || `추천 ${idx + 1}`}</div>
                                  <div className="action-card-subtitle" style={{ color: config.text }}>{rec.category || 'AI 분석'}</div>
                                </div>
                                <span className="action-card-badge" style={{ background: rec.priority === 'high' ? '#ff5722' : config.border }}>
                                  {rec.priority === 'high' ? '긴급' : config.badge}
                                </span>
                              </div>
                              <div style={{ fontSize: 11, color: '#333', lineHeight: 1.5, marginBottom: 10, padding: 8, background: 'rgba(255,255,255,0.6)', borderRadius: 6 }}>
                                {rec.message}
                              </div>
                              {rec.action && (
                                <div className="action-card-recommendation" style={{ borderLeftColor: config.border }}>
                                  <div className="action-card-rec-title" style={{ color: config.text }}>💡 실행 가이드</div>
                                  <div className="action-card-rec-text">{rec.action}</div>
                                </div>
                              )}
                              {rec.expected_impact && (
                                <div className="action-card-metrics" style={{ marginTop: 8 }}>
                                  <span className="action-card-metric" style={{ color: '#2e7d32', border: '1px solid #81c784' }}>📈 {rec.expected_impact}</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      {(recommendationGroups.urgentRecs.length > 3 || recommendationGroups.otherRecs.length > 0) && (
                        <div style={{ textAlign: 'center', marginTop: 12 }}>
                          <button
                            type="button"
                            className="show-more-btn"
                            onClick={() => setShowMoreRecommendations(!showMoreRecommendations)}
                          >
                            {showMoreRecommendations ? '접기' : `더 보기 (${recommendationGroups.urgentRecs.length - 3 + recommendationGroups.otherRecs.length}건)`}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--grey-500)' }}>현재 AI 추천 사항이 없습니다.</div>
                  )}
                </div>
              )}
            </div>

            {/* 채널 성과 순위 */}
            {sortedCategories.length > 0 && (
              <div style={{ padding: 16, background: 'white', borderRadius: 12, border: '1px solid var(--grey-200)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--grey-900)', marginBottom: 12 }}>
                  📊 채널별 성과 순위
                </div>
                <table className="channel-ranking-table">
                  <thead>
                    <tr>
                      <th>채널</th>
                      <th className="text-right">ROAS</th>
                      <th className="text-right">CPA</th>
                      <th className="text-center">권장</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCategories.slice(0, 5).map((cat, idx) => {
                      const roasLevel = cat.roas > 200 ? 'high' : cat.roas > 100 ? 'mid' : 'low'
                      let verdict = ''
                      let verdictColor = ''
                      let verdictBg = ''

                      if (roasLevel === 'high') {
                        verdict = '🔥 확대'
                        verdictColor = '#2e7d32'
                        verdictBg = '#e8f5e9'
                      } else if (roasLevel === 'low') {
                        verdict = '⚠️ 검토'
                        verdictColor = '#e65100'
                        verdictBg = '#fff3e0'
                      } else {
                        verdict = '✓ 유지'
                        verdictColor = '#757575'
                        verdictBg = '#f5f5f5'
                      }

                      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''

                      return (
                        <tr key={idx}>
                          <td style={{ fontWeight: 500 }}>{medal} {cat.name}</td>
                          <td className="text-right" style={{ fontWeight: 700, color: roasLevel === 'high' ? '#2e7d32' : roasLevel === 'low' ? '#d32f2f' : 'var(--grey-900)' }}>
                            {formatPercent(cat.roas)}
                          </td>
                          <td className="text-right" style={{ color: 'var(--grey-700)' }}>{formatCurrency(cat.cpa)}</td>
                          <td className="text-center">
                            <span className="verdict-badge" style={{ background: verdictBg, color: verdictColor }}>{verdict}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 탭 컨텐츠 - 성과 기회 */}
          <div className={`tab-content ${activeTab === 'opportunity' ? 'active' : ''}`}>
            {/* 인트로 메시지 */}
            <div style={{ marginBottom: 16, padding: '16px 20px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: 12, borderLeft: '4px solid #4caf50' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 28 }}>🎯</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#2e7d32' }}>성과가 좋은 곳에 더 투자하세요</span>
                    <span style={{ fontSize: 10, color: '#4caf50', background: 'rgba(76, 175, 80, 0.1)', padding: '2px 8px', borderRadius: 10, marginLeft: 'auto' }}>전체 기간 기준</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--grey-700)', lineHeight: 1.6 }}>
                    아래는 <strong>예산을 늘리면 더 좋은 성과</strong>를 낼 수 있는 채널과 상품입니다.
                  </div>
                </div>
              </div>
            </div>

            {/* 확대 추천 채널 */}
            {sortedCategories.filter(c => c.roas >= 200).length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--grey-900)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🔥 예산 확대 추천 채널
                  <span style={{ fontSize: 10, color: 'var(--grey-500)', fontWeight: 400 }}>(ROAS 200% 이상)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                  {sortedCategories.filter(c => c.roas >= 200).slice(0, 4).map((cat, idx) => {
                    const increasePercent = cat.roas >= 500 ? '20-30%' : cat.roas >= 300 ? '15-20%' : '10-15%'
                    return (
                      <div key={idx} style={{ padding: 14, background: 'white', borderRadius: 10, border: '2px solid #4caf50', position: 'relative' }}>
                        {idx === 0 && (
                          <div style={{ position: 'absolute', top: -8, right: 10, padding: '2px 8px', background: '#4caf50', color: 'white', fontSize: 9, fontWeight: 600, borderRadius: 8 }}>TOP</div>
                        )}
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--grey-800)', marginBottom: 8 }}>{cat.name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--grey-500)' }}>ROAS</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#2e7d32' }}>{formatPercent(cat.roas)}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 9, color: 'var(--grey-500)' }}>추천 증액</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1565c0' }}>{increasePercent}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 16, padding: 20, background: '#f5f5f5', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
                <div style={{ fontSize: 13, color: 'var(--grey-700)' }}>현재 ROAS 200% 이상 채널이 없습니다</div>
                <div style={{ fontSize: 11, color: 'var(--grey-500)', marginTop: 4 }}>광고 소재 개선이나 타겟 최적화를 고려해보세요</div>
              </div>
            )}

            {/* 효율 좋은 상품 */}
            {decisionToolData.productPerformance.filter(p => p.roas >= 150).length > 0 && (
              <div style={{ marginBottom: 16, padding: 14, background: '#f5f5f5', borderRadius: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--grey-900)', marginBottom: 10 }}>
                  🛍️ 효율 좋은 상품
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {decisionToolData.productPerformance.filter(p => p.roas >= 150).slice(0, 5).map((prod, idx) => (
                    <div key={idx} style={{ padding: '6px 12px', background: 'white', borderRadius: 16, fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, color: 'var(--grey-800)' }}>{prod.product}</span>
                      <span style={{ color: '#2e7d32', fontWeight: 700 }}>{formatPercent(prod.roas)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TOP 광고세트 */}
            {decisionToolData.topAdsets.length > 0 && (
              <div style={{ border: '1px solid var(--grey-200)', borderRadius: 10, overflow: 'hidden' }}>
                <div
                  style={{ padding: '10px 14px', background: '#fafafa', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => setExpandedTopAdsets(!expandedTopAdsets)}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--grey-800)' }}>📈 성과 TOP 광고세트 (상위 5개)</span>
                  <span style={{ fontSize: 10, color: 'var(--grey-500)' }}>{expandedTopAdsets ? '▼' : '▶'}</span>
                </div>
                {expandedTopAdsets && (
                  <div style={{ padding: 12 }}>
                    {/* 색상 범례 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '8px 12px', background: '#f8f9fa', borderRadius: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, color: 'var(--grey-600)', fontWeight: 600 }}>ROAS 스케일:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <div style={{ width: 14, height: 14, background: 'linear-gradient(90deg, #4caf50, #81c784)', borderRadius: 3 }}></div>
                          <span style={{ fontSize: 10, color: '#2e7d32', fontWeight: 600 }}>500%+</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <div style={{ width: 14, height: 14, background: 'linear-gradient(90deg, #8bc34a, #aed581)', borderRadius: 3 }}></div>
                          <span style={{ fontSize: 10, color: '#558b2f', fontWeight: 600 }}>300%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <div style={{ width: 14, height: 14, background: 'linear-gradient(90deg, #ffeb3b, #fff176)', borderRadius: 3 }}></div>
                          <span style={{ fontSize: 10, color: '#f57f17', fontWeight: 600 }}>200%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <div style={{ width: 14, height: 14, background: 'linear-gradient(90deg, #ff9800, #ffb74d)', borderRadius: 3 }}></div>
                          <span style={{ fontSize: 10, color: '#e65100', fontWeight: 600 }}>100%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <div style={{ width: 14, height: 14, background: 'linear-gradient(90deg, #ef5350, #e57373)', borderRadius: 3 }}></div>
                          <span style={{ fontSize: 10, color: '#c62828', fontWeight: 600 }}>&lt;100%</span>
                        </div>
                      </div>
                    </div>
                    {decisionToolData.topAdsets.slice(0, 5).map((adset, idx) => {
                      const roas = adset.roas || 0
                      let barColor: string
                      let textColor: string

                      if (roas >= 500) {
                        barColor = 'linear-gradient(90deg, #4caf50, #81c784)'
                        textColor = '#2e7d32'
                      } else if (roas >= 300) {
                        barColor = 'linear-gradient(90deg, #8bc34a, #aed581)'
                        textColor = '#558b2f'
                      } else if (roas >= 200) {
                        barColor = 'linear-gradient(90deg, #ffeb3b, #fff176)'
                        textColor = '#f57f17'
                      } else if (roas >= 100) {
                        barColor = 'linear-gradient(90deg, #ff9800, #ffb74d)'
                        textColor = '#e65100'
                      } else {
                        barColor = 'linear-gradient(90deg, #ef5350, #e57373)'
                        textColor = '#c62828'
                      }

                      const maxRoas = Math.max(...decisionToolData.topAdsets.slice(0, 5).map(a => a.roas || 0))
                      const barWidth = Math.min((roas / maxRoas) * 100, 100)

                      return (
                        <div key={idx} style={{ marginBottom: 10, padding: '10px 12px', background: '#fafafa', borderRadius: 8, position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${barWidth}%`, background: barColor, opacity: 0.15, borderRadius: 8 }}></div>
                          <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--grey-800)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ width: 18, height: 18, background: barColor, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 700 }}>{idx + 1}</span>
                                  {adset.adset}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--grey-500)', marginTop: 2, marginLeft: 24 }}>{adset.category}</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: textColor }}>{formatPercent(roas)}</div>
                                <div style={{ fontSize: 9, color: 'var(--grey-500)' }}>ROAS</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 액션 가이드 */}
            <div style={{ marginTop: 16, padding: '12px 14px', background: 'linear-gradient(135deg, #fff8e1 0%, #fff3e0 100%)', borderRadius: 10, borderLeft: '3px solid #ffc107' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#f57f17', marginBottom: 6 }}>💡 이렇게 실행하세요</div>
              <div style={{ fontSize: 11, color: 'var(--grey-800)', lineHeight: 1.7 }}>
                1. 🔥 표시된 채널의 일일 예산을 <strong>10-20%</strong> 늘려보세요<br />
                2. 효율 좋은 상품 광고의 <strong>노출을 확대</strong>하세요<br />
                3. 3-5일 후 성과를 확인하고 추가 조정하세요
              </div>
            </div>
          </div>

          {/* 탭 컨텐츠 - 주의 필요 */}
          <div className={`tab-content ${activeTab === 'warning' ? 'active' : ''}`}>
            {warningGroups.totalIssues === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#2e7d32', marginBottom: 8 }}>모든 광고가 잘 돌아가고 있어요!</div>
                <div style={{ fontSize: 13, color: 'var(--grey-600)', lineHeight: 1.6 }}>
                  현재 특별히 주의가 필요한 항목이 없습니다.<br />
                  계속해서 좋은 성과를 유지해주세요.
                </div>
              </div>
            ) : (
              <>
                {/* 인트로 메시지 */}
                <div style={{ marginBottom: 16, padding: '16px 20px', background: 'linear-gradient(135deg, #ffebee 0%, #fff5f5 100%)', borderRadius: 12, borderLeft: '4px solid #ef5350' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontSize: 28 }}>⚠️</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#c62828' }}>확인이 필요한 항목이 있어요</span>
                        <span style={{ fontSize: 10, color: '#ef5350', background: 'rgba(239, 83, 80, 0.1)', padding: '2px 8px', borderRadius: 10, marginLeft: 'auto' }}>전체 기간 기준</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--grey-700)', lineHeight: 1.6 }}>
                        아래 항목들은 <strong>예산 낭비</strong>가 발생할 수 있어요. 빨리 조치하면 손실을 줄일 수 있습니다.
                      </div>
                    </div>
                  </div>
                </div>

                {/* 서브탭 */}
                <div style={{ marginBottom: 16 }}>
                  <div className="warning-subtabs">
                    {warningGroups.warnings.length > 0 && (
                      <button
                        type="button"
                        className={`warning-subtab ${warningSubtab === 'aiAlert' ? 'active' : ''}`}
                        onClick={() => setWarningSubtab('aiAlert')}
                        style={{
                          background: warningSubtab === 'aiAlert' ? '#ffebee' : 'transparent',
                          color: warningSubtab === 'aiAlert' ? '#d32f2f' : 'var(--grey-600)',
                          borderBottomColor: warningSubtab === 'aiAlert' ? '#d32f2f' : 'transparent'
                        }}
                      >
                        🚨 AI 분석 경고 {warningGroups.warnings.length}개
                      </button>
                    )}
                    {warningGroups.highCpaCategories.length > 0 && (
                      <button
                        type="button"
                        className={`warning-subtab ${warningSubtab === 'cpa' ? 'active' : ''}`}
                        onClick={() => setWarningSubtab('cpa')}
                        style={{
                          background: warningSubtab === 'cpa' ? '#fff3e0' : 'transparent',
                          color: warningSubtab === 'cpa' ? '#e65100' : 'var(--grey-600)',
                          borderBottomColor: warningSubtab === 'cpa' ? '#e65100' : 'transparent'
                        }}
                      >
                        🟠 CPA 높음 {warningGroups.highCpaCategories.length}개
                      </button>
                    )}
                    {warningGroups.lowRoasProducts.length > 0 && (
                      <button
                        type="button"
                        className={`warning-subtab ${warningSubtab === 'products' ? 'active' : ''}`}
                        onClick={() => setWarningSubtab('products')}
                        style={{
                          background: warningSubtab === 'products' ? '#f3e5f5' : 'transparent',
                          color: warningSubtab === 'products' ? '#7b1fa2' : 'var(--grey-600)',
                          borderBottomColor: warningSubtab === 'products' ? '#7b1fa2' : 'transparent'
                        }}
                      >
                        🟣 비효율 상품 {warningGroups.lowRoasProducts.length}개
                      </button>
                    )}
                  </div>
                </div>

                {/* AI 분석 경고 컨텐츠 */}
                {warningSubtab === 'aiAlert' && warningGroups.warnings.length > 0 && (
                  <div style={{ padding: 14, background: 'white', borderRadius: 10, border: '1px solid #ffcdd2' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#d32f2f', marginBottom: 12 }}>
                      🚨 AI가 감지한 경고 알림
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {warningGroups.warnings.slice(0, showMoreAlerts ? undefined : 3).map((alert, idx) => {
                        // severity에 따른 스타일 설정
                        const severityConfig: Record<string, { border: string; bg: string; text: string; badge: string; icon: string }> = {
                          'positive': { border: '#4caf50', bg: '#e8f5e9', text: '#2e7d32', badge: '핵심', icon: '👑' },
                          'high': { border: '#f44336', bg: '#ffebee', text: '#c62828', badge: '긴급', icon: '🚨' },
                          'warning': { border: '#ff9800', bg: '#fff3e0', text: '#e65100', badge: '주의', icon: '⚠️' },
                          'opportunity': { border: '#2196f3', bg: '#e3f2fd', text: '#1565c0', badge: '기회', icon: '💎' }
                        }
                        const config = severityConfig[alert.severity || 'warning'] || severityConfig['warning']

                        // 타입별 한국어 제목 매핑
                        const typeTitleMap: Record<string, string> = {
                          'forecast_underperformance': '예측 대비 실적 미달',
                          'low_roas': '낮은 ROAS 경고',
                          'high_cpa': '높은 CPA 경고',
                          'budget_waste': '예산 낭비 가능성',
                          'performance_drop': '성과 하락 감지'
                        }
                        const alertTitle = alert.title || typeTitleMap[alert.type || ''] || '경고'

                        return (
                          <div key={idx} style={{ background: config.bg, border: `2px solid ${config.border}`, borderRadius: 10, padding: 14, transition: 'transform 0.2s' }}>
                            {/* 헤더 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <span style={{ fontSize: 18 }}>{config.icon}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: config.text }}>{alertTitle}</div>
                                <div style={{ fontSize: 10, color: config.text, opacity: 0.8 }}>AI 분석</div>
                              </div>
                              <span style={{ background: config.border, color: 'white', fontSize: 9, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                                {config.badge}
                              </span>
                            </div>
                            {/* 메시지 */}
                            <div style={{ fontSize: 11, color: '#333', lineHeight: 1.5, marginBottom: 10, padding: 8, background: 'rgba(255,255,255,0.6)', borderRadius: 6 }}>
                              {alert.message}
                            </div>
                            {/* Financial Impact 표시 */}
                            {alert.financial_impact && (
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                                {alert.financial_impact.loss_amount && (
                                  <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#c62828', border: '1px solid #ef9a9a', fontWeight: 500 }}>
                                    예상 손실 {alert.financial_impact.loss_amount}
                                  </span>
                                )}
                                {alert.financial_impact.potential_uplift && (
                                  <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#2e7d32', border: '1px solid #81c784', fontWeight: 500 }}>
                                    기대 수익 {alert.financial_impact.potential_uplift}
                                  </span>
                                )}
                              </div>
                            )}
                            {/* Action 가이드 */}
                            {alert.action && (
                              <div style={{ background: '#ffffff', borderRadius: 6, padding: 10, borderLeft: `3px solid ${config.border}` }}>
                                <div style={{ fontSize: 10, fontWeight: 600, color: config.text, marginBottom: 4 }}>💡 실행 가이드</div>
                                <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>{alert.action}</div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {warningGroups.warnings.length > 3 && (
                      <div style={{ textAlign: 'center', marginTop: 12 }}>
                        <button type="button" className="show-more-btn" onClick={() => setShowMoreAlerts(!showMoreAlerts)}>
                          {showMoreAlerts ? '접기' : `더 보기 (${warningGroups.warnings.length - 3}건)`}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* CPA 높은 채널 컨텐츠 */}
                {warningSubtab === 'cpa' && warningGroups.highCpaCategories.length > 0 && (
                  <div style={{ padding: 14, background: 'white', borderRadius: 10, border: '1px solid #ffe0b2' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#e65100', marginBottom: 12 }}>
                      🟠 전환 비용이 너무 높은 채널
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {warningGroups.highCpaCategories.slice(0, showMoreCpa ? undefined : 3).map((cat, idx) => {
                        const cpaRatio = ((cat.cpa / decisionToolData.summary.overall_cpa - 1) * 100).toFixed(0)
                        return (
                          <div key={idx} style={{ background: '#fff3e0', border: '2px solid #ff9800', borderRadius: 10, padding: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <span style={{ fontSize: 18 }}>💰</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#e65100' }}>{cat.name}</div>
                                <div style={{ fontSize: 10, color: '#e65100', opacity: 0.8 }}>CPA 초과</div>
                              </div>
                              <span style={{ background: '#ff9800', color: 'white', fontSize: 9, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>+{cpaRatio}%</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#e65100', border: '1px solid #ffcc80', fontWeight: 500 }}>CPA {formatCurrency(cat.cpa)}</span>
                              <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#5e35b1', border: '1px solid #b39ddb', fontWeight: 500 }}>평균 {formatCurrency(decisionToolData.summary.overall_cpa)}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {warningGroups.highCpaCategories.length > 3 && (
                      <div style={{ textAlign: 'center', marginTop: 12 }}>
                        <button type="button" className="show-more-btn" onClick={() => setShowMoreCpa(!showMoreCpa)}>
                          {showMoreCpa ? '접기' : `더 보기 (${warningGroups.highCpaCategories.length - 3}건)`}
                        </button>
                      </div>
                    )}
                    <div style={{ marginTop: 12, padding: 10, background: '#fff8f0', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#e65100', marginBottom: 4 }}>💡 이렇게 해보세요</div>
                      <div style={{ fontSize: 10, color: 'var(--grey-700)', lineHeight: 1.6 }}>
                        • 입찰 금액을 낮춰보세요<br />
                        • 더 정확한 타겟에게만 광고를 노출하세요
                      </div>
                    </div>
                  </div>
                )}

                {/* 비효율 상품 컨텐츠 */}
                {warningSubtab === 'products' && warningGroups.lowRoasProducts.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {warningGroups.lowRoasProducts.map((prod, idx) => (
                      <div key={idx} style={{ background: '#f3e5f5', border: '2px solid #9c27b0', borderRadius: 10, padding: 14, transition: 'transform 0.2s' }}>
                        {/* 헤더 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 18 }}>📦</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#7b1fa2' }}>{prod.product}</div>
                            <div style={{ fontSize: 10, color: '#7b1fa2', opacity: 0.8 }}>비효율 상품</div>
                          </div>
                          <span style={{ background: '#9c27b0', color: 'white', fontSize: 9, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>REVIEW</span>
                        </div>
                        {/* 메트릭스 배지 */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                          <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#7b1fa2', border: '1px solid #ce93d8', fontWeight: 500 }}>ROAS {formatPercent(prod.roas)}</span>
                          {prod.cost && (
                            <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#5e35b1', border: '1px solid #b39ddb', fontWeight: 500 }}>비용 {formatCurrency(prod.cost)}</span>
                          )}
                        </div>
                        {/* 추천 액션 */}
                        <div style={{ background: '#ffffff', borderRadius: 6, padding: 10, borderLeft: '3px solid #9c27b0' }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: '#7b1fa2', marginBottom: 4 }}>💡 추천 액션</div>
                          <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>광고보다 프로모션/할인이 더 효과적일 수 있어요</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* 탭 컨텐츠 - 타겟 분석 */}
          <div className={`tab-content ${activeTab === 'targeting' ? 'active' : ''}`}>
            {/* 인트로 메시지 */}
            <div style={{ marginBottom: 16, padding: '16px 20px', background: 'linear-gradient(135deg, #e8eaf6 0%, #f5f5ff 100%)', borderRadius: 12, borderLeft: '4px solid #5c6bc0' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 28 }}>👥</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#3949ab' }}>누구에게 광고를 보여줘야 효과적일까요?</span>
                    <span style={{ fontSize: 10, color: '#5c6bc0', background: 'rgba(92, 107, 192, 0.1)', padding: '2px 8px', borderRadius: 10, marginLeft: 'auto' }}>전체 기간 기준</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--grey-700)', lineHeight: 1.6 }}>
                    성별, 연령, 기기별로 <strong>어떤 고객이 가장 잘 반응하는지</strong> 분석했습니다.
                  </div>
                </div>
              </div>
            </div>

            {/* 가장 효과적인 타겟 */}
            <div style={{ marginBottom: 16, padding: 16, background: 'white', borderRadius: 12, border: '1px solid var(--grey-200)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--grey-900)', marginBottom: 12 }}>🏆 가장 효과적인 타겟</div>
              <div className="target-summary-grid">
                {topTargets.topGender && (
                  <div className="target-summary-card" style={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)' }}>
                    <div className="target-summary-icon">👤</div>
                    <div className="target-summary-label">성별</div>
                    <div className="target-summary-value" style={{ color: '#2e7d32' }}>{normalizeGender(topTargets.topGender.gender)}</div>
                    <div className="target-summary-metric">ROAS {formatPercent(topTargets.topGender.roas)}</div>
                  </div>
                )}
                {topTargets.topDevice && (
                  <div className="target-summary-card" style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%)' }}>
                    <div className="target-summary-icon">📱</div>
                    <div className="target-summary-label">기기</div>
                    <div className="target-summary-value" style={{ color: '#1565c0' }}>{topTargets.topDevice.device}</div>
                    <div className="target-summary-metric">ROAS {formatPercent(topTargets.topDevice.roas)}</div>
                  </div>
                )}
                {topTargets.topAgeGender && (
                  <div className="target-summary-card" style={{ background: 'linear-gradient(135deg, #f3e5f5 0%, #fce4ec 100%)' }}>
                    <div className="target-summary-icon">🎯</div>
                    <div className="target-summary-label">최고 조합</div>
                    <div className="target-summary-value" style={{ color: '#7b1fa2', fontSize: 14 }}>{topTargets.topAgeGender.age}</div>
                    <div className="target-summary-metric">{normalizeGender(topTargets.topAgeGender.gender)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* 성별 비교 - 4분면 매트릭스 카드 스타일 */}
            {decisionToolData.genderData.length > 0 && (
              <div style={{ marginBottom: 12, padding: 14, background: 'white', borderRadius: 10, border: '1px solid var(--grey-200)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--grey-900)', marginBottom: 12 }}>
                  👥 성별 비교
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                  {[...decisionToolData.genderData].sort((a, b) => (b.roas || 0) - (a.roas || 0)).map((g, idx) => {
                    const genderName = normalizeGender(g.gender)
                    const cpa = g.conversions > 0 ? g.cost / g.conversions : 0

                    // 4분면 인사이트 매칭
                    const matrixInsight = getMatrixInsightForTarget(decisionToolData.genderMatrixInsights, genderName || '')
                    const matrixType = matrixInsight?.sub_type
                    const matrixAction = matrixInsight?.action

                    // 색상 결정 (4분면 기반)
                    let bgColor = '#f5f5f5', borderColor = '#e0e0e0', textColor = '#616161', badgeColor = '#9e9e9e', badgeText = '', icon = '👤'
                    if (matrixType === 'core_driver') {
                      bgColor = '#e8f5e9'; borderColor = '#4caf50'; textColor = '#2e7d32'; badgeColor = '#4caf50'; badgeText = 'SCALE-UP'; icon = '👑'
                    } else if (matrixType === 'efficiency_star') {
                      bgColor = '#e3f2fd'; borderColor = '#2196f3'; textColor = '#1565c0'; badgeColor = '#2196f3'; badgeText = 'GROW'; icon = '💎'
                    } else if (matrixType === 'budget_bleeder') {
                      bgColor = '#ffebee'; borderColor = '#f44336'; textColor = '#c62828'; badgeColor = '#f44336'; badgeText = 'OPTIMIZE'; icon = '💸'
                    } else if (matrixType === 'underperformer') {
                      bgColor = '#fff3e0'; borderColor = '#ff9800'; textColor = '#e65100'; badgeColor = '#ff9800'; badgeText = 'REVIEW'; icon = '💤'
                    }

                    return (
                      <div key={idx} style={{ background: bgColor, border: `2px solid ${borderColor}`, borderRadius: 10, padding: 14, transition: 'transform 0.2s' }}>
                        {/* 헤더 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 18 }}>{icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: textColor }}>{genderName}</div>
                            <div style={{ fontSize: 10, color: textColor, opacity: 0.8 }}>성별 타겟</div>
                          </div>
                          {badgeText && (
                            <span style={{ background: badgeColor, color: 'white', fontSize: 9, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{badgeText}</span>
                          )}
                        </div>
                        {/* 메트릭스 배지 */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                          <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#1565c0', border: '1px solid #90caf9', fontWeight: 500 }}>ROAS {formatPercent(g.roas)}</span>
                          <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#5e35b1', border: '1px solid #b39ddb', fontWeight: 500 }}>CPA {formatCurrency(cpa)}</span>
                        </div>
                        {/* 추천 액션 */}
                        {matrixAction && (
                          <div style={{ background: '#ffffff', borderRadius: 6, padding: 10, borderLeft: `3px solid ${borderColor}` }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: textColor, marginBottom: 4 }}>💡 추천 액션</div>
                            <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>{matrixAction}</div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 효율-규모 매트릭스 (4분면) */}
            {(matrixQuadrants.core_driver.length > 0 || matrixQuadrants.efficiency_star.length > 0 || matrixQuadrants.budget_bleeder.length > 0 || matrixQuadrants.underperformer.length > 0) && (
              <div style={{ marginBottom: 16, padding: 16, background: 'white', borderRadius: 12, border: '1px solid var(--grey-200)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--grey-900)', marginBottom: 12 }}>
                  📊 효율-규모 매트릭스 (4분면)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {/* 핵심 동력 (Core Driver) */}
                  <div style={{ background: '#e8f5e9', border: '2px solid #4caf50', borderRadius: 10, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>👑</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#2e7d32' }}>핵심 동력</div>
                        <div style={{ fontSize: 10, color: '#2e7d32', opacity: 0.8 }}>고지출 + 고효율</div>
                      </div>
                      <span style={{ background: '#4caf50', color: 'white', fontSize: 9, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>SCALE-UP</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      {matrixQuadrants.core_driver.length > 0 ? matrixQuadrants.core_driver.map((i, idx) => (
                        <span key={idx} style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#2e7d32', border: '1px solid #81c784', fontWeight: 500 }}>{i.target}</span>
                      )) : <span style={{ fontSize: 11, color: 'var(--grey-500)' }}>-</span>}
                    </div>
                    {matrixQuadrants.core_driver.length > 0 && matrixQuadrants.core_driver[0].action && (
                      <div style={{ background: '#ffffff', borderRadius: 6, padding: 10, borderLeft: '3px solid #4caf50' }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#2e7d32', marginBottom: 4 }}>💡 추천 액션</div>
                        <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>{matrixQuadrants.core_driver[0].action}</div>
                      </div>
                    )}
                  </div>
                  {/* 효율 스타 (Efficiency Star) */}
                  <div style={{ background: '#e3f2fd', border: '2px solid #2196f3', borderRadius: 10, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>💎</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1565c0' }}>효율 스타</div>
                        <div style={{ fontSize: 10, color: '#1565c0', opacity: 0.8 }}>저지출 + 고효율</div>
                      </div>
                      <span style={{ background: '#2196f3', color: 'white', fontSize: 9, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>GROW</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      {matrixQuadrants.efficiency_star.length > 0 ? matrixQuadrants.efficiency_star.map((i, idx) => (
                        <span key={idx} style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#1565c0', border: '1px solid #90caf9', fontWeight: 500 }}>{i.target}</span>
                      )) : <span style={{ fontSize: 11, color: 'var(--grey-500)' }}>-</span>}
                    </div>
                    {matrixQuadrants.efficiency_star.length > 0 && matrixQuadrants.efficiency_star[0].action && (
                      <div style={{ background: '#ffffff', borderRadius: 6, padding: 10, borderLeft: '3px solid #2196f3' }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#1565c0', marginBottom: 4 }}>💡 추천 액션</div>
                        <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>{matrixQuadrants.efficiency_star[0].action}</div>
                      </div>
                    )}
                  </div>
                  {/* 예산 누수 (Budget Bleeder) */}
                  <div style={{ background: '#ffebee', border: '2px solid #f44336', borderRadius: 10, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>💸</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#c62828' }}>예산 누수</div>
                        <div style={{ fontSize: 10, color: '#c62828', opacity: 0.8 }}>고지출 + 저효율</div>
                      </div>
                      <span style={{ background: '#f44336', color: 'white', fontSize: 9, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>OPTIMIZE</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      {matrixQuadrants.budget_bleeder.length > 0 ? matrixQuadrants.budget_bleeder.map((i, idx) => (
                        <span key={idx} style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#c62828', border: '1px solid #ef9a9a', fontWeight: 500 }}>{i.target}</span>
                      )) : <span style={{ fontSize: 11, color: 'var(--grey-500)' }}>-</span>}
                    </div>
                    {matrixQuadrants.budget_bleeder.length > 0 && matrixQuadrants.budget_bleeder[0].action && (
                      <div style={{ background: '#ffffff', borderRadius: 6, padding: 10, borderLeft: '3px solid #f44336' }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#c62828', marginBottom: 4 }}>🚨 추천 액션</div>
                        <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>{matrixQuadrants.budget_bleeder[0].action}</div>
                      </div>
                    )}
                  </div>
                  {/* 성과 부진 (Underperformer) */}
                  <div style={{ background: '#fff3e0', border: '2px solid #ff9800', borderRadius: 10, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>💤</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#e65100' }}>성과 부진</div>
                        <div style={{ fontSize: 10, color: '#e65100', opacity: 0.8 }}>저지출 + 저효율</div>
                      </div>
                      <span style={{ background: '#ff9800', color: 'white', fontSize: 9, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>REVIEW</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      {matrixQuadrants.underperformer.length > 0 ? matrixQuadrants.underperformer.map((i, idx) => (
                        <span key={idx} style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#e65100', border: '1px solid #ffcc80', fontWeight: 500 }}>{i.target}</span>
                      )) : <span style={{ fontSize: 11, color: 'var(--grey-500)' }}>-</span>}
                    </div>
                    {matrixQuadrants.underperformer.length > 0 && matrixQuadrants.underperformer[0].action && (
                      <div style={{ background: '#ffffff', borderRadius: 6, padding: 10, borderLeft: '3px solid #ff9800' }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#e65100', marginBottom: 4 }}>⚠️ 추천 액션</div>
                        <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>{matrixQuadrants.underperformer[0].action}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 기기플랫폼별 성과 - 접히는 섹션 */}
            {decisionToolData.devicePlatformData.length > 0 && (() => {
              const maxDevicePlatformRoas = Math.max(...decisionToolData.devicePlatformData.map(d => d.roas || 0))
              const sortedDevicePlatforms = [...decisionToolData.devicePlatformData].sort((a, b) => (b.roas || 0) - (a.roas || 0))
              return (
                <div style={{ border: '1px solid var(--grey-200)', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
                  <div
                    style={{ padding: '10px 14px', background: '#fafafa', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onClick={() => setExpandedDevicePlatform(!expandedDevicePlatform)}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--grey-800)' }}>📱 기기플랫폼별 성과</span>
                    <span style={{ fontSize: 10, color: 'var(--grey-500)' }}>{expandedDevicePlatform ? '▼' : '▶'}</span>
                  </div>
                  {expandedDevicePlatform && (
                    <div style={{ padding: 12 }}>
                      <div style={{ fontSize: 10, color: 'var(--grey-600)', marginBottom: 10, padding: 8, background: '#e3f2fd', borderRadius: 6 }}>
                        💡 웹, 앱, 모바일에서의 광고 반응 차이를 파악하세요
                      </div>
                      {sortedDevicePlatforms.slice(0, 5).map((d, idx) => {
                        const roas = d.roas || 0
                        let roasColor = '#c62828'
                        if (roas >= 500) roasColor = '#2e7d32'
                        else if (roas >= 300) roasColor = '#558b2f'
                        else if (roas >= 200) roasColor = '#f57f17'
                        else if (roas >= 100) roasColor = '#e65100'
                        const barWidth = Math.min((roas / maxDevicePlatformRoas) * 100, 100)
                        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`
                        return (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', marginBottom: 6, background: '#fafafa', borderRadius: 8, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${barWidth}%`, background: `linear-gradient(90deg, ${roasColor}22, ${roasColor}11)`, borderRadius: 8 }}></div>
                            <div style={{ position: 'relative', zIndex: 1, fontSize: 12, fontWeight: 600, color: 'var(--grey-800)' }}>{medal} {d.deviceplatform}</div>
                            <div style={{ position: 'relative', zIndex: 1, fontSize: 13, fontWeight: 700, color: roasColor }}>{formatPercent(d.roas)}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* 기기별 성과 - 접히는 섹션 */}
            {decisionToolData.deviceData.length > 0 && (() => {
              const maxDeviceRoas = Math.max(...decisionToolData.deviceData.map(d => d.roas || 0))
              const sortedDevices = [...decisionToolData.deviceData].sort((a, b) => (b.roas || 0) - (a.roas || 0))
              return (
                <div style={{ border: '1px solid var(--grey-200)', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
                  <div
                    style={{ padding: '10px 14px', background: '#fafafa', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onClick={() => setExpandedDevice(!expandedDevice)}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--grey-800)' }}>💻 기기별 성과</span>
                    <span style={{ fontSize: 10, color: 'var(--grey-500)' }}>{expandedDevice ? '▼' : '▶'}</span>
                  </div>
                  {expandedDevice && (
                    <div style={{ padding: 12 }}>
                      {sortedDevices.slice(0, 5).map((d, idx) => {
                        const roas = d.roas || 0
                        let roasColor = '#c62828'
                        if (roas >= 500) roasColor = '#2e7d32'
                        else if (roas >= 300) roasColor = '#558b2f'
                        else if (roas >= 200) roasColor = '#f57f17'
                        else if (roas >= 100) roasColor = '#e65100'
                        const barWidth = Math.min((roas / maxDeviceRoas) * 100, 100)
                        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`
                        return (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', marginBottom: 6, background: '#fafafa', borderRadius: 8, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${barWidth}%`, background: `linear-gradient(90deg, ${roasColor}22, ${roasColor}11)`, borderRadius: 8 }}></div>
                            <div style={{ position: 'relative', zIndex: 1, fontSize: 12, fontWeight: 600, color: 'var(--grey-800)' }}>{medal} {d.device}</div>
                            <div style={{ position: 'relative', zIndex: 1, fontSize: 13, fontWeight: 700, color: roasColor }}>{formatPercent(d.roas)}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* 연령+성별 조합 TOP 5 - 접히는 섹션 */}
            {decisionToolData.ageGenderData.length > 0 && (() => {
              const maxAgeGenderRoas = Math.max(...decisionToolData.ageGenderData.slice(0, 5).map(item => item.roas || 0))
              return (
                <div style={{ border: '1px solid var(--grey-200)', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
                  <div
                    style={{ padding: '10px 14px', background: '#fafafa', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onClick={() => setExpandedAgeGender(!expandedAgeGender)}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--grey-800)' }}>🎯 연령+성별 조합 TOP 5</span>
                    <span style={{ fontSize: 10, color: 'var(--grey-500)' }}>{expandedAgeGender ? '▼' : '▶'}</span>
                  </div>
                  {expandedAgeGender && (
                    <div style={{ padding: 12 }}>
                      <div style={{ fontSize: 10, color: 'var(--grey-600)', marginBottom: 10, padding: 8, background: '#f5f5f5', borderRadius: 6 }}>
                        💡 이 조합의 타겟에게 광고를 집중하면 더 좋은 성과를 얻을 수 있어요
                      </div>
                      {decisionToolData.ageGenderData.slice(0, 5).map((item, idx) => {
                        const roas = item.roas || 0
                        let roasColor = '#c62828'
                        if (roas >= 500) roasColor = '#2e7d32'
                        else if (roas >= 300) roasColor = '#558b2f'
                        else if (roas >= 200) roasColor = '#f57f17'
                        else if (roas >= 100) roasColor = '#e65100'
                        const barWidth = Math.min((roas / maxAgeGenderRoas) * 100, 100)
                        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`
                        return (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', marginBottom: 6, background: '#fafafa', borderRadius: 8, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${barWidth}%`, background: `linear-gradient(90deg, ${roasColor}22, ${roasColor}11)`, borderRadius: 8 }}></div>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                              <span style={{ fontSize: 14 }}>{medal}</span>
                              <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 8, color: 'var(--grey-800)' }}>{item.age} {normalizeGender(item.gender)}</span>
                            </div>
                            <div style={{ position: 'relative', zIndex: 1, fontSize: 14, fontWeight: 800, color: roasColor }}>{formatPercent(item.roas)}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* 이렇게 활용하세요 */}
            <div style={{ marginTop: 16, padding: '12px 14px', background: 'linear-gradient(135deg, #e8eaf6 0%, #f5f5ff 100%)', borderRadius: 10, borderLeft: '3px solid #5c6bc0' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#3949ab', marginBottom: 6 }}>💡 이렇게 활용하세요</div>
              <div style={{ fontSize: 11, color: 'var(--grey-800)', lineHeight: 1.7 }}>
                1. 🏆 표시된 타겟에게 <strong>광고 예산을 더 배정</strong>하세요<br />
                2. 효율 낮은 타겟은 광고 <strong>노출을 줄이거나 제외</strong>하세요<br />
                3. 연령+성별 조합으로 <strong>맞춤 광고 소재</strong>를 만들어보세요
              </div>
            </div>
          </div>

          {/* 탭 컨텐츠 - AI 예측 */}
          <div className={`tab-content ${activeTab === 'forecast' ? 'active' : ''}`}>
            {/* forecast 데이터 유무에 따른 분기 */}
            {decisionToolData.forecast && (decisionToolData.forecast.by_device || decisionToolData.forecast.by_gender || decisionToolData.forecast.by_product) ? (
              <>
                {/* 인트로 메시지 - forecast 있을 때 */}
                <div style={{ marginBottom: 16, padding: '14px 18px', background: 'linear-gradient(135deg, #e8eaf6 0%, #f3e5f5 100%)', borderRadius: 12, borderLeft: '4px solid #7c4dff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🔮</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#5e35b1' }}>AI 분석 인사이트</span>
                    <span style={{ fontSize: 10, color: '#7c4dff', background: 'rgba(124, 77, 255, 0.1)', padding: '2px 8px', borderRadius: 10, marginLeft: 'auto' }}>향후 30일 예측</span>
                  </div>
                </div>

                {/* 예측 KPI 요약 */}
                {decisionToolData.forecast.summary?.overall && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
                    <div style={{ padding: 14, background: (decisionToolData.forecast.summary.overall.avg_forecast_roas || 0) >= 100 ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)', borderRadius: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: (decisionToolData.forecast.summary.overall.avg_forecast_roas || 0) >= 100 ? '#2e7d32' : '#c62828', fontWeight: 600, marginBottom: 2 }}>
                        {(decisionToolData.forecast.summary.overall.avg_forecast_roas || 0) >= 100 ? '📈' : '📉'} 예측 ROAS
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: (decisionToolData.forecast.summary.overall.avg_forecast_roas || 0) >= 100 ? '#1b5e20' : '#b71c1c' }}>{(decisionToolData.forecast.summary.overall.avg_forecast_roas || 0).toFixed(0)}%</div>
                    </div>
                    <div style={{ padding: 14, background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', borderRadius: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#1565c0', fontWeight: 600, marginBottom: 2 }}>💰 예측 CPA</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0d47a1' }}>{formatCurrency(decisionToolData.forecast.summary.overall.avg_forecast_cpa || 0)}</div>
                    </div>
                    <div style={{ padding: 14, background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', borderRadius: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#e65100', fontWeight: 600, marginBottom: 2 }}>🎯 예측 전환</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#bf360c' }}>{(decisionToolData.forecast.summary.overall.total_forecast_conversions || 0).toFixed(0)}</div>
                    </div>
                  </div>
                )}

                {/* 최적 타겟 (forecast 기반) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                  {/* 최적 기기 */}
                  {decisionToolData.forecast.by_device && decisionToolData.forecast.by_device.length > 0 && (() => {
                    const validDevices = decisionToolData.forecast.by_device.filter(d => d.device !== 'Uncategorized' && d.device !== 'unknown')
                    if (validDevices.length === 0) return null
                    const sorted = [...validDevices].sort((a, b) => (b.avg_forecast_roas || 0) - (a.avg_forecast_roas || 0))
                    const top = sorted[0]
                    return (
                      <div style={{ padding: 12, background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', borderRadius: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: '#1565c0', fontWeight: 600, marginBottom: 2 }}>📱 최적 기기</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0d47a1' }}>{top.device}</div>
                        <div style={{ fontSize: 10, color: '#1565c0' }}>ROAS {(top.avg_forecast_roas || 0).toFixed(0)}%</div>
                      </div>
                    )
                  })()}
                  {/* 최적 성별 */}
                  {decisionToolData.forecast.by_gender && decisionToolData.forecast.by_gender.length > 0 && (() => {
                    const validGenders = decisionToolData.forecast.by_gender.filter(g => g.gender && g.gender.toLowerCase() !== 'unknown' && g.gender.toLowerCase() !== 'uncategorized')
                    if (validGenders.length === 0) return null
                    const sorted = [...validGenders].sort((a, b) => (b.avg_forecast_roas || 0) - (a.avg_forecast_roas || 0))
                    const top = sorted[0]
                    return (
                      <div style={{ padding: 12, background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%)', borderRadius: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: '#c2185b', fontWeight: 600, marginBottom: 2 }}>👫 최적 성별</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#880e4f' }}>{normalizeGender(top.gender)}</div>
                        <div style={{ fontSize: 10, color: '#c2185b' }}>ROAS {(top.avg_forecast_roas || 0).toFixed(0)}%</div>
                      </div>
                    )
                  })()}
                  {/* 최적 연령 */}
                  {decisionToolData.forecast.by_age && decisionToolData.forecast.by_age.length > 0 && (() => {
                    const validAges = decisionToolData.forecast.by_age.filter(a => a.age && a.age !== 'Unknown' && (a.avg_forecast_roas || 0) > 0)
                    if (validAges.length === 0) return null
                    const sorted = [...validAges].sort((a, b) => (b.avg_forecast_roas || 0) - (a.avg_forecast_roas || 0))
                    const top = sorted[0]
                    return (
                      <div style={{ padding: 12, background: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)', borderRadius: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: '#3949ab', fontWeight: 600, marginBottom: 2 }}>👤 최적 연령</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#1a237e' }}>{top.age}</div>
                        <div style={{ fontSize: 10, color: '#3949ab' }}>ROAS {(top.avg_forecast_roas || 0).toFixed(0)}%</div>
                      </div>
                    )
                  })()}
                </div>

                {/* 서브탭 (상품별, 성별&연령, 기기플랫폼, 채널) */}
                <div style={{ marginBottom: 16, background: 'white', border: '1px solid var(--grey-200)', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--grey-200)', background: '#f8f9fa' }}>
                    {[
                      { key: 'product', label: '🛍️ 상품별' },
                      { key: 'gender-age', label: '👫 성별&연령' },
                      { key: 'deviceplatform', label: '📱 기기플랫폼' },
                      { key: 'category', label: '📊 채널' }
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setForecastSubtab(tab.key)}
                        style={{
                          flex: 1,
                          padding: '10px 8px',
                          fontSize: 11,
                          fontWeight: 600,
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          color: forecastSubtab === tab.key ? '#5e35b1' : 'var(--grey-600)',
                          borderBottom: forecastSubtab === tab.key ? '2px solid #5e35b1' : '2px solid transparent'
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ padding: 12 }}>
                    {/* 상품별 */}
                    {forecastSubtab === 'product' && decisionToolData.forecast.by_product && decisionToolData.forecast.by_product.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {/* ROAS TOP */}
                        <div style={{ padding: 10, background: '#e8f5e9', borderRadius: 8 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: '#2e7d32', marginBottom: 6 }}>🏆 ROAS TOP</div>
                          {[...decisionToolData.forecast.by_product].sort((a, b) => (b.avg_forecast_roas || 0) - (a.avg_forecast_roas || 0)).slice(0, 4).map((prod, idx) => {
                            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''
                            return (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 10, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                <span>{medal} {prod.product}</span>
                                <span style={{ fontWeight: 700, color: '#1b5e20' }}>{(prod.avg_forecast_roas || 0).toFixed(0)}%</span>
                              </div>
                            )
                          })}
                        </div>
                        {/* CPA 개선 필요 */}
                        <div style={{ padding: 10, background: '#fff3e0', borderRadius: 8 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: '#e65100', marginBottom: 6 }}>📉 CPA 개선 필요</div>
                          {[...decisionToolData.forecast.by_product].sort((a, b) => (b.avg_forecast_cpa || 0) - (a.avg_forecast_cpa || 0)).slice(0, 4).map((prod, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 10, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                              <span>{prod.product}</span>
                              <span style={{ fontWeight: 700, color: '#bf360c' }}>{formatCurrency(prod.avg_forecast_cpa || 0)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* 성별&연령 */}
                    {forecastSubtab === 'gender-age' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {/* 성별 예측 */}
                        {decisionToolData.forecast.by_gender && decisionToolData.forecast.by_gender.length > 0 && (
                          <div style={{ padding: 10, background: '#fce4ec', borderRadius: 8 }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#c2185b', marginBottom: 6 }}>👫 성별 예측</div>
                            {decisionToolData.forecast.by_gender.filter(g => g.gender && g.gender.toLowerCase() !== 'unknown').map((g, idx) => {
                              const roas = g.avg_forecast_roas || 0
                              return (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 10, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                  <span>{normalizeGender(g.gender)}</span>
                                  <span style={{ fontWeight: 700, color: roas >= 100 ? '#2e7d32' : '#c62828' }}>{roas.toFixed(0)}%</span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {/* 연령 예측 TOP 5 */}
                        {decisionToolData.forecast.by_age && decisionToolData.forecast.by_age.length > 0 && (
                          <div style={{ padding: 10, background: '#e8eaf6', borderRadius: 8 }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#3949ab', marginBottom: 6 }}>👤 연령 예측 TOP 5</div>
                            {[...decisionToolData.forecast.by_age].filter(a => a.age && a.age !== 'Unknown').sort((a, b) => (b.avg_forecast_roas || 0) - (a.avg_forecast_roas || 0)).slice(0, 5).map((a, idx) => {
                              const roas = a.avg_forecast_roas || 0
                              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''
                              return (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 10, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                  <span>{medal} {a.age}</span>
                                  <span style={{ fontWeight: 700, color: roas >= 100 ? '#2e7d32' : '#c62828' }}>{roas.toFixed(0)}%</span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    {/* 기기플랫폼 */}
                    {forecastSubtab === 'deviceplatform' && decisionToolData.forecast.by_deviceplatform && decisionToolData.forecast.by_deviceplatform.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
                        {[...decisionToolData.forecast.by_deviceplatform].sort((a, b) => (b.avg_forecast_roas || 0) - (a.avg_forecast_roas || 0)).map((dev, idx) => {
                          const roas = dev.avg_forecast_roas || 0
                          const isTop = idx === 0
                          const platformName = dev.deviceplatform || ''
                          return (
                            <div key={idx} style={{
                              padding: 10,
                              background: isTop ? 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' : '#f5f5f5',
                              borderRadius: 8,
                              textAlign: 'center',
                              border: isTop ? '2px solid #1976d2' : 'none'
                            }}>
                              <div style={{ fontSize: 9, color: 'var(--grey-600)', marginBottom: 2 }}>{platformName}</div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: roas >= 100 ? '#1565c0' : '#c62828' }}>{roas.toFixed(0)}%</div>
                              {isTop && <div style={{ fontSize: 8, color: '#1976d2', marginTop: 2 }}>🏆 1위</div>}
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {/* 채널 */}
                    {forecastSubtab === 'category' && decisionToolData.forecast.by_category && decisionToolData.forecast.by_category.length > 0 && (() => {
                      const sorted = [...decisionToolData.forecast.by_category].sort((a, b) => (b.avg_forecast_roas || 0) - (a.avg_forecast_roas || 0))
                      const good = sorted.filter(c => (c.avg_forecast_roas || 0) >= 100)
                      const poor = sorted.filter(c => (c.avg_forecast_roas || 0) < 100)
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {/* 효율 양호 */}
                          <div style={{ padding: 10, background: '#e8f5e9', borderRadius: 8 }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#2e7d32', marginBottom: 6 }}>✅ 효율 양호</div>
                            {good.length > 0 ? good.map((cat, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 10, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{cat.category}</span>
                                <span style={{ fontWeight: 700, color: '#1b5e20' }}>{(cat.avg_forecast_roas || 0).toFixed(0)}%</span>
                              </div>
                            )) : <div style={{ fontSize: 10, color: 'var(--grey-500)' }}>데이터 없음</div>}
                          </div>
                          {/* 개선 필요 */}
                          <div style={{ padding: 10, background: '#ffebee', borderRadius: 8 }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#c62828', marginBottom: 6 }}>⚠️ 개선 필요</div>
                            {poor.length > 0 ? poor.map((cat, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 10, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{cat.category}</span>
                                <span style={{ fontWeight: 700, color: '#b71c1c' }}>{(cat.avg_forecast_roas || 0).toFixed(0)}%</span>
                              </div>
                            )) : <div style={{ fontSize: 10, color: 'var(--grey-500)' }}>데이터 없음</div>}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* AI가 발견한 기회 - 아코디언 (forecast 기반) */}
                {(() => {
                  const opportunities: Array<{ icon: string; title: string; description: string; metric: string | null }> = []
                  const forecast = decisionToolData.forecast
                  if (forecast) {
                    // 1. 기기플랫폼 고효율 예측
                    if (forecast.by_deviceplatform && forecast.by_deviceplatform.length > 0) {
                      const valid = forecast.by_deviceplatform.filter(p => p.deviceplatform !== 'Uncategorized')
                      if (valid.length > 0) {
                        const sorted = [...valid].sort((a, b) => (b.avg_forecast_roas || 0) - (a.avg_forecast_roas || 0))
                        const top = sorted[0]
                        if (top && (top.avg_forecast_roas || 0) >= 100) {
                          opportunities.push({
                            icon: '📱',
                            title: `${top.deviceplatform} 기기플랫폼 고효율 예측`,
                            description: `${top.deviceplatform}에서 향후 30일 예측 ROAS ${(top.avg_forecast_roas || 0).toFixed(0)}%로 높은 효율이 예상됩니다. 해당 기기플랫폼의 예산을 확대하면 성과 개선이 기대됩니다.`,
                            metric: `예측 ROAS ${(top.avg_forecast_roas || 0).toFixed(0)}%`
                          })
                        }
                      }
                    }
                    // 2. 채널 확대 기회
                    if (forecast.by_category && forecast.by_category.length > 0) {
                      const sorted = [...forecast.by_category].sort((a, b) => (b.avg_forecast_roas || 0) - (a.avg_forecast_roas || 0))
                      const top = sorted[0]
                      if (top && (top.avg_forecast_roas || 0) >= 100) {
                        opportunities.push({
                          icon: '📊',
                          title: `${top.category} 채널 확대 기회`,
                          description: `${top.category} 채널의 향후 30일 예측 ROAS가 ${(top.avg_forecast_roas || 0).toFixed(0)}%로 매우 높습니다. 이 채널에 예산을 집중하면 높은 수익을 기대할 수 있습니다.`,
                          metric: `예측 ROAS ${(top.avg_forecast_roas || 0).toFixed(0)}%`
                        })
                      }
                    }
                    // 3. 성별 타겟 확대 기회
                    if (forecast.by_gender && forecast.by_gender.length > 0) {
                      const valid = forecast.by_gender.filter(g => g.gender && g.gender.toLowerCase() !== 'unknown')
                      if (valid.length > 0) {
                        const sorted = [...valid].sort((a, b) => (b.avg_forecast_roas || 0) - (a.avg_forecast_roas || 0))
                        const top = sorted[0]
                        if (top && (top.avg_forecast_roas || 0) >= 100) {
                          opportunities.push({
                            icon: '👫',
                            title: `${normalizeGender(top.gender)} 타겟 확대 기회`,
                            description: `${normalizeGender(top.gender)} 타겟에서 향후 30일 예측 ROAS ${(top.avg_forecast_roas || 0).toFixed(0)}%로 우수한 성과가 예상됩니다. 성별 맞춤 메시지 전략을 강화하세요.`,
                            metric: `예측 ROAS ${(top.avg_forecast_roas || 0).toFixed(0)}%`
                          })
                        }
                      }
                    }
                    // 4. 상품 확대 기회
                    if (forecast.by_product && forecast.by_product.length > 0) {
                      const sorted = [...forecast.by_product].sort((a, b) => (b.avg_forecast_roas || 0) - (a.avg_forecast_roas || 0))
                      const top = sorted[0]
                      if (top && (top.avg_forecast_roas || 0) >= 100) {
                        opportunities.push({
                          icon: '🛍️',
                          title: `${top.product} 상품 확대 기회`,
                          description: `${top.product} 상품의 향후 30일 예측 ROAS가 ${(top.avg_forecast_roas || 0).toFixed(0)}%로 가장 높습니다. 해당 상품 중심의 프로모션 및 광고 예산 집중을 권장합니다.`,
                          metric: `예측 ROAS ${(top.avg_forecast_roas || 0).toFixed(0)}%`
                        })
                      }
                    }
                    // 5. 전체 캠페인 성장 기회
                    if (forecast.summary && forecast.summary.overall) {
                      const overallRoas = forecast.summary.overall.avg_forecast_roas || 0
                      if (overallRoas >= 100) {
                        opportunities.push({
                          icon: '📈',
                          title: '전체 캠페인 성장 기회',
                          description: `향후 30일 예측 ROAS가 ${overallRoas.toFixed(0)}%로 양호합니다. 현재 전략을 유지하면서 고효율 채널에 추가 투자를 검토하세요.`,
                          metric: `예측 ROAS ${overallRoas.toFixed(0)}%`
                        })
                      }
                    }
                  }
                  // 최소 5개 보장 - 기본값 추가
                  const defaults = [
                    { icon: '🎯', title: '타겟 최적화 기회', description: '예측 데이터를 기반으로 타겟팅 전략을 개선하면 더 높은 성과를 기대할 수 있습니다.', metric: null },
                    { icon: '💰', title: '예산 재배분 기회', description: '고효율 채널로 예산을 재배분하여 전체 ROAS를 개선할 수 있는 기회가 있습니다.', metric: null },
                    { icon: '🔄', title: '크리에이티브 갱신 기회', description: '새로운 크리에이티브 테스트를 통해 광고 피로도를 낮추고 성과를 개선할 수 있습니다.', metric: null },
                    { icon: '📊', title: '데이터 기반 최적화 기회', description: 'A/B 테스트를 통해 더 효과적인 광고 소재와 타겟을 발굴할 기회가 있습니다.', metric: null },
                    { icon: '⚡', title: '시즌 대응 기회', description: '시즌별 트렌드에 맞춰 상품과 메시지를 최적화하면 추가 성과를 기대할 수 있습니다.', metric: null }
                  ]
                  let defaultIdx = 0
                  while (opportunities.length < 5 && defaultIdx < defaults.length) {
                    opportunities.push(defaults[defaultIdx])
                    defaultIdx++
                  }
                  return (
                    <div style={{ marginBottom: 10, borderRadius: 10, overflow: 'hidden' }}>
                      <div
                        style={{ background: '#e8f5e9', padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => setExpandedAiOpportunity(!expandedAiOpportunity)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>🚀</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#2e7d32' }}>AI가 발견한 기회 ({opportunities.slice(0, 5).length}건)</span>
                        </div>
                        <span style={{ fontSize: 12, color: '#2e7d32', transition: 'transform 0.3s' }}>{expandedAiOpportunity ? '▼' : '▶'}</span>
                      </div>
                      {expandedAiOpportunity && (
                        <div style={{ background: '#f1f8e9', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {opportunities.slice(0, 5).map((item, idx) => (
                            <div key={idx} style={{ background: '#e8f5e9', border: '2px solid #4caf50', borderRadius: 10, padding: 14 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <span style={{ fontSize: 18 }}>{item.icon}</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: '#2e7d32' }}>{item.title}</div>
                                  <div style={{ fontSize: 10, color: '#2e7d32', opacity: 0.8 }}>성장 기회</div>
                                </div>
                                <span style={{ background: '#4caf50', color: 'white', fontSize: 9, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>GROW</span>
                              </div>
                              {item.metric && (
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                                  <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#2e7d32', border: '1px solid #81c784', fontWeight: 500 }}>{item.metric}</span>
                                </div>
                              )}
                              <div style={{ background: '#ffffff', borderRadius: 6, padding: 10, borderLeft: '3px solid #4caf50' }}>
                                <div style={{ fontSize: 10, fontWeight: 600, color: '#2e7d32', marginBottom: 4 }}>💡 인사이트</div>
                                <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>{item.description}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* AI 추천 액션 - 아코디언 (forecast 기반) */}
                {(() => {
                  const actions: Array<{ icon: string; title: string; description: string; priority: string; expectedEffect: string }> = []
                  const forecast = decisionToolData.forecast
                  if (forecast) {
                    // 1. 저효율 상품 광고 개선
                    if (forecast.by_product && forecast.by_product.length > 0) {
                      const sorted = [...forecast.by_product].sort((a, b) => (a.avg_forecast_roas || 0) - (b.avg_forecast_roas || 0))
                      const worst = sorted[0]
                      if (worst && (worst.avg_forecast_roas || 0) < 100) {
                        actions.push({
                          icon: '🔧',
                          title: `${worst.product} 상품 광고 개선`,
                          description: `${worst.product}의 향후 30일 예측 ROAS가 ${(worst.avg_forecast_roas || 0).toFixed(0)}%로 낮습니다. 타겟 재설정, 크리에이티브 교체, 또는 예산 축소를 검토하세요.`,
                          priority: 'high',
                          expectedEffect: 'CPA 15~20% 개선'
                        })
                      }
                    }
                    // 2. 고효율 기기플랫폼 예산 확대
                    if (forecast.by_deviceplatform && forecast.by_deviceplatform.length > 0) {
                      const valid = forecast.by_deviceplatform.filter(p => p.deviceplatform !== 'Uncategorized')
                      if (valid.length > 0) {
                        const sorted = [...valid].sort((a, b) => (b.avg_forecast_roas || 0) - (a.avg_forecast_roas || 0))
                        const top = sorted[0]
                        if (top && (top.avg_forecast_roas || 0) >= 150) {
                          actions.push({
                            icon: '💵',
                            title: `${top.deviceplatform} 예산 20% 증액`,
                            description: `${top.deviceplatform}의 향후 30일 예측 ROAS가 ${(top.avg_forecast_roas || 0).toFixed(0)}%로 매우 높습니다. 해당 기기플랫폼 예산을 20% 증액하여 성과를 극대화하세요.`,
                            priority: 'high',
                            expectedEffect: '매출 증가 기대'
                          })
                        }
                      }
                    }
                    // 3. 채널 캠페인 강화
                    if (forecast.by_category && forecast.by_category.length > 0) {
                      const sorted = [...forecast.by_category].sort((a, b) => (b.avg_forecast_roas || 0) - (a.avg_forecast_roas || 0))
                      const top = sorted[0]
                      if (top) {
                        actions.push({
                          icon: '🎯',
                          title: `${top.category} 채널 캠페인 강화`,
                          description: `${top.category} 채널의 향후 30일 예측 성과가 가장 우수합니다(ROAS ${(top.avg_forecast_roas || 0).toFixed(0)}%). 해당 채널 전용 캠페인을 신설하거나 기존 캠페인의 예산 비중을 높이세요.`,
                          priority: 'medium',
                          expectedEffect: 'ROAS 10~15% 개선'
                        })
                      }
                    }
                    // 4. 저효율 기기플랫폼 예산 재검토
                    if (forecast.by_deviceplatform && forecast.by_deviceplatform.length > 1) {
                      const valid = forecast.by_deviceplatform.filter(p => p.deviceplatform !== 'Uncategorized')
                      if (valid.length > 0) {
                        const sorted = [...valid].sort((a, b) => (a.avg_forecast_roas || 0) - (b.avg_forecast_roas || 0))
                        const worst = sorted[0]
                        if (worst && (worst.avg_forecast_roas || 0) < 100) {
                          actions.push({
                            icon: '⚠️',
                            title: `${worst.deviceplatform} 예산 재검토`,
                            description: `${worst.deviceplatform}의 향후 30일 예측 ROAS가 ${(worst.avg_forecast_roas || 0).toFixed(0)}%로 손익분기점 미달입니다. 타겟 및 소재 최적화 후에도 개선되지 않으면 예산 축소를 고려하세요.`,
                            priority: 'medium',
                            expectedEffect: '비용 효율화'
                          })
                        }
                      }
                    }
                    // 5. CPA 기반 입찰 전략 최적화
                    if (forecast.summary && forecast.summary.overall) {
                      const avgCpa = forecast.summary.overall.avg_forecast_cpa || 0
                      actions.push({
                        icon: '📋',
                        title: 'CPA 기반 입찰 전략 최적화',
                        description: `향후 30일 예측 CPA가 ${formatCurrency(avgCpa)}입니다. 목표 CPA를 기준으로 자동 입찰 전략을 조정하고, 고CPA 광고세트는 수동 검토하세요.`,
                        priority: 'low',
                        expectedEffect: '전체 CPA 5~10% 개선'
                      })
                    }
                  }
                  // 최소 5개 보장 - 기본값 추가
                  const defaults = [
                    { icon: '🔄', title: '크리에이티브 A/B 테스트', description: '현재 운영 중인 광고 소재의 다양한 버전을 테스트하여 최적의 성과를 찾으세요.', priority: 'low', expectedEffect: 'CTR 향상' },
                    { icon: '📱', title: '랜딩페이지 최적화', description: '광고 클릭 후 전환율을 높이기 위해 랜딩페이지 로딩 속도와 UX를 점검하세요.', priority: 'low', expectedEffect: '전환율 향상' },
                    { icon: '🕐', title: '광고 노출 시간대 최적화', description: '성과가 좋은 시간대에 예산을 집중하여 효율을 극대화하세요.', priority: 'low', expectedEffect: 'ROAS 개선' },
                    { icon: '📊', title: '리타겟팅 캠페인 강화', description: '사이트 방문자 및 장바구니 이탈자 대상 리타겟팅을 강화하세요.', priority: 'low', expectedEffect: '전환 증가' },
                    { icon: '🎨', title: '시즌 맞춤 소재 제작', description: '현재 시즌 및 트렌드에 맞는 새로운 광고 소재를 제작하세요.', priority: 'low', expectedEffect: '광고 피로도 감소' }
                  ]
                  let defaultIdx = 0
                  while (actions.length < 5 && defaultIdx < defaults.length) {
                    actions.push(defaults[defaultIdx])
                    defaultIdx++
                  }
                  return (
                    <div style={{ marginBottom: 12, borderRadius: 10, overflow: 'hidden' }}>
                      <div
                        style={{ background: '#e3f2fd', padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => setExpandedAiAction(!expandedAiAction)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>💡</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#1565c0' }}>AI 추천 액션 ({actions.slice(0, 5).length}건)</span>
                        </div>
                        <span style={{ fontSize: 12, color: '#1565c0', transition: 'transform 0.3s' }}>{expandedAiAction ? '▼' : '▶'}</span>
                      </div>
                      {expandedAiAction && (
                        <div style={{ background: '#e8f4fd', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {actions.slice(0, 5).map((item, idx) => {
                            let bgColor = '#e3f2fd'
                            let borderColor = '#2196f3'
                            let textColor = '#1565c0'
                            let badgeText = 'ACTION'
                            if (item.priority === 'high') {
                              bgColor = '#ffebee'; borderColor = '#f44336'; textColor = '#c62828'; badgeText = '긴급'
                            } else if (item.priority === 'medium') {
                              bgColor = '#fff3e0'; borderColor = '#ff9800'; textColor = '#e65100'; badgeText = '중요'
                            }
                            return (
                              <div key={idx} style={{ background: bgColor, border: `2px solid ${borderColor}`, borderRadius: 10, padding: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: textColor }}>{item.title}</div>
                                    <div style={{ fontSize: 10, color: textColor, opacity: 0.8 }}>AI 추천</div>
                                  </div>
                                  <span style={{ background: borderColor, color: 'white', fontSize: 9, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{badgeText}</span>
                                </div>
                                {item.expectedEffect && (
                                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                                    <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#1565c0', border: '1px solid #90caf9', fontWeight: 500 }}>예상 효과: {item.expectedEffect}</span>
                                  </div>
                                )}
                                <div style={{ background: '#ffffff', borderRadius: 6, padding: 10, borderLeft: `3px solid ${borderColor}` }}>
                                  <div style={{ fontSize: 10, fontWeight: 600, color: textColor, marginBottom: 4 }}>💡 실행 가이드</div>
                                  <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>{item.description}</div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* 예측 활용 가이드 */}
                <div style={{ padding: '10px 12px', background: 'linear-gradient(135deg, #eceff1 0%, #cfd8dc 100%)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 10, color: '#546e7a' }}>
                    <span>✅ ROAS 100%+ 채널에 예산 집중</span>
                    <span>✅ CPA 높은 상품 소재/타겟 점검</span>
                    <span>✅ 최적 타겟 활용</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* 인트로 메시지 - forecast 없을 때 (기존 데이터 기반) */}
                <div style={{ marginBottom: 16, padding: '14px 18px', background: 'linear-gradient(135deg, #e8eaf6 0%, #f3e5f5 100%)', borderRadius: 12, borderLeft: '4px solid #7c4dff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🤖</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#5e35b1' }}>AI 데이터 분석 인사이트</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#7c4dff', marginTop: 6 }}>📊 현재 광고 성과 데이터를 기반으로 분석했습니다</div>
                </div>

                {/* 핵심 성과 요약 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                  <div style={{ padding: 14, background: decisionToolData.summary.overall_roas >= 100 ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: decisionToolData.summary.overall_roas >= 100 ? '#2e7d32' : '#c62828', fontWeight: 600, marginBottom: 2 }}>
                      {decisionToolData.summary.overall_roas >= 100 ? '📈' : '📉'} 전체 ROAS
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: decisionToolData.summary.overall_roas >= 100 ? '#1b5e20' : '#b71c1c' }}>{decisionToolData.summary.overall_roas?.toFixed(0) || 0}%</div>
                  </div>
                  <div style={{ padding: 14, background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#1565c0', fontWeight: 600, marginBottom: 2 }}>💰 평균 CPA</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0d47a1' }}>{formatCurrency(decisionToolData.summary.overall_cpa)}</div>
                  </div>
                  <div style={{ padding: 14, background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#e65100', fontWeight: 600, marginBottom: 2 }}>📊 전환 수</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#bf360c' }}>{formatNumber(decisionToolData.summary.total_conversions)}</div>
                  </div>
                </div>

                {/* 최적 타겟 정보 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                  {/* 최적 채널 */}
                  {sortedCategories.length > 0 && (
                    <div style={{ padding: 12, background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', borderRadius: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: '#1565c0', fontWeight: 600, marginBottom: 2 }}>📊 최적 채널</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#0d47a1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sortedCategories[0].name}</div>
                      <div style={{ fontSize: 10, color: '#1565c0' }}>ROAS {sortedCategories[0].roas?.toFixed(0) || 0}%</div>
                    </div>
                  )}
                  {/* 최적 성별 */}
                  {topTargets.topGender && (
                    <div style={{ padding: 12, background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%)', borderRadius: 10, textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: '#c2185b', fontWeight: 600, marginBottom: 2 }}>👫 최적 성별</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#880e4f' }}>{normalizeGender(topTargets.topGender.gender)}</div>
                      <div style={{ fontSize: 10, color: '#c2185b' }}>ROAS {topTargets.topGender.roas?.toFixed(0) || 0}%</div>
                    </div>
                  )}
                  {/* 최적 상품 */}
                  {decisionToolData.productPerformance.length > 0 && (() => {
                    const topProduct = [...decisionToolData.productPerformance].sort((a, b) => (b.roas || 0) - (a.roas || 0))[0]
                    return (
                      <div style={{ padding: 12, background: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)', borderRadius: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: '#3949ab', fontWeight: 600, marginBottom: 2 }}>🛍️ 최적 상품</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#1a237e' }}>{topProduct.product}</div>
                        <div style={{ fontSize: 10, color: '#3949ab' }}>ROAS {topProduct.roas?.toFixed(0) || 0}%</div>
                      </div>
                    )
                  })()}
                </div>

                {/* 채널별 ROAS 순위 */}
                {sortedCategories.length > 1 && (
                  <div style={{ marginBottom: 12, padding: 12, background: 'white', border: '1px solid var(--grey-200)', borderRadius: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#333', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>📈</span> 채널별 ROAS 순위
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                      {sortedCategories.slice(0, 6).map((cat, idx) => {
                        const roas = cat.roas || 0
                        const isGood = roas >= 100
                        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''
                        return (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: isGood ? '#f1f8e9' : '#fff3e0', borderRadius: 6, fontSize: 10 }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>{medal} {cat.name}</span>
                            <span style={{ fontWeight: 700, color: isGood ? '#2e7d32' : '#e65100' }}>{roas.toFixed(0)}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* AI가 발견한 기회 - 아코디언 */}
                {(() => {
                  const opportunities: Array<{ icon: string; title: string; description: string; metric: string | null }> = []
                  // 고효율 채널 기회
                  if (sortedCategories.length > 0 && sortedCategories[0].roas >= 100) {
                    opportunities.push({
                      icon: '📊',
                      title: `${sortedCategories[0].name} 채널 확대 기회`,
                      description: `${sortedCategories[0].name} 채널의 ROAS가 ${sortedCategories[0].roas?.toFixed(0) || 0}%로 매우 높습니다. 이 채널에 예산을 집중하면 높은 수익을 기대할 수 있습니다.`,
                      metric: `ROAS ${sortedCategories[0].roas?.toFixed(0) || 0}%`
                    })
                  }
                  // 성별 타겟 기회
                  if (topTargets.topGender && topTargets.topGender.roas >= 100) {
                    opportunities.push({
                      icon: '👫',
                      title: `${normalizeGender(topTargets.topGender.gender)} 타겟 확대 기회`,
                      description: `${normalizeGender(topTargets.topGender.gender)} 타겟에서 ROAS ${topTargets.topGender.roas?.toFixed(0) || 0}%로 우수한 성과가 나오고 있습니다. 성별 맞춤 메시지 전략을 강화하세요.`,
                      metric: `ROAS ${topTargets.topGender.roas?.toFixed(0) || 0}%`
                    })
                  }
                  // 기본 기회 추가
                  if (opportunities.length < 3) {
                    opportunities.push({ icon: '🎯', title: '타겟 최적화 기회', description: '데이터를 기반으로 타겟팅 전략을 개선하면 더 높은 성과를 기대할 수 있습니다.', metric: null })
                    opportunities.push({ icon: '💰', title: '예산 재배분 기회', description: '고효율 채널로 예산을 재배분하여 전체 ROAS를 개선할 수 있는 기회가 있습니다.', metric: null })
                    opportunities.push({ icon: '🔄', title: '크리에이티브 갱신 기회', description: '새로운 크리에이티브 테스트를 통해 광고 피로도를 낮추고 성과를 개선할 수 있습니다.', metric: null })
                  }
                  return (
                    <div style={{ marginBottom: 10, borderRadius: 10, overflow: 'hidden' }}>
                      <div
                        style={{ background: '#e8f5e9', padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => setExpandedAiOpportunity(!expandedAiOpportunity)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>🚀</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#2e7d32' }}>AI가 발견한 기회 ({opportunities.slice(0, 5).length}건)</span>
                        </div>
                        <span style={{ fontSize: 12, color: '#2e7d32', transition: 'transform 0.3s' }}>{expandedAiOpportunity ? '▼' : '▶'}</span>
                      </div>
                      {expandedAiOpportunity && (
                        <div style={{ background: '#f1f8e9', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {opportunities.slice(0, 5).map((item, idx) => (
                            <div key={idx} style={{ background: '#e8f5e9', border: '2px solid #4caf50', borderRadius: 10, padding: 14 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <span style={{ fontSize: 18 }}>{item.icon}</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: '#2e7d32' }}>{item.title}</div>
                                  <div style={{ fontSize: 10, color: '#2e7d32', opacity: 0.8 }}>성장 기회</div>
                                </div>
                                <span style={{ background: '#4caf50', color: 'white', fontSize: 9, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>GROW</span>
                              </div>
                              {item.metric && (
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                                  <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#2e7d32', border: '1px solid #81c784', fontWeight: 500 }}>{item.metric}</span>
                                </div>
                              )}
                              <div style={{ background: '#ffffff', borderRadius: 6, padding: 10, borderLeft: '3px solid #4caf50' }}>
                                <div style={{ fontSize: 10, fontWeight: 600, color: '#2e7d32', marginBottom: 4 }}>💡 인사이트</div>
                                <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>{item.description}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* AI 추천 액션 - 아코디언 */}
                {(() => {
                  const actions: Array<{ icon: string; title: string; description: string; priority: string; expectedEffect: string }> = []
                  // 저효율 채널 개선
                  const worstCategory = sortedCategories.length > 0 ? sortedCategories[sortedCategories.length - 1] : null
                  if (worstCategory && worstCategory.roas < 100) {
                    actions.push({
                      icon: '🔧',
                      title: `${worstCategory.name} 채널 광고 개선`,
                      description: `${worstCategory.name}의 ROAS가 ${worstCategory.roas?.toFixed(0) || 0}%로 낮습니다. 타겟 재설정, 크리에이티브 교체, 또는 예산 축소를 검토하세요.`,
                      priority: 'high',
                      expectedEffect: 'CPA 15~20% 개선'
                    })
                  }
                  // 고효율 채널 예산 확대
                  if (sortedCategories.length > 0 && sortedCategories[0].roas >= 150) {
                    actions.push({
                      icon: '💵',
                      title: `${sortedCategories[0].name} 예산 20% 증액`,
                      description: `${sortedCategories[0].name}의 ROAS가 ${sortedCategories[0].roas?.toFixed(0) || 0}%로 매우 높습니다. 해당 채널 예산을 20% 증액하여 성과를 극대화하세요.`,
                      priority: 'high',
                      expectedEffect: '매출 증가 기대'
                    })
                  }
                  // 기본 액션 추가
                  actions.push({ icon: '🔄', title: '크리에이티브 A/B 테스트', description: '현재 운영 중인 광고 소재의 다양한 버전을 테스트하여 최적의 성과를 찾으세요.', priority: 'low', expectedEffect: 'CTR 향상' })
                  actions.push({ icon: '📱', title: '랜딩페이지 최적화', description: '광고 클릭 후 전환율을 높이기 위해 랜딩페이지 로딩 속도와 UX를 점검하세요.', priority: 'low', expectedEffect: '전환율 향상' })
                  actions.push({ icon: '🕐', title: '광고 노출 시간대 최적화', description: '성과가 좋은 시간대에 예산을 집중하여 효율을 극대화하세요.', priority: 'low', expectedEffect: 'ROAS 개선' })

                  return (
                    <div style={{ marginBottom: 12, borderRadius: 10, overflow: 'hidden' }}>
                      <div
                        style={{ background: '#e3f2fd', padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onClick={() => setExpandedAiAction(!expandedAiAction)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>💡</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#1565c0' }}>AI 추천 액션 ({actions.slice(0, 5).length}건)</span>
                        </div>
                        <span style={{ fontSize: 12, color: '#1565c0', transition: 'transform 0.3s' }}>{expandedAiAction ? '▼' : '▶'}</span>
                      </div>
                      {expandedAiAction && (
                        <div style={{ background: '#e8f4fd', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {actions.slice(0, 5).map((item, idx) => {
                            let bgColor = '#e3f2fd'
                            let borderColor = '#2196f3'
                            let textColor = '#1565c0'
                            let badgeText = 'ACTION'
                            if (item.priority === 'high') {
                              bgColor = '#ffebee'; borderColor = '#f44336'; textColor = '#c62828'; badgeText = '긴급'
                            } else if (item.priority === 'medium') {
                              bgColor = '#fff3e0'; borderColor = '#ff9800'; textColor = '#e65100'; badgeText = '중요'
                            }
                            return (
                              <div key={idx} style={{ background: bgColor, border: `2px solid ${borderColor}`, borderRadius: 10, padding: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: textColor }}>{item.title}</div>
                                    <div style={{ fontSize: 10, color: textColor, opacity: 0.8 }}>AI 추천</div>
                                  </div>
                                  <span style={{ background: borderColor, color: 'white', fontSize: 9, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{badgeText}</span>
                                </div>
                                {item.expectedEffect && (
                                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                                    <span style={{ background: 'white', padding: '3px 8px', borderRadius: 12, fontSize: 10, color: '#1565c0', border: '1px solid #90caf9', fontWeight: 500 }}>예상 효과: {item.expectedEffect}</span>
                                  </div>
                                )}
                                <div style={{ background: '#ffffff', borderRadius: 6, padding: 10, borderLeft: `3px solid ${borderColor}` }}>
                                  <div style={{ fontSize: 10, fontWeight: 600, color: textColor, marginBottom: 4 }}>💡 실행 가이드</div>
                                  <div style={{ fontSize: 11, color: '#333', lineHeight: 1.4 }}>{item.description}</div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </>
            )}
          </div>

          <div className={`tab-content ${activeTab === 'dayAnalysis' ? 'active' : ''}`}>
            {/* 전체 기간 안내 배너 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #eceff1 0%, #cfd8dc 100%)',
              borderRadius: '8px 8px 0 0',
              marginBottom: 0
            }}>
              <span style={{ fontSize: 14 }}>🔒</span>
              <span style={{ fontSize: 11, color: '#546e7a', fontWeight: 500 }}>
                이 탭은 <strong style={{ color: '#37474f' }}>전체 기간</strong> 데이터를 사용합니다. 장기 트렌드 분석을 위해 기간 필터가 적용되지 않습니다.
              </span>
            </div>

            {/* 서브탭 버튼 */}
            <div className="subtab-container">
              <button
                className={`subtab-btn ${dayAnalysisSubtab === 'quarterlyTrend' ? 'active' : ''}`}
                onClick={() => setDayAnalysisSubtab('quarterlyTrend')}
              >
                📈 분기별 추이
              </button>
              <button
                className={`subtab-btn ${dayAnalysisSubtab === 'dayConversion' ? 'active' : ''}`}
                onClick={() => setDayAnalysisSubtab('dayConversion')}
              >
                📅 요일별 분석
              </button>
              <button
                className={`subtab-btn ${dayAnalysisSubtab === 'channelDay' ? 'active' : ''}`}
                onClick={() => setDayAnalysisSubtab('channelDay')}
              >
                📊 채널별 요일
              </button>
            </div>

            {/* 분기별 추이 */}
            {dayAnalysisSubtab === 'quarterlyTrend' && (
              <div style={{ marginTop: 16 }}>
                {/* 계절성 인사이트 - HTML 구조 1:1 재현 */}
                <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f5faff 100%)', borderBottom: '1px solid #e9ecef' }}>
                  <div style={{ fontSize: 14, color: '#1565c0', fontWeight: 600, marginBottom: 12 }}>📊 계절성 분석 인사이트</div>
                  {decisionToolData.seasonalityAnalysis?.quarterly_overall && decisionToolData.seasonalityAnalysis.quarterly_overall.length > 0 ? (() => {
                    const quarterly = decisionToolData.seasonalityAnalysis.quarterly_overall
                    const sortedByRoas = [...quarterly].sort((a, b) => (b.avg_roas || 0) - (a.avg_roas || 0))
                    const bestQuarter = sortedByRoas[0]
                    const worstQuarter = sortedByRoas[sortedByRoas.length - 1]
                    const sortedByCpa = [...quarterly].sort((a, b) => (a.avg_cpa || 0) - (b.avg_cpa || 0))
                    const lowestCpaQuarter = sortedByCpa[0]

                    // 요일별 인사이트 (overall 데이터 사용)
                    const dayData = decisionToolData.seasonalityAnalysis?.overall || []
                    const sortedDayByRoas = [...dayData].sort((a, b) => (b.avg_roas || 0) - (a.avg_roas || 0))
                    const bestDay = sortedDayByRoas[0]
                    const worstDay = sortedDayByRoas[sortedDayByRoas.length - 1]

                    // 주중/주말 비교
                    const weekdayData = dayData.filter(d => !['토요일', '일요일'].includes(d.day))
                    const weekendData = dayData.filter(d => ['토요일', '일요일'].includes(d.day))
                    const weekdayAvgRoas = weekdayData.length > 0 ? weekdayData.reduce((sum, d) => sum + (d.avg_roas || 0), 0) / weekdayData.length : 0
                    const weekendAvgRoas = weekendData.length > 0 ? weekendData.reduce((sum, d) => sum + (d.avg_roas || 0), 0) / weekendData.length : 0
                    const isWeekdayBetter = weekdayAvgRoas > weekendAvgRoas
                    const diffPercent = weekendAvgRoas > 0 ? Math.abs((weekdayAvgRoas - weekendAvgRoas) / weekendAvgRoas * 100) : 0

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {/* 분기별 인사이트 */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ color: '#1565c0', fontSize: 16 }}>📈</span>
                          <div style={{ fontSize: 13, color: '#424242', lineHeight: 1.8 }}>
                            <strong style={{ color: '#1565c0' }}>분기별 성과:</strong>{' '}
                            <strong>{bestQuarter.quarter}</strong>이 ROAS <strong>{(bestQuarter.avg_roas || 0).toFixed(1)}%</strong>로 가장 효율이 높고,{' '}
                            {worstQuarter.quarter}이 {(worstQuarter.avg_roas || 0).toFixed(1)}%로 가장 낮습니다.
                            {lowestCpaQuarter.quarter !== bestQuarter.quarter && (
                              <> CPA는 {lowestCpaQuarter.quarter}이 {Math.round(lowestCpaQuarter.avg_cpa || 0).toLocaleString()}원으로 가장 낮습니다.</>
                            )}
                          </div>
                        </div>
                        {/* 요일별 인사이트 */}
                        {bestDay && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <span style={{ color: '#2e7d32', fontSize: 16 }}>📅</span>
                            <div style={{ fontSize: 13, color: '#424242', lineHeight: 1.8 }}>
                              <strong style={{ color: '#2e7d32' }}>요일별 성과:</strong>{' '}
                              <strong>{bestDay.day}</strong>이 ROAS {(bestDay.avg_roas || 0).toFixed(1)}%로 최고,{' '}
                              {worstDay && <>{worstDay.day}이 {(worstDay.avg_roas || 0).toFixed(1)}%로 최저입니다.</>}
                            </div>
                          </div>
                        )}
                        {/* 운영 제안 */}
                        {diffPercent > 0 && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <span style={{ color: '#f57c00', fontSize: 16 }}>💡</span>
                            <div style={{ fontSize: 13, color: '#424242', lineHeight: 1.8 }}>
                              <strong style={{ color: '#f57c00' }}>운영 제안:</strong>{' '}
                              {isWeekdayBetter
                                ? <>주중이 주말보다 ROAS가 {diffPercent.toFixed(1)}% 높습니다. <strong>주중 집중 운영</strong>을 권장합니다.</>
                                : <>주말이 주중보다 ROAS가 높습니다. <strong>주말 예산 증액</strong>을 고려해보세요.</>
                              }
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })() : <div style={{ fontSize: 13, color: '#757575' }}>분기별 데이터를 분석 중입니다...</div>}
                </div>

                {/* 분기별 KPI 카드 - HTML 구조 1:1 재현 */}
                {decisionToolData.seasonalityAnalysis?.quarterly_overall && decisionToolData.seasonalityAnalysis.quarterly_overall.length > 0 && (() => {
                  const quarterColors: Record<string, { bg: string; text: string; icon: string }> = {
                    'Q1(1~3월)': { bg: '#e3f2fd', text: '#1565c0', icon: '🌸' },
                    'Q2(4~6월)': { bg: '#e8f5e9', text: '#2e7d32', icon: '☀️' },
                    'Q3(7~9월)': { bg: '#fff3e0', text: '#ef6c00', icon: '🍂' },
                    'Q4(10~12월)': { bg: '#fce4ec', text: '#c2185b', icon: '❄️' }
                  }
                  const quarterOrder = ['Q1(1~3월)', 'Q2(4~6월)', 'Q3(7~9월)', 'Q4(10~12월)']
                  const sortedQuarterly = [...decisionToolData.seasonalityAnalysis.quarterly_overall].sort((a, b) =>
                    quarterOrder.indexOf(a.quarter) - quarterOrder.indexOf(b.quarter)
                  )
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: '16px 20px', background: '#fafafa' }}>
                      {sortedQuarterly.map((q, idx) => {
                        const color = quarterColors[q.quarter] || { bg: '#f5f5f5', text: '#757575', icon: '📊' }
                        return (
                          <div key={idx} style={{ background: color.bg, borderRadius: 12, padding: 16, textAlign: 'center' }}>
                            <div style={{ fontSize: 20, marginBottom: 8 }}>{color.icon}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: color.text, marginBottom: 4 }}>{q.quarter}</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: color.text }}>{(q.avg_roas || 0).toFixed(1)}%</div>
                            <div style={{ fontSize: 11, color: '#757575', marginTop: 4 }}>ROAS</div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}

                {/* 분기별 추이 차트 - HTML Chart.js 구조 재현 (bar + line 복합 차트) */}
                {decisionToolData.seasonalityAnalysis?.quarterly_overall && decisionToolData.seasonalityAnalysis.quarterly_overall.length > 0 && (
                  <div className="card" style={{ margin: 16, borderRadius: 12 }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e9ecef' }}>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--grey-800)', margin: 0 }}>분기별 주요 지표 추이</h4>
                      <p style={{ fontSize: 12, color: 'var(--grey-600)', margin: '4px 0 0 0' }}>분기별 비용, ROAS, CPA 변화를 한눈에 확인하세요</p>
                    </div>
                    <div style={{ padding: 20 }}>
                      {(() => {
                        const quarterOrder = ['Q1(1~3월)', 'Q2(4~6월)', 'Q3(7~9월)', 'Q4(10~12월)']
                        const sortedQuarterly = [...decisionToolData.seasonalityAnalysis!.quarterly_overall!].sort((a, b) =>
                          quarterOrder.indexOf(a.quarter) - quarterOrder.indexOf(b.quarter)
                        )
                        const costData = sortedQuarterly.map(q => Math.round((q.avg_cost || 0) / 10000)) // 만원 단위
                        const roasData = sortedQuarterly.map(q => q.avg_roas || 0)
                        const cpaData = sortedQuarterly.map(q => Math.round((q.avg_cpa || 0) / 1000)) // 천원 단위

                        return (
                          <div style={{ height: 280 }}>
                              <Chart
                                type="bar"
                                data={{
                                  labels: sortedQuarterly.map(q => q.quarter),
                                  datasets: [
                                    {
                                      label: '비용 (만원)',
                                      data: costData,
                                      backgroundColor: 'rgba(66, 133, 244, 0.7)',
                                      borderColor: 'rgba(66, 133, 244, 1)',
                                      borderWidth: 1,
                                      borderRadius: 4,
                                      yAxisID: 'y',
                                      order: 2
                                    },
                                    {
                                      label: 'ROAS (%)',
                                      data: roasData,
                                      type: 'line',
                                      borderColor: '#34a853',
                                      backgroundColor: 'rgba(52, 168, 83, 0.1)',
                                      borderWidth: 3,
                                      pointRadius: 6,
                                      pointBackgroundColor: '#34a853',
                                      pointBorderColor: '#fff',
                                      pointBorderWidth: 2,
                                      tension: 0.3,
                                      fill: false,
                                      yAxisID: 'y1',
                                      order: 1
                                    },
                                    {
                                      label: 'CPA (천원)',
                                      data: cpaData,
                                      type: 'line',
                                      borderColor: '#ea4335',
                                      backgroundColor: 'rgba(234, 67, 53, 0.1)',
                                      borderWidth: 3,
                                      pointRadius: 6,
                                      pointBackgroundColor: '#ea4335',
                                      pointBorderColor: '#fff',
                                      pointBorderWidth: 2,
                                      tension: 0.3,
                                      fill: false,
                                      yAxisID: 'y2',
                                      order: 0
                                    }
                                  ]
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  interaction: {
                                    mode: 'index' as const,
                                    intersect: false
                                  },
                                  plugins: {
                                    legend: {
                                      display: true,
                                      position: 'top' as const,
                                      labels: {
                                        usePointStyle: true,
                                        padding: 20,
                                        font: { size: 12, weight: 500 }
                                      }
                                    },
                                    tooltip: {
                                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                      titleColor: '#333',
                                      bodyColor: '#666',
                                      borderColor: '#e0e0e0',
                                      borderWidth: 1,
                                      padding: 12,
                                      callbacks: {
                                        label: (context: any) => {
                                          const label = context.dataset.label || ''
                                          const value = context.parsed.y
                                          if (label.includes('비용')) return label + ': ' + value.toLocaleString() + '만원'
                                          if (label.includes('ROAS')) return label + ': ' + value.toFixed(1) + '%'
                                          if (label.includes('CPA')) return label + ': ' + value.toLocaleString() + '천원'
                                          return label + ': ' + value
                                        }
                                      }
                                    },
                                    datalabels: {
                                      display: false
                                    }
                                  },
                                  scales: {
                                    x: {
                                      grid: { display: false },
                                      ticks: { font: { size: 12, weight: 600 } }
                                    },
                                    y: {
                                      type: 'linear' as const,
                                      display: true,
                                      position: 'left' as const,
                                      title: {
                                        display: true,
                                        text: '비용 (만원)',
                                        color: '#4285f4',
                                        font: { size: 11, weight: 600 }
                                      },
                                      grid: { color: 'rgba(0, 0, 0, 0.05)' },
                                      ticks: {
                                        color: '#4285f4',
                                        callback: (value: any) => value.toLocaleString()
                                      }
                                    },
                                    y1: {
                                      type: 'linear' as const,
                                      display: true,
                                      position: 'right' as const,
                                      title: {
                                        display: true,
                                        text: 'ROAS (%)',
                                        color: '#34a853',
                                        font: { size: 11, weight: 600 }
                                      },
                                      grid: { drawOnChartArea: false },
                                      ticks: {
                                        color: '#34a853',
                                        callback: (value: any) => value.toFixed(0) + '%'
                                      }
                                    },
                                    y2: {
                                      type: 'linear' as const,
                                      display: false,
                                      position: 'right' as const,
                                      grid: { drawOnChartArea: false }
                                    }
                                  }
                                }}
                              />
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}

                {/* 분기별 상세 테이블 - HTML 구조 1:1 재현 */}
                {decisionToolData.seasonalityAnalysis?.quarterly_overall && decisionToolData.seasonalityAnalysis.quarterly_overall.length > 0 && (
                  <div className="card" style={{ margin: 16, borderRadius: 12 }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e9ecef' }}>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--grey-800)', margin: 0 }}>분기별 상세 성과</h4>
                    </div>
                    <div style={{ padding: '16px 20px', overflowX: 'auto' }}>
                      <table className="data-table" style={{ marginTop: 0 }}>
                        <thead>
                          <tr>
                            <th style={{ minWidth: 100, textAlign: 'center' }}>분기</th>
                            <th style={{ minWidth: 120, textAlign: 'right' }}>평균 비용</th>
                            <th style={{ minWidth: 100, textAlign: 'right' }}>ROAS</th>
                            <th style={{ minWidth: 100, textAlign: 'right' }}>CPA</th>
                            <th style={{ minWidth: 100, textAlign: 'right' }}>전환수</th>
                            <th style={{ minWidth: 120, textAlign: 'right' }}>전환값</th>
                            <th style={{ minWidth: 100 }}>성과 수준</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const quarterOrder = ['Q1(1~3월)', 'Q2(4~6월)', 'Q3(7~9월)', 'Q4(10~12월)']
                            const quarterEmoji: Record<string, string> = {
                              'Q1(1~3월)': '🌸', 'Q2(4~6월)': '☀️', 'Q3(7~9월)': '🍂', 'Q4(10~12월)': '❄️'
                            }
                            const sortedQuarterly = [...decisionToolData.seasonalityAnalysis!.quarterly_overall!].sort((a, b) =>
                              quarterOrder.indexOf(a.quarter) - quarterOrder.indexOf(b.quarter)
                            )
                            const maxRoas = Math.max(...sortedQuarterly.map(q => q.avg_roas || 0))
                            const minRoas = Math.min(...sortedQuarterly.map(q => q.avg_roas || 0))
                            return sortedQuarterly.map((q, idx) => {
                              const roas = q.avg_roas || 0
                              const emoji = quarterEmoji[q.quarter] || '📊'
                              // 효율 등급 계산 (HTML과 동일)
                              let efficiencyGrade = '보통'
                              let gradeColor = '#757575'
                              if (roas >= maxRoas * 0.95) { efficiencyGrade = '최고'; gradeColor = '#2e7d32' }
                              else if (roas <= minRoas * 1.05) { efficiencyGrade = '최저'; gradeColor = '#d32f2f' }
                              // 성과 바 (HTML과 동일)
                              const barWidth = maxRoas > minRoas ? ((roas - minRoas) / (maxRoas - minRoas) * 100) : 50
                              return (
                                <tr key={idx}>
                                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{emoji} {q.quarter}</td>
                                  <td style={{ textAlign: 'right' }}>{formatCurrency(q.avg_cost)}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#1565c0' }}>{roas.toFixed(1)}%</td>
                                  <td style={{ textAlign: 'right' }}>{formatCurrency(q.avg_cpa)}</td>
                                  <td style={{ textAlign: 'right' }}>{(q.avg_conversions || 0).toFixed(1)}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatCurrency(q.avg_revenue)}</td>
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <div style={{ flex: 1, background: '#e9ecef', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                                        <div style={{ width: `${barWidth}%`, background: gradeColor, height: '100%', borderRadius: 4 }}></div>
                                      </div>
                                      <span style={{ fontSize: 11, color: gradeColor, fontWeight: 600 }}>{efficiencyGrade}</span>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 요일별 분석 */}
            {dayAnalysisSubtab === 'dayConversion' && (
              <div style={{ marginTop: 16 }}>
                {/* 요일별 성과 인사이트 - HTML 구조 1:1 재현 */}
                <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #fff8e1 0%, #fffef5 100%)', borderBottom: '1px solid #e9ecef' }}>
                  <div style={{ fontSize: 14, color: '#f57c00', fontWeight: 600, marginBottom: 8 }}>💡 요일별 성과 인사이트</div>
                  {decisionToolData.seasonalityAnalysis?.overall && decisionToolData.seasonalityAnalysis.overall.length > 0 ? (() => {
                    const dayData = decisionToolData.seasonalityAnalysis.overall
                    const sorted = [...dayData].sort((a, b) => (b.avg_roas || 0) - (a.avg_roas || 0))
                    const best = sorted[0]
                    const worst = sorted[sorted.length - 1]
                    const weekdayData = dayData.filter(d => !['토요일', '일요일'].includes(d.day))
                    const weekendData = dayData.filter(d => ['토요일', '일요일'].includes(d.day))
                    const weekdayAvgRoas = weekdayData.length > 0 ? weekdayData.reduce((sum, d) => sum + (d.avg_roas || 0), 0) / weekdayData.length : 0
                    const weekendAvgRoas = weekendData.length > 0 ? weekendData.reduce((sum, d) => sum + (d.avg_roas || 0), 0) / weekendData.length : 0
                    return (
                      <div style={{ fontSize: 13, color: '#424242', lineHeight: 1.7 }}>
                        <strong style={{ color: '#2e7d32' }}>{best.day}</strong>에 ROAS <strong>{(best.avg_roas || 0).toFixed(0)}%</strong>로 가장 높은 성과를 기록합니다.{' '}
                        <strong style={{ color: '#c62828' }}>{worst.day}</strong>에 ROAS <strong>{(worst.avg_roas || 0).toFixed(0)}%</strong>로 상대적으로 낮은 성과입니다.
                        <br />
                        {weekdayAvgRoas > weekendAvgRoas
                          ? <>주중이 주말보다 <strong style={{ color: '#1565c0' }}>{((weekdayAvgRoas - weekendAvgRoas) / weekendAvgRoas * 100).toFixed(1)}%</strong> 더 높은 효율을 보입니다.</>
                          : weekendAvgRoas > weekdayAvgRoas
                            ? <>주말이 주중보다 <strong style={{ color: '#1565c0' }}>{((weekendAvgRoas - weekdayAvgRoas) / weekdayAvgRoas * 100).toFixed(1)}%</strong> 더 높은 효율을 보입니다.</>
                            : <>주중과 주말의 효율이 비슷합니다.</>
                        }
                      </div>
                    )
                  })() : <div style={{ fontSize: 13, color: '#757575' }}>요일별 데이터를 분석 중입니다...</div>}
                </div>

                {/* 요일별 성과 분석 테이블 - HTML 구조 1:1 재현 (정렬 기능 포함) */}
                <div className="card" style={{ margin: 16, borderRadius: 12 }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #e9ecef' }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--grey-800)', margin: 0 }}>요일별 성과 분석</h4>
                    <p style={{ fontSize: 12, color: 'var(--grey-600)', margin: '4px 0 0 0' }}>어떤 요일에 광고 효율이 가장 좋은지 확인하세요 (헤더 클릭으로 정렬)</p>
                  </div>
                  {decisionToolData.seasonalityAnalysis?.overall && decisionToolData.seasonalityAnalysis.overall.length > 0 ? (
                    <div style={{ padding: '16px 20px', overflowX: 'auto' }}>
                      <table className="data-table" style={{ marginTop: 0 }}>
                        <thead>
                          <tr>
                            <th style={{ minWidth: 100, textAlign: 'center' }}>요일</th>
                            {[
                              { key: 'roas', label: 'ROAS', minWidth: 100 },
                              { key: 'cpa', label: 'CPA', minWidth: 100 },
                              { key: 'cost', label: '광고비', minWidth: 120 },
                              { key: 'conversions', label: '전환수', minWidth: 80 },
                              { key: 'revenue', label: '전환값', minWidth: 120 }
                            ].map(col => {
                              const isActive = daySortConfig.column === col.key
                              const isAsc = isActive && daySortConfig.direction === 'asc'
                              const isDesc = isActive && daySortConfig.direction === 'desc'
                              return (
                                <th
                                  key={col.key}
                                  className="sortable-header"
                                  style={{
                                    minWidth: col.minWidth,
                                    textAlign: 'right',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    position: 'relative',
                                    paddingRight: 24,
                                    transition: 'background 0.2s ease'
                                  }}
                                  onClick={() => setDaySortConfig(prev => ({
                                    column: col.key,
                                    direction: prev.column === col.key && prev.direction === 'desc' ? 'asc' : 'desc'
                                  }))}
                                >
                                  {col.label}
                                  {/* sort-icon - HTML 구조 동일 */}
                                  <div style={{
                                    position: 'absolute',
                                    right: 6,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                    opacity: isActive ? 1 : 0.3
                                  }}>
                                    {/* sort-arrow up */}
                                    <div style={{
                                      width: 0,
                                      height: 0,
                                      borderLeft: '4px solid transparent',
                                      borderRight: '4px solid transparent',
                                      borderBottom: `4px solid ${isAsc ? '#673ab7' : '#757575'}`
                                    }}></div>
                                    {/* sort-arrow down */}
                                    <div style={{
                                      width: 0,
                                      height: 0,
                                      borderLeft: '4px solid transparent',
                                      borderRight: '4px solid transparent',
                                      borderTop: `4px solid ${isDesc ? '#673ab7' : '#757575'}`
                                    }}></div>
                                  </div>
                                </th>
                              )
                            })}
                            <th style={{ minWidth: 120 }}>성과 수준</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const dayData = decisionToolData.seasonalityAnalysis!.overall!
                            const maxRoas = Math.max(...dayData.map(d => d.avg_roas || 0))
                            const minRoas = Math.min(...dayData.map(d => d.avg_roas || 0))
                            const dayEmoji: Record<string, string> = { '월요일': '🌙', '화요일': '🔥', '수요일': '💧', '목요일': '🌲', '금요일': '💰', '토요일': '🌟', '일요일': '☀️' }
                            // 정렬 적용
                            const sortedData = [...dayData].sort((a, b) => {
                              let aVal = 0, bVal = 0
                              switch (daySortConfig.column) {
                                case 'roas': aVal = a.avg_roas || 0; bVal = b.avg_roas || 0; break
                                case 'cpa': aVal = a.avg_cpa || 0; bVal = b.avg_cpa || 0; break
                                case 'cost': aVal = a.avg_cost || 0; bVal = b.avg_cost || 0; break
                                case 'conversions': aVal = a.avg_conversions || 0; bVal = b.avg_conversions || 0; break
                                case 'revenue': aVal = a.avg_revenue || 0; bVal = b.avg_revenue || 0; break
                              }
                              return daySortConfig.direction === 'desc' ? bVal - aVal : aVal - bVal
                            })
                            return sortedData.map((d, idx) => {
                              const roas = d.avg_roas || 0
                              // 효율 등급 계산 (HTML과 동일)
                              let efficiencyGrade = '보통'
                              let gradeColor = '#757575'
                              if (roas >= maxRoas * 0.95) { efficiencyGrade = '최고'; gradeColor = '#2e7d32' }
                              else if (roas <= minRoas * 1.05) { efficiencyGrade = '최저'; gradeColor = '#d32f2f' }
                              else if (roas >= maxRoas * 0.8) { efficiencyGrade = '우수'; gradeColor = '#1565c0' }
                              // 성과 바 (HTML과 동일)
                              const barWidth = maxRoas > minRoas ? ((roas - minRoas) / (maxRoas - minRoas) * 100) : 50
                              return (
                                <tr key={idx}>
                                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{dayEmoji[d.day] || '📅'} {d.day}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#1565c0' }}>{roas.toFixed(1)}%</td>
                                  <td style={{ textAlign: 'right' }}>{formatCurrency(d.avg_cpa)}</td>
                                  <td style={{ textAlign: 'right' }}>{formatCurrency(d.avg_cost)}</td>
                                  <td style={{ textAlign: 'right' }}>{(d.avg_conversions || 0).toFixed(1)}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatCurrency(d.avg_revenue)}</td>
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <div style={{ flex: 1, background: '#e9ecef', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                                        <div style={{ width: `${barWidth}%`, background: gradeColor, height: '100%', borderRadius: 4 }}></div>
                                      </div>
                                      <span style={{ fontSize: 11, color: gradeColor, fontWeight: 600 }}>{efficiencyGrade}</span>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })
                          })()}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--grey-500)' }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
                      <div>요일별 데이터가 없습니다</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 채널별 요일 */}
            {dayAnalysisSubtab === 'channelDay' && (
              <div style={{ marginTop: 16 }}>
                {/* 채널별 요일 성과 분석 인사이트 - HTML 구조 1:1 재현 */}
                <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', borderBottom: '1px solid #a5d6a7' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 20 }}>📊</span>
                    <div style={{ fontSize: 15, color: '#1b5e20', fontWeight: 700 }}>채널별 요일 성과 분석</div>
                  </div>
                  {decisionToolData.seasonalityAnalysis?.by_category && Object.keys(decisionToolData.seasonalityAnalysis.by_category).length > 0 ? (() => {
                    const byCategory = decisionToolData.seasonalityAnalysis.by_category!
                    const categories = Object.keys(byCategory)
                    const insights: string[] = []
                    categories.forEach(cat => {
                      const dayData = byCategory[cat]
                      if (dayData && dayData.length > 0) {
                        const sorted = [...dayData].sort((a, b) => (b.avg_roas || 0) - (a.avg_roas || 0))
                        const best = sorted[0]
                        insights.push(`${cat}은 ${best.day}에 ROAS ${(best.avg_roas || 0).toFixed(0)}%로 최고 성과`)
                      }
                    })
                    return (
                      <div style={{ fontSize: 13, color: '#2e7d32', lineHeight: 1.8, background: 'rgba(255,255,255,0.7)', padding: '12px 16px', borderRadius: 8 }}>
                        {insights.slice(0, 3).map((insight, idx) => (
                          <div key={idx}>• {insight}</div>
                        ))}
                      </div>
                    )
                  })() : <div style={{ fontSize: 13, color: '#2e7d32', background: 'rgba(255,255,255,0.7)', padding: '12px 16px', borderRadius: 8 }}>채널별 요일 데이터를 분석 중입니다...</div>}
                </div>

                {/* 채널별 KPI 카드 - HTML 구조 1:1 재현 */}
                {decisionToolData.seasonalityAnalysis?.by_category && Object.keys(decisionToolData.seasonalityAnalysis.by_category).length > 0 && (
                  <div id="channelDayKpiCards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, padding: '20px 24px', background: '#fafafa' }}>
                    {(() => {
                      const byCategory = decisionToolData.seasonalityAnalysis!.by_category!
                      const channelColors: Record<string, { bg: string; border: string; icon: string; gradient: string }> = {
                        '메타_전환': { bg: '#e3f2fd', border: '#1976d2', icon: '📘', gradient: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
                        '네이버_쇼핑검색': { bg: '#e8f5e9', border: '#388e3c', icon: '🛒', gradient: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
                        '네이버_파워링크': { bg: '#fff3e0', border: '#f57c00', icon: '🔗', gradient: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
                        '네이버_신제품검색광고': { bg: '#fce4ec', border: '#c2185b', icon: '✨', gradient: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%)' },
                        '구분필요': { bg: '#f3e5f5', border: '#7b1fa2', icon: '❓', gradient: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }
                      }
                      const dayEmoji: Record<string, string> = { '월요일': '🌙', '화요일': '🔥', '수요일': '💧', '목요일': '🌲', '금요일': '💰', '토요일': '🌟', '일요일': '☀️' }
                      return Object.keys(byCategory).map((category, idx) => {
                        const dayData = byCategory[category]
                        if (!dayData || dayData.length === 0) return null
                        const sortedByRoas = [...dayData].sort((a, b) => (b.avg_roas || 0) - (a.avg_roas || 0))
                        const bestRoasDay = sortedByRoas[0]
                        const worstRoasDay = sortedByRoas[sortedByRoas.length - 1]
                        const avgCost = dayData.reduce((sum, d) => sum + (d.avg_cost || 0), 0) / dayData.length
                        // 요일별 ROAS 편차 계산 (HTML과 동일)
                        const roasDiff = bestRoasDay.avg_roas && worstRoasDay.avg_roas
                          ? ((bestRoasDay.avg_roas - worstRoasDay.avg_roas) / worstRoasDay.avg_roas * 100).toFixed(1)
                          : '0'
                        const colorConfig = channelColors[category] || { bg: '#f5f5f5', border: '#757575', icon: '📊', gradient: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)' }
                        return (
                          <div key={idx} style={{ background: colorConfig.gradient, borderRadius: 12, padding: 20, borderLeft: `4px solid ${colorConfig.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                              <span style={{ fontSize: 24 }}>{colorConfig.icon}</span>
                              <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#212121' }}>{category}</div>
                                <div style={{ fontSize: 11, color: '#757575' }}>일평균 비용 {formatCurrency(avgCost)}</div>
                              </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                              <div style={{ background: 'rgba(255,255,255,0.8)', padding: 12, borderRadius: 8 }}>
                                <div style={{ fontSize: 10, color: '#757575', marginBottom: 4 }}>🏆 최고 ROAS 요일</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#2e7d32' }}>{dayEmoji[bestRoasDay.day] || '📅'} {bestRoasDay.day}</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: '#1b5e20' }}>{(bestRoasDay.avg_roas || 0).toFixed(0)}%</div>
                              </div>
                              <div style={{ background: 'rgba(255,255,255,0.8)', padding: 12, borderRadius: 8 }}>
                                <div style={{ fontSize: 10, color: '#757575', marginBottom: 4 }}>📉 최저 ROAS 요일</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#c62828' }}>{dayEmoji[worstRoasDay.day] || '📅'} {worstRoasDay.day}</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: '#b71c1c' }}>{(worstRoasDay.avg_roas || 0).toFixed(0)}%</div>
                              </div>
                            </div>
                            {/* 요일별 ROAS 편차 (HTML과 동일) */}
                            <div style={{ background: 'rgba(255,255,255,0.6)', padding: '10px 12px', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 11, color: '#616161' }}>요일별 ROAS 편차</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: parseFloat(roasDiff) > 20 ? '#d32f2f' : '#1565c0' }}>+{roasDiff}%</span>
                            </div>
                          </div>
                        )
                      }).filter(Boolean)
                    })()}
                  </div>
                )}

                {/* 채널별 요일 ROAS 비교 차트 - HTML 구조 1:1 재현 */}
                {decisionToolData.seasonalityAnalysis?.by_category && Object.keys(decisionToolData.seasonalityAnalysis.by_category).length > 0 && (
                  <div className="card" style={{ margin: '0 16px 16px 16px', borderRadius: 12 }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e9ecef' }}>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--grey-800)', margin: 0 }}>📈 채널별 요일 ROAS 비교</h4>
                      <p style={{ fontSize: 12, color: 'var(--grey-600)', margin: '4px 0 0 0' }}>각 채널의 요일별 ROAS를 비교하여 최적의 광고 집행 요일을 파악하세요</p>
                    </div>
                    <div style={{ padding: 20, height: 350 }}>
                      {(() => {
                        const byCategory = decisionToolData.seasonalityAnalysis!.by_category!
                        const dayOrder = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일']
                        const dayLabels = ['월', '화', '수', '목', '금', '토', '일']
                        const channelColorMap: Record<string, string> = {
                          '메타_전환': '#1976d2', '네이버_쇼핑검색': '#388e3c', '네이버_파워링크': '#f57c00', '네이버_신제품검색광고': '#c2185b'
                        }
                        const categories = Object.keys(byCategory)
                        let maxRoas = 0
                        categories.forEach(cat => {
                          byCategory[cat].forEach(d => { if ((d.avg_roas || 0) > maxRoas) maxRoas = d.avg_roas || 0 })
                        })
                        return (
                          <div>
                            {/* 범례 */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                              {categories.map((cat, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                                  <div style={{ width: 12, height: 12, background: channelColorMap[cat] || '#9e9e9e', borderRadius: 2 }}></div>
                                  <span>{cat}</span>
                                </div>
                              ))}
                            </div>
                            {/* 차트 */}
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 200 }}>
                              {dayLabels.map((dayLabel, dayIdx) => {
                                const day = dayOrder[dayIdx]
                                return (
                                  <div key={dayIdx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 150, marginBottom: 8 }}>
                                      {categories.map((cat, catIdx) => {
                                        const dayData = byCategory[cat].find(d => d.day === day)
                                        const roas = dayData?.avg_roas || 0
                                        const barHeight = maxRoas > 0 ? (roas / maxRoas) * 130 : 0
                                        const color = channelColorMap[cat] || '#9e9e9e'
                                        return (
                                          <div key={catIdx} style={{ width: 12, height: barHeight, background: color, borderRadius: '2px 2px 0 0', minHeight: 4 }} title={`${cat}: ${roas.toFixed(0)}%`}></div>
                                        )
                                      })}
                                    </div>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: '#424242' }}>{dayLabel}</div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}

                {/* 채널 선택 드롭다운 + 요일별 상세 테이블 - HTML 구조 1:1 재현 */}
                {decisionToolData.seasonalityAnalysis?.by_category && Object.keys(decisionToolData.seasonalityAnalysis.by_category).length > 0 && (
                  <div className="card" style={{ margin: '0 16px 16px 16px', borderRadius: 12 }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--grey-800)', margin: 0 }}>📋 요일별 상세 성과</h4>
                        <p style={{ fontSize: 12, color: 'var(--grey-600)', margin: '4px 0 0 0' }}>채널을 선택하여 요일별 성과를 확인하세요</p>
                      </div>
                      {(() => {
                        const channelIcons: Record<string, string> = {
                          '메타_전환': '📘', '네이버_쇼핑검색': '🛒', '네이버_파워링크': '🔗', '네이버_신제품검색광고': '✨', '구분필요': '❓'
                        }
                        return (
                          <select
                            value={selectedChannelDay || Object.keys(decisionToolData.seasonalityAnalysis!.by_category!)[0]}
                            onChange={(e) => setSelectedChannelDay(e.target.value)}
                            style={{ padding: '8px 12px', border: '1px solid #dee2e6', borderRadius: 8, fontSize: 13, background: 'white', cursor: 'pointer', minWidth: 160 }}
                          >
                            {Object.keys(decisionToolData.seasonalityAnalysis!.by_category!).map((cat, idx) => {
                              const icon = channelIcons[cat] || '📊'
                              return <option key={idx} value={cat}>{icon} {cat}</option>
                            })}
                          </select>
                        )
                      })()}
                    </div>
                    <div style={{ padding: '16px 20px', overflowX: 'auto' }}>
                      {(() => {
                        const byCategory = decisionToolData.seasonalityAnalysis!.by_category!
                        const currentChannel = selectedChannelDay || Object.keys(byCategory)[0]
                        const dayData = byCategory[currentChannel] || []
                        const dayOrder = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일']
                        const sortedByDay = [...dayData].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day))
                        // 최고/최저 ROAS 찾기 (HTML과 동일)
                        const roasValues = dayData.map(d => d.avg_roas || 0)
                        const maxRoas = Math.max(...roasValues)
                        const minRoas = Math.min(...roasValues)
                        const dayEmoji: Record<string, string> = { '월요일': '🌙', '화요일': '🔥', '수요일': '💧', '목요일': '🌲', '금요일': '💰', '토요일': '🌟', '일요일': '☀️' }
                        return (
                          <table className="data-table" style={{ marginTop: 0 }}>
                            <thead>
                              <tr>
                                <th style={{ minWidth: 80, textAlign: 'center' }}>요일</th>
                                <th style={{ minWidth: 110, textAlign: 'right' }}>평균 비용</th>
                                <th style={{ minWidth: 110, textAlign: 'right' }}>평균 전환값</th>
                                <th style={{ minWidth: 90, textAlign: 'right' }}>ROAS</th>
                                <th style={{ minWidth: 100, textAlign: 'right' }}>CPA</th>
                                <th style={{ minWidth: 80, textAlign: 'center' }}>성과</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedByDay.map((d, idx) => {
                                const roas = d.avg_roas || 0
                                const isBest = roas === maxRoas
                                const isWorst = roas === minRoas
                                // 성과 레벨 (HTML과 동일)
                                let performanceLabel = '보통'
                                let performanceColor = '#757575'
                                let performanceBg = '#f5f5f5'
                                if (isBest) {
                                  performanceLabel = '🏆 최고'
                                  performanceColor = '#1b5e20'
                                  performanceBg = '#c8e6c9'
                                } else if (isWorst) {
                                  performanceLabel = '📉 최저'
                                  performanceColor = '#b71c1c'
                                  performanceBg = '#ffcdd2'
                                } else if (roas > (maxRoas + minRoas) / 2) {
                                  performanceLabel = '양호'
                                  performanceColor = '#2e7d32'
                                  performanceBg = '#e8f5e9'
                                }
                                // 행 배경색 (HTML과 동일)
                                const rowBg = isBest ? '#f1f8e9' : isWorst ? '#fff8f8' : 'transparent'
                                return (
                                  <tr key={idx} style={{ background: rowBg }}>
                                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{dayEmoji[d.day] || '📅'} {d.day}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(d.avg_cost)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatCurrency(d.avg_revenue)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 14, color: isBest ? '#1b5e20' : isWorst ? '#b71c1c' : '#424242' }}>{roas.toFixed(1)}%</td>
                                    <td style={{ textAlign: 'right', color: isWorst ? '#b71c1c' : '#616161' }}>{formatCurrency(d.avg_cpa)}</td>
                                    <td style={{ textAlign: 'center' }}>
                                      <span style={{ background: performanceBg, color: performanceColor, padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{performanceLabel}</span>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 성과 추이 분석 (통합 탭) - HTML 구조 1:1 재현 */}
      <div className="collapsible-section">
        <div
          className="collapsible-header"
          onClick={() => setTrendAnalysisExpanded(!trendAnalysisExpanded)}
        >
          <div className="collapsible-title">
            <span className="collapsible-icon">📈</span>
            <span>성과 추이 분석 - 시간에 따른 성과 변화를 확인하세요</span>
          </div>
          <button className="collapsible-toggle">
            <span>{trendAnalysisExpanded ? '접기' : '펼치기'}</span>
            <span style={{ transform: trendAnalysisExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
          </button>
        </div>

        {trendAnalysisExpanded && (
          <div className="collapsible-content expanded">
            {/* 탭 버튼 */}
            <div className="view-type-section" style={{ marginBottom: 24 }}>
              <button
                className={`view-btn ${trendAnalysisTab === 'timeseries' ? 'active' : ''}`}
                onClick={() => setTrendAnalysisTab('timeseries')}
              >광고세트 추이</button>
              <button
                className={`view-btn ${trendAnalysisTab === 'gender' ? 'active' : ''}`}
                onClick={() => setTrendAnalysisTab('gender')}
              >성별 추이</button>
              <button
                className={`view-btn ${trendAnalysisTab === 'age' ? 'active' : ''}`}
                onClick={() => setTrendAnalysisTab('age')}
              >연령 추이</button>
              <button
                className={`view-btn ${trendAnalysisTab === 'platform' ? 'active' : ''}`}
                onClick={() => setTrendAnalysisTab('platform')}
              >플랫폼 추이</button>
              <button
                className={`view-btn ${trendAnalysisTab === 'devicePlatform' ? 'active' : ''}`}
                onClick={() => setTrendAnalysisTab('devicePlatform')}
              >기기플랫폼 추이</button>
              <button
                className={`view-btn ${trendAnalysisTab === 'deviceType' ? 'active' : ''}`}
                onClick={() => setTrendAnalysisTab('deviceType')}
              >기기 추이</button>
            </div>

            {/* 탭 1: 광고세트 추이 - HTML 1:1 구현 */}
            {trendAnalysisTab === 'timeseries' && (
              <div>
                {/* 컴팩트 설명 섹션 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {/* 분석 목적 카드 */}
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%)', borderRadius: 8, borderLeft: '4px solid #2196f3', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 16 }}>📊</span>
                      <strong style={{ color: '#1976d2', fontSize: 13 }}>이 분석의 목적</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#424242', lineHeight: 1.6 }}>
                      시간에 따른 <strong style={{ color: '#1565c0' }}>광고세트별 성과 변화</strong>를 추적하여<br />
                      트렌드와 패턴을 한눈에 파악할 수 있습니다
                    </p>
                  </div>

                  {/* 사용 방법 카드 */}
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: 8, borderLeft: '4px solid #4caf50', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 16 }}>💡</span>
                      <strong style={{ color: '#388e3c', fontSize: 13 }}>사용 방법</strong>
                    </div>
                    <div style={{ fontSize: 12, color: '#424242', lineHeight: 1.6 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>1</span>
                        <span>드롭다운에서 원하는 필터 선택</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>2</span>
                        <span>차트에서 추이 패턴 확인</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  {/* 상단 헤더 및 컨트롤 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '2px solid var(--grey-200)', paddingBottom: 16 }}>
                    <div>
                      <div className="card-title" style={{ marginBottom: 4 }}>시간에 따른 광고세트 성과 추이</div>
                      <p style={{ color: 'var(--grey-600)', fontSize: 13, margin: 0 }}>
                        시간에 따른 각 세그먼트의 성과 변화를 추적하여 트렌드를 파악할 수 있습니다.
                      </p>
                    </div>
                    {/* 집계 단위 선택 버튼 */}
                    <div className="view-type-section" style={{ marginBottom: 0 }}>
                      <button className={`view-btn ${currentTimeseriesPeriod === 'monthly' ? 'active' : ''}`} onClick={() => setCurrentTimeseriesPeriod('monthly')}>월별</button>
                      <button className={`view-btn ${currentTimeseriesPeriod === 'weekly' ? 'active' : ''}`} onClick={() => setCurrentTimeseriesPeriod('weekly')}>주별</button>
                      <button className={`view-btn ${currentTimeseriesPeriod === 'daily' ? 'active' : ''}`} onClick={() => setCurrentTimeseriesPeriod('daily')}>일별</button>
                    </div>
                  </div>

                  {/* 지표 선택 및 기간 선택 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 20 }}>
                    {/* 지표 선택 */}
                    <div style={{ flex: '0 0 auto' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)', marginBottom: 12 }}>📈 지표 선택</div>
                      <select
                        value={currentTimeseriesMetric}
                        onChange={(e) => setCurrentTimeseriesMetric(e.target.value)}
                        style={{ minWidth: 200, padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        <option value="roas">ROAS</option>
                        <option value="cost">비용</option>
                        <option value="revenue">전환값</option>
                        <option value="conversions">전환수</option>
                        <option value="impressions">노출수</option>
                        <option value="clicks">클릭수</option>
                        <option value="cpm">CPM</option>
                        <option value="cpc">CPC</option>
                        <option value="cpa">CPA</option>
                        <option value="ctr">CTR</option>
                        <option value="cvr">전환율</option>
                      </select>
                    </div>

                    {/* 기간 선택 */}
                    <div style={{ flex: '0 0 auto', marginLeft: 'auto' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)', marginBottom: 12 }}>📅 기간 선택</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="date"
                          value={timeseriesStartDate}
                          onChange={(e) => setTimeseriesStartDate(e.target.value)}
                          style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', transition: 'all 0.2s' }}
                        />
                        <span style={{ color: 'var(--grey-600)', fontWeight: 500 }}>~</span>
                        <input
                          type="date"
                          value={timeseriesEndDate}
                          onChange={(e) => setTimeseriesEndDate(e.target.value)}
                          style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', transition: 'all 0.2s' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 드롭다운 형태 필터 - 분류 기준 */}
                  <div style={{ marginBottom: 20, padding: 16, background: 'var(--grey-50)', borderRadius: 8, border: '1px solid var(--grey-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)' }}>📊 분류 기준</div>
                      <div style={{ fontSize: 12, color: '#2e7d32', fontWeight: 600 }}>
                        🎯 <span>{filteredTrendData.adsetsToShow.size}</span>개 광고세트
                      </div>
                    </div>

                    {/* 드롭다운 버튼들 */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      {/* 채널별 드롭다운 */}
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 180, flex: 1 }}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, channel: !prev.channel, product: false, brand: false, promotion: false })) }}
                          style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', textAlign: 'left' }}
                        >
                          <span style={{ fontWeight: 500 }}>
                            {timeseriesFilters.channel.length === 0 ? '채널_전체' :
                             timeseriesFilters.channel.length === trendFilterOptions.channels.length ? '채널_전체' :
                             timeseriesFilters.channel.length === 1 ? timeseriesFilters.channel[0] :
                             `${timeseriesFilters.channel[0]} 외`}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="timeseries-selected-count" style={{ fontSize: 11, color: 'var(--grey-500)' }}>
                              {timeseriesFilters.channel.length === 0 ? '' :
                               timeseriesFilters.channel.length === trendFilterOptions.channels.length ? `(${timeseriesFilters.channel.length})` :
                               timeseriesFilters.channel.length === 1 ? '' :
                               `(${timeseriesFilters.channel.length})`}
                            </span>
                            <span style={{ fontSize: 10 }}>▼</span>
                          </span>
                        </button>
                        {trendDropdownOpen.channel && (
                          <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}>
                            <div style={{ padding: 8 }}>
                              <div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6, zIndex: 1 }}>
                                <label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4, transition: 'background 0.2s' }}>
                                  <input
                                    type="checkbox"
                                    checked={timeseriesFilters.channel.length === trendFilterOptions.channels.length && trendFilterOptions.channels.length > 0}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setTimeseriesFilters(prev => ({ ...prev, channel: [...trendFilterOptions.channels] }))
                                      } else {
                                        setTimeseriesFilters(prev => ({ ...prev, channel: [] }))
                                      }
                                    }}
                                    style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }}
                                  />
                                  전체 선택
                                </label>
                              </div>
                              {trendFilterOptions.channels.map((item, idx) => (
                                <label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4, transition: 'background 0.2s' }}>
                                  <input
                                    type="checkbox"
                                    checked={timeseriesFilters.channel.includes(item)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setTimeseriesFilters(prev => ({ ...prev, channel: [...prev.channel, item] }))
                                      } else {
                                        setTimeseriesFilters(prev => ({ ...prev, channel: prev.channel.filter(v => v !== item) }))
                                      }
                                    }}
                                    style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }}
                                  />
                                  {item}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 제품별 드롭다운 */}
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 180, flex: 1 }}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, product: !prev.product, channel: false, brand: false, promotion: false })) }}
                          style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', textAlign: 'left' }}
                        >
                          <span style={{ fontWeight: 500 }}>
                            {timeseriesFilters.product.length === 0 ? '제품_전체' :
                             timeseriesFilters.product.length === trendFilterOptions.products.length ? '제품_전체' :
                             timeseriesFilters.product.length === 1 ? timeseriesFilters.product[0] :
                             `${timeseriesFilters.product[0]} 외`}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="timeseries-selected-count" style={{ fontSize: 11, color: 'var(--grey-500)' }}>
                              {timeseriesFilters.product.length === 0 ? '' :
                               timeseriesFilters.product.length === trendFilterOptions.products.length ? `(${timeseriesFilters.product.length})` :
                               timeseriesFilters.product.length === 1 ? '' :
                               `(${timeseriesFilters.product.length})`}
                            </span>
                            <span style={{ fontSize: 10 }}>▼</span>
                          </span>
                        </button>
                        {trendDropdownOpen.product && (
                          <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}>
                            <div style={{ padding: 8 }}>
                              <div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6, zIndex: 1 }}>
                                <label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4, transition: 'background 0.2s' }}>
                                  <input
                                    type="checkbox"
                                    checked={timeseriesFilters.product.length === trendFilterOptions.products.length && trendFilterOptions.products.length > 0}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setTimeseriesFilters(prev => ({ ...prev, product: [...trendFilterOptions.products] }))
                                      } else {
                                        setTimeseriesFilters(prev => ({ ...prev, product: [] }))
                                      }
                                    }}
                                    style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }}
                                  />
                                  전체 선택
                                </label>
                              </div>
                              {trendFilterOptions.products.map((item, idx) => (
                                <label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4, transition: 'background 0.2s' }}>
                                  <input
                                    type="checkbox"
                                    checked={timeseriesFilters.product.includes(item)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setTimeseriesFilters(prev => ({ ...prev, product: [...prev.product, item] }))
                                      } else {
                                        setTimeseriesFilters(prev => ({ ...prev, product: prev.product.filter(v => v !== item) }))
                                      }
                                    }}
                                    style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }}
                                  />
                                  {item}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 브랜드별 드롭다운 */}
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 180, flex: 1 }}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, brand: !prev.brand, channel: false, product: false, promotion: false })) }}
                          style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', textAlign: 'left' }}
                        >
                          <span style={{ fontWeight: 500 }}>
                            {timeseriesFilters.brand.length === 0 ? '브랜드_전체' :
                             timeseriesFilters.brand.length === trendFilterOptions.brands.length ? '브랜드_전체' :
                             timeseriesFilters.brand.length === 1 ? timeseriesFilters.brand[0] :
                             `${timeseriesFilters.brand[0]} 외`}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="timeseries-selected-count" style={{ fontSize: 11, color: 'var(--grey-500)' }}>
                              {timeseriesFilters.brand.length === 0 ? '' :
                               timeseriesFilters.brand.length === trendFilterOptions.brands.length ? `(${timeseriesFilters.brand.length})` :
                               timeseriesFilters.brand.length === 1 ? '' :
                               `(${timeseriesFilters.brand.length})`}
                            </span>
                            <span style={{ fontSize: 10 }}>▼</span>
                          </span>
                        </button>
                        {trendDropdownOpen.brand && (
                          <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}>
                            <div style={{ padding: 8 }}>
                              <div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6, zIndex: 1 }}>
                                <label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4, transition: 'background 0.2s' }}>
                                  <input
                                    type="checkbox"
                                    checked={timeseriesFilters.brand.length === trendFilterOptions.brands.length && trendFilterOptions.brands.length > 0}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setTimeseriesFilters(prev => ({ ...prev, brand: [...trendFilterOptions.brands] }))
                                      } else {
                                        setTimeseriesFilters(prev => ({ ...prev, brand: [] }))
                                      }
                                    }}
                                    style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }}
                                  />
                                  전체 선택
                                </label>
                              </div>
                              {trendFilterOptions.brands.map((item, idx) => (
                                <label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4, transition: 'background 0.2s' }}>
                                  <input
                                    type="checkbox"
                                    checked={timeseriesFilters.brand.includes(item)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setTimeseriesFilters(prev => ({ ...prev, brand: [...prev.brand, item] }))
                                      } else {
                                        setTimeseriesFilters(prev => ({ ...prev, brand: prev.brand.filter(v => v !== item) }))
                                      }
                                    }}
                                    style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }}
                                  />
                                  {item}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 프로모션별 드롭다운 */}
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 180, flex: 1 }}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, promotion: !prev.promotion, channel: false, product: false, brand: false })) }}
                          style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', textAlign: 'left' }}
                        >
                          <span style={{ fontWeight: 500 }}>
                            {timeseriesFilters.promotion.length === 0 ? '프로모션_전체' :
                             timeseriesFilters.promotion.length === trendFilterOptions.promotions.length ? '프로모션_전체' :
                             timeseriesFilters.promotion.length === 1 ? timeseriesFilters.promotion[0] :
                             `${timeseriesFilters.promotion[0]} 외`}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="timeseries-selected-count" style={{ fontSize: 11, color: 'var(--grey-500)' }}>
                              {timeseriesFilters.promotion.length === 0 ? '' :
                               timeseriesFilters.promotion.length === trendFilterOptions.promotions.length ? `(${timeseriesFilters.promotion.length})` :
                               timeseriesFilters.promotion.length === 1 ? '' :
                               `(${timeseriesFilters.promotion.length})`}
                            </span>
                            <span style={{ fontSize: 10 }}>▼</span>
                          </span>
                        </button>
                        {trendDropdownOpen.promotion && (
                          <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}>
                            <div style={{ padding: 8 }}>
                              <div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6, zIndex: 1 }}>
                                <label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4, transition: 'background 0.2s' }}>
                                  <input
                                    type="checkbox"
                                    checked={timeseriesFilters.promotion.length === trendFilterOptions.promotions.length && trendFilterOptions.promotions.length > 0}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setTimeseriesFilters(prev => ({ ...prev, promotion: [...trendFilterOptions.promotions] }))
                                      } else {
                                        setTimeseriesFilters(prev => ({ ...prev, promotion: [] }))
                                      }
                                    }}
                                    style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }}
                                  />
                                  전체 선택
                                </label>
                              </div>
                              {trendFilterOptions.promotions.map((item, idx) => (
                                <label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4, transition: 'background 0.2s' }}>
                                  <input
                                    type="checkbox"
                                    checked={timeseriesFilters.promotion.includes(item)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setTimeseriesFilters(prev => ({ ...prev, promotion: [...prev.promotion, item] }))
                                      } else {
                                        setTimeseriesFilters(prev => ({ ...prev, promotion: prev.promotion.filter(v => v !== item) }))
                                      }
                                    }}
                                    style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }}
                                  />
                                  {item}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* 트렌드 차트 */}
                  <div className="chart-container" style={{ position: 'relative', height: 350, marginBottom: 20 }}>
                    {filteredTrendData.chartData && filteredTrendData.chartData.datasets.length > 0 ? (
                      <Line
                        data={{
                          labels: filteredTrendData.chartData.labels,
                          datasets: filteredTrendData.chartData.datasets
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: true, position: 'top' as const },
                            datalabels: { display: false },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const adset = context.dataset.label || ''
                                  const period = context.label || ''
                                  const aggregatedData = filteredTrendData.chartData?.aggregatedData
                                  const data = aggregatedData?.[adset]?.[period] || { cost: 0, revenue: 0, conversions: 0, impressions: 0, clicks: 0 }

                                  const roas = data.cost > 0 ? (data.revenue / data.cost * 100) : 0
                                  const ctr = data.impressions > 0 ? (data.clicks / data.impressions * 100) : 0
                                  const cvr = data.clicks > 0 ? (data.conversions / data.clicks * 100) : 0

                                  const lines = [adset]
                                  switch(currentTimeseriesMetric) {
                                    case 'roas':
                                      lines.push(`ROAS: ${roas.toFixed(1)}%`)
                                      lines.push(`비용: ${formatCurrency(data.cost)}`)
                                      lines.push(`전환값: ${formatCurrency(data.revenue)}`)
                                      break
                                    case 'cost':
                                      lines.push(`비용: ${formatCurrency(context.parsed.y || 0)}`)
                                      lines.push(`ROAS: ${roas.toFixed(1)}%`)
                                      break
                                    case 'revenue':
                                      lines.push(`전환값: ${formatCurrency(context.parsed.y || 0)}`)
                                      lines.push(`비용: ${formatCurrency(data.cost)}`)
                                      lines.push(`ROAS: ${roas.toFixed(1)}%`)
                                      break
                                    case 'conversions':
                                      lines.push(`전환수: ${data.conversions.toLocaleString()}건`)
                                      lines.push(`전환율: ${cvr.toFixed(2)}%`)
                                      break
                                    case 'impressions':
                                      lines.push(`노출수: ${data.impressions.toLocaleString()}회`)
                                      lines.push(`CTR: ${ctr.toFixed(2)}%`)
                                      break
                                    case 'clicks':
                                      lines.push(`클릭수: ${data.clicks.toLocaleString()}회`)
                                      lines.push(`CTR: ${ctr.toFixed(2)}%`)
                                      break
                                    case 'cpm':
                                      lines.push(`CPM: ${formatCurrency(context.parsed.y || 0)}`)
                                      lines.push(`노출수: ${data.impressions.toLocaleString()}회`)
                                      break
                                    case 'cpc':
                                      lines.push(`CPC: ${formatCurrency(context.parsed.y || 0)}`)
                                      lines.push(`클릭수: ${data.clicks.toLocaleString()}회`)
                                      break
                                    case 'cpa':
                                      lines.push(`CPA: ${formatCurrency(context.parsed.y || 0)}`)
                                      lines.push(`전환수: ${data.conversions.toLocaleString()}건`)
                                      break
                                    case 'ctr':
                                      lines.push(`CTR: ${(context.parsed.y || 0).toFixed(2)}%`)
                                      lines.push(`클릭수: ${data.clicks.toLocaleString()}회`)
                                      break
                                    case 'cvr':
                                      lines.push(`전환율: ${(context.parsed.y || 0).toFixed(2)}%`)
                                      lines.push(`전환수: ${data.conversions.toLocaleString()}건`)
                                      break
                                  }
                                  return lines
                                }
                              }
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: (() => {
                                  switch(currentTimeseriesMetric) {
                                    case 'roas': return 'ROAS (%)'
                                    case 'cost': return '비용 (원)'
                                    case 'revenue': return '전환값 (원)'
                                    case 'conversions': return '전환수 (건)'
                                    case 'impressions': return '노출수 (회)'
                                    case 'clicks': return '클릭수 (회)'
                                    case 'cpm': return 'CPM (원)'
                                    case 'cpc': return 'CPC (원)'
                                    case 'cpa': return 'CPA (원)'
                                    case 'ctr': return 'CTR (%)'
                                    case 'cvr': return '전환율 (%)'
                                    default: return '지표'
                                  }
                                })()
                              },
                              ticks: {
                                callback: function(value) {
                                  const numValue = typeof value === 'number' ? value : parseFloat(String(value))
                                  switch(currentTimeseriesMetric) {
                                    case 'roas':
                                    case 'ctr':
                                    case 'cvr':
                                      return numValue.toFixed(1) + '%'
                                    case 'cost':
                                    case 'revenue':
                                    case 'cpm':
                                    case 'cpc':
                                    case 'cpa':
                                      return formatCurrency(numValue)
                                    case 'conversions':
                                    case 'impressions':
                                    case 'clicks':
                                      return numValue.toLocaleString()
                                    default:
                                      return numValue
                                  }
                                }
                              }
                            },
                            x: {
                              title: { display: true, text: '기간' }
                            }
                          }
                        }}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#757575' }}>
                        {filteredTrendData.hasActiveFilters ? '필터 조건에 맞는 데이터가 없습니다' : '필터를 선택해주세요'}
                      </div>
                    )}
                  </div>

                  {/* 트렌드 분석 팁 */}
                  <div style={{ marginTop: 20, padding: 16, background: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8fc 100%)', borderRadius: 10, borderLeft: '4px solid #2196f3' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#2196f3', marginBottom: 8 }}>
                      💡 트렌드 분석 팁
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--grey-800)', lineHeight: 1.6 }}>
                      상승 추세를 보이는 광고세트는 예산을 확대하고, 하락 추세를 보이는 광고세트는 원인을 분석하여 개선하세요.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 탭 2: 성별 추이 - HTML 1:1 구현 */}
            {trendAnalysisTab === 'gender' && (
              <div>
                {/* 컴팩트 설명 섹션 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%)', borderRadius: 8, borderLeft: '4px solid #2196f3', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 16 }}>📊</span>
                      <strong style={{ color: '#1976d2', fontSize: 13 }}>이 분석의 목적</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#424242', lineHeight: 1.6 }}>
                      시간에 따른 <strong style={{ color: '#1565c0' }}>각 성별의 성과 변화</strong>를 추적하여<br />
                      타겟팅 전략을 최적화할 수 있습니다
                    </p>
                  </div>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: 8, borderLeft: '4px solid #4caf50', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 16 }}>💡</span>
                      <strong style={{ color: '#388e3c', fontSize: 13 }}>사용 방법</strong>
                    </div>
                    <div style={{ fontSize: 12, color: '#424242', lineHeight: 1.6 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>1</span>
                        <span>드롭다운에서 원하는 필터 선택</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>2</span>
                        <span>차트에서 추이 패턴 확인</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '2px solid var(--grey-200)', paddingBottom: 16 }}>
                    <div>
                      <div className="card-title" style={{ marginBottom: 4 }}>시간에 따른 성별 성과 추이</div>
                      <p style={{ color: 'var(--grey-600)', fontSize: 13, margin: 0 }}>시간에 따른 각 성별의 성과 변화를 추적하여 트렌드를 파악할 수 있습니다.</p>
                    </div>
                    <div className="view-type-section" style={{ marginBottom: 0 }}>
                      <button className={`view-btn ${currentGenderPeriod === 'monthly' ? 'active' : ''}`} onClick={() => setCurrentGenderPeriod('monthly')}>월별</button>
                      <button className={`view-btn ${currentGenderPeriod === 'weekly' ? 'active' : ''}`} onClick={() => setCurrentGenderPeriod('weekly')}>주별</button>
                      <button className={`view-btn ${currentGenderPeriod === 'daily' ? 'active' : ''}`} onClick={() => setCurrentGenderPeriod('daily')}>일별</button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 20 }}>
                    <div style={{ flex: '0 0 auto' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)', marginBottom: 12 }}>📈 지표 선택</div>
                      <select value={currentGenderMetric} onChange={(e) => setCurrentGenderMetric(e.target.value)} style={{ minWidth: 200, padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer' }}>
                        <option value="roas">ROAS</option><option value="cost">비용</option><option value="revenue">전환값</option><option value="conversions">전환수</option><option value="impressions">노출수</option><option value="clicks">클릭수</option><option value="cpm">CPM</option><option value="cpc">CPC</option><option value="cpa">CPA</option><option value="ctr">CTR</option><option value="cvr">전환율</option>
                      </select>
                    </div>
                    <div style={{ flex: '0 0 auto', marginLeft: 'auto' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)', marginBottom: 12 }}>📅 기간 선택</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="date" value={genderStartDate} onChange={(e) => setGenderStartDate(e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer' }} />
                        <span style={{ color: 'var(--grey-600)', fontWeight: 500 }}>~</span>
                        <input type="date" value={genderEndDate} onChange={(e) => setGenderEndDate(e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer' }} />
                      </div>
                    </div>
                  </div>

                  {/* 5개 필터 드롭다운 */}
                  <div style={{ marginBottom: 20, padding: 16, background: 'var(--grey-50)', borderRadius: 8, border: '1px solid var(--grey-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)' }}>📊 분류 기준</div>
                      <div style={{ fontSize: 12, color: '#2e7d32', fontWeight: 600 }}>🎯 <span>{filteredGenderData.gendersToShow.size}</span>개 성별</div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      {/* 채널별 */}
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, channel: !prev.channel, product: false, brand: false, promotion: false, adset: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                          <span style={{ fontWeight: 500 }}>{currentGenderFilters.channel.length === 0 ? '채널_전체' : currentGenderFilters.channel.length === genderFilterOptions.channels.length ? '채널_전체' : currentGenderFilters.channel.length === 1 ? currentGenderFilters.channel[0] : `${currentGenderFilters.channel[0]} 외`}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentGenderFilters.channel.length === 0 ? '' : currentGenderFilters.channel.length === genderFilterOptions.channels.length ? `(${currentGenderFilters.channel.length})` : currentGenderFilters.channel.length === 1 ? '' : `(${currentGenderFilters.channel.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span>
                        </button>
                        {trendDropdownOpen.channel && (
                          <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}>
                            <div style={{ padding: 8 }}>
                              <div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}>
                                <label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}>
                                  <input type="checkbox" checked={currentGenderFilters.channel.length === genderFilterOptions.channels.length && genderFilterOptions.channels.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentGenderFilters(prev => ({ ...prev, channel: [...genderFilterOptions.channels] })) } else { setCurrentGenderFilters(prev => ({ ...prev, channel: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택
                                </label>
                              </div>
                              {genderFilterOptions.channels.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentGenderFilters.channel.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentGenderFilters(prev => ({ ...prev, channel: [...prev.channel, item] })) } else { setCurrentGenderFilters(prev => ({ ...prev, channel: prev.channel.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* 제품별 */}
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, product: !prev.product, channel: false, brand: false, promotion: false, adset: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                          <span style={{ fontWeight: 500 }}>{currentGenderFilters.product.length === 0 ? '제품_전체' : currentGenderFilters.product.length === genderFilterOptions.products.length ? '제품_전체' : currentGenderFilters.product.length === 1 ? currentGenderFilters.product[0] : `${currentGenderFilters.product[0]} 외`}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentGenderFilters.product.length === 0 ? '' : currentGenderFilters.product.length === genderFilterOptions.products.length ? `(${currentGenderFilters.product.length})` : currentGenderFilters.product.length === 1 ? '' : `(${currentGenderFilters.product.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span>
                        </button>
                        {trendDropdownOpen.product && (
                          <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}>
                            <div style={{ padding: 8 }}>
                              <div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}>
                                <label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}>
                                  <input type="checkbox" checked={currentGenderFilters.product.length === genderFilterOptions.products.length && genderFilterOptions.products.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentGenderFilters(prev => ({ ...prev, product: [...genderFilterOptions.products] })) } else { setCurrentGenderFilters(prev => ({ ...prev, product: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택
                                </label>
                              </div>
                              {genderFilterOptions.products.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentGenderFilters.product.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentGenderFilters(prev => ({ ...prev, product: [...prev.product, item] })) } else { setCurrentGenderFilters(prev => ({ ...prev, product: prev.product.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* 브랜드별 */}
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, brand: !prev.brand, channel: false, product: false, promotion: false, adset: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                          <span style={{ fontWeight: 500 }}>{currentGenderFilters.brand.length === 0 ? '브랜드_전체' : currentGenderFilters.brand.length === genderFilterOptions.brands.length ? '브랜드_전체' : currentGenderFilters.brand.length === 1 ? currentGenderFilters.brand[0] : `${currentGenderFilters.brand[0]} 외`}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentGenderFilters.brand.length === 0 ? '' : currentGenderFilters.brand.length === genderFilterOptions.brands.length ? `(${currentGenderFilters.brand.length})` : currentGenderFilters.brand.length === 1 ? '' : `(${currentGenderFilters.brand.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span>
                        </button>
                        {trendDropdownOpen.brand && (
                          <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}>
                            <div style={{ padding: 8 }}>
                              <div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}>
                                <label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}>
                                  <input type="checkbox" checked={currentGenderFilters.brand.length === genderFilterOptions.brands.length && genderFilterOptions.brands.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentGenderFilters(prev => ({ ...prev, brand: [...genderFilterOptions.brands] })) } else { setCurrentGenderFilters(prev => ({ ...prev, brand: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택
                                </label>
                              </div>
                              {genderFilterOptions.brands.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentGenderFilters.brand.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentGenderFilters(prev => ({ ...prev, brand: [...prev.brand, item] })) } else { setCurrentGenderFilters(prev => ({ ...prev, brand: prev.brand.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* 프로모션별 */}
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, promotion: !prev.promotion, channel: false, product: false, brand: false, adset: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                          <span style={{ fontWeight: 500 }}>{currentGenderFilters.promotion.length === 0 ? '프로모션_전체' : currentGenderFilters.promotion.length === genderFilterOptions.promotions.length ? '프로모션_전체' : currentGenderFilters.promotion.length === 1 ? currentGenderFilters.promotion[0] : `${currentGenderFilters.promotion[0]} 외`}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentGenderFilters.promotion.length === 0 ? '' : currentGenderFilters.promotion.length === genderFilterOptions.promotions.length ? `(${currentGenderFilters.promotion.length})` : currentGenderFilters.promotion.length === 1 ? '' : `(${currentGenderFilters.promotion.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span>
                        </button>
                        {trendDropdownOpen.promotion && (
                          <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}>
                            <div style={{ padding: 8 }}>
                              <div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}>
                                <label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}>
                                  <input type="checkbox" checked={currentGenderFilters.promotion.length === genderFilterOptions.promotions.length && genderFilterOptions.promotions.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentGenderFilters(prev => ({ ...prev, promotion: [...genderFilterOptions.promotions] })) } else { setCurrentGenderFilters(prev => ({ ...prev, promotion: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택
                                </label>
                              </div>
                              {genderFilterOptions.promotions.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentGenderFilters.promotion.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentGenderFilters(prev => ({ ...prev, promotion: [...prev.promotion, item] })) } else { setCurrentGenderFilters(prev => ({ ...prev, promotion: prev.promotion.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* 광고세트별 */}
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, adset: !prev.adset, channel: false, product: false, brand: false, promotion: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                          <span style={{ fontWeight: 500 }}>{currentGenderFilters.adset.length === 0 ? '광고세트_전체' : currentGenderFilters.adset.length === genderFilterOptions.adsets.length ? '광고세트_전체' : currentGenderFilters.adset.length === 1 ? currentGenderFilters.adset[0] : `${currentGenderFilters.adset[0]} 외`}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentGenderFilters.adset.length === 0 ? '' : currentGenderFilters.adset.length === genderFilterOptions.adsets.length ? `(${currentGenderFilters.adset.length})` : currentGenderFilters.adset.length === 1 ? '' : `(${currentGenderFilters.adset.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span>
                        </button>
                        {trendDropdownOpen.adset && (
                          <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}>
                            <div style={{ padding: 8 }}>
                              <div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}>
                                <label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}>
                                  <input type="checkbox" checked={currentGenderFilters.adset.length === genderFilterOptions.adsets.length && genderFilterOptions.adsets.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentGenderFilters(prev => ({ ...prev, adset: [...genderFilterOptions.adsets] })) } else { setCurrentGenderFilters(prev => ({ ...prev, adset: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택
                                </label>
                              </div>
                              {genderFilterOptions.adsets.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentGenderFilters.adset.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentGenderFilters(prev => ({ ...prev, adset: [...prev.adset, item] })) } else { setCurrentGenderFilters(prev => ({ ...prev, adset: prev.adset.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Line 차트 */}
                  <div className="chart-container" style={{ position: 'relative', height: 350, marginBottom: 20 }}>
                    {filteredGenderData.chartData && filteredGenderData.chartData.datasets.length > 0 ? (
                      <Line data={filteredGenderData.chartData} options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: true, position: 'top' as const },
                          datalabels: { display: false },
                          tooltip: {
                            callbacks: {
                              label: function(context: { datasetIndex: number; dataIndex: number; parsed: { y: number | null } }) {
                                const genderArray = filteredGenderData.chartData?.genderArray || []
                                const gender = genderArray[context.datasetIndex]
                                const allPeriods = filteredGenderData.chartData?.labels || []
                                const period = allPeriods[context.dataIndex]
                                const aggregatedData = filteredGenderData.chartData?.aggregatedData || {}
                                const data = aggregatedData[gender]?.[period] || {}
                                const { cost = 0, revenue = 0, conversions = 0, impressions = 0, clicks = 0 } = data

                                const roas = cost > 0 ? (revenue / cost * 100) : 0
                                const ctr = impressions > 0 ? (clicks / impressions * 100) : 0
                                const cvr = clicks > 0 ? (conversions / clicks * 100) : 0

                                const lines: string[] = [`${getGenderDisplayName(gender) || gender}`]

                                switch(currentGenderMetric) {
                                  case 'roas':
                                    lines.push(`ROAS: ${roas.toFixed(1)}%`)
                                    lines.push(`비용: ${formatCurrency(cost)}`)
                                    lines.push(`전환값: ${formatCurrency(revenue)}`)
                                    break
                                  case 'cost':
                                    lines.push(`비용: ${formatCurrency(context.parsed.y || 0)}`)
                                    lines.push(`ROAS: ${roas.toFixed(1)}%`)
                                    break
                                  case 'revenue':
                                    lines.push(`전환값: ${formatCurrency(context.parsed.y || 0)}`)
                                    lines.push(`비용: ${formatCurrency(cost)}`)
                                    lines.push(`ROAS: ${roas.toFixed(1)}%`)
                                    break
                                  case 'conversions':
                                    lines.push(`전환수: ${conversions.toLocaleString()}건`)
                                    lines.push(`전환율: ${cvr.toFixed(2)}%`)
                                    break
                                  case 'impressions':
                                    lines.push(`노출수: ${impressions.toLocaleString()}회`)
                                    lines.push(`CTR: ${ctr.toFixed(2)}%`)
                                    break
                                  case 'clicks':
                                    lines.push(`클릭수: ${clicks.toLocaleString()}회`)
                                    lines.push(`CTR: ${ctr.toFixed(2)}%`)
                                    break
                                  case 'cpm':
                                    lines.push(`CPM: ${formatCurrency(context.parsed.y || 0)}`)
                                    lines.push(`노출수: ${impressions.toLocaleString()}회`)
                                    break
                                  case 'cpc':
                                    lines.push(`CPC: ${formatCurrency(context.parsed.y || 0)}`)
                                    lines.push(`클릭수: ${clicks.toLocaleString()}회`)
                                    break
                                  case 'cpa':
                                    lines.push(`CPA: ${formatCurrency(context.parsed.y || 0)}`)
                                    lines.push(`전환수: ${conversions.toLocaleString()}건`)
                                    break
                                  case 'ctr':
                                    lines.push(`CTR: ${(context.parsed.y || 0).toFixed(2)}%`)
                                    lines.push(`클릭수: ${clicks.toLocaleString()}회`)
                                    lines.push(`노출수: ${impressions.toLocaleString()}회`)
                                    break
                                  case 'cvr':
                                    lines.push(`전환율: ${(context.parsed.y || 0).toFixed(2)}%`)
                                    lines.push(`전환수: ${conversions.toLocaleString()}건`)
                                    lines.push(`클릭수: ${clicks.toLocaleString()}회`)
                                    break
                                }
                                return lines
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: (function() {
                                switch(currentGenderMetric) {
                                  case 'roas': return 'ROAS (%)'
                                  case 'cost': return '비용 (원)'
                                  case 'revenue': return '전환값 (원)'
                                  case 'conversions': return '전환수 (건)'
                                  case 'impressions': return '노출수 (회)'
                                  case 'clicks': return '클릭수 (회)'
                                  case 'cpm': return 'CPM (원)'
                                  case 'cpc': return 'CPC (원)'
                                  case 'cpa': return 'CPA (원)'
                                  case 'ctr': return 'CTR (%)'
                                  case 'cvr': return '전환율 (%)'
                                  default: return '지표'
                                }
                              })()
                            },
                            ticks: {
                              callback: function(value: number | string) {
                                const numValue = typeof value === 'string' ? parseFloat(value) : value
                                switch(currentGenderMetric) {
                                  case 'roas':
                                  case 'ctr':
                                  case 'cvr':
                                    return numValue.toFixed(1) + '%'
                                  case 'cost':
                                  case 'revenue':
                                  case 'cpm':
                                  case 'cpc':
                                  case 'cpa':
                                    return formatCurrency(numValue)
                                  case 'conversions':
                                  case 'impressions':
                                  case 'clicks':
                                    return numValue.toLocaleString()
                                  default:
                                    return value
                                }
                              }
                            }
                          },
                          x: {
                            title: { display: true, text: '기간' }
                          }
                        }
                      }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#757575' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>필터를 선택하여 차트를 확인하세요</div>
                        <div style={{ fontSize: 13, color: '#9e9e9e' }}>위 드롭다운에서 분류 기준을 선택하면 성별별 추이 차트가 표시됩니다</div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 20, padding: 16, background: 'linear-gradient(135deg, #fce4ec 0%, #fff5f7 100%)', borderRadius: 10, borderLeft: '4px solid #e91e63' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#c2185b', marginBottom: 8 }}>💡 성별 타겟팅 팁</div>
                    <div style={{ fontSize: 13, color: 'var(--grey-800)', lineHeight: 1.6 }}>성과가 좋은 성별에 예산을 집중하고, 성과가 저조한 성별은 소재나 메시지를 점검하세요.</div>
                  </div>
                </div>
              </div>
            )}

            {/* 탭 3: 연령 추이 - HTML 1:1 구현 */}
            {trendAnalysisTab === 'age' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%)', borderRadius: 8, borderLeft: '4px solid #2196f3', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>📊</span><strong style={{ color: '#1976d2', fontSize: 13 }}>이 분석의 목적</strong></div>
                    <p style={{ margin: 0, fontSize: 12, color: '#424242', lineHeight: 1.6 }}>시간에 따른 <strong style={{ color: '#1565c0' }}>각 연령대의 성과 변화</strong>를 추적하여<br />연령별 타겟팅 전략을 수립할 수 있습니다</p>
                  </div>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: 8, borderLeft: '4px solid #4caf50', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>💡</span><strong style={{ color: '#388e3c', fontSize: 13 }}>사용 방법</strong></div>
                    <div style={{ fontSize: 12, color: '#424242', lineHeight: 1.6 }}><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>1</span><span>드롭다운에서 원하는 필터 선택</span></div><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>2</span><span>차트에서 추이 패턴 확인</span></div></div>
                  </div>
                </div>
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '2px solid var(--grey-200)', paddingBottom: 16 }}>
                    <div><div className="card-title" style={{ marginBottom: 4 }}>시간에 따른 연령대별 성과 추이</div><p style={{ color: 'var(--grey-600)', fontSize: 13, margin: 0 }}>시간에 따른 각 연령대의 성과 변화를 추적하여 트렌드를 파악할 수 있습니다.</p></div>
                    <div className="view-type-section" style={{ marginBottom: 0 }}><button className={`view-btn ${currentAgePeriod === 'monthly' ? 'active' : ''}`} onClick={() => setCurrentAgePeriod('monthly')}>월별</button><button className={`view-btn ${currentAgePeriod === 'weekly' ? 'active' : ''}`} onClick={() => setCurrentAgePeriod('weekly')}>주별</button><button className={`view-btn ${currentAgePeriod === 'daily' ? 'active' : ''}`} onClick={() => setCurrentAgePeriod('daily')}>일별</button></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 20 }}>
                    <div style={{ flex: '0 0 auto' }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)', marginBottom: 12 }}>📈 지표 선택</div><select value={currentAgeMetric} onChange={(e) => setCurrentAgeMetric(e.target.value)} style={{ minWidth: 200, padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer' }}><option value="roas">ROAS</option><option value="cost">비용</option><option value="revenue">전환값</option><option value="conversions">전환수</option><option value="impressions">노출수</option><option value="clicks">클릭수</option><option value="cpm">CPM</option><option value="cpc">CPC</option><option value="cpa">CPA</option><option value="ctr">CTR</option><option value="cvr">전환율</option></select></div>
                    <div style={{ flex: '0 0 auto', marginLeft: 'auto' }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)', marginBottom: 12 }}>📅 기간 선택</div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><input type="date" value={ageStartDate} onChange={(e) => setAgeStartDate(e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer' }} /><span style={{ color: 'var(--grey-600)', fontWeight: 500 }}>~</span><input type="date" value={ageEndDate} onChange={(e) => setAgeEndDate(e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer' }} /></div></div>
                  </div>
                  <div style={{ marginBottom: 20, padding: 16, background: 'var(--grey-50)', borderRadius: 8, border: '1px solid var(--grey-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)' }}>📊 분류 기준</div><div style={{ fontSize: 12, color: '#2e7d32', fontWeight: 600 }}>🎯 <span>{filteredAgeData.agesToShow.size}</span>개 연령</div></div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}><button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, channel: !prev.channel, product: false, brand: false, promotion: false, adset: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}><span style={{ fontWeight: 500 }}>{currentAgeFilters.channel.length === 0 ? '채널_전체' : currentAgeFilters.channel.length === ageFilterOptions.channels.length ? '채널_전체' : currentAgeFilters.channel.length === 1 ? currentAgeFilters.channel[0] : `${currentAgeFilters.channel[0]} 외`}</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentAgeFilters.channel.length === 0 ? '' : currentAgeFilters.channel.length === ageFilterOptions.channels.length ? `(${currentAgeFilters.channel.length})` : currentAgeFilters.channel.length === 1 ? '' : `(${currentAgeFilters.channel.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span></button>{trendDropdownOpen.channel && (<div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}><div style={{ padding: 8 }}><div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}><label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentAgeFilters.channel.length === ageFilterOptions.channels.length && ageFilterOptions.channels.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentAgeFilters(prev => ({ ...prev, channel: [...ageFilterOptions.channels] })) } else { setCurrentAgeFilters(prev => ({ ...prev, channel: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택</label></div>{ageFilterOptions.channels.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentAgeFilters.channel.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentAgeFilters(prev => ({ ...prev, channel: [...prev.channel, item] })) } else { setCurrentAgeFilters(prev => ({ ...prev, channel: prev.channel.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}</div></div>)}</div>
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}><button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, product: !prev.product, channel: false, brand: false, promotion: false, adset: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}><span style={{ fontWeight: 500 }}>{currentAgeFilters.product.length === 0 ? '제품_전체' : currentAgeFilters.product.length === ageFilterOptions.products.length ? '제품_전체' : currentAgeFilters.product.length === 1 ? currentAgeFilters.product[0] : `${currentAgeFilters.product[0]} 외`}</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentAgeFilters.product.length === 0 ? '' : currentAgeFilters.product.length === ageFilterOptions.products.length ? `(${currentAgeFilters.product.length})` : currentAgeFilters.product.length === 1 ? '' : `(${currentAgeFilters.product.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span></button>{trendDropdownOpen.product && (<div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}><div style={{ padding: 8 }}><div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}><label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentAgeFilters.product.length === ageFilterOptions.products.length && ageFilterOptions.products.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentAgeFilters(prev => ({ ...prev, product: [...ageFilterOptions.products] })) } else { setCurrentAgeFilters(prev => ({ ...prev, product: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택</label></div>{ageFilterOptions.products.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentAgeFilters.product.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentAgeFilters(prev => ({ ...prev, product: [...prev.product, item] })) } else { setCurrentAgeFilters(prev => ({ ...prev, product: prev.product.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}</div></div>)}</div>
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}><button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, brand: !prev.brand, channel: false, product: false, promotion: false, adset: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}><span style={{ fontWeight: 500 }}>{currentAgeFilters.brand.length === 0 ? '브랜드_전체' : currentAgeFilters.brand.length === ageFilterOptions.brands.length ? '브랜드_전체' : currentAgeFilters.brand.length === 1 ? currentAgeFilters.brand[0] : `${currentAgeFilters.brand[0]} 외`}</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentAgeFilters.brand.length === 0 ? '' : currentAgeFilters.brand.length === ageFilterOptions.brands.length ? `(${currentAgeFilters.brand.length})` : currentAgeFilters.brand.length === 1 ? '' : `(${currentAgeFilters.brand.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span></button>{trendDropdownOpen.brand && (<div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}><div style={{ padding: 8 }}><div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}><label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentAgeFilters.brand.length === ageFilterOptions.brands.length && ageFilterOptions.brands.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentAgeFilters(prev => ({ ...prev, brand: [...ageFilterOptions.brands] })) } else { setCurrentAgeFilters(prev => ({ ...prev, brand: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택</label></div>{ageFilterOptions.brands.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentAgeFilters.brand.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentAgeFilters(prev => ({ ...prev, brand: [...prev.brand, item] })) } else { setCurrentAgeFilters(prev => ({ ...prev, brand: prev.brand.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}</div></div>)}</div>
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}><button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, promotion: !prev.promotion, channel: false, product: false, brand: false, adset: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}><span style={{ fontWeight: 500 }}>{currentAgeFilters.promotion.length === 0 ? '프로모션_전체' : currentAgeFilters.promotion.length === ageFilterOptions.promotions.length ? '프로모션_전체' : currentAgeFilters.promotion.length === 1 ? currentAgeFilters.promotion[0] : `${currentAgeFilters.promotion[0]} 외`}</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentAgeFilters.promotion.length === 0 ? '' : currentAgeFilters.promotion.length === ageFilterOptions.promotions.length ? `(${currentAgeFilters.promotion.length})` : currentAgeFilters.promotion.length === 1 ? '' : `(${currentAgeFilters.promotion.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span></button>{trendDropdownOpen.promotion && (<div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}><div style={{ padding: 8 }}><div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}><label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentAgeFilters.promotion.length === ageFilterOptions.promotions.length && ageFilterOptions.promotions.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentAgeFilters(prev => ({ ...prev, promotion: [...ageFilterOptions.promotions] })) } else { setCurrentAgeFilters(prev => ({ ...prev, promotion: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택</label></div>{ageFilterOptions.promotions.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentAgeFilters.promotion.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentAgeFilters(prev => ({ ...prev, promotion: [...prev.promotion, item] })) } else { setCurrentAgeFilters(prev => ({ ...prev, promotion: prev.promotion.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}</div></div>)}</div>
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}><button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, adset: !prev.adset, channel: false, product: false, brand: false, promotion: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}><span style={{ fontWeight: 500 }}>{currentAgeFilters.adset.length === 0 ? '광고세트_전체' : currentAgeFilters.adset.length === ageFilterOptions.adsets.length ? '광고세트_전체' : currentAgeFilters.adset.length === 1 ? currentAgeFilters.adset[0] : `${currentAgeFilters.adset[0]} 외`}</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentAgeFilters.adset.length === 0 ? '' : currentAgeFilters.adset.length === ageFilterOptions.adsets.length ? `(${currentAgeFilters.adset.length})` : currentAgeFilters.adset.length === 1 ? '' : `(${currentAgeFilters.adset.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span></button>{trendDropdownOpen.adset && (<div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}><div style={{ padding: 8 }}><div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}><label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentAgeFilters.adset.length === ageFilterOptions.adsets.length && ageFilterOptions.adsets.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentAgeFilters(prev => ({ ...prev, adset: [...ageFilterOptions.adsets] })) } else { setCurrentAgeFilters(prev => ({ ...prev, adset: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택</label></div>{ageFilterOptions.adsets.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentAgeFilters.adset.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentAgeFilters(prev => ({ ...prev, adset: [...prev.adset, item] })) } else { setCurrentAgeFilters(prev => ({ ...prev, adset: prev.adset.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}</div></div>)}</div>
                    </div>
                  </div>
                  <div className="chart-container" style={{ position: 'relative', height: 350, marginBottom: 20 }}>
                    {filteredAgeData.chartData && filteredAgeData.chartData.datasets.length > 0 ? (<Line data={filteredAgeData.chartData} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: true, position: 'top' as const },
                        datalabels: { display: false },
                        tooltip: {
                          callbacks: {
                            label: function(context: { datasetIndex: number; dataIndex: number; parsed: { y: number | null } }) {
                              const ageArray = Array.from(filteredAgeData.agesToShow).sort()
                              const allPeriods = filteredAgeData.chartData?.labels || []
                              const age = ageArray[context.datasetIndex]
                              const period = allPeriods[context.dataIndex]
                              const data = filteredAgeData.chartData?.aggregatedData?.[age]?.[period] || { cost: 0, revenue: 0, conversions: 0, impressions: 0, clicks: 0 }
                              const { cost = 0, revenue = 0, conversions = 0, impressions = 0, clicks = 0 } = data
                              const roas = cost > 0 ? (revenue / cost * 100) : 0
                              const ctr = impressions > 0 ? (clicks / impressions * 100) : 0
                              const cvr = clicks > 0 ? (conversions / clicks * 100) : 0
                              const lines = [`${age}`]
                              switch(currentAgeMetric) {
                                case 'roas':
                                  lines.push(`ROAS: ${roas.toFixed(1)}%`)
                                  lines.push(`비용: ${formatCurrency(cost)}`)
                                  lines.push(`전환값: ${formatCurrency(revenue)}`)
                                  break
                                case 'cost':
                                  lines.push(`비용: ${formatCurrency(context.parsed.y || 0)}`)
                                  lines.push(`ROAS: ${roas.toFixed(1)}%`)
                                  break
                                case 'revenue':
                                  lines.push(`전환값: ${formatCurrency(context.parsed.y || 0)}`)
                                  lines.push(`비용: ${formatCurrency(cost)}`)
                                  lines.push(`ROAS: ${roas.toFixed(1)}%`)
                                  break
                                case 'conversions':
                                  lines.push(`전환수: ${conversions.toLocaleString()}건`)
                                  lines.push(`전환율: ${cvr.toFixed(2)}%`)
                                  break
                                case 'impressions':
                                  lines.push(`노출수: ${impressions.toLocaleString()}회`)
                                  lines.push(`CTR: ${ctr.toFixed(2)}%`)
                                  break
                                case 'clicks':
                                  lines.push(`클릭수: ${clicks.toLocaleString()}회`)
                                  lines.push(`CTR: ${ctr.toFixed(2)}%`)
                                  break
                                case 'cpm':
                                  lines.push(`CPM: ${formatCurrency(context.parsed.y || 0)}`)
                                  lines.push(`노출수: ${impressions.toLocaleString()}회`)
                                  break
                                case 'cpc':
                                  lines.push(`CPC: ${formatCurrency(context.parsed.y || 0)}`)
                                  lines.push(`클릭수: ${clicks.toLocaleString()}회`)
                                  break
                                case 'cpa':
                                  lines.push(`CPA: ${formatCurrency(context.parsed.y || 0)}`)
                                  lines.push(`전환수: ${conversions.toLocaleString()}건`)
                                  break
                                case 'ctr':
                                  lines.push(`CTR: ${(context.parsed.y || 0).toFixed(2)}%`)
                                  lines.push(`클릭수: ${clicks.toLocaleString()}회`)
                                  lines.push(`노출수: ${impressions.toLocaleString()}회`)
                                  break
                                case 'cvr':
                                  lines.push(`전환율: ${(context.parsed.y || 0).toFixed(2)}%`)
                                  lines.push(`전환수: ${conversions.toLocaleString()}건`)
                                  lines.push(`클릭수: ${clicks.toLocaleString()}회`)
                                  break
                              }
                              return lines
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: (() => {
                              switch(currentAgeMetric) {
                                case 'roas': return 'ROAS (%)'
                                case 'cost': return '비용 (원)'
                                case 'revenue': return '전환값 (원)'
                                case 'conversions': return '전환수 (건)'
                                case 'impressions': return '노출수 (회)'
                                case 'clicks': return '클릭수 (회)'
                                case 'cpm': return 'CPM (원)'
                                case 'cpc': return 'CPC (원)'
                                case 'cpa': return 'CPA (원)'
                                case 'ctr': return 'CTR (%)'
                                case 'cvr': return '전환율 (%)'
                                default: return '지표'
                              }
                            })()
                          },
                          ticks: {
                            callback: function(value: string | number) {
                              const numValue = typeof value === 'number' ? value : parseFloat(String(value))
                              switch(currentAgeMetric) {
                                case 'roas':
                                case 'ctr':
                                case 'cvr':
                                  return numValue.toFixed(1) + '%'
                                case 'cost':
                                case 'revenue':
                                case 'cpm':
                                case 'cpc':
                                case 'cpa':
                                  return formatCurrency(numValue)
                                case 'conversions':
                                case 'impressions':
                                case 'clicks':
                                  return numValue.toLocaleString()
                                default:
                                  return value
                              }
                            }
                          }
                        },
                        x: {
                          title: { display: true, text: '기간' }
                        }
                      }
                    }} />) : (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#757575' }}><div style={{ fontSize: 48, marginBottom: 16 }}>📊</div><div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>필터를 선택하여 차트를 확인하세요</div><div style={{ fontSize: 13, color: '#9e9e9e' }}>위 드롭다운에서 분류 기준을 선택하면 연령별 추이 차트가 표시됩니다</div></div>)}
                  </div>
                  <div style={{ marginTop: 20, padding: 16, background: 'linear-gradient(135deg, #fff3e0 0%, #fffde7 100%)', borderRadius: 10, borderLeft: '4px solid #ff9800' }}><div style={{ fontSize: 13, fontWeight: 600, color: '#ef6c00', marginBottom: 8 }}>💡 연령대 타겟팅 팁</div><div style={{ fontSize: 13, color: 'var(--grey-800)', lineHeight: 1.6 }}>성과가 좋은 연령대에 예산을 집중하고, MZ세대와 시니어층의 특성에 맞는 메시지를 사용하세요.</div></div>
                </div>
              </div>
            )}

            {/* 탭 4: 플랫폼 추이 - HTML 1:1 구현 */}
            {trendAnalysisTab === 'platform' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%)', borderRadius: 8, borderLeft: '4px solid #2196f3', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>📊</span><strong style={{ color: '#1976d2', fontSize: 13 }}>이 분석의 목적</strong></div><p style={{ margin: 0, fontSize: 12, color: '#424242', lineHeight: 1.6 }}>시간에 따른 <strong style={{ color: '#1565c0' }}>각 플랫폼의 성과 변화</strong>를 추적하여<br />플랫폼별 예산 배분을 최적화할 수 있습니다</p></div>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: 8, borderLeft: '4px solid #4caf50', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>💡</span><strong style={{ color: '#388e3c', fontSize: 13 }}>사용 방법</strong></div><div style={{ fontSize: 12, color: '#424242', lineHeight: 1.6 }}><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>1</span><span>드롭다운에서 원하는 필터 선택</span></div><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>2</span><span>차트에서 추이 패턴 확인</span></div></div></div>
                </div>
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '2px solid var(--grey-200)', paddingBottom: 16 }}><div><div className="card-title" style={{ marginBottom: 4 }}>시간에 따른 플랫폼별 성과 추이</div><p style={{ color: 'var(--grey-600)', fontSize: 13, margin: 0 }}>시간에 따른 각 플랫폼의 성과 변화를 추적하여 트렌드를 파악할 수 있습니다.</p></div><div className="view-type-section" style={{ marginBottom: 0 }}><button className={`view-btn ${currentPlatformPeriod === 'monthly' ? 'active' : ''}`} onClick={() => setCurrentPlatformPeriod('monthly')}>월별</button><button className={`view-btn ${currentPlatformPeriod === 'weekly' ? 'active' : ''}`} onClick={() => setCurrentPlatformPeriod('weekly')}>주별</button><button className={`view-btn ${currentPlatformPeriod === 'daily' ? 'active' : ''}`} onClick={() => setCurrentPlatformPeriod('daily')}>일별</button></div></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 20 }}><div style={{ flex: '0 0 auto' }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)', marginBottom: 12 }}>📈 지표 선택</div><select value={currentPlatformMetric} onChange={(e) => setCurrentPlatformMetric(e.target.value)} style={{ minWidth: 200, padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer' }}><option value="roas">ROAS</option><option value="cost">비용</option><option value="revenue">전환값</option><option value="conversions">전환수</option><option value="impressions">노출수</option><option value="clicks">클릭수</option><option value="cpm">CPM</option><option value="cpc">CPC</option><option value="cpa">CPA</option><option value="ctr">CTR</option><option value="cvr">전환율</option></select></div><div style={{ flex: '0 0 auto', marginLeft: 'auto' }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)', marginBottom: 12 }}>📅 기간 선택</div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><input type="date" value={platformStartDate} onChange={(e) => setPlatformStartDate(e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer' }} /><span style={{ color: 'var(--grey-600)', fontWeight: 500 }}>~</span><input type="date" value={platformEndDate} onChange={(e) => setPlatformEndDate(e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer' }} /></div></div></div>
                  <div style={{ marginBottom: 20, padding: 16, background: 'var(--grey-50)', borderRadius: 8, border: '1px solid var(--grey-200)' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)' }}>📊 분류 기준</div><div style={{ fontSize: 12, color: '#2e7d32', fontWeight: 600 }}>🎯 <span>{filteredPlatformData.platformsToShow.size}</span>개 플랫폼</div></div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}><button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, channel: !prev.channel, product: false, brand: false, promotion: false, adset: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}><span style={{ fontWeight: 500 }}>{currentPlatformFilters.channel.length === 0 ? '채널_전체' : currentPlatformFilters.channel.length === platformFilterOptions.channels.length ? '채널_전체' : currentPlatformFilters.channel.length === 1 ? currentPlatformFilters.channel[0] : `${currentPlatformFilters.channel[0]} 외`}</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentPlatformFilters.channel.length === 0 ? '' : currentPlatformFilters.channel.length === platformFilterOptions.channels.length ? `(${currentPlatformFilters.channel.length})` : currentPlatformFilters.channel.length === 1 ? '' : `(${currentPlatformFilters.channel.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span></button>{trendDropdownOpen.channel && (<div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}><div style={{ padding: 8 }}><div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}><label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentPlatformFilters.channel.length === platformFilterOptions.channels.length && platformFilterOptions.channels.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentPlatformFilters(prev => ({ ...prev, channel: [...platformFilterOptions.channels] })) } else { setCurrentPlatformFilters(prev => ({ ...prev, channel: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택</label></div>{platformFilterOptions.channels.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentPlatformFilters.channel.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentPlatformFilters(prev => ({ ...prev, channel: [...prev.channel, item] })) } else { setCurrentPlatformFilters(prev => ({ ...prev, channel: prev.channel.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}</div></div>)}</div>
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}><button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, product: !prev.product, channel: false, brand: false, promotion: false, adset: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}><span style={{ fontWeight: 500 }}>{currentPlatformFilters.product.length === 0 ? '제품_전체' : currentPlatformFilters.product.length === platformFilterOptions.products.length ? '제품_전체' : currentPlatformFilters.product.length === 1 ? currentPlatformFilters.product[0] : `${currentPlatformFilters.product[0]} 외`}</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentPlatformFilters.product.length === 0 ? '' : currentPlatformFilters.product.length === platformFilterOptions.products.length ? `(${currentPlatformFilters.product.length})` : currentPlatformFilters.product.length === 1 ? '' : `(${currentPlatformFilters.product.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span></button>{trendDropdownOpen.product && (<div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}><div style={{ padding: 8 }}><div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}><label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentPlatformFilters.product.length === platformFilterOptions.products.length && platformFilterOptions.products.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentPlatformFilters(prev => ({ ...prev, product: [...platformFilterOptions.products] })) } else { setCurrentPlatformFilters(prev => ({ ...prev, product: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택</label></div>{platformFilterOptions.products.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentPlatformFilters.product.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentPlatformFilters(prev => ({ ...prev, product: [...prev.product, item] })) } else { setCurrentPlatformFilters(prev => ({ ...prev, product: prev.product.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}</div></div>)}</div>
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}><button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, brand: !prev.brand, channel: false, product: false, promotion: false, adset: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}><span style={{ fontWeight: 500 }}>{currentPlatformFilters.brand.length === 0 ? '브랜드_전체' : currentPlatformFilters.brand.length === platformFilterOptions.brands.length ? '브랜드_전체' : currentPlatformFilters.brand.length === 1 ? currentPlatformFilters.brand[0] : `${currentPlatformFilters.brand[0]} 외`}</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentPlatformFilters.brand.length === 0 ? '' : currentPlatformFilters.brand.length === platformFilterOptions.brands.length ? `(${currentPlatformFilters.brand.length})` : currentPlatformFilters.brand.length === 1 ? '' : `(${currentPlatformFilters.brand.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span></button>{trendDropdownOpen.brand && (<div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}><div style={{ padding: 8 }}><div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}><label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentPlatformFilters.brand.length === platformFilterOptions.brands.length && platformFilterOptions.brands.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentPlatformFilters(prev => ({ ...prev, brand: [...platformFilterOptions.brands] })) } else { setCurrentPlatformFilters(prev => ({ ...prev, brand: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택</label></div>{platformFilterOptions.brands.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentPlatformFilters.brand.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentPlatformFilters(prev => ({ ...prev, brand: [...prev.brand, item] })) } else { setCurrentPlatformFilters(prev => ({ ...prev, brand: prev.brand.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}</div></div>)}</div>
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}><button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, promotion: !prev.promotion, channel: false, product: false, brand: false, adset: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}><span style={{ fontWeight: 500 }}>{currentPlatformFilters.promotion.length === 0 ? '프로모션_전체' : currentPlatformFilters.promotion.length === platformFilterOptions.promotions.length ? '프로모션_전체' : currentPlatformFilters.promotion.length === 1 ? currentPlatformFilters.promotion[0] : `${currentPlatformFilters.promotion[0]} 외`}</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentPlatformFilters.promotion.length === 0 ? '' : currentPlatformFilters.promotion.length === platformFilterOptions.promotions.length ? `(${currentPlatformFilters.promotion.length})` : currentPlatformFilters.promotion.length === 1 ? '' : `(${currentPlatformFilters.promotion.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span></button>{trendDropdownOpen.promotion && (<div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}><div style={{ padding: 8 }}><div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}><label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentPlatformFilters.promotion.length === platformFilterOptions.promotions.length && platformFilterOptions.promotions.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentPlatformFilters(prev => ({ ...prev, promotion: [...platformFilterOptions.promotions] })) } else { setCurrentPlatformFilters(prev => ({ ...prev, promotion: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택</label></div>{platformFilterOptions.promotions.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentPlatformFilters.promotion.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentPlatformFilters(prev => ({ ...prev, promotion: [...prev.promotion, item] })) } else { setCurrentPlatformFilters(prev => ({ ...prev, promotion: prev.promotion.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}</div></div>)}</div>
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}><button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, adset: !prev.adset, channel: false, product: false, brand: false, promotion: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}><span style={{ fontWeight: 500 }}>{currentPlatformFilters.adset.length === 0 ? '광고세트_전체' : currentPlatformFilters.adset.length === platformFilterOptions.adsets.length ? '광고세트_전체' : currentPlatformFilters.adset.length === 1 ? currentPlatformFilters.adset[0] : `${currentPlatformFilters.adset[0]} 외`}</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentPlatformFilters.adset.length === 0 ? '' : currentPlatformFilters.adset.length === platformFilterOptions.adsets.length ? `(${currentPlatformFilters.adset.length})` : currentPlatformFilters.adset.length === 1 ? '' : `(${currentPlatformFilters.adset.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span></button>{trendDropdownOpen.adset && (<div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}><div style={{ padding: 8 }}><div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}><label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentPlatformFilters.adset.length === platformFilterOptions.adsets.length && platformFilterOptions.adsets.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentPlatformFilters(prev => ({ ...prev, adset: [...platformFilterOptions.adsets] })) } else { setCurrentPlatformFilters(prev => ({ ...prev, adset: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택</label></div>{platformFilterOptions.adsets.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentPlatformFilters.adset.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentPlatformFilters(prev => ({ ...prev, adset: [...prev.adset, item] })) } else { setCurrentPlatformFilters(prev => ({ ...prev, adset: prev.adset.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}</div></div>)}</div>
                    </div>
                  </div>
                  <div className="chart-container" style={{ position: 'relative', height: 350, marginBottom: 20 }}>{filteredPlatformData.chartData && filteredPlatformData.chartData.datasets.length > 0 ? (<Line data={filteredPlatformData.chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'top' as const }, datalabels: { display: false }, tooltip: { callbacks: { label: function(context: any) { const platformArray = filteredPlatformData.chartData?.platformArray || []; const allPeriods = filteredPlatformData.chartData?.labels || []; const aggregatedData = filteredPlatformData.chartData?.aggregatedData || {}; const platform = platformArray[context.datasetIndex]; const period = allPeriods[context.dataIndex]; const data = aggregatedData[platform]?.[period] || {}; const { cost = 0, revenue = 0, conversions = 0, impressions = 0, clicks = 0 } = data; const roas = cost > 0 ? (revenue / cost * 100) : 0; const cpm = impressions > 0 ? (cost / impressions * 1000) : 0; const cpc = clicks > 0 ? (cost / clicks) : 0; const cpa = conversions > 0 ? (cost / conversions) : 0; const ctr = impressions > 0 ? (clicks / impressions * 100) : 0; const cvr = clicks > 0 ? (conversions / clicks * 100) : 0; const lines = [`${platform}`]; switch(currentPlatformMetric) { case 'roas': lines.push(`ROAS: ${roas.toFixed(1)}%`); lines.push(`비용: ${formatCurrency(cost)}`); lines.push(`전환값: ${formatCurrency(revenue)}`); break; case 'cost': lines.push(`비용: ${formatCurrency(context.parsed.y)}`); lines.push(`ROAS: ${roas.toFixed(1)}%`); break; case 'revenue': lines.push(`전환값: ${formatCurrency(context.parsed.y)}`); lines.push(`비용: ${formatCurrency(cost)}`); lines.push(`ROAS: ${roas.toFixed(1)}%`); break; case 'conversions': lines.push(`전환수: ${conversions.toLocaleString()}건`); lines.push(`전환율: ${cvr.toFixed(2)}%`); break; case 'impressions': lines.push(`노출수: ${impressions.toLocaleString()}회`); lines.push(`CTR: ${ctr.toFixed(2)}%`); break; case 'clicks': lines.push(`클릭수: ${clicks.toLocaleString()}회`); lines.push(`CTR: ${ctr.toFixed(2)}%`); break; case 'cpm': lines.push(`CPM: ${formatCurrency(context.parsed.y)}`); lines.push(`노출수: ${impressions.toLocaleString()}회`); break; case 'cpc': lines.push(`CPC: ${formatCurrency(context.parsed.y)}`); lines.push(`클릭수: ${clicks.toLocaleString()}회`); break; case 'cpa': lines.push(`CPA: ${formatCurrency(context.parsed.y)}`); lines.push(`전환수: ${conversions.toLocaleString()}건`); break; case 'ctr': lines.push(`CTR: ${context.parsed.y.toFixed(2)}%`); lines.push(`클릭수: ${clicks.toLocaleString()}회`); lines.push(`노출수: ${impressions.toLocaleString()}회`); break; case 'cvr': lines.push(`전환율: ${context.parsed.y.toFixed(2)}%`); lines.push(`전환수: ${conversions.toLocaleString()}건`); lines.push(`클릭수: ${clicks.toLocaleString()}회`); break; } return lines; } } } }, scales: { y: { beginAtZero: true, title: { display: true, text: (() => { switch(currentPlatformMetric) { case 'roas': return 'ROAS (%)'; case 'cost': return '비용 (원)'; case 'revenue': return '전환값 (원)'; case 'conversions': return '전환수 (건)'; case 'impressions': return '노출수 (회)'; case 'clicks': return '클릭수 (회)'; case 'cpm': return 'CPM (원)'; case 'cpc': return 'CPC (원)'; case 'cpa': return 'CPA (원)'; case 'ctr': return 'CTR (%)'; case 'cvr': return '전환율 (%)'; default: return '지표'; } })() }, ticks: { callback: function(value: any) { switch(currentPlatformMetric) { case 'roas': case 'ctr': case 'cvr': return value.toFixed(1) + '%'; case 'cost': case 'revenue': case 'cpm': case 'cpc': case 'cpa': return formatCurrency(value); case 'conversions': case 'impressions': case 'clicks': return value.toLocaleString(); default: return value; } } } }, x: { title: { display: true, text: '기간' } } } }} />) : (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#757575' }}><div style={{ fontSize: 48, marginBottom: 16 }}>📊</div><div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>필터를 선택하여 차트를 확인하세요</div><div style={{ fontSize: 13, color: '#9e9e9e' }}>위 드롭다운에서 분류 기준을 선택하면 플랫폼별 추이 차트가 표시됩니다</div></div>)}</div>
                  <div style={{ marginTop: 20, padding: 16, background: 'linear-gradient(135deg, #ede7f6 0%, #f3e5f5 100%)', borderRadius: 10, borderLeft: '4px solid #673ab7' }}><div style={{ fontSize: 13, fontWeight: 600, color: '#512da8', marginBottom: 8 }}>💡 플랫폼 최적화 팁</div><div style={{ fontSize: 13, color: 'var(--grey-800)', lineHeight: 1.6 }}>성과가 좋은 플랫폼에 예산을 집중하고, 각 플랫폼 특성에 맞는 광고 소재를 준비하세요.</div></div>
                </div>
              </div>
            )}

            {/* 탭 5: 기기플랫폼 추이 - HTML 1:1 구현 */}
            {trendAnalysisTab === 'devicePlatform' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%)', borderRadius: 8, borderLeft: '4px solid #2196f3', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>📊</span><strong style={{ color: '#1976d2', fontSize: 13 }}>이 분석의 목적</strong></div><p style={{ margin: 0, fontSize: 12, color: '#424242', lineHeight: 1.6 }}>시간에 따른 <strong style={{ color: '#1565c0' }}>기기플랫폼별 성과 변화</strong>를 추적하여<br />기기별 최적화 전략을 수립할 수 있습니다</p></div>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: 8, borderLeft: '4px solid #4caf50', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>💡</span><strong style={{ color: '#388e3c', fontSize: 13 }}>사용 방법</strong></div><div style={{ fontSize: 12, color: '#424242', lineHeight: 1.6 }}><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>1</span><span>드롭다운에서 원하는 필터 선택</span></div><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>2</span><span>차트에서 추이 패턴 확인</span></div></div></div>
                </div>
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '2px solid var(--grey-200)', paddingBottom: 16 }}><div><div className="card-title" style={{ marginBottom: 4 }}>시간에 따른 기기플랫폼별 성과 추이</div><p style={{ color: 'var(--grey-600)', fontSize: 13, margin: 0 }}>시간에 따른 각 기기플랫폼의 성과 변화를 추적하여 트렌드를 파악할 수 있습니다.</p></div><div className="view-type-section" style={{ marginBottom: 0 }}><button className={`view-btn ${currentDevicePlatformPeriod === 'monthly' ? 'active' : ''}`} onClick={() => setCurrentDevicePlatformPeriod('monthly')}>월별</button><button className={`view-btn ${currentDevicePlatformPeriod === 'weekly' ? 'active' : ''}`} onClick={() => setCurrentDevicePlatformPeriod('weekly')}>주별</button><button className={`view-btn ${currentDevicePlatformPeriod === 'daily' ? 'active' : ''}`} onClick={() => setCurrentDevicePlatformPeriod('daily')}>일별</button></div></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 20 }}><div style={{ flex: '0 0 auto' }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)', marginBottom: 12 }}>📈 지표 선택</div><select value={currentDevicePlatformMetric} onChange={(e) => setCurrentDevicePlatformMetric(e.target.value)} style={{ minWidth: 200, padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer' }}><option value="roas">ROAS</option><option value="cost">비용</option><option value="revenue">전환값</option><option value="conversions">전환수</option><option value="impressions">노출수</option><option value="clicks">클릭수</option><option value="cpm">CPM</option><option value="cpc">CPC</option><option value="cpa">CPA</option><option value="ctr">CTR</option><option value="cvr">전환율</option></select></div><div style={{ flex: '0 0 auto', marginLeft: 'auto' }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)', marginBottom: 12 }}>📅 기간 선택</div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><input type="date" value={devicePlatformStartDate} onChange={(e) => setDevicePlatformStartDate(e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer' }} /><span style={{ color: 'var(--grey-600)', fontWeight: 500 }}>~</span><input type="date" value={devicePlatformEndDate} onChange={(e) => setDevicePlatformEndDate(e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer' }} /></div></div></div>
                  <div style={{ marginBottom: 20, padding: 16, background: 'var(--grey-50)', borderRadius: 8, border: '1px solid var(--grey-200)' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)' }}>📊 분류 기준</div><div style={{ fontSize: 12, color: '#2e7d32', fontWeight: 600 }}>🎯 <span>{filteredDevicePlatformData.devicePlatformsToShow.size}</span>개 기기플랫폼</div></div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}><button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, channel: !prev.channel, product: false, brand: false, promotion: false, adset: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}><span style={{ fontWeight: 500 }}>{currentDevicePlatformFilters.channel.length === 0 ? '채널_전체' : currentDevicePlatformFilters.channel.length === devicePlatformFilterOptions.channels.length ? '채널_전체' : currentDevicePlatformFilters.channel.length === 1 ? currentDevicePlatformFilters.channel[0] : `${currentDevicePlatformFilters.channel[0]} 외`}</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentDevicePlatformFilters.channel.length === 0 ? '' : currentDevicePlatformFilters.channel.length === devicePlatformFilterOptions.channels.length ? `(${currentDevicePlatformFilters.channel.length})` : currentDevicePlatformFilters.channel.length === 1 ? '' : `(${currentDevicePlatformFilters.channel.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span></button>{trendDropdownOpen.channel && (<div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}><div style={{ padding: 8 }}><div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}><label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentDevicePlatformFilters.channel.length === devicePlatformFilterOptions.channels.length && devicePlatformFilterOptions.channels.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentDevicePlatformFilters(prev => ({ ...prev, channel: [...devicePlatformFilterOptions.channels] })) } else { setCurrentDevicePlatformFilters(prev => ({ ...prev, channel: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택</label></div>{devicePlatformFilterOptions.channels.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentDevicePlatformFilters.channel.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentDevicePlatformFilters(prev => ({ ...prev, channel: [...prev.channel, item] })) } else { setCurrentDevicePlatformFilters(prev => ({ ...prev, channel: prev.channel.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}</div></div>)}</div>
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}><button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, product: !prev.product, channel: false, brand: false, promotion: false, adset: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}><span style={{ fontWeight: 500 }}>{currentDevicePlatformFilters.product.length === 0 ? '제품_전체' : currentDevicePlatformFilters.product.length === devicePlatformFilterOptions.products.length ? '제품_전체' : currentDevicePlatformFilters.product.length === 1 ? currentDevicePlatformFilters.product[0] : `${currentDevicePlatformFilters.product[0]} 외`}</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentDevicePlatformFilters.product.length === 0 ? '' : currentDevicePlatformFilters.product.length === devicePlatformFilterOptions.products.length ? `(${currentDevicePlatformFilters.product.length})` : currentDevicePlatformFilters.product.length === 1 ? '' : `(${currentDevicePlatformFilters.product.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span></button>{trendDropdownOpen.product && (<div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}><div style={{ padding: 8 }}><div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}><label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentDevicePlatformFilters.product.length === devicePlatformFilterOptions.products.length && devicePlatformFilterOptions.products.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentDevicePlatformFilters(prev => ({ ...prev, product: [...devicePlatformFilterOptions.products] })) } else { setCurrentDevicePlatformFilters(prev => ({ ...prev, product: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택</label></div>{devicePlatformFilterOptions.products.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentDevicePlatformFilters.product.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentDevicePlatformFilters(prev => ({ ...prev, product: [...prev.product, item] })) } else { setCurrentDevicePlatformFilters(prev => ({ ...prev, product: prev.product.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}</div></div>)}</div>
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}><button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, brand: !prev.brand, channel: false, product: false, promotion: false, adset: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}><span style={{ fontWeight: 500 }}>{currentDevicePlatformFilters.brand.length === 0 ? '브랜드_전체' : currentDevicePlatformFilters.brand.length === devicePlatformFilterOptions.brands.length ? '브랜드_전체' : currentDevicePlatformFilters.brand.length === 1 ? currentDevicePlatformFilters.brand[0] : `${currentDevicePlatformFilters.brand[0]} 외`}</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentDevicePlatformFilters.brand.length === 0 ? '' : currentDevicePlatformFilters.brand.length === devicePlatformFilterOptions.brands.length ? `(${currentDevicePlatformFilters.brand.length})` : currentDevicePlatformFilters.brand.length === 1 ? '' : `(${currentDevicePlatformFilters.brand.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span></button>{trendDropdownOpen.brand && (<div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}><div style={{ padding: 8 }}><div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}><label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentDevicePlatformFilters.brand.length === devicePlatformFilterOptions.brands.length && devicePlatformFilterOptions.brands.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentDevicePlatformFilters(prev => ({ ...prev, brand: [...devicePlatformFilterOptions.brands] })) } else { setCurrentDevicePlatformFilters(prev => ({ ...prev, brand: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택</label></div>{devicePlatformFilterOptions.brands.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentDevicePlatformFilters.brand.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentDevicePlatformFilters(prev => ({ ...prev, brand: [...prev.brand, item] })) } else { setCurrentDevicePlatformFilters(prev => ({ ...prev, brand: prev.brand.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}</div></div>)}</div>
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}><button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, promotion: !prev.promotion, channel: false, product: false, brand: false, adset: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}><span style={{ fontWeight: 500 }}>{currentDevicePlatformFilters.promotion.length === 0 ? '프로모션_전체' : currentDevicePlatformFilters.promotion.length === devicePlatformFilterOptions.promotions.length ? '프로모션_전체' : currentDevicePlatformFilters.promotion.length === 1 ? currentDevicePlatformFilters.promotion[0] : `${currentDevicePlatformFilters.promotion[0]} 외`}</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentDevicePlatformFilters.promotion.length === 0 ? '' : currentDevicePlatformFilters.promotion.length === devicePlatformFilterOptions.promotions.length ? `(${currentDevicePlatformFilters.promotion.length})` : currentDevicePlatformFilters.promotion.length === 1 ? '' : `(${currentDevicePlatformFilters.promotion.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span></button>{trendDropdownOpen.promotion && (<div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}><div style={{ padding: 8 }}><div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}><label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentDevicePlatformFilters.promotion.length === devicePlatformFilterOptions.promotions.length && devicePlatformFilterOptions.promotions.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentDevicePlatformFilters(prev => ({ ...prev, promotion: [...devicePlatformFilterOptions.promotions] })) } else { setCurrentDevicePlatformFilters(prev => ({ ...prev, promotion: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택</label></div>{devicePlatformFilterOptions.promotions.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentDevicePlatformFilters.promotion.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentDevicePlatformFilters(prev => ({ ...prev, promotion: [...prev.promotion, item] })) } else { setCurrentDevicePlatformFilters(prev => ({ ...prev, promotion: prev.promotion.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}</div></div>)}</div>
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}><button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, adset: !prev.adset, channel: false, product: false, brand: false, promotion: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}><span style={{ fontWeight: 500 }}>{currentDevicePlatformFilters.adset.length === 0 ? '광고세트_전체' : currentDevicePlatformFilters.adset.length === devicePlatformFilterOptions.adsets.length ? '광고세트_전체' : currentDevicePlatformFilters.adset.length === 1 ? currentDevicePlatformFilters.adset[0] : `${currentDevicePlatformFilters.adset[0]} 외`}</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentDevicePlatformFilters.adset.length === 0 ? '' : currentDevicePlatformFilters.adset.length === devicePlatformFilterOptions.adsets.length ? `(${currentDevicePlatformFilters.adset.length})` : currentDevicePlatformFilters.adset.length === 1 ? '' : `(${currentDevicePlatformFilters.adset.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span></button>{trendDropdownOpen.adset && (<div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}><div style={{ padding: 8 }}><div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}><label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentDevicePlatformFilters.adset.length === devicePlatformFilterOptions.adsets.length && devicePlatformFilterOptions.adsets.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentDevicePlatformFilters(prev => ({ ...prev, adset: [...devicePlatformFilterOptions.adsets] })) } else { setCurrentDevicePlatformFilters(prev => ({ ...prev, adset: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택</label></div>{devicePlatformFilterOptions.adsets.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentDevicePlatformFilters.adset.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentDevicePlatformFilters(prev => ({ ...prev, adset: [...prev.adset, item] })) } else { setCurrentDevicePlatformFilters(prev => ({ ...prev, adset: prev.adset.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}</div></div>)}</div>
                    </div>
                  </div>
                  <div className="chart-container" style={{ position: 'relative', height: 350, marginBottom: 20 }}>{filteredDevicePlatformData.chartData && filteredDevicePlatformData.chartData.datasets.length > 0 ? (<Line data={filteredDevicePlatformData.chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'top' as const }, datalabels: { display: false }, tooltip: { callbacks: { label: function(context: any) { const devicePlatformArray = filteredDevicePlatformData.chartData?.devicePlatformArray || []; const allPeriods = filteredDevicePlatformData.chartData?.labels || []; const aggregatedData = filteredDevicePlatformData.chartData?.aggregatedData || {}; const devicePlatform = devicePlatformArray[context.datasetIndex]; const period = allPeriods[context.dataIndex]; const data = aggregatedData[devicePlatform]?.[period] || {}; const { cost = 0, revenue = 0, conversions = 0, impressions = 0, clicks = 0 } = data; const roas = cost > 0 ? (revenue / cost * 100) : 0; const cpm = impressions > 0 ? (cost / impressions * 1000) : 0; const cpc = clicks > 0 ? (cost / clicks) : 0; const cpa = conversions > 0 ? (cost / conversions) : 0; const ctr = impressions > 0 ? (clicks / impressions * 100) : 0; const cvr = clicks > 0 ? (conversions / clicks * 100) : 0; const lines = [`${devicePlatform}`]; switch(currentDevicePlatformMetric) { case 'roas': lines.push(`ROAS: ${roas.toFixed(1)}%`); lines.push(`비용: ${formatCurrency(cost)}`); lines.push(`전환값: ${formatCurrency(revenue)}`); break; case 'cost': lines.push(`비용: ${formatCurrency(context.parsed.y)}`); lines.push(`ROAS: ${roas.toFixed(1)}%`); break; case 'revenue': lines.push(`전환값: ${formatCurrency(context.parsed.y)}`); lines.push(`비용: ${formatCurrency(cost)}`); lines.push(`ROAS: ${roas.toFixed(1)}%`); break; case 'conversions': lines.push(`전환수: ${conversions.toLocaleString()}건`); lines.push(`전환율: ${cvr.toFixed(2)}%`); break; case 'impressions': lines.push(`노출수: ${impressions.toLocaleString()}회`); lines.push(`CTR: ${ctr.toFixed(2)}%`); break; case 'clicks': lines.push(`클릭수: ${clicks.toLocaleString()}회`); lines.push(`CTR: ${ctr.toFixed(2)}%`); break; case 'cpm': lines.push(`CPM: ${formatCurrency(context.parsed.y)}`); lines.push(`노출수: ${impressions.toLocaleString()}회`); break; case 'cpc': lines.push(`CPC: ${formatCurrency(context.parsed.y)}`); lines.push(`클릭수: ${clicks.toLocaleString()}회`); break; case 'cpa': lines.push(`CPA: ${formatCurrency(context.parsed.y)}`); lines.push(`전환수: ${conversions.toLocaleString()}건`); break; case 'ctr': lines.push(`CTR: ${context.parsed.y.toFixed(2)}%`); lines.push(`클릭수: ${clicks.toLocaleString()}회`); lines.push(`노출수: ${impressions.toLocaleString()}회`); break; case 'cvr': lines.push(`전환율: ${context.parsed.y.toFixed(2)}%`); lines.push(`전환수: ${conversions.toLocaleString()}건`); lines.push(`클릭수: ${clicks.toLocaleString()}회`); break; } return lines; } } } }, scales: { y: { beginAtZero: true, title: { display: true, text: (() => { switch(currentDevicePlatformMetric) { case 'roas': return 'ROAS (%)'; case 'cost': return '비용 (원)'; case 'revenue': return '전환값 (원)'; case 'conversions': return '전환수 (건)'; case 'impressions': return '노출수 (회)'; case 'clicks': return '클릭수 (회)'; case 'cpm': return 'CPM (원)'; case 'cpc': return 'CPC (원)'; case 'cpa': return 'CPA (원)'; case 'ctr': return 'CTR (%)'; case 'cvr': return '전환율 (%)'; default: return '지표'; } })() }, ticks: { callback: function(value: any) { switch(currentDevicePlatformMetric) { case 'roas': case 'ctr': case 'cvr': return value.toFixed(1) + '%'; case 'cost': case 'revenue': case 'cpm': case 'cpc': case 'cpa': return formatCurrency(value); case 'conversions': case 'impressions': case 'clicks': return value.toLocaleString(); default: return value; } } } }, x: { title: { display: true, text: '기간' } } } }} />) : (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#757575' }}><div style={{ fontSize: 48, marginBottom: 16 }}>📊</div><div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>필터를 선택하여 차트를 확인하세요</div><div style={{ fontSize: 13, color: '#9e9e9e' }}>위 드롭다운에서 분류 기준을 선택하면 기기플랫폼별 추이 차트가 표시됩니다</div></div>)}</div>
                  <div style={{ marginTop: 20, padding: 16, background: 'linear-gradient(135deg, #e0f7fa 0%, #e8f5e9 100%)', borderRadius: 10, borderLeft: '4px solid #009688' }}><div style={{ fontSize: 13, fontWeight: 600, color: '#00796b', marginBottom: 8 }}>💡 기기플랫폼 최적화 팁</div><div style={{ fontSize: 13, color: 'var(--grey-800)', lineHeight: 1.6 }}>iOS와 Android 사용자 특성을 고려하여 각 플랫폼에 맞는 메시지와 소재를 준비하세요.</div></div>
                </div>
              </div>
            )}

            {/* 탭 6: 기기 추이 - HTML 1:1 구현 */}
            {trendAnalysisTab === 'deviceType' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%)', borderRadius: 8, borderLeft: '4px solid #2196f3', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>📊</span><strong style={{ color: '#1976d2', fontSize: 13 }}>이 분석의 목적</strong></div><p style={{ margin: 0, fontSize: 12, color: '#424242', lineHeight: 1.6 }}>시간에 따른 <strong style={{ color: '#1565c0' }}>기기 유형별 성과 변화</strong>를 추적하여<br />기기별 광고 전략을 최적화할 수 있습니다</p></div>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: 8, borderLeft: '4px solid #4caf50', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>💡</span><strong style={{ color: '#388e3c', fontSize: 13 }}>사용 방법</strong></div><div style={{ fontSize: 12, color: '#424242', lineHeight: 1.6 }}><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>1</span><span>드롭다운에서 원하는 필터 선택</span></div><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>2</span><span>차트에서 추이 패턴 확인</span></div></div></div>
                </div>
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '2px solid var(--grey-200)', paddingBottom: 16 }}><div><div className="card-title" style={{ marginBottom: 4 }}>시간에 따른 기기 유형별 성과 추이</div><p style={{ color: 'var(--grey-600)', fontSize: 13, margin: 0 }}>시간에 따른 각 기기 유형의 성과 변화를 추적하여 트렌드를 파악할 수 있습니다.</p></div><div className="view-type-section" style={{ marginBottom: 0 }}><button className={`view-btn ${currentDeviceTypePeriod === 'monthly' ? 'active' : ''}`} onClick={() => setCurrentDeviceTypePeriod('monthly')}>월별</button><button className={`view-btn ${currentDeviceTypePeriod === 'weekly' ? 'active' : ''}`} onClick={() => setCurrentDeviceTypePeriod('weekly')}>주별</button><button className={`view-btn ${currentDeviceTypePeriod === 'daily' ? 'active' : ''}`} onClick={() => setCurrentDeviceTypePeriod('daily')}>일별</button></div></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 20 }}><div style={{ flex: '0 0 auto' }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)', marginBottom: 12 }}>📈 지표 선택</div><select value={currentDeviceTypeMetric} onChange={(e) => setCurrentDeviceTypeMetric(e.target.value)} style={{ minWidth: 200, padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer' }}><option value="roas">ROAS</option><option value="cost">비용</option><option value="revenue">전환값</option><option value="conversions">전환수</option><option value="impressions">노출수</option><option value="clicks">클릭수</option><option value="cpm">CPM</option><option value="cpc">CPC</option><option value="cpa">CPA</option><option value="ctr">CTR</option><option value="cvr">전환율</option></select></div><div style={{ flex: '0 0 auto', marginLeft: 'auto' }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)', marginBottom: 12 }}>📅 기간 선택</div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><input type="date" value={deviceTypeStartDate} onChange={(e) => setDeviceTypeStartDate(e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer' }} /><span style={{ color: 'var(--grey-600)', fontWeight: 500 }}>~</span><input type="date" value={deviceTypeEndDate} onChange={(e) => setDeviceTypeEndDate(e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer' }} /></div></div></div>
                  <div style={{ marginBottom: 20, padding: 16, background: 'var(--grey-50)', borderRadius: 8, border: '1px solid var(--grey-200)' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)' }}>📊 분류 기준</div><div style={{ fontSize: 12, color: '#2e7d32', fontWeight: 600 }}>🎯 <span>{filteredDeviceData.devicesToShow.size}</span>개 기기</div></div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}><button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, channel: !prev.channel, product: false, brand: false, promotion: false, adset: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}><span style={{ fontWeight: 500 }}>{currentDeviceTypeFilters.channel.length === 0 ? '채널_전체' : currentDeviceTypeFilters.channel.length === deviceFilterOptions.channels.length ? '채널_전체' : currentDeviceTypeFilters.channel.length === 1 ? currentDeviceTypeFilters.channel[0] : `${currentDeviceTypeFilters.channel[0]} 외`}</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentDeviceTypeFilters.channel.length === 0 ? '' : currentDeviceTypeFilters.channel.length === deviceFilterOptions.channels.length ? `(${currentDeviceTypeFilters.channel.length})` : currentDeviceTypeFilters.channel.length === 1 ? '' : `(${currentDeviceTypeFilters.channel.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span></button>{trendDropdownOpen.channel && (<div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}><div style={{ padding: 8 }}><div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}><label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentDeviceTypeFilters.channel.length === deviceFilterOptions.channels.length && deviceFilterOptions.channels.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentDeviceTypeFilters(prev => ({ ...prev, channel: [...deviceFilterOptions.channels] })) } else { setCurrentDeviceTypeFilters(prev => ({ ...prev, channel: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택</label></div>{deviceFilterOptions.channels.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentDeviceTypeFilters.channel.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentDeviceTypeFilters(prev => ({ ...prev, channel: [...prev.channel, item] })) } else { setCurrentDeviceTypeFilters(prev => ({ ...prev, channel: prev.channel.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}</div></div>)}</div>
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}><button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, product: !prev.product, channel: false, brand: false, promotion: false, adset: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}><span style={{ fontWeight: 500 }}>{currentDeviceTypeFilters.product.length === 0 ? '제품_전체' : currentDeviceTypeFilters.product.length === deviceFilterOptions.products.length ? '제품_전체' : currentDeviceTypeFilters.product.length === 1 ? currentDeviceTypeFilters.product[0] : `${currentDeviceTypeFilters.product[0]} 외`}</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentDeviceTypeFilters.product.length === 0 ? '' : currentDeviceTypeFilters.product.length === deviceFilterOptions.products.length ? `(${currentDeviceTypeFilters.product.length})` : currentDeviceTypeFilters.product.length === 1 ? '' : `(${currentDeviceTypeFilters.product.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span></button>{trendDropdownOpen.product && (<div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}><div style={{ padding: 8 }}><div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}><label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentDeviceTypeFilters.product.length === deviceFilterOptions.products.length && deviceFilterOptions.products.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentDeviceTypeFilters(prev => ({ ...prev, product: [...deviceFilterOptions.products] })) } else { setCurrentDeviceTypeFilters(prev => ({ ...prev, product: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택</label></div>{deviceFilterOptions.products.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentDeviceTypeFilters.product.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentDeviceTypeFilters(prev => ({ ...prev, product: [...prev.product, item] })) } else { setCurrentDeviceTypeFilters(prev => ({ ...prev, product: prev.product.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}</div></div>)}</div>
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}><button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, brand: !prev.brand, channel: false, product: false, promotion: false, adset: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}><span style={{ fontWeight: 500 }}>{currentDeviceTypeFilters.brand.length === 0 ? '브랜드_전체' : currentDeviceTypeFilters.brand.length === deviceFilterOptions.brands.length ? '브랜드_전체' : currentDeviceTypeFilters.brand.length === 1 ? currentDeviceTypeFilters.brand[0] : `${currentDeviceTypeFilters.brand[0]} 외`}</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentDeviceTypeFilters.brand.length === 0 ? '' : currentDeviceTypeFilters.brand.length === deviceFilterOptions.brands.length ? `(${currentDeviceTypeFilters.brand.length})` : currentDeviceTypeFilters.brand.length === 1 ? '' : `(${currentDeviceTypeFilters.brand.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span></button>{trendDropdownOpen.brand && (<div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}><div style={{ padding: 8 }}><div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}><label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentDeviceTypeFilters.brand.length === deviceFilterOptions.brands.length && deviceFilterOptions.brands.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentDeviceTypeFilters(prev => ({ ...prev, brand: [...deviceFilterOptions.brands] })) } else { setCurrentDeviceTypeFilters(prev => ({ ...prev, brand: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택</label></div>{deviceFilterOptions.brands.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentDeviceTypeFilters.brand.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentDeviceTypeFilters(prev => ({ ...prev, brand: [...prev.brand, item] })) } else { setCurrentDeviceTypeFilters(prev => ({ ...prev, brand: prev.brand.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}</div></div>)}</div>
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}><button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, promotion: !prev.promotion, channel: false, product: false, brand: false, adset: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}><span style={{ fontWeight: 500 }}>{currentDeviceTypeFilters.promotion.length === 0 ? '프로모션_전체' : currentDeviceTypeFilters.promotion.length === deviceFilterOptions.promotions.length ? '프로모션_전체' : currentDeviceTypeFilters.promotion.length === 1 ? currentDeviceTypeFilters.promotion[0] : `${currentDeviceTypeFilters.promotion[0]} 외`}</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentDeviceTypeFilters.promotion.length === 0 ? '' : currentDeviceTypeFilters.promotion.length === deviceFilterOptions.promotions.length ? `(${currentDeviceTypeFilters.promotion.length})` : currentDeviceTypeFilters.promotion.length === 1 ? '' : `(${currentDeviceTypeFilters.promotion.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span></button>{trendDropdownOpen.promotion && (<div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}><div style={{ padding: 8 }}><div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}><label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentDeviceTypeFilters.promotion.length === deviceFilterOptions.promotions.length && deviceFilterOptions.promotions.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentDeviceTypeFilters(prev => ({ ...prev, promotion: [...deviceFilterOptions.promotions] })) } else { setCurrentDeviceTypeFilters(prev => ({ ...prev, promotion: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택</label></div>{deviceFilterOptions.promotions.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentDeviceTypeFilters.promotion.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentDeviceTypeFilters(prev => ({ ...prev, promotion: [...prev.promotion, item] })) } else { setCurrentDeviceTypeFilters(prev => ({ ...prev, promotion: prev.promotion.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}</div></div>)}</div>
                      <div className="trend-filter-dropdown" style={{ position: 'relative', minWidth: 150, flex: 1 }}><button type="button" onClick={(e) => { e.stopPropagation(); setTrendDropdownOpen(prev => ({ ...prev, adset: !prev.adset, channel: false, product: false, brand: false, promotion: false })) }} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}><span style={{ fontWeight: 500 }}>{currentDeviceTypeFilters.adset.length === 0 ? '광고세트_전체' : currentDeviceTypeFilters.adset.length === deviceFilterOptions.adsets.length ? '광고세트_전체' : currentDeviceTypeFilters.adset.length === 1 ? currentDeviceTypeFilters.adset[0] : `${currentDeviceTypeFilters.adset[0]} 외`}</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, color: 'var(--grey-500)' }}>{currentDeviceTypeFilters.adset.length === 0 ? '' : currentDeviceTypeFilters.adset.length === deviceFilterOptions.adsets.length ? `(${currentDeviceTypeFilters.adset.length})` : currentDeviceTypeFilters.adset.length === 1 ? '' : `(${currentDeviceTypeFilters.adset.length})`}</span><span style={{ fontSize: 10 }}>▼</span></span></button>{trendDropdownOpen.adset && (<div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 280, overflowY: 'auto', zIndex: 100 }}><div style={{ padding: 8 }}><div style={{ position: 'sticky', top: 0, background: 'white', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', marginBottom: 6 }}><label style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentDeviceTypeFilters.adset.length === deviceFilterOptions.adsets.length && deviceFilterOptions.adsets.length > 0} onChange={(e) => { if (e.target.checked) { setCurrentDeviceTypeFilters(prev => ({ ...prev, adset: [...deviceFilterOptions.adsets] })) } else { setCurrentDeviceTypeFilters(prev => ({ ...prev, adset: [] })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택</label></div>{deviceFilterOptions.adsets.map((item, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, borderRadius: 4 }}><input type="checkbox" checked={currentDeviceTypeFilters.adset.includes(item)} onChange={(e) => { if (e.target.checked) { setCurrentDeviceTypeFilters(prev => ({ ...prev, adset: [...prev.adset, item] })) } else { setCurrentDeviceTypeFilters(prev => ({ ...prev, adset: prev.adset.filter(v => v !== item) })) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{item}</label>))}</div></div>)}</div>
                    </div>
                  </div>
                  <div className="chart-container" style={{ position: 'relative', height: 350, marginBottom: 20 }}>{filteredDeviceData.chartData && filteredDeviceData.chartData.datasets.length > 0 ? (<Line data={filteredDeviceData.chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'top' as const }, datalabels: { display: false }, tooltip: { callbacks: { label: function(context: any) { const deviceTypeArray = filteredDeviceData.chartData?.deviceTypeArray || []; const allPeriods = filteredDeviceData.chartData?.labels || []; const aggregatedData = filteredDeviceData.chartData?.aggregatedData || {}; const deviceType = deviceTypeArray[context.datasetIndex]; const period = allPeriods[context.dataIndex]; const data = aggregatedData[deviceType]?.[period] || {}; const { cost = 0, revenue = 0, conversions = 0, impressions = 0, clicks = 0 } = data; const roas = cost > 0 ? (revenue / cost * 100) : 0; const cpm = impressions > 0 ? (cost / impressions * 1000) : 0; const cpc = clicks > 0 ? (cost / clicks) : 0; const cpa = conversions > 0 ? (cost / conversions) : 0; const ctr = impressions > 0 ? (clicks / impressions * 100) : 0; const cvr = clicks > 0 ? (conversions / clicks * 100) : 0; const lines = [`${deviceType}`]; switch(currentDeviceTypeMetric) { case 'roas': lines.push(`ROAS: ${roas.toFixed(1)}%`); lines.push(`비용: ${formatCurrency(cost)}`); lines.push(`전환값: ${formatCurrency(revenue)}`); break; case 'cost': lines.push(`비용: ${formatCurrency(context.parsed.y)}`); lines.push(`ROAS: ${roas.toFixed(1)}%`); break; case 'revenue': lines.push(`전환값: ${formatCurrency(context.parsed.y)}`); lines.push(`비용: ${formatCurrency(cost)}`); lines.push(`ROAS: ${roas.toFixed(1)}%`); break; case 'conversions': lines.push(`전환수: ${conversions.toLocaleString()}건`); lines.push(`전환율: ${cvr.toFixed(2)}%`); break; case 'impressions': lines.push(`노출수: ${impressions.toLocaleString()}회`); lines.push(`CTR: ${ctr.toFixed(2)}%`); break; case 'clicks': lines.push(`클릭수: ${clicks.toLocaleString()}회`); lines.push(`CTR: ${ctr.toFixed(2)}%`); break; case 'cpm': lines.push(`CPM: ${formatCurrency(context.parsed.y)}`); lines.push(`노출수: ${impressions.toLocaleString()}회`); break; case 'cpc': lines.push(`CPC: ${formatCurrency(context.parsed.y)}`); lines.push(`클릭수: ${clicks.toLocaleString()}회`); break; case 'cpa': lines.push(`CPA: ${formatCurrency(context.parsed.y)}`); lines.push(`전환수: ${conversions.toLocaleString()}건`); break; case 'ctr': lines.push(`CTR: ${context.parsed.y.toFixed(2)}%`); lines.push(`클릭수: ${clicks.toLocaleString()}회`); lines.push(`노출수: ${impressions.toLocaleString()}회`); break; case 'cvr': lines.push(`전환율: ${context.parsed.y.toFixed(2)}%`); lines.push(`전환수: ${conversions.toLocaleString()}건`); lines.push(`클릭수: ${clicks.toLocaleString()}회`); break; } return lines; } } } }, scales: { y: { beginAtZero: true, title: { display: true, text: (() => { switch(currentDeviceTypeMetric) { case 'roas': return 'ROAS (%)'; case 'cost': return '비용 (원)'; case 'revenue': return '전환값 (원)'; case 'conversions': return '전환수 (건)'; case 'impressions': return '노출수 (회)'; case 'clicks': return '클릭수 (회)'; case 'cpm': return 'CPM (원)'; case 'cpc': return 'CPC (원)'; case 'cpa': return 'CPA (원)'; case 'ctr': return 'CTR (%)'; case 'cvr': return '전환율 (%)'; default: return '지표'; } })() }, ticks: { callback: function(value: any) { switch(currentDeviceTypeMetric) { case 'roas': case 'ctr': case 'cvr': return value.toFixed(1) + '%'; case 'cost': case 'revenue': case 'cpm': case 'cpc': case 'cpa': return formatCurrency(value); case 'conversions': case 'impressions': case 'clicks': return value.toLocaleString(); default: return value; } } } }, x: { title: { display: true, text: '기간' } } } }} />) : (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#757575' }}><div style={{ fontSize: 48, marginBottom: 16 }}>📊</div><div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>필터를 선택하여 차트를 확인하세요</div><div style={{ fontSize: 13, color: '#9e9e9e' }}>위 드롭다운에서 분류 기준을 선택하면 기기별 추이 차트가 표시됩니다</div></div>)}</div>
                  <div style={{ marginTop: 20, padding: 16, background: 'linear-gradient(135deg, #e3f2fd 0%, #e8eaf6 100%)', borderRadius: 10, borderLeft: '4px solid #2196f3' }}><div style={{ fontSize: 13, fontWeight: 600, color: '#1565c0', marginBottom: 8 }}>💡 기기 유형 최적화 팁</div><div style={{ fontSize: 13, color: 'var(--grey-800)', lineHeight: 1.6 }}>모바일 사용자가 증가하는 추세라면 모바일 최적화 소재와 랜딩 페이지를 준비하세요.</div></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== 성과 테이블 분석 섹션 (HTML 1:1) ========== */}
        <div className="collapsible-section" style={{ marginTop: 24 }}>
          <div className="collapsible-header" onClick={() => setPerfTableExpanded(!perfTableExpanded)}>
            <div className="collapsible-title"><span className="collapsible-icon">📋</span><span>성과 테이블 분석 - 상세 지표를 테이블로 확인하세요</span></div>
            <button className="collapsible-toggle"><span>{perfTableExpanded ? '접기' : '펼치기'}</span><span className={`collapsible-toggle-icon ${perfTableExpanded ? '' : 'collapsed'}`}>▼</span></button>
          </div>
          <div className={`collapsible-content ${perfTableExpanded ? 'expanded' : ''}`}>
            {/* 탭 버튼 */}
            <div className="view-type-section" style={{ marginBottom: 24 }}>
              <button className={`view-btn ${perfTableActiveTab === 'adset' ? 'active' : ''}`} onClick={() => setPerfTableActiveTab('adset')}>광고세트</button>
              <button className={`view-btn ${perfTableActiveTab === 'gender' ? 'active' : ''}`} onClick={() => setPerfTableActiveTab('gender')}>성별</button>
              <button className={`view-btn ${perfTableActiveTab === 'age' ? 'active' : ''}`} onClick={() => setPerfTableActiveTab('age')}>연령</button>
              <button className={`view-btn ${perfTableActiveTab === 'genderAge' ? 'active' : ''}`} onClick={() => setPerfTableActiveTab('genderAge')}>성별x연령</button>
              <button className={`view-btn ${perfTableActiveTab === 'platform' ? 'active' : ''}`} onClick={() => setPerfTableActiveTab('platform')}>플랫폼</button>
              <button className={`view-btn ${perfTableActiveTab === 'devicePlatform' ? 'active' : ''}`} onClick={() => setPerfTableActiveTab('devicePlatform')}>기기플랫폼</button>
              <button className={`view-btn ${perfTableActiveTab === 'deviceType' ? 'active' : ''}`} onClick={() => setPerfTableActiveTab('deviceType')}>기기</button>
            </div>

            {/* 광고세트 탭 */}
            {perfTableActiveTab === 'adset' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%)', borderRadius: 8, borderLeft: '4px solid #2196f3', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>📊</span><strong style={{ color: '#1976d2', fontSize: 13 }}>이 분석의 목적</strong></div><p style={{ margin: 0, fontSize: 12, color: '#424242', lineHeight: 1.6 }}>광고세트별 <strong style={{ color: '#1565c0' }}>상세 성과 지표</strong>를 테이블 형식으로<br />정렬하고 비교할 수 있습니다</p></div>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: 8, borderLeft: '4px solid #4caf50', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>💡</span><strong style={{ color: '#388e3c', fontSize: 13 }}>사용 방법</strong></div><div style={{ fontSize: 12, color: '#424242', lineHeight: 1.6 }}><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>1</span><span>드롭다운에서 원하는 필터 선택</span></div><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>2</span><span>컬럼 헤더 클릭으로 정렬</span></div></div></div>
                </div>
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '2px solid var(--grey-200)', paddingBottom: 16 }}><div><div className="card-title" style={{ marginBottom: 4 }}>광고세트별 성과 테이블</div><p style={{ color: 'var(--grey-600)', fontSize: 13, margin: 0 }}>광고세트별 상세 지표를 테이블로 확인할 수 있으며, KPI 버튼을 클릭해 원하는 기준으로 정렬할 수 있습니다.</p></div></div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', gap: 20, marginBottom: 20 }}><div style={{ flex: '0 0 auto' }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)', marginBottom: 12 }}>📅 기간 선택</div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><input type="date" value={perfTableState.adset.startDate} onChange={(e) => handlePerfTableDateChange('adset', true, e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer' }} /><span style={{ color: 'var(--grey-600)', fontWeight: 500 }}>~</span><input type="date" value={perfTableState.adset.endDate} onChange={(e) => handlePerfTableDateChange('adset', false, e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer' }} /></div></div></div>
                  <div style={{ marginBottom: 20, padding: 16, background: 'var(--grey-50)', borderRadius: 8, border: '1px solid var(--grey-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)' }}>📊 분류 기준</div><div style={{ fontSize: 12, color: '#2e7d32', fontWeight: 600 }}>🎯 {perfTableAdsetData.count}개 광고세트</div></div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      {['channel', 'product', 'brand', 'promotion'].map((filterKey) => {
                        const labelMap: Record<string, string> = { channel: '채널', product: '제품', brand: '브랜드', promotion: '프로모션' }
                        const optionsMap: Record<string, string[]> = { channel: perfTableFilterOptions.channels, product: perfTableFilterOptions.products, brand: perfTableFilterOptions.brands, promotion: perfTableFilterOptions.promotions }
                        const options = optionsMap[filterKey] || []
                        const selected = perfTableState.adset.filters[filterKey as keyof typeof perfTableState.adset.filters] || []
                        const dropdownKey = `adset_${filterKey}`
                        return (
                          <div key={filterKey} style={{ position: 'relative', minWidth: 180, flex: 1 }}>
                            <button type="button" onClick={() => setPerfTableDropdownOpen(prev => ({ ...prev, [dropdownKey]: !prev[dropdownKey] }))} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, color: 'var(--grey-800)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}><span style={{ fontWeight: 500 }}>{labelMap[filterKey]}_전체</span><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, background: 'var(--grey-200)', padding: '2px 8px', borderRadius: 10, color: 'var(--grey-600)' }}>{selected.length}개</span><span style={{ color: 'var(--grey-400)', fontSize: 10 }}>▼</span></div></button>
                            {perfTableDropdownOpen[dropdownKey] && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, maxHeight: 250, overflowY: 'auto', marginTop: 4 }}>
                                <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--grey-200)', background: 'var(--grey-50)' }}><label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--grey-700)' }}><input type="checkbox" checked={selected.length === options.length && options.length > 0} onChange={(e) => updatePerfTableFilters('adset', filterKey, e.target.checked ? [...options] : [])} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />전체 선택</label></div>
                                {options.map((value, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12, color: 'var(--grey-700)', transition: 'background 0.2s', borderRadius: 4 }}><input type="checkbox" checked={selected.includes(value)} onChange={(e) => { if (e.target.checked) { updatePerfTableFilters('adset', filterKey, [...selected, value]) } else { updatePerfTableFilters('adset', filterKey, selected.filter(v => v !== value)) }}} style={{ marginRight: 10, width: 16, height: 16, cursor: 'pointer' }} />{value}</label>))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
                    {perfTableAdsetData.dataList.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--grey-500)' }}><div style={{ fontSize: 48, marginBottom: 16 }}>📊</div><div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>필터를 선택해주세요</div><div style={{ fontSize: 13, color: 'var(--grey-400)' }}>위의 분류 기준에서 하나 이상의 항목을 선택해주세요.</div></div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 1200 }}>
                        <thead><tr style={{ background: 'var(--grey-100)' }}><th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: 700, border: '1px solid var(--grey-300)', background: 'var(--grey-200)', minWidth: 150, position: 'sticky', left: 0, zIndex: 10 }}>광고세트</th>
                          {perfTableMetrics.map(metric => {
                            const isSorted = (perfTableState.adset as any).sortColumn === metric.key
                            const sortIcon = isSorted ? ((perfTableState.adset as any).sortDirection === 'desc' ? ' ▼' : ' ▲') : ''
                            return <th key={metric.key} onClick={() => handlePerfTableSort('adset', metric.key)} style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600, border: '1px solid var(--grey-300)', background: isSorted ? 'var(--primary-light)' : 'var(--grey-100)', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.2s' }}>{metric.label}{sortIcon}</th>
                          })}
                        </tr></thead>
                        <tbody>{perfTableAdsetData.dataList.map((item, index) => {
                          const metricRanges: Record<string, { min: number, max: number }> = {}
                          perfTableMetrics.forEach(m => {
                            let min = Infinity, max = -Infinity
                            perfTableAdsetData.dataList.forEach(d => { const v = (d as any)[m.key] || 0; if (v < min) min = v; if (v > max) max = v })
                            metricRanges[m.key] = { min, max }
                          })
                          const isInverseMetric = (key: string) => ['cpm', 'cpc', 'cpa'].includes(key)
                          return (<tr key={index} style={{ background: index % 2 === 0 ? 'var(--paper)' : 'var(--grey-50)' }}><td style={{ padding: 10, fontWeight: 500, border: '1px solid var(--grey-300)', background: 'var(--grey-50)', position: 'sticky', left: 0, zIndex: 5, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.name}>{item.name}</td>
                            {perfTableMetrics.map(metric => {
                              const value = (item as any)[metric.key] || 0
                              const range = metricRanges[metric.key]
                              const bgColor = getPerfTableColorScale(value, range.min, range.max, isInverseMetric(metric.key))
                              return <td key={metric.key} style={{ padding: '10px 8px', textAlign: 'right', border: '1px solid var(--grey-300)', background: bgColor, fontVariantNumeric: 'tabular-nums' }}>{metric.format(value)}</td>
                            })}
                          </tr>)
                        })}</tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 성별 탭 */}
            {perfTableActiveTab === 'gender' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%)', borderRadius: 8, borderLeft: '4px solid #2196f3', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>📊</span><strong style={{ color: '#1976d2', fontSize: 13 }}>이 분석의 목적</strong></div>
                    <p style={{ margin: 0, fontSize: 12, color: '#424242', lineHeight: 1.6 }}>성별 <strong style={{ color: '#1565c0' }}>상세 성과 지표</strong>를 테이블 형식으로<br/>정렬하고 비교할 수 있습니다</p>
                  </div>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: 8, borderLeft: '4px solid #4caf50', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>💡</span><strong style={{ color: '#388e3c', fontSize: 13 }}>사용 방법</strong></div>
                    <div style={{ fontSize: 12, color: '#424242', lineHeight: 1.6 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>1</span><span>드롭다운에서 원하는 필터 선택</span></div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>2</span><span>컬럼 헤더 클릭으로 정렬</span></div>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '2px solid var(--grey-200)', paddingBottom: 16 }}><div><div className="card-title" style={{ marginBottom: 4 }}>성별 성과 테이블</div><p style={{ color: 'var(--grey-600)', fontSize: 13, margin: 0 }}>성별 상세 지표를 테이블로 확인할 수 있습니다.</p></div></div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}><div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)', marginBottom: 12 }}>📅 기간 선택</div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><input type="date" value={perfTableState.gender.startDate} onChange={(e) => handlePerfTableDateChange('gender', true, e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13 }} /><span style={{ color: 'var(--grey-600)', fontWeight: 500 }}>~</span><input type="date" value={perfTableState.gender.endDate} onChange={(e) => handlePerfTableDateChange('gender', false, e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13 }} /></div></div></div>
                  <div style={{ marginBottom: 20, padding: 16, background: 'var(--grey-50)', borderRadius: 8, border: '1px solid var(--grey-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)' }}>📊 분류 기준</div><div style={{ fontSize: 12, color: '#2e7d32', fontWeight: 600 }}>🎯 {perfTableGenderData.count}개 항목</div></div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      {['channel', 'product', 'brand', 'promotion'].map((filterKey) => {
                        const labelMap: Record<string, string> = { channel: '채널', product: '제품', brand: '브랜드', promotion: '프로모션' }
                        const optionsMap: Record<string, string[]> = { channel: perfTableFilterOptions.channels, product: perfTableFilterOptions.products, brand: perfTableFilterOptions.brands, promotion: perfTableFilterOptions.promotions }
                        const options = optionsMap[filterKey] || []
                        const selected = perfTableState.gender.filters[filterKey as keyof typeof perfTableState.gender.filters] || []
                        const dropdownKey = `gender_${filterKey}`
                        return (
                          <div key={filterKey} style={{ position: 'relative', minWidth: 180, flex: 1 }}>
                            <button type="button" onClick={() => setPerfTableDropdownOpen(prev => ({ ...prev, [dropdownKey]: !prev[dropdownKey] }))} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontWeight: 500 }}>{labelMap[filterKey]}_전체</span><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, background: 'var(--grey-200)', padding: '2px 8px', borderRadius: 10 }}>{selected.length}개</span><span style={{ fontSize: 10 }}>▼</span></div></button>
                            {perfTableDropdownOpen[dropdownKey] && (<div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, maxHeight: 250, overflowY: 'auto', marginTop: 4 }}><div style={{ padding: '8px 10px', borderBottom: '1px solid var(--grey-200)', background: 'var(--grey-50)' }}><label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}><input type="checkbox" checked={selected.length === options.length && options.length > 0} onChange={(e) => updatePerfTableFilters('gender', filterKey, e.target.checked ? [...options] : [])} style={{ marginRight: 10, width: 16, height: 16 }} />전체 선택</label></div>{options.map((value, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12 }}><input type="checkbox" checked={selected.includes(value)} onChange={(e) => { if (e.target.checked) { updatePerfTableFilters('gender', filterKey, [...selected, value]) } else { updatePerfTableFilters('gender', filterKey, selected.filter(v => v !== value)) }}} style={{ marginRight: 10, width: 16, height: 16 }} />{value}</label>))}</div>)}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    {perfTableGenderData.dataList.length === 0 ? (<div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--grey-500)' }}><div style={{ fontSize: 48, marginBottom: 16 }}>📊</div><div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>필터를 선택해주세요</div></div>) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 1200 }}><thead><tr style={{ background: 'var(--grey-100)' }}><th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: 700, border: '1px solid var(--grey-300)', background: 'var(--grey-200)', minWidth: 120, position: 'sticky', left: 0, zIndex: 10 }}>성별</th>{perfTableMetrics.map(metric => { const isSorted = (perfTableState.gender as any).sortColumn === metric.key; const sortIcon = isSorted ? ((perfTableState.gender as any).sortDirection === 'desc' ? ' ▼' : ' ▲') : ''; return <th key={metric.key} onClick={() => handlePerfTableSort('gender', metric.key)} style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600, border: '1px solid var(--grey-300)', background: isSorted ? 'var(--primary-light)' : 'var(--grey-100)', cursor: 'pointer', whiteSpace: 'nowrap' }}>{metric.label}{sortIcon}</th> })}</tr></thead>
                        <tbody>{perfTableGenderData.dataList.map((item, index) => { const metricRanges: Record<string, { min: number, max: number }> = {}; perfTableMetrics.forEach(m => { let min = Infinity, max = -Infinity; perfTableGenderData.dataList.forEach(d => { const v = (d as any)[m.key] || 0; if (v < min) min = v; if (v > max) max = v }); metricRanges[m.key] = { min, max } }); const isInverseMetric = (key: string) => ['cpm', 'cpc', 'cpa'].includes(key); return (<tr key={index} style={{ background: index % 2 === 0 ? 'var(--paper)' : 'var(--grey-50)' }}><td style={{ padding: 10, fontWeight: 500, border: '1px solid var(--grey-300)', background: 'var(--grey-50)', position: 'sticky', left: 0, zIndex: 5 }}>{item.name}</td>{perfTableMetrics.map(metric => { const value = (item as any)[metric.key] || 0; const range = metricRanges[metric.key]; const bgColor = getPerfTableColorScale(value, range.min, range.max, isInverseMetric(metric.key)); return <td key={metric.key} style={{ padding: '10px 8px', textAlign: 'right', border: '1px solid var(--grey-300)', background: bgColor, fontVariantNumeric: 'tabular-nums' }}>{metric.format(value)}</td> })}</tr>) })}</tbody></table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 연령 탭 - 성별 탭과 동일 구조 */}
            {perfTableActiveTab === 'age' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%)', borderRadius: 8, borderLeft: '4px solid #2196f3', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>📊</span><strong style={{ color: '#1976d2', fontSize: 13 }}>이 분석의 목적</strong></div>
                    <p style={{ margin: 0, fontSize: 12, color: '#424242', lineHeight: 1.6 }}>연령대별 <strong style={{ color: '#1565c0' }}>상세 성과 지표</strong>를 테이블 형식으로<br/>정렬하고 비교할 수 있습니다</p>
                  </div>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: 8, borderLeft: '4px solid #4caf50', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>💡</span><strong style={{ color: '#388e3c', fontSize: 13 }}>사용 방법</strong></div>
                    <div style={{ fontSize: 12, color: '#424242', lineHeight: 1.6 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>1</span><span>드롭다운에서 원하는 필터 선택</span></div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>2</span><span>컬럼 헤더 클릭으로 정렬</span></div>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '2px solid var(--grey-200)', paddingBottom: 16 }}><div><div className="card-title" style={{ marginBottom: 4 }}>연령별 성과 테이블</div><p style={{ color: 'var(--grey-600)', fontSize: 13, margin: 0 }}>연령대별 상세 지표를 테이블로 확인할 수 있습니다.</p></div></div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}><div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)', marginBottom: 12 }}>📅 기간 선택</div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><input type="date" value={perfTableState.age.startDate} onChange={(e) => handlePerfTableDateChange('age', true, e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13 }} /><span style={{ color: 'var(--grey-600)', fontWeight: 500 }}>~</span><input type="date" value={perfTableState.age.endDate} onChange={(e) => handlePerfTableDateChange('age', false, e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13 }} /></div></div></div>
                  <div style={{ marginBottom: 20, padding: 16, background: 'var(--grey-50)', borderRadius: 8, border: '1px solid var(--grey-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)' }}>📊 분류 기준</div><div style={{ fontSize: 12, color: '#2e7d32', fontWeight: 600 }}>🎯 {perfTableAgeData.count}개 항목</div></div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      {['channel', 'product', 'brand', 'promotion'].map((filterKey) => {
                        const labelMap: Record<string, string> = { channel: '채널', product: '제품', brand: '브랜드', promotion: '프로모션' }
                        const optionsMap: Record<string, string[]> = { channel: perfTableFilterOptions.channels, product: perfTableFilterOptions.products, brand: perfTableFilterOptions.brands, promotion: perfTableFilterOptions.promotions }
                        const options = optionsMap[filterKey] || []
                        const selected = perfTableState.age.filters[filterKey as keyof typeof perfTableState.age.filters] || []
                        const dropdownKey = `age_${filterKey}`
                        return (
                          <div key={filterKey} style={{ position: 'relative', minWidth: 180, flex: 1 }}>
                            <button type="button" onClick={() => setPerfTableDropdownOpen(prev => ({ ...prev, [dropdownKey]: !prev[dropdownKey] }))} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontWeight: 500 }}>{labelMap[filterKey]}_전체</span><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, background: 'var(--grey-200)', padding: '2px 8px', borderRadius: 10 }}>{selected.length}개</span><span style={{ fontSize: 10 }}>▼</span></div></button>
                            {perfTableDropdownOpen[dropdownKey] && (<div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, maxHeight: 250, overflowY: 'auto', marginTop: 4 }}><div style={{ padding: '8px 10px', borderBottom: '1px solid var(--grey-200)', background: 'var(--grey-50)' }}><label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}><input type="checkbox" checked={selected.length === options.length && options.length > 0} onChange={(e) => updatePerfTableFilters('age', filterKey, e.target.checked ? [...options] : [])} style={{ marginRight: 10, width: 16, height: 16 }} />전체 선택</label></div>{options.map((value, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12 }}><input type="checkbox" checked={selected.includes(value)} onChange={(e) => { if (e.target.checked) { updatePerfTableFilters('age', filterKey, [...selected, value]) } else { updatePerfTableFilters('age', filterKey, selected.filter(v => v !== value)) }}} style={{ marginRight: 10, width: 16, height: 16 }} />{value}</label>))}</div>)}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    {perfTableAgeData.dataList.length === 0 ? (<div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--grey-500)' }}><div style={{ fontSize: 48, marginBottom: 16 }}>📊</div><div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>필터를 선택해주세요</div></div>) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 1200 }}><thead><tr style={{ background: 'var(--grey-100)' }}><th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: 700, border: '1px solid var(--grey-300)', background: 'var(--grey-200)', minWidth: 120, position: 'sticky', left: 0, zIndex: 10 }}>연령</th>{perfTableMetrics.map(metric => { const isSorted = (perfTableState.age as any).sortColumn === metric.key; const sortIcon = isSorted ? ((perfTableState.age as any).sortDirection === 'desc' ? ' ▼' : ' ▲') : ''; return <th key={metric.key} onClick={() => handlePerfTableSort('age', metric.key)} style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600, border: '1px solid var(--grey-300)', background: isSorted ? 'var(--primary-light)' : 'var(--grey-100)', cursor: 'pointer', whiteSpace: 'nowrap' }}>{metric.label}{sortIcon}</th> })}</tr></thead>
                        <tbody>{perfTableAgeData.dataList.map((item, index) => { const metricRanges: Record<string, { min: number, max: number }> = {}; perfTableMetrics.forEach(m => { let min = Infinity, max = -Infinity; perfTableAgeData.dataList.forEach(d => { const v = (d as any)[m.key] || 0; if (v < min) min = v; if (v > max) max = v }); metricRanges[m.key] = { min, max } }); const isInverseMetric = (key: string) => ['cpm', 'cpc', 'cpa'].includes(key); return (<tr key={index} style={{ background: index % 2 === 0 ? 'var(--paper)' : 'var(--grey-50)' }}><td style={{ padding: 10, fontWeight: 500, border: '1px solid var(--grey-300)', background: 'var(--grey-50)', position: 'sticky', left: 0, zIndex: 5 }}>{item.name}</td>{perfTableMetrics.map(metric => { const value = (item as any)[metric.key] || 0; const range = metricRanges[metric.key]; const bgColor = getPerfTableColorScale(value, range.min, range.max, isInverseMetric(metric.key)); return <td key={metric.key} style={{ padding: '10px 8px', textAlign: 'right', border: '1px solid var(--grey-300)', background: bgColor, fontVariantNumeric: 'tabular-nums' }}>{metric.format(value)}</td> })}</tr>) })}</tbody></table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 성별x연령 PIVOT 탭 */}
            {perfTableActiveTab === 'genderAge' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%)', borderRadius: 8, borderLeft: '4px solid #2196f3', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>📊</span><strong style={{ color: '#1976d2', fontSize: 13 }}>이 분석의 목적</strong></div>
                    <p style={{ margin: 0, fontSize: 12, color: '#424242', lineHeight: 1.6 }}>성별과 연령대별 <strong style={{ color: '#1565c0' }}>교차 분석</strong>을 통해<br/>가장 효과적인 타겟 그룹을 파악합니다</p>
                  </div>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: 8, borderLeft: '4px solid #4caf50', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>💡</span><strong style={{ color: '#388e3c', fontSize: 13 }}>사용 방법</strong></div>
                    <div style={{ fontSize: 12, color: '#424242', lineHeight: 1.6 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>1</span><span>분류 기준 드롭다운에서 필터 선택</span></div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>2</span><span>색상 스케일로 높은/낮은 값 확인</span></div>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div style={{ marginBottom: 20, borderBottom: '2px solid var(--grey-200)', paddingBottom: 16 }}>
                    <div className="card-title" style={{ marginBottom: 4 }}>성별 × 연령대 성과 분석</div>
                    <p style={{ color: 'var(--grey-600)', fontSize: 13, margin: 0 }}>성별과 연령대의 교차 분석으로 최적의 타겟을 발견하세요. 모든 주요 지표(비용, CPM, CPC, CPA, ROAS)를 한눈에 비교할 수 있습니다.</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}><div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)', marginBottom: 12 }}>📅 기간 선택</div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><input type="date" value={perfTableState.genderAge.startDate} onChange={(e) => handlePerfTableDateChange('genderAge', true, e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13 }} /><span style={{ color: 'var(--grey-600)', fontWeight: 500 }}>~</span><input type="date" value={perfTableState.genderAge.endDate} onChange={(e) => handlePerfTableDateChange('genderAge', false, e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13 }} /></div></div></div>
                  <div style={{ marginBottom: 20, padding: 16, background: 'var(--grey-50)', borderRadius: 8, border: '1px solid var(--grey-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)' }}>📊 분류 기준</div></div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      {['channel', 'product', 'brand', 'promotion'].map((filterKey) => {
                        const labelMap: Record<string, string> = { channel: '채널', product: '제품', brand: '브랜드', promotion: '프로모션' }
                        const optionsMap: Record<string, string[]> = { channel: perfTableFilterOptions.channels, product: perfTableFilterOptions.products, brand: perfTableFilterOptions.brands, promotion: perfTableFilterOptions.promotions }
                        const options = optionsMap[filterKey] || []
                        const selected = perfTableState.genderAge.filters[filterKey as keyof typeof perfTableState.genderAge.filters] || []
                        const dropdownKey = `genderAge_${filterKey}`
                        return (
                          <div key={filterKey} style={{ position: 'relative', minWidth: 180, flex: 1 }}>
                            <button type="button" onClick={() => setPerfTableDropdownOpen(prev => ({ ...prev, [dropdownKey]: !prev[dropdownKey] }))} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontWeight: 500 }}>{labelMap[filterKey]}_전체</span><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, background: 'var(--grey-200)', padding: '2px 8px', borderRadius: 10 }}>{selected.length}개</span><span style={{ fontSize: 10 }}>▼</span></div></button>
                            {perfTableDropdownOpen[dropdownKey] && (<div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, maxHeight: 250, overflowY: 'auto', marginTop: 4 }}><div style={{ padding: '8px 10px', borderBottom: '1px solid var(--grey-200)', background: 'var(--grey-50)' }}><label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}><input type="checkbox" checked={selected.length === options.length && options.length > 0} onChange={(e) => updatePerfTableFilters('genderAge', filterKey, e.target.checked ? [...options] : [])} style={{ marginRight: 10, width: 16, height: 16 }} />전체 선택</label></div>{options.map((value, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12 }}><input type="checkbox" checked={selected.includes(value)} onChange={(e) => { if (e.target.checked) { updatePerfTableFilters('genderAge', filterKey, [...selected, value]) } else { updatePerfTableFilters('genderAge', filterKey, selected.filter(v => v !== value)) }}} style={{ marginRight: 10, width: 16, height: 16 }} />{value}</label>))}</div>)}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div id="perfTableGenderAgeContainer" style={{ overflowX: 'auto', overflowY: 'visible' }}>
                    {perfTableGenderAgeData.genders.length === 0 || perfTableGenderAgeData.ages.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--grey-500)' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{perfTableGenderAgeData.allFiltersEmpty ? '필터를 선택해주세요' : '데이터를 표시할 수 없습니다'}</div>
                        <div style={{ fontSize: 13, color: 'var(--grey-400)' }}>{perfTableGenderAgeData.allFiltersEmpty ? '위의 분류 기준에서 하나 이상의 항목을 선택해주세요.' : '필터 조건에 맞는 데이터가 없습니다.'}</div>
                      </div>
                    ) : (
                      <>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                          <thead>
                            <tr style={{ background: 'var(--grey-100)' }}><th rowSpan={2} style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, border: '1px solid var(--grey-300)', background: 'var(--grey-200)', width: 70 }}>연령</th>
                              {[{ key: 'cost', label: '비용' }, { key: 'cpm', label: 'CPM' }, { key: 'cpc', label: 'CPC' }, { key: 'cpa', label: 'CPA' }, { key: 'roas', label: 'ROAS' }].map(metric => (<th key={metric.key} colSpan={2} style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 700, border: '1px solid var(--grey-300)', background: 'var(--primary-light)', color: 'var(--primary-dark)', fontSize: 11 }}>{metric.label}</th>))}
                            </tr>
                            <tr style={{ background: 'var(--grey-50)' }}>{[{ key: 'cost', label: '비용' }, { key: 'cpm', label: 'CPM' }, { key: 'cpc', label: 'CPC' }, { key: 'cpa', label: 'CPA' }, { key: 'roas', label: 'ROAS' }].map(metric => perfTableGenderAgeData.genders.map(gender => (<th key={`${metric.key}_${gender}`} style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600, border: '1px solid var(--grey-300)', fontSize: 10 }}>{gender === '남성' ? '남' : '여'}</th>)))}</tr>
                          </thead>
                          <tbody>
                            {perfTableGenderAgeData.ages.map((age, ageIndex) => (<tr key={age} style={{ background: ageIndex % 2 === 0 ? 'var(--paper)' : 'var(--grey-50)' }}><td style={{ padding: '8px 6px', fontWeight: 600, textAlign: 'center', border: '1px solid var(--grey-300)', background: 'var(--grey-100)', fontSize: 11 }}>{age}</td>
                              {[{ key: 'cost', label: '비용', format: (v: number) => formatCurrency(v) }, { key: 'cpm', label: 'CPM', format: (v: number) => formatCurrency(v) }, { key: 'cpc', label: 'CPC', format: (v: number) => formatCurrency(v) }, { key: 'cpa', label: 'CPA', format: (v: number) => formatCurrency(v) }, { key: 'roas', label: 'ROAS', format: (v: number) => v.toFixed(1) + '%' }].map(metric => perfTableGenderAgeData.genders.map(gender => {
                                const data = (perfTableGenderAgeData.pivotData as Record<string, { gender: string; age: string; cost: number; revenue: number; conversions: number; impressions: number; clicks: number; roas: number; cpm: number; cpc: number; cpa: number }>)[`${gender}_${age}`]
                                if (data) {
                                  const value = (data as any)[metric.key]
                                  const allValues = Object.values(perfTableGenderAgeData.pivotData).map(d => (d as any)[metric.key])
                                  const min = Math.min(...allValues), max = Math.max(...allValues)
                                  const bgColor = getPerfTableColorScale(value, min, max, false)
                                  return <td key={`${metric.key}_${gender}`} style={{ padding: '6px 4px', textAlign: 'right', background: bgColor, border: '1px solid var(--grey-300)', fontWeight: 500, fontSize: 10, whiteSpace: 'nowrap' }} title={`${gender} / ${age}\n${metric.label}: ${metric.format(value)}\n비용: ${formatCurrency(data.cost)}\nCPM: ${formatCurrency(data.cpm)}\nCPC: ${formatCurrency(data.cpc)}\nCPA: ${formatCurrency(data.cpa)}\nROAS: ${data.roas.toFixed(1)}%`}>{metric.format(value)}</td>
                                }
                                return <td key={`${metric.key}_${gender}`} style={{ padding: '6px 4px', textAlign: 'center', background: 'var(--grey-50)', border: '1px solid var(--grey-300)', color: 'var(--grey-400)', fontSize: 10 }}>-</td>
                              }))}
                            </tr>))}
                          </tbody>
                        </table>
                        {perfTableGenderAgeData.totalStats && (
                          <div style={{ marginTop: 20, padding: 16, background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--secondary-light) 100%)', borderRadius: 8, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                            <div style={{ textAlign: 'center', padding: 12, background: 'white', borderRadius: 6 }}><div style={{ fontSize: 11, color: 'var(--grey-600)', marginBottom: 4 }}>전체 비용</div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--grey-900)' }}>{formatCurrency(perfTableGenderAgeData.totalStats.totalCost)}</div></div>
                            <div style={{ textAlign: 'center', padding: 12, background: 'white', borderRadius: 6 }}><div style={{ fontSize: 11, color: 'var(--grey-600)', marginBottom: 4 }}>평균 CPM</div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--grey-900)' }}>{formatCurrency(perfTableGenderAgeData.totalStats.avgCpm)}</div></div>
                            <div style={{ textAlign: 'center', padding: 12, background: 'white', borderRadius: 6 }}><div style={{ fontSize: 11, color: 'var(--grey-600)', marginBottom: 4 }}>평균 CPC</div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--grey-900)' }}>{formatCurrency(perfTableGenderAgeData.totalStats.avgCpc)}</div></div>
                            <div style={{ textAlign: 'center', padding: 12, background: 'white', borderRadius: 6 }}><div style={{ fontSize: 11, color: 'var(--grey-600)', marginBottom: 4 }}>평균 CPA</div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--grey-900)' }}>{formatCurrency(perfTableGenderAgeData.totalStats.avgCpa)}</div></div>
                            <div style={{ textAlign: 'center', padding: 12, background: 'white', borderRadius: 6 }}><div style={{ fontSize: 11, color: 'var(--grey-600)', marginBottom: 4 }}>전체 ROAS</div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary-main)' }}>{perfTableGenderAgeData.totalStats.avgRoas.toFixed(1)}%</div></div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 플랫폼 탭 */}
            {perfTableActiveTab === 'platform' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%)', borderRadius: 8, borderLeft: '4px solid #2196f3', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>📊</span><strong style={{ color: '#1976d2', fontSize: 13 }}>이 분석의 목적</strong></div>
                    <p style={{ margin: 0, fontSize: 12, color: '#424242', lineHeight: 1.6 }}>플랫폼별 <strong style={{ color: '#1565c0' }}>상세 성과 지표</strong>를 테이블 형식으로<br/>정렬하고 비교할 수 있습니다</p>
                  </div>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: 8, borderLeft: '4px solid #4caf50', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>💡</span><strong style={{ color: '#388e3c', fontSize: 13 }}>사용 방법</strong></div>
                    <div style={{ fontSize: 12, color: '#424242', lineHeight: 1.6 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>1</span><span>드롭다운에서 원하는 필터 선택</span></div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>2</span><span>컬럼 헤더 클릭으로 정렬</span></div>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '2px solid var(--grey-200)', paddingBottom: 16 }}><div><div className="card-title" style={{ marginBottom: 4 }}>플랫폼별 성과 테이블</div><p style={{ color: 'var(--grey-600)', fontSize: 13, margin: 0 }}>플랫폼별 상세 지표를 테이블로 확인할 수 있습니다.</p></div></div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}><div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)', marginBottom: 12 }}>📅 기간 선택</div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><input type="date" value={perfTableState.platform.startDate} onChange={(e) => handlePerfTableDateChange('platform', true, e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13 }} /><span style={{ color: 'var(--grey-600)', fontWeight: 500 }}>~</span><input type="date" value={perfTableState.platform.endDate} onChange={(e) => handlePerfTableDateChange('platform', false, e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13 }} /></div></div></div>
                  <div style={{ marginBottom: 20, padding: 16, background: 'var(--grey-50)', borderRadius: 8, border: '1px solid var(--grey-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)' }}>📊 분류 기준</div><div style={{ fontSize: 12, color: '#2e7d32', fontWeight: 600 }}>🎯 {perfTablePlatformData.count}개 항목</div></div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      {['channel', 'product', 'brand', 'promotion'].map((filterKey) => {
                        const labelMap: Record<string, string> = { channel: '채널', product: '제품', brand: '브랜드', promotion: '프로모션' }
                        const optionsMap: Record<string, string[]> = { channel: perfTableFilterOptions.channels, product: perfTableFilterOptions.products, brand: perfTableFilterOptions.brands, promotion: perfTableFilterOptions.promotions }
                        const options = optionsMap[filterKey] || []
                        const selected = perfTableState.platform.filters[filterKey as keyof typeof perfTableState.platform.filters] || []
                        const dropdownKey = `platform_${filterKey}`
                        return (
                          <div key={filterKey} style={{ position: 'relative', minWidth: 180, flex: 1 }}>
                            <button type="button" onClick={() => setPerfTableDropdownOpen(prev => ({ ...prev, [dropdownKey]: !prev[dropdownKey] }))} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontWeight: 500 }}>{labelMap[filterKey]}_전체</span><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, background: 'var(--grey-200)', padding: '2px 8px', borderRadius: 10 }}>{selected.length}개</span><span style={{ fontSize: 10 }}>▼</span></div></button>
                            {perfTableDropdownOpen[dropdownKey] && (<div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, maxHeight: 250, overflowY: 'auto', marginTop: 4 }}><div style={{ padding: '8px 10px', borderBottom: '1px solid var(--grey-200)', background: 'var(--grey-50)' }}><label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}><input type="checkbox" checked={selected.length === options.length && options.length > 0} onChange={(e) => updatePerfTableFilters('platform', filterKey, e.target.checked ? [...options] : [])} style={{ marginRight: 10, width: 16, height: 16 }} />전체 선택</label></div>{options.map((value, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12 }}><input type="checkbox" checked={selected.includes(value)} onChange={(e) => { if (e.target.checked) { updatePerfTableFilters('platform', filterKey, [...selected, value]) } else { updatePerfTableFilters('platform', filterKey, selected.filter(v => v !== value)) }}} style={{ marginRight: 10, width: 16, height: 16 }} />{value}</label>))}</div>)}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    {perfTablePlatformData.dataList.length === 0 ? (<div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--grey-500)' }}><div style={{ fontSize: 48, marginBottom: 16 }}>📊</div><div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>필터를 선택해주세요</div></div>) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 1200 }}><thead><tr style={{ background: 'var(--grey-100)' }}><th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: 700, border: '1px solid var(--grey-300)', background: 'var(--grey-200)', minWidth: 120, position: 'sticky', left: 0, zIndex: 10 }}>플랫폼</th>{perfTableMetrics.map(metric => { const isSorted = (perfTableState.platform as any).sortColumn === metric.key; const sortIcon = isSorted ? ((perfTableState.platform as any).sortDirection === 'desc' ? ' ▼' : ' ▲') : ''; return <th key={metric.key} onClick={() => handlePerfTableSort('platform', metric.key)} style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600, border: '1px solid var(--grey-300)', background: isSorted ? 'var(--primary-light)' : 'var(--grey-100)', cursor: 'pointer', whiteSpace: 'nowrap' }}>{metric.label}{sortIcon}</th> })}</tr></thead>
                        <tbody>{perfTablePlatformData.dataList.map((item, index) => { const metricRanges: Record<string, { min: number, max: number }> = {}; perfTableMetrics.forEach(m => { let min = Infinity, max = -Infinity; perfTablePlatformData.dataList.forEach(d => { const v = (d as any)[m.key] || 0; if (v < min) min = v; if (v > max) max = v }); metricRanges[m.key] = { min, max } }); const isInverseMetric = (key: string) => ['cpm', 'cpc', 'cpa'].includes(key); return (<tr key={index} style={{ background: index % 2 === 0 ? 'var(--paper)' : 'var(--grey-50)' }}><td style={{ padding: 10, fontWeight: 500, border: '1px solid var(--grey-300)', background: 'var(--grey-50)', position: 'sticky', left: 0, zIndex: 5 }}>{item.name}</td>{perfTableMetrics.map(metric => { const value = (item as any)[metric.key] || 0; const range = metricRanges[metric.key]; const bgColor = getPerfTableColorScale(value, range.min, range.max, isInverseMetric(metric.key)); return <td key={metric.key} style={{ padding: '10px 8px', textAlign: 'right', border: '1px solid var(--grey-300)', background: bgColor, fontVariantNumeric: 'tabular-nums' }}>{metric.format(value)}</td> })}</tr>) })}</tbody></table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 기기플랫폼 탭 */}
            {perfTableActiveTab === 'devicePlatform' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%)', borderRadius: 8, borderLeft: '4px solid #2196f3', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>📊</span><strong style={{ color: '#1976d2', fontSize: 13 }}>이 분석의 목적</strong></div>
                    <p style={{ margin: 0, fontSize: 12, color: '#424242', lineHeight: 1.6 }}>기기플랫폼별 <strong style={{ color: '#1565c0' }}>상세 성과 지표</strong>를 테이블 형식으로<br/>정렬하고 비교할 수 있습니다</p>
                  </div>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: 8, borderLeft: '4px solid #4caf50', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>💡</span><strong style={{ color: '#388e3c', fontSize: 13 }}>사용 방법</strong></div>
                    <div style={{ fontSize: 12, color: '#424242', lineHeight: 1.6 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>1</span><span>드롭다운에서 원하는 필터 선택</span></div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>2</span><span>컬럼 헤더 클릭으로 정렬</span></div>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '2px solid var(--grey-200)', paddingBottom: 16 }}><div><div className="card-title" style={{ marginBottom: 4 }}>기기플랫폼별 성과 테이블</div><p style={{ color: 'var(--grey-600)', fontSize: 13, margin: 0 }}>기기플랫폼별 상세 지표를 테이블로 확인할 수 있습니다.</p></div></div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}><div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)', marginBottom: 12 }}>📅 기간 선택</div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><input type="date" value={perfTableState.devicePlatform.startDate} onChange={(e) => handlePerfTableDateChange('devicePlatform', true, e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13 }} /><span style={{ color: 'var(--grey-600)', fontWeight: 500 }}>~</span><input type="date" value={perfTableState.devicePlatform.endDate} onChange={(e) => handlePerfTableDateChange('devicePlatform', false, e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13 }} /></div></div></div>
                  <div style={{ marginBottom: 20, padding: 16, background: 'var(--grey-50)', borderRadius: 8, border: '1px solid var(--grey-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)' }}>📊 분류 기준</div><div style={{ fontSize: 12, color: '#2e7d32', fontWeight: 600 }}>🎯 {perfTableDevicePlatformData.count}개 항목</div></div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      {['channel', 'product', 'brand', 'promotion'].map((filterKey) => {
                        const labelMap: Record<string, string> = { channel: '채널', product: '제품', brand: '브랜드', promotion: '프로모션' }
                        const optionsMap: Record<string, string[]> = { channel: perfTableFilterOptions.channels, product: perfTableFilterOptions.products, brand: perfTableFilterOptions.brands, promotion: perfTableFilterOptions.promotions }
                        const options = optionsMap[filterKey] || []
                        const selected = perfTableState.devicePlatform.filters[filterKey as keyof typeof perfTableState.devicePlatform.filters] || []
                        const dropdownKey = `devicePlatform_${filterKey}`
                        return (
                          <div key={filterKey} style={{ position: 'relative', minWidth: 180, flex: 1 }}>
                            <button type="button" onClick={() => setPerfTableDropdownOpen(prev => ({ ...prev, [dropdownKey]: !prev[dropdownKey] }))} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontWeight: 500 }}>{labelMap[filterKey]}_전체</span><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, background: 'var(--grey-200)', padding: '2px 8px', borderRadius: 10 }}>{selected.length}개</span><span style={{ fontSize: 10 }}>▼</span></div></button>
                            {perfTableDropdownOpen[dropdownKey] && (<div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, maxHeight: 250, overflowY: 'auto', marginTop: 4 }}><div style={{ padding: '8px 10px', borderBottom: '1px solid var(--grey-200)', background: 'var(--grey-50)' }}><label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}><input type="checkbox" checked={selected.length === options.length && options.length > 0} onChange={(e) => updatePerfTableFilters('devicePlatform', filterKey, e.target.checked ? [...options] : [])} style={{ marginRight: 10, width: 16, height: 16 }} />전체 선택</label></div>{options.map((value, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12 }}><input type="checkbox" checked={selected.includes(value)} onChange={(e) => { if (e.target.checked) { updatePerfTableFilters('devicePlatform', filterKey, [...selected, value]) } else { updatePerfTableFilters('devicePlatform', filterKey, selected.filter(v => v !== value)) }}} style={{ marginRight: 10, width: 16, height: 16 }} />{value}</label>))}</div>)}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    {perfTableDevicePlatformData.dataList.length === 0 ? (<div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--grey-500)' }}><div style={{ fontSize: 48, marginBottom: 16 }}>📊</div><div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>필터를 선택해주세요</div></div>) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 1200 }}><thead><tr style={{ background: 'var(--grey-100)' }}><th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: 700, border: '1px solid var(--grey-300)', background: 'var(--grey-200)', minWidth: 120, position: 'sticky', left: 0, zIndex: 10 }}>기기플랫폼</th>{perfTableMetrics.map(metric => { const isSorted = (perfTableState.devicePlatform as any).sortColumn === metric.key; const sortIcon = isSorted ? ((perfTableState.devicePlatform as any).sortDirection === 'desc' ? ' ▼' : ' ▲') : ''; return <th key={metric.key} onClick={() => handlePerfTableSort('devicePlatform', metric.key)} style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600, border: '1px solid var(--grey-300)', background: isSorted ? 'var(--primary-light)' : 'var(--grey-100)', cursor: 'pointer', whiteSpace: 'nowrap' }}>{metric.label}{sortIcon}</th> })}</tr></thead>
                        <tbody>{perfTableDevicePlatformData.dataList.map((item, index) => { const metricRanges: Record<string, { min: number, max: number }> = {}; perfTableMetrics.forEach(m => { let min = Infinity, max = -Infinity; perfTableDevicePlatformData.dataList.forEach(d => { const v = (d as any)[m.key] || 0; if (v < min) min = v; if (v > max) max = v }); metricRanges[m.key] = { min, max } }); const isInverseMetric = (key: string) => ['cpm', 'cpc', 'cpa'].includes(key); return (<tr key={index} style={{ background: index % 2 === 0 ? 'var(--paper)' : 'var(--grey-50)' }}><td style={{ padding: 10, fontWeight: 500, border: '1px solid var(--grey-300)', background: 'var(--grey-50)', position: 'sticky', left: 0, zIndex: 5 }}>{item.name}</td>{perfTableMetrics.map(metric => { const value = (item as any)[metric.key] || 0; const range = metricRanges[metric.key]; const bgColor = getPerfTableColorScale(value, range.min, range.max, isInverseMetric(metric.key)); return <td key={metric.key} style={{ padding: '10px 8px', textAlign: 'right', border: '1px solid var(--grey-300)', background: bgColor, fontVariantNumeric: 'tabular-nums' }}>{metric.format(value)}</td> })}</tr>) })}</tbody></table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 기기 탭 */}
            {perfTableActiveTab === 'deviceType' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%)', borderRadius: 8, borderLeft: '4px solid #2196f3', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>📊</span><strong style={{ color: '#1976d2', fontSize: 13 }}>이 분석의 목적</strong></div>
                    <p style={{ margin: 0, fontSize: 12, color: '#424242', lineHeight: 1.6 }}>기기유형별 <strong style={{ color: '#1565c0' }}>상세 성과 지표</strong>를 테이블 형식으로<br/>정렬하고 비교할 수 있습니다</p>
                  </div>
                  <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: 8, borderLeft: '4px solid #4caf50', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>💡</span><strong style={{ color: '#388e3c', fontSize: 13 }}>사용 방법</strong></div>
                    <div style={{ fontSize: 12, color: '#424242', lineHeight: 1.6 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>1</span><span>드롭다운에서 원하는 필터 선택</span></div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>2</span><span>컬럼 헤더 클릭으로 정렬</span></div>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '2px solid var(--grey-200)', paddingBottom: 16 }}><div><div className="card-title" style={{ marginBottom: 4 }}>기기유형별 성과 테이블</div><p style={{ color: 'var(--grey-600)', fontSize: 13, margin: 0 }}>기기유형별 상세 지표를 테이블로 확인할 수 있습니다.</p></div></div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}><div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)', marginBottom: 12 }}>📅 기간 선택</div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><input type="date" value={perfTableState.deviceType.startDate} onChange={(e) => handlePerfTableDateChange('deviceType', true, e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13 }} /><span style={{ color: 'var(--grey-600)', fontWeight: 500 }}>~</span><input type="date" value={perfTableState.deviceType.endDate} onChange={(e) => handlePerfTableDateChange('deviceType', false, e.target.value)} style={{ padding: '10px 12px', border: '1px solid var(--grey-300)', borderRadius: 6, background: 'white', fontSize: 13 }} /></div></div></div>
                  <div style={{ marginBottom: 20, padding: 16, background: 'var(--grey-50)', borderRadius: 8, border: '1px solid var(--grey-200)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--grey-700)' }}>📊 분류 기준</div><div style={{ fontSize: 12, color: '#2e7d32', fontWeight: 600 }}>🎯 {perfTableDeviceTypeData.count}개 항목</div></div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      {['channel', 'product', 'brand', 'promotion'].map((filterKey) => {
                        const labelMap: Record<string, string> = { channel: '채널', product: '제품', brand: '브랜드', promotion: '프로모션' }
                        const optionsMap: Record<string, string[]> = { channel: perfTableFilterOptions.channels, product: perfTableFilterOptions.products, brand: perfTableFilterOptions.brands, promotion: perfTableFilterOptions.promotions }
                        const options = optionsMap[filterKey] || []
                        const selected = perfTableState.deviceType.filters[filterKey as keyof typeof perfTableState.deviceType.filters] || []
                        const dropdownKey = `deviceType_${filterKey}`
                        return (
                          <div key={filterKey} style={{ position: 'relative', minWidth: 180, flex: 1 }}>
                            <button type="button" onClick={() => setPerfTableDropdownOpen(prev => ({ ...prev, [dropdownKey]: !prev[dropdownKey] }))} style={{ width: '100%', padding: '10px 14px', background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, fontSize: 13, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontWeight: 500 }}>{labelMap[filterKey]}_전체</span><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11, background: 'var(--grey-200)', padding: '2px 8px', borderRadius: 10 }}>{selected.length}개</span><span style={{ fontSize: 10 }}>▼</span></div></button>
                            {perfTableDropdownOpen[dropdownKey] && (<div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--grey-300)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, maxHeight: 250, overflowY: 'auto', marginTop: 4 }}><div style={{ padding: '8px 10px', borderBottom: '1px solid var(--grey-200)', background: 'var(--grey-50)' }}><label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}><input type="checkbox" checked={selected.length === options.length && options.length > 0} onChange={(e) => updatePerfTableFilters('deviceType', filterKey, e.target.checked ? [...options] : [])} style={{ marginRight: 10, width: 16, height: 16 }} />전체 선택</label></div>{options.map((value, idx) => (<label key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', fontSize: 12 }}><input type="checkbox" checked={selected.includes(value)} onChange={(e) => { if (e.target.checked) { updatePerfTableFilters('deviceType', filterKey, [...selected, value]) } else { updatePerfTableFilters('deviceType', filterKey, selected.filter(v => v !== value)) }}} style={{ marginRight: 10, width: 16, height: 16 }} />{value}</label>))}</div>)}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    {perfTableDeviceTypeData.dataList.length === 0 ? (<div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--grey-500)' }}><div style={{ fontSize: 48, marginBottom: 16 }}>📊</div><div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>필터를 선택해주세요</div></div>) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 1200 }}><thead><tr style={{ background: 'var(--grey-100)' }}><th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: 700, border: '1px solid var(--grey-300)', background: 'var(--grey-200)', minWidth: 120, position: 'sticky', left: 0, zIndex: 10 }}>기기유형</th>{perfTableMetrics.map(metric => { const isSorted = (perfTableState.deviceType as any).sortColumn === metric.key; const sortIcon = isSorted ? ((perfTableState.deviceType as any).sortDirection === 'desc' ? ' ▼' : ' ▲') : ''; return <th key={metric.key} onClick={() => handlePerfTableSort('deviceType', metric.key)} style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600, border: '1px solid var(--grey-300)', background: isSorted ? 'var(--primary-light)' : 'var(--grey-100)', cursor: 'pointer', whiteSpace: 'nowrap' }}>{metric.label}{sortIcon}</th> })}</tr></thead>
                        <tbody>{perfTableDeviceTypeData.dataList.map((item, index) => { const metricRanges: Record<string, { min: number, max: number }> = {}; perfTableMetrics.forEach(m => { let min = Infinity, max = -Infinity; perfTableDeviceTypeData.dataList.forEach(d => { const v = (d as any)[m.key] || 0; if (v < min) min = v; if (v > max) max = v }); metricRanges[m.key] = { min, max } }); const isInverseMetric = (key: string) => ['cpm', 'cpc', 'cpa'].includes(key); return (<tr key={index} style={{ background: index % 2 === 0 ? 'var(--paper)' : 'var(--grey-50)' }}><td style={{ padding: 10, fontWeight: 500, border: '1px solid var(--grey-300)', background: 'var(--grey-50)', position: 'sticky', left: 0, zIndex: 5 }}>{item.name}</td>{perfTableMetrics.map(metric => { const value = (item as any)[metric.key] || 0; const range = metricRanges[metric.key]; const bgColor = getPerfTableColorScale(value, range.min, range.max, isInverseMetric(metric.key)); return <td key={metric.key} style={{ padding: '10px 8px', textAlign: 'right', border: '1px solid var(--grey-300)', background: bgColor, fontVariantNumeric: 'tabular-nums' }}>{metric.format(value)}</td> })}</tr>) })}</tbody></table>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ========== 성과 구분 비교 분석 섹션 (HTML 1:1) ========== */}
        <div className="collapsible-section" style={{ marginTop: 24 }}>
          <div className="collapsible-header" onClick={() => setPerfAnalysisExpanded(!perfAnalysisExpanded)}>
            <div className="collapsible-title"><span className="collapsible-icon">🏆</span><span>성과 구분 (브랜드/상품/프로모션/타겟팅) 비교 분석 - 비즈니스 현황을 빠르게 판단하세요</span></div>
            <button className="collapsible-toggle"><span>{perfAnalysisExpanded ? '접기' : '펼치기'}</span><span className={`collapsible-toggle-icon ${perfAnalysisExpanded ? '' : 'collapsed'}`}>▼</span></button>
          </div>
          <div className={`collapsible-content ${perfAnalysisExpanded ? 'expanded' : ''}`}>
            {/* 서브탭 버튼 */}
            <div className="view-type-section" style={{ marginBottom: 0, padding: '20px 24px' }}>
              <button className={`view-btn ${perfAnalysisActiveTab === 'brand' ? 'active' : ''}`} onClick={() => setPerfAnalysisActiveTab('brand')}>브랜드</button>
              <button className={`view-btn ${perfAnalysisActiveTab === 'product' ? 'active' : ''}`} onClick={() => setPerfAnalysisActiveTab('product')}>상품</button>
              <button className={`view-btn ${perfAnalysisActiveTab === 'promotion' ? 'active' : ''}`} onClick={() => setPerfAnalysisActiveTab('promotion')}>프로모션</button>
              <button className={`view-btn ${perfAnalysisActiveTab === 'targeting' ? 'active' : ''}`} onClick={() => setPerfAnalysisActiveTab('targeting')}>타겟팅</button>
            </div>

            {/* 분석 목적/사용 방법 카드 */}
            <div style={{ display: 'flex', gap: 16, padding: '20px 24px', background: '#fafafa', borderBottom: '1px solid #e9ecef' }}>
              <div style={{ flex: 1, padding: '14px 16px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%)', borderRadius: 8, borderLeft: '4px solid #2196f3', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>📊</span><strong style={{ color: '#1976d2', fontSize: 13 }}>이 분석의 목적</strong></div>
                <p style={{ margin: 0, fontSize: 12, color: '#424242', lineHeight: 1.6 }}><strong style={{ color: '#1565c0' }}>브랜드/상품/프로모션/타겟팅별 성과</strong>를 비교하여<br/>가장 효율적인 광고 요소를 파악할 수 있습니다</p>
              </div>
              <div style={{ flex: 1, padding: '14px 16px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: 8, borderLeft: '4px solid #4caf50', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ fontSize: 16 }}>💡</span><strong style={{ color: '#388e3c', fontSize: 13 }}>사용 방법</strong></div>
                <div style={{ fontSize: 12, color: '#424242', lineHeight: 1.6 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>1</span><span>상단 탭에서 분석할 항목 선택</span></div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4caf50', color: 'white', borderRadius: '50%', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>2</span><span>KPI 버튼으로 지표 변경, 비교 버튼으로 기간 비교</span></div>
                </div>
              </div>
            </div>

            {/* 각 탭별 컨텐츠 */}
            {(['brand', 'product', 'promotion', 'targeting'] as const).map(category => {
              const state = perfChartState[category]
              const chartData = getPerfChartData(category)
              const categoryLabel = { brand: '브랜드', product: '상품', promotion: '프로모션', targeting: '타겟팅' }[category]

              if (perfAnalysisActiveTab !== category) return null

              return (
                <div key={category} style={{ margin: 16 }}>
                  <div className="card" style={{ borderRadius: 12 }}>
                    {/* 지표 선택 + 정렬 + 기간 선택 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 20px', borderBottom: '1px solid #e9ecef' }}>
                      {/* 좌측: 지표 선택 + 정렬 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>📊 지표 선택</span>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <select value={state.kpi} onChange={(e) => handlePerfChartKpiChange(category, e.target.value)} style={{ padding: '8px 12px', border: '1px solid #dee2e6', borderRadius: 4, fontSize: 13, cursor: 'pointer', minWidth: 140, background: 'white' }}>
                            <option value="roas">ROAS</option>
                            <option value="cpa">CPA</option>
                            <option value="cost">비용</option>
                            <option value="conversions">전환수</option>
                            <option value="revenue">전환값</option>
                          </select>
                          <select value={state.sort} onChange={(e) => handlePerfChartSortChange(category, e.target.value)} style={{ padding: '8px 12px', border: '1px solid #dee2e6', borderRadius: 4, fontSize: 13, cursor: 'pointer', minWidth: 110, background: 'white' }}>
                            <option value="desc">내림차순</option>
                            <option value="asc">오름차순</option>
                          </select>
                        </div>
                      </div>
                      {/* 우측: 기간 선택 */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 13 }}>📅</span><span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>기간 선택</span></div>
                          <button onClick={() => handlePerfChartCompareToggle(category)} style={{ padding: '4px 12px', fontSize: 11, fontWeight: 600, border: `1px solid ${state.compareActive ? '#d32f2f' : '#673ab7'}`, borderRadius: 4, cursor: 'pointer', background: state.compareActive ? '#d32f2f' : 'white', color: state.compareActive ? 'white' : '#673ab7' }}>{state.compareActive ? '취소' : '비교'}</button>
                        </div>
                        {/* 기준 기간 행 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                          <span style={{ width: 12, height: 12, border: '2px solid #00C853', borderRadius: '50%', background: 'white', flexShrink: 0 }}></span>
                          <select onChange={(e) => e.target.value && handlePerfChartPresetChange(category, parseInt(e.target.value))} style={{ width: 120, padding: '8px 12px', border: '1px solid #dee2e6', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'white' }}>
                            <option value="">항목 선택</option>
                            <option value="7">최근 7일</option>
                            <option value="14">최근 14일</option>
                            <option value="30">최근 30일</option>
                          </select>
                          <input type="date" value={state.startDate} onChange={(e) => handlePerfChartDateChange(category, true, e.target.value)} style={{ width: 130, padding: '8px 12px', border: '1px solid #dee2e6', borderRadius: 8, fontSize: 13, color: '#666', background: 'white' }} />
                          <span style={{ width: 20, textAlign: 'center', color: '#999', fontSize: 13 }}>~</span>
                          <input type="date" value={state.endDate} onChange={(e) => handlePerfChartDateChange(category, false, e.target.value)} style={{ width: 130, padding: '8px 12px', border: '1px solid #dee2e6', borderRadius: 8, fontSize: 13, color: '#666', background: 'white' }} />
                        </div>
                        {/* 비교 기간 행 */}
                        {state.compareActive && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ width: 12, height: 12, border: '2px solid #dee2e6', borderRadius: '50%', background: 'white', flexShrink: 0 }}></span>
                            <select onChange={(e) => e.target.value && handlePerfChartPresetChange(category, parseInt(e.target.value), true)} style={{ width: 120, padding: '8px 12px', border: '1px solid #dee2e6', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'white' }}>
                              <option value="">항목 선택</option>
                              <option value="7">최근 7일</option>
                              <option value="14">최근 14일</option>
                              <option value="30">최근 30일</option>
                            </select>
                            <input type="date" value={state.startDateComp} onChange={(e) => handlePerfChartDateChange(category, true, e.target.value, true)} style={{ width: 130, padding: '8px 12px', border: '1px solid #dee2e6', borderRadius: 8, fontSize: 13, color: '#666', background: 'white' }} />
                            <span style={{ width: 20, textAlign: 'center', color: '#999', fontSize: 13 }}>~</span>
                            <input type="date" value={state.endDateComp} onChange={(e) => handlePerfChartDateChange(category, false, e.target.value, true)} style={{ width: 130, padding: '8px 12px', border: '1px solid #dee2e6', borderRadius: 8, fontSize: 13, color: '#666', background: 'white' }} />
                          </div>
                        )}
                      </div>
                    </div>
                    {/* 막대 그래프 */}
                    <div style={{ padding: 20 }}>
                      <div className="chart-container" style={{ height: 350 }}>
                        {chartData.labels.length > 0 ? (
                          <Bar
                            data={{
                              labels: chartData.labels,
                              datasets: state.compareActive && chartData.prevValues.some(v => v > 0) ? [
                                { label: '이전 기간', data: chartData.prevValues, backgroundColor: perfCompareColors.previous.bg, borderColor: perfCompareColors.previous.border, borderWidth: 1, borderRadius: 4 },
                                { label: '현재 기간', data: chartData.currentValues, backgroundColor: kpiColors[state.kpi]?.bg || kpiColors.roas.bg, borderColor: kpiColors[state.kpi]?.border || kpiColors.roas.border, borderWidth: 1, borderRadius: 4 }
                              ] : [
                                { label: kpiLabels[state.kpi] || state.kpi, data: chartData.currentValues, backgroundColor: kpiColors[state.kpi]?.bg || kpiColors.roas.bg, borderColor: kpiColors[state.kpi]?.border || kpiColors.roas.border, borderWidth: 1, borderRadius: 4 }
                              ]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              indexAxis: 'y' as const,
                              plugins: { legend: { display: state.compareActive }, datalabels: { display: false } },
                              scales: {
                                x: { beginAtZero: true, stacked: false },
                                y: { stacked: false, ticks: { font: { size: 11 }, callback: function(this: any, value: any) { const label = this.getLabelForValue(value); return label && label.length > 15 ? label.substring(0, 15) + '...' : label; } } }
                              }
                            }}
                          />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#757575' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>데이터가 없습니다</div>
                            <div style={{ fontSize: 13, color: '#9e9e9e' }}>기간을 선택하거나 데이터를 확인해주세요</div>
                          </div>
                        )}
                      </div>
                      {/* 더보기 버튼 */}
                      {chartData.totalCount > DETAIL_DEFAULT_LIMIT && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                          <button onClick={() => handlePerfChartShowMoreToggle(category)} style={{ padding: '8px 20px', fontSize: 13, fontWeight: 500, border: 'none', borderRadius: 6, cursor: 'pointer', background: state.showAll ? '#f5f5f5' : '#e3f2fd', color: state.showAll ? '#666' : '#1976d2' }}>
                            {state.showAll ? '접기' : `더보기 (+${chartData.totalCount - DETAIL_DEFAULT_LIMIT}개)`}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ========== 리타겟팅 분석 섹션 (HTML 1:1) ========== */}
        <div className="collapsible-section" style={{ marginTop: 24 }}>
          <div className="collapsible-header" onClick={() => setRetargetingExpanded(!retargetingExpanded)}>
            <div className="collapsible-title"><span className="collapsible-icon">🎯</span><span>리타겟팅 분석 - 리타겟팅 캠페인의 타겟을 확인하세요</span></div>
            <button className="collapsible-toggle"><span>{retargetingExpanded ? '접기' : '펼치기'}</span><span className={`collapsible-toggle-icon ${retargetingExpanded ? '' : 'collapsed'}`}>▼</span></button>
          </div>
          <div className={`collapsible-content ${retargetingExpanded ? 'expanded' : ''}`}>
            {/* 서브탭 버튼 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '16px 24px', background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
              {(['ageGender', 'device', 'platform', 'devicePlatform'] as const).map(tab => {
                const labels: Record<string, string> = { ageGender: '성별/연령', device: '기기별', platform: '플랫폼별', devicePlatform: '노출기기별' }
                const isActive = retargetingActiveTab === tab
                return (
                  <button key={tab} onClick={() => setRetargetingActiveTab(tab)} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, border: isActive ? 'none' : '1px solid #dee2e6', borderRadius: 20, cursor: 'pointer', transition: 'all 0.2s', background: isActive ? '#673ab7' : 'white', color: isActive ? 'white' : '#495057' }}>
                    {labels[tab]}
                  </button>
                )
              })}
            </div>

            {/* 성별/연령 리타겟팅 뷰 */}
            {retargetingActiveTab === 'ageGender' && (() => {
              const { sortedData, maxRoas, insightText } = getRetargetingTableData('ageGender')
              const sortState = retargetingSortState.ageGender
              return (
                <div>
                  <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #fce4ec 0%, #fff5f7 100%)', borderBottom: '1px solid #e9ecef' }}>
                    <div style={{ fontSize: 14, color: '#c2185b', fontWeight: 600, marginBottom: 8 }}>💡 성별/연령 타겟팅 인사이트</div>
                    <div style={{ fontSize: 13, color: '#424242', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: insightText || '로딩 중...' }} />
                  </div>
                  <div className="card" style={{ margin: 16, borderRadius: 12 }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e9ecef' }}>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--grey-800)', margin: 0 }}>성별/연령 조합별 성과</h4>
                      <p style={{ fontSize: 12, color: 'var(--grey-600)', margin: '4px 0 0 0' }}>어떤 연령대와 성별 조합이 가장 효과적인지 확인하세요</p>
                    </div>
                    <div style={{ padding: '16px 20px', overflowX: 'auto' }}>
                      <table className="data-table" style={{ marginTop: 0 }}>
                        <thead>
                          <tr>
                            <th style={{ minWidth: 140 }}>연령/성별</th>
                            {['roas', 'cpa', 'cost', 'conversions', 'revenue'].map(col => (
                              <th key={col} className="sortable-header" onClick={() => handleRetargetingSortChange('ageGender', col)} style={{ minWidth: col === 'cost' || col === 'revenue' ? 120 : col === 'conversions' ? 80 : 100, textAlign: 'right', cursor: 'pointer' }}>
                                {col === 'roas' ? 'ROAS' : col === 'cpa' ? 'CPA' : col === 'cost' ? '광고비' : col === 'conversions' ? '전환수' : '전환값'}
                                <div className={`sort-icon ${sortState.column === col ? 'active' : ''}`} style={{ display: 'inline-flex', marginLeft: 4 }}>
                                  <div className={`sort-arrow up ${sortState.column === col && sortState.direction === 'asc' ? 'active' : ''}`}></div>
                                  <div className={`sort-arrow down ${sortState.column === col && sortState.direction === 'desc' ? 'active' : ''}`}></div>
                                </div>
                              </th>
                            ))}
                            <th style={{ minWidth: 80, textAlign: 'center' }}>효율등급</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedData.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: 'var(--grey-500)' }}>데이터가 없습니다</td></tr>
                          ) : sortedData.map((item: any, idx: number) => {
                            const genderIcon = item.gender === '남성' ? '👨' : '👩'
                            const roasColor = item.roas >= 50 ? '#2e7d32' : item.roas >= 20 ? '#1565c0' : '#d32f2f'
                            return (
                              <tr key={idx}>
                                <td style={{ fontWeight: 500 }}>{genderIcon} {item.label || (item.age + ' ' + item.gender)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: roasColor }}>{formatPercent(item.roas)}</td>
                                <td style={{ textAlign: 'right' }}>{item.cpa > 0 ? formatCurrency(item.cpa) : '-'}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(item.cost)}</td>
                                <td style={{ textAlign: 'right' }}>{formatNumber(item.conversions)}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(item.revenue)}</td>
                                <td style={{ textAlign: 'center' }}>{getEfficiencyGrade(item.roas, maxRoas)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* 기기별 리타겟팅 뷰 */}
            {retargetingActiveTab === 'device' && (() => {
              const { sortedData, maxRoas, insightText } = getRetargetingTableData('device')
              const sortState = retargetingSortState.device
              return (
                <div>
                  <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f5f9ff 100%)', borderBottom: '1px solid #e9ecef' }}>
                    <div style={{ fontSize: 14, color: '#1565c0', fontWeight: 600, marginBottom: 8 }}>💡 기기별 리타겟팅 인사이트</div>
                    <div style={{ fontSize: 13, color: '#424242', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: insightText || '로딩 중...' }} />
                  </div>
                  <div className="card" style={{ margin: 16, borderRadius: 12 }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e9ecef' }}>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--grey-800)', margin: 0 }}>기기별 리타겟팅 성과</h4>
                      <p style={{ fontSize: 12, color: 'var(--grey-600)', margin: '4px 0 0 0' }}>Android, iPhone, Computers, Tablets 등 기기별 광고 효율</p>
                    </div>
                    <div style={{ padding: '16px 20px', overflowX: 'auto' }}>
                      <table className="data-table" style={{ marginTop: 0 }}>
                        <thead>
                          <tr>
                            <th style={{ minWidth: 150 }}>기기</th>
                            {['roas', 'cpa', 'cost', 'conversions', 'revenue'].map(col => (
                              <th key={col} className="sortable-header" onClick={() => handleRetargetingSortChange('device', col)} style={{ minWidth: col === 'cost' || col === 'revenue' ? 120 : col === 'conversions' ? 80 : 100, textAlign: 'right', cursor: 'pointer' }}>
                                {col === 'roas' ? 'ROAS' : col === 'cpa' ? 'CPA' : col === 'cost' ? '광고비' : col === 'conversions' ? '전환수' : '전환값'}
                                <div className={`sort-icon ${sortState.column === col ? 'active' : ''}`} style={{ display: 'inline-flex', marginLeft: 4 }}>
                                  <div className={`sort-arrow up ${sortState.column === col && sortState.direction === 'asc' ? 'active' : ''}`}></div>
                                  <div className={`sort-arrow down ${sortState.column === col && sortState.direction === 'desc' ? 'active' : ''}`}></div>
                                </div>
                              </th>
                            ))}
                            <th style={{ minWidth: 80, textAlign: 'center' }}>효율등급</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedData.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: 'var(--grey-500)' }}>데이터가 없습니다</td></tr>
                          ) : sortedData.map((item: any, idx: number) => {
                            const roasColor = item.roas >= 200 ? '#2e7d32' : item.roas >= 100 ? '#1565c0' : '#d32f2f'
                            return (
                              <tr key={idx}>
                                <td style={{ fontWeight: 500 }}>{getDeviceIcon(item.device)} {item.device}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: roasColor }}>{formatPercent(item.roas)}</td>
                                <td style={{ textAlign: 'right' }}>{item.cpa > 0 ? formatCurrency(item.cpa) : '-'}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(item.cost)}</td>
                                <td style={{ textAlign: 'right' }}>{formatNumber(item.conversions)}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(item.revenue)}</td>
                                <td style={{ textAlign: 'center' }}>{getEfficiencyGrade(item.roas, maxRoas)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* 플랫폼별 리타겟팅 뷰 */}
            {retargetingActiveTab === 'platform' && (() => {
              const { sortedData, maxRoas, insightText } = getRetargetingTableData('platform')
              const sortState = retargetingSortState.platform
              return (
                <div>
                  <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #f3e5f5 0%, #faf5ff 100%)', borderBottom: '1px solid #e9ecef' }}>
                    <div style={{ fontSize: 14, color: '#7b1fa2', fontWeight: 600, marginBottom: 8 }}>💡 플랫폼별 리타겟팅 인사이트</div>
                    <div style={{ fontSize: 13, color: '#424242', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: insightText || '로딩 중...' }} />
                  </div>
                  <div className="card" style={{ margin: 16, borderRadius: 12 }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e9ecef' }}>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--grey-800)', margin: 0 }}>플랫폼별 리타겟팅 성과</h4>
                      <p style={{ fontSize: 12, color: 'var(--grey-600)', margin: '4px 0 0 0' }}>Cross-network, YouTube, Display 등 플랫폼별 광고 효율</p>
                    </div>
                    <div style={{ padding: '16px 20px', overflowX: 'auto' }}>
                      <table className="data-table" style={{ marginTop: 0 }}>
                        <thead>
                          <tr>
                            <th style={{ minWidth: 140 }}>플랫폼</th>
                            {['roas', 'cpa', 'cost', 'conversions', 'revenue'].map(col => (
                              <th key={col} className="sortable-header" onClick={() => handleRetargetingSortChange('platform', col)} style={{ minWidth: col === 'cost' || col === 'revenue' ? 120 : col === 'conversions' ? 80 : 100, textAlign: 'right', cursor: 'pointer' }}>
                                {col === 'roas' ? 'ROAS' : col === 'cpa' ? 'CPA' : col === 'cost' ? '광고비' : col === 'conversions' ? '전환수' : '전환값'}
                                <div className={`sort-icon ${sortState.column === col ? 'active' : ''}`} style={{ display: 'inline-flex', marginLeft: 4 }}>
                                  <div className={`sort-arrow up ${sortState.column === col && sortState.direction === 'asc' ? 'active' : ''}`}></div>
                                  <div className={`sort-arrow down ${sortState.column === col && sortState.direction === 'desc' ? 'active' : ''}`}></div>
                                </div>
                              </th>
                            ))}
                            <th style={{ minWidth: 80, textAlign: 'center' }}>효율등급</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedData.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: 'var(--grey-500)' }}>데이터가 없습니다</td></tr>
                          ) : sortedData.map((item: any, idx: number) => {
                            const roasColor = item.roas >= 150 ? '#2e7d32' : item.roas >= 50 ? '#1565c0' : item.roas > 0 ? '#e65100' : '#9e9e9e'
                            return (
                              <tr key={idx}>
                                <td style={{ fontWeight: 500 }}>{getPlatformIcon(item.platform)} {item.platform}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: roasColor }}>{item.roas > 0 ? formatPercent(item.roas) : '-'}</td>
                                <td style={{ textAlign: 'right' }}>{item.cpa > 0 ? formatCurrency(item.cpa) : '-'}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(item.cost)}</td>
                                <td style={{ textAlign: 'right' }}>{formatNumber(item.conversions)}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(item.revenue)}</td>
                                <td style={{ textAlign: 'center' }}>{item.roas > 0 ? getEfficiencyGrade(item.roas, maxRoas) : <span style={{ background: '#f5f5f5', color: '#9e9e9e', padding: '4px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>-</span>}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* 노출기기별 리타겟팅 뷰 */}
            {retargetingActiveTab === 'devicePlatform' && (() => {
              const { sortedData, maxRoas, insightText } = getRetargetingTableData('devicePlatform')
              const sortState = retargetingSortState.devicePlatform
              return (
                <div>
                  <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #e0f2f1 0%, #f5fffd 100%)', borderBottom: '1px solid #e9ecef' }}>
                    <div style={{ fontSize: 14, color: '#00796b', fontWeight: 600, marginBottom: 8 }}>💡 노출기기별 리타겟팅 인사이트</div>
                    <div style={{ fontSize: 13, color: '#424242', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: insightText || '로딩 중...' }} />
                  </div>
                  <div className="card" style={{ margin: 16, borderRadius: 12 }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e9ecef' }}>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--grey-800)', margin: 0 }}>노출기기별 리타겟팅 성과</h4>
                      <p style={{ fontSize: 12, color: 'var(--grey-600)', margin: '4px 0 0 0' }}>Mobile app, Mobile web, Desktop 등 노출기기별 광고 효율</p>
                    </div>
                    <div style={{ padding: '16px 20px', overflowX: 'auto' }}>
                      <table className="data-table" style={{ marginTop: 0 }}>
                        <thead>
                          <tr>
                            <th style={{ minWidth: 140 }}>노출기기</th>
                            {['roas', 'cpa', 'cost', 'conversions', 'revenue'].map(col => (
                              <th key={col} className="sortable-header" onClick={() => handleRetargetingSortChange('devicePlatform', col)} style={{ minWidth: col === 'cost' || col === 'revenue' ? 120 : col === 'conversions' ? 80 : 100, textAlign: 'right', cursor: 'pointer' }}>
                                {col === 'roas' ? 'ROAS' : col === 'cpa' ? 'CPA' : col === 'cost' ? '광고비' : col === 'conversions' ? '전환수' : '전환값'}
                                <div className={`sort-icon ${sortState.column === col ? 'active' : ''}`} style={{ display: 'inline-flex', marginLeft: 4 }}>
                                  <div className={`sort-arrow up ${sortState.column === col && sortState.direction === 'asc' ? 'active' : ''}`}></div>
                                  <div className={`sort-arrow down ${sortState.column === col && sortState.direction === 'desc' ? 'active' : ''}`}></div>
                                </div>
                              </th>
                            ))}
                            <th style={{ minWidth: 80, textAlign: 'center' }}>효율등급</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedData.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: 'var(--grey-500)' }}>데이터가 없습니다</td></tr>
                          ) : sortedData.map((item: any, idx: number) => {
                            const roasColor = item.roas >= 30 ? '#2e7d32' : item.roas >= 10 ? '#1565c0' : item.roas > 0 ? '#e65100' : '#9e9e9e'
                            return (
                              <tr key={idx}>
                                <td style={{ fontWeight: 500 }}>{getDevicePlatformIcon(item.device_platform)} {item.device_platform}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: roasColor }}>{item.roas > 0 ? formatPercent(item.roas) : '-'}</td>
                                <td style={{ textAlign: 'right' }}>{item.cpa > 0 ? formatCurrency(item.cpa) : '-'}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(item.cost)}</td>
                                <td style={{ textAlign: 'right' }}>{formatNumber(item.conversions)}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(item.revenue)}</td>
                                <td style={{ textAlign: 'center' }}>{item.roas > 0 ? getEfficiencyGrade(item.roas, maxRoas) : <span style={{ background: '#f5f5f5', color: '#9e9e9e', padding: '4px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>-</span>}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

      </div>
    </div>
  )
}
