import { BLOCKCHAIN_CYCLES } from '@/lib/blockchain/cycles';

const TH = 'pb-4 pr-8 text-left font-sans text-[0.85rem] uppercase tracking-[0.22em] text-platinum-dim';

export default function CycleTable() {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b-2 border-stone-line-strong">
                        <th className={TH}>Cycle</th>
                        <th className={TH}>Paradigm</th>
                        <th className={TH}>Dominant Architecture</th>
                        <th className={TH}>Narrative</th>
                        <th className={`${TH} pr-0`}>Representative Projects</th>
                    </tr>
                </thead>

                <tbody className="font-sans text-sm leading-relaxed">
                    {BLOCKCHAIN_CYCLES.map((row) => (
                        <tr
                            key={row.cycle}
                            className="group border-t border-stone-line transition-colors duration-300 ease-mechanical hover:bg-charcoal"
                        >
                            {/* Cycle */}
                            <td className="w-[8rem] py-6 pr-8 align-top font-mono tracking-[0.14em] text-bronze">
                                {row.cycle}
                            </td>

                            {/* Paradigm */}
                            <td className="w-[13rem] py-6 pr-8 align-top font-serif text-[1.05rem] font-light tracking-[0.04em] text-marble">
                                {row.paradigm}
                            </td>

                            {/* Dominant architecture */}
                            <td className="w-[18rem] py-6 pr-8 align-top text-[0.8rem] leading-relaxed text-platinum-dim">
                                {row.architecture}
                            </td>

                            {/* Narrative — claim, then why it mattered */}
                            <td className="min-w-[20rem] py-6 pr-8 align-top">
                                <span className="block text-[0.72rem] uppercase tracking-[0.16em] text-bronze-bright">
                                    {row.claim}
                                </span>
                                <span className="mt-1.5 block text-platinum">
                                    {row.narrative}
                                </span>
                            </td>

                            {/* Representative projects */}
                            <td className="w-[14rem] py-6 align-top">
                                <span className="block leading-[1.9] text-marble">
                                    {row.projects.join('  ·  ')}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
