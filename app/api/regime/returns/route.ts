import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/db';

interface RegimeRow { date: string; regime: string; entry_date: string; }
interface PriceRow { date: string; value: number; }

interface RegimePeriod {
    regime: string; startDate: string; endDate: string; months: number; isCurrent: boolean;
}

interface PeriodDetail {
    startDate: string; endDate: string; months: number; isCurrent: boolean;
    duringReturn: number | null; forward1Y: number | null; forward3Y: number | null; forward5Y: number | null;
    entryPrice: number | null; exitPrice: number | null;
    annualizedDuringReturn: number | null;
    monthlyReturn: number | null;
}

interface RegimeReturnStats {
    regime: string; occurrences: number;
    avgDurationMonths: number; medianDurationMonths: number;
    avgDuringReturn: number | null; medianDuringReturn: number | null;
    minDuringReturn: number | null; maxDuringReturn: number | null;
    avg1Y: number | null; avg3Y: number | null; avg5Y: number | null;
    median1Y: number | null; median3Y: number | null; median5Y: number | null;
    avgAnnualizedDuringReturn: number | null; medianAnnualizedDuringReturn: number | null;
    avgMonthlyReturn: number | null; medianMonthlyReturn: number | null;
    periods: PeriodDetail[];
}

function medianFn(arr: number[]): number | null {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 !== 0 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function avgFn(arr: number[]): number | null {
    if (!arr.length) return null;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function annualize(totalReturnPct: number, months: number): number {
    if (months <= 0) return 0;
    return (Math.pow(1 + totalReturnPct / 100, 12 / months) - 1) * 100;
}

function findClosestPrice(prices: Map<string, number>, targetDate: string): number | null {
    if (prices.has(targetDate)) return prices.get(targetDate)!;
    const target = new Date(targetDate).getTime();
    let best: number | null = null;
    let bestDiff = Infinity;
    for (const [date, price] of prices) {
        const diff = Math.abs(new Date(date).getTime() - target);
        if (diff < bestDiff && diff < 10 * 86400000) { bestDiff = diff; best = price; }
    }
    return best;
}

function findForwardPrice(prices: Map<string, number>, startDate: string, years: number): number | null {
    const t = new Date(startDate);
    t.setFullYear(t.getFullYear() + years);
    return findClosestPrice(prices, t.toISOString().split('T')[0]);
}

const ASSET_CONFIG: Record<string, { assetClass: string; seriesName: string; label: string }> = {
    sp500: { assetClass: 'equities', seriesName: 'US/GSPC', label: 'S&P 500' },
    nasdaq: { assetClass: 'equities', seriesName: 'NDX', label: 'Nasdaq 100' },
    gold: { assetClass: 'commodities', seriesName: 'GC=F', label: 'Gold' },
};

function round2(v: number | null): number | null {
    if (v === null) return null;
    return Math.round(v * 100) / 100;
}

function pctReturn(entry: number | null, exit: number | null): number | null {
    if (!entry || !exit) return null;
    return round2(((exit - entry) / entry) * 100);
}

export async function GET(req: NextRequest) {
    const assetKey = req.nextUrl.searchParams.get('asset') ?? 'sp500';
    const assetConfig = ASSET_CONFIG[assetKey] ?? ASSET_CONFIG.sp500;

    try {
        const [regimeResult, priceResult] = await Promise.all([
            pool.query<RegimeRow>(
                `SELECT date::text as date, regime, entry_date::text as entry_date
                 FROM macro_regime_timeline ORDER BY date ASC`,
            ),
            pool.query<PriceRow>(
                `SELECT date::text as date, value
                 FROM macro_time_series
                 WHERE asset_class = $1 AND series_name = $2 AND column_name = 'Value'
                 ORDER BY date ASC`,
                [assetConfig.assetClass, assetConfig.seriesName],
            ),
        ]);

        const prices = new Map<string, number>();
        for (const row of priceResult.rows) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(row.date)) prices.set(row.date, row.value);
        }

        // Build regime periods from timeline
        const periods: RegimePeriod[] = [];
        let cur: RegimePeriod | null = null;
        for (const row of regimeResult.rows) {
            if (!cur || cur.regime !== row.regime) {
                if (cur) periods.push(cur);
                cur = { regime: row.regime, startDate: row.date, endDate: row.date, months: 1, isCurrent: false };
            } else {
                cur.endDate = row.date;
                cur.months++;
            }
        }
        if (cur) {
            cur.isCurrent = (Date.now() - new Date(cur.endDate).getTime()) / 86400000 < 60;
            periods.push(cur);
        }

        const regimeStats = new Map<string, RegimeReturnStats>();

        for (const period of periods) {
            const entryPrice = findClosestPrice(prices, period.startDate);
            const exitPrice = findClosestPrice(prices, period.endDate);
            const duringReturn = pctReturn(entryPrice, exitPrice);
            const annualizedDuringReturn = duringReturn !== null && period.months > 0
                ? round2(annualize(duringReturn, period.months))
                : null;
            const monthlyReturn = duringReturn !== null && period.months > 0
                ? round2(duringReturn / period.months)
                : null;

            const detail: PeriodDetail = {
                startDate: period.startDate,
                endDate: period.isCurrent ? 'Current' : period.endDate,
                months: period.months,
                isCurrent: period.isCurrent,
                duringReturn,
                forward1Y: pctReturn(entryPrice, findForwardPrice(prices, period.startDate, 1)),
                forward3Y: pctReturn(entryPrice, findForwardPrice(prices, period.startDate, 3)),
                forward5Y: pctReturn(entryPrice, findForwardPrice(prices, period.startDate, 5)),
                entryPrice: round2(entryPrice),
                exitPrice: round2(exitPrice),
                annualizedDuringReturn,
                monthlyReturn,
            };

            if (!regimeStats.has(period.regime)) {
                regimeStats.set(period.regime, {
                    regime: period.regime, occurrences: 0,
                    avgDurationMonths: 0, medianDurationMonths: 0,
                    avgDuringReturn: null, medianDuringReturn: null, minDuringReturn: null, maxDuringReturn: null,
                    avg1Y: null, avg3Y: null, avg5Y: null,
                    median1Y: null, median3Y: null, median5Y: null,
                    avgAnnualizedDuringReturn: null, medianAnnualizedDuringReturn: null,
                    avgMonthlyReturn: null, medianMonthlyReturn: null,
                    periods: [],
                });
            }
            const s = regimeStats.get(period.regime)!;
            s.periods.push(detail);
            s.occurrences++;
        }

        const results: RegimeReturnStats[] = [];
        for (const [, stats] of regimeStats) {
            const durations = stats.periods.map(p => p.months);
            const duringReturns = stats.periods.map(p => p.duringReturn).filter((v): v is number => v !== null);
            const fwd1s = stats.periods.map(p => p.forward1Y).filter((v): v is number => v !== null);
            const fwd3s = stats.periods.map(p => p.forward3Y).filter((v): v is number => v !== null);
            const fwd5s = stats.periods.map(p => p.forward5Y).filter((v): v is number => v !== null);

            stats.avgDurationMonths = Math.round((avgFn(durations) ?? 0) * 10) / 10;
            stats.medianDurationMonths = medianFn(durations) ?? 0;
            stats.avgDuringReturn = round2(avgFn(duringReturns));
            stats.medianDuringReturn = round2(medianFn(duringReturns));
            stats.minDuringReturn = duringReturns.length ? round2(Math.min(...duringReturns)) : null;
            stats.maxDuringReturn = duringReturns.length ? round2(Math.max(...duringReturns)) : null;
            stats.avgAnnualizedDuringReturn = stats.avgDuringReturn !== null && stats.avgDurationMonths > 0
                ? round2(annualize(stats.avgDuringReturn, stats.avgDurationMonths)) : null;
            stats.medianAnnualizedDuringReturn = stats.medianDuringReturn !== null && stats.medianDurationMonths > 0
                ? round2(annualize(stats.medianDuringReturn, stats.medianDurationMonths)) : null;
            stats.avgMonthlyReturn = stats.avgDuringReturn !== null && stats.avgDurationMonths > 0
                ? round2(stats.avgDuringReturn / stats.avgDurationMonths) : null;
            stats.medianMonthlyReturn = stats.medianDuringReturn !== null && stats.medianDurationMonths > 0
                ? round2(stats.medianDuringReturn / stats.medianDurationMonths) : null;
            stats.avg1Y = round2(avgFn(fwd1s));
            stats.avg3Y = round2(avgFn(fwd3s));
            stats.avg5Y = round2(avgFn(fwd5s));
            stats.median1Y = round2(medianFn(fwd1s));
            stats.median3Y = round2(medianFn(fwd3s));
            stats.median5Y = round2(medianFn(fwd5s));
            stats.periods.sort((a, b) => b.startDate.localeCompare(a.startDate));
            results.push(stats);
        }

        results.sort((a, b) => b.occurrences - a.occurrences);

        return NextResponse.json({ regimeReturns: results, asset: assetKey, assetLabel: assetConfig.label }, {
            headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
        });
    } catch (err) {
        console.error('regime/returns error', err);
        return NextResponse.json({ error: 'Failed to calculate regime returns' }, { status: 500 });
    }
}
