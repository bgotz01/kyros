/**
 * GET /api/regime/detail?regime=overvaluation&asset=sp500
 *
 * Returns all historical periods + per-period returns for a single regime.
 * Supports asset=sp500|nasdaq|gold (default: sp500).
 * Also returns aggregate stats and dual-asset comparison (SPX + NDX together).
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { slugToRegime } from '@/app/lib/regime-slugs';

interface PriceRow { date: string; value: number; }
interface RegimeRow { date: string; regime: string; entry_date: string; }

interface PeriodReturn {
    startDate: string;
    endDate: string;
    months: number;
    isCurrent: boolean;
    // SPX
    spxEntry: number | null;
    spxExit: number | null;
    spxReturn: number | null;
    spxAnnualized: number | null;
    spxFwd1Y: number | null;
    spxFwd3Y: number | null;
    // NDX
    ndxEntry: number | null;
    ndxExit: number | null;
    ndxReturn: number | null;
    ndxAnnualized: number | null;
    ndxFwd1Y: number | null;
    ndxFwd3Y: number | null;
}

function findClosest(prices: Map<string, number>, date: string): number | null {
    if (prices.has(date)) return prices.get(date)!;
    const target = new Date(date).getTime();
    let best: number | null = null;
    let bestDiff = Infinity;
    for (const [d, p] of prices) {
        const diff = Math.abs(new Date(d).getTime() - target);
        if (diff < bestDiff && diff < 10 * 86_400_000) { bestDiff = diff; best = p; }
    }
    return best;
}

function findForward(prices: Map<string, number>, startDate: string, years: number): number | null {
    const t = new Date(startDate);
    t.setFullYear(t.getFullYear() + years);
    return findClosest(prices, t.toISOString().split('T')[0]);
}

function pctRet(entry: number | null, exit: number | null): number | null {
    if (!entry || !exit) return null;
    return Math.round(((exit - entry) / entry) * 10000) / 100;
}

function annualize(totalPct: number, months: number): number | null {
    if (months <= 0) return null;
    return Math.round((Math.pow(1 + totalPct / 100, 12 / months) - 1) * 10000) / 100;
}

function avg(arr: number[]): number | null {
    if (!arr.length) return null;
    return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100;
}

function median(arr: number[]): number | null {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return Math.round((s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) * 100) / 100;
}

function stats(values: (number | null)[]) {
    const v = values.filter((x): x is number => x !== null);
    return {
        avg: avg(v),
        median: median(v),
        min: v.length ? Math.round(Math.min(...v) * 100) / 100 : null,
        max: v.length ? Math.round(Math.max(...v) * 100) / 100 : null,
        count: v.length,
        positiveRate: v.length ? Math.round((v.filter(x => x > 0).length / v.length) * 100) : null,
    };
}

export async function GET(req: NextRequest) {
    const slug = req.nextUrl.searchParams.get('regime') ?? '';
    const regimeName = slugToRegime(slug);

    if (!regimeName) {
        return NextResponse.json({ error: `Unknown regime slug: ${slug}` }, { status: 400 });
    }

    try {
        const [regimeResult, spxResult, ndxResult] = await Promise.all([
            pool.query<RegimeRow>(
                `SELECT date::text, regime, entry_date::text as entry_date
                 FROM macro_regime_timeline ORDER BY date ASC`,
            ),
            pool.query<PriceRow>(
                `SELECT date::text, value FROM macro_time_series
                 WHERE asset_class = 'equities' AND series_name = 'US/GSPC' AND column_name = 'Value'
                 ORDER BY date ASC`,
            ),
            pool.query<PriceRow>(
                `SELECT date::text, value FROM macro_time_series
                 WHERE asset_class = 'equities' AND series_name = 'NDX' AND column_name = 'Value'
                 ORDER BY date ASC`,
            ),
        ]);

        const spx = new Map<string, number>();
        for (const r of spxResult.rows) spx.set(r.date, r.value);

        const ndx = new Map<string, number>();
        for (const r of ndxResult.rows) ndx.set(r.date, r.value);

        // Build all regime periods
        type RawPeriod = { regime: string; startDate: string; endDate: string; months: number; isCurrent: boolean };
        const allPeriods: RawPeriod[] = [];
        let cur: RawPeriod | null = null;

        for (const row of regimeResult.rows) {
            if (!cur || cur.regime !== row.regime) {
                if (cur) allPeriods.push(cur);
                cur = { regime: row.regime, startDate: row.date, endDate: row.date, months: 1, isCurrent: false };
            } else {
                cur.endDate = row.date;
                cur.months++;
            }
        }
        if (cur) {
            cur.isCurrent = (Date.now() - new Date(cur.endDate).getTime()) / 86_400_000 < 60;
            allPeriods.push(cur);
        }

        // Filter to the requested regime
        const regimePeriods = allPeriods.filter(p => p.regime === regimeName);

        const periods: PeriodReturn[] = regimePeriods.map(p => {
            const spxEntry = findClosest(spx, p.startDate);
            const spxExit = findClosest(spx, p.endDate);
            const spxRet = pctRet(spxEntry, spxExit);

            const ndxEntry = findClosest(ndx, p.startDate);
            const ndxExit = findClosest(ndx, p.endDate);
            const ndxRet = pctRet(ndxEntry, ndxExit);

            return {
                startDate: p.startDate,
                endDate: p.isCurrent ? 'Current' : p.endDate,
                months: p.months,
                isCurrent: p.isCurrent,
                spxEntry, spxExit,
                spxReturn: spxRet,
                spxAnnualized: spxRet !== null ? annualize(spxRet, p.months) : null,
                spxFwd1Y: pctRet(spxEntry, findForward(spx, p.startDate, 1)),
                spxFwd3Y: pctRet(spxEntry, findForward(spx, p.startDate, 3)),
                ndxEntry, ndxExit,
                ndxReturn: ndxRet,
                ndxAnnualized: ndxRet !== null ? annualize(ndxRet, p.months) : null,
                ndxFwd1Y: pctRet(ndxEntry, findForward(ndx, p.startDate, 1)),
                ndxFwd3Y: pctRet(ndxEntry, findForward(ndx, p.startDate, 3)),
            };
        }).sort((a, b) => b.startDate.localeCompare(a.startDate));

        // Aggregate stats
        const spxStats = {
            during: stats(periods.map(p => p.spxReturn)),
            annualized: stats(periods.map(p => p.spxAnnualized)),
            fwd1Y: stats(periods.map(p => p.spxFwd1Y)),
            fwd3Y: stats(periods.map(p => p.spxFwd3Y)),
        };
        const ndxStats = {
            during: stats(periods.map(p => p.ndxReturn)),
            annualized: stats(periods.map(p => p.ndxAnnualized)),
            fwd1Y: stats(periods.map(p => p.ndxFwd1Y)),
            fwd3Y: stats(periods.map(p => p.ndxFwd3Y)),
        };
        const durationStats = stats(periods.map(p => p.months));

        return NextResponse.json({
            regime: regimeName,
            slug,
            occurrences: periods.length,
            durationStats,
            spxStats,
            ndxStats,
            periods,
        }, {
            headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
        });
    } catch (err) {
        console.error('regime/detail error', err);
        return NextResponse.json({ error: 'Failed to fetch regime detail' }, { status: 500 });
    }
}
