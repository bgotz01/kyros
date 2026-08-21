'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ChartFrame from './ChartFrame';
import {
    SERIES,
    PAD,
    clamp,
    buildSegments,
    linePath,
    areaPath,
    type SeriesKey,
} from './series';

// ─── types ────────────────────────────────────────────────────────────────────

export type PercentileMetric = 'rank' | 'yoy';

interface PercentileRow {
    month: string;
    rank: Record<SeriesKey, number | null>;
    yoy: Record<SeriesKey, number | null>;
}

interface Props {
    active: Set<SeriesKey>;
    /** Inclusive month range, 'YYYY-MM-DD'. */
    range: { start: string; end: string };
    metric: PercentileMetric;
    showGrid: boolean;
}

// ─── scale ────────────────────────────────────────────────────────────────────

// Rank is a fixed 0–100 domain — the whole point of a percentile is that the
// axis never moves. The 1-year change is symmetric around zero and sized to
// the data, in steps of 10.
function scaleFor(metric: PercentileMetric, data: PercentileRow[], active: Set<SeriesKey>) {
    if (metric === 'rank') {
        return { lo: 0, hi: 100, ticks: [0, 20, 40, 60, 80, 100] };
    }

    let peak = 10;
    for (const row of data) {
        for (const s of SERIES) {
            if (!active.has(s.key)) continue;
            const v = row.yoy[s.key];
            if (v != null && Math.abs(v) > peak) peak = Math.abs(v);
        }
    }
    const hi = Math.min(100, Math.ceil(peak / 10) * 10);
    const step = hi <= 20 ? 5 : hi <= 60 ? 10 : 20;

    const ticks: number[] = [];
    for (let v = -hi; v <= hi; v += step) ticks.push(v);
    return { lo: -hi, hi, ticks };
}

