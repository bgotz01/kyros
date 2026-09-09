// lib/paradigm.ts
// ─── the frontier AI paradigm ────────────────────────────────────────────────
// A dated description of what the field held to be true, in eight layers.
//
// §2 of the standing frame is the same idea as a rolling document — and a
// rolling document destroys its own history on every review, so nothing can be
// scored against it retrospectively. These snapshots are the time series that
// replaces it.
//
// A snapshot is written only from evidence published on or before its own date.
// That is the whole reason a backtest means anything: a frontier list assembled
// with hindsight would guarantee the engine "catches" whatever came next.

export const PARADIGM_LAYERS = [
    { id: 'compute', question: 'What does AI run on?' },
    { id: 'architecture', question: 'What is the structure of the model?' },
    { id: 'training', question: 'How does it learn?' },
    { id: 'data', question: 'What does it learn from?' },
    { id: 'scaling', question: 'What produces greater capability?' },
    { id: 'context', question: 'What information is available beyond the weights?' },
    { id: 'interface', question: 'How do humans interact with it?' },
    { id: 'economics', question: 'What is the cost structure of intelligence?' },
] as const;

export type ParadigmLayerId = (typeof PARADIGM_LAYERS)[number]['id'];

export interface Distribution {
    /** What was counted, precisely enough that the shares could be recomputed
     *  from it.
     *
     *  Include a distribution ONLY where the denominator itself means something.
     *  The test is whether the number survives a different reasonable sample:
     *  "every frontier model is a Transformer" holds however you pick the
     *  models, so it is a statement about the paradigm; "71% NVIDIA" is five of
     *  the seven models someone happened to list, and says nothing about the
     *  field. A market share derived from an arbitrary sample of notable models
     *  is false precision with arithmetic consequences, and is worse than no
     *  number at all. */
    basis: string;
    entries: { value: string; share: number }[];
}

export interface ParadigmLayer {
    layer: ParadigmLayerId;
    /** What is normal. */
    paradigm: string;
    /** The load-bearing belief, written so that it could be negated. */
    assumption: string;
    /** How dominant normal is. Omitted where no share is defensibly sourceable
     *  — an absent distribution is honest; an invented one is not. */
    distribution?: Distribution;
    /** Credible approaches that could extend, alter or challenge the paradigm —
     *  and which are NOT yet established at the snapshot date.
     *
     *  Novelty is not the test; adoption is. Something already shipping in
     *  production belongs to `paradigm`, not here, however recently it arrived:
     *  100k context in December 2023 was the incumbent, not a bet on the future.
     *  A candidate proposing it must read as `dominant`, and it will read as
     *  `frontier` if this list is polluted with things that already happened.
     *
     *  An empty array is a claim: no credible alternative was being worked on. */
    frontier: string[];
    /** How consequential it would be if the assumption failed. Caps I¹. */
    importance: number;
    /** Dated refs, every one published on or before `asOf`. The hindsight guard,
     *  and the reason a `frontier` entry can be trusted. */
    evidence: string[];
}

export interface ParadigmBottleneck {
    /** Stable vocabulary used by the scorer. Free-text names cannot be matched
     *  back to a snapshot, and an unmatched bottleneck cannot justify I². */
    id: string;
    name: string;
    status: 'binding' | 'emerging' | 'partially-relieved';
    /** How much this constraint limited progress at the snapshot date. Like a
     *  layer's importance for I¹, this is decided in the snapshot and caps I². */
    importance: number;
    /** What is obviously wrong with the paradigm at this date, stated tightly
     *  enough to decide whether a paper acts on it rather than merely sharing
     *  its subject matter — and no further.
     *
     *  It deliberately does not say what relief would look like. Naming the
     *  routes out ("non-NVIDIA capacity", "quantisation") hands the scorer the
     *  answer it is supposed to work out, and in a reconstructed snapshot those
     *  routes are simply what we now know happened. Materiality is judged by the
     *  typed `impact` category instead. */
    problem: string;
    /** Dated refs, all available on or before the snapshot. */
    evidence: string[];
}

