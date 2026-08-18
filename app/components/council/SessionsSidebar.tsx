'use client';

import { useRef, useState } from 'react';
import { formatCost, formatTime, usageForAgent, type SavedSession } from './types';

interface Props {
    sessions: SavedSession[];
    open: boolean;
    hasMessages: boolean;
    anyLoading: boolean;
    activeId: string | null;
    onToggle: () => void;
    onNew: () => void;
    onRestore: (session: SavedSession) => void;
    onDelete: (id: string) => void;
    onRename: (id: string, title: string) => void;
}

const MODE_GLYPH: Record<string, string> = { parallel: '‖', cascade: '↓', loop: '↻' };

export default function SessionsSidebar({
    sessions,
    open,
    hasMessages,
    anyLoading,
    activeId,
    onToggle,
    onNew,
    onRestore,
    onDelete,
    onRename,
}: Props) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draft, setDraft] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    function startEdit(session: SavedSession, e: React.MouseEvent) {
        e.stopPropagation();
        setEditingId(session.id);
        setDraft(session.title ?? session.firstQuestion);
        setTimeout(() => inputRef.current?.select(), 0);
    }

    function commit(id: string) {
        setEditingId(null);
        onRename(id, draft);
    }

    return (
        <aside
            className={`hidden shrink-0 flex-col overflow-hidden border-r border-stone-line bg-obsidian-800 transition-[width] duration-500 ease-mechanical md:flex ${open ? 'w-56' : 'w-11'
                }`}
        >
            {!open ? (
                <button
                    type="button"
                    onClick={onToggle}
                    aria-label="Expand archive"
                    className="flex w-full flex-col items-center gap-3 pt-4 text-platinum-dim transition-colors duration-500 ease-mechanical hover:text-bronze-bright"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                        <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {sessions.length > 0 && (
                        <span className="font-mono text-[0.55rem] tracking-[0.1em]">{sessions.length}</span>
                    )}
                </button>
            ) : (
                <>
                    <div className="flex shrink-0 items-center justify-between border-b border-stone-line px-4 py-4">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onToggle}
                                aria-label="Collapse archive"
                                className="text-platinum-dim transition-colors duration-500 ease-mechanical hover:text-bronze-bright"
                            >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                                    <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            <span className="font-sans text-[0.58rem] uppercase tracking-[0.32em] text-platinum-dim">
                                Archive
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={onNew}
                            disabled={!hasMessages || anyLoading}
                            className="font-sans text-[0.58rem] uppercase tracking-[0.24em] text-bronze transition-colors duration-500 ease-mechanical hover:text-bronze-bright disabled:opacity-25"
                        >
                            New
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {sessions.length === 0 ? (
                            <p className="px-4 py-8 text-center font-serif text-sm font-light leading-relaxed text-platinum-dim">
                                Nothing archived yet.
                            </p>
                        ) : (
                            <ul className="divide-y divide-stone-line">
                                {sessions.map((s) => (
                                    <li
                                        key={s.id}
                                        className={`group px-4 py-3 transition-colors duration-500 ease-mechanical hover:bg-charcoal ${s.id === activeId ? 'bg-charcoal' : ''
                                            }`}
                                    >
                                        {editingId === s.id ? (
                                            <input
                                                ref={inputRef}
                                                value={draft}
                                                onChange={(e) => setDraft(e.target.value)}
                                                onBlur={() => commit(s.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') { e.preventDefault(); commit(s.id); }
                                                    if (e.key === 'Escape') { e.preventDefault(); setEditingId(null); }
                                                }}
                                                className="w-full border-b border-bronze-dim bg-transparent pb-0.5 font-serif text-sm text-bronze-bright outline-none"
                                            />
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => onRestore(s)}
                                                className="w-full text-left"
                                            >
                                                <p className="line-clamp-2 font-serif text-sm font-light leading-snug text-marble-dim">
                                                    {s.title ?? s.firstQuestion}
                                                </p>
                                                <p className="mt-1.5 font-mono text-[0.55rem] tracking-[0.14em] text-platinum-dim">
                                                    {MODE_GLYPH[s.mode]} {s.mode} · {formatTime(s.savedAt)}
                                                    {(() => {
                                                        // Sessions saved before usage tracking have none.
                                                        const u = usageForAgent(s.turns);
                                                        return u ? ` · ${formatCost(u.cost)}` : '';
                                                    })()}
                                                </p>
                                            </button>
                                        )}
                                        <div className="mt-1.5 flex items-center gap-3 opacity-0 transition-opacity duration-500 ease-mechanical group-hover:opacity-100">
                                            <button
                                                type="button"
                                                onClick={(e) => startEdit(s, e)}
                                                className="font-sans text-[0.55rem] uppercase tracking-[0.2em] text-platinum-dim hover:text-bronze-bright"
                                            >
                                                Rename
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDelete(s.id)}
                                                className="font-sans text-[0.55rem] uppercase tracking-[0.2em] text-platinum-dim hover:text-marble"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </>
            )}
        </aside>
    );
}
