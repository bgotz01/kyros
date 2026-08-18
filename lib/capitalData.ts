// ─── slugs ────────────────────────────────────────────────────────────────────

export const DECADE_SLUGS = [
    '1950s',
    '1960s',
    '1970s',
    '1980s',
    '1990s',
    '2000s',
    '2010s',
    '2020s',
] as const;

export type DecadeSlug = (typeof DECADE_SLUGS)[number];

// ─── section nav ──────────────────────────────────────────────────────────────

export const DECADE_SECTIONS = [
    { slug: '', label: 'Themes' },
    { slug: 'inversions', label: 'Inversions' },
    { slug: 'incentives', label: 'Incentives' },
    { slug: 'inflections', label: 'Inflections' },
] as const;

// ─── types ────────────────────────────────────────────────────────────────────

export type InvestmentTheme = {
    name: string;
    narrative: string;
    assets: string[];
    examples: string[];
};

export type InvestmentDecade = {
    decade: string;
    themes: InvestmentTheme[];
};

// ─── data ─────────────────────────────────────────────────────────────────────

export const INVESTMENT_THEMES: InvestmentDecade[] = [
    {
        decade: '1950s',
        themes: [
            {
                name: 'American Industrial Expansion',
                narrative: 'Postwar industrial and infrastructure boom',
                assets: ['U.S. industrials', 'Steel', 'Machinery', 'Chemicals'],
                examples: ['General Motors', 'U.S. Steel', 'DuPont'],
            },
            {
                name: 'Consumer America',
                narrative: 'Mass consumption, suburbanization, and rising household wealth',
                assets: ['Autos', 'Consumer goods', 'Retail'],
                examples: ['General Motors', 'Ford', 'Sears'],
            },
        ],
    },
    {
        decade: '1960s',
        themes: [
            {
                name: 'Growth Stocks',
                narrative: 'Investors pay increasingly high valuations for dependable growth',
                assets: ['Large-cap growth stocks', 'Consumer franchises', 'Pharmaceuticals'],
                examples: ['IBM', 'Xerox', 'Polaroid'],
            },
            {
                name: 'Electronics & Computing',
                narrative: 'Computing and electronics emerge as major commercial industries',
                assets: ['Computers', 'Semiconductors', 'Electronics'],
                examples: ['IBM', 'Texas Instruments', 'Fairchild Semiconductor'],
            },
        ],
    },
    {
        decade: '1970s',
        themes: [
            {
                name: 'Oil & Energy',
                narrative: 'Oil shocks and scarcity radically reprice energy',
                assets: ['Oil', 'Oil producers', 'Energy equities'],
                examples: ['Exxon', 'Mobil', 'Chevron'],
            },
            {
                name: 'Commodities',
                narrative: 'Inflation and scarcity drive a broad real-asset boom',
                assets: ['Gold', 'Silver', 'Copper', 'Agriculture'],
                examples: ['Gold', 'Silver', 'Copper'],
            },
            {
                name: 'Inflation Hedges',
                narrative: 'Investors seek assets capable of preserving purchasing power',
                assets: ['Precious metals', 'Real estate', 'Collectibles'],
                examples: ['Gold', 'U.S. real estate'],
            },
        ],
    },
    {
        decade: '1980s',
        themes: [
            {
                name: 'Japanese Assets',
                narrative: 'Japan becomes the world\'s great capital accumulation story',
                assets: ['Japanese equities', 'Japanese real estate'],
                examples: ['Nikkei 225', 'Tokyo real estate', 'Japanese banks'],
            },
            {
                name: 'Bonds',
                narrative: 'Falling inflation and interest rates begin a historic bond bull market',
                assets: ['Treasuries', 'Corporate bonds'],
                examples: ['U.S. Treasuries'],
            },
            {
                name: 'Finance & Leveraged Capital',
                narrative: 'Deregulation and financial innovation expand the role of capital markets',
                assets: ['Financial stocks', 'LBOs', 'High-yield bonds'],
                examples: ['Wall Street banks', 'Junk bonds', 'Private equity'],
            },
        ],
    },
    {
        decade: '1990s',
        themes: [
            {
                name: 'Internet & Technology',
                narrative: 'The internet creates an entirely new economic and investment frontier',
                assets: ['Internet stocks', 'Software', 'Semiconductors', 'Telecom'],
                examples: ['Microsoft', 'Cisco', 'Intel', 'AOL'],
            },
            {
                name: 'U.S. Growth Equities',
                narrative: 'Disinflation, productivity growth, and globalization favor U.S. equities',
                assets: ['Large-cap growth', 'Technology', 'Consumer'],
                examples: ['S&P 500', 'Nasdaq'],
            },
            {
                name: 'Emerging Markets',
                narrative: 'Globalization opens previously inaccessible economies to foreign capital',
                assets: ['Asian equities', 'Latin American equities', 'EM debt'],
                examples: ['South Korea', 'Taiwan', 'Brazil'],
            },
        ],
    },
    {
        decade: '2000s',
        themes: [
            {
                name: 'China & Emerging Markets',
                narrative: 'China\'s industrialization shifts the center of global growth',
                assets: ['Chinese equities', 'EM equities', 'EM currencies'],
                examples: ['China', 'Brazil', 'India', 'Russia'],
            },
            {
                name: 'Commodities',
                narrative: 'Chinese industrial demand produces a global commodity supercycle',
                assets: ['Oil', 'Copper', 'Iron ore', 'Gold'],
                examples: ['Oil', 'Copper', 'BHP', 'Rio Tinto'],
            },
            {
                name: 'Housing & Credit',
                narrative: 'Cheap credit and financial engineering drive an enormous property boom',
                assets: ['Residential real estate', 'Homebuilders', 'Mortgage credit'],
                examples: ['U.S. housing', 'REITs', 'Homebuilders'],
            },
        ],
    },
    {
        decade: '2010s',
        themes: [
            {
                name: 'Big Tech & Platforms',
                narrative: 'Network effects allow digital platforms to accumulate unprecedented scale',
                assets: ['Technology equities', 'Internet platforms', 'Cloud'],
                examples: ['Apple', 'Amazon', 'Google', 'Facebook', 'Microsoft'],
            },
            {
                name: 'Venture Capital & Private Tech',
                narrative: 'Cheap capital finances a massive expansion of private technology companies',
                assets: ['Venture capital', 'Private technology'],
                examples: ['Uber', 'Airbnb', 'Stripe', 'SpaceX'],
            },
            {
                name: 'Crypto',
                narrative: 'Digital scarcity creates a new speculative and monetary asset class',
                assets: ['Bitcoin', 'Cryptoassets'],
                examples: ['Bitcoin', 'Ethereum'],
            },
        ],
    },
    {
        decade: '2020s',
        themes: [
            {
                name: 'Artificial Intelligence',
                narrative: 'AI becomes a new computing platform and drives enormous infrastructure investment',
                assets: ['Semiconductors', 'Cloud', 'AI infrastructure', 'AI software'],
                examples: ['Nvidia', 'Microsoft', 'Broadcom', 'TSMC'],
            },
            {
                name: 'Crypto & Digital Assets',
                narrative: 'Crypto matures from a speculative niche toward institutional capital',
                assets: ['Bitcoin', 'Cryptoassets', 'Crypto infrastructure'],
                examples: ['Bitcoin', 'Ethereum', 'Coinbase'],
            },
            {
                name: 'Electrification & Energy Infrastructure',
                narrative: 'Electrification, data centers, and energy constraints create a new physical-capital cycle',
                assets: ['Power', 'Grid infrastructure', 'Uranium', 'Copper'],
                examples: ['Utilities', 'Uranium', 'Copper', 'Grid equipment'],
            },
        ],
    },
];
