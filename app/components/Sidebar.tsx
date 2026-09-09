'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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
    {
        href: '/ai',
        label: 'AI',
        icon: '⬡',
        exact: true,
        children: [
            { href: '/ai/progress', label: 'Progress', icon: '→' },
            { href: '/ai/impact', label: 'Impact', icon: 'I³' },
            { href: '/ai/architecture', label: 'Architecture', icon: '⌬' },
            { href: '/ai/systems', label: 'Systems', icon: '⬡' },
            { href: '/ai/apps', label: 'Apps', icon: '◧' },
            { href: '/ai/bottlenecks', label: 'Bottlenecks', icon: '⧗' },
        ],
    },
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
            { href: '/capital/returns', label: 'Returns', icon: '⊞' },
            { href: '/capital/GDP', label: 'GDP', icon: '₲' },
        ],
    },
    { href: '/blockchain', label: 'Blockchain', icon: '₿' },
    {
        href: '/commodities/oil',
        label: 'Oil',
        icon: '◐',
        exact: true,
        children: [
            { section: 'Geopolitics' },
            {
                href: '/commodities/oil/geopolitics/middle-east',
                label: 'Middle East',
                icon: '☾',
            },
        ],
    },
];

const STORAGE_KEY = 'kyros:sidebar:open';
const COLLAPSED_KEY = 'kyros:sidebar:collapsed';

// ─── component ────────────────────────────────────────────────────────────────

