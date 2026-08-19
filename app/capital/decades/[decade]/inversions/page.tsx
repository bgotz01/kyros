import { notFound } from 'next/navigation';
import { INVESTMENT_THEMES, DECADE_SLUGS } from '@/lib/capitalData';
import { DECADE_PARADIGMS, type DecadeParadigm } from '../paradigm';

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

    const paradigmIndex = DECADE_PARADIGMS.findIndex((p) => p.decade === decade);
    const current = DECADE_PARADIGMS[paradigmIndex];
    const previous = paradigmIndex > 0 ? DECADE_PARADIGMS[paradigmIndex - 1] : null;

    return (
        <div className="px-8 py-8">
            <div className="mb-8 flex items-center gap-5">
                <h2 className="font-serif text-3xl font-light tracking-[0.1em] text-marble">
                    {data.decade} · Inversions
                </h2>
                <span aria-hidden className="h-px flex-1 bg-stone-line" />
            </div>

            {current && previous ? (
                <ParadigmShiftTable previous={previous} current={current} />
            ) : (
                <p className="font-sans text-[0.65rem] uppercase tracking-[0.22em] text-platinum-dim">
                    No prior paradigm to compare.
                </p>
            )}
        </div>
    );
}

// ─── paradigm shift table ─────────────────────────────────────────────────────

function ParadigmShiftTable({
    previous,
    current,
}: {
    previous: DecadeParadigm;
    current: DecadeParadigm;
}) {
    const rows = [
        { dimension: 'Asset Class', prev: previous.assetClass, next: current.assetClass },
        { dimension: 'Geography', prev: previous.geography, next: current.geography },
        { dimension: 'Sector / Theme', prev: previous.sectorTheme, next: current.sectorTheme },
    ];

    return (
        <div className="max-w-lg">
            <div className="mb-3 flex items-center gap-3">
                <span className="font-mono text-[0.6rem] tracking-[0.18em] text-bronze">
                    {previous.decade}
                </span>
                <span className="font-mono text-[0.6rem] text-platinum-dim">→</span>
                <span className="font-mono text-[0.6rem] tracking-[0.18em] text-bronze-bright">
                    {current.decade}
                </span>
            </div>
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b-2 border-stone-line-strong">
                        <th className="pb-3 pr-6 text-left font-sans text-[0.7rem] uppercase tracking-[0.2em] text-platinum-dim">
                            Dimension
                        </th>
                        <th className="pb-3 pr-4 text-left font-sans text-[0.7rem] uppercase tracking-[0.2em] text-platinum-dim">
                            Previous
                        </th>
                        <th className="pb-3 pr-4 text-center font-mono text-[0.7rem] text-platinum-dim">→</th>
                        <th className="pb-3 text-left font-sans text-[0.7rem] uppercase tracking-[0.2em] text-platinum-dim">
                            New
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-stone-line">
                    {rows.map(({ dimension, prev, next }) => (
                        <tr
                            key={dimension}
                            className="group transition-colors duration-300 ease-mechanical hover:bg-charcoal"
                        >
                            <td className="py-4 pr-6 align-top font-serif text-sm font-light tracking-[0.04em] text-marble">
                                {dimension}
                            </td>
                            <td className="py-4 pr-4 align-top font-sans text-[0.72rem] leading-relaxed tracking-[0.06em] text-platinum-dim">
                                {prev}
                            </td>
                            <td className="py-4 pr-4 text-center align-top font-mono text-[0.72rem] text-platinum-dim">
                                →
                            </td>
                            <td className="py-4 align-top font-sans text-[0.72rem] font-medium leading-relaxed tracking-[0.06em] text-bronze-bright">
                                {next}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
