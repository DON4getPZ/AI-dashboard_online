import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Tailwind CSS 클래스 병합 유틸리티
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 숫자를 한국어 통화 형식으로 포맷
 * @example formatCurrency(1500000) => "1,500,000원"
 * @example formatCurrency(150000000, true) => "1.5억 원"
 */
export function formatCurrency(value: number, useKorean = false): string {
  if (value === null || value === undefined || isNaN(value)) return '-'

  if (useKorean) {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억 원`
    } else if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}만 원`
    }
  }

  return `${value.toLocaleString('ko-KR')}원`
}

/**
 * 숫자를 퍼센트 형식으로 포맷
 * @example formatPercent(85.5) => "85.5%"
 */
export function formatPercent(value: number, decimals = 1): string {
  if (value === null || value === undefined || isNaN(value)) return '-'
  return `${value.toFixed(decimals)}%`
}

/**
 * 숫자를 간략화된 형식으로 포맷
 * @example formatNumber(1500) => "1.5K"
 * @example formatNumber(1500000) => "1.5M"
 */
export function formatNumber(value: number): string {
  if (value === null || value === undefined || isNaN(value)) return '-'

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }

  return value.toLocaleString('ko-KR')
}

/**
 * ROAS 값에 따른 색상 클래스 반환
 */
export function getRoasColor(roas: number): string {
  if (roas >= 500) return 'text-success-main'
  if (roas >= 200) return 'text-primary-main'
  if (roas >= 100) return 'text-warning-main'
  return 'text-error-main'
}

/**
 * 변화율에 따른 색상 클래스 반환
 */
export function getChangeColor(change: number): string {
  if (change > 0) return 'text-success-main'
  if (change < 0) return 'text-error-main'
  return 'text-gray-500'
}

/**
 * 변화율 아이콘 문자 반환
 */
export function getChangeIcon(change: number): string {
  if (change > 0) return '↑'
  if (change < 0) return '↓'
  return '-'
}

/**
 * 날짜 포맷팅
 */
export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (format === 'long') {
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return d.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  })
}
