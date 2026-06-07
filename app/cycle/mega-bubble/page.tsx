import MegaBubble from '@/app/components/cycle/mega-bubble';

export default function MegaBubblePage() {
    return (
        <main style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}>
            <div className="fixed inset-0 pointer-events-none" style={{ background: 'var(--bg-glow)' }} />
            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    opacity: 'var(--grid-opacity)',
                    backgroundImage: `linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
                                      linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)`,
                    backgroundSize: '44px 44px',
                }}
            />
            <section className="relative mx-auto max-w-5xl px-6 pt-8 pb-12 space-y-6">
                {/* Breadcrumb */}
                <div className="border-b pb-3 flex items-center gap-3 text-[10px] tracking-[0.3em] uppercase"
                    style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                    <span style={{ color: 'var(--accent)' }}>Kyros</span>
                    <span>/</span>
                    <span>Cycle</span>
                    <span>/</span>
                    <span>Mega-Bubble</span>
                </div>

                {/* Title */}
                <div>
                    <h1 className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: 'var(--accent)' }}>
                        Mega-Bubble Analysis
                    </h1>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        Dow Jones 1929 · Nikkei 1989 · Nasdaq 2000 — three generational peaks compared
                    </p>
                </div>

                <MegaBubble />
            </section>
        </main>
    );
}
