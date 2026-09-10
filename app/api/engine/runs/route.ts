import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { frameReviewedAt } from '@/lib/pageContext';
import type { StoredRun, StoredScore } from '@/lib/engine/store';
import type { Critique, CriticNote, CriticSection } from '../critique/route';
import {
    levelOf,
    LEVEL_BAND,
    reachOf,
    byRank,
    type AnyDerivation,
    type ParadigmTag,
} from '@/lib/engine/paradigm';

/** Prisma returns Json columns as unknown; every one of ours is a bullet list. */
function list(v: unknown): string[] {
    return Array.isArray(v) ? v.map(String) : [];
}

/** I²'s display bullets, out of a column that has held three shapes: a bare
 *  string[] on the oldest rows, the fit/impact/ceiling object on rows scored
 *  under the layer schema, and the pressure object written today. Only the
 *  bullets are read back from it — every structured value now has its own
 *  column, so this cannot drift out of step with the row beside it. */
function bottleneckBullets(v: unknown): string[] {
    if (Array.isArray(v)) return list(v);
    if (!v || typeof v !== 'object') return [];
    return list((v as Record<string, unknown>).bullets);
}

/** A law's rung and the band it opened, or nothing at all. Null means the row
 *  predates the ladder; it must not be read as level 0. */
function rung(level: number | null) {
    if (level === null) return {};
    const l = levelOf(level);
    return { level: l, band: LEVEL_BAND[l] };
}

/** The force's INCENTIVE in the snapshot's own words, copied into the JSON
 *  column at scoring time so a row reads without reopening the snapshot.
 *
 *  Three key names have occupied this slot. Rows scored on the six forces carry
 *  `incentive`; the three-list schema wrote the pressure's `problem` there, and
 *  the layer schema before it a bottleneck `name`. All three are read, because a
 *  stored row is a frozen prediction and must go on rendering in the vocabulary
 *  it was scored under — and because reading only the current name silently
 *  blanked every I² line on the card, which is how this was found. */
/** The SECOND force a law named, read back out of the derivation.
 *
 *  It lives there rather than in a column of its own because the derivation is
 *  already the per-law record of how a score was reached, and adding three
 *  nullable columns for a field that carries no weight would be a migration
 *  bought with nothing. */
function secondaryOf(derivation: unknown, law: string): string | undefined {
    if (!Array.isArray(derivation)) return undefined;
    const row = derivation.find(
        (d): d is Record<string, unknown> =>
            Boolean(d) && typeof d === 'object' && (d as Record<string, unknown>).law === law,
    );
    const id = row?.alsoAgainst;
    return typeof id === 'string' && id ? id : undefined;
}

function incentiveLine(v: unknown): string {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return '';
    const row = v as Record<string, unknown>;
    for (const key of ['incentive', 'problem', 'name']) {
        if (typeof row[key] === 'string' && row[key]) return row[key] as string;
    }
    return '';
}

/** Every run for a week, newest first. Scores are append-only and a single
 *  paper can be re-scored on its own, so a week's current reading is the newest
 *  score PER PAPER across all its runs — not the contents of the newest run,
 *  which would hide every paper that run did not touch. */
async function loadWeek(domain: string, year: string, weekIdx: number | number[]) {
    return db.engineRun.findMany({
        // A month is read as the set of its weeks. Merging happens in
        // serialise(), which already keeps the newest score per paper — across
        // several weeks that is the same operation as across several runs.
        where: { domain, year, weekIdx: Array.isArray(weekIdx) ? { in: weekIdx } : weekIdx },
        orderBy: { startedAt: 'desc' },
        include: {
            scores: {
                orderBy: { scoredAt: 'desc' },
                include: { critiques: { include: { notes: true }, orderBy: { round: 'asc' } } },
            },
        },
    });
}

type RunRows = Awaited<ReturnType<typeof loadWeek>>;
type ScoreRow = RunRows[number]['scores'][number];

