// ─── oil.ts ───────────────────────────────────────────────────────────────────

// Oil read through I³ — the global historical overview behind /commodities/oil.
//
// One row per decade. Each row captures the dominant forces shaping the global
// oil paradigm rather than cataloguing individual events.
//
// inflection — the events or structural changes that opened the paradigm
// incentive  — how those changes redirected behavior, capital, or production
// inversion  — the assumption or market structure that flipped, as `from → to`
// influence  — the actors with the greatest ability to shape the global oil system
//
// Geopolitical drill-downs provide the regional histories behind these shifts.
//
// ─────────────────────────────────────────────────────────────────────────────

export interface Inversion {
    /** The assumption or structure that stopped holding. */
    from: string;

    /** What replaced it. */
    to: string;
}

export interface OilDecade {
    /** Rendered as written — "1900s". */
    decade: string;

    inflection: string;
    incentive: string;
    inversion: Inversion;

    /** Dominant influence over the global oil system during the decade. */
    influence: string;
}

// ─── Decade paradigms ─────────────────────────────────────────────────────────

export const OIL_DECADES: OilDecade[] = [
    {
        decade: '1900s',
        inflection:
            'Mass automobile adoption begins · Persian oil discovered (1908)',
        incentive:
            'Internal combustion creates a rapidly expanding market for petroleum while new discoveries widen the global resource base',
        inversion: {
            from: 'Petroleum as niche fuel',
            to: 'Mass industrial commodity',
        },
        influence: 'United States · Britain',
    },
    {
        decade: '1910s',
        inflection:
            'Anglo-Persian Oil Company · Naval conversion to oil · World War I',
        incentive:
            'Mobility, mechanized warfare and naval power make secure petroleum supply strategically essential',
        inversion: {
            from: 'Commercial commodity',
            to: 'Strategic resource',
        },
        influence: 'United States · Britain',
    },
    {
        decade: '1920s',
        inflection:
            'Automobile boom · Middle East concession system · Red Line Agreement',
        incentive:
            'Mass motorization drives petroleum demand while Western majors secure long-duration access to new reserves',
        inversion: {
            from: 'Regional oil industry',
            to: 'International oil system',
        },
        influence: 'United States · Britain · Western oil majors',
    },
    {
        decade: '1930s',
        inflection:
            'Texas oil boom · Persian Gulf discoveries · Saudi concession',
        incentive:
            'Large discoveries and improved production create abundant low-cost supply while companies compete for control of future reserves',
        inversion: {
            from: 'Oil scarcity',
            to: 'Managed abundance',
        },
        influence: 'United States · Britain · Western oil majors',
    },
    {
        decade: '1940s',
        inflection:
            'World War II · US production dominance · Middle East expansion',
        incentive:
            'Industrial warfare demonstrates petroleum’s strategic importance while postwar demand encourages development of enormous low-cost Middle Eastern reserves',
        inversion: {
            from: 'US-centered production',
            to: 'Middle East supply expansion',
        },
        influence: 'United States · Western oil majors',
    },
    {
        decade: '1950s',
        inflection:
            'Postwar motorization · Middle East production boom · Suez Crisis',
        incentive:
            'Rapid Western economic growth and automobile ownership drive petroleum consumption while cheap Middle Eastern supply scales rapidly',
        inversion: {
            from: 'US-centered oil supply',
            to: 'Middle East dependence',
        },
        influence: 'United States · Western majors · Middle East rising',
    },
    {
        decade: '1960s',
        inflection:
            'OPEC founded · Global consumption boom · US spare capacity declines',
        incentive:
            'Rapid demand growth increases dependence on low-cost exporting states while producers coordinate for greater control over petroleum rents',
        inversion: {
            from: 'Western major dominance',
            to: 'Producer-state leverage',
        },
        influence: 'United States · Western majors · OPEC rising',
    },
    {
        decade: '1970s',
        inflection:
            'US production peaks · 1973 embargo · 1979 oil shock',
        incentive:
            'Declining Western spare capacity and geopolitical supply disruptions give exporters extraordinary pricing leverage',
        inversion: {
            from: 'Cheap oil abundance',
            to: 'Producer scarcity power',
        },
        influence: 'OPEC · Saudi Arabia · Middle East producers',
    },
    {
        decade: '1980s',
        inflection:
            'Non-OPEC supply boom · Conservation · 1986 oil-price collapse',
        incentive:
            'The previous decade’s high prices stimulate new production, efficiency and demand substitution, undermining OPEC pricing power',
        inversion: {
            from: 'Producer scarcity power',
            to: 'Competitive abundance',
        },
        influence: 'Saudi Arabia · OPEC · North Sea · Soviet Union',
    },
    {
        decade: '1990s',
        inflection:
            'Gulf War · Soviet collapse · Globalization · Cheap oil',
        incentive:
            'Abundant supply, geopolitical protection of Gulf production and expanding global trade support rising petroleum consumption',
        inversion: {
            from: 'Energy scarcity',
            to: 'Cheap global supply',
        },
        influence: 'United States · Saudi Arabia · Russia emerging',
    },
    {
        decade: '2000s',
        inflection:
            'China industrialization · Iraq War · Commodity supercycle',
        incentive:
            'Rapid emerging-market demand collides with slowly expanding conventional supply, rewarding production investment and resource ownership',
        inversion: {
            from: 'Cheap global supply',
            to: 'Demand-driven scarcity',
        },
        influence: 'China · Saudi Arabia · Russia · United States',
    },
    {
        decade: '2010s',
        inflection:
            'US shale revolution · 2014 oil-price collapse',
        incentive:
            'High prices, horizontal drilling and hydraulic fracturing unlock enormous responsive US production and force OPEC to defend market share',
        inversion: {
            from: 'Conventional scarcity',
            to: 'Shale abundance',
        },
        influence: 'United States · Saudi Arabia · Russia',
    },
    {
        decade: '2020s',
        inflection:
            'COVID oil shock · Russia–Ukraine War · Post-shale capital discipline',
        incentive:
            'Supply underinvestment, sanctions and energy-security concerns increase the value of spare capacity and reliable production',
        inversion: {
            from: 'Shale-driven abundance',
            to: 'Constrained and fragmented supply',
        },
        influence: 'United States · Saudi Arabia · Russia · China',
    },
];