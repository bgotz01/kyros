'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { TopStockRow } from '@/app/lib/queries/stockScreen';

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtCap = (v: number) => {
    if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
    if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
    return `$${(v / 1e6).toFixed(0)}M`;
};

const fmtPct = (v: number | null) => {
    if (v == null) return '—';
    const sign = v >= 0 ? '+' : '';
    return `${sign}${(v * 100).toFixed(1)}%`;
};

const pctColor = (v: number | null) => {
    if (v == null) return 'var(--text-muted)';
    return v >= 0 ? '#22c55e' : '#ef4444';
};

const SECTOR_COLORS: Record<string, string> = {
    'Technology': 'rgba(96,165,250,0.15)',
    'Communications': 'rgba(167,139,250,0.15)',
    'Consumer Discretionary': 'rgba(251,191,36,0.15)',
    'Consumer Staples': 'rgba(74,222,128,0.12)',
    'Healthcare': 'rgba(52,211,153,0.12)',
    'Financials': 'rgba(251,146,60,0.15)',
    'Industrials': 'rgba(248,113,113,0.12)',
    'Energy': 'rgba(253,224,71,0.12)',
};

const SECTOR_TEXT: Record<string, string> = {
    'Technology': '#60a5fa',
    'Communications': '#a78bfa',
    'Consumer Discretionary': '#fbbf24',
    'Consumer Staples': '#4ade80',
    'Healthcare': '#34d399',
    'Financials': '#fb923c',
    'Industrials': '#f87171',
    'Energy': '#fde047',
};

function SectorBadge({ sector }: { sector: string | null }) {
    if (!sector) return null;
    return (
        <span
            className="text-[9px] tracking-[0.15em] uppercase px-1.5 py-0.5"
            style={{
                background: SECTOR_COLORS[sector] ?? 'rgba(181,139,74,0.1)',
                color: SECTOR_TEXT[sector] ?? 'var(--text-muted)',
            }}
        >
            {sector}
        </span>
    );
}

// ─── Mini spark bar (market cap normalised) ───────────────────────────────────
function CapBar({ value, max }: { value: number; max: number }) {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-border)' }}>
            <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: 'var(--accent)' }}
            />
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

type SortKey = 'rank' | 'price' | 'marketCap' | 'ytdReturn' | 'oneYearReturn';
type SortDir = 'asc' | 'desc';

