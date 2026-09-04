'use client';

import { useMemo, useRef, useState } from 'react';
import {
    ANNUAL_DATA, ALL_COUNTRIES,
    nominalPerCapita,
    pppPerCapita,
    type AnnualEntry,
} from './annual-data';
import { countryColor } from './GDPBarChart';

// ─── constants ────────────────────────────────────────────────────────────────

const CHART_H = 300;
const PAD_TOP = 20;
const PAD_BOT = 34;
const PAD_LEFT = 72;
const PAD_RIGHT = 24;
const CHART_W = 900;

// Top 10 by nominal GDP in 2025, then rest alphabetically
const YEAR_2025 = ANNUAL_DATA.find((d) => d.year === 2025) ?? ANNUAL_DATA[ANNUAL_DATA.length - 1];
const TOP_10_COUNTRIES = YEAR_2025.entries
    .slice()
    .sort((a, b) => b.nominalBn - a.nominalBn)
    .slice(0, 10)
    .map((e) => e.country);
const TOP_10_SET = new Set(TOP_10_COUNTRIES);
const REST_COUNTRIES = [...ALL_COUNTRIES]
    .filter((c) => !TOP_10_SET.has(c))
    .sort((a, b) => a.localeCompare(b));

type GDPMode = 'nominal' | 'ppp';
type ChartMode = 'single' | 'ratio';
type RangeOption = '10Y' | '20Y' | 'ALL';

const LATEST_YEAR = YEAR_2025.year;
const RANGE_YEARS: Record<RangeOption, number> = { '10Y': 10, '20Y': 20, ALL: 9999 };

// ─── helpers ──────────────────────────────────────────────────────────────────

function getValue(e: AnnualEntry, mode: GDPMode, perCapita: boolean): number {
    if (mode === 'nominal') return perCapita ? nominalPerCapita(e) : e.nominalBn;
    return perCapita ? pppPerCapita(e) : e.pppBn;
}

function toY(v: number, min: number, max: number): number {
    if (max === min) return PAD_TOP + (CHART_H - PAD_TOP - PAD_BOT) / 2;
    return PAD_TOP + (1 - (v - min) / (max - min)) * (CHART_H - PAD_TOP - PAD_BOT);
}

function niceTickValues(min: number, max: number, count = 5): number[] {
    const range = max - min;
    if (range === 0) return [min];
    const raw = range / (count - 1);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = ([1, 2, 2.5, 5, 10].find((f) => f * mag >= raw) ?? 10) * mag;
    const niceMin = Math.floor(min / step) * step;
    const ticks: number[] = [];
    for (let t = niceMin; t <= max + step * 0.01; t += step) {
        ticks.push(parseFloat(t.toPrecision(10)));
    }
    return ticks;
}

function gdpLabel(t: number, perCapita: boolean): string {
    if (perCapita) return t >= 100_000 ? `$${(t / 1000).toFixed(0)}k` : `$${(t / 1000).toFixed(1)}k`;
    return t >= 1_000 ? `$${(t / 1000).toFixed(1)}T` : `$${t.toFixed(0)}B`;
}

function ratioLabel(t: number): string {
    return `${t.toFixed(2)}×`;
}

interface SeriesPoint { year: number; value: number }

function buildSingleSeries(country: string, mode: GDPMode, perCapita: boolean): SeriesPoint[] {
    return ANNUAL_DATA.flatMap((yd) => {
        const e = yd.entries.find((x) => x.country === country);
        if (!e) return [];
        const v = getValue(e, mode, perCapita);
        if (!v) return [];
        return [{ year: yd.year, value: v }];
    });
}

function buildRatioSeries(
    countryA: string,
    countryB: string,
    mode: GDPMode,
    perCapita: boolean,
): SeriesPoint[] {
    return ANNUAL_DATA.flatMap((yd) => {
        const a = yd.entries.find((x) => x.country === countryA);
        const b = yd.entries.find((x) => x.country === countryB);
        if (!a || !b) return [];
        const va = getValue(a, mode, perCapita);
        const vb = getValue(b, mode, perCapita);
        if (!va || !vb) return [];
        return [{ year: yd.year, value: va / vb }];
    });
}