export interface Paradigm {
    asOf: string;
    /** `reconstructed` was written after the fact from period sources;
     *  `preregistered` was sealed on the date it describes. */
    mode: 'reconstructed' | 'preregistered';
    thesis: string;
    /** The constraint surface standing on this date. I² is measured against
     *  this list, never against the rolling bottleneck notes. */
    bottlenecks: ParadigmBottleneck[];
    layers: ParadigmLayer[];
}

// ─── how a candidate meets the paradigm ──────────────────────────────────────

/** Not every paper attacking a layer inverts it. FlashAttention and the
 *  Transformer both land on architecture; only one of them changes what is
 *  held necessary. */
export type ParadigmRelation = 'reinforces' | 'extends' | 'optimizes' | 'challenges' | 'inverts';

export type BottleneckFit = 'none' | 'adjacent' | 'direct';
export type BottleneckImpact = 'negligible' | 'incremental' | 'material' | 'structural';

/** What the paper does to the constraint. Relief was the only thing this
 *  instrument could see, and that was a hole: a constraint can be moved without
 *  being reduced. A result that establishes a constraint binds where the field
 *  assumed it did not, or that first makes one reproducibly measurable, changes
 *  what everyone must now work on — and used to score as though it had done
 *  nothing, because it shipped no improvement.
 *
 *  `Alignment Faking` (December 2024) is the case: it relieved nothing, scored
 *  I² 3, and became one of the most consequential empirical results of the
 *  following year. Two more rows in the same month were caught by the critic
 *  for the same reason. */
export type BottleneckAction = 'relieves' | 'reveals' | 'measures' | 'bounds' | 'none';

/** Topic relevance is not relief. A paper can discuss reliability while moving
 *  no deployment constraint; that is `adjacent`, not a high I². */
export const BOTTLENECK_FIT_CEILING: Record<BottleneckFit, number> = {
    none: 2,
    adjacent: 3,
    direct: 10,
};

/** How far the constraint moved, by whichever action. Independent of fit: a
 *  direct 2% efficiency gain still leaves the bottleneck where it was and
 *  therefore remains an incremental result. */
export const BOTTLENECK_IMPACT_CEILING: Record<BottleneckImpact, number> = {
    negligible: 2,
    incremental: 4,
    material: 7,
    structural: 10,
};

/** Relief can reach the top of the scale because a constraint that stops
 *  binding is the strongest thing a paper can do to it. The others are capped
 *  below it deliberately: knowing a wall is there, or being able to measure how
 *  far away it is, is worth less than removing it — but it is not worth nothing,
 *  which is what the instrument used to say. */
export const BOTTLENECK_ACTION_CEILING: Record<BottleneckAction, number> = {
    relieves: 10,
    reveals: 7,
    measures: 6,
    bounds: 6,
    none: 2,
};

export const BOTTLENECK_ACTION_NOTE: Record<BottleneckAction, string> = {
    relieves: 'reduces the constraint',
    reveals: 'shows the constraint binds where it was assumed not to',
    measures: 'makes the constraint reproducibly measurable',
    bounds: 'shows how far the current approach can move it',
    none: 'does not act on the constraint',
};

/** The band each relation may score on I¹, before the `importance` cap — so a
 *  row cannot report `optimizes` and then score 8. */
export const RELATION_BAND: Record<ParadigmRelation, [number, number]> = {
    reinforces: [0, 1],
    extends: [1, 3],
    optimizes: [1, 3],
    challenges: [4, 6],
    inverts: [7, 10],
};

export type DistributionPosition = 'dominant' | 'minor' | 'frontier' | 'unknown' | 'absent';

/** How crowded the ground already was — the DIRECTION the candidate took.
 *  Read off the snapshot, not judged. */
