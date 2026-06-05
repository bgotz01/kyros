'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DataPoint {
    date: string;
    liquidityShock: number;
    crisis: number;
    bondStress: number;
    overvaluation: number;
    broadGrowth: number;
    longDuration: number;
}

type RegimeKey = keyof Omit<DataPoint, 'date'>;
type CategoryFilter = 'all' | 'buy' | 'sell';

interface RegimeConfig {
    key: RegimeKey;
    label: string;
    color: string;
    category: 'buy' | 'sell';
}

// ─── Config ───────────────────────────────────────────────────────────────────

const REGIMES: RegimeConfig[] = [
    { key: 'broadGrowth', label: 'Broad Growth', color: '#22c55e', category: 'buy' },
    { key: 'longDuration', label: 'Long Duration', color: '#3b82f6', category: 'buy' },
    { key: 'liquidityShock', label: 'Liquidity Shock', color: '#a855f7', category: 'buy' },
    { key: 'crisis', label: 'Crisis', color: '#991b1b', category: 'sell' },
    { key: 'bondStress', label: 'Bond Stress', color: '#ea580c', category: 'sell' },
    { key: 'overvaluation', label: 'Overvaluation', color: '#eab308', category: 'sell' },
];

const BUY_KEYS: RegimeKey[] = ['broadGrowth', 'longDuration', 'liquidityShock'];
const SELL_KEYS: RegimeKey[] = ['crisis', 'bondStress', 'overvaluation'];

