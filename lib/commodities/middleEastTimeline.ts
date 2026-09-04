// ─── middleEastTimeline.ts ────────────────────────────────────────────────────
// The regional record behind lib/commodities/middleEast.ts — every event that
// moved control, pricing power or capital, oldest first. Rendered by
// /commodities/oil/geopolitics/middle-east.
// ─────────────────────────────────────────────────────────────────────────────

import type { TimelineEvent } from './timeline';

// ─── The record ───────────────────────────────────────────────────────────────

export const MIDDLE_EAST_TIMELINE: TimelineEvent[] = [
    {
        id: 'ev-1909-anglo-persian-oil-company',
        year: '1909',
        title: 'Anglo-Persian Oil Company',
        relevance:
            'Creates the first major integrated oil company centered on Middle Eastern production and deepens British strategic involvement.',
    },
    {
        id: 'ev-1914-18-world-war-i',
        year: '1914–18',
        title: 'World War I',
        relevance:
            'Oil becomes a strategic military resource while the Ottoman order collapses and Britain and France expand their influence across the region.',
    },
    {
        id: 'ev-1933-saudi-oil-concession',
        year: '1933',
        title: 'Saudi oil concession',
        relevance:
            'Standard Oil of California gains access to Saudi Arabia, giving American capital a major independent foothold in the Gulf.',
    },
    {
        id: 'ev-1938-saudi-oil-discovered',
        year: '1938',
        title: 'Saudi oil discovered',
        relevance:
            'Confirms the enormous scale of Arabian petroleum resources and lays the foundation for Saudi Arabia’s future oil power.',
    },
    {
        id: 'ev-1939-45-world-war-ii',
        year: '1939–45',
        title: 'World War II',
        relevance:
            'Mechanized warfare makes oil indispensable to military power while European exhaustion accelerates the rise of American influence in the Gulf.',
    },
    {
        id: 'ev-1945-us-saudi-strategic-relationship',
        year: '1945',
        title: 'US–Saudi strategic relationship',
        relevance:
            'Saudi petroleum and American security interests become increasingly linked, beginning the core postwar Gulf relationship.',
    },
    {
        id: 'ev-1951-53-iranian-nationalization-crisis',
        year: '1951–53',
        title: 'Iranian nationalization crisis',
        relevance:
            'Mossadegh’s attempt to nationalize Iranian oil exposes the growing conflict between producer sovereignty and foreign corporate control.',
    },
    {
        id: 'ev-1956-suez-crisis',
        year: '1956',
        title: 'Suez Crisis',
        relevance:
            'Britain and France fail to independently enforce the old regional order, revealing the decline of European imperial power.',
    },
    {
        id: 'ev-1960-opec-founded',
        year: '1960',
        title: 'OPEC founded',
        relevance:
            'Middle Eastern producers join with other exporters to coordinate against the pricing and concession power of international oil companies.',
    },
    {
        id: 'ev-1973-arab-oil-embargo',
        year: '1973',
        title: 'Arab oil embargo',
        relevance:
            'Oil becomes an explicit geopolitical weapon and Gulf producers demonstrate unprecedented pricing and supply leverage.',
    },
    {
        id: 'ev-1970s-oil-nationalizations',
        year: '1970s',
        title: 'Oil nationalizations',
        relevance:
            'Producer governments take direct ownership of petroleum assets, completing the shift away from the foreign concession system.',
    },
    {
        id: 'ev-1979-iranian-revolution',
        year: '1979',
        title: 'Iranian Revolution',
        relevance:
            'Iran shifts from a major US ally to a revolutionary anti-Western state, triggering another oil shock and reshaping Gulf security.',
    },
    {
        id: 'ev-1980-88-iran-iraq-war',
        year: '1980–88',
        title: 'Iran–Iraq War',
        relevance:
            'The war threatens production and shipping while Gulf monarchies deepen security and financial support for the regional balance against Iran.',
    },
    {
        id: 'ev-1990-91-gulf-war',
        year: '1990–91',
        title: 'Gulf War',
        relevance:
            'The US becomes the decisive military backstop of the Gulf oil system after Iraq invades Kuwait.',
    },
    {
        id: 'ev-2003-iraq-war',
        year: '2003',
        title: 'Iraq War',
        relevance:
            'The removal of Saddam Hussein weakens Iraq as a regional counterweight and expands Iranian strategic influence.',
    },
    {
        id: 'ev-2011-arab-spring',
        year: '2011',
        title: 'Arab Spring',
        relevance:
            'Regional instability increases the relative importance of stable Gulf monarchies and reinforces regime-security priorities.',
    },
    {
        id: 'ev-2023-gaza-war-regional-escalation',
        year: '2023–',
        title: 'Gaza war & regional escalation',
        relevance:
            'Israel–Iran confrontation, Red Sea disruption and regional proxy conflict bring security risk back to the center of Middle Eastern energy politics.',
    },
];
