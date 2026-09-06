'use client';

// ─── week header ──────────────────────────────────────────────────────────────
// What is being read, how far it has got, and the passes that can be started
// over the whole week. The batch buttons are the only place spend is committed
// in bulk, so each says how much work it is about to do.

import type { WeekRow } from '@/lib/engineData';
import type { StoredRun } from '@/lib/engineStore';

export default function EngineHeader({
    week,
    run,
    running,
    loading,
    scorable,
    done,
    spend,
    openFlags,
    pendingExternal,
    pendingCritique,
    criticOn,
    onParadigm,
    onRunWeek,
    onRunCritic,
    onRunExternal,
    onStop,
}: {
    week: WeekRow | null;
    run: StoredRun | null;
    running: null | 'analyst' | 'critic' | 'external';
    loading: boolean;
    scorable: number;
    done: number;
    spend: number;
    openFlags: number;
    pendingExternal: number;
    pendingCritique: number;
    criticOn: boolean;
    onParadigm: () => void;
    onRunWeek: () => void;
    onRunCritic: () => void;
    onRunExternal: () => void;
    onStop: () => void;
}) {
    return (
                <header className="sticky top-0 z-10 flex flex-wrap items-end justify-between gap-4 border-b border-stone-line bg-obsidian px-8 py-6 relative">
                    <div>
                        <h1 className="font-serif text-2xl font-light tracking-[0.12em] text-marble">
                            {week ? week.heading.replace(/^\(|\)$/g, '') : 'Engine'}
                        </h1>
                        <p className="mt-1 font-mono text-[0.55rem] tracking-[0.14em] text-platinum-dim">
                            {running === 'critic'
                                ? 'CHALLENGING…'
                                : running === 'external'
                                  ? 'LOOKING UP…'
                                  : loading
                                    ? 'LOADING RUN…'
                                    : week
                                      ? `${scorable} SCORABLE · ${week.papers.length} IN THE WEEK · ${done} SCORED`
                                      : 'SELECT A WEEK'}
                            {openFlags > 0 && ` · ${openFlags} FLAGGED`}
                            {spend > 0 && ` · $${spend.toFixed(4)}`}
                        </p>

                        {/* Provenance of the stored run. Which models read it and
                            which version of the frame they read it against — a
                            score made against a different §2 is not comparable. */}
                        {run && !running && (
                            <p className="mt-1 font-mono text-[0.52rem] tracking-[0.12em] text-platinum-dim/70">
                                SAVED {new Date(run.startedAt).toLocaleDateString(undefined, {
                                    day: 'numeric',
                                    month: 'short',
                                })}
                                {' · '}
                                {run.analystModel.split('/').pop()?.toUpperCase()}
                                {run.criticModel && ` ⁄ ${run.criticModel.split('/').pop()?.toUpperCase()}`}
                                {run.frameReviewedAt && ` · FRAME ${run.frameReviewedAt}`}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* What I¹ is measured against. A score is not readable
                            without the frame it was scored under, so the frame
                            sits beside the controls that produce scores. */}
                        <button
                            type="button"
                            onClick={onParadigm}
                            className="border border-stone-line px-3 py-2 font-sans text-[0.6rem] uppercase tracking-[0.24em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:border-bronze hover:text-bronze-bright"
                        >
                            Paradigm snapshot
                        </button>
                        <button
                            type="button"
                            onClick={running === 'analyst' ? onStop : onRunWeek}
                            disabled={running === 'critic' || (!running && scorable === 0)}
                            className={`border px-4 py-2 font-sans text-[0.6rem] uppercase tracking-[0.24em] transition-colors duration-500 ease-mechanical disabled:cursor-not-allowed disabled:opacity-30 ${
                                running === 'analyst'
                                    ? 'border-halt bg-halt/10 text-halt-bright hover:border-halt-bright'
                                    : 'border-stone-line text-platinum hover:border-bronze hover:text-bronze-bright'
                            }`}
                        >
                            {running === 'analyst' ? 'Stop' : 'Run batch'}
                        </button>

                        {pendingExternal > 0 && (
                            <button
                                type="button"
                                onClick={running === 'external' ? onStop : onRunExternal}
                                disabled={running === 'analyst' || running === 'critic'}
                                title={`Look up ${pendingExternal} on GitHub`}
                                className={`border px-4 py-2 font-sans text-[0.6rem] uppercase tracking-[0.24em] transition-colors duration-500 ease-mechanical disabled:cursor-not-allowed disabled:border-stone-line disabled:text-platinum-dim disabled:opacity-40 ${
                                    running === 'external'
                                        ? 'border-halt bg-halt/10 text-halt-bright hover:border-halt-bright'
                                        : 'border-stone-line text-platinum hover:border-bronze hover:text-bronze-bright'
                                }`}
                            >
                                {running === 'external' ? 'Stop' : `External · ${pendingExternal}`}
                            </button>
                        )}

                        {/* The second pass. Only offered once there are scores to
                            challenge, and it never re-charges for one already done. */}
                        {done > 0 && (
                            <button
                                type="button"
                                onClick={running === 'critic' ? onStop : onRunCritic}
                                disabled={
                                    running === 'analyst' ||
                                    (!running && (!criticOn || pendingCritique === 0))
                                }
                                title={
                                    !criticOn
                                        ? 'Critic is off'
                                        : pendingCritique === 0
                                          ? 'Every score has been challenged'
                                          : `Challenge ${pendingCritique} scored ${pendingCritique === 1 ? 'paper' : 'papers'}`
                                }
                                className={`border px-4 py-2 font-sans text-[0.6rem] uppercase tracking-[0.24em] transition-colors duration-500 ease-mechanical disabled:cursor-not-allowed disabled:border-stone-line disabled:text-platinum-dim disabled:opacity-40 ${
                                    running === 'critic'
                                        ? 'border-halt bg-halt/10 text-halt-bright hover:border-halt-bright'
                                        : 'border-bronze-dim text-bronze hover:border-bronze hover:text-bronze-bright'
                                }`}
                            >
                                {running === 'critic'
                                    ? 'Stop'
                                    : pendingCritique > 0
                                      ? `Critic batch · ${pendingCritique}`
                                      : 'Critic done'}
                            </button>
                        )}
                    </div>
                    {/* The instrument is working. */}
                    {running && (
                        <div className="kyros-sweep absolute inset-x-0 bottom-0 h-px w-full bg-stone-line" />
                    )}
                </header>
    );
}
