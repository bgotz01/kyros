// ─── I¹ detail ────────────────────────────────────────────────────────────────
// What already works, against what is proposed instead — the frame for the
// point-by-point comparison beneath it.

import type { EngineScore } from '@/app/api/engine/analyze/route';
import Bullets from './Bullets';
import Comparison from './Comparison';

export default function InversionDetail({ score }: { score: EngineScore }) {
    return (
        <div className="flex flex-col gap-4">
            {(score.previousParadigm || score.corePremise) && (
                <div className="grid grid-cols-1 gap-px border border-stone-line bg-stone-line sm:grid-cols-2">
                    <div className="flex flex-col bg-obsidian-800">
                        <span className="border-b border-stone-line px-3 py-1.5 font-sans text-[0.5rem] uppercase tracking-[0.24em] text-platinum-dim">
                            Previous paradigm
                        </span>
                        <p className="flex-1 bg-charcoal px-3 py-3 font-sans text-[0.7rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                            {score.previousParadigm || '—'}
                        </p>
                    </div>
                    <div className="flex flex-col bg-obsidian-800">
                        <span className="border-b border-stone-line px-3 py-1.5 font-sans text-[0.5rem] uppercase tracking-[0.24em] text-bronze">
                            Proposed
                        </span>
                        <p className="flex-1 bg-charcoal px-3 py-3 font-sans text-[0.7rem] leading-relaxed tracking-[0.03em] text-marble">
                            {score.corePremise || '—'}
                        </p>
                    </div>
                </div>
            )}

            <Bullets items={score.inversion.inverting} />

            <Comparison
                previous={score.inversion.previous ?? []}
                proposed={score.inversion.proposed ?? []}
            />
        </div>
    );
}
