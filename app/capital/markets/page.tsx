'use client';

import { useMemo, useState } from 'react';

import {
    CurrencyToggle,
    GridToggle,
    LogToggle,
    MissingNote,
    PanelHeader,
    PeriodRow,
    SeriesPicker,
    type Currency,
    type PickerOption,
} from './Controls';
import MarketPanel from './MarketPanel';
import FxPanel from './FxPanel';
import {
    INDEXES,
    METRICS,
    REGIONS,
    ALL_PERIOD,
    DEFAULT_INDEX,
    findIndex,
    findMetric,
    periodsFor,
    type MarketIndex,
    type MetricDef,
    type Period,
} from '@/lib/capital/marketIndexes';
import {
    FX_PAIRS,
    FX_METRICS,
    usdConversion,
    FX_GROUPS,
    DEFAULT_PAIR,
    findPair,
    findFxMetric,
    type FxMetricDef,
    type FxPair,
} from '@/lib/capital/fxPairs';

// ─── page ─────────────────────────────────────────────────────────────────────
// Selection only — each panel fetches and redraws its own series, so a control
// on one never disturbs the other.

const INDEX_OPTIONS: PickerOption[] = INDEXES.map(i => ({
    key: i.series,
    label: i.label,
    color: i.color,
    group: i.region,
    note: i.country,
    listNote: String(i.from),
}));

const PAIR_OPTIONS: PickerOption[] = FX_PAIRS.map(p => ({
    key: p.series,
    label: p.label,
    color: p.color,
    group: p.group,
    note: `${p.base}/${p.quote}`,
    listNote: String(p.from),
}));

