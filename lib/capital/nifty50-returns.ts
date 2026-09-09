// ─── nifty50-returns.ts ───────────────────────────────────────────────────────
// Nifty Fifty stocks with daily price data in public/data/nifty50.csv.
//
// Three cohorts by data start:
//   Cohort A (1/2/62):  KO, DIS, GE, IBM, JNJ, MRK, PG, XRX
//   Cohort B (7/5/66):  MCD
//   Cohort C (6/1/72):  AXP, LLY, PEP, PFE, TXN
//   No data:            WMT
//
// Methodology:
//   - Each stock's base = its own first available price
//   - Annual return = (year-end price / prior year-end price) − 1
//     except for the first year: (year-end / base) − 1
//   - Index annual return = equal-weighted average of constituent annual returns
//     for years where all selected stocks have data
//   - Year-end = last trading day of December
//
// Source: public/data/nifty50.csv · Computed by scripts/compute-nifty50.mjs
// ─────────────────────────────────────────────────────────────────────────────

export const NIFTY50_ALL_STOCKS = [
    'KO', 'DIS', 'GE', 'IBM', 'JNJ', 'MRK', 'PG', 'XRX',
    'MCD',
    'AXP', 'LLY', 'PEP', 'PFE', 'TXN',
] as const;

export type Nifty50Stock = (typeof NIFTY50_ALL_STOCKS)[number];

/** Full names for display */
export const NIFTY50_NAMES: Record<Nifty50Stock, string> = {
    KO: 'Coca-Cola',
    DIS: 'Disney',
    GE: 'General Electric',
    IBM: 'IBM',
    JNJ: 'Johnson & Johnson',
    MRK: 'Merck',
    PG: 'Procter & Gamble',
    XRX: 'Xerox',
    MCD: 'McDonald\'s',
    AXP: 'American Express',
    LLY: 'Eli Lilly',
    PEP: 'PepsiCo',
    PFE: 'Pfizer',
    TXN: 'Texas Instruments',
};

/** Each stock's first available price (base for return calculations) */
export const NIFTY50_BASE: Record<Nifty50Stock, { date: string; price: number }> = {
    KO: { date: '1/2/62', price: 4.67 },
    DIS: { date: '1/2/62', price: 5.79 },
    GE: { date: '1/2/62', price: 62.27 },
    IBM: { date: '1/2/62', price: 151.33 },
    JNJ: { date: '1/2/62', price: 6.30 },
    MRK: { date: '1/2/62', price: 6.72 },
    PG: { date: '1/2/62', price: 25.46 },
    XRX: { date: '1/2/62', price: 69.36 },
    MCD: { date: '7/5/66', price: 11.60 },
    AXP: { date: '6/1/72', price: 124.01 },
    LLY: { date: '6/1/72', price: 90.35 },
    PEP: { date: '6/1/72', price: 39.64 },
    PFE: { date: '6/1/72', price: 16.17 },
    TXN: { date: '6/1/72', price: 72.29 },
};

/** The first full calendar year-end available for each stock */
export const NIFTY50_START_YEAR: Record<Nifty50Stock, number> = {
    KO: 1962, DIS: 1962, GE: 1962, IBM: 1962,
    JNJ: 1962, MRK: 1962, PG: 1962, XRX: 1962,
    MCD: 1966,
    AXP: 1972, LLY: 1972, PEP: 1972, PFE: 1972, TXN: 1972,
};

