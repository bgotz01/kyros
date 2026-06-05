import { notFound } from 'next/navigation';
import { slugToRegime, isValidRegimeSlug, ALL_REGIME_SLUGS } from '@/app/lib/regime-slugs';
import RegimeDetailView from '@/app/components/regime/RegimeDetailView';

interface Props {
    params: Promise<{ regime: string }>;
}

/** Pre-render all known regime slugs at build time */
export function generateStaticParams() {
    return ALL_REGIME_SLUGS.map(regime => ({ regime }));
}

export default async function RegimeDetailPage({ params }: Props) {
    const { regime: slug } = await params;

    if (!isValidRegimeSlug(slug)) notFound();

    const regime = slugToRegime(slug)!;

    return (
        <main style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}>
            <div className="fixed inset-0 pointer-events-none" style={{ background: 'var(--bg-glow)' }} />
            <section className="relative mx-auto max-w-5xl px-6 pt-8 pb-12">
                <RegimeDetailView slug={slug} regime={regime} />
            </section>
        </main>
    );
}
