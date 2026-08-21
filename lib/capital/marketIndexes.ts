// ─── Market index catalogue ───────────────────────────────────────────────────
// The equity indexes carried in the macro-framework database (asset_class
// 'equities'), and the metric columns stored alongside each one.
//
// Shared by /api/markets — which validates every request against it, so the
// series name never reaches SQL unchecked — and the markets page.

export type IndexGroup =
    | 'North America'
    | 'Europe'
    | 'Asia'
    | 'Frontier'
    | 'Commodities';

export interface MarketIndex {
    /** series_name in macro_time_series. */
    series: string;
    /** Which database holds it. The equity indexes live in macro-framework;
     *  the commodity contracts are only complete in stockdata, whose WTI
     *  reaches back to 2000 where macro-framework's starts in 2006. */
    source: 'macro' | 'stock';
    /** asset_class in that table. */
    assetClass: 'equities' | 'commodities';
    label: string;
    shortLabel: string;
    /** Country for an index, exchange for a futures contract. */
    origin: string;
    group: IndexGroup;
    /** Symbol the level is quoted in. */
    currency: string;
    /** ISO code of that currency, used to find a rate back to the dollar. */
    code: string;
    /** First year the database carries a reading. */
    from: number;
    /** Whether the realised-volatility columns exist for it. The commodity
     *  contracts carry a level and returns only. */
    volatility: boolean;
    color: string;
}

export const INDEXES: MarketIndex[] = [
    // North America
    {
        series: 'US/GSPC',
        source: 'macro',
        assetClass: 'equities',
        label: 'S&P 500',
        shortLabel: 'GSPC',
        origin: 'United States',
        group: 'North America',
        currency: '$',
        code: 'USD',
        from: 1960,
        volatility: true,
        color: '#E8B84B',   // amber
    },
    {
        series: 'US/IXIC',
        source: 'macro',
        assetClass: 'equities',
        label: 'Nasdaq Composite',
        shortLabel: 'IXIC',
        origin: 'United States',
        group: 'North America',
        currency: '$',
        code: 'USD',
        from: 1971,
        volatility: true,
        color: '#6AAEE8',   // sky blue
    },
    {
        series: 'NDX',
        source: 'macro',
        assetClass: 'equities',
        label: 'Nasdaq 100',
        shortLabel: 'NDX',
        origin: 'United States',
        group: 'North America',
        currency: '$',
        code: 'USD',
        from: 1985,
        volatility: true,
        color: '#C084E8',   // violet
    },
    {
        series: 'US/DJI',
        source: 'macro',
        assetClass: 'equities',
        label: 'Dow Jones Industrial Average',
        shortLabel: 'DJI',
        origin: 'United States',
        group: 'North America',
        currency: '$',
        code: 'USD',
        from: 1900,
        volatility: true,
        color: '#F07A50',   // coral
    },
    {
        series: 'US/RUT',
        source: 'macro',
        assetClass: 'equities',
        label: 'Russell 2000',
        shortLabel: 'RUT',
        origin: 'United States',
        group: 'North America',
        currency: '$',
        code: 'USD',
        from: 1988,
        volatility: true,
        color: '#8FD46A',   // lime
    },
    {
        series: 'GSPTSE',
        source: 'macro',
        assetClass: 'equities',
        label: 'S&P/TSX Composite',
        shortLabel: 'TSX',
        origin: 'Canada',
        group: 'North America',
        currency: 'C$',
        code: 'CAD',
        from: 1979,
        volatility: true,
        color: '#E0819B',   // dusty rose
    },
    // Europe
    {
        series: 'FTSE',
        source: 'macro',
        assetClass: 'equities',
        label: 'FTSE 100',
        shortLabel: 'FTSE',
        origin: 'United Kingdom',
        group: 'Europe',
        currency: '£',
        code: 'GBP',
        from: 1984,
        volatility: true,
        color: '#4FC4A0',   // mint
    },
    {
        series: 'GDAXI',
        source: 'macro',
        assetClass: 'equities',
        label: 'DAX',
        shortLabel: 'DAX',
        origin: 'Germany',
        group: 'Europe',
        currency: '€',
        code: 'EUR',
        from: 1987,
        volatility: true,
        color: '#D9A05B',   // ochre
    },
    // Asia
    {
        series: 'N225',
        source: 'macro',
        assetClass: 'equities',
        label: 'Nikkei 225',
        shortLabel: 'N225',
        origin: 'Japan',
        group: 'Asia',
        currency: '¥',
        code: 'JPY',
        from: 1965,
        volatility: true,
        color: '#E36A6A',   // vermillion
    },
    {
        series: 'HSI',
        source: 'macro',
        assetClass: 'equities',
        label: 'Hang Seng',
        shortLabel: 'HSI',
        origin: 'Hong Kong',
        group: 'Asia',
        currency: 'HK$',
        code: 'HKD',
        from: 1986,
        volatility: true,
        color: '#57C2C6',   // teal
    },
    // Frontier
    {
        series: 'Argentina/MERV',
        source: 'macro',
        assetClass: 'equities',
        label: 'S&P MERVAL',
        shortLabel: 'MERV',
        origin: 'Argentina',
        group: 'Frontier',
        currency: 'AR$',
        code: 'ARS',
        from: 1997,
        volatility: true,
        color: '#9AA9E8',   // periwinkle
    },
    {
        series: 'Turkey/XU100.IS',
        source: 'macro',
        assetClass: 'equities',
        label: 'BIST 100',
        shortLabel: 'XU100',
        origin: 'Turkey',
        group: 'Frontier',
        currency: '₺',
        code: 'TRY',
        from: 1997,
        volatility: true,
        color: '#C9B47A',   // sand
    },
    // Commodities — dollar-denominated futures, out of the stockdata database.
    {
        series: 'GC=F',
        source: 'stock',
        assetClass: 'commodities',
        group: 'Commodities',
        label: 'Gold',
        shortLabel: 'GC',
        origin: 'COMEX',
        currency: '$',
        code: 'USD',
        from: 1975,
        volatility: false,
        color: '#C9A227',   // old gold
    },
    {
        series: 'CL=F',
        source: 'stock',
        assetClass: 'commodities',
        group: 'Commodities',
        label: 'WTI Crude Oil',
        shortLabel: 'CL',
        origin: 'NYMEX',
        currency: '$',
        code: 'USD',
        from: 2000,
        volatility: false,
        color: '#7B9EA8',   // petrol
    },
];

