'use client';

// ─── the month's head ─────────────────────────────────────────────────────────
// What is on screen, what it adds up to, and the controls that act on it.
//
// The month reads as one list by default. Its weeks are a filter behind a
// disclosure toggle — collapsed by default to reduce clutter. The week is a
// unit of work, not of reading: the digest boundary is arbitrary, and a paper's
// score is made against the paradigm snapshot that predates it, never by
// comparison with its neighbours — so regrouping the page cannot move a number.
//
// The action buttons sit in a flex-nowrap strip so they never reflow and shift
// the header height.

import { useState } from 'react';
import type { WeekRow } from '@/lib/engineData';
import type { StoredRun } from '@/lib/engineStore';
import { weekEnd } from '@/lib/engineRoutes';

export type Scope = number | 'all';

export interface Stats {
    papers: number;
    aside: number;
    /** How many papers here can be read at all. */
    scorable: number;
    /** How many of those have not been read yet — what a batch would do. */
    pendingAnalyst: number;
    done: number;
    spend: number;
    openFlags: number;
    pendingExternal: number;
    pendingCritique: number;
    /** Sum of I¹×I²×I³ across all scored papers in scope. */
    totalScore: number;
}

const TAB =
    'border px-3 py-1.5 font-mono text-[0.58rem] tracking-[0.12em] transition-colors duration-300 ease-mechanical';
const TAB_ON = 'border-bronze bg-charcoal text-bronze-bright';
const TAB_OFF = 'border-stone-line text-platinum-dim hover:border-platinum hover:text-platinum';

const ACTION =
    'shrink-0 border px-4 py-2 font-sans text-[0.6rem] uppercase tracking-[0.24em] transition-colors duration-500 ease-mechanical disabled:cursor-not-allowed';
const HALT = 'border-halt bg-halt/10 text-halt-bright hover:border-halt-bright';

