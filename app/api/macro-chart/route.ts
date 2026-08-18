import { macroDb } from '@/lib/macroDb';

// ─── GET /api/macro-chart ─────────────────────────────────────────────────────
// Returns monthly time-series for six macro indicators.
//
// Nominal:  ten_y (US/TNX-Monthly), cpi, ey5
// Relative: real10, eyp5, rey5

export async function GET() {
    try {
        const { rows } = await macroDb.query<{
            month: string;
            ten_y: number | null;
            cpi: number | null;
            ey5: number | null;
            real10: number | null;
            eyp5: number | null;
            rey5: number | null;
        }>(`
            WITH
            ten_y AS (
                SELECT
                    to_char(date_trunc('month', TO_DATE(date, 'YYYY-MM-DD')), 'YYYY-MM-DD') AS month,
                    AVG(value) AS value
                FROM macro_time_series
                WHERE asset_class = 'bonds'
                  AND series_name  = 'US/TNX-Monthly'
                  AND column_name  = 'Value'
                GROUP BY date_trunc('month', TO_DATE(date, 'YYYY-MM-DD'))
            ),
            cpi AS (
                SELECT
                    to_char(date_trunc('month', TO_DATE(date, 'YYYY-MM-DD')), 'YYYY-MM-DD') AS month,
                    AVG(value) AS value
                FROM macro_time_series
                WHERE asset_class = 'economic'
                  AND series_name  = 'CPI'
                  AND column_name  = 'Value'
                GROUP BY date_trunc('month', TO_DATE(date, 'YYYY-MM-DD'))
            ),
            ey5 AS (
                SELECT
                    to_char(date_trunc('month', TO_DATE(date, 'YYYY-MM-DD')), 'YYYY-MM-DD') AS month,
                    AVG(value) AS value
                FROM macro_time_series
                WHERE asset_class = 'valuations'
                  AND series_name  = 'Earnings-Yield-5yr'
                  AND column_name  = 'Value'
                GROUP BY date_trunc('month', TO_DATE(date, 'YYYY-MM-DD'))
            ),
            real10 AS (
                SELECT
                    to_char(date_trunc('month', TO_DATE(date, 'YYYY-MM-DD')), 'YYYY-MM-DD') AS month,
                    AVG(value) AS value
                FROM macro_time_series
                WHERE asset_class = 'derived'
                  AND series_name  = 'Real-10Y'
                  AND column_name  = 'Value'
                GROUP BY date_trunc('month', TO_DATE(date, 'YYYY-MM-DD'))
            ),
            eyp5 AS (
                SELECT
                    to_char(date_trunc('month', TO_DATE(date, 'YYYY-MM-DD')), 'YYYY-MM-DD') AS month,
                    AVG(value) AS value
                FROM macro_time_series
                WHERE asset_class = 'derived'
                  AND series_name  = 'Earnings-Yield-Premium-5yr'
                  AND column_name  = 'Value'
                GROUP BY date_trunc('month', TO_DATE(date, 'YYYY-MM-DD'))
            ),
            rey5 AS (
                SELECT
                    to_char(date_trunc('month', TO_DATE(date, 'YYYY-MM-DD')), 'YYYY-MM-DD') AS month,
                    AVG(value) AS value
                FROM macro_time_series
                WHERE asset_class = 'derived'
                  AND series_name  = 'Real-Earnings-Yield-5yr'
                  AND column_name  = 'Value'
                GROUP BY date_trunc('month', TO_DATE(date, 'YYYY-MM-DD'))
            ),
            all_months AS (
                SELECT month FROM ten_y
                UNION SELECT month FROM cpi
                UNION SELECT month FROM ey5
                UNION SELECT month FROM real10
                UNION SELECT month FROM eyp5
                UNION SELECT month FROM rey5
            )
            SELECT
                m.month,
                t.value   AS ten_y,
                c.value   AS cpi,
                e.value   AS ey5,
                r10.value AS real10,
                ep.value  AS eyp5,
                r5.value  AS rey5
            FROM all_months m
            LEFT JOIN ten_y  t   ON t.month   = m.month
            LEFT JOIN cpi    c   ON c.month   = m.month
            LEFT JOIN ey5    e   ON e.month   = m.month
            LEFT JOIN real10 r10 ON r10.month = m.month
            LEFT JOIN eyp5   ep  ON ep.month  = m.month
            LEFT JOIN rey5   r5  ON r5.month  = m.month
            ORDER BY m.month ASC
        `);

        return Response.json(rows);
    } catch (err) {
        console.error('[api/macro-chart]', err);
        return Response.json({ error: 'Failed to load macro data' }, { status: 500 });
    }
}
