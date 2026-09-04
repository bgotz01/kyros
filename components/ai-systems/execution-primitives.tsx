import { ConceptCard, SectionHeader } from './system-primitives';

export default function ExecutionPrimitives() {
    return (
        <section className="border-b border-stone-line px-6 py-10 md:px-10 md:py-14 xl:px-14">
            <SectionHeader
                eyebrow="03 · Execution architecture"
                title="Graph engineering structures the work"
                body={
                    <p>
                        Graph engineering is not primarily about storing facts. It is about making the process explicit: what runs, what happens next, and what information survives between steps.
                    </p>
                }
            />

            <div className="mt-8 grid gap-4 md:grid-cols-3">
                <ConceptCard label="Node" title="A unit of work">
                    <p>
                        An LLM call, agent, web search, database query, Python function, deterministic rule or human review.
                    </p>
                </ConceptCard>
                <ConceptCard label="Edge" title="Where execution goes next" accent>
                    <p>
                        A fixed route or conditional transition: pass, fail, retry, branch, fan-out, merge or loop.
                    </p>
                </ConceptCard>
                <ConceptCard label="State" title="What moves through the graph">
                    <p>
                        The shared information accumulated by the workflow: question, evidence, scores, drafts, decisions and outputs.
                    </p>
                </ConceptCard>
            </div>

            <div className="mt-6 border-l-2 border-bronze-dim pl-5 font-mono text-[0.68rem] leading-7 tracking-[0.07em] text-platinum-dim">
                <p><span className="text-marble">Node</span> ≈ function / worker</p>
                <p><span className="text-marble">Edge</span> ≈ control flow</p>
                <p><span className="text-marble">State</span> ≈ variables / working memory passed through the process</p>
            </div>
        </section>
    );
}
