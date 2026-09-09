import Link from 'next/link';
import ParadigmTimeline from '@/app/components/ai/ParadigmTimeline';

// ─── paradigm data ────────────────────────────────────────────────────────────

const PARADIGMS = [
    {
        year: 2017,
        paradigm: 'Architecture',
        development: 'Transformer',
        change: 'Attention replaces recurrence as the architecture that can scale',
    },
    {
        year: 2018,
        paradigm: 'Pretraining',
        development: 'GPT / BERT',
        change: 'Train general language representations first, specialize afterward',
    },
    {
        year: 2019,
        paradigm: 'Generation',
        development: 'GPT-2 / scaling',
        change: 'General pretrained models become convincing generators rather than primarily representation systems',
    },
    {
        year: 2020,
        paradigm: 'Scale',
        development: 'GPT-3',
        change: 'Scaling produces emergent few-shot capabilities; prompting becomes an interface',
    },
    {
        year: 2021,
        paradigm: 'Creation',
        development: 'Codex / Copilot / DALL·E',
        change: 'Foundation models move beyond prose into code and images',
    },
    {
        year: 2022,
        paradigm: 'Interface',
        development: 'ChatGPT / diffusion',
        change: 'Generative AI becomes a mass-market product; natural language becomes the UI',
    },
    {
        year: 2023,
        paradigm: 'Frontier models',
        development: 'GPT-4 / Claude / Llama',
        change: 'Multimodality + stronger reasoning + open weights create a real model ecosystem',
    },
    {
        year: 2024,
        paradigm: 'Reasoning',
        development: 'o1 / test-time compute',
        change: 'Models begin spending compute after the prompt to solve harder problems',
    },
    {
        year: 2025,
        paradigm: 'Agents',
        development: 'Coding agents / computer use',
        change: 'Models stop merely answering and begin performing multi-step work',
    },
    {
        year: 2026,
        paradigm: 'Systems',
        development: 'Graph engineering',
        change: 'Focus moves from the intelligence of one agent to orchestration of many agents/tools/contexts',
    },
] as const;

const CURRENT_YEAR = 2026;

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
            <div className="mb-10">
                <div className="mb-3 flex flex-wrap items-baseline gap-x-8 gap-y-2">
                    <h1 className="font-serif text-2xl font-light tracking-[0.16em] text-marble">
                        AI
                    </h1>
                    <span className="font-mono text-[0.65rem] tracking-[0.2em] text-bronze">
                        Progress · Impact · Architecture · Systems
                    </span>
                </div>
                <p className="font-sans text-[0.6rem] uppercase tracking-[0.24em] text-platinum">
                    One paradigm per year · 2017–{CURRENT_YEAR}
                </p>
            </div>

            {/* paradigm timeline */}
            <ParadigmTimeline entries={PARADIGMS} currentYear={CURRENT_YEAR} />

            {/* footnote */}
            <p className="mt-6 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-stone-line-strong">
                2017–{CURRENT_YEAR} · one paradigm per year
            </p>

            {/* section nav — horizontal strip */}
            <div className="mt-16 flex border border-stone-line">
                {SECTIONS.map(({ href, label }, i) => (
                    <Link
                        key={href}
                        href={href}
                        className={[
                            'group flex flex-1 items-center justify-between px-5 py-3',
                            'transition-colors duration-300 ease-mechanical hover:bg-charcoal/40',
                            i < SECTIONS.length - 1 ? 'border-r border-stone-line' : '',
                        ].join(' ')}
                    >
                        <span className="font-serif text-sm font-light tracking-[0.08em] text-platinum transition-colors duration-300 group-hover:text-marble">
                            {label}
                        </span>
                        <svg
                            width="10" height="10" viewBox="0 0 12 12" fill="none"
                            aria-hidden
                            className="ml-3 shrink-0 text-stone-line-strong transition-colors duration-300 group-hover:text-platinum-dim"
                        >
                            <path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Link>
                ))}
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
