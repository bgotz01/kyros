'use client';

import { useEffect } from 'react';
import { AGENT_NAMES, DEFAULT_PROMPTS, type AgentConfig } from './types';

interface Props {
    agents: AgentConfig[];
    tab: number;
    onTabChange: (idx: number) => void;
    onPromptChange: (idx: number, prompt: string) => void;
    onClose: () => void;
}

/** Each agent's persona, editable. Changes persist to localStorage through the
 *  page's preference effect — there is no separate save. */
export default function PromptsModal({ agents, tab, onTabChange, onPromptChange, onClose }: Props) {
    useEffect(() => {
        const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', fn);
        return () => window.removeEventListener('keydown', fn);
    }, [onClose]);

    const isDefault = agents[tab].systemPrompt === DEFAULT_PROMPTS[tab];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/85 px-6 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Agent prompts"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[80vh] w-full max-w-3xl flex-col border border-stone-line-strong bg-charcoal"
            >
                <header className="flex shrink-0 items-center justify-between border-b border-stone-line px-6 py-4">
                    <h2 className="font-serif text-lg font-light tracking-wide text-marble">Personas</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="font-sans text-[0.6rem] uppercase tracking-[0.28em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:text-bronze-bright"
                    >
                        Close
                    </button>
                </header>

                <div className="flex shrink-0 gap-px border-b border-stone-line bg-stone-line">
                    {agents.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => onTabChange(i)}
                            className={`flex-1 bg-charcoal px-4 py-3 text-left transition-colors duration-500 ease-mechanical ${
                                tab === i ? 'bg-charcoal-700' : 'hover:bg-charcoal-700/60'
                            }`}
                        >
                            <span
                                className={`font-sans text-[0.62rem] uppercase tracking-[0.24em] ${
                                    tab === i ? 'text-bronze-bright' : 'text-platinum-dim'
                                }`}
                            >
                                {AGENT_NAMES[i]}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <textarea
                        value={agents[tab].systemPrompt}
                        onChange={(e) => onPromptChange(tab, e.target.value)}
                        spellCheck={false}
                        rows={16}
                        className="w-full resize-none border border-stone-line bg-obsidian p-4 font-mono text-[0.72rem] leading-[1.75] text-marble-dim outline-none transition-colors duration-500 ease-mechanical focus:border-bronze-dim"
                    />
                </div>

                <footer className="flex shrink-0 items-center justify-between border-t border-stone-line px-6 py-4">
                    <p className="font-sans text-[0.6rem] uppercase tracking-[0.22em] text-platinum-dim">
                        {isDefault ? 'Default persona' : 'Edited'}
                    </p>
                    <button
                        type="button"
                        onClick={() => onPromptChange(tab, DEFAULT_PROMPTS[tab])}
                        disabled={isDefault}
                        className="font-sans text-[0.6rem] uppercase tracking-[0.24em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:text-bronze-bright disabled:opacity-30"
                    >
                        Restore default
                    </button>
                </footer>
            </div>
        </div>
    );
}
