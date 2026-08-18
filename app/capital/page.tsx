export default function CapitalPage() {
    return (
        <div className="mx-auto w-full max-w-[1100px] px-8 py-20">

            {/* ── header ──────────────────────────────────────────────────────── */}
            <div className="mb-16">
                <div className="mb-6 flex flex-wrap items-baseline gap-x-8 gap-y-3">
                    <h1 className="font-serif text-4xl font-light tracking-[0.12em] text-marble">
                        Capital
                    </h1>
                    <span className="font-mono text-[0.72rem] tracking-[0.22em] text-bronze">
                        F = f(R, C, D)
                    </span>
                </div>
                <div className="mb-4 flex flex-wrap gap-x-8 gap-y-2">
                    {[
                        { symbol: 'R', label: 'Return potential', desc: 'Where can scarce capital earn above-average returns?' },
                        { symbol: 'C', label: 'Capacity', desc: 'What can absorb large flows without saturation?' },
                        { symbol: 'D', label: 'Displacement', desc: 'What is structurally replacing the prior frontier?' },
                    ].map(({ symbol, label, desc }) => (
                        <div key={symbol} className="flex items-baseline gap-2">
                            <span className="font-serif text-base font-light text-bronze-bright">{symbol}</span>
                            <span className="font-sans text-[0.6rem] uppercase tracking-[0.18em] text-platinum">{label}</span>
                            <span className="hidden font-sans text-[0.6rem] tracking-[0.04em] text-platinum-dim sm:inline">— {desc}</span>
                        </div>
                    ))}
                </div>
                <p className="font-sans text-[0.65rem] uppercase tracking-[0.28em] text-platinum-dim">
                    Where the world's capital has moved — decade by decade
                </p>
            </div>

            {/* ── table ───────────────────────────────────────────────────────── */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b-2 border-stone-line-strong">
                            <th className="pb-4 pr-8 text-left font-sans text-[0.65rem] uppercase tracking-[0.22em] text-platinum-dim">
                                Decade
                            </th>
                            <th className="pb-4 pr-8 text-left font-sans text-[0.65rem] uppercase tracking-[0.22em] text-platinum-dim">
                                Geography
                            </th>
                            <th className="pb-4 pr-8 text-left font-sans text-[0.65rem] uppercase tracking-[0.22em] text-platinum-dim">
                                Theme
                            </th>
                            <th className="pb-4 pr-8 text-left font-sans text-[0.65rem] uppercase tracking-[0.22em] text-platinum-dim">
                                Sector
                            </th>
                            <th className="pb-4 pr-8 text-left font-sans text-[0.65rem] uppercase tracking-[0.22em] text-platinum-dim">
                                Index / Asset
                            </th>
                            <th className="pb-4 text-left font-sans text-[0.65rem] uppercase tracking-[0.22em] text-platinum-dim">
                                Narrative
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-line">
                        {ROWS.map(({ decade, geography, theme, sector, index, mechanism }) => (
                            <tr
                                key={decade}
                                className="group transition-colors duration-300 ease-mechanical hover:bg-charcoal"
                            >
                                <td className="py-5 pr-8 align-top font-mono text-[0.72rem] tracking-[0.14em] text-bronze">
                                    {decade}
                                </td>
                                <td className="py-5 pr-8 align-top font-sans text-[0.72rem] leading-relaxed tracking-[0.06em] text-platinum">
                                    {geography}
                                </td>
                                <td className="py-5 pr-8 align-top font-serif text-base font-light leading-snug tracking-[0.04em] text-marble">
                                    {theme}
                                </td>
                                <td className="py-5 pr-8 align-top text-sm leading-relaxed tracking-[0.03em] text-platinum">
                                    {sector}
                                </td>
                                <td className="py-5 pr-8 align-top font-mono text-[0.68rem] leading-relaxed tracking-[0.06em] text-platinum-dim">
                                    {index ?? '—'}
                                </td>
                                <td className="py-5 align-top">
                                    <span className="font-sans text-[0.6rem] uppercase tracking-[0.18em] text-bronze-bright">
                                        {mechanism}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── data ─────────────────────────────────────────────────────────────────────

const ROWS = [
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
