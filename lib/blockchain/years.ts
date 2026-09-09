// ─── years.ts ─────────────────────────────────────────────────────────────────
// Blockchain evolution, one paradigm or event per year.
//
// paradigm  — what arrived that year
// claim     — the assumption it established, in a few words
// narrative — why that claim mattered
// ─────────────────────────────────────────────────────────────────────────────

export interface BlockchainYear {
    year: number;
    paradigm: string;
    claim: string;
    narrative: string;
}

export const BLOCKCHAIN_YEARS: BlockchainYear[] = [
    {
        year: 2008,
        paradigm: 'Federal Reserve / QE',
        claim: 'Monetary expansion',
        narrative:
            'Crisis response shifts toward extraordinary central-bank intervention',
    },
    {
        year: 2009,
        paradigm: 'Bitcoin',
        claim: 'Fixed supply + proof of work',
        narrative:
            'Money and consensus governed by software rather than a central authority',
    },
    {
        year: 2010,
        paradigm: 'Mt. Gox',
        claim: 'Centralized crypto exchange',
        narrative:
            'Crypto gets a liquid marketplace and price-discovery infrastructure',
    },
    {
        year: 2011,
        paradigm: 'Litecoin',
        claim: 'Faster, lighter Bitcoin',
        narrative:
            'Copy the architecture and optimize it for cheaper, faster transactions',
    },
    {
        year: 2012,
        paradigm: 'XRP',
        claim: 'Faster settlement',
        narrative: 'Distributed payments without Bitcoin-style proof of work',
    },
    {
        year: 2013,
        paradigm: 'Bitcoin boom',
        claim: 'Crypto becomes an asset class',
        narrative:
            'Bitcoin moves from technical experiment toward speculation and investment',
    },
    {
        year: 2014,
        paradigm: 'Mt. Gox collapse',
        claim: 'Centralized custody risk',
        narrative:
            'Decentralized assets remain vulnerable when held by centralized intermediaries',
    },
    {
        year: 2015,
        paradigm: 'Ethereum + Tether',
        claim: 'Programmability + stable money',
        narrative:
            'Smart contracts expand blockchain beyond payments while dollars begin moving on-chain',
    },
    {
        year: 2016,
        paradigm: 'The DAO',
        claim: 'On-chain organizations',
        narrative:
            'Smart contracts can coordinate capital and governance; the hack exposes the risks of “code is law”',
    },
    {
        year: 2017,
        paradigm: 'ICOs + Binance',
        claim: 'Crypto-native capital markets',
        narrative:
            'Tokens fund projects directly while Binance creates a global marketplace for the explosion of new assets',
    },
    {
        year: 2018,
        paradigm: 'SEC enforcement + EOS',
        claim: 'Tokens meet securities law',
        narrative:
            'Token issuance is reclassified as a securities offering while EOS ships the largest raise ever as a 21-producer chain',
    },
    {
        year: 2019,
        paradigm: 'Libra',
        claim: 'Corporate global money',
        narrative:
            'A platform proposes to issue currency for billions of users; states respond with their own digital currency programs',
    },
    {
        year: 2020,
        paradigm: 'DeFi + MicroStrategy',
        claim: 'Programmable markets + treasury asset',
        narrative:
            'Lending and market-making become open code while corporates begin holding Bitcoin on the balance sheet',
    },
    {
        year: 2021,
        paradigm: 'NFTs',
        claim: 'Programmable ownership',
        narrative:
            'Scarcity and provenance extend from money to culture, media and identity',
    },
    {
        year: 2022,
        paradigm: 'FTX collapse + the Merge',
        claim: 'Custody fails, consensus holds',
        narrative:
            'The largest intermediary failure coincides with Ethereum switching to proof of stake without incident',
    },
    {
        year: 2023,
        paradigm: 'BlackRock ETF filing',
        claim: 'Institutional legitimization',
        narrative:
            'The largest asset manager files to wrap Bitcoin for regulated portfolios',
    },
    {
        year: 2024,
        paradigm: 'Spot ETFs + tokenization',
        claim: 'Crypto enters traditional portfolios',
        narrative:
            'Bitcoin arrives as a portfolio allocation while treasuries and funds are issued on-chain',
    },
    {
        year: 2025,
        paradigm: 'Strategic reserve + stablecoin law',
        claim: 'State adoption',
        narrative:
            'The state holds the asset in reserve and legislates dollar tokens as payment infrastructure',
    },
];
