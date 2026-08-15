'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PageRefMeta } from '@/app/components/council/types';

// ─── types ────────────────────────────────────────────────────────────────────

interface GroupEntry {
    group: string;
    tag?: string;
    refs: PageRefMeta[];
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function groupRefs(refs: PageRefMeta[]): GroupEntry[] {
    const map = new Map<string, GroupEntry>();
    for (const ref of refs) {
        const existing = map.get(ref.group);
        if (existing) {
            existing.refs.push(ref);
        } else {
            map.set(ref.group, { group: ref.group, tag: ref.tag, refs: [ref] });
        }
    }
    return [...map.values()];
}

/** "AI · Canon" → "AI" */
function domainOf(group: string): string {
    return group.split('·')[0].trim();
}

/** "AI · Canon" → "Canon" */
function shortGroupLabel(group: string): string {
    return group.split('·').slice(1).join('·').trim() || group;
}

function uniqueDomains(groups: GroupEntry[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const g of groups) {
        const d = domainOf(g.group);
        if (!seen.has(d)) { seen.add(d); out.push(d); }
    }
    return out;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function SaveStatus({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
    if (status === 'idle') return null;
    return (
        <span className={`font-mono text-[0.6rem] uppercase tracking-[0.24em] transition-opacity duration-500 ease-mechanical ${status === 'error' ? 'text-bronze-bright' :
                status === 'saved' ? 'text-platinum-dim' :
                    'animate-pulse text-bronze'
            }`}>
            {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : '⚠ Save failed'}
        </span>
    );
}

function Chevron({ open, size = 7 }: { open: boolean; size?: number }) {
    return (
        <svg
            width={size} height={size} viewBox="0 0 8 8" fill="none" aria-hidden
            className={`shrink-0 text-platinum-dim transition-transform duration-500 ease-mechanical ${open ? 'rotate-90' : ''}`}
        >
            <path d="M2 1L5.5 4L2 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ContextPage() {
    const [groups, setGroups] = useState<GroupEntry[]>([]);
    const [catalogueStatus, setCatalogueStatus] = useState<'loading' | 'ready' | 'error'>('loading');

    const [selectedRef, setSelectedRef] = useState<PageRefMeta | null>(null);
    // Two-level expansion: domains (top) and groups (second)
    const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const [editorContent, setEditorContent] = useState('');
    const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'error'>('idle');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [dirty, setDirty] = useState(false);

    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── load catalogue ────────────────────────────────────────────────────────

    useEffect(() => {
        fetch('/api/context')
            .then((r) => r.json())
            .then((data: PageRefMeta[]) => {
                const g = groupRefs(data);
                setGroups(g);
                setCatalogueStatus('ready');
                // Auto-expand the first domain
                const domains = uniqueDomains(g);
                if (domains.length > 0) setExpandedDomains(new Set([domains[0]]));
            })
            .catch(() => setCatalogueStatus('error'));
    }, []);

    // ── load file ─────────────────────────────────────────────────────────────

    const loadRef = useCallback((ref: PageRefMeta) => {
        setSelectedRef(ref);
        setDirty(false);
        setSaveStatus('idle');
        setLoadStatus('loading');
        fetch(`/api/context/${ref.id}`)
            .then((r) => r.json())
            .then((data: { content?: string; error?: string }) => {
                if (data.error) throw new Error(data.error);
                setEditorContent(data.content ?? '');
                setLoadStatus('idle');
            })
            .catch(() => setLoadStatus('error'));
    }, []);

    // ── auto-save ─────────────────────────────────────────────────────────────

    const scheduleSave = useCallback((ref: PageRefMeta, content: string) => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        if (savedTimer.current) clearTimeout(savedTimer.current);
        setSaveStatus('saving');
        saveTimer.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/context/${ref.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content }),
                });
                if (!res.ok) throw new Error();
                setSaveStatus('saved');
                setDirty(false);
                savedTimer.current = setTimeout(() => setSaveStatus('idle'), 2000);
            } catch {
                setSaveStatus('error');
            }
        }, 800);
    }, []);

    function handleEditorChange(value: string) {
        setEditorContent(value);
        setDirty(true);
        if (selectedRef) scheduleSave(selectedRef, value);
    }

    // ── tree toggles ──────────────────────────────────────────────────────────

    function toggleDomain(domain: string) {
        setExpandedDomains((prev) => {
            const next = new Set(prev);
            if (next.has(domain)) next.delete(domain); else next.add(domain);
            return next;
        });
    }

    function toggleGroup(group: string) {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(group)) next.delete(group); else next.add(group);
            return next;
        });
    }

    // ── derived ───────────────────────────────────────────────────────────────

    const domains = uniqueDomains(groups);

    // ── render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex h-[calc(100svh-4rem-1px)] overflow-hidden">

            {/* ── left panel: expandable domain → group → file tree ─────────── */}
            <aside className="flex w-60 shrink-0 flex-col overflow-hidden border-r border-stone-line">
                <div className="shrink-0 border-b border-stone-line px-4 py-3">
                    <span className="font-sans text-[0.58rem] uppercase tracking-[0.26em] text-platinum-dim">
                        Corpus
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto py-1">
                    {catalogueStatus === 'loading' && (
                        <p className="px-4 py-6 font-serif text-sm font-light text-platinum-dim">Loading…</p>
                    )}
                    {catalogueStatus === 'error' && (
                        <p className="px-4 py-6 font-mono text-[0.65rem] text-bronze-bright">⚠ Failed</p>
                    )}

                    {catalogueStatus === 'ready' && domains.map((domain) => {
                        const domainOpen = expandedDomains.has(domain);
                        const domainGroups = groups.filter((g) => domainOf(g.group) === domain);
                        const totalRefs = domainGroups.reduce((n, g) => n + g.refs.length, 0);

                        return (
                            <div key={domain}>
                                {/* domain row */}
                                <button
                                    type="button"
                                    onClick={() => toggleDomain(domain)}
                                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors duration-300 ease-mechanical hover:bg-charcoal/40"
                                >
                                    <Chevron open={domainOpen} />
                                    <span className="flex-1 font-sans text-[0.63rem] uppercase tracking-[0.22em] text-platinum">
                                        {domain}
                                    </span>
                                    <span className="font-mono text-[0.52rem] tracking-[0.1em] text-platinum-dim">
                                        {totalRefs}
                                    </span>
                                </button>

                                {/* group rows */}
                                {domainOpen && domainGroups.map((entry) => {
                                    const groupOpen = expandedGroups.has(entry.group);
                                    const label = shortGroupLabel(entry.group);

                                    return (
                                        <div key={entry.group}>
                                            <button
                                                type="button"
                                                onClick={() => toggleGroup(entry.group)}
                                                className="flex w-full items-center gap-2 py-2 pl-7 pr-3 text-left transition-colors duration-300 ease-mechanical hover:bg-charcoal/40"
                                            >
                                                <Chevron open={groupOpen} size={6} />
                                                <span className="flex-1 truncate font-sans text-[0.57rem] uppercase tracking-[0.16em] text-platinum-dim">
                                                    {label}
                                                </span>
                                                {entry.tag && (
                                                    <span className="shrink-0 border border-stone-line px-1 py-px font-mono text-[0.44rem] uppercase tracking-[0.12em] text-platinum-dim">
                                                        {entry.tag}
                                                    </span>
                                                )}
                                                <span className="ml-1 font-mono text-[0.5rem] tracking-[0.08em] text-platinum-dim">
                                                    {entry.refs.length}
                                                </span>
                                            </button>

                                            {/* file rows */}
                                            {groupOpen && (
                                                <ul>
                                                    {entry.refs.map((ref) => {
                                                        const active = selectedRef?.id === ref.id;
                                                        return (
                                                            <li key={ref.id}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => loadRef(ref)}
                                                                    className={`flex w-full items-center gap-2 py-1.5 pl-12 pr-3 text-left transition-colors duration-300 ease-mechanical hover:bg-charcoal/50 ${active ? 'bg-charcoal/60' : ''}`}
                                                                >
                                                                    <span className={`truncate font-serif text-[0.84rem] font-light leading-snug ${active ? 'text-marble' : 'text-platinum'}`}>
                                                                        {ref.label}
                                                                    </span>
                                                                    {active && dirty && (
                                                                        <span aria-label="unsaved" className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-bronze" />
                                                                    )}
                                                                </button>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </aside>

            {/* ── right panel: editor ───────────────────────────────────────── */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                {selectedRef ? (
                    <>
                        <header className="flex shrink-0 items-center justify-between gap-6 border-b border-stone-line px-8 py-4">
                            <div className="flex min-w-0 items-baseline gap-4">
                                <h1 className="truncate font-serif text-xl font-light tracking-[0.12em] text-marble">
                                    {selectedRef.label}
                                </h1>
                                <span className="shrink-0 font-mono text-[0.58rem] tracking-[0.14em] text-platinum-dim">
                                    {selectedRef.group}
                                </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-6">
                                <SaveStatus status={saveStatus} />
                                <span className="font-mono text-[0.58rem] tracking-[0.14em] text-platinum-dim">
                                    {selectedRef.id}.md
                                </span>
                            </div>
                        </header>

                        {loadStatus === 'loading' ? (
                            <div className="flex flex-1 items-center justify-center">
                                <p className="font-serif text-base font-light text-platinum-dim">Reading…</p>
                            </div>
                        ) : loadStatus === 'error' ? (
                            <div className="flex flex-1 items-center justify-center">
                                <p className="font-mono text-[0.65rem] tracking-[0.1em] text-bronze-bright">⚠ Could not read the file.</p>
                            </div>
                        ) : (
                            <textarea
                                value={editorContent}
                                onChange={(e) => handleEditorChange(e.target.value)}
                                spellCheck={false}
                                aria-label={`Edit ${selectedRef.label}`}
                                className="flex-1 resize-none bg-transparent px-8 py-6 font-mono text-[0.82rem] leading-relaxed tracking-[0.04em] text-platinum outline-none placeholder:text-platinum-dim"
                                placeholder="This document is empty."
                            />
                        )}
                    </>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-12 text-center">
                        <p className="font-serif text-2xl font-light tracking-[0.12em] text-marble">The Corpus</p>
                        <p className="max-w-sm font-sans text-[0.72rem] leading-relaxed tracking-[0.06em] text-platinum-dim">
                            Select a document from the left to read or edit it. Changes are saved automatically.
                        </p>
                        <p className="max-w-sm font-sans text-[0.62rem] leading-relaxed tracking-[0.06em] text-platinum-dim">
                            New files dropped into any registered folder under{' '}
                            <code className="font-mono text-[0.78em] text-bronze">context/</code>{' '}
                            appear here immediately — no restart required.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
