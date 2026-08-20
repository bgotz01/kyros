'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { RangesModal } from './RangesModal';
import {
    BAND_COLOR,
    BAND_LABEL,
    ANCHOR_DECADES,
    DEFAULT_ANCHORS,
    GROUPS,
    GROUP_LABEL,
    SERIES,
    anchorId,
    bandOf,
    bandRange,
    canShift,
    describePull,
    fmtMonth,
    getAnchors,
    getDefaultAnchors,
    getDefaultThresholds,
    getThresholds,
    isGraded,
    setAnchors,
    setThresholds,
    shiftMonth,
    subscribeAnchors,
    subscribeThresholds,
    type AnchorKind,
    type Anchors,
    type Band,
    type GradedKey,
    type MacroRow,
    type Pull,
    type SeriesDef,
    type SeriesKey,
    type Threshold,
    type Thresholds,
} from './indicators';

const BANDS: Band[] = ['good', 'caution', 'bad'];

// ─── row model ────────────────────────────────────────────────────────────────

interface Reading {
    value: number | null;
    /** Where this reading sits in the series' own history, 0–100. */
    rank: number | null;
}

/** One month of percentile ranks, from /api/macro-percentiles — the same source
 *  the percentile view of /capital/chart reads. */
interface PercentileRow {
    month: string;
    rank: Record<SeriesKey, number | null>;
}

interface AnchorRow {
    decade: number;
    kind: AnchorKind;
    /** Which of the decade's inflections this is; 0 for the opening row. */
    index: number;
    /** Last row of its decade — carries the block's closing space. */
    lastOfDecade: boolean;
    /** The month this row is read at — "1982-01". */
    month: string;
    /** The month it opens on before anyone steps it. */
    defaultMonth: string;
    /** Event name, on the inflection row. */
    label: string | null;
    readings: Record<SeriesKey, Reading>;
    pull: Pull | null;
}

type ValuesByKey = Record<SeriesKey, number | null>;

/** Values at exactly this month — no falling forward. A series that had not
 *  started yet reads as nothing, and the month is yours to move. */
function valuesAt(rows: MacroRow[], month: string): ValuesByKey {
    const row = rows.find(r => r.month === `${month}-01`);
    const out = {} as ValuesByKey;
    for (const s of SERIES) out[s.key] = row?.[s.key] ?? null;
    return out;
}

function ranksAt(ranks: PercentileRow[], month: string): Partial<Record<SeriesKey, number | null>> {
    return ranks.find(r => r.month === `${month}-01`)?.rank ?? {};
}

function toReadings(values: ValuesByKey, ranks: Partial<Record<SeriesKey, number | null>>): Record<SeriesKey, Reading> {
    const out = {} as Record<SeriesKey, Reading>;
    for (const s of SERIES) {
        const value = values[s.key];
        out[s.key] = { value, rank: value == null ? null : ranks[s.key] ?? null };
    }
    return out;
}

function buildRows(
    rows: MacroRow[],
    ranks: PercentileRow[],
    anchors: Anchors,
    thresholds: Thresholds,
): AnchorRow[] {
    const out: AnchorRow[] = [];

    for (const { decade, inflections } of ANCHOR_DECADES) {
        const openMonth = anchors[anchorId(decade, 'open')];
        const open = valuesAt(rows, openMonth);

        const pullOf = (v: ValuesByKey) =>
            describePull({ cpi: v.cpi, real10: v.real10, eyp5: v.eyp5, rey5: v.rey5 }, thresholds);

        out.push({
            decade,
            kind: 'open',
            index: 0,
            lastOfDecade: inflections.length === 0,
            month: openMonth,
            defaultMonth: `${decade}-01`,
            label: null,
            readings: toReadings(open, ranksAt(ranks, openMonth)),
            pull: pullOf(open),
        });

        // every turn is measured against the decade it belongs to, not the last one
        inflections.forEach((inflection, i) => {
            const turnMonth = anchors[anchorId(decade, 'inflection', i)];
            const turn = valuesAt(rows, turnMonth);
            const derived = pullOf(turn);

            out.push({
                decade,
                kind: 'inflection',
                index: i,
                lastOfDecade: i === inflections.length - 1,
                month: turnMonth,
                defaultMonth: inflection.month,
                label: inflection.label,
                readings: toReadings(turn, ranksAt(ranks, turnMonth)),
                pull: inflection.offChart
                    // the readings still describe what happened at home, and are what
                    // sent capital abroad — so they stay under the stated verdict
                    ? { verdict: inflection.offChart.verdict, phrase: derived?.phrase ?? '', offChart: true }
                    : derived,
            });
        });
    }

    return out;
}

