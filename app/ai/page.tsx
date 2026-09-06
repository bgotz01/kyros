import Link from 'next/link';

// ─── nav cards ────────────────────────────────────────────────────────────────

const SECTIONS = [
    {
        href: '/ai/progress',
        label: 'Progress',
        description: 'One paradigm per year — from the Transformer to graph-orchestrated systems.',
        meta: '2017 · 2018 · 2019 · 2020 · 2021 · 2022 · 2023 · 2024 · 2025 · 2026',
    },
    {
        href: '/ai/impact',
        label: 'Impact',
        description: 'Score and chart paradigm-defining AI developments using the I³ framework.',
        meta: 'Inversion · Incentives · Inflection',
    },
    {
        href: '/ai/architecture',
        label: 'Architecture',
        description: 'Tokens to transformers, attention to MoE — the conceptual stack behind large language models.',
        meta: 'Representation · Architecture · Training · Inference · Systems',
    },
    {
        href: '/ai/systems',
        label: 'Systems',
        description: 'How models are composed into agents, tools, memory, and retrieval pipelines.',
        meta: 'Knowledge · Execution · Autonomy · Composition',
    },
    {
        href: '/ai/apps',
        label: 'Apps',
        description: 'The application layer — the assistants, platforms, open source and apps people actually use.',
        meta: 'Assistants · Platforms · Open source · Apps',
    },
    {
        href: '/ai/bottlenecks',
        label: 'Bottlenecks',
        description: 'The five constraints currently binding on progress, and what would relieve each one.',
        meta: 'Reliability · Memory · Data · Compute · Diffusion',
    },
] as const;

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AIPage() {
    return (
        <div className="mx-auto w-full max-w-[960px] px-8 py-20">

            {/* header */}
            <div className="mb-20">
                <h1 className="font-serif text-5xl font-light tracking-[0.12em] text-marble">
                    AI
                </h1>
            </div>

            {/* section cards */}
            <div className="grid gap-px border border-stone-line bg-stone-line sm:grid-cols-2 lg:grid-cols-3">
                {SECTIONS.map(({ href, label, description, meta }) => (
                    <Link
                        key={href}
                        href={href}
                        className="group flex flex-col gap-6 bg-charcoal px-7 py-8 transition-colors duration-500 ease-mechanical hover:bg-obsidian"
                    >
                        <div className="flex items-start justify-between">
                            <h2 className="font-serif text-lg font-light tracking-[0.1em] text-marble">
                                {label}
                            </h2>
                            <svg
                                width="12" height="12" viewBox="0 0 12 12" fill="none"
                                aria-hidden
                                className="mt-1 shrink-0 text-stone-line-strong transition-colors duration-300 group-hover:text-platinum-dim"
                            >
                                <path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>

                        <p className="font-sans text-[0.72rem] leading-relaxed tracking-[0.04em] text-platinum-dim">
                            {description}
                        </p>

                        <span className="mt-auto font-mono text-[0.58rem] uppercase tracking-[0.16em] text-stone-line-strong transition-colors duration-300 group-hover:text-platinum-dim">
                            {meta}
                        </span>
                    </Link>
                ))}

                {/* Six cards across a 2- or 3-column grid leaves no remainder,
                    so no filler cell is needed. */}
            </div>

            {/* divider + framing text */}
            <div className="mt-24 border-t border-stone-line pt-16">
                <div className="grid gap-12 sm:grid-cols-2">
                    <div>
                        <h3 className="mb-4 font-sans text-[0.72rem] uppercase tracking-[0.28em] text-platinum-dim">
                            The question
                        </h3>
                        <p className="font-serif text-xl font-light leading-relaxed tracking-[0.04em] text-marble">
                            Which developments permanently alter the trajectory of AI — and what changes because of them?
                        </p>
                    </div>
                    <div className="flex flex-col gap-6">
                        {[
                            { label: 'Inversion', text: 'Which prior assumption no longer holds?' },
                            { label: 'Incentives', text: 'Why will this spread and compound?' },
                            { label: 'Inflection', text: 'Is this a genuine turning point?' },
                        ].map(({ label, text }) => (
                            <div key={label} className="flex gap-4">
                                <span className="mt-0.5 shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-bronze">
                                    {label}
                                </span>
                                <p className="font-sans text-[0.75rem] leading-relaxed tracking-[0.04em] text-platinum-dim">
                                    {text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
}
