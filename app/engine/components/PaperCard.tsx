//engine/components/PaperCard.tsx
'use client';

// ─── one paper ────────────────────────────────────────────────────────────────
// A week is read one card at a time, and the card answers four questions in
// this order: what is this, which force does it move, how does it score, why.
//
// It used to answer rather more. The earlier instrument was descriptive enough
// to need a research-analysis dashboard — a contribution taxonomy, a paradigm
// location, a self-reported reading confidence, three separately-opening law
// panels, and the digest sitting at equal weight with the score. Kyros is now
// six forces × three laws, and the card should feel as small as the instrument:
// the measurement is the subject, and the paper's own account of itself is
// context underneath it.

import type { PaperRow } from '@/lib/engine/data';
import type { CriticSection } from '@/app/api/engine/critique/route';
import type { External } from '@/app/api/engine/external/route';
import { allNotes, effectiveScore, noteForSection } from '@/lib/engine/store';
import type { Paradigm } from '@/lib/engine/paradigm';
import Analysis from './Analysis';
import Bullets from './Bullets';
import PaperControls from './PaperControls';
import RepoTag from './RepoTag';
import { LawRow, Panel } from './Disclosure';
import {
    productBand,
    outcomeNote,
    paradigmLocation,
    publicationLabel,
    rankHeadline,
    sourceUrl,
} from './format';
import { DETAIL_FOR, RANKS, heldScore, type FlagState, type RowKey, type RowState } from './types';

