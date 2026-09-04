'use client';

import type { TimelineCycle } from '@/lib/commodities/timeline';

// ─── Layout ───────────────────────────────────────────────────────────────────

/** Width of one event on the rail. Two lines of title at 0.75rem fit here. */
const NODE_WIDTH = 168;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * The record as a single flat rail.
 *
 * One rail for the whole span rather than one per cycle: stacking a rail per
 * cycle, each with its own heading, cost three times the height to say the same
 * thing, and the stacked rows read as separate timelines rather than one run of
 * history. Cycles divide the rail instead of breaking it.
 *
 * The rail scrolls sideways when the run is longer than the page. Its own
 * element, above the price chart and separate from it.
 */
export default function EventStrip({
    cycles,
    selected,
    openId,
    onSelect,
}: {
    cycles: TimelineCycle[];
    /** Cycle currently isolated, or `null` for the whole span. */
    selected?: string | null;
    openId?: string | null;
    onSelect: (id: string) => void;
}) {
    const shown = selected
        ? cycles.filter((c) => c.id === selected)
        : cycles;

    return (
        <div className="-mx-8 overflow-x-auto px-8 pb-2">
            <div className="flex min-w-max items-start">
                {shown.map((cycle, index) => (
                    <div
                        key={cycle.id}
                        className={`relative flex ${index > 0 ? 'ml-6 border-l border-stone-line pl-6' : ''
                            }`}
                    >
                        {cycle.events.map((event) => {
                            const open = openId === event.id;

                            return (
                                <button
                                    key={event.id}
                                    id={event.id}
                                    type="button"
                                    onClick={() => onSelect(event.id)}
                                    aria-expanded={open}
                                    style={{ width: NODE_WIDTH }}
                                    className={`group relative shrink-0 scroll-mt-32 px-3 pt-3 text-left transition-colors duration-500 ease-mechanical ${open ? 'bg-charcoal' : ''
                                        }`}
                                >
                                    <span className="block h-[3.4rem]">
                                        <span className="block font-mono text-[0.6rem] tracking-[0.14em] text-bronze tabular-nums">
                                            {event.year}
                                        </span>

                                        <span
                                            className={`mt-1.5 block font-sans text-[0.75rem] leading-snug tracking-[0.02em] transition-colors duration-300 ease-mechanical group-hover:text-bronze-bright ${open ? 'text-bronze-bright' : 'text-marble'
                                                }`}
                                        >
                                            {event.title}
                                        </span>
                                    </span>

                                    {/* Node, sitting on the rail.
                                        The rail is drawn per node, centred on
                                        the same row as the dot, so it cannot
                                        drift out of alignment with it — an
                                        offset measured from the top of the
                                        strip has to be recomputed by hand every
                                        time the text above changes height. */}
                                    <span className="relative flex h-6 items-center">
                                        <span
                                            aria-hidden
                                            className="absolute -inset-x-3 top-1/2 h-px bg-stone-line-strong"
                                        />
                                        <span
                                            aria-hidden
                                            className={`relative z-10 block h-2.5 w-2.5 rounded-full border border-bronze-bright ring-4 ring-obsidian transition-transform duration-300 ease-mechanical group-hover:scale-125 ${open ? 'bg-bronze-bright' : 'bg-obsidian'
                                                }`}
                                        />
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
