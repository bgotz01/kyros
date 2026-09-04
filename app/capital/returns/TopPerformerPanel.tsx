'use client';

import { useMemo } from 'react';

import { isGermanHistorical } from '@/lib/capital/germanStockHistory';
import {
    ALL_ROWS,
    DECADES,
    LAST_YEAR,
    POS,
    NEG,
    type Scope,
    type TableData,
    displayValue,
    findAsset,
    fmt,
    inScope,
} from './returnsData';

// ─── Top Performer Panel ──────────────────────────────────────────────────────
// For each decade, selects the highest-returning asset within the active scope
// and renders it as a tile. Scope and display toggles are passed in from the
// page so the panel and table always reflect the same selection.

interface Winner {
    asset: ReturnType<typeof findAsset>;
    row: (typeof ALL_ROWS)[number];
    pct: number;
    estimated: boolean;
}

export default function TopPerformerPanel({
    data,
    annualise,
    stripDiv,
    scope,
}: {
    data: TableData;
    annualise: boolean;
    stripDiv: boolean;
    scope: Scope;
}) {
    const winners = useMemo<(Winner | null)[]>(() => {
        return DECADES.map(decade => {
            let best: Winner | null = null;
            for (const row of ALL_ROWS) {
                if (!inScope(row.series, scope)) continue;
                const v = displayValue(
                    data[row.series]?.[decade.label],
                    row.series, decade.start, annualise, stripDiv,
                );
                if (v == null) continue;
                if (best == null || v > best.pct) {
                    best = {
                        asset: findAsset(row.series),
                        row,
                        pct: v,
                        estimated: row.series === 'GDAXI' && isGermanHistorical(decade.start),
                    };
                }
            }
            return best;
        });
    }, [data, annualise, stripDiv, scope]);

    const stillLoading = ALL_ROWS
        .filter(r => inScope(r.series, scope))
        .some(r => {
            const s = data[r.series];
            return !s || Object.values(s).some(c => c.status === 'loading');
        });

    return (
        <div className="border border-stone-line-strong bg-obsidian">

            {/* header */}
            <div className="flex items-baseline gap-4 border-b border-stone-line px-5 py-3">
                <span className="font-serif text-[0.9rem] font-light tracking-[0.18em] text-marble">
                    Top Performer
                </span>
                <span className="font-mono text-[0.52rem] tracking-[0.16em] text-bronze-dim">
                    per decade · {annualise ? 'CAGR' : 'total return'} · local currency
                </span>
            </div>

            {/* decade tiles */}
            <div className="flex overflow-x-auto">
                {DECADES.map((decade, i) => {
                    const winner = winners[i];
                    const isPartial = decade.end === LAST_YEAR;

                    return (
                        <div
                            key={decade.label}
                            className="flex min-h-[7rem] min-w-[8rem] flex-1 flex-col gap-2 border-r border-stone-line px-5 py-5 last:border-r-0"
                        >
                            {/* decade */}
                            <div className="font-mono text-[0.6rem] tracking-[0.18em] text-bronze">
                                {decade.label}
                                {isPartial && (
                                    <span className="ml-1 font-sans text-[0.48rem] uppercase text-bronze-dim">›</span>
                                )}
                            </div>

                            {stillLoading && !winner ? (
                                <span className="animate-pulse font-mono text-[0.65rem] text-platinum-dim">…</span>
                            ) : !winner ? (
                                <span className="font-mono text-[0.8rem] text-platinum-dim">—</span>
                            ) : (
                                <>
                                    {/* Primary label — country if available, else asset name */}
                                    <div className="font-sans text-[0.9rem] font-light tracking-[0.04em] text-marble leading-tight">
                                        {winner.row.country ?? winner.asset.label}
                                    </div>

                                    {/* Index name — secondary */}
                                    <div className="font-sans text-[0.58rem] uppercase tracking-[0.14em] text-platinum-dim">
                                        {winner.row.country ? winner.asset.label : winner.asset.shortLabel}
                                    </div>

                                    {/* Spacer pushes return to the bottom */}
                                    <div className="flex-1" />

                                    {/* Return */}
                                    <div
                                        className="font-mono text-[0.88rem] tracking-[0.02em] tabular-nums"
                                        style={{ color: winner.pct >= 0 ? POS : NEG }}
                                    >
                                        {fmt(winner.pct, annualise)}
                                        {winner.estimated && (
                                            <span className="ml-1 align-super font-mono text-[0.45rem] uppercase tracking-[0.1em] text-bronze-dim">
                                                est
                                            </span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
