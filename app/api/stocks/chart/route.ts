import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export const dynamic = 'force-dynamic';

const RANGE_MAP: Record<string, number> = {
    '1y': 365,
    '2y': 365 * 2,
    '5y': 365 * 5,
    '10y': 365 * 10,
    'max': 0,
};

export async function GET(req: NextRequest) {
    const symbol = req.nextUrl.searchParams.get('symbol')?.toUpperCase();
    const range = req.nextUrl.searchParams.get('range') ?? '2y';

    if (!symbol) {
        return NextResponse.json({ error: 'symbol required' }, { status: 400 });
    }

    const days = RANGE_MAP[range] ?? RANGE_MAP['2y'];
    const fromDate = days > 0
        ? new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10)
        : '1900-01-01';

    try {
        const { rows } = await pool.query<{
            date: string;
            open: number;
            high: number;
            low: number;
            close: number;
            volume: string;
            ma20: number | null;
            ma50: number | null;
            ma100: number | null;
            ma200: number | null;
            ma500: number | null;
            rsi14: number | null;
            ratioSpy: number | null;
            ratioQqq: number | null;
        }>(
            `SELECT
                hp.date::text                   AS date,
                hp.open::float                  AS open,
                hp.high::float                  AS high,
                hp.low::float                   AS low,
                hp.close::float                 AS close,
                hp.volume::text                 AS volume,
                pd.ma_20                        AS ma20,
                pd.ma_50                        AS ma50,
                pd.ma_100                       AS ma100,
                pd.ma_200                       AS ma200,
                pd.ma_500                       AS ma500,
                pd.rsi14                        AS rsi14,
                pd."ratioSPY"                   AS "ratioSpy",
                pd."ratioQQQ"                   AS "ratioQqq"
            FROM historical_prices hp
            LEFT JOIN price_divergence pd
                ON pd.symbol = hp.symbol AND pd.date = hp.date
            WHERE hp.symbol = $1
              AND hp.date >= $2
            ORDER BY hp.date ASC`,
            [symbol, fromDate],
        );

        return NextResponse.json(
            { symbol, range, data: rows },
            { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' } },
        );
    } catch (err) {
        console.error('chart route error', err);
        return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
    }
}
