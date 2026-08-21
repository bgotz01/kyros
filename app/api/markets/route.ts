import { macroDb } from '@/lib/macroDb';
import { stockDb } from '@/lib/stockDb';
import {
    findIndex,
    findMetric,
    isConvertible,
    DEFAULT_INDEX,
    type MarketIndex,
    type MetricDef,
    type Resolution,
    type Window,
} from '@/lib/capital/marketIndexes';
import { isResolution, parseWindow, seriesQuery } from '@/lib/capital/seriesQuery';
import { usdConversion, toUsd, type Conversion } from '@/lib/capital/fxPairs';

// ─── GET /api/markets?index=…&metric=…&currency=…&resolution=…&from=&to= ──────
// One index series, bucketed at the requested resolution and windowed to the
// requested period. Each bucket carries its last reading — a close, not an
// average, which is what a price level should be.
//
// With currency=usd a foreign index is restated in dollars at each bucket's own
// rate. The series then begins where the rate series begins, which is later
// than the index in every case.
//
// Response: { index, metric, currency, resolution, rows: [{ date, value }] }

/** Trailing window, in years, behind each return column. */
const RETURN_YEARS: Record<string, number> = {
    Value_Return2Y: 2,
    Value_Return5Y: 5,
    Value_Return10Y: 10,
};

type Row = { date: string; value: number | string | null };
type Point = { date: string; value: number | null };

export async function GET(request: Request) {
    const params = new URL(request.url).searchParams;

    // Every one of these is checked before reaching SQL.
    const index = findIndex(params.get('index') ?? DEFAULT_INDEX);
    const metric = findMetric(params.get('metric') ?? 'Value');
    const wantsUsd = params.get('currency') === 'usd';
    const resolutionParam = params.get('resolution') ?? 'monthly';
    const window = parseWindow(params);

    if (!index) return Response.json({ error: 'Unknown index' }, { status: 400 });
    if (!metric) return Response.json({ error: 'Unknown metric' }, { status: 400 });
    if (!isResolution(resolutionParam)) {
        return Response.json({ error: 'Unknown resolution' }, { status: 400 });
    }
    if (!window) return Response.json({ error: 'Bad window' }, { status: 400 });

    const conversion = usdConversion(index.code);

    if (wantsUsd && !isConvertible(metric)) {
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
    const resolution: Resolution = resolutionParam;

    try {
        const rows = convert
            ? await convertedSeries(
                index, metric, resolution, window,
                conversion as Extract<Conversion, { kind: 'available' }>,
            )
            : await storedSeries(index, metric.key, resolution, window);

        return Response.json({
            index: index.series,
            metric: metric.key,
            currency: convert ? 'usd' : 'local',
            resolution,
            rows,
        });
    } catch (err) {
        console.error('[api/markets]', err);
        return Response.json({ error: 'Failed to load market data' }, { status: 500 });
    }
}

/** The pool the series lives in. Equity indexes are held in macro-framework;
 *  the commodity contracts are read from stockdata. */
function poolFor(index: MarketIndex) {
    return index.source === 'stock' ? stockDb : macroDb;
}

/** The column as the database holds it, in the series' own currency. */
async function storedSeries(
    index: MarketIndex,
    column: string,
    resolution: Resolution,
    window: Window,
): Promise<Point[]> {
    const q = seriesQuery(index.assetClass, index.series, column, resolution, window);
    const { rows } = await poolFor(index).query<Row>(q.text, q.params);
    return rows.map(r => ({ date: r.date, value: num(r.value) }));
}

/** The index restated in dollars, and — for a return column — recomputed from
 *  those dollar levels. A return between two closes is exactly the ratio of
 *  those closes, so this is the same quantity the stored column holds, measured
 *  on a dollar series instead of a local one. */
async function convertedSeries(
    index: MarketIndex,
    metric: MetricDef,
    resolution: Resolution,
    window: Window,
    conversion: Extract<Conversion, { kind: 'available' }>,
): Promise<Point[]> {
    // A return needs history behind the window to measure against, so the
    // levels are fetched over the whole series and windowed at the end.
    const returnYears = RETURN_YEARS[metric.key];
    const levelWindow: Window = returnYears == null ? window : { kind: 'all' };

    // The rate always comes from macro-framework, whichever database the
    // series itself is in.
    const levelQ = seriesQuery(index.assetClass, index.series, 'Value', resolution, levelWindow);
    const rateQ = seriesQuery('fx', conversion.pair.series, 'Value', resolution, { kind: 'all' });

    const [levels, rates] = await Promise.all([
        poolFor(index).query<Row>(levelQ.text, levelQ.params),
        macroDb.query<Row>(rateQ.text, rateQ.params),
    ]);

    const rate = new Map<string, number>();
    for (const r of rates.rows) {
        const v = num(r.value);
        if (v != null) rate.set(r.date, v);
    }

    // A bucket the rate does not reach becomes a null, not a dropped row: the
    // gap has to stay visible. Carrying the last rate forward instead would
    // quietly invent a dollar price for a day nobody quoted.
    const converted: Point[] = levels.rows.map((r) => {
        const local = num(r.value);
        const fx = rate.get(r.date);
        return {
            date: r.date,
            value: local == null || fx == null ? null : toUsd(local, fx, conversion.op),
        };
    });

    // The index reaches back further than every rate series does, so trim the
    // dead run at each end. Interior gaps stay — those are the real holes.
    const usd = trimEnds(converted);

    if (returnYears == null) return usd;

    const level = new Map(usd.map(p => [p.date, p.value]));
    const returns = usd.map(({ date }) => {
        const now = level.get(date);
        const prior = priorValue(level, date, returnYears);
        const value = now != null && prior != null && prior !== 0
            ? (now / prior - 1) * 100
            : null;
        return { date, value };
    });

    // The first `returnYears` of the series have nothing behind them to measure
    // against. That run is a warm-up, not a hole in the data.
    return applyWindow(trimEnds(returns), window);
}

/** The level `years` back, matched on the calendar date. At a resolution finer
 *  than monthly the exact date a year back may not be a bucket, so a short
 *  search around it finds the nearest one that is — bounded, so a real hole in
 *  the series still comes back empty rather than reaching across it. */
function priorValue(level: Map<string, number | null>, date: string, years: number) {
    const target = new Date(date + 'T00:00:00Z');
    target.setUTCFullYear(target.getUTCFullYear() - years);

    for (let slip = 0; slip <= 7; slip++) {
        for (const dir of slip === 0 ? [0] : [-1, 1]) {
            const probe = new Date(target);
            probe.setUTCDate(probe.getUTCDate() + dir * slip);
            const hit = level.get(probe.toISOString().slice(0, 10));
            if (hit != null) return hit;
        }
    }
    return null;
}

function applyWindow(points: Point[], window: Window): Point[] {
    if (window.kind === 'all' || points.length === 0) return points;
    if (window.kind === 'range') {
        return points.filter(p => p.date >= window.from && p.date <= window.to);
    }
    const last = new Date(points[points.length - 1].date + 'T00:00:00Z');
    last.setUTCFullYear(last.getUTCFullYear() - window.years);
    const cutoff = last.toISOString().slice(0, 10);
    return points.filter(p => p.date >= cutoff);
}

/** Drops leading and trailing nulls, keeping any gap in the middle. */
function trimEnds(points: Point[]): Point[] {
    let lo = 0;
    let hi = points.length - 1;
    while (lo <= hi && points[lo].value == null) lo++;
    while (hi >= lo && points[hi].value == null) hi--;
    return points.slice(lo, hi + 1);
}

function num(v: number | string | null | undefined): number | null {
    if (v == null) return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
}
