// ─── oilTimeline.ts ───────────────────────────────────────────────────────────
// A century of oil as a flat record, oldest first. The rail groups it into
// fixed 20-year cycles at render time — see lib/commodities/timeline.ts.
// Rendered by /commodities/oil.
// ─────────────────────────────────────────────────────────────────────────────

import type { TimelineEvent } from './timeline';

// ─── The record ───────────────────────────────────────────────────────────────

export const OIL_TIMELINE: TimelineEvent[] = [
    {
        id: 'ev-1914-18-world-war-i',
        year: '1914–18',
        title: 'World War I',
        relevance:
            'Oil becomes a strategic military resource as navies, trucks, aircraft and mechanized warfare expand.',
    },
    {
        id: 'ev-1933-38-saudi-concession-discovery',
        year: '1933–38',
        title: 'Saudi concession & discovery',
        relevance:
            'American companies gain access to what becomes the world’s most important low-cost oil base.',
    },
    {
        id: 'ev-1939-45-world-war-ii',
        year: '1939–45',
        title: 'World War II',
        relevance:
            'Mechanized warfare sharply increases dependence on oil and makes secure petroleum supply central to state power.',
    },
    {
        id: 'ev-1960-opec-founded',
        year: '1960',
        title: 'OPEC founded',
        relevance:
            'Producers coordinate collectively against the pricing power of international oil companies.',
    },
    {
        id: 'ev-1973-arab-oil-embargo',
        year: '1973',
        title: 'Arab oil embargo',
        relevance:
            'Oil becomes an explicit geopolitical weapon and producer pricing power becomes globally visible.',
    },
    {
        id: 'ev-1979-iranian-revolution',
        year: '1979',
        title: 'Iranian Revolution',
        relevance:
            'Removes a major US-aligned producer and contributes to another major supply and price shock.',
    },
    {
        id: 'ev-1990-91-gulf-war',
        year: '1990–91',
        title: 'Gulf War',
        relevance:
            'US military power becomes the security backstop of the Gulf oil system.',
    },
    {
        id: 'ev-2010s-us-shale-revolution',
        year: '2010s',
        title: 'US shale revolution',
        relevance:
            'Technology turns the US back into a major source of responsive oil supply and challenges OPEC.',
    },
    {
        id: 'ev-2022-russia-ukraine-war',
        year: '2022',
        title: 'Russia–Ukraine War',
        relevance:
            'Sanctions and energy-security concerns fragment global trade and re-politicize oil supply.',
    },
];
