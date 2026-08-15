import OpenAI from 'openai';

// ─── OpenRouter ──────────────────────────────────────────────────────────────
// Every model in Kyros is reached through OpenRouter's OpenAI-compatible API,
// so one client covers the whole catalogue. Server-side only — the key must
// never reach the browser.

export const MISSING_KEY_MESSAGE =
    'OPENROUTER_API_KEY is not set. Add it to .env.local and restart the dev server.';

/** True when a usable key is configured. */
export function hasApiKey(): boolean {
    return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

let client: OpenAI | null = null;

/** Built on first use rather than at import time: the SDK throws when handed
 *  an empty key, and a module-level throw would turn every route into an
 *  opaque 500 instead of the readable message above. */
export function openrouter(): OpenAI {
    if (!hasApiKey()) throw new Error(MISSING_KEY_MESSAGE);
    if (!client) {
        client = new OpenAI({
            apiKey: process.env.OPENROUTER_API_KEY!.trim(),
            baseURL: 'https://openrouter.ai/api/v1',
            defaultHeaders: {
                // OpenRouter attributes usage to these on its dashboard.
                'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
                'X-Title': 'Kyros',
            },
        });
    }
    return client;
}
