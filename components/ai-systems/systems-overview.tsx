import { Arrow, FlowNode, SectionHeader } from './system-primitives';

export default function SystemsOverview() {
    return (
        <section className="border-b border-stone-line px-6 py-10 md:px-10 md:py-14 xl:px-14">
            <SectionHeader
                eyebrow="01 · Orientation"
                title="Two architectures make the system"
                body={
                    <p>
                        The easiest way to understand AI systems is to separate two questions:
                        <span className="text-marble"> what information can the system use</span>, and
                        <span className="text-marble"> how does work move through the system?</span>
                    </p>
                }
            />

            <div className="mt-8 grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
                <div className="border border-stone-line bg-obsidian/35 p-6">
                    <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-bronze">
                        Knowledge architecture
                    </p>
                    <p className="mt-3 font-serif text-xl font-light tracking-[0.07em] text-marble">
                        What can the system know?
                    </p>
                    <p className="mt-4 font-sans text-[0.76rem] leading-6 text-platinum-dim">
                        Weights, embeddings, retrieval, documents, databases and knowledge graphs.
                    </p>
                </div>

                <div className="hidden items-center lg:flex">
                    <Arrow>+</Arrow>
                </div>

                <div className="border border-bronze-dim bg-obsidian/55 p-6">
                    <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-bronze">
                        Execution architecture
                    </p>
                    <p className="mt-3 font-serif text-xl font-light tracking-[0.07em] text-marble">
                        How should the system work?
                    </p>
                    <p className="mt-4 font-sans text-[0.76rem] leading-6 text-platinum-dim">
                        Nodes, edges, state, decision paths, loops, tools, agents and human gates.
                    </p>
                </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <FlowNode tone="dim">Knowledge</FlowNode>
                <Arrow />
                <FlowNode tone="bronze">Execution</FlowNode>
            </div>
        </section>
    );
}