function serialiseScore(s: ScoreRow): StoredScore {
    return {
        scoreId: s.id,
        id: s.paperId,
        title: s.title,
        summary: list(s.summary),
        category: s.category,
        stratum: s.level,
        previousParadigm: s.previousParadigm,
        corePremise: s.corePremise,
        inversion: {
            score: s.inversion,
            // Absent on rows scored before the ladder existed. Defaulting to 0
            // would give them the [0,0] band and clamp every stored score to
            // zero — a frozen prediction must read back as it was made.
            ...rung(s.inversionLevel),
            headline: s.inversionHeadline,
            dimensionId: s.baselineId,
            ...(secondaryOf(s.derivation, 'inversion') ? { secondaryId: secondaryOf(s.derivation, 'inversion')! } : {}),
            baseline: s.paradigm,
            inverting: list(s.inverting),
            previous: list(s.previous),
            proposed: list(s.proposed),
        },
        incentives: {
            score: s.incentives,
            ...rung(s.incentivesLevel),
            headline: s.incentivesHeadline,
            dimensionId: s.pressureId,
            ...(secondaryOf(s.derivation, 'incentives') ? { secondaryId: secondaryOf(s.derivation, 'incentives')! } : {}),
            incentive: incentiveLine(s.bottleneck),
            outcomeKind: s.outcomeKind,
            outcomeEstimate: s.outcomeEstimate,
            bottleneck: bottleneckBullets(s.bottleneck),
        },
        inflection: {
            score: s.inflection,
            ...rung(s.inflectionLevel),
            headline: s.inflectionHeadline,
            dimensionId: s.precedentId,
            ...(secondaryOf(s.derivation, 'inflection') ? { secondaryId: secondaryOf(s.derivation, 'inflection')! } : {}),
            criterion: s.precedentName ?? '',
            unprecedented: list(s.unprecedented),
        },
        ...(s.paradigmTag ? { tag: s.paradigmTag as ParadigmTag } : {}),
        paradigmAsOf: s.paradigmAsOf ?? '',
        ...(s.derivation ? { derivation: s.derivation as unknown as AnyDerivation[] } : {}),
        product: s.product,
        // Derived from columns the row already holds, so no stored prediction
        // is rewritten and no migration is needed to rank a ledger of zeros.
        reach: reachOf(s.inversion, s.incentives, s.inflection),
        outsideFrame: !s.baselineId && !s.pressureId && !s.precedentId,
        verdict: s.verdict,
        confidence: s.confidence,
        model: s.model,
        cost: s.cost,
        promptTokens: s.promptTokens,
        completionTokens: s.completionTokens,
        truncated: s.truncated,
        scoredAt: s.scoredAt.toISOString(),
        critiques: s.critiques.map((c): Critique => ({
            id: c.id,
            round: c.round,
            model: c.model,
            cost: c.cost,
            promptTokens: c.promptTokens,
            completionTokens: c.completionTokens,
            notes: c.notes.map((n): CriticNote => ({
                noteId: n.id,
                section: n.section as CriticSection,
                agrees: n.agrees,
                reasoning: list(n.reasoning),
                ...(n.proposedId !== null ? { proposedId: n.proposedId } : {}),
                ...(n.proposedLevel !== null ? { proposedLevel: n.proposedLevel } : {}),
                ...(n.proposedScore !== null ? { proposedScore: n.proposedScore } : {}),
                ...(n.proposedBullets ? { proposedBullets: list(n.proposedBullets) } : {}),
                resolution: (n.resolution as 'applied' | 'dismissed' | null) ?? null,
            })),
        })),
    };
}

function serialise(runs: RunRows): StoredRun | null {
    // Newest run first, and scores within a run newest first, so the first time
    // a paper is seen is its current score.
    const latest = new Map<string, StoredScore>();
    for (const run of runs) {
        for (const s of run.scores) {
            if (!latest.has(s.paperId)) latest.set(s.paperId, serialiseScore(s));
        }
    }
    const scores = [...latest.values()].sort(byRank);
    if (scores.length === 0) return null;

    // Provenance comes from the scores themselves. A week assembled from several
    // runs has no single pair of seats, and the run's own columns would lie.
    const newest = scores.reduce((a, b) => (a.scoredAt > b.scoredAt ? a : b));
    const newestCritique = scores
        .filter((s) => s.critiques.length)
        .sort((a, b) => b.scoredAt.localeCompare(a.scoredAt))[0];
    // Attach new scores to the most recent run so a re-score joins its siblings.
    const head = runs[0];

    return {
        id: head.id,
        domain: head.domain,
        year: head.year,
        weekIdx: head.weekIdx,
        heading: head.heading,
        analystModel: newest.model,
        criticModel: newestCritique?.critiques.at(-1)?.model ?? null,
        frameReviewedAt: head.frameReviewedAt,
        startedAt: newest.scoredAt,
        scores,
    };
}

