'use client';

// capital/components/LeadershipArc.tsx

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import {
    PARADIGMS,
    type DecadeReturn,
    type Paradigm,
} from '@/lib/capital/paradigms';
import Nifty50Return from './Nifty50Return';
import Em2000sReturn from './Em2000sReturn';

import {
    computeReturns as computeNifty50Returns,
    type Nifty50Stock,
} from '@/lib/capital/nifty50-returns';
import {
    computeEmReturns,
    type EmStock,
} from '@/lib/capital/em2000s-returns';

// ─── live pct helpers (mirrors the two Return components) ─────────────────────

const NIFTY50_KEY = 'nifty50-selected';
const NIFTY50_SELECTABLE = ['KO', 'DIS', 'GE', 'IBM', 'JNJ', 'MRK', 'PG', 'XRX', 'MCD'] as Nifty50Stock[];
const NIFTY50_DEFAULT = ['KO', 'DIS', 'JNJ', 'MRK', 'XRX', 'MCD'] as Nifty50Stock[];

const EM2000S_KEY = 'em2000s-selected';
const EM2000S_SELECTABLE = new Set(['BBD', 'PBR', 'IBN', 'AMX', 'CX', 'MXX', 'CIB', 'PTR', 'CHL', 'LFC', 'FXI', 'BIDU', 'MOS', 'POT', 'RIO', 'BHP', 'VALE', 'SCCO', 'ICL', 'CF'] as EmStock[]);
const EM2000S_DEFAULT = ['BBD', 'PBR', 'IBN', 'AMX', 'PTR', 'CHL', 'LFC', 'BIDU', 'MOS', 'RIO', 'POT', 'BHP', 'VALE'] as EmStock[];

function readStored<T extends string>(key: string, selectable: T[] | Set<T>, defaults: T[]): T[] {
    try {
        const raw = localStorage.getItem(key);
        if (raw) {
            const parsed = JSON.parse(raw) as string[];
            const set = selectable instanceof Set ? selectable : new Set(selectable);
            const valid = parsed.filter((s): s is T => set.has(s as T));
            if (valid.length > 0) return valid;
        }
    } catch { /* ignore */ }
    return defaults;
}

function livePct(decade: string): number | null {
    if (decade === '1960s') {
        const stocks = readStored(NIFTY50_KEY, NIFTY50_SELECTABLE, NIFTY50_DEFAULT);
        const rows = computeNifty50Returns(stocks).filter(r => r.year <= 1970 && r.count > 0);
        const total = rows.reduce((p, r) => p * (1 + r.indexReturn), 1) - 1;
        return Math.round(total * 100);
    }
    if (decade === '2000s') {
        const stocks = readStored<EmStock>(EM2000S_KEY, EM2000S_SELECTABLE, EM2000S_DEFAULT);
        const rows = computeEmReturns(stocks).filter(r => r.count > 0);
        const total = rows.reduce((p, r) => p * (1 + r.indexReturn), 1) - 1;
        return Math.round(total * 100);
    }
    return null;
}

const COL_W = 128;
const PLOT_H = 210;

// ─── scale ────────────────────────────────────────────────────────────────────
// Decade returns span +5% to +1,893%. Linear would flatten seven decades into
// the floor, so the column reads on a log scale — proportion, not magnitude.

const growth = (pct: number) => Math.log10(Math.max(1 + pct / 100, 1));

const CEILING = Math.max(
    ...PARADIGMS.map((p) => growth(p.rotationReturn?.pct ?? 0)),
);

/** Height as a percentage of the plot area. The floor keeps the weakest decade
 *  visible; the ceiling leaves the tallest column room for its own figure. */
function height(value?: DecadeReturn) {
    if (!value) return 0;
    return 6 + 78 * (growth(value.pct) / CEILING);
}

