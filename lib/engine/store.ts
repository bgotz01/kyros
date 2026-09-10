// ─── engine persistence ──────────────────────────────────────────────────────
// Shapes shared between the routes and the page. The stored score is the
// analyst's original and is never mutated; a critic's accepted correction is
// layered over it at read time, so both the prediction and the correction
// survive.

import type { EngineScore } from '@/app/api/engine/analyze/route';
import type { Critique, CriticNote, CriticSection } from '@/app/api/engine/critique/route';
import {
    coherentScore,
    dimensionOf,
    LEVEL_BAND,
    LEVEL_SCORE,
    levelOf,
    reachOf,
    scoreOf,
    type Level,
    type Paradigm,
    type ParadigmTag,
} from '@/lib/engine/paradigm';

/** One law's block, in the shape every law shares. */
interface LawBlock {
    score: number;
    level?: Level;
    band?: [number, number];
    dimensionId?: string | null;
}

/** A critic's proposed score, held to the same coherence rule the analyst's is.
 *
 *  Corrections used to bypass it entirely — `effectiveScore` wrote
 *  `proposedScore` straight onto the block, and for a row scored on the
 *  eleven-rung scale `clampLaw` then returned that block untouched. A critic
 *  proposing 0 against a force the row had named could therefore zero a paper,
 *  and the product with it, on a judgement the analyst would not have been
 *  allowed to make. See `coherentScore`. */
function proposed(note: CriticNote | undefined, block: LawBlock): number {
    if (note?.proposedScore === undefined) return block.score;
    return coherentScore(scoreOf(note.proposedScore), Boolean(block.dimensionId));
}

/** A law's score held inside its band, taking the level from an applied note
 *  where the critic objected to the classification rather than to the number.
 *
 *  A block with NO level is left alone. Those are rows scored under the retired
 *  layer instrument, bounded by ceilings that no longer exist; clamping them to
 *  a band they were never scored against would rewrite a frozen prediction,
 *  which is the one thing this ledger must never do.
 *
 *  The SAME reasoning now covers the band itself, which is why the stored one is
 *  preferred over `LEVEL_BAND`. The rungs were respaced when scope was added —
 *  level 3 opened 5-6 before and opens 4-6 now — so reading a stored row through
 *  today's table would move scores on rows nobody rescored. A row keeps the band
 *  it was written against. Only a critic objecting to the LEVEL reaches for the
 *  current table, because at that point the classification really is being made
 *  again, under the instrument doing the making. */
function clampLaw<T extends LawBlock>(block: T, applied?: CriticNote): T {
    // A row scored on the eleven-rung scale carries no level and no band. Its
    // score is the classification, so an applied objection has already replaced
    // it in `effectiveScore` and there is nothing further to hold it to.
    if (block.level === undefined) return block;

    // Rows scored under either ladder keep the band they were written against —
    // reading a frozen prediction through a later instrument's table would move
    // scores nobody rescored.
    const relevelled = applied?.proposedLevel !== undefined;
    if (relevelled) {
        const level = levelOf(applied!.proposedLevel);
        return { ...block, level, band: LEVEL_BAND[level], score: LEVEL_SCORE[level] };
    }
    const band = block.band ?? LEVEL_BAND[block.level];
    return {
        ...block,
        band,
        score: Math.min(band[1], Math.max(band[0], block.score)),
    };
}

export interface StoredScore extends EngineScore {
    /** Database id — needed to attach a critique or resolve a note. */
    scoreId: string;
    scoredAt: string;
    /** Every critic pass over this row, OLDEST FIRST. Rounds stack: each read
     *  the row as the rounds before it left it, and their accepted corrections
     *  layer in this order. */
    critiques: Critique[];
}

/** Every note across every round, oldest first — the list `effectiveScore`
 *  layers. Ordering is the whole contract: a later round's correction to a
 *  section must win over an earlier one's, and that falls out of applying them
 *  in sequence. */
export function allNotes(score: { critiques?: Critique[] }): CriticNote[] {
    return (score.critiques ?? []).flatMap((c) => c.notes);
}

/** The note a section's flag shows: the NEWEST one, because that is the reading
 *  that currently stands. */
