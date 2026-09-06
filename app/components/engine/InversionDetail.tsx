'use client';

// ─── I¹ detail ────────────────────────────────────────────────────────────────
// One contrast, shown once. What the paradigm holds, against what the paper
// puts in its place.
//
// The left side is the sealed snapshot's own assumption — the written claim I¹
// is measured against — not the model's paraphrase of what came before. That is
// the point of having a ruler: the prior is declared in advance rather than
// inferred from the paper arguing against it.
//
// The paired point-by-point table says the same thing at greater length, so it
// sits behind a toggle rather than competing with the headline contrast.

import { useState } from 'react';
import type { EngineScore } from '@/app/api/engine/analyze/route';
import Bullets from './Bullets';
import Comparison from './Comparison';
import { RELATION_HEADING } from './types';
import { contributionLabel } from './format';

export default function InversionDetail({
    score,
    standingAssumption,
}: {
    score: EngineScore;
    /** The assumption from the sealed snapshot, when one covers this paper. */
    standingAssumption?: string;
}) {
    const [showPairs, setShowPairs] = useState(false);

    const delta = score.delta;
    const held = standingAssumption || score.previousParadigm;
    const offered = delta?.proposes || score.corePremise;
    const pairs = Math.min(
        score.inversion.previous?.length ?? 0,
        score.inversion.proposed?.length ?? 0,
    );

    return (
        <div className="flex flex-col gap-4">
            {delta && (
                <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
                    <span className="flex items-baseline gap-2">
                        <span className="font-sans text-[0.48rem] uppercase tracking-[0.22em] text-platinum-dim">
                            Change type
                        </span>
                        <span className="font-sans text-[0.68rem] tracking-[0.03em] text-bronze">
                            {contributionLabel(score)}
                        </span>
                    </span>
                    <span className="flex items-baseline gap-2">
                        <span className="font-sans text-[0.48rem] uppercase tracking-[0.22em] text-platinum-dim">
                            Inversion
                        </span>
                        <span className="font-mono text-[0.68rem] text-marble">
                            {score.inversion.score}/10
                        </span>
                    </span>
                </div>
            )}

            {(held || offered) && (
                <div className="grid grid-cols-1 gap-px border border-stone-line bg-stone-line sm:grid-cols-2">
                    <div className="flex flex-col bg-obsidian-800">
                        <span className="border-b border-stone-line px-3 py-1.5 font-sans text-[0.5rem] uppercase tracking-[0.24em] text-platinum-dim">
                            Last paradigm
                        </span>
                        <p className="flex-1 bg-charcoal px-3 py-3 font-sans text-[0.7rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                            {held || '—'}
                        </p>
                    </div>
                    <div className="flex flex-col bg-obsidian-800">
                        <span className="border-b border-stone-line px-3 py-1.5 font-sans text-[0.5rem] uppercase tracking-[0.24em] text-bronze">
                            Proposed idea
                        </span>
                        <p className="flex-1 bg-charcoal px-3 py-3 font-sans text-[0.7rem] leading-relaxed tracking-[0.03em] text-marble">
                            {offered || '—'}
                        </p>
                    </div>
                </div>
            )}

            <div>
                <span className="mb-2 block font-sans text-[0.5rem] uppercase tracking-[0.24em] text-platinum-dim">
                    {RELATION_HEADING[delta?.relation ?? ''] ?? 'What changes'}
                </span>
                <Bullets items={score.inversion.inverting} />
            </div>

            {/* The same contrast, at length. Secondary by default so the card
                shows one before/after object rather than three. */}
            {pairs > 0 && (
                <div>
                    <button
                        type="button"
                        onClick={() => setShowPairs((v) => !v)}
                        aria-expanded={showPairs}
                        className="flex items-baseline gap-1.5 font-sans text-[0.5rem] uppercase tracking-[0.24em] text-platinum-dim transition-colors duration-300 ease-mechanical hover:text-bronze-bright"
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