export default function MonthHeader({
    year,
    month,
    weeks,
    selected,
    onSelect,
    week,
    stats,
    run,
    running,
    ready,
    criticOn,
    onParadigm,
    onRunWeek,
    onRunCritic,
    onRunExternal,
    unrunnable,
    onAsideUnrunnable,
    openFlags,
    appliedFlags,
    onApplyFlags,
    onRevertFlags,
    onStop,
}: {
    year: string;
    month: string;
    weeks: WeekRow[];
    selected: Scope;
    onSelect: (scope: Scope) => void;
    /** The week the filter is on, or null under "All". */
    week: WeekRow | null;
    /** Counted over whatever is on screen — the month, or the chosen week. */
    stats: Stats;
    run: StoredRun | null;
    running: null | 'analyst' | 'critic' | 'external';
    /** The month's runs and repository rows are in hand. Until they are, every
     *  count here is a count of nothing — so nothing counted is shown. */
    ready: boolean;
    criticOn: boolean;
    onParadigm: () => void;
    onRunWeek: () => void;
    onRunCritic: () => void;
    onRunExternal: () => void;
    /** Rows the engine has nothing to read — no arXiv id, or no pulled text. */
    unrunnable: number;
    onAsideUnrunnable: () => void;
    /** Critic objections still undecided, and those already accepted. */
    openFlags: number;
    appliedFlags: number;
    onApplyFlags: () => void;
    onRevertFlags: () => void;
    onStop: () => void;
}) {
    const scope = week ? 'IN THE WEEK' : 'IN THE MONTH';
    const [weeksOpen, setWeeksOpen] = useState(false);

    const selectedWeek = typeof selected === 'number'
        ? weeks.find((w) => w.idx === selected)
        : null;

    return (
        <header className="sticky top-16 z-10 border-b border-stone-line bg-obsidian px-8 py-5 relative">

            {/* ── row 1: title · total score · action strip (never wraps) ── */}
            <div className="flex items-start gap-4">
                {/* title / status */}
                <div className="min-w-0 flex-1">
                    <h1 className="font-serif text-2xl font-light tracking-[0.12em] text-marble">
                        {month} {year}
                    </h1>
                    <p className="mt-1 font-mono text-[0.55rem] tracking-[0.14em] text-platinum-dim">
                        {running === 'critic'
                            ? 'CHALLENGING…'
                            : running === 'external'
                                ? 'LOOKING UP…'
                                : running === 'analyst'
                                    ? 'READING…'
                                    : !ready
                                        ? 'LOADING RUNS…'
                                        : `${stats.scorable} SCORABLE · ${stats.papers} ${scope} · ${stats.done} SCORED`}
                        {ready && stats.aside > 0 && ` · ${stats.aside} ASIDE`}
                        {ready && stats.openFlags > 0 && ` · ${stats.openFlags} FLAGGED`}
                        {ready && stats.spend > 0 && ` · $${stats.spend.toFixed(4)}`}
                    </p>

                    {/* Provenance — only under a single week */}
                    {week && run && !running && (
                        <p className="mt-1 font-mono text-[0.52rem] tracking-[0.12em] text-platinum-dim/70">
                            SAVED {new Date(run.startedAt).toLocaleDateString(undefined, {
                                day: 'numeric',
                                month: 'short',
                            })}
                            {' · '}
                            {run.analystModel.split('/').pop()?.toUpperCase()}
                            {run.criticModel && ` ⁄ ${run.criticModel.split('/').pop()?.toUpperCase()}`}
                            {run.frameReviewedAt && ` · FRAME ${run.frameReviewedAt}`}
                        </p>
                    )}
                </div>

                {/* total score */}
                {ready && stats.done > 0 && (
                    <div className="flex flex-col items-end shrink-0 self-center">
                        <span className="font-serif text-xl font-light text-bronze-bright leading-none">
                            {stats.totalScore.toLocaleString()}
                        </span>
                        <span className="font-mono text-[0.45rem] tracking-[0.14em] text-platinum-dim mt-0.5">
                            TOTAL SCORE
                        </span>
                    </div>
                )}

                {/* action buttons — nowrap strip, scrollable if viewport is very narrow */}
                <div className="flex shrink-0 items-center gap-3 overflow-x-auto self-center">
                    {/* What I¹ is measured against. */}
                    <button
                        type="button"
                        onClick={onParadigm}
                        className="shrink-0 border border-stone-line px-3 py-2 font-sans text-[0.6rem] uppercase tracking-[0.24em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:border-bronze hover:text-bronze-bright"
                    >
                        Paradigm snapshot
                    </button>

                    {/* Only ever the unread. A batch stopped halfway resumes
                        where it stopped; reading a paper again is done one row
                        at a time, by clearing it first. */}
                    {ready && stats.scorable > 0 && (
                        <button
                            type="button"
                            onClick={running === 'analyst' ? onStop : onRunWeek}
                            disabled={
                                running === 'critic' ||
                                running === 'external' ||
                                (!running && stats.pendingAnalyst === 0)
                            }
                            title={
                                stats.pendingAnalyst === 0
                                    ? 'Every paper here has been read — clear one to read it again'
                                    : `Read ${stats.pendingAnalyst} ${stats.pendingAnalyst === 1 ? 'paper' : 'papers'}, one at a time`
                            }
                            className={`${ACTION} disabled:border-stone-line disabled:text-platinum-dim disabled:opacity-40 ${running === 'analyst'
                                    ? HALT
                                    : 'border-stone-line text-platinum hover:border-bronze hover:text-bronze-bright'
                                }`}
                        >
                            {running === 'analyst'
                                ? 'Stop'
                                : stats.pendingAnalyst > 0
                                    ? `Run batch · ${stats.pendingAnalyst}`
                                    : 'Batch read'}
                        </button>
                    )}

                    {/* Stays put when there is nothing pending. */}
                    {ready && stats.papers > 0 && (
                        <button
                            type="button"
                            onClick={running === 'external' ? onStop : onRunExternal}
                            disabled={
                                running === 'analyst' ||
                                running === 'critic' ||
                                (!running && stats.pendingExternal === 0)
                            }
                            title={
                                stats.pendingExternal === 0
                                    ? 'Every paper here has been looked up on GitHub'
                                    : `Look up ${stats.pendingExternal} on GitHub`
                            }
                            className={`${ACTION} disabled:border-stone-line disabled:text-platinum-dim disabled:opacity-40 ${running === 'external'
                                    ? HALT
                                    : 'border-stone-line text-platinum hover:border-bronze hover:text-bronze-bright'
                                }`}
                        >
                            {running === 'external'
                                ? 'Stop'
                                : stats.pendingExternal > 0
                                    ? `External · ${stats.pendingExternal}`
                                    : 'External done'}
                        </button>
                    )}

                    {/* The second pass. */}
                    {ready && stats.done > 0 && (
                        <button
                            type="button"
                            onClick={running === 'critic' ? onStop : onRunCritic}
                            disabled={
                                running === 'analyst' ||
                                running === 'external' ||
                                (!running && (!criticOn || stats.pendingCritique === 0))
                            }
                            title={
                                !criticOn
                                    ? 'Critic is off'
                                    : stats.pendingCritique === 0
                                        ? 'Every score has been challenged'
                                        : `Challenge ${stats.pendingCritique} scored ${stats.pendingCritique === 1 ? 'paper' : 'papers'}`
                            }
                            className={`${ACTION} disabled:border-stone-line disabled:text-platinum-dim disabled:opacity-40 ${running === 'critic'
                                    ? HALT
                                    : 'border-bronze-dim text-bronze hover:border-bronze hover:text-bronze-bright'
                                }`}
                        >
                            {running === 'critic'
                                ? 'Stop'
                                : stats.pendingCritique > 0
                                    ? `Critic batch · ${stats.pendingCritique}`
                                    : 'Critic done'}
                        </button>
                    )}

                    {/* The critic's objections, decided together. */}
                    {ready && openFlags > 0 && (
                        <button
                            type="button"
                            onClick={onApplyFlags}
                            disabled={running !== null}
                            title={`Accept ${openFlags} open ${openFlags === 1 ? 'objection' : 'objections'}. Nothing is overwritten — revert puts every number back.`}
                            className={`${ACTION} border-halt text-halt-bright hover:border-halt-bright hover:bg-halt/10 disabled:opacity-30`}
                        >
                            Apply flags · {openFlags}
                        </button>
                    )}

                    {ready && appliedFlags > 0 && (
                        <button
                            type="button"
                            onClick={onRevertFlags}
                            disabled={running !== null}
                            title={`Return ${appliedFlags} accepted ${appliedFlags === 1 ? 'correction' : 'corrections'} to undecided, restoring the analyst's own scores. Dismissed objections are left alone.`}
                            className={`${ACTION} border-stone-line text-platinum-dim hover:border-platinum hover:text-platinum disabled:opacity-30`}
                        >
                            Revert · {appliedFlags}
                        </button>
                    )}

                    {/* Nothing is read, charged or deleted — just clears unrunnable rows. */}
                    {ready && unrunnable > 0 && (
                        <button
                            type="button"
                            onClick={onAsideUnrunnable}
                            disabled={running !== null}
                            title={`Set aside ${unrunnable} ${unrunnable === 1 ? 'row' : 'rows'} with nothing to read — no arXiv id, or no pulled text. Restored from the foot of the month.`}
                            className={`${ACTION} border-stone-line text-platinum-dim hover:border-platinum hover:text-platinum disabled:opacity-30`}
                        >
                            Aside · {unrunnable}
                        </button>
                    )}
                </div>
            </div>

            {/* ── row 2: week filter, collapsed by default ── */}
            <div className="mt-3 flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setWeeksOpen((v) => !v)}
                    className="flex items-center gap-1.5 font-mono text-[0.52rem] tracking-[0.14em] text-platinum-dim hover:text-platinum transition-colors duration-200"
                >
                    <span
                        className="inline-block transition-transform duration-200 text-[0.4rem]"
                        style={{ transform: weeksOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    >
                        ▶
                    </span>
                    WEEKS
                    {selectedWeek && (
                        <span className="text-bronze ml-1">
                            · {weekEnd(selectedWeek.heading).label.toUpperCase()}
                        </span>
                    )}
                </button>

                {weeksOpen && (
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onSelect('all')}
                            disabled={running !== null}
                            className={`${TAB} disabled:opacity-40 ${selected === 'all' ? TAB_ON : TAB_OFF}`}
                        >
                            ALL
                        </button>
                        {weeks.map((w) => (
                            <button
                                key={w.idx}
                                type="button"
                                onClick={() => onSelect(w.idx)}
                                disabled={running !== null}
                                title={w.heading.replace(/^\(|\)$/g, '')}
                                className={`${TAB} disabled:opacity-40 ${selected === w.idx ? TAB_ON : TAB_OFF}`}
                            >
                                {weekEnd(w.heading).label.toUpperCase()}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* The instrument is working. */}
            {running && (
                <div className="kyros-sweep absolute inset-x-0 bottom-0 h-px w-full bg-stone-line" />
            )}
        </header>
    );
}
