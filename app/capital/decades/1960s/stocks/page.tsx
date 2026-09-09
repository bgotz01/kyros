'use client';

import { useState, useEffect } from 'react';
import {
    NIFTY50_ALL_STOCKS,
    NIFTY50_NAMES,
    NIFTY50_BASE,
    NIFTY50_YEAR_END_PRICES,
    NIFTY50_START_YEAR,
    NIFTY50_ALL_YEARS,
    computeReturns,
    stockTotalReturn,
    stockLastYear,
    type Nifty50Stock,
} from '@/lib/capital/nifty50-returns';

// ─── cohorts ──────────────────────────────────────────────────────────────────

const COHORTS: { label: string; stocks: Nifty50Stock[] }[] = [
    { label: 'from 1962', stocks: ['KO', 'DIS', 'GE', 'IBM', 'JNJ', 'MRK', 'PG', 'XRX'] },
    { label: 'from 1966', stocks: ['MCD'] },
];

const STORAGE_KEY = 'nifty50-selected';
const DEFAULT_SELECTED: Nifty50Stock[] = ['KO', 'DIS', 'JNJ', 'MRK', 'XRX', 'MCD'];

const SELECTABLE = new Set(COHORTS.flatMap(c => c.stocks));

function loadSelected(): Set<Nifty50Stock> {
    if (typeof window === 'undefined') return new Set(DEFAULT_SELECTED);
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as string[];
            const valid = parsed.filter((s): s is Nifty50Stock =>
                SELECTABLE.has(s as Nifty50Stock),
            );
            if (valid.length > 0) return new Set(valid);
        }
    } catch { /* ignore */ }
    return new Set(DEFAULT_SELECTED);
}

function saveSelected(s: Set<Nifty50Stock>) {
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
    ticker: Nifty50Stock;
    selected: boolean;
    onToggle: () => void;
}) {
    const total = stockTotalReturn(ticker);
    const lastYr = stockLastYear(ticker);
    const startYr = NIFTY50_START_YEAR[ticker];

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
                {NIFTY50_NAMES[ticker]}
            </span>
            <span
                className="mt-0.5 font-mono text-[0.62rem] tabular-nums"
                style={{ color: returnColor(total) }}
            >
                {fmtPct(total, 0)} total
            </span>
            <span className="font-mono text-[0.55rem] tracking-[0.06em] text-platinum-dim">
                {startYr}–{lastYr}
            </span>
        </button>
    );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function Nifty50StocksPage() {
    const [selected, setSelected] = useState<Set<Nifty50Stock>>(new Set(DEFAULT_SELECTED));

    useEffect(() => {
        setSelected(loadSelected());
    }, []);

    function toggle(s: Nifty50Stock) {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(s)) {
                if (next.size === 1) return prev; // keep at least one
                next.delete(s);
            } else {
                next.add(s);
            }
            saveSelected(next);
            return next;
        });
    }

    const selectedStocks = NIFTY50_ALL_STOCKS.filter(s => selected.has(s));
    const rows = computeReturns(selectedStocks);

    // Summary stats — only rows through 1970 where at least one stock contributed
    const activeRows = rows.filter(r => r.year <= 1970 && r.count > 0);
    const avgAnnual = activeRows.length > 0
        ? activeRows.reduce((sum, r) => sum + r.indexReturn, 0) / activeRows.length
        : 0;

    // Overall index return from first year to last year across all selected stocks.
    // Compute as compounded product of annual index returns for years with data.
    const compounded = activeRows.reduce((prod, r) => prod * (1 + r.indexReturn), 1) - 1;

    // Which years to show: only through 1970, where at least one selected stock has data
    const visibleYears = NIFTY50_ALL_YEARS.filter(y =>
        y <= 1970 &&
        selectedStocks.some(s => {
            const p = NIFTY50_ALL_YEARS.indexOf(y);
            return rows[p]?.stockReturns[s] !== undefined;
        })
    );

    return (
        <div className="px-8 py-8">

            {/* ── header ──────────────────────────────────────────────────────── */}
            <div className="mb-8 flex items-center gap-5">
                <h2 className="font-serif text-3xl font-light tracking-[0.1em] text-marble">
                    1960s · Nifty Fifty
                </h2>
                <span aria-hidden className="h-px flex-1 bg-stone-line" />
            </div>

            <p className="mb-8 max-w-xl font-sans text-[0.72rem] leading-relaxed tracking-[0.04em] text-platinum-dim">
                Equal-weighted index of available Nifty Fifty names. Base price = each
                stock's first trading day in the CSV. Price return only — no dividends.
                Stocks from different cohorts enter the index in their first full year.
            </p>

            {/* ── stock selector ──────────────────────────────────────────────── */}
            {COHORTS.map(({ label, stocks }) => (
                <div key={label} className="mb-6">
                    <div className="mb-2 font-sans text-[0.6rem] uppercase tracking-[0.22em] text-platinum-dim">
                        {label}
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
                            const rowIdx = NIFTY50_ALL_YEARS.indexOf(year);
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
                                const price1970 = NIFTY50_YEAR_END_PRICES[1970]?.[s];
                                const basePrice = NIFTY50_BASE[s].price;
                                const r = price1970 !== undefined
                                    ? (price1970 - basePrice) / basePrice
                                    : stockTotalReturn(s);
                                const startYr = NIFTY50_START_YEAR[s];
                                return (
                                    <td key={s} className="py-3 pr-4 text-right">
                                        <span
                                            className="block font-mono text-[0.72rem] tabular-nums"
                                            style={{ color: returnColor(r) }}
                                        >
                                            {fmtPct(r, 0)}
                                        </span>
                                        <span className="block font-mono text-[0.52rem] tracking-[0.06em] text-platinum-dim">
                                            {startYr}–1970
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
