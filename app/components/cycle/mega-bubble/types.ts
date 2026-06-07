// ─── Shared types & BUBBLES data ─────────────────────────────────────────────

export interface BubblePoint {
    monthOffset: number;
    value: number;
}

export interface BubblePhase {
    label: string;
    monthOffset: number;
    description: string;
}

export interface BubbleDef {
    id: string;
    label: string;
    sub: string;
    color: string;
    // DB lookup
    apiKey: string;   // matches ?bubble= param in /api/mega-bubble
    // Annotations
    peakDate: string;
    peakLevel: string;
    drawdown: string;
    recoveryMonths: string;
    peakPE: string;
    catalyst: string;
    macro: string;
    phases: BubblePhase[];
    // Indexed overlay data (monthly, peak = 100)
    data: BubblePoint[];
}

export interface RealPriceRow {
    date: string;
    value: number;
    ma50: number | null;
    ma100: number | null;
    ma200: number | null;
    ma500: number | null;
}

// ─── Indexed overlay data ─────────────────────────────────────────────────────

const DOW_RAW: [number, number][] = [
    [-48, 31.5], [-47, 32.0], [-46, 32.8], [-45, 33.5], [-44, 34.2], [-43, 34.8],
    [-42, 35.5], [-41, 36.0], [-40, 36.8], [-39, 37.5], [-38, 38.2], [-37, 38.8],
    [-36, 38.0], [-35, 38.5], [-34, 39.2], [-33, 40.0], [-32, 40.8], [-31, 41.5],
    [-30, 42.5], [-29, 43.5], [-28, 44.2], [-27, 45.0], [-26, 45.8], [-25, 46.5],
    [-24, 46.0], [-23, 47.0], [-22, 48.0], [-21, 49.2], [-20, 50.5], [-19, 51.8],
    [-18, 53.0], [-17, 54.5], [-16, 55.8], [-15, 57.5], [-14, 59.0], [-13, 60.5],
    [-12, 62.0], [-11, 64.5], [-10, 66.8], [-9, 69.0], [-8, 71.5], [-7, 74.0],
    [-6, 77.0], [-5, 80.5], [-4, 84.0], [-3, 88.5], [-2, 93.5], [-1, 97.0],
    [0, 100.0],
    [1, 85.0], [2, 73.0], [3, 66.0], [4, 60.0], [5, 56.0],
    [6, 51.0], [7, 48.0], [8, 46.0], [9, 42.0], [10, 38.0],
    [11, 35.0], [12, 32.0], [13, 30.5], [14, 29.0], [15, 28.0],
    [16, 27.5], [17, 26.5], [18, 25.5], [19, 25.0], [20, 24.5],
    [21, 24.0], [22, 23.5], [23, 22.8], [24, 22.0],
    [25, 22.5], [26, 23.0], [27, 22.0], [28, 21.5], [29, 21.0],
    [30, 20.5], [31, 20.8], [32, 21.5], [33, 21.2], [34, 20.8], [35, 20.5],
];

