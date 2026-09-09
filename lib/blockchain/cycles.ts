// ─── cycles.ts ────────────────────────────────────────────────────────────────
// The four-year view. Where years.ts records what happened, this records what
// each cycle was for — the paradigm the annual developments were adding up to.
//
// Each boundary falls immediately after a halving (Nov 2012, Jul 2016, May
// 2020, Apr 2024), so every cycle opens on a post-halving year.
//
// paradigm     — the name of the cycle
// architecture — the dominant technical form it took
// claim        — what the cycle was trying to do, in a few words
// narrative    — why that claim mattered
// projects     — what represents the cycle
// ─────────────────────────────────────────────────────────────────────────────

export interface BlockchainCycle {
    cycle: string;
    startYear: number;
    endYear: number;
    paradigm: string;
    architecture: string;
    claim: string;
    narrative: string;
    projects: string[];
}

export const BLOCKCHAIN_CYCLES: BlockchainCycle[] = [
    {
        cycle: '2009–2012',
        startYear: 2009,
        endYear: 2012,
        paradigm: 'Digital Commodities',
        architecture:
            'PoW, native coins, fixed/predictable supply, standalone chains, centralized exchanges',
        claim: 'Create digital money',
        narrative:
            'Establish digitally scarce monetary networks independent of states',
        projects: ['Bitcoin', 'Mt. Gox', 'Litecoin', 'XRP'],
    },
    {
        cycle: '2013–2016',
        startYear: 2013,
        endYear: 2016,
        paradigm: 'Programmable Assets',
        architecture: 'Smart contracts, tokens, stablecoins, early DAOs',
        claim: 'Program money and assets',
        narrative:
            'Blockchain expands from currency into programmable ownership and applications',
        projects: ['Ethereum', 'Tether', 'The DAO'],
    },
    {
        cycle: '2017–2020',
        startYear: 2017,
        endYear: 2020,
        paradigm: 'Crypto Finance',
        architecture:
            'ICOs, exchanges, ERC-20s, stablecoins, DEXs, lending, AMMs',
        claim: 'Build financial markets on-chain',
        narrative:
            'Issuance, trading, lending and liquidity become crypto-native',
        projects: ['Binance / BNB', 'Chainlink', 'MakerDAO', 'Uniswap', 'Compound', 'Aave'],
    },
    {
        cycle: '2021–2024',
        startYear: 2021,
        endYear: 2024,
        paradigm: 'Multi-chain Economies',
        architecture:
            'Alternative L1s, L2s, PoS, DeFi, NFTs, memecoin launchpads',
        claim: 'Scale and specialize',
        narrative:
            'Competing chains and L2s become ecosystems for finance, ownership and speculation — cheap blockspace makes permissionless token launches the dominant on-chain activity',
        projects: [
            'Solana',
            'Arbitrum',
            'Optimism',
            'OpenSea',
            'pump.fun',
            'BONK / WIF',
        ],
    },
    {
        cycle: '2025–2028',
        startYear: 2025,
        endYear: 2028,
        paradigm: 'On-chain Finance',
        architecture:
            'High-performance trading, stablecoins, tokenized financial infrastructure',
        claim: 'Move finance on-chain',
        narrative:
            'Blockchain increasingly becomes infrastructure for trading, payments and capital markets',
        projects: ['Hyperliquid', 'Circle'],
    },
];
