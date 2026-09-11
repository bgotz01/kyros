'use client';

import { useEffect } from 'react';
import type { CriticNote } from '@/app/api/engine/critique/route';
import Bullets from './Bullets';
import Comparison from './Comparison';
import { LAWS } from './types';

/** One objection, opened from the flag on its row. The decision taken here is
 *  recorded on the note — the analyst's stored score is never rewritten. */
export default function CriticModal({
    note,
    currentScore,
    currentBullets,
    currentForce,
    onApply,
    onDismiss,
    onRevert,
    round,
    criticModel,
    onClose,
}: {
    note: CriticNote;
    currentScore?: number;
    /** What the row says now, so the modal can show what an objection actually
     *  CHANGES rather than only what it proposes. A third of objections in the
     *  ledger move neither the score nor the force — they replace prose — and
     *  presented as "8 → 8" they read as a no-op. */
    currentBullets?: string[];
    currentForce?: string | null;
    onApply: () => void;
    onDismiss: () => void;
    /** Undo a decision, putting the analyst's original score back. Absent while
     *  the note is still open, where there is nothing to undo. */
    onRevert?: () => void;
    /** Which pass raised this, and which seat. Rounds stack, so "round 2 ·
     *  claude-sonnet-5" is the difference between a fresh objection and one that
     *  is already reflected in the row above it. */
    round?: number;
    criticModel?: string;
    onClose: () => void;
}) {
    useEffect(() => {
        const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', fn);
        return () => window.removeEventListener('keydown', fn);
    }, [onClose]);

    const law = LAWS.find((l) => l.key === note.section);

    // What this objection would actually do, field by field.
    const movesScore =
        note.proposedScore !== undefined
        && currentScore !== undefined
        && note.proposedScore !== currentScore;
    const movesForce =
        Boolean(note.proposedId) && note.proposedId !== (currentForce ?? undefined);
    const movesProse = Boolean(note.proposedBullets?.length);
    const proseOnly = !movesScore && !movesForce && movesProse;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/85 px-6 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal
            aria-label="Critic objection"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[85vh] w-full max-w-xl flex-col border border-stone-line-strong bg-charcoal"
            >
                <header className="flex shrink-0 items-center justify-between border-b border-stone-line px-6 py-4">
                    <div className="flex items-baseline gap-3">
                        <h2 className="font-serif text-lg font-light tracking-wide text-marble">
                            Critic objects
                        </h2>
                        <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-bronze">
                            {law ? `${law.symbol} · ${law.name}` : note.section}
                        </span>
                        {round !== undefined && (
                            <span className="font-mono text-[0.52rem] uppercase tracking-[0.14em] text-platinum-dim">
                                round {round}
                                {criticModel ? ` · ${criticModel}` : ''}
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="font-sans text-[0.6rem] uppercase tracking-[0.28em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:text-bronze-bright"
                    >
                        Close
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto">
                    {/* What changes, stated before the argument for it. */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-stone-line px-6 py-4">
                        {movesScore ? (
                            <>
                                <div>
                                    <span className="block font-sans text-[0.52rem] uppercase tracking-[0.24em] text-platinum-dim">
                                        Analyst
                                    </span>
                                    <span className="font-serif text-2xl font-light text-marble">
                                        {currentScore}
                                    </span>
                                </div>
                                <span aria-hidden className="font-mono text-sm text-platinum-dim">
                                    →
                                </span>
                                <div>
                                    <span className="block font-sans text-[0.52rem] uppercase tracking-[0.24em] text-platinum-dim">
                                        Critic
                                    </span>
                                    <span className="font-serif text-2xl font-light text-bronze-bright">
                                        {note.proposedScore}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div>
                                <span className="block font-sans text-[0.52rem] uppercase tracking-[0.24em] text-platinum-dim">
                                    Score
                                </span>
                                <span className="font-serif text-2xl font-light text-marble">
                                    {currentScore ?? '—'}
                                    <span className="ml-2 font-sans text-[0.6rem] uppercase tracking-[0.2em] text-platinum-dim">
                                        unchanged
                                    </span>
                                </span>
                            </div>
                        )}

                        {movesForce && (
                            <div>
                                <span className="block font-sans text-[0.52rem] uppercase tracking-[0.24em] text-platinum-dim">
                                    Force
                                </span>
                                <span className="font-mono text-[0.7rem] tracking-[0.1em] text-marble">
                                    {currentForce ?? '—'}
                                    <span className="mx-2 text-platinum-dim">→</span>
                                    <span className="text-bronze-bright">{note.proposedId}</span>
                                </span>
                            </div>
                        )}

                        <span className="ml-auto font-sans text-[0.55rem] uppercase tracking-[0.2em] text-platinum-dim">
                            {proseOnly
                                ? 'Rewording only'
                                : [movesScore && 'score', movesForce && 'force', movesProse && 'wording']
                                      .filter(Boolean)
                                      .join(' · ')}
                        </span>
                    </div>

                    <div className="border-b border-stone-line px-6 py-4">
                        <span className="mb-2 block font-sans text-[0.52rem] uppercase tracking-[0.24em] text-platinum-dim">
                            Reasoning
                        </span>
                        <Bullets items={note.reasoning} />
                    </div>

                    {movesProse && (
                        <div className="px-6 py-4">
                            <span className="mb-2 block font-sans text-[0.52rem] uppercase tracking-[0.24em] text-platinum-dim">
                                {currentBullets?.length ? 'Wording' : 'Proposed replacement'}
                            </span>
                            {/* Against what it replaces. A replacement shown alone
                                cannot be judged — the question is always whether
                                it is better than the line already there. */}
                            {currentBullets?.length ? (
                                <Comparison
                                    previous={currentBullets}
                                    proposed={note.proposedBullets ?? []}
                                />
                            ) : (
                                <Bullets items={note.proposedBullets ?? []} />
                            )}
                        </div>
                    )}
                </div>

                <footer className="flex shrink-0 items-center gap-3 border-t border-stone-line px-6 py-4">
                    {/* A decision is reversible. The analyst's row is the frozen
                        prediction and is never overwritten, so reverting is just
                        dropping the layer on top of it — and a correction you
                        cannot take back is one you hesitate to make. */}
                    {onRevert && note.resolution && (
                        <button
                            type="button"
                            onClick={onRevert}
                            className="mr-auto border border-stone-line px-4 py-2 font-sans text-[0.6rem] uppercase tracking-[0.24em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:border-stone-line-strong hover:text-platinum"
                        >
                            Revert score
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="border border-stone-line px-4 py-2 font-sans text-[0.6rem] uppercase tracking-[0.24em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:border-stone-line-strong hover:text-platinum"
                    >
                        Dismiss
                    </button>
                    <button
                        type="button"
                        onClick={onApply}
                        className="border border-bronze-dim px-4 py-2 font-sans text-[0.6rem] uppercase tracking-[0.24em] text-bronze transition-colors duration-500 ease-mechanical hover:border-bronze hover:text-bronze-bright"
                    >
                        Apply changes
                    </button>
                </footer>
            </div>
        </div>
    );
}
