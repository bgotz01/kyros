import { paradigmShiftRows, type Paradigm } from '@/lib/capital/paradigms';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * One decade's inversion, dimension by dimension, against the decade before it.
 *
 * markUnchanged — mark dimensions that did not invert with `=` and dim them,
 *                 rather than presenting every dimension as a move.
 * showDecades   — print the `prev → current` decade pair above the table.
 * layout        — 'centered' is a fixed-width card; 'full' fills its container.
 */
export default function ParadigmShiftTable({
    previous,
    current,
    markUnchanged = false,
    showDecades = false,
    layout = 'full',
}: {
    previous: Paradigm;
    current: Paradigm;
    markUnchanged?: boolean;
    showDecades?: boolean;
    layout?: 'centered' | 'full';
}) {
    const rows = paradigmShiftRows(previous, current);
    const centered = layout === 'centered';

    // The centred card runs tighter than the full-width block.
    const pad = centered ? { first: 'pr-4', arrow: 'pr-2' } : { first: 'pr-6', arrow: 'pr-4' };

    return (
        <div className={centered ? 'flex justify-center' : 'max-w-lg'}>
            {showDecades && (
                <div className="mb-3 flex items-center gap-3">
                    <span className="font-mono text-[0.6rem] tracking-[0.18em] text-bronze">
                        {previous.decade}
                    </span>
                    <span className="font-mono text-[0.6rem] text-platinum-dim">→</span>
                    <span className="font-mono text-[0.6rem] tracking-[0.18em] text-bronze-bright">
                        {current.decade}
                    </span>
                </div>
            )}

            <table
                className={centered ? 'border-collapse' : 'w-full border-collapse'}
                style={centered ? { tableLayout: 'fixed', width: '480px' } : undefined}
            >
                {centered && (
                    <colgroup>
                        <col style={{ width: '140px' }} />
                        <col style={{ width: '160px' }} />
                        <col style={{ width: '24px' }} />
                        <col style={{ width: '156px' }} />
                    </colgroup>
                )}

                <thead>
                    <tr className="border-b-2 border-stone-line-strong">
                        <th className={`pb-3 ${pad.first} text-left font-sans text-[0.7rem] uppercase tracking-[0.2em] text-platinum-dim`}>
                            Dimension
                        </th>
                        <th className="pb-3 pr-4 text-left font-sans text-[0.7rem] uppercase tracking-[0.2em] text-platinum-dim">
                            Previous
                        </th>
                        <th className={`pb-3 ${pad.arrow} text-center font-mono text-[0.7rem] text-platinum-dim`}>
                            {markUnchanged ? '' : '→'}
                        </th>
                        <th className="pb-3 text-left font-sans text-[0.7rem] uppercase tracking-[0.2em] text-platinum-dim">
                            New
                        </th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-stone-line">
                    {rows.map(({ dimension, prev, next }) => {
                        // Without markUnchanged every dimension reads as a move.
                        const inverted = markUnchanged ? prev !== next : true;

                        return (
                            <tr
                                key={dimension}
                                className="group transition-colors duration-300 ease-mechanical hover:bg-charcoal"
                            >
                                <td className={`py-4 ${pad.first} align-top font-serif text-sm font-light tracking-[0.04em] text-marble`}>
                                    {dimension}
                                </td>
                                <td className="py-4 pr-4 align-top font-sans text-[0.72rem] leading-relaxed tracking-[0.06em] text-platinum-dim">
                                    {prev}
                                </td>
                                <td className={`py-4 ${pad.arrow} text-center align-top font-mono text-[0.72rem] text-platinum-dim`}>
                                    {inverted ? '→' : '='}
                                </td>
                                <td className={`py-4 align-top font-sans text-[0.72rem] leading-relaxed tracking-[0.06em] ${inverted ? 'font-medium text-bronze-bright' : 'text-platinum-dim'}`}>
                                    {next}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
