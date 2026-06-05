'use client';

import { useState, useEffect } from 'react';
import { REGIME_METADATA, type RegimeFamily } from '@/app/lib/regime-state-machine';

interface PeriodDetail {
    startDate: string;
    endDate: string;
    months: number;
    isCurrent: boolean;
    duringReturn: number | null;
    forward1Y: number | null;
    forward3Y: number | null;
    forward5Y: number | null;
    entryPrice: number | null;
    exitPrice: number | null;
    annualizedDuringReturn: number | null;
    monthlyReturn: number | null;
}

interface RegimeReturnStats {
    regime: string;
    occurrences: number;
    avgDurationMonths: number;
    medianDurationMonths: number;
    avgDuringReturn: number | null;
    medianDuringReturn: number | null;
    minDuringReturn: number | null;
    maxDuringReturn: number | null;
    avg1Y: number | null;
    avg3Y: number | null;
    avg5Y: number | null;
    median1Y: number | null;
    median3Y: number | null;
    median5Y: number | null;
    avgAnnualizedDuringReturn: number | null;
    medianAnnualizedDuringReturn: number | null;
    avgMonthlyReturn: number | null;
    medianMonthlyReturn: number | null;
    periods: PeriodDetail[];
}

const ASSETS = [
    { key: 'sp500', label: 'S&P 500', subtitle: '1960–Present' },
    { key: 'nasdaq', label: 'Nasdaq 100', subtitle: '1985–Present' },
    { key: 'gold', label: 'Gold', subtitle: '1975–Present' },
];

function fmt(val: number | null): string {
    if (val === null) return '—';
    return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
}

function retColor(val: number | null): string {
    if (val === null) return 'var(--text-muted)';
    if (val > 0) return '#22c55e';
    if (val < 0) return '#ef4444';
    return 'var(--text-muted)';
}

function fmtDate(d: string): string {
    if (d === 'Current') return 'Current';
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function RegimeTag({ regime }: { regime: string }) {
    const meta = REGIME_METADATA[regime as RegimeFamily];
    if (!meta) return <span className="text-sm font-medium">{regime}</span>;
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-semibold"
            style={{ backgroundColor: meta.color + '20', color: meta.color, border: `1px solid ${meta.color}40` }}
        >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
            {regime}
        </span>
    );
}

