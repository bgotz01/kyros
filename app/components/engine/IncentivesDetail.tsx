import type { EngineScore } from '@/app/api/engine/analyze/route';
import Bullets from './Bullets';
import {
    incentiveBenefit,
    incentiveFit,
    incentiveImpact,
    incentiveProblem,
} from './format';

function Measure({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-obsidian-800 px-3 py-2.5">
            <span className="block font-sans text-[0.48rem] uppercase tracking-[0.22em] text-platinum-dim">
                {label}
            </span>
            <span className="mt-1 block font-sans text-[0.66rem] leading-relaxed tracking-[0.03em] text-marble">
                {value}
            </span>
        </div>
    );
}

/** I² is mechanically scored with snapshot ids and hard ceilings, but readers
 *  need the decision those internals produced: what gets better, whether it
 *  attacks an important problem, and whether the result is large enough. */
export default function IncentivesDetail({ score }: { score: EngineScore }) {
    const estimate = score.incentives.outcomeEstimate;

    return (
        <div className="flex flex-col gap-4">
            <div>
                <span className="mb-2 block font-sans text-[0.5rem] uppercase tracking-[0.24em] text-platinum-dim">
                    Practical impact
                </span>
                <div className="grid gap-px border border-stone-line bg-stone-line sm:grid-cols-2">
                    <Measure
                        label="Practical benefit"
                        value={estimate ? `${incentiveBenefit(score)} · ${estimate}` : incentiveBenefit(score)}
                    />
                    <Measure label="Important problem" value={incentiveProblem(score)} />
                    <Measure label="Does it tackle that problem?" value={incentiveFit(score)} />
                    <Measure label="How much does it help?" value={incentiveImpact(score)} />
                </div>
            </div>

            <div>
                <span className="mb-2 block font-sans text-[0.5rem] uppercase tracking-[0.24em] text-platinum-dim">
                    Why this score
                </span>
                <Bullets items={score.incentives.bottleneck} />
            </div>
        </div>
    );
}
