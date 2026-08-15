'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// ─── nav structure ────────────────────────────────────────────────────────────

const LINKS = [
    { href: '/ai-impact', label: 'AI Impact', icon: 'I³' },
    { href: '/theory', label: 'Theory', icon: '∴' },
];

const STORAGE_KEY = 'kyros:sidebar:open';

// ─── component ────────────────────────────────────────────────────────────────

export default function Sidebar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Hydrate from localStorage after mount to avoid SSR mismatch
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) setOpen(stored === 'true');
        setMounted(true);
    }, []);

    function toggle() {
        setOpen((prev) => {
            const next = !prev;
            localStorage.setItem(STORAGE_KEY, String(next));
            return next;
        });
    }

    function isActive(href: string) {
        return pathname === href || pathname.startsWith(href + '/');
    }

    // Avoid flash of wrong state before hydration
    if (!mounted) return (
        <aside className="w-14 shrink-0 border-r border-stone-line bg-charcoal" />
    );

    // Hide on routes that manage their own internal sidebar
    const SIDEBAR_EXCLUDED = ['/context', '/council'];
    if (SIDEBAR_EXCLUDED.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
        return null;
    }

    return (
        <aside
            className={`relative flex shrink-0 flex-col border-r border-stone-line bg-charcoal transition-[width] duration-500 ease-mechanical ${open ? 'w-44' : 'w-14'
                }`}
        >
            {/* nav links */}
            <nav aria-label="Sidebar" className="flex flex-1 flex-col gap-px py-3">
                {LINKS.map(({ href, label, icon }) => {
                    const active = isActive(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            aria-current={active ? 'page' : undefined}
                            className={`group relative flex h-10 items-center gap-3 px-3.5 transition-colors duration-300 ease-mechanical ${active
                                ? 'text-marble'
                                : 'text-platinum-dim hover:text-platinum'
                                }`}
                        >
                            {/* active indicator bar */}
                            {active && (
                                <span
                                    aria-hidden
                                    className="absolute inset-y-1 left-0 w-px bg-bronze"
                                />
                            )}

                            {/* icon */}
                            <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center font-mono text-[0.65rem] transition-colors duration-300 ${active ? 'text-bronze-bright' : 'text-platinum-dim group-hover:text-platinum'
                                    }`}
                            >
                                {icon}
                            </span>

                            {/* label — fades out when collapsed */}
                            <span
                                className={`truncate font-sans text-[0.65rem] uppercase tracking-[0.2em] transition-[opacity,transform] duration-500 ease-mechanical ${open ? 'translate-x-0 opacity-100' : 'pointer-events-none -translate-x-1 opacity-0'
                                    }`}
                            >
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* collapse toggle */}
            <button
                type="button"
                onClick={toggle}
                aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
                className="flex h-10 w-full items-center border-t border-stone-line px-3.5 text-platinum-dim transition-colors duration-300 ease-mechanical hover:text-platinum"
            >
                {/* chevron rotates */}
                <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    aria-hidden
                    className={`shrink-0 transition-transform duration-500 ease-mechanical ${open ? '' : 'rotate-180'}`}
                >
                    <path
                        d="M6.5 2L3.5 5L6.5 8"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>

                <span
                    className={`ml-3 font-sans text-[0.55rem] uppercase tracking-[0.22em] transition-[opacity] duration-300 ease-mechanical ${open ? 'opacity-100' : 'pointer-events-none opacity-0'
                        }`}
                >
                    Collapse
                </span>
            </button>
        </aside>
    );
}