export default function Sidebar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(true);
    const [mounted, setMounted] = useState(false);
    // set of parent hrefs that are manually collapsed
    // All parents start collapsed by default
    const allParentHrefs = LINKS.filter((item) => item.children).map((item) => item.href);
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set(allParentHrefs));

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) setOpen(stored === 'true');

        const storedCollapsed = localStorage.getItem(COLLAPSED_KEY);
        if (storedCollapsed) {
            try {
                setCollapsed(new Set(JSON.parse(storedCollapsed)));
            } catch {
                // ignore malformed storage — keep the all-collapsed default
            }
        } else {
            // First visit: persist the all-collapsed default
            localStorage.setItem(COLLAPSED_KEY, JSON.stringify(allParentHrefs));
        }

        setMounted(true);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-expand the parent whose section the current path is in
    useEffect(() => {
        const activeParent = LINKS.find(
            (item) =>
                item.children &&
                (pathname === item.href || pathname.startsWith(item.href + '/'))
        );
        if (activeParent) {
            setCollapsed((prev) => {
                if (!prev.has(activeParent.href)) return prev;
                const next = new Set(prev);
                next.delete(activeParent.href);
                localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...next]));
                return next;
            });
        }
    }, [pathname]);

    function toggle() {
        setOpen((prev) => {
            const next = !prev;
            localStorage.setItem(STORAGE_KEY, String(next));
            return next;
        });
    }

    function toggleCollapsed(href: string) {
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(href)) {
                next.delete(href);
            } else {
                next.add(href);
            }
            localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...next]));
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

    const SIDEBAR_EXCLUDED = ['/context', '/council', '/engine'];
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
                    const hasChildren = !!item.children;
                    // children are visible when: sidebar is expanded, has children, and not manually collapsed
                    const childrenVisible = hasChildren && open && !collapsed.has(item.href);
                    const isCollapsed = collapsed.has(item.href);

                    return (
                        <div key={item.href}>
                            {/* parent row — link + optional collapse chevron */}
                            <div className="group/parent relative flex items-center">
                                <NavLink item={item} active={active} sidebarOpen={open} />

                                {hasChildren && open && (
                                    <button
                                        type="button"
                                        onClick={() => toggleCollapsed(item.href)}
                                        aria-label={isCollapsed ? `Expand ${item.label}` : `Collapse ${item.label}`}
                                        className={`absolute right-2 flex h-4 w-4 shrink-0 items-center justify-center text-platinum-dim transition-opacity duration-300 ease-mechanical hover:text-platinum group-hover/parent:opacity-100 ${isCollapsed ? 'opacity-60' : 'opacity-0'}`}
                                    >
                                        <svg
                                            width="8"
                                            height="8"
                                            viewBox="0 0 10 10"
                                            fill="none"
                                            aria-hidden
                                            className={`transition-transform duration-300 ease-mechanical ${isCollapsed ? '-rotate-90' : ''}`}
                                        >
                                            <path
                                                d="M2 3.5L5 6.5L8 3.5"
                                                stroke="currentColor"
                                                strokeWidth="1.2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* children — a single rail descends from the parent's icon column */}
                            {hasChildren && (
                                <div
                                    className={`relative flex flex-col overflow-hidden transition-[max-height,opacity] duration-300 ease-mechanical ${childrenVisible ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
                                >
                                    <span
                                        aria-hidden
                                        className="absolute left-6 top-0 bottom-1 w-px bg-stone-line/60"
                                    />

                                    {item.children!.map((child) => {
                                        if (isSection(child)) {
                                            return (
                                                <div
                                                    key={child.section}
                                                    className="pl-nav-label pr-3.5 pb-1 pt-3.5 font-sans text-[0.5rem] uppercase tracking-[0.25em] text-platinum-dim/40"
                                                >
                                                    {child.section}
                                                </div>
                                            );
                                        }

                                        return (
                                            <NavLink
                                                key={child.href}
                                                item={child}
                                                active={isActive(child.href, child.exact)}
                                                sidebarOpen={open}
                                                indent
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* settings ─────────────────────────────────────────────────── */}
            <SettingsMenu sidebarOpen={open} />
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
    if (indent) {
        // Child item — shorter row, true left indent, same brightness as parent
        return (
            <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex h-7 w-full items-center pl-nav-label pr-3.5 transition-colors duration-300 ease-mechanical ${active ? 'text-marble' : 'text-platinum-dim hover:text-platinum'
                    }`}
            >
                {/* active child lights up its segment of the rail */}
                {active && (
                    <span aria-hidden className="absolute inset-y-0 left-6 w-px bg-bronze" />
                )}
                <span
                    className={`truncate font-sans text-[0.58rem] uppercase tracking-[0.15em] transition-[opacity,transform] duration-500 ease-mechanical ${sidebarOpen ? 'translate-x-0 opacity-100' : 'pointer-events-none -translate-x-1 opacity-0'
                        }`}
                >
                    {item.label}
                </span>
            </Link>
        );
    }

    // Top-level category item
    return (
        <Link
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`group relative flex h-9 w-full items-center gap-3 px-3.5 transition-colors duration-300 ease-mechanical ${active ? 'text-marble' : 'text-platinum-dim hover:text-platinum'
                }`}
        >
            {active && (
                <span aria-hidden className="absolute inset-y-1 left-0 w-px bg-bronze" />
            )}

            <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center font-mono text-[0.6rem] transition-colors duration-300 ${active ? 'text-bronze-bright' : 'text-platinum-dim group-hover:text-platinum'
                    }`}
            >
                {item.icon}
            </span>

            <span
                className={`truncate font-sans text-[0.63rem] uppercase tracking-[0.2em] transition-[opacity,transform] duration-500 ease-mechanical ${sidebarOpen ? 'translate-x-0 opacity-100' : 'pointer-events-none -translate-x-1 opacity-0'
                    }`}
            >
                {item.label}
            </span>
        </Link>
    );
}

// ─── settings menu ────────────────────────────────────────────────────────────

const SETTINGS_LINKS = [
    { href: '/models', label: 'Models' },
    { href: '/context', label: 'Context' },
];

function SettingsMenu({ sidebarOpen }: { sidebarOpen: boolean }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // close on outside click
    useEffect(() => {
        if (!open) return;
        function onPointerDown(e: PointerEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [open]);

    return (
        <div ref={ref} className="relative shrink-0 border-t border-stone-line">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label="Settings"
                aria-expanded={open}
                className={`group flex h-11 w-full items-center gap-3 px-3.5 transition-colors duration-300 ease-mechanical ${open ? 'text-marble' : 'text-platinum-dim hover:text-platinum'}`}
            >
                {/* gear icon */}
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center transition-colors duration-300 ${open ? 'text-bronze-bright' : 'text-platinum-dim group-hover:text-platinum'}`}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
                        <path
                            d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                            stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"
                        />
                        <path
                            d="M13.3 9.5a1.2 1.2 0 0 0 .24 1.32l.04.04a1.45 1.45 0 0 1-2.05 2.05l-.04-.04a1.2 1.2 0 0 0-1.32-.24 1.2 1.2 0 0 0-.73 1.1v.12a1.45 1.45 0 0 1-2.9 0v-.06a1.2 1.2 0 0 0-.79-1.1 1.2 1.2 0 0 0-1.32.24l-.04.04a1.45 1.45 0 0 1-2.05-2.05l.04-.04A1.2 1.2 0 0 0 2.64 9.5a1.2 1.2 0 0 0-1.1-.73H1.4a1.45 1.45 0 0 1 0-2.9h.06A1.2 1.2 0 0 0 2.56 5.1a1.2 1.2 0 0 0-.24-1.32l-.04-.04A1.45 1.45 0 0 1 4.33 1.7l.04.04A1.2 1.2 0 0 0 5.69 2a1.2 1.2 0 0 0 .73-1.1V.77a1.45 1.45 0 0 1 2.9 0v.06A1.2 1.2 0 0 0 10.04 2a1.2 1.2 0 0 0 1.32-.24l.04-.04a1.45 1.45 0 0 1 2.05 2.05l-.04.04A1.2 1.2 0 0 0 13.17 5.1a1.2 1.2 0 0 0 1.1.73h.12a1.45 1.45 0 0 1 0 2.9h-.06a1.2 1.2 0 0 0-1.03.77Z"
                            stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
                        />
                    </svg>
                </span>

                <span
                    className={`truncate font-sans text-[0.63rem] uppercase tracking-[0.2em] transition-[opacity,transform] duration-500 ease-mechanical ${sidebarOpen ? 'translate-x-0 opacity-100' : 'pointer-events-none -translate-x-1 opacity-0'}`}
                >
                    Settings
                </span>
            </button>

            {/* dropdown — floats above, anchored to the bottom of the sidebar */}
            {open && (
                <div className="absolute bottom-full left-2 right-2 mb-1 overflow-hidden border border-stone-line bg-charcoal shadow-lg">
                    {SETTINGS_LINKS.map(({ href, label }) => {
                        const active = pathname === href || pathname.startsWith(href + '/');
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setOpen(false)}
                                className={`flex h-9 items-center gap-3 px-3.5 transition-colors duration-300 ease-mechanical ${active ? 'text-marble' : 'text-platinum-dim hover:text-platinum'}`}
                            >
                                {active && <span aria-hidden className="absolute inset-y-1 left-0 w-px bg-bronze" />}
                                <span className="font-sans text-[0.63rem] uppercase tracking-[0.2em]">
                                    {label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
