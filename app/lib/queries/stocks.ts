/**
 * Stock queries — powers the Stocks section
 *
 * Raw pg pool queries against the stockdata database.
 * All financial figures are in millions unless noted.
 */

import pool from '../db';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StockProfile {
    symbol: string;
    company: string | null;
    sector: string | null;
    industry: string | null;
    shares: string | null; // BigInt serialised as string
    impliedShares: string | null;
    ipoDate: string | null;
    currency: string | null;
    yearEnd: string | null;
    description: string | null;
    exchange: string | null;
}

export interface LatestPrice {
    symbol: string;
    date: string;
    close: number | null;
    open: number | null;
    high: number | null;
    low: number | null;
    volume: string | null;
}

export interface IncomeRow {
    year: number;
    currency: string | null;
    revenue: number | null;
    netIncome: number | null;
    ebitda: number | null;
    fcf: number | null;
    interestExpense: number | null;
    interestIncome: number | null;
    netInterest: number | null;
    sga: number | null;
}

export interface BalanceRow {
    year: number;
    currency: string | null;
    assets: number | null;
    cash: number | null;
    currentAssets: number | null;
    debt: number | null;
    netDebt: number | null;
    liabilities: number | null;
}

export interface SnapshotRow {
    year: number;
    marketCap: number | null; // raw value (not in millions)
}

export interface QuarterlyRow {
    quarterEnd: string;
    revenue: number | null;
    netIncome: number | null;
    ebitda: number | null;
    grossProfit: number | null;
    operatingIncome: number | null;
    eps: number | null;
    epsGrowth: number | null;
    revenueGrowthYoY: number | null;
    revenueGrowthQoQ: number | null;
    grossMargin: number | null;
    operatingMargin: number | null;
    netMargin: number | null;
    fiscalYear: number | null;
    fiscalQuarter: number | null;
    currency: string | null;
}

export interface TTMData {
    revenue: number | null;
    netIncome: number | null;
    ebitda: number | null;
    quarterCount: number;
    latestQuarter: string | null;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getStockProfile(symbol: string): Promise<StockProfile | null> {
    const { rows } = await pool.query<StockProfile>(
        `SELECT
       symbol,
       company,
       sector,
       industry,
       shares::text         AS shares,
       "impliedShares"::text AS "impliedShares",
       "ipoDate"::text       AS "ipoDate",
       currency,
       "yearEnd",
       description,
       exchange
     FROM "StockProfile"
     WHERE symbol = $1`,
        [symbol],
    );
    return rows[0] ?? null;
}

export async function getLatestPrice(symbol: string): Promise<LatestPrice | null> {
    const { rows } = await pool.query<LatestPrice>(
        `SELECT
       symbol,
       date::text   AS date,
       close::float AS close,
       open::float  AS open,
       high::float  AS high,
       low::float   AS low,
       volume::text AS volume
     FROM historical_prices
     WHERE symbol = $1
     ORDER BY date DESC
     LIMIT 1`,
        [symbol],
    );
    return rows[0] ?? null;
}

export async function getIncomeStatements(symbol: string): Promise<IncomeRow[]> {
    const { rows } = await pool.query<IncomeRow>(
        `SELECT
       year,
       currency,
       revenue::float         AS revenue,
       "netIncome"::float     AS "netIncome",
       ebitda::float          AS ebitda,
       fcf::float             AS fcf,
       "interestExpense"::float AS "interestExpense",
       "interestIncome"::float  AS "interestIncome",
       "netInterest"::float   AS "netInterest",
       sga::float             AS sga
     FROM income_statements
     WHERE symbol = $1
     ORDER BY year DESC`,
        [symbol],
    );
    return rows;
}

export async function getBalanceSheets(symbol: string): Promise<BalanceRow[]> {
    const { rows } = await pool.query<BalanceRow>(
        `SELECT
       year,
       currency,
       assets::float        AS assets,
       cash::float          AS cash,
       "currentAssets"::float AS "currentAssets",
       debt::float          AS debt,
       "netDebt"::float     AS "netDebt",
       liabilities::float   AS liabilities
     FROM balance_sheet
     WHERE symbol = $1
     ORDER BY year DESC`,
        [symbol],
    );
    return rows;
}

export async function getMarketCapSnapshots(symbol: string): Promise<SnapshotRow[]> {
    const { rows } = await pool.query<SnapshotRow>(
        `SELECT
       EXTRACT(YEAR FROM date)::int AS year,
       "marketCap"::float          AS "marketCap"
     FROM stock_snapshot
     WHERE symbol = $1
       AND "marketCap" IS NOT NULL
     ORDER BY date DESC`,
        [symbol],
    );
    // Deduplicate: keep latest per year
    const seen = new Set<number>();
    return rows.filter((r) => {
        if (seen.has(r.year)) return false;
        seen.add(r.year);
        return true;
    });
}

export async function getQuarterlyFinancials(
    symbol: string,
    limit = 20,
): Promise<QuarterlyRow[]> {
    const { rows } = await pool.query<QuarterlyRow>(
        `SELECT
       "quarterEnd"::text        AS "quarterEnd",
       revenue::float            AS revenue,
       "netIncome"::float        AS "netIncome",
       ebitda::float             AS ebitda,
       "grossProfit"::float      AS "grossProfit",
       "operatingIncome"::float  AS "operatingIncome",
       eps::float                AS eps,
       "epsGrowth"::float        AS "epsGrowth",
       "revenueGrowthYoY"::float AS "revenueGrowthYoY",
       "revenueGrowthQoQ"::float AS "revenueGrowthQoQ",
       "grossMargin"::float      AS "grossMargin",
       "operatingMargin"::float  AS "operatingMargin",
       "netMargin"::float        AS "netMargin",
       "fiscalYear",
       "fiscalQuarter",
       currency
     FROM quarterly_financials
     WHERE symbol = $1
     ORDER BY "quarterEnd" DESC
     LIMIT $2`,
        [symbol, limit],
    );
    return rows;
}

/** Compute TTM from the most recent 4 quarters */
export function computeTTM(quarters: QuarterlyRow[]): TTMData {
    if (quarters.length < 4) {
        return { revenue: null, netIncome: null, ebitda: null, quarterCount: quarters.length, latestQuarter: quarters[0]?.quarterEnd ?? null };
    }
    const last4 = quarters.slice(0, 4);
    return {
        revenue: last4.reduce((s, q) => s + (q.revenue ?? 0), 0),
        netIncome: last4.reduce((s, q) => s + (q.netIncome ?? 0), 0),
        ebitda: last4.some((q) => q.ebitda !== null)
            ? last4.reduce((s, q) => s + (q.ebitda ?? 0), 0)
            : null,
        quarterCount: 4,
        latestQuarter: last4[0].quarterEnd,
    };
}

/** Update shares/impliedShares for a symbol */
export async function updateShares(
    symbol: string,
    field: 'shares' | 'impliedShares',
    value: number | null,
): Promise<void> {
    const col = field === 'shares' ? 'shares' : '"impliedShares"';
    await pool.query(`UPDATE "StockProfile" SET ${col} = $1 WHERE symbol = $2`, [value, symbol]);
}