export function noteForSection(
    score: { critiques?: Critique[] },
    section: CriticSection,
): CriticNote | undefined {
    return allNotes(score).filter((n) => n.section === section).at(-1);
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

/** The force a note re-selects, resolved against the snapshot the row was
 *  scored under.
 *
 *  `proposedId` used to be stored and never applied. The prompt calls a wrong
 *  FORCE "the most valuable objection you can make", and accepting one moved the
 *  number and the bullets while leaving the force itself untouched — so the next
 *  critic read the same force and raised the identical objection, round after
 *  round. That is what made stacked critics look like they were re-reading the
 *  analyst's original: they were, on the one field that mattered most.
 *
 *  The snapshot is needed because a force is not just an id — each law reads a
 *  different line off it, and changing `access` to `compute` without changing
 *  the baseline printed beneath it puts a row in contradiction with itself. */
function reselect(
    note: CriticNote | undefined,
    paradigm: Paradigm | undefined,
    law: LawKey,
): { dimensionId: string; line: string } | undefined {
    if (!note?.proposedId || !paradigm) return undefined;
    const d = dimensionOf(paradigm, note.proposedId);
    if (!d) return undefined;
    const line = law === 'inversion' ? d.baseline : law === 'incentives' ? d.incentive : d.inflection;
    return { dimensionId: d.id, line };
}

/** The analyst's row with every applied correction layered on top. The stored
 *  row is untouched; this is what the interface reads.
 *
 *  `paradigm` is the snapshot the row was scored against. Without it a
 *  re-selected force cannot be resolved, so the force is left alone rather than
 *  changed to an id whose words the row cannot show. */
export function effectiveScore(
    score: EngineScore,
    notes: CriticNote[] = [],
    paradigm?: Paradigm,
): EngineScore {
    let out: EngineScore = { ...score };
    // The LAST applied objection to a section, not the first — with rounds
    // stacking, the newest accepted correction is the one that stands.
    const noteFor = (section: LawKey) =>
        notes.filter((n) => n.section === section && !n.agrees && n.resolution === 'applied').at(-1);

    for (const note of notes) {
        if (note.resolution !== 'applied') continue;
        const bullets = note.proposedBullets?.length ? note.proposedBullets : undefined;

        if (note.section === 'summary') {
            if (bullets) out = { ...out, summary: bullets };
            continue;
        }
        if (!isLaw(note.section)) continue;

        if (note.section === 'inversion') {
            const re = reselect(note, paradigm, 'inversion');
            out = {
                ...out,
                inversion: {
                    ...out.inversion,
                    ...(re ? { dimensionId: re.dimensionId, baseline: re.line } : {}),
                    score: proposed(note, re ? { ...out.inversion, dimensionId: re.dimensionId } : out.inversion),
                    inverting: bullets ?? out.inversion.inverting,
                },
                // The row's filing tag is I¹'s force; moving one moves the other.
                ...(re ? { tag: re.dimensionId as ParadigmTag } : {}),
            };
        } else if (note.section === 'incentives') {
            const re = reselect(note, paradigm, 'incentives');
            out = {
                ...out,
                incentives: {
                    ...out.incentives,
                    ...(re ? { dimensionId: re.dimensionId, incentive: re.line } : {}),
                    score: proposed(note, re ? { ...out.incentives, dimensionId: re.dimensionId } : out.incentives),
                    bottleneck: bullets ?? out.incentives.bottleneck,
                },
            };
        } else {
            const re = reselect(note, paradigm, 'inflection');
            out = {
                ...out,
                inflection: {
                    ...out.inflection,
                    ...(re ? { dimensionId: re.dimensionId, criterion: re.line } : {}),
                    score: proposed(note, re ? { ...out.inflection, dimensionId: re.dimensionId } : out.inflection),
                    unprecedented: bullets ?? out.inflection.unprecedented,
                },
            };
        }
    }

    // A correction is held to the same band the analyst was. Which band depends
    // on whether the critic also objected to the level: an accepted objection
    // that says "this is level 4, not 2" moves the band with it, and one that
    // only proposes a number is held to the band already on the row.
    //
    // Without this an applied note could put a 9 on a row classified level 2,
    // which is the exact contradiction the ladder exists to make impossible —
    // and it would be invisible, because the level beside it would still read 2.
    out.inversion = clampLaw(out.inversion, noteFor('inversion'));
    out.incentives = clampLaw(out.incentives, noteFor('incentives'));
    out.inflection = clampLaw(out.inflection, noteFor('inflection'));

    out.product = out.inversion.score * out.incentives.score * out.inflection.score;
    // Recomputed with the product: an applied note that changes a law changes
    // where the row ranks among the zeros as much as among the rest.
    out.reach = reachOf(out.inversion.score, out.incentives.score, out.inflection.score);
    return out;
}