/** How far past the prior best the result actually lands — the ACHIEVEMENT.
 *
 *  Direction and achievement are different questions, and I³ needs both. If
 *  everyone is trying to build a fusion reactor and someone builds one, the
 *  achievement is extraordinary however unsurprising the goal; scoring it low
 *  because the direction was crowded would make I³ measure unusual intentions
 *  rather than unusual results. The frame is explicit that a 10 requires *both*
 *  no prior demonstration *and* a method that is not a variant of the standard
 *  approach, and that a 1 is an increment "distinguishable from its neighbours
 *  only by its numbers". */
export type Displacement = 'none' | 'incremental' | 'substantial' | 'unprecedented';

/** I³'s ceiling from the two axes together, rather than the lower of two
 *  independent caps. A crowded direction no longer vetoes a large result: the
 *  `frontier` row rises from 1 to 9 as the achievement grows. */
/** `unknown` sits between frontier and minor deliberately. It is what a failed
 *  match resolves to, and a failed match is an absence of evidence about the
 *  direction — not evidence that the direction was empty. Routing it to
 *  `absent` handed the most permissive row in this table to every paper whose
 *  free-text `paradigmProposes` did not happen to contain a snapshot phrase,
 *  which was 106 of 107 rows across 2024. */
export const INFLECTION_CEILING: Record<DistributionPosition, Record<Displacement, number>> = {
    dominant: { none: 1, incremental: 2, substantial: 3, unprecedented: 4 },
    frontier: { none: 1, incremental: 3, substantial: 6, unprecedented: 8 },
    unknown:  { none: 1, incremental: 3, substantial: 6, unprecedented: 8 },
    minor:    { none: 1, incremental: 4, substantial: 7, unprecedented: 9 },
    absent:   { none: 2, incremental: 5, substantial: 8, unprecedented: 10 },
};

export type Precedent = 'established' | 'demonstrated' | 'claimed' | 'none';

/** Precedent is read off the paper's own related work, so it is checkable in a
 *  way that displacement is not. It therefore bounds displacement rather than
 *  capping the score directly: you cannot claim an unprecedented result for
 *  something the paper itself cites as standard practice. */
export const PRECEDENT_LIMIT: Record<Precedent, Displacement> = {
    established: 'incremental',
    demonstrated: 'substantial',
    claimed: 'unprecedented',
    none: 'unprecedented',
};

const DISPLACEMENT_ORDER: Displacement[] = ['none', 'incremental', 'substantial', 'unprecedented'];

/** The claimed displacement, held to what the precedent allows. */
export function boundedDisplacement(claimed: Displacement, precedent: Precedent): Displacement {
    const cap = PRECEDENT_LIMIT[precedent];
    return DISPLACEMENT_ORDER.indexOf(claimed) <= DISPLACEMENT_ORDER.indexOf(cap) ? claimed : cap;
}

export const PRECEDENT_NOTE: Record<Precedent, string> = {
    established: 'standard practice, cited as such',
    demonstrated: 'shown before, at smaller scale or in a narrower domain',
    claimed: 'asserted somewhere, but not evidenced',
    none: 'no prior demonstration in the paper\'s own related work',
};

export interface ParadigmDelta {
    layer: ParadigmLayerId;
    relation: ParadigmRelation;
    /** What the candidate offers instead, in the layer's own vocabulary — "TPU",
     *  "state-space model". Resolved against the snapshot rather than asserted. */
    proposes: string;
    paradigmAsOf: string;
}

/** Where a proposal already sat, read off the layer rather than judged. The
 *  interesting case is `minor` and not on the frontier: something that exists
 *  and that nobody believes is where the field is going. */
