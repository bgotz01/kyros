'use client';

import { useEffect, useRef, useState } from 'react';
import {
    deleteMemoryEntryApi,
    mergeDistilledApi,
    newMemoryId,
    persistMemoryEntry,
} from './storage';
import type {
    CouncilMemory,
    DistilledMemory,
    MemoryCategory,
    MemoryEntry,
} from './types';

// ─── constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { id: MemoryCategory; label: string; hint: string }[] = [
    { id: 'theme', label: 'Themes', hint: 'Recurring topics or domains' },
    { id: 'preference', label: 'Preferences', hint: 'Style, depth, framing' },
    { id: 'good_idea', label: 'Good ideas', hint: 'Worth developing further' },
    { id: 'dismissed', label: 'Dismissed', hint: 'Set aside — do not re-suggest' },
    { id: 'question', label: 'Questions', hint: 'Standing, unresolved' },
];

function categoryLabel(cat: MemoryCategory): string {
    return CATEGORIES.find((c) => c.id === cat)?.label ?? cat;
}

// ─── props ────────────────────────────────────────────────────────────────────

interface Props {
    memory: CouncilMemory;
    /** Pre-loaded distilled items to review, when opened from Distill. */
    pendingDistilled?: DistilledMemory | null;
    /** Session id the distilled items came from. */
    distillSessionId?: string;
    onMemoryChange: (next: CouncilMemory) => void;
    onClose: () => void;
}

type View = 'memory' | 'review';

// ─── sub-components ───────────────────────────────────────────────────────────

function EntryRow({
    entry,
    onDelete,
    onEdit,
}: {
    entry: MemoryEntry;
    onDelete: (id: string) => void;
    onEdit: (entry: MemoryEntry) => void;
}) {
    return (
        <li className="group flex items-start gap-3 border-b border-stone-line/40 py-2.5 last:border-0">
            <span className="mt-0.5 shrink-0 font-sans text-[0.52rem] uppercase tracking-[0.22em] text-platinum-dim/60 w-20">
                {categoryLabel(entry.category)}
            </span>
            <span className="flex-1 font-serif text-sm font-light leading-relaxed text-marble-dim">
                {entry.text}
            </span>
            <div className="flex shrink-0 items-center gap-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <button
                    type="button"
                    onClick={() => onEdit(entry)}
                    className="font-sans text-[0.55rem] uppercase tracking-[0.22em] text-platinum-dim transition-colors duration-300 hover:text-bronze-bright"
                >
                    Edit
                </button>
                <button
                    type="button"
                    onClick={() => onDelete(entry.id)}
                    className="font-sans text-[0.55rem] uppercase tracking-[0.22em] text-platinum-dim transition-colors duration-300 hover:text-marble"
                >
                    Remove
                </button>
            </div>
        </li>
    );
}

