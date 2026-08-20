import { PARADIGMS } from '@/lib/capital/paradigms';

// ─── Shared header cell style ─────────────────────────────────────────────────

const TH = 'pb-4 pr-8 text-left font-sans text-[0.85rem] uppercase tracking-[0.22em] text-platinum-dim';

// ─── Component ────────────────────────────────────────────────────────────────

export default function ParadigmTable() {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b-2 border-stone-line-strong">
                        <th className={TH}>Decade</th>
                        <th className={TH}>Capital Center</th>
                        <th className={TH}>Narrative</th>
                        <th className={TH}>Expression</th>
                        <th className={`${TH} pr-0`}>Benchmark</th>
                    </tr>
                </thead>

                <tbody className="font-sans text-sm leading-relaxed">
                    {PARADIGMS.map((row) => (
                        <tr
                            key={row.decade}
                            className="group border-t border-stone-line transition-colors duration-300 ease-mechanical hover:bg-charcoal"
                        >
                            {/* Decade */}
                            <td className="py-5 pr-8 align-top tracking-[0.14em] text-bronze">
                                {row.decade}
                            </td>

                            {/* Capital center */}
                            <td className="py-5 pr-8 align-top text-platinum">
                                {row.capitalCenter}
                            </td>

                            {/* Narrative + mechanism */}
                            <td className="py-5 pr-8 align-top">
                                <span className="block font-medium text-marble">
                                    {row.narrative}
                                </span>
                                <span className="mt-1 block text-[0.72rem] uppercase tracking-[0.16em] text-bronze-bright">
                                    {row.mechanism}
                                </span>
                            </td>

                            {/* Investment expression */}
                            <td className="py-5 pr-8 align-top text-platinum">
                                {row.expression}
                            </td>

                            {/* Benchmark */}
                            <td className="py-5 align-top text-platinum-dim">
                                {row.benchmark ?? '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
