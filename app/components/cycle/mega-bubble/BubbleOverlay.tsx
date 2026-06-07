'use client';

import { useState, useMemo, useCallback } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { BUBBLES, type BubbleDef } from './types';
import { SectionLabel } from './ui';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildChartData(range: [number, number]): Record<string, number | null>[] {
    const [minM, maxM] = range;
    return Array.from({ length: maxM - minM + 1 }, (_, i) => {
        const m = minM + i;
        const row: Record<string, number | null> = { monthOffset: m };
        for (const b of BUBBLES) {
            const pt = b.data.find(d => d.monthOffset === m);
            row[b.id] = pt?.value ?? null;
        }
        return row;
    });
}

function OverlayTooltip({ active, payload, label, visible }: {
    active?: boolean; payload?: any[]; label?: number; visible: Set<string>;
}) {
    if (!active || !payload?.length || label == null) return null;
    const monthLabel = label === 0 ? 'Peak (month 0)'
        : label > 0 ? `+${label}m post-peak` : `${label}m pre-peak`;
    return (
        <div className="border rounded-sm p-3 text-xs shadow-lg space-y-1 min-w-[160px]"
            style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--surface-border)' }}>
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{monthLabel}</p>
            {BUBBLES.filter(b => visible.has(b.id)).map(b => {
                const entry = payload?.find(p => p.dataKey === b.id);
                if (!entry || entry.value == null) return null;
                return (
                    <div key={b.id} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                        <span style={{ color: 'var(--text-muted)' }}>{b.label.split(' ').slice(-1)}:</span>
                        <span className="tabular-nums font-medium" style={{ color: b.color }}>
                            {(entry.value as number).toFixed(1)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BubbleOverlay() {
    const [visible, setVisible] = useState<Set<string>>(new Set(BUBBLES.map(b => b.id)));
    const [prePeak, setPrePeak] = useState(60);
    const [postPeak, setPostPeak] = useState(30);

    const toggle = (id: string) => setVisible(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    const range: [number, number] = [-prePeak, postPeak];
    const chartData = useMemo(() => buildChartData(range), [prePeak, postPeak]);

    const ticks = useMemo(() => {
        const t: number[] = [];
        for (let m = range[0]; m <= range[1]; m++) if (m % 6 === 0) t.push(m);
        return t;
    }, [range]);

    const tickFormatter = (v: number) => {
        if (v === 0) return 'Peak';
        if (Math.abs(v) % 12 === 0) return `Y${v > 0 ? '+' : ''}${v / 12}`;
        return '';
    };

    const tooltipContent = useCallback(
        (props: any) => <OverlayTooltip {...props} visible={visible} />,
        [visible],
    );

    const PRE_OPTIONS = [24, 36, 48, 60];
    const POST_OPTIONS = [12, 24, 30, 36];

    return (
        <div className="border rounded-sm p-4 space-y-4"
            style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-raised)' }}>

            {/* Header + window controls */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <SectionLabel>Price Trajectory · Peak = 100</SectionLabel>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        All three bubbles indexed to their peak. X-axis = months relative to peak.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {/* Pre-peak window */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Pre</span>
                        <div className="flex border rounded-sm overflow-hidden" style={{ borderColor: 'var(--surface-border)' }}>
                            {PRE_OPTIONS.map(v => (
                                <button key={v} onClick={() => setPrePeak(v)}
                                    className="px-2 py-0.5 text-[10px] transition-colors"
                                    style={prePeak === v
                                        ? { backgroundColor: 'var(--accent)', color: 'var(--surface)' }
                                        : { backgroundColor: 'transparent', color: 'var(--text-muted)' }}>
                                    {v / 12}Y
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Post-peak window */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Post</span>
                        <div className="flex border rounded-sm overflow-hidden" style={{ borderColor: 'var(--surface-border)' }}>
                            {POST_OPTIONS.map(v => (
                                <button key={v} onClick={() => setPostPeak(v)}
                                    className="px-2 py-0.5 text-[10px] transition-colors"
                                    style={postPeak === v
                                        ? { backgroundColor: 'var(--accent)', color: 'var(--surface)' }
                                        : { backgroundColor: 'transparent', color: 'var(--text-muted)' }}>
                                    {v}m
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={360}>
                <LineChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="monthOffset" type="number" domain={[range[0], range[1]]}
                        ticks={ticks} tickFormatter={tickFormatter}
                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 110]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                        axisLine={false} tickLine={false} width={30} />
                    <Tooltip content={tooltipContent} />
                    <ReferenceLine x={0} stroke="rgba(255,255,255,0.25)" strokeDasharray="4 3"
                        label={{ value: 'PEAK', fill: 'rgba(255,255,255,0.3)', fontSize: 9, position: 'insideTopRight' }} />
                    <ReferenceLine y={50} stroke="rgba(239,68,68,0.2)" strokeDasharray="3 3"
                        label={{ value: '−50%', fill: 'rgba(239,68,68,0.4)', fontSize: 9, position: 'insideTopLeft' }} />
                    {BUBBLES.map(b => visible.has(b.id) ? (
                        <Line key={b.id} type="monotone" dataKey={b.id}
                            stroke={b.color} strokeWidth={2} dot={false}
                            connectNulls isAnimationActive={false} />
                    ) : null)}
                </LineChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {BUBBLES.map(b => (
                    <button key={b.id} onClick={() => toggle(b.id)}
                        className="flex items-center gap-1.5 transition-opacity"
                        style={{ opacity: visible.has(b.id) ? 1 : 0.3 }}>
                        <span className="w-4 h-0.5 rounded-full" style={{ backgroundColor: b.color }} />
                        <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{b.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
