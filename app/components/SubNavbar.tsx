'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { NAV_SECTIONS, NAVBAR_H, SUBNAV_H } from '@/app/lib/nav-sections';
import { ALL_REGIME_SLUGS, slugToRegime } from '@/app/lib/regime-slugs';
import { REGIME_METADATA } from '@/app/lib/regime-state-machine';

/** Matches /regime/<slug> but NOT /regime, /regime/proximity, etc. */
const REGIME_DETAIL_RE = /^\/regime\/([^/]+)$/;

function RegimeDropdown({ currentSlug }: { currentSlug: string }) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const ref = useRef<HTMLDivElement>(null);

    const currentRegime = slugToRegime(currentSlug);
    const currentMeta = currentRegime ? REGIME_METADATA[currentRegime] : null;

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div ref={ref} className="relative ml-auto">
            <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-1 border transition-colors text-[10px] tracking-[0.18em] uppercase"
                style={{
                    borderColor: currentMeta ? currentMeta.color + '60' : 'var(--surface-border)',
                    color: currentMeta ? currentMeta.color : 'var(--text-muted)',
                    backgroundColor: currentMeta ? currentMeta.color + '10' : 'transparent',
                }}
            >
                <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: currentMeta?.color ?? 'var(--accent)' }}
                />
                {currentRegime ?? currentSlug}
                <svg
                    className="ml-1 h-2.5 w-2.5 shrink-0 transition-transform"
                    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    viewBox="0 0 10 6" fill="none"
                >
                    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </button>

            {open && (
                <div
                    className="absolute right-0 top-full mt-1 min-w-[200px] border py-1 z-50"
                    style={{
                        backgroundColor: 'rgba(7,6,5,0.97)',
                        borderColor: 'var(--surface-border)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                    }}
                >
                    {ALL_REGIME_SLUGS.map(slug => {
                        const regime = slugToRegime(slug)!;
                        const meta = REGIME_METADATA[regime];
                        const isActive = slug === currentSlug;
                        return (
                            <button
                                key={slug}
                                onClick={() => { router.push(`/regime/${slug}`); setOpen(false); }}
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-white/5"
                                style={{ color: isActive ? meta.color : 'var(--text-secondary)' }}
                            >
                                <span
                                    className="h-1.5 w-1.5 rounded-full shrink-0"
                                    style={{ backgroundColor: isActive ? meta.color : meta.color + '60' }}
                                />
                                <span className="text-[10px] tracking-[0.15em] uppercase">{regime}</span>
                                {isActive && (
                                    <span className="ml-auto text-[8px] tracking-widest opacity-60">current</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function SubNavbar() {
    const pathname = usePathname();

    const section = NAV_SECTIONS
        .filter(s => pathname.startsWith(s.match))
        .sort((a, b) => b.match.length - a.match.length)[0];

    if (!section || section.items.length <= 1) return null;

    const regimeDetailMatch = pathname.match(REGIME_DETAIL_RE);
    const currentRegimeSlug = regimeDetailMatch ? regimeDetailMatch[1] : null;

    return (
        <div
            className="fixed left-0 right-0 z-50 border-b"
            style={{
                top: `${NAVBAR_H}px`,
                height: `${SUBNAV_H}px`,
                backgroundColor: 'rgba(7,6,5,0.85)',
                borderColor: 'var(--surface-border)',
                borderTop: '2px solid var(--accent)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
            }}
        >
            <div className="mx-auto flex h-full max-w-7xl items-center gap-1 px-6">
                {section.items.map(item => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="group flex flex-col items-center px-3 py-2 h-full justify-center transition-colors border-b-2"
                            style={{
                                borderColor: isActive ? 'var(--accent)' : 'transparent',
                                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                            }}
                        >
                            <span className="text-[11px] font-medium tracking-[0.2em] uppercase">
                                {item.label}
                            </span>
                            {item.sub && (
                                <span className="text-[8px] tracking-[0.18em] uppercase opacity-50">
                                    {item.sub}
                                </span>
                            )}
                        </Link>
                    );
                })}

                {currentRegimeSlug && (
                    <RegimeDropdown currentSlug={currentRegimeSlug} />
                )}
            </div>
        </div>
    );
}
