import type { OilDecade } from '@/lib/commodities/oil';
import { eventsInDecade, type TimelineEvent } from '@/lib/commodities/timeline';
import TimelineLinks from './TimelineLinks';

// ─── Shared styles ────────────────────────────────────────────────────────────

const TH =
    'pb-4 pr-8 text-left font-sans text-[0.85rem] uppercase tracking-[0.22em] text-platinum-dim';

const CELL =
    'py-5 pr-8 align-top font-sans text-[0.9rem] leading-relaxed tracking-[0.04em]';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * A decade read through I³ — who held influence, the inflection that opened it,
 * the incentive that spread it, and the assumption it inverted.
 *
 * All data columns share the same font family and size. Color provides the
 * hierarchy between decade, influence, inflection, incentive, and inversion.
 *
 * Renders an "awaiting data" line when `rows` is empty so a drill-down can ship
 * its route before its narrative is written.
 */
export default function DecadeTable({
    rows,
    timeline = [],
}: {
    rows: OilDecade[];
    /** Timeline the rows link up into. Omit to render the table alone. */
    timeline?: TimelineEvent[];
}) {
    if (rows.length === 0) {
        return (
            <p className="border-t border-stone-line py-8 font-sans text-[0.9rem] uppercase tracking-[0.22em] text-platinum-dim">
                Awaiting data
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b-2 border-stone-line-strong">
                        <th className={TH}>Decade</th>
                        <th className={TH}>Influence</th>
                        <th className={TH}>Inflection</th>
                        <th className={TH}>Incentive</th>
                        <th className={`${TH} pr-0`}>Inversion</th>
                    </tr>
                </thead>

                <tbody>
                    {rows.map((row) => (
                        <tr
                            key={row.decade}
                            className="group border-t border-stone-line transition-colors duration-300 ease-mechanical hover:bg-charcoal"
                        >
                            {/* Decade */}
                            <td className={`${CELL} text-bronze`}>
                                {row.decade}
                            </td>

                            {/* Influence */}
                            <td className={`${CELL} text-marble-dim`}>
                                {row.influence}
                            </td>

                            {/* Inflection — with jump links to the same
                                events on the timeline above */}
                            <td className={`${CELL} text-marble`}>
                                {row.inflection}
                                <TimelineLinks
                                    nodes={eventsInDecade(timeline, row.decade)}
                                />
                            </td>

                            {/* Incentive */}
                            <td className={`${CELL} text-platinum`}>
                                {row.incentive}
                            </td>

                            {/* Inversion */}
                            <td className="py-5 align-top font-sans text-[0.9rem] leading-relaxed tracking-[0.04em]">
                                <span className="block text-platinum-dim">
                                    {row.inversion.from}
                                </span>

                                <span
                                    aria-hidden
                                    className="mt-1 block text-center text-[0.9rem] text-bronze-dim"
                                >
                                    ↓
                                </span>

                                <span className="mt-1 block text-bronze-bright">
                                    {row.inversion.to}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}