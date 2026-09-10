// ─── reading the snapshots off disk ──────────────────────────────────────────
// Split out of lib/engine/paradigm.ts because that module is imported by CLIENT
// components — the level ladder, the action vocabulary and the id lookups are
// all needed to render a row — and a module touching `node:fs` cannot be
// bundled for the browser. Everything in this file is server-only.

import fs from 'node:fs';
import path from 'node:path';
import { DIMENSION_COUNT, type Paradigm } from './paradigm';

const DIR = path.join(process.cwd(), 'context', 'ai', 'paradigm');

/** A snapshot still written in the retired layer/bottleneck schema cannot be
 *  scored against: it has no ids for the three laws to select. Rather than
 *  quietly rendering an empty frame, an unconverted file is invisible to the
 *  loader, and the route refuses to score against a date it does not cover.
 *
 *  Converted snapshots live in `context/ai/paradigm/`; the originals are kept
 *  in `legacy/` beneath it until they are rewritten. */
function isParadigm(v: unknown): v is Paradigm {
    if (!v || typeof v !== 'object') return false;
    const p = v as Record<string, unknown>;
    return typeof p.asOf === 'string' && Array.isArray(p.dimensions);
}

/** The count, checked on load rather than trusted to authoring discipline.
 *
 *  Six is not a target range and the warning says so. The previous schema
 *  allowed 5-10 in each of three lists, and the slack is what made a 7 cheap:
 *  with thirty objects available a scorer could nearly always find one that
 *  fit, so membership stopped filtering anything. Warn loudly; do not refuse,
 *  since a snapshot mid-edit is still readable. */
function checkLimits(p: Paradigm, stem: string): void {
    if (p.dimensions.length !== DIMENSION_COUNT) {
        console.warn(
            `[paradigm ${stem}] has ${p.dimensions.length} dimensions, not ${DIMENSION_COUNT}. `
            + 'The count is a claim about what is driving the paradigm, not a target range — '
            + 'combine or remove until only the forces the field is actually moving along remain.',
        );
    }
    const seen = new Set<string>();
    for (const d of p.dimensions) {
        if (seen.has(d.id)) console.warn(`[paradigm ${stem}] duplicate dimension id '${d.id}'.`);
        seen.add(d.id);
        for (const [field, v] of [
            ['baseline', d.baseline],
            ['incentive', d.incentive],
            ['inflection', d.inflection],
        ] as const) {
            if (!v || !String(v).trim()) {
                console.warn(
                    `[paradigm ${stem}] dimension '${d.id}' has no ${field}. All three are `
                    + 'required — each one is a different law\'s only target on this force.',
                );
            }
        }
        if (!d.evidence?.length) {
            console.warn(
                `[paradigm ${stem}] dimension '${d.id}' cites no evidence. A force with no `
                + 'dated reference is a memory, and a memory cannot bound a score.',
            );
        }
    }
}

function read(stem: string): Paradigm | null {
    try {
        const parsed: unknown = JSON.parse(fs.readFileSync(path.join(DIR, `${stem}.json`), 'utf-8'));
        if (!isParadigm(parsed)) return null;
        checkLimits(parsed, stem);
        return parsed;
    } catch {
        return null;
    }
}

/** Converted snapshots in the corpus, newest first, keyed `YYYY-MM`. Snapshots
 *  are dated rather than annual: the field does not turn over on a January, and
 *  2023 alone held at least three distinct paradigms. */
export function paradigmDates(): string[] {
    try {
        return fs
            .readdirSync(DIR)
            .filter((f) => /^\d{4}-\d{2}\.json$/.test(f))
            .map((f) => f.replace(/\.json$/, ''))
            .filter((stem) => read(stem) !== null)
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
 *  Scoring DeepSeek-V3 against a December 2024 snapshot that names DeepSeek-V3
 *  asks whether the paper is an outlier relative to a paradigm that already
 *  contains it, and the answer can only be no.
 *
 *  So a December 2024 paper is judged against December 2023, and a January 2025
 *  paper against December 2024. A bare year means January of that year. */
export function loadParadigm(when: string | number): Paradigm | null {
    const want = /^\d{4}$/.test(String(when)) ? `${when}-01` : String(when);
    const pick = paradigmDates().find((d) => d < want);
    return pick ? read(pick) : null;
}

/** Every converted snapshot, newest first. For the reader, not the scorer. */
export function allParadigms(): Paradigm[] {
    return paradigmDates()
        .map(read)
        .filter((p): p is Paradigm => p !== null);
}
