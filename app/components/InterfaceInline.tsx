'use client';

import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import { useAthena } from '@/app/hooks/useAthena';

/**
 * Inline (non-sidebar) version of Interface.
 * Used on the main Council Chamber page where the chat is embedded in the layout.
 */
export default function InterfaceInline() {
    const [question, setQuestion] = useState('');
    const {
        turns, isLoading, isSaving, savedAt,
        submit, saveToChambер, clear,
        bottomRef, inputRef,
    } = useAthena();

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

    return (
        <div className="flex flex-col h-full">

            {/* ── Mode bar ──────────────────────────────────────────────── */}
            <div
                className="flex items-center gap-2 border-b px-5 py-3"
                style={{ borderColor: 'var(--surface-border)' }}
            >
                <span className="text-sm" style={{ color: 'var(--accent)' }}>ϟ</span>
                <span className="text-[9px] uppercase tracking-[0.35em]" style={{ color: 'var(--accent)' }}>Interface</span>
                <span className="text-[9px] tracking-[0.18em] ml-1" style={{ color: 'var(--text-muted)' }}>Market Intelligence</span>
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

            {/* ── Conversation ──────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 min-h-0">
                {turns.length === 0 && (
                    <div
                        className="flex flex-col items-center justify-center h-full text-center py-16 gap-3"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <div className="text-5xl mb-2 opacity-15" style={{ color: 'var(--accent)' }}>ϟ</div>
                        <p className="text-[11px] tracking-[0.3em] uppercase">Pose a question</p>
                        <p className="text-[9px] tracking-[0.22em] uppercase opacity-60">Macro · Regime · Stocks · Positioning</p>
                    </div>
                )}

                {turns.map((turn, i) => (
                    <div key={i} className="space-y-3">
                        {/* Question */}
                        <div className="flex justify-end">
                            <div
                                className="max-w-lg border px-4 py-3"
                                style={{ borderColor: 'rgba(181,139,74,0.20)', backgroundColor: 'var(--surface-raised)' }}
                            >
                                <div className="text-[9px] uppercase tracking-[0.28em] mb-2" style={{ color: 'var(--text-muted)' }}>You</div>
                                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{turn.question}</p>
                            </div>
                        </div>

                        {/* Response */}
                        {turn.loading ? (
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
                                <span className="text-[10px] tracking-[0.22em] uppercase">Thinking…</span>
                            </div>
                        ) : turn.response ? (
                            <div
                                className="border px-5 py-4"
                                style={{
                                    borderColor: turn.isError ? 'rgba(181,74,74,0.30)' : 'rgba(181,139,74,0.20)',
                                    backgroundColor: 'var(--surface)',
                                }}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <span style={{ color: 'var(--accent)', fontSize: '1rem' }}>ϟ</span>
                                    <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: turn.isError ? '#B54A4A' : 'var(--accent)' }}>
                                        Interface
                                    </span>
                                </div>
                                <div className="text-sm leading-7 council-md" style={{ color: turn.isError ? '#C97070' : 'var(--text-primary)' }}>
                                    <ReactMarkdown>{turn.response}</ReactMarkdown>
                                </div>
                            </div>
                        ) : null}
                    </div>
                ))}

                <div ref={bottomRef} />
            </div>

            {/* ── Input ─────────────────────────────────────────────────── */}
            <div className="border-t px-5 py-4 space-y-2" style={{ borderColor: 'var(--surface-border)' }}>
                <div className="flex gap-3 items-end">
                    <textarea
                        ref={inputRef}
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything about markets, regime, or specific stocks…"
                        rows={2}
                        disabled={isLoading}
                        className="flex-1 resize-none border px-4 py-3 text-sm leading-6 bg-transparent placeholder:opacity-40 focus:outline-none transition-colors duration-200"
                        style={{
                            borderColor: question ? 'rgba(181,139,74,0.40)' : 'rgba(181,139,74,0.18)',
                            color: 'var(--text-primary)',
                            backgroundColor: 'var(--surface-raised)',
                        }}
                        aria-label="Ask Athena"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !question.trim()}
                        className="shrink-0 border px-5 py-3 text-[10px] uppercase tracking-[0.28em] transition-all duration-200 disabled:opacity-30"
                        style={{
                            borderColor: 'var(--accent)',
                            color: 'var(--accent)',
                            backgroundColor: isLoading ? 'rgba(181,139,74,0.08)' : 'transparent',
                        }}
                        aria-label="Ask"
                    >
                        {isLoading ? '…' : 'Ask'}
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <p className="text-[9px] tracking-[0.18em] uppercase" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                        Enter to send · Shift+Enter for new line
                    </p>
                    {hasCompletedTurns && (
                        <button
                            onClick={saveToChambер}
                            disabled={isSaving}
                            className="text-[9px] uppercase tracking-[0.22em] px-3 py-1 border transition-all duration-200 disabled:opacity-40"
                            style={{
                                borderColor: savedAt ? 'rgba(100,181,100,0.40)' : 'rgba(181,139,74,0.30)',
                                color: savedAt ? 'rgba(100,181,100,0.80)' : 'var(--text-muted)',
                                backgroundColor: savedAt ? 'rgba(100,181,100,0.06)' : 'transparent',
                            }}
                            title="Summarize this conversation and save key insights to Interface's memory"
                            aria-label="Save to Chamber"
                        >
                            {isSaving ? '…saving' : savedAt ? '✓ saved to chamber' : '⊕ save to chamber'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
