'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { loadSettings } from '@/app/lib/settings';
import type { PageContext } from '@/app/lib/page-context';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AthenaTurn {
    question: string;
    response: string;
    loading: boolean;
    isError?: boolean;
}

export interface HistoryMessage {
    role: 'user' | 'assistant';
    content: string;
}

// ── NDJSON reader ─────────────────────────────────────────────────────────────

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

export function useAthena(pageContext?: PageContext) {
    const [turns, setTurns] = useState<AthenaTurn[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [savedAt, setSavedAt] = useState<Date | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [turns]);

    // Build history array from completed turns for the API
    const buildHistory = useCallback((currentTurns: AthenaTurn[]): HistoryMessage[] => {
        return currentTurns
            .filter(t => !t.loading && !t.isError && t.response)
            .slice(-8) // last 8 completed turns
            .flatMap(t => [
                { role: 'user' as const, content: t.question },
                { role: 'assistant' as const, content: t.response },
            ]);
    }, []);

    const submit = useCallback(async (question: string): Promise<boolean> => {
        const q = question.trim();
        if (!q) return false;

        const turnIndex = turns.length;
        setTurns(prev => [...prev, { question: q, response: '', loading: true }]);

        try {
            const res = await fetch('/api/athena', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: q,
                    history: buildHistory(turns),
                    sessionId,
                    settings: loadSettings(),
                    pageContext,
                }),
            });

            if (!res.ok || !res.body) throw new Error(`Request failed: ${res.status}`);

            const reader = res.body.getReader();
            for await (const event of readNDJSON(reader)) {
                if (event.type === 'done') {
                    if (event.sessionId) setSessionId(event.sessionId as string);
                    setTurns(prev => prev.map((t, i) =>
                        i === turnIndex ? { ...t, response: event.text as string, loading: false } : t
                    ));
                } else if (event.type === 'error') {
                    setTurns(prev => prev.map((t, i) =>
                        i === turnIndex ? { ...t, response: event.message as string, loading: false, isError: true } : t
                    ));
                }
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setTurns(prev => prev.map((t, i) =>
                i === turnIndex ? { ...t, response: message, loading: false, isError: true } : t
            ));
        }

        return true;
    }, [turns, sessionId, pageContext, buildHistory]);

    /** Save current conversation to Chamber (RAG memory) */
    const saveToChambер = useCallback(async (): Promise<boolean> => {
        const completedTurns = turns.filter(t => !t.loading && !t.isError && t.response);
        if (!completedTurns.length) return false;

        setIsSaving(true);
        try {
            const res = await fetch('/api/athena/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    turns: completedTurns.map(t => ({ question: t.question, response: t.response })),
                    sessionId,
                    settings: loadSettings(),
                }),
            });

            if (!res.ok) throw new Error(`Save failed: ${res.status}`);
            setSavedAt(new Date());
            return true;
        } catch (err) {
            console.error('[useAthena] saveToChambер failed:', err);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [turns, sessionId]);

    const clear = useCallback(() => {
        setTurns([]);
        setSessionId(null);
        setSavedAt(null);
    }, []);

    /** Load a past session's turns into the chat */
    const loadSession = useCallback(async (id: string): Promise<boolean> => {
        try {
            const res = await fetch(`/api/athena/sessions?id=${id}`);
            if (!res.ok) throw new Error(`Failed to load session: ${res.status}`);
            const { turns: rawTurns } = await res.json() as {
                turns: { question: string; responses: Record<string, string>; synthesis?: string }[]
            };

            // Reconstruct AthenaTurn array from saved DB turns
            const restored: AthenaTurn[] = rawTurns.flatMap(t => {
                const response = t.responses?.athena ?? t.synthesis ?? Object.values(t.responses ?? {})[0] ?? '';
                return [{ question: t.question, response, loading: false }];
            });

            setTurns(restored);
            setSessionId(id);
            setSavedAt(null);
            return true;
        } catch (err) {
            console.error('[useAthena] loadSession failed:', err);
            return false;
        }
    }, []);

    const isLoading = turns.some(t => t.loading);

    return {
        turns,
        sessionId,
        isLoading,
        isSaving,
        savedAt,
        submit,
        saveToChambер,
        clear,
        loadSession,
        bottomRef,
        inputRef,
    };
}
