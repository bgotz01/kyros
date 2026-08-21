'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

import ChartFrame from './ChartFrame';
import PercentileChart from './PercentileChart';
import {
    SERIES,
    DECADES,
    PAD,
    clamp,
    buildSegments,
    linePath,
    areaPath,
    type MacroRow,
    type SeriesKey,
    type SeriesDef,
    type Decade,
} from './series';

// ─── chart constants ──────────────────────────────────────────────────────────

const Y_TICKS = 6;

// ─── helpers ─────────────────────────────────────────────────────────────────

function niceRange(min: number, max: number): [number, number, number[]] {
    // Round outward to whole numbers, pick a clean integer step for ~5-7 ticks
    const lo = Math.floor(min) - 1;
    const hi = Math.ceil(max) + 1;
    const span = hi - lo || 1;

    const rawStep = span / Y_TICKS;
    const step = Math.max(1, Math.ceil(rawStep));

    const start = Math.floor(lo / step) * step;
    const ticks: number[] = [];
    for (let v = start; v <= hi + step; v += step) {
        ticks.push(v);
        if (ticks.length > 12) break;
    }

    return [ticks[0], ticks[ticks.length - 1], ticks];
}

// ─── SVG line chart ───────────────────────────────────────────────────────────

interface LineChartProps {
    data: MacroRow[];
    active: Set<SeriesKey>;
    width: number;
    height: number;
    hovered: number | null;
    onHover: (idx: number | null) => void;
    showGrid: boolean;
}

