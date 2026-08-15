'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MODELS } from '@/lib/models';
import ModelSelect from './ModelSelect';
import { AGENT_NAMES, formatUsage, sumUsage, type AgentState } from './types';

interface Props {
    agents: AgentState[];
    anyLoading: boolean;
    onModelChange: (idx: number, model: string) => void;
    onOpenPrompt: (idx: number) => void;
    bottomRefs: React.RefObject<(HTMLDivElement | null)[]>;
    /** Which agents answer. Silenced ones collapse to a strip. */
    selected: Set<number>;
    onToggle: (idx: number) => void;
}

/** One independent column per speaking agent — the same question put to each in
 *  isolation, so they cannot influence one another. A silenced agent keeps a
 *  narrow strip rather than disappearing, so the roster stays reachable. */
export default function ParallelView({
    agents,
    anyLoading,
    onModelChange,
    onOpenPrompt,
    bottomRefs,
    selected,
    onToggle,
}: Props) {
    return (
        <div className="flex flex-1 gap-px overflow-hidden bg-stone-line">
            {agents.map((agent, i) => {
                const meta = MODELS.find((m) => m.id === agent.model);
                const used = sumUsage(agent.messages.map((m) => m.usage));

                if (!selected.has(i)) {
                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => onToggle(i)}
                            disabled={anyLoading}
                            title={`Include ${AGENT_NAMES[i]}`}
                            className="group flex w-11 shrink-0 flex-col items-center gap-4 bg-obsidian py-5 transition-colors duration-500 ease-mechanical hover:bg-charcoal/40 disabled:opacity-40"
                        >
                            <span
                                aria-hidden
                                className="h-2.5 w-2.5 shrink-0 border border-platinum-dim transition-colors duration-500 ease-mechanical group-hover:border-bronze"
                            />
                            <span className="font-sans text-[0.6rem] uppercase tracking-[0.28em] text-platinum-dim transition-colors duration-500 ease-mechanical [writing-mode:vertical-rl] group-hover:text-bronze">
                                {AGENT_NAMES[i]}
                            </span>
                        </button>
                    );
                }

                return (
                    <section key={i} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-obsidian">
                        <header className="shrink-0 border-b border-stone-line px-5 py-3">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => onToggle(i)}
                                    disabled={anyLoading}
                                    title={`Silence ${AGENT_NAMES[i]}`}
                                    className="flex items-center gap-2.5 transition-colors duration-500 ease-mechanical disabled:opacity-40"
                                >
                                    <span
                                        aria-hidden
                                        className="flex h-2.5 w-2.5 shrink-0 items-center justify-center border border-bronze bg-bronze/25"
                                    >
                                        <svg width="6" height="5" viewBox="0 0 6 5" fill="none">
                                            <path
                                                d="M1 2.5L2.5 4L5 1"
                                                stroke="var(--color-bronze-bright)"
                                                strokeWidth="1.1"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </span>
                                    <span className="font-sans text-[0.62rem] uppercase tracking-[0.28em] text-bronze-bright">
                                        {AGENT_NAMES[i]}
                                    </span>
                                </button>
                                {agent.loading && (
                                    <span className="ml-auto flex gap-1" aria-label="Generating">
                                        {[0, 150, 300].map((d) => (
                                            <span
                                                key={d}
                                                className="h-1 w-1 animate-pulse rounded-full bg-bronze"
                                                style={{ animationDelay: `${d}ms` }}
                                            />
                                        ))}
                                    </span>
                                )}
                            </div>
                            <div className="mt-2.5 flex items-center gap-3">
                                <ModelSelect
                                    value={agent.model}
                                    onChange={(model) => onModelChange(i, model)}
                                    disabled={anyLoading}
                                    ariaLabel={`${AGENT_NAMES[i]} model`}
                                    className="min-w-0 flex-1 cursor-pointer appearance-none truncate bg-transparent font-mono text-[0.6rem] uppercase tracking-[0.12em] text-bronze outline-none transition-colors duration-500 ease-mechanical hover:text-bronze-bright disabled:opacity-40"
                                />
                                <button
                                    type="button"
                                    onClick={() => onOpenPrompt(i)}
                                    disabled={anyLoading}
                                    className="shrink-0 font-sans text-[0.58rem] uppercase tracking-[0.24em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:text-bronze-bright disabled:opacity-30"
                                >
                                    Prompt
                                </button>
                            </div>
                            <div className="mt-1 flex items-baseline justify-between gap-3 font-mono text-[0.55rem] tracking-[0.1em] text-platinum-dim">
                                {meta && <span>{meta.cost} · {meta.context}</span>}
                                {used && <span className="text-platinum">{formatUsage(used)}</span>}
                            </div>
                        </header>

                        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6">
                            {agent.messages.length === 0 && (
                                <p className="pt-10 text-center font-serif text-base font-light text-platinum-dim">
                                    Silent.
                                </p>
                            )}
                            {agent.messages.map((msg, mi) =>
                                msg.role === 'user' ? (
                                    <div key={mi} className="border-l border-bronze bg-charcoal/50 px-4 py-3">
                                        <p className="whitespace-pre-wrap font-serif text-base font-light leading-relaxed text-marble">
                                            {msg.content}
                                        </p>
                                    </div>
                                ) : (
                                    <div
                                        key={mi}
                                        className={`prose-kyros text-[0.9rem] leading-[1.8] ${
                                            agent.error ? 'text-platinum-dim' : 'text-marble-dim'
                                        }`}
                                    >
                                        {msg.content ? (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                        ) : (
                                            <span className="flex items-center gap-1.5" aria-label="Generating">
                                                {[0, 200, 400].map((d) => (
                                                    <span
                                                        key={d}
                                                        className="h-1 w-1 animate-pulse rounded-full bg-bronze"
                                                        style={{ animationDelay: `${d}ms` }}
                                                    />
                                                ))}
                                            </span>
                                        )}
                                    </div>
                                ),
                            )}
                            <div
                                ref={(el) => {
                                    bottomRefs.current[i] = el;
                                }}
                            />
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
