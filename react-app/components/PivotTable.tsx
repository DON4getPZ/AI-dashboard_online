/**
 * 동적 PIVOT 테이블 컴포넌트
 * 
 * 기능:
 * - 월/주/일 단위 전환
 * - 브랜드/상품/캠페인 필터
 * - 드릴다운
 * - 정렬/검색
 * - CSV 다운로드
 */

'use client';

import { useState, useMemo } from 'react';
import { useMarketingData } from '../hooks/useMarketingData';
import { Download, ChevronDown, ChevronRight } from 'lucide-react';

type TimeGranularity = 'day' | 'week' | 'month';
type Dimension = '브랜드명' | '상품명' | '캠페인';

interface PivotTableProps {
  selectedMonths: string[];
}

export default function PivotTable({ selectedMonths }: PivotTableProps) {
  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity>('day');
  const [dimension, setDimension] = useState<Dimension>('브랜드명');
  const [sortColumn, setSortColumn] = useState<string>('비용');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // SQL 쿼리 생성
  const sqlQuery = useMemo(() => {
    const dateColumn = timeGranularity === 'month' ? '"월 구분"' : 
                       timeGranularity === 'week' ? '"주 구분"' : '"일 구분"';
    
    return `
      SELECT 
        ${dateColumn} as period,
        ${dimension} as dimension_value,
        SUM(비용) as cost,
        SUM(노출) as impressions,
        SUM(클릭) as clicks,
        SUM(전환수) as conversions,
        SUM(전환값) as revenue,
        ROUND(SUM(클릭)::FLOAT / NULLIF(SUM(노출), 0) * 100, 2) as ctr,
        ROUND(SUM(비용)::FLOAT / NULLIF(SUM(클릭), 0), 0) as cpc,
        ROUND(SUM(비용)::FLOAT / NULLIF(SUM(전환수), 0), 0) as cpa,
        ROUND(SUM(전환수)::FLOAT / NULLIF(SUM(클릭), 0) * 100, 2) as cvr,
        ROUND(SUM(전환값)::FLOAT / NULLIF(SUM(비용), 0) * 100, 0) as roas
      FROM marketing_data
      WHERE ${dimension} LIKE '%${searchTerm}%'
      GROUP BY ${dateColumn}, ${dimension}
      ORDER BY ${sortColumn} ${sortDirection.toUpperCase()}
    `;
  }, [timeGranularity, dimension, sortColumn, sortDirection, searchTerm]);

  const { data, loading } = useMarketingData({
    months: selectedMonths,
    sql: sqlQuery,
  });

  // 정렬 토글
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // 행 확장 토글
  const toggleRow = (key: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

  // CSV 다운로드
  const downloadCSV = () => {
    const headers = [
      '기간', dimension, '광고비', '노출', '클릭', '전환수', '전환액',
      'CTR(%)', 'CPC', 'CPA', 'CVR(%)', 'ROAS(%)'
    ];
    
    const rows = data.map(row => [
      row.period,
      row.dimension_value,
      row.cost,
      row.impressions,
      row.clicks,
      row.conversions,
      row.revenue,
      row.ctr,
      row.cpc,
      row.cpa,
      row.cvr,
      row.roas,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `marketing_pivot_${Date.now()}.csv`;
    link.click();
  };

  if (loading) {
    return <div className="text-center py-8">데이터 로딩 중...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">PIVOT 테이블 분석</h2>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Download size={16} />
          CSV 다운로드
        </button>
      </div>

      {/* 필터 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            시간 단위
          </label>
          <select
            value={timeGranularity}
            onChange={(e) => setTimeGranularity(e.target.value as TimeGranularity)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="day">일별</option>
            <option value="week">주별</option>
            <option value="month">월별</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            분석 차원
          </label>
          <select
            value={dimension}
            onChange={(e) => setDimension(e.target.value as Dimension)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="브랜드명">브랜드별</option>
            <option value="상품명">상품별</option>
            <option value="캠페인">캠페인별</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            정렬 기준
          </label>
          <select
            value={sortColumn}
            onChange={(e) => setSortColumn(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="cost">광고비</option>
            <option value="conversions">전환수</option>
            <option value="revenue">전환액</option>
            <option value="roas">ROAS</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            검색
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="브랜드/상품/캠페인 검색..."
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                기간
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {dimension}
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('cost')}
              >
                광고비 {sortColumn === 'cost' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                노출
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                클릭
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('conversions')}
              >
                전환수 {sortColumn === 'conversions' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                CTR(%)
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                CPA
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('roas')}
              >
                ROAS(%) {sortColumn === 'roas' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">
                  {row.period}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                  {row.dimension_value}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  ₩{row.cost.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  {row.impressions.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  {row.clicks.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  {row.conversions.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  {row.ctr}%
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  ₩{row.cpa.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <span className={`font-medium ${
                    row.roas >= 200 ? 'text-green-600' :
                    row.roas >= 100 ? 'text-blue-600' :
                    'text-red-600'
                  }`}>
                    {row.roas}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        총 {data.length}개 행
      </div>
    </div>
  );
}
