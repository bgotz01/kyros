import TrendPressureChart from '../components/cycle/TrendPressureChart';

export default function CyclePage() {
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
            <section className="relative mx-auto max-w-5xl px-6 py-8">
                <TrendPressureChart height={400} />
            </section>
        </main>
    );
}
