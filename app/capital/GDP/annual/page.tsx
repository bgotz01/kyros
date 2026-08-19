'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
    ANNUAL_DATA, ALL_COUNTRIES,
    topByNominal, topByPPP, topByRatio,
    topByNominalPerCapita, topByPPPPerCapita, topByRatioPerCapita,
    hasPPP,
    type AnnualEntry, type AnnualYear,
} from './annual-data';
import { BarChart, LABEL_W, BAR_HEIGHT, BAR_GAP, entryDisplayValue, type GDPMode, type BarRow } from './GDPBarChart';
import { YearTimeline } from './YearTimeline';
import { CountryFilterModal, resolveFilter, type CountryFilter } from './CountryFilterModal';

// ─── static config ────────────────────────────────────────────────────────────

const MODES: { value: GDPMode; label: string }[] = [
    { value: 'nominal', label: 'Nominal' },
    { value: 'ppp', label: 'PPP' },
    { value: 'ratio', label: 'Ratio' },
];

const MODE_LABEL: Record<GDPMode, string> = {
    nominal: 'Nominal GDP',
    ppp: 'GDP (PPP)',
    ratio: 'PPP ÷ Nominal',
};

const MODE_DEF: Record<GDPMode, { term: string; def: string; formula: string }> = {
    nominal: {
        term: 'Nominal GDP',
        def: 'what an economy is worth at market exchange rates',
        formula: 'qty × local prices × exchange rate',
    },
    ppp: {
        term: 'PPP',
        def: 'how much that economy can actually buy domestically',
        formula: 'strips price-level differences between countries',
    },
    ratio: {
        term: 'Ratio',
        def: 'how far domestic purchasing power exceeds nominal market size',
        formula: 'PPP ÷ Nominal · values above 1× mean cheaper domestically',
    },
};

