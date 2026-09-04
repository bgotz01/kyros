'use client';

import { Fragment, useEffect, useState, useMemo } from 'react';

import {
    germanDecadeReturn,
    germanDecadeYears,
    isGermanHistorical,
    GERMAN_RETURNS_FROM,
} from '@/lib/capital/germanStockHistory';
import {
    ukDecadeReturn,
    ukDecadeYears,
    isUkHistorical,
    UK_RETURNS_FROM,
} from '@/lib/capital/ukStockHistory';
import {
    ASSET_GROUPS,
    ALL_ROWS,
    DECADES,
    LAST_YEAR,
    POS,
    NEG,
    type AssetRow,
    type CellState,
    type TableData,
    type Scope,
    displayValue,
    findAsset,
    fmt,
    inScope,
} from './returnsData';

// ─── Fetching ─────────────────────────────────────────────────────────────────

async function fetchReturn(
    series: string,
    decade: { start: number; end: number },
): Promise<{ pct: number | null; years: number | null }> {
    const query =
        `index=${encodeURIComponent(series)}&metric=Value` +
        `&currency=local&resolution=monthly` +
        `&from=${decade.start}-01-01&to=${decade.end}-12-31`;

    const r = await fetch(`/api/markets?${query}`);
    const body = await r.json();
    if (!Array.isArray(body?.rows)) return { pct: null, years: null };

    const rows = (body.rows as { date: string; value: number | null }[])
        .filter(row => row.value != null) as { date: string; value: number }[];

    if (rows.length < 2) return { pct: null, years: null };

    const first = rows[0].value;
    const last = rows[rows.length - 1].value;
    if (first === 0) return { pct: null, years: null };

    const firstYear = parseInt(rows[0].date.slice(0, 4), 10);
    const lastYear = parseInt(rows[rows.length - 1].date.slice(0, 4), 10);

    return { pct: (last / first - 1) * 100, years: lastYear - firstYear || 1 };
}

// ─── Controls ─────────────────────────────────────────────────────────────────

