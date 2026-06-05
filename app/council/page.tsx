'use client';

import CouncilChat from '@/app/components/CouncilChat';

export default function CouncilPage() {
    return (
        <main
            style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
        >
            {/* Ambient background */}
            <div
                className="fixed inset-0 pointer-events-none"
                style={{ background: 'var(--bg-glow)' }}
            />
            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    opacity: 'var(--grid-opacity)',
                    backgroundImage: `linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
                            linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)`,
                    backgroundSize: '44px 44px',
                }}
            />

            <section className="relative mx-auto max-w-4xl px-6 py-6 flex flex-col" style={{ minHeight: 'calc(100dvh - 52px)' }}>
                {/* Header strip */}
                <div
                    className="mb-6 flex items-center gap-3 border-b pb-3 text-[10px] tracking-[0.3em] uppercase shrink-0"
                    style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}
                >
                    <span
                        className="h-1.5 w-1.5 rounded-full animate-pulse"
                        style={{ backgroundColor: 'var(--accent)' }}
                    />
                    <span style={{ color: 'var(--accent)' }}>Panteon</span>
                    <span>/</span>
                    <span>Council</span>
                </div>

                {/* Chat fills remaining height */}
                <div
                    className="flex-1 border overflow-hidden flex flex-col"
                    style={{
                        borderColor: 'var(--surface-border)',
                        backgroundColor: 'var(--surface)',
                    }}
                >
                    <CouncilChat />
                </div>
            </section>
        </main>
    );
}
