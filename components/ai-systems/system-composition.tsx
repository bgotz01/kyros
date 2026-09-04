import { Arrow, FlowNode, SectionHeader } from './system-primitives';

export default function SystemComposition() {
    return (
        <section className="px-6 py-10 md:px-10 md:py-14 xl:px-14">
            <SectionHeader
                eyebrow="06 · Composition"
                title="Graphs organize models, tools and agents"
                body={
                    <p>
                        These concepts are composable. A graph node can call an LLM, retrieve knowledge, execute deterministic code, ask a human, or even contain its own autonomous agent loop.
                    </p>
                }
            />

            <div className="mt-8 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="border border-bronze-dim bg-obsidian/45 p-5 md:p-6">
                    <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-bronze">
                        Execution graph
                    </p>
                    <div className="mt-5 space-y-2">
                        <FlowNode>LLM node</FlowNode>
                        <div className="flex justify-center"><Arrow>↓</Arrow></div>
                        <FlowNode tone="bronze">Research agent node</FlowNode>
                        <div className="ml-8 border-l border-stone-line pl-5">
                            <div className="border border-stone-line bg-obsidian p-4 font-mono text-[0.64rem] leading-6 tracking-[0.06em] text-platinum-dim">
                                search → inspect → reason → search ↺
                            </div>
                        </div>
                        <div className="flex justify-center"><Arrow>↓</Arrow></div>
                        <FlowNode tone="dim">Retrieval node · RAG</FlowNode>
                        <div className="flex justify-center"><Arrow>↓</Arrow></div>
                        <FlowNode tone="dim">Code / rule node</FlowNode>
                        <div className="flex justify-center"><Arrow>↓</Arrow></div>
                        <FlowNode>Human review</FlowNode>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="border border-stone-line bg-obsidian/25 p-5">
                        <p className="font-mono text-[0.59rem] uppercase tracking-[0.2em] text-bronze">Global structure</p>
                        <p className="mt-3 font-serif text-lg font-light tracking-[0.06em] text-marble">The graph controls the organization.</p>
                        <p className="mt-3 font-sans text-[0.74rem] leading-6 text-platinum-dim">
                            It establishes legal paths, quality gates, retries, fan-out, dependencies and stopping conditions.
                        </p>
                    </div>
                    <div className="border border-stone-line bg-obsidian/25 p-5">
                        <p className="font-mono text-[0.59rem] uppercase tracking-[0.2em] text-bronze">Local autonomy</p>
                        <p className="mt-3 font-serif text-lg font-light tracking-[0.06em] text-marble">Agents can remain open-ended inside nodes.</p>
                        <p className="mt-3 font-sans text-[0.74rem] leading-6 text-platinum-dim">
                            A research node can decide which searches and tools to use while the larger graph still requires it to return to critique before publication.
                        </p>
                    </div>
                    <div className="border-l-2 border-bronze-dim py-1 pl-5">
                        <p className="font-serif text-lg font-light tracking-[0.05em] text-marble">
                            Autonomy locally. Structure globally.
                        </p>
                        <p className="mt-2 font-sans text-[0.74rem] leading-6 text-platinum-dim">
                            That is the core reason graph engineering is useful for complex AI systems.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
