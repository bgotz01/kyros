import { NextRequest } from 'next/server';
import { hasApiKey, MISSING_KEY_MESSAGE, openrouter } from '@/lib/openrouter';
import { MODELS, DEFAULT_MODEL } from '@/lib/models';
import { buildSeatContext, MAX_PAPER_CHARS } from '@/lib/pageContext';
import { paperPeriod } from '@/lib/paradigm';
import { CRITIC_SYSTEM, buildCritiquePrompt, buildPaperPrompt } from '@/lib/prompts/engine';
import { readPaper } from '@/lib/engineData';
import { db } from '@/lib/db';
import type { EngineScore } from '../analyze/route';

export const maxDuration = 300;


export type CriticSection = 'summary' | 'inversion' | 'incentives' | 'inflection';

export interface CriticNote {
    /** Database id — null until the note has been stored. */
    noteId?: string;
    section: CriticSection;
    agrees: boolean;
    reasoning: string[];
    /** Present only on a disagreement over one of the three laws. */
    proposedScore?: number;
    proposedBullets?: string[];
    /** The analyst's decision. Null while the flag is open. */
    resolution?: 'applied' | 'dismissed' | null;
}

export interface Critique {
    id: string;
    notes: CriticNote[];
    model: string;
    cost: number;
    promptTokens: number;
    completionTokens: number;
}

const SECTIONS: CriticSection[] = ['summary', 'inversion', 'incentives', 'inflection'];

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

function bullets(v: unknown): string[] {
    if (Array.isArray(v)) {
        return v.map((x) => String(x).replace(/^\s*[-•●*]\s*/, '').trim()).filter(Boolean);
    }
    if (typeof v === 'string' && v.trim()) {
        return v.split(/\n+|(?:^|\s)[-•●]\s+/).map((x) => x.trim()).filter(Boolean);
    }
    return [];
}

