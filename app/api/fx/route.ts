import { macroDb } from '@/lib/macroDb';
import { findPair, findFxMetric, DEFAULT_PAIR } from '@/lib/capital/fxPairs';
import type { Resolution, Window } from '@/lib/capital/marketIndexes';
import { isResolution, parseWindow, seriesQuery } from '@/lib/capital/seriesQuery';

// ─── GET /api/fx?pair=EURUSD&metric=rate&resolution=…&from=&to= ───────────────
// One currency pair, bucketed and windowed the same way the index route does
// it: each bucket carries its last reading.
//
// `yoy` compares each bucket to the one a year earlier, matched on the calendar
// date rather than by counting buckets back, so a hole in the series cannot
// silently shift the comparison onto the wrong period.
//
// Response: { pair, metric, resolution, rows: [{ date, value }] }

type Row = { date: string; value: number | string | null };
type Point = { date: string; value: number | null };

export async function GET(request: Request) {
    const params = new URL(request.url).searchParams;

    // Each is checked against the catalogue before reaching SQL.
    const pair = findPair(params.get('pair') ?? DEFAULT_PAIR);
    const metric = findFxMetric(params.get('metric') ?? 'rate');
    const resolutionParam = params.get('resolution') ?? 'monthly';
    const window = parseWindow(params);

    if (!pair) return Response.json({ error: 'Unknown pair' }, { status: 400 });
    if (!metric) return Response.json({ error: 'Unknown metric' }, { status: 400 });
    if (!isResolution(resolutionParam)) {
        return Response.json({ error: 'Unknown resolution' }, { status: 400 });
    }
    if (!window) return Response.json({ error: 'Bad window' }, { status: 400 });

    const resolution: Resolution = resolutionParam;

    try {
        // A year-over-year change needs the year before the window to measure
        // against, so the rate is fetched whole and windowed at the end.
        const fetchWindow: Window = metric.key === 'yoy' ? { kind: 'all' } : window;
        const q = seriesQuery('fx', pair.series, 'Value', resolution, fetchWindow);
        const { rows } = await macroDb.query<Row>(q.text, q.params);

        const rates: Point[] = rows.map(r => ({ date: r.date, value: num(r.value) }));
        const out = metric.key === 'yoy' ? applyWindow(yearOverYear(rates), window) : rates;

        return Response.json({
            pair: pair.series,
            metric: metric.key,
            resolution,
            rows: out,
        });
    } catch (err) {
        console.error('[api/fx]', err);
        return Response.json({ error: 'Failed to load currency data' }, { status: 500 });
    }
}

/** Change against the same calendar date a year earlier. At a resolution finer
 *  than monthly that exact date may not be a bucket, so a short search around
 *  it finds the nearest one that is — bounded, so a real hole in the series
 *  comes back empty rather than being measured across. */
function yearOverYear(points: Point[]): Point[] {
    const value = new Map(points.map(p => [p.date, p.value]));

    const out = points.map(({ date, value: now }) => {
        const target = new Date(date + 'T00:00:00Z');
        target.setUTCFullYear(target.getUTCFullYear() - 1);

        let prior: number | null = null;
        search:
        for (let slip = 0; slip <= 7; slip++) {
            for (const dir of slip === 0 ? [0] : [-1, 1]) {
                const probe = new Date(target);
                probe.setUTCDate(probe.getUTCDate() + dir * slip);
                const hit = value.get(probe.toISOString().slice(0, 10));
                if (hit != null) { prior = hit; break search; }
            }
        }

        return {
            date,
            value: now != null && prior != null && prior !== 0 ? (now / prior - 1) * 100 : null,
        };
    });

    // The first year has nothing behind it — a warm-up, not a hole.
    let lo = 0;
    while (lo < out.length && out[lo].value == null) lo++;
    return out.slice(lo);
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

function num(v: number | string | null | undefined): number | null {
    if (v == null) return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
}
