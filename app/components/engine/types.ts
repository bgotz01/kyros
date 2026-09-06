// ─── engine view vocabulary ───────────────────────────────────────────────────
// The three laws as the interface names them, and the row states a card walks
// through. Scoring shapes live in the API routes; this is only how they read.

import type { CriticSection } from '@/app/api/engine/critique/route';
import type { StoredScore } from '@/lib/engineStore';

export const LAWS = [
    { key: 'inversion', symbol: 'I¹', name: 'Inversion' },
    { key: 'incentives', symbol: 'I²', name: 'Incentives' },
    { key: 'inflection', symbol: 'I³', name: 'Inflection' },
] as const;

/** The ranked view reads in the reverse of the scoring order: is it an
 *  inflection, what does it buy, and only then what it overturns. The laws are
 *  named as the corpus names them — a reader who has the frame should not have
 *  to translate a friendlier label back into it. */
export const RANKS = [
    { key: 'inflection', label: 'Inflection', symbol: 'I³' },
    { key: 'incentives', label: 'Incentives', symbol: 'I²' },
    { key: 'inversion', label: 'Inversion', symbol: 'I¹' },
] as const;

export type RankKey = (typeof RANKS)[number]['key'];

/** Rows that open independently — the three ranks plus the shared panels. */
export type RowKey = RankKey | 'overview' | 'digest';

export const VERDICT_COLOR: Record<string, string> = {
    inflection: 'text-bronze-bright',
    latent: 'text-platinum',
    noise: 'text-platinum-dim',
};

/** Which critic section flags which rank. */
export const DETAIL_FOR: Record<RankKey, CriticSection> = {
    inflection: 'inflection',
    incentives: 'incentives',
    inversion: 'inversion',
};

export type RowState =
    | { status: 'idle' }
    | { status: 'running'; stage: 'analyst' | 'critic'; score?: StoredScore }
    | { status: 'done'; score: StoredScore }
    | { status: 'error'; message: string };

/** The score a row is holding, scored or mid-challenge.
 *
 *  A paper being challenged still has its analyst score — the critic is a
 *  second opinion on a row that already exists, not a rescoring of it. Reading
 *  only 'done' would make the row unscored for the length of the call, which
 *  the card never did and the ranking must not do either: it would drop to the
 *  foot of the week and climb back when the call returned. */
export function heldScore(state: RowState | undefined): StoredScore | undefined {
    if (!state) return undefined;
    return state.status === 'done' || state.status === 'running' ? state.score : undefined;
}

/** A resolved objection, or one still waiting on a decision. */
export type FlagState = 'open' | 'applied' | 'dismissed';
