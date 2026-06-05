/**
 * GET /api/regime/period-chart?start=YYYY-MM-DD&end=YYYY-MM-DD&padding=90
 *
 * Returns raw daily SPX and NDX prices for a window around a regime period.
 * `padding` is extra days to show before start and after end (default 90).
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/db';

interface PriceRow { date: string; value: number; }

function shiftDate(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

export async function GET(req: NextRequest) {
    const start = req.nextUrl.searchParams.get('start');
    const end = req.nextUrl.searchParams.get('end');
    const padding = parseInt(req.nextUrl.searchParams.get('padding') ?? '90');

    if (!start || !end) {
        return NextResponse.json({ error: 'start and end params required' }, { status: 400 });
    }

    const windowStart = shiftDate(start, -padding);
    const today = new Date().toISOString().split('T')[0];
    const windowEnd = (end === 'Current' || end > today) ? today : shiftDate(end, padding);

    try {
        const [spxRes, ndxRes] = await Promise.all([
            pool.query<PriceRow>(
                `SELECT date::text, value
                 FROM macro_time_series
                 WHERE series_name = 'US/GSPC' AND asset_class = 'equities' AND column_name = 'Value'
                   AND date BETWEEN $1 AND $2
                 ORDER BY date ASC`,
                [windowStart, windowEnd],
            ),
            pool.query<PriceRow>(
                `SELECT date::text, value
                 FROM macro_time_series
                 WHERE series_name = 'NDX' AND asset_class = 'equities' AND column_name = 'Value'
                   AND date BETWEEN $1 AND $2
                 ORDER BY date ASC`,
                [windowStart, windowEnd],
            ),
        ]);

        const allDates = [...new Set([
            ...spxRes.rows.map(r => r.date),
            ...ndxRes.rows.map(r => r.date),
        ])].sort();

        const spxMap = new Map(spxRes.rows.map(r => [r.date, r.value]));
        const ndxMap = new Map(ndxRes.rows.map(r => [r.date, r.value]));
        const regimeEnd = end === 'Current' ? today : end;

        const prices = allDates.map(date => ({
            date,
            spx: spxMap.has(date) ? Math.round(spxMap.get(date)! * 100) / 100 : null,
            ndx: ndxMap.has(date) ? Math.round(ndxMap.get(date)! * 100) / 100 : null,
            inRegime: date >= start && date <= regimeEnd,
        }));

        return NextResponse.json({
            prices,
            regimeStart: start,
            regimeEnd,
            windowStart,
            windowEnd,
        }, {
            headers: { 'Cache-Control': 'public, max-age=3600' },
        });
    } catch (err) {
        console.error('period-chart error', err);
        return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
    }
}
