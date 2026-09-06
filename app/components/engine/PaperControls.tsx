'use client';

// ─── card controls ────────────────────────────────────────────────────────────
// The three passes a paper can be put through, and the score they produce.
// ▷ analyst · ⚖ critic · ★ repository.

import type { EngineScore } from '@/app/api/engine/analyze/route';
import { VERDICT_COLOR } from './types';

const CONTROL =
    'border px-2 py-1 font-mono text-[0.6rem] leading-none transition-colors duration-300 ease-mechanical';
const LIVE =
    'cursor-pointer border-stone-line text-platinum-dim hover:border-bronze hover:text-bronze-bright';
const DEAD = 'cursor-not-allowed border-stone-line text-platinum-dim opacity-25';
// The critic is the one control that argues with what is on the page, so it
// carries the same halt red as the objections it produces. Nothing else on the
// card is red until a flag is raised.
const CHALLENGE =
    'cursor-pointer border-halt text-halt-bright hover:border-halt-bright hover:bg-halt/10';

export default function PaperControls({
    score,
    hasCritique,
    openFlags,
    canRun,
    busy,
    failed,
    onRun,
    onCritic,
}: {
    score?: EngineScore;
    hasCritique: boolean;
    openFlags: number;
    canRun: boolean;
    busy: boolean;
    failed: boolean;
    onRun: () => void;
    onCritic: () => void;
}) {
    // A score that has already been challenged is never re-charged.
    const canCritic = Boolean(score && !hasCritique);

    return (
        <div className="flex shrink-0 items-center gap-2">
            {openFlags > 0 && (
                <span className="border border-halt bg-halt/10 px-1.5 py-0.5 font-mono text-[0.52rem] uppercase tracking-[0.14em] text-halt-bright">
                    ⚑ {openFlags}
                </span>
            )}

            {canRun && (
                <button
                    type="button"
                    onClick={onRun}
                    disabled={busy}
                    aria-label={score ? 'Score this paper again' : 'Score this paper'}
                    title={score ? 'Score again' : 'Score this paper'}
                    className={`${CONTROL} ${busy ? DEAD : LIVE}`}
                >
                    ▷
                </button>
            )}

            {canRun && (
                <button
                    type="button"
                    onClick={onCritic}
                    disabled={busy || !canCritic}
                    aria-label="Challenge this score"
                    title={
                        !score
                            ? 'Score it first'
                            : hasCritique
                              ? 'Already challenged'
                              : 'Challenge this score'
                    }
                    className={`${CONTROL} ${busy || !canCritic ? DEAD : CHALLENGE}`}
                >
                    ⚖
                </button>
            )}

            <span className="ml-1 text-right">
                {score ? (
                    <>
                        <span className="block font-serif text-2xl font-light leading-none text-marble">
                            {score.product}
                        </span>
                        <span
                            className={`mt-1 block font-mono text-[0.52rem] uppercase tracking-[0.16em] ${
                                VERDICT_COLOR[score.verdict] ?? 'text-platinum-dim'
                            }`}
                        >
                            {score.verdict}
                        </span>
                    </>
                ) : (
                    <span className="font-mono text-[0.55rem] uppercase tracking-[0.16em] text-platinum-dim">
                        {failed ? 'failed' : '—'}
                    </span>
                )}
            </span>
        </div>
    );
}
