'use client';

import Link from 'next/link';

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import {
    MODELS,
    activeModelsByTier,
    TIER_LABELS,
    TIER_ORDER,
    type Model,
    seedMuted,
    getMuted,
    onMutedChange,
} from '@/lib/models';

// ─── featured (pinned at the top of the dropdown) ────────────────────────────
const FEATURED_IDS = [
    'google/gemini-3.6-flash',
    'z-ai/glm-5.2',
    'openai/gpt-5.6-luna',
] as const;

const PANEL_WIDTH = 288; // px — w-72

interface Props {
    value: string;
    onChange: (model: string) => void;
    disabled?: boolean;
    ariaLabel: string;
    /** 'side' opens the panel beside the trigger, over the page, at full
     *  viewport height. For a control pinned to the foot of a narrow rail,
     *  where opening above leaves the list cramped against the edge. */
    placement?: 'auto' | 'side';
    /** Not used — kept for API compatibility. */
    className?: string;
}

function ModelRow({ model, active }: { model: Model; active: boolean }) {
    return (
        <div className="flex items-baseline justify-between gap-3">
            <span className={`truncate font-mono text-[0.62rem] uppercase tracking-[0.14em] ${active ? 'text-bronze-bright' : 'text-marble-dim'}`}>
                {model.label}
            </span>
            <span className="shrink-0 font-mono text-[0.55rem] tracking-[0.08em] text-platinum-dim whitespace-nowrap">
                ${model.inputCost.toFixed(2)} · ${model.outputCost.toFixed(2)}
            </span>
        </div>
    );
}

/** A fully custom dropdown rendered in a portal so it escapes any
 *  overflow:hidden ancestor (i.e. the AgentRail sidebar). */
export default function ModelSelect({ value, onChange, disabled, ariaLabel, placement = 'auto' }: Props) {
    const [open, setOpen] = useState(false);
    const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
    const triggerRef = useRef<HTMLButtonElement>(null);

    // Keep the dropdown in sync with the muted list
    const muted = useSyncExternalStore(onMutedChange, getMuted, getMuted);

    // Seed muted list from server once (no-op if already seeded)
    useEffect(() => {
        fetch('/api/models')
            .then((r) => r.json())
            .then(({ muted: ids }: { muted: string[] }) => seedMuted(ids))
            .catch(() => {/* non-fatal */ });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const tiers = activeModelsByTier();
    const featuredModels = FEATURED_IDS
        .map((id) => MODELS.find((m) => m.id === id))
        .filter((m): m is Model => m !== undefined && !muted.has(m.id));
    const selected = MODELS.find((m) => m.id === value);

    // Position the portal panel relative to the trigger on every open
    useLayoutEffect(() => {
        if (!open || !triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - 8;
        const spaceAbove = rect.top - 8;

        if (placement === 'side') {
            // Beside the rail, over the page. Room to the right unless the rail
            // is itself on the right, in which case it opens leftward.
            const right = rect.right + 8;
            const fitsRight = right + PANEL_WIDTH + 8 <= window.innerWidth;
            const maxH = window.innerHeight - 16; // 8px margin top + bottom
            setPanelStyle({
                position: 'fixed',
                top: 8,
                maxHeight: maxH,
                left: fitsRight ? right : Math.max(8, rect.left - PANEL_WIDTH - 8),
                width: PANEL_WIDTH,
            });
            return;
        }

        // Prefer opening downward; flip up only if significantly more room above
        const openDown = spaceBelow >= 120 || spaceBelow >= spaceAbove;

        // Right-aligned to the trigger where there is room, which is how it sits
        // in the council's right-hand rail. Anchoring by `right` alone pushes the
        // panel off-screen when the trigger is in a left sidebar, so the position
        // is resolved as a clamped `left` instead.
        const preferred = rect.right - PANEL_WIDTH;
        const left = Math.min(Math.max(8, preferred), window.innerWidth - PANEL_WIDTH - 8);

        if (openDown) {
            setPanelStyle({
                position: 'fixed',
                top: rect.bottom + 6,
                left,
                width: PANEL_WIDTH,
                maxHeight: spaceBelow,
            });
        } else {
            setPanelStyle({
                position: 'fixed',
                bottom: window.innerHeight - rect.top + 6,
                left,
                width: PANEL_WIDTH,
                maxHeight: spaceAbove,
            });
        }
    }, [open, placement]);

    // Close on outside click or Escape
    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        function onPointer(e: MouseEvent) {
            const panel = document.getElementById('model-select-portal');
            if (
                !triggerRef.current?.contains(e.target as Node) &&
                !panel?.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onPointer);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onPointer);
        };
    }, [open]);

    function select(id: string) {
        onChange(id);
        setOpen(false);
    }

    const groups: { label: string; models: Model[] }[] = [
        { label: 'Featured', models: featuredModels },
        ...TIER_ORDER.map((tier) => ({ label: TIER_LABELS[tier], models: tiers[tier] })),
    ];

    const panel = open ? (
        <div
            id="model-select-portal"
            role="listbox"
            aria-label={ariaLabel}
            style={panelStyle}
            className="z-[9999] flex flex-col border border-stone-line bg-charcoal shadow-[0_8px_32px_rgba(0,0,0,0.7)]"
        >
            {/* scrollable model list */}
            <div className="min-h-0 flex-1 overflow-y-auto">
                {groups.map((group) => (
                    <div key={group.label}>
                        <div className="border-b border-stone-line px-3 py-1.5">
                            <span className="font-sans text-[0.52rem] uppercase tracking-[0.28em] text-platinum-dim">
                                {group.label}
                            </span>
                        </div>
                        {group.models.map((m) => {
                            const active = m.id === value;
                            return (
                                <button
                                    key={m.id}
                                    type="button"
                                    role="option"
                                    aria-selected={active}
                                    onClick={() => select(m.id)}
                                    className={`w-full px-3 py-2 text-left transition-colors duration-200 ease-mechanical ${active ? 'bg-charcoal-700' : 'hover:bg-obsidian-800'}`}
                                >
                                    <ModelRow model={m} active={active} />
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* footer — link to model management */}
            <div className="shrink-0 border-t border-stone-line px-3 py-2">
                <Link
                    href="/models"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-2 transition-colors duration-200 ease-mechanical hover:text-bronze-bright"
                >
                    <span className="font-sans text-[0.52rem] uppercase tracking-[0.22em] text-platinum-dim hover:text-bronze-bright transition-colors duration-200">
                        Adjust model selection
                    </span>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden className="shrink-0 text-platinum-dim">
                        <path d="M1.5 4h5M4 1.5l3 2.5-3 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </Link>
            </div>
        </div>
    ) : null;

    return (
        <div className="relative min-w-0">
            {/* Trigger */}
            <button
                ref={triggerRef}
                type="button"
                onClick={() => { if (!disabled) setOpen((v) => !v); }}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={ariaLabel}
                className="flex w-full items-center gap-1.5 text-left disabled:opacity-40"
            >
                <span className="truncate font-mono text-[0.6rem] uppercase tracking-[0.12em] text-bronze transition-colors duration-500 ease-mechanical hover:text-bronze-bright">
                    {selected?.label ?? value}
                </span>
                <svg
                    width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden
                    className={`shrink-0 text-platinum-dim transition-transform duration-300 ease-mechanical ${open ? 'rotate-180' : ''}`}
                >
                    <path d="M1.5 3L4 5.5L6.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {/* Portal — rendered in body, escapes all overflow:hidden ancestors */}
            {typeof window !== 'undefined' && panel && createPortal(panel, document.body)}
        </div>
    );
}
