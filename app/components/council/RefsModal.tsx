'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PageRefMeta } from './types';

interface Props {
    available: PageRefMeta[];
    attached: PageRefMeta[];
    onChange: React.Dispatch<React.SetStateAction<PageRefMeta[]>>;
    onClose: () => void;
    /** Non-null while the catalogue is still loading or failed to load. */
    status: 'loading' | 'ready' | 'error';
}

type Selection = 'none' | 'some' | 'all';

function selectionOf(refs: PageRefMeta[], attached: PageRefMeta[]): Selection {
    const n = refs.filter((r) => attached.some((a) => a.id === r.id)).length;
    if (n === 0) return 'none';
    return n === refs.length ? 'all' : 'some';
}

function Mark({ state }: { state: Selection }) {
    return (
        <span
            aria-hidden
            className={`flex h-2.5 w-2.5 shrink-0 items-center justify-center border transition-colors duration-500 ease-mechanical ${
                state === 'none' ? 'border-platinum-dim' : 'border-bronze bg-bronze/25'
            }`}
        >
            {state === 'some' ? (
                <span className="h-px w-1 bg-bronze-bright" />
            ) : state === 'all' ? (
                <svg width="6" height="5" viewBox="0 0 6 5" fill="none">
                    <path
                        d="M1 2.5L2.5 4L5 1"
                        stroke="var(--color-bronze-bright)"
                        strokeWidth="1.1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ) : null}
        </span>
    );
}

function Chevron({ open }: { open: boolean }) {
    return (
        <svg
            width="7"
            height="7"
            viewBox="0 0 8 8"
            fill="none"
            aria-hidden
            className={`shrink-0 transition-transform duration-500 ease-mechanical ${open ? 'rotate-90' : ''}`}
        >
            <path
                d="M2 1L5.5 4L2 7"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/** The corpus, attachable per conversation. Kyros holds resolved cases, method
 *  and open bottlenecks — not papers. A paper arrives as the thing under
 *  analysis; these are what it is judged against. */
export default function RefsModal({ available, attached, onChange, onClose, status }: Props) {
    useEffect(() => {
        const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', fn);
        return () => window.removeEventListener('keydown', fn);
    }, [onClose]);

    // Insertion order from the API is the intended reading order.
    const groups = useMemo(() => {
        const map = new Map<string, PageRefMeta[]>();
        available.forEach((r) => {
            const list = map.get(r.group);
            if (list) list.push(r);
            else map.set(r.group, [r]);
        });
        return [...map.entries()];
    }, [available]);

    // Groups holding an attachment open on mount, so a restored session shows
    // what it carries without hunting for it.
    const [open, setOpen] = useState<Set<string>>(
        () => new Set(attached.map((a) => a.group)),
    );

    function toggleOpen(group: string) {
        setOpen((prev) => {
            const next = new Set(prev);
            if (next.has(group)) next.delete(group);
            else next.add(group);
            return next;
        });
    }

    function toggleRef(ref: PageRefMeta) {
        onChange((prev) =>
            prev.some((r) => r.id === ref.id)
                ? prev.filter((r) => r.id !== ref.id)
                : [...prev, ref],
        );
    }

    function toggleGroup(refs: PageRefMeta[]) {
        const state = selectionOf(refs, attached);
        if (state === 'all') {
            const ids = new Set(refs.map((r) => r.id));
            onChange((prev) => prev.filter((r) => !ids.has(r.id)));
        } else {
            onChange((prev) => [...prev, ...refs.filter((r) => !prev.some((a) => a.id === r.id))]);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/85 px-6 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="References"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[80vh] w-full max-w-2xl flex-col border border-stone-line-strong bg-charcoal"
            >
                <header className="flex shrink-0 items-center justify-between border-b border-stone-line px-6 py-4">
                    <h2 className="font-serif text-lg font-light tracking-wide text-marble">References</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="font-sans text-[0.6rem] uppercase tracking-[0.28em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:text-bronze-bright"
                    >
                        Done
                    </button>
                </header>

                <p className="shrink-0 border-b border-stone-line px-6 py-3 font-sans text-[0.62rem] leading-relaxed tracking-[0.06em] text-platinum-dim">
                    Attached to every agent, on every turn of this conversation.
                </p>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {status === 'loading' && (
                        <p className="py-8 text-center font-serif text-base font-light text-platinum-dim">
                            Reading the corpus…
                        </p>
                    )}
                    {status === 'error' && (
                        <p className="py-8 text-center font-mono text-[0.65rem] tracking-[0.1em] text-bronze-bright">
                            ⚠ The corpus could not be read.
                        </p>
                    )}
                    {status === 'ready' && groups.length === 0 && (
                        <p className="py-8 text-center font-serif text-base font-light text-platinum-dim">
                            The corpus is empty.
                        </p>
                    )}

                    <div className="space-y-5">
                        {groups.map(([group, refs]) => {
                            const state = selectionOf(refs, attached);
                            const isOpen = open.has(group);
                            const tag = refs[0]?.tag;
                            return (
                                <section key={group} className="border border-stone-line">
                                    <div className="flex items-center gap-4 bg-obsidian-800 px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleOpen(group)}
                                            className={`flex min-w-0 flex-1 items-center gap-3 text-left transition-colors duration-500 ease-mechanical ${
                                                state === 'none' ? 'text-platinum' : 'text-bronze-bright'
                                            } hover:text-bronze-bright`}
                                        >
                                            <Chevron open={isOpen} />
                                            <span className="truncate font-sans text-[0.62rem] uppercase tracking-[0.28em]">
                                                {group}
                                            </span>
                                            {tag && (
                                                <span className="shrink-0 border border-stone-line px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-[0.18em] text-platinum-dim">
                                                    {tag}
                                                </span>
                                            )}
                                            <span className="shrink-0 font-mono text-[0.55rem] tracking-[0.1em] text-platinum-dim">
                                                {refs.length}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => toggleGroup(refs)}
                                            aria-label={`${state === 'all' ? 'Detach' : 'Attach'} all of ${group}`}
                                            className={`flex shrink-0 items-center gap-2 font-sans text-[0.55rem] uppercase tracking-[0.28em] transition-colors duration-500 ease-mechanical ${
                                                state === 'none' ? 'text-platinum-dim' : 'text-bronze'
                                            } hover:text-bronze-bright`}
                                        >
                                            <Mark state={state} />
                                            All
                                        </button>
                                    </div>

                                    {isOpen && (
                                        <ul className="divide-y divide-stone-line border-t border-stone-line">
                                            {refs.map((ref) => {
                                                const on = attached.some((a) => a.id === ref.id);
                                                return (
                                                    <li key={ref.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleRef(ref)}
                                                            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-500 ease-mechanical hover:bg-charcoal-700/60 ${
                                                                on ? 'bg-charcoal-700/40' : ''
                                                            }`}
                                                        >
                                                            <Mark state={on ? 'all' : 'none'} />
                                                            <span
                                                                className={`font-serif text-[0.95rem] font-light leading-snug ${
                                                                    on ? 'text-marble' : 'text-platinum'
                                                                }`}
                                                            >
                                                                {ref.label}
                                                            </span>
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </section>
                            );
                        })}
                    </div>
                </div>

                <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-stone-line px-6 py-4">
                    <p className="font-sans text-[0.6rem] uppercase tracking-[0.22em] text-platinum-dim">
                        {attached.length === 0
                            ? 'Nothing attached'
                            : `${attached.length} attached of ${available.length}`}
                    </p>
                    <button
                        type="button"
                        onClick={() => onChange([])}
                        disabled={attached.length === 0}
                        className="font-sans text-[0.6rem] uppercase tracking-[0.24em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:text-bronze-bright disabled:opacity-30"
                    >
                        Detach all
                    </button>
                </footer>
            </div>
        </div>
    );
}
