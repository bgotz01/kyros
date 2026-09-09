'use client';

import { useEffect, useState } from 'react';
import HoverNote from './HoverNote';
import {
    NIFTY50_ALL_STOCKS,
    NIFTY50_NAMES,
    NIFTY50_BASE,
    NIFTY50_YEAR_END_PRICES,
    NIFTY50_START_YEAR,
    computeReturns,
    type Nifty50Stock,
} from '@/lib/capital/nifty50-returns';

// ─── must mirror the storage key in the stocks page ───────────────────────────
const STORAGE_KEY = 'nifty50-selected';
const SELECTABLE: Nifty50Stock[] = ['KO', 'DIS', 'GE', 'IBM', 'JNJ', 'MRK', 'PG', 'XRX', 'MCD'];
const DEFAULT_SELECTED: Nifty50Stock[] = ['KO', 'DIS', 'JNJ', 'MRK', 'XRX', 'MCD'];

// ─── helpers ──────────────────────────────────────────────────────────────────

function loadSelected(): Nifty50Stock[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as string[];
            const valid = parsed.filter((s): s is Nifty50Stock =>
                SELECTABLE.includes(s as Nifty50Stock),
            );
            if (valid.length > 0) return valid;
        }
    } catch { /* ignore */ }
    return DEFAULT_SELECTED;
}

function computeTotal(stocks: Nifty50Stock[]): number {
    // Compounded product of annual index returns 1962–1970
    const rows = computeReturns(stocks).filter(r => r.year <= 1970 && r.count > 0);
    return rows.reduce((prod, r) => prod * (1 + r.indexReturn), 1) - 1;
}

function fmtPct(r: number) {
    const pct = Math.round(r * 100);
    return `${pct >= 0 ? '+' : '−'}${Math.abs(pct)}%`;
}

// ─── component ────────────────────────────────────────────────────────────────

const AHEAD = '#74B87A';
const BEHIND = '#C4574A';

/** Renders the Nifty Fifty return for the 1960s row in ParadigmTable.
 *  Reads the stock selection from localStorage so it stays in sync with
 *  the /capital/decades/1960s/stocks page. */
export default function Nifty50Return({
    benchmarkPct,
}: {
    /** The decade's benchmark return — used to colour ahead/behind. */
    benchmarkPct: number;
}) {
    const [stocks, setStocks] = useState<Nifty50Stock[]>(DEFAULT_SELECTED);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setStocks(loadSelected());
        setMounted(true);

        // Keep in sync if another tab changes the selection
        function onStorage(e: StorageEvent) {
            if (e.key === STORAGE_KEY) setStocks(loadSelected());
        }
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const totalReturn = computeTotal(stocks);
    const pct = Math.round(totalReturn * 100);
    const color = pct >= benchmarkPct ? AHEAD : BEHIND;

    // Per-stock total returns to 1970 for the tooltip
    const stockLines = stocks.map(s => {
        const base = NIFTY50_BASE[s].price;
        const price1970 = NIFTY50_YEAR_END_PRICES[1970]?.[s];
        const r = price1970 !== undefined ? Math.round(((price1970 - base) / base) * 100) : null;
        const startYr = NIFTY50_START_YEAR[s];
        return `${s} · ${NIFTY50_NAMES[s]}${r !== null ? `  ${r >= 0 ? '+' : '−'}${Math.abs(r)}%` : ''} (${startYr}–1970)`;
    });

    const basisLine = `Equal-weighted, price return only. ${stocks.length} stock${stocks.length !== 1 ? 's' : ''}. Jan 1962 – Dec 1970.`;

    // Suppress until mounted to avoid hydration mismatch (localStorage unavailable on server)
    if (!mounted) {
        return (
            <span className="font-mono text-[0.9rem] tracking-[0.04em] tabular-nums text-platinum-dim">
                —
            </span>
        );
    }

    return (
        <HoverNote
            title={`1960s · Nifty Fifty (${stocks.length} stocks)`}
            body={[basisLine, ...stockLines]}
        >
            <span className="inline-flex items-baseline gap-1.5">
                <span
                    className="font-mono text-[0.9rem] tracking-[0.04em] tabular-nums"
                    style={{ color }}
                >
                    {fmtPct(totalReturn)}
                </span>
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-bronze-dim">
                    idx
                </span>
            </span>
        </HoverNote>
    );
}
