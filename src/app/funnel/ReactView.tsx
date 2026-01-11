'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Filler,
} from 'chart.js';
import { Bar, Line, Scatter } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import * as d3 from 'd3';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

// ========================================
// 타입 정의
// ========================================
interface DailyDataRow {
  Day?: string;
  channel?: string;
  Channel?: string;
  '유입'?: string | number;
  '활동'?: string | number;
  '관심'?: string | number;
  '결제진행'?: string | number;
  '구매완료'?: string | number;
  [key: string]: string | number | undefined;
}

interface ChannelDataRow {
  channel: string;
  '유입': string | number;
  '활동': string | number;
  '관심': string | number;
  '결제진행': string | number;
  '구매완료': string | number;
  CVR: string | number;
  Revenue: string | number;
  [key: string]: string | number | undefined;
}

interface NewVsReturningRow {
  Day: string;
  funnel: string;
  'Total users': string | number;
  'New users': string | number;
  'Returning users': string | number;
  'New user %': string | number;
  [key: string]: string | number | undefined;
}

interface InsightsData {
  overall?: {
    current_period?: {
      start_date: string;
      end_date: string;
    };
  };
  by_period?: {
    [key: string]: PeriodData;
  };
  performance_trends?: PerformanceTrends;
  crm_actions_by_period?: {
    [key: string]: {
      period_label: string;
      crm_actions: CrmAction[];
    };
  };
  [key: string]: unknown;
}

interface PeriodData {
  summary_card?: SummaryCard;
  key_insights?: KeyInsight[];
  micro_segment_alerts?: MicroSegmentAlert[];
  micro_segment_definitions?: Record<string, unknown>;
  dynamic_thresholds?: Record<string, unknown>;
  channel_strategy?: ChannelStrategy;
  channel_clusters?: ChannelClusters;
  ab_test_results?: AbTestResult[];
  top_channels?: TopChannel[];
  overall?: {
    current_period?: {
      start_date: string;
      end_date: string;
    };
  };
  [key: string]: unknown;
}

interface SummaryCard {
  title?: string;
  description?: string;
  metrics?: Record<string, unknown>;
}

interface KeyInsight {
  category: string;
  icon: string;
  label: string;
  bg_color: string;
  border_color: string;
  text_color: string;
  message: string;
  urgency_score?: number;
  sub_items?: string[];
  action?: {
    type?: string;
    text: string;
    secondary?: string;
  };
}

interface MicroSegmentAlert {
  type: 'problem' | 'opportunity';
  category: string;
  sub_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  diagnosis?: string;
  reason?: string;
  action?: string;
  impact?: {
    lost_users?: number;
    potential_revenue?: number;
    [key: string]: unknown;
  };
  action_detail?: {
    primary?: string;
    secondary?: string;
    [key: string]: unknown;
  };
  urgency_score?: number;
  metrics?: Record<string, string | number>;
}

interface ChannelStrategy {
  status: string;
  channels?: Record<string, ChannelInfo>;
}

interface ChannelInfo {
  bcg_matrix?: {
    quadrant: string;
    action?: string;
  };
  stats?: {
    users?: string | number;
    cvr?: string | number;
    revenue?: string | number;
  };
}

interface ChannelClusters {
  n_clusters: number;
  clusters: Record<string, string[]>;
  description: Record<string, string>;
}

interface AbTestResult {
  group_a: string;
  group_b: string;
  cvr_a: number;
  cvr_b: number;
  p_value: number;
  significant: boolean;
}

interface TopChannel {
  channel: string;
  cvr: number;
  acquisition: number;
}

interface PerformanceTrends {
  improvements_7d?: TrendItem[];
  improvements_14d?: TrendItem[];
  improvements_30d?: TrendItem[];
  declines_7d?: TrendItem[];
  declines_14d?: TrendItem[];
  declines_30d?: TrendItem[];
}

interface TrendItem {
  metric: string;
  change_pct: number;
  direction: string;
  risk_level?: string;
  improvement_level?: string;
  recent_avg?: number;
  previous_avg?: number;
  recommendation?: string;
}

interface CrmAction {
  stage: string;
  priority: 'high' | 'medium' | 'low';
  trend?: string;
  diagnosis?: string;
  prescription?: string;
}

interface FunnelDataItem {
  name: string;
  key: string;
  total: number;
  conversionRate: string;
  dropOffRate: string;
  color: string;
}

interface ChurnRates {
  activation: number;
  consideration: number;
  conversion: number;
  purchase: number;
  avg: number;
}

// ========================================
// 유틸리티 함수
// ========================================
function formatNumber(num: number | string | undefined): string {
  if (num === 0 || num === null || num === undefined) return '0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  return Math.round(n).toLocaleString('ko-KR');
}

function formatDecimal(num: number | string | undefined): string {
  if (num === 0 || num === null || num === undefined) return '0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n) || !isFinite(n)) return '0';
  return n.toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length === 0) return [];

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        if (nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const cleanHeaders = headers.map(h => h.replace(/^\uFEFF/, '').trim());

  const data: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === cleanHeaders.length) {
      const row: Record<string, string> = {};
      cleanHeaders.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
  }

  return data;
}

function calculateChurnRates(row: ChannelDataRow): ChurnRates {
  const acquisition = parseFloat(String(row['유입'])) || 0;
  const activation = parseFloat(String(row['활동'])) || 0;
  const consideration = parseFloat(String(row['관심'])) || 0;
  const conversion = parseFloat(String(row['결제진행'])) || 0;
  const purchase = parseFloat(String(row['구매완료'])) || 0;

  const activationChurn = acquisition > 0 ? ((acquisition - activation) / acquisition * 100) : 0;
  const considerationChurn = activation > 0 ? ((activation - consideration) / activation * 100) : 0;
  const conversionChurn = consideration > 0 ? ((consideration - conversion) / consideration * 100) : 0;
  const purchaseChurn = conversion > 0 ? ((conversion - purchase) / conversion * 100) : 0;
  const avgChurn = (activationChurn + considerationChurn + conversionChurn + purchaseChurn) / 4;

  return {
    activation: activationChurn,
    consideration: considerationChurn,
    conversion: conversionChurn,
    purchase: purchaseChurn,
    avg: avgChurn
  };
}

