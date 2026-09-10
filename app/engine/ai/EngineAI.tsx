'use client';

// ─── the month ────────────────────────────────────────────────────────────────
// One month, read as one page. The weeks inside it are sections, each with its
// own controls, because a week is still the unit of work: the analyst walks ten
// papers, the spend is counted against that week, and the stop button ends that
// pass. What changed is that the week stopped being a place — it is read where
// it sits, in the month, at an address that says so.

import { useCallback, useMemo, useRef, useState } from 'react';
import EngineAISidebar from '@/app/engine/components/EngineAISidebar';
import MonthHeader, { type Scope, type Stats } from '@/app/engine/components/MonthHeader';
import CriticModal from '@/app/engine/components/CriticModal';
import ParadigmModal from '@/app/engine/components/ParadigmModal';
import ScoringModal from '@/app/engine/components/ScoringModal';
import BreakdownModal from '@/app/engine/components/BreakdownModal';
import PaperCard from '@/app/engine/components/PaperCard';
import AsideList, { type AsideRow } from '@/app/engine/components/AsideList';
import { useEnginePrefs } from '@/app/engine/components/storage';
import { heldScore, type RowState } from '@/app/engine/components/types';
import type { WeekRow, PaperRow } from '@/lib/engine/data';
import type { External } from '@/app/api/engine/external/route';
import { allNotes, effectiveScore, noteForSection, type StoredScore } from '@/lib/engine/store';
import { MONTH_ORDER, paperAnchor } from '@/lib/engine/routes';
import { useFragmentNavigation } from './useFragmentNavigation';
import { useCriticDecisions } from './useCriticDecisions';
import { useMonthData } from './useMonthData';

const DOMAIN = 'ai';

interface Props {
    year: string;
    /** As it appears in the path — "august", or a hand-typed "aug". */
    month: string;
}

/** What is running. One pass at a time, and one paper at a time within it: the
 *  sequence is what keeps spend legible as it accrues, where a parallel fan-out
 *  would commit the whole budget before the first row rendered.
 *
 *  A pass covers whatever is on screen — the chosen week, or the month. */
type Running = 'analyst' | 'critic' | 'external' | null;

