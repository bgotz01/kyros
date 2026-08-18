'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { nominalGDP, pppGDP, type GDPYear } from './gdp-data';

// ─── constants ────────────────────────────────────────────────────────────────

const TOP_N = 10;
const BAR_HEIGHT = 33;
const BAR_GAP = 7;
const CHART_HEIGHT = TOP_N * (BAR_HEIGHT + BAR_GAP) - BAR_GAP;
const LABEL_W = 140;
const VALUE_W = 76;
const TRANSITION_MS = 600;

const COUNTRY_COLORS: Record<string, string> = {
    'United States': '#e8a838',
    'China': '#e05252',
    'Japan': '#4a9fd4',
    'Germany': '#6dbf5e',
    'West Germany': '#6dbf5e',
    'United Kingdom': '#b87fc4',
    'France': '#e8c44a',
    'India': '#f07840',
    'Italy': '#3dbfb0',
    'Canada': '#d4a040',
    'Soviet Union': '#c46060',
    'Russia': '#c46060',
    'Brazil': '#4abf88',
    'South Korea': '#5ba8e0',
    'Spain': '#e08858',
    'Mexico': '#b8c840',
    'Iran': '#d4a060',
    'Indonesia': '#f0b040',
};

function countryColor(name: string): string {
    return COUNTRY_COLORS[name] ?? '#96a1a8';
}

// ─── types ────────────────────────────────────────────────────────────────────

type Mode = 'nominal' | 'ppp' | 'ratio';

// ─── ratio dataset ────────────────────────────────────────────────────────────
// For each year that exists in BOTH nominal and PPP, compute PPP/Nominal per
// country and rank descending. Only countries present in both are included.

function buildRatioDataset(): GDPYear[] {
    const nominalByYear = new Map(nominalGDP.map((y) => [y.year, y]));
    const result: GDPYear[] = [];

    for (const pppYear of pppGDP) {
        const nomYear = nominalByYear.get(pppYear.year);
        if (!nomYear) continue;

        // Build nominal lookup by country
        const nomByCountry = new Map(nomYear.economies.map((e) => [e.country, e.value]));

        const entries = pppYear.economies
            .filter((e) => nomByCountry.has(e.country) && nomByCountry.get(e.country)! > 0)
            .map((e) => ({
                country: e.country,
                // ratio * 100 so it reads as "PPP is X% of nominal"
                value: parseFloat(((e.value / nomByCountry.get(e.country)!)).toFixed(3)),
                rank: 0,
            }))
            .sort((a, b) => b.value - a.value)
            .map((e, i) => ({ ...e, rank: i + 1 }));

        result.push({ year: pppYear.year, economies: entries });
    }

    return result;
}

const ratioGDP: GDPYear[] = buildRatioDataset();

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatValue(v: number, mode: Mode): string {
    if (mode === 'ratio') return `${v.toFixed(2)}×`;
    if (v >= 10000) return `$${(v / 1000).toFixed(1)}T`;
    if (v >= 1000) return `$${(v / 1000).toFixed(2)}T`;
    return `$${v.toFixed(0)}B`;
}

// ─── animated bar ─────────────────────────────────────────────────────────────

interface BarProps {
    rank: number;
    country: string;
    value: number;
    maxValue: number;
    prevY: number | null;
    mode: Mode;
}

