import AutonomySpectrum from '@/components/ai-systems/autonomy-spectrum';
import ExecutionGraph from '@/components/ai-systems/execution-graph';
import ExecutionPrimitives from '@/components/ai-systems/execution-primitives';
import KnowledgeArchitecture from '@/components/ai-systems/knowledge-architecture';
import SystemComposition from '@/components/ai-systems/system-composition';
import SystemsOverview from '@/components/ai-systems/systems-overview';

export default function AISystemsPage() {
    return (
        <div className="min-h-[calc(100svh-4rem-1px)]">
            <header className="border-b border-stone-line px-6 py-5 md:px-10 xl:px-14">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="font-mono text-[0.6rem] uppercase tracking-[0.24em] text-bronze">
                            AI · Systems
                        </p>
                        <h1 className="mt-2 font-serif text-2xl font-light tracking-[0.16em] text-marble md:text-3xl">
                            SYSTEM ARCHITECTURE
                        </h1>
                    </div>
                    <p className="max-w-md font-sans text-[0.72rem] leading-6 tracking-[0.04em] text-platinum-dim md:text-right">
                        Knowledge architecture · execution graphs · agents · retrieval · control flow
                    </p>
                </div>
            </header>

            <main>
                <SystemsOverview />
                <KnowledgeArchitecture />
                <ExecutionPrimitives />
                <AutonomySpectrum />
                <ExecutionGraph />
                <SystemComposition />
            </main>
        </div>
    );
}