export default function PaperCard({
    paper,
    anchored,
    state,
    openRows,
    onToggleRow,
    onOpenNote,
    onRun,
    onCritic,
    onBreakdown,
    onClear,
    onAside,
    external,
    busy,
    paradigm,
}: {
    paper: PaperRow;
    /** This card is the one the path names. */
    anchored?: boolean;
    state: RowState;
    openRows: Record<string, boolean>;
    onToggleRow: (row: RowKey) => void;
    onOpenNote: (section: CriticSection) => void;
    onRun: () => void;
    onCritic: () => void;
    onBreakdown: () => void;
    onClear: () => void;
    /** Take this row out of the reading; restored from the foot of the month. */
    onAside?: () => void;
    external?: External;
    busy: boolean;
    /** The snapshot this row was scored against. Needed to resolve a force an
     *  accepted objection re-selected — without it the id cannot be changed to
     *  one whose words the card cannot show. */
    paradigm?: Paradigm;
}) {
    const stored = heldScore(state);
    // The stored row is the analyst's frozen prediction; what is shown is that
    // row with every accepted correction from EVERY critic round layered over
    // it, oldest first — so a second seat builds on the first rather than
    // replacing it.
    const notes = stored ? allNotes(stored) : [];
    const score = stored ? effectiveScore(stored, notes, paradigm) : undefined;
    const reading = state.status === 'running';

    // The newest reading of a section is the one that stands, so that is the
    // note the flag reflects.
    function flagFor(section: CriticSection): FlagState | undefined {
        const note = stored ? noteForSection(stored, section) : undefined;
        if (!note || note.agrees) return undefined;
        return note.resolution ?? 'open';
    }

    const openFlags = notes.filter((n) => !n.agrees && !n.resolution).length;
    const canRun = Boolean(paper.id && paper.held);

    return (
        <article
            id={paper.id ? `paper-${paper.id}` : undefined}
            className={`border bg-charcoal transition-colors duration-500 ease-mechanical scroll-mt-[12.5rem] ${reading ? 'border-bronze-dim' : anchored ? 'border-bronze' : 'border-stone-line'
                }`}
        >
            {/* The instrument is reading this paper. */}
            {reading && <div className="kyros-sweep h-px w-full bg-stone-line" />}

            <header className="flex items-start justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                    <span className="flex items-baseline gap-2.5">
                        <span className="min-w-0 truncate font-sans text-[0.8rem] tracking-[0.03em] text-marble">
                            {paper.title}
                        </span>
                    </span>
                    {/* Two lines: what the paper is, then whether it shipped.
                        The artefact gets a line of its own so its label sits at
                        the same x on every card and a month can be scanned
                        straight down it. */}
                    <span className="mt-1.5 flex flex-col gap-1 font-mono text-[0.55rem] tracking-[0.12em] text-platinum-dim">
                        <span className="flex items-baseline gap-3">
                            <span className="w-[9.5rem] shrink-0 truncate">
                                {paper.id ? (
                                    <a
                                        href={sourceUrl(paper)}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="transition-colors duration-300 ease-mechanical hover:text-bronze-bright"
                                    >
                                        ARXIV:{paper.id} ↗
                                    </a>
                                ) : sourceUrl(paper) ? (
                                    <a
                                        href={sourceUrl(paper)}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="transition-colors duration-300 ease-mechanical hover:text-bronze-bright"
                                    >
                                        {paper.host ?? 'SOURCE'} ↗
                                    </a>
                                ) : (
                                    `NO ID · ${paper.host ?? 'UNKNOWN'}`
                                )}
                            </span>

                            <span className="min-w-0 truncate">
                                {paper.published && (
                                    <span className="border border-stone-line px-1.5 py-px text-[0.5rem] text-platinum-dim">
                                        PUBLISHED {publicationLabel(paper.published)}
                                    </span>
                                )}
                                {!paper.held && paper.id && ' · NOT PULLED'}
                                {score?.truncated && ' · TRUNCATED'}
                                {reading && (
                                    <span className="kyros-reading ml-2 text-bronze">
                                        {state.stage === 'critic' ? 'CHALLENGING' : 'READING'}
                                    </span>
                                )}
                            </span>
                        </span>

                        <RepoTag external={external} />
                    </span>
                </div>


                <PaperControls
                    onAside={onAside}
                    score={score}
                    hasCritique={Boolean(stored?.critiques?.length)}
                    openFlags={openFlags}
                    canRun={canRun}
                    busy={busy}
                    failed={state.status === 'error'}
                    onRun={onRun}
                    onCritic={onCritic}
                    onBreakdown={onBreakdown}
                    onClear={onClear}
                />
            </header>

            {state.status === 'error' && (
                <p className="border-t border-stone-line px-5 py-3 font-sans text-[0.68rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                    {state.message}
                </p>
            )}

            {score && (
                <div className="border-t border-stone-line">
                    {/* Which force, where in the stack, and what the score
                        amounts to — what places a row before any reasoning. */}
                    <div className="flex items-baseline justify-between gap-4 px-5 py-2.5">
                        <span className="min-w-0">
                            <span className="block font-sans text-[0.55rem] uppercase tracking-[0.22em] text-bronze">
                                {paradigmLocation(score)}
                            </span>
                            {score.corePremise && (
                                <span className="mt-1 block font-sans text-[0.7rem] leading-relaxed tracking-[0.03em] text-marble">
                                    {score.corePremise}
                                </span>
                            )}
                        </span>
                        {/* What the product MEANS, on the same right edge as the
                            number itself — which lives in the header, where it
                            is the button that opens the derivation. Repeating
                            the figure here said it twice and explained it once. */}
                        <span className="shrink-0 text-right font-sans text-[0.46rem] uppercase tracking-[0.2em] text-platinum-dim">
                            {productBand(score.product)}
                        </span>
                    </div>

                    {/* The three laws, always visible. They are what the reader
                        came for; nothing should have to be opened to see them. */}
                    <div className="border-t border-stone-line/60 py-1.5">
                        {RANKS.map((r) => (
                            <LawRow
                                key={r.key}
                                law={r.key}
                                label={r.label}
                                symbol={r.symbol}
                                value={score[r.key].score}
                                words={rankHeadline(score, r.key)}
                                note={r.key === 'incentives' ? outcomeNote(score) : undefined}
                                flag={flagFor(DETAIL_FOR[r.key])}
                                onFlag={() => onOpenNote(DETAIL_FOR[r.key])}
                            />
                        ))}
                    </div>

                    <Panel
                        label="Analysis"
                        open={Boolean(openRows.analysis)}
                        onToggle={() => onToggleRow('analysis')}
                    >
                        <Analysis score={score} />
                    </Panel>

                    {/* The paper's own account of itself, and the third party's.
                        Context for the measurement, not a peer of it. */}
                    <Panel
                        label="Context"
                        open={Boolean(openRows.context)}
                        onToggle={() => onToggleRow('context')}
                        flag={flagFor('summary')}
                        onFlag={() => onOpenNote('summary')}
                    >
                        <div className="flex flex-col gap-4">
                            <div>
                                <span className="mb-1.5 block font-sans text-[0.46rem] uppercase tracking-[0.22em] text-platinum-dim">
                                    What it does
                                </span>
                                <Bullets items={score.summary} />
                            </div>

                            {score.previousParadigm && (
                                <div>
                                    <span className="mb-1.5 block font-sans text-[0.46rem] uppercase tracking-[0.22em] text-platinum-dim">
                                        What it pushes against
                                    </span>
                                    <p className="font-sans text-[0.68rem] leading-relaxed tracking-[0.03em] text-platinum">
                                        {score.previousParadigm}
                                    </p>
                                </div>
                            )}

                            {paper.digest.lede && (
                                <div>
                                    <span className="mb-1.5 block font-sans text-[0.46rem] uppercase tracking-[0.22em] text-platinum-dim">
                                        Digest summary
                                    </span>
                                    <p className="font-sans text-[0.68rem] leading-relaxed tracking-[0.03em] text-platinum">
                                        {paper.digest.lede}
                                    </p>
                                    {paper.digest.points.length > 0 && (
                                        <div className="mt-2">
                                            <Bullets items={paper.digest.points} muted />
                                        </div>
                                    )}
                                </div>
                            )}

                            {paper.links.length > 0 && (
                                <div className="flex gap-4">
                                    {paper.links.map((l) => (
                                        <a
                                            key={l.url}
                                            href={l.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-mono text-[0.55rem] uppercase tracking-[0.16em] text-bronze transition-colors duration-500 ease-mechanical hover:text-bronze-bright"
                                        >
                                            {l.label} ↗
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Panel>
                </div>
            )}

        </article>
    );
}
