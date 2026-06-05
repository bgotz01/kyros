/**
 * POST /api/council
 *
 * Body: { question: string; agents: AgentName[] }
 *
 * Streams NDJSON events back to the client:
 *   { type: 'agent'; agent: AgentName; text: string }
 *   { type: 'synthesis'; text: string }
 *   { type: 'error'; agent: AgentName; message: string }
 *   { type: 'done' }
 */

import { callAgent } from '@/app/lib/llm';
import type { AgentName, PanteonSettings } from '@/app/lib/settings';
import type { PageContext } from '@/app/lib/page-context';
import { getCurrentRegime } from '@/app/lib/queries/regime';
import { getQuarterlyFinancials, getMomentumSnapshot, getStockProfile } from '@/app/lib/queries/assets';
import { getMacroContext, getBreadthContext, getMomentumContext, getPositioningContext, getTrendPressureContext } from '@/app/lib/queries/agent-context';
import { createSession, saveTurn } from '@/app/lib/queries/council-history';
import pool from '@/app/lib/db';
import fs from 'fs';
import path from 'path';

// ── Conversation history type (mirrors useCouncil.ts HistoryTurn) ─────────────

interface HistoryTurn {
    question: string;
    responses: Partial<Record<AgentName, string>>;
    synthesis?: string;
}

// ── Agent prompt loader ───────────────────────────────────────────────────────

const PROMPTS_DIR = path.join(process.cwd(), 'agent-prompts');

function loadAgentPrompt(agent: AgentName): string {
    try {
        return fs.readFileSync(path.join(PROMPTS_DIR, `${agent}.md`), 'utf-8').trim();
    } catch {
        // Fallback if file missing — should not happen in normal operation
        console.warn(`[council] Missing prompt file for agent: ${agent}`);
        return `You are ${agent}. Respond concisely and stay in character.`;
    }
}

// ── Live regime data ──────────────────────────────────────────────────────────

async function getLiveContext(): Promise<string> {
    try {
        const regime = await getCurrentRegime();
        if (!regime) return '';
        const fmt = (v: number | null, d = 2) => v != null ? `${v.toFixed(d)}%` : 'N/A';
        return `## Live Market Data
Active Regime: ${regime.regime} (since ${regime.entryDate})
Trigger: ${regime.triggerReason ?? 'N/A'}
REY: ${fmt(regime.rey)} | EYP: ${fmt(regime.eyp)} | Real 10Y: ${fmt(regime.real10Y)} | Real 3M: ${fmt(regime.real3M)} | Real M2: ${fmt(regime.realM2)}
As of: ${regime.date}

The above is the ACTUAL current regime from the database. Do not contradict it.

`;
    } catch {
        return '';
    }
}

// ── Stock data context ────────────────────────────────────────────────────────

/** Extract ticker symbols from a question — handles lower case and possessives (nvda's → NVDA) */
function extractTickers(question: string): string[] {
    // Strip possessives, then uppercase
    const upper = question.replace(/['']s\b/gi, '').toUpperCase();
    const matches = upper.match(/\b[A-Z]{2,5}\b/g) ?? [];
    // Filter out common English words that look like tickers
    const stopWords = new Set(['I', 'A', 'THE', 'IS', 'IN', 'ON', 'AT', 'TO', 'DO', 'BE', 'US', 'OR', 'AND', 'FOR', 'CAN', 'WAS', 'ARE', 'HAS', 'HAD', 'NOT', 'BUT', 'WITH', 'FROM', 'OUR', 'ANY', 'DB', 'SQL', 'API', 'YOU', 'WHAT', 'HOW', 'WHY', 'WHO', 'DID', 'ITS', 'MUCH', 'LAST', 'YEAR', 'GROW', 'REVENUE', 'STOCK', 'PRICE', 'MARKET', 'CAP', 'SECTOR', 'GROWTH', 'DATA', 'RATE', 'RATES', 'MOST', 'RECENT', 'LATEST']);
    return [...new Set(matches.filter(t => !stopWords.has(t)))].slice(0, 5);
}

