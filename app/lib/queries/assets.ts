/**
 * Asset queries — powers Sigma
 *
 * Stock profiles, price divergence/momentum, fundamentals,
 * market breadth at the individual stock level.
 */

import pool from '../db';

export interface StockProfile {
    symbol: string;
    company: string;
    sector: string | null;
    industry: string | null;
    exchange: string | null;
}

export interface MomentumSnapshot {
    symbol: string;
    date: string;
    dma20: number | null;
    dma50: number | null;
    dma200: number | null;
    ma50: number | null;
    ma200: number | null;
    rsi14: number | null;
    daysAbove200MA: number | null;
    ratioSPY: number | null;
    ratioQQQ: number | null;
}

export interface Fundamentals {
    symbol: string;
    year: number;
    revenue: number | null;
    netIncome: number | null;
    ebitda: number | null;
    fcf: number | null;
}

/** Single stock profile */
export async function getStockProfile(symbol: string): Promise<StockProfile | null> {
    const { rows } = await pool.query<StockProfile>(
        `SELECT symbol, company, sector, industry, exchange
     FROM "StockProfile"
     WHERE symbol = $1`,
        [symbol.toUpperCase()],
    );
    return rows[0] ?? null;
}

/** Latest momentum snapshot for a ticker */
export async function getMomentumSnapshot(symbol: string): Promise<MomentumSnapshot | null> {
    const { rows } = await pool.query<MomentumSnapshot>(
        `SELECT
       symbol,
       date::text   AS date,
       dma_20       AS "dma20",
       dma_50       AS "dma50",
       dma_200      AS "dma200",
       ma_50        AS "ma50",
       ma_200       AS "ma200",
       rsi14,
       "daysAbove200MA",
       "ratioSPY",
       "ratioQQQ"
     FROM price_divergence
     WHERE symbol = $1
     ORDER BY date DESC
     LIMIT 1`,
        [symbol.toUpperCase()],
    );
    return rows[0] ?? null;
}

/** Momentum for a list of tickers — useful for screener-style queries */
export async function getMomentumForTickers(
    symbols: string[],
): Promise<MomentumSnapshot[]> {
    const { rows } = await pool.query<MomentumSnapshot>(
        `SELECT DISTINCT ON (symbol)
       symbol,
       date::text   AS date,
       dma_20       AS "dma20",
       dma_50       AS "dma50",
       dma_200      AS "dma200",
       ma_50        AS "ma50",
       ma_200       AS "ma200",
       rsi14,
       "daysAbove200MA",
       "ratioSPY",
       "ratioQQQ"
     FROM price_divergence
     WHERE symbol = ANY($1)
     ORDER BY symbol, date DESC`,
        [symbols.map((s) => s.toUpperCase())],
    );
    return rows;
}

/** Annual income statement data */
export async function getFundamentals(symbol: string, years = 5): Promise<Fundamentals[]> {
    const { rows } = await pool.query<Fundamentals>(
        `SELECT symbol, year, revenue, "netIncome", ebitda, fcf
     FROM income_statements
     WHERE symbol = $1
     ORDER BY year DESC
     LIMIT $2`,
        [symbol.toUpperCase(), years],
    );
    return rows;
}

/** Most recent quarterly financials */
export async function getQuarterlyFinancials(symbol: string, quarters = 8) {
    const { rows } = await pool.query(
        `SELECT
       symbol,
       "quarterEnd"::text,
       revenue,
       "netIncome",
       ebitda,
       "grossMargin",
       "operatingMargin",
       "netMargin",
       "revenueGrowthYoY",
       eps
     FROM quarterly_financials
     WHERE symbol = $1
     ORDER BY "quarterEnd" DESC
     LIMIT $2`,
        [symbol.toUpperCase(), quarters],
    );
    return rows;
}

/** Top S&P 500 stocks by momentum (% above 200 DMA, sorted desc) */
export async function getTopMomentumStocks(limit = 20) {
    const result = await pool.query(
        `SELECT DISTINCT ON (pd.symbol)
       pd.symbol,
       sp.company,
       sp.sector,
       pd.date::text       AS date,
       pd.dma_200          AS "dma200",
       pd.rsi14,
       pd."daysAbove200MA",
       pd."ratioSPY"
     FROM price_divergence pd
     JOIN sp500_constituents sc ON sc.symbol = pd.symbol
     LEFT JOIN "StockProfile" sp ON sp.symbol = pd.symbol
     ORDER BY pd.symbol, pd.date DESC`,
    );
    return result.rows
        .sort((a: { dma200?: number }, b: { dma200?: number }) => (b.dma200 ?? 0) - (a.dma200 ?? 0))
        .slice(0, limit);
}
