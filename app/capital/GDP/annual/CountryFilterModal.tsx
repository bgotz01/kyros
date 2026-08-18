'use client';

import { useEffect, useRef } from 'react';
import { ALL_COUNTRIES, type AnnualYear } from './annual-data';

// ─── filter state type ────────────────────────────────────────────────────────
//
// 'top10gdp' is a *dynamic* preset: resolved fresh from the current year's data
// every time the year changes. All other presets and custom selections are static
// sets of country names stored directly.

export type DynamicPreset = 'top10gdp';
export type CountryFilter = DynamicPreset | Set<string>;

// ─── static presets ───────────────────────────────────────────────────────────

export const STATIC_PRESETS: { key: string; label: string; countries: string[] }[] = [
    {
        key: 'all',
        label: 'All Countries',
        countries: ALL_COUNTRIES,
    },
    {
        key: 'western',
        label: 'Western Only',
        countries: [
            'United States', 'Canada', 'United Kingdom', 'Germany', 'France',
            'Italy', 'Spain', 'Netherlands', 'Switzerland', 'Sweden',
            'Poland', 'Australia',
        ],
    },
    {
        key: 'powercenters',
        label: 'Power Centers',
        countries: [
            'United States', 'United Kingdom', 'France', 'Germany',
            'Russia', 'Italy', 'Japan', 'China',
        ],
    },
];

export const DYNAMIC_PRESET_LABEL: Record<DynamicPreset, string> = {
    top10gdp: 'Top 10 by GDP',
};

// ─── resolve filter → concrete Set for a given year ──────────────────────────

export function resolveFilter(filter: CountryFilter, yearData: AnnualYear): Set<string> {
    if (filter instanceof Set) return filter;
    // dynamic: top10gdp — take the 10 largest nominal GDP entries for this year
    const top10 = yearData.entries.slice(0, 10).map((e) => e.country);
    return new Set(top10);
}

// ─── detect which preset (if any) a Set matches ──────────────────────────────

function detectStaticPreset(selected: Set<string>): string | null {
    for (const preset of STATIC_PRESETS) {
        if (
            preset.countries.length === selected.size &&
            preset.countries.every((c) => selected.has(c))
        ) {
            return preset.key;
        }
    }
    return null;
}

// ─── component ────────────────────────────────────────────────────────────────

interface Props {
    filter: CountryFilter;
    // yearData needed to show which countries the dynamic preset currently resolves to
    yearData: AnnualYear;
    onChange: (next: CountryFilter) => void;
    onClose: () => void;
}