export const INDEX_GROUPS: IndexGroup[] = [
    'North America', 'Europe', 'Asia', 'Frontier', 'Commodities',
];

export const DEFAULT_INDEX = 'US/GSPC';

export function findIndex(series: string): MarketIndex | undefined {
    return INDEXES.find(i => i.series === series);
}

// ─── metrics ──────────────────────────────────────────────────────────────────
// Each index is stored as a level plus pre-computed trailing returns and
// realised volatility, one column_name per metric.

export type MetricKey =
    | 'Value'
    | 'Value_Return2Y'
    | 'Value_Return5Y'
    | 'Value_Return10Y'
    | 'Value_Vol63'
    | 'Value_Vol252';

/** What the metric measures, which decides how it is scaled, what unit it
 *  carries, and whether it survives a change of currency. */
export type MetricFamily = 'level' | 'return' | 'volatility';

export interface MetricDef {
    key: MetricKey;
    label: string;
    /** Caption above the y axis. */
    unit: string;
    description: string;
    family: MetricFamily;
}

/** Only a level is quoted in the series' own currency, and only a level can
 *  take a log axis. */
export function isLevel(metric: MetricDef) {
    return metric.family === 'level';
}

/** A level converts to dollars directly, and a price return between two month
 *  ends can be recomputed from converted levels. Realised volatility cannot:
 *  it is measured from daily returns in the local currency, and monthly rates
 *  cannot restate it. */
export function isConvertible(metric: MetricDef) {
    return metric.family !== 'volatility';
}

