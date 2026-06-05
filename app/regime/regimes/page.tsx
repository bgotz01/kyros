import Link from 'next/link';
import { REGIME_METADATA } from '@/app/lib/regime-state-machine';
import type { RegimeFamily } from '@/app/lib/regime-state-machine';
import { regimeToSlug, ALL_REGIME_SLUGS } from '@/app/lib/regime-slugs';
import { slugToRegime } from '@/app/lib/regime-slugs';

const REGIME_ORDER: RegimeFamily[] = ALL_REGIME_SLUGS.map(s => slugToRegime(s)!);

export default function RegimesIndexPage() {
    return (
        <main style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}>
            <div className="fixed inset-0 pointer-events-none" style={{ background: 'var(--bg-glow)' }} />
            <section className="relative mx-auto max-w-5xl px-6 pt-8 pb-12 space-y-6">

                {/* Header */}
                <div className="border-b pb-3 flex items-center gap-3 text-[10px] tracking-[0.3em] uppercase"
                    style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                    <span style={{ color: 'var(--accent)' }}>Panteon</span>
                    <span>/</span>
                    <span>Regime</span>
                    <span>/</span>
                    <span>All Regimes</span>
                </div>

                <div>
                    <h1 className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: 'var(--accent)' }}>
                        Regime Library
                    </h1>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        Select a regime to view all historical periods, SPX & NDX returns, and backtest strategies.
                    </p>
                </div>

                {/* Regime cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {REGIME_ORDER.map(regime => {
                        const meta = REGIME_METADATA[regime];
                        const slug = regimeToSlug(regime);
                        return (
                            <Link
                                key={regime}
                                href={`/regime/${slug}`}
                                className="block border p-5 transition-opacity hover:opacity-75 group"
                                style={{ borderColor: meta.color + '40', backgroundColor: meta.color + '08' }}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-1"
                                            style={{ color: meta.color }}>
                                            {regime}
                                        </div>
                                        <p className="text-[11px] leading-5" style={{ color: 'var(--text-secondary)' }}>
                                            {meta.description}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-[10px] uppercase tracking-widest mt-0.5 opacity-50 group-hover:opacity-100 transition-opacity"
                                        style={{ color: meta.color }}>
                                        →
                                    </span>
                                </div>
                                <div className="mt-3 pt-3 border-t text-[10px]"
                                    style={{ borderColor: meta.color + '25', color: 'var(--text-muted)' }}>
                                    {meta.guidance}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>
        </main>
    );
}
