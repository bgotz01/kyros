import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export const dynamic = 'force-dynamic';

const SERIES = [
    { asset_class: 'economic', series_name: 'US/FEDFUNDS', key: 'fedFunds' },
    { asset_class: 'bonds', series_name: 'US/IRX-Monthly', key: 'irx' },
    { asset_class: 'bonds', series_name: 'US/TNX-Monthly', key: 'tnx' },
    { asset_class: 'economic', series_name: 'CPI', key: 'cpi' },
    { asset_class: 'derived', series_name: 'Earnings-Yield-Premium-5yr', key: 'eyp5yr' },
    { asset_class: 'derived', series_name: 'Real-Earnings-Yield-5yr', key: 'rey5yr' },
    { asset_class: 'derived', series_name: 'Real-10Y', key: 'real10Y' },
    { asset_class: 'derived', series_name: 'Real-3M', key: 'real3M' },
    { asset_class: 'economic', series_name: 'Real-M2-YoY', key: 'realM2' },
    { asset_class: 'derived', series_name: 'Yield-Curve-10Y-3M', key: 'yieldCurve' },
    { asset_class: 'valuations', series_name: 'PE-5yr', key: 'pe5yr' },
    { asset_class: 'valuations', series_name: 'Earnings-Yield-5yr', key: 'ey5yr' },
];

export async function GET(req: NextRequest) {
    const targetDate = req.nextUrl.searchParams.get('date') || 'latest';

    try {
        const names = SERIES.map(s => s.series_name);

        let rows: { asset_class: string; series_name: string; date: string; value: number; percentile_rank: number | null }[];

        if (targetDate === 'latest') {
            // Get reference date first
            const refRes = await pool.query<{ date: string }>(
                `SELECT date::text as date FROM macro_percentile_analysis
                 WHERE asset_class = 'derived' AND series_name = 'Real-Earnings-Yield-5yr'
                 ORDER BY date DESC LIMIT 1`,
            );
            const refDate = refRes.rows[0]?.date;

            const q = refDate
                ? `SELECT DISTINCT ON (asset_class, series_name) asset_class, series_name, date::text as date, value, percentile_rank
                   FROM macro_percentile_analysis
                   WHERE series_name = ANY($1) AND date <= $2
                   ORDER BY asset_class, series_name, date DESC`
                : `SELECT DISTINCT ON (asset_class, series_name) asset_class, series_name, date::text as date, value, percentile_rank
                   FROM macro_percentile_analysis
                   WHERE series_name = ANY($1)
                   ORDER BY asset_class, series_name, date DESC`;

            const res = await pool.query(q, refDate ? [names, refDate] : [names]);
            rows = res.rows;
        } else {
            const res = await pool.query(
                `SELECT DISTINCT ON (asset_class, series_name) asset_class, series_name, date::text as date, value, percentile_rank
                 FROM macro_percentile_analysis
                 WHERE series_name = ANY($1) AND LEFT(date::text, 7) = LEFT($2, 7)
                 ORDER BY asset_class, series_name, date DESC`,
                [names, targetDate],
            );
            rows = res.rows;
        }

        const map = new Map(rows.map(r => [`${r.asset_class}::${r.series_name}`, r]));
        const result: Record<string, { value: number; percentile: number | null; date: string } | null> = {};
        for (const s of SERIES) {
            const r = map.get(`${s.asset_class}::${s.series_name}`);
            result[s.key] = r ? { value: r.value, percentile: r.percentile_rank, date: r.date } : null;
        }

        return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
    } catch (err) {
        console.error('regime/data error', err);
        return NextResponse.json({ error: 'Failed to fetch regime data' }, { status: 500 });
    }
}
