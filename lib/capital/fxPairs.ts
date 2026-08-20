// ─── Currency pair catalogue ──────────────────────────────────────────────────
// The FX series carried in the macro-framework database (asset_class 'fx').
// Unlike the equity series these are stored as a rate and nothing else — no
// pre-computed returns or volatility — so the metrics here are the rate itself
// and the year-over-year change derived from it.
//
// Shared by /api/fx, which validates every request against it, and the page.

export type FxGroup = 'Majors' | 'Under inflation';

export interface FxPair {
    /** series_name in macro_time_series. */
    series: string;
    group: FxGroup;
    /** Currency bought — the rate says how much `quote` one unit of it costs. */
    base: string;
    quote: string;
    label: string;
    shortLabel: string;
    /** What the pair is worth watching for. */
    description: string;
    /** First year the database carries a reading. */
    from: number;
    /** Decimals the rate is quoted to. */
    decimals: number;
    /** Whether the rate wants a log axis to start with. A currency that loses
     *  to inflation crosses orders of magnitude and is unreadable linearly;
     *  a major moves within a band and would waste the scale. The toggle
     *  overrides this either way. */
    logByDefault: boolean;
    color: string;
}

export const FX_PAIRS: FxPair[] = [
    {
        series: 'EURUSD',
        group: 'Majors',
        base: 'EUR',
        quote: 'USD',
        label: 'Euro / Dollar',
        shortLabel: 'EURUSD',
        description: 'The deepest pair in the market — the dollar against the euro bloc',
        from: 2003,
        decimals: 4,
        logByDefault: false,
        color: '#6AAEE8',   // sky blue
    },
    {
        series: 'GBPUSD',
        group: 'Majors',
        base: 'GBP',
        quote: 'USD',
        label: 'Sterling / Dollar',
        shortLabel: 'GBPUSD',
        description: 'Sterling against the dollar, through the ERM exit and the referendum',
        from: 1990,
        decimals: 4,
        logByDefault: false,
        color: '#4FC4A0',   // mint
    },
    {
        series: 'USDJPY',
        group: 'Majors',
        base: 'USD',
        quote: 'JPY',
        label: 'Dollar / Yen',
        shortLabel: 'USDJPY',
        description: 'The carry trade — the yen weakens as the rate differential widens',
        from: 1996,
        decimals: 2,
        logByDefault: false,
        color: '#E36A6A',   // vermillion
    },
    {
        series: 'USDCAD',
        group: 'Majors',
        base: 'USD',
        quote: 'CAD',
        label: 'Dollar / Canadian Dollar',
        shortLabel: 'USDCAD',
        description: 'A commodity currency — the loonie tracks the oil price',
        from: 2003,
        decimals: 4,
        logByDefault: false,
        color: '#E0819B',   // dusty rose
    },
    {
        series: 'USDTRY',
        group: 'Under inflation',
        base: 'USD',
        quote: 'TRY',
        label: 'Dollar / Turkish Lira',
        shortLabel: 'USDTRY',
        description: 'A currency losing to inflation — the lira falls by orders of magnitude',
        from: 2005,
        decimals: 3,
        logByDefault: true,
        color: '#C9B47A',   // sand
    },
    {
        series: 'USDARS',
        group: 'Under inflation',
        base: 'USD',
        quote: 'ARS',
        label: 'Dollar / Argentine Peso',
        shortLabel: 'USDARS',
        description: 'Serial devaluation — the peso goes from parity to four figures',
        from: 2001,
        decimals: 2,
        logByDefault: true,
        color: '#9AA9E8',   // periwinkle
    },
];

export const FX_GROUPS: FxGroup[] = ['Majors', 'Under inflation'];

export const DEFAULT_PAIR = 'EURUSD';

export function findPair(series: string): FxPair | undefined {
    return FX_PAIRS.find(p => p.series === series);
}

/** The currency that is strengthening when the line rises: the rate is how
 *  much quote one base buys, so a rising rate is a stronger base. */
export function risingFavours(pair: FxPair): string {
    return pair.base;
}

// ─── metrics ──────────────────────────────────────────────────────────────────

export type FxMetricKey = 'rate' | 'yoy';

export interface FxMetricDef {
    key: FxMetricKey;
    label: string;
    description: string;
    /** A rate is quoted in the pair's own currency; the change is a percentage. */
    kind: 'rate' | 'percent';
}

export const FX_METRICS: FxMetricDef[] = [
    {
        key: 'rate',
        label: 'Rate',
        description: 'The exchange rate itself, taken at each month end',
        kind: 'rate',
    },
    {
        key: 'yoy',
        label: 'Change YoY',
        description: 'Change in the rate against the same month a year earlier',
        kind: 'percent',
    },
];

export function findFxMetric(key: string): FxMetricDef | undefined {
    return FX_METRICS.find(m => m.key === key);
}

// ─── conversion to dollars ────────────────────────────────────────────────────
// An index is quoted in its home currency. To restate it in dollars we need a
// rate between that currency and the dollar, and the direction depends on how
// the pair is quoted: EURUSD is dollars per euro, so a euro figure is
// multiplied; USDJPY is yen per dollar, so a yen figure is divided.

export type Conversion =
    /** Already in dollars — there is nothing to convert. */
    | { kind: 'native' }
    | { kind: 'available'; pair: FxPair; op: 'multiply' | 'divide' }
    /** No rate for this currency anywhere in the database. */
    | { kind: 'missing'; code: string };

export function usdConversion(code: string): Conversion {
    if (code === 'USD') return { kind: 'native' };

    const direct = FX_PAIRS.find(p => p.base === code && p.quote === 'USD');
    if (direct) return { kind: 'available', pair: direct, op: 'multiply' };

    const inverse = FX_PAIRS.find(p => p.base === 'USD' && p.quote === code);
    if (inverse) return { kind: 'available', pair: inverse, op: 'divide' };

    return { kind: 'missing', code };
}

/** The converted rate: local units in, dollars out. */
export function toUsd(value: number, rate: number, op: 'multiply' | 'divide'): number | null {
    if (op === 'multiply') return value * rate;
    return rate === 0 ? null : value / rate;
}
