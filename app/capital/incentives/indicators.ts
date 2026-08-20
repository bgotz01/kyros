// ─── Incentive indicators ─────────────────────────────────────────────────────
// The six macro series from /capital/chart, plus the ranges that decide whether
// a reading is good, cautious or bad for capital.

export interface MacroRow {
    month: string;
    ten_y: number | null;
    cpi: number | null;
    ey5: number | null;
    real10: number | null;
    eyp5: number | null;
    rey5: number | null;
}

export type SeriesKey = 'ten_y' | 'cpi' | 'ey5' | 'real10' | 'eyp5' | 'rey5';
export type SeriesGroup = 'nominal' | 'inflation' | 'relative';

/** The series that carry a good / caution / bad reading. The nominal levels are
 *  reference only — a 10-Year yield is not good or bad on its own, it is only
 *  good or bad against inflation and against what equities yield. */
export type GradedKey = 'cpi' | 'real10' | 'eyp5' | 'rey5';

export interface SeriesDef {
    key: SeriesKey;
    label: string;
    shortLabel: string;
    description: string;
    group: SeriesGroup;
}

export const SERIES: SeriesDef[] = [
    {
        key: 'ten_y',
        label: '10-Year Treasury Yield',
        shortLabel: '10Y',
        description: 'US 10-Year nominal yield — monthly average of daily data',
        group: 'nominal',
    },
    {
        key: 'ey5',
        label: 'Earnings Yield 5yr',
        shortLabel: 'EY5',
        description: 'S&P 500 earnings yield using 5-year rolling average earnings',
        group: 'nominal',
    },
    {
        key: 'cpi',
        label: 'CPI YoY',
        shortLabel: 'CPI',
        description: 'Consumer Price Index — year-over-year change',
        group: 'inflation',
    },
    {
        key: 'real10',
        label: 'Real 10Y Yield',
        shortLabel: 'R10Y',
        description: '10-Year Treasury Yield minus CPI — real rate',
        group: 'relative',
    },
    {
        key: 'eyp5',
        label: 'Earnings Yield Premium 5yr',
        shortLabel: 'EYP5',
        description: 'EY5 minus 5-year treasury yield — equity risk premium',
        group: 'relative',
    },
    {
        key: 'rey5',
        label: 'Real Earnings Yield 5yr',
        shortLabel: 'REY5',
        description: 'EY5 minus CPI — real return on equities',
        group: 'relative',
    },
];

export const GROUP_LABEL: Record<SeriesGroup, string> = {
    nominal: 'Nominal',
    inflation: 'Inflation',
    relative: 'Relative',
};

export function isGraded(key: SeriesKey): key is GradedKey {
    return key === 'cpi' || key === 'real10' || key === 'eyp5' || key === 'rey5';
}

export const GRADED_SERIES = SERIES.filter(s => isGraded(s.key));

/** Groups in display order, each with the series it holds. */
export const GROUPS: { group: SeriesGroup; series: SeriesDef[] }[] =
    (['nominal', 'inflation', 'relative'] as SeriesGroup[])
        .map(group => ({ group, series: SERIES.filter(s => s.group === group) }));
export const SERIES_BY_KEY = Object.fromEntries(SERIES.map(s => [s.key, s])) as Record<SeriesKey, SeriesDef>;

// ─── bands ────────────────────────────────────────────────────────────────────

export type Band = 'good' | 'caution' | 'bad';

/** Which way the reading has to move to be favourable for capital. */
export type Direction = 'higher' | 'lower';

export interface Threshold {
    direction: Direction;
    /** Reading is good from here on (in the favourable direction). */
    good: number;
    /** Reading is cautious from here on; beyond it, bad. */
    caution: number;
}

export type Thresholds = Record<GradedKey, Threshold>;

