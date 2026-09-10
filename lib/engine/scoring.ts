// ─── the scoring core ────────────────────────────────────────────────────────
// The pure half of the analyst seat: everything between a model's JSON and a
// finished row. It lives here rather than in the route so the backtest harness
// scores through exactly the same code the engine does — a harness with its own
// copy of the ladder would measure the harness.
//
// Nothing in this file performs I/O. The route calls the model and writes the
// database; this decides what the row says.

import {
    dimensionOf,
    deriveScore,
    reachOf,
    scoreOf,
    type AnyDerivation,
    type LawDerivation,
    type Level,
    type Paradigm,
    type ParadigmTag,
} from '@/lib/engine/paradigm';
import { CATEGORIES, OUTCOME_KINDS } from '@/lib/engine/prompts';

export interface EngineScore {
    id: string;
    title: string;
    summary: string[];
    category: string;
    /** Where in the stack the work sits — Representation, Training, Inference.
     *  Named `stratum` rather than `level` so it can never be confused with the
     *  0-5 classification a law carries. Stored in the `level` column. */
    stratum: string;
    previousParadigm: string;
    corePremise: string;
    inversion: {
        score: number;
        /** RETIRED. The 0-5 rung, on rows scored under either ladder. Absent on
         *  rows scored on the eleven-rung scale, where the score is the whole
         *  classification — and absent on the oldest rows, which predate rungs. */
        level?: Level;
        band?: [number, number];
        headline: string;
        /** The force this creation moves, resolved against the snapshot. Null
         *  where the row named none, or named one the snapshot does not hold. */
        dimensionId: string | null;
        /** A second force it also moves. Recorded, never scored against. */
        secondaryId?: string;
        /** What the model actually asked for, when that did not resolve.
         *
         *  A selection that misses must be VISIBLE. The retired matcher failed
         *  on 106 of 107 rows across 2024 and nobody could see it, because a
         *  miss and an honest null looked identical from the outside. They are
         *  different findings: one is a broken id, the other is a claim. */
        unresolvedId?: string;
        /** That force's baseline, copied from the snapshot rather than the model. */
        baseline: string;
        inverting: string[];
        previous: string[];
        proposed: string[];
    };
    incentives: {
        score: number;
        level?: Level;
        band?: [number, number];
        headline: string;
        /** The force this law was scored against. Same id space as the other two
         *  laws — the LAW is what says whether to read that dimension's baseline,
         *  its incentive, or its inflection criterion. */
        dimensionId: string | null;
        secondaryId?: string;
        unresolvedId?: string;
        incentive: string;
        outcomeKind: string;
        outcomeEstimate: string;
        bottleneck: string[];
    };
    inflection: {
        score: number;
        level?: Level;
        band?: [number, number];
        headline: string;
        dimensionId: string | null;
        secondaryId?: string;
        unresolvedId?: string;
        criterion: string;
        unprecedented: string[];
    };
    /** Filing only, the dimension I¹ selected. Never read by a score. */
    tag?: ParadigmTag;
    /** The sealed snapshot every id above was selected from. */
    paradigmAsOf: string;
    /** How each law's score was reached: the level, and the score it maps to. */
    derivation?: AnyDerivation[];
    product: number;
    /** Ranks rows the product cannot separate — see `reachOf`. Derived, never
     *  stored: it is the sum of three columns the database already holds. */
    reach: number;
    /** Every law selected null: the creation moves none of the six forces. A
     *  finding about the SNAPSHOT as much as the paper — if it fires often, the
     *  six are describing the wrong field. */
    outsideFrame: boolean;
    verdict: string;
    confidence: string;
    model: string;
    cost: number;
    promptTokens: number;
    completionTokens: number;
    truncated: boolean;
}

/** Models wrap JSON in prose or fences unevenly; take the outermost object. */
export function extractJson(raw: string): Record<string, unknown> | null {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const body = fenced ? fenced[1] : raw;
    const start = body.indexOf('{');
    const end = body.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    try {
        return JSON.parse(body.slice(start, end + 1));
    } catch {
        return null;
    }
}

/** Held to the closed vocabulary — a free-text category cannot be sorted on. */
function category(v: unknown): string {
    const raw = String(v ?? '').trim().toLowerCase();
    return CATEGORIES.find((c) => c.toLowerCase() === raw) ?? 'Unclassified';
}

function outcome(v: unknown): string {
    const raw = String(v ?? '').trim().toLowerCase();
    return OUTCOME_KINDS.find((k) => k.toLowerCase() === raw) ?? 'None';
}