// ─── GET /api/engine/runs?domain=ai&year=2025&weekIdx=3 ──────────────────────
// The most recent run for a week. Runs are append-only, so this is the current
// reading and the earlier ones remain for comparison.
//
// `weekIdx` also takes a comma-separated list — `weekIdx=3,4,5,6` — which is
// how the month view reads a month without runs having to be monthly. Scoring
// is unaffected either way: a paper is judged against a paradigm snapshot on
// its own, never against the other papers in the request.

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const domain = url.searchParams.get('domain') ?? 'ai';
        const year = url.searchParams.get('year');
        const weekIdx = url.searchParams.get('weekIdx');
        if (!year || weekIdx === null) {
            return Response.json({ error: 'year and weekIdx are required' }, { status: 400 });
        }

        const indices = weekIdx
            .split(',')
            .map((n) => Number(n.trim()))
            .filter((n) => Number.isInteger(n));
        if (indices.length === 0) {
            return Response.json({ error: 'weekIdx must be one or more integers' }, { status: 400 });
        }

        const runs = await loadWeek(domain, year, indices.length === 1 ? indices[0] : indices);
        return Response.json(runs.length ? serialise(runs) : null);
    } catch (err) {
        console.error('[api/engine/runs GET]', err);
        return Response.json({ error: 'Failed to load run' }, { status: 500 });
    }
}

// ─── POST /api/engine/runs ───────────────────────────────────────────────────
// Opens a run. Always a new row — a re-run is a second reading, not an edit.

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as {
            domain?: string;
            year?: string;
            weekIdx?: number;
            heading?: string;
            analystModel?: string;
            criticModel?: string | null;
        };
        if (!body.year || body.weekIdx === undefined || !body.analystModel) {
            return Response.json({ error: 'Invalid run' }, { status: 400 });
        }

        const run = await db.engineRun.create({
            data: {
                domain: body.domain ?? 'ai',
                year: body.year,
                weekIdx: body.weekIdx,
                heading: body.heading ?? '',
                analystModel: body.analystModel,
                criticModel: body.criticModel ?? null,
                frameReviewedAt: frameReviewedAt(),
            },
        });
        return Response.json({ id: run.id });
    } catch (err) {
        console.error('[api/engine/runs POST]', err);
        return Response.json({ error: 'Failed to open run' }, { status: 500 });
    }
}

// ─── PATCH /api/engine/runs ──────────────────────────────────────────────────
// The critic is a separate pass, so which model criticised a run is not known
// when the run opens. Recorded when that pass actually runs.
//
// Body: { id: string, criticModel: string }

export async function PATCH(req: NextRequest) {
    try {
        const { id, criticModel } = (await req.json()) as { id?: string; criticModel?: string };
        if (!id) return Response.json({ error: 'id is required' }, { status: 400 });

        await db.engineRun.update({
            where: { id },
            data: { criticModel: criticModel ?? null },
        });
        return Response.json({ ok: true });
    } catch (err) {
        console.error('[api/engine/runs PATCH]', err);
        return Response.json({ error: 'Failed to record critic' }, { status: 500 });
    }
}

// ─── DELETE /api/engine/runs ─────────────────────────────────────────────────────────────────────
// Clears every reading of one paper inside one digest week. A paper can have
// scores in several append-only runs; deleting only the visible score would
// reveal the previous one immediately and make "clear" appear not to work.
// Critiques and notes follow through their existing cascade relations.

export async function DELETE(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const domain = url.searchParams.get('domain') ?? 'ai';
        const year = url.searchParams.get('year');
        const weekIdx = url.searchParams.get('weekIdx');
        const paperId = url.searchParams.get('paperId');
        // Clearing a whole week is asked for by name. A missing paperId is far
        // more likely to be a caller's bug than an intention to delete every
        // score in the week, so it is not enough on its own to mean "all".
        const all = url.searchParams.get('all') === '1';

        if (!year || weekIdx === null) {
            return Response.json({ error: 'year and weekIdx are required' }, { status: 400 });
        }
        if (!all && (!paperId || !/^\d{4}\.\d{4,5}$/.test(paperId))) {
            return Response.json({ error: 'a valid paperId is required unless all=1' }, { status: 400 });
        }
        const index = Number(weekIdx);
        if (!Number.isInteger(index) || index < 0) {
            return Response.json({ error: 'weekIdx must be a non-negative integer' }, { status: 400 });
        }

        const runs = await db.engineRun.findMany({
            where: { domain, year, weekIdx: index },
            select: { id: true },
        });
        const result = await db.engineScore.deleteMany({
            where: {
                ...(all ? {} : { paperId: paperId! }),
                runId: { in: runs.map((run) => run.id) },
            },
        });
        return Response.json({ ok: true, deleted: result.count });
    } catch (err) {
        console.error('[api/engine/runs DELETE]', err);
        return Response.json({ error: 'Failed to clear paper results' }, { status: 500 });
    }
}
