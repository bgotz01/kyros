import StockLeaderboard from '@/app/components/stocks/StockLeaderboard';

export const metadata = {
    title: 'Stocks — Panteon',
    description: 'Equity leaderboard by market capitalisation.',
};

export default function StocksPage() {
    return (
        <main
            style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
        >
            {/* Ambient glow */}
            <div
                className="fixed inset-0 pointer-events-none"
                style={{ background: 'var(--bg-glow)' }}
            />

            <section className="relative mx-auto max-w-7xl px-6 pt-8 pb-12">
                {/* Page header */}
                <div
                    className="flex items-center gap-3 border-b pb-3 mb-8 text-[10px] tracking-[0.3em] uppercase"
                    style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}
                >
                    <span
                        className="h-1.5 w-1.5 rounded-full animate-pulse"
                        style={{ backgroundColor: 'var(--accent)' }}
                    />
                    <span style={{ color: 'var(--accent)' }}>Panteon</span>
                    <span>/</span>
                    <span>Stocks</span>
                    <span
                        className="ml-auto text-[9px]"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        Equity Screen
                    </span>
                </div>

                {/* Title */}
                <div className="mb-8">
                    <h1
                        className="text-2xl font-semibold tracking-[0.08em]"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Equity Leaderboard
                    </h1>
                    <p
                        className="mt-1 text-sm"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        Top 30 by market capitalisation · click any symbol to view financials
                    </p>
                </div>

                <StockLeaderboard />
            </section>
        </main>
    );
}
