'use client';

import { useEffect, useMemo, useState } from 'react';

import SeriesChart, { type SeriesPoint } from './SeriesChart';
import { GapNote, Readout, Stat, StateOverlay, monthLabel, usePlotSize } from './panelParts';
import type { Currency } from './Controls';
import { formatFull } from './scale';
import { usdConversion } from '@/lib/capital/fxPairs';
import {
    filterPeriod,
    type MarketIndex,
    type MetricDef,
    type Period,
} from '@/lib/capital/marketIndexes';

// ─── Equity index panel ───────────────────────────────────────────────────────
// Owns everything that changes when a selection changes: the fetch, the plot
// size, the hover, the window statistics. The page above it only holds the
// selection itself, so flipping a control never re-runs the page.
//
// The panel keeps the last series it drew on screen while the next one is in
// flight — dimmed, and still labelled with the index and metric that produced
// it — and reserves the plot height throughout. Nothing on the page moves
// while data loads.

interface Props {
    index: MarketIndex;
    metric: MetricDef;
    period: Period;
    /** Already resolved by the page — 'usd' only when a rate exists and the
     *  metric can carry the conversion. */
    currency: Currency;
    /** Log axis. Only a level can carry one; a percentage crossing zero cannot. */
    log: boolean;
    showGrid: boolean;
}

interface Result {
    /** `<index>|<metric>|<currency>` these rows were fetched for. */
    key: string;
    /** The selection that produced the rows, which the older ones are drawn in. */
    index: MarketIndex;
    metric: MetricDef;
    currency: Currency;
    rows: SeriesPoint[];
    error: string | null;
}

