import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export const dynamic = 'force-dynamic';

const TARGET_QUARTERS = 6;

export async function GET() {
    try {
        const { rows: topQuarters } = await pool.query<{
            fiscalYear: number; fiscalQuarter: number; cnt: string;
        }>(
            `SELECT "fiscalYear", "fiscalQuarter", COUNT(*) AS cnt
             FROM quarterly_financials
             WHERE ("revenueGrowthYoY" IS NOT NULL OR "netMargin" IS NOT NULL)
               AND "fiscalYear" >= 2023
             GROUP BY "fiscalYear", "fiscalQuarter"
             HAVING COUNT(*) >= 200
             ORDER BY "fiscalYear" DESC, "fiscalQuarter" DESC
             LIMIT $1`,
            [TARGET_QUARTERS],
        );

        if (topQuarters.length === 0) return NextResponse.json({ data: {}, yoyColumns: [], nmColumns: [] });

        const conditions = topQuarters
            .map((q) => `("fiscalYear" = ${q.fiscalYear} AND "fiscalQuarter" = ${q.fiscalQuarter})`)
            .join(' OR ');

        const { rows } = await pool.query<{
            symbol: string; fiscalYear: number; fiscalQuarter: number;
            revenueGrowthYoY: number | null; netMargin: number | null;
        }>(
            `SELECT symbol, "fiscalYear", "fiscalQuarter", "revenueGrowthYoY"::float, "netMargin"::float
             FROM quarterly_financials
             WHERE ${conditions}`,
        );

        const result: Record<string, Record<string, number>> = {};
        for (const row of rows) {
            const { symbol, fiscalYear, fiscalQuarter, revenueGrowthYoY, netMargin } = row;
            const yr = String(fiscalYear).slice(2);
            const prefix = `Q${fiscalQuarter}_FY${yr}`;
            if (!result[symbol]) result[symbol] = {};
            if (revenueGrowthYoY !== null) result[symbol][`${prefix}_YoY`] = revenueGrowthYoY;
            if (netMargin !== null) result[symbol][`${prefix}_NM`] = netMargin;
        }

        const yoyColumns = topQuarters.map((q) => `Q${q.fiscalQuarter}_FY${String(q.fiscalYear).slice(2)}_YoY`);
        const nmColumns = topQuarters.map((q) => `Q${q.fiscalQuarter}_FY${String(q.fiscalYear).slice(2)}_NM`);

        return NextResponse.json({ data: result, yoyColumns, nmColumns });
    } catch (err) {
        console.error('Quarterly growth error:', err);
        return NextResponse.json({ error: 'Failed to load quarterly data' }, { status: 500 });
    }
}
