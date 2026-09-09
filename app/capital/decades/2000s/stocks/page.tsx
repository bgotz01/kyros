'use client';

import { useState, useEffect } from 'react';
import {
    EM_ALL_STOCKS,
    EM_ALL_YEARS,
    EM_BASE,
    EM_NAMES,
    EM_GEOGRAPHY,
    EM_START_YEAR,
    EM_YEAR_END_PRICES,
    EM_DECADE_END,
    computeEmReturns,
    emStockTotalReturn,
    type EmStock,
} from '@/lib/capital/em2000s-returns';

// ─── cohorts ──────────────────────────────────────────────────────────────────

const COHORTS: { label: string; sublabel: string; stocks: EmStock[] }[] = [
    {
        label: 'Emerging Markets',
        sublabel: 'Brazil · India · Mexico · Colombia — from 2003',
        stocks: ['BBD', 'PBR', 'IBN', 'AMX', 'CX', 'MXX', 'CIB'],
    },
    {
        label: 'China',
        sublabel: 'H-shares & ADRs — from 2004',
        stocks: ['PTR', 'CHL', 'LFC', 'FXI', 'BIDU'],
    },
    {
        label: 'Mining & Materials',
        sublabel: 'Fertilisers · Miners · Copper — from 2003',
        stocks: ['MOS', 'POT', 'RIO', 'BHP', 'VALE', 'SCCO', 'ICL', 'CF'],
    },
];

const SELECTABLE = new Set(EM_ALL_STOCKS as readonly EmStock[]);

const STORAGE_KEY = 'em2000s-selected';
const DEFAULT_SELECTED: EmStock[] = ['BBD', 'PBR', 'IBN', 'AMX', 'PTR', 'CHL', 'LFC', 'BIDU', 'MOS', 'RIO', 'POT', 'BHP', 'VALE'];

function loadSelected(): Set<EmStock> {
    if (typeof window === 'undefined') return new Set(DEFAULT_SELECTED);
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as string[];
            const valid = parsed.filter((s): s is EmStock => SELECTABLE.has(s as EmStock));
            if (valid.length > 0) return new Set(valid);
        }
    } catch { /* ignore */ }
    return new Set(DEFAULT_SELECTED);
}

function saveSelected(s: Set<EmStock>) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...s])); } catch { /* ignore */ }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtPct(r: number, decimals = 1) {
    const pct = r * 100;
    return `${pct >= 0 ? '+' : '−'}${Math.abs(pct).toFixed(decimals)}%`;
}

function returnColor(r: number): string {
    if (r > 0.15) return 'var(--color-bronze-bright)';
    if (r > 0) return 'var(--color-platinum)';
    return '#C4574A';
}

// ─── stock chip ───────────────────────────────────────────────────────────────

