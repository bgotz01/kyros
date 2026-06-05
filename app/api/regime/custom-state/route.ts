import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { determineNextRegime, type RegimeState, type CurrentConditions } from '@/app/lib/regime-state-machine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { targetDate } = await req.json();
        const dateClause = targetDate && targetDate !== 'latest' ? `AND r.date <= '${targetDate}'` : '';

        const { rows } = await pool.query(
            `SELECT r.date::text as date, r.value as rey, e.value as eyp, t.value as real10y, m3.value as real3m, m2.value as "realM2"
             FROM macro_percentile_analysis r
             LEFT JOIN macro_percentile_analysis e  ON r.date = e.date  AND e.asset_class = 'derived'   AND e.series_name = 'Earnings-Yield-Premium-5yr'
             LEFT JOIN macro_percentile_analysis t  ON r.date = t.date  AND t.asset_class = 'derived'   AND t.series_name = 'Real-10Y'
             LEFT JOIN macro_percentile_analysis m3 ON r.date = m3.date AND m3.asset_class = 'derived'  AND m3.series_name = 'Real-3M'
             LEFT JOIN macro_percentile_analysis m2 ON r.date = m2.date AND m2.asset_class = 'economic' AND m2.series_name = 'Real-M2-YoY'
             WHERE r.asset_class = 'derived' AND r.series_name = 'Real-Earnings-Yield-5yr' ${dateClause}
             ORDER BY r.date ASC`,
        );

        let current: RegimeState | null = null;
        for (const row of rows) {
            const conds: CurrentConditions = {
                rey: row.rey, eyp: row.eyp, real10Y: row.real10y,
                real3M: row.real3m, realM2: row.realM2,
                liquidityScore: 0, stage: 'N/A', pressure: 'N/A', risk: 'N/A', direction: 'N/A', trendAge: null,
            };
            current = determineNextRegime(current, conds, row.date);
        }

        if (!current || rows.length === 0) {
            return NextResponse.json({ regime: 'None', entryDate: '', currentDate: '', daysInRegime: 0, triggerReason: 'No data' });
        }

        const last = rows[rows.length - 1];
        const entry = new Date(current.entryDate);
        const latest = new Date(last.date);
        const months = (latest.getFullYear() - entry.getFullYear()) * 12 + (latest.getMonth() - entry.getMonth());

        return NextResponse.json({
            regime: current.regime,
            entryDate: current.entryDate,
            currentDate: last.date,
            daysInRegime: months,
            triggerReason: current.triggerReason,
        }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (err) {
        console.error('regime/custom-state error', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