export default function EngineAI({ year, month: monthParam }: Props) {
    const { prefs, setPrefs } = useEnginePrefs();
    const { model, criticModel, externalModel, criticOn } = prefs;

    // Keyed "<paperId>:<row>" — every rank and panel opens on its own.
    const [openRows, setOpenRows] = useState<Record<string, boolean>>({});
    /** Which week is on screen, or every one of them. The month reads as one
     *  list by default — the week is where work is committed, so it is chosen
     *  deliberately rather than being the shape the page arrives in. */
    const [selected, setSelected] = useState<Scope>('all');
    /** The fragment, owned here rather than by the navigation hook because both
     *  hooks touch it: opening a different month re-reads it, and walking to a
     *  paper writes it. Holding it in one of them would make the two circular. */
    const [anchor, setAnchor] = useState('');

    const {
        weeks,
        monthWeeks,
        monthName,
        states,
        setStates,
        runs,
        setRuns,
        aside,
        setAside,
        externals,
        setExternals,
        paradigms,
        loading,
        loadedFor,
        error,
        setError,
        loadWeek,
        isRead,
    } = useMonthData({ year, monthParam, setSelected, setOpenRows, setAnchor });

    /** The snapshot a given row was scored against — its own, not the month's.
     *  A re-selected force can only be resolved against the paradigm the row
     *  actually used, so an accepted "wrong force" objection needs this to be
     *  applied at all.
     *
     *  Declared HERE, beside the data it closes over, because it is called from
     *  render-time memos further down: a `const` further down the component body
     *  is in the temporal dead zone when those run. */
    const paradigmFor = useCallback(
        (s: { paradigmAsOf?: string }) => paradigms.find((p) => p.asOf === s.paradigmAsOf),
        [paradigms],
    );

    const [showParadigm, setShowParadigm] = useState(false);
    const [showScoring, setShowScoring] = useState(false);
    // The paper whose derivation is open — held by id, not by value. A critique
    // landing while the modal is open changes the score, and the breakdown is
    // the one place that must show it: freezing a copy would leave the modal
    // explaining a number no longer on the card.
    const [breakdown, setBreakdown] = useState<string | null>(null);
    const [running, setRunning] = useState<Running>(null);
    const [clearingId, setClearingId] = useState<string | null>(null);
    const cancelled = useRef(false);
    // The request in flight. `cancelled` is only read between papers, so on its
    // own it makes stop mean "after this one finishes" — and an analyst call is
    // allowed 300 seconds. Holding the controller lets stop cut the current
    // request off instead of waiting it out.
    const inflight = useRef<AbortController | null>(null);

    /** A fetch the stop button can interrupt. Every call in a batch goes
     *  through this so there is never a request stop cannot reach. */
    const send = useCallback(async (url: string, init: RequestInit) => {
        const controller = new AbortController();
        inflight.current = controller;
        try {
            return await fetch(url, { ...init, signal: controller.signal });
        } finally {
            if (inflight.current === controller) inflight.current = null;
        }
    }, []);

    /** Stopping is not a failure, so an interrupted row is cleared rather than
     *  left showing an error the user caused on purpose. */
    const aborted = (err: unknown) => err instanceof DOMException && err.name === 'AbortError';

    /** A digest row's place in the archive — the one thing every row has. */
    const asideKey = (week: WeekRow, paper: PaperRow) => `${week.idx}:${paper.n}`;

    const visibleFor = useCallback(
        (week: WeekRow): PaperRow[] => week.papers.filter((p) => !aside.has(asideKey(week, p))),
        [aside],
    );

    /** The weeks the filter admits: one, or all of them. */
    const scopeWeeks = useMemo(
        () => (selected === 'all' ? monthWeeks : monthWeeks.filter((w) => w.idx === selected)),
        [monthWeeks, selected],
    );

    const { openNote, setOpenNote, flagNotes, resolveNote, resolveFlags } = useCriticDecisions({
        states,
        setStates,
        scopeWeeks,
        visibleFor,
        running,
        setError,
    });


    /** The week the filter is on, or null while the month is read whole. */
    const selectedWeek = selected === 'all' ? null : (scopeWeeks[0] ?? null);

    /** Everything on screen, highest first, unscored last. Across the whole
     *  month under "All": the digest's week boundary is arbitrary, and ranking
     *  within it would only ever compare a paper against the nine that happened
     *  to be drawn beside it. Ties fall back to the newest week, then to the
     *  digest's own order. */
    const shown = useMemo((): { week: WeekRow; paper: PaperRow }[] => {
        const product = (paper: PaperRow): number => {
            const held = heldScore(paper.id ? states[paper.id] : undefined);
            return held ? effectiveScore(held, allNotes(held), paradigmFor(held)).product : -1;
        };
        const rows = scopeWeeks.flatMap((week) =>
            visibleFor(week).map((paper) => ({ week, paper })),
        );
        return rows.sort(
            (a, b) =>
                product(b.paper) - product(a.paper) ||
                b.week.idx - a.week.idx ||
                a.paper.n - b.paper.n,
        );
    }, [scopeWeeks, visibleFor, states, paradigmFor]);

    /** Set aside within whatever is on screen — the month, or the chosen week. */
    const asideRows = useMemo((): AsideRow[] => {
        const out: AsideRow[] = [];
        for (const week of scopeWeeks) {
            for (const paper of week.papers) {
                if (aside.has(`${week.idx}:${paper.n}`)) out.push({ week, paper });
            }
        }
        return out;
    }, [scopeWeeks, aside]);

    /** One week's counters — what its header reports and what its buttons act on. */
    const statsFor = useCallback(
        (week: WeekRow) => {
            const papers = visibleFor(week);
            const scorable = papers.filter((p) => p.id && p.held);
            const rows = papers.map((p) => (p.id ? states[p.id] : undefined));
            return {
                papers: papers.length,
                // What a batch would actually read. Distinct from `scorable`,
                // which is how many papers here CAN be read at all — the
                // subtitle reports the week, the button reports the work.
                pendingAnalyst: scorable.filter((p) => !isRead(p)).length,
                // Shown beside the count so a week that reads "9 in the week"
                // says where the tenth went, rather than looking miscounted.
                aside: week.papers.length - papers.length,
                scorable,
                done: rows.filter((s) => s?.status === 'done').length,
                spend: rows.reduce(
                    (n, s) =>
                        n + (s?.status === 'done'
                            ? s.score.cost + (s.score.critiques ?? []).reduce((c, x) => c + x.cost, 0)
                            : 0),
                    0,
                ),
                pendingExternal: papers.filter((p) => p.id && !externals[p.id]).length,
                pendingCritique: rows.filter((s) => s?.status === 'done' && !s.score.critiques?.length).length,
                openFlags: rows.reduce((n, s) => {
                    if (s?.status !== 'done') return n;
                    return n + allNotes(s.score).filter((x) => !x.agrees && !x.resolution).length;
                }, 0),
                totalScore: rows.reduce((n, s) => {
                    if (s?.status !== 'done') return n;
                    return n + effectiveScore(s.score, allNotes(s.score), paradigmFor(s.score)).product;
                }, 0),
            };
        },
        [states, externals, visibleFor, isRead, paradigmFor],
    );

    /** Rows the engine has nothing to read: the digest linked somewhere other
     *  than arXiv, or the text was never pulled. They can never be scored, so
     *  they sit in the ranked list purely to be scrolled past. */
    const unrunnable = useMemo(
        (): { week: WeekRow; paper: PaperRow }[] =>
            scopeWeeks.flatMap((week) =>
                visibleFor(week)
                    .filter((paper) => !paper.id || !paper.held)
                    .map((paper) => ({ week, paper })),
            ),
        [scopeWeeks, visibleFor],
    );

    /** The same counters over whatever is on screen — one week, or the month. */
    const stats = useMemo((): Stats => {
        const totals: Stats = {
            papers: 0,
            aside: 0,
            scorable: 0,
            pendingAnalyst: 0,
            done: 0,
            spend: 0,
            openFlags: 0,
            pendingExternal: 0,
            pendingCritique: 0,
            totalScore: 0,
        };
        for (const week of scopeWeeks) {
            const s = statsFor(week);
            totals.papers += s.papers;
            totals.aside += s.aside;
            totals.scorable += s.scorable.length;
            totals.pendingAnalyst += s.pendingAnalyst;
            totals.done += s.done;
            totals.spend += s.spend;
            totals.openFlags += s.openFlags;
            totals.pendingExternal += s.pendingExternal;
            totals.pendingCritique += s.pendingCritique;
            totals.totalScore += s.totalScore;
        }
        return totals;
    }, [scopeWeeks, statsFor]);

    /** The analyst over one week's unread papers. Opens that week's run and
     *  walks it; the caller owns whether anything is running and what it
     *  covers, so this is the same work whether it is one week or the fifth of
     *  five.
     *
     *  A paper that already holds a score is passed over. A batch is therefore
     *  resumable — stop it at the twentieth paper and running it again picks up
     *  at the twenty-first, rather than paying for the first twenty twice. The
     *  way to read a paper a second time is to CLEAR it first, which is a
     *  deliberate act on one row rather than a side effect of pressing a
     *  batch button.
     *
     *  The critic does not run here. It is roughly thirty times the cost per
     *  paper, so it is a decision taken after reading the scores, not before. */
    const analyseWeek = useCallback(
        async (week: WeekRow) => {
            const scorable = visibleFor(week).filter((p) => p.id && p.held && !isRead(p));
            if (scorable.length === 0) return;

            // A re-run is a second reading, not an edit — it opens its own row so
            // the previous scores stay available for comparison.
            let runId: string | undefined;
            try {
                const res = await fetch('/api/engine/runs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        domain: DOMAIN,
                        year: week.year,
                        weekIdx: week.idx,
                        heading: week.heading,
                        analystModel: model,
                        // Recorded by the critic pass, if it is ever run.
                        criticModel: null,
                    }),
                });
                runId = (await res.json()).id as string;
            } catch {
                setError('Could not open a run. Scores will not be saved.');
            }

            for (const paper of scorable) {
                if (cancelled.current) break;
                const id = paper.id!;
                setStates((prev) => ({ ...prev, [id]: { status: 'running', stage: 'analyst' } }));

                let score: StoredScore;
                try {
                    const res = await send('/api/engine/analyze', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, title: paper.title, model, runId }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                        setStates((prev) => ({
                            ...prev,
                            [id]: { status: 'error', message: data.error ?? 'Analysis failed' },
                        }));
                        continue;
                    }
                    score = data as StoredScore;
                } catch (err) {
                    if (aborted(err)) {
                        // The paper was cut off mid-reading; it has no score and is
                        // not an error. Leave it as it was and end the run.
                        setStates((prev) => {
                            const next = { ...prev };
                            delete next[id];
                            return next;
                        });
                        break;
                    }
                    setStates((prev) => ({
                        ...prev,
                        [id]: { status: 'error', message: 'Network error' },
                    }));
                    continue;
                }

                setStates((prev) => ({ ...prev, [id]: { status: 'done', score } }));
            }

            void loadWeek(week);
        },
        [model, loadWeek, send, visibleFor, isRead, setError, setStates],
    );

    /** The analyst pass over what is on screen. Under a week that is its ten
     *  papers; under "All" it is the month, week by week in reading order —
     *  each still opening its own run, so a month read in one go is still five
     *  weeks of provenance rather than one undated heap.
     *
     *  Sequential, and the stop button reaches the request in flight. A month
     *  is a long commitment made deliberately; the button says how many papers
     *  it is about to read before it reads them. */
    const runBatch = useCallback(async () => {
        if (running || scopeWeeks.length === 0) return;
        cancelled.current = false;
        setRunning('analyst');
        setError(null);

        for (const week of scopeWeeks) {
            if (cancelled.current) break;
            await analyseWeek(week);
        }

        setRunning(null);
    }, [running, scopeWeeks, analyseWeek, setError]);

    /** One paper, on demand. Reuses its week's open run when there is one so a
     *  re-score lands beside its siblings rather than opening a run of one. */
    const runPaper = useCallback(
        async (paper: PaperRow, week: WeekRow) => {
            // Same rule as the batch: a held score is never overwritten. The
            // card offers CLEAR beside ▷ for exactly this.
            if (!paper.id || !paper.held || running || isRead(paper)) return;
            const id = paper.id;
            cancelled.current = false;
            setRunning('analyst');
            setError(null);

            let runId = runs[week.idx]?.id;
            if (!runId) {
                try {
                    const res = await fetch('/api/engine/runs', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            domain: DOMAIN,
                            year: week.year,
                            weekIdx: week.idx,
                            heading: week.heading,
                            analystModel: model,
                            criticModel: null,
                        }),
                    });
                    runId = (await res.json()).id as string;
                } catch {
                    setError('Could not open a run. The score will not be saved.');
                }
            }

            setStates((prev) => ({ ...prev, [id]: { status: 'running', stage: 'analyst' } }));
            let ok = false;
            try {
                const res = await send('/api/engine/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, title: paper.title, model, runId }),
                });
                const data = await res.json();
                ok = res.ok;
                setStates((prev) => ({
                    ...prev,
                    [id]: res.ok
                        ? {
                              status: 'done',
                              // Defensive as well as fixed server-side: a cached
                              // response from before that fix must not crash the page.
                              score: { ...(data as StoredScore), critiques: data.critiques ?? [] },
                          }
                        : { status: 'error', message: data.error ?? 'Analysis failed' },
                }));
            } catch (err) {
                setStates((prev) => {
                    const next = { ...prev };
                    if (aborted(err)) delete next[id];
                    else next[id] = { status: 'error', message: 'Network error' };
                    return next;
                });
            }
            setRunning(null);
            // Re-read the week so this score joins the rest rather than standing
            // alone, and so its run is populated for the next single-paper score.
            // Only on success: a reload after a failure would replace the error
            // with the previously stored score and hide that anything went wrong.
            if (ok) void loadWeek(week);
        },
        [runs, model, running, loadWeek, send, isRead, setError, setStates],
    );

    /** One critique, on demand. Same guard as the batch: a score that has
     *  already been challenged is never re-charged. */
    const criticPaper = useCallback(
        async (paper: PaperRow, week: WeekRow) => {
            if (!paper.id || running) return;
            const state = states[paper.id];
            // A re-run is allowed: changing the critic seat and challenging the
            // same row again is the point. Each run replaces the last.
            if (state?.status !== 'done') return;
            const score = state.score;
            const run = runs[week.idx];

            setRunning('critic');
            setError(null);

            if (run) {
                void fetch('/api/engine/runs', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: run.id, criticModel }),
                }).catch(() => { });
            }

            setStates((prev) => ({
                ...prev,
                [score.id]: { status: 'running', stage: 'critic', score },
            }));
            try {
                const res = await send('/api/engine/critique', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: score.id,
                        title: score.title,
                        model: criticModel,
                        // A later round reads the row as the rounds before it
                        // left it — analyst plus every accepted correction —
                        // so the seats build on each other instead of each one
                        // re-litigating the original from scratch.
                        score: effectiveScore(score, allNotes(score), paradigmFor(score)),
                        scoreId: score.scoreId,
                    }),
                });
                const data = await res.json();
                setStates((prev) => ({
                    ...prev,
                    [score.id]: res.ok
                        ? { status: 'done', score: { ...score, critiques: [...(score.critiques ?? []), data] } }
                        : { status: 'done', score },
                }));
            } catch {
                setStates((prev) => ({ ...prev, [score.id]: { status: 'done', score } }));
            }
            setRunning(null);
        },
        [states, runs, criticModel, running, send, setError, setStates, paradigmFor],
    );

    /** Remove every saved reading of this paper in its week. Runs are
     *  append-only, so deleting just the newest score would expose an older one
     *  and the card would appear to restore itself on the next load. */
    const clearPaper = useCallback(
        async (paper: PaperRow, week: WeekRow) => {
            if (!paper.id || running || clearingId) return;
            const current = heldScore(states[paper.id]);
            if (!current) return;

            const confirmed = window.confirm(
                `Clear every saved score and critic result for "${paper.title}" in this week?\n\nThis cannot be undone. Repository metadata and the archived paper will remain.`,
            );
            if (!confirmed) return;

            const id = paper.id;
            setClearingId(id);
            setError(null);
            try {
                const params = new URLSearchParams({
                    domain: DOMAIN,
                    year: week.year,
                    weekIdx: String(week.idx),
                    paperId: id,
                });
                const res = await fetch(`/api/engine/runs?${params}`, { method: 'DELETE' });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error ?? 'Failed to clear paper results');

                setStates((prev) => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                });
                setOpenRows((prev) =>
                    Object.fromEntries(
                        Object.entries(prev).filter(([key]) => !key.startsWith(`${id}:`)),
                    ),
                );
                setOpenNote((prev) => (prev?.id === id ? null : prev));
                setRuns((prev) => {
                    const run = prev[week.idx];
                    if (!run) return prev;
                    const scores = run.scores.filter((score) => score.id !== id);
                    return { ...prev, [week.idx]: scores.length ? { ...run, scores } : null };
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to clear paper results');
            } finally {
                setClearingId(null);
            }
        },
        [running, clearingId, states, setError, setOpenNote, setRuns, setStates],
    );

    /** Every paper in the week that has not been looked up. GitHub allows sixty
     *  unauthenticated calls an hour, so this is paced rather than fanned out. */
    const externalWeek = useCallback(
        async (week: WeekRow) => {
            const pending = visibleFor(week).filter((p) => p.id && !externals[p.id]);
            if (pending.length === 0) return;

            for (const paper of pending) {
                if (cancelled.current) break;
                try {
                    const res = await send('/api/engine/external', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: paper.id,
                            title: paper.title,
                            links: paper.links.map((l) => l.url),
                            model: externalModel,
                        }),
                    });
                    const data = await res.json();
                    if (res.ok) setExternals((prev) => ({ ...prev, [paper.id!]: data as External }));
                } catch (err) {
                    // One failure should not stop the sweep — but a stop should.
                    if (aborted(err)) break;
                }
            }
        },
        [externals, externalModel, send, visibleFor, setExternals],
    );

    /** The repository sweep over what is on screen. Sixty unauthenticated calls
     *  an hour is the real ceiling here, not spend, so a month-wide sweep is
     *  paced exactly like a week's and stops the same way. */
    const runExternal = useCallback(async () => {
        if (running || scopeWeeks.length === 0) return;
        cancelled.current = false;
        setRunning('external');
        setError(null);

        for (const week of scopeWeeks) {
            if (cancelled.current) break;
            await externalWeek(week);
        }

        setRunning(null);
    }, [running, scopeWeeks, externalWeek, setError]);

    /** The critic over one week's scores. Walks the ones already on the page
     *  that have not been challenged, so it can be re-run against a different
     *  critic without paying for the analyst again. */
    const critiqueWeek = useCallback(
        async (week: WeekRow) => {
            const pending = visibleFor(week)
                .map((p) => (p.id ? states[p.id] : undefined))
                .filter(
                    (s): s is Extract<RowState, { status: 'done' }> =>
                        s?.status === 'done' && !s.score.critiques?.length,
                );
            if (pending.length === 0) return;

            const run = runs[week.idx];
            if (run) {
                // Which model criticised this run is only known now.
                void fetch('/api/engine/runs', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: run.id, criticModel }),
                }).catch(() => { });
            }

            for (const row of pending) {
                if (cancelled.current) break;
                const score = row.score;
                setStates((prev) => ({
                    ...prev,
                    [score.id]: { status: 'running', stage: 'critic', score },
                }));
                try {
                    const res = await send('/api/engine/critique', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: score.id,
                            title: score.title,
                            model: criticModel,
                            score: effectiveScore(score, allNotes(score), paradigmFor(score)),
                            scoreId: score.scoreId,
                        }),
                    });
                    const data = await res.json();
                    // A critic that fails is not a scored paper that fails — the
                    // analyst's row stands on its own.
                    setStates((prev) => ({
                        ...prev,
                        [score.id]: res.ok
                            ? { status: 'done', score: { ...score, critiques: [...(score.critiques ?? []), data] } }
                            : { status: 'done', score },
                    }));
                } catch (err) {
                    // Either way the analyst's score survives; a stop also ends the pass.
                    setStates((prev) => ({ ...prev, [score.id]: { status: 'done', score } }));
                    if (aborted(err)) break;
                }
            }
        },
        [states, runs, criticModel, send, visibleFor, setStates, paradigmFor],
    );

    /** The critic pass over what is on screen. The most expensive button on the
     *  page — roughly thirty times the analyst per paper — so it never touches
     *  a score already challenged, and it says how many it will charge for
     *  before it is pressed. */
    const runCritic = useCallback(async () => {
        if (running || scopeWeeks.length === 0) return;
        cancelled.current = false;
        setRunning('critic');
        setError(null);

        for (const week of scopeWeeks) {
            if (cancelled.current) break;
            await critiqueWeek(week);
        }

        setRunning(null);
    }, [running, scopeWeeks, critiqueWeek, setError]);

    /** Take a row out of the reading, or put it back. Written through to the
     *  server and reflected locally at once: the row leaves the week the moment
     *  it is clicked, and a failed write says so rather than letting the page
     *  and the record disagree.
     *
     *  Nothing is deleted. A row that carries scores keeps them, and setting it
     *  aside is reversible from the foot of the month. */
    const setRowAside = useCallback(
        async (week: WeekRow, paper: PaperRow, next: boolean) => {
            const key = asideKey(week, paper);
            setAside((prev) => {
                const out = new Set(prev);
                if (next) out.add(key);
                else out.delete(key);
                return out;
            });
            setError(null);

            try {
                const res = next
                    ? await fetch('/api/engine/aside', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            domain: DOMAIN,
                            year: week.year,
                            weekIdx: week.idx,
                            n: paper.n,
                            paperId: paper.id,
                        }),
                    })
                    : await fetch(
                        `/api/engine/aside?domain=${DOMAIN}&year=${week.year}&weekIdx=${week.idx}&n=${paper.n}`,
                        { method: 'DELETE' },
                    );
                if (!res.ok) throw new Error();
            } catch {
                setAside((prev) => {
                    const out = new Set(prev);
                    if (next) out.delete(key);
                    else out.add(key);
                    return out;
                });
                setError(
                    next ? 'Could not set that row aside.' : 'Could not restore that row.',
                );
            }
        },
        [setAside, setError],
    );

    /** Clear every row the engine cannot read, in one statement. The rows go
     *  where a single ASIDE sends them and come back the same way, so this is a
     *  faster way of saying something already reversible — not a new power. */
    const asideUnrunnable = useCallback(async () => {
        if (running || unrunnable.length === 0) return;
        const rows = unrunnable.map(({ week, paper }) => ({
            weekIdx: week.idx,
            n: paper.n,
            paperId: paper.id,
        }));
        const keys = unrunnable.map(({ week, paper }) => asideKey(week, paper));

        setAside((prev) => new Set([...prev, ...keys]));
        setError(null);

        try {
            const res = await fetch('/api/engine/aside', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: DOMAIN, year: scopeWeeks[0].year, rows }),
            });
            if (!res.ok) throw new Error();
        } catch {
            setAside((prev) => {
                const out = new Set(prev);
                for (const key of keys) out.delete(key);
                return out;
            });
            setError('Could not set those rows aside.');
        }
    }, [running, unrunnable, scopeWeeks, setAside, setError]);

    function stop() {
        cancelled.current = true;
        // The loop checks the flag between papers; this ends the one already
        // sent. Without it, stop is a request to stop soon.
        inflight.current?.abort();
    }

    /** The open rows for one card, unprefixed. */
    const rowsFor = useCallback(
        (key: string): Record<string, boolean> => {
            const out: Record<string, boolean> = {};
            for (const [k, v] of Object.entries(openRows)) {
                if (v && k.startsWith(`${key}:`)) out[k.slice(key.length + 1)] = true;
            }
            return out;
        },
        [openRows],
    );

    // ── the fragment ─────────────────────────────────────────────────────────
    // Which week or paper the address points at. Held in state as well as in the
    // bar because the hash is what the page reads to decide where to scroll and
    // which card to mark, and a hash written with replaceState fires no event.
    const { selectScope } = useFragmentNavigation({
        year,
        monthParam,
        monthWeeks,
        anchor,
        setAnchor,
        setSelected,
        settleOn: [shown, externals, loading],
    });

    const clearScope = useCallback(async () => {
        if (running || clearingId) return;
        const ids = scopeWeeks.flatMap((week) =>
            visibleFor(week)
                .map((p) => p.id)
                .filter((id): id is string => Boolean(id) && Boolean(heldScore(states[id!]))),
        );
        if (ids.length === 0) return;

        const where = selectedWeek ? 'this week' : `${monthName} ${year}`;
        const confirmed = window.confirm(
            `Clear every saved score and critic result for ${ids.length} ${ids.length === 1 ? 'paper' : 'papers'} in ${where}?\n\nThis cannot be undone. Repository metadata and the archived papers will remain.`,
        );
        if (!confirmed) return;

        setClearingId('*');
        setError(null);
        try {
            for (const week of scopeWeeks) {
                const params = new URLSearchParams({
                    domain: DOMAIN,
                    year: week.year,
                    weekIdx: String(week.idx),
                    all: '1',
                });
                const res = await fetch(`/api/engine/runs?${params}`, { method: 'DELETE' });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error ?? 'Failed to clear results');
            }

            const cleared = new Set(ids);
            setStates((prev) =>
                Object.fromEntries(Object.entries(prev).filter(([id]) => !cleared.has(id))),
            );
            setOpenRows((prev) =>
                Object.fromEntries(
                    Object.entries(prev).filter(([key]) => !cleared.has(key.split(':')[0])),
                ),
            );
            setOpenNote((prev) => (prev && cleared.has(prev.id) ? null : prev));
            setRuns((prev) => {
                const next = { ...prev };
                for (const week of scopeWeeks) next[week.idx] = null;
                return next;
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to clear results');
        } finally {
            setClearingId(null);
        }
    }, [running, clearingId, scopeWeeks, visibleFor, states, selectedWeek, monthName, year, setError, setOpenNote, setRuns, setStates]);

    /** Every card already answers to #paper-<id> — the address exists whether or
     *  not anyone asks for it, so there is nothing here to switch on. This only
     *  puts that address on the clipboard. */
    /** Whether the numbers on screen mean anything yet. */
    const ready = loadedFor === `${year}:${monthName}`;


    /** The snapshot this month's papers were scored against: the newest one
     *  sealed strictly before them. Mirrors `loadParadigm` on the server, so
     *  the modal opens on the paradigm the scores actually used rather than on
     *  the newest one in the corpus — which for a 2024 month is a paradigm that
     *  did not exist when those papers were published. */
    const scoredAgainst = useMemo(() => {
        if (!monthName) return undefined;
        const month = String(MONTH_ORDER.indexOf(monthName) + 1).padStart(2, '0');
        const period = `${year}-${month}`;
        return paradigms
            .map((p) => p.asOf.slice(0, 7))
            .sort()
            .reverse()
            .find((asOf) => asOf < period);
    }, [paradigms, year, monthName]);

    /** The open row's current score, read live rather than captured. */
    const breakdownScore = useMemo(
        () => (breakdown ? heldScore(states[breakdown]) : undefined),
        [breakdown, states],
    );

    const activeNote = useMemo(() => {
        if (!openNote) return null;
        const s = states[openNote.id];
        if (s?.status !== 'done') return null;
        const note = noteForSection(s.score, openNote.section);
        if (!note) return null;
        // Which pass raised it — the newest round holding a note for this section.
        const round = (s.score.critiques ?? []).findLast((c) =>
            c.notes.some((n) => n.noteId === note.noteId),
        );
        const current = openNote.section === 'summary' ? undefined : s.score[openNote.section].score;
        return { note, current, round: round?.round, criticModel: round?.model };
    }, [openNote, states]);

    return (
        <div className="flex flex-1 items-start">
            <EngineAISidebar
                weeks={weeks}
                activeMonth={monthName ? `${year}:${monthName}` : null}
                activeAnchor={anchor}
                onAnchor={setAnchor}
                model={model}
                onModel={(id) => setPrefs((p) => ({ ...p, model: id }))}
                criticModel={criticModel}
                onCriticModel={(id) => setPrefs((p) => ({ ...p, criticModel: id }))}
                criticOn={criticOn}
                onCriticToggle={() => setPrefs((p) => ({ ...p, criticOn: !p.criticOn }))}
                externalModel={externalModel}
                onExternalModel={(id) => setPrefs((p) => ({ ...p, externalModel: id }))}
                running={running !== null}
            />

            <section className="flex min-w-0 flex-1 flex-col">
                <MonthHeader
                    year={year}
                    month={monthName ?? monthParam}
                    weeks={monthWeeks}
                    selected={selected}
                    onSelect={selectScope}
                    week={selectedWeek}
                    stats={stats}
                    run={selectedWeek ? (runs[selectedWeek.idx] ?? null) : null}
                    running={running}
                    ready={ready}
                    criticOn={criticOn}
                    onParadigm={() => setShowParadigm(true)}
                    onScoring={() => setShowScoring(true)}
                    onRunWeek={() => void runBatch()}
                    onRunCritic={() => void runCritic()}
                    onRunExternal={() => void runExternal()}
                    unrunnable={unrunnable.length}
                    onAsideUnrunnable={() => void asideUnrunnable()}
                    onClearAll={() => void clearScope()}
                    clearing={clearingId === '*'}
                    openFlags={flagNotes.open.length}
                    appliedFlags={flagNotes.applied.length}
                    onApplyFlags={() => void resolveFlags(flagNotes.open, 'applied')}
                    onRevertFlags={() => void resolveFlags(flagNotes.applied, null)}
                    onStop={stop}
                />

                <div className="px-8 py-6">
                    {error && (
                        <p className="mb-4 border border-stone-line px-4 py-3 font-sans text-[0.7rem] tracking-[0.03em] text-platinum-dim">
                            {error}
                        </p>
                    )}

                    {!loading && stats.scorable === 0 && stats.papers > 0 && (
                        <p className="mb-4 border border-stone-line px-4 py-3 font-mono text-[0.62rem] leading-relaxed tracking-[0.06em] text-platinum-dim">
                            Nothing pulled here yet. Run{' '}
                            <span className="text-bronze">npm run pull</span> to fill the archive.
                        </p>
                    )}

                    <div className="flex flex-col gap-3">
                        {shown.map(({ week, paper }) => {
                            // The row's place in the digest, never its arXiv id.
                            // A month is now one list, so two weeks' rows sit
                            // side by side — and an id is only as unique as the
                            // digest's links are correct, where a position
                            // always is.
                            const key = `${week.idx}-${paper.n}`;
                            return (
                                <PaperCard
                                    key={key}
                                    paper={paper}
                                    anchored={Boolean(paper.id) && anchor === paperAnchor(paper.id!)}
                                    state={(paper.id && states[paper.id]) || { status: 'idle' }}
                                    paradigm={(() => {
                                        const held = paper.id ? heldScore(states[paper.id]) : undefined;
                                        return held ? paradigmFor(held) : undefined;
                                    })()}
                                    openRows={rowsFor(key)}
                                    onToggleRow={(row) =>
                                        setOpenRows((prev) => ({
                                            ...prev,
                                            [`${key}:${row}`]: !prev[`${key}:${row}`],
                                        }))
                                    }
                                    onOpenNote={(section) => {
                                        if (paper.id) setOpenNote({ id: paper.id, section });
                                    }}
                                    onRun={() => void runPaper(paper, week)}
                                    onCritic={() => void criticPaper(paper, week)}
                                    onBreakdown={() => paper.id && setBreakdown(paper.id)}
                                    onClear={() => void clearPaper(paper, week)}
                                    onAside={() => void setRowAside(week, paper, true)}
                                    external={paper.id ? externals[paper.id] : undefined}
                                    busy={running !== null || clearingId !== null}
                                />
                            );
                        })}
                    </div>
                </div>

                <AsideList
                    rows={asideRows}
                    onRestore={(week, paper) => void setRowAside(week, paper, false)}
                    busy={running !== null || clearingId !== null}
                />
            </section>

            {showParadigm && (
                <ParadigmModal
                    scoredAgainst={scoredAgainst}
                    onClose={() => setShowParadigm(false)}
                />
            )}

            {showScoring && <ScoringModal onClose={() => setShowScoring(false)} />}

            {breakdownScore && (
                <BreakdownModal
                    score={breakdownScore}
                    paradigm={paradigms.find((p) => p.asOf === breakdownScore.paradigmAsOf)}
                    onClose={() => setBreakdown(null)}
                />
            )}

            {openNote && activeNote && (
                <CriticModal
                    note={activeNote.note}
                    currentScore={activeNote.current}
                    onApply={() => resolveNote(openNote.id, openNote.section, 'applied')}
                    onDismiss={() => resolveNote(openNote.id, openNote.section, 'dismissed')}
                    onRevert={() => resolveNote(openNote.id, openNote.section, null)}
                    round={activeNote.round}
                    criticModel={activeNote.criticModel}
                    onClose={() => setOpenNote(null)}
                />
            )}
        </div>
    );
}