// Starting ranges. CPI is the one specified outright — over 5 bad, 3–5 caution,
// under 3 good — the rest follow the same logic from an allocator's seat:
// cheap equities and positive real returns are good, high nominal rates and
// inflation are not.
export const DEFAULT_THRESHOLDS: Thresholds = {
    cpi:    { direction: 'lower',  good: 3, caution: 5 },
    real10: { direction: 'higher', good: 2, caution: 0 },
    eyp5:   { direction: 'higher', good: 2, caution: 0 },
    rey5:   { direction: 'higher', good: 3, caution: 1 },
};

export const BAND_COLOR: Record<Band, string> = {
    good: '#74B87A',
    caution: '#D6A340',
    bad: '#C4574A',
};

export const BAND_LABEL: Record<Band, string> = {
    good: 'Good',
    caution: 'Caution',
    bad: 'Bad',
};

export function bandOf(value: number, t: Threshold): Band {
    if (t.direction === 'higher') {
        if (value >= t.good) return 'good';
        if (value >= t.caution) return 'caution';
        return 'bad';
    }
    if (value <= t.good) return 'good';
    if (value <= t.caution) return 'caution';
    return 'bad';
}

/** A threshold is coherent only when `good` sits beyond `caution`. */
export function isValid(t: Threshold): boolean {
    if (!Number.isFinite(t.good) || !Number.isFinite(t.caution)) return false;
    return t.direction === 'higher' ? t.good > t.caution : t.good < t.caution;
}

/** "≥ 6.00" / "3.00 – 5.00" / "< 4.00" — the written form of one band. */
export function bandRange(t: Threshold, band: Band): string {
    const g = t.good.toFixed(2);
    const c = t.caution.toFixed(2);
    if (t.direction === 'higher') {
        if (band === 'good') return `≥ ${g}`;
        if (band === 'caution') return `${c} – ${g}`;
        return `< ${c}`;
    }
    if (band === 'good') return `≤ ${g}`;
    if (band === 'caution') return `${g} – ${c}`;
    return `> ${c}`;
}


// ─── decades and anchor months ────────────────────────────────────────────────
// Each decade is read at its opening and again at every month the paradigm
// turned. Several turns land a year or two in — the 1980s open at peak
// inflation and only break in 1982 — the 2010s turn lands before the decade
// opens at all, and a decade can turn more than once. Events per
// /capital/inflections.

export type AnchorKind = 'open' | 'inflection';

export interface Inflection {
    month: string;
    label: string;
    /** A move these six US series cannot show. Stated rather than derived,
     *  and marked as such wherever it appears. */
    offChart?: { verdict: string };
}

export interface AnchorDecade {
    decade: number;
    /** In chronological order. */
    inflections: Inflection[];
}

export const ANCHOR_DECADES: AnchorDecade[] = [
    {
        decade: 1960,
        inflections: [{ month: '1962-01', label: 'First full reading' }],
    },
    {
        decade: 1970,
        inflections: [{
            month: '1971-01',
            label: 'Dollar–gold ends',
            // Through 1971 the readings look like a fair bond year — CPI easing to
            // ~3.3 against a real rate over 2. What made commodities the trade was
            // the depeg itself, not anything visible in these series yet.
            offChart: { verdict: 'Commodities' },
        }],
    },
    {
        decade: 1980,
        inflections: [{ month: '1982-01', label: 'Volcker shock' }],
    },
    {
        decade: 1990,
        inflections: [{ month: '1991-01', label: 'Bloc collapses · Web' }],
    },
    {
        decade: 2000,
        inflections: [{
            month: '2001-01',
            label: 'China joins WTO',
            offChart: { verdict: 'International equities' },
        }],
    },
    {
        decade: 2010,
        inflections: [{ month: '2009-01', label: 'GFC + QE' }],
    },
    {
        decade: 2020,
        inflections: [{ month: '2020-04', label: 'COVID + unlimited QE' }],
    },
];

/** Anchors are keyed by decade and kind: { "1980-inflection": "1982-01" }. */
export type Anchors = Record<string, string>;

export function anchorId(decade: number, kind: AnchorKind, index = 0) {
    return kind === 'open' ? `${decade}-open` : `${decade}-inflection-${index}`;
}

