// app/ai/bottlenecks

import { BOTTLENECKS, SIXTH, type Bottleneck } from '@/lib/aiBottlenecks';

// ─── primitives ───────────────────────────────────────────────────────────────

function List({ label, items }: { label: string; items: string[] }) {
    return (
        <div>
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-bronze">
                {label}
            </p>
            <ul className="mt-3 space-y-2">
                {items.map((item) => (
                    <li key={item} className="flex gap-3">
                        <span aria-hidden className="mt-[0.45rem] h-px w-3 shrink-0 bg-stone-line-strong" />
                        <span className="font-sans text-[0.75rem] leading-6 tracking-[0.025em] text-platinum-dim">
                            {item}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function Entry({ entry, rank }: { entry: Bottleneck; rank: number }) {
    return (
        <section
            id={entry.id}
            className="border-b border-stone-line px-6 py-10 md:px-10 md:py-14 xl:px-14"
        >
            <div className="grid gap-8 lg:grid-cols-[17rem_1fr] lg:gap-12">

                {/* left rail — rank, name, status */}
                <div className="lg:sticky lg:top-8 lg:self-start">
                    <p className="font-mono text-[0.6rem] uppercase tracking-[0.24em] text-bronze">
                        {String(rank).padStart(2, '0')}
                    </p>
                    <h2 className="mt-3 font-serif text-2xl font-light leading-snug tracking-[0.06em] text-marble">
                        {entry.label}
                    </h2>
                    <p className="mt-4 border-t border-stone-line pt-4 font-mono text-[0.58rem] uppercase leading-5 tracking-[0.14em] text-stone-line-strong">
                        {entry.status}
                    </p>
                </div>

                {/* right — the argument */}
                <div className="space-y-8">
                    <div>
                        <p className="font-serif text-xl font-light leading-relaxed tracking-[0.04em] text-marble">
                            {entry.claim}
                        </p>
                        <p className="mt-4 max-w-2xl font-sans text-[0.8rem] leading-7 tracking-[0.025em] text-platinum-dim">
                            {entry.constraint}
                        </p>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-2">
                        <List label="Where it decomposes" items={entry.components} />
                        <List label="What would relieve it" items={entry.relief} />
                    </div>

                    <div className="border-l-2 border-bronze-dim bg-obsidian/30 py-4 pl-5">
                        <p className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-bronze">
                            {entry.rule.label}
                        </p>
                        <p className="mt-2 font-sans text-[0.75rem] leading-6 tracking-[0.025em] text-platinum-dim">
                            {entry.rule.text}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export const metadata = {
    title: 'Bottlenecks · Kyros',
    description: 'The five constraints currently binding on AI progress.',
};

export default function AIBottlenecksPage() {
    return (
        <div className="min-h-[calc(100svh-4rem-1px)]">

            <header className="border-b border-stone-line px-6 py-5 md:px-10 xl:px-14">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="font-mono text-[0.6rem] uppercase tracking-[0.24em] text-bronze">
                            AI · Bottlenecks
                        </p>
                        <h1 className="mt-2 font-serif text-2xl font-light tracking-[0.16em] text-marble md:text-3xl">
                            WHAT IS BINDING
                        </h1>
                    </div>
                    <p className="max-w-sm font-sans text-[0.72rem] leading-6 tracking-[0.04em] text-platinum-dim md:text-right">
                        A candidate that relieves none of these is unlikely to matter, however elegant.
                    </p>
                </div>
            </header>

            <main>

                {/* orientation */}
                <section className="border-b border-stone-line px-6 py-8 md:px-10 md:py-10 xl:px-14">
                    <p className="max-w-3xl font-sans text-[0.8rem] leading-7 tracking-[0.025em] text-platinum-dim">
                        Five constraints, ordered outward — from what the model itself cannot do,
                        through what it is built from, to what the world has not yet reorganised to
                        absorb. This is not a difficulty ranking: compute is the hardest to relieve
                        and sits fourth. A sixth constraint, agency, is recorded at the foot of the
                        page because it is the only one whose status is no longer binding.
                    </p>
                </section>

                {BOTTLENECKS.map((entry, i) => (
                    <Entry key={entry.id} entry={entry} rank={i + 1} />
                ))}

                {/* the sixth */}
                <section className="border-b border-stone-line px-6 py-10 md:px-10 md:py-12 xl:px-14">
                    <div className="grid gap-8 lg:grid-cols-[17rem_1fr] lg:gap-12">
                        <div>
                            <p className="font-mono text-[0.6rem] uppercase tracking-[0.24em] text-stone-line-strong">
                                The sixth
                            </p>
                            <h2 className="mt-3 font-serif text-xl font-light leading-snug tracking-[0.06em] text-platinum">
                                {SIXTH.label}
                            </h2>
                            <p className="mt-4 border-t border-stone-line pt-4 font-mono text-[0.58rem] uppercase leading-5 tracking-[0.14em] text-stone-line-strong">
                                {SIXTH.status}
                            </p>
                        </div>

                        <div className="space-y-5">
                            <p className="max-w-2xl font-sans text-[0.8rem] leading-7 tracking-[0.025em] text-platinum-dim">
                                {SIXTH.text}
                            </p>
                            <div className="border-l-2 border-stone-line py-3 pl-5">
                                <p className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-bronze">
                                    Guard
                                </p>
                                <p className="mt-2 font-sans text-[0.75rem] leading-6 tracking-[0.025em] text-platinum-dim">
                                    {SIXTH.guard}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="px-6 py-8 md:px-10 xl:px-14">
                    <p className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-stone-line-strong">
                        Source · context/ai/bottlenecks
                    </p>
                </section>

            </main>
        </div>
    );
}