// ─── tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({
    row,
    active,
    metric,
}: {
    row: PercentileRow;
    active: Set<SeriesKey>;
    metric: PercentileMetric;
}) {
    const d = new Date(row.month + 'T00:00:00Z');
    const label = d.toLocaleString('default', { month: 'short', year: 'numeric', timeZone: 'UTC' });

    return (
        <div className="border border-stone-line-strong bg-obsidian px-4 py-3">
            <p className="mb-2.5 font-mono text-[0.6rem] tracking-[0.18em] text-bronze">
                {label} · {metric === 'rank' ? 'Percentile' : 'Δ 1Y'}
            </p>
            <div className="flex flex-col gap-1.5">
                {SERIES.filter(s => active.has(s.key)).map(s => {
                    const v = row[metric][s.key];
                    return (
                        <div key={s.key} className="flex items-center gap-2.5">
                            <span className="h-0.5 w-4 shrink-0" style={{ background: s.color }} />
                            <span className="w-9 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-marble-dim">
                                {s.shortLabel}
                            </span>
                            <span className="w-12 font-mono text-[0.68rem] tracking-[0.06em] text-marble tabular-nums">
                                {v == null
                                    ? '—'
                                    : metric === 'yoy' && v > 0
                                        ? `+${v.toFixed(1)}`
                                        : v.toFixed(1)}
                            </span>
                            {/* rank track — where the reading sits in its own history */}
                            {metric === 'rank' && (
                                <span className="relative h-px w-10 bg-stone-line-strong">
                                    {v != null && (
                                        <span
                                            className="absolute -top-[2px] h-[5px] w-[5px] -translate-x-1/2 rounded-full"
                                            style={{ background: s.color, left: `${v}%` }}
                                        />
                                    )}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── component ────────────────────────────────────────────────────────────────

export default function PercentileChart({ active, range, metric, showGrid }: Props) {
    const [allData, setAllData] = useState<PercentileRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hovered, setHovered] = useState<number | null>(null);
    const [dims, setDims] = useState({ width: 900, height: 420 });

    const containerRef = useRef<HTMLDivElement>(null);

    // resize observer
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const obs = new ResizeObserver(([e]) => {
            const w = e.contentRect.width;
            const h = Math.max(280, Math.min(500, Math.round(w * 0.36)));
            setDims({ width: w, height: h });
        });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    // fetch — percentiles only, loaded the first time this view is opened
    useEffect(() => {
        let live = true;
        fetch('/api/macro-percentiles')
            .then(r => r.json())
            .then((rows) => {
                if (!live) return;
                if (!Array.isArray(rows)) throw new Error(rows?.error ?? 'Unexpected response');
                setAllData(rows);
                setLoading(false);
            })
            .catch((e) => {
                if (!live) return;
                setError(e.message ?? 'Failed to load percentile data.');
                setLoading(false);
            });
        return () => { live = false; };
    }, []);

    const data = useMemo(
        () => allData.filter(r => r.month >= range.start && r.month <= range.end),
        [allData, range.start, range.end],
    );

    const hoveredRow = hovered != null ? data[hovered] ?? null : null;

    const { width, height } = dims;
    const plotW = width - PAD.left - PAD.right;
    const plotH = height - PAD.top - PAD.bottom;

    const { lo, hi, ticks } = scaleFor(metric, data, active);

    const xOf = (i: number) =>
        data.length < 2 ? PAD.left + plotW / 2 : PAD.left + (i / (data.length - 1)) * plotW;
    const yOf = (v: number) =>
        PAD.top + plotH - clamp((v - lo) / (hi - lo), 0, 1) * plotH;

    const paths = SERIES.filter(s => active.has(s.key)).map(s => ({
        ...s,
        segments: buildSegments(data, row => row[metric][s.key], xOf, yOf),
    }));

    // A lone series gets a wash — down to the floor for a rank, to zero for a change.
    const lone = paths.length === 1 ? paths[0] : null;
    const baseline = metric === 'rank' ? PAD.top + plotH : yOf(0);

    const hx = hovered != null ? xOf(hovered) : null;
    const plottable = !loading && !error && data.length > 0 && plotW > 0 && plotH > 0;

    return (
        <div ref={containerRef} className="relative w-full">

            {loading && (
                <div className="flex items-center justify-center py-32">
                    <span className="animate-pulse font-mono text-[0.6rem] tracking-[0.28em] text-platinum-dim">
                        Loading…
                    </span>
                </div>
            )}

            {error && (
                <div className="flex items-center justify-center py-32">
                    <span className="font-mono text-[0.6rem] tracking-[0.18em] text-bronze">{error}</span>
                </div>
            )}

            {!loading && !error && data.length === 0 && (
                <div className="flex items-center justify-center py-32">
                    <span className="font-mono text-[0.6rem] tracking-[0.18em] text-platinum-dim">
                        No percentile data for this period.
                    </span>
                </div>
            )}

            {plottable && (
                <svg
                    width={width}
                    height={height}
                    className="block cursor-crosshair"
                    onMouseMove={e => {
                        const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                        const mx = e.clientX - rect.left - PAD.left;
                        setHovered(clamp(Math.round((mx / plotW) * (data.length - 1)), 0, data.length - 1));
                    }}
                    onMouseLeave={() => setHovered(null)}
                    aria-label="Macro percentile chart"
                >
                    {lone && (
                        <defs>
                            <linearGradient id="pct-wash" x1="0" y1={PAD.top} x2="0" y2={baseline} gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor={lone.color} stopOpacity={0.22} />
                                <stop offset="100%" stopColor={lone.color} stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                    )}

                    <ChartFrame
                        dates={data.map(r => r.month)}
                        yTicks={ticks}
                        xOf={xOf}
                        yOf={yOf}
                        plotW={plotW}
                        plotH={plotH}
                        height={height}
                        showGrid={showGrid}
                        unit={metric === 'rank' ? 'PCTL' : 'Δ PCTL'}
                    >
                        {/* extreme bands — top and bottom quintile of the historical range */}
                        {metric === 'rank' && (
                            <>
                                <rect
                                    x={PAD.left} y={yOf(100)} width={plotW} height={yOf(80) - yOf(100)}
                                    fill="var(--color-bronze)" fillOpacity={0.07}
                                />
                                <rect
                                    x={PAD.left} y={yOf(20)} width={plotW} height={yOf(0) - yOf(20)}
                                    fill="var(--color-bronze)" fillOpacity={0.07}
                                />
                            </>
                        )}
                    </ChartFrame>

                    {/* median line for rank, zero line for the 1-year change */}
                    {metric === 'rank' ? (
                        <line
                            x1={PAD.left} y1={yOf(50)} x2={PAD.left + plotW} y2={yOf(50)}
                            stroke="var(--color-bronze)" strokeWidth={1} strokeOpacity={0.55}
                        />
                    ) : (
                        <line
                            x1={PAD.left} y1={yOf(0)} x2={PAD.left + plotW} y2={yOf(0)}
                            stroke="#C0563F" strokeWidth={1} strokeOpacity={0.8}
                        />
                    )}

                    {/* wash under a lone series */}
                    {lone && (
                        <path d={areaPath(lone.segments, baseline)} fill="url(#pct-wash)" stroke="none" />
                    )}

                    {/* series lines */}
                    {paths.map(s => (
                        <path
                            key={s.key}
                            d={linePath(s.segments)}
                            fill="none"
                            stroke={s.color}
                            strokeWidth={1.75}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />
                    ))}

                    {/* hover crosshair + dots */}
                    {hx != null && hovered != null && data[hovered] && (
                        <>
                            <line
                                x1={hx} y1={PAD.top} x2={hx} y2={PAD.top + plotH}
                                stroke="var(--color-bronze)" strokeWidth={1} strokeOpacity={0.65}
                            />
                            {SERIES.filter(s => active.has(s.key)).map(s => {
                                const v = data[hovered][metric][s.key];
                                if (v == null) return null;
                                return (
                                    <circle
                                        key={s.key}
                                        cx={hx} cy={yOf(v)} r={3.5}
                                        fill={s.color}
                                        stroke="var(--color-obsidian)" strokeWidth={1.5}
                                    />
                                );
                            })}
                        </>
                    )}
                </svg>
            )}

            {hoveredRow && (
                <div className="pointer-events-none absolute right-5 top-4">
                    <Tooltip row={hoveredRow} active={active} metric={metric} />
                </div>
            )}
        </div>
    );
}