export const DEFAULT_ANCHORS: Anchors = Object.fromEntries(
    ANCHOR_DECADES.flatMap(({ decade, inflections }) => [
        [anchorId(decade, 'open'), `${decade}-01`] as const,
        ...inflections.map((inf, i) => [anchorId(decade, 'inflection', i), inf.month] as const),
    ]),
);

const MIN_MONTH = '1914-01';
const MAX_MONTH = '2026-12';

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Step a "YYYY-MM" anchor by whole months, held inside the data's span. */
export function shiftMonth(month: string, delta: number): string {
    const [y, m] = month.split('-').map(Number);
    const total = y * 12 + (m - 1) + delta;
    const next = `${String(Math.floor(total / 12)).padStart(4, '0')}-${String((total % 12) + 1).padStart(2, '0')}`;
    if (next < MIN_MONTH) return MIN_MONTH;
    if (next > MAX_MONTH) return MAX_MONTH;
    return next;
}

export function canShift(month: string, delta: number) {
    return shiftMonth(month, delta) !== month;
}

/** "1982-01" → "1982·01" */
export function fmtMonth(month: string) {
    return month.replace('-', '·');
}

// ─── where capital is being pulled ────────────────────────────────────────────
// Read off the graded measures rather than written per decade, so it stays true
// when the anchor month moves.

export type PullVerdict =
    | 'Equities'
    | 'Equities over bonds'
    | 'High growth equities'
    | 'Equity overvaluation'
    | 'Bonds'
    | 'Commodities';

/** How close to zero both earnings yields must sit to read as a market priced
 *  for growth rather than for current yield. */
const HIGH_GROWTH_WINDOW = 1.0;

/** The real earnings yield equities have to clear to be worth owning outright.
 *  Below it, a market is not cheap — it is expensive. */
const EQUITY_FLOOR = 2.0;

export interface Pull {
    verdict: PullVerdict | string;
    phrase: string;
    /** True when the verdict is stated rather than read off these series. */
    offChart?: boolean;
}

export function describePull(
    values: { cpi: number | null; real10: number | null; eyp5: number | null; rey5: number | null },
    t: Thresholds,
): Pull | null {
    const { cpi, real10, eyp5, rey5 } = values;
    if (rey5 == null) return null;

    const equityBand = bandOf(rey5, t.rey5);
    const inflationBand = cpi == null ? null : bandOf(cpi, t.cpi);
    const rateBand = real10 == null ? null : bandOf(real10, t.real10);
    const premiumBand = eyp5 == null ? null : bandOf(eyp5, t.eyp5);

    const raw = ((): PullVerdict => {
        // A genuinely cheap market pulls capital on its own terms — a real
        // earnings yield inside the good band beats any comparison.
        if (equityBand === 'good') return 'Equities';

        // Nothing to compare against yet (pre-1962): paper works or it doesn't.
        if (real10 == null) return rey5 >= 0 ? 'Equities' : 'Commodities';


        // High inflation with no real rate to escape into — both paper claims
        // are losing, so capital goes to what inflation cannot dilute.
        if (inflationBand === 'bad' && rateBand !== 'good') return 'Commodities';

        // Earnings yields below both bonds and inflation: the market is paying
        // less than either, which is a price problem rather than a trade.
        if (eyp5 != null && rey5 < 0 && eyp5 < 0) return 'Equity overvaluation';

        // Both earnings yields pinned near zero — investors are accepting no
        // current yield, which they only do when they are buying growth.
        if (eyp5 != null && Math.abs(rey5) <= HIGH_GROWTH_WINDOW && Math.abs(eyp5) <= HIGH_GROWTH_WINDOW) {
            return 'High growth equities';
        }

        // Equities need not pay well outright to be the trade; a wide earnings
        // yield premium means they are paid better than bonds are.
        if (premiumBand === 'good') return 'Equities over bonds';

        // Bonds need a real rate in its good band — 2% by default. A real yield
        // under that bar is not a reason to own bonds, whatever equities pay.
        if (rateBand !== 'good') return 'Equities';

        // A real rate worth having, paid without equity risk.
        return real10 >= rey5 ? 'Bonds' : 'Equities';
    })();

    // Owning equities outright takes a real earnings yield above the floor.
    // Anything less is not a market to buy, it is one that is priced too high.
    const verdict: PullVerdict =
        raw === 'Equities' && rey5 <= EQUITY_FLOOR ? 'Equity overvaluation' : raw;

    const clauses: string[] = [];

    if (inflationBand) {
        clauses.push(
            inflationBand === 'good' ? 'low inflation'
                : inflationBand === 'caution' ? 'rising inflation'
                    : 'high inflation',
        );
    }

    // Whatever decided the verdict is what belongs in the phrase.
    if (verdict === 'Equities over bonds') {
        clauses.push('wide equity premium');
    } else if (verdict === 'High growth equities') {
        clauses.push('earnings yields near zero');
    } else if (verdict === 'Equity overvaluation') {
        clauses.push('negative equity premium');
    } else if (rateBand) {
        clauses.push(
            rateBand === 'good' ? 'positive real rates'
                : rateBand === 'caution' ? 'low real rates'
                    : 'negative real rates',
        );
    }

    clauses.push(
        rey5 < 0 ? 'negative real equity returns'
            : equityBand === 'good' ? 'strong real equity returns'
                : 'thin real equity returns',
    );

    return { verdict, phrase: clauses.join(' · ') };
}

