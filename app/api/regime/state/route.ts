import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const targetDate = req.nextUrl.searchParams.get('date') || 'latest';

    try {
        const q = targetDate === 'latest'
            ? `SELECT date::text, regime, entry_date::text, trigger_reason, rey, eyp, "real10Y", "real3M", "realM2"
               FROM macro_regime_timeline ORDER BY date DESC LIMIT 1`
            : `SELECT date::text, regime, entry_date::text, trigger_reason, rey, eyp, "real10Y", "real3M", "realM2"
               FROM macro_regime_timeline WHERE date <= $1 ORDER BY date DESC LIMIT 1`;

        const { rows } = await pool.query(q, targetDate !== 'latest' ? [targetDate] : []);
        const row = rows[0];
        if (!row) return NextResponse.json({ error: 'No regime data' }, { status: 404 });

        const entry = new Date(row.entry_date);
        const current = new Date(row.date);
        const monthsInRegime = (current.getFullYear() - entry.getFullYear()) * 12 + (current.getMonth() - entry.getMonth());

        return NextResponse.json({
            regime: row.regime,
            entryDate: row.entry_date,
            currentDate: row.date,
            daysInRegime: monthsInRegime,
            triggerReason: row.trigger_reason,
            conditions: { rey: row.rey, eyp: row.eyp, real10Y: row.real10Y, real3M: row.real3m, realM2: row.realM2 },
        }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (err) {
        console.error('regime/state error', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
