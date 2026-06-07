'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import StockSubNavbar from '@/app/components/stocks/StockSubNavbar';
import StockProfileBox from '@/app/components/stocks/StockProfileBox';
import type { StockProfile, LatestPrice, TTMData } from '@/app/lib/queries/stocks';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PriceRow {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: string;
    ma20: number | null;
    ma50: number | null;
    ma100: number | null;
    ma200: number | null;
    ma500: number | null;
    rsi14: number | null;
    ratioSpy: number | null;
    ratioQqq: number | null;
}

interface Props {
    symbol: string;
    profile: StockProfile;
    latestPrice: LatestPrice;
    ttm: TTMData;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const RANGES = [
    { label: '1Y', value: '1y' },
    { label: '2Y', value: '2y' },
    { label: '5Y', value: '5y' },
    { label: '10Y', value: '10y' },
    { label: 'Max', value: 'max' },
];

const MA_CONFIGS = [
    { key: 'ma20', label: '20D', color: '#34d399', dash: '4 2' },
    { key: 'ma50', label: '50D', color: '#22d3ee', dash: '6 2' },
    { key: 'ma100', label: '100D', color: '#a78bfa', dash: '6 2' },
    { key: 'ma200', label: '200D', color: '#f59e0b', dash: '4 2' },
    { key: 'ma500', label: '500D', color: '#f87171', dash: '3 3' },
] as const;

const ACCENT = '#B58B4A';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number) {
    if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return v.toFixed(2);
}

function yearlyTicks(data: PriceRow[]): string[] {
    if (!data.length) return [];
    const seen = new Set<string>();
    return data.reduce<string[]>((acc, r) => {
        const yr = r.date.slice(0, 4);
        if (!seen.has(yr)) { seen.add(yr); acc.push(r.date); }
        return acc;
    }, []);
}

// ─── Tooltips ─────────────────────────────────────────────────────────────────

