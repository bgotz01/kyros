'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    ComposedChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DataPoint {
    date: string;
    divergence_value: number;
    divergence_percentile: number;
    days_above_value: number;
    days_above_percentile: number;
    slope_value: number;
    slope_percentile: number;
    ma50_200_value: number | null;
    ma50_200_percentile: number;
    trend_pressure_score?: number;
    score_ma20?: number;
    divergence_pct_ma20?: number;
    days_above_pct_ma20?: number;
    slope_pct_ma20?: number;
    ma50_200_pct_ma20?: number;
}

type ViewMode = 'percentile' | 'value';

interface MetricConfig {
    label: string;
    color: string;
    ma20Color: string;
    valueSuffix: string;
    percentileKey: keyof DataPoint;
    valueKey: keyof DataPoint;
    ma20Key: keyof DataPoint;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const METRICS: MetricConfig[] = [
    { label: 'Divergence', color: '#6366f1', ma20Color: '#a78bfa', valueSuffix: '%', percentileKey: 'divergence_percentile', valueKey: 'divergence_value', ma20Key: 'divergence_pct_ma20' },
    { label: 'Days Above MA', color: '#06b6d4', ma20Color: '#67e8f9', valueSuffix: ' days', percentileKey: 'days_above_percentile', valueKey: 'days_above_value', ma20Key: 'days_above_pct_ma20' },
    { label: 'MA Slope', color: '#22c55e', ma20Color: '#86efac', valueSuffix: '%', percentileKey: 'slope_percentile', valueKey: 'slope_value', ma20Key: 'slope_pct_ma20' },
    { label: '50/200 MA', color: '#f97316', ma20Color: '#fdba74', valueSuffix: '%', percentileKey: 'ma50_200_percentile', valueKey: 'ma50_200_value', ma20Key: 'ma50_200_pct_ma20' },
];

const SCORE_COLOR = '#B58B4A'; // panteon gold

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

// ─── Shared button style helpers ─────────────────────────────────────────────

function activeBtnStyle(active: boolean, activeColor?: string) {
    return active
        ? { borderColor: activeColor ?? 'var(--accent)', color: 'var(--accent)', backgroundColor: 'var(--accent-dim)' }
        : { borderColor: 'var(--surface-border)', color: 'var(--text-muted)', backgroundColor: 'transparent' };
}

function colorPillStyle(active: boolean, color: string) {
    return active
        ? { borderColor: color, backgroundColor: color, color: '#070605' }
        : { borderColor: 'var(--surface-border)', color: 'var(--text-muted)', backgroundColor: 'transparent' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="text-[9px] uppercase tracking-[0.35em] mb-3" style={{ color: 'var(--accent)' }}>
            {children}
        </div>
    );
}

function CollapsibleSection({ title, summary, children }: { title: string; summary?: string; children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="mb-3 border rounded-sm overflow-hidden" style={{ borderColor: 'var(--surface-border)' }}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2 transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--surface-raised)' }}
            >
                <span className="text-[9px] uppercase tracking-[0.3em]" style={{ color: 'var(--accent)' }}>{title}</span>
                <span className="flex items-center gap-2">
                    {!open && summary && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{summary}</span>}
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{open ? '▲' : '▼'}</span>
                </span>
            </button>
            {open && (
                <div className="px-3 py-3 space-y-3 border-t" style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)' }}>
                    {children}
                </div>
            )}
        </div>
    );
}

function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3">
            <span className="text-[9px] uppercase tracking-[0.2em] pt-1 w-16 shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
            <div className="flex items-center gap-1 flex-wrap">{children}</div>
        </div>
    );
}

