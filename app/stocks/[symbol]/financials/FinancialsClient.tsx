'use client';

import { useState } from 'react';
import StockSubNavbar from '@/app/components/stocks/StockSubNavbar';
import StockProfileBox from '@/app/components/stocks/StockProfileBox';
import StockAnnualTable from '@/app/components/stocks/StockAnnualTable';
import type {
    StockProfile,
    LatestPrice,
    TTMData,
} from '@/app/lib/queries/stocks';

interface Props {
    symbol: string;
    profile: StockProfile;
    latestPrice: LatestPrice;
    ttm: TTMData;
    stock: Record<string, string | number>;
    baseYears: string[];
    oldYears: string[];
    capLookup: Record<string, number>;
}

export default function FinancialsClient({
    symbol,
    profile,
    latestPrice,
    ttm,
    stock,
    baseYears,
    oldYears,
    capLookup,
}: Props) {
    const [showOld, setShowOld] = useState(false);
    const years = showOld ? [...baseYears, ...oldYears] : baseYears;

    return (
        <main style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}>
            {/* ambient glow */}
            <div
                className="fixed inset-0 pointer-events-none"
                style={{ background: 'var(--bg-glow)' }}
            />

            <div className="relative">
                <StockSubNavbar symbol={symbol} />

                <section className="mx-auto max-w-7xl px-6 py-8 space-y-6">
                    <StockProfileBox
                        symbol={symbol}
                        profile={profile}
                        latest={latestPrice}
                        ttm={ttm}
                    />

                    {/* Controls */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowOld((v) => !v)}
                            className="border px-4 py-1.5 text-[11px] tracking-[0.18em] uppercase transition-opacity hover:opacity-70"
                            style={{
                                borderColor: 'var(--surface-border)',
                                color: showOld ? 'var(--accent)' : 'var(--text-muted)',
                            }}
                        >
                            {showOld ? 'Hide Historical' : 'Show Historical'}
                        </button>
                    </div>

                    <StockAnnualTable
                        stock={stock}
                        years={years}
                        capLookup={capLookup}
                    />

                    <p
                        className="text-[11px]"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        Values in millions USD
                    </p>
                </section>
            </div>
        </main>
    );
}
