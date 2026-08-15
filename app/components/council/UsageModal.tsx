'use client';

import { useEffect, useState } from 'react';
import { MODELS } from '@/lib/models';
import {
    AGENT_NAMES,
    callsForAgent,
    formatCost,
    formatTokens,
    sumUsage,
    turnsFromParallel,
    usageForAgent,
    type SavedSession,
    type Turn,
    type Usage,
} from './types';

interface Props {
    /** The open session, already normalised to turn shape. */
    turns: Turn[];
    sessions: SavedSession[];
    onClose: () => void;
}

type Scope = 'session' | 'archive';

function modelLabel(id: string): string {
    return MODELS.find((m) => m.id === id)?.label ?? id;
}

/** A hairline bar showing one agent's share of spend. */
function ShareBar({ fraction }: { fraction: number }) {
    return (
        <span aria-hidden className="block h-px w-full bg-stone-line">
            <span
                className="block h-px bg-bronze transition-[width] duration-700 ease-mechanical"
                style={{ width: `${Math.round(fraction * 100)}%` }}
            />
        </span>
    );
}

function Totals({ usage, label }: { usage: Usage | null; label: string }) {
    const cells: [string, string][] = [
        ['prompt', usage ? usage.promptTokens.toLocaleString() : '—'],
        ['completion', usage ? usage.completionTokens.toLocaleString() : '—'],
        ['total', usage ? usage.totalTokens.toLocaleString() : '—'],
        ['charged', usage ? formatCost(usage.cost) : '—'],
    ];
    return (
        <section>
            <h3 className="font-sans text-[0.58rem] uppercase tracking-[0.32em] text-platinum-dim">{label}</h3>
            <dl className="mt-3 grid grid-cols-2 gap-px border border-stone-line bg-stone-line sm:grid-cols-4">
                {cells.map(([k, v], i) => (
                    <div key={k} className="bg-obsidian px-4 py-3">
                        <dt className="font-sans text-[0.55rem] uppercase tracking-[0.24em] text-platinum-dim">
                            {k}
                        </dt>
                        <dd
                            className={`mt-1.5 font-mono text-base ${
                                i === cells.length - 1 ? 'text-bronze-bright' : 'text-marble'
                            }`}
                        >
                            {v}
                        </dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}

/** The full accounting for a council session — kept behind a panel so the rail
 *  stays a control surface rather than a readout. */
export default function UsageModal({ turns, sessions, onClose }: Props) {
    const [scope, setScope] = useState<Scope>('session');

    useEffect(() => {
        const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', fn);
        return () => window.removeEventListener('keydown', fn);
    }, [onClose]);

    // The archive scope folds every saved session — parallel ones included —
    // into the same turn shape, so one set of helpers covers both scopes.
    const archiveTurns = sessions.flatMap((s) =>
        s.mode === 'parallel' && s.parallelMessages
            ? turnsFromParallel(
                  s.parallelMessages.map((messages) => ({ messages, loading: false, error: false })),
              )
            : s.turns,
    );
    const scoped = scope === 'session' ? turns : archiveTurns;

    const total = usageForAgent(scoped);
    const perAgent = AGENT_NAMES.map((_, i) => usageForAgent(scoped, i));
    const untracked = scoped.some((t) => t.responses.some((r) => !r.usage));

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/85 px-6 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Usage"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[85vh] w-full max-w-4xl flex-col border border-stone-line-strong bg-charcoal"
            >
                <header className="flex shrink-0 items-center justify-between border-b border-stone-line px-6 py-4">
                    <div className="flex items-baseline gap-6">
                        <h2 className="font-serif text-lg font-light tracking-wide text-marble">Usage</h2>
                        <div className="flex border border-stone-line">
                            {(['session', 'archive'] as const).map((s, i) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setScope(s)}
                                    className={`px-3.5 py-1.5 font-sans text-[0.58rem] uppercase tracking-[0.24em] transition-colors duration-500 ease-mechanical ${
                                        i > 0 ? 'border-l border-stone-line' : ''
                                    } ${scope === s ? 'bg-charcoal-700 text-bronze-bright' : 'text-platinum hover:text-marble'}`}
                                >
                                    {s === 'session' ? 'This chat' : `Archive (${sessions.length})`}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="font-sans text-[0.6rem] uppercase tracking-[0.28em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:text-bronze-bright"
                    >
                        Close
                    </button>
                </header>

                <div className="flex-1 space-y-8 overflow-y-auto p-6">
                    {!total ? (
                        <p className="py-10 text-center font-serif text-lg font-light text-platinum-dim">
                            Nothing measured yet.
                        </p>
                    ) : (
                        <>
                            <Totals usage={total} label={scope === 'session' ? 'This chat' : 'All archived chats'} />

                            {/* per agent */}
                            <section>
                                <h3 className="font-sans text-[0.58rem] uppercase tracking-[0.32em] text-platinum-dim">
                                    By agent
                                </h3>
                                <div className="mt-3 overflow-x-auto">
                                    <table className="w-full border-collapse font-mono text-[0.68rem]">
                                        <thead>
                                            <tr className="border-b border-stone-line text-left font-sans text-[0.55rem] uppercase tracking-[0.2em] text-platinum-dim">
                                                <th className="py-2 pr-4 font-normal">Agent</th>
                                                <th className="py-2 pr-4 font-normal">Model</th>
                                                <th className="py-2 pr-4 text-right font-normal">Calls</th>
                                                <th className="py-2 pr-4 text-right font-normal">In</th>
                                                <th className="py-2 pr-4 text-right font-normal">Out</th>
                                                <th className="py-2 pr-4 text-right font-normal">Total</th>
                                                <th className="py-2 pr-4 text-right font-normal">Charged</th>
                                                <th className="w-24 py-2 font-normal">Share</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {perAgent.map((u, i) => (
                                                <tr key={i} className="border-b border-stone-line/60">
                                                    <td className="py-2.5 pr-4 font-sans text-[0.6rem] uppercase tracking-[0.2em] text-bronze-bright">
                                                        {AGENT_NAMES[i]}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-platinum-dim">
                                                        {u ? (u.model === 'mixed' ? 'mixed' : modelLabel(u.model)) : '—'}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-right text-platinum">
                                                        {callsForAgent(scoped, i) || '—'}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-right text-platinum">
                                                        {u ? u.promptTokens.toLocaleString() : '—'}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-right text-platinum">
                                                        {u ? u.completionTokens.toLocaleString() : '—'}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-right text-marble">
                                                        {u ? u.totalTokens.toLocaleString() : '—'}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-right text-bronze">
                                                        {u ? formatCost(u.cost) : '—'}
                                                    </td>
                                                    <td className="py-2.5 align-middle">
                                                        <ShareBar fraction={u && total.cost > 0 ? u.cost / total.cost : 0} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* per turn — only for the open chat; the archive view would be a wall */}
                            {scope === 'session' && (
                                <section>
                                    <h3 className="font-sans text-[0.58rem] uppercase tracking-[0.32em] text-platinum-dim">
                                        By turn
                                    </h3>
                                    <div className="mt-3 overflow-x-auto">
                                        <table className="w-full border-collapse font-mono text-[0.68rem]">
                                            <thead>
                                                <tr className="border-b border-stone-line text-left font-sans text-[0.55rem] uppercase tracking-[0.2em] text-platinum-dim">
                                                    <th className="py-2 pr-4 font-normal">#</th>
                                                    <th className="py-2 pr-4 font-normal">Question</th>
                                                    <th className="py-2 pr-4 text-right font-normal">Tokens</th>
                                                    <th className="py-2 text-right font-normal">Charged</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {turns.map((t, ti) => {
                                                    const u = sumUsage(t.responses.map((r) => r.usage));
                                                    return (
                                                        <tr key={ti} className="border-b border-stone-line/60">
                                                            <td className="py-2.5 pr-4 text-platinum-dim">
                                                                {t.round ? `R${t.round}` : ti + 1}
                                                            </td>
                                                            <td className="max-w-md truncate py-2.5 pr-4 font-serif text-sm text-marble-dim">
                                                                {t.question}
                                                            </td>
                                                            <td className="py-2.5 pr-4 text-right text-platinum">
                                                                {u ? formatTokens(u.totalTokens) : '—'}
                                                            </td>
                                                            <td className="py-2.5 text-right text-bronze">
                                                                {u ? formatCost(u.cost) : '—'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </div>

                <footer className="shrink-0 border-t border-stone-line px-6 py-3">
                    <p className="font-sans text-[0.58rem] uppercase tracking-[0.2em] text-platinum-dim">
                        {untracked
                            ? 'Charged as reported by OpenRouter · some responses predate usage tracking'
                            : 'Charged as reported by OpenRouter, not estimated from list prices'}
                    </p>
                </footer>
            </div>
        </div>
    );
}
