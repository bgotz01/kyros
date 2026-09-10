// lib/engine/paradigm.ts
// ─── the standing paradigm ───────────────────────────────────────────────────
// A dated historical reference frame, written only from evidence published on
// or before its own date. That is the whole reason a backtest means anything: a
// snapshot assembled with hindsight would guarantee the engine "catches"
// whatever came next.
//
// The snapshot is NOT a description of an industry. It is SIX FORCES the field
// is moving along, each stated three ways — one per law:
//
//     I¹ Inversion   creation ↔ baseline     what is true now?
//     I² Incentives  creation ↔ incentive    what is the field pulling toward?
//     I³ Inflection  creation ↔ inflection   what change would count as one?
//
// Anything that does not move one of the six does not belong in this file. It
// can still be SCORED — it simply does not get to define the reference frame.
//
// Two schemas preceded this. The first modelled a whole field: eight layers,
// their assumptions, distributions, frontier lists, importance weights and a
// separate bottleneck surface. The second cut that to three lists of 5-10 —
// baseline claims, pressures, existing classes — which was a large improvement
// and still left up to thirty objects for a scorer to reach for, of which one
// could nearly always be made to fit.
//
// The third change is the one that matters: the INFLECTION CRITERION is now
// written into the snapshot, before any paper is read. The old I³ asked what
// was unprecedented about a creation, which is a question every paper can
// answer about itself. This one asks whether the creation produced a change we
// named in advance.

/** The six forces, and the ids every law selects from.
 *
 *  There is one list now. The snapshot used to hold three — baseline claims,
 *  pressures, existing classes — and the separation is what let a row take its
 *  I¹ from one force and its I² from an unrelated bucket without anything being
 *  able to see the mismatch. `Mitigating LLM Jailbreaks with Few Examples`
 *  scored 288 and tied for the top of November 2024 that way: baseline
 *  `static-weights`, an agency claim; pressure `reliability`, a catch-all that
 *  answered to no force at all. Pairing the three criteria inside one dimension
 *  makes that row unwriteable. */
export const PARADIGM_TAGS = [
    'compute',
    'architecture',
    'scaling',
    'access',
    'agency',
    'persistence',
] as const;

/** A dimension id. Also the row's filing tag — with six forces the dimension IS
 *  the category, so there is no separate taxonomy to keep in step. */
export type ParadigmTag = (typeof PARADIGM_TAGS)[number];

/** One force, stated three ways — and the three ways are the three laws.
 *
 *  The point of writing all three into the SNAPSHOT is that the inflection
 *  criterion is pre-registered. The old I³ asked the scorer "what is
 *  unprecedented about this paper?", which every paper can answer, because
 *  every paper is a unique combination of its own parts. This asks "did the
 *  creation produce the change we named, before we read it?" The paradigm sets
 *  the target; the paper does not get to define its own.
 *
 *  It also carries the prior-art information the retired `existingClasses` list
 *  used to hold, and carries it better. An inflection criterion is a STATE
 *  TRANSITION — "frontier capability BECOMES available through a materially
 *  different ownership model" — and writing one as pending at the snapshot date
 *  is the snapshot asserting the transition has not happened yet. That is the
 *  same fact the class list encoded by being crowded, dated rather than
 *  recalled, and sealed rather than judged after the fact.
 *
 *  ADMISSION TEST — **is this a force the paradigm is actually moving along?**
 *
 *  Not "is it important", not "is it much discussed". Safety, bias, jailbreaks,
 *  context length, RAG, multimodality, synthetic data and inference kernels are
 *  all absent on purpose. They can be scored as CREATIONS; they do not get to
 *  define the reference frame. */
