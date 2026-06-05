/**
 * Regime queries — powers Atlas
 *
 * Uses macro_regime_timeline (pre-computed classifications) and
 * macro_series / macro_data for raw signals.
 */

import pool from '../db';

export interface RegimeSnapshot {
    date: string;
    regime: string;
    entryDate: string;
    triggerReason: string;
    liquidityScore: number | null;
    rey: number | null;
    eyp: number | null;
    real10Y: number | null;
    real3M: number | null;
    realM2: number | null;
}

export interface MacroSignal {
    symbol: string;
    name: string;
    category: string;
    date: string;
    value: number | null;
    ma50: number | null;
    ma200: number | null;
    dma200: number | null;
    rsi14: number | null;
}

export interface MarketBreadth {
    date: string;
    index: string;
    percentAbove50DMA: number;
    percentAbove200DMA: number;
    totalStocks: number;
}

/** Current and recent regime history */
export async function getRegimeTimeline(limit = 12): Promise<RegimeSnapshot[]> {
    const { rows } = await pool.query<RegimeSnapshot>(
        `SELECT
       date,
       regime,
       entry_date    AS "entryDate",
       trigger_reason AS "triggerReason",
       liquidity_score AS "liquidityScore",
       rey,
       eyp,
       "real10Y",
       "real3M",
       "realM2"
     FROM macro_regime_timeline
     ORDER BY date DESC
     LIMIT $1`,
        [limit],
    );
    return rows;
}

/** Latest regime entry */
export async function getCurrentRegime(): Promise<RegimeSnapshot | null> {
    const rows = await getRegimeTimeline(1);
    return rows[0] ?? null;
}

/** Key macro signals: yields, VIX, SP500, USD index */
export async function getMacroSignals(
    symbols = ['US_10Y', 'US_2Y', 'US_3M', 'VIX', 'SP500', 'GOLD'],
): Promise<MacroSignal[]> {
    const { rows } = await pool.query<MacroSignal>(
        `SELECT
       ms.symbol,
       ms.name,
       ms.category,
       md.date::text  AS date,
       md.value,
       md.ma50,
       md.ma200,
       md.dma_200     AS "dma200",
       md.rsi14
     FROM macro_series ms
     JOIN macro_data md ON md."seriesId" = ms.id
     WHERE ms.symbol = ANY($1)
       AND md.date = (
         SELECT MAX(d2.date) FROM macro_data d2 WHERE d2."seriesId" = ms.id
       )
     ORDER BY ms.category, ms.symbol`,
        [symbols],
    );
    return rows;
}

/** Market breadth — latest for each tracked index */
export async function getMarketBreadth(): Promise<MarketBreadth[]> {
    const { rows } = await pool.query<MarketBreadth>(
        `SELECT DISTINCT ON (index)
       date::text   AS date,
       index,
       "percentAbove50DMA",
       "percentAbove200DMA",
       "totalStocks"
     FROM market_breadth
     ORDER BY index, date DESC`,
    );
    return rows;
}

/** Yield curve snapshot: 3M, 2Y, 10Y, 30Y */
export async function getYieldCurve(): Promise<{ symbol: string; name: string; value: number; date: string }[]> {
    const { rows } = await pool.query(
        `SELECT
       ms.symbol,
       ms.name,
       md.value,
       md.date::text AS date
     FROM macro_series ms
     JOIN macro_data md ON md."seriesId" = ms.id
     WHERE ms.symbol IN ('US_3M', 'US_2Y', 'US_10Y', 'US_30Y')
       AND ms.category = 'YIELD'
       AND md.date = (
         SELECT MAX(d2.date) FROM macro_data d2 WHERE d2."seriesId" = ms.id
       )
     ORDER BY ms.symbol`,
    );
    return rows;
}
