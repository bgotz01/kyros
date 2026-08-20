// ─── Chart series config ──────────────────────────────────────────────────────
// Shared by the value chart (page.tsx) and the percentile chart
// (PercentileChart.tsx) so both speak the same six series, colours and periods.

export interface MacroRow {
    month: string;
    ten_y: number | null;
    cpi: number | null;
    m2: number | null;
    ey5: number | null;
    real10: number | null;
    eyp5: number | null;
    rey5: number | null;
}

export type SeriesKey = 'ten_y' | 'cpi' | 'm2' | 'ey5' | 'real10' | 'eyp5' | 'rey5';

export type SeriesGroup = 'nominal' | 'relative';

export interface SeriesDef {
    key: SeriesKey;
    label: string;
    shortLabel: string;
    description: string;
    color: string;
    group: SeriesGroup;
}

export const SERIES: SeriesDef[] = [
    // Nominal
    {
        key: 'ten_y',
        label: '10-Year Treasury Yield',
        shortLabel: '10Y',
        description: 'US 10-Year nominal yield — monthly average of daily data',
        color: '#E8B84B',   // amber
        group: 'nominal',
    },
    {
        key: 'cpi',
        label: 'CPI YoY',
        shortLabel: 'CPI',
        description: 'Consumer Price Index — year-over-year change',
        color: '#4FC4A0',   // mint
        group: 'nominal',
    },
    {
        key: 'm2',
        label: 'M2 Money Supply YoY',
        shortLabel: 'M2',
        description: 'US M2 money supply — year-over-year growth',
        color: '#E0819B',   // dusty rose
        group: 'nominal',
    },
    {
        key: 'ey5',
        label: 'Earnings Yield 5yr',
        shortLabel: 'EY5',
        description: 'S&P 500 earnings yield using 5-year rolling average earnings',
        color: '#F07A50',   // coral
        group: 'nominal',
    },
    // Relative
    {
        key: 'real10',
        label: 'Real 10Y Yield',
        shortLabel: 'R10Y',
        description: '10-Year Treasury Yield minus CPI — real rate',
        color: '#6AAEE8',   // sky blue
        group: 'relative',
    },
    {
        key: 'eyp5',
        label: 'Earnings Yield Premium 5yr',
        shortLabel: 'EYP5',
        description: 'EY5 minus 5-year treasury yield — equity risk premium',
        color: '#C084E8',   // violet
        group: 'relative',
    },
    {
        key: 'rey5',
        label: 'Real Earnings Yield 5yr',
        shortLabel: 'REY5',
        description: 'EY5 minus CPI — real return on equities',
        color: '#8FD46A',   // lime green
        group: 'relative',
    },
];

// ─── decade presets ───────────────────────────────────────────────────────────

export interface Decade {
    label: string;
    start: string;
    end: string;
}

export const DECADES: Decade[] = [
    { label: 'All', start: '1960-01-01', end: '2026-12-31' },
    { label: '1960s', start: '1960-01-01', end: '1969-12-31' },
    { label: '1970s', start: '1970-01-01', end: '1979-12-31' },
    { label: '1980s', start: '1980-01-01', end: '1989-12-31' },
    { label: '1990s', start: '1990-01-01', end: '1999-12-31' },
    { label: '2000s', start: '2000-01-01', end: '2009-12-31' },
    { label: '2010s', start: '2010-01-01', end: '2019-12-31' },
    { label: '2020s', start: '2020-01-01', end: '2026-12-31' },
];

// ─── shared chart geometry ────────────────────────────────────────────────────

export const PAD = { top: 24, right: 24, bottom: 44, left: 52 };

export function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

/** Year labels and vertical rules — computed from the month column the charts
 *  share. Both intervals are in years: the defaults label every 5 and rule
 *  every 10, which is the decade grid. A span running over a century wants a
 *  coarser `labelEvery` or the readouts collide. */
export function xAxisMarks(
    months: string[],
    xOf: (i: number) => number,
    labelEvery = 5,
    ruleEvery = 10,
) {
    const labels: { i: number; label: string }[] = [];
    const decadeLines: number[] = [];
    for (let i = 0; i < months.length; i++) {
        const year = parseInt(months[i].slice(0, 4), 10);
        const month = parseInt(months[i].slice(5, 7), 10);
        if (month !== 1) continue;
        if (year % ruleEvery === 0) decadeLines.push(xOf(i));
        if (year % labelEvery === 0) labels.push({ i, label: String(year) });
    }
    return { labels, decadeLines };
}

/** Year spacing that keeps roughly 6-10 readouts on the axis whatever the
 *  span — 5 years over three decades, 20 over a century. */
export function axisIntervals(months: string[]): { labelEvery: number; ruleEvery: number } {
    if (months.length < 2) return { labelEvery: 1, ruleEvery: 10 };
    const span =
        parseInt(months[months.length - 1].slice(0, 4), 10) - parseInt(months[0].slice(0, 4), 10);

    if (span > 90) return { labelEvery: 20, ruleEvery: 20 };
    if (span > 45) return { labelEvery: 10, ruleEvery: 10 };
    if (span > 18) return { labelEvery: 5, ruleEvery: 10 };
    if (span > 8) return { labelEvery: 2, ruleEvery: 10 };
    return { labelEvery: 1, ruleEvery: 5 };
}

// ─── path building ────────────────────────────────────────────────────────────

export interface Pt { x: number; y: number }

/** Contiguous runs of readings — a gap in the data breaks the line rather than
 *  bridging over it. */
export function buildSegments<T>(
    rows: T[],
    valueOf: (row: T) => number | null,
    xOf: (i: number) => number,
    yOf: (v: number) => number,
): Pt[][] {
    const segments: Pt[][] = [];
    let run: Pt[] = [];
    rows.forEach((row, i) => {
        const v = valueOf(row);
        if (v == null) {
            if (run.length) segments.push(run);
            run = [];
            return;
        }
        run.push({ x: xOf(i), y: yOf(v) });
    });
    if (run.length) segments.push(run);
    return segments;
}

export function linePath(segments: Pt[][]) {
    return segments
        .map(seg => seg.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' '))
        .join(' ');
}

/** The same runs closed down to a baseline, for the wash under a lone series. */
export function areaPath(segments: Pt[][], yBase: number) {
    return segments
        .filter(seg => seg.length > 1)
        .map(seg =>
            `M ${seg[0].x} ${yBase} ` +
            seg.map(p => `L ${p.x} ${p.y}`).join(' ') +
            ` L ${seg[seg.length - 1].x} ${yBase} Z`,
        )
        .join(' ');
}
