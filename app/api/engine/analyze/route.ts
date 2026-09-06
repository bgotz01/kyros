import { NextRequest } from 'next/server';
import { hasApiKey, MISSING_KEY_MESSAGE, openrouter } from '@/lib/openrouter';
import { MODELS, DEFAULT_MODEL } from '@/lib/models';
import { buildFrameBlock, buildBottleneckBlock } from '@/lib/pageContext';
import {
    loadParadigm,
    layerOf,
    renderParadigm,
    RELATION_BAND,
    positionOf,
    type ParadigmRelation,
} from '@/lib/paradigm';
import { ENGINE_SYSTEM, buildPaperPrompt, CATEGORIES, OUTCOME_KINDS } from '@/lib/prompts/engine';
import { readPaper } from '@/lib/engineData';
import { db } from '@/lib/db';

export const maxDuration = 300;

/** Papers run from 5k to 160k tokens. Beyond this the tail is method appendices
 *  and related work, which carry none of the inversion — and a survey would
 *  otherwise cost more than the whole rest of a week combined. */
const MAX_PAPER_CHARS = 60_000;

export interface EngineScore {
    id: string;
    title: string;
    summary: string[];
    category: string;
    level: string;
    previousParadigm: string;
    corePremise: string;
    inversion: {
        score: number;
        headline: string;
        paradigm: string;
        paradigmImportance: number;
        inverting: string[];
        magnitude: string;
        previous: string[];
        proposed: string[];
    };
    incentives: {
        score: number;
        headline: string;
        outcomeKind: string;
        outcomeEstimate: string;
        bottleneck: string[];
    };
    inflection: { score: number; headline: string; unprecedented: string[] };
    /** Which layer of the standing paradigm this lands on, what it does to that
     *  layer, and which snapshot it was judged against. */
    delta?: {
        layer: string;
        relation: ParadigmRelation;
        proposes: string;
        position: string;
        paradigmAsOf: string;
    };
    product: number;
    verdict: string;
    confidence: string;
    model: string;
    cost: number;
    promptTokens: number;
    completionTokens: number;
    truncated: boolean;
}

/** Models wrap JSON in prose or fences unevenly; take the outermost object. */
function extractJson(raw: string): Record<string, unknown> | null {
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
    const n = Math.min(previous.length, proposed.length);
    return { previous: previous.slice(0, n), proposed: proposed.slice(0, n) };
}

function clampScore(v: unknown): number {
    const n = Math.round(Number(v));
    if (!Number.isFinite(n)) return 0;
    return Math.min(10, Math.max(0, n));
}

