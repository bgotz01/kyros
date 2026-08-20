import ParadigmTable from './components/ParadigmTable';

export default function CapitalPage() {
    return (
        <div className="mx-auto w-full max-w-[1100px] px-8 py-20">

            {/* ── header ──────────────────────────────────────────────────────── */}
            <div className="mb-16">
                <div className="mb-6 flex flex-wrap items-baseline gap-x-8 gap-y-3">
                    <h1 className="font-serif text-5xl font-light tracking-[0.12em] text-marble">
                        Capital
                    </h1>
                </div>
                <p className="font-sans text-[0.85rem] uppercase tracking-[0.28em] text-platinum-dim">
                    Where the world&apos;s capital has moved — decade by decade
                </p>
            </div>



            {/* ── I³ framework ────────────────────────────────────────────────── */}
            <div className="mt-24 overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b-2 border-stone-line-strong">
                            <th className="pb-4 pr-8 text-left font-mono text-[0.72rem] tracking-[0.18em] text-platinum-dim">
                                Law
                            </th>
                            <th className="pb-4 pr-8 text-left font-mono text-[0.72rem] tracking-[0.18em] text-platinum-dim">
                                Kyros
                            </th>
                            <th className="pb-4 pr-8 text-left font-sans text-[0.85rem] uppercase tracking-[0.22em] text-platinum-dim">
                                What we&apos;re looking for
                            </th>
                            <th className="pb-4 text-left font-sans text-[0.85rem] uppercase tracking-[0.22em] text-platinum-dim">
                                Evidence
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-line">
                        {I3_ROWS.map(({ law, kyros, question, evidence }) => (
                            <tr
                                key={law}
                                className="group transition-colors duration-300 ease-mechanical hover:bg-charcoal"
                            >
                                <td className="py-5 pr-8 align-top font-mono text-[0.72rem] tracking-[0.14em] text-bronze">
                                    {law}
                                </td>
                                <td className="py-5 pr-8 align-top font-serif text-base font-light leading-snug tracking-[0.04em] text-marble">
                                    {kyros}
                                </td>
                                <td className="py-5 pr-8 align-top font-sans text-[0.72rem] leading-relaxed tracking-[0.06em] text-platinum">
                                    {question}
                                </td>
                                <td className="py-5 align-top font-mono text-[0.68rem] leading-relaxed tracking-[0.06em] text-platinum-dim">
                                    {evidence}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Inversion Questions ──────────────────────────────────────────── */}
            <div className="mt-24 overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b-2 border-stone-line-strong">
                            <th className="pb-4 pr-8 text-left font-sans text-[0.85rem] uppercase tracking-[0.22em] text-platinum-dim">
                                Dimension
                            </th>
                            <th className="pb-4 pr-8 text-left font-sans text-[0.85rem] uppercase tracking-[0.22em] text-platinum-dim">
                                Question
                            </th>
                            <th className="pb-4 text-left font-sans text-[0.85rem] uppercase tracking-[0.22em] text-platinum-dim">
                                Examples
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-line">
                        {INVERSION_ROWS.map(({ dimension, question, examples }) => (
                            <tr
                                key={dimension}
                                className="group transition-colors duration-300 ease-mechanical hover:bg-charcoal"
                            >
                                <td className="py-5 pr-8 align-top font-serif text-base font-light leading-snug tracking-[0.04em] text-marble">
                                    {dimension}
                                </td>
                                <td className="py-5 pr-8 align-top font-sans text-[0.72rem] leading-relaxed tracking-[0.06em] text-platinum">
                                    {question}
                                </td>
                                <td className="py-5 align-top font-mono text-[0.68rem] leading-relaxed tracking-[0.06em] text-platinum-dim">
                                    {examples}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>





        </div>
    );
}

// ─── Decade overview ─────────────────────────────────────────────────────────

const DECADE_OVERVIEW = [
    { decade: '1950', label: 'European reconstruction' },
    { decade: '1960', label: 'European monetary normalization' },
    { decade: '1970', label: 'Gold depeg' },
    { decade: '1980', label: 'Volcker + China opens' },
    { decade: '1990', label: 'Communist system collapses + China accelerates reforms' },
    { decade: '2000', label: 'China WTO + Euro' },
    { decade: '2010', label: 'GFC + QE/ZIRP' },
    { decade: '2020', label: 'COVID policy shock + inflation/rate reversal' },
];

// ─── I³ data ──────────────────────────────────────────────────────────────────

const I3_ROWS = [
    {
        law: 'I¹',
        kyros: 'Inversion',
        question: 'What dominant market belief could reverse?',
        evidence: 'Narratives, positioning, consensus',
    },
    {
        law: 'I²',
        kyros: 'Incentives',
        question: 'Where is the economic/valuation pressure pulling capital?',
        evidence: 'REY, P/E, yields, CPI, rates, FX valuation, spreads',
    },
    {
        law: 'I³',
        kyros: 'Inflection',
        question: 'What has changed that makes the alternative possible now?',
        evidence: 'Technology, policy, geopolitics, regulation, institutional events',
    },
];

// ─── Inversion Questions data ─────────────────────────────────────────────────

const INVERSION_ROWS = [
    {
        dimension: 'Asset Class',
        question: 'What kind of asset wins?',
        examples: 'Stocks, bonds, commodities, real estate, cash',
    },
    {
        dimension: 'Geography',
        question: 'Where does capital win?',
        examples: 'US, Japan, Europe, EM, China',
    },
    {
        dimension: 'Sector / Theme',
        question: 'What specific economic story wins?',
        examples: 'Internet, energy, housing, financials, AI',
    },
];
