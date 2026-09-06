'use client';

import { useState } from 'react';
import { MODELS, TIER_ORDER, TIER_LABELS, modelsByTier, modelTier } from '@/lib/models';
import type { Model, ModelTier } from '@/lib/models';

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
    return `$${n.toFixed(2)}`;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: ModelTier }) {
    const colours: Record<ModelTier, string> = {
        low: 'text-platinum-dim border-stone-line',
        mid: 'text-bronze border-bronze/40',
        high: 'text-bronze-bright border-bronze-bright/40',
    };
    return (
        <span className={`shrink-0 border px-1.5 py-px font-mono text-[0.48rem] uppercase tracking-[0.18em] ${colours[tier]}`}>
            {tier}
        </span>
    );
}

function ModelRow({
    model,
    onEdit,
}: {
    model: Model;
    onEdit: (m: Model) => void;
}) {
    const tier = modelTier(model);
    return (
        <tr
            className="group cursor-pointer border-b border-stone-line transition-colors duration-200 ease-mechanical hover:bg-charcoal/60"
            onClick={() => onEdit(model)}
        >
            <td className="py-3 pl-6 pr-4">
                <div className="flex items-center gap-2.5">
                    <TierBadge tier={tier} />
                    <span className="font-serif text-[0.9rem] font-light text-marble">{model.label}</span>
                </div>
                <p className="mt-0.5 font-mono text-[0.56rem] tracking-[0.1em] text-platinum-dim">{model.id}</p>
            </td>
            <td className="px-4 py-3 text-right font-mono text-[0.65rem] tracking-[0.08em] text-platinum-dim">
                {model.context}
            </td>
            <td className="px-4 py-3 text-right font-mono text-[0.65rem] tracking-[0.08em] text-platinum-dim">
                {fmt(model.inputCost)}
            </td>
            <td className="px-4 py-3 text-right font-mono text-[0.65rem] tracking-[0.08em] text-platinum-dim">
                {fmt(model.outputCost)}
            </td>
            <td className="px-4 py-3 text-right font-mono text-[0.65rem] tracking-[0.08em] text-platinum-dim">
                {model.maxTokens.toLocaleString()}
            </td>
            <td className="py-3 pl-4 pr-6 text-right">
                <span className="font-mono text-[0.52rem] uppercase tracking-[0.18em] text-stone-line opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    Edit
                </span>
            </td>
        </tr>
    );
}

// ─── edit drawer ──────────────────────────────────────────────────────────────

interface EditState {
    id: string;
    label: string;
    inputCost: string;
    outputCost: string;
    context: string;
    maxTokens: string;
}

function EditDrawer({
    model,
    onClose,
}: {
    model: Model;
    onClose: () => void;
}) {
    const [form, setForm] = useState<EditState>({
        id: model.id,
        label: model.label,
        inputCost: String(model.inputCost),
        outputCost: String(model.outputCost),
        context: model.context,
        maxTokens: String(model.maxTokens),
    });
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    function field(key: keyof EditState) {
        return {
            value: form[key],
            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((prev) => ({ ...prev, [key]: e.target.value })),
        };
    }

    async function save() {
        setStatus('saving');
        try {
            const res = await fetch('/api/models', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalId: model.id,
                    id: form.id.trim(),
                    label: form.label.trim(),
                    inputCost: parseFloat(form.inputCost),
                    outputCost: parseFloat(form.outputCost),
                    context: form.context.trim(),
                    maxTokens: parseInt(form.maxTokens, 10),
                }),
            });
            if (!res.ok) throw new Error();
            setStatus('saved');
            setTimeout(() => { setStatus('idle'); onClose(); }, 800);
        } catch {
            setStatus('error');
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-end" aria-modal="true" role="dialog" aria-label={`Edit ${model.label}`}>
            {/* backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
                aria-hidden
            />

            {/* panel */}
            <aside className="relative flex h-full w-96 flex-col border-l border-stone-line bg-charcoal shadow-2xl">
                <header className="flex shrink-0 items-center justify-between border-b border-stone-line px-6 py-4">
                    <div>
                        <p className="font-sans text-[0.55rem] uppercase tracking-[0.24em] text-platinum-dim">Edit Model</p>
                        <h2 className="mt-0.5 font-serif text-xl font-light tracking-[0.1em] text-marble">{model.label}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="flex h-7 w-7 items-center justify-center text-platinum-dim transition-colors duration-200 hover:text-platinum"
                    >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                            <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="flex flex-col gap-5">
                        <Field label="OpenRouter ID" hint="e.g. anthropic/claude-sonnet-4-5">
                            <input {...field('id')} className={INPUT_CLS} spellCheck={false} />
                        </Field>
                        <Field label="Display label">
                            <input {...field('label')} className={INPUT_CLS} />
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Input cost / 1M">
                                <input {...field('inputCost')} type="number" step="0.01" min="0" className={INPUT_CLS} />
                            </Field>
                            <Field label="Output cost / 1M">
                                <input {...field('outputCost')} type="number" step="0.01" min="0" className={INPUT_CLS} />
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Context window">
                                <input {...field('context')} className={INPUT_CLS} placeholder="e.g. 1M" />
                            </Field>
                            <Field label="Max output tokens">
                                <input {...field('maxTokens')} type="number" step="1000" min="0" className={INPUT_CLS} />
                            </Field>
                        </div>
                    </div>
                </div>

                <footer className="flex shrink-0 items-center justify-between border-t border-stone-line px-6 py-4">
                    <StatusLabel status={status} />
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="font-sans text-[0.6rem] uppercase tracking-[0.2em] text-platinum-dim transition-colors duration-200 hover:text-platinum"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={save}
                            disabled={status === 'saving'}
                            className="border border-bronze/60 px-4 py-1.5 font-sans text-[0.6rem] uppercase tracking-[0.2em] text-bronze transition-colors duration-200 hover:border-bronze hover:text-bronze-bright disabled:opacity-40"
                        >
                            {status === 'saving' ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </footer>
            </aside>
        </div>
    );
}

