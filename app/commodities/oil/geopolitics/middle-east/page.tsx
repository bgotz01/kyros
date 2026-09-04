import Link from 'next/link';
import EventTimeline from '../../../components/EventTimeline';
import MiddleEastTable from '../../../components/MiddleEastTable';
import { MIDDLE_EAST } from '@/lib/commodities/middleEast';
import { MIDDLE_EAST_TIMELINE } from '@/lib/commodities/middleEastTimeline';

export default function MiddleEastPage() {
    return (
        <div className="mx-auto w-full max-w-[1100px] px-8 py-20">

            {/* ── header ──────────────────────────────────────────────────────── */}
            <header className="mb-20">
                <Link
                    href="/commodities/oil"
                    className="group mb-8 inline-flex items-baseline gap-3 font-sans text-[0.62rem] uppercase tracking-[0.22em] text-platinum-dim transition-colors duration-300 ease-mechanical hover:text-bronze-bright"
                >
                    <span
                        aria-hidden
                        className="font-mono text-bronze-dim transition-transform duration-300 ease-mechanical group-hover:-translate-x-1"
                    >
                        ←
                    </span>
                    Oil
                </Link>

                <h1 className="mb-6 font-serif text-5xl font-light tracking-[0.12em] text-marble">
                    Middle East
                </h1>
                <p className="font-sans text-[0.85rem] uppercase tracking-[0.28em] text-platinum-dim">
                    The region the oil paradigm keeps inverting through
                </p>
            </header>

            {/* ── the record ──────────────────────────────────────────────────── */}
            <EventTimeline
                title="Middle East Timeline"
                span="1901 — Present"
                description="The geopolitical and oil developments that reshaped control, pricing power and capital across the region, in fifty-year cycles. Select one to read it alone."
                events={MIDDLE_EAST_TIMELINE}
            />

            {/* ── the reading ─────────────────────────────────────────────────── */}
            <section className="mt-28 border-t border-stone-line pt-16">
                <p className="font-sans text-[0.72rem] uppercase tracking-[0.22em] text-bronze">
                    I³
                </p>
                <h2 className="mt-3 font-serif text-3xl font-light tracking-[0.06em] text-marble">
                    Decade Paradigms
                </h2>
                <p className="mb-10 mt-3 max-w-xl font-sans text-[0.85rem] leading-relaxed text-platinum-dim">
                    The same century read as inversions — who held influence, the
                    inflection that opened each decade, the incentive that spread
                    it, and the assumption it flipped.
                </p>

                <MiddleEastTable
                    rows={MIDDLE_EAST}
                    timeline={MIDDLE_EAST_TIMELINE}
                />
            </section>

        </div>
    );
}