const DATE_PRESETS = [
    { label: 'All Time', value: 'all' },
    { label: '1960s', value: '1960s', start: '1960-01-01', end: '1969-12-31' },
    { label: '1970s', value: '1970s', start: '1970-01-01', end: '1979-12-31' },
    { label: '1980s', value: '1980s', start: '1980-01-01', end: '1989-12-31' },
    { label: '1990s', value: '1990s', start: '1990-01-01', end: '1999-12-31' },
    { label: '2000s', value: '2000s', start: '2000-01-01', end: '2009-12-31' },
    { label: '2010s', value: '2010s', start: '2010-01-01', end: '2019-12-31' },
    { label: '2020s', value: '2020s', start: '2020-01-01', end: '2029-12-31' },
    { label: 'Last 5Y', value: '5y' },
    { label: 'Last 10Y', value: '10y' },
    { label: 'Last 20Y', value: '20y' },
    { label: 'Custom', value: 'custom' },
] as const;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RegimeProximityChart({ height = 380 }: { height?: number }) {
    const [raw, setRaw] = useState<DataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [datePreset, setDatePreset] = useState('10y');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [category, setCategory] = useState<CategoryFilter>('all');
    const [visible, setVisible] = useState<Set<RegimeKey>>(new Set(REGIMES.map(r => r.key)));

    const dataRange = useMemo(() => {
        if (!raw.length) return { min: '1960-01-01', max: '2029-12-31' };
        return { min: raw[0].date, max: raw[raw.length - 1].date };
    }, [raw]);

    useEffect(() => {
        if (raw.length && !customStart && !customEnd) {
            const end = raw[raw.length - 1].date;
            const s = new Date(end);
            s.setFullYear(s.getFullYear() - 5);
            setCustomStart(s.toISOString().split('T')[0]);
            setCustomEnd(end);
        }
    }, [raw, customStart, customEnd]);

    const handleSetCategory = useCallback((c: CategoryFilter) => {
        setCategory(c);
        if (c === 'all') setVisible(new Set(REGIMES.map(r => r.key)));
        if (c === 'buy') setVisible(new Set(BUY_KEYS));
        if (c === 'sell') setVisible(new Set(SELL_KEYS));
    }, []);

    const toggle = useCallback((key: RegimeKey) => {
        setVisible(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            const hasAll = REGIMES.every(r => next.has(r.key));
            const hasBuy = BUY_KEYS.every(k => next.has(k)) && SELL_KEYS.every(k => !next.has(k));
            const hasSell = SELL_KEYS.every(k => next.has(k)) && BUY_KEYS.every(k => !next.has(k));
            setCategory(hasAll ? 'all' : hasBuy ? 'buy' : hasSell ? 'sell' : 'all');
            return next;
        });
    }, []);

    useEffect(() => {
        fetch('/api/regime/proximity-history')
            .then(r => r.json())
            .then(json => setRaw(json.data ?? []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        if (!raw.length) return [];
        if (datePreset === 'all') return raw;
        if (datePreset === 'custom') {
            if (!customStart || !customEnd) return raw;
            return raw.filter(d => d.date >= customStart && d.date <= customEnd);
        }
        const preset = DATE_PRESETS.find(p => p.value === datePreset);
        if (preset && 'start' in preset) {
            return raw.filter(d => d.date >= preset.start && d.date <= preset.end);
        }
        const years = datePreset === '5y' ? 5 : datePreset === '10y' ? 10 : 20;
        const cutoff = new Date();
        cutoff.setFullYear(cutoff.getFullYear() - years);
        return raw.filter(d => d.date >= cutoff.toISOString().split('T')[0]);
    }, [raw, datePreset, customStart, customEnd]);

    const yearlyTicks = useMemo(() => {
        if (!filtered.length) return [];
        const firstYr = parseInt(filtered[0].date.split('-')[0]);
        const lastYr = parseInt(filtered[filtered.length - 1].date.split('-')[0]);
        const span = lastYr - firstYr;
        const step = span > 30 ? 10 : span > 15 ? 5 : span > 8 ? 2 : 1;
        return filtered
            .filter((d, i) => {
                const yr = parseInt(d.date.split('-')[0]);
                const prev = i > 0 ? parseInt(filtered[i - 1].date.split('-')[0]) : null;
                return yr !== prev && yr % step === 0;
            })
            .map(d => d.date);
    }, [filtered]);

    const visibleRegimes = useMemo(() => REGIMES.filter(r => visible.has(r.key)), [visible]);

    const tooltipContent = useCallback(({ active, payload }: any) => {
        if (!active || !payload?.length) return null;
        const d = payload[0].payload as DataPoint;
        const [y, m] = d.date.split('-').map(Number);
        const dateStr = new Date(y, m - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        const buyItems = REGIMES.filter(r => r.category === 'buy' && visible.has(r.key)).map(r => ({ ...r, value: d[r.key] }));
        const sellItems = REGIMES.filter(r => r.category === 'sell' && visible.has(r.key)).map(r => ({ ...r, value: d[r.key] }));

        const renderGroup = (items: typeof buyItems, label: string, labelColor: string) =>
            items.length > 0 ? (
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: labelColor }}>{label}</p>
                    {items.sort((a, b) => b.value - a.value).map(r => (
                        <div key={r.key} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                                <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                            </div>
                            <span className="font-mono font-semibold" style={{ color: r.value >= 100 ? r.color : 'var(--text-secondary)' }}>
                                {r.value}%
                            </span>
                        </div>
                    ))}
                </div>
            ) : null;

        return (
            <div className="border rounded-sm p-3 shadow-lg text-xs space-y-2 min-w-[170px]"
                style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--surface-border)', color: 'var(--text-primary)' }}>
                <p className="font-semibold text-sm">{dateStr}</p>
                {renderGroup(buyItems, 'Buy', '#22c55e')}
                {renderGroup(sellItems, 'Sell', '#ef4444')}
            </div>
        );
    }, [visible]);

    if (loading) return (
        <div className="border rounded-sm p-6 text-center text-[11px] uppercase tracking-widest"
            style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}>
            Loading proximity history…
        </div>
    );

    return (
        <div className="border rounded-sm p-4" style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-raised)' }}>
            {/* Header */}
            <div className="mb-4">
                <div className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: 'var(--accent)' }}>Regime Proximity</div>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    How close each regime&apos;s entry conditions were to triggering, per month (0–100%)
                </p>
            </div>

            {/* Date presets */}
            <div className="flex flex-wrap gap-1 mb-3">
                {DATE_PRESETS.map(p => (
                    <button key={p.value} onClick={() => setDatePreset(p.value)}
                        className="px-2 py-0.5 text-[10px] uppercase tracking-wider border rounded-sm"
                        style={datePreset === p.value
                            ? { borderColor: 'var(--accent)', color: 'var(--accent)', backgroundColor: 'var(--accent-dim)' }
                            : { borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }
                        }>
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Custom date inputs */}
            {datePreset === 'custom' && (
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>From</label>
                        <input type="date" value={customStart} max={customEnd || undefined}
                            onChange={e => setCustomStart(e.target.value)}
                            className="px-2 py-1 rounded-sm border text-xs"
                            style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }} />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>To</label>
                        <input type="date" value={customEnd} min={customStart || undefined}
                            onChange={e => setCustomEnd(e.target.value)}
                            className="px-2 py-1 rounded-sm border text-xs"
                            style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }} />
                    </div>
                </div>
            )}

            {/* Category + individual toggles */}
            <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                    {([
                        { value: 'all', label: 'All' },
                        { value: 'buy', label: '↑ Buy' },
                        { value: 'sell', label: '↓ Sell' },
                    ] as { value: CategoryFilter; label: string }[]).map(opt => (
                        <button key={opt.value} onClick={() => handleSetCategory(opt.value)}
                            className="px-2 py-0.5 text-[10px] uppercase tracking-wider border rounded-sm"
                            style={category === opt.value
                                ? { borderColor: 'var(--accent)', color: 'var(--accent)', backgroundColor: 'var(--accent-dim)' }
                                : { borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }
                            }>
                            {opt.label}
                        </button>
                    ))}
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>— click regimes to toggle individually</span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {(['buy', 'sell'] as const).map(cat => {
                        const group = REGIMES.filter(r => r.category === cat);
                        return (
                            <div key={cat} className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-semibold uppercase tracking-wider"
                                    style={{ color: cat === 'buy' ? '#22c55e' : '#ef4444' }}>
                                    {cat === 'buy' ? '↑' : '↓'}
                                </span>
                                {group.map(r => {
                                    const active = visible.has(r.key);
                                    return (
                                        <button key={r.key} onClick={() => toggle(r.key)}
                                            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-[10px] border transition-all"
                                            style={{
                                                backgroundColor: active ? r.color : 'transparent',
                                                color: active ? '#fff' : 'var(--text-muted)',
                                                borderColor: active ? r.color : 'var(--surface-border)',
                                            }}>
                                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: active ? '#fff' : r.color }} />
                                            {r.label}
                                        </button>
                                    );
                                })}
                                {cat === 'buy' && <div className="w-px h-4 self-center" style={{ backgroundColor: 'var(--surface-border)' }} />}
                            </div>
                        );
                    })}
                </div>
            </div>

            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={filtered} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="date" ticks={yearlyTicks} tickFormatter={d => d.split('-')[0]}
                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`}
                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip content={tooltipContent} />
                    <ReferenceLine y={100} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 2" />
                    {visibleRegimes.map(r => (
                        <Line key={r.key} type="monotone" dataKey={r.key} stroke={r.color}
                            strokeWidth={1.5} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} isAnimationActive={false} />
                    ))}
                </LineChart>
            </ResponsiveContainer>

            {/* Legend */}
            {visibleRegimes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
                    {(['buy', 'sell'] as const).map(cat => {
                        const group = visibleRegimes.filter(r => r.category === cat);
                        if (!group.length) return null;
                        const latest = filtered[filtered.length - 1];
                        return (
                            <div key={cat} className="flex items-center gap-3 flex-wrap">
                                <span className="text-[10px] font-semibold uppercase tracking-wider"
                                    style={{ color: cat === 'buy' ? '#22c55e' : '#ef4444' }}>
                                    {cat === 'buy' ? '↑ Buy' : '↓ Sell'}
                                </span>
                                {group.map(r => {
                                    const val = latest ? latest[r.key] : null;
                                    return (
                                        <div key={r.key} className="flex items-center gap-1.5 text-[11px]">
                                            <span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: r.color }} />
                                            <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                                            {val !== null && (
                                                <span className="font-mono font-medium"
                                                    style={{ color: val >= 100 ? r.color : 'var(--text-secondary)' }}>
                                                    {val}%
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
