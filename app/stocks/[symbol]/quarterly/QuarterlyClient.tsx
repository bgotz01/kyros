'use client';

import StockSubNavbar from '@/app/components/stocks/StockSubNavbar';
import StockProfileBox from '@/app/components/stocks/StockProfileBox';
import QuarterlyTable from '@/app/components/stocks/QuarterlyTable';
import type {
    StockProfile,
    LatestPrice,
    QuarterlyRow,
    TTMData,
} from '@/app/lib/queries/stocks';

interface Props {
    symbol: string;
    profile: StockProfile;
    latestPrice: LatestPrice;
    rows: QuarterlyRow[];
    ttm: TTMData;
}

export default function QuarterlyClient({
    symbol,
    profile,
    latestPrice,
    rows,
    ttm,
}: Props) {
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

                    {rows.length > 0 ? (
                        <QuarterlyTable rows={rows} ttm={ttm} />
                    ) : (
                        <div
                            className="border rounded px-5 py-4 text-sm"
                            style={{
                                borderColor: 'var(--surface-border)',
                                color: 'var(--text-muted)',
                            }}
                        >
                            No quarterly data found for <strong style={{ color: 'var(--text-primary)' }}>{symbol}</strong>.
                        </div>
                    )}

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