function ToggleGroup<T extends string>({
    options, active, onChange,
}: { options: { label: string; value: T }[]; active: T; onChange: (v: T) => void }) {
    return (
        <div className="flex border rounded-sm overflow-hidden" style={{ borderColor: 'var(--surface-border)' }}>
            {options.map(o => (
                <button
                    type="button"
                    key={o.value}
                    onClick={() => onChange(o.value)}
                    className="px-3 py-1 text-[10px] uppercase tracking-wider transition-colors"
                    style={activeBtnStyle(active === o.value)}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

function PillButton({ label, active, color, onClick }: { label: string; active: boolean; color?: string; onClick: () => void }) {
    const style = color
        ? colorPillStyle(active, color)
        : activeBtnStyle(active);
    return (
        <button
            type="button"
            onClick={onClick}
            className="px-2 py-0.5 rounded-sm text-[10px] border transition-opacity"
            style={style}
        >
            {label}
        </button>
    );
}

// ─── Date Preset Selector ────────────────────────────────────────────────────

function DatePresetSelector({ datePreset, setDatePreset }: {
    datePreset: string;
    setDatePreset: (v: string) => void;
}) {
    const selected = DATE_PRESETS.find(p => p.value === datePreset);
    const [open, setOpen] = useState(false);
    return (
        <div className="mb-4">
            {/* Mobile: collapsible */}
            <div className="sm:hidden border rounded-sm overflow-hidden" style={{ borderColor: 'var(--surface-border)' }}>
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    className="w-full flex items-center justify-between px-3 py-2"
                    style={{ backgroundColor: 'var(--surface-raised)' }}
                >
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        Range: {selected?.label}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{open ? '▲' : '▼'}</span>
                </button>
                {open && (
                    <div className="grid grid-cols-3 gap-1.5 p-2 border-t" style={{ borderColor: 'var(--surface-border)' }}>
                        {DATE_PRESETS.map(p => (
                            <button
                                type="button"
                                key={p.value}
                                onClick={() => { setDatePreset(p.value); setOpen(false); }}
                                className="px-2 py-1.5 text-[10px] uppercase tracking-wider border rounded-sm"
                                style={activeBtnStyle(datePreset === p.value)}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {/* Desktop: inline */}
            <div className="hidden sm:flex flex-wrap gap-1">
                {DATE_PRESETS.map(p => (
                    <button
                        type="button"
                        key={p.value}
                        onClick={() => setDatePreset(p.value)}
                        className="px-2 py-0.5 text-[10px] uppercase tracking-wider border rounded-sm transition-colors"
                        style={activeBtnStyle(datePreset === p.value)}
                    >
                        {p.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TrendPressureChart({ height = 400 }: { height?: number }) {
    const [raw, setRaw] = useState<DataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);

    const [ma, setMa] = useState<'200' | '500' | 'blend'>('200');
    const [index, setIndex] = useState<'sp500' | 'ndx'>('sp500');
    const [viewMode, setViewMode] = useState<ViewMode>('percentile');

    const [datePreset, setDatePreset] = useState('10y');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [appliedStart, setAppliedStart] = useState('');
    const [appliedEnd, setAppliedEnd] = useState('');

    const [showScore, setShowScore] = useState(true);
    const [showScoreMA20, setShowScoreMA20] = useState(false);
    const [scoreMetrics, setScoreMetrics] = useState<Set<string>>(
        new Set(METRICS.map(m => m.percentileKey as string)),
    );
    const [visibleMetrics, setVisibleMetrics] = useState<Set<string>>(new Set<string>());
    const [visibleMA20s, setVisibleMA20s] = useState<Set<string>>(new Set<string>());

    // ── Data fetch ───────────────────────────────────────────────────────────
    useEffect(() => {
        const isFirst = raw.length === 0;
        if (isFirst) setLoading(true); else setFetching(true);

        const fetchMA = (m: '200' | '500') =>
            fetch(`/api/trend-pressure-history?ma=${m}&index=${index}`)
                .then(r => r.json())
                .then(json => (json.data || []) as DataPoint[]);

        const promise = ma === 'blend'
            ? Promise.all([fetchMA('200'), fetchMA('500')]).then(([d200, d500]) => {
                const map500 = new Map(d500.map(d => [d.date, d]));
                return d200
                    .map(a => {
                        const b = map500.get(a.date);
                        if (!b) return null;
                        return {
                            ...a,
                            divergence_value: (a.divergence_value + b.divergence_value) / 2,
                            divergence_percentile: (a.divergence_percentile + b.divergence_percentile) / 2,
                            days_above_value: (a.days_above_value + b.days_above_value) / 2,
                            days_above_percentile: (a.days_above_percentile + b.days_above_percentile) / 2,
                            slope_value: (a.slope_value + b.slope_value) / 2,
                            slope_percentile: (a.slope_percentile + b.slope_percentile) / 2,
                            ma50_200_value: a.ma50_200_value != null && b.ma50_200_value != null
                                ? (a.ma50_200_value + b.ma50_200_value) / 2
                                : (a.ma50_200_value ?? b.ma50_200_value),
                            ma50_200_percentile: (a.ma50_200_percentile + b.ma50_200_percentile) / 2,
                        } as DataPoint;
                    })
                    .filter(Boolean)
                    .sort((a, b) => a!.date.localeCompare(b!.date)) as DataPoint[];
            })
            : fetchMA(ma);

        promise
            .then(d => setRaw(d))
            .catch(console.error)
            .finally(() => { setLoading(false); setFetching(false); });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ma, index]);

    // ── Derived data (20D MA + composite score) ───────────────────────────────
    const data = useMemo(() => {
        const withMA = raw.map((d, i) => {
            const win = raw.slice(Math.max(0, i - 19), i + 1);
            const ma20 = (key: keyof DataPoint) =>
                parseFloat((win.reduce((s, r) => s + (r[key] as number), 0) / win.length).toFixed(2));
            return {
                ...d,
                divergence_pct_ma20: ma20('divergence_percentile'),
                days_above_pct_ma20: ma20('days_above_percentile'),
                slope_pct_ma20: ma20('slope_percentile'),
                ma50_200_pct_ma20: ma20('ma50_200_percentile'),
            };
        });
        const active = METRICS.filter(m => scoreMetrics.has(m.percentileKey as string));
        if (!active.length) return withMA;
        const withScore = withMA.map(d => {
            const sum = active.reduce((acc, m) => acc + (d[m.percentileKey] as number), 0);
            return { ...d, trend_pressure_score: sum / active.length };
        });
        return withScore.map((d, i) => {
            const win = withScore.slice(Math.max(0, i - 19), i + 1);
            const avg = win.reduce((s, r) => s + (r.trend_pressure_score ?? 0), 0) / win.length;
            return { ...d, score_ma20: parseFloat(avg.toFixed(2)) };
        });
    }, [raw, scoreMetrics]);

    // ── Date filtering ────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        if (!data.length) return [];
        if (datePreset === 'all') return data;
        if (datePreset === 'custom') {
            if (!appliedStart || !appliedEnd) return data;
            return data.filter(d => d.date >= appliedStart && d.date <= appliedEnd);
        }
        const preset = DATE_PRESETS.find(p => p.value === datePreset);
        if (preset && 'start' in preset) {
            return data.filter(d => d.date >= (preset as any).start && d.date <= (preset as any).end);
        }
        const years = datePreset === '5y' ? 5 : datePreset === '10y' ? 10 : 20;
        const cutoff = new Date();
        cutoff.setFullYear(cutoff.getFullYear() - years);
        return data.filter(d => d.date >= cutoff.toISOString().split('T')[0]);
    }, [data, datePreset, appliedStart, appliedEnd]);

    // ── Yearly X-axis ticks ───────────────────────────────────────────────────
    const yearlyTicks = useMemo(() => {
        if (!filtered.length) return [];
        const firstYr = parseInt(filtered[0].date.split('-')[0]);
        const lastYr = parseInt(filtered[filtered.length - 1].date.split('-')[0]);
        const span = lastYr - firstYr;
        const step = span > 20 ? 5 : span > 8 ? 2 : 1;
        return filtered
            .filter((d, i) => {
                const yr = parseInt(d.date.split('-')[0]);
                const prev = i > 0 ? parseInt(filtered[i - 1].date.split('-')[0]) : null;
                return yr !== prev && yr % step === 0;
            })
            .map(d => d.date);
    }, [filtered]);

    // ── Toggles ───────────────────────────────────────────────────────────────
    const toggleScore = (key: string) => setScoreMetrics(prev => {
        const next = new Set(prev);
        if (next.has(key)) { if (next.size === 1) return prev; next.delete(key); } else next.add(key);
        return next;
    });
    const toggleVisible = (key: string) => setVisibleMetrics(prev => {
        const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next;
    });
    const toggleMA20 = (key: string) => setVisibleMA20s(prev => {
        const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next;
    });

    const latest = filtered[filtered.length - 1];

    // ── Tooltip ───────────────────────────────────────────────────────────────
    const tooltipContent = useCallback(({ active, payload }: any) => {
        if (!active || !payload?.length) return null;
        const d = payload[0].payload as DataPoint;
        const [y, m, dy] = d.date.split('-').map(Number);
        const dateStr = new Date(y, m - 1, dy).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        return (
            <div className="border rounded-sm p-3 text-xs shadow-lg space-y-1"
                style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--surface-border)', color: 'var(--text-primary)' }}>
                <p className="font-medium mb-1">{dateStr}</p>
                {showScore && (
                    <p style={{ color: SCORE_COLOR }}>Score: {d.trend_pressure_score?.toFixed(1)}</p>
                )}
                {viewMode === 'percentile' && showScoreMA20 && d.score_ma20 != null && (
                    <p style={{ color: '#C9A455' }}>Score 20D MA: {d.score_ma20.toFixed(1)}</p>
                )}
                {METRICS.filter(m => visibleMetrics.has(m.percentileKey as string)).map(m => {
                    const key = viewMode === 'percentile' ? m.percentileKey : m.valueKey;
                    const val = d[key] as number;
                    const actualVal = d[m.valueKey] as number;
                    return (
                        <p key={m.label} style={{ color: m.color }}>
                            {m.label}: {val?.toFixed(1)}{viewMode === 'percentile' ? '' : m.valueSuffix}
                            {viewMode === 'percentile' && actualVal != null && (
                                <span style={{ color: 'var(--text-muted)' }} className="ml-1">
                                    ({actualVal.toFixed(m.valueSuffix === ' days' ? 0 : 2)}{m.valueSuffix})
                                </span>
                            )}
                        </p>
                    );
                })}
                {viewMode === 'percentile' && METRICS.filter(m => visibleMA20s.has(m.ma20Key as string)).map(m => {
                    const val = d[m.ma20Key] as number;
                    return val != null ? (
                        <p key={`${m.label}-ma20`} style={{ color: m.ma20Color }}>
                            {m.label} 20D MA: {val.toFixed(1)}
                        </p>
                    ) : null;
                })}
            </div>
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showScore, showScoreMA20, viewMode, visibleMetrics, visibleMA20s]);

    // ── Loading state ─────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="border rounded-sm p-8 flex items-center justify-center"
                style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-raised)' }}>
                <span className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    Loading chart…
                </span>
            </div>
        );
    }

    const maLabel = ma === 'blend' ? '200MA + 500MA blended' : `${ma}MA`;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="border rounded-sm p-4"
            style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-raised)' }}>

            {/* Controls */}
            <CollapsibleSection
                title="Controls"
                summary={`${viewMode === 'percentile' ? '%ile' : 'Val'} · ${ma === 'blend' ? 'Mix' : ma} · ${index === 'sp500' ? 'S&P' : 'NDX'}`}
            >
                <ControlRow label="View">
                    <ToggleGroup
                        options={[{ label: '%ile', value: 'percentile' }, { label: 'Val', value: 'value' }]}
                        active={viewMode}
                        onChange={setViewMode}
                    />
                </ControlRow>
                <ControlRow label="MA">
                    <ToggleGroup
                        options={[{ label: '200', value: '200' }, { label: '500', value: '500' }, { label: 'Mix', value: 'blend' }]}
                        active={ma}
                        onChange={setMa}
                    />
                </ControlRow>
                <ControlRow label="Index">
                    <ToggleGroup
                        options={[{ label: 'S&P', value: 'sp500' }, { label: 'NDX', value: 'ndx' }]}
                        active={index}
                        onChange={setIndex}
                    />
                </ControlRow>
                <ControlRow label="Lines">
                    <PillButton
                        label={viewMode === 'value' ? 'Score %ile →' : 'Score'}
                        active={showScore}
                        color={SCORE_COLOR}
                        onClick={() => setShowScore(s => !s)}
                    />
                    {METRICS.map(m => (
                        <PillButton
                            key={m.label}
                            label={m.label}
                            active={visibleMetrics.has(m.percentileKey as string)}
                            color={m.color}
                            onClick={() => toggleVisible(m.percentileKey as string)}
                        />
                    ))}
                </ControlRow>
            </CollapsibleSection>

            {/* Advanced: In Score + 20D MA — percentile mode only */}
            {viewMode === 'percentile' && (
                <CollapsibleSection title="Advanced · In Score &amp; 20D MA">
                    <ControlRow label="In Score">
                        {METRICS.map(m => {
                            const active = scoreMetrics.has(m.percentileKey as string);
                            return (
                                <button
                                    type="button"
                                    key={m.label}
                                    onClick={() => toggleScore(m.percentileKey as string)}
                                    className="px-2 py-0.5 rounded-sm text-[10px] border-2 transition-opacity"
                                    style={{
                                        borderColor: active ? SCORE_COLOR : 'rgba(181,139,74,0.2)',
                                        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                                        backgroundColor: 'transparent',
                                    }}
                                >
                                    {m.label}
                                </button>
                            );
                        })}
                    </ControlRow>
                    <ControlRow label="20D MA">
                        <PillButton
                            label="Score"
                            active={showScoreMA20}
                            color="#C9A455"
                            onClick={() => setShowScoreMA20(s => !s)}
                        />
                        {METRICS.map(m => (
                            <PillButton
                                key={`${m.label}-ma20`}
                                label={m.label}
                                active={visibleMA20s.has(m.ma20Key as string)}
                                color={m.ma20Color}
                                onClick={() => toggleMA20(m.ma20Key as string)}
                            />
                        ))}
                    </ControlRow>
                </CollapsibleSection>
            )}

            {/* Fetching indicator */}
            {fetching && (
                <p className="text-[10px] mb-2" style={{ color: 'var(--text-muted)' }}>updating…</p>
            )}

            {/* Date range */}
            <DatePresetSelector datePreset={datePreset} setDatePreset={setDatePreset} />

            {/* Custom date inputs */}
            {datePreset === 'custom' && (
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    {(['From', 'To'] as const).map((lbl, i) => (
                        <div key={lbl} className="flex items-center gap-2">
                            <label className="text-[10px] uppercase tracking-wider w-8" style={{ color: 'var(--text-muted)' }}>{lbl}</label>
                            <input
                                type="date"
                                value={i === 0 ? customStart : customEnd}
                                onChange={e => i === 0 ? setCustomStart(e.target.value) : setCustomEnd(e.target.value)}
                                className="px-2 py-1 text-xs border rounded-sm"
                                style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
                            />
                        </div>
                    ))}
                    <button
                        type="button"
                        disabled={!customStart || !customEnd}
                        onClick={() => { setAppliedStart(customStart); setAppliedEnd(customEnd); }}
                        className="px-3 py-1 text-[10px] uppercase tracking-wider border rounded-sm disabled:opacity-40"
                        style={activeBtnStyle(true)}
                    >
                        Apply
                    </button>
                </div>
            )}
            {datePreset !== 'custom' && <div className="mb-4" />}

            {/* Chart header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <SectionLabel>Trend Pressure Score</SectionLabel>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        Average of selected {maLabel} percentiles
                    </p>
                </div>
                {latest && (
                    <div className="text-right">
                        <div className="text-2xl font-light font-mono" style={{ color: SCORE_COLOR }}>
                            {latest.trend_pressure_score?.toFixed(1)}
                        </div>
                        <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                            Score %ile ·{' '}
                            {(() => {
                                const [y, m, d] = latest.date.split('-').map(Number);
                                return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            })()}
                        </div>
                    </div>
                )}
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={height}>
                <ComposedChart data={filtered} margin={{ top: 4, right: viewMode === 'value' && showScore ? 48 : 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                        dataKey="date"
                        ticks={yearlyTicks}
                        tickFormatter={v => new Date(v).getFullYear().toString()}
                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        domain={viewMode === 'percentile' ? [0, 100] : ['auto', 'auto']}
                        tickFormatter={v => viewMode === 'percentile' ? `${v}` : `${v}`}
                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                        axisLine={false}
                        tickLine={false}
                        width={32}
                    />
                    {viewMode === 'value' && showScore && (
                        <YAxis
                            yAxisId="score"
                            orientation="right"
                            domain={[0, 100]}
                            tick={{ fontSize: 10, fill: SCORE_COLOR }}
                            axisLine={false}
                            tickLine={false}
                            width={40}
                        />
                    )}
                    <Tooltip content={tooltipContent} />

                    {/* Reference lines */}
                    {viewMode === 'percentile' && (
                        <>
                            <ReferenceLine y={90} stroke="rgba(239,68,68,0.3)" strokeDasharray="3 3"
                                label={{ value: '90', fill: 'var(--text-muted)', fontSize: 9, position: 'insideTopLeft' }} />
                            <ReferenceLine y={50} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                            <ReferenceLine y={10} stroke="rgba(16,185,129,0.3)" strokeDasharray="3 3"
                                label={{ value: '10', fill: 'var(--text-muted)', fontSize: 9, position: 'insideBottomLeft' }} />
                        </>
                    )}
                    {viewMode === 'value' && (
                        <ReferenceLine y={0} stroke="rgba(239,68,68,0.4)" strokeDasharray="3 3" strokeWidth={1.5} />
                    )}

                    {/* Individual metric lines */}
                    {METRICS.filter(m => visibleMetrics.has(m.percentileKey as string)).map(m => (
                        <Line
                            key={m.label}
                            type="monotone"
                            dataKey={viewMode === 'percentile' ? m.percentileKey : m.valueKey}
                            stroke={m.color}
                            strokeWidth={1}
                            dot={false}
                            name={viewMode === 'percentile' ? `${m.label} %ile` : m.label}
                            strokeOpacity={viewMode === 'percentile' ? 0.45 : 0.8}
                            connectNulls
                            isAnimationActive={false}
                        />
                    ))}

                    {/* 20D MA lines (percentile mode only) */}
                    {viewMode === 'percentile' && METRICS.filter(m => visibleMA20s.has(m.ma20Key as string)).map(m => (
                        <Line
                            key={`${m.label}-ma20`}
                            type="monotone"
                            dataKey={m.ma20Key}
                            stroke={m.ma20Color}
                            strokeWidth={1.5}
                            dot={false}
                            name={`${m.label} 20D MA`}
                            strokeDasharray="4 2"
                            connectNulls
                            isAnimationActive={false}
                        />
                    ))}

                    {/* Composite score */}
                    {showScore && (
                        <Line
                            type="monotone"
                            dataKey="trend_pressure_score"
                            stroke={SCORE_COLOR}
                            strokeWidth={2}
                            dot={false}
                            name="Trend Pressure Score"
                            connectNulls
                            isAnimationActive={false}
                            yAxisId={viewMode === 'value' ? 'score' : undefined}
                        />
                    )}

                    {/* Score 20D MA */}
                    {viewMode === 'percentile' && showScoreMA20 && (
                        <Line
                            type="monotone"
                            dataKey="score_ma20"
                            stroke="#C9A455"
                            strokeWidth={1.5}
                            dot={false}
                            name="Score 20D MA"
                            strokeDasharray="4 2"
                            connectNulls
                            isAnimationActive={false}
                        />
                    )}
                </ComposedChart>
            </ResponsiveContainer>

            {/* Footer notes */}
            <div className="mt-4 border-t pt-3 space-y-1.5" style={{ borderColor: 'rgba(181,139,74,0.10)' }}>
                <p className="text-[10px] leading-5" style={{ color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Score</span> = simple average of the{' '}
                    {Array.from(scoreMetrics).map(k => METRICS.find(m => m.percentileKey === k)?.label).filter(Boolean).join(', ')}{' '}
                    percentiles (0–100). Always percentile-based regardless of view mode.
                    {viewMode === 'value' && ' Plotted on the right axis.'}
                </p>
                <p className="text-[10px] leading-5" style={{ color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Divergence</span> = % gap between price and its {maLabel} ·{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>Days Above MA</span> = consecutive days price has stayed above the {maLabel} ·{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>MA Slope</span> = rate of change of the {maLabel} itself
                </p>
                <p className="text-[10px] leading-5" style={{ color: 'var(--text-muted)' }}>
                    Each metric is ranked against its full history to produce a percentile. The score reflects how stretched trend conditions are relative to the past.
                </p>
            </div>
        </div>
    );
}
