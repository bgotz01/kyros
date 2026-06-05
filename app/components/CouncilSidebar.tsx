'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import type { AgentName } from '@/app/lib/settings';
import { getPageContext, AGENT_META } from '@/app/lib/page-context';
import { useCouncil } from '@/app/hooks/useCouncil';
import { useCouncilSidebar } from '@/app/lib/council-sidebar-context';
import { hasSubnav, NAVBAR_H, SUBNAV_H } from '@/app/lib/nav-sections';

// ── Types ─────────────────────────────────────────────────────────────────────

type SelectionMode = 'page' | 'all' | 'manual';

const AGENT_NAMES = ['atlas', 'janus', 'sigma', 'achilles', 'athena'] as const;

// ── Agent pip (compact sigil for sidebar) ─────────────────────────────────────

function AgentPip({
    name,
    active,
    glowing,
    isPrimary,
    onClick,
}: {
    name: AgentName;
    active: boolean;
    glowing: boolean;
    isPrimary: boolean;
    onClick: () => void;
}) {
    const meta = AGENT_META[name];
    return (
        <button
            onClick={onClick}
            aria-pressed={active}
            aria-label={`${active ? 'Deactivate' : 'Activate'} ${meta.label}`}
            title={`${meta.label} — ${meta.domain}`}
            className="flex flex-col items-center gap-1 transition-all duration-300 focus:outline-none"
            style={{ opacity: active ? 1 : 0.3 }}
        >
            <div
                className="relative flex h-9 w-9 items-center justify-center rounded-full border text-sm transition-all duration-300"
                style={{
                    borderColor: active ? 'var(--accent)' : 'rgba(181,139,74,0.18)',
                    backgroundColor: active ? 'rgba(181,139,74,0.08)' : 'var(--surface)',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    boxShadow: glowing
                        ? '0 0 18px rgba(181,139,74,0.5), 0 0 6px rgba(181,139,74,0.3)'
                        : isPrimary && active ? '0 0 10px rgba(181,139,74,0.22)' : 'none',
                }}
            >
                {active && (
                    <div className="absolute inset-[-3px] rounded-full border" style={{ borderColor: 'rgba(181,139,74,0.20)' }} />
                )}
                {meta.glyph}
            </div>
            <span className="text-[8px] tracking-[0.18em] uppercase" style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {meta.label}
            </span>
        </button>
    );
}

// ── Main sidebar ──────────────────────────────────────────────────────────────

