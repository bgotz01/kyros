/**
 * POST /api/athena/save
 *
 * Triggered by the "Save to Chamber" button. Takes the current conversation,
 * asks the LLM to produce a concise summary of conclusions reached,
 * then saves it to agent_memory as type='summary'.
 *
 * Body: {
 *   turns: { question: string; response: string }[]
 *   sessionId?: string
 *   settings: PanteonSettings
 * }
 */

import { callAgent } from '@/app/lib/llm';
import type { PanteonSettings } from '@/app/lib/settings';
import { saveMemory } from '@/app/lib/queries/agent-memory';

export async function POST(request: Request) {
    const body = await request.json() as {
        turns: { question: string; response: string }[];
        sessionId?: string;
        settings: PanteonSettings;
    };

    const { turns, sessionId, settings } = body;

    if (!turns?.length) {
        return Response.json({ error: 'No turns to summarize' }, { status: 400 });
    }

    // Build a transcript for the LLM to summarize
    const transcript = turns.map(t =>
        `User: ${t.question}\nAthena: ${t.response}`
    ).join('\n\n---\n\n');

    const summaryPrompt = `You are summarizing a market research conversation for long-term memory storage.

Extract:
1. The key conclusions or insights reached (2-4 bullet points max)
2. Any explicit user preferences revealed (investing style, focus areas, what they care about)
3. Any specific assets, regimes, or themes that were the focus

Format your response as:

CONCLUSIONS:
- [conclusion 1]
- [conclusion 2]

PREFERENCES (if any):
- [preference 1]

TAGS: comma-separated list of relevant tickers/themes (e.g. NVDA, macro, overvaluation, momentum)

Be concise. Only include what's genuinely useful to remember for future conversations.`;

    try {
        const result = await callAgent('athena', [
            { role: 'system', content: summaryPrompt },
            { role: 'user', content: `Conversation to summarize:\n\n${transcript}` },
        ], settings);

        const raw = result.text.trim();

        // Parse tags from the response
        const tagsMatch = raw.match(/TAGS:\s*(.+)/i);
        const tags = tagsMatch
            ? tagsMatch[1].split(',').map(t => t.trim().toUpperCase()).filter(Boolean)
            : [];

        // Extract conclusions section
        const conclusionsMatch = raw.match(/CONCLUSIONS:\s*([\s\S]*?)(?:PREFERENCES:|TAGS:|$)/i);
        const conclusions = conclusionsMatch ? conclusionsMatch[1].trim() : raw;

        // Extract preferences if any
        const preferencesMatch = raw.match(/PREFERENCES.*?:\s*([\s\S]*?)(?:TAGS:|$)/i);
        const preferences = preferencesMatch ? preferencesMatch[1].trim() : '';

        // Save conclusions as a summary
        const summaryId = await saveMemory({
            type: 'summary',
            content: conclusions,
            sessionId,
            tags,
        });

        // Save preferences separately so they're always retrieved
        if (preferences && preferences.toLowerCase() !== 'none' && preferences !== '-') {
            const prefLines = preferences.split('\n').filter(l => l.trim().startsWith('-'));
            for (const line of prefLines) {
                const content = line.replace(/^-\s*/, '').trim();
                if (content) {
                    await saveMemory({ type: 'preference', content, sessionId, tags });
                }
            }
        }

        return Response.json({ ok: true, id: summaryId, tags });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[athena/save] Failed:', err);
        return Response.json({ error: message }, { status: 500 });
    }
}
