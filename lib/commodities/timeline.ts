// ─── timeline.ts ──────────────────────────────────────────────────────────────
// Shared shape for the commodity event timelines.
//
// Events are grouped into eras rather than run onto one continuous rail. A flat
// century of events only reads as a scrollbar; the era is the unit that carries
// meaning, and grouping lets the whole span fit on the page at once.
// ─────────────────────────────────────────────────────────────────────────────

export interface TimelineEvent {
    /**
     * Stable anchor — decade tables link to the node by this.
     *
     * Prefixed rather than starting with the year: a CSS identifier may not
     * begin with a digit, so a bare `1973-…` is a valid HTML id but an invalid
     * selector, and `document.querySelector('#1973-…')` throws.
     */
    id: string;
    /** As written — a year, a span ("1914–18"), or a decade ("2000s"). */
    year: string;
    title: string;
    /** Why the trajectory changed here. Shown expanded or in the detail row. */
    relevance: string;
}

/**
 * A fixed-length slice of the record.
 *
 * Named eras were uneven — one ran nine events and another three — which made
 * the rail's spacing arbitrary and gave the reader no stable unit to hold onto.
 * Cycles are all the same width, so position on the page means the same thing
 * everywhere and any two can be compared directly.
 */
export interface TimelineCycle {
    /** Stable key and anchor — "1900-1919". */
    id: string;
    /** As rendered — "1900 — 1919", or "2020 —" while it is still running. */
    label: string;
    startYear: number;
    /** Inclusive. */
    endYear: number;
    /** True for the cycle the record has not finished yet. */
    open: boolean;
    events: TimelineEvent[];
}

// ─── Reading event labels ─────────────────────────────────────────────────────

/**
 * The span of years an event label covers.
 *
 * Labels are written for reading, not for sorting, so every form the data uses
 * has to resolve: "1973" is one year, "1914–18" and "1980–88" close inside the
 * same century as they open, "2000s" is a whole decade, and "2023–" is still
 * running. Returns `null` for anything with no year in it at all.
 */
export function eventSpan(label: string): [number, number] | null {
    const decade = label.match(/^(\d{4})s$/);
    if (decade) {
        const start = Number(decade[1]);
        return [start, start + 9];
    }

    const range = label.match(/^(\d{4})\s*[–—-]\s*(\d{2,4})?$/);
    if (range) {
        const start = Number(range[1]);
        if (!range[2]) return [start, Number.MAX_SAFE_INTEGER];  // "2023–", ongoing
        const raw = range[2];
        // "1939–45" closes in 1945, not in the year 45.
        const end =
            raw.length === 2
                ? Number(String(start).slice(0, 2) + raw)
                : Number(raw);
        return [start, end];
    }

    const single = label.match(/^(\d{4})$/);
    if (single) {
        const year = Number(single[1]);
        return [year, year];
    }

    const fallback = label.match(/\d{4}/);
    if (fallback) {
        const year = Number(fallback[0]);
        return [year, year];
    }

    return null;
}

/** The year an event opens, for placing it on a price axis. */
export function eventYear(label: string): number | null {
    return eventSpan(label)?.[0] ?? null;
}

/**
 * The timeline nodes a decade row covers, for linking the two readings of the
 * century together.
 *
 * Matched on overlap rather than on the opening year, so an event that straddles
 * a boundary reaches both decades — World War II opens in 1939 but belongs to
 * the 1940s row as much as the 1930s one. Derived from the years themselves so
 * that rewriting a row's prose cannot silently break its links.
 */
export function eventsInDecade(
    events: TimelineEvent[],
    decadeLabel: string,
): TimelineEvent[] {
    const span = eventSpan(decadeLabel);
    if (!span) return [];
    const [from, to] = span;

    return events.filter((event) => {
        const es = eventSpan(event.year);
        return es !== null && es[0] <= to && es[1] >= from;
    });
}

// ─── Cycles ───────────────────────────────────────────────────────────────────

/**
 * Years per cycle.
 *
 * Fifty rather than twenty: the rail is meant to be the condensed reading of
 * the decade table beneath it, and a bucket per twenty years produced more
 * headings than the table had rows.
 */
export const CYCLE_YEARS = 50;

/** Cycles start on the century, so they line up with the decade tables. */
function cycleStart(year: number): number {
    return Math.floor(year / CYCLE_YEARS) * CYCLE_YEARS;
}

/**
 * Bucket a record into fixed 20-year cycles, oldest first.
 *
 * Only cycles that actually carry events are returned — an empty bucket is a
 * gap in the record, not a period worth giving the reader a tab for. Events are
 * placed by the year they open in, so one that straddles a boundary sits in the
 * cycle it began.
 *
 * The final cycle is treated as still running, rather than comparing against
 * the clock. These pages are prerendered at build time and hydrated whenever
 * they are read, so anything derived from `new Date()` would eventually
 * disagree across a year boundary — a build in one year serving a reader in the
 * next would render "2020 — 2039" on the server and "2020 —" in the browser.
 */
export function toCycles(events: TimelineEvent[]): TimelineCycle[] {
    const buckets = new Map<number, TimelineEvent[]>();

    for (const event of events) {
        const year = eventYear(event.year);
        if (year === null) continue;
        const start = cycleStart(year);
        const bucket = buckets.get(start);
        if (bucket) bucket.push(event);
        else buckets.set(start, [event]);
    }

    const ordered = [...buckets.entries()].sort(([a], [b]) => a - b);

    return ordered
        .map(([startYear, bucketed], index) => {
            const endYear = startYear + CYCLE_YEARS - 1;
            const open = index === ordered.length - 1;
            return {
                id: `${startYear}-${endYear}`,
                label: open ? `${startYear} —` : `${startYear} — ${endYear}`,
                startYear,
                endYear,
                open,
                events: bucketed,
            };
        });
}
