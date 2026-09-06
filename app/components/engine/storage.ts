'use client';

// ─── seat preferences ─────────────────────────────────────────────────────────
// Seat choices are UI preference, not data — localStorage, like the council's.

import { useEffect, useState } from 'react';

const PREFS_KEY = 'kyros_engine_prefs_v1';

// The engine's own defaults. The council keeps its own DEFAULT_MODEL — the two
// instruments have different jobs and should be tuned separately.
export const DEFAULT_ANALYST = 'openai/gpt-5.6-luna';

// A critic drawn from the analyst's own family tends to ratify rather than
// challenge, so the two seats start on different models.
export const DEFAULT_CRITIC = 'anthropic/claude-sonnet-5';

// Short input, short output, one classification. The cheapest capable model in
// the catalogue does this as well as anything above it.
export const DEFAULT_EXTERNAL = 'deepseek/deepseek-v4-flash';

export interface Prefs {
    model: string;
    criticModel: string;
    externalModel: string;
    criticOn: boolean;
}

export const DEFAULT_PREFS: Prefs = {
    model: DEFAULT_ANALYST,
    criticModel: DEFAULT_CRITIC,
    externalModel: DEFAULT_EXTERNAL,
    criticOn: true,
};

export function readPrefs(fallback: Prefs): Prefs {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = localStorage.getItem(PREFS_KEY);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw) as Partial<Prefs>;
        return {
            model: typeof parsed.model === 'string' ? parsed.model : fallback.model,
            criticModel:
                typeof parsed.criticModel === 'string' ? parsed.criticModel : fallback.criticModel,
            externalModel:
                typeof parsed.externalModel === 'string'
                    ? parsed.externalModel
                    : fallback.externalModel,
            criticOn: typeof parsed.criticOn === 'boolean' ? parsed.criticOn : fallback.criticOn,
        };
    } catch {
        return fallback;
    }
}

/** The four seats, restored after mount and written back on every change.
 *  `hydrated` guards the write so the defaults never overwrite a stored choice
 *  on the first pass. */
export function useEnginePrefs() {
    const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
    // Read after mount, never during render — the server has no localStorage
    // and a first paint that disagreed with it would hydrate mismatched.
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        // localStorage does not exist on the server, so the stored choice can
        // only be adopted after mount. Rendering it during the first paint
        // would hydrate against markup the server never produced.
        setPrefs(readPrefs(DEFAULT_PREFS));
        setHydrated(true);
        /* eslint-enable react-hooks/set-state-in-effect */
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        try {
            localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
        } catch { /* quota or private mode — the choice simply will not persist */ }
    }, [prefs, hydrated]);

    return { prefs, setPrefs };
}
