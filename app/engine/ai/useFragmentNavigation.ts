'use client';

// ─── the address ──────────────────────────────────────────────────────────────
// A month is one page, so the fragment is how anything inside it is named: a
// week to filter to, or a card to land on. Three things happen here and they are
// easy to confuse, which is why they sit together rather than scattered through
// the page component.
//
//   1. The hash is READ into state, and kept in step with the back button.
//   2. A week in the address SELECTS that week — it is a filter, not a place.
//   3. A paper in the address is SCROLLED to, exactly once per address.
//
// The third is the delicate one. Cards are ranked by score, so they reorder as a
// run lands; re-scrolling on every render would drag the page out from under
// whoever is reading it.

import { useCallback, useEffect, useRef } from 'react';
import type { Scope } from '@/app/engine/components/MonthHeader';
import type { WeekRow } from '@/lib/engine/data';
import { weekAnchor } from '@/lib/engine/routes';

export interface FragmentNavigation {
    /** Choose a week, or the whole month, writing it into the address. */
    selectScope: (scope: Scope) => void;
    /** Put a card's address on the clipboard. */
}

export function useFragmentNavigation({
    year,
    monthParam,
    monthWeeks,
    anchor,
    setAnchor,
    setSelected,
    /** Anything whose arrival can change the page's height. A scroll asked for
     *  against a short first layout has nowhere to go, so the address is held
     *  open until its target is actually where it was sent. */
    settleOn,
}: {
    year: string;
    monthParam: string;
    monthWeeks: WeekRow[];
    /** The fragment is owned by the page, not by this hook: opening a month
     *  re-reads it and walking to a paper writes it, so holding it here would
     *  make this hook and the month loader circular. */
    anchor: string;
    setAnchor: (next: string) => void;
    setSelected: (scope: Scope) => void;
    settleOn: unknown[];
}): FragmentNavigation {
    useEffect(() => {
        const read = () => setAnchor(window.location.hash.slice(1));
        read();
        window.addEventListener('hashchange', read);
        return () => window.removeEventListener('hashchange', read);
    }, [setAnchor]);

    /** A week named in the address selects it rather than scrolling to it — the
     *  rail still points at weeks, and a week is a filter rather than a section
     *  of the page. A paper in the address leaves the filter alone: the card it
     *  names is on screen under "All", which is where a cold load starts. */
    useEffect(() => {
        const week = monthWeeks.find((w) => weekAnchor(w) === anchor);
        if (week) setSelected(week.idx);
    }, [anchor, monthWeeks, setSelected]);

    /** Choosing from the toggles. Written into the address as well as the state
     *  so the rail lights the same week the page is showing, and so the reading
     *  can be handed to someone else as it stands. */
    const selectScope = useCallback(
        (scope: Scope) => {
            setSelected(scope);
            const week = scope === 'all' ? null : monthWeeks.find((w) => w.idx === scope);
            const next = week ? weekAnchor(week) : '';
            setAnchor(next);
            window.history.replaceState(null, '', next ? `#${next}` : window.location.pathname);
        },
        [monthWeeks, setSelected, setAnchor],
    );


    /** The card the address points at, brought into view once per address. A
     *  week anchor finds no element and falls through — it selects a filter, it
     *  is not a place.
     *
     *  The jump is instant, not eased: this is where the reading starts, not a
     *  movement through it. */
    const scrolled = useRef<string | null>(null);
    useEffect(() => {
        if (!anchor) return;
        const key = `${year}:${monthParam}:${anchor}`;
        if (scrolled.current === key) return;
        const el = document.getElementById(anchor);
        if (!el) return;

        el.scrollIntoView({ behavior: 'auto', block: 'start' });
        // Where it should have landed is the element's own scroll margin — the
        // room left for the bars stuck above it. Read from the element rather
        // than held as a constant here, so the two cannot drift apart.
        const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
        const doc = document.documentElement;
        const atEnd = window.scrollY >= doc.scrollHeight - window.innerHeight - 1;
        if (el.getBoundingClientRect().top <= margin + 8 || atEnd) scrolled.current = key;
        // `settleOn` is spread deliberately: the effect must re-run as the page
        // grows, and the values themselves are never read.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [anchor, year, monthParam, ...settleOn]);

    return { selectScope };
}