function SummaryTable({ data, statType }: { data: RegimeReturnStats[]; statType: 'avg' | 'median' }) {
    const th = "px-3 py-3 text-[10px] font-medium uppercase tracking-wider";
    const td = "px-3 py-3 text-[11px] font-mono text-center";

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--surface-border)' }}>
                        <th className={`${th} text-left`} style={{ color: 'var(--text-muted)' }}>Regime</th>
                        <th className={`${th} text-center`} style={{ color: 'var(--text-muted)' }}>#</th>
                        <th className={`${th} text-center`} style={{ color: 'var(--text-muted)' }}>Avg Duration</th>
                        <th className={`${th} text-center`} style={{ color: 'var(--text-muted)' }}>During</th>
                        <th className={`${th} text-center`} style={{ color: 'var(--text-muted)' }}>Monthly</th>
                        <th className={`${th} text-center`} style={{ color: 'var(--text-muted)' }}>Annualized</th>
                        <th className={`${th} text-center border-l italic font-normal`} style={{ color: 'var(--text-muted)', borderColor: 'var(--surface-border)' }}>1Y Fwd</th>
                        <th className={`${th} text-center italic font-normal`} style={{ color: 'var(--text-muted)' }}>3Y Fwd</th>
                        <th className={`${th} text-center italic font-normal`} style={{ color: 'var(--text-muted)' }}>5Y Fwd</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(r => {
                        const during = statType === 'avg' ? r.avgDuringReturn : r.medianDuringReturn;
                        const monthly = statType === 'avg' ? r.avgMonthlyReturn : r.medianMonthlyReturn;
                        const ann = statType === 'avg' ? r.avgAnnualizedDuringReturn : r.medianAnnualizedDuringReturn;
                        const f1 = statType === 'avg' ? r.avg1Y : r.median1Y;
                        const f3 = statType === 'avg' ? r.avg3Y : r.median3Y;
                        const f5 = statType === 'avg' ? r.avg5Y : r.median5Y;
                        return (
                            <tr key={r.regime} className="border-b transition-opacity hover:opacity-80"
                                style={{ borderColor: 'var(--surface-border)' }}>
                                <td className="px-3 py-3"><RegimeTag regime={r.regime} /></td>
                                <td className={`${td}`} style={{ color: 'var(--text-muted)' }}>{r.occurrences}</td>
                                <td className={`${td}`} style={{ color: 'var(--text-muted)' }}>{r.avgDurationMonths}mo</td>
                                <td className={`${td} font-medium`} style={{ color: retColor(during) }}>{fmt(during)}</td>
                                <td className={`${td} font-medium`} style={{ color: retColor(monthly) }}>{fmt(monthly)}</td>
                                <td className={`${td} font-medium`} style={{ color: retColor(ann) }}>{fmt(ann)}</td>
                                <td className={`${td} border-l italic`} style={{ color: retColor(f1), borderColor: 'var(--surface-border)' }}>{fmt(f1)}</td>
                                <td className={`${td} italic`} style={{ color: retColor(f3) }}>{fmt(f3)}</td>
                                <td className={`${td} italic`} style={{ color: retColor(f5) }}>{fmt(f5)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function PeriodTable({ periods }: { periods: PeriodDetail[] }) {
    const th = "px-3 py-2 text-[10px] font-medium uppercase tracking-wider";
    const td = "px-3 py-2 text-[10px] font-mono text-center";
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--surface-border)' }}>
                        <th className={`${th} text-left`} style={{ color: 'var(--text-muted)' }}>Period</th>
                        <th className={`${th} text-center`} style={{ color: 'var(--text-muted)' }}>Mo</th>
                        <th className={`${th} text-center`} style={{ color: 'var(--text-muted)' }}>Entry</th>
                        <th className={`${th} text-center`} style={{ color: 'var(--text-muted)' }}>Exit</th>
                        <th className={`${th} text-center`} style={{ color: 'var(--text-muted)' }}>During</th>
                        <th className={`${th} text-center`} style={{ color: 'var(--text-muted)' }}>Monthly</th>
                        <th className={`${th} text-center`} style={{ color: 'var(--text-muted)' }}>Ann.</th>
                        <th className={`${th} text-center border-l italic font-normal`} style={{ color: 'var(--text-muted)', borderColor: 'var(--surface-border)' }}>1Y</th>
                        <th className={`${th} text-center italic font-normal`} style={{ color: 'var(--text-muted)' }}>3Y</th>
                        <th className={`${th} text-center italic font-normal`} style={{ color: 'var(--text-muted)' }}>5Y</th>
                    </tr>
                </thead>
                <tbody>
                    {periods.map((p, i) => (
                        <tr key={i} className="border-b transition-opacity hover:opacity-70" style={{ borderColor: 'var(--surface-border)' }}>
                            <td className="px-3 py-2 text-[10px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                                {fmtDate(p.startDate)} → {fmtDate(p.endDate)}
                                {p.isCurrent && <span className="ml-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-sm"
                                    style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)' }}>ACTIVE</span>}
                            </td>
                            <td className={`${td}`} style={{ color: 'var(--text-muted)' }}>{p.months}</td>
                            <td className={`${td}`} style={{ color: 'var(--text-muted)' }}>{p.entryPrice?.toLocaleString() ?? '—'}</td>
                            <td className={`${td}`} style={{ color: 'var(--text-muted)' }}>{p.exitPrice?.toLocaleString() ?? '—'}</td>
                            <td className={`${td} font-medium`} style={{ color: retColor(p.duringReturn) }}>{fmt(p.duringReturn)}</td>
                            <td className={`${td} font-medium`} style={{ color: retColor(p.monthlyReturn) }}>{fmt(p.monthlyReturn)}</td>
                            <td className={`${td} font-medium`} style={{ color: retColor(p.annualizedDuringReturn) }}>{fmt(p.annualizedDuringReturn)}</td>
                            <td className={`${td} border-l italic`} style={{ color: retColor(p.forward1Y), borderColor: 'var(--surface-border)' }}>{fmt(p.forward1Y)}</td>
                            <td className={`${td} italic`} style={{ color: retColor(p.forward3Y) }}>{fmt(p.forward3Y)}</td>
                            <td className={`${td} italic`} style={{ color: retColor(p.forward5Y) }}>{fmt(p.forward5Y)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function RegimeReturns() {
    const [activeAsset, setActiveAsset] = useState('sp500');
    const [dataByAsset, setDataByAsset] = useState<Record<string, RegimeReturnStats[]>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedRegime, setExpandedRegime] = useState<string | null>(null);
    const [statType, setStatType] = useState<'avg' | 'median'>('avg');

    useEffect(() => {
        if (dataByAsset[activeAsset]) return;
        setLoading(true);
        setError(null);
        fetch(`/api/regime/returns?asset=${activeAsset}`)
            .then(r => r.json())
            .then(json => setDataByAsset(prev => ({ ...prev, [activeAsset]: json.regimeReturns })))
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [activeAsset]);

    const data = dataByAsset[activeAsset] ?? [];
    const activeAssetMeta = ASSETS.find(a => a.key === activeAsset)!;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Asset tabs */}
                <div className="flex gap-1 rounded-sm border overflow-hidden" style={{ borderColor: 'var(--surface-border)' }}>
                    {ASSETS.map(a => (
                        <button
                            key={a.key}
                            onClick={() => { setActiveAsset(a.key); setExpandedRegime(null); }}
                            className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-medium transition-colors"
                            style={activeAsset === a.key
                                ? { backgroundColor: 'var(--accent-dim)', color: 'var(--accent)' }
                                : { color: 'var(--text-muted)' }
                            }
                        >
                            {a.label}
                        </button>
                    ))}
                </div>

                {/* Stat type toggle */}
                <div className="flex rounded-sm border overflow-hidden text-[11px]" style={{ borderColor: 'var(--surface-border)' }}>
                    {(['avg', 'median'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setStatType(s)}
                            className="px-3 py-1.5 uppercase tracking-wider font-medium transition-colors"
                            style={statType === s
                                ? { backgroundColor: 'var(--accent-dim)', color: 'var(--accent)' }
                                : { color: 'var(--text-muted)' }
                            }
                        >
                            {s === 'avg' ? 'Average' : 'Median'}
                        </button>
                    ))}
                </div>
            </div>

            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {activeAssetMeta.label} returns by regime · {activeAssetMeta.subtitle} · forward returns from regime entry date
            </p>

            {loading ? (
                <div className="flex items-center justify-center py-16 border rounded-sm" style={{ borderColor: 'var(--surface-border)' }}>
                    <span className="text-[11px] uppercase tracking-widest animate-pulse" style={{ color: 'var(--text-muted)' }}>
                        Loading returns…
                    </span>
                </div>
            ) : error ? (
                <div className="border rounded-sm p-4 text-xs" style={{ borderColor: '#ef4444', color: '#ef4444' }}>Error: {error}</div>
            ) : (
                <>
                    {/* Summary table */}
                    <div className="border rounded-sm overflow-hidden" style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-raised)' }}>
                        <SummaryTable data={data} statType={statType} />
                    </div>

                    {/* Expandable per-regime detail */}
                    <div className="space-y-2">
                        {data.map(r => (
                            <div key={r.regime} className="border rounded-sm overflow-hidden"
                                style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-raised)' }}>
                                <button
                                    onClick={() => setExpandedRegime(expandedRegime === r.regime ? null : r.regime)}
                                    className="w-full flex items-center justify-between px-4 py-3 transition-opacity hover:opacity-80"
                                >
                                    <div className="flex items-center gap-3">
                                        <RegimeTag regime={r.regime} />
                                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                            {r.occurrences} occurrence{r.occurrences !== 1 ? 's' : ''}
                                        </span>
                                        {r.minDuringReturn !== null && r.maxDuringReturn !== null && (
                                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                                Range: <span style={{ color: retColor(r.minDuringReturn) }}>{fmt(r.minDuringReturn)}</span>
                                                {' to '}
                                                <span style={{ color: retColor(r.maxDuringReturn) }}>{fmt(r.maxDuringReturn)}</span>
                                            </span>
                                        )}
                                    </div>
                                    <svg className={`w-3 h-3 transition-transform ${expandedRegime === r.regime ? 'rotate-180' : ''}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {expandedRegime === r.regime && (
                                    <div className="border-t" style={{ borderColor: 'var(--surface-border)' }}>
                                        <div className="px-4 py-2 text-[10px]" style={{ backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}>
                                            {REGIME_METADATA[r.regime as RegimeFamily]?.description}
                                        </div>
                                        <PeriodTable periods={r.periods} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Methodology note */}
                    <div className="border rounded-sm p-4 text-[10px] leading-5"
                        style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}>
                        <p className="font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Methodology</p>
                        <p>Returns use {activeAssetMeta.label} daily closing prices. &quot;During Regime&quot; = total return from entry to exit.
                            Forward returns (1Y/3Y/5Y) measured from regime entry. Annualized via ((1+R)^(12/months)−1)×100.
                            Entry/exit prices are the closest daily close within a 10-day window of month-end dates.</p>
                    </div>
                </>
            )}
        </div>
    );
}
