'use client';

// ─── the instrument, for reading ─────────────────────────────────────────────
// The paradigm modal shows what a creation is measured AGAINST. This shows how
// the measuring is done: the three-tier scale and the eleven rungs each law
// climbs.
//
// Everything here is served from lib/engine/paradigm.ts — the same tables the
// scoring route enforces — so it cannot quietly drift from the instrument.
//
// The seat prompts used to sit here on a second tab and have moved to the
// paradigm modal, beside the snapshot they are printed into. A seat's context is
// the frame, the prompt and the rendered snapshot together; showing the prompt
// next to a table of rungs printed the vocabulary twice and the input never.
// A reader who wants to argue with a score should still be able to read exactly
// what the model was told rather than a description of it — that is now one
// click away, under the paradigm it was told to measure against.

import { useEffect, useState } from 'react';

interface Guide {
    rules: {
        bands: {
            min: number;
            max: number;
            tier: string;
            inversion: { label: string; note: string };
            incentives: { label: string; note: string };
            inflection: { label: string; note: string };
        }[];
        tierRule: string;
        tiers: { range: string; name: string; note: string }[];
        levels: {
            score: number;
            band: [number, number];
            inversion: string;
            incentives: string;
            inflection: string;
        }[];
        categories: readonly string[];
        limits: {
            dimensions: number;
            paradigmDefiningScore: number;
        };
    };
}

const LAWS = [
    { key: 'inversion', symbol: 'I¹', name: 'Inversion', against: 'baseline', asks: 'What did it reverse?' },
    { key: 'incentives', symbol: 'I²', name: 'Incentives', against: 'pressures', asks: 'Why was there a reason for it?' },
    { key: 'inflection', symbol: 'I³', name: 'Inflection', against: 'existing classes', asks: 'What had not existed before?' },
] as const;

function Heading({ children, note }: { children: React.ReactNode; note?: string }) {
    return (
        <div className="px-6 py-4">
            <span className="block font-sans text-[0.58rem] uppercase tracking-[0.22em] text-bronze">
                {children}
            </span>
            {note && (
                <p className="mt-1.5 font-sans text-[0.62rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                    {note}
                </p>
            )}
        </div>
    );
}

/** The scale. The numeric spine is shared and the boundaries never move; the
 *  NAMES differ by law, which is the whole reason this is a table rather than a
 *  list. I¹ and I³ measure movement of the paradigm; I² measures the strength of
 *  the incentive, and its top band says so. */
