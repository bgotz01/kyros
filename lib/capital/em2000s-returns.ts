// ─── em2000s-returns.ts ───────────────────────────────────────────────────────
// Emerging-market and commodity stocks covering the 2000s decade.
// Three cohorts:
//
//   EEM cohort  — EM multinationals (public/data/EEM-2007.csv)
//     BBD  Bradesco (Brazil)         from 1/2/03
//     PBR  Petrobras (Brazil)        from 1/2/03
//     IBN  ICICI Bank (India)        from 1/2/03
//     AMX  América Móvil (Mexico)    from 1/2/03
//     CX   CEMEX (Mexico)            from 1/2/03
//     MXX  IPC Mexico index          from 1/2/03
//     CIB  Bancolombia (Colombia)    from 1/2/03
//
//   China cohort — (public/data/china-2007.csv, 5 remaining stocks)
//     PTR  PetroChina                from 1/1/04
//     CHL  China Mobile              from 1/1/04
//     LFC  China Life Insurance      from 1/1/04
//     FXI  iShares China ETF         from 10/8/04
//     BIDU Baidu                     from 5/5/08
//
//   Mining cohort — (public/data/miningstocks-2007.csv)
//     MOS  Mosaic                    from 1/2/03
//     POT  Potash Corp               from 1/2/03
//     RIO  Rio Tinto                 from 1/2/03
//     BHP  BHP Billiton              from 1/2/03
//     VALE Vale                      from 1/2/03
//     SCCO Southern Copper           from 1/2/03
//     ICL  ICL Group                 from 3/22/05
//     CF   CF Industries             from 8/11/05
//
// Methodology (mirrors nifty50-returns.ts):
//   - Each stock's base = its own first available price
//   - Annual return = (year-end / prior year-end) − 1
//     except first year: (year-end / base price) − 1
//   - Index annual return = equal-weighted average of constituents with data
//   - Year-end = last trading day of December
//
// Source: public/data/EEM-2007.csv, china-2007.csv, miningstocks-2007.csv
// ─────────────────────────────────────────────────────────────────────────────

export const EM_EEM_STOCKS = ['BBD', 'PBR', 'IBN', 'AMX', 'CX', 'MXX', 'CIB'] as const;
export const EM_CHINA_STOCKS = ['PTR', 'CHL', 'LFC', 'FXI', 'BIDU'] as const;
export const EM_MINING_STOCKS = ['MOS', 'POT', 'RIO', 'BHP', 'VALE', 'SCCO', 'ICL', 'CF'] as const;
export const EM_ALL_STOCKS = [...EM_EEM_STOCKS, ...EM_CHINA_STOCKS, ...EM_MINING_STOCKS] as const;

export type EmStock = (typeof EM_ALL_STOCKS)[number];

export const EM_NAMES: Record<EmStock, string> = {
    BBD: 'Bradesco',
    PBR: 'Petrobras',
    IBN: 'ICICI Bank',
    AMX: 'América Móvil',
    CX: 'CEMEX',
    MXX: 'IPC Mexico',
    CIB: 'Bancolombia',
    PTR: 'PetroChina',
    CHL: 'China Mobile',
    LFC: 'China Life',
    FXI: 'iShares China ETF',
    BIDU: 'Baidu',
    MOS: 'Mosaic',
    POT: 'Potash Corp',
    RIO: 'Rio Tinto',
    BHP: 'BHP Billiton',
    VALE: 'Vale',
    SCCO: 'Southern Copper',
    ICL: 'ICL Group',
    CF: 'CF Industries',
};

export const EM_GEOGRAPHY: Record<EmStock, string> = {
    BBD: 'Brazil', PBR: 'Brazil', IBN: 'India',
    AMX: 'Mexico', CX: 'Mexico', MXX: 'Mexico', CIB: 'Colombia',
    PTR: 'China', CHL: 'China', LFC: 'China',
    FXI: 'China', BIDU: 'China',
    MOS: 'US', POT: 'Canada', RIO: 'UK/Aus',
    BHP: 'Aus/UK', VALE: 'Brazil', SCCO: 'Mexico',
    ICL: 'Israel', CF: 'US',
};

/** Each stock's first available price */
export const EM_BASE: Record<EmStock, { date: string; price: number }> = {
    BBD: { date: '1/2/03', price: 0.423191547 },
    PBR: { date: '1/2/03', price: 0.841690302 },
    IBN: { date: '1/2/03', price: 0.887639284 },
    AMX: { date: '1/2/03', price: 1.637050748 },
    CX: { date: '1/2/03', price: 6.870152473 },
    MXX: { date: '1/2/03', price: 6225.399902 },
    CIB: { date: '1/2/03', price: 0.98459518 },
    PTR: { date: '1/1/04', price: 1.79 },
    CHL: { date: '1/1/04', price: 10.16 },
    LFC: { date: '1/1/04', price: 4.17 },
    FXI: { date: '10/8/04', price: 11.69 },
    BIDU: { date: '5/5/08', price: 12.25 },
    MOS: { date: '1/2/03', price: 8.09 },
    POT: { date: '1/2/03', price: 3.60 },
    RIO: { date: '1/2/03', price: 5.98 },
    BHP: { date: '1/2/03', price: 4.81 },
    VALE: { date: '1/2/03', price: 0.856380045 },
    SCCO: { date: '1/2/03', price: 0.820189476 },
    ICL: { date: '3/22/05', price: 1.68 },
    CF: { date: '8/11/05', price: 2.27 },
};

/** First full calendar year-end available per stock */
export const EM_START_YEAR: Record<EmStock, number> = {
    BBD: 2003, PBR: 2003, IBN: 2003, AMX: 2003, CX: 2003, MXX: 2003, CIB: 2003,
    PTR: 2004, CHL: 2004, LFC: 2004, FXI: 2004,
    BIDU: 2008,
    MOS: 2003, POT: 2003, RIO: 2003, BHP: 2003, VALE: 2003, SCCO: 2003,
    ICL: 2005, CF: 2005,
};

