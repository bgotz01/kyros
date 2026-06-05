'use client';

import { useState } from 'react';
import { REGIME_METADATA, REGIME_TRIGGERS, type RegimeFamily } from '@/app/lib/regime-state-machine';

interface Props {
    regime: RegimeFamily;
    entryDate: string;
    currentDate: string;
    monthsInRegime: number;
    triggerReason: string;
    conditions: {
        rey: number | null;
        eyp: number | null;
        real10Y: number | null;
        real3M: number | null;
        realM2: number | null;
    };
}

export default function RegimeActiveCard({ regime, entryDate, currentDate, monthsInRegime, triggerReason, conditions }: Props) {
    const [expanded, setExpanded] = useState(false);
    const meta = REGIME_METADATA[regime];
    const trigger = REGIME_TRIGGERS[regime];
    if (!meta) return null;

    const fmtDate = (d: string) => {
        try { return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); }
        catch { return d; }
    };

    const condItems = [
        { label: 'Real M2', val: conditions.realM2 },
        { label: 'Real 3M', val: conditions.real3M },
        { label: 'Real 10Y', val: conditions.real10Y },
        { label: 'Real EY', val: conditions.rey },
        { label: 'EYP', val: conditions.eyp },
    ];

    return (
        <div className="border rounded-sm" style={{ borderColor: meta.color, backgroundColor: 'var(--surface-raised)' }}>
            <button
                className="w-full p-5 text-left"
                onClick={() => setExpanded(e => !e)}
            >
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>Active Regime</span>
                    <span className="h-px flex-1" style={{ backgroundColor: 'var(--surface-border)' }} />
                </div>
                <div className="flex items-end justify-between">
                    <div>
                        <div className="text-2xl font-bold tracking-tight" style={{ color: meta.color }}>{regime}</div>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{meta.description}</p>
                    </div>
                    <svg className={`w-4 h-4 flex-shrink-0 mb-1 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
                <div className="flex gap-4 mt-3 text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    <span>Entry {fmtDate(entryDate)}</span>
                    <span>·</span>
                    <span>{monthsInRegime} months</span>
                    <span>·</span>
                    <span>as of {fmtDate(currentDate)}</span>
                </div>
            </button>

            {expanded && (
                <div className="px-5 pb-5 space-y-4 border-t" style={{ borderColor: 'var(--surface-border)' }}>
                    {/* Conditions grid */}
                    <div className="grid grid-cols-5 gap-2 pt-4">
                        {condItems.map(({ label, val }) => (
                            <div key={label} className="border p-2 text-center rounded-sm" style={{ borderColor: 'var(--surface-border)' }}>
                                <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
                                <div className="text-sm font-bold" style={{ color: val !== null ? meta.color : 'var(--text-muted)' }}>
                                    {val !== null ? `${val.toFixed(1)}%` : 'N/A'}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Trigger descriptions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="border p-3 rounded-sm" style={{ borderColor: 'var(--surface-border)' }}>
                            <div className="text-[9px] uppercase tracking-widest mb-2" style={{ color: '#22c55e' }}>Entry</div>
                            <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{trigger.entryDescription}</p>
                        </div>
                        {trigger.exitDescription && (
                            <div className="border p-3 rounded-sm" style={{ borderColor: 'var(--surface-border)' }}>
                                <div className="text-[9px] uppercase tracking-widest mb-2" style={{ color: '#ef4444' }}>Exit</div>
                                <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{trigger.exitDescription}</p>
                            </div>
                        )}
                    </div>

                    {/* Guidance */}
                    <div className="border p-3 rounded-sm" style={{ borderColor: meta.color, backgroundColor: `${meta.color}10` }}>
                        <p className="text-xs font-medium text-center" style={{ color: meta.color }}>{meta.guidance}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
