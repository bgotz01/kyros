'use client';

import { useCallback } from 'react';
import {
    ComposedChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { type BubbleDef, type RealPriceRow } from './types';
import { SectionLabel } from './ui';
import { useState } from 'react';

// ─── MA config ────────────────────────────────────────────────────────────────

interface MAConfig {
    key: keyof RealPriceRow;
    label: string;
    color: string;
    dash?: string;
}

export const MA_CONFIGS: MAConfig[] = [
    { key: 'ma50', label: '50D', color: '#22d3ee', dash: '6 2' },
    { key: 'ma100', label: '100D', color: '#a78bfa', dash: '6 2' },
    { key: 'ma200', label: '200D', color: '#f59e0b', dash: '4 2' },
    { key: 'ma500', label: '500D', color: '#f87171', dash: '3 3' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function yearlyTicks(data: RealPriceRow[]): string[] {
    if (!data.length) return [];
    const seen = new Set<number>();
    return data.reduce<string[]>((acc, r) => {
        const yr = parseInt(r.date.slice(0, 4));
        if (!seen.has(yr)) { seen.add(yr); acc.push(r.date); }
        return acc;
    }, []);
}

function RealTooltip({ active, payload, label }: {
    active?: boolean; payload?: any[]; label?: string;
}) {
    if (!active || !payload?.length || !label) return null;
    const [y, m, d] = label.split('-').map(Number);
    const dateStr = new Date(y, m - 1, d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    return (
        <div className="border rounded-sm p-3 text-xs shadow-lg space-y-1 min-w-[150px]"
            style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--surface-border)' }}>
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{dateStr}</p>
            {payload.map((entry: any) => {
                if (entry.value == null) return null;
                return (
                    <div key={entry.dataKey} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="tabular-nums text-[11px]" style={{ color: entry.color }}>
                            {(entry.value as number).toLocaleString('en-US', { maximumFractionDigits: 0 })}
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
    data: RealPriceRow[];
}

export default function BubbleRealChart({ bubble, data }: Props) {
    const [activeMAs, setActiveMAs] = useState<Set<string>>(new Set(['ma200', 'ma500']));

    const toggleMA = (key: string) => setActiveMAs(prev => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
    });

    const ticks = yearlyTicks(data);
    const tooltipContent = useCallback((props: any) => <RealTooltip {...props} />, []);

    const peakRow = data.reduce<RealPriceRow | null>(
        (best, r) => best === null || r.value > best.value ? r : best, null
    );

    return (
        <div className="border rounded-sm p-4 space-y-4"
            style={{ borderColor: `${bubble.color}30`, backgroundColor: 'var(--surface-raised)' }}>

            {/* Header + MA toggles */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <SectionLabel>Daily Price · {bubble.sub}</SectionLabel>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        Real price from database · {bubble.peakDate} peak at {bubble.peakLevel}
                    </p>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[9px] uppercase tracking-[0.2em] mr-1" style={{ color: 'var(--text-muted)' }}>MA</span>
                    {MA_CONFIGS.map(ma => (
                        <button key={ma.key as string} onClick={() => toggleMA(ma.key as string)}
                            className="px-2 py-0.5 text-[10px] border rounded-sm transition-all"
                            style={activeMAs.has(ma.key as string)
                                ? { borderColor: ma.color, backgroundColor: ma.color + '20', color: ma.color }
                                : { borderColor: 'var(--surface-border)', color: 'var(--text-muted)', backgroundColor: 'transparent' }}>
                            {ma.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={340}>
                <ComposedChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" ticks={ticks} tickFormatter={v => v.slice(0, 4)}
                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis domain={['auto', 'auto']}
                        tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip content={tooltipContent} />
                    {peakRow && (
                        <ReferenceLine x={peakRow.date} stroke={bubble.color + '60'} strokeDasharray="4 3"
                            label={{ value: 'PEAK', fill: bubble.color + '90', fontSize: 9, position: 'insideTopRight' }} />
                    )}
                    <Line type="monotone" dataKey="value" stroke={bubble.color}
                        strokeWidth={1.5} dot={false} name="Price" isAnimationActive={false} connectNulls />
                    {MA_CONFIGS.filter(ma => activeMAs.has(ma.key as string)).map(ma => (
                        <Line key={ma.key as string} type="monotone" dataKey={ma.key as string}
                            stroke={ma.color} strokeWidth={1.5} dot={false}
                            strokeDasharray={ma.dash} name={ma.label}
                            isAnimationActive={false} connectNulls />
                    ))}
                </ComposedChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5 rounded-full" style={{ backgroundColor: bubble.color }} />
                    <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Price</span>
                </div>
                {MA_CONFIGS.filter(ma => activeMAs.has(ma.key as string)).map(ma => (
                    <div key={ma.key as string} className="flex items-center gap-1.5">
                        <span className="w-4 h-0.5 rounded-full" style={{ backgroundColor: ma.color }} />
                        <span className="text-[10px]" style={{ color: ma.color }}>{ma.label} MA</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
