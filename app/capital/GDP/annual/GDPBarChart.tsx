'use client';

import { useEffect, useRef } from 'react';
import type { AnnualEntry } from './annual-data';

// ─── shared constants ─────────────────────────────────────────────────────────

export const BAR_HEIGHT = 33;
export const BAR_GAP = 7;
export const LABEL_W = 148;
export const VALUE_W = 88;
export const TRANSITION_MS = 500;

// ─── types ────────────────────────────────────────────────────────────────────

export type GDPMode = 'nominal' | 'ppp' | 'ratio';

// ─── country colours ──────────────────────────────────────────────────────────

const COUNTRY_COLORS: Record<string, string> = {
    'United States':  '#e8a838',
    'China':          '#e05252',
    'Japan':          '#4a9fd4',
    'Germany':        '#6dbf5e',
    'United Kingdom': '#b87fc4',
    'France':         '#e8c44a',
    'India':          '#f07840',
    'Italy':          '#3dbfb0',
    'Canada':         '#d4a040',
    'South Korea':    '#5ba8e0',
    'Brazil':         '#4abf88',
    'Russia':         '#c46060',
    'Australia':      '#8fc870',
    'Spain':          '#e08858',
    'Mexico':         '#b8c840',
    'Netherlands':    '#60b8c8',
    'Indonesia':      '#f0b040',
    'Turkey':         '#e87060',
    'Saudi Arabia':   '#d4c050',
    'Switzerland':    '#a070d0',
    'Argentina':      '#70c8b8',
    'Sweden':         '#80b8e0',
    'Poland':         '#d87840',
    'Nigeria':        '#60c870',
    'Iran':           '#d4a060',
};

export function countryColor(name: string): string {
    return COUNTRY_COLORS[name] ?? '#96a1a8';
}

// ─── value formatting ─────────────────────────────────────────────────────────

export function formatValue(v: number, mode: GDPMode, perCapita: boolean): string {
    if (mode === 'ratio') return `${v.toFixed(2)}×`;
    if (perCapita) {
        // v is in raw USD
        if (v >= 100_000) return `$${(v / 1000).toFixed(0)}k`;
        if (v >= 10_000)  return `$${(v / 1000).toFixed(1)}k`;
        return `$${(v / 1000).toFixed(2)}k`;
    }
    if (v >= 10_000) return `$${(v / 1000).toFixed(1)}T`;
    if (v >= 1_000)  return `$${(v / 1000).toFixed(2)}T`;
    return `$${v.toFixed(0)}B`;
}

// ─── display-value extractor ──────────────────────────────────────────────────

export function entryDisplayValue(
    e: AnnualEntry,
    mode: GDPMode,
    perCapita: boolean,
): number {
    if (mode === 'ratio') {
        return e.nominalBn > 0 ? e.pppBn / e.nominalBn : 0;
    }
    const base = mode === 'nominal' ? e.nominalBn : e.pppBn;
    if (!perCapita) return base;
    if (!e.population) return 0;
    return (base * 1e9) / e.population;
}

// ─── Bar ──────────────────────────────────────────────────────────────────────

export interface BarRow {
    country: string;
    displayValue: number;
    rank: number;
}

interface BarProps {
    rank: number;
    country: string;
    displayValue: number;
    maxValue: number;
    prevY: number | null;
    mode: GDPMode;
    perCapita: boolean;
    dim?: boolean;
}

export function Bar({ rank, country, displayValue, maxValue, prevY, mode, perCapita, dim }: BarProps) {
    const ref = useRef<HTMLDivElement>(null);
    const targetY = rank * (BAR_HEIGHT + BAR_GAP);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const from = prevY ?? targetY;
        el.style.transition = 'none';
        el.style.transform = `translateY(${from}px)`;
        void el.offsetHeight;
        el.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(0.22,0.61,0.36,1), opacity ${TRANSITION_MS / 2}ms ease`;
        el.style.opacity = dim ? '0.45' : '1';
        el.style.transform = `translateY(${targetY}px)`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetY, dim]);

    const pct = maxValue > 0 ? (displayValue / maxValue) * 100 : 0;
    const color = countryColor(country);

    return (
        <div
            ref={ref}
            className="absolute left-0 right-0"
            style={{
                height: BAR_HEIGHT,
                opacity: 0,
                transform: `translateY(${prevY ?? targetY}px)`,
                willChange: 'transform',
            }}
        >
            {/* label */}
            <div
                className="absolute left-0 flex items-center justify-end pr-4 font-sans text-[0.7rem] uppercase tracking-[0.13em]"
                style={{ width: LABEL_W, height: BAR_HEIGHT, color: 'var(--color-platinum)' }}
            >
                {country}
            </div>

            {/* track */}
            <div
                className="absolute top-1/2 -translate-y-1/2 overflow-hidden"
                style={{
                    left: LABEL_W,
                    right: VALUE_W,
                    height: BAR_HEIGHT - 10,
                    background: 'var(--color-stone-line)',
                }}
            >
                <div
                    className="absolute inset-y-0 left-0"
                    style={{
                        width: `${pct}%`,
                        background: color,
                        opacity: 0.9,
                        transition: `width ${TRANSITION_MS}ms cubic-bezier(0.22,0.61,0.36,1)`,
                    }}
                />
                <div
                    className="absolute inset-y-0 left-0 flex items-center pl-2.5 font-mono text-[0.62rem] tracking-[0.1em]"
                    style={{ color: 'var(--color-charcoal)', fontWeight: 700, opacity: 0.9 }}
                >
                    #{rank + 1}
                </div>
            </div>

            {/* value */}
            <div
                className="absolute right-0 flex items-center font-mono text-[0.7rem] tracking-[0.08em]"
                style={{
                    width: VALUE_W,
                    height: BAR_HEIGHT,
                    color,
                    justifyContent: 'flex-start',
                    paddingLeft: 10,
                }}
            >
                {formatValue(displayValue, mode, perCapita)}
            </div>
        </div>
    );
}

// ─── BarChart ─────────────────────────────────────────────────────────────────

interface BarChartProps {
    bars: BarRow[];
    maxValue: number;
    mode: GDPMode;
    perCapita: boolean;
    prevPositions: React.MutableRefObject<Map<string, number>>;
    dim?: boolean;
}

export function BarChart({ bars, maxValue, mode, perCapita, prevPositions, dim }: BarChartProps) {
    const prevMap = new Map(prevPositions.current);
    const chartH = bars.length > 0 ? bars.length * (BAR_HEIGHT + BAR_GAP) - BAR_GAP : 0;

    useEffect(() => {
        const next = new Map<string, number>();
        bars.forEach((b) => next.set(b.country, b.rank * (BAR_HEIGHT + BAR_GAP)));
        prevPositions.current = next;
    });

    return (
        <div className="relative w-full" style={{ height: chartH }}>
            {bars.map((bar) => (
                <Bar
                    key={bar.country}
                    rank={bar.rank}
                    country={bar.country}
                    displayValue={bar.displayValue}
                    maxValue={maxValue}
                    prevY={prevMap.get(bar.country) ?? null}
                    mode={mode}
                    perCapita={perCapita}
                    dim={dim}
                />
            ))}
        </div>
    );
}