const INPUT_CLS =
    'w-full border border-stone-line bg-transparent px-3 py-2 font-mono text-[0.72rem] tracking-[0.06em] text-platinum outline-none transition-colors duration-200 ease-mechanical placeholder:text-platinum-dim focus:border-bronze/60';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[0.55rem] uppercase tracking-[0.22em] text-platinum-dim">
                {label}
                {hint && <span className="ml-2 normal-case tracking-normal text-platinum-dim/60">{hint}</span>}
            </label>
            {children}
        </div>
    );
}

function StatusLabel({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
    if (status === 'idle') return <span />;
    const cls =
        status === 'error'
            ? 'text-bronze-bright'
            : status === 'saved'
                ? 'text-platinum-dim'
                : 'animate-pulse text-bronze';
    return (
        <span className={`font-mono text-[0.58rem] uppercase tracking-[0.2em] ${cls}`}>
            {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : '⚠ Failed'}
        </span>
    );
}

// ─── search filter ────────────────────────────────────────────────────────────

function filterModels(models: Model[], query: string): Model[] {
    const q = query.trim().toLowerCase();
    if (!q) return models;
    return models.filter(
        (m) =>
            m.label.toLowerCase().includes(q) ||
            m.id.toLowerCase().includes(q) ||
            m.context.toLowerCase().includes(q),
    );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ModelsPage() {
    const grouped = modelsByTier();
    const [editing, setEditing] = useState<Model | null>(null);
    const [query, setQuery] = useState('');

    const isFiltering = query.trim().length > 0;
    const filteredTotal = isFiltering ? filterModels(MODELS, query).length : MODELS.length;

    return (
        <div className="flex h-[calc(100svh-4rem-1px)] flex-col overflow-hidden">
            {/* header */}
            <header className="shrink-0 border-b border-stone-line px-8 py-5">
                <p className="font-sans text-[0.55rem] uppercase tracking-[0.26em] text-platinum-dim">Settings</p>
                <h1 className="mt-1 font-serif text-2xl font-light tracking-[0.14em] text-marble">Models</h1>
                <p className="mt-1.5 font-sans text-[0.65rem] leading-relaxed tracking-[0.06em] text-platinum-dim">
                    All models are routed through OpenRouter. Costs are USD per 1M tokens and shown for reference only.
                </p>

                {/* search */}
                <div className="relative mt-4 max-w-sm">
                    <svg
                        width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-platinum-dim"
                    >
                        <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search models…"
                        aria-label="Search models"
                        className="w-full border border-stone-line bg-transparent py-1.5 pl-8 pr-3 font-mono text-[0.68rem] tracking-[0.06em] text-platinum outline-none transition-colors duration-200 ease-mechanical placeholder:text-platinum-dim focus:border-bronze/60"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            aria-label="Clear search"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-platinum-dim transition-colors duration-200 hover:text-platinum"
                        >
                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden>
                                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                            </svg>
                        </button>
                    )}
                </div>
            </header>

            {/* table */}
            <div className="flex-1 overflow-y-auto">
                {TIER_ORDER.map((tier) => {
                    const rows = filterModels(grouped[tier], query);
                    if (!rows.length) return null;
                    return (
                        <section key={tier}>
                            <div className="sticky top-0 z-10 border-b border-stone-line bg-charcoal px-6 py-2">
                                <span className="font-sans text-[0.55rem] uppercase tracking-[0.24em] text-platinum-dim">
                                    {TIER_LABELS[tier]}
                                </span>
                            </div>
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-stone-line/40">
                                        <th className="py-2 pl-6 pr-4 text-left font-sans text-[0.52rem] uppercase tracking-[0.2em] text-platinum-dim">Model</th>
                                        <th className="px-4 py-2 text-right font-sans text-[0.52rem] uppercase tracking-[0.2em] text-platinum-dim">Context</th>
                                        <th className="px-4 py-2 text-right font-sans text-[0.52rem] uppercase tracking-[0.2em] text-platinum-dim">Input</th>
                                        <th className="px-4 py-2 text-right font-sans text-[0.52rem] uppercase tracking-[0.2em] text-platinum-dim">Output</th>
                                        <th className="px-4 py-2 text-right font-sans text-[0.52rem] uppercase tracking-[0.2em] text-platinum-dim">Max tokens</th>
                                        <th className="py-2 pl-4 pr-6" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((m) => (
                                        <ModelRow key={m.id} model={m} onEdit={setEditing} />
                                    ))}
                                </tbody>
                            </table>
                        </section>
                    );
                })}

                {/* empty state */}
                {filteredTotal === 0 && (
                    <div className="flex flex-col items-center justify-center gap-2 py-20">
                        <p className="font-serif text-lg font-light tracking-[0.1em] text-marble">No models found</p>
                        <p className="font-mono text-[0.62rem] tracking-[0.08em] text-platinum-dim">
                            No match for <span className="text-bronze">"{query}"</span>
                        </p>
                    </div>
                )}

                {/* summary */}
                <div className="border-t border-stone-line px-6 py-4">
                    <span className="font-mono text-[0.58rem] tracking-[0.1em] text-platinum-dim">
                        {isFiltering
                            ? `${filteredTotal} of ${MODELS.length} models`
                            : `${MODELS.length} models`}
                    </span>
                </div>
            </div>

            {/* edit drawer */}
            {editing && (
                <EditDrawer model={editing} onClose={() => setEditing(null)} />
            )}
        </div>
    );
}
