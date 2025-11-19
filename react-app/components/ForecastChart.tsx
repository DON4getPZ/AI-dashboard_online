/**
 * 시계열 예측 차트 컴포넌트
 */

'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import Papa from 'papaparse';

const DATA_BASE_URL = process.env.NEXT_PUBLIC_DATA_URL || 
  'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/data';

interface ForecastData {
  '일 구분': string;
  비용_예측: number;
  노출_예측: number;
  클릭_예측: number;
  전환수_예측: number;
  전환값_예측: number;
  type: 'actual' | 'forecast';
}

export default function ForecastChart() {
  const [data, setData] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<'cost' | 'conversions' | 'revenue'>('cost');

useEffect(() => {
  async function loadForecast() {
    try {
      const url = `${DATA_BASE_URL}/forecast/predictions.csv`;  // 날짜 제거
      const response = await fetch(url, { cache: 'force-cache' });
      const csvText = await response.text();

        Papa.parse<ForecastData>(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            setData(results.data);
            setLoading(false);
          },
        });
      } catch (error) {
        console.error('예측 데이터 로드 실패:', error);
        setLoading(false);
      }
    }

    loadForecast();
  }, []);

  if (loading) {
    return <div className="text-center py-8">예측 데이터 로딩 중...</div>;
  }

  const actualData = data.filter((d) => d.type === 'actual');
  const forecastData = data.filter((d) => d.type === 'forecast');
  
  const today = actualData.length > 0 ? actualData[actualData.length - 1]['일 구분'] : '';

  const chartData = [...actualData, ...forecastData].map((d) => ({
    date: d['일 구분'],
    actual: d.type === 'actual' ? getMetricValue(d, metric) : null,
    forecast: d.type === 'forecast' ? getMetricValue(d, metric) : null,
    type: d.type,
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">시계열 예측</h2>
          <p className="text-sm text-gray-600">
            최근 30일 기반 향후 30일 예측
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            지표 선택
          </label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as typeof metric)}
            className="border border-gray-300 rounded-md px-4 py-2"
          >
            <option value="cost">광고비</option>
            <option value="conversions">전환수</option>
            <option value="revenue">전환액</option>
          </select>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
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
          
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#3b82f6"
            strokeWidth={2}
            name="실제"
            dot={{ r: 3 }}
          />
          
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="예측"
            dot={{ r: 3 }}
          />
          
          {today && (
            <ReferenceLine
              x={today}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ value: '오늘', position: 'top' }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">최근 30일 평균</p>
          <p className="text-xl font-bold">
            {calculateAverage(actualData.slice(-30), metric).toLocaleString()}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">향후 30일 예측</p>
          <p className="text-xl font-bold">
            {calculateAverage(forecastData, metric).toLocaleString()}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">변화율</p>
          <p className="text-xl font-bold">
            {calculateChange(actualData.slice(-30), forecastData, metric)}%
          </p>
        </div>
      </div>
    </div>
  );
}

function getMetricValue(
  data: ForecastData,
  metric: 'cost' | 'conversions' | 'revenue'
): number {
  if (metric === 'cost') return data.비용_예측;
  if (metric === 'conversions') return data.전환수_예측;
  return data.전환값_예측;
}

function calculateAverage(
  data: ForecastData[],
  metric: 'cost' | 'conversions' | 'revenue'
): number {
  if (data.length === 0) return 0;
  const sum = data.reduce((acc, d) => acc + getMetricValue(d, metric), 0);
  return Math.round(sum / data.length);
}

function calculateChange(
  actual: ForecastData[],
  forecast: ForecastData[],
  metric: 'cost' | 'conversions' | 'revenue'
): string {
  const actualAvg = calculateAverage(actual, metric);
  const forecastAvg = calculateAverage(forecast, metric);
  
  if (actualAvg === 0) return '0.0';
  
  const change = ((forecastAvg - actualAvg) / actualAvg) * 100;
  return change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
}
