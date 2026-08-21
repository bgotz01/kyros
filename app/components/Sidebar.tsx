'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// ─── nav structure ────────────────────────────────────────────────────────────

type NavLeaf = {
    href: string;
    label: string;
    icon: string;
    exact?: boolean;
};

/** A non-clickable heading that groups the links beneath it. */
type NavSection = { section: string };

type NavChild = NavLeaf | NavSection;

type NavItem = NavLeaf & { children?: NavChild[] };

function isSection(child: NavChild): child is NavSection {
    return 'section' in child;
}

const LINKS: NavItem[] = [
    { href: '/ai-impact', label: 'AI Impact', icon: 'I³' },
    { href: '/theory', label: 'Theory', icon: '∴' },
    {
        href: '/capital',
        label: 'Capital',
        icon: '₡',
        exact: true,
        children: [
            { href: '/capital/century', label: 'Century', icon: '◈' },
            { href: '/capital/decades', label: 'Decades', icon: '◎' },
            { section: 'I³' },
            { href: '/capital/inversions', label: 'Inversions', icon: 'I¹' },
            { href: '/capital/incentives', label: 'Incentives', icon: 'I²' },
            { href: '/capital/inflections', label: 'Inflections', icon: 'I³' },
            { section: 'Data Tools' },
            { href: '/capital/chart', label: 'Macro Chart', icon: '∿' },
            { href: '/capital/markets', label: 'Markets', icon: '⌇' },
            { href: '/capital/GDP', label: 'GDP', icon: '₲' },
        ],
    },
];

const STORAGE_KEY = 'kyros:sidebar:open';

// ─── component ────────────────────────────────────────────────────────────────

export default function Sidebar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(true);
    const [mounted, setMounted] = useState(false);

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

    function isActive(href: string, exact?: boolean) {
        if (exact) return pathname === href;
        return pathname === href || pathname.startsWith(href + '/');
    }

    if (!mounted) return (
        <aside className="w-14 shrink-0 border-r border-stone-line bg-charcoal" />
    );

    const SIDEBAR_EXCLUDED = ['/context', '/council'];
    if (SIDEBAR_EXCLUDED.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
        return null;
    }

    return (
        <aside
            className={`relative flex shrink-0 flex-col border-r border-stone-line bg-charcoal transition-[width] duration-500 ease-mechanical ${open ? 'w-44' : 'w-14'
                }`}
        >
            {/* collapse toggle — arrow sits on the right edge, outside the sidebar */}
            <button
                type="button"
                onClick={toggle}
                aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
                className="absolute -right-3 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-stone-line bg-charcoal text-platinum-dim shadow-sm transition-colors duration-300 ease-mechanical hover:text-platinum"
            >
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
            </button>

            <nav aria-label="Sidebar" className="flex flex-1 flex-col gap-px py-3">
                {LINKS.map((item) => {
                    const active = isActive(item.href, item.exact);
                    // a parent is "open" if pathname is under it
                    const parentOpen = item.children &&
                        (pathname === item.href || pathname.startsWith(item.href + '/'));

                    return (
                        <div key={item.href}>
                            <NavLink item={item} active={active} sidebarOpen={open} />

                            {/* children — only visible when sidebar is expanded and we're under this parent */}
                            {item.children && parentOpen && (
                                <div className={`flex flex-col gap-px transition-[opacity] duration-300 ease-mechanical ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
                                    {item.children.map((child) => {
                                        if (isSection(child)) {
                                            return (
                                                <div key={child.section} className="relative flex items-stretch pl-3.5">
                                                    {/* vertical connector line */}
                                                    <span aria-hidden className="absolute left-[1.375rem] top-0 bottom-0 w-px bg-stone-line" />
                                                    <span
                                                        className={`px-4 pb-1.5 pt-4 font-sans text-[0.55rem] uppercase tracking-[0.22em] text-platinum-dim transition-opacity duration-500 ease-mechanical ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                                                    >
                                                        {child.section}
                                                    </span>
                                                </div>
                                            );
                                        }

                                        const childActive = isActive(child.href, child.exact);
                                        return (
                                            <div key={child.href} className="relative flex items-stretch pl-3.5">
                                                {/* vertical connector line */}
                                                <span aria-hidden className="absolute left-[1.375rem] top-0 bottom-0 w-px bg-stone-line" />
                                                <NavLink
                                                    item={child}
                                                    active={childActive}
                                                    sidebarOpen={open}
                                                    indent
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
}

// ─── nav link ─────────────────────────────────────────────────────────────────

function NavLink({
    item,
    active,
    sidebarOpen,
    indent = false,
}: {
    item: NavLeaf;
    active: boolean;
    sidebarOpen: boolean;
    indent?: boolean;
}) {
    return (
        <Link
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`group relative flex h-9 w-full items-center gap-3 transition-colors duration-300 ease-mechanical ${indent ? 'pl-4 pr-3.5' : 'px-3.5'
                } ${active ? 'text-marble' : 'text-platinum-dim hover:text-platinum'}`}
        >
            {active && !indent && (
                <span aria-hidden className="absolute inset-y-1 left-0 w-px bg-bronze" />
            )}
            {active && indent && (
                <span aria-hidden className="absolute inset-y-1 left-3.5 w-px bg-bronze" />
            )}

            <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center font-mono text-[0.6rem] transition-colors duration-300 ${active ? 'text-bronze-bright' : 'text-platinum-dim group-hover:text-platinum'
                    }`}
            >
                {item.icon}
            </span>

            <span
                className={`truncate font-sans text-[0.63rem] uppercase tracking-[0.2em] transition-[opacity,transform] duration-500 ease-mechanical ${sidebarOpen ? 'translate-x-0 opacity-100' : 'pointer-events-none -translate-x-1 opacity-0'
                    } ${indent ? 'text-[0.6rem] tracking-[0.18em]' : ''}`}
            >
                {item.label}
            </span>
        </Link>
    );
}
