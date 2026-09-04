'use client';

import { useMemo, useState } from 'react';

import ChartCard from './ChartCard';
import MarketPanel from './MarketPanel';
import {
    CurrencyToggle,
    FamilyTabs,
    GridToggle,
    LogToggle,
    MissingNote,
    PeriodRow,
    SeriesPicker,
    SubPicker,
    type Currency,
    type PickerOption,
} from './Controls';
import {
    INDEXES,
    INDEX_GROUPS,
    METRIC_FAMILY_DEFS,
    ALL_PERIOD,
    TRAILING_PERIODS,
    DEFAULT_INDEX,
    findIndex,
    findMetric,
    findFamilyDef,
    metricColor,
    metricsFor,
    periodsFor,
    resolutionFor,
    isConvertible,
    isLevel,
    type MarketIndex,
    type MetricDef,
    type MetricFamilyKey,
    type Period,
    type Resolution,
} from '@/lib/capital/marketIndexes';
import { usdConversion } from '@/lib/capital/fxPairs';

// ─── Index chart ──────────────────────────────────────────────────────────────
// The full equities block: series picker, period row, toggles, chart and
// caption. Owns all selection state so the page above it only renders this
// once and forgets about it.
//
// Metrics are now organised as three families (Level / Return / Vol). Selecting
// a family tab switches the chart immediately; a SubPicker row of chips (2Y /
// 5Y / 10Y, or 63D / 252D) appears below when the active family has more than
// one member.

const INDEX_OPTIONS: PickerOption[] = INDEXES.map(i => ({
    key: i.series,
    label: i.label,
    color: i.color,
    group: i.group,
    note: i.origin,
    listNote: String(i.from),
}));

export default function IndexChart() {
    const [index, setIndex] = useState<MarketIndex>(findIndex(DEFAULT_INDEX) ?? INDEXES[0]);
    const [familyKey, setFamilyKey] = useState<MetricFamilyKey>('level');
    // Per-family memory: switching away and back keeps the last sub selected.
    const [returnSub, setReturnSub] = useState<string>('Value_Return5Y');
    const [volSub, setVolSub] = useState<string>('Value_Vol63');
    const [period, setPeriod] = useState<Period>(TRAILING_PERIODS.find(p => p.label === '5Y') ?? ALL_PERIOD);
    const [currency, setCurrency] = useState<Currency>('local');
    const [log, setLog] = useState(false);
    const [showGrid, setShowGrid] = useState(true);

    // ── derived ───────────────────────────────────────────────────────────────

    const periods = useMemo(() => periodsFor(index.from), [index.from]);
    const hasVol = index.volatility;

    // Families available for this index (commodities have no vol).
    const families = useMemo(
        () => hasVol ? METRIC_FAMILY_DEFS : METRIC_FAMILY_DEFS.filter(f => f.key !== 'volatility'),
        [hasVol],
    );

    const family = findFamilyDef(familyKey);

    // Resolve the active MetricDef from family + per-family sub state.
    const activeMetricKey =
        familyKey === 'return' ? returnSub :
            familyKey === 'volatility' ? volSub :
                'Value';

    const metric: MetricDef = findMetric(activeMetricKey) ?? family.defaultSub;

    const color = metricColor(familyKey, index.color);
    const convertible = usdConversion(index.code).kind === 'available' && isConvertible(metric);
    const conversion = usdConversion(index.code);
    const activeCurrency: Currency = convertible && currency === 'usd' ? 'usd' : 'local';
    const canLog = isLevel(metric);

    const startYear = activeCurrency === 'usd' && conversion.kind === 'available'
        ? Math.max(index.from, conversion.pair.from)
        : index.from;

    // ── handlers ──────────────────────────────────────────────────────────────

    function retune(from: number, current: Period, set: (p: Period) => void) {
        if (!periodsFor(from).some(p => p.label === current.label)) set(ALL_PERIOD);
    }

    function selectIndex(key: string) {
        const next = findIndex(key);
        if (!next) return;
        setIndex(next);
        retune(next.from, period, setPeriod);
        // If switching to a commodity (no vol) while vol is active, fall back.
        if (!next.volatility && familyKey === 'volatility') setFamilyKey('level');
    }

    function selectFamily(key: MetricFamilyKey) {
        setFamilyKey(key);
        // Level never has a log axis.
        if (key !== 'level') setLog(false);
    }

    function selectSub(key: string) {
        if (familyKey === 'return') setReturnSub(key);
        if (familyKey === 'volatility') setVolSub(key);
    }

    // ── render ────────────────────────────────────────────────────────────────

    return (
        <div>
            {/* ── controls row ──────────────────────────────────────────────── */}
            <div className="mb-5 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
                <div className="flex flex-col gap-2">
                    <span className="font-sans text-[0.55rem] uppercase tracking-[0.22em] text-platinum-dim">
                        Index
                    </span>
                    <SeriesPicker
                        options={INDEX_OPTIONS}
                        groups={INDEX_GROUPS}
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
                    {conversion.kind === 'available' && !isConvertible(metric) && (
                        <p className="max-w-[24rem] text-right font-sans text-[0.55rem] uppercase leading-relaxed tracking-[0.16em] text-platinum-dim">
                            {metric.label} is measured from daily local returns — not convertible
                        </p>
                    )}
                </div>
            </div>

            {/* ── chart card ────────────────────────────────────────────────── */}
            <ChartCard
                subject={index.shortLabel}
                range={`${period.kind === 'all' ? `From ${startYear}` : period.label}  ·  ${resolutionFor(period)}`}
                families={families}
                activeFamily={familyKey}
                activeColor={color}
                onSelectFamily={selectFamily}
                subPicker={
                    <SubPicker
                        subs={family.subs}
                        activeKey={activeMetricKey}
                        color={color}
                        onSelect={selectSub}
                    />
                }
            >
                <MarketPanel
                    index={index}
                    metric={metric}
                    period={period}
                    currency={activeCurrency}
                    log={canLog && log}
                    showGrid={showGrid}
                />
            </ChartCard>

            {/* ── caption ───────────────────────────────────────────────────── */}
            <p className="mt-6 max-w-[46rem] font-sans text-[0.58rem] leading-relaxed tracking-[0.03em] text-platinum">
                {metric.description}. {sampling(resolutionFor(period))}{' '}
                {canLog && log && 'Drawn on a logarithmic axis, where equal vertical distance is equal percentage move. '}
                {activeCurrency === 'usd' && conversion.kind === 'available'
                    ? `Restated in dollars at each month's own ${conversion.pair.shortLabel} rate, so the dollar series begins in ${conversion.pair.from} where that rate begins. `
                    : `Quoted in local currency — ${index.label} reads in ${index.currency}. `}
                Price returns only: dividends are excluded throughout.
            </p>
        </div>
    );
}

function sampling(resolution: Resolution) {
    if (resolution === 'daily') return 'The source series is daily, and every close in the window is plotted.';
    const bucket = resolution === 'weekly' ? 'week' : 'month';
    return `The source series is daily; each point here is the last trading day of its ${bucket}.`;
}

function currencyHint(conversion: ReturnType<typeof usdConversion>, metric: MetricDef) {
    if (conversion.kind === 'native') return 'Already quoted in dollars';
    if (conversion.kind === 'missing') return `No ${conversion.code} rate in the database`;
    if (!isConvertible(metric)) {
        return `${metric.label} is measured from daily local-currency returns and cannot be restated in dollars`;
    }
    return `Convert at each month's ${conversion.pair.shortLabel} rate`;
}
