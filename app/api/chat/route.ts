import { NextRequest } from 'next/server';
import { hasApiKey, MISSING_KEY_MESSAGE, openrouter } from '@/lib/openrouter';
import { MODELS, DEFAULT_MODEL } from '@/lib/models';
import { buildContextBlock, refsByIds } from '@/lib/pageContext';
import { CHAT_DEFAULT_SYSTEM } from '@/lib/prompts/council';

const DEFAULT_MAX_TOKENS = 4000;

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

/** OpenRouter's usage object. `cost` is its own extension — it is not part of
 *  the OpenAI schema the SDK types describe, hence the local shape. */
interface OpenRouterUsage {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    cost?: number;
}

export async function POST(req: NextRequest) {
    try {
        if (!hasApiKey()) {
            return Response.json({ error: MISSING_KEY_MESSAGE }, { status: 500 });
        }

        const { messages, model, systemPrompt, temperature, refIds } = (await req.json()) as {
            messages?: ChatMessage[];
            model?: string;
            systemPrompt?: string;
            temperature?: number;
            refIds?: string[];
        };

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return Response.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const resolvedModel = model ?? DEFAULT_MODEL;
        const modelMeta = MODELS.find((m) => m.id === resolvedModel);
        let resolvedPrompt =
            typeof systemPrompt === 'string' && systemPrompt.trim()
                ? systemPrompt.trim()
                : CHAT_DEFAULT_SYSTEM;

        // The client sends ids; the content is resolved here so the corpus never
        // has to travel to the browser and back.
        if (Array.isArray(refIds) && refIds.length > 0) {
            const refs = refsByIds(refIds);
            if (refs.length > 0) resolvedPrompt = `${resolvedPrompt}\n\n${buildContextBlock(refs)}`;
        }

        const stream = await openrouter().chat.completions.create({
            model: resolvedModel,
            messages: [{ role: 'system', content: resolvedPrompt }, ...messages],
            max_tokens: modelMeta?.maxTokens ?? DEFAULT_MAX_TOKENS,
            temperature: typeof temperature === 'number' ? temperature : 0.7,
            stream: true,
        });

        // Pipe OpenRouter's stream to the client as SSE.
        const readable = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                const send = (payload: unknown) =>
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
                try {
                    for await (const chunk of stream) {
                        const delta = chunk.choices[0]?.delta?.content;
                        if (delta) send({ delta });

                        // OpenRouter always attaches usage to the final chunk —
                        // no request parameter needed. `cost` is what it actually
                        // charged, which is truer than any local price table.
                        const usage = chunk.usage as OpenRouterUsage | null | undefined;
                        if (usage) {
                            send({
                                usage: {
                                    promptTokens: usage.prompt_tokens ?? 0,
                                    completionTokens: usage.completion_tokens ?? 0,
                                    totalTokens:
                                        usage.total_tokens ??
                                        (usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0),
                                    cost: usage.cost ?? 0,
                                    model: resolvedModel,
                                },
                            });
                        }
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                Connection: 'keep-alive',
            },
        });
    } catch (err) {
        console.error('[api/chat]', err);
        const message = err instanceof Error ? err.message : 'Internal server error';
        return Response.json({ error: message }, { status: 500 });
    }
}
