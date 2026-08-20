// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimelineNode {
    /** Period marker — a decade or a century. */
    label: string;
    /** The thing that moved: a capital center. */
    title: string;
    /** What ran there, set beneath the title. */
    caption: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * A horizontal movement read left to right, one node per period, `→` between.
 * Scrolls past the page gutter rather than wrapping — the sequence is the point.
 */
export default function Timeline({
    nodes,
    nodeWidth = 168,
}: {
    nodes: TimelineNode[];
    nodeWidth?: number;
}) {
    return (
        <div className="-mx-8 overflow-x-auto px-8 pb-2">
            <div className="flex min-w-max items-stretch">
                {nodes.map((node, idx) => (
                    <div key={node.label} className="flex items-stretch">
                        {/* arrow between nodes */}
                        {idx !== 0 && (
                            <div className="flex w-14 shrink-0 items-start justify-center pt-[1.85rem]">
                                <span
                                    aria-hidden
                                    className="font-mono text-[0.9rem] tracking-[0.1em] text-stone-line-strong"
                                >
                                    →
                                </span>
                            </div>
                        )}

                        {/* node */}
                        <div
                            className="group flex shrink-0 flex-col"
                            style={{ width: nodeWidth }}
                        >
                            {/* period */}
                            <p className="font-mono text-[0.72rem] tracking-[0.18em] text-bronze">
                                {node.label}
                            </p>

                            {/* rule + marker */}
                            <div className="relative mt-3 h-px w-full bg-stone-line">
                                <span
                                    aria-hidden
                                    className="absolute -top-[2px] left-0 h-[5px] w-[5px] rotate-45 bg-bronze transition-colors duration-300 ease-mechanical group-hover:bg-bronze-bright"
                                />
                            </div>

                            {/* title */}
                            <p className="mt-4 font-serif text-[1.05rem] font-light leading-snug tracking-[0.04em] text-marble">
                                {node.title}
                            </p>

                            {/* caption */}
                            <p className="mt-2 pr-6 font-sans text-[0.68rem] uppercase leading-relaxed tracking-[0.16em] text-platinum-dim">
                                {node.caption}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
