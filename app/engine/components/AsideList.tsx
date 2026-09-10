'use client';

// ─── set aside ────────────────────────────────────────────────────────────────
// The rows taken out of the month's reading, kept where they can be seen and
// taken back. Not a bin: a digest row that links somewhere other than arXiv can
// never be pulled or scored, and putting it here is a statement about the row's
// reachability, not a judgement of the work. So it stays legible — title, week,
// and why it could not be run — behind one fold.

import { useState } from 'react';
import type { PaperRow, WeekRow } from '@/lib/engine/data';
import { weekRange } from '@/lib/engine/routes';
import { sourceUrl } from './format';

export interface AsideRow {
    week: WeekRow;
    paper: PaperRow;
}

/** Why this row cannot be put through the analyst, in the digest's own terms. */
function reason(paper: PaperRow): string {
    if (!paper.id) return `NO ARXIV ID · ${paper.host ?? 'UNKNOWN'}`;
    if (!paper.held) return 'NOT PULLED';
    return 'SCORABLE';
}

export default function AsideList({
    rows,
    onRestore,
    busy,
}: {
    rows: AsideRow[];
    onRestore: (week: WeekRow, paper: PaperRow) => void;
    busy: boolean;
}) {
    const [open, setOpen] = useState(false);
    if (rows.length === 0) return null;

    return (
        <div className="border-t border-stone-line">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className="flex w-full items-center justify-between px-8 py-4 transition-colors duration-500 ease-mechanical hover:bg-charcoal"
            >
                <span className="font-sans text-[0.55rem] uppercase tracking-[0.28em] text-platinum-dim">
                    Set aside · {rows.length}
                </span>
                <svg
                    width="8"
                    height="8"
                    viewBox="0 0 8 8"
                    fill="none"
                    aria-hidden
                    className={`shrink-0 text-platinum-dim transition-transform duration-500 ease-mechanical ${open ? 'rotate-180' : ''}`}
                >
                    <path
                        d="M1 3L4 6L7 3"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            <div
                className={`overflow-hidden transition-all duration-500 ease-mechanical ${open ? 'max-h-[42rem] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                {/* A month can set aside more rows than fit on a screen, so the
                    list scrolls inside its own bound rather than pushing the
                    foot of the page somewhere unreachable. */}
                <ul className="max-h-[40rem] overflow-y-auto border-t border-stone-line px-8 py-4">
                    {rows.map(({ week, paper }) => {
                        const url = sourceUrl(paper);
                        return (
                            <li
                                key={`${week.idx}-${paper.n}`}
                                className="flex items-baseline gap-4 border-b border-stone-line/40 py-2 last:border-b-0"
                            >
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-sans text-[0.7rem] tracking-[0.02em] text-platinum">
                                        {url ? (
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="transition-colors duration-300 ease-mechanical hover:text-bronze-bright"
                                            >
                                                {paper.title} ↗
                                            </a>
                                        ) : (
                                            paper.title
                                        )}
                                    </span>
                                    <span className="mt-0.5 block font-mono text-[0.5rem] tracking-[0.12em] text-platinum-dim">
                                        {weekRange(week.heading).toUpperCase()} · {reason(paper)}
                                    </span>
                                </span>

                                <button
                                    type="button"
                                    onClick={() => onRestore(week, paper)}
                                    disabled={busy}
                                    title="Put it back in the week"
                                    className="shrink-0 border border-stone-line px-2 py-1 font-mono text-[0.55rem] leading-none text-platinum-dim transition-colors duration-300 ease-mechanical hover:border-bronze hover:text-bronze-bright disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                    RESTORE
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