export default function MarketPanel({ index, metric, period, currency, log, showGrid }: Props) {
    const [result, setResult] = useState<Result | null>(null);
    const [hovered, setHovered] = useState<number | null>(null);
    const { ref, dims } = usePlotSize();

    const requestKey = `${index.series}|${metric.key}|${currency}`;

    useEffect(() => {
        const controller = new AbortController();
        const key = `${index.series}|${metric.key}|${currency}`;
        const query =
            `index=${encodeURIComponent(index.series)}&metric=${metric.key}&currency=${currency}`;

        fetch(`/api/markets?${query}`, { signal: controller.signal })
            .then(r => r.json())
            .then((body) => {
                if (!Array.isArray(body?.rows)) throw new Error(body?.error ?? 'Unexpected response');
                setResult({ key, index, metric, currency, rows: body.rows, error: null });
            })
            .catch((e) => {
                if (e.name === 'AbortError') return;
                setResult({
                    key, index, metric, currency,
                    rows: [],
                    error: e.message ?? 'Failed to load market data.',
                });
            });

        return () => controller.abort();
    }, [index, metric, currency]);

    const loading = result?.key !== requestKey;
    // An error only speaks for the selection on screen now; while a newer
    // request is in flight the previous series stays up.
    const error = !loading ? result?.error ?? null : null;

    // Drawn in the index and metric the rows actually came from, which is the
    // previous selection for as long as the next one is loading.
    const shownIndex = result?.index ?? index;
    const shownMetric = result?.metric ?? metric;
    const shownCurrency = result?.currency ?? currency;
    // A converted level reads in dollars, whatever the index's home symbol is.
    const symbol = shownCurrency === 'usd' ? '$' : shownIndex.currency;

    const data = useMemo(() => filterPeriod(result?.rows ?? [], period), [result, period]);

    const stats = useMemo(() => {
        const seen = data.filter(r => r.value != null) as { month: string; value: number }[];
        if (seen.length === 0) return null;

        const first = seen[0];
        const last = seen[seen.length - 1];
        const high = seen.reduce((a, b) => (b.value > a.value ? b : a));
        const low = seen.reduce((a, b) => (b.value < a.value ? b : a));
        // Only a level compounds; a return or a vol reading is already a rate.
        const change = shownMetric.kind === 'level' && first.value !== 0
            ? (last.value / first.value - 1) * 100
            : null;

        return { first, last, high, low, change };
    }, [data, shownMetric]);

    // In dollars the series can only run as far as the rate does, and several
    // rate series have holes in them.
    const missing = data.filter(r => r.value == null).length;
    const gapSource = shownCurrency === 'usd'
        ? (() => {
            const c = usdConversion(shownIndex.code);
            return c.kind === 'available' ? c.pair.shortLabel : shownIndex.shortLabel;
        })()
        : shownIndex.shortLabel;

    // `hovered` indexes into a series that may have just been replaced.
    const hoveredPoint = hovered != null ? data[hovered] ?? null : null;

    const showChart = data.length > 0 && !error;

    // Only a level can take a log axis. Returns and volatility are rates
    // already, and a return series crosses zero, where a log axis has nothing
    // to say — so those stay linear whatever the toggle says.
    const level = shownMetric.kind === 'level';
    const useLog = level && log;

    return (
        <>
            {/* plot — height is reserved whatever the state, so nothing jumps */}
            <div ref={ref} className="relative w-full" style={{ height: dims.height }}>
                {showChart && (
                    <div className={`transition-opacity duration-500 ease-mechanical ${loading ? 'opacity-40' : 'opacity-100'}`}>
                        <SeriesChart
                            data={data}
                            color={shownIndex.color}
                            unit={level ? `${symbol}${useLog ? ' LOG' : ''}` : shownMetric.unit}
                            scaleKind={useLog ? 'log' : 'linear'}
                            label={`${shownIndex.label} — ${shownMetric.label}`}
                            width={dims.width}
                            height={dims.height}
                            hovered={hovered}
                            onHover={setHovered}
                            showGrid={showGrid}
                        />
                    </div>
                )}

                {!showChart && (
                    <StateOverlay error={error} empty={!loading && data.length === 0} />
                )}

                {hoveredPoint && !loading && (
                    <div className="pointer-events-none absolute right-5 top-4">
                        <Readout
                            month={hoveredPoint.month}
                            name={shownIndex.shortLabel}
                            value={readout(hoveredPoint.value, symbol, shownMetric)}
                            color={shownIndex.color}
                            note={shownCurrency === 'usd' ? 'Converted to USD' : undefined}
                        />
                    </div>
                )}
            </div>

            {/* window statistics — always four cells, so the strip holds its height */}
            <div className="grid grid-cols-2 gap-y-4 border-t border-stone-line-strong px-4 py-4 sm:grid-cols-4">
                <Stat
                    label={stats ? `Latest · ${monthLabel(stats.last.month)}` : 'Latest'}
                    value={stats ? readout(stats.last.value, symbol, shownMetric) : '—'}
                />
                <Stat
                    label={stats ? `High · ${stats.high.month.slice(0, 4)}` : 'High'}
                    value={stats ? readout(stats.high.value, symbol, shownMetric) : '—'}
                />
                <Stat
                    label={stats ? `Low · ${stats.low.month.slice(0, 4)}` : 'Low'}
                    value={stats ? readout(stats.low.value, symbol, shownMetric) : '—'}
                />
                <Stat
                    label={stats?.change != null ? `Since ${stats.first.month.slice(0, 4)}` : 'Readings'}
                    value={
                        stats == null ? '—'
                            : stats.change != null
                                ? `${stats.change >= 0 ? '+' : ''}${stats.change.toFixed(0)}%`
                                : String(data.length)
                    }
                    accent={stats?.change != null && stats.change >= 0}
                />
            </div>

            {!loading && <GapNote missing={missing} total={data.length} source={gapSource} />}
        </>
    );
}

/** The reading, carrying the unit its metric is quoted in. */
function readout(v: number | null, symbol: string, metric: MetricDef) {
    if (v == null) return '—';
    return metric.kind === 'level'
        ? `${symbol}${formatFull(v)}`
        : `${v > 0 && metric.key.includes('Return') ? '+' : ''}${v.toFixed(1)}%`;
}
