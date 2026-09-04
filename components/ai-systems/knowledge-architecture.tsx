import { Arrow, ConceptCard, FlowNode, SectionHeader } from './system-primitives';

const ROWS = [
    ['LLM weights', 'What the model has internalized through training'],
    ['Embeddings', 'Semantic representation and conceptual similarity'],
    ['Knowledge graph', 'Explicit entities and typed relationships'],
    ['RAG / retrieval', 'Brings relevant external information into context'],
];

export default function KnowledgeArchitecture() {
    return (
        <section className="border-b border-stone-line px-6 py-10 md:px-10 md:py-14 xl:px-14">
            <SectionHeader
                eyebrow="02 · Knowledge architecture"
                title="Internalized knowledge vs external reference"
                body={
                    <p>
                        An LLM&apos;s learned knowledge is distributed through its weights. External systems make information explicit and retrievable. A knowledge graph is one possible source; RAG is the mechanism that retrieves from a source and supplies context.
                    </p>
                }
            />

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
                <ConceptCard label="Internal" title="LLM knowledge">
                    <div className="space-y-4">
                        <p>
                            The model does not normally consult an internal fact table. What it learned during training is distributed across neural-network parameters.
                        </p>
                        <div className="border-l-2 border-bronze-dim pl-4 font-mono text-[0.66rem] leading-6 tracking-[0.06em]">
                            <p><span className="text-marble">Weights</span> ≈ what you know</p>
                            <p><span className="text-marble">Embeddings</span> ≈ conceptual associations</p>
                        </div>
                    </div>
                </ConceptCard>

                <ConceptCard label="External" title="Reference knowledge" accent>
                    <div className="space-y-4">
                        <p>
                            External stores can preserve exact documents, facts, provenance and structure that the model can look up when needed.
                        </p>
                        <div className="border-l-2 border-bronze-dim pl-4 font-mono text-[0.66rem] leading-6 tracking-[0.06em]">
                            <p><span className="text-marble">Knowledge graph</span> ≈ reference system</p>
                            <p><span className="text-marble">Retrieval</span> ≈ looking something up</p>
                        </div>
                    </div>
                </ConceptCard>
            </div>

            <div className="mt-4 border border-stone-line bg-obsidian/25">
                {ROWS.map(([name, meaning], index) => (
                    <div
                        key={name}
                        className={`grid gap-2 px-5 py-4 md:grid-cols-[11rem_1fr] md:items-center ${index ? 'border-t border-stone-line' : ''}`}
                    >
                        <p className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-bronze-bright">
                            {name}
                        </p>
                        <p className="font-sans text-[0.74rem] leading-6 text-platinum-dim">
                            {meaning}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex flex-col gap-2 md:flex-row md:items-center">
                <FlowNode>Question</FlowNode>
                <Arrow />
                <FlowNode tone="dim">RAG / retrieval</FlowNode>
                <Arrow />
                <FlowNode tone="dim">Docs · DB · Knowledge graph</FlowNode>
                <Arrow />
                <FlowNode tone="bronze">LLM + context</FlowNode>
            </div>
        </section>
    );
}