// ─── country option ───────────────────────────────────────────────────────────

function CountryOption({ c, selected, onSelect }: { c: string; selected: string; onSelect: (c: string) => void }) {
    return (
        <button
            type="button"
            onClick={() => onSelect(c)}
            className="flex w-full items-center px-4 py-2 text-left font-sans text-[0.68rem] uppercase tracking-[0.12em] transition-colors duration-100"
            style={{
                color: c === selected ? countryColor(c) : 'var(--color-platinum-dim)',
                background: c === selected ? 'var(--color-stone-line)' : 'transparent',
            }}
            onMouseEnter={(e) => { if (c !== selected) (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-stone-line)'; }}
            onMouseLeave={(e) => { if (c !== selected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
            {c}
        </button>
    );
}

// ─── country picker ───────────────────────────────────────────────────────────

interface CountryPickerProps {
    value: string;
    onChange: (c: string) => void;
    color: string;
    label?: string;
    prominent?: boolean;
}

function CountryPicker({ value, onChange, color, label, prominent }: CountryPickerProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    return (
        <div ref={ref} className="relative">
            {label && (
                <span className="mb-1 block font-sans text-[0.58rem] uppercase tracking-[0.18em] text-stone-line-strong">
                    {label}
                </span>
            )}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`flex items-center gap-2 border border-stone-line px-4 transition-colors duration-200 hover:border-stone-line-strong ${prominent ? 'py-2.5' : 'py-1.5'}`}
                style={{ color }}
            >
                <span className={prominent ? 'font-serif text-xl font-light tracking-[0.12em]' : 'font-sans text-xs uppercase tracking-[0.2em]'}>
                    {value}
                </span>
                <svg
                    width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden
                    className={`shrink-0 transition-transform duration-200 ease-mechanical ${open ? 'rotate-180' : ''}`}
                    style={{ color }}
                >
                    <path d="M2 3L4.5 5.5L7 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div
                        className="absolute left-0 top-full z-20 mt-1 max-h-64 w-52 overflow-y-auto border border-stone-line shadow-lg"
                        style={{ background: 'var(--color-charcoal)' }}
                    >
                        {/* top 10 */}
                        <div className="px-4 pb-1 pt-2">
                            <span className="font-sans text-[0.55rem] uppercase tracking-[0.18em] text-stone-line-strong">
                                Top 10 · 2025
                            </span>
                        </div>
                        {TOP_10_COUNTRIES.map((c) => (
                            <CountryOption key={c} c={c} selected={value} onSelect={(v) => { onChange(v); setOpen(false); }} />
                        ))}
                        {/* divider */}
                        <div className="mx-4 my-1 border-t border-stone-line" />
                        {/* rest */}
                        {REST_COUNTRIES.map((c) => (
                            <CountryOption key={c} c={c} selected={value} onSelect={(v) => { onChange(v); setOpen(false); }} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── main component ───────────────────────────────────────────────────────────

export function GDPChart() {
    const [chartMode, setChartMode] = useState<ChartMode>('single');
    const [gdpMode, setGdpMode] = useState<GDPMode>('nominal');
    const [perCapita, setPerCapita] = useState(false);
    const [range, setRange] = useState<RangeOption>('10Y');
    const [countryA, setCountryA] = useState('United States');
    const [countryB, setCountryB] = useState('China');
    const [hoverYear, setHoverYear] = useState<number | null>(null);

    const colorA = countryColor(countryA);
    const colorB = countryColor(countryB);

    const fromYear = LATEST_YEAR - RANGE_YEARS[range] + 1;

    // ── data ──────────────────────────────────────────────────────────────────
    const seriesA = useMemo(
        () => buildSingleSeries(countryA, gdpMode, perCapita).filter((d) => d.year >= fromYear),
        [countryA, gdpMode, perCapita, fromYear],
    );
    const seriesB = useMemo(
        () => buildSingleSeries(countryB, gdpMode, perCapita).filter((d) => d.year >= fromYear),
        [countryB, gdpMode, perCapita, fromYear],
    );
    const seriesRatio = useMemo(
        () => buildRatioSeries(countryA, countryB, gdpMode, perCapita).filter((d) => d.year >= fromYear),
        [countryA, countryB, gdpMode, perCapita, fromYear],
    );

    // active series for x-axis / hover
    const activeSeries = chartMode === 'ratio' ? seriesRatio : seriesA;
    const years = activeSeries.map((d) => d.year);

    const xStep = years.length > 1
        ? (CHART_W - PAD_LEFT - PAD_RIGHT) / (years.length - 1)
        : 0;

    const toX = (i: number) => PAD_LEFT + i * xStep;

    // ── scales ────────────────────────────────────────────────────────────────
    const { minV, maxV } = useMemo(() => {
        if (chartMode === 'ratio') {
            const vals = seriesRatio.map((d) => d.value);
            return { minV: vals.length ? Math.min(...vals) : 0, maxV: vals.length ? Math.max(...vals) : 1 };
        }
        const combined = [...seriesA, ...seriesB].map((d) => d.value).filter(Boolean);
        return { minV: combined.length ? Math.min(...combined) : 0, maxV: combined.length ? Math.max(...combined) : 1 };
    }, [chartMode, seriesA, seriesB, seriesRatio]);

    const ticks = useMemo(() => niceTickValues(minV, maxV), [minV, maxV]);

    // ── polylines ─────────────────────────────────────────────────────────────
    const ptsA = useMemo(
        () => seriesA.map((d, i) => `${toX(i)},${toY(d.value, minV, maxV)}`).join(' '),
        [seriesA, xStep, minV, maxV],
    );
    const ptsB = useMemo(
        () => seriesB.map((d, i) => {
            // align B to A's x positions by matching year
            const idx = years.indexOf(d.year);
            if (idx < 0) return null;
            return `${toX(idx)},${toY(d.value, minV, maxV)}`;
        }).filter(Boolean).join(' '),
        [seriesB, years, xStep, minV, maxV],
    );
    const ptsRatio = useMemo(
        () => seriesRatio.map((d, i) => `${toX(i)},${toY(d.value, minV, maxV)}`).join(' '),
        [seriesRatio, xStep, minV, maxV],
    );

    // ── hover ─────────────────────────────────────────────────────────────────
    const hoverIdx = hoverYear != null ? years.indexOf(hoverYear) : -1;
    const hoverX = hoverIdx >= 0 ? toX(hoverIdx) : null;

    const hoverA = hoverIdx >= 0 ? seriesA.find((d) => d.year === hoverYear) : null;
    const hoverB = hoverIdx >= 0 ? seriesB.find((d) => d.year === hoverYear) : null;
    const hoverRatio = hoverIdx >= 0 ? seriesRatio.find((d) => d.year === hoverYear) : null;

    // ── label formatters ──────────────────────────────────────────────────────
    const fmtGDP = (v: number) => gdpLabel(v, perCapita);

    return (
        <div className="flex flex-col gap-0">

            {/* ── controls ──────────────────────────────────────────────── */}
            <div className="mb-5 flex flex-wrap items-end justify-between gap-y-4">

                {/* left: country selections */}
                <div className="flex flex-wrap items-end gap-x-4 gap-y-4">
                    <CountryPicker
                        value={countryA}
                        onChange={setCountryA}
                        color={colorA}
                        label={chartMode === 'ratio' ? 'Numerator' : 'Country'}
                        prominent
                    />

                    {/* swap arrow — always visible between the two countries */}
                    <button
                        type="button"
                        onClick={() => { setCountryA(countryB); setCountryB(countryA); }}
                        aria-label="Swap countries"
                        className="mb-2 self-end border border-stone-line px-2 py-2 text-platinum-dim transition-colors duration-200 ease-mechanical hover:border-bronze hover:text-bronze-bright"
                        title="Swap"
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                            <path d="M3 5h8M9 3l2 2-2 2M11 9H3M5 7l-2 2 2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>

                    <CountryPicker
                        value={countryB}
                        onChange={setCountryB}
                        color={colorB}
                        label={chartMode === 'ratio' ? 'Denominator' : 'Compare'}
                        prominent
                    />

                    {chartMode === 'ratio' && (
                        <span className="mb-2 self-end font-sans text-[0.6rem] uppercase tracking-[0.18em] text-stone-line-strong">
                            ratio
                        </span>
                    )}
                </div>

                {/* right: toggles + per capita */}
                <div className="flex flex-wrap items-end gap-x-4 gap-y-4">

                    {/* range toggle */}
                    <div className="flex flex-col gap-1">
                        <span className="font-sans text-[0.58rem] uppercase tracking-[0.18em] text-stone-line-strong">
                            Range
                        </span>
                        <div className="flex items-center border border-stone-line">
                            {(['10Y', '20Y', 'ALL'] as RangeOption[]).map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRange(r)}
                                    className={`relative px-4 py-1.5 font-sans text-xs uppercase tracking-[0.2em] transition-colors duration-200 ease-mechanical ${range === r
                                        ? 'bg-stone-line text-marble'
                                        : 'text-platinum-dim hover:text-marble'
                                        }`}
                                >
                                    {r}
                                    {range === r && (
                                        <span
                                            className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
                                            style={{ background: 'var(--color-bronze)' }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* GDP type toggle */}
                    <div className="flex flex-col gap-1">
                        <span className="font-sans text-[0.58rem] uppercase tracking-[0.18em] text-stone-line-strong">
                            Measure
                        </span>
                        <div className="flex items-center border border-stone-line">
                            {(['nominal', 'ppp'] as GDPMode[]).map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setGdpMode(m)}
                                    className={`relative px-5 py-1.5 font-sans text-xs uppercase tracking-[0.2em] transition-colors duration-200 ease-mechanical ${gdpMode === m
                                        ? 'bg-stone-line text-marble'
                                        : 'text-platinum-dim hover:text-marble'
                                        }`}
                                >
                                    {m === 'nominal' ? 'Nominal' : 'PPP'}
                                    {gdpMode === m && (
                                        <span
                                            className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
                                            style={{ background: 'var(--color-bronze)' }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* view toggle */}
                    <div className="flex flex-col gap-1">
                        <span className="font-sans text-[0.58rem] uppercase tracking-[0.18em] text-stone-line-strong">
                            View
                        </span>
                        <div className="flex items-center border border-stone-line">
                            {(['single', 'ratio'] as ChartMode[]).map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setChartMode(m)}
                                    className={`relative px-5 py-1.5 font-sans text-xs uppercase tracking-[0.2em] transition-colors duration-200 ease-mechanical ${chartMode === m
                                        ? 'bg-stone-line text-marble'
                                        : 'text-platinum-dim hover:text-marble'
                                        }`}
                                >
                                    {m === 'single' ? 'Country' : 'Ratio'}
                                    {chartMode === m && (
                                        <span
                                            className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
                                            style={{ background: 'var(--color-bronze)' }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* per capita — far right */}
                    <label className="mb-1 flex cursor-pointer items-center gap-2 self-end select-none">
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
                                width: 28, height: 16, borderRadius: 0,
                                background: perCapita ? 'var(--color-bronze)' : 'transparent',
                                border: `1px solid ${perCapita ? 'var(--color-bronze)' : 'var(--color-stone-line-strong)'}`,
                                transition: 'background 250ms ease, border-color 250ms ease',
                            }}
                        >
                            <span style={{
                                position: 'absolute', top: 2,
                                left: perCapita ? 12 : 2,
                                width: 10, height: 10,
                                background: perCapita ? 'var(--color-charcoal)' : 'var(--color-stone-line-strong)',
                                transition: 'left 250ms cubic-bezier(0.22,0.61,0.36,1), background 250ms ease',
                            }} />
                        </button>
                    </label>
                </div>
            </div>

            {/* ── hover readout ─────────────────────────────────────────── */}
            <div className="mb-3 flex h-6 items-baseline gap-6">
                {hoverYear != null ? (
                    <>
                        <span className="font-mono text-xs tracking-[0.2em] text-stone-line-strong">
                            {hoverYear}
                        </span>
                        {chartMode === 'single' ? (
                            <>
                                {hoverA && (
                                    <span className="font-mono text-sm" style={{ color: colorA }}>
                                        {fmtGDP(hoverA.value)}
                                        <span className="ml-1.5 font-sans text-[0.6rem] uppercase tracking-[0.14em] text-platinum-dim">
                                            {countryA}
                                        </span>
                                    </span>
                                )}
                                {hoverB && (
                                    <span className="font-mono text-sm" style={{ color: colorB }}>
                                        {fmtGDP(hoverB.value)}
                                        <span className="ml-1.5 font-sans text-[0.6rem] uppercase tracking-[0.14em] text-platinum-dim">
                                            {countryB}
                                        </span>
                                    </span>
                                )}
                            </>
                        ) : (
                            hoverRatio && (
                                <span className="font-mono text-sm text-marble">
                                    {ratioLabel(hoverRatio.value)}
                                    <span className="ml-1.5 font-sans text-[0.6rem] uppercase tracking-[0.14em] text-platinum-dim">
                                        {countryA} ÷ {countryB}
                                    </span>
                                </span>
                            )
                        )}
                    </>
                ) : (
                    <span className="font-sans text-[0.6rem] uppercase tracking-[0.18em] text-stone-line-strong">
                        hover to inspect
                    </span>
                )}
            </div>

            {/* ── SVG chart ─────────────────────────────────────────────── */}
            <div className="relative w-full">
                <svg
                    viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                    preserveAspectRatio="none"
                    className="w-full"
                    style={{ height: CHART_H, display: 'block' }}
                    onMouseLeave={() => setHoverYear(null)}
                >
                    {/* grid lines */}
                    {ticks.map((t) => {
                        const y = toY(t, minV, maxV);
                        if (y > CHART_H - PAD_BOT - 8) return null;
                        return (
                            <line
                                key={`g-${t}`}
                                x1={PAD_LEFT} y1={y}
                                x2={CHART_W - PAD_RIGHT} y2={y}
                                stroke="var(--color-stone-line)" strokeWidth={0.5}
                            />
                        );
                    })}

                    {/* Y labels */}
                    {ticks.map((t) => {
                        const y = toY(t, minV, maxV);
                        if (y > CHART_H - PAD_BOT - 8) return null;
                        return (
                            <text
                                key={`tl-${t}`}
                                x={PAD_LEFT - 8} y={y + 4}
                                textAnchor="end" fontSize={9}
                                fontFamily="var(--font-mono, monospace)"
                                fill="var(--color-stone-line-strong)"
                                letterSpacing="0.05em"
                            >
                                {chartMode === 'ratio' ? ratioLabel(t) : gdpLabel(t, perCapita)}
                            </text>
                        );
                    })}

                    {/* X labels */}
                    {years
                        .filter((y) => y % 5 === 0 || y === years[years.length - 1])
                        .map((y) => {
                            const i = years.indexOf(y);
                            return (
                                <text
                                    key={`xl-${y}`}
                                    x={toX(i)} y={CHART_H - 6}
                                    textAnchor="middle" fontSize={9}
                                    fontFamily="var(--font-mono, monospace)"
                                    fill="var(--color-stone-line-strong)"
                                    letterSpacing="0.06em"
                                >
                                    {y}
                                </text>
                            );
                        })}

                    {/* single mode: country A line */}
                    {chartMode === 'single' && ptsA && (
                        <polyline
                            points={ptsA}
                            fill="none"
                            stroke={colorA}
                            strokeWidth={2}
                            strokeLinejoin="round" strokeLinecap="round"
                        />
                    )}

                    {/* single mode: country B line */}
                    {chartMode === 'single' && ptsB && (
                        <polyline
                            points={ptsB}
                            fill="none"
                            stroke={colorB}
                            strokeWidth={1.5}
                            strokeLinejoin="round" strokeLinecap="round"
                            opacity={0.75}
                        />
                    )}

                    {/* ratio mode: ratio line */}
                    {chartMode === 'ratio' && ptsRatio && (
                        <polyline
                            points={ptsRatio}
                            fill="none"
                            stroke="var(--color-platinum)"
                            strokeWidth={1.8}
                            strokeLinejoin="round" strokeLinecap="round"
                        />
                    )}

                    {/* ratio 1× reference line */}
                    {chartMode === 'ratio' && minV <= 1 && maxV >= 1 && (
                        <line
                            x1={PAD_LEFT} y1={toY(1, minV, maxV)}
                            x2={CHART_W - PAD_RIGHT} y2={toY(1, minV, maxV)}
                            stroke="var(--color-bronze)" strokeWidth={0.8} strokeDasharray="4 4"
                            opacity={0.5}
                        />
                    )}

                    {/* crosshair */}
                    {hoverX != null && (
                        <line
                            x1={hoverX} y1={PAD_TOP}
                            x2={hoverX} y2={CHART_H - PAD_BOT}
                            stroke="var(--color-platinum-dim)"
                            strokeWidth={0.8} strokeDasharray="2 3"
                        />
                    )}

                    {/* hover dots */}
                    {hoverX != null && hoverIdx >= 0 && (() => {
                        if (chartMode === 'ratio') {
                            const pt = seriesRatio[hoverIdx];
                            if (!pt) return null;
                            return <circle cx={hoverX} cy={toY(pt.value, minV, maxV)} r={3} fill="var(--color-platinum)" />;
                        }
                        const pA = seriesA.find((d) => d.year === hoverYear);
                        const pB = seriesB.find((d) => d.year === hoverYear);
                        return (
                            <>
                                {pA && <circle cx={hoverX} cy={toY(pA.value, minV, maxV)} r={3} fill={colorA} />}
                                {pB && <circle cx={hoverX} cy={toY(pB.value, minV, maxV)} r={2.5} fill={colorB} />}
                            </>
                        );
                    })()}

                    {/* hover sensor strips */}
                    {years.map((y, i) => {
                        const x = toX(i);
                        const w = xStep || 20;
                        return (
                            <rect
                                key={`hs-${y}`}
                                x={x - w / 2} y={PAD_TOP}
                                width={w} height={CHART_H - PAD_TOP - PAD_BOT}
                                fill="transparent"
                                onMouseEnter={() => setHoverYear(y)}
                            />
                        );
                    })}
                </svg>
            </div>

            {/* ── axis legend ───────────────────────────────────────────── */}
            <div
                className="mt-1 flex items-center justify-between"
                style={{ paddingLeft: PAD_LEFT, paddingRight: PAD_RIGHT }}
            >
                <span className="font-sans text-[0.58rem] uppercase tracking-[0.18em] text-stone-line-strong">
                    {chartMode === 'ratio'
                        ? `${countryA} ÷ ${countryB} · ${gdpMode}`
                        : `${perCapita ? 'USD per person' : 'USD billions'} · ${gdpMode}`}
                </span>
                {chartMode === 'single' && (
                    <div className="flex items-center gap-5">
                        <span className="flex items-center gap-2">
                            <span className="inline-block h-0.5 w-5" style={{ background: colorA }} />
                            <span className="font-sans text-[0.58rem] uppercase tracking-[0.18em]" style={{ color: colorA }}>
                                {countryA}
                            </span>
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="inline-block h-px w-5" style={{ background: colorB }} />
                            <span className="font-sans text-[0.58rem] uppercase tracking-[0.18em]" style={{ color: colorB }}>
                                {countryB}
                            </span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
