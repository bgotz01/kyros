import CapitalTimeline from '../components/CapitalTimeline';
import ParadigmTable from '../components/ParadigmTable';

export default function InversionsPage() {
    return (
        <div className="mx-auto w-full max-w-[1100px] px-8 py-20">

            {/* ── header ──────────────────────────────────────────────────────── */}
            <div className="mb-16">
                <div className="mb-6 flex flex-wrap items-baseline gap-x-8 gap-y-3">
                    <h1 className="font-serif text-5xl font-light tracking-[0.12em] text-marble">
                        Decade Inversions
                    </h1>
                </div>
                <p className="font-sans text-[0.85rem] uppercase tracking-[0.28em] text-platinum-dim">
                    Every decade develops a paradigm opposite from the previous one
                </p>
            </div>

            {/* ── capital center timeline ──────────────────────────────────────── */}
            <div className="mb-24">
                <p className="mb-8 font-sans text-[0.85rem] uppercase tracking-[0.28em] text-platinum-dim">
                    Capital Accumulation
                </p>
                <CapitalTimeline />
            </div>

            {/* ── paradigm table ──────────────────────────────────────────────── */}
            <div>
                <p className="mb-8 font-sans text-[0.85rem] uppercase tracking-[0.28em] text-platinum-dim">
                    Paradigms
                </p>
                <ParadigmTable />
            </div>

        </div>
    );
}