const UNIT_LABEL: Record<GDPMode, Record<'total' | 'perCapita', string>> = {
    nominal: { total: 'USD billions', perCapita: 'USD per person' },
    ppp: { total: 'current international billions', perCapita: 'intl $ per person' },
    ratio: { total: 'multiplier', perCapita: 'multiplier' },
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function getRanked(yearData: AnnualYear, mode: GDPMode, perCapita: boolean, n: number): BarRow[] {
    let raw: AnnualEntry[];
    if (perCapita) {
        raw = mode === 'nominal' ? topByNominalPerCapita(yearData, n)
            : mode === 'ppp' ? topByPPPPerCapita(yearData, n)
                : topByRatioPerCapita(yearData, n);
    } else {
        raw = mode === 'nominal' ? topByNominal(yearData, n)
            : mode === 'ppp' ? topByPPP(yearData, n)
                : topByRatio(yearData, n);
    }
    return raw.map((e, i) => ({
        country: e.country,
        displayValue: entryDisplayValue(e, mode, perCapita),
        rank: i,
    }));
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AnnualGDPPage() {
    const [mode, setMode] = useState<GDPMode>('nominal');
    const [perCapita, setPerCapita] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [countryFilter, setCountryFilter] = useState<CountryFilter>(new Set(ALL_COUNTRIES));

    const years = useMemo(() => ANNUAL_DATA.map((d) => d.year), []);
    const [selectedYear, setSelectedYear] = useState(years[years.length - 1]);

    const yearIdx = Math.max(0, years.indexOf(selectedYear));
    const rawYearData = ANNUAL_DATA[yearIdx];

    // Resolve the filter against the current year — dynamic presets re-compute here
    const yearData = useMemo(() => {
        const included = resolveFilter(countryFilter, rawYearData);
        if (included.size === ALL_COUNTRIES.length) return rawYearData;
        return {
            ...rawYearData,
            entries: rawYearData.entries.filter((e) => included.has(e.country)),
        };
    }, [rawYearData, countryFilter]);

    const pppAvailable = hasPPP(yearData);
    // silently fall back to nominal when PPP data is absent for the selected year
    const effectiveMode: GDPMode = !pppAvailable && mode !== 'nominal' ? 'nominal' : mode;

    // reset expand when mode or perCapita changes
    useEffect(() => { setExpanded(false); }, [mode, perCapita]);

    // separate prev-position refs so top-10 and 11-20 animate independently
    const prevTop = useRef<Map<string, number>>(new Map());
    const prevBot = useRef<Map<string, number>>(new Map());

    const top10 = useMemo(
        () => getRanked(yearData, effectiveMode, perCapita, 10),
        [yearData, effectiveMode, perCapita],
    );
    const top20 = useMemo(
        () => getRanked(yearData, effectiveMode, perCapita, 20),
        [yearData, effectiveMode, perCapita],
    );
    const next10 = useMemo(
        () => top20.slice(10).map((b, i) => ({ ...b, rank: i, displayRank: i + 11 })),
        [top20],
    );

    const maxValue = top10[0]?.displayValue ?? 1;
    const def = MODE_DEF[effectiveMode];
    const unitLabel = UNIT_LABEL[effectiveMode][perCapita ? 'perCapita' : 'total'];
    const isFiltered = !(countryFilter instanceof Set) || countryFilter.size < ALL_COUNTRIES.length;

    return (
        <div className="flex min-h-[calc(100svh-4rem-1px)] flex-col">

            {/* ── modal ───────────────────────────────────────────────────── */}
            {filterOpen && (
                <CountryFilterModal
                    filter={countryFilter}
                    yearData={rawYearData}
                    onChange={setCountryFilter}
                    onClose={() => setFilterOpen(false)}
                />
            )}

            {/* ── header ──────────────────────────────────────────────────── */}
            <header className="shrink-0 border-b border-stone-line px-8 py-4">
                {/* row 1: title + primary controls */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div className="flex items-baseline gap-4">
                        <h1 className="font-serif text-2xl font-light tracking-[0.16em] text-marble">GDP</h1>
                        <span className="font-mono text-xs tracking-[0.22em] text-platinum-dim">Annual · 1980–2025</span>
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                        {/* GDP mode toggle */}
                        <div className="flex items-center border border-stone-line">
                            {MODES.map(({ value, label }) => {
                                const unavailable = !pppAvailable && value !== 'nominal';
                                const active = mode === value && !unavailable;
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => { if (!unavailable) setMode(value); }}
                                        disabled={unavailable}
                                        title={unavailable ? 'PPP data starts from 1990' : undefined}
                                        className={`relative px-5 py-1.5 font-sans text-xs uppercase tracking-[0.2em] transition-colors duration-200 ease-mechanical ${active
                                            ? 'bg-stone-line text-marble'
                                            : unavailable
                                                ? 'cursor-not-allowed text-stone-line-strong'
                                                : 'text-platinum-dim hover:text-marble'
                                            }`}
                                    >
                                        {label}
                                        {active && (
                                            <span
                                                className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
                                                style={{ background: 'var(--color-bronze)' }}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* country filter button */}
                        <button
                            type="button"
                            onClick={() => setFilterOpen(true)}
                            className={`flex items-center gap-2 border px-4 py-1.5 font-sans text-xs uppercase tracking-[0.2em] transition-colors duration-200 ease-mechanical ${isFiltered
                                ? 'border-bronze text-bronze-bright hover:bg-bronze/10'
                                : 'border-stone-line text-platinum-dim hover:border-stone-line-strong hover:text-marble'
                                }`}
                        >
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
                                <path d="M1 2.5H10M2.5 5.5H8.5M4 8.5H7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                            </svg>
                            {!(countryFilter instanceof Set)
                                ? 'Top 10 · Dynamic'
                                : isFiltered
                                    ? `${countryFilter.size} Countries`
                                    : 'Countries'}
                        </button>
                    </div>
                </div>

                {/* row 2: per capita toggle */}
                <div className="mt-2.5 flex justify-end">
                    <label className="flex cursor-pointer items-center gap-2 select-none">
                        <span className={`font-sans text-[0.65rem] uppercase tracking-[0.18em] transition-colors duration-200 ${perCapita ? 'text-platinum' : 'text-stone-line-strong'}`}>
                            Per Capita
                        </span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={perCapita}
                            onClick={() => setPerCapita((v) => !v)}
                            className="relative shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-bronze"
                            style={{
                                width: 28,
                                height: 16,
                                borderRadius: 0,
                                background: perCapita ? 'var(--color-bronze)' : 'transparent',
                                border: `1px solid ${perCapita ? 'var(--color-bronze)' : 'var(--color-stone-line-strong)'}`,
                                transition: 'background 250ms ease, border-color 250ms ease',
                            }}
                        >
                            <span
                                style={{
                                    position: 'absolute',
                                    top: 2,
                                    left: perCapita ? 12 : 2,
                                    width: 10,
                                    height: 10,
                                    background: perCapita ? 'var(--color-charcoal)' : 'var(--color-stone-line-strong)',
                                    transition: 'left 250ms cubic-bezier(0.22,0.61,0.36,1), background 250ms ease',
                                }}
                            />
                        </button>
                    </label>
                </div>
            </header>

            {/* ── body ────────────────────────────────────────────────────── */}
            <div className="flex flex-col px-8 py-4">

                {/* chart label */}
                <div className="mb-3 border-b border-stone-line pb-2" style={{ paddingLeft: LABEL_W }}>
                    <span className="font-sans text-xs uppercase tracking-[0.22em] text-platinum-dim">
                        {MODE_LABEL[effectiveMode]}
                        {effectiveMode !== 'ratio' && (
                            <span className="ml-2 text-stone-line-strong">·</span>
                        )}
                        <span className="ml-2">{unitLabel}</span>
                        {!pppAvailable && mode !== 'nominal' && (
                            <span className="ml-3 text-stone-line-strong">· PPP unavailable before 1990</span>
                        )}
                    </span>
                </div>

                {/* top 10 */}
                <BarChart
                    bars={top10}
                    maxValue={maxValue}
                    mode={effectiveMode}
                    perCapita={perCapita}
                    prevPositions={prevTop}
                />

                {/* expand toggle */}
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-4 flex items-center gap-3 self-start border border-stone-line px-4 py-1.5 font-sans text-[0.65rem] uppercase tracking-[0.22em] text-platinum-dim transition-colors duration-300 ease-mechanical hover:border-bronze hover:text-bronze-bright"
                    style={{ marginLeft: LABEL_W }}
                >
                    <svg
                        width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden
                        className={`shrink-0 transition-transform duration-300 ease-mechanical ${expanded ? 'rotate-180' : ''}`}
                    >
                        <path d="M1 2.5L4 5.5L7 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {expanded ? 'Hide' : 'Show'} ranks 11–20
                </button>

                {/* ranks 11-20 */}
                <div
                    className="overflow-hidden transition-all duration-500 ease-mechanical"
                    style={{
                        maxHeight: expanded ? next10.length * (BAR_HEIGHT + BAR_GAP) + 40 : 0,
                        opacity: expanded ? 1 : 0,
                        marginTop: expanded ? 16 : 0,
                    }}
                >
                    <div className="mb-3 border-t border-stone-line" style={{ marginLeft: LABEL_W }}>
                        <span className="mt-2 block font-sans text-[0.6rem] uppercase tracking-[0.22em] text-platinum-dim">
                            Ranks 11–20
                        </span>
                    </div>
                    <BarChart
                        bars={next10}
                        maxValue={maxValue}
                        mode={effectiveMode}
                        perCapita={perCapita}
                        prevPositions={prevBot}
                        dim
                    />
                </div>

                {/* ── timeline ────────────────────────────────────────────── */}
                <div className="mt-6 border-t border-stone-line pt-4">
                    <YearTimeline
                        years={years}
                        selectedYear={selectedYear}
                        onSelect={setSelectedYear}
                    />
                </div>

                {/* ── definitions ─────────────────────────────────────────── */}
                <div className="mt-4 border-t border-stone-line pb-6 pt-3">
                    <p className="font-sans text-sm leading-relaxed tracking-[0.03em] text-platinum">
                        <span className="mr-2 font-mono text-xs uppercase tracking-[0.18em] text-bronze">
                            {def.term}
                        </span>
                        {def.def}
                        <span className="mx-3 text-stone-line-strong">·</span>
                        <span className="font-mono text-xs tracking-[0.06em] text-platinum-dim">
                            {def.formula}
                        </span>
                    </p>
                </div>

            </div>
        </div>
    );
}