export interface ParadigmDimension {
    id: ParadigmTag;
    /** Display name, for the rendered snapshot. */
    name: string;
    /** I¹ — what is true now. The claim a creation is measured against. */
    baseline: string;
    /** I² — the concrete outcome the paradigm is pulling toward. A desired
     *  OUTCOME, never a generic problem: "reduce the compute required for
     *  frontier capability", not "compute is expensive". The scorer then asks
     *  one answerable question — how directly does this deliver that? — and a
     *  creation that delivers none of the six has nowhere to file itself. */
    incentive: string;
    /** I³ — the observable change that would constitute an inflection along
     *  this force, written before any paper is read. */
    inflection: string;
    /** Dated refs, every one published on or before `asOf`. The hindsight guard,
     *  and the only thing separating a reconstructed snapshot from a memory. */
    evidence: string[];
}

/** Six. Not a target range — a count.
 *
 *  The previous schema targeted 5-10 entries in each of three lists, so a
 *  scorer had up to thirty objects to reach for and could nearly always find
 *  something that fit. Membership stops being a filter at that size: 7 became
 *  cheap to earn because there was always a minor entry to match against.
 *
 *  Six is a hard claim about what is driving the paradigm, and everything else
 *  has to prove it belongs by moving one of them. */
export const DIMENSION_COUNT = 6;

export interface Paradigm {
    asOf: string;
    /** `reconstructed` was written after the fact from period sources;
     *  `preregistered` was sealed on the date it describes. */
    mode: 'reconstructed' | 'preregistered';
    /** The snapshot in one paragraph. For the reader, never for the scorer —
     *  no law is measured against it. */
    thesis: string;
    dimensions: ParadigmDimension[];
}


// ─── the scale ───────────────────────────────────────────────────────────────
// ELEVEN RUNGS, 0-10, one per value. The score is the judgement; there is no
// separate classification behind it and no band to place a number inside.
//
// Two instruments preceded this and each failed in the same place — the gap
// between a rung and a number:
//
//   · A 0-5 level opened a 0-10 BAND and the model wrote a value inside it.
//     Every one of 108 law-scores came back on a band endpoint, because a
//     2-wide band has no interior. The number carried nothing the level did not.
//   · An EVIDENCE SCOPE rung then placed the score inside a widened band. It
//     worked mechanically and measured the wrong thing: how broadly a result was
//     validated is not how far it moved the paradigm.
//   · Mapping the level straight onto {0,2,4,6,8,10} removed the gap by removing
//     the number — and put THREE OF THE NINE CANON ANCHORS out of reach.
//
// So the gap is closed from the other side. Every value 0-10 carries its own
// line of rubric, and the model picks one. There is no band to snap to because
// there is no band; the eleven rungs are the ladder.
//
// The canon keeps its anchors and all of them are expressible again:
// Transformer I¹ 10, DeepSeek-R1 I¹ 6, FlashAttention I¹ 2, GPT-3 I³ 10,
// ChatGPT I³ 9, AlphaFold 2 I³ 7, Stable Diffusion I³ 7, Chain-of-Thought I³ 4,
// FlashAttention I² 8.
//
// The three tiers do not move, and the top one carries the weight. 9-10 is not
// "very high" — it is reserved for a creation that modifies the standing
// paradigm on that law's own force. That gives the scale a semantic ceiling
// rather than an arithmetic one.
//
//     0-6    progress WITHIN the paradigm
//     7-8    INTERACTION with the paradigm
//     9-10   DEFINITION of the paradigm

/** RETIRED. The 0-5 rung of the two ladder instruments. Rows scored under either
 *  still carry one, and the breakdown still reads it; nothing new writes one. */
export type Level = 0 | 1 | 2 | 3 | 4 | 5;

export const LEVELS: Level[] = [0, 1, 2, 3, 4, 5];

/** RETIRED with the level. Kept so a stored derivation still renders. */
export const LEVEL_BAND: Record<Level, [number, number]> = {
    0: [0, 0],
    1: [1, 2],
    2: [3, 4],
    3: [5, 6],
    4: [7, 8],
    5: [9, 10],
} as const;

