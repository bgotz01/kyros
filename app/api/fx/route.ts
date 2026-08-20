import { macroDb } from '@/lib/macroDb';
import { findPair, findFxMetric, DEFAULT_PAIR } from '@/lib/capital/fxPairs';

// ─── GET /api/fx?pair=EURUSD&metric=rate ──────────────────────────────────────
// Monthly series for one currency pair, sampled the same way the equity route
// samples an index: the last reading recorded in each month.
//
// `yoy` joins each month to the same month a year earlier — on the date rather
// than by counting rows back, so a gap in the series cannot silently shift the
// comparison onto the wrong month.
//
// Response: { pair, metric, rows: [{ month, value }] }

function query(metric: 'rate' | 'yoy') {
    const value = metric === 'rate'
        ? 'now.value'
        : `CASE WHEN prior.value IS NULL OR prior.value = 0
                THEN NULL
                ELSE (now.value / prior.value - 1) * 100
           END`;

    return `
        WITH present AS (
            SELECT DISTINCT ON (date_trunc('month', TO_DATE(date, 'YYYY-MM-DD')))
                date_trunc('month', TO_DATE(date, 'YYYY-MM-DD')) AS month,
                value
            FROM macro_time_series
            WHERE asset_class = 'fx'
              AND series_name = $1
              AND column_name = 'Value'
              AND value IS NOT NULL
            ORDER BY
                date_trunc('month', TO_DATE(date, 'YYYY-MM-DD')) ASC,
                TO_DATE(date, 'YYYY-MM-DD') DESC
        ),
        -- Every month between the first reading and the last. Several of these
        -- series have holes — USDJPY has no 2001-2006 at all — and a missing
        -- month has to stay in the series as a null. Dropping it would let the
        -- plot, which spaces points evenly, compress the gap out of sight.
        monthly AS (
            SELECT s.month, p.value
            FROM (
                SELECT generate_series(min(month), max(month), INTERVAL '1 month') AS month
                FROM present
            ) s
            LEFT JOIN present p ON p.month = s.month
        )
        SELECT
            to_char(now.month, 'YYYY-MM-DD') AS month,
            ${value} AS value
        FROM monthly now
        LEFT JOIN monthly prior ON prior.month = now.month - INTERVAL '1 year'
        ORDER BY now.month ASC
    `;
}

type Row = { month: string; value: number | string | null };

export async function GET(request: Request) {
    const params = new URL(request.url).searchParams;

    // Both are checked against the catalogue before they reach SQL.
    const pair = findPair(params.get('pair') ?? DEFAULT_PAIR);
    const metric = findFxMetric(params.get('metric') ?? 'rate');

    if (!pair) return Response.json({ error: 'Unknown pair' }, { status: 400 });
    if (!metric) return Response.json({ error: 'Unknown metric' }, { status: 400 });

    try {
        const { rows } = await macroDb.query<Row>(query(metric.key), [pair.series]);

        return Response.json({
            pair: pair.series,
            metric: metric.key,
            rows: rows.map(r => ({ month: r.month, value: num(r.value) })),
        });
    } catch (err) {
        console.error('[api/fx]', err);
        return Response.json({ error: 'Failed to load currency data' }, { status: 500 });
    }
}

function num(v: number | string | null | undefined): number | null {
    if (v == null) return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
}
