'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { AgentName } from '@/app/lib/settings';
import type { PageContext } from '@/app/lib/page-context';
import { AGENT_META } from '@/app/lib/page-context';
import { useCouncil } from '@/app/hooks/useCouncil';

// ── Types ─────────────────────────────────────────────────────────────────────

type SelectionMode = 'all' | 'manual';

const AGENT_NAMES = ['atlas', 'janus', 'sigma', 'achilles', 'athena'] as const;

// ── Agent sigil toggle ────────────────────────────────────────────────────────

function AgentSigil({
    name,
    active,
    glowing,
    onClick,
}: {
    name: AgentName;
    active: boolean;
    glowing: boolean;
    onClick: () => void;
}) {
    const meta = AGENT_META[name];

    return (
        <button
            onClick={onClick}
            aria-pressed={active}
            aria-label={`${active ? 'Deactivate' : 'Activate'} ${meta.label}`}
            className="flex flex-col items-center gap-1.5 transition-all duration-300 group focus:outline-none"
            style={{ opacity: active ? 1 : 0.35 }}
        >
            <div
                className="relative flex h-14 w-14 items-center justify-center rounded-full border text-xl transition-all duration-300"
                style={{
                    borderColor: active ? 'var(--accent)' : 'rgba(181,139,74,0.20)',
                    backgroundColor: active ? 'rgba(181,139,74,0.08)' : 'var(--surface)',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    boxShadow: glowing
                        ? '0 0 22px rgba(181,139,74,0.45), 0 0 8px rgba(181,139,74,0.25)'
                        : active
                            ? '0 0 14px rgba(181,139,74,0.18)'
                            : 'none',
                }}
            >
                {active && (
                    <div
                        className="absolute inset-[-4px] rounded-full border transition-all duration-300"
                        style={{ borderColor: 'rgba(181,139,74,0.25)' }}
                    />
                )}
                {meta.glyph}
            </div>
            <div className="text-center">
                <div
                    className="text-[10px] tracking-[0.22em] uppercase transition-colors duration-300"
                    style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}
                >
                    {meta.label}
                </div>
                <div className="text-[8px] tracking-[0.18em] uppercase" style={{ color: 'var(--text-muted)' }}>
                    {meta.domain}
                </div>
            </div>
        </button>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

interface CouncilChatProps {
    /** When provided, the chat is page-aware and injects context into the API */
    pageContext?: PageContext;
}

export default function CouncilChat({ pageContext }: CouncilChatProps = {}) {
    const [mode, setMode] = useState<SelectionMode>('all');
    const [selected, setSelected] = useState<Set<AgentName>>(new Set(AGENT_NAMES));
    const [question, setQuestion] = useState('');

    const { turns, glowing, isLoading, submit, clear, bottomRef, inputRef } = useCouncil(pageContext);

    const activeAgents: AgentName[] = mode === 'all' ? [...AGENT_NAMES] : Array.from(selected);

    function toggleAgent(name: AgentName) {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    }

    async function handleSubmit() {
        const invoked = mode === 'all' ? [...AGENT_NAMES] : Array.from(selected);
        const sent = await submit(question, invoked);
        if (sent) setQuestion('');
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }

    return (
        <div className="flex flex-col h-full">

            {/* ── Mode selector ─────────────────────────────────────────── */}
            <div
                className="flex items-center gap-2 border-b px-5 py-3"
                style={{ borderColor: 'var(--surface-border)' }}
            >
                <span className="text-[9px] uppercase tracking-[0.3em] mr-2" style={{ color: 'var(--text-muted)' }}>
                    Mode
                </span>
                {(['all', 'manual'] as SelectionMode[]).map(m => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className="px-3 py-1 text-[10px] tracking-[0.25em] uppercase border transition-colors duration-200"
                        style={{
                            borderColor: mode === m ? 'var(--accent)' : 'rgba(181,139,74,0.20)',
                            backgroundColor: mode === m ? 'rgba(181,139,74,0.10)' : 'transparent',
                            color: mode === m ? 'var(--accent)' : 'var(--text-muted)',
                        }}
                    >
                        {m === 'all' ? '◉ All' : '◎ Select'}
                    </button>
                ))}
                {turns.length > 0 && (
                    <button
                        onClick={clear}
                        className="ml-auto px-3 py-1 text-[9px] tracking-[0.22em] uppercase border transition-opacity hover:opacity-70"
                        style={{ borderColor: 'rgba(181,139,74,0.20)', color: 'var(--text-muted)' }}
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* ── Agent sigils ──────────────────────────────────────────── */}
            <div
                className="flex items-start justify-center gap-6 border-b px-5 py-5"
                style={{ borderColor: 'var(--surface-border)' }}
            >
                {AGENT_NAMES.map(name => (
                    <AgentSigil
                        key={name}
                        name={name}
                        active={mode === 'all' || selected.has(name)}
                        glowing={glowing === name}
                        onClick={() => { if (mode === 'manual') toggleAgent(name); }}
                    />
                ))}
            </div>

            {/* ── Conversation ──────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-8 min-h-0">
                {turns.length === 0 && (
                    <div
                        className="flex flex-col items-center justify-center h-full text-center py-16 gap-3"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <div className="text-4xl mb-2 opacity-20" style={{ color: 'var(--accent)' }}>ϟ</div>
                        <p className="text-[11px] tracking-[0.3em] uppercase">Pose a question to the council</p>
                    </div>
                )}

                {turns.map((turn, i) => (
                    <div key={i} className="space-y-4">
                        {/* Question */}
                        <div className="flex justify-end">
                            <div
                                className="max-w-lg border px-4 py-3"
                                style={{ borderColor: 'rgba(181,139,74,0.20)', backgroundColor: 'var(--surface-raised)' }}
                            >
                                <div className="text-[9px] uppercase tracking-[0.28em] mb-2" style={{ color: 'var(--text-muted)' }}>
                                    Inquiry
                                </div>
                                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{turn.question}</p>
                            </div>
                        </div>

                        {/* Agent responses */}
                        {turn.responses.length > 0 && (
                            <div className="space-y-2">
                                {turn.responses.map((r, j) => {
                                    const meta = AGENT_META[r.agent];
                                    return (
                                        <div
                                            key={j}
                                            className="border px-4 py-3"
                                            style={{
                                                borderColor: r.isError ? 'rgba(181,74,74,0.30)' : 'rgba(181,139,74,0.15)',
                                                backgroundColor: 'var(--surface)',
                                            }}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm" style={{ color: 'var(--accent)' }}>{meta.glyph}</span>
                                                <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: r.isError ? '#B54A4A' : 'var(--text-primary)' }}>
                                                    {meta.label}
                                                </span>
                                                <span className="text-[8px] uppercase tracking-[0.20em]" style={{ color: 'var(--text-muted)' }}>
                                                    {meta.domain}
                                                </span>
                                            </div>
                                            <div className="text-sm leading-6 council-md" style={{ color: r.isError ? '#C97070' : 'var(--text-secondary)' }}>
                                                <ReactMarkdown>{r.text}</ReactMarkdown>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Athena synthesis */}
                        {turn.synthesis && (
                            <div
                                className="border px-5 py-4"
                                style={{ borderColor: 'var(--accent)', backgroundColor: 'var(--accent-dim)' }}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <span style={{ color: 'var(--accent)', fontSize: '1rem' }}>ϟ</span>
                                    <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--accent)' }}>
                                        Athena — Synthesis
                                    </span>
                                </div>
                                <div className="text-sm leading-7 council-md" style={{ color: 'var(--text-primary)' }}>
                                    <ReactMarkdown>{turn.synthesis}</ReactMarkdown>
                                </div>
                            </div>
                        )}

                        {/* Loading */}
                        {turn.loading && (
                            <div className="flex items-center gap-3 px-1" style={{ color: 'var(--text-muted)' }}>
                                <div className="flex gap-1">
                                    {[0, 1, 2].map(d => (
                                        <span
                                            key={d}
                                            className="block h-1 w-1 rounded-full animate-pulse"
                                            style={{ backgroundColor: 'var(--accent)', animationDelay: `${d * 150}ms`, opacity: 0.6 }}
                                        />
                                    ))}
                                </div>
                                <span className="text-[10px] tracking-[0.22em] uppercase">Council deliberating</span>
                            </div>
                        )}
                    </div>
                ))}

                <div ref={bottomRef} />
            </div>

            {/* ── Input ─────────────────────────────────────────────────── */}
            <div className="border-t px-5 py-4" style={{ borderColor: 'var(--surface-border)' }}>
                {mode === 'manual' && selected.size === 0 && (
                    <p className="mb-3 text-[10px] tracking-[0.22em] uppercase text-center" style={{ color: 'rgba(181,74,74,0.80)' }}>
                        Select at least one agent to invoke
                    </p>
                )}
                <div className="flex gap-3 items-end">
                    <textarea
                        ref={inputRef}
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Pose your inquiry to the council…"
                        rows={2}
                        disabled={isLoading}
                        className="flex-1 resize-none border px-4 py-3 text-sm leading-6 bg-transparent placeholder:opacity-40 focus:outline-none transition-colors duration-200"
                        style={{
                            borderColor: question ? 'rgba(181,139,74,0.40)' : 'rgba(181,139,74,0.18)',
                            color: 'var(--text-primary)',
                            backgroundColor: 'var(--surface-raised)',
                        }}
                        aria-label="Question for the council"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !question.trim() || (mode === 'manual' && selected.size === 0)}
                        className="shrink-0 border px-5 py-3 text-[10px] uppercase tracking-[0.28em] transition-all duration-200 disabled:opacity-30"
                        style={{
                            borderColor: 'var(--accent)',
                            color: 'var(--accent)',
                            backgroundColor: isLoading ? 'rgba(181,139,74,0.08)' : 'transparent',
                        }}
                        aria-label="Submit question"
                    >
                        {isLoading ? '…' : 'Invoke'}
                    </button>
                </div>
                <p className="mt-2 text-[9px] tracking-[0.18em] uppercase" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                    Enter to send · Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}