/** The two lists are read side by side, so they are truncated to equal length. */
function pair(a: unknown, b: unknown): { previous: string[]; proposed: string[] } {
    const previous = Array.isArray(a) ? a.map(String).map((x) => x.trim()).filter(Boolean) : [];
    const proposed = Array.isArray(b) ? b.map(String).map((x) => x.trim()).filter(Boolean) : [];
    const n = Math.min(previous.length, proposed.length, 2);
    return { previous: previous.slice(0, n), proposed: proposed.slice(0, n) };
}

function str(v: unknown, fallback = '—'): string {
    return typeof v === 'string' && v.trim() ? v.trim() : fallback;
}

/** An id the model returned, normalised. `null`, `"null"` and `"none"` all mean
 *  the same thing and all three come back from real models. */
function idOf(v: unknown): string {
    const raw = String(v ?? '').trim();
    return raw && !/^(null|none|n\/a|-)$/i.test(raw) ? raw : '';
}

/** Models drift between an array and a single blob however firmly the shape is
 *  specified, so a string is split on its own bullet markers rather than
 *  rendered as one long line. */
function bullets(v: unknown, fallback = '—'): string[] {
    if (Array.isArray(v)) {
        const rows = v.map((x) => String(x).replace(/^\s*[-•●*]\s*/, '').trim()).filter(Boolean);
        if (rows.length) return rows;
    }
    if (typeof v === 'string' && v.trim()) {
        const rows = v
            .split(/\n+|(?:^|\s)[-•●]\s+/)
            .map((x) => x.trim())
            .filter(Boolean);
        if (rows.length) return rows;
    }
    return [fallback];
}

/** The card is an instrument row, not an essay. The prompt requests two; this
 *  cap keeps a verbose model from rebuilding the old wall of prose. */
function conciseBullets(v: unknown, fallback = '—'): string[] {
    return bullets(v, fallback).slice(0, 2);
}


/** A model's JSON, resolved against the sealed snapshot and held inside the
 *  bands its own classifications opened.
 *
 *  The three steps are run in the order the prompt demands, because the order is
 *  the discipline: SELECT the historical object, CLASSIFY the relationship,
 *  SCORE inside the band. A level asserted against an object that does not
 *  resolve is not a classification, and is treated as one. */
