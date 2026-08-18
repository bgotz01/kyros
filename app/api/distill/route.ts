import { NextRequest } from 'next/server';
import { hasApiKey, MISSING_KEY_MESSAGE, openrouter } from '@/lib/openrouter';
import { MODELS, DEFAULT_MODEL } from '@/lib/models';
import type { DistilledMemory } from '@/app/components/council/types';

const DISTILL_SYSTEM = `You are a memory distillation engine for Kyros, an AI intelligence platform.

You will be given a transcript of a council session — a conversation between an analyst and a set of analytical agents. Your task is to extract persistent, useful information about the analyst: what they care about, how they like to think, what they've found valuable or dismissed.

Return ONLY a valid JSON object with these five keys. Each value is an array of short, precise strings. Be selective — only include what is genuinely signal. An empty array is correct when nothing fits a category.

{
  "themes": [],        // recurring topics, domains, entities or questions the analyst focuses on
  "preferences": [],   // stated preferences about depth, style, models, framing or analytical approach
  "good_ideas": [],    // specific ideas, framings or angles that emerged and are worth developing further
  "dismissed": [],     // angles, hypotheses or framings the analyst explicitly set aside or found unproductive
  "questions": []      // standing open questions the analyst is sitting with and has not resolved
}

Rules:
- Write each item as a complete, self-contained sentence or phrase — something that makes sense when read without the transcript.
- Be concise. One to two sentences per item maximum.
- Do not invent things not present in the transcript.
- Do not include meta-commentary about the conversation itself.
- Return only the JSON object. No preamble, no explanation, no markdown fences.`;

export async function POST(req: NextRequest) {
    try {
        if (!hasApiKey()) {
            return Response.json({ error: MISSING_KEY_MESSAGE }, { status: 500 });
        }

        const { transcript, model } = (await req.json()) as {
            transcript?: string;
            model?: string;
        };

        if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
            return Response.json({ error: 'No transcript provided.' }, { status: 400 });
        }

        const resolvedModel = typeof model === 'string' && model.trim() ? model.trim() : DEFAULT_MODEL;
        const modelMeta = MODELS.find((m) => m.id === resolvedModel);

        const completion = await openrouter().chat.completions.create({
            model: resolvedModel,
            messages: [
                { role: 'system', content: DISTILL_SYSTEM },
                {
                    role: 'user',
                    content: `Here is the session transcript:\n\n${transcript}`,
                },
            ],
            max_tokens: modelMeta?.maxTokens ? Math.min(modelMeta.maxTokens, 1000) : 1000,
            temperature: 0.3, // low temperature — extraction, not generation
            stream: false,
        });

        const raw = completion.choices[0]?.message?.content ?? '';

        // Strip any accidental markdown fences before parsing.
        const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

        let parsed: DistilledMemory;
        try {
            parsed = JSON.parse(cleaned) as DistilledMemory;
        } catch {
            return Response.json(
                { error: `Model returned invalid JSON: ${raw.slice(0, 200)}` },
                { status: 502 },
            );
        }

        // Normalise — ensure all five keys are present arrays.
        const result: DistilledMemory = {
            themes: Array.isArray(parsed.themes) ? parsed.themes : [],
            preferences: Array.isArray(parsed.preferences) ? parsed.preferences : [],
            good_ideas: Array.isArray(parsed.good_ideas) ? parsed.good_ideas : [],
            dismissed: Array.isArray(parsed.dismissed) ? parsed.dismissed : [],
            questions: Array.isArray(parsed.questions) ? parsed.questions : [],
        };

        return Response.json(result);
    } catch (err) {
        console.error('[api/distill]', err);
        const message = err instanceof Error ? err.message : 'Internal server error';
        return Response.json({ error: message }, { status: 500 });
    }
}
