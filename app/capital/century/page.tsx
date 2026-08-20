import { CENTURIES } from '@/lib/capital/centuries';
import CenturyTimeline from '../components/CenturyTimeline';

export default function CenturyPage() {
    return (
        <div className="mx-auto w-full max-w-[1100px] px-8 py-20">

            {/* ── header ──────────────────────────────────────────────────────── */}
            <div className="mb-16">
                <div className="mb-6 flex flex-wrap items-baseline gap-x-8 gap-y-3">
                    <h1 className="font-serif text-5xl font-light tracking-[0.12em] text-marble">
                        Century Overview
                    </h1>
                </div>
                <p className="font-sans text-[0.85rem] uppercase tracking-[0.28em] text-platinum-dim">
                    Dominant powers · capital centers · paradigm shifts across five centuries
                </p>
            </div>

            {/* ── capital center timeline ──────────────────────────────────────── */}
            <div className="mb-8">
                <p className="mb-8 font-sans text-[0.85rem] uppercase tracking-[0.28em] text-platinum-dim">
                    Capital Accumulation
                </p>
                <CenturyTimeline />
            </div>

            {/* ── century blocks ───────────────────────────────────────────────── */}
            <div className="flex flex-col">
                {CENTURIES.map((c, idx) => (
                    <div
                        key={c.century}
                        className={[
                            'grid grid-cols-[160px_1fr] gap-x-12 py-16',
                            idx !== 0 ? 'border-t border-stone-line' : '',
                        ].join(' ')}
                    >
                        {/* left — century label */}
                        <div className="pt-1">
                            <p className="font-mono text-[2.4rem] font-light tracking-[0.06em] text-bronze leading-none">
                                {c.century}
                            </p>
                        </div>

                        {/* right — fields */}
                        <div className="flex flex-col gap-5">
                            <Field label="Dominant power" value={c.dominantPower} />
                            <Field label="Rising challenger" value={c.risingChallenger} />
                            <Field label="Capital center" value={c.capitalCenter} />
                            <Field label="Capital paradigm" value={c.capitalParadigm} />
                            <Field label="Transition" value={c.transition} />
                            <TagField label="Major innovations" tags={c.majorInnovations} />
                            <TagField label="Events" tags={c.events} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── field components ─────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="shrink-0 font-sans text-[0.7rem] uppercase tracking-[0.24em] text-platinum-dim w-[180px]">
                {label}
            </span>
            <span className="font-sans text-[0.82rem] leading-relaxed tracking-[0.04em] text-platinum">
                {value}
            </span>
        </div>
    );
}

function TagField({ label, tags }: { label: string; tags: string[] }) {
    return (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <span className="shrink-0 font-sans text-[0.7rem] uppercase tracking-[0.24em] text-platinum-dim w-[180px]">
                {label}
            </span>
            <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                    <span
                        key={tag}
                        className="border border-stone-line px-2 py-px font-mono text-[0.62rem] tracking-[0.08em] text-platinum-dim"
                    >
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    );
}