async function getStockContext(question: string): Promise<string> {
    const tickers = extractTickers(question);
    if (!tickers.length) return '';

    const sections: string[] = [];

    await Promise.all(tickers.map(async (symbol) => {
        try {
            const [profile, momentum, quarterly, annual] = await Promise.all([
                getStockProfile(symbol),
                getMomentumSnapshot(symbol),
                getQuarterlyFinancials(symbol, 6),
                // Annual income statement data for revenue growth questions
                pool.query(
                    `SELECT year, revenue, "netIncome", ebitda, fcf
                     FROM income_statements
                     WHERE symbol = $1
                     ORDER BY year DESC
                     LIMIT 5`,
                    [symbol]
                ),
            ]);

            if (!profile && !momentum && !quarterly.length && !annual.rows.length) return;

            const lines: string[] = [`### ${symbol}${profile ? ` — ${profile.company}` : ''}${profile?.sector ? ` (${profile.sector})` : ''}`];

            if (momentum) {
                lines.push(`Momentum: ${momentum.dma200 != null ? `${momentum.dma200.toFixed(1)}% vs 200DMA` : 'N/A'} | RSI14: ${momentum.rsi14?.toFixed(1) ?? 'N/A'} | Days above 200MA: ${momentum.daysAbove200MA ?? 'N/A'} | vs SPY: ${momentum.ratioSPY != null ? `${(momentum.ratioSPY * 100).toFixed(1)}%` : 'N/A'}`);
            }

            // Annual revenue with YoY growth computed inline
            if (annual.rows.length) {
                lines.push('Annual revenue (most recent first):');
                annual.rows.forEach((row: any, i: number) => {
                    const rev = row.revenue != null ? `$${(row.revenue / 1e3).toFixed(1)}B` : 'N/A';
                    const ni = row.netIncome != null ? ` | NI: $${(row.netIncome / 1e3).toFixed(1)}B` : '';
                    const prev = annual.rows[i + 1];
                    const growth = (row.revenue != null && prev?.revenue != null && prev.revenue > 0)
                        ? ` (YoY: ${(((row.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1)}%)`
                        : '';
                    lines.push(`  ${row.year}: Revenue ${rev}${growth}${ni}`);
                });
            }

            if (quarterly.length) {
                lines.push('Quarterly (most recent first):');
                quarterly.forEach((q: any) => {
                    const rev = q.revenue != null ? `$${(q.revenue / 1e9).toFixed(2)}B` : 'N/A';
                    const growth = q.revenueGrowthYoY != null ? ` (YoY: ${(q.revenueGrowthYoY * 100).toFixed(1)}%)` : '';
                    const margin = q.netMargin != null ? ` | NM: ${(q.netMargin * 100).toFixed(1)}%` : '';
                    lines.push(`  ${q.quarterEnd}: ${rev}${growth}${margin}`);
                });
            }

            sections.push(lines.join('\n'));
        } catch {
            // ticker not found — skip silently
        }
    }));

    if (!sections.length) return '';

    return `## Stock Data from Database\n${sections.join('\n\n')}\n\nUse the above actual data from our database in your response. Do not say you lack access to financials.\n\n`;
}

/** Detect if the question is a screener / stock-listing request */
function isScreenerQuery(question: string): boolean {
    const q = question.toLowerCase();
    const listTerms = /\b(list|name|show|find|what|which|give me|suggest|screen)\b/;
    const stockTerms = /\b(stock|stocks|equit|name|ticker|compan)\b/;
    const filterTerms = /\b(growth|market cap|cap|revenue|momentum|sector|tech|consumer|energy|health|industrial|small.?cap|mid.?cap|large.?cap|\$\d+[bm]?\b|\d+b\b|billion|p\/e|pe|p\/s|ps)\b/;
    return (listTerms.test(q) || filterTerms.test(q)) && (stockTerms.test(q) || filterTerms.test(q));
}

/** Parse a rough market cap range in billions from a question.
 *  e.g. "greater than $10B" → { min: 10_000, max: null } (values in $M) */
function parseMarketCapFilter(question: string): { minB: number | null; maxB: number | null } {
    const q = question.toLowerCase();
    let minB: number | null = null;
    let maxB: number | null = null;

    // patterns: "> $10B", "greater than 10b", "more than $10 billion", "above 10b"
    const minMatch = q.match(/(?:greater\s+than|more\s+than|above|over|>\s*)\$?\s*(\d+(?:\.\d+)?)\s*b(?:illion)?/);
    if (minMatch) minB = parseFloat(minMatch[1]);

    // patterns: "< $100B", "less than 100b", "smaller than $100 billion", "below 100b"
    const maxMatch = q.match(/(?:less\s+than|smaller\s+than|below|under|<\s*)\$?\s*(\d+(?:\.\d+)?)\s*b(?:illion)?/);
    if (maxMatch) maxB = parseFloat(maxMatch[1]);

    // "between $10B and $100B"
    const betweenMatch = q.match(/between\s+\$?\s*(\d+(?:\.\d+)?)\s*b(?:illion)?\s+and\s+\$?\s*(\d+(?:\.\d+)?)\s*b(?:illion)?/);
    if (betweenMatch) {
        minB = parseFloat(betweenMatch[1]);
        maxB = parseFloat(betweenMatch[2]);
    }

    return { minB, maxB };
}

