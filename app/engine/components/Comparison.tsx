
/** The prior approach against the proposed one, row by row. Entry N of each
 *  list addresses the same aspect, so they are read across, not down. */
export default function Comparison({ previous, proposed }: { previous: string[]; proposed: string[] }) {
    const rows = Math.min(previous.length, proposed.length);
    if (rows === 0) return null;

    return (
        <div className="border border-stone-line">
            <div className="grid grid-cols-2 gap-px bg-stone-line">
                <span className="bg-obsidian-800 px-3 py-1.5 font-sans text-[0.5rem] uppercase tracking-[0.24em] text-platinum-dim">
                    Previous
                </span>
                <span className="bg-obsidian-800 px-3 py-1.5 font-sans text-[0.5rem] uppercase tracking-[0.24em] text-bronze">
                    Proposed
                </span>
            </div>
            {Array.from({ length: rows }, (_, i) => (
                <div key={i} className="grid grid-cols-2 gap-px border-t border-stone-line bg-stone-line">
                    <p className="bg-charcoal px-3 py-2.5 font-sans text-[0.66rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                        {previous[i]}
                    </p>
                    <p className="bg-charcoal px-3 py-2.5 font-sans text-[0.66rem] leading-relaxed tracking-[0.03em] text-platinum">
                        {proposed[i]}
                    </p>
                </div>
            ))}
        </div>
    );
}
