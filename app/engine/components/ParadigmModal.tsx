//components/engine/ParadigmModal.tsx
'use client';

// ─── the standing paradigm, for reading ──────────────────────────────────────
// Three collections, one per law: what was normal, what was obviously wrong
// with it, and what already existed. A creation is compared against exactly one
// entry in each, so this modal is the ruler the reader is being shown.
//
// Evidence lives here rather than in the scoring prompt. It is the authoring
// artefact — the guard that kept a claim honest when the snapshot was written —
// and the reader is the one who needs to audit it.

import { useEffect, useState } from 'react';
import SeatPrompts from './SeatPrompts';
import type {
    ParadigmDimension,
    Paradigm,
} from '@/lib/engine/paradigm';

/** Dated references, every one predating the snapshot. This is the hindsight
 *  guard, and the only way a reader can tell a reconstructed claim from a
 *  remembered one. */
function Evidence({ items }: { items: string[] }) {
    if (!items.length) return null;
    return (
        <div>
            <span className="mb-1.5 block font-sans text-[0.5rem] uppercase tracking-[0.24em] text-platinum-dim">
                Evidence · every reference predates the snapshot
            </span>
            <ul className="flex flex-col gap-1">
                {items.map((e) => (
                    <li
                        key={e}
                        className="font-mono text-[0.56rem] leading-relaxed tracking-[0.04em] text-platinum-dim"
                    >
                        {e}
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** One row of a collection. The id is shown because it is what a score selects:
 *  a row reading `baselineId: closed-frontier` means nothing to a reader who
 *  cannot find `closed-frontier` here. */
function Entry({
    id,
    text,
    tag,
    n,
    evidence,
    children,
}: {
    id: string;
    text: string;
    tag?: string;
    n: number;
    evidence?: string[];
    children?: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const expandable = Boolean(evidence?.length || children);

    return (
        <div className="border-t border-stone-line/60">
            <button
                type="button"
                onClick={() => expandable && setOpen((v) => !v)}
                aria-expanded={expandable ? open : undefined}
                disabled={!expandable}
                className="grid w-full grid-cols-[1.6rem_1fr_5rem] items-baseline gap-3 px-6 py-3 text-left"
            >
                <span className="font-mono text-[0.55rem] text-platinum-dim">
                    {String(n).padStart(2, '0')}
                </span>
                <span className="min-w-0">
                    <span className="block font-sans text-[0.7rem] leading-relaxed tracking-[0.03em] text-marble">
                        {text}
                    </span>
                    <span className="mt-1 block font-mono text-[0.52rem] tracking-[0.08em] text-platinum-dim/60">
                        {id}
                    </span>
                </span>
                <span className="text-right font-sans text-[0.5rem] uppercase tracking-[0.16em] text-bronze">
                    {tag ?? ''}
                </span>
            </button>

            {open && (
                <div className="flex flex-col gap-4 border-t border-stone-line/60 bg-obsidian-800 px-6 py-4">
                    {children}
                    <Evidence items={evidence ?? []} />
                </div>
            )}
        </div>
    );
}

/** The three criteria on one force, each labelled with the law that reads it.
 *
 *  All three are shown together because that pairing is the point of the
 *  schema: baseline, incentive and inflection are one force stated three ways,
 *  and splitting them across three lists is what let a row take its I¹ from one
 *  force and its I² from an unrelated bucket. */
function Criteria({ dimension }: { dimension: ParadigmDimension }) {
    const rows = [
        ['I¹', 'Baseline', dimension.baseline, 'what is true now'],
        ['I²', 'Incentive', dimension.incentive, 'what the field is pulling toward'],
        ['I³', 'Inflection', dimension.inflection, 'what would count as one'],
    ] as const;

    return (
        <div className="flex flex-col gap-3">
            {rows.map(([symbol, label, text, note]) => (
                <div key={label} className="grid grid-cols-[1.4rem_1fr] gap-3">
                    <span className="font-serif text-[0.8rem] font-medium leading-none tracking-[0.04em] text-bronze-bright">
                        {symbol}
                    </span>
                    <span className="min-w-0">
                        <span className="block font-sans text-[0.5rem] uppercase tracking-[0.2em] text-bronze">
                            {label} · {note}
                        </span>
                        <span className="mt-1 block font-sans text-[0.7rem] leading-relaxed tracking-[0.03em] text-marble">
                            {text}
                        </span>
                    </span>
                </div>
            ))}
        </div>
    );
}

/** A collection, with the law it answers. */
function Collection({
    symbol,
    title,
    question,
    empty,
    children,
}: {
    symbol: string;
    title: string;
    question: string;
    empty: string;
    children: React.ReactNode[];
}) {
    return (
        <div className="border-t border-stone-line">
            <div className="px-6 py-4">
                <span className="flex items-baseline gap-2.5">
                    <span className="font-serif text-[0.9rem] font-medium leading-none tracking-[0.04em] text-bronze-bright">
                        {symbol}
                    </span>
                    <span className="font-sans text-[0.58rem] uppercase tracking-[0.22em] text-bronze">
                        {title}
                    </span>
                </span>
                <p className="mt-1.5 font-sans text-[0.62rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                    {question}
                </p>
            </div>
            {children.length ? children : (
                <p className="border-t border-stone-line/60 px-6 py-4 font-sans text-[0.66rem] text-platinum-dim">
                    {empty}
                </p>
            )}
        </div>
    );
}

export default function ParadigmModal({
    onClose,
    scoredAgainst,
}: {
    onClose: () => void;
    /** The snapshot the month on screen is measured against, as `YYYY-MM`. The
     *  modal opened on the newest snapshot regardless of what was being read,
     *  so a December 2024 month showed the 2025 paradigm — the one that could
     *  not have existed when those papers were published. */
    scoredAgainst?: string;
}) {
    const [all, setAll] = useState<Paradigm[] | null>(null);
    const [error, setError] = useState(false);
    const [pick, setPick] = useState(0);
    /** The snapshot and the prompts are one context, read on two tabs — the
     *  snapshot is printed INTO the prompt, so this is what a seat saw. */
    const [tab, setTab] = useState<'forces' | 'prompts'>('forces');

    useEffect(() => {
        const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', fn);
        return () => window.removeEventListener('keydown', fn);
    }, [onClose]);

    useEffect(() => {
        fetch('/api/engine/paradigm')
            .then((r) => r.json())
            .then((rows: Paradigm[]) => {
                const list = Array.isArray(rows) ? rows : [];
                setAll(list);
                if (!scoredAgainst) return;
                const i = list.findIndex((row) => row.asOf.slice(0, 7) === scoredAgainst);
                if (i >= 0) setPick(i);
            })
            .catch(() => setError(true));
    }, [scoredAgainst]);

    const p = all?.[pick];
    const isScoringSnapshot = Boolean(p && scoredAgainst && p.asOf.slice(0, 7) === scoredAgainst);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/85 px-6 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal
            aria-label="The standing paradigm"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[85vh] w-full max-w-2xl flex-col border border-stone-line-strong bg-charcoal"
            >
                <header className="flex shrink-0 items-center justify-between border-b border-stone-line px-6 py-4">
                    <div className="flex items-baseline gap-3">
                        <h2 className="font-serif text-lg font-light tracking-wide text-marble">
                            The standing paradigm
                        </h2>
                        {p && (
                            <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-bronze">
                                {p.asOf} · {p.mode}
                            </span>
                        )}
                        {/* Which of these the reading on screen was actually
                            measured against — the others are here to be read in
                            order, not to be scored from. */}
                        {isScoringSnapshot && (
                            <span className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-platinum-dim">
                                scored against
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

                <div className="flex shrink-0 gap-px border-b border-stone-line bg-stone-line">
                    {(['forces', 'prompts'] as const).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTab(t)}
                            className={`flex-1 px-4 py-2.5 font-sans text-[0.6rem] uppercase tracking-[0.24em] transition-colors duration-500 ease-mechanical ${
                                t === tab
                                    ? 'bg-charcoal text-bronze-bright'
                                    : 'bg-obsidian-800 text-platinum-dim hover:text-bronze'
                            }`}
                        >
                            {t === 'forces' ? 'The forces' : 'The prompts'}
                        </button>
                    ))}
                </div>

                {/* More than one snapshot is a time series, not a set of files —
                    the point of dating them is being able to read them in order. */}
                {tab === 'forces' && all && all.length > 1 && (
                    <div className="flex shrink-0 gap-px border-b border-stone-line bg-stone-line">
                        {all.map((row, i) => (
                            <button
                                key={row.asOf}
                                type="button"
                                onClick={() => setPick(i)}
                                className={`flex-1 bg-charcoal px-4 py-2 font-mono text-[0.58rem] tracking-[0.12em] transition-colors duration-500 ease-mechanical ${i === pick
                                        ? 'text-bronze-bright'
                                        : 'text-platinum-dim hover:text-platinum'
                                    }`}
                            >
                                {row.asOf.slice(0, 7)}
                                {row.asOf.slice(0, 7) === scoredAgainst && ' ·'}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    {tab === 'prompts' && <SeatPrompts />}

                    {tab === 'forces' && error && (
                        <p className="px-6 py-6 font-sans text-[0.7rem] tracking-[0.03em] text-platinum-dim">
                            Could not read the paradigm.
                        </p>
                    )}

                    {tab === 'forces' && !all && !error && (
                        <p className="px-6 py-6 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-platinum-dim">
                            Reading…
                        </p>
                    )}

                    {tab === 'forces' && all && all.length === 0 && (
                        <p className="px-6 py-6 font-sans text-[0.7rem] tracking-[0.03em] text-platinum-dim">
                            No snapshots in the corpus yet.
                        </p>
                    )}

                    {tab === 'forces' && p && (
                        <>
                            <div className="flex flex-col gap-3 px-6 py-5">
                                <div>
                                    <span className="mb-1.5 block font-sans text-[0.5rem] uppercase tracking-[0.24em] text-platinum-dim">
                                        Thesis
                                    </span>
                                    <p className="font-sans text-[0.75rem] leading-relaxed tracking-[0.03em] text-marble">
                                        {p.thesis}
                                    </p>
                                </div>
                                
                            </div>

                            <Collection
                                symbol="⬦"
                                title={`The ${p.dimensions.length} forces`}
                                question="Each force is stated three ways — what is true now, what the field is pulling toward, and what change would count as an inflection along it. Every law selects one of these ids, and the three laws need not select the same one. The inflection line was written before any paper was read: the paradigm sets the target, and a creation does not get to define its own."
                                empty="No dimensions in this snapshot. Nothing can be scored against it."
                            >
                                {p.dimensions.map((d: ParadigmDimension, i: number) => (
                                    <Entry
                                        key={d.id}
                                        id={d.id}
                                        text={d.name}
                                        tag={d.id}
                                        n={i + 1}
                                        evidence={d.evidence}
                                    >
                                        <Criteria dimension={d} />
                                    </Entry>
                                ))}
                            </Collection>

                            <p className="border-t border-stone-line px-6 py-4 font-sans text-[0.62rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                                A candidate is judged against the snapshot standing when it was
                                published, never a later one. Nothing here is weighted:{' '}
                                <span className="text-platinum">membership is the judgement</span>, made
                                once when the snapshot was authored. How far a creation moves any of
                                these is decided per creation, on a 0–5 ladder that bounds the score.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