const NIKKEI_RAW: [number, number][] = [
    [-48, 28.0], [-47, 28.8], [-46, 29.5], [-45, 30.2], [-44, 30.8], [-43, 31.5],
    [-42, 32.5], [-41, 33.5], [-40, 34.5], [-39, 35.5], [-38, 36.5], [-37, 37.5],
    [-36, 37.0], [-35, 38.0], [-34, 39.0], [-33, 40.5], [-32, 42.0], [-31, 43.5],
    [-30, 45.0], [-29, 46.5], [-28, 47.5], [-27, 49.0], [-26, 51.0], [-25, 53.0],
    [-24, 55.0], [-23, 57.0], [-22, 59.0], [-21, 61.0], [-20, 63.0], [-19, 65.0],
    [-18, 67.0], [-17, 69.0], [-16, 71.0], [-15, 73.0], [-14, 75.0], [-13, 77.0],
    [-12, 75.0], [-11, 78.0], [-10, 81.0], [-9, 83.5], [-8, 86.0], [-7, 88.5],
    [-6, 90.5], [-5, 92.5], [-4, 94.5], [-3, 96.5], [-2, 98.5], [-1, 99.2],
    [0, 100.0],
    [1, 93.0], [2, 85.0], [3, 78.0], [4, 72.0], [5, 68.0],
    [6, 66.0], [7, 63.0], [8, 60.5], [9, 58.0], [10, 57.0],
    [11, 56.0], [12, 57.5], [13, 58.0], [14, 59.0], [15, 58.0],
    [16, 57.5], [17, 56.5], [18, 55.5], [19, 54.5], [20, 55.0],
    [21, 56.0], [22, 55.0], [23, 54.0], [24, 55.5],
    [25, 57.0], [26, 58.5], [27, 57.0], [28, 56.0], [29, 55.5],
    [30, 56.0], [31, 57.5], [32, 56.5], [33, 55.5], [34, 56.5], [35, 57.5],
];

const NASDAQ_RAW: [number, number][] = [
    [-60, 14.0], [-59, 14.5], [-58, 15.2], [-57, 15.8], [-56, 16.2], [-55, 16.8],
    [-54, 17.5], [-53, 18.0], [-52, 18.8], [-51, 19.5], [-50, 20.2], [-49, 21.0],
    [-48, 21.5], [-47, 22.2], [-46, 22.8], [-45, 23.5], [-44, 24.2], [-43, 24.8],
    [-42, 25.5], [-41, 26.0], [-40, 26.8], [-39, 27.5], [-38, 28.5], [-37, 29.5],
    [-36, 30.5], [-35, 31.5], [-34, 32.5], [-33, 33.5], [-32, 34.5], [-31, 35.5],
    [-30, 36.5], [-29, 37.5], [-28, 38.5], [-27, 39.5], [-26, 40.5], [-25, 41.5],
    [-24, 40.0], [-23, 41.5], [-22, 43.0], [-21, 44.5], [-20, 46.5], [-19, 48.5],
    [-18, 50.5], [-17, 52.0], [-16, 54.0], [-15, 56.0], [-14, 58.0], [-13, 60.5],
    [-12, 55.0], [-11, 58.0], [-10, 62.0], [-9, 66.0], [-8, 70.0], [-7, 75.0],
    [-6, 78.0], [-5, 82.0], [-4, 87.0], [-3, 91.5], [-2, 96.0], [-1, 98.5],
    [0, 100.0],
    [1, 90.0], [2, 77.0], [3, 70.0], [4, 66.0], [5, 62.0],
    [6, 58.0], [7, 55.0], [8, 52.0], [9, 49.0], [10, 46.0],
    [11, 43.0], [12, 42.0], [13, 44.0], [14, 46.0], [15, 44.0],
    [16, 42.0], [17, 41.0], [18, 39.0], [19, 38.0], [20, 36.5],
    [21, 35.0], [22, 32.0], [23, 30.0], [24, 29.0],
    [25, 28.0], [26, 28.5], [27, 27.5], [28, 27.0], [29, 26.5],
];

