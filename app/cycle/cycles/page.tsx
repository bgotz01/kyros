import RegimeCyclesTimeline from '@/app/components/regime/RegimeCyclesTimeline';

export default function CyclesPage() {
    return (
        <main style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}>
            <div className="fixed inset-0 pointer-events-none" style={{ background: 'var(--bg-glow)' }} />
            <section className="relative mx-auto max-w-4xl px-6 pt-8 pb-10 space-y-6">
                {/* Page header */}
                <div className="border-b pb-3 flex items-center gap-3 text-[10px] tracking-[0.3em] uppercase"
                    style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                    <span style={{ color: 'var(--accent)' }}>Panteon</span>
                    <span>/</span>
                    <span>Cycle</span>
                    <span>/</span>
                    <span>Macro Cycles</span>
                </div>

                <div>
                    <h1 className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: 'var(--accent)' }}>
                        Macro Regime Cycles
                    </h1>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        Long-run structural regimes — the transmission mechanisms behind each macro era
                    </p>
                </div>

                <RegimeCyclesTimeline />
            </section>
        </main>
    );
}
