/**
 * Stock screener master query
 *
 * Joins StockProfile + latest snapshot (price/mktcap) + latest price_divergence
 * + latest income/balance per year + TTM quarterly + annual returns.
 *
 * Returns one row per symbol with all screener columns pre-computed.
 */

import pool from '../db';

export interface ScreenerRow {
    // identity
    Symbol: string;
    Company: string | null;
    Sector: string | null;
    Industry: string | null;
    Exchange: string | null;
    Currency: string | null;
    YearEnd: string | null;
    IPO: number | null;
    YearsActive: number | null;

    // price
    Price: number | null;
    MarketCap: number | null; // $M
    Shares: number | null;

    // technical (from price_divergence)
    Dma200: number | null;      // price / 200-day MA  (ratio, e.g. 1.18)
    Dma50: number | null;
    Slope200: number | null;
    Slope100: number | null;
    Slope50: number | null;
    Div2050: number | null;     // div_20_200 from price_divergence
    Div50200: number | null;
    DaysAbove200: number | null;
    Rsi14: number | null;

    // annual returns (decimal)
    Return2020: number | null;
    Return2021: number | null;
    Return2022: number | null;
    Return2023: number | null;
    Return2024: number | null;
    Return2025: number | null;
    Return2026: number | null;

    // fundamentals — stored in millions
    TtmRevenue: number | null;
    TtmNetIncome: number | null;
    TtmEbitda: number | null;
    TtmRevGrowth: number | null;

    Rev2026: number | null; Rev2025: number | null; Rev2024: number | null;
    Rev2023: number | null; Rev2022: number | null; Rev2021: number | null; Rev2020: number | null;

    NI2026: number | null; NI2025: number | null; NI2024: number | null;
    NI2023: number | null; NI2022: number | null; NI2021: number | null;

    Ebitda2026: number | null; Ebitda2025: number | null; Ebitda2024: number | null;
    Ebitda2023: number | null; Ebitda2022: number | null;

    Fcf2025: number | null; Fcf2024: number | null; Fcf2023: number | null; Fcf2022: number | null;

    // derived — margins as whole-number % (e.g. 24.3)
    NetMargin2025: number | null; NetMargin2024: number | null;
    NetMargin2023: number | null; NetMargin2022: number | null;

    EbitdaMargin2025: number | null; EbitdaMargin2024: number | null;
    EbitdaMargin2023: number | null;

    // balance sheet
    Assets2025: number | null; Assets2024: number | null; Assets2023: number | null;
    Cash2025: number | null; Cash2024: number | null; Cash2023: number | null;
    Debt2025: number | null; Debt2024: number | null; Debt2023: number | null;
    NetDebt2025: number | null; NetDebt2024: number | null; NetDebt2023: number | null;
    Liabilities2025: number | null; Liabilities2024: number | null; Liabilities2023: number | null;

    // valuation
    PS_TTM: number | null;
    PE_TTM: number | null;
    PS2024: number | null;
    PE2024: number | null;

    // revenue growth (decimal, e.g. 0.12 = 12%)
    RevGrowth2025: number | null; RevGrowth2024: number | null;
    RevGrowth2023: number | null; RevGrowth2022: number | null;
}

const CUR_YEAR = 2025; // latest fully-populated year in income_statements

