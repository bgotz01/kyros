'use client';

// ─── how the score was reached ───────────────────────────────────────────────
// The card reads in plain language. This shows the reasoning behind it: which
// part of the standing paradigm the paper was measured against, what it put in
// that place, and what the critic made of it.
//
// It deliberately does not enumerate the ceilings. Their arithmetic is the
// instrument's own bookkeeping, and a reader can see what a score means without
// being shown the bounds it was held inside. What is worth showing is the claim
// the analyst made and, where a rule cut it, which rule and why.

import { useEffect } from 'react';
import type { LawDerivation, Paradigm } from '@/lib/paradigm';
import type { StoredScore } from '@/lib/engineStore';
import type { CriticNote } from '@/app/api/engine/critique/route';
import Bullets from './Bullets';

const LAW_LABEL: Record<string, { name: string; symbol: string }> = {
    inversion: { name: 'Inversion', symbol: 'I¹' },
    incentives: { name: 'Incentives', symbol: 'I²' },
    inflection: { name: 'Inflection', symbol: 'I³' },
};

/** The eight layers, with the one this paper was measured against opened. The
 *  others stay as dimmed one-liners: a score means little without seeing where
 *  in the paradigm it landed, and which claims it left alone. */
function TargetedLayer({ paradigm, layerId }: { paradigm: Paradigm; layerId: string }) {
    return (
        <div className="flex flex-col gap-px border border-stone-line bg-stone-line">
            {paradigm.layers.map((l) => {
                const hit = l.layer === layerId;
                return (
                    <div
                        key={l.layer}
                        className={`px-3 py-2 ${hit ? 'bg-charcoal' : 'bg-obsidian-800'}`}
                    >
                        <div className="flex items-baseline gap-3">
                            <span
                                aria-hidden
                                className={`font-mono text-[0.55rem] ${
                                    hit ? 'text-bronze-bright' : 'text-transparent'
                                }`}
                            >
                                ▸
                            </span>
                            <span
                                className={`font-sans text-[0.58rem] uppercase tracking-[0.18em] ${
                                    hit ? 'text-bronze-bright' : 'text-platinum-dim/50'
                                }`}
                            >
                                {l.layer}
                            </span>
                            <span
                                className={`min-w-0 flex-1 truncate font-sans text-[0.64rem] tracking-[0.03em] ${
                                    hit ? 'text-marble' : 'text-platinum-dim/40'
                                }`}
                            >
                                {l.paradigm}
                            </span>
                        </div>
                        {hit && (
                            <p className="mt-2 border-l-2 border-bronze-dim pl-3 font-sans text-[0.68rem] leading-relaxed tracking-[0.03em] text-platinum">
                                {l.assumption}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function Law({
    d,
    bullets,
    note,
    children,
}: {
    d: LawDerivation;
    bullets: string[];
    note?: CriticNote;
    children?: React.ReactNode;
}) {
    const law = LAW_LABEL[d.law];
    const cut = d.final < d.claimed;
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
                <span className="ml-auto font-mono text-[0.7rem]">
                    {(cut || applied) && (
                        <>
                            <span className="text-platinum-dim line-through">{d.claimed}</span>
                            <span className="mx-1.5 text-platinum-dim">→</span>
                        </>
                    )}
                    <span className={applied ? 'text-halt-bright' : 'text-marble'}>{effective}</span>
                </span>
            </div>

            {cut && (
                <p className="mt-1.5 font-sans text-[0.64rem] tracking-[0.03em] text-platinum-dim">
                    The analyst argued for {d.claimed}; {d.boundBy} held it to {d.final}.
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
    const notes = score.critique?.notes ?? [];
    const noteFor = (law: string) => notes.find((n) => n.section === law);
    const delta = score.delta;

    const applied = (law: LawDerivation['law'], fallback: number) => {
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
                    {/* Where in the standing paradigm this landed, and what the
                        paper put in that place. The rest of the modal is a
                        reading of this one contrast. */}
                    {paradigm && delta?.layer && (
                        <section className="px-6 py-5">
                            <div className="mb-3 flex items-baseline gap-3">
                                <span className="font-sans text-[0.5rem] uppercase tracking-[0.24em] text-platinum-dim">
                                    Measured against
                                </span>
                                <span className="ml-auto font-mono text-[0.52rem] uppercase tracking-[0.14em] text-platinum-dim/70">
                                    {paradigm.asOf}
                                </span>
                            </div>

                            <TargetedLayer paradigm={paradigm} layerId={delta.layer} />

                            {delta.proposes && (
                                <div className="mt-3 border border-bronze-dim bg-obsidian-800 px-3 py-2.5">
                                    <span className="block font-sans text-[0.48rem] uppercase tracking-[0.22em] text-bronze">
                                        What the paper proposes instead
                                    </span>
                                    <p className="mt-1.5 font-sans text-[0.7rem] leading-relaxed tracking-[0.03em] text-marble">
                                        {delta.proposes}
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
