// ─── client-side persistence & streaming ─────────────────────────────────────
// Agent preferences and selection live in localStorage (UI config).
// Sessions and memory are persisted to Postgres via API routes.

import type {
    AgentConfig,
    AgentMessage,
    CouncilMemory,
    CouncilMode,
    DistilledMemory,
    MemoryCategory,
    MemoryEntry,
    PageRefMeta,
    SavedSession,
    Turn,
    Usage,
} from './types';
import { AGENT_COUNT, defaultAgentConfigs } from './types';

// ─── localStorage helpers ────────────────────────────────────────────────────
// Used only for preferences and selection — small, ephemeral UI state.

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
    } catch { /* quota exceeded */ }
}

// ─── preferences (localStorage) ──────────────────────────────────────────────

export function loadPreferences(): AgentConfig[] {
    const stored = read<AgentConfig[] | null>(PREFS_KEY, null);
    const defaults = defaultAgentConfigs();
    if (!Array.isArray(stored) || stored.length !== defaults.length) return defaults;
    return defaults.map((d, i) => ({
        model: typeof stored[i]?.model === 'string' ? stored[i].model : d.model,
        systemPrompt: typeof stored[i]?.systemPrompt === 'string' ? stored[i].systemPrompt : d.systemPrompt,
    }));
}

export function savePreferences(agents: AgentConfig[]): void {
    write(PREFS_KEY, agents);
}

// ─── agent selection (localStorage) ──────────────────────────────────────────

export function loadSelection(): Set<number> {
    const stored = read<number[] | null>(SELECTION_KEY, null);
    if (!Array.isArray(stored)) return new Set([0]);
    const valid = stored.filter((n) => Number.isInteger(n) && n >= 0 && n < AGENT_COUNT);
    return new Set(valid);
}

export function saveSelection(selected: Set<number>): void {
    write(SELECTION_KEY, [...selected].sort());
}

// ─── sessions (Postgres via API) ─────────────────────────────────────────────

/** Fetch all sessions from the server, newest first. */
export async function fetchSessions(): Promise<SavedSession[]> {
    const res = await fetch('/api/sessions');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as SavedSession[];
}

/** Persist (create or update) a session. Returns the saved session. */
export async function persistSession(session: SavedSession): Promise<SavedSession> {
    const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as SavedSession;
}

/** Delete a session by id. */
export async function removeSession(id: string): Promise<void> {
    await fetch(`/api/sessions?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/** Rename a session. Returns the updated session. */
export async function renameSessionApi(id: string, title: string): Promise<SavedSession> {
    const res = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as SavedSession;
}

// ─── session helpers (pure, no I/O) ──────────────────────────────────────────

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

export interface StreamResult {
    content: string;
    usage: Usage | null;
}

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
        } catch { /* not JSON */ }
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
                continue;
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

// ─── references ──────────────────────────────────────────────────────────────

export async function fetchRefs(): Promise<PageRefMeta[]> {
    const res = await fetch('/api/context');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as PageRefMeta[];
}

// ─── memory (Postgres via API) ────────────────────────────────────────────────

/** Fetch the full memory store and enabled setting from the server. */
export async function fetchMemory(): Promise<CouncilMemory & { enabled: boolean }> {
    const res = await fetch('/api/memory');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as CouncilMemory & { enabled: boolean };
}

/** Persist a single entry (create or update). */
export async function persistMemoryEntry(entry: MemoryEntry): Promise<MemoryEntry> {
    const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as MemoryEntry;
}

/** Delete a memory entry by id. */
export async function deleteMemoryEntryApi(id: string): Promise<void> {
    await fetch(`/api/memory?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/** Update memory settings (enabled toggle, lastDistilledAt). */
export async function patchMemorySettings(
    patch: { enabled?: boolean; lastDistilledAt?: string },
): Promise<void> {
    await fetch('/api/memory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
    });
}

/** Merge distilled items into Postgres (bulk upsert, dedup by text on server).
 *  Returns the full updated memory. */
export async function mergeDistilledApi(
    distilled: DistilledMemory,
    sessionId: string,
    existingTexts: Set<string>,
): Promise<CouncilMemory> {
    const now = new Date().toISOString();
    const toAdd: MemoryEntry[] = [];

    const push = (category: MemoryCategory, items: string[]) => {
        for (const text of items) {
            if (!text.trim()) continue;
            if (existingTexts.has(text.trim().toLowerCase())) continue;
            toAdd.push({ id: newMemoryId(), category, text: text.trim(), addedAt: now, sessionId });
            existingTexts.add(text.trim().toLowerCase());
        }
    };

    push('theme', distilled.themes ?? []);
    push('preference', distilled.preferences ?? []);
    push('good_idea', distilled.good_ideas ?? []);
    push('dismissed', distilled.dismissed ?? []);
    push('question', distilled.questions ?? []);

    await fetch('/api/memory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: toAdd, lastDistilledAt: now }),
    });

    // Re-fetch the canonical state from the server.
    const result = await fetchMemory();
    return { entries: result.entries, lastDistilledAt: result.lastDistilledAt };
}

export function newMemoryId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? `m_${crypto.randomUUID()}`
        : `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Build a system-prompt block from the in-memory store (pure, no I/O). */
export function buildMemoryBlock(memory: CouncilMemory): string {
    const { entries } = memory;
    if (entries.length === 0) return '';

    const byCategory = (cat: MemoryCategory) => entries.filter((e) => e.category === cat);

    const sections: string[] = [
        '─── ANALYST MEMORY ─────────────────────────────────────────────────────────',
        'The following is a persistent record of what the analyst has found valuable,',
        'dismissed, or is consistently returning to. Use it as calibration — not as',
        'a script. Do not narrate the memory back to the analyst.',
        '',
    ];

    const render = (label: string, cat: MemoryCategory) => {
        const items = byCategory(cat);
        if (items.length === 0) return;
        sections.push(`${label}:`);
        items.forEach((e) => sections.push(`  — ${e.text}`));
        sections.push('');
    };

    render('Recurring themes', 'theme');
    render('Stated preferences', 'preference');
    render('Ideas worth developing', 'good_idea');
    render('Dismissed angles (do not re-suggest)', 'dismissed');
    render('Standing open questions', 'question');

    sections.push('─── END OF ANALYST MEMORY ───────────────────────────────────────────────────');
    return sections.join('\n');
}

/** Calls /api/distill to extract structured memory items from a transcript. */
export async function distillSession(
    transcript: string,
    model: string,
): Promise<DistilledMemory> {
    const res = await fetch('/api/distill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, model }),
    });
    if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
            const body = (await res.json()) as { error?: string };
            if (body.error) detail = body.error;
        } catch { /* not JSON */ }
        throw new Error(detail);
    }
    return (await res.json()) as DistilledMemory;
}
