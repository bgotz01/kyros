'use client';

// ─── disclosure rows ──────────────────────────────────────────────────────────
// A card is a stack of rows. `LawRow` states a law's score and never opens —
// the three laws are the card's subject and should not need a click. `Panel`
// opens and carries no score; both share the grid so they never drift apart.

import { PARADIGM_DEFINING_SCORE, scoreBand, type LawId } from '@/lib/engine/paradigm';
import type { FlagState } from './types';

/** The objection marker on a row. An open objection is the one thing on the
 *  page that wants the eye — bronze is the accent everything else already
 *  uses, so it carried no urgency. */
export function Flag({ state, onClick }: { state: FlagState; onClick: () => void }) {
    const label = { open: 'Critic objects', applied: 'Correction applied', dismissed: 'Objection dismissed' }[state];
    const tone = {
        open: 'border-halt bg-halt/10 text-halt-bright',
        applied: 'border-stone-line text-platinum-dim',
        dismissed: 'border-stone-line text-platinum-dim line-through',
    }[state];
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            className={`shrink-0 border px-1.5 py-0.5 font-mono text-[0.52rem] uppercase tracking-[0.14em] transition-colors duration-300 ease-mechanical ${
                state === 'open' ? 'hover:border-halt-bright' : 'hover:border-stone-line-strong'
            } ${tone}`}
        >
            {state === 'applied' ? '✓' : '⚑'}
        </button>
    );
}

/** The caret that turns as a row opens. Slow, mechanical, never bouncing. */
function Caret({ open }: { open: boolean }) {
    return (
        <span
            aria-hidden
            className={`font-mono text-[0.55rem] text-platinum-dim transition-transform duration-300 ease-mechanical ${
                open ? 'rotate-90' : ''
            }`}
        >
            ▸
        </span>
    );
}

/** The shared shell: a bordered row whose header is a single toggle, with the
 *  flag outside it so an objection can be opened without opening the row. */
function Disclosure({
    header,
    open,
    onToggle,
    flag,
    onFlag,
    children,
}: {
    header: React.ReactNode;
    open: boolean;
    onToggle: () => void;
    flag?: FlagState;
    onFlag?: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="border-t border-stone-line/60 first:border-t-0">
            <div className="flex items-center gap-3 px-5 py-2.5">
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={open}
                    className="min-w-0 flex-1 text-left"
                >
                    {header}
                </button>
                {flag && onFlag && <Flag state={flag} onClick={onFlag} />}
            </div>
            {open && <div className="border-t border-stone-line/60 px-5 py-4">{children}</div>}
        </div>
    );
}

/** A law's score, as a static row.
 *
 *  The three laws no longer each open their own detail. They are the card's
 *  centre — the thing a reader came for — and the reasoning behind all three
 *  now lives in one Analysis panel below, because all three are measured
 *  against the same six forces and three separate disclosures hid that.
 *
 *  Same grid as `Rank` so a month still scans straight down the numbers. */
export function LawRow({
    law,
    label,
    symbol,
    value,
    words,
    note,
    flag,
    onFlag,
}: {
    law: LawId;
    label: string;
    symbol: string;
    value: number;
    words: string;
    note?: string;
    /** The critic's objection to THIS law. It sits on the score row rather than
     *  inside the analysis, because an objection is a fact about the number and
     *  a reader scanning a month must see it without opening anything. */
    flag?: FlagState;
    onFlag?: () => void;
}) {
    return (
        <div className="flex items-baseline gap-3 px-5 py-1.5">
            <span className="grid min-w-0 flex-1 grid-cols-[1fr] items-baseline gap-x-3 gap-y-1 sm:grid-cols-[6.5rem_5.5rem_1.5rem_1fr]">
                <span className="flex items-baseline gap-1.5">
                    <span className="font-serif text-[0.95rem] font-medium leading-none tracking-[0.04em] text-bronze-bright">
                        {symbol}
                    </span>
                    <span className="font-sans text-[0.55rem] uppercase tracking-[0.18em] text-platinum-dim">
                        {label}
                    </span>
                </span>

                {/* The last two segments are the paradigm-defining band and are
                    drawn apart: 9-10 is not "more of the same", it is the claim
                    that this creation modified the standing paradigm on this
                    law's force. */}
                <span aria-hidden className="flex h-1 items-center gap-px">
                    {Array.from({ length: 10 }, (_, i) => (
                        <span
                            key={i}
                            className={`h-1 flex-1 transition-colors duration-500 ease-mechanical ${
                                i === 8 ? 'ml-1' : ''
                            }`}
                            style={{
                                background:
                                    i < value
                                        ? i >= 8
                                            ? 'var(--color-bronze-bright)'
                                            : 'var(--color-bronze)'
                                        : 'var(--color-stone-line)',
                            }}
                        />
                    ))}
                </span>

                <span
                    className={`text-right font-mono text-[0.7rem] ${
                        value >= PARADIGM_DEFINING_SCORE ? 'text-bronze-bright' : 'text-marble'
                    }`}
                >
                    {value}
                </span>

                <span className="min-w-0 truncate font-sans text-[0.66rem] tracking-[0.03em] text-platinum">
                    <span
                        className={`mr-2 font-sans text-[0.5rem] uppercase tracking-[0.18em] ${
                            value >= PARADIGM_DEFINING_SCORE
                                ? 'text-bronze-bright'
                                : 'text-platinum-dim/70'
                        }`}
                    >
                        {scoreBand(value, law)}
                    </span>
                    {words}
                    {note && <span className="ml-2 text-platinum-dim">{note}</span>}
                </span>
            </span>
            {flag && onFlag && <Flag state={flag} onClick={onFlag} />}
        </div>
    );
}

/** A shared panel that opens like a rank but carries no score.
 *
 *  With `words` it borrows the rank's column grid, leaving the bar and the
 *  number empty — so a panel's one line starts where every headline below it
 *  starts, rather than ragging against them. */
export function Panel({
    label,
    words,
    open,
    onToggle,
    flag,
    onFlag,
    children,
}: {
    label: string;
    words?: string;
    open: boolean;
    onToggle: () => void;
    flag?: FlagState;
    onFlag?: () => void;
    children: React.ReactNode;
}) {
    const name = (
        <span className="flex items-baseline gap-1.5">
            <Caret open={open} />
            <span className="font-sans text-[0.6rem] uppercase tracking-[0.18em] text-platinum-dim">
                {label}
            </span>
        </span>
    );

    return (
        <Disclosure
            open={open}
            onToggle={onToggle}
            flag={flag}
            onFlag={onFlag}
            header={
                words === undefined ? (
                    <span className="flex min-w-0 items-baseline gap-1.5">{name}</span>
                ) : (
                    <span className="grid grid-cols-[1fr] items-baseline gap-x-3 gap-y-1 sm:grid-cols-[9.5rem_5.5rem_1.5rem_1fr]">
                        {name}
                        {/* The rank's bar and number columns, left empty. Only
                            below sm, where the grid stacks, they would be two
                            blank rows — so they exist only once there are
                            columns to hold open. */}
                        <span aria-hidden className="hidden sm:block" />
                        <span aria-hidden className="hidden sm:block" />
                        <span className="min-w-0 truncate font-sans text-[0.66rem] tracking-[0.03em] text-platinum">
                            {words}
                        </span>
                    </span>
                )
            }
        >
            {children}
        </Disclosure>
    );
}
