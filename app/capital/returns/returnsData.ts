// ─── Shared data, types, and transforms for the returns section ───────────────
// Imported by both DecadeReturnsTable and TopPerformerPanel so neither has to
// duplicate catalogue definitions or display logic.

import { INDEXES, type MarketIndex } from '@/lib/capital/marketIndexes';
import {
    isGermanHistorical,
} from '@/lib/capital/germanStockHistory';
import { isUkHistorical } from '@/lib/capital/ukStockHistory';

// ─── Asset catalogue ──────────────────────────────────────────────────────────

export interface AssetRow {
    series: string;
    country?: string;
}

export interface AssetGroup {
    label: string;
    rows: AssetRow[];
}

export const ASSET_GROUPS: AssetGroup[] = [
    {
        label: 'America',
        rows: [
            { series: 'US/DJI' },
            { series: 'US/GSPC' },
            { series: 'US/IXIC' },
        ],
    },
    {
        label: 'International',
        rows: [
            { series: 'N225', country: 'Japan' },
            { series: 'GDAXI', country: 'Germany' },
            { series: 'FTSE', country: 'United Kingdom' },
        ],
    },
    {
        label: 'Commodities',
        rows: [
            { series: 'GC=F' },
            { series: 'CL=F' },
            { series: 'BTCUSD' },
        ],
    },
];

export const ALL_ROWS: AssetRow[] = ASSET_GROUPS.flatMap(g => g.rows);

// ─── Decade list ──────────────────────────────────────────────────────────────

export const FIRST_DECADE = 1950;
export const LAST_YEAR = 2026;

export interface Decade {
    label: string;
    start: number;
    end: number;
}

export function buildDecades(): Decade[] {
    const out: Decade[] = [];
    for (let y = FIRST_DECADE; y <= LAST_YEAR; y += 10) {
        out.push({ label: `${y}s`, start: y, end: Math.min(y + 9, LAST_YEAR) });
    }
    return out;
}

export const DECADES = buildDecades();

// ─── Cell state ───────────────────────────────────────────────────────────────

export type CellState =
    | { status: 'loading' }
    | { status: 'done'; pct: number | null; years: number | null }
    | { status: 'error' };

// series → decade label → state
export type TableData = Record<string, Record<string, CellState>>;

// ─── Scope filter ─────────────────────────────────────────────────────────────

export type Scope = 'equities' | 'equities+gold' | 'all';

const EQUITIES_SERIES = new Set([
    'US/DJI', 'US/GSPC', 'US/IXIC', 'N225', 'GDAXI', 'FTSE',
]);
const GOLD_SERIES = 'GC=F';

export function inScope(series: string, scope: Scope): boolean {
    if (scope === 'equities') return EQUITIES_SERIES.has(series);
    if (scope === 'equities+gold') return EQUITIES_SERIES.has(series) || series === GOLD_SERIES;
    return true;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function findAsset(series: string): MarketIndex {
    return INDEXES.find(i => i.series === series)!;
}

/** "DAX · Germany" or just "Bitcoin" */
export function assetDisplayName(asset: MarketIndex, row: AssetRow): string {
    return row.country ? `${asset.label} · ${row.country}` : asset.label;
}

// ─── Display transforms ───────────────────────────────────────────────────────

export function stripDividends(totalPct: number, years: number): number {
    return ((1 + totalPct / 100) / Math.pow(1.03, years) - 1) * 100;
}

export function toAnnual(totalPct: number, years: number): number {
    if (years <= 0) return totalPct;
    return (Math.pow(1 + totalPct / 100, 1 / years) - 1) * 100;
}

/** Apply the active display toggles and return the final display value. */
export function displayValue(
    state: CellState | undefined,
    series: string,
    decadeStart: number,
    annualise: boolean,
    stripDiv: boolean,
): number | null {
    if (!state || state.status !== 'done' || state.pct == null) return null;
    const estimated = series === 'GDAXI' && isGermanHistorical(decadeStart);
    let v = state.pct;
    const years = state.years ?? 10;
    if (estimated && stripDiv) v = stripDividends(v, years);
    if (annualise) v = toAnnual(v, years);
    return v;
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export const POS = '#74B87A';
export const NEG = '#C4574A';

export function fmt(pct: number, isAnnual: boolean): string {
    const sign = pct < 0 ? '−' : '+';
    const decimals = isAnnual ? 1 : 0;
    return `${sign}${Math.abs(pct).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    })}%`;
}
