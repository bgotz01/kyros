'use client';

import { useMemo, useState } from 'react';
import { CRUDE_PRICES } from '@/lib/commodities/oilPrices';
import { eventYear, type TimelineCycle, type TimelineEvent } from '@/lib/commodities/timeline';

// ─── Geometry ─────────────────────────────────────────────────────────────────
//
// The event strip and the price chart share one SVG, and therefore one x-scale.
// That is the whole point of the arrangement: a dot in the strip sits directly
// above the price it moved, and the two read as a single instrument rather than
// as a timeline that happens to be near a chart.

const W = 1000;
const H = 260;
const PAD = { top: 34, right: 16, bottom: 26, left: 42 };

const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

/** Price runs $0.61 to $111. Linear would flatten the first seventy years into
 *  the axis; a decade-per-gridline log scale keeps every era readable. */
const MIN = 0.5;
const MAX = 160;
const GRID = [1, 10, 100];

const FIRST = CRUDE_PRICES[0].year;
const LAST = CRUDE_PRICES[CRUDE_PRICES.length - 1].year;

/**
 * Coordinates are rounded before they reach the DOM.
 *
 * `Math.log10` is not required to be correctly rounded — its precision is
 * implementation-defined — so the server and the browser can disagree in the
 * last bit or two. React compares the serialized attribute, and a difference of
 * 1e-14 is still a hydration mismatch.
 */
function round(value: number) {
    return Math.round(value * 100) / 100;
}

function x(year: number) {
    return round(PAD.left + ((year - FIRST) / (LAST - FIRST)) * PLOT_W);
}

function y(usd: number) {
    const t =
        (Math.log10(MAX) - Math.log10(usd)) / (Math.log10(MAX) - Math.log10(MIN));
    return round(PAD.top + t * PLOT_H);
}

function fmtUsd(usd: number) {
    return usd >= 10 ? `$${usd.toFixed(0)}` : `$${usd.toFixed(2)}`;
}

