'use client';

import { useState, useEffect } from 'react';
import { REGIME_METADATA, REGIME_TRIGGERS } from '@/app/lib/regime-state-machine';
import type { RegimeFamily } from '@/app/lib/regime-state-machine';
import RegimeBacktester from './RegimeBacktester';
import PeriodChart from './PeriodChart';

// ─── Types ──────────────────────────────────────────────────────────────────

interface StatBlock {
    avg: number | null;
    median: number | null;
    min: number | null;
    max: number | null;
    count: number;
    positiveRate: number | null;
}

interface AssetStats {
    during: StatBlock;
    annualized: StatBlock;
    fwd1Y: StatBlock;
    fwd3Y: StatBlock;
}

interface PeriodReturn {
    startDate: string;
    endDate: string;
    months: number;
    isCurrent: boolean;
    spxReturn: number | null;
    spxAnnualized: number | null;
    spxFwd1Y: number | null;
    spxFwd3Y: number | null;
    ndxReturn: number | null;
    ndxAnnualized: number | null;
    ndxFwd1Y: number | null;
    ndxFwd3Y: number | null;
}

interface RegimeDetailData {
    regime: RegimeFamily;
    slug: string;
    occurrences: number;
    durationStats: StatBlock;
    spxStats: AssetStats;
    ndxStats: AssetStats;
    periods: PeriodReturn[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v: number | null, suffix = '%', decimals = 1): string {
    if (v === null || v === undefined) return '—';
    const sign = v > 0 ? '+' : '';
    return `${sign}${v.toFixed(decimals)}${suffix}`;
}

function fmtDate(s: string): string {
    if (s === 'Current') return 'Current';
    return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

function ReturnCell({ value }: { value: number | null }) {
    if (value === null) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
    const color = value > 0 ? '#4ade80' : value < 0 ? '#f87171' : 'var(--text-muted)';
    return <span style={{ color, fontVariantNumeric: 'tabular-nums' }}>{fmt(value)}</span>;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props { slug: string; regime: RegimeFamily; }

export default function RegimeDetailView({ slug, regime }: Props) {
    const [data, setData] = useState<RegimeDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAllPeriods, setShowAllPeriods] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<{ startDate: string; endDate: string; spxReturn: number | null; ndxReturn: number | null } | null>(null);

    const meta = REGIME_METADATA[regime];
    const triggers = REGIME_TRIGGERS[regime];
    const color = meta.color;

    useEffect(() => {
        setLoading(true);
        setError(null);
        setSelectedPeriod(null);
        fetch(`/api/regime/detail?regime=${slug}`)
            .then(r => r.json())
            .then(d => {
                if (d.error) throw new Error(d.error);
                setData(d);
                // Auto-select the first period so the chart loads immediately
                if (d.periods?.length > 0) {
                    const first = d.periods[0];
                    setSelectedPeriod({
                        startDate: first.startDate,
                        endDate: first.endDate,
                        spxReturn: first.spxReturn,
                        ndxReturn: first.ndxReturn,
                    });
                }
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [slug]);

    return (
        <div className="space-y-6">
            {/* ── Header breadcrumb ─────────────────────────────────────── */}
            <div className="border-b pb-3 flex items-center gap-3 text-[10px] tracking-[0.3em] uppercase"
                style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}>
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                <span style={{ color: 'var(--accent)' }}>Panteon</span>
                <span>/</span>
                <span>Regime</span>
                <span>/</span>
                <span style={{ color }}>{regime}</span>
            </div>

            {/* ── Regime identity card ──────────────────────────────────── */}
            <div className="border p-5 space-y-3"
                style={{ borderColor: color + '40', backgroundColor: color + '08' }}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-base font-semibold tracking-[0.1em] uppercase" style={{ color }}>
                            {regime}
                        </h1>
                        <p className="text-[12px] mt-1 leading-5" style={{ color: 'var(--text-secondary)' }}>
                            {meta.description}
                        </p>
                    </div>
                    {data && (
                        <div className="shrink-0 text-right">
                            <div className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Occurrences</div>
                            <div className="text-2xl font-light tabular-nums" style={{ color }}>{data.occurrences}</div>
                        </div>
                    )}
                </div>

                {/* Guidance */}
                <div className="pt-2 border-t text-[11px] leading-5"
                    style={{ borderColor: color + '25', color: 'var(--text-secondary)' }}>
                    <span className="uppercase tracking-widest text-[9px] mr-2" style={{ color: 'var(--text-muted)' }}>Guidance</span>
                    {meta.guidance}
                </div>

                {/* Entry / Exit conditions */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t"
                    style={{ borderColor: color + '25' }}>
                    <div>
                        <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Entry</div>
                        <div className="text-[11px] font-mono" style={{ color: '#4ade80' }}>{triggers.entryDescription}</div>
                    </div>
                    <div>
                        <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Exit</div>
                        <div className="text-[11px] font-mono" style={{ color: '#f87171' }}>{triggers.exitDescription}</div>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="border p-8 text-center text-[11px] uppercase tracking-widest"
                    style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}>
                    Loading regime data…
                </div>
            )}

            {error && (
                <div className="border p-4 text-xs" style={{ borderColor: '#f87171', color: '#f87171' }}>
                    Error: {error}
                </div>
            )}

            {data && (
                <>
                    {/* ── Duration stats ──────────────────────────────────── */}
                    <div className="border p-4 space-y-2"
                        style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-raised)' }}>
                        <div className="text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: 'var(--accent)' }}>
                            Duration Statistics
                        </div>
                        <div className="grid grid-cols-4 gap-3 text-center">
                            {[
                                ['Avg Duration', `${data.durationStats.avg?.toFixed(1) ?? '—'}mo`],
                                ['Median Duration', `${data.durationStats.median?.toFixed(1) ?? '—'}mo`],
                                ['Shortest', `${data.durationStats.min ?? '—'}mo`],
                                ['Longest', `${data.durationStats.max ?? '—'}mo`],
                            ].map(([label, val]) => (
                                <div key={label} className="border p-2"
                                    style={{ borderColor: 'var(--surface-border)' }}>
                                    <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
                                    <div className="text-sm tabular-nums font-medium" style={{ color: 'var(--text-primary)' }}>{val}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Period table ─────────────────────────────────────── */}
                    <div className="border overflow-hidden"
                        style={{ borderColor: 'var(--surface-border)' }}>
                        <div className="px-5 py-4 flex items-center justify-between"
                            style={{ backgroundColor: 'var(--surface)' }}>
                            <div>
                                <div className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: 'var(--accent)' }}>
                                    All Periods
                                </div>
                                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                    {data.periods.length} occurrences · SPX and NDX returns per period · click a start date to view chart
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead style={{ backgroundColor: 'var(--surface)' }}>
                                    <tr className="border-t" style={{ borderColor: 'var(--surface-border)' }}>
                                        {['Start', 'End', 'Duration', 'SPX Return', 'SPX Ann.', 'SPX +1Y', 'SPX +3Y', 'NDX Return', 'NDX Ann.', 'NDX +1Y', 'NDX +3Y'].map(h => (
                                            <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider whitespace-nowrap"
                                                style={{ color: 'var(--text-muted)' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(showAllPeriods ? data.periods : data.periods.slice(0, 10)).map((p, i) => {
                                        const isSelected = selectedPeriod?.startDate === p.startDate;
                                        return (
                                            <tr key={i}
                                                className="border-b hover:opacity-80 transition-opacity"
                                                style={{
                                                    borderColor: 'var(--surface-border)',
                                                    borderLeft: `3px solid ${isSelected ? color : color + '60'}`,
                                                    backgroundColor: isSelected ? color + '12' : p.isCurrent ? color + '10' : 'transparent',
                                                }}
                                            >
                                                <td className="px-4 py-2.5 text-[11px] tabular-nums whitespace-nowrap">
                                                    <button
                                                        onClick={() => setSelectedPeriod(
                                                            isSelected ? null : { startDate: p.startDate, endDate: p.endDate, spxReturn: p.spxReturn, ndxReturn: p.ndxReturn }
                                                        )}
                                                        className="underline underline-offset-2 decoration-dotted hover:opacity-70 transition-opacity"
                                                        style={{ color: isSelected ? color : 'var(--text-secondary)' }}
                                                    >
                                                        {fmtDate(p.startDate)}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-2.5 text-[11px] tabular-nums whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                                                    {p.isCurrent
                                                        ? <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase rounded-sm"
                                                            style={{ backgroundColor: color + '20', color }}>Live</span>
                                                        : fmtDate(p.endDate)}
                                                </td>
                                                <td className="px-4 py-2.5 text-[11px] tabular-nums font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                                                    {p.months}mo
                                                </td>
                                                <td className="px-4 py-2.5 text-[11px] tabular-nums whitespace-nowrap"><ReturnCell value={p.spxReturn} /></td>
                                                <td className="px-4 py-2.5 text-[11px] tabular-nums whitespace-nowrap"><ReturnCell value={p.spxAnnualized} /></td>
                                                <td className="px-4 py-2.5 text-[11px] tabular-nums whitespace-nowrap"><ReturnCell value={p.spxFwd1Y} /></td>
                                                <td className="px-4 py-2.5 text-[11px] tabular-nums whitespace-nowrap"><ReturnCell value={p.spxFwd3Y} /></td>
                                                <td className="px-4 py-2.5 text-[11px] tabular-nums whitespace-nowrap"><ReturnCell value={p.ndxReturn} /></td>
                                                <td className="px-4 py-2.5 text-[11px] tabular-nums whitespace-nowrap"><ReturnCell value={p.ndxAnnualized} /></td>
                                                <td className="px-4 py-2.5 text-[11px] tabular-nums whitespace-nowrap"><ReturnCell value={p.ndxFwd1Y} /></td>
                                                <td className="px-4 py-2.5 text-[11px] tabular-nums whitespace-nowrap"><ReturnCell value={p.ndxFwd3Y} /></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                {/* ── Averages footer row ── */}
                                <tfoot>
                                    <tr className="border-t-2"
                                        style={{ borderColor: color + '60', backgroundColor: color + '08' }}>
                                        <td className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                                            style={{ color }}>
                                            Avg
                                        </td>
                                        <td className="px-4 py-2.5 text-[10px]"
                                            style={{ color: 'var(--text-muted)' }}>
                                            {data.durationStats.avg?.toFixed(1) ?? '—'}mo avg
                                        </td>
                                        <td className="px-4 py-2.5 text-[10px] tabular-nums"
                                            style={{ color: 'var(--text-muted)' }}>
                                            {data.durationStats.median?.toFixed(0) ?? '—'}mo med
                                        </td>
                                        <td className="px-4 py-2.5 text-[11px] tabular-nums whitespace-nowrap font-medium"><ReturnCell value={data.spxStats.during.avg} /></td>
                                        <td className="px-4 py-2.5 text-[11px] tabular-nums whitespace-nowrap font-medium"><ReturnCell value={data.spxStats.annualized.avg} /></td>
                                        <td className="px-4 py-2.5 text-[11px] tabular-nums whitespace-nowrap font-medium"><ReturnCell value={data.spxStats.fwd1Y.avg} /></td>
                                        <td className="px-4 py-2.5 text-[11px] tabular-nums whitespace-nowrap font-medium"><ReturnCell value={data.spxStats.fwd3Y.avg} /></td>
                                        <td className="px-4 py-2.5 text-[11px] tabular-nums whitespace-nowrap font-medium"><ReturnCell value={data.ndxStats.during.avg} /></td>
                                        <td className="px-4 py-2.5 text-[11px] tabular-nums whitespace-nowrap font-medium"><ReturnCell value={data.ndxStats.annualized.avg} /></td>
                                        <td className="px-4 py-2.5 text-[11px] tabular-nums whitespace-nowrap font-medium"><ReturnCell value={data.ndxStats.fwd1Y.avg} /></td>
                                        <td className="px-4 py-2.5 text-[11px] tabular-nums whitespace-nowrap font-medium"><ReturnCell value={data.ndxStats.fwd3Y.avg} /></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {data.periods.length > 10 && (
                            <div className="px-5 py-3 border-t"
                                style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)' }}>
                                <button
                                    onClick={() => setShowAllPeriods(s => !s)}
                                    className="text-[11px] uppercase tracking-wider hover:opacity-80 transition-opacity"
                                    style={{ color: 'var(--accent)' }}
                                >
                                    {showAllPeriods
                                        ? `▲ Show fewer`
                                        : `▼ Show all ${data.periods.length} periods`}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ── Period chart ──────────────────────────────────────── */}
                    {selectedPeriod && (
                        <PeriodChart
                            startDate={selectedPeriod.startDate}
                            endDate={selectedPeriod.endDate}
                            regimeColor={color}
                            regime={regime}
                            spxReturn={selectedPeriod.spxReturn}
                            ndxReturn={selectedPeriod.ndxReturn}
                            onClose={() => setSelectedPeriod(null)}
                        />
                    )}

                    {/* ── Backtest ──────────────────────────────────────── */}
                    <RegimeBacktester regime={regime} />
                </>
            )}
        </div>
    );
}
