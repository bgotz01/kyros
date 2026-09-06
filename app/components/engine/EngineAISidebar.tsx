'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ModelSelect from '../council/ModelSelect';
import UsageModal from './UsageModal';
import { MODELS } from '@/lib/models';
import type { WeekRow } from '@/lib/engineData';

interface Props {
    weeks: WeekRow[];
    activeKey: string | null;
    onSelect: (week: WeekRow) => void;
    model: string;
    onModel: (id: string) => void;
    criticModel: string;
    onCriticModel: (id: string) => void;
    criticOn: boolean;
    onCriticToggle: () => void;
    externalModel: string;
    onExternalModel: (id: string) => void;
    running: boolean;
}

/** Input and output price per million tokens, shown under each seat so the
 *  cost of a choice is visible at the point of making it. */
function Rate({ id }: { id: string }) {
    const m = MODELS.find((x) => x.id === id);
    if (!m) return null;
    return (
        <p className="mt-1 font-mono text-[0.52rem] tracking-[0.1em] text-platinum-dim">
            ${m.inputCost.toFixed(2)} in · ${m.outputCost.toFixed(2)} out
            <span className="ml-1.5 text-platinum-dim/60">/M</span>
        </p>
    );
}

/** Filled when every arXiv paper in the week has text, hollow when none does. */
function heldGlyph(week: WeekRow): string {
    if (week.arxivCount === 0) return '·';
    if (week.heldCount === 0) return '○';
    return week.heldCount === week.arxivCount ? '●' : '◐';
}

/** Pull the leading month name out of a stripped heading like "Jan 1 - Jan 7". */
function monthFromHeading(heading: string): string {
    return heading.match(/^([A-Za-z]+)/)?.[1] ?? '—';
}

const MONTH_ORDER = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_ABBR: Record<string, string> = {
    Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April',
    Jun: 'June', Jul: 'July', Aug: 'August', Sep: 'September',
    Oct: 'October', Nov: 'November', Dec: 'December',
};

/** Normalise a month string to its full name for consistent sorting. */
function normalizeMonth(m: string): string {
    return MONTH_ABBR[m] ?? m;
}

