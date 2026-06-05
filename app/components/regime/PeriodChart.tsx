'use client';

import { useEffect, useState } from 'react';
import {
    ComposedChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine,
} from 'recharts';

interface PricePoint {
    date: string;
    spx: number | null;
    ndx: number | null;
    inRegime: boolean;
}

interface ChartData {
    prices: PricePoint[];
    regimeStart: string;
    regimeEnd: string;
    windowStart: string;
    windowEnd: string;
}

interface Props {
    startDate: string;
    endDate: string;        // 'Current' or YYYY-MM-DD
    regimeColor: string;
    regime: string;
    spxReturn: number | null;
    ndxReturn: number | null;
    onClose: () => void;
}

const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: { dataKey: string; value: number; color: string }[];
    label?: string;
}) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="border px-3 py-2 text-[11px] space-y-1"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--surface-border)' }}>
            <div style={{ color: 'var(--text-muted)' }}>{label}</div>
            {payload.map(p => (
                <div key={p.dataKey} style={{ color: p.color }}>
                    {p.dataKey.toUpperCase()}: {p.value?.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </div>
            ))}
        </div>
    );
};

export default function PeriodChart({ startDate, endDate, regimeColor, regime, spxReturn, ndxReturn, onClose }: Props) {
    const [data, setData] = useState<ChartData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'spx' | 'ndx'>('spx');

    useEffect(() => {
        setLoading(true);
        setError(null);
        setData(null);

        const end = endDate === 'Current' ? 'Current' : endDate;
        fetch(`/api/regime/period-chart?start=${startDate}&end=${end}&padding=90`)
            .then(r => r.json())
            .then(d => {
                if (d.error) throw new Error(d.error);
                setData(d);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [startDate, endDate]);

    const fmt = (v: number | null) => {
        if (v == null) return '—';
        return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
    };

    const retColor = (v: number | null) =>
        v == null ? 'var(--text-muted)' : v > 0 ? '#4ade80' : '#f87171';

    // Sample for perf — max 600 points
    const chartData = data
        ? data.prices.filter((_, i) => i % Math.max(1, Math.floor(data.prices.length / 600)) === 0)
        : [];

    // Snap regime start/end to nearest actual date in the (possibly sampled) chartData
    // Recharts ReferenceLine/ReferenceArea x= must exactly match a dataKey value
    const snapToNearest = (target: string, points: typeof chartData): string | null => {
        if (!points.length) return null;
        return points.reduce((best, p) =>
            Math.abs(new Date(p.date).getTime() - new Date(target).getTime()) <
                Math.abs(new Date(best.date).getTime() - new Date(target).getTime())
                ? p : best
        ).date;
    };

    const snappedStart = data ? snapToNearest(data.regimeStart, chartData) : null;
    const snappedEnd = data ? snapToNearest(data.regimeEnd, chartData) : null;

    const tickFormatter = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

    return (
        <div className="border mt-0 overflow-hidden"
            style={{ borderColor: regimeColor + '50', backgroundColor: 'var(--surface-raised)' }}>

            {/* Header */}
            <div className="px-5 py-3 flex items-center justify-between border-b"
                style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)' }}>
                <div className="flex items-center gap-4">
                    <div>
                        <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: regimeColor }}>
                            {regime}
                        </span>
                        <span className="text-[11px] tabular-nums ml-3" style={{ color: 'var(--text-secondary)' }}>
                            {new Date(startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            {' → '}
                            {endDate === 'Current'
                                ? <span style={{ color: regimeColor }}>Now</span>
                                : new Date(endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                        <span className="tabular-nums font-medium"
                            style={{ color: retColor(view === 'spx' ? spxReturn : ndxReturn) }}>
                            {fmt(view === 'spx' ? spxReturn : ndxReturn)}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                            during period
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* SPX / NDX toggle */}
                    <div className="flex border" style={{ borderColor: 'var(--surface-border)' }}>
                        {(['spx', 'ndx'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setView(s)}
                                className="px-3 py-1 text-[10px] uppercase tracking-wider transition-colors"
                                style={{
                                    backgroundColor: view === s ? (s === 'spx' ? '#f59e0b' : '#60a5fa') + '20' : 'transparent',
                                    color: view === s ? (s === 'spx' ? '#f59e0b' : '#60a5fa') : 'var(--text-muted)',
                                    borderRight: s === 'spx' ? `1px solid var(--surface-border)` : 'none',
                                }}
                            >
                                {s.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[10px] uppercase tracking-wider hover:opacity-60 transition-opacity px-2 py-1"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div className="px-5 pt-3 flex items-center gap-4 text-[10px] uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                    <div className="h-px w-6"
                        style={{ backgroundColor: view === 'spx' ? '#f59e0b' : '#60a5fa' }} />
                    <span style={{ color: 'var(--text-muted)' }}>{view.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: regimeColor + '30' }} />
                    <span style={{ color: 'var(--text-muted)' }}>{regime} period</span>
                </div>
            </div>

            {/* Chart */}
            <div className="px-2 py-3">
                {loading && (
                    <div className="h-52 flex items-center justify-center text-[11px] uppercase tracking-widest"
                        style={{ color: 'var(--text-muted)' }}>
                        Loading…
                    </div>
                )}
                {error && (
                    <div className="h-52 flex items-center justify-center text-[11px]"
                        style={{ color: '#f87171' }}>
                        {error}
                    </div>
                )}
                {data && chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={220}>
                        <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(181,139,74,0.07)" />

                            {/* Regime period shading */}
                            {snappedStart && snappedEnd && (
                                <ReferenceArea
                                    x1={snappedStart}
                                    x2={snappedEnd}
                                    fill={regimeColor}
                                    fillOpacity={0.10}
                                    strokeOpacity={0}
                                />
                            )}

                            {/* Regime entry marker */}
                            {snappedStart && (
                                <ReferenceLine
                                    x={snappedStart}
                                    stroke={regimeColor}
                                    strokeWidth={1.5}
                                    strokeDasharray="4 3"
                                    label={{ value: 'Entry', position: 'insideTopRight', fontSize: 9, fill: regimeColor }}
                                />
                            )}

                            {/* Regime exit marker — only when period has ended */}
                            {snappedEnd && snappedEnd !== snapToNearest(data!.windowEnd, chartData) && (
                                <ReferenceLine
                                    x={snappedEnd}
                                    stroke={regimeColor}
                                    strokeWidth={1.5}
                                    strokeDasharray="4 3"
                                    label={{ value: 'Exit', position: 'insideTopRight', fontSize: 9, fill: regimeColor }}
                                />
                            )}

                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                                tickFormatter={tickFormatter}
                                interval={Math.floor(chartData.length / 8)}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}
                                width={40}
                                tickLine={false}
                                axisLine={false}
                                domain={['auto', 'auto']}
                            />
                            <Tooltip content={<CustomTooltip />} />

                            <Line
                                type="monotone"
                                dataKey={view}
                                stroke={view === 'spx' ? '#f59e0b' : '#60a5fa'}
                                strokeWidth={1.5}
                                dot={false}
                                connectNulls
                                activeDot={{ r: 3, fill: view === 'spx' ? '#f59e0b' : '#60a5fa' }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
