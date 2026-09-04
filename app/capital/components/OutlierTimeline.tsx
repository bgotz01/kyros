// capital/components/OutlierTimeline.tsx

const EVENTS = [
    {
        decade: "1950s",
        year: "1945",
        event: "End of WWII",
        shift: "Destruction → Reconstruction",
    },
    {
        decade: "1960s",
        year: "1960s",
        event: "Trade Liberalisation",
        shift: "Domestic → Global",
    },
    {
        decade: "1970s",
        year: "1971",
        event: "Gold Depeg",
        shift: "Bretton Woods → Fiat",
    },
    {
        decade: "1980s",
        year: "1979–82",
        event: "Volcker Shock",
        shift: "Inflation → Disinflation",
    },
    {
        decade: "1990s",
        year: "1989–91",
        event: "World Wide Web",
        shift: "Physical → Digital",
    },
    {
        decade: "2000s",
        year: "2001",
        event: "China Joins WTO",
        shift: "West → Globalisation",
    },
    {
        decade: "2010s",
        year: "2008–12",
        event: "Global QE",
        shift: "Scarce Capital → Cheap Capital",
    },
    {
        decade: "2020s",
        year: "2022–23",
        event: "Generative AI",
        shift: "Platforms → Compute",
    },
];

export default function OutlierTimeline() {
    return (
        <section className="w-full">
            <div className="mb-8 text-center">
                <h2 className="font-serif text-[1.8rem] font-light tracking-[0.04em] text-marble">
                    Outlier Events
                </h2>

                <p className="mt-2 font-sans text-[0.62rem] uppercase tracking-[0.22em] text-bronze">
                    The events that reset capital leadership
                </p>
            </div>

            <div className="-mx-8 overflow-x-auto px-8 pb-2">
                <div className="flex min-w-max">
                    {EVENTS.map((d, index) => (
                        <div
                            key={d.decade}
                            className="group relative w-[152px] shrink-0 text-center"
                        >
                            {/* Decade */}
                            <span className="block font-serif text-[1rem] font-light text-bronze">
                                {d.decade}
                            </span>

                            {/* Event */}
                            <div className="mt-4 flex min-h-[4.5rem] flex-col items-center justify-end px-3">
                                <span className="font-serif text-[1.05rem] font-light leading-[1.2] text-marble">
                                    {d.event}
                                </span>

                                <span className="mt-1.5 font-mono text-[0.5rem] tracking-[0.16em] text-bronze">
                                    {d.year}
                                </span>
                            </div>

                            {/* Timeline */}
                            <div className="relative mt-4 h-5">
                                <span className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-stone-line" />

                                <span
                                    aria-hidden
                                    className="absolute left-1/2 top-1/2 h-[8px] w-[8px] -translate-x-1/2 -translate-y-1/2 rotate-45 border border-bronze bg-obsidian"
                                />

                                {index === EVENTS.length - 1 && (
                                    <span
                                        aria-hidden
                                        className="absolute right-0 top-1/2 -translate-y-1/2 text-bronze"
                                    >
                                        →
                                    </span>
                                )}
                            </div>

                            {/* Paradigm shift */}
                            <div className="mt-4 border-r border-stone-line px-3">
                                <span className="block font-sans text-[0.46rem] uppercase tracking-[0.15em] text-platinum-dim">
                                    Shift
                                </span>

                                <span className="mt-2 block font-serif text-[0.8rem] font-light leading-[1.35] text-platinum">
                                    {d.shift}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}