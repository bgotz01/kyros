'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AGENT_NAMES, buildTranscript, formatUsage, type Turn } from './types';

interface Props {
    turns: Turn[];
    /** Agent index currently generating, or null. */
    loadingIdx: number | null;
    emptyMessage: string;
    bottomRef: React.RefObject<HTMLDivElement | null>;
    onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

function Pulse() {
    return (
        <span className="flex items-center gap-1.5 pt-1" aria-label="Generating">
            {[0, 200, 400].map((d) => (
                <span
                    key={d}
                    className="h-1 w-1 animate-pulse rounded-full bg-bronze"
                    style={{ animationDelay: `${d}ms` }}
                />
            ))}
        </span>
    );
}

/** The shared transcript surface for Cascade and Loop — the analyst's question
 *  followed by each agent's response, in the order they spoke. */
export default function ThreadView({ turns, loadingIdx, emptyMessage, bottomRef, onScroll }: Props) {
    const [copied, setCopied] = useState(false);

    function handleCopy() {
        navigator.clipboard.writeText(buildTranscript(turns)).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <div className="relative flex-1 overflow-y-auto px-6 py-8 sm:px-10" onScroll={onScroll}>
            {turns.length > 0 && (
                <button
                    type="button"
                    onClick={handleCopy}
                    title="Copy full transcript"
                    className="absolute right-6 top-5 z-10 font-sans text-[0.58rem] uppercase tracking-[0.24em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:text-bronze-bright"
                >
                    {copied ? 'Copied' : 'Copy'}
                </button>
            )}

            {turns.length === 0 && loadingIdx === null && (
                <div className="flex h-full items-center justify-center">
                    <p className="max-w-md text-center font-serif text-lg font-light leading-relaxed text-platinum-dim">
                        {emptyMessage}
                    </p>
                </div>
            )}

            <div className="mx-auto max-w-3xl space-y-12">
                {turns.map((turn, ti) => {
                    const showRound = turn.round !== undefined && turn.round !== turns[ti - 1]?.round;
                    return (
                        <div key={ti} className="space-y-8">
                            {showRound && (
                                <div className="flex items-center gap-4">
                                    <span aria-hidden className="h-px flex-1 bg-stone-line" />
                                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-platinum-dim">
                                        Round {turn.round}
                                    </span>
                                    <span aria-hidden className="h-px flex-1 bg-stone-line" />
                                </div>
                            )}

                            {/* analyst question */}
                            <div className="border-l border-bronze bg-charcoal/50 px-5 py-4">
                                <div className="mb-2 font-sans text-[0.58rem] uppercase tracking-[0.3em] text-bronze">
                                    Analyst
                                </div>
                                <p className="whitespace-pre-wrap font-serif text-lg font-light leading-relaxed text-marble">
                                    {turn.question}
                                </p>
                            </div>

                            {/* agents */}
                            {turn.responses.map((r, ri) => (
                                <article key={ri}>
                                    <header className="mb-3 flex items-center gap-3">
                                        <span className="font-sans text-[0.62rem] uppercase tracking-[0.28em] text-bronze-bright">
                                            {AGENT_NAMES[r.agentIdx]}
                                        </span>
                                        <span aria-hidden className="h-px flex-1 bg-stone-line" />
                                        {r.usage && (
                                            <span
                                                className="shrink-0 font-mono text-[0.55rem] tracking-[0.1em] text-platinum-dim"
                                                title={`${r.usage.model} · ${r.usage.promptTokens.toLocaleString()} prompt + ${r.usage.completionTokens.toLocaleString()} completion tokens`}
                                            >
                                                {formatUsage(r.usage)}
                                            </span>
                                        )}
                                    </header>
                                    <div className="prose-kyros pl-1 text-[0.95rem] leading-[1.85] text-marble-dim">
                                        {r.content ? (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{r.content}</ReactMarkdown>
                                        ) : (
                                            <Pulse />
                                        )}
                                    </div>
                                </article>
                            ))}

                            {/* the next agent is warming up */}
                            {ti === turns.length - 1 &&
                                loadingIdx !== null &&
                                !turn.responses.some((r) => r.agentIdx === loadingIdx && r.content === '') && (
                                    <article>
                                        <header className="mb-3 flex items-center gap-3">
                                            <span className="font-sans text-[0.62rem] uppercase tracking-[0.28em] text-bronze-bright">
                                                {AGENT_NAMES[loadingIdx]}
                                            </span>
                                            <span aria-hidden className="h-px flex-1 bg-stone-line" />
                                        </header>
                                        <Pulse />
                                    </article>
                                )}
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
