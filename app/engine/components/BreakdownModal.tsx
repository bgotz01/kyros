'use client';

// ─── how the score was reached ───────────────────────────────────────────────
// The card reads in plain language. This shows the reasoning behind it: which
// part of the standing paradigm the paper was measured against, what it put in
// that place, and what the critic made of it.
//
// Every law is one comparison against one collection in the sealed snapshot, so
// the modal opens with the three objects the row selected — the baseline claim
// it contradicts, the pressure it acts on, the closest thing that already
// existed. Those selections are the score; the numbers beneath them are a
// reading of them.

import { useEffect } from 'react';
import {
    dimensionOf,
    isLevelDerivation,
    type AnyDerivation,
    type LawId,
    type Paradigm,
} from '@/lib/engine/paradigm';
import { allNotes, type StoredScore } from '@/lib/engine/store';
import type { CriticNote } from '@/app/api/engine/critique/route';
import Bullets from './Bullets';
import { lawScale, levelRubric } from './format';

const LAW_LABEL: Record<string, { name: string; symbol: string }> = {
    inversion: { name: 'Inversion', symbol: 'I¹' },
    incentives: { name: 'Incentives', symbol: 'I²' },
    inflection: { name: 'Inflection', symbol: 'I³' },
};

/** One selection: the id the row picked, and the snapshot's own words for it.
 *  An unmatched selection is shown as such rather than hidden — on I³ a null is
 *  a claim the row had to argue, and on I¹ it means nothing standing was
 *  contradicted. Both are findings, and both should be visible. */
function Selected({
    law,
    symbol,
    heading,
    id,
    text,
    empty,
}: {
    law: LawId;
    symbol: string;
    heading: string;
    id: string | null;
    text: string;
    empty: string;
}) {
    return (
        <div className={`px-3 py-2.5 ${id ? 'bg-charcoal' : 'bg-obsidian-800'}`} data-law={law}>
            <div className="flex items-baseline gap-2.5">
                <span className="font-serif text-[0.8rem] font-medium leading-none tracking-[0.04em] text-bronze-bright">
                    {symbol}
                </span>
                <span className="font-sans text-[0.48rem] uppercase tracking-[0.22em] text-platinum-dim">
                    {heading}
                </span>
                {id && (
                    <span className="ml-auto truncate font-mono text-[0.52rem] tracking-[0.08em] text-platinum-dim/60">
                        {id}
                    </span>
                )}
            </div>
            <p
                className={`mt-1.5 font-sans text-[0.68rem] leading-relaxed tracking-[0.03em] ${
                    id ? 'text-marble' : 'text-platinum-dim/60'
                }`}
            >
                {id ? text || id : empty}
            </p>
        </div>
    );
}