function LineChart({ data, active, width, height, hovered, onHover, showGrid }: LineChartProps) {
    const plotW = width - PAD.left - PAD.right;
    const plotH = height - PAD.top - PAD.bottom;

    if (plotW <= 0 || plotH <= 0 || data.length === 0) return null;

    // y-range across all active series
    let yMin = Infinity, yMax = -Infinity;
    for (const s of SERIES) {
        if (!active.has(s.key)) continue;
        for (const row of data) {
            const v = row[s.key];
            if (v == null) continue;
            if (v < yMin) yMin = v;
            if (v > yMax) yMax = v;
        }
    }
    if (!isFinite(yMin)) { yMin = -5; yMax = 15; }
    const [lo, hi, yTicks] = niceRange(yMin, yMax);

    const xOf = (i: number) =>
        data.length < 2 ? PAD.left + plotW / 2 : PAD.left + (i / (data.length - 1)) * plotW;
    const yOf = (v: number) =>
        PAD.top + plotH - clamp((v - lo) / (hi - lo), 0, 1) * plotH;

    const shown = SERIES.filter(s => active.has(s.key));
    const activePaths = shown.map(s => ({
        ...s,
        segments: buildSegments(data, row => row[s.key], xOf, yOf),
    }));

    // A single series gets a wash down to zero — with six of them it would be mud.
    const lone = activePaths.length === 1 ? activePaths[0] : null;
    const baseline = lo < 0 && hi > 0 ? yOf(0) : PAD.top + plotH;

    const hx = hovered != null ? xOf(hovered) : null;

    return (
        <svg
            width={width}
            height={height}
            className="block cursor-crosshair"
            onMouseMove={e => {
                const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                const mx = e.clientX - rect.left - PAD.left;
                onHover(clamp(Math.round((mx / plotW) * (data.length - 1)), 0, data.length - 1));
            }}
            onMouseLeave={() => onHover(null)}
            aria-label="Macro indicators chart"
        >
            {lone && (
                <defs>
                    <linearGradient id="wash" x1="0" y1={PAD.top} x2="0" y2={baseline} gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor={lone.color} stopOpacity={0.22} />
                        <stop offset="100%" stopColor={lone.color} stopOpacity={0.02} />
                    </linearGradient>
                </defs>
            )}

            <ChartFrame
                dates={data.map(r => r.month)}
                yTicks={yTicks}
                xOf={xOf}
                yOf={yOf}
                plotW={plotW}
                plotH={plotH}
                height={height}
                showGrid={showGrid}
                unit="%"
            />

            {/* zero line — the divide between real gain and real loss */}
            {lo < 0 && hi > 0 && (
                <line
                    x1={PAD.left} y1={yOf(0)} x2={PAD.left + plotW} y2={yOf(0)}
                    stroke="#C0563F"
                    strokeWidth={1}
                    strokeOpacity={0.8}
                />
            )}

            {/* wash under a lone series */}
            {lone && (
                <path d={areaPath(lone.segments, baseline)} fill="url(#wash)" stroke="none" />
            )}

            {/* series lines */}
            {activePaths.map(s => (
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
            {hx != null && hovered != null && (
                <>
                    <line
                        x1={hx} y1={PAD.top} x2={hx} y2={PAD.top + plotH}
                        stroke="var(--color-bronze)" strokeWidth={1} strokeOpacity={0.65}
                    />
                    {SERIES.filter(s => active.has(s.key)).map(s => {
                        const v = data[hovered][s.key];
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
    );
}

// ─── tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({ row, active }: { row: MacroRow; active: Set<SeriesKey> }) {
    const d = new Date(row.month + 'T00:00:00Z');
    const label = d.toLocaleString('default', { month: 'short', year: 'numeric', timeZone: 'UTC' });

    return (
        <div className="border border-stone-line-strong bg-obsidian px-4 py-3">
            <p className="mb-2.5 font-mono text-[0.6rem] tracking-[0.18em] text-bronze">
                {label}
            </p>
            <div className="flex flex-col gap-1.5">
                {SERIES.filter(s => active.has(s.key)).map(s => {
                    const v = row[s.key];
                    return (
                        <div key={s.key} className="flex items-center gap-2.5">
                            <span
                                className="h-px w-4 shrink-0"
                                style={{ background: s.color, height: 2 }}
                            />
                            <span className="w-9 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-marble-dim">
                                {s.shortLabel}
                            </span>
                            <span className="font-mono text-[0.68rem] tracking-[0.06em] text-marble tabular-nums">
                                {v != null ? `${v.toFixed(2)}%` : '—'}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── series toggle button ─────────────────────────────────────────────────────

function SeriesToggle({
    s,
    on,
    onClick,
}: {
    s: SeriesDef;
    on: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={s.description}
            className={`
                flex items-center gap-2 border px-3 py-1.5
                font-sans text-[0.6rem] uppercase tracking-[0.2em]
                transition-colors duration-500 ease-mechanical
                ${on
                    ? 'border-stone-line-strong text-marble'
                    : 'border-transparent text-platinum hover:text-marble'}
            `}
        >
            <span
                className="h-0.5 w-3.5 shrink-0 rounded-full transition-opacity duration-500"
                style={{ background: s.color, opacity: on ? 1 : 0.2 }}
            />
            {s.shortLabel}
        </button>
    );
}

// ─── view modes ───────────────────────────────────────────────────────────────

type ViewMode = 'value' | 'rank' | 'yoy';

const VIEWS: { mode: ViewMode; label: string; hint: string }[] = [
    { mode: 'value', label: 'Actual Values', hint: 'The reading itself, in percent' },
    { mode: 'rank', label: 'Percentile', hint: 'Where the reading sits in its own history — 0 to 100' },
    { mode: 'yoy', label: 'Percentile Change', hint: 'How far the percentile moved over the past year' },
];

// ─── page ─────────────────────────────────────────────────────────────────────

const DEFAULT_ACTIVE: Set<SeriesKey> = new Set(['rey5']);

export default function MacroChartPage() {
    const [allData, setAllData] = useState<MacroRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [active, setActive] = useState<Set<SeriesKey>>(DEFAULT_ACTIVE);
    const [view, setView] = useState<ViewMode>('value');
    const [decade, setDecade] = useState<Decade>(DECADES[0]);
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [usingCustom, setUsingCustom] = useState(false);
    const [showGrid, setShowGrid] = useState(true);
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
    }, [view]);

    // fetch
    useEffect(() => {
        fetch('/api/macro-chart')
            .then(r => r.json())
            .then((rows) => {
                if (!Array.isArray(rows)) throw new Error(rows?.error ?? 'Unexpected response');
                setAllData(rows);
                setLoading(false);
            })
            .catch((e) => { setError(e.message ?? 'Failed to load macro data.'); setLoading(false); });
    }, []);

    // filter by decade or custom range
    const activeRange = usingCustom && customFrom && customTo
        ? { start: `${customFrom}-01-01`, end: `${customTo}-12-31` }
        : decade;
    const data = allData.filter(r => r.month >= activeRange.start && r.month <= activeRange.end);

    // toggle — must keep at least one active
    const toggle = useCallback((key: SeriesKey) => {
        setActive(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                if (next.size === 1) return prev;
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
        setHovered(null);
    }, []);

    const hoveredRow = hovered != null ? data[hovered] ?? null : null;

    const nominal = SERIES.filter(s => s.group === 'nominal');
    const relative = SERIES.filter(s => s.group === 'relative');

    return (
        <div className="mx-auto w-full max-w-[1100px] px-8 py-16">

            {/* header */}
            <div className="mb-10">
                <div className="mb-3 flex flex-wrap items-baseline gap-x-8 gap-y-2">
                    <h1 className="font-serif text-2xl font-light tracking-[0.16em] text-marble">
                        Macro Regimes
                    </h1>
                    <span className="font-mono text-[0.65rem] tracking-[0.2em] text-bronze">
                        Rate · Inflation · Valuation
                    </span>
                </div>
                <p className="font-sans text-[0.6rem] uppercase tracking-[0.24em] text-platinum">
                    Monthly data · 1962–2026 · FRED · Yahoo Finance
                </p>
            </div>

            {/* controls row */}
            <div className="mb-5 flex flex-wrap items-start justify-between gap-y-4">

                {/* series toggles — two groups */}
                <div className="flex flex-col gap-2">
                    {/* nominal */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="w-16 font-sans text-[0.55rem] uppercase tracking-[0.2em] text-platinum">
                            Nominal
                        </span>
                        {nominal.map(s => (
                            <SeriesToggle key={s.key} s={s} on={active.has(s.key)} onClick={() => toggle(s.key)} />
                        ))}
                    </div>
                    {/* relative */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="w-16 font-sans text-[0.55rem] uppercase tracking-[0.2em] text-platinum">
                            Relative
                        </span>
                        {relative.map(s => (
                            <SeriesToggle key={s.key} s={s} on={active.has(s.key)} onClick={() => toggle(s.key)} />
                        ))}
                    </div>
                </div>

                {/* decade presets + custom range */}
                <div className="flex flex-col items-end gap-2">

                    {/* preset buttons */}
                    <div className="flex flex-wrap justify-end gap-1">
                        {DECADES.map(d => {
                            const on = !usingCustom && decade.label === d.label;
                            return (
                                <button
                                    key={d.label}
                                    type="button"
                                    onClick={() => { setDecade(d); setUsingCustom(false); setHovered(null); }}
                                    className={`
                                        px-2.5 py-1 font-mono text-[0.62rem] tracking-[0.1em]
                                        transition-colors duration-500 ease-mechanical
                                        ${on
                                            ? 'border border-stone-line-strong bg-charcoal text-bronze'
                                            : 'border border-transparent text-platinum hover:text-marble'}
                                    `}
                                >
                                    {d.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* custom range */}
                    <div className="flex items-center gap-2">
                        <span className="font-sans text-[0.55rem] uppercase tracking-[0.2em] text-platinum">
                            Custom
                        </span>
                        <input
                            type="number"
                            min={1914}
                            max={2026}
                            placeholder="From"
                            value={customFrom}
                            onChange={e => { setCustomFrom(e.target.value); setUsingCustom(true); setHovered(null); }}
                            className={`
                                w-16 border bg-obsidian px-2 py-1
                                font-mono text-[0.62rem] tracking-[0.08em] text-platinum
                                placeholder:text-platinum-dim focus:outline-none
                                transition-colors duration-300
                                ${usingCustom ? 'border-stone-line-strong' : 'border-stone-line'}
                            `}
                        />
                        <span className="font-mono text-[0.6rem] text-platinum-dim">—</span>
                        <input
                            type="number"
                            min={1914}
                            max={2026}
                            placeholder="To"
                            value={customTo}
                            onChange={e => { setCustomTo(e.target.value); setUsingCustom(true); setHovered(null); }}
                            className={`
                                w-16 border bg-obsidian px-2 py-1
                                font-mono text-[0.62rem] tracking-[0.08em] text-platinum
                                placeholder:text-platinum-dim focus:outline-none
                                transition-colors duration-300
                                ${usingCustom ? 'border-stone-line-strong' : 'border-stone-line'}
                            `}
                        />
                    </div>

                    {/* grid toggle */}
                    <button
                        type="button"
                        onClick={() => setShowGrid(g => !g)}
                        className={`
                            flex items-center gap-2 border px-3 py-1.5 self-end
                            font-sans text-[0.6rem] uppercase tracking-[0.2em]
                            transition-colors duration-500 ease-mechanical
                            ${showGrid
                                ? 'border-stone-line-strong text-platinum'
                                : 'border-transparent text-platinum hover:text-marble'}
                        `}
                    >
                        <span className={`h-2 w-2 border transition-colors duration-300 ${showGrid ? 'border-bronze bg-bronze/30' : 'border-platinum-dim'}`} />
                        Grid
                    </button>
                </div>
            </div>

            {/* chart panel */}
            <div className="w-full border border-stone-line-strong bg-charcoal">

                {/* panel header — what is plotted, and the view it is plotted in */}
                <div className="flex flex-wrap items-center justify-between gap-y-3 border-b border-stone-line-strong px-4 py-3">
                    <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-platinum">
                        <span className="text-bronze">{usingCustom ? 'Custom' : decade.label}</span>
                        {'  ·  '}
                        {activeRange.start.slice(0, 4)}—{activeRange.end.slice(0, 4)}
                    </p>
                    <div className="ml-auto flex border border-stone-line-strong">
                        {VIEWS.map((v, i) => {
                            const on = view === v.mode;
                            return (
                                <button
                                    key={v.mode}
                                    type="button"
                                    onClick={() => { setView(v.mode); setHovered(null); }}
                                    title={v.hint}
                                    aria-pressed={on}
                                    className={`
                                        px-4 py-2 font-sans text-[0.66rem] uppercase tracking-[0.18em]
                                        transition-colors duration-500 ease-mechanical
                                        ${i > 0 ? 'border-l border-stone-line-strong' : ''}
                                        ${on
                                            ? 'bg-bronze/15 text-bronze-bright'
                                            : 'text-platinum hover:bg-obsidian/50 hover:text-marble'}
                                    `}
                                >
                                    {v.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

            {view !== 'value' ? (
                <PercentileChart
                    active={active}
                    range={activeRange}
                    metric={view}
                    showGrid={showGrid}
                />
            ) : (
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
                            No data for this period.
                        </span>
                    </div>
                )}

                {!loading && !error && data.length > 0 && (
                    <LineChart
                        data={data}
                        active={active}
                        width={dims.width}
                        height={dims.height}
                        hovered={hovered}
                        onHover={setHovered}
                        showGrid={showGrid}
                    />
                )}

                {hoveredRow && (
                    <div className="pointer-events-none absolute right-5 top-4">
                        <Tooltip row={hoveredRow} active={active} />
                    </div>
                )}
            </div>
            )}
            </div>

            {/* legend */}
            <div className="mt-6 grid grid-cols-2 gap-x-12 gap-y-2 sm:grid-cols-3">
                {SERIES.map(s => {
                    const on = active.has(s.key);
                    return (
                        <div
                            key={s.key}
                            className={`flex items-start gap-2.5 transition-opacity duration-500 ${on ? 'opacity-100' : 'opacity-45'}`}
                        >
                            <span
                                className="mt-[5px] h-0.5 w-4 shrink-0 rounded-full"
                                style={{ background: s.color }}
                            />
                            <div>
                                <p className="font-sans text-[0.6rem] uppercase tracking-[0.16em] text-marble-dim">
                                    {s.shortLabel} — {s.label}
                                </p>
                                <p className="font-sans text-[0.56rem] leading-relaxed tracking-[0.03em] text-platinum">
                                    {s.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
