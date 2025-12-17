# 예산 시뮬레이션 디자인 커스터마이징 가이드

## 개요
`budget-simulator.html`의 우수한 디자인 요소를 `timeseries_analysis.html`의 '예산 시뮬레이션' 섹션에 적용하기 위한 가이드입니다.

---

## 1. 디자인 비교 분석

### 1.1 현재 timeseries_analysis.html 특징
| 항목 | 현재 상태 |
|------|----------|
| 테마 | 라이트 모드 |
| 배경색 | #fff8e1, #ffecb3 (옐로우 계열) |
| 카드 스타일 | 단순 white 배경 + 약한 그림자 |
| 슬라이더 | 기본 스타일 |
| 애니메이션 | 없음 |
| 아이콘 | 이모지 사용 |

### 1.2 budget-simulator.html 우수 요소
| 항목 | 특징 |
|------|------|
| 테마 | 다크 모드 (프리미엄 느낌) |
| 그라데이션 | 멀티 컬러 그라데이션 활용 |
| 카드 스타일 | 호버 효과 + 강조 테두리 |
| 슬라이더 | 컬러 그라데이션 필 + 플로팅 값 |
| 애니메이션 | fadeIn, pulse 등 |
| 아이콘 | SVG 아이콘 + 컬러 배경 |

---

## 2. 적용 가능한 디자인 요소

### 2.1 컬러 시스템 (라이트 모드 적용 버전)

```css
:root {
    /* 기본 배경 */
    --sim-bg-primary: #f8fafc;
    --sim-bg-secondary: #f1f5f9;
    --sim-bg-card: #ffffff;
    --sim-bg-elevated: #ffffff;

    /* 텍스트 */
    --sim-text-primary: #1e293b;
    --sim-text-secondary: #64748b;
    --sim-text-muted: #94a3b8;

    /* 테두리 */
    --sim-border-default: rgba(0, 0, 0, 0.06);
    --sim-border-hover: rgba(0, 0, 0, 0.12);

    /* 액센트 컬러 */
    --sim-accent-green: #10b981;
    --sim-accent-green-soft: rgba(16, 185, 129, 0.1);
    --sim-accent-red: #ef4444;
    --sim-accent-red-soft: rgba(239, 68, 68, 0.1);
    --sim-accent-blue: #3b82f6;
    --sim-accent-blue-soft: rgba(59, 130, 246, 0.1);
    --sim-accent-purple: #8b5cf6;
    --sim-accent-purple-soft: rgba(139, 92, 246, 0.1);
    --sim-accent-yellow: #f59e0b;
    --sim-accent-yellow-soft: rgba(245, 158, 11, 0.1);

    /* 세그먼트 컬러 */
    --sim-segment-conversion: #10b981;
    --sim-segment-traffic: #f59e0b;
    --sim-segment-reach: #8b5cf6;

    /* 슬라이더 그라데이션 팔레트 (보라색 계열) */
    --sim-slider-1: #d6beff;  /* 연한 보라 - 시작 */
    --sim-slider-2: #be9ff2;  /* 25% */
    --sim-slider-3: #ab87ea;  /* 50% - 중간 */
    --sim-slider-4: #8c63d3;  /* 75% */
    --sim-slider-5: #673ab7;  /* 진한 보라 - 끝 */

    /* 그림자 */
    --sim-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
    --sim-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
    --sim-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
}
```

### 2.2 정보 배너 (Info Banner)

**Before (현재):**
```html
<div style="background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);">
```

**After (개선):**
```html
<div class="sim-info-banner">
    <div class="sim-info-icon">
        <svg>...</svg>
    </div>
    <div class="sim-info-content">
        <h3>예산 시나리오 시뮬레이션</h3>
        <p>세그먼트별 예산 변경 시 예상되는 <strong>매출 변화</strong>를 시뮬레이션합니다.</p>
    </div>
</div>
```

```css
.sim-info-banner {
    display: flex;
    gap: 16px;
    padding: 20px;
    background: linear-gradient(135deg, var(--sim-accent-blue-soft), var(--sim-accent-purple-soft));
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 12px;
    position: relative;
    overflow: hidden;
}

.sim-info-banner::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5), transparent);
}

.sim-info-icon {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    background: var(--sim-accent-purple-soft);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--sim-accent-purple);
}

.sim-info-content h3 {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 4px;
    color: var(--sim-text-primary);
}

.sim-info-content p {
    font-size: 13px;
    color: var(--sim-text-secondary);
    line-height: 1.6;
}

.sim-info-content strong {
    color: var(--sim-accent-purple);
}
```

### 2.3 슬라이더 그룹 (Slider Group)

