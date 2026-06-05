'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from './ThemeProvider';
import SettingsPanel from './SettingsPanel';
import { useCouncilSidebar } from '@/app/lib/council-sidebar-context';

const navItems = [
    { name: 'Regime', href: '/regime', sub: 'Macro State' },
    { name: 'Cycle', href: '/cycle', sub: 'Phase Clock' },
    { name: 'Stocks', href: '/stocks', sub: 'Equity Screen' },
    { name: 'Asymmetry', href: '/asymmetry', sub: 'Risk / Reward' },
    { name: 'Judgment', href: '/judgment', sub: 'Synthesis' },
];

export default function Navbar() {
    const { theme, toggle } = useTheme();
    const { isOpen: councilOpen, toggle: toggleCouncil } = useCouncilSidebar();
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <>
            <nav
                className="fixed top-0 left-0 right-0 z-50 border-b"
                style={{
                    borderColor: 'var(--surface-border)',
                    backgroundColor: 'var(--surface-raised)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                }}
            >
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 pt-3 pb-5">
                    {/* Brand */}
                    <Link href="/" className="flex flex-col leading-none group">
                        <span
                            className="text-[17px] font-semibold tracking-[0.35em] transition-opacity group-hover:opacity-80"
                            style={{ color: 'var(--accent)' }}
                        >
                            KYROS
                        </span>
                        <span
                            className="mt-0.5 text-[9px] tracking-[0.22em] uppercase"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            intelligence chamber
                        </span>
                    </Link>

                    {/* Nav links */}
                    <ul className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className="group flex flex-col items-center px-3 py-1.5 transition-colors"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    <span className="text-[12px] font-medium tracking-[0.2em] uppercase transition-colors group-hover:text-[color:var(--accent)]">
                                        {item.name}
                                    </span>
                                    <span className="text-[9px] tracking-[0.18em] uppercase opacity-60">
                                        {item.sub}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {/* Right controls */}
                    <div className="flex items-center gap-2">
                        {/* Live indicator */}
                        <div className="hidden md:flex items-center gap-1.5 mr-2">
                            <span
                                className="h-1.5 w-1.5 rounded-full animate-pulse"
                                style={{ backgroundColor: 'var(--accent)' }}
                            />
                            <span
                                className="text-[9px] tracking-[0.28em] uppercase"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                Live
                            </span>
                        </div>

                        {/* Interface toggle */}
                        <button
                            onClick={toggleCouncil}
                            aria-label={councilOpen ? 'Close Interface' : 'Open Interface'}
                            className="hidden md:flex flex-col items-center px-3 py-1.5 transition-colors"
                            style={{ color: councilOpen ? 'var(--accent)' : 'var(--text-muted)' }}
                        >
                            <span className="text-[12px] font-medium tracking-[0.2em] uppercase transition-colors">
                                Interface
                            </span>
                            <span className="text-[9px] tracking-[0.18em] uppercase opacity-60">
                                ϟ Chamber
                            </span>
                        </button>

                        {/* Theme toggle */}
                        <button
                            onClick={toggle}
                            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                            className="flex h-8 w-8 items-center justify-center border transition-opacity hover:opacity-70"
                            style={{ borderColor: 'var(--surface-border)', color: 'var(--accent)' }}
                        >
                            {theme === 'dark' ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="4" />
                                    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                                </svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                </svg>
                            )}
                        </button>

                        {/* Settings */}
                        <button
                            onClick={() => setSettingsOpen(true)}
                            aria-label="Open settings"
                            className="flex h-8 w-8 items-center justify-center border transition-opacity hover:opacity-70"
                            style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}
                        >
                            {/* Gear icon */}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>

            <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </>
    );
}
