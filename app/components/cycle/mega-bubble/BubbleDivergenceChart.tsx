'use client';

import { useState, useCallback } from 'react';
import {
    ComposedChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { SectionLabel } from './ui';
import type { BubbleDef, RealPriceRow } from './types';

// ─── MA config (same as BubbleRealChart) ─────────────────────────────────────

interface MAConfig {
    key: keyof RealPriceRow;
    divKey: string;
    label: string;
    color: string;
}

const MA_CONFIGS: MAConfig[] = [
    { key: 'ma50', divKey: 'div50', label: '50D', color: '#22d3ee' },
    { key: 'ma100', divKey: 'div100', label: '100D', color: '#a78bfa' },
    { key: 'ma200', divKey: 'div200', label: '200D', color: '#f59e0b' },
    { key: 'ma500', divKey: 'div500', label: '500D', color: '#f87171' },
];

// ─── Compute divergence rows ──────────────────────────────────────────────────

function computeDivergence(data: RealPriceRow[]) {
    return data.map(r => {
        const row: Record<string, number | null> = { date: r.date as unknown as number };
        for (const ma of MA_CONFIGS) {
            const maVal = r[ma.key] as number | null;
            row[ma.divKey] = maVal != null && maVal !== 0
                ? parseFloat((((r.value - maVal) / maVal) * 100).toFixed(2))
                : null;
        }
        return row;
    });
}

// ─── Yearly ticks ─────────────────────────────────────────────────────────────

function yearlyTicks(data: RealPriceRow[]): string[] {
    const seen = new Set<number>();
    return data.reduce<string[]>((acc, r) => {
        const yr = parseInt(r.date.slice(0, 4));
        if (!seen.has(yr)) { seen.add(yr); acc.push(r.date); }
        return acc;
    }, []);
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function DivTooltip({ active, payload, label, activeMAs }: {
    active?: boolean; payload?: any[]; label?: string; activeMAs: Set<string>;
}) {
    if (!active || !payload?.length || !label) return null;
    const [y, m, d] = label.split('-').map(Number);
    const dateStr = new Date(y, m - 1, d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    return (
        <div className="border rounded-sm p-3 text-xs shadow-lg space-y-1 min-w-[160px]"
            style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--surface-border)' }}>
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{dateStr}</p>
            {payload.map((entry: any) => {
                if (entry.value == null) return null;
                const pct = entry.value as number;
                return (
                    <div key={entry.dataKey} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{entry.name}</span>
                        </div>
                        <span className="tabular-nums font-medium text-[11px]"
                            style={{ color: pct >= 0 ? '#4ade80' : '#f87171' }}>
                            {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
    bubble: BubbleDef;
    data: RealPriceRow[];   // passed in from parent — no double-fetch
}

export default function BubbleDivergenceChart({ bubble, data }: Props) {
    const [open, setOpen] = useState(false);
    const [activeMAs, setActiveMAs] = useState<Set<string>>(
        new Set(['div200', 'div500']),
    );

    const toggleMA = (key: string) => setActiveMAs(prev => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
    });

    const divData = computeDivergence(data);
    const ticks = yearlyTicks(data);

    const tooltipContent = useCallback(
        (props: any) => <DivTooltip {...props} activeMAs={activeMAs} />,
        [activeMAs],
    );

    return (
        <div className="border rounded-sm overflow-hidden"
            style={{ borderColor: open ? `${bubble.color}30` : 'var(--surface-border)', backgroundColor: 'var(--surface-raised)' }}>

            {/* Collapse toggle header */}
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 transition-opacity hover:opacity-80"
            >
                <div className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: bubble.color }} />
                    <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: 'var(--accent)' }}>
                        Price / MA Divergence
                    </span>
                    <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                        (price − MA) / MA %
                    </span>
                </div>
                <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    style={{ color: 'var(--text-muted)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className="border-t px-4 pb-4 pt-3 space-y-4"
                    style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)' }}>

                    {/* MA toggles */}
                    <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[9px] uppercase tracking-[0.2em] mr-1" style={{ color: 'var(--text-muted)' }}>Show</span>
                        {MA_CONFIGS.map(ma => (
                            <button key={ma.divKey} onClick={() => toggleMA(ma.divKey)}
                                className="px-2 py-0.5 text-[10px] border rounded-sm transition-all"
                                style={activeMAs.has(ma.divKey)
                                    ? { borderColor: ma.color, backgroundColor: ma.color + '20', color: ma.color }
                                    : { borderColor: 'var(--surface-border)', color: 'var(--text-muted)', backgroundColor: 'transparent' }}>
                                {ma.label}
                            </button>
                        ))}
                    </div>

                    {/* Chart */}
                    <ResponsiveContainer width="100%" height={280}>
                        <ComposedChart data={divData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="date" ticks={ticks}
                                tickFormatter={v => (v as string).slice(0, 4)}
                                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                                axisLine={false} tickLine={false} />
                            <YAxis
                                tickFormatter={v => `${v > 0 ? '+' : ''}${v}%`}
                                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                                axisLine={false} tickLine={false} width={42} />
                            <Tooltip content={tooltipContent} />
                            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                            {/* Extreme zones */}
                            <ReferenceLine y={50} stroke="rgba(239,68,68,0.2)" strokeDasharray="3 3" />
                            <ReferenceLine y={100} stroke="rgba(239,68,68,0.35)" strokeDasharray="3 3"
                                label={{ value: '+100%', fill: 'rgba(239,68,68,0.5)', fontSize: 9, position: 'insideTopLeft' }} />
                            <ReferenceLine y={-25} stroke="rgba(74,222,128,0.2)" strokeDasharray="3 3" />

                            {MA_CONFIGS.filter(ma => activeMAs.has(ma.divKey)).map(ma => (
                                <Line key={ma.divKey} type="monotone" dataKey={ma.divKey}
                                    stroke={ma.color} strokeWidth={1.5} dot={false}
                                    name={`vs ${ma.label}`}
                                    isAnimationActive={false} connectNulls />
                            ))}
                        </ComposedChart>
                    </ResponsiveContainer>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        {MA_CONFIGS.filter(ma => activeMAs.has(ma.divKey)).map(ma => (
                            <div key={ma.divKey} className="flex items-center gap-1.5">
                                <span className="w-4 h-0.5 rounded-full" style={{ backgroundColor: ma.color }} />
                                <span className="text-[10px]" style={{ color: ma.color }}>vs {ma.label} MA</span>
                            </div>
                        ))}
                    </div>

                    <p className="text-[10px] leading-4" style={{ color: 'var(--text-muted)' }}>
                        Divergence = (Price − MA) / MA × 100. Positive = price above MA. Extreme readings above +100% historically preceded sharp corrections.
                    </p>
                </div>
            )}
        </div>
    );
}