function Toggle({
    on, onToggle, label, title,
}: {
    on: boolean; onToggle: () => void; label: string; title?: string;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            title={title}
            className={`flex items-center gap-2 border px-3 py-1.5 font-sans text-[0.55rem] uppercase tracking-[0.2em] transition-colors duration-300 ease-mechanical ${on
                ? 'border-bronze bg-charcoal text-bronze'
                : 'border-stone-line-strong bg-transparent text-platinum-dim hover:text-platinum'
                }`}
        >
            <span
                aria-hidden
                className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${on ? 'bg-bronze' : 'bg-stone-line-strong'
                    }`}
            />
            {label}
        </button>
    );
}

// ─── Cell ─────────────────────────────────────────────────────────────────────

function Cell({
    state, series, decadeStart, annualise, stripDiv, isWinner,
}: {
    state: CellState | undefined;
    series: string;
    decadeStart: number;
    annualise: boolean;
    stripDiv: boolean;
    isWinner: boolean;
}) {
    if (!state || state.status === 'loading') {
        return (
            <td className="animate-pulse px-4 py-3 text-right font-mono text-[0.72rem] tabular-nums text-platinum-dim">
                …
            </td>
        );
    }
    if (state.status === 'error') {
        return <td className="px-4 py-3 text-right font-mono text-[0.65rem] text-bronze-dim">err</td>;
    }

    const v = displayValue(state, series, decadeStart, annualise, stripDiv);
    const isDeHistorical = series === 'GDAXI' && isGermanHistorical(decadeStart);
    const isUkHist = series === 'FTSE' && isUkHistorical(decadeStart);
    const estimated = isDeHistorical || isUkHist;

    if (v == null) {
        return <td className="px-4 py-3 text-right font-mono text-[0.8rem] text-platinum-dim">—</td>;
    }

    return (
        <td className={`px-4 py-3 text-right transition-colors duration-300 ${isWinner ? 'bg-charcoal' : ''}`}>
            <span className="inline-flex items-baseline gap-1">
                <span
                    className="font-mono text-[0.78rem] tracking-[0.03em] tabular-nums"
                    style={{ color: v >= 0 ? POS : NEG }}
                >
                    {fmt(v, annualise)}
                </span>
                {estimated && (
                    <span className="font-mono text-[0.5rem] uppercase tracking-[0.1em] text-bronze-dim">est</span>
                )}
            </span>
        </td>
    );
}

function GroupHeading({ label, colSpan }: { label: string; colSpan: number }) {
    return (
        <tr>
            <td
                colSpan={colSpan}
                className="pb-1 pt-5 pl-0 font-sans text-[0.52rem] uppercase tracking-[0.28em] text-platinum-dim"
            >
                {label}
            </td>
        </tr>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
    data: TableData;
    onData: (updater: (prev: TableData) => TableData) => void;
    annualise: boolean;
    onAnnualise: (v: boolean) => void;
    stripDiv: boolean;
    onStripDiv: (v: boolean) => void;
    scope: Scope;
}

export default function DecadeReturnsTable({
    data, onData,
    annualise, onAnnualise,
    stripDiv, onStripDiv,
    scope,
}: Props) {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        // A remount drops whatever the previous run was still waiting on. The
        // requests are left to finish rather than aborted: the route handler
        // runs its query to completion either way, and an abort only trades
        // that saving for an AbortError to catch in every browser.
        let live = true;

        const seed: TableData = {};
        for (const row of ALL_ROWS) {
            seed[row.series] = {};
            for (const d of DECADES) {
                seed[row.series][d.label] = { status: 'loading' };
            }
        }
        onData(() => seed);
        setLoaded(false);

        let remaining = ALL_ROWS.length * DECADES.length;

        function tick() {
            remaining--;
            if (remaining === 0) setLoaded(true);
        }

        function resolve(series: string, decadeLabel: string, pct: number | null, years: number | null) {
            onData(prev => ({
                ...prev,
                [series]: { ...prev[series], [decadeLabel]: { status: 'done', pct, years } },
            }));
        }

        for (const row of ALL_ROWS) {
            const asset = findAsset(row.series);
            for (const decade of DECADES) {
                // DAX pre-1987: Stehle & Schmidt annual total return series.
                if (row.series === 'GDAXI' && isGermanHistorical(decade.start)) {
                    resolve(row.series, decade.label,
                        germanDecadeReturn(decade.start, decade.end),
                        germanDecadeYears(decade.start, decade.end));
                    tick();
                    continue;
                }
                // FTSE pre-1984: LSEG UK price index, monthly.
                if (row.series === 'FTSE' && isUkHistorical(decade.start)) {
                    resolve(row.series, decade.label,
                        ukDecadeReturn(decade.start, decade.end),
                        ukDecadeYears(decade.start, decade.end));
                    tick();
                    continue;
                }
                // No API coverage.
                if (decade.end < asset.from) {
                    resolve(row.series, decade.label, null, null);
                    tick();
                    continue;
                }
                (async () => {
                    try {
                        const result = await fetchReturn(row.series, decade);
                        if (!live) return;
                        resolve(row.series, decade.label, result.pct, result.years);
                    } catch {
                        if (!live) return;
                        onData(prev => ({
                            ...prev,
                            [row.series]: {
                                ...prev[row.series],
                                [decade.label]: { status: 'error' },
                            },
                        }));
                    } finally {
                        tick();
                    }
                })();
            }
        }

        return () => { live = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Winner per decade under the active scope — drives the cell highlight.
    const winnerByDecade = useMemo<Record<string, string | null>>(() => {
        const out: Record<string, string | null> = {};
        for (const decade of DECADES) {
            let bestSeries: string | null = null;
            let bestVal = -Infinity;
            for (const row of ALL_ROWS) {
                if (!inScope(row.series, scope)) continue;
                const v = displayValue(
                    data[row.series]?.[decade.label],
                    row.series, decade.start, annualise, stripDiv,
                );
                if (v != null && v > bestVal) {
                    bestVal = v;
                    bestSeries = row.series;
                }
            }
            out[decade.label] = bestSeries;
        }
        return out;
    }, [data, annualise, stripDiv, scope]);

    const colSpan = DECADES.length + 1;

    return (
        <div className="overflow-x-auto">

            {/* Controls — scope selector lives in the panel, these are table-specific */}
            <div className="mb-5 flex flex-wrap items-center gap-2">
                <Toggle
                    on={annualise}
                    onToggle={() => onAnnualise(!annualise)}
                    label="Annualised"
                    title="Show CAGR instead of total decade return"
                />
                <Toggle
                    on={stripDiv}
                    onToggle={() => onStripDiv(!stripDiv)}
                    label="−3% div (DE est)"
                    title="Strip an assumed 3% annual dividend yield from the pre-1987 German historical figures"
                />
            </div>

            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b-2 border-stone-line-strong">
                        <th className="pb-3 pl-0 pr-6 text-left font-sans text-[0.55rem] font-normal uppercase tracking-[0.22em] text-platinum-dim">
                            Asset
                        </th>
                        {DECADES.map(d => (
                            <th
                                key={d.label}
                                className="whitespace-nowrap pb-3 px-4 text-right font-mono text-[0.65rem] font-normal tracking-[0.14em] text-bronze"
                            >
                                {d.label}
                                {d.end === LAST_YEAR && (
                                    <span className="ml-1 font-sans text-[0.5rem] uppercase tracking-[0.12em] text-bronze-dim">›</span>
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {ASSET_GROUPS.map((group, gi) => (
                        <Fragment key={group.label}>
                            <GroupHeading label={group.label} colSpan={colSpan} />

                            {group.rows.map((row: AssetRow, ri: number) => {
                                const asset = findAsset(row.series);
                                const isLast =
                                    gi === ASSET_GROUPS.length - 1 &&
                                    ri === group.rows.length - 1;

                                return (
                                    <tr
                                        key={row.series}
                                        className={`group transition-colors duration-300 ease-mechanical hover:bg-charcoal ${isLast ? '' : 'border-b border-stone-line'
                                            }`}
                                    >
                                        <td className="py-3 pl-0 pr-6 align-middle">
                                            {row.country ? (
                                                <>
                                                    <span className="block font-sans text-[0.72rem] tracking-[0.06em] text-marble">
                                                        {row.country}
                                                    </span>
                                                    <span className="mt-0.5 block font-mono text-[0.58rem] tracking-[0.12em] text-platinum-dim">
                                                        {asset.shortLabel}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="block font-sans text-[0.72rem] tracking-[0.06em] text-marble">
                                                        {asset.label}
                                                    </span>
                                                    <span className="mt-0.5 block font-mono text-[0.58rem] tracking-[0.12em] text-platinum-dim">
                                                        {asset.shortLabel}
                                                    </span>
                                                </>
                                            )}
                                        </td>

                                        {DECADES.map(decade => (
                                            <Cell
                                                key={decade.label}
                                                state={data[row.series]?.[decade.label]}
                                                series={row.series}
                                                decadeStart={decade.start}
                                                annualise={annualise}
                                                stripDiv={stripDiv}
                                                isWinner={winnerByDecade[decade.label] === row.series}
                                            />
                                        ))}
                                    </tr>
                                );
                            })}
                        </Fragment>
                    ))}
                </tbody>
            </table>

            {loaded && (
                <div className="mt-4 flex flex-col gap-1.5">
                    <p className="font-sans text-[0.55rem] uppercase leading-relaxed tracking-[0.16em] text-platinum-dim">
                        {annualise
                            ? 'CAGR · annualised from first to last close of each decade'
                            : 'Total price return · first to last close of each decade'
                        } · local currency · Yahoo Finance
                    </p>
                    <p className="font-sans text-[0.55rem] uppercase leading-relaxed tracking-[0.16em] text-platinum-dim">
                        <span className="mr-1.5 text-bronze-dim">est</span>
                        DAX pre-1987 · Stehle &amp; Schmidt,{' '}
                        <span className="italic normal-case">Returns on German Stocks 1954–2013</span>
                        {' '}· total return (dividends reinvested) · 1950s partial ({GERMAN_RETURNS_FROM}–1959)
                        {stripDiv && <span className="ml-1 text-bronze">· −3% div/yr applied</span>}
                    </p>
                    <p className="font-sans text-[0.55rem] uppercase leading-relaxed tracking-[0.16em] text-platinum-dim">
                        <span className="mr-1.5 text-bronze-dim">est</span>
                        FTSE pre-1984 · LSEG UK equity price index · price return · from {UK_RETURNS_FROM}
                    </p>
                </div>
            )}
        </div>
    );
}
