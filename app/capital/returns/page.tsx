'use client';

import { useState } from 'react';

import TopPerformerPanel from './TopPerformerPanel';
import DecadeReturnsTable from './DecadeReturnsTable';
import { type TableData, type Scope } from './returnsData';

// ─── /capital/returns ─────────────────────────────────────────────────────────
// The page owns all shared state — data, toggles, scope — so the panel and
// the table stay in sync without being coupled to each other.

export default function ReturnsPage() {
    const [data, setData] = useState<TableData>({});
    const [annualise, setAnnualise] = useState(true);
    const [stripDiv, setStripDiv] = useState(false);
    const [scope, setScope] = useState<Scope>('equities+gold');

    return (
        <div className="mx-auto w-full max-w-[1100px] px-8 py-16">

            {/* header */}
            <div className="mb-10">
                <div className="mb-3 flex flex-wrap items-baseline gap-x-8 gap-y-2">
                    <h1 className="font-serif text-2xl font-light tracking-[0.16em] text-marble">
                        Returns
                    </h1>
                    <span className="font-mono text-[0.65rem] tracking-[0.2em] text-bronze">
                        Decade · Price · Local Currency
                    </span>
                </div>
                <p className="font-sans text-[0.6rem] uppercase tracking-[0.24em] text-platinum">
                    What each major market paid over a full decade · first to last close · Yahoo Finance
                </p>
            </div>

            {/* top performer panel — its own card, visually separate */}
            <TopPerformerPanel
                data={data}
                annualise={annualise}
                stripDiv={stripDiv}
                scope={scope}
            />

            {/* returns table */}
            <div className="mt-10 border border-stone-line-strong bg-charcoal px-6 py-6">
                <DecadeReturnsTable
                    data={data}
                    onData={setData}
                    onLoaded={() => { }}
                    annualise={annualise}
                    onAnnualise={setAnnualise}
                    stripDiv={stripDiv}
                    onStripDiv={setStripDiv}
                    scope={scope}
                    onScope={setScope}
                />
            </div>

        </div>
    );
}
