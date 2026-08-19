'use client';

import { useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ALL_COUNTRIES, ANNUAL_DATA } from '../annual-data';
import { countryColor } from '../GDPBarChart';
import { GDPLineChart, type SeriesKey } from '../GDPLineChart';
import { STOCK_INDEX_BY_COUNTRY, tvChartUrl, tvFxUrl, formatMarketCap } from '../stock-indices';

// Countries sorted alphabetically for the dropdown
const SORTED_COUNTRIES = [...ALL_COUNTRIES].sort((a, b) => a.localeCompare(b));

export default function CountryGDPPage() {
    const params = useParams();
    const router = useRouter();
    const country = decodeURIComponent(params.country as string).replace(/-/g, ' ');

    const [perCapita, setPerCapita] = useState(false);
    const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({
        nominal: true,
        ppp: true,
        ratio: true,
    });
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggle = (key: SeriesKey) => setVisible((v) => ({ ...v, [key]: !v[key] }));

    const navigateTo = (c: string) => {
        setDropdownOpen(false);
        router.push(`/capital/GDP/annual/${c.replace(/\s+/g, '-')}`);
    };

    const isKnown = ALL_COUNTRIES.includes(country);
    const countryCol = countryColor(country);
    const stockIndex = STOCK_INDEX_BY_COUNTRY[country];

    // Market Cap / GDP ratio using latest available nominal GDP
    const latestGdpBn = (() => {
        for (let i = ANNUAL_DATA.length - 1; i >= 0; i--) {
            const e = ANNUAL_DATA[i].entries.find((x) => x.country === country);
            if (e) return e.nominalBn;
        }
        return null;
    })();
    const mcapGdpRatio = stockIndex && latestGdpBn
        ? stockIndex.marketCapT / (latestGdpBn / 1000)
        : null;

    if (!isKnown) {
        return (
            <div className="flex min-h-[calc(100svh-4rem-1px)] flex-col items-center justify-center gap-4">
                <p className="font-sans text-sm uppercase tracking-[0.18em] text-platinum-dim">
                    Country not found
                </p>
                <Link
                    href="/capital/GDP/annual"
                    className="font-sans text-xs uppercase tracking-[0.2em] text-bronze transition-colors hover:text-bronze-bright"
                >
                    ← Back to Rankings
                </Link>
            </div>
        );
    }

    return (
        <div className="flex min-h-[calc(100svh-4rem-1px)] flex-col">

            {/* ── header ────────────────────────────────────────────────────── */}
            <header className="shrink-0 border-b border-stone-line px-8 py-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">

                    {/* breadcrumb + country dropdown */}
                    <div className="flex items-baseline gap-3">
                        <Link
                            href="/capital/GDP/annual"
                            className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-platinum-dim transition-colors duration-200 hover:text-marble"
                        >
                            GDP
                        </Link>
                        <span className="text-stone-line-strong">›</span>

                        {/* country selector */}
                        <div ref={dropdownRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setDropdownOpen((v) => !v)}
                                className="flex items-center gap-2 focus-visible:outline-none"
                            >
                                <h1
                                    className="font-serif text-2xl font-light tracking-[0.16em] transition-opacity duration-150 hover:opacity-75"
                                    style={{ color: countryCol }}
                                >
                                    {country}
                                </h1>
                                <svg
                                    width="10" height="10" viewBox="0 0 10 10" fill="none"
                                    aria-hidden
                                    className={`shrink-0 transition-transform duration-200 ease-mechanical ${dropdownOpen ? 'rotate-180' : ''}`}
                                    style={{ color: countryCol, opacity: 0.6 }}
                                >
                                    <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>

                            {dropdownOpen && (
                                <>
                                    {/* backdrop */}
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setDropdownOpen(false)}
                                    />
                                    {/* menu */}
                                    <div className="absolute left-0 top-full z-20 mt-2 max-h-72 w-56 overflow-y-auto border border-stone-line bg-charcoal shadow-lg"
                                        style={{ background: 'var(--color-charcoal)' }}
                                    >
                                        {SORTED_COUNTRIES.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => navigateTo(c)}
                                                className="flex w-full items-center px-4 py-2.5 text-left font-sans text-[0.7rem] uppercase tracking-[0.13em] transition-colors duration-100"
                                                style={{
                                                    color: c === country
                                                        ? countryColor(c)
                                                        : 'var(--color-platinum-dim)',
                                                    background: c === country
                                                        ? 'var(--color-stone-line)'
                                                        : 'transparent',
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (c !== country) (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-stone-line)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (c !== country) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                                                }}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>


                    </div>

                    {/* per capita toggle */}
                    <div className="ml-auto">
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
            </header>

            {/* ── body ──────────────────────────────────────────────────────── */}
            <div className="flex flex-1 flex-col px-8 py-6">

                {/* chart */}
                <GDPLineChart
                    country={country}
                    perCapita={perCapita}
                    visible={visible}
                    onToggle={toggle}
                />



                {/* stock index */}
                {stockIndex && (
                    <div className="mt-6 border-t border-stone-line pt-4 pb-6">
                        <p className="mb-3 font-sans text-[0.6rem] uppercase tracking-[0.22em] text-stone-line-strong">
                            Benchmark Index
                        </p>
                        <div className="flex items-start gap-5">
                            <span className="mt-0.5 text-2xl" aria-hidden>{stockIndex.flag}</span>
                            <div className="flex flex-col gap-1.5">
                                <span className="font-sans text-sm tracking-[0.06em] text-marble">
                                    {stockIndex.name}
                                </span>
                                <div className="flex items-center gap-4">
                                    <span
                                        className="font-mono text-xs tracking-[0.18em]"
                                        style={{ color: 'var(--color-bronze)' }}
                                    >
                                        {stockIndex.tvSymbol}
                                    </span>
                                    <span className="text-stone-line-strong">·</span>
                                    {(() => {
                                        const fxUrl = tvFxUrl(stockIndex.currencyCode);
                                        const label = (
                                            <>
                                                <span className="font-mono text-xs tracking-[0.18em] text-platinum-dim">
                                                    {stockIndex.currencyCode}
                                                </span>
                                                <span className="ml-1.5 font-sans text-[0.6rem] normal-case tracking-[0.06em] text-stone-line-strong">
                                                    {stockIndex.currency}
                                                </span>
                                            </>
                                        );
                                        return fxUrl ? (
                                            <a
                                                href={fxUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-0 transition-opacity duration-200 hover:opacity-70"
                                            >
                                                {label}
                                            </a>
                                        ) : (
                                            <span className="flex items-center gap-0">{label}</span>
                                        );
                                    })()}
                                    <span className="text-stone-line-strong">·</span>
                                    <span className="font-mono text-xs tracking-[0.12em] text-platinum-dim">
                                        Market Cap
                                        <span className="ml-2 font-sans text-sm tracking-[0.06em] text-platinum">
                                            {formatMarketCap(stockIndex.marketCapT)}
                                        </span>
                                        <span className="ml-1 text-[0.55rem] uppercase tracking-[0.15em] text-stone-line-strong">Jan 2026</span>
                                    </span>
                                    {mcapGdpRatio != null && (
                                        <>
                                            <span className="text-stone-line-strong">·</span>
                                            <span className="font-mono text-xs tracking-[0.12em] text-platinum-dim">
                                                MCap/GDP
                                                <span className="ml-2 font-sans text-sm tracking-[0.06em] text-platinum">
                                                    {mcapGdpRatio.toFixed(2)}×
                                                </span>
                                            </span>
                                        </>
                                    )}
                                    <a
                                        href={tvChartUrl(stockIndex.tvSymbol)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-1 flex items-center gap-1.5 border border-stone-line px-3 py-1 font-sans text-[0.6rem] uppercase tracking-[0.18em] text-platinum-dim transition-colors duration-200 hover:border-bronze hover:text-bronze-bright"
                                    >
                                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
                                            <path d="M1 8L8 1M8 1H3.5M8 1V5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        TradingView
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