export const METRICS: MetricDef[] = [
    {
        key: 'Value',
        label: 'Level',
        unit: 'INDEX',
        description: 'The closing level of the index',
        family: 'level',
    },
    {
        key: 'Value_Return2Y',
        label: 'Return 2Y',
        unit: '%',
        description: 'Cumulative price return over the trailing two years',
        family: 'return',
    },
    {
        key: 'Value_Return5Y',
        label: 'Return 5Y',
        unit: '%',
        description: 'Cumulative price return over the trailing five years',
        family: 'return',
    },
    {
        key: 'Value_Return10Y',
        label: 'Return 10Y',
        unit: '%',
        description: 'Cumulative price return over the trailing ten years',
        family: 'return',
    },
    {
        key: 'Value_Vol63',
        label: 'Vol 63D',
        unit: '% ANN.',
        description: 'Annualised realised volatility over the trailing quarter',
        family: 'volatility',
    },
    {
        key: 'Value_Vol252',
        label: 'Vol 252D',
        unit: '% ANN.',
        description: 'Annualised realised volatility over the trailing year',
        family: 'volatility',
    },
];

export function findMetric(key: string): MetricDef | undefined {
    return METRICS.find(m => m.key === key);
}

/** The metrics a given series actually has columns for. */
export function metricsFor(index: MarketIndex): MetricDef[] {
    return index.volatility
        ? METRICS
        : METRICS.filter(m => m.family !== 'volatility');
}

// ─── period presets ───────────────────────────────────────────────────────────
// Decades, the unit the rest of Kyros reads in, plus a few trailing windows for
// the near view. The decade list is cut to the index's own coverage — the BIST
// opens in 1997 and has no 1970s to show.

export type Period =
    | { kind: 'all'; label: string }
    | { kind: 'decade'; label: string; start: number; end: number }
    | { kind: 'trailing'; label: string; years: number };

export const ALL_PERIOD: Period = { kind: 'all', label: 'All' };

export const TRAILING_PERIODS: Period[] = [
    { kind: 'trailing', label: '25Y', years: 25 },
    { kind: 'trailing', label: '10Y', years: 10 },
    { kind: 'trailing', label: '5Y', years: 5 },
];

const LAST_YEAR = 2026;

/** Every decade a series that opens in `from` carries readings in, oldest first. */
export function decadesFor(from: number): Period[] {
    const first = Math.floor(from / 10) * 10;
    const periods: Period[] = [];
    for (let year = first; year <= LAST_YEAR; year += 10) {
        periods.push({
            kind: 'decade',
            label: `${year}s`,
            start: year,
            end: year + 9,
        });
    }
    return periods;
}

/** Every preset offered for a series, in the order they are laid out. */
export function periodsFor(from: number): Period[] {
    return [ALL_PERIOD, ...decadesFor(from), ...TRAILING_PERIODS];
}

/** How finely a window is worth sampling. A century only reads as monthly
 *  closes; a single decade drawn that way is 120 points and looks bare, so a
 *  shorter window is sampled more finely. */
export type Resolution = 'daily' | 'weekly' | 'monthly';

export function resolutionFor(period: Period): Resolution {
    if (period.kind === 'all') return 'monthly';
    if (period.kind === 'decade') return 'weekly';
    return period.years <= 5 ? 'daily' : 'weekly';
}

/** The window itself, as the API takes it. */
export type Window =
    | { kind: 'all' }
    | { kind: 'range'; from: string; to: string }
    /** Measured back from the series' last reading, not from today. */
    | { kind: 'trailing'; years: number };

export function windowFor(period: Period): Window {
    if (period.kind === 'all') return { kind: 'all' };
    if (period.kind === 'decade') {
        return { kind: 'range', from: `${period.start}-01-01`, to: `${period.end}-12-31` };
    }
    return { kind: 'trailing', years: period.years };
}

/** The window and resolution as query parameters. */
export function periodParams(period: Period): string {
    const w = windowFor(period);
    const parts = [`resolution=${resolutionFor(period)}`];
    if (w.kind === 'range') parts.push(`from=${w.from}`, `to=${w.to}`);
    if (w.kind === 'trailing') parts.push(`trailing=${w.years}`);
    return parts.join('&');
}
