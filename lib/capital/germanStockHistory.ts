// ─── German stock annual returns, 1954–2013 ───────────────────────────────────
// Source: "Returns on German Stocks 1954–2013", Stehle & Schmidt.
// Total return series — incorporates dividends, stock dividends, rights
// issues, and stock splits. Not directly comparable to the price-only DAX
// series from Yahoo Finance, but labelled clearly in the table.
//
// Used in the returns-by-decade table to reconstruct pre-DAX (pre-1987)
// German equity returns. The decade return is the chain product of the annual
// returns within the window.
//
// The series begins in 1954, so the 1950s bucket is partial (1954–1959).

export const GERMAN_ANNUAL_RETURNS: Record<number, number> = {
    1954: 85.27,
    1955: 15.67,
    1956: -5.37,
    1957: 10.09,
    1958: 62.76,
    1959: 78.47,
    1960: 35.78,
    1961: -7.77,
    1962: -21.78,
    1963: 14.20,
    1964: 6.86,
    1965: -12.41,
    1966: -13.37,
    1967: 49.90,
    1968: 15.42,
    1969: 16.73,
    1970: -22.54,
    1971: 9.27,
    1972: 16.47,
    1973: -16.91,
    1974: 2.17,
    1975: 36.28,
    1976: -3.93,
    1977: 13.34,
    1978: 11.59,
    1979: -6.21,
    1980: 5.06,
    1981: 4.89,
    1982: 20.31,
    1983: 39.83,
    1984: 12.66,
    1985: 77.23,
    1986: 8.89,
    1987: -33.78,
    1988: 32.61,
    1989: 38.42,
    1990: -14.04,
    1991: 7.26,
    1992: -3.93,
    1993: 45.60,
    1994: -4.56,
    1995: 6.57,
    1996: 22.26,
    1997: 42.89,
    1998: 17.93,
    1999: 32.55,
    2000: -11.17,
    2001: -8.75,
    2002: -34.56,
    2003: 31.97,
    2004: 9.89,
    2005: 27.33,
    2006: 25.48,
    2007: 17.71,
    2008: -39.36,
    2009: 18.50,
    2010: 19.91,
    2011: -14.19,
    2012: 28.40,
    2013: 26.11,
};

/** First year the dataset covers. The 1950s bucket is therefore partial. */
export const GERMAN_RETURNS_FROM = 1954;

/** Last year the dataset covers. */
export const GERMAN_RETURNS_TO = 2013;

/**
 * Compound the annual returns within [startYear, endYear] to produce a single
 * decade (or partial-decade) price return, in percent.
 *
 * Returns null if no annual return data exists inside the window at all.
 * Where data starts mid-decade (e.g. 1954 inside the 1950s) the result is
 * a partial return covering only the years with data — the cell is marked
 * "est" in the table to make this clear.
 */
export function germanDecadeReturn(startYear: number, endYear: number): number | null {
    let compound = 1;
    let count = 0;

    for (let y = startYear; y <= endYear; y++) {
        const r = GERMAN_ANNUAL_RETURNS[y];
        if (r != null) {
            compound *= 1 + r / 100;
            count++;
        }
    }

    if (count === 0) return null;
    return (compound - 1) * 100;
}

/**
 * Count of years with data inside [startYear, endYear]. Used to compute
 * CAGR and to strip an assumed dividend yield per year.
 */
export function germanDecadeYears(startYear: number, endYear: number): number {
    let count = 0;
    for (let y = startYear; y <= endYear; y++) {
        if (GERMAN_ANNUAL_RETURNS[y] != null) count++;
    }
    return count;
}

/**
 * True when the historical dataset is the source for this decade, i.e. the
 * decade falls before the DAX's live data starts (1987) and the German
 * returns series has at least some coverage of it.
 */
export function isGermanHistorical(decadeStart: number): boolean {
    return decadeStart < 1987 && decadeEnd(decadeStart) >= GERMAN_RETURNS_FROM;
}

function decadeEnd(start: number): number {
    return Math.min(start + 9, 2026);
}