export default function MarketsPage() {
    // equities
    const [index, setIndex] = useState<MarketIndex>(findIndex(DEFAULT_INDEX) ?? INDEXES[0]);
    const [metric, setMetric] = useState<MetricDef>(METRICS[0]);
    const [period, setPeriod] = useState<Period>(ALL_PERIOD);
    const [currency, setCurrency] = useState<Currency>('local');
    const [log, setLog] = useState(true);
    const [showGrid, setShowGrid] = useState(true);

    // currencies
    const [pair, setPair] = useState<FxPair>(findPair(DEFAULT_PAIR) ?? FX_PAIRS[0]);
    const [fxMetric, setFxMetric] = useState<FxMetricDef>(FX_METRICS[0]);
    const [fxPeriod, setFxPeriod] = useState<Period>(ALL_PERIOD);
    // null defers to the pair's own default; picking a pair clears it again.
    const [fxLog, setFxLog] = useState<boolean | null>(null);
    const [fxShowGrid, setFxShowGrid] = useState(true);

    const periods = useMemo(() => periodsFor(index.from), [index.from]);

    // What it would take to restate this index in dollars, and whether the
    // metric on screen can carry the conversion at all.
    const conversion = usdConversion(index.code);
    const convertible = conversion.kind === 'available' && metric.convertible;
    // The preference is kept even where it cannot apply, so returning to a
    // convertible index brings the dollar view back with it.
    const activeCurrency: Currency = convertible && currency === 'usd' ? 'usd' : 'local';
    // A percentage that crosses zero has no logarithm.
    const canLog = metric.kind === 'level';
    const fxCanLog = fxMetric.kind === 'rate';
    const fxLogOn = fxCanLog && (fxLog ?? pair.logByDefault);
    // In dollars the series cannot start before the rate does.
    const startYear = activeCurrency === 'usd' && conversion.kind === 'available'
        ? Math.max(index.from, conversion.pair.from)
        : index.from;
    const fxPeriods = useMemo(() => periodsFor(pair.from), [pair.from]);

    /** A series that opens later may not reach the decade on screen — the
     *  Nikkei has a 1960s, the DAX does not. */
    function retune(from: number, current: Period, set: (p: Period) => void) {
        if (!periodsFor(from).some(p => p.label === current.label)) set(ALL_PERIOD);
    }

    function selectIndex(key: string) {
        const next = findIndex(key);
        if (!next) return;
        setIndex(next);
        retune(next.from, period, setPeriod);
    }

    function selectPair(key: string) {
        const next = findPair(key);
        if (!next) return;
        setPair(next);
        retune(next.from, fxPeriod, setFxPeriod);
        setFxLog(null);
    }

    return (
        <div className="mx-auto w-full max-w-[1100px] px-8 py-16">

            {/* header */}
            <div className="mb-10">
                <div className="mb-3 flex flex-wrap items-baseline gap-x-8 gap-y-2">
                    <h1 className="font-serif text-2xl font-light tracking-[0.16em] text-marble">
                        Markets
                    </h1>
                    <span className="font-mono text-[0.65rem] tracking-[0.2em] text-bronze">
                        Equities · Currencies
                    </span>
                </div>
                <p className="font-sans text-[0.6rem] uppercase tracking-[0.24em] text-platinum">
                    Monthly · {INDEXES.length} indexes · {FX_PAIRS.length} pairs · 1900–2026 · Yahoo Finance
                </p>
            </div>

            {/* ─── equities ──────────────────────────────────────────────── */}

            <SectionHeading title="Indexes" note="What capital is worth" />

            <div className="mb-5 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
                <div className="flex flex-col gap-2">
                    <span className="font-sans text-[0.55rem] uppercase tracking-[0.22em] text-platinum-dim">
                        Index
                    </span>
                    <SeriesPicker
                        options={INDEX_OPTIONS}
                        groups={REGIONS}
                        value={index.series}
                        onChange={selectIndex}
                        ariaLabel="Stock market index"
                    />
                </div>

                <div className="flex max-w-[42rem] flex-col items-end gap-2">
                    <PeriodRow periods={periods} value={period} onChange={setPeriod} />
                    <div className="flex items-center gap-1">
                        <CurrencyToggle
                            value={activeCurrency}
                            onChange={setCurrency}
                            disabled={!convertible}
                            title={currencyHint(conversion, metric)}
                        />
                        <LogToggle
                            on={canLog && log}
                            onToggle={() => setLog(l => !l)}
                            disabled={!canLog}
                            title={canLog ? undefined : `${metric.label} is a percentage — a log axis cannot carry it`}
                        />
                        <GridToggle on={showGrid} onToggle={() => setShowGrid(g => !g)} />
                    </div>
                    {conversion.kind === 'missing' && (
                        <MissingNote>
                            No {conversion.code} rate in the database — {index.label} stays in {index.currency}
                        </MissingNote>
                    )}
                    {conversion.kind === 'available' && !metric.convertible && (
                        <p className="max-w-[24rem] text-right font-sans text-[0.55rem] uppercase leading-relaxed tracking-[0.16em] text-platinum-dim">
                            {metric.label} is measured from daily local returns — not convertible
                        </p>
                    )}
                </div>
            </div>

            <div className="w-full border border-stone-line-strong bg-charcoal">
                <PanelHeader
                    subject={index.shortLabel}
                    range={period.kind === 'all' ? `From ${startYear}` : period.label}
                    metrics={METRICS}
                    activeKey={metric.key}
                    onSelect={key => setMetric(findMetric(key) ?? METRICS[0])}
                />
                <MarketPanel
                    index={index}
                    metric={metric}
                    period={period}
                    currency={activeCurrency}
                    log={canLog && log}
                    showGrid={showGrid}
                />
            </div>

            <p className="mt-6 max-w-[46rem] font-sans text-[0.58rem] leading-relaxed tracking-[0.03em] text-platinum">
                {metric.description}. The source series is daily; each point here is the
                last trading day of its month, so the line is monthly.{' '}
                {canLog && log && 'Drawn on a logarithmic axis, where equal vertical distance is equal percentage move. '}
                {activeCurrency === 'usd' && conversion.kind === 'available'
                    ? `Restated in dollars at each month's own ${conversion.pair.shortLabel} rate, so the dollar series begins in ${conversion.pair.from} where that rate begins. `
                    : `Quoted in local currency — ${index.label} reads in ${index.currency}. `}
                Price returns only: dividends are excluded throughout.
            </p>

            {/* ─── currencies ────────────────────────────────────────────── */}

            <div className="mt-20">
                <SectionHeading title="Currencies" note="What the measure is worth" />
            </div>

            <div className="mb-5 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
                <div className="flex flex-col gap-2">
                    <span className="font-sans text-[0.55rem] uppercase tracking-[0.22em] text-platinum-dim">
                        Pair
                    </span>
                    <SeriesPicker
                        options={PAIR_OPTIONS}
                        groups={FX_GROUPS}
                        value={pair.series}
                        onChange={selectPair}
                        ariaLabel="Currency pair"
                    />
                </div>

                <div className="flex max-w-[42rem] flex-col items-end gap-2">
                    <PeriodRow periods={fxPeriods} value={fxPeriod} onChange={setFxPeriod} />
                    <div className="flex items-center gap-1">
                        <LogToggle
                            on={fxLogOn}
                            onToggle={() => setFxLog(!fxLogOn)}
                            disabled={!fxCanLog}
                            title={fxCanLog ? undefined : `${fxMetric.label} is a percentage — a log axis cannot carry it`}
                        />
                        <GridToggle on={fxShowGrid} onToggle={() => setFxShowGrid(g => !g)} />
                    </div>
                    <p className="font-sans text-[0.55rem] uppercase tracking-[0.2em] text-platinum-dim">
                        Rising line · {pair.base} strengthens
                    </p>
                </div>
            </div>

            <div className="w-full border border-stone-line-strong bg-charcoal">
                <PanelHeader
                    subject={pair.shortLabel}
                    range={fxPeriod.kind === 'all' ? `From ${pair.from}` : fxPeriod.label}
                    metrics={FX_METRICS}
                    activeKey={fxMetric.key}
                    onSelect={key => setFxMetric(findFxMetric(key) ?? FX_METRICS[0])}
                />
                <FxPanel
                    pair={pair}
                    metric={fxMetric}
                    period={fxPeriod}
                    log={fxLogOn}
                    showGrid={fxShowGrid}
                />
            </div>

            <p className="mt-6 max-w-[46rem] font-sans text-[0.58rem] leading-relaxed tracking-[0.03em] text-platinum">
                {fxMetric.description}. The rate is {pair.quote} per {pair.base}, so the line
                rises as {pair.base} strengthens and falls as it weakens — {pair.description}.{' '}
                {fxLogOn && 'Drawn on a logarithmic axis, where equal vertical distance is equal percentage move. '}
                Sampled monthly from the daily series, the same way the indexes above are.
            </p>
        </div>
    );
}

/** Why the currency toggle is inert, when it is. */
function currencyHint(conversion: ReturnType<typeof usdConversion>, metric: MetricDef) {
    if (conversion.kind === 'native') return 'Already quoted in dollars';
    if (conversion.kind === 'missing') return `No ${conversion.code} rate in the database`;
    if (!metric.convertible) {
        return `${metric.label} is measured from daily local-currency returns and cannot be restated in dollars`;
    }
    return `Convert at each month's ${conversion.pair.shortLabel} rate`;
}

// ─── section heading ──────────────────────────────────────────────────────────

function SectionHeading({ title, note }: { title: string; note: string }) {
    return (
        <div className="mb-5 flex items-baseline gap-4 border-b border-stone-line pb-3">
            <h2 className="font-serif text-lg font-light tracking-[0.18em] text-marble">
                {title}
            </h2>
            <span className="font-sans text-[0.55rem] uppercase tracking-[0.22em] text-platinum-dim">
                {note}
            </span>
        </div>
    );
}