**개선된 슬라이더 스타일:**
```css
.sim-slider-group {
    background: var(--sim-bg-secondary);
    border-radius: 12px;
    padding: 20px;
    border: 1px solid var(--sim-border-default);
    transition: all 0.25s ease;
}

.sim-slider-group:hover {
    border-color: var(--sim-border-hover);
    box-shadow: var(--sim-shadow-md);
    transform: translateY(-2px);
}

.sim-slider-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.sim-segment-badge {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.sim-segment-badge.conversion {
    background: var(--sim-accent-green-soft);
    color: var(--sim-accent-green);
}

.sim-segment-badge.traffic {
    background: var(--sim-accent-yellow-soft);
    color: var(--sim-accent-yellow);
}

.sim-segment-badge.reach {
    background: var(--sim-accent-purple-soft);
    color: var(--sim-accent-purple);
}

/* 그라데이션 슬라이더 트랙 */
.sim-slider-track {
    position: relative;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: visible;
}

.sim-slider-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    /* 보라색 그라데이션 (연한 → 진한) */
    background: linear-gradient(90deg,
        #d6beff 0%,
        #be9ff2 25%,
        #ab87ea 50%,
        #8c63d3 75%,
        #673ab7 100%
    );
    border-radius: 4px;
    transition: width 0.15s ease;
}

/* 플로팅 값 표시 */
.sim-slider-thumb-value {
    position: absolute;
    top: -32px;
    transform: translateX(-50%);
    background: var(--sim-text-primary);
    color: white;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    pointer-events: none;
}

.sim-slider-thumb-value::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid var(--sim-text-primary);
}
```

### 2.4 결과 요약 카드 (Summary Cards)

**개선된 카드 스타일:**
```css
.sim-summary-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
}

.sim-summary-card {
    background: white;
    border: 1px solid var(--sim-border-default);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    gap: 14px;
    transition: all 0.25s ease;
    animation: simFadeIn 0.5s ease-out;
}

.sim-summary-card:hover {
    border-color: var(--sim-border-hover);
    transform: translateY(-3px);
    box-shadow: var(--sim-shadow-md);
}

.sim-summary-card.highlight {
    border-color: rgba(16, 185, 129, 0.3);
    background: linear-gradient(135deg, white, rgba(16, 185, 129, 0.03));
}

.sim-summary-card.featured {
    border-color: rgba(59, 130, 246, 0.3);
    background: linear-gradient(135deg, white, rgba(59, 130, 246, 0.03));
}

.sim-card-icon {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.sim-card-icon.cost {
    background: var(--sim-accent-purple-soft);
    color: var(--sim-accent-purple);
}

.sim-card-icon.revenue {
    background: var(--sim-accent-green-soft);
    color: var(--sim-accent-green);
}

.sim-card-icon.roas {
    background: var(--sim-accent-yellow-soft);
    color: var(--sim-accent-yellow);
}

.sim-card-icon.roi {
    background: var(--sim-accent-blue-soft);
    color: var(--sim-accent-blue);
}

.sim-card-label {
    font-size: 11px;
    color: var(--sim-text-muted);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.sim-card-values {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.sim-card-before {
    font-size: 13px;
    color: var(--sim-text-muted);
    text-decoration: line-through;
}

.sim-card-after {
    font-size: 18px;
    font-weight: 700;
    color: var(--sim-text-primary);
}

.sim-card-change {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 4px;
}

.sim-card-change.positive {
    background: var(--sim-accent-green-soft);
    color: var(--sim-accent-green);
}

.sim-card-change.negative {
    background: var(--sim-accent-red-soft);
    color: var(--sim-accent-red);
}

/* 투자 효율 특별 스타일 */
.sim-card-value-large {
    font-size: 28px;
    font-weight: 800;
    color: var(--sim-accent-blue);
    line-height: 1;
}
```

### 2.5 상세 결과 테이블 (Detail Table)

```css
.sim-table-container {
    overflow-x: auto;
    border-radius: 12px;
    border: 1px solid var(--sim-border-default);
}

.sim-detail-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}

.sim-detail-table th {
    text-align: left;
    padding: 14px 16px;
    background: var(--sim-bg-secondary);
    color: var(--sim-text-muted);
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--sim-border-default);
}

.sim-detail-table td {
    padding: 14px 16px;
    border-bottom: 1px solid var(--sim-border-default);
    color: var(--sim-text-secondary);
}

.sim-detail-table tr:last-child td {
    border-bottom: none;
}

.sim-detail-table tr:hover td {
    background: var(--sim-bg-secondary);
}

.sim-segment-cell {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 500;
    color: var(--sim-text-primary);
}

.sim-segment-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
}

.sim-segment-dot.conversion { background: var(--sim-segment-conversion); }
.sim-segment-dot.traffic { background: var(--sim-segment-traffic); }
.sim-segment-dot.reach { background: var(--sim-segment-reach); }

.sim-highlight-cell {
    font-weight: 600;
}

.sim-highlight-cell.positive { color: var(--sim-accent-green); }
.sim-highlight-cell.negative { color: var(--sim-accent-red); }

.sim-roas-cell.high { color: var(--sim-accent-green); font-weight: 600; }
.sim-roas-cell.medium { color: var(--sim-accent-yellow); font-weight: 600; }
.sim-roas-cell.low { color: var(--sim-accent-red); font-weight: 600; }

/* 추천 뱃지 */
.sim-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}

.sim-badge.recommend {
    background: var(--sim-accent-green-soft);
    color: var(--sim-accent-green);
}

.sim-badge.review {
    background: var(--sim-accent-yellow-soft);
    color: var(--sim-accent-yellow);
}

.sim-badge.warning {
    background: var(--sim-accent-red-soft);
    color: var(--sim-accent-red);
}
```