export async function POST(req: NextRequest) {
    try {
        if (!hasApiKey()) {
            return Response.json({ error: MISSING_KEY_MESSAGE }, { status: 500 });
        }

        const { id, title, model, score, scoreId } = (await req.json()) as {
            id?: string;
            title?: string;
            model?: string;
            score?: EngineScore;
            scoreId?: string;
        };
        if (!id || !/^\d{4}\.\d{4,5}$/.test(id) || !score) {
            return Response.json({ error: 'Invalid request' }, { status: 400 });
        }

        const paper = readPaper(id);
        if (!paper) return Response.json({ error: `No text for ${id}` }, { status: 404 });

        const text = paper.text.slice(0, MAX_PAPER_CHARS);
        const resolvedModel = model ?? DEFAULT_MODEL;
        const meta = MODELS.find((m) => m.id === resolvedModel);

        // The critic reads exactly what the analyst read — the same frame, the
        // same dated paradigm, the same constraint surface. A critic working
        // from different definitions produces noise, not scrutiny; one judging
        // I¹ from its own memory of the prevailing paradigm is doing the very
        // thing its first rule forbids.
        const system = [buildSeatContext(paperPeriod(id, paper.published)), CRITIC_SYSTEM]
            .filter(Boolean)
            .join('\n\n');

        const completion = await openrouter().chat.completions.create({
            model: resolvedModel,
            messages: [
                { role: 'system', content: system },
                {
                    role: 'user',
                    content: `${buildPaperPrompt({
                        id,
                        title: title ?? id,
                        published: paper.published,
                        text,
                    })}\n\n${buildCritiquePrompt({
                        summary: score.summary,
                        level: score.level,
                        inversion: score.inversion,
                        incentives: score.incentives,
                        inflection: score.inflection,
                        verdict: score.verdict,
                        // Which layer was named, what relation was assigned and
                        // what the paper was said to offer instead. Without it
                        // the critic cannot tell whether an I¹ was capped by the
                        // relation or arrived at freely.
                        delta: score.delta,
                    })}`,
                },
            ],
            // The critic writes four notes, each with reasoning and replacement
            // bullets — the largest output of any seat. On a reasoning model the
            // thinking is billed against the same ceiling, and at the catalogue
            // default it exhausted the budget before emitting a character.
            max_tokens: Math.max(meta?.maxTokens ?? 4000, 16_000),
            temperature: 0.3,
        });

        const reply = completion.choices[0]?.message?.content ?? '';
        const parsed = extractJson(reply);
        if (!parsed) {
            // A truncated answer looks identical to a malformed one from here, so
            // say which: the critic emits four notes and can run out of room.
            const stop = completion.choices[0]?.finish_reason ?? 'unknown';
            console.error('[critique] unusable JSON · finish_reason', stop, '· chars', reply.length);
            return Response.json(
                {
                    error:
                        stop === 'length'
                            ? 'Critic ran out of output tokens before finishing its notes'
                            : 'Critic did not return usable JSON',
                    finishReason: stop,
                    raw: reply.slice(-400),
                },
                { status: 502 },
            );
        }

        const raw = Array.isArray(parsed.notes) ? parsed.notes : [];
        const notes: CriticNote[] = SECTIONS.map((section) => {
            const found = raw.find(
                (n): n is Record<string, unknown> =>
                    Boolean(n) && typeof n === 'object' && (n as Record<string, unknown>).section === section,
            );
            if (!found) return { section, agrees: true, reasoning: [] };

            const reasoning = bullets(found.reasoning);
            const proposed = Number(found.proposedScore);
            // Replacement content has the same compact two-bullet contract as
            // the analyst row. The critic's reasoning may remain longer.
            const proposedBullets = bullets(found.proposedBullets).slice(0, 2);

            // An objection with nothing concrete behind it is recorded as
            // agreement — the prompt asks for a correction, and a flag the
            // analyst cannot act on is worse than no flag.
            const actionable =
                reasoning.length > 0 &&
                (Number.isFinite(proposed) || proposedBullets.length > 0 || section === 'summary');

            const agrees = found.agrees === false && actionable ? false : true;

            // A proposal only means something on an objection. Models routinely
            // emit a score on a note they agree with; carrying it would put an
            // applicable correction behind a flag that never opens.
            if (agrees) return { section, agrees, reasoning };

            return {
                section,
                agrees,
                reasoning,
                ...(Number.isFinite(proposed) && section !== 'summary'
                    ? { proposedScore: Math.min(10, Math.max(0, Math.round(proposed))) }
                    : {}),
                ...(proposedBullets.length ? { proposedBullets } : {}),
            };
        });

        const usage = completion.usage as
            | { cost?: number; prompt_tokens?: number; completion_tokens?: number }
            | undefined;
        const critique: Critique = {
            id,
            notes,
            model: resolvedModel,
            cost: usage?.cost ?? 0,
            promptTokens: usage?.prompt_tokens ?? 0,
            completionTokens: usage?.completion_tokens ?? 0,
        };

        if (scoreId) {
            // A score may be challenged as often as you like — by a different
            // seat, or by the same one again. The critique is one-per-score, so
            // a re-run replaces the last one rather than accumulating; the
            // resolutions recorded against the old notes go with it, because a
            // decision about a note a different model never made is meaningless.
            await db.engineCritique.deleteMany({ where: { scoreId } });

            const row = await db.engineCritique.create({
                data: {
                    scoreId,
                    model: resolvedModel,
                    cost: critique.cost,
                    promptTokens: critique.promptTokens,
                    completionTokens: critique.completionTokens,
                    notes: {
                        create: notes.map((n) => ({
                            section: n.section,
                            agrees: n.agrees,
                            reasoning: n.reasoning,
                            proposedScore: n.proposedScore ?? null,
                            proposedBullets: n.proposedBullets ?? undefined,
                        })),
                    },
                },
                include: { notes: true },
            });
            // Hand back the database ids so a flag can be resolved without a reload.
            critique.notes = notes.map((n) => ({
                ...n,
                noteId: row.notes.find((r) => r.section === n.section)?.id,
                resolution: null,
            }));
        }

        return Response.json(critique);
    } catch (err) {
        console.error('[api/engine/critique]', err);
        const message = err instanceof Error ? err.message : 'Critique failed';
        return Response.json({ error: message }, { status: 500 });
    }
}