function PriceTooltip({ active, payload, label, activeMAs }: {
    active?: boolean; payload?: any[]; label?: string; activeMAs: Set<string>;
}) {
    if (!active || !payload?.length || !label) return null;
    const [y, m, d] = label.split('-').map(Number);
    const dateStr = new Date(y, m - 1, d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const row: PriceRow = payload[0]?.payload;
    if (!row) return null;
    const change = row.open > 0 ? ((row.close - row.open) / row.open) * 100 : null;

    return (
        <div className="border rounded-sm p-3 text-xs shadow-lg space-y-1 min-w-[170px]"
            style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--surface-border)' }}>
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{dateStr}</p>
            <div className="flex items-center justify-between gap-4">
                <span style={{ color: 'var(--text-muted)' }}>Close</span>
                <span className="tabular-nums font-semibold" style={{
                    color: change !== null ? (change >= 0 ? '#4ade80' : '#f87171') : 'var(--text-primary)'
                }}>
                    ${row.close.toFixed(2)}
                    {change !== null && <span className="text-[9px] ml-1">({change >= 0 ? '+' : ''}{change.toFixed(2)}%)</span>}
                </span>
            </div>
            <div className="flex items-center justify-between gap-4">
                <span style={{ color: 'var(--text-muted)' }}>H / L</span>
                <span className="tabular-nums text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    {row.high.toFixed(2)} / {row.low.toFixed(2)}
                </span>
            </div>
            <div className="flex items-center justify-between gap-4">
                <span style={{ color: 'var(--text-muted)' }}>Vol</span>
                <span className="tabular-nums text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    {fmt(Number(row.volume))}
                </span>
            </div>
            {row.rsi14 !== null && (
                <div className="flex items-center justify-between gap-4 pt-1 border-t"
                    style={{ borderColor: 'var(--surface-border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>RSI</span>
                    <span className="tabular-nums" style={{
                        color: row.rsi14 >= 70 ? '#f87171' : row.rsi14 <= 30 ? '#4ade80' : 'var(--text-secondary)'
                    }}>{row.rsi14.toFixed(1)}</span>
                </div>
            )}
            {MA_CONFIGS.filter(ma => activeMAs.has(ma.key)).map(ma => {
                const v = row[ma.key];
                if (v == null) return null;
                const div = (row.close - v) / v * 100;
                return (
                    <div key={ma.key} className="flex items-center justify-between gap-4">
                        <span style={{ color: ma.color }}>{ma.label}</span>
                        <span className="tabular-nums text-[10px]" style={{ color: ma.color }}>
                            {v.toFixed(2)} <span style={{ color: div >= 0 ? '#4ade80' : '#f87171' }}>({div >= 0 ? '+' : ''}{div.toFixed(1)}%)</span>
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

function VolumeTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
    if (!active || !payload?.length || !label) return null;
    const vol = payload[0]?.value;
    if (!vol) return null;
    const [y, m, d] = label.split('-').map(Number);
    const dateStr = new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return (
        <div className="border rounded-sm px-3 py-2 text-xs shadow-lg"
            style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--surface-border)' }}>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{dateStr}</p>
            <p className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>{fmt(Number(vol))}</p>
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatItem({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span className="text-[12px] font-semibold tabular-nums" style={{ color: color ?? 'var(--text-primary)' }}>{value}</span>
        </div>
    );
}

function RsiChart({ data, ticks }: { data: PriceRow[]; ticks: string[] }) {
    return (
        <div className="border rounded-sm p-4" style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-raised)' }}>
            <div className="text-[9px] uppercase tracking-[0.3em] mb-3" style={{ color: 'var(--accent)' }}>RSI · 14</div>
            <ResponsiveContainer width="100%" height={100}>
                <ComposedChart data={data} margin={{ top: 2, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="date" ticks={ticks} tickFormatter={v => v.slice(0, 4)}
                        tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} ticks={[30, 50, 70]}
                        tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={24} />
                    <ReferenceLine y={70} stroke="rgba(239,68,68,0.35)" strokeDasharray="3 3" />
                    <ReferenceLine y={50} stroke="rgba(255,255,255,0.08)" />
                    <ReferenceLine y={30} stroke="rgba(74,222,128,0.35)" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="rsi14" stroke="#a78bfa"
                        strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChartClient({ symbol, profile, latestPrice, ttm }: Props) {
    const [range, setRange] = useState('2y');
    const [data, setData] = useState<PriceRow[]>([]);
    // initialLoad = true only until the very first fetch completes
    const [initialLoad, setInitialLoad] = useState(true);
    // fetching = true on every fetch, but doesn't unmount the chart
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeMAs, setActiveMAs] = useState<Set<string>>(new Set(['ma50', 'ma200']));
    const [showVolume, setShowVolume] = useState(true);
    const [showRsi, setShowRsi] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setFetching(true);
        setError(null);

        fetch(`/api/stocks/chart?symbol=${symbol}&range=${range}`)
            .then(r => r.json())
            .then(json => {
                if (!cancelled) setData(json.data ?? []);
            })
            .catch(() => { if (!cancelled) setError('Failed to load chart data'); })
            .finally(() => {
                if (!cancelled) {
                    setFetching(false);
                    setInitialLoad(false);
                }
            });

        return () => { cancelled = true; };
    }, [symbol, range]);

    const toggleMA = (key: string) => setActiveMAs(prev => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
    });

    const ticks = useMemo(() => yearlyTicks(data), [data]);

    const priceTooltip = useCallback(
        (props: any) => <PriceTooltip {...props} activeMAs={activeMAs} />,
        [activeMAs],
    );
    const volumeTooltip = useCallback((props: any) => <VolumeTooltip {...props} />, []);

    const stats = useMemo(() => {
        if (!data.length) return null;
        const closes = data.map(r => r.close);
        const high = Math.max(...closes);
        const low = Math.min(...closes);
        const pct = ((data[data.length - 1].close - data[0].close) / data[0].close) * 100;
        const latest = data[data.length - 1];
        return { high, low, pct, latest };
    }, [data]);

    return (
        <main style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}>
            <div className="fixed inset-0 pointer-events-none" style={{ background: 'var(--bg-glow)' }} />
            <div className="relative">
                <StockSubNavbar symbol={symbol} />
                <section className="mx-auto max-w-7xl px-6 py-8 space-y-5">

                    <StockProfileBox symbol={symbol} profile={profile} latest={latestPrice} ttm={ttm} />

                    {/* ── Controls bar ── */}
                    <div className="flex flex-wrap items-center gap-3 border-b pb-4"
                        style={{ borderColor: 'var(--surface-border)' }}>

                        {/* Range selector */}
                        <div className="flex border rounded-sm overflow-hidden"
                            style={{ borderColor: 'var(--surface-border)' }}>
                            {RANGES.map(r => (
                                <button key={r.value} onClick={() => setRange(r.value)}
                                    className="px-3 py-1 text-[10px] uppercase tracking-wider transition-colors"
                                    style={range === r.value
                                        ? { backgroundColor: ACCENT, color: 'var(--surface)' }
                                        : { backgroundColor: 'transparent', color: 'var(--text-muted)' }}>
                                    {r.label}
                                </button>
                            ))}
                        </div>

                        {/* MA toggles */}
                        <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[9px] uppercase tracking-[0.2em] mr-0.5"
                                style={{ color: 'var(--text-muted)' }}>MA</span>
                            {MA_CONFIGS.map(ma => (
                                <button key={ma.key} onClick={() => toggleMA(ma.key)}
                                    className="px-2 py-0.5 text-[10px] border rounded-sm transition-all"
                                    style={activeMAs.has(ma.key)
                                        ? { borderColor: ma.color, backgroundColor: ma.color + '20', color: ma.color }
                                        : { borderColor: 'var(--surface-border)', color: 'var(--text-muted)', backgroundColor: 'transparent' }}>
                                    {ma.label}
                                </button>
                            ))}
                        </div>

                        {/* Vol / RSI toggles */}
                        <div className="flex gap-1 ml-auto">
                            {[
                                { label: 'Vol', active: showVolume, toggle: () => setShowVolume(v => !v) },
                                { label: 'RSI', active: showRsi, toggle: () => setShowRsi(v => !v) },
                            ].map(({ label, active, toggle }) => (
                                <button key={label} onClick={toggle}
                                    className="px-2.5 py-0.5 text-[10px] border rounded-sm transition-all"
                                    style={active
                                        ? { borderColor: ACCENT, backgroundColor: ACCENT + '20', color: ACCENT }
                                        : { borderColor: 'var(--surface-border)', color: 'var(--text-muted)', backgroundColor: 'transparent' }}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── First-load spinner (only shown before any data) ── */}
                    {initialLoad && (
                        <div className="border rounded-sm p-12 flex items-center justify-center"
                            style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-raised)' }}>
                            <span className="text-[11px] uppercase tracking-widest animate-pulse"
                                style={{ color: 'var(--text-muted)' }}>Loading chart…</span>
                        </div>
                    )}

                    {error && (
                        <div className="border rounded-sm p-4 text-[11px]"
                            style={{ borderColor: '#ef444440', color: '#ef4444' }}>{error}</div>
                    )}

                    {/* ── Stats strip ── */}
                    {stats && (
                        <div className="flex flex-wrap gap-6 px-1 transition-opacity"
                            style={{ opacity: fetching ? 0.5 : 1 }}>
                            <StatItem label="Range High" value={`$${stats.high.toFixed(2)}`} />
                            <StatItem label="Range Low" value={`$${stats.low.toFixed(2)}`} />
                            <StatItem
                                label={`${range.toUpperCase()} Return`}
                                value={`${stats.pct >= 0 ? '+' : ''}${stats.pct.toFixed(2)}%`}
                                color={stats.pct >= 0 ? '#4ade80' : '#f87171'} />
                            {stats.latest.rsi14 !== null && (
                                <StatItem label="RSI 14" value={stats.latest.rsi14.toFixed(1)}
                                    color={stats.latest.rsi14 >= 70 ? '#f87171' : stats.latest.rsi14 <= 30 ? '#4ade80' : 'var(--text-secondary)'} />
                            )}
                            {stats.latest.ratioSpy !== null && (
                                <StatItem label="vs SPY"
                                    value={`${((stats.latest.ratioSpy - 1) * 100).toFixed(1)}%`}
                                    color={stats.latest.ratioSpy >= 1 ? '#4ade80' : '#f87171'} />
                            )}
                            {stats.latest.ratioQqq !== null && (
                                <StatItem label="vs QQQ"
                                    value={`${((stats.latest.ratioQqq - 1) * 100).toFixed(1)}%`}
                                    color={stats.latest.ratioQqq >= 1 ? '#4ade80' : '#f87171'} />
                            )}
                        </div>
                    )}

                    {/* ── Charts — stay mounted, fade during fetch ── */}
                    {data.length > 0 && (
                        <div className="space-y-5 transition-opacity"
                            style={{ opacity: fetching ? 0.45 : 1 }}>

                            {/* Price chart */}
                            <div className="border rounded-sm p-4 space-y-4"
                                style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-raised)' }}>
                                <div className="text-[9px] uppercase tracking-[0.3em]" style={{ color: 'var(--accent)' }}>
                                    {symbol} · Price
                                </div>
                                <ResponsiveContainer width="100%" height={400}>
                                    <ComposedChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="date" ticks={ticks} tickFormatter={v => v.slice(0, 4)}
                                            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                                            axisLine={false} tickLine={false} />
                                        <YAxis domain={['auto', 'auto']}
                                            tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`}
                                            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                                            axisLine={false} tickLine={false} width={44} />
                                        <Tooltip content={priceTooltip} />
                                        <Line type="monotone" dataKey="close"
                                            stroke={ACCENT} strokeWidth={1.5}
                                            dot={false} name="Close"
                                            isAnimationActive={false} connectNulls />
                                        {MA_CONFIGS.filter(ma => activeMAs.has(ma.key)).map(ma => (
                                            <Line key={ma.key} type="monotone" dataKey={ma.key}
                                                stroke={ma.color} strokeWidth={1.5}
                                                strokeDasharray={ma.dash} dot={false}
                                                name={ma.label} isAnimationActive={false} connectNulls />
                                        ))}
                                    </ComposedChart>
                                </ResponsiveContainer>

                                {/* Legend */}
                                <div className="flex flex-wrap gap-4 pt-3 border-t"
                                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-4 h-0.5 rounded-full" style={{ backgroundColor: ACCENT }} />
                                        <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Close</span>
                                    </div>
                                    {MA_CONFIGS.filter(ma => activeMAs.has(ma.key)).map(ma => (
                                        <div key={ma.key} className="flex items-center gap-1.5">
                                            <span className="w-4 h-0.5 rounded-full" style={{ backgroundColor: ma.color }} />
                                            <span className="text-[10px]" style={{ color: ma.color }}>{ma.label} MA</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Volume chart */}
                            {showVolume && (
                                <div className="border rounded-sm p-4"
                                    style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-raised)' }}>
                                    <div className="text-[9px] uppercase tracking-[0.3em] mb-3" style={{ color: 'var(--accent)' }}>
                                        Volume
                                    </div>
                                    <ResponsiveContainer width="100%" height={120}>
                                        <ComposedChart data={data} margin={{ top: 2, right: 12, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                            <XAxis dataKey="date" ticks={ticks} tickFormatter={v => v.slice(0, 4)}
                                                tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                                                axisLine={false} tickLine={false} />
                                            <YAxis tickFormatter={v => fmt(v)}
                                                tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                                                axisLine={false} tickLine={false} width={36} />
                                            <Tooltip content={volumeTooltip} />
                                            <Bar dataKey="volume" fill={ACCENT + '40'} isAnimationActive={false} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* RSI chart */}
                            {showRsi && <RsiChart data={data} ticks={ticks} />}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
