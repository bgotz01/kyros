import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

const PIVOT_SERIES = [
    'Real-Earnings-Yield-5yr',
    'Earnings-Yield-Premium-5yr',
    'Real-M2-YoY',
    'Real-3M',
    'Real-10Y',
];

const KEY_MAP: Record<string, string> = {
    'Real-Earnings-Yield-5yr': 'rey5yr',
    'Earnings-Yield-Premium-5yr': 'eyp5yr',
    'Real-M2-YoY': 'realm2yoy',
    'Real-3M': 'realyield3m',
    'Real-10Y': 'realyield',
};

export async function GET() {
    try {
        const { rows } = await pool.query(
            `SELECT date::text as date, series_name, value, percentile_rank, yoy_percentile_change
             FROM macro_percentile_analysis
             WHERE series_name = ANY($1) AND column_name = 'Value'
             ORDER BY date ASC`,
            [PIVOT_SERIES],
        );

        const dateMap = new Map<string, Record<string, unknown>>();
        for (const row of rows) {
            if (!dateMap.has(row.date)) dateMap.set(row.date, { date: row.date });
            const key = KEY_MAP[row.series_name];
            if (key) {
                const entry = dateMap.get(row.date)!;
                entry[`${key}_value`] = row.value;
                entry[`${key}_percentile`] = row.percentile_rank;
                entry[`${key}_yoy`] = row.yoy_percentile_change;
            }
        }

        return NextResponse.json({ data: Array.from(dateMap.values()) }, {
            headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
        });
    } catch (err) {
        console.error('regime/percentile-history error', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
