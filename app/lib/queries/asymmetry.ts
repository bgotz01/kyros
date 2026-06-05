/**
 * Asymmetry queries — powers Achilles
 *
 * Positioning (CFTC COT), market breadth fragility signals,
 * concentration risk, insider activity.
 */

import pool from '../db';

export interface COTSnapshot {
    commodity: string;
    marketName: string;
    reportDate: string;
    openInterest: number | null;
    mMoneyNet: number | null;
    mMoneyLong: number | null;
    mMoneyShort: number | null;
    commercialNet: number | null;
    speculativeNet: number | null;
}

export interface InsiderActivity {
    symbol: string;
    insider: string;
    relation: string | null;
    transaction: string | null;
    shares: number | null;
    value: number | null;
    tradeDate: string;
}

/** Latest COT positioning for key markets */
export async function getCOTPositioning(
    commodities?: string[],
): Promise<COTSnapshot[]> {
    const query = commodities?.length
        ? `SELECT DISTINCT ON (commodity)
         commodity,
         "marketName",
         "reportDate"::text AS "reportDate",
         "openInterest",
         "mMoneyNet",
         "mMoneyLong",
         "mMoneyShort",
         "commercialNet",
         "speculativeNet"
       FROM cftc_cot
       WHERE commodity = ANY($1)
       ORDER BY commodity, "reportDate" DESC`
        : `SELECT DISTINCT ON (commodity)
         commodity,
         "marketName",
         "reportDate"::text AS "reportDate",
         "openInterest",
         "mMoneyNet",
         "mMoneyLong",
         "mMoneyShort",
         "commercialNet",
         "speculativeNet"
       FROM cftc_cot
       ORDER BY commodity, "reportDate" DESC
       LIMIT 20`;

    const { rows } = await pool.query<COTSnapshot>(
        query,
        commodities?.length ? [commodities] : [],
    );
    return rows;
}

/** Recent insider transactions — large sells can signal fragility */
export async function getInsiderActivity(
    symbol?: string,
    limit = 20,
): Promise<InsiderActivity[]> {
    const { rows } = await pool.query<InsiderActivity>(
        `SELECT
       symbol,
       insider,
       relation,
       transaction,
       shares,
       value,
       "tradeDate"::text AS "tradeDate"
     FROM insider_activity
     WHERE ($1::text IS NULL OR symbol = $1)
     ORDER BY "tradeDate" DESC
     LIMIT $2`,
        [symbol?.toUpperCase() ?? null, limit],
    );
    return rows;
}

/** Breadth divergence — when index is up but breadth is deteriorating */
export async function getBreadthDivergence() {
    const { rows } = await pool.query(
        `SELECT DISTINCT ON (index)
       date::text            AS date,
       index,
       "percentAbove50DMA"   AS "pct50",
       "percentAbove200DMA"  AS "pct200",
       "totalStocks"
     FROM market_breadth
     ORDER BY index, date DESC`,
    );
    return rows;
}

/** ETF concentration — top holdings of key ETFs as crowding proxy */
export async function getETFConcentration(etfSymbol: string, limit = 10) {
    const { rows } = await pool.query(
        `SELECT
       eh.symbol,
       eh.name,
       eh.weight,
       eh."marketValue"
     FROM etf_holdings eh
     WHERE eh."etfSymbol" = $1
     ORDER BY eh.weight DESC
     LIMIT $2`,
        [etfSymbol.toUpperCase(), limit],
    );
    return rows;
}
