'use client';

import { useEffect, useMemo, useState } from 'react';
import { toCycles, type TimelineEvent } from '@/lib/commodities/timeline';
import EventStrip from './EventStrip';
import PriceRail from './PriceRail';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * A record read against the price it moved.
 *
 * Three separate elements, stacked: the events on a flat rail, the price below
 * it, and the chosen event's reading below that. Choosing an event from either
 * the rail or the price line opens the same reading.
 */
export default function EventTimeline({
    title,
    span,
    description,
    events,
}: {
    title: string;
    span: string;
    description: string;
    events: TimelineEvent[];
}) {
    /** `null` is the whole century — the default reading. */
    const [selected, setSelected] = useState<string | null>(null);
    /** The one event whose reading is open beneath the chart. */
    const [openId, setOpenId] = useState<string | null>(null);

    const cycles = useMemo(() => toCycles(events), [events]);

    const openEvent = useMemo(
        () => events.find((e) => e.id === openId) ?? null,
        [events, openId],
    );

    // A decade row can link to any event. Follow the hash: open its reading,
    // and move a narrowed view to the cycle that holds it.
    useEffect(() => {
        function follow() {
            const id = window.location.hash.slice(1);
            if (!id) return;
            const owner = cycles.find((c) => c.events.some((e) => e.id === id));
            if (!owner) return;
            setSelected((current) => (current === null ? null : owner.id));
            setOpenId(id);
        }

        follow();
        window.addEventListener('hashchange', follow);
        return () => window.removeEventListener('hashchange', follow);
    }, [cycles]);

    // Close the open reading with Escape.
    useEffect(() => {
        if (!openId) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpenId(null);
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [openId]);

    return (
        <section className="w-full">
            {/* ── header ──────────────────────────────────────────────────── */}
            <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="font-sans text-[0.72rem] uppercase tracking-[0.22em] text-bronze">
                        {span}
                    </p>

                    <h2 className="mt-3 font-serif text-3xl font-light tracking-[0.06em] text-marble">
                        {title}
                    </h2>

                    <p className="mt-3 max-w-xl font-sans text-[0.85rem] leading-relaxed text-platinum-dim">
                        {description}
                    </p>
                </div>

                <span className="shrink-0 font-mono text-[0.65rem] tracking-[0.16em] text-platinum-dim tabular-nums">
                    {events.length} events
                </span>
            </div>

            {/* ── cycle selection ─────────────────────────────────────────── */}
            <div className="mb-8 flex flex-wrap items-center gap-x-px gap-y-2 border-y border-stone-line py-3">
                <Toggle
                    active={selected === null}
                    onClick={() => setSelected(null)}
                >
                    All
                </Toggle>

                {cycles.map((cycle) => (
                    <Toggle
                        key={cycle.id}
                        active={selected === cycle.id}
                        onClick={() =>
                            setSelected((current) =>
                                current === cycle.id ? null : cycle.id,
                            )
                        }
                    >
                        {cycle.label}
                    </Toggle>
                ))}
            </div>

            {/* ── the record, flat ───────────────────────────────────────── */}
            <EventStrip
                cycles={cycles}
                selected={selected}
                openId={openId}
                onSelect={(id) =>
                    setOpenId((current) => (current === id ? null : id))
                }
            />

            {/* ── the price beneath it ───────────────────────────────────── */}
            <div className="mt-10 border-t border-stone-line pt-8">
                    <PriceRail
                    cycles={cycles}
                    selected={selected}
                    openId={openId}
                    onSelectEvent={(id) =>
                        setOpenId((current) => (current === id ? null : id))
                    }
                />
            </div>

            {/* ── the chosen event, read beneath the chart ────────────────── */}
            <div
                className="grid transition-[grid-template-rows] duration-500 ease-mechanical"
                style={{ gridTemplateRows: openEvent ? '1fr' : '0fr' }}
            >
                <div className="overflow-hidden">
                    {openEvent && (
                        <EventDetail
                            event={openEvent}
                            onClose={() => setOpenId(null)}
                        />
                    )}
                </div>
            </div>
        </section>
    );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
    active,
    onClick,
    className = '',
    children,
}: {
    active: boolean;
    onClick: () => void;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`border px-4 py-2 font-sans text-[0.62rem] uppercase tracking-[0.18em] transition-colors duration-300 ease-mechanical ${active
                ? 'border-bronze-dim text-bronze-bright'
                : 'border-stone-line text-platinum-dim hover:border-stone-line-strong hover:text-platinum'
                } ${className}`}
        >
            {children}
        </button>
    );
}

// ─── Detail row ───────────────────────────────────────────────────────────────

/**
 * One event's reading, opened in place beneath its rail.
 *
 * The text is a sentence or two — far too little to justify covering the page
 * with a modal, which also hid the timeline the event was being read against.
 * Here the rail stays visible directly above it.
 */
function EventDetail({
    event,
    onClose,
}: {
    event: TimelineEvent;
    onClose: () => void;
}) {
    return (
        <div className="mt-6 flex items-start gap-6 border-t border-stone-line pt-5">
            <span className="shrink-0 pt-1 font-mono text-[0.68rem] tracking-[0.16em] text-bronze tabular-nums">
                {event.year}
            </span>

            <div className="min-w-0 flex-1">
                <h3 className="font-serif text-xl font-light tracking-[0.04em] text-marble">
                    {event.title}
                </h3>

                <p className="mt-3 max-w-3xl font-sans text-[0.8rem] leading-relaxed tracking-[0.02em] text-platinum">
                    {event.relevance}
                </p>
            </div>

            <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 font-sans text-lg leading-none text-platinum-dim transition-colors duration-300 ease-mechanical hover:text-marble"
            >
                ×
            </button>
        </div>
    );
}
