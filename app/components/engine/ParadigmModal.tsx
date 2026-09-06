//components/engine/ParadigmModal.tsx
'use client';

// ─── the standing paradigm, for reading ──────────────────────────────────────
// What the field held to be true and what constrained it on a given date. I¹ is
// measured against the eight layer assumptions; I² against the dated
// bottlenecks and their explicit conditions for meaningful relief.

import { useEffect, useState } from 'react';
import type { Paradigm, ParadigmBottleneck, ParadigmLayer } from '@/lib/paradigm';

/** A layer's shares as one hairline bar. Bronze for the incumbent, dimmer for
 *  everything living in its shadow — concentration should be visible at a
 *  glance, because it is what makes an assumption load-bearing. */
function Shares({ layer }: { layer: ParadigmLayer }) {
    const d = layer.distribution;
    if (!d) {
        return (
            <p className="font-sans text-[0.62rem] tracking-[0.03em] text-platinum-dim">
                No defensible share at this date.
            </p>
        );
    }
    const sorted = [...d.entries].sort((a, b) => b.share - a.share);
    return (
        <div className="flex flex-col gap-2">
            <span aria-hidden className="flex h-1 w-full items-center gap-px">
                {sorted.map((e, i) => (
                    <span
                        key={e.value}
                        className="h-1 transition-[width] duration-700 ease-mechanical"
                        style={{
                            width: `${e.share * 100}%`,
                            background: i === 0 ? 'var(--color-bronze)' : 'var(--color-bronze-dim)',
                            opacity: i === 0 ? 1 : 0.55 - i * 0.12,
                        }}
                    />
                ))}
            </span>
            <p className="font-mono text-[0.58rem] tracking-[0.06em] text-platinum-dim">
                {sorted.map((e, i) => (
                    <span key={e.value}>
                        {i > 0 && ' · '}
                        <span className={i === 0 ? 'text-marble' : undefined}>{e.value}</span>{' '}
                        {Math.round(e.share * 100)}%
                    </span>
                ))}
            </p>
            <p className="font-sans text-[0.55rem] uppercase tracking-[0.16em] text-platinum-dim/70">
                {d.basis}
            </p>
        </div>
    );
}