export async function getScreenerData(): Promise<ScreenerRow[]> {
    const { rows } = await pool.query(`
        WITH
        -- latest price + market cap per symbol (materialized view — instant lookup)
        snap AS (
            SELECT symbol, price::float AS price, "marketCap"::float AS mktcap
            FROM mv_latest_snapshot
        ),
        -- latest technical divergences per symbol (materialized view — instant lookup)
        pd AS (
            SELECT
                symbol,
                dma_200::float    AS dma200,
                dma_50::float     AS dma50,
                slope_200::float  AS slope200,
                slope_100::float  AS slope100,
                slope_50::float   AS slope50,
                div_20_200::float AS div2050,
                div_50_200::float AS div50200,
                "daysAbove200MA"  AS days200,
                rsi14::float      AS rsi14
            FROM mv_latest_divergence
        ),
        -- income statements pivoted (most recent 5 years)
        inc AS (
            SELECT symbol,
                MAX(CASE WHEN year = $1+1 THEN revenue::float END)   AS rev2026,
                MAX(CASE WHEN year = $1   THEN revenue::float END)   AS rev2025,
                MAX(CASE WHEN year = $1-1 THEN revenue::float END)   AS rev2024,
                MAX(CASE WHEN year = $1-2 THEN revenue::float END)   AS rev2023,
                MAX(CASE WHEN year = $1-3 THEN revenue::float END)   AS rev2022,
                MAX(CASE WHEN year = $1-4 THEN revenue::float END)   AS rev2021,
                MAX(CASE WHEN year = $1-5 THEN revenue::float END)   AS rev2020,
                MAX(CASE WHEN year = $1+1 THEN "netIncome"::float END) AS ni2026,
                MAX(CASE WHEN year = $1   THEN "netIncome"::float END) AS ni2025,
                MAX(CASE WHEN year = $1-1 THEN "netIncome"::float END) AS ni2024,
                MAX(CASE WHEN year = $1-2 THEN "netIncome"::float END) AS ni2023,
                MAX(CASE WHEN year = $1-3 THEN "netIncome"::float END) AS ni2022,
                MAX(CASE WHEN year = $1-4 THEN "netIncome"::float END) AS ni2021,
                MAX(CASE WHEN year = $1+1 THEN ebitda::float END)    AS ebitda2026,
                MAX(CASE WHEN year = $1   THEN ebitda::float END)    AS ebitda2025,
                MAX(CASE WHEN year = $1-1 THEN ebitda::float END)    AS ebitda2024,
                MAX(CASE WHEN year = $1-2 THEN ebitda::float END)    AS ebitda2023,
                MAX(CASE WHEN year = $1-3 THEN ebitda::float END)    AS ebitda2022,
                MAX(CASE WHEN year = $1   THEN fcf::float END)       AS fcf2025,
                MAX(CASE WHEN year = $1-1 THEN fcf::float END)       AS fcf2024,
                MAX(CASE WHEN year = $1-2 THEN fcf::float END)       AS fcf2023,
                MAX(CASE WHEN year = $1-3 THEN fcf::float END)       AS fcf2022
            FROM income_statements
            GROUP BY symbol
        ),
        -- balance sheet pivoted
        bal AS (
            SELECT symbol,
                MAX(CASE WHEN year = $1   THEN assets::float END)      AS assets2025,
                MAX(CASE WHEN year = $1-1 THEN assets::float END)      AS assets2024,
                MAX(CASE WHEN year = $1-2 THEN assets::float END)      AS assets2023,
                MAX(CASE WHEN year = $1   THEN cash::float END)        AS cash2025,
                MAX(CASE WHEN year = $1-1 THEN cash::float END)        AS cash2024,
                MAX(CASE WHEN year = $1-2 THEN cash::float END)        AS cash2023,
                MAX(CASE WHEN year = $1   THEN debt::float END)        AS debt2025,
                MAX(CASE WHEN year = $1-1 THEN debt::float END)        AS debt2024,
                MAX(CASE WHEN year = $1-2 THEN debt::float END)        AS debt2023,
                MAX(CASE WHEN year = $1   THEN "netDebt"::float END)   AS netdebt2025,
                MAX(CASE WHEN year = $1-1 THEN "netDebt"::float END)   AS netdebt2024,
                MAX(CASE WHEN year = $1-2 THEN "netDebt"::float END)   AS netdebt2023,
                MAX(CASE WHEN year = $1   THEN liabilities::float END) AS liab2025,
                MAX(CASE WHEN year = $1-1 THEN liabilities::float END) AS liab2024,
                MAX(CASE WHEN year = $1-2 THEN liabilities::float END) AS liab2023
            FROM balance_sheet
            GROUP BY symbol
        ),
        -- annual returns pivoted
        ar AS (
            SELECT symbol,
                MAX(CASE WHEN year = 2020 THEN "return"::float END) AS ret2020,
                MAX(CASE WHEN year = 2021 THEN "return"::float END) AS ret2021,
                MAX(CASE WHEN year = 2022 THEN "return"::float END) AS ret2022,
                MAX(CASE WHEN year = 2023 THEN "return"::float END) AS ret2023,
                MAX(CASE WHEN year = 2024 THEN "return"::float END) AS ret2024,
                MAX(CASE WHEN year = 2025 THEN "return"::float END) AS ret2025,
                MAX(CASE WHEN year = 2026 THEN "return"::float END) AS ret2026
            FROM annual_returns
            GROUP BY symbol
        ),
        -- TTM from last 4 quarters
        ttm AS (
            SELECT
                symbol,
                SUM(CASE WHEN rn <= 4 THEN revenue::float END)    AS ttm_rev,
                SUM(CASE WHEN rn <= 4 THEN "netIncome"::float END) AS ttm_ni,
                SUM(CASE WHEN rn <= 4 THEN ebitda::float END)      AS ttm_ebitda,
                SUM(CASE WHEN rn BETWEEN 5 AND 8 THEN revenue::float END) AS prior_ttm_rev
            FROM (
                SELECT symbol, revenue, "netIncome", ebitda,
                    ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY "quarterEnd" DESC) AS rn
                FROM quarterly_financials
            ) q
            WHERE rn <= 8
            GROUP BY symbol
            HAVING COUNT(CASE WHEN rn <= 4 THEN 1 END) = 4
        ),
        -- historical mktcap per year for valuation ratios
        hcap AS (
            SELECT DISTINCT ON (symbol, yr) symbol, yr,
                "marketCap"::float AS mktcap
            FROM (
                SELECT symbol, "marketCap", date,
                    EXTRACT(YEAR FROM date)::int AS yr
                FROM stock_snapshot
                WHERE "marketCap" IS NOT NULL
            ) x
            ORDER BY symbol, yr, date DESC
        )
        SELECT
            sp.symbol                   AS "Symbol",
            sp.company                  AS "Company",
            sp.sector                   AS "Sector",
            sp.industry                 AS "Industry",
            sp.exchange                 AS "Exchange",
            sp.currency                 AS "Currency",
            sp."yearEnd"                AS "YearEnd",
            EXTRACT(YEAR FROM sp."ipoDate")::int AS "IPO",
            CASE WHEN sp."ipoDate" IS NOT NULL
                THEN EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM sp."ipoDate")
                ELSE NULL END::float    AS "YearsActive",

            sn.price                    AS "Price",
            sn.mktcap / 1e6             AS "MarketCap",  -- store in millions
            sp.shares::float / 1e6      AS "Shares",

            -- technicals
            pd.dma200                   AS "Dma200",
            pd.dma50                    AS "Dma50",
            pd.slope200                 AS "Slope200",
            pd.slope100                 AS "Slope100",
            pd.slope50                  AS "Slope50",
            pd.div2050                  AS "Div2050",
            pd.div50200                 AS "Div50200",
            pd.days200                  AS "DaysAbove200",
            pd.rsi14                    AS "Rsi14",

            -- annual returns (decimal)
            ar.ret2020 AS "Return2020", ar.ret2021 AS "Return2021",
            ar.ret2022 AS "Return2022", ar.ret2023 AS "Return2023",
            ar.ret2024 AS "Return2024", ar.ret2025 AS "Return2025",
            ar.ret2026 AS "Return2026",

            -- fundamentals
            ttm.ttm_rev    AS "TtmRevenue",
            ttm.ttm_ni     AS "TtmNetIncome",
            ttm.ttm_ebitda AS "TtmEbitda",

            inc.rev2026  AS "Rev2026",  inc.rev2025 AS "Rev2025",   inc.rev2024 AS "Rev2024",
            inc.rev2023  AS "Rev2023",  inc.rev2022 AS "Rev2022",   inc.rev2021 AS "Rev2021",
            inc.rev2020  AS "Rev2020",
            inc.ni2026   AS "NI2026",   inc.ni2025  AS "NI2025",    inc.ni2024  AS "NI2024",
            inc.ni2023   AS "NI2023",   inc.ni2022  AS "NI2022",    inc.ni2021  AS "NI2021",
            inc.ebitda2026 AS "Ebitda2026", inc.ebitda2025 AS "Ebitda2025", inc.ebitda2024 AS "Ebitda2024",
            inc.ebitda2023 AS "Ebitda2023", inc.ebitda2022 AS "Ebitda2022",
            inc.fcf2025  AS "Fcf2025",  inc.fcf2024 AS "Fcf2024",
            inc.fcf2023  AS "Fcf2023",  inc.fcf2022 AS "Fcf2022",

            -- margins (whole %)
            CASE WHEN inc.rev2025 > 0 THEN inc.ni2025 / inc.rev2025 * 100 END   AS "NetMargin2025",
            CASE WHEN inc.rev2024 > 0 THEN inc.ni2024 / inc.rev2024 * 100 END   AS "NetMargin2024",
            CASE WHEN inc.rev2023 > 0 THEN inc.ni2023 / inc.rev2023 * 100 END   AS "NetMargin2023",
            CASE WHEN inc.rev2022 > 0 THEN inc.ni2022 / inc.rev2022 * 100 END   AS "NetMargin2022",
            CASE WHEN inc.rev2025 > 0 THEN inc.ebitda2025 / inc.rev2025 * 100 END AS "EbitdaMargin2025",
            CASE WHEN inc.rev2024 > 0 THEN inc.ebitda2024 / inc.rev2024 * 100 END AS "EbitdaMargin2024",
            CASE WHEN inc.rev2023 > 0 THEN inc.ebitda2023 / inc.rev2023 * 100 END AS "EbitdaMargin2023",

            -- balance
            bal.assets2025 AS "Assets2025", bal.assets2024 AS "Assets2024", bal.assets2023 AS "Assets2023",
            bal.cash2025   AS "Cash2025",   bal.cash2024   AS "Cash2024",   bal.cash2023   AS "Cash2023",
            bal.debt2025   AS "Debt2025",   bal.debt2024   AS "Debt2024",   bal.debt2023   AS "Debt2023",
            bal.netdebt2025 AS "NetDebt2025", bal.netdebt2024 AS "NetDebt2024", bal.netdebt2023 AS "NetDebt2023",
            bal.liab2025   AS "Liabilities2025", bal.liab2024 AS "Liabilities2024", bal.liab2023 AS "Liabilities2023",

            -- valuation (mktcap in millions, revenue in millions)
            CASE WHEN ttm.ttm_rev > 0
                THEN (sn.mktcap / 1e6) / ttm.ttm_rev END          AS "PS_TTM",
            CASE WHEN ttm.ttm_ni > 0
                THEN (sn.mktcap / 1e6) / ttm.ttm_ni END           AS "PE_TTM",

            -- TTM revenue growth YoY
            CASE WHEN ttm.prior_ttm_rev > 0
                THEN (ttm.ttm_rev - ttm.prior_ttm_rev) / ttm.prior_ttm_rev END AS "TtmRevGrowth",
            CASE WHEN inc.rev2024 > 0
                THEN COALESCE(
                    (SELECT hc.mktcap / 1e6 FROM hcap hc WHERE hc.symbol = sp.symbol AND hc.yr = $1-1 LIMIT 1),
                    sn.mktcap / 1e6
                ) / inc.rev2024 END                                AS "PS2024",
            CASE WHEN inc.ni2024 > 0
                THEN COALESCE(
                    (SELECT hc.mktcap / 1e6 FROM hcap hc WHERE hc.symbol = sp.symbol AND hc.yr = $1-1 LIMIT 1),
                    sn.mktcap / 1e6
                ) / inc.ni2024 END                                 AS "PE2024",

            -- revenue growth (decimal)
            CASE WHEN inc.rev2024 > 0 THEN (inc.rev2025 - inc.rev2024) / inc.rev2024 END AS "RevGrowth2025",
            CASE WHEN inc.rev2023 > 0 THEN (inc.rev2024 - inc.rev2023) / inc.rev2023 END AS "RevGrowth2024",
            CASE WHEN inc.rev2022 > 0 THEN (inc.rev2023 - inc.rev2022) / inc.rev2022 END AS "RevGrowth2023",
            CASE WHEN inc.rev2021 > 0 THEN (inc.rev2022 - inc.rev2021) / inc.rev2021 END AS "RevGrowth2022"

        FROM "StockProfile" sp
        JOIN snap sn ON sn.symbol = sp.symbol
        LEFT JOIN pd   ON pd.symbol   = sp.symbol
        LEFT JOIN inc  ON inc.symbol  = sp.symbol
        LEFT JOIN bal  ON bal.symbol  = sp.symbol
        LEFT JOIN ar   ON ar.symbol   = sp.symbol
        LEFT JOIN ttm  ON ttm.symbol  = sp.symbol
        ORDER BY sn.mktcap DESC NULLS LAST
    `, [CUR_YEAR]);

    return rows as ScreenerRow[];
}