/** Build screener context from DB when the question looks like a stock-listing request */
async function getScreenerContext(question: string): Promise<string> {
    if (!isScreenerQuery(question)) return '';

    try {
        const { minB, maxB } = parseMarketCapFilter(question);
        const q = question.toLowerCase();

        // Revenue growth filter: "growth stocks" → RevGrowth2025 > 10%
        const wantsGrowth = /\b(growth|high.?growth|fast.?growing|momentum)\b/.test(q);

        // Sector filter
        let sectorFilter: string | null = null;
        if (/\btech(nology)?\b/.test(q)) sectorFilter = 'Technology';
        else if (/\bconsumer\b/.test(q)) sectorFilter = 'Consumer';
        else if (/\benergy\b/.test(q)) sectorFilter = 'Energy';
        else if (/\bhealth(care)?\b/.test(q)) sectorFilter = 'Health';
        else if (/\bfinancial\b/.test(q)) sectorFilter = 'Financial';
        else if (/\bindustrial\b/.test(q)) sectorFilter = 'Industrial';

        // Build query with parameterized filters
        const conditions: string[] = ['sn.mktcap IS NOT NULL'];
        const params: (number | string)[] = [];
        let pi = 1;

        if (minB != null) {
            // mktcap stored in raw dollars in mv_latest_snapshot
            conditions.push(`sn."marketCap" >= $${pi++}`);
            params.push(minB * 1e9);
        }
        if (maxB != null) {
            conditions.push(`sn."marketCap" <= $${pi++}`);
            params.push(maxB * 1e9);
        }
        if (wantsGrowth) {
            conditions.push(`CASE WHEN inc.rev2024 > 0 THEN (inc.rev2025 - inc.rev2024) / inc.rev2024 END > 0.08`);
        }
        if (sectorFilter) {
            conditions.push(`sp.sector ILIKE $${pi++}`);
            params.push(`%${sectorFilter}%`);
        }

        const where = conditions.join(' AND ');

        const { rows } = await pool.query(`
            WITH
            snap AS (
                SELECT symbol, "marketCap"::float AS mktcap
                FROM mv_latest_snapshot
            ),
            pd AS (
                SELECT symbol, dma_200::float AS dma200, rsi14::float AS rsi14
                FROM mv_latest_divergence
            ),
            inc AS (
                SELECT symbol,
                    MAX(CASE WHEN year = 2025 THEN revenue::float END) AS rev2025,
                    MAX(CASE WHEN year = 2024 THEN revenue::float END) AS rev2024,
                    MAX(CASE WHEN year = 2023 THEN revenue::float END) AS rev2023
                FROM income_statements
                GROUP BY symbol
            )
            SELECT
                sp.symbol,
                sp.company,
                sp.sector,
                sp.industry,
                ROUND((sn.mktcap / 1e9)::numeric, 1) AS mktcap_b,
                pd.dma200,
                pd.rsi14,
                inc.rev2025,
                inc.rev2024,
                CASE WHEN inc.rev2024 > 0 THEN ROUND(((inc.rev2025 - inc.rev2024) / inc.rev2024 * 100)::numeric, 1) END AS rev_growth_pct
            FROM "StockProfile" sp
            JOIN snap sn ON sn.symbol = sp.symbol
            LEFT JOIN pd  ON pd.symbol  = sp.symbol
            LEFT JOIN inc ON inc.symbol = sp.symbol
            WHERE ${where}
            ORDER BY
                ${wantsGrowth ? 'CASE WHEN inc.rev2024 > 0 THEN (inc.rev2025 - inc.rev2024) / inc.rev2024 END DESC NULLS LAST,' : ''}
                sn.mktcap DESC
            LIMIT 20
        `, params);

        if (!rows.length) return '';

        const lines = rows.map((r: {
            symbol: string;
            company: string | null;
            sector: string | null;
            mktcap_b: number | null;
            dma200: number | null;
            rsi14: number | null;
            rev_growth_pct: number | null;
        }) => {
            const cap = r.mktcap_b != null ? `$${r.mktcap_b}B` : '—';
            const growth = r.rev_growth_pct != null ? `RevGrowth: ${r.rev_growth_pct > 0 ? '+' : ''}${r.rev_growth_pct}%` : '';
            const mom = r.dma200 != null ? `vs200MA: ${r.dma200 > 0 ? '+' : ''}${r.dma200.toFixed(1)}%` : '';
            return `${r.symbol} (${r.company ?? '—'}) | ${r.sector ?? '—'} | Cap: ${cap} | ${growth} | ${mom}`;
        });

        const filterDesc = [
            minB != null ? `MarketCap > $${minB}B` : '',
            maxB != null ? `MarketCap < $${maxB}B` : '',
            wantsGrowth ? 'RevGrowth > 8%' : '',
            sectorFilter ? `Sector: ${sectorFilter}` : '',
        ].filter(Boolean).join(', ') || 'all sectors';

        return `## Screener Results from Database (${filterDesc})\n${lines.join('\n')}\n\nThese are REAL stocks from our database matching the query. Reference specific symbols and data points in your response.\n\n`;
    } catch (err) {
        console.error('getScreenerContext error:', err);
        return '';
    }
}

