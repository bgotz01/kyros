'use client';

import { useState } from 'react';
import { REGIME_METADATA, type RegimeFamily } from '@/app/lib/regime-state-machine';
import type { RegimeData } from './types';

interface CondDef { metric: string; dataKey: keyof RegimeData; threshold: number; direction: 'lte' | 'gte'; range: number }
interface RegimeDef { regime: RegimeFamily; conditions: CondDef[]; logic: 'AND' | 'OR' }

const DEFS: RegimeDef[] = [
    { regime: 'Liquidity Shock', conditions: [{ metric: 'Real M2', dataKey: 'realM2', threshold: 10, direction: 'gte', range: 8 }], logic: 'AND' },
    { regime: 'Crisis', conditions: [{ metric: 'Real 10Y', dataKey: 'real10Y', threshold: -1, direction: 'lte', range: 3 }, { metric: 'Real M2', dataKey: 'realM2', threshold: 5, direction: 'lte', range: 6 }], logic: 'AND' },
    { regime: 'Bond Stress', conditions: [{ metric: 'Real 10Y', dataKey: 'real10Y', threshold: -0.5, direction: 'lte', range: 3 }, { metric: 'Real 3M', dataKey: 'real3M', threshold: -1, direction: 'lte', range: 3 }], logic: 'AND' },
    { regime: 'Overvaluation', conditions: [{ metric: 'EYP', dataKey: 'eyp5yr', threshold: -2.5, direction: 'lte', range: 3 }, { metric: 'REY', dataKey: 'rey5yr', threshold: -0.5, direction: 'lte', range: 3 }], logic: 'OR' },
    { regime: 'Broad Growth', conditions: [{ metric: 'REY', dataKey: 'rey5yr', threshold: 3, direction: 'gte', range: 4 }], logic: 'AND' },
    { regime: 'Long Duration', conditions: [{ metric: 'EYP', dataKey: 'eyp5yr', threshold: 0, direction: 'lte', range: 3 }, { metric: 'Real 10Y', dataKey: 'real10Y', threshold: 1, direction: 'gte', range: 3 }], logic: 'AND' },
];

function prox(val: number | null, threshold: number, dir: 'lte' | 'gte', range: number): number {
    if (val === null) return 0;
    if (dir === 'lte') {
        if (val <= threshold) return 100;
        const d = val - threshold; if (d >= range) return 0;
        return Math.round(((range - d) / range) * 100);
    } else {
        if (val >= threshold) return 100;
        const d = threshold - val; if (d >= range) return 0;
        return Math.round(((range - d) / range) * 100);
    }
}

export default function RegimeProximityBars({ data, currentRegime }: { data: RegimeData; currentRegime?: string }) {
    const [expanded, setExpanded] = useState<string | null>(null);

    const results = DEFS.map(def => {
        const conditions = def.conditions.map(c => {
            const val = data[c.dataKey].value;
            const p = prox(val, c.threshold, c.direction, c.range);
            return { ...c, currentValue: val, proximity: p, met: p === 100 };
        });
        const overall = def.logic === 'OR' ? Math.max(...conditions.map(c => c.proximity)) : Math.min(...conditions.map(c => c.proximity));
        const allMet = def.logic === 'OR' ? conditions.some(c => c.met) : conditions.every(c => c.met);
        return { regime: def.regime, overall, allMet, conditions };
    });

    return (
        <div className="space-y-1.5">
            {results.map(r => {
                const meta = REGIME_METADATA[r.regime];
                const isActive = currentRegime === r.regime;
                const isExp = expanded === r.regime;

                return (
                    <div key={r.regime}>
                        <button
                            className="w-full flex items-center gap-2 h-8 group"
                            onClick={() => setExpanded(isExp ? null : r.regime)}
                        >
                            <div className="flex items-center gap-1.5 w-32 flex-shrink-0">
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: meta.color }} />
                                <span className="text-[11px] truncate" style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                    {r.regime}
                                </span>
                            </div>
                            <div className="flex-1 h-4 rounded-sm overflow-hidden relative" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                <div className="h-full transition-all duration-500 rounded-sm"
                                    style={{ width: `${r.overall}%`, backgroundColor: meta.color, opacity: r.allMet ? 0.9 : 0.45 }} />
                                {isActive && (
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-white">ACTIVE</span>
                                )}
                            </div>
                            <span className="text-[11px] font-mono w-8 text-right flex-shrink-0"
                                style={{ color: r.allMet ? meta.color : 'var(--text-muted)' }}>
                                {r.overall}%
                            </span>
                            <svg className={`w-3 h-3 flex-shrink-0 transition-transform ${r.conditions.length > 1 ? '' : 'invisible'} ${isExp ? 'rotate-180' : ''}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isExp && (
                            <div className="ml-36 mr-10 py-1.5 space-y-1">
                                {r.conditions.map((c, i) => (
                                    <div key={i} className="flex items-center gap-2 text-[10px]">
                                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.met ? 'bg-green-500' : ''}`}
                                            style={c.met ? {} : { backgroundColor: 'rgba(255,255,255,0.15)' }} />
                                        <span className="w-40 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                                            {c.metric} {c.direction === 'lte' ? '≤' : '≥'} {c.threshold}%
                                        </span>
                                        <div className="flex-1 h-2.5 rounded-sm overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                            <div className="h-full transition-all duration-500"
                                                style={{ width: `${c.proximity}%`, backgroundColor: meta.color, opacity: c.met ? 0.9 : 0.4 }} />
                                        </div>
                                        <span className="font-mono w-10 text-right flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                                            {c.currentValue !== null ? `${c.currentValue.toFixed(1)}%` : '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
