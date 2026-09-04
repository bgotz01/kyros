'use client';

import { useMemo, useState } from 'react';

import ChartCard from './ChartCard';
import FxPanel from './FxPanel';
import {
    GridToggle,
    LogToggle,
    PeriodRow,
    SeriesPicker,
    type PickerOption,
} from './Controls';
import {
    ALL_PERIOD,
    TRAILING_PERIODS,
    periodsFor,
    resolutionFor,
    type Period,
    type Resolution,
} from '@/lib/capital/marketIndexes';
import {
    FX_PAIRS,
    FX_METRICS,
    FX_GROUPS,
    DEFAULT_PAIR,
    findPair,
    findFxMetric,
    type FxMetricDef,
    type FxPair,
} from '@/lib/capital/fxPairs';

// ─── FX chart ─────────────────────────────────────────────────────────────────
// The full currencies block: series picker, period row, toggles, chart and
// caption. Owns all selection state so the page above it only renders this
// once and forgets about it.

const PAIR_OPTIONS: PickerOption[] = FX_PAIRS.map(p => ({
    key: p.series,
    label: p.label,
    color: p.color,
    group: p.group,
    note: `${p.base}/${p.quote}`,
    listNote: String(p.from),
}));

export default function FxChart() {
    const [pair, setPair] = useState<FxPair>(findPair(DEFAULT_PAIR) ?? FX_PAIRS[0]);
    const [metric, setMetric] = useState<FxMetricDef>(FX_METRICS[0]);
    const [period, setPeriod] = useState<Period>(TRAILING_PERIODS.find(p => p.label === '5Y') ?? ALL_PERIOD);
    const [log, setLog] = useState(false);
    const [showGrid, setShowGrid] = useState(true);

    const periods = useMemo(() => periodsFor(pair.from), [pair.from]);
    const canLog = metric.kind === 'rate';
    const logOn = canLog && log;

    function retune(from: number, current: Period, set: (p: Period) => void) {
        if (!periodsFor(from).some(p => p.label === current.label)) set(ALL_PERIOD);
    }

    function selectPair(key: string) {
        const next = findPair(key);
        if (!next) return;
        setPair(next);
        retune(next.from, period, setPeriod);
    }

    return (
        <div>
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
                    <PeriodRow periods={periods} value={period} onChange={setPeriod} />
                    <div className="flex items-center gap-1">
                        <LogToggle
                            on={logOn}
                            onToggle={() => setLog(l => !l)}
                            disabled={!canLog}
                            title={canLog ? undefined : `${metric.label} is a percentage — a log axis cannot carry it`}
                        />
                        <GridToggle on={showGrid} onToggle={() => setShowGrid(g => !g)} />
                    </div>
                    <p className="font-sans text-[0.55rem] uppercase tracking-[0.2em] text-platinum-dim">
                        Rising line · {pair.base} strengthens
                    </p>
                </div>
            </div>

            <ChartCard
                subject={pair.shortLabel}
                range={`${period.kind === 'all' ? `From ${pair.from}` : period.label}  ·  ${resolutionFor(period)}`}
                metrics={FX_METRICS}
                activeKey={metric.key}
                onSelect={key => setMetric(findFxMetric(key) ?? FX_METRICS[0])}
            >
                <FxPanel
                    pair={pair}
                    metric={metric}
                    period={period}
                    log={logOn}
                    showGrid={showGrid}
                />
            </ChartCard>

            <p className="mt-6 max-w-[46rem] font-sans text-[0.58rem] leading-relaxed tracking-[0.03em] text-platinum">
                {metric.description}. The rate is {pair.quote} per {pair.base}, so the line
                rises as {pair.base} strengthens and falls as it weakens — {pair.description}.{' '}
                {logOn && 'Drawn on a logarithmic axis, where equal vertical distance is equal percentage move. '}
                {sampling(resolutionFor(period))}
            </p>
        </div>
    );
}

function sampling(resolution: Resolution) {
    if (resolution === 'daily') return 'The source series is daily, and every close in the window is plotted.';
    const bucket = resolution === 'weekly' ? 'week' : 'month';
    return `The source series is daily; each point here is the last trading day of its ${bucket}.`;
}