function Layer({ layer, n }: { layer: ParadigmLayer; n: number }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-t border-stone-line/60">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="grid w-full grid-cols-[1.6rem_1fr_2.5rem] items-baseline gap-3 px-6 py-3 text-left"
            >
                <span className="font-mono text-[0.55rem] text-platinum-dim">
                    {String(n).padStart(2, '0')}
                </span>
                <span className="min-w-0">
                    <span className="block font-sans text-[0.6rem] uppercase tracking-[0.18em] text-bronze">
                        {layer.layer}
                    </span>
                    <span className="mt-1 block truncate font-sans text-[0.7rem] tracking-[0.03em] text-marble">
                        {layer.paradigm}
                    </span>
                </span>
                <span className="text-right font-mono text-[0.62rem] text-marble">
                    {layer.importance}
                    <span className="text-platinum-dim">/10</span>
                </span>
            </button>

            {open && (
                <div className="flex flex-col gap-4 border-t border-stone-line/60 bg-obsidian-800 px-6 py-4">
                    <div>
                        <span className="mb-1.5 block font-sans text-[0.5rem] uppercase tracking-[0.24em] text-platinum-dim">
                            Assumption
                        </span>
                        <p className="border-l-2 border-bronze-dim pl-3 font-sans text-[0.72rem] leading-relaxed tracking-[0.03em] text-marble-dim">
                            {layer.assumption}
                        </p>
                    </div>

                    <div>
                        <span className="mb-1.5 block font-sans text-[0.5rem] uppercase tracking-[0.24em] text-platinum-dim">
                            Distribution
                        </span>
                        <Shares layer={layer} />
                    </div>

                    <div>
                        <span className="mb-1.5 block font-sans text-[0.5rem] uppercase tracking-[0.24em] text-platinum-dim">
                            Frontier
                        </span>
                        {layer.frontier.length === 0 ? (
                            <p className="font-sans text-[0.66rem] tracking-[0.03em] text-platinum-dim">
                                Nothing credible being pursued at this date.
                            </p>
                        ) : (
                            <ul className="flex flex-col gap-1.5">
                                {layer.frontier.map((f) => (
                                    <li key={f} className="flex gap-2">
                                        <span aria-hidden className="mt-[0.45em] h-px w-2 shrink-0 bg-bronze-dim" />
                                        <span className="font-sans text-[0.66rem] leading-relaxed tracking-[0.03em] text-platinum">
                                            {f}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div>
                        <span className="mb-1.5 block font-sans text-[0.5rem] uppercase tracking-[0.24em] text-platinum-dim">
                            Evidence · every reference predates the snapshot
                        </span>
                        <ul className="flex flex-col gap-1">
                            {layer.evidence.map((e) => (
                                <li
                                    key={e}
                                    className="font-mono text-[0.56rem] leading-relaxed tracking-[0.04em] text-platinum-dim"
                                >
                                    {e}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

function Bottleneck({ bottleneck, n }: { bottleneck: ParadigmBottleneck; n: number }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-t border-stone-line/60">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="grid w-full grid-cols-[1.6rem_1fr_5.5rem_2.5rem] items-baseline gap-3 px-6 py-3 text-left"
            >
                <span className="font-mono text-[0.55rem] text-platinum-dim">
                    {String(n).padStart(2, '0')}
                </span>
                <span className="truncate font-sans text-[0.68rem] tracking-[0.03em] text-marble">
                    {bottleneck.name}
                </span>
                <span className="truncate text-right font-mono text-[0.5rem] uppercase tracking-[0.08em] text-bronze">
                    {bottleneck.status}
                </span>
                <span className="text-right font-mono text-[0.62rem] text-marble">
                    {bottleneck.importance}
                    <span className="text-platinum-dim">/10</span>
                </span>
            </button>

            {open && (
                <div className="flex flex-col gap-4 border-t border-stone-line/60 bg-obsidian-800 px-6 py-4">
                    <div>
                        <span className="mb-1.5 block font-sans text-[0.5rem] uppercase tracking-[0.24em] text-platinum-dim">
                            The problem
                        </span>
                        <p className="border-l-2 border-bronze-dim pl-3 font-sans text-[0.7rem] leading-relaxed tracking-[0.03em] text-marble-dim">
                            {bottleneck.problem}
                        </p>
                    </div>
                    <div>
                        <span className="mb-1.5 block font-sans text-[0.5rem] uppercase tracking-[0.24em] text-platinum-dim">
                            Evidence · every reference predates the snapshot
                        </span>
                        <ul className="flex flex-col gap-1">
                            {bottleneck.evidence.map((item) => (
                                <li key={item} className="font-mono text-[0.56rem] leading-relaxed tracking-[0.04em] text-platinum-dim">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ParadigmModal({ onClose }: { onClose: () => void }) {
    const [all, setAll] = useState<Paradigm[] | null>(null);
    const [error, setError] = useState(false);
    const [pick, setPick] = useState(0);

    useEffect(() => {
        const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', fn);
        return () => window.removeEventListener('keydown', fn);
    }, [onClose]);

    useEffect(() => {
        fetch('/api/engine/paradigm')
            .then((r) => r.json())
            .then((rows: Paradigm[]) => setAll(Array.isArray(rows) ? rows : []))
            .catch(() => setError(true));
    }, []);

    const p = all?.[pick];

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
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="font-sans text-[0.6rem] uppercase tracking-[0.28em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:text-bronze-bright"
                    >
                        Close
                    </button>
                </header>

                {/* More than one snapshot is a time series, not a set of files —
                    the point of dating them is being able to read them in order. */}
                {all && all.length > 1 && (
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
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    {error && (
                        <p className="px-6 py-6 font-sans text-[0.7rem] tracking-[0.03em] text-platinum-dim">
                            Could not read the paradigm.
                        </p>
                    )}

                    {!all && !error && (
                        <p className="px-6 py-6 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-platinum-dim">
                            Reading…
                        </p>
                    )}

                    {all && all.length === 0 && (
                        <p className="px-6 py-6 font-sans text-[0.7rem] tracking-[0.03em] text-platinum-dim">
                            No snapshots in the corpus yet.
                        </p>
                    )}

                    {p && (
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

                            <div className="border-t border-stone-line">
                                <div className="px-6 py-4">
                                    <span className="block font-sans text-[0.58rem] uppercase tracking-[0.22em] text-bronze">
                                        Bottlenecks · I² constraint surface
                                    </span>
                                    <p className="mt-1.5 font-sans text-[0.62rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                                        A paper must materially relieve one of these dated constraints for a high incentives score.
                                        No match or negligible impact caps I² at 2; incremental relief caps it at 4.
                                    </p>
                                </div>
                                {(p.bottlenecks ?? []).map((b, i) => (
                                    <Bottleneck key={b.id} bottleneck={b} n={i + 1} />
                                ))}
                                {!p.bottlenecks?.length && (
                                    <p className="border-t border-stone-line/60 px-6 py-4 font-sans text-[0.66rem] text-platinum-dim">
                                        No bottlenecks recorded in this snapshot. I² is capped at 2.
                                    </p>
                                )}
                            </div>

                            <div className="border-t border-stone-line">
                                <div className="px-6 py-4">
                                    <span className="block font-sans text-[0.58rem] uppercase tracking-[0.22em] text-bronze">
                                        Paradigm layers · I¹ assumption surface
                                    </span>
                                </div>
                                {p.layers.map((l, i) => (
                                    <Layer key={l.layer} layer={l} n={i + 1} />
                                ))}
                            </div>

                            <p className="border-t border-stone-line px-6 py-4 font-sans text-[0.62rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                                A candidate is judged against the snapshot standing when it was
                                published, never a later one. <span className="text-platinum">Importance</span> is
                                decided here, once, and caps I¹. Bottleneck importance does the same for I².
                                Neither is a per-paper judgement.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
