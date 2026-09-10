'use client';

import { useState } from 'react';
import type { EngineScore } from '@/app/api/engine/analyze/route';
import Bullets from './Bullets';
import Comparison from './Comparison';
import { inversionHeading, LEVEL_HEADING, type RankKey } from './types';

// ─── the analysis ─────────────────────────────────────────────────────────────
// Three columns, one per law, read ACROSS rather than down.
//
// The across-reading is the whole point of the layout. All three laws select
// from the same six forces and differ only in which line of that force they are
// measured against — the baseline, the incentive, or the inflection criterion.
// Stacked vertically that relationship was invisible: three sections that looked
// like three separate analyses of three separate things. Side by side, a reader
// sees one force read three ways, and can see at a glance when all three columns
// name the same force, which is the convergence the critic is told to watch for.
//
// Within a column the order is the argument: what the snapshot said first, then
// what the paper did about it. The snapshot's line is quoted, never paraphrased
// — for I³ it was written before the paper was read, and a score can only be
// checked against a criterion that is on screen.

const LAWS: { key: RankKey; symbol: string; label: string }[] = [
    { key: 'inversion', symbol: 'I¹', label: 'Baseline' },
    { key: 'incentives', symbol: 'I²', label: 'Incentive' },
    { key: 'inflection', symbol: 'I³', label: 'Criterion' },
];

function snapshotLine(score: EngineScore, key: RankKey): string {
    if (key === 'inversion') return score.inversion.baseline;
    if (key === 'incentives') return score.incentives.incentive;
    return score.inflection.criterion;
}

function finding(score: EngineScore, key: RankKey): string[] {
    if (key === 'inversion') return score.inversion.inverting;
    if (key === 'incentives') return score.incentives.bottleneck;
    return score.inflection.unprecedented;
}

/** The I¹ bullets answer a different question at each height — "what it
 *  overturns" is wrong above a row that only made something faster. The other
 *  two laws ask one question at every height. */
function findingLabel(score: EngineScore, key: RankKey): string {
    if (key !== 'inversion') return 'Finding';
    const { level, score: n } = score.inversion;
    return level !== undefined ? LEVEL_HEADING[level] : inversionHeading(n);
}

export default function Analysis({ score }: { score: EngineScore }) {
    const [showPairs, setShowPairs] = useState(false);
    const pairs = Math.min(
        score.inversion.previous?.length ?? 0,
        score.inversion.proposed?.length ?? 0,
    );

    return (
        <div className="flex flex-col gap-3">
            <div className="grid gap-px border border-stone-line bg-stone-line sm:grid-cols-3">
                {LAWS.map(({ key, symbol, label }) => {
                    const block = score[key];
                    const line = snapshotLine(score, key);

                    return (
                        <div key={key} className="flex flex-col gap-3 bg-obsidian-800 px-3 py-3">
                            <span className="flex items-baseline gap-2">
                                <span className="font-serif text-[0.85rem] font-medium leading-none tracking-[0.04em] text-bronze-bright">
                                    {symbol}
                                </span>
                                <span className="min-w-0 truncate font-sans text-[0.5rem] uppercase tracking-[0.2em] text-bronze">
                                    {block.dimensionId ?? 'no force'}
                                    {/* The second force is dimmer on purpose: it is
                                        named, and it is not what the score was
                                        measured against. */}
                                    {block.secondaryId && (
                                        <span className="text-platinum-dim"> · {block.secondaryId}</span>
                                    )}
                                </span>
                                <span className="ml-auto font-mono text-[0.62rem] text-marble">
                                    {block.score}
                                </span>
                            </span>

                            <div>
                                <span className="mb-1 block font-sans text-[0.44rem] uppercase tracking-[0.22em] text-platinum-dim">
                                    {label}
                                </span>
                                {/* The "no force" line belongs to a NULL selection
                                    only. Printing it whenever the text is missing
                                    put "Moves none of the six forces" under a
                                    column scoring 8, which is not a fallback but a
                                    contradiction. */}
                                <p className="font-sans text-[0.66rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                                    {block.dimensionId ? line || '—' : 'Moves none of the six forces.'}
                                </p>
                            </div>

                            <div>
                                <span className="mb-1.5 block font-sans text-[0.44rem] uppercase tracking-[0.22em] text-platinum-dim">
                                    {findingLabel(score, key)}
                                </span>
                                <Bullets items={finding(score, key)} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {pairs > 0 && (
                <div>
                    <button
                        type="button"
                        onClick={() => setShowPairs((v) => !v)}
                        aria-expanded={showPairs}
                        className="flex items-baseline gap-1.5 font-sans text-[0.46rem] uppercase tracking-[0.22em] text-platinum-dim transition-colors duration-300 ease-mechanical hover:text-bronze-bright"
                    >
                        <span
                            aria-hidden
                            className={`font-mono text-[0.5rem] transition-transform duration-300 ease-mechanical ${
                                showPairs ? 'rotate-90' : ''
                            }`}
                        >
                            ▸
                        </span>
                        Point by point · {pairs}
                    </button>
                    {showPairs && (
                        <div className="mt-2">
                            <Comparison
                                previous={score.inversion.previous ?? []}
                                proposed={score.inversion.proposed ?? []}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
