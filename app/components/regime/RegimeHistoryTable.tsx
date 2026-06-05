'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { regimeToSlug } from '@/app/lib/regime-slugs';
import type { RegimeFamily } from '@/app/lib/regime-state-machine';

type SortKey = 'startDate' | 'endDate' | 'months';
type SortDir = 'asc' | 'desc';

interface RegimePeriod {
    regime: string;
    startDate: string;
    endDate: string;
    months: number;
}

interface RegimeHistoryTableProps {
    onRegimeSelect?: (dateRange: { start: string; end: string } | null) => void;
}

const REGIME_COLORS: Record<string, string> = {
    'Broad Growth': '#22c55e',
    'Long Duration': '#3b82f6',
    'Overvaluation': '#eab308',
    'Crisis': '#991b1b',
    'Bond Stress': '#ea580c',
    'Liquidity Shock': '#a855f7',
    'None': '#6b7280',
};

function getRegimeColor(regime: string): string {
    return REGIME_COLORS[regime] ?? '#6b7280';
}

export default function RegimeHistoryTable({ onRegimeSelect }: RegimeHistoryTableProps) {
    const [periods, setPeriods] = useState<RegimePeriod[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRegime, setSelectedRegime] = useState<string>('all');
    const [sortKey, setSortKey] = useState<SortKey>('startDate');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number | null>(null);
    const itemsPerPage = 10;

    useEffect(() => {
        fetch('/api/regime/history')
            .then(r => r.json())
            .then(data => setPeriods(data.periods || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleRowClick = (period: RegimePeriod, index: number) => {
        if (selectedPeriodIndex === index) {
            setSelectedPeriodIndex(null);
            onRegimeSelect?.(null);
        } else {
            setSelectedPeriodIndex(index);
            const endDate = period.endDate === 'Current'
                ? new Date().toISOString().split('T')[0]
                : period.endDate;
            onRegimeSelect?.({ start: period.startDate, end: endDate });
        }
    };

    if (loading) return (
        <div className="border rounded-sm p-8 text-center text-xs uppercase tracking-widest"
            style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}>
            Loading regime history…
        </div>
    );

    const filteredPeriods = selectedRegime === 'all'
        ? periods
        : periods.filter(p => p.regime === selectedRegime);

    const uniqueRegimes = Array.from(new Set(periods.map(p => p.regime))).sort();

    const nextRegimeMap = new Map<RegimePeriod, string | null>();
    const chronological = [...periods].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    chronological.forEach((period, i) => {
        nextRegimeMap.set(period, i < chronological.length - 1 ? chronological[i + 1].regime : null);
    });

    const sortedPeriods = [...filteredPeriods].sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'months') {
            cmp = a.months - b.months;
        } else {
            const aVal = sortKey === 'endDate' && a.endDate === 'Current' ? Date.now() : new Date(a[sortKey]).getTime();
            const bVal = sortKey === 'endDate' && b.endDate === 'Current' ? Date.now() : new Date(b[sortKey]).getTime();
            cmp = aVal - bVal;
        }
        return sortDir === 'asc' ? cmp : -cmp;
    });

    const totalPages = Math.ceil(filteredPeriods.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const displayedPeriods = isExpanded ? sortedPeriods.slice(startIndex, endIndex) : [];

    const SortIndicator = ({ col }: { col: SortKey }) => (
        <span className="ml-1 text-[10px]">
            {sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : <span style={{ opacity: 0.3 }}>↑</span>}
        </span>
    );

    return (
        <div className="border rounded-sm overflow-hidden" style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-raised)' }}>
            {/* Header */}
            <button
                onClick={() => setIsExpanded(e => !e)}
                className="w-full px-5 py-4 flex items-center justify-between transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--surface)' }}
            >
                <div className="text-left">
                    <div className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: 'var(--accent)' }}>Regime History</div>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {filteredPeriods.length} regime periods{selectedRegime !== 'all' ? ' (filtered)' : ' from 1960 to present'}
                    </p>
                </div>
                <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {isExpanded ? '▲ collapse' : '▼ expand'}
                </span>
            </button>

            {isExpanded && (
                <>
                    {/* Filter */}
                    <div className="px-5 py-3 border-b border-t flex items-center gap-3"
                        style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)' }}>
                        <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Filter:</span>
                        <select
                            value={selectedRegime}
                            onChange={e => { setSelectedRegime(e.target.value); setCurrentPage(1); }}
                            className="px-2 py-1 rounded-sm border text-[11px] outline-none"
                            style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
                        >
                            <option value="all">All ({periods.length})</option>
                            {uniqueRegimes.map(r => (
                                <option key={r} value={r}>{r} ({periods.filter(p => p.regime === r).length})</option>
                            ))}
                        </select>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y" style={{ borderColor: 'var(--surface-border)' }}>
                            <thead style={{ backgroundColor: 'var(--surface)' }}>
                                <tr>
                                    <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Regime</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-wider cursor-pointer select-none hover:opacity-80"
                                        style={{ color: 'var(--text-muted)' }} onClick={() => { setSortKey('startDate'); setSortDir(d => sortKey === 'startDate' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); setCurrentPage(1); }}>
                                        Start <SortIndicator col="startDate" />
                                    </th>
                                    <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-wider cursor-pointer select-none hover:opacity-80"
                                        style={{ color: 'var(--text-muted)' }} onClick={() => { setSortKey('endDate'); setSortDir(d => sortKey === 'endDate' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); setCurrentPage(1); }}>
                                        End <SortIndicator col="endDate" />
                                    </th>
                                    <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-wider cursor-pointer select-none hover:opacity-80"
                                        style={{ color: 'var(--text-muted)' }} onClick={() => { setSortKey('months'); setSortDir(d => sortKey === 'months' ? (d === 'asc' ? 'desc' : 'asc') : 'desc'); setCurrentPage(1); }}>
                                        Duration <SortIndicator col="months" />
                                    </th>
                                    <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Next Regime</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedPeriods.map((period, index) => {
                                    const globalIndex = startIndex + index;
                                    const isSelected = selectedPeriodIndex === globalIndex;
                                    const color = getRegimeColor(period.regime);
                                    const nextR = nextRegimeMap.get(period);
                                    return (
                                        <tr
                                            key={index}
                                            onClick={() => handleRowClick(period, globalIndex)}
                                            className="cursor-pointer border-b transition-opacity hover:opacity-80"
                                            style={{
                                                borderColor: 'var(--surface-border)',
                                                borderLeft: `3px solid ${color}`,
                                                backgroundColor: isSelected ? 'var(--accent-dim)' : 'transparent',
                                            }}
                                        >
                                            <td className="px-5 py-3 text-sm font-medium">
                                                <Link
                                                    href={`/regime/${regimeToSlug(period.regime as RegimeFamily)}`}
                                                    onClick={e => e.stopPropagation()}
                                                    className="hover:underline underline-offset-2 transition-opacity hover:opacity-70"
                                                    style={{ color }}
                                                >
                                                    {period.regime}
                                                </Link>
                                            </td>
                                            <td className="px-5 py-3 text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                                                {new Date(period.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                                            </td>
                                            <td className="px-5 py-3 text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                                                {period.endDate === 'Current'
                                                    ? <span className="px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase"
                                                        style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)' }}>Current</span>
                                                    : new Date(period.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                                            </td>
                                            <td className="px-5 py-3 text-[11px] tabular-nums font-mono text-right" style={{ color: 'var(--text-muted)' }}>
                                                {period.months}mo
                                            </td>
                                            <td className="px-5 py-3 text-[11px] font-medium" style={{ color: nextR ? getRegimeColor(nextR) : 'var(--text-muted)' }}>
                                                {nextR ?? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-5 py-3 border-t flex items-center justify-between"
                            style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)' }}>
                            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                {startIndex + 1}–{Math.min(endIndex, filteredPeriods.length)} of {filteredPeriods.length}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-2 py-1 rounded-sm border text-[11px] disabled:opacity-40"
                                    style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}
                                >
                                    ‹
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                                    .map((page, i, arr) => (
                                        <React.Fragment key={page}>
                                            {i > 0 && arr[i - 1] !== page - 1 && (
                                                <span className="px-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>…</span>
                                            )}
                                            <button
                                                onClick={() => setCurrentPage(page)}
                                                className="px-2.5 py-1 rounded-sm border text-[11px] font-medium transition-colors"
                                                style={page === currentPage
                                                    ? { borderColor: 'var(--accent)', color: 'var(--accent)', backgroundColor: 'var(--accent-dim)' }
                                                    : { borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }
                                                }
                                            >
                                                {page}
                                            </button>
                                        </React.Fragment>
                                    ))
                                }
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-2 py-1 rounded-sm border text-[11px] disabled:opacity-40"
                                    style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}
                                >
                                    ›
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
