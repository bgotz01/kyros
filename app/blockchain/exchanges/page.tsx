// ─── data ─────────────────────────────────────────────────────────────────────

const EXCHANGES = [
    {
        era: '2010–13',
        exchange: 'Mt. Gox',
        geography: 'Japan',
        bottleneck: 'P2P — no liquid marketplace',
        inversion: 'Centralized BTC/fiat exchange',
    },
    {
        era: '2012–16',
        exchange: 'Bitfinex',
        geography: 'Hong Kong / offshore',
        bottleneck: 'Spot — limited trading functionality',
        inversion: 'Margin trading + P2P lending',
    },
    {
        era: '2013–16',
        exchange: 'Coinbase',
        geography: 'United States',
        bottleneck: 'Offshore exchanges — inaccessible / untrusted for US retail',
        inversion: 'Regulated US fiat gateway',
    },
    {
        era: '2017–20',
        exchange: 'Binance',
        geography: 'Global / offshore',
        bottleneck: 'Limited listings — explosion of ICO tokens',
        inversion: 'Low-fee, multi-token exchange',
    },
    {
        era: '2019–22',
        exchange: 'FTX',
        geography: 'Hong Kong → Bahamas',
        bottleneck: 'Spot-first — limited derivatives',
        inversion: 'Derivatives-first exchange',
    },
    {
        era: '2023–',
        exchange: 'Hyperliquid',
        geography: 'On-chain',
        bottleneck: 'CEX — custody + counterparty risk',
        inversion: 'On-chain order book + perpetuals',
    },
] as const;

const TH = 'pb-4 pr-8 text-left font-sans text-[0.85rem] uppercase tracking-[0.22em] text-platinum-dim';

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ExchangesPage() {
    return (
        <div className="mx-auto w-full max-w-[1200px] px-8 py-20">

            {/* header */}
            <div className="mb-16">
                <div className="mb-6 flex flex-wrap items-baseline gap-x-8 gap-y-3">
                    <h1 className="font-serif text-5xl font-light tracking-[0.12em] text-marble">
                        Exchanges
                    </h1>
                </div>
                <p className="font-sans text-[0.85rem] uppercase tracking-[0.28em] text-platinum-dim">
                    Six exchanges · six inversions · one market built bottom-up
                </p>
            </div>

            {/* table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b-2 border-stone-line-strong">
                            <th className={TH}>Era</th>
                            <th className={TH}>Exchange</th>
                            <th className={TH}>Geography</th>
                            <th className={TH}>Bottleneck</th>
                            <th className={`${TH} pr-0`}>Inversion</th>
                        </tr>
                    </thead>

                    <tbody className="font-sans text-sm leading-relaxed">
                        {EXCHANGES.map((row) => (
                            <tr
                                key={row.era}
                                className="group border-t border-stone-line transition-colors duration-300 ease-mechanical hover:bg-charcoal"
                            >
                                {/* Era */}
                                <td className="w-[7rem] py-6 pr-8 align-top font-mono text-[0.75rem] tracking-[0.14em] text-bronze">
                                    {row.era}
                                </td>

                                {/* Exchange */}
                                <td className="w-[10rem] py-6 pr-8 align-top font-serif text-[1.05rem] font-light tracking-[0.04em] text-marble">
                                    {row.exchange}
                                </td>

                                {/* Geography */}
                                <td className="w-[13rem] py-6 pr-8 align-top font-sans text-[0.75rem] leading-relaxed tracking-[0.04em] text-platinum-dim">
                                    {row.geography}
                                </td>

                                {/* Bottleneck */}
                                <td className="min-w-[18rem] py-6 pr-8 align-top font-sans text-[0.75rem] leading-relaxed tracking-[0.04em] text-platinum">
                                    {row.bottleneck}
                                </td>

                                {/* Inversion */}
                                <td className="min-w-[16rem] py-6 align-top font-sans text-[0.75rem] leading-relaxed tracking-[0.06em] text-bronze-bright">
                                    {row.inversion}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
