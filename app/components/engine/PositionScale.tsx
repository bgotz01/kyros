// ─── where the proposal sat ──────────────────────────────────────────────────
// Four ordinal steps from the incumbent outwards, read off the sealed snapshot
// rather than judged. This is what separates an outlier from a crowded bet: a
// thing already on the frontier is a known wager however novel the paper reads.

import { POSITIONS } from './types';

const NOTE: Record<string, string> = {
    dominant: 'the incumbent itself',
    minor: 'deployed, but not where the field thinks it is going',
    frontier: 'already being pursued — a known bet, not an outlier',
    absent: 'neither in the distribution nor on the frontier',
};

export default function PositionScale({
    position,
    proposes,
}: {
    position: string;
    proposes?: string;
}) {
    const at = POSITIONS.indexOf(position as (typeof POSITIONS)[number]);
    if (at === -1) return null;

    return (
        <p className="font-sans text-[0.68rem] leading-relaxed tracking-[0.03em] text-platinum">
            <span className="font-sans text-[0.6rem] uppercase tracking-[0.18em] text-bronze-bright">
                {position}
            </span>
            {proposes && <span className="text-marble"> · {proposes}</span>}
            <span className="text-platinum-dim"> — {NOTE[position] ?? ''}</span>
        </p>
    );
}
