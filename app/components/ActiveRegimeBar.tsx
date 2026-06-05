'use client';

import { useEffect, useState } from 'react';
import { REGIME_METADATA } from '@/app/lib/regime-state-machine';
import type { RegimeFamily } from '@/app/lib/regime-state-machine';

interface RegimeState {
    regime: string;
    date: string;
    entryDate: string;
    triggerReason: string;
    rey: number | null;
    eyp: number | null;
    real10Y: number | null;
    real3M: number | null;
    realM2: number | null;
}

function fmt(v: number | null, decimals = 2): string {
    if (v == null) return '—';
    return `${v > 0 ? '+' : ''}${v.toFixed(decimals)}%`;
}

export default function ActiveRegimeBar() {
    const [regime, setRegime] = useState<RegimeState | null>(null);

    useEffect(() => {
        fetch('/api/regime/current')
            .then(r => r.ok ? r.json() : null)
            .then(data => data && setRegime(data))
            .catch(() => null);
    }, []);

    const meta = regime ? REGIME_METADATA[regime.regime as RegimeFamily] : null;
    const color = meta?.color ?? 'var(--accent)';

    const metrics: [string, string][] = regime ? [
        ['REY', fmt(regime.rey)],
        ['EYP', fmt(regime.eyp)],
        ['Real 10Y', fmt(regime.real10Y)],
        ['Real 3M', fmt(regime.real3M)],
        ['Real M2', fmt(regime.realM2)],
    ] : [
        ['REY', '—'], ['EYP', '—'], ['Real 10Y', '—'], ['Real 3M', '—'], ['Real M2', '—'],
    ];

    return (
        <div className="mb-5 border"
            style={{ borderColor: color + '40', backgroundColor: color + '06' }}>
            <div className="px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-3">

                {/* Label + badge with tooltip */}
                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-medium uppercase tracking-[0.25em]"
                        style={{ color: 'var(--accent)' }}>
                        Active Regime
                    </span>

                    {regime ? (
                        <div className="relative group">
                            <span
                                className="text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 border font-semibold cursor-default"
                                style={{ borderColor: color + '60', color, backgroundColor: color + '15' }}
                            >
                                {regime.regime}
                            </span>
                            {/* Tooltip */}
                            {meta && (
                                <div
                                    className="absolute left-0 top-full mt-2 z-50 w-64 border px-3 py-2.5 text-[11px] leading-5 pointer-events-none
                                               opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                                    style={{
                                        backgroundColor: 'rgba(7,6,5,0.97)',
                                        borderColor: color + '50',
                                        color: 'var(--text-secondary)',
                                        backdropFilter: 'blur(12px)',
                                        WebkitBackdropFilter: 'blur(12px)',
                                    }}
                                >
                                    <p className="mb-1.5" style={{ color: 'var(--text-primary)' }}>
                                        {meta.description}
                                    </p>
                                    <p style={{ color: 'var(--text-muted)' }}>{meta.guidance}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <span className="text-[10px] animate-pulse" style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                </div>

                {/* Dates */}
                {regime && (
                    <span className="text-[11px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                        Since <span style={{ color: 'var(--text-secondary)' }}>{regime.entryDate}</span>
                        <span className="mx-1.5">·</span>
                        As of <span style={{ color: 'var(--text-secondary)' }}>{regime.date}</span>
                    </span>
                )}

                {/* Metrics */}
                <div className="flex items-center gap-5 ml-auto flex-wrap">
                    {metrics.map(([k, v]) => (
                        <div key={k} className="flex items-baseline gap-1.5">
                            <span className="text-[10px] uppercase tracking-wider"
                                style={{ color: 'var(--text-muted)' }}>
                                {k}
                            </span>
                            <span className="text-[12px] font-medium tabular-nums" style={{
                                color: v.startsWith('+') ? '#4ade80'
                                    : v.startsWith('-') ? '#f87171'
                                        : 'var(--text-muted)',
                            }}>
                                {v === '—'
                                    ? <span className="animate-pulse">{v}</span>
                                    : v}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
