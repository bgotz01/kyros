import StockScreener from '@/app/components/stocks/StockScreener';

export const metadata = {
    title: 'Stock Screener — Panteon',
    description: 'Filter and rank equities across fundamentals, technicals, and returns.',
};

export default function StockScreenerPage() {
    return (
        <main style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}>
            <div className="fixed inset-0 pointer-events-none" style={{ background: 'var(--bg-glow)' }} />

            <section className="relative mx-auto max-w-[1600px] px-6 pt-8 pb-12">
                {/* breadcrumb */}
                <div className="flex items-center gap-3 border-b pb-3 mb-8 text-[10px] tracking-[0.3em] uppercase"
                    style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}>
                    <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
                    <span style={{ color: 'var(--accent)' }}>Panteon</span>
                    <span>/</span>
                    <span>Stocks</span>
                    <span>/</span>
                    <span>Screener</span>
                </div>

                <div className="mb-6">
                    <h1 className="text-2xl font-semibold tracking-[0.08em]" style={{ color: 'var(--text-primary)' }}>
                        Stock Screener
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                        {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        {' · '}drag columns to reorder · click header to sort
                    </p>
                </div>

                <StockScreener />
            </section>
        </main>
    );
}