function Scale({ rules }: { rules: Guide['rules'] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse">
                <thead>
                    <tr className="border-b border-stone-line">
                        <th className="px-3 py-2 text-left font-sans text-[0.5rem] uppercase tracking-[0.2em] text-platinum-dim">
                            Score
                        </th>
                        <th className="px-3 py-2 text-left font-sans text-[0.5rem] uppercase tracking-[0.2em] text-bronze">
                            I¹ Inversion · I³ Inflection
                        </th>
                        <th className="px-3 py-2 text-left font-sans text-[0.5rem] uppercase tracking-[0.2em] text-bronze">
                            I² Incentives
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rules.bands.map((b) => {
                        const defines = b.min >= rules.limits.paradigmDefiningScore;
                        const interacts = b.min === 7;
                        const tone = defines
                            ? 'text-bronze-bright'
                            : interacts
                              ? 'text-bronze'
                              : 'text-marble';
                        return (
                            <tr
                                key={b.min}
                                className={`border-b border-stone-line/50 align-top ${
                                    defines || interacts ? 'bg-obsidian-800' : ''
                                }`}
                            >
                                <td className={`whitespace-nowrap px-3 py-2.5 font-mono text-[0.64rem] ${tone}`}>
                                    {b.min}&ndash;{b.max}
                                </td>
                                {([b.inversion, b.incentives] as const).map((cell, i) => (
                                    <td key={i} className="px-3 py-2.5">
                                        <span className={`block font-sans text-[0.68rem] tracking-[0.03em] ${tone}`}>
                                            {cell.label}
                                        </span>
                                        <span className="mt-0.5 block font-sans text-[0.6rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                                            {cell.note}
                                        </span>
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <p className="mt-2 font-mono text-[0.55rem] uppercase tracking-[0.14em] text-platinum-dim/70">
                0&ndash;6 within the paradigm · 7&ndash;8 interacts with it · 9&ndash;10 defines it
            </p>
        </div>
    );
}

/** The scale, all three laws side by side. Reading them together is the point:
 *  the same number means a different thing on each law, and a row where all
 *  three land on the same one is usually one judgement copied across. */
function Ladder({ rules }: { rules: Guide['rules'] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] border-collapse">
                <thead>
                    <tr className="border-b border-stone-line">
                        <th className="px-3 py-2 text-left font-sans text-[0.5rem] uppercase tracking-[0.2em] text-platinum-dim">
                            Score
                        </th>
                        {LAWS.map((l) => (
                            <th
                                key={l.key}
                                className="px-3 py-2 text-left font-sans text-[0.5rem] uppercase tracking-[0.2em] text-bronze"
                            >
                                {l.symbol} {l.name}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rules.levels.map((row) => {
                        const defines = row.score >= rules.limits.paradigmDefiningScore;
                        const interacts = row.score === 7 || row.score === 8;
                        return (
                            <tr
                                key={row.score}
                                className={`border-b border-stone-line/50 align-top ${
                                    defines || interacts ? 'bg-obsidian-800' : ''
                                }`}
                            >
                                <td
                                    className={`whitespace-nowrap px-3 py-2.5 font-mono text-[0.62rem] ${
                                        defines ? 'text-bronze-bright' : interacts ? 'text-bronze' : 'text-marble'
                                    }`}
                                >
                                    {row.score}
                                </td>
                                {LAWS.map((l) => (
                                    <td
                                        key={l.key}
                                        className={`px-3 py-2.5 font-sans text-[0.64rem] leading-relaxed tracking-[0.03em] ${
                                            defines ? 'text-marble' : 'text-platinum'
                                        }`}
                                    >
                                        {row[l.key].replace(/^PARADIGM-DEFINING — /, '')}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function Rules({ rules }: { rules: Guide['rules'] }) {
    return (
        <>
            <Heading note="Every law is one comparison against one collection in the dated snapshot. Select the historical object, classify the relationship, then score inside the band that classification opens — in that order, always.">
                The procedure
            </Heading>
            <div className="px-6 pb-5">
                <div className="flex flex-col gap-px border border-stone-line bg-stone-line">
                    {LAWS.map((l) => (
                        <div key={l.key} className="grid grid-cols-[2rem_1fr] gap-3 bg-obsidian-800 px-3 py-2.5">
                            <span className="font-serif text-[0.9rem] font-medium leading-none tracking-[0.04em] text-bronze-bright">
                                {l.symbol}
                            </span>
                            <span>
                                <span className="block font-sans text-[0.7rem] tracking-[0.03em] text-marble">
                                    creation ↔ {l.against}
                                </span>
                                <span className="mt-0.5 block font-sans text-[0.62rem] tracking-[0.03em] text-platinum-dim">
                                    {l.asks}
                                </span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-stone-line">
                <Heading note="The same scale for all three laws. The two boundaries are the whole instrument: almost all work — including work of enormous value — lives at 0–6.">
                    What a score means
                </Heading>
                <div className="px-6 pb-5">
                    <Scale rules={rules} />
                    {/* The single strongest guard against inflation in the
                        instrument, and the one a reader most needs to see. */}
                    <p className="mt-3 border-l-2 border-halt pl-3 font-sans text-[0.7rem] leading-relaxed tracking-[0.03em] text-marble">
                        {rules.tierRule}
                    </p>
                    <p className="mt-3 font-sans text-[0.64rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                        A 7 means something only because the snapshot is{' '}
                        {rules.limits.dimensions} forces and nothing else. Each states what is true
                        now, what the field is pulling toward, and what change would count as an
                        inflection along it. A scorer cannot reach 7 by matching a minor technical
                        detail, because there are none in the snapshot — and work that moves none
                        of the six scores zero, however good it is.
                    </p>
                </div>
            </div>

            <div className="border-t border-stone-line">
                <Heading note="Eleven rungs, one per value. Every number carries its own line, and the analyst picks a line rather than a number — there is no band to place a score inside, because there is no band.">
                    The scale
                </Heading>
                <div className="px-6 pb-5">
                    <Ladder rules={rules} />
                </div>
            </div>

            <div className="border-t border-stone-line">
                <Heading note="A 9–10 is a claim about ONE law, on that law's own dimension. There is deliberately no combined verdict across the three.">
                    On the top band
                </Heading>
                <div className="px-6 pb-5">
                    <p className="border-l-2 border-bronze-dim pl-3 font-sans text-[0.72rem] leading-relaxed tracking-[0.03em] text-marble">
                        A score of {rules.limits.paradigmDefiningScore} or above means
                        paradigm-defining <em className="not-italic text-bronze-bright">on that law</em>{' '}
                        — and on I², that the creation answers one of the paradigm&rsquo;s most
                        fundamental pressures, which is not the same claim.
                    </p>
                    <p className="mt-2 font-sans text-[0.64rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                        So a row reading I¹ 6 · I² 10 · I³ 6 says something precise and true: an
                        enormous answer to an enormous need, inside the standing paradigm. The
                        product carries overall magnitude; nothing here adds a second threshold
                        across the three laws.
                    </p>
                </div>
            </div>
        </>
    );
}

export default function ScoringModal({ onClose }: { onClose: () => void }) {
    const [guide, setGuide] = useState<Guide | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', fn);
        return () => window.removeEventListener('keydown', fn);
    }, [onClose]);

    useEffect(() => {
        fetch('/api/engine/guide')
            .then((r) => r.json())
            .then(setGuide)
            .catch(() => setError(true));
    }, []);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/85 px-6 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal
            aria-label="How a score is reached"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[88vh] w-full max-w-3xl flex-col border border-stone-line-strong bg-charcoal"
            >
                <header className="flex shrink-0 items-start justify-between gap-4 border-b border-stone-line px-6 py-4">
                    <div className="min-w-0">
                        <h2 className="font-serif text-lg font-light tracking-wide text-marble">
                            How a score is reached
                        </h2>
                        <p className="mt-0.5 font-mono text-[0.58rem] tracking-[0.1em] text-platinum-dim">
                            THE INSTRUMENT · NOT THE PARADIGM IT MEASURES AGAINST
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 font-sans text-[0.6rem] uppercase tracking-[0.28em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:text-bronze-bright"
                    >
                        Close
                    </button>
                </header>


                <div className="flex-1 overflow-y-auto">
                    {error && (
                        <p className="px-6 py-6 font-sans text-[0.7rem] tracking-[0.03em] text-platinum-dim">
                            Could not read the instrument.
                        </p>
                    )}
                    {!guide && !error && (
                        <p className="px-6 py-6 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-platinum-dim">
                            Reading&hellip;
                        </p>
                    )}
                    {guide && <Rules rules={guide.rules} />}
                </div>
            </div>
        </div>
    );
}