### 2.6 인사이트 박스 (Insight Box)

```css
.sim-insight-box {
    background: linear-gradient(135deg,
        rgba(245, 158, 11, 0.06),
        rgba(249, 115, 22, 0.06)
    );
    border: 1px solid rgba(245, 158, 11, 0.2);
    border-radius: 12px;
    padding: 20px;
}

.sim-insight-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    color: var(--sim-accent-yellow);
    font-weight: 600;
    font-size: 14px;
}

.sim-insight-box p {
    font-size: 13px;
    color: var(--sim-text-secondary);
    line-height: 1.7;
}

.sim-insight-box strong {
    color: var(--sim-text-primary);
}
```

### 2.7 애니메이션

```css
@keyframes simFadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes simPulse {
    0%, 100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.5;
        transform: scale(1.2);
    }
}

/* 실시간 반영 인디케이터 */
.sim-update-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--sim-text-muted);
}

.sim-pulse {
    width: 8px;
    height: 8px;
    background: var(--sim-accent-green);
    border-radius: 50%;
    animation: simPulse 2s infinite;
}

/* 슬라이더 그룹 순차 애니메이션 */
.sim-slider-group {
    animation: simFadeIn 0.4s ease-out;
}

.sim-slider-group:nth-child(1) { animation-delay: 0.1s; }
.sim-slider-group:nth-child(2) { animation-delay: 0.2s; }
.sim-slider-group:nth-child(3) { animation-delay: 0.3s; }
.sim-slider-group:nth-child(4) { animation-delay: 0.4s; }
.sim-slider-group:nth-child(5) { animation-delay: 0.5s; }

/* 카드 순차 애니메이션 */
.sim-summary-card:nth-child(1) { animation-delay: 0.1s; }
.sim-summary-card:nth-child(2) { animation-delay: 0.15s; }
.sim-summary-card:nth-child(3) { animation-delay: 0.2s; }
.sim-summary-card:nth-child(4) { animation-delay: 0.25s; }
```

---

## 3. SVG 아이콘 세트

### 3.1 카드 아이콘

```html
<!-- 비용 아이콘 -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
</svg>

<!-- 매출 아이콘 -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
</svg>

<!-- ROAS 아이콘 -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
</svg>

<!-- 투자 효율 아이콘 -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="7.5 4.21 12 6.81 16.5 4.21"/>
    <polyline points="7.5 19.79 7.5 14.6 3 12"/>
    <polyline points="21 12 16.5 14.6 16.5 19.79"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
</svg>

<!-- 정보 아이콘 -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 16v-4"/>
    <path d="M12 8h.01"/>
</svg>

<!-- 인사이트/전구 아이콘 -->
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
</svg>
```

---

## 4. 반응형 디자인

```css
@media (max-width: 1200px) {
    .sim-summary-cards {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .sim-summary-cards {
        grid-template-columns: 1fr;
    }

    .sim-slider-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }

    .sim-detail-table {
        font-size: 11px;
    }

    .sim-detail-table th,
    .sim-detail-table td {
        padding: 10px 12px;
    }
}
```

---

## 5. 적용 우선순위

### Phase 1: 핵심 요소 (높은 영향도)
1. 컬러 시스템 적용
2. 결과 요약 카드 개선 (아이콘 + 레이아웃)
3. 슬라이더 그라데이션 스타일

### Phase 2: 시각적 개선
1. 정보 배너 그라데이션
2. 테이블 스타일 개선
3. 세그먼트 뱃지/닷 컬러

### Phase 3: 인터랙션
1. 호버 효과 및 트랜지션
2. fadeIn 애니메이션
3. 실시간 반영 인디케이터

---

## 6. 참고 사항

- 현재 timeseries_analysis.html은 **라이트 모드** 기반이므로, budget-simulator.html의 다크 모드 컬러를 라이트 모드에 맞게 변환하여 적용
- 기존 CSS 변수(`--primary-main`, `--grey-*` 등)와의 충돌을 피하기 위해 `--sim-` 접두사 사용 권장
- SVG 아이콘은 이모지 대비 **일관성**과 **커스터마이징** 측면에서 유리
