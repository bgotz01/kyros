'use client';

import { useEffect, useRef, useState } from 'react';
import {
    BAND_COLOR,
    BAND_LABEL,
    DEFAULT_THRESHOLDS,
    GRADED_SERIES,
    bandRange,
    isValid,
    type Band,
    type Direction,
    type GradedKey,
    type Threshold,
    type Thresholds,
} from './indicators';

const BANDS: Band[] = ['good', 'caution', 'bad'];

const DIRECTION_LABEL: Record<Direction, string> = {
    higher: 'Higher is better',
    lower: 'Lower is better',
};

interface Props {
    thresholds: Thresholds;
    onApply: (next: Thresholds) => void;
    onClose: () => void;
}

export function RangesModal({ thresholds, onApply, onClose }: Props) {
    const backdropRef = useRef<HTMLDivElement>(null);
    // Edits are held locally and only committed on Apply.
    const [draft, setDraft] = useState<Thresholds>(thresholds);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === backdropRef.current) onClose();
    };

    function edit(key: GradedKey, patch: Partial<Threshold>) {
        setDraft(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
    }

    function flipDirection(key: GradedKey) {
        const t = draft[key];
        // Flipping which way is favourable swaps the two edges with it.
        edit(key, {
            direction: t.direction === 'higher' ? 'lower' : 'higher',
            good: t.caution,
            caution: t.good,
        });
    }

    const invalid = GRADED_SERIES.filter(s => !isValid(draft[s.key as GradedKey]));
    const dirty = GRADED_SERIES.some(s => {
        const a = draft[s.key as GradedKey], b = thresholds[s.key as GradedKey];
        return a.direction !== b.direction || a.good !== b.good || a.caution !== b.caution;
    });

    return (
        <div
            ref={backdropRef}
            onClick={handleBackdrop}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(10,10,10,0.72)', backdropFilter: 'blur(2px)' }}
        >
            <div
                className="relative flex flex-col"
                style={{
                    width: 640,
                    maxHeight: '84vh',
                    background: 'var(--color-charcoal)',
                    border: '1px solid var(--color-stone-line)',
                }}
            >
                {/* ── header ──────────────────────────────────────────────── */}
                <div className="flex items-start justify-between border-b border-stone-line px-6 py-4">
                    <div>
                        <h2 className="font-serif text-lg font-light tracking-[0.14em] text-marble">
                            Reading Ranges
                        </h2>
                        <p className="mt-0.5 font-sans text-[0.65rem] uppercase tracking-[0.2em] text-platinum-dim">
                            What counts as good, cautious or bad · inflation and relative measures
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center text-platinum-dim transition-colors hover:text-marble"
                        aria-label="Close"
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* ── band key ────────────────────────────────────────────── */}
                <div className="flex items-center gap-6 border-b border-stone-line px-6 py-3">
                    {BANDS.map(b => (
                        <span key={b} className="flex items-center gap-2">
                            <span className="h-0.5 w-4 shrink-0" style={{ background: BAND_COLOR[b] }} />
                            <span className="font-sans text-[0.58rem] uppercase tracking-[0.2em] text-platinum-dim">
                                {BAND_LABEL[b]}
                            </span>
                        </span>
                    ))}
                </div>

                {/* ── per-series ranges ───────────────────────────────────── */}
                <div className="min-h-0 flex-1 divide-y divide-stone-line overflow-y-auto px-6">
                    {GRADED_SERIES.map(s => {
                        const key = s.key as GradedKey;
                        const t = draft[key];
                        const ok = isValid(t);
                        return (
                            <div key={key} className="py-5">
                                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                                    <div>
                                        <p className="font-mono text-[0.72rem] tracking-[0.14em] text-marble">
                                            {s.shortLabel}
                                            <span className="ml-2 font-sans text-[0.6rem] uppercase tracking-[0.16em] text-platinum-dim">
                                                {s.label}
                                            </span>
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => flipDirection(key)}
                                        title="Flip which direction is favourable"
                                        className="border border-stone-line px-3 py-1 font-sans text-[0.55rem] uppercase tracking-[0.18em] text-platinum-dim transition-colors duration-300 ease-mechanical hover:border-platinum-dim hover:text-platinum"
                                    >
                                        {DIRECTION_LABEL[t.direction]}
                                    </button>
                                </div>

                                {/* edges */}
                                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
                                    <Edge
                                        label={t.direction === 'higher' ? 'Good at or above' : 'Good at or below'}
                                        color={BAND_COLOR.good}
                                        value={t.good}
                                        onChange={v => edit(key, { good: v })}
                                    />
                                    <Edge
                                        label={t.direction === 'higher' ? 'Bad below' : 'Bad above'}
                                        color={BAND_COLOR.bad}
                                        value={t.caution}
                                        onChange={v => edit(key, { caution: v })}
                                    />
                                </div>

                                {/* resulting bands */}
                                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
                                    {ok ? BANDS.map(b => (
                                        <span key={b} className="flex items-center gap-1.5">
                                            <span className="h-1.5 w-1.5 shrink-0" style={{ background: BAND_COLOR[b] }} />
                                            <span
                                                className="font-mono text-[0.62rem] tracking-[0.06em] tabular-nums"
                                                style={{ color: BAND_COLOR[b] }}
                                            >
                                                {bandRange(t, b)}
                                            </span>
                                        </span>
                                    )) : (
                                        <span className="font-sans text-[0.6rem] uppercase tracking-[0.16em] text-bronze">
                                            {t.direction === 'higher'
                                                ? 'Good edge must sit above the bad edge'
                                                : 'Good edge must sit below the bad edge'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── footer ──────────────────────────────────────────────── */}
                <div className="flex items-center justify-between border-t border-stone-line px-6 py-3">
                    <button
                        type="button"
                        onClick={() => setDraft(DEFAULT_THRESHOLDS)}
                        className="font-sans text-[0.6rem] uppercase tracking-[0.18em] text-platinum-dim transition-colors hover:text-platinum"
                    >
                        Reset to defaults
                    </button>
                    <div className="flex items-center gap-4">
                        {invalid.length > 0 && (
                            <span className="font-sans text-[0.58rem] uppercase tracking-[0.16em] text-bronze">
                                {invalid.length} range{invalid.length > 1 ? 's' : ''} incomplete
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="font-sans text-[0.6rem] uppercase tracking-[0.18em] text-platinum-dim transition-colors hover:text-platinum"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={invalid.length > 0}
                            onClick={() => { onApply(draft); onClose(); }}
                            className={`border px-6 py-2 font-sans text-xs uppercase tracking-[0.2em] transition-colors duration-200 ${invalid.length > 0
                                ? 'cursor-not-allowed border-stone-line text-platinum-dim'
                                : 'border-bronze text-bronze-bright hover:bg-bronze/10'}`}
                        >
                            {dirty ? 'Apply' : 'Done'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── one editable edge ────────────────────────────────────────────────────────

function Edge({
    label,
    color,
    value,
    onChange,
}: {
    label: string;
    color: string;
    value: number;
    onChange: (v: number) => void;
}) {
    return (
        <label className="flex items-center gap-2.5">
            <span className="h-0.5 w-3 shrink-0" style={{ background: color }} />
            <span className="font-sans text-[0.58rem] uppercase tracking-[0.16em] text-platinum-dim">
                {label}
            </span>
            <input
                type="number"
                step="0.25"
                value={Number.isFinite(value) ? value : ''}
                onChange={e => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
                className="w-20 border border-stone-line bg-obsidian px-2 py-1 font-mono text-[0.68rem] tracking-[0.06em] text-marble tabular-nums focus:border-stone-line-strong focus:outline-none"
            />
            <span className="font-mono text-[0.6rem] text-platinum-dim">%</span>
        </label>
    );
}
