/**
 * GET /api/regime/percentile-shifts[?date=YYYY-MM]
 *
 * For each macro metric, returns the percentile for the given month and the
 * percentile for the prior month, plus the delta between them.
 * Matches the exact same query pattern as /api/regime/data.
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export const dynamic = 'force-dynamic';

const SERIES = [
    // ── Regime inputs (real / derived) ───────────────────────────────────────
    { key: 'rey', label: 'Real Earnings Yield', asset_class: 'derived', series_name: 'Real-Earnings-Yield-5yr', group: 'Regime Inputs' },
    { key: 'eyp', label: 'Earnings Yield Premium', asset_class: 'derived', series_name: 'Earnings-Yield-Premium-5yr', group: 'Regime Inputs' },
    { key: 'real10Y', label: 'Real 10Y Rate', asset_class: 'derived', series_name: 'Real-10Y', group: 'Regime Inputs' },
    { key: 'real3M', label: 'Real 3M Rate', asset_class: 'derived', series_name: 'Real-3M', group: 'Regime Inputs' },
    { key: 'realM2', label: 'Real M2 YoY', asset_class: 'economic', series_name: 'Real-M2-YoY', group: 'Regime Inputs' },
    { key: 'yieldCurve', label: 'Yield Curve (10Y–3M)', asset_class: 'derived', series_name: 'Yield-Curve-10Y-3M', group: 'Regime Inputs' },
    // ── Nominal rates ─────────────────────────────────────────────────────────
    { key: 'fedFunds', label: 'Fed Funds', asset_class: 'economic', series_name: 'US/FEDFUNDS', group: 'Nominal Rates' },
    { key: 'irx', label: '3M T-Bill', asset_class: 'bonds', series_name: 'US/IRX-Monthly', group: 'Nominal Rates' },
    { key: 'us2yr', label: '2Y Treasury', asset_class: 'bonds', series_name: 'US/US-2yr-Monthly', group: 'Nominal Rates' },
    { key: 'tnx', label: '10Y Treasury', asset_class: 'bonds', series_name: 'US/TNX-Monthly', group: 'Nominal Rates' },
    { key: 'tyx', label: '30Y Treasury', asset_class: 'bonds', series_name: 'US/TYX', group: 'Nominal Rates' },
    // ── Macro / money ─────────────────────────────────────────────────────────
    { key: 'cpi', label: 'CPI Inflation', asset_class: 'economic', series_name: 'CPI', group: 'Macro' },
    { key: 'm2', label: 'M2 YoY', asset_class: 'economic', series_name: 'M2-YoY', group: 'Macro' },
    // ── Valuations ────────────────────────────────────────────────────────────
    { key: 'pe5yr', label: 'P/E (5yr avg)', asset_class: 'valuations', series_name: 'PE-5yr', group: 'Valuations' },
    { key: 'ey5yr', label: 'Earnings Yield (5yr)', asset_class: 'valuations', series_name: 'Earnings-Yield-5yr', group: 'Valuations' },
] as const;

export interface PercentileShift {
    key: string;
    label: string;
    group: string;
    currentValue: number | null;
    currentPercentile: number | null;
    prevValue: number | null;
    prevPercentile: number | null;
    /** currentPercentile − prevPercentile */
    delta: number | null;
    currentDate: string | null;
    prevDate: string | null;
}

/** Returns YYYY-MM for one month prior */
function prevYearMonth(ym: string): string {
    const [y, m] = ym.split('-').map(Number);
    return m === 1
        ? `${y - 1}-12`
        : `${y}-${String(m - 1).padStart(2, '0')}`;
}

/** Fetch one row per series for a given YYYY-MM */
async function fetchMonthRows(names: string[], yearMonth: string) {
    const res = await pool.query<{
        series_name: string;
        date: string;
        value: number;
        percentile_rank: number | null;
    }>(
        `SELECT DISTINCT ON (series_name) series_name, date, value, percentile_rank
         FROM macro_percentile_analysis
         WHERE series_name = ANY($1)
           AND LEFT(date, 7) = $2
         ORDER BY series_name, date DESC`,
        [names, yearMonth],
    );
    return new Map(res.rows.map(r => [r.series_name, r]));
}

export async function GET(req: NextRequest) {
    try {
        const names = SERIES.map(s => s.series_name);
        const dateParam = req.nextUrl.searchParams.get('date'); // optional YYYY-MM

        let currentYM: string;

        if (dateParam && /^\d{4}-\d{2}$/.test(dateParam)) {
            currentYM = dateParam;
        } else {
            const refRes = await pool.query<{ date: string }>(
                `SELECT date FROM macro_percentile_analysis
                 WHERE asset_class = 'derived' AND series_name = 'Real-Earnings-Yield-5yr'
                 ORDER BY date DESC LIMIT 1`,
            );
            currentYM = (refRes.rows[0]?.date ?? '').slice(0, 7);
        }

        const prevYM = prevYearMonth(currentYM);

        const [curMap, prevMap] = await Promise.all([
            fetchMonthRows(names, currentYM),
            fetchMonthRows(names, prevYM),
        ]);

        const shifts: PercentileShift[] = SERIES.map(s => {
            const cur = curMap.get(s.series_name) ?? null;
            const prv = prevMap.get(s.series_name) ?? null;
            const currentPercentile = cur?.percentile_rank ?? null;
            const prevPercentile = prv?.percentile_rank ?? null;
            const delta = currentPercentile !== null && prevPercentile !== null
                ? currentPercentile - prevPercentile
                : null;
            return {
                key: s.key,
                label: s.label,
                group: s.group,
                currentValue: cur?.value ?? null,
                currentPercentile,
                prevValue: prv?.value ?? null,
                prevPercentile,
                delta,
                currentDate: cur?.date ?? null,
                prevDate: prv?.date ?? null,
            };
        });

        return NextResponse.json(shifts, { headers: { 'Cache-Control': 'no-store' } });
    } catch (err) {
        console.error('percentile-shifts error', err);
        return NextResponse.json({ error: 'Failed to fetch percentile shifts' }, { status: 500 });
    }
}
