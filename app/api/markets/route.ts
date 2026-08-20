import { macroDb } from '@/lib/macroDb';
import { findIndex, findMetric, DEFAULT_INDEX, type MetricDef } from '@/lib/capital/marketIndexes';
import { usdConversion, toUsd, type Conversion } from '@/lib/capital/fxPairs';

// ─── GET /api/markets?index=US/GSPC&metric=Value&currency=local ───────────────
// Monthly series for one equity index. The reading is the last one recorded in
// each month — a month-end close rather than a month average, which is what a
// price level should be.
//
// With currency=usd a foreign index is restated in dollars at each month's own
// rate. The series then begins where the rate series begins, which is later
// than the index in every case, so the response reports the range it actually
// covers rather than leaving the caller to infer it.
//
// Response: { index, metric, currency, rows: [{ month, value }] }

const MONTHLY = `
    WITH monthly AS (
        SELECT DISTINCT ON (date_trunc('month', TO_DATE(date, 'YYYY-MM-DD')))
            date_trunc('month', TO_DATE(date, 'YYYY-MM-DD')) AS month,
            value
        FROM macro_time_series
        WHERE asset_class = $1
          AND series_name = $2
          AND column_name = $3
          AND value IS NOT NULL
        ORDER BY
            date_trunc('month', TO_DATE(date, 'YYYY-MM-DD')) ASC,
            TO_DATE(date, 'YYYY-MM-DD') DESC
    ),
    -- Every month between the first reading and the last, present or not. A
    -- series with a hole in it must carry that hole as a null: the plot spaces
    -- points evenly, so a dropped month would compress the gap and quietly
    -- redraw the timeline. USDJPY is missing 2001-2006 outright.
    spine AS (
        SELECT generate_series(min(month), max(month), INTERVAL '1 month') AS month
        FROM monthly
    )
    SELECT
        to_char(s.month, 'YYYY-MM-DD') AS month,
        m.value
    FROM spine s
    LEFT JOIN monthly m ON m.month = s.month
    ORDER BY s.month ASC
`;

/** Trailing window, in years, behind each return column. */
const RETURN_YEARS: Record<string, number> = {
    Value_Return2Y: 2,
    Value_Return5Y: 5,
    Value_Return10Y: 10,
};

type Row = { month: string; value: number | string | null };
type Point = { month: string; value: number | null };

export async function GET(request: Request) {
    const params = new URL(request.url).searchParams;

    // Every one of these is checked against the catalogue before reaching SQL.
    const index = findIndex(params.get('index') ?? DEFAULT_INDEX);
    const metric = findMetric(params.get('metric') ?? 'Value');
    const wantsUsd = params.get('currency') === 'usd';

    if (!index) return Response.json({ error: 'Unknown index' }, { status: 400 });
    if (!metric) return Response.json({ error: 'Unknown metric' }, { status: 400 });

    const conversion = usdConversion(index.code);

    if (wantsUsd && !metric.convertible) {
        return Response.json(
            { error: `${metric.label} is measured from daily local-currency returns and cannot be restated in dollars` },
            { status: 400 },
        );
    }
    if (wantsUsd && conversion.kind === 'missing') {
        return Response.json(
            { error: `No ${conversion.code} rate in the database` },
            { status: 400 },
        );
    }

    // Converting a native-dollar index is a no-op, so it takes the plain path.
    const convert = wantsUsd && conversion.kind === 'available';

    try {
        const rows = convert
            ? await convertedSeries(index.series, metric, conversion as Extract<Conversion, { kind: 'available' }>)
            : await storedSeries(index.series, metric.key);

        return Response.json({
            index: index.series,
            metric: metric.key,
            currency: convert ? 'usd' : 'local',
            rows,
        });
    } catch (err) {
        console.error('[api/markets]', err);
        return Response.json({ error: 'Failed to load market data' }, { status: 500 });
    }
}

/** The column as the database holds it, in the index's own currency. */
async function storedSeries(series: string, column: string): Promise<Point[]> {
    const { rows } = await macroDb.query<Row>(MONTHLY, ['equities', series, column]);
    return rows.map(r => ({ month: r.month, value: num(r.value) }));
}

/** The index restated in dollars, and — for a return column — recomputed from
 *  those dollar levels. A return between two month ends is exactly the ratio of
 *  the levels at those month ends, so this is the same quantity the stored
 *  column holds, measured on a dollar series instead of a local one. */
async function convertedSeries(
    series: string,
    metric: MetricDef,
    conversion: Extract<Conversion, { kind: 'available' }>,
): Promise<Point[]> {
    const [levels, rates] = await Promise.all([
        macroDb.query<Row>(MONTHLY, ['equities', series, 'Value']),
        macroDb.query<Row>(MONTHLY, ['fx', conversion.pair.series, 'Value']),
    ]);

    const rate = new Map<string, number>();
    for (const r of rates.rows) {
        const v = num(r.value);
        if (v != null) rate.set(r.month, v);
    }

    // A month the rate does not reach becomes a null, not a dropped row: the
    // gap has to stay visible. Carrying the last rate forward instead would
    // quietly invent a dollar price for a month nobody quoted.
    const converted: Point[] = levels.rows.map((r) => {
        const local = num(r.value);
        const fx = rate.get(r.month);
        return {
            month: r.month,
            value: local == null || fx == null ? null : toUsd(local, fx, conversion.op),
        };
    });

    // The index reaches back further than every rate series does, so trim the
    // dead run at each end. Interior gaps stay — those are the real holes.
    const usd = trimEnds(converted);

    if (metric.key === 'Value') return usd;

    const years = RETURN_YEARS[metric.key];
    if (years == null) return usd;

    const level = new Map(usd.map(p => [p.month, p.value]));
    const returns = usd.map(({ month }) => {
        const now = level.get(month);
        const prior = level.get(shiftYears(month, -years));
        const value = now != null && prior != null && prior !== 0
            ? (now / prior - 1) * 100
            : null;
        return { month, value };
    });

    // The first `years` of the series have nothing behind them to measure
    // against. That run is a warm-up, not a hole in the data, so it is trimmed
    // rather than left to look like missing rates.
    return trimEnds(returns);
}

/** Drops leading and trailing nulls, keeping any gap in the middle. */
function trimEnds(points: Point[]): Point[] {
    let lo = 0;
    let hi = points.length - 1;
    while (lo <= hi && points[lo].value == null) lo++;
    while (hi >= lo && points[hi].value == null) hi--;
    return points.slice(lo, hi + 1);
}

/** 'YYYY-MM-01' shifted by whole years, keeping the month. */
function shiftYears(month: string, delta: number): string {
    const year = parseInt(month.slice(0, 4), 10) + delta;
    return `${year}${month.slice(4)}`;
}

function num(v: number | string | null | undefined): number | null {
    if (v == null) return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
}