// Agent prompts are loaded from agent-prompts/<agent>.md at request time.
// Edit those files directly to change agent behavior — no code changes needed.

/** Addendum appended to Sigma's prompt when the question is a screener/listing request */
const SIGMA_SCREENER_ADDENDUM = `
## Screener Response Format
Screener data has been provided above. You MUST reference specific symbols from it.
Structure your response as:
1. One sentence of momentum/structural framing
2. A list of the top names from the data — SYMBOL — Company — one-line rationale citing the actual numbers
3. One sentence closing verdict

Only reference symbols that appear in the "Screener Results from Database" section. Do not invent tickers.`;

/** Addendum appended to Athena's prompt when screener data is present */
const ATHENA_SCREENER_ADDENDUM = `
## Screener Synthesis Instructions
Screener data was provided. In your synthesis: identify the 2–3 highest-conviction names across momentum and fundamentals, acknowledge any regime-level risk raised by Atlas or Achilles, and close with a clear positioning verdict.`;

/** Remove the assistant prefill prefix if the model echoes it back */
function stripPrefill(text: string): string {
    return text.replace(/^\[Speaking as[^\]]*\]\s*/i, '').trim();
}

/** Send a JSON event to a ReadableStream controller */
function send(controller: ReadableStreamDefaultController, event: Record<string, unknown>) {
    const encoder = new TextEncoder();
    controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
}

