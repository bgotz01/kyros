'use client';

// ─── the month, loaded ────────────────────────────────────────────────────────
// Everything the page reads from the server before a single pass runs: the
// digests, the stored runs, the rows set aside, the repository evidence, and the
// dated snapshots.
//
// The reload guard is the part worth understanding. The path is the reading —
// which month is open is resolved from the address rather than held beside it,
// so the rail, the back button and a pasted link can never disagree. But the
// fragment ALSO moves as the reader walks between weeks and papers, and this
// effect watches the same address. Re-reading every run on each of those moves
// would blank the scores already on the cards, so the load is keyed by
// year:month and runs once per month rather than once per address.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Scope } from '@/app/engine/components/MonthHeader';
import { heldScore, type RowState } from '@/app/engine/components/types';
import type { Aside } from '@/app/api/engine/aside/route';
import type { External } from '@/app/api/engine/external/route';
import type { PaperRow, WeekRow } from '@/lib/engine/data';
import type { StoredRun } from '@/lib/engine/store';
import { monthFromSlug, resolveMonth } from '@/lib/engine/routes';
import type { Paradigm } from '@/lib/engine/paradigm';

const DOMAIN = 'ai';

export interface MonthData {
    /** Every digest week in the corpus. */
    weeks: WeekRow[];
    /** The weeks of the month named in the path. */
    monthWeeks: WeekRow[];
    /** The month's name as the route resolved it, or null if the slug is junk. */
    monthName: string | null;

    /** Per-paper reading state, keyed by arXiv id. */
    states: Record<string, RowState>;
    setStates: React.Dispatch<React.SetStateAction<Record<string, RowState>>>;
    /** The stored run per week index. */
    runs: Record<number, StoredRun | null>;
    setRuns: React.Dispatch<React.SetStateAction<Record<number, StoredRun | null>>>;
    /** Digest rows taken out of the reading, as `weekIdx:n`. */
    aside: Set<string>;
    setAside: React.Dispatch<React.SetStateAction<Set<string>>>;
    /** Repository evidence, keyed by paper — it survives re-scores. */
    externals: Record<string, External>;
    setExternals: React.Dispatch<React.SetStateAction<Record<string, External>>>;
    /** Every converted snapshot, newest first. */
    paradigms: Paradigm[];

    loading: boolean;
    /** The `year:month` whose runs are on screen. Until this matches, the
     *  numbers mean nothing. */
    loadedFor: string | null;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;

    /** One week's stored run, re-read without disturbing the rest of the month. */
    loadWeek: (week: WeekRow) => Promise<void>;
    /** Whether a paper already holds a reading. */
    isRead: (paper: PaperRow) => boolean;
}

