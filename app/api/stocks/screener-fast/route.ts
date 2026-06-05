/**
 * Fast screener bootstrap — returns top 50 by market cap immediately.
 * Only joins the two materialized views + StockProfile + annual_returns.
 * Used to render the initial skeleton with real data while the full query loads.
 */
import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export const dynamic = 'force-dynamic';

let cache: { data: unknown; ts: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

export async function GET() {
    try {
        const now = Date.now();
        if (cache && now - cache.ts < TTL_MS) {
            return NextResponse.json(cache.data);
        }

        const { rows } = await pool.query(`
            SELECT
                sp.symbol                       AS "Symbol",
                sp.company                      AS "Company",
                sp.sector                       AS "Sector",
                sp.industry                     AS "Industry",
                sp.exchange                     AS "Exchange",
                sp.currency                     AS "Currency",
                sp."yearEnd"                    AS "YearEnd",
                EXTRACT(YEAR FROM sp."ipoDate")::int AS "IPO",
                CASE WHEN sp."ipoDate" IS NOT NULL
                    THEN EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM sp."ipoDate")
                    ELSE NULL END::float         AS "YearsActive",
                sn.price::float                 AS "Price",
                sn."marketCap"::float / 1e6     AS "MarketCap",
                sp.shares::float / 1e6          AS "Shares",
                pd.dma_200::float               AS "Dma200",
                pd.dma_50::float                AS "Dma50",
                pd.slope_200::float             AS "Slope200",
                pd.slope_100::float             AS "Slope100",
                pd.slope_50::float              AS "Slope50",
                pd.div_50_200::float            AS "Div50200",
                pd."daysAbove200MA"             AS "DaysAbove200",
                pd.rsi14::float                 AS "Rsi14",
                ar2026.return::float            AS "Return2026",
                ar2025.return::float            AS "Return2025",
                ar2024.return::float            AS "Return2024",
                ar2023.return::float            AS "Return2023",
                ar2022.return::float            AS "Return2022",
                NULL::float                     AS "TtmRevenue",
                NULL::float                     AS "TtmNetIncome",
                NULL::float                     AS "Rev2025",
                NULL::float                     AS "Rev2024",
                NULL::float                     AS "Rev2023",
                NULL::float                     AS "RevGrowth2025",
                NULL::float                     AS "RevGrowth2024",
                NULL::float                     AS "NetMargin2024",
                NULL::float                     AS "PS_TTM",
                NULL::float                     AS "PE_TTM"
            FROM "StockProfile" sp
            JOIN mv_latest_snapshot sn ON sn.symbol = sp.symbol
            LEFT JOIN mv_latest_divergence pd ON pd.symbol = sp.symbol
            LEFT JOIN annual_returns ar2026 ON ar2026.symbol = sp.symbol AND ar2026.year = 2026
            LEFT JOIN annual_returns ar2025 ON ar2025.symbol = sp.symbol AND ar2025.year = 2025
            LEFT JOIN annual_returns ar2024 ON ar2024.symbol = sp.symbol AND ar2024.year = 2024
            LEFT JOIN annual_returns ar2023 ON ar2023.symbol = sp.symbol AND ar2023.year = 2023
            LEFT JOIN annual_returns ar2022 ON ar2022.symbol = sp.symbol AND ar2022.year = 2022
            ORDER BY sn."marketCap" DESC NULLS LAST
            LIMIT 200
        `);

        cache = { data: rows, ts: now };
        return NextResponse.json(rows);
    } catch (err) {
        console.error('Fast screener error:', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