// ─── formatting ───────────────────────────────────────────────────────────────

function fmt(v: number | null) {
    if (v == null) return '—';
    // typographic minus, so negatives line up with the delta row below
    return `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)}`;
}

/** Percentile rank as a whole number with its ordinal-free unit. */
function fmtRank(v: number | null) {
    return v == null ? null : `${Math.round(v)}`;
}

// ─── hover tooltip ────────────────────────────────────────────────────────────

const TOOLTIP_WIDTH = 256;
const TOOLTIP_GAP = 12;

interface HoverState {
    series: SeriesDef;
    month: string;
    /** Event name when the number sits on an inflection row. */
    anchorLabel: string | null;
    reading: Reading;
    band: Band | null;
    /** Viewport coordinates, already clamped so the panel stays on screen. */
    x: number;
    y: number;
    /** Hangs below the number when there is no room above it. */
    below: boolean;
}

/** Where to anchor the panel for a hovered number. */
function anchorFor(rect: DOMRect): Pick<HoverState, 'x' | 'y' | 'below'> {
    const half = TOOLTIP_WIDTH / 2;
    const centre = rect.left + rect.width / 2;
    const x = Math.max(half + TOOLTIP_GAP, Math.min(centre, window.innerWidth - half - TOOLTIP_GAP));
    // roughly the panel's height — enough to know whether it clears the top
    const below = rect.top < 200;
    return { x, y: below ? rect.bottom : rect.top, below };
}

