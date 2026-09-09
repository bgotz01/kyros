export default function EngineCapitalPage() {
    return (
        <div className="mx-auto w-full max-w-[960px] px-8 py-20">

            {/* header */}
            <div className="mb-16">
                <div className="mb-4 flex flex-wrap items-baseline gap-x-8 gap-y-2">
                    <h1 className="font-serif text-5xl font-light tracking-[0.12em] text-marble">
                        Capital
                    </h1>
                    <span className="font-mono text-[0.65rem] tracking-[0.2em] text-bronze">
                        Engine · y = I³
                    </span>
                </div>
                <p className="font-sans text-[0.72rem] uppercase tracking-[0.26em] text-platinum-dim">
                    Markets · Macro · Geopolitics · FX
                </p>
            </div>

            {/* placeholder */}
            <div className="border border-stone-line px-8 py-12">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-stone-line-strong">
                    Coming soon
                </p>
                <p className="mt-4 font-sans text-[0.75rem] leading-relaxed tracking-[0.04em] text-platinum-dim">
                    Apply the I³ engine to macro events, central bank decisions, and
                    capital-flow inflection points across markets and geographies.
                </p>
            </div>

        </div>
    );
}
