'use client';

// ─── YearTimeline ─────────────────────────────────────────────────────────────
// Arrow buttons flanking a row of year tick marks.

interface YearTimelineProps {
    years: number[];
    selectedYear: number;
    onSelect: (year: number) => void;
}

const ChevronLeft = () => (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
        <path d="M6.5 2L3.5 5L6.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ChevronRight = () => (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
        <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export function YearTimeline({ years, selectedYear, onSelect }: YearTimelineProps) {
    const idx = years.indexOf(selectedYear);
    const safeIdx = idx === -1 ? years.length - 1 : idx;

    return (
        <div>
            {/* large year display */}
            <div className="mb-2 flex justify-center">
                <span className="font-serif text-3xl font-light tracking-[0.1em] text-bronze-bright tabular-nums">
                    {selectedYear}
                </span>
            </div>

            {/* arrows + ticks */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => safeIdx > 0 && onSelect(years[safeIdx - 1])}
                    disabled={safeIdx === 0}
                    aria-label="Previous year"
                    className="flex h-9 w-9 shrink-0 items-center justify-center border border-stone-line text-platinum-dim transition-colors duration-300 ease-mechanical hover:border-bronze hover:text-bronze-bright disabled:opacity-20"
                >
                    <ChevronLeft />
                </button>

                <div className="relative flex flex-1 items-end">
                    {/* baseline */}
                    <div
                        className="pointer-events-none absolute inset-x-0 top-0 h-px"
                        style={{ background: 'var(--color-stone-line)' }}
                    />

                    {years.map((y) => {
                        const active = y === selectedYear;
                        const showLabel = y % 5 === 0 || y === years[years.length - 1];
                        return (
                            <button
                                key={y}
                                type="button"
                                onClick={() => onSelect(y)}
                                aria-label={String(y)}
                                aria-pressed={active}
                                className="flex flex-1 flex-col items-center gap-0.5"
                            >
                                <span
                                    style={{
                                        display: 'block',
                                        width: 1,
                                        height: active ? 16 : 6,
                                        marginTop: active ? 0 : 10,
                                        background: active
                                            ? 'var(--color-bronze-bright)'
                                            : 'var(--color-stone-line-strong)',
                                        transition:
                                            'height 300ms cubic-bezier(0.22,0.61,0.36,1), margin-top 300ms, background 300ms',
                                    }}
                                />
                                <span
                                    className="font-mono text-[0.55rem] tracking-[0.04em] transition-colors duration-300"
                                    style={{
                                        color: active
                                            ? 'var(--color-bronze-bright)'
                                            : 'var(--color-platinum-dim)',
                                        visibility: showLabel || active ? 'visible' : 'hidden',
                                    }}
                                >
                                    {y}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <button
                    type="button"
                    onClick={() => safeIdx < years.length - 1 && onSelect(years[safeIdx + 1])}
                    disabled={safeIdx === years.length - 1}
                    aria-label="Next year"
                    className="flex h-9 w-9 shrink-0 items-center justify-center border border-stone-line text-platinum-dim transition-colors duration-300 ease-mechanical hover:border-bronze hover:text-bronze-bright disabled:opacity-20"
                >
                    <ChevronRight />
                </button>
            </div>
        </div>
    );
}