interface ChevronProps {
    open: boolean;
}
function Chevron({ open }: ChevronProps) {
    return (
        <svg
            width="7"
            height="7"
            viewBox="0 0 8 8"
            fill="none"
            aria-hidden
            className={`shrink-0 text-platinum-dim transition-transform duration-500 ease-mechanical ${open ? 'rotate-90' : ''}`}
        >
            <path
                d="M2 1.5L5.5 4L2 6.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default function EngineAISidebar({
    weeks,
    activeKey,
    onSelect,
    model,
    onModel,
    criticModel,
    onCriticModel,
    criticOn,
    onCriticToggle,
    externalModel,
    onExternalModel,
    running,
}: Props) {
    const [showUsage, setShowUsage] = useState(false);
    const [modelsOpen, setModelsOpen] = useState(false);

    const totalHeld = weeks.reduce((n, w) => n + w.heldCount, 0);
    const totalArxiv = weeks.reduce((n, w) => n + w.arxivCount, 0);

    // Group newest-first: years descending, months in reverse calendar order
    // within each year, weeks in reverse index order within each month.
    const grouped = useMemo(() => {
        const byYear = new Map<string, Map<string, WeekRow[]>>();

        for (const week of weeks) {
            const stripped = week.heading.replace(/^\(|\)\s*-\s*\d{4}$/g, '');
            const month = monthFromHeading(stripped);
            if (!byYear.has(week.year)) byYear.set(week.year, new Map());
            const byMonth = byYear.get(week.year)!;
            if (!byMonth.has(month)) byMonth.set(month, []);
            byMonth.get(month)!.push(week);
        }

        return [...byYear.entries()]
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([year, byMonth]) => ({
                year,
                months: [...byMonth.entries()]
                    .sort(([a], [b]) => MONTH_ORDER.indexOf(normalizeMonth(b)) - MONTH_ORDER.indexOf(normalizeMonth(a)))
                    .map(([month, ws]) => ({
                        month,
                        weeks: [...ws].reverse(), // newest first within month
                    })),
            }));
    }, [weeks]);

    // Collapse state: everything starts closed on load.
    // Keys are "<year>" for years, "<year>:<month>" for months.
    const [closed, setClosed] = useState<Set<string>>(new Set());
    const initialised = useRef(false);

    useEffect(() => {
        if (initialised.current || weeks.length === 0) return;
        initialised.current = true;
        const keys = new Set<string>();
        for (const week of weeks) {
            const stripped = week.heading.replace(/^\(|\)\s*-\s*\d{4}$/g, '');
            const month = monthFromHeading(stripped);
            keys.add(week.year);
            keys.add(`${week.year}:${month}`);
        }
        setClosed(keys);
    }, [weeks]);

    function toggle(key: string) {
        setClosed((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }

    return (
        <aside className="sticky top-0 hidden h-[calc(100vh-4rem)] w-56 shrink-0 flex-col overflow-hidden border-r border-stone-line bg-obsidian-800 md:flex">
            <header className="shrink-0 border-b border-stone-line px-4 py-4">
                <h2 className="font-serif text-base font-light tracking-[0.14em] text-marble">Engine</h2>
                <p className="mt-1 font-mono text-[0.55rem] tracking-[0.14em] text-platinum-dim">
                    {totalHeld}/{totalArxiv} PAPERS HELD
                </p>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto">
                {grouped.length === 0 && (
                    <p className="px-4 py-6 font-sans text-[0.65rem] leading-relaxed tracking-[0.04em] text-platinum-dim">
                        No digests found. Add a year file under papers/digests/.
                    </p>
                )}

                {grouped.map(({ year, months }) => {
                    const yearOpen = !closed.has(year);
                    const yearHeld = months.flatMap((m) => m.weeks).reduce((n, w) => n + w.heldCount, 0);
                    const yearArxiv = months.flatMap((m) => m.weeks).reduce((n, w) => n + w.arxivCount, 0);

                    return (
                        <div key={year}>
                            {/* Year row */}
                            <button
                                type="button"
                                onClick={() => toggle(year)}
                                className="flex w-full items-center gap-2 border-b border-stone-line bg-obsidian-800 px-3 py-2 text-left transition-colors duration-300 ease-mechanical hover:bg-charcoal"
                            >
                                <Chevron open={yearOpen} />
                                <span className="flex-1 font-mono text-[0.58rem] tracking-[0.16em] text-platinum">
                                    {year}
                                </span>
                                <span className="font-mono text-[0.5rem] tracking-[0.08em] text-platinum-dim">
                                    {yearHeld}/{yearArxiv}
                                </span>
                            </button>

                            {yearOpen && months.map(({ month, weeks: mWeeks }) => {
                                const monthKey = `${year}:${month}`;
                                const monthOpen = !closed.has(monthKey);
                                const mHeld = mWeeks.reduce((n, w) => n + w.heldCount, 0);
                                const mArxiv = mWeeks.reduce((n, w) => n + w.arxivCount, 0);

                                return (
                                    <div key={monthKey}>
                                        {/* Month row */}
                                        <button
                                            type="button"
                                            onClick={() => toggle(monthKey)}
                                            className="flex w-full items-center gap-2 border-b border-stone-line/60 px-5 py-1.5 text-left transition-colors duration-300 ease-mechanical hover:bg-charcoal"
                                        >
                                            <Chevron open={monthOpen} />
                                            <span className="flex-1 font-sans text-[0.57rem] uppercase tracking-[0.2em] text-platinum-dim">
                                                {month}
                                            </span>
                                            <span className="font-mono text-[0.48rem] tracking-[0.08em] text-platinum-dim/60">
                                                {mHeld}/{mArxiv}
                                            </span>
                                        </button>

                                        {/* Week rows */}
                                        {monthOpen && mWeeks.map((week) => {
                                            const key = `${week.year}:${week.idx}`;
                                            const active = key === activeKey;
                                            const label = week.heading
                                                .replace(/^\(|\)\s*-\s*\d{4}$/g, '')
                                                .replace(/^[A-Za-z]+\s*/, ''); // strip leading month name

                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    disabled={running}
                                                    onClick={() => onSelect(week)}
                                                    className={`flex w-full items-baseline gap-2 border-b border-stone-line/40 pl-8 pr-3 py-2 text-left transition-colors duration-300 ease-mechanical disabled:opacity-40 ${active ? 'bg-charcoal-700' : 'hover:bg-charcoal'
                                                        }`}
                                                >
                                                    <span
                                                        className={`shrink-0 font-mono text-[0.55rem] ${week.heldCount === week.arxivCount && week.arxivCount > 0
                                                            ? 'text-bronze'
                                                            : 'text-platinum-dim'
                                                            }`}
                                                        aria-hidden
                                                    >
                                                        {heldGlyph(week)}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span
                                                            className={`block truncate font-sans text-[0.63rem] tracking-[0.03em] ${active ? 'text-bronze-bright' : 'text-platinum'
                                                                }`}
                                                        >
                                                            {label}
                                                        </span>
                                                        <span className="block font-mono text-[0.5rem] tracking-[0.08em] text-platinum-dim">
                                                            {week.heldCount}/{week.arxivCount}
                                                        </span>
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            {/* Models — collapsible section pinned to the foot of the rail.
                Deliberately different models by default: a critic from the same
                family as the analyst tends to ratify rather than challenge. */}
            <div className="shrink-0 border-t border-stone-line">
                <button
                    type="button"
                    onClick={() => setModelsOpen((o) => !o)}
                    className="flex w-full items-center justify-between px-4 py-2.5 transition-colors duration-500 ease-mechanical hover:bg-charcoal"
                    aria-expanded={modelsOpen}
                >
                    <span className="font-sans text-[0.52rem] uppercase tracking-[0.28em] text-platinum-dim">
                        Models
                    </span>
                    <svg
                        width="8"
                        height="8"
                        viewBox="0 0 8 8"
                        fill="none"
                        aria-hidden
                        className={`shrink-0 text-platinum-dim transition-transform duration-500 ease-mechanical ${modelsOpen ? 'rotate-180' : ''}`}
                    >
                        <path
                            d="M1 3L4 6L7 3"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>

                <div
                    className={`overflow-hidden transition-all duration-500 ease-mechanical ${modelsOpen ? 'max-h-[32rem] opacity-100' : 'max-h-0 opacity-0'}`}
                >
                    <div className="border-t border-stone-line px-4 py-3">
                        <span className="mb-1.5 block font-sans text-[0.52rem] uppercase tracking-[0.28em] text-platinum-dim">
                            Analyst
                        </span>
                        <ModelSelect
                            value={model}
                            onChange={onModel}
                            disabled={running}
                            ariaLabel="Analyst model"
                            placement="side"
                        />
                        <Rate id={model} />
                    </div>

                    <div className="border-t border-stone-line px-4 py-3">
                        <button
                            type="button"
                            onClick={onCriticToggle}
                            disabled={running}
                            className="mb-1.5 flex w-full items-center justify-between disabled:opacity-40"
                            aria-pressed={criticOn}
                        >
                            <span className="font-sans text-[0.52rem] uppercase tracking-[0.28em] text-platinum-dim">
                                Critic
                            </span>
                            <span
                                className={`font-mono text-[0.52rem] uppercase tracking-[0.16em] transition-colors duration-300 ease-mechanical ${criticOn ? 'text-bronze' : 'text-platinum-dim'
                                    }`}
                            >
                                {criticOn ? 'on' : 'off'}
                            </span>
                        </button>
                        <div className={criticOn ? '' : 'pointer-events-none opacity-30'}>
                            <ModelSelect
                                value={criticModel}
                                onChange={onCriticModel}
                                disabled={running || !criticOn}
                                ariaLabel="Critic model"
                                placement="side"
                            />
                            <Rate id={criticModel} />
                        </div>
                    </div>

                    {/* The external seat only sorts a paper's own repository from
                        the ones it cites — short input, short output. A cheap
                        model does it as well as an expensive one. */}
                    <div className="border-t border-stone-line px-4 py-3">
                        <span className="mb-1.5 block font-sans text-[0.52rem] uppercase tracking-[0.28em] text-platinum-dim">
                            External
                        </span>
                        <ModelSelect
                            value={externalModel}
                            onChange={onExternalModel}
                            disabled={running}
                            ariaLabel="External model"
                            placement="side"
                        />
                        <Rate id={externalModel} />
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowUsage(true)}
                        className="w-full border-t border-stone-line px-4 py-2.5 text-left font-sans text-[0.52rem] uppercase tracking-[0.28em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:bg-charcoal hover:text-bronze-bright"
                    >
                        Usage
                    </button>
                </div>
            </div>

            {/* Through a portal: the sidebar is sticky, and a sticky element
                opens its own stacking context — a modal left inside it would
                sit under the navbar however high its z-index went. */}
            {showUsage &&
                createPortal(
                    <UsageModal domain="ai" onClose={() => setShowUsage(false)} />,
                    document.body,
                )}
        </aside>
    );
}
