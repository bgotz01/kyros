'use client';

import type { ReactNode } from 'react';
import { PAD, xAxisMarks } from './series';

// ─── Chart frame ──────────────────────────────────────────────────────────────
// The carved plot surface both charts sit on: raised ground, hairline grid,
// bronze decade rules, axis readouts. Anything drawn between the surface and
// the grid — shaded bands, for instance — goes in as children.

interface Props {
    /** Bucket column, 'YYYY-MM-DD', one per plotted point. */
    dates: string[];
    yTicks: number[];
    xOf: (i: number) => number;
    yOf: (v: number) => number;
    plotW: number;
    plotH: number;
    height: number;
    showGrid: boolean;
    /** Caption above the y axis — the unit the readings are in. */
    unit: string;
    formatTick?: (v: number) => string;
    /** Year spacing for the axis readouts and the vertical rules. */
    labelEvery?: number;
    ruleEvery?: number;
    children?: ReactNode;
}

export default function ChartFrame({
    dates,
    yTicks,
    xOf,
    yOf,
    plotW,
    plotH,
    height,
    showGrid,
    unit,
    formatTick = String,
    labelEvery = 5,
    ruleEvery = 10,
    children,
}: Props) {
    const { labels: xLabels, decadeLines } = xAxisMarks(dates, xOf, labelEvery, ruleEvery);

    return (
        <>
            {/* plot ground */}
            <rect
                x={PAD.left} y={PAD.top} width={plotW} height={plotH}
                fill="var(--color-obsidian)"
            />

            {children}

            {/* horizontal grid */}
            {showGrid && yTicks.map(tick => (
                <line
                    key={`g${tick}`}
                    x1={PAD.left} y1={yOf(tick)} x2={PAD.left + plotW} y2={yOf(tick)}
                    stroke="var(--color-stone-line-strong)"
                    strokeWidth={1}
                    strokeOpacity={0.55}
                />
            ))}

            {/* decade rules — bronze, kept faint */}
            {showGrid && decadeLines.map(x => (
                <line
                    key={x}
                    x1={x} y1={PAD.top} x2={x} y2={PAD.top + plotH}
                    stroke="var(--color-bronze-dim)"
                    strokeWidth={1}
                    strokeOpacity={0.6}
                />
            ))}

            {/* carved edge */}
            <rect
                x={PAD.left} y={PAD.top} width={plotW} height={plotH}
                fill="none"
                stroke="var(--color-stone-line-strong)"
                strokeWidth={1}
            />

            {/* y axis readout */}
            {yTicks.map(tick => (
                <text
                    key={`y${tick}`}
                    x={PAD.left - 9} y={yOf(tick)}
                    textAnchor="end" dominantBaseline="middle"
                    fontSize={9.5} fontFamily="var(--font-geist-mono), monospace"
                    fill="var(--color-marble-dim)" letterSpacing="0.05em"
                >
                    {formatTick(tick)}
                </text>
            ))}

            {/* unit caption */}
            <text
                x={PAD.left - 9} y={PAD.top - 10}
                textAnchor="end"
                fontSize={8.5} fontFamily="var(--font-geist-mono), monospace"
                fill="var(--color-bronze-bright)" letterSpacing="0.14em"
            >
                {unit}
            </text>

            {/* x axis readout */}
            {xLabels.map(({ i, label }) => (
                <text
                    key={label}
                    x={xOf(i)} y={height - 8}
                    textAnchor="middle" fontSize={9.5}
                    fontFamily="var(--font-geist-mono), monospace"
                    fill="var(--color-marble-dim)" letterSpacing="0.07em"
                >
                    {label}
                </text>
            ))}
        </>
    );
}
