import type { TimelineEvent } from '@/lib/commodities/timeline';

/**
 * Jump links from a decade row up to the timeline nodes it covers.
 *
 * The same events appear twice on the page — once as a point on the rail and
 * once inside a decade's reading. These tie the two together: following one
 * scrolls the node into view and marks it via `:target`.
 */
export default function TimelineLinks({ nodes }: { nodes: TimelineEvent[] }) {
    if (nodes.length === 0) return null;

    return (
        <span className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span
                aria-hidden
                className="font-mono text-[0.62rem] text-bronze-dim"
            >
                ↑
            </span>

            {nodes.map((node) => (
                <a
                    key={node.id}
                    href={`#${node.id}`}
                    aria-label={`Jump to ${node.year} — ${node.title} on the timeline`}
                    title={node.title}
                    className="font-mono text-[0.62rem] tracking-[0.14em] text-bronze-dim underline-offset-4 transition-colors duration-300 ease-mechanical hover:text-bronze-bright hover:underline"
                >
                    {node.year}
                </a>
            ))}
        </span>
    );
}
