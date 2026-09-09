'use client';

import { useState } from 'react';

// ─── types ────────────────────────────────────────────────────────────────────

interface ParadigmEntry {
    readonly year: number;
    readonly paradigm: string;
    readonly development: string;
    readonly change: string;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function ParadigmTimeline({
    entries,
    currentYear,
}: {
    entries: readonly ParadigmEntry[];
    currentYear: number;
}) {
    const [openYear, setOpenYear] = useState<number | null>(currentYear);

    function rowState(year: number): 'past' | 'current' | 'future' {
        if (year < currentYear) return 'past';
        if (year === currentYear) return 'current';
        return 'future';
    }

    return (
        <div className="divide-y divide-stone-line border border-stone-line">
            {entries.map((entry) => {
                const state = rowState(entry.year);
                const isOpen = openYear === entry.year;

                return (
                    <div key={entry.year}>
                        <button
                            type="button"
                            onClick={() => setOpenYear(isOpen ? null : entry.year)}
                            className={[
                                'group flex w-full items-baseline gap-6 px-6 py-5 text-left',
                                'transition-colors duration-300 ease-mechanical',
                                state === 'current'
                                    ? 'bg-charcoal/60'
                                    : isOpen
                                        ? 'bg-charcoal/40'
                                        : 'hover:bg-charcoal/30',
                            ].join(' ')}
                        >
                            {/* current-year accent bar */}
                            {state === 'current' && (
                                <span aria-hidden className="absolute left-0 h-full w-px bg-bronze" />
                            )}

                            {/* year */}
                            <span
                                className={[
                                    'w-14 shrink-0 font-mono tabular-nums',
                                    state === 'current'
                                        ? 'text-[1.6rem] text-bronze-bright'
                                        : state === 'past'
                                            ? 'text-[1.6rem] text-platinum-dim'
                                            : 'text-[1.6rem] text-platinum-dim/30',
                                ].join(' ')}
                            >
                                {entry.year}
                            </span>

                            {/* paradigm */}
                            <span
                                className={[
                                    'font-serif font-light tracking-[0.06em]',
                                    state === 'current'
                                        ? 'text-[1.6rem] text-marble'
                                        : state === 'past'
                                            ? 'text-[1.6rem] text-platinum'
                                            : 'text-[1.6rem] text-platinum-dim/30',
                                ].join(' ')}
                            >
                                {entry.paradigm}
                            </span>

                            {/* development */}
                            <span
                                className={[
                                    'font-mono tracking-[0.06em]',
                                    state === 'current'
                                        ? 'text-[1rem] text-bronze'
                                        : state === 'past'
                                            ? 'text-[1rem] text-platinum-dim'
                                            : 'text-[1rem] text-platinum-dim/30',
                                ].join(' ')}
                            >
                                {entry.development}
                            </span>

                            {/* expand indicator */}
                            <span
                                aria-hidden
                                className={[
                                    'ml-auto shrink-0 font-mono text-[0.65rem] transition-colors duration-300',
                                    isOpen ? 'text-bronze' : 'text-stone-line-strong group-hover:text-platinum-dim',
                                ].join(' ')}
                            >
                                {isOpen ? '−' : '+'}
                            </span>
                        </button>

                        {/* expanded: what changed */}
                        {isOpen && (
                            <div
                                className={[
                                    'px-6 pb-6 pt-1',
                                    state === 'current' ? 'bg-charcoal/60' : 'bg-charcoal/40',
                                ].join(' ')}
                            >
                                <p
                                    className={[
                                        'font-sans text-[0.78rem] leading-relaxed tracking-[0.04em]',
                                        state === 'current' ? 'text-platinum' : 'text-platinum-dim',
                                    ].join(' ')}
                                >
                                    {entry.change}
                                </p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
