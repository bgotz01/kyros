'use client';

// ─── deciding on the critic ───────────────────────────────────────────────────
// A critique is a second opinion on a row that already exists, so accepting one
// never rewrites the stored score. The analyst's original is the prediction and
// the only thing that can later be graded; a decision is recorded on the note
// and layered over the row at read time by `effectiveScore`.
//
// So everything here writes to the NOTE, and the score the interface shows is
// derived. Both the paper-level decision and the bulk one are optimistic — the
// state moves first and rolls back if the write fails — because a decision that
// waits on a round trip reads as a broken button.

import { useCallback, useMemo, useState } from 'react';
import type { CriticSection } from '@/app/api/engine/critique/route';
import { heldScore, type RowState } from '@/app/engine/components/types';
import { allNotes, noteForSection } from '@/lib/engine/store';
import type { PaperRow, WeekRow } from '@/lib/engine/data';

type OpenNote = { id: string; section: CriticSection } | null;

export interface CriticDecisions {
    /** The note the modal is open on, if any. Clearing a paper closes the modal
     *  if it was showing that paper's note, which is why the setter is exposed
     *  with its functional form rather than as a plain assignment. */
    openNote: OpenNote;
    setOpenNote: React.Dispatch<React.SetStateAction<OpenNote>>;
    /** Every note id on screen, split by whether a decision has been made. */
    flagNotes: { open: string[]; applied: string[] };
    /** Decide one note, from the modal. */
    resolveNote: (
        id: string,
        section: CriticSection,
        /** `null` reverts the note, restoring the analyst's original score. */
        resolution: 'applied' | 'dismissed' | null,
    ) => Promise<void>;
    /** Decide every note on screen at once. `null` reverts them. */
    resolveFlags: (ids: string[], resolution: 'applied' | null) => Promise<void>;
}

export function useCriticDecisions({
    states,
    setStates,
    scopeWeeks,
    visibleFor,
    running,
    setError,
}: {
    states: Record<string, RowState>;
    setStates: React.Dispatch<React.SetStateAction<Record<string, RowState>>>;
    scopeWeeks: WeekRow[];
    visibleFor: (week: WeekRow) => PaperRow[];
    /** A pass in flight owns the rows; a bulk decision would race it. */
    running: string | null;
    setError: (message: string | null) => void;
}): CriticDecisions {
    const [openNote, setOpenNote] = useState<OpenNote>(null);

    /** Only disagreements that were actually stored can be decided on, so these
     *  are the exact set the bulk endpoint will write. */
    const flagNotes = useMemo(() => {
        const open: string[] = [];
        const applied: string[] = [];
        for (const week of scopeWeeks) {
            for (const paper of visibleFor(week)) {
                if (!paper.id) continue;
                const held = heldScore(states[paper.id]);
                for (const note of held ? allNotes(held) : []) {
                    if (!note.noteId) continue;
                    if (note.agrees) continue;
                    if (!note.resolution) open.push(note.noteId);
                    else if (note.resolution === 'applied') applied.push(note.noteId);
                }
            }
        }
        return { open, applied };
    }, [scopeWeeks, visibleFor, states]);

    /** Every note on screen at once. Optimistic, and rolled back on failure —
     *  a bulk decision that half-lands is worse than one that does not. */
    const resolveFlags = useCallback(
        async (ids: string[], resolution: 'applied' | null) => {
            if (running || ids.length === 0) return;
            const targets = new Set(ids);

            const patch = (next: 'applied' | null) =>
                setStates((prev) => {
                    const out = { ...prev };
                    for (const [id, state] of Object.entries(prev)) {
                        if (state.status !== 'done') continue;
                        const notes = allNotes(state.score);
                        if (!notes.some((n) => n.noteId && targets.has(n.noteId))) continue;
                        out[id] = {
                            ...state,
                            score: {
                                ...state.score,
                                critiques: (state.score.critiques ?? []).map((c) => ({
                                    ...c,
                                    notes: c.notes.map((n) =>
                                        n.noteId && targets.has(n.noteId)
                                            ? { ...n, resolution: next ?? undefined }
                                            : n,
                                    ),
                                })),
                            },
                        };
                    }
                    return out;
                });

            patch(resolution);
            setError(null);

            try {
                const res = await fetch('/api/engine/notes', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids, resolution }),
                });
                if (!res.ok) throw new Error();
            } catch {
                patch(resolution === 'applied' ? null : 'applied');
                setError(
                    resolution === 'applied'
                        ? 'Could not apply those corrections.'
                        : 'Could not revert those corrections.',
                );
            }
        },
        [running, setStates, setError],
    );

    /** Records the decision on the note. The stored score is left alone — the
     *  analyst's original is the prediction, and a row with two live scores is
     *  not a row. The interface layers accepted corrections at read time. */
    const resolveNote = useCallback(
        async (id: string, section: CriticSection, resolution: 'applied' | 'dismissed' | null) => {
            // The flag shows the NEWEST note for a section, so that is the one a
            // decision lands on. Resolving every round's note for the section
            // would silently re-decide readings the user never opened.
            const before = states[id];
            const target =
                before?.status === 'done' ? noteForSection(before.score, section) : undefined;
            const noteId = target?.noteId;

            setStates((prev) => {
                const s = prev[id];
                if (s?.status !== 'done' || !noteId) return prev;
                return {
                    ...prev,
                    [id]: {
                        ...s,
                        score: {
                            ...s.score,
                            critiques: (s.score.critiques ?? []).map((c) => ({
                                ...c,
                                notes: c.notes.map((n) =>
                                    n.noteId === noteId ? { ...n, resolution } : n,
                                ),
                            })),
                        },
                    },
                };
            });
            setOpenNote(null);
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
        [states, setStates, setError],
    );

    return { openNote, setOpenNote, flagNotes, resolveNote, resolveFlags };
}