export function useMonthData({
    year,
    monthParam,
    setSelected,
    setOpenRows,
    setAnchor,
}: {
    year: string;
    monthParam: string;
    /** Opening a different month resets what is on screen with it. */
    setSelected: (scope: Scope) => void;
    setOpenRows: (rows: Record<string, boolean>) => void;
    setAnchor: (anchor: string) => void;
}): MonthData {
    const [weeks, setWeeks] = useState<WeekRow[]>([]);
    const [states, setStates] = useState<Record<string, RowState>>({});
    const [runs, setRuns] = useState<Record<number, StoredRun | null>>({});
    const [aside, setAside] = useState<Set<string>>(new Set());
    const [externals, setExternals] = useState<Record<string, External>>({});
    const [paradigms, setParadigms] = useState<Paradigm[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadedFor, setLoadedFor] = useState<string | null>(null);
    /** A failure while fetching. The route's own errors are derived below
     *  rather than stored — a bad month slug is a property of the address, not
     *  an event, and setting it from an effect made the page re-render to say
     *  what it already knew. */
    const [fetchError, setFetchError] = useState<string | null>(null);

    const monthName = useMemo(() => monthFromSlug(monthParam), [monthParam]);
    const monthWeeks = useMemo(
        () => (monthName ? resolveMonth(weeks, year, monthName) : []),
        [weeks, year, monthName],
    );

    /** One week's stored run, re-read without disturbing the rest of the month. */
    const loadWeek = useCallback(async (week: WeekRow) => {
        try {
            const res = await fetch(
                `/api/engine/runs?domain=${DOMAIN}&year=${week.year}&weekIdx=${week.idx}`,
            );
            const stored = (await res.json()) as StoredRun | null;
            setRuns((prev) => ({ ...prev, [week.idx]: stored }));
            if (stored) {
                setStates((prev) => ({
                    ...prev,
                    ...Object.fromEntries(
                        stored.scores.map((s) => [s.id, { status: 'done', score: s } as RowState]),
                    ),
                }));
            }
        } catch {
            // The cards keep what they are already showing.
        }
    }, []);

    /** Whatever was scored across the month last time, rehydrated. */
    const loadMonth = useCallback(async (mWeeks: WeekRow[], key: string) => {
        setLoading(true);
        try {
            const stored = await Promise.all(
                mWeeks.map(async (w) => {
                    try {
                        const res = await fetch(
                            `/api/engine/runs?domain=${DOMAIN}&year=${w.year}&weekIdx=${w.idx}`,
                        );
                        return [w.idx, (await res.json()) as StoredRun | null] as const;
                    } catch {
                        return [w.idx, null] as const;
                    }
                }),
            );
            setRuns(Object.fromEntries(stored));
            setStates(
                Object.fromEntries(
                    stored.flatMap(([, run]) =>
                        run
                            ? run.scores.map((s) => [s.id, { status: 'done', score: s } as RowState])
                            : [],
                    ),
                ),
            );

            const indices = mWeeks.map((w) => w.idx).join(',');

            // Which rows are out of the reading. Fetched before anything is
            // rendered from it, so a set-aside row never flashes into the week
            // and then vanishes.
            try {
                const rows = (await (
                    await fetch(
                        `/api/engine/aside?domain=${DOMAIN}&year=${mWeeks[0].year}&weekIdx=${indices}`,
                    )
                ).json()) as Aside[];
                setAside(new Set(rows.map((r) => `${r.weekIdx}:${r.n}`)));
            } catch {
                setAside(new Set());
            }

            // Repository evidence is keyed by paper, so it survives re-scores and
            // is fetched for the whole month in one call.
            const ids = mWeeks
                .flatMap((w) => w.papers.map((p) => p.id))
                .filter(Boolean)
                .join(',');
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

            setLoadedFor(key);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetch('/api/engine/weeks')
            .then((r) => r.json())
            .then((rows: WeekRow[]) => setWeeks(rows))
            .catch(() => setFetchError('Could not load the digests.'));
    }, []);

    useEffect(() => {
        fetch('/api/engine/paradigm')
            .then((r) => r.json())
            .then((rows: Paradigm[]) => setParadigms(Array.isArray(rows) ? rows : []))
            .catch(() => setParadigms([]));
    }, []);

    /** Guarded by the month actually loaded — see the note at the top of this
     *  file. Without the key, walking between papers would re-read every run. */
    const loadedKey = useRef<string | null>(null);

    /** What the address itself is wrong about, read during render. */
    const routeError = useMemo(() => {
        if (weeks.length === 0) return null;
        if (!monthName) return `No month named "${monthParam}".`;
        if (monthWeeks.length === 0) return `No digests for ${monthName} ${year}.`;
        return null;
    }, [weeks, monthName, monthWeeks, monthParam, year]);

    useEffect(() => {
        if (weeks.length === 0 || !monthName || monthWeeks.length === 0) return;

        const key = `${year}:${monthName}`;
        if (loadedKey.current === key) return;
        loadedKey.current = key;

        setStates({});
        setRuns({});
        setAside(new Set());
        setSelected('all');
        setOpenRows({});
        setFetchError(null);
        setLoadedFor(null);
        setAnchor(window.location.hash.slice(1));
        void loadMonth(monthWeeks, key);
    }, [
        weeks,
        year,
        monthParam,
        monthName,
        monthWeeks,
        loadMonth,
        setSelected,
        setOpenRows,
        setAnchor,
    ]);

    /** Whether a paper already holds a reading. The batch and the card's own
     *  ▷ both ask this: a score is never overwritten, so the way back to an
     *  unread paper is CLEAR, which removes every saved reading of it. */
    const isRead = useCallback(
        (paper: PaperRow): boolean => Boolean(paper.id && heldScore(states[paper.id])),
        [states],
    );

    return {
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
        error: routeError ?? fetchError,
        setError: setFetchError,
        loadWeek,
        isRead,
    };
}
