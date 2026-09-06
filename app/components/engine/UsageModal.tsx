'use client';

import { useEffect, useState } from 'react';
import { MODELS } from '@/lib/models';
import type { UsageReport, UsageTotals } from '@/app/api/engine/usage/route';

function modelLabel(id: string): string {
    return MODELS.find((m) => m.id === id)?.label ?? id;
}

function tokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
}

function cost(n: number): string {
    if (n === 0) return '$0.00';
    return n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
}

function Totals({ label, usage, accent }: { label: string; usage: UsageTotals; accent?: boolean }) {
    const cells: [string, string][] = [
        ['prompt', tokens(usage.promptTokens)],
        ['completion', tokens(usage.completionTokens)],
        ['calls', String(usage.calls)],
        ['charged', cost(usage.cost)],
    ];
    return (
        <section>
            <h3 className="font-sans text-[0.55rem] uppercase tracking-[0.3em] text-platinum-dim">{label}</h3>
            <dl className="mt-2.5 grid grid-cols-2 gap-px border border-stone-line bg-stone-line sm:grid-cols-4">
                {cells.map(([k, v], i) => (
                    <div key={k} className="bg-obsidian px-4 py-3">
                        <dt className="font-sans text-[0.52rem] uppercase tracking-[0.24em] text-platinum-dim">
                            {k}
                        </dt>
                        <dd
                            className={`mt-1.5 font-mono text-sm ${
                                i === cells.length - 1
                                    ? accent
                                        ? 'text-bronze-bright'
                                        : 'text-bronze'
                                    : 'text-marble'
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

/** A hairline showing one row's share of total spend. */
function Share({ fraction }: { fraction: number }) {
    return (
        <span aria-hidden className="block h-px w-full bg-stone-line">
            <span
                className="block h-px bg-bronze-dim transition-[width] duration-700 ease-mechanical"
                style={{ width: `${Math.round(fraction * 100)}%` }}
            />
        </span>
    );
}

export default function UsageModal({ domain, onClose }: { domain: string; onClose: () => void }) {
    const [report, setReport] = useState<UsageReport | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', fn);
        return () => window.removeEventListener('keydown', fn);
    }, [onClose]);

    useEffect(() => {
        fetch(`/api/engine/usage?domain=${domain}`)
            .then((r) => r.json())
            .then((d: UsageReport) => setReport(d))
            .catch(() => setError(true));
    }, [domain]);

    const max = report ? Math.max(...report.byModel.map((m) => m.cost), 0.0001) : 1;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/85 px-6 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal
            aria-label="Engine usage"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[85vh] w-full max-w-2xl flex-col border border-stone-line-strong bg-charcoal"
            >
                <header className="flex shrink-0 items-center justify-between border-b border-stone-line px-6 py-4">
                    <div className="flex items-baseline gap-3">
                        <h2 className="font-serif text-lg font-light tracking-wide text-marble">Usage</h2>
                        <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-platinum-dim">
                            {report ? `${report.runs} runs · ${domain}` : domain}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="font-sans text-[0.6rem] uppercase tracking-[0.28em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:text-bronze-bright"
                    >
                        Close
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto">
                    {error && (
                        <p className="px-6 py-6 font-sans text-[0.7rem] tracking-[0.03em] text-platinum-dim">
                            Could not read usage.
                        </p>
                    )}

                    {!report && !error && (
                        <p className="px-6 py-6 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-platinum-dim">
                            Reading…
                        </p>
                    )}

                    {report && report.runs === 0 && (
                        <p className="px-6 py-6 font-sans text-[0.7rem] tracking-[0.03em] text-platinum-dim">
                            Nothing run yet.
                        </p>
                    )}

                    {report && report.runs > 0 && (
                        <>
                            <div className="flex flex-col gap-5 border-b border-stone-line px-6 py-5">
                                <Totals label="All time" usage={report.total} accent />
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <Totals label="Analyst" usage={report.analyst} />
                                    <Totals label="Critic" usage={report.critic} />
                                </div>
                            </div>

                            <div className="border-b border-stone-line px-6 py-5">
                                <h3 className="mb-3 font-sans text-[0.55rem] uppercase tracking-[0.3em] text-platinum-dim">
                                    By model
                                </h3>
                                <div className="flex flex-col gap-3">
                                    {report.byModel.map((m) => (
                                        <div key={`${m.seat}:${m.model}`} className="flex flex-col gap-1.5">
                                            <div className="flex items-baseline justify-between gap-3">
                                                <span className="truncate font-mono text-[0.6rem] uppercase tracking-[0.12em] text-marble-dim">
                                                    {modelLabel(m.model)}
                                                    <span className="ml-2 text-platinum-dim">{m.seat}</span>
                                                </span>
                                                <span className="shrink-0 font-mono text-[0.6rem] tracking-[0.08em] text-platinum-dim">
                                                    {tokens(m.totalTokens)} · {m.calls} calls ·{' '}
                                                    <span className="text-bronze">{cost(m.cost)}</span>
                                                </span>
                                            </div>
                                            <Share fraction={m.cost / max} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="px-6 py-5">
                                <h3 className="mb-3 font-sans text-[0.55rem] uppercase tracking-[0.3em] text-platinum-dim">
                                    By week
                                </h3>
                                <div className="divide-y divide-stone-line border border-stone-line">
                                    {report.byWeek.map((w) => (
                                        <div
                                            key={`${w.year}:${w.weekIdx}`}
                                            className="flex items-baseline justify-between gap-3 px-3 py-2"
                                        >
                                            <span className="truncate font-sans text-[0.66rem] tracking-[0.03em] text-platinum">
                                                {w.heading.replace(/^\(|\)\s*-\s*\d{4}$/g, '')}
                                            </span>
                                            <span className="shrink-0 font-mono text-[0.58rem] tracking-[0.08em] text-platinum-dim">
                                                {w.papers} papers · {tokens(w.totalTokens)} ·{' '}
                                                <span className="text-bronze">{cost(w.cost)}</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
