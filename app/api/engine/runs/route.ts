import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { frameReviewedAt } from '@/lib/pageContext';
import type { StoredRun, StoredScore } from '@/lib/engineStore';
import type { CriticNote, CriticSection } from '../critique/route';

/** Prisma returns Json columns as unknown; every one of ours is a bullet list. */
function list(v: unknown): string[] {
    return Array.isArray(v) ? v.map(String) : [];
}

/** Every run for a week, newest first. Scores are append-only and a single
 *  paper can be re-scored on its own, so a week's current reading is the newest
 *  score PER PAPER across all its runs — not the contents of the newest run,
 *  which would hide every paper that run did not touch. */
async function loadWeek(domain: string, year: string, weekIdx: number) {
    return db.engineRun.findMany({
        where: { domain, year, weekIdx },
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
            bottleneck: list(s.bottleneck),
        },
        inflection: {
            score: s.inflection,
            headline: s.inflectionHeadline,
            unprecedented: list(s.unprecedented),
        },
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

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const domain = url.searchParams.get('domain') ?? 'ai';
        const year = url.searchParams.get('year');
        const weekIdx = url.searchParams.get('weekIdx');
        if (!year || weekIdx === null) {
            return Response.json({ error: 'year and weekIdx are required' }, { status: 400 });
        }

        const runs = await loadWeek(domain, year, Number(weekIdx));
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
