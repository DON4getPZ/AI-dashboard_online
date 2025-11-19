/**
 * 마케팅 데이터 로드 Hook
 * DuckDB 없이 순수 JavaScript로 집계
 */

import { useState, useEffect } from 'react';
import Papa from 'papaparse';

const DATA_BASE_URL = process.env.NEXT_PUBLIC_DATA_URL || '/data';

interface MetaData {
  last_updated: string;
  total_rows: number;
  date_range: {
    start: string;
    end: string;
  };
  months: Array<{
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
  }>;
  total_metrics: {
    cost: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  };
  kpis: {
    ctr: number;
    cpc: number;
    cpa: number;
    cvr: number;
    roas: number;
  };
}

export function useMetaData() {
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMeta() {
      try {
        const url = `${DATA_BASE_URL}/meta/latest.json`;
        console.log('Loading meta from:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Meta loaded:', data);
        setMeta(data);
        setError(null);
      } catch (err) {
        console.error('메타데이터 로드 실패:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadMeta();
  }, []);

  return { meta, loading, error };
}

interface MarketingDataParams {
  months: string[];
  sql?: string;
}

export function useMarketingData({ months, sql }: MarketingDataParams) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (months.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Loading data for months:', months);
        
        const allData: any[] = [];

        for (const month of months) {
          const url = `${DATA_BASE_URL}/raw/${month}.csv`;
          console.log('Fetching:', url);
          
          const response = await fetch(url);
          
          if (!response.ok) {
            console.warn(`월별 데이터 로드 실패: ${month}`);
            continue;
          }

          const csvText = await response.text();
          
          const result = await new Promise<any>((resolve) => {
            Papa.parse(csvText, {
              header: true,
              dynamicTyping: true,
              skipEmptyLines: true,
              complete: (results) => resolve(results.data),
            });
          });

          console.log(`${month}: ${result.length} rows loaded`);
          allData.push(...result);
        }

        console.log('Total rows:', allData.length);

        // SQL이 있으면 집계 처리
        if (sql && sql.includes('GROUP BY')) {
          console.log('Processing SQL GROUP BY...');
          const processedData = processGroupBy(allData, sql);
          console.log('Processed data:', processedData.length, 'rows');
          setData(processedData);
        } else {
          setData(allData);
        }
        
        setError(null);
      } catch (err) {
        console.error('데이터 로드 실패:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [months, sql]);

  return { data, loading, error };
}

// 간단한 GROUP BY 처리
function processGroupBy(data: any[], sql: string): any[] {
  console.log('processGroupBy called with', data.length, 'rows');
  
  // 캠페인별 집계인지 확인
  if (!sql.includes('캠페인')) {
    console.log('Not a campaign query, returning raw data');
    return data;
  }

  const grouped = new Map<string, any>();

  data.forEach((row) => {
    const campaign = row['캠페인'];
    const goal = row['목표'];
    
    // 빈 값 필터링
    if (!campaign || campaign === '') return;
    
    const key = `${campaign}_${goal || 'none'}`;
    
    if (!grouped.has(key)) {
      grouped.set(key, {
        캠페인: campaign,
        목표: goal || '',
        cost: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
      });
    }

    const group = grouped.get(key)!;
    group.cost += Number(row['비용']) || 0;
    group.clicks += Number(row['클릭']) || 0;
    group.conversions += Number(row['전환수']) || 0;
    group.revenue += Number(row['전환값']) || 0;
  });

  console.log('Grouped into', grouped.size, 'campaigns');

  // CPC, CPA, ROAS 계산
  const result = Array.from(grouped.values())
    .map((item) => ({
      ...item,
      cpc: item.clicks > 0 ? Math.round(item.cost / item.clicks) : 0,
      cpa: item.conversions > 0 ? Math.round(item.cost / item.conversions) : 0,
      roas: item.cost > 0 ? Math.round((item.revenue / item.cost) * 100) : 0,
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10);

  console.log('Top 10 campaigns:', result);
  
  return result;
}