interface Placed {
    event: TimelineEvent;
    year: number;
    usd: number;
    cycleId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * A log-scaled century of nominal crude, banded by cycle, with the record's
 * events marked on the line.
 *
 * The strip above is a separate element; this is the price on its own. Marks
 * here and nodes there select the same event, so the two stay in step without
 * being fused into one picture.
 */
export default function PriceRail({
    cycles,
    selected,
    openId,
    onSelectEvent,
}: {
    cycles: TimelineCycle[];
    /** Cycle id currently isolated, or `null` for the whole century. */
    selected?: string | null;
    /** The event whose detail is open below the chart. */
    openId?: string | null;
    onSelectEvent?: (id: string) => void;
}) {
    const [hoverYear, setHoverYear] = useState<number | null>(null);
    const [hoverId, setHoverId] = useState<string | null>(null);

    const line = useMemo(
        () =>
            CRUDE_PRICES.map(
                (p, i) => `${i === 0 ? 'M' : 'L'}${x(p.year)} ${y(p.usd)}`,
            ).join(' '),
        [],
    );

    const bands = useMemo(
        () =>
            cycles.map((cycle) => ({
                id: cycle.id,
                from: Math.max(cycle.startYear, FIRST),
                to: Math.min(cycle.endYear, LAST),
                startYear: cycle.startYear,
                chosen: selected === cycle.id,
                muted: !!selected && selected !== cycle.id,
            })),
        [cycles, selected],
    );

    /** Every event, placed on the shared axis. */
    const placed = useMemo<Placed[]>(
        () =>
            cycles.flatMap((cycle) =>
                cycle.events.flatMap((event) => {
                    const year = eventYear(event.year);
                    if (year === null || year < FIRST || year > LAST) return [];
                    const point = CRUDE_PRICES.find((p) => p.year === year);
                    if (!point) return [];
                    return [{ event, year, usd: point.usd, cycleId: cycle.id }];
                }),
            ),
        [cycles],
    );

    const activeId = hoverId ?? openId ?? null;
    const active = placed.find((p) => p.event.id === activeId) ?? null;

    // The readout follows the pointer, unless an event is being pointed at.
    const readoutYear = active?.year ?? hoverYear;
    const readout = readoutYear
        ? CRUDE_PRICES.find((p) => p.year === readoutYear) ?? null
        : null;

    function onMove(e: React.MouseEvent<SVGSVGElement>) {
        const rect = e.currentTarget.getBoundingClientRect();
        if (rect.width === 0) return;
        const px = ((e.clientX - rect.left) / rect.width) * W;
        const year = Math.round(FIRST + ((px - PAD.left) / PLOT_W) * (LAST - FIRST));
        setHoverYear(year >= FIRST && year <= LAST ? year : null);
    }

    return (
        <figure className="m-0">
            {/* ── readout ─────────────────────────────────────────────────── */}
            <figcaption className="mb-4 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
                <span className="font-mono text-[0.62rem] tracking-[0.14em] text-platinum-dim">
                    Nominal $/bbl · annual average · log scale
                </span>

                {/* Holds its row so the figure does not reflow on hover. */}
                <span className="min-h-[1rem] font-mono text-[0.65rem] tracking-[0.14em] text-platinum tabular-nums">
                    {readout ? (
                        <>
                            <span className="text-bronze">{readout.year}</span>
                            {'  '}
                            {fmtUsd(readout.usd)}
                            {active && (
                                <span className="ml-3 text-bronze-bright">
                                    {active.event.title}
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-platinum-dim">
                            Hover to read the price
                        </span>
                    )}
                </span>
            </figcaption>

            <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full"
                role="img"
                aria-label={`Nominal crude oil price per barrel, ${FIRST} to ${LAST}, log scale.`}
                onMouseMove={onMove}
                onMouseLeave={() => setHoverYear(null)}
            >
                {selected && (
                    <clipPath id="price-rail-window">
                        <rect
                            x={x(bands.find((b) => b.chosen)?.from ?? FIRST)}
                            y={PAD.top}
                            width={Math.max(
                                0,
                                x(bands.find((b) => b.chosen)?.to ?? FIRST) -
                                x(bands.find((b) => b.chosen)?.from ?? FIRST),
                            )}
                            height={PLOT_H}
                        />
                    </clipPath>
                )}

                {/* ── cycle bands, spanning strip and chart together ───────── */}
                {bands.map((band, i) => (
                    <g key={band.id}>
                        <rect
                            x={x(band.from)}
                            y={PAD.top}
                            width={Math.max(0, x(band.to) - x(band.from))}
                            height={PLOT_H}
                            fill={
                                band.chosen
                                    ? 'var(--color-charcoal)'
                                    : band.muted
                                        ? 'transparent'
                                        : i % 2 === 0
                                            ? 'var(--color-obsidian-800)'
                                            : 'transparent'
                            }
                        />
                        <text
                            x={x(band.from) + 6}
                            y={PAD.top - 12}
                            className="font-mono"
                            fontSize="9.5"
                            letterSpacing="1.2"
                            fill={
                                band.muted
                                    ? 'var(--color-stone-line-strong)'
                                    : band.chosen
                                        ? 'var(--color-bronze-bright)'
                                        : 'var(--color-platinum-dim)'
                            }
                        >
                            {band.startYear}
                        </text>
                    </g>
                ))}

                {/* ── price gridlines ─────────────────────────────────────── */}
                {GRID.map((usd) => (
                    <g key={usd}>
                        <line
                            x1={PAD.left}
                            x2={W - PAD.right}
                            y1={y(usd)}
                            y2={y(usd)}
                            stroke="var(--color-stone-line)"
                            strokeWidth="1"
                            strokeDasharray="2 4"
                        />
                        <text
                            x={PAD.left - 8}
                            y={y(usd) + 3}
                            textAnchor="end"
                            className="font-mono"
                            fontSize="10"
                            fill="var(--color-platinum-dim)"
                        >
                            {fmtUsd(usd)}
                        </text>
                    </g>
                ))}

                {/* ── the price ───────────────────────────────────────────── */}
                <path
                    d={line}
                    fill="none"
                    stroke="var(--color-bronze)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    opacity={selected ? 0.35 : 1}
                />
                {selected && (
                    <path
                        d={line}
                        fill="none"
                        stroke="var(--color-bronze-bright)"
                        strokeWidth="1.75"
                        strokeLinejoin="round"
                        clipPath="url(#price-rail-window)"
                    />
                )}

                {/* ── the events, on the price line ───────────────────────── */}
                {placed.map((p) => {
                    const isActive = activeId === p.event.id;
                    const muted = !!selected && selected !== p.cycleId;

                    return (
                        <g
                            key={p.event.id}
                            className="cursor-pointer"
                            onClick={() => onSelectEvent?.(p.event.id)}
                            onMouseEnter={() => setHoverId(p.event.id)}
                            onMouseLeave={() => setHoverId(null)}
                        >
                            {/* Generous invisible hit area — the dot is 6px wide. */}
                            <circle
                                cx={x(p.year)}
                                cy={y(p.usd)}
                                r="10"
                                fill="transparent"
                            />
                            <circle
                                cx={x(p.year)}
                                cy={y(p.usd)}
                                r={isActive ? 4.5 : 3}
                                fill={
                                    isActive
                                        ? 'var(--color-bronze-bright)'
                                        : 'var(--color-obsidian)'
                                }
                                stroke={
                                    isActive
                                        ? 'var(--color-bronze-bright)'
                                        : 'var(--color-platinum-dim)'
                                }
                                strokeWidth="1.5"
                                opacity={muted && !isActive ? 0.4 : 1}
                            >
                                <title>{`${p.event.year} — ${p.event.title}`}</title>
                            </circle>
                        </g>
                    );
                })}

                {/* ── pointer crosshair, when not on an event ─────────────── */}
                {readout && !active && (
                    <g className="pointer-events-none">
                        <line
                            x1={x(readout.year)}
                            x2={x(readout.year)}
                            y1={PAD.top}
                            y2={PAD.top + PLOT_H}
                            stroke="var(--color-bronze-dim)"
                            strokeWidth="1"
                        />
                        <circle
                            cx={x(readout.year)}
                            cy={y(readout.usd)}
                            r="3"
                            fill="var(--color-bronze-bright)"
                        />
                    </g>
                )}

                {/* ── decade ticks ────────────────────────────────────────── */}
                {Array.from({ length: 13 }, (_, i) => 1900 + i * 10)
                    .filter((yr) => yr >= FIRST && yr <= LAST)
                    .map((yr) => (
                        <text
                            key={yr}
                            x={x(yr)}
                            y={H - 8}
                            textAnchor="middle"
                            className="font-mono"
                            fontSize="10"
                            fill="var(--color-platinum-dim)"
                        >
                            {yr}
                        </text>
                    ))}
            </svg>
        </figure>
    );
}