function str(v: unknown, fallback = '—'): string {
    return typeof v === 'string' && v.trim() ? v.trim() : fallback;
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

const RELATIONS: ParadigmRelation[] = ['reinforces', 'extends', 'optimizes', 'challenges', 'inverts'];

function relationOf(v: unknown): ParadigmRelation | undefined {
    const raw = String(v ?? '').toLowerCase().trim();
    return RELATIONS.find((r) => r === raw);
}

/** The paper's year, for choosing the snapshot it is judged against. The arXiv
 *  id carries YYMM, which is more reliable than a parsed publication line. */
function yearOfPaper(id: string, published?: string): string {
    const fromId = /^(\d{2})(\d{2})\./.exec(id);
    if (fromId) return `20${fromId[1]}`;
    return published?.slice(0, 4) ?? String(new Date().getFullYear());
}

export async function POST(req: NextRequest) {
    try {
        if (!hasApiKey()) {
            return Response.json({ error: MISSING_KEY_MESSAGE }, { status: 500 });
        }

        const { id, title, model, runId } = (await req.json()) as {
            id?: string;
            title?: string;
            model?: string;
            runId?: string;
        };
        if (!id || !/^\d{4}\.\d{4,5}$/.test(id)) {
            return Response.json({ error: 'Invalid arXiv id' }, { status: 400 });
        }

        const paper = readPaper(id);
        if (!paper) {
            return Response.json(
                { error: `No text in the archive for ${id}. Run: npm run fetch ${id}` },
                { status: 404 },
            );
        }

        const truncated = paper.text.length > MAX_PAPER_CHARS;
        const text = truncated ? paper.text.slice(0, MAX_PAPER_CHARS) : paper.text;

        const resolvedModel = model ?? DEFAULT_MODEL;
        const meta = MODELS.find((m) => m.id === resolvedModel);

        // The paradigm standing when the paper was published — never a later
        // one, which would be scoring history with hindsight.
        const paradigm = loadParadigm(yearOfPaper(id, paper.published));

        // Frame first, then the paradigm it is measured against, then the
        // constraint surface, then procedure. The frame defines the laws; this
        // prompt must never restate them.
        const system = [
            buildFrameBlock(),
            paradigm ? renderParadigm(paradigm) : '',
            buildBottleneckBlock(),
            ENGINE_SYSTEM,
        ]
            .filter(Boolean)
            .join('\n\n');

        const completion = await openrouter().chat.completions.create({
            model: resolvedModel,
            messages: [
                { role: 'system', content: system },
                {
                    role: 'user',
                    content: buildPaperPrompt({
                        id,
                        title: title ?? id,
                        published: paper.published,
                        text,
                    }),
                },
            ],
            max_tokens: meta?.maxTokens ?? 4000,
            temperature: 0.3, // a scoring instrument, not a conversationalist
        });

        const raw = completion.choices[0]?.message?.content ?? '';
        const parsed = extractJson(raw);
        if (!parsed) {
            return Response.json(
                { error: 'Model did not return usable JSON', raw: raw.slice(0, 400) },
                { status: 502 },
            );
        }

        const inv = (parsed.inversion ?? {}) as Record<string, unknown>;
        const inc = (parsed.incentives ?? {}) as Record<string, unknown>;
        const inf = (parsed.inflection ?? {}) as Record<string, unknown>;

        // The delta: which layer, and what it does to that layer.
        const layer = paradigm ? layerOf(paradigm, str(parsed.paradigmLayer, '')) : undefined;
        const relation = relationOf(parsed.paradigmRelation);
        const proposes = str(parsed.paradigmProposes, '');

        // Importance is a property of the layer, decided once in the snapshot —
        // not a per-paper judgement. Only where no snapshot covers the paper's
        // year does the model's own claim stand.
        const paradigmImportance = layer ? layer.importance : clampScore(inv.paradigmImportance);

        // An inversion is only as large as the thing it inverts, and only as
        // large as what it actually does to it. Enforced here rather than
        // trusted to the prompt: a model that speeds up attention will
        // otherwise reach for a 7 because the paper is neat.
        const relationCeiling = relation ? RELATION_BAND[relation][1] : 10;
        const inversion = Math.min(clampScore(inv.score), relationCeiling, paradigmImportance);
        const incentives = clampScore(inc.score);
        const inflection = clampScore(inf.score);

        const usage = completion.usage as
            | { cost?: number; prompt_tokens?: number; completion_tokens?: number }
            | undefined;

        const score: EngineScore = {
            id,
            title: title ?? id,
            summary: bullets(parsed.summary),
            category: category(parsed.category),
            level: str(parsed.level),
            previousParadigm: str(parsed.previousParadigm, ''),
            corePremise: str(parsed.corePremise, ''),
            inversion: {
                score: inversion,
                headline: str(inv.headline, ''),
                paradigm: str(inv.paradigm, ''),
                paradigmImportance,
                inverting: bullets(inv.inverting),
                magnitude: str(inv.magnitude, 'local'),
                // Trimmed to the shorter of the two: an unpaired row has nothing
                // to sit opposite and reads as a gap in the table.
                ...pair(inv.previous, inv.proposed),
            },
            incentives: {
                score: incentives,
                headline: str(inc.headline, ''),
                outcomeKind: outcome(inc.outcomeKind),
                outcomeEstimate: str(inc.outcomeEstimate, ''),
                bottleneck: bullets(inc.bottleneck, 'None'),
            },
            ...(paradigm && layer && relation
                ? {
                      delta: {
                          layer: layer.layer,
                          relation,
                          proposes,
                          position: positionOf(layer, proposes).position,
                          paradigmAsOf: paradigm.asOf,
                      },
                  }
                : {}),
            inflection: {
                score: inflection,
                headline: str(inf.headline, ''),
                unprecedented: bullets(inf.unprecedented),
            },
            // Derived here, never taken from the model — the arithmetic is the
            // one part of the instrument that must not be hallucinated.
            product: inversion * incentives * inflection,
            verdict: str(parsed.verdict, 'noise'),
            confidence: str(parsed.confidence, 'low'),
            model: resolvedModel,
            cost: usage?.cost ?? 0,
            promptTokens: usage?.prompt_tokens ?? 0,
            completionTokens: usage?.completion_tokens ?? 0,
            truncated,
        };

        // Stored as returned and never edited afterwards. A critic's accepted
        // correction is recorded on its own note and layered at read time.
        if (runId) {
            const row = await db.engineScore.create({
                data: {
                    runId,
                    paperId: id,
                    title: score.title,
                    summary: score.summary,
                    category: score.category,
                    level: score.level,
                    previousParadigm: score.previousParadigm,
                    corePremise: score.corePremise,
                    inversion: score.inversion.score,
                    inversionHeadline: score.inversion.headline,
                    paradigm: score.inversion.paradigm,
                    paradigmImportance: score.inversion.paradigmImportance,
                    paradigmLayer: score.delta?.layer ?? null,
                    paradigmRelation: score.delta?.relation ?? null,
                    paradigmProposes: score.delta?.proposes ?? null,
                    paradigmAsOf: score.delta?.paradigmAsOf ?? null,
                    inverting: score.inversion.inverting,
                    magnitude: score.inversion.magnitude,
                    previous: score.inversion.previous,
                    proposed: score.inversion.proposed,
                    incentives: score.incentives.score,
                    incentivesHeadline: score.incentives.headline,
                    outcomeKind: score.incentives.outcomeKind,
                    outcomeEstimate: score.incentives.outcomeEstimate,
                    bottleneck: score.incentives.bottleneck,
                    inflection: score.inflection.score,
                    inflectionHeadline: score.inflection.headline,
                    unprecedented: score.inflection.unprecedented,
                    product: score.product,
                    verdict: score.verdict,
                    confidence: score.confidence,
                    model: score.model,
                    cost: score.cost,
                    promptTokens: score.promptTokens,
                    completionTokens: score.completionTokens,
                    truncated: score.truncated,
                },
            });
            return Response.json({ ...score, scoreId: row.id, scoredAt: row.scoredAt.toISOString() });
        }

        return Response.json(score);
    } catch (err) {
        console.error('[api/engine/analyze]', err);
        const message = err instanceof Error ? err.message : 'Analysis failed';
        return Response.json({ error: message }, { status: 500 });
    }
}
