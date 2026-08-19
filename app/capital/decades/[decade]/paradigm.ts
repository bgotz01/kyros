// ─── paradigms.ts ─────────────────────────────────────────────────────────────
// Kyros historical capital paradigms by decade.
//
// assetClass  — dominant appreciating asset class
// geography   — strongest major geographic capital opportunity
// sectorTheme — dominant investable sector / narrative
// macro       — broader macroeconomic regime
//
// Inversions are derived by comparing adjacent decades.
// ─────────────────────────────────────────────────────────────────────────────

export interface DecadeParadigm {
    decade: string;
    startYear: number;
    endYear: number;
    assetClass: string;
    geography: string;
    sectorTheme: string;
    macro: string;
    summary: string;
}

export const DECADE_PARADIGMS: DecadeParadigm[] = [
    {
        decade: '1950s',
        startYear: 1950,
        endYear: 1959,
        assetClass: 'Stocks',
        geography: 'Europe',
        sectorTheme: 'Reconstruction / Industrials',
        macro: 'Postwar Growth',
        summary:
            'Postwar reconstruction and rapid economic recovery made European equities and industrial growth a major capital opportunity.',
    },
    {
        decade: '1960s',
        startYear: 1960,
        endYear: 1969,
        assetClass: 'Stocks',
        geography: 'United States',
        sectorTheme: 'Growth Stocks',
        macro: 'Growth / Rising Inflation',
        summary:
            'Capital leadership shifted toward US growth equities as investors rewarded expanding corporations and increasingly high-growth companies.',
    },
    {
        decade: '1970s',
        startYear: 1970,
        endYear: 1979,
        assetClass: 'Commodities',
        geography: 'Resource Exporters',
        sectorTheme: 'Energy / Materials',
        macro: 'Stagflation / Weak Dollar',
        summary:
            'Inflation and monetary instability shifted capital toward commodities, energy, and resource-producing economies.',
    },
    {
        decade: '1980s',
        startYear: 1980,
        endYear: 1989,
        assetClass: 'Stocks',
        geography: 'Japan',
        sectorTheme: 'Japanese Corporations / Financials',
        macro: 'Disinflation / Falling Rates',
        summary:
            'Disinflation restored financial-asset leadership while Japan emerged as the defining equity market of the decade.',
    },
    {
        decade: '1990s',
        startYear: 1990,
        endYear: 1999,
        assetClass: 'Stocks',
        geography: 'United States',
        sectorTheme: 'Technology / Internet',
        macro: 'Globalization / Disinflation',
        summary:
            'Capital returned to US equities as technology and the internet created the decade’s dominant investment paradigm.',
    },
    {
        decade: '2000s',
        startYear: 2000,
        endYear: 2009,
        assetClass: 'Commodities',
        geography: 'Emerging Markets',
        sectorTheme: 'Resources / China Industrialization',
        macro: 'Reflation / Weak Dollar',
        summary:
            'Capital shifted away from US technology toward commodities and emerging markets driven by rapid industrialization.',
    },
    {
        decade: '2010s',
        startYear: 2010,
        endYear: 2019,
        assetClass: 'Stocks',
        geography: 'United States',
        sectorTheme: 'Mega-Cap Technology',
        macro: 'Low Inflation / QE',
        summary:
            'US equities regained leadership as digital platforms and mega-cap technology companies accumulated enormous amounts of capital.',
    },
    {
        decade: '2020s',
        startYear: 2020,
        endYear: 2029,
        assetClass: 'Stocks',
        geography: 'United States',
        sectorTheme: 'AI / Semiconductors',
        macro: 'Inflation / Higher Rates',
        summary:
            'So far, capital leadership has remained concentrated in US equities, increasingly around AI and semiconductor infrastructure.',
    },
];

export const PARADIGM_BY_DECADE: Record<string, DecadeParadigm> =
    Object.fromEntries(
        DECADE_PARADIGMS.map((p) => [p.decade, p]),
    );

export function getParadigmByYear(year: number): DecadeParadigm | undefined {
    return DECADE_PARADIGMS.find(
        (p) => year >= p.startYear && year <= p.endYear,
    );
}