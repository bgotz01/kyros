import Link from 'next/link';
import DecadeTable from '../components/DecadeTable';
import EventTimeline from '../components/EventTimeline';
import { OIL_DECADES } from '@/lib/commodities/oil';
import { OIL_TIMELINE } from '@/lib/commodities/oilTimeline';

export default function OilPage() {
    return (
        <div className="mx-auto w-full max-w-[1100px] px-8 py-20">

            {/* ── header ──────────────────────────────────────────────────────── */}
            <header className="mb-20">
                <h1 className="mb-6 font-serif text-5xl font-light tracking-[0.12em] text-marble">
                    Oil
                </h1>
                <p className="font-sans text-[0.85rem] uppercase tracking-[0.28em] text-platinum-dim">
                    Every decade prices oil against the assumption the last one broke
                </p>
            </header>

            {/* ── the record ──────────────────────────────────────────────────── */}
            <EventTimeline
                title="Oil Timeline"
                span="1901 — Present"
                description="The events that changed the strategic and economic role of oil, in fifty-year cycles. Select one to read it alone."
                events={OIL_TIMELINE}
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
                    The same century read as inversions — the inflection that opened
                    each decade, the incentive that spread it, the assumption it
                    flipped.
                </p>

                <DecadeTable rows={OIL_DECADES} timeline={OIL_TIMELINE} />
            </section>

            {/* ── onward ──────────────────────────────────────────────────────── */}
            <nav className="mt-28 border-t border-stone-line pt-8">
                <p className="font-sans text-[0.62rem] uppercase tracking-[0.22em] text-platinum-dim">
                    Geopolitics
                </p>
                <Link
                    href="/commodities/oil/geopolitics/middle-east"
                    className="group mt-4 flex items-baseline gap-4"
                >
                    <span className="font-serif text-2xl font-light tracking-[0.04em] text-marble transition-colors duration-300 ease-mechanical group-hover:text-bronze-bright">
                        Middle East
                    </span>
                    <span
                        aria-hidden
                        className="font-mono text-[0.8rem] text-bronze-dim transition-transform duration-300 ease-mechanical group-hover:translate-x-1"
                    >
                        →
                    </span>
                </Link>
            </nav>

        </div>
    );
}
