import { FamilyTabs, PanelHeader, type MetricOption } from './Controls';
import type { MetricFamilyDef, MetricFamilyKey } from '@/lib/capital/marketIndexes';

// ─── ChartCard ─────────────────────────────────────────────────────────────────
// The bordered container shared by the equities and currencies sections.
// It owns the shell (border + background) and the metric-tab header inside it;
// the actual chart panel is passed as children.
//
// Two header modes:
//   • "families" — IndexChart: three family tabs (Level / Return / Vol) plus an
//     optional SubPicker row rendered by the caller and passed as `subPicker`.
//   • "metrics"  — FxChart: flat list of metric tabs, identical to the old API.

type FamiliesMode = {
    families: readonly MetricFamilyDef[];
    activeFamily: MetricFamilyKey;
    activeColor: string;
    onSelectFamily: (key: MetricFamilyKey) => void;
    /** SubPicker node rendered inline after the family tabs (may be null). */
    subPicker?: React.ReactNode;
    // metrics-mode props must be absent
    metrics?: never;
    activeKey?: never;
    onSelect?: never;
};

type MetricsMode = {
    metrics: readonly MetricOption[];
    activeKey: string;
    onSelect: (key: string) => void;
    activeColor?: string;
    // families-mode props must be absent
    families?: never;
    activeFamily?: never;
    onSelectFamily?: never;
    subPicker?: never;
};

type Props = (FamiliesMode | MetricsMode) & {
    subject: string;
    range: string;
    children: React.ReactNode;
};

export default function ChartCard(props: Props) {
    const { subject, range, children } = props;
    const isFamilies = 'families' in props && props.families;

    return (
        <div className="w-full border border-stone-line-strong bg-charcoal">
            {/* ── header row 1: subject · range + tabs ────────────────────── */}
            <div className={`flex flex-wrap items-center justify-between gap-y-3 border-stone-line-strong px-4 pt-3 pb-3 ${isFamilies && props.subPicker ? '' : 'border-b'}`}>
                {/* left: subject · range */}
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-platinum">
                    <span className="text-bronze">{subject}</span>
                    {'  ·  '}
                    {range}
                </p>

                {/* right: family tabs or flat metric tabs */}
                <div className="ml-auto flex flex-wrap items-center gap-2">
                    {isFamilies ? (
                        <FamilyTabs
                            families={props.families!}
                            activeFamily={props.activeFamily!}
                            activeColor={props.activeColor!}
                            onSelect={props.onSelectFamily!}
                        />
                    ) : (
                        <div className="flex flex-wrap border border-stone-line-strong">
                            {(props as MetricsMode).metrics.map((m, i) => {
                                const on = (props as MetricsMode).activeKey === m.key;
                                const ac = (props as MetricsMode).activeColor;
                                return (
                                    <button
                                        key={m.key}
                                        type="button"
                                        onClick={() => (props as MetricsMode).onSelect(m.key)}
                                        title={m.description}
                                        aria-pressed={on}
                                        className={`
                                            px-3.5 py-2 font-sans text-[0.63rem] uppercase tracking-[0.16em]
                                            transition-colors duration-500 ease-mechanical
                                            ${i > 0 ? 'border-l border-stone-line-strong' : ''}
                                            ${on
                                                ? ac ? '' : 'bg-bronze/15 text-bronze-bright'
                                                : 'text-platinum hover:bg-obsidian/50 hover:text-marble'}
                                        `}
                                        style={on && ac ? {
                                            backgroundColor: `${ac}26`,
                                            color: ac,
                                        } : undefined}
                                    >
                                        {m.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── header row 2: sub-picker (only when chips are present) ───── */}
            {isFamilies && props.subPicker && (
                <div className="flex items-center justify-end border-b border-stone-line-strong px-4 py-2">
                    {props.subPicker}
                </div>
            )}

            {children}
        </div>
    );
}
