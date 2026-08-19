'use client';

import { useMemo, useState } from 'react';
import {
    ANNUAL_DATA,
    nominalPerCapita,
    pppPerCapita,
    ratioValue,
    type AnnualEntry,
} from './annual-data';
import { formatValue } from './GDPBarChart';

// ─── constants ────────────────────────────────────────────────────────────────

export const RATIO_COLOR = '#4dd9c0';

const CHART_H = 320;
const PAD_TOP = 24;
const PAD_BOTTOM = 36;
const PAD_LEFT = 72;
const PAD_RIGHT = 48;   // wider right to fit ratio labels
const CHART_W = 900;  // viewBox width; scales via preserveAspectRatio

export const SERIES = [
    { key: 'nominal' as const, label: 'Nominal', color: 'var(--color-bronze)' },
    { key: 'ppp' as const, label: 'PPP', color: 'var(--color-platinum)' },
    { key: 'ratio' as const, label: 'Ratio', color: RATIO_COLOR },
] as const;

export type SeriesKey = (typeof SERIES)[number]['key'];

// ─── types ────────────────────────────────────────────────────────────────────

interface DataPoint {
    year: number;
    nominal: number;
    ppp: number;
    ratio: number;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function buildSeries(country: string, perCapita: boolean): DataPoint[] {
    return ANNUAL_DATA.flatMap((yd) => {
        const e: AnnualEntry | undefined = yd.entries.find((x) => x.country === country);
        if (!e) return [];
        return [{
            year: yd.year,
            nominal: perCapita ? nominalPerCapita(e) : e.nominalBn,
            ppp: perCapita ? pppPerCapita(e) : e.pppBn,
            ratio: ratioValue(e),
        }];
    });
}

function toY(v: number, min: number, max: number): number {
    if (max === min) return PAD_TOP + (CHART_H - PAD_TOP - PAD_BOTTOM) / 2;
    return PAD_TOP + (1 - (v - min) / (max - min)) * (CHART_H - PAD_TOP - PAD_BOTTOM);
}

function niceTickValues(min: number, max: number, count = 5): number[] {
    const range = max - min;
    if (range === 0) return [min];
    const raw = range / (count - 1);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = ([1, 2, 2.5, 5, 10].find((f) => f * mag >= raw) ?? 10) * mag;
    const niceMin = Math.floor(min / step) * step;
    const ticks: number[] = [];
    for (let t = niceMin; t <= max + step * 0.01; t += step) {
        ticks.push(parseFloat(t.toPrecision(10)));
    }
    return ticks;
}

function gdpLabel(t: number, perCapita: boolean): string {
    if (perCapita) return t >= 100_000 ? `$${(t / 1000).toFixed(0)}k` : `$${(t / 1000).toFixed(1)}k`;
    return t >= 1000 ? `$${(t / 1000).toFixed(1)}T` : `$${t.toFixed(0)}B`;
}

// ─── component ────────────────────────────────────────────────────────────────

interface GDPLineChartProps {
    country: string;
    perCapita: boolean;
    visible: Record<SeriesKey, boolean>;
    onToggle: (key: SeriesKey) => void;
}

export function GDPLineChart({ country, perCapita, visible, onToggle }: GDPLineChartProps) {
    const [hoverYear, setHoverYear] = useState<number | null>(null);

    const data = useMemo(
        () => buildSeries(country, perCapita),
        [country, perCapita],
    );

    const xStep = data.length > 1
        ? (CHART_W - PAD_LEFT - PAD_RIGHT) / (data.length - 1)
        : 0;

    // ── scales ────────────────────────────────────────────────────────────────
    const { minV, maxV, minR, maxR } = useMemo(() => {
        const nomVals = visible.nominal ? data.map((d) => d.nominal).filter(Boolean) : [];
        const pppVals = visible.ppp ? data.map((d) => d.ppp).filter(Boolean) : [];
        const ratVals = visible.ratio ? data.map((d) => d.ratio).filter(Boolean) : [];
        const gdpVals = [...nomVals, ...pppVals];
        const actualMaxR = ratVals.length ? Math.max(...ratVals) : 3;
        return {
            minV: gdpVals.length ? Math.min(...gdpVals) : 0,
            maxV: gdpVals.length ? Math.max(...gdpVals) : 1,
            minR: 0,                              // always floor at 0×
            maxR: Math.max(actualMaxR, 3),        // minimum ceiling of 3×
        };
    }, [data, visible]);

    const gdpTicks = useMemo(() => niceTickValues(minV, maxV), [minV, maxV]);

    // Ratio right-axis labels are pinned to the SAME Y positions as GDP ticks
    // so grid lines are shared. We back-calculate what ratio value sits at each
    // GDP tick's fractional position within [minR, maxR].
    const ratioAtGdpTicks = useMemo(() => {
        if (!visible.ratio) return [];
        const n = gdpTicks.length;
        return gdpTicks.map((_, i) => {
            // i=0 is the lowest tick (minV → minR), i=n-1 is the highest (maxV → maxR)
            const frac = n > 1 ? i / (n - 1) : 0.5;
            return minR + frac * (maxR - minR);
        });
    }, [gdpTicks, minR, maxR, visible.ratio]);

    // ── hover ─────────────────────────────────────────────────────────────────
    const hoverIdx = hoverYear != null ? data.findIndex((d) => d.year === hoverYear) : -1;
    const hoverX = hoverIdx >= 0 ? PAD_LEFT + hoverIdx * xStep : null;
    const hoverPoint = hoverIdx >= 0 ? data[hoverIdx] : null;

    // ── polyline point builders ───────────────────────────────────────────────
    const nominalPts = useMemo(
        () => data.map((d, i) => `${PAD_LEFT + i * xStep},${toY(d.nominal, minV, maxV)}`).join(' '),
        [data, xStep, minV, maxV],
    );

    const pppPts = useMemo(
        () => data
            .map((d, i) => d.ppp > 0 ? `${PAD_LEFT + i * xStep},${toY(d.ppp, minV, maxV)}` : null)
            .filter(Boolean).join(' '),
        [data, xStep, minV, maxV],
    );

    const ratioPts = useMemo(
        () => data
            .map((d, i) => d.ratio > 0 ? `${PAD_LEFT + i * xStep},${toY(d.ratio, minR, maxR)}` : null)
            .filter(Boolean).join(' '),
        [data, xStep, minR, maxR],
    );

    return (
        <div className="flex flex-col gap-0">

            {/* ── series toggles ──────────────────────────────────────────── */}
            <div className="mb-4 flex items-center justify-end gap-5">
                {SERIES.map(({ key, label, color }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onToggle(key)}
                        className="flex items-center gap-2 transition-opacity duration-200"
                        style={{ opacity: visible[key] ? 1 : 0.3 }}
                    >
                        <span
                            className="inline-block w-5 shrink-0"
                            style={{
                                background: color,
                                height: key === 'nominal' ? 2 : 1.5,
                            }}
                        />
                        <span className="font-sans text-[0.65rem] uppercase tracking-[0.18em] text-platinum-dim">
                            {label}
                        </span>
                    </button>
                ))}
            </div>

            {/* ── hover tooltip ───────────────────────────────────────────── */}
            <div className="mb-3 h-6 flex items-baseline gap-8">
                {hoverPoint ? (
                    <>
                        <span className="font-mono text-xs tracking-[0.2em] text-stone-line-strong">
                            {hoverPoint.year}
                        </span>
                        {visible.nominal && (
                            <span className="font-mono text-sm" style={{ color: 'var(--color-bronze)' }}>
                                {formatValue(hoverPoint.nominal, 'nominal', perCapita)}
                                <span className="ml-1.5 font-sans text-[0.6rem] uppercase tracking-[0.14em] text-platinum-dim">nominal</span>
                            </span>
                        )}
                        {visible.ppp && hoverPoint.ppp > 0 && (
                            <span className="font-mono text-sm" style={{ color: 'var(--color-platinum)' }}>
                                {formatValue(hoverPoint.ppp, 'ppp', perCapita)}
                                <span className="ml-1.5 font-sans text-[0.6rem] uppercase tracking-[0.14em] text-platinum-dim">ppp</span>
                            </span>
                        )}
                        {visible.ratio && hoverPoint.ratio > 0 && (
                            <span className="font-mono text-sm" style={{ color: RATIO_COLOR }}>
                                {formatValue(hoverPoint.ratio, 'ratio', false)}
                                <span className="ml-1.5 font-sans text-[0.6rem] uppercase tracking-[0.14em] text-platinum-dim">ratio</span>
                            </span>
                        )}
                    </>
                ) : (
                    <span className="font-sans text-[0.6rem] uppercase tracking-[0.18em] text-stone-line-strong">
                        hover to inspect
                    </span>
                )}
            </div>

            {/* ── SVG ─────────────────────────────────────────────────────── */}
            <div className="relative w-full">
                <svg
                    viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                    preserveAspectRatio="none"
                    className="w-full"
                    style={{ height: CHART_H, display: 'block' }}
                    onMouseLeave={() => setHoverYear(null)}
                >
                    {/* grid — GDP (single shared set of lines) */}
                    {gdpTicks.map((t) => {
                        const y = toY(t, minV, maxV);
                        if (y > CHART_H - PAD_BOTTOM - 8) return null; // skip if too close to bottom
                        return (
                            <line
                                key={`g-${t}`}
                                x1={PAD_LEFT} y1={y}
                                x2={CHART_W - PAD_RIGHT} y2={y}
                                stroke="var(--color-stone-line)"
                                strokeWidth={0.5}
                            />
                        );
                    })}

                    {/* Y labels — GDP (left) */}
                    {gdpTicks.map((t) => {
                        const y = toY(t, minV, maxV);
                        if (y > CHART_H - PAD_BOTTOM - 8) return null; // too close to bottom
                        return (
                            <text
                                key={`gl-${t}`}
                                x={PAD_LEFT - 8} y={y + 4}
                                textAnchor="end" fontSize={9}
                                fontFamily="var(--font-mono, monospace)"
                                fill="var(--color-stone-line-strong)"
                                letterSpacing="0.05em"
                            >
                                {gdpLabel(t, perCapita)}
                            </text>
                        );
                    })}

                    {/* Y labels — ratio (right), aligned to the same Y as GDP ticks */}
                    {visible.ratio && ratioAtGdpTicks.map((rv, i) => {
                        const y = toY(gdpTicks[i], minV, maxV);
                        if (y > CHART_H - PAD_BOTTOM - 8) return null;
                        return (
                            <text
                                key={`rl-${i}`}
                                x={CHART_W - PAD_RIGHT + 8} y={y + 4}
                                textAnchor="start" fontSize={9}
                                fontFamily="var(--font-mono, monospace)"
                                fill={RATIO_COLOR} fillOpacity={0.65}
                                letterSpacing="0.05em"
                            >
                                {rv.toFixed(2)}×
                            </text>
                        );
                    })}

                    {/* X labels — years */}
                    {data
                        .filter((d) => d.year % 5 === 0)
                        .map((d) => {
                            const i = data.indexOf(d);
                            return (
                                <text
                                    key={`yl-${d.year}`}
                                    x={PAD_LEFT + i * xStep} y={CHART_H - 6}
                                    textAnchor="middle" fontSize={9}
                                    fontFamily="var(--font-mono, monospace)"
                                    fill="var(--color-stone-line-strong)"
                                    letterSpacing="0.06em"
                                >
                                    {d.year}
                                </text>
                            );
                        })}

                    {/* nominal line */}
                    {visible.nominal && nominalPts && (
                        <polyline
                            points={nominalPts}
                            fill="none" stroke="var(--color-bronze)"
                            strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
                        />
                    )}

                    {/* PPP line */}
                    {visible.ppp && pppPts && (
                        <polyline
                            points={pppPts}
                            fill="none" stroke="var(--color-platinum)"
                            strokeWidth={1.2} strokeLinejoin="round" strokeLinecap="round"
                            opacity={0.75}
                        />
                    )}

                    {/* ratio line */}
                    {visible.ratio && ratioPts && (
                        <polyline
                            points={ratioPts}
                            fill="none" stroke={RATIO_COLOR}
                            strokeWidth={1.5} strokeDasharray="4 3"
                            strokeLinejoin="round" strokeLinecap="round"
                        />
                    )}

                    {/* crosshair */}
                    {hoverX != null && (
                        <line
                            x1={hoverX} y1={PAD_TOP}
                            x2={hoverX} y2={CHART_H - PAD_BOTTOM}
                            stroke="var(--color-platinum-dim)"
                            strokeWidth={0.8} strokeDasharray="2 3"
                        />
                    )}

                    {/* hover dots */}
                    {hoverPoint && hoverX != null && (
                        <>
                            {visible.nominal && (
                                <circle cx={hoverX} cy={toY(hoverPoint.nominal, minV, maxV)} r={3} fill="var(--color-bronze)" />
                            )}
                            {visible.ppp && hoverPoint.ppp > 0 && (
                                <circle cx={hoverX} cy={toY(hoverPoint.ppp, minV, maxV)} r={2.5} fill="var(--color-platinum)" />
                            )}
                            {visible.ratio && hoverPoint.ratio > 0 && (
                                <circle cx={hoverX} cy={toY(hoverPoint.ratio, minR, maxR)} r={2.5} fill={RATIO_COLOR} />
                            )}
                        </>
                    )}

                    {/* hover sensor strips */}
                    {data.map((d, i) => {
                        const x = PAD_LEFT + i * xStep;
                        const w = xStep || 20;
                        return (
                            <rect
                                key={`hs-${d.year}`}
                                x={x - w / 2} y={PAD_TOP}
                                width={w} height={CHART_H - PAD_TOP - PAD_BOTTOM}
                                fill="transparent"
                                onMouseEnter={() => setHoverYear(d.year)}
                            />
                        );
                    })}
                </svg>
            </div>

            {/* ── axis legend ─────────────────────────────────────────────── */}
            <div
                className="mt-1 flex justify-between"
                style={{ paddingLeft: PAD_LEFT, paddingRight: PAD_RIGHT }}
            >
                <span className="font-sans text-[0.58rem] uppercase tracking-[0.18em] text-stone-line-strong">
                    {perCapita ? 'USD per person' : 'USD billions'} · left axis
                </span>
                {visible.ratio && (
                    <span className="font-sans text-[0.58rem] uppercase tracking-[0.18em]" style={{ color: RATIO_COLOR, opacity: 0.65 }}>
                        ratio · right axis
                    </span>
                )}
            </div>
        </div>
    );
}
