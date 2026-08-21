'use client';

import { useState } from 'react';

const WIDTH = 300;
const GAP = 12;

interface Anchor {
    x: number;
    y: number;
    below: boolean;
}

/** Wraps a cell and reveals a note on hover. Fixed to the viewport so the
 *  table's horizontal scroll box can never clip it, and clamped on both axes. */
export default function HoverNote({
    title,
    body,
    children,
}: {
    title: string;
    body: string[];
    children: React.ReactNode;
}) {
    const [at, setAt] = useState<Anchor | null>(null);

    return (
        <span
            className="block cursor-help"
            onMouseEnter={e => {
                const r = e.currentTarget.getBoundingClientRect();
                const half = WIDTH / 2;
                setAt({
                    x: Math.max(half + GAP, Math.min(r.left + r.width / 2, window.innerWidth - half - GAP)),
                    y: r.top < 220 ? r.bottom : r.top,
                    below: r.top < 220,
                });
            }}
            onMouseLeave={() => setAt(null)}
        >
            {children}

            {at && (
                <span
                    className={`pointer-events-none fixed z-50 block -translate-x-1/2 ${at.below ? '' : '-translate-y-full'}`}
                    style={{ left: at.x, top: at.below ? at.y + GAP : at.y - GAP }}
                >
                    <span
                        className="block border border-stone-line-strong bg-obsidian px-4 py-3"
                        style={{ width: WIDTH }}
                    >
                        <span className="block font-mono text-[0.6rem] uppercase tracking-[0.18em] text-bronze">
                            {title}
                        </span>
                        {body.map((line, i) => (
                            <span
                                key={i}
                                className={`block font-sans text-[0.68rem] leading-relaxed tracking-[0.02em] ${i === 0
                                    ? 'mt-2.5 border-t border-stone-line pt-2.5 text-platinum'
                                    : 'mt-2 text-platinum-dim'}`}
                            >
                                {line}
                            </span>
                        ))}
                    </span>
                </span>
            )}
        </span>
    );
}