export const BUBBLES: BubbleDef[] = [
    {
        id: 'dow1929',
        label: 'Dow Jones 1929',
        sub: '1925 – 1932',
        color: '#f59e0b',
        apiKey: 'dow-1929',
        peakDate: 'Sep 3, 1929',
        peakLevel: '381',
        drawdown: '−89%',
        recoveryMonths: '300+',
        peakPE: '~32×',
        catalyst: 'Credit-fueled speculation, margin buying, post-WWI industrial boom',
        macro: 'Fed tightened in 1928–29. Smoot-Hawley tariffs (1930) collapsed trade. 9,000 banks failed.',
        phases: [
            { label: 'Roaring Twenties Melt-Up', monthOffset: -24, description: 'Industrial expansion, electrification, and massive margin debt fueled a 4× rally from 1925 levels. The Fed kept rates low through 1927.' },
            { label: 'Final Blow-Off', monthOffset: -6, description: 'The last 6 months saw near-vertical acceleration. Call money rates hit 20%. Warning signs widely ignored.' },
            { label: 'Black Tuesday', monthOffset: 1, description: 'Oct 24 (Black Thursday) and Oct 29 (Black Tuesday) — 25 million shares traded on the 29th, prices collapsed in hours.' },
            { label: 'The Long Deflation', monthOffset: 12, description: 'Dow fell 89% over 34 months. 9,000 US banks failed. Industrial production halved. Unemployment reached 25%.' },
        ],
        data: DOW_RAW.map(([m, v]) => ({ monthOffset: m, value: v })),
    },
    {
        id: 'nikkei1989',
        label: 'Nikkei 1989',
        sub: '1984 – 1992',
        color: '#ef4444',
        apiKey: 'japan-1989',
        peakDate: 'Dec 29, 1989',
        peakLevel: '38,957',
        drawdown: '−82%',
        recoveryMonths: '390+',
        peakPE: '~60×',
        catalyst: 'Plaza Accord yen appreciation, BoJ rate cuts, land collateral lending spiral',
        macro: 'BoJ raised rates from 2.5% to 6% (1989–90). Land prices collapsed. Zombie banks. "Lost decade" began.',
        phases: [
            { label: 'Plaza Accord Surge', monthOffset: -36, description: 'The 1985 Plaza Accord weakened the USD. BoJ cut rates to 2.5%. Asset prices soared on cheap credit.' },
            { label: 'Land-Finance Feedback', monthOffset: -18, description: 'Banks lent against rising land values. Companies issued equity at stratospheric multiples. Nikkei PE hit 60×.' },
            { label: 'BoJ Reversal', monthOffset: -3, description: 'Governor Mieno began rate hikes. Initial market reaction muted — widely dismissed as temporary.' },
            { label: 'Collapse & Stagnation', monthOffset: 24, description: 'Nikkei fell 63% by 1992. Zombie banks, deflation, and policy paralysis created the "lost decade".' },
        ],
        data: NIKKEI_RAW.map(([m, v]) => ({ monthOffset: m, value: v })),
    },
    {
        id: 'dotcom2000',
        label: 'Dotcom 2000',
        sub: '1995 – 2002',
        color: '#6366f1',
        apiKey: 'dotcom-2000',
        peakDate: 'Mar 10, 2000',
        peakLevel: '5,049 (Nasdaq)',
        drawdown: '−78%',
        recoveryMonths: '180+',
        peakPE: '~200×',
        catalyst: 'Internet mania, venture capital flood, "new economy" narrative, Y2K spending',
        macro: 'Fed raised rates 175bps in 1999–2000. 9/11 shock. Accounting frauds (Enron, WorldCom) accelerated the bust.',
        phases: [
            { label: 'Internet Mania Begins', monthOffset: -36, description: 'Browser wars, Amazon IPO (1997), E-commerce narrative. Any company with ".com" received funding at any price.' },
            { label: 'Greenspan Warning', monthOffset: -40, description: 'Dec 1996: Greenspan warned of "irrational exuberance." Market paused 2 weeks, then resumed its climb.' },
            { label: 'Blow-Off Top', monthOffset: -6, description: 'Nasdaq gained 86% in 1999 alone. IPO pops of 100–400% on day one were routine. CNBC became prime time.' },
            { label: 'Cascade Failure', monthOffset: 18, description: 'By Oct 2002, $5 trillion in market cap destroyed. 50% of dot-com companies ceased to exist.' },
        ],
        data: NASDAQ_RAW.map(([m, v]) => ({ monthOffset: m, value: v })),
    },
];

// SectionLabel and StatCell live in ui.tsx (JSX not valid in .ts files)
