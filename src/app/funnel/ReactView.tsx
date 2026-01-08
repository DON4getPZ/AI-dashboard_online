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
import { Bar, Line } from 'react-chartjs-2';
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
  [key: string]: unknown;
}

interface SummaryCard {
  title?: string;
  description?: string;
  metrics?: Record<string, unknown>;
}

interface KeyInsight {
  title: string;
  description: string;
  type: string;
  action?: {
    text: string;
    link?: string;
  };
  sub_items?: string[];
}

interface MicroSegmentAlert {
  type: 'problem' | 'opportunity';
  category: string;
  sub_type: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  diagnosis?: string;
  reason?: string;
  impact?: Record<string, unknown>;
  action_detail?: Record<string, unknown>;
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
  if (num === undefined || num === null) return '0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  return n.toLocaleString('ko-KR');
}

function formatDecimal(num: number | string | undefined): string {
  if (num === undefined || num === null) return '0.00';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0.00';
  return n.toFixed(2);
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
  const [customerAnalysisTab, setCustomerAnalysisTab] = useState<string>('newVsReturning');

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
      high: problemAlerts.filter((a: MicroSegmentAlert) => a.severity === 'high'),
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
    if (!insightsData?.performance_trends) return { improvements: [], declines: [] };

    const trends = insightsData.performance_trends;
    const dataKeyMapImp: Record<string, string> = { '7d': 'improvements_7d', '14d': 'improvements_14d', '30d': 'improvements_30d' };
    const dataKeyMapDec: Record<string, string> = { '7d': 'declines_7d', '14d': 'declines_14d', '30d': 'declines_30d' };

    const impKey = dataKeyMapImp[trendPeriod] || 'improvements_7d';
    const decKey = dataKeyMapDec[trendPeriod] || 'declines_7d';

    return {
      improvements: (trends as Record<string, TrendItem[]>)[impKey] || [],
      declines: (trends as Record<string, TrendItem[]>)[decKey] || []
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
    if (channelData.length === 0) return { labels: [], values: [], config: null };

    const stageConfig: Record<string, { label: string; color: string; getValue: (row: ChannelDataRow) => number }> = {
      activation: {
        label: '유입→활동 이탈률 (%)',
        color: '#673ab7',
        getValue: (row) => calculateChurnRates(row).activation
      },
      consideration: {
        label: '활동→관심 이탈률 (%)',
        color: '#2196f3',
        getValue: (row) => calculateChurnRates(row).consideration
      },
      conversion: {
        label: '관심→결제진행 이탈률 (%)',
        color: '#ff9800',
        getValue: (row) => calculateChurnRates(row).conversion
      },
      purchase: {
        label: '결제진행→구매완료 이탈률 (%)',
        color: '#4caf50',
        getValue: (row) => calculateChurnRates(row).purchase
      },
      avg: {
        label: '평균 이탈률 (%)',
        color: '#e91e63',
        getValue: (row) => calculateChurnRates(row).avg
      }
    };

    const config = stageConfig[currentChurnStage];
    if (!config) return { labels: [], values: [], config: null };

    const sortedData = [...channelData].sort((a, b) => {
      const aVal = config.getValue(a);
      const bVal = config.getValue(b);
      return currentChurnSort === 'desc' ? (bVal - aVal) : (aVal - bVal);
    }).slice(0, 10);

    return {
      labels: sortedData.map(row => row.channel),
      values: sortedData.map(row => config.getValue(row)),
      config
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
          pointHoverRadius: 6
        },
        {
          label: '재방문율 (%)',
          data: aggregatedData.map(d => parseFloat(d.returnRate)),
          borderColor: '#673ab7',
          backgroundColor: 'rgba(103, 58, 183, 0.1)',
          tension: 0.3,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 6
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
    let tooltip = d3.select('body').select('.funnel-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('body')
        .append('div')
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
    if (!periodData?.channel_strategy?.channels) return null;

    const strategy = periodData.channel_strategy;
    const quadrants: Record<string, { channels: string[]; color: string; description: string }> = {
      'star': { channels: [], color: '#4caf50', description: '스타 채널 (높은 성장, 높은 점유)' },
      'question_mark': { channels: [], color: '#ff9800', description: '물음표 채널 (높은 성장, 낮은 점유)' },
      'cash_cow': { channels: [], color: '#2196f3', description: '캐시카우 채널 (낮은 성장, 높은 점유)' },
      'dog': { channels: [], color: '#9e9e9e', description: '도그 채널 (낮은 성장, 낮은 점유)' }
    };

    Object.entries(strategy.channels!).forEach(([channelName, channelInfo]) => {
      const quadrant = channelInfo.bcg_matrix?.quadrant;
      if (quadrant && quadrants[quadrant]) {
        quadrants[quadrant].channels.push(channelName);
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
  const crmActions = useMemo(() => {
    if (!insightsData?.crm_actions_by_period) return [];
    const crmActionsByPeriod = insightsData.crm_actions_by_period;
    if (!crmActionsByPeriod[currentPeriod]) return [];
    return crmActionsByPeriod[currentPeriod].crm_actions || [];
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
        recommendation: stage.dropOffRate > 50
          ? '이탈률이 매우 높습니다. 랜딩페이지 속도, 디자인, CTA를 즉시 개선하세요.'
          : '랜딩페이지 A/B 테스트를 통해 전환율을 지속적으로 개선하세요.'
      },
      2: {
        insight: '사용자가 제품/서비스에 관심을 보이는 단계입니다.',
        recommendation: stage.dropOffRate > 40
          ? '제품 페이지의 정보 품질과 이미지를 개선하고, 리뷰를 강화하세요.'
          : '추천 시스템과 개인화를 통해 관심을 구매로 전환하세요.'
      },
      3: {
        insight: '결제를 시작한 단계입니다.',
        recommendation: stage.dropOffRate > 30
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
      <div className="kpi-summary-grid" id="kpiSummaryGrid">
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
      <div style={{ marginBottom: '24px' }}>
        {/* 접기/펼치기 헤더 */}
        <div
          onClick={() => setDecisionToolExpanded(!decisionToolExpanded)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '20px 24px',
            background: 'white',
            borderRadius: decisionToolExpanded ? '12px 12px 0 0' : '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: 600, color: '#212121' }}>
            <span>🔬</span>
            <span>데이터 기반 의사결정 도구 (핵심 요약, 긴급 개선, 채널 분석, 예산, CRM 가이드)</span>
          </div>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#ede7f6',
            color: '#673ab7',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
          }}>
            <span>{decisionToolExpanded ? '접기' : '펼치기'}</span>
            <span style={{ transform: decisionToolExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>▼</span>
          </button>
        </div>

        {/* 접기/펼치기 콘텐츠 */}
        <div style={{
          maxHeight: decisionToolExpanded ? '10000px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.4s ease, opacity 0.3s ease',
          opacity: decisionToolExpanded ? 1 : 0,
          background: 'white',
          borderRadius: '0 0 12px 12px',
          boxShadow: decisionToolExpanded ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
        }}>
          <div style={{ padding: '24px' }}>
            {/* 기간 필터 버튼 */}
            <div style={{
              marginBottom: '12px',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              borderRadius: '10px',
              border: '1px solid #dee2e6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#495057' }}>📅 분석 기간:</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['full', '180d', '90d', '30d'].map(period => (
                    <button
                      key={period}
                      onClick={() => switchPeriod(period)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '11px',
                        fontWeight: 600,
                        border: currentPeriod === period ? '1px solid #673ab7' : '1px solid #dee2e6',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: currentPeriod === period ? '#673ab7' : 'white',
                        color: currentPeriod === period ? 'white' : '#495057'
                      }}
                    >
                      {period === 'full' ? '전체 기간' : `최근 ${period}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 탭 버튼 */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { key: 'summary', label: '📊 핵심 요약' },
                { key: 'urgent', label: `🚨 긴급 개선 (${urgentAlertsData.high.length + urgentAlertsData.medium.length})` },
                { key: 'clustering', label: '채널 그룹별 분석' },
                { key: 'budget', label: '예산 투자 가이드' },
                { key: 'crm_guide', label: 'CRM 가이드' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setDecisionToolTab(tab.key)}
                  style={{
                    padding: '10px 24px',
                    border: 'none',
                    background: decisionToolTab === tab.key ? '#673ab7' : 'white',
                    color: decisionToolTab === tab.key ? 'white' : '#616161',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '14px',
                    boxShadow: decisionToolTab === tab.key ? '0 4px 12px rgba(103, 58, 183, 0.4)' : '0 1px 3px rgba(0,0,0,0.08)'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 탭 1: 핵심 요약 */}
            {decisionToolTab === 'summary' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {keyInsights.length > 0 ? keyInsights.map((insight, index) => {
                  const typeStyles: Record<string, { bg: string; border: string }> = {
                    positive: { bg: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)', border: '#4caf50' },
                    negative: { bg: 'linear-gradient(135deg, #ffebee 0%, #fce4ec 100%)', border: '#f44336' },
                    neutral: { bg: 'linear-gradient(135deg, #fff8e1 0%, #fff3e0 100%)', border: '#ff9800' },
                    opportunity: { bg: 'linear-gradient(135deg, #e3f2fd 0%, #e1f5fe 100%)', border: '#2196f3' }
                  };
                  const style = typeStyles[insight.type] || typeStyles.neutral;

                  return (
                    <div key={index} style={{
                      padding: '18px 20px',
                      background: style.bg,
                      borderRadius: '12px',
                      borderLeft: `4px solid ${style.border}`
                    }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>{insight.title}</h4>
                      <p style={{ fontSize: '13px', color: '#616161', margin: 0 }}>{insight.description}</p>
                      {insight.action && (
                        <div style={{ marginTop: '12px', fontSize: '12px', color: '#673ab7', fontWeight: 600 }}>
                          💡 {insight.action.text}
                        </div>
                      )}
                    </div>
                  );
                }) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#9e9e9e' }}>데이터를 불러오는 중...</div>
                )}
              </div>
            )}

            {/* 탭 2: 긴급 개선 포인트 */}
            {decisionToolTab === 'urgent' && (
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <button
                    onClick={() => setUrgentAlertTab('high')}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      background: urgentAlertTab === 'high' ? '#673ab7' : 'white',
                      color: urgentAlertTab === 'high' ? 'white' : '#616161',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                    }}
                  >
                    ⚠️ 즉시 조치 필요 ({urgentAlertsData.high.length})
                  </button>
                  <button
                    onClick={() => setUrgentAlertTab('medium')}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      background: urgentAlertTab === 'medium' ? '#673ab7' : 'white',
                      color: urgentAlertTab === 'medium' ? 'white' : '#616161',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                    }}
                  >
                    📌 개선 권장 ({urgentAlertsData.medium.length})
                  </button>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {(urgentAlertTab === 'high' ? urgentAlertsData.high : urgentAlertsData.medium)
                    .slice(0, urgentAlertsShowAll[urgentAlertTab] ? undefined : 3)
                    .map((alert, index) => (
                      <div key={index} style={{
                        padding: '16px',
                        background: alert.severity === 'high' ? 'linear-gradient(135deg, #ffebee 0%, #fce4ec 100%)' : 'linear-gradient(135deg, #fff3e0 0%, #fff8e1 100%)',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${alert.severity === 'high' ? '#f44336' : '#ff9800'}`
                      }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>{alert.title}</div>
                        <div style={{ fontSize: '13px', color: '#616161', marginBottom: '8px' }}>{alert.diagnosis}</div>
                        {alert.action_detail && (
                          <div style={{ padding: '12px', background: 'white', borderRadius: '6px', fontSize: '12px' }}>
                            💡 {(alert.action_detail as Record<string, string>).primary || '데이터 분석 후 대응'}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
                {/* 더보기/접기 버튼 */}
                {(urgentAlertTab === 'high' ? urgentAlertsData.high : urgentAlertsData.medium).length > 3 && (
                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <button
                      onClick={() => setUrgentAlertsShowAll(prev => ({ ...prev, [urgentAlertTab]: !prev[urgentAlertTab] }))}
                      style={{
                        padding: '8px 20px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        background: '#f5f5f5',
                        color: '#616161'
                      }}
                    >
                      {urgentAlertsShowAll[urgentAlertTab] ? '접기 ▲' : '더 보기 ▼'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 탭 3: 채널 그룹별 분석 */}
            {decisionToolTab === 'clustering' && channelClusters && (
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
                  채널 클러스터링 ({channelClusters.n_clusters}개 그룹)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  {Object.entries(channelClusters.clusters).map(([clusterName, channels], index) => {
                    const colors = ['#4caf50', '#ff9800', '#f44336'];
                    const bgColors = ['#e8f5e9', '#fff3e0', '#ffebee'];
                    return (
                      <div key={clusterName} style={{
                        padding: '16px',
                        background: bgColors[index % 3],
                        borderRadius: '8px',
                        borderLeft: `4px solid ${colors[index % 3]}`
                      }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                          {channelClusters.description[clusterName] || clusterName}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {channels.map(ch => (
                            <span key={ch} style={{
                              padding: '4px 8px',
                              background: 'white',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}>{ch}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* BCG Matrix */}
                {bcgMatrix && (
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>BCG 매트릭스 채널 전략</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      {Object.entries(bcgMatrix).map(([key, quadrant]) => (
                        <div key={key} style={{
                          padding: '16px',
                          borderRadius: '8px',
                          background: key === 'star' ? '#e8f5e9' : key === 'question_mark' ? '#fff3e0' : key === 'cash_cow' ? '#e3f2fd' : '#f5f5f5',
                          borderLeft: `4px solid ${quadrant.color}`
                        }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: quadrant.color }}>
                            {quadrant.description}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {quadrant.channels.map(ch => (
                              <span key={ch} style={{
                                padding: '4px 8px',
                                background: 'white',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}>{ch}</span>
                            ))}
                            {quadrant.channels.length === 0 && (
                              <span style={{ color: '#9e9e9e', fontSize: '12px' }}>해당 채널 없음</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 탭 4: 예산 투자 가이드 */}
            {decisionToolTab === 'budget' && (
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>예산 투자 가이드</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
            {investmentGuide.slice(0, investmentExpanded ? undefined : 3).map((channel, index) => {
              const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}위`;
              const bgColor = channel.confidenceScore >= 3 ? 'linear-gradient(135deg, #e8f5e9 0%, #f0fff4 100%)' :
                channel.confidenceScore === 2 ? 'linear-gradient(135deg, #fff3e0 0%, #fff9e6 100%)' : '#fafafa';
              const borderColor = channel.confidenceScore >= 3 ? '#4caf50' :
                channel.confidenceScore === 2 ? '#ff9800' : '#e0e0e0';

              return (
                <div key={channel.channel} style={{
                  padding: '16px',
                  background: bgColor,
                  borderRadius: '8px',
                  borderLeft: `4px solid ${borderColor}`
                }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
                    {rankEmoji} {channel.channel}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ padding: '8px', background: 'white', borderRadius: '6px' }}>
                      <div style={{ fontSize: '11px', color: '#757575' }}>전환율</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#673ab7' }}>{formatDecimal(channel.cvr)}%</div>
                    </div>
                    <div style={{ padding: '8px', background: 'white', borderRadius: '6px' }}>
                      <div style={{ fontSize: '11px', color: '#757575' }}>평균 객단가</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#4caf50' }}>{formatNumber(Math.round(channel.arpu))}원</div>
                    </div>
                    <div style={{ padding: '8px', background: 'white', borderRadius: '6px' }}>
                      <div style={{ fontSize: '11px', color: '#757575' }}>데이터 신뢰도</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: borderColor }}>{channel.confidence}</div>
                    </div>
                  </div>
                  {channel.isInvestable && channel.confidenceScore >= 2 && (
                    <div style={{ padding: '14px', background: 'white', borderRadius: '8px', borderLeft: '3px solid #673ab7' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>
                        💰 100만원 투자 시 예상 성과
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: '#757575' }}>예상 유입</div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#2196f3' }}>약 {formatNumber(Math.round(channel.estimatedVisitors))}명</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#757575' }}>예상 구매</div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#673ab7' }}>약 {formatNumber(Math.round(channel.expectedPurchases))}건</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#757575' }}>예상 ROI</div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: channel.roi > 0 ? '#4caf50' : '#f44336' }}>
                            {channel.roi > 0 ? '+' : ''}{formatDecimal(channel.roi)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {investmentGuide.length > 3 && (
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                onClick={() => setInvestmentExpanded(!investmentExpanded)}
                style={{
                  padding: '8px 24px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '20px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#616161'
                }}
              >
                {investmentExpanded ? '접기' : `더 보기 (${investmentGuide.length - 3}개)`}
              </button>
            </div>
          )}
              </div>
            )}

            {/* 탭 5: CRM 가이드 */}
            {decisionToolTab === 'crm_guide' && crmActions.length > 0 && (
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>CRM 액션 가이드</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {crmActions.map((action, index) => {
                    const priorityColors: Record<string, { border: string; bg: string }> = {
                      'high': { border: '#ef5350', bg: '#ffebee' },
                      'medium': { border: '#ffa726', bg: '#fff3e0' },
                      'low': { border: '#66bb6a', bg: '#e8f5e9' }
                    };
                    const colors = priorityColors[action.priority] || priorityColors.medium;

                    return (
                      <div key={index} style={{
                        padding: '16px',
                        background: colors.bg,
                        borderRadius: '8px',
                        borderLeft: `4px solid ${colors.border}`
                      }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>
                          📍 {action.stage}
                        </div>
                        <div style={{ fontSize: '13px', color: '#616161', marginBottom: '6px' }}>
                          <strong>현황:</strong> {action.trend}
                        </div>
                        <div style={{ fontSize: '13px', color: '#757575', marginBottom: '10px', fontStyle: 'italic' }}>
                          <strong>진단:</strong> {action.diagnosis}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          padding: '12px',
                          background: 'white',
                          borderRadius: '6px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                          💊 <strong>처방:</strong> {action.prescription}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. 최근 변화 인사이트 (접기/펼치기) */}
      <div style={{ marginBottom: '24px' }}>
        {/* 접기/펼치기 헤더 */}
        <div
          onClick={() => setTrendInsightExpanded(!trendInsightExpanded)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '20px 24px',
            background: 'white',
            borderRadius: trendInsightExpanded ? '12px 12px 0 0' : '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: 600, color: '#212121' }}>
            <span>📈</span>
            <span>최근 변화 인사이트</span>
          </div>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#ede7f6',
            color: '#673ab7',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
          }}>
            <span>{trendInsightExpanded ? '접기' : '펼치기'}</span>
            <span style={{ transform: trendInsightExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>▼</span>
          </button>
        </div>

        {/* 접기/펼치기 콘텐츠 */}
        <div style={{
          maxHeight: trendInsightExpanded ? '10000px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.4s ease, opacity 0.3s ease',
          opacity: trendInsightExpanded ? 1 : 0,
          background: 'white',
          borderRadius: '0 0 12px 12px',
          boxShadow: trendInsightExpanded ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
        }}>
          <div style={{ padding: '24px' }}>
            {/* 기간 비교 선택 */}
            <div style={{
              marginBottom: '16px',
              padding: '14px 18px',
              background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
              borderRadius: '10px',
              border: '1px solid #bbdefb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '16px' }}>📊</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1565c0' }}>비교 기간:</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['30d', '14d', '7d'].map(period => (
                    <button
                      key={period}
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
                      {period.replace('d', '일')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2열 그리드 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 0,
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              {/* 성과 개선 분석 */}
              <div style={{ padding: '24px', borderRight: '1px solid #e0e0e0', background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #4caf50' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #66bb6a 0%, #4caf50 100%)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '14px', filter: 'brightness(10)' }}>✨</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#2e7d32' }}>좋은 소식: 어떤 부분이 좋아졌나요?</span>
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {performanceTrends.improvements.length > 0 ? (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {performanceTrends.improvements.map((item, index) => (
                        <div key={index} style={{
                          padding: '12px',
                          background: '#e8f5e9',
                          borderRadius: '8px',
                          borderLeft: '3px solid #4caf50'
                        }}>
                          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{item.metric}</div>
                          <div style={{ color: '#4caf50', fontWeight: 700 }}>+{formatDecimal(item.change_pct)}%</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#9e9e9e' }}>개선 데이터 없음</div>
                  )}
                </div>
              </div>

              {/* 성과 하락 경고 */}
              <div style={{ padding: '24px', background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #ef5350' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #ef5350 0%, #f44336 100%)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '14px', filter: 'brightness(10)' }}>⚠️</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#c62828' }}>주의 필요: 성과 하락 감지</span>
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {performanceTrends.declines.length > 0 ? (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {performanceTrends.declines.map((item, index) => (
                        <div key={index} style={{
                          padding: '12px',
                          background: item.risk_level === 'high' ? '#ffebee' : '#fff3e0',
                          borderRadius: '8px',
                          borderLeft: `3px solid ${item.risk_level === 'high' ? '#f44336' : '#ff9800'}`
                        }}>
                          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{item.metric}</div>
                          <div style={{ color: item.risk_level === 'high' ? '#f44336' : '#ff9800', fontWeight: 700 }}>
                            {formatDecimal(item.change_pct)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#9e9e9e' }}>하락 데이터 없음</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. 유형별 조치 가이드 (독립 섹션) */}
      <div style={{ marginBottom: '24px' }}>
        {/* 접기/펼치기 헤더 */}
        <div
          onClick={() => setMicroSegmentSectionExpanded(!microSegmentSectionExpanded)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '20px 24px',
            background: 'white',
            borderRadius: microSegmentSectionExpanded ? '12px 12px 0 0' : '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: 600, color: '#212121' }}>
            <span>🎯</span>
            <span>유형별 조치 가이드 (SA, DA, PR, CRM, etc)</span>
          </div>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#ede7f6',
            color: '#673ab7',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
          }}>
            <span>{microSegmentSectionExpanded ? '접기' : '펼치기'}</span>
            <span style={{ transform: microSegmentSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>▼</span>
          </button>
        </div>

        {/* 접기/펼치기 콘텐츠 */}
        <div style={{
          maxHeight: microSegmentSectionExpanded ? '10000px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.4s ease, opacity 0.3s ease',
          opacity: microSegmentSectionExpanded ? 1 : 0,
          background: 'white',
          borderRadius: '0 0 12px 12px',
          boxShadow: microSegmentSectionExpanded ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
        }}>
          <div style={{ padding: '24px' }}>
            <div style={{ fontSize: '13px', color: '#757575', marginBottom: '16px' }}>
              채널 카테고리(SA, DA, SNS 등)별로 <strong>맞춤 처방</strong>과 <strong>조치 가이드</strong>를 제공합니다. 카테고리를 선택하면 해당 유형의 문제점과 개선 방안을 확인할 수 있습니다.
            </div>

            {/* 기간 필터 */}
            <div style={{
              marginBottom: '12px',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              borderRadius: '10px',
              border: '1px solid #dee2e6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#495057' }}>📅 분석 기간:</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['full', '180d', '90d', '30d'].map(period => (
                    <button
                      key={period}
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
                      {period === 'full' ? '전체 기간' : `최근 ${period}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 카테고리 필터 */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#757575' }}>카테고리:</span>
              {['all', 'SA', 'DA', 'SNS', 'CRM', 'PR', 'Organic', 'etc'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCurrentMicroCategoryFilter(cat)}
                  style={{
                    padding: '5px 10px',
                    fontSize: '11px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: currentMicroCategoryFilter === cat ? '#673ab7' : '#f5f5f5',
                    color: currentMicroCategoryFilter === cat ? 'white' : '#616161'
                  }}
                >
                  {cat === 'all' ? '전체' : cat === 'etc' ? '기타' : cat}
                </button>
              ))}
            </div>

            {/* 문제점/기회 탭 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={() => setMicroSegmentTab('problem')}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  background: microSegmentTab === 'problem' ? '#673ab7' : 'white',
                  color: microSegmentTab === 'problem' ? 'white' : '#616161',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                }}
              >
                🚧 문제점 ({microSegmentData.problems.length})
              </button>
              <button
                onClick={() => setMicroSegmentTab('opportunity')}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  background: microSegmentTab === 'opportunity' ? '#673ab7' : 'white',
                  color: microSegmentTab === 'opportunity' ? 'white' : '#616161',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                }}
              >
                🚀 기회 ({microSegmentData.opportunities.length})
              </button>
            </div>

            {/* 문제점 카드 */}
            {microSegmentTab === 'problem' && (
              <div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {microSegmentData.problems
                    .filter(item => currentMicroCategoryFilter === 'all' || item.category === currentMicroCategoryFilter)
                    .slice(0, microSegmentShowAll.problem ? undefined : 5)
                    .map((item, index) => (
                      <div key={index} style={{
                        padding: '16px',
                        background: 'linear-gradient(135deg, #ffebee 0%, #fce4ec 100%)',
                        borderRadius: '8px',
                        borderLeft: '4px solid #f44336'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', padding: '2px 8px', background: '#f44336', color: 'white', borderRadius: '4px' }}>{item.category}</span>
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>{item.channel}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#616161', marginBottom: '8px' }}>{item.issue}</div>
                        {item.recommendation && (
                          <div style={{ padding: '10px', background: 'white', borderRadius: '6px', fontSize: '12px' }}>
                            💡 {item.recommendation}
                          </div>
                        )}
                      </div>
                    ))}
                  {microSegmentData.problems.filter(item => currentMicroCategoryFilter === 'all' || item.category === currentMicroCategoryFilter).length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#9e9e9e' }}>해당 카테고리에 문제점이 없습니다.</div>
                  )}
                </div>
                {/* 더보기/접기 버튼 */}
                {microSegmentData.problems.filter(item => currentMicroCategoryFilter === 'all' || item.category === currentMicroCategoryFilter).length > 5 && (
                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <button
                      onClick={() => setMicroSegmentShowAll(prev => ({ ...prev, problem: !prev.problem }))}
                      style={{
                        padding: '8px 20px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        background: '#f5f5f5',
                        color: '#616161'
                      }}
                    >
                      {microSegmentShowAll.problem ? '접기 ▲' : '더 보기 ▼'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 기회 카드 */}
            {microSegmentTab === 'opportunity' && (
              <div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {microSegmentData.opportunities
                    .filter(item => currentMicroCategoryFilter === 'all' || item.category === currentMicroCategoryFilter)
                    .slice(0, microSegmentShowAll.opportunity ? undefined : 5)
                    .map((item, index) => (
                      <div key={index} style={{
                        padding: '16px',
                        background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)',
                        borderRadius: '8px',
                        borderLeft: '4px solid #4caf50'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', padding: '2px 8px', background: '#4caf50', color: 'white', borderRadius: '4px' }}>{item.category}</span>
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>{item.channel}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#616161', marginBottom: '8px' }}>{item.opportunity}</div>
                        {item.action && (
                          <div style={{ padding: '10px', background: 'white', borderRadius: '6px', fontSize: '12px' }}>
                            🎯 {item.action}
                          </div>
                        )}
                      </div>
                    ))}
                  {microSegmentData.opportunities.filter(item => currentMicroCategoryFilter === 'all' || item.category === currentMicroCategoryFilter).length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#9e9e9e' }}>해당 카테고리에 기회가 없습니다.</div>
                  )}
                </div>
                {/* 더보기/접기 버튼 */}
                {microSegmentData.opportunities.filter(item => currentMicroCategoryFilter === 'all' || item.category === currentMicroCategoryFilter).length > 5 && (
                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <button
                      onClick={() => setMicroSegmentShowAll(prev => ({ ...prev, opportunity: !prev.opportunity }))}
                      style={{
                        padding: '8px 20px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        background: '#f5f5f5',
                        color: '#616161'
                      }}
                    >
                      {microSegmentShowAll.opportunity ? '접기 ▲' : '더 보기 ▼'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. 채널별 분석 (접기 가능) */}
      <div style={{ marginBottom: '24px' }}>
        {/* 접기/펼치기 헤더 */}
        <div
          onClick={() => setChannelAnalysisExpanded(!channelAnalysisExpanded)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '20px 24px',
            background: 'white',
            borderRadius: channelAnalysisExpanded ? '12px 12px 0 0' : '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: 600, color: '#212121' }}>
            <span>📊</span>
            <span>유입 채널별 상세 분석 (네이버, 구글, 인스타그램 등)</span>
          </div>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#ede7f6',
            color: '#673ab7',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
          }}>
            <span>{channelAnalysisExpanded ? '접기' : '펼치기'}</span>
            <span style={{ transform: channelAnalysisExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>▼</span>
          </button>
        </div>

        {/* 접기/펼치기 콘텐츠 */}
        <div style={{
          maxHeight: channelAnalysisExpanded ? '20000px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.4s ease, opacity 0.3s ease',
          opacity: channelAnalysisExpanded ? 1 : 0,
          background: 'white',
          borderRadius: '0 0 12px 12px',
          boxShadow: channelAnalysisExpanded ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
        }}>
          <div style={{ padding: '24px' }}>
            {/* 탭 버튼 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {[
                { key: 'table', label: '채널별 고객 흐름' },
                { key: 'kpi', label: '지표별 비교' },
                { key: 'churn', label: '이탈률 분석' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setChannelAnalysisTab(tab.key)}
                  style={{
                    padding: '10px 24px',
                    border: 'none',
                    background: channelAnalysisTab === tab.key ? '#673ab7' : 'white',
                    color: channelAnalysisTab === tab.key ? 'white' : '#616161',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '14px',
                    boxShadow: channelAnalysisTab === tab.key ? '0 4px 12px rgba(103, 58, 183, 0.4)' : '0 1px 3px rgba(0,0,0,0.08)'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 탭 1: 채널별 고객 흐름 테이블 */}
            {channelAnalysisTab === 'table' && channelData.length > 0 && (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>📊 채널별 고객 흐름: 각 채널에서 얼마나 많은 고객이 구매까지 도달하나요?</div>
                  <div style={{ fontSize: '13px', color: '#757575', lineHeight: 1.7 }}>
                    <strong style={{ color: '#673ab7' }}>📖 이 표는 무엇을 보여주나요?</strong><br />
                    각 마케팅 채널에서 고객이 <strong>5단계 여정</strong>을 어떻게 거치는지 보여줍니다.
                    <strong style={{ color: '#673ab7', marginLeft: '8px' }}>💡 열 제목을 클릭하면 정렬됩니다.</strong>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5' }}>
                        {[
                          { key: 'Channel', label: '채널', align: 'left' },
                          { key: '유입', label: '유입', align: 'right' },
                          { key: '활동', label: '활동', align: 'right' },
                          { key: '관심', label: '관심', align: 'right' },
                          { key: '결제진행', label: '결제진행', align: 'right' },
                          { key: '구매완료', label: '구매완료', align: 'right' },
                          { key: 'Revenue', label: '매출', align: 'right' },
                          { key: 'CVR', label: 'CVR', align: 'right' }
                        ].map(col => (
                          <th
                            key={col.key}
                            onClick={() => handleTableSort(col.key)}
                            style={{
                              padding: '14px 16px',
                              textAlign: col.align as 'left' | 'right',
                              fontWeight: 600,
                              cursor: 'pointer',
                              userSelect: 'none',
                              background: channelTableSort.column === col.key ? '#e8e8e8' : '#f5f5f5',
                              transition: 'background 0.2s'
                            }}
                          >
                            {col.label}
                            {channelTableSort.column === col.key && (
                              <span style={{ marginLeft: '4px', fontSize: '10px' }}>
                                {channelTableSort.direction === 'desc' ? '▼' : '▲'}
                              </span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedChannelData.slice(0, 10).map((row, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                          <td style={{ padding: '14px 16px', fontWeight: 500 }}>{row['Channel']}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>{formatNumber(row['유입'])}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>{formatNumber(row['활동'])}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>{formatNumber(row['관심'])}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>{formatNumber(row['결제진행'])}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>{formatNumber(row['구매완료'])}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>{formatNumber(row['Revenue'])}원</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right', color: '#673ab7', fontWeight: 600 }}>
                            {formatDecimal((parseFloat(String(row['구매완료'])) / parseFloat(String(row['유입']))) * 100)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 탭 2: 지표별 비교 */}
            {channelAnalysisTab === 'kpi' && channelCompareData && (
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>채널별 종합 성과 비교</h3>
                <div style={{ height: '400px' }}>
                  <Bar
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
                      plugins: {
                        legend: { display: true, position: 'top' },
                        datalabels: { display: false }
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
              </div>
            )}

            {/* 탭 3: 이탈률 분석 */}
            {channelAnalysisTab === 'churn' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>채널별 이탈률 분석</h3>
                </div>

                {/* 퍼널 단계 선택 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#616161' }}>📊 퍼널 단계:</span>
                  {[
                    { key: 'activation', label: '유입→활동' },
                    { key: 'consideration', label: '활동→관심' },
                    { key: 'conversion', label: '관심→결제' },
                    { key: 'purchase', label: '결제→구매' },
                    { key: 'avg', label: '평균 이탈률' }
                  ].map(stage => (
                    <button
                      key={stage.key}
                      onClick={() => setCurrentChurnStage(stage.key)}
                      style={{
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        background: currentChurnStage === stage.key ? '#673ab7' : '#f5f5f5',
                        color: currentChurnStage === stage.key ? 'white' : '#616161'
                      }}
                    >
                      {stage.label}
                    </button>
                  ))}
                </div>

                {/* 정렬 선택 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#616161' }}>🔢 정렬:</span>
                  {[
                    { key: 'desc', label: '📉 높은순' },
                    { key: 'asc', label: '📈 낮은순' }
                  ].map(sort => (
                    <button
                      key={sort.key}
                      onClick={() => setCurrentChurnSort(sort.key)}
                      style={{
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        background: currentChurnSort === sort.key ? '#673ab7' : '#f5f5f5',
                        color: currentChurnSort === sort.key ? 'white' : '#616161'
                      }}
                    >
                      {sort.label}
                    </button>
                  ))}
                </div>

                {channelChurnData.config && (
                  <div style={{ height: '400px' }}>
                    <Bar
                      data={{
                        labels: channelChurnData.labels,
                        datasets: [{
                          label: channelChurnData.config.label,
                          data: channelChurnData.values,
                          backgroundColor: (() => {
                            const hex = channelChurnData.config!.color;
                            const r = parseInt(hex.slice(1, 3), 16);
                            const g = parseInt(hex.slice(3, 5), 16);
                            const b = parseInt(hex.slice(5, 7), 16);
                            return `rgba(${r}, ${g}, ${b}, 0.8)`;
                          })(),
                          borderColor: channelChurnData.config.color,
                          borderWidth: 1
                        }]
                      }}
                      options={{
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          datalabels: { display: false }
                        },
                        scales: {
                          x: {
                            beginAtZero: true,
                            title: { display: true, text: channelChurnData.config.label }
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. 신규 vs 재방문 및 이탈 분석 (접기 가능) */}
      <div style={{ marginBottom: '24px' }}>
        {/* 접기/펼치기 헤더 */}
        <div
          onClick={() => setCustomerAnalysisExpanded(!customerAnalysisExpanded)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '20px 24px',
            background: 'white',
            borderRadius: customerAnalysisExpanded ? '12px 12px 0 0' : '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: 600, color: '#212121' }}>
            <span>👥</span>
            <span>신규 vs 재방문 고객 분석</span>
          </div>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#ede7f6',
            color: '#673ab7',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
          }}>
            <span>{customerAnalysisExpanded ? '접기' : '펼치기'}</span>
            <span style={{ transform: customerAnalysisExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>▼</span>
          </button>
        </div>

        {/* 접기/펼치기 콘텐츠 */}
        <div style={{
          maxHeight: customerAnalysisExpanded ? '10000px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.4s ease, opacity 0.3s ease',
          opacity: customerAnalysisExpanded ? 1 : 0,
          background: 'white',
          borderRadius: '0 0 12px 12px',
          boxShadow: customerAnalysisExpanded ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
        }}>
          <div style={{ padding: '24px' }}>
            <div style={{ fontSize: '13px', color: '#757575', marginBottom: '16px' }}>
              신규 방문자와 재방문 고객의 비율 추세를 분석합니다. 건강한 비즈니스는 적절한 신규 유입과 높은 재방문율을 유지합니다.
            </div>

            {/* 기간 선택 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {['daily', 'weekly', 'monthly'].map(view => (
                <button
                  key={view}
                  onClick={() => setNewVsReturningView(view)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    background: newVsReturningView === view ? '#673ab7' : 'white',
                    color: newVsReturningView === view ? 'white' : '#616161',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                  }}
                >
                  {view === 'daily' ? '일별' : view === 'weekly' ? '주별' : '월별'}
                </button>
              ))}
            </div>

            {/* 차트 */}
            {customerTrendData && (
              <div style={{ height: '350px' }}>
                <Line
                  data={customerTrendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                      legend: { display: true, position: 'top' },
                      datalabels: { display: false }
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Insights */}
      {keyInsights.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 14px 0 rgba(32, 40, 45, 0.08)',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '4px', height: '20px', background: '#ffab00', borderRadius: '2px' }}></span>
            핵심 인사이트
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {keyInsights.map((insight, index) => {
              const typeStyles: Record<string, { bg: string; border: string }> = {
                positive: { bg: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)', border: '#4caf50' },
                negative: { bg: 'linear-gradient(135deg, #ffebee 0%, #fce4ec 100%)', border: '#f44336' },
                neutral: { bg: 'linear-gradient(135deg, #fff8e1 0%, #fff3e0 100%)', border: '#ff9800' },
                opportunity: { bg: 'linear-gradient(135deg, #e3f2fd 0%, #e1f5fe 100%)', border: '#2196f3' }
              };
              const style = typeStyles[insight.type] || typeStyles.neutral;

              return (
                <div key={index} style={{
                  padding: '18px 20px',
                  background: style.bg,
                  borderRadius: '12px',
                  borderLeft: `4px solid ${style.border}`
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>{insight.title}</h4>
                  <p style={{ fontSize: '13px', color: '#616161', margin: 0 }}>{insight.description}</p>
                  {insight.action && (
                    <div style={{ marginTop: '12px', fontSize: '12px', color: '#673ab7', fontWeight: 600 }}>
                      💡 {insight.action.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
