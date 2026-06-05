/**
 * Panteon Settings
 *
 * Single source of truth for API keys and agent model assignments.
 * Stored in localStorage under "panteon-settings".
 * Structure is DB-ready — swap the read/write functions later when adding auth.
 */

export const PROVIDERS = ['openai', 'anthropic', 'gemini', 'grok'] as const;
export type Provider = typeof PROVIDERS[number];

export const PROVIDER_LABELS: Record<Provider, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    gemini: 'Google Gemini',
    grok: 'xAI Grok',
};

export const PROVIDER_MODELS: Record<Provider, string[]> = {
    openai: ['gpt-5.5', 'gpt-5.4', 'gpt-5.4-mini', 'gpt-4o', 'gpt-4o-mini', 'o3', 'o4-mini'],
    anthropic: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-3-5'],
    gemini: ['gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-pro'],
    grok: ['grok-3', 'grok-3-mini'],
};

export const AGENTS = ['atlas', 'janus', 'sigma', 'achilles', 'athena'] as const;
export type AgentName = typeof AGENTS[number];

export interface AgentConfig {
    provider: Provider;
    model: string;
}

export interface PanteonSettings {
    keys: Partial<Record<Provider, string>>;
    agents: Record<AgentName, AgentConfig>;
}

export const DEFAULT_SETTINGS: PanteonSettings = {
    keys: {},
    agents: {
        atlas: { provider: 'openai', model: 'gpt-5.4' },
        janus: { provider: 'openai', model: 'gpt-5.4' },
        sigma: { provider: 'openai', model: 'gpt-5.4' },
        achilles: { provider: 'openai', model: 'gpt-5.4' },
        athena: { provider: 'openai', model: 'gpt-5.5' },
    },
};

const STORAGE_KEY = 'panteon-settings';

export function loadSettings(): PanteonSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_SETTINGS;
        const parsed = JSON.parse(raw) as Partial<PanteonSettings>;
        // Deep merge so new defaults are picked up if schema evolves
        return {
            keys: { ...DEFAULT_SETTINGS.keys, ...parsed.keys },
            agents: { ...DEFAULT_SETTINGS.agents, ...parsed.agents },
        };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function saveSettings(settings: PanteonSettings): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
