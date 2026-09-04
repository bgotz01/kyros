// ─── oilPrices.ts ─────────────────────────────────────────────────────────────
// Annual average crude oil price, nominal US dollars per barrel, 1901–2024.
//
// PROVENANCE — read before citing.
//
// This is the standard long-run composite published annually by BP (now the
// Energy Institute) in the Statistical Review of World Energy, which splices
// three different quotes to cover the century:
//
//   1901–1944  US average wellhead price
//   1945–1983  Arabian Light posted at Ras Tanura
//   1984–2024  Brent dated
//
// The splice is why the series is continuous but not strictly like-for-like:
// a posted price and a spot price are different instruments, and the 1983/84
// join is a change of quote, not a market event.
//
// These figures were transcribed by hand and have NOT been reconciled against
// the published source. Treat them as indicative of magnitude and shape —
// which is all the rail uses them for — and verify before any number here is
// quoted as fact or used in a calculation.
//
// Nominal, not real. The 1979–80 peak and the 2008/2011 peaks look far apart
// here and are much closer in inflation-adjusted terms; deflating the series
// would need a CPI series this module does not carry.
// ─────────────────────────────────────────────────────────────────────────────

export interface PricePoint {
    year: number;
    /** Nominal USD per barrel, annual average. */
    usd: number;
}

/** Where the quote changes, for annotating the splice. */
export const QUOTE_CHANGES = [
    { year: 1945, label: 'Arabian Light posted' },
    { year: 1984, label: 'Brent dated' },
] as const;

export const CRUDE_PRICES: PricePoint[] = [
    { year: 1901, usd: 0.96 }, { year: 1902, usd: 0.80 }, { year: 1903, usd: 0.94 },
    { year: 1904, usd: 0.86 }, { year: 1905, usd: 0.62 }, { year: 1906, usd: 0.73 },
    { year: 1907, usd: 0.72 }, { year: 1908, usd: 0.72 }, { year: 1909, usd: 0.70 },
    { year: 1910, usd: 0.61 }, { year: 1911, usd: 0.61 }, { year: 1912, usd: 0.74 },
    { year: 1913, usd: 0.95 }, { year: 1914, usd: 0.81 }, { year: 1915, usd: 0.64 },
    { year: 1916, usd: 1.10 }, { year: 1917, usd: 1.56 }, { year: 1918, usd: 1.98 },
    { year: 1919, usd: 2.01 }, { year: 1920, usd: 3.07 }, { year: 1921, usd: 1.73 },
    { year: 1922, usd: 1.61 }, { year: 1923, usd: 1.34 }, { year: 1924, usd: 1.43 },
    { year: 1925, usd: 1.68 }, { year: 1926, usd: 1.88 }, { year: 1927, usd: 1.30 },
    { year: 1928, usd: 1.17 }, { year: 1929, usd: 1.27 }, { year: 1930, usd: 1.19 },
    { year: 1931, usd: 0.65 }, { year: 1932, usd: 0.87 }, { year: 1933, usd: 0.67 },
    { year: 1934, usd: 1.00 }, { year: 1935, usd: 0.97 }, { year: 1936, usd: 1.09 },
    { year: 1937, usd: 1.18 }, { year: 1938, usd: 1.13 }, { year: 1939, usd: 1.02 },
    { year: 1940, usd: 1.02 }, { year: 1941, usd: 1.14 }, { year: 1942, usd: 1.19 },
    { year: 1943, usd: 1.20 }, { year: 1944, usd: 1.21 }, { year: 1945, usd: 1.05 },
    { year: 1946, usd: 1.12 }, { year: 1947, usd: 1.90 }, { year: 1948, usd: 1.99 },
    { year: 1949, usd: 1.78 }, { year: 1950, usd: 1.71 }, { year: 1951, usd: 1.71 },
    { year: 1952, usd: 1.71 }, { year: 1953, usd: 1.93 }, { year: 1954, usd: 1.93 },
    { year: 1955, usd: 1.93 }, { year: 1956, usd: 1.93 }, { year: 1957, usd: 1.90 },
    { year: 1958, usd: 2.08 }, { year: 1959, usd: 1.90 }, { year: 1960, usd: 1.90 },
    { year: 1961, usd: 1.80 }, { year: 1962, usd: 1.80 }, { year: 1963, usd: 1.80 },
    { year: 1964, usd: 1.80 }, { year: 1965, usd: 1.80 }, { year: 1966, usd: 1.80 },
    { year: 1967, usd: 1.80 }, { year: 1968, usd: 1.80 }, { year: 1969, usd: 1.80 },
    { year: 1970, usd: 1.80 }, { year: 1971, usd: 2.24 }, { year: 1972, usd: 2.48 },
    { year: 1973, usd: 3.29 }, { year: 1974, usd: 11.58 }, { year: 1975, usd: 11.53 },
    { year: 1976, usd: 12.80 }, { year: 1977, usd: 13.92 }, { year: 1978, usd: 14.02 },
    { year: 1979, usd: 31.61 }, { year: 1980, usd: 36.83 }, { year: 1981, usd: 35.93 },
    { year: 1982, usd: 32.97 }, { year: 1983, usd: 29.55 }, { year: 1984, usd: 28.78 },
    { year: 1985, usd: 27.56 }, { year: 1986, usd: 14.43 }, { year: 1987, usd: 18.44 },
    { year: 1988, usd: 14.92 }, { year: 1989, usd: 18.23 }, { year: 1990, usd: 23.73 },
    { year: 1991, usd: 20.00 }, { year: 1992, usd: 19.32 }, { year: 1993, usd: 16.97 },
    { year: 1994, usd: 15.82 }, { year: 1995, usd: 17.02 }, { year: 1996, usd: 20.67 },
    { year: 1997, usd: 19.09 }, { year: 1998, usd: 12.72 }, { year: 1999, usd: 17.97 },
    { year: 2000, usd: 28.50 }, { year: 2001, usd: 24.44 }, { year: 2002, usd: 25.02 },
    { year: 2003, usd: 28.83 }, { year: 2004, usd: 38.27 }, { year: 2005, usd: 54.52 },
    { year: 2006, usd: 65.14 }, { year: 2007, usd: 72.39 }, { year: 2008, usd: 97.26 },
    { year: 2009, usd: 61.67 }, { year: 2010, usd: 79.50 }, { year: 2011, usd: 111.26 },
    { year: 2012, usd: 111.67 }, { year: 2013, usd: 108.66 }, { year: 2014, usd: 98.95 },
    { year: 2015, usd: 52.39 }, { year: 2016, usd: 43.73 }, { year: 2017, usd: 54.19 },
    { year: 2018, usd: 71.31 }, { year: 2019, usd: 64.21 }, { year: 2020, usd: 41.84 },
    { year: 2021, usd: 70.91 }, { year: 2022, usd: 100.93 }, { year: 2023, usd: 82.49 },
    { year: 2024, usd: 80.52 },
];

export function priceAt(year: number): number | null {
    return CRUDE_PRICES.find((p) => p.year === year)?.usd ?? null;
}
