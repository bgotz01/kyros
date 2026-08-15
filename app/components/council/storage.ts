// ─── client-side persistence & streaming ─────────────────────────────────────
// Kyros has no database yet, so sessions and agent preferences live in
// localStorage. Every function here is a no-op on the server.

import type {
    AgentConfig,
    AgentMessage,
    CouncilMode,
    PageRefMeta,
    SavedSession,
    Turn,
    Usage,
} from './types';
import { AGENT_COUNT, defaultAgentConfigs } from './types';

const SESSIONS_KEY = 'kyros_council_sessions_v1';
// Bumped when the default personas change, so stored copies of the old ones
// don't outlive them.
const PREFS_KEY = 'kyros_council_prefs_v3';
const SELECTION_KEY = 'kyros_council_selection_v1';

function read<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
        return fallback;
    }
}

function write(key: string, value: unknown): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        /* quota exceeded — losing a session beats crashing the page */
    }
}

// ─── preferences ─────────────────────────────────────────────────────────────

export function loadPreferences(): AgentConfig[] {
    const stored = read<AgentConfig[] | null>(PREFS_KEY, null);
    const defaults = defaultAgentConfigs();
    if (!Array.isArray(stored) || stored.length !== defaults.length) return defaults;
    // Merge rather than trust: a stored entry missing a field falls back to its default.
    return defaults.map((d, i) => ({
        model: typeof stored[i]?.model === 'string' ? stored[i].model : d.model,
        systemPrompt: typeof stored[i]?.systemPrompt === 'string' ? stored[i].systemPrompt : d.systemPrompt,
    }));
}

export function savePreferences(agents: AgentConfig[]): void {
    write(PREFS_KEY, agents);
}

// ─── agent selection ─────────────────────────────────────────────────────────
// Which agents speak. Kept apart from the persona preferences so a stored
// selection survives a personas bump, and so an empty set stays empty rather
// than being helpfully repopulated.

/** Defaults to Agent I alone — one voice unless the analyst convenes more. */
export function loadSelection(): Set<number> {
    const stored = read<number[] | null>(SELECTION_KEY, null);
    if (!Array.isArray(stored)) return new Set([0]);
    const valid = stored.filter((n) => Number.isInteger(n) && n >= 0 && n < AGENT_COUNT);
    return new Set(valid);
}

export function saveSelection(selected: Set<number>): void {
    write(SELECTION_KEY, [...selected].sort());
}

// ─── sessions ────────────────────────────────────────────────────────────────

export function loadSessions(): SavedSession[] {
    const rows = read<SavedSession[]>(SESSIONS_KEY, []);
    if (!Array.isArray(rows)) return [];
    return rows.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

function persistSessions(sessions: SavedSession[]): void {
    // Cap the archive so localStorage never fills up silently.
    write(SESSIONS_KEY, sessions.slice(0, 60));
}

export function upsertSession(session: SavedSession): SavedSession[] {
    const rest = loadSessions().filter((s) => s.id !== session.id);
    const next = [session, ...rest].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
    persistSessions(next);
    return next;
}

export function deleteSession(id: string): SavedSession[] {
    const next = loadSessions().filter((s) => s.id !== id);
    persistSessions(next);
    return next;
}

export function renameSession(id: string, title: string): SavedSession[] {
    const next = loadSessions().map((s) => (s.id === id ? { ...s, title: title.trim() || null } : s));
    persistSessions(next);
    return next;
}

export function newSessionId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function buildSession(args: {
    id: string;
    mode: CouncilMode;
    title: string | null;
    agents: AgentConfig[];
    turns: Turn[];
    parallelMessages?: AgentMessage[][];
    refs?: PageRefMeta[];
    selectedIdxs?: number[];
}): SavedSession {
    const firstQuestion =
        args.turns[0]?.question ??
        args.parallelMessages?.[0]?.find((m) => m.role === 'user')?.content ??
        'Untitled';
    return {
        id: args.id,
        mode: args.mode,
        title: args.title,
        firstQuestion,
        savedAt: new Date().toISOString(),
        agents: args.agents,
        turns: args.turns,
        parallelMessages: args.parallelMessages,
        refs: args.refs,
        selectedIdxs: args.selectedIdxs,
    };
}

// ─── streaming ───────────────────────────────────────────────────────────────

export interface StreamPayload {
    messages: AgentMessage[];
    model: string;
    systemPrompt: string;
    /** Reference ids to attach. The server resolves them to content. */
    refIds?: string[];
}

// ─── references ──────────────────────────────────────────────────────────────

/** The catalogue of attachable references — metadata only. */
export async function fetchRefs(): Promise<PageRefMeta[]> {
    const res = await fetch('/api/context');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as PageRefMeta[];
}

export interface StreamResult {
    content: string;
    /** Null when the provider returned no usage on the final chunk. */
    usage: Usage | null;
}

/** POSTs to /api/chat and resolves with the complete response plus what it
 *  cost, calling `onDelta` with the accumulated text as it arrives. */
export async function streamChat(
    payload: StreamPayload,
    onDelta: (partial: string) => void,
    signal?: AbortSignal,
): Promise<StreamResult> {
    const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal,
    });

    if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
            const body = (await res.json()) as { error?: string };
            if (body.error) detail = body.error;
        } catch {
            /* body wasn't JSON — keep the status line */
        }
        throw new Error(detail);
    }
    if (!res.body) throw new Error('No response body');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = '';
    let buffer = '';
    let usage: Usage | null = null;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') return { content: full, usage };
            let parsed: { delta?: string; error?: string; usage?: Usage };
            try {
                parsed = JSON.parse(raw) as { delta?: string; error?: string; usage?: Usage };
            } catch {
                continue; // partial frame — the next read completes it
            }
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.usage) usage = parsed.usage;
            if (parsed.delta) {
                full += parsed.delta;
                onDelta(full);
            }
        }
    }
    return { content: full, usage };
}
