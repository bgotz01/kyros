'use client';

import { useEffect, useState } from 'react';
import type { PercentileShift } from '@/app/api/regime/percentile-shifts/route';

const THRESHOLD = 10;
const START_YEAR = 1960;

function offsetToYearMonth(offset: number): string {
    const y = START_YEAR + Math.floor(offset / 12);
    const m = (offset % 12) + 1;
    return `${y}-${String(m).padStart(2, '0')}`;
}

function fmtMonth(ym: string): string {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function fmtVal(v: number | null): string {
    if (v === null) return '—';
    return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;
}

function PercentileBar({ value }: { value: number }) {
    const color =
        value >= 80 ? '#f87171' :
            value >= 60 ? '#fb923c' :
                value <= 20 ? '#4ade80' :
                    value <= 40 ? '#86efac' :
                        'rgba(255,255,255,0.25)';

    return (
        <div className="relative h-1 flex-1 rounded-full overflow-hidden"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <div className="absolute left-0 top-0 h-full rounded-full transition-all"
                style={{ width: `${value}%`, backgroundColor: color }} />
        </div>
    );
}

function MetricRow({ s }: { s: PercentileShift }) {
    const isAlert = s.delta !== null && Math.abs(s.delta) >= THRESHOLD;
    const up = (s.delta ?? 0) > 0;
    const deltaColor = up ? '#f87171' : '#4ade80';

    const pctColor =
        (s.currentPercentile ?? 50) >= 80 ? '#f87171' :
            (s.currentPercentile ?? 50) >= 60 ? '#fb923c' :
                (s.currentPercentile ?? 50) <= 20 ? '#4ade80' :
                    (s.currentPercentile ?? 50) <= 40 ? '#86efac' :
                        'rgba(255,255,255,0.25)';

    return (
        <div className="flex items-center gap-3 py-2 border-b last:border-0"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}>

            {/* Left: label + bar with inline percentile number */}
            <div className="flex-1 min-w-0 grid gap-1">
                <span className="text-[11px] truncate"
                    style={{ color: isAlert ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {s.label}
                </span>
                {s.currentPercentile !== null && (
                    <div className="flex items-center gap-2 min-w-0">
                        <PercentileBar value={s.currentPercentile} />
                        <span className="text-[10px] tabular-nums shrink-0 w-7 text-right"
                            style={{ color: pctColor }}>
                            {s.currentPercentile.toFixed(0)}%
                        </span>
                    </div>
                )}
            </div>

            {/* Right: MoM column */}
            <div className="text-right shrink-0 w-12">
                <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>MoM</div>
                <div className="text-[11px] tabular-nums font-medium"
                    style={{ color: s.delta === null ? 'var(--text-muted)' : isAlert ? deltaColor : 'var(--text-secondary)' }}>
                    {s.delta === null ? '—' : `${up ? '+' : ''}${s.delta.toFixed(1)}`}
                </div>
            </div>
        </div>
    );
}

const GROUP_ORDER = ['Regime Inputs', 'Nominal Rates', 'Macro', 'Valuations'];
const REAL_GROUPS = ['Regime Inputs'];
const NOMINAL_GROUPS = ['Nominal Rates', 'Macro', 'Valuations'];

type View = 'real' | 'nominal';

export default function MacroAlerts() {
    const now = new Date();
    const maxOffset = (now.getFullYear() - START_YEAR) * 12 + now.getMonth();

    const [offset, setOffset] = useState<number | null>(null);
    const [shifts, setShifts] = useState<PercentileShift[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [collapsed, setCollapsed] = useState(false);
    const [view, setView] = useState<View>('real');

    // Derive the latest month from actual data so navigation anchors to real data, not calendar
    const latestDataMonth = shifts?.find(s => s.currentDate)?.currentDate?.slice(0, 7) ?? null;
    const latestDataOffset = latestDataMonth
        ? (() => {
            const [y, m] = latestDataMonth.split('-').map(Number);
            return (y - START_YEAR) * 12 + (m - 1);
        })()
        : maxOffset;

    const isLatest = offset === null;
    const displayMonth = isLatest
        ? (latestDataMonth ? fmtMonth(latestDataMonth) : '…')
        : fmtMonth(offsetToYearMonth(offset!));

    useEffect(() => {
        setLoading(true);
        // Don't clear shifts — keep stale data visible while new data loads
        const url = isLatest
            ? '/api/regime/percentile-shifts'
            : `/api/regime/percentile-shifts?date=${offsetToYearMonth(offset!)}`;
        fetch(url)
            .then(r => r.json())
            .then(data => Array.isArray(data) && setShifts(data))
            .catch(() => null)
            .finally(() => setLoading(false));
    }, [offset, isLatest]);

    const activeGroups = view === 'real' ? REAL_GROUPS : NOMINAL_GROUPS;

    const alertCount = shifts
        ?.filter(s => activeGroups.includes(s.group) && s.delta !== null && Math.abs(s.delta) >= THRESHOLD)
        .length ?? 0;
    const hasAlerts = alertCount > 0;

    const grouped = GROUP_ORDER
        .filter(g => activeGroups.includes(g))
        .map(g => ({
            group: g,
            items: (shifts ?? []).filter(s => s.group === g),
        }))
        .filter(g => g.items.length > 0);

    function stepBack() {
        setOffset(prev => {
            const cur = prev ?? latestDataOffset;
            return cur > 0 ? cur - 1 : cur;
        });
    }

    function stepForward() {
        setOffset(prev => {
            if (prev === null) return null;
            const next = prev + 1;
            return next >= latestDataOffset ? null : next;
        });
    }

    return (
        <div className="border"
            style={{
                borderColor: hasAlerts ? 'rgba(251,146,60,0.35)' : 'var(--surface-border)',
                backgroundColor: 'var(--surface-raised)',
            }}
        >
            {/* Header — row 1: title + chevron */}
            <div className="flex items-center px-4 pt-3 pb-2 gap-2">
                <button onClick={() => setCollapsed(c => !c)}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                    {hasAlerts && !loading && (
                        <span className="h-1.5 w-1.5 rounded-full animate-pulse shrink-0"
                            style={{ backgroundColor: '#fb923c' }} />
                    )}
                    <span className="text-[11px] font-medium uppercase tracking-[0.25em]"
                        style={{ color: hasAlerts && !loading ? '#fb923c' : 'var(--accent)' }}>
                        Macro Shifts
                    </span>
                    {!loading && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm"
                            style={{
                                backgroundColor: hasAlerts ? 'rgba(251,146,60,0.15)' : 'rgba(255,255,255,0.05)',
                                color: hasAlerts ? '#fb923c' : 'var(--text-muted)',
                            }}>
                            {hasAlerts ? `${alertCount} alert${alertCount > 1 ? 's' : ''}` : 'Stable'}
                        </span>
                    )}
                </button>
                <button onClick={() => setCollapsed(c => !c)} className="shrink-0">
                    <svg className="h-3 w-3 transition-transform"
                        style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', color: 'var(--text-muted)' }}
                        viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Header — row 2: toggle + month nav */}
            <div className="flex items-center px-4 pb-3 gap-2">
                {/* Real / Nominal toggle */}
                <div className="flex border overflow-hidden text-[9px] uppercase tracking-[0.15em]"
                    style={{ borderColor: 'var(--surface-border)' }}>
                    {(['real', 'nominal'] as View[]).map(v => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className="px-2.5 py-1 transition-colors"
                            style={{
                                backgroundColor: view === v ? 'var(--accent)' : 'transparent',
                                color: view === v ? 'var(--surface)' : 'var(--text-muted)',
                            }}
                        >
                            {v}
                        </button>
                    ))}
                </div>

                {/* Month nav */}
                <div className="flex items-center gap-1 ml-auto">
                    <button onClick={stepBack} disabled={offset !== null && offset <= 0}
                        className="px-1.5 py-0.5 text-[13px] leading-none transition-opacity disabled:opacity-20"
                        style={{ color: 'var(--text-muted)' }}>‹</button>
                    <span className="text-[10px] tabular-nums w-[68px] text-center"
                        style={{ color: isLatest ? 'var(--accent)' : 'var(--text-secondary)' }}>
                        {displayMonth}
                    </span>
                    <button onClick={stepForward} disabled={isLatest}
                        className="px-1.5 py-0.5 text-[13px] leading-none transition-opacity disabled:opacity-20"
                        style={{ color: 'var(--text-muted)' }}>›</button>
                </div>
            </div>

            {!collapsed && (
                <div className="border-t transition-opacity"
                    style={{ borderColor: 'var(--surface-border)', opacity: loading ? 0.5 : 1 }}>
                    {loading && !shifts && (
                        <div className="px-4 py-4 text-[11px] uppercase tracking-widest animate-pulse"
                            style={{ color: 'var(--text-muted)' }}>
                            Scanning metrics…
                        </div>
                    )}

                    {grouped.map(({ group, items }) => (
                        <div key={group}>
                            {/* Group header */}
                            <div className="px-4 pt-3 pb-1 text-[9px] uppercase tracking-[0.3em]"
                                style={{ color: 'var(--text-muted)' }}>
                                {group}
                            </div>
                            <div className="px-4">
                                {items.map(s => <MetricRow key={s.key} s={s} />)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