// ─── persistence ──────────────────────────────────────────────────────────────

/** A small external store so components read saved settings through
 *  useSyncExternalStore: the server renders the defaults, the client swaps in
 *  whatever was saved, and every reader updates together. */
function createStore<T>(storageKey: string, defaults: T, merge: (stored: unknown, defaults: T) => T) {
    let current: T | null = null;
    const listeners = new Set<() => void>();

    function load(): T {
        if (typeof window === 'undefined') return defaults;
        try {
            const raw = window.localStorage.getItem(storageKey);
            return raw ? merge(JSON.parse(raw), defaults) : defaults;
        } catch {
            return defaults;
        }
    }

    return {
        subscribe(cb: () => void) {
            listeners.add(cb);
            return () => { listeners.delete(cb); };
        },
        get(): T {
            current ??= load();
            return current;
        },
        getDefault(): T {
            return defaults;
        },
        set(next: T) {
            current = next;
            try {
                window.localStorage.setItem(storageKey, JSON.stringify(next));
            } catch {
                // storage unavailable — the change stays for this session only
            }
            for (const cb of listeners) cb();
        },
    };
}

const thresholdStore = createStore<Thresholds>(
    'kyros:incentives:thresholds',
    DEFAULT_THRESHOLDS,
    (stored, defaults) => {
        const parsed = stored as Partial<Thresholds>;
        const next = { ...defaults };
        for (const s of GRADED_SERIES) {
            const t = parsed?.[s.key as GradedKey];
            if (t && isValid(t)) next[s.key as GradedKey] = { direction: t.direction, good: t.good, caution: t.caution };
        }
        return next;
    },
);

export const subscribeThresholds = thresholdStore.subscribe;
export const getThresholds = thresholdStore.get;
export const getDefaultThresholds = thresholdStore.getDefault;
export const setThresholds = thresholdStore.set;

const anchorStore = createStore<Anchors>(
    'kyros:incentives:anchors',
    DEFAULT_ANCHORS,
    (stored, defaults) => {
        const parsed = stored as Partial<Anchors>;
        const next = { ...defaults };
        for (const id of Object.keys(defaults)) {
            const m = parsed?.[id];
            if (typeof m === 'string' && MONTH_RE.test(m) && m >= MIN_MONTH && m <= MAX_MONTH) next[id] = m;
        }
        return next;
    },
);

export const subscribeAnchors = anchorStore.subscribe;
export const getAnchors = anchorStore.get;
export const getDefaultAnchors = anchorStore.getDefault;
export const setAnchors = anchorStore.set;
