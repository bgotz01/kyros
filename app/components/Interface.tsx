'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { getPageContext } from '@/app/lib/page-context';
import { useAthena } from '@/app/hooks/useAthena'; // hook name unchanged
import { useCouncilSidebar } from '@/app/lib/council-sidebar-context';

interface SessionMeta {
    id: string;
    title: string;
    createdAt: string;
}

// Paths that show the SubNavbar (must have >1 item — matches SubNavbar logic)
const SUB_NAV_PREFIXES = ['/regime', '/cycle', '/stocks', '/asymmetry', '/judgment', '/council'];

function hasSubNavbar(pathname: string): boolean {
    return SUB_NAV_PREFIXES.some(p => pathname.startsWith(p));
}

export default function Interface() {
    const pathname = usePathname();
    const pageCtx = getPageContext(pathname ?? '/');
    const { isOpen, toggle, close } = useCouncilSidebar();
    const subNav = hasSubNavbar(pathname ?? '/');

    // Navbar = 60px, SubNavbar = 40px (from nav-sections constants)
    const topOffset = subNav ? 100 : 60;

    const [question, setQuestion] = useState('');
    const [showSessions, setShowSessions] = useState(false);
    const [sessions, setSessions] = useState<SessionMeta[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);

    const {
        turns, sessionId, isLoading, isSaving, savedAt,
        submit, saveToChambер, clear, loadSession,
        bottomRef, inputRef,
    } = useAthena(pageCtx);

    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 80);
    }, [isOpen, inputRef]);

    const fetchSessions = useCallback(async () => {
        setSessionsLoading(true);
        try {
            const res = await fetch('/api/athena/sessions');
            const data = await res.json() as { sessions: SessionMeta[] };
            setSessions(data.sessions ?? []);
        } catch {
            // ignore
        } finally {
            setSessionsLoading(false);
        }
    }, []);

    function toggleSessions() {
        if (!showSessions) fetchSessions();
        setShowSessions(s => !s);
    }

    async function handleLoadSession(id: string) {
        await loadSession(id);
        setShowSessions(false);
    }

    function handleNewChat() {
        clear();
        setShowSessions(false);
        setTimeout(() => inputRef.current?.focus(), 80);
    }

    async function handleSubmit() {
        const sent = await submit(question);
        if (sent) setQuestion('');
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }

    const hasCompletedTurns = turns.some(t => !t.loading && !t.isError && t.response);

    function fmtDate(iso: string) {
        const d = new Date(iso);
        const now = new Date();
        const diffH = (now.getTime() - d.getTime()) / 3_600_000;
        if (diffH < 24) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diffH < 168) return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    return (
        <>
            {/* ── Pull tab ─────────────────────────────────────────────────── */}
            <button
                onClick={() => toggle()}
                aria-label={isOpen ? 'Close Interface' : 'Open Interface'}
                className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1.5 border-l border-t border-b py-4 px-2 transition-all duration-200"
                style={{
                    borderColor: isOpen ? 'var(--accent)' : 'var(--surface-border)',
                    backgroundColor: isOpen ? 'rgba(181,139,74,0.06)' : 'var(--surface-raised)',
                    color: isOpen ? 'var(--accent)' : 'var(--text-muted)',
                }}
            >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s ease' }}>
                    <path d="M7 2L3 5L7 8" />
                </svg>
                <span className="text-[8px] tracking-[0.28em] uppercase"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>
                    Interface
                </span>
                <span className="text-xs" style={{ color: 'var(--accent)', opacity: 0.7 }}>ϟ</span>
            </button>

            {/* ── Sidebar panel ────────────────────────────────────────────── */}
            <aside
                className="fixed right-0 z-40 flex flex-col border-l overflow-hidden"
                style={{
                    top: `${topOffset}px`,
                    width: isOpen ? '400px' : '0px',
                    height: `calc(100dvh - ${topOffset}px)`,
                    borderColor: 'rgba(181,139,74,0.25)',
                    backgroundColor: 'var(--surface-raised)',
                    backgroundImage: 'radial-gradient(ellipse at top right, rgba(181,139,74,0.06) 0%, transparent 60%)',
                    boxShadow: isOpen ? '-8px 0 32px rgba(0,0,0,0.4)' : 'none',
                    visibility: isOpen ? 'visible' : 'hidden',
                    opacity: isOpen ? 1 : 0,
                    transition: 'width 0.3s ease, opacity 0.2s ease, visibility 0.3s',
                }}
            >
                <div className="flex flex-col h-full w-[400px]">

                    {/* ── Navbar ───────────────────────────────────────────── */}
                    <div className="shrink-0 border-b" style={{ borderColor: 'var(--surface-border)' }}>

                        {/* Top bar */}
                        <div className="flex items-center gap-2 px-3 py-2.5" style={{ backgroundColor: 'var(--surface)' }}>

                            {/* Brand */}
                            <div className="flex items-center gap-1.5 mr-1">
                                <span style={{ color: 'var(--accent)', fontSize: '1rem', lineHeight: 1 }}>ϟ</span>
                                <span className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: 'var(--accent)' }}>
                                    Interface
                                </span>
                            </div>

                            {/* Divider */}
                            <div className="h-4 w-px mx-1" style={{ backgroundColor: 'rgba(181,139,74,0.20)' }} />

                            {/* History button */}
                            <button
                                onClick={toggleSessions}
                                className="flex items-center gap-1.5 text-[8px] uppercase tracking-[0.22em] px-2 py-1.5 border transition-all duration-200"
                                style={{
                                    borderColor: showSessions ? 'var(--accent)' : 'rgba(181,139,74,0.25)',
                                    color: showSessions ? 'var(--accent)' : 'var(--text-muted)',
                                    backgroundColor: showSessions ? 'rgba(181,139,74,0.08)' : 'transparent',
                                }}
                                aria-label="View past conversations"
                                title="Past conversations"
                            >
                                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="8" cy="8" r="6.5" />
                                    <path d="M8 4.5V8l2.5 2" />
                                </svg>
                                <span>History</span>
                            </button>

                            {/* New chat button */}
                            <button
                                onClick={handleNewChat}
                                className="flex items-center gap-1.5 text-[8px] uppercase tracking-[0.22em] px-2 py-1.5 border transition-all duration-200"
                                style={{
                                    borderColor: 'rgba(181,139,74,0.25)',
                                    color: 'var(--text-muted)',
                                }}
                                aria-label="New conversation"
                                title="New conversation"
                            >
                                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M8 3v10M3 8h10" />
                                </svg>
                                <span>New</span>
                            </button>

                            {/* Spacer */}
                            <div className="flex-1" />

                            {/* Save to KB */}
                            <button
                                onClick={hasCompletedTurns ? saveToChambер : undefined}
                                disabled={isSaving || !hasCompletedTurns}
                                className="flex items-center gap-1.5 text-[8px] uppercase tracking-[0.22em] px-2 py-1.5 border transition-all duration-200 disabled:opacity-30"
                                style={{
                                    borderColor: savedAt ? 'rgba(100,181,100,0.50)' : 'rgba(181,139,74,0.25)',
                                    color: savedAt ? 'rgba(100,181,100,0.90)' : 'var(--text-muted)',
                                    backgroundColor: savedAt ? 'rgba(100,181,100,0.08)' : 'transparent',
                                }}
                                title="Summarize and save to Interface's knowledge base"
                                aria-label="Save to Knowledge Base"
                            >
                                <span>{savedAt ? '✓' : '⊕'}</span>
                                <span>{isSaving ? 'Saving…' : savedAt ? 'Saved' : 'Save to KB'}</span>
                            </button>

                            {/* Close X */}
                            <button
                                onClick={() => close()}
                                className="flex h-7 w-7 items-center justify-center border transition-opacity hover:opacity-70 ml-1"
                                style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}
                                aria-label="Close Interface"
                            >
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                    <path d="M1 1l10 10M11 1L1 11" />
                                </svg>
                            </button>
                        </div>

                        {/* Context strip */}
                        <div
                            className="flex items-center gap-2 px-4 py-1.5 border-t"
                            style={{ borderColor: 'rgba(181,139,74,0.12)', backgroundColor: 'rgba(181,139,74,0.03)' }}
                        >
                            <span className="h-1.5 w-1.5 rounded-full shrink-0 animate-pulse"
                                style={{ backgroundColor: 'var(--accent)', opacity: 0.6 }} />
                            <span className="text-[8px] uppercase tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>Context</span>
                            <span className="text-[9px] uppercase tracking-[0.22em] font-medium" style={{ color: 'var(--accent)' }}>
                                {pageCtx.pageLabel}
                            </span>
                            <span className="ml-auto text-[8px] tracking-[0.15em] font-mono opacity-40" style={{ color: 'var(--text-muted)' }}>
                                {pathname}
                            </span>
                        </div>
                    </div>

                    {/* ── Sessions panel (dropdown) ─────────────────────────── */}
                    {showSessions && (
                        <div
                            className="shrink-0 border-b overflow-y-auto"
                            style={{
                                borderColor: 'var(--surface-border)',
                                backgroundColor: 'var(--surface)',
                                maxHeight: '280px',
                            }}
                        >
                            <div className="px-4 py-2.5 border-b flex items-center justify-between"
                                style={{ borderColor: 'rgba(181,139,74,0.12)' }}>
                                <span className="text-[9px] uppercase tracking-[0.28em]" style={{ color: 'var(--text-muted)' }}>
                                    Past Conversations
                                </span>
                                <span className="text-[8px]" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                                    {sessions.length} sessions
                                </span>
                            </div>

                            {sessionsLoading ? (
                                <div className="px-4 py-6 text-center">
                                    <span className="text-[9px] uppercase tracking-[0.22em] animate-pulse" style={{ color: 'var(--text-muted)' }}>
                                        Loading…
                                    </span>
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="px-4 py-6 text-center">
                                    <span className="text-[9px] uppercase tracking-[0.22em]" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                                        No past sessions
                                    </span>
                                </div>
                            ) : (
                                <div className="divide-y" style={{ borderColor: 'rgba(181,139,74,0.08)' }}>
                                    {sessions.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => handleLoadSession(s.id)}
                                            className="w-full flex items-start justify-between gap-3 px-4 py-2.5 text-left transition-all hover:opacity-80"
                                            style={{
                                                backgroundColor: s.id === sessionId ? 'rgba(181,139,74,0.06)' : 'transparent',
                                                borderLeft: s.id === sessionId ? '2px solid var(--accent)' : '2px solid transparent',
                                            }}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] truncate" style={{ color: 'var(--text-primary)' }}>
                                                    {s.title}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-[8px] font-mono mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                                                {fmtDate(s.createdAt)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Conversation ─────────────────────────────────────── */}
                    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-5">
                        {turns.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12"
                                style={{ color: 'var(--text-muted)' }}>
                                <div className="text-4xl opacity-15" style={{ color: 'var(--accent)' }}>ϟ</div>
                                <p className="text-[10px] tracking-[0.28em] uppercase">Ask anything</p>
                                <p className="text-[9px] tracking-[0.18em] uppercase opacity-50">Macro · Stocks · Regime · Positioning</p>
                            </div>
                        )}

                        {turns.map((turn, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-end">
                                    <div className="max-w-[85%] border px-3 py-2.5"
                                        style={{ borderColor: 'rgba(181,139,74,0.20)', backgroundColor: 'var(--surface)' }}>
                                        <div className="text-[8px] uppercase tracking-[0.25em] mb-1.5" style={{ color: 'var(--text-muted)' }}>You</div>
                                        <p className="text-xs leading-5" style={{ color: 'var(--text-primary)' }}>{turn.question}</p>
                                    </div>
                                </div>

                                {turn.loading ? (
                                    <div className="flex items-center gap-2 px-1" style={{ color: 'var(--text-muted)' }}>
                                        <div className="flex gap-1">
                                            {[0, 1, 2].map(d => (
                                                <span key={d} className="block h-1 w-1 rounded-full animate-pulse"
                                                    style={{ backgroundColor: 'var(--accent)', animationDelay: `${d * 150}ms`, opacity: 0.5 }} />
                                            ))}
                                        </div>
                                        <span className="text-[9px] tracking-[0.22em] uppercase">Thinking…</span>
                                    </div>
                                ) : turn.response ? (
                                    <div className="border px-3 py-2.5"
                                        style={{
                                            borderColor: turn.isError ? 'rgba(181,74,74,0.30)' : 'rgba(181,139,74,0.20)',
                                            backgroundColor: 'var(--surface)',
                                        }}>
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <span style={{ color: 'var(--accent)', fontSize: '0.75rem' }}>ϟ</span>
                                            <span className="text-[9px] uppercase tracking-[0.22em]"
                                                style={{ color: turn.isError ? '#B54A4A' : 'var(--accent)' }}>Interface</span>
                                        </div>
                                        <div className="text-xs leading-5 council-md"
                                            style={{ color: turn.isError ? '#C97070' : 'var(--text-secondary)' }}>
                                            <ReactMarkdown>{turn.response}</ReactMarkdown>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ))}

                        <div ref={bottomRef} />
                    </div>

                    {/* ── Input ────────────────────────────────────────────── */}
                    <div className="shrink-0 border-t px-4 py-3" style={{ borderColor: 'var(--surface-border)' }}>
                        <div className="flex gap-2 items-end">
                            <textarea
                                ref={inputRef}
                                value={question}
                                onChange={e => setQuestion(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask…"
                                rows={2}
                                disabled={isLoading}
                                className="flex-1 resize-none border px-3 py-2.5 text-xs leading-5 bg-transparent placeholder:opacity-35 focus:outline-none transition-colors duration-200"
                                style={{
                                    borderColor: question ? 'rgba(181,139,74,0.40)' : 'rgba(181,139,74,0.18)',
                                    color: 'var(--text-primary)',
                                    backgroundColor: 'var(--surface)',
                                }}
                                aria-label="Ask Interface"
                            />
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading || !question.trim()}
                                className="shrink-0 border px-4 py-2.5 text-[9px] uppercase tracking-[0.25em] transition-all duration-200 disabled:opacity-30"
                                style={{
                                    borderColor: 'var(--accent)',
                                    color: 'var(--accent)',
                                    backgroundColor: isLoading ? 'rgba(181,139,74,0.08)' : 'transparent',
                                }}
                                aria-label="Send"
                            >
                                {isLoading ? '…' : 'Ask'}
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
