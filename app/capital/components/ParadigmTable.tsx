'use client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParadigmRow {
    decade: string;
    geography: string;
    theme: string;
    sector: string;
    index?: string;
    mechanism: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ROWS: ParadigmRow[] = [
    {
        decade: '1950s',
        geography: '🇪🇺 Europe',
        theme: 'Postwar reconstruction',
        sector: 'Industrial plant, machinery, infrastructure, manufacturing',
        index: 'Europe GFD Composite',
        mechanism: 'Rebuilding',
    },
    {
        decade: '1960s',
        geography: '🇺🇸 United States',
        theme: 'Corporate / multinational expansion',
        sector: 'Consumer goods, industrials, multinational corporations',
        index: 'U.S. Nifty 50',
        mechanism: 'Scale',
    },
    {
        decade: '1970s',
        geography: '🌍 Commodities',
        theme: 'Oil / commodity complex',
        sector: 'Energy production, oil exporters, commodity assets',
        index: 'Gold & Oil prices',
        mechanism: 'Scarcity',
    },
    {
        decade: '1980s',
        geography: '🇯🇵 Japan',
        theme: 'Asset bubble',
        sector: 'Equities, property, banks, industrial champions',
        index: 'TOPIX Index',
        mechanism: 'Asset appreciation + credit',
    },
    {
        decade: '1990s',
        geography: '🇺🇸 United States',
        theme: 'Technology boom',
        sector: 'PCs, semiconductors, telecom, software, internet',
        index: 'Nasdaq Index',
        mechanism: 'Digitization',
    },
    {
        decade: '2000s',
        geography: '🇨🇳 China · Emerging markets',
        theme: 'Industrialization + commodities',
        sector: 'Factories, infrastructure, mining, energy, emerging markets',
        index: 'BRICs & Oil prices',
        mechanism: 'Industrialization',
    },
    {
        decade: '2010s',
        geography: '🇺🇸 United States',
        theme: 'Platform / cloud technology',
        sector: 'Apple, Microsoft, Google, Amazon, Meta; SaaS / private tech',
        index: 'FAANG',
        mechanism: 'Intangibles + network scale',
    },
    {
        decade: '2020s',
        geography: '🇺🇸 United States',
        theme: 'AI / compute / power ecosystem',
        sector: 'Semiconductors, datacenters, power, hyperscalers',
        index: undefined,
        mechanism: 'Intelligence infrastructure',
    },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ParadigmTable() {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b-2 border-stone-line-strong">
                        <th className="pb-4 pr-8 text-left font-sans text-[0.85rem] uppercase tracking-[0.22em] text-platinum-dim">
                            Decade
                        </th>
                        <th className="pb-4 pr-8 text-left font-sans text-[0.85rem] uppercase tracking-[0.22em] text-platinum-dim">
                            Geography
                        </th>
                        <th className="pb-4 pr-8 text-left font-sans text-[0.85rem] uppercase tracking-[0.22em] text-platinum-dim">
                            Theme
                        </th>
                        <th className="pb-4 pr-8 text-left font-sans text-[0.85rem] uppercase tracking-[0.22em] text-platinum-dim">
                            Sector
                        </th>
                        <th className="pb-4 pr-8 text-left font-sans text-[0.85rem] uppercase tracking-[0.22em] text-platinum-dim">
                            Index / Asset
                        </th>
                        <th className="pb-4 text-left font-sans text-[0.85rem] uppercase tracking-[0.22em] text-platinum-dim">
                            Narrative
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-stone-line">
                    {ROWS.map((row) => (
                        <tr
                            key={row.decade}
                            className="group transition-colors duration-300 ease-mechanical hover:bg-charcoal"
                        >
                            <td className="py-5 pr-8 align-top font-mono text-[0.72rem] tracking-[0.14em] text-bronze">
                                {row.decade}
                            </td>
                            <td className="py-5 pr-8 align-top font-sans text-[0.72rem] leading-relaxed tracking-[0.06em] text-platinum">
                                {row.geography}
                            </td>
                            <td className="py-5 pr-8 align-top font-serif text-base font-light leading-snug tracking-[0.04em] text-marble">
                                {row.theme}
                            </td>
                            <td className="py-5 pr-8 align-top font-sans text-[0.72rem] leading-relaxed tracking-[0.06em] text-platinum">
                                {row.sector}
                            </td>
                            <td className="py-5 pr-8 align-top font-mono text-[0.68rem] leading-relaxed tracking-[0.06em] text-platinum-dim">
                                {row.index ?? '—'}
                            </td>
                            <td className="py-5 align-top">
                                <span className="font-sans text-[0.6rem] uppercase tracking-[0.18em] text-bronze-bright">
                                    {row.mechanism}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
