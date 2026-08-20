'use client';

import { useEffect, useRef, useState } from 'react';

// ─── Shared panel furniture ───────────────────────────────────────────────────
// The pieces the equity and currency panels both need: plot sizing, the hover
// readout, the statistics cells, and the message that stands in the reserved
// plot space while there is nothing to draw.

/** Plot dimensions from the container's own width, in a 1 : 0.36 frame. */
export function usePlotSize() {
    const ref = useRef<HTMLDivElement>(null);
    const [dims, setDims] = useState({ width: 900, height: 420 });

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new ResizeObserver(([e]) => {
            const w = e.contentRect.width;
            setDims({ width: w, height: Math.max(280, Math.min(500, Math.round(w * 0.36))) });
        });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return { ref, dims };
}

export function monthLabel(month: string) {
    return new Date(month + 'T00:00:00Z').toLocaleString('default', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    });
}

/** Centred in the reserved plot space rather than collapsing it. */
export function StateOverlay({
    error, empty, emptyMessage = 'No readings for this period.',
}: {
    error: string | null;
    empty: boolean;
    emptyMessage?: string;
}) {
    return (
        <div className="absolute inset-0 flex items-center justify-center">
            {error ? (
                <span className="font-mono text-[0.6rem] tracking-[0.18em] text-bronze">
                    {error}
                </span>
            ) : empty ? (
                <span className="font-mono text-[0.6rem] tracking-[0.18em] text-platinum-dim">
                    {emptyMessage}
                </span>
            ) : (
                <span className="animate-pulse font-mono text-[0.6rem] tracking-[0.28em] text-platinum-dim">
                    Loading…
                </span>
            )}
        </div>
    );
}

/** The hover panel. `value` arrives already formatted — each panel quotes its
 *  subject in its own units. */
export function Readout({
    month, name, value, color, note,
}: {
    month: string;
    name: string;
    value: string;
    color: string;
    note?: string;
}) {
    return (
        <div className="border border-stone-line-strong bg-obsidian px-4 py-3">
            <p className="mb-2.5 font-mono text-[0.6rem] tracking-[0.18em] text-bronze">
                {monthLabel(month)}
            </p>
            <div className="flex items-center gap-2.5">
                <span
                    aria-hidden
                    className="h-0.5 w-4 shrink-0 rounded-full"
                    style={{ background: color }}
                />
                <span className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-marble-dim">
                    {name}
                </span>
                <span className="ml-auto pl-6 font-mono text-[0.72rem] tracking-[0.06em] text-marble tabular-nums">
                    {value}
                </span>
            </div>
            {note && (
                <p className="mt-2 font-sans text-[0.55rem] uppercase tracking-[0.16em] text-platinum-dim">
                    {note}
                </p>
            )}
        </div>
    );
}

export function Stat({
    label, value, accent = false,
}: {
    label: string;
    value: string;
    accent?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1">
            <span className="font-sans text-[0.55rem] uppercase tracking-[0.22em] text-platinum-dim">
                {label}
            </span>
            <span
                className={`font-mono text-[0.78rem] tracking-[0.05em] tabular-nums ${accent ? 'text-bronze-bright' : 'text-marble'}`}
            >
                {value}
            </span>
        </div>
    );
}

/** Months inside the window with no reading behind them. The plot breaks the
 *  line at each one; this says how much of the window that accounts for. */
export function GapNote({ missing, total, source }: {
    missing: number;
    total: number;
    source: string;
}) {
    if (missing === 0) return null;
    return (
        <p className="border-t border-stone-line px-4 py-3 font-sans text-[0.55rem] uppercase leading-relaxed tracking-[0.16em] text-[#C0563F]">
            {source} has no reading for {missing} of these {total} months — the line breaks where it is missing
        </p>
    );
}
