import CycleTable from './components/CycleTable';
import YearTable from './components/YearTable';

export default function BlockchainPage() {
    return (
        <div className="mx-auto w-full max-w-[1300px] px-8 py-20">

            {/* ── header ──────────────────────────────────────────────────────── */}
            <div className="mb-16">
                <div className="mb-6 flex flex-wrap items-baseline gap-x-8 gap-y-3">
                    <h1 className="font-serif text-5xl font-light tracking-[0.12em] text-marble">
                        Blockchain Evolution
                    </h1>
                </div>
                <p className="font-sans text-[0.85rem] uppercase tracking-[0.28em] text-platinum-dim">
                    Five cycles, seventeen years
                </p>
            </div>

            {/* ── five-year paradigm cycles ───────────────────────────────────── */}
            <div className="mb-24">
                <p className="mb-8 font-sans text-[0.85rem] uppercase tracking-[0.28em] text-platinum-dim">
                    Paradigm Cycles
                </p>
                <CycleTable />
            </div>

            {/* ── annual developments — reference detail beneath the cycles ───── */}
            <div className="border-t border-stone-line pt-16 opacity-80 transition-opacity duration-500 ease-mechanical hover:opacity-100">
                <p className="mb-2 font-sans text-[0.7rem] uppercase tracking-[0.28em] text-platinum-dim/70">
                    Annual Developments
                </p>
                <p className="mb-10 font-sans text-[0.78rem] leading-relaxed text-platinum-dim">
                    Reference detail — the year-by-year record the cycles above are drawn from.
                </p>
                <YearTable />
            </div>

        </div>
    );
}
