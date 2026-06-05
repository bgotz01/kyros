'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { AgentName } from '@/app/lib/settings';
import { loadSettings } from '@/app/lib/settings';
import type { PageContext } from '@/app/lib/page-context';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AgentMessage {
    agent: AgentName;
    text: string;
    isError?: boolean;
}

export interface Turn {
    question: string;
    agents: AgentName[];
    responses: AgentMessage[];
    synthesis?: string;
    loading: boolean;
}

/** Compact turn shape sent to the API for conversation history */
export interface HistoryTurn {
    question: string;
    // Map of agent → response text (errors excluded)
    responses: Partial<Record<AgentName, string>>;
    synthesis?: string;
}

// ── NDJSON stream reader ──────────────────────────────────────────────────────

async function* readNDJSON(reader: ReadableStreamDefaultReader<Uint8Array>) {
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
            if (line.trim()) {
                try { yield JSON.parse(line); } catch { /* skip malformed */ }
            }
        }
    }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCouncil(pageContext?: PageContext) {
    const [turns, setTurns] = useState<Turn[]>([]);
    const [glowing, setGlowing] = useState<AgentName | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [turns]);

    const submit = useCallback(async (question: string, agents: AgentName[]) => {
        const q = question.trim();
        if (!q || agents.length === 0) return false;

        const turnIndex = turns.length;
        setTurns(prev => [...prev, { question: q, agents, responses: [], loading: true }]);

        // Build compact history from the last 6 completed turns (no loading, no errors)
        const history: HistoryTurn[] = turns
            .filter(t => !t.loading && t.responses.some(r => !r.isError))
            .slice(-6)
            .map(t => ({
                question: t.question,
                responses: Object.fromEntries(
                    t.responses.filter(r => !r.isError).map(r => [r.agent, r.text])
                ) as Partial<Record<AgentName, string>>,
                synthesis: t.synthesis,
            }));

        try {
            const res = await fetch('/api/council', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: q,
                    agents,
                    settings: loadSettings(),
                    pageContext,
                    history,
                    sessionId,  // null on first turn → server creates new session
                }),
            });

            if (!res.ok || !res.body) throw new Error(`Request failed: ${res.status}`);

            const reader = res.body.getReader();

            for await (const event of readNDJSON(reader)) {
                if (event.type === 'agent') {
                    setGlowing(event.agent as AgentName);
                    setTimeout(() => setGlowing(null), 1800);
                    setTurns(prev => prev.map((t, i) =>
                        i === turnIndex
                            ? { ...t, responses: [...t.responses, { agent: event.agent, text: event.text }] }
                            : t
                    ));
                } else if (event.type === 'synthesis') {
                    setGlowing('athena');
                    setTimeout(() => setGlowing(null), 1800);
                    setTurns(prev => prev.map((t, i) =>
                        i === turnIndex ? { ...t, synthesis: event.text } : t
                    ));
                } else if (event.type === 'error') {
                    setTurns(prev => prev.map((t, i) =>
                        i === turnIndex
                            ? { ...t, responses: [...t.responses, { agent: event.agent, text: event.message, isError: true }] }
                            : t
                    ));
                } else if (event.type === 'done') {
                    // Persist the session ID returned by the server
                    if (event.sessionId) setSessionId(event.sessionId as string);
                    setTurns(prev => prev.map((t, i) =>
                        i === turnIndex ? { ...t, loading: false } : t
                    ));
                }
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setTurns(prev => prev.map((t, i) =>
                i === turnIndex
                    ? { ...t, loading: false, responses: [...t.responses, { agent: 'athena' as AgentName, text: message, isError: true }] }
                    : t
            ));
        }

        return true;
    }, [turns.length, pageContext]);

    const clear = useCallback(() => {
        setTurns([]);
        setSessionId(null);
    }, []);

    const isLoading = turns.some(t => t.loading);

    return { turns, glowing, isLoading, submit, clear, bottomRef, inputRef };
}
