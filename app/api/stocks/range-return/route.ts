import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
        return NextResponse.json({ error: 'startDate and endDate required' }, { status: 400 });
    }

    try {
        // Snap dates to nearest trading days
        const { rows: startRows } = await pool.query(
            `SELECT date::text FROM historical_prices WHERE date >= $1 ORDER BY date ASC LIMIT 1`,
            [startDate],
        );
        const { rows: endRows } = await pool.query(
            `SELECT date::text FROM historical_prices WHERE date <= $1 ORDER BY date DESC LIMIT 1`,
            [endDate],
        );

        if (!startRows[0] || !endRows[0]) {
            return NextResponse.json({ error: 'No price data for given range' }, { status: 404 });
        }

        const snappedStart = startRows[0].date.slice(0, 10);
        const snappedEnd = endRows[0].date.slice(0, 10);

        // Compute returns in one query
        const { rows } = await pool.query(
            `SELECT
               e.symbol,
               (e.close::float - s.close::float) / s.close::float AS "return"
             FROM historical_prices s
             JOIN historical_prices e
               ON e.symbol = s.symbol AND e.date = $2
             WHERE s.date = $1
               AND s.close IS NOT NULL
               AND e.close IS NOT NULL
               AND s.close > 0`,
            [snappedStart, snappedEnd],
        );

        const returns: Record<string, number> = {};
        for (const r of rows) returns[r.symbol] = r.return;

        return NextResponse.json({ startDate: snappedStart, endDate: snappedEnd, returns });
    } catch (err) {
        console.error('Range return error:', err);
        return NextResponse.json({ error: 'Failed to compute returns' }, { status: 500 });
    }
}