export function CountryFilterModal({ filter, yearData, onChange, onClose }: Props) {
    const backdropRef = useRef<HTMLDivElement>(null);

    const isDynamic = !(filter instanceof Set);
    const dynamicKey = isDynamic ? (filter as DynamicPreset) : null;

    // The set actually used for display (checkboxes). If dynamic, resolve it.
    const resolvedSet = resolveFilter(filter, yearData);

    // Which static preset key is active (null if dynamic or custom)
    const activeStaticPreset = isDynamic ? null : detectStaticPreset(filter as Set<string>);
    const isCustom = !isDynamic && activeStaticPreset === null;

    // close on backdrop click
    const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === backdropRef.current) onClose();
    };

    // close on Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const toggleCountry = (country: string) => {
        if (isDynamic) return; // not allowed while dynamic preset active
        const next = new Set(filter as Set<string>);
        if (next.has(country)) {
            if (next.size === 1) return;
            next.delete(country);
        } else {
            next.add(country);
        }
        onChange(next);
    };

    const selectAll = () => onChange(new Set(ALL_COUNTRIES));
    const clearAll = () => onChange(new Set([ALL_COUNTRIES[0]]));

    const selectionLabel = isDynamic
        ? `Dynamic · ${resolvedSet.size} countries for ${yearData.year}`
        : resolvedSet.size === ALL_COUNTRIES.length
            ? 'All countries included'
            : `${resolvedSet.size} of ${ALL_COUNTRIES.length} selected`;

    return (
        <div
            ref={backdropRef}
            onClick={handleBackdrop}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(10,10,10,0.72)', backdropFilter: 'blur(2px)' }}
        >
            <div
                className="relative flex flex-col"
                style={{
                    width: 520,
                    maxHeight: '80vh',
                    background: 'var(--color-charcoal)',
                    border: '1px solid var(--color-stone-line)',
                }}
            >
                {/* ── header ──────────────────────────────────────────────── */}
                <div className="flex items-center justify-between border-b border-stone-line px-6 py-4">
                    <div>
                        <h2 className="font-serif text-lg font-light tracking-[0.14em] text-marble">
                            Country Filter
                        </h2>
                        <p className="mt-0.5 font-sans text-[0.65rem] uppercase tracking-[0.2em] text-platinum-dim">
                            {selectionLabel}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center text-platinum-dim transition-colors hover:text-marble"
                        aria-label="Close"
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* ── presets ─────────────────────────────────────────────── */}
                <div className="border-b border-stone-line px-6 py-4">
                    <p className="mb-3 font-sans text-[0.6rem] uppercase tracking-[0.22em] text-platinum-dim">
                        Presets
                    </p>
                    <div className="flex flex-wrap gap-2">

                        {/* dynamic preset */}
                        <button
                            type="button"
                            onClick={() => onChange('top10gdp')}
                            className={`border px-4 py-1.5 font-sans text-xs uppercase tracking-[0.18em] transition-colors duration-200 ease-mechanical ${dynamicKey === 'top10gdp'
                                    ? 'border-bronze bg-bronze/10 text-bronze-bright'
                                    : 'border-stone-line text-platinum-dim hover:border-platinum-dim hover:text-platinum'
                                }`}
                        >
                            Top 10 by GDP
                            <span className="ml-1.5 font-mono text-[0.55rem] tracking-[0.08em] opacity-60">
                                · per year
                            </span>
                        </button>

                        {/* static presets */}
                        {STATIC_PRESETS.map(({ key, label }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => onChange(new Set(STATIC_PRESETS.find((p) => p.key === key)!.countries))}
                                className={`border px-4 py-1.5 font-sans text-xs uppercase tracking-[0.18em] transition-colors duration-200 ease-mechanical ${activeStaticPreset === key
                                        ? 'border-bronze bg-bronze/10 text-bronze-bright'
                                        : 'border-stone-line text-platinum-dim hover:border-platinum-dim hover:text-platinum'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}

                        {isCustom && (
                            <span className="flex items-center border border-stone-line px-4 py-1.5 font-sans text-xs uppercase tracking-[0.18em] text-bronze-bright/70">
                                Custom
                            </span>
                        )}
                    </div>
                </div>

                {/* ── country list ─────────────────────────────────────────── */}
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                    <div className="mb-3 flex items-center justify-between">
                        <p className="font-sans text-[0.6rem] uppercase tracking-[0.22em] text-platinum-dim">
                            Countries
                            {isDynamic && (
                                <span className="ml-2 text-stone-line-strong">· updates each year</span>
                            )}
                        </p>
                        {!isDynamic && (
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={selectAll}
                                    className="font-sans text-[0.6rem] uppercase tracking-[0.18em] text-platinum-dim transition-colors hover:text-platinum"
                                >
                                    Select all
                                </button>
                                <span className="text-stone-line-strong">·</span>
                                <button
                                    type="button"
                                    onClick={clearAll}
                                    className="font-sans text-[0.6rem] uppercase tracking-[0.18em] text-platinum-dim transition-colors hover:text-platinum"
                                >
                                    Clear
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                        {ALL_COUNTRIES.map((country) => {
                            const checked = resolvedSet.has(country);
                            return (
                                <button
                                    key={country}
                                    type="button"
                                    onClick={() => toggleCountry(country)}
                                    disabled={isDynamic}
                                    className={`flex items-center gap-3 px-2 py-[7px] text-left transition-colors duration-150 ${isDynamic
                                            ? 'cursor-default'
                                            : 'hover:bg-stone-line/20'
                                        } ${checked ? 'text-platinum' : 'text-platinum-dim'}`}
                                >
                                    <span
                                        className="flex h-3.5 w-3.5 shrink-0 items-center justify-center border transition-colors duration-150"
                                        style={{
                                            borderColor: checked
                                                ? isDynamic ? 'var(--color-stone-line-strong)' : 'var(--color-bronze)'
                                                : 'var(--color-stone-line-strong)',
                                            background: checked
                                                ? isDynamic ? 'var(--color-stone-line-strong)' : 'var(--color-bronze)'
                                                : 'transparent',
                                            opacity: isDynamic ? 0.6 : 1,
                                        }}
                                        aria-hidden
                                    >
                                        {checked && (
                                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                                <path d="M1 4L3 6L7 2" stroke="var(--color-charcoal)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </span>
                                    <span className="font-sans text-[0.72rem] tracking-[0.06em]">
                                        {country}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── footer ──────────────────────────────────────────────── */}
                <div className="flex items-center justify-end border-t border-stone-line px-6 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="border border-bronze px-6 py-2 font-sans text-xs uppercase tracking-[0.2em] text-bronze-bright transition-colors duration-200 hover:bg-bronze/10"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
}
