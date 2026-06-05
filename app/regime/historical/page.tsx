import RegimeTimelineBar from '@/app/components/regime/RegimeTimelineBar';
import RegimeHistoryTable from '@/app/components/regime/RegimeHistoryTable';

export default function RegimeHistoricalPage() {
    return (
        <main style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}>
            <div className="fixed inset-0 pointer-events-none" style={{ background: 'var(--bg-glow)' }} />
            <section className="relative mx-auto max-w-5xl px-6 pt-8 pb-10 space-y-6">
                {/* Page header */}
                <div className="border-b pb-3 flex items-center gap-3 text-[10px] tracking-[0.3em] uppercase"
                    style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                    <span style={{ color: 'var(--accent)' }}>Panteon</span>
                    <span>/</span>
                    <span>Regime</span>
                    <span>/</span>
                    <span>Historical</span>
                </div>

                {/* Timeline bar */}
                <RegimeTimelineBar />

                {/* History table */}
                <RegimeHistoryTable />
            </section>
        </main>
    );
}
