'use client';

import { useEffect, useState } from 'react';
import HoverNote from './HoverNote';
import {
    EM_ALL_STOCKS,
    EM_NAMES,
    EM_BASE,
    EM_GEOGRAPHY,
    EM_START_YEAR,
    EM_YEAR_END_PRICES,
    EM_DECADE_END,
    computeEmReturns,
    type EmStock,
} from '@/lib/capital/em2000s-returns';

// ─── must mirror the storage key and defaults in the 2000s stocks page ────────
const STORAGE_KEY = 'em2000s-selected';
const SELECTABLE = new Set(EM_ALL_STOCKS as readonly EmStock[]);
const DEFAULT_SELECTED: EmStock[] = [
    'BBD', 'PBR', 'IBN', 'AMX',
    'PTR', 'CHL', 'LFC', 'BIDU',
    'MOS', 'RIO', 'POT', 'BHP', 'VALE',
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function loadSelected(): EmStock[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as string[];
            const valid = parsed.filter((s): s is EmStock => SELECTABLE.has(s as EmStock));
            if (valid.length > 0) return valid;
        }
    } catch { /* ignore */ }
    return DEFAULT_SELECTED;
}

function computeTotal(stocks: EmStock[]): number {
    const rows = computeEmReturns(stocks).filter(r => r.count > 0);
    return rows.reduce((prod, r) => prod * (1 + r.indexReturn), 1) - 1;
}

function fmtPct(r: number) {
    const pct = Math.round(r * 100);
    return `${pct >= 0 ? '+' : '−'}${Math.abs(pct)}%`;
}

const AHEAD = '#74B87A';
const BEHIND = '#C4574A';

// ─── component ────────────────────────────────────────────────────────────────

export default function Em2000sReturn({
    benchmarkPct,
}: {
    benchmarkPct: number;
}) {
    const [stocks, setStocks] = useState<EmStock[]>(DEFAULT_SELECTED);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setStocks(loadSelected());
        setMounted(true);

        function onStorage(e: StorageEvent) {
            if (e.key === STORAGE_KEY) setStocks(loadSelected());
        }
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const totalReturn = computeTotal(stocks);
    const pct = Math.round(totalReturn * 100);
    const color = pct >= benchmarkPct ? AHEAD : BEHIND;

    // Per-stock total returns for tooltip
    const stockLines = stocks.map(s => {
        const base = EM_BASE[s].price;
        const last = EM_YEAR_END_PRICES[EM_DECADE_END]?.[s];
        const r = last !== undefined ? Math.round(((last - base) / base) * 100) : null;
        const startYr = EM_START_YEAR[s];
        const geo = EM_GEOGRAPHY[s];
        return `${s} · ${EM_NAMES[s]} (${geo})  ${r !== null ? `${r >= 0 ? '+' : '−'}${Math.abs(r)}%` : '—'}  ${startYr}–${EM_DECADE_END}`;
    });

    const basisLine = `Equal-weighted, price return only. ${stocks.length} stock${stocks.length !== 1 ? 's' : ''}. Jan 2003 – Dec 2009.`;

    if (!mounted) {
        return (
            <span className="font-mono text-[0.9rem] tracking-[0.04em] tabular-nums text-platinum-dim">
                —
            </span>
        );
    }

    return (
        <HoverNote
            title={`2000s · EM & Commodities (${stocks.length} stocks)`}
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
