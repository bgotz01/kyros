import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { frameReviewedAt } from '@/lib/pageContext';
import type { StoredRun, StoredScore } from '@/lib/engineStore';
import type { CriticNote, CriticSection } from '../critique/route';
import {
    layerOf,
    loadParadigm,
    positionOf,
    type BottleneckAction,
    type BottleneckFit,
    type BottleneckImpact,
    type ParadigmRelation,
    type Precedent,
    type LawDerivation,
} from '@/lib/paradigm';

/** Prisma returns Json columns as unknown; every one of ours is a bullet list. */
function list(v: unknown): string[] {
    return Array.isArray(v) ? v.map(String) : [];
}

/** I² originally stored only its display bullets. New rows keep the complete
 *  dated bottleneck measurement in the same JSON column, so no destructive
 *  migration is needed and old scores retain their original shape. */
function bottleneck(v: unknown) {
    if (Array.isArray(v)) return { bottleneck: list(v) };
    if (!v || typeof v !== 'object') return { bottleneck: [] as string[] };
    const row = v as Record<string, unknown>;
    return {
        bottleneck: list(row.bullets),
        bottleneckId: typeof row.id === 'string' ? row.id : undefined,
        bottleneckName: typeof row.name === 'string' ? row.name : undefined,
        bottleneckFit: typeof row.fit === 'string' ? row.fit as BottleneckFit : undefined,
        // Absent on rows scored before the action axis existed; those were all
        // scored as relief, which is what an undefined action reads as.
        action: typeof row.action === 'string' ? row.action as BottleneckAction : undefined,
        impact: typeof row.impact === 'string' ? row.impact as BottleneckImpact : undefined,
        bottleneckAsOf: typeof row.asOf === 'string' ? row.asOf : undefined,
        ceiling: typeof row.ceiling === 'number' ? row.ceiling : undefined,
    };
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
                include: { critique: { include: { notes: true } } },
            },
        },
    });
}

type RunRows = Awaited<ReturnType<typeof loadWeek>>;
type ScoreRow = RunRows[number]['scores'][number];

/** Where the proposal sat in the snapshot it was judged against. Derived on
 *  read rather than stored: the snapshot is sealed, so the answer is stable,
 *  and a stored copy could only ever fall out of step with it. */
function derivePosition(asOf: string | null, layerId: string | null, proposes: string | null): string {
    if (!asOf || !layerId || !proposes) return '';
    const p = loadParadigm(asOf.slice(0, 7));
    const layer = p ? layerOf(p, layerId) : undefined;
    return layer ? positionOf(layer, proposes).position : '';
}

function serialiseScore(s: ScoreRow): StoredScore {
    return {
        scoreId: s.id,
        id: s.paperId,
        title: s.title,
        summary: list(s.summary),
        category: s.category,
        level: s.level,
        previousParadigm: s.previousParadigm,
        corePremise: s.corePremise,
        inversion: {
            score: s.inversion,
            headline: s.inversionHeadline,
            paradigm: s.paradigm,
            paradigmImportance: s.paradigmImportance,
            inverting: list(s.inverting),
            magnitude: s.magnitude,
            previous: list(s.previous),
            proposed: list(s.proposed),
        },
        incentives: {
            score: s.incentives,
            headline: s.incentivesHeadline,
            outcomeKind: s.outcomeKind,
            outcomeEstimate: s.outcomeEstimate,
            ...bottleneck(s.bottleneck),
        },
        inflection: {
            score: s.inflection,
            headline: s.inflectionHeadline,
            unprecedented: list(s.unprecedented),
            ...(s.precedent ? { precedent: s.precedent as Precedent } : {}),
        },
        // Null on rows scored before the paradigm snapshots existed, so the
        // card must read as it did then rather than showing an empty delta.
        ...(s.paradigmLayer && s.paradigmRelation
            ? {
                  delta: {
                      layer: s.paradigmLayer,
                      relation: s.paradigmRelation as ParadigmRelation,
                      proposes: s.paradigmProposes ?? '',
                      position: derivePosition(s.paradigmAsOf, s.paradigmLayer, s.paradigmProposes),
                      paradigmAsOf: s.paradigmAsOf ?? '',
                  },
              }
            : {}),
        ...(s.derivation ? { derivation: s.derivation as unknown as LawDerivation[] } : {}),
        product: s.product,
        verdict: s.verdict,
        confidence: s.confidence,
        model: s.model,
        cost: s.cost,
        promptTokens: s.promptTokens,
        completionTokens: s.completionTokens,
        truncated: s.truncated,
        scoredAt: s.scoredAt.toISOString(),
        critique: s.critique
            ? {
                  id: s.paperId,
                  model: s.critique.model,
                  cost: s.critique.cost,
                  promptTokens: s.critique.promptTokens,
                  completionTokens: s.critique.completionTokens,
                  notes: s.critique.notes.map((n): CriticNote => ({
                      noteId: n.id,
                      section: n.section as CriticSection,
                      agrees: n.agrees,
                      reasoning: list(n.reasoning),
                      ...(n.proposedScore !== null ? { proposedScore: n.proposedScore } : {}),
                      ...(n.proposedBullets ? { proposedBullets: list(n.proposedBullets) } : {}),
                      resolution: (n.resolution as 'applied' | 'dismissed' | null) ?? null,
                  })),
              }
            : undefined,
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
    const scores = [...latest.values()].sort((a, b) => b.product - a.product);
    if (scores.length === 0) return null;

    // Provenance comes from the scores themselves. A week assembled from several
    // runs has no single pair of seats, and the run's own columns would lie.
    const newest = scores.reduce((a, b) => (a.scoredAt > b.scoredAt ? a : b));
    const newestCritique = scores
        .filter((s) => s.critique)
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
        criticModel: newestCritique?.critique?.model ?? null,
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

        if (!year || weekIdx === null || !paperId || !/^\d{4}\.\d{4,5}$/.test(paperId)) {
            return Response.json({ error: 'year, weekIdx and a valid paperId are required' }, { status: 400 });
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
                paperId,
                runId: { in: runs.map((run) => run.id) },
            },
        });
        return Response.json({ ok: true, deleted: result.count });
    } catch (err) {
        console.error('[api/engine/runs DELETE]', err);
        return Response.json({ error: 'Failed to clear paper results' }, { status: 500 });
    }
}
