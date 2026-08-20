// ─── paradigms.ts ─────────────────────────────────────────────────────────────
// The canonical capital paradigm for each decade — the single source both the
// all-decades views (/capital/inversions) and the per-decade drill-down
// (/capital/decades/[decade]) read from.
//
// inflection    — the event that opened the paradigm
// capitalCenter — where capital accumulated, as narrated
// geography     — the same, as a single comparable term for inversion diffs
// assetClass    — dominant appreciating asset class
// sectorTheme   — dominant investable sector / narrative
// macro         — broader macroeconomic regime
// narrative     — the story the decade told itself
// mechanism     — why that story compounded
// expression    — how it was actually bought
// benchmark     — where it showed up in prices
//
// Inversions are derived by comparing adjacent decades.
// ─────────────────────────────────────────────────────────────────────────────

export interface Paradigm {
    decade: string;
    startYear: number;
    endYear: number;
    inflection: string;
    capitalCenter: string;
    geography: string;
    assetClass: string;
    sectorTheme: string;
    macro: string;
    narrative: string;
    mechanism: string;
    expression: string;
    benchmark?: string;
    summary: string;
}

export const PARADIGMS: Paradigm[] = [
    {
        decade: '1950s',
        startYear: 1950,
        endYear: 1959,
        inflection: 'End of WWII · Bretton Woods order',
        capitalCenter: 'Western Europe',
        geography: 'Europe',
        assetClass: 'Stocks',
        sectorTheme: 'Reconstruction / Industrials',
        macro: 'Postwar Growth',
        narrative: 'Postwar reconstruction',
        mechanism: 'Reconstruction + productivity catch-up',
        expression: 'Industrials, machinery, infrastructure, manufacturing',
        benchmark: 'European equities',
        summary:
            'Postwar reconstruction and rapid economic recovery made European equities and industrial growth a major capital opportunity.',
    },
    {
        decade: '1960s',
        startYear: 1960,
        endYear: 1969,
        inflection: 'Postwar boom matures · Multinational expansion',
        capitalCenter: 'United States',
        geography: 'United States',
        assetClass: 'Stocks',
        sectorTheme: 'Growth Stocks',
        macro: 'Growth / Rising Inflation',
        narrative: 'American corporate expansion',
        mechanism: 'Scale + mass consumption + international expansion',
        expression: 'Consumer brands, industrials, conglomerates, multinationals',
        benchmark: 'S&P 500',
        summary:
            'Capital leadership shifted toward US growth equities as investors rewarded expanding corporations and increasingly high-growth companies.',
    },
    {
        decade: '1970s',
        startYear: 1970,
        endYear: 1979,
        inflection: 'Gold window closes · Oil shocks',
        capitalCenter: 'Global commodities',
        geography: 'Resource Exporters',
        assetClass: 'Commodities',
        sectorTheme: 'Energy / Materials',
        macro: 'Stagflation / Weak Dollar',
        narrative: 'Scarcity and inflation',
        mechanism: 'Inflation + supply constraints',
        expression: 'Oil, gold, mining, energy producers, commodity assets',
        benchmark: 'Gold · Oil',
        summary:
            'Inflation and monetary instability shifted capital toward commodities, energy, and resource-producing economies.',
    },
    {
        decade: '1980s',
        startYear: 1980,
        endYear: 1989,
        inflection: 'Volcker disinflation · Financial deregulation',
        capitalCenter: 'United States · Japan',
        geography: 'Japan',
        assetClass: 'Stocks',
        sectorTheme: 'Japanese Corporations / Financials',
        macro: 'Disinflation / Falling Rates',
        narrative: 'Financial expansion · Asset boom',
        mechanism: 'Falling inflation + financial liberalization + credit growth',
        expression: 'Equities, property, banks, leveraged finance',
        benchmark: 'S&P 500 · Nikkei 225',
        summary:
            'Disinflation restored financial-asset leadership while Japan emerged as the defining equity market of the decade.',
    },
    {
        decade: '1990s',
        startYear: 1990,
        endYear: 1999,
        inflection: 'Cold War ends · Internet commercialization',
        capitalCenter: 'United States',
        geography: 'United States',
        assetClass: 'Stocks',
        sectorTheme: 'Technology / Internet',
        macro: 'Globalization / Disinflation',
        narrative: 'The information age',
        mechanism: 'Digitization + network effects',
        expression: 'PCs, semiconductors, telecom, software, internet',
        benchmark: 'Nasdaq Composite',
        summary:
            'Capital returned to US equities as technology and the internet created the decade’s dominant investment paradigm.',
    },
    {
        decade: '2000s',
        startYear: 2000,
        endYear: 2009,
        inflection: 'China joins WTO · Dot-com bust',
        capitalCenter: 'China · Emerging Markets',
        geography: 'Emerging Markets',
        assetClass: 'Commodities',
        sectorTheme: 'Resources / China Industrialization',
        macro: 'Reflation / Weak Dollar',
        narrative: 'Emerging-market convergence',
        mechanism: 'Industrialization + globalization + urbanization',
        expression: 'China, EM equities, mining, energy, infrastructure',
        benchmark: 'MSCI EM · Commodities',
        summary:
            'Capital shifted away from US technology toward commodities and emerging markets driven by rapid industrialization.',
    },
    {
        decade: '2010s',
        startYear: 2010,
        endYear: 2019,
        inflection: 'Global Financial Crisis · Zero-rate era',
        capitalCenter: 'United States',
        geography: 'United States',
        assetClass: 'Stocks',
        sectorTheme: 'Mega-Cap Technology',
        macro: 'Low Inflation / QE',
        narrative: 'Software eats the world',
        mechanism: 'Intangibles + network scale + near-zero marginal cost',
        expression: 'Platforms, cloud, SaaS, smartphones, private technology',
        benchmark: 'Nasdaq 100 · FAANG',
        summary:
            'US equities regained leadership as digital platforms and mega-cap technology companies accumulated enormous amounts of capital.',
    },
    {
        decade: '2020s',
        startYear: 2020,
        endYear: 2029,
        inflection: 'COVID shock · Fiscal expansion · Inflation · Geopolitical reset',
        capitalCenter: 'United States',
        geography: 'United States',
        assetClass: 'Stocks',
        sectorTheme: 'AI / Semiconductors',
        macro: 'Inflation / Higher Rates',
        narrative: 'AI / compute buildout',
        mechanism: 'Compute scaling',
        expression: 'Semiconductors, hyperscalers, datacenters, power infrastructure',
        benchmark: 'Semiconductors · Megacap tech',
        summary:
            'So far, capital leadership has remained concentrated in US equities, increasingly around AI and semiconductor infrastructure.',
    },
];

export const PARADIGM_BY_DECADE: Record<string, Paradigm> =
    Object.fromEntries(
        PARADIGMS.map((p) => [p.decade, p]),
    );

export function getParadigmByYear(year: number): Paradigm | undefined {
    return PARADIGMS.find(
        (p) => year >= p.startYear && year <= p.endYear,
    );
}

/** The dimensions an inversion is measured across, adjacent decade to decade. */
export function paradigmShiftRows(previous: Paradigm, current: Paradigm) {
    return [
        { dimension: 'Asset Class', prev: previous.assetClass, next: current.assetClass },
        { dimension: 'Geography', prev: previous.geography, next: current.geography },
        { dimension: 'Sector / Theme', prev: previous.sectorTheme, next: current.sectorTheme },
    ];
}
