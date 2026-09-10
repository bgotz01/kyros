import { redirect } from 'next/navigation';
import { allWeeks } from '@/lib/engine/data';
import { monthHref, weekEnd } from '@/lib/engine/routes';

// ─── /engine/ai ──────────────────────────────────────────────────────────────
// The bare path is not a page, it is a question — which month? Answered here,
// on the server, where the digests already are: the newest month holding papers
// that have been pulled. Redirecting rather than rendering means the address
// bar always names what is on screen, from the first paint.

export default function Page() {
    const weeks = allWeeks();
    const latest = [...weeks].reverse().find((w) => w.heldCount > 0) ?? weeks[weeks.length - 1];

    if (!latest) {
        return (
            <div className="flex-1 px-8 py-10">
                <p className="font-sans text-[0.7rem] leading-relaxed tracking-[0.04em] text-platinum-dim">
                    No digests found. Add a year file under papers/digests/.
                </p>
            </div>
        );
    }

    redirect(monthHref(latest.year, weekEnd(latest.heading).month));
}