function Bar({ rank, country, value, maxValue, prevY, mode }: BarProps) {
    const barRef = useRef<HTMLDivElement>(null);
    const targetY = rank * (BAR_HEIGHT + BAR_GAP);

    useEffect(() => {
        const el = barRef.current;
        if (!el) return;
        const from = prevY ?? targetY;
        el.style.transition = 'none';
        el.style.transform = `translateY(${from}px)`;
        void el.offsetHeight;
        el.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(0.22,0.61,0.36,1), opacity ${TRANSITION_MS / 2}ms ease`;
        el.style.opacity = '1';
        el.style.transform = `translateY(${targetY}px)`;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetY]);

    const widthPct = maxValue > 0 ? (value / maxValue) * 100 : 0;
    const color = countryColor(country);

    return (
        <div
            ref={barRef}
            className="absolute left-0 right-0"
            style={{ height: BAR_HEIGHT, opacity: 0, transform: `translateY(${prevY ?? targetY}px)`, willChange: 'transform' }}
        >
            {/* label */}
            <div
                className="absolute left-0 flex items-center justify-end pr-4 font-sans text-[0.72rem] uppercase tracking-[0.14em]"
                style={{ width: LABEL_W, height: BAR_HEIGHT, color: 'var(--color-platinum)' }}
            >
                {country}
            </div>

            {/* bar track */}
            <div
                className="absolute top-1/2 -translate-y-1/2 overflow-hidden"
                style={{ left: LABEL_W, right: VALUE_W, height: BAR_HEIGHT - 10, background: 'var(--color-stone-line)' }}
            >
                <div
                    className="absolute inset-y-0 left-0"
                    style={{
                        width: `${widthPct}%`,
                        background: color,
                        opacity: 0.9,
                        transition: `width ${TRANSITION_MS}ms cubic-bezier(0.22,0.61,0.36,1)`,
                    }}
                />
                <div
                    className="absolute inset-y-0 left-0 flex items-center pl-2.5 font-mono text-[0.65rem] tracking-[0.1em]"
                    style={{ color: 'var(--color-charcoal)', fontWeight: 700, opacity: 0.9 }}
                >
                    #{rank + 1}
                </div>
            </div>

            {/* value */}
            <div
                className="absolute right-0 flex items-center font-mono text-[0.72rem] tracking-[0.08em]"
                style={{ width: VALUE_W, height: BAR_HEIGHT, color, justifyContent: 'flex-start', paddingLeft: 10 }}
            >
                {formatValue(value, mode)}
            </div>
        </div>
    );
}

// ─── bar chart ────────────────────────────────────────────────────────────────

function RaceChart({ yearData, mode }: { yearData: GDPYear; mode: Mode }) {
    const prevPositions = useRef<Map<string, number>>(new Map());

    const bars = useMemo(() => {
        return [...yearData.economies].slice(0, TOP_N).map((e, rank) => ({
            rank,
            country: e.country,
            value: e.value,
        }));
    }, [yearData]);

    const maxValue = bars[0]?.value ?? 1;
    const prevMap = new Map(prevPositions.current);

    useEffect(() => {
        const next = new Map<string, number>();
        bars.forEach((b) => next.set(b.country, b.rank * (BAR_HEIGHT + BAR_GAP)));
        prevPositions.current = next;
    });

    return (
        <div className="relative w-full" style={{ height: CHART_HEIGHT }}>
            {bars.map((bar) => (
                <Bar
                    key={bar.country}
                    rank={bar.rank}
                    country={bar.country}
                    value={bar.value}
                    maxValue={maxValue}
                    prevY={prevMap.get(bar.country) ?? null}
                    mode={mode}
                />
            ))}
        </div>
    );
}

// ─── page ─────────────────────────────────────────────────────────────────────

const MODES: { value: Mode; label: string }[] = [
    { value: 'nominal', label: 'Nominal' },
    { value: 'ppp', label: 'PPP' },
    { value: 'ratio', label: 'Ratio' },
];

const MODE_LABEL: Record<Mode, string> = {
    nominal: 'Nominal GDP · USD billions',
    ppp: 'GDP (PPP) · USD billions',
    ratio: 'PPP ÷ Nominal · purchasing power multiplier',
};

export default function GDPPage() {
    const [mode, setMode] = useState<Mode>('nominal');

    const dataset = mode === 'nominal' ? nominalGDP : mode === 'ppp' ? pppGDP : ratioGDP;
    const years = useMemo(() => dataset.map((d) => d.year), [dataset]);

    const [selectedYear, setSelectedYear] = useState(years[0]);

    // When mode changes, keep the selected year if available, else pick the closest
    useEffect(() => {
        setSelectedYear((prev) => {
            if (years.includes(prev)) return prev;
            // find closest year in the new dataset
            return years.reduce((best, y) =>
                Math.abs(y - prev) < Math.abs(best - prev) ? y : best
                , years[0]);
        });
    }, [years]);

    const yearIdx = years.indexOf(selectedYear) === -1 ? 0 : years.indexOf(selectedYear);
    const currentYear = years[yearIdx];
    const yearData = dataset[yearIdx];

    function handleYearChange(y: number) {
        setSelectedYear(y);
    }

    return (
        <div className="flex min-h-[calc(100svh-4rem-1px)] flex-col">

            {/* ── header ──────────────────────────────────────────────────── */}
            <header className="shrink-0 border-b border-stone-line px-8 py-4">
                <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                    <div className="flex items-baseline gap-4">
                        <h1 className="font-serif text-2xl font-light tracking-[0.16em] text-marble">GDP</h1>
                        <span className="font-mono text-xs tracking-[0.22em] text-platinum-dim">
                            Top 10 Economies
                        </span>
                    </div>

                    {/* toggle */}
                    <div className="ml-auto flex items-center gap-px border border-stone-line">
                        {MODES.map(({ value, label }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setMode(value)}
                                className={`px-5 py-1.5 font-sans text-xs uppercase tracking-[0.2em] transition-colors duration-300 ease-mechanical ${mode === value ? 'bg-stone-line text-marble' : 'text-platinum-dim hover:text-platinum'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* ── body ────────────────────────────────────────────────────── */}
            <div className="flex flex-col px-8 py-4">

                {/* chart label */}
                <div
                    className="mb-3 shrink-0 border-b border-stone-line pb-2"
                    style={{ paddingLeft: LABEL_W }}
                >
                    <span className="font-sans text-xs uppercase tracking-[0.22em] text-platinum-dim">
                        {MODE_LABEL[mode]}
                    </span>
                </div>

                {/* chart */}
                <div className="mb-6">
                    <RaceChart yearData={yearData} mode={mode} />
                </div>

                {/* ── timeline ────────────────────────────────────────────── */}
                <div className="mt-4 shrink-0 border-t border-stone-line pt-4">

                    <div className="mb-2 flex justify-center">
                        <span className="font-serif text-3xl font-light tracking-[0.1em] text-bronze-bright tabular-nums">
                            {currentYear}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* prev */}
                        <button
                            type="button"
                            onClick={() => setSelectedYear(years[Math.max(0, yearIdx - 1)])}
                            disabled={yearIdx === 0}
                            aria-label="Previous year"
                            className="flex h-9 w-9 shrink-0 items-center justify-center border border-stone-line text-platinum-dim transition-colors duration-300 ease-mechanical hover:border-bronze hover:text-bronze-bright disabled:opacity-20"
                        >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                                <path d="M6.5 2L3.5 5L6.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        {/* tick bar */}
                        <div className="relative flex flex-1 items-end">
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: 'var(--color-stone-line)' }} />
                            {years.map((y) => {
                                const active = y === currentYear;
                                return (
                                    <button
                                        key={y}
                                        type="button"
                                        onClick={() => handleYearChange(y)}
                                        aria-label={String(y)}
                                        aria-pressed={active}
                                        className="flex flex-1 flex-col items-center gap-1 pb-0 pt-0"
                                    >
                                        <span
                                            style={{
                                                display: 'block',
                                                width: 1,
                                                height: active ? 16 : 8,
                                                marginTop: active ? 0 : 8,
                                                background: active ? 'var(--color-bronze-bright)' : 'var(--color-stone-line-strong)',
                                                transition: 'height 300ms cubic-bezier(0.22,0.61,0.36,1), margin-top 300ms, background 300ms',
                                            }}
                                        />
                                        <span
                                            className="font-mono text-[0.65rem] tracking-[0.06em] transition-colors duration-300"
                                            style={{ color: active ? 'var(--color-bronze-bright)' : 'var(--color-platinum-dim)' }}
                                        >
                                            {y}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* next */}
                        <button
                            type="button"
                            onClick={() => setSelectedYear(years[Math.min(years.length - 1, yearIdx + 1)])}
                            disabled={yearIdx === years.length - 1}
                            aria-label="Next year"
                            className="flex h-9 w-9 shrink-0 items-center justify-center border border-stone-line text-platinum-dim transition-colors duration-300 ease-mechanical hover:border-bronze hover:text-bronze-bright disabled:opacity-20"
                        >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                                <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* ── definitions ─────────────────────────────────────────── */}
                <div className="mt-4 shrink-0 border-t border-stone-line pt-3">
                    <div className="flex flex-wrap gap-x-10 gap-y-2">
                        <p className={`font-sans text-sm leading-relaxed tracking-[0.03em] transition-colors duration-300 ease-mechanical ${mode === 'nominal' ? 'text-platinum' : 'text-platinum-dim'}`}>
                            <span className="mr-2 font-mono text-xs uppercase tracking-[0.18em] text-bronze">Nominal GDP</span>
                            what an economy is worth at market exchange rates
                            <span className="mx-3 text-stone-line-strong">·</span>
                            <span className="font-mono text-xs tracking-[0.06em] text-platinum-dim">qty × local prices × exchange rate</span>
                        </p>
                        <p className={`font-sans text-sm leading-relaxed tracking-[0.03em] transition-colors duration-300 ease-mechanical ${mode === 'ppp' ? 'text-platinum' : 'text-platinum-dim'}`}>
                            <span className="mr-2 font-mono text-xs uppercase tracking-[0.18em] text-bronze">PPP</span>
                            how much that economy can actually buy domestically
                            <span className="mx-3 text-stone-line-strong">·</span>
                            <span className="font-mono text-xs tracking-[0.06em] text-platinum-dim">strips price-level differences between countries</span>
                        </p>
                        <p className={`font-sans text-sm leading-relaxed tracking-[0.03em] transition-colors duration-300 ease-mechanical ${mode === 'ratio' ? 'text-platinum' : 'text-platinum-dim'}`}>
                            <span className="mr-2 font-mono text-xs uppercase tracking-[0.18em] text-bronze">Ratio</span>
                            how far domestic purchasing power exceeds nominal market size
                            <span className="mx-3 text-stone-line-strong">·</span>
                            <span className="font-mono text-xs tracking-[0.06em] text-platinum-dim">PPP ÷ Nominal · values above 1× mean cheaper domestically</span>
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