function Law({
    d,
    bullets,
    note,
    children,
}: {
    d: AnyDerivation;
    bullets: string[];
    note?: CriticNote;
    children?: React.ReactNode;
}) {
    const law = LAW_LABEL[d.law];
    // A row is only "moved" where the analyst wrote a number of its own to move.
    // Scope-instrument rows do not: the score is derived from level and scope,
    // so there is no claim to strike through.
    const moved = d.claimed !== undefined && d.final !== d.claimed;
    const levelled = isLevelDerivation(d);
    const scope = levelled ? d.scope : undefined;
    const applied =
        note && !note.agrees && note.resolution === 'applied' && note.proposedScore !== undefined;
    const effective = applied ? note!.proposedScore! : d.final;

    return (
        <section className="border-t border-stone-line px-6 py-5">
            <div className="flex items-baseline gap-3">
                <span className="font-sans text-[0.6rem] uppercase tracking-[0.18em] text-platinum-dim">
                    {law.name}
                </span>
                <span className="font-serif text-[0.95rem] font-medium leading-none tracking-[0.04em] text-bronze-bright">
                    {law.symbol}
                </span>
                {levelled && d.level !== undefined && d.band && (
                    <span className="font-mono text-[0.52rem] uppercase tracking-[0.14em] text-platinum-dim">
                        level {d.level} · band {d.band[0] === d.band[1] ? d.band[0] : d.band.join('–')}
                        {scope && ` · ${scope}`}
                    </span>
                )}
                <span className="ml-auto font-mono text-[0.7rem]">
                    {(moved || applied) && (
                        <>
                            <span className="text-platinum-dim line-through">{d.claimed}</span>
                            <span className="mx-1.5 text-platinum-dim">→</span>
                        </>
                    )}
                    <span className={applied ? 'text-halt-bright' : 'text-marble'}>{effective}</span>
                </span>
            </div>

            {levelled && d.level !== undefined && (
                <p className="mt-1.5 font-sans text-[0.64rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                    Classified <span className="text-marble">{levelRubric(d.law, d.level)}</span>
                    {scope
                        ? `, on ${scope} evidence — the retired scope instrument, which placed it at ${d.final}.`
                        : moved
                          ? d.final < d.claimed!
                              ? `, so the analyst's ${d.claimed} was held down to ${d.final}.`
                              : `, so the analyst's ${d.claimed} was raised to ${d.final} — a score below its own classification.`
                          : `, which scores ${d.final}.`}
                </p>
            )}

            {levelled && d.level === undefined && d.score !== undefined && (
                <p className="mt-1.5 font-sans text-[0.64rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                    Scored <span className="text-marble">{d.final}</span> —{' '}
                    <span className="text-marble">{lawScale(d.law, d.score)}</span>
                </p>
            )}

            {!levelled && moved && (
                <p className="mt-1.5 font-sans text-[0.64rem] tracking-[0.03em] text-platinum-dim">
                    The analyst argued for {d.claimed}; {d.boundBy} held it to {d.final}. Scored
                    under the retired layer instrument.
                </p>
            )}

            {children}

            {bullets.length > 0 && (
                <div className="mt-3">
                    <Bullets items={bullets} muted />
                </div>
            )}

            {note && !note.agrees && note.proposedScore !== undefined && (
                <div className="mt-3 border border-halt/50 bg-halt/5 px-3 py-2.5">
                    <span className="block font-sans text-[0.5rem] uppercase tracking-[0.24em] text-halt-bright">
                        Critic · {note.resolution ?? 'awaiting a decision'}
                    </span>
                    <p className="mt-1.5 font-sans text-[0.66rem] leading-relaxed tracking-[0.03em] text-platinum">
                        Proposed {note.proposedScore} in place of {d.final}.
                        {note.resolution === 'applied' && ' Accepted, so the row reads it.'}
                        {note.resolution === 'dismissed' && ' Dismissed, so the analyst stands.'}
                        {!note.resolution && ' Not yet decided, so the analyst stands for now.'}
                    </p>
                </div>
            )}
        </section>
    );
}

