'use client';

import IndexChart from './IndexChart';

import { INDEXES } from '@/lib/capital/marketIndexes';
import { FX_PAIRS } from '@/lib/capital/fxPairs';
import FxChart from './CurrencyChart';

// ─── Markets page ─────────────────────────────────────────────────────────────
// Two self-contained chart blocks — equities and currencies — each owning
// their own selection state. Changing a control in one never disturbs the other.

export default function MarketsPage() {
    return (
        <div className="mx-auto w-full max-w-[1100px] px-8 py-16">

            {/* header */}
            <div className="mb-10">
                <div className="mb-3 flex flex-wrap items-baseline gap-x-8 gap-y-2">
                    <h1 className="font-serif text-2xl font-light tracking-[0.16em] text-marble">
                        Markets
                    </h1>
                    <span className="font-mono text-[0.65rem] tracking-[0.2em] text-bronze">
                        Equities · Currencies
                    </span>
                </div>
                <p className="font-sans text-[0.6rem] uppercase tracking-[0.24em] text-platinum">
                    Daily source · {INDEXES.length} indexes · {FX_PAIRS.length} pairs · 1900–2026 · Yahoo Finance
                </p>
            </div>

            {/* ─── equities ──────────────────────────────────────────────── */}

            <SectionHeading title="Indexes" note="What capital is worth" />
            <IndexChart />

            {/* ─── currencies ────────────────────────────────────────────── */}

            <div className="mt-20">
                <SectionHeading title="Currencies" note="What the measure is worth" />
            </div>
            <FxChart />

        </div>
    );
}

// ─── section heading ──────────────────────────────────────────────────────────

function SectionHeading({ title, note }: { title: string; note: string }) {
    return (
        <div className="mb-5 flex items-baseline gap-4 border-b border-stone-line pb-3">
            <h2 className="font-serif text-lg font-light tracking-[0.18em] text-marble">
                {title}
            </h2>
            <span className="font-sans text-[0.55rem] uppercase tracking-[0.22em] text-platinum-dim">
                {note}
            </span>
        </div>
    );
}
