import { NextRequest } from 'next/server';
import { hasApiKey, MISSING_KEY_MESSAGE, openrouter } from '@/lib/openrouter';
import { MODELS, DEFAULT_MODEL } from '@/lib/models';
import { buildSeatContext, MAX_PAPER_CHARS } from '@/lib/pageContext';
import {
    BOTTLENECK_FIT_CEILING,
    deriveScore,
    type LawDerivation,
    INFLECTION_CEILING,
    boundedDisplacement,
    type Displacement,
    type DistributionPosition,
    type Precedent,
    BOTTLENECK_IMPACT_CEILING,
    bottleneckOf,
    loadParadigm,
    layerOf,
    paperPeriod,
    RELATION_BAND,
    positionOf,
    type BottleneckFit,
    type BottleneckImpact,
    type ParadigmRelation,
} from '@/lib/paradigm';
import { ENGINE_SYSTEM, buildPaperPrompt, CATEGORIES, OUTCOME_KINDS } from '@/lib/prompts/engine';
import { readPaper } from '@/lib/engineData';
import { db } from '@/lib/db';
import type { Prisma } from '@/lib/generated/prisma/client';

export const maxDuration = 300;

/** Papers run from 5k to 160k tokens. Beyond this the tail is method appendices
 *  and related work, which carry none of the inversion — and a survey would
 *  otherwise cost more than the whole rest of a week combined. */

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
        /** The dated constraint this paper acts on. Optional on legacy rows. */
        bottleneckId?: string;
        bottleneckName?: string;
        bottleneckFit?: BottleneckFit;
        impact?: BottleneckImpact;
        bottleneckAsOf?: string;
        /** Deterministic ceiling derived from the snapshot, fit and impact. */
        ceiling?: number;
    };
    inflection: {
        score: number;
        headline: string;
        unprecedented: string[];
        /** What had already been demonstrated before publication. */
        precedent?: Precedent;
        /** How far past the prior best the result lands, after the precedent bound. */
        displacement?: Displacement;
        /** Deterministic ceiling from precedent and where the proposal sat. */
        ceiling?: number;
    };
    /** How each law's score was reached: the model's claim, the ceilings that
     *  applied, and which one bound. */
    derivation?: LawDerivation[];
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
    const n = Math.min(previous.length, proposed.length, 2);
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

/** The card is an instrument row, not an essay. The prompt requests two; this
 *  cap keeps a verbose model from rebuilding the old wall of prose. */
function conciseBullets(v: unknown, fallback = '—'): string[] {
    return bullets(v, fallback).slice(0, 2);
}

const RELATIONS: ParadigmRelation[] = ['reinforces', 'extends', 'optimizes', 'challenges', 'inverts'];
const BOTTLENECK_FITS: BottleneckFit[] = ['none', 'adjacent', 'direct'];
const BOTTLENECK_IMPACTS: BottleneckImpact[] = ['negligible', 'incremental', 'material', 'structural'];

function relationOf(v: unknown): ParadigmRelation | undefined {
    const raw = String(v ?? '').toLowerCase().trim();
    return RELATIONS.find((r) => r === raw);
}

const PRECEDENTS: Precedent[] = ['established', 'demonstrated', 'claimed', 'none'];
const DISPLACEMENTS: Displacement[] = ['none', 'incremental', 'substantial', 'unprecedented'];

function displacementOf(v: unknown): Displacement {
    const raw = String(v ?? '').toLowerCase().trim();
    return DISPLACEMENTS.find((d) => d === raw) ?? 'incremental';
}

function precedentOf(v: unknown): Precedent {
    const raw = String(v ?? '').toLowerCase().trim();
    // Unstated defaults to the strictest reading: an unclaimed precedent is not
    // evidence of novelty, and the ceiling should not reward silence.
    return PRECEDENTS.find((p) => p === raw) ?? 'demonstrated';
}

function bottleneckFitOf(v: unknown): BottleneckFit {
    const raw = String(v ?? '').toLowerCase().trim();
    return BOTTLENECK_FITS.find((fit) => fit === raw) ?? 'none';
}