export default function BreakdownModal({
    score,
    paradigm,
    onClose,
}: {
    score: StoredScore;
    /** The sealed snapshot this row was judged against, when one covers it. */
    paradigm?: Paradigm;
    onClose: () => void;
}) {
    useEffect(() => {
        const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', fn);
        return () => window.removeEventListener('keydown', fn);
    }, [onClose]);

    const rows = score.derivation ?? [];
    const notes = allNotes(score);
    const noteFor = (law: string) => notes.find((n) => n.section === law);

    const applied = (law: LawId, fallback: number) => {
        const n = noteFor(law);
        return n && !n.agrees && n.resolution === 'applied' && n.proposedScore !== undefined
            ? n.proposedScore
            : fallback;
    };
    const effI1 = applied('inversion', score.inversion.score);
    const effI2 = applied('incentives', score.incentives.score);
    const effI3 = applied('inflection', score.inflection.score);
    const effProduct = effI1 * effI2 * effI3;

    const bulletsFor: Record<string, string[]> = {
        inversion: score.inversion.inverting,
        incentives: score.incentives.bottleneck,
        inflection: score.inflection.unprecedented,
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/85 px-6 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal
            aria-label="How the score was reached"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[85vh] w-full max-w-2xl flex-col border border-stone-line-strong bg-charcoal"
            >
                <header className="flex shrink-0 items-start justify-between gap-4 border-b border-stone-line px-6 py-4">
                    <div className="min-w-0">
                        <h2 className="font-serif text-lg font-light tracking-wide text-marble">
                            How this score was reached
                        </h2>
                        <p className="mt-0.5 truncate font-mono text-[0.58rem] tracking-[0.1em] text-platinum-dim">
                            {score.title}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 font-sans text-[0.6rem] uppercase tracking-[0.28em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:text-bronze-bright"
                    >
                        Close
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto">
                    {/* The three objects this row selected out of the sealed
                        snapshot. Every law is a comparison against one of them,
                        so this is the score before it becomes a number. */}
                    {paradigm && (
                        <section className="px-6 py-5">
                            <div className="mb-3 flex items-baseline gap-3">
                                <span className="font-sans text-[0.5rem] uppercase tracking-[0.24em] text-platinum-dim">
                                    Measured against
                                </span>
                                <span className="ml-auto font-mono text-[0.52rem] uppercase tracking-[0.14em] text-platinum-dim/70">
                                    {paradigm.asOf}
                                </span>
                            </div>

                            <div className="flex flex-col gap-px border border-stone-line bg-stone-line">
                                <Selected
                                    law="inversion"
                                    symbol="I¹"
                                    heading="Baseline it contradicts"
                                    id={score.inversion.dimensionId}
                                    text={
                                        (score.inversion.dimensionId
                                            && dimensionOf(paradigm, score.inversion.dimensionId)?.baseline)
                                        || score.inversion.baseline
                                    }
                                    empty="No standing baseline claim was contradicted."
                                />
                                <Selected
                                    law="incentives"
                                    symbol="I²"
                                    heading="Pressure it acts on"
                                    id={score.incentives.dimensionId}
                                    text={
                                        (score.incentives.dimensionId
                                            && dimensionOf(paradigm, score.incentives.dimensionId)?.incentive)
                                        || score.incentives.incentive
                                    }
                                    empty="No standing pressure was acted on."
                                />
                                <Selected
                                    law="inflection"
                                    symbol="I³"
                                    heading="Closest thing that existed"
                                    id={score.inflection.dimensionId}
                                    text={
                                        (score.inflection.dimensionId
                                            && dimensionOf(paradigm, score.inflection.dimensionId)?.inflection)
                                        || score.inflection.criterion
                                    }
                                    empty="Nothing in the snapshot is meaningfully prior art."
                                />
                            </div>

                            {score.corePremise && (
                                <div className="mt-3 border border-bronze-dim bg-obsidian-800 px-3 py-2.5">
                                    <span className="block font-sans text-[0.48rem] uppercase tracking-[0.22em] text-bronze">
                                        What the paper proposes instead
                                    </span>
                                    <p className="mt-1.5 font-sans text-[0.7rem] leading-relaxed tracking-[0.03em] text-marble">
                                        {score.corePremise}
                                    </p>
                                </div>
                            )}
                        </section>
                    )}

                    {rows.length === 0 ? (
                        <p className="border-t border-stone-line px-6 py-6 font-sans text-[0.7rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                            This row was scored before the reasoning was recorded. Score it again to
                            see how each law was reached.
                        </p>
                    ) : (
                        rows.map((d) => (
                            <Law
                                key={d.law}
                                d={d}
                                bullets={bulletsFor[d.law] ?? []}
                                note={noteFor(d.law)}
                            />
                        ))
                    )}

                    <section className="border-t border-stone-line px-6 py-5">
                        <div className="flex items-baseline gap-3">
                            <span className="font-sans text-[0.6rem] uppercase tracking-[0.18em] text-platinum-dim">
                                Product
                            </span>
                            <span className="ml-auto font-serif text-xl font-light leading-none text-marble">
                                {effProduct}
                            </span>
                        </div>
                        <p className="mt-1.5 font-mono text-[0.6rem] tracking-[0.08em] text-platinum-dim">
                            {effI1} × {effI2} × {effI3} = {effProduct}
                        </p>
                        {effProduct !== score.product && (
                            <p className="mt-1 font-mono text-[0.58rem] tracking-[0.08em] text-halt-bright">
                                analyst read {score.product} · accepted corrections bring it to{' '}
                                {effProduct}
                            </p>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
