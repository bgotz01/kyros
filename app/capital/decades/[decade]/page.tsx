import { notFound } from 'next/navigation';
import { INVESTMENT_THEMES, DECADE_SLUGS, type InvestmentTheme } from '@/lib/capitalData';

// ─── static params ────────────────────────────────────────────────────────────

export function generateStaticParams() {
    return DECADE_SLUGS.map((decade) => ({ decade }));
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function DecadeThemesPage({
    params,
}: {
    params: Promise<{ decade: string }>;
}) {
    const { decade } = await params;
    const data = INVESTMENT_THEMES.find((d) => d.decade === decade);
    if (!data) notFound();

    return (
        <div className="px-8 py-8">
            <div className="mb-8 flex items-center gap-5">
                <h2 className="font-serif text-3xl font-light tracking-[0.1em] text-marble">
                    {data.decade}
                </h2>
                <span aria-hidden className="h-px flex-1 bg-stone-line" />
                <span className="font-mono text-[0.6rem] tracking-[0.14em] text-platinum-dim">
                    {data.themes.length} {data.themes.length === 1 ? 'theme' : 'themes'}
                </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.themes.map((theme) => (
                    <ThemeCard key={theme.name} theme={theme} />
                ))}
            </div>
        </div>
    );
}

// ─── theme card ───────────────────────────────────────────────────────────────

function ThemeCard({ theme }: { theme: InvestmentTheme }) {
    return (
        <div className="flex flex-col gap-4 border border-stone-line bg-charcoal p-5 transition-colors duration-300 ease-mechanical hover:border-stone-line-strong">

            <div className="flex flex-col gap-2 border-b border-stone-line pb-4">
                <h3 className="font-serif text-base font-light leading-snug tracking-[0.06em] text-marble">
                    {theme.name}
                </h3>
                <p className="font-sans text-[0.64rem] leading-relaxed tracking-[0.04em] text-platinum">
                    {theme.narrative}
                </p>
            </div>

            <div className="flex flex-col gap-2">
                <span className="font-sans text-[0.55rem] uppercase tracking-[0.22em] text-platinum-dim">
                    Assets
                </span>
                <div className="flex flex-wrap gap-1.5">
                    {theme.assets.map((asset) => (
                        <span
                            key={asset}
                            className="border border-stone-line px-2 py-0.5 font-mono text-[0.58rem] tracking-[0.08em] text-platinum"
                        >
                            {asset}
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <span className="font-sans text-[0.55rem] uppercase tracking-[0.22em] text-platinum-dim">
                    Examples
                </span>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {theme.examples.map((ex) => (
                        <span
                            key={ex}
                            className="font-sans text-[0.62rem] tracking-[0.06em] text-bronze"
                        >
                            {ex}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
