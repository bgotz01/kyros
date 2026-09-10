// ─── labels ───────────────────────────────────────────────────────────────────
// Every string the engine's rows put in front of a reader. Pure functions —
// nothing here fetches, and nothing here decides.

import type { PaperRow } from '@/lib/engine/data';
import type { EngineScore } from '@/app/api/engine/analyze/route';
import type { External } from '@/app/api/engine/external/route';
import type { RepoFacts } from '@/lib/engine/external';
import {
    LAW_SCALE,
    LEVEL_RUBRIC,
    scoreBand,
    type LawId,
    type Level,
    type Score,
} from '@/lib/engine/paradigm';
import type { RankKey } from './types';

/** What ONE law's 0-10 score means. Distinct from `productBand` below, which
 *  reads the 0-1,000 multiplication — the two are different scales and showing
 *  one where the other belongs is the easiest mistake to make here. */
export function lawBand(score: number, law: LawId): string {
    return scoreBand(score, law);
}

export function productBand(score: number): string {
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

/** Where the row sits, for the card's eyebrow. The tag is filing copied off the
 *  selected baseline claim and has no bearing on any score; the stack level is
 *  the fallback for a row that contradicted nothing. */
export function paradigmLocation(score: EngineScore): string {
    // The card's force line reads I¹'s selection, and both of its forces where
    // it named two — the second belongs here rather than only in the analysis,
    // because "which forces does this move" is the question the line answers.
    const also = score.inversion.secondaryId;
    if (score.tag && also) {
        const pair = `${score.tag} · ${also}`.toUpperCase();
        return score.stratum ? `${pair} · ${score.stratum}` : pair;
    }
    if (!score.tag) return score.stratum || 'Unlocated';
    const tag = score.tag.charAt(0).toUpperCase() + score.tag.slice(1);
    return score.stratum ? `${tag} · ${score.stratum}` : tag;
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
    const block = score[key];
    if (block.headline) return block.headline;
    // Fall back to the first detail bullet for rows scored before headlines.
    if (key === 'inversion') return score.inversion.inverting[0] ?? '';
    if (key === 'incentives') return incentiveHeadline(score.incentives.score);
    return score.inflection.unprecedented[0] ?? '';
}

/** The forces a snapshot can name, in everyday language. A row carries the
 *  force's own wording too; this is the shorter form the card uses.
 *
 *  Retired ids are kept because a stored row is a frozen prediction and must go
 *  on reading in the vocabulary it was scored under. */
const PRESSURE_LABELS: Record<string, string> = {
    // The six forces.
    compute: 'Cheaper frontier capability',
    architecture: 'Beyond the dominant architecture',
    scaling: 'Capability beyond pretraining scale',
    access: 'Frontier capability, open and available',
    agency: 'Getting work done, not just answered',
    persistence: 'Learning and remembering from use',

    // Retired ids, from the three-list schema.
    'compute-cost': 'Building AI is expensive',
    'inference-cost': 'Running AI is expensive',
    reliability: 'Trustworthy results',
    'closed-access': 'The best models are closed',
    memory: 'Remembering across sessions',
    'data-supply': 'Enough high-quality training data',
    customisation: 'Adapting a model to your own work',

    // Retired ids, from the layer/bottleneck schema.
    'compute-cost-and-availability': 'Building AI is expensive',
    'inference-cost-and-latency': 'Running AI is expensive',
    'closed-frontier': 'The best models are closed',
    'context-and-memory': 'Remembering across sessions',
    'data-quality-and-supply': 'Enough high-quality training data',
    customization: 'Adapting a model to your own work',
    'compute-and-energy': 'Building AI is expensive',
    'reliability-and-verification': 'Trustworthy results',
    'access-to-frontier-methods': 'The best models are closed',
    'economics-and-diffusion': 'Making AI useful in real work',
    'data-and-token-supply': 'Enough high-quality training data',
    'memory-and-continual-learning': 'Remembering across sessions',
    'agency-and-action-surface': 'Getting work done, not just answered',
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

/** The rung, in the reader's language rather than the instrument's. The
 *  instrument's own wording is in LEVEL_RUBRIC and shown in the breakdown. */
const LEVEL_LABELS: Record<LawId, Record<Level, string>> = {
    inversion: {
        0: 'Leaves the paradigm untouched',
        1: 'The assumption survives intact',
        2: 'A small variation inside how things work',
        3: 'Changes how the work gets done',
        4: 'Puts a core assumption to the test',
        5: 'Overturns a core assumption',
    },
    incentives: {
        0: 'No standing problem it answers',
        1: 'Too weak a connection to matter',
        2: 'A small saving in effort or cost',
        3: 'Solves a real bottleneck in the work',
        4: 'Attacks a problem the whole field has',
        5: 'Answers a problem fundamental enough to reshape the field',
    },
    inflection: {
        0: 'This already existed',
        1: 'A trivial variation on what existed',
        2: 'A better version of what existed',
        3: 'A new way of working, or a big step on what existed',
        4: 'New enough to stretch what the field can make',
        5: 'Something the field could not make before',
    },
};

export function levelLabel(law: LawId, level: Level): string {
    return LEVEL_LABELS[law][level];
}

/** The instrument's own wording for a rung, for the breakdown where the reader
 *  is being shown how the score was reached rather than what it means. */
/** The instrument's own wording for a 0-10 rung. */
export function lawScale(law: LawId, score: Score): string {
    return LAW_SCALE[law][score];
}

export function levelRubric(law: LawId, level: Level): string {
    return LEVEL_RUBRIC[law][level];
}

/** The force's pre-written inflection criterion — the thing I³ measured this
 *  creation against, written into the snapshot before the paper was read. */
export function inflectionCriterion(score: EngineScore): string {
    const { dimensionId, criterion } = score.inflection;
    if (!dimensionId) return 'Moves none of the six forces';
    return criterion || dimensionId;
}

/** Fallback only, for a row whose I² headline is missing. I² used to be
 *  measured against a broad "pressure", so a canned phrase about bottlenecks
 *  could stand in for one — and `rankHeadline` preferred it over the analyst's
 *  own words, which is why every I² row on the card read alike. It now asks how
 *  much of a named force's incentive was delivered, and the analyst's headline
 *  says which force and how much. */
export function incentiveHeadline(score: number): string {
    if (score >= 9) return 'Delivers the incentive outright';
    if (score >= 7) return 'Delivers the incentive materially';
    if (score >= 5) return 'Delivers a real part of it';
    if (score >= 3) return 'Small gain toward it';
    return 'Delivers none of it';
}

export function incentiveProblem(score: EngineScore): string {
    const { dimensionId, incentive } = score.incentives;
    if (!dimensionId) return 'Delivers none of the six incentives';
    return PRESSURE_LABELS[dimensionId] ?? incentive ?? dimensionId;
}

export function incentiveBenefit(score: EngineScore): string {
    return OUTCOME_LABELS[score.incentives.outcomeKind] || score.incentives.outcomeKind || OUTCOME_LABELS.None;
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