export function positionOf(layer: ParadigmLayer, proposes: string) {
    const norm = (s: string) => s.trim().toLowerCase();
    const target = norm(proposes);

    // Exact, then whole-word containment either way. Bare substrings would let
    // "RL" match "RLHF" and "agent" match "agentic wrappers" — different claims
    // — while a length threshold would leave "GPU" unable to find "NVIDIA GPU".
    // Word boundaries get both right.
    const whole = (needle: string, haystack: string) => {
        const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(^|\\W)${escaped}(\\W|$)`).test(haystack);
    };
    const matches = (candidate: string) => {
        const c = norm(candidate);
        return c === target || whole(target, c) || whole(c, target);
    };

    const entries = layer.distribution?.entries ?? [];
    const top = [...entries].sort((a, b) => b.share - a.share)[0];

    const frontierHit = layer.frontier.find(matches);
    const hit = entries.find((e) => norm(e.value) === target) ?? entries.find((e) => matches(e.value));

    // Most layers carry no distribution, because a share read off a handful of
    // hand-picked models says nothing. The incumbent is still named — it is the
    // layer's `paradigm` — so a candidate proposing the status quo is caught
    // there rather than falling through to `absent` and a ceiling of 10.
    const isIncumbent = matches(layer.paradigm);

    // `absent` is a claim about the snapshot: the direction was listed nowhere
    // and nothing credible was being worked on. `unknown` is a claim about the
    // match: a free-text noun phrase failed to find a hand-written entry, which
    // says nothing about the direction at all. Collapsing the second into the
    // first handed the most permissive I³ ceiling to every paper the matcher
    // could not place — which is nearly all of them.
    const searchable = entries.length > 0 || layer.frontier.length > 0;
    const position: DistributionPosition =
        (hit && top && hit.share === top.share) || (!hit && isIncumbent) ? 'dominant'
        : hit ? 'minor'
        : frontierHit ? 'frontier'
        : searchable ? 'unknown'
        : 'absent';

    // What it actually matched against, so a wrong position is visible rather
    // than silently feeding a score. This is a heuristic, not ground truth.
    return {
        position,
        onFrontier: Boolean(frontierHit),
        dominantShare: top?.share ?? null,
        matchedValue: hit?.value ?? frontierHit ?? (isIncumbent ? layer.paradigm : null),
    };
}

// ─── loading and rendering ───────────────────────────────────────────────────

import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'context', 'ai', 'paradigm');

/** Snapshots in the corpus, newest first, keyed `YYYY-MM`. Snapshots are dated
 *  rather than annual: the field does not turn over on a January, and 2023 held
 *  at least three distinct paradigms. */
export function paradigmDates(): string[] {
    try {
        return fs
            .readdirSync(DIR)
            .filter((f) => /^\d{4}-\d{2}\.json$/.test(f))
            .map((f) => f.replace(/\.json$/, ''))
            .sort()
            .reverse();
    } catch {
        return [];
    }
}

/** The newest snapshot standing STRICTLY BEFORE `when` (a year, or `YYYY-MM`).
 *
 *  Strictly, not at-or-before: a snapshot dated the end of a month was written
 *  knowing what appeared during it, and cites those papers as its own evidence.
 *  The 2024-12 snapshot names DeepSeek-V3 three times; scoring DeepSeek-V3
 *  against it asks whether the paper is an outlier relative to a paradigm that
 *  already contains it, and the answer can only be no.
 *
 *  So a December 2024 paper is judged against December 2023, and a January 2025
 *  paper against December 2024. A bare year means January of that year. */
export function loadParadigm(when: string | number): Paradigm | null {
    const want = /^\d{4}$/.test(String(when)) ? `${when}-01` : String(when);
    const pick = paradigmDates().find((d) => d < want);
    if (!pick) return null;
    try {
        return JSON.parse(fs.readFileSync(path.join(DIR, `${pick}.json`), 'utf-8')) as Paradigm;
    } catch {
        return null;
    }
}

/** The month whose paradigm a paper is judged against, as `YYYY-MM`.
 *
 *  The arXiv id carries YYMM and the month matters: returning a bare year meant
 *  January, so every 2024 paper resolved to the newest snapshot at or before
 *  2024-01 — which was the 2021 one, three years stale. Both seats call this, so
 *  a disagreement here would have them reading different snapshots. */
export function paperPeriod(id: string, published?: string): string {
    const fromId = /^(\d{2})(\d{2})\./.exec(id);
    if (fromId) return `20${fromId[1]}-${fromId[2]}`;
    if (published && /^\d{4}-\d{2}/.test(published)) return published.slice(0, 7);
    return published?.slice(0, 4) ?? String(new Date().getFullYear());
}

/** Every snapshot, newest first. For the reader, not the scorer. */
export function allParadigms(): Paradigm[] {
    return paradigmDates()
        .map((d) => {
            try {
                return JSON.parse(fs.readFileSync(path.join(DIR, `${d}.json`), 'utf-8')) as Paradigm;
            } catch {
                return null;
            }
        })
        .filter((p): p is Paradigm => p !== null);
}

export function layerOf(paradigm: Paradigm, id: string): ParadigmLayer | undefined {
    return paradigm.layers.find((l) => l.layer === id);
}

export function bottleneckOf(paradigm: Paradigm, id: string): ParadigmBottleneck | undefined {
    return paradigm.bottlenecks?.find((b) => b.id === id);
}

/** The snapshot as the analyst reads it. Importance is shown because the model
 *  must know the ceiling it is scoring under, not because it may change it. */
export function renderParadigm(p: Paradigm): string {
    const out: string[] = [
        '─── THE STANDING PARADIGM ──────────────────────────────────────────────────',
        `As of ${p.asOf} · ${p.mode}`,
        '',
        `THESIS: ${p.thesis}`,
        '',
    ];

    out.push('── DATED BOTTLENECKS · I² MUST NAME ONE');
    if (!p.bottlenecks?.length) {
        out.push('   No bottlenecks recorded in this snapshot. I² may not exceed 2.', '');
    } else {
        for (const b of p.bottlenecks) {
            out.push(`─ ${b.id} · ${b.status} · importance ${b.importance}/10`);
            out.push(`   ${b.name}: ${b.problem}`);
            out.push('');
        }
    }

    for (const l of p.layers) {
        out.push(`── ${l.layer.toUpperCase()} · importance ${l.importance}/10`);
        out.push(`   Paradigm:   ${l.paradigm}`);
        out.push(`   Assumption: ${l.assumption}`);
        if (l.distribution) {
            const shares = l.distribution.entries
                .map((e) => `${e.value} ${Math.round(e.share * 100)}%`)
                .join(' · ');
            out.push(`   Distribution (${l.distribution.basis}): ${shares}`);
        } else {
            out.push('   Distribution: no defensible share at this date');
        }
        out.push(`   Frontier:   ${l.frontier.length ? l.frontier.join('; ') : 'nothing credible being pursued'}`);
        out.push('');
    }

    out.push('─── END OF STANDING PARADIGM ───────────────────────────────────────────────');
    return out.join('\n');
}

// ─── how a score was reached ─────────────────────────────────────────────────
// Every law's score is a claim from the model passed through named ceilings.
// Only the final number survives into the row, which makes the instrument hard
// to tune: you cannot tell a 5 the model argued for from an 8 that a ceiling
// cut to 5. This records the whole derivation so the reasoning can be inspected
// and adjusted rather than guessed at.

export interface Ceiling {
    /** The rule, in the instrument's own vocabulary. */
    name: string;
    value: number;
    /** Where the number came from — the layer, the bottleneck, the category. */
    source: string;
}

export interface LawDerivation {
    law: 'inversion' | 'incentives' | 'inflection';
    /** What the model asked for, before any ceiling. */
    claimed: number;
    final: number;
    ceilings: Ceiling[];
    /** The ceiling that actually bound, or null where the claim stood on its own. */
    boundBy: string | null;
}

/** Applies the ceilings and records which one bound. The single place a law
 *  score is decided, so the stored derivation can never disagree with the
 *  number beside it. */
export function deriveScore(
    law: LawDerivation['law'],
    claimed: number,
    ceilings: Ceiling[],
): LawDerivation {
    const binding = ceilings.filter((c) => c.value < claimed).sort((a, b) => a.value - b.value)[0];
    const final = binding ? binding.value : claimed;
    return { law, claimed, final, ceilings, boundBy: binding?.name ?? null };
}
