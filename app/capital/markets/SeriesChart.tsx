'use client';

import { useId } from 'react';

import ChartFrame from '../chart/ChartFrame';
import {
    PAD,
    clamp,
    axisIntervals,
    buildSegments,
    linePath,
    areaPath,
} from '../chart/series';
import { logScale, linearScale, formatCompact } from './scale';
export interface SeriesPoint {
    month: string;
    value: number | null;
}

interface Props {
    data: SeriesPoint[];
    /** Line colour — the identity of whatever is plotted. */
    color: string;
    /** Caption above the y axis, unit included. */
    unit: string;
    /** Chosen by the caller from the whole series rather than the window on
     *  screen, so moving between periods never flips the axis underfoot. */
    scaleKind: 'log' | 'linear';
    /** Accessible name for the plot. */
    label: string;
    width: number;
    height: number;
    hovered: number | null;
    onHover: (idx: number | null) => void;
    showGrid: boolean;
}

// ─── Single-series line chart ─────────────────────────────────────────────────
// The carved plot every series on this page is drawn in: one line, a wash
// beneath it, a crosshair. Shared by the equity and currency panels — it knows
// nothing about either, only about points, a colour and a scale.

export default function SeriesChart({
    data, color, unit, scaleKind, label, width, height, hovered, onHover, showGrid,
}: Props) {
    // Two of these sit on the page at once; a shared gradient id would leak one
    // panel's colour into the other. Claimed before any early return.
    const washId = `wash-${useId()}`;

    const plotW = width - PAD.left - PAD.right;
    const plotH = height - PAD.top - PAD.bottom;

    if (plotW <= 0 || plotH <= 0 || data.length === 0) return null;

    let min = Infinity, max = -Infinity;
    for (const row of data) {
        if (row.value == null) continue;
        if (row.value < min) min = row.value;
        if (row.value > max) max = row.value;
    }
    if (!isFinite(min)) { min = 0; max = 1; }

    // A log axis needs strictly positive readings whatever the caller asked for.
    const useLog = scaleKind === 'log' && min > 0;
    const scale = useLog ? logScale(min, max) : linearScale(min, max);

    const xOf = (i: number) =>
        data.length < 2 ? PAD.left + plotW / 2 : PAD.left + (i / (data.length - 1)) * plotW;
    const yOf = (v: number) => PAD.top + plotH - clamp(scale.norm(v), 0, 1) * plotH;

    const segments = buildSegments(data, row => row.value, xOf, yOf);

    // The wash falls to zero where the axis crosses it, to the floor otherwise.
    const crossesZero = scale.lo < 0 && scale.hi > 0;
    const baseline = crossesZero ? yOf(0) : PAD.top + plotH;

    const { labelEvery, ruleEvery } = axisIntervals(data.map(r => r.month));
    const hx = hovered != null ? xOf(hovered) : null;
    const hoveredValue = hovered != null ? data[hovered]?.value ?? null : null;

    return (
        <svg
            width={width}
            height={height}
            className="block cursor-crosshair"
            onMouseMove={e => {
                const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                const mx = e.clientX - rect.left - PAD.left;
                onHover(clamp(Math.round((mx / plotW) * (data.length - 1)), 0, data.length - 1));
            }}
            onMouseLeave={() => onHover(null)}
            aria-label={label}
        >
            <defs>
                <linearGradient
                    id={washId}
                    x1="0" y1={PAD.top} x2="0" y2={baseline}
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0%" stopColor={color} stopOpacity={0.24} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
            </defs>

            <ChartFrame
                months={data.map(r => r.month)}
                yTicks={scale.ticks}
                xOf={xOf}
                yOf={yOf}
                plotW={plotW}
                plotH={plotH}
                height={height}
                showGrid={showGrid}
                unit={unit}
                formatTick={formatCompact}
                labelEvery={labelEvery}
                ruleEvery={ruleEvery}
            />

            {/* zero line — the divide between gain and loss */}
            {crossesZero && (
                <line
                    x1={PAD.left} y1={yOf(0)} x2={PAD.left + plotW} y2={yOf(0)}
                    stroke="#C0563F" strokeWidth={1} strokeOpacity={0.8}
                />
            )}

            <path d={areaPath(segments, baseline)} fill={`url(#${washId})`} stroke="none" />

            <path
                d={linePath(segments)}
                fill="none"
                stroke={color}
                strokeWidth={1.75}
                strokeLinejoin="round"
                strokeLinecap="round"
            />

            {/* hover crosshair */}
            {hx != null && (
                <>
                    <line
                        x1={hx} y1={PAD.top} x2={hx} y2={PAD.top + plotH}
                        stroke="var(--color-bronze)" strokeWidth={1} strokeOpacity={0.65}
                    />
                    {hoveredValue != null && (
                        <circle
                            cx={hx} cy={yOf(hoveredValue)} r={3.5}
                            fill={color}
                            stroke="var(--color-obsidian)" strokeWidth={1.5}
                        />
                    )}
                </>
            )}
        </svg>
    );
}
