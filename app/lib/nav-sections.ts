export const NAV_SECTIONS: {
    match: string;
    items: { label: string; href: string; sub?: string }[];
}[] = [
        {
            match: '/regime',
            items: [
                { label: 'State', href: '/regime', sub: 'Current Regime' },
                { label: 'Proximity', href: '/regime/proximity', sub: 'Entry Signals' },
                { label: 'Historical', href: '/regime/historical', sub: 'Period Table' },
                { label: 'Returns', href: '/regime/returns', sub: 'Asset Performance' },
                { label: 'Regimes', href: '/regime/regimes', sub: 'By Type' },
            ],
        },
        {
            match: '/cycle',
            items: [
                { label: 'Trend', href: '/cycle', sub: 'Phase Clock' },
                { label: 'Cycles', href: '/cycle/cycles', sub: 'Macro Narrative' },
                { label: 'Mega-Bubble', href: '/cycle/mega-bubble', sub: 'Historical Peaks' },
            ],
        },
        {
            match: '/stocks',
            items: [
                { label: 'Leaderboard', href: '/stocks', sub: 'By Market Cap' },
                { label: 'Screener', href: '/stocks/stock-screener', sub: 'Filter & Rank' },
            ],
        },
        {
            match: '/asymmetry',
            items: [{ label: 'Overview', href: '/asymmetry', sub: 'Risk / Reward' }],
        },
        {
            match: '/judgment',
            items: [{ label: 'Synthesis', href: '/judgment', sub: 'Final Read' }],
        },
        {
            match: '/council',
            items: [{ label: 'Chamber', href: '/council', sub: 'Agent Council' }],
        },
    ];

/** Returns true when the given pathname has an active subnav with >1 item */
export function hasSubnav(pathname: string): boolean {
    const section = NAV_SECTIONS
        .filter(s => pathname.startsWith(s.match))
        .sort((a, b) => b.match.length - a.match.length)[0];
    return !!(section && section.items.length > 1);
}

export const NAVBAR_H = 60;   // px — main navbar height
export const SUBNAV_H = 40;   // px — subnav height
