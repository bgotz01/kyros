'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

interface Props {
    symbol: string;
}

const links = [
    { label: 'Overview', path: '' },
    { label: 'Financials', path: 'financials' },
    { label: 'Quarterly', path: 'quarterly' },
    { label: 'Chart', path: 'chart' },
    { label: 'Insider', path: 'insider' },
    { label: 'Divergence', path: 'divergence' },
    { label: 'Price Data', path: 'pricedata' },
];

export default function StockSubNavbar({ symbol }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const [ticker, setTicker] = useState(symbol.toUpperCase());

    const activePath = (() => {
        for (const { path } of links) {
            if (path && pathname.includes(`/${path}`)) return path;
        }
        return '';
    })();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dest = activePath
            ? `/stocks/${ticker.toUpperCase()}/${activePath}`
            : `/stocks/${ticker.toUpperCase()}`;
        router.push(dest);
    };

    return (
        <div
            className="sticky top-[90px] z-40 border-b backdrop-blur-md mt-4"
            style={{
                backgroundColor: 'rgba(7,6,5,0.92)',
                borderColor: 'var(--surface-border)',
            }}
        >
            <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-3">
                {/* Ticker input */}
                <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-shrink-0">
                    <span
                        className="text-xs font-bold tracking-widest"
                        style={{ color: 'var(--accent)' }}
                    >
                        $
                    </span>
                    <input
                        type="text"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value.toUpperCase())}
                        className="w-24 border bg-transparent px-2 py-1 text-sm text-center font-semibold tracking-widest focus:outline-none focus:ring-1 transition-colors"
                        style={{
                            borderColor: 'var(--surface-border)',
                            color: 'var(--text-primary)',
                        }}
                        placeholder="TICKER"
                        spellCheck={false}
                    />
                    <button
                        type="submit"
                        className="border px-3 py-1 text-xs tracking-widest uppercase transition-opacity hover:opacity-70"
                        style={{
                            borderColor: 'var(--surface-border)',
                            color: 'var(--accent)',
                        }}
                    >
                        Go
                    </button>
                </form>

                {/* Nav links */}
                <nav className="hidden md:flex items-center gap-1">
                    {links.map(({ label, path }) => {
                        const isActive = path === activePath;
                        return (
                            <Link
                                key={label}
                                href={
                                    path
                                        ? `/stocks/${symbol}/${path}`
                                        : `/stocks/${symbol}`
                                }
                                className="px-3 py-1 text-[11px] tracking-[0.18em] uppercase transition-colors"
                                style={{
                                    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                                    borderBottom: isActive ? '1px solid var(--accent)' : '1px solid transparent',
                                }}
                            >
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Mobile select */}
                <select
                    className="md:hidden flex-1 border bg-transparent px-2 py-1 text-sm focus:outline-none"
                    style={{
                        borderColor: 'var(--surface-border)',
                        color: 'var(--text-secondary)',
                    }}
                    value={activePath}
                    onChange={(e) => {
                        const p = e.target.value;
                        router.push(p ? `/stocks/${symbol}/${p}` : `/stocks/${symbol}`);
                    }}
                >
                    {links.map(({ label, path }) => (
                        <option key={label} value={path}>
                            {label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