/** Year-end prices — last trading day of December — from CSV */
export const NIFTY50_YEAR_END_PRICES: Partial<Record<number, Partial<Record<Nifty50Stock, number>>>> = {
    1962: { KO: 4.06, DIS: 4.56, GE: 65.75, IBM: 103.25, JNJ: 4.84, MRK: 5.96, PG: 20.23, XRX: 68.99 },
    1963: { KO: 5.66, DIS: 6.48, GE: 76.59, IBM: 134.36, JNJ: 6.83, MRK: 8.54, PG: 23.16, XRX: 187.38 },
    1964: { KO: 7.05, DIS: 7.51, GE: 84.08, IBM: 135.79, JNJ: 7.57, MRK: 11.90, PG: 24.13, XRX: 218.79 },
    1965: { KO: 8.80, DIS: 9.86, GE: 108.85, IBM: 165.68, JNJ: 11.79, MRK: 17.26, PG: 21.06, XRX: 450.01 },
    1966: { KO: 9.40, DIS: 13.29, GE: 83.84, IBM: 185.24, JNJ: 11.81, MRK: 19.16, PG: 22.82, XRX: 441.93, MCD: 10.01 },
    1967: { KO: 14.15, DIS: 18.61, GE: 93.07, IBM: 313.46, JNJ: 19.17, MRK: 21.48, PG: 29.61, XRX: 681.03, MCD: 30.55 },
    1968: { KO: 15.52, DIS: 28.74, GE: 92.99, IBM: 316.85, JNJ: 22.42, MRK: 23.41, PG: 28.50, XRX: 604.52, MCD: 22.91 },
    1969: { KO: 18.17, DIS: 45.46, GE: 79.17, IBM: 370.70, JNJ: 38.15, MRK: 30.04, PG: 37.13, XRX: 721.36, MCD: 15.14 },
    1970: { KO: 18.99, DIS: 47.96, GE: 99.25, IBM: 327.32, JNJ: 36.50, MRK: 26.80, PG: 40.33, XRX: 593.59, MCD: 16.47 },
    1971: { KO: 27.77, DIS: 93.30, GE: 135.54, IBM: 352.41, JNJ: 63.40, MRK: 34.27, PG: 55.82, XRX: 865.90, MCD: 40.35 },
    1972: { KO: 34.21, DIS: 160.64, GE: 161.15, IBM: 426.97, JNJ: 84.32, MRK: 49.83, PG: 80.65, XRX: 1037.59, MCD: 81.24, AXP: 139.96, LLY: 111.64, PEP: 40.27, PFE: 16.95, TXN: 80.67 },
    1973: { KO: 29.14, DIS: 57.03, GE: 96.50, IBM: 303.00, JNJ: 46.23, MRK: 49.32, PG: 40.81, XRX: 715.10, MCD: 60.73, AXP: 97.00, LLY: 104.77, PEP: 32.54, PFE: 17.37, TXN: 96.09 },
    1974: { KO: 22.24, DIS: 28.97, GE: 63.02, IBM: 212.75, JNJ: 30.92, MRK: 38.56, PG: 28.87, XRX: 465.56, MCD: 30.36, AXP: 54.58, LLY: 92.77, PEP: 19.30, PFE: 13.02, TXN: 59.89 },
};

export const NIFTY50_ALL_YEARS = [
    1962, 1963, 1964, 1965, 1966, 1967, 1968, 1969, 1970,
    1971, 1972, 1973, 1974,
] as const;

// ─── return computation ───────────────────────────────────────────────────────

export interface YearRow {
    year: number;
    /** Annual return per stock, undefined if no data for that year */
    stockReturns: Partial<Record<Nifty50Stock, number>>;
    /** Equal-weighted average of stocks that have data this year */
    indexReturn: number;
    /** How many stocks contributed to the index this year */
    count: number;
}

/**
 * Compute annual returns for each year in the data range.
 * Each stock contributes to the index only in years where it has data.
 * For a stock's first year, the return is (year-end / base-price) − 1.
 */
export function computeReturns(stocks: Nifty50Stock[]): YearRow[] {
    return NIFTY50_ALL_YEARS.map((year, i) => {
        const prevYear = NIFTY50_ALL_YEARS[i - 1] as number | undefined;
        const curr = NIFTY50_YEAR_END_PRICES[year] ?? {};

        const stockReturns: Partial<Record<Nifty50Stock, number>> = {};
        let sum = 0;
        let count = 0;

        for (const s of stocks) {
            const currPrice = curr[s];
            if (currPrice === undefined) continue; // no data this year

            const startYear = NIFTY50_START_YEAR[s];
            let prevPrice: number | undefined;

            if (year === startYear) {
                // First full year: measure from base price
                prevPrice = NIFTY50_BASE[s].price;
            } else if (prevYear !== undefined && prevYear >= startYear) {
                prevPrice = NIFTY50_YEAR_END_PRICES[prevYear]?.[s];
            }

            if (prevPrice === undefined || prevPrice === 0) continue;

            const r = (currPrice - prevPrice) / prevPrice;
            stockReturns[s] = r;
            sum += r;
            count++;
        }

        return {
            year,
            stockReturns,
            indexReturn: count > 0 ? sum / count : 0,
            count,
        };
    });
}

/** Total return from each stock's own base to its last available year-end */
export function stockTotalReturn(s: Nifty50Stock): number {
    const base = NIFTY50_BASE[s].price;
    // Find last year with data
    const years = [...NIFTY50_ALL_YEARS].reverse();
    for (const y of years) {
        const p = NIFTY50_YEAR_END_PRICES[y]?.[s];
        if (p !== undefined) return (p - base) / base;
    }
    return 0;
}

/** Last year with data for a stock */
export function stockLastYear(s: Nifty50Stock): number {
    const years = [...NIFTY50_ALL_YEARS].reverse();
    for (const y of years) {
        if (NIFTY50_YEAR_END_PRICES[y]?.[s] !== undefined) return y;
    }
    return NIFTY50_START_YEAR[s];
}
