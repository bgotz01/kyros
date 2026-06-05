import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { rows } = await pool.query(
            `SELECT date::text as date, regime
             FROM macro_regime_timeline
             ORDER BY date ASC`,
        );
        return NextResponse.json({ data: rows }, {
            headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
        });
    } catch (err) {
        console.error('regime/timeline error', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