function fmtPct(pct: number) {
    return `${pct < 0 ? '−' : '+'}${Math.abs(pct).toLocaleString('en-US')}%`;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function LeadershipArc() {
    const [selected, setSelected] = useState<string | null>(null);
    const columns = useRef<(HTMLButtonElement | null)[]>([]);

    // Live pct overrides for decades with dynamic indexes
    const [livePcts, setLivePcts] = useState<Partial<Record<string, number>>>({});

    useEffect(() => {
        function update() {
            setLivePcts({
                '1960s': livePct('1960s') ?? undefined,
                '2000s': livePct('2000s') ?? undefined,
            });
        }
        update();
        window.addEventListener('storage', update);
        return () => window.removeEventListener('storage', update);
    }, []);

    // Effective pct for a paradigm — live override or static fallback
    function effectivePct(p: Paradigm): number {
        return livePcts[p.decade] ?? p.rotationReturn?.pct ?? 0;
    }

    // Recompute ceiling with live values so relative bar heights stay accurate
    const ceiling = Math.max(
        ...PARADIGMS.map((p) => growth(effectivePct(p))),
    );

    function barHeight(p: Paradigm): number {
        const pct = effectivePct(p);
        if (!pct) return 0;
        return 6 + 78 * (growth(pct) / ceiling);
    }

    const index = PARADIGMS.findIndex((p) => p.decade === selected);
    const current = index >= 0 ? PARADIGMS[index] : null;
    const previous = index > 0 ? PARADIGMS[index - 1] : null;

    /** Arrow keys walk the arc; Escape closes the readout. */
    function onKeyDown(event: React.KeyboardEvent, at: number) {
        const step =
            event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;

        if (step) {
            const next = Math.min(Math.max(at + step, 0), PARADIGMS.length - 1);
            event.preventDefault();
            setSelected(PARADIGMS[next].decade);
            columns.current[next]?.focus();
            return;
        }

        if (event.key === 'Escape' && selected) {
            event.preventDefault();
            setSelected(null);
        }
    }

    return (
        <section className="w-full">
            {/* ─── header ─────────────────────────────────────────────────── */}
            <div className="mb-10 text-center">
                <h2 className="font-serif text-[2rem] font-light tracking-[0.04em] text-marble">
                    The Arc of Leadership
                </h2>

                <p className="mt-2 font-sans text-[0.68rem] uppercase tracking-[0.22em] text-bronze">
                    Where capital ran, and what it returned
                </p>
            </div>

            {/* ─── legend ─────────────────────────────────────────────────── */}
            <div className="mb-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 font-sans text-[0.6rem] uppercase tracking-[0.16em] text-platinum-dim">
                <span className="inline-flex items-center gap-2">
                    <span aria-hidden className="h-3 w-2 bg-bronze" />
                    Leadership rotation
                </span>

                <span className="inline-flex items-center gap-2">
                    <span
                        aria-hidden
                        className="h-px w-5 border-t border-dashed border-stone-line-strong"
                    />
                    Dow, same decade
                </span>

                <span className="tracking-[0.16em] text-bronze-dim">
                    Log scale
                </span>
            </div>

            {/* ─── the arc ────────────────────────────────────────────────── */}
            <div className="-mx-8 overflow-x-auto px-8 pb-1">
                <div
                    className="flex min-w-full"
                    role="group"
                    aria-label="Capital leadership by decade"
                >
                    {PARADIGMS.map((p, at) => {
                        const active = p.decade === selected;

                        return (
                            <button
                                key={p.decade}
                                ref={(node) => {
                                    columns.current[at] = node;
                                }}
                                type="button"
                                aria-pressed={active}
                                aria-controls="leadership-arc-readout"
                                onClick={() =>
                                    setSelected(active ? null : p.decade)
                                }
                                onKeyDown={(event) => onKeyDown(event, at)}
                                className="group flex-1 shrink-0 cursor-pointer text-center outline-none"
                                style={{ minWidth: COL_W }}
                            >
                                {/* plot */}
                                <div
                                    className="relative flex items-end justify-center px-3"
                                    style={{ height: PLOT_H }}
                                >
                                    {/* benchmark tick */}
                                    {p.benchmarkReturn && (
                                        <span
                                            aria-hidden
                                            className="absolute inset-x-3 border-t border-dashed border-stone-line-strong"
                                            style={{
                                                bottom: `${height(p.benchmarkReturn)}%`,
                                            }}
                                        />
                                    )}

                                    {/* the column */}
                                    <span
                                        aria-hidden
                                        className={`relative w-[38px] transition-all duration-500 ease-mechanical ${active
                                            ? 'bg-bronze-bright'
                                            : 'bg-bronze-dim group-hover:bg-bronze group-focus-visible:bg-bronze'
                                            }`}
                                        style={{
                                            height: `${barHeight(p)}%`,
                                        }}
                                    />

                                    {/* return, riding the top of the column */}
                                    {p.rotationReturn && (
                                        <span
                                            className={`absolute left-0 right-0 font-mono text-[0.74rem] tabular-nums tracking-[0.04em] transition-colors duration-500 ease-mechanical ${active
                                                ? 'text-bronze-bright'
                                                : 'text-platinum-dim group-hover:text-bronze'
                                                }`}
                                            style={{
                                                bottom: `calc(${barHeight(p)}% + 7px)`,
                                            }}
                                        >
                                            {p.decade === '1960s' ? (
                                                <Nifty50Return benchmarkPct={p.benchmarkReturn?.pct ?? 0} />
                                            ) : p.decade === '2000s' ? (
                                                <Em2000sReturn benchmarkPct={p.benchmarkReturn?.pct ?? 0} />
                                            ) : (
                                                <>
                                                    {fmtPct(p.rotationReturn.pct)}
                                                    {!p.rotationReturn.measured && (
                                                        <span className="ml-1 text-[0.56rem] uppercase tracking-[0.12em] text-bronze-dim">
                                                            est
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </span>
                                    )}
                                </div>

                                {/* succession spine */}
                                <div className="relative h-4">
                                    <span
                                        aria-hidden
                                        className={`absolute inset-x-0 top-1/2 h-px -translate-y-1/2 transition-colors duration-500 ease-mechanical ${active ? 'bg-bronze' : 'bg-stone-line'
                                            }`}
                                    />
                                    <span
                                        aria-hidden
                                        className={`absolute left-1/2 top-1/2 h-[8px] w-[8px] -translate-x-1/2 -translate-y-1/2 rotate-45 border transition-all duration-500 ease-mechanical ${active
                                            ? 'border-bronze-bright bg-bronze-bright'
                                            : 'border-bronze bg-obsidian group-hover:border-bronze-bright'
                                            }`}
                                    />
                                </div>

                                {/* label stack */}
                                <div className="px-2 pt-5">
                                    <span
                                        className={`block font-serif text-[1.3rem] font-light tracking-[0.03em] transition-colors duration-500 ease-mechanical ${active ? 'text-bronze-bright' : 'text-bronze'
                                            }`}
                                    >
                                        {p.decade}
                                    </span>

                                    <span className="mt-2.5 block min-h-[1.75rem] font-sans text-[0.58rem] uppercase leading-[1.5] tracking-[0.16em] text-platinum-dim">
                                        {p.geography}
                                    </span>

                                    <span
                                        className={`mt-2 block min-h-[4.2rem] font-serif text-[1.18rem] font-light leading-[1.25] transition-colors duration-500 ease-mechanical ${active
                                            ? 'text-marble'
                                            : 'text-marble-dim group-hover:text-marble'
                                            }`}
                                    >
                                        {p.rotation ?? p.assetClass}
                                    </span>

                                    {/* the invitation — one hairline caret per column */}
                                    <span
                                        aria-hidden
                                        className={`mt-3 block font-mono text-[0.72rem] leading-none transition-all duration-500 ease-mechanical ${active
                                            ? 'text-bronze-bright'
                                            : 'text-bronze-dim group-hover:text-bronze'
                                            }`}
                                    >
                                        {active ? '×' : '⌄'}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ─── readout ────────────────────────────────────────────────── */}
            <div
                id="leadership-arc-readout"
                aria-live="polite"
                className="mt-8 min-h-[15rem] border-t border-stone-line pt-8"
            >
                {current ? (
                    <Readout
                        key={current.decade}
                        current={current}
                        previous={previous}
                    />
                ) : (
                    <p className="py-10 text-center font-sans text-[0.72rem] uppercase tracking-[0.24em] text-platinum-dim">
                        Select a decade to reveal its inversion
                    </p>
                )}
            </div>
        </section>
    );
}

// ─── readout ──────────────────────────────────────────────────────────────────

interface Row {
    dimension: string;
    prev: string;
    next: string;
}

/** The paradigm read across every dimension the record carries, so the two
 *  decades can be set against each other line by line. */
function rows(previous: Paradigm | null, current: Paradigm): Row[] {
    const dash = '—';

    return [
        { dimension: 'Geography', prev: previous?.geography ?? dash, next: current.geography },
        { dimension: 'Asset Class', prev: previous?.assetClass ?? dash, next: current.assetClass },
        { dimension: 'Sector / Theme', prev: previous?.sectorTheme ?? dash, next: current.sectorTheme },
        { dimension: 'Macro Regime', prev: previous?.macro ?? dash, next: current.macro },
        { dimension: 'Narrative', prev: previous?.narrative ?? dash, next: current.narrative },
        { dimension: 'Expression', prev: previous?.expression ?? dash, next: current.expression },
    ];
}

const GRID = 'grid grid-cols-[minmax(7rem,0.8fr)_minmax(0,1fr)_minmax(0,1fr)] gap-px bg-stone-line';

function Readout({
    current,
    previous,
}: {
    current: Paradigm;
    previous: Paradigm | null;
}) {
    const table = rows(previous, current);

    return (
        <div className="kyros-reveal">
            {/* heading */}
            <div className="mb-8 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-4">
                <div>
                    <span className="block font-sans text-[0.6rem] uppercase tracking-[0.22em] text-bronze">
                        {previous ? 'Inversion' : 'Opening paradigm'}
                    </span>

                    <span className="mt-2.5 block font-serif text-[2rem] font-light leading-none tracking-[0.04em] text-marble">
                        {previous ? `${previous.decade} → ${current.decade}` : current.decade}
                    </span>

                    <span className="mt-3 block font-sans text-[0.75rem] leading-relaxed text-platinum">
                        {current.inflection}
                    </span>
                </div>

                <Link
                    href={`/capital/decades/${current.decade}/inversions`}
                    className="shrink-0 border border-stone-line px-5 py-2.5 font-sans text-[0.62rem] uppercase tracking-[0.2em] text-platinum-dim transition-colors duration-300 ease-mechanical hover:border-bronze hover:text-bronze-bright"
                >
                    Open {current.decade} →
                </Link>
            </div>

            {/* the two paradigms, dimension by dimension */}
            <div className="-mx-8 overflow-x-auto px-8 sm:mx-0 sm:px-0">
                <div className="min-w-[42rem] border border-stone-line">
                    {/* column heads */}
                    <div className={GRID}>
                        <Cell head>
                            <span className="font-sans text-[0.55rem] uppercase tracking-[0.2em] text-platinum-dim">
                                Dimension
                            </span>
                        </Cell>

                        <Cell head>
                            <span className="block font-serif text-[1.25rem] font-light tracking-[0.03em] text-platinum-dim">
                                {previous?.decade ?? '—'}
                            </span>
                            <span className="mt-1.5 block font-sans text-[0.55rem] uppercase tracking-[0.18em] text-bronze-dim">
                                {previous ? 'Previous' : 'None'}
                            </span>
                        </Cell>

                        <Cell head>
                            <span className="block font-serif text-[1.25rem] font-light tracking-[0.03em] text-bronze-bright">
                                {current.decade}
                            </span>
                            <span className="mt-1.5 block font-sans text-[0.55rem] uppercase tracking-[0.18em] text-bronze">
                                {previous ? 'Inversion' : 'Paradigm'}
                            </span>
                        </Cell>
                    </div>

                    {/* rows */}
                    {table.map((row) => {
                        const held = Boolean(previous) && row.prev === row.next;

                        return (
                            <div key={row.dimension} className={`${GRID} border-t border-stone-line`}>
                                <Cell>
                                    <span className="block font-sans text-[0.62rem] uppercase tracking-[0.16em] text-platinum-dim">
                                        {row.dimension}
                                    </span>
                                </Cell>

                                <Cell>
                                    <span className="block font-serif text-[1rem] font-light leading-snug text-platinum-dim">
                                        {row.prev}
                                    </span>
                                </Cell>

                                <Cell>
                                    <span
                                        className={`block font-serif text-[1.12rem] font-light leading-snug ${held ? 'text-marble-dim' : 'text-marble'
                                            }`}
                                    >
                                        {row.next}
                                    </span>
                                </Cell>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* footnotes */}
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {!previous && (
                    <p className="font-sans text-[0.78rem] leading-relaxed text-platinum-dim">
                        The first paradigm in the record. Nothing before it to
                        invert — the decade the arc is measured from.
                    </p>
                )}

                {current.rotationNote && (
                    <div className="sm:col-span-2">
                        <span className="block font-sans text-[0.55rem] uppercase tracking-[0.18em] text-platinum-dim">
                            On the {current.decade} rotation
                        </span>
                        <span className="mt-2 block font-sans text-[0.78rem] leading-relaxed text-platinum-dim">
                            {current.rotationNote}
                        </span>
                        {current.decade === '1960s' && (
                            <span className="mt-3 block">
                                <Nifty50Return benchmarkPct={current.benchmarkReturn?.pct ?? 0} />
                            </span>
                        )}
                        {current.decade === '2000s' && (
                            <span className="mt-3 block">
                                <Em2000sReturn benchmarkPct={current.benchmarkReturn?.pct ?? 0} />
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function Cell({ children, head }: { children: React.ReactNode; head?: boolean }) {
    return (
        <div className={`bg-obsidian px-5 ${head ? 'py-4' : 'py-5'}`}>
            {children}
        </div>
    );
}
