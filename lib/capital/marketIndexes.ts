// ─── Market index catalogue ───────────────────────────────────────────────────
// The equity indexes carried in the macro-framework database (asset_class
// 'equities'), and the metric columns stored alongside each one.
//
// Shared by /api/markets — which validates every request against it, so the
// series name never reaches SQL unchecked — and the markets page.

export type Region = 'North America' | 'Europe' | 'Asia' | 'Frontier';

export interface MarketIndex {
    /** series_name in macro_time_series. */
    series: string;
    label: string;
    shortLabel: string;
    country: string;
    region: Region;
    /** Symbol the level is quoted in. */
    currency: string;
    /** ISO code of that currency, used to find a rate back to the dollar. */
    code: string;
    /** First year the database carries a reading. */
    from: number;
    color: string;
}

export const INDEXES: MarketIndex[] = [
    // North America
    {
        series: 'US/GSPC',
        label: 'S&P 500',
        shortLabel: 'GSPC',
        country: 'United States',
        region: 'North America',
        currency: '$',
        code: 'USD',
        from: 1960,
        color: '#E8B84B',   // amber
    },
    {
        series: 'US/IXIC',
        label: 'Nasdaq Composite',
        shortLabel: 'IXIC',
        country: 'United States',
        region: 'North America',
        currency: '$',
        code: 'USD',
        from: 1971,
        color: '#6AAEE8',   // sky blue
    },
    {
        series: 'NDX',
        label: 'Nasdaq 100',
        shortLabel: 'NDX',
        country: 'United States',
        region: 'North America',
        currency: '$',
        code: 'USD',
        from: 1985,
        color: '#C084E8',   // violet
    },
    {
        series: 'US/DJI',
        label: 'Dow Jones Industrial Average',
        shortLabel: 'DJI',
        country: 'United States',
        region: 'North America',
        currency: '$',
        code: 'USD',
        from: 1900,
        color: '#F07A50',   // coral
    },
    {
        series: 'US/RUT',
        label: 'Russell 2000',
        shortLabel: 'RUT',
        country: 'United States',
        region: 'North America',
        currency: '$',
        code: 'USD',
        from: 1988,
        color: '#8FD46A',   // lime
    },
    {
        series: 'GSPTSE',
        label: 'S&P/TSX Composite',
        shortLabel: 'TSX',
        country: 'Canada',
        region: 'North America',
        currency: 'C$',
        code: 'CAD',
        from: 1979,
        color: '#E0819B',   // dusty rose
    },
    // Europe
    {
        series: 'FTSE',
        label: 'FTSE 100',
        shortLabel: 'FTSE',
        country: 'United Kingdom',
        region: 'Europe',
        currency: '£',
        code: 'GBP',
        from: 1984,
        color: '#4FC4A0',   // mint
    },
    {
        series: 'GDAXI',
        label: 'DAX',
        shortLabel: 'DAX',
        country: 'Germany',
        region: 'Europe',
        currency: '€',
        code: 'EUR',
        from: 1987,
        color: '#D9A05B',   // ochre
    },
    // Asia
    {
        series: 'N225',
        label: 'Nikkei 225',
        shortLabel: 'N225',
        country: 'Japan',
        region: 'Asia',
        currency: '¥',
        code: 'JPY',
        from: 1965,
        color: '#E36A6A',   // vermillion
    },
    {
        series: 'HSI',
        label: 'Hang Seng',
        shortLabel: 'HSI',
        country: 'Hong Kong',
        region: 'Asia',
        currency: 'HK$',
        code: 'HKD',
        from: 1986,
        color: '#57C2C6',   // teal
    },
    // Frontier
    {
        series: 'Argentina/MERV',
        label: 'S&P MERVAL',
        shortLabel: 'MERV',
        country: 'Argentina',
        region: 'Frontier',
        currency: 'AR$',
        code: 'ARS',
        from: 1997,
        color: '#9AA9E8',   // periwinkle
    },
    {
        series: 'Turkey/XU100.IS',
        label: 'BIST 100',
        shortLabel: 'XU100',
        country: 'Turkey',
        region: 'Frontier',
        currency: '₺',
        code: 'TRY',
        from: 1997,
        color: '#C9B47A',   // sand
    },
];

export const REGIONS: Region[] = ['North America', 'Europe', 'Asia', 'Frontier'];

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

export type MetricKind = 'level' | 'percent';

export interface MetricDef {
    key: MetricKey;
    label: string;
    /** Caption above the y axis. */
    unit: string;
    description: string;
    kind: MetricKind;
    /** Whether the metric can be restated in dollars. A level converts, and a
     *  price return between two month ends can be recomputed from converted
     *  levels. Realised volatility cannot: it is measured from daily returns
     *  in the local currency, and monthly rates cannot restate it. */
    convertible: boolean;
}

export const METRICS: MetricDef[] = [
    {
        key: 'Value',
        label: 'Level',
        unit: 'INDEX',
        description: 'Closing level of the index, taken at each month end',
        kind: 'level',
        convertible: true,
    },
    {
        key: 'Value_Return2Y',
        label: 'Return 2Y',
        unit: '%',
        description: 'Cumulative price return over the trailing two years',
        kind: 'percent',
        convertible: true,
    },
    {
        key: 'Value_Return5Y',
        label: 'Return 5Y',
        unit: '%',
        description: 'Cumulative price return over the trailing five years',
        kind: 'percent',
        convertible: true,
    },
    {
        key: 'Value_Return10Y',
        label: 'Return 10Y',
        unit: '%',
        description: 'Cumulative price return over the trailing ten years',
        kind: 'percent',
        convertible: true,
    },
    {
        key: 'Value_Vol63',
        label: 'Vol 63D',
        unit: '% ANN.',
        description: 'Annualised realised volatility over the trailing quarter',
        kind: 'percent',
        convertible: false,
    },
    {
        key: 'Value_Vol252',
        label: 'Vol 252D',
        unit: '% ANN.',
        description: 'Annualised realised volatility over the trailing year',
        kind: 'percent',
        convertible: false,
    },
];

export function findMetric(key: string): MetricDef | undefined {
    return METRICS.find(m => m.key === key);
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

export function filterPeriod<T extends { month: string }>(rows: T[], period: Period): T[] {
    if (period.kind === 'all' || rows.length === 0) return rows;

    if (period.kind === 'decade') {
        return rows.filter(r => r.month >= `${period.start}-01-01` && r.month <= `${period.end}-12-31`);
    }

    // Trailing windows are measured back from the last reading, not from today —
    // a series that ends in April still shows a full window.
    const lastYear = parseInt(rows[rows.length - 1].month.slice(0, 4), 10);
    return rows.filter(r => r.month >= `${lastYear - period.years}-01-01`);
}
