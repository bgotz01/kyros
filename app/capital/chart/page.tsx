'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── types ────────────────────────────────────────────────────────────────────

interface MacroRow {
    month: string;
    ten_y: number | null;
    cpi: number | null;
    ey5: number | null;
    real10: number | null;
    eyp5: number | null;
    rey5: number | null;
}

type SeriesKey = 'ten_y' | 'cpi' | 'ey5' | 'real10' | 'eyp5' | 'rey5';

// ─── series config ────────────────────────────────────────────────────────────

type SeriesGroup = 'nominal' | 'relative';

interface SeriesDef {
    key: SeriesKey;
    label: string;
    shortLabel: string;
    description: string;
    color: string;
    group: SeriesGroup;
}

const SERIES: SeriesDef[] = [
    // Nominal
    {
        key: 'ten_y',
        label: '10-Year Treasury Yield',
        shortLabel: '10Y',
        description: 'US 10-Year nominal yield — monthly average of daily data',
        color: '#E8B84B',   // amber
        group: 'nominal',
    },
    {
        key: 'cpi',
        label: 'CPI YoY',
        shortLabel: 'CPI',
        description: 'Consumer Price Index — year-over-year change',
        color: '#4FC4A0',   // mint
        group: 'nominal',
    },
    {
        key: 'ey5',
        label: 'Earnings Yield 5yr',
        shortLabel: 'EY5',
        description: 'S&P 500 earnings yield using 5-year rolling average earnings',
        color: '#F07A50',   // coral
        group: 'nominal',
    },
    // Relative
    {
        key: 'real10',
        label: 'Real 10Y Yield',
        shortLabel: 'R10Y',
        description: '10-Year Treasury Yield minus CPI — real rate',
        color: '#6AAEE8',   // sky blue
        group: 'relative',
    },
    {
        key: 'eyp5',
        label: 'Earnings Yield Premium 5yr',
        shortLabel: 'EYP5',
        description: 'EY5 minus 5-year treasury yield — equity risk premium',
        color: '#C084E8',   // violet
        group: 'relative',
    },
    {
        key: 'rey5',
        label: 'Real Earnings Yield 5yr',
        shortLabel: 'REY5',
        description: 'EY5 minus CPI — real return on equities',
        color: '#8FD46A',   // lime green
        group: 'relative',
    },
];

const SERIES_BY_KEY = Object.fromEntries(SERIES.map(s => [s.key, s])) as Record<SeriesKey, SeriesDef>;

// ─── decade presets ───────────────────────────────────────────────────────────

interface Decade {
    label: string;
    start: string;
    end: string;
}

const DECADES: Decade[] = [
    { label: 'All', start: '1960-01-01', end: '2026-12-31' },
    { label: '1960s', start: '1960-01-01', end: '1969-12-31' },
    { label: '1970s', start: '1970-01-01', end: '1979-12-31' },
    { label: '1980s', start: '1980-01-01', end: '1989-12-31' },
    { label: '1990s', start: '1990-01-01', end: '1999-12-31' },
    { label: '2000s', start: '2000-01-01', end: '2009-12-31' },
    { label: '2010s', start: '2010-01-01', end: '2019-12-31' },
    { label: '2020s', start: '2020-01-01', end: '2026-12-31' },
];

// ─── chart constants ──────────────────────────────────────────────────────────

const PAD = { top: 24, right: 24, bottom: 44, left: 52 };
const Y_TICKS = 6;