function bottleneckImpactOf(v: unknown): BottleneckImpact {
    const raw = String(v ?? '').toLowerCase().trim();
    return BOTTLENECK_IMPACTS.find((impact) => impact === raw) ?? 'negligible';
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
        const paradigm = loadParadigm(paperPeriod(id, paper.published));

        // Frame, paradigm and bottlenecks, assembled once for both seats; then
        // this seat's own procedure. The frame defines the laws and this prompt
        // must never restate them.
        const system = [buildSeatContext(paperPeriod(id, paper.published)), ENGINE_SYSTEM]
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
            // On a reasoning model the thinking is billed against this ceiling,
            // so the catalogue default can be spent before a character is
            // emitted — Claude Sonnet 5 failed this way, returning no content.
            max_tokens: Math.max(meta?.maxTokens ?? 4000, 16_000),
            temperature: 0.3, // a scoring instrument, not a conversationalist
        });

        const raw = completion.choices[0]?.message?.content ?? '';
        const parsed = extractJson(raw);
        if (!parsed) {
            // Truncation looks identical to malformed output from here. Say which:
            // a reasoning model can spend the whole ceiling before emitting one.
            const stop = completion.choices[0]?.finish_reason ?? 'unknown';
            return Response.json(
                {
                    error:
                        stop === 'length'
                            ? 'Analyst ran out of output tokens before finishing its row'
                            : 'Model did not return usable JSON',
                    finishReason: stop,
                    raw: raw.slice(-400),
                },
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
        // Where that proposal already sat. Derived once: it is both part of the
        // delta and the crowdedness ceiling on I³.
        const position = layer ? positionOf(layer, proposes).position : undefined;
        const requestedBottleneckId = str(inc.bottleneckId, '');
        const namedBottleneck = paradigm
            ? bottleneckOf(paradigm, requestedBottleneckId)
            : undefined;
        // An invented or absent id is no match. Do not let a model claim a
        // direct fit against a constraint the dated snapshot did not contain.
        const bottleneckFit = namedBottleneck ? bottleneckFitOf(inc.bottleneckFit) : 'none';
        const bottleneckImpact = namedBottleneck
            ? bottleneckImpactOf(inc.impact)
            : 'negligible';
        const outcomeKind = outcome(inc.outcomeKind);
        const outcomeEstimate = str(inc.outcomeEstimate, '');

        // Importance is a property of the layer, decided once in the snapshot —
        // not a per-paper judgement. Only where no snapshot covers the paper's
        // year does the model's own claim stand.
        const paradigmImportance = layer ? layer.importance : clampScore(inv.paradigmImportance);

        // An inversion is only as large as the thing it inverts, and only as
        // large as what it actually does to it. Enforced here rather than
        // trusted to the prompt: a model that speeds up attention will
        // otherwise reach for a 7 because the paper is neat.
        // Every law is a claim from the model passed through named ceilings.
        // Recorded rather than merely applied: a 5 the model argued for and an 8
        // a ceiling cut to 5 are different findings, and only the derivation can
        // tell them apart when the reasoning needs adjusting.
        const invD = deriveScore('inversion', clampScore(inv.score), [
            {
                name: 'relation band',
                value: relation ? RELATION_BAND[relation][1] : 10,
                source: relation ? `${relation} tops out here` : 'no relation named',
            },
            {
                name: 'layer importance',
                value: paradigmImportance,
                source: layer ? `${layer.layer} is ${layer.importance}/10 load-bearing` : 'no layer matched',
            },
        ]);

        // I² is not "does this metric go up?" It is whether the paper materially
        // moves a constraint that was binding at publication.
        const unmeasuredEfficiency =
            (outcomeKind === 'Efficiency gain' || outcomeKind === 'Cost reduction')
            && (!outcomeEstimate || /^not quantified$/i.test(outcomeEstimate));
        const incD = deriveScore('incentives', clampScore(inc.score), [
            {
                name: 'bottleneck importance',
                value: namedBottleneck?.importance ?? 2,
                source: namedBottleneck
                    ? `${namedBottleneck.name} is ${namedBottleneck.importance}/10`
                    : 'no bottleneck from the snapshot was named',
            },
            {
                name: 'fit',
                value: BOTTLENECK_FIT_CEILING[bottleneckFit],
                source: `${bottleneckFit} fit to the named constraint`,
            },
            {
                name: 'materiality',
                value: BOTTLENECK_IMPACT_CEILING[bottleneckImpact],
                source: `${bottleneckImpact} movement of the constraint`,
            },
            ...(unmeasuredEfficiency
                ? [{ name: 'unmeasured gain', value: 4, source: 'an efficiency or cost claim with no figure' }]
                : []),
        ]);

        // I³ asks how far the result lands beyond what existed, not merely
        // whether the direction was crowded. Both matter: the frame's 10 needs
        // no prior demonstration AND a method that is not a variant of the
        // standard approach. Reading them as independent caps let a crowded
        // direction veto a large achievement, which is the fusion-reactor error
        // — everyone trying to build one does not make building one ordinary.
        const precedent = precedentOf(inf.precedent);
        const displacement = boundedDisplacement(displacementOf(inf.displacement), precedent);
        const infPosition = (position ?? 'absent') as DistributionPosition;
        const infD = deriveScore('inflection', clampScore(inf.score), [
            {
                name: 'position and displacement',
                value: INFLECTION_CEILING[infPosition][displacement],
                source: `${displacement} result in a direction that was ${infPosition}`,
            },
        ]);

        const inversion = invD.final;
        const incentives = incD.final;
        const inflection = infD.final;
        const incentiveCeiling = Math.min(...incD.ceilings.map((c) => c.value));
        const inflectionCeiling = Math.min(...infD.ceilings.map((c) => c.value));
        const derivation: LawDerivation[] = [invD, incD, infD];

        const usage = completion.usage as
            | { cost?: number; prompt_tokens?: number; completion_tokens?: number }
            | undefined;

        const score: EngineScore = {
            id,
            title: title ?? id,
            summary: conciseBullets(parsed.summary),
            category: category(parsed.category),
            level: str(parsed.level),
            previousParadigm: str(parsed.previousParadigm, ''),
            corePremise: str(parsed.corePremise, ''),
            inversion: {
                score: inversion,
                headline: str(inv.headline, ''),
                paradigm: str(inv.paradigm, ''),
                paradigmImportance,
                inverting: conciseBullets(inv.inverting),
                magnitude: str(inv.magnitude, 'local'),
                // Trimmed to the shorter of the two: an unpaired row has nothing
                // to sit opposite and reads as a gap in the table.
                ...pair(inv.previous, inv.proposed),
            },
            incentives: {
                score: incentives,
                headline: str(inc.headline, ''),
                outcomeKind,
                outcomeEstimate,
                bottleneck: conciseBullets(inc.bottleneck, 'None'),
                bottleneckId: namedBottleneck?.id ?? 'none',
                bottleneckName: namedBottleneck?.name ?? 'No snapshot bottleneck',
                bottleneckFit,
                impact: bottleneckImpact,
                bottleneckAsOf: paradigm?.asOf,
                ceiling: incentiveCeiling,
            },
            ...(paradigm && layer && relation
                ? {
                      delta: {
                          layer: layer.layer,
                          relation,
                          proposes,
                          position: position ?? '',
                          paradigmAsOf: paradigm.asOf,
                      },
                  }
                : {}),
            inflection: {
                score: inflection,
                headline: str(inf.headline, ''),
                unprecedented: conciseBullets(inf.unprecedented),
                precedent,
                displacement,
                ceiling: inflectionCeiling,
            },
            // Derived here, never taken from the model — the arithmetic is the
            // one part of the instrument that must not be hallucinated.
            derivation,
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
                    // Keep the complete I² measurement in the existing JSON
                    // column. Old rows stored a bare string[] and remain readable.
                    bottleneck: {
                        id: score.incentives.bottleneckId,
                        name: score.incentives.bottleneckName,
                        fit: score.incentives.bottleneckFit,
                        impact: score.incentives.impact,
                        asOf: score.incentives.bottleneckAsOf ?? null,
                        ceiling: score.incentives.ceiling,
                        bullets: score.incentives.bottleneck,
                    },
                    inflection: score.inflection.score,
                    inflectionHeadline: score.inflection.headline,
                    unprecedented: score.inflection.unprecedented,
                    precedent: score.inflection.precedent ?? null,
                    derivation: derivation as unknown as Prisma.InputJsonValue,
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
