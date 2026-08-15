'use client';

import { MODELS } from '@/lib/models';
import ModelSelect from './ModelSelect';
import { AGENT_NAMES, type AgentConfig } from './types';

interface Props {
    agents: AgentConfig[];
    /** Index currently generating, or null. */
    loadingIdx: number | null;
    anyLoading: boolean;
    onModelChange: (idx: number, model: string) => void;
    onOpenPrompt: (idx: number) => void;
    /** Cascade only — which agents respond this turn. Omit to disable selection. */
    selected?: Set<number>;
    onToggle?: (idx: number) => void;
    /** Cascade only — ask one agent to read the thread and respond again. */
    onNudge?: (idx: number) => void;
    canNudge?: boolean;
    /** Rendered under the roster — loop rounds control, mode hint, etc. */
    footer?: React.ReactNode;
}

export default function AgentRail({
    agents,
    loadingIdx,
    anyLoading,
    onModelChange,
    onOpenPrompt,
    selected,
    onToggle,
    onNudge,
    canNudge,
    footer,
}: Props) {
    const selectable = Boolean(selected && onToggle);

    return (
        <aside className="hidden w-56 shrink-0 flex-col border-l border-stone-line bg-obsidian-800 lg:flex">
            <div className="shrink-0 border-b border-stone-line px-4 py-3">
                <span className="font-sans text-[0.6rem] uppercase tracking-[0.34em] text-platinum-dim">
                    Council
                </span>
            </div>

            <div className="flex-1 divide-y divide-stone-line overflow-y-auto">
                {agents.map((agent, i) => {
                    const meta = MODELS.find((m) => m.id === agent.model);
                    const isOn = selectable ? selected!.has(i) : true;
                    return (
                        <div
                            key={i}
                            onClick={() => { if (selectable && !anyLoading) onToggle!(i); }}
                            className={`px-4 py-3 transition-opacity duration-500 ease-mechanical ${
                                isOn ? 'bg-charcoal/40' : 'opacity-40 hover:opacity-70'
                            } ${selectable ? (anyLoading ? 'cursor-not-allowed' : 'cursor-pointer select-none') : ''}`}
                            title={selectable ? `${isOn ? 'Silence' : 'Include'} ${AGENT_NAMES[i]}` : undefined}
                        >
                            <div className="flex items-center gap-2.5">
                                {selectable && (
                                    <span
                                        aria-hidden
                                        className={`flex h-2.5 w-2.5 shrink-0 items-center justify-center border transition-colors duration-500 ease-mechanical ${
                                            isOn ? 'border-bronze bg-bronze/25' : 'border-platinum-dim'
                                        }`}
                                    >
                                        {isOn && (
                                            <svg width="6" height="5" viewBox="0 0 6 5" fill="none">
                                                <path
                                                    d="M1 2.5L2.5 4L5 1"
                                                    stroke="var(--color-bronze-bright)"
                                                    strokeWidth="1.1"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        )}
                                    </span>
                                )}
                                <span
                                    className={`font-sans text-[0.62rem] uppercase tracking-[0.24em] ${
                                        isOn ? 'text-bronze-bright' : 'text-platinum-dim'
                                    }`}
                                >
                                    {AGENT_NAMES[i]}
                                </span>
                                {loadingIdx === i && (
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

                            <div className="mt-2.5" onClick={(e) => e.stopPropagation()}>
                                <ModelSelect
                                    value={agent.model}
                                    onChange={(model) => onModelChange(i, model)}
                                    disabled={anyLoading}
                                    ariaLabel={`${AGENT_NAMES[i]} model`}
                                    className="w-full cursor-pointer appearance-none truncate bg-transparent font-mono text-[0.6rem] uppercase tracking-[0.12em] text-bronze outline-none transition-colors duration-500 ease-mechanical hover:text-bronze-bright disabled:opacity-40"
                                />
                                {meta && (
                                    <div className="mt-0.5 font-mono text-[0.55rem] tracking-[0.1em] text-platinum-dim">
                                        {meta.cost}
                                    </div>
                                )}
                            </div>

                            <div className="mt-2.5 flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onOpenPrompt(i); }}
                                    disabled={anyLoading}
                                    className="font-sans text-[0.58rem] uppercase tracking-[0.24em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:text-bronze-bright disabled:opacity-30"
                                >
                                    Prompt
                                </button>
                                {onNudge && canNudge && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); onNudge(i); }}
                                        disabled={anyLoading}
                                        className="font-sans text-[0.58rem] uppercase tracking-[0.24em] text-bronze transition-colors duration-500 ease-mechanical hover:text-bronze-bright disabled:opacity-30"
                                        title={`Ask ${AGENT_NAMES[i]} to read the thread and respond again`}
                                    >
                                        Respond
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {footer && <div className="shrink-0 border-t border-stone-line px-4 py-3">{footer}</div>}
        </aside>
    );
}
