import { macroDb } from '@/lib/macroDb';

// ─── GET /api/macro-percentiles ───────────────────────────────────────────────
// Monthly percentile rank (0–100) and its 1-year change for the same six macro
// indicators served by /api/macro-chart, read from macro_percentile_analysis.
//
// Response: [{ month, rank: { ten_y, … }, yoy: { ten_y, … } }]

const SERIES_MAP = [
    { key: 'ten_y', assetClass: 'bonds', seriesName: 'US/TNX-Monthly' },
    { key: 'cpi', assetClass: 'economic', seriesName: 'CPI' },
    { key: 'm2', assetClass: 'economic', seriesName: 'M2-YoY' },
    { key: 'ey5', assetClass: 'valuations', seriesName: 'Earnings-Yield-5yr' },
    { key: 'real10', assetClass: 'derived', seriesName: 'Real-10Y' },
    { key: 'eyp5', assetClass: 'derived', seriesName: 'Earnings-Yield-Premium-5yr' },
    { key: 'rey5', assetClass: 'derived', seriesName: 'Real-Earnings-Yield-5yr' },
] as const;

// $1..$12 — asset_class / series_name pairs, in SERIES_MAP order.
const PAIR_PARAMS = SERIES_MAP.flatMap(s => [s.assetClass, s.seriesName]);
const pairPlaceholders = SERIES_MAP
    .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
    .join(', ');

const keyCases = SERIES_MAP
    .map((s, i) => `WHEN asset_class = $${i * 2 + 1} AND series_name = $${i * 2 + 2} THEN '${s.key}'`)
    .join('\n                        ');

// A few months carry two rows for one series (month-end vs month-start dates),
// so aggregate the same way the value route does.
const pivotColumns = SERIES_MAP
    .flatMap(s => [
        `AVG(percentile_rank)       FILTER (WHERE key = '${s.key}') AS ${s.key}_rank`,
        `AVG(yoy_percentile_change) FILTER (WHERE key = '${s.key}') AS ${s.key}_yoy`,
    ])
    .join(',\n                ');

const QUERY = `
            WITH src AS (
                SELECT
                    to_char(date_trunc('month', TO_DATE(date, 'YYYY-MM-DD')), 'YYYY-MM-DD') AS month,
                    CASE
                        ${keyCases}
                    END AS key,
                    percentile_rank,
                    yoy_percentile_change
                FROM macro_percentile_analysis
                WHERE column_name = 'Value'
                  AND (asset_class, series_name) IN (${pairPlaceholders})
            )
            SELECT
                month,
                ${pivotColumns}
            FROM src
            GROUP BY month
            ORDER BY month ASC
`;

type Row = { month: string } & Record<string, number | string | null>;

export async function GET() {
    try {
        const { rows } = await macroDb.query<Row>(QUERY, PAIR_PARAMS);

        const out = rows.map(r => ({
            month: r.month,
            rank: Object.fromEntries(
                SERIES_MAP.map(s => [s.key, num(r[`${s.key}_rank`])]),
            ),
            yoy: Object.fromEntries(
                SERIES_MAP.map(s => [s.key, num(r[`${s.key}_yoy`])]),
            ),
        }));

        return Response.json(out);
    } catch (err) {
        console.error('[api/macro-percentiles]', err);
        return Response.json({ error: 'Failed to load percentile data' }, { status: 500 });
    }
}

function num(v: number | string | null | undefined): number | null {
    if (v == null) return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
}