function StockChip({
    ticker,
    selected,
    onToggle,
}: {
    ticker: EmStock;
    selected: boolean;
    onToggle: () => void;
}) {
    const total = emStockTotalReturn(ticker);
    const startYr = EM_START_YEAR[ticker];
    const geo = EM_GEOGRAPHY[ticker];

    return (
        <button
            onClick={onToggle}
            className={`flex flex-col gap-0.5 border px-3 py-2 text-left transition-colors duration-300 ease-mechanical ${selected
                ? 'border-bronze bg-charcoal'
                : 'border-stone-line bg-transparent opacity-40 hover:opacity-70'
                }`}
        >
            <span className="font-mono text-[0.7rem] tracking-[0.12em] text-bronze-bright">
                {ticker}
            </span>
            <span className="font-sans text-[0.6rem] tracking-[0.04em] text-platinum-dim">
                {EM_NAMES[ticker]}
            </span>
            <span
                className="mt-0.5 font-mono text-[0.62rem] tabular-nums"
                style={{ color: returnColor(total) }}
            >
                {fmtPct(total, 0)} total
            </span>
            <span className="font-mono text-[0.55rem] tracking-[0.06em] text-platinum-dim">
                {geo} · {startYr}–{EM_DECADE_END}
            </span>
        </button>
    );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function Em2000sStocksPage() {
    const [selected, setSelected] = useState<Set<EmStock>>(new Set(DEFAULT_SELECTED));

    // Defer localStorage read to client to avoid SSR hydration mismatch
    useEffect(() => {
        setSelected(loadSelected());
    }, []);

    function toggle(s: EmStock) {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(s)) {
                if (next.size === 1) return prev;
                next.delete(s);
            } else {
                next.add(s);
            }
            saveSelected(next);
            return next;
        });
    }

    const selectedStocks = EM_ALL_STOCKS.filter(s => selected.has(s));
    const rows = computeEmReturns(selectedStocks);
    const activeRows = rows.filter(r => r.count > 0);

    const avgAnnual = activeRows.length > 0
        ? activeRows.reduce((sum, r) => sum + r.indexReturn, 0) / activeRows.length
        : 0;

    const compounded = activeRows.reduce((prod, r) => prod * (1 + r.indexReturn), 1) - 1;

    const visibleYears = EM_ALL_YEARS.filter(y =>
        selectedStocks.some(s => {
            const idx = EM_ALL_YEARS.indexOf(y);
            return rows[idx]?.stockReturns[s] !== undefined;
        })
    );

    return (
        <div className="px-8 py-8">

            {/* ── header ──────────────────────────────────────────────────────── */}
            <div className="mb-8 flex items-center gap-5">
                <h2 className="font-serif text-3xl font-light tracking-[0.1em] text-marble">
                    2000s · Emerging Markets
                </h2>
                <span aria-hidden className="h-px flex-1 bg-stone-line" />
            </div>

            <p className="mb-8 max-w-xl font-sans text-[0.72rem] leading-relaxed tracking-[0.04em] text-platinum-dim">
                Equal-weighted index of EM names from the 2000s cycle. Base price = each
                stock's first trading day in the CSV. Price return only — no dividends.
                Stocks enter the index in their first full year.
            </p>

            {/* ── stock selectors ─────────────────────────────────────────────── */}
            {COHORTS.map(({ label, sublabel, stocks }) => (
                <div key={label} className="mb-7">
                    <div className="mb-1 font-sans text-[0.62rem] uppercase tracking-[0.22em] text-platinum-dim">
                        {label}
                    </div>
                    <div className="mb-2 font-sans text-[0.58rem] tracking-[0.08em] text-platinum-dim opacity-60">
                        {sublabel}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {stocks.map(s => (
                            <StockChip
                                key={s}
                                ticker={s}
                                selected={selected.has(s)}
                                onToggle={() => toggle(s)}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {/* ── summary stats ───────────────────────────────────────────────── */}
            <div className="mb-10 mt-8 flex flex-wrap gap-8 border-t border-stone-line pt-8">
                <Stat
                    label="Compounded index return"
                    value={fmtPct(compounded, 0)}
                    color={returnColor(compounded)}
                    note="across selected period"
                />
                <Stat
                    label="Avg annual return"
                    value={fmtPct(avgAnnual, 1)}
                    color={returnColor(avgAnnual)}
                    note={`${selectedStocks.length} stock${selectedStocks.length !== 1 ? 's' : ''}`}
                />
            </div>

            {/* ── returns table ───────────────────────────────────────────────── */}
            <div className="mb-3 font-sans text-[0.65rem] uppercase tracking-[0.22em] text-platinum-dim">
                Annual returns
            </div>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b-2 border-stone-line-strong">
                            <th className="pb-3 pr-6 text-left font-sans text-[0.62rem] uppercase tracking-[0.2em] text-platinum-dim">
                                Year
                            </th>
                            {selectedStocks.map(s => (
                                <th
                                    key={s}
                                    className="pb-3 pr-4 text-right font-mono text-[0.62rem] tracking-[0.1em] text-bronze-bright"
                                >
                                    {s}
                                </th>
                            ))}
                            <th className="pb-3 text-right font-sans text-[0.62rem] uppercase tracking-[0.2em] text-platinum">
                                Index
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-line">
                        {visibleYears.map(year => {
                            const rowIdx = EM_ALL_YEARS.indexOf(year);
                            const row = rows[rowIdx];
                            return (
                                <tr
                                    key={year}
                                    className="transition-colors duration-300 ease-mechanical hover:bg-charcoal"
                                >
                                    <td className="py-2.5 pr-6 font-mono text-[0.72rem] tracking-[0.12em] text-bronze">
                                        {year}
                                    </td>
                                    {selectedStocks.map(s => {
                                        const r = row.stockReturns[s];
                                        return (
                                            <td
                                                key={s}
                                                className="py-2.5 pr-4 text-right font-mono text-[0.72rem] tabular-nums"
                                                style={{ color: r !== undefined ? returnColor(r) : undefined }}
                                            >
                                                {r !== undefined
                                                    ? fmtPct(r)
                                                    : <span className="text-[0.6rem] text-platinum-dim">—</span>
                                                }
                                            </td>
                                        );
                                    })}
                                    <td
                                        className="py-2.5 text-right font-mono text-[0.8rem] font-medium tabular-nums"
                                        style={{ color: row.count > 0 ? returnColor(row.indexReturn) : undefined }}
                                    >
                                        {row.count > 0
                                            ? fmtPct(row.indexReturn)
                                            : <span className="text-[0.6rem] text-platinum-dim">—</span>
                                        }
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-stone-line-strong">
                            <td className="py-3 pr-6 font-sans text-[0.62rem] uppercase tracking-[0.2em] text-platinum-dim">
                                Total
                            </td>
                            {selectedStocks.map(s => {
                                const r = emStockTotalReturn(s);
                                const startYr = EM_START_YEAR[s];
                                return (
                                    <td key={s} className="py-3 pr-4 text-right">
                                        <span
                                            className="block font-mono text-[0.72rem] tabular-nums"
                                            style={{ color: returnColor(r) }}
                                        >
                                            {fmtPct(r, 0)}
                                        </span>
                                        <span className="block font-mono text-[0.52rem] tracking-[0.06em] text-platinum-dim">
                                            {startYr}–{EM_DECADE_END}
                                        </span>
                                    </td>
                                );
                            })}
                            <td className="py-3 text-right">
                                <span
                                    className="block font-mono text-[0.8rem] font-medium tabular-nums"
                                    style={{ color: returnColor(compounded) }}
                                >
                                    {fmtPct(compounded, 0)}
                                </span>
                                <span className="block font-mono text-[0.52rem] tracking-[0.06em] text-platinum-dim">
                                    compounded
                                </span>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

        </div>
    );
}

// ─── stat block ───────────────────────────────────────────────────────────────

function Stat({
    label,
    value,
    color,
    note,
}: {
    label: string;
    value: string;
    color: string;
    note: string;
}) {
    return (
        <div className="flex flex-col gap-1">
            <span className="font-sans text-[0.6rem] uppercase tracking-[0.22em] text-platinum-dim">
                {label}
            </span>
            <span
                className="font-mono text-2xl tracking-[0.06em] tabular-nums"
                style={{ color }}
            >
                {value}
            </span>
            <span className="font-sans text-[0.6rem] tracking-[0.08em] text-platinum-dim">
                {note}
            </span>
        </div>
    );
}
