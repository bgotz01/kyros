// ─── engine view vocabulary ───────────────────────────────────────────────────
// The three laws as the interface names them, and the row states a card walks
// through. Scoring shapes live in the API routes; this is only how they read.

import type { CriticSection } from '@/app/api/engine/critique/route';
import type { Level } from '@/lib/engine/paradigm';
import type { StoredScore } from '@/lib/engine/store';

export const LAWS = [
    { key: 'inversion', symbol: 'I¹', name: 'Inversion' },
    { key: 'incentives', symbol: 'I²', name: 'Incentives' },
    { key: 'inflection', symbol: 'I³', name: 'Inflection' },
] as const;

/** Read in scoring order. The three I names are the frame's stable vocabulary;
 *  friendlier descriptions belong inside their details, not in their place. */
export const RANKS = [
    { key: 'inversion', label: 'Inversion', symbol: 'I¹' },
    { key: 'incentives', label: 'Incentives', symbol: 'I²' },
    { key: 'inflection', label: 'Inflection', symbol: 'I³' },
] as const;

/** The I¹ bullets answer a different question at each rung. "What it overturns"
 *  is simply wrong above a row that only made something faster. */
export const LEVEL_HEADING: Record<Level, string> = {
    0: 'What it leaves standing',
    1: 'What it varies',
    2: 'What it questions',
    3: 'What it offers instead',
    4: 'What it reverses',
    5: 'What it makes unnecessary',
};

/** The same idea on the eleven-rung scale: the I¹ bullets answer a different
 *  question at each height, and "what it overturns" is simply wrong above a row
 *  that only made something faster. */
export function inversionHeading(score: number): string {
    if (score >= 9) return 'What it makes unnecessary';
    if (score >= 7) return 'What it questions';
    if (score >= 4) return 'What it offers instead';
    if (score >= 2) return 'What it varies';
    return 'What it leaves standing';
}

export type RankKey = (typeof RANKS)[number]['key'];

/** Rows that open independently — the three ranks plus the shared panels. */
export type RowKey = RankKey | 'analysis' | 'context';

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
