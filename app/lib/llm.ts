/**
 * LLM routing layer
 *
 * callAgent() is the single entry point for all agent inference.
 * Looks up the agent's assigned provider + model, grabs the key,
 * and routes to the correct provider. Add new providers here only.
 */

import { loadSettings, type AgentName, type Provider, type PanteonSettings } from './settings';

export interface AgentMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AgentResponse {
    text: string;
    agent: AgentName;
    provider: Provider;
    model: string;
}

// ── Provider implementations ──────────────────────────────────────────────────

async function callOpenAI(
    model: string,
    apiKey: string,
    messages: AgentMessage[],
): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI error ${res.status}: ${err}`);
    }
    const data = await res.json();
    return data.choices[0].message.content as string;
}

async function callAnthropic(
    model: string,
    apiKey: string,
    messages: AgentMessage[],
): Promise<string> {
    // Anthropic separates system prompt from the messages array
    const system = messages.find((m) => m.role === 'system')?.content ?? '';
    const filtered = messages.filter((m) => m.role !== 'system');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model, system, messages: filtered, max_tokens: 1024 }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Anthropic error ${res.status}: ${err}`);
    }
    const data = await res.json();
    return data.content[0].text as string;
}

async function callGemini(
    model: string,
    apiKey: string,
    messages: AgentMessage[],
): Promise<string> {
    const contents = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents }),
        },
    );
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini error ${res.status}: ${err}`);
    }
    const data = await res.json();
    return data.candidates[0].content.parts[0].text as string;
}

async function callGrok(
    model: string,
    apiKey: string,
    messages: AgentMessage[],
): Promise<string> {
    // Grok uses an OpenAI-compatible endpoint
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Grok error ${res.status}: ${err}`);
    }
    const data = await res.json();
    return data.choices[0].message.content as string;
}

// ── Router ────────────────────────────────────────────────────────────────────

export async function callAgent(
    agent: AgentName,
    messages: AgentMessage[],
    settingsOverride?: PanteonSettings,
): Promise<AgentResponse> {
    const settings = settingsOverride ?? loadSettings();
    const config = settings.agents[agent];
    const { provider, model } = config;

    const apiKey = settings.keys[provider];
    if (!apiKey) {
        throw new Error(
            `No API key configured for ${provider}. Open Settings to add one.`,
        );
    }

    let text: string;
    switch (provider) {
        case 'openai':
            text = await callOpenAI(model, apiKey, messages);
            break;
        case 'anthropic':
            text = await callAnthropic(model, apiKey, messages);
            break;
        case 'gemini':
            text = await callGemini(model, apiKey, messages);
            break;
        case 'grok':
            text = await callGrok(model, apiKey, messages);
            break;
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }

    return { text, agent, provider, model };
}
