// ─── labels ───────────────────────────────────────────────────────────────────
// Every string the engine's rows put in front of a reader. Pure functions —
// nothing here fetches, and nothing here decides.

import type { PaperRow } from '@/lib/engineData';
import type { EngineScore } from '@/app/api/engine/analyze/route';
import type { External } from '@/app/api/engine/external/route';
import type { RepoFacts } from '@/lib/engineExternal';
import type { RankKey } from './types';

const CONTRIBUTIONS = new Set([
    'New capability',
    'Workflow automation',
    'Efficiency and cost',
    'Quality and reliability',
    'Infrastructure and tooling',
    'Access and distribution',
    'Evaluation and measurement',
    'Research synthesis',
]);

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

/** New rows carry a reader-facing contribution type directly. For saved rows
 *  from the old academic taxonomy, the practical outcome is a better label
 *  than "Applications · AI systems" and lets the improved card read sensibly
 *  before a paper is rescored. */
export function contributionLabel(score: EngineScore): string {
    if (CONTRIBUTIONS.has(score.category)) return score.category;
    const byOutcome: Record<string, string> = {
        'New workflow': 'Workflow automation',
        'Efficiency gain': 'Efficiency and cost',
        'Cost reduction': 'Efficiency and cost',
        'Quality gain': 'Quality and reliability',
        'New capability': 'New capability',
    };
    if (byOutcome[score.incentives.outcomeKind]) return byOutcome[score.incentives.outcomeKind];
    if (score.category === 'Evaluation') return 'Evaluation and measurement';
    if (score.category === 'Survey') return 'Research synthesis';
    if (score.category === 'Alignment') return 'Quality and reliability';
    return score.category === 'Applications' ? 'Workflow automation' : 'Infrastructure and tooling';
}

export function paradigmLocation(score: EngineScore): string {
    if (!score.delta) return score.level || 'Unlocated';
    const layer = score.delta.layer.charAt(0).toUpperCase() + score.delta.layer.slice(1);
    return score.delta.proposes ? `${layer} → ${score.delta.proposes}` : layer;
}

/** YYYY-MM-DD where the archive knows the exact v1 date; YYYY-MM for legacy
 *  entries whose arXiv id is the only date evidence held locally. */
export function publicationLabel(value: string): string {
    const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value);
    if (!m) return value;
    const month = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' })
        .format(new Date(`${m[1]}-${m[2]}-01T00:00:00Z`))
        .toUpperCase();
    return m[3] ? `${Number(m[3])} ${month} ${m[1]}` : `${month} ${m[1]}`;
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
    if (key === 'incentives') return incentiveHeadline(score.incentives.score);
    const block = score[key];
    if (block.headline) return block.headline;
    // Fall back to the first detail bullet for rows scored before headlines.
    if (key === 'inversion') return score.inversion.inverting[0] ?? '';
    return score.inflection.unprecedented[0] ?? '';
}

const BOTTLENECK_LABELS: Record<string, string> = {
    'compute-cost-and-availability': 'Building AI is expensive',
    'inference-cost-and-latency': 'Running AI is expensive',
    reliability: 'Trustworthy results',
    agency: 'Getting work done, not just answered',
    'closed-frontier': 'The best models are closed',
    'context-and-memory': 'Remembering across sessions',
    'data-quality-and-supply': 'Enough high-quality training data',
    customization: 'Adapting a model to your own work',

    // Retired ids, kept so rows scored against an earlier vocabulary still read.
    'compute-and-energy': 'Building AI is expensive',
    'reliability-and-verification': 'Trustworthy results',
    'access-to-frontier-methods': 'The best models are closed',
    'economics-and-diffusion': 'Making AI useful in real work',
    'data-and-token-supply': 'Enough high-quality training data',
    'memory-and-continual-learning': 'Remembering across sessions',
    'agency-and-action-surface': 'Getting work done, not just answered',

    none: 'No key bottleneck identified',
};

const OUTCOME_LABELS: Record<string, string> = {
    'Efficiency gain': 'Faster or more efficient',
    'Cost reduction': 'Lower cost',
    'New workflow': 'Automates a workflow',
    'New capability': 'Enables something new',
    'Quality gain': 'Better results',
    'Training data reduction': 'Needs less training data',
    'Easier deployment': 'Easier to adopt',
    'Open access': 'Open and reproducible',
    None: 'No measured practical benefit',
};

const FIT_LABELS: Record<string, string> = {
    none: 'Does not address it',
    adjacent: 'Related, but not demonstrated',
    direct: 'Directly tested',
};

const IMPACT_LABELS: Record<string, string> = {
    negligible: 'No meaningful change',
    incremental: 'Small improvement',
    material: 'Meaningful improvement',
    structural: 'Removes it for some uses',
};

/** I³ in the same everyday register as I². "Precedent" and "position" are the
 *  instrument's vocabulary; a reader wants to know whether anyone had done this
 *  before and whether the field was already heading there. */
const PRECEDENT_LABELS: Record<string, string> = {
    established: 'Standard practice already',
    demonstrated: 'Shown before, at smaller scale',
    claimed: 'Claimed before, never shown',
    none: 'No prior demonstration',
};

const POSITION_LABELS: Record<string, string> = {
    dominant: 'This is the incumbent',
    minor: 'Exists, but written off',
    frontier: 'Everyone is already trying it',
    absent: 'Nobody was doing this',
};

export function inflectionPrecedent(score: EngineScore): string {
    return PRECEDENT_LABELS[score.inflection.precedent ?? 'demonstrated'];
}

export function inflectionPosition(position?: string): string {
    return POSITION_LABELS[position ?? ''] ?? 'Not placed in the paradigm';
}

export function incentiveHeadline(score: number): string {
    if (score >= 8) return 'Removes a key bottleneck';
    if (score >= 5) return 'Meaningfully reduces a key bottleneck';
    if (score >= 3) return 'Small improvement, bottleneck remains';
    return 'Does not remove a key bottleneck';
}

export function incentiveProblem(score: EngineScore): string {
    const { bottleneckId, bottleneckName } = score.incentives;
    if (bottleneckId && BOTTLENECK_LABELS[bottleneckId]) return BOTTLENECK_LABELS[bottleneckId];
    return bottleneckId === 'none' ? BOTTLENECK_LABELS.none : bottleneckName || BOTTLENECK_LABELS.none;
}

export function incentiveBenefit(score: EngineScore): string {
    return OUTCOME_LABELS[score.incentives.outcomeKind] || score.incentives.outcomeKind || OUTCOME_LABELS.None;
}

export function incentiveFit(score: EngineScore): string {
    return FIT_LABELS[score.incentives.bottleneckFit ?? 'none'];
}

export function incentiveImpact(score: EngineScore): string {
    return IMPACT_LABELS[score.incentives.impact ?? 'negligible'];
}

/** A compact practical benefit beside I². The archival bottleneck name and the
 *  scorer's fit/materiality vocabulary belong in the instrument, not its UI. */
export function outcomeNote(score: EngineScore): string | undefined {
    const { outcomeKind, outcomeEstimate } = score.incentives;
    const parts = [incentiveBenefit(score)];
    if (outcomeEstimate) parts.push(outcomeEstimate);
    else if (outcomeKind && outcomeKind !== 'None') parts.push('Not quantified');
    return parts.length ? `· ${parts.join(' · ')}` : undefined;
}