export default function CouncilSidebar() {
    const pathname = usePathname();
    const pageCtx = getPageContext(pathname ?? '/');

    const { isOpen, toggle, close } = useCouncilSidebar();
    const [mode, setMode] = useState<SelectionMode>('page');
    const [selected, setSelected] = useState<Set<AgentName>>(new Set([pageCtx.primaryAgent]));
    const [question, setQuestion] = useState('');

    const { turns, glowing, isLoading, submit, clear, bottomRef, inputRef } = useCouncil(pageCtx);

    // Reset to page mode and clear conversation when navigating
    useEffect(() => {
        setMode('page');
        setSelected(new Set([pageCtx.primaryAgent]));
        clear();
    }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

    // Focus input when sidebar opens
    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 80);
    }, [isOpen, inputRef]);

    function toggleAgent(name: AgentName) {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    }

    async function handleSubmit() {
        const invoked: AgentName[] =
            mode === 'page' ? [pageCtx.primaryAgent]
                : mode === 'all' ? [...AGENT_NAMES]
                    : Array.from(selected);

        const sent = await submit(question, invoked);
        if (sent) setQuestion('');
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }

    const primaryMeta = AGENT_META[pageCtx.primaryAgent];
    const topOffset = NAVBAR_H + (hasSubnav(pathname ?? '/') ? SUBNAV_H : 0);

    return (
        <>
            {/* ── Tab trigger ──────────────────────────────────────────────── */}
            <button
                onClick={() => toggle()}
                aria-label={isOpen ? 'Close council' : 'Open council'}
                className="fixed right-0 z-50 flex flex-col items-center gap-1.5 border-l border-t border-b py-4 px-2 transition-all duration-200"
                style={{
                    top: `${topOffset + 40}px`,
                    borderColor: isOpen ? 'var(--accent)' : 'var(--surface-border)',
                    backgroundColor: isOpen ? 'rgba(181,139,74,0.06)' : 'var(--surface-raised)',
                    color: isOpen ? 'var(--accent)' : 'var(--text-muted)',
                }}
            >
                <svg
                    width="10" height="10" viewBox="0 0 10 10" fill="none"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s ease' }}
                >
                    <path d="M7 2L3 5L7 8" />
                </svg>
                <span
                    className="text-[8px] tracking-[0.28em] uppercase"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
                >
                    Council
                </span>
                <span className="text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                    {primaryMeta.glyph}
                </span>
            </button>

            {/* ── Sidebar panel ─────────────────────────────────────────────── */}
            <aside
                className="fixed right-0 z-40 flex flex-col border-l overflow-hidden"
                style={{
                    top: `${topOffset}px`,
                    width: isOpen ? '380px' : '0px',
                    height: `calc(100dvh - ${topOffset}px)`,
                    borderColor: 'rgba(181,139,74,0.25)',
                    backgroundColor: 'var(--surface-raised)',
                    backgroundImage: 'radial-gradient(ellipse at top right, rgba(181,139,74,0.06) 0%, transparent 60%)',
                    boxShadow: isOpen ? '-8px 0 32px rgba(0,0,0,0.4), -1px 0 0 rgba(181,139,74,0.12)' : 'none',
                    visibility: isOpen ? 'visible' : 'hidden',
                    opacity: isOpen ? 1 : 0,
                    transition: 'width 0.3s ease, opacity 0.2s ease, visibility 0.3s',
                }}
            >
                <div className="council-sidebar-bg flex flex-col h-full w-[380px]">

                    {/* ── Header ─────────────────────────────────────────── */}
                    <div className="shrink-0 border-b px-4 pt-6 pb-3 space-y-3" style={{ borderColor: 'var(--surface-border)' }}>

                        {/* Title row */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] uppercase tracking-[0.35em]" style={{ color: 'var(--accent)' }}>Council</span>
                                <span className="text-[9px] tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>/</span>
                                <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>{pageCtx.pageLabel}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {turns.length > 0 && (
                                    <button
                                        onClick={clear}
                                        className="text-[9px] uppercase tracking-[0.2em] px-2 py-1 border transition-opacity hover:opacity-70"
                                        style={{ borderColor: 'rgba(181,139,74,0.20)', color: 'var(--text-muted)' }}
                                    >
                                        Clear
                                    </button>
                                )}
                                <button
                                    onClick={() => close()}
                                    className="flex h-6 w-6 items-center justify-center border transition-opacity hover:opacity-70"
                                    style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}
                                    aria-label="Close council sidebar"
                                >
                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                        <path d="M1 1l10 10M11 1L1 11" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Page context badge */}
                        <div
                            className="flex flex-col gap-1.5 border px-2.5 py-2"
                            style={{ borderColor: 'rgba(181,139,74,0.15)', backgroundColor: 'rgba(181,139,74,0.04)' }}
                        >
                            <div className="flex items-center gap-1.5">
                                <span className="text-[8px] uppercase tracking-[0.28em]" style={{ color: 'var(--text-muted)' }}>Current page</span>
                                <span className="text-[8px] uppercase tracking-[0.28em]" style={{ color: 'var(--text-primary)' }}>{pageCtx.pageLabel}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span style={{ color: 'var(--accent)', fontSize: '0.75rem' }}>{primaryMeta.glyph}</span>
                                <span className="text-[9px] uppercase tracking-[0.22em]" style={{ color: 'var(--accent)' }}>{primaryMeta.label}</span>
                                <span className="text-[9px] tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>leads this page</span>
                            </div>
                        </div>

                        {/* Mode toggle */}
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] uppercase tracking-[0.28em] mr-1" style={{ color: 'var(--text-muted)' }}>Mode</span>
                            {(['page', 'all', 'manual'] as SelectionMode[]).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    className="px-2.5 py-1 text-[9px] tracking-[0.22em] uppercase border transition-colors duration-200"
                                    style={{
                                        borderColor: mode === m ? 'var(--accent)' : 'rgba(181,139,74,0.18)',
                                        backgroundColor: mode === m ? 'rgba(181,139,74,0.10)' : 'transparent',
                                        color: mode === m ? 'var(--accent)' : 'var(--text-muted)',
                                    }}
                                >
                                    {m === 'page' ? '◉ Page' : m === 'all' ? '◉ All' : '◎ Select'}
                                </button>
                            ))}
                        </div>

                        {/* Agent pips */}
                        <div className="flex items-start justify-between">
                            {AGENT_NAMES.map(name => (
                                <AgentPip
                                    key={name}
                                    name={name}
                                    active={
                                        mode === 'page' ? name === pageCtx.primaryAgent
                                            : mode === 'all' ? true
                                                : selected.has(name)
                                    }
                                    glowing={glowing === name}
                                    isPrimary={name === pageCtx.primaryAgent}
                                    onClick={() => { if (mode === 'manual') toggleAgent(name); }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* ── Conversation ──────────────────────────────────── */}
                    <div className="council-chat-bg flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-6">
                        {turns.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12" style={{ color: 'var(--text-muted)' }}>
                                <div className="text-3xl opacity-20" style={{ color: 'var(--accent)' }}>{primaryMeta.glyph}</div>
                                <div className="space-y-1">
                                    <p className="text-[10px] tracking-[0.28em] uppercase">{primaryMeta.label} leads here</p>
                                    <p className="text-[9px] tracking-[0.18em] uppercase opacity-60">{primaryMeta.domain} · {pageCtx.pageLabel}</p>
                                </div>
                            </div>
                        )}

                        {turns.map((turn, i) => (
                            <div key={i} className="space-y-3">
                                {/* Question */}
                                <div className="flex justify-end">
                                    <div className="max-w-[85%] border px-3 py-2.5" style={{ borderColor: 'rgba(181,139,74,0.20)', backgroundColor: 'var(--surface)' }}>
                                        <div className="text-[8px] uppercase tracking-[0.25em] mb-1.5" style={{ color: 'var(--text-muted)' }}>Inquiry</div>
                                        <p className="text-xs leading-5" style={{ color: 'var(--text-primary)' }}>{turn.question}</p>
                                    </div>
                                </div>

                                {/* Agent responses */}
                                {turn.responses.map((r, j) => {
                                    const meta = AGENT_META[r.agent];
                                    return (
                                        <div
                                            key={j}
                                            className="border px-3 py-2.5"
                                            style={{
                                                borderColor: r.isError ? 'rgba(181,74,74,0.30)'
                                                    : r.agent === pageCtx.primaryAgent ? 'rgba(181,139,74,0.28)'
                                                        : 'rgba(181,139,74,0.12)',
                                                backgroundColor: 'var(--surface)',
                                            }}
                                        >
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <span className="text-sm" style={{ color: 'var(--accent)' }}>{meta.glyph}</span>
                                                <span className="text-[9px] uppercase tracking-[0.22em]" style={{ color: r.isError ? '#B54A4A' : 'var(--text-primary)' }}>{meta.label}</span>
                                                <span className="text-[8px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>{meta.domain}</span>
                                                {r.agent === pageCtx.primaryAgent && (
                                                    <span className="ml-auto text-[8px] uppercase tracking-[0.2em] px-1.5 py-0.5 border" style={{ borderColor: 'rgba(181,139,74,0.30)', color: 'var(--accent)', backgroundColor: 'rgba(181,139,74,0.06)' }}>
                                                        Lead
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs leading-5 council-md" style={{ color: r.isError ? '#C97070' : 'var(--text-secondary)' }}>
                                                <ReactMarkdown>{r.text}</ReactMarkdown>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Athena synthesis */}
                                {turn.synthesis && (
                                    <div className="border px-3 py-3" style={{ borderColor: 'var(--accent)', backgroundColor: 'var(--accent-dim)' }}>
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <span style={{ color: 'var(--accent)' }}>ϟ</span>
                                            <span className="text-[9px] uppercase tracking-[0.28em]" style={{ color: 'var(--accent)' }}>Athena — Synthesis</span>
                                        </div>
                                        <div className="text-xs leading-5 council-md" style={{ color: 'var(--text-primary)' }}>
                                            <ReactMarkdown>{turn.synthesis}</ReactMarkdown>
                                        </div>
                                    </div>
                                )}

                                {/* Loading */}
                                {turn.loading && (
                                    <div className="flex items-center gap-2 px-1" style={{ color: 'var(--text-muted)' }}>
                                        <div className="flex gap-1">
                                            {[0, 1, 2].map(d => (
                                                <span key={d} className="block h-1 w-1 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)', animationDelay: `${d * 150}ms`, opacity: 0.5 }} />
                                            ))}
                                        </div>
                                        <span className="text-[9px] tracking-[0.22em] uppercase">Council deliberating</span>
                                    </div>
                                )}
                            </div>
                        ))}

                        <div ref={bottomRef} />
                    </div>

                    {/* ── Input ─────────────────────────────────────────── */}
                    <div className="shrink-0 border-t px-4 py-3" style={{ borderColor: 'var(--surface-border)' }}>
                        {mode === 'manual' && selected.size === 0 && (
                            <p className="mb-2 text-[9px] tracking-[0.2em] uppercase text-center" style={{ color: 'rgba(181,74,74,0.80)' }}>
                                Select at least one agent
                            </p>
                        )}
                        <div className="flex gap-2 items-end">
                            <textarea
                                ref={inputRef}
                                value={question}
                                onChange={e => setQuestion(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={`Ask the council about ${pageCtx.pageLabel}…`}
                                rows={2}
                                disabled={isLoading}
                                className="flex-1 resize-none border px-3 py-2.5 text-xs leading-5 bg-transparent placeholder:opacity-35 focus:outline-none transition-colors duration-200"
                                style={{
                                    borderColor: question ? 'rgba(181,139,74,0.40)' : 'rgba(181,139,74,0.18)',
                                    color: 'var(--text-primary)',
                                    backgroundColor: 'var(--surface)',
                                }}
                                aria-label="Question for the council"
                            />
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading || !question.trim() || (mode === 'manual' && selected.size === 0)}
                                className="shrink-0 border px-4 py-2.5 text-[9px] uppercase tracking-[0.25em] transition-all duration-200 disabled:opacity-30"
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
                        <p className="mt-1.5 text-[8px] tracking-[0.18em] uppercase" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                            Enter to send · Shift+Enter for new line
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
}