export default function StockLeaderboard() {
    const [rows, setRows] = useState<TopStockRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [sector, setSector] = useState<string>('All');
    const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'rank', dir: 'asc' });

    useEffect(() => {
        fetch('/api/stocks/top')
            .then((r) => r.json())
            .then((d) => {
                if (Array.isArray(d)) setRows(d);
                else setError('Unexpected response');
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const sectors = useMemo(() => {
        const s = new Set<string>();
        rows.forEach((r) => { if (r.sector) s.add(r.sector); });
        return ['All', ...Array.from(s).sort()];
    }, [rows]);

    const maxCap = useMemo(() => Math.max(...rows.map((r) => r.marketCap)), [rows]);

    const filtered = useMemo(() => {
        let out = rows;
        if (sector !== 'All') out = out.filter((r) => r.sector === sector);
        if (search.trim()) {
            const q = search.trim().toUpperCase();
            out = out.filter(
                (r) =>
                    r.symbol.includes(q) ||
                    (r.company ?? '').toUpperCase().includes(q),
            );
        }
        return [...out].sort((a, b) => {
            const { key, dir } = sort;
            const av = a[key] ?? (dir === 'asc' ? Infinity : -Infinity);
            const bv = b[key] ?? (dir === 'asc' ? Infinity : -Infinity);
            return dir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
        });
    }, [rows, sector, search, sort]);

    const toggleSort = (key: SortKey) => {
        setSort((s) =>
            s.key === key
                ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
                : { key, dir: key === 'rank' ? 'asc' : 'desc' },
        );
    };

    const thStyle = (key: SortKey): React.CSSProperties => ({
        color: sort.key === key ? 'var(--accent)' : 'var(--text-muted)',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
    });

    const arrow = (key: SortKey) =>
        sort.key === key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : '';

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <span
                    className="h-1.5 w-1.5 rounded-full animate-pulse mr-2"
                    style={{ background: 'var(--accent)' }}
                />
                <span className="text-[11px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                    Loading market data…
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="border px-5 py-4 text-sm" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
                Error: {error}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search symbol or company…"
                        className="border bg-transparent pl-3 pr-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-1 transition-colors"
                        style={{
                            borderColor: 'var(--surface-border)',
                            color: 'var(--text-primary)',
                            caretColor: 'var(--accent)',
                        }}
                        spellCheck={false}
                    />
                </div>

                {/* Sector pills */}
                <div className="flex flex-wrap gap-1.5">
                    {sectors.map((s) => (
                        <button
                            key={s}
                            onClick={() => setSector(s)}
                            className="px-2.5 py-1 text-[10px] tracking-[0.15em] uppercase border transition-all"
                            style={{
                                borderColor: sector === s ? 'var(--accent)' : 'var(--surface-border)',
                                color: sector === s ? 'var(--accent)' : 'var(--text-muted)',
                                background: sector === s ? 'var(--accent-dim)' : 'transparent',
                            }}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <span
                    className="ml-auto text-[10px] tracking-widest tabular-nums"
                    style={{ color: 'var(--text-muted)' }}
                >
                    {filtered.length} / {rows.length}
                </span>
            </div>

            {/* Table */}
            <div
                className="overflow-x-auto border"
                style={{ borderColor: 'var(--surface-border)' }}
            >
                <table className="min-w-full text-sm border-collapse">
                    <thead>
                        <tr style={{ background: 'var(--surface-raised)' }}>
                            <th
                                className="px-4 py-3 text-left text-[10px] tracking-[0.18em] uppercase w-10"
                                style={thStyle('rank')}
                                onClick={() => toggleSort('rank')}
                            >
                                #{arrow('rank')}
                            </th>
                            <th
                                className="px-4 py-3 text-left text-[10px] tracking-[0.18em] uppercase"
                                style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}
                            >
                                Company
                            </th>
                            <th
                                className="px-4 py-3 text-right text-[10px] tracking-[0.18em] uppercase"
                                style={thStyle('price')}
                                onClick={() => toggleSort('price')}
                            >
                                Price{arrow('price')}
                            </th>
                            <th
                                className="px-4 py-3 text-right text-[10px] tracking-[0.18em] uppercase"
                                style={thStyle('marketCap')}
                                onClick={() => toggleSort('marketCap')}
                            >
                                Mkt Cap{arrow('marketCap')}
                            </th>
                            <th className="px-4 py-3 w-20" />
                            <th
                                className="px-4 py-3 text-right text-[10px] tracking-[0.18em] uppercase"
                                style={thStyle('ytdReturn')}
                                onClick={() => toggleSort('ytdReturn')}
                            >
                                YTD{arrow('ytdReturn')}
                            </th>
                            <th
                                className="px-4 py-3 text-right text-[10px] tracking-[0.18em] uppercase"
                                style={thStyle('oneYearReturn')}
                                onClick={() => toggleSort('oneYearReturn')}
                            >
                                1Y{arrow('oneYearReturn')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((r, i) => (
                            <tr
                                key={r.symbol}
                                className="border-t transition-colors group"
                                style={{
                                    borderColor: 'var(--surface-border)',
                                    background: i % 2 === 0 ? 'transparent' : 'rgba(181,139,74,0.02)',
                                }}
                            >
                                {/* Rank */}
                                <td
                                    className="px-4 py-3 tabular-nums text-xs w-10"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    {r.rank}
                                </td>

                                {/* Symbol + Company */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <Link
                                            href={`/stocks/${r.symbol}/financials`}
                                            className="font-bold tracking-wider transition-colors hover:opacity-70"
                                            style={{ color: 'var(--accent)', minWidth: '3rem', display: 'inline-block' }}
                                        >
                                            {r.symbol}
                                        </Link>
                                        <div className="flex flex-col gap-0.5">
                                            {r.company && (
                                                <span
                                                    className="text-xs leading-tight max-w-[240px] truncate"
                                                    style={{ color: 'var(--text-secondary)' }}
                                                >
                                                    {r.company}
                                                </span>
                                            )}
                                            <SectorBadge sector={r.sector} />
                                        </div>
                                    </div>
                                </td>

                                {/* Price */}
                                <td
                                    className="px-4 py-3 text-right tabular-nums font-medium"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    ${r.price.toFixed(2)}
                                </td>

                                {/* Market Cap */}
                                <td
                                    className="px-4 py-3 text-right tabular-nums"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    {fmtCap(r.marketCap)}
                                </td>

                                {/* Cap bar */}
                                <td className="px-4 py-3">
                                    <CapBar value={r.marketCap} max={maxCap} />
                                </td>

                                {/* YTD */}
                                <td
                                    className="px-4 py-3 text-right tabular-nums font-semibold"
                                    style={{ color: pctColor(r.ytdReturn) }}
                                >
                                    {fmtPct(r.ytdReturn)}
                                </td>

                                {/* 1Y */}
                                <td
                                    className="px-4 py-3 text-right tabular-nums font-semibold"
                                    style={{ color: pctColor(r.oneYearReturn) }}
                                >
                                    {fmtPct(r.oneYearReturn)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Market cap from latest snapshot · Returns vs prior year-end · Source: stockdata
            </p>
        </div>
    );
}