/** Fixed to the viewport so it is never clipped by the table's scroll box. */
function ReadingTooltip({ hover, threshold }: { hover: HoverState; threshold: Threshold | null }) {
    const { series, month, anchorLabel, reading, band, x, y, below } = hover;

    return (
        <div
            className={`pointer-events-none fixed z-50 -translate-x-1/2 ${below ? '' : '-translate-y-full'}`}
            style={{ left: x, top: below ? y + TOOLTIP_GAP : y - TOOLTIP_GAP }}
        >
            <div
                className="border border-stone-line-strong bg-obsidian px-4 py-3"
                style={{ width: TOOLTIP_WIDTH }}
            >
                <p className="font-mono text-[0.6rem] tracking-[0.18em] text-bronze">
                    {fmtMonth(month)} · {series.shortLabel}
                </p>
                <p className="mt-1 font-sans text-[0.58rem] uppercase tracking-[0.14em] text-platinum-dim">
                    {anchorLabel ?? series.label}
                </p>

                <div className="mt-2.5 flex items-baseline gap-2 border-t border-stone-line pt-2.5">
                    <span
                        className="font-mono text-[0.86rem] tracking-[0.04em] tabular-nums"
                        style={{ color: band ? BAND_COLOR[band] : 'var(--color-marble)' }}
                    >
                        {fmt(reading.value)}
                    </span>
                    <span className="font-mono text-[0.58rem] text-platinum-dim">%</span>
                    {band && (
                        <span
                            className="ml-auto font-sans text-[0.58rem] uppercase tracking-[0.18em]"
                            style={{ color: BAND_COLOR[band] }}
                        >
                            {BAND_LABEL[band]}
                        </span>
                    )}
                </div>

                {threshold ? (
                    <div className="mt-2.5 flex flex-col gap-1 border-t border-stone-line pt-2.5">
                        {BANDS.map(b => (
                            <div key={b} className="flex items-center gap-2.5">
                                <span
                                    className="h-1.5 w-1.5 shrink-0"
                                    style={{ background: BAND_COLOR[b], opacity: b === band ? 1 : 0.45 }}
                                />
                                <span
                                    className="w-14 font-sans text-[0.56rem] uppercase tracking-[0.16em]"
                                    style={{ color: b === band ? BAND_COLOR[b] : 'var(--color-platinum-dim)' }}
                                >
                                    {BAND_LABEL[b]}
                                </span>
                                <span
                                    className="font-mono text-[0.62rem] tracking-[0.06em] tabular-nums"
                                    style={{ color: b === band ? BAND_COLOR[b] : 'var(--color-platinum-dim)' }}
                                >
                                    {bandRange(threshold, b)}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="mt-2.5 border-t border-stone-line pt-2.5 font-sans text-[0.56rem] uppercase leading-relaxed tracking-[0.14em] text-platinum-dim">
                        Reference level — not graded
                    </p>
                )}

                {reading.rank != null && (
                    <p className="mt-2 font-mono text-[0.55rem] tracking-[0.08em] text-platinum-dim">
                        {fmtRank(reading.rank)}th percentile of its history to date
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── month stepper ────────────────────────────────────────────────────────────

function MonthStepper({
    month,
    defaultMonth,
    size,
    onShift,
    onReset,
}: {
    month: string;
    defaultMonth: string;
    size: 'sm' | 'md';
    onShift: (delta: number) => void;
    onReset: () => void;
}) {
    const moved = month !== defaultMonth;

    return (
        <div className="flex items-center gap-1.5">
            <StepButton label="Earlier month" glyph="−" disabled={!canShift(month, -1)} onClick={() => onShift(-1)} />
            <span
                className={`font-mono tabular-nums ${size === 'md'
                    ? 'text-[0.95rem] font-light tracking-[0.06em] text-bronze-bright'
                    : 'text-[0.62rem] tracking-[0.1em] text-platinum-dim'}`}
            >
                {fmtMonth(month)}
            </span>
            <StepButton label="Later month" glyph="+" disabled={!canShift(month, 1)} onClick={() => onShift(1)} />
            {moved && (
                <button
                    type="button"
                    onClick={onReset}
                    title={`Back to ${fmtMonth(defaultMonth)}`}
                    aria-label={`Reset to ${fmtMonth(defaultMonth)}`}
                    className="ml-0.5 flex h-4 shrink-0 items-center px-1 font-mono text-[0.55rem] leading-none text-bronze-dim transition-colors duration-300 ease-mechanical hover:text-bronze-bright"
                >
                    ↺
                </button>
            )}
        </div>
    );
}

function StepButton({
    label,
    glyph,
    disabled,
    onClick,
}: {
    label: string;
    glyph: string;
    disabled: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={`flex h-4 w-4 shrink-0 items-center justify-center border border-stone-line font-mono text-[0.6rem] leading-none transition-[opacity,color,border-color] duration-300 ease-mechanical ${disabled
                ? 'cursor-not-allowed opacity-20'
                : 'text-platinum-dim opacity-40 hover:border-bronze hover:text-bronze-bright group-hover:opacity-100'}`}
        >
            {glyph}
        </button>
    );
}

// ─── cell ─────────────────────────────────────────────────────────────────────

function Cell({
    series,
    row,
    threshold,
    divider,
    muted,
    onHover,
}: {
    series: SeriesDef;
    row: AnchorRow;
    threshold: Threshold | null;
    divider: boolean;
    /** Opening rows step back only while the turn rows are there to carry the eye. */
    muted: boolean;
    onHover: (h: HoverState | null) => void;
}) {
    const { month, kind, label, lastOfDecade } = row;
    const reading = row.readings[series.key];
    const { value, rank } = reading;
    const missing = value == null;
    const band = !missing && threshold ? bandOf(value, threshold) : null;

    const color = band
        ? BAND_COLOR[band]
        : missing
            ? 'var(--color-platinum-dim)'
            : 'var(--color-platinum)';

    return (
        <td className={`${kind === 'open' ? 'pt-5' : 'pt-2'} ${lastOfDecade ? 'pb-5' : 'pb-2'} pr-8 align-top ${divider ? 'border-l border-stone-line pl-8' : ''}`}>
            <div
                className="inline-flex cursor-default items-baseline gap-1.5"
                onMouseEnter={e => {
                    if (missing) return;
                    onHover({
                        series,
                        month,
                        anchorLabel: label,
                        reading,
                        band,
                        ...anchorFor(e.currentTarget.getBoundingClientRect()),
                    });
                }}
                onMouseLeave={() => onHover(null)}
            >
                <span
                    className="font-mono text-[0.92rem] tracking-[0.04em] tabular-nums"
                    style={{ color, opacity: muted ? 0.62 : 1 }}
                >
                    {fmt(value)}
                </span>
                {!missing && (
                    <span className="font-mono text-[0.6rem] text-platinum-dim">%</span>
                )}
            </div>
            {/* percentile — where this reading sits in the series' own history */}
            <div className="mt-1.5 flex items-center gap-1.5">
                {rank != null ? (
                    <>
                        <span className="h-px w-6 shrink-0 bg-stone-line" style={{ opacity: muted ? 0.6 : 1 }}>
                            <span
                                className="block h-px"
                                style={{ width: `${Math.round(rank)}%`, background: color, opacity: 0.85 }}
                            />
                        </span>
                        <span
                            className="font-mono text-[0.58rem] tracking-[0.08em] text-platinum-dim tabular-nums"
                            style={{ opacity: muted ? 0.7 : 1 }}
                        >
                            {fmtRank(rank)}
                        </span>
                    </>
                ) : (
                    <span className="font-mono text-[0.58rem] text-platinum-dim">&nbsp;</span>
                )}
            </div>
        </td>
    );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function IncentivesPage() {
    const [rows, setRows] = useState<MacroRow[]>([]);
    const [ranks, setRanks] = useState<PercentileRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [hover, setHover] = useState<HoverState | null>(null);
    const [showInflections, setShowInflections] = useState(true);
    const [notesOpen, setNotesOpen] = useState(false);

    // saved settings live outside React so the server renders the defaults and
    // the client swaps in what was stored, without a hydration mismatch
    const thresholds = useSyncExternalStore(subscribeThresholds, getThresholds, getDefaultThresholds);
    const anchors = useSyncExternalStore(subscribeAnchors, getAnchors, getDefaultAnchors);

    useEffect(() => {
        Promise.all([
            fetch('/api/macro-chart').then(r => r.json()),
            fetch('/api/macro-percentiles').then(r => r.json()),
        ])
            .then(([values, percentiles]) => {
                if (!Array.isArray(values)) throw new Error(values?.error ?? 'Unexpected response');
                setRows(values);
                // percentiles are context, not the reading — a failure here leaves
                // the table intact rather than blanking it
                if (Array.isArray(percentiles)) setRanks(percentiles);
                setLoading(false);
            })
            .catch((e) => { setError(e.message ?? 'Failed to load macro data.'); setLoading(false); });
    }, []);

    const allRows = useMemo(() => buildRows(rows, ranks, anchors, thresholds), [rows, ranks, anchors, thresholds]);
    const tableRows = showInflections ? allRows : allRows.filter(r => r.kind === 'open');

    const anchorsMoved = Object.keys(DEFAULT_ANCHORS).some(id => anchors[id] !== DEFAULT_ANCHORS[id]);

    function shiftAnchor(decade: number, kind: AnchorKind, index: number, delta: number) {
        const id = anchorId(decade, kind, index);
        setAnchors({ ...anchors, [id]: shiftMonth(anchors[id], delta) });
        setHover(null);
    }

    function resetAnchor(decade: number, kind: AnchorKind, index: number) {
        const id = anchorId(decade, kind, index);
        setAnchors({ ...anchors, [id]: DEFAULT_ANCHORS[id] });
        setHover(null);
    }

    const thresholdFor = (key: SeriesKey): Threshold | null =>
        isGraded(key) ? thresholds[key as GradedKey] : null;

    return (
        <div className="mx-auto w-full max-w-[1100px] px-8 py-20">

            {/* ── header ──────────────────────────────────────────────────────── */}
            <div className="mb-10">
                <div className="mb-6 flex flex-wrap items-baseline gap-x-8 gap-y-3">
                    <h1 className="font-serif text-5xl font-light tracking-[0.12em] text-marble">
                        Incentives
                    </h1>
                    <span className="font-mono text-[0.72rem] tracking-[0.2em] text-bronze">
                        I² · Where is the pressure pulling capital?
                    </span>
                </div>
                <p className="font-sans text-[0.85rem] uppercase tracking-[0.28em] text-platinum-dim">
                    Rate · inflation · valuation at the opening of each decade
                </p>
            </div>

            {/* ── band key + controls ─────────────────────────────────────────── */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-y border-stone-line py-3">
                <div className="flex flex-wrap items-center gap-6">
                    {BANDS.map(b => (
                        <span key={b} className="flex items-center gap-2">
                            <span className="h-0.5 w-4 shrink-0" style={{ background: BAND_COLOR[b] }} />
                            <span className="font-sans text-[0.58rem] uppercase tracking-[0.2em] text-platinum-dim">
                                {BAND_LABEL[b]}
                            </span>
                        </span>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    {anchorsMoved && (
                        <button
                            type="button"
                            onClick={() => setAnchors(DEFAULT_ANCHORS)}
                            title="Return every reading to its default month"
                            className="flex items-center gap-2 border border-bronze-dim px-4 py-1.5 font-sans text-[0.6rem] uppercase tracking-[0.2em] text-bronze-dim transition-colors duration-300 ease-mechanical hover:border-bronze hover:text-bronze-bright"
                        >
                            <span aria-hidden className="font-mono text-[0.7rem] leading-none">↺</span>
                            Reset all months
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowInflections(v => !v)}
                        className={`flex items-center gap-2 border px-4 py-1.5 font-sans text-[0.6rem] uppercase tracking-[0.2em] transition-colors duration-300 ease-mechanical ${showInflections
                            ? 'border-stone-line-strong text-platinum'
                            : 'border-stone-line text-platinum-dim hover:text-platinum'}`}
                    >
                        <span className={`h-2 w-2 border transition-colors duration-300 ${showInflections ? 'border-bronze bg-bronze/30' : 'border-platinum-dim'}`} />
                        Inflections
                    </button>
                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="border border-stone-line px-4 py-1.5 font-sans text-[0.6rem] uppercase tracking-[0.2em] text-platinum-dim transition-colors duration-300 ease-mechanical hover:border-bronze hover:text-bronze-bright"
                    >
                        Ranges
                    </button>
                </div>
            </div>

            {/* ── states ──────────────────────────────────────────────────────── */}
            {loading && (
                <div className="border border-stone-line bg-charcoal py-32 text-center">
                    <span className="animate-pulse font-mono text-[0.6rem] tracking-[0.28em] text-platinum-dim">
                        Loading…
                    </span>
                </div>
            )}

            {error && (
                <div className="border border-stone-line bg-charcoal py-32 text-center">
                    <span className="font-mono text-[0.6rem] tracking-[0.18em] text-bronze">{error}</span>
                </div>
            )}

            {/* ── snapshot table ──────────────────────────────────────────────── */}
            {!loading && !error && (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            {/* group row */}
                            <tr>
                                <th className="pb-2 pr-8 text-left" />
                                {GROUPS.map(({ group, series }, gi) => (
                                    <th
                                        key={group}
                                        colSpan={series.length}
                                        className={`pb-2 pr-8 text-left font-sans text-[0.6rem] uppercase tracking-[0.24em] ${gi > 0 ? 'border-l border-stone-line pl-8' : ''
                                            } ${group === 'relative' ? 'text-bronze' : 'text-platinum-dim'}`}
                                    >
                                        {GROUP_LABEL[group]}
                                    </th>
                                ))}
                                <th className="border-l border-stone-line pb-2 pl-8 text-left font-sans text-[0.6rem] uppercase tracking-[0.24em] text-bronze">
                                    Signal
                                </th>
                            </tr>
                            {/* series row */}
                            <tr className="border-b-2 border-stone-line-strong">
                                <th className="pb-4 pr-8 text-left font-sans text-[0.72rem] uppercase tracking-[0.22em] text-platinum-dim">
                                    Decade · Turn
                                </th>
                                {SERIES.map((s, i) => (
                                    <th
                                        key={s.key}
                                        title={s.description}
                                        className={`pb-4 pr-8 text-left font-mono text-[0.72rem] tracking-[0.14em] ${isNewGroup(i) ? 'border-l border-stone-line pl-8' : ''
                                            } ${isGraded(s.key) ? 'text-platinum' : 'text-platinum-dim'}`}
                                    >
                                        {s.shortLabel}
                                    </th>
                                ))}
                                <th className="border-l border-stone-line pb-4 pl-8 text-left font-sans text-[0.6rem] uppercase tracking-[0.18em] text-platinum-dim">
                                    Capital pulled to
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableRows.map((row) => {
                                const { decade, kind, index, lastOfDecade, month, defaultMonth, label, pull } = row;
                                const opensDecade = kind === 'open';
                                return (
                                    <tr
                                        key={`${decade}-${kind}-${index}`}
                                        className={`group transition-colors duration-300 ease-mechanical hover:bg-charcoal ${opensDecade && decade !== ANCHOR_DECADES[0].decade ? 'border-t border-stone-line' : ''
                                            }`}
                                    >
                                        {/* decade / anchor month */}
                                        <td className={`${opensDecade ? 'pt-5' : 'pt-2'} ${lastOfDecade ? 'pb-5' : 'pb-2'} pr-8 align-top`}>
                                            {opensDecade ? (
                                                <>
                                                    <p className="font-mono text-[1.4rem] font-light leading-none tracking-[0.06em] text-bronze">
                                                        {decade}
                                                    </p>
                                                    <div className="mt-2">
                                                        <MonthStepper
                                                            month={month}
                                                            defaultMonth={defaultMonth}
                                                            size="sm"
                                                            onShift={d => shiftAnchor(decade, kind, index, d)}
                                                            onReset={() => resetAnchor(decade, kind, index)}
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex items-baseline gap-2">
                                                    <span aria-hidden className="font-mono text-[0.7rem] text-stone-line-strong">
                                                        ↳
                                                    </span>
                                                    <div>
                                                        <MonthStepper
                                                            month={month}
                                                            defaultMonth={defaultMonth}
                                                            size="md"
                                                            onShift={d => shiftAnchor(decade, kind, index, d)}
                                                            onReset={() => resetAnchor(decade, kind, index)}
                                                        />
                                                        {/* the event and the month it happened — fixed,
                                                            whatever month is being read above it */}
                                                        <p className="mt-1.5 max-w-[11rem] font-sans text-[0.55rem] uppercase leading-relaxed tracking-[0.14em] text-platinum-dim">
                                                            {label}
                                                            <span className="ml-1.5 font-mono tracking-[0.1em] text-bronze-dim">
                                                                {fmtMonth(defaultMonth)}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </td>

                                        {SERIES.map((s, i) => (
                                            <Cell
                                                key={s.key}
                                                series={s}
                                                row={row}
                                                threshold={thresholdFor(s.key)}
                                                divider={isNewGroup(i)}
                                                muted={showInflections && opensDecade}
                                                onHover={setHover}
                                            />
                                        ))}

                                        {/* where capital is being pulled */}
                                        <td className={`${opensDecade ? 'pt-5' : 'pt-2'} ${lastOfDecade ? 'pb-5' : 'pb-2'} border-l border-stone-line pl-8 align-top`}>
                                            {pull ? (
                                                <div style={{ opacity: showInflections && opensDecade ? 0.62 : 1 }}>
                                                    <p className="max-w-[13rem] font-sans text-[0.68rem] uppercase leading-snug tracking-[0.16em] text-bronze-bright">
                                                        {pull.verdict}
                                                    </p>
                                                    {pull.offChart && (
                                                        <p
                                                            title="Stated, not derived — the US series on this page cannot show this move."
                                                            className="mt-1 font-mono text-[0.52rem] uppercase tracking-[0.16em] text-bronze-dim"
                                                        >
                                                            ◇ Off-chart
                                                        </p>
                                                    )}
                                                    <p className="mt-1 max-w-[13rem] font-sans text-[0.56rem] leading-relaxed tracking-[0.04em] text-platinum-dim">
                                                        {pull.phrase}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="font-mono text-[0.68rem] text-platinum-dim">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── notes ───────────────────────────────────────────────────────── */}
            {!loading && !error && (
                <div className="mt-10 border-t border-stone-line pt-5">
                    <button
                        type="button"
                        onClick={() => setNotesOpen(o => !o)}
                        aria-expanded={notesOpen}
                        className="flex items-center gap-3 font-sans text-[0.7rem] uppercase tracking-[0.22em] text-platinum-dim transition-colors duration-300 ease-mechanical hover:text-bronze-bright"
                    >
                        <span
                            aria-hidden
                            className={`font-mono text-[0.8rem] leading-none transition-transform duration-500 ease-mechanical ${notesOpen ? 'rotate-45' : ''}`}
                        >
                            +
                        </span>
                        Notes
                    </button>

                    {notesOpen && (
                        <div className="mt-7 grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-2">
                            <NoteSection title="Reading the table" items={READING_NOTES} />
                            <NoteSection title="Where capital is pulled" items={PULL_NOTES} sub={PULL_RULES} />
                        </div>
                    )}
                </div>
            )}

            {/* ── legend — series and their current ranges ────────────────────── */}
            <div className="mt-10 grid grid-cols-1 gap-x-12 gap-y-5 border-t border-stone-line pt-8 sm:grid-cols-2 lg:grid-cols-3">
                {SERIES.map(s => {
                    const t = thresholdFor(s.key);
                    return (
                        <div key={s.key}>
                            <p className={`font-sans text-[0.6rem] uppercase tracking-[0.16em] ${t ? 'text-platinum' : 'text-platinum-dim'}`}>
                                {s.shortLabel} — {s.label}
                            </p>
                            <p className="mt-0.5 font-sans text-[0.56rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                                {s.description}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                                {t ? BANDS.map(b => (
                                    <span key={b} className="flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 shrink-0" style={{ background: BAND_COLOR[b] }} />
                                        <span
                                            className="font-mono text-[0.58rem] tracking-[0.06em] tabular-nums"
                                            style={{ color: BAND_COLOR[b] }}
                                        >
                                            {bandRange(t, b)}
                                        </span>
                                    </span>
                                )) : (
                                    <span className="font-sans text-[0.56rem] uppercase tracking-[0.16em] text-platinum-dim">
                                        Reference only
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <p className="mt-8 font-sans text-[0.55rem] uppercase tracking-[0.24em] text-platinum-dim">
                Monthly data · FRED · Yahoo Finance
            </p>

            {hover && <ReadingTooltip hover={hover} threshold={thresholdFor(hover.series.key)} />}

            {modalOpen && (
                <RangesModal
                    thresholds={thresholds}
                    onApply={setThresholds}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div>
    );
}

// ─── notes ────────────────────────────────────────────────────────────────────

const READING_NOTES = [
    'Each decade is read twice: at its opening, and again at the month the paradigm turned. Several turns land a year or two in, and the 2010s turn lands before the decade opens at all.',
    'Step any reading month with − and +. ↺ returns one row to its default; Reset all months returns every row. Each inflection keeps its event and the month it happened beneath the month being read.',
    'Under each reading is its percentile — where that month sits in the series\u2019 own history up to that point, 0 to 100, from the same source as the percentile view of the macro chart. A series reads 0 in its opening months because nothing has come before it.',
    'Nominal levels are reference only. They carry no grade, since a yield is neither good nor bad until it is set against inflation and against what equities yield.',
    'Months before a series began read as nothing — the 10-Year, and everything derived from it, begin in January 1962.',
];

const PULL_NOTES = [
    'Read off the graded measures at that month, against the ranges you set. The first test that matches decides it:',
];

const PULL_RULES: [string, string][] = [
    ['Commodities', 'inflation in its bad band with no good real rate to escape into'],
    ['Equity overvaluation', 'both earnings yields below zero, or a real earnings yield of 2% or less'],
    ['High growth equities', 'both earnings yields within a point of zero — a market accepting no current yield is buying growth'],
    ['Equities over bonds', 'a wide earnings yield premium, even though equities pay thinly outright'],
    ['Bonds', 'a real rate in its good band, 2% by default, paying more than equities'],
    ['Equities', 'a real earnings yield above 2%'],
];

function NoteSection({
    title,
    items,
    sub,
}: {
    title: string;
    items: string[];
    sub?: [string, string][];
}) {
    return (
        <div>
            <p className="mb-4 font-sans text-[0.6rem] uppercase tracking-[0.24em] text-bronze">
                {title}
            </p>
            <ul className="flex flex-col gap-3">
                {items.map(item => (
                    <li key={item} className="flex gap-3">
                        <span aria-hidden className="mt-[0.45rem] h-px w-2.5 shrink-0 bg-stone-line-strong" />
                        <span className="font-sans text-[0.72rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                            {item}
                        </span>
                    </li>
                ))}
            </ul>

            {sub && (
                <ul className="mt-3 flex flex-col gap-2 pl-5">
                    {sub.map(([name, when]) => (
                        <li key={name} className="flex flex-wrap items-baseline gap-x-2">
                            <span className="font-sans text-[0.66rem] uppercase tracking-[0.14em] text-platinum">
                                {name}
                            </span>
                            <span className="font-sans text-[0.72rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                                — {when}
                            </span>
                        </li>
                    ))}
                    <li className="mt-1 flex gap-3">
                        <span aria-hidden className="mt-[0.45rem] h-px w-2.5 shrink-0 bg-stone-line-strong" />
                        <span className="font-sans text-[0.72rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                            An inflection may instead carry a stated call, marked ◇ off-chart, where the
                            move is one these six US series cannot show — the readings beneath it are
                            still the domestic ones that drove capital there.
                        </span>
                    </li>
                </ul>
            )}
        </div>
    );
}

/** True when the series at this index opens a new group — where the rule goes. */
function isNewGroup(i: number) {
    return i > 0 && SERIES[i].group !== SERIES[i - 1].group;
}
