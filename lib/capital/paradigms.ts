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
// rotation      — the asset the rotation ran through, and its decade return
//
// Inversions are derived by comparing adjacent decades.
// ─────────────────────────────────────────────────────────────────────────────

/** A decade price return. `measured` distinguishes what was computed from the
 *  macro database from what had to be estimated — no series covers everything. */
export interface DecadeReturn {
    pct: number;
    measured: boolean;
    /** What was measured, or how the estimate was reached. */
    basis: string;
}

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
    /** The asset the rotation actually ran through. */
    rotation?: string;
    /** What that asset actually contains, and what it was priced at. */
    rotationNote?: string;
    /** That asset's price return over the decade. */
    rotationReturn?: DecadeReturn;
    /** The Dow's price return over the same decade — the oldest continuous
     *  index, and so the only one that reaches every decade here. */
    benchmarkReturn?: DecadeReturn;
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
        rotation: 'German equities',
        rotationNote: 'The German equity price index — all listed German shares — standing as proxy for the European reconstruction rotation. Germany is the archetype of the decade rather than the whole of Europe.',
        rotationReturn: { pct: 909, measured: true, basis: 'German equity price index 14.6 → 147.3, 1949 to 1959 — a 10.1x decade. From data/German-Stock-History.csv, standing as proxy for the European rotation. Price index, matching the Dow leg; total return with dividends was 12.9x. Taken 1950→1960 instead it is 11.2x.' },
        benchmarkReturn: { pct: 239, measured: true, basis: 'Dow Jones 200.13 → 679.36, Dec 1949 to Dec 1959.' },
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
        rotation: 'S&P 500',
        rotationNote: 'The S&P 500, as the vehicle for US corporate expansion. The Nifty Fifty proper — the fifty large-cap growth names bid to extreme multiples into the 1972 peak — is not in the data yet, so this understates the rotation.',
        rotationReturn: { pct: 54, measured: true, basis: 'S&P 500 59.91 → 92.06, Jan 1960 to Dec 1969. Nifty Fifty proper is not in the data yet.' },
        benchmarkReturn: { pct: 18, measured: true, basis: 'Dow Jones 679.36 → 800.36, Dec 1959 to Dec 1969.' },
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
        rotation: 'Gold · Oil',
        rotationNote: 'In 1970 the official price of gold was fixed at $35.00 per troy ounce, and oil was about $3 per barrel. Both were freed over the decade: gold reached $512 by December 1979, oil roughly $32 after the 1973 and 1979 shocks. The figure shown is gold.',
        rotationReturn: { pct: 1350, measured: false, basis: 'Gold $35.20 → $512, Dec 1969 to Dec 1979. Our price data begins 1975, so this is the published fix, not a measured series.' },
        benchmarkReturn: { pct: 5, measured: true, basis: 'Dow Jones 800.36 → 838.71, Dec 1969 to Dec 1979.' },
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
        rotation: 'Nikkei 225',
        rotationNote: 'The Nikkei 225 — Japanese equities, property and the leveraged finance behind both, running to 38,916 by December 1989 before the collapse that opened the 1990s. US equities ran hard this decade too: the S&P 500 returned +227%, but Japan was where the rotation went.',
        rotationReturn: { pct: 492, measured: true, basis: 'Nikkei 225 6,569 → 38,916, Dec 1979 to Dec 1989.' },
        benchmarkReturn: { pct: 228, measured: true, basis: 'Dow Jones 838.71 → 2,753.20, Dec 1979 to Dec 1989.' },
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
        rotation: 'Nasdaq Composite',
        rotationNote: 'The Nasdaq Composite: PCs, semiconductors, telecom, software and the early internet.',
        rotationReturn: { pct: 795, measured: true, basis: 'Nasdaq Composite 454.80 → 4,069.31, Dec 1989 to Dec 1999.' },
        benchmarkReturn: { pct: 318, measured: true, basis: 'Dow Jones 2,753.20 → 11,497.12, Dec 1989 to Dec 1999.' },
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
        rotation: 'MSCI EM · Commodities',
        rotationNote: 'MSCI Emerging Markets alongside the commodity complex that fed it. Neither database carries an EM series — the EEM ETF did not launch until April 2003, and returned +265% over the 6.7 years of the decade it does cover.',
        rotationReturn: { pct: 150, measured: false, basis: 'MSCI Emerging Markets, USD price return. No EM series in the database — estimated from the published index.' },
        benchmarkReturn: { pct: -9, measured: true, basis: 'Dow Jones 11,497.12 → 10,428.05, Dec 1999 to Dec 2009.' },
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
        rotation: 'FAANG',
        rotationNote: 'Facebook, Apple, Amazon, Netflix and Google — equal-weighted and rebalanced daily from December 2009. Meta enters at its May 2012 IPO as an index addition rather than being backfilled, which is why the index trails a straight buy-and-hold of the four that were already listed. The Nasdaq 100 returned +369% over the same decade.',
        rotationReturn: { pct: 1494, measured: true, basis: 'Equal-weighted FAANG index built from stockdata: 100.00 → 1,593.53, Dec 2009 to Dec 2019. Constituent price returns — NFLX +3,996%, AMZN +1,273%, AAPL +875%, META +437% from IPO, GOOGL +332%. Buy-and-hold of the four listed at the start gives +1,619%.' },
        benchmarkReturn: { pct: 174, measured: true, basis: 'Dow Jones 10,428.05 → 28,538.44, Dec 2009 to Dec 2019.' },
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
        rotation: 'Semiconductors · Megacap tech',
        rotationNote: 'NVDA, AVGO, MU and AMD, equal-weighted and held from December 2019. Four winners chosen in hindsight rather than an index: SOXX returned +306% and SMH +455% over the same window.',
        rotationReturn: { pct: 1893, measured: true, basis: 'NVDA, AVGO, MU and AMD equal-weighted from stockdata, Dec 2019 to Aug 2026: +3,732%, +1,222%, +1,666%, +953%. Four winners chosen in hindsight, not an index — the SOXX semiconductor index returned +306% and SMH +455% over the same window.' },
        benchmarkReturn: { pct: 90, measured: true, basis: 'Dow Jones 28,538.44 → 54,349.12, Dec 2019 to Aug 2026. Decade still running.' },
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
