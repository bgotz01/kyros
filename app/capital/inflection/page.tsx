export default function InflectionPage() {
    return (
        <div className="mx-auto w-full max-w-[1100px] px-8 py-20">

            {/* ── header ──────────────────────────────────────────────────────── */}
            <div className="mb-16">
                <div className="mb-6 flex flex-wrap items-baseline gap-x-8 gap-y-3">
                    <h1 className="font-serif text-5xl font-light tracking-[0.12em] text-marble">
                        Inflection Points
                    </h1>
                </div>
                <p className="font-sans text-[0.85rem] uppercase tracking-[0.28em] text-platinum-dim">
                    The events that broke one paradigm and opened the next
                </p>
            </div>

            {/* ── narrative layout ─────────────────────────────────────────────── */}
            <div className="mb-24 flex flex-col">
                {INFLECTION_DECADES.map(({ decade, events }, idx) => (
                    <div key={decade} className={idx !== 0 ? 'border-t border-stone-line pt-16 mt-0 pb-16' : 'pb-16'}>
                        {/* decade label */}
                        <p className="mb-6 font-mono text-[0.72rem] tracking-[0.18em] text-bronze">
                            {decade}
                        </p>

                        {/* events */}
                        <div className="flex flex-col gap-8">
                            {events.map((event, i) => (
                                <div key={i} className="flex flex-col gap-2">
                                    {/* event title */}
                                    <p className="font-sans text-[0.72rem] uppercase tracking-[0.18em] text-platinum-dim">
                                        <span className="text-platinum-dim">Event</span>
                                        <span className="mx-2 text-stone-line-strong">·</span>
                                        <span className="text-marble">{event.title}</span>
                                    </p>

                                    {/* consequence chain */}
                                    <div className="flex flex-col gap-1 pl-4">
                                        {event.chain.map((line, j) => (
                                            <div key={j} className="flex items-baseline gap-3">
                                                <span className="shrink-0 font-mono text-[0.68rem] tracking-[0.08em] text-bronze-bright">
                                                    →
                                                </span>
                                                <span
                                                    className={[
                                                        'font-sans text-[0.78rem] leading-relaxed tracking-[0.04em]',
                                                        j === event.chain.length - 1
                                                            ? 'text-bronze-bright'
                                                            : 'text-platinum',
                                                    ].join(' ')}
                                                >
                                                    {line}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── table ───────────────────────────────────────────────────────── */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b-2 border-stone-line-strong">
                            <th className="pb-4 pr-8 text-left font-sans text-[0.85rem] uppercase tracking-[0.22em] text-platinum-dim">
                                Paradigm
                            </th>
                            <th className="pb-4 pr-8 text-left font-sans text-[0.85rem] uppercase tracking-[0.22em] text-platinum-dim">
                                Window
                            </th>
                            <th className="pb-4 pr-8 text-left font-sans text-[0.85rem] uppercase tracking-[0.22em] text-platinum-dim">
                                Major Event
                            </th>
                            <th className="pb-4 text-left font-sans text-[0.85rem] uppercase tracking-[0.22em] text-platinum-dim">
                                Why it matters
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-line">
                        {INFLECTION_ROWS.map(({ paradigm, window, event, why }) => (
                            <tr
                                key={paradigm}
                                className="group transition-colors duration-300 ease-mechanical hover:bg-charcoal"
                            >
                                <td className="py-5 pr-8 align-top font-mono text-[0.72rem] tracking-[0.14em] text-bronze">
                                    {paradigm}
                                </td>
                                <td className="py-5 pr-8 align-top font-mono text-[0.68rem] tracking-[0.1em] text-platinum-dim">
                                    {window}
                                </td>
                                <td className="py-5 pr-8 align-top font-serif text-base font-light leading-snug tracking-[0.04em] text-marble">
                                    {event}
                                </td>
                                <td className="py-5 align-top font-sans text-[0.72rem] leading-relaxed tracking-[0.06em] text-platinum">
                                    {why}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Narrative data ───────────────────────────────────────────────────────────

const INFLECTION_DECADES = [
    {
        decade: '1950',
        events: [
            {
                title: '1945–48 — WWII ends / Marshall Plan',
                chain: [
                    'war-damaged infrastructure and industrial capacity require massive rebuilding',
                    'capital flows into reconstruction as European production and economic activity recover',
                    'Europe becomes the dominant geography for capital',
                ],
            },
        ],
    },
    {
        decade: '1960',
        events: [
            {
                title: '1958–61 — Western currency convertibility',
                chain: [
                    'the postwar system moves from reconstruction and controlled payments toward a functioning international market',
                    'trade, payments and cross-border corporate expansion become substantially easier',
                    'US multinational / consumer growth becomes an increasingly powerful investment paradigm',
                ],
            },
        ],
    },
    {
        decade: '1970',
        events: [
            {
                title: '1971 — Dollar-gold convertibility ends',
                chain: [
                    'Bretton Woods monetary anchor breaks',
                    'monetary instability, dollar weakness, and inflation increase the appeal of scarce assets',
                    'Commodities become the dominant asset class',
                ],
            },
        ],
    },
    {
        decade: '1980',
        events: [
            {
                title: '1979–82 — Volcker shock',
                chain: [
                    'Federal Reserve decisively attacks inflation',
                    'inflation expectations break and the disinflationary regime begins',
                    'Stocks become the dominant asset class',
                ],
            },
            {
                title: '1978 — China begins Reform and Opening',
                chain: [
                    'China begins moving away from the Maoist command economy',
                    'foreign investment, private incentives, trade, and industrialization become possible',
                    'China emerges as a major future destination for capital',
                ],
            },
        ],
    },
    {
        decade: '1990',
        events: [
            {
                title: '1989–91 — Communist bloc collapses',
                chain: [
                    'US geopolitical/economic system becomes globally dominant',
                    'market capitalism + globalization expand',
                    'United States becomes the dominant geography for capital',
                ],
            },
            {
                title: '1989–91 — World Wide Web created',
                chain: [
                    'the Internet gains a simple system for publishing, linking, and accessing information',
                    'a new global commercial and information infrastructure becomes possible',
                    'Technology / Internet emerges as a new investment paradigm',
                ],
            },
        ],
    },
    {
        decade: '2000',
        events: [
            {
                title: '2001 — China joins WTO',
                chain: [
                    'China integrates deeply into the global trading system',
                    'manufacturing, infrastructure investment, exports, and commodity demand accelerate',
                    'Emerging markets and commodities become dominant capital destinations',
                ],
            },
        ],
    },
    {
        decade: '2010',
        events: [
            {
                title: '2008–09 — Global Financial Crisis + QE',
                chain: [
                    'financial system breaks and central banks adopt extraordinary monetary easing',
                    'rates and discount rates collapse while liquidity expands',
                    'US equities become the dominant destination for capital',
                ],
            },
        ],
    },
    {
        decade: '2020',
        events: [
            {
                title: '2020 — COVID pandemic + policy response',
                chain: [
                    'governments and central banks deploy extraordinary fiscal and monetary stimulus',
                    'inflation returns and the ultra-low-rate regime eventually breaks',
                    'The 2010s capital paradigm begins to reverse',
                ],
            },
        ],
    },
];

// ─── Table data ───────────────────────────────────────────────────────────────

const INFLECTION_ROWS = [
    {
        paradigm: '1950s',
        window: '1945–52',
        event: 'End of WWII / Marshall Plan',
        why: 'Opens the European reconstruction cycle',
    },
    {
        paradigm: '1960s',
        window: '1957–62',
        event: 'European Common Market / convertibility restored',
        why: 'Deepens trade and capital integration during postwar expansion',
    },
    {
        paradigm: '1970s',
        window: '1968–73',
        event: '1971 Gold Depeg',
        why: 'Breaks Bretton Woods and the monetary anchor of the prior era',
    },
    {
        paradigm: '1980s',
        window: '1978–82',
        event: 'Volcker Shock',
        why: 'Breaks the inflationary regime and lays foundation for disinflation',
    },
    {
        paradigm: '1990s',
        window: '1988–92',
        event: 'Fall of Berlin Wall / Soviet collapse',
        why: 'Ends Cold War division and opens enormous parts of the world economy',
    },
    {
        paradigm: '2000s',
        window: '1998–02',
        event: 'China joins WTO',
        why: "Integrates China's enormous labor/manufacturing base into global trade",
    },
    {
        paradigm: '2010s',
        window: '2008–12',
        event: 'GFC → QE / zero rates',
        why: 'Creates the post-crisis monetary regime',
    },
    {
        paradigm: '2020s',
        window: '2018–22',
        event: 'COVID + fiscal/monetary response',
        why: 'Breaks the low-inflation regime and changes fiscal/monetary behavior',
    },
];
