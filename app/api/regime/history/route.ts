import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

interface RegimePeriod {
    regime: string;
    startDate: string;
    endDate: string;
    months: number;
}

export async function GET() {
    try {
        const { rows } = await pool.query<{ date: string; regime: string; entry_date: string }>(
            `SELECT date::text as date, regime, entry_date::text as entry_date
             FROM macro_regime_timeline
             ORDER BY date ASC`,
        );

        const periods: RegimePeriod[] = [];
        let currentPeriod: RegimePeriod | null = null;

        for (const row of rows) {
            if (!currentPeriod || currentPeriod.regime !== row.regime) {
                if (currentPeriod) periods.push(currentPeriod);
                currentPeriod = {
                    regime: row.regime,
                    startDate: row.entry_date,
                    endDate: row.date,
                    months: 1,
                };
            } else {
                currentPeriod.endDate = row.date;
                currentPeriod.months++;
            }
        }

        if (currentPeriod) {
            const lastDate = new Date(currentPeriod.endDate);
            const now = new Date();
            if ((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24) < 60) {
                currentPeriod.endDate = 'Current';
            }
            periods.push(currentPeriod);
        }

        return NextResponse.json({ periods }, {
            headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
        });
    } catch (err) {
        console.error('regime/history error', err);
        return NextResponse.json({ error: 'Failed to fetch regime history' }, { status: 500 });
    }
}
