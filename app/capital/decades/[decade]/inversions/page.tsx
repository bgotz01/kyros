import { notFound } from 'next/navigation';
import { DECADE_SLUGS } from '@/lib/capital/decades';
import { INVESTMENT_THEMES } from '@/lib/capital/themes';
import { PARADIGMS } from '@/lib/capital/paradigms';
import ParadigmShiftTable from '../../../components/ParadigmShiftTable';

export function generateStaticParams() {
    return DECADE_SLUGS.map((decade) => ({ decade }));
}

export default async function DecadeInversionsPage({
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
            <div className="mb-8 flex items-center gap-5">
                <h2 className="font-serif text-3xl font-light tracking-[0.1em] text-marble">
                    {data.decade} · Inversions
                </h2>
                <span aria-hidden className="h-px flex-1 bg-stone-line" />
            </div>

            {current && previous ? (
                <ParadigmShiftTable previous={previous} current={current} showDecades />
            ) : (
                <p className="font-sans text-[0.65rem] uppercase tracking-[0.22em] text-platinum-dim">
                    No prior paradigm to compare.
                </p>
            )}
        </div>
    );
}
