'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EngineAISidebar from '@/app/components/engine/EngineAISidebar';
import EngineHeader from '@/app/components/engine/EngineHeader';
import CriticModal from '@/app/components/engine/CriticModal';
import ParadigmModal from '@/app/components/engine/ParadigmModal';
import BreakdownModal from '@/app/components/engine/BreakdownModal';
import type { Paradigm } from '@/lib/paradigm';
import PaperCard from '@/app/components/engine/PaperCard';
import { useEnginePrefs } from '@/app/components/engine/storage';
import { heldScore, type RowState } from '@/app/components/engine/types';
import type { WeekRow, PaperRow } from '@/lib/engineData';
import type { CriticSection } from '@/app/api/engine/critique/route';
import type { External } from '@/app/api/engine/external/route';
import { effectiveScore, type StoredRun, type StoredScore } from '@/lib/engineStore';

const DOMAIN = 'ai';

export default function EnginePage() {
    const { prefs, setPrefs } = useEnginePrefs();
    const { model, criticModel, externalModel, criticOn } = prefs;

    const [weeks, setWeeks] = useState<WeekRow[]>([]);
    const [week, setWeek] = useState<WeekRow | null>(null);
    const [states, setStates] = useState<Record<string, RowState>>({});
    const [run, setRun] = useState<StoredRun | null>(null);
    const [loading, setLoading] = useState(false);
    // Keyed "<paperId>:<row>" — every rank and panel opens on its own.
    const [openRows, setOpenRows] = useState<Record<string, boolean>>({});
    const [openNote, setOpenNote] = useState<{ id: string; section: CriticSection } | null>(null);
    const [showParadigm, setShowParadigm] = useState(false);
    // The paper whose derivation is open — held by id, not by value. A critique
    // landing while the modal is open changes the score, and the breakdown is
    // the one place that must show it: freezing a copy would leave the modal
    // explaining a number no longer on the card.
    const [breakdown, setBreakdown] = useState<string | null>(null);
    // The sealed snapshots, so a card can show the written assumption its I¹ was
    // measured against rather than the model's paraphrase of it.
    const [paradigms, setParadigms] = useState<Paradigm[]>([]);
    const [externals, setExternals] = useState<Record<string, External>>({});
    const [running, setRunning] = useState<null | 'analyst' | 'critic' | 'external'>(null);
    const [clearingId, setClearingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const cancelled = useRef(false);

    const activeKey = week ? `${week.year}:${week.idx}` : null;
    const scorable = useMemo(() => (week?.papers ?? []).filter((p) => p.id && p.held), [week]);
    const done = Object.values(states).filter((s) => s.status === 'done').length;
    const spend = Object.values(states).reduce(
        (n, s) => n + (s.status === 'done' ? s.score.cost + (s.score.critique?.cost ?? 0) : 0),
        0,
    );
    const pendingExternal = (week?.papers ?? []).filter((p) => p.id && !externals[p.id]).length;
    const pendingCritique = Object.values(states).filter(
        (s) => s.status === 'done' && !s.score.critique,
    ).length;
    const openFlags = Object.values(states).reduce((n, s) => {
        if (s.status !== 'done' || !s.score.critique) return n;
        return n + s.score.critique.notes.filter((x) => !x.agrees && !x.resolution).length;
    }, 0);

    /** Whatever was scored for this week last time, rehydrated. */
    const loadRun = useCallback(async (next: WeekRow) => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/engine/runs?domain=${DOMAIN}&year=${next.year}&weekIdx=${next.idx}`,
            );
            const stored = (await res.json()) as StoredRun | null;
            setRun(stored);
            setStates(
                stored
                    ? Object.fromEntries(
                        stored.scores.map((s) => [s.id, { status: 'done', score: s } as RowState]),
                    )
                    : {},
            );

            // Repository evidence is keyed by paper, so it survives re-scores and
            // is fetched for the whole week in one call.
            const ids = next.papers.map((p) => p.id).filter(Boolean).join(',');
            if (ids) {
                try {
                    const rows = (await (
                        await fetch(`/api/engine/external?ids=${ids}`)
                    ).json()) as External[];
                    setExternals(Object.fromEntries(rows.map((r) => [r.paperId, r])));
                } catch {
                    setExternals({});
                }
            } else {
                setExternals({});
            }
        } catch {
            setRun(null);
            setStates({});
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetch('/api/engine/weeks')
            .then((r) => r.json())
            .then((rows: WeekRow[]) => {
                setWeeks(rows);
                const ready = [...rows].reverse().find((w) => w.heldCount > 0) ?? rows[rows.length - 1];
                if (ready) {
                    setWeek(ready);
                    void loadRun(ready);
                }
            })
            .catch(() => setError('Could not load the digests.'));
    }, [loadRun]);

    useEffect(() => {
        fetch('/api/engine/paradigm')
            .then((r) => r.json())
            .then((rows: Paradigm[]) => setParadigms(Array.isArray(rows) ? rows : []))
            .catch(() => setParadigms([]));
    }, []);

    /** The layer assumption a scored row was judged against. */
    const assumptionFor = useCallback(
        (state: RowState | undefined): string | undefined => {
            const delta = heldScore(state)?.delta;
            if (!delta) return undefined;
            const snapshot = paradigms.find((p) => p.asOf === delta.paradigmAsOf);
            return snapshot?.layers.find((l) => l.layer === delta.layer)?.assumption;
        },
        [paradigms],
    );

    const selectWeek = useCallback(
        (next: WeekRow) => {
            setWeek(next);
            setStates({});
            setRun(null);
            setOpenRows({});
            setError(null);
            void loadRun(next);
        },
        [loadRun],
    );

    /** The analyst pass. One paper at a time — the sequence keeps spend legible
     *  as it accrues, where a parallel fan-out would commit the week's budget
     *  before the first row rendered.
     *
     *  The critic does not run here. It is roughly thirty times the cost per
     *  paper, so it is a decision taken after reading the scores, not before. */
    const runWeek = useCallback(async () => {
        if (!week || scorable.length === 0) return;
        cancelled.current = false;
        setRunning('analyst');
        setError(null);

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

        setStates({});

        for (const paper of scorable) {
            if (cancelled.current) break;
            const id = paper.id!;
            setStates((prev) => ({ ...prev, [id]: { status: 'running', stage: 'analyst' } }));

            let score: StoredScore;
            try {
                const res = await fetch('/api/engine/analyze', {
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
            } catch {
                setStates((prev) => ({ ...prev, [id]: { status: 'error', message: 'Network error' } }));
                continue;
            }

            setStates((prev) => ({ ...prev, [id]: { status: 'done', score } }));
        }

        setRunning(null);
        if (week) void loadRun(week);
    }, [week, scorable, model, loadRun]);

    /** One paper, on demand. Reuses the week's open run when there is one so a
     *  re-score lands beside its siblings rather than opening a run of one. */
    const runPaper = useCallback(
        async (paper: PaperRow) => {
            if (!week || !paper.id || !paper.held || running) return;
            const id = paper.id;
            cancelled.current = false;
            setRunning('analyst');
            setError(null);

            let runId = run?.id;
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
                const res = await fetch('/api/engine/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, title: paper.title, model, runId }),
                });
                const data = await res.json();
                ok = res.ok;
                setStates((prev) => ({
                    ...prev,
                    [id]: res.ok
                        ? { status: 'done', score: data as StoredScore }
                        : { status: 'error', message: data.error ?? 'Analysis failed' },
                }));
            } catch {
                setStates((prev) => ({ ...prev, [id]: { status: 'error', message: 'Network error' } }));
            }
            setRunning(null);
            // Re-read the week so this score joins the rest rather than standing
            // alone, and so `run` is populated for the next single-paper score.
            // Only on success: a reload after a failure would replace the error
            // with the previously stored score and hide that anything went wrong.
            if (ok) void loadRun(week);
        },
        [week, run, model, running, loadRun],
    );

    /** One critique, on demand. Same guard as the batch: a score that has
     *  already been challenged is never re-charged. */
    const criticPaper = useCallback(
        async (paper: PaperRow) => {
            if (!paper.id || running) return;
            const state = states[paper.id];
            // A re-run is allowed: changing the critic seat and challenging the
            // same row again is the point. Each run replaces the last.
            if (state?.status !== 'done') return;
            const score = state.score;

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
                const res = await fetch('/api/engine/critique', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: score.id,
                        title: score.title,
                        model: criticModel,
                        score,
                        scoreId: score.scoreId,
                    }),
                });
                const data = await res.json();
                setStates((prev) => ({
                    ...prev,
                    [score.id]: res.ok
                        ? { status: 'done', score: { ...score, critique: data } }
                        : { status: 'done', score },
                }));
            } catch {
                setStates((prev) => ({ ...prev, [score.id]: { status: 'done', score } }));
            }
            setRunning(null);
        },
        [states, run, criticModel, running],
    );

    /** Remove every saved reading of this paper in the selected week. Runs are
     *  append-only, so deleting just the newest score would expose an older one
     *  and the card would appear to restore itself on the next load. */
    const clearPaper = useCallback(
        async (paper: PaperRow) => {
            if (!week || !paper.id || running || clearingId) return;
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
                    Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith(`${id}:`))),
                );
                setOpenNote((prev) => (prev?.id === id ? null : prev));
                setRun((prev) => {
                    if (!prev) return null;
                    const scores = prev.scores.filter((score) => score.id !== id);
                    return scores.length ? { ...prev, scores } : null;
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to clear paper results');
            } finally {
                setClearingId(null);
            }
        },
        [week, running, clearingId, states],
    );

    /** Every paper in the week that has not been looked up. GitHub allows sixty
     *  unauthenticated calls an hour, so this is paced rather than fanned out. */
    const externalBatch = useCallback(async () => {
        if (!week || running) return;
        const pending = week.papers.filter((p) => p.id && !externals[p.id]);
        if (pending.length === 0) return;

        cancelled.current = false;
        setRunning('external');
        setError(null);

        for (const paper of pending) {
            if (cancelled.current) break;
            try {
                const res = await fetch('/api/engine/external', {
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
            } catch {
                /* one failure should not stop the sweep */
            }
        }
        setRunning(null);
    }, [week, running, externals, externalModel]);

    /** The critic pass. Walks the scores already on the page and challenges the
     *  ones not yet challenged, so it can be re-run against a different critic
     *  without paying for the analyst again. */
    const runCritic = useCallback(async () => {
        const pending = Object.values(states).filter(
            (s): s is Extract<RowState, { status: 'done' }> =>
                s.status === 'done' && !s.score.critique,
        );
        if (pending.length === 0) return;

        cancelled.current = false;
        setRunning('critic');
        setError(null);

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
            setStates((prev) => ({ ...prev, [score.id]: { status: 'running', stage: 'critic', score } }));
            try {
                const res = await fetch('/api/engine/critique', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: score.id,
                        title: score.title,
                        model: criticModel,
                        score,
                        scoreId: score.scoreId,
                    }),
                });
                const data = await res.json();
                // A critic that fails is not a scored paper that fails — the
                // analyst's row stands on its own.
                setStates((prev) => ({
                    ...prev,
                    [score.id]: res.ok
                        ? { status: 'done', score: { ...score, critique: data } }
                        : { status: 'done', score },
                }));
            } catch {
                setStates((prev) => ({ ...prev, [score.id]: { status: 'done', score } }));
            }
        }
        setRunning(null);
    }, [states, run, criticModel]);

    function stop() {
        cancelled.current = true;
    }

    /** Records the decision on the note. The stored score is left alone — the
     *  analyst's original is the prediction, and a row with two live scores is
     *  not a row. The interface layers accepted corrections at read time. */
    const resolveNote = useCallback(
        async (id: string, section: CriticSection, resolution: 'applied' | 'dismissed') => {
            setStates((prev) => {
                const s = prev[id];
                if (s?.status !== 'done' || !s.score.critique) return prev;
                return {
                    ...prev,
                    [id]: {
                        ...s,
                        score: {
                            ...s.score,
                            critique: {
                                ...s.score.critique,
                                notes: s.score.critique.notes.map((n) =>
                                    n.section === section ? { ...n, resolution } : n,
                                ),
                            },
                        },
                    },
                };
            });
            setOpenNote(null);

            const state = states[id];
            const noteId =
                state?.status === 'done'
                    ? state.score.critique?.notes.find((n) => n.section === section)?.noteId
                    : undefined;
            if (!noteId) return;
            try {
                await fetch(`/api/engine/notes/${noteId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ resolution }),
                });
            } catch {
                setError('Decision was not saved.');
            }
        },
        [states],
    );

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

    /** Highest first, unscored last, digest order to break ties. Reads the same
     *  score the card is showing — including a row mid-challenge, which still
     *  holds its analyst score and must keep its place while the critic runs. */
    const ranked = useMemo(() => {
        const product = (paper: PaperRow): number => {
            const held = heldScore(paper.id ? states[paper.id] : undefined);
            return held ? effectiveScore(held, held.critique?.notes ?? []).product : -1;
        };
        const papers = week?.papers ?? [];
        return [...papers].sort((a, b) => product(b) - product(a) || a.n - b.n);
    }, [week, states]);

    /** The open row's current score, read live rather than captured. */
    const breakdownScore = useMemo(
        () => (breakdown ? heldScore(states[breakdown]) : undefined),
        [breakdown, states],
    );

    const activeNote = useMemo(() => {
        if (!openNote) return null;
        const s = states[openNote.id];
        if (s?.status !== 'done' || !s.score.critique) return null;
        const note = s.score.critique.notes.find((n) => n.section === openNote.section);
        if (!note) return null;
        const current = openNote.section === 'summary' ? undefined : s.score[openNote.section].score;
        return { note, current };
    }, [openNote, states]);

    return (
        <div className="flex flex-1 items-start">
            <EngineAISidebar
                weeks={weeks}
                activeKey={activeKey}
                onSelect={selectWeek}
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
                <EngineHeader
                    week={week}
                    run={run}
                    running={running}
                    loading={loading}
                    scorable={scorable.length}
                    done={done}
                    spend={spend}
                    openFlags={openFlags}
                    pendingExternal={pendingExternal}
                    pendingCritique={pendingCritique}
                    criticOn={criticOn}
                    onParadigm={() => setShowParadigm(true)}
                    onRunWeek={runWeek}
                    onRunCritic={runCritic}
                    onRunExternal={externalBatch}
                    onStop={stop}
                />

                <div className="flex-1 px-8 py-6">
                    {error && (
                        <p className="mb-4 border border-stone-line px-4 py-3 font-sans text-[0.7rem] tracking-[0.03em] text-platinum-dim">
                            {error}
                        </p>
                    )}

                    {week && scorable.length === 0 && (
                        <p className="mb-4 border border-stone-line px-4 py-3 font-mono text-[0.62rem] leading-relaxed tracking-[0.06em] text-platinum-dim">
                            Nothing pulled for this week yet. Run{' '}
                            <span className="text-bronze">npm run pull</span> to fill the archive.
                        </p>
                    )}

                    <div className="flex flex-col gap-3">
                        {ranked.map((paper) => {
                            const key = paper.id ?? String(paper.n);
                            return (
                                <PaperCard
                                    key={key}
                                    paper={paper}
                                    state={(paper.id && states[paper.id]) || { status: 'idle' }}
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
                                    onRun={() => void runPaper(paper)}
                                    onCritic={() => void criticPaper(paper)}
                                    onBreakdown={() => paper.id && setBreakdown(paper.id)}
                                    onClear={() => void clearPaper(paper)}
                                    external={paper.id ? externals[paper.id] : undefined}
                                    standingAssumption={assumptionFor(
                                        paper.id ? states[paper.id] : undefined,
                                    )}
                                    busy={running !== null || clearingId !== null}
                                />
                            );
                        })}
                    </div>
                </div>
            </section>

            {showParadigm && <ParadigmModal onClose={() => setShowParadigm(false)} />}

            {breakdownScore && (
                <BreakdownModal
                    score={breakdownScore}
                    paradigm={paradigms.find(
                        (p) => p.asOf === breakdownScore.delta?.paradigmAsOf,
                    )}
                    onClose={() => setBreakdown(null)}
                />
            )}

            {openNote && activeNote && (
                <CriticModal
                    note={activeNote.note}
                    currentScore={activeNote.current}
                    onApply={() => resolveNote(openNote.id, openNote.section, 'applied')}
                    onDismiss={() => resolveNote(openNote.id, openNote.section, 'dismissed')}
                    onClose={() => setOpenNote(null)}
                />
            )}
        </div>
    );
}
