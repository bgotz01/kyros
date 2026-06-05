'use client';

import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const SERIES = [
    { key: 'rey5yr', label: 'Real EY-5yr (REY)', color: '#0d9488' },
    { key: 'eyp5yr', label: 'EYP-5yr', color: '#a78bfa' },
    { key: 'realm2yoy', label: 'Real M2 YoY', color: '#eab308' },
    { key: 'realyield3m', label: 'Real 3M', color: '#0891b2' },
    { key: 'realyield', label: 'Real 10Y', color: '#22c55e' },
];

const currentYear = new Date().getFullYear();
const currentDecade = Math.floor(currentYear / 10) * 10;

const DATE_PRESETS = [
    { label: 'All', value: 'all' },
    { label: 'Last 5Y', value: '5y' },
    { label: 'Last 10Y', value: '10y' },
    // Every decade from 1960 to current
    ...Array.from(
        { length: (currentDecade - 1960) / 10 + 1 },
        (_, i) => {
            const decade = 1960 + i * 10;
            return {
                label: `${decade}s`,
                value: `${decade}s`,
                start: `${decade}-01-01`,
                end: `${decade + 9}-12-31`,
            };
        }
    ),
];

export default function RegimeParametersChart() {
    const [data, setData] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);
    const [metric, setMetric] = useState<'value' | 'percentile'>('value');
    const [selected, setSelected] = useState(['rey5yr']);
    const [preset, setPreset] = useState('all');

    useEffect(() => {
        fetch('/api/regime/percentile-history')
            .then(r => r.json()).then(j => setData(j.data ?? []))
            .catch(() => { }).finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        if (!data.length) return [];
        if (preset === 'all') return data;
        const p = DATE_PRESETS.find(x => x.value === preset) as any;
        if (p?.start) return data.filter((d: any) => d.date >= p.start && d.date <= p.end);
        // Last Ny presets
        const years = preset === '5y' ? 5 : 10;
        const cutoff = new Date(); cutoff.setFullYear(cutoff.getFullYear() - years);
        return data.filter((d: any) => d.date >= cutoff.toISOString().split('T')[0]);
    }, [data, preset]);

    const yearTicks = useMemo(() => {
        return filtered.filter((_, i) => {
            const y = parseInt((filtered[i] as any).date.split('-')[0]);
            const prev = i > 0 ? parseInt((filtered[i - 1] as any).date.split('-')[0]) : null;
            return y !== prev && y % 5 === 0;
        }).map((d: any) => d.date);
    }, [filtered]);

    const toggle = (k: string) => {
        setSelected(prev => prev.includes(k) ? (prev.length > 1 ? prev.filter(s => s !== k) : prev) : [...prev, k]);
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload?.length) return null;
        const d = payload[0].payload;
        const [y, m] = String(d.date).split('-').map(Number);
        const dateStr = new Date(y, m - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        return (
            <div className="border rounded-sm p-3 text-xs shadow-lg" style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--surface-border)', color: 'var(--text-primary)' }}>
                <p className="font-medium mb-1">{dateStr}</p>
                {selected.map(sv => {
                    const s = SERIES.find(x => x.key === sv);
                    const k = metric === 'percentile' ? `${sv}_percentile` : `${sv}_value`;
                    const val = d[k];
                    if (val == null) return null;
                    return (
                        <p key={sv} style={{ color: s?.color }}>
                            {s?.label}: {Number(val).toFixed(metric === 'percentile' ? 1 : 2)}{metric === 'percentile' ? 'th' : '%'}
                        </p>
                    );
                })}
            </div>
        );
    };

    if (loading) return (
        <div className="h-48 flex items-center justify-center">
            <span className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Loading chart…</span>
        </div>
    );

    return (
        <div className="border rounded-sm p-4" style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-raised)' }}>
            <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--accent)' }}>Regime Parameters</div>
                <div className="flex gap-1">
                    {(['value', 'percentile'] as const).map(m => (
                        <button key={m} onClick={() => setMetric(m)}
                            className="px-2 py-0.5 text-[10px] uppercase tracking-wider border rounded-sm"
                            style={metric === m
                                ? { borderColor: 'var(--accent)', color: 'var(--accent)', backgroundColor: 'var(--accent-dim)' }
                                : { borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }
                            }>
                            {m === 'value' ? 'Value' : 'Percentile'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Date presets */}
            <div className="flex flex-wrap gap-1 mb-3">
                {DATE_PRESETS.map(p => (
                    <button key={p.value} onClick={() => setPreset(p.value)}
                        className="px-2 py-0.5 text-[10px] uppercase tracking-wider border rounded-sm"
                        style={preset === p.value
                            ? { borderColor: 'var(--accent)', color: 'var(--accent)', backgroundColor: 'var(--accent-dim)' }
                            : { borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }
                        }>
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Series toggles */}
            <div className="flex flex-wrap gap-1 mb-4">
                {SERIES.map(s => (
                    <button key={s.key} onClick={() => toggle(s.key)}
                        className="px-2 py-0.5 rounded-sm text-[10px] border transition-opacity"
                        style={{ borderColor: s.color, color: s.color, opacity: selected.includes(s.key) ? 1 : 0.35 }}>
                        {s.label}
                    </button>
                ))}
            </div>

            <ResponsiveContainer width="100%" height={320}>
                <LineChart data={filtered} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="date" ticks={yearTicks} tickFormatter={v => v.split('-')[0]}
                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis domain={metric === 'percentile' ? [0, 100] : ['auto', 'auto']}
                        tickFormatter={v => metric === 'percentile' ? `${v}%` : `${v}`}
                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip content={<CustomTooltip />} />
                    {metric === 'percentile' && <>
                        <ReferenceLine y={25} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                        <ReferenceLine y={75} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                    </>}
                    <ReferenceLine y={0} stroke="rgba(239,68,68,0.6)" strokeDasharray="4 3" strokeWidth={1.5} />
                    {selected.map(sv => {
                        const s = SERIES.find(x => x.key === sv);
                        const k = metric === 'percentile' ? `${sv}_percentile` : `${sv}_value`;
                        return s ? (
                            <Line key={sv} type="monotone" dataKey={k} stroke={s.color} strokeWidth={1.5}
                                dot={false} name={s.label} connectNulls isAnimationActive={false} />
                        ) : null;
                    })}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
