import { notFound } from 'next/navigation';
import { INVESTMENT_THEMES, DECADE_SLUGS } from '@/lib/capitalData';

export function generateStaticParams() {
    return DECADE_SLUGS.map((decade) => ({ decade }));
}

export default async function DecadeInflectionsPage({
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
                    {data.decade} · Inflections
                </h2>
                <span aria-hidden className="h-px flex-1 bg-stone-line" />
            </div>
            <p className="font-sans text-[0.65rem] uppercase tracking-[0.22em] text-platinum-dim">
                Coming soon
            </p>
        </div>
    );
}
