// app/ai/apps

import {
    APPLICATIONS,
    APPS_REVIEWED,
    CHATBOTS,
    OPEN_SOURCE,
    PLATFORMS,
    type AppEntry,
} from '@/lib/aiApps';

// ─── table ────────────────────────────────────────────────────────────────────

function Row({ entry, first, tagged }: { entry: AppEntry; first: boolean; tagged: boolean }) {
    return (
        <div
            className={`grid gap-1 px-5 py-4 md:items-baseline md:gap-6 ${
                tagged ? 'md:grid-cols-[6rem_14rem_1fr]' : 'md:grid-cols-[16rem_1fr]'
            } ${first ? '' : 'border-t border-stone-line'}`}
        >
            {tagged && (
                <p className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-bronze">
                    {entry.tag}
                </p>
            )}

            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                {entry.links.map(({ label, url }, i) => (
                    <span key={url} className="flex items-baseline gap-2">
                        {i > 0 && (
                            <span aria-hidden className="font-mono text-[0.58rem] text-stone-line-strong">
                                ·
                            </span>
                        )}
                        <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-marble underline decoration-stone-line underline-offset-4 transition-colors duration-300 ease-mechanical hover:text-bronze-bright hover:decoration-bronze"
                        >
                            {label}
                        </a>
                    </span>
                ))}
                <span className="font-mono text-[0.58rem] tracking-[0.12em] text-stone-line-strong">
                    {entry.year}
                </span>
            </div>

            <div>
                <p className="font-sans text-[0.75rem] leading-6 tracking-[0.025em] text-platinum-dim">
                    {entry.note}
                </p>
                <p className="mt-1 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-stone-line-strong">
                    {entry.maker}
                </p>
            </div>
        </div>
    );
}

function Section({
    index,
    label,
    claim,
    entries,
    tagged = false,
}: {
    index: number;
    label: string;
    claim: string;
    entries: AppEntry[];
    tagged?: boolean;
}) {
    return (
        <section className="border-b border-stone-line px-6 py-10 md:px-10 md:py-12 xl:px-14">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.24em] text-bronze">
                    {String(index).padStart(2, '0')} · {label}
                </p>
                <p className="font-serif text-lg font-light tracking-[0.06em] text-marble">
                    {claim}
                </p>
            </div>

            <div className="mt-6 border border-stone-line bg-obsidian/25">
                {entries.map((entry, i) => (
                    <Row key={entry.links[0].url} entry={entry} first={i === 0} tagged={tagged} />
                ))}
            </div>
        </section>
    );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export const metadata = {
    title: 'Applications · Kyros',
    description: 'The AI application layer — what people actually use.',
};

export default function AIAppsPage() {
    return (
        <div className="min-h-[calc(100svh-4rem-1px)]">

            <header className="border-b border-stone-line px-6 py-5 md:px-10 xl:px-14">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="font-mono text-[0.6rem] uppercase tracking-[0.24em] text-bronze">
                            AI · Apps
                        </p>
                        <h1 className="mt-2 font-serif text-2xl font-light tracking-[0.16em] text-marble md:text-3xl">
                            THE APPLICATION LAYER
                        </h1>
                    </div>
                    <p className="max-w-sm font-sans text-[0.72rem] leading-6 tracking-[0.04em] text-platinum-dim md:text-right">
                        Capability is upstream. Diffusion happens here.
                    </p>
                </div>
            </header>

            <main>
                <Section
                    index={1}
                    label="Assistants"
                    claim="One text box became the general interface"
                    entries={CHATBOTS}
                />

                <Section
                    index={2}
                    label="Platforms"
                    claim="Where models are found, compared and served"
                    entries={PLATFORMS}
                />

                <Section
                    index={3}
                    label="Open source"
                    claim="The half of the stack no lab controls"
                    entries={OPEN_SOURCE}
                />

                <Section
                    index={4}
                    label="Applications"
                    claim="Built on top, sold into a domain"
                    entries={APPLICATIONS}
                    tagged
                />

                <section className="px-6 py-8 md:px-10 xl:px-14">
                    <p className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-stone-line-strong">
                        Snapshot · {APPS_REVIEWED} · years are first public release
                    </p>
                </section>
            </main>
        </div>
    );
}
