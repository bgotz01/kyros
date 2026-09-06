// ─── labels ───────────────────────────────────────────────────────────────────
// Every string the engine's rows put in front of a reader. Pure functions —
// nothing here fetches, and nothing here decides.

import type { PaperRow } from '@/lib/engineData';
import type { EngineScore } from '@/app/api/engine/analyze/route';
import type { External } from '@/app/api/engine/external/route';
import type { RepoFacts } from '@/lib/engineExternal';
import type { RankKey } from './types';

export function band(score: number): string {
    if (score >= 900) return 'Historical outlier';
    if (score >= 600) return 'Exceptional inflection';
    if (score >= 300) return 'Paradigm-defining';
    if (score >= 100) return 'Structural shift';
    if (score >= 27) return 'Significant contribution';
    if (score >= 1) return 'Enabling contribution';
    return 'Below threshold';
}

/** Where to send a reader who wants the paper itself. */
export function sourceUrl(paper: PaperRow): string {
    if (paper.id) return `https://arxiv.org/abs/${paper.id}`;
    return paper.links.find((l) => /paper/i.test(l.label))?.url ?? paper.links[0]?.url ?? '';
}

export function starLabel(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k★`;
    return `${n}★`;
}

export function sinceLabel(iso: string | null): string {
    if (!iso) return 'unknown';
    const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
    if (days < 1) return 'today';
    if (days < 60) return `${days}d ago`;
    if (days < 730) return `${Math.round(days / 30)}mo ago`;
    return `${(days / 365).toFixed(1)}y ago`;
}

/** The repository to put beside the paper's own link — its artefact, and only
 *  its artefact. A baseline's star count says nothing about this paper, and the
 *  baselines are frequently the famous ones: showing the best-starred linked
 *  repository would credit FLUX's 25k to the paper that merely compared against
 *  it. Where no artefact was identified the tag says so instead. */
export function artefactRepo(external: External): RepoFacts | undefined {
    return external.repos.find((r) => r.role === 'artefact');
}

export function rankHeadline(score: EngineScore, key: RankKey): string {
    const block = score[key];
    if (block.headline) return block.headline;
    // Fall back to the first detail bullet for rows scored before headlines.
    if (key === 'inversion') return score.inversion.inverting[0] ?? '';
    if (key === 'incentives') return score.incentives.bottleneck[0] ?? '';
    return score.inflection.unprecedented[0] ?? '';
}

/** The shape of the gain and its size. An unmeasured gain is called out rather
 *  than left to look like a measured one. */
export function outcomeNote(score: EngineScore): string | undefined {
    const { outcomeKind, outcomeEstimate } = score.incentives;
    if (!outcomeKind || outcomeKind === 'None') return undefined;
    if (!outcomeEstimate) return `· ${outcomeKind}`;
    return `· ${outcomeKind} · ${outcomeEstimate}`;
}
