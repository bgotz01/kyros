// ─── bullets ──────────────────────────────────────────────────────────────────

/** The engine's one list style. Every detail row is read as bullets. */
export default function Bullets({ items, muted }: { items: string[]; muted?: boolean }) {
    return (
        <ul className="flex flex-col gap-1.5">
            {items.map((item, i) => (
                <li key={i} className="flex gap-2">
                    <span aria-hidden className="mt-[0.45em] h-px w-2 shrink-0 bg-bronze-dim" />
                    <span
                        className={`font-sans text-[0.68rem] leading-relaxed tracking-[0.03em] ${
                            muted ? 'text-platinum-dim' : 'text-platinum'
                        }`}
                    >
                        {item}
                    </span>
                </li>
            ))}
        </ul>
    );
}