/** Items extracted by the distill run, awaiting acceptance. */
function ReviewItem({
    text,
    category,
    accepted,
    onToggle,
}: {
    text: string;
    category: MemoryCategory;
    accepted: boolean;
    onToggle: () => void;
}) {
    return (
        <li
            className={`flex cursor-pointer items-start gap-3 border-b border-stone-line/40 py-2.5 last:border-0 transition-opacity duration-300 ${accepted ? '' : 'opacity-40'}`}
            onClick={onToggle}
        >
            <span
                aria-hidden
                className={`mt-1 h-2 w-2 shrink-0 border transition-colors duration-300 ${accepted ? 'border-bronze bg-bronze' : 'border-stone-line-strong bg-transparent'
                    }`}
            />
            <span className="mt-0.5 shrink-0 font-sans text-[0.52rem] uppercase tracking-[0.22em] text-platinum-dim/60 w-20">
                {categoryLabel(category)}
            </span>
            <span className="flex-1 font-serif text-sm font-light leading-relaxed text-marble-dim">
                {text}
            </span>
        </li>
    );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function MemoryModal({
    memory,
    pendingDistilled,
    distillSessionId,
    onMemoryChange,
    onClose,
}: Props) {
    const [view, setView] = useState<View>(pendingDistilled ? 'review' : 'memory');
    const [filterCat, setFilterCat] = useState<MemoryCategory | 'all'>('all');

    // ── editing a single entry ────────────────────────────────────────────────
    const [editingEntry, setEditingEntry] = useState<MemoryEntry | null>(null);
    const [editText, setEditText] = useState('');
    const [editCategory, setEditCategory] = useState<MemoryCategory>('theme');
    const editRef = useRef<HTMLTextAreaElement>(null);

    // ── new entry form ────────────────────────────────────────────────────────
    const [addingNew, setAddingNew] = useState(false);
    const [newText, setNewText] = useState('');
    const [newCategory, setNewCategory] = useState<MemoryCategory>('theme');

    // ── distill review ────────────────────────────────────────────────────────
    // Build a flat list of {category, text, accepted} from the distilled result.
    type ReviewItem_ = { category: MemoryCategory; text: string; accepted: boolean };
    const initialReview = (): ReviewItem_[] => {
        if (!pendingDistilled) return [];
        const items: ReviewItem_[] = [];
        const push = (cat: MemoryCategory, texts: string[]) =>
            texts.forEach((text) => text.trim() && items.push({ category: cat, text: text.trim(), accepted: true }));
        push('theme', pendingDistilled.themes ?? []);
        push('preference', pendingDistilled.preferences ?? []);
        push('good_idea', pendingDistilled.good_ideas ?? []);
        push('dismissed', pendingDistilled.dismissed ?? []);
        push('question', pendingDistilled.questions ?? []);
        return items;
    };
    const [reviewItems, setReviewItems] = useState<ReviewItem_[]>(initialReview);

    // ── keyboard ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const fn = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (editingEntry) { setEditingEntry(null); return; }
                if (addingNew) { setAddingNew(false); return; }
                onClose();
            }
        };
        window.addEventListener('keydown', fn);
        return () => window.removeEventListener('keydown', fn);
    }, [onClose, editingEntry, addingNew]);

    useEffect(() => {
        if (editingEntry && editRef.current) editRef.current.focus();
    }, [editingEntry]);

    // ── handlers ──────────────────────────────────────────────────────────────
    function handleDelete(id: string) {
        // Optimistic update, then persist.
        const next: CouncilMemory = {
            ...memory,
            entries: memory.entries.filter((e) => e.id !== id),
        };
        onMemoryChange(next);
        deleteMemoryEntryApi(id).catch(() => { });
    }

    function handleStartEdit(entry: MemoryEntry) {
        setEditingEntry(entry);
        setEditText(entry.text);
        setEditCategory(entry.category);
    }

    function handleSaveEdit() {
        if (!editingEntry || !editText.trim()) return;
        const updated: MemoryEntry = { ...editingEntry, text: editText.trim(), category: editCategory };
        const next: CouncilMemory = {
            ...memory,
            entries: memory.entries.map((e) => (e.id === updated.id ? updated : e)),
        };
        onMemoryChange(next);
        persistMemoryEntry(updated).catch(() => { });
        setEditingEntry(null);
    }

    function handleAddNew() {
        if (!newText.trim()) return;
        const entry: MemoryEntry = {
            id: newMemoryId(),
            category: newCategory,
            text: newText.trim(),
            addedAt: new Date().toISOString(),
        };
        const next: CouncilMemory = {
            ...memory,
            entries: [entry, ...memory.entries],
        };
        onMemoryChange(next);
        persistMemoryEntry(entry).catch(() => { });
        setNewText('');
        setAddingNew(false);
    }

    async function handleAcceptReview() {
        const accepted = reviewItems.filter((r) => r.accepted);
        if (accepted.length === 0) { onClose(); return; }

        // Re-shape accepted items back into DistilledMemory form.
        const distilled: DistilledMemory = { themes: [], preferences: [], good_ideas: [], dismissed: [], questions: [] };
        accepted.forEach(({ category, text }) => {
            if (category === 'theme') distilled.themes.push(text);
            else if (category === 'preference') distilled.preferences.push(text);
            else if (category === 'good_idea') distilled.good_ideas.push(text);
            else if (category === 'dismissed') distilled.dismissed.push(text);
            else if (category === 'question') distilled.questions.push(text);
        });

        const existingTexts = new Set(memory.entries.map((e) => e.text.trim().toLowerCase()));
        const next = await mergeDistilledApi(distilled, distillSessionId ?? 'manual', existingTexts);
        onMemoryChange(next);
        onClose();
    }

    // ── derived ───────────────────────────────────────────────────────────────
    const filtered =
        filterCat === 'all'
            ? memory.entries
            : memory.entries.filter((e) => e.category === filterCat);

    const totalCount = memory.entries.length;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/85 px-6 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Memory"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[85vh] w-full max-w-2xl flex-col border border-stone-line-strong bg-charcoal"
            >
                {/* ── header ── */}
                <header className="flex shrink-0 items-center justify-between border-b border-stone-line px-6 py-4">
                    <div className="flex items-baseline gap-6">
                        <h2 className="font-serif text-lg font-light tracking-wide text-marble">Memory</h2>
                        <div className="flex border border-stone-line">
                            {(['memory', 'review'] as View[]).map((v, i) => (
                                <button
                                    key={v}
                                    type="button"
                                    onClick={() => setView(v)}
                                    disabled={v === 'review' && !pendingDistilled}
                                    className={`px-3.5 py-1.5 font-sans text-[0.58rem] uppercase tracking-[0.24em] transition-colors duration-500 ease-mechanical disabled:opacity-30 ${i > 0 ? 'border-l border-stone-line' : ''
                                        } ${view === v ? 'bg-charcoal-700 text-bronze-bright' : 'text-platinum hover:text-marble'}`}
                                >
                                    {v === 'memory'
                                        ? `Store${totalCount > 0 ? ` (${totalCount})` : ''}`
                                        : `Review${pendingDistilled ? ` (${reviewItems.filter((r) => r.accepted).length})` : ''}`}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="font-sans text-[0.6rem] uppercase tracking-[0.28em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:text-bronze-bright"
                    >
                        Close
                    </button>
                </header>

                {/* ── memory view ── */}
                {view === 'memory' && (
                    <>
                        {/* filter tabs */}
                        <div className="flex shrink-0 items-center gap-0 overflow-x-auto border-b border-stone-line px-6">
                            {(['all', ...CATEGORIES.map((c) => c.id)] as const).map((cat) => {
                                const count =
                                    cat === 'all'
                                        ? totalCount
                                        : memory.entries.filter((e) => e.category === cat).length;
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setFilterCat(cat)}
                                        className={`shrink-0 px-3.5 py-2.5 font-sans text-[0.56rem] uppercase tracking-[0.22em] transition-colors duration-400 ease-mechanical ${filterCat === cat
                                            ? 'border-b border-bronze-bright text-bronze-bright'
                                            : 'text-platinum-dim hover:text-platinum'
                                            }`}
                                    >
                                        {cat === 'all' ? 'All' : categoryLabel(cat as MemoryCategory)}
                                        {count > 0 && (
                                            <span className="ml-1.5 font-mono text-[0.5rem] opacity-60">{count}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            {filtered.length === 0 ? (
                                <p className="py-10 text-center font-serif text-base font-light text-platinum-dim">
                                    {totalCount === 0 ? 'Nothing stored yet. Distill a session to begin.' : 'No entries in this category.'}
                                </p>
                            ) : (
                                <ul>
                                    {filtered.map((entry) =>
                                        editingEntry?.id === entry.id ? (
                                            // inline edit form
                                            <li key={entry.id} className="border-b border-stone-line/40 py-3 last:border-0">
                                                <div className="flex gap-3">
                                                    <select
                                                        value={editCategory}
                                                        onChange={(e) => setEditCategory(e.target.value as MemoryCategory)}
                                                        className="w-28 shrink-0 cursor-pointer appearance-none border border-stone-line bg-transparent px-2 py-1 font-sans text-[0.56rem] uppercase tracking-[0.18em] text-platinum-dim outline-none"
                                                    >
                                                        {CATEGORIES.map((c) => (
                                                            <option key={c.id} value={c.id} className="bg-charcoal text-marble normal-case tracking-normal">
                                                                {c.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <textarea
                                                        ref={editRef}
                                                        value={editText}
                                                        onChange={(e) => setEditText(e.target.value)}
                                                        rows={2}
                                                        className="flex-1 resize-none border border-stone-line bg-obsidian px-3 py-2 font-serif text-sm font-light text-marble outline-none"
                                                    />
                                                </div>
                                                <div className="mt-2 flex gap-4">
                                                    <button
                                                        type="button"
                                                        onClick={handleSaveEdit}
                                                        disabled={!editText.trim()}
                                                        className="font-sans text-[0.58rem] uppercase tracking-[0.22em] text-bronze transition-colors duration-300 hover:text-bronze-bright disabled:opacity-30"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingEntry(null)}
                                                        className="font-sans text-[0.58rem] uppercase tracking-[0.22em] text-platinum-dim transition-colors duration-300 hover:text-platinum"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </li>
                                        ) : (
                                            <EntryRow
                                                key={entry.id}
                                                entry={entry}
                                                onDelete={handleDelete}
                                                onEdit={handleStartEdit}
                                            />
                                        )
                                    )}
                                </ul>
                            )}

                            {/* add new entry */}
                            {addingNew ? (
                                <div className="mt-4 border border-stone-line p-4">
                                    <div className="flex gap-3">
                                        <select
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                                            className="w-28 shrink-0 cursor-pointer appearance-none border border-stone-line bg-transparent px-2 py-1 font-sans text-[0.56rem] uppercase tracking-[0.18em] text-platinum-dim outline-none"
                                        >
                                            {CATEGORIES.map((c) => (
                                                <option key={c.id} value={c.id} className="bg-charcoal text-marble normal-case tracking-normal">
                                                    {c.label}
                                                </option>
                                            ))}
                                        </select>
                                        <textarea
                                            value={newText}
                                            onChange={(e) => setNewText(e.target.value)}
                                            rows={2}
                                            placeholder="Enter a memory entry…"
                                            autoFocus
                                            className="flex-1 resize-none border border-stone-line bg-obsidian px-3 py-2 font-serif text-sm font-light text-marble outline-none placeholder:text-platinum-dim"
                                        />
                                    </div>
                                    <div className="mt-2 flex gap-4">
                                        <button
                                            type="button"
                                            onClick={handleAddNew}
                                            disabled={!newText.trim()}
                                            className="font-sans text-[0.58rem] uppercase tracking-[0.22em] text-bronze transition-colors duration-300 hover:text-bronze-bright disabled:opacity-30"
                                        >
                                            Add
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setAddingNew(false); setNewText(''); }}
                                            className="font-sans text-[0.58rem] uppercase tracking-[0.22em] text-platinum-dim transition-colors duration-300 hover:text-platinum"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setAddingNew(true)}
                                    className="mt-4 font-sans text-[0.58rem] uppercase tracking-[0.24em] text-platinum-dim transition-colors duration-300 hover:text-bronze-bright"
                                >
                                    + Add entry
                                </button>
                            )}
                        </div>
                    </>
                )}

                {/* ── review view ── */}
                {view === 'review' && (
                    <>
                        <p className="shrink-0 border-b border-stone-line px-6 py-3 font-sans text-[0.58rem] uppercase tracking-[0.2em] text-platinum-dim">
                            Toggle items to include in memory. Deselected items are discarded.
                        </p>
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            {reviewItems.length === 0 ? (
                                <p className="py-10 text-center font-serif text-base font-light text-platinum-dim">
                                    Nothing was extracted from this session.
                                </p>
                            ) : (
                                <ul>
                                    {reviewItems.map((item, i) => (
                                        <ReviewItem
                                            key={i}
                                            text={item.text}
                                            category={item.category}
                                            accepted={item.accepted}
                                            onToggle={() =>
                                                setReviewItems((prev) =>
                                                    prev.map((r, j) => j === i ? { ...r, accepted: !r.accepted } : r)
                                                )
                                            }
                                        />
                                    ))}
                                </ul>
                            )}
                        </div>

                        <footer className="shrink-0 flex items-center justify-between border-t border-stone-line px-6 py-3">
                            <button
                                type="button"
                                onClick={() => setReviewItems((prev) => prev.map((r) => ({ ...r, accepted: true })))}
                                className="font-sans text-[0.58rem] uppercase tracking-[0.22em] text-platinum-dim transition-colors duration-300 hover:text-platinum"
                            >
                                Select all
                            </button>
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="font-sans text-[0.58rem] uppercase tracking-[0.22em] text-platinum-dim transition-colors duration-300 hover:text-platinum"
                                >
                                    Discard all
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleAcceptReview()}
                                    disabled={reviewItems.filter((r) => r.accepted).length === 0}
                                    className="border border-stone-line-strong px-5 py-2 font-sans text-[0.62rem] uppercase tracking-[0.22em] text-marble-dim transition-colors duration-500 ease-mechanical hover:border-bronze hover:text-bronze-bright disabled:opacity-30"
                                >
                                    Commit to memory
                                </button>
                            </div>
                        </footer>
                    </>
                )}

                {/* ── memory view footer ── */}
                {view === 'memory' && memory.lastDistilledAt && (
                    <footer className="shrink-0 border-t border-stone-line px-6 py-3">
                        <p className="font-sans text-[0.56rem] uppercase tracking-[0.2em] text-platinum-dim/60">
                            Last distilled{' '}
                            {new Date(memory.lastDistilledAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                        </p>
                    </footer>
                )}
            </div>
        </div>
    );
}
