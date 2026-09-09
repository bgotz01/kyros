import Link from 'next/link';

const SECTIONS = [
    {
        href: '/engine/ai',
        label: 'AI',
        description: 'Score paradigm-defining AI papers each week using the I³ framework — analyst, critic, and external evidence in a single workflow.',
        meta: 'Papers · Analyst · Critic · External',
        available: true,
    },
    {
        href: '/engine/capital',
        label: 'Capital',
        description: 'Apply the engine to macro events, central bank decisions, and capital-flow inflection points across markets and geographies.',
        meta: 'Markets · Macro · Geopolitics · FX',
        available: false,
    },
    {
        href: '/engine/blockchain',
        label: 'Blockchain',
        description: 'Track on-chain developments, protocol upgrades, and cycle events through the same I³ scoring lens.',
        meta: 'Protocols · Cycles · On-chain · Regulation',
        available: false,
    },
] as const;

export default function EngineIndex() {
    return (
        <div className="mx-auto w-full max-w-[960px] px-8 py-20">

            {/* header */}
            <div className="mb-16">
                <div className="mb-4 flex flex-wrap items-baseline gap-x-8 gap-y-2">
                    <h1 className="font-serif text-5xl font-light tracking-[0.12em] text-marble">
                        Engine
                    </h1>
                    <span className="font-mono text-[0.65rem] tracking-[0.2em] text-bronze">
                        y = I³
                    </span>
                </div>
                <p className="font-sans text-[0.72rem] uppercase tracking-[0.26em] text-platinum-dim">
                    Score paradigm-defining events across domains
                </p>
            </div>

            {/* domain cards */}
            <div className="flex flex-col divide-y divide-stone-line border border-stone-line">
                {SECTIONS.map(({ href, label, description, meta, available }) => (
                    available ? (
                        <Link
                            key={href}
                            href={href}
                            className="group flex items-start justify-between gap-8 px-8 py-7 transition-colors duration-300 ease-mechanical hover:bg-charcoal/40"
                        >
                            <div className="flex min-w-0 flex-1 flex-col gap-2">
                                <div className="flex items-baseline gap-5">
                                    <span className="font-serif text-xl font-light tracking-[0.08em] text-marble transition-colors duration-300 group-hover:text-marble">
                                        {label}
                                    </span>
                                    <span className="font-mono text-[0.6rem] tracking-[0.18em] text-stone-line-strong">
                                        {meta}
                                    </span>
                                </div>
                                <p className="font-sans text-[0.72rem] leading-relaxed tracking-[0.04em] text-platinum-dim">
                                    {description}
                                </p>
                            </div>
                            <svg
                                width="11" height="11" viewBox="0 0 12 12" fill="none"
                                aria-hidden
                                className="mt-1.5 shrink-0 text-stone-line-strong transition-colors duration-300 group-hover:text-platinum-dim"
                            >
                                <path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Link>
                    ) : (
                        <div
                            key={href}
                            className="flex items-start justify-between gap-8 px-8 py-7 opacity-40"
                        >
                            <div className="flex min-w-0 flex-1 flex-col gap-2">
                                <div className="flex items-baseline gap-5">
                                    <span className="font-serif text-xl font-light tracking-[0.08em] text-marble">
                                        {label}
                                    </span>
                                    <span className="font-mono text-[0.6rem] tracking-[0.18em] text-stone-line-strong">
                                        {meta}
                                    </span>
                                </div>
                                <p className="font-sans text-[0.72rem] leading-relaxed tracking-[0.04em] text-platinum-dim">
                                    {description}
                                </p>
                            </div>
                            <span className="mt-1.5 shrink-0 font-mono text-[0.58rem] tracking-[0.18em] text-stone-line-strong">
                                soon
                            </span>
                        </div>
                    )
                ))}
            </div>

            {/* I³ gloss */}
            <div className="mt-20 grid gap-8 border-t border-stone-line pt-14 sm:grid-cols-3">
                {[
                    { label: 'I¹ · Inversion', text: 'Which prior assumption no longer holds?' },
                    { label: 'I² · Incentives', text: 'Why will this spread and compound?' },
                    { label: 'I³ · Inflection', text: 'Is this a genuine turning point?' },
                ].map(({ label, text }) => (
                    <div key={label} className="flex flex-col gap-2">
                        <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-bronze">
                            {label}
                        </span>
                        <p className="font-sans text-[0.72rem] leading-relaxed tracking-[0.04em] text-platinum-dim">
                            {text}
                        </p>
                    </div>
                ))}
            </div>

        </div>
    );
}
