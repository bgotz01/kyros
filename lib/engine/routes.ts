// ─── engine routes ───────────────────────────────────────────────────────────
// The address of a reading. The month is the page:
//
//     /engine/ai                                  the newest month with papers held
//     /engine/ai/2026/august                      the month
//     /engine/ai/2026/august#week-2026-34         one week within it
//     /engine/ai/2026/august#paper-2608.21690     one paper within it
//
// A week is a unit of work, not a place — it is where a batch is run and where
// spend is counted, but it is read inside its month, so it is addressed as a
// fragment rather than a path of its own. A paper likewise.
//
// The heading parsing lives here rather than in the sidebar because the sidebar
// writes these addresses and the page reads them back; a heading parsed two
// ways would file the same week under two different months.

import type { WeekRow } from './data';

export const MONTH_ORDER = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_ABBR: Record<string, string> = {
    Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April',
    Jun: 'June', Jul: 'July', Aug: 'August', Sep: 'September',
    Oct: 'October', Nov: 'November', Dec: 'December',
};

/** Normalise a month string to its full name for consistent sorting. */
export function normalizeMonth(m: string): string {
    return MONTH_ABBR[m] ?? m;
}

/** A week is dated by the day it ends, not the day it starts.
 *
 *  "(December 29 - January 4) - 2026" is a January 2026 week holding papers
 *  published in December 2025. Reading the leading month filed it under a
 *  December 2026 that never happened, and buried those papers there. */
export function weekEnd(heading: string): { month: string; label: string } {
    const stripped = heading.replace(/^\(|\)\s*-\s*\d{4}$/g, '').trim();
    const parts = stripped.split(/\s+-\s+/);
    const end = parts[parts.length - 1] ?? stripped;

    // "January 4", or a bare "4" where the range does not repeat the month.
    const named = /^([A-Za-z]+)\s*(\d+)?/.exec(end);
    const day = /(\d+)\s*$/.exec(end)?.[1];
    const month = normalizeMonth(
        named?.[1] ?? /^([A-Za-z]+)/.exec(stripped)?.[1] ?? '—',
    );

    return {
        month,
        label: day ? `${month.slice(0, 3)} ${day}` : month.slice(0, 3),
    };
}

/** "August 24 - August 30" — the heading with its brackets and trailing year
 *  taken off. The month page names the month and the year above every section,
 *  so a week that repeated them would be saying it three times. */
export function weekRange(heading: string): string {
    return heading.replace(/^\(/, '').replace(/\)\s*-\s*\d{4}\s*$/, '').trim();
}

/** january, february, … — the month as it appears in a path. */
export function monthSlug(month: string): string {
    return normalizeMonth(month).toLowerCase();
}

/** The full month name a path segment names, or null when it names nothing.
 *  Accepts the abbreviation too, so a hand-typed /2026/aug still lands. */
export function monthFromSlug(slug: string): string | null {
    const want = decodeURIComponent(slug).toLowerCase();
    return (
        MONTH_ORDER.find((m) => m.toLowerCase() === want) ??
        MONTH_ORDER.find((m) => m.slice(0, 3).toLowerCase() === want) ??
        null
    );
}

const BASE = '/engine/ai';

export function monthHref(year: string, month: string): string {
    return `${BASE}/${year}/${monthSlug(month)}`;
}

/** The id of a week's section, and of a paper's card. Both are fragments of a
 *  month page, so both are written into the address the same way. */
export function weekAnchor(week: WeekRow): string {
    return `week-${week.year}-${week.idx}`;
}

export function paperAnchor(paperId: string): string {
    return `paper-${paperId}`;
}

/** A link to one week, from anywhere. */
export function weekHref(week: WeekRow): string {
    return `${monthHref(week.year, weekEnd(week.heading).month)}#${weekAnchor(week)}`;
}

/** Every week of one month, newest first — the order the rail lists them in and
 *  the order the month is read in. */
export function resolveMonth(weeks: WeekRow[], year: string, month: string): WeekRow[] {
    return weeks.filter((w) => w.year === year && weekEnd(w.heading).month === month).reverse();
}