export function buildScore(
    parsed: Record<string, unknown>,
    paradigm: Paradigm,
    meta: {
        id: string;
        title: string;
        model: string;
        cost: number;
        promptTokens: number;
        completionTokens: number;
        truncated: boolean;
    },
): EngineScore {
    const inv = (parsed.inversion ?? {}) as Record<string, unknown>;
    const inc = (parsed.incentives ?? {}) as Record<string, unknown>;
    const inf = (parsed.inflection ?? {}) as Record<string, unknown>;

    // ── SELECT ───────────────────────────────────────────────────────────────
    // An id either resolves against the sealed snapshot or it does not. This
    // replaces `positionOf`, which matched a model's free-text noun phrase
    // against hand-written lists and failed on 106 of 107 rows across 2024
    // without anyone being able to see that it had.
    // One id space, three selections. The prompt asks each law for `dimensionId`
    // and tolerates the retired per-law names on rows from older prompts.
    const wantBaseline = idOf(inv.dimensionId ?? inv.baselineId);
    const wantPressure = idOf(inc.dimensionId ?? inc.pressureId);
    const wantPrecedent = idOf(inf.dimensionId ?? inf.precedentId);

    // The SECOND force a law may name. Never scored against — see `alsoAgainst`
    // — and dropped where it repeats the primary, which is the commonest way a
    // model fills the field without having a second force in mind.
    const second = (want: string, primary: string) => {
        const id = idOf(want);
        return id && id !== primary ? dimensionOf(paradigm, id) : undefined;
    };
    const alsoBaseline = second(String(inv.alsoBears ?? ''), wantBaseline);
    const alsoPressure = second(String(inc.alsoBears ?? ''), wantPressure);
    const alsoPrecedent = second(String(inf.alsoBears ?? ''), wantPrecedent);

    // All three resolve against the SAME six dimensions. The laws may name
    // different ones — a creation can invert the scaling baseline while
    // delivering the compute incentive — so these stay three separate
    // selections rather than one.
    const claim = dimensionOf(paradigm, wantBaseline);
    const pressure = dimensionOf(paradigm, wantPressure);
    const precedent = dimensionOf(paradigm, wantPrecedent);

    // An id that was asked for and did not resolve is kept, so the difference
    // between a broken selection and a deliberate null is never lost.
    const missed = (want: string, hit: boolean) => (want && !hit ? { unresolvedId: want } : {});

    // ── CLASSIFY ─────────────────────────────────────────────────────────────
    // An unmatched baseline claim is level 0: nothing standing was contradicted.
    const invScore = claim ? scoreOf(inv.score) : 0;

    // A null precedent CANNOT support a high level, and getting this backwards
    // was the single worst defect the first backtest found.
    //
    // The escape hatch used to run the other way: a null was trusted at level 4
    // and 5 on the theory that the row must have argued the case to get there.
    // It had not. `The AI Scientist` returned `precedentId: null` at level 5 and
    // scored 720 — while its own bullet read "the closest being isolated
    // research assistants like AutoGPT", which is an example printed under
    // `autonomous-agents`. It named the precedent in prose and nulled the id so
    // it would not have to argue past it, and the instrument rewarded exactly
    // that. Two more rows nulled a precedent they had just named.
    //
    // The notes were right the first time: a high I³ REQUIRES naming the closest
    // precedent and explaining why it is insufficient. So "nothing like this
    // existed" is expressed as a named precedent at level 5, never as a null.
    // A null now means one thing only — the creation's subject is outside this
    // snapshot's prior art — and that is a statement about coverage, scoring 0.
    // I³ is now measured against a criterion written into the snapshot before
    // this paper was read, so a null selection means the creation moves none of
    // the six forces — which is the honest answer for most work, and scores 0.
    const infScore = precedent ? scoreOf(inf.score) : 0;

    // `action` carries no ceiling — the level is the only bound. It is held to
    // coherence instead: nothing acted on means nothing incentivised, and
    // something acted on means at least something.
    const incScore = pressure ? scoreOf(inc.score) : 0;

    // ── SCORE ────────────────────────────────────────────────────────────────
    // Two questions per law — which force, and how far does this move it. The
    // second is answered on an eleven-rung 0-10 scale, and that answer IS the
    // score: there is no rung behind it and no band around it.
    const invD = deriveScore('inversion', invScore, claim?.id ?? null, alsoBaseline?.id ?? null);
    const incD = deriveScore('incentives', incScore, pressure?.id ?? null, alsoPressure?.id ?? null);
    const infD = deriveScore('inflection', infScore, precedent?.id ?? null, alsoPrecedent?.id ?? null);
    const derivation: LawDerivation[] = [invD, incD, infD];

    return {
        id: meta.id,
        title: meta.title,
        summary: conciseBullets(parsed.summary),
        category: category(parsed.category),
        stratum: str(parsed.stackLevel),
        previousParadigm: str(parsed.previousParadigm, ''),
        corePremise: str(parsed.corePremise, ''),
        inversion: {
            score: invD.final,
            headline: str(inv.headline, ''),
            dimensionId: claim?.id ?? null,
            ...(alsoBaseline ? { secondaryId: alsoBaseline.id } : {}),
            ...missed(wantBaseline, Boolean(claim)),
            baseline: claim?.baseline ?? '',
            inverting: conciseBullets(inv.inverting),
            // Trimmed to the shorter of the two: an unpaired row has nothing to
            // sit opposite and reads as a gap in the table.
            ...pair(inv.previous, inv.proposed),
        },
        incentives: {
            score: incD.final,
            headline: str(inc.headline, ''),
            dimensionId: pressure?.id ?? null,
            ...(alsoPressure ? { secondaryId: alsoPressure.id } : {}),
            ...missed(wantPressure, Boolean(pressure)),
            incentive: pressure?.incentive ?? '',
            outcomeKind: outcome(inc.outcomeKind),
            outcomeEstimate: str(inc.outcomeEstimate, ''),
            bottleneck: conciseBullets(inc.bottleneck, 'Delivers none of the six incentives'),
        },
        inflection: {
            score: infD.final,
            headline: str(inf.headline, ''),
            dimensionId: precedent?.id ?? null,
            ...(alsoPrecedent ? { secondaryId: alsoPrecedent.id } : {}),
            ...missed(wantPrecedent, Boolean(precedent)),
            criterion: precedent?.inflection ?? '',
            unprecedented: conciseBullets(inf.unprecedented),
        },
        ...(claim ? { tag: claim.id } : {}),
        paradigmAsOf: paradigm.asOf,
        derivation,
        // Derived here, never taken from the model — the arithmetic is the one
        // part of the instrument that must not be hallucinated.
        product: invD.final * incD.final * infD.final,
        reach: reachOf(invD.final, incD.final, infD.final),
        outsideFrame: !claim && !pressure && !precedent,
        verdict: str(parsed.verdict, 'noise'),
        confidence: str(parsed.confidence, 'low'),
        model: meta.model,
        cost: meta.cost,
        promptTokens: meta.promptTokens,
        completionTokens: meta.completionTokens,
        truncated: meta.truncated,
    };
}
