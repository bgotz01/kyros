// capital/components/AssetLeadership.tsx

import Link from "next/link";

const LABEL_W = 88;
const CELL_W = 152;

const ASSET_LEADERS = [
    {
        decade: "1950s",
        geography: "Europe",
        asset: "European Equities",
        descriptor: "Reconstruction",
        inversion: {
            geography: {
                from: "War & Destruction",
                to: "European Recovery",
            },
            asset: {
                from: "Destroyed Capacity",
                to: "Rebuilding",
            },
        },
    },
    {
        decade: "1960s",
        geography: "United States",
        asset: "American Brands",
        descriptor: "Mass Consumption",
        inversion: {
            geography: {
                from: "Europe",
                to: "United States",
            },
            asset: {
                from: "Infrastructure",
                to: "Consumer Products",
            },
        },
    },
    {
        decade: "1970s",
        geography: "Global",
        asset: "Gold & Oil",
        descriptor: "Fiat Regime",
        inversion: {
            geography: {
                from: "United States",
                to: "Resources",
            },
            asset: {
                from: "Consumer",
                to: "Commodities",
            },
        },
    },
    {
        decade: "1980s",
        geography: "Japan",
        asset: "Japanese Equities",
        descriptor: "Asset Boom",
        inversion: {
            geography: {
                from: "Resources",
                to: "Japan & US",
            },
            asset: {
                from: "Commodities",
                to: "Financial Assets",
            },
        },
    },
    {
        decade: "1990s",
        geography: "United States",
        asset: "Internet Stocks",
        descriptor: "Information Age",
        inversion: {
            geography: {
                from: "Japan",
                to: "United States",
            },
            asset: {
                from: "Physical",
                to: "Digital",
            },
        },
    },
    {
        decade: "2000s",
        geography: "International / EM",
        asset: "Commodities",
        descriptor: "Industrialisation",
        inversion: {
            geography: {
                from: "United States",
                to: "International / EM",
            },
            asset: {
                from: "Technology",
                to: "Commodities",
            },
        },
    },
    {
        decade: "2010s",
        geography: "United States",
        asset: "Platform Tech",
        descriptor: "Software Scale",
        inversion: {
            geography: {
                from: "International / EM",
                to: "United States",
            },
            asset: {
                from: "Physical",
                to: "Software",
            },
        },
    },
    {
        decade: "2020s",
        geography: "United States",
        asset: "AI",
        descriptor: "Compute Buildout",
        inversion: {
            geography: {
                from: "US Platforms",
                to: "US Compute",
            },
            asset: {
                from: "FAANG",
                to: "AI",
            },
        },
    },
];

export default function AssetLeadership() {
    return (
        <section className="w-full">
            {/* Header */}
            <div className="mb-8 text-center">
                <h2 className="font-serif text-[1.8rem] font-light tracking-[0.04em] text-marble">
                    Asset Leadership by Decade
                </h2>

                <p className="mt-2 font-sans text-[0.62rem] uppercase tracking-[0.22em] text-bronze">
                    The succession of capital leadership
                </p>
            </div>

            <div className="-mx-8 overflow-x-auto px-8 pb-2">
                <div
                    className="min-w-max"
                    style={{
                        width: LABEL_W + ASSET_LEADERS.length * CELL_W,
                    }}
                >
                    {/* ─── Leadership ─────────────────────────────── */}
                    <div className="flex">
                        <div
                            className="flex shrink-0 items-center justify-center px-2"
                            style={{ width: LABEL_W }}
                        >
                            <RowLabel>Leadership</RowLabel>
                        </div>

                        {ASSET_LEADERS.map((d) => (
                            <Link
                                key={d.decade}
                                href={`/capital/decades/${d.decade}`}
                                className="group shrink-0 border-l border-stone-line px-3 py-4 text-center"
                                style={{ width: CELL_W }}
                            >
                                <span className="block font-serif text-[1rem] font-light tracking-[0.03em] text-bronze transition-colors duration-300 group-hover:text-bronze-bright">
                                    {d.decade}
                                </span>

                                <span className="mt-3 block font-sans text-[0.52rem] uppercase tracking-[0.16em] text-platinum-dim">
                                    {d.geography}
                                </span>

                                <span className="mt-2 block min-h-[2.8rem] font-serif text-[1.08rem] font-light leading-[1.2] text-marble">
                                    {d.asset}
                                </span>

                                <span className="mt-2 block font-sans text-[0.52rem] uppercase tracking-[0.14em] text-bronze">
                                    {d.descriptor}
                                </span>
                            </Link>
                        ))}
                    </div>

                    {/* divider */}
                    <div
                        className="ml-auto border-t border-dashed border-stone-line"
                        style={{
                            width: ASSET_LEADERS.length * CELL_W,
                        }}
                    />

                    {/* ─── Inversion ──────────────────────────────── */}
                    <div className="flex">
                        <div
                            className="flex shrink-0 items-center justify-center px-2"
                            style={{ width: LABEL_W }}
                        >
                            <RowLabel>Inversion</RowLabel>
                        </div>

                        {ASSET_LEADERS.map((d) => (
                            <div
                                key={d.decade}
                                className="shrink-0 border-l border-stone-line px-3 py-4 text-center"
                                style={{ width: CELL_W }}
                            >
                                <InversionLine
                                    label="Geography"
                                    from={d.inversion.geography.from}
                                    to={d.inversion.geography.to}
                                />

                                <div className="mt-5">
                                    <InversionLine
                                        label="Asset"
                                        from={d.inversion.asset.from}
                                        to={d.inversion.asset.to}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ─── Succession line ────────────────────────── */}
                    <div
                        className="relative ml-auto h-5"
                        style={{
                            width: ASSET_LEADERS.length * CELL_W,
                        }}
                    >
                        <span className="absolute left-0 right-3 top-1/2 h-px -translate-y-1/2 bg-bronze" />

                        {ASSET_LEADERS.map((d, index) => (
                            <span
                                key={d.decade}
                                aria-hidden
                                className="absolute top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45 border border-bronze bg-obsidian"
                                style={{
                                    left: index * CELL_W,
                                }}
                            />
                        ))}

                        <span
                            aria-hidden
                            className="absolute right-0 top-1/2 -translate-y-1/2 font-serif text-base leading-none text-bronze"
                        >
                            →
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}

function RowLabel({ children }: { children: React.ReactNode }) {
    return (
        <span className="font-sans text-[0.5rem] uppercase tracking-[0.16em] text-bronze">
            {children}
        </span>
    );
}

function InversionLine({
    label,
    from,
    to,
}: {
    label: string;
    from: string;
    to: string;
}) {
    return (
        <div>
            <span className="block font-sans text-[0.46rem] uppercase tracking-[0.15em] text-platinum-dim">
                {label}
            </span>

            <div className="mt-2 flex flex-col items-center">
                <span className="font-serif text-[0.76rem] font-light leading-[1.25] text-platinum-dim">
                    {from}
                </span>

                <span
                    aria-hidden
                    className="my-1 font-mono text-[0.58rem] text-bronze"
                >
                    ↓
                </span>

                <span className="font-serif text-[0.86rem] font-light leading-[1.25] text-marble">
                    {to}
                </span>
            </div>
        </div>
    );
}