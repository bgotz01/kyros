import type { EngineScore } from '@/app/api/engine/analyze/route';
import Bullets from './Bullets';
import PositionScale from './PositionScale';
import { inflectionPosition, inflectionPrecedent } from './format';

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

/** I³ is scored off two things the model should not weigh alone: what the field
 *  was already pursuing, read from the snapshot, and what had already been
 *  demonstrated, read from the paper's own related work. Both cap the score, so
 *  both belong in front of the reader. */
export default function InflectionDetail({
    score,
    position,
    proposes,
    paradigmAsOf,
}: {
    score: EngineScore;
    position?: string;
    proposes?: string;
    paradigmAsOf?: string;
}) {
    const ceiling = score.inflection.ceiling;

    return (
        <div className="flex flex-col gap-4">
            <div>
                <span className="mb-2 block font-sans text-[0.5rem] uppercase tracking-[0.24em] text-platinum-dim">
                    How unusual is this?
                </span>
                <div className="grid gap-px border border-stone-line bg-stone-line sm:grid-cols-2">
                    <Measure label="Had anyone done this before?" value={inflectionPrecedent(score)} />
                    <Measure label="Was the field heading there?" value={inflectionPosition(position)} />
                </div>
                {ceiling !== undefined && ceiling < 10 && (
                    <p className="mt-2 font-mono text-[0.55rem] uppercase tracking-[0.14em] text-platinum-dim/70">
                        ceiling {ceiling} · scored {score.inflection.score}
                    </p>
                )}
            </div>

            {position && (
                <div>
                    <span className="mb-2 block font-sans text-[0.5rem] uppercase tracking-[0.24em] text-platinum-dim">
                        Position in the {paradigmAsOf?.slice(0, 7) || 'standing'} paradigm
                    </span>
                    <PositionScale position={position} proposes={proposes} />
                </div>
            )}

            <div>
                <span className="mb-2 block font-sans text-[0.5rem] uppercase tracking-[0.24em] text-platinum-dim">
                    Why this score
                </span>
                <Bullets items={score.inflection.unprecedented} />
            </div>
        </div>
    );
}