// ========================================
// React 컴포넌트
// ========================================
export default function ReactView() {
  // ========================================
  // State 변수 (전역 변수 대응)
  // ========================================
  const [dailyData, setDailyData] = useState<DailyDataRow[]>([]);
  const [weeklyData, setWeeklyData] = useState<Record<string, string>[]>([]);
  const [channelData, setChannelData] = useState<ChannelDataRow[]>([]);
  const [newVsReturningData, setNewVsReturningData] = useState<NewVsReturningRow[]>([]);
  const [channelEngagementData, setChannelEngagementData] = useState<Record<string, string>[]>([]);
  const [newVsReturningConversionData, setNewVsReturningConversionData] = useState<Record<string, string>[]>([]);
  const [insightsData, setInsightsData] = useState<InsightsData | null>(null);

  const [currentPeriod, setCurrentPeriod] = useState<string>('full');
  const [insightPeriod, setInsightPeriod] = useState<string>('full');
  const [microSegmentPeriod, setMicroSegmentPeriod] = useState<string>('full');

  const [newVsReturningView, setNewVsReturningView] = useState<string>('monthly');
  const [currentKpiType, setCurrentKpiType] = useState<string>('cvr');
  const [currentChurnStage, setCurrentChurnStage] = useState<string>('avg');
  const [currentChurnSort, setCurrentChurnSort] = useState<string>('desc');
  const [currentChannelFunnel, setCurrentChannelFunnel] = useState<string>('purchase');
  const [trendPeriod, setTrendPeriod] = useState<string>('7d');

  // 테이블 정렬 상태
  const [channelTableSort, setChannelTableSort] = useState<{ column: string; direction: 'asc' | 'desc' }>({
    column: '유입',
    direction: 'desc'
  });

  // 더보기/접기 상태
  const [urgentAlertsShowAll, setUrgentAlertsShowAll] = useState<Record<string, boolean>>({ high: false, medium: false });
  const [microSegmentShowAll, setMicroSegmentShowAll] = useState<Record<string, boolean>>({ problem: false, opportunity: false });

  const [urgentAlertsExpanded, setUrgentAlertsExpanded] = useState<Record<string, boolean>>({ high: false, medium: false });
  const [microSegmentExpanded, setMicroSegmentExpanded] = useState<Record<string, boolean>>({ problem: false, opportunity: false });
  const [currentMicroCategoryFilter, setCurrentMicroCategoryFilter] = useState<string>('all');
  const [urgentAlertTab, setUrgentAlertTab] = useState<string>('high');
  const [microSegmentTab, setMicroSegmentTab] = useState<string>('problem');

  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [funnelFilterActive, setFunnelFilterActive] = useState<boolean>(false);
  const [selectedFunnelChannel, setSelectedFunnelChannel] = useState<string>('');

  const [leftStartDate, setLeftStartDate] = useState<string>('');
  const [leftEndDate, setLeftEndDate] = useState<string>('');
  const [rightStartDate, setRightStartDate] = useState<string>('');
  const [rightEndDate, setRightEndDate] = useState<string>('');

  const [investmentExpanded, setInvestmentExpanded] = useState<boolean>(false);

  // 접기/펼치기 상태
  const [decisionToolExpanded, setDecisionToolExpanded] = useState<boolean>(false);
  const [trendInsightExpanded, setTrendInsightExpanded] = useState<boolean>(false);
  const [microSegmentSectionExpanded, setMicroSegmentSectionExpanded] = useState<boolean>(false);
  const [channelAnalysisExpanded, setChannelAnalysisExpanded] = useState<boolean>(false);
  const [customerAnalysisExpanded, setCustomerAnalysisExpanded] = useState<boolean>(false);

  // 탭 상태
  const [decisionToolTab, setDecisionToolTab] = useState<string>('summary');
  const [channelAnalysisTab, setChannelAnalysisTab] = useState<string>('table');
  const [currentTop10Funnel, setCurrentTop10Funnel] = useState<string>('purchase');
  const [customerAnalysisTab, setCustomerAnalysisTab] = useState<string>('trend');

  // 차트 인사이트 툴팁 상태
  const [compareChartTooltip, setCompareChartTooltip] = useState<{ show: boolean; x: number; y: number }>({ show: false, x: 0, y: 0 });
  const [customerTrendTooltip, setCustomerTrendTooltip] = useState<{ show: boolean; x: number; y: number }>({ show: false, x: 0, y: 0 });
  const [conversionTooltip, setConversionTooltip] = useState<{ show: boolean; x: number; y: number }>({ show: false, x: 0, y: 0 });
  const [churnTooltip, setChurnTooltip] = useState<{ show: boolean; x: number; y: number }>({ show: false, x: 0, y: 0 });

  // Refs
  const d3FunnelRef = useRef<HTMLDivElement>(null);
  const d3FunnelLeftRef = useRef<HTMLDivElement>(null);
  const d3FunnelRightRef = useRef<HTMLDivElement>(null);

  // ========================================
  // 데이터 로드 (loadData 함수)
  // ========================================
  useEffect(() => {
    const loadData = async () => {
      try {
        // channel_daily_funnel.csv
        const dailyResponse = await fetch('/funnel/channel_daily_funnel.csv');
        const dailyText = await dailyResponse.text();
        const parsedDaily = parseCSV(dailyText) as DailyDataRow[];
        setDailyData(parsedDaily);

        // weekly_funnel.csv
        const weeklyResponse = await fetch('/funnel/weekly_funnel.csv');
        const weeklyText = await weeklyResponse.text();
        setWeeklyData(parseCSV(weeklyText));

        // channel_funnel.csv
        const channelResponse = await fetch('/funnel/channel_funnel.csv');
        const channelText = await channelResponse.text();
        setChannelData(parseCSV(channelText) as unknown as ChannelDataRow[]);

        // new_vs_returning.csv
        const newVsReturningResponse = await fetch('/funnel/new_vs_returning.csv');
        const newVsReturningText = await newVsReturningResponse.text();
        setNewVsReturningData(parseCSV(newVsReturningText) as unknown as NewVsReturningRow[]);

        // channel_engagement.csv
        const channelEngagementResponse = await fetch('/funnel/channel_engagement.csv');
        const channelEngagementText = await channelEngagementResponse.text();
        setChannelEngagementData(parseCSV(channelEngagementText));

        // new_vs_returning_conversion.csv
        const newVsReturningConversionResponse = await fetch('/funnel/new_vs_returning_conversion.csv');
        const newVsReturningConversionText = await newVsReturningConversionResponse.text();
        setNewVsReturningConversionData(parseCSV(newVsReturningConversionText));

        // insights.json
        const insightsResponse = await fetch('/funnel/insights.json');
        const insightsJson = await insightsResponse.json();
        setInsightsData(insightsJson);
      } catch (error) {
        console.error('데이터 로드 오류:', error);
      }
    };

    loadData();
  }, []);

  // ========================================
  // getPeriodData 함수
  // ========================================
  const getPeriodData = useCallback((): PeriodData | null => {
    if (!insightsData?.by_period) return null;
    return insightsData.by_period[currentPeriod] || null;
  }, [insightsData, currentPeriod]);

  const getInsightPeriodData = useCallback((): PeriodData | null => {
    if (!insightsData?.by_period) return null;
    return insightsData.by_period[insightPeriod] || null;
  }, [insightsData, insightPeriod]);

  const getMicroSegmentPeriodData = useCallback((): PeriodData | null => {
    if (!insightsData?.by_period) return null;
    return insightsData.by_period[microSegmentPeriod] || null;
  }, [insightsData, microSegmentPeriod]);

  // ========================================
  // switchPeriod 함수
  // ========================================
  const switchPeriod = useCallback((period: string) => {
    setCurrentPeriod(period);
  }, []);

  const switchInsightPeriod = useCallback((period: string) => {
    setInsightPeriod(period);
  }, []);

  const switchMicroSegmentPeriod = useCallback((period: string) => {
    setMicroSegmentPeriod(period);
  }, []);

  // ========================================
  // updateKPISummary (useMemo)
  // ========================================
  const kpiSummary = useMemo(() => {
    if (dailyData.length === 0) return [];

    const totalAcquisition = dailyData.reduce((sum, row) => sum + (parseFloat(String(row['유입'])) || 0), 0);
    const totalActivation = dailyData.reduce((sum, row) => sum + (parseFloat(String(row['활동'])) || 0), 0);
    const totalConsideration = dailyData.reduce((sum, row) => sum + (parseFloat(String(row['관심'])) || 0), 0);
    const totalConversion = dailyData.reduce((sum, row) => sum + (parseFloat(String(row['결제진행'])) || 0), 0);
    const totalPurchase = dailyData.reduce((sum, row) => sum + (parseFloat(String(row['구매완료'])) || 0), 0);

    return [
      { label: '유입', value: Math.round(totalAcquisition), unit: '명', color: '#673ab7' },
      { label: '활동', value: Math.round(totalActivation), unit: '명', color: '#2196f3' },
      { label: '관심', value: Math.round(totalConsideration), unit: '명', color: '#ff9800' },
      { label: '결제 진행', value: Math.round(totalConversion), unit: '명', color: '#4caf50' },
      { label: '구매 완료', value: Math.round(totalPurchase), unit: '명', color: '#00c853' }
    ];
  }, [dailyData]);

  // ========================================
  // updateSummaryCardBanner (useMemo)
  // ========================================
  const summaryCardBanner = useMemo(() => {
    const periodData = getPeriodData();
    if (!periodData?.summary_card) return null;
    return periodData.summary_card;
  }, [getPeriodData]);

  // ========================================
  // urgentAlertsData (useMemo)
  // ========================================
  const urgentAlertsData = useMemo(() => {
    const periodData = getPeriodData();
    if (!periodData?.micro_segment_alerts) return { high: [], medium: [] };

    const microAlerts = periodData.micro_segment_alerts;
    const problemAlerts = microAlerts
      .filter((a: MicroSegmentAlert) => a.type === 'problem')
      .sort((a: MicroSegmentAlert, b: MicroSegmentAlert) => (b.urgency_score || 0) - (a.urgency_score || 0));

    return {
      high: problemAlerts.filter((a: MicroSegmentAlert) => ['critical', 'high'].includes(a.severity)),
      medium: problemAlerts.filter((a: MicroSegmentAlert) => a.severity === 'medium')
    };
  }, [getPeriodData]);

  // ========================================
  // microSegmentData (useMemo)
  // ========================================
  const microSegmentData = useMemo(() => {
    const periodData = getMicroSegmentPeriodData();
    if (!periodData?.micro_segment_alerts) return { problems: [], opportunities: [] };

    const alerts = periodData.micro_segment_alerts;
    const filteredAlerts = currentMicroCategoryFilter === 'all'
      ? alerts
      : alerts.filter((a: MicroSegmentAlert) => a.category === currentMicroCategoryFilter);

    return {
      problems: filteredAlerts.filter((a: MicroSegmentAlert) => a.type === 'problem'),
      opportunities: filteredAlerts.filter((a: MicroSegmentAlert) => a.type === 'opportunity')
    };
  }, [getMicroSegmentPeriodData, currentMicroCategoryFilter]);

  // ========================================
  // performanceTrends (useMemo)
  // ========================================
  const performanceTrends = useMemo(() => {
    const formatDate = (date: Date) => {
      const m = date.getMonth() + 1;
      const d = date.getDate();
      return `${m}/${d}`;
    };

    const getPeriodDateRange = (days: number) => {
      let lastDate = new Date();
      if (insightsData?.overall?.current_period?.end_date) {
        lastDate = new Date(insightsData.overall.current_period.end_date);
      }

      const recentEnd = new Date(lastDate);
      const recentStart = new Date(lastDate);
      recentStart.setDate(recentStart.getDate() - (days - 1));

      const previousEnd = new Date(lastDate);
      previousEnd.setDate(previousEnd.getDate() - days);
      const previousStart = new Date(lastDate);
      previousStart.setDate(previousStart.getDate() - (days * 2 - 1));

      return { recentStart, recentEnd, previousStart, previousEnd };
    };

    if (!insightsData?.performance_trends) return { improvements: [], declines: [], periodText: '최근 7일 vs 이전 7일', periodTextHtml: '' };

    const trends = insightsData.performance_trends;
    const dataKeyMapImp: Record<string, string> = { '7d': 'improvements_7d', '14d': 'improvements_14d', '30d': 'improvements_30d' };
    const dataKeyMapDec: Record<string, string> = { '7d': 'declines_7d', '14d': 'declines_14d', '30d': 'declines_30d' };
    const periodTextMap: Record<string, string> = { '7d': '최근 7일 vs 이전 7일', '14d': '최근 14일 vs 이전 14일', '30d': '최근 30일 vs 이전 30일' };
    const daysMap: Record<string, number> = { '7d': 7, '14d': 14, '30d': 30 };

    const impKey = dataKeyMapImp[trendPeriod] || 'improvements_7d';
    const decKey = dataKeyMapDec[trendPeriod] || 'declines_7d';
    const periodText = periodTextMap[trendPeriod] || '최근 7일 vs 이전 7일';
    const days = daysMap[trendPeriod] || 7;
    const { recentStart, recentEnd, previousStart, previousEnd } = getPeriodDateRange(days);

    return {
      improvements: (trends as Record<string, TrendItem[]>)[impKey] || [],
      declines: (trends as Record<string, TrendItem[]>)[decKey] || [],
      periodText,
      days,
      recentStart: formatDate(recentStart),
      recentEnd: formatDate(recentEnd),
      previousStart: formatDate(previousStart),
      previousEnd: formatDate(previousEnd)
    };
  }, [insightsData, trendPeriod]);

  // ========================================
  // keyInsights (useMemo)
  // ========================================
  const keyInsights = useMemo(() => {
    const periodData = getPeriodData();
    if (!periodData?.key_insights) return [];
    return periodData.key_insights;
  }, [getPeriodData]);

  // ========================================
  // channelChurnData (useMemo for updateChurnChart)
  // ========================================
  const channelChurnData = useMemo(() => {
    if (channelData.length === 0) return { labels: [], values: [], config: null, allData: [] };

    const stageConfig: Record<string, { label: string; color: string; tooltip: string; getValue: (row: ChannelDataRow) => number }> = {
      activation: {
        label: '유입→활동 이탈률 (%)',
        color: '#673ab7',
        tooltip: '(유입 - 활동) / 유입 × 100',
        getValue: (row) => calculateChurnRates(row).activation
      },
      consideration: {
        label: '활동→관심 이탈률 (%)',
        color: '#2196f3',
        tooltip: '(활동 - 관심) / 활동 × 100',
        getValue: (row) => calculateChurnRates(row).consideration
      },
      conversion: {
        label: '관심→결제진행 이탈률 (%)',
        color: '#ff9800',
        tooltip: '(관심 - 결제진행) / 관심 × 100',
        getValue: (row) => calculateChurnRates(row).conversion
      },
      purchase: {
        label: '결제진행→구매완료 이탈률 (%)',
        color: '#4caf50',
        tooltip: '(결제진행 - 구매완료) / 결제진행 × 100',
        getValue: (row) => calculateChurnRates(row).purchase
      },
      avg: {
        label: '평균 이탈률 (%)',
        color: '#e91e63',
        tooltip: '4개 단계 이탈률의 평균',
        getValue: (row) => calculateChurnRates(row).avg
      }
    };

    const config = stageConfig[currentChurnStage];
    if (!config) return { labels: [], values: [], config: null, allData: [] };

    const sortedData = [...channelData].sort((a, b) => {
      const aVal = config.getValue(a);
      const bVal = config.getValue(b);
      return currentChurnSort === 'desc' ? (bVal - aVal) : (aVal - bVal);
    }).slice(0, 10);

    return {
      labels: sortedData.map(row => row.channel),
      values: sortedData.map(row => config.getValue(row)),
      config,
      allData: channelData
    };
  }, [channelData, currentChurnStage, currentChurnSort]);

  // ========================================
  // channelCompareData (useMemo for updateCompareChart)
  // ========================================
  const channelCompareData = useMemo(() => {
    if (channelData.length === 0) return null;

    const sortedData = [...channelData].sort((a, b) =>
      (parseFloat(String(b.CVR)) || 0) - (parseFloat(String(a.CVR)) || 0)
    ).slice(0, 8);

    const maxAcquisition = Math.max(...sortedData.map(row => parseFloat(String(row['유입'])) || 0));
    const maxPurchase = Math.max(...sortedData.map(row => parseFloat(String(row['구매완료'])) || 0));
    const maxRevenue = Math.max(...sortedData.map(row => parseFloat(String(row.Revenue)) || 0));

    return {
      labels: sortedData.map(row => row.channel),
      datasets: [
        {
          label: 'CVR (%)',
          data: sortedData.map(row => parseFloat(String(row.CVR)) || 0),
          backgroundColor: 'rgba(103, 58, 183, 0.8)',
          borderColor: '#673ab7',
          borderWidth: 1,
          originalData: sortedData.map(row => parseFloat(String(row.CVR)) || 0)
        },
        {
          label: '유입 (정규화)',
          data: sortedData.map(row => ((parseFloat(String(row['유입'])) || 0) / maxAcquisition * 100)),
          backgroundColor: 'rgba(33, 150, 243, 0.8)',
          borderColor: '#2196f3',
          borderWidth: 1,
          originalData: sortedData.map(row => parseFloat(String(row['유입'])) || 0)
        },
        {
          label: '구매완료 (정규화)',
          data: sortedData.map(row => ((parseFloat(String(row['구매완료'])) || 0) / maxPurchase * 100)),
          backgroundColor: 'rgba(0, 200, 83, 0.8)',
          borderColor: '#00c853',
          borderWidth: 1,
          originalData: sortedData.map(row => parseFloat(String(row['구매완료'])) || 0)
        },
        {
          label: '매출 (정규화)',
          data: sortedData.map(row => ((parseFloat(String(row.Revenue)) || 0) / maxRevenue * 100)),
          backgroundColor: 'rgba(244, 67, 54, 0.8)',
          borderColor: '#f44336',
          borderWidth: 1,
          originalData: sortedData.map(row => parseFloat(String(row.Revenue)) || 0)
        }
      ]
    };
  }, [channelData]);

  // ========================================
  // customerTrendData (useMemo for updateCustomerTrendChart)
  // ========================================
  const customerTrendData = useMemo(() => {
    if (newVsReturningData.length === 0) return null;

    const acquisitionData = newVsReturningData.filter(row => row.funnel === '유입');
    const sortedData = [...acquisitionData].sort((a, b) => {
      const dateA = new Date(a.Day);
      const dateB = new Date(b.Day);
      return dateA.getTime() - dateB.getTime();
    });

    let aggregatedData: { label: string; newUserPct: string; returnRate: string }[] = [];

    if (newVsReturningView === 'monthly') {
      const monthlyMap: Record<string, { totalUsers: number; newUsers: number; returningUsers: number }> = {};
      sortedData.forEach(row => {
        const date = new Date(row.Day);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyMap[month]) {
          monthlyMap[month] = { totalUsers: 0, newUsers: 0, returningUsers: 0 };
        }

        monthlyMap[month].totalUsers += parseFloat(String(row['Total users'])) || 0;
        monthlyMap[month].newUsers += parseFloat(String(row['New users'])) || 0;
        monthlyMap[month].returningUsers += parseFloat(String(row['Returning users'])) || 0;
      });

      aggregatedData = Object.entries(monthlyMap).map(([month, data]) => ({
        label: month,
        newUserPct: data.totalUsers > 0 ? ((data.newUsers / data.totalUsers) * 100).toFixed(2) : '0',
        returnRate: data.totalUsers > 0 ? ((data.returningUsers / data.totalUsers) * 100).toFixed(2) : '0'
      }));
    } else if (newVsReturningView === 'weekly') {
      const weeklyMap = new Map<string, { totalUsers: number; newUsers: number; returningUsers: number }>();

      sortedData.forEach(row => {
        const date = new Date(row.Day);
        const dayOfWeek = date.getDay();
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - dayOfWeek);
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!weeklyMap.has(weekKey)) {
          weeklyMap.set(weekKey, { totalUsers: 0, newUsers: 0, returningUsers: 0 });
        }

        const weekData = weeklyMap.get(weekKey)!;
        weekData.totalUsers += parseFloat(String(row['Total users'])) || 0;
        weekData.newUsers += parseFloat(String(row['New users'])) || 0;
        weekData.returningUsers += parseFloat(String(row['Returning users'])) || 0;
      });

      aggregatedData = Array.from(weeklyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([week, data]) => ({
          label: week,
          newUserPct: data.totalUsers > 0 ? ((data.newUsers / data.totalUsers) * 100).toFixed(2) : '0',
          returnRate: data.totalUsers > 0 ? ((data.returningUsers / data.totalUsers) * 100).toFixed(2) : '0'
        }));
    } else {
      aggregatedData = sortedData.map(row => ({
        label: row.Day,
        newUserPct: parseFloat(String(row['New user %'])).toFixed(2),
        returnRate: (100 - parseFloat(String(row['New user %']))).toFixed(2)
      }));
    }

    return {
      labels: aggregatedData.map(d => d.label),
      datasets: [
        {
          label: '신규 고객 비율 (%)',
          data: aggregatedData.map(d => parseFloat(d.newUserPct)),
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          tension: 0.3,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 6,
          yAxisID: 'y'
        },
        {
          label: '재방문율 (%)',
          data: aggregatedData.map(d => parseFloat(d.returnRate)),
          borderColor: '#673ab7',
          backgroundColor: 'rgba(103, 58, 183, 0.1)',
          tension: 0.3,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 6,
          yAxisID: 'y'
        }
      ]
    };
  }, [newVsReturningData, newVsReturningView]);

  // ========================================
  // funnelData (useMemo for updateFunnelChart)
  // ========================================
  const funnelData = useMemo((): FunnelDataItem[] => {
    const data = selectedFunnelChannel
      ? dailyData.filter(row => (row.channel || row.Channel) === selectedFunnelChannel)
      : dailyData;

    if (data.length === 0) return [];

    const baseColor = '#535A8C';
    const funnelStages = [
      { name: '유입 (Acquisition)', key: '유입' },
      { name: '활동 (Activation)', key: '활동' },
      { name: '관심 (Consideration)', key: '관심' },
      { name: '결제진행 (Conversion)', key: '결제진행' },
      { name: '구매완료 (Purchase)', key: '구매완료' }
    ];

    return funnelStages.map((stage, index) => {
      const total = data.reduce((sum, row) => sum + (parseFloat(String(row[stage.key])) || 0), 0);
      const prevTotal = index > 0 ? data.reduce((sum, row) => sum + (parseFloat(String(row[funnelStages[index - 1].key])) || 0), 0) : total;
      const conversionRate = prevTotal > 0 ? (total / prevTotal * 100) : 100;
      const dropOffRate = prevTotal > 0 ? ((prevTotal - total) / prevTotal * 100) : 0;

      return {
        name: stage.name,
        key: stage.key,
        total: Math.round(total),
        conversionRate: conversionRate.toFixed(1),
        dropOffRate: dropOffRate.toFixed(1),
        color: baseColor
      };
    });
  }, [dailyData, selectedFunnelChannel]);

  // ========================================
  // D3 퍼널 차트 렌더링 (HTML updateFunnelChart와 동일)
  // ========================================
  useEffect(() => {
    if (!d3FunnelRef.current || funnelData.length === 0 || isCompareMode) return;

    const container = d3FunnelRef.current;
    container.innerHTML = '';

    const margin = { top: 20, right: 40, bottom: 20, left: 40 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 550 - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // 툴팁 생성 (body에 직접 추가)
    let tooltip = d3.select('body').select<HTMLDivElement>('.funnel-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('body')
        .append<HTMLDivElement>('div')
        .attr('class', 'funnel-tooltip');
    }

    const maxValue = d3.max(funnelData, d => d.total) || 1;
    const stageHeight = height / funnelData.length;
    const spacing = 10;

    // 단계별 인사이트 및 추천사항
    const getStageInsights = (stage: typeof funnelData[0], index: number) => {
      const insights: Record<number, { insight: string; recommendation: string }> = {
        0: {
          insight: '사용자 유입의 시작 단계입니다. 모든 마케팅 채널의 트래픽이 집계됩니다.',
          recommendation: '유료 광고, SEO, 소셜 미디어 등 다양한 채널의 유입 품질을 개선하세요.'
        },
        1: {
          insight: '첫 방문자가 활성화되는 단계입니다. 이탈률이 높다면 랜딩페이지에 문제가 있을 수 있습니다.',
          recommendation: parseFloat(stage.dropOffRate) > 50
            ? '이탈률이 매우 높습니다. 랜딩페이지 속도, 디자인, CTA를 즉시 개선하세요.'
            : '랜딩페이지 A/B 테스트를 통해 전환율을 지속적으로 개선하세요.'
        },
        2: {
          insight: '사용자가 제품/서비스에 관심을 보이는 단계입니다.',
          recommendation: parseFloat(stage.dropOffRate) > 40
            ? '제품 페이지의 정보 품질과 이미지를 개선하고, 리뷰를 강화하세요.'
            : '추천 시스템과 개인화를 통해 관심을 구매로 전환하세요.'
        },
        3: {
          insight: '결제를 시작한 단계입니다. 여기서의 이탈은 큰 기회 손실입니다.',
          recommendation: parseFloat(stage.dropOffRate) > 30
            ? '결제 프로세스를 단순화하고, 배송비/결제 수단을 명확히 표시하세요.'
            : '원클릭 결제, 게스트 체크아웃 등으로 마찰을 최소화하세요.'
        },
        4: {
          insight: '최종 구매 완료 단계입니다. 이 사용자들을 재구매 고객으로 전환하는 것이 중요합니다.',
          recommendation: '이메일 마케팅, 리타겟팅 광고, 로열티 프로그램으로 재구매를 유도하세요.'
        }
      };
      return insights[index] || { insight: '', recommendation: '' };
    };

    funnelData.forEach((stage, i) => {
      // 각 단계마다 점진적으로 어두워지는 색상 계산
      const stageColor = d3.color(stage.color)?.darker(i * 0.25) || stage.color;

      const yPos = i * stageHeight;
      const topWidth = (stage.total / maxValue) * width;
      const bottomWidth = i < funnelData.length - 1
        ? (funnelData[i + 1].total / maxValue) * width
        : topWidth * 0.8;

      const xOffset = (width - topWidth) / 2;
      const xOffsetBottom = (width - bottomWidth) / 2;

      // 단계 사이 화살표 추가 (첫 단계 제외)
      if (i > 0) {
        const arrowGroup = svg.append('g')
          .attr('opacity', 0.4);

        // 화살표 라인
        arrowGroup.append('line')
          .attr('x1', width / 2)
          .attr('y1', yPos - spacing / 2 - 15)
          .attr('x2', width / 2)
          .attr('y2', yPos - spacing / 2)
          .attr('stroke', String(stageColor))
          .attr('stroke-width', 3)
          .attr('stroke-dasharray', '5,5');

        // 화살표 헤드
        arrowGroup.append('polygon')
          .attr('points', `
            ${width / 2},${yPos - spacing / 2}
            ${width / 2 - 6},${yPos - spacing / 2 - 8}
            ${width / 2 + 6},${yPos - spacing / 2 - 8}
          `)
          .attr('fill', String(stageColor));
      }

      // 퍼널 단계 그룹
      const group = svg.append('g')
        .attr('class', 'funnel-stage')
        .style('cursor', 'pointer');

      // 그라데이션 정의
      const gradientId = `gradient-${i}`;
      const gradient = svg.append('defs')
        .append('linearGradient')
        .attr('id', gradientId)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', String(stageColor))
        .attr('stop-opacity', 1);

      gradient.append('stop')
        .attr('offset', '50%')
        .attr('stop-color', String(stageColor))
        .attr('stop-opacity', 0.9);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', String(stageColor))
        .attr('stop-opacity', 0.75);

      // 트라페즈이드 경로
      const path = `
        M ${xOffset} ${yPos}
        L ${xOffset + topWidth} ${yPos}
        L ${xOffsetBottom + bottomWidth} ${yPos + stageHeight - spacing}
        L ${xOffsetBottom} ${yPos + stageHeight - spacing}
        Z
      `;

      group.append('path')
        .attr('d', path)
        .attr('fill', `url(#${gradientId})`)
        .attr('stroke', String(stageColor))
        .attr('stroke-width', 2)
        .attr('opacity', 0.85);

      // 텍스트 배경 (가독성 향상)
      group.append('rect')
        .attr('x', width / 2 - 120)
        .attr('y', yPos + stageHeight / 2 - 35)
        .attr('width', 240)
        .attr('height', i > 0 ? 65 : 45)
        .attr('fill', 'rgba(255, 255, 255, 0.95)')
        .attr('rx', 8)
        .attr('stroke', String(stageColor))
        .attr('stroke-width', 2)
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');

      // 레이블
      group.append('text')
        .attr('class', 'funnel-stage-label')
        .attr('x', width / 2)
        .attr('y', yPos + stageHeight / 2 - 15)
        .attr('text-anchor', 'middle')
        .style('fill', String(stageColor))
        .text(stage.name);

      // 값 표시
      group.append('text')
        .attr('class', 'funnel-stage-value')
        .attr('x', width / 2)
        .attr('y', yPos + stageHeight / 2 + 5)
        .attr('text-anchor', 'middle')
        .style('fill', 'var(--grey-900)')
        .style('font-weight', '700')
        .text(stage.total.toLocaleString() + ' users');

      // 전환율 및 이탈률 표시 (첫 단계 제외)
      if (i > 0) {
        const conversionText = group.append('text')
          .attr('class', 'funnel-stage-conversion')
          .attr('x', width / 2)
          .attr('y', yPos + stageHeight / 2 + 22)
          .attr('text-anchor', 'middle');

        // 전환율
        conversionText.append('tspan')
          .style('fill', String(stageColor))
          .style('font-weight', '600')
          .text(`전환율: ${stage.conversionRate}%`);

        // 구분자
        conversionText.append('tspan')
          .style('fill', 'var(--grey-600)')
          .text(' | ');

        // 이탈률
        conversionText.append('tspan')
          .style('fill', '#EF4444')
          .style('font-weight', '600')
          .text(`이탈: ${stage.dropOffRate}%`);
      }

      // 인사이트 데이터
      const insights = getStageInsights(stage, i);

      // 마우스 이벤트
      group.on('mouseover', function(event) {
        d3.select(this)
          .style('opacity', 1)
          .style('filter', 'brightness(1.1)');

        tooltip.html(`
          <div class="funnel-tooltip-title">${stage.name}</div>
          <div class="funnel-tooltip-metric">
            <span class="funnel-tooltip-metric-label">총 사용자</span>
            <span class="funnel-tooltip-metric-value">${stage.total.toLocaleString()}명</span>
          </div>
          ${i > 0 ? `
          <div class="funnel-tooltip-metric">
            <span class="funnel-tooltip-metric-label">전환율</span>
            <span class="funnel-tooltip-metric-value" style="color: ${stageColor}; font-weight: 600;">${stage.conversionRate}%</span>
          </div>
          <div class="funnel-tooltip-metric">
            <span class="funnel-tooltip-metric-label">이탈률</span>
            <span class="funnel-tooltip-metric-value" style="color: #EF4444; font-weight: 600;">${stage.dropOffRate}%</span>
          </div>
          ` : ''}
          <div class="funnel-tooltip-insight">${insights.insight}</div>
          <div class="funnel-tooltip-recommendation">${insights.recommendation}</div>
        `)
        .classed('visible', true);

        // 툴팁 위치 조정
        requestAnimationFrame(() => {
          const tooltipNode = tooltip.node() as HTMLElement;
          if (!tooltipNode) return;
          const tooltipRect = tooltipNode.getBoundingClientRect();
          const padding = 15;

          const rectX = width / 2 - 120;
          const rectY = yPos + stageHeight / 2 - 35;
          const rectWidth = 240;

          const containerRect = container.getBoundingClientRect();

          let left = containerRect.left + margin.left + rectX + rectWidth + padding;
          let top = containerRect.top + margin.top + rectY;

          if (left + tooltipRect.width + padding > window.innerWidth) {
            left = containerRect.left + margin.left + rectX - tooltipRect.width - padding;
          }

          if (left < padding) {
            left = padding;
          }

          if (top + tooltipRect.height + padding > window.innerHeight) {
            top = window.innerHeight - tooltipRect.height - padding;
          }

          if (top < padding) {
            top = padding;
          }

          tooltip
            .style('left', left + 'px')
            .style('top', top + 'px');
        });
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('opacity', 0.85)
          .style('filter', 'none');
        tooltip.classed('visible', false);
      });
    });
  }, [funnelData, isCompareMode]);

  // ========================================
  // 비교 모드 초기화 (날짜 범위 설정)
  // ========================================
  useEffect(() => {
    if (!isCompareMode || dailyData.length === 0) return;

    // 모든 날짜 추출 및 정렬
    const allDateStrings = dailyData
      .map(row => row['Day'] || row['week'] || row['date'] || row['Date'] || row['일자'])
      .filter(d => d) as string[];

    if (allDateStrings.length === 0) return;

    // 날짜 문자열을 Date 객체로 변환하여 정렬
    const sortedDates = allDateStrings
      .map(dateStr => new Date(dateStr))
      .filter(date => !isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())
      .map(date => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      });

    // 중복 제거
    const uniqueDates = [...new Set(sortedDates)];
    if (uniqueDates.length === 0) return;

    const midPoint = Math.floor(uniqueDates.length / 2);

    // 기본값: 전반부 vs 후반부
    const leftStart = uniqueDates[0];
    const leftEnd = uniqueDates[midPoint - 1] || uniqueDates[0];
    const rightStart = uniqueDates[midPoint] || uniqueDates[0];
    const rightEnd = uniqueDates[uniqueDates.length - 1];

    setLeftStartDate(leftStart);
    setLeftEndDate(leftEnd);
    setRightStartDate(rightStart);
    setRightEndDate(rightEnd);
  }, [isCompareMode, dailyData]);

  // ========================================
  // 비교 퍼널 차트 렌더링
  // ========================================
  useEffect(() => {
    if (!isCompareMode || !d3FunnelLeftRef.current || !d3FunnelRightRef.current) return;
    if (!leftStartDate || !leftEndDate || !rightStartDate || !rightEndDate) return;

    // 채널 필터 적용된 데이터 사용 (HTML getFilteredDailyData와 동일)
    const data = selectedFunnelChannel
      ? dailyData.filter(row => (row['channel'] || row['Channel']) === selectedFunnelChannel)
      : dailyData;

    // 날짜 필터링 함수
    const filterByDateRange = (startDate: string, endDate: string) => {
      return data.filter(row => {
        const dateStr = row['Day'] || row['week'] || row['date'] || row['Date'] || row['일자'];
        if (!dateStr) return false;
        const rowDate = new Date(dateStr);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return rowDate >= start && rowDate <= end;
      });
    };

    const leftData = filterByDateRange(leftStartDate, leftEndDate);
    const rightData = filterByDateRange(rightStartDate, rightEndDate);

    // 퍼널 데이터 계산 함수 (HTML calculateFunnelData와 동일)
    const baseColor = '#535A8C';
    const calculateFunnelData = (filteredData: typeof dailyData) => {
      if (filteredData.length === 0) return [];

      const funnelStages = [
        { name: '유입', key: '유입', color: baseColor },
        { name: '활동', key: '활동', color: baseColor },
        { name: '관심', key: '관심', color: baseColor },
        { name: '결제진행', key: '결제진행', color: baseColor },
        { name: '구매완료', key: '구매완료', color: baseColor }
      ];

      return funnelStages.map((stage, index) => {
        const total = filteredData.reduce((sum, row) => sum + (parseFloat(String(row[stage.key])) || 0), 0);
        const prevTotal = index > 0
          ? filteredData.reduce((sum, row) => sum + (parseFloat(String(row[funnelStages[index - 1].key])) || 0), 0)
          : total;
        const conversionRate = prevTotal > 0 ? (total / prevTotal * 100) : 100;
        const dropOffRate = prevTotal > 0 ? ((prevTotal - total) / prevTotal * 100) : 0;

        return {
          ...stage,
          total: Math.round(total),
          conversionRate: conversionRate.toFixed(1),
          dropOffRate: dropOffRate.toFixed(1),
          index: index
        };
      });
    };

    const leftFunnelData = calculateFunnelData(leftData);
    const rightFunnelData = calculateFunnelData(rightData);

    // renderSmallFunnel (HTML과 동일한 트라페즈이드 디자인)
    const renderSmallFunnel = (
      container: HTMLDivElement,
      funnelData: { name: string; color: string; total: number; conversionRate: string; dropOffRate: string; index: number }[]
    ) => {
      d3.select(container).selectAll('*').remove();

      // 데이터 유효성 검증
      if (!funnelData || funnelData.length === 0) {
        container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 450px; color: var(--grey-500); font-size: 13px;">선택한 기간의 데이터가 없습니다</div>';
        return;
      }

      const totalUsers = funnelData[0]?.total || 0;
      if (totalUsers === 0) {
        container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 450px; color: var(--grey-500); font-size: 13px;">선택한 기간에 유입 데이터가 없습니다</div>';
        return;
      }

      const margin = { top: 10, right: 20, bottom: 10, left: 20 };
      const width = 400;
      const height = 450 - margin.top - margin.bottom;

      const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const maxValue = d3.max(funnelData, d => d.total) || 0;
      if (!maxValue || maxValue === 0) {
        container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 450px; color: var(--grey-500); font-size: 13px;">데이터 값이 유효하지 않습니다</div>';
        return;
      }

      const stageHeight = height / funnelData.length;
      const spacing = 8;

      funnelData.forEach((stage, i) => {
        const stageColor = d3.color(stage.color)?.darker(i * 0.25) || stage.color;
        const yPos = i * stageHeight;
        const topWidth = (stage.total / maxValue) * width;
        const bottomWidth = i < funnelData.length - 1
          ? (funnelData[i + 1].total / maxValue) * width
          : topWidth * 0.8;

        const xOffset = (width - topWidth) / 2;
        const xOffsetBottom = (width - bottomWidth) / 2;

        const group = svg.append('g')
          .attr('class', 'funnel-stage-small');

        // 그라데이션
        const gradientId = `gradient-small-${container.id}-${i}`;
        const gradient = svg.append('defs')
          .append('linearGradient')
          .attr('id', gradientId)
          .attr('x1', '0%')
          .attr('y1', '0%')
          .attr('x2', '0%')
          .attr('y2', '100%');

        gradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', String(stageColor))
          .attr('stop-opacity', 1);

        gradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', String(stageColor))
          .attr('stop-opacity', 0.75);

        // 트라페즈이드 경로
        const path = `
          M ${xOffset} ${yPos}
          L ${xOffset + topWidth} ${yPos}
          L ${xOffsetBottom + bottomWidth} ${yPos + stageHeight - spacing}
          L ${xOffsetBottom} ${yPos + stageHeight - spacing}
          Z
        `;

        group.append('path')
          .attr('d', path)
          .attr('fill', `url(#${gradientId})`)
          .attr('stroke', String(stageColor))
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.85);

        // 단계명
        group.append('text')
          .attr('x', width / 2)
          .attr('y', yPos + stageHeight / 2 - 5)
          .attr('text-anchor', 'middle')
          .style('fill', 'white')
          .style('font-size', '11px')
          .style('font-weight', '600')
          .text(stage.name);

        // 사용자 수
        group.append('text')
          .attr('x', width / 2)
          .attr('y', yPos + stageHeight / 2 + 10)
          .attr('text-anchor', 'middle')
          .style('fill', 'white')
          .style('font-size', '10px')
          .style('font-weight', '600')
          .text(stage.total.toLocaleString() + ' users');

        // 전환율/이탈률 (첫 번째 단계 제외)
        if (i > 0) {
          const metricsGroup = group.append('text')
            .attr('x', width / 2)
            .attr('y', yPos + stageHeight / 2 + 24)
            .attr('text-anchor', 'middle')
            .style('font-size', '9px');

          metricsGroup.append('tspan')
            .style('fill', '#4ade80')
            .style('font-weight', '600')
            .text(`전환 ${stage.conversionRate}%`);

          metricsGroup.append('tspan')
            .style('fill', 'white')
            .text(' | ');

          metricsGroup.append('tspan')
            .style('fill', '#f87171')
            .style('font-weight', '600')
            .text(`이탈 ${stage.dropOffRate}%`);
        }
      });
    };

    renderSmallFunnel(d3FunnelLeftRef.current, leftFunnelData);
    renderSmallFunnel(d3FunnelRightRef.current, rightFunnelData);

    // 비교 인사이트 업데이트 (HTML updateComparisonInsights와 동일)
    const comparisonContent = document.getElementById('comparisonContent');
    if (comparisonContent && leftFunnelData.length > 0 && rightFunnelData.length > 0) {
      // 단계별 아이콘 매핑
      const stageIcons: Record<string, string> = {
        '유입': '👥',
        '활동': '🔥',
        '관심': '❤️',
        '결제진행': '🛒',
        '구매완료': '✅'
      };

      const insights: string[] = [];

      // 5단계 모두 비교
      for (let i = 0; i < leftFunnelData.length; i++) {
        const leftValue = leftFunnelData[i].total;
        const rightValue = rightFunnelData[i].total;
        const changePercent = leftValue > 0 ? ((rightValue - leftValue) / leftValue * 100).toFixed(1) : '0';
        const changeNum = parseFloat(changePercent);
        const changeColor = changeNum > 0 ? '#10b981' : (changeNum < 0 ? '#ef4444' : '#6b7280');
        const changeIcon = changeNum > 0 ? '▲' : (changeNum < 0 ? '▼' : '━');

        const stageName = leftFunnelData[i].name.split(' (')[0];
        const stageIcon = stageIcons[stageName] || '📊';

        insights.push(`
          <div style="padding: 10px; background: white; border-radius: 6px; border-left: 3px solid ${changeColor};">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <div style="font-size: 13px; font-weight: 600; color: var(--grey-800);">
                ${stageIcon} ${stageName}
              </div>
              <div style="font-size: 12px; font-weight: 700; color: ${changeColor};">
                ${changeIcon} ${changeNum > 0 ? '+' : ''}${changePercent}%
              </div>
            </div>
            <div style="font-size: 11px; color: var(--grey-500); line-height: 1.4;">
              ${leftValue.toLocaleString()} → ${rightValue.toLocaleString()}
            </div>
          </div>
        `);
      }

      // 그리드 레이아웃으로 표시
      comparisonContent.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px;">
          ${insights.join('')}
        </div>
      `;
    }
  }, [isCompareMode, leftStartDate, leftEndDate, rightStartDate, rightEndDate, dailyData, selectedFunnelChannel]);

  // ========================================
  // BCG Matrix (useMemo for updateBCGMatrix)
  // ========================================
  const bcgMatrix = useMemo(() => {
    const periodData = getPeriodData();
    if (!periodData?.channel_strategy || periodData.channel_strategy.status !== 'success') return null;

    const strategy = periodData.channel_strategy;
    const quadrants: Record<string, { channels: { name: string; cvr: number; action: string }[]; color: string; bgColor: string; title: string; desc: string }> = {
      'cash_cow': { channels: [], color: '#4caf50', bgColor: '#e8f5e9', title: '👑 Cash Cow (효자 채널)', desc: '트래픽도 많고 전환율도 높음 - 투자 유지' },
      'hidden_gem': { channels: [], color: '#2196f3', bgColor: '#e3f2fd', title: '💎 Hidden Gem (숨은 보석)', desc: '전환율은 높지만 트래픽이 적음 - 투자 확대' },
      'money_pit': { channels: [], color: '#ff9800', bgColor: '#fff3e0', title: '💸 Money Pit (밑 빠진 독)', desc: '트래픽은 많지만 전환율이 낮음 - 최적화 필요' },
      'dog': { channels: [], color: '#9e9e9e', bgColor: '#fafafa', title: '🤔 Dog (재검토 필요)', desc: '트래픽도 전환율도 낮음 - 전략 재고' }
    };

    Object.entries(strategy.channels || {}).forEach(([channelName, channelInfo]) => {
      const quadrant = channelInfo.bcg_matrix?.quadrant;
      if (quadrant && quadrants[quadrant]) {
        quadrants[quadrant].channels.push({
          name: channelName,
          cvr: Number(channelInfo.stats?.cvr) || 0,
          action: channelInfo.bcg_matrix?.action || ''
        });
      }
    });

    return quadrants;
  }, [getPeriodData]);

  // ========================================
  // channelClusters (useMemo)
  // ========================================
  const channelClusters = useMemo(() => {
    const periodData = getPeriodData();
    if (!periodData?.channel_clusters) return null;
    return periodData.channel_clusters;
  }, [getPeriodData]);

  // ========================================
  // abTestResults (useMemo)
  // ========================================
  const abTestResults = useMemo(() => {
    const periodData = getPeriodData();
    if (!periodData?.ab_test_results) return [];
    return periodData.ab_test_results.filter(t => t.significant === true);
  }, [getPeriodData]);

  // ========================================
  // crmActions (useMemo for renderCrmActions)
  // ========================================
  const crmActionsData = useMemo(() => {
    if (!insightsData?.crm_actions_by_period) return { hasData: false, actions: [], periodLabel: '' };
    const crmActionsByPeriod = insightsData.crm_actions_by_period;
    if (!crmActionsByPeriod[currentPeriod]) return { hasData: false, actions: [], periodLabel: '' };
    const periodCrmData = crmActionsByPeriod[currentPeriod];
    return {
      hasData: true,
      actions: periodCrmData.crm_actions || [],
      periodLabel: periodCrmData.period_label || currentPeriod
    };
  }, [insightsData, currentPeriod]);

  // ========================================
  // investmentGuide (useMemo for updateAdvancedAnalysis 투자 가이드)
  // ========================================
  const investmentGuide = useMemo(() => {
    const periodData = getPeriodData();
    if (!periodData?.channel_strategy?.channels) return [];

    const channelEntries = Object.entries(periodData.channel_strategy.channels);

    return channelEntries.map(([channelName, channelInfo]) => {
      const stats = channelInfo.stats || {};
      const acquisition = parseFloat(String(stats.users)) || 0;
      const cvr = parseFloat(String(stats.cvr)) || 0;
      const revenue = parseFloat(String(stats.revenue)) || 0;
      const purchase = Math.round(acquisition * cvr / 100);

      let confidence = '낮음';
      let confidenceScore = 0;
      if (acquisition >= 100000) {
        confidence = '매우 높음';
        confidenceScore = 4;
      } else if (acquisition >= 10000) {
        confidence = '높음';
        confidenceScore = 3;
      } else if (acquisition >= 1000) {
        confidence = '보통';
        confidenceScore = 2;
      } else if (acquisition >= 100) {
        confidence = '낮음';
        confidenceScore = 1;
      }

      const arpu = purchase > 0 ? revenue / purchase : 0;

      const channelNameLower = channelName.toLowerCase();
      let channelType = 'organic';
      let estimatedCPA = 0;

      if (channelNameLower.includes('광고') || channelNameLower.includes('ad') || channelNameLower.includes('paid')) {
        channelType = 'paid';
        estimatedCPA = 1500;
      } else if (channelNameLower.includes('direct') || channelNameLower === 'direct') {
        channelType = 'direct';
        estimatedCPA = 0;
      } else if (channelNameLower.includes('organic') || channelNameLower.includes('쇼핑') || channelNameLower.includes('블로그')) {
        channelType = 'organic_optimizable';
        estimatedCPA = 300;
      } else {
        channelType = 'referral';
        estimatedCPA = 500;
      }

      const investmentScore = cvr * arpu * (1 + confidenceScore * 0.1);

      let estimatedVisitors = 0;
      let expectedPurchases = 0;
      let expectedRevenue = 0;
      let roi = -100;
      let isInvestable = true;

      if (channelType === 'direct') {
        isInvestable = false;
      } else if (estimatedCPA > 0) {
        estimatedVisitors = 1000000 / estimatedCPA;
        expectedPurchases = estimatedVisitors * (cvr / 100);
        expectedRevenue = expectedPurchases * arpu;
        roi = expectedRevenue > 0 ? ((expectedRevenue - 1000000) / 1000000 * 100) : -100;
      }

      return {
        channel: channelName,
        cvr,
        revenue,
        purchase,
        acquisition,
        arpu,
        confidence,
        confidenceScore,
        investmentScore,
        channelType,
        estimatedCPA,
        isInvestable,
        estimatedVisitors,
        expectedPurchases,
        expectedRevenue,
        roi
      };
    }).filter(item => item.acquisition > 0 && item.cvr > 0)
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 8);
  }, [getPeriodData]);

  // ========================================
  // 채널 목록 (퍼널 필터용)
  // ========================================
  const channelOptions = useMemo(() => {
    const channels = new Set<string>();
    dailyData.forEach(row => {
      const channel = row.channel || row.Channel;
      if (channel) channels.add(channel);
    });
    return Array.from(channels).sort();
  }, [dailyData]);

  // ========================================
  // 정렬된 채널 테이블 데이터 (updateChannelTable)
  // ========================================
  const sortedChannelData = useMemo(() => {
    if (channelData.length === 0) return [];

    const { column, direction } = channelTableSort;

    return [...channelData].sort((a, b) => {
      let aVal: number, bVal: number;

      if (column === 'channel' || column === 'Channel') {
        const aStr = String(a.channel || a['Channel'] || '');
        const bStr = String(b.channel || b['Channel'] || '');
        return direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      }

      if (column === 'CVR') {
        aVal = parseFloat(String(a.CVR)) || 0;
        bVal = parseFloat(String(b.CVR)) || 0;
      } else if (column === 'Revenue') {
        aVal = parseFloat(String(a.Revenue)) || 0;
        bVal = parseFloat(String(b.Revenue)) || 0;
      } else {
        aVal = parseFloat(String(a[column as keyof ChannelDataRow])) || 0;
        bVal = parseFloat(String(b[column as keyof ChannelDataRow])) || 0;
      }

      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [channelData, channelTableSort]);

  // 테이블 정렬 핸들러
  const handleTableSort = useCallback((column: string) => {
    setChannelTableSort(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  }, []);

  // ========================================
  // getStageInsights 함수
  // ========================================
  const getStageInsights = useCallback((stage: FunnelDataItem, index: number) => {
    const insights: Record<number, { insight: string; recommendation: string }> = {
      0: {
        insight: '사용자 유입의 시작 단계입니다.',
        recommendation: '유료 광고, SEO, 소셜 미디어 등 다양한 채널의 유입 품질을 개선하세요.'
      },
      1: {
        insight: '첫 방문자가 활성화되는 단계입니다.',
        recommendation: Number(stage.dropOffRate) > 50
          ? '이탈률이 매우 높습니다. 랜딩페이지 속도, 디자인, CTA를 즉시 개선하세요.'
          : '랜딩페이지 A/B 테스트를 통해 전환율을 지속적으로 개선하세요.'
      },
      2: {
        insight: '사용자가 제품/서비스에 관심을 보이는 단계입니다.',
        recommendation: Number(stage.dropOffRate) > 40
          ? '제품 페이지의 정보 품질과 이미지를 개선하고, 리뷰를 강화하세요.'
          : '추천 시스템과 개인화를 통해 관심을 구매로 전환하세요.'
      },
      3: {
        insight: '결제를 시작한 단계입니다.',
        recommendation: Number(stage.dropOffRate) > 30
          ? '결제 프로세스를 단순화하고, 배송비/결제 수단을 명확히 표시하세요.'
          : '원클릭 결제, 게스트 체크아웃 등으로 마찰을 최소화하세요.'
      },
      4: {
        insight: '최종 구매 완료 단계입니다.',
        recommendation: '이메일 마케팅, 리타겟팅 광고, 로열티 프로그램으로 재구매를 유도하세요.'
      }
    };

    return insights[index] || { insight: '', recommendation: '' };
  }, []);

  // ========================================
  // analysisPeriod 계산
  // ========================================
  const analysisPeriod = useMemo(() => {
    const periodData = getPeriodData();
    if (!periodData) return '';

    // meta.analysis_period 형식: "2025-02-12 ~ 2026-01-05"
    const meta = periodData.meta as { analysis_period?: string } | undefined;
    if (meta?.analysis_period) {
      return `(${meta.analysis_period})`;
    }
    return '';
  }, [getPeriodData]);

  // ========================================
  // 렌더링
  // ========================================
  return (
    <div className="funnel-dashboard">
      {/* 헤더 */}
      <div className="header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#212121', margin: 0 }}>고객 구매 여정 분석 대시보드</h1>
          <div className="header-subtitle" style={{ fontSize: '14px', color: '#9e9e9e', marginTop: '4px' }}>
            방문자가 고객이 되기까지의 전 과정을 한눈에 분석 <span id="analysisPeriod" style={{ color: '#673ab7', fontWeight: 600 }}>{analysisPeriod}</span>
          </div>
          <div style={{ marginTop: '8px', fontSize: '13px', color: '#757575', lineHeight: 1.6 }}>
            💡 <strong>이 대시보드는</strong> 웹사이트 방문자가 실제 구매까지 이르는 과정을 5단계로 나누어 보여줍니다. 각 단계에서 얼마나 많은 고객을 잃는지, 어떤 채널이 효과적인지 파악할 수 있습니다.
          </div>
        </div>
      </div>

      {/* 0. 성과 요약 배너 */}
      {summaryCardBanner && (
        <div id="summaryCardBanner" style={{
          display: 'block',
          marginBottom: '24px',
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div id="summaryCardTitle" style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                {(summaryCardBanner as Record<string, string>).title || '이번 달 성과 요약'}
              </div>
              <div id="summaryCardMessage" style={{ fontSize: '15px', opacity: 0.95 }}>
                {(summaryCardBanner as Record<string, string>).status_message || ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>방문자</div>
                <div id="summaryCardVisitors" style={{ fontSize: '20px', fontWeight: 700 }}>
                  {(summaryCardBanner as Record<string, string>).visitors_text || '-'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>구매자</div>
                <div id="summaryCardPurchasers" style={{ fontSize: '20px', fontWeight: 700 }}>
                  {(summaryCardBanner as Record<string, string>).purchasers_text || '-'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>전환율</div>
                <div id="summaryCardCVR" style={{ fontSize: '20px', fontWeight: 700 }}>
                  {(summaryCardBanner as Record<string, string>).cvr_text || '-'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. 핵심 KPI 요약 */}
      <div className="kpi-summary-grid" id="funnelKpiSummaryGrid">
        {kpiSummary.map((kpi, index) => (
          <div key={index} className="kpi-summary-card card">
            <div className="kpi-summary-label">{kpi.label} (총 합계)</div>
            <div className="kpi-summary-value">{formatNumber(kpi.value)}</div>
            <div className="kpi-summary-unit">{kpi.unit}</div>
          </div>
        ))}
      </div>

      {/* 2. 인터랙티브 퍼널 시각화 (D3.js) - KPI 바로 다음 배치 */}
      <div className="chart-section card">
        <div className="chart-header">
          📊 고객 구매 여정 5단계
          <div style={{ float: 'right', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              id="funnelCompareBtn"
              className="view-btn"
              onClick={() => setIsCompareMode(!isCompareMode)}
              style={{ fontSize: '14px', padding: '8px 20px' }}
            >
              {isCompareMode ? '돌아가기' : '비교'}
            </button>
            <button
              id="funnelFilterBtn"
              className="view-btn"
              onClick={() => {
                if (funnelFilterActive) {
                  setFunnelFilterActive(false);
                  setSelectedFunnelChannel('');
                } else {
                  setFunnelFilterActive(true);
                }
              }}
              style={{
                fontSize: '14px',
                padding: '8px 20px',
                background: funnelFilterActive ? '#673ab7' : '',
                color: funnelFilterActive ? 'white' : ''
              }}
            >
              {funnelFilterActive ? '해제' : '필터'}
            </button>
            <select
              id="funnelChannelFilter"
              value={selectedFunnelChannel}
              onChange={(e) => setSelectedFunnelChannel(e.target.value)}
              style={{
                display: funnelFilterActive ? 'block' : 'none',
                padding: '8px 12px',
                fontSize: '13px',
                fontFamily: 'inherit',
                fontWeight: 400,
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer',
                minWidth: '150px'
              }}
            >
              <option value="">전체 채널</option>
              {channelOptions.map(channel => (
                <option key={channel} value={channel}>{channel}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 설명 */}
        <div style={{ fontSize: '13px', color: 'var(--grey-600)', marginBottom: '16px' }}>
          <strong>각 단계를 마우스로 가리키면</strong> 해당 단계의 전환율과 개선 방법을 확인할 수 있습니다.
        </div>

        {/* 단일 퍼널 뷰 */}
        <div id="singleFunnelView" style={{ display: !isCompareMode ? 'block' : 'none' }}>
          <div id="d3FunnelChart" ref={d3FunnelRef} style={{ height: '650px' }}></div>
        </div>

        {/* 비교 퍼널 뷰 */}
        <div id="compareFunnelView" style={{ display: isCompareMode ? 'block' : 'none' }}>
          {/* 기간 선택 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* 왼쪽 기간 선택 */}
            <div className="filter-section card">
              <div className="filter-header">왼쪽 기간 선택</div>
              <div className="filter-row" style={{ marginBottom: 0 }}>
                <div className="filter-group">
                  <div className="date-range">
                    <input
                      type="date"
                      id="leftStartDate"
                      value={leftStartDate}
                      onChange={(e) => setLeftStartDate(e.target.value)}
                    />
                    <span>~</span>
                    <input
                      type="date"
                      id="leftEndDate"
                      value={leftEndDate}
                      onChange={(e) => setLeftEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 가운데 빈 공간 */}
            <div style={{ minWidth: '60px' }}></div>

            {/* 오른쪽 기간 선택 */}
            <div className="filter-section card">
              <div className="filter-header">오른쪽 기간 선택</div>
              <div className="filter-row" style={{ marginBottom: 0 }}>
                <div className="filter-group">
                  <div className="date-range">
                    <input
                      type="date"
                      id="rightStartDate"
                      value={rightStartDate}
                      onChange={(e) => setRightStartDate(e.target.value)}
                    />
                    <span>~</span>
                    <input
                      type="date"
                      id="rightEndDate"
                      value={rightEndDate}
                      onChange={(e) => setRightEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 퍼널 차트 비교 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'start' }}>
            {/* 왼쪽 퍼널 */}
            <div id="d3FunnelChartLeft" ref={d3FunnelLeftRef}></div>

            {/* 가운데 비교 인사이트 */}
            <div id="comparisonInsights" style={{
              minWidth: '320px',
              maxWidth: '400px',
              padding: '16px',
              background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%)',
              borderRadius: '12px',
              border: '2px solid #e0e7ff'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#616161' }}>📊 변화 요약</div>
                <div style={{ fontSize: '10px', color: '#9e9e9e', marginTop: '2px' }}>왼쪽 → 오른쪽</div>
              </div>
              <div id="comparisonContent" style={{ fontSize: '13px', color: '#616161' }}>
                기간을 선택하면 비교 분석 결과가 표시됩니다.
              </div>
            </div>

            {/* 오른쪽 퍼널 */}
            <div id="d3FunnelChartRight" ref={d3FunnelRightRef}></div>
          </div>
        </div>
      </div>

      {/* 3. 고급 분석 결과 (A/B Testing, Clustering, Churn Prediction) */}
      <div className="collapsible-section">
        <div className="collapsible-header" onClick={() => setDecisionToolExpanded(!decisionToolExpanded)}>
          <div className="collapsible-title">
            <span className="collapsible-icon">🔬</span>
            <span>데이터 기반 의사결정 도구 (핵심 요약, 긴급 개선, 채널 분석, 예산, CRM 가이드)</span>
          </div>
          <button className="collapsible-toggle">
            <span>{decisionToolExpanded ? '접기' : '펼치기'}</span>
            <span className={`collapsible-toggle-icon ${decisionToolExpanded ? '' : 'collapsed'}`}>▼</span>
          </button>
        </div>
        <div className={`collapsible-content ${decisionToolExpanded ? 'expanded' : ''}`}>
          {/* 기간 필터 버튼 */}
          <div style={{ marginBottom: '12px', padding: '12px 16px', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', borderRadius: '10px', border: '1px solid #dee2e6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#495057' }}>📅 분석 기간:</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  className={`period-filter-btn ${currentPeriod === 'full' ? 'active' : ''}`}
                  data-period="full"
                  onClick={() => switchPeriod('full')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: currentPeriod === 'full' ? '1px solid #673ab7' : '1px solid #dee2e6',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: currentPeriod === 'full' ? '#673ab7' : 'white',
                    color: currentPeriod === 'full' ? 'white' : '#495057'
                  }}
                >
                  전체 기간
                </button>
                <button
                  className={`period-filter-btn ${currentPeriod === '180d' ? 'active' : ''}`}
                  data-period="180d"
                  onClick={() => switchPeriod('180d')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: currentPeriod === '180d' ? '1px solid #673ab7' : '1px solid #dee2e6',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: currentPeriod === '180d' ? '#673ab7' : 'white',
                    color: currentPeriod === '180d' ? 'white' : '#495057'
                  }}
                >
                  최근 180일
                </button>
                <button
                  className={`period-filter-btn ${currentPeriod === '90d' ? 'active' : ''}`}
                  data-period="90d"
                  onClick={() => switchPeriod('90d')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: currentPeriod === '90d' ? '1px solid #673ab7' : '1px solid #dee2e6',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: currentPeriod === '90d' ? '#673ab7' : 'white',
                    color: currentPeriod === '90d' ? 'white' : '#495057'
                  }}
                >
                  최근 90일
                </button>
                <button
                  className={`period-filter-btn ${currentPeriod === '30d' ? 'active' : ''}`}
                  data-period="30d"
                  onClick={() => switchPeriod('30d')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: currentPeriod === '30d' ? '1px solid #673ab7' : '1px solid #dee2e6',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: currentPeriod === '30d' ? '#673ab7' : 'white',
                    color: currentPeriod === '30d' ? 'white' : '#495057'
                  }}
                >
                  최근 30일
                </button>
              </div>
              <span id="periodDateRange" style={{ fontSize: '11px', color: '#6c757d', marginLeft: 'auto' }}></span>
            </div>
          </div>

          {/* 탭 버튼 */}
          <div className="view-type-section" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '6px', alignItems: 'center', display: 'flex' }}>
            <button
              className={`view-btn decision-tool-tab-btn period-filter-enabled ${decisionToolTab === 'summary' ? 'active' : ''}`}
              data-tab="summary"
              title="선택한 기간 필터가 적용됩니다"
              onClick={() => setDecisionToolTab('summary')}
            >
              📊 핵심 요약
            </button>
            <button
              className={`view-btn decision-tool-tab-btn period-filter-enabled ${decisionToolTab === 'urgent' ? 'active' : ''}`}
              data-tab="urgent"
              title="선택한 기간 필터가 적용됩니다"
              onClick={() => setDecisionToolTab('urgent')}
            >
              🚨 긴급 개선 <span id="urgentTotalCount" style={{ fontSize: '11px', opacity: 0.8 }}>({urgentAlertsData.high.length + urgentAlertsData.medium.length})</span>
            </button>
            <button
              className={`view-btn decision-tool-tab-btn period-filter-enabled ${decisionToolTab === 'clustering' ? 'active' : ''}`}
              data-tab="clustering"
              title="선택한 기간 필터가 적용됩니다"
              onClick={() => setDecisionToolTab('clustering')}
            >
              채널 그룹별 분석
            </button>
            <button
              className={`view-btn decision-tool-tab-btn period-filter-enabled ${decisionToolTab === 'budget' ? 'active' : ''}`}
              data-tab="budget"
              title="선택한 기간 필터가 적용됩니다"
              onClick={() => setDecisionToolTab('budget')}
            >
              예산 투자 가이드
            </button>
            <button
              className={`view-btn decision-tool-tab-btn period-filter-enabled ${decisionToolTab === 'crm_guide' ? 'active' : ''}`}
              data-tab="crm_guide"
              title="선택한 기간 필터가 적용됩니다"
              onClick={() => setDecisionToolTab('crm_guide')}
            >
              CRM 가이드
            </button>
          </div>

          {/* 탭 1: 핵심 요약 */}
          <div className={`decision-tool-tab-content ${decisionToolTab === 'summary' ? 'active' : ''}`} id="summaryTab">
            <div className="insight-content" id="insightContent">
              {keyInsights.length > 0 ? keyInsights.map((card, index) => {
                const hasAction = card.action && card.action.text;
                const hasSubItems = card.sub_items && card.sub_items.length > 0 && card.sub_items[0];

                return (
                  <div
                    key={index}
                    style={{
                      background: card.bg_color,
                      border: `2px solid ${card.border_color}`,
                      borderRadius: '10px',
                      padding: '14px',
                      transition: 'transform 0.2s',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    {/* 헤더 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        background: `${card.border_color}20`,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span style={{ fontSize: '16px' }}>{card.icon}</span>
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: card.text_color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>{card.label}</span>
                      {card.urgency_score && (
                        <span style={{
                          marginLeft: 'auto',
                          fontSize: '10px',
                          padding: '2px 6px',
                          background: card.border_color,
                          color: 'white',
                          borderRadius: '8px'
                        }}>긴급도 {card.urgency_score}</span>
                      )}
                    </div>
                    {/* 메시지 */}
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--grey-900)',
                      lineHeight: 1.6,
                      flex: 1,
                      marginBottom: hasAction || hasSubItems ? '10px' : '0'
                    }}>{card.message}</div>
                    {/* 서브 아이템 */}
                    {hasSubItems && (
                      <div style={{
                        background: 'rgba(255,255,255,0.7)',
                        borderRadius: '6px',
                        padding: '10px',
                        borderLeft: `3px solid ${card.border_color}`,
                        marginBottom: hasAction ? '10px' : '0'
                      }}>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: card.text_color, marginBottom: '4px' }}>📌 상세 정보</div>
                        {card.sub_items!.filter(item => item).map((item, i) => (
                          <div key={i} style={{ fontSize: '11px', color: '#333', lineHeight: 1.5 }}>→ {item}</div>
                        ))}
                      </div>
                    )}
                    {/* 추천 액션 */}
                    {hasAction && (
                      <div style={{
                        background: 'rgba(255,255,255,0.7)',
                        borderRadius: '6px',
                        padding: '10px',
                        borderLeft: '3px solid #ab47bc'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 600, color: '#7b1fa2' }}>💡 추천 액션</div>
                          {card.action!.type && (
                            <span style={{
                              fontSize: '9px',
                              padding: '2px 6px',
                              background: card.action!.type === 'scale_up' || card.action!.type === 'opportunity' ? '#e8f5e9' : card.action!.type === 'primary' ? '#fff3e0' : '#e3f2fd',
                              color: card.action!.type === 'scale_up' || card.action!.type === 'opportunity' ? '#2e7d32' : card.action!.type === 'primary' ? '#e65100' : '#1565c0',
                              borderRadius: '4px',
                              fontWeight: 600
                            }}>
                              {card.action!.type === 'scale_up' ? '증액' : card.action!.type === 'opportunity' ? '기회' : card.action!.type === 'primary' ? '개선' : '유지'}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#333', lineHeight: 1.4 }}>{card.action!.text}</div>
                        {card.action!.secondary && (
                          <div style={{ fontSize: '10px', color: '#5e35b1', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #d1c4e9', lineHeight: 1.4 }}>➕ {card.action!.secondary}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }) : (
                <div className="insight-card neutral">
                  <div className="insight-text">데이터를 불러오는 중...</div>
                </div>
              )}
            </div>
          </div>

          {/* 탭 2: 긴급 개선 포인트 */}
          <div className={`decision-tool-tab-content ${decisionToolTab === 'urgent' ? 'active' : ''}`} id="urgentTab">
            {/* 서브탭: 즉시 조치 / 개선 권장 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                className={`view-btn urgent-alert-tab-btn ${urgentAlertTab === 'high' ? 'active' : ''}`}
                data-tab="high"
                onClick={() => setUrgentAlertTab('high')}
                style={{ fontSize: '13px' }}
              >
                ⚠️ 즉시 조치 필요 <span id="highAlertCount" style={{ fontSize: '11px', opacity: 0.8 }}>({urgentAlertsData.high.length}건)</span>
              </button>
              <button
                className={`view-btn urgent-alert-tab-btn ${urgentAlertTab === 'medium' ? 'active' : ''}`}
                data-tab="medium"
                onClick={() => setUrgentAlertTab('medium')}
                style={{ fontSize: '13px' }}
              >
                📌 개선 권장 <span id="mediumAlertCount" style={{ fontSize: '11px', opacity: 0.8 }}>({urgentAlertsData.medium.length}건)</span>
              </button>
            </div>
            {/* 즉시 조치 필요 */}
            <div id="highAlertsTab" className={`urgent-alert-tab-content ${urgentAlertTab === 'high' ? 'active' : ''}`}>
              <div id="highAlertsCards" style={{ display: 'grid', gap: '12px' }}>
                {urgentAlertsData.high.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--grey-500)' }}>
                    즉시 조치가 필요한 항목이 없습니다.
                  </div>
                ) : urgentAlertsData.high
                  .slice(0, urgentAlertsShowAll.high ? undefined : 3)
                  .map((alert, index) => {
                    const severityStyles: Record<string, { bgColor: string; borderColor: string; textColor: string }> = {
                      critical: { bgColor: '#ffebee', borderColor: '#f44336', textColor: '#c62828' },
                      high: { bgColor: '#fff3e0', borderColor: '#ff9800', textColor: '#e65100' },
                      medium: { bgColor: '#fff8e1', borderColor: '#ffc107', textColor: '#f57f17' }
                    };
                    const subTypeIcons: Record<string, string> = {
                      'traffic_leak': '🚿', 'hidden_vip': '💎', 'checkout_friction': '🛒',
                      'growth_engine': '🚀', 'activation_drop': '🚪', 'engagement_gap': '📉', 'silent_majority': '😶'
                    };
                    const style = severityStyles[alert.severity] || severityStyles.medium;
                    const icon = subTypeIcons[alert.sub_type] || '⚠️';
                    const diagnosis = alert.diagnosis || alert.reason || '';
                    const urgencyScore = alert.urgency_score || 0;
                    const urgencyLabel = urgencyScore >= 70 ? '긴급' : urgencyScore >= 40 ? '주의' : '참고';

                    return (
                      <div
                        key={index}
                        style={{
                          background: style.bgColor,
                          border: `2px solid ${style.borderColor}`,
                          borderRadius: '10px',
                          padding: '14px',
                          transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                      >
                        {/* 헤더 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '18px' }}>{icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: style.textColor }}>{alert.title}</div>
                            <div style={{ fontSize: '10px', color: style.textColor, opacity: 0.8 }}>{alert.category || '일반'} &gt; {alert.sub_type || '분석'}</div>
                          </div>
                          {urgencyScore > 0 && (
                            <span style={{ background: style.borderColor, color: 'white', fontSize: '9px', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                              {urgencyLabel} {urgencyScore}
                            </span>
                          )}
                        </div>
                        {/* 메트릭스 배지 */}
                        {alert.metrics && Object.keys(alert.metrics).length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            {Object.entries(alert.metrics).map(([k, v]) => {
                              const colorMap: Record<string, { color: string; border: string }> = {
                                '유입→활동': { color: '#1565c0', border: '#90caf9' },
                                '활동→관심': { color: '#1565c0', border: '#90caf9' },
                                '관심→구매': { color: '#1565c0', border: '#90caf9' },
                                '전환율': { color: '#2e7d32', border: '#a5d6a7' },
                                'CVR': { color: '#2e7d32', border: '#a5d6a7' },
                                '유입': { color: '#5e35b1', border: '#b39ddb' },
                                '활동': { color: '#5e35b1', border: '#b39ddb' },
                                '관심': { color: '#5e35b1', border: '#b39ddb' },
                                'RPV': { color: '#e65100', border: '#ffcc80' }
                              };
                              const percentKeys1 = ['유입→활동', '활동→관심', '관심→구매'];
                              const percentKeys2 = ['전환율', 'CVR'];
                              let formatted: string;
                              if (percentKeys2.includes(k)) {
                                formatted = (typeof v === 'number' ? v.toFixed(2) : v) + '%';
                              } else if (percentKeys1.includes(k)) {
                                formatted = (typeof v === 'number' ? v.toFixed(1) : v) + '%';
                              } else {
                                formatted = typeof v === 'number' ? v.toLocaleString() : String(v);
                              }
                              const s = colorMap[k] || { color: '#616161', border: '#bdbdbd' };
                              return (
                                <span key={k} style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: s.color, border: `1px solid ${s.border}`, fontWeight: 500 }}>
                                  {k} {formatted}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {/* 진단 (체크마크 스타일) */}
                        {diagnosis && (
                          <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.6, marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                              <span style={{ color: style.borderColor }}>✓</span>
                              <span>{diagnosis}</span>
                            </div>
                          </div>
                        )}
                        {/* 추천 액션 */}
                        <div style={{ background: '#ffffff', borderRadius: '6px', padding: '10px', borderLeft: `3px solid ${style.borderColor}` }}>
                          <div style={{ fontSize: '10px', fontWeight: 600, color: style.textColor, marginBottom: '4px' }}>💡 추천 액션</div>
                          <div style={{ fontSize: '11px', color: '#333', lineHeight: 1.4 }}>{alert.action_detail?.primary || alert.action || '데이터 분석 후 대응 방안을 수립하세요.'}</div>
                          {alert.action_detail?.secondary && (
                            <div style={{ fontSize: '10px', color: '#5e35b1', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #d1c4e9', lineHeight: 1.4 }}>➕ {alert.action_detail.secondary}</div>
                          )}
                          {(alert.impact?.lost_users || alert.impact?.potential_revenue) ? (
                            <div style={{ fontSize: '10px', color: '#c62828', marginTop: '6px' }}>
                              📉 영향: {alert.impact.lost_users ? `이탈 ${alert.impact.lost_users}명` : ''}{alert.impact.potential_revenue ? ` · 잠재 손실 ₩${alert.impact.potential_revenue.toLocaleString()}` : ''}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div id="highAlertsToggleContainer" style={{ textAlign: 'center', marginTop: '12px', display: urgentAlertsData.high.length > 3 ? 'block' : 'none' }}>
                <button
                  id="highAlertsToggleBtn"
                  className="view-btn"
                  onClick={() => setUrgentAlertsShowAll(prev => ({ ...prev, high: !prev.high }))}
                  style={{ fontSize: '13px', padding: '8px 20px' }}
                >
                  {urgentAlertsShowAll.high ? '접기' : `더 보기 (${urgentAlertsData.high.length - 3}건)`}
                </button>
              </div>
            </div>
            {/* 개선 권장 */}
            <div id="mediumAlertsTab" className={`urgent-alert-tab-content ${urgentAlertTab === 'medium' ? 'active' : ''}`}>
              <div id="mediumAlertsCards" style={{ display: 'grid', gap: '12px' }}>
                {urgentAlertsData.medium.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--grey-500)' }}>
                    개선 권장 항목이 없습니다.
                  </div>
                ) : urgentAlertsData.medium
                  .slice(0, urgentAlertsShowAll.medium ? undefined : 3)
                  .map((alert, index) => {
                    const severityStyles: Record<string, { bgColor: string; borderColor: string; textColor: string }> = {
                      critical: { bgColor: '#ffebee', borderColor: '#f44336', textColor: '#c62828' },
                      high: { bgColor: '#fff3e0', borderColor: '#ff9800', textColor: '#e65100' },
                      medium: { bgColor: '#fff8e1', borderColor: '#ffc107', textColor: '#f57f17' }
                    };
                    const subTypeIcons: Record<string, string> = {
                      'traffic_leak': '🚿', 'hidden_vip': '💎', 'checkout_friction': '🛒',
                      'growth_engine': '🚀', 'activation_drop': '🚪', 'engagement_gap': '📉', 'silent_majority': '😶'
                    };
                    const style = severityStyles[alert.severity] || severityStyles.medium;
                    const icon = subTypeIcons[alert.sub_type] || '⚠️';
                    const diagnosis = alert.diagnosis || alert.reason || '';
                    const urgencyScore = alert.urgency_score || 0;
                    const urgencyLabel = urgencyScore >= 70 ? '긴급' : urgencyScore >= 40 ? '주의' : '참고';

                    return (
                      <div
                        key={index}
                        style={{
                          background: style.bgColor,
                          border: `2px solid ${style.borderColor}`,
                          borderRadius: '10px',
                          padding: '14px',
                          transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                      >
                        {/* 헤더 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '18px' }}>{icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: style.textColor }}>{alert.title}</div>
                            <div style={{ fontSize: '10px', color: style.textColor, opacity: 0.8 }}>{alert.category || '일반'} &gt; {alert.sub_type || '분석'}</div>
                          </div>
                          {urgencyScore > 0 && (
                            <span style={{ background: style.borderColor, color: 'white', fontSize: '9px', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                              {urgencyLabel} {urgencyScore}
                            </span>
                          )}
                        </div>
                        {/* 메트릭스 배지 */}
                        {alert.metrics && Object.keys(alert.metrics).length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            {Object.entries(alert.metrics).map(([k, v]) => {
                              const colorMap: Record<string, { color: string; border: string }> = {
                                '유입→활동': { color: '#1565c0', border: '#90caf9' },
                                '활동→관심': { color: '#1565c0', border: '#90caf9' },
                                '관심→구매': { color: '#1565c0', border: '#90caf9' },
                                '전환율': { color: '#2e7d32', border: '#a5d6a7' },
                                'CVR': { color: '#2e7d32', border: '#a5d6a7' },
                                '유입': { color: '#5e35b1', border: '#b39ddb' },
                                '활동': { color: '#5e35b1', border: '#b39ddb' },
                                '관심': { color: '#5e35b1', border: '#b39ddb' },
                                'RPV': { color: '#e65100', border: '#ffcc80' }
                              };
                              const percentKeys1 = ['유입→활동', '활동→관심', '관심→구매'];
                              const percentKeys2 = ['전환율', 'CVR'];
                              let formatted: string;
                              if (percentKeys2.includes(k)) {
                                formatted = (typeof v === 'number' ? v.toFixed(2) : v) + '%';
                              } else if (percentKeys1.includes(k)) {
                                formatted = (typeof v === 'number' ? v.toFixed(1) : v) + '%';
                              } else {
                                formatted = typeof v === 'number' ? v.toLocaleString() : String(v);
                              }
                              const s = colorMap[k] || { color: '#616161', border: '#bdbdbd' };
                              return (
                                <span key={k} style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: s.color, border: `1px solid ${s.border}`, fontWeight: 500 }}>
                                  {k} {formatted}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {/* 진단 (체크마크 스타일) */}
                        {diagnosis && (
                          <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.6, marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                              <span style={{ color: style.borderColor }}>✓</span>
                              <span>{diagnosis}</span>
                            </div>
                          </div>
                        )}
                        {/* 추천 액션 */}
                        <div style={{ background: '#ffffff', borderRadius: '6px', padding: '10px', borderLeft: `3px solid ${style.borderColor}` }}>
                          <div style={{ fontSize: '10px', fontWeight: 600, color: style.textColor, marginBottom: '4px' }}>💡 추천 액션</div>
                          <div style={{ fontSize: '11px', color: '#333', lineHeight: 1.4 }}>{alert.action_detail?.primary || alert.action || '데이터 분석 후 대응 방안을 수립하세요.'}</div>
                          {alert.action_detail?.secondary && (
                            <div style={{ fontSize: '10px', color: '#5e35b1', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #d1c4e9', lineHeight: 1.4 }}>➕ {alert.action_detail.secondary}</div>
                          )}
                          {(alert.impact?.lost_users || alert.impact?.potential_revenue) ? (
                            <div style={{ fontSize: '10px', color: '#c62828', marginTop: '6px' }}>
                              📉 영향: {alert.impact.lost_users ? `이탈 ${alert.impact.lost_users}명` : ''}{alert.impact.potential_revenue ? ` · 잠재 손실 ₩${alert.impact.potential_revenue.toLocaleString()}` : ''}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div id="mediumAlertsToggleContainer" style={{ textAlign: 'center', marginTop: '12px', display: urgentAlertsData.medium.length > 3 ? 'block' : 'none' }}>
                <button
                  id="mediumAlertsToggleBtn"
                  className="view-btn"
                  onClick={() => setUrgentAlertsShowAll(prev => ({ ...prev, medium: !prev.medium }))}
                  style={{ fontSize: '13px', padding: '8px 20px' }}
                >
                  {urgentAlertsShowAll.medium ? '접기' : `더 보기 (${urgentAlertsData.medium.length - 3}건)`}
                </button>
              </div>
            </div>
          </div>

          {/* 탭 3: 채널 클러스터링 + BCG Matrix 통합 */}
          <div className={`decision-tool-tab-content ${decisionToolTab === 'clustering' ? 'active' : ''}`} id="clusteringTab">
            {/* BCG Matrix 채널 전략 */}
            <div className="chart-section card" style={{ marginBottom: '16px' }}>
              <div className="chart-header">📈 BCG Matrix 채널 전략</div>
              <div style={{ fontSize: '13px', color: 'var(--grey-600)', padding: '0 20px 12px 20px' }}>
                <strong>&apos;지금 어떤 채널에 돈을 써야하나?&apos;</strong> 투자 의사결정을 돕기위해 트래픽과 전환율을 기준으로 각 채널을 4가지 유형으로 분류했습니다.
              </div>
              <div id="bcgMatrixContent" style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {bcgMatrix ? (
                  Object.entries(bcgMatrix).filter(([, q]) => q.channels.length > 0).map(([key, q]) => (
                    <div key={key} style={{ padding: '16px', background: q.bgColor, borderRadius: '12px', borderLeft: `4px solid ${q.color}` }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--grey-900)', marginBottom: '4px' }}>
                        {q.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-600)', marginBottom: '12px' }}>
                        {q.desc}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                        {q.channels.map(ch => (
                          <span key={ch.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'white', borderRadius: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--grey-800)' }}>
                            {ch.name}
                            <span style={{ fontSize: '11px', color: q.color }}>(CVR {ch.cvr}%)</span>
                          </span>
                        ))}
                      </div>
                      {q.channels[0] ? (
                        <div style={{ fontSize: '12px', color: 'var(--grey-700)', padding: '10px', background: 'white', borderRadius: '6px' }}>
                          {q.channels[0].action}
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--grey-500)', gridColumn: 'span 2' }}>채널 전략 데이터가 없습니다.</div>
                )}
                {bcgMatrix && Object.values(bcgMatrix).every(q => q.channels.length === 0) && (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--grey-500)', gridColumn: 'span 2' }}>분류된 채널이 없습니다.</div>
                )}
              </div>
            </div>
            {/* 채널 퍼널 건강도 분석 */}
            <div className="chart-section card" style={{ marginBottom: '16px' }}>
              <div className="chart-header">🩺 채널 퍼널 건강도 분석</div>
              <div style={{ fontSize: '13px', color: 'var(--grey-600)', padding: '0 20px 12px 20px' }}>
                <strong>&apos;지금 어떤 채널의 퍼널 흐름이 건강해?&apos;</strong> 각 채널의 유입→활동→관심→결제 단계별 전환 효율을 K-mean 툴로 종합 분석했습니다. 퍼널 건강 그룹은 모든 단계가 원활하고, 점검 필요 그룹은 중간 이탈이 심합니다.
              </div>
              <div id="channelClusters" style={{ padding: '20px' }}>
                {channelClusters?.clusters ? (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ fontSize: '14px', color: 'var(--grey-700)', marginBottom: '12px' }}>
                        퍼널 건강도 기준 <strong>{channelClusters.n_clusters}개</strong> 그룹으로 분류
                        <span style={{ fontSize: '12px', color: 'var(--grey-500)', marginLeft: '8px' }}>(유입→활동→관심→결제 단계별 전환율 평균)</span>
                      </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                      {Object.entries(channelClusters.clusters).map(([clusterName, channels], index) => {
                        const colors = ['var(--success-main)', 'var(--warning-main)', 'var(--error-main)'];
                        const bgColors = ['var(--success-light)', 'var(--warning-light)', 'var(--error-light)'];
                        return (
                          <div key={clusterName} style={{ padding: '16px', background: bgColors[index % 3], borderRadius: '8px', borderLeft: `4px solid ${colors[index % 3]}` }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--grey-900)', marginBottom: '8px' }}>
                              {channelClusters.description?.[clusterName] || clusterName}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--grey-700)' }}>
                              {(channels as string[]).map((ch: string) => (
                                <span key={ch} style={{ display: 'inline-block', padding: '4px 8px', background: 'white', borderRadius: '4px', margin: '2px' }}>{ch}</span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p style={{ color: 'var(--grey-500)' }}>클러스터링 결과가 없습니다.</p>
                )}
              </div>
              {/* A/B 테스트 통계 결과 컨테이너 */}
              <div id="abTestStatsContainer" style={{ padding: '0 20px 20px 20px' }}>
                {(() => {
                  const periodData = getPeriodData();
                  const hasAbTestResults = periodData?.ab_test_results && periodData.ab_test_results.length > 0;

                  if (hasAbTestResults && abTestResults.length > 0) {
                    // Case 1: 유의미한 결과 있음
                    return (
                      <div style={{ padding: '16px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: '8px', borderLeft: '4px solid var(--success-main)' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--success-main)', marginBottom: '12px' }}>
                          📊 통계적으로 유의미한 채널 비교 ({abTestResults.length}건)
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--grey-600)', marginBottom: '12px' }}>
                          p-value &lt; 0.05로 통계적으로 유의미한 전환율 차이가 확인된 채널 조합입니다.
                        </div>
                        <div style={{ display: 'grid', gap: '8px' }}>
                          {abTestResults.map((test, index) => (
                            <div key={index} style={{ padding: '12px', background: 'white', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 600, color: 'var(--grey-800)' }}>{test.group_a}</span>
                                <span style={{ fontSize: '12px', color: test.cvr_a < test.cvr_b ? 'var(--error-main)' : 'var(--success-main)' }}>({test.cvr_a}%)</span>
                              </div>
                              <span style={{ color: 'var(--grey-400)' }}>vs</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 600, color: 'var(--grey-800)' }}>{test.group_b}</span>
                                <span style={{ fontSize: '12px', color: test.cvr_b < test.cvr_a ? 'var(--error-main)' : 'var(--success-main)' }}>({test.cvr_b}%)</span>
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--grey-500)', marginLeft: 'auto' }}>p={test.p_value.toFixed(4)}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: '12px', padding: '10px', background: '#f5f5f5', borderRadius: '6px', fontSize: '12px', color: 'var(--grey-700)' }}>
                          💡 <strong>활용 방법:</strong> 전환율이 높은 채널의 전략을 전환율이 낮은 채널에 적용해보세요.
                        </div>
                      </div>
                    );
                  } else if (hasAbTestResults && abTestResults.length === 0) {
                    // Case 2: 데이터는 있지만 유의미한 결과 없음
                    return (
                      <div style={{ padding: '16px', background: 'linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%)', borderRadius: '8px', borderLeft: '4px solid var(--grey-400)' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--grey-600)', marginBottom: '8px' }}>
                          📊 통계적으로 유의미한 채널 비교
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--grey-500)' }}>
                          선택한 기간 내에서는 통계적으로 유의미한 전환율 차이(p-value &lt; 0.05)를 보이는 채널 조합이 없습니다.
                        </div>
                        <div style={{ marginTop: '12px', padding: '10px', background: 'white', borderRadius: '6px', fontSize: '12px', color: 'var(--grey-600)' }}>
                          💡 <strong>참고:</strong> 분석 기간을 &apos;전체 기간&apos;으로 변경하면 더 많은 데이터를 기반으로 유의미한 결과를 확인할 수 있습니다.
                        </div>
                      </div>
                    );
                  } else {
                    // Case 3: 데이터 자체가 없음
                    return (
                      <div style={{ padding: '16px', background: 'linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%)', borderRadius: '8px', borderLeft: '4px solid var(--grey-400)' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--grey-600)', marginBottom: '8px' }}>
                          📊 통계적으로 유의미한 채널 비교
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--grey-500)' }}>
                          채널 비교 분석 데이터가 없습니다.
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          </div>

          {/* 탭 4: 예산 투자 가이드 */}
          <div className={`decision-tool-tab-content ${decisionToolTab === 'budget' ? 'active' : ''}`} id="budgetTab">
            <div className="chart-section card" style={{ marginBottom: '16px' }}>
              <div className="chart-header">💰 예산 투자 가이드: 채널별 투자 효율성 분석</div>
              <div style={{ fontSize: '13px', color: 'var(--grey-600)', padding: '0 20px 12px 20px' }}>
                각 채널의 전환율, 객단가, 실제 성과 데이터를 종합하여 <strong>100만원 투자 시 예상되는 구체적인 성과</strong>를 시뮬레이션했습니다.
                <strong>&quot;신뢰도&quot;</strong>는 데이터 양에 기반한 분석의 정확도를 나타내며, 채널 타입별로 다른 투자 전략을 제시합니다.
                <div style={{ marginTop: '8px', padding: '8px', background: 'var(--grey-50)', borderRadius: '6px', fontSize: '12px' }}>
                  <strong>📌 분석 기준:</strong> 광고 채널(1,500원/방문자), 오가닉 최적화(300원/방문자), 레퍼럴(500원/방문자) 등 업계 평균 CPA 적용
                </div>
              </div>
              <div id="abTestResults" style={{ padding: '20px' }}>
                {(() => {
                  const periodData = getPeriodData();
                  const channelStrategy = periodData?.channel_strategy;

                  if (!channelStrategy || channelStrategy.status !== 'success' || !channelStrategy.channels) {
                    return <p style={{ color: 'var(--grey-500)' }}>채널 전략 데이터가 없습니다.</p>;
                  }

                  if (investmentGuide.length === 0) {
                    return <p style={{ color: 'var(--grey-500)' }}>선택한 기간에 분석 가능한 채널 데이터가 없습니다.</p>;
                  }

                  return (
                    <>
                      <div style={{ marginBottom: '16px' }}>
                        <p style={{ fontSize: '14px', color: 'var(--grey-700)', marginBottom: '8px' }}>
                          <strong>{investmentGuide.length}개</strong> 채널의 투자 효율성 분석 완료
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--grey-600)' }}>
                          💡 전환율, 평균 객단가, 데이터 신뢰도를 종합하여 투자 시 기대 성과가 높은 순으로 정렬했습니다.
                        </p>
                      </div>
                      <div id="investmentItemsContainer" style={{ display: 'grid', gap: '12px' }}>
                        {investmentGuide.map((channel, index) => {
                          const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}위`;
                          const confidenceColor = channel.confidenceScore >= 3 ? 'var(--success-main)' :
                            channel.confidenceScore === 2 ? 'var(--warning-main)' : 'var(--grey-400)';
                          const bgColor = channel.confidenceScore >= 3 ? 'linear-gradient(135deg, var(--success-light) 0%, #f0fff4 100%)' :
                            channel.confidenceScore === 2 ? 'linear-gradient(135deg, var(--warning-light) 0%, #fff9e6 100%)' : 'var(--grey-50)';
                          const borderColor = channel.confidenceScore >= 3 ? 'var(--success-main)' :
                            channel.confidenceScore === 2 ? 'var(--warning-main)' : 'var(--grey-300)';
                          const hiddenClass = index >= 3 && !investmentExpanded ? ' hidden-row' : '';

                          // 투자 전략 메시지 생성
                          const getInvestmentStrategy = () => {
                            if (channel.channelType === 'paid') {
                              if (channel.roi > 200) return `이 광고 채널은 <strong style="color: var(--success-main);">매우 높은 수익률(+${formatDecimal(channel.roi)}%)</strong>을 보입니다. 100만원 투자 시 약 <strong>${formatNumber(Math.round(channel.expectedRevenue))}원</strong>의 매출이 예상되며, <strong>추가 예산 투입</strong>을 적극 권장합니다.`;
                              if (channel.roi > 100) return `이 광고 채널은 <strong style="color: var(--success-main);">양호한 수익률(+${formatDecimal(channel.roi)}%)</strong>을 보입니다. 100만원 투자로 약 ${formatNumber(Math.round(channel.estimatedVisitors))}명 유입, ${formatNumber(Math.round(channel.expectedPurchases))}건 구매가 예상됩니다. <strong>예산 증액 고려</strong>를 추천합니다.`;
                              if (channel.roi > 0) return `이 광고 채널은 수익성이 있으나(+${formatDecimal(channel.roi)}%), 다른 채널 대비 효율이 낮습니다. 광고 소재와 타겟팅을 개선하면 더 나은 성과를 기대할 수 있습니다.`;
                              return `현재 이 광고 채널은 손실(${formatDecimal(channel.roi)}%)이 예상됩니다. <strong>캠페인 최적화 또는 예산 재분배</strong>가 필요합니다.`;
                            } else if (channel.channelType === 'organic_optimizable') {
                              if (channel.roi > 200) return `SEO/콘텐츠 최적화에 <strong>100만원 투자 시 약 ${formatNumber(Math.round(channel.estimatedVisitors))}명의 추가 유입</strong>과 <strong>${formatNumber(Math.round(channel.expectedRevenue))}원의 매출</strong>이 예상됩니다. 전환율이 ${formatDecimal(channel.cvr)}%로 높아 <strong style="color: var(--success-main);">매우 효율적인 투자처</strong>입니다.`;
                              if (channel.roi > 0) return `이 채널은 오가닉 트래픽 최적화를 통해 수익을 창출할 수 있습니다. SEO, 블로그 콘텐츠, 쇼핑몰 최적화 등에 투자하면 지속 가능한 성장이 가능합니다.`;
                              return `현재 전환율(${formatDecimal(channel.cvr)}%)과 객단가(${formatNumber(Math.round(channel.arpu))}원)를 고려할 때, 투자 전 콘텐츠 품질과 사용자 경험 개선이 우선입니다.`;
                            }
                            return `이 채널은 전환율 ${formatDecimal(channel.cvr)}%, 객단가 ${formatNumber(Math.round(channel.arpu))}원으로 투자 효율성이 확인되었습니다. 파트너십 강화나 제휴 확대를 고려해보세요.`;
                          };

                          return (
                            <div key={channel.channel} className={`investment-item${hiddenClass}`} style={{ padding: '16px', background: bgColor, borderRadius: '8px', borderLeft: `4px solid ${borderColor}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--grey-900)', marginBottom: '8px' }}>
                                    {rankEmoji} {channel.channel}
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                                    <div style={{ padding: '8px', background: 'white', borderRadius: '6px' }}>
                                      <div style={{ fontSize: '11px', color: 'var(--grey-600)', marginBottom: '2px' }}>전환율</div>
                                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-main)' }}>{formatDecimal(channel.cvr)}%</div>
                                    </div>
                                    <div style={{ padding: '8px', background: 'white', borderRadius: '6px' }}>
                                      <div style={{ fontSize: '11px', color: 'var(--grey-600)', marginBottom: '2px' }}>평균 객단가</div>
                                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--success-main)' }}>{formatNumber(Math.round(channel.arpu))}원</div>
                                    </div>
                                    <div style={{ padding: '8px', background: 'white', borderRadius: '6px' }}>
                                      <div style={{ fontSize: '11px', color: 'var(--grey-600)', marginBottom: '2px' }}>데이터 신뢰도</div>
                                      <div style={{ fontSize: '13px', fontWeight: 700, color: confidenceColor }}>{channel.confidence}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {channel.confidenceScore >= 2 ? (
                                channel.isInvestable ? (
                                  <>
                                    <div style={{ padding: '14px', background: 'white', borderRadius: '8px', borderLeft: '3px solid var(--primary-main)', marginBottom: '8px' }}>
                                      <div style={{ fontSize: '13px', color: 'var(--grey-900)', fontWeight: 700, marginBottom: '10px' }}>
                                        💰 100만원 투자 시 예상 성과
                                        <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--grey-600)', marginLeft: '8px' }}>
                                          (예상 CPA: {formatNumber(channel.estimatedCPA)}원/방문자)
                                        </span>
                                      </div>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                                        <div>
                                          <div style={{ fontSize: '11px', color: 'var(--grey-600)', marginBottom: '4px' }}>예상 유입</div>
                                          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--secondary-main)' }}>약 {formatNumber(Math.round(channel.estimatedVisitors))}명</div>
                                        </div>
                                        <div>
                                          <div style={{ fontSize: '11px', color: 'var(--grey-600)', marginBottom: '4px' }}>예상 구매</div>
                                          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-main)' }}>약 {formatNumber(Math.round(channel.expectedPurchases))}건</div>
                                        </div>
                                        <div>
                                          <div style={{ fontSize: '11px', color: 'var(--grey-600)', marginBottom: '4px' }}>예상 매출</div>
                                          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--success-main)' }}>약 {formatNumber(Math.round(channel.expectedRevenue))}원</div>
                                        </div>
                                      </div>
                                      <div style={{ padding: '10px', background: channel.roi > 100 ? '#e8f5e9' : channel.roi > 0 ? '#fff3e0' : '#ffebee', borderRadius: '6px' }}>
                                        <div style={{ fontSize: '11px', color: 'var(--grey-600)', marginBottom: '4px' }}>예상 ROI (투자수익률)</div>
                                        <div style={{ fontSize: '22px', fontWeight: 700, color: channel.roi > 0 ? 'var(--success-main)' : 'var(--error-main)' }}>
                                          {channel.roi > 0 ? '+' : ''}{formatDecimal(channel.roi)}%
                                          <span style={{ fontSize: '12px', fontWeight: 500, marginLeft: '8px' }}>
                                            (순이익: {channel.roi > 0 ? '+' : ''}{formatNumber(Math.round(channel.expectedRevenue - 1000000))}원)
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #e8eaf6 0%, #f3f4f9 100%)', borderRadius: '6px' }}>
                                      <div style={{ fontSize: '12px', color: 'var(--grey-800)', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: `💡 <strong>투자 전략:</strong><br>${getInvestmentStrategy()}` }} />
                                    </div>
                                  </>
                                ) : (
                                  <div style={{ padding: '14px', background: 'linear-gradient(135deg, #fff3e0 0%, #fff9e6 100%)', borderRadius: '8px', borderLeft: '3px solid var(--warning-main)' }}>
                                    <div style={{ fontSize: '13px', color: 'var(--grey-900)', fontWeight: 700, marginBottom: '8px' }}>
                                      ℹ️ Direct 자연 유입 채널
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.6 }}>
                                      이 채널은 <strong>자연 유입(Direct Traffic)</strong>으로, 직접적인 광고 투자 대상이 아닙니다.<br /><br />
                                      <strong>현재 성과:</strong><br />
                                      • 전환율: {formatDecimal(channel.cvr)}%<br />
                                      • 평균 객단가: {formatNumber(Math.round(channel.arpu))}원<br />
                                      • 총 매출: {formatNumber(channel.revenue)}원<br /><br />
                                      💡 <strong>개선 방안:</strong> 브랜드 인지도 향상, 이메일 마케팅, 리마케팅 등을 통해 Direct 유입을 늘릴 수 있습니다. 현재 높은 전환율({formatDecimal(channel.cvr)}%)을 유지하면서 유입량을 증가시키는 것이 핵심입니다.
                                    </div>
                                  </div>
                                )
                              ) : (
                                <div style={{ padding: '12px', background: 'white', borderRadius: '6px', borderLeft: '3px solid var(--grey-300)' }}>
                                  <div style={{ fontSize: '12px', color: 'var(--grey-700)' }}>
                                    ⚠️ 데이터가 충분하지 않아 정확한 투자 성과 예측이 어렵습니다. 더 많은 데이터를 수집한 후 재평가하세요. (현재 유입: {formatNumber(channel.acquisition)}명)
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {investmentGuide.length > 3 && (
                        <>
                          <div className="show-more-container" id="investmentShowMoreContainer" style={{ marginTop: '12px', display: investmentExpanded ? 'none' : 'block' }}>
                            <button className="show-more-btn" id="investmentShowMoreBtn" onClick={() => setInvestmentExpanded(true)}>
                              더 보기 (<span id="investmentHiddenCount">{investmentGuide.length - 3}</span>개)
                            </button>
                          </div>
                          <div className="show-more-container" id="investmentCollapseContainer" style={{ display: investmentExpanded ? 'block' : 'none', marginTop: '12px' }}>
                            <button className="show-more-btn" id="investmentCollapseBtn" onClick={() => setInvestmentExpanded(false)}>
                              접기
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* 탭 5: CRM 가이드 (기간 필터 적용) */}
          <div className={`decision-tool-tab-content ${decisionToolTab === 'crm_guide' ? 'active' : ''}`} id="crmGuideTab">
            <div className="chart-section card" style={{ marginBottom: '16px' }}>
              <div className="chart-header">📋 CRM 액션 가이드</div>
              <div style={{ fontSize: '13px', color: 'var(--grey-600)', padding: '0 20px 12px 20px' }}>
                선택한 기간의 데이터를 분석하여 이탈 위험을 방지하기 위한 <strong>구체적인 CRM 액션</strong>을 제안합니다.
                각 단계별로 즉시 실행 가능한 처방을 확인하세요.
              </div>
              <div id="crmActionsContainer" style={{ padding: '20px' }}>
                {(() => {
                  if (!crmActionsData.hasData) {
                    return (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--grey-500)' }}>
                        <p>선택한 기간의 CRM 액션 데이터가 없습니다.</p>
                      </div>
                    );
                  }

                  if (crmActionsData.actions.length === 0) {
                    return (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--success-main)' }}>
                        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '48px', height: '48px', marginBottom: '12px' }}>
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>이탈 위험 없음</p>
                        <p style={{ fontSize: '14px', color: 'var(--grey-600)' }}>{crmActionsData.periodLabel} 동안 특별한 CRM 액션이 필요하지 않습니다.</p>
                      </div>
                    );
                  }

                  const priorityColors: Record<string, { border: string; bg: string; badge: string; label: string }> = {
                    'high': { border: '#ef5350', bg: '#ffebee', badge: '#c62828', label: '긴급' },
                    'medium': { border: '#ffa726', bg: '#fff3e0', badge: '#ef6c00', label: '주의' },
                    'low': { border: '#66bb6a', bg: '#e8f5e9', badge: '#2e7d32', label: '모니터링' }
                  };

                  return (
                    <>
                      <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
                        <div style={{ fontSize: '13px', color: 'var(--grey-700)' }}>
                          <strong>{crmActionsData.periodLabel}</strong> 기간 분석 결과, <strong style={{ color: 'var(--primary-main)' }}>{crmActionsData.actions.length}건</strong>의 CRM 액션이 필요합니다.
                        </div>
                      </div>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {crmActionsData.actions.map((action: { priority?: string; stage?: string; trend?: string; diagnosis?: string; prescription?: string }, index: number) => {
                          const priority = action.priority || 'medium';
                          const colors = priorityColors[priority] || priorityColors['medium'];
                          return (
                            <div key={index} style={{ padding: '16px', background: colors.bg, borderRadius: '8px', borderLeft: `4px solid ${colors.border}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--grey-900)' }}>
                                  📍 {action.stage || '알 수 없는 단계'}
                                </div>
                                <span style={{ fontSize: '11px', padding: '3px 8px', background: colors.badge, color: 'white', borderRadius: '10px' }}>
                                  {colors.label}
                                </span>
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--grey-700)', marginBottom: '6px' }}>
                                <strong>현황:</strong> {action.trend || '데이터 없음'}
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--grey-600)', marginBottom: '10px', fontStyle: 'italic' }}>
                                <strong>진단:</strong> {action.diagnosis || '진단 정보 없음'}
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--grey-900)', padding: '12px', background: 'white', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                💊 <strong>처방:</strong> {action.prescription || '처방 정보 없음'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 최근 변화 인사이트 (접기/펼치기) */}
      <div className="collapsible-section" style={{ marginBottom: '24px' }}>
        <div className="collapsible-header" onClick={() => setTrendInsightExpanded(!trendInsightExpanded)}>
          <div className="collapsible-title">
            <span className="collapsible-icon">📈</span>
            <span>최근 변화 인사이트</span>
          </div>
          <button className="collapsible-toggle">
            <span>{trendInsightExpanded ? '접기' : '펼치기'}</span>
            <span className={`collapsible-toggle-icon ${trendInsightExpanded ? '' : 'collapsed'}`}>▼</span>
          </button>
        </div>
        <div className={`collapsible-content ${trendInsightExpanded ? 'expanded' : ''}`}>
          {/* 기간 비교 선택 */}
          <div id="trendPeriodIndicator" style={{ marginBottom: '16px', padding: '14px 18px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)', borderRadius: '10px', border: '1px solid #bbdefb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '16px' }}>📊</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1565c0' }}>비교 기간:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['30d', '14d', '7d'] as const).map(period => (
                  <button
                    key={period}
                    className={`trend-period-btn ${trendPeriod === period ? 'active' : ''}`}
                    data-trend-period={period}
                    onClick={() => setTrendPeriod(period)}
                    style={{
                      padding: '6px 14px',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: trendPeriod === period ? '1px solid #673ab7' : '1px solid #dee2e6',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: trendPeriod === period ? '#673ab7' : 'white',
                      color: trendPeriod === period ? 'white' : '#495057'
                    }}
                  >
                    {period === '30d' ? '30일' : period === '14d' ? '14일' : '7일'}
                  </button>
                ))}
              </div>
              <span id="trendPeriodText" style={{ fontSize: '12px', color: '#37474f', marginLeft: 'auto' }}>
                <strong style={{ color: '#1565c0' }}>최근 {performanceTrends.days || 7}일</strong> ({performanceTrends.recentStart}~{performanceTrends.recentEnd}) vs <strong style={{ color: '#7b1fa2' }}>이전 {performanceTrends.days || 7}일</strong> ({performanceTrends.previousStart}~{performanceTrends.previousEnd})
              </span>
            </div>
          </div>
          {/* 2열 그리드 */}
          <div className="compact-grid-2" style={{ marginBottom: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, background: 'white', border: '1px solid var(--grey-200)', borderRadius: '12px', overflow: 'hidden' }}>
            {/* 성과 개선 분석 */}
            <div style={{ padding: '24px', borderRight: '1px solid var(--grey-200)', background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #4caf50' }}>
                <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #66bb6a 0%, #4caf50 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '14px', filter: 'brightness(10)' }}>✨</span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#2e7d32' }}>좋은 소식: 어떤 부분이 좋아졌나요?</span>
              </div>
              <div className="insight-content" id="improvementTrendContent" style={{ display: 'block', maxHeight: '400px', overflowY: 'auto', paddingTop: '4px' }}>
                {!insightsData?.performance_trends ? (
                  <div className="insight-card neutral">
                    <div className="insight-text" style={{ textAlign: 'center', padding: '20px' }}>
                      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '48px', height: '48px', opacity: 0.5, color: 'var(--grey-500)', display: 'block', margin: '0 auto 12px auto' }}>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm0-12h2v10h-2V5z"/>
                      </svg>
                      <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', color: 'var(--grey-700)' }}>데이터 없음</p>
                      <p style={{ fontSize: '14px', color: 'var(--grey-600)' }}>성과 트렌드 데이터가 아직 생성되지 않았습니다.</p>
                    </div>
                  </div>
                ) : performanceTrends.improvements.length === 0 ? (
                  <div className="insight-card neutral">
                    <div className="insight-text" style={{ textAlign: 'center', padding: '20px' }}>
                      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '48px', height: '48px', opacity: 0.5, color: 'var(--grey-500)', display: 'block', margin: '0 auto 12px auto' }}>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm0-12h2v10h-2V5z"/>
                      </svg>
                      <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', color: 'var(--grey-700)' }}>개선 사항 없음</p>
                      <p style={{ fontSize: '14px', color: 'var(--grey-600)' }}>현재 기간에 유의미한 성과 개선이 감지되지 않았습니다.</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {performanceTrends.improvements.map((item, index) => (
                      <div
                        key={index}
                        style={{ background: '#e8f5e9', border: '2px solid #4caf50', borderRadius: '10px', padding: '14px', transition: 'transform 0.2s' }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        {/* 헤더 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '18px' }}>📈</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#2e7d32' }}>{item.metric}</div>
                            <div style={{ fontSize: '10px', color: '#2e7d32', opacity: 0.8 }}>{performanceTrends.periodText}</div>
                          </div>
                          <span style={{ background: '#4caf50', color: 'white', fontSize: '9px', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>+{item.change_pct}% {item.improvement_level === 'high' ? '높음' : '중간'}</span>
                        </div>
                        {/* 메트릭스 배지 */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                          <span style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: '#1565c0', border: '1px solid #90caf9', fontWeight: 500 }}>최근 {formatNumber(item.recent_avg)}</span>
                          <span style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: '#5e35b1', border: '1px solid #b39ddb', fontWeight: 500 }}>이전 {formatNumber(item.previous_avg)}</span>
                        </div>
                        {/* 추천 액션 */}
                        <div style={{ background: '#ffffff', borderRadius: '6px', padding: '10px', borderLeft: '3px solid #4caf50' }}>
                          <div style={{ fontSize: '10px', fontWeight: 600, color: '#2e7d32', marginBottom: '4px' }}>💡 추천 액션</div>
                          <div style={{ fontSize: '11px', color: '#333', lineHeight: 1.4 }}>{item.recommendation}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 성과 하락 경고 */}
            <div style={{ padding: '24px', background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #ef5350' }}>
                <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #ef5350 0%, #f44336 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '14px', filter: 'brightness(10)' }}>⚠️</span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#c62828' }}>주의 필요: 성과 하락 감지</span>
              </div>
              <div className="insight-content" id="declineTrendContent" style={{ display: 'block', maxHeight: '400px', overflowY: 'auto', paddingTop: '4px' }}>
                {!insightsData?.performance_trends ? (
                  <div className="insight-card neutral">
                    <div className="insight-text" style={{ textAlign: 'center', padding: '20px' }}>
                      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '48px', height: '48px', opacity: 0.5, color: 'var(--grey-500)', display: 'block', margin: '0 auto 12px auto' }}>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm0-12h2v10h-2V5z"/>
                      </svg>
                      <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', color: 'var(--grey-700)' }}>데이터 없음</p>
                      <p style={{ fontSize: '14px', color: 'var(--grey-600)' }}>성과 트렌드 데이터가 아직 생성되지 않았습니다.</p>
                    </div>
                  </div>
                ) : performanceTrends.declines.length === 0 ? (
                  <div className="insight-card neutral">
                    <div className="insight-text" style={{ textAlign: 'center', padding: '20px' }}>
                      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '48px', height: '48px', color: 'var(--success-main)', display: 'block', margin: '0 auto 12px auto' }}>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', color: 'var(--success-main)' }}>하락 없음</p>
                      <p style={{ fontSize: '14px', color: 'var(--grey-600)' }}>모든 지표가 안정적이거나 개선되고 있습니다.</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {performanceTrends.declines.map((item, index) => {
                      const isHigh = item.risk_level === 'high';
                      const bgColor = isHigh ? '#ffebee' : '#fff3e0';
                      const borderColor = isHigh ? '#f44336' : '#ff9800';
                      const textColor = isHigh ? '#c62828' : '#e65100';
                      const badgeColor = isHigh ? '#f44336' : '#ff9800';
                      return (
                        <div
                          key={index}
                          style={{ background: bgColor, border: `2px solid ${borderColor}`, borderRadius: '10px', padding: '14px', transition: 'transform 0.2s' }}
                          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                          {/* 헤더 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '18px' }}>📉</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: textColor }}>{item.metric}</div>
                              <div style={{ fontSize: '10px', color: textColor, opacity: 0.8 }}>{performanceTrends.periodText}</div>
                            </div>
                            <span style={{ background: badgeColor, color: 'white', fontSize: '9px', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>{item.change_pct}% {isHigh ? '높음' : '중간'}</span>
                          </div>
                          {/* 메트릭스 배지 */}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            <span style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: '#1565c0', border: '1px solid #90caf9', fontWeight: 500 }}>최근 {formatNumber(item.recent_avg)}</span>
                            <span style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: '#5e35b1', border: '1px solid #b39ddb', fontWeight: 500 }}>이전 {formatNumber(item.previous_avg)}</span>
                          </div>
                          {/* 추천 액션 */}
                          <div style={{ background: '#ffffff', borderRadius: '6px', padding: '10px', borderLeft: `3px solid ${borderColor}` }}>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: textColor, marginBottom: '4px' }}>⚠️ 주의 필요</div>
                            <div style={{ fontSize: '11px', color: '#333', lineHeight: 1.4 }}>{item.recommendation}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. 유형별 조치 가이드 (독립 섹션) */}
      <div className="collapsible-section">
        <div className="collapsible-header" onClick={() => setMicroSegmentSectionExpanded(!microSegmentSectionExpanded)}>
          <div className="collapsible-title">
            <span className="collapsible-icon">🎯</span>
            <span>유형별 조치 가이드 (SA, DA, PR, CRM, etc)</span>
          </div>
          <button className="collapsible-toggle">
            <span>{microSegmentSectionExpanded ? '접기' : '펼치기'}</span>
            <span className={`collapsible-toggle-icon ${microSegmentSectionExpanded ? 'expanded' : 'collapsed'}`}>▼</span>
          </button>
        </div>
        <div className={`collapsible-content ${microSegmentSectionExpanded ? 'expanded' : ''}`}>
          <div style={{ fontSize: '13px', color: 'var(--grey-600)', marginBottom: '16px' }}>
            채널 카테고리(SA, DA, SNS 등)별로 <strong>맞춤 처방</strong>과 <strong>조치 가이드</strong>를 제공합니다. 카테고리를 선택하면 해당 유형의 문제점과 개선 방안을 확인할 수 있습니다.
          </div>

          {/* 기간 필터 */}
          <div style={{ marginBottom: '12px', padding: '12px 16px', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', borderRadius: '10px', border: '1px solid #dee2e6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#495057' }}>📅 분석 기간:</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { period: 'full', label: '전체 기간' },
                  { period: '180d', label: '최근 180일' },
                  { period: '90d', label: '최근 90일' },
                  { period: '30d', label: '최근 30일' }
                ].map(({ period, label }) => (
                  <button
                    key={period}
                    className={`micro-segment-period-btn ${microSegmentPeriod === period ? 'active' : ''}`}
                    data-period={period}
                    onClick={() => switchMicroSegmentPeriod(period)}
                    style={{
                      padding: '6px 14px',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: microSegmentPeriod === period ? '1px solid #673ab7' : '1px solid #dee2e6',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: microSegmentPeriod === period ? '#673ab7' : 'white',
                      color: microSegmentPeriod === period ? 'white' : '#495057'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span id="microSegmentPeriodDateRange" style={{ fontSize: '11px', color: '#6c757d', marginLeft: 'auto' }}>
                {(() => {
                  const periodData = getMicroSegmentPeriodData();
                  if (periodData?.overall?.current_period) {
                    const { start_date, end_date } = periodData.overall.current_period;
                    const start = new Date(start_date);
                    const end = new Date(end_date);
                    const diffTime = Math.abs(end.getTime() - start.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    return `${start_date} ~ ${end_date} (${diffDays}일)`;
                  }
                  return '';
                })()}
              </span>
            </div>
          </div>

          {/* 카테고리 필터 */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--grey-600)' }}>카테고리:</span>
            {[
              { cat: 'all', label: '전체' },
              { cat: 'SA', label: 'SA' },
              { cat: 'DA', label: 'DA' },
              { cat: 'SNS', label: 'SNS' },
              { cat: 'CRM', label: 'CRM' },
              { cat: 'PR', label: 'PR' },
              { cat: 'Organic', label: 'Organic' },
              { cat: 'etc', label: '기타' }
            ].map(({ cat, label }) => (
              <button
                key={cat}
                className={`view-btn micro-category-filter ${currentMicroCategoryFilter === cat ? 'active' : ''}`}
                data-category={cat}
                onClick={() => setCurrentMicroCategoryFilter(cat)}
                style={{ fontSize: '11px', padding: '5px 10px' }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 세그먼트 알림 서브탭 */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              className={`view-btn micro-segment-tab-btn ${microSegmentTab === 'problem' ? 'active' : ''}`}
              data-type="problem"
              onClick={() => setMicroSegmentTab('problem')}
              style={{ fontSize: '13px' }}
            >
              🚧 문제점 <span id="microProblemCount" style={{ fontSize: '11px', opacity: 0.8 }}>({microSegmentData.problems.length}건)</span>
            </button>
            <button
              className={`view-btn micro-segment-tab-btn ${microSegmentTab === 'opportunity' ? 'active' : ''}`}
              data-type="opportunity"
              onClick={() => setMicroSegmentTab('opportunity')}
              style={{ fontSize: '13px' }}
            >
              🚀 기회 <span id="microOpportunityCount" style={{ fontSize: '11px', opacity: 0.8 }}>({microSegmentData.opportunities.length}건)</span>
            </button>
          </div>

          {/* 문제점 알림 */}
          <div id="microProblemTab" className="micro-segment-tab-content" style={{ display: microSegmentTab === 'problem' ? 'block' : 'none' }}>
            <div id="microProblemCards" style={{ display: 'grid', gap: '12px' }}>
              {microSegmentData.problems.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--grey-500)' }}>
                  현재 문제점이 없습니다.
                </div>
              ) : (
                microSegmentData.problems
                  .slice(0, microSegmentShowAll.problem ? undefined : 5)
                  .map((alert, index) => {
                    const severityStyles: Record<string, { bgColor: string; borderColor: string; textColor: string; icon: string }> = {
                      critical: { bgColor: '#ffebee', borderColor: '#f44336', textColor: '#c62828', icon: '🚨' },
                      high: { bgColor: '#fff3e0', borderColor: '#ff9800', textColor: '#e65100', icon: '⚠️' },
                      medium: { bgColor: '#fff8e1', borderColor: '#ffc107', textColor: '#f57f17', icon: '📌' },
                      opportunity: { bgColor: '#e8f5e9', borderColor: '#4caf50', textColor: '#2e7d32', icon: '🚀' }
                    };
                    const style = severityStyles[alert.severity] || severityStyles.medium;
                    const subTypeIcons: Record<string, string> = {
                      'traffic_leak': '🚿',
                      'hidden_vip': '💎',
                      'checkout_friction': '🛒',
                      'growth_engine': '🚀',
                      'activation_drop': '🚪',
                      'engagement_gap': '📉',
                      'silent_majority': '😶'
                    };
                    const icon = subTypeIcons[alert.sub_type] || (alert.type === 'opportunity' ? '✨' : '⚠️');
                    const urgencyScore = alert.urgency_score || 0;
                    const urgencyLabel = urgencyScore >= 70 ? '긴급' : urgencyScore >= 40 ? '주의' : '참고';

                    const renderMetricsBadges = (metrics: Record<string, string | number> | undefined) => {
                      if (!metrics) return null;
                      const colorMap: Record<string, { color: string; border: string }> = {
                        '유입→활동': { color: '#1565c0', border: '#90caf9' },
                        '활동→관심': { color: '#1565c0', border: '#90caf9' },
                        '관심→구매': { color: '#1565c0', border: '#90caf9' },
                        '전환율': { color: '#2e7d32', border: '#a5d6a7' },
                        'CVR': { color: '#2e7d32', border: '#a5d6a7' },
                        '유입': { color: '#5e35b1', border: '#b39ddb' },
                        '활동': { color: '#5e35b1', border: '#b39ddb' },
                        '관심': { color: '#5e35b1', border: '#b39ddb' },
                        'RPV': { color: '#e65100', border: '#ffcc80' }
                      };
                      const percentKeys1 = ['유입→활동', '활동→관심', '관심→구매'];
                      const percentKeys2 = ['전환율', 'CVR'];
                      return Object.entries(metrics).map(([k, v], i) => {
                        let formatted: string;
                        if (percentKeys2.includes(k)) {
                          formatted = (typeof v === 'number' ? v.toFixed(2) : v) + '%';
                        } else if (percentKeys1.includes(k)) {
                          formatted = (typeof v === 'number' ? v.toFixed(1) : v) + '%';
                        } else {
                          formatted = typeof v === 'number' ? v.toLocaleString() : String(v);
                        }
                        const s = colorMap[k] || { color: '#616161', border: '#bdbdbd' };
                        return (
                          <span key={i} style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: s.color, border: `1px solid ${s.border}`, fontWeight: 500 }}>
                            {k} {formatted}
                          </span>
                        );
                      });
                    };

                    return (
                      <div
                        key={index}
                        className="micro-segment-card"
                        style={{ background: style.bgColor, border: `2px solid ${style.borderColor}`, borderRadius: '10px', padding: '14px', cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        {/* 헤더 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '18px' }}>{icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: style.textColor }}>{alert.title}</div>
                            <div style={{ fontSize: '10px', color: style.textColor, opacity: 0.8 }}>{alert.category} &gt; {alert.sub_type || '일반'}</div>
                          </div>
                          {urgencyScore > 0 && (
                            <span style={{ background: style.borderColor, color: 'white', fontSize: '9px', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                              {urgencyLabel} {urgencyScore}
                            </span>
                          )}
                        </div>
                        {/* 메트릭스 배지 */}
                        {alert.metrics && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            {renderMetricsBadges(alert.metrics)}
                          </div>
                        )}
                        {/* 진단 */}
                        {alert.diagnosis && (
                          <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.6, marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                              <span style={{ color: style.borderColor }}>✓</span>
                              <span>{alert.diagnosis}</span>
                            </div>
                          </div>
                        )}
                        {/* 추천 액션 */}
                        {alert.action && (
                          <div style={{ background: '#ffffff', borderRadius: '6px', padding: '10px', borderLeft: `3px solid ${style.borderColor}` }}>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: style.textColor, marginBottom: '4px' }}>💡 추천 액션</div>
                            <div style={{ fontSize: '11px', color: '#333', lineHeight: 1.4 }}>{alert.action}</div>
                            {alert.impact?.potential_revenue ? (
                              <div style={{ fontSize: '10px', color: '#2e7d32', marginTop: '6px' }}>
                                📈 예상 효과: {alert.impact.potential_revenue > 0 ? `${alert.impact.potential_revenue.toLocaleString()}원 매출 기회` : '이탈 방지'}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
            <div id="microProblemToggleContainer" style={{ textAlign: 'center', marginTop: '12px', display: microSegmentData.problems.length > 5 ? 'block' : 'none' }}>
              <button
                id="microProblemToggleBtn"
                className="view-btn"
                style={{ fontSize: '13px', padding: '8px 20px' }}
                onClick={() => setMicroSegmentShowAll(prev => ({ ...prev, problem: !prev.problem }))}
              >
                {microSegmentShowAll.problem ? '접기' : `더 보기 (${microSegmentData.problems.length - 5}건)`}
              </button>
            </div>
          </div>

          {/* 기회 알림 */}
          <div id="microOpportunityTab" className="micro-segment-tab-content" style={{ display: microSegmentTab === 'opportunity' ? 'block' : 'none' }}>
            <div id="microOpportunityCards" style={{ display: 'grid', gap: '12px' }}>
              {microSegmentData.opportunities.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--grey-500)' }}>
                  현재 기회 항목이 없습니다.
                </div>
              ) : (
                microSegmentData.opportunities
                  .slice(0, microSegmentShowAll.opportunity ? undefined : 5)
                  .map((alert, index) => {
                    const style = { bgColor: '#e8f5e9', borderColor: '#4caf50', textColor: '#2e7d32', icon: '🚀' };
                    const subTypeIcons: Record<string, string> = {
                      'traffic_leak': '🚿',
                      'hidden_vip': '💎',
                      'checkout_friction': '🛒',
                      'growth_engine': '🚀',
                      'activation_drop': '🚪',
                      'engagement_gap': '📉',
                      'silent_majority': '😶'
                    };
                    const icon = subTypeIcons[alert.sub_type] || '✨';
                    const urgencyScore = alert.urgency_score || 0;
                    const urgencyLabel = urgencyScore >= 70 ? '긴급' : urgencyScore >= 40 ? '주의' : '참고';

                    const renderMetricsBadges = (metrics: Record<string, string | number> | undefined) => {
                      if (!metrics) return null;
                      const colorMap: Record<string, { color: string; border: string }> = {
                        '유입→활동': { color: '#1565c0', border: '#90caf9' },
                        '활동→관심': { color: '#1565c0', border: '#90caf9' },
                        '관심→구매': { color: '#1565c0', border: '#90caf9' },
                        '전환율': { color: '#2e7d32', border: '#a5d6a7' },
                        'CVR': { color: '#2e7d32', border: '#a5d6a7' },
                        '유입': { color: '#5e35b1', border: '#b39ddb' },
                        '활동': { color: '#5e35b1', border: '#b39ddb' },
                        '관심': { color: '#5e35b1', border: '#b39ddb' },
                        'RPV': { color: '#e65100', border: '#ffcc80' }
                      };
                      const percentKeys1 = ['유입→활동', '활동→관심', '관심→구매'];
                      const percentKeys2 = ['전환율', 'CVR'];
                      return Object.entries(metrics).map(([k, v], i) => {
                        let formatted: string;
                        if (percentKeys2.includes(k)) {
                          formatted = (typeof v === 'number' ? v.toFixed(2) : v) + '%';
                        } else if (percentKeys1.includes(k)) {
                          formatted = (typeof v === 'number' ? v.toFixed(1) : v) + '%';
                        } else {
                          formatted = typeof v === 'number' ? v.toLocaleString() : String(v);
                        }
                        const s = colorMap[k] || { color: '#616161', border: '#bdbdbd' };
                        return (
                          <span key={i} style={{ background: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', color: s.color, border: `1px solid ${s.border}`, fontWeight: 500 }}>
                            {k} {formatted}
                          </span>
                        );
                      });
                    };

                    return (
                      <div
                        key={index}
                        className="micro-segment-card"
                        style={{ background: style.bgColor, border: `2px solid ${style.borderColor}`, borderRadius: '10px', padding: '14px', cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        {/* 헤더 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '18px' }}>{icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: style.textColor }}>{alert.title}</div>
                            <div style={{ fontSize: '10px', color: style.textColor, opacity: 0.8 }}>{alert.category} &gt; {alert.sub_type || '일반'}</div>
                          </div>
                          {urgencyScore > 0 && (
                            <span style={{ background: style.borderColor, color: 'white', fontSize: '9px', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                              {urgencyLabel} {urgencyScore}
                            </span>
                          )}
                        </div>
                        {/* 메트릭스 배지 */}
                        {alert.metrics && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            {renderMetricsBadges(alert.metrics)}
                          </div>
                        )}
                        {/* 진단 */}
                        {alert.diagnosis && (
                          <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.6, marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                              <span style={{ color: style.borderColor }}>✓</span>
                              <span>{alert.diagnosis}</span>
                            </div>
                          </div>
                        )}
                        {/* 추천 액션 */}
                        {alert.action && (
                          <div style={{ background: '#ffffff', borderRadius: '6px', padding: '10px', borderLeft: `3px solid ${style.borderColor}` }}>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: style.textColor, marginBottom: '4px' }}>💡 추천 액션</div>
                            <div style={{ fontSize: '11px', color: '#333', lineHeight: 1.4 }}>{alert.action}</div>
                            {alert.impact?.potential_revenue ? (
                              <div style={{ fontSize: '10px', color: '#2e7d32', marginTop: '6px' }}>
                                📈 예상 효과: {alert.impact.potential_revenue > 0 ? `${alert.impact.potential_revenue.toLocaleString()}원 매출 기회` : '이탈 방지'}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
            <div id="microOpportunityToggleContainer" style={{ textAlign: 'center', marginTop: '12px', display: microSegmentData.opportunities.length > 5 ? 'block' : 'none' }}>
              <button
                id="microOpportunityToggleBtn"
                className="view-btn"
                style={{ fontSize: '13px', padding: '8px 20px' }}
                onClick={() => setMicroSegmentShowAll(prev => ({ ...prev, opportunity: !prev.opportunity }))}
              >
                {microSegmentShowAll.opportunity ? '접기' : `더 보기 (${microSegmentData.opportunities.length - 5}건)`}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 6. 채널별 분석 (접기 가능) */}
      <div className="collapsible-section">
        <div className="collapsible-header" onClick={() => setChannelAnalysisExpanded(!channelAnalysisExpanded)}>
          <div className="collapsible-title">
            <span className="collapsible-icon">📊</span>
            <span>유입 채널별 상세 분석 (네이버, 구글, 인스타그램 등)</span>
          </div>
          <button className="collapsible-toggle">
            <span>{channelAnalysisExpanded ? '접기' : '펼치기'}</span>
            <span className={`collapsible-toggle-icon ${channelAnalysisExpanded ? 'expanded' : 'collapsed'}`}>▼</span>
          </button>
        </div>
        <div className={`collapsible-content ${channelAnalysisExpanded ? 'expanded' : ''}`}>
          {/* 탭 버튼 */}
          <div className="view-type-section" style={{ marginBottom: '24px' }}>
            {[
              { key: 'table', label: '채널별 고객 흐름' },
              { key: 'kpi', label: '지표별 비교' },
              { key: 'balance', label: '효율성과 규모' },
              { key: 'top10', label: '전환율 TOP 10' }
            ].map(tab => (
              <button
                key={tab.key}
                className={`view-btn channel-analysis-tab-btn ${channelAnalysisTab === tab.key ? 'active' : ''}`}
                data-tab={tab.key}
                onClick={() => setChannelAnalysisTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

            {/* 탭 1: 채널별 단계별 고객 수 테이블 */}
            <div className={`channel-analysis-tab-content ${channelAnalysisTab === 'table' ? 'active' : ''}`} id="tableTab" style={{ display: channelAnalysisTab === 'table' ? 'block' : 'none' }}>
              <div className="table-section card" style={{ marginBottom: '16px' }}>
                <div className="table-header">📊 채널별 고객 흐름: 각 채널에서 얼마나 많은 고객이 구매까지 도달하나요?</div>

                {/* 설명 섹션 */}
                <div style={{ fontSize: '13px', color: 'var(--grey-700)', padding: '16px 24px', background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)', lineHeight: 1.7 }}>
                  <strong style={{ color: 'var(--primary-main)' }}>📖 이 표는 무엇을 보여주나요?</strong><br />
                  각 마케팅 채널(네이버, 구글, 인스타그램 등)에서 고객이 <strong>5단계 여정</strong>을 어떻게 거치는지 보여줍니다.<br />
                  <span style={{ color: 'var(--grey-600)' }}>예시: 유입 1,000명 → 활동 800명 → 관심 400명 → 결제진행 100명 → 구매완료 50명 (CVR 5%)</span><br /><br />
                  <strong style={{ color: 'var(--primary-main)' }}>💡 표 보는 법:</strong><br />
                  • <strong>왼쪽에서 오른쪽</strong>으로 갈수록 숫자가 줄어드는 것이 정상입니다 (고객이 단계를 거치며 이탈)<br />
                  • <strong>CVR(전환율)</strong>은 방문자 100명 중 몇 명이 최종 구매했는지를 나타냅니다 (높을수록 좋음)<br />
                  • <strong>매출</strong>이 높아도 CVR이 낮으면 개선 여지가 많다는 의미입니다<br />
                  • <strong>열 제목을 클릭</strong>하면 해당 기준으로 정렬됩니다
                </div>

                {/* 자동 인사이트 박스 */}
                <div id="channelTableInsightSummary" style={{ margin: '16px 24px', padding: '16px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: '10px', borderLeft: '4px solid #4caf50' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#4caf50', marginBottom: '8px' }}>
                    🎯 데이터 분석 결과
                  </div>
                  <div id="channelTableInsightText" style={{ fontSize: '13px', color: 'var(--grey-800)', lineHeight: 1.6 }}>
                    {channelData.length > 0 ? (() => {
                      // channelStats 계산 (HTML과 동일)
                      const channelStats = channelData.map(row => {
                        const acquisition = parseFloat(String(row['유입'])) || 0;
                        const activation = parseFloat(String(row['활동'])) || 0;
                        const consideration = parseFloat(String(row['관심'])) || 0;
                        const conversion = parseFloat(String(row['결제진행'])) || 0;
                        const purchase = parseFloat(String(row['구매완료'])) || 0;
                        const revenue = parseFloat(String(row['Revenue'])) || 0;
                        const cvr = parseFloat(String(row['CVR'])) || 0;

                        // 단계별 이탈률 계산
                        const activationChurn = acquisition > 0 ? ((acquisition - activation) / acquisition * 100) : 0;
                        const considerationChurn = activation > 0 ? ((activation - consideration) / activation * 100) : 0;
                        const conversionChurn = consideration > 0 ? ((consideration - conversion) / consideration * 100) : 0;
                        const purchaseChurn = conversion > 0 ? ((conversion - purchase) / conversion * 100) : 0;

                        return {
                          channel: row['channel'],
                          acquisition, activation, consideration, conversion, purchase, revenue, cvr,
                          activationChurn, considerationChurn, conversionChurn, purchaseChurn
                        };
                      });

                      // CVR 상위 채널
                      const topCVRChannels = [...channelStats].sort((a, b) => b.cvr - a.cvr);

                      // CVR 평균
                      const avgCVR = channelStats.reduce((sum, ch) => sum + ch.cvr, 0) / channelStats.length;

                      // 매출 높지만 CVR 낮은 채널 찾기 (매출 상위 50%, CVR 평균 이하)
                      const sortedByRevenue = [...channelStats].sort((a, b) => b.revenue - a.revenue);
                      const revenueMedian = sortedByRevenue[Math.floor(sortedByRevenue.length / 2)]?.revenue || 0;
                      const highRevenueLowCVR = channelStats.filter(ch => ch.revenue >= revenueMedian && ch.cvr < avgCVR);

                      // 유입→활동 이탈률이 높은 채널 (50% 이상)
                      const highEarlyChurn = channelStats.filter(ch => ch.activationChurn >= 50);

                      // 전체 평균 이탈률
                      const avgActivationChurn = channelStats.reduce((sum, ch) => sum + ch.activationChurn, 0) / channelStats.length;
                      const avgConsiderationChurn = channelStats.reduce((sum, ch) => sum + ch.considerationChurn, 0) / channelStats.length;
                      const avgConversionChurn = channelStats.reduce((sum, ch) => sum + ch.conversionChurn, 0) / channelStats.length;
                      const avgPurchaseChurn = channelStats.reduce((sum, ch) => sum + ch.purchaseChurn, 0) / channelStats.length;

                      // 가장 이탈률이 높은 단계 찾기
                      const churnStages = [
                        { stage: '유입→활동', avg: avgActivationChurn },
                        { stage: '활동→관심', avg: avgConsiderationChurn },
                        { stage: '관심→결제진행', avg: avgConversionChurn },
                        { stage: '결제진행→구매완료', avg: avgPurchaseChurn }
                      ];
                      const highestChurnStage = churnStages.reduce((max, item) => item.avg > max.avg ? item : max, churnStages[0]);

                      // 인사이트 생성
                      const insights: JSX.Element[] = [];

                      // 1. 최고 성과 채널
                      if (topCVRChannels[0]) {
                        insights.push(
                          <span key="top">
                            <strong style={{ color: '#4caf50' }}>🏆 최고 성과 채널:</strong>{' '}
                            <strong>{topCVRChannels[0].channel}</strong> (CVR {topCVRChannels[0].cvr.toFixed(2)}%)이 가장 효율적입니다.{' '}
                            {topCVRChannels[0].cvr > 3 ? '매우 우수한 전환율입니다! 이 채널의 광고 예산을 늘리세요. ' :
                             topCVRChannels[0].cvr > 1.5 ? '양호한 전환율입니다. 추가 투자를 고려하세요. ' : ''}
                          </span>
                        );
                      }

                      // 2. 매출 vs CVR 불균형
                      if (highRevenueLowCVR.length > 0) {
                        insights.push(
                          <span key="improve">
                            <br /><br /><strong style={{ color: '#ff9800' }}>⚠️ 개선 기회:</strong>{' '}
                            <strong>{highRevenueLowCVR[0].channel}</strong>은 매출은 높지만 (₩{formatNumber(highRevenueLowCVR[0].revenue)}){' '}
                            CVR이 {highRevenueLowCVR[0].cvr.toFixed(2)}%로 평균({avgCVR.toFixed(2)}%)보다 낮습니다.{' '}
                            <strong>랜딩 페이지를 개선하면 매출을 크게 늘릴 수 있습니다!</strong>{' '}
                          </span>
                        );
                      }

                      // 3. 초기 이탈 문제 또는 전체 분석
                      if (highEarlyChurn.length > 0) {
                        const worstChannel = [...highEarlyChurn].sort((a, b) => b.activationChurn - a.activationChurn)[0];
                        insights.push(
                          <span key="urgent">
                            <br /><br /><strong style={{ color: '#f44336' }}>🚨 긴급 조치 필요:</strong>{' '}
                            <strong>{worstChannel.channel}</strong>은 첫 단계(유입→활동)에서 {worstChannel.activationChurn.toFixed(1)}%가 이탈합니다.{' '}
                            광고 메시지와 랜딩 페이지의 일치 여부, 로딩 속도를 즉시 점검하세요.{' '}
                          </span>
                        );
                      } else {
                        // 가장 이탈률 높은 단계 안내
                        insights.push(
                          <span key="analysis">
                            <br /><br /><strong style={{ color: '#2196f3' }}>📊 전체 분석:</strong>{' '}
                            전체 채널에서 <strong>{highestChurnStage.stage}</strong> 단계의 평균 이탈률이 {highestChurnStage.avg.toFixed(1)}%로 가장 높습니다.{' '}
                            이 구간에 집중적으로 개선 노력을 기울이세요.{' '}
                          </span>
                        );
                      }

                      // 4. 실행 가능한 추천
                      insights.push(
                        <span key="action">
                          <br /><br /><strong style={{ color: 'var(--primary-main)' }}>💡 오늘 바로 실행:</strong>{' '}
                          {topCVRChannels[0]?.cvr > avgCVR * 1.5 ? `1) ${topCVRChannels[0].channel} 광고비를 20-30% 증액하고, ` : ''}
                          {highRevenueLowCVR.length > 0 ? `2) ${highRevenueLowCVR[0].channel}의 랜딩 페이지 A/B 테스트를 시작하고, ` : ''}
                          3) CVR {(avgCVR * 0.5).toFixed(2)}% 이하 채널은 일시 중단을 검토하세요.
                        </span>
                      );

                      return insights;
                    })() : '데이터를 불러오는 중...'}
                  </div>
                </div>

                <div className="table-container">
                  <table id="channelTable">
                    <thead>
                      <tr>
                        <th>채널</th>
                        {['유입', '활동', '관심', '결제진행', '구매완료', 'Revenue', 'CVR'].map(col => (
                          <th
                            key={col}
                            className="sortable-header"
                            data-column={col}
                            data-type="number"
                            onClick={() => handleTableSort(col)}
                          >
                            {col === 'Revenue' ? '매출' : col}
                            <div className={`sort-icon ${channelTableSort.column === col ? 'active' : ''}`}>
                              <div className={`sort-arrow up ${channelTableSort.column === col && channelTableSort.direction === 'asc' ? 'active' : ''}`}></div>
                              <div className={`sort-arrow down ${channelTableSort.column === col && channelTableSort.direction === 'desc' ? 'active' : ''}`}></div>
                            </div>
                            <div className="sort-tooltip">클릭하여 {col === 'Revenue' ? '매출' : col} 기준으로 정렬</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody id="channelTableBody">
                      {channelData.length > 0 ? (() => {
                        // 각 열의 최대값 계산 (색상 스케일용)
                        const maxValues = {
                          '유입': Math.max(...channelData.map(r => parseFloat(String(r['유입'])) || 0)),
                          '활동': Math.max(...channelData.map(r => parseFloat(String(r['활동'])) || 0)),
                          '관심': Math.max(...channelData.map(r => parseFloat(String(r['관심'])) || 0)),
                          '결제진행': Math.max(...channelData.map(r => parseFloat(String(r['결제진행'])) || 0)),
                          '구매완료': Math.max(...channelData.map(r => parseFloat(String(r['구매완료'])) || 0)),
                          'Revenue': Math.max(...channelData.map(r => parseFloat(String(r['Revenue'])) || 0)),
                          'CVR': Math.max(...channelData.map(r => parseFloat(String(r['CVR'])) || 0))
                        };
                        const getScaleWidth = (value: number, maxValue: number) => {
                          if (maxValue === 0) return 0;
                          return (value / maxValue) * 100;
                        };
                        return sortedChannelData.map((row, index) => {
                          const acqVal = parseFloat(String(row['유입'])) || 0;
                          const actVal = parseFloat(String(row['활동'])) || 0;
                          const conVal = parseFloat(String(row['관심'])) || 0;
                          const convVal = parseFloat(String(row['결제진행'])) || 0;
                          const purVal = parseFloat(String(row['구매완료'])) || 0;
                          const revVal = parseFloat(String(row['Revenue'])) || 0;
                          const cvrVal = parseFloat(String(row['CVR'])) || 0;
                          return (
                            <tr key={index}>
                              <td>{row['channel']}</td>
                              <td className="has-bg">
                                <div className="cell-bg scale-acquisition" style={{ width: `${getScaleWidth(acqVal, maxValues['유입'])}%` }}></div>
                                <span>{formatNumber(acqVal)}</span>
                              </td>
                              <td className="has-bg">
                                <div className="cell-bg scale-activation" style={{ width: `${getScaleWidth(actVal, maxValues['활동'])}%` }}></div>
                                <span>{formatNumber(actVal)}</span>
                              </td>
                              <td className="has-bg">
                                <div className="cell-bg scale-consideration" style={{ width: `${getScaleWidth(conVal, maxValues['관심'])}%` }}></div>
                                <span>{formatNumber(conVal)}</span>
                              </td>
                              <td className="has-bg">
                                <div className="cell-bg scale-conversion" style={{ width: `${getScaleWidth(convVal, maxValues['결제진행'])}%` }}></div>
                                <span>{formatNumber(convVal)}</span>
                              </td>
                              <td className="has-bg">
                                <div className="cell-bg scale-purchase" style={{ width: `${getScaleWidth(purVal, maxValues['구매완료'])}%` }}></div>
                                <span>{formatNumber(purVal)}</span>
                              </td>
                              <td className="has-bg">
                                <div className="cell-bg scale-revenue" style={{ width: `${getScaleWidth(revVal, maxValues['Revenue'])}%` }}></div>
                                <span>{formatNumber(revVal)}</span>
                              </td>
                              <td className="has-bg">
                                <div className="cell-bg scale-cvr" style={{ width: `${getScaleWidth(cvrVal, maxValues['CVR'])}%` }}></div>
                                <span>{formatDecimal(cvrVal)}%</span>
                              </td>
                            </tr>
                          );
                        });
                      })() : (
                        <tr>
                          <td colSpan={8}>데이터를 불러오는 중...</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 해석 가이드 */}
                <div style={{ marginTop: '20px', padding: '0 24px 20px 24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--grey-900)', marginBottom: '12px' }}>
                    📋 데이터 해석 가이드
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    {/* CVR이 높은 경우 */}
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: '8px', borderLeft: '3px solid #4caf50' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#4caf50', marginBottom: '6px' }}>
                        ✅ CVR이 높은 채널 (3% 이상)
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        <strong>의미:</strong> 효율적인 채널. 적은 방문자로도 많이 구매<br />
                        <strong>전략:</strong> 광고비를 더 투자하고, 이 채널의 성공 요인을 다른 채널에 적용하세요
                      </div>
                    </div>

                    {/* 매출이 높지만 CVR이 낮은 경우 */}
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #fff3e0 0%, #fff8f0 100%)', borderRadius: '8px', borderLeft: '3px solid #ff9800' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#ff9800', marginBottom: '6px' }}>
                        ⚠️ 매출은 높은데 CVR이 낮은 채널
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        <strong>의미:</strong> 방문자가 많지만 전환율이 낮아 비효율적<br />
                        <strong>전략:</strong> 랜딩 페이지 개선, 타겟팅 정밀화로 CVR을 높이면 매출이 크게 증가합니다
                      </div>
                    </div>

                    {/* 방문자가 많지만 이탈이 높은 경우 */}
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8fc 100%)', borderRadius: '8px', borderLeft: '3px solid #2196f3' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#2196f3', marginBottom: '6px' }}>
                        🚪 유입은 많은데 활동 수가 급감하는 채널
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        <strong>의미:</strong> 첫 화면에서 대부분 이탈. 광고와 페이지 불일치 가능성<br />
                        <strong>전략:</strong> 광고 메시지와 랜딩 페이지의 일관성 확인, 로딩 속도 개선
                      </div>
                    </div>

                    {/* 관심까지는 가지만 결제로 안 가는 경우 */}
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #f3e5f5 0%, #faf5fc 100%)', borderRadius: '8px', borderLeft: '3px solid #9c27b0' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#9c27b0', marginBottom: '6px' }}>
                        💭 관심까지는 가는데 결제 안 하는 채널
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        <strong>의미:</strong> 관심은 있지만 구매 결정을 망설임. 가격이나 신뢰 문제<br />
                        <strong>전략:</strong> 리뷰/후기 강화, 첫 구매 할인 제공, 결제 과정 간소화
                      </div>
                    </div>
                  </div>

                  {/* 실행 체크리스트 */}
                  <div style={{ padding: '16px', background: 'linear-gradient(135deg, #fff9e6 0%, #fffcf5 100%)', borderRadius: '8px', borderLeft: '3px solid #ffc107' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f57c00', marginBottom: '10px' }}>
                      ✅ 이 표를 보고 바로 실행할 수 있는 것들
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.8 }}>
                      1. <strong>CVR 1위 채널</strong>을 찾아 광고 예산을 20% 더 배정하세요<br />
                      2. <strong>유입은 많지만 CVR이 낮은 채널</strong>의 광고 소재와 랜딩 페이지를 점검하세요<br />
                      3. <strong>단계별 이탈률이 가장 높은 구간</strong>을 찾아 집중 개선하세요 (예: 유입→활동 50% 이상 이탈)<br />
                      4. <strong>매출 상위 3개 채널</strong>의 공통점을 찾아 성공 패턴을 문서화하세요<br />
                      5. <strong>CVR 0.5% 이하 채널</strong>은 일시 중단하고 예산을 재배분하세요
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 탭 2: 지표별 비교 */}
            <div className={`channel-analysis-tab-content ${channelAnalysisTab === 'kpi' ? 'active' : ''}`} id="kpiTab" style={{ display: channelAnalysisTab === 'kpi' ? 'block' : 'none' }}>
              <div className="chart-section card" style={{ marginBottom: '16px' }}>
                <div className="chart-header">📈 각 지표별로 어떤 채널이 1등인가요?</div>

                {/* 설명 섹션 */}
                <div style={{ fontSize: '13px', color: 'var(--grey-700)', padding: '16px 24px', background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)', marginBottom: '16px', lineHeight: 1.7 }}>
                  <strong style={{ color: 'var(--primary-main)' }}>📖 이 차트는 무엇을 보여주나요?</strong><br />
                  원하는 지표(전환율, 방문자 수, 매출 등)별로 각 채널의 성과를 한눈에 비교할 수 있습니다.<br /><br />
                  <strong style={{ color: 'var(--primary-main)' }}>💡 사용 방법:</strong><br />
                  • 아래 버튼을 클릭하여 보고 싶은 지표를 선택하세요<br />
                  • <strong>전환율</strong>은 효율성을, <strong>매출</strong>은 실제 수익을, <strong>방문자 수</strong>는 트래픽 규모를 나타냅니다<br />
                  • <strong>차트 위에 마우스를 올리면</strong> 해당 지표에 대한 자세한 설명과 개선 전략을 볼 수 있습니다
                </div>

                {/* KPI 버튼 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', padding: '0 24px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--grey-700)' }}>📊 보고 싶은 지표:</span>
                  {[
                    { key: 'cvr', label: '전환율 (%)' },
                    { key: 'acquisition', label: '방문자 수' },
                    { key: 'activation', label: '활성 사용자' },
                    { key: 'consideration', label: '관심 고객' },
                    { key: 'conversion', label: '결제 시도' },
                    { key: 'purchase', label: '구매 건수' },
                    { key: 'revenue', label: '매출액' }
                  ].map(kpi => (
                    <button
                      key={kpi.key}
                      className={`view-btn channel-kpi-btn ${currentKpiType === kpi.key ? 'active' : ''}`}
                      data-kpi={kpi.key}
                      data-chart="kpi"
                      onClick={() => setCurrentKpiType(kpi.key)}
                    >
                      {kpi.label}
                    </button>
                  ))}
                </div>

                {/* 자동 인사이트 박스 */}
                <div id="kpiChartInsightSummary" style={{ margin: '16px 24px', padding: '16px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8fc 100%)', borderRadius: '10px', borderLeft: '4px solid #2196f3' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#2196f3', marginBottom: '8px' }}>
                    💡 지표 분석 인사이트
                  </div>
                  <div id="kpiChartInsightText" style={{ fontSize: '13px', color: 'var(--grey-800)', lineHeight: 1.6 }}>
                    {channelData.length > 0 ? (() => {
                      const kpiNames: Record<string, string> = {
                        cvr: '전환율', acquisition: '방문자 수', activation: '활성 사용자',
                        consideration: '관심 고객', conversion: '결제 시도', purchase: '구매 건수', revenue: '매출'
                      };
                      const kpiKeys: Record<string, string> = {
                        cvr: 'CVR', acquisition: '유입', activation: '활동',
                        consideration: '관심', conversion: '결제진행', purchase: '구매완료', revenue: 'Revenue'
                      };

                      const currentKpiName = kpiNames[currentKpiType];
                      const currentKpiKey = kpiKeys[currentKpiType];

                      // 데이터 추출 및 정렬
                      const sortedData = [...channelData].map(row => ({
                        channel: String(row['channel']),
                        value: parseFloat(String(row[currentKpiKey as keyof typeof row])) || 0
                      })).sort((a, b) => b.value - a.value);

                      const top1 = sortedData[0];
                      const top2 = sortedData[1];
                      const top3 = sortedData[2];
                      const bottom = sortedData[sortedData.length - 1];

                      // 평균 계산
                      const avgValue = sortedData.reduce((sum, item) => sum + item.value, 0) / sortedData.length;

                      // 인사이트 생성
                      const insights: JSX.Element[] = [];

                      // 1. 1등 채널 정보
                      let topInfo = '';
                      if (currentKpiType === 'cvr') {
                        topInfo = `(${top1.value.toFixed(2)}%). `;
                        if (top1.value > 3) {
                          topInfo += '매우 우수한 전환율이므로 광고 예산을 더 투자하세요! ';
                        } else if (top1.value > 1.5) {
                          topInfo += '양호한 전환율입니다. ';
                        } else {
                          topInfo += '전환율이 낮은 편입니다. 전반적인 개선이 필요합니다. ';
                        }
                      } else if (currentKpiType === 'revenue') {
                        topInfo = `(₩${formatNumber(top1.value)}). 이 채널의 성공 요인을 분석하여 다른 채널에 적용하세요. `;
                      } else {
                        topInfo = `(${formatNumber(top1.value)}명). `;
                      }

                      insights.push(
                        <span key="top1">
                          <strong style={{ color: '#2196f3' }}>🥇 1위 채널:</strong>{' '}
                          <strong>{top1.channel}</strong>이 {currentKpiName}에서 1등입니다 {topInfo}
                        </span>
                      );

                      // 2. 1등과 2등의 격차
                      const gap = top1.value - top2.value;
                      const gapPercent = (gap / top1.value * 100);
                      if (gapPercent > 30) {
                        insights.push(
                          <span key="gap">
                            <br /><br /><strong style={{ color: '#ff9800' }}>⚠️ 주의:</strong>{' '}
                            1위와 2위의 격차가 {gapPercent.toFixed(0)}%로 매우 큽니다.{' '}
                            <strong>{top1.channel}</strong>에 과도하게 의존하고 있으므로, 다른 채널도 육성하여 리스크를 분산하세요.{' '}
                          </span>
                        );
                      } else {
                        insights.push(
                          <span key="gap">
                            {' '}2위는 <strong>{top2.channel}</strong>이며, 1위와의 격차는 {gapPercent.toFixed(0)}%입니다.{' '}
                          </span>
                        );
                      }

                      // 3. 상위 vs 하위 비교
                      const topBottomRatio = top1.value / (bottom.value || 1);
                      let analysisText = '';
                      if (topBottomRatio > 10) {
                        analysisText = `최고와 최저의 차이가 ${topBottomRatio.toFixed(1)}배로 매우 큽니다. ` +
                          `${bottom.channel} 같은 저성과 채널은 일시 중단을 검토하고, 예산을 상위 채널로 재배분하세요. `;
                      } else if (topBottomRatio > 3) {
                        analysisText = `채널 간 성과 차이가 ${topBottomRatio.toFixed(1)}배로 존재합니다. 저성과 채널의 원인을 분석하고 개선하세요. `;
                      } else {
                        analysisText = '채널 간 성과가 비교적 고르게 분포되어 있습니다. ';
                      }
                      insights.push(
                        <span key="analysis">
                          <br /><br /><strong style={{ color: 'var(--primary-main)' }}>📊 전체 분석:</strong>{' '}
                          {analysisText}
                        </span>
                      );

                      // 4. 지표별 맞춤 추천
                      let strategyText = '';
                      switch(currentKpiType) {
                        case 'cvr':
                          if (avgValue < 1.5) {
                            strategyText = `전체 평균 CVR이 ${avgValue.toFixed(2)}%로 낮습니다. 랜딩 페이지 개선과 타겟팅 정밀화가 시급합니다. `;
                          } else if (avgValue > 3) {
                            strategyText = `전체 평균 CVR이 ${avgValue.toFixed(2)}%로 우수합니다! 현재 전략을 유지하세요. `;
                          } else {
                            strategyText = `전체 평균 CVR은 ${avgValue.toFixed(2)}%입니다. A/B 테스트로 추가 개선을 시도하세요. `;
                          }
                          break;
                        case 'revenue':
                          strategyText = `${top1.channel}이 전체 매출의 핵심입니다. 이 채널의 광고 소재, 타겟팅, 랜딩 페이지를 분석하여 다른 채널에 적용하세요. `;
                          break;
                        case 'acquisition':
                          strategyText = '방문자가 많다고 좋은 것은 아닙니다. CVR과 함께 비교하여 효율적인 채널에 집중 투자하세요. ';
                          break;
                        default:
                          strategyText = `상위 3개 채널(${top1.channel}, ${top2.channel}, ${top3.channel})에 집중하여 최적화하세요. `;
                      }
                      insights.push(
                        <span key="strategy">
                          <br /><br /><strong style={{ color: 'var(--primary-main)' }}>💡 {currentKpiName} 개선 전략:</strong>{' '}
                          {strategyText}
                        </span>
                      );

                      return insights;
                    })() : '버튼을 클릭하여 지표를 선택하면 자동 분석 결과가 여기에 표시됩니다.'}
                  </div>
                </div>

                {/* KPI 차트 */}
                <div className="chart-container-small" style={{ position: 'relative' }}>
                  {channelData.length > 0 && (() => {
                    // KPI별 설정 (HTML과 동일)
                    const kpiConfig: Record<string, { label: string; key: string; color: string; bgColor: string }> = {
                      cvr: { label: 'CVR (%)', key: 'CVR', color: '#673ab7', bgColor: 'rgba(103, 58, 183, 0.8)' },
                      acquisition: { label: '유입 (명)', key: '유입', color: '#2196f3', bgColor: 'rgba(33, 150, 243, 0.8)' },
                      activation: { label: '활동 (명)', key: '활동', color: '#00bcd4', bgColor: 'rgba(0, 188, 212, 0.8)' },
                      consideration: { label: '관심 (명)', key: '관심', color: '#ff9800', bgColor: 'rgba(255, 152, 0, 0.8)' },
                      conversion: { label: '결제진행 (명)', key: '결제진행', color: '#4caf50', bgColor: 'rgba(76, 175, 80, 0.8)' },
                      purchase: { label: '구매완료 (명)', key: '구매완료', color: '#00c853', bgColor: 'rgba(0, 200, 83, 0.8)' },
                      revenue: { label: '매출 (원)', key: 'Revenue', color: '#f44336', bgColor: 'rgba(244, 67, 54, 0.8)' }
                    };

                    const config = kpiConfig[currentKpiType];
                    const getValue = (row: ChannelDataRow) => parseFloat(String(row[config.key as keyof ChannelDataRow])) || 0;

                    // 정렬 및 상위 10개 추출
                    const sortedData = [...channelData]
                      .sort((a, b) => getValue(b) - getValue(a))
                      .slice(0, 10);

                    const labels = sortedData.map(row => String(row['channel']));
                    const values = sortedData.map(row => getValue(row));

                    return (
                      <Bar
                        key={`kpi-chart-${currentKpiType}`}
                        data={{
                          labels,
                          datasets: [{
                            label: config.label,
                            data: values,
                            backgroundColor: config.bgColor,
                            borderColor: config.color,
                            borderWidth: 1
                          }]
                        }}
                        options={{
                          indexAxis: 'y',
                          responsive: true,
                          maintainAspectRatio: false,
                          animation: {
                            duration: 750,
                            easing: 'easeOutQuart'
                          },
                          plugins: {
                            legend: { display: false },
                            datalabels: { display: false },
                            tooltip: {
                              callbacks: {
                                label: function(context: { parsed: { x: number | null } }) {
                                  const val = context.parsed.x ?? 0;
                                  if (currentKpiType === 'cvr') {
                                    return config.label + ': ' + val.toFixed(2) + '%';
                                  } else if (currentKpiType === 'revenue') {
                                    return config.label + ': ' + formatNumber(val) + '원';
                                  } else {
                                    return config.label + ': ' + formatNumber(val) + '명';
                                  }
                                }
                              }
                            }
                          },
                          scales: {
                            x: {
                              beginAtZero: true,
                              title: { display: true, text: config.label }
                            }
                          }
                        }}
                      />
                    );
                  })()}
                </div>

                {/* 해석 가이드 */}
                <div style={{ marginTop: '20px', padding: '0 24px 20px 24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--grey-900)', marginBottom: '12px' }}>
                    📋 각 지표를 볼 때 주의할 점
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {/* 전환율 */}
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: '8px', borderLeft: '3px solid #4caf50' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#4caf50', marginBottom: '6px' }}>
                        📊 전환율 (CVR)을 볼 때
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        <strong>높을수록 좋음:</strong> 효율성을 나타냅니다<br />
                        <strong>주의:</strong> 방문자가 너무 적으면 통계적으로 불안정할 수 있어요
                      </div>
                    </div>

                    {/* 방문자/매출 */}
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #fff3e0 0%, #fff8f0 100%)', borderRadius: '8px', borderLeft: '3px solid #ff9800' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#ff9800', marginBottom: '6px' }}>
                        👥 방문자 수 / 💰 매출을 볼 때
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        <strong>높을수록 좋음:</strong> 규모를 나타냅니다<br />
                        <strong>주의:</strong> 방문자만 많고 전환율이 낮으면 비효율적이에요
                      </div>
                    </div>

                    {/* 활성 사용자 */}
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8fc 100%)', borderRadius: '8px', borderLeft: '3px solid #2196f3' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#2196f3', marginBottom: '6px' }}>
                        ⚡ 활성 사용자를 볼 때
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        <strong>의미:</strong> 실제로 사이트를 사용한 방문자 수<br />
                        <strong>활용:</strong> 방문자 수와 비교해 첫 이탈률을 파악하세요
                      </div>
                    </div>

                    {/* 관심/결제/구매 */}
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #f3e5f5 0%, #faf5fc 100%)', borderRadius: '8px', borderLeft: '3px solid #9c27b0' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#9c27b0', marginBottom: '6px' }}>
                        🛒 관심/결제/구매를 볼 때
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        <strong>의미:</strong> 구매 여정의 각 단계별 고객 수<br />
                        <strong>활용:</strong> 단계별로 급감하는 구간을 찾아 개선하세요
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 탭 3: 효율성과 규모 (balance) */}
            <div className={`channel-analysis-tab-content ${channelAnalysisTab === 'balance' ? 'active' : ''}`} id="balanceTab" style={{ display: channelAnalysisTab === 'balance' ? 'block' : 'none' }}>
              <div className="chart-section card" style={{ marginBottom: '16px' }}>
                <div className="chart-header">🔄 어떤 채널이 효율성과 규모를 모두 갖췄나요?</div>

                {/* 설명 섹션 */}
                <div style={{ fontSize: '13px', color: 'var(--grey-700)', padding: '16px 24px', background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)', marginBottom: '16px', lineHeight: 1.7 }}>
                  <strong style={{ color: 'var(--primary-main)' }}>📖 이 차트는 무엇을 보여주나요?</strong><br />
                  전환율, 방문자 수, 구매 건수, 매출을 모두 <strong>100점 만점</strong>으로 환산하여 비교합니다.<br />
                  <span style={{ color: 'var(--grey-600)' }}>예시: CVR이 가장 높은 채널을 100점으로 했을 때, 다른 채널들은 몇 점인지 보여줍니다.</span><br /><br />
                  <strong style={{ color: 'var(--primary-main)' }}>💡 차트 보는 법:</strong><br />
                  • <strong>모든 막대가 고르게 높은 채널</strong> = 효율도 좋고 규모도 큰 최고의 채널<br />
                  • <strong>CVR만 높고 다른 막대가 낮은 채널</strong> = 효율은 좋지만 규모가 작은 채널 (투자 확대 필요)<br />
                  • <strong>방문자/매출만 높고 CVR이 낮은 채널</strong> = 규모는 크지만 비효율적인 채널 (개선 필요)<br />
                  • <strong>차트 위에 마우스를 올리면</strong> 더 자세한 해석 방법을 볼 수 있습니다
                </div>

                {/* 자동 인사이트 박스 */}
                <div id="compareChartInsightSummary" style={{ margin: '16px 24px', padding: '16px', background: 'linear-gradient(135deg, #f3e5f5 0%, #faf5fc 100%)', borderRadius: '10px', borderLeft: '4px solid #9c27b0' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#9c27b0', marginBottom: '8px' }}>
                    💎 균형 분석 결과
                  </div>
                  <div id="compareChartInsightText" style={{ fontSize: '13px', color: 'var(--grey-800)', lineHeight: 1.6 }}>
                    {channelData.length > 0 ? (() => {
                      // 데이터 파싱 (상위 8개만, 차트와 동일)
                      const sortedData = [...channelData].sort((a, b) =>
                        (parseFloat(String(b['CVR'])) || 0) - (parseFloat(String(a['CVR'])) || 0)
                      ).slice(0, 8).map(row => ({
                        channel: String(row['channel']),
                        cvr: parseFloat(String(row['CVR'])) || 0,
                        acquisition: parseFloat(String(row['유입'])) || 0,
                        purchase: parseFloat(String(row['구매완료'])) || 0,
                        revenue: parseFloat(String(row['Revenue'])) || 0
                      }));

                      // 정규화 (100점 만점으로 환산)
                      const maxCVR = Math.max(...sortedData.map(ch => ch.cvr));
                      const maxAcquisition = Math.max(...sortedData.map(ch => ch.acquisition));
                      const maxPurchase = Math.max(...sortedData.map(ch => ch.purchase));
                      const maxRevenue = Math.max(...sortedData.map(ch => ch.revenue));

                      const normalizedData = sortedData.map(ch => {
                        const normCVR = maxCVR > 0 ? (ch.cvr / maxCVR * 100) : 0;
                        const normAcquisition = maxAcquisition > 0 ? (ch.acquisition / maxAcquisition * 100) : 0;
                        const normPurchase = maxPurchase > 0 ? (ch.purchase / maxPurchase * 100) : 0;
                        const normRevenue = maxRevenue > 0 ? (ch.revenue / maxRevenue * 100) : 0;

                        // 균형도 계산 (표준편차 기반)
                        const values = [normCVR, normAcquisition, normPurchase, normRevenue];
                        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
                        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
                        const balance = 100 - Math.sqrt(variance); // 높을수록 균형잡힘

                        return { ...ch, normCVR, normAcquisition, normPurchase, normRevenue, avg, balance };
                      });

                      // 채널 유형 분류
                      const perfectChannels = normalizedData.filter(ch => ch.avg >= 60 && ch.balance >= 50);
                      const efficientSmallChannels = normalizedData.filter(ch => ch.normCVR >= 70 && ch.normAcquisition < 50);
                      const inefficientLargeChannels = normalizedData.filter(ch => ch.normAcquisition >= 70 && ch.normCVR < 50);
                      const lowPerformers = normalizedData.filter(ch => ch.avg < 40);

                      // 최고 균형 채널
                      const mostBalanced = normalizedData.reduce((max, ch) => ch.balance > max.balance ? ch : max, normalizedData[0]);

                      const insights: JSX.Element[] = [];

                      // 1. 최고 균형 채널
                      if (perfectChannels.length > 0) {
                        insights.push(
                          <span key="perfect">
                            <strong style={{ color: '#4caf50' }}>🌟 완벽한 채널:</strong>{' '}
                            <strong>{perfectChannels[0].channel}</strong>이 효율과 규모를 모두 갖춘 최고의 채널입니다.{' '}
                            모든 지표(CVR, 방문자, 구매, 매출)가 균형있게 높습니다. 최우선 투자 대상입니다!{' '}
                          </span>
                        );
                      } else {
                        insights.push(
                          <span key="balanced">
                            <strong style={{ color: '#9c27b0' }}>💎 가장 균형잡힌 채널:</strong>{' '}
                            <strong>{mostBalanced.channel}</strong>이 상대적으로 가장 균형잡혀 있습니다 (균형도: {mostBalanced.balance.toFixed(0)}점).{' '}
                          </span>
                        );
                      }

                      // 2. 숨겨진 보석
                      if (efficientSmallChannels.length > 0) {
                        const gems = efficientSmallChannels.slice(0, 2).map(ch => ch.channel).join(', ');
                        insights.push(
                          <span key="gems">
                            <br /><br /><strong style={{ color: '#2196f3' }}>💎 숨겨진 보석:</strong>{' '}
                            <strong>{gems}</strong>은 전환율이 우수하지만 방문자가 적습니다.{' '}
                            <strong>광고 예산을 늘려 규모를 키우면 큰 효과</strong>를 볼 수 있습니다!{' '}
                          </span>
                        );
                      }

                      // 3. 개선 필요 채널
                      if (inefficientLargeChannels.length > 0) {
                        insights.push(
                          <span key="improve">
                            <br /><br /><strong style={{ color: '#ff9800' }}>⚠️ 개선 기회:</strong>{' '}
                            <strong>{inefficientLargeChannels[0].channel}</strong>은 방문자는 많지만 ({formatNumber(inefficientLargeChannels[0].acquisition)}명){' '}
                            전환율이 {inefficientLargeChannels[0].cvr.toFixed(2)}%로 낮습니다.{' '}
                            <strong>랜딩 페이지와 타겟팅을 개선하면 매출이 크게 증가</strong>할 수 있습니다!{' '}
                          </span>
                        );
                      }

                      // 4. 저성과 채널
                      if (lowPerformers.length > 0) {
                        const lowChannels = lowPerformers.map(ch => ch.channel).join(', ');
                        insights.push(
                          <span key="low">
                            <br /><br /><strong style={{ color: '#f44336' }}>❌ 저성과 채널:</strong>{' '}
                            <strong>{lowChannels}</strong>은 모든 지표가 낮습니다.{' '}
                            일시 중단을 검토하고 예산을 상위 채널로 재배분하세요.{' '}
                          </span>
                        );
                      }

                      // 5. 포트폴리오 평가
                      let portfolioText = '상위 8개 채널 중 ';
                      const parts: string[] = [];
                      if (perfectChannels.length > 0) parts.push(`${perfectChannels.length}개가 완벽`);
                      if (efficientSmallChannels.length > 0) parts.push(`${efficientSmallChannels.length}개가 확장 가능`);
                      if (inefficientLargeChannels.length > 0) parts.push(`${inefficientLargeChannels.length}개가 개선 필요`);
                      if (lowPerformers.length > 0) parts.push(`${lowPerformers.length}개가 저성과`);
                      portfolioText += parts.join(', ') + ' 상태입니다.';

                      insights.push(
                        <span key="portfolio">
                          <br /><br /><strong style={{ color: 'var(--primary-main)' }}>📊 채널 포트폴리오:</strong>{' '}
                          {portfolioText}
                        </span>
                      );

                      // 6. 우선순위 액션
                      const actions: string[] = [];
                      if (perfectChannels.length > 0) actions.push(`1) ${perfectChannels[0].channel} 예산 30-50% 증액`);
                      if (efficientSmallChannels.length > 0) actions.push(`2) ${efficientSmallChannels[0].channel} 타겟 확대로 방문자 늘리기`);
                      if (inefficientLargeChannels.length > 0) actions.push(`3) ${inefficientLargeChannels[0].channel} 랜딩 페이지 A/B 테스트 시작`);

                      if (actions.length > 0) {
                        insights.push(
                          <span key="actions">
                            <br /><br /><strong style={{ color: 'var(--primary-main)' }}>💡 우선순위 액션:</strong>{' '}
                            {actions.join(', ')}
                          </span>
                        );
                      }

                      return insights;
                    })() : '데이터를 불러오는 중...'}
                  </div>
                </div>

                {channelCompareData && (
                  <div
                    style={{ position: 'relative', height: '450px' }}
                    onMouseEnter={(e) => setCompareChartTooltip({ show: true, x: e.clientX + 15, y: e.clientY + 15 })}
                    onMouseMove={(e) => setCompareChartTooltip(prev => prev.show ? { ...prev, x: e.clientX + 15, y: e.clientY + 15 } : prev)}
                    onMouseLeave={() => setCompareChartTooltip({ show: false, x: 0, y: 0 })}
                  >
                    <Bar
                      key="compare-chart"
                      data={{
                        labels: channelCompareData.labels,
                        datasets: channelCompareData.datasets.map(ds => ({
                          ...ds,
                          backgroundColor: ds.backgroundColor,
                          borderColor: ds.borderColor
                        }))
                      }}
                      options={{
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: {
                          duration: 750,
                          easing: 'easeOutQuart'
                        },
                        interaction: {
                          mode: 'y' as const,
                          intersect: false
                        },
                        layout: {
                          padding: {
                            right: 100
                          }
                        },
                        plugins: {
                          legend: { display: true, position: 'top' },
                          datalabels: { display: false },
                          tooltip: {
                            callbacks: {
                              label: function(context: { datasetIndex: number; dataIndex: number; dataset: { label?: string; originalData?: number[] } }) {
                                const dataIndex = context.dataIndex;
                                const originalValue = context.dataset.originalData?.[dataIndex] || 0;
                                const label = context.dataset.label || '';

                                if (label.includes('CVR')) {
                                  return label + ': ' + formatDecimal(originalValue) + '%';
                                } else if (label.includes('유입')) {
                                  return '유입: ' + formatNumber(originalValue) + '명';
                                } else if (label.includes('구매완료')) {
                                  return '구매완료: ' + formatNumber(originalValue) + '명';
                                } else if (label.includes('매출')) {
                                  return '매출: ' + formatNumber(originalValue) + '원';
                                }
                                return label;
                              }
                            }
                          }
                        },
                        scales: {
                          x: {
                            beginAtZero: true,
                            max: 100,
                            title: { display: true, text: '정규화된 값 (0-100)' }
                          }
                        }
                      }}
                    />
                  </div>
                )}

                {/* 비교 차트 인사이트 툴팁 */}
                <div
                  className={`chart-insight-tooltip ${compareChartTooltip.show ? 'show' : ''}`}
                  style={{ left: compareChartTooltip.x, top: compareChartTooltip.y }}
                >
                  <div className="tooltip-insight-section">
                    <div className="tooltip-insight-header">💡 인사이트</div>
                    <p className="tooltip-insight-text">
                      각 채널의 전환율(CVR), 고객 유입, 구매 건수, 매출을 100점 만점으로 환산하여 비교합니다. 모든 지표가 골고루 높은 채널이 가장 균형있는 성과를 내고 있습니다.
                    </p>
                  </div>
                  <div className="tooltip-recommendation-section">
                    <div className="tooltip-recommendation-header">🎯 추천 사항</div>
                    <p className="tooltip-recommendation-text">
                      한 가지 지표만 좋은 채널은 개선 여지가 있습니다. 예를 들어, 유입은 많은데 전환율이 낮다면 고객 타게팅을 개선해야 합니다. 전환율은 높은데 매출이 낮다면 고가 상품 판매를 늘려야 합니다.
                    </p>
                  </div>
                </div>

                {/* 해석 가이드 */}
                <div style={{ marginTop: '20px', padding: '0 24px 20px 24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--grey-900)', marginBottom: '12px' }}>
                    📋 채널 유형별 전략
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: '8px', borderLeft: '3px solid #4caf50' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#4caf50', marginBottom: '6px' }}>
                        🌟 모든 막대가 고르게 높은 채널
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        <strong>유형:</strong> 완벽한 채널 (효율↑ + 규모↑)<br />
                        <strong>전략:</strong> 최우선 투자 대상. 광고비를 적극 늘리세요
                      </div>
                    </div>
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8fc 100%)', borderRadius: '8px', borderLeft: '3px solid #2196f3' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#2196f3', marginBottom: '6px' }}>
                        💎 CVR은 높은데 방문자가 적은 채널
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        <strong>유형:</strong> 숨겨진 보석 (효율↑ + 규모↓)<br />
                        <strong>전략:</strong> 광고 예산을 늘려 방문자를 확대하세요
                      </div>
                    </div>
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #fff3e0 0%, #fff8f0 100%)', borderRadius: '8px', borderLeft: '3px solid #ff9800' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#ff9800', marginBottom: '6px' }}>
                        ⚠️ 방문자/매출은 높은데 CVR이 낮은 채널
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        <strong>유형:</strong> 개선 필요 채널 (효율↓ + 규모↑)<br />
                        <strong>전략:</strong> 랜딩 페이지 개선으로 CVR을 높이면 매출 급증
                      </div>
                    </div>
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #ffebee 0%, #fff5f5 100%)', borderRadius: '8px', borderLeft: '3px solid #f44336' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#f44336', marginBottom: '6px' }}>
                        ❌ 모든 막대가 낮은 채널
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        <strong>유형:</strong> 저성과 채널 (효율↓ + 규모↓)<br />
                        <strong>전략:</strong> 일시 중단하고 예산을 상위 채널로 이동
                      </div>
                    </div>
                  </div>

                  {/* 실행 팁 */}
                  <div style={{ marginTop: '12px', padding: '16px', background: 'linear-gradient(135deg, #fff9e6 0%, #fffcf5 100%)', borderRadius: '8px', borderLeft: '3px solid #ffc107' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f57c00', marginBottom: '10px' }}>
                      ✅ 이 차트로 바로 실행할 수 있는 것
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.8 }}>
                      1. <strong>모든 막대가 높은 채널</strong>을 찾아 광고비를 30-50% 증액하세요<br />
                      2. <strong>CVR만 높고 규모가 작은 채널</strong>은 타겟을 확대하여 방문자를 늘리세요<br />
                      3. <strong>규모는 크지만 CVR이 낮은 채널</strong>은 랜딩 페이지 A/B 테스트를 시작하세요<br />
                      4. <strong>모든 지표가 낮은 채널</strong>은 일시 중단하고 원인 분석을 먼저 하세요
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 탭 4: 전환율 TOP 10 */}
            <div className={`channel-analysis-tab-content ${channelAnalysisTab === 'top10' ? 'active' : ''}`} id="top10Tab" style={{ display: channelAnalysisTab === 'top10' ? 'block' : 'none' }}>
              <div className="chart-section card">
                <div className="chart-header">🎯 각 단계별 전환율 TOP 10: 어떤 채널이 가장 효율적인가요?</div>

                {/* 설명 섹션 */}
                <div style={{ fontSize: '13px', color: 'var(--grey-700)', padding: '16px 24px', background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)', marginBottom: '16px', lineHeight: 1.7 }}>
                  <strong style={{ color: 'var(--primary-main)' }}>📖 이 차트는 무엇을 보여주나요?</strong><br />
                  각 고객 여정 단계별로 전환율이 높은 상위 10개 채널을 보여줍니다.<br />
                  <span style={{ color: 'var(--grey-600)' }}>예시: &quot;활동&quot; 단계를 선택하면, 유입한 고객 중 실제로 활동까지 이어진 비율이 높은 채널 순위를 볼 수 있습니다.</span><br /><br />
                  <strong style={{ color: 'var(--primary-main)' }}>💡 전환율이란?</strong><br />
                  • <strong>활동 전환율</strong> = (활동 고객 ÷ 유입 고객) × 100<br />
                  • <strong>관심 전환율</strong> = (관심 고객 ÷ 유입 고객) × 100<br />
                  • <strong>결제진행 전환율</strong> = (결제진행 ÷ 유입 고객) × 100<br />
                  • <strong>구매완료 전환율(CVR)</strong> = (구매 고객 ÷ 유입 고객) × 100 ← 가장 중요!<br /><br />
                  <strong>높을수록</strong> 효율적인 채널입니다 (적은 방문자로도 많은 전환 달성)
                </div>

                {/* 전환율 기준 버튼 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', padding: '0 24px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--grey-700)' }}>📊 전환율 기준:</span>
                  {[
                    { key: 'activation', label: '활동' },
                    { key: 'consideration', label: '관심' },
                    { key: 'conversion', label: '결제진행' },
                    { key: 'purchase', label: '구매완료' }
                  ].map(funnel => (
                    <button
                      key={funnel.key}
                      className={`view-btn channel-funnel-btn ${currentTop10Funnel === funnel.key ? 'active' : ''}`}
                      data-funnel={funnel.key}
                      onClick={() => setCurrentTop10Funnel(funnel.key)}
                    >
                      {funnel.label}
                    </button>
                  ))}
                </div>

                {/* 자동 인사이트 박스 */}
                <div id="top10ChartInsightSummary" style={{ margin: '16px 24px', padding: '16px', background: 'linear-gradient(135deg, #fff3e0 0%, #fff8f0 100%)', borderRadius: '10px', borderLeft: '4px solid #ff9800' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ff9800', marginBottom: '8px' }}>
                    🏆 TOP 10 분석 결과
                  </div>
                  <div id="top10ChartInsightText" style={{ fontSize: '13px', color: 'var(--grey-800)', lineHeight: 1.6 }}>
                    {channelData.length > 0 ? `${currentTop10Funnel === 'purchase' ? '구매완료' : currentTop10Funnel === 'conversion' ? '결제진행' : currentTop10Funnel === 'consideration' ? '관심' : '활동'} 전환율 기준 상위 10개 채널을 분석합니다.` : '데이터를 불러오는 중...'}
                  </div>
                </div>

                {/* TOP 10 차트 */}
                {channelData.length > 0 && (() => {
                  const funnelKeyMap: Record<string, string> = {
                    'activation': '활동',
                    'consideration': '관심',
                    'conversion': '결제진행',
                    'purchase': '구매완료'
                  };
                  const colorMap: Record<string, { bg: string; border: string }> = {
                    'activation': { bg: 'rgba(33, 150, 243, 0.8)', border: '#2196f3' },
                    'consideration': { bg: 'rgba(255, 152, 0, 0.8)', border: '#ff9800' },
                    'conversion': { bg: 'rgba(76, 175, 80, 0.8)', border: '#4caf50' },
                    'purchase': { bg: 'rgba(0, 200, 83, 0.8)', border: '#00c853' }
                  };
                  const labelMap: Record<string, string> = {
                    'activation': '활동 전환율 (%)',
                    'consideration': '관심 전환율 (%)',
                    'conversion': '결제진행 전환율 (%)',
                    'purchase': '구매완료 전환율 (%)'
                  };

                  const funnelKey = funnelKeyMap[currentTop10Funnel];
                  const colors = colorMap[currentTop10Funnel];
                  const chartLabel = labelMap[currentTop10Funnel];

                  const sortedData = [...channelData]
                    .map(row => ({
                      channel: row.channel,
                      rate: (parseFloat(String(row[funnelKey as keyof typeof row])) / parseFloat(String(row['유입']))) * 100
                    }))
                    .filter(item => !isNaN(item.rate) && isFinite(item.rate))
                    .sort((a, b) => b.rate - a.rate)
                    .slice(0, 10);

                  const labels = sortedData.map(item => {
                    const name = item.channel;
                    return name.length > 20 ? name.substring(0, 20) + '...' : name;
                  });
                  const data = sortedData.map(item => item.rate);

                  return (
                    <div className="chart-container-small">
                      <Bar
                        key={`top10-chart-${currentTop10Funnel}`}
                        data={{
                          labels,
                          datasets: [{
                            label: chartLabel,
                            data,
                            backgroundColor: colors.bg,
                            borderColor: colors.border,
                            borderWidth: 1
                          }]
                        }}
                        options={{
                          indexAxis: 'y',
                          responsive: true,
                          maintainAspectRatio: false,
                          animation: {
                            duration: 750,
                            easing: 'easeOutQuart'
                          },
                          plugins: {
                            legend: { display: false },
                            datalabels: { display: false },
                            tooltip: {
                              callbacks: {
                                label: function(context: { parsed: { x: number | null } }) {
                                  return chartLabel + ': ' + formatDecimal(context.parsed.x ?? 0) + '%';
                                }
                              }
                            }
                          },
                          scales: {
                            x: {
                              beginAtZero: true,
                              title: { display: true, text: '전환율 (%)' }
                            }
                          }
                        }}
                      />
                    </div>
                  );
                })()}

                {/* 해석 가이드 */}
                <div style={{ marginTop: '20px', padding: '0 24px 20px 24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--grey-900)', marginBottom: '12px' }}>
                    📋 전환율 순위를 볼 때 주의할 점
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    {/* 전환율 높지만 규모 작은 경우 */}
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8fc 100%)', borderRadius: '8px', borderLeft: '3px solid #2196f3' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#2196f3', marginBottom: '6px' }}>
                        ⚠️ 전환율은 높은데 방문자가 적다면?
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        <strong>의미:</strong> 효율은 우수하지만 규모가 작음<br />
                        <strong>전략:</strong> 광고 예산을 늘려 방문자 확대 (큰 성과 기대)
                      </div>
                    </div>

                    {/* 전환율 낮지만 규모 큰 경우 */}
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #fff3e0 0%, #fff8f0 100%)', borderRadius: '8px', borderLeft: '3px solid #ff9800' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#ff9800', marginBottom: '6px' }}>
                        ⚠️ 전환율은 낮은데 매출이 높다면?
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        <strong>의미:</strong> 규모는 크지만 비효율적<br />
                        <strong>전략:</strong> 랜딩 페이지 개선으로 CVR 상승 → 매출 폭발적 증가
                      </div>
                    </div>

                    {/* 초기 단계 전환율이 낮은 경우 */}
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #ffebee 0%, #fff5f5 100%)', borderRadius: '8px', borderLeft: '3px solid #f44336' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#f44336', marginBottom: '6px' }}>
                        🚨 활동 전환율이 50% 이하라면?
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        <strong>의미:</strong> 첫 화면에서 절반 이상이 이탈<br />
                        <strong>전략:</strong> 광고 메시지와 랜딩 페이지 일치 확인, 로딩 속도 개선
                      </div>
                    </div>

                    {/* 최종 전환율이 높은 경우 */}
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: '8px', borderLeft: '3px solid #4caf50' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#4caf50', marginBottom: '6px' }}>
                        ✅ 구매완료 전환율이 3% 이상이라면?
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        <strong>의미:</strong> 매우 우수한 채널!<br />
                        <strong>전략:</strong> 최우선 투자 대상. 광고비를 30-50% 증액하세요
                      </div>
                    </div>
                  </div>

                  {/* 실행 팁 */}
                  <div style={{ padding: '16px', background: 'linear-gradient(135deg, #fff9e6 0%, #fffcf5 100%)', borderRadius: '8px', borderLeft: '3px solid #ffc107' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f57c00', marginBottom: '10px' }}>
                      ✅ 이 순위표로 바로 실행할 수 있는 것
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.8 }}>
                      1. <strong>구매완료 TOP 3 채널</strong>의 공통점을 찾아 다른 채널에 적용하세요<br />
                      2. <strong>활동 전환율이 높은 채널</strong>은 첫 화면이 효과적. 랜딩 페이지를 벤치마킹하세요<br />
                      3. <strong>결제진행까지는 가지만 구매는 안 하는 채널</strong>은 결제 과정을 간소화하세요<br />
                      4. <strong>전환율 1% 미만 채널</strong>은 일시 중단하고 원인 분석을 먼저 하세요<br />
                      5. 각 단계별 탭을 클릭하며 어느 구간에서 이탈이 많은지 파악하세요
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* 6. 신규 vs 재방문 및 이탈 분석 (접기 가능) */}
      <div className="collapsible-section">
        <div className="collapsible-header" onClick={() => setCustomerAnalysisExpanded(!customerAnalysisExpanded)}>
          <div className="collapsible-title">
            <span className="collapsible-icon">👥</span>
            <span>고객 재방문 및 이탈 분석</span>
          </div>
          <button className="collapsible-toggle">
            <span>{customerAnalysisExpanded ? '접기' : '펼치기'}</span>
            <span className={`collapsible-toggle-icon ${customerAnalysisExpanded ? '' : 'collapsed'}`}>▼</span>
          </button>
        </div>
        <div className={`collapsible-content ${customerAnalysisExpanded ? 'expanded' : ''}`}>
          {/* 탭 버튼 */}
          <div className="view-type-section" style={{ marginBottom: '24px' }}>
            <button className={`view-btn customer-analysis-tab-btn ${customerAnalysisTab === 'trend' ? 'active' : ''}`} onClick={() => setCustomerAnalysisTab('trend')}>신규 vs 재방문 추세</button>
            <button className={`view-btn customer-analysis-tab-btn ${customerAnalysisTab === 'conversion' ? 'active' : ''}`} onClick={() => setCustomerAnalysisTab('conversion')}>전환율 비교</button>
            <button className={`view-btn customer-analysis-tab-btn ${customerAnalysisTab === 'churn' ? 'active' : ''}`} onClick={() => setCustomerAnalysisTab('churn')}>이탈률 분석</button>
            <button className={`view-btn customer-analysis-tab-btn ${customerAnalysisTab === 'matrix' ? 'active' : ''}`} onClick={() => setCustomerAnalysisTab('matrix')}>채널 품질 매트릭스</button>
            <button className={`view-btn customer-analysis-tab-btn ${customerAnalysisTab === 'engagement' ? 'active' : ''}`} onClick={() => setCustomerAnalysisTab('engagement')}>고객 참여도</button>
          </div>

          {/* 탭 1: 통합 신규/재방문 고객 추세 차트 */}
          {customerAnalysisTab === 'trend' && (
            <div className="customer-analysis-tab-content active" id="trendTab">
              {/* 데이터 기준 선택 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', padding: '16px 0' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--grey-700)' }}>📊 데이터 기준:</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className={`view-btn new-vs-returning-view-btn ${newVsReturningView === 'monthly' ? 'active' : ''}`} onClick={() => setNewVsReturningView('monthly')}>📆 월별</button>
                  <button className={`view-btn new-vs-returning-view-btn ${newVsReturningView === 'weekly' ? 'active' : ''}`} onClick={() => setNewVsReturningView('weekly')}>📆 주별</button>
                  <button className={`view-btn new-vs-returning-view-btn ${newVsReturningView === 'daily' ? 'active' : ''}`} onClick={() => setNewVsReturningView('daily')}>📅 일별</button>
                </div>
              </div>
              <div className="chart-section card" style={{ marginBottom: '16px' }}>
                <div className="chart-header">📊 신규 vs 재방문 고객 추세 분석</div>
                <div style={{ fontSize: '13px', color: 'var(--grey-600)', marginBottom: '12px', padding: '0 24px' }}>
                  시간에 따른 신규 고객 비율과 재방문율의 변화를 추적합니다. 신규 고객 비율이 높으면 새로운 고객 유입이 활발한 것이고, 재방문율이 높으면 고객 충성도가 높다는 뜻입니다. <strong>차트 위에 마우스를 올리면</strong> 추가 인사이트를 확인할 수 있습니다.
                </div>
                <div
                  className="chart-container-small"
                  style={{ position: 'relative' }}
                  onMouseEnter={(e) => setCustomerTrendTooltip({ show: true, x: e.clientX + 15, y: e.clientY + 15 })}
                  onMouseMove={(e) => customerTrendTooltip.show && setCustomerTrendTooltip({ show: true, x: e.clientX + 15, y: e.clientY + 15 })}
                  onMouseLeave={() => setCustomerTrendTooltip({ show: false, x: 0, y: 0 })}
                >
                  {customerTrendData && (
                    <Line
                      key={`customer-trend-${newVsReturningView}`}
                      data={customerTrendData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        plugins: {
                          legend: { display: true, position: 'top' },
                          datalabels: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (context) => `${context.dataset.label}: ${context.parsed.y}%`
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: { callback: (value) => value + '%' },
                            title: { display: true, text: '비율 (%)' }
                          },
                          x: {
                            ticks: { maxRotation: 45, minRotation: 45 }
                          }
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* customerTrendTooltip 인사이트 툴팁 */}
          <div
            id="customerTrendTooltip"
            className={`chart-insight-tooltip ${customerTrendTooltip.show ? 'show' : ''}`}
            style={{ left: customerTrendTooltip.x, top: customerTrendTooltip.y }}
          >
            <div className="tooltip-insight-section">
              <div className="tooltip-insight-header">💡 인사이트</div>
              <p className="tooltip-insight-text">
                신규 고객 비율과 재방문율의 균형을 확인하세요. 신규 비율이 높으면 성장 중이며, 재방문율이 높으면 충성도가 높습니다.
              </p>
            </div>
            <div className="tooltip-recommendation-section">
              <div className="tooltip-recommendation-header">🎯 추천 사항</div>
              <p className="tooltip-recommendation-text">
                이상적으로는 꾸준한 신규 유입(30-40%)과 높은 재방문율(60-70%)을 유지하는 것이 좋습니다. 두 지표가 함께 성장하는 것이 건강한 비즈니스의 신호입니다.
              </p>
            </div>
          </div>

          {/* 탭 2: 신규 vs 재방문 고객 전환율 비교 */}
          {customerAnalysisTab === 'conversion' && (
            <div className="customer-analysis-tab-content active" id="conversionTab">
              <div className="chart-section card" style={{ marginBottom: '16px' }}>
                <div className="chart-header">🔄 첫 방문 고객 vs 재방문 고객: 구매 전환율 차이 분석</div>
                <div style={{ fontSize: '13px', color: 'var(--grey-600)', marginBottom: '16px', padding: '0 24px', lineHeight: 1.7 }}>
                  <strong>이 차트는 무엇을 보여주나요?</strong><br />
                  처음 우리 사이트에 온 사람(신규)과 이미 왔던 적이 있는 사람(재방문)의 행동을 비교합니다.
                  각 단계별로 얼마나 많은 사람이 다음 단계로 넘어가는지 전환율(%)로 표시됩니다.
                  <strong>차트 위에 마우스를 올리면</strong> 더 자세한 분석과 개선 방법을 확인할 수 있습니다.
                </div>

                {/* 주요 인사이트 요약 */}
                <div id="conversionInsightSummary" style={{ margin: '0 24px 16px 24px', padding: '16px', background: 'linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%)', borderRadius: '10px', borderLeft: '4px solid var(--primary-main)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-main)', marginBottom: '8px' }}>
                    💡 핵심 인사이트
                  </div>
                  <div id="conversionInsightText" style={{ fontSize: '13px', color: 'var(--grey-800)', lineHeight: 1.6 }}>
                    {(() => {
                      if (newVsReturningConversionData.length === 0) return '데이터를 불러오는 중...';

                      const labels = newVsReturningConversionData.map(r => r.funnel_stage);
                      const newUserCVR = newVsReturningConversionData.map(r => parseFloat(r['New user CVR'] || '0'));
                      const returningUserCVR = newVsReturningConversionData.map(r => parseFloat(r['Returning user CVR'] || '0'));

                      // 각 단계별 차이 계산
                      const gaps = labels.map((label, i) => ({
                        stage: label,
                        newCVR: newUserCVR[i],
                        returningCVR: returningUserCVR[i],
                        gap: returningUserCVR[i] - newUserCVR[i]
                      }));

                      // 가장 차이가 큰 단계 찾기
                      const maxGap = gaps.reduce((max, item) => item.gap > max.gap ? item : max, gaps[0]);

                      // 평균 신규/재방문 전환율
                      const avgNew = newUserCVR.reduce((sum, val) => sum + val, 0) / newUserCVR.length;
                      const avgReturning = returningUserCVR.reduce((sum, val) => sum + val, 0) / returningUserCVR.length;
                      const avgGap = avgReturning - avgNew;

                      // 인사이트 텍스트 생성
                      const parts: React.ReactNode[] = [];

                      if (avgReturning > avgNew) {
                        const ratio = (avgReturning / avgNew).toFixed(1);
                        parts.push(
                          <span key="avg">
                            재방문 고객의 평균 전환율은 <strong style={{ color: '#673ab7' }}>{avgReturning.toFixed(1)}%</strong>로,
                            신규 고객(<strong style={{ color: '#ff9800' }}>{avgNew.toFixed(1)}%</strong>)보다 <strong style={{ color: 'var(--success-main)' }}>{ratio}배 높습니다</strong>.
                          </span>
                        );
                      } else {
                        parts.push(<span key="avg">신규 고객과 재방문 고객의 전환율이 비슷합니다. </span>);
                      }

                      if (maxGap.gap > 5) {
                        let stageAdvice = '';
                        if (maxGap.stage.includes('유입') || maxGap.stage.includes('활동')) {
                          stageAdvice = '신규 고객이 이 단계에서 이탈하지 않도록 첫 화면을 간결하게 만들고 로딩 속도를 개선하세요.';
                        } else if (maxGap.stage.includes('관심')) {
                          stageAdvice = '신규 고객에게 제품 리뷰와 고객 후기를 강조하여 신뢰를 구축하세요.';
                        } else if (maxGap.stage.includes('결제') || maxGap.stage.includes('구매')) {
                          stageAdvice = '신규 고객도 쉽게 구매할 수 있도록 게스트 체크아웃과 간편 결제를 도입하세요.';
                        }
                        parts.push(
                          <span key="gap"><br /><strong>특히 &quot;{maxGap.stage}&quot; 단계</strong>에서 재방문 고객이 {maxGap.gap.toFixed(1)}%p 더 높습니다. {stageAdvice}</span>
                        );
                      } else {
                        parts.push(<span key="gap">모든 단계에서 비슷한 패턴을 보입니다. 신규 고객과 재방문 고객 모두에게 효과적인 전략을 유지하세요.</span>);
                      }

                      // 핵심 전략
                      let coreStrategy = '';
                      if (avgGap > 10) {
                        coreStrategy = '재방문율을 높이는 것이 가장 효과적입니다. 이메일 마케팅, 리타겟팅 광고, 쿠폰 제공으로 재방문을 유도하세요.';
                      } else if (avgNew < 3) {
                        coreStrategy = '신규 고객 전환율이 낮습니다. 랜딩페이지 개선과 첫 구매 할인 혜택 제공을 고려하세요.';
                      } else {
                        coreStrategy = '균형잡힌 성과를 보이고 있습니다. 지속적인 A/B 테스트로 두 그룹 모두의 전환율을 개선하세요.';
                      }
                      parts.push(
                        <span key="strategy"><br /><br /><strong style={{ color: 'var(--primary-main)' }}>💡 핵심 전략:</strong> {coreStrategy}</span>
                      );

                      return parts;
                    })()}
                  </div>
                </div>

                <div
                  className="chart-container-small"
                  style={{ position: 'relative' }}
                  onMouseEnter={(e) => setConversionTooltip({ show: true, x: e.clientX + 15, y: e.clientY + 15 })}
                  onMouseMove={(e) => conversionTooltip.show && setConversionTooltip({ show: true, x: e.clientX + 15, y: e.clientY + 15 })}
                  onMouseLeave={() => setConversionTooltip({ show: false, x: 0, y: 0 })}
                >
                  {newVsReturningConversionData.length > 0 && (
                    <Bar
                      data={{
                        labels: newVsReturningConversionData.map(r => r.funnel_stage),
                        datasets: [
                          {
                            label: '신규 고객 전환율 (%)',
                            data: newVsReturningConversionData.map(r => parseFloat(r['New user CVR'] || '0')),
                            backgroundColor: 'rgba(255, 152, 0, 0.7)',
                            borderColor: '#ff9800',
                            borderWidth: 2,
                            borderRadius: 6,
                            barThickness: 'flex' as const,
                            maxBarThickness: 60
                          },
                          {
                            label: '재방문 고객 전환율 (%)',
                            data: newVsReturningConversionData.map(r => parseFloat(r['Returning user CVR'] || '0')),
                            backgroundColor: 'rgba(103, 58, 183, 0.7)',
                            borderColor: '#673ab7',
                            borderWidth: 2,
                            borderRadius: 6,
                            barThickness: 'flex' as const,
                            maxBarThickness: 60
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        plugins: {
                          legend: {
                            display: true,
                            position: 'top',
                            labels: {
                              font: { size: 13, weight: 'bold' },
                              padding: 15,
                              usePointStyle: true,
                              pointStyle: 'rectRounded'
                            }
                          },
                          datalabels: {
                            display: true,
                            anchor: 'end',
                            align: 'top',
                            offset: 4,
                            formatter: (value: number) => value.toFixed(1) + '%',
                            font: { size: 11, weight: 'bold' },
                            color: (context) => context.datasetIndex === 0 ? '#f57c00' : '#673ab7'
                          },
                          tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            titleFont: { size: 14, weight: 'bold' },
                            bodyFont: { size: 13 },
                            callbacks: {
                              title: (context) => context[0].label + ' 단계',
                              label: (context) => `${context.dataset.label}: ${(context.parsed.y ?? 0).toFixed(2)}%`,
                              afterBody: (context) => {
                                if (context.length === 2) {
                                  const newValue = context[0].parsed.y ?? 0;
                                  const returningValue = context[1].parsed.y ?? 0;
                                  const gap = Math.abs(returningValue - newValue);
                                  const higherGroup = returningValue > newValue ? '재방문 고객' : '신규 고객';
                                  return ['', `📊 전환율 차이: ${gap.toFixed(2)}%p`, `${higherGroup}이 더 높음`];
                                }
                                return '';
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: (value) => value + '%',
                              font: { size: 12 }
                            },
                            title: {
                              display: true,
                              text: '전환율 (%)',
                              font: { size: 13, weight: 'bold' }
                            },
                            grid: { color: 'rgba(0, 0, 0, 0.05)' }
                          },
                          x: {
                            grid: { display: false },
                            ticks: { font: { size: 12, weight: 'bold' } }
                          }
                        }
                      }}
                    />
                  )}
                </div>

                {/* conversionTooltip 인사이트 툴팁 */}
                <div
                  className={`chart-insight-tooltip ${conversionTooltip.show ? 'show' : ''}`}
                  style={{ left: conversionTooltip.x, top: conversionTooltip.y }}
                >
                  <div className="tooltip-insight-section">
                    <div className="tooltip-insight-header">💡 인사이트</div>
                    <p className="tooltip-insight-text">
                      신규 고객과 재방문 고객의 전환율 차이는 고객 경험의 질을 보여주는 중요한 지표입니다. 재방문 고객이 높다면 브랜드 충성도가 좋다는 뜻이고, 신규 고객이 낮다면 첫인상 개선이 필요합니다.
                    </p>
                  </div>
                  <div className="tooltip-recommendation-section">
                    <div className="tooltip-recommendation-header">🎯 추천 사항</div>
                    <p className="tooltip-recommendation-text">
                      차이가 큰 단계를 집중 개선하세요. 예를 들어, 재방문 고객만 구매율이 높다면 신규 고객을 위한 &quot;첫 구매 10% 할인&quot; 같은 인센티브를 제공하거나, 재방문 고객에게는 VIP 혜택을 제공하여 충성도를 더 높이세요.
                    </p>
                  </div>
                </div>

                {/* 해석 가이드 */}
                <div style={{ marginTop: '20px', padding: '0 24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--grey-900)', marginBottom: '12px' }}>
                    📋 차트 해석 가이드
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #fff3e0 0%, #fff9e6 100%)', borderRadius: '8px', borderLeft: '3px solid #ff9800' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#f57c00', marginBottom: '6px' }}>
                        🆕 신규 고객 (주황색 막대)
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        처음 방문한 고객들의 전환율입니다. 신규 고객은 우리 사이트를 처음 경험하기 때문에 일반적으로 전환율이 낮습니다.
                        <strong>첫인상이 중요</strong>하므로 랜딩페이지와 첫 화면 최적화가 핵심입니다.
                      </div>
                    </div>
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #ede7f6 0%, #f3f0ff 100%)', borderRadius: '8px', borderLeft: '3px solid #673ab7' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#673ab7', marginBottom: '6px' }}>
                        🔄 재방문 고객 (보라색 막대)
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        이미 방문한 적이 있는 고객들의 전환율입니다. 재방문 고객은 우리 브랜드를 알고 있어 <strong>신뢰도가 높고 구매 가능성이 큽니다</strong>.
                        이메일 마케팅이나 리타겟팅으로 재방문을 유도하세요.
                      </div>
                    </div>
                  </div>

                  {/* 실행 가능한 팁 */}
                  <div style={{ marginTop: '12px', padding: '14px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: '8px', borderLeft: '3px solid var(--success-main)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--success-main)', marginBottom: '6px' }}>
                      ✅ 실행 가능한 개선 방법
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.6 }}>
                      <strong>신규 고객 전환율이 낮다면:</strong>
                      첫 화면 로딩 속도 개선, 명확한 가치 제안 표시, 신뢰 요소 강화(리뷰, 보안 인증 등), 회원가입 없이 둘러보기 가능하게<br />
                      <strong>재방문 고객 전환율이 낮다면:</strong>
                      개인화된 추천 시스템 도입, 재방문 쿠폰 제공, 이메일로 신상품 알림, 로그인 시 이전 장바구니 자동 복원<br />
                      <strong>두 그룹 모두 낮다면:</strong>
                      전체적인 사용자 경험(UX) 점검 필요, 가격 경쟁력 확인, 결제 옵션 다양화
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 탭 3: 이탈률 차트 */}
          {customerAnalysisTab === 'churn' && (
            <div className="customer-analysis-tab-content active" id="churnTab">
              <div className="chart-section card" style={{ marginBottom: '16px' }}>
                <div className="chart-header">📉 채널별 고객 이탈 분석: 어느 단계에서 가장 많이 떠나나요?</div>

                {/* 설명 */}
                <div style={{ fontSize: '13px', color: 'var(--grey-600)', marginBottom: '16px', padding: '0 24px', lineHeight: 1.7 }}>
                  <strong>이탈률이란?</strong><br />
                  각 퍼널 단계에서 다음 단계로 넘어가지 못하고 떠나는 고객의 비율입니다.
                  예를 들어, &quot;유입→활동&quot; 이탈률 80%는 방문자 100명 중 80명이 아무 행동도 하지 않고 떠났다는 뜻입니다.
                  <strong>이탈률이 높은 단계를 찾아 집중 개선</strong>하면 전체 전환율을 크게 향상시킬 수 있습니다.
                  <strong>차트 위에 마우스를 올리면</strong> 더 자세한 분석을 확인할 수 있습니다.
                </div>

                {/* 이탈률 자동 인사이트 */}
                <div id="churnInsightSummary" style={{ margin: '0 24px 16px 24px', padding: '16px', background: 'linear-gradient(135deg, #ffebee 0%, #fff5f5 100%)', borderRadius: '10px', borderLeft: '4px solid #ff5722' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ff5722', marginBottom: '8px' }}>
                    ⚠️ 이탈률 분석 결과
                  </div>
                  <div id="churnInsightText" style={{ fontSize: '13px', color: 'var(--grey-800)', lineHeight: 1.6 }}>
                    {(() => {
                      if (channelChurnData.values.length === 0 || !channelChurnData.allData || channelChurnData.allData.length === 0) return '데이터를 불러오는 중...';

                      // 각 단계별 평균 이탈률 계산
                      const allData = channelChurnData.allData;
                      let totalActivation = 0, totalConsideration = 0, totalConversion = 0, totalPurchase = 0;

                      allData.forEach((row) => {
                        const acquisition = parseFloat(String(row['유입'] || '0'));
                        const activity = parseFloat(String(row['활동'] || '0'));
                        const interest = parseFloat(String(row['관심'] || '0'));
                        const checkout = parseFloat(String(row['결제진행'] || '0'));
                        const purchase = parseFloat(String(row['구매완료'] || '0'));

                        totalActivation += acquisition > 0 ? ((acquisition - activity) / acquisition) * 100 : 0;
                        totalConsideration += activity > 0 ? ((activity - interest) / activity) * 100 : 0;
                        totalConversion += interest > 0 ? ((interest - checkout) / interest) * 100 : 0;
                        totalPurchase += checkout > 0 ? ((checkout - purchase) / checkout) * 100 : 0;
                      });

                      const count = allData.length || 1;
                      const avgActivation = totalActivation / count;
                      const avgConsideration = totalConsideration / count;
                      const avgConversion = totalConversion / count;
                      const avgPurchase = totalPurchase / count;

                      // 산업 평균 벤치마크
                      const benchmarks: Record<string, { min: number; max: number; label: string }> = {
                        activation: { min: 40, max: 60, label: '유입→활동' },
                        consideration: { min: 50, max: 70, label: '활동→관심' },
                        conversion: { min: 60, max: 80, label: '관심→결제진행' },
                        purchase: { min: 20, max: 30, label: '결제진행→구매완료' }
                      };

                      // 가장 높은 이탈률 단계 찾기
                      const stageAverages: { stage: string; avg: number; label: string }[] = [
                        { stage: 'activation', avg: avgActivation, label: '유입→활동' },
                        { stage: 'consideration', avg: avgConsideration, label: '활동→관심' },
                        { stage: 'conversion', avg: avgConversion, label: '관심→결제진행' },
                        { stage: 'purchase', avg: avgPurchase, label: '결제진행→구매완료' }
                      ];

                      const highestChurnStage = stageAverages.reduce((max, item) =>
                        item.avg > max.avg ? item : max, stageAverages[0]
                      );

                      const benchmark = benchmarks[highestChurnStage.stage];
                      const parts: React.ReactNode[] = [];

                      // 전체 상황 요약
                      parts.push(
                        <span key="main">
                          가장 많은 고객이 이탈하는 구간은 <strong style={{ color: '#ff5722' }}>{highestChurnStage.label}</strong> 단계로,
                          평균 <strong style={{ color: '#ff5722' }}>{highestChurnStage.avg.toFixed(1)}%</strong>의 고객이 이 단계에서 떠납니다.{' '}
                        </span>
                      );

                      // 산업 평균과 비교
                      if (highestChurnStage.avg > benchmark.max) {
                        parts.push(
                          <span key="benchmark"><strong style={{ color: 'var(--error-main)' }}>⚠️ 산업 평균({benchmark.min}-{benchmark.max}%)보다 높아 즉시 개선이 필요합니다!</strong> </span>
                        );
                      } else if (highestChurnStage.avg < benchmark.min) {
                        parts.push(
                          <span key="benchmark"><strong style={{ color: 'var(--success-main)' }}>✅ 산업 평균({benchmark.min}-{benchmark.max}%)보다 낮아 양호합니다!</strong> </span>
                        );
                      } else {
                        parts.push(
                          <span key="benchmark">산업 평균({benchmark.min}-{benchmark.max}%) 범위 내입니다. </span>
                        );
                      }

                      // 해당 단계에서 이탈률이 가장 높은 채널들 찾기 (TOP 3)
                      const getChurnRate = (row: typeof allData[0], stage: string) => {
                        const acquisition = parseFloat(String(row['유입'] || '0'));
                        const activity = parseFloat(String(row['활동'] || '0'));
                        const interest = parseFloat(String(row['관심'] || '0'));
                        const checkout = parseFloat(String(row['결제진행'] || '0'));
                        const purchase = parseFloat(String(row['구매완료'] || '0'));
                        if (stage === 'activation') return acquisition > 0 ? ((acquisition - activity) / acquisition) * 100 : 0;
                        if (stage === 'consideration') return activity > 0 ? ((activity - interest) / activity) * 100 : 0;
                        if (stage === 'conversion') return interest > 0 ? ((interest - checkout) / interest) * 100 : 0;
                        if (stage === 'purchase') return checkout > 0 ? ((checkout - purchase) / checkout) * 100 : 0;
                        return 0;
                      };

                      const channelsWithHighChurn = allData.map(row => ({
                        channel: row.channel,
                        churnRate: getChurnRate(row, highestChurnStage.stage)
                      })).sort((a, b) => b.churnRate - a.churnRate).slice(0, 3);

                      // 문제 채널 강조
                      parts.push(
                        <span key="channels">
                          <br /><br /><strong style={{ color: 'var(--primary-main)' }}>🎯 집중 개선 대상 채널:</strong><br />
                          {channelsWithHighChurn.map((item, index) => (
                            <span key={`ch-${index}`}>
                              {index + 1}. <strong>{item.channel}</strong>: {item.churnRate.toFixed(1)}% 이탈
                              {index < channelsWithHighChurn.length - 1 && <br />}
                            </span>
                          ))}
                        </span>
                      );

                      // 단계별 구체적인 추천사항
                      let recommendations: React.ReactNode[] = [];
                      if (highestChurnStage.stage === 'activation') {
                        if (highestChurnStage.avg > 60) {
                          recommendations = [
                            <span key="r1">• <strong>랜딩 페이지 로딩 속도</strong>를 3초 이내로 최적화하세요 (현재 이탈률이 매우 높음)<br /></span>,
                            <span key="r2">• 광고 문구와 랜딩 페이지의 <strong>메시지가 일치</strong>하는지 즉시 확인하세요<br /></span>,
                            <span key="r3">• 모바일 사용자 경험을 우선적으로 개선하세요</span>
                          ];
                        } else {
                          recommendations = [
                            <span key="r1">• 첫 화면에 너무 많은 정보가 있는지 확인하고 <strong>핵심 메시지만 강조</strong>하세요<br /></span>,
                            <span key="r2">• 랜딩 페이지 디자인이 신뢰감을 주는지 점검하세요<br /></span>,
                            <span key="r3">• CTA(행동 유도) 버튼이 눈에 잘 띄는지 확인하세요</span>
                          ];
                        }
                      } else if (highestChurnStage.stage === 'consideration') {
                        if (highestChurnStage.avg > 70) {
                          recommendations = [
                            <span key="r1">• <strong>상세 페이지에 정보가 부족</strong>합니다. 제품 설명, 사양, 사용법을 보강하세요<br /></span>,
                            <span key="r2">• <strong>고객 리뷰와 평점</strong>을 눈에 띄게 배치하세요 (신뢰도 향상)<br /></span>,
                            <span key="r3">• 경쟁사 대비 차별화 포인트를 명확히 전달하세요</span>
                          ];
                        } else {
                          recommendations = [
                            <span key="r1">• 제품 이미지의 품질을 높이고 다양한 각도로 제공하세요<br /></span>,
                            <span key="r2">• FAQ나 챗봇을 추가하여 즉시 궁금증을 해결하세요<br /></span>,
                            <span key="r3">• 사용 사례나 후기 영상을 추가하세요</span>
                          ];
                        }
                      } else if (highestChurnStage.stage === 'conversion') {
                        if (highestChurnStage.avg > 75) {
                          recommendations = [
                            <span key="r1">• <strong>가격이 너무 높거나</strong> 할인/프로모션이 부족합니다. 첫 구매 할인을 제공하세요<br /></span>,
                            <span key="r2">• <strong>회원가입 없이</strong> 게스트로 결제할 수 있게 하세요 (이탈률 크게 감소)<br /></span>,
                            <span key="r3">• 배송비가 높거나 배송 기간이 길면 명확히 안내하세요</span>
                          ];
                        } else {
                          recommendations = [
                            <span key="r1">• &quot;장바구니 담기&quot; 버튼을 더 눈에 띄게 만드세요<br /></span>,
                            <span key="r2">• 재고 부족 시 알림 받기 기능을 제공하세요<br /></span>,
                            <span key="r3">• 위시리스트 기능으로 나중에 구매를 유도하세요</span>
                          ];
                        }
                      } else if (highestChurnStage.stage === 'purchase') {
                        if (highestChurnStage.avg > 30) {
                          recommendations = [
                            <span key="r1">• <strong>결제 과정이 너무 복잡</strong>합니다. 단계를 3단계 이하로 줄이세요<br /></span>,
                            <span key="r2">• <strong>카카오페이, 네이버페이</strong> 등 간편결제 옵션을 추가하세요 (이탈률 급감)<br /></span>,
                            <span key="r3">• 보안 인증서 표시로 결제 안전성을 강조하세요</span>
                          ];
                        } else {
                          recommendations = [
                            <span key="r1">• 결제 단계마다 진행 상황 표시줄을 보여주세요<br /></span>,
                            <span key="r2">• 예상치 못한 추가 비용(배송비, 수수료)이 없는지 확인하세요<br /></span>,
                            <span key="r3">• 결제 실패 시 명확한 오류 메시지와 해결 방법을 제공하세요</span>
                          ];
                        }
                      }

                      parts.push(
                        <span key="recommendations">
                          <br /><br /><strong style={{ color: 'var(--primary-main)' }}>💡 {highestChurnStage.label} 이탈률 개선 방법:</strong><br />
                          {recommendations}
                        </span>
                      );

                      // 전체적인 이탈률 패턴 분석
                      const allChurns = [avgActivation, avgConsideration, avgConversion, avgPurchase];
                      const overallAvg = allChurns.reduce((sum, val) => sum + val, 0) / 4;

                      let overallStatus = '';
                      if (overallAvg > 60) {
                        overallStatus = '전반적으로 이탈률이 높습니다. <strong>전체 고객 여정을 재검토</strong>하고, 각 단계마다 A/B 테스트를 진행하세요.';
                      } else if (overallAvg < 40) {
                        overallStatus = '전반적으로 우수한 상태입니다! 현재 전략을 유지하면서 세부적인 최적화에 집중하세요.';
                      } else {
                        overallStatus = '평균적인 수준입니다. 위의 개선 방법을 우선순위에 따라 하나씩 적용해보세요.';
                      }

                      parts.push(
                        <span key="overall-status">
                          <br /><br /><strong style={{ color: 'var(--primary-main)' }}>📊 전체 퍼널 상태:</strong>{' '}
                          <span dangerouslySetInnerHTML={{ __html: overallStatus }} />
                        </span>
                      );

                      return parts;
                    })()}
                  </div>
                </div>

                {/* 필터 버튼 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', padding: '0 24px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--grey-700)' }}>📊 퍼널 단계:</span>
                  <button className={`view-btn channel-churn-stage-btn ${currentChurnStage === 'activation' ? 'active' : ''}`} onClick={() => setCurrentChurnStage('activation')}>유입→활동</button>
                  <button className={`view-btn channel-churn-stage-btn ${currentChurnStage === 'consideration' ? 'active' : ''}`} onClick={() => setCurrentChurnStage('consideration')}>활동→관심</button>
                  <button className={`view-btn channel-churn-stage-btn ${currentChurnStage === 'conversion' ? 'active' : ''}`} onClick={() => setCurrentChurnStage('conversion')}>관심→결제진행</button>
                  <button className={`view-btn channel-churn-stage-btn ${currentChurnStage === 'purchase' ? 'active' : ''}`} onClick={() => setCurrentChurnStage('purchase')}>결제진행→구매완료</button>
                  <button className={`view-btn channel-churn-stage-btn ${currentChurnStage === 'avg' ? 'active' : ''}`} onClick={() => setCurrentChurnStage('avg')}>평균 이탈률</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', padding: '0 24px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--grey-700)' }}>🔢 정렬:</span>
                  <button className={`view-btn channel-churn-sort-btn ${currentChurnSort === 'desc' ? 'active' : ''}`} onClick={() => setCurrentChurnSort('desc')}>📉 높은순</button>
                  <button className={`view-btn channel-churn-sort-btn ${currentChurnSort === 'asc' ? 'active' : ''}`} onClick={() => setCurrentChurnSort('asc')}>📈 낮은순</button>
                </div>

                <div
                  className="chart-container-small"
                  style={{ position: 'relative' }}
                  onMouseEnter={(e) => setChurnTooltip({ show: true, x: e.clientX + 15, y: e.clientY + 15 })}
                  onMouseMove={(e) => churnTooltip.show && setChurnTooltip({ show: true, x: e.clientX + 15, y: e.clientY + 15 })}
                  onMouseLeave={() => setChurnTooltip({ show: false, x: 0, y: 0 })}
                >
                  {channelChurnData.labels.length > 0 && channelChurnData.config && (
                    <Bar
                      key={`churn-${currentChurnStage}-${currentChurnSort}`}
                      data={{
                        labels: channelChurnData.labels,
                        datasets: [{
                          label: channelChurnData.config.label,
                          data: channelChurnData.values,
                          backgroundColor: channelChurnData.config.color.replace(')', ', 0.8)').replace('rgb', 'rgba'),
                          borderColor: channelChurnData.config.color,
                          borderWidth: 1
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                        plugins: {
                          legend: { display: false },
                          datalabels: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (context) => `${channelChurnData.config?.label || '이탈률'}: ${(context.raw as number).toFixed(1)}%`,
                              afterLabel: () => `계산식: ${channelChurnData.config?.tooltip || ''}`
                            }
                          }
                        },
                        scales: {
                          x: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: channelChurnData.config.label
                            }
                          }
                        }
                      }}
                    />
                  )}
                </div>

                {/* churnTooltip 인사이트 툴팁 */}
                <div
                  className={`chart-insight-tooltip ${churnTooltip.show ? 'show' : ''}`}
                  style={{ left: churnTooltip.x, top: churnTooltip.y }}
                >
                  <div className="tooltip-insight-section">
                    <div className="tooltip-insight-header">💡 인사이트</div>
                    <p className="tooltip-insight-text">
                      채널 이탈률을 개선하면 전환율이 높아지고 매출이 증가합니다.
                    </p>
                  </div>
                  <div className="tooltip-recommendation-section">
                    <div className="tooltip-recommendation-header">🎯 추천 사항</div>
                    <p className="tooltip-recommendation-text">
                      이탈률이 높은 채널일수록 개선 여지가 크다는 뜻입니다. 그 단계를 집중적으로 개선하면 효과가 큽니다.
                    </p>
                  </div>
                </div>

                {/* 이탈률 해석 가이드 */}
                <div style={{ marginTop: '20px', padding: '0 24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--grey-900)', marginBottom: '12px' }}>
                    📋 단계별 이탈 원인과 개선 방법
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    {/* 유입→활동 이탈 */}
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8fc 100%)', borderRadius: '8px', borderLeft: '3px solid #2196f3' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#2196f3', marginBottom: '6px' }}>
                        🚪 유입→활동 이탈이 높다면
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        <strong>원인:</strong> 랜딩 페이지가 느리거나, 광고 내용과 실제 페이지가 다르거나, 첫 화면이 복잡함<br />
                        <strong>해결:</strong> 로딩 속도 개선(3초 이내), 광고와 랜딩 페이지 메시지 일치, 명확한 헤드라인 배치
                      </div>
                    </div>

                    {/* 활동→관심 이탈 */}
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #fff3e0 0%, #fff9e6 100%)', borderRadius: '8px', borderLeft: '3px solid #ff9800' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#f57c00', marginBottom: '6px' }}>
                        👀 활동→관심 이탈이 높다면
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        <strong>원인:</strong> 제품/서비스 정보 부족, 신뢰 요소 부족, 가격 정보 숨김<br />
                        <strong>해결:</strong> 상세한 제품 설명, 고객 후기/리뷰 강조, 가격 투명하게 공개, 비교표 제공
                      </div>
                    </div>

                    {/* 관심→결제진행 이탈 */}
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #f3e5f5 0%, #fce4ec 100%)', borderRadius: '8px', borderLeft: '3px solid #9c27b0' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#9c27b0', marginBottom: '6px' }}>
                        🛒 관심→결제진행 이탈이 높다면
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        <strong>원인:</strong> 가격이 예상보다 높음, 배송비 추가 비용 발견, 회원가입 강요<br />
                        <strong>해결:</strong> 첫 구매 할인 제공, 무료 배송 임계값 낮추기, 게스트 체크아웃 허용
                      </div>
                    </div>

                    {/* 결제진행→구매완료 이탈 */}
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #ffebee 0%, #fff5f5 100%)', borderRadius: '8px', borderLeft: '3px solid #ff5722' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#ff5722', marginBottom: '6px' }}>
                        💳 결제진행→구매완료 이탈이 높다면
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        <strong>원인:</strong> 결제 과정 복잡, 보안 불안, 결제 수단 부족, 시스템 오류<br />
                        <strong>해결:</strong> 간편 결제 도입(카카오페이, 네이버페이), SSL 인증 표시, 다양한 결제 옵션, 장바구니 복원 이메일
                      </div>
                    </div>
                  </div>

                  {/* 이탈률 벤치마크 */}
                  <div style={{ padding: '14px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: '8px', borderLeft: '3px solid #00c853', marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#00c853', marginBottom: '6px' }}>
                      📊 업계 평균 이탈률 벤치마크
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.6 }}>
                      <strong>유입→활동:</strong> 평균 40-60% (낮을수록 좋음)<br />
                      <strong>활동→관심:</strong> 평균 50-70%<br />
                      <strong>관심→결제진행:</strong> 평균 60-80%<br />
                      <strong>결제진행→구매완료:</strong> 평균 20-40% (이 단계는 특히 낮아야 함)<br /><br />
                      <strong>💡 팁:</strong> 업계 평균보다 10%p 이상 높다면 즉시 개선이 필요합니다.
                    </div>
                  </div>

                  {/* 실행 체크리스트 */}
                  <div style={{ padding: '14px', background: 'var(--primary-light)', borderRadius: '8px', borderLeft: '3px solid var(--primary-main)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-main)', marginBottom: '8px' }}>
                      ✅ 이탈률 개선 우선순위 체크리스트
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.6 }}>
                      <strong>1단계:</strong> 차트에서 <strong>이탈률이 가장 높은 단계</strong>를 찾기 (예: 유입→활동 80%)<br />
                      <strong>2단계:</strong> 해당 단계에서 <strong>이탈률이 가장 높은 채널 TOP 3</strong> 확인<br />
                      <strong>3단계:</strong> 위 가이드에서 해당 단계의 <strong>원인과 해결책</strong> 확인<br />
                      <strong>4단계:</strong> 가장 이탈률이 높은 1-2개 채널에 대해 <strong>즉시 개선 작업 시작</strong><br />
                      <strong>5단계:</strong> 2주 후 다시 측정하여 이탈률이 10%p 이상 감소했는지 확인<br /><br />
                      <strong>⚡ 빠른 개선 팁:</strong> 한 번에 모든 채널을 고치려 하지 마세요. 이탈률이 가장 높은 1-2개 채널에만 집중하면 전체 전환율이 극적으로 개선됩니다.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 탭 4: 채널별 재방문율 vs 이탈률 매트릭스 */}
          {customerAnalysisTab === 'matrix' && (
            <div className="customer-analysis-tab-content active" id="matrixTab">
              <div className="chart-section card" style={{ marginBottom: '16px' }}>
                <div className="chart-header">🎯 채널 품질 매트릭스: 재방문율 vs 이탈률</div>
                <div style={{ fontSize: '13px', color: 'var(--grey-600)', marginBottom: '12px', padding: '0 24px' }}>
                  채널을 재방문율(Y축)과 이탈률(X축)로 분류합니다. 평균 기준선을 중심으로 4개 분면으로 자동 구분되며, 각 채널 유형에 맞는 액션 플랜을 아래에서 확인하세요.
                </div>
                <div style={{ position: 'relative', height: '450px' }}>
                  {(() => {
                    // 채널별 재방문율과 이탈률(Bounce rate) 계산 (HTML 원본과 동일: 필터 없음)
                    const matrixData = channelEngagementData.map(row => ({
                      x: parseFloat(row['Bounce rate']) || 0,
                      y: parseFloat(row['Return rate']) || 0,
                      channel: row['channel']
                    }));

                    if (matrixData.length === 0) return <div>데이터를 불러오는 중...</div>;

                    // 평균값 계산 (기준선용)
                    const avgBounceRate = matrixData.reduce((sum, d) => sum + d.x, 0) / matrixData.length;
                    const avgReturnRate = matrixData.reduce((sum, d) => sum + d.y, 0) / matrixData.length;

                    // 사분면별로 데이터 분리
                    const starChannels: typeof matrixData = [];
                    const growthChannels: typeof matrixData = [];
                    const stableChannels: typeof matrixData = [];
                    const problemChannels: typeof matrixData = [];

                    matrixData.forEach(d => {
                      if (d.x < avgBounceRate && d.y > avgReturnRate) {
                        starChannels.push(d);
                      } else if (d.x >= avgBounceRate && d.y > avgReturnRate) {
                        growthChannels.push(d);
                      } else if (d.x < avgBounceRate && d.y <= avgReturnRate) {
                        stableChannels.push(d);
                      } else {
                        problemChannels.push(d);
                      }
                    });

                    return (
                      <Scatter
                        data={{
                          datasets: [
                            {
                              label: '⭐ 스타 채널',
                              data: starChannels,
                              backgroundColor: '#00c853',
                              borderColor: '#00a344',
                              borderWidth: 2,
                              pointRadius: 10,
                              pointHoverRadius: 14
                            },
                            {
                              label: '📈 성장 채널',
                              data: growthChannels,
                              backgroundColor: '#2196f3',
                              borderColor: '#1976d2',
                              borderWidth: 2,
                              pointRadius: 10,
                              pointHoverRadius: 14
                            },
                            {
                              label: '🔒 안정 채널',
                              data: stableChannels,
                              backgroundColor: '#9e9e9e',
                              borderColor: '#757575',
                              borderWidth: 2,
                              pointRadius: 10,
                              pointHoverRadius: 14
                            },
                            {
                              label: '⚠️ 문제 채널',
                              data: problemChannels,
                              backgroundColor: '#ff5722',
                              borderColor: '#e64a19',
                              borderWidth: 2,
                              pointRadius: 10,
                              pointHoverRadius: 14
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: true,
                              position: 'top',
                              labels: {
                                font: { size: 12, weight: 'bold' },
                                padding: 15,
                                usePointStyle: true
                              }
                            },
                            datalabels: { display: false },
                            tooltip: {
                              callbacks: {
                                title: (tooltipItems) => {
                                  const item = tooltipItems[0];
                                  return (item.raw as { channel: string }).channel;
                                },
                                label: (context) => {
                                  const raw = context.raw as { x: number; y: number };
                                  return [
                                    `이탈률: ${raw.x.toFixed(2)}%`,
                                    `재방문율: ${raw.y.toFixed(2)}%`,
                                    `분류: ${context.dataset.label}`
                                  ];
                                }
                              }
                            },
                            annotation: {
                              annotations: {
                                vline: {
                                  type: 'line',
                                  xMin: avgBounceRate,
                                  xMax: avgBounceRate,
                                  borderColor: 'rgba(0, 0, 0, 0.3)',
                                  borderWidth: 2,
                                  borderDash: [5, 5],
                                  label: {
                                    content: '평균 이탈률',
                                    display: true,
                                    position: 'start'
                                  }
                                },
                                hline: {
                                  type: 'line',
                                  yMin: avgReturnRate,
                                  yMax: avgReturnRate,
                                  borderColor: 'rgba(0, 0, 0, 0.3)',
                                  borderWidth: 2,
                                  borderDash: [5, 5],
                                  label: {
                                    content: '평균 재방문율',
                                    display: true,
                                    position: 'start'
                                  }
                                }
                              }
                            }
                          },
                          scales: {
                            x: {
                              title: {
                                display: true,
                                text: '이탈률 (%) →',
                                font: { size: 14, weight: 'bold' }
                              },
                              ticks: {
                                callback: function(value) {
                                  return value + '%';
                                }
                              }
                            },
                            y: {
                              title: {
                                display: true,
                                text: '← 재방문율 (%)',
                                font: { size: 14, weight: 'bold' }
                              },
                              ticks: {
                                callback: function(value) {
                                  return value + '%';
                                }
                              }
                            }
                          }
                        }}
                      />
                    );
                  })()}
                </div>

                {/* 채널 유형별 액션 가이드 */}
                <div style={{ marginTop: '24px', padding: '0 24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--grey-900)', marginBottom: '16px' }}>
                    📋 채널 유형별 액션 가이드
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {/* 스타 채널 */}
                    <div style={{ padding: '16px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: '10px', borderLeft: '4px solid #00c853' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#00c853', marginBottom: '8px' }}>
                        ⭐ 스타 채널 (낮은 이탈 + 높은 재방문)
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--grey-700)', lineHeight: 1.6 }}>
                        <strong>💡 해야 할 일:</strong> 투자 확대 및 현재 전략 유지<br />
                        <strong>✨ 기대 효과:</strong> 안정적인 매출 증대, ROI 극대화<br />
                        <strong>🎯 구체적 행동:</strong>
                        <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                          <li>마케팅 예산을 20-30% 증액</li>
                          <li>유사한 타겟 오디언스로 확장</li>
                          <li>성공 요인 분석 후 다른 채널에 적용</li>
                          <li>고객 추천 프로그램 운영</li>
                        </ul>
                      </div>
                    </div>

                    {/* 성장 채널 */}
                    <div style={{ padding: '16px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8fc 100%)', borderRadius: '10px', borderLeft: '4px solid #2196f3' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#2196f3', marginBottom: '8px' }}>
                        📈 성장 채널 (높은 이탈 + 높은 재방문)
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--grey-700)', lineHeight: 1.6 }}>
                        <strong>💡 해야 할 일:</strong> 이탈률 개선에 집중<br />
                        <strong>✨ 기대 효과:</strong> 전환율 상승, 신규 고객 확보<br />
                        <strong>🎯 구체적 행동:</strong>
                        <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                          <li>랜딩 페이지 개선 (로딩 속도, 디자인)</li>
                          <li>첫 방문 고객 경험 최적화</li>
                          <li>명확한 CTA(행동 유도) 버튼 배치</li>
                          <li>신뢰 요소 강화 (리뷰, 보안 인증)</li>
                        </ul>
                      </div>
                    </div>

                    {/* 안정 채널 */}
                    <div style={{ padding: '16px', background: 'linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%)', borderRadius: '10px', borderLeft: '4px solid #9e9e9e' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#757575', marginBottom: '8px' }}>
                        🔒 안정 채널 (낮은 이탈 + 낮은 재방문)
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--grey-700)', lineHeight: 1.6 }}>
                        <strong>💡 해야 할 일:</strong> 재방문 유도 전략 구축<br />
                        <strong>✨ 기대 효과:</strong> 고객 생애가치(LTV) 증가<br />
                        <strong>🎯 구체적 행동:</strong>
                        <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                          <li>리타겟팅 광고 캠페인 운영</li>
                          <li>이메일/SMS 마케팅 자동화</li>
                          <li>쿠폰/할인 프로모션 제공</li>
                          <li>회원 등급제 및 포인트 적립 도입</li>
                        </ul>
                      </div>
                    </div>

                    {/* 문제 채널 */}
                    <div style={{ padding: '16px', background: 'linear-gradient(135deg, #ffebee 0%, #fff5f5 100%)', borderRadius: '10px', borderLeft: '4px solid #ff5722' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#ff5722', marginBottom: '8px' }}>
                        ⚠️ 문제 채널 (높은 이탈 + 낮은 재방문)
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--grey-700)', lineHeight: 1.6 }}>
                        <strong>💡 해야 할 일:</strong> 전면 재검토 또는 중단<br />
                        <strong>✨ 기대 효과:</strong> 비용 절감, 효율적 자원 배분<br />
                        <strong>🎯 구체적 행동:</strong>
                        <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                          <li>타겟 오디언스 재설정</li>
                          <li>광고 크리에이티브 전면 교체</li>
                          <li>예산 축소 또는 일시 중단</li>
                          <li>A/B 테스트로 개선 가능성 검증</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* 추가 팁 */}
                  <div style={{ marginTop: '16px', padding: '12px 16px', background: 'var(--primary-light)', borderRadius: '8px', borderLeft: '4px solid var(--primary-main)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--grey-800)', lineHeight: 1.6 }}>
                      <strong>💡 프로 팁:</strong> 모든 채널을 한 번에 변경하지 마세요. 한 번에 1-2개 채널에 집중하여 개선하고, 2-4주 후 결과를 측정한 뒤 다음 채널로 넘어가는 것이 효과적입니다.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 탭 5: 채널별 참여도 분석 */}
          {customerAnalysisTab === 'engagement' && (
            <div className="customer-analysis-tab-content active" id="engagementTab">
              <div className="chart-section card">
                <div className="chart-header">💎 채널별 고객 참여도: 어떤 채널이 진짜 관심 있는 고객을 데려오나요?</div>

                {/* 설명 */}
                <div style={{ fontSize: '13px', color: 'var(--grey-600)', marginBottom: '16px', padding: '0 24px', lineHeight: 1.7 }}>
                  <strong>참여도(Engagement Rate)란?</strong><br />
                  방문자 중 실제로 웹사이트를 적극적으로 사용한 비율입니다. 단순 클릭 실수나 즉시 이탈한 방문이 아니라,
                  <strong>페이지를 여러 개 보거나 일정 시간 이상 머문 &quot;진짜 관심 있는&quot; 고객의 비율</strong>입니다.
                  <strong>차트 위에 마우스를 올리면</strong> 더 자세한 분석을 확인할 수 있습니다.
                </div>

                {/* 참여도 자동 인사이트 */}
                <div id="engagementInsightSummary" style={{ margin: '0 24px 16px 24px', padding: '16px', background: 'linear-gradient(135deg, #f3e5f5 0%, #fce4ec 100%)', borderRadius: '10px', borderLeft: '4px solid #9c27b0' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#9c27b0', marginBottom: '8px' }}>
                    💡 참여도 분석 결과
                  </div>
                  <div id="engagementInsightText" style={{ fontSize: '13px', color: 'var(--grey-800)', lineHeight: 1.6 }}>
                    {(() => {
                      if (channelEngagementData.length === 0) return '데이터를 불러오는 중...';

                      // 참여율 기준으로 정렬
                      const allData = [...channelEngagementData].sort((a, b) =>
                        parseFloat(b['Engagement rate']) - parseFloat(a['Engagement rate'])
                      );

                      if (allData.length === 0) return '데이터를 불러오는 중...';

                      // 전체 평균 참여도
                      const avgEngagement = allData.reduce((sum, row) => sum + (parseFloat(row['Engagement rate']) || 0), 0) / allData.length;

                      // 최고/최저 참여도 채널
                      const highest = allData[0];
                      const lowest = allData[allData.length - 1];

                      // 참여도 범위 분류
                      const highEngagement = allData.filter(row => parseFloat(row['Engagement rate']) >= 60);
                      const mediumEngagement = allData.filter(row => {
                        const rate = parseFloat(row['Engagement rate']);
                        return rate >= 40 && rate < 60;
                      });
                      const lowEngagement = allData.filter(row => parseFloat(row['Engagement rate']) < 40);

                      // TOP 10의 평균 참여도
                      const top10 = allData.slice(0, 10);
                      const top10Rates = top10.map(row => parseFloat(row['Engagement rate']) || 0);
                      const top10Avg = top10Rates.reduce((sum, rate) => sum + rate, 0) / top10Rates.length;

                      const parts: React.ReactNode[] = [];

                      // 전체 상황 요약
                      parts.push(
                        <span key="avg">
                          전체 채널의 평균 참여도는 <strong style={{ color: '#9c27b0' }}>{avgEngagement.toFixed(1)}%</strong>입니다.{' '}
                        </span>
                      );

                      if (avgEngagement >= 60) {
                        parts.push(<span key="eval"><strong style={{ color: 'var(--success-main)' }}>매우 우수한</strong> 수준입니다! </span>);
                      } else if (avgEngagement >= 40) {
                        parts.push(<span key="eval">평균적인 수준이며 개선 여지가 있습니다. </span>);
                      } else {
                        parts.push(<span key="eval"><strong style={{ color: 'var(--error-main)' }}>주의가 필요한</strong> 수준입니다. </span>);
                      }

                      // 최고/최저 채널 정보
                      parts.push(
                        <span key="highlow">
                          <br />가장 높은 참여도는 <strong>{highest['channel']}</strong> ({parseFloat(highest['Engagement rate']).toFixed(1)}%)이고,{' '}
                          가장 낮은 참여도는 <strong>{lowest['channel']}</strong> ({parseFloat(lowest['Engagement rate']).toFixed(1)}%)입니다.{' '}
                        </span>
                      );

                      // 범위별 분포
                      const distParts: string[] = [];
                      if (highEngagement.length > 0) {
                        distParts.push(`<strong style="color: var(--success-main);">${highEngagement.length}개 채널</strong>이 우수(60% 이상)`);
                      }
                      if (mediumEngagement.length > 0) {
                        distParts.push(`<strong style="color: #ff9800;">${mediumEngagement.length}개 채널</strong>이 보통(40-60%)`);
                      }
                      if (lowEngagement.length > 0) {
                        distParts.push(`<strong style="color: var(--error-main);">${lowEngagement.length}개 채널</strong>이 저조(40% 미만)`);
                      }

                      parts.push(
                        <span key="dist">
                          <br /><br /><strong style={{ color: 'var(--primary-main)' }}>📊 채널 분포:</strong>{' '}
                          <span dangerouslySetInnerHTML={{ __html: distParts.join(', ') + '입니다. ' }} />
                        </span>
                      );

                      // 핵심 추천사항
                      let strategy = '';
                      if (highEngagement.length >= allData.length * 0.3) {
                        strategy = `우수한 채널이 많습니다! 이들 채널의 공통점을 분석하여 다른 채널에도 적용하세요. 특히 <strong>${highest['channel']}</strong>의 성공 요인을 자세히 연구하세요.`;
                      } else if (lowEngagement.length >= allData.length * 0.3) {
                        strategy = `참여도가 낮은 채널이 많습니다. <strong>즉시 광고 타겟팅과 랜딩 페이지를 재검토</strong>하세요. 저참여도 채널의 예산을 고참여도 채널로 재배분하는 것을 고려하세요.`;
                      } else {
                        strategy = `대부분 채널이 개선 가능한 상태입니다. <strong>A/B 테스트를 통해 랜딩 페이지를 최적화</strong>하고, 타겟 오디언스를 세분화하여 참여도를 높이세요.`;
                      }

                      parts.push(
                        <span key="strategy">
                          <br /><br /><strong style={{ color: 'var(--primary-main)' }}>💡 핵심 전략:</strong>{' '}
                          <span dangerouslySetInnerHTML={{ __html: strategy }} />
                        </span>
                      );

                      // 구체적 예시 (top10Avg - avgEngagement > 10)
                      if (top10Avg - avgEngagement > 10) {
                        parts.push(
                          <span key="warning">
                            <br /><br /><strong>⚠️ 주의:</strong> 상위 10개 채널의 평균 참여도({top10Avg.toFixed(1)}%)가 전체 평균보다 {(top10Avg - avgEngagement).toFixed(1)}%p 높습니다.{' '}
                            나머지 채널들의 품질이 낮으므로, 저성과 채널을 정리하거나 개선하는 것이 시급합니다.
                          </span>
                        );
                      }

                      return parts;
                    })()}
                  </div>
                </div>

                <div className="chart-container-small" style={{ position: 'relative' }}>
                  {channelEngagementData.length > 0 && (() => {
                    // 참여율 기준으로 정렬 (HTML과 동일: 필터 없음)
                    const sortedData = [...channelEngagementData].sort((a, b) =>
                      parseFloat(b['Engagement rate']) - parseFloat(a['Engagement rate'])
                    );

                    // 상위 10개 채널만 표시
                    const top10 = sortedData.slice(0, 10);
                    const labels = top10.map(row => row['channel']);
                    const engagementRates = top10.map(row => parseFloat(row['Engagement rate']) || 0);

                    // 색상 그라데이션 (높을수록 진한 색)
                    const colors = engagementRates.map(rate => {
                      const intensity = Math.min(rate / 100, 1);
                      return `rgba(103, 58, 183, ${0.3 + intensity * 0.5})`;
                    });

                    return (
                      <Bar
                        data={{
                          labels: labels,
                          datasets: [{
                            label: '참여율 (%)',
                            data: engagementRates,
                            backgroundColor: colors,
                            borderColor: '#673ab7',
                            borderWidth: 2
                          }]
                        }}
                        options={{
                          indexAxis: 'y',
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            datalabels: { display: false },
                            tooltip: {
                              callbacks: {
                                label: (context) => `참여율: ${context.parsed.x.toFixed(2)}%`
                              }
                            }
                          },
                          scales: {
                            x: {
                              beginAtZero: true,
                              max: 100,
                              ticks: {
                                callback: function(value) {
                                  return value + '%';
                                }
                              }
                            }
                          }
                        }}
                      />
                    );
                  })()}
                </div>

                {/* 참여도 해석 가이드 */}
                <div style={{ marginTop: '20px', padding: '0 24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--grey-900)', marginBottom: '12px' }}>
                    📋 참여도 수치 해석 가이드
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    {/* 높은 참여도 */}
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%)', borderRadius: '8px', borderLeft: '3px solid #00c853' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#00c853', marginBottom: '6px' }}>
                        🌟 높음 (60% 이상)
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        <strong>의미:</strong> 매우 질 좋은 트래픽. 관심도 높은 고객을 데려오고 있습니다.<br />
                        <strong>행동:</strong> 이 채널에 예산을 더 투자하세요. 성공 요인을 분석하여 다른 채널에도 적용하세요.
                      </div>
                    </div>

                    {/* 중간 참여도 */}
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #fff3e0 0%, #fff9e6 100%)', borderRadius: '8px', borderLeft: '3px solid #ff9800' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#f57c00', marginBottom: '6px' }}>
                        ⚖️ 보통 (40-60%)
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        <strong>의미:</strong> 평균적인 트래픽. 개선 여지가 있습니다.<br />
                        <strong>행동:</strong> 랜딩 페이지를 최적화하거나 타겟팅을 조정하세요. A/B 테스트로 참여도 향상을 시도하세요.
                      </div>
                    </div>

                    {/* 낮은 참여도 */}
                    <div style={{ padding: '14px', background: 'linear-gradient(135deg, #ffebee 0%, #fff5f5 100%)', borderRadius: '8px', borderLeft: '3px solid #ff5722' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#ff5722', marginBottom: '6px' }}>
                        ⚠️ 낮음 (40% 미만)
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.5 }}>
                        <strong>의미:</strong> 품질이 낮은 트래픽. 잘못된 고객층이 유입되고 있을 수 있습니다.<br />
                        <strong>행동:</strong> 광고 타겟팅을 재검토하거나 예산을 줄이세요. 광고 메시지와 랜딩 페이지의 일치 여부를 확인하세요.
                      </div>
                    </div>
                  </div>

                  {/* 추가 팁 */}
                  <div style={{ padding: '14px', background: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8fc 100%)', borderRadius: '8px', borderLeft: '3px solid #2196f3' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#2196f3', marginBottom: '6px' }}>
                      💡 참여도와 전환율의 관계
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.6 }}>
                      <strong>핵심:</strong> 참여도가 높으면 전환율도 높아집니다. 참여도가 낮은 채널은 방문자 수가 많아도 실제 매출은 적을 수 있습니다.
                      따라서 단순히 클릭 수만 보지 말고, <strong>참여도와 전환율을 함께 고려</strong>하여 예산을 배분하세요.<br /><br />
                      <strong>예시:</strong> A채널은 방문자 1,000명에 참여도 30%, B채널은 방문자 500명에 참여도 70%라면,
                      실제로 B채널이 더 많은 매출을 가져올 가능성이 큽니다.
                    </div>
                  </div>

                  {/* 실행 체크리스트 */}
                  <div style={{ marginTop: '12px', padding: '14px', background: 'var(--primary-light)', borderRadius: '8px', borderLeft: '3px solid var(--primary-main)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-main)', marginBottom: '8px' }}>
                      ✅ 지금 바로 실행할 체크리스트
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--grey-700)', lineHeight: 1.6 }}>
                      1. <strong>참여도 상위 3개 채널</strong>의 공통점을 찾아 다른 채널에 적용<br />
                      2. <strong>참여도 하위 3개 채널</strong>의 광고 타겟팅 또는 랜딩 페이지 점검<br />
                      3. 참여도가 높지만 전환율이 낮은 채널이 있다면 <strong>결제 프로세스나 가격 정책</strong> 개선<br />
                      4. 참여도가 낮은 채널은 예산을 줄이고, 참여도가 높은 채널에 재투자
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
