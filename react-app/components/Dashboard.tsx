/**
 * 마케팅 성과 대시보드
 */

'use client';

import { useState, useMemo } from 'react';
import { useMarketingData, useMetaData } from '../hooks/useMarketingData';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, DollarSign, MousePointerClick, Target } from 'lucide-react';

type TimeGranularity = 'day' | 'week' | 'month';

interface MonthInfo {
  month: string;
  filename: string;
  rows: number;
  size_kb: number;
  date_range: {
    start: string;
    end: string;
  };
  metrics: {
    total_cost: number;
    total_impressions: number;
    total_clicks: number;
    total_conversions: number;
    total_revenue: number;
  };
}

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeGranularity>('day');
  const [selectedMonths, setSelectedMonths] = useState<string[]>(['2025-11', '2025-10']);
  
  const { meta, loading: metaLoading } = useMetaData();

  const sqlQuery = useMemo(() => {
    const dateColumn = timeRange === 'month' ? '"월 구분"' : 
                       timeRange === 'week' ? '"주 구분"' : '"일 구분"';
    
    return `
      SELECT 
        ${dateColumn} as period,
        SUM(비용) as cost,
        SUM(노출) as impressions,
        SUM(클릭) as clicks,
        SUM(전환수) as conversions,
        SUM(전환값) as revenue,
        ROUND(SUM(클릭)::FLOAT / NULLIF(SUM(노출), 0) * 100, 2) as ctr,
        ROUND(SUM(비용)::FLOAT / NULLIF(SUM(클릭), 0), 0) as cpc,
        ROUND(SUM(비용)::FLOAT / NULLIF(SUM(전환수), 0), 0) as cpa,
        ROUND(SUM(전환값)::FLOAT / NULLIF(SUM(비용), 0) * 100, 0) as roas
      FROM marketing_data
      GROUP BY ${dateColumn}
      ORDER BY ${dateColumn} DESC
      LIMIT 30
    `;
  }, [timeRange]);

  const { data, loading: dataLoading } = useMarketingData({
    months: selectedMonths,
    sql: sqlQuery,
  });

const campaignSQL = useMemo(() => {
  return `
    SELECT 
      캠페인,
      목표,
      SUM(비용) as cost,
      SUM(클릭) as clicks,
      SUM(전환수) as conversions,
      SUM(전환값) as revenue,
      ROUND(SUM(비용)::FLOAT / NULLIF(SUM(클릭), 0), 0) as cpc,
      ROUND(SUM(비용)::FLOAT / NULLIF(SUM(전환수), 0), 0) as cpa,
      ROUND(SUM(전환값)::FLOAT / NULLIF(SUM(비용), 0) * 100, 0) as roas
    FROM marketing_data
    WHERE 캠페인 IS NOT NULL AND 캠페인 != ''
    GROUP BY 캠페인, 목표
    ORDER BY SUM(비용) DESC
    LIMIT 10
  `;
}, []);

const { data: campaignData, loading: campaignLoading } = useMarketingData({
  months: selectedMonths,
  sql: campaignSQL,
});

  const loading = metaLoading || dataLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">데이터 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            마케팅 성과 대시보드
          </h1>
          <p className="text-gray-600">
            데이터 기반 그로스 마케팅 분석 · Growthmaker
          </p>
        </header>

        {meta && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <KPICard
              title="총 광고비"
              value={`₩${(meta.total_metrics.cost / 1000000).toFixed(1)}M`}
              icon={<DollarSign />}
              color="blue"
            />
            <KPICard
              title="총 클릭수"
              value={meta.total_metrics.clicks.toLocaleString()}
              icon={<MousePointerClick />}
              color="green"
            />
            <KPICard
              title="총 전환수"
              value={meta.total_metrics.conversions.toLocaleString()}
              icon={<Target />}
              color="purple"
            />
            <KPICard
              title="ROAS"
              value={`${meta.kpis.roas}%`}
              icon={<TrendingUp />}
              color="orange"
            />
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시간 단위
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeGranularity)}
                className="border border-gray-300 rounded-md px-4 py-2"
              >
                <option value="day">일별</option>
                <option value="week">주별</option>
                <option value="month">월별</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                기간 선택
              </label>
              <div className="flex gap-2">
                {meta?.months.slice(-6).reverse().map((m: MonthInfo) => (
                  <button
                    key={m.month}
                    onClick={() => {
                      setSelectedMonths((prev) =>
                        prev.includes(m.month)
                          ? prev.filter((x) => x !== m.month)
                          : [...prev, m.month]
                      );
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedMonths.includes(m.month)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {m.month}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">성과 트렌드</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(value: number) => value.toLocaleString()} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="cost"
                stroke="#3b82f6"
                name="광고비"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="conversions"
                stroke="#10b981"
                name="전환수"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">캠페인별 성과 (Top 10)</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={campaignData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="캠페인" type="category" width={200} />
              <Tooltip formatter={(value: number) => value.toLocaleString()} />
              <Legend />
              <Bar dataKey="cost" fill="#3b82f6" name="광고비" />
              <Bar dataKey="revenue" fill="#10b981" name="전환액" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors[color as keyof typeof colors]}`}>
          {icon}
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
