import { NextRequest } from 'next/server';
import { hasApiKey, MISSING_KEY_MESSAGE, openrouter } from '@/lib/openrouter';
import { MODELS, DEFAULT_MODEL } from '@/lib/models';
import { buildSeatContext, MAX_PAPER_CHARS } from '@/lib/pageContext';
import { paperPeriod } from '@/lib/engine/paradigm';
import { loadParadigm } from '@/lib/engine/paradigmStore';
import { buildScore, extractJson } from '@/lib/engine/scoring';
import { buildPaperPrompt } from '@/lib/engine/prompts';
import { activePrompt, lawContexts } from '@/lib/engine/promptStore';
import { readPaper } from '@/lib/engine/data';
import { db } from '@/lib/db';
import type { Prisma } from '@/lib/generated/prisma/client';

export const maxDuration = 300;

/** Papers run from 5k to 160k tokens. Beyond this the tail is method appendices
 *  and related work, which carry none of the inversion — and a survey would
 *  otherwise cost more than the whole rest of a week combined. */

/** The row shape, defined with the scoring core it comes out of. Re-exported
 *  because every reader in the app imports it from this route. */
export type { EngineScore } from '@/lib/engine/scoring';

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

        const period = paperPeriod(id, paper.published);

        // The paradigm standing when the paper was published — never a later
        // one, which would be scoring history with hindsight.
        //
        // Every law now selects an id out of this snapshot, so there is no
        // meaningful reading without one. The old instrument tolerated a missing
        // paradigm by falling back to the model's own claims; here that would
        // leave all three laws unbounded and unanchored, which is worse than no
        // score at all. Refuse instead, and name the snapshot that is missing.
        const paradigm = loadParadigm(period);
        if (!paradigm) {
            return Response.json(
                {
                    error:
                        `No converted paradigm snapshot stands before ${period}. `
                        + 'Scoring is unavailable for this period until one is authored under '
                        + 'context/ai/paradigm/ in the baseline / pressures / existingClasses schema.',
                    period,
                },
                { status: 409 },
            );
        }

        const truncated = paper.text.length > MAX_PAPER_CHARS;
        const text = truncated ? paper.text.slice(0, MAX_PAPER_CHARS) : paper.text;

        const resolvedModel = model ?? DEFAULT_MODEL;
        const meta = MODELS.find((m) => m.id === resolvedModel);

        // Frame and the dated snapshot, assembled once for both seats; then this
        // seat's own procedure. The frame defines the laws and this prompt must
        // never restate them.
        // The seat is sent the ACTIVE prompt, and the row records which version
        // that was. `paradigmAsOf` says what the row was measured against; this
        // says how, and without it an edit makes two runs quietly incomparable.
        const prompt = await activePrompt('analyst');
        // Identity, then the dated paradigm, then the three law pages. The laws
        // are permanent and the paradigm is dated, so they are assembled rather
        // than written into one string — a change to I² is then a change to I²
        // and nothing else.
        const system = [
            buildSeatContext(period),
            '─── KYROS · THE THREE LAWS ─────────────────────────────────────────────────────',
            await lawContexts(),
            prompt.text,
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
            // On a reasoning model the thinking is billed against this ceiling,
            // so the catalogue default can be spent before a character is
            // emitted — Claude Sonnet 5 failed this way, returning no content.
            max_tokens: Math.max(meta?.maxTokens ?? 4000, 16_000),
            temperature: 0.3, // a scoring instrument, not a conversationalist
        // Cancelling in the browser has to reach OpenRouter, or stop only ends
        // the waiting and the tokens are billed anyway. When the client goes
        // away this aborts the upstream call, and the throw skips the write —
        // an interrupted reading must not be saved as a score.
        }, { signal: req.signal });

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

        const usage = completion.usage as
            | { cost?: number; prompt_tokens?: number; completion_tokens?: number }
            | undefined;

        // Everything between the model's JSON and a finished row lives in
        // lib/engine/scoring so the backtest harness scores through exactly this
        // code rather than a second copy of the ladder.
        const score = buildScore(parsed, paradigm, {
            id,
            title: title ?? id,
            model: resolvedModel,
            cost: usage?.cost ?? 0,
            promptTokens: usage?.prompt_tokens ?? 0,
            completionTokens: usage?.completion_tokens ?? 0,
            truncated,
        });
        const derivation = score.derivation ?? [];

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
                    level: score.stratum,
                    previousParadigm: score.previousParadigm,
                    corePremise: score.corePremise,

                    inversion: score.inversion.score,
                    // RETIRED with the 0-5 ladder. Null on rows scored on the
                    // eleven-rung scale, where the score is the classification.
                    inversionLevel: score.inversion.level ?? null,
                    inversionHeadline: score.inversion.headline,
                    // Column names predate the six-force schema and are kept so
                    // no migration is needed: `baselineId`, `pressureId` and
                    // `precedentId` all now hold a DIMENSION id, and the law that
                    // wrote the column says which of that dimension's three lines
                    // it was scored against.
                    baselineId: score.inversion.dimensionId,
                    // The force's own baseline, copied so a row still reads if the
                    // snapshot is ever re-authored under the same id.
                    paradigm: score.inversion.baseline,
                    inverting: score.inversion.inverting,
                    previous: score.inversion.previous,
                    proposed: score.inversion.proposed,

                    incentives: score.incentives.score,
                    // RETIRED with the 0-5 ladder. Null on rows scored on the
                    // eleven-rung scale, where the score is the classification.
                    incentivesLevel: score.incentives.level ?? null,
                    incentivesHeadline: score.incentives.headline,
                    pressureId: score.incentives.dimensionId,
                    // RETIRED with `action`. Written empty so the column stays
                    // non-null for rows that no longer have the concept.
                    incentiveAction: null,
                    outcomeKind: score.incentives.outcomeKind,
                    outcomeEstimate: score.incentives.outcomeEstimate,
                    // The complete I² measurement stays in the existing JSON
                    // column. Old rows stored a bare string[] and remain readable.
                    bottleneck: {
                        id: score.incentives.dimensionId,
                        incentive: score.incentives.incentive,
                        asOf: score.paradigmAsOf,
                        bullets: score.incentives.bottleneck,
                    },

                    inflection: score.inflection.score,
                    // RETIRED with the 0-5 ladder. Null on rows scored on the
                    // eleven-rung scale, where the score is the classification.
                    inflectionLevel: score.inflection.level ?? null,
                    inflectionHeadline: score.inflection.headline,
                    precedentId: score.inflection.dimensionId,
                    // Holds the force's INFLECTION CRITERION now, not a class name.
                    precedentName: score.inflection.criterion,
                    unprecedented: score.inflection.unprecedented,

                    paradigmTag: score.tag ?? null,
                    paradigmAsOf: score.paradigmAsOf,
                    promptVersion: prompt.version,
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
            // `critiques` is part of a StoredScore and a freshly analysed row
            // has none. Returning the field empty rather than absent keeps the
            // client's cast honest — it was omitted, cast to StoredScore anyway,
            // and every `.critiques.length` on the page then threw on the first
            // row of a live run.
            return Response.json({
                ...score,
                scoreId: row.id,
                scoredAt: row.scoredAt.toISOString(),
                critiques: [],
            });
        }

        return Response.json({ ...score, critiques: [] });
    } catch (err) {
        console.error('[api/engine/analyze]', err);
        const message = err instanceof Error ? err.message : 'Analysis failed';
        return Response.json({ error: message }, { status: 500 });
    }
}