// ─── helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

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

    // x-axis year labels — one per year, spaced to avoid overlap
    // x-axis labels every 5 years (1960, 1965, 1970, …)
    // decade vertical lines at every 10th year
    const xLabels: { i: number; label: string }[] = [];
    const decadeLines: number[] = [];
    for (let i = 0; i < data.length; i++) {
        const year = parseInt(data[i].month.slice(0, 4), 10);
        const month = parseInt(data[i].month.slice(5, 7), 10);
        if (month === 1) {
            if (year % 10 === 0) decadeLines.push(xOf(i));
            if (year % 5 === 0) xLabels.push({ i, label: String(year) });
        }
    }

    // SVG paths per series
    const activePaths = SERIES.filter(s => active.has(s.key)).map(s => {
        let d = '';
        let open = false;
        for (let i = 0; i < data.length; i++) {
            const v = data[i][s.key];
            if (v == null) { open = false; continue; }
            const x = xOf(i), y = yOf(v);
            d += open ? ` L ${x} ${y}` : `M ${x} ${y}`;
            open = true;
        }
        return { ...s, d };
    });

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
            {/* horizontal grid */}
            {showGrid && yTicks.map((tick, i) => {
                const y = yOf(tick);
                return (
                    <g key={i}>
                        <line
                            x1={PAD.left} y1={y} x2={PAD.left + plotW} y2={y}
                            stroke="var(--color-stone-line-strong)"
                            strokeWidth={1}
                            strokeDasharray="2 8"
                            strokeOpacity={0.6}
                        />
                        <text
                            x={PAD.left - 7} y={y}
                            textAnchor="end" dominantBaseline="middle"
                            fontSize={9} fontFamily="var(--font-geist-mono), monospace"
                            fill="var(--color-platinum-dim)" letterSpacing="0.05em"
                        >
                            {tick}
                        </text>
                    </g>
                );
            })}

            {/* zero line — always rendered in red when 0 is in range */}
            {lo < 0 && hi > 0 && (
                <line
                    x1={PAD.left} y1={yOf(0)} x2={PAD.left + plotW} y2={yOf(0)}
                    stroke="#C0392B"
                    strokeWidth={1}
                    strokeOpacity={0.7}
                />
            )}

            {/* x-axis labels */}
            {xLabels.map(({ i, label }) => (
                <text
                    key={label}
                    x={xOf(i)} y={height - 8}
                    textAnchor="middle" fontSize={9}
                    fontFamily="var(--font-geist-mono), monospace"
                    fill="var(--color-platinum-dim)" letterSpacing="0.07em"
                >
                    {label}
                </text>
            ))}

            {/* decade vertical lines */}
            {showGrid && decadeLines.map(x => (
                <line
                    key={x}
                    x1={x} y1={PAD.top} x2={x} y2={PAD.top + plotH}
                    stroke="var(--color-stone-line-strong)"
                    strokeWidth={1}
                    strokeOpacity={0.55}
                />
            ))}

            {/* series lines */}
            {activePaths.map(s => (
                <path
                    key={s.key}
                    d={s.d}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
            ))}

            {/* hover crosshair + dots */}
            {hx != null && hovered != null && (
                <>
                    <line
                        x1={hx} y1={PAD.top} x2={hx} y2={PAD.top + plotH}
                        stroke="var(--color-stone-line-strong)" strokeWidth={1}
                    />
                    {SERIES.filter(s => active.has(s.key)).map(s => {
                        const v = data[hovered][s.key];
                        if (v == null) return null;
                        return (
                            <circle
                                key={s.key}
                                cx={hx} cy={yOf(v)} r={3.5}
                                fill={s.color}
                                stroke="var(--color-charcoal)" strokeWidth={1.5}
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
                            <span className="w-9 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-platinum">
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

// ─── page ─────────────────────────────────────────────────────────────────────

const DEFAULT_ACTIVE: Set<SeriesKey> = new Set(['rey5']);

export default function MacroChartPage() {
    const [allData, setAllData] = useState<MacroRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [active, setActive] = useState<Set<SeriesKey>>(DEFAULT_ACTIVE);
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
    }, []);

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

            {/* chart */}
            <div ref={containerRef} className="relative w-full border border-stone-line bg-charcoal">

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

            {/* legend */}
            <div className="mt-6 grid grid-cols-2 gap-x-12 gap-y-2 sm:grid-cols-3">
                {SERIES.map(s => {
                    const on = active.has(s.key);
                    return (
                        <div
                            key={s.key}
                            className={`flex items-start gap-2.5 transition-opacity duration-500 ${on ? 'opacity-100' : 'opacity-25'}`}
                        >
                            <span
                                className="mt-[5px] h-0.5 w-4 shrink-0 rounded-full"
                                style={{ background: s.color }}
                            />
                            <div>
                                <p className="font-sans text-[0.6rem] uppercase tracking-[0.16em] text-platinum">
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
