'use client';

import { useState } from 'react';
import { type BubbleDef } from './types';
import { SectionLabel, StatCell } from './ui';

function PhaseTimeline({ phases, color }: { phases: BubbleDef['phases']; color: string }) {
    const [open, setOpen] = useState<number | null>(null);
    return (
        <div className="space-y-1.5">
            {phases.map((ph, i) => (
                <div key={i}>
                    <button className="w-full flex items-center gap-2.5 text-left"
                        onClick={() => setOpen(open === i ? null : i)}>
                        <span className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: color }} />
                        <span className="text-[11px] flex-1" style={{ color: 'var(--text-secondary)' }}>{ph.label}</span>
                        <span className="text-[9px] tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
                            {ph.monthOffset > 0 ? `+${ph.monthOffset}m` : ph.monthOffset === 0 ? 'Peak' : `${ph.monthOffset}m`}
                        </span>
                        <svg className={`w-3 h-3 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {open === i && (
                        <div className="ml-[18px] pl-2.5 py-2 border-l text-[11px] leading-5"
                            style={{ borderColor: color + '40', color: 'var(--text-muted)' }}>
                            {ph.description}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

interface Props {
    bubble: BubbleDef;
}

export default function BubbleDetail({ bubble }: Props) {
    return (
        <div className="space-y-5">
            {/* Key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatCell label="Peak Date" value={bubble.peakDate} color={bubble.color} />
                <StatCell label="Peak Level" value={bubble.peakLevel} />
                <StatCell label="Max Drawdown" value={bubble.drawdown} color="#ef4444" />
                <StatCell label="Recovery" value={bubble.recoveryMonths} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <StatCell label="Peak P/E" value={bubble.peakPE} />
                <div className="border p-2.5 rounded-sm"
                    style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)' }}>
                    <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Period</div>
                    <div className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>{bubble.sub}</div>
                </div>
            </div>

            {/* Catalyst */}
            <div className="border rounded-sm p-3.5"
                style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)' }}>
                <SectionLabel>Catalyst</SectionLabel>
                <p className="text-[11px] leading-5" style={{ color: 'var(--text-secondary)' }}>{bubble.catalyst}</p>
            </div>

            {/* Macro context */}
            <div className="border rounded-sm p-3.5"
                style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)' }}>
                <SectionLabel>Macro Context & Trigger</SectionLabel>
                <p className="text-[11px] leading-5" style={{ color: 'var(--text-secondary)' }}>{bubble.macro}</p>
            </div>

            {/* Phase timeline */}
            <div className="border rounded-sm p-3.5"
                style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)' }}>
                <SectionLabel>Key Phases</SectionLabel>
                <PhaseTimeline phases={bubble.phases} color={bubble.color} />
            </div>
        </div>
    );
}
