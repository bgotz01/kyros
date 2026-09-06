// ─── engine persistence ──────────────────────────────────────────────────────
// Shapes shared between the routes and the page. The stored score is the
// analyst's original and is never mutated; a critic's accepted correction is
// layered over it at read time, so both the prediction and the correction
// survive.

import type { EngineScore } from '@/app/api/engine/analyze/route';
import type { Critique, CriticNote, CriticSection } from '@/app/api/engine/critique/route';

export interface StoredScore extends EngineScore {
    /** Database id — needed to attach a critique or resolve a note. */
    scoreId: string;
    scoredAt: string;
    critique?: Critique;
}

export interface StoredRun {
    id: string;
    domain: string;
    year: string;
    weekIdx: number;
    heading: string;
    analystModel: string;
    criticModel: string | null;
    frameReviewedAt: string | null;
    startedAt: string;
    scores: StoredScore[];
}

const LAW_FIELD = {
    inversion: 'inverting',
    incentives: 'bottleneck',
    inflection: 'unprecedented',
} as const;

export type LawKey = keyof typeof LAW_FIELD;

export function isLaw(section: CriticSection): section is LawKey {
    return section in LAW_FIELD;
}

export function lawBullets(score: EngineScore, key: LawKey): string[] {
    if (key === 'inversion') return score.inversion.inverting;
    if (key === 'incentives') return score.incentives.bottleneck;
    return score.inflection.unprecedented;
}

/** The analyst's row with every applied correction layered on top. The stored
 *  row is untouched; this is what the interface reads. */
export function effectiveScore(score: EngineScore, notes: CriticNote[] = []): EngineScore {
    let out: EngineScore = { ...score };

    for (const note of notes) {
        if (note.resolution !== 'applied') continue;
        const bullets = note.proposedBullets?.length ? note.proposedBullets : undefined;

        if (note.section === 'summary') {
            if (bullets) out = { ...out, summary: bullets };
            continue;
        }
        if (!isLaw(note.section)) continue;

        if (note.section === 'inversion') {
            out = {
                ...out,
                inversion: {
                    ...out.inversion,
                    score: note.proposedScore ?? out.inversion.score,
                    inverting: bullets ?? out.inversion.inverting,
                },
            };
        } else if (note.section === 'incentives') {
            out = {
                ...out,
                incentives: {
                    ...out.incentives,
                    score: note.proposedScore ?? out.incentives.score,
                    bottleneck: bullets ?? out.incentives.bottleneck,
                },
            };
        } else {
            out = {
                ...out,
                inflection: {
                    ...out.inflection,
                    score: note.proposedScore ?? out.inflection.score,
                    unprecedented: bullets ?? out.inflection.unprecedented,
                },
            };
        }
    }

    // The paradigm ceiling holds through a correction too — accepting a higher
    // inversion score cannot raise it above the importance of what was inverted.
    out.inversion = {
        ...out.inversion,
        score: Math.min(out.inversion.score, out.inversion.paradigmImportance || 10),
    };
    // Critic corrections may lower I² but cannot override the mechanical
    // snapshot/fit/materiality ceiling recorded by the analyst route.
    if (out.incentives.ceiling !== undefined) {
        out.incentives = {
            ...out.incentives,
            score: Math.min(out.incentives.score, out.incentives.ceiling),
        };
    }
    out.product = out.inversion.score * out.incentives.score * out.inflection.score;
    return out;
}