export async function POST(request: Request) {
    const body = await request.json() as { question: string; agents: AgentName[]; settings: PanteonSettings; pageContext?: PageContext; sessionId?: string; history?: HistoryTurn[] };
    const { question, agents, settings, pageContext, history = [] } = body;
    let { sessionId } = body;

    if (!question?.trim() || !agents?.length) {
        return Response.json({ error: 'Missing question or agents' }, { status: 400 });
    }

    // Create a new session if this is the first turn, otherwise reuse the existing one
    if (!sessionId) {
        try {
            sessionId = await createSession(question);
            console.log('[council] Created session:', sessionId);
        } catch (err) {
            console.error('[council] Failed to create session:', err);
        }
    }

    // Build conversation history messages for agents (last 6 turns)
    const historyMessages: { role: 'user' | 'assistant'; content: string }[] = [];
    for (const turn of history.slice(-6)) {
        historyMessages.push({ role: 'user', content: turn.question });
        // Summarise all agent responses as the assistant turn
        const responseSummary = Object.entries(turn.responses)
            .map(([agent, text]) => `[${agent.toUpperCase()}]: ${text}`)
            .join('\n\n');
        const assistantContent = turn.synthesis
            ? `${responseSummary}\n\n[SYNTHESIS]: ${turn.synthesis}`
            : responseSummary;
        historyMessages.push({ role: 'assistant', content: assistantContent });
    }

    // Determine which field agents to run (everyone except Athena)
    const fieldAgents = agents.filter((a) => a !== 'athena') as AgentName[];
    const includeAthena = agents.includes('athena') || agents.includes('all' as AgentName);

    // Fetch live data — shared + per-agent specialized context, all in parallel
    const isScreener = isScreenerQuery(question);
    const [
        liveContext, stockContext, screenerContext,
        atlasCtx, janusCtx, sigmaCtx, achillesCtx, trendPressureCtx,
    ] = await Promise.all([
        getLiveContext(),
        getStockContext(question),
        isScreener ? getScreenerContext(question) : Promise.resolve(''),
        getMacroContext(),
        getBreadthContext(),
        getMomentumContext(),
        getPositioningContext(),
        getTrendPressureContext(),
    ]);

    // Shared context every agent receives (regime + any ticker/screener data from the question)
    const sharedContext = liveContext + stockContext + screenerContext;

    // Per-agent specialized context map
    const agentContext: Record<AgentName, string> = {
        atlas: atlasCtx,
        janus: janusCtx + trendPressureCtx,
        sigma: sigmaCtx,
        achilles: achillesCtx,
        athena: atlasCtx + janusCtx + trendPressureCtx + sigmaCtx + achillesCtx, // Athena sees everything
    };

    const stream = new ReadableStream({
        async start(controller) {
            const agentResponses: { agent: AgentName; text: string }[] = [];

            // Run field agents in parallel
            const tasks = fieldAgents.map(async (agent) => {
                try {
                    const pageContextLine = pageContext
                        ? `## Page Context\nThe user is on the ${pageContext.pageLabel} page. ${pageContext.description}\n\n`
                        : '';
                    // Use screener addendum for Sigma when listing stocks
                    const basePrompt = loadAgentPrompt(agent);
                    const systemPrompt = (agent === 'sigma' && screenerContext)
                        ? basePrompt + SIGMA_SCREENER_ADDENDUM
                        : basePrompt;
                    const result = await callAgent(agent, [
                        { role: 'system', content: sharedContext + agentContext[agent] + pageContextLine + systemPrompt },
                        ...historyMessages,
                        { role: 'user', content: question },
                        { role: 'assistant', content: `[Speaking as ${agent.charAt(0).toUpperCase() + agent.slice(1)}, reasoning from my framework:]` },
                    ], settings);
                    const text = stripPrefill(result.text);
                    agentResponses.push({ agent, text });
                    send(controller, { type: 'agent', agent, text });
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    send(controller, { type: 'error', agent, message });
                }
            });

            await Promise.all(tasks);

            // Athena synthesizes last
            const athenaBase = loadAgentPrompt('athena');
            const athenaPrompt = screenerContext
                ? athenaBase + ATHENA_SCREENER_ADDENDUM
                : athenaBase;

            if (includeAthena && agentResponses.length > 0) {
                const councilSummary = agentResponses
                    .map(({ agent, text }) => `${agent.toUpperCase()}: ${text}`)
                    .join('\n\n');

                let synthesisText: string | undefined;
                try {
                    const synthesis = await callAgent('athena', [
                        { role: 'system', content: sharedContext + agentContext['athena'] + athenaPrompt },
                        ...historyMessages,
                        {
                            role: 'user',
                            content: `Question posed to the council: "${question}"\n\nCouncil assessments:\n\n${councilSummary}\n\nProvide your synthesis.`,
                        },
                        { role: 'assistant', content: '[Speaking as Athena, synthesizing the council:]' },
                    ], settings);
                    synthesisText = stripPrefill(synthesis.text);
                    send(controller, { type: 'synthesis', text: synthesisText });
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    send(controller, { type: 'error', agent: 'athena', message });
                }

                // Persist the turn — always, regardless of whether Athena succeeded
                if (sessionId) {
                    const responses = Object.fromEntries(agentResponses.map(r => [r.agent, r.text]));
                    saveTurn({ sessionId, question, agents: fieldAgents, responses, synthesis: synthesisText })
                        .catch(err => console.error('[council] saveTurn failed:', err));
                }
            } else if (includeAthena && agentResponses.length === 0) {
                // Athena alone — direct response
                let text = '';
                try {
                    const result = await callAgent('athena', [
                        { role: 'system', content: sharedContext + agentContext['athena'] + athenaPrompt },
                        ...historyMessages,
                        { role: 'user', content: question },
                        { role: 'assistant', content: '[Speaking as Athena, reasoning from my framework:]' },
                    ], settings);
                    text = stripPrefill(result.text);
                    send(controller, { type: 'agent', agent: 'athena', text });
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    send(controller, { type: 'error', agent: 'athena', message });
                }

                if (sessionId && text) {
                    saveTurn({ sessionId, question, agents: ['athena'], responses: { athena: text } })
                        .catch(err => console.error('[council] saveTurn failed:', err));
                }
            } else {
                // No Athena — persist field agent responses directly
                if (sessionId && agentResponses.length > 0) {
                    const responses = Object.fromEntries(agentResponses.map(r => [r.agent, r.text]));
                    saveTurn({ sessionId, question, agents: fieldAgents, responses })
                        .catch(err => console.error('[council] saveTurn failed:', err));
                }
            }

            send(controller, { type: 'done', sessionId: sessionId ?? null });
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
