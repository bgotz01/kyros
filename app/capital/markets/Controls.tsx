'use client';

import { useEffect, useRef, useState } from 'react';

import type { Period } from '@/lib/capital/marketIndexes';

// ─── Panel controls ───────────────────────────────────────────────────────────
// The chrome both panels wear: the series dropdown, the period presets, the
// grid toggle and the panel header. None of it knows whether it is sitting
// above an index or a currency pair.

export interface PickerOption {
    key: string;
    label: string;
    color: string;
    /** Heading this option sits under in the open list. */
    group: string;
    /** Right-hand note on the closed plate — where the series comes from. */
    note: string;
    /** Right-hand note in the open list — when it starts. */
    listNote: string;
}

// ─── dropdown ─────────────────────────────────────────────────────────────────
// A carved plate that opens a panel of every series available, grouped. The
// panel glides down rather than popping.

export function SeriesPicker({
    options, groups, value, onChange, ariaLabel,
}: {
    options: PickerOption[];
    groups: string[];
    value: string;
    onChange: (key: string) => void;
    ariaLabel: string;
}) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    const selected = options.find(o => o.key === value) ?? options[0];

    // close on outside click or escape
    useEffect(() => {
        if (!open) return;

        function onPointer(e: MouseEvent) {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }

        document.addEventListener('mousedown', onPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={ariaLabel}
                className={`
                    flex w-[19rem] items-center gap-3 border bg-obsidian px-3.5 py-2.5
                    transition-colors duration-500 ease-mechanical
                    ${open ? 'border-bronze-dim' : 'border-stone-line-strong hover:border-bronze-dim'}
                `}
            >
                <span
                    aria-hidden
                    className="h-0.5 w-4 shrink-0 rounded-full"
                    style={{ background: selected.color }}
                />
                <span className="truncate font-sans text-[0.66rem] uppercase tracking-[0.2em] text-marble">
                    {selected.label}
                </span>
                <span className="ml-auto shrink-0 font-mono text-[0.58rem] tracking-[0.14em] text-platinum-dim">
                    {selected.note}
                </span>
                <svg
                    width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden
                    className={`shrink-0 text-bronze transition-transform duration-500 ease-mechanical ${open ? 'rotate-180' : ''}`}
                >
                    <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {open && (
                <div
                    role="listbox"
                    aria-label={ariaLabel}
                    className="absolute left-0 top-full z-20 mt-px max-h-[26rem] w-[19rem] overflow-y-auto border border-bronze-dim bg-charcoal"
                >
                    {groups.map(group => {
                        const inGroup = options.filter(o => o.group === group);
                        if (inGroup.length === 0) return null;

                        return (
                            <div key={group}>
                                <p className="border-b border-stone-line px-3.5 pb-1.5 pt-3.5 font-sans text-[0.55rem] uppercase tracking-[0.24em] text-platinum-dim">
                                    {group}
                                </p>
                                {inGroup.map(option => {
                                    const on = option.key === selected.key;
                                    return (
                                        <button
                                            key={option.key}
                                            type="button"
                                            role="option"
                                            aria-selected={on}
                                            onClick={() => { onChange(option.key); setOpen(false); }}
                                            className={`
                                                flex w-full items-center gap-3 px-3.5 py-2
                                                transition-colors duration-300 ease-mechanical
                                                ${on ? 'bg-bronze/10 text-marble' : 'text-platinum hover:bg-obsidian/60 hover:text-marble'}
                                            `}
                                        >
                                            <span
                                                aria-hidden
                                                className="h-0.5 w-4 shrink-0 rounded-full transition-opacity duration-300"
                                                style={{ background: option.color, opacity: on ? 1 : 0.45 }}
                                            />
                                            <span className="truncate font-sans text-[0.63rem] uppercase tracking-[0.18em]">
                                                {option.label}
                                            </span>
                                            <span className="ml-auto shrink-0 font-mono text-[0.56rem] tracking-[0.1em] text-platinum-dim tabular-nums">
                                                {option.listNote}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── period presets ───────────────────────────────────────────────────────────

export function PeriodRow({
    periods, value, onChange,
}: {
    periods: Period[];
    value: Period;
    onChange: (p: Period) => void;
}) {
    return (
        <div className="flex flex-wrap justify-end gap-1">
            {periods.map(p => {
                const on = value.label === p.label;
                return (
                    <button
                        key={p.label}
                        type="button"
                        onClick={() => onChange(p)}
                        className={`
                            px-2.5 py-1 font-mono text-[0.62rem] tracking-[0.1em]
                            transition-colors duration-500 ease-mechanical
                            ${p.kind === 'trailing' ? 'text-[0.58rem]' : ''}
                            ${on
                                ? 'border border-stone-line-strong bg-charcoal text-bronze'
                                : 'border border-transparent text-platinum hover:text-marble'}
                        `}
                    >
                        {p.label}
                    </button>
                );
            })}
        </div>
    );
}

// ─── check toggles ────────────────────────────────────────────────────────────

function CheckToggle({
    label, on, onToggle, disabled = false, title,
}: {
    label: string;
    on: boolean;
    onToggle: () => void;
    disabled?: boolean;
    title?: string;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            aria-pressed={on && !disabled}
            title={title}
            className={`
                flex items-center gap-2 border px-3 py-1.5
                font-sans text-[0.6rem] uppercase tracking-[0.2em]
                transition-colors duration-500 ease-mechanical
                ${disabled
                    ? 'cursor-default border-transparent text-platinum-dim opacity-40'
                    : on
                        ? 'border-stone-line-strong text-platinum'
                        : 'border-transparent text-platinum hover:text-marble'}
            `}
        >
            <span className={`h-2 w-2 border transition-colors duration-300 ${on && !disabled ? 'border-bronze bg-bronze/30' : 'border-platinum-dim'}`} />
            {label}
        </button>
    );
}

export function GridToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return <CheckToggle label="Grid" on={on} onToggle={onToggle} />;
}

export function LogToggle({
    on, onToggle, disabled = false, title,
}: {
    on: boolean;
    onToggle: () => void;
    disabled?: boolean;
    title?: string;
}) {
    return (
        <CheckToggle
            label="Log"
            on={on}
            onToggle={onToggle}
            disabled={disabled}
            title={title ?? 'Logarithmic axis — equal vertical distance is equal percentage move'}
        />
    );
}

// ─── panel header ─────────────────────────────────────────────────────────────

export interface MetricOption {
    key: string;
    label: string;
    description: string;
}

export function PanelHeader({
    subject, range, metrics, activeKey, onSelect,
}: {
    subject: string;
    range: string;
    metrics: readonly MetricOption[];
    activeKey: string;
    onSelect: (key: string) => void;
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-y-3 border-b border-stone-line-strong px-4 py-3">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-platinum">
                <span className="text-bronze">{subject}</span>
                {'  ·  '}
                {range}
            </p>
            <div className="ml-auto flex flex-wrap border border-stone-line-strong">
                {metrics.map((m, i) => {
                    const on = activeKey === m.key;
                    return (
                        <button
                            key={m.key}
                            type="button"
                            onClick={() => onSelect(m.key)}
                            title={m.description}
                            aria-pressed={on}
                            className={`
                                px-3.5 py-2 font-sans text-[0.63rem] uppercase tracking-[0.16em]
                                transition-colors duration-500 ease-mechanical
                                ${i > 0 ? 'border-l border-stone-line-strong' : ''}
                                ${on
                                    ? 'bg-bronze/15 text-bronze-bright'
                                    : 'text-platinum hover:bg-obsidian/50 hover:text-marble'}
                            `}
                        >
                            {m.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── currency toggle ──────────────────────────────────────────────────────────

export type Currency = 'local' | 'usd';

export function CurrencyToggle({
    value, onChange, disabled = false, title,
}: {
    value: Currency;
    onChange: (c: Currency) => void;
    disabled?: boolean;
    title?: string;
}) {
    const options: { key: Currency; label: string }[] = [
        { key: 'local', label: 'Local' },
        { key: 'usd', label: 'USD' },
    ];

    return (
        <div
            className={`flex border border-stone-line-strong transition-opacity duration-500 ease-mechanical ${disabled ? 'opacity-40' : ''}`}
            title={title}
        >
            {options.map((o, i) => {
                const on = value === o.key;
                return (
                    <button
                        key={o.key}
                        type="button"
                        onClick={() => onChange(o.key)}
                        disabled={disabled}
                        aria-pressed={on}
                        className={`
                            px-3 py-1.5 font-sans text-[0.6rem] uppercase tracking-[0.2em]
                            transition-colors duration-500 ease-mechanical
                            ${i > 0 ? 'border-l border-stone-line-strong' : ''}
                            ${disabled
                                ? 'cursor-default text-platinum-dim'
                                : on
                                    ? 'bg-bronze/15 text-bronze-bright'
                                    : 'text-platinum hover:bg-obsidian/50 hover:text-marble'}
                        `}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

/** A gap in the data, said plainly. Brick rather than a warning red — it is a
 *  limit of the database, not a fault. */
export function MissingNote({ children }: { children: React.ReactNode }) {
    return (
        <p className="max-w-[22rem] text-right font-sans text-[0.55rem] uppercase leading-relaxed tracking-[0.16em] text-[#C0563F]">
            {children}
        </p>
    );
}
