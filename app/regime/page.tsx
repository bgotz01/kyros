import RegimeEngine from '@/app/components/regime/RegimeEngine';

export default function RegimePage() {
    return (
        <main
            style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
        >
            {/* Ambient background */}
            <div
                className="fixed inset-0 pointer-events-none"
                style={{ background: 'var(--bg-glow)' }}
            />

            <section className="relative mx-auto max-w-4xl px-6 pt-8 pb-6">
                <RegimeEngine />
            </section>
        </main>
    );
}
