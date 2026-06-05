/**
 * Stock screen queries — powers the /stocks index page
 */

import pool from '../db';

export interface TopStockRow {
    rank: number;
    symbol: string;
    company: string | null;
    sector: string | null;
    date: string;
    price: number;
    marketCap: number;
    ytdReturn: number | null;
    oneYearReturn: number | null;
}

const CURRENT_YEAR = new Date().getFullYear();

export async function getTopStocksByMarketCap(limit = 30): Promise<TopStockRow[]> {
    const { rows } = await pool.query(
        `WITH latest_snap AS (
           SELECT DISTINCT ON (symbol) symbol, date, price, "marketCap"
           FROM stock_snapshot
           WHERE "marketCap" IS NOT NULL
           ORDER BY symbol, date DESC
         ),
         top_n AS (
           SELECT symbol, date, price, "marketCap"
           FROM latest_snap
           ORDER BY "marketCap" DESC
           LIMIT $1
         ),
         ytd AS (
           SELECT symbol, "return" AS ytd_return
           FROM annual_returns
           WHERE year = $2
         ),
         one_year AS (
           SELECT symbol, "return" AS one_year_return
           FROM annual_returns
           WHERE year = $3
         )
         SELECT
           ROW_NUMBER() OVER (ORDER BY t."marketCap" DESC)::int AS rank,
           t.symbol,
           p.company,
           p.sector,
           t.date::text   AS date,
           t.price::float AS price,
           t."marketCap"::float AS "marketCap",
           y.ytd_return::float   AS "ytdReturn",
           oy.one_year_return::float AS "oneYearReturn"
         FROM top_n t
         LEFT JOIN "StockProfile" p ON p.symbol = t.symbol
         LEFT JOIN ytd  y  ON y.symbol  = t.symbol
         LEFT JOIN one_year oy ON oy.symbol = t.symbol
         ORDER BY t."marketCap" DESC`,
        [limit, CURRENT_YEAR, CURRENT_YEAR - 1],
    );
    return rows as TopStockRow[];
}
