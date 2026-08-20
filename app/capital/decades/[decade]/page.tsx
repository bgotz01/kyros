import { notFound } from 'next/navigation';
import { DECADE_SLUGS } from '@/lib/capital/decades';
import { INVESTMENT_THEMES, type InvestmentTheme } from '@/lib/capital/themes';
import { PARADIGMS } from '@/lib/capital/paradigms';
import ParadigmShiftTable from '../../components/ParadigmShiftTable';

// ─── static params ────────────────────────────────────────────────────────────

export function generateStaticParams() {
    return DECADE_SLUGS.map((decade) => ({ decade }));
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function DecadePage({
    params,
}: {
    params: Promise<{ decade: string }>;
}) {
    const { decade } = await params;
    const data = INVESTMENT_THEMES.find((d) => d.decade === decade);
    if (!data) notFound();

    const paradigmIndex = PARADIGMS.findIndex((p) => p.decade === decade);
    const current = PARADIGMS[paradigmIndex];
    const previous = paradigmIndex > 0 ? PARADIGMS[paradigmIndex - 1] : null;

    return (
        <div className="px-8 py-8">

            {/* ── header ──────────────────────────────────────────────────────── */}
            <div className="mb-10 flex items-center gap-5">
                <h2 className="font-serif text-3xl font-light tracking-[0.1em] text-marble">
                    {data.decade}
                </h2>
                <span aria-hidden className="h-px flex-1 bg-stone-line" />
            </div>

            {/* ── I¹ Inversion ────────────────────────────────────────────────── */}
            <Section label="I¹" title="Inversion">
                {current && previous ? (
                    <ParadigmShiftTable
                        previous={previous}
                        current={current}
                        markUnchanged
                        layout="centered"
                    />
                ) : (
                    <p className="font-sans text-[0.65rem] uppercase tracking-[0.22em] text-platinum-dim">
                        No prior paradigm to compare.
                    </p>
                )}
            </Section>

            {/* ── Themes ──────────────────────────────────────────────────────── */}
            <Section label="" title="Themes">
                <ThemesTable themes={data.themes} />
            </Section>

        </div>
    );
}

// ─── section wrapper ──────────────────────────────────────────────────────────

function Section({
    label,
    title,
    children,
}: {
    label: string;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="mb-12">
            <div className="mb-5 flex items-center gap-4">
                {label && (
                    <span className="font-mono text-[0.6rem] tracking-[0.18em] text-bronze">
                        {label}
                    </span>
                )}
                <span className="font-sans text-[0.7rem] uppercase tracking-[0.26em] text-platinum-dim">
                    {title}
                </span>
                <span aria-hidden className="h-px flex-1 bg-stone-line" />
            </div>
            {children}
        </div>
    );
}

// ─── themes table ─────────────────────────────────────────────────────────────

function ThemesTable({ themes }: { themes: InvestmentTheme[] }) {
    return (
        <table className="w-full border-collapse">
            <thead>
                <tr className="border-b border-stone-line-strong">
                    <th className="pb-2 pr-6 text-left font-sans text-[0.65rem] uppercase tracking-[0.2em] text-platinum-dim">
                        Theme
                    </th>
                    <th className="pb-2 pr-6 text-left font-sans text-[0.65rem] uppercase tracking-[0.2em] text-platinum-dim">
                        Narrative
                    </th>
                    <th className="pb-2 text-left font-sans text-[0.65rem] uppercase tracking-[0.2em] text-platinum-dim">
                        Assets
                    </th>
                </tr>
            </thead>
            <tbody className="divide-y divide-stone-line">
                {themes.map((theme) => (
                    <tr key={theme.name} className="group transition-colors duration-300 ease-mechanical hover:bg-charcoal">
                        <td className="py-2.5 pr-6 align-top font-serif text-[0.8rem] font-light tracking-[0.03em] text-marble whitespace-nowrap">
                            {theme.name}
                        </td>
                        <td className="py-2.5 pr-6 align-top font-sans text-[0.67rem] leading-relaxed tracking-[0.03em] text-platinum">
                            {theme.narrative}
                        </td>
                        <td className="py-2.5 align-top">
                            <div className="flex flex-wrap gap-1">
                                {theme.assets.map((asset) => (
                                    <span
                                        key={asset}
                                        className="border border-stone-line px-1.5 py-px font-mono text-[0.55rem] tracking-[0.06em] text-platinum-dim"
                                    >
                                        {asset}
                                    </span>
                                ))}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
