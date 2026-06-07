import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export const dynamic = 'force-dynamic';

// Which bubble → which DB series + date range
const BUBBLE_CONFIG: Record<string, { series: string; startDate: string; endDate: string }> = {
    'dow-1929': { series: 'DJI', startDate: '1925-01-01', endDate: '1932-12-31' },
    'japan-1989': { series: 'N225', startDate: '1984-01-01', endDate: '1993-12-31' },
    'dotcom-2000': { series: 'US/IXIC', startDate: '1994-01-01', endDate: '2003-12-31' },
};

export async function GET(req: NextRequest) {
    const bubble = req.nextUrl.searchParams.get('bubble');

    if (!bubble || !BUBBLE_CONFIG[bubble]) {
        return NextResponse.json({ error: 'Invalid bubble. Use: dow-1929, japan-1989, dotcom-2000' }, { status: 400 });
    }

    const { series, startDate, endDate } = BUBBLE_CONFIG[bubble];

    try {
        // We need extra history before startDate to warm up the 500D MA window.
        // 500 trading days ≈ 2 years — so pull 3 years before startDate.
        const warmupStart = new Date(startDate);
        warmupStart.setFullYear(warmupStart.getFullYear() - 3);
        const warmupStartStr = warmupStart.toISOString().split('T')[0];

        const { rows } = await pool.query<{ date: string; value: number }>(
            `SELECT date::text AS date, value
             FROM macro_time_series
             WHERE series_name = $1
               AND column_name = 'Value'
               AND date >= $2
               AND date <= $3
             ORDER BY date ASC`,
            [series, warmupStartStr, endDate],
        );

        if (rows.length === 0) {
            return NextResponse.json({ data: [] });
        }

        // Compute MAs in JS using a sliding window
        const MA_WINDOWS = [50, 100, 200, 500];

        const all = rows.map((r, i) => {
            const mas: Record<string, number | null> = {};
            for (const w of MA_WINDOWS) {
                if (i + 1 >= w) {
                    const slice = rows.slice(i - w + 1, i + 1);
                    mas[`ma${w}`] = slice.reduce((s, r2) => s + r2.value, 0) / w;
                } else {
                    mas[`ma${w}`] = null;
                }
            }
            return { date: r.date, value: r.value, ...mas };
        });

        // Only return rows within the actual requested window (strip warmup)
        const data = all.filter(r => r.date >= startDate);

        return NextResponse.json({ data, series }, {
            headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600' },
        });
    } catch (err) {
        console.error('mega-bubble error', err);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
