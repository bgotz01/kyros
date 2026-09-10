'use client';

// ─── card controls ────────────────────────────────────────────────────────────
// The three passes a paper can be put through, and the score they produce.
// ▷ analyst · ⚖ critic · ★ repository.
//
// A score is never overwritten. Once a paper holds one, ▷ goes dead and CLEAR
// appears beside it: reading a paper a second time is a deliberate act on that
// row, not something a second press can do by accident.

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
const CLEAR =
    'cursor-pointer border-stone-line text-platinum-dim hover:border-halt hover:text-halt-bright';
// Setting a row aside destroys nothing, so it is the one control that stays
// quiet on hover — it must not read like CLEAR, which does.
const ASIDE =
    'cursor-pointer border-stone-line text-platinum-dim hover:border-platinum hover:text-platinum';

export default function PaperControls({
    score,
    hasCritique,
    openFlags,
    canRun,
    busy,
    failed,
    onRun,
    onCritic,
    onClear,
    onAside,
    onBreakdown,
}: {
    score?: EngineScore;
    hasCritique: boolean;
    openFlags: number;
    canRun: boolean;
    busy: boolean;
    failed: boolean;
    onRun: () => void;
    onCritic: () => void;
    onBreakdown: () => void;
    onClear: () => void;
    /** Take the row out of the reading. Absent where there is nowhere to put
     *  it — the list at the foot of the month is what makes this reversible. */
    onAside?: () => void;
}) {
    // A score can be challenged as often as you like — the point of changing the
    // critic seat is to see whether a different model objects differently. Each
    // run replaces the last, and each one is charged.
    const canCritic = Boolean(score);

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
                    disabled={busy || Boolean(score)}
                    aria-label="Score this paper"
                    title={score ? 'Already read — clear it to read it again' : 'Score this paper'}
                    className={`${CONTROL} ${busy || score ? DEAD : LIVE}`}
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
                              ? 'Challenge again — replaces the current critique'
                              : 'Challenge this score'
                    }
                    className={`${CONTROL} ${busy || !canCritic ? DEAD : CHALLENGE}`}
                >
                    ⚖
                </button>
            )}

            {score && (
                <button
                    type="button"
                    onClick={onClear}
                    disabled={busy}
                    aria-label="Clear this paper's saved results"
                    title="Clear saved results"
                    className={`${CONTROL} ${busy ? DEAD : CLEAR}`}
                >
                    CLEAR
                </button>
            )}

            {onAside && (
                <button
                    type="button"
                    onClick={onAside}
                    disabled={busy}
                    aria-label="Set this paper aside"
                    title="Set aside — moves it to the foot of the month. Nothing is deleted."
                    className={`${CONTROL} ${busy ? DEAD : ASIDE}`}
                >
                    ASIDE
                </button>
            )}

            <span className="ml-1 text-right">
                {score ? (
                    /* The number is the control: "how did we get this?" is the
                       question it prompts, so it is the thing you click. */
                    <button
                        type="button"
                        onClick={onBreakdown}
                        aria-label="How this score was reached"
                        title="How this score was reached"
                        className="block cursor-pointer text-right transition-colors duration-300 ease-mechanical hover:text-bronze-bright"
                    >
                        <span className="block font-serif text-2xl font-light leading-none text-marble transition-colors duration-300 ease-mechanical hover:text-bronze-bright">
                            {score.product}
                        </span>
                        <span
                            className={`mt-1 block font-mono text-[0.52rem] uppercase tracking-[0.16em] ${
                                VERDICT_COLOR[score.verdict] ?? 'text-platinum-dim'
                            }`}
                        >
                            {score.verdict}
                        </span>
                    </button>
                ) : (
                    <span className="font-mono text-[0.55rem] uppercase tracking-[0.16em] text-platinum-dim">
                        {failed ? 'failed' : '—'}
                    </span>
                )}
            </span>
        </div>
    );
}
