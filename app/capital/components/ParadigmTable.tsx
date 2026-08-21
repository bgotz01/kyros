import { PARADIGMS, type DecadeReturn } from '@/lib/capital/paradigms';
import HoverNote from './HoverNote';

// Beat the benchmark or lost to it — the only judgement this table makes.
const AHEAD = '#74B87A';
const BEHIND = '#C4574A';

function fmtPct(pct: number) {
    return `${pct < 0 ? '−' : '+'}${Math.abs(pct).toLocaleString('en-US')}%`;
}

/** A decade return, with estimates marked so they can't be read as measured. */
function Return({ value, color }: { value?: DecadeReturn; color?: string }) {
    if (!value) return <span className="font-mono text-[0.8rem] text-platinum-dim">—</span>;
    return (
        <span className="inline-flex items-baseline gap-1.5">
            <span
                className="font-mono text-[0.9rem] tracking-[0.04em] tabular-nums"
                style={{ color: color ?? 'var(--color-platinum)' }}
            >
                {fmtPct(value.pct)}
            </span>
            {!value.measured && (
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-bronze-dim">
                    est
                </span>
            )}
        </span>
    );
}

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
                        <th className={TH}>Rotation</th>
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

                            {/* Rotation — the asset the decade actually ran through */}
                            <td className="py-5 pr-8 align-top">
                                <HoverNote
                                    title={`${row.decade} · ${row.rotation ?? 'Rotation'}`}
                                    body={[row.rotationNote, row.rotationReturn?.basis].filter(Boolean) as string[]}
                                >
                                    <span className="block text-platinum">
                                        {row.rotation ?? '—'}
                                    </span>
                                    <span className="mt-1.5 block">
                                        <Return
                                            value={row.rotationReturn}
                                            color={
                                                row.rotationReturn && row.benchmarkReturn
                                                    ? row.rotationReturn.pct >= row.benchmarkReturn.pct ? AHEAD : BEHIND
                                                    : undefined
                                            }
                                        />
                                    </span>
                                </HoverNote>
                            </td>

                            {/* Benchmark — what the broad market paid over the same decade */}
                            <td className="py-5 align-top">
                                <span className="block text-platinum-dim">Dow Jones</span>
                                <span className="mt-1.5 block">
                                    <Return value={row.benchmarkReturn} />
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
