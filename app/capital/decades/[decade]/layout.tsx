'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { DECADE_SLUGS, DECADE_SECTIONS } from '@/lib/capitalData';

// ─── layout ───────────────────────────────────────────────────────────────────

export default function DecadeLayout({ children }: { children: React.ReactNode }) {
    const { decade } = useParams<{ decade: string }>();
    const pathname = usePathname();

    return (
        <div className="flex h-[calc(100svh-4rem-1px)] flex-col overflow-hidden">

            {/* ── page header ─────────────────────────────────────────────────── */}
            <header className="shrink-0 border-b border-stone-line px-8 py-4">
                <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                    <h1 className="font-serif text-xl font-light tracking-[0.16em] text-marble">
                        CAPITAL DECADES
                    </h1>
                    <span className="font-mono text-[0.6rem] tracking-[0.14em] text-platinum-dim">
                        {DECADE_SLUGS.length} decades
                    </span>
                </div>
            </header>

            {/* ── decade selector ─────────────────────────────────────────────── */}
            <nav
                aria-label="Decades"
                className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-stone-line px-6"
            >
                {DECADE_SLUGS.map((slug) => {
                    const active = slug === decade;
                    return (
                        <Link
                            key={slug}
                            href={`/capital/decades/${slug}`}
                            aria-current={active ? 'page' : undefined}
                            className={`relative shrink-0 px-3 py-3 font-mono text-[0.68rem] tracking-[0.14em] transition-colors duration-300 ease-mechanical ${
                                active ? 'text-bronze-bright' : 'text-platinum-dim hover:text-platinum'
                            }`}
                        >
                            {active && (
                                <span
                                    aria-hidden
                                    className="absolute inset-x-0 bottom-0 h-px bg-bronze"
                                />
                            )}
                            {slug}
                        </Link>
                    );
                })}
            </nav>

            {/* ── section sub-tabs ────────────────────────────────────────────── */}
            <nav
                aria-label="Sections"
                className="flex shrink-0 items-center gap-1 border-b border-stone-line px-6"
            >
                {DECADE_SECTIONS.map(({ slug: section, label }) => {
                    const href =
                        section === ''
                            ? `/capital/decades/${decade}`
                            : `/capital/decades/${decade}/${section}`;
                    const active =
                        section === ''
                            ? pathname === `/capital/decades/${decade}`
                            : pathname === `/capital/decades/${decade}/${section}`;
                    return (
                        <Link
                            key={label}
                            href={href}
                            aria-current={active ? 'page' : undefined}
                            className={`relative shrink-0 px-3 py-2.5 font-sans text-[0.58rem] uppercase tracking-[0.22em] transition-colors duration-300 ease-mechanical ${
                                active ? 'text-marble' : 'text-platinum-dim hover:text-platinum'
                            }`}
                        >
                            {active && (
                                <span
                                    aria-hidden
                                    className="absolute inset-x-0 bottom-0 h-px bg-bronze-dim"
                                />
                            )}
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* ── content ─────────────────────────────────────────────────────── */}
            <div className="min-h-0 flex-1 overflow-y-auto">
                {children}
            </div>
        </div>
    );
}
