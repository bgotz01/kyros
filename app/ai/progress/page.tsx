'use client';

// ─── I³ chain data ────────────────────────────────────────────────────────────

const I3_CHAIN = [
    {
        year: null,
        yearLabel: 'Pre-2017',
        frontier: 'Deep learning · CNNs · RNNs/LSTMs · seq2seq · attention · GPUs · AlphaGo',
        i3: { title: 'Deep learning', body: 'neural networks learn increasingly complex representations and sequences' },
        i2: 'Make neural networks more scalable and capable of handling long-range relationships',
        i1: { from: 'Sequential / recurrent', to: 'parallel / attention-based' },
    },
    {
        year: 2017,
        yearLabel: '2017',
        frontier: 'Transformer · Attention Is All You Need',
        i3: { title: 'Transformer', body: '' },
        i2: 'Train the scalable architecture on vastly more language',
        i1: { from: 'Task-specific', to: 'general pretraining' },
    },
    {
        year: 2018,
        yearLabel: '2018',
        frontier: 'GPT-1 · BERT',
        i3: { title: 'Pretraining', body: '' },
        i2: 'Use general learned representations to generate',
        i1: { from: 'Representation', to: 'generation' },
    },
    {
        year: 2019,
        yearLabel: '2019',
        frontier: 'GPT-2 · 1.5B parameters',
        i3: { title: 'Generation', body: '' },
        i2: 'Make the same approach dramatically more capable',
        i1: { from: 'Better recipe', to: 'more scale' },
    },
    {
        year: 2020,
        yearLabel: '2020',
        frontier: 'GPT-3 · 175B · API · few-shot prompting',
        i3: { title: 'Scaling', body: '' },
        i2: 'Extend the approach beyond ordinary language',
        i1: { from: 'Text', to: 'multiple domains/modalities' },
    },
    {
        year: 2021,
        yearLabel: '2021',
        frontier: 'Codex · Copilot · DALL·E · CLIP',
        i3: { title: 'Generative expansion', body: '' },
        i2: 'Make all these capabilities easy for ordinary people to access',
        i1: { from: 'Specialized interfaces', to: 'natural language' },
    },
    {
        year: 2022,
        yearLabel: '2022',
        frontier: 'ChatGPT · GPT-3.5 · DALL·E 2 · Stable Diffusion · Midjourney',
        i3: { title: 'Conversation', body: '' },
        i2: 'Make the conversational system substantially more capable',
        i1: { from: 'Access', to: 'intelligence' },
    },
    {
        year: 2023,
        yearLabel: '2023',
        frontier: 'GPT-4 · Claude · Gemini · Llama · GPT-4V · 100K context · plugins',
        i3: { title: 'Frontier intelligence', body: '' },
        i2: 'Let models spend more computation solving difficult problems',
        i1: { from: 'Training compute', to: 'inference compute' },
    },
    {
        year: 2024,
        yearLabel: '2024',
        frontier: 'o1 · Claude 3.5 · Gemini 1.5 · 1M+ context · realtime multimodal · computer use',
        i3: { title: 'Reasoning', body: '' },
        i2: 'Let the model execute its reasoning',
        i1: { from: 'Think', to: 'act' },
    },
    {
        year: 2025,
        yearLabel: '2025',
        frontier: 'Claude Code · Codex · Cursor · MCP · Deep Research · computer agents',
        i3: { title: 'Agents', body: '' },
        i2: 'Coordinate agents, tools and context into larger systems',
        i1: { from: 'Individual', to: 'system' },
    },
    {
        year: 2026,
        yearLabel: '2026',
        frontier: 'Agent graphs · context graphs · persistent context · long-running agents',
        i3: { title: 'Graphs', body: '' },
        i2: 'Let systems determine their own decomposition and organization',
        i1: { from: 'Designed', to: 'self-organizing' },
    },
];

const CURRENT_YEAR = 2026;

// ─── helpers ──────────────────────────────────────────────────────────────────

