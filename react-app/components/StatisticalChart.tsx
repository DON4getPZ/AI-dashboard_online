/**
 * 통계 분석 차트 - 정규분포 분석
 */

'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import Papa from 'papaparse';

const DATA_BASE_URL = process.env.NEXT_PUBLIC_DATA_URL || 
  'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/data';

interface Statistics {
  [key: string]: {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
    q25: number;
    q75: number;
    skewness: number;
    kurtosis: number;
    outliers: string[];
    grade_thresholds: {
      high: number;
      low: number;
    };
  };
}

interface DailyStats {
  '일 구분': string;
  비용: number;
  클릭: number;
  전환수: number;
  전환값: number;
  ctr: number;
  cpc: number;
  cpa: number;
  cvr: number;
  roas: number;
  [key: string]: any;
}

export default function StatisticalChart() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [dailyData, setDailyData] = useState<DailyStats[]>([]);
  const [selectedMetric, setSelectedMetric] = useState('비용');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // 통계 데이터 로드
        const statsUrl = `${DATA_BASE_URL}/statistics/statistics.json`;
        const statsResponse = await fetch(statsUrl, { cache: 'force-cache' });
        const statsData = await statsResponse.json();
        setStatistics(statsData);

        // 일별 통계 데이터 로드
        const dailyUrl = `${DATA_BASE_URL}/statistics/daily_statistics.csv`;
        const dailyResponse = await fetch(dailyUrl, { cache: 'force-cache' });
        const csvText = await dailyResponse.text();

        Papa.parse<DailyStats>(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            setDailyData(results.data);
            setLoading(false);
          },
        });
      } catch (error) {
        console.error('통계 데이터 로드 실패:', error);
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading || !statistics) {
    return <div className="text-center py-8">데이터 로딩 중...</div>;
  }

  const metricStats = statistics[selectedMetric];
  
  if (!metricStats) {
    return <div className="text-center py-8">통계 데이터를 찾을 수 없습니다.</div>;
  }

  const chartData = dailyData.map(row => ({
    date: row['일 구분'],
    value: row[selectedMetric],
    mean: metricStats.mean,
    upperBand: metricStats.mean + metricStats.std,
    lowerBand: metricStats.mean - metricStats.std,
    zscore: row[`${selectedMetric}_zscore`],
    grade: row[`${selectedMetric}_grade`],
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">통계 분석 - 정규분포</h2>
          <p className="text-sm text-gray-600 mt-1">
            평균, 표준편차 및 성과 등급 분석
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            분석 지표
          </label>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2"
          >
            <option value="비용">광고비</option>
            <option value="클릭">클릭수</option>
            <option value="전환수">전환수</option>
            <option value="전환값">전환액</option>
            <option value="roas">ROAS</option>
          </select>
        </div>
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">평균</p>
          <p className="text-xl font-bold">{Math.round(metricStats.mean).toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">중앙값</p>
          <p className="text-xl font-bold">{Math.round(metricStats.median).toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">표준편차</p>
          <p className="text-xl font-bold">{Math.round(metricStats.std).toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">최소값</p>
          <p className="text-xl font-bold">{Math.round(metricStats.min).toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">최대값</p>
          <p className="text-xl font-bold">{Math.round(metricStats.max).toLocaleString()}</p>
        </div>
      </div>

      {/* 차트 */}
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
          <YAxis tickFormatter={(value) => value.toLocaleString()} />
          <Tooltip
            formatter={(value: number) => value.toLocaleString()}
            labelFormatter={(label) => `날짜: ${label}`}
          />
          <Legend />

          <Area
            type="monotone"
            dataKey="upperBand"
            fill="#93c5fd"
            stroke="none"
            fillOpacity={0.2}
            name="상위 1σ"
          />
          <Area
            type="monotone"
            dataKey="lowerBand"
            fill="#93c5fd"
            stroke="none"
            fillOpacity={0.2}
            name="하위 1σ"
          />

          <ReferenceLine
            y={metricStats.mean}
            stroke="#3b82f6"
            strokeDasharray="5 5"
            label={{ value: '평균', position: 'right' }}
          />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#10b981"
            strokeWidth={2}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              
              if (Math.abs(payload.zscore) > 2.5) {
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill="#ef4444"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }
              
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill="#10b981"
                />
              );
            }}
            name={selectedMetric}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* 이상치 목록 */}
      {metricStats.outliers && metricStats.outliers.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            🚨 이상치 감지 (Z-Score 기준 2.5 이상)
          </h3>
          <div className="flex flex-wrap gap-2">
            {metricStats.outliers.map((date: string) => (
              <span
                key={date}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs"
              >
                {date}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 성과 등급 분포 */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          성과 등급 분포
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">상위 (High)</p>
            <p className="text-2xl font-bold text-green-600">
              {chartData.filter(d => d.grade === '상').length}일
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">중간 (Mid)</p>
            <p className="text-2xl font-bold text-yellow-600">
              {chartData.filter(d => d.grade === '중').length}일
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">하위 (Low)</p>
            <p className="text-2xl font-bold text-red-600">
              {chartData.filter(d => d.grade === '하').length}일
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
