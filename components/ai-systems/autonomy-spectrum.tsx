import { SectionHeader } from './system-primitives';

const MODES = [
    {
        label: 'Pipeline',
        subtitle: 'Fixed path',
        code: 'A  →  B  →  C  →  D',
        body: 'The developer determines the sequence. Very predictable, but little flexibility.',
    },
    {
        label: 'Graph',
        subtitle: 'Bounded optionality',
        code: 'A  →  B / C  →  D  ↺',
        body: 'The developer defines the possible paths. The system can branch, loop and route conditionally.',
        active: true,
    },
    {
        label: 'Agent loop',
        subtitle: 'Open-ended optionality',
        code: 'observe → decide → act ↺',
        body: 'The AI chooses its next action from its objective, tools and current state.',
    },
];

export default function AutonomySpectrum() {
    return (
        <section className="border-b border-stone-line px-6 py-10 md:px-10 md:py-14 xl:px-14">
            <SectionHeader
                eyebrow="04 · Structure vs autonomy"
                title="Pipeline → graph → agent loop"
                body={
                    <p>
                        The defining difference is who controls the workflow. Graphs sit in the middle: more structured than a free-running agent, but more flexible than a fixed pipeline.
                    </p>
                }
            />

            <div className="mt-8">
                <div className="mb-3 flex items-center justify-between font-mono text-[0.58rem] uppercase tracking-[0.2em] text-platinum-dim">
                    <span>More structure</span>
                    <span>More autonomy</span>
                </div>
                <div className="relative h-px bg-stone-line">
                    <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-bronze bg-obsidian" />
                </div>
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-3">
                {MODES.map((mode) => (
                    <div
                        key={mode.label}
                        className={`border p-5 md:p-6 ${mode.active ? 'border-bronze-dim bg-obsidian/55' : 'border-stone-line bg-obsidian/25'}`}
                    >
                        <div className="flex items-baseline justify-between gap-3">
                            <h3 className="font-serif text-lg font-light tracking-[0.08em] text-marble">
                                {mode.label}
                            </h3>
                            {mode.active && (
                                <span className="font-mono text-[0.55rem] uppercase tracking-[0.16em] text-bronze">
                                    graph engineering
                                </span>
                            )}
                        </div>
                        <p className="mt-1 font-sans text-[0.64rem] uppercase tracking-[0.17em] text-platinum-dim">
                            {mode.subtitle}
                        </p>
                        <div className="mt-5 border border-stone-line bg-obsidian px-4 py-4 font-mono text-[0.67rem] tracking-[0.06em] text-bronze-bright">
                            {mode.code}
                        </div>
                        <p className="mt-4 font-sans text-[0.75rem] leading-6 text-platinum-dim">
                            {mode.body}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-6 border-l-2 border-bronze-dim pl-5">
                <p className="font-serif text-base font-light tracking-[0.05em] text-marble">
                    Graph = engineered possible paths.
                </p>
                <p className="mt-2 font-sans text-[0.74rem] leading-6 text-platinum-dim">
                    AI can still make decisions inside the graph, but its optionality is bounded by the architecture you designed.
                </p>
            </div>
        </section>
    );
}
