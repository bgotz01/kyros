'use client';

import { useEffect, useMemo, useState } from 'react';

import SeriesChart, { type SeriesPoint } from './SeriesChart';
import { GapNote, Readout, Stat, StateOverlay, bucketLabel, usePlotSize } from './panelParts';
import { periodParams, resolutionFor, type Period, type Resolution } from '@/lib/capital/marketIndexes';
import { risingFavours, type FxMetricDef, type FxPair } from '@/lib/capital/fxPairs';

// ─── Currency pair panel ──────────────────────────────────────────────────────
// The equity panel's twin, on the FX series. It carries its own statistics
// because a currency has no "high" worth reading without saying which side of
// the pair the high belongs to: a peak in USDTRY is the lira's trough.

interface Props {
    pair: FxPair;
    metric: FxMetricDef;
    period: Period;
    /** Log axis. Only the rate can carry one — a change crosses zero. */
    log: boolean;
    showGrid: boolean;
}

/** Stable empty reference — a fresh [] each render would re-run the memos. */
const EMPTY: SeriesPoint[] = [];

interface Result {
    /** Identifies the request these rows answer. */
    key: string;
    resolution: Resolution;
    pair: FxPair;
    metric: FxMetricDef;
    rows: SeriesPoint[];
    error: string | null;
}

export default function FxPanel({ pair, metric, period, log, showGrid }: Props) {
    const [result, setResult] = useState<Result | null>(null);
    const [hovered, setHovered] = useState<number | null>(null);
    const { ref, dims } = usePlotSize();

    // The window and its resolution are part of the request now, so changing
    // period refetches at the finer sampling rather than slicing what is here.
    const resolution = resolutionFor(period);
    const requestKey = `${pair.series}|${metric.key}|${period.label}`;

    useEffect(() => {
        const controller = new AbortController();
        const key = `${pair.series}|${metric.key}|${period.label}`;
        const query =
            `pair=${encodeURIComponent(pair.series)}&metric=${metric.key}&${periodParams(period)}`;

        fetch(`/api/fx?${query}`, { signal: controller.signal })
            .then(r => r.json())
            .then((body) => {
                if (!Array.isArray(body?.rows)) throw new Error(body?.error ?? 'Unexpected response');
                setResult({
                    key, pair, metric,
                    resolution: body.resolution ?? 'monthly',
                    rows: body.rows,
                    error: null,
                });
            })
            .catch((e) => {
                if (e.name === 'AbortError') return;
                setResult({
                    key, pair, metric,
                    resolution,
                    rows: [],
                    error: e.message ?? 'Failed to load currency data.',
                });
            });

        return () => controller.abort();
    }, [pair, metric, period, resolution]);

    const loading = result?.key !== requestKey;
    const error = !loading ? result?.error ?? null : null;

    const shownPair = result?.pair ?? pair;
    const shownMetric = result?.metric ?? metric;
    const shownResolution = result?.resolution ?? resolution;

    const data = result?.rows ?? EMPTY;

    const stats = useMemo(() => {
        const seen = data.filter(r => r.value != null) as { date: string; value: number }[];
        if (seen.length === 0) return null;

        const first = seen[0];
        const last = seen[seen.length - 1];
        const high = seen.reduce((a, b) => (b.value > a.value ? b : a));
        const low = seen.reduce((a, b) => (b.value < a.value ? b : a));
        // Over the window the rate moved this far — which is the base currency's
        // gain against the quote, and the quote's loss against the base.
        const change = shownMetric.kind === 'rate' && first.value !== 0
            ? (last.value / first.value - 1) * 100
            : null;

        return { first, last, high, low, change };
    }, [data, shownMetric]);

    const hoveredPoint = hovered != null ? data[hovered] ?? null : null;
    const showChart = data.length > 0 && !error;
    // Not every pair is quoted continuously — USDJPY skips whole years.
    const missing = data.filter(r => r.value == null).length;

    const rate = shownMetric.kind === 'rate';
    const useLog = rate && log;
    const unit = rate ? `${shownPair.quote}${useLog ? ' LOG' : ''}` : '%';

    return (
        <>
            <div ref={ref} className="relative w-full" style={{ height: dims.height }}>
                {showChart && (
                    <div className={`transition-opacity duration-500 ease-mechanical ${loading ? 'opacity-40' : 'opacity-100'}`}>
                        <SeriesChart
                            data={data}
                            color={shownPair.color}
                            unit={unit}
                            scaleKind={useLog ? 'log' : 'linear'}
                            label={`${shownPair.label} — ${shownMetric.label}`}
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
                            date={hoveredPoint.date}
                            resolution={shownResolution}
                            name={shownPair.shortLabel}
                            value={format(hoveredPoint.value, shownPair, shownMetric)}
                            color={shownPair.color}
                            note={rate ? `${shownPair.quote} per ${shownPair.base}` : undefined}
                        />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-y-4 border-t border-stone-line-strong px-4 py-4 sm:grid-cols-4">
                <Stat
                    label={stats ? `Latest · ${bucketLabel(stats.last.date, shownResolution)}` : 'Latest'}
                    value={stats ? format(stats.last.value, shownPair, shownMetric) : '—'}
                />
                {/* Named by which currency the extreme belongs to — a high in
                    USDTRY is the lira at its weakest, not the dollar's. */}
                <Stat
                    label={
                        stats
                            ? `${rate ? `${shownPair.base} strongest` : 'High'} · ${stats.high.date.slice(0, 4)}`
                            : 'High'
                    }
                    value={stats ? format(stats.high.value, shownPair, shownMetric) : '—'}
                />
                <Stat
                    label={
                        stats
                            ? `${rate ? `${shownPair.base} weakest` : 'Low'} · ${stats.low.date.slice(0, 4)}`
                            : 'Low'
                    }
                    value={stats ? format(stats.low.value, shownPair, shownMetric) : '—'}
                />
                <Stat
                    label={
                        stats?.change != null
                            ? `${risingFavours(shownPair)} since ${stats.first.date.slice(0, 4)}`
                            : 'Readings'
                    }
                    value={
                        stats == null ? '—'
                            : stats.change != null
                                ? `${stats.change >= 0 ? '+' : ''}${stats.change.toFixed(1)}%`
                                : String(data.length)
                    }
                    accent={stats?.change != null && stats.change >= 0}
                />
            </div>

            {!loading && (
                <GapNote
                    missing={missing}
                    total={data.length}
                    source={shownPair.shortLabel}
                    resolution={shownResolution}
                />
            )}
        </>
    );
}

/** A rate to the pair's own precision; a change as a signed percentage. */
function format(v: number | null, pair: FxPair, metric: FxMetricDef) {
    if (v == null) return '—';
    return metric.kind === 'rate'
        ? v.toLocaleString('en-US', {
            minimumFractionDigits: pair.decimals,
            maximumFractionDigits: pair.decimals,
        })
        : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
}
