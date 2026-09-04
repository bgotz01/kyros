// ─── middleEast.ts ────────────────────────────────────────────────────────────

// Middle Eastern oil through I³ — the historical overview behind
// /commodities/oil/geopolitics/middle-east.
//
// One row per decade. Each row captures the dominant forces shaping the
// Middle Eastern oil paradigm rather than cataloguing individual events.
//
// inflection — the events or structural changes that opened the paradigm
// incentive  — how those changes redirected behavior, capital, or production
// inversion  — the assumption or power structure that flipped, as `from → to`
// influence  — the actors with the greatest ability to shape the oil system
//
// ─────────────────────────────────────────────────────────────────────────────

import type { Inversion } from './oil';

export interface MiddleEastDecade {
    /** Rendered as written — "1900s". */
    decade: string;

    inflection: string;
    incentive: string;
    inversion: Inversion;

    /** Dominant geopolitical influence over the oil system during the decade. */
    influence: string;
}

// ─── Decade paradigms ─────────────────────────────────────────────────────────

export const MIDDLE_EAST: MiddleEastDecade[] = [
    {
        decade: '1900s',
        inflection: 'Persian oil concession (1901) · Oil discovery (1908)',
        incentive:
            'Western capital and technology enter in exchange for long-term access to petroleum',
        inversion: {
            from: 'Undeveloped resource',
            to: 'Foreign concession',
        },
        influence: 'Britain',
    },
    {
        decade: '1910s',
        inflection:
            'Anglo-Persian Oil Company formed (1909) · Oil becomes strategically important',
        incentive:
            'Secure petroleum production becomes increasingly important to industry and the Royal Navy',
        inversion: {
            from: 'Commercial commodity',
            to: 'Strategic resource',
        },
        influence: 'Britain',
    },
    {
        decade: '1920s',
        inflection: 'Ottoman collapse · Red Line Agreement (1928)',
        incentive:
            'Western powers and oil majors compete for and divide access to former Ottoman petroleum resources',
        inversion: {
            from: 'Ottoman sovereignty',
            to: 'Western concession system',
        },
        influence: 'Britain · France · US emerging',
    },
    {
        decade: '1930s',
        inflection:
            'Persian Gulf discoveries · Saudi concession (1933) · Saudi oil discovery (1938)',
        incentive:
            'Western companies race to secure large, low-cost Gulf reserves while regional rulers gain capital and technical expertise',
        inversion: {
            from: 'British dominance',
            to: 'Anglo-American competition',
        },
        influence: 'Britain · US rising',
    },
    {
        decade: '1940s',
        inflection: 'World War II ends (1945) · US–Saudi relationship',
        incentive:
            'Oil becomes essential to military and economic power while US capital and industrial capacity accelerate Gulf development',
        inversion: {
            from: 'British imperial dominance',
            to: 'American ascendancy',
        },
        influence: 'United States rising · Britain declining',
    },
    {
        decade: '1950s',
        inflection:
            '50/50 profit sharing · Iranian nationalization crisis · Suez Crisis',
        incentive:
            'Producer governments demand a greater share of petroleum rents and greater sovereignty over strategic resources',
        inversion: {
            from: 'Foreign-company dominance',
            to: 'Producer bargaining power',
        },
        influence: 'United States · Producers rising · Britain declining',
    },
    {
        decade: '1960s',
        inflection: 'OPEC founded (1960) · Producer coordination',
        incentive:
            'Oil-producing states coordinate to strengthen their bargaining position against Western oil majors',
        inversion: {
            from: 'Western major coordination',
            to: 'Producer coordination',
        },
        influence: 'OPEC rising · US and British majors',
    },
    {
        decade: '1970s',
        inflection: '1973 oil embargo · Oil-price shock · Nationalization',
        incentive:
            'Producers restrict supply, capture ownership and dramatically increase the petroleum rents flowing to exporting states',
        inversion: {
            from: 'Western ownership and buyer power',
            to: 'Producer control and pricing power',
        },
        influence: 'OPEC · Gulf producers',
    },
    {
        decade: '1980s',
        inflection: 'Iran–Iraq War · Non-OPEC supply growth · 1986 oil collapse',
        incentive:
            'High prices encourage conservation and competing supply while producers increasingly defend market share',
        inversion: {
            from: 'Oil scarcity',
            to: 'Oil surplus',
        },
        influence: 'Saudi Arabia · OPEC, with declining pricing power',
    },
    {
        decade: '1990s',
        inflection: 'Iraq invades Kuwait · Gulf War · Cheap oil',
        incentive:
            'US security protects Gulf production while abundant supply supports rising consumption and global economic integration',
        inversion: {
            from: 'Producer geopolitical autonomy',
            to: 'US-protected Gulf oil order',
        },
        influence: 'United States · Saudi Arabia',
    },
    {
        decade: '2000s',
        inflection: 'China demand boom · Iraq War · Oil supercycle',
        incentive:
            'Rapid Asian industrialization creates enormous incremental demand while global supply struggles to expand as quickly',
        inversion: {
            from: 'Cheap oil abundance',
            to: 'Demand-driven scarcity',
        },
        influence: 'Gulf producers · United States · China rising',
    },
    {
        decade: '2010s',
        inflection: 'US shale revolution · 2014 oil-price collapse',
        incentive:
            'High prices and new extraction technology unlock responsive US production and force OPEC to compete for market share',
        inversion: {
            from: 'OPEC supply dominance',
            to: 'US shale competition',
        },
        influence: 'United States · Saudi Arabia · OPEC',
    },
    {
        decade: '2020s',
        inflection:
            'COVID oil shock · Russia–Ukraine War · Renewed Middle East instability',
        incentive:
            'Energy security, spare capacity and resilient supply regain strategic importance as geopolitical fragmentation reshapes trade',
        inversion: {
            from: 'Globalized oil abundance',
            to: 'Geopolitical fragmentation',
        },
        influence: 'United States · Saudi Arabia · Russia · China',
    },
];