/** The score a level mapped to under the deterministic instrument. Retired with
 *  it: mapping six rungs onto {0,2,4,6,8,10} put THREE OF THE NINE CANON ANCHORS
 *  out of reach — AlphaFold 2 and Stable Diffusion at I³ 7, ChatGPT at I³ 9. An
 *  instrument that cannot express its own calibration set is not calibrated to
 *  it, whatever its rubric says. */
export const LEVEL_SCORE: Record<Level, number> = {
    0: 0,
    1: 2,
    2: 4,
    3: 6,
    4: 8,
    5: 10,
} as const;

export type Score = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const SCORES: Score[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export type LawId = 'inversion' | 'incentives' | 'inflection';

/** What a 0-10 law score MEANS, on one scale shared by all three laws.
 *
 *  The scale has three tiers and the boundaries are the whole point:
 *
 *      0-6    progress WITHIN the paradigm
 *      7-8    INTERACTION with the paradigm
 *      9-10   DEFINITION of the paradigm
 *
 *  Almost all work — including work of enormous value — lives at 0-6. Reaching 7
 *  means the creation touched the paradigm itself, and that is only a meaningful
 *  threshold because the snapshot's lists are short: with only the most
 *  consequential assumptions, pressures and classes listed, a scorer cannot earn
 *  a 7 by matching against a minor technical detail. The list limit and this
 *  scale hold each other up. */
/** What a 0-10 score MEANS. One numeric spine, three tiers, and LAW-SPECIFIC
 *  names for the top three.
 *
 *      0-6    progress WITHIN the paradigm
 *      7-8    INTERACTION with the paradigm
 *      9-10   DEFINITION of the paradigm
 *
 *  The names differ because the laws differ. I¹ and I³ measure paradigm
 *  movement directly, so their top band is "paradigm defining". I² measures
 *  INCENTIVE STRENGTH, and a creation can answer the field's most fundamental
 *  pressure without having defined anything — so its top band is "exceptional
 *  incentive". A row reading I¹ 6 · I² 10 · I³ 6 is then saying something
 *  precise and true: an enormous answer to an enormous need, inside the
 *  standing paradigm. Calling that "paradigm-defining on I²" would have been
 *  the instrument agreeing with itself into a claim nobody made.
 *
 *  Note what is deliberately ABSENT: any overall "this creation is
 *  paradigm-defining" verdict. A 9-10 means paradigm-defining ON THAT
 *  DIMENSION, and the product already carries overall magnitude. A second,
 *  hand-tuned threshold across the three would be a new number to calibrate
 *  before the backtest has told us we need one. */
interface BandLabel {
    label: string;
    note: string;
}

export interface ScoreBandRow {
    min: number;
    tier: string;
    inversion: BandLabel;
    incentives: BandLabel;
    inflection: BandLabel;
}

export const SCORE_BANDS: ScoreBandRow[] = [
    {
        min: 9,
        tier: 'defines the paradigm',
        inversion: {
            label: 'Paradigm defining',
            note: 'Overturns or makes obsolete a core element of the paradigm.',
        },
        incentives: {
            label: 'Exceptional incentive',
            note: "Directly and materially delivers this force's incentive.",
        },
        inflection: {
            label: 'Inflection',
            note: "Meets this force's pre-written inflection criterion, or forces a new one.",
        },
    },
    {
        min: 7,
        tier: 'interacts with the paradigm',
        inversion: {
            label: 'Paradigm questioning',
            note: 'Tests, challenges, stretches, or exposes a core element of the paradigm.',
        },
        incentives: {
            label: 'Paradigm-level incentive',
            note: 'Delivers the incentive materially, or first makes it measurable.',
        },
        inflection: {
            label: 'Inflection reachable',
            note: 'Demonstrates the criterion is reachable, without meeting it.',
        },
    },
    {
        min: 5,
        tier: 'within the paradigm',
        inversion: {
            label: 'Workflow improvement',
            note: 'Materially changes how something is done, but remains within the paradigm.',
        },
        incentives: {
            label: 'Workflow incentive',
            note: 'Solves a real bottleneck in how the work gets done.',
        },
        inflection: {
            label: 'Toward the criterion',
            note: 'Substantial progress toward the criterion, still clearly short of it.',
        },
    },
    {
        min: 3,
        tier: 'within the paradigm',
        inversion: {
            label: 'Minor improvement',
            note: 'Incremental improvement within an existing approach.',
        },
        incentives: {
            label: 'Minor incentive',
            note: 'A small saving in effort or cost.',
        },
        inflection: {
            label: 'Minor progress',
            note: 'Incremental progress along this force, well short of the criterion.',
        },
    },
    {
        min: 0,
        tier: 'within the paradigm',
        inversion: { label: 'No relationship', note: 'No meaningful relationship to the paradigm.' },
        incentives: { label: 'No relationship', note: 'No meaningful relationship to any standing pressure.' },
        inflection: { label: 'No relationship', note: 'No meaningful relationship to any existing class.' },
    },
];

function bandRow(score: number): ScoreBandRow {
    return SCORE_BANDS.find((b) => score >= b.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1];
}

/** The band one law's score falls in. Distinct from the PRODUCT bands, which
 *  read the 0-1,000 multiplication — do not confuse the two. */
export function scoreBand(score: number, law: LawId): string {
    return bandRow(score)[law].label;
}

/** The fuller description of what a band asserts, for that law. */
export function scoreBandNote(score: number, law: LawId): string {
    return bandRow(score)[law].note;
}

/** Which of the three tiers a score sits in. Shared by all three laws — the
 *  names differ, the boundaries never do. */
export function scoreTier(score: number): string {
    return bandRow(score).tier;
}

/** The floor of the top band. Level 5 is the only rung whose band reaches it. */
export const PARADIGM_DEFINING_SCORE = 9;

/** The one sentence that does the most work in this instrument.
 *
 *  Every historical inflation in the ledger has the same shape: a creation was
 *  important, impressive, widely cited, commercially successful or technically
 *  hard, and that got read as paradigm relevance. It is not. The 7+ tier is a
 *  claim about the creation's RELATIONSHIP TO THE PARADIGM, and nothing else
 *  qualifies for it. */
export const PARADIGM_TIER_RULE =
    'Do not give 7 or above merely because a creation is important, impressive, '
    + 'highly cited, commercially successful, or technically difficult. Scores of 7+ '
    + 'require a relationship to the paradigm itself.';

/** I¹ — what the creation does to the selected force's BASELINE.
 *
 *  0 and 1 are different answers. 0 means the creation moves none of the six
 *  forces at all — a statement about coverage. 1 means a force WAS named and the
 *  creation simply works inside its baseline, which is the ordinary case and the
 *  commonest correct answer. The same split runs through all three laws. */
export const INVERSION_SCALE: Record<Score, string> = {
    0: 'Moves none of the six forces — NO force named. Not a low score; a coverage finding',
    1: "A force is named: the creation works inside its baseline and does not move it",
    2: 'Does what the baseline already describes, faster or cheaper',
    3: 'A minor variation in how the baseline manifests',
    4: 'A real change to how the work is done, the baseline intact',
    5: 'A substantial process inversion, still inside the baseline',
    6: 'The furthest a creation goes with the baseline plainly still standing',
    7: 'Stretches the baseline — shows strain at its edge',
    8: 'Questions the baseline — shows it may not hold generally',
    9: 'Overturns the baseline in the case demonstrated',
    10: 'Makes the baseline obsolete',
};

/** I² — how materially the creation delivers the selected force's INCENTIVE.
 *
 *  **I² IS THE SANITY CHECK ON I¹.** Anything can be inverted. I¹ asks only
 *  whether the baseline was contradicted; I² asks whether there was an obvious
 *  reason to contradict it, and whether doing so actually delivered.
 *
 *  Running frontier training on TPUs instead of NVIDIA GPUs inverts `compute`'s
 *  baseline outright — that is a real I¹. If it costs more, or trains a worse
 *  model, I² is 1: the force is named, and nothing was delivered toward what
 *  the field is pulling toward. A high I¹ beside a low I² is not a contradiction
 *  to be smoothed away; it is the instrument saying "an inversion nobody needed",
 *  which is a common and important reading.
 *
 *  A change that moves AGAINST the incentive is still a 1, never a 0. 0 is
 *  reserved for a creation that names no force at all — see `coherentScore`.
 *
 *  The incentive must have existed before or at the moment of creation. That a
 *  creation later succeeded is not evidence its incentive was obvious. */
export const INCENTIVE_SCALE: Record<Score, string> = {
    0: 'Delivers none of the six incentives — NO force named. A coverage finding',
    1: 'A force is named and NOTHING is delivered toward its incentive — including a change that moves against it, costing more or performing worse',
    2: 'A marginal gain toward the incentive',
    3: 'A small but real gain toward it',
    4: 'Delivers a bounded part of the incentive',
    5: 'Delivers a substantial part of it',
    6: 'Delivers most of what the incentive asks, in one setting',
    7: 'Delivers the incentive materially, beyond one setting',
    8: 'Attacks the incentive head-on — large, measured, general',
    9: 'Largely resolves the incentive',
    10: 'Resolves the incentive',
};

/** I³ — how far the creation gets toward the selected force's PRE-REGISTERED
 *  INFLECTION CRITERION. Not what is novel about it.
 *
 *  The criterion is written into the snapshot before the paper is read, so the
 *  question is closed: did this produce the change we named, and how much of the
 *  way there did it get? 9-10 asserts the criterion is MET, which is a
 *  once-a-year finding in a weekly digest. */
export const INFLECTION_SCALE: Record<Score, string> = {
    0: "Bears on no force's criterion — NO force named. A coverage finding",
    1: 'A force is named: the creation bears on its criterion and moves nothing toward it',
    2: 'Incremental progress, far short of the criterion',
    3: 'Real progress, clearly short of it',
    4: 'Substantial progress toward the criterion',
    5: 'Strong progress; the criterion stays out of reach',
    6: 'The furthest a creation gets while the criterion plainly stands',
    7: 'Demonstrates the criterion is reachable',
    8: 'Demonstrates it is reachable and largely shows how',
    9: 'Meets the criterion in the case demonstrated',
    10: 'Meets the criterion, or forces a new force into the paradigm',
};

export const LAW_SCALE: Record<LawId, Record<Score, string>> = {
    inversion: INVERSION_SCALE,
    incentives: INCENTIVE_SCALE,
    inflection: INFLECTION_SCALE,
};

/** RETIRED, kept so a row scored under either ladder still shows the wording it
 *  was scored against rather than today's. */
export const LEVEL_RUBRIC: Record<LawId, Record<Level, string>> = {
    inversion: {
        0: 'No relationship to any baseline claim',
        1: 'Related to a baseline claim, but does not invert it',
        2: 'Minor implementation variation that weakly inverts how the claim manifests',
        3: 'Meaningful workflow or process inversion, within the paradigm',
        4: 'Questions or tests a core baseline assumption',
        5: 'Overturns or makes obsolete a core baseline assumption',
    },
    incentives: {
        0: 'No relationship to any standing pressure',
        1: 'Related to a pressure, but does not meaningfully act on it',
        2: 'A small efficiency or convenience gain against it',
        3: 'Solves an important workflow bottleneck',
        4: 'Attacks or exposes a major paradigm-level pressure',
        5: 'Directly resolves one of the paradigm\'s most fundamental pressures',
    },
    inflection: {
        0: 'No relationship to any existing class',
        1: 'Within an existing class, adding nothing meaningfully new',
        2: 'Incremental product or capability improvement within the class',
        3: 'New workflow, or substantial improvement to an existing class',
        4: 'Challenges the boundary of the existing class',
        5: 'The existing class is no longer sufficient to describe what was created',
    },
};


// ─── what a creation does to a force ─────────────────────────────────────────
// RETIRED, and the reason is the framing rather than the mechanics.
//
// `action` was relieves / reveals / measures / bounds / none. It existed because
// I² used to ask "what does this creation do to a broad standing pressure?", and
// under that question a result which relieves nothing but establishes that a
// constraint binds — `Alignment Faking` is the case that argued for it — is
// doing something an instrument blind to it would miss.
//
// I² no longer asks that. It asks how materially the creation delivers a
// PRE-WRITTEN incentive, and a paper revealing a failure mode does not deliver
// "make models able to reliably complete useful work with less human
// intervention". It scores low, and that is now the correct answer rather than a
// blind spot: Kyros detects inflections, not important research, and a major
// empirical safety finding can be historically consequential and still rank at
// zero here.
//
// The vocabulary was also nearly dead on its own terms — across 48 law-scores in
// two runs it read relieves 21, none 18, reveals 5, measures 4, bounds 0.

/** RETIRED. Rows scored under the earlier instruments carry one of relieves,
 *  reveals, measures, bounds or none; nothing reads it to score. */
export type IncentiveAction = 'relieves' | 'reveals' | 'measures' | 'bounds' | 'none';

// ─── how a score was reached ─────────────────────────────────────────────────
// The level IS the score now, so a derivation is short. It is still recorded,
// because a stored row must carry the classification that produced its number
// rather than leaving a reader to infer it — and because two earlier
// instruments wrote richer derivations into the same column, which still render.

export interface LawDerivation {
    /** RETIRED. The 0-5 rung, on rows scored under either ladder. */
    level?: Level;
    /** RETIRED. The band that rung opened. */
    band?: [number, number];
    law: LawId;
    /** The rung on the 0-10 scale, and its line of rubric. The whole
     *  measurement — there is nothing behind it. */
    score?: Score;
    /** RETIRED. Rows written during the scope instrument carry `narrow`,
     *  `moderate` or `broad` here; nothing reads it to score. Kept as a string so
     *  those rows still render with the reasoning they were given. */
    scope?: string;
    /** RETIRED. The model's own 0-10 claim, on the instruments that asked for
     *  one. It is not asked for now: shown a band and asked for a value inside
     *  it, every row ever scored answered with an endpoint. */
    claimed?: number;
    final: number;
    /** Prose naming what set the score. */
    boundBy: string | null;
    /** The dimension the score was assigned against. Null where none matched. */
    against: string | null;
    /** A SECOND dimension the creation also moves on this law, where one
     *  applies. Recorded, and deliberately NOT scored against.
     *
     *  A creation often bears on two forces at once and forcing a single choice
     *  lost that: DeepSeek-V3 inverts the `access` baseline and the `compute`
     *  baseline together, and a row naming only one reads as a partial account
     *  of the paper whichever one it picks. The critic kept objecting to the
     *  choice rather than to the reading, which is the tell that the field was
     *  too narrow rather than the analyst wrong.
     *
     *  It carries NO weight. The score is measured against `against` alone, so
     *  naming a second force cannot raise a row — otherwise "name two" becomes
     *  an inflation lever, which is the same shape as novelty-by-conjunction on
     *  I³ and would be exploited the same way. */
    alsoAgainst?: string | null;
}

/** The score the scorer named, held to 0-10 and recorded with the rubric line it
 *  claims. The single place a law score is decided, so a stored derivation can
 *  never disagree with the number printed beside it.
 *
 *  Nothing is clamped here any more, because there is nothing left to clamp
 *  against: the number IS the classification. A selection that did not resolve
 *  is the one thing that overrides it — a score asserted against a force the
 *  snapshot does not contain is not a reading of this paradigm. */
export function deriveScore(
    law: LawId,
    claimed: number,
    against: string | null,
    alsoAgainst: string | null = null,
): LawDerivation {
    const score = coherentScore(scoreOf(claimed), Boolean(against));
    return {
        law,
        score,
        final: score,
        boundBy: against ? LAW_SCALE[law][score] : 'no force selected',
        against,
        ...(alsoAgainst ? { alsoAgainst } : {}),
    };
}

/** The retired derivation, kept as a type so a row scored under the layer
 *  instrument still renders. It listed every ceiling that applied and named
 *  whichever bound first. */
export interface LegacyDerivation {
    law: LawId;
    claimed: number;
    final: number;
    ceilings: { name: string; value: number; source: string }[];
    boundBy: string | null;
}

export type AnyDerivation = LawDerivation | LegacyDerivation;

/** Both shapes live in the same JSON column; this tells them apart. */
export function isLevelDerivation(d: AnyDerivation): d is LawDerivation {
    return 'level' in d;
}

// ─── reading a value back from the wire ──────────────────────────────────────

export function levelOf(v: unknown): Level {
    const n = Math.round(Number(v));
    return (Number.isFinite(n) && n >= 0 && n <= 5 ? n : 0) as Level;
}

export function scoreOf(v: unknown): Score {
    const n = Math.round(Number(v));
    if (!Number.isFinite(n)) return 0;
    return Math.min(10, Math.max(0, n)) as Score;
}

/** **0 IS A CLAIM ABOUT COVERAGE, NOT ABOUT MAGNITUDE**, and this is the one
 *  place that is enforced rather than asked for.
 *
 *  Rung 0 says the creation moves none of the six forces. Rung 1 says a force
 *  WAS named and the creation simply works inside it without moving it — the
 *  ordinary case, and the commonest correct answer. They are different findings
 *  and they are not adjacent: 0 zeroes the product and takes the other two laws
 *  with it, so reading "does not invert the baseline" as 0 does not lower a row,
 *  it deletes it.
 *
 *  The critic made exactly that error on `Qwen2.5`, arguing I¹ 7 → 0 on the
 *  grounds that the paper "is an incremental release of an existing open-weights
 *  series". That reasoning is correct and it argues for a 2 or a 3: a creation
 *  cannot both sit inside `access` and move none of the six. The critic's
 *  corrections bypassed every check the analyst's own row passes through, which
 *  is how a one-word category error became a 392-point swing.
 *
 *  So: a named force floors at 1, and a null selection is pinned to 0. Nothing
 *  else in the instrument may put those two states on the same number. */
export function coherentScore(score: Score, named: boolean): Score {
    if (!named) return 0;
    return Math.max(1, score) as Score;
}

/** RETIRED with `action`. Kept so a stored row's value still normalises when it
 *  is read back for display. */
export function actionOf(v: unknown): IncentiveAction {
    const raw = String(v ?? '').toLowerCase().trim();
    const known: IncentiveAction[] = ['relieves', 'reveals', 'measures', 'bounds', 'none'];
    return known.find((a) => a === raw) ?? 'none';
}

/** The month whose paradigm a paper is judged against, as `YYYY-MM`.
 *
 *  The arXiv id carries YYMM and the month matters: returning a bare year meant
 *  January, so every 2024 paper resolved to the newest snapshot at or before
 *  2024-01. Both seats call this, so a disagreement here would have them reading
 *  different snapshots. */
export function paperPeriod(id: string, published?: string): string {
    const fromId = /^(\d{2})(\d{2})\./.exec(id);
    if (fromId) return `20${fromId[1]}-${fromId[2]}`;
    if (published && /^\d{4}-\d{2}/.test(published)) return published.slice(0, 7);
    return published?.slice(0, 4) ?? String(new Date().getFullYear());
}

// ─── ranking a ledger that contains zeros ────────────────────────────────────

/** The sum of the three laws. Ranks rows the PRODUCT cannot separate.
 *
 *  Six forces are a narrow claim, so a law selecting null is now ordinary
 *  rather than exceptional — and a null zeroes the product, taking the other
 *  two laws with it. In the first November run under this snapshot twelve of
 *  twenty-five rows landed on exactly 0, and among them the product could no
 *  longer tell a paper that moves two forces from one that moves none.
 *
 *  That is a loss of real information, not severity. `FinRobot` moving the
 *  agency incentive and falling short of every inflection criterion is a
 *  different row from a survey that touches nothing, and both read 0.
 *
 *  So `product` keeps its meaning untouched — it is the magnitude claim, and a
 *  zero in it still says a law found no relationship — and `reach` orders rows
 *  inside a shared product. Never the other way round: a high reach with a zero
 *  product is not a good paper, it is a paper that failed one law completely. */
export function reachOf(inversion: number, incentives: number, inflection: number): number {
    return inversion + incentives + inflection;
}

/** Product first, then reach. The comparator every ranked view sorts by. */
export function byRank(
    a: { product: number; reach: number },
    b: { product: number; reach: number },
): number {
    return b.product - a.product || b.reach - a.reach;
}

// ─── selecting the force ─────────────────────────────────────────────────────
// The scorer names an id printed in the rendered snapshot; this resolves it.
//
// There is ONE resolver now, where there were three. Every law selects from the
// same six dimensions — I¹ against a dimension's baseline, I² against its
// incentive, I³ against its inflection criterion — so a selection is a claim
// about WHICH FORCE the creation moves, and the law decides what moving it
// means.
//
// The laws may still name DIFFERENT dimensions, and must be allowed to: a
// result can invert the scaling assumption while delivering the compute
// incentive, and eleven of forty-three rows in the 2024 ledger did something of
// that shape. The pairing disciplines how the snapshot is AUTHORED, not how a
// row selects.

export function dimensionOf(p: Paradigm, id: string): ParadigmDimension | undefined {
    return p.dimensions.find((d) => d.id === id);
}

/** The snapshot as the scorer reads it.
 *
 *  Ids are printed because they are what the three laws select, and all three
 *  criteria are printed against each id, because a scorer choosing a force
 *  needs to see what that force claims on the law it is about to score.
 *
 *  Evidence is NOT printed: it is an authoring artefact — the guard that kept a
 *  claim honest when the snapshot was written — and it belongs to the reader in
 *  the paradigm modal, not to the scoring context. */
export function renderParadigm(p: Paradigm): string {
    const out: string[] = [
        '─── THE STANDING PARADIGM ──────────────────────────────────────────────────',
        `As of ${p.asOf} · ${p.mode}`,
        '',
        `THESIS: ${p.thesis}`,
        '',
        `${p.dimensions.length} forces. Every law selects one of these ids — I¹ against the`,
        'BASELINE, I² against the INCENTIVE, I³ against the INFLECTION criterion. The three',
        'laws need not select the same force. Never name a value you remember instead of',
        'one printed here.',
        '',
        'The INFLECTION line was written before this paper existed. It is the change that',
        'would count as an inflection along this force — not a description of the paper,',
        'and not something the paper may redefine.',
        '',
    ];

    for (const d of p.dimensions) {
        out.push(`── [${d.id}] ${d.name.toUpperCase()}`);
        out.push(`   BASELINE    ${d.baseline}`);
        out.push(`   INCENTIVE   ${d.incentive}`);
        out.push(`   INFLECTION  ${d.inflection}`);
        out.push('');
    }
    if (!p.dimensions.length) {
        out.push('   (empty — nothing can be scored against this snapshot)', '');
    }

    out.push('─── END OF STANDING PARADIGM ───────────────────────────────────────────────');
    return out.join('\n');
}