/** Year-end prices — last trading day of December — from CSVs */
export const EM_YEAR_END_PRICES: Partial<Record<number, Partial<Record<EmStock, number>>>> = {
    2003: {
        BBD: 0.792680144, PBR: 1.748377204, IBN: 2.471222162,
        AMX: 3.034118891, CX: 8.492486954, MXX: 8795.280273, CIB: 2.222163439,
        MOS: 7.51, POT: 4.80, RIO: 8.39, BHP: 7.87,
        VALE: 1.818767309, SCCO: 2.653322458,
    },
    2004: {
        BBD: 1.182979584, PBR: 2.508323193, IBN: 2.9182899,
        AMX: 5.836252689, CX: 12.25356388, MXX: 12917.87988, CIB: 6.182567596,
        PTR: 1.76, CHL: 11.44, LFC: 3.41, FXI: 12.08,
        MOS: 12.35, POT: 9.24, RIO: 9.22, BHP: 10.55,
        VALE: 2.803590775, SCCO: 2.833487749,
    },
    2005: {
        BBD: 2.771500111, PBR: 4.567162037, IBN: 4.237043381,
        AMX: 9.835108757, CX: 20.59230614, MXX: 17802.71094, CIB: 13.25927734,
        PTR: 2.82, CHL: 16.40, LFC: 4.49, FXI: 13.69,
        MOS: 11.07, POT: 9.39, RIO: 14.48, BHP: 14.82,
        VALE: 4.110676289, SCCO: 4.518587112, ICL: 2.45, CF: 2.14,
    },
    2006: {
        BBD: 3.927251339, PBR: 6.907204151, IBN: 6.23910141,
        AMX: 15.29332542, CX: 23.97171783, MXX: 26448.32031, CIB: 14.75776577,
        PTR: 5.15, CHL: 30.56, LFC: 17.42, FXI: 25.08, BIDU: 11.27,
        MOS: 16.16, POT: 16.01, RIO: 17.35, BHP: 17.93,
        VALE: 6.076300144, SCCO: 8.093087196, ICL: 4.01, CF: 3.61,
    },
    2007: {
        BBD: 6.28281641, PBR: 15.98303509, IBN: 9.288661003,
        AMX: 21.49090576, CX: 18.6890583, MXX: 29536.83008, CIB: 16.68000221,
        PTR: 6.72, CHL: 63.29, LFC: 26.71, FXI: 38.81, BIDU: 38.98,
        MOS: 71.39, POT: 48.73, RIO: 34.98, BHP: 32.15,
        VALE: 13.5239315, SCCO: 17.01614952, ICL: 9.01, CF: 15.54,
    },
    2008: {
        BBD: 3.053121328, PBR: 7.080763817, IBN: 2.959821224,
        AMX: 10.95462799, CX: 6.805850029, MXX: 22380.32031, CIB: 11.96704578,
        PTR: 3.38, CHL: 36.35, LFC: 15.80, FXI: 20.26, BIDU: 13.06,
        MOS: 26.23, POT: 25.78, RIO: 7.52, BHP: 20.08,
        VALE: 5.162231445, SCCO: 8.429899216, ICL: 4.47, CF: 6.97,
    },
    2009: {
        BBD: 6.92054081, PBR: 14.16226196, IBN: 5.884112835,
        AMX: 17.05365372, CX: 9.153495789, MXX: 32120.4707, CIB: 24.18086052,
        PTR: 4.81, CHL: 33.74, LFC: 25.62, FXI: 29.70, BIDU: 41.96,
        MOS: 46.72, POT: 36.17, RIO: 22.45, BHP: 37.28,
        VALE: 12.54656506, SCCO: 17.65919876, ICL: 8.75, CF: 13.15,
    },
};

export const EM_ALL_YEARS = [2003, 2004, 2005, 2006, 2007, 2008, 2009] as const;
export const EM_DECADE_END = 2009;

// ─── return computation ───────────────────────────────────────────────────────

export interface EmYearRow {
    year: number;
    stockReturns: Partial<Record<EmStock, number>>;
    indexReturn: number;
    count: number;
}

export function computeEmReturns(stocks: EmStock[]): EmYearRow[] {
    return EM_ALL_YEARS.map((year, i) => {
        const prevYear = EM_ALL_YEARS[i - 1] as number | undefined;
        const curr = EM_YEAR_END_PRICES[year] ?? {};

        const stockReturns: Partial<Record<EmStock, number>> = {};
        let sum = 0;
        let count = 0;

        for (const s of stocks) {
            const currPrice = curr[s];
            if (currPrice === undefined) continue;

            const startYear = EM_START_YEAR[s];
            let prevPrice: number | undefined;

            if (year === startYear) {
                prevPrice = EM_BASE[s].price;
            } else if (prevYear !== undefined && prevYear >= startYear) {
                prevPrice = EM_YEAR_END_PRICES[prevYear]?.[s];
            }

            if (prevPrice === undefined || prevPrice === 0) continue;

            const r = (currPrice - prevPrice) / prevPrice;
            stockReturns[s] = r;
            sum += r;
            count++;
        }

        return { year, stockReturns, indexReturn: count > 0 ? sum / count : 0, count };
    });
}

/** Total return from each stock's own base to Dec 2009 */
export function emStockTotalReturn(s: EmStock): number {
    const base = EM_BASE[s].price;
    const last = EM_YEAR_END_PRICES[EM_DECADE_END]?.[s];
    return last !== undefined ? (last - base) / base : 0;
}
