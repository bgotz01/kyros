/**
 * POST /api/athena
 *
 * Single-agent chat endpoint. Replaces the multi-agent /api/council for
 * the main AthenaChat interface.
 *
 * Body: {
 *   question: string
 *   history?: { role: 'user' | 'assistant'; content: string }[]
 *   sessionId?: string
 *   settings: PanteonSettings
 *   pageContext?: PageContext
 * }
 *
 * Returns NDJSON:
 *   { type: 'text'; chunk: string }   — not used yet (non-streaming)
 *   { type: 'done'; text: string; sessionId: string }
 *   { type: 'error'; message: string }
 */

import { callAgent } from '@/app/lib/llm';
import type { PanteonSettings } from '@/app/lib/settings';
import type { PageContext } from '@/app/lib/page-context';
import { getMacroContext, getBreadthContext, getMomentumContext, getPositioningContext, getRegimeReturnsContext } from '@/app/lib/queries/agent-context';
import { createSession, saveTurn } from '@/app/lib/queries/council-history';
import { retrieveMemories, formatMemoriesForContext } from '@/app/lib/queries/agent-memory';
import fs from 'fs';
import path from 'path';

// ── Load prompt ───────────────────────────────────────────────────────────────

function loadPrompt(): string {
    try {
        return fs.readFileSync(
            path.join(process.cwd(), 'agent-prompts', 'athena-main.md'),
            'utf-8'
        ).trim();
    } catch {
        return 'You are Athena, a market intelligence agent. Be direct and concise.';
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function send(controller: ReadableStreamDefaultController, event: Record<string, unknown>) {
    const encoder = new TextEncoder();
    controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
}

// ── Route ─────────────────────────────────────────────────────────────────────

export interface HistoryMessage {
    role: 'user' | 'assistant';
    content: string;
}

export async function POST(request: Request) {
    const body = await request.json() as {
        question: string;
        history?: HistoryMessage[];
        sessionId?: string;
        settings: PanteonSettings;
        pageContext?: PageContext;
    };

    const { question, history = [], settings, pageContext } = body;
    let { sessionId } = body;

    if (!question?.trim()) {
        return Response.json({ error: 'Missing question' }, { status: 400 });
    }

    // Create session on first turn
    if (!sessionId) {
        try {
            sessionId = await createSession(question);
        } catch (err) {
            console.error('[athena] Failed to create session:', err);
        }
    }

    // ── Layered context fetching ──────────────────────────────────────────────
    // Layer 1: page primary layers — always loaded (data on screen right now)
    // Layer 2: question-triggered layers — loaded when question asks for them
    // Layer 3: memory — always loaded (fast)

    const pagePrimary = new Set<string>(pageContext?.primaryLayers ?? ['macro']);
    const pageSecondary = new Set<string>(pageContext?.secondaryLayers ?? []);

    const q = question.toLowerCase();

    // Detect what the question is asking for
    const asksForMacro = /regime|macro|yield|rate|vix|fed|inflation|liquidity|eyp|rey/i.test(q);
    const asksForBreadth = /breadth|above.*dma|below.*dma|advance|decline|transition|market.*width/i.test(q);
    const asksForMomentum = /stock|sector|momentum|rsi|screener|equity|dma|200ma|leader|nasdaq|sp500|s&p/i.test(q);
    const asksForPositioning = /cftc|positioning|insider|cot|futures|crowding|fragility/i.test(q);
    const asksForReturns = /return|perform|forward|historical.*regime|how.*did.*regime/i.test(q)
        || pageContext?.pageLabel?.toLowerCase().includes('return');

    // A layer loads if: it's a page primary, OR question asks for it AND it's a page secondary
    const shouldLoad = (layer: string) =>
        pagePrimary.has(layer) ||
        (pageSecondary.has(layer) && (
            (layer === 'macro' && asksForMacro) ||
            (layer === 'breadth' && asksForBreadth) ||
            (layer === 'momentum' && asksForMomentum) ||
            (layer === 'positioning' && asksForPositioning) ||
            (layer === 'returns' && asksForReturns)
        ));

    // If question asks for a layer not in primary or secondary, still load it
    const loadMacro = shouldLoad('macro') || (!pagePrimary.size && asksForMacro);
    const loadBreadth = shouldLoad('breadth') || asksForBreadth;
    const loadMomentum = shouldLoad('momentum') || asksForMomentum;
    const loadPositioning = shouldLoad('positioning') || asksForPositioning;
    const loadReturns = asksForReturns;

    const [macroCtx, breadthCtx, momentumCtx, positioningCtx, memories, returnsCtx] = await Promise.all([
        loadMacro ? getMacroContext() : Promise.resolve(''),
        loadBreadth ? getBreadthContext() : Promise.resolve(''),
        loadMomentum ? getMomentumContext() : Promise.resolve(''),
        loadPositioning ? getPositioningContext() : Promise.resolve(''),
        retrieveMemories(question, 5),
        loadReturns ? getRegimeReturnsContext() : Promise.resolve(''),
    ]);

    const liveContext = macroCtx + breadthCtx + momentumCtx + positioningCtx + returnsCtx;
    const memoryContext = formatMemoriesForContext(memories);

    const pageContextLine = pageContext
        ? `## Current Page\nThe user is viewing the ${pageContext.pageLabel} page. ${pageContext.description}\n\n`
        : '';

    const systemPrompt = loadPrompt();
    const fullSystem = memoryContext + liveContext + pageContextLine + systemPrompt;

    // Build messages array with conversation history
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: fullSystem },
        ...history.slice(-10), // last 10 turns of history
        { role: 'user', content: question },
    ];

    const stream = new ReadableStream({
        async start(controller) {
            try {
                const result = await callAgent('athena', messages, settings);
                const text = result.text.replace(/^\[Speaking as[^\]]*\]\s*/i, '').trim();

                send(controller, { type: 'done', text, sessionId: sessionId ?? null });

                // Persist turn async
                if (sessionId) {
                    saveTurn({
                        sessionId,
                        question,
                        agents: ['athena'],
                        responses: { athena: text },
                    }).catch(err => console.error('[athena] saveTurn failed:', err));
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                send(controller, { type: 'error', message });
            }

            controller.close();
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'application/x-ndjson',
            'Cache-Control': 'no-cache',
        },
    });
}