function rowState(year: number): 'past' | 'current' | 'future' {
    if (year < CURRENT_YEAR) return 'past';
    if (year === CURRENT_YEAR) return 'current';
    return 'future';
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AIProgressPage() {
    return (
        <div className="mx-auto w-full max-w-[960px] px-8 py-20">

            {/* header */}
            <div className="mb-16">
                <h1 className="font-serif text-5xl font-light tracking-[0.12em] text-marble">
                    Progress
                </h1>
                <p className="mt-5 font-sans text-[0.75rem] leading-relaxed tracking-[0.06em] text-platinum-dim">
                    One paradigm per year. Each row names the shift, the development that embodied it, and what actually changed.
                </p>
            </div>

            {/* ── I³ chain table ──────────────────────────────────────────── */}
            <div>
                <div className="mb-10">
                    <h2 className="font-serif text-2xl font-light tracking-[0.12em] text-marble">
                        The I³ chain
                    </h2>
                    <p className="mt-4 font-sans text-[0.75rem] leading-relaxed tracking-[0.06em] text-platinum-dim">
                        Each year&apos;s accomplishment made the next step obvious — and each step inverted the assumption beneath the one before it.
                    </p>
                </div>

                <div className="border border-stone-line">

                    {/* column headers */}
                    <div className="grid grid-cols-[5rem_2fr_1.2fr_1.6fr_1.4fr] border-b border-stone-line-strong">
                        {[
                            { label: 'Year', sub: '' },
                            { label: '', sub: 'Product frontier' },
                            { label: 'I³', sub: 'Accomplishment' },
                            { label: 'I²', sub: 'Obvious' },
                            { label: 'I¹', sub: 'Inversion' },
                        ].map(({ label, sub }, i) => (
                            <div key={i} className="flex items-baseline gap-2 px-5 py-3">
                                {label && <span className="font-serif text-base font-light text-bronze-bright">{label}</span>}
                                {sub && (
                                    <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-platinum-dim">
                                        {sub}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* rows */}
                    {I3_CHAIN.map((row) => {
                        const state = row.year === null ? 'past' : rowState(row.year);
                        const isPre = row.year === null;
                        return (
                            <div
                                key={row.yearLabel}
                                className={[
                                    'grid grid-cols-[5rem_2fr_1.2fr_1.6fr_1.4fr] border-b border-stone-line last:border-b-0',
                                    'transition-colors duration-300 ease-mechanical',
                                    state === 'current' ? 'bg-charcoal/60' : 'hover:bg-charcoal/30',
                                ].join(' ')}

                            >
                                {/* year */}
                                <div className="relative flex items-start px-5 py-5">
                                    {state === 'current' && (
                                        <span aria-hidden className="absolute inset-y-2 left-0 w-px bg-bronze" />
                                    )}
                                    <span className={[
                                        'font-mono tabular-nums tracking-[0.1em] text-base',
                                        state === 'current' ? 'text-bronze-bright' : 'text-platinum-dim',
                                    ].join(' ')}>
                                        {row.yearLabel}
                                    </span>
                                </div>

                                {/* Product frontier */}
                                <div className="flex items-start px-5 py-5">
                                    <p className={[
                                        'font-sans text-[0.76rem] leading-relaxed tracking-[0.03em]',
                                        state === 'current' ? 'text-platinum' : 'text-platinum-dim',
                                    ].join(' ')}>
                                        {row.frontier}
                                    </p>
                                </div>

                                {/* I³ accomplishment */}
                                <div className="flex flex-col gap-1 px-5 py-5">
                                    <span className={[
                                        'font-serif text-base font-light tracking-[0.04em]',
                                        state === 'current' ? 'text-marble' : 'text-platinum',
                                    ].join(' ')}>
                                        {row.i3.title}
                                    </span>
                                    {row.i3.body && (
                                        <span className="font-sans text-[0.76rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                                            — {row.i3.body}
                                        </span>
                                    )}
                                </div>

                                {/* I² obvious next */}
                                <div className="flex items-start px-5 py-5">
                                    <p className={[
                                        'font-sans text-[0.78rem] leading-relaxed tracking-[0.03em]',
                                        state === 'current' ? 'text-platinum' : 'text-platinum-dim',
                                    ].join(' ')}>
                                        {row.i2}
                                    </p>
                                </div>

                                {/* I¹ inversion */}
                                <div className="flex items-start px-5 py-5">
                                    <p className={[
                                        'font-sans text-[0.78rem] leading-relaxed tracking-[0.03em]',
                                        state === 'current' ? 'text-platinum' : 'text-platinum-dim',
                                    ].join(' ')}>
                                        {row.i1.from}
                                        {' '}
                                        <span className={['font-mono text-[0.65rem]', state === 'current' ? 'text-bronze' : 'text-bronze-dim'].join(' ')}>→</span>
                                        {' '}
                                        <span className={state === 'current' ? 'text-marble' : 'text-platinum'}>
                                            {row.i1.to}
                                        </span>
                                        {' '}
                                        <span className={['font-mono text-[0.65rem]', state === 'current' ? 'text-bronze' : 'text-bronze-dim'].join(' ')}>↓</span>
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* footnote */}
                <p className="mt-6 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-stone-line-strong">
                    2017–{CURRENT_YEAR} · I³ = Inversion × Incentives × Inflection
                </p>
            </div>

        </div>
    );
}
