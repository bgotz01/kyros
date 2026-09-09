import { BLOCKCHAIN_YEARS } from '@/lib/blockchain/years';

const TH = 'pb-4 pr-8 text-left font-sans text-[0.7rem] uppercase tracking-[0.22em] text-platinum-dim/70';

export default function YearTable() {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b-2 border-stone-line-strong">
                        <th className={TH}>Year</th>
                        <th className={TH}>New Paradigm / Event</th>
                        <th className={`${TH} pr-0`}>Narrative</th>
                    </tr>
                </thead>

                <tbody className="font-sans text-sm leading-relaxed">
                    {BLOCKCHAIN_YEARS.map((row) => (
                        <tr
                            key={row.year}
                            className="group border-t border-stone-line transition-colors duration-300 ease-mechanical hover:bg-charcoal"
                        >
                            <td className="w-[6rem] py-4 pr-8 align-top font-mono tracking-[0.14em] text-bronze">
                                {row.year}
                            </td>

                            <td className="w-[16rem] py-4 pr-8 align-top font-medium text-marble">
                                {row.paradigm}
                            </td>

                            <td className="py-4 align-top">
                                <span className="block text-[0.72rem] uppercase tracking-[0.16em] text-bronze-bright">
                                    {row.claim}
                                </span>
                                <span className="mt-1.5 block max-w-[62ch] text-platinum">
                                    {row.narrative}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
