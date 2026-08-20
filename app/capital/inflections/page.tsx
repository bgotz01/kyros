import { INFLECTION_DECADES } from '@/lib/capital/inflections';

export default function InflectionPage() {
    return (
        <div className="mx-auto w-full max-w-[1100px] px-8 py-20">

            {/* ── header ──────────────────────────────────────────────────────── */}
            <div className="mb-16">
                <div className="mb-6 flex flex-wrap items-baseline gap-x-8 gap-y-3">
                    <h1 className="font-serif text-5xl font-light tracking-[0.12em] text-marble">
                        Inflection Points
                    </h1>
                </div>
                <p className="font-sans text-[0.85rem] uppercase tracking-[0.28em] text-platinum-dim">
                    What broke — and why it changed where capital could go
                </p>
            </div>

            {/* ── narrative layout ─────────────────────────────────────────────── */}
            <div className="flex flex-col">
                {INFLECTION_DECADES.map(({ decade, events }, idx) => (
                    <div key={decade} className={idx !== 0 ? 'border-t border-stone-line pt-16 mt-0 pb-16' : 'pb-16'}>
                        {/* decade label */}
                        <p className="mb-6 font-mono text-[0.72rem] tracking-[0.18em] text-bronze">
                            {decade}
                        </p>

                        {/* events */}
                        <div className="flex flex-col gap-8">
                            {events.map((event, i) => (
                                <div key={i} className="flex flex-col gap-3">
                                    {/* event title */}
                                    <p className="font-sans text-[0.72rem] uppercase tracking-[0.18em] text-platinum-dim">
                                        <span className="text-platinum-dim">Event</span>
                                        <span className="mx-2 text-stone-line-strong">·</span>
                                        <span className="text-marble">{event.title}</span>
                                    </p>

                                    {/* why it mattered */}
                                    <p className="max-w-[68ch] font-sans text-[0.82rem] leading-[1.85] tracking-[0.02em] text-platinum">
                                        {event.significance}
                                    </p>

                                    {/* consequence chain */}
                                    <div className="mt-1 flex flex-col gap-1 border-l border-stone-line pl-5">
                                        {event.chain.map((line, j) => (
                                            <div key={j} className="flex items-baseline gap-3">
                                                <span className="shrink-0 font-mono text-[0.68rem] tracking-[0.08em] text-bronze-bright">
                                                    →
                                                </span>
                                                <span
                                                    className={[
                                                        'font-sans text-[0.78rem] leading-relaxed tracking-[0.04em]',
                                                        j === event.chain.length - 1
                                                            ? 'text-bronze-bright'
                                                            : 'text-platinum',
                                                    ].join(' ')}
                                                >
                                                    {line}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}
