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
import type { WeekRow } from '@/lib/engine/data';
import type { StoredRun } from '@/lib/engine/store';
import { weekEnd } from '@/lib/engine/routes';

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

// The three passes are one instrument, not three tools: they run in order, only
// one can run at a time, and each is the same question asked of the same papers.
// So they share a border and read as a single control — a pass with nothing left
// to do goes quiet rather than announcing itself, which is what "External done"
// was doing at full volume beside two live buttons.
const PASS =
    'shrink-0 px-3.5 py-2 font-sans text-[0.6rem] uppercase tracking-[0.2em] transition-colors duration-500 ease-mechanical disabled:cursor-not-allowed disabled:text-platinum-dim disabled:opacity-35';
const PASS_LIVE = 'text-platinum hover:bg-charcoal hover:text-bronze-bright';
const PASS_RUNNING = 'bg-halt/10 text-halt-bright';

// Reference, not action: read once, then never again for the rest of a month.
// They sit on the second row as quiet text so the strip above holds only the
// things that spend money or change a number.
const REF =
    'font-mono text-[0.52rem] uppercase tracking-[0.14em] text-platinum-dim transition-colors duration-300 ease-mechanical hover:text-bronze-bright';

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
    onScoring,
    onRunWeek,
    onRunCritic,
    onRunExternal,
    unrunnable,
    onAsideUnrunnable,
    onClearAll,
    clearing,
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
    onScoring: () => void;
    onRunWeek: () => void;
    onRunCritic: () => void;
    onRunExternal: () => void;
    /** Rows the engine has nothing to read — no arXiv id, or no pulled text. */
    unrunnable: number;
    onAsideUnrunnable: () => void;
    /** Throw away every saved score in scope — the chosen week, or the month. */
    onClearAll: () => void;
    /** That clear is in flight. */
    clearing: boolean;
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
                    {/* The framing, kept on the page rather than in a doc nobody
                        opens. A reader looking at a month of mostly-zero rows
                        needs to know that is the instrument working — a detector
                        is silent far more often than it fires, and reading this
                        ledger as a ranking is how a patch paper ends up at the
                        top of a month. */}
                    <p className="mt-1 font-sans text-[0.6rem] italic leading-relaxed tracking-[0.04em] text-bronze">
                        Kyros is not a paper-ranking engine. It is an inflection-point detector.
                    </p>
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

                {/* ── the action strip. Only what spends or changes something. ── */}
                <div className="flex shrink-0 items-center gap-3 overflow-x-auto self-center">
                    {/* The three passes, sharing one border. */}
                    {ready && stats.papers > 0 && (
                        <div className="flex shrink-0 divide-x divide-stone-line border border-stone-line">
                            {/* Only ever the unread. A batch stopped halfway resumes
                                where it stopped; reading a paper again is done one
                                row at a time, by clearing it first. */}
                            <button
                                type="button"
                                onClick={running === 'analyst' ? onStop : onRunWeek}
                                disabled={
                                    stats.scorable === 0 ||
                                    running === 'critic' ||
                                    running === 'external' ||
                                    (!running && stats.pendingAnalyst === 0)
                                }
                                title={
                                    stats.scorable === 0
                                        ? 'Nothing here can be read'
                                        : stats.pendingAnalyst === 0
                                            ? 'Every paper here has been read — clear one to read it again'
                                            : `Read ${stats.pendingAnalyst} ${stats.pendingAnalyst === 1 ? 'paper' : 'papers'}, one at a time`
                                }
                                className={`${PASS} ${running === 'analyst' ? PASS_RUNNING : PASS_LIVE}`}
                            >
                                {running === 'analyst' ? 'Stop' : 'Read'}
                                {!running && stats.pendingAnalyst > 0 && ` · ${stats.pendingAnalyst}`}
                            </button>

                            {/* Confirmation evidence. A paper with no repository is
                                the common case, so a finished pass says nothing
                                rather than claiming every paper shipped one. */}
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
                                        ? 'Every paper here has been looked up on GitHub — many will have no repository, which is itself a finding'
                                        : `Look up ${stats.pendingExternal} on GitHub`
                                }
                                className={`${PASS} ${running === 'external' ? PASS_RUNNING : PASS_LIVE}`}
                            >
                                {running === 'external' ? 'Stop' : 'GitHub'}
                                {!running && stats.pendingExternal > 0 && ` · ${stats.pendingExternal}`}
                            </button>

                            {/* The second pass. */}
                            <button
                                type="button"
                                onClick={running === 'critic' ? onStop : onRunCritic}
                                disabled={
                                    stats.done === 0 ||
                                    running === 'analyst' ||
                                    running === 'external' ||
                                    (!running && (!criticOn || stats.pendingCritique === 0))
                                }
                                title={
                                    stats.done === 0
                                        ? 'Nothing scored yet'
                                        : !criticOn
                                            ? 'Critic is off'
                                            : stats.pendingCritique === 0
                                                ? 'Every score has been challenged'
                                                : `Challenge ${stats.pendingCritique} scored ${stats.pendingCritique === 1 ? 'paper' : 'papers'}`
                                }
                                className={`${PASS} ${running === 'critic'
                                    ? PASS_RUNNING
                                    : 'text-bronze hover:bg-charcoal hover:text-bronze-bright'
                                    }`}
                            >
                                {running === 'critic' ? 'Stop' : 'Critic'}
                                {!running && stats.pendingCritique > 0 && ` · ${stats.pendingCritique}`}
                            </button>
                        </div>
                    )}

                    {/* The critic's objections, decided together. Separate from the
                        passes because these change stored numbers rather than
                        producing new ones — and because they are the only thing
                        here that is ever urgent. */}
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
                </div>
            </div>

            {/* ── row 2: the week filter, and everything that is reference or
                   housekeeping rather than an action on the month. ── */}
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

                {/* Pushed right, away from the filter they share a row with. */}
                <div className="ml-auto flex shrink-0 items-center gap-4">
                    {/* Nothing is read, charged or deleted — just clears
                        unrunnable rows. Housekeeping, so it sits down here with
                        the reference rather than beside the passes. */}
                    {ready && unrunnable > 0 && (
                        <button
                            type="button"
                            onClick={onAsideUnrunnable}
                            disabled={running !== null}
                            title={`Set aside ${unrunnable} ${unrunnable === 1 ? 'row' : 'rows'} with nothing to read — no arXiv id, or no pulled text. Restored from the foot of the month.`}
                            className={`${REF} disabled:opacity-30`}
                        >
                            Aside · {unrunnable}
                        </button>
                    )}

                    {/* The one destructive thing on the page. It sits down here
                        rather than beside the passes — it is not a pass, and a
                        button that throws a month's reading away should not be
                        adjacent to the one that produces it — but it takes the
                        halt colour on hover so it can never be mistaken for the
                        quiet reference links it shares the row with. */}
                    {ready && stats.done > 0 && (
                        <button
                            type="button"
                            onClick={onClearAll}
                            disabled={running !== null || clearing}
                            title={`Throw away every saved score and critic result for ${stats.done} scored ${stats.done === 1 ? 'paper' : 'papers'} here. Cannot be undone; repository evidence and the papers themselves remain.`}
                            className={`${REF} hover:text-halt-bright disabled:opacity-30`}
                        >
                            {clearing ? 'Clearing…' : `Clear all · ${stats.done}`}
                        </button>
                    )}

                    {/* What I¹ is measured against, and how the measuring is
                        done. Two halves of one answer, so they sit together. */}
                    <button type="button" onClick={onParadigm} className={REF}>
                        Paradigm snapshot
                    </button>
                    <button type="button" onClick={onScoring} className={REF}>
                        Scoring guide
                    </button>
                </div>
            </div>

            {/* The instrument is working. */}
            {running && (
                <div className="kyros-sweep absolute inset-x-0 bottom-0 h-px w-full bg-stone-line" />
            )}
        </header>
    );
}
