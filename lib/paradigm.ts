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
     *  from it. A share whose basis cannot be stated is a share that should not
     *  be written — an invented number with arithmetic consequences is worse
     *  than an absent one. */
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
    /** What is being pursued but is not dominant. An empty array is a claim:
     *  no credible alternative was being worked on. */
    frontier: string[];
    /** How consequential it would be if the assumption failed. Caps I¹. */
    importance: number;
    /** Dated refs, every one published on or before `asOf`. The hindsight guard,
     *  and the reason a `frontier` entry can be trusted. */
    evidence: string[];
}

export interface Paradigm {
    asOf: string;
    /** `reconstructed` was written after the fact from period sources;
     *  `preregistered` was sealed on the date it describes. */
    mode: 'reconstructed' | 'preregistered';
    thesis: string;
    bindingConstraint: { layer: ParadigmLayerId; description: string };
    layers: ParadigmLayer[];
}

// ─── how a candidate meets the paradigm ──────────────────────────────────────

/** Not every paper attacking a layer inverts it. FlashAttention and the
 *  Transformer both land on architecture; only one of them changes what is
 *  held necessary. */
export type ParadigmRelation = 'reinforces' | 'extends' | 'optimizes' | 'challenges' | 'inverts';

/** The band each relation may score on I¹, before the `importance` cap — so a
 *  row cannot report `optimizes` and then score 8. */
export const RELATION_BAND: Record<ParadigmRelation, [number, number]> = {
    reinforces: [0, 1],
    extends: [1, 3],
    optimizes: [1, 3],
    challenges: [4, 6],
    inverts: [7, 10],
};

export type DistributionPosition = 'dominant' | 'minor' | 'frontier' | 'absent';

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

    const position: DistributionPosition =
        hit && top && hit.share === top.share ? 'dominant'
        : hit ? 'minor'
        : frontierHit ? 'frontier'
        : 'absent';

    // What it actually matched against, so a wrong position is visible rather
    // than silently feeding a score. This is a heuristic, not ground truth.
    return {
        position,
        onFrontier: Boolean(frontierHit),
        dominantShare: top?.share ?? null,
        matchedValue: hit?.value ?? frontierHit ?? null,
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

/** The newest snapshot standing at or before `when` (a year, or `YYYY-MM`).
 *  A paper is judged against the paradigm that was standing when it was
 *  published — never a later one, which would be reading history with
 *  hindsight. A bare year means January of that year, so a 2025 paper picks the
 *  December 2024 snapshot rather than one written during 2025. */
export function loadParadigm(when: string | number): Paradigm | null {
    const want = /^\d{4}$/.test(String(when)) ? `${when}-01` : String(when);
    const pick = paradigmDates().find((d) => d <= want);
    if (!pick) return null;
    try {
        return JSON.parse(fs.readFileSync(path.join(DIR, `${pick}.json`), 'utf-8')) as Paradigm;
    } catch {
        return null;
    }
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

/** The snapshot as the analyst reads it. Importance is shown because the model
 *  must know the ceiling it is scoring under, not because it may change it. */
export function renderParadigm(p: Paradigm): string {
    const out: string[] = [
        '─── THE STANDING PARADIGM ──────────────────────────────────────────────────',
        `As of ${p.asOf} · ${p.mode}`,
        '',
        `THESIS: ${p.thesis}`,
        `BINDING CONSTRAINT: ${p.bindingConstraint.layer} — ${p.bindingConstraint.description}`,
        '',
    ];

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
